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
| `watch` | `boolean` | `true` | When set, continuously watches the position until stopped. |
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
- **Noisy-fix filtering:** GPS fixes that look like transient precision glitches (much worse accuracy than the current best fix, while not stale) are rejected; better or plausible fixes are accepted and extend the trail.

## Track me / track recording

The panel includes a **"Track me"** checkbox (bound to the `follow` property/attribute). Enabling it:

- Recenters the map on every position update (same as setting `follow`).
- Starts a new track: a trail line is drawn on the map from accepted fixes, and each accepted fix is persisted to `localStorage` (key `webmapx-geolocation-tracks`) as `[track, order, timestamp, lng, lat, accuracy]`.
- Keeps tracking running in the background if the tool panel is closed (geolocation `watch` continues; only the panel UI hides).
- Acquires a [Screen Wake Lock](https://developer.mozilla.org/en-US/docs/Web/API/Screen_Wake_Lock_API) (where supported) so the screen doesn't sleep while tracking, and re-acquires it automatically when the tab becomes visible again.

Disabling "Track me" stops associating new fixes with the current track; the trail/persisted points recorded so far remain stored.

## Exporting tracked points

The export button (top-right of the panel, box-arrow-up icon) opens a dialog showing the number of stored track points, with options:

- **Save as files** — prompts for a filename, then downloads a `.zip` containing `gps-track-points.geojson`, `gps-track-lines.geojson` (per-track trail lines), and a `style.json` for displaying them.
- **Add to map** — adds the recorded points/lines as a layer on the current map.
- **Erase from memory** (checkbox, on by default) — clears the persisted track points from `localStorage` after either export action.

## Events

| Event Name | Detail | Description |
|------------|--------|-------------|
| `webmapx-geolocation-start` | `{ watch: boolean }` | Fired when geolocation begins. |
| `webmapx-geolocation-success` | `{ position, watch }` | Fired when a position is obtained. |
| `webmapx-geolocation-error` | `{ error }` | Fired on geolocation error. |
| `webmapx-geolocation-stop` | `void` | Fired when watch mode is stopped. |
