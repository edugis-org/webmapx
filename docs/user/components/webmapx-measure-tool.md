# WebmapX Measure Tool

The `<webmapx-measure-tool>` component provides interactive functionality for measuring distances and areas directly on the map.

## Usage

1.  **Activate the tool:** Typically, this is done by clicking a corresponding button in a `<webmapx-toolbar>`, or programmatically via `ToolManager`.
2.  **Add points:** Click on the map to add measurement points.
    *   For distance: Add two or more points to define a path. The distance of each segment and a total distance will be displayed.
    *   For area: Add three or more points to define a polygon.
3.  **Close a polygon:** To complete an area measurement, click near the first point you added.
4.  **Clear measurement:** Right-click on the map or press the `Esc` key to clear the current measurement and start a new one.

## Attributes

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `active` | `boolean` | `false` | Whether the tool is currently active. Reflects the tool's activation state. |
| `render-target` | `string` | - | CSS selector for custom output location. When set, the tool's UI is rendered to this element instead of its default location. |
| `close-threshold` | `number` | `10` | The pixel distance threshold for closing a polygon. Clicking within this distance of the first point will close the polygon. |
| `finish-threshold` | `number` | `10` | The pixel distance threshold for finishing a line measurement (clearing the current measurement). Clicking within this distance of the last point will clear the measurement. |

## Features

*   **Distance Measurement:** Displays the distance of each segment and a total distance for paths.
*   **Area Measurement:** Calculates and displays the area of closed polygons.
*   **Automatic Panel Scrolling:** The measurement panel automatically scrolls to keep the most recently added segments and totals in view, ensuring a smooth user experience even with many measurements.
*   **Responsive Interaction:** Provides fluid and responsive feedback as you interact with the map, with optimizations to prevent UI lag during rapid mouse movements.
*   **Flexible Output Location:** Render measurement results to any DOM element using `render-target`.

## Integration

### Default: Inside Tool Panel

The `webmapx-measure-tool` is typically placed within a `<webmapx-tool-panel>` and activated via a `<webmapx-toolbar>`.

```html
<webmapx-tool-panel label="Measure" active>
  <webmapx-measure-tool></webmapx-measure-tool>
</webmapx-tool-panel>

<webmapx-toolbar>
  <sl-button name="measure" circle>
    <sl-icon name="rulers"></sl-icon>
  </sl-button>
</webmapx-toolbar>
```

### Custom Output Location with `render-target`

You can render the measure tool's output to any element on the page using the `render-target` attribute. This is useful when you want the measurement UI to appear in a sidebar, modal, or any other custom location outside the default tool panel.

```html
<webmapx-map id="map">
  <!-- Tool element can be anywhere inside the map -->
  <webmapx-measure-tool render-target="#measurement-sidebar"></webmapx-measure-tool>
</webmapx-map>

<!-- Output renders here instead of in the tool's default location -->
<aside id="measurement-sidebar" class="my-custom-sidebar">
  <!-- Measure tool content will be moved here when active -->
</aside>
```

**How it works:**
- When `render-target` is set and the tool is active, the tool's content is **moved** to the target element
- When the tool is deactivated, the target element is cleared
- If `render-target` is removed, the content returns to the tool's original location

**Example: Sidebar Integration**

```html
<div class="app-layout">
  <webmapx-map id="map">
    <webmapx-toolbar>
      <sl-button name="measure">Measure</sl-button>
    </webmapx-toolbar>

    <!-- Tool placed anywhere in map, output goes to sidebar -->
    <webmapx-measure-tool render-target="#sidebar-content"></webmapx-measure-tool>
  </webmapx-map>

  <aside class="sidebar">
    <h3>Measurements</h3>
    <div id="sidebar-content"></div>
  </aside>
</div>
```

## JavaScript API

### Programmatic Activation

You can activate/deactivate the measure tool programmatically via the `ToolManager`:

```javascript
const map = document.querySelector('webmapx-map');

// Activate the measure tool
map.toolManager.activate('measure');

// Deactivate the measure tool
map.toolManager.deactivate('measure');

// Toggle the measure tool
map.toolManager.toggle('measure');

// Check if measure tool is active
if (map.toolManager.activeToolId === 'measure') {
  console.log('Measure tool is active');
}
```

### Events

The `webmapx-measure-tool` dispatches custom events for activation and deactivation:

| Event Name | Detail | Description |
|------------|--------|-------------|
| `webmapx-measure-activate` | `void` | Fired when the measure tool becomes active. |
| `webmapx-measure-deactivate` | `void` | Fired when the measure tool becomes inactive. |

You can also listen to global tool events on the map element:

```javascript
const map = document.querySelector('webmapx-map');

map.addEventListener('webmapx-tool-activated', (e) => {
  if (e.detail.toolId === 'measure') {
    console.log('Measure tool activated');
  }
});

map.addEventListener('webmapx-tool-deactivated', (e) => {
  if (e.detail.toolId === 'measure') {
    console.log('Measure tool deactivated');
  }
});
```
