# WebmapX Measure Tool

The `<webmapx-measure-tool>` component provides interactive functionality for measuring distances and areas directly on the map.

## Usage

1.  **Activate the tool:** Typically, this is done by clicking a corresponding button in a `<webmapx-toolbar>`.
2.  **Add points:** Click on the map to add measurement points.
    *   For distance: Add two or more points to define a path. The distance of each segment and a total distance will be displayed.
    *   For area: Add three or more points to define a polygon.
3.  **Close a polygon:** To complete an area measurement, click near the first point you added.
4.  **Clear measurement:** Right-click on the map or press the `Esc` key to clear the current measurement and start a new one.

## Attributes

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `close-threshold` | `number` | `10` | The pixel distance threshold for closing a polygon. Clicking within this distance of the first point will close the polygon. |
| `finish-threshold` | `number` | `10` | The pixel distance threshold for finishing a line measurement (clearing the current measurement). Clicking within this distance of the last point will clear the measurement. |

## Features

*   **Distance Measurement:** Displays the distance of each segment and a total distance for paths.
*   **Area Measurement:** Calculates and displays the area of closed polygons.
*   **Automatic Panel Scrolling:** The measurement panel automatically scrolls to keep the most recently added segments and totals in view, ensuring a smooth user experience even with many measurements.
*   **Responsive Interaction:** Provides fluid and responsive feedback as you interact with the map, with optimizations to prevent UI lag during rapid mouse movements.

## Integration

The `webmapx-measure-tool` is designed to be placed within a `<webmapx-tool-panel>` and activated via a `<webmapx-toolbar>`.

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

## JavaScript API

The `webmapx-measure-tool` dispatches standard custom events for activation and deactivation:

| Event Name | Detail | Description |
|------------|--------|-------------|
| `webmapx-measure-activate` | `void` | Fired when the measure tool becomes active. |
| `webmapx-measure-deactivate` | `void` | Fired when the measure tool becomes inactive. |
