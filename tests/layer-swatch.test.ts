import test from 'node:test';
import assert from 'node:assert/strict';

import {
  deriveLayerSwatch,
  extractColorStops,
  splitLayerTitle,
} from '../src/utils/layer-swatch';

test('extractColorStops reads a plain colour literal', () => {
  assert.deepEqual(extractColorStops('#ff0000'), ['#ff0000']);
  assert.deepEqual(extractColorStops('rgb(1,2,3)'), ['rgb(1,2,3)']);
  assert.deepEqual(extractColorStops('steelblue'), ['steelblue']);
});

test('extractColorStops pulls stops out of an interpolate expression in axis order', () => {
  const expr = ['interpolate', ['linear'], ['get', 'pop'],
    0, '#e8f1f5', 100, '#4e93b4', 2000, '#173f55'];
  assert.deepEqual(extractColorStops(expr), ['#e8f1f5', '#4e93b4', '#173f55']);
});

test('extractColorStops handles step and match expressions', () => {
  assert.deepEqual(
    extractColorStops(['step', ['get', 'v'], '#aaa', 10, '#bbb', 20, '#ccc']),
    ['#aaa', '#bbb', '#ccc'],
  );
  assert.deepEqual(
    extractColorStops(['match', ['get', 'kind'], 'a', '#111', 'b', '#222', '#333']),
    ['#111', '#222', '#333'],
  );
});

test('extractColorStops never mistakes match keys for named colours', () => {
  // 'a'/'b' are category keys; 'red'/'blue' here are the actual colours.
  assert.deepEqual(
    extractColorStops(['match', ['get', 'k'], 'a', 'red', 'b', 'blue', 'gray']),
    ['red', 'blue', 'gray'],
  );
  // a category key that happens to spell a colour name must not leak in as
  // an extra stop -- only the value slots are read
  assert.deepEqual(
    extractColorStops(['match', ['get', 'k'], 'green', '#111', 'olive', '#222', '#333']),
    ['#111', '#222', '#333'],
  );
});

test('extractColorStops reads case expressions by position', () => {
  assert.deepEqual(
    extractColorStops(['case', ['<', ['get', 'v'], 10], '#111', ['<', ['get', 'v'], 20], '#222', '#333']),
    ['#111', '#222', '#333'],
  );
});

test('extractColorStops caps the number of stops so a swatch stays readable', () => {
  const many: unknown[] = ['step', ['get', 'v']];
  for (let i = 0; i < 12; i++) many.push(`#00000${i % 10}`, i);
  assert.equal(extractColorStops(many).length, 5);
});

test('extractColorStops returns nothing for expressions with no colour literal', () => {
  assert.deepEqual(extractColorStops(['get', 'colour']), []);
  assert.deepEqual(extractColorStops(undefined), []);
  assert.deepEqual(extractColorStops(42), []);
});

test('deriveLayerSwatch uses a smooth gradient for interpolate and bands for step', () => {
  const smooth = deriveLayerSwatch({
    type: 'fill',
    paint: { 'fill-color': ['interpolate', ['linear'], ['get', 'p'], 0, '#fff', 1, '#000'] },
  });
  assert.equal(smooth.kind, 'fill');
  assert.match(smooth.background, /^linear-gradient\(135deg, #fff, #000\)$/);

  const banded = deriveLayerSwatch({
    type: 'fill',
    paint: { 'fill-color': ['step', ['get', 'p'], '#fff', 1, '#000'] },
  });
  // hard stops, not a blend
  assert.match(banded.background, /#fff 0% 50%/);
  assert.match(banded.background, /#000 50% 100%/);
});

test('deriveLayerSwatch reports the draw kind per layer type', () => {
  assert.equal(deriveLayerSwatch({ type: 'line', paint: { 'line-color': '#0f0' } }).kind, 'line');
  assert.equal(deriveLayerSwatch({ type: 'circle', paint: { 'circle-color': '#0f0' } }).kind, 'circle');
  assert.equal(deriveLayerSwatch({ type: 'raster' }).kind, 'raster');
  assert.equal(deriveLayerSwatch({ type: 'hillshade' }).kind, 'raster');
});

test('deriveLayerSwatch falls back to a neutral swatch rather than guessing', () => {
  const unknown = deriveLayerSwatch({ type: 'fill' });
  assert.match(unknown.background, /--color-background-tertiary/);
  assert.equal(deriveLayerSwatch(null).kind, 'unknown');
  assert.equal(deriveLayerSwatch(undefined).kind, 'unknown');
});

test('splitLayerTitle demotes a trailing technical qualifier', () => {
  assert.deepEqual(splitLayerTitle('OpenStreetMap (xyz)'), { name: 'OpenStreetMap', qualifier: 'xyz' });
  assert.deepEqual(splitLayerTitle('Hoogte (AHN)'), { name: 'Hoogte', qualifier: 'AHN' });
  assert.deepEqual(splitLayerTitle('NYC 1836 (Allmaps)'), { name: 'NYC 1836', qualifier: 'Allmaps' });
});

test('splitLayerTitle leaves titles without a trailing parenthetical alone', () => {
  assert.deepEqual(splitLayerTitle('World countries'), { name: 'World countries', qualifier: '' });
  assert.deepEqual(splitLayerTitle('(concept) Bevolkingsdichtheid'),
    { name: '(concept) Bevolkingsdichtheid', qualifier: '' });
  assert.deepEqual(splitLayerTitle(''), { name: '', qualifier: '' });
});

test('deriveLayerSwatch summarises a style container by its most representative sublayer', () => {
  // webmapx catalog shape: type 'style' with nested mapbox-style fragments.
  const worldCountries = {
    id: 'world-countries',
    type: 'style',
    layers: [
      { id: 'fill', type: 'fill', paint: { 'fill-color': '#4a90d9' } },
      { id: 'line', type: 'line', paint: { 'line-color': '#2c6fad' } },
    ],
  };
  const swatch = deriveLayerSwatch(worldCountries);
  // the fill, not the hairline that outlines it
  assert.equal(swatch.background, '#4a90d9');
  assert.equal(swatch.kind, 'fill');
});

test('deriveLayerSwatch prefers a fill over a circle over a line', () => {
  const pick = (types: string[]) => deriveLayerSwatch({
    type: 'style',
    layers: types.map((t, i) => ({
      type: t,
      paint: { [`${t}-color`]: `#00000${i}` },
    })),
  });
  assert.equal(pick(['line', 'circle']).kind, 'circle');
  assert.equal(pick(['line', 'circle', 'fill']).kind, 'fill');
  assert.equal(pick(['symbol', 'line']).kind, 'line');
});

test('deriveLayerSwatch treats an un-derivable style container as raster, not blank', () => {
  const remoteStyle = { type: 'style', url: 'https://example.test/style.json', layers: [] };
  assert.equal(deriveLayerSwatch(remoteStyle).kind, 'raster');
  const noPaint = { type: 'style', layers: [{ type: 'fill' }] };
  assert.equal(deriveLayerSwatch(noPaint).kind, 'raster');
});
