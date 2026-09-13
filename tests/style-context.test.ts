/**
 * The two rules that decide whether the styler re-reads a tiled source.
 *
 * Both exist to stop a re-read making the panel worse than it was. A tiled
 * source answers with what the map has drawn, so the answer changes as the user
 * moves — and an attribute list, a value range and a class count that move
 * under the reader are worse than one that is merely a moment old.
 */
import test from 'node:test';
import assert from 'node:assert/strict';

import { hasFeatures, isWiderThan, type SourceStyleGroup, type ViewBounds } from '../src/components/styler/style-context';

const view = (west: number, south: number, east: number, north: number): ViewBounds =>
    ({ west, south, east, north });

const group = (features: number): SourceStyleGroup => ({
    sourceId: 'src',
    featureCountLabel: `${features}`,
    featureCount: features,
    geometryTypes: ['Polygon'],
    attributes: [],
    featureRows: [],
    layers: [],
    features: Array.from({ length: features }, () => ({
        type: 'Feature', properties: {}, geometry: { type: 'Point', coordinates: [0, 0] },
    })) as GeoJSON.Feature[],
});

test('zooming out is wider, panning at the same zoom is not', () => {
    const start = view(4, 51, 5, 52);
    assert.equal(isWiderThan(view(3, 50, 6, 53), start), true);
    // Same size, somewhere else: it trades features for features, and re-reading
    // would move the columns and ranges under someone who is reading them.
    assert.equal(isWiderThan(view(10, 51, 11, 52), start), false);
    assert.equal(isWiderThan(view(4, 51, 5, 52), start), false);
    // Zooming in is not wider either, however much more detail arrives.
    assert.equal(isWiderThan(view(4.4, 51.4, 4.6, 51.6), start), false);
});

test('a hair wider does not count', () => {
    // A re-render at the same camera, or a pixel of rounding, must not set off
    // a re-read of every feature on screen.
    assert.equal(isWiderThan(view(4, 51, 5.02, 52), view(4, 51, 5, 52)), false);
});

test('a view across the antimeridian measures the way it is drawn', () => {
    // east < west is a wrapped view, not a negative one: 20° wide, not 340°.
    const wrapped = view(170, -10, -170, 10);
    assert.equal(isWiderThan(wrapped, view(0, -10, 20, 10)), false);
    assert.equal(isWiderThan(view(0, -40, 60, 40), wrapped), true);
});

test('a sample has features when any of its sources does', () => {
    assert.equal(hasFeatures([]), false);
    assert.equal(hasFeatures([group(0)]), false);
    assert.equal(hasFeatures([group(0), group(3)]), true);
});
