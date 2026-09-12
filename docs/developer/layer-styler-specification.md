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

## Where this stands — 12 September 2026

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
- **`decodePaint`** (`src/utils/style-decoder.ts`) and the object model
  (`src/utils/layer-style-model.ts`), with invariant 4 asserted.
- **Reset**, restoring the sublayer list snapshotted at open.
- Tests: `tests/style-decoder.test.ts`, `style-list.test.ts`,
  `classify-channel.test.ts`, and `scripts/ui-tests/layer-styler.mjs` on **all
  four engines**.

### Left to do, roughly in order

1. **Labels' *More* tier** — font/weight, placement, offset, allow-overlap behind
   the `⋯` affordance. Only the four primary channels exist.
2. **The raster branch** — WMS `GetCapabilities` styles and raster opacity. The
   new panel currently says "images, not features" and stops, so a raster layer
   still needs the old dialog.
3. **Rules** — a `filter` and a zoom range are decoded, preserved and named in the
   summary, but there is no editor for either.
4. **Level-4 content not ported**: the histogram with the breaks drawn over it,
   per-method class bars, manual breaks, print/photocopy-safe filters, CVD
   preview, the proportional-circle legend.
5. **Whole-layer features**: undo, copy style to another layer, visible zoom
   range, blend mode. Also the legend's halo control, which hides itself when no
   halo exists.
6. **Tiled layers**: explicit *recalculate from what is on screen now*, and the
   fallback class.
7. **Roles not built**: `pattern`, `icon`/`symbol`, heatmap, cluster,
   `fill-extrusion`, line arrows, diagrams — all need an `addImage` path or are
   MapLibre-only.
8. **The swap**: point `webmapx-layer-overview` and `webmapx-layer-legend3d` at
   the new tag, delete `webmapx-layer-style-dialog.ts`, and remove the
   `?styler=next` flag and `usesNextStyler()`. Blocked on 1–2, since a raster
   layer and label styling must not regress. The panel's read-only data view and
   per-entry legend preview are not ported either and should be reviewed then.

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
- **Colour cycling assigns by adjacency** (`colorGroupsByAdjacency`), and whether
  it is on is decided from the data: on when values would otherwise be greyed
  out, off when they all fit, where it would only cost the legend.
