# Webmapx Coordinates Tool

The `<webmapx-coordinates-tool>` component displays live cursor coordinates and the last clicked position on the map. It updates automatically from the map state store.

## Usage

Place the component inside a layout slot or anywhere inside `<webmapx-map>`.

```html
<webmapx-map>
  <webmapx-layout>
    <webmapx-coordinates-tool slot="bottom-center"></webmapx-coordinates-tool>
  </webmapx-layout>
</webmapx-map>
```

## Behavior

- **Live cursor:** Shows the current pointer coordinates.
- **Pinned value:** Shows the last clicked coordinates (if any).
- **Formatting:** Coordinates are displayed in degrees and minutes with N/S/E/W suffixes.

## Events

This component does not emit custom events.
