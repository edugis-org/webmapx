// Kiosk compare control: left of the seam the live map, right of it a mirror
// map with the top visible layer hidden, so the layer beneath shows through.
//
// - The mirror follows the live map: the top layer is the hidden one, opacity
//   and visibility changes arrive, and a new top layer retargets it.
// - Store changes that leave the layers alone — every pointer move is one —
//   cost the mirror nothing; a layer change touches only what differs.
// - A config layer removed in the legend stays gone on the mirror, though the
//   mirror is rebuilt from the config when the layer set changes.
// - A mirror still being built when the control is removed does not stay in
//   the page.

const CONFIG_PATH = '/testpages/fixtures/mega-compare.json';

const EXTRA = {
  id: 'extra-points',
  type: 'style',
  sources: { pts: { type: 'geojson', data: { type: 'FeatureCollection', features: [{ type: 'Feature', properties: {}, geometry: { type: 'Point', coordinates: [4.9, 52.37] } }] } } },
  layers: [{ id: 'extra-points-circles', type: 'circle', source: 'pts', paint: { 'circle-radius': 8, 'circle-color': '#d33' } }],
  metadata: { label: 'Extra points', legendRole: 'overlay' },
};

const HELPERS = `
window.__mc = {
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
  map() { return document.querySelector('webmapx-map:not([data-webmapx-role])'); },
  control() { return document.querySelector('webmapx-mega-compare'); },
  adapter() { return this.map().getAdapterAsync(); },
  mirror() { return this.control()?.mirror?.adapter ?? null; },
  mirrorCount() { return document.querySelectorAll('webmapx-map[data-webmapx-role="mega-compare-reference"]').length; },
  /** Visibility and transparency of each layer on the mirror. */
  mirrorState() {
    const layers = this.mirror()?.store.getState().mapLayers ?? {};
    return Object.fromEntries(Object.entries(layers).map(([id, e]) => [id, { visible: e.visible !== false, transparency: Math.round(e.transparency ?? 0) }]));
  },
  /** Counts the writes the control makes to the mirror's layers. */
  countWrites(adapter) {
    const counts = { total: 0 };
    for (const name of ['setLayerVisibility', 'setLayerOpacity', 'updateLayerStyle', 'moveLayer', 'removeLayer']) {
      const own = adapter[name].bind(adapter);
      adapter[name] = (...args) => { counts.total += 1; counts[name] = (counts[name] ?? 0) + 1; return own(...args); };
    }
    return counts;
  },
};
`;

async function open(page, baseUrl) {
  const url = new URL(baseUrl);
  url.searchParams.set('config', CONFIG_PATH);
  await page.goto(url.toString(), { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(async () => (await document.querySelector('webmapx-map')?.getAdapterAsync?.())?.store.getState().mapLoaded, undefined, { timeout: 45_000 });
  await page.evaluate(HELPERS);
  await page.evaluate(() => window.__mc.waitFor(() => window.__mc.mirror(), 20_000, 'mirror map'));
}

async function checkFollowsLiveMap(page) {
  const r = await page.evaluate(async (extra) => {
    const mc = window.__mc;
    const live = await mc.adapter();
    const settle = () => mc.sleep(400);
    const initial = mc.mirrorState();

    live.setLayerOpacity('streets', 0.6);
    await settle();
    const afterOpacity = mc.mirrorState();

    await mc.map().addLayerRequest(extra);
    await mc.waitFor(() => mc.mirror()?.store.getState().mapLayers['extra-points'], 15_000, 'extra layer on the mirror');
    await settle();
    const afterAdd = mc.mirrorState();

    live.setLayerVisibility('extra-points', false);
    await settle();
    const afterHide = mc.mirrorState();
    return { initial, afterOpacity, afterAdd, afterHide };
  }, EXTRA);

  const problems = [];
  const expect = (state, id, visible, label) => {
    if (state[id]?.visible !== visible) problems.push(`${label}: ${id} is ${state[id]?.visible ? 'shown' : 'hidden'} on the mirror`);
  };
  expect(r.initial, 'satellite', false, 'at start (top: satellite)');
  expect(r.initial, 'streets', true, 'at start (top: satellite)');
  if (r.afterOpacity.streets?.transparency !== 40) problems.push(`live transparency 40 reached the mirror as ${r.afterOpacity.streets?.transparency}`);
  expect(r.afterAdd, 'extra-points', false, 'after adding a layer (top: extra)');
  expect(r.afterAdd, 'satellite', true, 'after adding a layer (top: extra)');
  expect(r.afterHide, 'extra-points', false, 'after hiding the top layer (top: satellite)');
  expect(r.afterHide, 'satellite', false, 'after hiding the top layer (top: satellite)');
  expect(r.afterHide, 'streets', true, 'after hiding the top layer (top: satellite)');
  return problems;
}

async function checkPointerMovesCostNothing(page) {
  const r = await page.evaluate(async () => {
    const mc = window.__mc;
    const live = await mc.adapter();
    const writes = mc.countWrites(mc.mirror());
    for (let n = 0; n < 20; n += 1) {
      live.store.dispatch({ pointerCoordinates: [4.9 + n / 1000, 52.37], pointerResolution: null }, 'MAP');
    }
    await mc.sleep(300);
    const afterPointer = writes.total;
    live.setLayerOpacity('satellite', 0.5);
    await mc.sleep(300);
    return { afterPointer, afterOneOpacityChange: writes.total - afterPointer, detail: { ...writes } };
  });
  const problems = [];
  if (r.afterPointer) problems.push(`20 pointer moves made ${r.afterPointer} writes to the mirror's layers`);
  if (r.afterOneOpacityChange !== 1) problems.push(`one opacity change made ${r.afterOneOpacityChange} writes to the mirror's layers (${JSON.stringify(r.detail)})`);
  return problems;
}

async function checkRemovedConfigLayerStaysGone(page) {
  const r = await page.evaluate(async (extra) => {
    const mc = window.__mc;
    const live = await mc.adapter();
    await mc.map().addLayerRequest(extra);
    await mc.waitFor(() => mc.mirror()?.store.getState().mapLayers['extra-points'], 15_000, 'extra layer on the mirror');
    live.removeLayer('satellite');                 // what the legend's Remove does
    await mc.waitFor(() => mc.mirror() && !mc.control().rebuildInFlight && mc.mirror().store.getState().mapLayers['extra-points'], 15_000, 'mirror rebuilt');
    await mc.sleep(500);
    return { mirrorLayers: Object.keys(mc.mirror().store.getState().mapLayers) };
  }, EXTRA);
  return r.mirrorLayers.includes('satellite') ? [`a config layer removed from the map came back on the mirror: [${r.mirrorLayers}]`] : [];
}

async function checkRemovedMidRebuild(page) {
  const r = await page.evaluate(async (extra) => {
    const mc = window.__mc;
    const map = mc.map();
    // The rebuild inserts its new mirror before it waits for anything; the control is removed
    // at that moment, so the rest of the build finishes after it is gone.
    const removedMidRebuild = new Promise((resolve) => {
      const observer = new MutationObserver((records) => {
        if (!records.some((rec) => [...rec.addedNodes].some((n) => n.dataset?.webmapxRole === 'mega-compare-reference'))) return;
        observer.disconnect();
        mc.control().remove();
        resolve(true);
      });
      observer.observe(map, { childList: true });
    });
    void map.addLayerRequest(extra);
    const removed = await Promise.race([removedMidRebuild, mc.sleep(5000).then(() => false)]);
    await mc.sleep(3000);
    return { removed, mirrorsLeft: mc.mirrorCount() };
  }, EXTRA);
  if (!r.removed) return ['the test could not remove the control during a rebuild'];
  return r.mirrorsLeft ? [`a mirror built after its control was removed stayed in the page (${r.mirrorsLeft})`] : [];
}

export async function run({ page, baseUrl }) {
  await open(page, baseUrl);
  const problems = await checkFollowsLiveMap(page);
  await open(page, baseUrl);
  problems.push(...await checkPointerMovesCostNothing(page));
  await open(page, baseUrl);
  problems.push(...await checkRemovedConfigLayerStaysGone(page));
  await open(page, baseUrl);
  problems.push(...await checkRemovedMidRebuild(page));
  if (problems.length) throw new Error(problems.join('\n'));
}
