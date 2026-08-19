/**
 * Cartograms: GeoJSON in, GeoJSON out.
 *
 * These test the maths directly rather than through the geoprocessing pipeline
 * (which `geoprocessing.test.ts` covers): what matters is that output *area* is
 * proportional to the value, and area is exactly the thing a visual check is
 * worst at judging.
 */
import test from 'node:test';
import assert from 'node:assert/strict';

import path from 'node:path';

import { cartogram, featureArea, featureCentroid } from '../src/utils/cartogram';

// Taken from the repository rather than resolved: the tests are bundled into a
// temp directory, so neither `import.meta.url` nor `require.resolve` can find
// node_modules from where this code ends up running. `npm test` runs with the
// repository as its working directory.
const GO_CART_WASM = path.join(process.cwd(), 'node_modules/go-cart-wasm/dist/cart.wasm');

type FC = GeoJSON.FeatureCollection;

function square(x: number, y: number, size: number, props: Record<string, unknown>): GeoJSON.Feature {
    return {
        type: 'Feature',
        properties: props,
        geometry: {
            type: 'Polygon',
            coordinates: [[[x, y], [x + size, y], [x + size, y + size], [x, y + size], [x, y]]],
        },
    };
}

function fc(...features: GeoJSON.Feature[]): FC {
    return { type: 'FeatureCollection', features };
}

/**
 * Three squares of equal *ground* area, carrying very different values.
 *
 * All on the equator on purpose: equal degree spans are only equal ground areas
 * at one latitude, and this fixture is about the value-to-area rule. The
 * latitude dependence is what the "square degrees are not an area" test covers.
 */
const EQUAL_SQUARES: FC = fc(
    square(0, 0, 1, { name: 'a', pop: 100 }),
    square(3, 0, 1, { name: 'b', pop: 300 }),
    square(6, 0, 1, { name: 'c', pop: 200 }),
);

test('square degrees are not an area: the same box is smaller further north', async () => {
    // The reason this module measures on the sphere at all. GeoJSON is lon/lat
    // (RFC 7946), and a 10x10-degree box at 60°N covers about half the ground of
    // one on the equator — measuring in degrees would hand the northern one twice
    // the area it has, and the cartogram would be sized by that error.
    const equator = featureArea(square(0, 0, 10, {}).geometry);
    const north = featureArea(square(0, 55, 10, {}).geometry);
    const ratio = north / equator;
    assert.ok(ratio > 0.4 && ratio < 0.65, `expected roughly half, got ${ratio.toFixed(3)}`);

    // And the numbers are real square metres, not an abstract unit: a degree of
    // latitude is ~111 km, so a 10-degree box at the equator is ~1.2e12 m².
    assert.ok(equator > 1.1e12 && equator < 1.4e12, `${equator.toExponential(2)} m²`);
});

test('featureArea excludes holes and handles multipart geometry', async () => {
    const withHole: GeoJSON.Geometry = {
        type: 'Polygon',
        coordinates: [
            [[0, 0], [10, 0], [10, 10], [0, 10], [0, 0]],
            [[2, 2], [4, 2], [4, 4], [2, 4], [2, 2]],
        ],
    };
    const solid = featureArea(square(0, 0, 10, {}).geometry);
    const hole = featureArea(square(2, 2, 2, {}).geometry);
    assert.ok(Math.abs(featureArea(withHole) - (solid - hole)) < 1, 'the hole is subtracted');

    const multi: GeoJSON.Geometry = {
        type: 'MultiPolygon',
        coordinates: [
            [[[0, 0], [2, 0], [2, 2], [0, 2], [0, 0]]],
            [[[10, 0], [13, 0], [13, 3], [10, 3], [10, 0]]],
        ],
    };
    const parts = featureArea(square(0, 0, 2, {}).geometry) + featureArea(square(10, 0, 3, {}).geometry);
    assert.ok(Math.abs(featureArea(multi) - parts) < 1, 'parts are summed');
});

test('featureCentroid weights parts by area, not by vertex count', async () => {
    // A big plain square and a tiny but finely drawn one: a vertex mean would be
    // dragged towards the detailed part.
    const detailed: GeoJSON.Position[] = [];
    for (let i = 0; i <= 40; i++) detailed.push([100 + Math.cos((i / 40) * 2 * Math.PI), Math.sin((i / 40) * 2 * Math.PI)]);
    const geometry: GeoJSON.Geometry = {
        type: 'MultiPolygon',
        coordinates: [
            [[[0, 0], [20, 0], [20, 20], [0, 20], [0, 0]]],
            [detailed],
        ],
    };
    const centre = featureCentroid(geometry)!;
    assert.ok(centre[0] < 15, `expected the centroid near the large part, got ${centre[0]}`);
});

test('scaled cartogram makes area proportional to the value', async () => {
    const out = (await cartogram(EQUAL_SQUARES, { field: 'pop', method: 'scaled' })).features;
    assert.equal(out.features.length, 3);

    const areaOf = (name: string) => featureArea(out.features.find(f => f.properties?.name === name)!.geometry);
    const a = areaOf('a'), b = areaOf('b'), c = areaOf('c');
    // Values 100 / 300 / 200 — areas must follow, whatever the inputs were.
    assert.ok(Math.abs(b / a - 3) < 1e-3, `b/a = ${b / a}`);
    assert.ok(Math.abs(c / a - 2) < 1e-3, `c/a = ${c / a}`);
});

test('a continent-sized shape keeps its area to within a rounding error', async () => {
    // The one approximation in the module, measured rather than hand-waved: a
    // ring's edges are straight lines in lon/lat (the GeoJSON convention), and
    // scaling in an equal-area plane bends them slightly differently, so the area
    // of the result is not exactly factor² times the original. It scales with the
    // size of the shape — 0.0001% for a half-degree square, 0.03% for a ten-degree
    // one, which is 1100 km across.
    const huge = fc(
        square(0, 0, 10, { name: 'a', pop: 100 }),
        square(30, 0, 10, { name: 'b', pop: 300 }),
    );
    const out = (await cartogram(huge, { field: 'pop', method: 'scaled' })).features;
    const areaOf = (name: string) => featureArea(out.features.find(f => f.properties?.name === name)!.geometry);
    const ratio = areaOf('b') / areaOf('a');
    assert.ok(Math.abs(ratio - 3) < 0.01, `b/a = ${ratio}`);
});

test('a cartogram keeps the total area of the layer', async () => {
    // Only the distribution of area changes, so two cartograms of one layer are
    // comparable and a layer measured in millions does not produce continents.
    const before = EQUAL_SQUARES.features.reduce((sum, f) => sum + featureArea(f.geometry), 0);
    const after = (await cartogram(EQUAL_SQUARES, { field: 'pop', method: 'scaled' })).features
        .features.reduce((sum, f) => sum + featureArea(f.geometry), 0);
    assert.ok(Math.abs(after / before - 1) < 1e-4, `total area changed by ${(after / before - 1) * 100}%`);
});

test('scaled features stay where they were and keep their attributes', async () => {
    const out = (await cartogram(EQUAL_SQUARES, { field: 'pop', method: 'scaled' })).features;
    for (const feature of out.features) {
        const original = EQUAL_SQUARES.features.find(f => f.properties?.name === feature.properties?.name)!;
        const before = featureCentroid(original.geometry)!;
        const after = featureCentroid(feature.geometry)!;
        assert.ok(Math.abs(after[0] - before[0]) < 1e-3 && Math.abs(after[1] - before[1]) < 1e-3,
            `${feature.properties?.name} moved from ${before} to ${after}`);
        assert.equal(feature.properties?.pop, original.properties?.pop);
    }
});

test('dorling draws circles of proportional area that do not overlap', async () => {
    const out = (await cartogram(EQUAL_SQUARES, { field: 'pop', method: 'dorling', iterations: 200 })).features;
    assert.equal(out.features.length, 3);

    // Compared by area rather than by the reported radius: what the reader judges
    // is the size of the disc.
    const areaOf = (name: string) => featureArea(out.features.find(f => f.properties?.name === name)!.geometry);
    assert.ok(Math.abs(areaOf('b') / areaOf('a') - 3) < 0.01, `b/a = ${areaOf('b') / areaOf('a')}`);
    assert.ok(Math.abs(areaOf('c') / areaOf('a') - 2) < 0.01, `c/a = ${areaOf('c') / areaOf('a')}`);

    const circles = out.features.map(f => ({
        name: String(f.properties?.name),
        r: Number(f.properties?.cartogram_radius_m),
        c: featureCentroid(f.geometry)!,
    }));
    for (let i = 0; i < circles.length; i++) {
        for (let j = i + 1; j < circles.length; j++) {
            // Ground distance between the centres, since the radii are in metres.
            const distance = groundDistance(circles[i].c, circles[j].c);
            const wanted = circles[i].r + circles[j].r;
            // Slack, not equality: separation stops after a fixed number of rounds,
            // and it runs in a plane whose scale is exact only along one parallel.
            assert.ok(distance > wanted * 0.98, `${circles[i].name}/${circles[j].name} overlap by ${Math.round(wanted - distance)} m`);
        }
    }
});

/** Great-circle distance in metres, for checking circles that are sized in metres. */
function groundDistance([lon1, lat1]: GeoJSON.Position, [lon2, lat2]: GeoJSON.Position): number {
    const R = 6371008.8, rad = Math.PI / 180;
    const dLat = (lat2 - lat1) * rad;
    const dLon = (lon2 - lon1) * rad;
    const a = Math.sin(dLat / 2) ** 2
        + Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(dLon / 2) ** 2;
    return 2 * R * Math.asin(Math.min(Math.sqrt(a), 1));
}

test('coincident centres are separated rather than turned into NaN', async () => {
    // Two features with the same centroid have no direction to move apart along.
    const stacked = fc(
        square(0, 0, 10, { name: 'a', v: 1 }),
        square(0, 0, 10, { name: 'b', v: 1 }),
    );
    const out = (await cartogram(stacked, { field: 'v', method: 'dorling', iterations: 50 })).features;
    for (const feature of out.features) {
        const centre = featureCentroid(feature.geometry)!;
        assert.ok(Number.isFinite(centre[0]) && Number.isFinite(centre[1]), `centre is ${centre}`);
    }
    const [a, b] = out.features.map(f => featureCentroid(f.geometry)!);
    assert.ok(Math.hypot(a[0] - b[0], a[1] - b[1]) > 1, 'the two circles were separated');
});

/** A 3x3 block of touching squares, the shape a contiguous cartogram is for. */
function grid(values: number[]): FC {
    const features: GeoJSON.Feature[] = [];
    for (let row = 0; row < 3; row++) {
        for (let col = 0; col < 3; col++) {
            const index = row * 3 + col;
            features.push(square(col, row, 1, { name: `c${index}`, v: values[index] }));
        }
    }
    return fc(...features);
}

/** Vertices a feature has, rounded, so two neighbours can be compared. */
function vertexKeys(feature: GeoJSON.Feature): Set<string> {
    const g = feature.geometry;
    const polys = g.type === 'Polygon' ? [g.coordinates] : (g as GeoJSON.MultiPolygon).coordinates;
    return new Set(polys.flat(2).map(p => `${p[0].toFixed(9)},${p[1].toFixed(9)}`));
}

test('a contiguous cartogram keeps neighbours joined along their shared border', async () => {
    // The property that separates this from the other two methods, and the whole
    // reason it exists: the shapes are not resized one by one, every boundary
    // point moves under the forces of all regions at once. Two features sharing a
    // border share those coordinates, so both copies move identically.
    const input = grid([1, 5, 1, 5, 20, 5, 1, 5, 1]);
    const out = (await cartogram(input, { field: 'v', method: 'contiguous', passes: 8 })).features;

    const sharedBefore = (a: string, b: string) => {
        const ka = vertexKeys(input.features.find(f => f.properties?.name === a)!);
        const kb = vertexKeys(input.features.find(f => f.properties?.name === b)!);
        return [...ka].filter(k => kb.has(k)).length;
    };
    const sharedAfter = (a: string, b: string) => {
        const ka = vertexKeys(out.features.find(f => f.properties?.name === a)!);
        const kb = vertexKeys(out.features.find(f => f.properties?.name === b)!);
        return [...ka].filter(k => kb.has(k)).length;
    };

    for (const [a, b] of [['c0', 'c1'], ['c1', 'c2'], ['c1', 'c4'], ['c4', 'c7']]) {
        assert.ok(sharedBefore(a, b) > 0, `${a}/${b} should share vertices to begin with`);
        assert.equal(sharedAfter(a, b), sharedBefore(a, b), `${a}/${b} came apart`);
    }
});

test('a contiguous cartogram moves area towards the value', async () => {
    // Not "matches the value": a rubber sheet trades exactness for staying joined
    // up, and every region is pulling against its neighbours. What must be true is
    // that the big value ends up much bigger than the small ones, and that more
    // passes get closer rather than further away.
    const input = grid([1, 1, 1, 1, 20, 1, 1, 1, 1]);
    const areaOf = (out: FC, name: string) =>
        featureArea(out.features.find(f => f.properties?.name === name)!.geometry);

    const before = areaOf(input, 'c4') / areaOf(input, 'c0');
    assert.ok(Math.abs(before - 1) < 0.05, 'the input squares start out the same size');

    const coarse = (await cartogram(input, { field: 'v', method: 'contiguous', passes: 3 })).features;
    const fine = (await cartogram(input, { field: 'v', method: 'contiguous', passes: 15 })).features;

    const ratio = (out: FC) => areaOf(out, 'c4') / areaOf(out, 'c0');
    assert.ok(ratio(coarse) > 2, `expected the middle square to grow, got ${ratio(coarse).toFixed(1)}x`);
    // Target is 20x; more passes must get closer to it, not overshoot away.
    assert.ok(Math.abs(ratio(fine) - 20) < Math.abs(ratio(coarse) - 20),
        `15 passes (${ratio(fine).toFixed(1)}x) should beat 3 passes (${ratio(coarse).toFixed(1)}x)`);
});

test('a diffusion cartogram hits the target areas, not just the direction', async () => {
    // The reason this method exists. Where the rubber sheet above is asserted on
    // *convergence*, the flow-based one solves the density-equalising problem
    // itself, so the areas it produces can be checked against the values
    // outright. Same grid, same 20:1 value, and no tolerance beyond a percent.
    const input = grid([1, 1, 1, 1, 20, 1, 1, 1, 1]);
    // The tests are bundled into a temp directory, so the WASM binary cannot be
    // found next to the bundle — the same reason the browser has to be told, and
    // why the option exists at all.
    const out = (await cartogram(input, { field: 'v', method: 'diffusion', wasmUrl: GO_CART_WASM })).features;

    const areaOf = (name: string) =>
        featureArea(out.features.find(f => f.properties?.name === name)!.geometry);
    const ratio = areaOf('c4') / areaOf('c0');
    assert.ok(Math.abs(ratio - 20) / 20 < 0.05, `expected 20x by area, got ${ratio.toFixed(2)}x`);

    // Every corner carries the same value, so they must come out the same size.
    const corners = ['c0', 'c2', 'c6', 'c8'].map(areaOf);
    const spread = Math.max(...corners) / Math.min(...corners);
    assert.ok(spread < 1.05, `equal values must give equal areas, spread was ${spread.toFixed(2)}`);
    assert.equal(out.features.length, input.features.length);
});

test('the @edugis/cartogram flow method hits the same target areas', async () => {
    // Same assertion as the go-cart test above, on the same grid: the two are
    // implementations of one algorithm, so a difference here is a bug in one of
    // them rather than a property of the method. No wasmUrl — this one is
    // TypeScript and needs no binary.
    const input = grid([1, 1, 1, 1, 20, 1, 1, 1, 1]);
    const out = (await cartogram(input, { field: 'v', method: 'flow' })).features;

    const areaOf = (name: string) =>
        featureArea(out.features.find(f => f.properties?.name === name)!.geometry);
    const ratio = areaOf('c4') / areaOf('c0');
    assert.ok(Math.abs(ratio - 20) / 20 < 0.05, `expected 20x by area, got ${ratio.toFixed(2)}x`);

    const corners = ['c0', 'c2', 'c6', 'c8'].map(areaOf);
    const spread = Math.max(...corners) / Math.min(...corners);
    assert.ok(spread < 1.05, `equal values must give equal areas, spread was ${spread.toFixed(2)}`);
    assert.equal(out.features.length, input.features.length);
});

test('a contiguous cartogram keeps every feature and its attributes', async () => {
    const input = grid([3, 1, 4, 1, 5, 9, 2, 6, 5]);
    const out = (await cartogram(input, { field: 'v', method: 'contiguous', passes: 6 })).features;
    assert.equal(out.features.length, 9);
    assert.deepEqual(
        out.features.map(f => f.properties?.name).sort(),
        input.features.map(f => f.properties?.name).sort(),
    );
    for (const feature of out.features) {
        const area = featureArea(feature.geometry);
        assert.ok(Number.isFinite(area) && area > 0, `${feature.properties?.name} has area ${area}`);
    }
});

test('a scattered archipelago grows in place instead of flying apart', async () => {
    // Scaling a multipart feature about one centroid multiplies the distance
    // between its parts as well as their size. On world countries sized to equal
    // area this ruined the islands: Tuvalu's nine islets have a centroid in open
    // ocean and a scale factor of 136, and ended up spread over 45 million km² —
    // larger than Russia.
    const islets: GeoJSON.Position[][][] = [];
    for (let i = 0; i < 6; i++) {
        const lon = 176 + i * 0.5;
        islets.push([[[lon, -8], [lon + 0.1, -8], [lon + 0.1, -7.9], [lon, -7.9], [lon, -8]]]);
    }
    const archipelago = fc(
        { type: 'Feature', properties: { name: 'islands', pop: 100 }, geometry: { type: 'MultiPolygon', coordinates: islets } },
        square(150, -8, 5, { name: 'mainland', pop: 100 }),
    );

    const out = (await cartogram(archipelago, { field: 'pop', method: 'scaled' })).features;
    const islands = out.features.find(f => f.properties?.name === 'islands')!;
    const mainland = out.features.find(f => f.properties?.name === 'mainland')!;
    // Equal values, equal ground area.
    const ratio = featureArea(islands.geometry) / featureArea(mainland.geometry);
    assert.ok(Math.abs(ratio - 1) < 0.01, `islands/mainland = ${ratio}`);

    // And the group stays a group: its bounding box must not blow up.
    const lons = (islands.geometry as GeoJSON.MultiPolygon).coordinates.flat(2).map(p => p[0]);
    assert.ok(Math.max(...lons) - Math.min(...lons) < 40,
        `the islands spread over ${(Math.max(...lons) - Math.min(...lons)).toFixed(0)}° of longitude`);
});

test('a feature straddling the date line is measured and placed correctly', async () => {
    // Half the coordinates near +180 and half near -180: the mean of those is 0,
    // which put Fiji's centre in Africa, and a longitude step read the long way
    // round inverted the area.
    const straddling = fc({
        type: 'Feature',
        properties: { name: 'fiji-ish', pop: 100 },
        geometry: {
            type: 'MultiPolygon',
            coordinates: [
                [[[178, -17], [180, -17], [180, -16], [178, -16], [178, -17]]],
                [[[-180, -17], [-179, -17], [-179, -16], [-180, -16], [-180, -17]]],
            ],
        },
    });
    const centre = featureCentroid(straddling.features[0].geometry)!;
    assert.ok(Math.abs(centre[0]) > 170, `centre longitude ${centre[0]} is not in the Pacific`);

    const out = (await cartogram(straddling, { field: 'pop', method: 'scaled' })).features;
    const area = featureArea(out.features[0].geometry);
    assert.ok(Number.isFinite(area) && area > 0, `area came out as ${area}`);
    // Sizing one feature by anything gives it the whole layer's area back.
    const before = featureArea(straddling.features[0].geometry);
    assert.ok(Math.abs(area / before - 1) < 0.01, `area changed by ${((area / before - 1) * 100).toFixed(1)}%`);
});

test('a shape grown past the date line is cut at it, not folded across the map', async () => {
    // Every method works in a metric plane and can push a shape past the edge of
    // it. Folding each coordinate back into range on its own — what the inverse
    // projections used to do — leaves half a ring at each edge of the map, and
    // the renderer joins them straight through the middle: on 257 world
    // countries that smeared the USA (-197°..199°), Russia, New Zealand, Fiji
    // and Kiribati right across the globe.
    const nearTheLine = fc(
        square(176, -2, 4, { name: 'pacific', v: 9 }),
        square(0, 0, 4, { name: 'elsewhere', v: 1 }),
    );
    const out = (await cartogram(nearTheLine, { field: 'v', method: 'scaled' })).features;
    const grown = out.features.find(f => f.properties?.name === 'pacific')!;

    const lons = (grown.geometry as GeoJSON.MultiPolygon | GeoJSON.Polygon).coordinates
        .flat(2).map(p => (Array.isArray(p) ? p[0] : p)) as number[];
    assert.ok(Math.max(...lons) <= 180 + 1e-9 && Math.min(...lons) >= -180 - 1e-9,
        `longitudes ran to ${Math.min(...lons).toFixed(1)}..${Math.max(...lons).toFixed(1)}`);

    // Cut in two, one piece each side of the line — not one piece spanning the
    // whole world the wrong way round.
    assert.equal(grown.geometry.type, 'MultiPolygon');
    const parts = (grown.geometry as GeoJSON.MultiPolygon).coordinates;
    assert.equal(parts.length, 2, 'the shape should be cut into two pieces');
    for (const part of parts) {
        const partLons = part[0].map(p => p[0]);
        assert.ok(Math.max(...partLons) - Math.min(...partLons) < 180,
            `a piece spans ${(Math.max(...partLons) - Math.min(...partLons)).toFixed(0)}° of longitude`);
    }

    // And cutting must not lose or duplicate ground: the pieces together are the
    // area the value asked for.
    const before = featureArea(nearTheLine.features[0].geometry);
    const after = featureArea(grown.geometry);
    const total = nearTheLine.features.reduce((sum, f) => sum + featureArea(f.geometry), 0);
    const target = (total * 9) / 10;
    assert.ok(Math.abs(after / target - 1) < 0.01,
        `area is ${(after / target).toFixed(3)}x the target (was ${(before / 1e9).toFixed(0)} Mm²)`);
});

test('a ring that goes round a pole is kept in one piece', async () => {
    // There is no meridian to cut it at, so it is pressed onto the world instead
    // of being split. Antarctica is the case that matters — cutting it would
    // replace one correct outline with two wrong ones.
    const ring: GeoJSON.Position[] = [];
    // A wavy coastline rather than a parallel: a ring of constant latitude has no
    // area in lon/lat at all, and no centroid to go with it.
    for (let lon = 180; lon >= -180; lon -= 10) ring.push([lon, -70 + 4 * Math.sin(lon * Math.PI / 180)]);
    for (let lon = -180; lon <= 180; lon += 10) ring.push([lon, -85]);
    ring.push(ring[0]);
    const polar = fc({ type: 'Feature', properties: { name: 'antarctica-ish', v: 1 }, geometry: { type: 'Polygon', coordinates: [ring] } });

    const out = (await cartogram(polar, { field: 'v', method: 'scaled' })).features;
    const shape = out.features[0];
    assert.equal(shape.geometry.type, 'Polygon', 'a polar ring must not be cut in two');
    const lons = (shape.geometry as GeoJSON.Polygon).coordinates.flat().map(p => p[0]);
    assert.ok(Math.max(...lons) <= 180 + 1e-9 && Math.min(...lons) >= -180 - 1e-9,
        `longitudes ran to ${Math.min(...lons).toFixed(1)}..${Math.max(...lons).toFixed(1)}`);
});

test('a ring that encircles a pole is measured, not misread', async () => {
    // Dorling circles pushed towards a crowded pole can wrap right round it. The
    // spherical-excess formula measures the region between the ring and the
    // equator and misses the cap, which reported areas hundreds of times too big.
    const cap: GeoJSON.Position[] = [];
    for (let lon = -180; lon <= 180; lon += 10) cap.push([lon, 80]);
    const area = featureArea({ type: 'Polygon', coordinates: [cap] });
    // The cap above 80°N is about 3.9 million km².
    assert.ok(area > 3.5e12 && area < 4.3e12, `${(area / 1e12).toFixed(2)} Mkm² is not a polar cap`);
});

test('features without a usable value are counted, not silently dropped', async () => {
    const mixed = fc(
        square(0, 0, 10, { name: 'ok', v: 5 }),
        square(20, 0, 10, { name: 'missing' }),
        square(40, 0, 10, { name: 'text', v: 'many' }),
        square(60, 0, 10, { name: 'zero', v: 0 }),
        square(80, 0, 10, { name: 'negative', v: -3 }),
        { type: 'Feature', properties: { name: 'point', v: 9 }, geometry: { type: 'Point', coordinates: [0, 0] } },
    );
    const result = await cartogram(mixed, { field: 'v', method: 'scaled' });
    assert.equal(result.features.features.length, 1);
    // The three reasons are kept apart: they mean different things to whoever
    // picked the field.
    assert.equal(result.skipped.missingValue, 2, 'no value, and a value that is not a number');
    assert.equal(result.skipped.nonPositive, 2, 'zero and negative');
    assert.equal(result.skipped.noArea, 1, 'the point');
});

test('the minimum value is a share of the total, and drops are counted', async () => {
    // A share rather than an absolute number, so the same setting means the same
    // thing for people, euros and votes. Total here is 1000: 0.5% is 5.
    const layer = fc(
        square(0, 0, 10, { name: 'big', v: 900 }),
        square(20, 0, 10, { name: 'medium', v: 96 }),
        square(40, 0, 10, { name: 'tiny', v: 4 }),
    );

    const all = await cartogram(layer, { field: 'v', method: 'scaled' });
    assert.equal(all.features.features.length, 3, 'nothing is dropped by default');
    assert.equal(all.skipped.belowMinimum, 0);

    const filtered = await cartogram(layer, { field: 'v', method: 'scaled', minValuePercent: 0.5 });
    assert.deepEqual(filtered.features.features.map(f => f.properties?.name), ['big', 'medium']);
    assert.equal(filtered.skipped.belowMinimum, 1);

    // The kept features share out the kept area, so dropping one does not
    // silently rescale the layer.
    const keptArea = layer.features.slice(0, 2).reduce((sum, f) => sum + featureArea(f.geometry), 0);
    const outArea = filtered.features.features.reduce((sum, f) => sum + featureArea(f.geometry), 0);
    assert.ok(Math.abs(outArea / keptArea - 1) < 1e-3, `area changed by ${((outArea / keptArea - 1) * 100).toFixed(2)}%`);
});

test('a cartogram reports how far its areas ended up from the values', async () => {
    // The approximate methods can return a map that looks like a cartogram and
    // is not — one pass of the rubber sheet barely moves anything. Measuring that
    // is what lets the tool say so instead of drawing a confident lie.
    const input = grid([1, 1, 1, 1, 20, 1, 1, 1, 1]);

    const exact = await cartogram(input, { field: 'v', method: 'scaled' });
    assert.ok(exact.medianAreaError < 0.01, `scaled is exact, got ${exact.medianAreaError}`);

    const barely = await cartogram(input, { field: 'v', method: 'contiguous', passes: 1 });
    assert.ok(barely.medianAreaError > 0.1, `one pass cannot be good, got ${barely.medianAreaError}`);

    const settled = await cartogram(input, { field: 'v', method: 'contiguous', passes: 20 });
    assert.ok(settled.medianAreaError < barely.medianAreaError, 'more passes must report a smaller error');
});

test('a field with nothing usable in it is an error, not an empty map', async () => {
    await assert.rejects(
        () => cartogram(EQUAL_SQUARES, { field: 'nonexistent', method: 'scaled' }),
        /No features have a usable number/,
    );
});
