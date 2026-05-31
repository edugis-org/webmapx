import test from 'node:test';
import assert from 'node:assert/strict';

import { MapLayerService } from '../src/map/maplibre-services/MapLayerService.ts';
import { MapStateStore } from '../src/store/map-state-store.ts';
import type { LayerConfig, SourceConfig } from '../src/config/types.ts';

class MockMap {
  private sources = new Map<string, unknown>();
  private layers: Array<{ id: string; [key: string]: unknown }> = [];

  addSource(id: string, source: unknown): void {
    this.sources.set(id, source);
  }

  getSource(id: string): unknown {
    return this.sources.get(id);
  }

  removeSource(id: string): void {
    this.sources.delete(id);
  }

  addLayer(layer: { id: string; [key: string]: unknown }, beforeId?: string): void {
    const next = { ...layer };
    if (beforeId) {
      const index = this.layers.findIndex((entry) => entry.id === beforeId);
      if (index >= 0) {
        this.layers.splice(index, 0, next);
        return;
      }
    }
    this.layers.push(next);
  }

  getLayer(id: string): { id: string; [key: string]: unknown } | undefined {
    return this.layers.find((entry) => entry.id === id);
  }

  removeLayer(id: string): void {
    const index = this.layers.findIndex((entry) => entry.id === id);
    if (index >= 0) {
      this.layers.splice(index, 1);
    }
  }

  getStyle(): { layers: Array<{ id: string; [key: string]: unknown }> } {
    return { layers: [...this.layers] };
  }

  getLayerOrder(): string[] {
    return this.layers.map((entry) => entry.id);
  }
}

function makeRasterLayer(id: string): LayerConfig {
  return {
    id,
    metadata: { legendRole: 'overlay' },
    layerset: [{ id: 'r', type: 'raster', source: `${id}-source` }],
  };
}

function makeRasterSource(id: string): SourceConfig {
  return {
    id: `${id}-source`,
    type: 'raster',
    service: 'xyz',
    url: 'https://example.com/{z}/{x}/{y}.png',
  };
}

test('MapLibre MapLayerService applies beforeLayerId using logical layer ids', async () => {
  const map = new MockMap();
  const store = new MapStateStore();
  const service = new MapLayerService(map as any, store);

  await service.addLayer('a', makeRasterLayer('a'), makeRasterSource('a'));
  await service.addLayer('b', makeRasterLayer('b'), makeRasterSource('b'));
  await service.addLayer('c', makeRasterLayer('c'), makeRasterSource('c'), { beforeLayerId: 'a' });

  assert.deepEqual(map.getLayerOrder(), ['c-r', 'a-r', 'b-r']);
});

test('MapLibre MapLayerService applies afterLayerId using logical layer ids', async () => {
  const map = new MockMap();
  const store = new MapStateStore();
  const service = new MapLayerService(map as any, store);

  await service.addLayer('a', makeRasterLayer('a'), makeRasterSource('a'));
  await service.addLayer('b', makeRasterLayer('b'), makeRasterSource('b'));
  await service.addLayer('c', makeRasterLayer('c'), makeRasterSource('c'), { afterLayerId: 'a' });

  assert.deepEqual(map.getLayerOrder(), ['a-r', 'c-r', 'b-r']);
});
