// Which sources an engine can draw is answered by its adapter
// (`canDrawSource`/`canDrawLayerType`), and webmapx-map asks rather than
// checking engine names. This pins the answers per engine, through the public
// `isLayerSpecSupported` the layer tree uses to grey out a layer, plus the
// views the projection tool offers and the terrain kind the 3D tool needs.

import { appUrl } from './lib/fixture-config.mjs';

const EXPECTED = {
  maplibre: { terrain: 'raster-dem', raster: true, geojson: true, vector: true, 'raster-dem': true, warped: true, allmaps: true },
  openlayers: { terrain: null, raster: true, geojson: true, vector: true, 'raster-dem': true, warped: true, allmaps: true },
  leaflet: { terrain: null, raster: true, geojson: true, vector: false, 'raster-dem': false, warped: true, allmaps: true },
  cesium: { terrain: 'terrain-service', raster: true, geojson: true, vector: false, 'raster-dem': false, warped: false, allmaps: false },
};

export async function run({ page, baseUrl, engine }) {
  await page.goto(appUrl(baseUrl), { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(async () => {
    const map = document.querySelector('webmapx-map');
    return Boolean(await map?.getAdapterAsync?.());
  }, undefined, { timeout: 45_000 });

  const actual = await page.evaluate(async () => {
    const map = document.querySelector('webmapx-map');
    const adapter = await map.getAdapterAsync();
    const spec = (source) => map.isLayerSpecSupported({ sources: { s: source } });
    return {
      engineId: adapter.engineId,
      raster: spec({ type: 'raster', tiles: ['https://example.org/{z}/{x}/{y}.png'] }),
      geojson: spec({ type: 'geojson', data: { type: 'FeatureCollection', features: [] } }),
      vector: spec({ type: 'vector', tiles: ['https://example.org/{z}/{x}/{y}.pbf'] }),
      'raster-dem': spec({ type: 'raster-dem', tiles: ['https://example.org/{z}/{x}/{y}.png'] }),
      warped: spec({ type: 'raster', url: 'warpedmap://annotation' }),
      allmaps: adapter.canDrawLayerType('allmaps'),
      views: adapter.getViewProjections(),
      terrain: adapter.getTerrainSourceKind(),
    };
  });

  if (actual.engineId !== engine) throw new Error(`expected the ${engine} engine, got ${actual.engineId}`);
  const expected = EXPECTED[engine];
  const wrong = Object.keys(expected).filter((key) => actual[key] !== expected[key]);
  const views = actual.views;
  const viewsOk = {
    maplibre: () => views.join() === 'mercator,globe',
    openlayers: () => views.length > 2 && !views.includes('globe'),
    leaflet: () => views.join() === 'mercator',
    cesium: () => views.join() === 'globe',
  }[engine]();
  if (!viewsOk) wrong.push('views');
  if (wrong.length) {
    throw new Error(`${engine}: ${wrong.map((k) => `${k} expected ${expected[k] ?? '(see test)'}, got ${actual[k]}`).join('; ')}`);
  }
}

export const engines = ['maplibre', 'openlayers', 'leaflet', 'cesium'];
