/**
 * `pmtiles://` and `cog://` urls are written the way the libraries defining them
 * write them, and mean the same on every engine: the protocol wraps the file's
 * own address, and a COG's fragment carries how to draw it.
 */
import test from 'node:test';
import assert from 'node:assert/strict';

import { archiveFileUrl, archiveProtocolOf, cogColorRamp } from '../src/map/archive-urls';
import { parseAndValidateConfig } from '../src/config/loader';

test('the protocol is recognised only at the start of the url', () => {
    assert.equal(archiveProtocolOf('pmtiles://https://host/zones.pmtiles'), 'pmtiles');
    assert.equal(archiveProtocolOf('cog://https://host/dem.tif#dem'), 'cog');
    assert.equal(archiveProtocolOf('https://host/tiles/{z}/{x}/{y}.png'), null);
    assert.equal(archiveProtocolOf('https://host/cog://not-a-protocol'), null);
    assert.equal(archiveProtocolOf(['cog://https://host/a.tif']), null);
});

test('the file url drops the protocol and the rendering fragment', () => {
    assert.equal(archiveFileUrl('cog://https://host/data/k.tif#color:BrewerSpectral9,1.7,1.8,c'), 'https://host/data/k.tif');
    assert.equal(archiveFileUrl('pmtiles://https://host/zones.pmtiles'), 'https://host/zones.pmtiles');
});

test('a #color: fragment is read the way maplibre-cog-protocol reads it', () => {
    assert.deepEqual(cogColorRamp('cog://https://host/k.tif#color:BrewerSpectral9,1.7,1.8,c'), {
        scheme: 'BrewerSpectral9', min: 1.7, max: 1.8, continuous: true, reverse: false,
    });
    assert.deepEqual(cogColorRamp('cog://https://host/k.tif#color:CartoEarth,-1,1,c-'), {
        scheme: 'CartoEarth', min: -1, max: 1, continuous: true, reverse: true,
    });
    assert.equal(cogColorRamp('cog://https://host/k.tif#color:CartoEarth,1,100')?.continuous, false);
    assert.equal(cogColorRamp('cog://https://host/k.tif'), null);
    assert.equal(cogColorRamp('cog://https://host/k.tif#color:CartoEarth,low,high'), null);
});

test('a relative cog:// file is resolved against the config, fragment kept', () => {
    const config = parseAndValidateConfig({
        version: 0,
        map: { type: 'maplibre', center: [0, 0], zoom: 2 },
        layerData: {
            sources: [{ id: 'dem', type: 'raster', url: 'cog://../data/dem.tif#color:BrewerGreens9,0,100,c', attribution: 'test' }],
            layers: [],
        },
    }, 'test', 'http://example.org/config/world.json');
    const source = config.layerData.sources?.find((entry) => entry.id === 'dem') as { url?: unknown } | undefined;

    assert.equal(source?.url, 'cog://http://example.org/data/dem.tif#color:BrewerGreens9,0,100,c');
});
