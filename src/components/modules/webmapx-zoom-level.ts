// src/components/modules/webmapx-zoom-level.ts

import { html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { WebmapxBaseTool } from './webmapx-base-tool';
import { IAppState } from '../../store/IState'; 
import { IMapZoomController } from '../../map/IMapInterfaces';
import { IMapAdapter } from '../../map/IMapAdapter';

@customElement('webmapx-zoom-level')
export class WebmapxZoomLevel extends WebmapxBaseTool {
    
    @state()
    private currentZoom: number | null = null;

    // Use string for the input field value
    @state()
    private inputValue: string = '';

    private zoomController: IMapZoomController | null = null;

    static styles = css`
        :host {
            position: relative;
            display: inline-flex;
            pointer-events: auto;
        }

        .tool-container {
            border: 1px solid var(--color-border);
            /* Use defined padding variables (which should ideally be in em or derived units) */
            padding: var(--compact-padding-vertical) var(--compact-padding-horizontal);
            
            /* Apply background color; transparency can be tuned via the opacity variable */
            background: var(--color-background-secondary);
            opacity: var(--tool-background-opacity);
            
            color: var(--color-text-primary);
            display: inline-flex;
            align-items: center;
            gap: var(--compact-gap);
            
            /* Apply the small font size */
            font-size: var(--font-size-small); 
        }
        
        sl-input {
            /* 💡 FIX: Use EM units for width based on font size. 4.5em is enough space 
               for a 4-digit number (e.g., 99.99) plus internal padding. */
            width: 4.5em; 
            
            /* 🛠️ FIX: Target the Shoelace input's internal parts for compactness using EM units */
            /* These properties control the component's derived height and padding */
            --sl-input-height-small: 1.8em; /* Roughly 20px at 12px font size */
            --sl-input-spacing-small: 0.2em; /* Roughly 2px internal padding */
            --sl-input-font-size-small: var(--font-size-small); 
        }
        
        /* Apply the blue bottom line on hover/focus using Shoelace parts */
        sl-input::part(base):hover, 
        sl-input::part(base):focus-within {
            /* This mimics the hover effect desired by adding a border/box-shadow */
            border-bottom-color: var(--color-primary); 
            box-shadow: 0 1px 0 0 var(--color-primary);
        }
        
        /* Style the actual input element */
        sl-input::part(input) {
            padding: 0; /* Remove internal padding to ensure compactness is driven by --sl-input-spacing-small */
        }
    `;

    protected onMapAttached(adapter: IMapAdapter): void {
        this.zoomController = adapter.zoomController;
    }

    protected onMapDetached(): void {
        this.zoomController = null;
    }

    protected onStateChanged(state: IAppState): void {
        this.syncFromState(state);
    }

    private syncFromState(state: IAppState): void {
        if (state.zoomLevel == null) {
            return;
        }
        this.currentZoom = state.zoomLevel;
        this.inputValue = this.currentZoom.toFixed(2);
    }
    
    private handleInputChange(event: Event) {
        // Keep the input field synced with what the user types
        this.inputValue = (event.target as HTMLInputElement).value;
    }

    /**
     * Handles the 'Enter' key press on the input field.
     */
    private handleInputSubmit(event: KeyboardEvent) {
        if (event.key === 'Enter') {
            this.dispatchZoomIntent();
        }
    }
    
    /**
     * Called by the throttle function when the user 'waits long enough' 
     * (the throttled function is set up in the MapZoomController service).
     * Shoelace sl-input fires 'sl-input' continuously and 'sl-change' on blur/enter.
     */
    private handleInputBlur() {
        this.dispatchZoomIntent();
    }
    
    private dispatchZoomIntent() {
        if (!this.inputValue) {
            return;
        }

        const zoomValue = parseFloat(this.inputValue);
        if (!isNaN(zoomValue) && zoomValue >= 0) {
            this.zoomController?.setZoom(zoomValue); 
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
