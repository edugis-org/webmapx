import { css, html, type PropertyValues } from 'lit';
import { customElement, property, state, query } from 'lit/decorators.js';
import { WebmapxBaseTool } from './webmapx-base-tool';
import type { IMapState } from '../store/IMapState';
import type { IMap } from '../map/IMapInterfaces';
import type { LayerAddEvent, LayerRemoveEvent } from '../store/map-events';
import './webmapx-layer-legend';
import './webmapx-layer-info-dialog';
import './webmapx-layer-style-dialog';
import './webmapx-save-layers-dialog';
import './webmapx-permalink-dialog';
import './webmapx-clear-layers-dialog';
import type { WebmapxLayerInfoDialog } from './webmapx-layer-info-dialog';
import type { LayerStyleTarget, SourceAttributeInfo, SourceStyleGroup, WebmapxLayerStyleDialog } from './webmapx-layer-style-dialog';
import type { WebmapxSaveLayersDialog, SaveLayerCandidate } from './webmapx-save-layers-dialog';
import type { WebmapxPermalinkDialog } from './webmapx-permalink-dialog';
import type { WebmapxClearLayersDialog } from './webmapx-clear-layers-dialog';
import { buildPermalinkUrl, getMapDomIndex, getConfigUrlForIndex } from '../utils/permalink';
import { sampleLayerFeatures } from '../utils/layer-features';
import { Webmapx3dTool } from './webmapx-3d-tool';
import '@shoelace-style/shoelace/dist/components/icon/icon.js';
import '@shoelace-style/shoelace/dist/components/icon-button/icon-button.js';
import '@shoelace-style/shoelace/dist/components/tooltip/tooltip.js';
import { splitLayerTitle } from '../utils/layer-swatch';

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
  layerType: string | undefined;
  topLevelGroup: string | null;
  visible: boolean;
  hasExtent: boolean;
  hasStyleDialog: boolean;
  outOfZoom: boolean;
  beingEdited: boolean;
}

const STYLE_DIALOG_LAYER_TYPES = new Set(['circle', 'symbol', 'label', 'line', 'fill', 'fill-extrusion']);

interface SourceLayerTarget extends LayerStyleTarget {
  sourceId: string;
  sourceLayer?: string;
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
  // legendExpanded is now stored in store.mapLayers[id].legendExpanded (defaults to true)
  @state() private layerTransparency: Map<string, number> = new Map();
  // Which layer's transparency percentage is currently shown as an editable
  // number input instead of plain text (at most one at a time).
  @state() private editingTransparencyLayerId: string | null = null;
  // Which layer's transparency slider is currently hovered — tracked as
  // reactive state (not a direct style.setProperty on the input) because the
  // slider's `style` attribute is re-rendered from a single template string
  // on every value change (e.g. clicking the track to jump), which would
  // otherwise silently wipe out an imperatively-set custom property.
  @state() private hoveredTransparencySliderLayerId: string | null = null;
  @state() private dropTargetLayerId: string | null = null;
  @state() private dropTargetPosition: 'above' | 'below' | null = null;
  // Lazily-computed and cached extents — geojsonExtent() walks every coordinate, so it's
  // only run when the user clicks "zoom to layer", and per-source so composite layers
  // sharing a source don't recompute it for each sublayer.
  private sourceExtentCache: Map<string, [number, number, number, number] | null> = new Map();
  private layerExtentCache: Map<string, [number, number, number, number] | null> = new Map();
  // cache: true — these dialogs escape to document.body on open() (see
  // webmapx-layer-info-dialog.ts) to outrun webmapx-tool-panel's backdrop-filter trapping
  // their position:fixed sl-dialog. A live (uncached) @query only finds them here on the
  // first click, before they've moved; every click after that would silently find nothing.
  @query('webmapx-layer-info-dialog', true) private infoDialog!: WebmapxLayerInfoDialog;
  @query('webmapx-layer-style-dialog', true) private styleDialog!: WebmapxLayerStyleDialog;
  // cache: true — see the comment on infoDialog/styleDialog above; same reason.
  @query('webmapx-save-layers-dialog', true) private saveLayersDialog!: WebmapxSaveLayersDialog;
  @query('webmapx-permalink-dialog', true) private permalinkDialog!: WebmapxPermalinkDialog;
  // cache: true — see the comment on infoDialog/styleDialog above; same reason.
  @query('webmapx-clear-layers-dialog', true) private clearLayersDialog!: WebmapxClearLayersDialog;
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
      background: var(--webmapx-legend-bg, var(--color-background, #fff));
      color: var(--webmapx-legend-color, var(--color-text-primary, #16202a));
    }

    /* Shoelace's own tooltip body is pointer-events: none, but its arrow
       and the popup's own outer wrapper aren't — confirmed either one can
       sit directly over a neighboring icon (e.g. the eye icon right next
       to the drag-handle) and silently eat a click meant for that icon
       while the tooltip is still open. */
    sl-tooltip::part(base__arrow),
    sl-tooltip::part(base__popup) {
      pointer-events: none;
    }

    /* No overflow/max-height here: the real scrollport is the ancestor
       reached through slot assignment (webmapx-tool-panel's
       .panel-content) — see findScrollableAncestor below. Making this
       element its own scroll container too would give sticky headers and
       drag auto-scroll the wrong ancestor to stick/scroll against. */
    .panel {
      display: flex;
      flex-direction: column;
      gap: var(--webmapx-space-lg, 1rem);
      padding: var(--webmapx-space-sm, 0.5rem);
      box-sizing: border-box;
    }

    .section {
      display: flex;
      flex-direction: column;
      gap: var(--webmapx-space-sm, 0.5rem);
    }

    /* A section heading is structure, not an action. It used to be bold and
       accent-coloured, which put it in the same visual class as selected
       layers and active buttons; a muted micro-label keeps the accent
       meaning "interactive" and nothing else. */
    .section-title {
      margin: 0;
      font-size: var(--webmapx-label-size, var(--webmapx-font-size-sm, 0.75rem));
      font-weight: 600;
      letter-spacing: var(--webmapx-label-spacing, 0.06em);
      text-transform: var(--webmapx-label-transform, uppercase);
      color: var(--webmapx-legend-title-color, var(--color-text-muted, #6b7681));
      /* Truncates instead of wrapping/pushing the action buttons off when a
         section has both a title and buttons (Active layers) and the two
         don't both fit — the buttons must never shrink or lose their click
         target. Equally harmless when a section's row has no buttons to
         protect (Base map): with only one flex child, there's nothing for
         truncation to make room for. */
      flex: 1 1 auto;
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .layer-list {
      display: flex;
      flex-direction: column;
      gap: var(--webmapx-space-sm, 0.5rem);
    }

    .drop-indicator {
      height: 2px;
      margin: -1px 0;
      background: var(--color-text-primary, #16202a);
      border-radius: 1px;
      pointer-events: none;
    }

    .layer-card.dragging {
      position: relative;
      z-index: 2;
      opacity: 0.75;
      box-shadow: var(--webmapx-shadow-lg, 0 6px 16px rgba(15, 23, 42, 0.2));
      cursor: grabbing;
    }

    .layer-card {
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: var(--webmapx-space-xs, 0.35rem);
      padding: var(--webmapx-space-xs, 0.35rem) var(--webmapx-space-sm, 0.625rem);
      border: 1px solid var(--color-border, #d5dce3);
      border-radius: var(--webmapx-radius-lg, 0.75rem);
      background: var(--color-background, #fff);
      box-shadow: var(--webmapx-shadow-sm, 0 1px 3px rgba(15, 23, 42, 0.08));
      box-sizing: border-box;
      /* drag-handle width (1em, i.e. its own font-size) plus the .layer-row
         gap that sits between it and the eye icon — the indent everything
         in .layer-details lines up with, except .layer-details-actions,
         which breaks back out of it (see below). */
      --details-indent: calc(var(--webmapx-font-size-md, 0.95rem) + var(--webmapx-space-xs, 0.25rem));
    }

    .layer-row {
      display: flex;
      align-items: center;
      gap: var(--webmapx-space-xs, 0.25rem);
      width: 100%;
      touch-action: none;
    }

    /* Reordering must stay within .layer-list, vertical-only (matches EduGIS):
       implement via pointer-based drag that translateY's the row, clamped to
       the list's bounding box and ignoring horizontal pointer movement —
       not native HTML5 DnD, whose drag image floats freely with the cursor. */
    /* Hidden until the card is hovered — mirrors legend3D's drag-handle, which
       stays visible mid-drag even if the pointer drifts off the card. */
    .drag-handle {
      flex: 0 0 auto;
      font-size: var(--webmapx-font-size-md, 0.95rem);
      color: var(--color-text-muted, #6b7681);
      cursor: grab;
      touch-action: none;
      opacity: 0;
      transition: opacity var(--webmapx-motion-fast, 120ms) ease, color var(--webmapx-motion-fast, 120ms) ease;
    }

    /* Hidden the same way as .drag-handle — visible only on card hover, and
       disappears on mouse-out even if the button still holds focus from a
       click, matching the drag icon's hover-only behavior exactly. */
    .delete-layer,
    .layer-details-actions {
      opacity: 0;
      transition: opacity var(--webmapx-motion-fast, 120ms) ease;
    }

    .layer-card:hover .drag-handle,
    .layer-card.dragging .drag-handle,
    .layer-card:hover .delete-layer,
    .layer-card:hover .layer-details-actions {
      opacity: 1;
    }

    /* Single-layer lists render the same icon (never draggable, so no
       pointer handlers are attached — see the template) purely to reserve
       its layout width, so .layer-details' padding-left still lines up with
       the eye icon below it. Higher specificity than the hover-reveal rule
       above, so it always wins regardless of source order. */
    .layer-card:hover .drag-handle.drag-handle-disabled,
    .layer-card.dragging .drag-handle.drag-handle-disabled {
      opacity: 0;
    }

    .drag-handle-disabled {
      cursor: default;
      pointer-events: none;
    }

    /* Matches sl-icon-button's own hover/active colors (--sl-color-primary-600/700)
       so a plain sl-icon reads consistently with the real icon-buttons around it. */
    .drag-handle:hover {
      color: var(--sl-color-primary-600, var(--color-primary, #2b6c8f));
    }

    .drag-handle:active {
      cursor: grabbing;
      color: var(--sl-color-primary-700, var(--color-primary, #2b6c8f));
    }

    .visibility-toggle::part(base),
    .delete-layer::part(base),
    .layer-details-actions sl-icon-button::part(base) {
      font-size: var(--webmapx-font-size-md, 0.95rem);
      padding: 0;
    }

    .layer-legend-wrap {
      width: 100%;
      padding-left: var(--details-indent);
      box-sizing: border-box;
    }

    .layer-label {
      flex: 1 1 auto;
      min-width: 0;
      cursor: pointer;
      font-size: var(--webmapx-font-size-md, 0.95rem);
      line-height: 1.3;
      white-space: normal;
      word-break: break-word;
      transition: color var(--webmapx-motion-fast, 120ms) ease;
    }

    .layer-label:focus-visible {
      outline: var(--webmapx-focus-ring, 2px solid var(--color-primary, #2b6c8f));
      outline-offset: var(--webmapx-focus-offset, 2px);
    }

    .layer-label.out-of-zoom {
      color: var(--color-text-muted, #6b7681);
      opacity: 0.6;
    }

    /* After .out-of-zoom so hover/focus feedback wins even on a dimmed label
       (equal specificity to .layer-label.out-of-zoom — source order decides). */
    .layer-label:hover,
    .layer-label:focus-visible {
      color: var(--sl-color-primary-600, var(--color-primary, #2b6c8f));
    }

    /* No padding here (unlike before): .layer-details-inner below has
       overflow:hidden for the collapse animation, so a parent-level indent
       that .layer-details-actions then tried to break back out of via a
       negative margin got clipped by that overflow — the info icon (the
       piece pushed furthest left) disappeared entirely. Each row that needs
       the eye-aligned indent (.layer-legend-wrap, .opacity-row, .layer-meta)
       applies --details-indent itself instead; .layer-details-actions is
       simply never indented, so it uses the full width with no clipping. */
    .layer-details {
      display: grid;
      grid-template-rows: 1fr;
      width: 100%;
      box-sizing: border-box;
      transition: grid-template-rows var(--webmapx-motion-fast, 120ms) ease-in-out;
    }

    .layer-details.collapsed {
      grid-template-rows: 0fr;
    }

    .layer-details-inner {
      display: flex;
      flex-direction: column;
      gap: var(--webmapx-space-xs, 0.35rem);
      overflow: hidden;
      min-height: 0;
    }

    .layer-details-actions {
      display: flex;
      align-items: center;
      justify-content: space-between;
      width: 100%;
    }

    .opacity-row {
      display: flex;
      align-items: center;
      gap: 0.2rem;
      font-size: var(--webmapx-font-size-sm, 0.8rem);
      color: var(--color-text-secondary, #5a6773);
      padding-left: var(--details-indent);
      padding-right: 2.5rem;
      box-sizing: border-box;
    }

    /* --slider-pct (set inline per-row from the current transparency value)
       splits the track at the thumb: lower values (left, already "used") in
       the lighter tone, higher values (right, remaining) in the darker
       tone — so the whole line reads dark at 0% and light at 100%. Resting
       state uses greys; hovering or dragging swaps in the blue pair. */
    .opacity-row input[type="range"] {
      --slider-track-grey: linear-gradient(to right,
        var(--color-border, #d5dce3) 0%,
        var(--color-border, #d5dce3) var(--slider-pct, 0%),
        var(--color-text-muted, #6b7681) var(--slider-pct, 0%),
        var(--color-text-muted, #6b7681) 100%
      );
      --slider-track-blue: linear-gradient(to right,
        var(--sl-color-primary-200, #bcdcf5) 0%,
        var(--sl-color-primary-200, #bcdcf5) var(--slider-pct, 0%),
        var(--sl-color-primary-600, var(--color-primary, #2b6c8f)) var(--slider-pct, 0%),
        var(--sl-color-primary-600, var(--color-primary, #2b6c8f)) 100%
      );
      flex: 1 1 auto;
      -webkit-appearance: none;
      appearance: none;
      height: 2px;
      background: var(--slider-track-grey);
      border-radius: var(--webmapx-radius-xs, 2px);
      outline: none;
      transition: background var(--webmapx-motion-fast, 120ms) ease;
    }

    .opacity-row input[type="range"]:hover,
    .opacity-row input[type="range"]:active {
      background: var(--slider-track-blue);
    }

    /* The rule above removes the UA focus ring from a keyboard-operable
       control (arrow keys change the value), so put an equivalent back. */
    .opacity-row input[type="range"]:focus-visible {
      outline: var(--webmapx-focus-ring, 2px solid var(--color-primary, #2b6c8f));
      outline-offset: var(--webmapx-focus-offset, 2px);
    }

    /* The thumb doubles as the "drag to change transparency" affordance, so
       it always shows the same circle-half glyph, in white — sized close to
       the thumb's own diameter so the grey fill reads as a thin ring around
       the glyph rather than a separate dot behind it. Default diameter
       matches the info-layer button's icon (~0.95rem). Hover/grab tint it
       blue like every other control here; grabbing additionally enlarges.
       --thumb-fill (rather than a :hover selector on the pseudo-element) is
       set from the input's own style attribute, driven by
       hoveredTransparencySliderLayerId: Chromium/Firefox have a long-standing
       bug where a :hover selector match on ::-webkit-slider-thumb/
       ::-moz-range-thumb doesn't reliably repaint the thumb (:active works
       only because dragging already forces continuous repaints as the thumb
       moves). Changing a custom property's resolved value doesn't have that
       problem — it's the same invalidation path --slider-pct already relies
       on for the track gradient above. This has to be reactive state rather
       than an imperative style.setProperty() on mouseenter/mouseleave too:
       clicking the track to jump the value re-renders the whole style
       string from the template on every input event, which would otherwise
       silently wipe out a property set outside that render. */
    .opacity-row input[type="range"]::-webkit-slider-thumb {
      -webkit-appearance: none;
      appearance: none;
      width: 16px;
      height: 16px;
      border-radius: 50%;
      background-color: var(--thumb-fill, var(--color-text-muted, #6b7681));
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='white' viewBox='0 0 16 16'%3E%3Cpath d='M8 15A7 7 0 1 0 8 1zm0 1A8 8 0 1 1 8 0a8 8 0 0 1 0 16'/%3E%3C/svg%3E");
      background-repeat: no-repeat;
      background-position: center;
      background-size: 80%;
      cursor: pointer;
      transition: width var(--webmapx-motion-fast, 120ms) ease,
                  height var(--webmapx-motion-fast, 120ms) ease,
                  background-color var(--webmapx-motion-fast, 120ms) ease;
    }

    .opacity-row input[type="range"]::-moz-range-thumb {
      width: 16px;
      height: 16px;
      border-radius: 50%;
      border: none;
      background-color: var(--thumb-fill, var(--color-text-muted, #6b7681));
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='white' viewBox='0 0 16 16'%3E%3Cpath d='M8 15A7 7 0 1 0 8 1zm0 1A8 8 0 1 1 8 0a8 8 0 0 1 0 16'/%3E%3C/svg%3E");
      background-repeat: no-repeat;
      background-position: center;
      background-size: 80%;
      cursor: pointer;
      transition: width var(--webmapx-motion-fast, 120ms) ease,
                  height var(--webmapx-motion-fast, 120ms) ease,
                  background-color var(--webmapx-motion-fast, 120ms) ease;
    }

    /* Grabbed: enlarge, and switch to the active shade (matches .drag-handle:active elsewhere). */
    .opacity-row input[type="range"]:active::-webkit-slider-thumb {
      width: 24px;
      height: 24px;
      background-color: var(--sl-color-primary-700, var(--color-primary, #2b6c8f));
    }

    .opacity-row input[type="range"]:active::-moz-range-thumb {
      width: 24px;
      height: 24px;
      background-color: var(--sl-color-primary-700, var(--color-primary, #2b6c8f));
    }

    .opacity-row input[type="range"]::-moz-range-track {
      height: 2px;
      background: var(--slider-track-grey);
      border-radius: var(--webmapx-radius-xs, 2px);
      transition: background var(--webmapx-motion-fast, 120ms) ease;
    }

    .opacity-row input[type="range"]:hover::-moz-range-track,
    .opacity-row input[type="range"]:active::-moz-range-track {
      background: var(--slider-track-blue);
    }

    .opacity-value {
      flex: 0 0 auto;
      min-width: 1.5em;
      text-align: left;
      font-variant-numeric: tabular-nums;
      cursor: pointer;
      border-radius: var(--webmapx-radius-xs, 2px);
      /* Dotted underline (not solid) is the recognized "click to edit"
         convention (spreadsheets, Notion-style inline properties) — it
         reads as a hint, not a hyperlink. No explicit text-decoration-color:
         it defaults to currentColor, so the underline automatically follows
         the same hover/focus color change as the text itself, below. */
      text-decoration: underline dotted;
      text-underline-offset: 2px;
      transition: color var(--webmapx-motion-fast, 120ms) ease;
    }

    .opacity-value:hover,
    .opacity-value:focus-visible {
      color: var(--sl-color-primary-600, var(--color-primary, #2b6c8f));
    }

    .opacity-value:focus-visible {
      outline: var(--webmapx-focus-ring, 2px solid var(--color-primary, #2b6c8f));
      outline-offset: var(--webmapx-focus-offset, 2px);
    }

    .opacity-value-input {
      flex: 0 0 auto;
      width: 2.6em;
      text-align: right;
      font: inherit;
      font-variant-numeric: tabular-nums;
      color: inherit;
      background: var(--color-background, #fff);
      /* Neutral border matching every other plain input in the project
         (e.g. webmapx-isochrone-tool.ts, webmapx-config-edit-tool.ts). This
         input is only ever on screen while actively focused (it appears
         already-focused the instant you click the percentage), so a
         separate offset outline on top of the border read as two nested
         boxes — recolor the same single border on focus instead of adding
         a second box. */
      border: 1px solid var(--color-border, #d5dce3);
      border-radius: var(--webmapx-radius-xs, 2px);
      padding: 0 2px;
      outline: none;
      -moz-appearance: textfield;
      appearance: textfield;
      transition: border-color var(--webmapx-motion-fast, 120ms) ease;
    }

    .opacity-value-input:focus-visible {
      border-color: var(--sl-color-primary-600, var(--color-primary, #2b6c8f));
    }

    .opacity-value-input::-webkit-outer-spin-button,
    .opacity-value-input::-webkit-inner-spin-button {
      -webkit-appearance: none;
      margin: 0;
    }

    .section-header-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--webmapx-space-sm, 0.5rem);
      background: var(--webmapx-legend-bg, var(--color-background, #fff));
      padding-bottom: var(--webmapx-space-xs, 0.25rem);
    }

    /* Only the Active layers header carries buttons worth keeping visible
       while its layer list scrolls underneath — Base map's header was never
       sticky before this merge and still isn't. */
    .section-header-row.sticky {
      position: sticky;
      top: 0;
      z-index: 1;
    }

    /* Its own flex group (rather than letting the buttons sit as direct
       flex children of .section-header-row) so justify-content: space-between
       above pushes the title and the whole button cluster to opposite
       ends, instead of spacing every item apart individually. Never
       shrinks — see .section-title. */
    .section-actions {
      display: flex;
      align-items: center;
      flex: 0 0 auto;
      gap: var(--webmapx-space-xs, 0.4rem);
    }

    .layer-meta {
      font-size: var(--webmapx-font-size-sm, 0.75rem);
      color: var(--color-text-secondary, #5a6773);
      white-space: nowrap;
      /* --details-indent (eye-alignment) plus its own original extra
         sub-indent, unchanged from before .layer-details stopped providing
         the base indent itself. */
      margin-left: calc(var(--details-indent) + 0.75rem);
    }

    .layer-editing-notice {
      font-size: var(--webmapx-font-size-sm, 0.75rem);
      color: var(--color-text-secondary, #5a6773);
      font-style: italic;
      padding: var(--webmapx-space-xs, 0.25rem) var(--webmapx-space-md, 0.75rem) var(--webmapx-space-sm, 0.5rem);
    }

    .empty {
      padding: 0.875rem;
      border: 1px dashed var(--color-border, #d5dce3);
      border-radius: var(--webmapx-radius-lg, 0.75rem);
      color: var(--color-text-secondary, #5a6773);
      font-size: var(--webmapx-font-size-md, 0.875rem);
      background: var(--color-background-secondary, #f4f6f8);
    }
  `;

  private _lastMapLayers: IMapState['mapLayers'] | undefined = undefined;

  protected onStateChanged(state: IMapState): void {
    if (state.mapLayers === this._lastMapLayers) return;
    this._lastMapLayers = state.mapLayers;
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
  }

  protected updated(changed: PropertyValues): void {
    super.updated(changed);
    this.disableTooltipHoverBridges();
  }

  // sl-tooltip unconditionally turns on its internal sl-popup's
  // "hover-bridge" — an invisible polygon connecting the anchor to the
  // tooltip so the pointer can travel into tooltips with interactive
  // content without them closing. It isn't pointer-events: none, though,
  // and our tooltips are plain text with nothing to travel into — so for a
  // small, densely-packed control like the drag-handle, that polygon can
  // overlap an adjacent icon (confirmed: it reaches into the eye icon
  // right next to it) and silently swallow a click meant for either one.
  // Shoelace doesn't expose hoverBridge through sl-tooltip's own API, so
  // it has to be switched off directly on each tooltip's internal
  // sl-popup once it's rendered.
  private disableTooltipHoverBridges(): void {
    this.shadowRoot?.querySelectorAll('sl-tooltip').forEach((tooltip) => {
      void tooltip.updateComplete.then(() => {
        const popup = tooltip.shadowRoot?.querySelector('sl-popup') as (HTMLElement & { hoverBridge: boolean }) | null;
        if (popup) popup.hoverBridge = false;
      });
    });
  }

  render() {
    return html`
      <div class="panel">
        ${this.renderSection(this.overviewTitle, this.overviewLayers, 'No layers on the map yet. Add one from the Catalog.', true)}
        ${this.renderSection(this.backgroundTitle, this.backgroundLayers, 'No base map selected.')}
      </div>
      <webmapx-layer-info-dialog></webmapx-layer-info-dialog>
      <webmapx-layer-style-dialog></webmapx-layer-style-dialog>
      <webmapx-save-layers-dialog></webmapx-save-layers-dialog>
      <webmapx-permalink-dialog></webmapx-permalink-dialog>
      <webmapx-clear-layers-dialog @webmapx-clear-layers-confirm=${() => this.handleConfirmClearAllLayers()}></webmapx-clear-layers-dialog>
    `;
  }

  private renderSection(title: string, items: LayerPanelItem[], emptyText: string, isOverviewSection = false) {
    return html`
      <section class="section">
        <div class="section-header-row ${isOverviewSection ? 'sticky' : ''}">
          <h3 class="section-title" title=${title}>${title}</h3>
          ${isOverviewSection
            ? html`
                <div class="section-actions">
                  ${items.length > 0 ? html`
                    <sl-tooltip content="Show all layers">
                      <sl-icon-button
                        name="eye"
                        label="Show all layers"
                        @click=${() => this.handleShowAllLayers()}
                      ></sl-icon-button>
                    </sl-tooltip>
                    <sl-tooltip content="Hide all layers">
                      <sl-icon-button
                        name="eye-slash"
                        label="Hide all layers"
                        @click=${() => this.handleHideAllLayers()}
                      ></sl-icon-button>
                    </sl-tooltip>
                    <sl-tooltip content="Clear all layers">
                      <sl-icon-button
                        name="trash"
                        label="Clear all layers"
                        @click=${() => this.handleClearAllLayers()}
                      ></sl-icon-button>
                    </sl-tooltip>
                  ` : null}
                  <sl-tooltip content="Permalink">
                    <sl-icon-button
                      name="link-45deg"
                      label="Permalink"
                      @click=${() => this.handlePermalink()}
                    ></sl-icon-button>
                  </sl-tooltip>
                  ${items.length > 0 ? html`
                    <sl-tooltip content="Save layer(s)…">
                      <sl-icon-button
                        name="download"
                        label="Save layer(s)…"
                        @click=${() => this.handleSaveLayers()}
                      ></sl-icon-button>
                    </sl-tooltip>
                  ` : null}
                </div>
              `
            : null}
        </div>
        ${items.length > 0
          ? html`
              <div class="layer-list">
                ${items.map((item, index) => html`
                  ${this.dropTargetLayerId === item.layerId && this.dropTargetPosition === 'above'
                    ? html`<div class="drop-indicator"></div>`
                    : null}
                  <div class="layer-card" data-layer-id=${item.layerId}>
                    <div class="layer-row">
                      <sl-tooltip content="Drag to change layer order" ?disabled=${items.length <= 1}>
                        <sl-icon
                          class="drag-handle${items.length <= 1 ? ' drag-handle-disabled' : ''}"
                          name=${index === 0 ? 'arrow-down' : index === items.length - 1 ? 'arrow-up' : 'arrow-down-up'}
                          @pointerdown=${items.length > 1 ? (e: PointerEvent) => this.onDragHandlePointerDown(e) : undefined}
                          @pointermove=${items.length > 1 ? (e: PointerEvent) => this.onDragHandlePointerMove(e) : undefined}
                          @pointerup=${items.length > 1 ? (e: PointerEvent) => this.onDragHandlePointerUp(e) : undefined}
                          @pointercancel=${items.length > 1 ? (e: PointerEvent) => this.onDragHandlePointerUp(e) : undefined}
                        ></sl-icon>
                      </sl-tooltip>
                      <sl-tooltip content=${item.visible ? 'Hide layer' : 'Show layer'}>
                        <sl-icon-button
                          class="visibility-toggle"
                          name=${item.visible ? 'eye' : 'eye-slash'}
                          label=${item.visible ? 'Hide layer' : 'Show layer'}
                          @click=${() => this.handleVisibilityToggle(item.layerId)}
                        ></sl-icon-button>
                      </sl-tooltip>
                      <span
                        class="layer-label ${item.outOfZoom ? 'out-of-zoom' : ''}"
                        role="button"
                        tabindex="0"
                        aria-expanded=${this.isLegendCollapsed(item.layerId) ? 'false' : 'true'}
                        @click=${() => this.handleCollapseToggle(item.layerId)}
                        @keydown=${(e: KeyboardEvent) => {
                          if (e.key !== 'Enter' && e.key !== ' ') return;
                          e.preventDefault();
                          this.handleCollapseToggle(item.layerId);
                        }}
                      >${splitLayerTitle(item.label).name}${item.beingEdited ? html`&nbsp;<sl-icon name="pencil" title="Layer is currently being edited"></sl-icon>` : null}</span>
                      ${isOverviewSection ? html`
                        <sl-tooltip content="Remove layer">
                          <sl-icon-button
                            class="delete-layer"
                            name="x-circle"
                            label="Remove layer"
                            @click=${() => this.handleDeleteLayer(item.layerId)}
                          ></sl-icon-button>
                        </sl-tooltip>
                      ` : null}
                    </div>
                    <div class="layer-details ${this.isLegendCollapsed(item.layerId) ? 'collapsed' : ''}">
                      <div class="layer-details-inner">
                        ${item.beingEdited
                          ? html`<div class="layer-editing-notice">editing</div>`
                          : html`
                            ${item.visible
                              ? html`
                                  <div class="layer-legend-wrap" style=${item.layerType === 'hillshade' ? '' : `opacity: ${(100 - (this.layerTransparency.get(item.layerId) ?? 0)) / 100}`}>
                                    <webmapx-layer-legend layer-id=${item.layerId}></webmapx-layer-legend>
                                  </div>
                                  <div class="opacity-row">
                                    <sl-tooltip content="Transparency">
                                      <input
                                        type="range"
                                        aria-label=${`Transparency of ${item.label}`}
                                        min="0"
                                        max="100"
                                        style="--slider-pct: ${this.layerTransparency.get(item.layerId) ?? 0}%${this.hoveredTransparencySliderLayerId === item.layerId ? '; --thumb-fill: var(--sl-color-primary-600, var(--color-primary, #2b6c8f))' : ''}"
                                        .value=${String(this.layerTransparency.get(item.layerId) ?? 0)}
                                        @input=${(e: Event) => this.handleTransparencyChange(item.layerId, e)}
                                        @mouseenter=${() => { this.hoveredTransparencySliderLayerId = item.layerId; }}
                                        @mouseleave=${() => { this.hoveredTransparencySliderLayerId = null; }}
                                        @pointerdown=${(e: PointerEvent) => (e.currentTarget as HTMLElement).closest('sl-tooltip')?.hide()}
                                        @focus=${(e: FocusEvent) => (e.currentTarget as HTMLElement).closest('sl-tooltip')?.hide()}
                                      />
                                    </sl-tooltip>
                                    ${this.editingTransparencyLayerId === item.layerId
                                      ? html`<input
                                          class="opacity-value-input"
                                          type="number"
                                          min="0"
                                          max="100"
                                          inputmode="numeric"
                                          aria-label=${`Transparency of ${item.label}, percent`}
                                          .value=${String(this.layerTransparency.get(item.layerId) ?? 0)}
                                          @blur=${(e: Event) => this.commitTransparencyInput(item.layerId, e)}
                                          @keydown=${(e: KeyboardEvent) => this.handleTransparencyInputKeydown(e)}
                                        />`
                                      : html`<sl-tooltip content="Fill in">
                                          <span
                                            class="opacity-value"
                                            role="button"
                                            tabindex="0"
                                            @click=${() => this.beginEditTransparency(item.layerId)}
                                            @keydown=${(e: KeyboardEvent) => {
                                              if (e.key !== 'Enter' && e.key !== ' ') return;
                                              e.preventDefault();
                                              this.beginEditTransparency(item.layerId);
                                            }}
                                          >${this.layerTransparency.get(item.layerId) ?? 0}%</span>
                                        </sl-tooltip>`}
                                  </div>
                                `
                              : null}
                            ${item.topLevelGroup
                              ? html`<div class="layer-meta">${item.topLevelGroup}</div>`
                              : null}
                            <!-- sl-icon-button's label attribute is the accessible name only
                                 (it renders as aria-label, never title), so each action
                                 needs an explicit sl-tooltip to be readable on hover —
                                 same pattern as the section actions above. sl-tooltip is
                                 display:contents, so the flex row is unaffected. -->
                            <div class="layer-details-actions">
                              <sl-tooltip content="About this layer">
                                <sl-icon-button
                                  name="info-circle"
                                  label="About this layer"
                                  @click=${() => this.handleShowLayerInfo(item.layerId, item.label)}
                                ></sl-icon-button>
                              </sl-tooltip>
                              ${item.hasStyleDialog
                                ? html`<sl-tooltip content="Layer style">
                                    <sl-icon-button
                                      name="palette"
                                      label="Layer style"
                                      @click=${() => this.handleShowLayerStyle(item.layerId, item.label)}
                                    ></sl-icon-button>
                                  </sl-tooltip>`
                                : null}
                              ${item.hasExtent
                                ? html`<sl-tooltip content="Zoom to layer">
                                    <sl-icon-button
                                      name="arrows-fullscreen"
                                      label="Zoom to layer"
                                      @click=${() => this.handleZoomToLayer(item.layerId)}
                                    ></sl-icon-button>
                                  </sl-tooltip>`
                                : null}
                            </div>
                          `}
                      </div>
                    </div>
                  </div>
                  ${this.dropTargetLayerId === item.layerId && this.dropTargetPosition === 'below'
                    ? html`<div class="drop-indicator"></div>`
                    : null}
                `)}
              </div>
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
    // Pointer capture keeps the drag-handle "hovered" for the rest of the
    // drag regardless of where the cursor actually moves, so the tooltip
    // would otherwise sit open the whole time instead of just before the
    // grab. Hide it explicitly the moment the drag starts.
    void handle.closest('sl-tooltip')?.hide();

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

  private handlePermalink(): void {
    if (!this.adapter) return;
    const viewport = this.adapter.getViewportState();
    const mapLayers = this.adapter.store.getState().mapLayers;
    const allLayerIds = Object.keys(mapLayers); // bottom-to-top stack order
    const hiddenLayerIds = allLayerIds.filter(id => mapLayers[id]?.visible === false);
    const transparencyOverrides = new Map<string, number>();
    for (const [id, entry] of Object.entries(mapLayers)) {
      if (typeof entry.transparency === 'number' && entry.transparency !== 0) {
        transparencyOverrides.set(id, entry.transparency);
      }
    }
    const mapElement = this.closest('webmapx-map') ?? this.adapter as unknown as Element;
    const mapIndex = getMapDomIndex(mapElement as Element);
    const configUrl = getConfigUrlForIndex(mapIndex);
    const projection = this.adapter.getProjection?.()?.name ?? null;
    const terrainEnabled = this.adapter.isTerrainEnabled?.() === true;

    // The auto-managed terrain hillshade layer is implied by terrain:true — exclude it from
    // state.l so it isn't treated as a missing layer on restore.
    const permalinkLayerIds = terrainEnabled
      ? allLayerIds.filter(id => id !== Webmapx3dTool.TERRAIN_LAYER_ID)
      : allLayerIds;
    const permalinkHiddenIds = hiddenLayerIds.filter(id => id !== Webmapx3dTool.TERRAIN_LAYER_ID);

    // Detect layers added from file drops (marked dynamic:true in metadata) — can't restore from permalink
    const dynamicLayerIds = allLayerIds.filter(id => mapLayers[id]?.dynamic === true);

    // The map's clock travels with the link: a pinned moment, and the speed it
    // is playing at. A live map contributes nothing — "now" is not a value.
    const storeState = this.adapter.store.getState();
    const mapTime = storeState.mapTime;
    const time = mapTime?.mode === 'pinned'
      ? { at: mapTime.at, play: storeState.mapTimePlay ?? null }
      : null;

    const url = buildPermalinkUrl(mapIndex, permalinkLayerIds, permalinkHiddenIds, viewport, transparencyOverrides, projection, configUrl, terrainEnabled, time);
    this.permalinkDialog?.open(url, !!configUrl, dynamicLayerIds);
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
        sourceConfig: typeof metadata?.sourceId === 'string'
          ? this.adapter?.getSourceConfig(metadata.sourceId) ?? undefined
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

      const layerType = typeof metadata?.layerType === 'string' ? metadata.layerType : undefined;

      const item: LayerPanelItem = {
        layerId,
        label,
        layerType,
        topLevelGroup,
        visible: metadata?.visible !== false,
        hasExtent: this.layerHasExtent(layerId, metadata),
        hasStyleDialog: this.layerHasStyleDialog(metadata),
        outOfZoom: zoom < minz || zoom >= maxz + 1,
        beingEdited: metadata?.borrowedByDrawTool === true,
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

    // Rebuild layerTransparency from store (fallback to paint-derived value for hillshade)
    const newTransparency = new Map<string, number>();
    for (const layerId of orderedIds) {
      const metadata = mapLayers[layerId] as Record<string, unknown> | undefined;
      if (typeof metadata?.transparency === 'number') {
        newTransparency.set(layerId, metadata.transparency);
      } else if (metadata?.layerType === 'hillshade') {
        const exaggeration = Number((metadata?.paint as any)?.['hillshade-exaggeration'] ?? 1);
        newTransparency.set(layerId, Math.round((1 - exaggeration) * 100));
      }
    }
    this.layerTransparency = newTransparency;
  }

  private handleTransparencyChange(layerId: string, e: Event): void {
    this.applyTransparency(layerId, Number((e.target as HTMLInputElement).value));
  }

  private applyTransparency(layerId: string, transparency: number): void {
    if (!this.adapter) return;
    const current = this.adapter.store.getState().mapLayers;
    const entry = current[layerId];
    const meta = entry as Record<string, unknown> | undefined;
    if (meta?.layerType === 'hillshade') {
      // Hillshade uses exaggeration instead of opacity, so adapter.setLayerOpacity
      // (which mirrors transparency into the store itself) is not called here.
      if (entry) {
        this.adapter.store.dispatch({ mapLayers: { ...current, [layerId]: { ...entry, transparency } } }, 'UI');
      }
      const sublayers = meta?.sublayers as any[] | undefined;
      const primarySub = sublayers?.find((s: any) => s?.type === 'hillshade');
      const subLayerId = primarySub?.id ?? layerId;
      this.adapter.updateLayerStyle(layerId, subLayerId, { 'hillshade-exaggeration': (100 - transparency) / 100 });
    } else {
      this.adapter.setLayerOpacity(layerId, (100 - transparency) / 100);
    }
  }

  private beginEditTransparency(layerId: string): void {
    this.editingTransparencyLayerId = layerId;
    void this.updateComplete.then(() => {
      const input = this.shadowRoot?.querySelector<HTMLInputElement>('.opacity-value-input');
      input?.focus();
      input?.select();
    });
  }

  // Routed through here for both Enter (via the keydown handler below, which
  // just blurs) and a plain click-away blur, so editingTransparencyLayerId is
  // only ever cleared from this one place. Deliberately no Escape-to-cancel:
  // webmapx-tool-panel owns Escape via a document-level capture listener (see
  // its handleKeydown) and closes the whole panel before a local handler here
  // would ever see the key, so trying to special-case it here would silently
  // never fire — Escape falls through to the panel-close behavior instead,
  // which blurs this input via display:none and commits it like any blur.
  private commitTransparencyInput(layerId: string, e: Event): void {
    this.editingTransparencyLayerId = null;
    const raw = Number((e.target as HTMLInputElement).value);
    const fallback = this.layerTransparency.get(layerId) ?? 0;
    const clamped = Number.isFinite(raw) ? Math.min(100, Math.max(0, Math.round(raw))) : fallback;
    this.applyTransparency(layerId, clamped);
  }

  private handleTransparencyInputKeydown(e: KeyboardEvent): void {
    if (e.key === 'Enter') {
      (e.target as HTMLInputElement).blur();
    }
  }

  private async handleShowLayerInfo(layerId: string, fallbackLabel: string): Promise<void> {
    // Per webmapx's architecture contract, everything shown here comes from
    // store.mapLayers[layerId] — populated entirely from the `layer` object
    // passed to adapter.addLayer() by registerMapLayer(). No static config
    // lookups: discovered/inline layers (e.g. "Add layer from URL") have no
    // entry in any such config at all.
    const runtimeMetadata = this.adapter?.store.getState().mapLayers?.[layerId] as Record<string, unknown> | undefined;
    const title = (runtimeMetadata?.label as string | undefined) ?? fallbackLabel;
    const attribution = runtimeMetadata?.attribution as string | undefined;
    const abstract = runtimeMetadata?.abstract as string | undefined;
    const featureSummary = await this.getLayerFeatureSummary(layerId, runtimeMetadata);
    this.infoDialog?.open(title, abstract, attribution, featureSummary);
  }

  private handleShowLayerStyle(layerId: string, fallbackLabel: string): void {
    const runtimeMetadata = this.adapter?.store.getState().mapLayers?.[layerId] as Record<string, unknown> | undefined;
    const title = (runtimeMetadata?.label as string | undefined) ?? fallbackLabel;
    // The panel is data-first, but it opens first and reads after: a
    // vector-tile layer can take seconds to answer, and a button that does
    // nothing for that long reads as broken. It shows a spinner meanwhile and
    // fills itself in from `resample` below.
    this.styleDialog?.open({
      title,
      layerId,
      groups: [],
      // The panel builds a paint spec; putting it on the map is the adapter's
      // job, and `updateLayerStyle` is the one path that mirrors into every
      // engine. A sublayer id equal to the layer id addresses a standard
      // (non-composite) layer.
      apply: (subLayerId, paint) =>
        this.adapter?.updateLayerStyle(layerId, subLayerId || layerId, paint) ?? false,
      // Labels go on as a layer of their own, so they show up in the legend and
      // can be switched off there like anything else.
      // A tiled layer usually has no features yet when the panel opens; this
      // lets the panel look again until its tiles have arrived.
      resample: () => this.getLayerStyleGroups(
        layerId,
        this.adapter?.store.getState().mapLayers?.[layerId] as Record<string, unknown> | undefined,
      ),
      layers: {
        add: (config) => this.adapter?.addLayer(config as never) ?? false,
        remove: (id) => {
          if (this.adapter?.hasLayer?.(id)) this.adapter.removeLayer(id);
        },
        // Labels go on as a sublayer of the layer itself, so it keeps one
        // legend row, one delete button and one style panel.
        setExtraSubLayer: (id, sublayer) => this.adapter?.setExtraSubLayer(id, sublayer) ?? Promise.resolve(false),
      },
      // What the layer is made of decides which questions the panel can ask; a
      // raster has no features and no paint, so it gets its own branch.
      ...(typeof runtimeMetadata?.sourceId === 'string' && runtimeMetadata?.layerType === 'raster'
        ? {
          raster: {
            sourceId: runtimeMetadata.sourceId,
            sourceConfig: this.adapter?.getSourceConfig(runtimeMetadata.sourceId) ?? null,
          },
        }
        : {}),
      // A labels layer made here inherits the extent, so "zoom to layer" means
      // the same on its row as on the layer it came from.
      ...(Array.isArray(runtimeMetadata?.bounds) ? { bounds: runtimeMetadata.bounds as number[] } : {}),
      // A colouring the panel computes has no attribute of its own; for a source
      // held whole, it can be given one. `setSourceData` refuses anything that is
      // not a geojson source, which is exactly the right line.
      writeFeatures: (sourceId, features) =>
        this.adapter?.setSourceData(sourceId, { type: 'FeatureCollection', features }) ?? false,
      sourceControl: {
        setTiles: (sourceId, tiles) => this.adapter?.setSourceTiles(sourceId, tiles) ?? false,
        getTiles: (sourceId) => this.adapter?.getSourceTiles(sourceId) ?? null,
        setLayerOpacity: (opacity) => this.adapter?.setLayerOpacity(layerId, opacity),
      },
    });
  }

  /**
   * A feature-count/geometry-type summary of what the layer holds.
   *
   * Reads through the same helper as the style panel, so a vector-tile layer
   * gets a summary too — it used to be offered only for a source the engine
   * could hand over whole, which meant every tiled layer reported nothing at
   * all. A tiled read is what the map has drawn, and the summary says so rather
   * than passing it off as the whole dataset.
   */
  private async getLayerFeatureSummary(
    layerId: string,
    runtimeMetadata: Record<string, unknown> | undefined,
  ): Promise<string | undefined> {
    const sourceId = typeof runtimeMetadata?.sourceId === 'string' ? runtimeMetadata.sourceId : undefined;
    const sourceLayer = typeof runtimeMetadata?.sourceLayer === 'string' ? runtimeMetadata.sourceLayer : undefined;
    const { features, complete } = await sampleLayerFeatures(this.adapter, layerId, {
      sourceId,
      sourceLayer,
      sourceData: runtimeMetadata?.sourceData,
    });
    if (!features || features.length === 0) return undefined;
    const summary = summarizeGeoJSON({ type: 'FeatureCollection', features });
    return complete ? summary : `${summary} — loaded and visible on the map now`;
  }

  /** Cheap existence check (no coordinate walking) for whether "zoom to layer" should show. */
  private layerHasExtent(layerId: string, metadata: Record<string, unknown> | undefined): boolean {
    if (Array.isArray(metadata?.bounds) && metadata.bounds.length === 4) return true;
    return getLayerSourceRefs(layerId, metadata).some((candidates) =>
      candidates.some((sourceId) => this.adapter?.getSourceData(sourceId) !== null));
  }

  /**
   * A raster layer has no styleable sublayer, but it is not beyond styling: a
   * WMS draws its pictures on request and offers named styles, and every raster
   * has an opacity. The panel says which of those apply, so the button is
   * offered rather than the layer looking like it has no style at all.
   */
  private layerHasStyleDialog(metadata: Record<string, unknown> | undefined): boolean {
    if (this.getLayerStyleTargets('', metadata).length > 0) return true;
    return metadata?.layerType === 'raster';
  }

  private getLayerStyleTargets(layerId: string, metadata: Record<string, unknown> | undefined): SourceLayerTarget[] {
    const targets: SourceLayerTarget[] = [];
    if (Array.isArray(metadata?.sublayers) && metadata.sublayers.length > 0) {
      this.collectStyleTargetsFromSublayers(layerId, metadata.sublayers, targets);
    } else {
      const layerType = typeof metadata?.layerType === 'string' ? metadata.layerType : undefined;
      const sourceId = typeof metadata?.sourceId === 'string' ? metadata.sourceId : '';
      // Without the source layer a vector-tile source samples zero features.
      const sourceLayer = typeof metadata?.sourceLayer === 'string' ? metadata.sourceLayer : undefined;
      if (layerType && STYLE_DIALOG_LAYER_TYPES.has(layerType)) {
        const paint = (metadata?.paint && typeof metadata.paint === 'object') ? metadata.paint as Record<string, unknown> : undefined;
        targets.push({ id: layerId, type: layerType, sourceId, ...(paint ? { paint } : {}), ...(sourceLayer ? { sourceLayer } : {}) });
      }
    }
    return targets;
  }

  private collectStyleTargetsFromSublayers(layerId: string, sublayers: unknown, targets: SourceLayerTarget[]): void {
    if (!Array.isArray(sublayers)) return;
    for (const sublayer of sublayers) {
      if (!sublayer || typeof sublayer !== 'object') continue;
      const sub = sublayer as Record<string, unknown>;
      const type = typeof sub.type === 'string' ? sub.type : undefined;
      const id = typeof sub.id === 'string' && sub.id.length > 0 ? sub.id : type;
      const sourceKey = typeof sub.source === 'string' ? sub.source : '';
      const sourceId = sourceKey ? `${layerId}:${sourceKey}` : '';
      const sourceLayer = typeof sub['source-layer'] === 'string' ? sub['source-layer'] : undefined;
      if (type && id && STYLE_DIALOG_LAYER_TYPES.has(type)) {
        const paint = (sub.paint && typeof sub.paint === 'object') ? sub.paint as Record<string, unknown> : undefined;
        targets.push({ id, type, sourceId, ...(paint ? { paint } : {}), ...(sourceLayer ? { sourceLayer } : {}) });
      }
      this.collectStyleTargetsFromSublayers(layerId, sub.sublayers, targets);
    }
  }

  private async getLayerStyleGroups(layerId: string, metadata: Record<string, unknown> | undefined): Promise<SourceStyleGroup[]> {
    const targets = this.getLayerStyleTargets(layerId, metadata);
    const bySource = new Map<string, SourceLayerTarget[]>();
    for (const target of targets) {
      const sourceId = target.sourceId || 'unknown source';
      const group = bySource.get(sourceId) ?? [];
      group.push(target);
      bySource.set(sourceId, group);
    }

    const attrs = (metadata?.attributes && typeof metadata.attributes === 'object')
      ? metadata.attributes as { allowedAttributes?: string[]; deniedAttributes?: string[] }
      : {};
    const allowed = Array.isArray(attrs.allowedAttributes) ? new Set<string>(attrs.allowedAttributes) : null;
    const denied = Array.isArray(attrs.deniedAttributes) ? new Set<string>(attrs.deniedAttributes) : null;

    return Promise.all([...bySource.entries()].map(async ([sourceId, layers]) => {
      // One read path for every source type — the same `queryLayerFeatures` the
      // Analysis tool uses. See `utils/layer-features.ts` for why sampling by
      // source id was not it.
      const sourceLayer = layers.find((layer) => !!layer.sourceLayer)?.sourceLayer;
      const { features, complete: completeSourceData } = await sampleLayerFeatures(this.adapter, layerId, {
        sourceId,
        sourceLayer,
        sourceData: metadata?.sourceData,
      });
      let attributes = this.attributeInfo(features);
      if (allowed || denied) {
        attributes = attributes.filter(a =>
          (!denied || !denied.has(a.name)) &&
          (!allowed || allowed.has(a.name))
        );
      }
      return {
        sourceId,
        featureCountLabel: this.featureCountLabel(features, completeSourceData),
        featureCount: features?.length ?? null,
        // The panel classifies these; `completeData: false` is what makes it
        // warn that only what the map has drawn is being classified.
        features,
        completeData: completeSourceData,
        geometryTypes: this.geometryTypeLabels(features),
        attributes,
        // Both let the panel put labels on a tiled source: the source is
        // re-declared for the labels layer rather than its features copied.
        sourceLayer,
        sourceConfig: this.adapter?.getSourceConfig?.(sourceId) ?? null,
        featureRows: this.featureRows(features),
        layers: layers.map(({ sourceId: _sourceId, sourceLayer: _sourceLayer, ...layer }) => layer),
      };
    }));
  }

  private dedupeFeatures(features: GeoJSON.Feature[]): GeoJSON.Feature[] {
    const seen = new Set<string>();
    return features.filter((feature) => {
      const key = feature.id !== undefined
        ? `id:${String(feature.id)}`
        : JSON.stringify([feature.geometry, feature.properties ?? {}]);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  private featureCountLabel(features: GeoJSON.Feature[] | null, completeSourceData: boolean): string {
    if (!features) return 'Feature sample unavailable';
    const suffix = completeSourceData ? 'features' : 'loaded visible features';
    return `${features.length} ${suffix}`;
  }

  private geometryTypeLabels(features: GeoJSON.Feature[] | null): string[] {
    if (!features || features.length === 0) return ['geometry unknown'];
    const types = new Set<string>();
    for (const feature of features) {
      const type = feature.geometry?.type;
      if (type) types.add(type);
    }
    return types.size > 0 ? [...types].sort() : ['geometry unknown'];
  }

  private attributeInfo(features: GeoJSON.Feature[] | null): SourceAttributeInfo[] {
    if (!features) return [];
    const attributes = new Map<string, { values: unknown[]; presentCount: number }>();
    for (const feature of features.slice(0, 200)) {
      const properties = feature.properties;
      if (!properties || typeof properties !== 'object') continue;
      for (const [key, value] of Object.entries(properties)) {
        const entry = attributes.get(key) ?? { values: [], presentCount: 0 };
        if (value !== null && value !== undefined) {
          entry.values.push(value);
          entry.presentCount += 1;
        }
        attributes.set(key, entry);
      }
    }

    const inspectedFeatureCount = Math.min(features.length, 200);
    return [...attributes.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([name, entry]) => ({
        name,
        type: this.inferAttributeType(entry.values),
        values: entry.values,
        presentCount: entry.presentCount,
        missingCount: inspectedFeatureCount - entry.presentCount,
      }));
  }

  private featureRows(features: GeoJSON.Feature[] | null): Record<string, unknown>[] {
    if (!features) return [];
    return features.slice(0, 200).map((feature) =>
      feature.properties && typeof feature.properties === 'object'
        ? { ...feature.properties }
        : {});
  }

  private inferAttributeType(values: unknown[]): string {
    if (values.length === 0) return 'unknown';
    const types = new Set(values.map((value) => this.valueType(value)));
    return types.size === 1 ? [...types][0] : 'mixed';
  }

  private valueType(value: unknown): string {
    if (typeof value === 'number') return 'number';
    if (typeof value === 'boolean') return 'boolean';
    if (value instanceof Date) return 'date';
    if (Array.isArray(value)) return 'array';
    if (value && typeof value === 'object') return 'object';
    if (typeof value === 'string') {
      return this.looksLikeDate(value) ? 'date' : 'string';
    }
    return 'unknown';
  }

  private looksLikeDate(value: string): boolean {
    if (!/^\d{4}-\d{2}-\d{2}(?:[T ][\d:.+-Z]*)?$/.test(value)) return false;
    return !Number.isNaN(Date.parse(value));
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
    this.applyVisibleLayers(this.adapter.store.getState());
  }

  private isLegendCollapsed(layerId: string): boolean {
    const entry = this.store?.getState()?.mapLayers?.[layerId];
    const mode = entry?.legendExpandMode;
    if (mode === 'expanded') return false;
    if (mode === 'collapsed') return true;
    // 'auto' or undefined: expand only the topmost visible overlay layer
    const topmostVisible = this.overviewLayers.find(item => item.visible);
    return topmostVisible?.layerId !== layerId;
  }

  private handleCollapseToggle(layerId: string): void {
    if (!this.store) return;
    const current = this.store.getState();
    const entry = current.mapLayers?.[layerId];
    if (!entry) return;
    // Store the explicit user choice — not 'auto' anymore
    const nowCollapsed = this.isLegendCollapsed(layerId);
    const nextMode: 'expanded' | 'collapsed' = nowCollapsed ? 'expanded' : 'collapsed';
    this.store.dispatch({
      mapLayers: { ...current.mapLayers, [layerId]: { ...entry, legendExpandMode: nextMode } },
    }, 'UI');
  }

  private setAllLayersVisibility(visible: boolean): void {
    if (!this.adapter || !this.store) return;
    const currentLayers = this.store.getState().mapLayers;
    const updatedLayers = { ...currentLayers };
    for (const item of this.overviewLayers) {
      const entry = currentLayers[item.layerId];
      if (!entry || entry.visible === visible) continue;
      this.adapter.setLayerVisibility(item.layerId, visible);
      updatedLayers[item.layerId] = { ...entry, visible };
    }
    this.store.dispatch({ mapLayers: updatedLayers }, 'UI');
    this.applyVisibleLayers(this.store.getState());
  }

  private handleHideAllLayers(): void {
    this.setAllLayersVisibility(false);
  }

  private handleShowAllLayers(): void {
    this.setAllLayersVisibility(true);
  }

  private handleClearAllLayers(): void {
    this.clearLayersDialog?.open();
  }

  private handleConfirmClearAllLayers(): void {
    this.clearLayersDialog?.hide();
    if (!this.adapter) return;
    for (const item of this.overviewLayers) {
      this.adapter.removeLayer(item.layerId);
    }
    this.applyVisibleLayers(this.adapter.store.getState());
  }

  private handleVisibilityToggle(layerId: string): void {
    if (!this.adapter || !this.store) return;
    const currentLayers = this.store.getState().mapLayers;
    const entry = currentLayers[layerId];
    const nextVisible = entry?.visible === false; // toggle: false→true, undefined/true→false
    // adapter.setLayerVisibility mirrors `visible` into store.mapLayers itself.
    this.adapter.setLayerVisibility(layerId, nextVisible);
    this.applyVisibleLayers(this.store.getState());
  }
}
