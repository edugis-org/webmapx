/**
 * The style list: the level-1 list of styles on a source, and the sublayers it
 * is read from and written back to.
 *
 * The claim being tested is not that the list renders. It is that the list is
 * the *whole* layer — a sublayer this build has no role for still comes back
 * out — and that the order it holds is the draw order it was given, because
 * both failures silently change a map nobody asked to change.
 */
import test from 'node:test';
import assert from 'node:assert/strict';

import type { SourceStyleGroup } from '../src/components/styler/style-context';
import {
    moveEntry,
    moveEntryPast,
    readStyleList,
    readStyleListFromTargets,
    sourceIdOfSubLayer,
    writeStyleList,
} from '../src/components/styler/style-list';
import {
    defaultEntry,
    duplicateEntry,
    entryName,
    nextEntryId,
    rolesForGeometry,
    summarizeEntry,
} from '../src/components/styler/style-entry';
import { channelsOf, type StyleSubLayer } from '../src/utils/layer-style-model';
import { decodeStyleEntry } from '../src/utils/style-decoder';

const group = (sourceId: string, geometryTypes: string[]): SourceStyleGroup => ({
    sourceId,
    featureCountLabel: '3 areas',
    featureCount: 3,
    geometryTypes,
    attributes: [],
    featureRows: [],
    layers: [],
});

const sublayers: StyleSubLayer[] = [
    { id: 'areas', type: 'fill', source: 'data', paint: { 'fill-color': '#ff0000' } },
    { id: 'edges', type: 'line', source: 'data', paint: { 'line-color': '#000000', 'line-width': 4 } },
    { id: 'picture', type: 'raster', source: 'photo' },
];

test('the list holds every sublayer, including ones it cannot style', () => {
    const list = readStyleList('layer', sublayers, [group('layer:data', ['Polygon'])]);
    assert.deepEqual(list.map((item) => item.entry.id), ['areas', 'edges', 'picture']);
    assert.deepEqual(list.map((item) => item.styleable), [true, true, false]);
    // Untouched, a raster sublayer must come back exactly as it went in: it is
    // carried through the list purely so that saving cannot drop it.
    assert.deepEqual(writeStyleList(list)[2], sublayers[2]);
});

test('a line over polygons reads as the outline it is', () => {
    const list = readStyleList('layer', sublayers, [group('layer:data', ['MultiPolygon'])]);
    assert.equal(list[1].entry.role, 'outline');
    assert.equal(readStyleList('layer', sublayers, [group('layer:data', ['LineString'])])[1].entry.role, 'line');
});

test('writing back an untouched list changes nothing at all', () => {
    const list = readStyleList('layer', sublayers, [group('layer:data', ['Polygon'])]);
    assert.equal(JSON.stringify(writeStyleList(list)), JSON.stringify(sublayers));
});

test('a source id is spelled as the engine registers it', () => {
    assert.equal(sourceIdOfSubLayer('gemeenten', { source: 'data' }), 'gemeenten:data');
    assert.equal(sourceIdOfSubLayer('gemeenten', {}), '');
});

test('a plain layer promoted to a sublayer keeps the source id it already carries', () => {
    // `BaseAdapter.originalSubLayers` hands a non-composite layer over with the
    // engine's own source id in `source`; prefixing that a second time named a
    // source no group had, and the panel answered "No style matches that".
    const known = ['countrypopdensity-source'];
    assert.equal(
        sourceIdOfSubLayer('countrypopdensity', { source: 'countrypopdensity-source' }, known),
        'countrypopdensity-source',
    );
    assert.equal(sourceIdOfSubLayer('gemeenten', { source: 'data' }, ['gemeenten:data']), 'gemeenten:data');
});

test('a plain layer lists its style under the source the groups use', () => {
    const plain = [{ id: 'countrypopdensity', type: 'fill', source: 'countrypopdensity-source' }];
    const list = readStyleList('countrypopdensity', plain, [group('countrypopdensity-source', ['Polygon'])]);
    assert.equal(list[0].sourceId, 'countrypopdensity-source');
});

test('reordering moves one entry and leaves the rest in place', () => {
    const list = readStyleList('layer', sublayers, [group('layer:data', ['Polygon'])]);
    assert.deepEqual(moveEntry(list, 'edges', -1).map((item) => item.entry.id), ['edges', 'areas', 'picture']);
    assert.deepEqual(moveEntry(list, 'areas', -1).map((item) => item.entry.id), ['areas', 'edges', 'picture']);
    assert.deepEqual(moveEntry(list, 'picture', 1).map((item) => item.entry.id), ['areas', 'edges', 'picture']);
});

test('a host that cannot hand over its sublayers still gives an editable list', () => {
    const targets = group('src', ['Point']);
    targets.layers = [{ id: 'dots', type: 'circle', paint: { 'circle-color': '#00ff00' } }];
    const list = readStyleListFromTargets([targets]);
    assert.equal(list.length, 1);
    assert.equal(list[0].entry.role, 'circle');
    assert.equal(list[0].sourceId, 'src');
});

test('a summary says enough to skip the entry', () => {
    const fill = decodeStyleEntry({ id: 'a', type: 'fill', paint: { 'fill-color': '#d94801', 'fill-opacity': 0.7 } });
    assert.equal(summarizeEntry(fill), 'Fill — #d94801');

    const classified = decodeStyleEntry({
        id: 'b', type: 'fill',
        paint: { 'fill-color': ['step', ['to-number', ['get', 'pop']], '#eee', 10, '#999', 20, '#333'] },
    });
    assert.equal(summarizeEntry(classified), 'Fill — by pop, 3 classes');

    const ruled = decodeStyleEntry({ id: 'c', type: 'line', paint: { 'line-width': 4 }, filter: ['==', 'a', 1], minzoom: 6 });
    assert.equal(summarizeEntry(ruled), 'Line — 4px, filtered, z6+');
});

test('a new entry draws something the moment it is added', () => {
    for (const role of ['fill', 'outline', 'line', 'circle', 'label'] as const) {
        const entry = defaultEntry(role, `x-${role}`);
        assert.ok(Object.keys(entry.channels).length > 0, `${role} has no channels`);
        // Nothing is left for the panel to ask about before the map will draw.
        assert.ok(Object.values(entry.channels).every((channel) => channel.driver === 'single'));
    }
    // A label over imagery is unreadable without a halo, so it is part of what
    // a label is rather than something to go and add.
    assert.equal(defaultEntry('label', 'l').channels.haloWidth?.driver, 'single');
});

test('a polygon source offers its outline first, and a mixed source offers everything', () => {
    assert.deepEqual(rolesForGeometry(['Polygon']), ['outline', 'fill', 'label']);
    assert.deepEqual(rolesForGeometry(['Point', 'LineString']), ['line', 'label', 'circle']);
    assert.deepEqual(rolesForGeometry([]), ['fill', 'outline', 'line', 'circle', 'label']);
});

test('a duplicate carries the paint but not the sublayer it was copied from', () => {
    const original = decodeStyleEntry({ id: 'a', type: 'line', paint: { 'line-color': '#000', 'line-width': 4 } });
    const copy = duplicateEntry(original, 'a-2');
    assert.equal(copy.id, 'a-2');
    assert.deepEqual(copy.channels, original.channels);
    // Without this, the copy would write only what the user changed and read
    // the rest off the *other* entry's sublayer.
    assert.equal(copy.origin, undefined);
    assert.equal(copy.originChannels, undefined);

    copy.channels.width = { driver: 'single', value: 2 };
    assert.equal(original.channels.width?.driver === 'single' && original.channels.width.value, 4);
});

test('a new entry id is unique within the layer and reads in order', () => {
    assert.equal(nextEntryId('roads', []), 'roads--style-1');
    assert.equal(nextEntryId('roads', ['roads--style-1']), 'roads--style-2');
    assert.equal(nextEntryId('roads', ['roads--style-2', 'roads--style-3']), 'roads--style-4');
});

test('a polygon outline is offered no dash, and an authored one is left alone', () => {
    // A border shared by two areas is in the layer twice and stroked twice, so
    // the two dash phases interleave: the pattern is a promise the geometry
    // cannot keep, and it is offered only on `line`.
    assert.equal(channelsOf('outline').includes('dash'), false);
    assert.equal(channelsOf('line').includes('dash'), true);

    const authored: StyleSubLayer = {
        id: 'edge', type: 'line', source: 'data',
        paint: { 'line-color': '#000000', 'line-dasharray': [2, 2] },
    };
    const list = readStyleList('layer', [authored], [group('layer:data', ['Polygon'])]);
    assert.equal(list[0].entry.role, 'outline');
    assert.equal(list[0].entry.channels.dash, undefined);
    // Not offering a control is not the same as taking the value away.
    assert.deepEqual(writeStyleList(list)[0], authored);
});

test('an arrow steps past the neighbour on screen, however far away it is', () => {
    const list = readStyleList('layer', sublayers, [group('layer:data', ['Polygon'])]);
    // Unfiltered, the visible neighbour *is* the adjacent entry, so this is the
    // ordinary swap.
    assert.deepEqual(moveEntryPast(list, 'areas', 'edges').map((item) => item.entry.id), ['edges', 'areas', 'picture']);
    assert.deepEqual(moveEntryPast(list, 'picture', 'areas').map((item) => item.entry.id), ['picture', 'areas', 'edges']);

    // Filtered, the row above may be two places away in the draw order. Swapping
    // with the true neighbour would move the entry past something invisible and
    // read as a button that did nothing.
    assert.deepEqual(moveEntryPast(list, 'picture', 'areas').map((item) => item.entry.id), ['picture', 'areas', 'edges']);
    assert.deepEqual(moveEntryPast(list, 'areas', 'nothing').map((item) => item.entry.id), ['areas', 'edges', 'picture']);
});

test('an entry name drops what every row repeats', () => {
    const named = (id: string, layerId: string) =>
        entryName(decodeStyleEntry({ id, type: 'line' }), layerId);

    // A dropped file's sublayers carry the layer's own id in full; what tells
    // them apart is the tail.
    assert.equal(named('NUTS_3_uk_stats:NUTS_3_uk_stats-line', 'NUTS_3_uk_stats'), 'NUTS_3_uk_stats-line');
    assert.equal(named('NUTS_3_uk_stats-population', 'NUTS_3_uk_stats'), 'population');
    // What is left may be nothing but the role, which the summary says already.
    assert.equal(named('NUTS_3_uk_stats-line', 'NUTS_3_uk_stats'), null);
    assert.equal(named('style:roads_casing', 'openfreemap'), 'roads_casing');
    // An id the app generated is not a name.
    assert.equal(named('layer--style-2', 'layer'), null);
    assert.equal(named('layer', 'layer'), null);
});
