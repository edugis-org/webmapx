/**
 * WebmapxModalTool - Base class for modal tools.
 *
 * Modal tools are mutually exclusive - only one can be active at a time.
 * Extend this class to create tools that capture map events exclusively.
 *
 * Key features:
 * - Auto-registers with ToolManager on map attach
 * - Handles activation/deactivation lifecycle
 * - Supports portal rendering via render-target attribute
 *
 * @example
 * ```typescript
 * @customElement('my-tool')
 * export class MyTool extends WebmapxModalTool {
 *   toolId = 'my-tool';
 *
 *   protected onActivate(): void {
 *     // Subscribe to map events, create layers, etc.
 *   }
 *
 *   protected onDeactivate(): void {
 *     // Cleanup: unsubscribe events, remove layers, etc.
 *   }
 *
 *   render() {
 *     return html`<div class="tool-content">...</div>`;
 *   }
 * }
 * ```
 */

import { property } from 'lit/decorators.js';
import { WebmapxBaseTool } from './webmapx-base-tool';
import { IAppState } from '../../store/IState';
import { IMapAdapter } from '../../map/IMapAdapter';
import type { IModalTool } from '../../tools/IModalTool';
import type { ToolManager } from '../../tools/tool-manager';
import type { WebmapxMapElement } from './webmapx-map';
import { resolveMapElement } from './map-context';

export abstract class WebmapxModalTool extends WebmapxBaseTool implements IModalTool {
    // ─────────────────────────────────────────────────────────────────────
    // IModalTool implementation
    // ─────────────────────────────────────────────────────────────────────

    /**
     * Unique identifier for this tool.
     * Must be set by subclass. Used for ToolManager registration.
     */
    abstract readonly toolId: string;

    /**
     * Whether this tool is modal (exclusive).
     * Always true for WebmapxModalTool subclasses.
     */
    readonly isModal: boolean = true;

    /**
     * Whether the tool is currently active.
     */
    @property({ type: Boolean, reflect: true })
    get active(): boolean {
        return this._active;
    }
    set active(value: boolean) {
        const oldValue = this._active;
        if (value === oldValue) return;

        this._active = value;

        if (value) {
            this.onActivate();
        } else {
            this.onDeactivate();
        }

        this.requestUpdate('active', oldValue);
    }
    private _active = false;

    /**
     * Optional CSS selector for portal rendering.
     * When set, tool content is moved to this target element.
     */
    @property({ type: String, attribute: 'render-target' })
    renderTarget?: string;

    /**
     * When false, the tool will not register with ToolManager.
     * Useful for external tool instances that should not be modal.
     */
    @property({ type: Boolean, attribute: 'register-with-toolmanager' })
    registerWithToolManager = true;

    // ─────────────────────────────────────────────────────────────────────
    // Internal state
    // ─────────────────────────────────────────────────────────────────────

    private portalContainer: HTMLElement | null = null;
    private toolManager: ToolManager | null = null;

    // ─────────────────────────────────────────────────────────────────────
    // Lifecycle
    // ─────────────────────────────────────────────────────────────────────

    protected onMapAttached(adapter: IMapAdapter): void {
        super.onMapAttached(adapter);

        // Register with ToolManager
        const mapHost = resolveMapElement(this) as WebmapxMapElement & { toolManager?: ToolManager } | null;
        if (this.registerWithToolManager && mapHost?.toolManager) {
            this.toolManager = mapHost.toolManager;
            this.toolManager.register(this);
        }
    }

    protected onMapDetached(): void {
        // Unregister from ToolManager
        if (this.toolManager) {
            this.toolManager.unregister(this.toolId);
            this.toolManager = null;
        }

        super.onMapDetached();
    }

    /**
     * Handle state changes from the store.
     * Modal tools don't need to react to external state changes
     * since ToolManager handles coordination.
     */
    protected onStateChanged(_state: IAppState): void {
        // No-op by default. Subclasses can override if needed.
    }

    protected updated(changedProperties: Map<string | number | symbol, unknown>): void {
        super.updated(changedProperties);

        // Handle portal rendering
        if (changedProperties.has('renderTarget') || changedProperties.has('active')) {
            this.updatePortal();
        }
    }

    // ─────────────────────────────────────────────────────────────────────
    // Public API (called by ToolManager or directly)
    // ─────────────────────────────────────────────────────────────────────

    /**
     * Activate this tool.
     * Can be called by ToolManager or directly.
     * When called directly, it will coordinate with ToolManager if available.
     */
    activate(): void {
        if (this._active) return;

        // Check if we're being called by ToolManager (it will have already set itself as active)
        const calledByToolManager = this.toolManager?.activeToolId === this.toolId;

        if (this.registerWithToolManager && this.toolManager && !calledByToolManager) {
            // Called directly by user code - delegate to ToolManager for coordination
            this.toolManager.activate(this.toolId);
            return;
        }

        // Actually activate (called by ToolManager, or no ToolManager available)
        this.active = true;
    }

    /**
     * Deactivate this tool.
     */
    deactivate(): void {
        if (!this._active) return;

        // Check if we're being called by ToolManager
        const calledByToolManager = this.toolManager?.activeToolId !== this.toolId;

        if (this.registerWithToolManager && this.toolManager && !calledByToolManager) {
            // Called directly by user code - delegate to ToolManager for coordination
            this.toolManager.deactivate(this.toolId);
            return;
        }

        // Actually deactivate (called by ToolManager, or no ToolManager available)
        this.active = false;
    }

    /**
     * Toggle this tool on/off.
     */
    toggle(): void {
        if (this.registerWithToolManager && this.toolManager) {
            this.toolManager.toggle(this.toolId);
        } else if (this._active) {
            this.deactivate();
        } else {
            this.activate();
        }
    }

    // ─────────────────────────────────────────────────────────────────────
    // Lifecycle hooks for subclasses
    // ─────────────────────────────────────────────────────────────────────

    /**
     * Called when the tool is activated.
     * Override to subscribe to map events, create layers, etc.
     */
    protected onActivate(): void {
        // Override in subclass
    }

    /**
     * Called when the tool is deactivated.
     * Override to cleanup: unsubscribe events, remove layers, etc.
     */
    protected onDeactivate(): void {
        // Override in subclass
    }

    // ─────────────────────────────────────────────────────────────────────
    // Portal rendering
    // ─────────────────────────────────────────────────────────────────────

    /**
     * Update portal rendering based on renderTarget and active state.
     */
    private updatePortal(): void {
        if (!this.renderTarget) {
            // No portal - restore content to shadow DOM if needed
            this.restoreContent();
            return;
        }

        const target = document.querySelector(this.renderTarget);
        if (!target) {
            console.warn(`[${this.toolId}] Render target "${this.renderTarget}" not found`);
            return;
        }

        if (this.active) {
            // Move content to target
            const content = this.shadowRoot?.querySelector('.tool-content');
            if (content) {
                target.innerHTML = '';
                target.appendChild(content);
                this.portalContainer = target as HTMLElement;
            }
        } else if (this.portalContainer) {
            // Clear portal when deactivated
            this.portalContainer.innerHTML = '';
        }
    }

    /**
     * Restore content from portal back to shadow DOM.
     */
    private restoreContent(): void {
        if (this.portalContainer) {
            const content = this.portalContainer.querySelector('.tool-content');
            if (content && this.shadowRoot) {
                this.shadowRoot.appendChild(content);
            }
            this.portalContainer.innerHTML = '';
            this.portalContainer = null;
        }
    }
}
