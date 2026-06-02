import test from 'node:test';
import assert from 'node:assert/strict';

import { DeferredLogicalLayerExecutor } from '../src/map/logical-layer-executor';
import type { LayerInsertOptions } from '../src/map/IMapInterfaces';
import type { AnyLayerConfig } from '../src/config/types';

const sampleLayer: AnyLayerConfig = {
  id: 'sample',
  type: 'raster',
  source: 'sample-source',
};

test('DeferredLogicalLayerExecutor forwards insertion options when bound', async () => {
  const executor = new DeferredLogicalLayerExecutor();
  const calls: Array<{ options?: LayerInsertOptions }> = [];

  const mockService = {
    setCatalog() {},
    async addLayer(_layerConfig: AnyLayerConfig, options?: LayerInsertOptions) {
      calls.push({ options });
      return true;
    },
    removeLayer() {},
    getVisibleLayers() { return []; },
    isLayerVisible() { return false; },
  };

  executor.bind(mockService as any);
  const success = await executor.addLayer(sampleLayer, { beforeLayerId: 'other' });

  assert.equal(success, true);
  assert.equal(calls.length, 1);
  assert.deepEqual(calls[0].options, { beforeLayerId: 'other' });
});

test('DeferredLogicalLayerExecutor keeps insertion options for queued adds before bind', async () => {
  const executor = new DeferredLogicalLayerExecutor();
  const calls: Array<{ options?: LayerInsertOptions }> = [];

  const pending = executor.addLayer(sampleLayer, { afterLayerId: 'anchor' });

  const mockService = {
    setCatalog() {},
    async addLayer(_layerConfig: AnyLayerConfig, options?: LayerInsertOptions) {
      calls.push({ options });
      return true;
    },
    removeLayer() {},
    getVisibleLayers() { return []; },
    isLayerVisible() { return false; },
  };

  executor.bind(mockService as any);
  const success = await pending;

  assert.equal(success, true);
  assert.equal(calls.length, 1);
  assert.deepEqual(calls[0].options, { afterLayerId: 'anchor' });
});
