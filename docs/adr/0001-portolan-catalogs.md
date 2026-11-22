# ADR 0001: Read Portolan catalogs

- Status: **proposed** (2026-11-22)
- Builds on: the layer catalog (`addLayerRequest`), the PMTiles/GeoParquet/COG support webmapx already has, the layer repository (`edugis-org/webmapx-layer-repository`) and `testpages/setup.html`
- Related: PolderGIS ADR 0006 (a library is a Portolan catalog), 0008 (table linked to the map by FID), 0009 (layers of any size as a stream)

## Context

[Portolan](https://github.com/portolan-sdi/portolan-spec) (spec v0.2.0) is a profile of static STAC for cloud-native geodata. A catalog is a tree of `catalog.json` files; each dataset is a `collection.json` whose assets carry roles:

| Role | Vector | Raster |
|---|---|---|
| `data` | GeoParquet (spatially ordered, row groups ≤ 150k rows, per-row-group bbox statistics) | COG with embedded statistics |
| `visual` | PMTiles, plus a `rel: pmtiles` link listing its layers | (the COG itself) |
| `style` | MapLibre GL v8 style file; with more than one, exactly one also has role `default` | colour table in the COG; continuous rasters still incubating |
| `thumbnail` | PNG rendered with the default style | same |

Licence (SPDX), providers, `README.md`/`AGENTS.md` and `table:columns` are required metadata. Published catalogs are listed in [`portolan-registry`](https://github.com/portolan-sdi/portolan-registry).

webmapx cannot read any of this today. Its layer catalog knows configured layers only; a Portolan collection has to be hand-translated into a config entry.

A Portolan catalog is, for a map maker, the same kind of thing as a WMS or WFS endpoint: a source offering many layers, of which one map shows a selection. A library such as EduGIS's (`https://edugis.b-cdn.net/catalog.json`) holds the BAG buildings (1.8 GB of tiles) next to a single historical waterway; nobody wants all of it on one map.

### What exists to build on (surveyed 2026-11-22)

- **portolan-sdi has no reader library.** Its reader is `portolan-browser`, a Vue fork of STAC Browser (ISC). The logic is good but lives inside a Vue app: `src/utils/portolanStyles.js` (433 lines, plain JS, depends only on `stac-js` helpers) is extractable; the map code (`StacMapLayer.js`, 2111 lines) is not. It draws GeoParquet directly with hyparquet (size-limited), COG through deck.gl-geotiff, and Zarr.
- **`stac-js`** (moregeo, Apache-2.0, 0.5.x on npm) is a generic STAC object model — catalog, collection, item, asset, links, roles, media types. It is what portolan-browser builds on, and it is maintained independently of both webmapx and PolderGIS.
- **PolderGIS** writes Portolan catalogs and reads them back (`src/core/`: `library-index.ts`, `layer-styles.ts`, `mosaic-read.ts`, `parquet-table.ts`, `sort-index.ts`), TypeScript, no DOM. It adds PolderGIS-specific extras under `pg:` — a flat layer index (`rel: pg:index`), map-sheet mosaics, sort indexes.

### The ownership question

Sharing PolderGIS's read code as a package was considered first. The objection is lifecycle coupling: if PolderGIS stalls while webmapx continues, webmapx has to keep maintaining a dormant repository to publish fixes, and every fork of webmapx inherits a dependency on a project it does not use. The format is defined by the Portolan spec, not by PolderGIS, so the reader belongs next to the spec, not next to one writer.

## Decision

0. **Division of roles** (owner, 2026-11-22):

   | Part | Job |
   |---|---|
   | PolderGIS | publishes Portolan catalogs |
   | layer repository | knows which layers exist: a Portolan catalog is a source type, like a WMS capabilities document or a GeoNetwork catalogue |
   | `setup.html` | the author selects layers from the repository into a config |
   | webmapx | shows the selected layers; analyses them; lets a config override their style |

   **PolderGIS publishes, webmapx consumes.** Turning a large file into cloud-native data — streaming a 7 GB GeoPackage into PMTiles and GeoParquet in OPFS, as PolderGIS does for the BAG — is PolderGIS's job and stays there. webmapx is a consumer of published Portolan collections, from PolderGIS or any other Portolan tool. webmapx's existing file drop stays what it is: small files, loaded into memory, for quick use in a lesson; it does not grow a conversion pipeline. A dataset too big for that gets published (with PolderGIS) and then opened in webmapx as a collection.

1. **Two small readers, each for its own job — no shared package.** No new repository and no package shared with PolderGIS (see "The ownership question").
   - **webmapx** reads *one collection* and draws it (`src/utils/portolan-collection.ts`): assets by role, the default style, binding that style to the collection's data. It never walks a catalog.
   - **The layer repository** walks *catalogs* and lists their collections (`lib/portolan.mjs`): titles, bboxes, kinds, collection URLs. Like `lib/geonetwork.mjs` it is plain JavaScript that imports nothing, so the same file is the harvester and the previewer's live client.

   The overlap is reading a collection's title and bbox — a few lines, not worth a dependency. Neither needs `stac-js`: what is read is a handful of fields and links, and the repository's libraries must stay import-free to run unbundled in the browser.

2. **Collection → layer happens before the engine sees it.** A `portolan://` reference is expanded in generic code (`expandPortolanCollection` for a style URL, `resolvePortolanSources` for a source URL; rules in `utils/portolan-collection.ts`) into an ordinary MapLibre-spec layer and source:
   - vector: source `pmtiles://` from the `visual` asset, layers from the `default` style asset (its `source` names rewritten to ours);
   - raster: a COG raster source (see 4);
   - title, description, licence, attribution (from `providers`), `table:columns` → `metadata.attributes`, `thumbnail` → `metadata.swatch`;
   - the collection URL and the GeoParquet `data` href kept in `metadata` for the table and analysis (see 6).

   Engines never see Portolan. This follows the rule that webmapx learns about a layer only from what is passed to `addLayer`.

3. **Catalogs are browsed in the layer repository; a config references collections.**
   - A source `{ "type": "portolan-catalog", "url": ".../catalog.json" }` in the repository's `sources/` is harvested into one layer per collection, filed under `layers/` by the collection's extent like every other harvested layer, with title, kind (vector/raster/table), licence and attribution. A `pg:index` link, when present, is a shortcut (one request instead of a tree walk); without it the tree is walked, bounded (200 catalogs, cycles skipped). Catalog groups become the layer's group label, not a selection unit.
   - **Live browsing** in the previewer and in `setup.html`'s Repository tab uses the same `lib/portolan.mjs` directly, as "Search a catalogue" does for GeoNetwork — a library published this morning is selectable without waiting for a harvest.
   - A layer's `webmapxConfig` is `{ "type": "style", "url": "portolan://<collection.json>" }`: a reference to the collection, **never to its files**. PolderGIS names data files with a content hash and serves `collection.json` uncached, so the collection always points at the current version; a config naming the PMTiles directly would break at the next republication. This is also why the harvested list may lag a library without the maps going stale: what is in a config is resolved when the map loads.
   - webmapx itself gets **no catalog panel and no layer-tree node for Portolan**: the selection is the author's, made in `setup.html`, and the end user sees that selection in the ordinary layer tree.

4. **COG as a raster layer type**, independent of Portolan and useful on its own (dropped GeoTIFFs are refused today, `file-sniff.ts`):
   - MapLibre: `cog://` via `@geomatico/maplibre-cog-protocol` (already a dependency, used only for terrain today);
   - OpenLayers: `ol/source/GeoTIFF` (`geotiff` already a dependency);
   - Leaflet, Cesium: `canDrawSource` refuses it, so the catalog does not offer it.

5. **Styles follow the spec exactly.** A collection's styles are its assets with role `style` — the spec defines no manifest and we add none. The default is the one with roles `style` + `default`; a lone style is the default without the marker. Each style's `title` is its name in the UI. The styler/legend offers the alternatives, and a config may pick one (`metadata.portolan.style`, the asset key) or carry its own `layers`, which webmapx binds to the collection's data the same way — overriding the publisher's look without copying the data reference. Rules taken from `portolanStyles.js` (with credit; ISC): accepted media types (`application/vnd.mapbox.style+json`, `application/json`, absent), only `http(s):` hrefs are fetched (catalog JSON is untrusted), the document must be GL v8. Item-level styles (partitioned collections) come later. Writing a style back into a catalog is out of scope — webmapx reads catalogs, it does not publish them.

6. **Nothing is loaded whole; the map draws tiles, everything else reads a window of the GeoParquet.** A Portolan layer may hold tens of millions of features, so no path may pull the full dataset into JavaScript:
   - **Map:** always the `visual` PMTiles, which the engine reads by range requests per tile. GeoParquet is drawn directly only when a collection has no `visual` *and* its footer reports few rows (`num_rows` under the existing in-memory limit); otherwise the layer is offered as table-only.
   - **Info tool:** the clicked feature comes from the tile; its full row (all columns, unsimplified) is fetched from the GeoParquet by feature id — one row group, a few columns.
   - **Attribute table:** a window (7), never the whole file.
   - **Analysis:** reads the GeoParquet rows **inside the analysis area** (the view, or a drawn/selected polygon), skipping row groups by their bbox statistics — efficient because the spec requires spatial order. Up to the existing in-memory limit that may be the whole layer. Above it the input is area-limited and the panel says so, as `isViewportLimited` does now — but the features it does get are *exact and complete* within that area, not the simplified, tile-clipped subset `queryRenderedFeatures` returns.

   Reading is always footer once, then only the row groups and columns needed (spec: ≤ 150k rows and bbox statistics per row group).

7. **Attribute table: adopt PolderGIS's design** (its ADR 0008). One virtual window over the layer's GeoParquet, the same for small and huge layers: up to 50 000 rows held whole and sortable; above that the scrollbar spans all rows and blocks of 1 000 rows load as they come into view. Map click ↔ row through the feature id (`promoteId` on the tiles, same id in the GeoParquet); a click on a row zooms to that row's bbox covering. Sorting a large layer uses a **sort index** when the collection publishes one (8); without one, sorting is offered only up to the in-memory limit.

8. **Sort indexes are read as an optional extra.** PolderGIS publishes them as collection assets with role `pg:sort-index` and the key columns in `pg:keys`: a small Parquet file with the key columns and `pg_row` (row number in the data file), pre-sorted. The table uses one when the user sorts on its keys. The spec has no equivalent (it orders data *spatially*, `incubating/spatial-order.md`), so this stays a `pg:` extra; proposing it upstream as an incubating extension is PolderGIS's call.

9. **Mosaics later.** A collection of map sheets (`item-mirror` + overview COG) is read by PolderGIS's `mosaic-read.ts` design; webmapx adds it after 4, MapLibre first.

10. **Upstream first where it belongs.** We propose to portolan-sdi that the style discovery and GeoParquet reading in portolan-browser become a published package. If they do, webmapx switches to it and drops its own copy of those rules.

## Engines

Engine support follows from point 6: a Portolan vector layer is drawable only by an engine that renders vector tiles, because there is no scalable fallback. Each engine answers through `canDrawSource`, so the catalog simply does not offer what an engine cannot draw.

| | Vector (PMTiles) | Raster (COG) | Table, info, Analysis |
|---|---|---|---|
| **MapLibre** | yes (`pmtiles://`, today) | yes (`cog://`, raster type to add) | yes |
| **OpenLayers** | yes (`pmtiles://`, today; also in non-Mercator views) | yes (`ol/source/GeoTIFF`, to add) | yes |
| **Leaflet** | no — needs a vector-tile renderer (e.g. protomaps-leaflet); not planned | possible (georaster-layer), not planned | n/a without the layer |
| **Cesium** | no — MVT was tried and parked (world-scale triangles, slow) | no native COG source; not planned | n/a without the layer |

Leaflet and Cesium still get small Portolan collections that are drawn from GeoParquet directly (under the in-memory limit) and the thumbnail as a catalog swatch. The table and the GeoParquet reading are engine-independent code; only drawing differs.

## Consequences for PolderGIS

Its current extensions should stay readable by any Portolan client, webmapx included:

- **A list of styles is the set of `style` assets** on the collection, one of them `default`, each with a `title`. Not a separate `styles.json` manifest: the spec says explicitly that discovery is by role and that it defines no manifest. Styles a user made in the editor become style assets when published. Asset keys `style-<variant>` are the convention.
- **Sort indexes as `pg:sort-index` assets** fit Portolan-plus as they are. Keep the asset self-describing (`pg:keys`, collation) so a reader needs no other source.

## Alternatives considered

| Option | Why not |
|---|---|
| Package `@edugis-org/portolan-read` published from PolderGIS (npm workspace) | Couples webmapx to PolderGIS's lifecycle; forks of webmapx inherit a dependency they do not use; PolderGIS ADR 0007 is "one package at the root" |
| A separate `portolan-read` repository of our own | A third thing to maintain while portolan-sdi is the natural owner; reconsider only if upstream declines and a third consumer appears |
| Vendor portolan-browser's map code | Vue-bound and draws through deck.gl; webmapx has four engines and its own layer model |
| Draw GeoParquet directly instead of PMTiles | Only for small files (the spec allows it for "a small GeoParquet"); the `visual` asset exists precisely so a client need not — kept as a fallback when a collection has no `visual` |
| Import large files in webmapx itself (PolderGIS's stream route to OPFS, as a copy or as a plugin from the PolderGIS repo) | Technically possible (BAG buildings: ~18 min in Chrome, 1.1 GB PMTiles), but it is publishing work; two tools doing it means two conversion pipelines to keep correct. Users publish with PolderGIS and consume in webmapx |
| Browse catalogs inside webmapx: a `catalogs` config section listing every collection, or a layer-tree node `type: "portolan"` with `allowedLayers`/`deniedLayers` (as `getcapabilities` does for WMS) | Both put selection at view time. Choosing which layers a map offers is authoring, which `setup.html` and the layer repository already do for every other kind of source; a second, Portolan-only selection mechanism in the viewer would duplicate them. The node remains possible later if a config wants a library's *whole, changing* content |
| Read PolderGIS `pg:` extras as required | Then webmapx would read only PolderGIS catalogs, not Portolan |

## Order of work

1. One collection as a layer. **Done (2026-11-22):**
   - A collection is addressed as `portolan://<collection.json>` — the `pmtiles://` convention one level up — in either place a URL can stand (owner, 2026-11-22, replacing a first version that put a bare collection URL in a style's `url`: a collection is not a style, and the config should say what it holds):
     - **style URL** (`{ "type": "style", "url": "portolan://…[#style-key]" }`, or `styleUrl` in a request): the publisher's default style, or the named style asset, bound to the collection's data (`expandStyleBackedLayer` → `expandPortolanCollection`). The layer follows the publisher's restyles and data fixes.
     - **source URL** (`{ "type": "vector", "url": "portolan://…" }`): only the data; paint and filter are the config's own, in plain MapLibre style spec — buildings by construction year, or only Amsterdam's. `resolvePortolanSources` (`map/portolan-sources.ts`) rewrites such sources to `pmtiles://<current file>` (or `geoparquet://` for a small collection without tiles) before any engine sees them, the way `geoparquet://` is resolved, on copies so a saved config still says `portolan://`.
     - A bare collection URL as a style `url` is refused with a console hint. `portolan` is a tile protocol in `canDrawSource` terms, so Leaflet and Cesium are not offered these layers. The rules live in `src/utils/portolan-collection.ts`, pure and unit-tested.
   - Drawn from the default style asset, its sources rebound to the collection's own data: the PMTiles `visual`, or — for a collection with no `visual` and at most `MAX_SOURCE_ROWS` (50 000) rows — the GeoParquet `data` through `geoparquet://`. A Portolan style names its source relative to itself (`pmtiles://../x.pmtiles`), and `new URL` cannot resolve inside a wrapper (it leaves the relative path alone, and turns `pmtiles://https://a/x` into `pmtiles://https//a/x`), hence `resolveWrappedUrl`. A render-from-source style in the reference catalog points a `vector` source at the `.parquet`; it becomes a GeoJSON source and loses its `source-layer`.
   - Title, description, bbox, row count and attribution (`attribution`, else producer/licensor names, plus the SPDX licence) come from the collection; config values win. Attribution sits on the source, where every engine reads it. The rest (style list, data/visual hrefs, columns, thumbnail) is kept in `metadata.portolan` for the later steps.
   - No `stac-js`: reading one collection is filtering assets by role (point 1).
   - Tests: 12 unit tests against documents of the spec's reference catalog (`tests/fixtures/portolan/`, Apache-2.0, see NOTICE) — PMTiles and GeoParquet render paths, default-style rules, legacy `portolan:styles` manifest, non-http hrefs refused, raster/table-only collections, the fallback style. UI test `portolan-collection` on MapLibre and OpenLayers against the hosted reference catalog: the provinces draw from PMTiles in the publisher's colours, all 177 countries load from GeoParquet, both labelled with their collection title; skips when the host is unreachable.
   - Spec version moved on while this was written: the reference catalog declares Portolan v0.4.0. Nothing read here changed between versions.
2. Layer repository: source type `portolan-catalog`. **Built (2026-11-22, branch `feat/portolan-catalog` in webmapx-layer-repository):**
   - `lib/portolan.mjs`, import-free: `listCollections` (the PolderGIS `pg:index` when linked — two requests for a whole library — else a bounded walk of `child` links; a URL of a single collection lists just that) and `layerFromCollection` (a layer record whose `webmapxConfig` is `{ type: 'style', url: 'portolan://<collection.json>' }`, with title, abstract, bounds, attribution, attributes from `table:columns`, and the style list, thumbnail and licence under `metadata.portolan`).
   - Harvest reader filing each collection by its own extent, like Allmaps (EduGIS: BAG under the Netherlands, the 1832 waterways under Noord-Holland, world boundaries under world). `include.kinds` defaults to `vector` until webmapx draws COGs.
   - Live reading in the previewer through the same file, listed in `catalogues.json` beside the GeoNetwork catalogues: a library published since the last harvest is already selectable. The harvest stays what makes layers findable by search and region.
   - Sources: `edugis-library` (9 vector layers; 3 rasters skipped), `portolan-reference` (6), and two catalogs from the Portolan registry, `portolan-nl` (34: Rijkswaterstaat, Kadaster, CBS, RVO, RCE, …) and `vlaanderen-open-data` (34). The registry itself (98 catalogs) is not harvested: harvesting it whole contradicts reviewing each endpoint, and a walk that large would hit the 200-catalog bound and drop layers silently. It is offered **live only** (`portolan-registry` source, `"harvest": false`): the previewer lists its catalogs with host, producers, licences and validation status, and reads the one a visitor picks — the curated/uncurated split the GeoNetwork search already follows. 7 unit tests; harvested files validate; the sources probe up.
   - A national dataset's bbox is a rectangle of which the country fills about half, so the majority rule filed Portolan NL's national layers under Europe. A catalog's declared region now wins when the placement lands on one of its ancestors and the layer's centre lies inside it (`withinSourceRegion`); finer placements and world catalogs are untouched.
   - The previewer loads webmapx 0.2 from npm, so its preview map needs a webmapx release with step 1 in it.
3. `setup.html`: pick Portolan layers in the Repository tab into a config.
4. COG raster layer (MapLibre, OpenLayers), also for dropped GeoTIFFs.
5. Style picker over the `style` assets; style override in config.
6. GeoParquet as full data for info/Analysis; attribute table after PolderGIS ADR 0008; sort indexes.
7. Mosaics. Optionally the `portolan-registry` as a source of catalogs.

Each step ships on its own. Docs (`docs/user`, webmapx.com/tools) change with the step that changes the UI.
