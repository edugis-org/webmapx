# `webmapx-map`

Host element for the mapping library canvas plus any overlay UI. It injects a `[slot="map-view"]` surface automatically, so you can simply drop it in your markup.

## Usage
```html
<webmapx-map id="map-container">
  <!-- Optional: overlays, layouts, tools -->
  <webmapx-map-layout>
    <webmapx-zoom-display slot="bottom-left"></webmapx-zoom-display>
  </webmapx-map-layout>
</webmapx-map>
```

## Behavior
- Automatically creates a map surface if none is provided, styles it (`position:absolute; top/right/bottom/left:0; width/height:100%`).
- Keeps the surface synchronized if you later insert your own `[slot="map-view"]` node.
- Leaves default slot content untouched, so any overlay component can be appended directly.

## Integration
Initialize the map once the DOM is ready:
```ts
mapAdapter.core.initialize('map-container', {
  center: [4.9041, 52.3676],
  zoom: 11,
  styleUrl: 'https://demotiles.maplibre.org/style.json',
});
```
