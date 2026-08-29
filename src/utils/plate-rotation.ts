/**
 * Plate tectonics as a function of time.
 *
 * The world's coastlines at an age, worked out from where the land is *today*
 * plus the rotation that carries each tectonic plate back through time. That is
 * the same information as a folder of one reconstructed map per age, in the
 * form it actually has: about 3 MB instead of 300, and continuous, because a
 * rotation between two sampled ages can be interpolated where a stack of
 * finished maps can only be stepped through.
 *
 * The unit of motion is the plate, not the coastline. Every land polygon rides
 * on a plate (`plateId`), and a plate's position at an age is one rotation of
 * the whole globe, so reconstructing a hundred thousand vertices costs a few
 * hundred quaternion lookups and no geometry work at all.
 *
 * Written as a plain function of (data, age) with no cached or reused state, in
 * the shape of `daylightBands` in `solar.ts`: every call allocates its own
 * features, its own properties and its own coordinates. An earlier version kept
 * one collection and overwrote the numbers inside it, which is faster and
 * quietly wrong — an engine handed back the identical object it already holds
 * has nothing to notice, so the map keeps drawing the old picture while every
 * reader of the data sees the new one.
 *
 * Built by `scripts/build-paleorotations.ts`, which also describes the files.
 */

/** What the build script writes, and this reads. */
export interface PlateRotationFile {
    model: string;
    /** Sampled ages in Ma, ascending, starting at 0. */
    ages: number[];
    /** Per plate, one `[w, x, y, z]` per age. */
    rotations: Record<string, [number, number, number, number][]>;
}

export interface PlateModel {
    model: string;
    ages: number[];
    /** The oldest age the model covers, in Ma. */
    maxAge: number;
    rotations: Map<number, Quaternion[]>;
    /** Present-day coastlines, tagged with `plateId`, `continent` and `fromAge`. */
    coastlines: GeoJSON.FeatureCollection;
}

export type Quaternion = [number, number, number, number];

const DEG = 180 / Math.PI;
const RAD = Math.PI / 180;
const IDENTITY: Quaternion = [1, 0, 0, 0];

/** Reads the two files into the form {@link reconstruct} wants. */
export function buildPlateModel(
    coastlines: GeoJSON.FeatureCollection,
    rotations: PlateRotationFile,
): PlateModel {
    const table = new Map<number, Quaternion[]>();
    for (const [id, list] of Object.entries(rotations.rotations)) table.set(Number(id), list);

    return {
        model: rotations.model,
        ages: rotations.ages,
        maxAge: rotations.ages[rotations.ages.length - 1] ?? 0,
        rotations: table,
        coastlines,
    };
}

/**
 * Interpolates between two rotations along the arc, not the chord.
 *
 * A quaternion is a point on a sphere, and averaging components cuts across it.
 * Every plate would still arrive in the right place at each *sampled* age and
 * wander off its path in between — a stutter at every 5 Ma tick, which is the
 * one artefact this whole approach exists to avoid.
 */
export function slerp(a: Quaternion, b: Quaternion, t: number): Quaternion {
    let [bw, bx, by, bz] = b;
    let dot = a[0] * bw + a[1] * bx + a[2] * by + a[3] * bz;
    // q and -q are the same rotation; without this the interpolation can take
    // the long way round, sending a plate the wrong way across the globe.
    if (dot < 0) {
        bw = -bw; bx = -bx; by = -by; bz = -bz;
        dot = -dot;
    }
    // Nearly parallel: the arc is indistinguishable from the chord, and the
    // sine below would divide by something near zero.
    if (dot > 0.9995) {
        const w = a[0] + (bw - a[0]) * t;
        const x = a[1] + (bx - a[1]) * t;
        const y = a[2] + (by - a[2]) * t;
        const z = a[3] + (bz - a[3]) * t;
        const length = Math.hypot(w, x, y, z) || 1;
        return [w / length, x / length, y / length, z / length];
    }
    const theta = Math.acos(dot);
    const sin = Math.sin(theta);
    const sa = Math.sin((1 - t) * theta) / sin;
    const sb = Math.sin(t * theta) / sin;
    return [a[0] * sa + bw * sb, a[1] * sa + bx * sb, a[2] * sa + by * sb, a[3] * sa + bz * sb];
}

/** A plate's rotation at `age`, between the two sampled ages either side of it. */
function rotationAt(model: PlateModel, plateId: number, age: number): Quaternion {
    const list = model.rotations.get(plateId);
    if (!list || list.length === 0) return IDENTITY;

    const { ages } = model;
    if (age <= ages[0]) return list[0];
    if (age >= ages[ages.length - 1]) return list[list.length - 1];

    // Evenly spaced in practice, but not assumed — a model may sample more
    // finely over the ages it knows better.
    let high = 1;
    while (high < ages.length - 1 && ages[high] < age) high++;
    const low = high - 1;
    const span = ages[high] - ages[low];
    return slerp(list[low], list[high], span > 0 ? (age - ages[low]) / span : 0);
}

/** One lon/lat pair, rotated. */
function rotatePoint(q: Quaternion, lon: number, lat: number): GeoJSON.Position {
    const [w, qx, qy, qz] = q;
    const la = lat * RAD;
    const lo = lon * RAD;
    const cos = Math.cos(la);
    const px = cos * Math.cos(lo);
    const py = cos * Math.sin(lo);
    const pz = Math.sin(la);

    // v + 2q_w(q_v × v) + 2q_v × (q_v × v), written out.
    const tx = 2 * (qy * pz - qz * py);
    const ty = 2 * (qz * px - qx * pz);
    const tz = 2 * (qx * py - qy * px);
    const rx = px + w * tx + (qy * tz - qz * ty);
    const ry = py + w * ty + (qz * tx - qx * tz);
    const rz = pz + w * tz + (qx * ty - qy * tx);

    return [
        Math.atan2(ry, rx) * DEG,
        Math.asin(rz < -1 ? -1 : rz > 1 ? 1 : rz) * DEG,
    ];
}

/**
 * The longest edge, in degrees, before it is broken into smaller ones.
 *
 * A GeoJSON edge is a straight line between two coordinates, and every engine
 * draws it as a straight line in whatever plane it is projecting into. On
 * Mercator that is harmless. On a pseudocylindrical equal-area projection —
 * Equal Earth, Mollweide — the meridians curve, so a single long edge cuts a
 * visibly wrong chord across the curve, worst near the poles where the
 * meridians converge hardest. Reconstructed coastlines are dense (a quarter of
 * a degree between vertices, typically) but have a tail of very long edges:
 * Antarctica's ring closes with a single 180° step. Those are the ones that
 * looked like the projection had gone wrong.
 */
const MAX_EDGE_DEGREES = 2;

/**
 * Breaks long edges into shorter ones, so a curved projection can bend them.
 *
 * Interpolated in lon/lat rather than along a great circle, because that is the
 * line the coordinates describe and the line a projection expects to bend.
 */
function densifyRing(ring: GeoJSON.Position[]): GeoJSON.Position[] {
    let longest = 0;
    for (let i = 1; i < ring.length; i++) {
        longest = Math.max(longest, Math.abs(ring[i][0] - ring[i - 1][0]), Math.abs(ring[i][1] - ring[i - 1][1]));
    }
    if (longest <= MAX_EDGE_DEGREES) return ring;

    const out: GeoJSON.Position[] = [ring[0]];
    for (let i = 1; i < ring.length; i++) {
        const [aLon, aLat] = ring[i - 1];
        const [bLon, bLat] = ring[i];
        const steps = Math.ceil(Math.max(Math.abs(bLon - aLon), Math.abs(bLat - aLat)) / MAX_EDGE_DEGREES);
        for (let s = 1; s < steps; s++) {
            const t = s / steps;
            out.push([aLon + (bLon - aLon) * t, aLat + (bLat - aLat) * t]);
        }
        out.push(ring[i]);
    }
    return out;
}

/**
 * Clips a ring to one side of a meridian (Sutherland–Hodgman).
 *
 * The clip region is a half-plane, which is convex, so this is exact for a
 * subject ring of any shape — the usual "convex only" caveat is about the clip
 * window, not about what is being clipped. Coastlines are emphatically not
 * convex, which is why that distinction matters here.
 */
function clipToMeridian(ring: GeoJSON.Position[], bound: number, keepGreater: boolean): GeoJSON.Position[] {
    const inside = (lon: number) => (keepGreater ? lon >= bound : lon <= bound);
    const out: GeoJSON.Position[] = [];

    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
        const a = ring[j];
        const b = ring[i];
        const aIn = inside(a[0]);
        const bIn = inside(b[0]);
        if (aIn !== bIn) {
            const t = (bound - a[0]) / (b[0] - a[0]);
            out.push([bound, a[1] + (b[1] - a[1]) * t]);
        }
        if (bIn) out.push(b);
    }
    return out;
}

/**
 * Cuts a ring that reaches past ±180° into the pieces that belong on each side.
 *
 * Leaving it whole was the earlier choice, on the grounds that renderers wrap
 * longitudes back into range. Mercator and the globe do. A pseudocylindrical
 * projection does not: there ±180° is the *curved outer edge* of the map, and a
 * coordinate beyond it lands outside the world or folded back into the wrong
 * hemisphere. That is what made reconstructed polygons look mangled near the
 * poles on the east and west sides in Equal Earth and Mollweide — the
 * projections are exactly equal-area there, the geometry handed to them was
 * simply outside the world.
 *
 * The ring is clipped three times, shifted one world east and west, so a shape
 * straddling the line contributes a piece on each side.
 */
function splitAtAntimeridian(ring: GeoJSON.Position[]): GeoJSON.Position[][] {
    let outside = false;
    for (const [lon] of ring) {
        if (lon < -180 || lon > 180) { outside = true; break; }
    }
    if (!outside) return [ring];

    const parts: GeoJSON.Position[][] = [];
    for (const shift of [-360, 0, 360]) {
        const shifted = ring.map(([lon, lat]) => [lon + shift, lat] as GeoJSON.Position);
        const clipped = clipToMeridian(clipToMeridian(shifted, -180, true), 180, false);
        if (clipped.length < 3) continue;
        // A piece that survives only as a sliver on the cut line is
        // floating-point residue, not land.
        let area = 0;
        for (let i = 0, j = clipped.length - 1; i < clipped.length; j = i++) {
            area += clipped[j][0] * clipped[i][1] - clipped[i][0] * clipped[j][1];
        }
        if (Math.abs(area / 2) < 1e-9) continue;
        parts.push([...clipped, clipped[0]]);
    }
    return parts.length > 0 ? parts : [ring];
}

/**
 * Keeps a ring's longitudes continuous across the antimeridian.
 *
 * A rotation moves land across ±180° freely, and a ring with one vertex at
 * +179° and the next at -179° is, read literally, a shape spanning the whole
 * planet the wrong way — the classic smear right across the map. Making each
 * step take the short way round removes it, and the ring is then shifted as a
 * whole so its middle sits in the ordinary range. What is left sticking out
 * past ±180° is cut off by {@link splitAtAntimeridian}.
 */
function unwrapRing(ring: GeoJSON.Position[]): GeoJSON.Position[] {
    let min = ring[0][0];
    let max = min;
    for (let i = 1; i < ring.length; i++) {
        const step = ring[i][0] - ring[i - 1][0];
        if (step > 180) ring[i][0] -= 360;
        else if (step < -180) ring[i][0] += 360;
        if (ring[i][0] < min) min = ring[i][0];
        if (ring[i][0] > max) max = ring[i][0];
    }
    const shift = -Math.round(((min + max) / 2) / 360) * 360;
    if (shift !== 0) for (const point of ring) point[0] += shift;
    return ring;
}

/**
 * Rotates a geometry's coordinates, whatever its nesting.
 *
 * GeoJSON nests to different depths — a Polygon's rings, a MultiPolygon's
 * polygons of rings — so the shape is walked and rebuilt rather than assumed.
 * Unwrapping happens at the level whose children are coordinates, which is a
 * ring or a line either way.
 */
function rotateCoordinates(node: unknown, q: Quaternion): unknown {
    const list = node as unknown[];
    if (list.length === 0) return [];
    if (typeof list[0] === 'number') {
        const point = node as number[];
        return rotatePoint(q, point[0], point[1]);
    }
    if (typeof (list[0] as unknown[])[0] === 'number') {
        return densifyRing(rotateRing(list as number[][], q));
    }
    return list.map((child) => rotateCoordinates(child, q));
}

/** One ring, rotated and made continuous across the antimeridian. */
function rotateRing(ring: number[][], q: Quaternion): GeoJSON.Position[] {
    return unwrapRing(ring.map((point) => rotatePoint(q, point[0], point[1])));
}

/** The world at `age`, as GeoJSON. */
export function reconstruct(model: PlateModel, age: number): GeoJSON.FeatureCollection {
    const features: GeoJSON.Feature[] = [];

    for (const feature of model.coastlines.features) {
        if (!feature.geometry) continue;
        const properties = (feature.properties ?? {}) as Record<string, unknown>;

        // Land that has not formed yet is absent, not frozen: without this the
        // Galapagos ride the Pacific for 200 Ma, which reads as data rather
        // than as a bug.
        const fromAge = Number(properties.fromAge);
        if (Number.isFinite(fromAge) && age > fromAge) continue;

        const plateId = Number(properties.plateId);
        const q = Number.isFinite(plateId) ? rotationAt(model, plateId, age) : IDENTITY;

        features.push({
            type: 'Feature',
            properties: { ...properties, ma: age },
            geometry: rotateGeometry(feature.geometry, q),
        });
    }

    return { type: 'FeatureCollection', features };
}

/**
 * One feature's geometry, rotated.
 *
 * A single-ring polygon is handled on its own because splitting one at the
 * antimeridian turns it into a MultiPolygon, and that is the only shape in this
 * dataset — every coastline piece is one ring with no holes. Anything else is
 * rotated, unwrapped and densified but not split: cutting a polygon that has
 * holes means deciding which piece each hole belongs to, which is real work for
 * a case that does not arise here and would be untested if written.
 */
function rotateGeometry(geometry: GeoJSON.Geometry, q: Quaternion): GeoJSON.Geometry {
    if (geometry.type === 'Polygon' && geometry.coordinates.length === 1) {
        // Densified *after* splitting, not before: the cut itself adds a long
        // edge running down the ±180 meridian, and that meridian is one of the
        // curves a pseudocylindrical projection bends most.
        const parts = splitAtAntimeridian(rotateRing(geometry.coordinates[0] as number[][], q))
            .map(densifyRing);
        return parts.length === 1
            ? { type: 'Polygon', coordinates: [parts[0]] }
            : { type: 'MultiPolygon', coordinates: parts.map((ring) => [ring]) };
    }
    return {
        type: geometry.type,
        coordinates: rotateCoordinates((geometry as { coordinates: unknown }).coordinates, q),
    } as GeoJSON.Geometry;
}
