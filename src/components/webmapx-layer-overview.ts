import { css, html } from 'lit';
import { customElement, property, state, query } from 'lit/decorators.js';
import { WebmapxBaseTool } from './webmapx-base-tool';
import type { IMapState } from '../store/IMapState';
import type { IMap } from '../map/IMapInterfaces';
import type { LayerAddEvent, LayerRemoveEvent } from '../store/map-events';
import './webmapx-layer-legend';
import './webmapx-layer-info-dialog';
import './webmapx-save-layers-dialog';
import type { WebmapxLayerInfoDialog } from './webmapx-layer-info-dialog';
import type { WebmapxSaveLayersDialog, SaveLayerCandidate } from './webmapx-save-layers-dialog';
import '@shoelace-style/shoelace/dist/components/icon/icon.js';
import '@shoelace-style/shoelace/dist/components/icon-button/icon-button.js';
import '@shoelace-style/shoelace/dist/components/button/button.js';

/** Computes [west, south, east, north] from a GeoJSON FeatureCollection's coordinates. */
function geojsonExtent(geojson: GeoJSON.FeatureCollection): [number, number, number, number] | null {
  let west = Infinity, south = Infinity, east = -Infinity, north = -Infinity;

  const visit = (coords: any): void => {
    if (typeof coords[0] === 'number') {
      const [lng, lat] = coords as [number, number];
      if (lng < west) west = lng;
      if (lng > east) east = lng;
      if (lat < south) south = lat;
      if (lat > north) north = lat;
    } else if (Array.isArray(coords)) {
      for (const c of coords) visit(c);
    }
  };

  for (const feature of geojson.features ?? []) {
    const geometry = feature.geometry as { coordinates?: unknown } | undefined;
    if (geometry?.coordinates) visit(geometry.coordinates);
  }

  if (!Number.isFinite(west)) return null;

  // Clamp to web-mercator-safe latitudes: fitBounds with +/-90 (e.g. polygons touching
  // the poles, like Antarctica) produces an undefined mercator Y, and maplibre's
  // fitBounds then silently jumps to a degenerate camera position near (0, 0) instead
  // of erroring. Clamp longitude to a valid range too.
  const MAX_LAT = 85.05112878;
  return [
    Math.max(-180, west),
    Math.max(-MAX_LAT, south),
    Math.min(180, east),
    Math.min(MAX_LAT, north),
  ];
}

/** Returns the union of two extents, or whichever one is non-null. */
function unionExtent(
  a: [number, number, number, number] | null,
  b: [number, number, number, number] | null,
): [number, number, number, number] | null {
  if (!a) return b;
  if (!b) return a;
  return [Math.min(a[0], b[0]), Math.min(a[1], b[1]), Math.max(a[2], b[2]), Math.max(a[3], b[3])];
}

/** Collects the source ids a layer's extent depends on: its own `sourceId`,
 *  or — for composite layers — the unique `source` of each sublayer.
 *
 *  Each entry is itself a list of candidate ids for that one source: composite
 *  (`type: 'style'`) sublayer sources are registered in the maplibre adapter under
 *  `${layerId}:${source}` (a globally-unique key), not the bare source key written
 *  in the config — so both forms are tried. */
/** Summarizes a GeoJSON FeatureCollection as e.g. "42 features (Polygon: 40, Point: 2)". */
/** Recursively counts coordinate tuples in a geometry (incl. GeometryCollection). */
function countVertices(geometry: GeoJSON.Geometry | null | undefined): number {
  if (!geometry) return 0;
  switch (geometry.type) {
    case 'GeometryCollection':
      return geometry.geometries.reduce((sum, g) => sum + countVertices(g), 0);
    case 'Point':
      return 1;
    case 'MultiPoint':
    case 'LineString':
      return geometry.coordinates.length;
    case 'MultiLineString':
    case 'Polygon':
      return geometry.coordinates.reduce((sum, ring) => sum + ring.length, 0);
    case 'MultiPolygon':
      return geometry.coordinates.reduce((sum, poly) => sum + poly.reduce((s, ring) => s + ring.length, 0), 0);
    default:
      return 0;
  }
}

function summarizeGeoJSON(data: GeoJSON.FeatureCollection): string {
  const counts = new Map<string, number>();
  let vertices = 0;
  for (const f of data.features ?? []) {
    const type = f.geometry?.type ?? 'unknown';
    counts.set(type, (counts.get(type) ?? 0) + 1);
    vertices += countVertices(f.geometry);
  }
  const total = data.features?.length ?? 0;
  const types = [...counts.entries()].map(([type, n]) => `${type}: ${n}`).join(', ');
  const summary = types && counts.size > 1
    ? `${total} features (${types})`
    : `${total} feature${total === 1 ? '' : 's'}${types ? ` (${[...counts.keys()][0]})` : ''}`;
  return `${summary}, ${vertices} ${vertices === 1 ? 'vertex' : 'vertices'}`;
}

function getLayerSourceRefs(layerId: string, metadata: Record<string, unknown> | undefined): string[][] {
  if (Array.isArray(metadata?.sublayers) && metadata.sublayers.length > 0) {
    const keys = new Set<string>();
    for (const sub of metadata.sublayers as Record<string, unknown>[]) {
      if (typeof sub.source === 'string') keys.add(sub.source);
    }
    return [...keys].map((key) => [`${layerId}:${key}`, key]);
  }
  if (typeof metadata?.sourceId === 'string') return [[metadata.sourceId]];
  return [];
}

export interface LayerPanelItem {
  layerId: string;
  label: string;
  topLevelGroup: string | null;
  visible: boolean;
  hasExtent: boolean;
  outOfZoom: boolean;
}

@customElement('webmapx-layer-overview')
export class WebmapxLayerOverview extends WebmapxBaseTool {
  @property({ type: String, attribute: 'background-group-label' })
  backgroundGroupLabel = 'Base Maps';

  @property({ type: String, attribute: 'background-title' })
  backgroundTitle = 'Base map';

  @property({ type: String, attribute: 'overview-title' })
  overviewTitle = 'Active layers';

  @state() private backgroundLayers: LayerPanelItem[] = [];
  @state() private overviewLayers: LayerPanelItem[] = [];
  @state() private hiddenLayerIds: Set<string> = new Set();
  @state() private collapsedLayerIds: Set<string> = new Set();
  @state() private layerTransparency: Map<string, number> = new Map();
  @state() private transparencyValueVisible: Set<string> = new Set();
  @state() private dropTargetLayerId: string | null = null;
  @state() private dropTargetPosition: 'above' | 'below' | null = null;
  private transparencyHideTimers: Map<string, number> = new Map();
  // Lazily-computed and cached extents — geojsonExtent() walks every coordinate, so it's
  // only run when the user clicks "zoom to layer", and per-source so composite layers
  // sharing a source don't recompute it for each sublayer.
  private sourceExtentCache: Map<string, [number, number, number, number] | null> = new Map();
  private layerExtentCache: Map<string, [number, number, number, number] | null> = new Map();
  @query('webmapx-layer-info-dialog') private infoDialog!: WebmapxLayerInfoDialog;
  @query('webmapx-save-layers-dialog') private saveLayersDialog!: WebmapxSaveLayersDialog;
  private unsubscribeLayerAdd: (() => void) | null = null;
  private unsubscribeLayerRemove: (() => void) | null = null;

  // Visual-only drag tracking — vertical-only translateY clamped to the
  // surrounding .layer-list, mirroring EduGIS's pointer-track behavior.
  // No reordering is performed yet; the row snaps back on release.
  private dragState: {
    card: HTMLElement;
    layerId: string;
    startClientY: number;
    minTranslate: number;
    maxTranslate: number;
    scroller: HTMLElement | null;
    startScrollTop: number;
    cardTop: number;
    cardBottom: number;
    siblings: { layerId: string; top: number; bottom: number }[];
  } | null = null;

  // Auto-scroll the .panel while dragging near its top/bottom edge —
  // mirrors EduGIS's recursive setTimeout-based _scrollUp/_scrollDown.
  private autoScrollState: { panel: HTMLElement; direction: 'up' | 'down'; timer: number } | null = null;
  private static readonly AUTO_SCROLL_EDGE_PX = 32;
  private static readonly AUTO_SCROLL_STEP_PX = 8;
  private static readonly AUTO_SCROLL_INTERVAL_MS = 20;

  static styles = css`
    :host {
      display: block;
      box-sizing: border-box;
      background: var(--webmapx-legend-bg, var(--color-background, #ffffff));
      color: var(--webmapx-legend-color, var(--color-text-primary, #1f2937));
    }

    .panel {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      max-height: min(32rem, 100%);
      overflow-y: auto;
      padding: 0.5rem;
      box-sizing: border-box;
    }

    .section {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .section-title {
      margin: 0;
      font-size: 0.95rem;
      font-weight: 700;
      color: var(--webmapx-legend-title-color, var(--color-primary, #0f62fe));
    }

    .layer-list {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .drop-indicator {
      height: 2px;
      margin: -1px 0;
      background: var(--color-text-primary, #1f2937);
      border-radius: 1px;
      pointer-events: none;
    }

    .layer-card.dragging {
      position: relative;
      z-index: 2;
      opacity: 0.75;
      box-shadow: 0 6px 16px rgba(15, 23, 42, 0.2);
      cursor: grabbing;
    }

    .layer-card {
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 0.35rem;
      padding: 0.35rem 0.625rem;
      border: 1px solid var(--color-border, #d7dce3);
      border-radius: 0.75rem;
      background: var(--color-background, #ffffff);
      box-shadow: 0 1px 3px rgba(15, 23, 42, 0.08);
      box-sizing: border-box;
    }

    .layer-row {
      display: flex;
      align-items: center;
      gap: 0.25rem;
      width: 100%;
    }

    /* Visual cue only — sits centered over the title, revealed on hover/focus */
    /* Reordering must stay within .layer-list, vertical-only (matches EduGIS):
       implement via pointer-based drag that translateY's the row, clamped to
       the list's bounding box and ignoring horizontal pointer movement —
       not native HTML5 DnD, whose drag image floats freely with the cursor. */
    .drag-handle {
      /* Prevent the browser's default touch-scroll/pan from hijacking the
         gesture and cancelling pointer capture mid-drag on touch devices. */
      touch-action: none;
      position: absolute;
      top: 0.1rem;
      left: 50%;
      transform: translateX(-50%);
      font-size: 0.8rem;
      color: var(--color-text-secondary, #9aa3af);
      line-height: 1;
      opacity: 0;
      transition: opacity 0.1s ease-in-out;
      pointer-events: none;
    }

    .layer-card:hover .drag-handle,
    .layer-card:focus-within .drag-handle {
      opacity: 1;
      pointer-events: auto;
      cursor: grab;
    }

    /* Suppress :hover-revealed handle right after a drop — the dragged card
       has snapped away from under the cursor, leaving it resting over a
       different card that is genuinely hovered but wasn't intentionally so. */
    .drag-handle.suppress-hover {
      opacity: 0 !important;
      pointer-events: none !important;
    }

    .layer-card:active .drag-handle {
      cursor: grabbing;
    }

    .visibility-toggle::part(base),
    .collapse-toggle::part(base),
    .layer-details-actions sl-icon-button::part(base) {
      font-size: 0.95rem;
      padding: 0;
    }

    .layer-legend-wrap {
      width: 100%;
    }

    .layer-label {
      flex: 1 1 auto;
      min-width: 0;
      font-size: 0.95rem;
      line-height: 1.3;
      cursor: default;
      white-space: normal;
      word-break: break-word;
    }

    .layer-label.out-of-zoom {
      color: var(--sl-color-neutral-500);
      opacity: 0.6;
    }

    .layer-details {
      display: grid;
      grid-template-rows: 1fr;
      width: 100%;
      padding-left: 1.5rem;
      box-sizing: border-box;
      transition: grid-template-rows 0.16s ease-in-out;
    }

    .layer-details.collapsed {
      grid-template-rows: 0fr;
    }

    .layer-details-inner {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
      overflow: hidden;
      min-height: 0;
    }

    .layer-details-actions {
      display: flex;
      align-items: center;
      justify-content: space-between;
      width: 100%;
    }

    .delete-layer::part(base) {
      color: var(--sl-color-danger-600, #dc2626);
    }

    .opacity-row {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.8rem;
      color: var(--color-text-secondary, #6b7280);
    }

    .opacity-row sl-icon {
      flex: 0 0 auto;
    }

    .opacity-row input[type="range"] {
      flex: 1 1 auto;
      -webkit-appearance: none;
      appearance: none;
      height: 3px;
      background: var(--sl-color-neutral-300);
      border-radius: 2px;
      outline: none;
    }

    .opacity-row input[type="range"]::-webkit-slider-thumb {
      -webkit-appearance: none;
      appearance: none;
      width: 12px;
      height: 12px;
      border-radius: 50%;
      background: var(--sl-color-neutral-500);
      cursor: pointer;
    }

    .opacity-row input[type="range"]::-moz-range-thumb {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      border: none;
      background: var(--sl-color-neutral-500);
      cursor: pointer;
    }

    .opacity-row input[type="range"]::-moz-range-track {
      height: 3px;
      background: var(--sl-color-neutral-300);
      border-radius: 2px;
    }

    .opacity-value {
      flex: 0 0 auto;
      min-width: 2.6em;
      text-align: right;
      font-variant-numeric: tabular-nums;
    }

    .save-layers-row {
      display: flex;
      justify-content: flex-end;
    }

    .layer-meta {
      font-size: 0.75rem;
      color: var(--color-text-secondary, #6b7280);
      white-space: nowrap;
      margin-left: 0.75rem;
    }

    .empty {
      padding: 0.875rem;
      border: 1px dashed var(--color-border, #d7dce3);
      border-radius: 0.75rem;
      color: var(--color-text-secondary, #6b7280);
      font-size: 0.875rem;
      background: var(--color-background-secondary, #f8fafc);
    }
  `;

  protected onStateChanged(state: IMapState): void {
    this.applyVisibleLayers(state);
  }

  protected onMapAttached(adapter: IMap): void {
    this.unsubscribeLayerAdd = adapter.events.on('layer-add', (event: LayerAddEvent) => {
      void event;
      this.applyVisibleLayers(adapter.store.getState());
    });
    this.unsubscribeLayerRemove = adapter.events.on('layer-remove', (event: LayerRemoveEvent) => {
      void event;
      this.applyVisibleLayers(adapter.store.getState());
    });
    this.applyVisibleLayers(adapter.store.getState());
  }

  protected onMapDetached(): void {
    this.unsubscribeLayerAdd?.();
    this.unsubscribeLayerRemove?.();
    this.unsubscribeLayerAdd = null;
    this.unsubscribeLayerRemove = null;
    this.transparencyHideTimers.forEach((timer) => window.clearTimeout(timer));
    this.transparencyHideTimers.clear();
    this.transparencyValueVisible = new Set();
  }

  render() {
    return html`
      <div class="panel">
        ${this.renderSection(this.overviewTitle, this.overviewLayers, 'No active layers.', true)}
        ${this.renderSection(this.backgroundTitle, this.backgroundLayers, 'No base map selected.')}
      </div>
      <webmapx-layer-info-dialog></webmapx-layer-info-dialog>
      <webmapx-save-layers-dialog></webmapx-save-layers-dialog>
    `;
  }

  private renderSection(title: string, items: LayerPanelItem[], emptyText: string, isOverviewSection = false) {
    return html`
      <section class="section">
        <h3 class="section-title">${title}</h3>
        ${items.length > 0
          ? html`
              <div class="layer-list">
                ${items.map((item) => html`
                  ${this.dropTargetLayerId === item.layerId && this.dropTargetPosition === 'above'
                    ? html`<div class="drop-indicator"></div>`
                    : null}
                  <div class="layer-card" data-layer-id=${item.layerId}>
                    ${items.length > 1
                      ? html`<span
                          class="drag-handle"
                          title="Drag to reorder"
                          @pointerdown=${(e: PointerEvent) => this.onDragHandlePointerDown(e)}
                          @pointermove=${(e: PointerEvent) => this.onDragHandlePointerMove(e)}
                          @pointerup=${(e: PointerEvent) => this.onDragHandlePointerUp(e)}
                          @pointercancel=${(e: PointerEvent) => this.onDragHandlePointerUp(e)}
                        ><sl-icon name="grip-horizontal"></sl-icon></span>`
                      : null}
                    <div class="layer-row">
                      <sl-icon-button
                        class="visibility-toggle"
                        name=${item.visible ? 'eye' : 'eye-slash'}
                        label=${item.visible ? 'Hide layer' : 'Show layer'}
                        @click=${() => this.handleVisibilityToggle(item.layerId)}
                      ></sl-icon-button>
                      <span class="layer-label ${item.outOfZoom ? 'out-of-zoom' : ''}" title=${item.label}>${item.label}</span>
                      <sl-icon-button
                        class="collapse-toggle"
                        name=${this.collapsedLayerIds.has(item.layerId) ? 'chevron-right' : 'chevron-down'}
                        label=${this.collapsedLayerIds.has(item.layerId) ? 'Show layer details' : 'Hide layer details'}
                        @click=${() => this.handleCollapseToggle(item.layerId)}
                      ></sl-icon-button>
                    </div>
                    <div class="layer-details ${this.collapsedLayerIds.has(item.layerId) ? 'collapsed' : ''}">
                      <div class="layer-details-inner">
                        ${item.visible
                          ? html`
                              <div class="opacity-row">
                                <sl-icon name="circle-half"></sl-icon>
                                <input
                                  type="range"
                                  min="0"
                                  max="100"
                                  .value=${String(this.layerTransparency.get(item.layerId) ?? 0)}
                                  @input=${(e: Event) => this.handleTransparencyChange(item.layerId, e)}
                                  @change=${(e: Event) => this.handleTransparencyChange(item.layerId, e)}
                                />
                                ${this.transparencyValueVisible.has(item.layerId)
                                  ? html`<span class="opacity-value">${this.layerTransparency.get(item.layerId) ?? 0}%</span>`
                                  : null}
                              </div>
                              <div class="layer-legend-wrap" style=${`opacity: ${(100 - (this.layerTransparency.get(item.layerId) ?? 0)) / 100}`}>
                                <webmapx-layer-legend layer-id=${item.layerId}></webmapx-layer-legend>
                              </div>
                            `
                          : null}
                        ${item.topLevelGroup
                          ? html`<div class="layer-meta">${item.topLevelGroup}</div>`
                          : null}
                        <div class="layer-details-actions">
                          <sl-icon-button
                            name="info-circle"
                            label="About this layer"
                            @click=${() => this.handleShowLayerInfo(item.layerId, item.label)}
                          ></sl-icon-button>
                          ${item.hasExtent
                            ? html`<sl-icon-button
                                name="zoom-in"
                                label="Zoom to layer"
                                @click=${() => this.handleZoomToLayer(item.layerId)}
                              ></sl-icon-button>`
                            : null}
                          ${isOverviewSection
                            ? html`<sl-icon-button
                                class="delete-layer"
                                name="trash"
                                label="Delete layer"
                                @click=${() => this.handleDeleteLayer(item.layerId)}
                              ></sl-icon-button>`
                            : null}
                        </div>
                      </div>
                    </div>
                  </div>
                  ${this.dropTargetLayerId === item.layerId && this.dropTargetPosition === 'below'
                    ? html`<div class="drop-indicator"></div>`
                    : null}
                `)}
              </div>
              ${isOverviewSection
                ? html`
                    <div class="save-layers-row">
                      <sl-button size="small" variant="default" @click=${() => this.handleSaveLayers()}>
                        <sl-icon slot="prefix" name="download"></sl-icon>
                        Save layer(s)…
                      </sl-button>
                    </div>
                  `
                : null}
            `
          : html`<div class="empty">${emptyText}</div>`}
      </section>
    `;
  }

  private onDragHandlePointerDown(e: PointerEvent): void {
    const handle = e.currentTarget as HTMLElement;
    const card = handle.closest('.layer-card') as HTMLElement | null;
    const list = handle.closest('.layer-list') as HTMLElement | null;
    if (!card || !list) return;

    e.preventDefault();
    handle.setPointerCapture(e.pointerId);

    const cardRect = card.getBoundingClientRect();
    const listRect = list.getBoundingClientRect();
    const scroller = this.findScrollableAncestor(e);
    const layerId = card.dataset.layerId ?? '';
    const siblings = Array.from(list.querySelectorAll<HTMLElement>('.layer-card'))
      .filter((sibling) => sibling !== card)
      .map((sibling) => {
        const rect = sibling.getBoundingClientRect();
        return { layerId: sibling.dataset.layerId ?? '', top: rect.top, bottom: rect.bottom };
      });
    this.dragState = {
      card,
      layerId,
      startClientY: e.clientY,
      minTranslate: listRect.top - cardRect.top,
      maxTranslate: listRect.bottom - cardRect.bottom,
      scroller,
      startScrollTop: scroller?.scrollTop ?? 0,
      cardTop: cardRect.top,
      cardBottom: cardRect.bottom,
      siblings,
    };
    card.classList.add('dragging');
  }

  // The visible scrollbar belongs to an ancestor reached through slot
  // assignment (e.g. webmapx-tool-panel's `.panel-content`, which hosts our
  // <slot>) — not a `parentElement` ancestor. `composedPath()` walks the flat
  // tree across both shadow boundaries and slots, so use that instead.
  private findScrollableAncestor(e: Event): HTMLElement | null {
    for (const target of e.composedPath()) {
      if (!(target instanceof HTMLElement)) continue;
      const style = getComputedStyle(target);
      if (/(auto|scroll)/.test(style.overflowY) && target.scrollHeight > target.clientHeight) {
        return target;
      }
    }
    return null;
  }

  private onDragHandlePointerMove(e: PointerEvent): void {
    if (!this.dragState) return;
    const { card, startClientY, minTranslate, maxTranslate, scroller, startScrollTop } = this.dragState;
    // Vertical-only: horizontal pointer movement is intentionally ignored.
    // The card moves with scrolled content (normal flow): increasing scrollTop
    // shifts content up on screen by scrollDelta. To keep total on-screen
    // displacement equal to the cursor's (clings to cursor while auto-scroll
    // runs underneath it), the transform must compensate by adding it back:
    // dy - scrollDelta == wantedDisplacement  =>  dy = wanted + scrollDelta.
    const scrollDelta = (scroller?.scrollTop ?? startScrollTop) - startScrollTop;
    const desired = e.clientY - startClientY + scrollDelta;
    const dy = Math.min(maxTranslate, Math.max(minTranslate, desired));
    card.style.transform = `translateY(${dy}px)`;
    this.updateAutoScroll(e.clientY, scroller);
    this.updateDropTarget(dy);
  }

  private updateDropTarget(dy: number): void {
    if (!this.dragState) return;
    const { cardTop, cardBottom, siblings } = this.dragState;
    let target: { layerId: string; position: 'above' | 'below' } | null = null;

    if (dy < 0) {
      const newTop = cardTop + dy;
      // First sibling (top to bottom) whose body the dragged top edge has reached.
      for (const sibling of siblings) {
        if (newTop < sibling.bottom) {
          target = { layerId: sibling.layerId, position: 'above' };
          break;
        }
      }
    } else if (dy > 0) {
      const newBottom = cardBottom + dy;
      // Last sibling (top to bottom) whose body the dragged bottom edge has reached.
      for (const sibling of siblings) {
        if (newBottom > sibling.top) {
          target = { layerId: sibling.layerId, position: 'below' };
        }
      }
    }

    this.dropTargetLayerId = target?.layerId ?? null;
    this.dropTargetPosition = target?.position ?? null;
  }

  // mapLayers key order is the map's bottom-to-top stacking order; the legend
  // shows it reversed (top of stack = top of legend).
  private commitDrop(layerId: string): void {
    const targetLayerId = this.dropTargetLayerId;
    const position = this.dropTargetPosition;
    if (!this.adapter || !targetLayerId || !position || targetLayerId === layerId) return;

    const ids = Object.keys(this.adapter.store.getState().mapLayers ?? {});
    const targetIndex = ids.indexOf(targetLayerId);
    if (targetIndex === -1) return;

    // 'below' B in the legend => immediately below B in the stack => before B in the key order.
    // 'above' B in the legend => immediately above B in the stack => before whatever sits above B.
    const beforeLayerId = position === 'below' ? targetLayerId : (ids[targetIndex + 1] ?? null);
    if (beforeLayerId === layerId) return;

    this.adapter.moveLayer(layerId, beforeLayerId);
  }

  private onDragHandlePointerUp(e: PointerEvent): void {
    if (!this.dragState) return;
    const handle = e.currentTarget as HTMLElement;
    if (handle.hasPointerCapture?.(e.pointerId)) {
      handle.releasePointerCapture(e.pointerId);
    }
    const { card, layerId } = this.dragState;
    card.style.transform = '';
    card.classList.remove('dragging');
    this.commitDrop(layerId);
    this.dragState = null;
    this.dropTargetLayerId = null;
    this.dropTargetPosition = null;
    this.stopAutoScroll();

    // Suppress the :hover-revealed handle on whatever card the cursor is now
    // resting over (it snapped into place under the cursor, not genuinely
    // hovered) until the user actually moves the mouse again.
    const under = document.elementFromPoint(e.clientX, e.clientY);
    const restingHandle = under?.closest('.layer-card')?.querySelector('.drag-handle') as HTMLElement | null;
    if (restingHandle) {
      restingHandle.classList.add('suppress-hover');
      document.addEventListener('pointermove', () => {
        restingHandle.classList.remove('suppress-hover');
      }, { once: true });
    }
  }

  private updateAutoScroll(clientY: number, panel: HTMLElement | null): void {
    if (!panel) return;

    const rect = panel.getBoundingClientRect();
    const edge = WebmapxLayerOverview.AUTO_SCROLL_EDGE_PX;
    let direction: 'up' | 'down' | null = null;
    if (clientY < rect.top + edge) {
      direction = 'up';
    } else if (clientY > rect.bottom - edge) {
      direction = 'down';
    }

    if (!direction) {
      this.stopAutoScroll();
      return;
    }
    if (this.autoScrollState?.direction === direction && this.autoScrollState.panel === panel) {
      return; // already scrolling this way
    }
    this.stopAutoScroll();
    this.autoScrollState = { panel, direction, timer: 0 };
    this.runAutoScrollStep();
  }

  private runAutoScrollStep(): void {
    const state = this.autoScrollState;
    if (!state) return;
    const { panel, direction } = state;
    const atTop = panel.scrollTop <= 0;
    const atBottom = panel.scrollTop >= panel.scrollHeight - panel.clientHeight;
    if ((direction === 'up' && atTop) || (direction === 'down' && atBottom)) {
      this.stopAutoScroll();
      return;
    }
    panel.scrollTop += direction === 'up' ? -WebmapxLayerOverview.AUTO_SCROLL_STEP_PX : WebmapxLayerOverview.AUTO_SCROLL_STEP_PX;
    state.timer = window.setTimeout(() => this.runAutoScrollStep(), WebmapxLayerOverview.AUTO_SCROLL_INTERVAL_MS);
  }

  private stopAutoScroll(): void {
    if (this.autoScrollState) {
      window.clearTimeout(this.autoScrollState.timer);
      this.autoScrollState = null;
    }
  }

  private handleSaveLayers(): void {
    if (!this.adapter) return;
    const mapLayers = this.adapter.store.getState().mapLayers ?? {};
    const candidates: SaveLayerCandidate[] = this.overviewLayers.map((item) => {
      const metadata = mapLayers[item.layerId] as Record<string, unknown> | undefined;
      return {
        layerId: item.layerId,
        label: item.label,
        sourceId: typeof metadata?.sourceId === 'string' ? metadata.sourceId : undefined,
        layerType: typeof metadata?.layerType === 'string' ? metadata.layerType : undefined,
        paint: (metadata?.paint && typeof metadata.paint === 'object') ? metadata.paint as Record<string, unknown> : undefined,
        sublayers: Array.isArray(metadata?.sublayers) ? metadata.sublayers : undefined,
        sourceData: (metadata?.sourceData && typeof metadata.sourceData === 'object')
          ? metadata.sourceData as GeoJSON.FeatureCollection
          : undefined,
      };
    });
    this.saveLayersDialog?.open(candidates, this.adapter);
  }

  private applyVisibleLayers(state: IMapState): void {
    const mapLayers = state.mapLayers ?? {};
    const orderedIds = [...Object.keys(mapLayers)].reverse();
    const background: LayerPanelItem[] = [];
    const overview: LayerPanelItem[] = [];
    const normalizedBackgroundGroupLabel = this.backgroundGroupLabel.trim().toLowerCase();

    for (const layerId of orderedIds) {
      const metadata = mapLayers[layerId] as Record<string, unknown> | undefined;
      if (metadata?.hideFromLegend === true) {
        continue;
      }

      const legendRole = metadata?.legendRole === 'background' || metadata?.legendRole === 'overlay'
        ? metadata.legendRole
        : null;

      const label = typeof metadata?.label === 'string' && metadata.label.length > 0
        ? metadata.label
        : layerId;
      const topLevelGroup = typeof metadata?.group === 'string' && metadata.group.length > 0
        ? metadata.group
        : null;

      const minz = typeof metadata?.minzoom === 'number' ? metadata.minzoom : 0;
      const maxz = typeof metadata?.maxzoom === 'number' ? metadata.maxzoom : 24;
      const zoom = typeof state.zoomLevel === 'number' ? state.zoomLevel : 0;

      const item: LayerPanelItem = {
        layerId,
        label,
        topLevelGroup,
        visible: !this.hiddenLayerIds.has(layerId),
        hasExtent: this.layerHasExtent(layerId, metadata),
        outOfZoom: zoom < minz || zoom >= maxz + 1,
      };

      if (legendRole === 'background') {
        background.push(item);
      } else if (legendRole === 'overlay') {
        overview.push(item);
      } else if (topLevelGroup?.trim().toLowerCase() === normalizedBackgroundGroupLabel) {
        background.push(item);
      } else {
        overview.push(item);
      }
    }

    this.backgroundLayers = background;
    this.overviewLayers = overview;

    const knownIds = new Set(orderedIds);
    let prunedHidden: Set<string> | null = null;
    this.hiddenLayerIds.forEach((layerId) => {
      if (!knownIds.has(layerId)) {
        prunedHidden = prunedHidden ?? new Set(this.hiddenLayerIds);
        prunedHidden.delete(layerId);
      }
    });
    if (prunedHidden) {
      this.hiddenLayerIds = prunedHidden;
    }
  }

  private handleTransparencyChange(layerId: string, e: Event): void {
    if (!this.adapter) {
      return;
    }
    const transparency = Number((e.target as HTMLInputElement).value);
    const next = new Map(this.layerTransparency);
    next.set(layerId, transparency);
    this.layerTransparency = next;
    this.adapter.setLayerOpacity(layerId, (100 - transparency) / 100);

    if (!this.transparencyValueVisible.has(layerId)) {
      const nextVisible = new Set(this.transparencyValueVisible);
      nextVisible.add(layerId);
      this.transparencyValueVisible = nextVisible;
    }
    const existingTimer = this.transparencyHideTimers.get(layerId);
    if (existingTimer) {
      window.clearTimeout(existingTimer);
    }
    const timer = window.setTimeout(() => {
      this.transparencyHideTimers.delete(layerId);
      const nextVisible = new Set(this.transparencyValueVisible);
      nextVisible.delete(layerId);
      this.transparencyValueVisible = nextVisible;
    }, 1500);
    this.transparencyHideTimers.set(layerId, timer);
  }

  private handleShowLayerInfo(layerId: string, fallbackLabel: string): void {
    // Per webmapx's architecture contract, everything shown here comes from
    // store.mapLayers[layerId] — populated entirely from the `layer` object
    // passed to adapter.addLayer() by registerMapLayer(). No static config
    // lookups: discovered/inline layers (e.g. "Add layer from URL") have no
    // entry in any such config at all.
    const runtimeMetadata = this.adapter?.store.getState().mapLayers?.[layerId] as Record<string, unknown> | undefined;
    const title = (runtimeMetadata?.label as string | undefined) ?? fallbackLabel;
    const attribution = runtimeMetadata?.attribution as string | undefined;
    const abstract = runtimeMetadata?.abstract as string | undefined;
    const featureSummary = this.getLayerFeatureSummary(layerId, runtimeMetadata);
    this.infoDialog?.open(title, abstract, attribution, featureSummary);
  }

  /** For geojson-backed layers, returns one feature-count/geometry-type summary per
   *  distinct geojson source (composite layers may reference several), if data is loaded. */
  private getLayerFeatureSummary(layerId: string, runtimeMetadata: Record<string, unknown> | undefined): string | undefined {
    const refs = getLayerSourceRefs(layerId, runtimeMetadata);
    const summaries: string[] = [];
    for (const candidates of refs) {
      for (const sourceId of candidates) {
        const data = this.adapter?.getSourceData(sourceId) ?? null;
        if (data && typeof data === 'object') {
          summaries.push(summarizeGeoJSON(data as GeoJSON.FeatureCollection));
          break;
        }
      }
    }
    // Inline/discovered layers without sublayers/sourceId metadata (e.g. WFS
    // layers added via "Add layer from URL") stash their resolved geojson
    // directly in metadata.sourceData.
    if (summaries.length === 0 && runtimeMetadata?.sourceData && typeof runtimeMetadata.sourceData === 'object') {
      summaries.push(summarizeGeoJSON(runtimeMetadata.sourceData as GeoJSON.FeatureCollection));
    }
    return summaries.length > 0 ? summaries.join('; ') : undefined;
  }

  /** Cheap existence check (no coordinate walking) for whether "zoom to layer" should show. */
  private layerHasExtent(layerId: string, metadata: Record<string, unknown> | undefined): boolean {
    if (Array.isArray(metadata?.bounds) && metadata.bounds.length === 4) return true;
    return getLayerSourceRefs(layerId, metadata).some((candidates) =>
      candidates.some((sourceId) => this.adapter?.getSourceData(sourceId) !== null));
  }

  /** Lazily computes (and caches) the extent of a source's GeoJSON data, trying each
   *  candidate id in turn (cached under the first candidate). */
  private getSourceExtent(candidates: string[]): [number, number, number, number] | null {
    const cacheKey = candidates[0];
    if (this.sourceExtentCache.has(cacheKey)) return this.sourceExtentCache.get(cacheKey) ?? null;
    let extent: [number, number, number, number] | null = null;
    for (const sourceId of candidates) {
      const data = this.adapter?.getSourceData(sourceId) ?? null;
      if (data && typeof data === 'object') {
        extent = geojsonExtent(data as GeoJSON.FeatureCollection);
        break;
      }
    }
    this.sourceExtentCache.set(cacheKey, extent);
    return extent;
  }

  /** Lazily computes (and caches) a layer's zoom-to extent: explicit `metadata.bounds`,
   *  or the union of its source extent(s) — multiple for composite layers. */
  private resolveLayerExtent(layerId: string): [number, number, number, number] | null {
    if (this.layerExtentCache.has(layerId)) return this.layerExtentCache.get(layerId) ?? null;
    const metadata = this.adapter?.store.getState().mapLayers?.[layerId] as Record<string, unknown> | undefined;
    let extent: [number, number, number, number] | null = null;
    if (Array.isArray(metadata?.bounds) && metadata.bounds.length === 4) {
      extent = metadata.bounds as [number, number, number, number];
    } else {
      for (const candidates of getLayerSourceRefs(layerId, metadata)) {
        extent = unionExtent(extent, this.getSourceExtent(candidates));
      }
    }
    this.layerExtentCache.set(layerId, extent);
    return extent;
  }

  private handleZoomToLayer(layerId: string): void {
    const extent = this.resolveLayerExtent(layerId);
    if (extent) this.adapter?.fitBounds(extent);
  }

  private handleDeleteLayer(layerId: string): void {
    if (!this.adapter) {
      return;
    }
    this.adapter.removeLayer(layerId);
    if (this.hiddenLayerIds.has(layerId)) {
      const next = new Set(this.hiddenLayerIds);
      next.delete(layerId);
      this.hiddenLayerIds = next;
    }
    if (this.collapsedLayerIds.has(layerId)) {
      const next = new Set(this.collapsedLayerIds);
      next.delete(layerId);
      this.collapsedLayerIds = next;
    }
    this.applyVisibleLayers(this.adapter.store.getState());
  }

  private handleCollapseToggle(layerId: string): void {
    const next = new Set(this.collapsedLayerIds);
    if (next.has(layerId)) {
      next.delete(layerId);
    } else {
      next.add(layerId);
    }
    this.collapsedLayerIds = next;
  }

  private handleVisibilityToggle(layerId: string): void {
    if (!this.adapter) {
      return;
    }
    const nextVisible = this.hiddenLayerIds.has(layerId);
    this.adapter.setLayerVisibility(layerId, nextVisible);
    const next = new Set(this.hiddenLayerIds);
    if (nextVisible) {
      next.delete(layerId);
    } else {
      next.add(layerId);
    }
    this.hiddenLayerIds = next;
    this.applyVisibleLayers(this.adapter.store.getState());
  }
}
