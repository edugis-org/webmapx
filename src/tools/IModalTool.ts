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
export interface IModalTool {
    /**
     * Unique identifier for this tool.
     * Used by ToolManager for registration and activation.
     */
    readonly toolId: string;

    /**
     * Whether this tool is modal (exclusive).
     * When true, activating this tool deactivates other modal tools.
     */
    readonly isModal: boolean;

    /**
     * Whether the tool is currently active.
     */
    readonly active: boolean;

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
