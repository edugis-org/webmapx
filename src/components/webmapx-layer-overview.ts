import { css, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { WebmapxBaseTool } from './webmapx-base-tool';
import type { IAppState } from '../store/IState';
import type { IMap } from '../map/IMapInterfaces';
import type { LayerAddEvent, LayerRemoveEvent } from '../store/map-events';
import { buildLayerPanelSections, type LayerPanelItem } from '../utils/layer-panel-model';

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

  protected onStateChanged(state: IAppState): void {
    this.applyVisibleLayers(state.visibleLayers);
  }

  protected onMapAttached(adapter: IMap): void {
    this.unsubscribeLayerAdd = adapter.events.on('layer-add', (event: LayerAddEvent) => {
      this.applyVisibleLayers(event.visibleLayers);
    });
    this.unsubscribeLayerRemove = adapter.events.on('layer-remove', (event: LayerRemoveEvent) => {
      this.applyVisibleLayers(event.visibleLayers);
    });
    this.applyVisibleLayers(adapter.store.getState().visibleLayers);
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

  private applyVisibleLayers(visibleLayers: string[]): void {
    const sections = buildLayerPanelSections(this.catalogConfig, visibleLayers, this.backgroundGroupLabel);
    this.backgroundLayers = sections.background;
    this.overviewLayers = sections.overview;
  }
}
