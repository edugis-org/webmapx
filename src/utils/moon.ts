/**
 * Where the moon is over the Earth, and which half of the world can see it lit.
 *
 * The lunar orbit is far messier than the Earth's: the moon is pulled about by
 * the sun enough that a two-term series is useless. This is the standard
 * low-precision set (Meeus, chapter 47, principal terms), good to roughly a
 * tenth of a degree — well inside what a map at world scale can show, and the
 * same order as the sun code beside it.
 *
 * The sublunar point is worth drawing for the same reason as the subsolar one:
 * it explains the tides, and it moves visibly while you watch.
 */
import { normaliseLon, sphericalCapRings, subsolarPoint } from './solar';

const DEG = Math.PI / 180;

function julianCenturies(date: Date): number {
    return (date.getTime() / 86_400_000 + 2440587.5 - 2451545) / 36525;
}

export interface MoonPosition {
    /** Longitude the moon stands over, degrees east. */
    lon: number;
    /** Latitude the moon stands over. */
    lat: number;
    /** 0 = new, 0.5 = full, approaching 1 = old. */
    phase: number;
    /** How much of the disc is lit, 0 to 1. */
    illumination: number;
    /** Distance in kilometres, which is why some full moons look bigger. */
    distanceKm: number;
}

/** Greenwich mean sidereal time in degrees — how far the Earth has turned. */
function siderealTime(date: Date, t: number): number {
    const julianDay = date.getTime() / 86_400_000 + 2440587.5;
    return (280.46061837 + 360.98564736629 * (julianDay - 2451545) + 0.000387933 * t * t) % 360;
}

export function moonPosition(date: Date = new Date()): MoonPosition {
    const t = julianCenturies(date);

    // Mean elements.
    const L = 218.316 + 481267.8813 * t;             // mean longitude
    const M = (134.963 + 477198.8676 * t) * DEG;     // mean anomaly
    const F = (93.272 + 483202.0175 * t) * DEG;      // argument of latitude
    const D = (297.8502 + 445267.1115 * t) * DEG;    // mean elongation from the sun

    // Principal periodic terms: evection, variation and the rest of the moon's
    // bad behaviour. Fewer than this and the position is degrees out.
    const longitude = (L
        + 6.289 * Math.sin(M)
        - 1.274 * Math.sin(M - 2 * D)
        + 0.658 * Math.sin(2 * D)
        + 0.214 * Math.sin(2 * M)
        - 0.186 * Math.sin((357.5291 + 35999.0503 * t) * DEG)
        - 0.114 * Math.sin(2 * F)) * DEG;
    const latitude = (5.128 * Math.sin(F)
        + 0.281 * Math.sin(M + F)
        - 0.278 * Math.sin(F - M)
        - 0.173 * Math.sin(F - 2 * D)) * DEG;
    const distanceKm = 385_001
        - 20_905 * Math.cos(M)
        - 3_699 * Math.cos(2 * D - M)
        - 2_956 * Math.cos(2 * D)
        - 570 * Math.cos(2 * M);

    // Ecliptic to equatorial, then to the point on the ground.
    const obliquity = 23.4393 * DEG;
    const declination = Math.asin(
        Math.sin(latitude) * Math.cos(obliquity)
        + Math.cos(latitude) * Math.sin(obliquity) * Math.sin(longitude),
    );
    const rightAscension = Math.atan2(
        Math.sin(longitude) * Math.cos(obliquity) - Math.tan(latitude) * Math.sin(obliquity),
        Math.cos(longitude),
    );
    const lon = normaliseLon(rightAscension / DEG - siderealTime(date, t));

    // Phase from the elongation of the moon from the sun.
    const sun = subsolarPoint(date);
    const elongation = normaliseLon(longitude / DEG - (sun.lon + 180)) * DEG;
    const illumination = (1 - Math.cos(D * 2 === 0 ? elongation : D)) / 2;
    const phase = (((D / DEG) % 360 + 360) % 360) / 360;

    return {
        lon,
        lat: declination / DEG,
        phase,
        illumination: Math.min(1, Math.max(0, illumination)),
        distanceKm: Math.round(distanceKm),
    };
}

/** A name for a phase, because "0.74" tells a student nothing. */
export function phaseName(phase: number): string {
    const eighth = Math.round(phase * 8) % 8;
    return [
        'New moon', 'Waxing crescent', 'First quarter', 'Waxing gibbous',
        'Full moon', 'Waning gibbous', 'Last quarter', 'Waning crescent',
    ][eighth];
}

/** The point the moon stands over, with its phase and distance. */
export function moonPositionFeature(date: Date = new Date()): GeoJSON.FeatureCollection {
    const moon = moonPosition(date);
    return {
        type: 'FeatureCollection',
        features: [{
            type: 'Feature',
            properties: {
                description: 'Sublunar point',
                phase: Number(moon.phase.toFixed(4)),
                phaseName: phaseName(moon.phase),
                illumination: Number(moon.illumination.toFixed(3)),
                distanceKm: moon.distanceKm,
                timestamp: date.toISOString(),
            },
            geometry: { type: 'Point', coordinates: [Number(moon.lon.toFixed(5)), Number(moon.lat.toFixed(5))] },
        } as GeoJSON.Feature],
    };
}

/**
 * The half of the Earth the moon is above the horizon for.
 *
 * The same spherical cap the day/night bands use, centred on the sublunar point
 * — the moon is up wherever it is less than 90° away. Where that overlaps the
 * night side is where anyone can actually see it.
 */
export function moonVisibilityBand(date: Date = new Date()): GeoJSON.FeatureCollection {
    const moon = moonPosition(date);
    const rings = sphericalCapRings(moon.lon, moon.lat, 90);
    const polygons = rings.map((ring) => [ring]);
    return {
        type: 'FeatureCollection',
        features: [{
            type: 'Feature',
            properties: {
                description: 'The moon is above the horizon here',
                phaseName: phaseName(moon.phase),
                illumination: Number(moon.illumination.toFixed(3)),
                timestamp: date.toISOString(),
            },
            geometry: polygons.length === 1
                ? { type: 'Polygon', coordinates: polygons[0] }
                : { type: 'MultiPolygon', coordinates: polygons },
        } as GeoJSON.Feature],
    };
}
