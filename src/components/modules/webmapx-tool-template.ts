// src/components/modules/webmapx-tool-template.ts

// Lit library imports
import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js'; // <- CRITICAL IMPORTS

import { store } from '../../store/central-state';
import { IAppState, StateSource } from '../../store/IState'; 
import { IGeoprocessingTool } from '../../map/IMapInterfaces'; 
import { mapAdapter } from '../../map/maplibre-adapter'; 


@customElement('webmapx-tool-template')
export class WebmapxToolTemplate extends LitElement {
    
    // FIX: Both properties must be decorated with @state() to exist on the component type
    @state()
    private bufferRadius: number = store.getState().bufferRadiusKm;

    @state() // <- THIS IS LIKELY THE MISSING DECORATOR
    private isToolActive: boolean = store.getState().currentTool === 'Buffer';

    private isSettingValue: boolean = false; 
    private geoToolService: IGeoprocessingTool = mapAdapter.geoprocessingTool;
    private unsubscribe: (() => void) | null = null;

    // Define component styles
    static styles = css`
        :host {
            position: relative;
            display: inline-flex;
            pointer-events: auto;
        }

        .tool-container {
            border: 1px solid var(--color-border);
            padding: 15px;
            background: var(--color-background-secondary);
            color: var(--color-text-primary);
            
            /* **BEST PRACTICE:** Use Flexbox for predictable, column-based stacking */
            display: flex;
            flex-direction: column;
            gap: 12px; /* Standard vertical separation */
        }
    `;

    connectedCallback(): void {
        super.connectedCallback();
        this.unsubscribe = store.subscribe(this.handleStateChange);
    }

    disconnectedCallback(): void {
        if (this.unsubscribe) {
            this.unsubscribe();
        }
        super.disconnectedCallback();
    }

    /**
     * Handles updates from the Central State Store, implementing Temporary Muting.
     */
    private handleStateChange = (state: IAppState, source: StateSource) => {
        // Implementation of Temporary Muting / Loop Prevention:
        // Ignore the state change if it came from 'UI' and this component *just* set it.
        if (source === 'UI' && this.isSettingValue) {
            return; 
        }

        // Update the Lit reactive property to trigger a re-render.
        this.bufferRadius = state.bufferRadiusKm;
    };
    
    /**
     * Handles user interaction with the slider (Dispatches Intent).
     */
    private handleSliderInput(event: Event) {
        const value = parseInt((event.target as HTMLInputElement).value);
        
        this.isSettingValue = true; 

        // 1. Dispatch Intent to the Central Store (updates the *state*)
        store.dispatch({ bufferRadiusKm: value }, 'UI'); 

        // 2. Dispatch Intent to the Adapter (tells the *map* to perform the action)
        this.geoToolService.setBufferRadius(value); 

        // Reset muting flag after a short delay
        setTimeout(() => { this.isSettingValue = false; }, 50); 
    }

    /**
     * Handles the tool toggle button (Dispatches Intent).
     */
    private handleToolToggle() {
        this.geoToolService.toggleTool();
    }

    /**
     * Lit's render method generates the component's internal HTML.
     */
    protected render() {
        return html`
            <div class="tool-container">
                <h3>Buffer Tool</h3>
                <label>Radius: ${this.bufferRadius} km</label>
                
                <sl-range
                    min="1" 
                    max="50" 
                    .value="${this.bufferRadius}" 
                    @sl-change="${this.handleSliderInput}"
                    tooltip="top"  ></sl-range>

                <sl-button 
                    @click="${this.handleToolToggle}"
                    variant="${this.isToolActive ? 'primary' : 'default'}"
                    outline
                >
                    Toggle Buffer Activation
                </sl-button>
            </div>
        `;
    }
}