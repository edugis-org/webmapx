# Data Analyzer Handoff

Worktree to continue in:

```text
/home/anneb/projects/webmapx-data-analyzer
```

Branch:

```text
feat/data-analyzer-tool
```

Do not continue data-analyzer work in:

```text
/home/anneb/projects/webmapx
```

That original checkout is on another branch and may be used by another process.

## User Goal

Add a WebMapX Data Analyzer tool that can analyze imported geodata from WFS, MVT/tile-backed layers, or dropped geodata using WebMapX's existing import/conversion path.

The analyzer should inspect attribute data and offer useful analysis/map options after import. It should work across datasets in Dutch, Finnish, Spanish, Greek, and English where possible.

Important user preference:

- Analyze all available data.
- Do not silently use sampling as the final result.
- It is acceptable for analysis to take time if the UI says it is calculating.
- The browser must not freeze.
- User should be able to cancel analysis or switch focus while analysis runs.

## Current Implementation

Main files added/changed:

```text
src/utils/data-analyzer.ts
src/workers/data-analyzer.worker.ts
src/components/webmapx-data-analyzer-tool.ts
src/bootstrap/tool-loader.ts
src/tools/tool-registry.ts
tests/data-analyzer.test.ts
scripts/run-tests.mjs
```

Temporary/local config copied into this worktree:

```text
config/
```

This was copied from the built config output so this URL works in the separate worktree:

```text
http://localhost:5174/testpages/preview.html?config=..%2Fconfig%2Fnl.json
```

The `config/` directory is untracked. Do not commit it unless explicitly desired.

## Tool Registration

The Data Analyzer tool is registered in:

```text
src/tools/tool-registry.ts
src/bootstrap/tool-loader.ts
```

Tool id:

```text
data-analyzer
```

Custom element:

```text
webmapx-data-analyzer-tool
```

## Analyzer Behavior

`src/utils/data-analyzer.ts` exports:

```ts
analyzeDataset(features: GeoJSON.Feature[], complete = true): DatasetAnalysis
```

The analyzer currently:

- profiles fields
- detects numeric/text/id/constant/mostly-missing roles
- detects CBS no-data codes: `99996`, `99997`, `99998`, `99999`
- detects common raster no-data values: `-9999`, `-99999`, `-32768`, `-2147483648`
- detects repeated extreme no-data-ish values
- detects ID/code-like fields, with earlier fixes to avoid over-eager numeric ID detection
- groups fields by multilingual name hints
- detects correlated field groups
- detects percentage compositions that add to about 100
- detects complementary percentage pairs
- detects additive totals such as total population = men + women
- detects likely family borders using attribute order, field roles, name families, structural families, correlations, and complements
- creates ranked suggestions for hygiene, families, maps, and relationships

Important heuristic choices already made:

- Attribute order is treated as meaningful.
- Percentage composition detection now uses ordered contiguous windows instead of all combinations. This is much faster and better matches the user’s “family borders” idea.
- Raw parts of totals such as `mannen`/`vrouwen` are suppressed in top map suggestions.
- Metadata-ish measures like coverage/year are suppressed.
- Absolute counts are penalized compared with percentages/rates/profiles.

## Worker/UI Behavior

The Data Analyzer modal is in:

```text
src/components/webmapx-data-analyzer-tool.ts
```

Current browser model:

1. Main thread reads layer features through:

```ts
sampleLayerFeatures(...)
```

Despite the name, this helper does not cap rows. It returns the layer features available through the map adapter.

2. Main thread strips geometry before posting to the worker:

```ts
const properties = sample.features.map(feature => feature.properties ?? {});
```

3. Worker receives all property bags and reconstructs minimal dummy point features internally.

4. Worker runs full `analyzeDataset(...)`.

5. UI shows progress/status text while calculation runs.

6. Refresh button becomes `Cancel` while busy. Cancel terminates the worker.

Important limitation:

- Workers cannot query MapLibre/OpenLayers map state directly.
- For MVT/tile-backed layers, the analyzer can only analyze features currently loaded/rendered in the viewport unless WebMapX has another full-data source.
- For full GeoJSON/WFS/dropped data, it should analyze all loaded source features.

Current warning text for incomplete/tile-backed results:

```text
Results use loaded viewport features, not the full source.
```

## Performance Notes

Real-data timing probes in Node after removing sampling:

CBS buurten:

```text
/mnt/d/projects/cbsbuurtwijkgemeente/output/cbs_buurten_2023_simplified.geo.json
14513 features
42 fields
~7.6s analyzer CPU time
```

NUTS3 UK stats:

```text
/home/anneb/projects/data/eu_nuts3/data/geometry/NUTS_RG_01M_2024_4326_LEVL_3_uk_stats.geojson
1527 features
40 fields
~0.5s analyzer CPU time
```

Since analysis now runs in a worker, this CPU time should not freeze the browser UI. The remaining main-thread cost is layer feature extraction and building the properties array.

## Test Data

CBS example data:

```text
/mnt/d/projects/cbsbuurtwijkgemeente/
```

Useful file:

```text
/mnt/d/projects/cbsbuurtwijkgemeente/output/cbs_buurten_2023_simplified.geo.json
```

NUTS3 example data:

```text
/home/anneb/projects/data/eu_nuts3/data/geometry/NUTS_RG_01M_2024_4326_LEVL_3_uk_stats.geojson
```

Windows view of same NUTS3 file:

```text
\\wsl$\Ubuntu-22.04\home\anneb\projects\data\eu_nuts3\data\geometry\NUTS_RG_01M_2024_4326_LEVL_3_uk_stats.geojson
```

## Tests

Focused tests:

```bash
node ./scripts/run-tests.mjs tests/data-analyzer.test.ts
```

Validation commands used successfully:

```bash
node ./scripts/run-tests.mjs tests/data-analyzer.test.ts
npm run typecheck
npx eslint src/utils/data-analyzer.ts src/components/webmapx-data-analyzer-tool.ts src/workers/data-analyzer.worker.ts tests/data-analyzer.test.ts
npm run build
```

`npm run build` currently succeeds but emits existing bundle-size/dynamic-import warnings unrelated to the data analyzer.

## run-tests.mjs Change

`scripts/run-tests.mjs` was changed to support positional file arguments.

Behavior:

- no file args: run all `tests/*.test.ts`
- file args: run only those tests
- `--...` args are passed to `node --test`

Example:

```bash
node ./scripts/run-tests.mjs tests/data-analyzer.test.ts
```

## Current Git Status Notes

Expected modified/untracked data-analyzer related files:

```text
M scripts/run-tests.mjs
M src/bootstrap/tool-loader.ts
M src/tools/tool-registry.ts
?? src/components/webmapx-data-analyzer-tool.ts
?? src/utils/data-analyzer.ts
?? src/workers/data-analyzer.worker.ts
?? tests/data-analyzer.test.ts
?? DATA_ANALYZER_HANDOFF.md
?? config/
```

`config/` is local support data and should probably remain untracked.

## Likely Next Steps

1. Test in browser at:

```text
http://localhost:5174/testpages/preview.html?config=..%2Fconfig%2Fnl.json
```

2. Add CBS layer `0-15 jaar`, select it in Data Analyzer, confirm:

- UI does not freeze
- status text appears while calculating
- Cancel works
- results eventually appear
- MVT warning is shown if applicable

3. If browser still stalls, profile the remaining main-thread feature extraction/property-copy step. The analyzer worker will not fix stalls inside `adapter.queryLayerFeatures(...)`.

4. Consider adding a dedicated worker manager if the one-worker-per-analysis model becomes noisy. For now, the modal creates a fresh worker per analysis and terminates it on completion/cancel.

5. Revisit suggestion ranking on NUTS3. Current top NUTS3 suggestions from probe were relationship-heavy:

```text
gdp_per_capita_eur rises with gdp_per_capita_pps
gdp_million_eur rises with gross_value_added_million_eur
population_age_under_15 rises with live_births
```

This may be acceptable, but the analyzer should eventually recognize obvious duplicate/near-duplicate measures such as EUR vs PPS variants as a family or redundant pair.

## Resume Update: 2026-09-14

This section supersedes older implementation status and next-step notes above.

- Continue in `/home/anneb/projects/webmapx-data-analyzer`, branch
  `feat/data-analyzer-tool`. The original `/home/anneb/projects/webmapx`
  checkout is used by another process for styler work; do not edit it.
- Base analyzer implementation was committed as `ad79951` and pushed to
  `origin/feat/data-analyzer-tool`. The current follow-up commit contains this
  handoff and the field-summary changes below. It has not been pushed yet.
- Existing Vite URL: `http://localhost:5174/testpages/preview.html?config=..%2Fconfig%2Fnl.json`.
  Check whether the server is still running before restarting it.
  Untracked `config/` is a local runtime copy and remains excluded from commits.

### Current Implementation

- Analysis runs on all available feature properties in a worker. No sampled
  preview results. GeoJSON can cover the loaded full source; MVT covers loaded
  viewport features. Cancellation terminates the worker; refresh reruns it.
- Options include `Map this` for single-field map suggestions. The action uses
  `classifyColorChannel` and `encodeStyleEntry`, applies paint through
  `adapter.updateLayerStyle`, and updates composite sublayer metadata when
  available. It restyles the selected layer, rather than creating a new layer.
- Fields now show type, non-missing count, distinct non-missing values, missing,
  min, max, average, and median. Each label/value pair stays together on wrapping.
- Type is inferred as integer or number when at least 80% of non-missing values
  parse as numeric; otherwise text. This is inference, not source schema typing.
- Numeric display uses standard notation, exponential only when absolute value
  exceeds 1e9 or is nonzero below 1e-6. Non-integers use roughly four significant
  digits; integers within the threshold are displayed exactly.
- A `no-data:` line appears only for detected candidates, with occurrence counts.
  Ordinary null/undefined/blank missing values remain a separate count.
- Detection first examines raw numeric values, then excludes all detected
  candidates from min, max, mean, median, and standard deviation.
  Count/unique/numeric still include non-null sentinel occurrences; these counts
  therefore do not necessarily equal the number used for numeric statistics.
- Known CBS/raster sentinels are detected explicitly. Heuristic extreme-value
  detection is restricted to integer-valued numbers. Arbitrary decimal extremes
  such as 999999.9999 stay valid. Integer-valued decimal notation such as -9999.0
  is indistinguishable from -9999 in JavaScript.

### Outstanding Issues and Cautions

- User saw only one CBS map suggestion (population density). Suggestions are
  sorted together and capped at ten overall, so families and relationships can
  crowd out single-field map actions. Revisit presentation/ranking if requested.
- User reported `Map this` appeared to do nothing, then said they may have tested
  incorrectly and explicitly requested undoing the attempted fix. The proposed
  `adapter.getSubLayers()` fallback in `styleTargets()` WAS REMOVED. Do not
  restore it without reproducing the problem. Existing error/success messages
  appear above the tabs, potentially outside the scrolled view.
- Earlier Bosgebied Ugchelen color/info mismatch was not conclusively reproduced.
  Local CBS GeoJSON had percentage_gescheid=18 (dark red), while user reported
  info value 7 (expected orange). Local value 7 belonged to a different age field.
  Verify actual live feature, selected layer, paint, and legend before a fix.
- Known sentinel removal in correlation helpers and the separate styler
  classification path are not necessarily identical to profile heuristic
  exclusion. Do not claim every analysis/map operation uses the same exclusions.
- Suspected extreme values are heuristics, although UI currently says no-data.
  Legitimate integer extremes can be misidentified. Decimal regression test is
  small and does not exercise all heuristic trigger thresholds.
- Fields rendering still limits its sorted list to thirty profiles.

### Documentation in the Demo Repository

- Added `/home/anneb/projects/webmapx-demo/docs/tools/data-analyzer.md` (uncommitted).
- Added local, ignored `config/docs/tools/data-analyzer.json` in that repository.
- Maintained prose is Markdown under `docs/tools/`; the builder generates both
  HTML and JSON under `tools/`, along with indexes. Do not hand-edit outputs.
- `npm run build:tool-docs -- --check` currently fails because the demo's built
  WebMapX registry predates data-analyzer. Update/build the appropriate analyzer
  distribution before generating. The ignored demo config needs a maintained
  home for deployment; it currently exists only locally.

### Verification and Next Session

- Latest typecheck, nine analyzer tests, and ESLint passed after the attempted
  Map this fallback was reverted. No browser reproduction verified that fix.
- Start by reading this section and `git status`. These changes were committed
  at the user's request; no push was requested for this follow-up.
- Likely next work: reproduce Map this only if still broken, improve access to
  single-field map options, and advance family/profile map creation. The end
  goal remains maps showing discovered statistical or geographical patterns.
