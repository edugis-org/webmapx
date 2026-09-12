import { appUrl } from './lib/fixture-config.mjs';

/**
 * UI Test: Search -> Persist -> Draw Tool integration
 *
 * Tests that:
 * 1. Search for "Utrecht" returns results
 * 2. Persisting a search result creates a layer on the map
 * 3. The persisted layer can be selected in the draw tool
 * 4. After selecting the layer, the polygon data is loaded into the draw tool
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

async function openSearchTool(page) {
  // Toolbar buttons exist once the config is applied, but the tool component behind them
  // loads lazily — wait for it rather than assuming map-ready implies toolbar-fully-built.
  await page.waitForFunction(() => {
    return Boolean(document.querySelector('webmapx-toolbar sl-button[name="search"]'))
      && customElements.get('webmapx-search-tool') !== undefined;
  }, undefined, { timeout: 15_000 });

  await page.evaluate(() => {
    const searchButton = document.querySelector('webmapx-toolbar sl-button[name="search"]');
    if (!searchButton) throw new Error('Search toolbar button not found');
    searchButton.click();
  });

  // Wait for search tool to be active
  await page.waitForFunction(() => {
    const map = document.querySelector('webmapx-map');
    const tool = map?.querySelector('webmapx-search-tool');
    return Boolean(tool?.active);
  }, undefined, { timeout: 10_000 });
}

async function searchForUtrecht(page) {
  await page.evaluate(async () => {
    const map = document.querySelector('webmapx-map');
    const tool = map?.querySelector('webmapx-search-tool');
    if (!tool?.shadowRoot) throw new Error('Search tool shadow root unavailable');

    const input = tool.shadowRoot.querySelector('input[placeholder*="Search"]');
    if (!input) throw new Error('Search input not found');

    // Clear and type search query
    input.value = 'Utrecht';
    input.dispatchEvent(new Event('input', { bubbles: true }));

    // Click Go button
    const goButton = tool.shadowRoot.querySelector('button');
    if (!goButton) throw new Error('Go button not found');
    goButton.click();
  });

  // Wait for search results to load
  await page.waitForFunction(() => {
    const map = document.querySelector('webmapx-map');
    const tool = map?.querySelector('webmapx-search-tool');
    if (!tool?.shadowRoot) return false;
    const results = tool.shadowRoot.querySelectorAll('.result-item');
    return results.length > 0;
  }, undefined, { timeout: 30_000 });
}

/**
 * Index of the first polygon result. The suite drives the *polygon* draw mode, so it needs a
 * polygon-geometry result — but the provider's ordering is not stable: Nominatim returns a
 * different mix/order per call for "Utrecht" (a node in South Africa, relations in Guyana and
 * the Netherlands), and the search tool's in-view ranking cannot break the tie at world zoom
 * where every candidate is inside the viewport. Picking index 0 blindly made the suite fail
 * whenever a point result happened to sort first.
 */
async function findPolygonResultIndex(page) {
  return page.evaluate(() => {
    const map = document.querySelector('webmapx-map');
    const tool = map?.querySelector('webmapx-search-tool');
    const features = tool?.results?.features ?? [];
    return features.findIndex(f => f.geometry?.type === 'Polygon' || f.geometry?.type === 'MultiPolygon');
  });
}

async function getSearchResultCount(page) {
  return page.evaluate(() => {
    const map = document.querySelector('webmapx-map');
    const tool = map?.querySelector('webmapx-search-tool');
    if (!tool?.shadowRoot) return 0;
    return tool.shadowRoot.querySelectorAll('.result-item').length;
  });
}

async function clickSearchResult(page, index) {
  await page.evaluate(({ idx }) => {
    const map = document.querySelector('webmapx-map');
    const tool = map?.querySelector('webmapx-search-tool');
    if (!tool?.shadowRoot) throw new Error('Search tool shadow root unavailable');

    const results = tool.shadowRoot.querySelectorAll('.result-item');
    if (idx >= results.length) throw new Error(`Result index ${idx} out of bounds (${results.length} results)`);

    // Click on the result text area (not checkbox) to zoom
    const clickArea = results[idx].querySelector('div[style*="flex:1"]');
    if (clickArea) {
      clickArea.click();
    } else {
      results[idx].click();
    }
  }, { idx: index });

  // Wait a moment for the map to pan/zoom
  await page.waitForTimeout(1000);
}

async function persistSearchResult(page, index) {
  await page.evaluate(({ idx }) => {
    const map = document.querySelector('webmapx-map');
    const tool = map?.querySelector('webmapx-search-tool');
    if (!tool?.shadowRoot) throw new Error('Search tool shadow root unavailable');

    const results = tool.shadowRoot.querySelectorAll('.result-item');
    if (idx >= results.length) throw new Error(`Result index ${idx} out of bounds`);

    const checkbox = results[idx].querySelector('sl-checkbox');
    if (!checkbox) throw new Error('Checkbox not found in search result');

    // Only click if not already checked
    if (!checkbox.checked) {
      checkbox.click();
    }
  }, { idx: index });

  // Wait for layer to be created
  await page.waitForFunction(({ idx }) => {
    const map = document.querySelector('webmapx-map');
    const tool = map?.querySelector('webmapx-search-tool');
    if (!tool?.shadowRoot) return false;

    const results = tool.shadowRoot.querySelectorAll('.result-item');
    const checkbox = results[idx]?.querySelector('sl-checkbox');
    return checkbox?.checked === true;
  }, { idx: index }, { timeout: 10_000 });
}

async function openDrawTool(page) {
  await page.evaluate(() => {
    const drawButton = document.querySelector('webmapx-toolbar sl-button[name="draw"]');
    if (!drawButton) throw new Error('Draw toolbar button not found');
    drawButton.click();
  });

  // Wait for draw tool to be active
  await page.waitForFunction(() => {
    const map = document.querySelector('webmapx-map');
    const tool = map?.querySelector('webmapx-draw-tool');
    return Boolean(tool?.active);
  }, undefined, { timeout: 10_000 });
}

async function closeDrawTool(page) {
  await page.evaluate(() => {
    const drawButton = document.querySelector('webmapx-toolbar sl-button[name="draw"]');
    if (!drawButton) throw new Error('Draw toolbar button not found');
    drawButton.click();
  });

  await page.waitForFunction(() => {
    const map = document.querySelector('webmapx-map');
    const tool = map?.querySelector('webmapx-draw-tool');
    return Boolean(tool && !tool.active);
  }, undefined, { timeout: 10_000 });
}

async function clickPolygonModeAndSelectUtrechtLayer(page) {
  const result = await page.evaluate(async () => {
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

    // The panel opens onto a type picker, not straight into polygon mode —
    // pick "Polygons", where the persisted Utrecht layer shows up under
    // "From the map" with its own "Start editing" button. No dialog: "Add
    // new" is only for a genuinely new, empty layer now.
    const polygonCard = await waitFor(
      () => tool.shadowRoot.querySelector('.type-card[data-type="Polygon"]'),
      5_000,
      'polygon type card'
    );
    polygonCard.click();
    await waitFor(() => tool.panelView === 'layers' && tool.pickedType === 'Polygon', 5_000, 'polygon layer picker');

    await waitFor(
      () => tool.catalogLayerOptions?.some(o => o.label?.toLowerCase().includes('utrecht')),
      10_000,
      'Utrecht layer in catalogLayerOptions'
    );

    const rows = await waitFor(
      () => {
        const list = Array.from(tool.shadowRoot.querySelectorAll('.layer-row'));
        return list.length > 0 ? list : null;
      },
      5_000,
      'layer rows'
    );
    const utrechtRow = rows.find(r => r.querySelector('.layer-name')?.textContent?.toLowerCase().includes('utrecht'));
    if (!utrechtRow) {
      const allNames = rows.map(r => r.querySelector('.layer-name')?.textContent?.trim());
      throw new Error(`Utrecht layer row not found. Available: ${JSON.stringify(allNames)}`);
    }

    const startBtn = Array.from(utrechtRow.querySelectorAll('sl-button'))
      .find(b => (b.textContent ?? '').includes('Start editing'));
    if (!startBtn) throw new Error('Start editing button not found on Utrecht row');
    startBtn.click();

    return { success: true };
  });

  if (!result.success) {
    fail('Failed to select Utrecht layer in draw tool');
  }

  // Wait for the layer to be active and features to be loaded
  await page.waitForFunction(() => {
    const map = document.querySelector('webmapx-map');
    const tool = map?.querySelector('webmapx-draw-tool');
    if (!tool) return false;

    // Check drawLayers for borrowed polygon layer
    const drawLayers = tool.drawLayers || [];
    const polygonLayer = drawLayers.find(l => l.type === 'Polygon' && l.borrowedSourceId);
    if (!polygonLayer) return false;

    // Check features array
    const features = tool.features || [];
    const polygonFeatures = features.filter(f => f.type === 'Polygon' || f.type === 'MultiPolygon');
    return polygonFeatures.length > 0;
  }, undefined, { timeout: 15_000 });
}

async function verifyUtrechtDataInDrawTool(page) {
  const result = await page.evaluate(() => {
    const map = document.querySelector('webmapx-map');
    const tool = map?.querySelector('webmapx-draw-tool');
    if (!tool) return { ok: false, reason: 'Draw tool not found' };

    const features = tool.features || [];
    const polygonFeatures = features.filter(f =>
      f.type === 'Polygon' || f.type === 'MultiPolygon'
    );

    if (polygonFeatures.length === 0) {
      return { ok: false, reason: 'No polygon features found in draw tool' };
    }

    // Check that the polygon has coordinates
    const hasCoordinates = polygonFeatures.some(f =>
      f.coordinates &&
      Array.isArray(f.coordinates) &&
      f.coordinates.length > 0
    );

    if (!hasCoordinates) {
      return { ok: false, reason: 'Polygon features have no coordinates' };
    }

    // Check that there's an active polygon layer
    const activePolygonLayerId = tool.activeLayerIds?.['Polygon'];
    if (!activePolygonLayerId) {
      return { ok: false, reason: 'No active polygon layer' };
    }

    // Find the draw layer config
    const drawLayers = tool.drawLayers || [];
    const activeLayer = drawLayers.find(l => l.id === activePolygonLayerId);
    if (!activeLayer) {
      return { ok: false, reason: 'Active layer config not found' };
    }

    // Check that it has a borrowedSourceId (indicates it was borrowed from a map layer)
    if (!activeLayer.borrowedSourceId) {
      return { ok: false, reason: 'Active layer does not have borrowedSourceId' };
    }

    return {
      ok: true,
      featureCount: polygonFeatures.length,
      activeLayerId: activePolygonLayerId,
      borrowedSourceId: activeLayer.borrowedSourceId
    };
  });

  return result;
}

async function step(name, fn) {
  try {
    await fn();
  } catch (error) {
    throw new Error(`Step "${name}" failed: ${error.message}`, { cause: error });
  }
}

export async function run({ page, engine, baseUrl }) {
  console.log(`  Running search-persist-draw test for engine: ${engine}`);

  // The suite owns its config. Without this it ran against whatever
  // index.html loads — `config/demo.json`, a checkout of the configs
  // repository — and CLAUDE.md's promise that "editing a real config cannot
  // redden the suite" was not true here: the day that config's toolbar lost
  // its draw button, this suite started failing on every engine with
  // "Draw toolbar button not found", pointing at the app rather than at the
  // config it happened to be reading.
  await page.goto(appUrl(baseUrl), { waitUntil: 'domcontentloaded' });


  await step('wait for map ready', async () => {
    await waitForMapReady(page);
  });

  await step('open search tool', async () => {
    await openSearchTool(page);
  });

  await step('search for Utrecht', async () => {
    await searchForUtrecht(page);
  });

  let resultCount;
  await step('verify search results exist', async () => {
    resultCount = await getSearchResultCount(page);
    if (resultCount === 0) {
      fail('No search results for "Utrecht"');
    }
    console.log(`    Found ${resultCount} search results for "Utrecht"`);
  });

  let resultIndex;
  await step('pick a polygon search result', async () => {
    resultIndex = await findPolygonResultIndex(page);
    if (resultIndex < 0) {
      fail(`No polygon result among ${resultCount} results for "Utrecht"`);
    }
    console.log(`    Using polygon search result at index ${resultIndex}`);
  });

  await step('click search result to zoom', async () => {
    await clickSearchResult(page, resultIndex);
  });

  await step('persist search result (check checkbox)', async () => {
    await persistSearchResult(page, resultIndex);
  });

  // Give time for the layer to be fully created
  await page.waitForTimeout(500);

  await step('open draw tool', async () => {
    await openDrawTool(page);
  });

  await step('click polygon mode and select Utrecht layer', async () => {
    await clickPolygonModeAndSelectUtrechtLayer(page);
  });

  let verifyResult;
  await step('verify Utrecht data exists in draw tool', async () => {
    verifyResult = await verifyUtrechtDataInDrawTool(page);
    if (!verifyResult.ok) {
      fail(verifyResult.reason);
    }
    console.log(`    Utrecht polygon loaded: ${verifyResult.featureCount} feature(s), borrowedSourceId: ${verifyResult.borrowedSourceId}`);
  });

  await step('close draw tool', async () => {
    await closeDrawTool(page);
  });

  // Verify the original layer is restored after closing draw tool
  await step('verify Utrecht layer restored after closing draw tool', async () => {
    const restored = await page.evaluate(() => {
      const map = document.querySelector('webmapx-map');
      if (!map) return { ok: false, reason: 'Map not found' };

      const adapter = map.adapter;
      if (!adapter) return { ok: false, reason: 'Adapter not found' };

      const state = adapter.store.getState();
      const mapLayers = state.mapLayers || {};

      // Find a layer that looks like a persisted Utrecht layer
      const utrechtLayers = Object.entries(mapLayers).filter(([id, meta]) => {
        return id.includes('search-persist') ||
               (meta.label && meta.label.toLowerCase().includes('utrecht'));
      });

      if (utrechtLayers.length === 0) {
        return { ok: false, reason: 'No Utrecht layer found in mapLayers' };
      }

      return { ok: true, layerCount: utrechtLayers.length };
    });

    if (!restored.ok) {
      fail(restored.reason);
    }
    console.log(`    Utrecht layer restored: ${restored.layerCount} layer(s) found`);
  });
}

// Run on all engines
export const engines = ['maplibre', 'openlayers', 'leaflet', 'cesium'];
