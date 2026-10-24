/**
 * Google Street View for the street photos tool: a metadata answer becomes one
 * photo turned towards the clicked spot; nothing there is not an error, and a
 * refusal (bad key, API not enabled) is one that says why.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {
    buildGoogleMetadataUrl,
    googleRefusal,
    googleStreetViewPageUrl,
    parseGoogleStreetView,
} from '../src/utils/google-street-view';

const KEY = 'test-key';
const SPOT: [number, number] = [4.8900, 52.3700];
// The panorama stands on the road 20 m south of the spot.
const OK = {
    status: 'OK',
    pano_id: 'PANO-1',
    location: { lat: 52.36982, lng: 4.8900 },
    date: '2023-05',
    copyright: '© Google',
};

test('the metadata request asks near the spot, outdoors only, within the distance', () => {
    const url = new URL(buildGoogleMetadataUrl(SPOT, 87.4, KEY));
    assert.equal(url.origin + url.pathname, 'https://maps.googleapis.com/maps/api/streetview/metadata');
    assert.equal(url.searchParams.get('location'), '52.37,4.89', 'lat,lng — Google\'s order, not GeoJSON\'s');
    assert.equal(url.searchParams.get('radius'), '87');
    assert.equal(url.searchParams.get('source'), 'outdoor');
    assert.equal(url.searchParams.get('key'), KEY);
});

test('an answer becomes a flat photo facing the clicked spot', () => {
    const photo = parseGoogleStreetView(OK, SPOT, KEY);
    assert.ok(photo);
    assert.equal(photo.source, 'google');
    assert.equal(photo.is360, false, 'the Static API gives flat views');
    assert.deepEqual(photo.position, [4.89, 52.36982]);
    // The spot is due north of the camera.
    assert.ok(photo.heading !== null && (photo.heading < 0.5 || photo.heading > 359.5), `heading ${photo.heading}`);
    for (const url of [photo.thumbUrl, photo.largeUrl]) {
        const u = new URL(url);
        assert.equal(u.searchParams.get('pano'), 'PANO-1');
        assert.equal(u.searchParams.get('key'), KEY);
        assert.equal(Number(u.searchParams.get('heading')), Number(photo.heading!.toFixed(1)));
    }
    assert.notEqual(photo.thumbUrl, photo.largeUrl, 'the enlarged view is a larger image');
    assert.equal(photo.takenAt, '2023-05');
    assert.equal(photo.credit, 'Google', 'the © is the credit line\'s own, not doubled');
    assert.equal(photo.licence, null);
    assert.equal(new URL(photo.viewerUrl).searchParams.get('pano'), 'PANO-1');
});

test('an answer without a location faces the spot from the spot itself', () => {
    const { location: _, ...noLocation } = OK;
    const photo = parseGoogleStreetView(noLocation, SPOT, KEY);
    assert.deepEqual(photo?.position, SPOT);
});

test('nothing there is no photo and no error; a refusal is an error that says why', () => {
    for (const status of ['ZERO_RESULTS', 'NOT_FOUND']) {
        assert.equal(parseGoogleStreetView({ status }, SPOT, KEY), null);
        assert.equal(googleRefusal({ status }), null);
    }
    assert.equal(googleRefusal(OK), null);
    const refusal = googleRefusal({ status: 'REQUEST_DENIED', error_message: 'The provided API key is invalid.' });
    assert.match(refusal ?? '', /REQUEST_DENIED/);
    assert.match(refusal ?? '', /API key is invalid/);
    assert.equal(parseGoogleStreetView({ status: 'REQUEST_DENIED' }, SPOT, KEY), null);
});

test('the Google Maps link opens the same panorama, facing the same way', () => {
    const url = new URL(googleStreetViewPageUrl('PANO-1', SPOT, 123.456));
    assert.equal(url.searchParams.get('map_action'), 'pano');
    assert.equal(url.searchParams.get('pano'), 'PANO-1');
    assert.equal(url.searchParams.get('heading'), '123.5');
});
