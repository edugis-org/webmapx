# Webmapx Geolocation Tool

The `<webmapx-geolocation-tool>` component centers the map on the user's current position using the browser geolocation API. It can be activated from the toolbar and also works when placed outside the map using the `map` attribute.

## Usage

### Toolbar Integration

```html
<webmapx-toolbar>
  <sl-button name="geolocation" circle>
    <sl-icon name="crosshair"></sl-icon>
  </sl-button>
</webmapx-toolbar>

<webmapx-geolocation-tool></webmapx-geolocation-tool>
```

When placed inside a tool panel, it listens to toolbar events automatically to activate/deactivate.

### Outside the Map

```html
<webmapx-map id="map"></webmapx-map>
<webmapx-geolocation-tool map="#map"></webmapx-geolocation-tool>
```

When `map` is set, the tool still resolves the map element and updates that map’s view.

## Attributes

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `watch` | `boolean` | `false` | When set, continuously watches the position until stopped. |
| `high-accuracy` | `boolean` | `false` | Requests higher accuracy from the browser. |
| `timeout` | `number` | `10000` | Maximum time in ms to wait for a fix. |
| `max-age` | `number` | `0` | Maximum age of cached position in ms. |
| `zoom` | `number` | - | Optional zoom level to use when centering the map. |
| `follow` | `boolean` | `false` | When set, keep the map centered on each new position update. |

## Behavior

- **Single fix:** If `watch` is not set, the tool gets a single position and deactivates.
- **Watch mode:** If `watch` is set, it keeps updating the map until deactivated.
- **Map visuals:** Adds an accuracy circle and a location point layer while active.
- **Map targeting:** Uses `map="#selector"` when placed outside the map.
- **Zoom:** Centers the map on the first fix and ensures a minimum zoom of 15 (unless `zoom` is provided). When `follow` is enabled, it recenters on every update.

## Events

| Event Name | Detail | Description |
|------------|--------|-------------|
| `webmapx-geolocation-start` | `{ watch: boolean }` | Fired when geolocation begins. |
| `webmapx-geolocation-success` | `{ position, watch }` | Fired when a position is obtained. |
| `webmapx-geolocation-error` | `{ error }` | Fired on geolocation error. |
| `webmapx-geolocation-stop` | `void` | Fired when watch mode is stopped. |
