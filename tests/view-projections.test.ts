/**
 * The projection catalog the OpenLayers view can be switched to.
 *
 * These run proj4 for real rather than asserting on the definition strings: a
 * typo in a `+proj=` string produces a projection that still "works" and puts
 * the map somewhere else entirely, which no string comparison would catch.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import proj4 from 'proj4';

import {
    VIEW_PROJECTIONS,
    centreWithinProjection,
    getViewProjectionDef,
    isRegional,
    latitudeRangeOf,
    resolutionScaleAt,
} from '../src/utils/view-projections';

const SAMPLE_POINTS: Array<[number, number]> = [
    [0, 0],
    [4.9, 52.4],
    [-74, 40.7],
    [151.2, -33.9],
    [10, 78],
];

test('every projection has a unique id and something to say for itself', () => {
    const ids = new Set<string>();
    for (const def of VIEW_PROJECTIONS) {
        assert.ok(!ids.has(def.id), `duplicate projection id: ${def.id}`);
        ids.add(def.id);
        assert.ok(def.label.length > 0, `${def.id}: no label`);
        assert.ok(def.description.length > 0, `${def.id}: no description`);
        assert.equal(getViewProjectionDef(def.id), def);
    }
});

test('every proj4 definition projects and inverts', () => {
    for (const def of VIEW_PROJECTIONS) {
        if (!def.proj4) continue;
        const project = proj4('EPSG:4326', def.proj4);
        for (const point of SAMPLE_POINTS) {
            // A polar projection is undefined at the opposite pole; every sample
            // here is well inside each projection's usable area.
            const projected = project.forward(point);
            assert.ok(Number.isFinite(projected[0]) && Number.isFinite(projected[1]),
                `${def.id}: ${point} did not project`);
            const back = project.inverse(projected);
            assert.ok(Math.abs(back[0] - point[0]) < 1e-6 && Math.abs(back[1] - point[1]) < 1e-6,
                `${def.id}: ${point} came back as ${back}`);
        }
    }
});

/**
 * The extent OL derives its resolutions from, measured the same way
 * `projection-support.ts` measures it.
 *
 * This is the test that matters most here: a projection whose extent runs away
 * does not fail visibly, it *hangs the map*, because OL then lays out a tile
 * grid for a world billions of times too large. Sampling EPSG:3031 across the
 * whole globe gives 4e23 m — its antipode, the North Pole, is at infinity under
 * a stereographic projection.
 */
function sampledExtent(definition: string, south: number, north: number): [number, number, number, number] {
    const project = proj4('EPSG:4326', definition);
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (let lon = -180; lon <= 180; lon += 2) {
        for (let lat = south; lat <= north; lat += 2) {
            let point: number[];
            try {
                point = project.forward([lon, lat]);
            } catch {
                continue;
            }
            if (!Number.isFinite(point[0]) || !Number.isFinite(point[1])) continue;
            minX = Math.min(minX, point[0]);
            maxX = Math.max(maxX, point[0]);
            minY = Math.min(minY, point[1]);
            maxY = Math.max(maxY, point[1]);
        }
    }
    return [minX, minY, maxX, maxY];
}

test('every projection is metre-based, because a view in degrees hangs the map', () => {
    // `ol/source/VectorTile.js` scales a source's resolution by the view's
    // metres-per-unit the wrong way round, so a degree-unit view asks the tile
    // source for its deepest zoom and enumerates millions of tiles. Reproduced
    // with nl.json: the tab froze within seconds of switching to EPSG:4326.
    // `projection-support.ts` refuses such a projection; the catalog must not
    // offer one in the first place.
    for (const def of VIEW_PROJECTIONS) {
        if (!def.proj4) {
            // Only Web Mercator may rely on OL's built-in definition, and it is
            // in metres.
            assert.equal(def.id, 'EPSG:3857', `${def.id} has no proj4 definition`);
            continue;
        }
        assert.match(def.proj4, /\+units=m\b/, `${def.id} is not in metres`);
    }
    assert.equal(getViewProjectionDef('EPSG:4326'), undefined, 'EPSG:4326 must not be offered');
});

test('every projection has a finite, Earth-sized extent over its own latitude range', () => {
    for (const def of VIEW_PROJECTIONS) {
        if (!def.proj4) continue;
        const [south, north] = latitudeRangeOf(def.id);
        const [minX, minY, maxX, maxY] = sampledExtent(def.proj4, south, north);
        const width = maxX - minX;
        const height = maxY - minY;
        assert.ok(Number.isFinite(width) && width > 0, `${def.id}: width ${width}`);
        assert.ok(Number.isFinite(height) && height > 0, `${def.id}: height ${height}`);
        // One circumference is 40 075 km; the guard in projection-support.ts
        // rejects anything past 60 000 km.
        assert.ok(width < 60_000_000, `${def.id}: ${(width / 1e6).toFixed(0)} Mm wide would hang the map`);
        assert.ok(height < 60_000_000, `${def.id}: ${(height / 1e6).toFixed(0)} Mm tall would hang the map`);
    }
});

test('a polar projection sampled over the whole globe is exactly the trap this guards', () => {
    // Not a hypothetical: this is what the South Pole entry did before it
    // declared a latitude range, and the symptom was a frozen map rather than an
    // error, which is why the range is enforced by a test.
    const antarctic = getViewProjectionDef('EPSG:3031');
    assert.ok(antarctic?.proj4);
    const [minX, , maxX] = sampledExtent(antarctic!.proj4!, -90, 90);
    assert.ok(maxX - minX > 1e12, 'the whole-globe extent should be astronomically large');
    assert.deepEqual(latitudeRangeOf('EPSG:3031'), [-90, -50]);
});

test('switching to a regional projection moves the centre into its area of use', () => {
    // Amsterdam, on switching to the Antarctic projection.
    const [lon, lat] = centreWithinProjection('EPSG:3031', [4.9, 52.4]);
    assert.equal(lon, 4.9, 'longitude is untouched');
    assert.ok(lat <= -50 && lat >= -90, `expected an Antarctic latitude, got ${lat}`);

    // A global projection leaves the centre alone.
    assert.deepEqual(centreWithinProjection('EPSG:8857', [4.9, 52.4]), [4.9, 52.4]);
});

test('only the polar projections describe themselves as regional', () => {
    assert.equal(isRegional('EPSG:3031'), true);
    assert.equal(isRegional('EPSG:3575'), true);
    for (const id of ['EPSG:3857', 'ESRI:54001', 'EPSG:8857', 'ESRI:54009', 'EPSG:6933']) {
        assert.equal(isRegional(id), false, `${id} covers the world`);
    }
});

/** Area of a small lon/lat quad after projection, in projection units². */
function projectedArea(definition: string, lon: number, lat: number, size = 0.5): number {
    const project = proj4('EPSG:4326', definition);
    const ring = [
        project.forward([lon, lat]),
        project.forward([lon + size, lat]),
        project.forward([lon + size, lat + size]),
        project.forward([lon, lat + size]),
    ];
    let sum = 0;
    for (let i = 0; i < ring.length; i++) {
        const [x1, y1] = ring[i];
        const [x2, y2] = ring[(i + 1) % ring.length];
        sum += x1 * y2 - x2 * y1;
    }
    return Math.abs(sum / 2);
}

/**
 * The claim the tool makes to the user — "equal area: sizes are comparable" —
 * checked rather than asserted in prose.
 *
 * A quad of the same *ground* area at 60°N covers half the longitude span of one
 * at the equator, so the comparison uses quads whose ground areas match and asks
 * whether the projection kept them equal.
 */
test('projections marked equal-area really preserve area', () => {
    for (const def of VIEW_PROJECTIONS) {
        if (!def.proj4 || !def.equalArea) continue;
        // At 60°N a 1°x0.5° quad has the same ground area as 0.5°x0.5° at the
        // equator, because a degree of longitude is cos(60) = ½ as wide.
        const equator = projectedArea(def.proj4, 0, 0, 0.5);
        const north = projectedArea(def.proj4, 0, 60, 0.5) * 2;
        const ratio = north / equator;
        assert.ok(Math.abs(ratio - 1) < 0.02, `${def.id}: area ratio ${ratio.toFixed(3)} is not 1`);
    }
});

test('Web Mercator is not equal-area, and the catalog says so', () => {
    const mercator = getViewProjectionDef('EPSG:3857');
    assert.ok(mercator && !mercator.equalArea);
    const definition = '+proj=merc +a=6378137 +b=6378137 +lat_ts=0 +lon_0=0 +units=m +no_defs';
    const ratio = (projectedArea(definition, 0, 60, 0.5) * 2) / projectedArea(definition, 0, 0, 0.5);
    // Mercator inflates area by 1/cos²(lat); at 60° that is a factor of four.
    assert.ok(ratio > 3.5, `expected Mercator to inflate area at 60°N, got ${ratio.toFixed(2)}`);
});

/**
 * `resolutionScaleAt` is projection units per ground metre. Switching the view
 * divides by it and then multiplies by the new one; having it upside down keeps
 * every test green and makes the map jump by cos²(latitude) — 2.6x at 52°N —
 * which is how this was found in the first place.
 */
test('resolution scale is projection units per ground metre', () => {
    // Metric projections: a unit is a metre, everywhere.
    for (const def of VIEW_PROJECTIONS) {
        if (!def.metric) continue;
        assert.equal(resolutionScaleAt(def.id, 0), 1, `${def.id} at the equator`);
        assert.equal(resolutionScaleAt(def.id, 60), 1, `${def.id} at 60°`);
    }

    // Mercator's unit is a metre at the equator and 1/cos(lat) of one elsewhere.
    assert.ok(Math.abs(resolutionScaleAt('EPSG:3857', 0) - 1) < 1e-9);
    assert.ok(Math.abs(resolutionScaleAt('EPSG:3857', 60) - 2) < 1e-6);
});
