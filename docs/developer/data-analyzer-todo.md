# Data analyzer — open items

Status after the session of 2026-09-15 on `feat/data-analyzer-tool`. Everything
below was verified by script calls in a browser (MapLibre, `testpages/preview.html`
with `demo.json` and the CBS buurten 2023 example file), not by clicking the
panel, unless stated otherwise.

## Not yet verified

- [ ] **Panel buttons by hand**: Count/Rate switch, "Replace previous result",
      "Log scale", "Map clusters", related-field buttons, "Map profiles".
      Tests called the component methods directly.
- [ ] **Other engines**: OpenLayers, Leaflet, Cesium. Output layers, legends and
      `circle-sort-key` were only checked on MapLibre (the sort key is
      MapLibre-only by nature).
- [ ] **Saving a map** with an output layer that references the original source:
      does the saved config keep the analyzer style and the source URL?
- [ ] **Legend rows other than class rows** after `.legend-row` became
      `align-items: flex-start`: line samples, bubble legends, sliders and colour
      pickers in edit mode.
- [ ] **Measure tool** area across the date line (now uses `featureArea`); no
      dedicated test.
- [ ] **Line layers** in "Map this" (proportional line width): no suitable demo layer.

## Improvements discussed

- [ ] **Profile labels too long** when a family's field names share no prefix
      (`perc_geb_…` next to `percentage_geb_…`). Option: drop words common to all
      names, keep only the distinguishing parts.
- [ ] **Related-field families**: the smallest analyzer family is sometimes too
      narrow (three "outside Europe" fields instead of all origin groups) or odd
      (area fields next to urbanity; `oppervlakte_water_in_ha` is not detected as
      area and still appears). Option: prefer compositions whose parts sum to a
      whole.
- [ ] **Composition families from name matching** can be weak ("Composition:
      met" mixes overlapping origin fields). Family detection itself was not
      touched.
- [ ] **Layer styler**: offer the looser "nice breaks" rounding (`niceBreaks`)
      as a checkbox; only the analyzer uses it now.
- [ ] **Legend decimals** for very small breaks ("< 0.00" for 0.003): take the
      number of decimals from the smallest break.
- [ ] **Overlapping output layers**: several cluster/profile layers at 80%
      opacity hide each other. Options: one layer with a field switch, or
      pointing to the compare tool.
- [ ] **Spatial suggestions crowded out**: the suggestion list is capped at 12
      and family cards can push spatial cards out.
- [ ] **Analysis time** ~7 s for 14 513 polygons; the split between profiling
      and the spatial part is not measured.

## Known limits (by design, document for users)

- Cluster (LISA) and profile layers are GeoJSON copies: each feature gets a
  computed class no style expression can reproduce.
- Tile-backed layers: statistics, class breaks and circle scaling come from the
  features in view; the output layer description says so.
- Area-field detection is a rank correlation (≥ 0.9) with measured area, and the
  unit factor is a median snapped to a power of ten within a factor 1.3.
- Local Moran's I uses analytic p-values with Benjamini–Hochberg (FDR 5%);
  strongly skewed data should use the log option.

## Housekeeping

- [ ] Console warning seen during tests: "Option values cannot include a space"
      (Shoelace `sl-option`); source not investigated.
- [ ] Add a UI test under `scripts/ui-tests/` for the analyzer (fixture layer →
      Map this / Map clusters / Map profiles), so the checks above stop being
      manual script runs.
- [ ] CLAUDE.md has no section on the data analyzer yet (thematic rules, spatial
      statistics, compositions, original-source outputs).
