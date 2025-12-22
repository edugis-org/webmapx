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
 * Format distance for display with metric units.
 * - Below 1000m: show meters (e.g., "523 m")
 * - Above 1000m: show km with 3 significant digits
 *   - 1.001 km, 10.01 km, 100.6 km, 1006 km
 *
 * @param distanceCm Distance in centimeters
 */
export function formatDistance(distanceCm: number): string {
    const meters = distanceCm / 100;

    if (meters < 1000) {
        return `${Math.round(meters)} m`;
    }

    const km = meters / 1000;

    // 3 significant digits based on magnitude
    if (km < 10) {
        // 1.001 km to 9.999 km -> 3 decimal places
        return `${km.toFixed(3)} km`;
    } else if (km < 100) {
        // 10.01 km to 99.99 km -> 2 decimal places
        return `${km.toFixed(2)} km`;
    } else if (km < 1000) {
        // 100.6 km to 999.9 km -> 1 decimal place
        return `${km.toFixed(1)} km`;
    } else {
        // 1006 km and above -> no decimals
        return `${Math.round(km)} km`;
    }
}

/**
 * Format area for display with metric units.
 * - Below 10,000 m²: show square meters
 * - Below 1,000,000 m² (100 ha): show hectares
 * - Above: show square kilometers
 *
 * @param areaM2 Area in square meters
 */
export function formatArea(areaM2: number): string {
    if (areaM2 < 10000) {
        return `${Math.round(areaM2)} m²`;
    }

    const hectares = areaM2 / 10000;
    if (hectares < 100) {
        return `${hectares.toFixed(2)} ha`;
    }

    const km2 = areaM2 / 1000000;
    if (km2 < 10) {
        return `${km2.toFixed(3)} km²`;
    } else if (km2 < 100) {
        return `${km2.toFixed(2)} km²`;
    } else {
        return `${km2.toFixed(1)} km²`;
    }
}
