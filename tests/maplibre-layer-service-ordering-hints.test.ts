import test from 'node:test';
import assert from 'node:assert/strict';

import { MapLayerService } from '../src/map/maplibre-services/MapLayerService';
import { MapStateStore } from '../src/store/map-state-store';
import type { AnyLayerConfig, LayerDataConfig } from '../src/config/types';

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

function makeRasterLayer(id: string): AnyLayerConfig {
  return {
    id,
    type: 'raster',
    source: `${id}-source`,
    metadata: { legendRole: 'overlay' },
  };
}

function makeCatalog(ids: string[]): LayerDataConfig {
  return {
    sources: ids.map((id) => ({
      id: `${id}-source`,
      type: 'raster' as const,
      service: 'xyz' as const,
      url: 'https://example.com/{z}/{x}/{y}.png',
    })),
    layers: ids.map(makeRasterLayer),
  };
}

test('MapLibre MapLayerService applies beforeLayerId using logical layer ids', async () => {
  const map = new MockMap();
  const store = new MapStateStore();
  const service = new MapLayerService(map as any, store);
  service.setCatalog(makeCatalog(['a', 'b', 'c']));

  await service.addLayer(makeRasterLayer('a'));
  await service.addLayer(makeRasterLayer('b'));
  await service.addLayer(makeRasterLayer('c'), { beforeLayerId: 'a' });

  assert.deepEqual(map.getLayerOrder(), ['c-c-source-raster', 'a-a-source-raster', 'b-b-source-raster']);
});

test('MapLibre MapLayerService applies afterLayerId using logical layer ids', async () => {
  const map = new MockMap();
  const store = new MapStateStore();
  const service = new MapLayerService(map as any, store);
  service.setCatalog(makeCatalog(['a', 'b', 'c']));

  await service.addLayer(makeRasterLayer('a'));
  await service.addLayer(makeRasterLayer('b'));
  await service.addLayer(makeRasterLayer('c'), { afterLayerId: 'a' });

  assert.deepEqual(map.getLayerOrder(), ['a-a-source-raster', 'c-c-source-raster', 'b-b-source-raster']);
});
