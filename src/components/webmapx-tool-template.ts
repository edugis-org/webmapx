// src/components/webmapx-tool-template.ts

// Lit library imports
import { html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js'; 

import { WebmapxBaseTool } from './webmapx-base-tool';
import { IMapState } from '../store/IMapState'; 
import type { IMap, IToolService } from '../map/IMapInterfaces'; 

import '@shoelace-style/shoelace/dist/components/range/range.js';
import '@shoelace-style/shoelace/dist/components/button/button.js';


@customElement('webmapx-tool-template')
export class WebmapxToolTemplate extends WebmapxBaseTool {
    
    @state()
    private bufferRadius: number = 0;

    @state()
    private isToolActive: boolean = false;

    private toolService: IToolService | null = null;

    static styles = css`
        :host {
            display: inline-flex;
            pointer-events: auto;
        }
        .tool-container {
            padding: var(--webmapx-tool-padding, 0);
            color: var(--color-text-primary);
            display: flex;
            flex-direction: column;
            gap: 6px;
            font-size: 0.8rem;
        }
        .tool-title {
            font-size: 0.7rem;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            color: var(--color-text-secondary, #666);
        }
        .radius-row {
            display: flex;
            align-items: center;
            gap: 6px;
        }
    `;

    protected onMapAttached(adapter: IMap): void {
        this.toolService = adapter.toolService;
    }

    protected onMapDetached(): void {
        this.toolService = null;
    }

    protected onStateChanged(state: IMapState): void {
        this.bufferRadius = state.bufferRadiusKm;
        this.isToolActive = state.activeTool?.toolId === 'Buffer';
    }
    
    /**
     * Handles user interaction with the slider (Dispatches Intent).
     */
    private handleSliderInput(event: Event) {
        const value = parseInt((event.target as HTMLInputElement).value);
        
        this.isSettingValue = true; 

        // 1. Dispatch Intent to the Map State Store (updates the *state*)
        if (!this.store || !this.toolService) {
            return;
        }

        this.store.dispatch({ bufferRadiusKm: value }, 'UI'); 

        // 2. Dispatch Intent to the Adapter (tells the *map* to perform the action)
        this.toolService.setBufferRadius(value); 

        // Reset muting flag after a short delay
        setTimeout(() => { this.isSettingValue = false; }, 50); 
    }

    /**
     * Handles the tool toggle button (Dispatches Intent).
     */
    private handleToolToggle() {
        this.toolService?.toggleTool();
    }

    /**
     * Lit's render method generates the component's internal HTML.
     */
    protected render() {
        return html`
            <div class="tool-container">
                <div class="tool-title">Template Tool — Buffer</div>
                <div class="radius-row">
                    <span>Radius: ${this.bufferRadius} km</span>
                    <sl-range
                        min="1"
                        max="50"
                        .value="${this.bufferRadius}"
                        @sl-change="${this.handleSliderInput}"
                        tooltip="top"
                        style="flex:1;min-width:80px"></sl-range>
                </div>
                <sl-button
                    size="small"
                    @click="${this.handleToolToggle}"
                    variant="${this.isToolActive ? 'primary' : 'default'}"
                    outline
                >Toggle Buffer</sl-button>
            </div>
        `;
    }
}
