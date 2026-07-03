import test from 'node:test';
import assert from 'node:assert/strict';

import { BaseAdapter } from '../src/map/base-adapter';
import type { LayerInsertOptions } from '../src/map/IMapInterfaces';

// Minimal concrete adapter: engine accepts every layer, generic bookkeeping does the rest.
class StubAdapter extends BaseAdapter {
  protected async engineAddLayer(_layer: any, _options?: LayerInsertOptions): Promise<boolean> {
    return true;
  }
  protected engineRemoveLayer(_id: string): void {}
  protected engineRemoveSource(_id: string): void {}
  protected engineAddSource(_id: string, _config: any): void {}
  protected getCore(): any {
    return null;
  }
  protected getLogicalLayerExecutor(): any {
    return { moveLayer() {} };
  }
  protected getMarkerService(): any {
    return null;
  }
  setLayerOpacity(_layerId: string, _opacity: number): void {}
}

function makeLayer(id: string, legendRole: 'background' | 'overlay' = 'overlay') {
  return { id, type: 'raster', source: `${id}-source`, metadata: { legendRole } };
}

function mapLayerIds(adapter: StubAdapter): string[] {
  return Object.keys(adapter.store.getState().mapLayers ?? {});
}

test('addLayer with beforeLayerId mirrors the hinted position into mapLayers key order', async () => {
  const adapter = new StubAdapter();
  await adapter.addLayer(makeLayer('a'));
  await adapter.addLayer(makeLayer('b'));
  await adapter.addLayer(makeLayer('c'), { beforeLayerId: 'a' });

  assert.deepEqual(mapLayerIds(adapter), ['c', 'a', 'b']);
});

test('addLayer with afterLayerId mirrors the hinted position into mapLayers key order', async () => {
  const adapter = new StubAdapter();
  await adapter.addLayer(makeLayer('a'));
  await adapter.addLayer(makeLayer('b'));
  await adapter.addLayer(makeLayer('c'), { afterLayerId: 'a' });

  assert.deepEqual(mapLayerIds(adapter), ['a', 'c', 'b']);
});

test('addLayer without hints appends at the top of mapLayers', async () => {
  const adapter = new StubAdapter();
  await adapter.addLayer(makeLayer('a'));
  await adapter.addLayer(makeLayer('b'));

  assert.deepEqual(mapLayerIds(adapter), ['a', 'b']);
});

test('background switch scenario: replacement inserted below overlays stays below in mapLayers', async () => {
  const adapter = new StubAdapter();
  await adapter.addLayer(makeLayer('osm', 'background'));
  await adapter.addLayer(makeLayer('ahn'));
  await adapter.addLayer(makeLayer('world'));

  // Legend drag: world below ahn — moveLayer keeps store in sync.
  adapter.moveLayer('world', 'ahn');
  assert.deepEqual(mapLayerIds(adapter), ['osm', 'world', 'ahn']);

  // Background switch: remove old, add replacement hinted below the bottom overlay.
  adapter.removeLayer('osm');
  await adapter.addLayer(makeLayer('google', 'background'), { beforeLayerId: 'world' });

  assert.deepEqual(mapLayerIds(adapter), ['google', 'world', 'ahn']);
});
