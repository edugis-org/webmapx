# Layer styling: what we have, what is missing, and how the UI should ask

Working document for the layer-style UI. Three parts: an inventory of styling
functionality (what already exists in webmapx, what is partly there, what is
missing), a gap check against QGIS layer properties, and a proposal for how the
UI should be shaped.

Audience: whoever builds this. Nothing here is decided yet — the open questions
are listed at the end.

---

## 1. What exists today

Grounded in the code, not in intent.

### Editing

| Where | What it does | File |
|---|---|---|
| Legend inline editor | Colour of one stop (Pickr), fill/line/circle colour, outline colour, opacity, line width, circle radius. Applies live via `adapter.updateLayerStyle`, keeps local overrides for preview | `src/components/webmapx-layer-legend.ts` (`renderStyleEditor`, `setPaintOverride`) |
| Style dialog | **Read-only.** Per source: feature count, geometry types, attribute list with type, present/missing counts, unique count, range, sample values, and a feature table | `src/components/webmapx-layer-style-dialog.ts` |
| Legend/catalog swatch | Derives a representative colour from the paint spec; `metadata.swatch` overrides; offline baker for raster/style layers | `src/utils/layer-swatch.ts`, `scripts/generate-layer-swatches.ts` |
| Transparency slider | Per-layer opacity, mirrored into the store | `webmapx-layer-overview.ts` → `adapter.setLayerOpacity` |
| Save layers | Exports data + a generated style document per layer | `webmapx-save-layers-dialog.ts` |

So: **the stats the styling UI needs are already computed** (type, unique count,
range, missing count, samples). What is missing is the step from "here is what
your attribute looks like" to "style it like this".

### Rendering model

- Config is close to the MapLibre GL style spec. A logical layer already *can*
  have several sublayers (fill + line, circle + symbol) — `layers: [...]` in a
  `type: 'style'` container. **Nothing in the UI creates one.**
- Expressions: `match`, `case`, `interpolate`, `get`, zoom-dependent values are
  supported by the engines and understood by the legend (`evalFilter`,
  `evaluateNumber`) and by `deriveLayerSwatch`.
- Legend labels for classes come from `metadata.attributes` → `valuemap`, with
  the empty-label convention hiding a case (see `CLAUDE.md`).
- `minzoom`/`maxzoom` per layer and per sublayer exist in config.
- `filter` expressions are honoured and evaluated by the legend.

### Engine constraints that shape the UI

- **MapLibre** applies paint changes in place (`setPaintProperty`) — cheap, can
  be live-previewed on every slider tick.
- **OpenLayers** has no `setPaintProperty`: a GL paint spec becomes an OL style
  function at construction, so a change means **rebuilding the layer**
  (`rebuildWithPaint`). Live preview must therefore be throttled, and a
  "preview on release" mode may be needed for big vector layers.
- **Leaflet/Cesium** are further from the GL model again. Anything the UI offers
  must degrade honestly: a feature that only works on two engines must say so
  rather than silently do nothing (that class of bug has bitten twice already).

### Geometry-changing operations that already exist

The Analysis tool (`GEO_OPERATIONS`) covers a lot of what a styling UI would
otherwise be tempted to reimplement: `centroid`, `labelPoint`, `dissolve`,
`convexHull`, `buffer`, `simplify`, `statistics`, `voronoi`, `delaunay`,
`cartogram`, plus the overlay set. **Polygons → label points is a solved
problem; the styling UI should link to it, not rebuild it.**

Missing from that list and relevant here: **explode** (multipart → single part)
and its inverse **join/aggregate by attribute** (dissolve does the geometric
half), **polygons → lines** (boundaries), **lines → polygons** (close rings).

---

## 2. Functionality inventory

Legend: ✅ exists · 🟡 partly there · ❌ missing.

### 2.1 Geometry role — "what do you want to draw?"

| Function | State | Notes |
|---|---|---|
| Point → circle | ✅ | `circle` sublayer |
| Point → icon/symbol | 🟡 | `symbol` layers render; no sprite picker, no icon set shipped |
| Point → label | 🟡 | `text-field` works; nothing in the UI writes one |
| Point → chart/diagram (pie, bar) | ❌ | QGIS "Diagrams". Would need a runtime symbol generator |
| Line → stroke, dashed, width | ✅ | dash array editable only as raw config |
| Line → casing (two stacked line layers) | 🟡 | expressible, not creatable in UI |
| Line → arrows/direction | ❌ | needs sprite + `symbol-placement: line` |
| Polygon → fill | ✅ | |
| Polygon → fill + outline as separate layer | 🟡 | `fill-outline-color` only does 1px; real outlines need a `line` sublayer |
| Polygon → pattern fill | ❌ | `fill-pattern` needs sprites |
| Polygon → extrusion (2.5D) | 🟡 | `fill-extrusion` supported by MapLibre only |
| Heatmap | 🟡 | MapLibre `heatmap` type; not offered anywhere |
| Cluster | 🟡 | GeoJSON source `cluster: true`; no UI |
| Multiple styles on one layer | 🟡 | **the sublayer array already does this** — needs UI |

### 2.2 Classification

| Function | State | Notes |
|---|---|---|
| Single symbol | ✅ | |
| Categorized (unique values) | 🟡 | `match` expression renders + legends correctly; no builder |
| Graduated (ranges) | 🟡 | `case`/`step`/`interpolate` render; no builder |
| Equal interval | ❌ | trivial |
| Quantile (equal count) | ❌ | trivial |
| Natural breaks (Jenks) | ❌ | use `simple-statistics` `ckmeans` — exact, and faster than classic Jenks |
| Standard deviation | ❌ | |
| Pretty/rounded breaks | ❌ | worth having: "0–20, 20–40" reads better than "0–19.7381" |
| Manual breaks | ❌ | must exist — the others are starting points |
| Rule-based (arbitrary filters) | ❌ | QGIS's most powerful renderer; maps onto `filter` per sublayer |
| Class count + preview histogram | ❌ | a histogram is the single most useful widget here |

### 2.3 Colour

| Function | State | Notes |
|---|---|---|
| Pick one colour | ✅ | Pickr |
| Colour ramp 2 stops (from → to) | ❌ | |
| Colour ramp 3 stops (from → via → to) | ❌ | diverging |
| Named scheme library | ❌ | see §4 |
| Reverse a scheme | ❌ | one checkbox |
| Colour-blind-safe filter | ❌ | **EduGIS's colorbrewer copy already carries the flags** |
| Print/photocopy-safe filter | ❌ | same source |
| Contrast check against basemap | ❌ | worth prototyping; hard to do honestly |
| Random/distinct palette for many categories | ❌ | needed when categories > 12 |

### 2.4 Attributes and data

| Function | State | Notes |
|---|---|---|
| List attributes | ✅ | style dialog |
| Type detection (number/string/date/URL/image) | 🟡 | number/string/date-ish; **no URL or image detection** |
| Min/max/mean/sum | 🟡 | `statistics` operation computes them; the dialog shows range only |
| Count, null count, unique, is-unique | ✅ | dialog |
| Show attribute table | ✅ | dialog (`featureRows`) |
| Sort/filter the table | ❌ | |
| Histogram of a numeric field | ❌ | needed for classification |
| Field alias / display label | 🟡 | `metadata.attributes.translations` does this; not editable in UI |
| Value → label mapping | 🟡 | `valuemap` exists; not editable in UI |
| Combine attributes (concat, expression) | ❌ | QGIS virtual fields |
| Layer filter (subset query) | 🟡 | `filter` honoured; no builder |

### 2.5 Labels

| Function | State | Notes |
|---|---|---|
| Label from attribute | 🟡 | `text-field` works, no UI |
| Font size/colour/halo | 🟡 | paint keys exist, no UI |
| Placement (point/line/polygon centroid) | 🟡 | `symbol-placement` |
| Collision/priority | 🟡 | `text-allow-overlap`, `symbol-sort-key` |
| Callouts/leader lines | ❌ | |
| Scale-dependent labels | 🟡 | zoom expressions |

### 2.6 Structure operations (styling-adjacent)

| Function | State |
|---|---|
| Explode multipart → parts | ❌ |
| Join/aggregate by attribute | 🟡 (`dissolve` does geometry + aggregation) |
| Polygons → lines | ❌ |
| Lines → polygons | ❌ |
| Add centroids / label points as a new layer | ✅ (`centroid`, `labelPoint`) |

### 2.7 Whole-layer

| Function | State |
|---|---|
| Opacity | ✅ |
| Visible zoom range | 🟡 (config only) |
| Blend mode | ❌ |
| Draw order | ✅ (legend drag) |
| Copy style to another layer | ❌ |
| Save/load style | 🟡 (save dialog exports; no import-onto-layer) |
| Undo/redo of style edits | ❌ |
| Reset to original | ❌ |

---

## 3. Compared with QGIS layer properties

Things QGIS has that are not in the list above and are worth a decision:

- **Symbol levels** — control which sublayer draws on top *within* a layer, so
  road casings join properly. Maps onto sublayer order.
- **Data-defined overrides** — any symbol property can be an expression, not
  just colour. In GL terms this is already true; the UI question is whether to
  expose "make this value depend on an attribute" on every field.
- **Renderers we do not have**: rule-based, point displacement, point cluster,
  inverted polygon, merged features, 2.5D, embedded/stacked symbols.
- **Draw effects** — drop shadow, glow, blur. Not available in GL styling.
- **Masks** — hide symbol parts under labels. No GL equivalent.
- **Layer rendering**: blend mode, feature blending, simplification, "refresh at
  interval", scale-dependent visibility, opacity — we have opacity + zoom range.
- **Joins** — attach a CSV/table to a layer by key field. **This is a real gap
  for teaching**: "colour the municipalities by this spreadsheet column" is a
  classic school exercise. Nothing in webmapx does it today.
- **Diagrams** — pie/bar chart per feature, sized by a value. This is the "show
  data graphs" idea; it is a renderer, not a chart panel.
- **Temporal** — animate features by a date field.
- **Elevation/3D**, **Metadata**, **Feature forms/actions**, **QML style files**.
- **Field widgets** — how a value is *edited*; not relevant to a read-only map.
- **Legend customisation** — hide a class, rename it, custom legend image. Our
  empty-label convention covers hide/rename already.

Nothing in the original brainstorm is redundant; the additions worth adding to
it are **joins**, **rule-based styling**, **symbol levels**, **diagrams**,
**cluster/heatmap**, **layer filter**, **copy/paste style**, and **undo/reset**.

---

## 4. Colour libraries

**Reuse the EduGIS colorbrewer module.** `edugis-viewer/src/lib/colorbrewer.js`
(~4 000 lines, generated) carries per-scheme, per-class-count usage flags:

```js
{ colors: [...], blind: 'ok'|'maybe'|'bad', print: ..., screen: ..., copy: ... }
```

and `getColorSchemes(numClasses, 'seq'|'div'|'qual', reversed, usage)` filters on
them. **That metadata is the whole point** and it is exactly what answers the
"visually impaired friendly yes/no" requirement. It does not exist in the
popular modern packages:

| Library | Size | Has | Lacks |
|---|---|---|---|
| `d3-scale-chromatic` | ~35 KB | Every ColorBrewer ramp + viridis/magma/etc., continuous interpolators | **No CVD/print flags**, no class-count filtering |
| `colorbrewer` (npm) | ~30 KB | Raw ColorBrewer data by class count | No usage flags in most builds |
| `chroma-js` | ~40 KB | Interpolation (lab/lch), `chroma.scale().classes()`, contrast ratio, CVD-ish helpers | No curated scheme metadata |
| `culori` | tree-shakeable | Modern colour science, OKLCH, CVD simulation (`filterDeficiencyProt/Deuter/Trit`) | No schemes |
| `cartocolor` | small | CARTO's schemes, designed for maps | No flags |

Recommendation:

1. **Port the EduGIS colorbrewer data** (it is data + a 40-line selector; drop
   the rest) as `src/utils/color-schemes.ts`. Licence is ColorBrewer's, which we
   already ship in the EduGIS viewer.
2. Add **`culori`** *if* we want a real colour-vision-deficiency preview
   ("show me this map as a deuteranope") — it does the simulation properly, and
   tree-shakes to a few KB for that one function.
3. Add **`chroma-js`** only if we need interpolation between arbitrary
   user-chosen stops (the from → via → to case). A 3-stop lab interpolation is
   ~30 lines by hand; prefer that over a dependency if that is all we need.
4. **`simple-statistics`** for `ckmeans` (natural breaks) — or port `ckmeans`
   alone, it is about 60 lines.

Do not take `d3-scale-chromatic` as the primary source: it would cost us the
accessibility metadata that is the most valuable part of ColorBrewer for a
teaching product.

---

## 5. How the UI should ask

### The tension in "wizard with back/forward"

Stepwise is right — one decision per screen is far easier than a form of twenty
controls, and later options genuinely depend on earlier ones (you cannot choose
a class count before choosing an attribute). But the repo already has a hard-won
rule from the Analysis tool (`CLAUDE.md`):

> The UI is progressive disclosure on one panel (operation grid collapses to a
> chip, inputs appear below), **never a wizard with a back button, which would
> drop parameter state.**

Both can be true at once. What makes a wizard painful is not the steps, it is
that stepping back **unwinds** what you did. The fix is:

### Proposal: a stack of resolved decisions, all reopenable

Every answered step **collapses into a one-line summary row** that stays on the
panel and can be clicked to reopen. The next question appears underneath. So:

```
┌─────────────────────────────────────────┐
│ Layer: Municipalities            [×]    │
├─────────────────────────────────────────┤
│ ✓ Show as    Areas (fill)      [change] │  ← collapsed, click to reopen
│ ✓ Colour by  Population        [change] │
│ ✓ Method     5 classes, quantile [change]│
├─────────────────────────────────────────┤
│ Colour scheme                           │   ← current question
│  ▸ [▬▬▬▬▬] YlOrRd        colour-blind ok│
│  ▸ [▬▬▬▬▬] Blues         colour-blind ok│
│  ▸ [▬▬▬▬▬] Spectral      ⚠ not CVD-safe │
│  ☑ Only colour-blind-safe               │
│  ☐ Reverse                              │
├─────────────────────────────────────────┤
│ [ Add another style ]      [ Done ]     │
└─────────────────────────────────────────┘
```

Properties of this shape:

- **"Back" is just clicking an earlier row** — and because the panel is one
  component holding one state object, reopening step 2 does not discard step 4.
  Only what genuinely depends on the changed answer is invalidated, and the UI
  says so ("changing the attribute will reset your manual breaks").
- **No modal, no navigation**: the map stays visible and every change is applied
  live. Styling is judged by looking at the map, not at the form.
- It reuses the exact pattern of `webmapx-geoprocessing-tool`, so it is
  consistent with a tool students already use, and the panel-width mechanism
  (`webmapx-panel-width`) is already there for a wider styling panel.
- Forward/back *buttons* can still exist as an accessibility affordance for
  keyboard users, driving the same collapse/expand.

### Suggested step sequence

1. **What do you want to show?** — driven by the layer's actual geometry types
   (already computed): areas / outlines / points / labels / heat / clusters. A
   polygon layer offers "areas" and "outlines"; a point layer offers "circles",
   "symbols", "labels", "heatmap", "cluster".
2. **One colour, or by attribute?** — single symbol vs. data-driven. Choosing
   "one colour" ends the flow at step 4 (colour + size + opacity).
3. **Which attribute?** — the list already exists, annotated with type, unique
   count, range, and missing count. **Sorted by usefulness**: numeric fields
   with few nulls first, `id`-like unique fields last, and unusable fields shown
   but disabled with the reason.
4. **How to divide it?** — categories (if few unique values) or ranges. For
   ranges: method (equal interval / equal count / natural breaks / manual) +
   class count, with a **histogram showing the breaks**, which is where a
   student actually learns what the method did.
5. **Colours** — schemes filtered to the class count and the chosen type
   (sequential for ranges, qualitative for categories, diverging when the data
   straddles a meaningful midpoint — offer it automatically when min < 0 < max).
6. **Refine** — opacity, outline, size, labels on/off. Each is optional and
   collapsed by default.

Then: **"Add another style"** returns to step 1 for the same layer, producing a
second sublayer (fill + outline, circle + label). This is how the multi-style
requirement is met without ever explaining the word "sublayer".

### Two things worth stealing from elsewhere

- **A preview strip of the result before applying** (Mapbox Studio, Felt):
  swatch row + class labels, so the choice is judged before the map redraws.
  Matters more on OpenLayers, where every change rebuilds the layer.
- **Undo, and "reset to original"**. Styling is trial and error; the ability to
  get back is worth more than any individual option. A style is a small JSON
  object, so the undo stack is a list of them — cheap.

---

## 6. Build order

1. **Foundations**: `color-schemes.ts` (ported), classification functions
   (equal interval, quantile, ckmeans, manual) + tests on real data,
   `buildPaintExpression(classification, scheme, geometryRole)`.
2. **The panel** with steps 1–5 for the single most valuable case: a polygon
   layer coloured by a numeric attribute. That alone covers most school use.
3. Categories, labels, "add another style".
4. Accessibility: CVD filtering (data already there), optional CVD preview.
5. Undo/reset, copy style to another layer.
6. Later, in rough value order: layer filter builder, table joins, rule-based,
   cluster/heatmap, diagrams.

---

## 7. Open questions

- **Where does the styled result live?** A style edit today is a runtime
  override. Does it survive a permalink? A saved config? Stories? (Permalink
  carries visibility + opacity only — a whole paint spec is far bigger.)
- **Does the UI edit the layer, or produce a new layer?** QGIS edits in place;
  our geoprocessing tools produce new layers. Mixing both is confusing.
- **How much data may be inspected?** Classification needs all values.
  `queryLayerFeatures` gives the full dataset for GeoJSON but only the viewport
  for tiled sources — classifying a tiled layer would classify what is on
  screen, which changes as you pan. Either refuse, or say so loudly (the
  Analysis tool's `isViewportLimited` warning is the precedent).
- **Which engines must support it?** Full support is MapLibre + OpenLayers;
  Leaflet and Cesium will lag. What does the UI show there?
- **Sprites/icons**: shipping an icon set is a licensing and size decision that
  blocks the "symbol" branch of step 1.
- **Is a join in scope?** It is the single biggest missing capability for
  teaching, and it is not styling — it might belong in the Analysis tool.
