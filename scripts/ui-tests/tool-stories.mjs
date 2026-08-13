/**
 * UI Test: Stories tool
 *
 * Regression test for the bug where webmapx-stories-tool never called
 * this.subscribeToConfig() — onConfigReady() was therefore never invoked, config.stories
 * never loaded, and the tool silently showed "No stories configured." (masking the deeper
 * question of whether opening/stepping a story actually drives the map at all).
 *
 * Also covers a second, distinct bug: webmapx-stories-tool called adapter.setBearing()/
 * setPitch() *after* adapter.setViewport() — MapLibre's setBearing/setPitch call jumpTo()
 * internally, which cancels any in-progress flyTo(), so the animated viewport change from
 * setViewport() was being cancelled almost immediately (camera stayed near its start
 * position). Fixed by reordering: bearing/pitch (instant) first, viewport (animated) last.
 *
 * And a third: layers a step references that aren't loaded yet (e.g. "world-countries",
 * which isn't in the demo's default active layers) were never actually added to the map —
 * setLayerVisibility/setLayerOpacity are no-ops against a layer that was never added. Fixed
 * by having applyStep() add missing layers on demand (mapHost.addLayerRequest) and remove
 * them again on close, without ever tearing down a layer the config activates by default.
 *
 * And a fourth: applyStep() only toggled layers in the *current* step's state.l, so a layer
 * shown by an earlier step stayed visible forever after navigating to a later/earlier step
 * that doesn't mention it (page1 → no borders, page2 → borders, Prev → still borders). Fixed
 * by iterating the story's full layer union each step and explicitly hiding anything not in
 * the current step's list.
 *
 * Drives demo.json's built-in "Demo tour" story end to end:
 * 1. Stories toolbar button appears and its custom element loads, story list is populated
 * 2. Opening a story flies the camera to step 1's location (the actual "map not updated" bug)
 * 3. Step content (inline html) renders
 * 4. Next advances to step 2, flies the camera again, and adds the "world-countries" layer
 *    (not loaded by default) to the map
 * 5. Closing the story restores the pre-story camera position, removes "world-countries"
 *    again, and leaves the pre-existing "osm" layer alone
 *
 * Also covers the stories tool's projection support: step 2 sets "projection": "globe" in
 * demo.json (state.projection, converted via toStoryStepState), which must be applied via
 * adapter.setProjection(); reverted to "mercator" on Prev back to step 1 (which sets no
 * projection); and restored to the pre-story projection when the story closes.
 *
 * And a regression check that applyStep mirrors layer visibility into store.mapLayers (not
 * just the engine) — the legend (webmapx-layer-overview.ts) reads visible/transparency
 * straight from the store, so a step that hides a layer via adapter.setLayerVisibility alone
 * left the legend showing it as active/eye-open even though it wasn't rendered.
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

async function getViewportCenter(page) {
  return page.evaluate(async () => {
    const map = document.querySelector('webmapx-map');
    const adapter = await map?.getAdapterAsync?.();
    return adapter?.getViewportState?.()?.center ?? null;
  });
}

async function activateStoriesTool(page) {
  await page.waitForFunction(() => {
    return Boolean(document.querySelector('webmapx-toolbar sl-button[name="stories"]'))
      && customElements.get('webmapx-stories-tool') !== undefined;
  }, undefined, { timeout: 15_000 });

  await page.evaluate(() => {
    const btn = document.querySelector('webmapx-toolbar sl-button[name="stories"]');
    if (!btn) throw new Error('Stories toolbar button not found');
    btn.click();
  });

  await page.waitForFunction(() => {
    const tool = document.querySelector('webmapx-stories-tool');
    return Boolean(tool?.active);
  }, undefined, { timeout: 10_000 });
}

async function waitForStoryList(page) {
  await page.waitForFunction(() => {
    const tool = document.querySelector('webmapx-stories-tool');
    return Boolean(tool?.shadowRoot?.querySelector('.story-list-item'));
  }, undefined, { timeout: 10_000 });
}

async function openFirstStory(page) {
  await page.evaluate(() => {
    const tool = document.querySelector('webmapx-stories-tool');
    const item = tool?.shadowRoot?.querySelector('.story-list-item');
    if (!item) throw new Error('No story list item found');
    item.click();
  });
}

/** Waits for the map's center to move close to [lng, lat], polling getViewportState — works
 *  for both animated (MapLibre flyTo) and instant (other engines) viewport changes. */
async function waitForCenterNear(page, [lng, lat], tolerance = 1, timeout = 15_000) {
  await page.waitForFunction(({ lng, lat, tolerance }) => {
    const map = document.querySelector('webmapx-map');
    const center = map?.adapter?.getViewportState?.()?.center;
    if (!center) return false;
    return Math.abs(center[0] - lng) < tolerance && Math.abs(center[1] - lat) < tolerance;
  }, { lng, lat, tolerance }, { timeout });
}

async function getMapLayerIds(page) {
  return page.evaluate(() => {
    const map = document.querySelector('webmapx-map');
    return Object.keys(map?.adapter?.store?.getState()?.mapLayers ?? {});
  });
}

async function waitForDefaultLayersLoaded(page) {
  await page.waitForFunction(() => {
    const map = document.querySelector('webmapx-map');
    return 'osm' in (map?.adapter?.store?.getState()?.mapLayers ?? {});
  }, undefined, { timeout: 20_000 });
}

async function waitForLayerLoaded(page, layerId) {
  await page.waitForFunction((id) => {
    const map = document.querySelector('webmapx-map');
    return id in (map?.adapter?.store?.getState()?.mapLayers ?? {});
  }, layerId, { timeout: 15_000 });
}

async function getStepText(page) {
  return page.evaluate(() => {
    const tool = document.querySelector('webmapx-stories-tool');
    return tool?.shadowRoot?.querySelector('.step-content')?.textContent?.trim() ?? '';
  });
}

async function clickNext(page) {
  await page.evaluate(() => {
    const tool = document.querySelector('webmapx-stories-tool');
    const buttons = tool?.shadowRoot?.querySelectorAll('.step-nav sl-button') ?? [];
    const next = buttons[1];
    if (!next) throw new Error('Next button not found');
    next.click();
  });
}

async function clickPrev(page) {
  await page.evaluate(() => {
    const tool = document.querySelector('webmapx-stories-tool');
    const buttons = tool?.shadowRoot?.querySelectorAll('.step-nav sl-button') ?? [];
    const prev = buttons[0];
    if (!prev) throw new Error('Prev button not found');
    prev.click();
  });
}

/** Native rendered visibility of a logical layer's MapLibre layers ('visible'/'none') —
 *  reaches past IMap into MapLibre-specific internals to verify the engine actually rendered
 *  what applyStep asked for, independent of the store mirror checked by getStoreLayerVisible. */
async function getNativeLayerVisibility(page, logicalLayerId) {
  return page.evaluate((id) => {
    const adapter = document.querySelector('webmapx-map')?.adapter;
    const nativeIds = adapter?.layerService?.logicalToNative?.get(id) ?? [];
    const mapInstance = adapter?.core?.mapInstance;
    if (!mapInstance || nativeIds.length === 0) return [];
    return nativeIds.map((nativeId) => mapInstance.getLayoutProperty(nativeId, 'visibility') ?? 'visible');
  }, logicalLayerId);
}

/** store.mapLayers[id].visible — what the legend (webmapx-layer-overview.ts) actually reads,
 *  as opposed to the engine-level rendering checked by getNativeLayerVisibility. applyStep
 *  mirrors visibility/transparency into the store precisely so this reflects story steps too. */
async function getStoreLayerVisible(page, logicalLayerId) {
  return page.evaluate((id) => {
    const adapter = document.querySelector('webmapx-map')?.adapter;
    const entry = adapter?.store?.getState()?.mapLayers?.[id];
    return entry?.visible !== false;
  }, logicalLayerId);
}

async function getProjectionName(page) {
  return page.evaluate(() => {
    const adapter = document.querySelector('webmapx-map')?.adapter;
    return adapter?.getProjection?.()?.name ?? 'mercator';
  });
}

async function closeStory(page) {
  await page.evaluate(() => {
    const tool = document.querySelector('webmapx-stories-tool');
    const closeBtn = tool?.shadowRoot?.querySelector('.story-header sl-button');
    if (!closeBtn) throw new Error('Close button not found');
    closeBtn.click();
  });
}

export async function run({ page, engine, baseUrl }) {
  console.log(`  Running stories tool test for engine: ${engine}`);

  const step = async (label, fn) => {
    try {
      await fn();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`${label}: ${message}`, { cause: error });
    }
  };

  let startCenter;

  await step('load default page', async () => {
    await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });
    await waitForMapReady(page);
  });

  // Wait for the config's own default layers (just "osm") to finish loading before opening
  // any story — otherwise a story racing the initial load can mistake a default layer for
  // one it added itself and wrongly remove it again on close (see defaultActiveLayerIds).
  await step('wait for default layers to load', () => waitForDefaultLayersLoaded(page));

  await step('capture pre-story camera position', async () => {
    startCenter = await getViewportCenter(page);
    if (!startCenter) fail('Could not read initial viewport center');
  });

  await step('activate stories tool (regression: lazily-loaded custom element)', () => activateStoriesTool(page));

  await step('story list is populated from config.stories (regression: onConfigReady never fired)', () => waitForStoryList(page));

  await step('open first story', () => openFirstStory(page));

  await step('opening the story flies the camera to step 1 (the reported "map not updated" bug)', async () => {
    // demo.json "Demo tour" step 1: v: [-74, 40.7, 4, 0, 0]
    await waitForCenterNear(page, [-74, 40.7]);
    console.log('    Camera moved to step 1 location');
  });

  await step('step 1 content is rendered', async () => {
    const text = await getStepText(page);
    if (!text.includes('webmapx')) fail(`Step content missing expected text, got: "${text}"`);
    console.log('    Step content rendered');
  });

  await step('clicking Next advances to step 2, moves the camera, and adds "world-countries"', async () => {
    const before = await getMapLayerIds(page);
    if (before.includes('world-countries')) fail('"world-countries" already loaded before step 2 — test assumption invalid');

    await clickNext(page);
    // demo.json "Demo tour" step 2: v: [10, 50, 4, 0, 0], state.l: ["osm", "world-countries"]
    await waitForCenterNear(page, [10, 50]);
    console.log('    Camera moved to step 2 location');

    await waitForLayerLoaded(page, 'world-countries');
    console.log('    "world-countries" layer added to the map');

    const visibility = await getNativeLayerVisibility(page, 'world-countries');
    if (visibility.length === 0 || visibility.some((v) => v !== 'visible')) {
      fail(`Expected "world-countries" to render visible at step 2, got: ${JSON.stringify(visibility)}`);
    }
    console.log('    "world-countries" renders visible at step 2');

    const storeVisible = await getStoreLayerVisible(page, 'world-countries');
    if (!storeVisible) fail('Expected store.mapLayers["world-countries"].visible to be true at step 2 (legend must reflect this)');
    console.log('    Legend (store) shows "world-countries" visible at step 2');
  });

  await step('step 2\'s "projection: globe" config is applied to the map', async () => {
    const projection = await getProjectionName(page);
    if (projection !== 'globe') fail(`Expected projection "globe" at step 2, got: "${projection}"`);
    console.log('    Projection switched to "globe" at step 2');
  });

  await step('clicking Prev back to step 1 hides "world-countries" again (regression: only step.state.l was toggled, not the story\'s full layer union)', async () => {
    await clickPrev(page);
    await waitForCenterNear(page, [-74, 40.7]);

    const visibility = await getNativeLayerVisibility(page, 'world-countries');
    if (visibility.some((v) => v === 'visible')) {
      fail(`Expected "world-countries" to be gone at step 1, got: ${JSON.stringify(visibility)}`);
    }

    // "world-countries" isn't in step 1 at all and was added by the story itself (not a
    // pre-existing default layer), so it must be removed outright here, not just hidden —
    // otherwise the legend would keep listing it (hidden) purely because an earlier step in
    // this session happened to reference it, i.e. depend on navigation history.
    const afterPrev = await getMapLayerIds(page);
    if (afterPrev.includes('world-countries')) {
      fail('Expected "world-countries" to be fully removed (not just hidden) at step 1, since the story added it and step 1 doesn\'t need it');
    }
    console.log('    "world-countries" removed (not just hidden) at step 1 — legend list depends only on the current step');

    const projection = await getProjectionName(page);
    if (projection !== 'mercator') fail(`Expected projection to revert to "mercator" at step 1 (no projection set), got: "${projection}"`);
    console.log('    Projection reverted to "mercator" at step 1');

    // Move back to step 2 so the rest of the flow (close/restore) exercises the same path
    // as before this regression check was inserted.
    await clickNext(page);
    await waitForCenterNear(page, [10, 50]);
  });

  await step('closing the story restores the pre-story camera position, projection, and removes the added layer', async () => {
    await closeStory(page);
    await waitForCenterNear(page, startCenter, 1, 15_000);
    console.log('    Camera restored on close');

    const projection = await getProjectionName(page);
    if (projection !== 'mercator') fail(`Expected projection restored to "mercator" after close, got: "${projection}"`);
    console.log('    Projection restored on close');

    const after = await getMapLayerIds(page);
    if (after.includes('world-countries')) fail('"world-countries" was not removed after closing the story');
    if (!after.includes('osm')) fail('"osm" (a pre-existing default layer) was wrongly removed after closing the story');
    console.log('    "world-countries" removed, "osm" preserved');
  });

  await step('story list is shown again after close', async () => {
    await waitForStoryList(page);
  });
}

export const engines = ['maplibre'];
