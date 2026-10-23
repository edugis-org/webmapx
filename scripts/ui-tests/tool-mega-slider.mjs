import { appUrl } from './lib/fixture-config.mjs';

/**
 * UI Test: Mega slider
 *
 * The mega slider always targets whichever layer is currently topmost in the
 * legend (store.mapLayers, reversed), not a layer id fixed at load time. This
 * drives that end to end against its own tiny fixture (two plain raster
 * layers, "streets" then "satellite", so "satellite" is added last and starts
 * on top): the slider should target "satellite" initially, dragging it should
 * change only "satellite"'s transparency, and reordering the layers so
 * "streets" is on top should retarget the slider live, with no page reload.
 */

const CONFIG_PATH = '/testpages/fixtures/mega-slider.json';

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

async function waitForMegaSlider(page) {
  await page.waitForFunction(() => {
    const tool = document.querySelector('webmapx-mega-slider');
    return Boolean(tool?.shadowRoot?.querySelector('input[type="range"]'));
  }, undefined, { timeout: 15_000 });
}

async function getSliderState(page) {
  return page.evaluate(() => {
    const tool = document.querySelector('webmapx-mega-slider');
    const input = tool?.shadowRoot?.querySelector('input[type="range"]');
    return {
      topLayerId: tool?.topLayerId ?? null,
      inputValue: input ? Number(input.value) : null,
      ariaLabel: input?.getAttribute('aria-label') ?? null,
    };
  });
}

async function dragSliderTo(page, value) {
  await page.evaluate((value) => {
    const tool = document.querySelector('webmapx-mega-slider');
    const input = tool?.shadowRoot?.querySelector('input[type="range"]');
    if (!input) throw new Error('mega slider input not found');
    input.value = String(value);
    input.dispatchEvent(new Event('input', { bubbles: true }));
  }, value);
}

async function getMapLayers(page) {
  return page.evaluate(async () => {
    const map = document.querySelector('webmapx-map');
    const adapter = await map?.getAdapterAsync?.();
    if (!adapter) return null;
    return adapter.store.getState().mapLayers;
  });
}

async function moveLayerToTop(page, layerId) {
  await page.evaluate(async (layerId) => {
    const map = document.querySelector('webmapx-map');
    const adapter = await map?.getAdapterAsync?.();
    if (!adapter) throw new Error('adapter unavailable');
    adapter.moveLayer(layerId, null);
  }, layerId);
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
  await step('wait mega slider rendered', () => waitForMegaSlider(page));

  await step('targets the topmost layer ("satellite", added last)', async () => {
    const state = await getSliderState(page);
    if (state.topLayerId !== 'satellite') {
      fail(`Expected topLayerId "satellite", got ${JSON.stringify(state.topLayerId)}`);
    }
    // A layer with no transparency set anywhere defaults to 50 (a blend of
    // both), not 0 (fully opaque, hiding the whole point of a crossfade
    // slider until someone first touches it) — and that default is written
    // back to the store, not just displayed.
    if (state.inputValue !== 50) {
      fail(`Expected initial slider value 50 (default blend, no override), got ${state.inputValue}`);
    }
    const layers = await getMapLayers(page);
    if (layers?.satellite?.transparency !== 50) {
      fail(`Expected the default to be written to satellite.transparency (50), got ${layers?.satellite?.transparency}`);
    }
    if (layers?.streets?.transparency) {
      fail(`Expected the default to touch only the top layer, but streets.transparency is ${layers?.streets?.transparency}`);
    }
  });

  await step('dragging the slider changes only the top layer\'s transparency', async () => {
    await dragSliderTo(page, 30);
    await page.waitForTimeout(100);

    const layers = await getMapLayers(page);
    if (!layers) fail('Could not read mapLayers from store');
    if (layers.satellite?.transparency !== 30) {
      fail(`Expected satellite.transparency 30 (the slider value, unchanged), got ${layers.satellite?.transparency}`);
    }
    if (layers.streets?.transparency) {
      fail(`Expected streets.transparency to stay untouched, got ${layers.streets?.transparency}`);
    }
  });

  await step('reordering layers retargets the slider live, no reload', async () => {
    await moveLayerToTop(page, 'streets');
    await page.waitForTimeout(100);

    const state = await getSliderState(page);
    if (state.topLayerId !== 'streets') {
      fail(`Expected topLayerId to follow the reorder to "streets", got ${JSON.stringify(state.topLayerId)}`);
    }
    // streets has never been dragged, so becoming the real top layer (with a
    // genuine bottom counterpart now present) defaults it to 50, the same way
    // satellite was defaulted at load — it should not carry over satellite's
    // 30, which would mean the slider kept its old displayed value instead of
    // re-reading the new target's own transparency.
    if (state.inputValue !== 50) {
      fail(`Expected streets' own default transparency 50 after retargeting, got ${state.inputValue}`);
    }
  });

  await step('dragging after the reorder now only touches "streets"', async () => {
    await dragSliderTo(page, 45);
    await page.waitForTimeout(100);

    const layers = await getMapLayers(page);
    if (!layers) fail('Could not read mapLayers from store');
    if (layers.streets?.transparency !== 45) {
      fail(`Expected streets.transparency 45 (the slider value, unchanged), got ${layers.streets?.transparency}`);
    }
    if (layers.satellite?.transparency !== 30) {
      fail(`Expected satellite.transparency to stay at 30 from the earlier drag, got ${layers.satellite?.transparency}`);
    }
  });
}

export const engines = ['maplibre', 'openlayers'];
