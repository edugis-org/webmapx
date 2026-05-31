import { css, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { WebmapxBaseTool } from './webmapx-base-tool';
import type { IMapState } from '../store/IMapState';
import type { IMap } from '../map/IMapInterfaces';
import type { LayerAddEvent, LayerRemoveEvent } from '../store/map-events';

export interface LayerPanelItem {
  layerId: string;
  label: string;
  topLevelGroup: string | null;
}

@customElement('webmapx-layer-overview')
export class WebmapxLayerOverview extends WebmapxBaseTool {
  @property({ type: String, attribute: 'background-group-label' })
  backgroundGroupLabel = 'Base Maps';

  @property({ type: String, attribute: 'background-title' })
  backgroundTitle = 'Achtergrondlagen';

  @property({ type: String, attribute: 'overview-title' })
  overviewTitle = 'Gekozen kaartlagen';

  @state() private backgroundLayers: LayerPanelItem[] = [];
  @state() private overviewLayers: LayerPanelItem[] = [];
  private unsubscribeLayerAdd: (() => void) | null = null;
  private unsubscribeLayerRemove: (() => void) | null = null;

  static styles = css`
    :host {
      display: block;
      box-sizing: border-box;
      background: var(--color-background, #ffffff);
      color: var(--color-text-primary, #1f2937);
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
      color: var(--color-primary, #0f62fe);
    }

    .layer-list {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .layer-card {
      display: flex;
      align-items: center;
      justify-content: space-between;
      min-height: 2.75rem;
      padding: 0.75rem 0.875rem;
      border: 1px solid var(--color-border, #d7dce3);
      border-radius: 0.75rem;
      background: var(--color-background, #ffffff);
      box-shadow: 0 1px 3px rgba(15, 23, 42, 0.08);
      box-sizing: border-box;
    }

    .layer-label {
      min-width: 0;
      font-size: 0.95rem;
      line-height: 1.3;
      cursor: default;
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
  }

  render() {
    return html`
      <div class="panel">
        ${this.renderSection(this.overviewTitle, this.overviewLayers, 'Geen overzichtslagen zichtbaar.')}
        ${this.renderSection(this.backgroundTitle, this.backgroundLayers, 'Geen achtergrondlagen zichtbaar.')}
      </div>
    `;
  }

  private renderSection(title: string, items: LayerPanelItem[], emptyText: string) {
    return html`
      <section class="section">
        <h3 class="section-title">${title}</h3>
        ${items.length > 0
          ? html`
              <div class="layer-list">
                ${items.map((item) => html`
                  <div class="layer-card" data-layer-id=${item.layerId}>
                    <div class="layer-label">${item.label}</div>
                    ${item.topLevelGroup
                      ? html`<div class="layer-meta">${item.topLevelGroup}</div>`
                      : null}
                  </div>
                `)}
              </div>
            `
          : html`<div class="empty">${emptyText}</div>`}
      </section>
    `;
  }

  private applyVisibleLayers(state: IMapState): void {
    const visibleLayers = Array.isArray(state.visibleLayers) ? state.visibleLayers : [];
    const runtimeLayerMetadata = state.runtimeLayerMetadata ?? {};

    const mergedLayerIds: string[] = [];
    for (const layerId of visibleLayers) {
      if (!mergedLayerIds.includes(layerId)) {
        mergedLayerIds.push(layerId);
      }
    }
    for (const layerId of Object.keys(runtimeLayerMetadata)) {
      if (!mergedLayerIds.includes(layerId)) {
        mergedLayerIds.push(layerId);
      }
    }

    const orderedIds = [...mergedLayerIds].reverse();
    const background: LayerPanelItem[] = [];
    const overview: LayerPanelItem[] = [];
    const normalizedBackgroundGroupLabel = this.backgroundGroupLabel.trim().toLowerCase();

    for (const layerId of orderedIds) {
      const metadata = runtimeLayerMetadata[layerId] as Record<string, unknown> | undefined;
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
  }
}
