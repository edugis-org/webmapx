/**
 * Where the sun is, and which part of the earth it lights.
 *
 * Everything here is pure arithmetic on a date: no service, no network, no
 * data file. The day/night bands a map draws are the same shape every day —
 * circles around the point the sun is overhead — so fetching them from a
 * server is fetching something the browser can work out in a millisecond, and
 * it is the fetch that makes them wrong: a service answers for the moment it
 * was asked, and the bands then sit still while time moves on.
 *
 * The astronomy is the NOAA solar position algorithm, good to about half a
 * minute of arc for the years a map cares about — far inside the width of the
 * line a twilight band is drawn with.
 */

const DEG = Math.PI / 180;

/** Sun altitudes, in degrees, that separate day from the three twilights. */
export const SOLAR_ALTITUDES = {
    /** The sun's upper limb at the horizon, refraction included. */
    sunset: -0.833,
    civil: -6,
    nautical: -12,
    astronomical: -18,
} as const;

export interface SubsolarPoint {
    /** Longitude where the sun is overhead, degrees east. */
    lon: number;
    /** Latitude where the sun is overhead — the sun's declination. */
    lat: number;
    /** Declination in degrees, the same number as `lat`, named for what it is. */
    declination: number;
    /** Minutes by which apparent solar time runs ahead of mean solar time. */
    equationOfTime: number;
}

/** Days since the J2000.0 epoch, the zero point the formulas below are written for. */
function julianCenturies(date: Date): number {
    const julianDay = date.getTime() / 86_400_000 + 2440587.5;
    return (julianDay - 2451545) / 36525;
}

/**
 * The point the sun is directly overhead, and the equation of time with it.
 *
 * The equation of time is not a detail: it moves apparent noon by up to a
 * quarter of an hour over the year, which is four degrees of longitude — a
 * terminator drawn without it is visibly in the wrong place for most of
 * November and February.
 */
export function subsolarPoint(date: Date = new Date()): SubsolarPoint {
    const t = julianCenturies(date);

    const meanLongitude = (280.46646 + t * (36000.76983 + t * 0.0003032)) % 360;
    const meanAnomaly = 357.52911 + t * (35999.05029 - 0.0001537 * t);
    const eccentricity = 0.016708634 - t * (0.000042037 + 0.0000001267 * t);

    const centre = Math.sin(meanAnomaly * DEG) * (1.914602 - t * (0.004817 + 0.000014 * t))
        + Math.sin(2 * meanAnomaly * DEG) * (0.019993 - 0.000101 * t)
        + Math.sin(3 * meanAnomaly * DEG) * 0.000289;
    const trueLongitude = meanLongitude + centre;

    // The apparent longitude accounts for nutation and aberration.
    const omega = 125.04 - 1934.136 * t;
    const apparentLongitude = trueLongitude - 0.00569 - 0.00478 * Math.sin(omega * DEG);

    const meanObliquity = 23 + (26 + (21.448 - t * (46.815 + t * (0.00059 - t * 0.001813))) / 60) / 60;
    const obliquity = meanObliquity + 0.00256 * Math.cos(omega * DEG);

    const declination = Math.asin(Math.sin(obliquity * DEG) * Math.sin(apparentLongitude * DEG)) / DEG;

    const y = Math.tan(obliquity * DEG / 2) ** 2;
    const equationOfTime = 4 * (
        y * Math.sin(2 * meanLongitude * DEG)
        - 2 * eccentricity * Math.sin(meanAnomaly * DEG)
        + 4 * eccentricity * y * Math.sin(meanAnomaly * DEG) * Math.cos(2 * meanLongitude * DEG)
        - 0.5 * y * y * Math.sin(4 * meanLongitude * DEG)
        - 1.25 * eccentricity * eccentricity * Math.sin(2 * meanAnomaly * DEG)
    ) / DEG;

    const utcMinutes = date.getUTCHours() * 60 + date.getUTCMinutes()
        + date.getUTCSeconds() / 60 + date.getUTCMilliseconds() / 60000;
    // Solar noon is where apparent solar time is 12:00; every minute of it is a
    // quarter degree of longitude.
    const lon = normaliseLon(-(utcMinutes + equationOfTime - 720) / 4);

    return { lon, lat: declination, declination, equationOfTime };
}

/** The sun's altitude, in degrees, at one place and moment. */
export function solarAltitude(lon: number, lat: number, date: Date = new Date()): number {
    const sun = subsolarPoint(date);
    return 90 - angularDistance(sun.lon, sun.lat, lon, lat);
}

/** Great-circle distance in degrees. */
export function angularDistance(lonA: number, latA: number, lonB: number, latB: number): number {
    const [φ1, φ2] = [latA * DEG, latB * DEG];
    const Δλ = (lonB - lonA) * DEG;
    const cosine = Math.sin(φ1) * Math.sin(φ2) + Math.cos(φ1) * Math.cos(φ2) * Math.cos(Δλ);
    return Math.acos(Math.min(1, Math.max(-1, cosine))) / DEG;
}

export function normaliseLon(lon: number): number {
    const wrapped = ((lon + 180) % 360 + 360) % 360 - 180;
    return wrapped === -180 ? 180 : wrapped;
}

/**
 * The ring of points at a fixed angular distance from a centre, as GeoJSON
 * rings in lon/lat.
 *
 * This is where a naive terminator goes wrong, and the reason the service-drawn
 * ones look the way they do: a circle on a sphere is not a circle on a
 * lon/lat plot. It may enclose a pole, in which case the ring has to be closed
 * *along* the pole rather than across it, and it may cross the antimeridian,
 * in which case it has to be cut there or it will be drawn the long way round
 * the world.
 */
export function sphericalCapRings(
    centreLon: number,
    centreLat: number,
    radiusDeg: number,
    steps = 720,
): number[][][] {
    const φ0 = centreLat * DEG;
    const ρ = radiusDeg * DEG;
    const points: Array<[number, number]> = [];

    for (let i = 0; i <= steps; i++) {
        const bearing = (i / steps) * 2 * Math.PI;
        const sinLat = Math.sin(φ0) * Math.cos(ρ) + Math.cos(φ0) * Math.sin(ρ) * Math.cos(bearing);
        const lat = Math.asin(Math.min(1, Math.max(-1, sinLat)));
        const lon = centreLon * DEG + Math.atan2(
            Math.sin(bearing) * Math.sin(ρ) * Math.cos(φ0),
            Math.cos(ρ) - Math.sin(φ0) * Math.sin(lat),
        );
        points.push([lon / DEG, lat / DEG]);
    }

    // A cap encloses a pole exactly when the pole is nearer to the centre than
    // the cap's own edge.
    const enclosesNorth = 90 - centreLat < radiusDeg;
    const enclosesSouth = 90 + centreLat < radiusDeg;
    if (enclosesNorth || enclosesSouth) return [aroundPole(points, enclosesNorth ? 90 : -90)];
    return splitAtAntimeridian(points);
}

/**
 * A ring that goes round a pole, closed along the pole itself.
 *
 * Walked in order the points march steadily east or west and never close, so
 * the ring is cut at the antimeridian and joined by two meridian segments up
 * to the pole and back — which is what a map expects, and what the Esri data
 * does not do: theirs stops at ±85 and leaves the cap open.
 */
function aroundPole(points: Array<[number, number]>, pole: 90 | -90): number[][] {
    const unwrapped = unwrapLongitudes(points);
    const ring: number[][] = unwrapped.map(([lon, lat]) => [normaliseLon(lon), lat]);
    // Sorting by longitude turns the walk into a west-to-east sweep, which is
    // the only order in which the pole can be closed over without self-crossing.
    ring.sort((a, b) => a[0] - b[0]);
    const closed: number[][] = [[-180, ring[0][1]], ...ring, [180, ring[ring.length - 1][1]]];
    closed.push([180, pole], [-180, pole], [-180, closed[0][1]]);
    return closed;
}

/** Longitudes made continuous, so a ring can be reasoned about without wrapping. */
function unwrapLongitudes(points: Array<[number, number]>): Array<[number, number]> {
    const out: Array<[number, number]> = [];
    let offset = 0;
    for (let i = 0; i < points.length; i++) {
        if (i > 0) {
            const step = points[i][0] - points[i - 1][0];
            if (step > 180) offset -= 360;
            else if (step < -180) offset += 360;
        }
        out.push([points[i][0] + offset, points[i][1]]);
    }
    return out;
}

/**
 * A ring cut where it crosses ±180.
 *
 * Cutting rather than leaving it whole: a polygon whose points jump from 179
 * to -179 is drawn straight across the map, which is the stripe that appears
 * over the Pacific in the service's own data.
 */
function splitAtAntimeridian(raw: Array<[number, number]>): number[][][] {
    // Normalised first: the generator walks longitudes continuously, so a ring
    // around the antimeridian runs 160 → 200 and never appears to cross
    // anything until it is folded back into range.
    const normalised: Array<[number, number]> = raw.map(([lon, lat]) => [normaliseLon(lon), lat]);
    // Rotated to begin just after a crossing. A ring that starts in the middle
    // of a piece leaves its first and last stretches as two fragments of one
    // piece — three parts where there are two.
    const closed = normalised.length > 1
        && normalised[0][0] === normalised[normalised.length - 1][0]
        && normalised[0][1] === normalised[normalised.length - 1][1];
    const loop = closed ? normalised.slice(0, -1) : normalised;
    let start = 0;
    for (let i = 1; i < loop.length; i++) {
        if (Math.abs(loop[i][0] - loop[i - 1][0]) > 180) { start = i; break; }
    }
    const points = start === 0 ? loop : [...loop.slice(start), ...loop.slice(0, start)];
    const parts: number[][][] = [];
    let current: number[][] = [];
    for (let i = 0; i < points.length; i++) {
        const [lon, lat] = points[i];
        if (i > 0) {
            const previous = points[i - 1];
            if (Math.abs(lon - previous[0]) > 180) {
                // Meet the edge on both sides, interpolating the latitude so the
                // two halves join at the same point on the seam.
                const edge = previous[0] > 0 ? 180 : -180;
                const span = Math.abs(lon - previous[0]);
                const share = Math.abs(edge - previous[0]) / (360 - span);
                const seamLat = previous[1] + (lat - previous[1]) * share;
                current.push([edge, seamLat]);
                parts.push(closeRing(current));
                current = [[-edge, seamLat]];
            }
        }
        current.push([normaliseLon(lon), lat]);
    }
    if (current.length > 2) parts.push(closeRing(current));

    // Two halves of one ring are still one ring where they were cut: joining
    // them back up along the seam is what keeps each half a closed polygon.
    return parts.length > 0 ? parts : [closeRing(points.map(([lon, lat]) => [normaliseLon(lon), lat]))];
}

/** Ray casting, for deciding which piece of a cut ring a hole belongs to. */
function ringContains(ring: number[][], point: number[]): boolean {
    const [x, y] = point;
    let inside = false;
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
        const [xi, yi] = ring[i];
        const [xj, yj] = ring[j];
        if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
    }
    return inside;
}

function closeRing(ring: number[][]): number[][] {
    const first = ring[0];
    const last = ring[ring.length - 1];
    if (first[0] !== last[0] || first[1] !== last[1]) ring.push([first[0], first[1]]);
    return ring;
}

export interface DaylightBand {
    /** `night`, `astronomical`, `nautical`, `civil`. */
    id: string;
    description: string;
    /** The sun altitude range this band covers, in degrees. */
    from: number;
    to: number;
}

export const DAYLIGHT_BANDS: DaylightBand[] = [
    { id: 'civil', description: 'Civil twilight', from: SOLAR_ALTITUDES.sunset, to: SOLAR_ALTITUDES.civil },
    { id: 'nautical', description: 'Nautical twilight', from: SOLAR_ALTITUDES.civil, to: SOLAR_ALTITUDES.nautical },
    { id: 'astronomical', description: 'Astronomical twilight', from: SOLAR_ALTITUDES.nautical, to: SOLAR_ALTITUDES.astronomical },
    { id: 'night', description: 'Night', from: SOLAR_ALTITUDES.astronomical, to: -90 },
];

/**
 * The night and twilight bands for a moment, as GeoJSON.
 *
 * Each band is the ring between two circles centred on the *antisolar* point —
 * the place it is midnight — which is what makes them simple caps rather than
 * the inside-out circles a subsolar centre would give. The night cap is drawn
 * first and each twilight ring outside it, so a map can paint them in order
 * without any of them needing a hole.
 */
export function daylightBands(date: Date = new Date()): GeoJSON.FeatureCollection {
    const sun = subsolarPoint(date);
    const antiLon = normaliseLon(sun.lon + 180);
    const antiLat = -sun.lat;

    const features: GeoJSON.Feature[] = DAYLIGHT_BANDS.map((band) => {
        // Distance from the *antisolar* point and sun altitude are the same
        // number: at D degrees from midnight the sun stands D - 90 above the
        // horizon. So a band from altitude `from` (the lighter edge, nearer the
        // day side) down to `to` is the ring between radii 90 + from and
        // 90 + to — the first of which is the larger, the outer one.
        const outer = 90 + band.from;
        const inner = 90 + band.to;
        const rings = sphericalCapRings(antiLon, antiLat, Math.max(outer, 0));
        const holes = inner <= 0 ? [] : sphericalCapRings(antiLon, antiLat, inner);

        // Rings and holes are both simple caps here, so a band is the outer cap
        // with the inner one as a hole — except night, which has no hole.
        const polygons: number[][][][] = rings.map((ring) => [ring]);
        // A hole only belongs to the piece that contains it; when either side
        // has been cut at the seam they are separate polygons and the hole is
        // carried by whichever outer ring encloses it.
        for (const hole of holes) {
            const owner = polygons.find((rings2) => ringContains(rings2[0], hole[0]));
            if (owner) owner.push(hole.slice().reverse());
        }

        return {
            type: 'Feature',
            properties: {
                id: band.id,
                description: band.description,
                from: band.from,
                to: band.to,
                timestamp: date.toISOString(),
            },
            geometry: polygons.length === 1
                ? { type: 'Polygon', coordinates: polygons[0] }
                : { type: 'MultiPolygon', coordinates: polygons },
        } as GeoJSON.Feature;
    });

    return { type: 'FeatureCollection', features };
}

/** The sun's position as a point feature: where it is overhead right now. */
export function sunPositionFeature(date: Date = new Date()): GeoJSON.FeatureCollection {
    const sun = subsolarPoint(date);
    return {
        type: 'FeatureCollection',
        features: [{
            type: 'Feature',
            properties: {
                description: 'Subsolar point',
                declination: Number(sun.declination.toFixed(4)),
                equationOfTime: Number(sun.equationOfTime.toFixed(3)),
                timestamp: date.toISOString(),
            },
            geometry: { type: 'Point', coordinates: [Number(sun.lon.toFixed(5)), Number(sun.lat.toFixed(5))] },
        }],
    };
}

/**
 * The track the subsolar point takes on one day: a line right round the world.
 *
 * Sampled by *longitude* rather than by time, which is what makes each line run
 * cleanly from one edge of the map to the other. Walking the day in equal steps
 * of time gives the same curve but starting wherever the day happened to begin,
 * so every line would need cutting at the antimeridian and half of them would
 * arrive in two pieces.
 *
 * The inverse is the same relation `subsolarPoint` uses, read the other way: the
 * sun stands over longitude λ when apparent solar time there is noon. The
 * equation of time depends on the moment, so the moment is solved for twice —
 * one pass is enough for a tenth of a degree, two for far below what a line
 * width can show.
 */
export function subsolarTimeAtLongitude(dayStartUtc: number, lon: number): Date {
    let minutes = 720 - 4 * lon;
    for (let pass = 0; pass < 2; pass++) {
        const guess = new Date(dayStartUtc + minutes * 60_000);
        minutes = 720 - 4 * lon - subsolarPoint(guess).equationOfTime;
    }
    return new Date(dayStartUtc + minutes * 60_000);
}

/**
 * The solstice at or before a moment, and the one after it.
 *
 * Found by looking for the day the declination turns, rather than by naming
 * dates: a solstice wanders over more than a day across the calendar, and a
 * fixed 21 June would put the turn in the wrong place in most years.
 *
 * Searched by walking days, and deliberately not year-scoped: the half-cycle a
 * date sits in usually straddles New Year (21 December to 21 June).
 */
function surroundingSolstices(at: Date): { start: number; end: number } {
    const noonOf = (ms: number) => Math.floor(ms / 86_400_000) * 86_400_000 + 43_200_000;
    const declinationOn = (dayMs: number) => subsolarPoint(new Date(noonOf(dayMs))).declination;

    // A turn is where yesterday and tomorrow lie on the same side of today.
    const isTurn = (dayMs: number) => {
        const before = declinationOn(dayMs - 86_400_000);
        const here = declinationOn(dayMs);
        const after = declinationOn(dayMs + 86_400_000);
        return (here >= before && here >= after) || (here <= before && here <= after);
    };

    const today = noonOf(at.getTime());
    let start = today;
    for (let back = 0; back <= 200; back++) {
        const day = today - back * 86_400_000;
        if (isTurn(day)) { start = day; break; }
    }
    let end = start + 183 * 86_400_000;
    for (let forward = 150; forward <= 200; forward++) {
        const day = start + forward * 86_400_000;
        if (isTurn(day)) { end = day; break; }
    }
    return { start, end };
}

/**
 * The sun's daily tracks, one line per day, from one tropic to the other.
 *
 * Half a year is the whole picture: between two solstices the sun works its way
 * from one tropic to the other, and the following half retraces exactly the same
 * latitudes on the way back. Drawing all 365 doubles the size and the ink for
 * nothing — every line lands on top of one already there.
 *
 * The half drawn is the one being travelled *now*, so today's track is always
 * among the lines and the sweep runs the way the sun is actually going: from
 * the December solstice it climbs to the Tropic of Cancer, from the June
 * solstice it falls back to Capricorn. That window straddles New Year for half
 * the year, which is why nothing here is scoped to a calendar year.
 *
 * The lines crowd together at the solstices, where the declination turns and
 * barely moves for weeks, and spread furthest at the equinox, when the sun
 * crosses the equator fastest. That spacing *is* the seasons, in one frame.
 */
export function sunPathLines(
    at: Date = new Date(),
    options: { stepDegrees?: number; span?: 'solstice-to-solstice' | 'year' } = {},
): GeoJSON.FeatureCollection {
    // Two degrees of longitude is eight minutes of the sun's travel: finer than
    // that adds points a map cannot show, coarser starts to cut the corners of
    // the curve near the solstices.
    const step = Math.min(30, Math.max(0.5, options.stepDegrees ?? 2));
    const features: GeoJSON.Feature[] = [];
    const year = at.getUTCFullYear();
    const solstices = surroundingSolstices(at);
    const firstMs = options.span === 'year' ? Date.UTC(year, 0, 1) : solstices.start - 43_200_000;
    const lastMs = options.span === 'year'
        ? Date.UTC(year + 1, 0, 1) - 86_400_000
        : solstices.end - 43_200_000;
    const dayCount = Math.round((lastMs - firstMs) / 86_400_000) + 1;

    for (let day = 0; day < dayCount; day++) {
        const dayStart = firstMs + day * 86_400_000;
        const coordinates: number[][] = [];
        for (let lon = -180; lon <= 180; lon += step) {
            const at = subsolarTimeAtLongitude(dayStart, lon);
            coordinates.push([Number(lon.toFixed(4)), Number(subsolarPoint(at).lat.toFixed(5))]);
        }
        const noon = new Date(dayStart + 43_200_000);
        const declination = subsolarPoint(noon).declination;
        features.push({
            type: 'Feature',
            properties: {
                date: noon.toISOString().slice(0, 10),
                month: noon.getUTCMonth() + 1,
                declination: Number(declination.toFixed(4)),
                // Which end of the sweep this line is, so a style can mark them.
                solstice: noon.getTime() === solstices.start ? (declination > 0 ? 'june' : 'december')
                    : noon.getTime() === solstices.end ? (declination > 0 ? 'june' : 'december')
                    : null,
            },
            geometry: { type: 'LineString', coordinates },
        } as GeoJSON.Feature);
    }

    return { type: 'FeatureCollection', features };
}

/**
 * The tilt of the Earth's axis on a date, in degrees.
 *
 * Not a constant: it is drifting by about 0.47 arcseconds a year, which moves
 * the tropics and the polar circles some 14 metres a year — the Arctic Circle
 * is not where it was when your atlas was printed. Small, but it is the reason
 * these lines are worth computing rather than storing.
 */
export function axialTilt(date: Date = new Date()): number {
    const t = julianCenturies(date);
    const mean = 23 + (26 + (21.448 - t * (46.815 + t * (0.00059 - t * 0.001813))) / 60) / 60;
    return mean + 0.00256 * Math.cos((125.04 - 1934.136 * t) * DEG);
}

/**
 * The analemma: where the sun stands at the same clock time every day of a year.
 *
 * The figure of eight everyone has seen on a sundial, and the picture of the two
 * things that make solar time wander from clock time — the tilt of the axis
 * (which makes the loop) and the eccentricity of the orbit (which makes one lobe
 * bigger than the other). Drawn on a map it is a closed curve near one meridian.
 */
export function analemma(
    year: number = new Date().getUTCFullYear(),
    options: { hourUtc?: number } = {},
): GeoJSON.FeatureCollection {
    const hour = options.hourUtc ?? 12;
    const coordinates: number[][] = [];
    const days = (Date.UTC(year + 1, 0, 1) - Date.UTC(year, 0, 1)) / 86_400_000;
    for (let day = 0; day < days; day++) {
        const sun = subsolarPoint(new Date(Date.UTC(year, 0, 1) + day * 86_400_000 + hour * 3_600_000));
        coordinates.push([Number(sun.lon.toFixed(5)), Number(sun.lat.toFixed(5))]);
    }
    coordinates.push(coordinates[0]);
    return {
        type: 'FeatureCollection',
        features: [{
            type: 'Feature',
            properties: {
                description: `Analemma at ${String(hour).padStart(2, '0')}:00 UTC`,
                year,
                hourUtc: hour,
            },
            geometry: { type: 'LineString', coordinates },
        } as GeoJSON.Feature],
    };
}

/**
 * Meridians of solar time: where it is noon, and every hour either side of it.
 *
 * These are the time zones the sun keeps, as opposed to the ones governments
 * keep — the gap between the two is why the sun is overhead at half past one in
 * western Spain.
 */
export function solarTimeMeridians(date: Date = new Date()): GeoJSON.FeatureCollection {
    const sun = subsolarPoint(date);
    const features: GeoJSON.Feature[] = [];
    for (let hour = -11; hour <= 12; hour++) {
        const lon = normaliseLon(sun.lon + hour * 15);
        features.push({
            type: 'Feature',
            properties: {
                // 12 is solar noon; 0 and 24 are solar midnight.
                solarHour: ((12 + hour) % 24 + 24) % 24,
                noon: hour === 0,
                timestamp: date.toISOString(),
            },
            geometry: { type: 'LineString', coordinates: [[lon, -85], [lon, 0], [lon, 85]] },
        } as GeoJSON.Feature);
    }
    return { type: 'FeatureCollection', features };
}

/**
 * Latitudes that get a given number of hours of daylight on a date.
 *
 * A closed-form answer rather than a contour walk: for declination δ, the sun is
 * above the horizon for H hours at the latitude where `cos(H·15°/2) = −tanφ·tanδ`.
 * Each line is therefore a parallel, and where the equation has no solution the
 * latitude has polar day or polar night — which is itself the interesting part
 * of the picture, and why the 0 and 24 hour lines appear and vanish with the
 * seasons.
 */
export function dayLengthLines(
    date: Date = new Date(),
    options: { hours?: number[] } = {},
): GeoJSON.FeatureCollection {
    const declination = subsolarPoint(date).declination;
    const wanted = options.hours ?? [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24];
    const features: GeoJSON.Feature[] = [];

    for (const hours of wanted) {
        // The sunrise hour angle for this day length, and the latitude at which
        // the sun's altitude reaches the horizon exactly there.
        const hourAngle = (hours / 2) * 15 * DEG;
        const tanLat = -Math.cos(hourAngle) / Math.tan(declination * DEG);
        const lat = Math.atan(tanLat) / DEG;
        if (!Number.isFinite(lat) || Math.abs(lat) > 89.5) continue;

        features.push({
            type: 'Feature',
            properties: {
                hours,
                description: hours === 12 ? 'Twelve hours of daylight'
                    : hours === 24 ? 'Midnight sun begins'
                    : hours === 0 ? 'Polar night begins'
                    : `${hours} hours of daylight`,
                date: date.toISOString().slice(0, 10),
            },
            geometry: {
                type: 'LineString',
                coordinates: Array.from({ length: 73 }, (_, i) => [-180 + i * 5, Number(lat.toFixed(5))]),
            },
        } as GeoJSON.Feature);
    }
    return { type: 'FeatureCollection', features };
}
