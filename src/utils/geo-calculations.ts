// src/utils/geo-calculations.ts
// Geodesic calculation utilities for the measure tool

export type LngLat = [number, number]; // [longitude, latitude]

/**
 * Earth's radius in centimeters for internal precision.
 * Using WGS84 mean radius: 6,371,008.8 meters
 */
const EARTH_RADIUS_CM = 637100880;

/**
 * Calculate the Haversine distance between two points.
 * Returns distance in centimeters for maximum precision.
 */
export function haversineDistanceCm(p1: LngLat, p2: LngLat): number {
    const [lon1, lat1] = p1;
    const [lon2, lat2] = p2;

    const toRad = (deg: number) => deg * Math.PI / 180;

    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);

    const a = Math.sin(dLat / 2) ** 2 +
              Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
              Math.sin(dLon / 2) ** 2;

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return EARTH_RADIUS_CM * c;
}

/**
 * Calculate geodesic polygon area using spherical excess formula.
 * Returns area in square meters.
 *
 * Uses the Shoelace formula adapted for spherical coordinates.
 */
export function geodesicAreaM2(ring: LngLat[]): number {
    if (ring.length < 3) return 0;

    const toRad = (deg: number) => deg * Math.PI / 180;
    const EARTH_RADIUS_M = 6371008.8;

    let total = 0;
    const n = ring.length;

    for (let i = 0; i < n; i++) {
        const j = (i + 1) % n;
        const [lon1, lat1] = ring[i];
        const [lon2, lat2] = ring[j];

        total += toRad(lon2 - lon1) *
                 (2 + Math.sin(toRad(lat1)) + Math.sin(toRad(lat2)));
    }

    return Math.abs(total * EARTH_RADIUS_M * EARTH_RADIUS_M / 2);
}

/**
 * Calculate the destination point given a start point, distance and bearing.
 * Uses the spherical earth direct geodesic formula.
 *
 * @param origin Start point
 * @param distanceM Distance in meters
 * @param bearingDeg Bearing in degrees, clockwise from north
 */
export function destinationPoint(origin: LngLat, distanceM: number, bearingDeg: number): LngLat {
    const EARTH_RADIUS_M = 6371008.8;
    const toRad = (deg: number) => deg * Math.PI / 180;
    const toDeg = (rad: number) => rad * 180 / Math.PI;

    const angularDistance = distanceM / EARTH_RADIUS_M;
    const bearing = toRad(bearingDeg);
    const lat1 = toRad(origin[1]);
    const lon1 = toRad(origin[0]);

    const lat2 = Math.asin(
        Math.sin(lat1) * Math.cos(angularDistance) +
        Math.cos(lat1) * Math.sin(angularDistance) * Math.cos(bearing)
    );
    const lon2 = lon1 + Math.atan2(
        Math.sin(bearing) * Math.sin(angularDistance) * Math.cos(lat1),
        Math.cos(angularDistance) - Math.sin(lat1) * Math.sin(lat2)
    );

    return [((toDeg(lon2) + 540) % 360) - 180, toDeg(lat2)];
}

/**
 * Build a closed polygon ring approximating a geodesic circle.
 *
 * @param center Circle center
 * @param radiusM Circle radius in meters
 * @param steps Number of vertices around the circle
 */
export function circlePolygonRing(center: LngLat, radiusM: number, steps = 64): LngLat[] {
    const ring: LngLat[] = [];
    for (let i = 0; i < steps; i++) {
        ring.push(destinationPoint(center, radiusM, (i / steps) * 360));
    }
    ring.push(ring[0]);
    return ring;
}

/**
 * The two systems a measurement can be read in.
 *
 * Metric is the default everywhere, including in the imperial-using world: the
 * data is metric, and a reader who wants feet asks for them.
 */
export type UnitSystem = 'metric' | 'imperial';

/** Exact by definition (international foot/mile), not an approximation. */
const CM_PER_FOOT = 30.48;
const FEET_PER_MILE = 5280;
const M2_PER_ACRE = 4046.8564224;
const ACRES_PER_SQUARE_MILE = 640;

/**
 * Rounds to three significant digits *within a unit*, the way a measurement is
 * read aloud: 1.001 km, 10.01 km, 100.6 km, 1006 km.
 *
 * Shared by both systems because the rule is about how many digits a reader can
 * use, not about which unit they are in — writing it twice is how the imperial
 * ladder ends up one decimal out from the metric one.
 */
function threeSignificant(value: number, unit: string): string {
    if (value < 10) return `${value.toFixed(3)} ${unit}`;
    if (value < 100) return `${value.toFixed(2)} ${unit}`;
    if (value < 1000) return `${value.toFixed(1)} ${unit}`;
    return `${Math.round(value)} ${unit}`;
}

/**
 * Format distance for display.
 *
 * Metric — below 1000 m: metres; above: km with 3 significant digits.
 * Imperial — below a mile: whole feet; above: miles on the same ladder.
 *
 * The unit switches at the point where the smaller one stops being readable,
 * which is a different number in each system (1000 m, 5280 ft) and is why this
 * is not a conversion applied to a metric string.
 *
 * @param distanceCm Distance in centimeters
 * @param system Unit system to read it in; metric unless asked otherwise
 */
export function formatDistance(distanceCm: number, system: UnitSystem = 'metric'): string {
    if (system === 'imperial') {
        const feet = distanceCm / CM_PER_FOOT;
        if (feet < FEET_PER_MILE) return `${Math.round(feet)} ft`;
        return threeSignificant(feet / FEET_PER_MILE, 'mi');
    }

    const meters = distanceCm / 100;
    if (meters < 1000) {
        return `${Math.round(meters)} m`;
    }
    return threeSignificant(meters / 1000, 'km');
}

/**
 * Format area for display.
 *
 * Metric — m² below a hectare's worth of detail, hectares up to 100, then km².
 * Imperial — square feet below an acre, acres below a square mile, then mi².
 *
 * Hectares and acres both exist for the same reason: a garden in m² and a
 * country in km² are both unreadable at field scale.
 *
 * @param areaM2 Area in square meters
 * @param system Unit system to read it in; metric unless asked otherwise
 */
export function formatArea(areaM2: number, system: UnitSystem = 'metric'): string {
    if (system === 'imperial') {
        const acres = areaM2 / M2_PER_ACRE;
        if (acres < 0.1) {
            const squareFeet = areaM2 / (CM_PER_FOOT / 100) ** 2;
            return `${Math.round(squareFeet)} sq ft`;
        }
        if (acres < ACRES_PER_SQUARE_MILE) {
            return acres < 100 ? `${acres.toFixed(2)} acres` : `${Math.round(acres)} acres`;
        }
        return threeSignificant(acres / ACRES_PER_SQUARE_MILE, 'sq mi');
    }

    if (areaM2 < 10000) {
        return `${Math.round(areaM2)} m²`;
    }

    const hectares = areaM2 / 10000;
    if (hectares < 100) {
        return `${hectares.toFixed(2)} ha`;
    }

    return threeSignificant(areaM2 / 1000000, 'km²');
}
