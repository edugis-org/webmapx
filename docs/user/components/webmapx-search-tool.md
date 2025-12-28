# Webmapx Search Tool

The `<webmapx-search-tool>` component provides a geocoding search UI for places and addresses. It is a modal tool that shows results, previews them on the map, and can persist selected results as map layers.

## Usage

1.  **Activate the tool:** Click the corresponding toolbar button or activate via `ToolManager`.
2.  **Search:** Enter a query and press Enter or click Go.
3.  **Preview:** Hover a result to preview it on the map.
4.  **Select:** Click a result to zoom to it and toggle persistence on/off.
5.  **Persist:** Use the checkbox to pin/unpin results without zooming.

## Attributes

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `active` | `boolean` | `false` | Whether the tool is currently active. Reflects the tool's activation state. |
| `render-target` | `string` | - | CSS selector for custom output location. When set, the tool's UI is rendered to this element instead of its default location. |

## Configuration

Configure the search tool via the `tools.search` section of the app config:

```json
{
  "tools": {
    "search": {
      "endpoint": "https://nominatim.openstreetmap.org/search",
      "params": { "format": "geojson", "polygon_geojson": 1, "addressdetails": 1 },
      "maxResults": 15,
      "defaultZoom": 14
    }
  }
}
```

## Features

*   **Geocoding Search:** Queries a configurable endpoint (default: Nominatim).
*   **Result Preview:** Hover a result to preview geometry on the map.
*   **Persisted Results:** Pin results as map layers with random colors.
*   **Zoom on Select:** Selecting a result zooms to its bounding box or point.

## Integration

### Inside Tool Panel

```html
<webmapx-tool-panel label="Tools">
  <webmapx-search-tool tool-id="search"></webmapx-search-tool>
</webmapx-tool-panel>

<webmapx-toolbar>
  <sl-button name="search" circle>
    <sl-icon name="search"></sl-icon>
  </sl-button>
</webmapx-toolbar>
```

### Custom Output Location with `render-target`

```html
<webmapx-map id="map">
  <webmapx-search-tool render-target="#search-sidebar"></webmapx-search-tool>
</webmapx-map>

<aside id="search-sidebar"></aside>
```

## JavaScript API

```javascript
const map = document.querySelector('webmapx-map');
map.toolManager.activate('search');
map.toolManager.deactivate('search');
map.toolManager.toggle('search');
```

## Events

| Event Name | Detail | Description |
|------------|--------|-------------|
| `webmapx-search-opened` | `void` | Fired when the tool becomes active. |
| `webmapx-search-closed` | `void` | Fired when the tool becomes inactive. |
| `webmapx-search-result` | `GeoJSON.FeatureCollection` | Fired after results are fetched. |
| `webmapx-search-selected` | `{ feature, bbox, center }` | Fired when a result is selected. |
| `webmapx-search-persist-change` | `{ feature, persisted }` | Fired when a result is pinned/unpinned. |

You can also listen to global tool events on the map element:

```javascript
const map = document.querySelector('webmapx-map');

map.addEventListener('webmapx-tool-activated', (e) => {
  if (e.detail.toolId === 'search') {
    console.log('Search tool activated');
  }
});
```
