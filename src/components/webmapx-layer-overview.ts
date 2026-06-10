import { css, html } from 'lit';
import { customElement, property, state, query } from 'lit/decorators.js';
import { WebmapxBaseTool } from './webmapx-base-tool';
import type { IMapState } from '../store/IMapState';
import type { IMap } from '../map/IMapInterfaces';
import type { AnyLayerConfig, SourceConfig } from '../config/types';
import { resolveLayerAttribution } from '../utils/attribution-format';
import type { LayerAddEvent, LayerRemoveEvent } from '../store/map-events';
import './webmapx-layer-legend';
import './webmapx-layer-info-dialog';
import type { WebmapxLayerInfoDialog } from './webmapx-layer-info-dialog';
import '@shoelace-style/shoelace/dist/components/icon/icon.js';
import '@shoelace-style/shoelace/dist/components/icon-button/icon-button.js';
import '@shoelace-style/shoelace/dist/components/button/button.js';

export interface LayerPanelItem {
  layerId: string;
  label: string;
  topLevelGroup: string | null;
  visible: boolean;
}

@customElement('webmapx-layer-overview')
export class WebmapxLayerOverview extends WebmapxBaseTool {
  @property({ type: String, attribute: 'background-group-label' })
  backgroundGroupLabel = 'Base Maps';

  @property({ type: String, attribute: 'background-title' })
  backgroundTitle = 'Base maps';

  @property({ type: String, attribute: 'overview-title' })
  overviewTitle = 'Active layers';

  @state() private backgroundLayers: LayerPanelItem[] = [];
  @state() private overviewLayers: LayerPanelItem[] = [];
  @state() private hiddenLayerIds: Set<string> = new Set();
  @state() private collapsedLayerIds: Set<string> = new Set();
  @state() private layerTransparency: Map<string, number> = new Map();
  @state() private transparencyValueVisible: Set<string> = new Set();
  private transparencyHideTimers: Map<string, number> = new Map();
  @query('webmapx-layer-info-dialog') private infoDialog!: WebmapxLayerInfoDialog;
  private unsubscribeLayerAdd: (() => void) | null = null;
  private unsubscribeLayerRemove: (() => void) | null = null;

  // Visual-only drag tracking — vertical-only translateY clamped to the
  // surrounding .layer-list, mirroring EduGIS's pointer-track behavior.
  // No reordering is performed yet; the row snaps back on release.
  private dragState: {
    card: HTMLElement;
    startClientY: number;
    minTranslate: number;
    maxTranslate: number;
    scroller: HTMLElement | null;
    startScrollTop: number;
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
                      <span class="layer-label" title=${item.label}>${item.label}</span>
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
                `)}
              </div>
              ${isOverviewSection
                ? html`
                    <div class="save-layers-row">
                      <sl-button size="small" variant="default">
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
    this.dragState = {
      card,
      startClientY: e.clientY,
      minTranslate: listRect.top - cardRect.top,
      maxTranslate: listRect.bottom - cardRect.bottom,
      scroller,
      startScrollTop: scroller?.scrollTop ?? 0,
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
  }

  private onDragHandlePointerUp(e: PointerEvent): void {
    if (!this.dragState) return;
    const handle = e.currentTarget as HTMLElement;
    if (handle.hasPointerCapture?.(e.pointerId)) {
      handle.releasePointerCapture(e.pointerId);
    }
    const { card } = this.dragState;
    card.style.transform = '';
    card.classList.remove('dragging');
    this.dragState = null;
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

      const item: LayerPanelItem = {
        layerId,
        label,
        topLevelGroup,
        visible: !this.hiddenLayerIds.has(layerId),
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

  private findLayerConfig(layerId: string): AnyLayerConfig | undefined {
    return this.layerDataConfig?.layers?.find(l => l.id === layerId)
      ?? this.catalogConfig?.layers?.find(l => l.id === layerId);
  }

  private buildSourcesById(): Map<string, SourceConfig> {
    const sourcesById = new Map<string, SourceConfig>();
    for (const source of this.layerDataConfig?.sources ?? this.catalogConfig?.sources ?? []) {
      sourcesById.set(source.id, source);
    }
    return sourcesById;
  }

  private handleShowLayerInfo(layerId: string, fallbackLabel: string): void {
    const config = this.findLayerConfig(layerId);
    const title = config?.title ?? fallbackLabel;
    const attribution = resolveLayerAttribution(config, this.buildSourcesById());
    this.infoDialog?.open(title, config?.metadata?.abstract, attribution);
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
