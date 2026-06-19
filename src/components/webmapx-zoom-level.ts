// src/components/webmapx-zoom-level.ts

import { html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { WebmapxBaseTool } from './webmapx-base-tool';
import { IMapState } from '../store/IMapState';
import type { IMap } from '../map/IMapInterfaces';
import { ViewChangeEndEvent } from '../store/map-events';


/**
 * Zoom level display and input tool.
 *
 * This component demonstrates the event bus pattern:
 * - Listens to 'view-change-end' events for zoom updates (library-agnostic)
 * - Commands zoom changes via map.setZoom() (IMap interface)
 *
 * No MapZoomController dependency - works with any map library that
 * implements IMap and emits view-change events.
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
            border: var(--webmapx-zoom-border, 1px solid var(--color-border));
            padding: var(--compact-padding-vertical) var(--compact-padding-horizontal);
            background: var(--webmapx-zoom-bg, var(--color-background-secondary));
            opacity: var(--tool-background-opacity);
            color: var(--webmapx-zoom-color, var(--color-text-primary));
            display: inline-flex;
            align-items: center;
            gap: var(--compact-gap);
            font-size: var(--webmapx-zoom-font-size, var(--font-size-small));
        }

        input[type="number"] {
            width: 3.4em;
            height: 1.8em;
            padding: 0 0.2em;
            font-size: var(--font-size-small);
            font-family: inherit;
            color: inherit;
            background: transparent;
            border: 1px solid var(--color-border);
            border-radius: var(--sl-input-border-radius-small, 3px);
            outline: none;
            -moz-appearance: textfield;
        }

        input[type="number"]:hover,
        input[type="number"]:focus {
            border-bottom-color: var(--color-primary);
            box-shadow: 0 1px 0 0 var(--color-primary);
        }

        input[type="number"]::-webkit-outer-spin-button,
        input[type="number"]::-webkit-inner-spin-button {
            -webkit-appearance: none;
            margin: 0;
        }
    `;

    protected onMapAttached(adapter: IMap): void {
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

    protected onStateChanged(state: IMapState): void {
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
     * Set zoom via IMap interface (library-agnostic command).
     */
    private dispatchZoomIntent() {
        if (!this.inputValue || !this.adapter) {
            return;
        }

        const zoomValue = parseFloat(this.inputValue);
        if (!isNaN(zoomValue) && zoomValue >= 0) {
            this.adapter.setZoom(zoomValue);
        }
    }

    protected render() {
        return html`
            <div class="tool-container">
                <label for="zoom-input">Zoom:</label>
                <input
                    id="zoom-input"
                    .value="${this.inputValue}"
                    type="number"
                    min="1"
                    max="20"
                    step="0.01"
                    @input="${this.handleInputChange}"
                    @keydown="${this.handleInputSubmit}"
                    @blur="${this.handleInputBlur}"
                />
            </div>
        `;
    }
}
