import { appUrl } from './lib/fixture-config.mjs';

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

async function toggleDrawTool(page) {
  // Toolbar buttons exist as soon as the config is applied, but the tool component behind
  // them (webmapx-draw-tool) loads lazily based on config — wait for it to be registered
  // rather than assuming "adapter ready" (waitForMapReady) implies "toolbar fully built".
  await page.waitForFunction(() => {
    return Boolean(document.querySelector('webmapx-toolbar sl-button[name="draw"]'))
      && customElements.get('webmapx-draw-tool') !== undefined;
  }, undefined, { timeout: 15_000 });
  await page.evaluate(() => {
    const drawButton = document.querySelector('webmapx-toolbar sl-button[name="draw"]');
    if (!drawButton) throw new Error('Draw toolbar button not found');
    drawButton.click();
  });
}

/**
 * The panel opens onto a type picker, then a per-type layer list, then the
 * scoped editing session for one layer — "Draw and edit layers" is a
 * three-screen flow, not a flat toolbar. This walks from wherever the panel
 * currently is back to the type picker, picks `geometryType`, and clicks
 * the layer-picker's "Add new" button, which drops straight into a fresh
 * layer's editing session (no dialog — see `createLayerDirect`).
 */
async function navigateToAddNewLayerScreen(page, geometryType) {
  await page.evaluate(async ({ type }) => {
    const waitFor = async (fn, timeoutMs, label) => {
      const started = Date.now();
      while (Date.now() - started < timeoutMs) {
        const value = fn();
        if (value) return value;
        await new Promise((resolve) => setTimeout(resolve, 50));
      }
      throw new Error(`Timed out waiting for ${label}`);
    };

    const map = document.querySelector('webmapx-map');
    const tool = map?.querySelector('webmapx-draw-tool');
    if (!tool?.shadowRoot) throw new Error('Draw tool shadow root unavailable');

    if (tool.panelView === 'editing') {
      const stopBtn = await waitFor(
        () => tool.shadowRoot.querySelector('sl-icon-button[label="Stop editing"]'),
        5_000, 'stop editing button'
      );
      stopBtn.click();
      await waitFor(() => tool.panelView === 'layers', 5_000, 'panel to leave editing view');
    }

    if (tool.panelView === 'layers') {
      const backBtn = await waitFor(
        () => tool.shadowRoot.querySelector('sl-icon-button[label="Back"]'),
        5_000, 'back button'
      );
      backBtn.click();
      await waitFor(() => tool.panelView === 'type', 5_000, 'panel to reach type picker');
    }

    const card = await waitFor(
      () => tool.shadowRoot.querySelector(`.type-card[data-type="${type}"]`),
      5_000, `type card for ${type}`
    );
    card.click();
    await waitFor(
      () => tool.panelView === 'layers' && tool.pickedType === type,
      5_000, 'layer picker for type'
    );

    const addBtn = await waitFor(
      () => Array.from(tool.shadowRoot.querySelectorAll('sl-button'))
        .find((button) => (button.textContent ?? '').includes('Add new')),
      5_000, 'add new layer button'
    );
    addBtn.click();
  }, { type: geometryType });
}

/**
 * Mirrors `navigateToAddNewLayerScreen`, but ends on an existing layer's
 * "Start editing" button instead of "Add new" — this is how a layer that
 * isn't the one currently showing gets resumed (it may have been paused by
 * a sibling layer of the same type taking over the editing session).
 */
async function navigateToStartEditingLayer(page, geometryType, layerName) {
  await page.evaluate(async ({ type, name }) => {
    const waitFor = async (fn, timeoutMs, label) => {
      const started = Date.now();
      while (Date.now() - started < timeoutMs) {
        const value = fn();
        if (value) return value;
        await new Promise((resolve) => setTimeout(resolve, 50));
      }
      throw new Error(`Timed out waiting for ${label}`);
    };

    const map = document.querySelector('webmapx-map');
    const tool = map?.querySelector('webmapx-draw-tool');
    if (!tool?.shadowRoot) throw new Error('Draw tool shadow root unavailable');

    if (tool.panelView === 'editing') {
      const stopBtn = await waitFor(
        () => tool.shadowRoot.querySelector('sl-icon-button[label="Stop editing"]'),
        5_000, 'stop editing button'
      );
      stopBtn.click();
      await waitFor(() => tool.panelView === 'layers', 5_000, 'panel to leave editing view');
    }

    if (tool.panelView === 'layers' && tool.pickedType !== type) {
      const backBtn = await waitFor(
        () => tool.shadowRoot.querySelector('sl-icon-button[label="Back"]'),
        5_000, 'back button'
      );
      backBtn.click();
      await waitFor(() => tool.panelView === 'type', 5_000, 'panel to reach type picker');
    }

    if (tool.panelView === 'type') {
      const card = await waitFor(
        () => tool.shadowRoot.querySelector(`.type-card[data-type="${type}"]`),
        5_000, `type card for ${type}`
      );
      card.click();
      await waitFor(
        () => tool.panelView === 'layers' && tool.pickedType === type,
        5_000, 'layer picker for type'
      );
    }

    const rows = await waitFor(
      () => {
        const list = Array.from(tool.shadowRoot.querySelectorAll('.layer-row'));
        return list.length > 0 ? list : null;
      },
      5_000, 'layer rows'
    );
    const row = rows.find((r) => r.querySelector('.layer-name')?.textContent?.trim() === name);
    if (!row) throw new Error(`Layer row not found: ${name}`);
    const startBtn = Array.from(row.querySelectorAll('sl-button'))
      .find((button) => (button.textContent ?? '').includes('Start editing'));
    if (!startBtn) throw new Error('Start editing button not found');
    startBtn.click();
  }, { type: geometryType, name: layerName });

  await page.waitForFunction(({ expectedType }) => {
    const map = document.querySelector('webmapx-map');
    const tool = map?.querySelector('webmapx-draw-tool');
    return tool?.panelView === 'editing' && tool?.pickedType === expectedType;
  }, { expectedType: geometryType }, { timeout: 10_000 });
}

/** Click one of the editing session's own tool buttons (Select/Draw/Circle) and wait for the mode to take. */
async function enterDrawMode(page, buttonName, expectedMode) {
  await page.evaluate(({ drawButtonName }) => {
    const map = document.querySelector('webmapx-map');
    const tool = map?.querySelector('webmapx-draw-tool');
    const button = tool?.shadowRoot?.querySelector(`sl-icon-button[name="${drawButtonName}"]`);
    if (!button) throw new Error(`Draw mode button not found: ${drawButtonName}`);
    button.click();
  }, { drawButtonName: buttonName });

  await page.waitForFunction(({ mode }) => {
    const map = document.querySelector('webmapx-map');
    const tool = map?.querySelector('webmapx-draw-tool');
    return tool?.mode === mode;
  }, { mode: expectedMode }, { timeout: 5_000 });
}

/**
 * Create a brand-new layer — "Add new" now goes straight to its editing
 * session, no dialog. A fresh layer starts unnamed, and the whole toolbar
 * (mode pill, snap/undo/redo/delete, help text, "Edit attributes") stays
 * hidden until it has a name — only the name field itself shows, so this
 * also exercises that gate (asserting the draw button doesn't exist yet)
 * before naming the layer and switching into draw mode.
 */
async function createLayerDirect(page, geometryType, layerName, activeLayerType, drawButtonName, drawMode) {
  await navigateToAddNewLayerScreen(page, geometryType);

  await page.waitForFunction(({ expectedType }) => {
    const map = document.querySelector('webmapx-map');
    const tool = map?.querySelector('webmapx-draw-tool');
    return tool?.panelView === 'editing' && Boolean(tool.activeLayerIds?.[expectedType]);
  }, { expectedType: activeLayerType }, { timeout: 10_000 });

  const toolbarHiddenBeforeNaming = await page.evaluate(({ buttonName }) => {
    const tool = document.querySelector('webmapx-map')?.querySelector('webmapx-draw-tool');
    const btn = tool.shadowRoot.querySelector(`sl-icon-button[name="${buttonName}"]`);
    const pill = tool.shadowRoot.querySelector('.pill');
    return btn === null && pill === null;
  }, { buttonName: drawButtonName });
  if (!toolbarHiddenBeforeNaming) {
    throw new Error('Expected the mode pill/draw button to be absent before the new layer has a name');
  }

  await page.evaluate(({ name }) => {
    const tool = document.querySelector('webmapx-map')?.querySelector('webmapx-draw-tool');
    const nameInput = tool.shadowRoot.querySelector('.editing-layer-name');
    if (!nameInput) throw new Error('Layer name input not found');
    nameInput.value = name;
    nameInput.dispatchEvent(new Event('sl-change', { bubbles: true, composed: true }));
  }, { name: layerName });

  await enterDrawMode(page, drawButtonName, drawMode);
}

async function setSelectedFeatureName(page, featureName) {
  await page.waitForFunction(() => {
    const tool = document.querySelector('webmapx-draw-tool');
    const root = tool?.shadowRoot;
    if (!root) return false;

    // Wait until a feature is selected and the detail panel is rendered.
    if (!tool?.selectedFeatureId) return false;

    const rows = Array.from(root.querySelectorAll('div'));
    const rowWithNameInput = rows.find((row) => {
      const label = row.querySelector('span');
      const input = row.querySelector('sl-input');
      return Boolean(input) && label?.textContent?.trim() === 'name';
    });

    return Boolean(rowWithNameInput);
  }, undefined, { timeout: 10_000 });

  await page.evaluate(({ name }) => {
    const tool = document.querySelector('webmapx-draw-tool');
    const root = tool?.shadowRoot;
    if (!root) throw new Error('Draw tool shadow root missing');

    const rows = Array.from(root.querySelectorAll('div'));
    const nameRow = rows.find((row) => {
      const label = row.querySelector('span');
      const input = row.querySelector('sl-input');
      return Boolean(input) && label?.textContent?.trim() === 'name';
    });
    if (!nameRow) throw new Error('Selected-feature name row not found');

    const input = nameRow.querySelector('sl-input');
    if (!input) throw new Error('Selected-feature name input not found');
    input.value = name;
    input.dispatchEvent(new Event('sl-input', { bubbles: true, composed: true }));
    input.dispatchEvent(new Event('sl-change', { bubbles: true, composed: true }));
  }, { name: featureName });
}

async function selectLatestFeatureInLayer(page, layerName) {
  await page.evaluate(({ targetLayerName }) => {
    const tool = document.querySelector('webmapx-draw-tool');
    if (!tool) throw new Error('Draw tool not found');

    const layers = Array.isArray(tool.drawLayers) ? tool.drawLayers : [];
    const targetLayer = layers.find((layer) => layer.name === targetLayerName);
    if (!targetLayer) throw new Error(`Layer not found: ${targetLayerName}`);

    const candidates = (Array.isArray(tool.features) ? tool.features : [])
      .filter((feature) => feature.layerId === targetLayer.id);
    if (candidates.length === 0) {
      throw new Error(`No features found in layer: ${targetLayerName}`);
    }

    const feature = candidates[candidates.length - 1];
    tool.selectedFeatureId = feature.id;
    const isPoint = feature.type === 'Point' || feature.type === 'MultiPoint';
    tool.editState = isPoint ? 'editing' : 'selected';
    tool.updateSelectedSource?.();
    tool.updateEditHandles?.();
    tool.requestUpdate?.();
  }, { targetLayerName: layerName });

  await page.waitForFunction(({ targetLayerName }) => {
    const tool = document.querySelector('webmapx-draw-tool');
    if (!tool?.selectedFeatureId) return false;

    const layers = Array.isArray(tool.drawLayers) ? tool.drawLayers : [];
    const targetLayer = layers.find((layer) => layer.name === targetLayerName);
    if (!targetLayer) return false;

    const selected = (Array.isArray(tool.features) ? tool.features : [])
      .find((feature) => feature.id === tool.selectedFeatureId);
    return Boolean(selected && selected.layerId === targetLayer.id);
  }, { targetLayerName: layerName }, { timeout: 10_000 });
}

async function waitForLayerFeatureName(page, layerName, expectedName) {
  await page.waitForFunction(({ expectedLayerName, expectedFeatureName }) => {
    const map = document.querySelector('webmapx-map');
    const tool = map?.querySelector('webmapx-draw-tool');
    if (!tool) return false;

    const layer = Array.isArray(tool.drawLayers)
      ? tool.drawLayers.find((entry) => entry.name === expectedLayerName)
      : null;
    if (!layer) return false;

    const features = Array.isArray(tool.features)
      ? tool.features.filter((feature) => feature.layerId === layer.id)
      : [];
    if (features.length < 1) return false;

    return features.some((feature) => String(feature?.properties?.name ?? '') === expectedFeatureName);
  }, { expectedLayerName: layerName, expectedFeatureName: expectedName }, { timeout: 10_000 });
}

async function waitForFeatureCount(page, expectedCount, timeoutMs = 10_000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    const status = await page.evaluate(() => {
      const map = document.querySelector('webmapx-map');
      const tool = map?.querySelector('webmapx-draw-tool');
      return {
        count: Array.isArray(tool?.features) ? tool.features.length : -1,
        mode: tool?.mode ?? null,
        draftCount: Array.isArray(tool?.draftPoints) ? tool.draftPoints.length : -1,
        activePointLayer: tool?.activeLayerIds?.Point ?? null,
        activeLineLayer: tool?.activeLayerIds?.LineString ?? null,
        activePolygonLayer: tool?.activeLayerIds?.Polygon ?? null,
      };
    });

    if (status.count === expectedCount) {
      return;
    }

    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  const lastStatus = await page.evaluate(() => {
    const map = document.querySelector('webmapx-map');
    const tool = map?.querySelector('webmapx-draw-tool');
    return {
      count: Array.isArray(tool?.features) ? tool.features.length : -1,
      mode: tool?.mode ?? null,
      draftCount: Array.isArray(tool?.draftPoints) ? tool.draftPoints.length : -1,
      activePointLayer: tool?.activeLayerIds?.Point ?? null,
      activeLineLayer: tool?.activeLayerIds?.LineString ?? null,
      activePolygonLayer: tool?.activeLayerIds?.Polygon ?? null,
    };
  });

  throw new Error(
    `Expected feature count ${expectedCount}, got ${lastStatus.count}. mode=${lastStatus.mode}, draftCount=${lastStatus.draftCount}, activeLayers={Point:${lastStatus.activePointLayer},Line:${lastStatus.activeLineLayer},Polygon:${lastStatus.activePolygonLayer}}`
  );
}

async function getMapLayerAndSourceSummary(page, expectedLayerName) {
  return page.evaluate(async ({ layerName }) => {
    const map = document.querySelector('webmapx-map');
    const adapter = await map?.getAdapterAsync?.();
    if (!adapter) throw new Error('Map adapter unavailable');

    const mapLayers = adapter.store.getState().mapLayers ?? {};
    const layerEntry = Object.entries(mapLayers)
      .find(([, entry]) => (entry?.label ?? null) === layerName);

    if (!layerEntry) {
      return {
        foundLayer: false,
        featureCount: 0,
        featureName: null,
      };
    }

    const [, entry] = layerEntry;
    const sourceId = typeof entry.sourceId === 'string' ? entry.sourceId : null;
    const sourceData = sourceId ? adapter.getSourceData(sourceId) : null;

    if (!sourceData || typeof sourceData === 'string') {
      return {
        foundLayer: true,
        featureCount: 0,
        featureName: null,
      };
    }

    const features = Array.isArray(sourceData.features) ? sourceData.features : [];
    const featureNames = features
      .map((feature) => feature?.properties?.name)
      .filter((name) => name !== null && name !== undefined)
      .map((name) => String(name));

    return {
      foundLayer: true,
      featureCount: features.length,
      featureNames,
    };
  }, { layerName: expectedLayerName });
}

async function setBackgroundToGoogleSatelliteViaCatalogTool(page) {
  await page.evaluate(async () => {
    const waitFor = async (fn, timeoutMs, label) => {
      const started = Date.now();
      while (Date.now() - started < timeoutMs) {
        const value = fn();
        if (value) return value;
        await new Promise((resolve) => setTimeout(resolve, 50));
      }
      throw new Error(`Timed out waiting for ${label}`);
    };

    const layerTreeRoot = await waitFor(() => {
      const layerTree = document.querySelector('webmapx-layer-tree');
      return layerTree?.shadowRoot ?? null;
    }, 10_000, 'layer tree shadow root');

    const googleSatelliteRadio = await waitFor(
      () => layerTreeRoot.querySelector('input[type="radio"][data-layer-id="google-satellite"]'),
      10_000,
      'Google Satellite radio input'
    );

    googleSatelliteRadio.click();
  });

  await page.waitForFunction(() => {
    const map = document.querySelector('webmapx-map');
    const adapter = map?.adapter;
    if (!adapter?.store) return false;
    const mapLayers = adapter.store.getState().mapLayers ?? {};
    return ('google-satellite' in mapLayers) && !('osm' in mapLayers);
  }, undefined, { timeout: 10_000 });
}

async function assertActiveDrawLayerRenderedAtMapCenter(page, activeLayerType, engine) {
  const result = await page.evaluate(async ({ expectedType, expectedEngine }) => {
    const map = document.querySelector('webmapx-map');
    const tool = map?.querySelector('webmapx-draw-tool');
    const adapter = await map?.getAdapterAsync?.();
    if (!adapter) {
      return {
        ok: false,
        reason: 'Map adapter unavailable',
      };
    }

    const layerId = tool?.activeLayerIds?.[expectedType] ?? null;
    if (typeof layerId !== 'string' || layerId.length === 0) {
      return {
        ok: false,
        reason: `Active draw layer id for geometry type "${expectedType}" not found`,
      };
    }

    const state = adapter.store.getState();
    const mapLayerEntry = state.mapLayers?.[layerId] ?? null;
    if (!mapLayerEntry) {
      return {
        ok: false,
        reason: `Active draw layer "${layerId}" is not registered in mapLayers`,
      };
    }

    const sourceId = typeof mapLayerEntry?.sourceId === 'string' ? mapLayerEntry.sourceId : null;
    const sourceData = sourceId ? adapter.getSourceData(sourceId) : null;
    const sourceFeatureCount = sourceData && typeof sourceData !== 'string' && Array.isArray(sourceData.features)
      ? sourceData.features.length
      : 0;

    if (sourceFeatureCount < 1) {
      return {
        ok: false,
        reason: `Active draw layer "${layerId}" source has no features after basemap switch`,
      };
    }

    const center = adapter.getViewportState().center;
    const pixel = adapter.project(center);

    // Cesium's pick/drillPick can miss tiny point sprites in headless CI; rely on
    // source/layer-state checks there. Keep rendered hit testing for 2D engines.
    if (expectedEngine === 'cesium') {
      return {
        ok: true,
        layerId,
        hitCount: null,
        reason: null,
      };
    }

    const features = await adapter.queryService.queryFeatures(
      { pixel, lngLat: center },
      { layerIds: [layerId], tolerancePx: 10, includeWMS: false }
    );

    return {
      ok: features.length > 0,
      layerId,
      hitCount: features.length,
      reason: features.length > 0
        ? null
        : `No rendered features found for layerId "${layerId}" at map center`,
    };
  }, { expectedType: activeLayerType, expectedEngine: engine });

  if (!result.ok) {
    fail(`Expected active draw layer "${activeLayerType}" to remain visible after basemap switch. ${result.reason}`);
  }
}

function assertNamesPresent(summary, layerName, expectedNames) {
  if (!Array.isArray(summary.featureNames)) {
    fail(`Expected featureNames array for layer "${layerName}".`);
  }
  for (const expectedName of expectedNames) {
    if (!summary.featureNames.includes(expectedName)) {
      fail(`Expected layer "${layerName}" to include feature name "${expectedName}", got [${summary.featureNames.join(', ')}].`);
    }
  }
}

async function emitMapClickAtCenter(page) {
  await page.evaluate(async () => {
    const map = document.querySelector('webmapx-map');
    const adapter = await map?.getAdapterAsync?.();
    if (!adapter) throw new Error('Map adapter unavailable');

    const center = adapter.getViewportState().center;
    const pixel = adapter.project(center);

    adapter.events.emit({
      type: 'click',
      coords: center,
      pixel,
      resolution: null,
    });
  });
}

async function emitMapDrawSequence(page, geometryKind) {
  await page.evaluate(async ({ kind }) => {
    const map = document.querySelector('webmapx-map');
    const adapter = await map?.getAdapterAsync?.();
    if (!adapter) throw new Error('Map adapter unavailable');

    const center = adapter.getViewportState().center;
    const points = kind === 'line'
      ? [
        [center[0] - 6, center[1] - 3],
        [center[0], center[1] + 5],
        [center[0] + 7, center[1] - 2],
      ]
      : [
        [center[0] - 8, center[1] - 4],
        [center[0] + 8, center[1] - 4],
        [center[0] + 1, center[1] + 7],
      ];

    for (const coords of points) {
      const pixel = adapter.project(coords);
      adapter.events.emit({
        type: 'click',
        coords,
        pixel,
        resolution: null,
      });
    }

    const finishCoords = points[points.length - 1];
    const finishPixel = adapter.project(finishCoords);
    adapter.events.emit({
      type: 'contextmenu',
      coords: finishCoords,
      pixel: finishPixel,
    });
  }, { kind: geometryKind });
}

/** Snapshot of tool state read from the component's own properties — not the DOM, since which
 * screen (type/layers/editing) is showing depends on `panelView`, not on what's being asserted. */
async function getDrawState(page) {
  return page.evaluate(() => {
    const map = document.querySelector('webmapx-map');
    const tool = map?.querySelector('webmapx-draw-tool');
    if (!tool) throw new Error('Draw tool not found');

    const layers = Array.isArray(tool.drawLayers) ? tool.drawLayers : [];
    const features = Array.isArray(tool.features) ? tool.features : [];
    const activeLayerId = tool.pickedType ? tool.activeLayerIds?.[tool.pickedType] : null;
    const activeLayer = layers.find((layer) => layer.id === activeLayerId) ?? null;

    return {
      active: Boolean(tool.active),
      drawLayerCount: layers.length,
      featureCount: features.length,
      selectedFeatureId: tool.selectedFeatureId ?? null,
      layerName: activeLayer?.name ?? null,
      layerFeatureCount: activeLayer ? features.filter((f) => f.layerId === activeLayer.id).length : 0,
    };
  });
}

export async function run({ page, engine, baseUrl }) {
  // The suite owns its config. Without this it ran against whatever
  // index.html loads — `config/demo.json`, a checkout of the configs
  // repository — and CLAUDE.md's promise that "editing a real config cannot
  // redden the suite" was not true here: the day that config's toolbar lost
  // its draw button, this suite started failing on every engine with
  // "Draw toolbar button not found", pointing at the app rather than at the
  // config it happened to be reading.
  await page.goto(appUrl(baseUrl), { waitUntil: 'domcontentloaded' });
  const pointLayerName = 'points';
  const lineLayerName = 'lines';
  const polygonLayerName = 'polygons';
  const pointName = 'Test Point 1';
  const pointName2 = 'Test Point 2';
  const lineName = 'Test Line 1';
  const lineName2 = 'Test Line 2';
  const polygonName = 'Test Polygon 1';
  const polygonName2 = 'Test Polygon 2';

  const step = async (label, fn) => {
    try {
      await fn();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`${label}: ${message}`, { cause: error });
    }
  };

  await step('wait map ready', async () => {
    await waitForMapReady(page);
  });

  await step('activate draw tool', async () => {
    await toggleDrawTool(page);
  });

  await step('wait draw tool active', async () => {
    await page.waitForFunction(() => {
      const map = document.querySelector('webmapx-map');
      const tool = map?.querySelector('webmapx-draw-tool');
      return Boolean(tool?.active);
    }, undefined, { timeout: 10_000 });
  });

  await step('opens onto the type picker', async () => {
    await page.waitForFunction(() => {
      const map = document.querySelector('webmapx-map');
      const tool = map?.querySelector('webmapx-draw-tool');
      return tool?.panelView === 'type';
    }, undefined, { timeout: 10_000 });
  });

  await step('create point layer directly in its editing session', async () => {
    await createLayerDirect(page, 'Point', pointLayerName, 'Point', 'geo-fill', 'draw-point');
  });

  await step('add point feature', async () => {
    await emitMapClickAtCenter(page);
  });

  await step('wait point feature count', async () => {
    await waitForFeatureCount(page, 1);
  });

  const afterDraw = await getDrawState(page);
  if (afterDraw.layerName !== pointLayerName) {
    fail(`Expected layer name "${pointLayerName}", got "${afterDraw.layerName}".`);
  }
  if (afterDraw.featureCount !== 1 || afterDraw.layerFeatureCount !== 1) {
    fail(`Expected one feature after drawing, got featureCount=${afterDraw.featureCount}, layerFeatureCount=${afterDraw.layerFeatureCount}.`);
  }

  await step('switch background to Google Satellite via catalog tool', async () => {
    await setBackgroundToGoogleSatelliteViaCatalogTool(page);
  });

  await step('verify drawn point remains visible on top after basemap switch', async () => {
    await assertActiveDrawLayerRenderedAtMapCenter(page, 'Point', engine);
  });

  await step('set point name', async () => {
    await selectLatestFeatureInLayer(page, pointLayerName);
    await setSelectedFeatureName(page, pointName);
    await waitForLayerFeatureName(page, pointLayerName, pointName);
  });

  await step('create line layer and feature', async () => {
    await createLayerDirect(page, 'LineString', lineLayerName, 'LineString', 'slash-lg', 'draw-line');
    await emitMapDrawSequence(page, 'line');
    await waitForFeatureCount(page, 2);
  });

  await step('set line name', async () => {
    await selectLatestFeatureInLayer(page, lineLayerName);
    await setSelectedFeatureName(page, lineName);
    await waitForLayerFeatureName(page, lineLayerName, lineName);
  });

  await step('create polygon layer and feature', async () => {
    await createLayerDirect(page, 'Polygon', polygonLayerName, 'Polygon', 'pentagon', 'draw-polygon');
    await emitMapDrawSequence(page, 'polygon');
    await waitForFeatureCount(page, 3);
  });

  await step('set polygon name', async () => {
    await selectLatestFeatureInLayer(page, polygonLayerName);
    await setSelectedFeatureName(page, polygonName);
    await waitForLayerFeatureName(page, polygonLayerName, polygonName);
  });

  await step('close draw tool', async () => {
    await toggleDrawTool(page);
    await page.waitForFunction(() => {
      const map = document.querySelector('webmapx-map');
      const tool = map?.querySelector('webmapx-draw-tool');
      return Boolean(tool && !tool.active);
    }, undefined, { timeout: 10_000 });
  });

  await step('re-activate draw tool for second session', async () => {
    await toggleDrawTool(page);
    await page.waitForFunction(() => {
      const map = document.querySelector('webmapx-map');
      const tool = map?.querySelector('webmapx-draw-tool');
      return Boolean(tool && tool.active);
    }, undefined, { timeout: 10_000 });
  });

  await step('reopening resumes the last editing session, not the type picker', async () => {
    // The panel was left mid-edit on the polygon layer, and panelView/pickedType
    // deliberately survive deactivate/activate — reopening the tool should not
    // dump the user back at "what do you want to draw?".
    await page.waitForFunction(() => {
      const map = document.querySelector('webmapx-map');
      const tool = map?.querySelector('webmapx-draw-tool');
      return tool?.panelView === 'editing' && tool?.pickedType === 'Polygon';
    }, undefined, { timeout: 10_000 });
  });

  await step('add second point without dialog', async () => {
    // Navigating to the points layer pauses the still-active polygon layer
    // rather than destroying it — resumed later via the same "Start editing" path.
    await navigateToStartEditingLayer(page, 'Point', pointLayerName);
    await enterDrawMode(page, 'geo-fill', 'draw-point');
    await emitMapClickAtCenter(page);
    await waitForFeatureCount(page, 4);
  });

  await step('drawn point is selected for its attribute panel, but not armed for dragging', async () => {
    // Regression check, two parts: `selectedFeatureId` is set right after
    // finishing so the attribute panel shows immediately (otherwise you'd
    // have to switch to Select mode just to type in a value you could set
    // right away) — but `editState` must stay 'none', not 'editing'/
    // 'selected', or a drag handle gets armed while `mode` is still
    // 'draw-point' (ready for the next one). That mode's own click handling
    // claims every subsequent click for placing more points, so a click
    // meant to move the just-drawn feature would instead add an unwanted
    // extra one — arming a handle on top of that is what caused it.
    const state = await page.evaluate(() => {
      const tool = document.querySelector('webmapx-draw-tool');
      return { selectedFeatureId: tool?.selectedFeatureId ?? null, editState: tool?.editState ?? null };
    });
    if (!state.selectedFeatureId) fail('Expected the drawn point to be selected (for its attribute panel)');
    if (state.editState !== 'none') fail(`Expected editState 'none' right after drawing, got '${state.editState}'`);
  });

  await step('select and name the second point', async () => {
    await selectLatestFeatureInLayer(page, pointLayerName);
    await setSelectedFeatureName(page, pointName2);
    await waitForLayerFeatureName(page, pointLayerName, pointName2);
  });

  await step('point feature has auto-computed special attributes', async () => {
    const result = await page.evaluate(() => {
      const tool = document.querySelector('webmapx-draw-tool');
      if (!Array.isArray(tool?.features) || tool.features.length === 0) return { ok: false, reason: 'no features' };
      const feature = tool.features[0];
      if (!feature?.properties) return { ok: false, reason: 'no properties' };
      const props = feature.properties;
      if (typeof props.id !== 'number' || props.id < 1) return { ok: false, reason: `bad id: ${props.id}` };
      return { ok: true };
    });
    if (!result.ok) fail(`Special attributes check failed: ${result.reason}`);
  });

  await step('add second line without dialog', async () => {
    await navigateToStartEditingLayer(page, 'LineString', lineLayerName);
    await enterDrawMode(page, 'slash-lg', 'draw-line');
    await emitMapDrawSequence(page, 'line');
    await waitForFeatureCount(page, 5);
    await selectLatestFeatureInLayer(page, lineLayerName);
    await setSelectedFeatureName(page, lineName2);
    await waitForLayerFeatureName(page, lineLayerName, lineName2);
  });

  await step('add second polygon without dialog', async () => {
    // The polygon layer was paused when we left it for points/lines above —
    // this is the resume path, not a fresh "Add new".
    await navigateToStartEditingLayer(page, 'Polygon', polygonLayerName);
    await enterDrawMode(page, 'pentagon', 'draw-polygon');
    await emitMapDrawSequence(page, 'polygon');
    await waitForFeatureCount(page, 6);
    await selectLatestFeatureInLayer(page, polygonLayerName);
    await setSelectedFeatureName(page, polygonName2);
    await waitForLayerFeatureName(page, polygonLayerName, polygonName2);
  });

  await step('a polygon layer is one layer that draws both its fill and its outline', async () => {
    // It used to be two: `<id>` for the fill and `<id>-outline` for the line,
    // off one source. That made everything addressing "the layer" reach half of
    // it — hiding the layer left the outline drawn on the map, which is how the
    // split was found. A polygon layer is now one composite, so the assertion is
    // about behaviour rather than about how many entries it takes.
    const result = await page.evaluate(async ({ polyName }) => {
      const map = document.querySelector('webmapx-map');
      const tool = map?.querySelector('webmapx-draw-tool');
      const adapter = await map?.getAdapterAsync?.();
      if (!adapter) return { ok: false, reason: 'no adapter' };

      const polyLayer = (Array.isArray(tool?.drawLayers) ? tool.drawLayers : [])
        .find(l => l.name === polyName);
      if (!polyLayer) return { ok: false, reason: `draw layer "${polyName}" not found` };

      const mapLayers = adapter.store.getState().mapLayers ?? {};
      if (mapLayers[`${polyLayer.id}-outline`]) {
        return { ok: false, reason: 'the outline is still a layer of its own' };
      }
      if (!mapLayers[polyLayer.id]) {
        return { ok: false, reason: `polygon layer "${polyLayer.id}" not in mapLayers` };
      }

      // Both paint aspects are there, as sublayers of the one layer.
      const config = adapter.layerConfigStore?.get?.(polyLayer.id)?.config
        ?? adapter.getLayerConfig?.(polyLayer.id)
        ?? null;
      const subTypes = Array.isArray(config?.layers) ? config.layers.map(l => l.type).sort() : null;
      if (!subTypes) return { ok: false, reason: 'polygon layer is not a composite (no sublayers)' };
      if (subTypes.join(',') !== 'fill,line') {
        return { ok: false, reason: `expected fill+line sublayers, got [${subTypes.join(', ')}]` };
      }

      // Each sublayer names itself. Without a label the legend falls back to the
      // sublayer id, and a generated id reads as "layer 1788374721345 xyzs map
      // fill" where the reader wanted the word "fill".
      const labels = config.layers.map(l => l?.metadata?.label ?? null);
      if (labels.some(l => typeof l !== 'string' || l.length === 0)) {
        return { ok: false, reason: `sublayers must carry a label, got [${labels.join(', ')}]` };
      }
      if (labels.some(l => l.includes(polyLayer.id))) {
        return { ok: false, reason: `a sublayer label still contains the generated id: [${labels.join(', ')}]` };
      }

      // And hiding the layer hides all of it — the bug this shape prevents.
      adapter.setLayerVisibility(polyLayer.id, false);
      const hidden = adapter.store.getState().mapLayers?.[polyLayer.id]?.visible;
      adapter.setLayerVisibility(polyLayer.id, true);
      if (hidden !== false) return { ok: false, reason: 'hiding the polygon layer did not take' };

      return { ok: true };
    }, { polyName: polygonLayerName });
    if (!result.ok) fail(`Polygon composite check: ${result.reason}`);
  });

  await step('close draw tool after second session', async () => {
    await toggleDrawTool(page);
    await page.waitForFunction(() => {
      const map = document.querySelector('webmapx-map');
      const tool = map?.querySelector('webmapx-draw-tool');
      return Boolean(tool && !tool.active);
    }, undefined, { timeout: 10_000 });
  });

  const pointSummary = await getMapLayerAndSourceSummary(page, pointLayerName);
  if (!pointSummary.foundLayer) {
    fail(`Expected map to contain an extra layer named "${pointLayerName}" after closing draw tool.`);
  }
  if (pointSummary.featureCount !== 2) {
    fail(`Expected map source for layer "${pointLayerName}" to have exactly 2 features, got ${pointSummary.featureCount}.`);
  }
  assertNamesPresent(pointSummary, pointLayerName, [pointName, pointName2]);

  const lineSummary = await getMapLayerAndSourceSummary(page, lineLayerName);
  if (!lineSummary.foundLayer) {
    fail(`Expected map to contain an extra layer named "${lineLayerName}" after closing draw tool.`);
  }
  if (lineSummary.featureCount !== 2) {
    fail(`Expected map source for layer "${lineLayerName}" to have exactly 2 features, got ${lineSummary.featureCount}.`);
  }
  assertNamesPresent(lineSummary, lineLayerName, [lineName, lineName2]);

  const polygonSummary = await getMapLayerAndSourceSummary(page, polygonLayerName);
  if (!polygonSummary.foundLayer) {
    fail(`Expected map to contain an extra layer named "${polygonLayerName}" after closing draw tool.`);
  }
  if (polygonSummary.featureCount !== 2) {
    fail(`Expected map source for layer "${polygonLayerName}" to have exactly 2 features, got ${polygonSummary.featureCount}.`);
  }
  assertNamesPresent(polygonSummary, polygonLayerName, [polygonName, polygonName2]);
}

export const engines = ['maplibre', 'openlayers', 'leaflet', 'cesium'];
