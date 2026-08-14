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

  await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });
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
}
