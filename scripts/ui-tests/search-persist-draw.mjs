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

async function getPersistedLayerSourceId(page, index) {
  return page.evaluate(({ idx }) => {
    const map = document.querySelector('webmapx-map');
    const tool = map?.querySelector('webmapx-search-tool');
    if (!tool) return null;

    // Access the persistedMap via the results
    const results = tool.results?.features;
    if (!results || idx >= results.length) return null;

    const feature = results[idx];
    // The sourceId follows a pattern based on osm_type and osm_id
    const props = feature.properties || {};
    if (props.osm_id || props.osm_type) {
      return `search-persist-osm-${props.osm_type ?? ''}-${props.osm_id ?? ''}`;
    }
    return null;
  }, { idx: index });
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

    // Click polygon mode button
    const polygonButton = tool.shadowRoot.querySelector('sl-icon-button[name="pentagon"]');
    if (!polygonButton) throw new Error('Polygon mode button not found');
    polygonButton.click();

    // Wait for layer dialog to open
    const dialogRoot = await waitFor(
      () => tool.shadowRoot?.querySelector('webmapx-draw-layer-dialog')?.shadowRoot,
      10_000,
      'draw layer dialog root'
    );

    // Wait for dialog to be ready
    await new Promise(r => setTimeout(r, 500));

    // Get dialog's mapLayers to see what's available
    // Wait for map layers to appear in the dialog
    await waitFor(
      () => {
        const d = tool.shadowRoot.querySelector('webmapx-draw-layer-dialog');
        return (d?.mapLayers || []).length > 0;
      },
      10_000,
      'Utrecht layer in dialog mapLayers'
    );

    // Get the dialog's mapLayers
    const layerDialog = tool.shadowRoot.querySelector('webmapx-draw-layer-dialog');
    const mapLayers = layerDialog?.mapLayers || [];

    // Find Utrecht layer in mapLayers
    const utrechtMapLayer = mapLayers.find(l => l.label?.toLowerCase().includes('utrecht'));
    if (!utrechtMapLayer) {
      throw new Error(`Utrecht layer not found in mapLayers. Available: ${JSON.stringify(mapLayers.map(l => l.label))}`);
    }

    // Click on the layer option in the dialog
    const options = dialogRoot.querySelectorAll('.layer-option');
    let utrechtOption = null;
    for (const opt of options) {
      const text = opt.textContent || '';
      if (text.toLowerCase().includes('utrecht')) {
        utrechtOption = opt;
        break;
      }
    }

    if (!utrechtOption) {
      const allTexts = Array.from(options).map(o => o.textContent?.trim());
      throw new Error(`Utrecht layer option not found in dialog. Available options: ${JSON.stringify(allTexts)}`);
    }

    utrechtOption.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));

    // Wait for Next button and click it
    const nextButton = await waitFor(
      () => Array.from(dialogRoot.querySelectorAll('sl-button'))
        .find((button) => (button.textContent ?? '').includes('Next')),
      5_000,
      'next button'
    );
    nextButton.click();

    // Wait for OK button (properties step) and click it
    const okButton = await waitFor(
      () => Array.from(dialogRoot.querySelectorAll('sl-button'))
        .find((button) => (button.textContent ?? '').trim() === 'OK'),
      5_000,
      'ok button'
    );

    okButton.click();

    // Wait for the confirm event to propagate
    await new Promise(r => setTimeout(r, 1000));

    return { success: true };
  });

  if (!result.success) {
    fail('Failed to select Utrecht layer in draw tool');
  }

  // Wait for dialog to close
  await page.waitForTimeout(500);

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
    throw new Error(`Step "${name}" failed: ${error.message}`);
  }
}

export async function run({ page, engine }) {
  console.log(`  Running search-persist-draw test for engine: ${engine}`);

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

  // Use the first result (index 0)
  const resultIndex = 0;

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
