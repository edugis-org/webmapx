# `webmapx-zoom-level`

Compact zoom readout/input that stays synchronized with the map's zoom level.

## What It Does
- Subscribes to the map state store and reflects `zoomLevel`.
- Allows the user to enter a target zoom value; on blur/Enter it dispatches intent via `mapZoomController`.
- Acts as an example of throttled map interactions (controller handles debouncing/throttling).

## Usage
```html
<webmapx-zoom-level slot="bottom-left"></webmapx-zoom-level>
```

## Behavior
- Host is `inline-flex` with its own card styling; additional CSS is optional.
- Uses Shoelace `<sl-input>` (imported in `src/app.js`).
- Emits intents through the adapter layer instead of calling MapLibre directly, keeping the architecture loop-safe.

## Tips
- If you place more than one zoom display in the layout, each stays synced because they all read from the same map state store.
