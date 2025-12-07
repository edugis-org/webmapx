// src/components/modules/webmapx-tool-template.ts

// Lit library imports
import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js'; // <- CRITICAL IMPORTS

import { MapStateStore } from '../../store/map-state-store';
import { IAppState, StateSource } from '../../store/IState'; 
import { IToolService } from '../../map/IMapInterfaces'; 
import { resolveMapAdapter } from './map-context'; 


@customElement('webmapx-tool-template')
export class WebmapxToolTemplate extends LitElement {
    
    // FIX: Both properties must be decorated with @state() to exist on the component type
    @state()
    private bufferRadius: number = 0;

    @state() // <- THIS IS LIKELY THE MISSING DECORATOR
    private isToolActive: boolean = false;

    private isSettingValue: boolean = false; 
    private toolService: IToolService | null = null;
    private store: MapStateStore | null = null;
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
        this.bindToMap();
    }

    disconnectedCallback(): void {
        this.releaseStore();
        super.disconnectedCallback();
    }

    private bindToMap(): void {
        this.releaseStore();
        const adapter = resolveMapAdapter(this);
        if (!adapter) {
            return;
        }

        this.toolService = adapter.toolService;
        this.store = adapter.store;
        this.unsubscribe = this.store.subscribe(this.handleStateChange);
        this.bufferRadius = this.store.getState().bufferRadiusKm;
        this.isToolActive = this.store.getState().currentTool === 'Buffer';
    }

    private releaseStore(): void {
        if (this.unsubscribe) {
            this.unsubscribe();
            this.unsubscribe = null;
        }
        this.store = null;
        this.toolService = null;
    }

    /**
     * Handles updates from the Map State Store, implementing Temporary Muting.
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