/**
 * UI Test: what the style panel offers a raster layer
 *
 * A raster layer has no features and no paint, so none of the classification
 * steps apply — but "nothing can be restyled here" was not the truth either: a
 * WMS draws its pictures on request and will draw them another way if asked for
 * one of its named styles, while a plain tile service serves what it has already
 * drawn. This checks that the panel tells those two apart, and that choosing a
 * WMS style actually reaches the live source.
 *
 * The WMS is a real remote service (PDOK), so the style-switching part is
 * skipped rather than failed when it cannot be reached.
 */
import { appUrl } from './lib/fixture-config.mjs';
import { installDeepQuery } from './lib/deep-query.mjs';

const BAKED_GETMAP = 'bevolking2015';   // GetMap query baked into the source url
const BARE_ENDPOINT = 'pdok-bag-raster'; // endpoint + `layers` sibling key
const PLAIN_TILES = 'osm';               // not a WMS at all

export const engines = ['maplibre', 'openlayers', 'leaflet', 'cesium'];

function fail(message) {
  throw new Error(message);
}

async function openPanel(page, layerId) {
  return page.evaluate(async (id) => {
    const map = document.querySelector('webmapx-map');
    const adapter = await map.getAdapterAsync();
    // A layer the config already shows is not added again, and addLayerRequest
    // reports that as false. What this test needs is "the layer is on the map",
    // so a refusal is only a failure when the layer is absent afterwards.
    const added = await map.addLayerRequest({ layerId: id });
    if (!added && !adapter.store.getState().mapLayers[id]) {
      return { error: `${id} was not added` };
    }
    const legend = document.querySelector('webmapx-layer-overview')
      ?? document.querySelector('webmapx-layer-legend3d');
    const entry = adapter.store.getState().mapLayers[id];
    await legend.handleShowLayerStyle(id, id);
    // The style list is read from the service's capabilities, so it arrives late.
    await new Promise((resolve) => setTimeout(resolve, 5000));
    const dialog = window.__wmxDeepQuery('webmapx-layer-style-dialog');
    return {
      hasStyleButton: legend.layerHasStyleDialog(entry),
      headings: [...dialog.shadowRoot.querySelectorAll('.question h3')].map((h) => h.textContent.trim()),
      choices: [...dialog.shadowRoot.querySelectorAll('.choice')].map((b) => b.textContent.trim()),
      styles: (JSON.stringify(adapter.getSourceTiles(entry?.sourceId)) ?? '').match(/styles=([^&"]*)/i)?.[1] ?? null,
    };
  }, layerId);
}

export async function run({ page, engine, baseUrl }) {
  console.log(`  Running raster style panel test for engine: ${engine}`);

  await page.goto(appUrl(baseUrl), { waitUntil: 'domcontentloaded' });
  // The panel stays inside the legend's shadow root — it rises into the top
  // layer as a popover rather than being reparented to document.body.
  await installDeepQuery(page);
  await page.waitForFunction(async () => {
    const map = document.querySelector('webmapx-map');
    if (!map || typeof map.getAdapterAsync !== 'function') return false;
    return Boolean(await map.getAdapterAsync());
  }, undefined, { timeout: 45_000 });

  const step = async (label, fn) => {
    try {
      await fn();
      console.log(`    ✓ ${label}`);
    } catch (error) {
      throw new Error(`${label}: ${error instanceof Error ? error.message : String(error)}`, { cause: error });
    }
  };

  await step('a plain tile layer is offered the panel, and told why it has no colours', async () => {
    const panel = await openPanel(page, PLAIN_TILES);
    if (panel.error) fail(panel.error);
    if (!panel.hasStyleButton) fail('the legend offers no style button for a raster layer');
    if (!panel.headings.includes('Images, not features')) {
      fail(`a plain tile layer got steps: ${panel.headings.join(', ')}`);
    }
    // Opacity is the one thing that is still true of any raster.
    if (!panel.headings.includes('Opacity')) fail('no opacity control on a raster layer');
    await page.evaluate(() => window.__wmxDeepQuery('webmapx-layer-style-dialog').close());
  });

  await step('a WMS whose request is baked into its url is recognised', async () => {
    const panel = await openPanel(page, BAKED_GETMAP);
    if (panel.error) fail(panel.error);
    // This service advertises no named styles, so the honest answer is that it
    // draws the layer one way — not the plain-tiles wording.
    if (panel.headings.includes('Images, not features')) {
      fail('a WMS source was read as a plain tile service');
    }
    if (!panel.headings.some((h) => h === 'Which style?' || h === 'Drawn by the service' || h === 'Styles')) {
      fail(`no WMS step; steps: ${panel.headings.join(', ')}`);
    }
    await page.evaluate(() => window.__wmxDeepQuery('webmapx-layer-style-dialog').close());
  });

  await step('a WMS given as an endpoint offers its named styles, and choosing one reaches the map', async () => {
    const panel = await openPanel(page, BARE_ENDPOINT);
    if (panel.error) fail(panel.error);
    if (!panel.headings.includes('Which style?')) {
      console.log(`    SKIP: the WMS did not answer with its styles (steps: ${panel.headings.join(', ')})`);
      await page.evaluate(() => window.__wmxDeepQuery('webmapx-layer-style-dialog').close());
      return;
    }
    if (panel.choices.length < 2) fail(`only ${panel.choices.length} style offered`);

    const applied = await page.evaluate(async () => {
      const dialog = window.__wmxDeepQuery('webmapx-layer-style-dialog');
      [...dialog.shadowRoot.querySelectorAll('.choice')][1].click();
      await new Promise((resolve) => setTimeout(resolve, 1500));
      const adapter = await document.querySelector('webmapx-map').getAdapterAsync();
      const entry = adapter.store.getState().mapLayers['pdok-bag-raster'];
      const tiles = JSON.stringify(adapter.getSourceTiles(entry?.sourceId)) ?? '';
      dialog.close();
      return tiles.match(/styles=([^&"]*)/i)?.[1] ?? null;
    });
    // The engine's own request url must carry the chosen style: a bare endpoint
    // has no request url in its config, so rewriting the config would change
    // nothing the map asks for.
    if (!applied) fail('the live source carries no STYLES parameter after choosing a style');
    if (applied === panel.styles) fail(`the style did not change (still ${applied})`);
  });
}
