# Compare tool — proposal

Status: built. Phase one and the sharing half of phase two are implemented
(`webmapx-compare-tool.ts`, `utils/compare-replay.ts`, `cmp` in
`utils/permalink.ts`); `mode: "repeat"` is not. Kept for the reasoning behind
the decisions — where the built tool departs from this text, CLAUDE.md's
"Compare tool" entry is what is true.

## What it is

A vertical handle across the map. Left of it you see the map as it was when you
pressed the button; right of it you see the map as you keep changing it. One
camera, so the two halves are always the same place at the same scale — which is
the whole point: any difference you see is a difference in the *content*, never
in the view.

Turning the tool on takes a snapshot. Turning it off throws the snapshot away.

## The seam is a window, not a mirror

Two things get called "compare", and they are different tools:

- **Continuous** (this one): the world runs straight through the seam. Paris on
  the left, and immediately east of the handle the map carries on into
  Champagne — drawn from the other config. You are looking at one place through
  two renderings, and you drag the handle across a feature to see it both ways.
- **Repeated**: the same place is drawn twice, side by side, each half showing
  the whole viewport. Paris left, Paris right.

Overlaying two maps with identical cameras and clipping the upper one gives the
**continuous** version for free — the right half of the reference map is at the
same ground position as the right half of the live map, so nothing jumps at the
seam. That is the default and the one to build.

The repeated version is the same machinery with the reference camera offset by
half the container width (`+width/2` px in screen space, converted through
`unproject`), so each half shows the full viewport. Worth adding later as a
`mode: "repeat"`, not worth building first: the continuous version answers
"what does this place look like under the other config", which is the question
a comparison is usually asked.

## Why a second map, not a clip on one map

The two sides differ by an arbitrary config — different layers, different order,
different styling, a different basemap, potentially a different set of sources.
Per-layer clipping is the tempting alternative — one map, one camera, no second
engine instance — and on two of the four engines it genuinely exists:

| Engine | Screen-space clip of an arbitrary layer | |
| --- | --- | --- |
| OpenLayers 10 | yes | `prerender`/`postrender` canvas `clip()`; OL's own swipe example |
| Leaflet 1.9 | yes | webmapx already gives every logical layer its own pane (`MapLayerService.ensurePane`), so a `clip-path` on the pane works |
| MapLibre GL 5 | no | no per-layer scissor. The v5 `clip` layer type masks 3D content inside a *geographic* polygon; it is not a screen-space clip and does not apply to ordinary raster/fill/line paint |
| Cesium | no | imagery is baked into the globe surface texture |

So it is not portable. But portability is the smaller objection. The larger one
is that per-layer clipping means **one map holding both configs at once**, and
the two configs are not designed to coexist:

- layer ids collide — the same layer appearing on both sides, at different opacity or order, is two entries under one id
- background groups are exclusive per map (`background-group-policy`), so the two sides cannot each have their own basemap
- `store.mapLayers` is the single authoritative layer state and the legend renders it: the user would see both stacks in one list
- every layer added afterwards has to be clipped too, in engine-specific code, forever

Clipping the *element* sidesteps all of that, works identically on all four
engines, and costs one CSS property. Clipping an element means two elements.

So: two engine instances, absolutely positioned on top of each other, the upper
one clipped.

```css
.reference { position: absolute; inset: 0; clip-path: inset(0 calc(100% - var(--split)) 0 0); }
```

`clip-path` is composited, so dragging the handle does not repaint either map.

## Which second map

Not `ISubMap`/`ISubMapFactory` (what `webmapx-inset-map` uses). That interface is
four methods — `setViewport`, `createSource`, `createLayer`, `getLayer` — and
knows nothing about catalog layers, `type: 'style'` composites, the logical
layer executor, background groups, or `layerData`. Rendering a real config
through it means reimplementing `webmapx-map`.

So the reference side is a second `WebmapxMapElement`, created by the tool,
handed the frozen config through the public `setConfig` + `getAdapterAsync` +
`adapter.initialize` sequence `WebMapX.mount` already uses. It gets **no
`webmapx-layout` child**: no toolbar, no panels, no controls. It is a picture.

### The cost of that decision, stated plainly

A second `<webmapx-map>` in the document is visible to global queries that
assume every map on the page is a map the user asked for:

1. `resolveMapElement` (`components/internal/map-context.ts`) errors when a tool outside any map finds more than one — which is exactly the external-tool arrangement `map="#selector"` exists for. Tools relying on the single-map fallback would start failing.
2. `WebMapX.enableConfigEditTool` resolves by `document.querySelector`.
3. `getMapDomIndex` (`utils/permalink.ts`) counts `document.querySelectorAll('webmapx-map')`, so the frozen map takes index 1 and shifts every real map after it.

The reference map therefore carries `data-webmapx-role="compare-reference"`, and
(1) and (2) skip it (`:not([data-webmapx-role])`). That is a small, testable
change to shared code and it lands **before** the tool, in its own commit.

(3) is left alone, and made harmless by a rule instead: **compare is offered
only on a page with a single `<webmapx-map>`**. There is then no index 1 to
shift. This costs nothing real — compare is a full-bleed interaction and has
nowhere to put a handle on a page of small maps — and it is what later lets the
frozen map *be* index 1 on purpose, when sharing is built.

## Freezing is a replay, not a config snapshot

An earlier draft built a config document out of runtime state
(`mergeDynamicLayers`, the config-edit tool's save path) and mounted the frozen
map from it. That is a lot of machinery to serialise state that both maps can
simply read from memory — they live in one document.

The frozen map is instead built empty and then given the live map's layers, one
at a time. Every piece of that is already state somebody keeps:

1. **Same config.** `mapEl.config` is loaded and parsed; hand the identical object to the frozen map's `setConfig`. Its `activeLayers` rebuild the base stack, catalog and all. No document is generated and nothing is serialised.
2. **User-added layers.** `webmapx-map` keeps `dynamicLayerRequests` — the `LayerRequest` (plus fallback and insert options) for every layer added at runtime: a dropped file, a geoprocessing result, a drawn layer, the 3D tool's hillshade, a search result. Replaying them through `addLayerRequest` is exactly what `saveState`/`restoreState` already does to carry runtime layers across an engine switch, which is the same problem with a page reload in the middle. The map has to expose the collection (it is private today); `saveState` already reads it.
3. **User settings.** `store.mapLayers` holds all of it, and holds it because `BaseAdapter` mirrors every change there: `visible`, `transparency`, key order (bottom-to-top stack), and — this is the part the config-snapshot route lost — `paint`, mirrored per layer and per sublayer by `mirrorPaintToStore` on every style edit. Walk that record in order against the frozen adapter: `setLayerVisibility`, `setLayerOpacity`, `updateLayerStyle`, `moveLayer`.
4. **Map-level state.** `getProjection()`, `isTerrainEnabled()`, `getViewportState()` — three reads, three writes.

This is better than the snapshot on the thing that matters: a style edit
survives. `mergeDynamicLayers` merges *configs*, and a paint change the user
made through the style panel is not in the config — it is in the store. So the
snapshot route would have frozen a side that looked different from the map the
user pressed the button on, which is the one failure a compare tool cannot
afford.

It is also less code: nothing to extract from `webmapx-config-edit-tool.ts`,
no new `utils/runtime-config-snapshot.ts`, no risk of two snapshot builders
drifting.

### What replay does not carry

- **Anything not in `store.mapLayers` or `dynamicLayerRequests`.** Tool-drawn transient geometry — a measure line, a buffer preview, an info highlight — belongs to the live tool and is not a layer. Correct: those are not part of "how the map looked".
- **Order across an untracked layer.** `moveLayer` resolves a `beforeLayerId` that Leaflet/Cesium do not track by walking `mapLayers` forward, which is the same behaviour as a legend drag and needs nothing new.
- **Cost.** Every layer is fetched twice, once per map. Tiles come from the HTTP cache; a large GeoJSON or an imported file is re-parsed. For an in-memory source the replayed request carries the same object, so it is shared, not re-read.

## Build order

Every step below reads state something else already depends on. The tool is
glue; nothing here is invented.

**0. Shared-code change, own commit.** `resolveMapElement` and
`enableConfigEditTool` skip `[data-webmapx-role]`. Compare is offered only when
the page has one `<webmapx-map>`.

**1. Create the frozen map.** The same public sequence `WebMapX.mount` uses:

```js
el = document.createElement('webmapx-map');
el.id = `${liveMapEl.id}-compare-reference`;
el.dataset.webmapxRole = 'compare-reference';
el.setAttribute('adapter', liveAdapter.engineId);   // same engine, or the clip
                                                    // lines up and the render does not
el.setConfig(liveMapEl.config);                     // the parsed object, not a re-fetch
const frozen = await el.getAdapterAsync();
frozen.initialize(el.id, initOptionsFromLive);
```

No `webmapx-layout` child: no toolbar, no panels, no controls.

**2. Replay user-added layers.** Each entry of `dynamicLayerRequests` through
the frozen map's `addLayerRequest`, in insertion order.

**3. Replay settings.** Walk `liveAdapter.store.getState().mapLayers` in key
order (bottom to top): `setLayerVisibility`, `setLayerOpacity`,
`updateLayerStyle` from the mirrored `paint`/`sublayers[].paint`, `moveLayer`.

**4. Replay map state.** `getProjection`, `isTerrainEnabled`,
`getViewportState` — three reads, three writes.

**5. Link the camera.** Below.

**6. The handle.** A `role="separator"` element writing one CSS custom
property; drag plus ←/→/Home/End.

Ship those six. Sharing is a second phase and should not be coupled to them.

## Camera

One direction only: live drives reference. The reference map has no
interaction — `interactive: false` at construction where the engine supports it,
`pointer-events: none` on its container regardless — so there is no second
camera to reconcile and no echo to suppress.

Sync on `view-change`, not `view-change-end`: at end-only the two halves visibly
slide apart during a pan, which reads as a rendering bug. `setViewport(center,
zoom, bearing, pitch)` per event, no animation, no throttle — it is one
synchronous camera write and throttling it is what makes the seam lag.

Bearing and pitch travel too, so the tool works with a rotated or tilted map.

### Engine caveats, in order of how much they hurt

- **Cesium**: two globes, two full imagery/terrain pipelines. It works, but it is the one combination where a slow machine will notice. `setViewport` on Cesium is a camera flight target, not a matrix write — its idle-time reconciliation is looser than the others', so the seam can lag by a frame or two during a fast pan.
- **A projection switch** on the live side has to be forwarded, since a mismatch means the two halves are no longer the same place. `store.mapProjection` already carries the engine-reported value, so the tool subscribes to that rather than to the projection tool.
- **MapLibre globe**: the clip is a straight vertical line across a sphere. Correct, and it looks odd. Not a defect to fix; a reason to default the tool to 2D presentation in documentation.

## Which side is which

The frozen side is the **left**, the live side the **right**, and the handle
carries a label on each half ("before" / "now" by default, overridable in
config). Without labels a user who returns to the tab cannot tell which half
they are changing — and that ambiguity is worse than any layout choice, because
they will conclude a layer toggle is broken.

## Tools act on the live side only

This falls out of the DOM and needs no special case: every tool sits inside the
live `<webmapx-map>`, `resolveMapElement` resolves by `closest('webmapx-map')`,
and the reference map has no tools of its own. The legend, catalog, style
editor, transparency slider, import and analysis all reach the live adapter
because it is the only one they can see.

The one thing that does need saying: the reference map is read-only and there is
no UI to edit it. If you want the other arrangement, swap the sides (a button on
the handle) and carry on editing.

## Phase two: sharing, through the index that already exists

Not part of the first release. It is written down here because the design of
phase one has to leave room for it, and it does.

webmapx already indexes maps by DOM order: `config.1=` names the config of the second `<webmapx-map>` on the page
and `s.1=` carries its state (`permalinkParamName`/`configParamName` in
`utils/permalink.ts` — note the separator is a **dot**, `config.1`, not
`config1`; that spelling is shipped and stays).

The frozen side is a second `<webmapx-map>`. So it is map index 1, and it needs
no new encoding at all:

```
?config=demo.json&s=<live>&config.1=demo.json&s.1=<frozen>&cmp=50
```

`s.1` already carries exactly what the frozen side is: layer ids in stack order,
which are hidden, transparency, projection, terrain. The tool itself contributes
one parameter, `cmp`, holding the split percentage — and it has to, because
without it a restore produces two stacked maps and no handle, which is a broken
page rather than a missing feature. `cmp` is what tells the tool to activate on
load.

The reference camera is dropped on restore: `s.1`'s `v` is written because the
encoder writes it for every map, but the reference camera is driven by the live
map and is overwritten on the first `view-change`.

A shared link is therefore a *reconstruction*, not the replayed frozen map, and
two limits follow. Both belong in the UI rather than hidden:

- **A layer that exists only in memory cannot be shared.** A dropped file, a geoprocessing result, a drawn layer: `s.1` records an id, and on the other machine there is nothing behind it — the same "layers could not be restored" report a normal permalink already gives. The share dialog should name those layers while compare is open, since the frozen side is precisely where a user parks a result they just computed.
- **Style edits are not in `s.1`.** It encodes visibility, order and opacity, not paint. Freezing a side after restyling a layer and then sharing gives the unstyled version. This is not new to compare — it is what `?s=` has always encoded — but compare makes it more visible, because the whole point of the frozen side is "how it was".

### Why the single-map rule is what makes this possible

On a page with two real maps, inserting the reference at index 1 would shift the
second real map to index 2 and silently break previously issued `?s.1=` links.
The phase-one rule — compare only on a single-map page — removes that case
before it exists, and avoids inventing a sub-index spelling for a situation
nobody has.

## Config

```json
{
  "tools": {
    "compare": {
      "type": "compare",
      "labels": { "reference": "2020", "live": "now" },
      "initialSplit": 50
    }
  }
}
```

`reference` may also name a config URL, for the case where the comparison is
against something fixed (a historical map, another authority's data) rather than
against wherever the user happened to be. Absent, the frozen side is a replay of
the live map at the moment the tool was opened.

## Pieces

Phase one:

| Piece | File | Note |
| --- | --- | --- |
| Reference-map exclusion | `components/internal/map-context.ts`, `bootstrap/WebMapX.ts` | prerequisite, own commit, own test |
| Expose `dynamicLayerRequests` | `components/webmapx-map.ts` | public read accessor; `saveState` already reads it |
| Layer replay | `utils/compare-replay.ts` | config + dynamic requests + `store.mapLayers` → frozen adapter |
| The tool | `components/webmapx-compare-tool.ts` | `WebmapxBaseTool`, `placement: 'toolbar'` |
| Registration | `tools/tool-registry.ts` + the `import()` thunk in `bootstrap/tool-loader.ts` | `tests/tool-registration.test.ts` fails if these disagree |
| Config types + validator | `config/types.ts` | `labels`, `initialSplit`, optional `reference` URL |
| Test page | `testpages/compare.html` | `?adapter=` to check all four engines |

Phase two:

| Piece | File | Note |
| --- | --- | --- |
| `cmp` permalink param | `utils/permalink.ts` + the tool | split percentage; also the activate-on-load signal |
| `mode: "repeat"` | the tool | reference camera offset half a container width |

Handle interaction: pointer events on the handle, keyboard ←/→ (and Home/End) on
a focused handle with `role="separator"` and `aria-valuenow`, which is what makes
it operable without a mouse.

## Deliberately not built

- **Two independent cameras.** A "compare these two places" mode is a different tool with a different question, and offering both behind one button means the camera link becomes a setting nobody finds.
- **A horizontal split, or a lens/spyglass.** Each is a second layout to test on four engines for the same information. Vertical first; add the others if asked for.
- **Fading between the two sides.** Opacity blending of two full map stacks looks like a rendering fault, not a comparison, and the transparency slider already covers "show me both at once" for a single layer.
- **A diff.** "Which features changed" is a geoprocessing question and the analysis tool answers it against real data; a visual compare cannot, and implying it can is worse than not offering it.
