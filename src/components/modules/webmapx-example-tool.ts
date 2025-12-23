/**
 * Example Modal Tool
 *
 * This is a minimal modal tool that demonstrates the WebMapX modal tool pattern.
 * Use this as a template when creating new modal tools.
 *
 * ## Key Concepts
 *
 * 1. **Extend WebmapxModalTool** (not WebmapxBaseTool) for modal/exclusive tools
 * 2. **Set a unique toolId** - used for registration and activation
 * 3. **Override onActivate()** - subscribe to map events, create layers, etc.
 * 4. **Override onDeactivate()** - cleanup: unsubscribe events, remove layers
 * 5. **Render your UI** - use `class="tool-content"` for portal support
 *
 * ## How Modal Tools Work
 *
 * - Only ONE modal tool can be active at a time
 * - When activated via ToolManager, other modal tools are automatically deactivated
 * - The tool receives map events (click, pointer-move, etc.) only when active
 * - Button states in toolbar are automatically synchronized
 *
 * ## Usage
 *
 * ```html
 * <!-- In toolbar -->
 * <sl-button name="example">Example</sl-button>
 *
 * <!-- In tool panel -->
 * <webmapx-example-tool></webmapx-example-tool>
 * ```
 *
 * Or activate programmatically:
 * ```javascript
 * const map = document.querySelector('webmapx-map');
 * map.toolManager.activate('example');
 * ```
 */

import { html, css, TemplateResult } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { WebmapxModalTool } from './webmapx-modal-tool';
import { IMapAdapter } from '../../map/IMapAdapter';
import type { ClickEvent } from '../../store/map-events';

import '@shoelace-style/shoelace/dist/components/button/button.js';

@customElement('webmapx-example-tool')
export class WebmapxExampleTool extends WebmapxModalTool {
    // ─────────────────────────────────────────────────────────────────────
    // IModalTool implementation (required)
    // ─────────────────────────────────────────────────────────────────────

    /**
     * Unique identifier for this tool.
     * Must match the 'name' attribute on the toolbar button.
     */
    readonly toolId = 'example';

    // ─────────────────────────────────────────────────────────────────────
    // Tool State
    // ─────────────────────────────────────────────────────────────────────

    /** Count of map clicks while tool is active */
    @state() private clickCount = 0;

    /** Last clicked coordinates */
    @state() private lastClick: [number, number] | null = null;

    // Event unsubscribe function
    private unsubClick: (() => void) | null = null;

    // ─────────────────────────────────────────────────────────────────────
    // Styles
    // ─────────────────────────────────────────────────────────────────────

    static styles = css`
        :host {
            display: block;
        }

        .example-container {
            padding: 1rem;
            font-size: 0.875rem;
        }

        .stat {
            display: flex;
            justify-content: space-between;
            padding: 0.5rem 0;
            border-bottom: 1px solid var(--sl-color-neutral-200);
        }

        .stat-label {
            color: var(--sl-color-neutral-600);
        }

        .stat-value {
            font-weight: 600;
            font-variant-numeric: tabular-nums;
        }

        .instructions {
            color: var(--sl-color-neutral-500);
            font-size: 0.75rem;
            font-style: italic;
            margin-top: 1rem;
        }

        .actions {
            margin-top: 1rem;
        }
    `;

    // ─────────────────────────────────────────────────────────────────────
    // Lifecycle Hooks
    // ─────────────────────────────────────────────────────────────────────

    /**
     * Called when the map adapter is attached.
     * Good place for one-time setup.
     */
    protected onMapAttached(adapter: IMapAdapter): void {
        super.onMapAttached(adapter);
        // One-time setup can go here
    }

    /**
     * Called when the tool becomes active.
     * Subscribe to map events, create visualization layers, etc.
     */
    protected onActivate(): void {
        // Reset state
        this.clickCount = 0;
        this.lastClick = null;

        // Subscribe to map events
        if (this.adapter) {
            this.unsubClick = this.adapter.events.on('click', this.handleMapClick.bind(this));
        }

        // Dispatch tool-specific event (optional)
        this.dispatchEvent(new CustomEvent('webmapx-example-activate', {
            bubbles: true,
            composed: true
        }));
    }

    /**
     * Called when the tool becomes inactive.
     * Unsubscribe from events, remove layers, cleanup state.
     */
    protected onDeactivate(): void {
        // Unsubscribe from map events
        this.unsubClick?.();
        this.unsubClick = null;

        // Dispatch tool-specific event (optional)
        this.dispatchEvent(new CustomEvent('webmapx-example-deactivate', {
            bubbles: true,
            composed: true
        }));
    }

    // ─────────────────────────────────────────────────────────────────────
    // Event Handlers
    // ─────────────────────────────────────────────────────────────────────

    /**
     * Handle map click events.
     * Only receives events when tool is active.
     */
    private handleMapClick(event: ClickEvent): void {
        this.clickCount++;
        this.lastClick = event.coords;
    }

    /**
     * Reset the click counter.
     */
    private handleReset(): void {
        this.clickCount = 0;
        this.lastClick = null;
    }

    // ─────────────────────────────────────────────────────────────────────
    // Rendering
    // ─────────────────────────────────────────────────────────────────────

    /**
     * Render the tool UI.
     *
     * IMPORTANT: Use `class="tool-content"` on the root container
     * for portal rendering support (render-target attribute).
     */
    protected render(): TemplateResult {
        return html`
            <div class="tool-content example-container">
                <div class="stat">
                    <span class="stat-label">Click count</span>
                    <span class="stat-value">${this.clickCount}</span>
                </div>

                ${this.lastClick ? html`
                    <div class="stat">
                        <span class="stat-label">Last click</span>
                        <span class="stat-value">
                            ${this.lastClick[0].toFixed(4)}, ${this.lastClick[1].toFixed(4)}
                        </span>
                    </div>
                ` : ''}

                <p class="instructions">
                    Click on the map to count clicks. This is a demonstration of a minimal modal tool.
                </p>

                <div class="actions">
                    <sl-button size="small" @click=${this.handleReset}>
                        Reset Counter
                    </sl-button>
                    <sl-button size="small" variant="text" @click=${() => this.deactivate()}>
                        Close Tool
                    </sl-button>
                </div>
            </div>
        `;
    }
}
