# `gis-map-layout`

Overlay helper that floats nine configurable zones above `<gis-map>` while keeping the map itself interactive.

## Slots
`top-left`, `middle-left`, `bottom-left`, `top-center`, `middle-center`, `bottom-center`, `top-right`, `middle-right`, `bottom-right`.

## Usage
```html
<gis-map-layout>
  <gis-new-tool slot="top-right"></gis-new-tool>
  <gis-zoom-display slot="bottom-left"></gis-zoom-display>
</gis-map-layout>
```

## Behavior
- The host is pointer-transparent; each slot zone re-enables pointer events so tools remain clickable.
- Host padding uses `--gis-map-layout-inset` (default `16px`) to inset controls from the map edges. Override if you need tighter spacing.
- `--gis-map-layout-slot-gap` controls the vertical gap when multiple tools share a slot zone.
- Accepts an optional `z-index` attribute when you need to raise the overlay above other content.
