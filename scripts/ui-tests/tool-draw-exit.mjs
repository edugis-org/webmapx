// Leaving the draw tool at an awkward moment must leave the map as closing it
// normally does: every layer back with its features, none of the tool's own
// layers left behind, no window listeners still attached.
//
// - Closing the panel while a catalog copy is still loading its data. Today's
//   engines hand the draw tool features that are already loaded, so the wait
//   is a microtask; the code also fetches a URL, and that wait is real. The
//   test makes the source answer with its URL and holds the fetch open.
// - Closing the tool before the map has finished loading. The test marks the
//   map as still loading, opens and closes the tool, then lets it finish.
// - Taking an open tool off the page: the toolbar's own tool (closed through
//   the ToolManager) and one outside the ToolManager, as in a toolbox.

import { appUrl } from './lib/fixture-config.mjs';
import { DEEP_QUERY_SOURCE } from './lib/deep-query.mjs';

const QUAKES_URL = '**/earthquake.usgs.gov/**';
const QUAKES = JSON.stringify({
  type: 'FeatureCollection',
  features: [[5, 52], [10, 48], [-3, 40]].map((c, i) => ({ type: 'Feature', properties: { mag: i + 1 }, geometry: { type: 'Point', coordinates: c } })),
});

/** Keeps track of which window listeners are attached, by handler. */
const LISTENER_TRACKER = `
(() => {
  const live = new Set();
  const add = window.addEventListener.bind(window);
  const remove = window.removeEventListener.bind(window);
  window.addEventListener = (type, fn, opts) => { live.add(fn); return add(type, fn, opts); };
  window.removeEventListener = (type, fn, opts) => { live.delete(fn); return remove(type, fn, opts); };
  window.__windowListeners = live;
})();
`;

const HELPERS = `
window.__exit = {
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
  tool() { return window.__wmxDeepQuery('webmapx-draw-tool'); },
  adapter() { return this.map().getAdapterAsync(); },
  toggleDraw() { document.querySelector('webmapx-toolbar sl-button[name="draw"]').click(); },
  async emit(type, coords) {
    const adapter = await this.adapter();
    adapter.events.emit({ type, coords, pixel: adapter.project(coords), resolution: null, button: 0 });
  },
  /** A legend layer's own state: being edited, and how many features its source holds. */
  async layerState(predicate) {
    const adapter = await this.adapter();
    const [id, entry] = Object.entries(adapter.store.getState().mapLayers).find(([key, e]) => predicate(key, e)) ?? [];
    if (!id) return null;
    const data = entry.sourceId ? adapter.getSourceData(entry.sourceId) : null;
    return { beingEdited: entry.borrowedByDrawTool === true, features: data && typeof data === 'object' ? data.features.length : null };
  },
  /** The draw tool's own helper layers (rubber band, handles, …) still on the map. */
  async helperLayers() {
    const adapter = await this.adapter();
    return Object.keys(adapter.store.getState().mapLayers).filter((id) => id.startsWith('webmapx-draw-')).length;
  },
  windowListenersOf(tool) {
    return [tool.onKeyDown, tool.onKeyUp, tool.onWindowBlur].filter((h) => window.__windowListeners.has(h)).length;
  },
};
`;

async function openPage(page, baseUrl) {
  await page.goto(appUrl(baseUrl), { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(async () => (await document.querySelector('webmapx-map')?.getAdapterAsync?.())?.store.getState().mapLoaded, undefined, { timeout: 45_000 });
  await page.waitForFunction(() => document.querySelector('webmapx-toolbar sl-button[name="draw"]') && customElements.get('webmapx-draw-tool'), undefined, { timeout: 15_000 });
  await page.evaluate(DEEP_QUERY_SOURCE);
  await page.evaluate(HELPERS);
}

async function closeWhileCopyLoads(page, baseUrl) {
  let release;
  const held = new Promise((resolve) => { release = resolve; });
  let requests = 0;
  // The layer's own load is answered at once; the draw tool's fetch waits.
  await page.route(QUAKES_URL, async (route) => {
    requests += 1;
    if (requests > 1) await held;
    await route.fulfill({ status: 200, contentType: 'application/json', body: QUAKES });
  });
  await openPage(page, baseUrl);
  await page.evaluate(async () => {
    const x = window.__exit;
    await x.map().addLayerRequest({ layerId: 'earthquake' });
    x.toggleDraw();
    const tool = await x.waitFor(() => x.tool()?.shadowRoot?.querySelector('.type-card') && x.tool(), 10_000, 'draw panel');
    tool.shadowRoot.querySelector('.type-card[data-type="Point"]').click();
    const option = await x.waitFor(() => tool.catalogLayerOptions.find((o) => o.layerId === 'earthquake'), 10_000, 'earthquakes offered for editing');
    const adapter = await x.adapter();
    const own = adapter.getSourceData.bind(adapter);
    adapter.getSourceData = (id) => (id === option.sourceId ? 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson' : own(id));
    tool.startEditingCatalogLayer(option);   // "Create a copy and edit"
    await x.sleep(100);
    x.toggleDraw();
    await x.waitFor(() => !tool.active, 5000, 'draw tool closed');
  });
  release();
  const copy = await page.evaluate(async () => {
    const x = window.__exit;
    await x.sleep(1000);
    return x.layerState((key, e) => typeof e.label === 'string' && e.label.startsWith('Copy of'));
  });
  await page.unroute(QUAKES_URL);

  if (!copy) return ['closing while a copy loaded: no copy on the map'];
  const problems = [];
  if (copy.beingEdited) problems.push('closing while a copy loaded: the copy is marked as being edited by a closed tool');
  if (copy.features !== 3) problems.push(`closing while a copy loaded: the copy holds ${copy.features} of 3 features`);
  return problems;
}

async function closeBeforeMapLoads(page, baseUrl) {
  await openPage(page, baseUrl);
  const left = await page.evaluate(async () => {
    const x = window.__exit;
    const adapter = await x.adapter();
    adapter.store.dispatch({ mapLoaded: false }, 'MAP');
    x.toggleDraw();
    const tool = await x.waitFor(() => x.tool()?.active && x.tool(), 10_000, 'draw tool open');
    x.toggleDraw();
    await x.waitFor(() => !tool.active, 5000, 'draw tool closed');
    adapter.store.dispatch({ mapLoaded: true }, 'MAP');
    await x.sleep(500);
    return x.helperLayers();
  });
  return left ? [`closing before the map loaded: ${left} of the draw tool's layers appeared once it did`] : [];
}

async function removeOpenToolbarTool(page, baseUrl) {
  await openPage(page, baseUrl);
  const result = await page.evaluate(async () => {
    const x = window.__exit;
    const adapter = await x.adapter();
    x.toggleDraw();
    const tool = await x.waitFor(() => x.tool()?.shadowRoot?.querySelector('.type-card') && x.tool(), 10_000, 'draw panel');
    tool.shadowRoot.querySelector('.type-card[data-type="Polygon"]').click();
    (await x.waitFor(() => tool.shadowRoot.querySelector('.add-layer-btn'), 5000, 'New layer button')).click();
    const layerId = await x.waitFor(() => tool.activeLayerIds.Polygon, 5000, 'editing session');
    await x.waitFor(() => adapter.store.getState().mapLayers[layerId + '-map'], 5000, 'legend layer');
    const [cx, cy] = adapter.getViewportState().center;
    for (const c of [[cx - 8, cy - 4], [cx + 8, cy - 4], [cx + 1, cy + 7]]) await x.emit('click', c);
    await x.emit('contextmenu', [cx + 1, cy + 7]);
    await x.waitFor(() => tool.features.length === 1, 5000, 'polygon drawn');
    tool.remove();
    await x.sleep(500);
    return {
      layer: await x.layerState((key) => key === layerId + '-map'),
      listeners: x.windowListenersOf(tool),
      helperLayers: await x.helperLayers(),
    };
  });
  const problems = [];
  if (result.layer?.beingEdited) problems.push('removing the open tool: its layer is still marked as being edited');
  if (result.layer?.features !== 1) problems.push(`removing the open tool: its layer holds ${result.layer?.features} of 1 feature`);
  if (result.listeners) problems.push(`removing the open tool: ${result.listeners} window listeners still attached`);
  if (result.helperLayers) problems.push(`removing the open tool: ${result.helperLayers} of its layers left on the map`);
  return problems;
}

async function removeOpenToolOutsideToolManager(page, baseUrl) {
  await openPage(page, baseUrl);
  const result = await page.evaluate(async () => {
    const x = window.__exit;
    const tool = document.createElement('webmapx-draw-tool');
    tool.registerWithToolManager = false;
    x.map().appendChild(tool);
    await x.waitFor(() => tool.adapter, 5000, 'draw tool attached');
    tool.active = true;
    await x.sleep(300);
    const whileOpen = x.windowListenersOf(tool);
    tool.remove();
    await x.sleep(300);
    return { whileOpen, listeners: x.windowListenersOf(tool), helperLayers: await x.helperLayers() };
  });
  const problems = [];
  if (!result.whileOpen) problems.push('a draw tool outside the ToolManager did not open');
  if (result.listeners) problems.push(`removing an open tool outside the ToolManager: ${result.listeners} window listeners still attached`);
  if (result.helperLayers) problems.push(`removing an open tool outside the ToolManager: ${result.helperLayers} of its layers left on the map`);
  return problems;
}

export async function run({ page, baseUrl }) {
  await page.addInitScript(LISTENER_TRACKER);
  const problems = [
    ...await closeWhileCopyLoads(page, baseUrl),
    ...await closeBeforeMapLoads(page, baseUrl),
    ...await removeOpenToolbarTool(page, baseUrl),
    ...await removeOpenToolOutsideToolManager(page, baseUrl),
  ];
  if (problems.length) throw new Error(problems.join('\n'));
}
