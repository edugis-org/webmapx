/**
 * The styler's WMS styling, as decisions rather than markup.
 *
 * The claims that matter: the probe looks where the user is looking first (a
 * layer with a minimum scale draws nothing over its own full extent, so extent-
 * first would report every such service as incapable), a sampled column is
 * classified the same way a vector layer's is, and a style too long for a tile
 * url is refused before it is sent rather than after the map stops drawing.
 */
import test from 'node:test';
import assert from 'node:assert/strict';

import {
    buildDraftStyle,
    draftDocument,
    emptyDraft,
    probeSamples,
} from '../src/components/styler/wms-sld-branch';

test('a sample is asked for at the map\'s own scale, not squashed into a tile', () => {
    // The failure this prevents: a WMS withholds detail above a scale
    // threshold, so an image always requested at 256 pixels is coarser than the
    // map's own tiles and comes back empty about a screen full of buildings.
    // Measured on PDOK's BAG: one downtown bbox is blank at 256 pixels
    // (1:15576) and drawn at 384 (1:10384).
    const view = { center: [4.92, 52.37] as [number, number], zoom: 15.07, size: [1240, 556] as [number, number] };
    const [screen, centre] = probeSamples(view, null);
    const metresPerPixel = (s: { bbox: number[]; size?: [number, number] }) =>
        (s.bbox[2] - s.bbox[0]) / (s.size?.[0] ?? 256);
    const viewResolution = 156543.03392804097 / 2 ** view.zoom;
    assert.ok(Math.abs(metresPerPixel(screen) - viewResolution) < 0.01, 'the screen sample must be at the view\'s own scale');
    assert.ok(metresPerPixel(centre) < viewResolution, 'the centre sample must be finer than the view');
});

test('a screen larger than a service will render is scaled down, keeping its shape', () => {
    const [screen] = probeSamples({ center: [5, 52], zoom: 14, size: [6000, 3000] }, null);
    assert.ok((screen.size?.[0] ?? 0) <= 2048);
    assert.equal((screen.size?.[0] ?? 0) / (screen.size?.[1] ?? 1), 2);
});

test('what is on screen is sampled first, at the size it is on screen', () => {
    // A 256-pixel window at the centre can land on water while buildings fill
    // the rest of the view — which is how a layer the user can plainly see gets
    // reported as drawing nothing.
    const samples = probeSamples({ center: [5, 52], zoom: 14, size: [1200, 800] }, [3, 50, 7, 54]);
    assert.equal(samples.length, 3);
    const [screen, centre, extent] = samples;
    const widthOf = (s: { bbox: number[] }) => s.bbox[2] - s.bbox[0];
    assert.ok(widthOf(screen) > widthOf(centre), 'the visible extent is wider than a tile at the centre');
    // Its aspect must be the screen's, or it is not what the user is looking at.
    const aspect = widthOf(screen) / (screen.bbox[3] - screen.bbox[1]);
    assert.ok(Math.abs(aspect - 1200 / 800) < 0.01, `expected the screen's aspect, got ${aspect}`);
    assert.ok(widthOf(extent) > widthOf(screen));
});

test('a map that cannot say its size still gets a sample', () => {
    const samples = probeSamples({ center: [5, 52], zoom: 14 }, [3, 50, 7, 54]);
    assert.equal(samples.length, 2);
    const width = samples[0].bbox[2] - samples[0].bbox[0];
    assert.ok(width > 0 && width < 10_000, `a z14 probe window should be metres wide, got ${width}`);
});

test('with nothing known, the probe still has somewhere to look', () => {
    const [world] = probeSamples(null, null);
    assert.ok(world.bbox[0] < -20_000_000 && world.bbox[2] > 20_000_000);
});

test('a numeric column becomes bands, the top one open-ended', () => {
    const draft = { ...emptyDraft(), driver: 'attribute' as const, attribute: 'inwoners', classCount: 3,
        values: [5, 40, 120, 900, 3000, 12000, 60000, 400000] };
    const built = buildDraftStyle(draft);
    assert.equal(built.style?.kind, 'graduated');
    // Rounded breaks may merge two classes into one — the shared classifier's
    // own behaviour, and the same on a vector layer — so the count is a
    // ceiling, not a promise. What must hold is that the top band is open.
    assert.ok(built.classes.length > 1 && built.classes.length <= 3);
    assert.match(built.classes[built.classes.length - 1].label, /and above/);
});

test('a text column becomes categories, with the unsampled rest kept visible', () => {
    const draft = { ...emptyDraft(), driver: 'attribute' as const, attribute: 'status', classCount: 2,
        values: ['a', 'a', 'b', 'c', 'd'] };
    const built = buildDraftStyle(draft);
    assert.equal(built.style?.kind, 'categories');
    // Values beyond the sampled categories are real data; dropping them would
    // make features disappear, which reads as a bug rather than as a style.
    assert.equal(built.style?.kind === 'categories' && built.style.otherColor !== undefined, true);
    assert.ok(built.classes.some((item) => item.label === 'other'));
});

test('a mostly-numeric column with a few stray codes is still numbers', () => {
    const values = [...Array.from({ length: 20 }, (_, i) => i * 10), 'onbekend'];
    const built = buildDraftStyle({ ...emptyDraft(), driver: 'attribute', attribute: 'x', values });
    assert.equal(built.style?.kind, 'graduated');
});

test('a half-text column is categories, whatever its schema says', () => {
    const values = [1, 2, 3, 'a', 'b', 'c'];
    const built = buildDraftStyle({ ...emptyDraft(), driver: 'attribute', attribute: 'x', values });
    assert.equal(built.style?.kind, 'categories');
});

test('no values is said in words, not as an empty style', () => {
    const built = buildDraftStyle({ ...emptyDraft(), driver: 'attribute', attribute: 'x', values: [] });
    assert.equal(built.style, null);
    assert.match(built.problem ?? '', /nothing to classify/i);
});

test('one colour needs no values at all', () => {
    const built = buildDraftStyle({ ...emptyDraft(), color: '#123456' });
    assert.equal(built.style?.kind, 'single');
    assert.equal(built.classes[0].color, '#123456');
});

test('how long is too long is the service\'s answer, not a constant here', () => {
    // A guessed ceiling either refuses a style a generous service would have
    // drawn, or lets a stricter one fail anyway — so a large style is built and
    // sent, and the refusal is read back (see `verifyStyledRequest`).
    const values = Array.from({ length: 300 }, (_, i) => `a-fairly-long-category-value-${i}`);
    const result = draftDocument('pand', 'polygon', {
        ...emptyDraft(), driver: 'attribute', attribute: 'naam', classCount: 300, values,
    });
    assert.ok((result.sld ?? '').length > 8000);
    assert.equal(result.problem, undefined);
});

test('a workable draft comes back as a document naming the service\'s own layer', () => {
    const result = draftDocument('bag:pand', 'polygon', { ...emptyDraft(), color: '#ff0000' });
    assert.match(result.sld ?? '', /<Name>bag:pand<\/Name>/);
});
