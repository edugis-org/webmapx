// src/components/webmapx-mega-compare.ts
import { css, html } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { WebmapxBaseTool } from './webmapx-base-tool';
import type { IMapState, MapLayerStateEntry } from '../store/IMapState';
import type { IMap } from '../map/IMapInterfaces';
import { syncCamera } from '../utils/compare-replay';
import {
  createMegaCompareMirror,
  syncLayerSettings,
  syncProjectionAndTerrain,
  type MegaCompareMirror,
} from '../utils/mega-compare-mirror';

const DEFAULT_SPLIT = 50;
const KEY_STEP = 2;

/** Same reasoning as the compare tool's own handle: a fingertip cannot aim at a couple of
 *  pixels, so the grab strip is wider than the seam itself on a touch-capable pointer. */
const HANDLE_HIT_TOUCH = 44;
const HANDLE_HIT_MOUSE = 16;

/**
 * A full-height vertical seam, styled and coloured like `webmapx-mega-slider` (same track
 * colour, same 60px drag circle) rather than the original compare tool's red seam and small
 * grip chip — this is kiosk furniture from the same family, not a variant of that tool.
 *
 * Unlike the compare tool, there is no start/stop step and nothing is ever frozen: left of the
 * seam always shows the current topmost *unhidden* legend layer, right of it always shows
 * whatever is directly beneath it — both computed fresh on every store change, so toggling a
 * layer, reordering the legend, or opening the catalog and adding one retargets the comparison
 * immediately rather than leaving it pointed at a stale pair.
 *
 * Getting that "always current" behaviour on all four engines still needs a second map
 * instance, for the same reason the original compare tool needs one: per-layer clipping only
 * exists in OpenLayers/Leaflet, so MapLibre/Cesium have no way to show one layer stack on the
 * left and a different one on the right of a single canvas. The live map stays completely
 * normal and full-bleed (it is what every other tool acts on); a mirror map
 * (`mega-compare-mirror.ts`) renders the same stack with only the current top layer forced
 * hidden, and is clipped with `clip-path` to the right of the seam — where it shows through,
 * the layer under the top one is revealed; where it doesn't, the live map's own top layer shows
 * through underneath.
 *
 * The mirror is rebuilt (destroyed and recreated) only when the *set* of layer ids changes —
 * a layer added via the catalog or removed from the legend — since that is the one case a
 * lightweight sync can't handle. Visibility, opacity, paint, order, projection, terrain and
 * camera all follow the live map continuously without a rebuild.
 *
 * DOM stacking is order, not z-index (same rule as everywhere else in this codebase): the
 * mirror map, the handle and the layout are all plain siblings under `<webmapx-map>`, so
 * whichever was inserted last paints on top. The handle is (re-)inserted immediately after
 * every mirror rebuild for exactly this reason — a rebuilt mirror is a *new* element appended
 * fresh, and left alone it would land after (so on top of) an already-existing handle, covering
 * whatever part of the handle overlapped the mirror's clipped, visible region.
 */
@customElement('webmapx-mega-compare')
export class WebmapxMegaCompare extends WebmapxBaseTool {
  @state() private active = false;
  @state() private topLabel = '';
  @state() private secondLabel = '';

  private mirror: MegaCompareMirror | null = null;
  private knownLayerIds: Set<string> = new Set();
  private topId: string | null = null;
  private rebuildInFlight = false;
  private split = DEFAULT_SPLIT;

  private handleEl: HTMLElement | null = null;
  private cameraUnsubscribe: (() => void) | null = null;
  private dragPointerId: number | null = null;

  // Nothing is rendered through Lit's own shadow DOM: the seam and the mirror map have to sit
  // in the *light* DOM, as direct children of `<webmapx-map>`, spanning its full size — the
  // same reason the original compare tool builds its handle with raw DOM calls instead of
  // through its (separate) panel template.
  static styles = css`
    :host { display: none; }
  `;

  protected onStateChanged(state: IMapState): void {
    void this.evaluate(state);
  }

  protected onMapAttached(adapter: IMap): void {
    this.attachCameraSync(adapter);
  }

  protected onMapDetached(): void {
    this.teardown();
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    this.teardown();
  }

  protected render() {
    return html``;
  }

  private attachCameraSync(adapter: IMap): void {
    const onViewChange = (): void => {
      if (this.mirror) syncCamera(adapter, this.mirror.adapter);
    };
    adapter.events.on('view-change', onViewChange);
    adapter.events.on('view-change-end', onViewChange);
    this.cameraUnsubscribe = () => {
      adapter.events.off('view-change', onViewChange);
      adapter.events.off('view-change-end', onViewChange);
    };
  }

  private async evaluate(state: IMapState): Promise<void> {
    const adapter = this.adapter;
    const mapHost = this.mapHost;
    if (!adapter || !mapHost) return;

    const mapLayers = state.mapLayers ?? {};
    const { topId, secondId } = computeTopTwo(mapLayers);
    this.topId = topId;

    if (!topId || !secondId) {
      this.teardownOverlay();
      this.active = false;
      return;
    }

    const currentIds = new Set(Object.keys(mapLayers));
    const layerSetChanged = !setsEqual(currentIds, this.knownLayerIds);

    if (!this.mirror || layerSetChanged) {
      if (this.rebuildInFlight) return;
      this.rebuildInFlight = true;
      this.knownLayerIds = currentIds;
      try {
        await this.rebuildMirror(mapHost, adapter);
      } finally {
        this.rebuildInFlight = false;
      }
      if (!this.mirror) return;
    }

    syncLayerSettings(adapter, this.mirror.adapter, topId);
    syncProjectionAndTerrain(adapter, this.mirror.adapter);
    syncCamera(adapter, this.mirror.adapter);

    this.topLabel = labelFor(topId, mapLayers);
    this.secondLabel = labelFor(secondId, mapLayers);
    this.ensureHandle(mapHost);
    this.updateLabelText();
    this.active = true;
  }

  private async rebuildMirror(mapHost: NonNullable<WebmapxMegaCompare['mapHost']>, adapter: IMap): Promise<void> {
    this.mirror?.destroy();
    this.mirror = null;
    this.mirror = await createMegaCompareMirror(mapHost, adapter);
    if (!this.mirror) return;
    this.applyClip();
    // The new mirror element was just appended fresh, right before `<webmapx-layout>` — which,
    // if the handle already exists, leaves the handle *before* (so under) the mirror. Bump the
    // handle back to immediately before layout so it keeps painting on top. See the class
    // comment: stacking here is DOM order, not z-index.
    if (this.handleEl) {
      mapHost.insertBefore(this.handleEl, mapHost.querySelector(':scope > webmapx-layout'));
    }
  }

  private teardownOverlay(): void {
    this.mirror?.destroy();
    this.mirror = null;
    this.handleEl?.remove();
    this.handleEl = null;
    this.knownLayerIds = new Set();
  }

  private teardown(): void {
    this.cameraUnsubscribe?.();
    this.cameraUnsubscribe = null;
    this.teardownOverlay();
  }

  private applyClip(): void {
    const el = this.mirror?.element;
    if (!el) return;
    // Clips away the left `split`%, leaving the mirror (top layer forced hidden, so the layer
    // beneath it shows) visible only to the right of the seam.
    el.style.clipPath = `inset(0 0 0 ${this.split}%)`;
  }

  private ensureHandle(mapHost: NonNullable<WebmapxMegaCompare['mapHost']>): void {
    if (this.handleEl) {
      this.positionHandle();
      return;
    }

    const handle = document.createElement('div');
    handle.className = 'webmapx-mega-compare-handle';
    handle.setAttribute('role', 'separator');
    handle.setAttribute('tabindex', '0');
    handle.setAttribute('aria-orientation', 'vertical');
    handle.setAttribute('aria-label', 'Compare split position');
    handle.setAttribute('aria-valuemin', '0');
    handle.setAttribute('aria-valuemax', '100');

    const coarse = window.matchMedia?.('(any-pointer: coarse)').matches ?? false;
    const hit = coarse ? HANDLE_HIT_TOUCH : HANDLE_HIT_MOUSE;
    handle.style.cssText = [
      'position:absolute', 'top:0', 'bottom:0', `width:${hit}px`,
      'transform:translateX(-50%)', 'background:transparent',
      'cursor:ew-resize', 'touch-action:none',
    ].join(';');

    handle.appendChild(this.seamLine());
    handle.appendChild(this.labelChip('start'));
    handle.appendChild(this.thumb());
    handle.appendChild(this.labelChip('end'));

    handle.addEventListener('pointerdown', this.onPointerDown);
    handle.addEventListener('pointermove', this.onPointerMove);
    handle.addEventListener('pointerup', this.onPointerUp);
    handle.addEventListener('pointercancel', this.onPointerUp);
    handle.addEventListener('keydown', this.onHandleKeyDown);

    // Before the layout, after the mirror map (inserted earlier in `createMegaCompareMirror`),
    // and with no z-index of its own — order decides. The layout's zones are
    // `pointer-events: none` except where a control sits, so the handle stays draggable
    // everywhere else.
    mapHost.insertBefore(handle, mapHost.querySelector(':scope > webmapx-layout'));
    this.handleEl = handle;
    this.positionHandle();
  }

  /** The visible seam: a few pixels down the middle of the grab strip — thicker than the
   *  original compare tool's 2px line, and in the mega-slider's track colour rather than the
   *  compare tool's red, so the two read as different families of control. */
  private seamLine(): HTMLElement {
    const line = document.createElement('div');
    line.style.cssText = [
      'position:absolute', 'top:0', 'bottom:0', 'left:50%',
      `width:var(--webmapx-mega-compare-seam-width, 6px)`,
      'transform:translateX(-50%)', 'pointer-events:none',
      'background:var(--sl-color-primary-600, var(--color-primary, #2b6c8f))',
    ].join(';');
    return line;
  }

  /**
   * The drag circle: same size, border and colour as the mega-slider's thumb, so the two
   * controls read as one visual family. Sits low on the seam rather than centred — clear of
   * the middle of the map, near where a mega-slider bar's own thumb would sit if the two
   * controls were used together.
   */
  private thumb(): HTMLElement {
    const size = 'var(--webmapx-mega-compare-thumb-size, 60px)';
    const thumb = document.createElement('div');
    thumb.className = 'webmapx-mega-compare-thumb';
    thumb.style.cssText = [
      'position:absolute', 'left:50%',
      `bottom:var(--webmapx-mega-compare-handle-bottom, 100px)`,
      `width:${size}`, `height:${size}`,
      'transform:translate(-50%, 50%)', 'border-radius:50%',
      'border:4px solid var(--color-background, #fff)',
      'background-color:var(--sl-color-primary-700, var(--color-primary, #2b6c8f))',
      'box-shadow:0 2px 8px rgb(0 0 0 / 0.35)',
      'display:flex', 'align-items:center', 'justify-content:center',
      'color:var(--color-background, #fff)',
      'pointer-events:none', 'user-select:none',
    ].join(';');
    // An SVG rather than the "↔" glyph: a font's arrow character carries its own metrics
    // (ascent/descent, side bearings) that rarely put its *visual* centre on the box centre
    // flex-centring aims for — measured a few pixels high and left of true centre here. The
    // SVG's viewBox has no such bias, so flex-centring it lands exactly in the middle.
    //
    // The viewBox itself is wider than tall (32x20, not a square) so the arrow reads as a
    // flatter, wider double-headed arrow rather than a compact glyph — only `height` is given a
    // size, and `width:auto` lets the browser derive the (wider) width from the viewBox's own
    // aspect ratio, so the two stay in proportion however the height var is overridden.
    thumb.innerHTML = '<svg viewBox="0 0 32 20" fill="none" stroke="currentColor" stroke-width="2.5" '
      + 'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'
      + '<line x1="4" y1="10" x2="28" y2="10"/>'
      + '<polyline points="10 3 4 10 10 17"/>'
      + '<polyline points="22 3 28 10 22 17"/>'
      + '</svg>';
    const icon = thumb.querySelector('svg') as SVGElement;
    icon.style.cssText = 'width:auto;'
      + 'height:var(--webmapx-mega-compare-thumb-icon-size, 26px);'
      + 'display:block;';
    return thumb;
  }

  private labelChip(which: 'start' | 'end'): HTMLElement {
    const label = document.createElement('span');
    label.dataset.megaCompareLabel = which;
    const side = which === 'start' ? `right:calc(50% + 44px)` : `left:calc(50% + 44px)`;
    label.style.cssText = [
      'position:absolute', `bottom:var(--webmapx-mega-compare-handle-bottom, 100px)`,
      'transform:translateY(50%)', side, 'white-space:nowrap',
      'padding:4px 10px', 'border-radius:var(--webmapx-radius-sm, 4px)',
      'background:var(--color-surface, #fff)',
      'font-size:var(--webmapx-font-size-md, 0.875rem)', 'font-weight:600',
      'color:var(--color-text-primary, #16202a)', 'pointer-events:none',
    ].join(';');
    return label;
  }

  private updateLabelText(): void {
    const start = this.handleEl?.querySelector('[data-mega-compare-label="start"]');
    const end = this.handleEl?.querySelector('[data-mega-compare-label="end"]');
    if (start) start.textContent = this.topLabel;
    if (end) end.textContent = this.secondLabel;
  }

  private positionHandle(): void {
    if (!this.handleEl) return;
    this.handleEl.style.left = `${this.split}%`;
    this.handleEl.setAttribute('aria-valuenow', String(Math.round(this.split)));
  }

  private setSplit(value: number): void {
    this.split = clampSplit(value);
    this.applyClip();
    this.positionHandle();
  }

  private splitFromClientX(clientX: number): number {
    const host = this.mapHost;
    if (!host) return this.split;
    const rect = host.getBoundingClientRect();
    if (rect.width === 0) return this.split;
    return ((clientX - rect.left) / rect.width) * 100;
  }

  private onPointerDown = (event: PointerEvent): void => {
    this.dragPointerId = event.pointerId;
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
    event.preventDefault();
    event.stopPropagation();
  };

  private onPointerMove = (event: PointerEvent): void => {
    if (this.dragPointerId !== event.pointerId) return;
    this.setSplit(this.splitFromClientX(event.clientX));
  };

  private onPointerUp = (event: PointerEvent): void => {
    if (this.dragPointerId !== event.pointerId) return;
    (event.currentTarget as HTMLElement).releasePointerCapture(event.pointerId);
    this.dragPointerId = null;
  };

  private onHandleKeyDown = (event: KeyboardEvent): void => {
    const moves: Record<string, number> = {
      ArrowLeft: this.split - KEY_STEP,
      ArrowRight: this.split + KEY_STEP,
      Home: 0,
      End: 100,
    };
    const next = moves[event.key];
    if (next === undefined) return;
    event.preventDefault();
    this.setSplit(next);
  };
}

function clampSplit(value: number): number {
  if (!Number.isFinite(value)) return DEFAULT_SPLIT;
  return Math.min(100, Math.max(0, value));
}

function setsEqual(a: Set<string>, b: Set<string>): boolean {
  if (a.size !== b.size) return false;
  for (const id of a) if (!b.has(id)) return false;
  return true;
}

/**
 * Unlike `webmapx-mega-slider`'s own eligibility rule, a background layer (the base map) is
 * deliberately *not* excluded here: it sits at the bottom of the stack, so it naturally becomes
 * the "second" layer whenever there is exactly one overlay above it, and comparing an overlay
 * against the base map underneath it is a legitimate — and common — thing to swipe between. Only
 * `hideFromLegend` (never shown to the user at all) is excluded, plus mega-compare's own
 * addition: a layer the user has toggled off doesn't count as one of the "top two" either —
 * "always compare the top two *unhidden* layers".
 */
function computeTopTwo(mapLayers: Record<string, MapLayerStateEntry>): { topId: string | null; secondId: string | null } {
  const orderedIds = [...Object.keys(mapLayers)].reverse();
  const isEligible = (id: string): boolean => {
    const meta = mapLayers[id] as MapLayerStateEntry | undefined;
    return meta?.hideFromLegend !== true && meta?.visible !== false;
  };
  const eligible = orderedIds.filter(isEligible);
  return { topId: eligible[0] ?? null, secondId: eligible[1] ?? null };
}

function labelFor(layerId: string | null, mapLayers: Record<string, MapLayerStateEntry>): string {
  if (!layerId) return '';
  const label = mapLayers[layerId]?.label;
  return typeof label === 'string' && label.length > 0 ? label : layerId;
}

declare global {
  interface HTMLElementTagNameMap {
    'webmapx-mega-compare': WebmapxMegaCompare;
  }
}
