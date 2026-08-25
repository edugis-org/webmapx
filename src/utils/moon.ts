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
 * A moon-shaped pair of rings: the whole disc, and the part of it that is lit.
 *
 * Shared by the two ways of drawing a phase — one moon where the moon actually
 * is, and a row of them showing how it hangs at different latitudes — because
 * only the centre and the direction of the lit side differ between them.
 *
 * `litBearing` is a compass bearing on the map. For the real moon that is the
 * bearing to the sun; for a row of little moons it is the angle an observer
 * would see the lit side at, with north standing in for straight up.
 */
function phaseShapes(
    centreLon: number,
    centreLat: number,
    radius: number,
    litBearing: number,
    illumination: number,
    steps: number,
): { disc: number[][][]; lit: number[][][] } {
    /**
     * A point on the disc, given in the disc's own frame: `along` runs towards
     * the lit side, `across` at right angles to it, both as fractions of the
     * radius.
     */
    const place = (across: number, along: number): [number, number] => {
        const distance = Math.hypot(across, along) * radius;
        if (distance === 0) return [centreLon, centreLat];
        return offset(centreLon, centreLat, litBearing + Math.atan2(across, along) / DEG, distance);
    };

    // The half of the rim on the lit side. It runs between the two points where
    // the terminator meets the rim — the horns of a crescent.
    const litRim: Array<[number, number]> = [];
    for (let i = 0; i <= steps; i++) {
        const angle = -Math.PI / 2 + (i / steps) * Math.PI;
        litRim.push(place(Math.sin(angle), Math.cos(angle)));
    }
    // And back along the terminator, which shares those endpoints and bows
    // between them. How far, and to which side, is the phase: positive bows into
    // the lit half and leaves a crescent, negative bows into the dark half and
    // leaves a gibbous moon.
    const terminatorWidth = 1 - 2 * illumination;
    const terminator: Array<[number, number]> = [];
    for (let i = 0; i <= steps; i++) {
        const angle = Math.PI / 2 - (i / steps) * Math.PI;
        terminator.push(place(Math.sin(angle), terminatorWidth * Math.cos(angle)));
    }

    return {
        disc: sphericalCapRings(centreLon, centreLat, radius),
        lit: splitAtAntimeridian([...litRim, ...terminator]),
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
    options: { radiusDegrees?: number; steps?: number; observer?: [number, number] } = {},
): GeoJSON.FeatureCollection {
    const moon = moonPosition(date);
    const sun = subsolarPoint(date);
    const radius = options.radiusDegrees && options.radiusDegrees > 0 ? options.radiusDegrees : 7;
    const steps = options.steps && options.steps > 3 ? options.steps : 96;

    // Two different questions, and only one of them has an answer everywhere.
    //
    // Without an observer this is a *position*: the terminator is drawn along
    // the bearing to the sun over the ground, which is an ordinary direction,
    // and no horizon is drawn — because directly under the moon there is no
    // horizon to measure against. The moon is straight up there, and a point
    // straight up has no compass direction.
    //
    // Given an observer it becomes a *view*: how the crescent hangs over that
    // place, which is a fact about their horizon rather than about the moon.
    const bearingToSun = initialBearing(moon.lon, moon.lat, sun.lon, sun.lat);
    const sky = options.observer ? moonInSkyAt(options.observer[0], options.observer[1], date) : null;
    const { disc, lit } = phaseShapes(
        moon.lon, moon.lat, radius, sky ? sky.tilt : bearingToSun, moon.illumination, steps,
    );

    const observerSunAltitude = options.observer
        ? sunAltitudeAt(options.observer[0], options.observer[1], date)
        : null;
    const properties = {
        phase: Number(moon.phase.toFixed(4)),
        phaseName: phaseName(moon.phase),
        illumination: Number(moon.illumination.toFixed(3)),
        timestamp: date.toISOString(),
        ...(options.observer && sky ? {
            observerLon: Number(options.observer[0].toFixed(3)),
            observerLat: Number(options.observer[1].toFixed(3)),
            tilt: Number(sky.tilt.toFixed(1)),
            altitude: Number(sky.altitude.toFixed(1)),
            sunAltitude: Number((observerSunAltitude ?? 0).toFixed(1)),
            // Drawn, but nobody there can see it: the moon is under their feet.
            belowHorizon: sky.altitude <= 0,
            daylight: (observerSunAltitude ?? 0) >= 0,
            nearZenith: sky.altitude > 80,
        } : {}),
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
            // A horizon only when there is someone whose horizon it is, and a
            // mark on that someone, so the view is tied to the place it belongs
            // to instead of floating over the map.
            ...(options.observer && sky ? [
                {
                    type: 'Feature',
                    properties: { ...properties, id: 'horizon', description: 'The chosen observer\'s horizon' },
                    geometry: {
                        type: 'MultiLineString',
                        coordinates: horizonUnder(moon.lon, moon.lat, radius),
                    },
                } as GeoJSON.Feature,
                {
                    type: 'Feature',
                    properties: {
                        ...properties,
                        id: 'observer',
                        description: sky.altitude <= 0
                            ? 'Seen from here — but the moon is below this horizon'
                            : `Seen from here: ${sky.tilt.toFixed(0)}° from straight up, moon ${sky.altitude.toFixed(0)}° up`,
                    },
                    geometry: { type: 'Point', coordinates: [options.observer[0], options.observer[1]] },
                } as GeoJSON.Feature,
            ] : []),
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

/**
 * How the moon hangs in the sky, seen from a place: the angle of the line
 * between the horns, and how high the moon stands.
 *
 * The lit side always faces the sun — that much is fixed. What changes from
 * place to place is where the sun *is* relative to the observer's horizon. In
 * the tropics the path of the sun and moon meets the horizon steeply, so a
 * young moon has the sun almost directly below it and the horns point straight
 * up: the "boat moon". At 52° north that path lies at a shallow angle, the sun
 * sits off to one side, and the same crescent stands on its edge.
 *
 * `tilt` is the direction of the lit side measured from straight up, clockwise
 * *as the observer sees it*: 90° puts the lit side to their right, 180° at the
 * ground with the horns level, 270° to their left.
 */
export function moonInSkyAt(lon: number, lat: number, date: Date = new Date()): {
    tilt: number;
    altitude: number;
    illumination: number;
} {
    const moon = moonPosition(date);
    const sun = subsolarPoint(date);

    // The position angle of the bright limb, measured from celestial north.
    const dRightAscension = (sun.lon - moon.lon) * DEG;
    const brightLimb = Math.atan2(
        Math.cos(sun.lat * DEG) * Math.sin(dRightAscension),
        Math.sin(sun.lat * DEG) * Math.cos(moon.lat * DEG)
            - Math.cos(sun.lat * DEG) * Math.sin(moon.lat * DEG) * Math.cos(dRightAscension),
    );
    // The parallactic angle: how far celestial north is from straight up, here.
    // Subtracting it is what turns a fact about the sky into a fact about a view
    // of the sky, and is the whole difference between the tropics and Europe.
    const hourAngle = (lon - moon.lon) * DEG;
    const parallactic = Math.atan2(
        Math.sin(hourAngle),
        Math.tan(lat * DEG) * Math.cos(moon.lat * DEG) - Math.sin(moon.lat * DEG) * Math.cos(hourAngle),
    );
    const altitude = Math.asin(
        Math.sin(lat * DEG) * Math.sin(moon.lat * DEG)
        + Math.cos(lat * DEG) * Math.cos(moon.lat * DEG) * Math.cos(hourAngle),
    ) / DEG;

    // Mirrored on purpose, and this is the one sign that cannot be reasoned
    // about from the formulas alone.
    //
    // A position angle is measured from north towards east — but *on the sky*,
    // which is looked at from the inside, so east lies anticlockwise. A compass
    // bearing is also measured from north towards east, on the ground, seen
    // from above, where east lies clockwise. The two conventions have the same
    // words and opposite handedness, so drawing a sky angle as a bearing turns
    // the moon into its own mirror image. Checked against the sky over
    // Amsterdam on 26 August 2026 with the moon 96% lit: unmirrored puts the
    // dark sliver top right, and it is top left, as timeanddate.com also shows.
    //
    // Straight overhead the parallactic angle is undefined — the atan2 lands on
    // 0 or 180 depending on which side of nothing the rounding falls — and the
    // honest answer there is the bearing to the sun over the ground, a real
    // direction, which is also what the moon marker uses when nobody is looking.
    const tilt = altitude > 89.9
        ? initialBearing(lon, lat, sun.lon, sun.lat)
        : (parallactic - brightLimb) / DEG;

    return {
        tilt: ((tilt % 360) + 360) % 360,
        altitude,
        illumination: moon.illumination,
    };
}

/**
 * A row of little moons down one meridian, each turned the way an observer at
 * that latitude sees it.
 *
 * The map cannot show this by itself: the moon it draws is turned towards the
 * sun as seen from the centre of the Earth, which is right for a world map and
 * says nothing about how the crescent hangs over anyone's street. Here each
 * moon is drawn with north standing in for straight up, so the row reads as a
 * set of views rather than as positions.
 *
 * Latitudes where the moon is below the horizon are left out — there is nothing
 * to see there, and drawing one anyway would invite the reader to compare a
 * view with something nobody can look at.
 */
export function moonAlongMeridian(
    date: Date = new Date(),
    options: {
        lon?: number;
        fromLat?: number;
        toLat?: number;
        stepLat?: number;
        radiusDegrees?: number;
        steps?: number;
    } = {},
): GeoJSON.FeatureCollection {
    const moon = moonPosition(date);
    const fromLat = options.fromLat ?? -60;
    const toLat = options.toLat ?? 60;
    const stepLat = options.stepLat && options.stepLat > 0 ? options.stepLat : 15;
    const chosen = options.lon === undefined
        ? chooseMeridian(date, fromLat, toLat, stepLat)
        : { lon: options.lon, daylight: false };
    const lon = chosen.lon;
    const radius = options.radiusDegrees && options.radiusDegrees > 0 ? options.radiusDegrees : 4;
    const steps = options.steps && options.steps > 3 ? options.steps : 64;

    const features: GeoJSON.Feature[] = [];
    for (let lat = fromLat; lat <= toLat + 1e-9; lat += stepLat) {
        const sky = moonInSkyAt(lon, lat, date);
        if (sky.altitude <= 0) continue;
        const { disc, lit } = phaseShapes(lon, lat, radius, sky.tilt, sky.illumination, steps);
        const sunAltitude = sunAltitudeAt(lon, lat, date);
        const properties = {
            latitude: Number(lat.toFixed(2)),
            longitude: Number(lon.toFixed(2)),
            tilt: Number(sky.tilt.toFixed(1)),
            altitude: Number(sky.altitude.toFixed(1)),
            sunAltitude: Number(sunAltitude.toFixed(1)),
            // Up, but in a bright sky: a daytime moon, and worth saying so.
            daylight: sunAltitude >= 0,
            // Nearly overhead, where "which way is up" stops meaning much: the
            // zenith has no azimuth, so a step of one degree can turn the
            // crescent by 180°. The angle drawn is right for the exact spot and
            // says nothing about the neighbourhood, which is worth flagging
            // rather than leaving a reader to wonder why two moons a few
            // degrees apart disagree so wildly.
            nearZenith: sky.altitude > 80,
            illumination: Number(sky.illumination.toFixed(3)),
            phaseName: phaseName(moon.phase),
            timestamp: date.toISOString(),
        };
        features.push({
            type: 'Feature',
            properties: { ...properties, id: 'disc', description: `As seen from ${Math.abs(lat).toFixed(0)}°${lat < 0 ? 'S' : 'N'}` },
            geometry: asPolygon(disc.map((ring) => [ring])),
        } as GeoJSON.Feature);
        features.push({
            type: 'Feature',
            properties: { ...properties, id: 'lit', description: `Lit side ${sky.tilt.toFixed(0)}° from straight up` },
            geometry: asPolygon(lit.map((ring) => [ring])),
        } as GeoJSON.Feature);
        // A horizon under each one, because these are views and the moon drawn
        // at the sublunar point is a position. Both are right and they disagree
        // by the parallactic angle, which is tens of degrees — without
        // something to say "this one is a view, and this way is up", the two
        // layers look on the same map as though one of them is wrong.
        features.push({
            type: 'Feature',
            properties: { ...properties, id: 'horizon', description: 'The observer\'s horizon' },
            geometry: { type: 'MultiLineString', coordinates: horizonUnder(lon, lat, radius) },
        } as GeoJSON.Feature);
    }
    return { type: 'FeatureCollection', features };
}

/** The sun's height above the horizon at a place, in degrees. */
function sunAltitudeAt(lon: number, lat: number, date: Date): number {
    const sun = subsolarPoint(date);
    const hourAngle = (lon - sun.lon) * DEG;
    return Math.asin(
        Math.sin(lat * DEG) * Math.sin(sun.lat * DEG)
        + Math.cos(lat * DEG) * Math.cos(sun.lat * DEG) * Math.cos(hourAngle),
    ) / DEG;
}

/**
 * Which meridian to draw the row on.
 *
 * Three things are wanted at once and cannot always be had: the moon above the
 * horizon, a sky dark enough to see it in, and a line that stays where the eye
 * expects it — along the evening terminator, because that is when a crescent is
 * looked at.
 *
 * So every meridian is scored by how many of the sampled latitudes have the
 * moon up *and* the sun down, and the best is taken, ties going to the meridian
 * nearest dusk. Near new moon no meridian scores at all — the moon is only ever
 * up in daylight then, which is a fact about the month rather than a failure —
 * and the row falls back to wherever the moon is at least up, flagged as
 * daylight so a config can draw it faintly and a reader is not told they could
 * go and look at it.
 */
function chooseMeridian(
    date: Date,
    fromLat: number,
    toLat: number,
    stepLat: number,
): { lon: number; daylight: boolean } {
    const evening = normaliseLon(subsolarPoint(date).lon + 90);

    let best = { lon: evening, dark: -1, up: -1, fromDusk: 0 };
    for (let offset = -180; offset < 180; offset += 15) {
        const lon = normaliseLon(evening + offset);
        let dark = 0;
        let up = 0;
        for (let lat = fromLat; lat <= toLat + 1e-9; lat += stepLat) {
            if (moonInSkyAt(lon, lat, date).altitude <= 0) continue;
            up += 1;
            if (sunAltitudeAt(lon, lat, date) < 0) dark += 1;
        }
        const fromDusk = Math.abs(offset);
        const better = dark !== best.dark ? dark > best.dark
            : up !== best.up ? up > best.up
            : fromDusk < best.fromDusk;
        if (better) best = { lon, dark, up, fromDusk };
    }

    return { lon: best.lon, daylight: best.dark === 0 };
}

/**
 * The little horizon line drawn under a moon that is somebody's view.
 *
 * Cut at ±180 like everything else on a world map: a two-point line whose ends
 * fall either side of the seam is otherwise drawn the long way round, straight
 * across the whole world.
 */
function horizonUnder(lon: number, lat: number, radius: number): number[][][] {
    const below = offset(lon, lat, 180, radius * 1.45);
    return cutLineAtAntimeridian([
        offset(below[0], below[1], 270, radius * 1.3),
        offset(below[0], below[1], 90, radius * 1.3),
    ]);
}
