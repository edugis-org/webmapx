# Toolbar and Tool Panel Interaction

The `webmapx-toolbar` and `webmapx-tool-panel` components are designed to work together, but they are loosely coupled. They do not communicate directly; instead, they rely on the application to coordinate them via events.

## How it Works

1.  **Identification**: Each button in the toolbar must have a unique identifier, set via the `name` or `data-tool` attribute.
    ```html
    <sl-button name="layers">...</sl-button>
    ```

2.  **Selection Event**: When a user clicks a button, the toolbar emits a `webmapx-tool-select` event containing the `toolId` (e.g., `'layers'`).

3.  **Application Logic**: The application listens for this event and updates the panel state.
    *   It sets `panel.active = true` to open the panel.
    *   It sets `panel.label` to the appropriate title.
    *   It shows the specific content associated with that tool ID and hides others.

4.  **Closing**: When the user closes the panel (via the X button), the panel emits `webmapx-panel-close`. The application listens for this and resets the toolbar state (deactivating buttons).

## Example Implementation

```javascript
const toolbar = document.getElementById('main-toolbar');
const panel = document.getElementById('tool-panel');
const layerUI = document.getElementById('layer-ui');
const settingsUI = document.getElementById('settings-ui');

// 1. Handle Tool Selection
toolbar.addEventListener('webmapx-tool-select', (e) => {
    const toolId = e.detail.toolId;

    // If toolId is null, the user clicked the active button to toggle it off
    if (!toolId) {
        panel.active = false;
        return;
    }

    // Open the panel
    panel.active = true;

    // Switch Content
    layerUI.style.display = 'none';
    settingsUI.style.display = 'none';

    if (toolId === 'layers') {
        layerUI.style.display = 'block';
        panel.label = 'Layers';
    } else if (toolId === 'settings') {
        settingsUI.style.display = 'block';
        panel.label = 'Settings';
    }
});

// 2. Handle Panel Closing
panel.addEventListener('webmapx-panel-close', () => {
    // Manually reset toolbar buttons to "inactive" state
    const buttons = toolbar.querySelectorAll('sl-button');
    buttons.forEach(btn => {
        btn.removeAttribute('active');
        btn.setAttribute('variant', 'default'); // If using Shoelace
    });
});
```
