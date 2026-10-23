/**
 * OpenLayers draws MapLibre's hillshade from derivative tiles prepared the way
 * MapLibre prepares them; these pin that preparation to MapLibre's numbers.
 */
import test from 'node:test';
import assert from 'node:assert/strict';

import { decodeElevation, prepareDerivatives, type ElevationGrid } from '../src/map/openlayers-services/hillshade';

const SIZE = 256;

/** A bordered grid whose elevation at a pixel is `at(column, row)`, border included. */
function grid(at: (col: number, row: number) => number): ElevationGrid {
    const stride = SIZE + 2;
    const values = new Float32Array(stride * stride);
    for (let row = 0; row < stride; row++) {
        for (let col = 0; col < stride; col++) values[row * stride + col] = at(col - 1, row - 1);
    }
    return { size: SIZE, values };
}

function pixel(rgba: Uint8Array, col: number, row: number): number[] {
    const o = (row * SIZE + col) * 4;
    return Array.from(rgba.subarray(o, o + 4));
}

test('terrarium and mapbox pixels decode as MapLibre decodes them', () => {
    assert.equal(decodeElevation('terrarium', 128, 0, 0), 0);
    assert.equal(decodeElevation('terrarium', 128, 100, 128), 100.5);
    assert.ok(Math.abs(decodeElevation('mapbox', 1, 134, 160)) < 1e-9);
    assert.ok(Math.abs(decodeElevation('mapbox', 1, 134, 170) - 1) < 1e-9);
});

test('flat ground has no slope', () => {
    const rgba = prepareDerivatives(grid(() => 1200), 12, 1500);
    assert.deepEqual(pixel(rgba, 0, 0), [128, 128, 0, 255]);
    assert.deepEqual(pixel(rgba, 200, 100), [128, 128, 0, 255]);
});

test('from zoom 15 the derivative is the true slope: 45° rising east at the equator is 1', () => {
    const z = 15;
    // The tile just south of the equator; a pixel there is this many metres wide.
    const y = Math.pow(2, z - 1);
    const metresPerPixel = 40075016.68557849 / (SIZE * Math.pow(2, z));
    const rgba = prepareDerivatives(grid((col) => col * metresPerPixel), z, y);
    const [x, yDerivative, , alpha] = pixel(rgba, 10, 0);
    // stored as derivative / 8 + 0.5 in a byte
    assert.equal(x, Math.round((1 / 8 + 0.5) * 255));
    assert.equal(yDerivative, 128);
    assert.equal(alpha, 255);
});

test('below zoom 15 MapLibre steepens slopes, 0.3 zoom levels per zoom level', () => {
    const z = 12;
    const y = Math.pow(2, z - 1);
    const metresPerPixel = 40075016.68557849 / (SIZE * Math.pow(2, z));
    // A gentle slope, so the steepened derivative stays below MapLibre's cap of 4.
    const rgba = prepareDerivatives(grid((col) => col * metresPerPixel * 0.1), z, y);
    const expected = 0.1 * Math.pow(2, 0.3 * (15 - z));
    assert.equal(pixel(rgba, 10, 0)[0], Math.round((expected / 8 + 0.5) * 255));
});

test('a pixel without elevation is transparent; its neighbours lean on themselves, not on it', () => {
    const rgba = prepareDerivatives(grid((col, row) => (col === 5 && row === 5 ? NaN : 800)), 12, 1500);
    assert.equal(pixel(rgba, 5, 5)[3], 0);
    assert.deepEqual(pixel(rgba, 6, 5), [128, 128, 0, 255]);
});
