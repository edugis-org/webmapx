import test from 'node:test';
import assert from 'node:assert/strict';

import { boundsFromAnnotation, roundBounds } from '../scripts/lib/allmaps-bounds';

/**
 * A minimal georeference annotation: a 1000x1000 scan whose map face is the
 * inner square from (100,100) to (900,900), with four GCPs placed so that
 * image pixels map linearly onto a 1-degree box.
 */
function annotation(mask: [number, number][]): unknown {
  return {
    type: 'Annotation',
    '@context': [
      'http://iiif.io/api/extension/georef/1/context.json',
      'http://iiif.io/api/presentation/3/context.json',
    ],
    motivation: 'georeferencing',
    target: {
      type: 'SpecificResource',
      source: {
        id: 'https://example.test/iiif/2/scan.jpg',
        type: 'ImageService2',
        width: 1000,
        height: 1000,
      },
      selector: {
        type: 'SvgSelector',
        value: `<svg width="1000" height="1000"><polygon points="${mask.map(p => p.join(',')).join(' ')}" /></svg>`,
      },
    },
    body: {
      type: 'FeatureCollection',
      transformation: { type: 'polynomial', options: { order: 1 } },
      features: [
        { type: 'Feature', properties: { resourceCoords: [0, 0] }, geometry: { type: 'Point', coordinates: [4, 53] } },
        { type: 'Feature', properties: { resourceCoords: [1000, 0] }, geometry: { type: 'Point', coordinates: [5, 53] } },
        { type: 'Feature', properties: { resourceCoords: [1000, 1000] }, geometry: { type: 'Point', coordinates: [5, 52] } },
        { type: 'Feature', properties: { resourceCoords: [0, 1000] }, geometry: { type: 'Point', coordinates: [4, 52] } },
      ],
    },
  };
}

test('boundsFromAnnotation warps the resource mask, not the control points', () => {
  // The mask covers only the middle 80% of the scan, so the extent must be the
  // inner box (4.1..4.9, 52.1..52.9) — NOT the full 4..5 / 52..53 of the GCPs.
  const bounds = boundsFromAnnotation(
    annotation([[100, 100], [900, 100], [900, 900], [100, 900]]),
  );
  assert.ok(bounds);
  const [west, south, east, north] = roundBounds(bounds!, 2);
  assert.equal(west, 4.1);
  assert.equal(east, 4.9);
  assert.equal(south, 52.1);
  assert.equal(north, 52.9);
});

test('boundsFromAnnotation covers the full scan when the mask does', () => {
  const bounds = boundsFromAnnotation(
    annotation([[0, 0], [1000, 0], [1000, 1000], [0, 1000]]),
  );
  const [west, south, east, north] = roundBounds(bounds!, 2);
  assert.equal(west, 4);
  assert.equal(east, 5);
  assert.equal(south, 52);
  assert.equal(north, 53);
});

test('boundsFromAnnotation unions every map on an annotation page', () => {
  const page = {
    type: 'AnnotationPage',
    '@context': 'http://www.w3.org/ns/anno.jsonld',
    items: [
      annotation([[0, 0], [500, 0], [500, 500], [0, 500]]),
      annotation([[500, 500], [1000, 500], [1000, 1000], [500, 1000]]),
    ],
  };
  const [west, south, east, north] = roundBounds(boundsFromAnnotation(page)!, 2);
  // the two halves together span the whole sheet
  assert.equal(west, 4);
  assert.equal(east, 5);
  assert.equal(south, 52);
  assert.equal(north, 53);
});

test('roundBounds keeps config diffs readable', () => {
  assert.deepEqual(
    roundBounds([-74.057163333, 40.674059999, -73.804871111, 40.916361111]),
    [-74.05716, 40.67406, -73.80487, 40.91636],
  );
});
