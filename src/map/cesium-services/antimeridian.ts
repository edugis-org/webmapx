// Cesium's GeoJsonDataSource triangulates polygons in a 2D tangent-plane projection.
// It has no concept of the antimeridian, so a ring whose boundary genuinely crosses
// it (e.g. Russia, Antarctica) gets triangulated as an ordinary ~360°-wide shape,
// producing self-intersecting/overlapping triangles — visible as double-rendered
// fill. MapLibre/OpenLayers/Leaflet handle this natively; Cesium needs the ring
// pre-split into pieces that each stay within a single 360° window.
//
// This module clips Polygon/MultiPolygon geometries that cross the antimeridian
// into a MultiPolygon of non-crossing pieces, each renormalized into [-180, 180].
// Only used on the Cesium load path — other engines receive the original geometry.

type Ring = GeoJSON.Position[];

function unwrapRing(ring: Ring): Ring {
    const out: Ring = ring.map(p => [p[0], p[1], ...(p.slice(2))] as GeoJSON.Position);
    for (let i = 1; i < out.length; i += 1) {
        const dLon = out[i][0] - out[i - 1][0];
        if (Math.abs(dLon) > 180) {
            out[i][0] -= 360 * Math.round(dLon / 360);
        }
    }
    return out;
}

function ringLonRange(ring: Ring): { min: number; max: number } {
    let min = Infinity;
    let max = -Infinity;
    for (const p of ring) {
        if (p[0] < min) min = p[0];
        if (p[0] > max) max = p[0];
    }
    return { min, max };
}

function lerpLat(a: GeoJSON.Position, b: GeoJSON.Position, x: number): number {
    const t = (x - a[0]) / (b[0] - a[0]);
    return a[1] + t * (b[1] - a[1]);
}

// Sutherland-Hodgman clip of a closed ring against a vertical half-plane.
// `keepLessEqual` keeps the side lon <= x when true, lon >= x when false.
function clipRingHalfPlane(ring: Ring, x: number, keepLessEqual: boolean): Ring {
    const inside = (p: GeoJSON.Position) => (keepLessEqual ? p[0] <= x : p[0] >= x);
    const out: Ring = [];
    const n = ring.length;
    for (let i = 0; i < n; i += 1) {
        const curr = ring[i];
        const prev = ring[(i - 1 + n) % n];
        const currIn = inside(curr);
        const prevIn = inside(prev);
        if (currIn !== prevIn) {
            out.push([x, lerpLat(prev, curr, x)]);
        }
        if (currIn) out.push(curr);
    }
    if (out.length > 0 && (out[0][0] !== out[out.length - 1][0] || out[0][1] !== out[out.length - 1][1])) {
        out.push(out[0]);
    }
    return out;
}

// Splits an unwrapped ring (which may span outside [-180, 180]) into pieces that
// each fit within one 360° window, shifted back into [-180, 180].
function splitUnwrappedRing(ring: Ring): Ring[] {
    const { min, max } = ringLonRange(ring);
    if (max - min <= 360.0001 && max <= 180 && min >= -180) {
        return [ring];
    }
    // Clip into successive 360°-wide windows aligned to the standard [-180,180] grid.
    const pieces: Ring[] = [];
    const startK = Math.floor((min + 180) / 360);
    const endK = Math.floor((max + 180) / 360);
    for (let k = startK; k <= endK; k += 1) {
        const lo = k * 360 - 180;
        const hi = k * 360 + 180;
        let piece = clipRingHalfPlane(ring, lo, false);
        if (piece.length < 4) continue;
        piece = clipRingHalfPlane(piece, hi, true);
        if (piece.length < 4) continue;
        pieces.push(piece.map(p => [p[0] - k * 360, p[1]] as GeoJSON.Position));
    }
    return pieces.length > 0 ? pieces : [ring];
}

function needsSplit(ring: Ring): boolean {
    for (let i = 1; i < ring.length; i += 1) {
        if (Math.abs(ring[i][0] - ring[i - 1][0]) > 180) return true;
    }
    return false;
}

// Sum of each edge's minimal signed longitude delta around the closed ring
// (including the closing edge back to the first point). For an ordinary ring
// that crosses the antimeridian and comes back (e.g. a peninsula), this is ~0.
// For a ring that encircles a pole — its longitude sweeps a full 360° over the
// loop (e.g. Antarctica) — this is ~±360. Such rings have no flat non-crossing
// representation; they need a pole cap, not a plain split.
function netLongitudeWinding(ring: Ring): number {
    // `ring` is GeoJSON-closed (first === last); use the open point list.
    const pts = ring.slice(0, -1);
    const n = pts.length;
    let sum = 0;
    for (let i = 0; i < n; i += 1) {
        const a = pts[i];
        const b = pts[(i + 1) % n];
        let d = b[0] - a[0];
        if (d > 180) d -= 360;
        else if (d < -180) d += 360;
        sum += d;
    }
    return sum;
}

// Cuts a pole-encircling ring open at its single antimeridian-crossing edge and
// closes it via the pole, producing a simple (non-crossing) polygon that covers
// the same polar cap area.
function capPolarRing(ring: Ring, poleLat: number): Ring {
    const pts = ring.slice(0, -1);
    const n = pts.length;

    let idx = -1;
    for (let i = 0; i < n; i += 1) {
        const a = pts[i];
        const b = pts[(i + 1) % n];
        if (Math.abs(b[0] - a[0]) > 180) {
            idx = i;
            break;
        }
    }
    if (idx === -1) return ring;

    const a = pts[idx];
    const b = pts[(idx + 1) % n];
    const bShifted: GeoJSON.Position = [b[0] - 360 * Math.round((b[0] - a[0]) / 360), b[1]];
    const crossX = bShifted[0] > a[0] ? 180 : -180;
    const otherX = -crossX;
    const t = (crossX - a[0]) / (bShifted[0] - a[0]);
    const crossLat = a[1] + t * (b[1] - a[1]);

    const arc: Ring = [];
    for (let k = 0; k < n; k += 1) {
        arc.push(pts[(idx + 1 + k) % n]); // b, b+1, ..., a
    }

    const capped: Ring = [
        [otherX, crossLat],
        ...arc,
        [crossX, crossLat],
        [crossX, poleLat],
        [otherX, poleLat],
        [otherX, crossLat],
    ];
    return capped;
}

function averageLat(ring: Ring): number {
    let sum = 0;
    for (const p of ring) sum += p[1];
    return sum / ring.length;
}

// Splits a single Polygon's rings (exterior + holes) into one or more Polygons,
// distributing each hole into whichever split piece it falls inside.
function splitPolygonCoordinates(coordinates: Ring[]): Ring[][] {
    const [exterior, ...holes] = coordinates;
    if (!needsSplit(exterior) && holes.every(h => !needsSplit(h))) {
        return [coordinates];
    }

    if (Math.abs(netLongitudeWinding(exterior)) > 180) {
        const poleLat = averageLat(exterior) < 0 ? -90 : 90;
        return [[capPolarRing(exterior, poleLat), ...holes]];
    }

    const exteriorPieces = splitUnwrappedRing(unwrapRing(exterior));
    if (exteriorPieces.length <= 1) {
        return [coordinates];
    }

    const pieceRanges = exteriorPieces.map(ringLonRange);
    const polygons: Ring[][] = exteriorPieces.map(piece => [piece]);

    for (const hole of holes) {
        const holePieces = splitUnwrappedRing(unwrapRing(hole));
        for (const holePiece of holePieces) {
            const { min, max } = ringLonRange(holePiece);
            const mid = (min + max) / 2;
            let bestIdx = 0;
            let bestDist = Infinity;
            for (let i = 0; i < pieceRanges.length; i += 1) {
                const r = pieceRanges[i];
                const center = (r.min + r.max) / 2;
                const dist = Math.abs(center - mid);
                if (dist < bestDist) {
                    bestDist = dist;
                    bestIdx = i;
                }
            }
            polygons[bestIdx].push(holePiece);
        }
    }

    return polygons;
}

function splitGeometry(geometry: GeoJSON.Geometry): GeoJSON.Geometry {
    if (geometry.type === 'Polygon') {
        const polygons = splitPolygonCoordinates(geometry.coordinates as Ring[]);
        return polygons.length <= 1
            ? geometry
            : { type: 'MultiPolygon', coordinates: polygons };
    }
    if (geometry.type === 'MultiPolygon') {
        const allPolygons: Ring[][] = [];
        for (const poly of geometry.coordinates as Ring[][]) {
            allPolygons.push(...splitPolygonCoordinates(poly));
        }
        return { type: 'MultiPolygon', coordinates: allPolygons };
    }
    return geometry;
}

/**
 * Returns a copy of the FeatureCollection with any Polygon/MultiPolygon geometry
 * that crosses the antimeridian split into non-crossing pieces. Only geometries
 * that actually need it are touched; everything else is passed through as-is.
 * Use only for the Cesium GeoJsonDataSource load path.
 */
export function splitAntimeridianFeatures(fc: GeoJSON.FeatureCollection): GeoJSON.FeatureCollection {
    let changed = false;
    const features = (fc.features ?? []).map(f => {
        if (!f.geometry || (f.geometry.type !== 'Polygon' && f.geometry.type !== 'MultiPolygon')) {
            return f;
        }
        const nextGeometry = splitGeometry(f.geometry);
        if (nextGeometry === f.geometry) return f;
        changed = true;
        return { ...f, geometry: nextGeometry };
    });
    return changed ? { ...fc, features } : fc;
}
