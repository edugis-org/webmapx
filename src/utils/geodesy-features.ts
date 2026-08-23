/**
 * Shapes that are pure spherical geometry: circles of true distance, shortest
 * paths, antipodes, and Tissot's indicatrix.
 *
 * All of them exist to show something a map *cannot* show honestly. A circle of
 * fixed ground radius is drawn by a projection as whatever that projection does
 * to circles — so drawing several of them across the world is the most direct
 * way to see a projection's distortion, which is exactly Tissot's idea. The
 * shortest path between two places is a curve on nearly every map, and the
 * straight line a student draws instead is the wrong route.
 */

const DEG = Math.PI / 180;
const EARTH_RADIUS_M = 6_371_008.8;

/** Where you arrive going `bearing` for `distance` metres from a point. */
export function destination(lon: number, lat: number, bearingDeg: number, distanceM: number): [number, number] {
    const δ = distanceM / EARTH_RADIUS_M;
    const θ = bearingDeg * DEG;
    const φ1 = lat * DEG;
    const λ1 = lon * DEG;

    const φ2 = Math.asin(Math.sin(φ1) * Math.cos(δ) + Math.cos(φ1) * Math.sin(δ) * Math.cos(θ));
    const λ2 = λ1 + Math.atan2(
        Math.sin(θ) * Math.sin(δ) * Math.cos(φ1),
        Math.cos(δ) - Math.sin(φ1) * Math.sin(φ2),
    );
    return [normalise(λ2 / DEG), φ2 / DEG];
}

function normalise(lon: number): number {
    return ((lon + 180) % 360 + 360) % 360 - 180;
}

/**
 * A ring of points all the same distance over the ground from a centre.
 *
 * Cut where it crosses the antimeridian, so it is not drawn the long way round;
 * a ring that swallows a pole is left whole, since as a *line* it is honest
 * either way and closing it over the pole would invent a segment nobody walked.
 */
export function distanceRing(lon: number, lat: number, radiusM: number, steps = 180): number[][][] {
    const points: number[][] = [];
    for (let i = 0; i <= steps; i++) points.push(destination(lon, lat, (i / steps) * 360, radiusM));

    const parts: number[][][] = [];
    let current: number[][] = [points[0]];
    for (let i = 1; i < points.length; i++) {
        if (Math.abs(points[i][0] - points[i - 1][0]) > 180) {
            parts.push(current);
            current = [];
        }
        current.push(points[i]);
    }
    parts.push(current);
    return parts.filter((part) => part.length > 1);
}

/** Rings at several distances around one place — "how far is an hour's drive". */
export function rangeRings(
    lon: number,
    lat: number,
    radiiKm: number[] = [500, 1000, 2000, 5000],
): GeoJSON.FeatureCollection {
    const features: GeoJSON.Feature[] = [];
    for (const km of radiiKm) {
        const parts = distanceRing(lon, lat, km * 1000);
        features.push({
            type: 'Feature',
            properties: { radiusKm: km, centre: [lon, lat], description: `${km} km` },
            geometry: parts.length === 1
                ? { type: 'LineString', coordinates: parts[0] }
                : { type: 'MultiLineString', coordinates: parts },
        } as GeoJSON.Feature);
    }
    return { type: 'FeatureCollection', features };
}

/**
 * The shortest path between two places, as the curve it really is.
 *
 * Sampled along the great circle rather than drawn as one segment: two points
 * joined straight on a Mercator map is a rhumb line, which is a different route
 * and a longer one — the difference between London–Tokyo over Siberia and over
 * the Mediterranean.
 */
export function greatCircleRoute(
    from: [number, number],
    to: [number, number],
    steps = 128,
): GeoJSON.FeatureCollection {
    const [λ1, φ1] = [from[0] * DEG, from[1] * DEG];
    const [λ2, φ2] = [to[0] * DEG, to[1] * DEG];
    const Δ = 2 * Math.asin(Math.sqrt(
        Math.sin((φ2 - φ1) / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin((λ2 - λ1) / 2) ** 2,
    ));

    const points: number[][] = [];
    for (let i = 0; i <= steps; i++) {
        const f = i / steps;
        // Spherical interpolation; a straight average of the coordinates would
        // wander off the sphere and back, which is the rhumb line again.
        const a = Δ === 0 ? 1 - f : Math.sin((1 - f) * Δ) / Math.sin(Δ);
        const b = Δ === 0 ? f : Math.sin(f * Δ) / Math.sin(Δ);
        const x = a * Math.cos(φ1) * Math.cos(λ1) + b * Math.cos(φ2) * Math.cos(λ2);
        const y = a * Math.cos(φ1) * Math.sin(λ1) + b * Math.cos(φ2) * Math.sin(λ2);
        const z = a * Math.sin(φ1) + b * Math.sin(φ2);
        points.push([normalise(Math.atan2(y, x) / DEG), Math.atan2(z, Math.hypot(x, y)) / DEG]);
    }

    // Cut at the seam, or the route is drawn back across the whole world.
    const parts: number[][][] = [];
    let current: number[][] = [points[0]];
    for (let i = 1; i < points.length; i++) {
        if (Math.abs(points[i][0] - points[i - 1][0]) > 180) { parts.push(current); current = []; }
        current.push(points[i]);
    }
    parts.push(current);

    const kilometres = (Δ * EARTH_RADIUS_M) / 1000;
    return {
        type: 'FeatureCollection',
        features: [{
            type: 'Feature',
            properties: {
                description: 'Shortest path over the ground',
                distanceKm: Number(kilometres.toFixed(1)),
                from, to,
            },
            geometry: parts.length === 1
                ? { type: 'LineString', coordinates: parts[0] }
                : { type: 'MultiLineString', coordinates: parts.filter((p) => p.length > 1) },
        } as GeoJSON.Feature],
    };
}

/** The point on the far side of the Earth, and a line through the middle to it. */
export function antipode(lon: number, lat: number): GeoJSON.FeatureCollection {
    const other: [number, number] = [normalise(lon + 180), -lat];
    return {
        type: 'FeatureCollection',
        features: [
            {
                type: 'Feature',
                properties: { description: 'Here', role: 'origin' },
                geometry: { type: 'Point', coordinates: [lon, lat] },
            },
            {
                type: 'Feature',
                properties: { description: 'Straight through the Earth from here', role: 'antipode' },
                geometry: { type: 'Point', coordinates: other },
            },
        ] as GeoJSON.Feature[],
    };
}

/**
 * Tissot's indicatrix: circles of equal ground radius, spread over the world.
 *
 * Each is a true circle on the Earth, so whatever a projection does to them is
 * exactly what it does to shape and area everywhere else. On an equal-area map
 * they squash but keep their area; on Mercator they stay circular and swell
 * enormously towards the poles — which is the thing every "Greenland is not
 * that big" argument is about, shown rather than asserted.
 */
export function tissotIndicatrix(options: {
    spacingDegrees?: number;
    radiusKm?: number;
} = {}): GeoJSON.FeatureCollection {
    const spacing = Math.min(60, Math.max(10, options.spacingDegrees ?? 30));
    const radiusM = (options.radiusKm ?? 500) * 1000;
    const features: GeoJSON.Feature[] = [];

    for (let lat = -75; lat <= 75; lat += spacing) {
        for (let lon = -180; lon < 180; lon += spacing) {
            const ring: number[][] = [];
            for (let i = 0; i <= 72; i++) ring.push(destination(lon, lat, (i / 72) * 360, radiusM));
            // A circle that would be cut by the seam is left out rather than
            // split: half an indicatrix says nothing about distortion.
            if (ring.some((point, i) => i > 0 && Math.abs(point[0] - ring[i - 1][0]) > 180)) continue;
            features.push({
                type: 'Feature',
                properties: {
                    centre: [lon, lat],
                    radiusKm: radiusM / 1000,
                    description: `${radiusM / 1000} km circle at ${lat}°, ${lon}°`,
                },
                geometry: { type: 'Polygon', coordinates: [ring] },
            } as GeoJSON.Feature);
        }
    }
    return { type: 'FeatureCollection', features };
}
