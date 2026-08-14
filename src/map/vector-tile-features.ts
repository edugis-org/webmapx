// src/map/vector-tile-features.ts
//
// Engine-independent assembly of vector-tile features into a GeoJSON
// FeatureCollection.
//
// Every engine extracts vector-tile features differently (MapLibre hands back
// `MapGeoJSONFeature` with the canonical tile coords attached, OpenLayers hands
// back `RenderFeature`s from the layer renderer with no tile reference), but
// what has to happen *after* extraction is identical: undo world wrapping,
// drop duplicate copies, clip away MVT over-extension and re-join features that
// a tile border cut in half. That post-processing lives here, so an engine
// adapter only has to produce `TileFeatureRecord`s.

import Flatbush from 'flatbush';
import turfUnion from '@turf/union';
import turfBbox from '@turf/bbox';

/**
 * One feature as read from an engine, in lon/lat.
 *
 * `tile` is the *canonical* tile the feature came from (wrap already stripped);
 * engines that cannot report it leave it out, which disables tile-bbox clipping
 * and border merging for that feature but keeps deduplication working.
 */
export interface TileFeatureRecord {
    feature: GeoJSON.Feature;
    tile?: { z: number; x: number; y: number };
    sourceLayer?: string;
    /** Feature id, when the tile carried one. */
    id?: string | number;
}

/** Compute tile geographic bbox [west, south, east, north]. Standard Web Mercator tile math. */
export function tileToBbox(x: number, y: number, z: number): [number, number, number, number] {
    const n = Math.PI - (2 * Math.PI * y) / Math.pow(2, z);
    const s = Math.PI - (2 * Math.PI * (y + 1)) / Math.pow(2, z);
    const w = (x / Math.pow(2, z)) * 360 - 180;
    const e = ((x + 1) / Math.pow(2, z)) * 360 - 180;
    const lat = (a: number) => (Math.atan(Math.sinh(a)) * 180) / Math.PI;
    return [w, lat(s), e, lat(n)];
}

/** Clip a polygon ring to a bbox using Sutherland-Hodgman. Returns null if degenerate. */
function clipRingToBbox(ring: number[][], minX: number, minY: number, maxX: number, maxY: number): number[][] | null {
    const inside = (p: number[], e: number) => [p[0] >= minX, p[0] <= maxX, p[1] >= minY, p[1] <= maxY][e];
    const intersect = (a: number[], b: number[], e: number): number[] => {
        const dx = b[0] - a[0], dy = b[1] - a[1];
        if (e === 0) { const t = (minX - a[0]) / dx; return [minX, a[1] + t * dy]; }
        if (e === 1) { const t = (maxX - a[0]) / dx; return [maxX, a[1] + t * dy]; }
        if (e === 2) { const t = (minY - a[1]) / dy; return [a[0] + t * dx, minY]; }
        const t = (maxY - a[1]) / dy; return [a[0] + t * dx, maxY];
    };
    let out = ring;
    for (let e = 0; e < 4; e++) {
        if (!out.length) return null;
        const inp = out; out = [];
        for (let i = 0; i < inp.length; i++) {
            const cur = inp[i], prev = inp[(i + inp.length - 1) % inp.length];
            const ci = inside(cur, e), pi = inside(prev, e);
            if (ci) { if (!pi) out.push(intersect(prev, cur, e)); out.push(cur); }
            else if (pi) out.push(intersect(prev, cur, e));
        }
    }
    if (out.length < 3) return null;
    if (out[0][0] !== out[out.length - 1][0] || out[0][1] !== out[out.length - 1][1]) out.push(out[0]);
    return out;
}

export function clipGeomToBbox(geom: GeoJSON.Geometry, minX: number, minY: number, maxX: number, maxY: number): GeoJSON.Geometry | null {
    if (geom.type === 'Polygon') {
        const rings = geom.coordinates.map(r => clipRingToBbox(r as number[][], minX, minY, maxX, maxY)).filter(Boolean) as number[][][];
        return rings.length ? { type: 'Polygon', coordinates: rings } : null;
    }
    if (geom.type === 'MultiPolygon') {
        const polys = geom.coordinates
            .map(p => p.map(r => clipRingToBbox(r as number[][], minX, minY, maxX, maxY)).filter(Boolean) as number[][][])
            .filter(p => p.length);
        return polys.length ? { type: 'MultiPolygon', coordinates: polys } : null;
    }
    return geom; // points/lines: no bbox clip needed
}

function propertiesEqual(a: Record<string, unknown> | null, b: Record<string, unknown> | null): boolean {
    if (a === b) return true;
    if (!a && !b) return true;
    const ak = Object.keys(a ?? {}), bk = Object.keys(b ?? {});
    if (ak.length !== bk.length) return false;
    for (const k of ak) if ((a as Record<string, unknown>)[k] !== (b as Record<string, unknown>)[k]) return false;
    return true;
}

function shiftCoords(coords: any, delta: number): any {
    if (typeof coords[0] === 'number') return [coords[0] + delta, coords[1], ...coords.slice(2)];
    return (coords as any[]).map(c => shiftCoords(c, delta));
}

/**
 * Move a geometry back into [-180, 180] when a world copy placed it outside.
 *
 * Shifting is by whole multiples of 360 chosen from the geometry's own centre,
 * so a geometry is never torn apart: one that genuinely straddles the
 * antimeridian keeps its coordinates continuous, it just lands on the copy
 * nearest the prime meridian.
 */
export function normalizeGeometryWrap(geom: GeoJSON.Geometry): GeoJSON.Geometry {
    if (geom.type === 'GeometryCollection') {
        return { type: 'GeometryCollection', geometries: geom.geometries.map(normalizeGeometryWrap) };
    }
    const [w, , e] = turfBbox({ type: 'Feature', properties: null, geometry: geom } as GeoJSON.Feature);
    if (!Number.isFinite(w) || !Number.isFinite(e)) return geom;
    // Only a geometry lying *entirely* outside the normal range is a world
    // copy. One that merely crosses the antimeridian keeps its coordinates
    // running past ±180, which is what makes it continuous.
    if (w <= 180 && e >= -180) return geom;
    const worlds = Math.round(((w + e) / 2) / 360);
    if (worlds === 0) return geom;
    return { ...geom, coordinates: shiftCoords((geom as any).coordinates, -worlds * 360) } as GeoJSON.Geometry;
}

/** Round a bbox so two copies of one feature hash identically despite float noise. */
function bboxKey(feature: GeoJSON.Feature): string {
    return turfBbox(feature).map(v => v.toFixed(7)).join(',');
}

/**
 * Assemble engine-extracted vector-tile features into one FeatureCollection.
 *
 * 1. Undo world wrapping — with `wrapX` on, the same canonical tile is
 *    instantiated once per visible world copy, so zooming out past one world
 *    width returns Japan (and everything else) two or three times.
 * 2. Drop those duplicates, keyed on canonical tile + source layer + identity.
 *    Keying on the feature id alone would instead throw away the *other half*
 *    of a feature a tile border split, which is a different thing entirely.
 * 3. Clip to the tile bbox, removing MVT over-extension (buffer coordinates
 *    beyond the tile extent).
 * 4. Union back together the pieces a tile border split, matched on equal
 *    properties and intersecting bboxes.
 *
 * Steps 3 and 4 apply only to records that carry a `tile`.
 */
export function assembleTileFeatures(records: TileFeatureRecord[]): GeoJSON.FeatureCollection {
    if (!records.length) return { type: 'FeatureCollection', features: [] };

    const tileCache = new Map<string, [number, number, number, number]>();
    const seen = new Set<string>();
    const tileBorderIdx: number[] = [];
    const features: (GeoJSON.Feature | null)[] = [];
    const sourceLayerOf: string[] = [];

    for (const record of records) {
        let json: GeoJSON.Feature = {
            ...record.feature,
            geometry: normalizeGeometryWrap(record.feature.geometry),
        };

        const tileKey = record.tile ? `${record.tile.z}/${record.tile.x}/${record.tile.y}` : '';

        if (record.tile) {
            if (!tileCache.has(tileKey)) tileCache.set(tileKey, tileToBbox(record.tile.x, record.tile.y, record.tile.z));
            const [tw, ts, te, tn] = tileCache.get(tileKey)!;
            const clipped = clipGeomToBbox(json.geometry, tw, ts, te, tn);
            if (clipped) json = { ...json, geometry: clipped };
        }

        // The bbox is part of the key so that two halves of a border-split
        // feature (same id, different geometry) both survive, while two world
        // copies (same id, identical geometry after unwrapping) collapse.
        const identity = record.id ?? json.id ?? JSON.stringify(json.properties ?? null);
        const key = `${tileKey}|${record.sourceLayer ?? ''}|${identity}|${bboxKey(json)}`;
        if (seen.has(key)) continue;
        seen.add(key);

        const index = features.push(json) - 1;
        sourceLayerOf[index] = record.sourceLayer ?? '';

        if (record.tile) {
            const [tw, ts, te, tn] = tileCache.get(tileKey)!;
            const [fw, fs, fe, fn] = turfBbox(json);
            // Touching a tile edge means the feature may continue in the neighbour.
            if (fw <= tw + 1e-6 || fe >= te - 1e-6 || fs <= ts + 1e-6 || fn >= tn - 1e-6) {
                tileBorderIdx.push(index);
            }
        }
    }

    if (tileBorderIdx.length > 1) {
        const bboxes = tileBorderIdx.map(i => turfBbox(features[i]!));
        const index = new Flatbush(bboxes.length);
        for (const [w, s, e, n] of bboxes) index.add(w, s, e, n);
        index.finish();

        for (let a = 0; a < tileBorderIdx.length; a++) {
            const ai = tileBorderIdx[a];
            if (!features[ai]) continue;
            const candidates = index.search(bboxes[a][0], bboxes[a][1], bboxes[a][2], bboxes[a][3]);
            for (const b of candidates) {
                if (b <= a) continue;
                const bi = tileBorderIdx[b];
                if (!features[bi]) continue;
                if (sourceLayerOf[ai] !== sourceLayerOf[bi]) continue;
                if (!propertiesEqual(features[ai]!.properties, features[bi]!.properties)) continue;
                const merged: GeoJSON.Feature<GeoJSON.Polygon | GeoJSON.MultiPolygon> | null = turfUnion(
                    {
                        type: 'FeatureCollection', features: [
                            features[ai] as GeoJSON.Feature<GeoJSON.Polygon | GeoJSON.MultiPolygon>,
                            features[bi] as GeoJSON.Feature<GeoJSON.Polygon | GeoJSON.MultiPolygon>,
                        ]
                    }
                ) ?? null;
                if (merged) {
                    merged.properties = features[ai]!.properties;
                    merged.id = features[ai]!.id;
                    features[ai] = merged;
                    features[bi] = null; // absorbed
                }
            }
        }
    }

    return { type: 'FeatureCollection', features: features.filter((f): f is GeoJSON.Feature => f !== null) };
}
