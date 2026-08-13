/**
 * UI Test: Buffer tool
 *
 * Regression test for the bug where a tool registered in tool-loader.ts's TOOL_MAP but
 * missing from the demo app's static import list produced an inert toolbar button — the
 * custom element behind it never loaded, so clicking it did nothing. The buffer tool isn't
 * wired into demo.json's toolbar by default, so this test adds it the same way a real user
 * would via the config-edit tool (drop a modified config), then drives a full buffer
 * operation end to end:
 * 1. Buffer toolbar button appears and its custom element loads (the actual regression)
 * 2. Draw a point feature to have a vector layer to buffer
 * 3. Activate the buffer tool, run it against that layer
 * 4. A new buffered polygon layer is added to the map with no error
 */

function fail(message) {
  throw new Error(message);
}

async function waitForMapReady(page) {
  await page.waitForFunction(async () => {
    const map = document.querySelector('webmapx-map');
    if (!map || typeof map.getAdapterAsync !== 'function') return false;
    const adapter = await map.getAdapterAsync();
    return Boolean(adapter);
  }, undefined, { timeout: 45_000 });
}

/** Stages a demo.json copy with "buffer" added to the main toolbar — mirrors what the
 *  config-edit tool produces — via the same drop-a-config flow a real user goes through. */
async function stageBufferToolConfig(page) {
  const demoConfig = await page.evaluate(async () => {
    const res = await fetch('/config/demo.json');
    return res.json();
  });
  demoConfig.tools.mainToolbar.items.push({
    id: 'buffer',
    type: 'buffer',
    enabled: true,
    title: 'Buffer',
    icon: 'bounding-box',
  });

  await page.evaluate(async (cfg) => {
    const mod = await import('/src/utils/dropped-config.ts');
    await mod.storeDroppedConfig(JSON.stringify(cfg));
  }, demoConfig);

  await page.reload({ waitUntil: 'domcontentloaded' });
  await waitForMapReady(page);
}

async function activateDrawTool(page) {
  await page.waitForFunction(() => {
    return Boolean(document.querySelector('webmapx-toolbar sl-button[name="draw"]'))
      && customElements.get('webmapx-draw-tool') !== undefined;
  }, undefined, { timeout: 15_000 });

  await page.evaluate(() => {
    document.querySelector('webmapx-toolbar sl-button[name="draw"]').click();
  });

  await page.waitForFunction(() => {
    const tool = document.querySelector('webmapx-draw-tool');
    return Boolean(tool?.active);
  }, undefined, { timeout: 10_000 });
}

/** Draws a single point feature into a fresh local draw layer. */
async function drawPointFeature(page) {
  await page.evaluate(() => {
    const tool = document.querySelector('webmapx-draw-tool');
    const btn = tool.shadowRoot.querySelector('sl-icon-button[name="geo-fill"]');
    if (!btn) throw new Error('Point draw button not found');
    btn.click();
  });

  await page.waitForFunction(() => {
    const tool = document.querySelector('webmapx-draw-tool');
    const dialogRoot = tool?.shadowRoot?.querySelector('webmapx-draw-layer-dialog')?.shadowRoot;
    return Boolean(dialogRoot?.querySelector('.layer-option'));
  }, undefined, { timeout: 5_000 });

  await page.evaluate(() => {
    const tool = document.querySelector('webmapx-draw-tool');
    const dialog = tool?.shadowRoot?.querySelector('webmapx-draw-layer-dialog');
    if (!dialog) throw new Error('Draw layer dialog not found');
    dialog.dispatchEvent(new CustomEvent('webmapx-draw-layer-confirm', {
      detail: { id: 'buffer-test-layer', name: 'buffer-test', type: 'Point', color: '#0f62fe', properties: [] },
      bubbles: true,
      composed: true,
    }));
  });

  await page.waitForFunction(() => {
    const tool = document.querySelector('webmapx-draw-tool');
    return Boolean(tool?.activeLayerIds?.Point);
  }, undefined, { timeout: 10_000 });

  await page.evaluate(async () => {
    const map = document.querySelector('webmapx-map');
    const adapter = await map?.getAdapterAsync?.();
    if (!adapter) throw new Error('Adapter unavailable');
    const center = adapter.getViewportState().center;
    adapter.events.emit({ type: 'click', coords: center, pixel: adapter.project(center), resolution: null });
  });

  await page.waitForFunction(() => {
    const tool = document.querySelector('webmapx-draw-tool');
    return Array.isArray(tool?.features) && tool.features.length >= 1;
  }, undefined, { timeout: 10_000 });
}

/** Deactivates draw mode so the drawn feature is written to a queryable permanent source. */
async function deactivateDrawTool(page) {
  await page.evaluate(() => {
    document.querySelector('webmapx-toolbar sl-button[name="draw"]')?.click();
  });
  await page.waitForFunction(() => {
    const tool = document.querySelector('webmapx-draw-tool');
    return Boolean(tool && !tool.active);
  }, undefined, { timeout: 10_000 });
}

/** The actual regression check: the toolbar button and its custom element must both become
 *  available even though "buffer" was added to the toolbar via config, not a static import. */
async function activateBufferTool(page) {
  await page.waitForFunction(() => {
    return Boolean(document.querySelector('webmapx-toolbar sl-button[name="buffer"]'))
      && customElements.get('webmapx-buffer-tool') !== undefined;
  }, undefined, { timeout: 15_000 });

  await page.evaluate(() => {
    const btn = document.querySelector('webmapx-toolbar sl-button[name="buffer"]');
    if (!btn) throw new Error('Buffer toolbar button not found');
    btn.click();
  });

  await page.waitForFunction(() => {
    const tool = document.querySelector('webmapx-buffer-tool');
    return Boolean(tool?.active);
  }, undefined, { timeout: 10_000 });
}

async function getSelectedInputLayer(page) {
  return page.evaluate(() => {
    const tool = document.querySelector('webmapx-buffer-tool');
    return tool?.shadowRoot?.querySelector('sl-select')?.value ?? null;
  });
}

async function runBufferOperation(page) {
  await page.evaluate(() => {
    const tool = document.querySelector('webmapx-buffer-tool');
    const btn = tool?.shadowRoot?.querySelector('.actions sl-button[variant="primary"]');
    if (!btn) throw new Error('Buffer run button not found');
    btn.click();
  });
}

async function waitForBufferOutputLayer(page) {
  await page.waitForFunction(async () => {
    const map = document.querySelector('webmapx-map');
    const adapter = await map?.getAdapterAsync?.();
    const mapLayers = adapter?.store?.getState()?.mapLayers ?? {};
    return Object.keys(mapLayers).some((id) => id.startsWith('webmapx-buffer-out:'));
  }, undefined, { timeout: 30_000 });
}

async function getBufferErrorText(page) {
  return page.evaluate(() => {
    const tool = document.querySelector('webmapx-buffer-tool');
    return tool?.shadowRoot?.querySelector('sl-alert[variant="danger"]')?.textContent?.trim() ?? null;
  });
}

export async function run({ page, engine, baseUrl }) {
  console.log(`  Running buffer tool test for engine: ${engine}`);

  const step = async (label, fn) => {
    try {
      await fn();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`${label}: ${message}`, { cause: error });
    }
  };

  await step('load default page', async () => {
    await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });
    await waitForMapReady(page);
  });

  await step('drop config with buffer added to toolbar', () => stageBufferToolConfig(page));

  await step('activate draw tool', () => activateDrawTool(page));

  await step('draw a point feature', () => drawPointFeature(page));

  await step('deactivate draw tool', () => deactivateDrawTool(page));

  await step('activate buffer tool (regression: lazily-loaded custom element)', () => activateBufferTool(page));

  // Drawing a point creates two map layers: a live editing-preview layer, and a "-map"
  // permanent layer the draw tool writes the final feature into once deactivated (see
  // deactivateDrawTool above). Only the latter still exists by now, so it's the only —
  // and therefore auto-selected — option; whether it actually holds data is verified by
  // the buffer operation succeeding below rather than asserted on the id here.
  const selectedLayer = await getSelectedInputLayer(page);
  if (!selectedLayer) fail('Buffer tool did not auto-select an input layer');
  console.log('    Buffer tool auto-selected input layer:', selectedLayer);

  await step('run buffer operation', () => runBufferOperation(page));

  await step('wait for buffered output layer', async () => {
    try {
      await waitForBufferOutputLayer(page);
    } catch (error) {
      const errorText = await getBufferErrorText(page);
      if (errorText) fail(`Buffer tool reported an error: ${errorText}`);
      throw error;
    }
  });

  console.log('    Buffer output layer created successfully');
}

export const engines = ['maplibre', 'openlayers', 'leaflet', 'cesium'];
