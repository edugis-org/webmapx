# Engine Interface

This document describes the generic interface that connects the application to the underlying map engines (MapLibre, OpenLayers, Leaflet, Cesium). Engine implementations must satisfy a single public `IMap` contract. Configuration concerns are **not** part of this interface.

Source files: [src/map/IMapInterfaces.ts](../../src/map/IMapInterfaces.ts), [src/store/map-events.ts](../../src/store/map-events.ts)

---

## IMap

The top-level handle for a running map engine instance. Returned by the adapter registry and used by tools and components.

### Properties

| Property | Type | Description |
|---|---|---|
| `store` | `MapStateStore` | Shared application state store |
| `events` | `MapEventBus` | Typed event bus for normalized map events |
| `toolService` | `IToolService` | Tool-facing command surface for engine-backed actions |
| `mapFactory` | `ISubMapFactory` | Creates independent sub-map instances (e.g. inset maps) |

### Main Methods

| Method | Signature | Description |
|---|---|---|
| `initialize` | `(containerId: string, options?) => void` | Initializes the map in an HTML element |
| `getViewportState` | `() => { center, zoom, bearing, pitch }` | Returns current viewport |
| `setViewport` | `(center: [number, number], zoom: number) => void` | Sets map center and zoom |
| `setZoom` | `(level: number) => void` | Sets the zoom level |
| `getZoom` | `() => number` | Returns the current zoom level |
| `getBearing` | `() => number` | Returns bearing in degrees clockwise from north |
| `setBearing` | `(bearing: number) => void` | Sets map bearing |
| `getPitch` | `() => number` | Returns pitch/tilt in degrees (0 = top-down) |
| `setPitch` | `(pitch: number) => void` | Sets map pitch |
| `resetNorth` | `() => void` | Resets bearing to north |
| `resetNorthPitch` | `() => void` | Resets bearing and pitch |
| `fitBounds` | `(bbox: [west, south, east, north]) => void` | Fits view to a bounding box |
| `events` | `MapEventBus` | Typed event bus for normalized map events |
| `project` | `(coords: LngLat) => Pixel` | Converts geographic coordinates to screen pixels |
| `unproject` | `(pixel: Pixel) => LngLat \| null` | Converts screen pixels to geographic coordinates |

---

## Native Layer And Source Methods

These methods are part of `IMap`, but they operate on engine-level/native layers and sources rather than catalog layers.

### Methods

| Method | Signature | Description |
|---|---|---|
| `addNativeLayer` | `(layer: any) => void` | Adds a native layer object |
| `removeLayer` | `(id: string) => void` | Removes a native layer by ID |
| `addSource` | `(id: string, config: any) => void` | Adds a native source |
| `removeSource` | `(id: string) => void` | Removes a native source by ID |
| `getSource` | `(id: string) => ISource \| undefined` | Retrieves a source by ID |
| `suppressBusySignalForSource` | `(sourceId: string) => void` | Suppresses loading indicator for a source |
| `unsuppressBusySignalForSource` | `(sourceId: string) => void` | Re-enables loading indicator for a source |
| `getNavigationCapabilities` | `() => NavigationCapabilities` | Returns what camera controls this engine supports |

> All events are delivered through `IMap.events` (the `MapEventBus`).

---

## Catalog Layer Methods

These methods are also part of `IMap`. They translate config-based layer definitions into native map layers and operate on logical layer IDs from the catalog.

### Methods

| Method | Signature | Description |
|---|---|---|
| `setCatalog` | `(catalog: CatalogConfig) => void` | Loads the catalog of sources and layers. Must be called before `addLayer` |
| `addLayer` | `(layerId: string, layerConfig: LayerConfig, sourceConfig: SourceConfig) => Promise<boolean>` | Adds a layer; returns `true` on success |
| `getVisibleLayers` | `() => string[]` | Returns IDs of all currently visible layers |
| `isLayerVisible` | `(layerId: string) => boolean` | Checks whether a specific layer is visible |

---

## ISubMapFactory / ISubMap

Used to create independent map instances (e.g. an inset/overview map), without sharing state with the main map.

### ISubMapFactory

| Method | Signature | Description |
|---|---|---|
| `createMap` | `(container: HTMLElement, options?: MapCreateOptions) => ISubMap` | Creates and returns a new map instance |

### ISubMap

| Member | Type / Signature | Description |
|---|---|---|
| `setViewport` | `(center, zoom, bearing?, pitch?) => void` | Sets the viewport |
| `createSource` | `(sourceId, data: GeoJSON.FeatureCollection) => ISource` | Creates a GeoJSON source |
| `getSource` | `(sourceId: string) => ISource \| null` | Gets an existing source |
| `createLayer` | `(spec: LayerSpec) => ILayer` | Creates a layer |
| `getLayer` | `(layerId: string) => ILayer \| null` | Gets an existing layer |
| `onReady` | `(callback: () => void) => void` | Fires when the map and style are ready |
| `destroy` | `() => void` | Tears down the map and frees resources |

### ISource / ILayer

| Interface | Member | Description |
|---|---|---|
| `ISource` | `id: string` | The source ID |
| `ISource` | `setData(data: GeoJSON.FeatureCollection)` | Updates source data |
| `ILayer` | `id: string` | The layer ID |
| `ILayer` | `getSource() => ISource` | Returns the source this layer draws from |
| `ILayer` | `remove()` | Removes the layer from the map |

---

## MapEventBus — Events

All events are library-agnostic. Adapters translate native events into these types before emitting. Tools subscribe without knowing which engine is in use.

### Subscribing

```ts
const unsub = map.events.on('view-change-end', (e) => {
    console.log(e.center, e.zoom);
});
// Call unsub() to remove the listener
```

Use `map.events.once(...)` for a single-fire subscription.

### Event Types

| Event type | Description | Key properties |
|---|---|---|
| `pointer-move` | Mouse/touch moves over the map | `coords: LngLat`, `pixel: Pixel`, `resolution` |
| `pointer-leave` | Pointer leaves the map canvas | — |
| `click` | Map click or tap | `coords`, `pixel`, `resolution`, `features?` |
| `dblclick` | Double-click | `coords`, `pixel` |
| `contextmenu` | Right-click / long press | `coords`, `pixel` |
| `drag-start` | Start of a drag interaction | `coords`, `pixel` |
| `drag` | Pointer moving during drag | `coords`, `pixel`, `startCoords`, `startPixel` |
| `drag-end` | End of drag | `coords`, `pixel`, `startCoords`, `startPixel` |
| `view-change` | Viewport changing (continuous, during animation/pan) | `center`, `zoom`, `bearing`, `pitch`, `bounds.sw`, `bounds.ne` |
| `view-change-end` | Viewport settled after movement | same as `view-change` |
| `zoom-end` | Zoom interaction completed | `zoom: number` |

### Common Properties

| Property | Type | Description |
|---|---|---|
| `coords` | `LngLat` = `[number, number]` | Geographic position `[longitude, latitude]` |
| `pixel` | `Pixel` = `[number, number]` | Screen coordinates `[x, y]` |
| `resolution` | `PointerResolution \| null` | Degrees per pixel at pointer position (`{ lng, lat }`) |
| `originalEvent` | `unknown?` | The raw event from the underlying library |

---

## NavigationCapabilities

Reported by `IMap.getNavigationCapabilities()`. Tells the UI which camera controls to show.

| Property | Type | Description |
|---|---|---|
| `bearing` | `boolean` | Engine supports map rotation |
| `pitch` | `boolean` | Engine supports tilt/pitch |

---

## MapCreateOptions

Passed to `ISubMapFactory.createMap()` and `IMap.initialize()`.

| Option | Type | Description |
|---|---|---|
| `center` | `[number, number]?` | Initial center `[lng, lat]` |
| `zoom` | `number?` | Initial zoom level |
| `styleUrl` | `string?` | URL to a style JSON (MapLibre/Mapbox compatible) |
| `interactive` | `boolean?` | Whether to enable user interaction (default: `true`) |
