/**
 * UI Test: a Portolan collection as a layer (docs/adr/0001-portolan-catalogs.md, step 1)
 *
 * A config layer `{ type: 'style', url: '<collection.json>' }` is drawn from the collection's
 * default style asset, bound to the collection's own data: the PMTiles `visual` for the
 * Dutch provinces, the GeoParquet `data` for the small Natural Earth countries (which ship
 * no PMTiles). Both come from the Portolan spec's reference catalog as hosted on
 * source.coop, so the suite skips rather than fails when that host is unreachable.
 *
 * Engines: the ones that draw vector tiles. Leaflet and Cesium cannot draw PMTiles, so the
 * provinces are not theirs to show (ADR 0001, "Engines").
 */
const CONFIG = '/tests/fixtures/portolan-demo.json';
const PROBE = 'https://data.source.coop/portolan-mirrors/portolan-spec-examples/portolan-reference/main/catalog.json';

export const engines = ['maplibre', 'openlayers'];

function fail(message) {
  throw new Error(message);
}

export async function run({ page, engine, baseUrl }) {
  console.log(`  Running Portolan collection test for engine: ${engine}`);

  const url = new URL(baseUrl);
  url.searchParams.set('config', CONFIG);
  await page.goto(url.toString(), { waitUntil: 'domcontentloaded' });

  const reachable = await page.evaluate(async (probe) => {
    try {
      return (await fetch(probe)).ok;
    } catch (_) {
      return false;
    }
  }, PROBE);
  if (!reachable) {
    console.log('  SKIP: the Portolan reference catalog is not reachable');
    return;
  }

  // Poll from Node rather than with waitForFunction: an async predicate returns a Promise,
  // which is truthy at once, so waitForFunction would not wait at all.
  const poll = async (fn, arg, what) => {
    const deadline = Date.now() + 45_000;
    while (Date.now() < deadline) {
      const value = await page.evaluate(fn, arg);
      if (value) return value;
      await page.waitForTimeout(1000);
    }
    fail(what);
  };
  const features = async (layerId) => {
    const adapter = await document.querySelector('webmapx-map').getAdapterAsync();
    const fc = await adapter.queryLayerFeatures(layerId);
    return (fc?.features ?? []).map((f) => f.properties ?? {});
  };

  // Both layers reach the store once their collection, style and data have been read, and
  // the legend names each after its collection, since the config gives no title.
  const labels = await poll(async () => {
    const map = document.querySelector('webmapx-map');
    const adapter = map && typeof map.getAdapterAsync === 'function' ? await map.getAdapterAsync() : null;
    const layers = adapter?.store.getState().mapLayers ?? {};
    if (!layers['nl-provinces'] || !layers['ne-countries']) return null;
    return { provinces: layers['nl-provinces'].label, countries: layers['ne-countries'].label };
  }, undefined, 'the Portolan layers never reached the map');
  if (labels.provinces !== 'Netherlands Provinces') fail(`provinces labelled "${labels.provinces}", expected the collection title`);
  if (labels.countries !== 'Natural Earth Countries (1:110m)') fail(`countries labelled "${labels.countries}", expected the collection title`);

  // The provinces' tiles must actually draw.
  const provinceNames = await poll(async ([fnSource, id]) => {
    const read = new Function(`return (${fnSource})`)();
    const names = (await read(id)).map((p) => p.naam).filter(Boolean);
    return names.length > 0 ? [...new Set(names)].sort() : null;
  }, [features.toString(), 'nl-provinces'], 'no province features were drawn from the PMTiles');
  if (!provinceNames.includes('Utrecht')) fail(`expected Utrecht among the provinces, got ${provinceNames.join(', ')}`);

  // The countries come from the GeoParquet, reprojected and loaded whole: all of them.
  const countryCount = await poll(async ([fnSource, id]) => {
    const read = new Function(`return (${fnSource})`)();
    const count = (await read(id)).length;
    return count > 100 ? count : null;
  }, [features.toString(), 'ne-countries'], 'the GeoParquet countries never loaded');

  console.log(`  provinces drawn: ${provinceNames.length}, countries loaded: ${countryCount}`);
  if (process.env.WEBMAPX_SCREENSHOT) {
    await page.waitForTimeout(1500);
    await page.screenshot({ path: process.env.WEBMAPX_SCREENSHOT.replace('{engine}', engine) });
  }
}
