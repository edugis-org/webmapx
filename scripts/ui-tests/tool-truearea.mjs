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

async function activateTrueAreaTool(page) {
  await page.evaluate(() => {
    const button = document.getElementById('truearea-button');
    if (!button) throw new Error('truearea-button not found');
    button.click();
  });
}

async function waitForTrueAreaReady(page) {
  await page.waitForFunction(() => {
    const tool = document.querySelector('webmapx-truearea-tool');
    return Boolean(tool?.active);
  }, undefined, { timeout: 15_000 });
}

async function waitForWorldCountriesLayer(page) {
  await page.waitForFunction(async () => {
    const map = document.querySelector('webmapx-map');
    const adapter = await map?.getAdapterAsync?.();
    if (!adapter) return false;
    const mapLayers = adapter.store.getState().mapLayers ?? {};
    const entry = mapLayers['world-countries'];
    return Boolean(entry?.sourceData?.features?.length > 0);
  }, undefined, { timeout: 30_000 });
}

async function getTrueAreaCopyCount(page) {
  return page.evaluate(() => {
    const tool = document.querySelector('webmapx-truearea-tool');
    return Array.isArray(tool?.copies) ? tool.copies.length : -1;
  });
}

async function emitTrueAreaPointerDown(page, coords, pixel) {
  await page.evaluate(async ({ coords, pixel }) => {
    const map = document.querySelector('webmapx-map');
    const adapter = await map?.getAdapterAsync?.();
    if (!adapter) throw new Error('adapter unavailable');
    adapter.events.emit({ type: 'pointer-down', coords, pixel, button: 0 });
  }, { coords, pixel });
}

async function emitTrueAreaPointerMove(page, coords, pixel) {
  await page.evaluate(async ({ coords, pixel }) => {
    const map = document.querySelector('webmapx-map');
    const adapter = await map?.getAdapterAsync?.();
    if (!adapter) throw new Error('adapter unavailable');
    adapter.events.emit({ type: 'pointer-move', coords, pixel, resolution: null });
  }, { coords, pixel });
}

async function emitTrueAreaPointerUp(page, coords, pixel) {
  await page.evaluate(async ({ coords, pixel }) => {
    const map = document.querySelector('webmapx-map');
    const adapter = await map?.getAdapterAsync?.();
    if (!adapter) throw new Error('adapter unavailable');
    adapter.events.emit({ type: 'pointer-up', coords, pixel, button: 0 });
  }, { coords, pixel });
}

async function emitPointerCancel(page) {
  await page.evaluate(async () => {
    const map = document.querySelector('webmapx-map');
    const adapter = await map?.getAdapterAsync?.();
    if (!adapter) throw new Error('adapter unavailable');
    adapter.events.emit({ type: 'pointer-cancel' });
  });
}

async function getCountryAtLngLat(page, lngLat) {
  return page.evaluate(async ({ lngLat }) => {
    const map = document.querySelector('webmapx-map');
    const adapter = await map?.getAdapterAsync?.();
    if (!adapter) return null;
    const mapLayers = adapter.store.getState().mapLayers ?? {};
    const entry = mapLayers['world-countries'];
    const fc = entry?.sourceData;
    if (!fc?.features) return null;

    function pointInRing(pt, ring) {
      let inside = false;
      for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
        const xi = ring[i][0], yi = ring[i][1];
        const xj = ring[j][0], yj = ring[j][1];
        if (((yi > pt[1]) !== (yj > pt[1])) && pt[0] < ((xj - xi) * (pt[1] - yi)) / (yj - yi) + xi) {
          inside = !inside;
        }
      }
      return inside;
    }

    for (const f of fc.features) {
      const g = f.geometry;
      if (g.type === 'Polygon') {
        if (pointInRing(lngLat, g.coordinates[0])) return f.properties?.name ?? 'unknown';
      } else if (g.type === 'MultiPolygon') {
        for (const poly of g.coordinates) {
          if (pointInRing(lngLat, poly[0])) return f.properties?.name ?? 'unknown';
        }
      }
    }
    return null;
  }, { lngLat });
}

async function getLngLatAtCenter(page) {
  return page.evaluate(async () => {
    const map = document.querySelector('webmapx-map');
    const adapter = await map?.getAdapterAsync?.();
    return adapter?.getViewportState()?.center ?? null;
  });
}

async function setViewCenter(page, lngLat, zoom) {
  await page.evaluate(async ({ lngLat, zoom }) => {
    const map = document.querySelector('webmapx-map');
    const adapter = await map?.getAdapterAsync?.();
    if (!adapter) throw new Error('adapter unavailable');
    adapter.setViewport(lngLat, zoom);
  }, { lngLat, zoom });
  await new Promise(r => setTimeout(r, 500));
}

export async function run({ page }) {
  const step = async (label, fn) => {
    try {
      await fn();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`${label}: ${message}`, { cause: error });
    }
  };

  await step('wait map ready', () => waitForMapReady(page));

  await step('activate truearea tool', () => activateTrueAreaTool(page));

  await step('wait truearea tool active', () => waitForTrueAreaReady(page));

  await step('wait world-countries layer loaded', () => waitForWorldCountriesLayer(page));

  // Center map over Africa so world-countries polygons are at map center
  await step('center map over Africa', () => setViewCenter(page, [20, 5], 3));

  // Find a coordinate that hits a country polygon
  const center = await getLngLatAtCenter(page);
  if (!center) fail('Could not get map center');

  const countryName = await getCountryAtLngLat(page, center);

  await step('mouse drag: select country and place copy', async () => {
    const map = await page.evaluate(async () => {
      const map = document.querySelector('webmapx-map');
      const adapter = await map?.getAdapterAsync?.();
      if (!adapter) throw new Error('adapter unavailable');
      const center = adapter.getViewportState().center;
      const pixel = adapter.project(center);
      // destination: 15 degrees east of center
      const destCoords = [center[0] + 15, center[1]];
      const destPixel = adapter.project(destCoords);
      return { center, pixel, destCoords, destPixel };
    });

    // pointer-down at center
    await emitTrueAreaPointerDown(page, map.center, map.pixel);
    await new Promise(r => setTimeout(r, 50));

    // pointer-move toward destination
    const midCoords = [(map.center[0] + map.destCoords[0]) / 2, map.center[1]];
    const midPixel = [(map.pixel[0] + map.destPixel[0]) / 2, map.pixel[1]];
    await emitTrueAreaPointerMove(page, midCoords, midPixel);
    await new Promise(r => setTimeout(r, 50));
    await emitTrueAreaPointerMove(page, map.destCoords, map.destPixel);
    await new Promise(r => setTimeout(r, 50));

    // pointer-up at destination
    await emitTrueAreaPointerUp(page, map.destCoords, map.destPixel);
    await new Promise(r => setTimeout(r, 200));
  });

  await step('verify copy was placed after mouse drag', async () => {
    const count = await getTrueAreaCopyCount(page);
    // If center was over water, no copy placed — only check if country was hit
    if (countryName !== null && count < 1) {
      fail(`Expected at least 1 copy after drag over country "${countryName}", got ${count}`);
    }
  });

  await step('verify truearea composite layer registered with sub-layers and source', async () => {
    const info = await page.evaluate(async () => {
      const map = document.querySelector('webmapx-map');
      const adapter = await map?.getAdapterAsync?.();
      if (!adapter) return null;
      const mapLayers = adapter.store.getState().mapLayers ?? {};
      const entry = mapLayers['truearea'];
      const source = adapter.getSource('truearea:data');
      return {
        hasLayer: adapter.hasLayer('truearea'),
        label: entry?.label,
        sublayerIds: Array.isArray(entry?.sublayers) ? entry.sublayers.map((s) => s?.id) : null,
        hasSource: Boolean(source && typeof source.setData === 'function'),
      };
    });
    if (!info) fail('Could not read adapter state for truearea layer');
    if (!info.hasLayer) fail('Expected adapter.hasLayer("truearea") to be true');
    if (info.label !== 'TrueArea copies') fail(`Expected label "TrueArea copies", got "${info.label}"`);
    if (!Array.isArray(info.sublayerIds) || info.sublayerIds.length !== 2
      || !info.sublayerIds.includes('truearea-fill') || !info.sublayerIds.includes('truearea-line')) {
      fail(`Expected sub-layers [truearea-fill, truearea-line], got ${JSON.stringify(info.sublayerIds)}`);
    }
    if (!info.hasSource) fail('Expected adapter.getSource("truearea:data") to resolve to a settable source');
  });

  // Clear copies for next test
  await page.evaluate(() => {
    const tool = document.querySelector('webmapx-truearea-tool');
    if (tool && typeof tool.clearAll === 'function') tool.clearAll?.();
  });

  await step('pointer-cancel aborts drag without placing copy', async () => {
    const initialCount = await getTrueAreaCopyCount(page);

    const mapState = await page.evaluate(async () => {
      const map = document.querySelector('webmapx-map');
      const adapter = await map?.getAdapterAsync?.();
      if (!adapter) throw new Error('adapter unavailable');
      const center = adapter.getViewportState().center;
      const pixel = adapter.project(center);
      return { center, pixel };
    });

    // Start drag
    await emitTrueAreaPointerDown(page, mapState.center, mapState.pixel);
    await new Promise(r => setTimeout(r, 50));
    const moveCoords = [mapState.center[0] + 5, mapState.center[1]];
    const movePixel = [mapState.pixel[0] + 50, mapState.pixel[1]];
    await emitTrueAreaPointerMove(page, moveCoords, movePixel);
    await new Promise(r => setTimeout(r, 50));

    // Simulate browser cancelling the gesture
    await emitPointerCancel(page);
    await new Promise(r => setTimeout(r, 200));

    // Drag state should be cleared, no new copy
    const afterCount = await getTrueAreaCopyCount(page);
    if (afterCount !== initialCount) {
      fail(`pointer-cancel should not place a copy: before=${initialCount}, after=${afterCount}`);
    }

    // Pan should be re-enabled
    const panEnabled = await page.evaluate(async () => {
      const map = document.querySelector('webmapx-map');
      const adapter = await map?.getAdapterAsync?.();
      if (!adapter) return null;
      // Check that dragging state is false on tool
      const tool = document.querySelector('webmapx-truearea-tool');
      return tool?.dragging === false;
    });
    if (!panEnabled) fail('Tool dragging state not cleared after pointer-cancel');
  });

  await step('drag state cleared after pointer-cancel: new drag works', async () => {
    const mapState = await page.evaluate(async () => {
      const map = document.querySelector('webmapx-map');
      const adapter = await map?.getAdapterAsync?.();
      if (!adapter) throw new Error('adapter unavailable');
      const center = adapter.getViewportState().center;
      const pixel = adapter.project(center);
      const destCoords = [center[0] + 15, center[1]];
      const destPixel = adapter.project(destCoords);
      return { center, pixel, destCoords, destPixel };
    });

    await emitTrueAreaPointerDown(page, mapState.center, mapState.pixel);
    await new Promise(r => setTimeout(r, 50));
    await emitTrueAreaPointerMove(page, mapState.destCoords, mapState.destPixel);
    await new Promise(r => setTimeout(r, 50));
    await emitTrueAreaPointerUp(page, mapState.destCoords, mapState.destPixel);
    await new Promise(r => setTimeout(r, 200));

    // Just verify tool is not stuck in dragging state
    const dragging = await page.evaluate(() => {
      const tool = document.querySelector('webmapx-truearea-tool');
      return tool?.dragging ?? null;
    });
    if (dragging !== false) fail(`Expected dragging=false after completed drag, got ${dragging}`);
  });
}

export const engines = ['maplibre', 'openlayers', 'leaflet', 'cesium'];
