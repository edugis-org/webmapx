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
    /**
     * The sun's centre on the horizon, refraction ignored.
     *
     * The geometric definition, and the one the polar circles are drawn from:
     * at a solstice the Arctic and Antarctic Circles are exactly where the sun's
     * centre grazes the horizon at local midnight. `sunset` differs from it by
     * the sun's own radius plus atmospheric refraction, which is why the day
     * side reaches about 0.83° past the circles.
     */
    horizon: 0,
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
    /**
     * Distance to the sun in kilometres.
     *
     * Varies by 3.3% over the year, which is nothing to look at and a great deal
     * to a tide: the tide-raising force falls off with the cube of distance, so
     * the same alignment pulls a tenth harder in January than in July.
     */
    distanceKm: number;
}

/** One astronomical unit, in kilometres. */
export const ASTRONOMICAL_UNIT_KM = 149_597_870.7;

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

    // The radius vector, from the true anomaly and the orbit's eccentricity.
    const trueAnomaly = meanAnomaly + centre;
    const distanceAu = (1.000001018 * (1 - eccentricity * eccentricity))
        / (1 + eccentricity * Math.cos(trueAnomaly * DEG));

    return {
        lon,
        lat: declination,
        declination,
        equationOfTime,
        distanceKm: distanceAu * ASTRONOMICAL_UNIT_KM,
    };
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
 * Exported because anything drawn as a closed shape on a world map needs it,
 * not only the daylight caps: a polygon whose points jump from 179 to -179 is
 * drawn straight across the map instead of round the back.
 *
 * Cutting rather than leaving it whole: a polygon whose points jump from 179
 * to -179 is drawn straight across the map, which is the stripe that appears
 * over the Pacific in the service's own data.
 */
export function splitAtAntimeridian(raw: Array<[number, number]>): number[][][] {
    // Normalised first: the generator walks longitudes continuously, so a ring
    // around the antimeridian runs 160 → 200 and never appears to cross
    // anything until it is folded back into range.
    const normalised: Array<[number, number]> = raw.map(([lon, lat]) => [normaliseLon(lon), lat]);
    const closed = normalised.length > 1
        && normalised[0][0] === normalised[normalised.length - 1][0]
        && normalised[0][1] === normalised[normalised.length - 1][1];
    const loop = closed ? normalised.slice(0, -1) : normalised;
    const n = loop.length;
    if (n < 2) return [closeRing(loop.map(([lon, lat]) => [lon, lat]))];

    // Where the walk jumps the seam, counted round the ring as a *cycle* — the
    // step from the last point back to the first is an edge like any other.
    // Treating the ring as a line instead loses the crossing that happens to
    // fall at the join: its two seam points are never inserted, the piece is
    // closed straight across open water, and the seam shows as a wedge several
    // degrees wide rather than as a line. Near an equinox, with the antisolar
    // point close to the antimeridian, that wedge is exactly where the eye is.
    const crossings: number[] = [];
    for (let i = 0; i < n; i++) {
        const previous = loop[(i - 1 + n) % n];
        if (Math.abs(loop[i][0] - previous[0]) > 180) crossings.push(i);
    }
    if (crossings.length === 0) return [closeRing(loop.map(([lon, lat]) => [lon, lat]))];

    /** The seam this crossing meets, and the latitude both sides meet it at. */
    const seamAt = (i: number): { edge: number; lat: number } => {
        const previous = loop[(i - 1 + n) % n];
        const [lon, lat] = loop[i];
        const edge = previous[0] > 0 ? 180 : -180;
        const span = Math.abs(lon - previous[0]);
        const share = Math.abs(edge - previous[0]) / (360 - span);
        return { edge, lat: previous[1] + (lat - previous[1]) * share };
    };

    // One piece per stretch between consecutive crossings, each one closed on
    // the seam at both ends: it enters on one side and leaves on the other.
    const parts: number[][][] = [];
    for (let k = 0; k < crossings.length; k++) {
        const from = crossings[k];
        const to = crossings[(k + 1) % crossings.length];
        const entry = seamAt(from);
        const exit = seamAt(to);
        const piece: number[][] = [[-entry.edge, entry.lat]];
        for (let step = 0; step < n; step++) {
            const index = (from + step) % n;
            if (step > 0 && index === to) break;
            piece.push([loop[index][0], loop[index][1]]);
        }
        piece.push([exit.edge, exit.lat]);
        parts.push(closeRing(piece));
    }
    return parts;
}

/**
 * A point on a ring that says which side of the seam the ring is on.
 *
 * The vertex furthest from ±180 in longitude: every cut ring has its first and
 * last points exactly on the seam, and those are the ones no containment test
 * can answer reliably.
 */
function insidePoint(ring: number[][]): number[] {
    let best = ring[0];
    let bestDistance = -1;
    for (const point of ring) {
        const distance = 180 - Math.abs(point[0]);
        if (distance > bestDistance) {
            bestDistance = distance;
            best = point;
        }
    }
    return best;
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
    // Sunset straddles the geometric horizon rather than sitting under it, so
    // its middle is the line where the sun's centre is level with the horizon —
    // and at a solstice that line *is* the polar circle. The band is the width
    // of the disagreement between the two definitions of sunset: the sun's own
    // radius plus refraction either side, so its lower edge is the moment the
    // upper limb goes, its upper edge the moment it starts to touch.
    {
        id: 'sunset',
        description: 'Sunrise and sunset',
        from: -SOLAR_ALTITUDES.sunset,
        to: SOLAR_ALTITUDES.sunset,
    },
    { id: 'civil', description: 'Civil twilight', from: SOLAR_ALTITUDES.sunset, to: SOLAR_ALTITUDES.civil },
    { id: 'nautical', description: 'Nautical twilight', from: SOLAR_ALTITUDES.civil, to: SOLAR_ALTITUDES.nautical },
    { id: 'astronomical', description: 'Astronomical twilight', from: SOLAR_ALTITUDES.nautical, to: SOLAR_ALTITUDES.astronomical },
    { id: 'night', description: 'Night', from: SOLAR_ALTITUDES.astronomical, to: -90 },
];

/**
 * The ring between two caps about one centre, as polygons with holes.
 *
 * A hole only belongs to the piece that contains it: when either cap has been
 * cut at the seam they are separate polygons, and the hole is carried by
 * whichever outer ring encloses it. Which piece that is has to be decided from
 * a vertex *away* from the seam — a cut ring starts and ends exactly on ±180,
 * and a point on the boundary of the piece it is tested against answers ray
 * casting either way. Testing the hole's first vertex matched one side and not
 * the other, the unmatched hole was dropped, and that half of the band covered
 * its whole cap: nautical, astronomical and night drawn on top of each other
 * down one side of the antimeridian.
 */
function annulusPolygons(
    centreLon: number,
    centreLat: number,
    outer: number,
    inner: number,
): number[][][][] {
    const polygons: number[][][][] = sphericalCapRings(centreLon, centreLat, Math.max(outer, 0))
        .map((ring) => [ring]);
    if (inner <= 0) return polygons;

    for (const hole of sphericalCapRings(centreLon, centreLat, inner)) {
        const owner = polygons.find((rings) => ringContains(rings[0], insidePoint(hole)));
        if (owner) owner.push(hole.slice().reverse());
    }
    return polygons;
}

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

        // A cap wider than a hemisphere holds one pole, and a ring can be closed
        // over one pole. It holds *both* only while the antisolar point is
        // within `outer - 90` of the equator — for the sunset band that is 0.83°
        // of declination, so about two days around each equinox — and then a
        // ring closed over one pole describes the wrong region entirely.
        const straddlesBothPoles = outer > 90 && Math.abs(antiLat) < outer - 90;
        const polygons: number[][][][] = straddlesBothPoles
            // Only for those days: the band is symmetric — a point is in it when
            // it is further than `inner` from the antisolar point *and* further
            // than `inner` from the sun — so it can be measured from each end in
            // turn, giving two halves that meet along the terminator and neither
            // of which is wider than a hemisphere. The halves are one feature and
            // the layer draws no outline on this band, so the join is invisible.
            ? [
                ...annulusPolygons(antiLon, antiLat, 90, inner),
                ...annulusPolygons(normaliseLon(antiLon + 180), -antiLat, 90, 180 - outer),
            ]
            : annulusPolygons(antiLon, antiLat, outer, inner);
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
 * The sun's daily tracks, one line per day, across the window `span` names.
 *
 * `at` is always the anchor — the day the window is placed around, or on, or
 * within — and defaults to today; `span` alone decides how wide the window is:
 *
 * - `day` — just `at`'s own day, one line.
 * - `solstice-to-solstice` (default) — the half-cycle `at` currently sits in.
 *   Half a year is the whole picture a sweep has to offer: between two
 *   solstices the sun works its way from one tropic to the other, and the
 *   following half retraces exactly the same latitudes on the way back, so
 *   drawing all 365 doubles the size and the ink for lines that land on ones
 *   already there. The half is the one being travelled *now* — from the
 *   December solstice it climbs to the Tropic of Cancer, from the June
 *   solstice it falls back to Capricorn — so today's track is always among the
 *   lines and the sweep runs the way the sun is actually going. That window
 *   straddles New Year for half the year, which is why it is not calendar-scoped.
 * - `half-year` — 91 days either side of `at`, centred rather than snapped to
 *   a solstice: unlike `solstice-to-solstice`, moving `at` slides the window
 *   with it instead of jumping to the next half only at the solstice itself.
 * - `year` — the calendar year `at` falls in, January to December.
 *
 * The lines crowd together at the solstices, where the declination turns and
 * barely moves for weeks, and spread furthest at the equinox, when the sun
 * crosses the equator fastest. That spacing *is* the seasons, in one frame.
 */
export function sunPathLines(
    at: Date = new Date(),
    options: { stepDegrees?: number; span?: 'day' | 'solstice-to-solstice' | 'half-year' | 'year' } = {},
): GeoJSON.FeatureCollection {
    // Two degrees of longitude is eight minutes of the sun's travel: finer than
    // that adds points a map cannot show, coarser starts to cut the corners of
    // the curve near the solstices.
    const step = Math.min(30, Math.max(0.5, options.stepDegrees ?? 2));
    const features: GeoJSON.Feature[] = [];
    const year = at.getUTCFullYear();
    // Midnight of `at`'s own day — every window below is built from this, and
    // the loop that walks it adds noon back on per day (`dayStart + 43_200_000`).
    const midnight = Math.floor(at.getTime() / 86_400_000) * 86_400_000;
    const solstices = surroundingSolstices(at);

    const window = (): { first: number; last: number } => {
        switch (options.span) {
            case 'day': return { first: midnight, last: midnight };
            // ~91 days either side: half a year (365.25 / 4) split evenly around `at`.
            case 'half-year': return { first: midnight - 91 * 86_400_000, last: midnight + 91 * 86_400_000 };
            case 'year': return { first: Date.UTC(year, 0, 1), last: Date.UTC(year + 1, 0, 1) - 86_400_000 };
            // solstices.start/end are noon-aligned (surroundingSolstices uses
            // noonOf); back to midnight, matching every other case here.
            default: return { first: solstices.start - 43_200_000, last: solstices.end - 43_200_000 };
        }
    };
    const { first: firstMs, last: lastMs } = window();
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
 *
 * Emitted as one segment per day rather than one closed line, so that pointing
 * at a piece of the curve answers the question the curve raises — which day is
 * this? — instead of repeating the title of the layer.
 */
export function analemma(
    year: number = new Date().getUTCFullYear(),
    options: { hourUtc?: number; today?: Date } = {},
): GeoJSON.FeatureCollection {
    const hour = options.hourUtc ?? 12;
    const today = options.today ?? new Date();
    const label = `${String(hour).padStart(2, '0')}:00 UTC`;
    const days = (Date.UTC(year + 1, 0, 1) - Date.UTC(year, 0, 1)) / 86_400_000;
    const positions: number[][] = [];
    for (let day = 0; day < days; day++) {
        const sun = subsolarPoint(new Date(Date.UTC(year, 0, 1) + day * 86_400_000 + hour * 3_600_000));
        positions.push([Number(sun.lon.toFixed(5)), Number(sun.lat.toFixed(5))]);
    }
    const features: GeoJSON.Feature[] = positions.map((from, day) => {
        const date = new Date(Date.UTC(year, 0, 1) + day * 86_400_000);
        const iso = date.toISOString().slice(0, 10);
        return {
            type: 'Feature',
            properties: {
                description: `The sun stands here at ${label} on ${iso}`,
                date: iso,
                dayOfYear: day + 1,
                year,
                hourUtc: hour,
                longitude: from[0],
                latitude: from[1],
                /**
                 * How far solar time runs ahead of clock time, in minutes: the
                 * sun's offset from the meridian it would stand over at this
                 * hour if the two agreed, four minutes to the degree.
                 */
                equationOfTimeMinutes: Number(((from[0] - (12 - hour) * 15) * 4).toFixed(2)),
            },
            geometry: {
                type: 'LineString',
                coordinates: [from, positions[(day + 1) % positions.length]],
            },
        } as GeoJSON.Feature;
    });
    const todayIso = today.toISOString().slice(0, 10);
    const marker = features.find(feature => feature.properties?.date === todayIso);
    if (marker) {
        features.push({
            type: 'Feature',
            properties: { ...marker.properties, today: true },
            geometry: {
                type: 'Point',
                coordinates: (marker.geometry as GeoJSON.LineString).coordinates[0],
            },
        } as GeoJSON.Feature);
    }
    return { type: 'FeatureCollection', features };
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
                // Sampled at the same two degrees as the graticule's parallels:
                // a parallel is one straight row of collinear points, and a
                // sparse one gets thinned to its two ends before the tiler
                // clips it, which is what left these lines cut at a meridian.
                coordinates: Array.from({ length: 181 }, (_, i) => [-180 + i * 2, Number(lat.toFixed(5))]),
            },
        } as GeoJSON.Feature);
    }
    return { type: 'FeatureCollection', features };
}
