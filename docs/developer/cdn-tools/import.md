# Tool: importLayer

Import local files as map layers. Supported formats: GeoJSON, GPX, KML, Shapefile (zipped), GML, FlatGeobuf, GeoPackage (GPKG, multi-layer).

Heavy formats (Shapefile, GML, FlatGeobuf, GPKG) use GDAL compiled to WebAssembly — no server needed.

A GeoPackage with several layers opens a dialog to pick which to import. Listing them does not read the file: counts come from the GeoPackage's `gpkg_ogr_contents` table, and when a file has none (QGIS and many other tools do not write it) from each layer's highest feature id, shown as **≈** — exact unless features were deleted.

**Tool id:** `importLayer`  
**Load:** lazy

## Example

```js
tools: ['importLayer']
```

No extra configuration options.

← [All tools](./overview.md)
