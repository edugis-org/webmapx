/**
 * The equilibrium tide: the shape the ocean would take if it could keep up.
 *
 * Two bodies raise it. The moon pulls the near side of the Earth harder than
 * the centre and the centre harder than the far side, and what is left after
 * the whole planet's fall is subtracted is a stretch along the line to the moon
 * — a bulge under it *and* one opposite. The sun does the same, at 46% of the
 * strength: it is far more massive but so much further away, and the effect
 * falls off with the cube of distance rather than the square. That cube is why
 * this is worth computing rather than stating: the moon's distance varies by
 * 12% over a month, which is 40% in tide-raising force.
 *
 * Add the two and the month becomes visible. At new and full moon the bulges
 * line up and reinforce (spring tides, from "spring forth" — nothing to do with
 * the season); at the quarters they are 90° apart and partly cancel (neap
 * tides). The range between them is about two to one, and it is the clearest
 * thing a time slider can show.
 *
 * What this is *not* is the tide at any coast. The real ocean cannot keep up:
 * water has to move, and a basin has a natural period, so the actual tide lags
 * by hours, is amplified or damped by resonance, and rotates around amphidromic
 * points where the range is nil — three of them in the North Sea alone. The
 * equilibrium tide is the *forcing*, and the difference between it and a tide
 * table is the physics that makes coastal tides interesting. Predicting those
 * needs harmonic constants measured per station; no formula gets there from a
 * date.
 */
import { normaliseLon, subsolarPoint } from './solar';
import { moonPosition, phaseName } from './moon';

const DEG = Math.PI / 180;

/** Mean radius of the Earth, in kilometres. */
const EARTH_RADIUS_KM = 6371;
/** Moon and sun masses, as multiples of the Earth's. */
const MOON_MASS_RATIO = 0.0123000371;
const SUN_MASS_RATIO = 332_946.0487;

/**
 * The height a body's tide-raising potential would lift the sea to, in metres.
 *
 * ζ = (M/M⊕)·(R⁴/d³)·P₂(cos ψ), with P₂ the second Legendre polynomial — 1 under
 * the body, 1 at its antipode, −½ on the circle 90° away. Everything cancels
 * against the Earth's own surface gravity, which is why no gravitational
 * constant appears here: the answer only depends on mass *ratios* and on the
 * ratio of the Earth's radius to the distance.
 */
function equilibriumAmplitudeMetres(massRatio: number, distanceKm: number): number {
    const r4 = EARTH_RADIUS_KM ** 4;
    return massRatio * (r4 / distanceKm ** 3) * 1000;
}

/** cos of the angle between two points on the sphere. */
function cosAngle(lon1: number, lat1: number, lon2: number, lat2: number): number {
    const value = Math.sin(lat1 * DEG) * Math.sin(lat2 * DEG)
        + Math.cos(lat1 * DEG) * Math.cos(lat2 * DEG) * Math.cos((lon2 - lon1) * DEG);
    return Math.min(1, Math.max(-1, value));
}

/** P₂(cos ψ) — 1 under the body and at its antipode, −0.5 a quarter turn away. */
function legendre2(cosPsi: number): number {
    return (3 * cosPsi * cosPsi - 1) / 2;
}

export interface TideState {
    /** Where the moon and the sun stand, and how hard each pulls. */
    moon: { lon: number; lat: number; amplitude: number; phase: number };
    sun: { lon: number; lat: number; amplitude: number };
    /**
     * How closely the two are aligned, 0 (quarters, neap) to 1 (new or full,
     * spring). The angle between them counts twice over, because a tide has two
     * bulges: the moon opposite the sun pulls with it, not against it.
     */
    springFactor: number;
}

export function tideState(date: Date = new Date()): TideState {
    const moon = moonPosition(date);
    const sun = subsolarPoint(date);
    const separation = Math.acos(cosAngle(moon.lon, moon.lat, sun.lon, sun.lat)) / DEG;
    return {
        moon: {
            lon: moon.lon,
            lat: moon.lat,
            phase: moon.phase,
            amplitude: equilibriumAmplitudeMetres(MOON_MASS_RATIO, moon.distanceKm),
        },
        sun: {
            lon: sun.lon,
            lat: sun.lat,
            amplitude: equilibriumAmplitudeMetres(SUN_MASS_RATIO, sun.distanceKm),
        },
        springFactor: Math.abs(Math.cos(separation * DEG)),
    };
}

/** The equilibrium tide at one place and moment, in metres. */
export function equilibriumTideMetres(lon: number, lat: number, state: TideState): number {
    return state.moon.amplitude * legendre2(cosAngle(state.moon.lon, state.moon.lat, lon, lat))
        + state.sun.amplitude * legendre2(cosAngle(state.sun.lon, state.sun.lat, lon, lat));
}

/**
 * The two bulges, as points.
 *
 * Two, not one, and no matching low: the maximum is a pair of small areas — one
 * roughly under the moon, one roughly opposite — while the minimum is not a
 * point at all but a belt right round the world, a quarter turn from that axis.
 * Measured on the field: at full moon a 2° grid holds 34 points within 5 mm of
 * the maximum and 1056 within 5 mm of the minimum. Marking "the lowest place"
 * therefore marks numerical noise, and the marker jumps around the belt from
 * one moment to the next. The low is already drawn, properly, by the negative
 * contours.
 *
 * The bulges are not exactly under the moon either: the sun pulls the maximum
 * some way towards itself, by up to about 25° at the quarters. Watching that
 * swing over a month is spring and neap told as a position rather than as a
 * number.
 */
export function tideBulges(date: Date = new Date()): GeoJSON.Feature[] {
    const state = tideState(date);
    // Coarse sweep, then a local refinement around each winner. A half-degree
    // sweep of the whole globe is half a million evaluations for two points,
    // and this layer is redrawn on every frame of an animation.
    const sweep = (accept: (lon: number, lat: number) => boolean) => {
        let best = { lon: 0, lat: 0, metres: -Infinity };
        for (let lat = -90; lat <= 90; lat += 2) {
            for (let lon = -180; lon < 180; lon += 2) {
                if (!accept(lon, lat)) continue;
                const metres = equilibriumTideMetres(lon, lat, state);
                if (metres > best.metres) best = { lon, lat, metres };
            }
        }
        for (let lat = best.lat - 2; lat <= best.lat + 2; lat += 0.25) {
            if (lat < -90 || lat > 90) continue;
            for (let lon = best.lon - 2; lon <= best.lon + 2; lon += 0.25) {
                const metres = equilibriumTideMetres(lon, lat, state);
                if (metres > best.metres) best = { lon, lat, metres };
            }
        }
        return best;
    };

    const first = sweep(() => true);
    // The other bulge is the best of what is left once the first one's own
    // hemisphere is excluded — they are half a world apart by construction.
    const second = sweep((lon, lat) => cosAngle(first.lon, first.lat, lon, lat) < 0);

    return [first, second].map((point) => ({
        type: 'Feature',
        properties: {
            id: 'high',
            description: 'Tidal bulge',
            metres: Number(point.metres.toFixed(3)),
            timestamp: date.toISOString(),
        },
        geometry: { type: 'Point', coordinates: [normaliseLon(point.lon), Number(point.lat.toFixed(3))] },
    } as GeoJSON.Feature));
}

/**
 * Contours of the equilibrium tide.
 *
 * Marching squares over a lon/lat grid rather than anything cleverer: the field
 * is smooth and has no more than two maxima, so the simplest algorithm that
 * exists produces clean closed curves, and it needs no library.
 *
 * Sampled to but not across ±180. A segment is only ever drawn between adjacent
 * grid columns, so no contour can span the seam — the same reason the day/night
 * rings have to be cut, avoided here by never joining across it in the first
 * place.
 */
export function tideContours(
    date: Date = new Date(),
    options: { levels?: number[]; stepDegrees?: number } = {},
): GeoJSON.FeatureCollection {
    const state = tideState(date);
    const step = options.stepDegrees && options.stepDegrees > 0 ? options.stepDegrees : 2;
    const levels = options.levels ?? [-0.2, -0.15, -0.1, -0.05, 0, 0.05, 0.1, 0.2, 0.3, 0.4, 0.5];

    const lons: number[] = [];
    for (let lon = -180; lon <= 180; lon += step) lons.push(lon);
    const lats: number[] = [];
    for (let lat = -90; lat <= 90; lat += step) lats.push(lat);

    // One pass over the grid, reused for every level.
    const field: number[][] = lats.map((lat) => lons.map((lon) => equilibriumTideMetres(lon, lat, state)));

    const features: GeoJSON.Feature[] = [];
    for (const level of levels) {
        const segments = marchingSquares(lons, lats, field, level);
        if (segments.length === 0) continue;
        features.push({
            type: 'Feature',
            properties: {
                id: level > 0 ? 'high' : level < 0 ? 'low' : 'mean',
                description: `${level > 0 ? '+' : ''}${level.toFixed(2)} m`,
                metres: level,
                springFactor: Number(state.springFactor.toFixed(3)),
                phase: Number(state.moon.phase.toFixed(4)),
                phaseName: phaseName(state.moon.phase),
                lunarAmplitude: Number(state.moon.amplitude.toFixed(3)),
                solarAmplitude: Number(state.sun.amplitude.toFixed(3)),
                timestamp: date.toISOString(),
            },
            geometry: { type: 'MultiLineString', coordinates: segments },
        } as GeoJSON.Feature);
    }
    return { type: 'FeatureCollection', features };
}

/**
 * Marching squares, emitting one segment per crossed cell.
 *
 * Segments are left unjoined: a renderer draws a MultiLineString of two-point
 * pieces exactly as it draws one long line, and stitching them into continuous
 * curves would only matter for labelling or for smoothing — neither of which
 * this layer does.
 */
function marchingSquares(lons: number[], lats: number[], field: number[][], level: number): number[][][] {
    const segments: number[][][] = [];
    /** Where along an edge the level falls, linearly. */
    const cross = (aValue: number, bValue: number): number => {
        const span = bValue - aValue;
        return span === 0 ? 0.5 : (level - aValue) / span;
    };

    for (let row = 0; row + 1 < lats.length; row++) {
        for (let col = 0; col + 1 < lons.length; col++) {
            const tl = field[row + 1][col];
            const tr = field[row + 1][col + 1];
            const br = field[row][col + 1];
            const bl = field[row][col];
            // Which corners are above the level, as a four-bit case number.
            const caseIndex = (tl > level ? 8 : 0) | (tr > level ? 4 : 0)
                | (br > level ? 2 : 0) | (bl > level ? 1 : 0);
            if (caseIndex === 0 || caseIndex === 15) continue;

            const west = lons[col];
            const east = lons[col + 1];
            const south = lats[row];
            const north = lats[row + 1];
            const top = (): number[] => [west + (east - west) * cross(tl, tr), north];
            const bottom = (): number[] => [west + (east - west) * cross(bl, br), south];
            const left = (): number[] => [west, south + (north - south) * cross(bl, tl)];
            const right = (): number[] => [east, south + (north - south) * cross(br, tr)];

            switch (caseIndex) {
                case 1: case 14: segments.push([left(), bottom()]); break;
                case 2: case 13: segments.push([bottom(), right()]); break;
                case 3: case 12: segments.push([left(), right()]); break;
                case 4: case 11: segments.push([top(), right()]); break;
                case 6: case 9: segments.push([top(), bottom()]); break;
                case 7: case 8: segments.push([left(), top()]); break;
                // Saddles: two separate curves through one cell. Which pairing is
                // right depends on the cell's average, and getting it wrong joins
                // two contours that should pass each other.
                case 5:
                case 10: {
                    const average = (tl + tr + br + bl) / 4;
                    const crossed = caseIndex === 5 ? average > level : average <= level;
                    if (crossed) {
                        segments.push([left(), top()], [bottom(), right()]);
                    } else {
                        segments.push([left(), bottom()], [top(), right()]);
                    }
                    break;
                }
            }
        }
    }
    return segments;
}

/**
 * The equilibrium tide as a layer: contours, plus the two bulges.
 *
 * One collection rather than two layers, so a config can style the lines and the
 * markers from the same source and neither can be switched on without the other
 * — the points are meaningless without the field they sit in.
 */
export function equilibriumTide(
    date: Date = new Date(),
    options: { levels?: number[]; stepDegrees?: number; extremes?: boolean } = {},
): GeoJSON.FeatureCollection {
    const contours = tideContours(date, options);
    if (options.extremes === false) return contours;
    return {
        type: 'FeatureCollection',
        features: [...contours.features, ...tideBulges(date)],
    };
}
