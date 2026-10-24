/**
 * A Panoramax search answer becomes one photo with its credit and licence, and
 * anything the instance left out is left out — never shown as "undefined".
 * The fixture is a real answer (Amsterdam, nl.panoramax.xyz), trimmed.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {
    buildPanoramaxSearchUrl,
    panoramaxViewerUrl,
    parsePanoramaxPhoto,
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
