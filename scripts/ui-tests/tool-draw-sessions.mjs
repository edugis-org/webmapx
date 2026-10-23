// The draw tool keeps one editing session per geometry type, and the Legend
// can finish a session ("Done") from outside the draw panel. This checks the
// edges between those:
//
// - Click, rectangle and lasso select only from the session the panel shows.
//   Another type's session keeps its features on the map, but lassoing in a
//   Polygon session must not select (and the trash button then delete) points
//   from a Point session. The panel never shows two sessions, so the second
//   one is started directly on the component, the way the data model allows.
// - A layer being edited has no Remove button in the Legend: its features are
//   in the draw tool, not in the layer, so removing it would take them along.
//   "Done" comes first, and then Remove is offered.
// - "Done" reaches the draw tool from a Legend placed outside the map
//   (`map="#…"`), which is not inside the map element the request goes to.

import { appUrl } from './lib/fixture-config.mjs';
import { DEEP_QUERY_SOURCE } from './lib/deep-query.mjs';

const HELPERS = `
window.__draw = {
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
  legend() { return window.__wmxDeepQuery('webmapx-layer-overview'); },
  adapter() { return this.map().getAdapterAsync(); },
  async emit(type, coords) {
    const adapter = await this.adapter();
    adapter.events.emit({ type, coords, pixel: adapter.project(coords), resolution: null, button: 0 });
  },
  /** Starts a new layer of \`type\` from the layer list and names it. */
  async newLayer(type, name) {
    const tool = this.tool();
    tool.shadowRoot.querySelector('.type-card[data-type="' + type + '"]')?.click() ?? tool.selectType(type);
    (await this.waitFor(() => tool.shadowRoot.querySelector('.add-layer-btn'), 5000, 'New layer button')).click();
    const layerId = await this.waitFor(() => tool.panelView === 'editing' && tool.activeLayerIds[type], 10000, type + ' session');
    // The layer the Legend lists is added asynchronously; a person typing a
    // name is never faster than that, a test is.
    const adapter = await this.adapter();
    await this.waitFor(() => adapter.store.getState().mapLayers[layerId + '-map'], 10000, 'legend layer');
    const input = tool.shadowRoot.querySelector('.editing-layer-name');
    input.value = name;
    input.dispatchEvent(new Event('sl-input', { bubbles: true, composed: true }));
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, composed: true }));
    await this.waitFor(() => tool.drawLayers.find((l) => l.id === layerId)?.name === name, 5000, 'layer name');
    return layerId;
  },
  /** A triangle around [cx, cy], large enough to be drawn at the fixture's zoom. */
  async drawTriangle(cx, cy) {
    for (const c of [[cx - 8, cy - 4], [cx + 8, cy - 4], [cx + 1, cy + 7]]) await this.emit('click', c);
    await this.emit('contextmenu', [cx + 1, cy + 7]);
  },
  /** Drags a lasso of ±\`px\` pixels around \`centre\`. Moves are paced, since the
   *  tool handles at most one pointer move per animation frame. */
  async lasso(centre, px) {
    const adapter = await this.adapter();
    const p = adapter.project(centre);
    const ring = [[-px, -px], [px, -px], [px, px], [-px, px]].map(([dx, dy]) => adapter.unproject([p[0] + dx, p[1] + dy]));
    await this.emit('pointer-down', ring[0]);
    for (const c of ring.slice(1)) { await this.emit('pointer-move', c); await this.sleep(60); }
    await this.emit('pointer-up', ring[ring.length - 1]);
  },
  selectedTypes() {
    const tool = this.tool();
    const ids = tool.selectedFeatureId ? [tool.selectedFeatureId] : tool.selectedFeatureIds;
    return ids.map((id) => tool.features.find((f) => f.id === id)?.type);
  },
};
`;

async function openDrawTool(page, baseUrl) {
  await page.goto(appUrl(baseUrl), { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(async () => Boolean(await document.querySelector('webmapx-map')?.getAdapterAsync?.()), undefined, { timeout: 45_000 });
  await page.waitForFunction(() => document.querySelector('webmapx-toolbar sl-button[name="draw"]') && customElements.get('webmapx-draw-tool'), undefined, { timeout: 15_000 });
  await page.evaluate(DEEP_QUERY_SOURCE);
  await page.evaluate(HELPERS);
  await page.evaluate(() => document.querySelector('webmapx-toolbar sl-button[name="draw"]').click());
  await page.evaluate(() => window.__draw.waitFor(() => window.__draw.tool()?.shadowRoot?.querySelector('.type-card'), 10_000, 'draw panel'));
}

async function checkSelectionStaysInSession(page) {
  const result = await page.evaluate(async () => {
    const d = window.__draw;
    const tool = d.tool();
    const [cx, cy] = (await d.adapter()).getViewportState().center;

    await d.newLayer('Point', 'background points');
    await d.emit('click', [cx, cy]);
    await d.waitFor(() => tool.features.length === 1, 5000, 'point drawn');
    // A second session, of another type, without ending the first.
    tool.selectType('Polygon');
    await d.newLayer('Polygon', 'polygons');
    const polygonCentre = [cx + 30, cy];
    await d.drawTriangle(...polygonCentre);
    await d.waitFor(() => tool.features.length === 2, 5000, 'polygon drawn');
    const sessions = Object.keys(tool.activeLayerIds).sort();

    tool.shadowRoot.querySelector('button[name="lasso-select"]').click();
    await d.lasso([cx, cy], 40);
    const lassoAroundBackgroundPoint = d.selectedTypes();
    await d.lasso(polygonCentre, 60);
    const lassoAroundOwnPolygon = d.selectedTypes();

    tool.shadowRoot.querySelector('button[name="hand-index-thumb"]').click();
    await d.emit('click', [cx, cy]);
    const clickOnBackgroundPoint = d.selectedTypes();
    await d.emit('click', polygonCentre);
    const clickOnOwnPolygon = d.selectedTypes();

    return { sessions, lassoAroundBackgroundPoint, lassoAroundOwnPolygon, clickOnBackgroundPoint, clickOnOwnPolygon };
  });

  const problems = [];
  if (result.sessions.join() !== 'Point,Polygon') problems.push(`expected a Point and a Polygon session, got ${result.sessions}`);
  if (result.lassoAroundBackgroundPoint.length) problems.push(`lasso in the Polygon session selected ${result.lassoAroundBackgroundPoint} from the Point session`);
  if (result.lassoAroundOwnPolygon.join() !== 'Polygon') problems.push(`lasso around the session's own polygon selected [${result.lassoAroundOwnPolygon}]`);
  if (result.clickOnBackgroundPoint.length) problems.push(`click in the Polygon session selected ${result.clickOnBackgroundPoint} from the Point session`);
  if (result.clickOnOwnPolygon.join() !== 'Polygon') problems.push(`click on the session's own polygon selected [${result.clickOnOwnPolygon}]`);
  return problems;
}

async function checkLegendWhileEditing(page) {
  await page.evaluate(() => window.__wmxDeepQuery('sl-button[name="layerOverview"]').click());
  const result = await page.evaluate(async () => {
    const d = window.__draw;
    const tool = d.tool();
    const legend = await d.waitFor(() => d.legend()?.shadowRoot && d.legend(), 10_000, 'legend');
    // A supported layout: the Legend outside the map, bound by selector.
    const map = d.map();
    if (!map.id) map.id = 'draw-sessions-map';
    const outside = document.createElement('div');
    document.body.appendChild(outside);
    legend.setAttribute('map', '#' + map.id);
    outside.appendChild(legend);
    await d.waitFor(() => legend.adapter, 5000, 'legend bound to the map');

    const [cx, cy] = (await d.adapter()).getViewportState().center;
    const layerId = await d.newLayer('Polygon', 'edited polygons');
    await d.drawTriangle(cx, cy);
    const row = () => legend.shadowRoot.querySelector(`.layer-card[data-layer-id="${layerId}-map"]`);
    const done = await d.waitFor(() => row()?.querySelector('.layer-editing-notice sl-button'), 5000, 'Done in the legend row');
    const removeWhileEditing = Boolean(row().querySelector('.delete-layer'));

    done.click();
    await d.waitFor(() => tool.panelView === 'layers', 5000, 'session finished from the legend').catch(() => null);
    const removeAfterDone = Boolean(await d.waitFor(() => row()?.querySelector('.delete-layer'), 5000, 'Remove after Done').catch(() => null));
    return { legendOutsideMap: !map.contains(legend), removeWhileEditing, sessionAfterDone: tool.activeLayerIds.Polygon ?? null, removeAfterDone };
  });

  const problems = [];
  if (!result.legendOutsideMap) problems.push('the legend was not moved outside the map');
  if (result.removeWhileEditing) problems.push('the legend offers Remove on a layer that is being edited');
  if (result.sessionAfterDone) problems.push('"Done" in a legend outside the map did not finish the session');
  if (!result.removeAfterDone) problems.push('the legend does not offer Remove once editing is done');
  return problems;
}

export async function run({ page, baseUrl }) {
  await openDrawTool(page, baseUrl);
  const problems = await checkSelectionStaysInSession(page);
  await openDrawTool(page, baseUrl);
  problems.push(...await checkLegendWhileEditing(page));
  if (problems.length) throw new Error(problems.join('\n'));
}
