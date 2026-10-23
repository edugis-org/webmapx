/**
 * The buffer pipeline against the real GDAL/SpatiaLite WASM build, as
 * `geoprocessing.test.ts` does for the analysis operations.
 *
 * What these pin is the matching of results to inputs: GDAL is given only the
 * shapes, and each buffer has to get back the attributes of the shape it was
 * made from — also when GDAL drops a shape on the way, which shifts every
 * result after it.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { bufferFeatures } from '../src/workers/buffer-runner';
import type { GdalLike } from '../src/workers/geoprocessing-runner';

type FC = GeoJSON.FeatureCollection;

let gdalPromise: Promise<GdalLike> | null = null;

/** gdal3.js's Node build takes file paths where the browser build takes `File`s. */
function nodeGdal(): Promise<GdalLike> {
    if (gdalPromise) return gdalPromise;
    const scratch = mkdtempSync(path.join(tmpdir(), 'webmapx-buffer-'));
    const nodeBuild = pathToFileURL(path.resolve(process.cwd(), 'node_modules/gdal3.js/node.js')).href;
    gdalPromise = import(nodeBuild)
        .then((mod: any) => (mod.default ?? mod)({ path: 'node_modules/gdal3.js/dist/package', useWorker: false }))
        .then((gdal: any): GdalLike => ({
            async open(file: unknown) {
                if (typeof File !== 'undefined' && file instanceof File) {
                    const target = path.join(scratch, file.name);
                    writeFileSync(target, Buffer.from(await file.arrayBuffer()));
                    return gdal.open(target);
                }
                return gdal.open(file);
            },
            close: (ds: unknown) => gdal.close(ds),
            ogr2ogr: (ds: unknown, args: string[], name?: string) => gdal.ogr2ogr(ds, args, name),
            getFileBytes: (p: unknown) => gdal.getFileBytes(p),
        }));
    return gdalPromise;
}

function point(lon: number, lat: number, properties: Record<string, unknown>, id?: string | number): GeoJSON.Feature {
    return { type: 'Feature', ...(id !== undefined ? { id } : {}), geometry: { type: 'Point', coordinates: [lon, lat] }, properties };
}

/** Mean of a buffer's outer ring — the point it was drawn around. */
function centre(feature: GeoJSON.Feature): [number, number] {
    const geometry = feature.geometry as GeoJSON.Polygon | GeoJSON.MultiPolygon;
    const ring = geometry.type === 'Polygon' ? geometry.coordinates[0] : geometry.coordinates[0][0];
    const points = ring.slice(0, -1);
    return [
        points.reduce((sum, c) => sum + c[0], 0) / points.length,
        points.reduce((sum, c) => sum + c[1], 0) / points.length,
    ];
}

/** Each buffer must sit around the point whose `lon`/`lat` attributes it carries. */
function assertAttributesFollowShapes(result: FC): void {
    for (const feature of result.features) {
        const [lon, lat] = centre(feature);
        const props = feature.properties ?? {};
        assert.ok(Math.abs(lon - (props.lon as number)) < 0.01 && Math.abs(lat - (props.lat as number)) < 0.01,
            `buffer around ${lon.toFixed(3)},${lat.toFixed(3)} carries the attributes of ${props.name} at ${props.lon},${props.lat}`);
    }
}

async function buffer(features: GeoJSON.Feature[], metres = 1000): Promise<FC> {
    return bufferFeatures(await nodeGdal(), { type: 'FeatureCollection', features }, metres, 16, 52);
}

test('a drawn layer buffers: a numeric `id` attribute beside a string feature id', async () => {
    const result = await buffer([
        point(5, 52, { id: 1, name: 'a', lon: 5, lat: 52 }, 'f-1'),
        point(6, 52, { id: 2, name: 'b', lon: 6, lat: 52 }, 'f-2'),
    ]);
    assert.equal(result.features.length, 2);
    assert.deepEqual(result.features.map((f) => f.properties?.id), [1, 2]);
    assertAttributesFollowShapes(result);
});

test('a shape beyond the ±84° clip is dropped without shifting the attributes after it', async () => {
    const result = await buffer([
        point(5, 52, { name: 'A', lon: 5, lat: 52 }),
        point(5, 86, { name: 'B', lon: 5, lat: 86 }),
        point(6, 52, { name: 'C', lon: 6, lat: 52 }),
    ]);
    assert.deepEqual(result.features.map((f) => f.properties?.name), ['A', 'C']);
    assertAttributesFollowShapes(result);
});

test('a feature without geometry is dropped without shifting the attributes after it', async () => {
    const result = await buffer([
        point(5, 52, { name: 'A', lon: 5, lat: 52 }),
        { type: 'Feature', geometry: null as unknown as GeoJSON.Geometry, properties: { name: 'none' } },
        point(6, 52, { name: 'C', lon: 6, lat: 52 }),
    ]);
    assert.deepEqual(result.features.map((f) => f.properties?.name), ['A', 'C']);
    assertAttributesFollowShapes(result);
});

test('many shapes each keep their own attributes, and nothing of the pipeline leaks into them', async () => {
    const features = Array.from({ length: 40 }, (_, i) => {
        const lon = 3 + (i % 8) * 0.5;
        const lat = 50 + Math.floor(i / 8) * 0.5;
        return point(lon, lat, { id: i, name: `p${i}`, lon, lat }, `f-${i}`);
    });
    const result = await buffer(features);
    assert.equal(result.features.length, 40);
    assertAttributesFollowShapes(result);
    for (const feature of result.features) {
        assert.deepEqual(Object.keys(feature.properties ?? {}).sort(), ['id', 'lat', 'lon', 'name']);
    }
});

test('3D input is flattened and buffered', async () => {
    const result = await buffer([
        { type: 'Feature', geometry: { type: 'Point', coordinates: [5, 52, 10] }, properties: { name: 'quake', lon: 5, lat: 52 } },
    ]);
    assert.equal(result.features.length, 1);
    assertAttributesFollowShapes(result);
});
