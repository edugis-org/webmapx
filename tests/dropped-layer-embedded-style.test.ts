import test from 'node:test';
import assert from 'node:assert/strict';
import { buildLayerConfigsFromGroup } from '../src/utils/dropped-layer-builder';

// Trimmed from an EduGIS export ("Zones in Zee"): the layer style travels
// inside the FeatureCollection as a non-standard top-level `style` member.
const colour = ['match', ['get', 'layer'], 'kust', '#a1d99b', 'zee', '#31a354', '#e5f5e0'];
const edugis = {
  type: 'FeatureCollection',
  features: [
    { type: 'Feature', properties: { layer: 'kust' }, geometry: { type: 'Polygon', coordinates: [[[4, 52], [5, 52], [5, 53], [4, 52]]] } },
    { type: 'Feature', properties: { layer: 'zee' }, geometry: { type: 'Polygon', coordinates: [[[3, 52], [4, 52], [4, 53], [3, 52]]] } },
  ],
  style: {
    id: 'abc', type: 'fill', source: { type: 'geojson' },
    metadata: { title: 'Zones in Zee', transparency: 26 },
    paint: { 'fill-color': colour, 'fill-opacity': 0.74 },
  },
};

const blob = (obj: unknown) => new Blob([JSON.stringify(obj)], { type: 'application/json' });

test('dropped GeoJSON uses its embedded EduGIS style and title, and drops the style from the data', async () => {
  const [config] = await buildLayerConfigsFromGroup([{ name: 'Zones_in Zee.geo.json', blob: blob(edugis) }] as never);
  assert.equal(config.title, 'Zones in Zee');
  const layer = (config.layers ?? []).find((l) => l.type === 'fill');
  assert.ok(layer);
  assert.deepEqual(layer.paint?.['fill-color'], colour);
  assert.equal(layer.paint?.['fill-opacity'], 0.74);
  const source = (config.sources ?? {})[layer.source as string] as { data: Record<string, unknown> };
  assert.equal(source.data.type, 'FeatureCollection');
  assert.equal('style' in source.data, false);
});

test('embedded EduGIS transparency becomes opacity when the paint has none', async () => {
  const noOpacity = { ...edugis, style: { ...edugis.style, paint: { 'fill-color': colour } } };
  const [config] = await buildLayerConfigsFromGroup([{ name: 'z.geojson', blob: blob(noOpacity) }] as never);
  const opacity = config.layers?.[0].paint?.['fill-opacity'] as number;
  assert.ok(Math.abs(opacity - 0.74) < 1e-9);
});
