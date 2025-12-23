/**
 * ToolManager - Central management for modal tools.
 *
 * Responsibilities:
 * - Register and unregister tools
 * - Manage mutual exclusion (only one modal tool active at a time)
 * - Dispatch activation/deactivation events
 * - Provide API for external activation (toggle, activate, deactivate)
 *
 * @example
 * ```typescript
 * // Access via map element
 * const map = document.querySelector('webmapx-map');
 * map.toolManager.toggle('measure');
 *
 * // Listen for tool changes
 * map.addEventListener('webmapx-tool-activated', (e) => {
 *   console.log('Tool activated:', e.detail.toolId);
 * });
 * ```
 */

import type { IModalTool } from './IModalTool';
import type { MapStateStore } from '../store/map-state-store';

export class ToolManager extends EventTarget {
    private tools: Map<string, IModalTool> = new Map();
    private _activeToolId: string | null = null;
    private store: MapStateStore | null = null;

    /**
     * Set the state store for syncing activeTool state.
     * Called by webmapx-map when ToolManager is created.
     */
    setStore(store: MapStateStore): void {
        this.store = store;
    }

    /**
     * Register a tool with the manager.
     * Tools auto-register when they connect to the map.
     */
    register(tool: IModalTool): void {
        if (this.tools.has(tool.toolId)) {
            console.warn(`Tool "${tool.toolId}" is already registered`);
            return;
        }
        this.tools.set(tool.toolId, tool);
    }

    /**
     * Unregister a tool from the manager.
     * Tools auto-unregister when they disconnect from the map.
     */
    unregister(toolId: string): void {
        // Deactivate if this was the active tool
        if (this._activeToolId === toolId) {
            this.deactivate();
        }
        this.tools.delete(toolId);
    }

    /**
     * Activate a tool by its ID.
     * If the tool is modal, deactivates any other active modal tool first.
     *
     * @returns true if the tool was activated, false if not found
     */
    activate(toolId: string): boolean {
        const tool = this.tools.get(toolId);
        if (!tool) {
            console.warn(`Tool "${toolId}" not found`);
            return false;
        }

        // If already active, do nothing
        if (this._activeToolId === toolId) {
            return true;
        }

        // Deactivate current tool if modal
        if (this._activeToolId && tool.isModal) {
            const currentTool = this.tools.get(this._activeToolId);
            if (currentTool) {
                currentTool.deactivate();
                this.dispatchDeactivatedEvent(this._activeToolId, currentTool);
            }
        }

        // Activate new tool
        this._activeToolId = toolId;
        tool.activate();

        // Update state store
        this.updateStoreActiveTool(toolId);

        // Dispatch event
        this.dispatchActivatedEvent(toolId, tool);

        return true;
    }

    /**
     * Deactivate the currently active tool, or a specific tool by ID.
     */
    deactivate(toolId?: string): void {
        const targetId = toolId ?? this._activeToolId;
        if (!targetId) {
            return;
        }

        const tool = this.tools.get(targetId);
        if (!tool) {
            return;
        }

        // Only deactivate if it's actually active
        if (this._activeToolId === targetId) {
            // Clear activeToolId BEFORE calling tool.deactivate()
            // This allows the tool to detect it's being called by ToolManager
            this._activeToolId = null;

            // Update state store
            this.updateStoreActiveTool(null);

            // Now deactivate the tool
            tool.deactivate();

            // Dispatch event
            this.dispatchDeactivatedEvent(targetId, tool);
        }
    }

    /**
     * Toggle a tool on/off.
     * If active, deactivates it. If inactive, activates it.
     *
     * @returns true if tool is now active, false if now inactive
     */
    toggle(toolId: string): boolean {
        if (this._activeToolId === toolId) {
            this.deactivate(toolId);
            return false;
        } else {
            return this.activate(toolId);
        }
    }

    /**
     * Get the currently active tool, or null if none.
     */
    get activeTool(): IModalTool | null {
        return this._activeToolId ? this.tools.get(this._activeToolId) ?? null : null;
    }

    /**
     * Get the ID of the currently active tool, or null if none.
     */
    get activeToolId(): string | null {
        return this._activeToolId;
    }

    /**
     * Get a tool by its ID.
     */
    getTool(toolId: string): IModalTool | undefined {
        return this.tools.get(toolId);
    }

    /**
     * Get all registered tool IDs.
     */
    getToolIds(): string[] {
        return Array.from(this.tools.keys());
    }

    // ─────────────────────────────────────────────────────────────────────
    // Private helpers
    // ─────────────────────────────────────────────────────────────────────

    private updateStoreActiveTool(toolId: string | null): void {
        if (this.store) {
            this.store.dispatch({ activeTool: toolId as 'measure' | 'feature-info' | null }, 'UI');
        }
    }

    private dispatchActivatedEvent(toolId: string, tool: IModalTool): void {
        this.dispatchEvent(new CustomEvent('webmapx-tool-activated', {
            detail: { toolId, tool }
        }));
    }

    private dispatchDeactivatedEvent(toolId: string, tool: IModalTool): void {
        this.dispatchEvent(new CustomEvent('webmapx-tool-deactivated', {
            detail: { toolId, tool }
        }));
    }
}
