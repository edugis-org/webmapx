# WebmapX Sea Level Tool

The `<webmapx-sealevel-tool>` (tool type `sealevel`) moves a slider through global sea level, from the lowest level of the last glacial maximum (−134 m, ~21,000 years ago) to +70 m, when all land ice has melted. The map shows where the sea reaches at the chosen level.

The tool owns the *level*, not the data. It drives one vector layer whose polygons each carry the sea level at which they connect to the ocean (`flood_level`). Moving the slider only recolours that layer: the geometry is loaded once, so sliding and playing cost a repaint and no network traffic.

## Data

The coastal zones are built by a separate ETL from the GEBCO_2026 bathymetry/elevation grid:

**[edugis-org/coastal_zones](https://github.com/edugis-org/coastal_zones)** — scripts, method and source attribution.

Its output is a single PMTiles archive (`coastal_zones.pmtiles`, z0–6, ~20 MB, source layer `zones`) that any static web server can serve through HTTP range requests; no tile server is needed. The archive and its GeoJSON counterpart are **not** part of this repository (both are gitignored). Download them from the data repository's [releases](https://github.com/edugis-org/coastal_zones/releases) and put them where the config expects them — for the demo config, `public/data/`:

```bash
for f in coastal_zones.pmtiles coastal_zones_16m.geojson; do
  curl -L -o public/data/$f https://github.com/edugis-org/coastal_zones/releases/latest/download/$f
done
```

A browser cannot read the release asset directly (GitHub serves release downloads without CORS headers), so the archive has to be copied to the host that serves the map. webmapx.com's build (`edugis-org/webmapx-demo`, `.github/workflows/pages.yml`) fetches a release pinned by tag and checksum into `dist/data/`; GitHub Pages answers the range requests PMTiles needs.

The data are CC BY 4.0 and derived from the public-domain GEBCO_2026 Grid, whose terms ask that the source be acknowledged. Credit both, e.g. `Coastal zones: EduGIS, from GEBCO_2026 Grid` in the source's `attribution`; the full citation is in the data repository's README.

`flood_level` is not a contour. A priority flood from the open ocean gives each area the lowest sea level at which water can reach it over the lowest saddle, so closed depressions stay dry until the sea overtops their sill: the Black Sea connects at −28 m (Bosporus), the Caspian at +25 m, the Dead Sea at +58 m. Class levels are 1 m apart from −1 to +10 m and 5 m apart elsewhere; today's coastline is the edge between classes −1 and 0.

## Usage

1. Open the tool from the toolbar. If the configured layer is already on the map, the tool uses it; otherwise it adds one itself, the way the deeptime tool lends its coastlines — from the `tiles` archive, or from `geojson` on an engine that cannot read the archive.
2. Drag the slider, or use the step buttons (hold to repeat), ▶ to play, and *Today* to return to today's level.
3. At level `L`:
   - `flood_level <= L` is drawn as **sea**;
   - `L < flood_level <= today` is drawn as **dry sea floor** (land colour) — only below today's level;
   - everything else is transparent, so the basemap shows today's land and lakes (e.g. the Caspian below its +25 m overflow).
4. Levels worth a name (last glacial maximum, IPCC AR6 2100, Greenland/Antarctica melted) are labelled under the slider.

Closing the panel leaves the layer at the level it was left at, so the map can be measured, queried or printed as the slider set it up. A permalink carries the level (and the age, in time mode): opening the link rebuilds the layer at that level, with the panel closed, in whichever format the opening engine can draw. The legend follows the slider: the classes are titled "Sea", "Dry sea floor" and "As today".

### Time mode

With a sea level curve configured (`data`), the tool gains a **Time** mode: the slider runs through years instead of metres, the level is read from the curve for each age, named periods are shown (meltwater pulse 1A, Younger Dryas, the Black Sea connecting, Doggerland drowning), and playback runs at 250–2,000 years per second.

A curve is a JSON config asset of `[age in ka BP, metres]` points, linearly interpolated:

```json
{
  "name": "Global mean sea level, last 26,000 years",
  "attribution": "Sea level after <a href=\"https://doi.org/10.1073/pnas.1411762111\">Lambeck et al. 2014</a>",
  "note": "Shown as the tooltip of the attribution.",
  "points": [[26, -130], [21, -134], [0, 0]]
}
```

The configs repository ships `data/sealevel/lambeck2014-approx.json`, an approximation of Lambeck et al. (2014) for the last 26,000 years; it is the default `data`. Set `data` to an empty string to turn time mode off.

## Configuration

Nothing is required: every key has a default, so a toolbar item `{ "type": "sealevel" }` is enough. That is also how to add it to a config without it — the demo config does not include the tool; add it in `testpages/setup.html`, whose ⚙ options for the tool are `data` and `tiles` (written to `tools.sealevel`).

A config can also put the layer in its catalog — to show it without the tool — and name it in a `sealevel` section. The tool adopts that layer only when it is already on the map; it never adds it from the catalog, since the catalog's format was chosen without knowing the engine:

```json
"sources": [
  {
    "id": "coastal-zones-source",
    "type": "vector",
    "url": "pmtiles://../data/coastal_zones.pmtiles",
    "attribution": "Coastal zones: EduGIS, from GEBCO_2026 Grid"
  }
],
"layers": [
  {
    "id": "coastal-zones",
    "type": "fill",
    "source": "coastal-zones-source",
    "source-layer": "zones",
    "paint": {
      "fill-color": ["case", ["<=", ["get", "flood_level"], -1], "#aad3df", "rgba(0, 0, 0, 0)"],
      "fill-antialias": false
    }
  }
],
"tools": {
  "sealevel": {
    "enabled": true,
    "layer": "coastal-zones",
    "data": "data/sealevel/lambeck2014-approx.json"
  }
}
```

The archive path after `pmtiles://` is resolved relative to the config file, like every other path in a config. The default `tiles` (`../data/…`) is where webmapx.com serves the archive: in `data/` beside the `config/` directory. The layer's own paint is only what shows before the tool is first opened; the tool replaces it.

| Key / attribute | Type | Default | Description |
|---|---|---|---|
| `layer` | `string` | `coastal-zones` | Id of the layer to drive: adopted when already on the map, otherwise the id the tool adds its own layer under. |
| `attribute` | `string` | `flood_level` | Feature attribute holding the sea level (m) at which a polygon floods. |
| `min` | `number` | `-134` | Lowest level on the slider (m). |
| `max` | `number` | `70` | Highest level on the slider (m). |
| `step` | `number` | `1` | Slider granularity (m). |
| `today` | `number` | `-1` | Class level that counts as today's sea. |
| `water` | `string` | `#aad3df` | Sea colour (OpenStreetMap's water). |
| `land` | `string` | `#f2efe9` | Dry sea floor colour (OpenStreetMap's land). |
| `levels` | `number[]` | the ETL's classes | Class levels the attribute takes; config only. |
| `data` | `string` | `data/sealevel/lambeck2014-approx.json` | Sea level curve (config asset) for time mode; `""` turns time mode off. |
| `tiles` | `string` | `../data/coastal_zones.pmtiles` | Coastal zones archive (config asset, `pmtiles://` optional). Only used when the map does not already show `layer`. |
| `geojson` | `string` | `../data/coastal_zones_16m.geojson` | The same zones as GeoJSON (16′), used instead of `tiles` on an engine that cannot read PMTiles. |

An attribute on the element overrides the config section.

## Engine support

The tool is engine-neutral: it splits the layer into classes with `setSubLayers` and recolours them with `updateLayerStyle` on every engine. Only the data differs, and the adapter decides which (`canDrawSource`):

- **MapLibre** reads `pmtiles://` and gets the tile archive.
- **OpenLayers** cannot, and gets `coastal_zones_16m.geojson`, read once into the view's projection — so the animation also runs in Equal Earth, Mollweide and the other equal-area projections, which suit a world map better than Mercator. A step that changes no class costs nothing; one that flips a class re-renders that class's layer (~0.1–0.3 s in a software-rendered test browser, once per 5 m at most).

A catalog layer with a `pmtiles://` source is refused on an engine that cannot draw it (`webmapx-map` asks `canDrawSource` for every catalog layer).

## Notes

- Not for navigation. Coastal land heights in GEBCO come from SRTM15+, a surface model (buildings and vegetation included), so low-lying coasts are indicative only.
- Inland seas are modelled as flooding only when the ocean spills over their sill; their own earlier levels, and the Messinian Mediterranean, are not included.
