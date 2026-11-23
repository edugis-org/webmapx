/**
 * UI Test: Portolan collections as layers (docs/adr/0001-portolan-catalogs.md, step 1)
 *
 * `portolan://<collection.json>` in both places a URL can stand:
 * - as a style URL (`{ type: 'style', url: 'portolan://…' }`): the publisher's default
 *   style, or a named one with `#style-key`, bound to the collection's own data — the
 *   PMTiles `visual` for the Dutch provinces, the GeoParquet `data` for the small Natural
 *   Earth countries (which ship no PMTiles);
 * - as a source URL: the collection's current data under the config's own paint and filter
 *   (the EduGIS BAG buildings, filtered to Amsterdam by the municipality code their id
 *   starts with).
 * The reference catalog is hosted on source.coop, so the suite skips rather than fails
 * when that host is unreachable.
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

  // A named publisher style: `#style-labeled` adds a symbol layer the default lacks.
  await page.evaluate(async () => {
    await document.querySelector('webmapx-map').addLayerRequest({ layerId: 'nl-provinces-labeled' });
  });
  const labeledHasLabels = await poll(async () => {
    const adapter = await document.querySelector('webmapx-map').getAdapterAsync();
    const entry = adapter.store.getState().mapLayers['nl-provinces-labeled'];
    if (!entry) return null;
    return JSON.stringify(entry).includes('"symbol"') ? 'yes' : 'no';
  }, undefined, 'the labeled publisher style never reached the map');
  if (labeledHasLabels !== 'yes') fail('#style-labeled was drawn without its label layer — the default style was used instead');

  // portolan:// as a source URL, under the config's own filter: only Amsterdam's
  // buildings (BAG ids start with the municipality code, 0363 for Amsterdam).
  await page.evaluate(async () => {
    const map = document.querySelector('webmapx-map');
    await map.addLayerRequest({ layerId: 'panden-amsterdam' });
    const adapter = await map.getAdapterAsync();
    adapter.setViewport([4.8897, 52.3731], 15, { animate: false });
  });
  const ids = await poll(async ([fnSource, id]) => {
    const read = new Function(`return (${fnSource})`)();
    const found = (await read(id)).map((p) => String(p.identificatie ?? '')).filter(Boolean);
    return found.length > 0 ? found : null;
  }, [features.toString(), 'panden-amsterdam'], 'no Amsterdam buildings were drawn from the portolan:// source');
  const outside = ids.filter((id) => !id.startsWith('0363'));
  if (outside.length) fail(`the filter let through ${outside.length} buildings outside Amsterdam, e.g. ${outside[0]}`);

  console.log(`  provinces drawn: ${provinceNames.length}, countries loaded: ${countryCount}, Amsterdam buildings: ${ids.length}`);
  if (process.env.WEBMAPX_SCREENSHOT) {
    await page.waitForTimeout(1500);
    await page.screenshot({ path: process.env.WEBMAPX_SCREENSHOT.replace('{engine}', engine) });
  }
}
