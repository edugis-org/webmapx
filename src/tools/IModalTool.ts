/**
 * Interface for modal tools that capture map events exclusively.
 *
 * Modal tools are mutually exclusive - only one can be active at a time.
 * When a modal tool is activated, any other active modal tool is deactivated.
 *
 * @example
 * ```typescript
 * class MyTool extends WebmapxModalTool implements IModalTool {
 *   readonly toolId = 'my-tool';
 *   readonly isModal = true;
 *   // ... implementation
 * }
 * ```
 */
import type { ToolIconConfig } from '../config/types';

export interface IModalTool {
    /**
     * Tool type name (e.g. 'measure'). Hardcoded per component class.
     */
    readonly toolId: string;

    /**
     * Instance ID used by ToolManager for registration and activation.
     * Reads from the `tool-id` attribute; falls back to toolId.
     * Allows multiple instances of the same tool type in one map.
     */
    readonly instanceId: string;

    /**
     * Optional human-facing name for generated UI and active-tool state.
     */
    readonly label?: string;

    /**
     * Optional Shoelace icon metadata for generated UI.
     */
    readonly icon?: ToolIconConfig;

    /**
     * Whether this tool is modal (exclusive).
     * When true, activating this tool deactivates other modal tools.
     */
    readonly isModal: boolean;

    /**
     * Whether the tool is currently active.
     */
    active: boolean;

    /**
     * Optional CSS selector for portal rendering.
     * When set, tool content is moved to this target element.
     */
    renderTarget?: string;

    /**
     * Activate the tool.
     * Called by ToolManager or can be called directly.
     */
    activate(): void;

    /**
     * Deactivate the tool.
     * Called by ToolManager when another modal tool is activated,
     * or can be called directly.
     */
    deactivate(): void;
}
