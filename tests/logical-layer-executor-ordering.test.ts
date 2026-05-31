import test from 'node:test';
import assert from 'node:assert/strict';

import { DeferredLogicalLayerExecutor } from '../src/map/logical-layer-executor.ts';
import type { LayerInsertOptions } from '../src/map/IMapInterfaces.ts';
import type { LayerConfig, SourceConfig } from '../src/config/types.ts';

const sampleLayer: LayerConfig = {
  id: 'sample',
  layerset: [{ id: 'r', type: 'raster', source: 'sample-source' }],
};

const sampleSource: SourceConfig = {
  id: 'sample-source',
  type: 'raster',
  service: 'xyz',
  url: 'https://example.com/{z}/{x}/{y}.png',
};

test('DeferredLogicalLayerExecutor forwards insertion options when bound', async () => {
  const executor = new DeferredLogicalLayerExecutor();
  const calls: Array<{ options?: LayerInsertOptions }> = [];

  const mockService = {
    setCatalog() {},
    async addLayer(_layerId: string, _layerConfig: LayerConfig, _sourceConfig: SourceConfig, options?: LayerInsertOptions) {
      calls.push({ options });
      return true;
    },
    removeLayer() {},
    getVisibleLayers() { return []; },
    isLayerVisible() { return false; },
  };

  executor.bind(mockService as any);
  const success = await executor.addLayer('sample', sampleLayer, sampleSource, { beforeLayerId: 'other' });

  assert.equal(success, true);
  assert.equal(calls.length, 1);
  assert.deepEqual(calls[0].options, { beforeLayerId: 'other' });
});

test('DeferredLogicalLayerExecutor keeps insertion options for queued adds before bind', async () => {
  const executor = new DeferredLogicalLayerExecutor();
  const calls: Array<{ options?: LayerInsertOptions }> = [];

  const pending = executor.addLayer('sample', sampleLayer, sampleSource, { afterLayerId: 'anchor' });

  const mockService = {
    setCatalog() {},
    async addLayer(_layerId: string, _layerConfig: LayerConfig, _sourceConfig: SourceConfig, options?: LayerInsertOptions) {
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
