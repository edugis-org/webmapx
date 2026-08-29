/**
 * UI Test: Geoprocessing tool
 *
 * Drives the tool end to end in a real browser against the real GDAL WASM worker:
 * 1. The tool is added to the toolbar via config (as a user would) and its custom
 *    element loads lazily — the same wiring regression tool-buffer.mjs guards.
 * 2. Two overlapping GeoJSON layers are added to the map.
 * 3. A two-input operation (clip) runs and produces an output layer whose geometry
 *    is the overlap only — proving the cross-dataset SQL path works in the browser,
 *    where the virtual filesystem differs from the Node build used by the unit tests.
 * 4. A one-input operation (centroid) runs on that result, proving the arity branch
 *    and that a tool output can feed the next operation.
 */
import { appUrl, FIXTURE_CONFIG } from './lib/fixture-config.mjs';

function fail(message) {
  throw new Error(message);
}

/**
 * Polls an async page.evaluate from Node instead of using page.waitForFunction.
 *
 * The map adapter is only reachable through `await map.getAdapterAsync()`, and a
 * waitForFunction predicate that returns a Promise resolves on the Promise object
 * itself — always truthy, so the wait would pass instantly. Polling from here
 * keeps each evaluate a complete await.
 */
async function pollFor(page, description, fn, { timeout = 30_000, interval = 250 } = {}) {
  const deadline = Date.now() + timeout;
  let last;
  for (;;) {
    last = await fn();
    if (last) return last;
    if (Date.now() > deadline) fail(`Timed out waiting for ${description}`);
    await new Promise(resolve => setTimeout(resolve, interval));
  }
}

async function waitForMapReady(page) {
  await page.waitForFunction(async () => {
    const map = document.querySelector('webmapx-map');
    if (!map || typeof map.getAdapterAsync !== 'function') return false;
    const adapter = await map.getAdapterAsync();
    return Boolean(adapter);
  }, undefined, { timeout: 45_000 });
}

/** Adds the geoprocessing tool to the main toolbar the same way the config-edit tool would. */
async function stageGeoprocessingConfig(page, baseUrl) {
  // The path is passed in: page.evaluate runs in the browser, where the Node
  // import of FIXTURE_CONFIG does not exist.
  const demoConfig = await page.evaluate(async (configPath) => {
    const res = await fetch(configPath);
    return res.json();
  }, FIXTURE_CONFIG);
  demoConfig.tools.mainToolbar.items.push({
    id: 'geoprocessing',
    type: 'geoprocessing',
    enabled: true,
    title: 'Analysis',
    icon: 'intersect',
  });

  await page.evaluate(async (cfg) => {
    const mod = await import('/src/utils/dropped-config.ts');
    await mod.storeDroppedConfig(JSON.stringify(cfg));
  }, demoConfig);

  // Navigated rather than reloaded, and deliberately without the ?config=
  // parameter the other steps use: the staged config *is* the config under
  // test, and an explicit ?config= would outrank it.
  await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });
  await waitForMapReady(page);
}

/**
 * Two overlapping squares, deliberately *not* at the map centre.
 *
 * The demo config starts at 0,0, and a botched EPSG:3857 → 4326 reprojection also
 * lands at 0,0 — fixtures at the centre would make the two indistinguishable.
 * GeoJSON layers return all their features regardless of the viewport, so placing
 * them off-screen costs nothing.
 */
const ORIGIN = [30, 40];

async function addTestLayers(page) {
  await page.evaluate(async ([lon, lat]) => {
    const map = document.querySelector('webmapx-map');
    const d = 0.2;

    const square = (x0, y0, size, props) => ({
      type: 'Feature',
      properties: props,
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [x0, y0], [x0 + size, y0], [x0 + size, y0 + size], [x0, y0 + size], [x0, y0],
        ]],
      },
    });

    const layer = (id, label, feature, color) => ({
      id,
      type: 'fill',
      source: `${id}-src`,
      sources: {
        [`${id}-src`]: {
          id: `${id}-src`,
          type: 'geojson',
          data: { type: 'FeatureCollection', features: [feature] },
        },
      },
      paint: { 'fill-color': color, 'fill-opacity': 0.4 },
      metadata: { label, dynamic: true },
    });

    await map.addLayerRequest(layer(
      'gp-test-a', 'GP test A',
      square(lon - d, lat - d, d * 2, { name: 'alpha', pop: 42 }),
      '#0f62fe',
    ));
    await map.addLayerRequest(layer(
      'gp-test-b', 'GP test B',
      square(lon, lat, d * 2, { zone: 'east' }),
      '#e63946',
    ));
  }, ORIGIN);

  await pollFor(page, 'the test layers to register', () => page.evaluate(async () => {
    const map = document.querySelector('webmapx-map');
    const adapter = await map?.getAdapterAsync?.();
    const layers = adapter?.store?.getState()?.mapLayers ?? {};
    return Boolean(layers['gp-test-a'] && layers['gp-test-b']);
  }), { timeout: 15_000 });
}

async function activateTool(page) {
  await page.waitForFunction(() => (
    Boolean(document.querySelector('webmapx-toolbar sl-button[name="geoprocessing"]'))
      && customElements.get('webmapx-geoprocessing-tool') !== undefined
  ), undefined, { timeout: 15_000 });

  await page.evaluate(() => {
    const btn = document.querySelector('webmapx-toolbar sl-button[name="geoprocessing"]');
    if (!btn) throw new Error('Analysis toolbar button not found');
    btn.click();
  });

  await page.waitForFunction(() => {
    const tool = document.querySelector('webmapx-geoprocessing-tool');
    return Boolean(tool?.active);
  }, undefined, { timeout: 10_000 });
}

/** Clicks an operation in the grid by its visible label. */
async function chooseOperation(page, label) {
  await page.waitForFunction((wanted) => {
    const tool = document.querySelector('webmapx-geoprocessing-tool');
    const buttons = [...(tool?.shadowRoot?.querySelectorAll('button.op') ?? [])];
    return buttons.some(b => b.textContent.trim() === wanted);
  }, label, { timeout: 10_000 });

  await page.evaluate((wanted) => {
    const tool = document.querySelector('webmapx-geoprocessing-tool');
    const button = [...tool.shadowRoot.querySelectorAll('button.op')]
      .find(b => b.textContent.trim() === wanted);
    if (!button) throw new Error(`Operation "${wanted}" not in the grid`);
    button.click();
  }, label);

  await page.waitForFunction(() => {
    const tool = document.querySelector('webmapx-geoprocessing-tool');
    return Boolean(tool?.shadowRoot?.querySelector('.chosen'));
  }, undefined, { timeout: 5_000 });
}

/** Sets the layer selects (in declaration order: slot a, then slot b). */
async function selectInputLayers(page, layerIds) {
  await page.evaluate((ids) => {
    const tool = document.querySelector('webmapx-geoprocessing-tool');
    // The layer selects are the ones whose options are map layer ids; parameter
    // selects come after them in the same shadow root.
    const selects = [...tool.shadowRoot.querySelectorAll('sl-select')];
    ids.forEach((id, index) => {
      const select = selects[index];
      if (!select) throw new Error(`No select for input ${index}`);
      select.value = id;
      select.dispatchEvent(new CustomEvent('sl-change', { bubbles: true, composed: true }));
    });
  }, layerIds);

  await page.waitForFunction((ids) => {
    const tool = document.querySelector('webmapx-geoprocessing-tool');
    return ids.every((id, i) => tool.slots[['a', 'b'][i]].layerId === id);
  }, layerIds, { timeout: 5_000 });
}

/**
 * The Label point diagram claims something specific — the point is *inside* the
 * polygon, where a centroid would not be. A diagram that draws the dot in the
 * notch teaches the opposite of what the operation does, and is invisible in a
 * 100x52 thumbnail, so assert it with the browser's own geometry instead of by
 * eye: every result dot must fall inside one of the input paths.
 */
async function checkLabelPointDiagram(page) {
  const dots = await page.evaluate(() => {
    const tool = document.querySelector('webmapx-geoprocessing-tool');
    const btn = [...tool.shadowRoot.querySelectorAll('button.op')]
      .find(b => b.textContent.trim() === 'Label point');
    if (!btn) throw new Error('Label point tile not found');
    const svg = btn.querySelector('svg');
    const paths = [...svg.querySelectorAll('.gp-a path')];
    return [...svg.querySelectorAll('.gp-result circle')].map(dot => {
      const point = svg.createSVGPoint();
      point.x = Number(dot.getAttribute('cx'));
      point.y = Number(dot.getAttribute('cy'));
      return { x: point.x, y: point.y, inside: paths.some(path => path.isPointInFill(point)) };
    });
  });

  if (!dots.length) fail('Label point diagram has no result dots');
  const stray = dots.find(d => !d.inside);
  if (stray) fail(`Label point diagram draws a dot at ${stray.x},${stray.y}, outside the polygon`);
}

/**
 * The "only what is drawn is used" warning must appear for tile-backed layers and
 * stay away from GeoJSON ones, which hand over their whole dataset. Both test
 * layers here are GeoJSON, so any warning is a false alarm — and a warning shown
 * on every layer teaches students to ignore it.
 */
async function checkNoViewportWarning(page) {
  await chooseOperation(page, 'Clip');
  await selectInputLayers(page, ['gp-test-a', 'gp-test-b']);
  const warnings = await page.evaluate(() => {
    const tool = document.querySelector('webmapx-geoprocessing-tool');
    return [...tool.shadowRoot.querySelectorAll('.hint.warning')].map(w => w.textContent.trim());
  });
  if (warnings.length) fail(`GeoJSON layers must not warn about the viewport, got: ${warnings.join(' | ')}`);
  await clickChange(page);
}

/** Returns to the operation grid from the chosen-operation header. */
async function clickChange(page) {
  await page.evaluate(() => {
    const tool = document.querySelector('webmapx-geoprocessing-tool');
    const change = [...tool.shadowRoot.querySelectorAll('.chosen sl-button')]
      .find(b => b.textContent.trim() === 'Change');
    if (!change) throw new Error('"Change" button not found');
    change.click();
  });
}

async function clickCalculate(page) {
  await page.evaluate(() => {
    const tool = document.querySelector('webmapx-geoprocessing-tool');
    const btn = tool.shadowRoot.querySelector('.actions sl-button[variant="primary"]');
    if (!btn) throw new Error('Calculate button not found');
    btn.click();
  });
}

async function toolMessage(page) {
  return page.evaluate(() => {
    const root = document.querySelector('webmapx-geoprocessing-tool')?.shadowRoot;
    const alert = root?.querySelector('sl-alert');
    return alert ? alert.textContent.trim() : null;
  });
}

async function outputLayerIds(page) {
  return page.evaluate(async () => {
    const map = document.querySelector('webmapx-map');
    const adapter = await map.getAdapterAsync();
    const layers = adapter.store.getState().mapLayers ?? {};
    return Object.keys(layers).filter(id => id.startsWith('webmapx-geoprocessing-out:'));
  });
}

/** Waits for a new output layer. GDAL WASM loads on the first run, so allow time. */
async function waitForOutputLayer(page, previousCount) {
  return pollFor(page, 'a new geoprocessing output layer', async () => {
    const message = await toolMessage(page);
    if (message) fail(`Tool reported: ${message}`);
    const ids = await outputLayerIds(page);
    return ids.length > previousCount ? ids : null;
  }, { timeout: 120_000 });
}

async function outputFeatures(page, layerId) {
  // The layer is registered in the store before its source has rendered, and
  // queryLayerFeatures reads rendered features — poll rather than race.
  await pollFor(page, `features in ${layerId}`, () => page.evaluate(async (id) => {
    const map = document.querySelector('webmapx-map');
    const adapter = await map?.getAdapterAsync?.();
    if (!adapter) return false;
    const fc = await adapter.queryLayerFeatures(id);
    return fc.features.length > 0;
  }, layerId), { timeout: 20_000 });

  return page.evaluate(async (id) => {
    const map = document.querySelector('webmapx-map');
    const adapter = await map.getAdapterAsync();
    const fc = await adapter.queryLayerFeatures(id);
    return {
      count: fc.features.length,
      geometryTypes: [...new Set(fc.features.map(f => f.geometry?.type))],
      properties: fc.features[0]?.properties ?? {},
      firstCoordinates: fc.features[0]?.geometry?.coordinates ?? null,
    };
  }, layerId);
}

export async function run({ page, engine, baseUrl }) {
  console.log(`  Running geoprocessing tool test for engine: ${engine}`);

  const step = async (label, fn) => {
    try {
      return await fn();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const reported = await toolMessage(page).catch(() => null);
      throw new Error(`${label}: ${message}${reported ? ` — tool said: ${reported}` : ''}`, { cause: error });
    }
  };

  await step('load default page', async () => {
    await page.goto(appUrl(baseUrl), { waitUntil: 'domcontentloaded' });
    await waitForMapReady(page);
  });

  await step('drop config with the analysis tool on the toolbar', () => stageGeoprocessingConfig(page, baseUrl));
  await step('add two overlapping test layers', () => addTestLayers(page));
  await step('activate analysis tool (lazily-loaded custom element)', () => activateTool(page));
  await step('label point diagram places its dots inside the polygons', () => checkLabelPointDiagram(page));
  await step('no viewport warning for GeoJSON-backed inputs', () => checkNoViewportWarning(page));

  // ─── Two-input operation ────────────────────────────────────────────────
  await step('choose Clip', () => chooseOperation(page, 'Clip'));
  await step('select input layers', () => selectInputLayers(page, ['gp-test-a', 'gp-test-b']));
  await step('run clip', () => clickCalculate(page));

  const afterClip = await step('wait for clip output', () => waitForOutputLayer(page, 0));
  const clipResult = await outputFeatures(page, afterClip[0]);

  const summary = await page.evaluate(() => {
    const root = document.querySelector('webmapx-geoprocessing-tool')?.shadowRoot;
    return root?.querySelector('.summary')?.textContent?.trim() ?? null;
  });
  if (!summary || !summary.includes('1 feature from')) {
    fail(`Expected a run summary reporting the input counts, got: ${summary}`);
  }
  console.log('    summary:', summary);

  if (clipResult.count !== 1) fail(`Clip should produce 1 feature, got ${clipResult.count}`);
  if (clipResult.properties.name !== 'alpha') {
    fail(`Clip must keep the input layer's attributes, got ${JSON.stringify(clipResult.properties)}`);
  }
  if ('zone' in clipResult.properties) {
    fail('Clip must not copy attributes from the clip layer');
  }
  console.log('    Clip produced', clipResult.count, 'feature with attributes', JSON.stringify(clipResult.properties));

  // ─── One-input operation, fed by the previous result ─────────────────────
  await step('choose Centroid', async () => {
    await clickChange(page);
    await chooseOperation(page, 'Centroid');
  });

  await step('select the clip result as input', () => selectInputLayers(page, [afterClip[0]]));
  await step('run centroid', () => clickCalculate(page));

  const afterCentroid = await step('wait for centroid output', () => waitForOutputLayer(page, afterClip.length));
  const centroidLayerId = afterCentroid.find(id => !afterClip.includes(id));
  const centroidResult = await outputFeatures(page, centroidLayerId);

  if (centroidResult.count !== 1) fail(`Centroid should produce 1 feature, got ${centroidResult.count}`);
  if (!centroidResult.geometryTypes.includes('Point')) {
    fail(`Centroid should produce a Point, got ${centroidResult.geometryTypes.join(', ')}`);
  }
  console.log('    Centroid produced', centroidResult.count, centroidResult.geometryTypes.join(', '));

  // ─── JS-computed operation (polylabel), not SQL ──────────────────────────
  await step('choose Label point', async () => {
    await clickChange(page);
    await chooseOperation(page, 'Label point');
  });

  await step('select the first test layer', () => selectInputLayers(page, ['gp-test-a']));
  await step('run label point', () => clickCalculate(page));

  const afterLabel = await step('wait for label point output', () => waitForOutputLayer(page, afterCentroid.length));
  const labelLayerId = afterLabel.find(id => !afterCentroid.includes(id));
  const labelResult = await outputFeatures(page, labelLayerId);

  if (labelResult.count !== 1) fail(`Label point should produce 1 feature, got ${labelResult.count}`);
  if (!labelResult.geometryTypes.includes('Point')) {
    fail(`Label point should produce a Point, got ${labelResult.geometryTypes.join(', ')}`);
  }

  // The JS branch writes its result as plain GeoJSON in EPSG:3857 metres and
  // relies on an explicit -s_srs to bring it back to lon/lat. Get that wrong and
  // the point lands near 0,0 — which is why the fixtures sit at ORIGIN instead.
  const [lon, lat] = labelResult.firstCoordinates ?? [];
  if (Math.abs(lon - ORIGIN[0]) > 1 || Math.abs(lat - ORIGIN[1]) > 1) {
    fail(`Label point landed at ${lon},${lat}, far from the input at ${ORIGIN} — reprojection is wrong`);
  }
  console.log('    Label point produced a Point at', lon.toFixed(3), lat.toFixed(3));

  const message = await toolMessage(page);
  if (message) fail(`Tool reported a problem after a successful run: ${message}`);

  // ─── A parameter that only applies to one choice of another ──────────────
  await step('the gap width only appears when gaps are removed by width', () => checkConditionalParam(page));

  // ─── A table operation, with aggregation rows ────────────────────────────
  await step('statistics shows a table instead of adding a layer', () => checkStatistics(page));

  // ─── Cancelling a long calculation ───────────────────────────────────────
  await step('a running calculation can be cancelled', () => checkCancel(page));
}

/**
 * A `showWhen` parameter is absent, not disabled, so the check is that the
 * element does not exist — and that choosing the value it belongs to brings it
 * back within one render, without a page reload.
 */
async function checkConditionalParam(page) {
  await clickChange(page);
  await chooseOperation(page, 'Dissolve');

  const widthShown = () => page.evaluate(() => {
    const root = document.querySelector('webmapx-geoprocessing-tool')?.shadowRoot;
    return [...(root?.querySelectorAll('sl-input') ?? [])]
      .some(el => (el.getAttribute('label') ?? '').startsWith('Gaps narrower than'));
  });

  if (await widthShown()) fail('The gap width must be hidden while gaps are removed relatively');

  await page.evaluate(() => {
    const root = document.querySelector('webmapx-geoprocessing-tool')?.shadowRoot;
    const select = [...(root?.querySelectorAll('sl-select') ?? [])]
      .find(el => (el.getAttribute('label') ?? '') === 'Small gaps');
    if (!select) throw new Error('No "Small gaps" select on the dissolve panel');
    select.value = 'size';
    select.dispatchEvent(new CustomEvent('sl-change', { bubbles: true, composed: true }));
  });

  await pollFor(page, 'gap width input appears', widthShown);
  console.log('    Gap width appears only for "remove up to a given width"');
}

/**
 * Statistics is the only operation whose result is not a map layer, so it
 * exercises two things nothing else does: the repeatable field+function rows,
 * and a result that must stay in the panel rather than becoming a layer.
 */
async function checkStatistics(page) {
  const layersBefore = (await outputLayerIds(page)).length;

  await clickChange(page);
  await chooseOperation(page, 'Statistics');
  await selectInputLayers(page, ['gp-test-a']);

  // The attribute list is read from the layer's features asynchronously, and the
  // button stays disabled until it arrives — clicking before that silently does
  // nothing, which reads as "the row never appeared".
  await pollFor(page, '"Add attribute" to become enabled', () => page.evaluate(() => {
    const root = document.querySelector('webmapx-geoprocessing-tool').shadowRoot;
    const add = [...root.querySelectorAll('sl-button')].find(b => b.textContent.trim() === 'Add attribute');
    return Boolean(add && !add.disabled);
  }), { timeout: 10_000, interval: 50 });

  // Add one aggregation row, then point it at the numeric attribute.
  await page.evaluate(() => {
    const root = document.querySelector('webmapx-geoprocessing-tool').shadowRoot;
    const add = [...root.querySelectorAll('sl-button')].find(b => b.textContent.trim() === 'Add attribute');
    if (!add) throw new Error('"Add attribute" button not found');
    add.click();
  });

  await pollFor(page, 'the aggregation row to appear', () => page.evaluate(() => {
    const root = document.querySelector('webmapx-geoprocessing-tool').shadowRoot;
    return root.querySelectorAll('.agg-row').length > 0;
  }), { timeout: 5_000, interval: 50 });

  await page.evaluate(() => {
    const root = document.querySelector('webmapx-geoprocessing-tool').shadowRoot;
    const row = root.querySelector('.agg-row');
    const [field, fn] = row.querySelectorAll('sl-select');
    field.value = 'pop';
    field.dispatchEvent(new CustomEvent('sl-change', { bubbles: true, composed: true }));
    fn.value = 'sum';
    fn.dispatchEvent(new CustomEvent('sl-change', { bubbles: true, composed: true }));
  });

  await clickCalculate(page);

  const table = await pollFor(page, 'the statistics table', async () => {
    const message = await toolMessage(page);
    if (message) fail(`Tool reported: ${message}`);
    return page.evaluate(() => {
      const root = document.querySelector('webmapx-geoprocessing-tool').shadowRoot;
      const el = root.querySelector('.table-wrap table');
      if (!el) return null;
      return {
        headers: [...el.querySelectorAll('th')].map(th => th.textContent.trim()),
        firstRow: [...el.querySelectorAll('tbody tr:first-child td')].map(td => td.textContent.trim()),
      };
    });
  }, { timeout: 60_000 });

  if (!table.headers.includes('feature_count')) fail(`Expected a feature_count column, got ${table.headers}`);
  if (!table.headers.includes('pop_total')) fail(`Expected the summed column, got ${table.headers}`);
  if (!table.firstRow.includes('42')) fail(`Expected the summed value 42 in the row, got ${table.firstRow}`);

  const layersAfter = (await outputLayerIds(page)).length;
  if (layersAfter !== layersBefore) fail('Statistics must not add a layer to the map');
  console.log('    statistics table:', table.headers.join(' | '), '→', table.firstRow.join(' | '));
}

/**
 * A calculation that cannot be stopped is a frozen panel: GDAL runs one
 * synchronous WASM call, so the only escape is terminating the worker. This
 * drives the whole path — Cancel appears while busy, the promise rejects as a
 * cancellation rather than an error, and the tool returns to an idle state that
 * still works afterwards (the worker is recreated on the next run).
 */
async function checkCancel(page) {
  await page.evaluate(async () => {
    const map = document.querySelector('webmapx-map');
    // Enough features that the run is still in flight a moment later.
    const features = [];
    for (let i = 0; i < 60; i++) {
      for (let j = 0; j < 60; j++) {
        const x = 30 + i * 0.05;
        const y = 40 + j * 0.05;
        features.push({
          type: 'Feature',
          properties: { id: `${i}-${j}` },
          geometry: { type: 'Polygon', coordinates: [[[x, y], [x + 0.04, y], [x + 0.04, y + 0.04], [x, y + 0.04], [x, y]]] },
        });
      }
    }
    await map.addLayerRequest({
      id: 'gp-test-big',
      type: 'fill',
      source: 'gp-test-big-src',
      sources: { 'gp-test-big-src': { id: 'gp-test-big-src', type: 'geojson', data: { type: 'FeatureCollection', features } } },
      paint: { 'fill-color': '#888888', 'fill-opacity': 0.2 },
      metadata: { label: 'GP test big', dynamic: true },
    });
  });

  await clickChange(page);
  await chooseOperation(page, 'Intersect');
  await selectInputLayers(page, ['gp-test-big', 'gp-test-a']);
  await clickCalculate(page);

  const busy = await pollFor(page, 'the Cancel button to appear', () => page.evaluate(() => {
    const root = document.querySelector('webmapx-geoprocessing-tool')?.shadowRoot;
    const cancel = [...(root?.querySelectorAll('.actions sl-button') ?? [])]
      .find(b => b.textContent.trim() === 'Cancel');
    return cancel ? true : null;
  }), { timeout: 10_000, interval: 50 });
  if (!busy) fail('No Cancel button appeared while calculating');

  await page.evaluate(() => {
    const root = document.querySelector('webmapx-geoprocessing-tool').shadowRoot;
    [...root.querySelectorAll('.actions sl-button')].find(b => b.textContent.trim() === 'Cancel').click();
  });

  const state = await pollFor(page, 'the tool to return to idle', () => page.evaluate(() => {
    const tool = document.querySelector('webmapx-geoprocessing-tool');
    if (tool.busy) return null;
    const root = tool.shadowRoot;
    return {
      alert: root.querySelector('sl-alert')?.textContent?.trim() ?? '',
      variant: root.querySelector('sl-alert')?.getAttribute('variant') ?? '',
      hasCalculate: [...root.querySelectorAll('.actions sl-button')].some(b => b.textContent.trim() === 'Calculate'),
    };
  }), { timeout: 20_000, interval: 100 });

  if (!/cancelled/i.test(state.alert)) fail(`Expected a cancellation notice, got: ${state.alert}`);
  if (state.variant === 'danger') fail('Cancelling must not be reported as an error');
  if (!state.hasCalculate) fail('Calculate button did not come back after cancelling');
  console.log('    cancelled cleanly:', state.alert);

  // Cancelling terminated the worker, so this also proves it gets recreated —
  // otherwise the tool would be permanently broken after one cancellation.
  const before = (await outputLayerIds(page)).length;
  await clickChange(page);
  await chooseOperation(page, 'Centroid');
  await selectInputLayers(page, ['gp-test-a']);
  await clickCalculate(page);
  await waitForOutputLayer(page, before);
  console.log('    tool still works after cancelling');
}

export const engines = ['maplibre'];
