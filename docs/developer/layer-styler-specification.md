# Layer styler: decision hierarchy

Specification for the shape of the layer-style UI. It answers one question —
**in which order does the user decide things, and what is therefore visible when**
— and deliberately says nothing about visual design.

**This document is the rule where the two disagree.** Its companion
`layer-style-ui.md` inventories what styling functionality exists, compares it
with QGIS, and records the decisions behind it; that document's §5 ("How the UI
should ask") is **superseded** by this one and marked as such. Everything else in
it still stands, and the last section here lists what this document inherits from
it rather than repeating.

## Why the current dialog needs this

`webmapx-layer-style-dialog.ts` is a flat state bag (`mode`, `method`,
`circleShow`, `schemeOpen`, `methodOpen`, `labelsAdded`, `schemeOutline`, …) that
styles **one** target at a time. Composite layers, casing pairs (a 2px white
dashed line over a 4px black one) and labels are bolted on as boolean flags
rather than being what they are: several styles on one source. The missing piece
is an object model, not UI polish.

Two observed complaints follow from that, and both are fixed by the hierarchy
below rather than by restyling the panel:

- **A section collapses the moment you choose an option.** The point of the
  option selector is that the map answers immediately, so the user wants to try
  three palettes before moving on. Selection must therefore never collapse the
  thing that was selected.
- **An already-styled layer opens on defaults.** Every control must open showing
  what the layer currently *is*.

## The ordering rule

A decision comes earlier if it changes **which decisions exist later**.

Leaf constants — width, opacity, dash pattern, halo — gate nothing, so they are
never a step: they are always rendered and always open.

Levels 0–2 are dropdowns that **stay put** after selection. Level 3 is a dropdown
whose value reveals level 4. Levels 4–5 are always open. No accordion anywhere.

A dropdown with nothing chosen yet reads as an instruction — *Select a
classification method* — not as a blank.

---

## Level 0 — Source

Which dataset is being styled. Omitted entirely when the layer has one source;
a dropdown when it has several (a composite over multiple sources):

```
Data: gemeenten (12 480 polygons)          ▾
```

The viewport-limited warning belongs here: it is a property of the source
(`completeData === false` on the `SourceStyleGroup`), not of any style on it.

## Level 1 — The style list on that source

The level the present dialog lacks, and the one that resolves composite layers,
casing pairs and labels at once.

```
Styles                                     [+ Add style]
  ▸ Outline — 4px black                ⠿ ⧉ 🗑
  ▸ Fill — by population density       ⠿ ⧉ 🗑
  ▸ Labels — name                      ⠿ ⧉ 🗑
```

- Existing sublayers of a `type: 'style'` container populate this list, so
  opening the styler on an authored layer shows the layer's real structure.
- **Duplicate** (⧉) copies levels 2–5 of an entry. That is the whole railway
  casing workflow: duplicate the 4px black line, change width to 2, colour to
  white, add a dash.
- Drag (⠿) reorders; order *is* draw order.
- Delete removes the sublayer.

## Level 2 — Role

First dropdown inside a style entry. Options are filtered by the source's
geometry, and the role decides which channels exist below it.

| Geometry | Roles offered, in this order |
|---|---|
| Polygon | **outline** · fill · pattern · label |
| Line | line · label |
| Point | circle · icon · symbol · label |

**Outline is offered first for polygons, and a new polygon style starts with
one.** Coloured polygons with no visible boundary are unreadable as a map —
neighbouring classes merge into one blob and the user cannot tell whether two
areas are one feature or two. Deciding the outline first also means the fill
classification is judged against a map that already has structure.

`fill` and `outline` are **separate entries in the level-1 list**, not one
compound role. That is what makes "fill, no stroke" and the casing case fall out
of the model for free instead of needing a `schemeOutline` flag.

## Level 3 — Driver, per channel

Each role owns a fixed set of visual channels. A channel is one dropdown:

```
Single value  |  By attribute  |  By neighbours
```

Default `Single value`, so a freshly added style is valid and drawing
immediately.

| Role | Channels, in this order |
|---|---|
| outline | width · pattern (dash) · colour · paint opacity |
| fill | colour · paint opacity · (pattern) |
| line | **width · pattern · colour · label** |
| pattern | image · scale · colour |
| circle | colour · radius · stroke · paint opacity |
| icon / symbol | image · size · rotation |
| label | text · size · colour · halo · placement · font · order *(see the label section)* |

For a **line**, width and pattern come before colour: a hairline and a 6px line
of the same colour are different map objects, and a dash pattern is invisible at
1px, so the user should settle the line's weight and rhythm before judging its
hue. `label` is listed as a line channel for discoverability — choosing it adds a
`label` entry to the level-1 list rather than nesting a second role inside the
line style, so there is still exactly one role per style entry.

Channels within one role are genuinely independent: they render stacked, in the
table's order, with no forced sequence between them.

## Level 4 — Classification

Appears only under a channel whose driver is *By attribute*, nested under that
channel, in fixed order:

```
attribute → method → class count → palette
            (+ reverse, colourblind-safe, rounded breaks)
```

This is the existing content of the dialog unchanged — scoped to one channel
instead of to the whole panel.

## Level 5 — Constants

Leaf inputs for whatever the channel needs: a colour (with alpha), a width, a
dash array, a halo width. Always rendered, never collapsed.

---

## Opacity: three different settings, three different places

These are not the same control and must not be presented as one.

There are in fact **three**, because the present dialog's own `opacity` slider is
neither of the two obvious ones:

| | What it is | Where it lives | Scope |
|---|---|---|---|
| **Colour alpha** | The `a` in `rgba()`, part of a paint colour or of a palette entry | Level 5, inside the colour control (Pickr's alpha slider) | One colour |
| **Paint opacity** | `fill-opacity` / `line-opacity` / `circle-opacity` / `text-opacity` — `ROLE_OPACITY_KEY` in `style-builder.ts`, written by `withOpacity` | Level 5, one per style entry, labelled with the role | One style entry |
| **Layer opacity** | `adapter.setLayerOpacity`, mirrored to `store.mapLayers[id].transparency` | The legend slider **and** a style-wide control at the top of the styler, above level 0 | Every style on the layer |

Colour alpha and paint opacity multiply, so two controls can produce the same
picture — which is why only one of them should be prominent. Recommendation:
**paint opacity is the visible slider** (it is what the dialog already applies,
and it dims a whole classified ramp in one move), and colour alpha stays where it
belongs, inside the picker, for the occasional translucent single colour.

Layer opacity is layer-global, so it cannot sit inside a style entry — a user who
set it there would reasonably expect it to apply to that entry alone. It sits
above the source selector, visibly outside the per-style structure, and is the
same value the legend slider shows: both write through
`BaseAdapter.setLayerOpacity`, so the two stay in step by construction (see the
store-mirroring rule in `CLAUDE.md`).

The distinction has to be legible in the labels, because the visual result
overlaps: *Fill colour opacity* versus *Layer opacity (all styles)*.

---

## Pre-selection: decoding existing paint

Every control opens showing the layer's current value. That needs a
`decodePaint(paint) → StyleState`, the inverse of `src/utils/style-builder.ts`.
Today only three fragments of this exist (`authoredColor`,
`adoptAuthoredOutline`, `sizeIsAuthoredExpression`).

One decoder per role. It detects `['match', …]` / `['step', …]` /
`['interpolate', …]` / `['case', …]` and recovers driver + attribute + breaks +
palette.

**Anything unrecognised becomes driver `Custom (expression)`, with the raw JSON
shown read-only.** Without that branch, opening the styler on a hand-authored
config silently replaces an expression nobody can get back — the worst outcome
this panel can produce.

## Invariants

1. One role per level-1 entry. Several entries per source. Several sources per
   layer.
2. Selecting a value never hides the control that was selected.
3. Nothing in levels 0–3 has a state that makes the map stop drawing.
4. Opening the styler on a layer and closing it without touching anything leaves
   the paint byte-identical.

---

## Where every control of today's dialog lands

Inventory of `webmapx-layer-style-dialog.ts` as it stands, checked against the
hierarchy. Nothing in the present panel is dropped; most of it moves one level
down, from "the whole dialog" to "one channel of one style entry".

| Today | Code | Lands at |
|---|---|---|
| *What do you want to change?* — one button per sublayer of the styled layer | `renderTargetStep`, `ROLE_OF_TYPE` | **Level 1**, the style list. Same information, but as a persistent list with add/duplicate/delete/reorder instead of a step that collapses to a ✓ row |
| *How should it be coloured?* — One colour / By attribute / Neighbours differ | `renderModeStep`, `ColorMode` | **Level 3**, the colour channel's driver dropdown: `Single value` / `By attribute` / `By neighbours` |
| Colour picker for one colour | `renderSingleColor`, `singleColor` | **Level 5** under driver `Single value` |
| Circle outline colour + width | `renderOutlineStep`, `strokeColor`/`strokeWidth` | **Level 3/5** of the `circle` role's `stroke` channel |
| *Neighbours differ* — colour-count slider, isolated-area note, "no shared borders" warning | `renderNeighbourNote`, `syncNeighbourColoring` | **Level 4** under driver `By neighbours` (see below) |
| *Which attribute?* — attribute list with type, unique/present counts, range, samples; key columns disabled | `renderAttributeSteps`, `sortedAttributes`, `attributeSummary` | **Level 4**, first question under driver `By attribute` |
| *Show it by…* — Colour / Circle size / Both | `renderCircleShowStep`, `CircleShow` | **Level 3**: it is not a separate question at all. It *is* which of the circle role's channels are set to `By attribute` — colour, radius, or both. The dedicated step disappears, which is one fewer concept |
| Proportional-radius note + bubble legend | `renderBubbleNote`, `buildProportionalRadius` | **Level 4** under the `radius` channel with driver `By attribute`. No class list there by design |
| *How should the numbers be divided?* — method grid with per-method class bars, class count, Round, histogram, crowded-classes note | `renderMethodStep`, `renderClassBars`, `renderHistogram`, `renderCrowdedNote` | **Level 4**, unchanged, scoped to the channel |
| *Categories* — max categories, "give every value a colour, repeating" | `renderCategoryStep`, `cycleCategories` | **Level 4** for a non-numeric attribute |
| *Colours* — scheme list, colour-blind-safe filter, Reverse | `renderSchemeStep`, `colorSchemesFor` | **Level 4**, last question |
| Outline checkbox + outline colour inside the scheme step | `schemeOutline`, `schemeOutlineColor` | **Gone.** A polygon outline becomes its own level-1 entry, which is the whole point of deciding the outline first |
| Opacity slider + "as drawn" strip | `renderOpacity`, `appliedColors` | **Level 5**, paint opacity, per style entry |
| Size slider (circle radius, line width) incl. "this layer sizes itself from the data" | `renderSize`, `ROLE_SIZE`, `sizeIsAuthoredExpression` | **Level 5** of the role's size channel; the authored-expression case becomes driver `Custom (expression)` |
| *Labels* — attribute list, text colour, text size; added as an extra sublayer with a halo | `renderLabels`, `applyLabels`, `setExtraSubLayer` | **Level 1**: adding labels adds a `label` entry to the style list. The mechanism stays (`setExtraSubLayer`, a sublayer of the layer, not a layer beside it) — only the way it is asked for changes |
| Legend preview | `renderPreview` | Stays, once per style entry |
| Viewport-limited warning (`completeData === false`) | `render` | **Level 0**, a property of the source |
| Read-only data view: feature count, geometry types, attribute table, feature rows | `renderData` | Stays at the foot of the panel, outside the hierarchy |
| Raster branch: *Images, not features*, WMS `GetCapabilities` style list, raster opacity | `renderRaster`, `renderWmsStyles`, `applyWmsStyle`, `renderRasterOpacity` | A **level-0 variant**: a raster source offers no style list, only the service's own styles plus layer opacity. Note its opacity slider already writes `sourceControl.setLayerOpacity`, i.e. the layer-global one |
| Reset / Done footer | `resetStyle`, `originalPaint` | Stays. Reset must now restore every entry in the style list, and remove entries the session added |
| Draggable panel, Escape, on-screen clamping | `startDrag`, `onKeydown`, `ensureOnScreen` | Unchanged |

### The three colourings, stated as drivers

Your "all different colours, independent of attribute" is `mode: 'neighbours'`,
and it is a driver like the other two rather than a mode of the panel:

| Driver | What decides the colour | Needs | Legend |
|---|---|---|---|
| **Single value** | Nothing — one colour | — | One swatch |
| **By attribute** | A column's value, through a classification | Features loaded; a groupable column | One row per class |
| **By neighbours** | A graph colouring of the areas: no two touching areas alike | Polygons; *and* either a writable source or a unique key (`coloringKeyFor`) | **None** — a colour names no value |

The third one's constraints are what force it to stay a first-class choice rather
than becoming "palette applied randomly": it writes a computed column into the
source (`syncNeighbourColoring`, `canWriteFeatures`), it is meaningless on a
tiled layer with no unique column, and it has a colour-count slider instead of a
class count. Its disabled reasons (`Areas only`, `No features are loaded`) must
survive into the dropdown as disabled options with the same explanations — a
missing option is a question the user cannot ask.

`cycleCategories` is the fourth case and sits *inside* `By attribute`: every
value gets a colour by repeating the palette, so the map is complete but the
legend is meaningless, exactly like `By neighbours`. Keep it where it is, under
the category count.

### Features the hierarchy adds that do not exist yet

Listed so the gap is explicit, not as a promise:

- Several style entries per source, with duplicate and reorder — the railway
  casing case, and the only way a polygon gets a fill and an independent outline.
- `pattern` as a role (needs `addImage`), and `icon`/`symbol` for points.
- Line `dash` as a channel.
- `decodePaint`, so the panel opens on what the layer already is.
- Layer opacity inside the styler, reading and writing the same value as the
  legend slider.
- A per-entry `filter` and zoom range (see the rule-based section).

Two assumptions in today's code have to be broken for this, and both are silent
failures rather than errors:

- **`ROLE_OF_TYPE` / `geometryTypes` assume one geometry per source.** A source
  holding points, lines and polygons — ordinary in imported and drawn data — must
  offer all three role families at level 2, and the role of an entry must be the
  entry's own property rather than something derived from the source.
- **`originalPaint` keys one paint per sublayer**, so Reset cannot restore a style
  list whose entries were added or removed during the session.

---

## Labels: the one role with more channels than fit on a panel

A label has more adjustable properties than every other role put together —
colour, size, font family, weight/slant, halo colour, halo width, placement,
offset, render order, and size may itself be driven by an attribute. Putting all
of that on the styler panel would make labels look like the hardest thing in the
product, which is the opposite of true: most label work is *pick a column, make
it bigger*.

So the channels are split by how often they are touched, and the rarely-touched
ones are still reachable — never removed.

| Channel | Values | Tier |
|---|---|---|
| text | attribute (or an expression) | **Primary** |
| size | number, or `By attribute` | **Primary** |
| colour | rgba | **Primary** |
| halo | colour + width | **Primary** (width defaults to 1.4; a label over satellite imagery is unreadable without it) |
| placement | point / along the line / centre of the area; offset; allow-overlap | **More** |
| font | family from the glyph set the basemap provides | **More** |
| weight / slant | normal · bold · italic | **More** |
| render order | the entry's position in the level-1 style list | **Level 1** — it is already there, no channel needed |

**Font, weight and slant are one channel, not three.** MapLibre has no
`font-weight`: `text-font` names a pre-rendered face (`["Noto Sans Bold"]`), so
bold is a *different font*, and which faces exist depends on the glyph server the
basemap uses. The control must therefore offer the faces the style actually has
and nothing else — offering Bold for a glyph set that lacks it produces no text
at all, silently. The legend already reverse-engineers weight from the face name
(`fontStr.includes('bold')` in `webmapx-layer-legend.ts`), which is the same
mapping read backwards.

**Size by attribute is a driver like any other**, so it needs no special case:
the size channel's dropdown gets `By attribute`, and level 4 underneath is the
same classification UI. An `interpolate` on `text-size` is the usual result
(bigger city, bigger name).

**Render order is not a label property.** "Labels on top of everything" is the
label entry being last in the style list — which is the level-1 drag handle doing
the work, and the reason render order is modelled as list position rather than as
a number per style.

## Division of labour: styler versus legend

`webmapx-layer-legend.ts` already has a per-sublayer inline editor
(`renderStyleEditor`), and it is better placed for some of this than the styler
is. Today it edits:

| Sublayer type | Controls |
|---|---|
| fill | colour, opacity, outline colour (`renderOutlineRow`) |
| line | colour, width |
| circle | colour, radius, stroke |
| symbol | text size, text colour, text opacity, halo colour *(only when a halo already exists)* |

That draws the line by itself, and it is a good line:

- **The styler owns structure and meaning** — levels 0–4: which source, which
  styles exist, which role, which channel is driven by what, and the whole
  classification. Decisions that change what other decisions exist.
- **The legend owns leaf values of a style that already exists** — level 5:
  nudge this colour, make that 2px wider, dim it. Decisions that change nothing
  else.

Consequences, and they are deliberate:

- A user who only wants a different green **never opens the styler**. The legend
  row is already where they are looking, and it already edits one stop of a
  classified layer — which the styler, being about the classification as a whole,
  should not try to do per class.
- The styler does **not** need an exhaustive control for every paint key. If a
  channel's value is a plain constant, the legend can edit it. That is the escape
  hatch that keeps the styler panel short.
- The legend's halo control must stop hiding itself. `hasHalo` gates it on a halo
  already being there, so a symbol layer with no halo offers no way to add one —
  show the control with width 0 instead.
- Anything that cannot be a legend row stays in the styler: placement, font,
  allow-overlap, and every driver dropdown.

## Progressive disclosure inside a channel

Each channel renders as one row — label, driver dropdown, the constant — and the
**More** tier hides behind one affordance on that row:

```
Halo      ▾ Single value    [■] 1.4 px                    ⋯
Font      ▾ Noto Sans                                     ⋯
Placement ▾ Along the line                                ⋯
```

Rules for the affordance:

1. **One per channel, always in the same place** (end of the row), so the panel
   teaches once that every channel has more behind it.
2. **It expands in place and stays expanded** — same rule as the levels: nothing
   the user opened closes itself.
3. **It is marked when it holds a non-default value.** A channel whose hidden
   properties have been touched must say so on the collapsed row (a dot on the ⋯),
   or the user cannot tell a panel showing defaults from one showing a layer
   carrying overrides they cannot see.
4. **Never put a driver dropdown behind it.** Hiding `By attribute` hides the
   feature; the affordance is for constants only.

A channel with nothing in the **More** tier renders no affordance at all, rather
than an empty one.

---

## Rule-based styling (QGIS rules) is a filter on a level-1 entry

QGIS's rule-based renderer gives each rule its own filter, symbol and scale
range. The equivalent here is **one style entry per rule, carrying a `filter`**.
Every engine already honours it on a sublayer:

| Engine | Where |
|---|---|
| MapLibre | `MapLibreLayerFactory.ts:19`, `MapLayerService.ts:189` — `layer.filter`, plus `minzoom`/`maxzoom` |
| OpenLayers | `MapLayerService.ts:639` |
| Leaflet | `LeafletLayerFactory.createFilterFunction` |
| Cesium | `matchesStyleFilter`, per entity |

So this costs a field on a style entry and a filter editor, not a new mechanism.

### It must be a filter on an entry, not an extra catalog layer

Simulating a rule with a second *catalog* layer over the same data works on the
map and fails everywhere else: the source is fetched and held twice, the legend
shows N rows for one thing, the user gets N visibility toggles and N opacity
sliders, layer opacity no longer means what the legend slider says, the two can
drift apart in the stack when something is added between them, and a permalink
has to name both. A layer is the thing the user switches on; a rule is not.

Inside one logical layer all of that is free — one source, one toggle, one layer
opacity, one legend group, and order is the position in the style list.

### Where a classification is the better answer

For **one varying paint property over the classes of one attribute**, the level-4
classification wins outright: it produces a legend, a palette, a class count and a
method, all of which a hand-written list of filtered entries would lose. Rules
should not be offered as the way to colour a choropleth.

### Where rules are genuinely the strong feature

These are the cases no classification can express, because a classification
varies a paint value while a rule varies *how many sublayers there are and of
what kind*:

1. **Different symbology per class, not just a different colour.** Motorway as a
   casing pair, track as a 1px dashed brown line, path as dotted. Each rule needs
   a different number of sublayers and a different role.
2. **Scale-dependent rules.** Minor roads from z12, labels only above z10, a
   simplified fill below z6. `minzoom`/`maxzoom` per entry, already supported, and
   not expressible as a paint value at all.
3. **Mixed-geometry sources.** One GeoJSON holding points, lines and polygons —
   common in imported and drawn data. Rules on geometry type are the only way to
   style it; `ROLE_OF_TYPE` currently assumes one geometry per source.
4. **An exception drawn over a generic style.** Every city a grey dot, capitals
   *also* a star: two entries, the second filtered to a handful of features, drawn
   above the first. A classification cannot add a symbol to one class.
5. **Filter-only rules**, where the point is to omit features — polygons under a
   minimum area, records with a bad status — without editing the data or adding a
   layer filter that would also change what the info tool and the Analysis tool
   see.
6. **A catch-all.** QGIS's `else` rule is the unfiltered entry sitting lowest in
   the style list, so anything no other entry claimed still draws.

### What this adds to the hierarchy

Nothing structural. A style entry gains two optional properties, both in the
**More** tier of the entry header rather than as a new level, since neither
changes which later decisions exist:

- **Filter** — an expression, editable as a small condition builder
  (`attribute` · `operator` · `value`, and/or) with a raw-expression escape hatch,
  the same `Custom (expression)` treatment `decodePaint` uses.
- **Zoom range** — two numbers, shown as a range slider.

The level-1 list shows both on the entry's summary line when set, because an
entry that draws nothing because of its filter or its zoom range is otherwise
indistinguishable from one that is broken:

```
Styles                                     [+ Add style]
  ▸ Star — capital = yes               ⠿ ⧉ 🗑
  ▸ Dot — all others, z6+              ⠿ ⧉ 🗑
```

---

## Depth on demand: the shallow path, and jumping into the deep one

The hierarchy is a **tree that can be entered at any node**, not a wizard. Two
properties make that work, and both are requirements on the implementation rather
than observations:

1. **Every level has a working default**, so no level is mandatory except the one
   the user came for. Adding a style entry produces a drawing style immediately:
   role from the geometry, driver `Single value`, a colour from
   `src/theme/data-colors.ts`, default width and opacity. There is never a state
   where the panel is waiting for an answer before the map will draw.
2. **Only one entry is expanded at a time, and the user chooses which.** Opening
   the styler expands nothing: it shows layer opacity, the source line, and the
   style list with every entry collapsed to a summary. Clicking an entry expands
   that entry. Nothing else moves.

So depth is reached by *descending into one entry*, never by passing through the
others.

### The basic path

Recolour an existing layer — three clicks, no levels visited:

```
open styler → click the Fill entry → pick a colour
```

Classify it — one more decision, and it is the only one that opens anything:

```
… → colour channel: By attribute → pick a column
      (method, class count and palette all arrive pre-answered, and the map
       already shows the result; changing them is optional refinement)
```

That last parenthesis is the rule that makes the hierarchy shallow in practice:
levels 4 and 5 **open with an answer already chosen and applied**, so they are
places to adjust, not questions to answer. Quantiles at 5 classes on a
colour-blind-safe sequential scheme is a defensible map; the user improves it if
they care.

### Jumping straight to sophisticated labels on a basic layer

This is the case that the old collapsing-step panel made painful, because labels
came *after* the colour questions. In the hierarchy it is the shortest path there
is, because the style list is random-access:

```
open styler → [+ Add style] → Labels → pick a column
```

The fill entry is never touched, never expanded, and keeps whatever it had. The
new label entry is expanded and shows its four primary channels; `⋯` on each row
reaches font, weight, placement and offset. Sizing labels by population is the
size channel's driver dropdown, and it opens the same level-4 classification the
fill would have used.

So "basic layer, sophisticated labels" is not a special case in the model — it is
one shallow entry and one deep entry in the same list. The same holds in reverse:
a classified fill with a plain 1px grey outline is a deep entry and a shallow one.

### Where the depth actually lives

| Want | Levels visited | Clicks, roughly |
|---|---|---|
| Different colour | 1 (entry) + 5 (value) | 3 |
| Classify by a column | + 3 (driver) + 4 (attribute) | 5 |
| Tune method, classes, palette | 4, already open and answered | as many as they like |
| Add labels | 1 (new entry) + 5 | 4 |
| Labels sized by a column | + 3 + 4 on the size channel | 6 |
| Railway casing | 1 (duplicate) + 5 twice | 6 |
| A rule-based road style | 1 (several entries) + filter in **More** | per rule |

Nothing in the first two rows passes through a question it does not need, which is
the whole claim being made.

### The rules this imposes

- **No level may be reachable only by passing through another.** Collapsing a
  level to a ✓ row, as `renderDone` does today, enforces exactly that order; the
  persistent list and the per-channel rows do not.
- **A default must never be a placeholder.** "Select a classification method" is a
  legitimate empty state for a dropdown the user *has* to answer; a method
  dropdown reading empty while the map already shows a classification would be a
  lie. Where level 4 has applied an answer, the control shows that answer.
- **Collapsed summaries must say enough to skip the entry.** `Fill — by population
  density, 5 quantiles, YlOrRd` is why the user does not need to open it. A
  summary reading `Fill` is not.
- **Adding an entry must not rewrite the other entries.** `applyLabels` already
  has this constraint for the no-labels case — attaching a sublayer rebuilds the
  layer, so it is skipped when there is nothing to take away. With a style list it
  applies generally: one entry's change writes one sublayer's paint.

---

## What this document inherits from `layer-style-ui.md`

This specification covers **order and structure** only. The following are decided
in `layer-style-ui.md` and are **constraints on it**, not open questions — listed
because a hierarchy that ignored them would not survive contact with the engines.

### Constraints that change the hierarchy

- **Two capability tiers, by engine.** *Simple* (all four engines): one colour per
  layer, polygons as outlines, opacity, line width, circle size. *Full* (MapLibre +
  OpenLayers only): classification, schemes, labels, several styles per layer,
  icons, heatmap, cluster, expressions. The rule is **hide what an engine cannot
  do rather than offer it and fail**, because the failure is silent. So on Leaflet
  and Cesium the style list holds one entry, level 3 offers `Single value` only,
  and the panel says why.
- **Live preview is cheap on MapLibre and expensive on OpenLayers.** MapLibre
  applies `setPaintProperty` in place; OL has no such call, so a paint change
  **rebuilds the layer** (`rebuildWithPaint`). "The map answers immediately" — the
  premise of the whole shape — therefore needs throttling on OL and possibly
  apply-on-release for large vector layers. The level-4 preview strip exists partly
  for this: it lets a palette be judged before the redraw.
- **Roles the level-2 table does not yet list**, all from the inventory, all
  MapLibre-only or near it: `heatmap`, `cluster`, `fill-extrusion` (2.5D), line
  arrows (sprite + `symbol-placement: line`), and diagrams (pie/bar per feature).
  Each is a role with its own channels, so they fit the model — but they must
  appear in the level-2 dropdown **only on an engine that draws them**.
- **`pattern` and `icon`/`symbol` depend on an `addImage` path that does not
  exist.** Icons need no shipped sprite sheet (runtime `addImage` with an SVG or a
  raster, inlined as `data:` URLs so a saved style survives re-import), but
  MapLibre needs a thin service and OpenLayers needs our own composited sprite
  sheet re-run through `stylefunction`. Until then both roles stay out of the
  dropdown on the engine that cannot draw them.

### Level-4 content this document does not restate

- **Skew is the normal case and most methods fail on it** — measured: natural
  breaks puts 64 of 73 countries in one class on population density. Hence
  geometric intervals alongside the classics, and a warning when one class holds
  over 80% of the layer.
- **Manual breaks must exist**; every method is a starting point.
- **Diverging schemes offered automatically when min < 0 < max.**
- Colour-blind-safe *and* print/photocopy-safe filters (the ColorBrewer flags are
  the point of porting that data), optional CVD preview via `culori`.
- The histogram with the breaks drawn over it is the widget that teaches.

### Whole-layer features with no place in the hierarchy yet

These belong on the panel but are not decisions about a style, so they sit with
layer opacity above level 0, or in the footer:

- **Undo, and reset to original.** A style is a small JSON object, so the undo
  stack is a list of them. Today's `resetStyle` is the reset half only, and
  `originalPaint` cannot restore an added or deleted entry (noted above).
- **Copy style to another layer.**
- **Visible zoom range** for the whole layer (distinct from a per-entry zoom
  range), and **blend mode**.

### Decisions that bound what the styler may do

- **The UI edits style, never data.** Geometry and attributes are the Analysis
  tool's business. "Draw these polygons as outlines" is a `line` sublayer, not a
  converted layer; polygons → label points is `labelPoint` in Analysis, and the
  styler should link to it rather than rebuild it. The one tension is
  `By neighbours`, which computes a colouring per feature —
  it must emit a `match` on the feature id where it can, and write a property only
  where there is no other way to address a feature (`canWriteFeatures`).
- **A custom style cannot travel in a permalink.** Permalinks address what a
  configuration contains. To share a style it must be imported into a
  configuration and published — and the panel must say so after saving rather than
  let the user find out from a blank link.
- **Tiled layers classify from what is drawn.** Beyond the level-0 warning: classes
  must **not** silently re-fit as the user pans (a legend that changes under you is
  worse than a stale one) — offer an explicit *recalculate from what is on screen
  now*; and the expression needs a fallback class, shown or hidden by the
  empty-label convention (label it "outside range" to show it).
- **Joins are a separate project** (key matching, not joining, is the hard part),
  and probably belong in the Analysis tool.

---

## Where this stands — 13 September 2026

Branch `feat/layer-styler-hierarchy` (not merged, not pushed). The new panel is
`src/components/webmapx-layer-styler.ts` with helpers in `src/components/styler/`;
it is reached with **`?styler=next`**, and without that flag the legend still
opens the old step dialog, which is untouched and still the shipped panel.

### Built

- **Levels 0–5**, as specified. Level 0 is a line, not a dropdown (a dropdown of
  engine source ids hid 110 of a basemap's 111 sublayers); narrowing by source
  lives in the filter row, which appears past 12 entries.
- **The style list**: add, duplicate, delete, reorder, read from the adapter's
  own sublayers (`getSubLayers`), listed topmost-first like the legend. Sublayers
  the panel cannot style are carried through and re-emitted verbatim. Entries are
  named by their sublayer id where that says something.
- **Drivers**: `Single value`, `By attribute`, `By neighbours`, and `Custom
  (expression)` shown read-only. Blocked drivers keep their reason as a disabled
  option.
- **Level 4**: attribute, method, class count, rounded breaks, category limit,
  colour cycling, palette with reverse and colour-blind-safe. Size channels
  classify as proportional symbols. It opens already answered.
- **A style has a name of its own, and it is the legend's.** The first row of an
  open entry renames it, writing `metadata.label` on the sublayer — the key
  `legendSublayerLabel` already reads — so the panel and the legend cannot hold
  two different names for one style. The field is empty by default and shows the
  derived name as its placeholder, and it commits on `change` rather than on
  every keystroke, since a rename is a rebuild. A name that *is* the classified
  column's (`population_density`) is carried along when another column is
  chosen; a name someone wrote is never touched.
- **The no-data class is two answers, not one.** Its colour is a control
  (default light grey, `NO_DATA_COLOR`) held in `ClassifySettings.noDataColor`
  rather than read back off the expression — every control on the panel rebuilds
  the channel from those settings, so a colour living only in the paint was
  overwritten by the default the moment any other control moved. Its *wording*
  is `metadata.noDataLabel`, and empty means the legend leaves the row out: the
  empty-label convention, reached by leaving the field blank rather than by
  knowing the convention exists. `webmapx-layer-legend` substitutes it for the
  blank label the guard row carries, so the colour is explained only when the
  author has said what it means.
- **`decodePaint`** (`src/utils/style-decoder.ts`) and the object model
  (`src/utils/layer-style-model.ts`), with invariant 4 asserted.
  - **Classes written as a ladder of comparisons are read as ranges**, not only
    a `step`. `case(!has → grey, < b1 → c1, …, fallback)` is the shape real
    configs are full of, and reading it as `custom` cost the whole of level 4 —
    which is how it was found: on nl.json's "0-15 jaar", 49 of 409
    neighbourhoods in view carry no such column at all (a vector tile drops an
    empty one), and the only control that could recolour them was behind this
    decode. N breaks, N+1 colours, the guards becoming the no-data colour. One
    difference is kept on purpose: `<=` includes its own boundary and `step`
    does not, so a feature sitting exactly on the last boundary moves one class
    once the layer is edited. Anything that is not a set of ranges (descending
    bounds, two guards of different colours, a condition on another column)
    stays `custom` and is written back untouched.
- **Reset**, restoring the sublayer list snapshotted at open.
- **A size that grows with the zoom is a driver, not a custom expression.**
  `interpolate(linear, zoom, …)` is how half the authored styles in the wild
  write line width, circle radius and text size, and reading it as `custom` made
  every one of them read-only: the dike layer's lines could not be made thicker
  at all except by replacing the curve with one flat number. The stops are kept
  as authored and a `scale` multiplies them, so the curve survives. The slider
  sets the size **at the zoom the map is on** — offering the factor instead
  would be asking the user to do the arithmetic they are looking at — and the
  whole curve is spelled out underneath, because the change reaches zooms they
  are not looking at. Only *linear* interpolation over *zoom* into *numbers* is
  taken; exponential, over a column, or into colours stays `custom`.
- **Breaks are tidied only where that changes nothing, and the legend rounds
  the rest.** Two halves of one answer. `tidyBreaks` moves a break to a rounder
  number only inside the *empty gap* it already sits in — above the largest
  value below it, no higher than the smallest value at or above it, and no
  further than a quarter of the way to its neighbour — so "9.7 – 14.94" becomes
  "10 – 15" and not one feature changes class. A candidate must also be a value
  the data could have had (a column of whole numbers cannot hold 1722.5), which
  is measured from the sample, since nothing in a column says whether it holds
  years, metres, degrees or euros. What is left untidy the legend *displays*
  well: `src/utils/legend-numbers.ts` formats a whole set of breaks at once,
  choosing the decimals and whether a `M`/`B` suffix may be used at all from
  one rule — no two breaks may print the same. What this replaced was snapping
  to a round number regardless of the data: on building years it put every
  break on a century boundary, nine classes came back as five, and the legend
  read "2K – 2K" three rows running.
- **Writes are scheduled, state is not** (`STYLE_APPLY_INTERVAL_MS`, 80 ms). A
  colour picker emits on every pointer move; for a classified channel each of
  those rebuilt the whole classification and wrote it. The newest write per
  *entry and channel* is held and let out once per interval — keyed per channel
  because dragging a width and then a colour inside one interval is two writes
  and one slot would drop the first. Measured over 60 pointer moves at ~120 Hz
  on 4000 features: 14 classifications instead of 60, and the colour the pointer
  stopped on is the colour on the map. The half that makes it safe is the flush
  (`throttle` grew one): the panel flushes on close and before a rebuild — a
  rebuild re-adds the layer, so a waiting paint write would land on a layer that
  no longer exists — while **Reset drops** what is waiting, since putting the
  layer back and then writing one last edit over it is the one order that cannot
  be right.
- Tests: `tests/style-decoder.test.ts`, `style-list.test.ts`,
  `classify-channel.test.ts`, `throttle.test.ts`, and
  `scripts/ui-tests/layer-styler.mjs` on **all four engines**.

### Left to do, roughly in order

1. **Labels' *More* tier** — font/weight, placement, offset, allow-overlap behind
   the `⋯` affordance. Only the four primary channels exist.
2. ~~**The raster branch**~~ — done. The styler answers a raster layer through
   `styler/raster-branch.ts`: not-WMS, WMS the engine cannot repoint, WMS
   offering one way only, WMS offering a choice. Opacity was already at the top
   of the panel and is not repeated. `scripts/ui-tests/layer-style-raster.mjs`
   now runs its three claims over **both** panels, so the swap loses a row here
   rather than losing the coverage.
   - **User-defined styles (SLD) are built**: `utils/wms-sld.ts` (the document),
     `utils/wms-sld-probe.ts` (whether this service draws one),
     `utils/wms-attributes.ts` (what its columns are) and
     `components/styler/wms-sld-branch.ts` (the panel's decisions). One colour
     or by attribute — categories for text, class breaks for numbers, through
     the *same* `classification.ts` a vector layer uses — written into the tile
     url as `SLD_BODY`, with a button to hand the layer back to the service.
     Four things measurement decided:
     - **Support is probed, never declared.** `<UserDefinedSymbolization
       SupportSLD="1" UserStyle="1">` is what the spec offers, and over the 20
       WMS endpoints in `nl.json` and `world.json` it is worthless: the only
       four services that declare the element declare `0`, while the two that
       actually honour `SLD_BODY` — PDOK's `fysischgeografischeregios` and RCE's
       `rijksmonumentpunten`, plus PDOK BAG in `demo.json` — declare nothing at
       all. The probe is the same GetMap twice, plain and with a flat magenta
       user style, compared byte for byte, cached per service.
     - **The probe must ask at the map's own scale.** A WMS commonly withholds
       detail above a *scale* threshold rather than outside an area: PDOK
       suppresses BAG buildings above about 1:12000, measured — one downtown
       bbox comes back blank at WIDTH=256 (1:15576) and drawn at WIDTH=384
       (1:10384). A probe that always asked for a 256-pixel image was therefore
       coarser than the map's own tiles whenever it covered more than one
       tile's ground, and reported "this layer draws nothing where the map is
       looking" about a screen full of buildings. Each sample now carries the
       image size that holds it at the view's scale (the screen, at the
       screen's pixel size) or finer (the centre, at twice it). Reported from
       the app, with the three urls, which is what identified it.
     - **A blank sample is not a "no".** BAG draws nothing at country zoom, so
       the same empty tile comes back twice and reads exactly like "ignored".
       The probe therefore looks for an opaque pixel first (`inkedPixel`), tries
       the current view before the layer's extent, and reports `no-ink`
       separately — "move the map and try again" is a different instruction
       from "this service cannot do it", and the panel offers a **Look again**
       button rather than making the user close and reopen it.
     - **Only an answer about the *service* is cached.** `supported` and
       `ignored` hold for the session; `no-ink` and `error` are about the
       moment, and remembering them made a layer unstyleable for the rest of the
       session — a panel opened before zooming in to BAG's minimum scale
       answered "this layer draws nothing here" for good, and reopening after
       zooming to the buildings repeated the stale answer. Reported from the app
       rather than caught by a test, so it is now a browser step of its own.
     - **Values come from the sibling WFS, not from GetFeatureInfo.** Styling by
       attribute needs a distribution, and a WMS cannot be enumerated;
       GetFeatureInfo answers about one pixel. Every SLD-honouring service in
       our configs publishes a WFS at the `wms`→`wfs` path swap with
       `Access-Control-Allow-Origin: *`, where `DescribeFeatureType` gives names
       **and types** and `GetFeature` real values. GetFeatureInfo (at the
       probe's inked pixel, which is how it hits a feature at all — a land layer
       asked about a point at sea answers nothing) remains the fallback for
       names, and then only one colour is offered, which the panel says.
       `@camptocamp/ogc-client`'s own WFS reader is *not* used: it returns empty
       properties for PDOK's schemas.
     - **Geometry has to be determined, and three readings of it were wrong.** A
       rule carrying only a PolygonSymbolizer draws *nothing* on a line layer —
       PDOK's roads come back blank from the very document that draws the
       buildings — and the service reports success either way. The sibling WFS's
       `gml:*PropertyType` answers where there is one; otherwise the probe
       settles it, since it is already drawing the layer. Three symbolizers in
       one rule only draws the first (measured: identical to polygon-only), and
       three separate *rules* draw everything — including a circle on every
       vertex of every polygon, so that is the last resort, not the default.
       Deciding *which* by comparing against the service's own style calls every
       layer a polygon (a blank answer differs from the default as much as a
       correct one), and taking whichever draws the most calls a road layer
       points (a mark on every vertex out-inks a thin stroke). What holds is
       elimination by specificity: areas only fill polygons, strokes follow
       lines and outlines, marks land on any vertex — so the first candidate
       that draws anything at all is the answer. Verified against four real
       layers: roads → line, BAG and municipal areas → polygon, monuments →
       point.
     - **A colour must reach the service as SLD spells it.** SLD 1.0 takes
       `#rrggbb` and nothing else; the styler's own picker emits
       `rgba(0,170,0,1)`, and a service handed that does not complain — it falls
       back to its default style, which reads as "the style silently stopped
       working". Reported from the app exactly that way: the first draw worked
       (the default was hex) and the first *picked* colour drew the service's
       grey. `toSldColor` converts, and carries the alpha across as SLD's own
       `fill-opacity`/`stroke-opacity`, which a hex colour cannot hold.
     - **How long a request may be is the service's answer, not a constant.**
       `SLD_BODY` rides the tile url and the server in front refuses a long
       request line with **HTTP 431**, never with a WMS exception. The ceiling
       differs per service — bisected: PDOK BAG refuses at 7822 bytes, PDOK's
       regions at 7886, RCE's monuments at 8049 — and it is spent by the
       endpoint's own length too, so any constant here either refuses a style a
       generous service would have drawn or lets a stricter one fail. The style
       is therefore sent, and *one* request verifies it
       (`verifyStyledRequest`), for a tile the map is about to ask for anyway —
       so it warms the service's cache rather than adding to it. Only 414/431
       are read as length; anything else is reported in the service's own words,
       because telling someone to use fewer classes when their document is
       malformed sends them the wrong way. Verified live: 16 categories drawn at
       7535 bytes, 17 refused at 7953, a malformed document *not* reported as
       too long.
     - **A url is not a shape every engine holds, so the styler writes
       *parameters*.** MapLibre keeps a raster source as a literal request
       template and hands back what was written; OpenLayers keeps a `TileWMS` as
       a base url plus `params` and assembles `SERVICE`, `REQUEST`, `WIDTH`,
       `HEIGHT` and the bbox as it fetches. Asking OpenLayers for "the url"
       therefore *fabricates* one and writing one back takes it apart again — a
       round trip that dropped `SERVICE`, decoded what should stay encoded, and
       let a `#` in a colour read as a fragment (truncating the query and
       dragging the old document along on every later edit). `IMap.setSourceParams`
       is the fix: each engine applies a parameter change the way it holds
       requests (OpenLayers `updateParams`, MapLibre a template rewrite), so the
       two engines end up sending the same request and generic code fabricates
       nothing. The request the *check* measures is built generically too, from
       the source's own description — reading it back from the engine is a
       second question with its own answer, and an engine reporting a url it has
       not finished writing made a short style come back "too long".
     - **A refusal must not outlive the style it was about.** Verifying is a
       request and a refused one can answer after a later, good one, so every
       attempt carries a number and only the newest may speak. The panel is also
       one element reused for every layer, so reopening it bumps that number
       too. Reported from the app: reducing the class count until it worked left
       the earlier refusal on screen.
     - **The legend derives its picture from the live request.** A raster layer
       has no paint, so the legend panel falls back to a chequerboard that says
       only "this is a picture" — and `legendurl`, where a config carries one,
       keeps describing the service's default long after the layer has been
       restyled. `webmapx-layer-legend` now composes a `GetLegendGraphic` from
       what the source is *currently* requesting, `SLD_BODY` and all, so a
       style chosen in the styler shows up in the legend without the two
       knowing about each other. A named style's advertised `LegendURL` is
       preferred where the layer carries one, since it may carry sizing or a
       font of the service's choosing. What a source requests is engine state
       rather than store state, so `BaseAdapter.notifySourceChanged` touches the
       layers drawing from it — one writer, and the legend reads the engine
       again rather than a mirrored copy.
     - **A failed legend image must not outlive its url.** The error handler
       replaced the `<img>` element with a notice, which took it out of Lit's
       hands: the next legend — the one you get by reducing the class count
       until the service accepts it — had no element left to render into, so
       "invalid legend image" stayed on screen for good. Recorded as state,
       keyed by url.
     - **A named style and a style of our own are exclusive.** Both in one
       request is undefined between services and in practice the document wins,
       so picking one of the service's styles appeared to do nothing.
       `wmsStyleTiles` now strips `SLD_BODY`, and handing the layer back
       restores the *named* style that was in force rather than the default —
       `withSldBodyUrl` empties `STYLES` when it writes a document, so removing
       the document alone would silently demote the layer.
     - **Colour is the styler's own picker**, the same palette every other
       swatch in the panel uses, not an `<input type="color">`.
     - Not built: POST, and the branch is offered only where the engine can
       repoint a live source — **MapLibre and OpenLayers today; Leaflet and
       Cesium implement no `getSourceTiles` at all**, which is also why they
       cannot switch a WMS's *named* style.
   - **OpenLayers could always repoint a WMS source; nobody could address it.**
     `nativeLayerToSource` is keyed by the native source id this service invents
     (`src-<logical id>-<n>`) while every caller outside the engine knows the
     logical id, so `getSourceTiles`/`setSourceTiles` matched nothing and
     reported "this engine cannot repoint a live source". Fixed with an alias
     lookup; the named-style step of `layer-style-raster.mjs` went from SKIP to
     passing on OpenLayers as a result. Its `updateParams` also *merges*, so a
     parameter the new url drops (`SLD_BODY`, when the layer is handed back)
     survived forever — the live params object is the source's own, and a key
     deleted there is really gone.
3. **Rules** — a `filter` and a zoom range are decoded, preserved and named in the
   summary, but there is no editor for either.
4. **Level-4 content not ported**: the histogram with the breaks drawn over it,
   per-method class bars, manual breaks, print/photocopy-safe filters, CVD
   preview, the proportional-circle legend.
5. **Whole-layer features**: undo, copy style to another layer, visible zoom
   range, blend mode. Also the legend's halo control, which hides itself when no
   halo exists.
6. **Tiled layers**: explicit *recalculate from what is on screen now*. The
   fallback class is built — see the no-data colour and wording above.
7. **Roles not built**: `pattern`, `icon`/`symbol`, heatmap, cluster,
   `fill-extrusion`, line arrows, diagrams — all need an `addImage` path or are
   MapLibre-only.
8. **The swap**: point `webmapx-layer-overview` and `webmapx-layer-legend3d` at
   the new tag, delete `webmapx-layer-style-dialog.ts`, and remove the
   `?styler=next` flag and `usesNextStyler()`. `webmapx-layer-legend3d` builds
   the same context but opens the *step dialog*, so it is missing the two
   entries the new panel added — `sourceControl.setParams` and
   `sourceControl.getView`. They belong in the same commit as the swap and not
   before: added now they would be dead, since nothing in that path reads them. Blocked on 1–2, since a raster
   layer and label styling must not regress. The panel's read-only data view and
   per-entry legend preview are not ported either and should be reviewed then.

### Bugs found by using it, and fixed — 13 September 2026

Each of these was reported from the app, not caught by a test, and each is now
covered by one.

- **"No style matches that." on a layer whose styles the panel was holding.**
  `BaseAdapter.originalSubLayers` hands a *non-composite* layer over as the
  first sublayer of the composite it is about to be, carrying the engine's own
  source id in `source`; `sourceIdOfSubLayer` prefixed that a second time, so
  every entry named a source no group had. `loadGroups` then narrowed the list
  to the group's spelling and filtered every entry out — through a source
  dropdown that is not even rendered below 13 entries. The id is now resolved
  against the spellings the groups use, and the list is no longer narrowed to a
  source the user did not choose.
- **A white square over the map for as long as the panel was open.** The panel
  is a popover, and the UA stylesheet gives every popover a centred, bordered,
  padded box of its own. `webmapx-layer-style-dialog` has carried the reset
  since it became a popover; the panel chrome the new styler was lifted onto
  never got it.

### Corrections this work forced on the sections above

- **Engine tiers are looser than assumed.** The browser suite passes on Leaflet
  and Cesium with classification and `By neighbours`, because those engines
  evaluate the expressions through `maplibre-expression-evaluator`. The *Simple*
  tier as written (one colour per layer on those engines) should be re-checked
  against what they actually draw before anything is hidden.
- **A fill's own edge has to be declared when the layer is built**, on MapLibre
  *and* OpenLayers: MapLibre decides whether a fill carries outline geometry as
  it uploads the layer, OpenLayers builds its style function from the GL document
  once, and both report success for a later paint write that draws nothing. The
  styler rebuilds the layer when that channel changes. OpenLayers *does* support
  `fill-outline-color` — `ol-mapbox-style` spells it `layer.type +
  '-outline-color'`, so searching for the literal finds nothing and proves
  nothing.
- **A dashed *outline* is not offered.** Every polygon carries its own ring, so a
  shared border is stroked twice with independent dash phase and opposite
  traversal; the dashes interleave into noise. The channel stays on `line`, and
  an authored dash is preserved rather than stripped.
- **Level 5 opens on the GL default, not on a slider minimum.** A channel the
  layer says nothing about was reported as 0, which reads as an invisible style.
- **There is no shorter honest way to write the no-data branch**, and this was
  measured against `@maplibre/maplibre-gl-style-spec` itself — the library
  MapLibre, `ol-mapbox-style` and our own Leaflet/Cesium evaluator all use, so
  one answer holds for four engines. `["case", ["==", ["get", f], null], grey,
  step]` is exactly equivalent to the two-branch guard the builder writes, since
  `get` on a missing key *is* null; the `!has` branch is kept because it is what
  a config already in the wild spells, and both are written so either reads
  back. What does **not** work: `["match", ["has", f], true, …]` (branch labels
  must be numbers or strings), `["step", ["coalesce", ["get", f], -1], …]`
  (`coalesce` types `get` as a number, so even `"25"` comes back null), and a
  bare `step` (`to-number` turns missing, null *and* `""` into 0, which paints
  them as the lowest class — the reason the guard exists). One gap survives in
  every spelling, this one included: a non-numeric text value makes the
  expression error, so the feature takes the spec default rather than the
  no-data colour. `["to-number", ["get", f], -1]` is the only thing that catches
  it, at the cost of a sentinel that must not occur in the data.
- **Colour cycling assigns by adjacency** (`colorGroupsByAdjacency`), and whether
  it is on is decided from the data: on when values would otherwise be greyed
  out, off when they all fit, where it would only cost the legend.
