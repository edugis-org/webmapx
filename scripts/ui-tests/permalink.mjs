/**
 * UI Test: Permalink
 *
 * Tests:
 * 1. Permalink button present in layer overview
 * 2. Clicking it opens dialog with a ?s= URL
 * 3. Navigating to a constructed permalink restores zoom, center and layer visibility
 */

function fail(message) {
  throw new Error(message);
}

async function waitForMapLoaded(page) {
  await page.waitForFunction(async () => {
    const map = document.querySelector('webmapx-map');
    if (!map || typeof map.getAdapterAsync !== 'function') return false;
    const adapter = await map.getAdapterAsync();
    return adapter?.store?.getState()?.mapLoaded === true;
  }, undefined, { timeout: 45_000 });
}

async function step(name, fn) {
  try {
    await fn();
  } catch (error) {
    throw new Error(`Step "${name}" failed: ${error.message}`);
  }
}

// Encode a known permalink state the same way src/utils/permalink.ts does
function encodePermalink(state) {
  return btoa(JSON.stringify(state));
}

export async function run({ page, engine, baseUrl }) {
  console.log(`  Running permalink test for engine: ${engine}`);

  // ── Part 1: button exists and dialog opens ───────────────────────────────

  await step('load default page and wait for map', async () => {
    await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });
    await waitForMapLoaded(page);
  });

  await step('permalink button is present in layer overview', async () => {
    const found = await page.evaluate(() => {
      const map = document.querySelector('webmapx-map');
      const overview = map?.querySelector('webmapx-layer-overview');
      if (!overview?.shadowRoot) return false;
      const buttons = overview.shadowRoot.querySelectorAll('sl-button');
      return Array.from(buttons).some(b => b.textContent?.includes('Permalink'));
    });
    if (!found) fail('Permalink button not found in webmapx-layer-overview');
    console.log('    Permalink button found');
  });

  await step('clicking permalink button opens dialog with ?s= URL', async () => {
    await page.evaluate(() => {
      const map = document.querySelector('webmapx-map');
      const overview = map?.querySelector('webmapx-layer-overview');
      if (!overview?.shadowRoot) throw new Error('Layer overview shadow root not found');
      const button = Array.from(overview.shadowRoot.querySelectorAll('sl-button'))
        .find(b => b.textContent?.includes('Permalink'));
      if (!button) throw new Error('Permalink button not found');
      button.click();
    });

    // Wait for dialog to open and contain a URL
    await page.waitForFunction(() => {
      const map = document.querySelector('webmapx-map');
      const overview = map?.querySelector('webmapx-layer-overview');
      if (!overview?.shadowRoot) return false;
      const dialog = overview.shadowRoot.querySelector('webmapx-permalink-dialog');
      if (!dialog?.shadowRoot) return false;
      const urlBox = dialog.shadowRoot.querySelector('.url-box');
      return urlBox?.textContent?.includes('?s=') ?? false;
    }, undefined, { timeout: 10_000 });

    const url = await page.evaluate(() => {
      const map = document.querySelector('webmapx-map');
      const overview = map?.querySelector('webmapx-layer-overview');
      const dialog = overview?.shadowRoot?.querySelector('webmapx-permalink-dialog');
      return dialog?.shadowRoot?.querySelector('.url-box')?.textContent?.trim() ?? '';
    });

    if (!url.includes('?s=')) fail(`Dialog URL missing ?s= param: ${url}`);
    console.log(`    Dialog URL generated (${url.length} chars)`);
  });

  // ── Part 2: restore from a constructed permalink ─────────────────────────

  // Build a permalink for demo.json defaults:
  // zoom 5, center Amsterdam [4.9, 52.3], layer "osm" visible
  // l = all layers bottom-to-top (osm is the only layer in demo.json default)
  const permalinkState = { l: ['osm'], v: [4.9, 52.3, 5, 0, 0] };
  const encoded = encodePermalink(permalinkState);
  const permalinkUrl = `${baseUrl}?s=${encodeURIComponent(encoded)}`;

  await step('navigate to constructed permalink URL', async () => {
    await page.goto(permalinkUrl, { waitUntil: 'domcontentloaded' });
    await waitForMapLoaded(page);
  });

  await step('zoom is restored from permalink', async () => {
    const zoom = await page.evaluate(async () => {
      const map = document.querySelector('webmapx-map');
      const adapter = await map?.getAdapterAsync?.();
      return adapter?.getViewportState?.()?.zoom ?? null;
    });
    if (zoom === null) fail('Could not read zoom from adapter');
    if (Math.abs(zoom - 5) > 0.5) fail(`Zoom mismatch: expected ~5, got ${zoom}`);
    console.log(`    Zoom restored: ${zoom.toFixed(2)}`);
  });

  await step('center is restored from permalink', async () => {
    const center = await page.evaluate(async () => {
      const map = document.querySelector('webmapx-map');
      const adapter = await map?.getAdapterAsync?.();
      return adapter?.getViewportState?.()?.center ?? null;
    });
    if (!center) fail('Could not read center from adapter');
    if (Math.abs(center[0] - 4.9) > 0.5) fail(`Center lng mismatch: expected ~4.9, got ${center[0]}`);
    if (Math.abs(center[1] - 52.3) > 0.5) fail(`Center lat mismatch: expected ~52.3, got ${center[1]}`);
    console.log(`    Center restored: [${center[0].toFixed(3)}, ${center[1].toFixed(3)}]`);
  });

  await step('osm layer is present and visible', async () => {
    // applyInitialStateLayers runs async after mapLoaded; poll store directly
    // (avoid async getAdapterAsync inside waitForFunction — use synchronous adapter getter)
    await page.waitForFunction(() => {
      const map = document.querySelector('webmapx-map');
      const adapter = map?.adapter;
      return 'osm' in (adapter?.store?.getState()?.mapLayers ?? {});
    }, undefined, { timeout: 30_000 });

    const result = await page.evaluate(async () => {
      const map = document.querySelector('webmapx-map');
      const adapter = await map?.getAdapterAsync?.();
      const mapLayers = adapter?.store?.getState()?.mapLayers ?? {};
      const entry = mapLayers['osm'];
      if (!entry) return { found: false };
      return { found: true, visible: entry.visible !== false };
    });
    if (!result.found) fail('"osm" layer not found in store.mapLayers');
    if (!result.visible) fail('"osm" layer is not visible');
    console.log('    Layer "osm" present and visible');
  });
}

export const engines = ['maplibre', 'openlayers', 'leaflet', 'cesium'];
