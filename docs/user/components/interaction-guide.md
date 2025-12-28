# Toolbar and Tool Panel Interaction

The `webmapx-toolbar` and `webmapx-tool-panel` components are designed to work together. The panel now listens to toolbar and modal tool events directly, so the application no longer needs to wire them together.

## How it Works

1.  **Identification**: Each button in the toolbar must have a unique identifier, set via the `name` or `data-tool` attribute. Tool panel children should set `tool-id` to the same value.
    ```html
    <sl-button name="layers">...</sl-button>
    <webmapx-layer-tree tool-id="layers"></webmapx-layer-tree>
    ```

2.  **Selection Event**: When a user clicks a button, the toolbar emits a `webmapx-tool-select` event containing the `toolId` (e.g., `'layers'`).

3.  **Panel Sync**: The panel listens for tool events and automatically:
    *   Opens/closes itself.
    *   Updates its label.
    *   Shows the content for the active tool and hides others.

4.  **Closing**: When the user closes the panel (via the X button), the panel emits `webmapx-panel-close`. The toolbar listens for this and resets button state (and deactivates any active modal tool).

## Example Implementation

```html
<webmapx-toolbar id="main-toolbar">
    <sl-button name="layers">...</sl-button>
    <sl-button name="settings">...</sl-button>
</webmapx-toolbar>

<webmapx-tool-panel id="tool-panel" label="Tools">
    <webmapx-layer-tree tool-id="layers"></webmapx-layer-tree>
    <webmapx-settings tool-id="settings"></webmapx-settings>
</webmapx-tool-panel>
```
