import test from 'node:test';
import assert from 'node:assert/strict';

import {
  findLayerObjectRange,
  injectLayerSwatch,
  selectSwatchTargets,
} from '../scripts/lib/config-swatches';
import { deriveLayerSwatch } from '../src/utils/layer-swatch';

const SWATCH = 'data:image/webp;base64,AAAA';

const config = (): string => `{
  "layerData": {
    "layers": [
      {
        "id": "osm",
        "type": "raster",
        "source": "xyz-source",
        "title": "OpenStreetMap"
      },
      {
        "id": "ahn",
        "type": "raster",
        "source": "ahn-source",
        "metadata": {
          "bounds": [2.5, 50.2, 7.3, 55.7]
        }
      },
      {
        "id": "empty-meta",
        "type": "raster",
        "metadata": {}
      }
    ]
  }
}
`;

test('findLayerObjectRange isolates exactly the layer object', () => {
  const text = config();
  const range = findLayerObjectRange(text, 'osm');
  assert.ok(range);
  const slice = text.slice(range.start, range.end);
  assert.deepEqual(JSON.parse(slice), {
    id: 'osm',
    type: 'raster',
    source: 'xyz-source',
    title: 'OpenStreetMap',
  });
});

test('findLayerObjectRange returns null for an unknown id', () => {
  assert.equal(findLayerObjectRange(config(), 'nope'), null);
});

test('findLayerObjectRange is not confused by braces inside strings', () => {
  const text = `{
  "layers": [
    { "id": "tricky", "url": "https://x/{z}/{x}/{y}.png?a={\\"b\\":1}" }
  ]
}`;
  const range = findLayerObjectRange(text, 'tricky');
  assert.ok(range);
  const parsed = JSON.parse(text.slice(range.start, range.end)) as { url: string };
  assert.equal(parsed.url, 'https://x/{z}/{x}/{y}.png?a={"b":1}');
});

test('injectLayerSwatch adds a metadata object when the layer has none', () => {
  const out = injectLayerSwatch(config(), 'osm', SWATCH);
  const parsed = JSON.parse(out) as any;
  const osm = parsed.layerData.layers.find((l: any) => l.id === 'osm');
  assert.equal(osm.metadata.swatch, SWATCH);
  // untouched properties survive
  assert.equal(osm.title, 'OpenStreetMap');
});

test('injectLayerSwatch adds a key to an existing metadata object without losing it', () => {
  const out = injectLayerSwatch(config(), 'ahn', SWATCH);
  const parsed = JSON.parse(out) as any;
  const ahn = parsed.layerData.layers.find((l: any) => l.id === 'ahn');
  assert.equal(ahn.metadata.swatch, SWATCH);
  assert.deepEqual(ahn.metadata.bounds, [2.5, 50.2, 7.3, 55.7]);
});

test('injectLayerSwatch handles an empty metadata object', () => {
  const out = injectLayerSwatch(config(), 'empty-meta', SWATCH);
  const parsed = JSON.parse(out) as any;
  assert.equal(parsed.layerData.layers.find((l: any) => l.id === 'empty-meta').metadata.swatch, SWATCH);
});

test('injectLayerSwatch replaces an existing swatch rather than duplicating it', () => {
  const once = injectLayerSwatch(config(), 'osm', SWATCH);
  const twice = injectLayerSwatch(once, 'osm', 'data:image/webp;base64,BBBB');
  const parsed = JSON.parse(twice) as any;
  assert.equal(parsed.layerData.layers.find((l: any) => l.id === 'osm').metadata.swatch,
    'data:image/webp;base64,BBBB');
  assert.equal((twice.match(/"swatch"/g) ?? []).length, 1);
});

test('injectLayerSwatch leaves every other line of the file byte-identical', () => {
  const before = config();
  const after = injectLayerSwatch(before, 'osm', SWATCH);
  const removed = before.split('\n').filter(line => !after.split('\n').includes(line));
  // Only the line that gained a trailing comma changes; nothing else is rewritten.
  assert.deepEqual(removed, ['        "title": "OpenStreetMap"']);
});

test('injectLayerSwatch is a no-op for an unknown layer', () => {
  const before = config();
  assert.equal(injectLayerSwatch(before, 'missing', SWATCH), before);
});

test('injectLayerSwatch escapes the value so a quote cannot break the JSON', () => {
  const out = injectLayerSwatch(config(), 'osm', 'a"b\\c');
  const parsed = JSON.parse(out) as any;
  assert.equal(parsed.layerData.layers.find((l: any) => l.id === 'osm').metadata.swatch, 'a"b\\c');
});

test('selectSwatchTargets picks only layers with no derivable paint', () => {
  const layers = [
    { id: 'osm', type: 'raster' },
    { id: 'countries', type: 'fill', paint: { 'fill-color': '#4a90d9' } },
    { id: 'liberty', type: 'style', url: 'https://x/style.json' },
  ];
  // sanity: the fill really is derivable, so the tool and the app agree
  assert.equal(deriveLayerSwatch(layers[1]).kind, 'fill');
  assert.deepEqual(selectSwatchTargets(layers).map(t => t.id), ['osm', 'liberty']);
});

test('selectSwatchTargets skips layers that already carry a swatch, unless forced', () => {
  const layers = [{ id: 'osm', type: 'raster', metadata: { swatch: SWATCH } }];
  assert.deepEqual(selectSwatchTargets(layers), []);
  assert.deepEqual(selectSwatchTargets(layers, { force: true }).map(t => t.id), ['osm']);
});

test('selectSwatchTargets honours --only and tolerates bad input', () => {
  const layers = [{ id: 'a', type: 'raster' }, { id: 'b', type: 'raster' }];
  assert.deepEqual(selectSwatchTargets(layers, { only: ['b'] }).map(t => t.id), ['b']);
  assert.deepEqual(selectSwatchTargets(null), []);
  assert.deepEqual(selectSwatchTargets([{ type: 'raster' }]), []);
});
