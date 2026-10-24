/**
 * A Panoramax search answer becomes one photo with its credit and licence, and
 * anything the instance left out is left out — never shown as "undefined".
 * The fixture is a real answer (Amsterdam, nl.panoramax.xyz), trimmed.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {
    buildPanoramaxPhotoUrl,
    buildPanoramaxSearchUrl,
    panoramaxColour,
    panoramaxCoverageLayer,
    panoramaxViewerUrl,
    parsePanoramaxPhoto,
    yawTowards,
    PANORAMAX_COVERAGE_LAYER_ID,
    PANORAMAX_ROUTES_MIN_ZOOM,
} from '../src/utils/panoramax';

const ANSWER = {
    features: [{
        id: '8507deb2-050f-4261-9b4a-eca7d0e199c2',
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [4.889809, 52.37011] },
        links: [
            { rel: 'license', href: 'https://creativecommons.org/licenses/by-sa/4.0/', title: 'License for this object (CC-BY-SA-4.0)' },
            { rel: 'via', href: 'https://nl.panoramax.xyz', title: 'Link to the original instance' },
        ],
        assets: {
            hd: { href: 'https://nl.panoramax.xyz/images/85/07/de/b2/050f-4261-9b4a-eca7d0e199c2.jpg' },
            sd: { href: 'https://nl.panoramax.xyz/derivates/85/07/de/b2/050f-4261-9b4a-eca7d0e199c2/sd.jpg' },
            thumb: { href: 'https://nl.panoramax.xyz/derivates/85/07/de/b2/050f-4261-9b4a-eca7d0e199c2/thumb.jpg' },
        },
        properties: { datetime: '2025-01-09T12:02:23+00:00', license: 'CC-BY-SA-4.0' },
        providers: [
            { name: 'Panoramax Test-NL', roles: ['producer'] },
            { name: 'City of Amsterdam', roles: ['producer'] },
        ],
    }],
};

test('search asks for photos looking at the clicked spot, nearest one only', () => {
    const url = new URL(buildPanoramaxSearchUrl('https://api.panoramax.xyz/api/', [4.89, 52.37], 50));
    assert.equal(url.origin + url.pathname, 'https://api.panoramax.xyz/api/search');
    assert.equal(url.searchParams.get('place_position'), '4.89,52.37');
    assert.equal(url.searchParams.get('place_distance'), '0-50');
    assert.equal(url.searchParams.get('limit'), '1');
});

test('a real answer gives the photo, its credit, licence and viewer link', () => {
    const photo = parsePanoramaxPhoto(ANSWER);
    assert.ok(photo);
    assert.equal(photo.id, '8507deb2-050f-4261-9b4a-eca7d0e199c2');
    assert.deepEqual(photo.position, [4.889809, 52.37011]);
    assert.match(photo.thumbUrl, /thumb\.jpg$/);
    assert.match(photo.largeUrl, /sd\.jpg$/);
    assert.equal(photo.credit, 'Panoramax Test-NL, City of Amsterdam');
    assert.equal(photo.licence, 'CC-BY-SA-4.0');
    assert.equal(photo.licenceUrl, 'https://creativecommons.org/licenses/by-sa/4.0/');
    assert.equal(photo.takenAt, '2025-01-09T12:02:23+00:00');

    const viewer = new URL(photo.viewerUrl);
    assert.equal(viewer.searchParams.get('pic'), photo.id);
    assert.equal(viewer.searchParams.get('focus'), 'pic');
});

test('no photo nearby is null, not an error', () => {
    assert.equal(parsePanoramaxPhoto({ type: 'FeatureCollection', features: [] }), null);
    assert.equal(parsePanoramaxPhoto(null), null);
    assert.equal(parsePanoramaxPhoto({ features: [{ id: 'x', geometry: { coordinates: [1, 2] } }] }), null, 'no image at all');
});

test('missing producers fall back to the instance, missing sizes to the thumbnail', () => {
    const feature = structuredClone(ANSWER.features[0]) as Record<string, unknown>;
    delete feature.providers;
    delete (feature.assets as Record<string, unknown>).sd;
    delete (feature.properties as Record<string, unknown>).license;
    feature.links = [{ rel: 'via', href: 'https://nl.panoramax.xyz' }];

    const photo = parsePanoramaxPhoto({ features: [feature] });
    assert.ok(photo);
    assert.equal(photo.credit, 'nl.panoramax.xyz');
    assert.equal(photo.largeUrl, photo.thumbUrl);
    assert.equal(photo.licence, null);
    assert.equal(photo.licenceUrl, null);
});

test('only http(s) image and licence addresses are used', () => {
    const feature = structuredClone(ANSWER.features[0]) as Record<string, unknown>;
    (feature.assets as Record<string, { href: string }>).thumb.href = 'javascript:alert(1)';
    (feature.links as Array<{ rel: string; href: string }>)[0].href = 'javascript:alert(1)';
    const photo = parsePanoramaxPhoto({ features: [feature] });
    assert.equal(photo?.licenceUrl ?? null, null);
    assert.equal(photo, null, 'without a usable thumbnail there is nothing to show');
});

test('the viewer link keeps a custom viewer address', () => {
    const url = new URL(panoramaxViewerUrl('https://panoramax.example.org/viewer', 'abc', [5, 52]));
    assert.equal(url.origin + url.pathname, 'https://panoramax.example.org/viewer');
    assert.equal(url.searchParams.get('map'), '18/52/5');
});

test('a 360° photo is recognised by its field of view, and keeps its heading', () => {
    const feature = structuredClone(ANSWER.features[0]) as Record<string, unknown>;
    (feature.properties as Record<string, unknown>)['pers:interior_orientation'] = { field_of_view: 360 };
    (feature.properties as Record<string, unknown>)['view:azimuth'] = 20.5;
    const photo = parsePanoramaxPhoto({ features: [feature] });
    assert.equal(photo?.is360, true);
    assert.equal(photo?.heading, 20.5);

    const flat = parsePanoramaxPhoto(ANSWER);
    assert.equal(flat?.is360, false, 'no field of view: a plain photo');
    assert.equal(flat?.heading, null);
});

test('a photo dot asks for that one photo by id', () => {
    const url = new URL(buildPanoramaxPhotoUrl('https://api.panoramax.xyz/api', 'abc-123'));
    assert.equal(url.pathname, '/api/search');
    assert.equal(url.searchParams.get('ids'), 'abc-123');
});

test('a 360° photo opens facing the clicked spot', () => {
    const photo = { position: [5, 52] as [number, number], heading: 0 };
    // Due east of the camera, camera facing north: turn right a quarter.
    assert.ok(Math.abs(yawTowards(photo, [5.001, 52]) - 90) < 0.1);
    // Facing east already: straight ahead.
    assert.ok(Math.abs(yawTowards({ ...photo, heading: 90 }, [5.001, 52])) < 0.1);
    // Behind, either way round, stays within -180..180.
    const behind = yawTowards({ ...photo, heading: 0 }, [5, 51.999]);
    assert.ok(Math.abs(Math.abs(behind) - 180) < 0.1);
    // Unknown heading, or no spot (a dot click): the photo's own middle.
    assert.equal(yawTowards({ ...photo, heading: null }, [5.001, 52]), 0);
    assert.equal(yawTowards(photo, null), 0);
});

test('the coverage layer uses Panoramax tiles from the configured API, owned by the tool', () => {
    const layer = panoramaxCoverageLayer('https://nl.panoramax.xyz/api/') as {
        id: string; sources: Record<string, { type: string; tiles: string[] }>;
        layers: Array<{ id: string; 'source-layer': string }>; metadata: Record<string, unknown>;
    };
    assert.equal(layer.id, PANORAMAX_COVERAGE_LAYER_ID);
    const [source] = Object.values(layer.sources);
    assert.equal(source.type, 'vector');
    assert.deepEqual(source.tiles, ['https://nl.panoramax.xyz/api/map/{z}/{x}/{y}.mvt']);
    // No density grid: it drew one photo as large as thousands, and below the
    // routes' zoom it is all the tiles hold, so the source starts where routes do.
    assert.deepEqual(layer.layers.map((l) => l['source-layer']), ['sequences', 'pictures']);
    assert.equal((source as unknown as { minzoom: number }).minzoom, PANORAMAX_ROUTES_MIN_ZOOM);
    assert.equal(layer.layers[layer.layers.length - 1].id, `${PANORAMAX_COVERAGE_LAYER_ID}-pictures`, 'the tool finds photo dots by this id');
    assert.equal(layer.metadata.ownerTool, 'street-photos', 'kept out of the permalink layer list');
});

type Translation = { name: string; valuemap: Array<{ value: unknown; operator?: string; label: string }> };

/** The legend label a `case` condition gets, looked up the way the legend does. */
function labelFor(cond: unknown[], translations: Translation[]): string | undefined {
    const [op, lhs, rhs] = cond as [string, [string, string], unknown];
    const entry = translations.find((t) => t.name === lhs[1]);
    return entry?.valuemap.find((m) => String(m.value) === String(rhs) && m.operator === op)?.label;
}

function translationsOf(colourBy: 'date' | 'camera'): Translation[] {
    const layer = panoramaxCoverageLayer('https://api.panoramax.xyz/api', colourBy, 2026) as { metadata: { attributes: { translations: Translation[] } } };
    return layer.metadata.attributes.translations;
}

test('every colour on the map has a legend label, missing values included', () => {
    // The legend hides unlabelled branches, so an unlabelled colour is one
    // nobody can read; a route with no camera type showed exactly that, in grey.
    for (const colourBy of ['date', 'camera'] as const) {
        for (const part of ['sequences', 'pictures'] as const) {
            const expr = panoramaxColour(colourBy, part, 2026) as unknown[];
            assert.equal(expr[0], 'case');
            for (let i = 1; i + 1 < expr.length; i += 2) {
                const label = labelFor(expr[i] as unknown[], translationsOf(colourBy));
                assert.ok(label, `${colourBy}/${part}: no label for ${JSON.stringify(expr[i])}`);
            }
        }
    }
});

test('date classes compare the date as a string, newest first, missing first of all', () => {
    const route = panoramaxColour('date', 'sequences', 2026) as unknown[];
    assert.deepEqual(route[1], ['==', ['get', 'date'], null], 'a missing date is caught before any ordering comparison');
    assert.deepEqual(route[3], ['>=', ['get', 'date'], '2026-01-01']);
    assert.deepEqual(route[5], ['>=', ['get', 'date'], '2025-01-01']);
    assert.deepEqual(route[7], ['>=', ['get', 'date'], '2022-01-01']);
    assert.deepEqual(route[9], ['<', ['get', 'date'], '2022-01-01']);
    const photo = panoramaxColour('date', 'pictures', 2026) as unknown[];
    assert.deepEqual(photo[3], ['>=', ['get', 'ts'], '2026-01-01'], 'photos carry a timestamp, not a date');

    const labels = [3, 5, 7, 9, 1].map((i) => labelFor(route[i] as unknown[], translationsOf('date')));
    assert.deepEqual(labels, ['This year (2026)', 'Last year (2025)', '2022–2024', 'Before 2022', 'Date unknown']);
});

test('camera classes: 360°, flat, unknown; coverage is one colour', () => {
    const camera = panoramaxColour('camera', 'sequences', 2026) as unknown[];
    const labels = [1, 3, 5].map((i) => labelFor(camera[i] as unknown[], translationsOf('camera')));
    assert.deepEqual(labels, ['360° photos', 'Flat photos', 'Camera unknown']);
    assert.equal(typeof panoramaxColour('coverage', 'sequences', 2026), 'string');
});
