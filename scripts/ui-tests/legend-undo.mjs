// Removing a layer in the legend leaves an "Undo" row for a few seconds.
//
// - Undo brings the layer back where it was.
// - A layer that is back on the map some other way — re-added from the
//   catalog — has nothing left to undo: its row goes, and no second copy of
//   the layer can be added through it.
// - Rows hang below their old neighbour. Removing A, re-adding A and then
//   removing B made the two rows each other's neighbour, and the legend
//   recursed until the stack overflowed. That order is tested as a user
//   would do it, and two rows naming each other are also injected directly.

import { appUrl } from './lib/fixture-config.mjs';
import { DEEP_QUERY_SOURCE } from './lib/deep-query.mjs';

const QUAKES = JSON.stringify({
  type: 'FeatureCollection',
  features: [[5, 52], [10, 48]].map((c) => ({ type: 'Feature', properties: { mag: 1 }, geometry: { type: 'Point', coordinates: c } })),
});

const HELPERS = `
window.__undo = {
  async waitFor(fn, ms, label) {
    const started = Date.now();
    while (Date.now() - started < ms) {
      const value = await fn();
      if (value) return value;
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
    throw new Error('Timed out waiting for ' + label);
  },
  sleep(ms) { return new Promise((resolve) => setTimeout(resolve, ms)); },
  map() { return document.querySelector('webmapx-map'); },
  legend() { return document.querySelector('webmapx-layer-overview'); },
  adapter() { return this.map().getAdapterAsync(); },
  order(adapter) { return Object.keys(adapter.store.getState().mapLayers); },
  row(id) { return this.legend().shadowRoot.querySelector('.layer-card[data-layer-id="' + id + '"]'); },
  undoRow(id) { return this.legend().shadowRoot.querySelector('.undo-row[data-layer-id="' + id + '"]'); },
  remove(id) { this.row(id).querySelector('.delete-layer').click(); },
  /** Layers the engine itself holds — a second copy would show up here, not in the store. */
  engineLayerCount(adapter) {
    const m = adapter.core?.mapInstance ?? adapter.core?.viewer;
    if (typeof m?.getStyle === 'function') return m.getStyle().layers.length;
    if (typeof m?.getLayers === 'function') {
      const count = (c) => c.getArray().reduce((n, l) => n + (typeof l.getLayers === 'function' ? count(l.getLayers()) : 1), 0);
      return count(m.getLayers());
    }
    if (typeof m?.eachLayer === 'function') { let n = 0; m.eachLayer(() => { n += 1; }); return n; }
    if (m?.scene) return m.dataSources.length + m.imageryLayers.length + m.scene.primitives.length;
    return null;
  },
};
`;

async function openLegend(page, baseUrl) {
  await page.goto(appUrl(baseUrl), { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(async () => (await document.querySelector('webmapx-map')?.getAdapterAsync?.())?.store.getState().mapLoaded, undefined, { timeout: 45_000 });
  await page.evaluate(DEEP_QUERY_SOURCE);
  await page.evaluate(HELPERS);
  await page.evaluate(async () => {
    window.__wmxDeepQuery('sl-button[name="layerOverview"]').click();
    await window.__undo.waitFor(() => window.__undo.legend()?.shadowRoot, 10_000, 'legend');
  });
}

async function checkUndoRestores(page) {
  const result = await page.evaluate(async () => {
    const u = window.__undo;
    const adapter = await u.adapter();
    await u.map().addLayerRequest({ layerId: 'world-countries' });
    await u.map().addLayerRequest({ layerId: 'earthquake' });
    await u.waitFor(() => u.row('world-countries') && u.row('earthquake'), 10_000, 'legend rows');
    const before = u.order(adapter);
    u.remove('world-countries');
    const undo = await u.waitFor(() => u.undoRow('world-countries')?.querySelector('sl-button'), 5000, 'undo row');
    const removed = !adapter.store.getState().mapLayers['world-countries'];
    undo.click();
    await u.waitFor(() => u.row('world-countries'), 10_000, 'layer back in the legend');
    return { removed, before, after: u.order(adapter), rowGone: !u.undoRow('world-countries') };
  });
  const problems = [];
  if (!result.removed) problems.push('Remove did not take the layer off the map');
  if (result.after.join() !== result.before.join()) problems.push(`Undo put the layer back elsewhere: ${result.before} became ${result.after}`);
  if (!result.rowGone) problems.push('the undo row stayed after Undo');
  return problems;
}

async function checkReaddedLayer(page) {
  const result = await page.evaluate(async () => {
    const u = window.__undo;
    const adapter = await u.adapter();
    await u.map().addLayerRequest({ layerId: 'earthquake' });
    await u.waitFor(() => u.row('earthquake'), 10_000, 'legend row');
    u.remove('earthquake');
    await u.waitFor(() => u.undoRow('earthquake'), 5000, 'undo row');
    await u.map().addLayerRequest({ layerId: 'earthquake' });   // back through the catalog
    await u.waitFor(() => u.row('earthquake'), 10_000, 'layer re-added');
    await u.sleep(300);
    const engineBefore = u.engineLayerCount(adapter);
    const offered = Boolean(u.undoRow('earthquake'));
    // Undo straight through the handler as well, in case a row were still somewhere.
    const entry = u.legend().pendingUndos.find((e) => e.layerId === 'earthquake');
    if (entry) await u.legend().handleUndoDeleteLayer(entry.id);
    await u.sleep(500);
    return { offered, engineBefore, engineAfter: u.engineLayerCount(adapter), legendRows: u.legend().shadowRoot.querySelectorAll('.layer-card[data-layer-id="earthquake"]').length };
  });
  const problems = [];
  if (result.offered) problems.push('Undo is still offered for a layer that is back on the map');
  if (result.engineAfter !== result.engineBefore) problems.push(`Undo of a re-added layer changed the engine's layer count from ${result.engineBefore} to ${result.engineAfter}`);
  if (result.legendRows !== 1) problems.push(`the re-added layer has ${result.legendRows} legend rows`);
  return problems;
}

async function checkRowsNamingEachOther(page, errors) {
  const result = await page.evaluate(async () => {
    const u = window.__undo;
    const legend = u.legend();
    await u.map().addLayerRequest({ layerId: 'world-countries' });
    await u.map().addLayerRequest({ layerId: 'earthquake' });
    await u.waitFor(() => u.row('world-countries') && u.row('earthquake'), 10_000, 'legend rows');
    // As a user would: remove the lower one, add it back (now on top), remove the other.
    u.remove('world-countries');
    await u.map().addLayerRequest({ layerId: 'world-countries' });
    await u.waitFor(() => u.row('world-countries'), 10_000, 're-added');
    u.remove('earthquake');
    await u.sleep(300);
    const userOrder = { listRenders: Boolean(legend.shadowRoot.querySelector('.layer-list')), undoRows: legend.shadowRoot.querySelectorAll('.undo-row').length };

    // Injected: two queued rows that each name the other as their neighbour.
    const template = legend.pendingUndos[0];
    legend.pendingUndos = [
      { ...template, id: 9001, layerId: 'loop-a', label: 'Loop A', beforeLayerId: 'loop-b', timeoutId: 0 },
      { ...template, id: 9002, layerId: 'loop-b', label: 'Loop B', beforeLayerId: 'loop-a', timeoutId: 0 },
    ];
    await legend.updateComplete;
    const injected = { rows: [...legend.shadowRoot.querySelectorAll('.undo-row')].map((r) => r.dataset.layerId) };
    legend.pendingUndos = [];
    return { userOrder, injected };
  });
  const problems = [];
  if (errors.length) problems.push(`the legend threw: ${errors.join(' | ')}`);
  if (!result.userOrder.listRenders) problems.push('the legend stopped rendering after remove, re-add, remove');
  if (result.userOrder.undoRows !== 1) problems.push(`expected one undo row after remove, re-add, remove, got ${result.userOrder.undoRows}`);
  if (result.injected.rows.sort().join() !== 'loop-a,loop-b') problems.push(`two rows naming each other rendered as [${result.injected.rows}]`);
  return problems;
}

export async function run({ page, baseUrl }) {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.route('**/earthquake.usgs.gov/**', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: QUAKES }));

  await openLegend(page, baseUrl);
  const problems = await checkUndoRestores(page);
  await openLegend(page, baseUrl);
  problems.push(...await checkReaddedLayer(page));
  await openLegend(page, baseUrl);
  problems.push(...await checkRowsNamingEachOther(page, errors));
  if (problems.length) throw new Error(problems.join('\n'));
}
