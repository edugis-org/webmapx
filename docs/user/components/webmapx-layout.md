# `webmapx-layout`

Overlay helper that floats nine configurable zones above `<webmapx-map>` while keeping the map itself interactive.

## Slots
`top-left`, `middle-left`, `bottom-left`, `top-center`, `middle-center`, `bottom-center`, `top-right`, `middle-right`, `bottom-right`.

## Usage
```html
<webmapx-layout>
  <webmapx-new-tool slot="top-right"></webmapx-new-tool>
  <webmapx-zoom-display slot="bottom-left"></webmapx-zoom-display>
</webmapx-layout>
```

## Behavior
- The host is pointer-transparent; each slot zone re-enables pointer events so tools remain clickable.
- Host padding uses `--webmapx-layout-inset` (default `16px`) to inset controls from the map edges. Override if you need tighter spacing.
- `--webmapx-layout-slot-gap` controls the vertical gap when multiple tools share a slot zone.
- Accepts an optional `z-index` attribute when you need to raise the overlay above other content.
