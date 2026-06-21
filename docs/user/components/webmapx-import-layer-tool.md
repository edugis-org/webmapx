# `webmapx-import-layer-tool`

Tool panel for adding layers to the map from external sources — either a service URL or a local file.

## Usage

Configure via the tools config (config type `importLayer` or `import-layer`):

```json
{
  "id": "import-layer",
  "type": "importLayer",
  "enabled": true,
  "title": "Import layer"
}
```

## From URL

Paste a service or tile URL and click **Discover**. WebMapX probes the URL and lists available layers:

- WMS / WMTS endpoints
- Esri MapServer / FeatureServer / ImageServer
- ArcGIS REST services
- XYZ tile templates
- MVT / vector tile endpoints

Select one or more layers from the list and click **Add selected**.

## From file

Click **Open file…** or drag files onto the drop zone. Supported formats are the same as dragging files directly onto the map — see [webmapx-map — Drag-and-drop file import](./webmapx-map.md#drag-and-drop-file-import) for the full list and CSV coordinate column names.

Accepted extensions: `.geojson`, `.json`, `.zip`, `.topojson`, `.gpx`, `.kml`, `.kmz`, `.csv`

## Notes

- The same file processing pipeline is used by both the drop zone and by dragging files directly onto the map canvas.
- WebMapX config files (`.json` recognized as a config) cause a page reload with the new config applied.
