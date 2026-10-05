// An animated setViewport — search results, story steps, bookmarks, the
// keyboard's arrows and "+" where the engine has no keyboard handling of its
// own — on every engine:
//
// - A long move is a visible flight: it passes through other zoom levels on
//   the way rather than jumping.
// - A short move (an arrow-key nudge) is quick. Cesium gives any flight at
//   least about two seconds of its own, which made each keypress crawl.
// - On MapLibre the flight also plays under the OS "reduce motion" setting
//   (`essential: true`), which MapLibre otherwise turns into a jump. Whether
//   camera flights should ignore that setting is a product decision; this
//   pins what the camera does today.

import { appUrl } from './lib/fixture-config.mjs';

/** Starts the move, then samples the zoom until the camera settles on the target. */
async function fly(page, { to, zoom }) {
  return page.evaluate(async ({ to, zoom }) => {
    const adapter = await document.querySelector('webmapx-map').getAdapterAsync();
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    const zooms = new Set();
    const started = performance.now();
    adapter.setViewport(to, zoom);
    let stableSince = null;
    while (performance.now() - started < 15_000) {
      const v = adapter.getViewportState();
      zooms.add(v.zoom.toFixed(2));
      const there = Math.abs(v.center[0] - to[0]) < 1e-3 && Math.abs(v.center[1] - to[1]) < 1e-3 && Math.abs(v.zoom - zoom) < 0.05;
      if (there) {
        stableSince ??= performance.now();
        if (performance.now() - stableSince > 150) return { ms: Math.round(stableSince - started), zoomsSeen: zooms.size };
      } else {
        stableSince = null;
      }
      await sleep(20);
    }
    return { ms: null, zoomsSeen: zooms.size };
  }, { to, zoom });
}

async function startAt(page, center, zoom) {
  await page.evaluate(async ({ center, zoom }) => {
    const adapter = await document.querySelector('webmapx-map').getAdapterAsync();
    adapter.setViewport(center, zoom, { animate: false });
    await new Promise((r) => setTimeout(r, 800));
  }, { center, zoom });
}

async function nudgeTarget(page) {
  return page.evaluate(async () => {
    const adapter = await document.querySelector('webmapx-map').getAdapterAsync();
    const here = adapter.getViewportState();
    const p = adapter.project(here.center);
    return { to: adapter.unproject([p[0] + 100, p[1]]), zoom: here.zoom };
  });
}

export async function run({ page, baseUrl, engine }) {
  await page.goto(appUrl(baseUrl), { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(async () => (await document.querySelector('webmapx-map')?.getAdapterAsync?.())?.store.getState().mapLoaded, undefined, { timeout: 45_000 });
  const problems = [];

  await startAt(page, [4.9, 52.37], 10);
  const long = await fly(page, { to: [139.69, 35.69], zoom: 10 });
  if (long.ms === null) problems.push('a long move never arrived');
  else if (long.zoomsSeen <= 2) problems.push(`a long move jumped instead of flying (zoom levels seen: ${long.zoomsSeen})`);

  const nudge = await fly(page, await nudgeTarget(page));
  if (nudge.ms === null) problems.push('an arrow-key-sized move never arrived');
  else if (nudge.ms > 1200) problems.push(`an arrow-key-sized move took ${nudge.ms} ms`);

  if (engine === 'maplibre') {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    try {
      await startAt(page, [4.9, 52.37], 10);
      const reduced = await fly(page, { to: [139.69, 35.69], zoom: 10 });
      if (reduced.zoomsSeen <= 2) problems.push(`under "reduce motion" the long move jumped (zoom levels seen: ${reduced.zoomsSeen})`);
    } finally {
      await page.emulateMedia({ reducedMotion: 'no-preference' });
    }
  }

  if (problems.length) throw new Error(problems.join('\n'));
}
