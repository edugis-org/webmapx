# `webmapx-spinner`

Loading indicator that shows when the map is busy loading tiles or rendering.

## What It Does
- Subscribes to the map state store and reflects `mapBusy`.
- Shows a spinning indicator when the map is loading data or rendering.
- Automatically hides with a fade transition when the map becomes idle.
- Works with both MapLibre and OpenLayers adapters.

## Usage

Inside a `webmapx-layout`:
```html
<webmapx-map>
  <webmapx-layout>
    <webmapx-spinner slot="middle-center"></webmapx-spinner>
  </webmapx-layout>
</webmapx-map>
```

Or placed directly inside `webmapx-map`:
```html
<webmapx-map>
  <webmapx-spinner></webmapx-spinner>
</webmapx-map>
```

External placement (linked to a specific map):
```html
<webmapx-spinner map="#map-container"></webmapx-spinner>
```

## Behavior
- Uses Shoelace `<sl-spinner>` for the loading animation.
- Fades in/out with a 200ms transition for smooth appearance.
- Has `pointer-events: none` so it doesn't block map interactions.
- Extends `WebmapxBaseTool` for automatic state store subscription.

## How Loading Detection Works

### MapLibre
- `dataloading` event sets `mapBusy: true`
- `idle` event sets `mapBusy: false`

### OpenLayers
- `loadstart` and `tileloadstart` events set `mapBusy: true`
- `rendercomplete` event (when no pending tiles) sets `mapBusy: false`

## Styling

The spinner can be customized via CSS custom properties:

```css
webmapx-spinner {
  --sl-color-primary-600: #ff0000;  /* Spinner color */
}

webmapx-spinner sl-spinner {
  font-size: 2rem;  /* Spinner size */
}
```

## Tips
- Place in `slot="top-right"` or `slot="middle-center"` for common positioning.
- Multiple spinners stay synced as they all read from the same `mapBusy` state.
- The spinner appears during initial load, tile fetching, and layer rendering.
