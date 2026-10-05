// Undo history in the draw tool must hold real changes, and give them back as
// they were:
//
// - Undoing a finished dashed line reopens it as a dashed draft, so finishing
//   it again gives the dashed line back rather than a solid one.
// - Pressing and releasing a vertex handle without moving it (Edit points) is
//   selecting that vertex, not editing: no undo step, no new update time.

import { appUrl } from './lib/fixture-config.mjs';
import { DEEP_QUERY_SOURCE } from './lib/deep-query.mjs';

const HELPERS = `
window.__hist = {
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
  tool() { return window.__wmxDeepQuery('webmapx-draw-tool'); },
  adapter() { return document.querySelector('webmapx-map').getAdapterAsync(); },
  async emit(type, coords) {
    const adapter = await this.adapter();
    adapter.events.emit({ type, coords, pixel: adapter.project(coords), resolution: null, button: 0 });
  },
  async newLayer(type) {
    const tool = this.tool();
    tool.shadowRoot.querySelector('.type-card[data-type="' + type + '"]').click();
    (await this.waitFor(() => tool.shadowRoot.querySelector('.add-layer-btn'), 5000, 'New layer button')).click();
    return this.waitFor(() => tool.panelView === 'editing' && tool.activeLayerIds[type], 10000, type + ' session');
  },
  button(name) { return this.tool().shadowRoot.querySelector('button[name="' + name + '"]'); },
  undoButton() {
    return this.tool().shadowRoot.querySelector('sl-icon-button[name="arrow-counterclockwise"]:not([disabled])');
  },
};
`;

async function openDrawTool(page, baseUrl) {
  await page.goto(appUrl(baseUrl), { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(async () => (await document.querySelector('webmapx-map')?.getAdapterAsync?.())?.store.getState().mapLoaded, undefined, { timeout: 45_000 });
  await page.waitForFunction(() => document.querySelector('webmapx-toolbar sl-button[name="draw"]') && customElements.get('webmapx-draw-tool'), undefined, { timeout: 15_000 });
  await page.evaluate(DEEP_QUERY_SOURCE);
  await page.evaluate(HELPERS);
  await page.evaluate(() => document.querySelector('webmapx-toolbar sl-button[name="draw"]').click());
  await page.evaluate(() => window.__hist.waitFor(() => window.__hist.tool()?.shadowRoot?.querySelector('.type-card'), 10_000, 'draw panel'));
}

async function checkDashedLineUndo(page) {
  const result = await page.evaluate(async () => {
    const h = window.__hist;
    const tool = h.tool();
    const [cx, cy] = (await h.adapter()).getViewportState().center;
    await h.newLayer('LineString');
    h.button('dash-line').click();
    const line = [[cx - 8, cy - 4], [cx, cy + 5], [cx + 7, cy - 2]];
    for (const c of line) await h.emit('click', c);
    await h.emit('contextmenu', line[line.length - 1]);
    await h.waitFor(() => tool.features.length === 1, 5000, 'dashed line drawn');
    const drawnDashed = tool.features[0].dashed === true;

    (await h.waitFor(() => h.undoButton(), 5000, 'Undo enabled')).click();
    await tool.updateComplete;
    const modeAfterUndo = tool.mode;
    const dashedPressedAfterUndo = h.button('dash-line')?.getAttribute('aria-pressed');

    await h.emit('contextmenu', line[line.length - 1]);
    await h.waitFor(() => tool.features.length === 1, 5000, 'line finished again');
    return { drawnDashed, modeAfterUndo, dashedPressedAfterUndo, finishedAgainDashed: tool.features[0].dashed === true };
  });

  const problems = [];
  if (!result.drawnDashed) problems.push('the dashed line tool drew a solid line');
  if (result.modeAfterUndo !== 'draw-line-dashed') problems.push(`undoing a dashed line reopened it in ${result.modeAfterUndo}`);
  if (result.dashedPressedAfterUndo !== 'true') problems.push('after undoing a dashed line, the dashed tool is not shown as pressed');
  if (!result.finishedAgainDashed) problems.push('finishing an undone dashed line again gave a solid line');
  return problems;
}

async function checkVertexClickWithoutMove(page) {
  const result = await page.evaluate(async () => {
    const h = window.__hist;
    const tool = h.tool();
    const [cx, cy] = (await h.adapter()).getViewportState().center;
    const layerId = await h.newLayer('Polygon');
    const corner = [cx - 8, cy - 4];
    for (const c of [corner, [cx + 8, cy - 4], [cx + 1, cy + 7]]) await h.emit('click', c);
    await h.emit('contextmenu', [cx + 1, cy + 7]);
    await h.waitFor(() => tool.features.length === 1, 5000, 'polygon drawn');
    // Give the layer an update-time attribute, the one property a mere click must not touch.
    tool.drawLayers = tool.drawLayers.map((l) => (l.id === layerId ? { ...l, properties: [...l.properties, { name: 'updated', type: 'update-time' }] } : l));
    await tool.updateComplete;

    h.button('edit-vertices').click();
    await h.emit('pointer-down', [cx, cy]);      // pins the polygon
    await h.emit('pointer-up', [cx, cy]);
    await h.waitFor(() => tool.selectedFeatureId === tool.features[0].id, 5000, 'polygon pinned');
    const historyBefore = tool.moveHistory.length;
    const propertiesBefore = JSON.stringify(tool.features[0].properties);

    await h.emit('pointer-down', corner);        // on a vertex handle
    const grabbed = Boolean(tool.dragging);
    await h.emit('pointer-up', corner);          // released where it was pressed
    await h.sleep(100);
    const click = {
      historyAdded: tool.moveHistory.length - historyBefore,
      propertiesChanged: JSON.stringify(tool.features[0].properties) !== propertiesBefore,
    };

    // A real drag is still an edit. Moves are paced: one is handled per frame.
    await h.emit('pointer-down', corner);
    await h.sleep(60);
    await h.emit('pointer-move', [corner[0] - 2, corner[1] - 2]);
    await h.sleep(60);
    await h.emit('pointer-up', [corner[0] - 2, corner[1] - 2]);
    await h.sleep(100);
    return {
      grabbed,
      vertexSelected: Boolean(tool.selectedHandle),
      click,
      dragHistoryAdded: tool.moveHistory.length - historyBefore,
      dragSetUpdateTime: typeof tool.features[0].properties.updated === 'number',
    };
  });

  const problems = [];
  if (!result.grabbed) problems.push('pressing on a vertex in Edit points did not grab its handle');
  if (!result.vertexSelected) problems.push('clicking a vertex in Edit points did not select it');
  if (result.click.historyAdded) problems.push(`clicking a vertex without moving it added ${result.click.historyAdded} undo step(s)`);
  if (result.click.propertiesChanged) problems.push('clicking a vertex without moving it changed the feature\'s properties (update time)');
  if (result.dragHistoryAdded !== 1) problems.push(`dragging a vertex added ${result.dragHistoryAdded} undo steps, expected 1`);
  if (!result.dragSetUpdateTime) problems.push('dragging a vertex did not set the update time');
  return problems;
}

export async function run({ page, baseUrl }) {
  await openDrawTool(page, baseUrl);
  const problems = await checkDashedLineUndo(page);
  await openDrawTool(page, baseUrl);
  problems.push(...await checkVertexClickWithoutMove(page));
  if (problems.length) throw new Error(problems.join('\n'));
}
