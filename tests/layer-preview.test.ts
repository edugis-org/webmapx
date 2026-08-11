import test from 'node:test';
import assert from 'node:assert/strict';

import {
  PREVIEW_ANCHOR,
  backgroundColorFromStyle,
  choosePreviewTile,
  fillTileTemplate,
  fitZoomToBounds,
  lonLatToTile,
  resolveRasterPreviewUrl,
  resolveWmsPreviewUrl,
  tileToBBox3857,
  tileToQuadkey,
} from '../scripts/lib/layer-preview';

/** True when the tile's lon/lat footprint lies wholly within the extent. */
function tileInsideBounds(
  tile: { z: number; x: number; y: number },
  b: [number, number, number, number],
): boolean {
  const n = 2 ** tile.z;
  const lon = (x: number) => (x / n) * 360 - 180;
  const lat = (y: number) => {
    const r = Math.PI - (2 * Math.PI * y) / n;
    return (180 / Math.PI) * Math.atan(0.5 * (Math.exp(r) - Math.exp(-r)));
  };
  return (
    lon(tile.x) >= b[0] && lon(tile.x + 1) <= b[2] && lat(tile.y + 1) >= b[1] && lat(tile.y) <= b[3]
  );
}

test('lonLatToTile matches known slippy-map tiles', () => {
  // z0 is a single tile
  assert.deepEqual(lonLatToTile(0, 0, 0), { z: 0, x: 0, y: 0 });
  // Frankfurt at z6 -> the tile covering central Europe
  assert.deepEqual(lonLatToTile(PREVIEW_ANCHOR.lon, PREVIEW_ANCHOR.lat, 6), { z: 6, x: 33, y: 21 });
  // Null Island at z1 sits at the corner of the four world tiles
  assert.deepEqual(lonLatToTile(0, 0, 1), { z: 1, x: 1, y: 1 });
});

test('lonLatToTile clamps beyond the web-mercator limits instead of going out of range', () => {
  const north = lonLatToTile(0, 89, 4);
  assert.ok(north.y >= 0 && north.y < 2 ** 4);
  const south = lonLatToTile(0, -89, 4);
  assert.ok(south.y >= 0 && south.y < 2 ** 4);
});

test('choosePreviewTile uses the shared anchor for world-scale layers', () => {
  assert.deepEqual(choosePreviewTile({}), { z: 6, x: 33, y: 21 });
});

test('choosePreviewTile samples inside the layer extent when the anchor is outside it', () => {
  // A Netherlands-only layer: Frankfurt is outside, so sample the centre, and
  // deep enough that the tile fits inside the extent instead of surrounding it.
  const nlBounds: [number, number, number, number] = [3.2, 50.75, 7.22, 53.7];
  const nl = choosePreviewTile({ bounds: nlBounds });
  const zFit = fitZoomToBounds(nlBounds);
  assert.ok(zFit > 6, 'a country-sized extent needs more than the world zoom');
  assert.deepEqual(nl, lonLatToTile((3.2 + 7.22) / 2, (50.75 + 53.7) / 2, zFit));
  assert.ok(tileInsideBounds(nl, nlBounds), 'sampled tile must lie inside the extent');
  // An anchor-containing extent keeps the anchor.
  const world = choosePreviewTile({ bounds: [-180, -85, 180, 85] });
  assert.deepEqual(world, lonLatToTile(PREVIEW_ANCHOR.lon, PREVIEW_ANCHOR.lat, 6));
});

test('choosePreviewTile respects minzoom so a large-scale layer is not sampled blank', () => {
  // cadastral parcels: minzoom 16, NL only
  const parcels = choosePreviewTile({ bounds: [3.2, 50.75, 7.22, 53.7], minzoom: 16 });
  assert.equal(parcels.z, 16);
  // fractional minzoom rounds up, so the tile actually exists
  assert.equal(choosePreviewTile({ minzoom: 15.5 }).z, 16);
});

test('choosePreviewTile respects maxzoom', () => {
  assert.equal(choosePreviewTile({ maxzoom: 4 }).z, 4);
  // a layer capped below the anchor zoom still yields a valid tile index
  const t = choosePreviewTile({ maxzoom: 2 });
  assert.ok(t.x < 4 && t.y < 4);
});

test('fillTileTemplate substitutes z/x/y and picks a subdomain', () => {
  assert.equal(
    fillTileTemplate('https://a.tile.example/{z}/{x}/{y}.png', { z: 6, x: 33, y: 21 }),
    'https://a.tile.example/6/33/21.png',
  );
  assert.equal(
    fillTileTemplate('https://{s}.tile.example/{z}/{x}/{y}.png', { z: 1, x: 0, y: 1 }),
    'https://a.tile.example/1/0/1.png',
  );
  assert.equal(
    fillTileTemplate('https://{a-c}.tile.example/{z}/{x}/{y}.png', { z: 1, x: 0, y: 1 }),
    'https://a.tile.example/1/0/1.png',
  );
});

test('fillTileTemplate flips the row for TMS templates', () => {
  // at z2 there are 4 rows, so y=1 becomes 2
  assert.equal(
    fillTileTemplate('https://tms.example/{z}/{x}/{-y}.png', { z: 2, x: 0, y: 1 }),
    'https://tms.example/2/0/2.png',
  );
});

test('fillTileTemplate handles query-string templates', () => {
  assert.equal(
    fillTileTemplate('https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', { z: 6, x: 33, y: 21 }),
    'https://mt1.google.com/vt/lyrs=s&x=33&y=21&z=6',
  );
});

test('fillTileTemplate substitutes a VirtualEarth quadkey', () => {
  // One base-4 digit per zoom level: quadrant order is 0=NW, 1=NE, 2=SW, 3=SE.
  assert.equal(tileToQuadkey({ z: 1, x: 0, y: 0 }), '0');
  assert.equal(tileToQuadkey({ z: 1, x: 1, y: 1 }), '3');
  assert.equal(tileToQuadkey({ z: 3, x: 3, y: 5 }), '213');
  assert.equal(
    fillTileTemplate('https://ecn.t0.tiles.virtualearth.net/tiles/a{quadkey}.jpeg?g=1', { z: 3, x: 3, y: 5 }),
    'https://ecn.t0.tiles.virtualearth.net/tiles/a213.jpeg?g=1',
  );
});

test('resolveRasterPreviewUrl handles a quadkey source, which carries no {z}', () => {
  const layer = { type: 'raster' };
  const source = {
    type: 'raster',
    url: ['https://ecn.t0.tiles.virtualearth.net/tiles/a{quadkey}.jpeg?g=1'],
    maxzoom: 18,
  };
  const url = resolveRasterPreviewUrl(layer, source);
  assert.ok(url && /\/tiles\/a[0-3]+\.jpeg/.test(url), `expected a quadkey tile url, got ${url}`);
});

test('resolveRasterPreviewUrl builds a tile URL from a raster source', () => {
  const url = resolveRasterPreviewUrl(
    { id: 'osm', type: 'raster', source: 'xyz' },
    { type: 'raster', tiles: ['https://a.tile.openstreetmap.org/{z}/{x}/{y}.png'], maxzoom: 19 },
  );
  assert.equal(url, 'https://a.tile.openstreetmap.org/6/33/21.png');
});

test('resolveRasterPreviewUrl declines anything that is not a templated raster', () => {
  assert.equal(resolveRasterPreviewUrl({ type: 'style', url: 'https://x/style.json' }, {}), null);
  assert.equal(resolveRasterPreviewUrl({ type: 'allmaps' }, {}), null);
  assert.equal(resolveRasterPreviewUrl({ type: 'fill' }, { tiles: ['https://x/{z}/{x}/{y}.png'] }), null);
  // raster, but the source has no template to fill
  assert.equal(resolveRasterPreviewUrl({ type: 'raster' }, { type: 'raster' }), null);
  assert.equal(resolveRasterPreviewUrl(null, null), null);
});

test('resolveRasterPreviewUrl honours the layer extent and minzoom', () => {
  const url = resolveRasterPreviewUrl(
    { type: 'raster', minzoom: 16 },
    { type: 'raster', tiles: ['https://pdok.example/{z}/{x}/{y}.png'], bounds: [3.2, 50.75, 7.22, 53.7] },
  );
  const expected = choosePreviewTile({ bounds: [3.2, 50.75, 7.22, 53.7], minzoom: 16 });
  assert.equal(url, `https://pdok.example/${expected.z}/${expected.x}/${expected.y}.png`);
});

test('backgroundColorFromStyle reads the paper colour of a vector style', () => {
  const style = {
    layers: [
      { id: 'bg', type: 'background', paint: { 'background-color': '#f8f4f0' } },
      { id: 'water', type: 'fill', paint: { 'fill-color': '#a0c8f0' } },
    ],
  };
  assert.equal(backgroundColorFromStyle(style), '#f8f4f0');
});

test('backgroundColorFromStyle returns null when there is nothing to read', () => {
  assert.equal(backgroundColorFromStyle({ layers: [{ id: 'w', type: 'fill' }] }), null);
  assert.equal(backgroundColorFromStyle({}), null);
  assert.equal(backgroundColorFromStyle(null), null);
  // data-driven background expressions are not a single colour
  assert.equal(
    backgroundColorFromStyle({ layers: [{ type: 'background', paint: { 'background-color': ['get', 'c'] } }] }),
    null,
  );
});

test('resolveRasterPreviewUrl accepts the runtime source shape, where url may be an array', () => {
  // This is what webmapx hands components at runtime: `url`, not `tiles`, and
  // one entry per subdomain.
  const osm = resolveRasterPreviewUrl(
    { id: 'osm', type: 'raster', source: 'xyz-source' },
    {
      id: 'xyz-source',
      type: 'raster',
      service: 'xyz',
      url: [
        'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
        'https://b.tile.openstreetmap.org/{z}/{x}/{y}.png',
        'https://c.tile.openstreetmap.org/{z}/{x}/{y}.png',
      ],
      maxzoom: 19,
    },
  );
  assert.equal(osm, 'https://a.tile.openstreetmap.org/6/33/21.png');

  // single-string runtime url with the placeholders in a query string
  const google = resolveRasterPreviewUrl(
    { type: 'raster' },
    { type: 'raster', service: 'xyz', url: 'https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}' },
  );
  assert.equal(google, 'https://mt1.google.com/vt/lyrs=s&x=33&y=21&z=6');
});

test('resolveRasterPreviewUrl ignores a non-templated url such as a WMS endpoint', () => {
  assert.equal(
    resolveRasterPreviewUrl({ type: 'raster' }, { type: 'raster', url: 'https://example.test/wms?' }),
    null,
  );
  assert.equal(
    resolveRasterPreviewUrl({ type: 'raster' }, { type: 'raster', url: ['https://example.test/a.png'] }),
    null,
  );
});

test('tileToBBox3857 covers the whole world at z0 and quarters it at z1', () => {
  const world = tileToBBox3857({ z: 0, x: 0, y: 0 });
  assert.ok(Math.abs(world[0] + 20037508.34) < 1);
  assert.ok(Math.abs(world[3] - 20037508.34) < 1);
  // top-left tile at z1 is the north-west quadrant
  const nw = tileToBBox3857({ z: 1, x: 0, y: 0 });
  assert.ok(Math.abs(nw[2] - 0) < 1);
  assert.ok(Math.abs(nw[1] - 0) < 1);
});

test('fillTileTemplate substitutes a bbox template without eating it as a subdomain range', () => {
  const url = fillTileTemplate('https://t1.example/tilecache?bbox={bbox-epsg-3857}', { z: 1, x: 0, y: 0 });
  const bbox = url.split('bbox=')[1];
  assert.equal(bbox.split(',').length, 4);
  // "epsg-3857" must survive the {a-c} subdomain rule
  assert.ok(!url.includes('{'));
  assert.ok(!url.includes('epsg'.repeat(2)));
});

test('resolveRasterPreviewUrl accepts a bbox-templated tile cache that has no {z}', () => {
  const url = resolveRasterPreviewUrl(
    { type: 'raster' },
    { type: 'raster', url: ['https://t1.example/tilecache.py?SERVICE=WMS&bbox={bbox-epsg-3857}'] },
  );
  assert.ok(url && url.includes('bbox='));
  assert.ok(url && !url.includes('{bbox'));
});

test('resolveWmsPreviewUrl builds a GetMap for an untemplated WMS endpoint', () => {
  const url = resolveWmsPreviewUrl(
    { type: 'raster', minzoom: 15 },
    {
      type: 'raster', service: 'wms', url: 'https://service.pdok.nl/lv/bag/wms/v2_0',
      layers: 'pand', format: 'image/png', version: '1.1.1', crs: 'EPSG:3857',
      bounds: [3.2, 50.75, 7.22, 53.7],
    },
  );
  assert.ok(url);
  const q = new URL(url!).searchParams;
  assert.equal(q.get('REQUEST'), 'GetMap');
  assert.equal(q.get('LAYERS'), 'pand');
  assert.equal(q.get('SRS'), 'EPSG:3857');   // 1.1.1 uses SRS
  assert.equal(q.get('BBOX')?.split(',').length, 4);
});

test('resolveWmsPreviewUrl uses CRS instead of SRS for WMS 1.3.0', () => {
  const url = resolveWmsPreviewUrl(
    { type: 'raster' },
    { type: 'raster', url: 'https://example.test/wms', layers: 'x', version: '1.3.0' },
  );
  const q = new URL(url!).searchParams;
  assert.equal(q.get('CRS'), 'EPSG:3857');
  assert.equal(q.get('SRS'), null);
});

test('resolveWmsPreviewUrl declines templated urls and non-raster layers', () => {
  assert.equal(resolveWmsPreviewUrl({ type: 'raster' }, { url: 'https://x/{z}/{x}/{y}.png', layers: 'a' }), null);
  assert.equal(resolveWmsPreviewUrl({ type: 'style' }, { url: 'https://x/wms', layers: 'a' }), null);
  assert.equal(resolveWmsPreviewUrl({ type: 'raster' }, { url: 'https://x/wms' }), null);
});
