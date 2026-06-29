# Tool: importLayer

Import local files as map layers. Supported formats: GeoJSON, GPX, KML, Shapefile (zipped), GML, FlatGeobuf, GeoPackage (GPKG, multi-layer).

Heavy formats (Shapefile, GML, FlatGeobuf, GPKG) use GDAL compiled to WebAssembly — no server needed.

**Tool id:** `importLayer`  
**Load:** lazy

## Example

```js
tools: ['importLayer']
```

No extra configuration options.

← [All tools](./overview.md)
