/**
 * UI Test: reading features out of a vector-tile layer
 *
 * `queryLayerFeatures` on a vector-tile source is what feeds every tool that
 * works on attributes — the analysis tool's "group by attribute" list, the
 * buffer tool's source-layer picker. It is engine-specific code (MapLibre reads
 * rendered features, OpenLayers converts `RenderFeature`s out of the tile
 * renderer), it silently returns an empty collection when it breaks, and the
 * failure looks like "the tool offers no attributes" rather than like an error.
 *
 * The layer is a real remote MVT service, so the suite first checks that the
 * service answers at all and skips rather than failing when it does not — a
 * broken network must not read as a broken adapter.
 */
import { appUrl } from './lib/fixture-config.mjs';

const LAYER_ID = 'populationdensity';
/**
 * Deliberately not a whole number.
 *
 * OpenLayers renders at the tile zoom its renderer picked, and reading tiles by
 * recomputing that zoom from the view resolution disagrees with it exactly when
 * the view sits between two levels — which is where a mouse wheel leaves it.
 * WEBMAPX_QUERY_ZOOM overrides it when investigating a specific layer.
 */
const ZOOM = Number(process.env.WEBMAPX_QUERY_ZOOM ?? 6.4);
const PROBE_TILE = 'https://tiles.edugis.nl/data/public.ne_10m_admin_1_states_provinces_lakes_pop/mvt/4/8/5?geom_column=geom&columns=name,pop_sum,pop_dens,admin,type,type_en&include_nulls=0';
/** Attributes the service advertises in its tile URL; all of them must arrive. */
const EXPECTED_FIELDS = ['name', 'pop_sum', 'pop_dens', 'admin'];

export const engines = ['maplibre', 'openlayers'];

function fail(message) {
  throw new Error(message);
}

async function waitForMapReady(page) {
  await page.waitForFunction(async () => {
    const map = document.querySelector('webmapx-map');
    if (!map || typeof map.getAdapterAsync !== 'function') return false;
    return Boolean(await map.getAdapterAsync());
  }, undefined, { timeout: 45_000 });
}

export async function run({ page, engine, baseUrl }) {
  console.log(`  Running vector tile query test for engine: ${engine}`);

  await page.goto(appUrl(baseUrl), { waitUntil: 'domcontentloaded' });
  await waitForMapReady(page);

  const reachable = await page.evaluate(async (url) => {
    try {
      const res = await fetch(url, { method: 'GET' });
      return res.ok && (await res.arrayBuffer()).byteLength > 0;
    } catch (_) {
      return false;
    }
  }, PROBE_TILE);

  if (!reachable) {
    console.log('    SKIP: the vector tile service is not reachable from here');
    return;
  }

  await page.evaluate(async ([layerId, zoom]) => {
    const map = document.querySelector('webmapx-map');
    await map.addLayerRequest({ layerId });
    const adapter = await map.getAdapterAsync();
    adapter.setViewport([5, 52], zoom);
  }, [LAYER_ID, ZOOM]);

  // Tiles load and parse asynchronously; poll rather than guess a delay.
  const deadline = Date.now() + 40_000;
  let result;
  for (;;) {
    result = await page.evaluate(async (layerId) => {
      const map = document.querySelector('webmapx-map');
      const adapter = await map.getAdapterAsync();
      const fc = await adapter.queryLayerFeatures(layerId);
      return {
        count: fc.features.length,
        fields: Object.keys(fc.features[0]?.properties ?? {}),
        geometryTypes: [...new Set(fc.features.map(f => f.geometry?.type))],
        firstCoordinate: fc.features[0]?.geometry?.coordinates?.flat(3)?.slice(0, 2) ?? null,
      };
    }, LAYER_ID);
    if (result.count > 0 || Date.now() > deadline) break;
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  if (!result.count) fail('A displayed vector-tile layer returned no features at all');

  const missing = EXPECTED_FIELDS.filter(f => !result.fields.includes(f));
  if (missing.length) fail(`Features arrived without their attributes: missing ${missing.join(', ')}`);

  if (!result.geometryTypes.some(t => t === 'Polygon' || t === 'MultiPolygon')) {
    fail(`Expected polygons from this layer, got ${result.geometryTypes.join(', ')}`);
  }

  // Geometry must come back in lon/lat, not in tile or projected coordinates —
  // a projection slip here is invisible in the count and ruins every result.
  const [lon, lat] = result.firstCoordinate ?? [];
  if (!(lon > -30 && lon < 40 && lat > 30 && lat < 70)) {
    fail(`Coordinates are not lon/lat for a view over the Netherlands: ${lon},${lat}`);
  }

  console.log(`    ${result.count} features with attributes ${result.fields.join(', ')}`);

  await checkNonMercatorView(page, engine);
}

/**
 * The same query again, with the view in an equal-area projection.
 *
 * OpenLayers only: the projection tool is OL's, and this is where the answer
 * used to go wrong. A vector-tile layer's features are stored in the *tile
 * source's* projection — OL 10 reprojects vector tiles in the canvas renderer,
 * on clones — so reading them as the *view's* projection is correct on a
 * Mercator map, where the two are the same, and wrong on every other one. In
 * EPSG:6933 a Mercator y of 11.4 million metres at 71°N lands past the top of
 * the projection: Scandinavia came back squashed onto latitude 88.1 and Norway,
 * Iceland and Finland did not come back at all. Nothing errored — a cartogram
 * built on it was simply missing countries.
 *
 * Checked by latitude rather than by feature count: a count is a weak signal
 * here (the viewport decides it), while a province at 88° is unambiguous.
 */
async function checkNonMercatorView(page, engine) {
  if (engine !== 'openlayers') return;

  const applied = await page.evaluate(async ([layerId, lonLat, zoom]) => {
    const map = document.querySelector('webmapx-map');
    const adapter = await map.getAdapterAsync();
    const ok = adapter.setProjection('EPSG:6933');
    if (!ok) return { ok, adapter: adapter.constructor?.name };
    // Zoom numbers are projection-relative — a view's resolutions come from its
    // projection's extent — so the view is re-set after the switch rather than
    // left on a number that meant something else a moment ago. A world view,
    // because this layer draws no tiles at street zoom in EPSG:6933 (the source
    // zoom is chosen through a metersPerUnit ratio), which is a separate matter
    // from the coordinates the features come back in.
    adapter.setViewport(lonLat, zoom);
    adapter.removeLayer(layerId);
    await map.addLayerRequest({ layerId });
    return { ok, projection: adapter.getProjection?.()?.name ?? null, adapter: adapter.constructor?.name };
  }, [LAYER_ID, [10, 40], 2.5]);
  if (!applied.ok) fail(`Could not switch the view to EPSG:6933 (${JSON.stringify(applied)})`);

  const deadline = Date.now() + 60_000;
  let result;
  for (;;) {
    result = await page.evaluate(async (layerId) => {
      const map = document.querySelector('webmapx-map');
      const adapter = await map.getAdapterAsync();
      const fc = await adapter.queryLayerFeatures(layerId);
      let north = -90;
      let south = 90;
      const walk = (coords) => {
        if (typeof coords[0] === 'number') {
          if (coords[1] > north) north = coords[1];
          if (coords[1] < south) south = coords[1];
          return;
        }
        for (const part of coords) walk(part);
      };
      for (const feature of fc.features) if (feature.geometry) walk(feature.geometry.coordinates);
      return { count: fc.features.length, north, south };
    }, LAYER_ID);
    if (result.count > 0 || Date.now() > deadline) break;
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  if (!result.count) fail('An equal-area view returned no vector-tile features at all');
  // The layer is provinces of the world; nothing in it reaches 85 degrees, and
  // the bug parked everything above the view at 88.1.
  if (result.north > 85 || result.south < -85) {
    fail(`Features came back at latitude ${result.south.toFixed(1)}..${result.north.toFixed(1)} in EPSG:6933 — the view projection was used to read tile coordinates`);
  }

  console.log(`    ${result.count} features in EPSG:6933, latitudes ${result.south.toFixed(1)}..${result.north.toFixed(1)}`);
}
