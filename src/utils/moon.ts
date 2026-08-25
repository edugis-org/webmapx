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
import { normaliseLon, splitAtAntimeridian, sphericalCapRings, subsolarPoint } from './solar';

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

/**
 * The moon drawn as the moon: a disc at the sublunar point with the lit part
 * shaded, rather than an icon chosen from a set of eight.
 *
 * Two things make it worth drawing rather than naming. The lit fraction is
 * continuous — "waxing gibbous" covers a quarter of the month — and the *side*
 * that is lit is not a stylistic choice: the moon's lit limb always faces the
 * sun, so the disc is oriented towards the subsolar point and the crescent
 * turns as the month goes by. On a world map that reads directly: the horns
 * point away from the sun, which is exactly what you see if you look up.
 *
 * The terminator — the line between lit and dark — is a circle seen at an
 * angle, so it projects as a half-ellipse whose width is `1 - 2·illumination`
 * times the radius. That number is negative past half moon, which is what turns
 * a crescent into a gibbous shape without a second case to write.
 */
export function moonPhaseDisc(
    date: Date = new Date(),
    options: { radiusDegrees?: number; steps?: number } = {},
): GeoJSON.FeatureCollection {
    const moon = moonPosition(date);
    const sun = subsolarPoint(date);
    const radius = options.radiusDegrees && options.radiusDegrees > 0 ? options.radiusDegrees : 7;
    const steps = options.steps && options.steps > 3 ? options.steps : 96;

    // Which way the sun lies from the moon, as a bearing — the lit side faces it.
    const bearingToSun = initialBearing(moon.lon, moon.lat, sun.lon, sun.lat);

    /**
     * A point on the disc, given in the disc's own frame: `along` runs towards
     * the sun, `across` at right angles to it, both as fractions of the radius.
     */
    const place = (across: number, along: number): [number, number] => {
        const distance = Math.hypot(across, along) * radius;
        if (distance === 0) return [moon.lon, moon.lat];
        const bearing = bearingToSun + Math.atan2(across, along) / DEG;
        return offset(moon.lon, moon.lat, bearing, distance);
    };

    // The half of the rim that faces the sun. It runs between the two points
    // where the terminator meets the rim, which are the ends of the axis at
    // right angles to the sun — the horns of a crescent.
    const litRim: Array<[number, number]> = [];
    for (let i = 0; i <= steps; i++) {
        const angle = -Math.PI / 2 + (i / steps) * Math.PI;
        litRim.push(place(Math.sin(angle), Math.cos(angle)));
    }
    // And back along the terminator, which shares those two endpoints and bows
    // between them. How far, and to which side, is the phase: positive bows into
    // the lit half and leaves a crescent, negative bows into the dark half and
    // leaves a gibbous moon.
    const terminatorWidth = 1 - 2 * moon.illumination;
    const terminator: Array<[number, number]> = [];
    for (let i = 0; i <= steps; i++) {
        const angle = Math.PI / 2 - (i / steps) * Math.PI;
        terminator.push(place(Math.sin(angle), terminatorWidth * Math.cos(angle)));
    }

    const disc = sphericalCapRings(moon.lon, moon.lat, radius);
    const lit = splitAtAntimeridian([...litRim, ...terminator]);

    const properties = {
        phase: Number(moon.phase.toFixed(4)),
        phaseName: phaseName(moon.phase),
        illumination: Number(moon.illumination.toFixed(3)),
        timestamp: date.toISOString(),
    };

    return {
        type: 'FeatureCollection',
        features: [
            {
                type: 'Feature',
                properties: { ...properties, id: 'disc', description: 'The moon' },
                geometry: asPolygon(disc.map((ring) => [ring])),
            },
            {
                type: 'Feature',
                properties: { ...properties, id: 'lit', description: `Lit: ${Math.round(moon.illumination * 100)}%` },
                geometry: asPolygon(lit.map((ring) => [ring])),
            },
        ] as GeoJSON.Feature[],
    };
}

/** One polygon or several, depending on whether the shape met the seam. */
function asPolygon(polygons: number[][][][]): GeoJSON.Polygon | GeoJSON.MultiPolygon {
    return polygons.length === 1
        ? { type: 'Polygon', coordinates: polygons[0] }
        : { type: 'MultiPolygon', coordinates: polygons };
}

/** The bearing to set off on to reach another point by the shortest way. */
function initialBearing(lon1: number, lat1: number, lon2: number, lat2: number): number {
    const dLon = (lon2 - lon1) * DEG;
    const y = Math.sin(dLon) * Math.cos(lat2 * DEG);
    const x = Math.cos(lat1 * DEG) * Math.sin(lat2 * DEG)
        - Math.sin(lat1 * DEG) * Math.cos(lat2 * DEG) * Math.cos(dLon);
    return Math.atan2(y, x) / DEG;
}

/** Where you arrive setting off on a bearing and travelling an angular distance. */
function offset(lon: number, lat: number, bearingDeg: number, distanceDeg: number): [number, number] {
    const d = distanceDeg * DEG;
    const b = bearingDeg * DEG;
    const lat1 = lat * DEG;
    const lat2 = Math.asin(Math.sin(lat1) * Math.cos(d) + Math.cos(lat1) * Math.sin(d) * Math.cos(b));
    const lon2 = lon * DEG + Math.atan2(
        Math.sin(b) * Math.sin(d) * Math.cos(lat1),
        Math.cos(d) - Math.sin(lat1) * Math.sin(lat2),
    );
    return [normaliseLon(lon2 / DEG), lat2 / DEG];
}

/**
 * The track of the sublunar point — where the moon stands overhead — over a
 * month.
 *
 * What it draws is the thing that is hard to see from a moving dot: the moon
 * swings from about 28° north to 28° south and back in 27.2 days, because its
 * orbit is tilted 5.1° to the plane of the Earth's own orbit, which is itself
 * tilted 23.4° to the equator. The two tilts add or partly cancel depending on
 * where the orbit's nodes are, and those turn right round in 18.6 years — so
 * the swing measured here is 28.4° in 2024 and only 18.5° in 2034. Stonehenge
 * and Callanish are aligned on that cycle.
 *
 * Sampled by time rather than by longitude, unlike the sun's track: the moon
 * does not keep pace with the Earth's turn, so equal steps of longitude would
 * be unequal steps of time and the loops would be drawn where they are not.
 */
export function moonPathLines(
    date: Date = new Date(),
    options: { days?: number; stepHours?: number } = {},
): GeoJSON.FeatureCollection {
    const days = options.days && options.days > 0 ? options.days : 27.32;
    const stepHours = options.stepHours && options.stepHours > 0 ? options.stepHours : 1;

    const track: Array<[number, number]> = [];
    const steps = Math.round((days * 24) / stepHours);
    for (let i = 0; i <= steps; i++) {
        const at = new Date(date.getTime() + i * stepHours * 3_600_000);
        const { lon, lat } = moonPosition(at);
        track.push([Number(lon.toFixed(4)), Number(lat.toFixed(4))]);
    }

    const lines = cutLineAtAntimeridian(track);
    const latitudes = track.map(([, lat]) => lat);
    return {
        type: 'FeatureCollection',
        features: [{
            type: 'Feature',
            properties: {
                description: 'Where the moon stands overhead, over the next month',
                days: Number(days.toFixed(2)),
                northernmost: Number(Math.max(...latitudes).toFixed(2)),
                southernmost: Number(Math.min(...latitudes).toFixed(2)),
                timestamp: date.toISOString(),
            },
            geometry: { type: 'MultiLineString', coordinates: lines },
        } as GeoJSON.Feature],
    };
}

/**
 * An open line broken where it crosses ±180, meeting the edge on both sides.
 *
 * The ring version in solar.ts closes each piece; a track has ends and must not
 * be closed, or a month of moon positions comes back as a set of lens shapes.
 */
function cutLineAtAntimeridian(points: Array<[number, number]>): number[][][] {
    const lines: number[][][] = [];
    let current: number[][] = [];
    for (let i = 0; i < points.length; i++) {
        const [lon, lat] = points[i];
        if (i > 0) {
            const [previousLon, previousLat] = points[i - 1];
            if (Math.abs(lon - previousLon) > 180) {
                const edge = previousLon > 0 ? 180 : -180;
                const span = Math.abs(lon - previousLon);
                const share = Math.abs(edge - previousLon) / (360 - span);
                const seamLat = previousLat + (lat - previousLat) * share;
                current.push([edge, seamLat]);
                if (current.length > 1) lines.push(current);
                current = [[-edge, seamLat]];
            }
        }
        current.push([lon, lat]);
    }
    if (current.length > 1) lines.push(current);
    return lines;
}
