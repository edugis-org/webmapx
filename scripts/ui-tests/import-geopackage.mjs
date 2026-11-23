import { appUrl } from './lib/fixture-config.mjs';

/**
 * UI Test: importing a multi-layer GeoPackage that has no stored counts.
 *
 * `no-counts.gpkg` lacks `gpkg_ogr_contents`, as files from QGIS and many other
 * producers do. gdal3.js's `Gdal.open` counts every feature of such a file in
 * full before anything else happens; the worker opens it with GDALOpenEx
 * instead (`src/workers/gdal-fast-open.ts`) and estimates each layer's count
 * from its highest FID. The fixture's `gemalen` layer has 38 features with FIDs
 * up to 40, so the picker must show "≈ 40": an estimate, said to be one.
 *
 * Then the picked layer must arrive on the map with all its features, which
 * also covers the layer being converted by name rather than through SQL.
 */

function fail(message) { throw new Error(message); }

/** Polls an async page function until it returns something truthy (waitForFunction takes a pending promise as truthy). */
async function poll(page, fn, timeout) {
  const end = Date.now() + timeout;
  for (;;) {
    const value = await page.evaluate(fn);
    if (value) return value;
    if (Date.now() > end) fail(`timed out after ${timeout} ms`);
    await page.waitForTimeout(250);
  }
}

async function step(name, fn) {
  try { await fn(); } catch (error) {
    throw new Error(`Step "${name}" failed: ${error.message}`, { cause: error });
  }
}

export async function run({ page, engine, baseUrl }) {
  console.log(`  Running import-geopackage test for engine: ${engine}`);
  await page.goto(appUrl(baseUrl), { waitUntil: 'domcontentloaded' });

  await step('map ready', async () => {
    await poll(page, async () => {
      const map = document.querySelector('webmapx-map');
      return Boolean(map?.getAdapterAsync && await map.getAdapterAsync());
    }, 60000);
  });

  await step('drop the GeoPackage', async () => {
    await page.evaluate(async () => {
      const bytes = await (await fetch('/tests/fixtures/import/no-counts.gpkg')).arrayBuffer();
      const file = new File([bytes], 'no-counts.gpkg');
      // Not awaited: it resolves only after the picker is answered.
      void document.querySelector('webmapx-map').addFilesAsLayers([file]);
    });
  });

  await step('picker lists both layers, the count marked as an estimate', async () => {
    // GDAL WASM loads on first use, so allow for it.
    const handle = await page.waitForFunction(() => {
      const dialog = document.querySelector('sl-dialog[label^="Import layers from"]');
      const boxes = dialog ? [...dialog.querySelectorAll('sl-checkbox')] : [];
      return boxes.length ? boxes.map((b) => `${b.getAttribute('name')}: ${b.textContent.replace(/\s+/g, ' ').trim()}`) : null;
    }, null, { timeout: 90000 });
    const rows = await handle.jsonValue();
    const gemalen = rows.find((r) => r.startsWith('gemalen:'));
    const stuwen = rows.find((r) => r.startsWith('stuwen:'));
    if (!gemalen || !stuwen) fail(`expected layers gemalen and stuwen, got ${JSON.stringify(rows)}`);
    if (!/≈ 40 features/.test(gemalen)) fail(`gemalen should show "≈ 40 features" (highest FID), got "${gemalen}"`);
    if (!/≈ 5 features/.test(stuwen)) fail(`stuwen should show "≈ 5 features", got "${stuwen}"`);
  });

  await step('import only gemalen', async () => {
    await page.evaluate(() => {
      const dialog = document.querySelector('sl-dialog[label^="Import layers from"]');
      const stuwen = dialog.querySelector('sl-checkbox[name="stuwen"]');
      stuwen.checked = false;
      stuwen.dispatchEvent(new Event('sl-change', { bubbles: true }));
      dialog.querySelector('.import-btn').click();
    });
  });

  await step('the layer is on the map with every feature, in lon/lat', async () => {
    const { count, first, stuwen } = await poll(page, async () => {
      const adapter = await document.querySelector('webmapx-map').getAdapterAsync();
      const layers = adapter.store.getState().mapLayers ?? {};
      const ids = Object.keys(layers).filter((id) => /gemalen/i.test(id) || /gemalen/i.test(layers[id]?.title ?? ''));
      const stuwen = Object.keys(layers).some((id) => /stuwen/i.test(id) || /stuwen/i.test(layers[id]?.title ?? ''));
      for (const id of ids) {
        // An imported layer carries its data inline.
        const data = layers[id]?.sourceData;
        if (data?.features?.length) {
          return { count: data.features.length, first: data.features[0].geometry.coordinates, stuwen };
        }
      }
      return null;
    }, 60000);
    if (count !== 38) fail(`expected 38 features in gemalen, got ${count}`);
    // The fixture is stored in RD New; the import reprojects to WGS84 (fixture points lie in 4–7°E, 51–53°N).
    const [lon, lat] = first;
    if (!(lon > 3.9 && lon < 7.1 && lat > 50.9 && lat < 53.1)) fail(`first feature not in lon/lat: ${first}`);
    if (stuwen) fail('stuwen was unticked but was imported anyway');
  });
}

// Import is generic code above the adapter; one 2D engine per rendering family is enough.
export const engines = ['maplibre', 'openlayers'];
