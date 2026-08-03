import { css, html } from 'lit';
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
import type { WebmapxLayerInfoDialog } from './webmapx-layer-info-dialog';
import type { LayerStyleTarget, SourceAttributeInfo, SourceStyleGroup, WebmapxLayerStyleDialog } from './webmapx-layer-style-dialog';
import type { WebmapxSaveLayersDialog, SaveLayerCandidate } from './webmapx-save-layers-dialog';
import type { WebmapxPermalinkDialog } from './webmapx-permalink-dialog';
import { buildPermalinkUrl, getMapDomIndex, getConfigUrlForIndex } from '../utils/permalink';
import { Webmapx3dTool } from './webmapx-3d-tool';
import '@shoelace-style/shoelace/dist/components/icon/icon.js';
import '@shoelace-style/shoelace/dist/components/icon-button/icon-button.js';
import '@shoelace-style/shoelace/dist/components/tooltip/tooltip.js';
import '@shoelace-style/shoelace/dist/components/dialog/dialog.js';
import '@shoelace-style/shoelace/dist/components/button/button.js';
import type SlDialog from '@shoelace-style/shoelace/dist/components/dialog/dialog.js';

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
  @state() private dropTargetLayerId: string | null = null;
  @state() private dropTargetPosition: 'above' | 'below' | null = null;
  // Lazily-computed and cached extents — geojsonExtent() walks every coordinate, so it's
  // only run when the user clicks "zoom to layer", and per-source so composite layers
  // sharing a source don't recompute it for each sublayer.
  private sourceExtentCache: Map<string, [number, number, number, number] | null> = new Map();
  private layerExtentCache: Map<string, [number, number, number, number] | null> = new Map();
  @query('webmapx-layer-info-dialog') private infoDialog!: WebmapxLayerInfoDialog;
  @query('webmapx-layer-style-dialog') private styleDialog!: WebmapxLayerStyleDialog;
  @query('webmapx-save-layers-dialog') private saveLayersDialog!: WebmapxSaveLayersDialog;
  @query('webmapx-permalink-dialog') private permalinkDialog!: WebmapxPermalinkDialog;
  @query('#clear-all-layers-dialog') private clearAllLayersDialog!: SlDialog;
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
      gap: var(--webmapx-space-lg, 1rem);
      max-height: min(32rem, 100%);
      overflow-y: auto;
      padding: var(--webmapx-space-sm, 0.5rem);
      box-sizing: border-box;
    }

    .section {
      display: flex;
      flex-direction: column;
      gap: var(--webmapx-space-sm, 0.5rem);
    }

    .section-title {
      margin: 0;
      font-size: var(--webmapx-font-size-md, 0.95rem);
      font-weight: 700;
      color: var(--webmapx-legend-title-color, var(--color-primary, #0f62fe));
    }

    .layer-list {
      display: flex;
      flex-direction: column;
      gap: var(--webmapx-space-sm, 0.5rem);
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
      border: 1px solid var(--color-border, #d7dce3);
      border-radius: var(--webmapx-radius-lg, 0.75rem);
      background: var(--color-background, #ffffff);
      box-shadow: var(--webmapx-shadow-sm, 0 1px 3px rgba(15, 23, 42, 0.08));
      box-sizing: border-box;
    }

    .layer-row {
      display: flex;
      align-items: center;
      gap: var(--webmapx-space-xs, 0.25rem);
      width: 100%;
      touch-action: none;
    }

    /* Visual cue only — sits centered over the title, revealed on hover/focus */
    /* Reordering must stay within .layer-list, vertical-only (matches EduGIS):
       implement via pointer-based drag that translateY's the row, clamped to
       the list's bounding box and ignoring horizontal pointer movement —
       not native HTML5 DnD, whose drag image floats freely with the cursor. */
    .layer-label-drag {
      flex: 1;
      min-width: 0;
      cursor: grab;
      touch-action: none;
      position: relative;
    }

    .layer-label-drag:active {
      cursor: grabbing;
    }

    .layer-label-drag::after {
      content: 'Drag to change layer order';
      position: absolute;
      bottom: calc(100% + 5px);
      left: 0;
      background: var(--sl-tooltip-background-color, #1e293b);
      color: var(--sl-tooltip-color, #fff);
      font-size: var(--webmapx-font-size-sm, 0.72rem);
      line-height: 1.4;
      padding: 3px 8px;
      border-radius: var(--webmapx-radius-sm, 4px);
      white-space: nowrap;
      pointer-events: none;
      opacity: 0;
      z-index: 100;
    }

    .layer-label-drag:hover::after {
      animation: drag-tip 1.4s ease forwards;
    }

    @keyframes drag-tip {
      0%   { opacity: 0; }
      15%  { opacity: 1; }
      70%  { opacity: 1; }
      100% { opacity: 0; }
    }

    .visibility-toggle::part(base),
    .collapse-toggle::part(base),
    .layer-details-actions sl-icon-button::part(base) {
      font-size: var(--webmapx-font-size-md, 0.95rem);
      padding: 0;
    }

    .layer-legend-wrap {
      width: 100%;
    }

    .layer-label {
      font-size: var(--webmapx-font-size-md, 0.95rem);
      line-height: 1.3;
      white-space: normal;
      word-break: break-word;
    }
    /* When not draggable (single layer), label still fills row */
    .layer-row > .layer-label {
      flex: 1 1 auto;
      min-width: 0;
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

    .delete-layer::part(base) {
      color: var(--sl-color-danger-600, #dc2626);
    }

    .opacity-row {
      display: flex;
      align-items: center;
      gap: var(--webmapx-space-sm, 0.5rem);
      font-size: var(--webmapx-font-size-sm, 0.8rem);
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
      border-radius: var(--webmapx-radius-xs, 2px);
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
      border-radius: var(--webmapx-radius-xs, 2px);
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
      gap: var(--webmapx-space-xs, 0.4rem);
    }

    .layer-meta {
      font-size: var(--webmapx-font-size-sm, 0.75rem);
      color: var(--color-text-secondary, #6b7280);
      white-space: nowrap;
      margin-left: 0.75rem;
    }

    .layer-editing-notice {
      font-size: var(--webmapx-font-size-sm, 0.75rem);
      color: var(--color-text-secondary, #6b7280);
      font-style: italic;
      padding: var(--webmapx-space-xs, 0.25rem) var(--webmapx-space-md, 0.75rem) var(--webmapx-space-sm, 0.5rem);
    }

    .empty {
      padding: 0.875rem;
      border: 1px dashed var(--color-border, #d7dce3);
      border-radius: var(--webmapx-radius-lg, 0.75rem);
      color: var(--color-text-secondary, #6b7280);
      font-size: var(--webmapx-font-size-md, 0.875rem);
      background: var(--color-background-secondary, #f8fafc);
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

  render() {
    return html`
      <div class="panel">
        ${this.renderSection(this.overviewTitle, this.overviewLayers, 'No active layers.', true)}
        ${this.renderSection(this.backgroundTitle, this.backgroundLayers, 'No base map selected.')}
      </div>
      <webmapx-layer-info-dialog></webmapx-layer-info-dialog>
      <webmapx-layer-style-dialog></webmapx-layer-style-dialog>
      <webmapx-save-layers-dialog></webmapx-save-layers-dialog>
      <webmapx-permalink-dialog></webmapx-permalink-dialog>
      <sl-dialog id="clear-all-layers-dialog" label="Alle kaartlagen wissen">
        <p>Dit wist alle kaartlagen uit 'actieve lagen'. Sla zelfgemaakte lagen eerst op. Je kunt bestaande lagen weer openen via de kaartlagen knop.</p>
        <sl-button slot="footer" variant="default" @click=${() => this.clearAllLayersDialog.hide()}>Annuleren</sl-button>
        <sl-button slot="footer" variant="danger" @click=${() => this.handleConfirmClearAllLayers()}>Wissen</sl-button>
      </sl-dialog>
    `;
  }

  private renderSection(title: string, items: LayerPanelItem[], emptyText: string, isOverviewSection = false) {
    return html`
      <section class="section">
        <h3 class="section-title">${title}</h3>
        ${isOverviewSection
          ? html`
              <div class="save-layers-row">
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
        ${items.length > 0
          ? html`
              <div class="layer-list">
                ${items.map((item) => html`
                  ${this.dropTargetLayerId === item.layerId && this.dropTargetPosition === 'above'
                    ? html`<div class="drop-indicator"></div>`
                    : null}
                  <div class="layer-card" data-layer-id=${item.layerId}>
                    <div class="layer-row">
                      <sl-icon-button
                        class="visibility-toggle"
                        name=${item.visible ? 'eye' : 'eye-slash'}
                        label=${item.visible ? 'Hide layer' : 'Show layer'}
                        @click=${() => this.handleVisibilityToggle(item.layerId)}
                      ></sl-icon-button>
                      ${items.length > 1 ? html`
                        <span
                          class="layer-label-drag"
                          @pointerdown=${(e: PointerEvent) => this.onDragHandlePointerDown(e)}
                          @pointermove=${(e: PointerEvent) => this.onDragHandlePointerMove(e)}
                          @pointerup=${(e: PointerEvent) => this.onDragHandlePointerUp(e)}
                          @pointercancel=${(e: PointerEvent) => this.onDragHandlePointerUp(e)}
                        ><span class="layer-label ${item.outOfZoom ? 'out-of-zoom' : ''}">${item.label}${item.beingEdited ? html`&nbsp;<sl-icon name="pencil" title="Layer is currently being edited"></sl-icon>` : null}</span></span>
                      ` : html`<span class="layer-label ${item.outOfZoom ? 'out-of-zoom' : ''}">${item.label}${item.beingEdited ? html`&nbsp;<sl-icon name="pencil" title="Layer is currently being edited"></sl-icon>` : null}</span>`}
                      <sl-icon-button
                        class="collapse-toggle"
                        name=${this.isLegendCollapsed(item.layerId) ? 'chevron-right' : 'chevron-down'}
                        label=${this.isLegendCollapsed(item.layerId) ? 'Show layer details' : 'Hide layer details'}
                        @click=${() => this.handleCollapseToggle(item.layerId)}
                      ></sl-icon-button>
                    </div>
                    <div class="layer-details ${this.isLegendCollapsed(item.layerId) ? 'collapsed' : ''}">
                      <div class="layer-details-inner">
                        ${item.beingEdited
                          ? html`<div class="layer-editing-notice">editing</div>`
                          : html`
                            ${item.visible
                              ? html`
                                  <div class="opacity-row">
                                    <sl-icon name="circle-half"></sl-icon>
                                    <input
                                      type="range"
                                      aria-label=${`Transparency of ${item.label}`}
                                      min="0"
                                      max="100"
                                      .value=${String(this.layerTransparency.get(item.layerId) ?? 0)}
                                      @input=${(e: Event) => this.handleTransparencyChange(item.layerId, e)}
                                    />
                                    <span class="opacity-value">${this.layerTransparency.get(item.layerId) ?? 0}%</span>
                                  </div>
                                  <div class="layer-legend-wrap" style=${item.layerType === 'hillshade' ? '' : `opacity: ${(100 - (this.layerTransparency.get(item.layerId) ?? 0)) / 100}`}>
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
                              ${item.hasStyleDialog
                                ? html`<sl-icon-button
                                    name="palette"
                                    label="Layer style"
                                    @click=${() => this.handleShowLayerStyle(item.layerId, item.label)}
                                  ></sl-icon-button>`
                                : null}
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

    const url = buildPermalinkUrl(mapIndex, permalinkLayerIds, permalinkHiddenIds, viewport, transparencyOverrides, projection, configUrl, terrainEnabled);
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
    if (!this.adapter) return;
    const transparency = Number((e.target as HTMLInputElement).value);
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

  private handleShowLayerStyle(layerId: string, fallbackLabel: string): void {
    const runtimeMetadata = this.adapter?.store.getState().mapLayers?.[layerId] as Record<string, unknown> | undefined;
    const title = (runtimeMetadata?.label as string | undefined) ?? fallbackLabel;
    this.styleDialog?.open(title, this.getLayerStyleGroups(layerId, runtimeMetadata));
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

  private layerHasStyleDialog(metadata: Record<string, unknown> | undefined): boolean {
    return this.getLayerStyleTargets('', metadata).length > 0;
  }

  private getLayerStyleTargets(layerId: string, metadata: Record<string, unknown> | undefined): SourceLayerTarget[] {
    const targets: SourceLayerTarget[] = [];
    if (Array.isArray(metadata?.sublayers) && metadata.sublayers.length > 0) {
      this.collectStyleTargetsFromSublayers(layerId, metadata.sublayers, targets);
    } else {
      const layerType = typeof metadata?.layerType === 'string' ? metadata.layerType : undefined;
      const sourceId = typeof metadata?.sourceId === 'string' ? metadata.sourceId : '';
      if (layerType && STYLE_DIALOG_LAYER_TYPES.has(layerType)) {
        targets.push({ id: layerId, type: layerType, sourceId });
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
        targets.push({ id, type, sourceId, ...(sourceLayer ? { sourceLayer } : {}) });
      }
      this.collectStyleTargetsFromSublayers(layerId, sub.sublayers, targets);
    }
  }

  private getLayerStyleGroups(layerId: string, metadata: Record<string, unknown> | undefined): SourceStyleGroup[] {
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

    return [...bySource.entries()].map(([sourceId, layers]) => {
      const features = this.sampleSourceFeatures(sourceId, layers, metadata);
      const completeSourceData = this.hasCompleteSourceData(sourceId, metadata);
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
        geometryTypes: this.geometryTypeLabels(features),
        attributes,
        featureRows: this.featureRows(features),
        layers: layers.map(({ sourceId: _sourceId, sourceLayer: _sourceLayer, ...layer }) => layer),
      };
    });
  }

  private sampleSourceFeatures(
    sourceId: string,
    layers: SourceLayerTarget[],
    metadata: Record<string, unknown> | undefined,
  ): GeoJSON.Feature[] | null {
    const sourceData = this.adapter?.getSourceData(sourceId);
    if (sourceData && typeof sourceData === 'object' && Array.isArray((sourceData as GeoJSON.FeatureCollection).features)) {
      return (sourceData as GeoJSON.FeatureCollection).features ?? [];
    }
    if (metadata?.sourceData && typeof metadata.sourceData === 'object' && sourceId !== 'unknown source') {
      return (metadata.sourceData as GeoJSON.FeatureCollection).features ?? [];
    }

    const sourceLayers = [...new Set(layers.map((layer) => layer.sourceLayer).filter((value): value is string => !!value))];
    if (sourceLayers.length > 0) {
      const features: GeoJSON.Feature[] = [];
      for (const sourceLayer of sourceLayers) {
        features.push(...(this.adapter?.querySourceFeatures?.(sourceId, { sourceLayer })?.features ?? []));
      }
      return features.length > 0 ? this.dedupeFeatures(features) : null;
    }
    return this.adapter?.querySourceFeatures?.(sourceId)?.features ?? null;
  }

  private hasCompleteSourceData(sourceId: string, metadata: Record<string, unknown> | undefined): boolean {
    const sourceData = this.adapter?.getSourceData(sourceId);
    if (sourceData && typeof sourceData === 'object' && Array.isArray((sourceData as GeoJSON.FeatureCollection).features)) {
      return true;
    }
    return !!(metadata?.sourceData && typeof metadata.sourceData === 'object');
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
    this.clearAllLayersDialog?.show();
  }

  private handleConfirmClearAllLayers(): void {
    this.clearAllLayersDialog?.hide();
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
