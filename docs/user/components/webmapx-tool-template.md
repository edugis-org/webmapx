# `webmapx-tool-template`

Example geoprocessing control that demonstrates how UI modules integrate with the map state store and map adapter.

## What It Does
- Displays and edits the buffer radius stored in `store.getState().bufferRadiusKm`.
- Dispatches changes to the map state store (`source: 'UI'`) and calls the geoprocessing adapter so the map reflects the new buffer.
- Toggles tool activation state through the adapter.

## Usage
```html
<webmapx-tool-template slot="top-right"></webmapx-tool-template>
```

## Behavior
- Host element is `inline-flex` with pointer events enabled, so it can live inside or outside `<webmapx-layout>` without extra CSS.
- Internal Shoelace controls (`sl-range`, `sl-button`) are imported in `src/app.js`—ensure that file remains the single registration point.
- An internal temporary-muting flag avoids feedback loops when responding to store updates.

## When to Copy
Use this file as the starting template for bespoke tools: duplicate it, rename the element, and wire it to the appropriate adapter service.
