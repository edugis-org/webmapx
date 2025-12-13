// src/components/modules/webmapx-zoom-level.ts

import { html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { WebmapxBaseTool } from './webmapx-base-tool';
import { IAppState } from '../../store/IState';
import { IMapAdapter } from '../../map/IMapAdapter';
import { ViewChangeEndEvent } from '../../store/map-events';

import '@shoelace-style/shoelace/dist/components/input/input.js';

/**
 * Zoom level display and input tool.
 *
 * This component demonstrates the event bus pattern:
 * - Listens to 'view-change-end' events for zoom updates (library-agnostic)
 * - Commands zoom changes via adapter.core.setZoom() (IMapCore interface)
 *
 * No MapZoomController dependency - works with any map library that
 * implements IMapAdapter and emits view-change events.
 */
@customElement('webmapx-zoom-level')
export class WebmapxZoomLevel extends WebmapxBaseTool {

    @state()
    private currentZoom: number | null = null;

    @state()
    private inputValue: string = '';

    private unsubscribeEvents: (() => void) | null = null;

    static styles = css`
        :host {
            position: relative;
            display: inline-flex;
            pointer-events: auto;
        }

        .tool-container {
            border: 1px solid var(--color-border);
            padding: var(--compact-padding-vertical) var(--compact-padding-horizontal);
            background: var(--color-background-secondary);
            opacity: var(--tool-background-opacity);
            color: var(--color-text-primary);
            display: inline-flex;
            align-items: center;
            gap: var(--compact-gap);
            font-size: var(--font-size-small);
        }

        sl-input {
            width: 4.5em;
            --sl-input-height-small: 1.8em;
            --sl-input-spacing-small: 0.2em;
            --sl-input-font-size-small: var(--font-size-small);
        }

        sl-input::part(base):hover,
        sl-input::part(base):focus-within {
            border-bottom-color: var(--color-primary);
            box-shadow: 0 1px 0 0 var(--color-primary);
        }

        sl-input::part(input) {
            padding: 0;
        }
    `;

    protected onMapAttached(adapter: IMapAdapter): void {
        // Subscribe to view-change-end events via the event bus
        this.unsubscribeEvents = adapter.events.on('view-change-end', (event: ViewChangeEndEvent) => {
            this.handleViewChange(event);
        });
    }

    protected onMapDetached(): void {
        // Clean up event subscription
        this.unsubscribeEvents?.();
        this.unsubscribeEvents = null;
    }

    protected onStateChanged(state: IAppState): void {
        // Initial sync from state store (for first load before events fire)
        if (state.zoomLevel != null && this.currentZoom === null) {
            this.currentZoom = state.zoomLevel;
            this.inputValue = this.currentZoom.toFixed(2);
        }
    }

    /**
     * Handle view-change-end events from the event bus.
     */
    private handleViewChange(event: ViewChangeEndEvent): void {
        this.currentZoom = event.zoom;
        this.inputValue = event.zoom.toFixed(2);
    }

    private handleInputChange(event: Event) {
        this.inputValue = (event.target as HTMLInputElement).value;
    }

    private handleInputSubmit(event: KeyboardEvent) {
        if (event.key === 'Enter') {
            this.dispatchZoomIntent();
        }
    }

    private handleInputBlur() {
        this.dispatchZoomIntent();
    }

    /**
     * Set zoom via IMapCore interface (library-agnostic command).
     */
    private dispatchZoomIntent() {
        if (!this.inputValue || !this.adapter) {
            return;
        }

        const zoomValue = parseFloat(this.inputValue);
        if (!isNaN(zoomValue) && zoomValue >= 0) {
            // Use IMapCore.setZoom() - works with any map library
            this.adapter.core.setZoom(zoomValue);
        }
    }

    protected render() {
        return html`
            <div class="tool-container">
                <label>Zoom:</label>

                <sl-input
                    .value="${this.inputValue}"
                    type="number"
                    min="1"
                    max="20"
                    step="0.01"
                    @sl-input="${this.handleInputChange}"
                    @keydown="${this.handleInputSubmit}"
                    @sl-blur="${this.handleInputBlur}"
                ></sl-input>
            </div>
        `;
    }
}
