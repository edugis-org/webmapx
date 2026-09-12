/**
 * Whether a service honours a style of our own — measured, not declared.
 *
 * The two failures worth a test are the ones that answer "no" when the truth is
 * "yes": a sample area where the layer draws nothing (the same empty tile twice
 * is not evidence), and a service exception dressed as a reply.
 */
import test from 'node:test';
import assert from 'node:assert/strict';

import {
    clearSldProbeCache,
    inkedPixel,
    probeGetMapUrl,
    probeSldSupport,
    probeSldSupportCached,
    verifyStyledRequest,
} from '../src/utils/wms-sld-probe';

const INFO = { endpoint: 'https://example.org/wms', layers: 'pand', style: '' };
const AREA: Array<{ bbox: [number, number, number, number] }> = [{ bbox: [0, 1, 2, 3] }];

function png(body: string, type = 'image/png'): Response {
    return new Response(new TextEncoder().encode(body), { status: 200, headers: { 'content-type': type } });
}

test('the image size asked for is the sample\'s, since that is what sets the scale', () => {
    const url = probeGetMapUrl(INFO, [0, 1, 2, 3], {}, [1240, 556]);
    assert.match(url, /WIDTH=1240/);
    assert.match(url, /HEIGHT=556/);
});

test('the probe asks for one tile in the area given, in a projection with no axis surprises', () => {
    const url = probeGetMapUrl(INFO, [0, 1, 2, 3]);
    assert.match(url, /REQUEST=GetMap/);
    assert.match(url, /BBOX=0%2C1%2C2%2C3|BBOX=0,1,2,3/);
    // EPSG:4326's axes swap between WMS 1.1 and 1.3; 3857's do not.
    assert.match(url, /CRS=EPSG%3A3857|CRS=EPSG:3857/);
    assert.match(url, /WIDTH=256/);
});

test('a different image means the service drew our style', async () => {
    const fetchImpl = (async (input: RequestInfo | URL) =>
        (String(input).includes('SLD_BODY') ? png('magenta') : png('default'))) as typeof fetch;
    const result = await probeSldSupport(INFO, AREA, fetchImpl);
    assert.equal(result.supported, true);
});

test('an identical image means the service ignored it', async () => {
    const fetchImpl = (async () => png('same')) as typeof fetch;
    const result = await probeSldSupport(INFO, AREA, fetchImpl);
    assert.deepEqual([result.supported, result.reason], [false, 'ignored']);
});

test('a service exception is not evidence either way', async () => {
    const fetchImpl = (async (input: RequestInfo | URL) => (String(input).includes('SLD_BODY')
        ? png('<ServiceExceptionReport/>', 'application/vnd.ogc.se_xml')
        : png('default'))) as typeof fetch;
    const result = await probeSldSupport(INFO, AREA, fetchImpl);
    assert.deepEqual([result.supported, result.reason], [false, 'error']);
});

test('an area the layer does not draw in is reported as such, not as unsupported', async () => {
    // Told apart by *reason*, because "move the map and try again" is a
    // different instruction from "this service cannot do it".
    const fetchImpl = (async () => png('<ServiceExceptionReport/>', 'text/xml')) as typeof fetch;
    const result = await probeSldSupport(INFO, AREA, fetchImpl);
    assert.deepEqual([result.supported, result.reason], [false, 'no-ink']);
});

test('each area is tried in turn until one answers', async () => {
    const seen: string[] = [];
    const fetchImpl = (async (input: RequestInfo | URL) => {
        const url = String(input);
        seen.push(url);
        if (url.includes('BBOX=0')) return png('<ServiceException/>', 'text/xml');
        return png(url.includes('SLD_BODY') ? 'magenta' : 'default');
    }) as typeof fetch;
    const result = await probeSldSupport(INFO, [{ bbox: [0, 0, 1, 1] }, { bbox: [9, 9, 9, 9] }], fetchImpl);
    assert.equal(result.supported, true);
    assert.ok(seen.some((url) => url.includes('BBOX=9')));
});

test('the inked pixel is the opaque one nearest the centre', () => {
    const size = 4;
    const pixels = new Uint8ClampedArray(size * size * 4);
    const set = (x: number, y: number, alpha: number) => { pixels[(y * size + x) * 4 + 3] = alpha; };
    set(0, 0, 255);
    set(2, 2, 255);
    set(3, 1, 100); // too faint to count as drawn
    assert.deepEqual(inkedPixel(pixels, size, size), { i: 2, j: 2 });
    assert.equal(inkedPixel(new Uint8ClampedArray(size * size * 4), size, size), null);
});

test('an answer about the moment is not remembered as an answer about the service', async () => {
    // A panel opened before zooming in finds no ink; caching that would make
    // the layer unstyleable for the whole session, and reopening after zooming
    // to the data would repeat the stale answer instead of looking again.
    clearSldProbeCache();
    let drawsSomething = false;
    const fetchImpl = (async (input: RequestInfo | URL) => {
        if (!drawsSomething) return png('<ServiceException/>', 'text/xml');
        return png(String(input).includes('SLD_BODY') ? 'magenta' : 'default');
    }) as typeof fetch;

    const first = await probeSldSupportCached(INFO, AREA, fetchImpl);
    assert.deepEqual([first.supported, first.reason], [false, 'no-ink']);
    drawsSomething = true;
    const second = await probeSldSupportCached(INFO, AREA, fetchImpl);
    assert.equal(second.supported, true, 'the second look must reach the service again');
    clearSldProbeCache();
});

test('a service that ignores styles is remembered, since that is about the service', async () => {
    clearSldProbeCache();
    let calls = 0;
    const fetchImpl = (async () => { calls++; return png('same'); }) as typeof fetch;
    assert.equal((await probeSldSupportCached(INFO, AREA, fetchImpl)).reason, 'ignored');
    await probeSldSupportCached(INFO, AREA, fetchImpl);
    assert.equal(calls, 2, 'the second ask must be answered from the cache');
    clearSldProbeCache();
});

test('looking again reaches the service, whatever is remembered', async () => {
    // A remembered answer is the one thing the user disagrees with when they
    // press "Look again", so it must not be what they are handed back.
    clearSldProbeCache();
    let calls = 0;
    const fetchImpl = (async () => { calls++; return png('same'); }) as typeof fetch;
    await probeSldSupportCached(INFO, AREA, fetchImpl);
    const cached = calls;
    await probeSldSupportCached(INFO, AREA, fetchImpl);
    assert.equal(calls, cached, 'an ordinary ask is answered from the cache');
    await probeSldSupportCached(INFO, AREA, fetchImpl, { force: true });
    assert.ok(calls > cached, 'a forced ask must reach the service');
    clearSldProbeCache();
});

test('faint ink still counts as the layer drawing something', () => {
    // A wide view is drawn into one small image, where a thin building survives
    // only as a smear — solid enough to prove there is data, too faint to ask
    // GetFeatureInfo about.
    const size = 4;
    const pixels = new Uint8ClampedArray(size * size * 4);
    pixels[(1 * size + 1) * 4 + 3] = 90;
    assert.equal(inkedPixel(pixels, size, size), null, 'not solid enough to ask about');
    assert.deepEqual(inkedPixel(pixels, size, size, 48), { i: 1, j: 1 });
});

test('a service is asked once, however many panels ask about it', async () => {
    clearSldProbeCache();
    let calls = 0;
    const fetchImpl = (async (input: RequestInfo | URL) => {
        calls++;
        return png(String(input).includes('SLD_BODY') ? 'magenta' : 'default');
    }) as typeof fetch;
    const first = await probeSldSupportCached(INFO, AREA, fetchImpl);
    const asked = calls;
    const second = await probeSldSupportCached(INFO, AREA, fetchImpl);
    assert.equal(first.supported, true);
    assert.equal(second.supported, true);
    // How many requests one probe takes is its own business (a support check,
    // then a candidate per geometry); what matters is that asking again adds
    // none.
    assert.equal(calls, asked, 'the second ask must be answered from the cache');
    clearSldProbeCache();
});

test('only the statuses that mean "too long" are reported as length', async () => {
    // Telling a user to use fewer classes when their document is malformed
    // sends them the wrong way entirely, so the two are kept apart.
    const status = (code: number) => (async () => new Response('', { status: code, headers: { 'content-type': 'image/png' } })) as typeof fetch;
    assert.equal((await verifyStyledRequest('u', status(431))).problem, 'too-long');
    assert.equal((await verifyStyledRequest('u', status(414))).problem, 'too-long');
    assert.equal((await verifyStyledRequest('u', status(500))).problem, 'rejected');
});

test('a service exception is reported in the service\'s own words', async () => {
    const fetchImpl = (async () => new Response(
        '<ServiceExceptionReport><ServiceException code="StyleNotDefined">  Rule has no symbolizer </ServiceException></ServiceExceptionReport>',
        { status: 200, headers: { 'content-type': 'text/xml' } },
    )) as typeof fetch;
    const check = await verifyStyledRequest('u', fetchImpl);
    assert.equal(check.ok, false);
    assert.equal(check.problem, 'rejected');
    assert.equal(check.detail, 'Rule has no symbolizer');
});

test('an image back means the service drew it', async () => {
    const fetchImpl = (async () => new Response(new Uint8Array([1, 2, 3]), { status: 200, headers: { 'content-type': 'image/png' } })) as typeof fetch;
    assert.equal((await verifyStyledRequest('u', fetchImpl)).ok, true);
});

/** A one-pixel PNG-shaped payload of a given size, standing in for a drawn image. */
function image(bytes: number): Response {
    return new Response(new Uint8Array(bytes), { status: 200, headers: { 'content-type': 'image/png' } });
}

test('geometry is decided by which symbolizer draws at all, most specific first', async () => {
    // Two readings this replaces, both measured against real services:
    // comparing with the service's own style called every layer a polygon (a
    // blank answer differs from the default as much as a correct one does),
    // and taking whichever drew *most* called a road layer points (a circle on
    // every vertex out-inks a thin line).
    const asked: string[] = [];
    const lineLayer = (async (input: RequestInfo | URL) => {
        const url = decodeURIComponent(String(input));
        if (!url.includes('SLD_BODY')) return image(50_000);
        const kind = /PolygonSymbolizer/.test(url) && !/LineSymbolizer/.test(url) ? 'polygon'
            : /LineSymbolizer/.test(url) && !/PointSymbolizer/.test(url) ? 'line'
            : /PointSymbolizer/.test(url) && !/PolygonSymbolizer/.test(url) ? 'point'
            : 'all';
        asked.push(kind);
        // A line layer: areas draw nothing, strokes and marks both draw.
        return image(kind === 'polygon' ? 900 : 60_000);
    }) as typeof fetch;

    const result = await probeSldSupport(INFO, AREA, lineLayer);
    assert.equal(result.supported, true);
    assert.equal(result.geometry, 'line');
    // Point is never reached: line already answered.
    assert.deepEqual(asked, ['all', 'polygon', 'line']);
});

test('a layer that draws nothing whatever it is asked keeps its geometry unknown', async () => {
    const fetchImpl = (async (input: RequestInfo | URL) => {
        const url = String(input);
        if (!url.includes('SLD_BODY')) return image(50_000);
        // Supported (the combined style draws), but no single symbolizer does.
        return /Polygon.*Line.*Point/s.test(decodeURIComponent(url)) ? image(60_000) : image(900);
    }) as typeof fetch;
    const result = await probeSldSupport(INFO, AREA, fetchImpl);
    assert.equal(result.supported, true);
    assert.equal(result.geometry, 'unknown');
});
