/**
 * Colouring a map so that neighbours differ.
 *
 * The invariant worth testing is exactly one: **no two adjacent regions share a
 * colour**. How many colours it took is a quality measure, not correctness, so
 * it is asserted as a bound rather than a number.
 */
import test from 'node:test';
import assert from 'node:assert/strict';

import { buildAdjacency, colorByAdjacency, coloringKeyFor, coloringKeyValue, dsatur } from '../src/utils/topological-coloring';
import { colorSchemesFor } from '../src/utils/color-schemes';
import { buildKeyedColorStyle, buildIndexedColorStyle } from '../src/utils/style-builder';
import { evaluateColor } from '../src/utils/maplibre-expression-evaluator';

/** One square cell of a unit grid, as a closed ring. */
function cell(x: number, y: number, properties: GeoJSON.GeoJsonProperties = {}, id?: string | number): GeoJSON.Feature {
    return {
        type: 'Feature',
        ...(id === undefined ? {} : { id }),
        properties,
        geometry: {
            type: 'Polygon',
            coordinates: [[[x, y], [x + 1, y], [x + 1, y + 1], [x, y + 1], [x, y]]],
        },
    };
}

/** A `width × height` grid of touching squares — the hardest easy case. */
function grid(width: number, height: number): GeoJSON.Feature[] {
    const features: GeoJSON.Feature[] = [];
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            features.push(cell(x, y, { name: `${x},${y}` }, `${x}-${y}`));
        }
    }
    return features;
}

function noNeighbourShares(result: { colors: number[]; adjacency: number[][] }): void {
    result.adjacency.forEach((neighbours, i) => {
        for (const neighbour of neighbours) {
            assert.notEqual(result.colors[i], result.colors[neighbour],
                `region ${i} and its neighbour ${neighbour} share colour ${result.colors[i]}`);
        }
    });
}

test('a chessboard of touching squares needs two colours', () => {
    // Edge-sharing only: diagonal neighbours touch at one point, which is not a
    // border, so two colours suffice.
    const result = colorByAdjacency(grid(6, 6));
    noNeighbourShares(result);
    assert.equal(result.colorCount, 2);
});

test('regions touching at a single corner may share a colour', () => {
    // The same rule the four-colour theorem uses: a border is a segment, not a
    // point. Without it a grid would need four colours instead of two.
    const features = [cell(0, 0), cell(1, 1)];
    const adjacency = buildAdjacency(features);
    assert.deepEqual(adjacency, [[], []]);
});

test('regions sharing an edge are neighbours', () => {
    const adjacency = buildAdjacency([cell(0, 0), cell(1, 0)]);
    assert.deepEqual(adjacency, [[1], [0]]);
});

test('a multipart region is one region, so its parts share one colour', () => {
    // This is the case the four-colour theorem excludes and real data is full
    // of: a country with an exclave is several pieces that must match.
    const mainland = cell(0, 0, { name: 'a' }, 'a');
    const neighbour = cell(1, 0, { name: 'b' }, 'b');
    const exclave: GeoJSON.Feature = {
        type: 'Feature',
        id: 'a2',
        properties: { name: 'a' },
        geometry: {
            type: 'MultiPolygon',
            coordinates: [
                [[[2, 0], [3, 0], [3, 1], [2, 1], [2, 0]]],
                [[[0, 2], [1, 2], [1, 3], [0, 3], [0, 2]]],
            ],
        },
    };

    const result = colorByAdjacency([mainland, neighbour, exclave]);
    noNeighbourShares(result);
    // The multipart feature is one region: both its parts take its one colour,
    // and it still differs from the piece it borders.
    assert.notEqual(result.colors[1], result.colors[2]);
});

test('vertices that differ by less than the tolerance still count as shared', () => {
    // Borders exported separately never match exactly. Without a tolerance every
    // region is an island and the whole layer comes back one colour.
    const left = cell(0, 0);
    const right: GeoJSON.Feature = {
        type: 'Feature',
        properties: {},
        geometry: {
            type: 'Polygon',
            // The shared edge is 1e-9 out — a millimetre of longitude.
            coordinates: [[[1.000000001, 0], [2, 0], [2, 1], [1.000000001, 1], [1.000000001, 0]]],
        },
    };

    assert.deepEqual(buildAdjacency([left, right], 1e-12), [[], []], 'exact matching finds nothing');
    assert.deepEqual(buildAdjacency([left, right], 1e-7), [[1], [0]], 'the default tolerance absorbs it');
});

test('a layer whose borders do not touch reports itself as isolated', () => {
    // The caller needs to notice this rather than ship a one-colour map: it
    // means the input has no shared topology, not that the map is simple.
    const separate = [cell(0, 0), cell(10, 0), cell(20, 0)];
    const result = colorByAdjacency(separate, { tolerance: 1e-12 });
    assert.equal(result.isolatedRegions, 3);
    assert.equal(result.colorCount, 1);
});

test('non-polygon features take no part and are counted', () => {
    const features: GeoJSON.Feature[] = [
        cell(0, 0),
        { type: 'Feature', properties: {}, geometry: { type: 'Point', coordinates: [0, 0] } },
    ];
    const result = colorByAdjacency(features);
    assert.equal(result.skipped, 1);
});

test('a dense graph is coloured with no clash, in few colours', () => {
    // A hexagon-like arrangement: every region touches its ring neighbours and
    // the centre. Four colours is the interesting bound.
    const adjacency: number[][] = [
        [1, 2, 3, 4, 5, 6],
        [0, 2, 6], [0, 1, 3], [0, 2, 4], [0, 3, 5], [0, 4, 6], [0, 5, 1],
    ];
    const colors = dsatur(adjacency);
    adjacency.forEach((neighbours, i) => {
        for (const neighbour of neighbours) assert.notEqual(colors[i], colors[neighbour]);
    });
    assert.ok(Math.max(...colors) + 1 <= 4, `used ${Math.max(...colors) + 1} colours`);
});

test('DSATUR beats colouring in input order', () => {
    // A star: the centre touches everything. Colouring in order gives the centre
    // colour 0 and every leaf colour 1 — fine here — but the point is that
    // DSATUR takes the most-constrained region first, so it never needs more
    // colours than the greedy order does.
    const leaves = 8;
    const adjacency: number[][] = [Array.from({ length: leaves }, (_, i) => i + 1)];
    for (let i = 1; i <= leaves; i++) adjacency.push([0]);
    const colors = dsatur(adjacency);
    assert.equal(Math.max(...colors) + 1, 2);
});

test('a colour cap keeps drawing rather than failing', () => {
    // Four regions all touching each other need four colours; capped at three,
    // the map still gets drawn and colorCount reports the cap so the caller can
    // say some neighbours match.
    const adjacency = [[1, 2, 3], [0, 2, 3], [0, 1, 3], [0, 1, 2]];
    const colors = dsatur(adjacency, 3);
    assert.ok(colors.every(color => color >= 0 && color < 3));
    assert.equal(Math.max(...colors) + 1, 3);
});

test('the key is the feature id when there is one, and unique', () => {
    assert.deepEqual(coloringKeyFor(grid(2, 2)), { kind: 'id' });
});

test('without ids, the first unique property is the key', () => {
    const features = [
        cell(0, 0, { region: 'north', code: 'A' }),
        cell(1, 0, { region: 'north', code: 'B' }),
    ];
    // 'region' repeats, so it cannot address a feature; 'code' can.
    assert.deepEqual(coloringKeyFor(features), { kind: 'property', name: 'code' });
});

test('a layer with nothing to tell its features apart returns no key', () => {
    // Not an error: the caller says so instead of colouring the wrong regions.
    const features = [cell(0, 0, { region: 'x' }), cell(1, 0, { region: 'x' })];
    assert.equal(coloringKeyFor(features), null);
});

test('columns that are not unique on their own can be unique together', () => {
    // The normal case for administrative data, and what a tiled layer of 4013
    // regions actually looks like: provinces sharing a name across countries,
    // and every other column repeating too. No single column identifies a
    // feature; name plus country does.
    const features = [
        cell(0, 0, { name: 'Central', admin: 'A' }),
        cell(1, 0, { name: 'Central', admin: 'B' }),
        cell(2, 0, { name: 'North', admin: 'A' }),
        cell(3, 0, { name: 'North', admin: 'B' }),
    ];
    const key = coloringKeyFor(features);
    assert.deepEqual(key && key.kind, 'properties');
    assert.deepEqual(new Set((key as { names: string[] }).names), new Set(['name', 'admin']));
});

test('a composite key paints what it addresses, separator and all', () => {
    // The expression joins the parts itself, so this is really a test that the
    // two spellings agree: get one separator wrong, or spell a missing value
    // differently from MapLibre's `to-string` of null, and every key misses and
    // the whole layer falls back to one colour.
    const features = [
        cell(0, 0, { name: 'Central', admin: 'A' }),
        cell(1, 0, { name: 'Central', admin: 'B' }),
        cell(2, 0, { name: 'North', admin: 'A' }),
        // No `name` at all, which a tile server that omits nulls really does.
        cell(3, 0, { admin: 'B' }),
    ];
    const key = coloringKeyFor(features)!;
    const result = colorByAdjacency(features);
    const scheme = colorSchemesFor(Math.max(3, result.colorCount), 'qual')[0];
    const style = buildKeyedColorStyle({
        role: 'fill',
        key,
        entries: features.map((feature, i) => ({
            key: coloringKeyValue(key, feature)!,
            colorIndex: result.colors[i],
        })),
        scheme,
        fallbackColor: '#ff00ff',
    });

    features.forEach((feature, i) => {
        const painted = normalise(evaluateColor(style.paint['fill-color'], feature, 6, '#000000'));
        assert.notEqual(painted, '#ff00ff', `feature ${i} fell back instead of matching its key`);
        assert.equal(painted, scheme.colors[result.colors[i]], `feature ${i}`);
    });
});

test('the built style paints each region the colour it was given', () => {
    const features = grid(4, 4);
    const result = colorByAdjacency(features);
    const scheme = colorSchemesFor(Math.max(3, result.colorCount), 'qual')[0];
    const style = buildKeyedColorStyle({
        role: 'fill',
        key: { kind: 'id' },
        entries: features.map((feature, i) => ({ key: String(feature.id), colorIndex: result.colors[i] })),
        scheme,
    });

    features.forEach((feature, i) => {
        const painted = evaluateColor(style.paint['fill-color'], feature, 6, '#000000');
        assert.equal(normalise(painted), scheme.colors[result.colors[i]], `feature ${feature.id}`);
    });

    // The colours mean nothing individually, so there is nothing to list.
    assert.deepEqual(style.legend, []);
});

test('a colouring written into the data paints without any unique column', () => {
    // The case the keyed style cannot serve, and the reason this exists: real
    // layers often have nothing unique to key on -- a cartogram of 4363 regions
    // carries no feature id and no distinct column, so `coloringKeyFor` returns
    // null and the option used to do nothing at all. Writing the class index
    // into the data makes an attribute where there was none.
    const features = grid(4, 4).map((feature) => ({
        ...feature,
        id: undefined,
        properties: { region: 'same for every one of them' },
    })) as GeoJSON.Feature[];
    assert.equal(coloringKeyFor(features), null, 'this fixture must have nothing to key on');

    const result = colorByAdjacency(features);
    const scheme = colorSchemesFor(Math.max(3, result.colorCount), 'qual')[0];
    const painted = features.map((feature, i) => ({
        ...feature,
        properties: { ...feature.properties, cls: result.colors[i] },
    }));

    const style = buildIndexedColorStyle({ role: 'fill', field: 'cls', colorCount: result.colorCount, scheme });

    painted.forEach((feature, i) => {
        const color = evaluateColor(style.paint['fill-color'], feature, 6, '#000000');
        assert.equal(normalise(color), scheme.colors[result.colors[i]], `feature ${i}`);
    });
    // Neighbours differ, which is the whole promise.
    result.adjacency.forEach((neighbours, i) => {
        for (const j of neighbours) {
            assert.notEqual(result.colors[i], result.colors[j], `${i} and ${j} share a colour`);
        }
    });
    // One entry per colour, not one per feature: `match`, its input, a label and
    // a colour per class, and the fallback. The keyed form would emit 16 pairs
    // here, and one per region on a real layer.
    assert.equal((style.paint['fill-color'] as unknown[]).length, 3 + result.colorCount * 2);
});

test('a feature with no class index falls back rather than vanishing', () => {
    const style = buildIndexedColorStyle({
        role: 'fill',
        field: 'cls',
        colorCount: 3,
        scheme: colorSchemesFor(3, 'qual')[0],
        fallbackColor: '#ff00ff',
    });
    assert.equal(normalise(evaluateColor(style.paint['fill-color'], cell(0, 0, {}), 6, '#000')), '#ff00ff');
});

test('a feature the colouring never saw falls back rather than vanishing', () => {
    const style = buildKeyedColorStyle({
        role: 'fill',
        key: { kind: 'property', name: 'code' },
        entries: [{ key: 'A', colorIndex: 0 }],
        scheme: colorSchemesFor(3, 'qual')[0],
        fallbackColor: '#ff00ff',
    });
    assert.equal(normalise(evaluateColor(style.paint['fill-color'], cell(0, 0, { code: 'Z' }), 6, '#000')), '#ff00ff');
});

function normalise(color: string): string {
    const rgb = /rgba?\(([^)]+)\)/.exec(color);
    if (!rgb) return color.toLowerCase();
    const [r, g, b] = rgb[1].split(',').map(part => Math.round(Number(part.trim())));
    return `#${[r, g, b].map(v => v.toString(16).padStart(2, '0')).join('')}`;
}

test('the colours are spread evenly, without adding one', () => {
    // Taking the lowest free colour puts every island and every early region on
    // colour 0: on 242 world countries that was 128 in one colour against 19 in
    // the smallest. Balancing afterwards (rather than during the greedy pass,
    // which costs a colour) evens it out and cannot grow the palette.
    const features = [
        ...grid(6, 6),
        // Twenty islands: no borders, so every one of them is free to take any
        // colour, and they are what skews an unbalanced result.
        ...Array.from({ length: 20 }, (_, i) => cell(20 + i * 2, 0, { name: `island${i}` }, `i${i}`)),
    ];

    const result = colorByAdjacency(features);
    noNeighbourShares(result);
    assert.equal(result.colorCount, 2, 'a grid plus islands still needs two colours');

    const counts = result.colors.reduce<number[]>((acc, color) => {
        acc[color] = (acc[color] ?? 0) + 1;
        return acc;
    }, []);
    const spread = Math.max(...counts) - Math.min(...counts);
    assert.ok(spread <= 1, `colour counts ${counts.join('/')} differ by ${spread}`);
});

test('a bigger palette is used, and still nobody clashes', () => {
    // Four colours is what a map of areas generally needs; asking for more is a
    // matter of taste, and the extra colours must actually be used rather than
    // sitting unused at the end of the palette.
    const features = grid(8, 8);

    const four = colorByAdjacency(features, { paletteSize: 4 });
    const twelve = colorByAdjacency(features, { paletteSize: 12 });

    noNeighbourShares(four);
    noNeighbourShares(twelve);
    assert.ok(twelve.colorCount > four.colorCount, `${twelve.colorCount} vs ${four.colorCount}`);
    assert.ok(twelve.colorCount <= 12);
});

test('asking for more colours than the map can place is not an error', () => {
    // Three squares in a row cannot use twelve colours: a region may only take a
    // colour none of its neighbours holds. It gets what it can.
    const result = colorByAdjacency([cell(0, 0), cell(1, 0), cell(2, 0)], { paletteSize: 12 });
    noNeighbourShares(result);
    assert.ok(result.colorCount >= 2 && result.colorCount <= 3, `used ${result.colorCount}`);
});
