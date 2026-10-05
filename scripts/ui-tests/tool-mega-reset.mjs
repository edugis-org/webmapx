import { appUrl } from './lib/fixture-config.mjs';

/**
 * UI Test: Mega reset
 *
 * The mega reset button restores the camera to whatever the map's viewport
 * actually was once the control finished loading (center, zoom, bearing,
 * pitch) — not necessarily the config's own `map.center`/`map.zoom`, just
 * whatever the map was showing at that point. This drives the map away from
 * that view (pan, zoom, rotate, tilt) and checks that one click undoes all
 * four at once: bearing/pitch instantly (before the flight starts, so they
 * don't cancel it), center/zoom via the same animated flyTo a search result
 * flies to.
 *
 * Also a regression check for a capture-timing race: megaReset is lazy-loaded,
 * so `onMapAttached` can fire before the map has actually finished loading,
 * and `adapter.getViewportState()` at that point silently returns the
 * engine's pre-init fallback (`{center:[0,0], zoom:1, bearing:0, pitch:0}`)
 * rather than signalling "not ready" — reset would then fly to null island.
 * Fixed by gating the capture on `store.mapLoaded`.
 *
 * And a regression check for the OS "reduce motion" accessibility setting:
 * MapLibre's `flyTo` silently zeroes its own duration under it unless the
 * call is marked `essential: true` — landing on the right place with no
 * visible flight at all, exactly like a plain jump. `fitBounds` was already
 * fixed for this; `setViewport`'s `flyTo` (which is what this button, and
 * search's point-result path, actually call) was not.
 */

const CONFIG_PATH = '/testpages/fixtures/mega-reset.json';

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

async function waitForMegaReset(page) {
  await page.waitForFunction(() => {
    const tool = document.querySelector('webmapx-mega-reset');
    return Boolean(tool?.shadowRoot?.querySelector('sl-button:not([disabled])'));
  }, undefined, { timeout: 15_000 });
}

async function getViewport(page) {
  return page.evaluate(async () => {
    const map = document.querySelector('webmapx-map');
    const adapter = await map?.getAdapterAsync?.();
    if (!adapter) return null;
    return adapter.getViewportState();
  });
}

/** The tool's *own* captured `initialView` — distinct from `getViewport`, which
 *  reads the live map and is therefore always correct by the time the test
 *  gets to it. This is what actually caught the bug where `onMapAttached`
 *  could fire before the map had finished loading: the tool captured the
 *  engine's pre-init fallback ({center:[0,0], zoom:1, bearing:0, pitch:0})
 *  instead of the real starting view, and reset silently flew to null island
 *  — invisible to a check that only ever reads the (by-then-settled) live
 *  map. */
async function getToolCapturedView(page) {
  return page.evaluate(() => document.querySelector('webmapx-mega-reset')?.initialView ?? null);
}

async function disturbCamera(page) {
  await page.evaluate(async () => {
    const map = document.querySelector('webmapx-map');
    const adapter = await map?.getAdapterAsync?.();
    if (!adapter) throw new Error('adapter unavailable');
    adapter.setViewport([5.5, 52.9], 15, { animate: false });
    adapter.setBearing(200);
    adapter.setPitch(0);
  });
}

async function clickReset(page) {
  await page.evaluate(() => {
    const tool = document.querySelector('webmapx-mega-reset');
    const button = tool?.shadowRoot?.querySelector('sl-button');
    if (!button) throw new Error('mega reset button not found');
    button.click();
  });
}

function close(a, b, tolerance = 0.01) {
  return Math.abs(a - b) <= tolerance;
}

export async function run({ page, baseUrl }) {
  const step = async (label, fn) => {
    try {
      await fn();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`${label}: ${message}`, { cause: error });
    }
  };

  await page.goto(appUrl(baseUrl, { config: CONFIG_PATH }), { waitUntil: 'domcontentloaded' });

  await step('wait map ready', () => waitForMapReady(page));
  await step('wait mega reset button rendered', () => waitForMegaReset(page));

  let initialView;
  await step('captures the initial view (config camera: center [4.9, 52.37], zoom 12, bearing 20, pitch 30)', async () => {
    initialView = await getViewport(page);
    if (!initialView) fail('Could not read initial viewport state');
    if (!close(initialView.center[0], 4.9) || !close(initialView.center[1], 52.37)) {
      fail(`Expected initial center near [4.9, 52.37], got ${JSON.stringify(initialView.center)}`);
    }
    if (!close(initialView.zoom, 12)) fail(`Expected initial zoom 12, got ${initialView.zoom}`);
    if (!close(initialView.bearing, 20)) fail(`Expected initial bearing 20, got ${initialView.bearing}`);
    if (!close(initialView.pitch, 30)) fail(`Expected initial pitch 30, got ${initialView.pitch}`);
  });

  await step('the tool itself captured that same view, not the pre-init fallback', async () => {
    const captured = await getToolCapturedView(page);
    if (!captured) fail('webmapx-mega-reset.initialView is still null once the button is enabled');
    if (!close(captured.center[0], 4.9) || !close(captured.center[1], 52.37)) {
      fail(`Expected the tool's captured center near [4.9, 52.37], got ${JSON.stringify(captured.center)}`);
    }
    if (!close(captured.zoom, 12)) fail(`Expected the tool's captured zoom 12, got ${captured.zoom}`);
    if (!close(captured.bearing, 20)) fail(`Expected the tool's captured bearing 20, got ${captured.bearing}`);
    if (!close(captured.pitch, 30)) fail(`Expected the tool's captured pitch 30, got ${captured.pitch}`);
  });

  await step('camera actually moved after disturbing it', async () => {
    await disturbCamera(page);
    await page.waitForTimeout(100);
    const disturbed = await getViewport(page);
    if (close(disturbed.center[0], initialView.center[0]) && close(disturbed.center[1], initialView.center[1])) {
      fail('Expected the center to have moved before testing reset');
    }
    if (close(disturbed.bearing, initialView.bearing)) {
      fail('Expected the bearing to have moved before testing reset');
    }
  });

  await step('bearing/pitch land instantly, before the flight even starts', async () => {
    // Regression check for the exact bug the stories tool once had: MapLibre's
    // setBearing/setPitch call jumpTo() internally, which cancels any
    // in-progress flyTo(). Writing them *after* the animated setViewport call
    // would cancel the flight almost immediately; writing them first (this
    // is checked right after click, before the flight has had time to
    // finish) means both land in the same tick, well before center/zoom
    // finish animating in.
    await clickReset(page);
    const justAfterClick = await getViewport(page);
    if (!close(justAfterClick.bearing, initialView.bearing, 0.5)) {
      fail(`Expected bearing already at ${initialView.bearing} right after click, got ${justAfterClick.bearing}`);
    }
    if (!close(justAfterClick.pitch, initialView.pitch, 0.5)) {
      fail(`Expected pitch already at ${initialView.pitch} right after click, got ${justAfterClick.pitch}`);
    }
  });

  await step('the flight lands on the initial center and zoom', async () => {
    // setViewport animates (flyTo) by default — the whole point of the
    // button — so poll rather than assume a fixed settle time.
    await page.waitForFunction(({ lng, lat, zoom, tolerance }) => {
      const map = document.querySelector('webmapx-map');
      const view = map?.adapter?.getViewportState?.();
      if (!view) return false;
      return Math.abs(view.center[0] - lng) < tolerance
        && Math.abs(view.center[1] - lat) < tolerance
        && Math.abs(view.zoom - zoom) < 0.1;
    }, { lng: initialView.center[0], lat: initialView.center[1], zoom: initialView.zoom, tolerance: 0.05 }, { timeout: 15_000 });

    const restored = await getViewport(page);
    if (!close(restored.bearing, initialView.bearing, 0.5)) {
      fail(`Expected bearing to still be ${initialView.bearing} once the flight settled, got ${restored.bearing}`);
    }
    if (!close(restored.pitch, initialView.pitch, 0.5)) {
      fail(`Expected pitch to still be ${initialView.pitch} once the flight settled, got ${restored.pitch}`);
    }
  });

  await step('still animates under the OS "reduce motion" setting (essential: true)', async () => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    try {
      await disturbCamera(page);
      await page.waitForTimeout(100);

      const zoomsSeen = new Set();
      const sampleDeadline = Date.now() + 2000;
      await clickReset(page);
      while (Date.now() < sampleDeadline) {
        const v = await getViewport(page);
        if (v) zoomsSeen.add(v.zoom.toFixed(2));
        await page.waitForTimeout(30);
      }

      // A jumpTo fallback (what MapLibre silently substitutes for flyTo under
      // reduced motion, absent `essential: true`) lands in one step: every
      // sample in the 2s window reads the same, final zoom. A real flight
      // passes through many distinct intermediate values on the way there.
      if (zoomsSeen.size <= 1) {
        fail(`Expected the flight to pass through multiple zoom levels under reduced motion, only ever saw: ${[...zoomsSeen]}`);
      }
    } finally {
      await page.emulateMedia({ reducedMotion: 'no-preference' });
    }
  });
}

export const engines = ['maplibre'];
