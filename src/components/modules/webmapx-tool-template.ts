// src/components/modules/webmapx-tool-template.ts

// Lit library imports
import { html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js'; 

import { WebmapxBaseTool } from './webmapx-base-tool';
import { IAppState } from '../../store/IState'; 
import { IToolService } from '../../map/IMapInterfaces'; 
import { IMapAdapter } from '../../map/IMapAdapter';


@customElement('webmapx-tool-template')
export class WebmapxToolTemplate extends WebmapxBaseTool {
    
    @state()
    private bufferRadius: number = 0;

    @state()
    private isToolActive: boolean = false;

    private toolService: IToolService | null = null;

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

    protected onMapAttached(adapter: IMapAdapter): void {
        this.toolService = adapter.toolService;
    }

    protected onMapDetached(): void {
        this.toolService = null;
    }

    protected onStateChanged(state: IAppState): void {
        this.bufferRadius = state.bufferRadiusKm;
        this.isToolActive = state.currentTool === 'Buffer';
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
