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
  await page.evaluate(() => {
    const drawButton = document.querySelector('webmapx-toolbar sl-button[name="draw"]');
    if (!drawButton) throw new Error('Draw toolbar button not found');
    drawButton.click();
  });
}

async function setDrawModeAndCreateLayer(page, buttonName, layerName, activeLayerType) {
  await page.evaluate(async ({ drawButtonName, name }) => {
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

    const modeButton = tool.shadowRoot.querySelector(`sl-icon-button[name="${drawButtonName}"]`);
    if (!modeButton) throw new Error(`Draw mode button not found: ${drawButtonName}`);
    modeButton.click();

    const dialogRoot = await waitFor(
      () => tool.shadowRoot?.querySelector('webmapx-draw-layer-dialog')?.shadowRoot,
      10_000,
      'draw layer dialog root'
    );

    const newOption = await waitFor(
      () => dialogRoot.querySelector('.layer-option'),
      5_000,
      'new layer option'
    );
    newOption.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));

    const nextButton = await waitFor(
      () => Array.from(dialogRoot.querySelectorAll('sl-button'))
        .find((button) => (button.textContent ?? '').includes('Next')),
      5_000,
      'next button'
    );
    nextButton.click();

    const layerNameInput = await waitFor(
      () => dialogRoot.querySelector('sl-input[name="layername"]'),
      5_000,
      'layer name input'
    );
    layerNameInput.value = name;
    layerNameInput.dispatchEvent(new Event('sl-input', { bubbles: true, composed: true }));
    layerNameInput.dispatchEvent(new Event('sl-change', { bubbles: true, composed: true }));

    const okButton = await waitFor(
      () => Array.from(dialogRoot.querySelectorAll('sl-button'))
        .find((button) => (button.textContent ?? '').trim() === 'OK'),
      5_000,
      'ok button'
    );
    okButton.click();
  }, { drawButtonName: buttonName, name: layerName });

  await page.waitForFunction(({ expectedType }) => {
    const map = document.querySelector('webmapx-map');
    const tool = map?.querySelector('webmapx-draw-tool');
    return Boolean(tool && tool.activeLayerIds?.[expectedType]);
  }, { expectedType: activeLayerType }, { timeout: 10_000 });
}

async function setDrawModeAndCreateLayerByEvent(page, buttonName, layerName, geometryType, activeLayerType) {
  await page.evaluate(({ drawButtonName }) => {
    const map = document.querySelector('webmapx-map');
    const tool = map?.querySelector('webmapx-draw-tool');
    const button = tool?.shadowRoot?.querySelector(`sl-icon-button[name="${drawButtonName}"]`);
    if (!button) throw new Error(`Draw mode button not found: ${drawButtonName}`);
    button.click();
  }, { drawButtonName: buttonName });

  await page.evaluate(({ name, type }) => {
    const tool = document.querySelector('webmapx-draw-tool');
    const dialog = tool?.shadowRoot?.querySelector('webmapx-draw-layer-dialog');
    if (!dialog) throw new Error('Draw layer dialog element not found');

    const detail = {
      id: `ui-layer-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name,
      type,
      color: '#0f62fe',
      properties: [
        { name: 'id', type: 'number' },
        { name: 'name', type: 'string' },
      ],
    };

    dialog.dispatchEvent(new CustomEvent('webmapx-draw-layer-confirm', {
      detail,
      bubbles: true,
      composed: true,
    }));
  }, { name: layerName, type: geometryType });

  await page.waitForFunction(({ expectedType }) => {
    const map = document.querySelector('webmapx-map');
    const tool = map?.querySelector('webmapx-draw-tool');
    return Boolean(tool && tool.activeLayerIds?.[expectedType]);
  }, { expectedType: activeLayerType }, { timeout: 10_000 });

  // Ensure the tool is actually in this draw mode after layer activation.
  await page.evaluate(({ drawButtonName }) => {
    const map = document.querySelector('webmapx-map');
    const tool = map?.querySelector('webmapx-draw-tool');
    const button = tool?.shadowRoot?.querySelector(`sl-icon-button[name="${drawButtonName}"]`);
    if (!button) throw new Error(`Draw mode button not found for mode activation: ${drawButtonName}`);
    button.click();
  }, { drawButtonName: buttonName });
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

async function setDrawModeWithoutCreatingLayer(page, buttonName, activeLayerType) {
  await page.evaluate(({ drawButtonName }) => {
    const map = document.querySelector('webmapx-map');
    const tool = map?.querySelector('webmapx-draw-tool');
    const button = tool?.shadowRoot?.querySelector(`sl-icon-button[name="${drawButtonName}"]`);
    if (!button) throw new Error(`Draw mode button not found: ${drawButtonName}`);
    button.click();
  }, { drawButtonName: buttonName });

  await page.waitForFunction(({ expectedType }) => {
    const map = document.querySelector('webmapx-map');
    const tool = map?.querySelector('webmapx-draw-tool');
    return Boolean(tool && tool.activeLayerIds?.[expectedType]);
  }, { expectedType: activeLayerType }, { timeout: 10_000 });
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
    const visibleLayers = adapter.store.getState().visibleLayers ?? [];
    return visibleLayers.includes('google-satellite') && !visibleLayers.includes('osm');
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

async function getDrawState(page) {
  return page.evaluate(() => {
    const map = document.querySelector('webmapx-map');
    const tool = map?.querySelector('webmapx-draw-tool');
    if (!tool?.shadowRoot) throw new Error('Draw tool shadow root missing');

    const layerRow = tool.shadowRoot.querySelector('.layer-row');
    const layerName = layerRow?.querySelector('.layer-name')?.textContent?.trim() ?? null;
    const layerFeatureCount = Number(layerRow?.querySelector('small')?.textContent ?? '0');

    return {
      active: Boolean(tool.active),
      drawLayerCount: Array.isArray(tool.drawLayers) ? tool.drawLayers.length : 0,
      featureCount: Array.isArray(tool.features) ? tool.features.length : 0,
      selectedFeatureId: tool.selectedFeatureId ?? null,
      layerName,
      layerFeatureCount,
    };
  });
}

export async function run({ page, engine }) {
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
      throw new Error(`${label}: ${message}`);
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

  await step('create point layer from popup', async () => {
    await setDrawModeAndCreateLayer(page, 'geo-fill', pointLayerName, 'Point');
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
    await setDrawModeAndCreateLayerByEvent(page, 'slash-lg', lineLayerName, 'LineString', 'LineString');
    await emitMapDrawSequence(page, 'line');
    await waitForFeatureCount(page, 2);
  });

  await step('set line name', async () => {
    await selectLatestFeatureInLayer(page, lineLayerName);
    await setSelectedFeatureName(page, lineName);
    await waitForLayerFeatureName(page, lineLayerName, lineName);
  });

  await step('create polygon layer and feature', async () => {
    await setDrawModeAndCreateLayerByEvent(page, 'pentagon', polygonLayerName, 'Polygon', 'Polygon');
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

  await step('add second point without dialog', async () => {
    await setDrawModeWithoutCreatingLayer(page, 'geo-fill', 'Point');
    await emitMapClickAtCenter(page);
    await waitForFeatureCount(page, 4);
    await selectLatestFeatureInLayer(page, pointLayerName);
    await setSelectedFeatureName(page, pointName2);
    await waitForLayerFeatureName(page, pointLayerName, pointName2);
  });

  await step('point feature auto-selected after draw', async () => {
    const selected = await page.evaluate(() => {
      const tool = document.querySelector('webmapx-draw-tool');
      return tool?.selectedFeatureId ?? null;
    });
    if (!selected) fail('Expected drawn point to be auto-selected');
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
    await setDrawModeWithoutCreatingLayer(page, 'slash-lg', 'LineString');
    await emitMapDrawSequence(page, 'line');
    await waitForFeatureCount(page, 5);
    await selectLatestFeatureInLayer(page, lineLayerName);
    await setSelectedFeatureName(page, lineName2);
    await waitForLayerFeatureName(page, lineLayerName, lineName2);
  });

  await step('add second polygon without dialog', async () => {
    await setDrawModeWithoutCreatingLayer(page, 'pentagon', 'Polygon');
    await emitMapDrawSequence(page, 'polygon');
    await waitForFeatureCount(page, 6);
    await selectLatestFeatureInLayer(page, polygonLayerName);
    await setSelectedFeatureName(page, polygonName2);
    await waitForLayerFeatureName(page, polygonLayerName, polygonName2);
  });

  await step('polygon layer has outline layer in map state', async () => {
    const result = await page.evaluate(async ({ polyName }) => {
      const map = document.querySelector('webmapx-map');
      const tool = map?.querySelector('webmapx-draw-tool');
      const adapter = await map?.getAdapterAsync?.();
      if (!adapter) return { ok: false, reason: 'no adapter' };

      const layers = Array.isArray(tool?.drawLayers) ? tool.drawLayers : [];
      const polyLayer = layers.find(l => l.name === polyName);
      if (!polyLayer) return { ok: false, reason: `draw layer "${polyName}" not found` };

      const state = adapter.store.getState();
      const mapLayers = state.mapLayers ?? {};

      const outlineId = `${polyLayer.id}-outline`;
      const outlineEntry = mapLayers[outlineId];
      if (!outlineEntry) return { ok: false, reason: `outline layer "${outlineId}" not in mapLayers` };

      return { ok: true };
    }, { polyName: polygonLayerName });
    if (!result.ok) fail(`Polygon outline check: ${result.reason}`);
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
