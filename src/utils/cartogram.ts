/**
 * Cartograms: polygons resized so that their *area* shows a value instead of
 * showing ground area.
 *
 * GeoJSON in, GeoJSON out — and GeoJSON is longitude/latitude by definition
 * (RFC 7946), which is exactly why nothing here measures area in the input's own
 * coordinates. A square degree is not an area: it shrinks by cos(latitude), so
 * measuring in degrees hands Norway roughly twice the area it has and Ecuador
 * its true one, and the cartogram would then be sized by that error as much as
 * by the data. Areas are therefore measured **on the sphere**, and every shape
 * is resized in an equal-area projection centred on that shape, so the factor
 * applied is a factor of real ground area.
 *
 * Five methods, three of which keep the map joined up. `flow` is the default.
 *
 * - `contiguous` (Dougenik rubber sheet) stretches one sheet by
 *   hand, in a hundred lines and with no dependency. It converges towards the
 *   target areas rather than reaching them, and on a layer with extreme values
 *   it leaves a long tail.
 * - `flow` (Gastner–Seguy–More again, through `@edugis/cartogram`) is the same
 *   algorithm reimplemented in TypeScript, projecting, warping and unprojecting
 *   internally, with topology-preserving densification and total-area correction. It exists
 *   beside `diffusion` so the two can be compared on the same layer: the WASM
 *   reference returns an empty or self-crossing geometry on some real layers
 *   (worldpop country polygons), which is what this comparison is for.
 * - `diffusion` (Gastner–Seguy–More, through `go-cart-wasm`) solves the
 *   density-equalising flow itself. Essentially exact where it converges, and
 *   the method Worldmapper uses, but it is slower and a layer whose values span
 *   five orders of magnitude can stop it converging at all — see
 *   `minValuePercent`.
 * - `scaled` (Olson) resizes each shape on the spot, keeping every outline
 *   exactly and leaving gaps between them.
 * - `dorling` throws the shape away and draws circles, which is easier to
 *   compare by eye when the values differ by orders of magnitude.
 */

import { cartogram as edugisCartogram } from '@edugis/cartogram';

export type CartogramMethod = 'diffusion' | 'flow' | 'contiguous' | 'scaled' | 'dorling';

export interface CartogramOptions {
    /** Attribute holding the value to size features by. */
    field: string;
    method?: CartogramMethod;
    /** `dorling` only: how many rounds of pushing overlapping circles apart. */
    iterations?: number;
    /** `contiguous` only: how many rounds of rubber-sheeting. */
    passes?: number;
    /**
     * Leave out any feature whose value is below this share of the layer's
     * total, as a percentage. 0 keeps everything.
     */
    minValuePercent?: number;
    /**
     * Leave out any *part* of a multi-part feature smaller than this share of
     * that feature's own area, as a percentage. 0 keeps every part.
     *
     * A different axis from `minValuePercent`, which drops whole features by
     * value: this drops islets inside a feature that is kept. Neither can stand
     * in for the other. Measured on 247 countries sized by population, no value
     * threshold removes a single part — Canada keeps all 277 of its pieces until
     * the threshold throws the whole country off the map.
     *
     * It exists because the joined-up methods shear a small part into a
     * filament. A part far below the resolution of the flow is not shrunk by
     * it, it is *transported* by the deformation of the surrounding sheet, and
     * in a region contracting sevenfold that draws it out into a thread. On the
     * demo's world-population layer this is most of what is wrong with the
     * picture: Russia's 170 sub-1000 km² parts become a ribbon along the whole
     * top of the map, the Aleutians a spike running west out of Alaska, and
     * Canada's Arctic islands a smear. It is a share of the feature rather than
     * an absolute area so that it means the same thing on a layer of countries
     * and a layer of municipalities.
     *
     * Ignored by `scaled` and `dorling`, which do not deform: `scaled` promises
     * every outline exactly and must keep it, and `dorling` throws the outline
     * away for a circle, so its parts never reach the output either way.
     */
    minPartPercent?: number;
    /**
     * `diffusion` only: where the go-cart WASM binary lives. The browser needs
     * telling (the bundler hashes the file name); Node resolves it from the
     * package itself, so tests leave this out.
     */
    wasmUrl?: string;
    /**
     * `flow` only: called as the solver works, with the pass it has reached.
     *
     * A world layer at a data-sized grid takes two minutes, and there is nothing
     * honest to put a percentage on: the flow runs until the areas are close
     * enough rather than for a known number of steps, and each pass doubles the
     * grid, so even a pass count is not linear in time.
     *
     * Deliberately *not* the convergence error the solver reports per iteration,
     * which is an unweighted mean over features and so is dominated by the
     * regions too small to see — it reads 31% on a map that is 0.9% wrong where
     * anyone is looking (see `medianAreaError`). Showing it beside a finished
     * result quoting the weighted figure would put two contradictory numbers for
     * one quantity in one panel.
     */
    onProgress?: (pass: number) => void;
}

export interface CartogramResult {
    features: GeoJSON.FeatureCollection;
    /**
     * How far the map is from what the values asked for, as a fraction
     * (0.03 = 3%), **weighted by each feature's share of the total value**.
     *
     * Reported rather than asserted because the two joined-up methods can only
     * approximate: the rubber sheet converges, and diffusion can hit its own
     * iteration cap and stop. Both then return a map that *looks* like a
     * cartogram and is not one — measured on 253 world countries sized by
     * population, diffusion came back with a median error of 87% and no
     * complaint. The caller turns this into a warning.
     *
     * Weighted, because an unweighted average of per-feature errors answers a
     * question nobody asked. In a cartogram a feature's size *is* its value, so
     * the regions with the smallest values are the ones too small to see — and
     * they are also the ones the flow leaves worst, because a region at the
     * resolution of the grid cannot be sized accurately at all. They then
     * dominate a plain average. Measured on the 257-country world layer with
     * values spread over two orders of magnitude: unweighted mean 31.5%, median
     * 12.6%, while the value-weighted error was **0.92%** — the fifty worst
     * regions averaged 86% error and held one thousandth of the value between
     * them. The median would have fired this file's "the areas are still N%
     * away" warning on a map that was essentially exact.
     */
    medianAreaError: number;
    /**
     * Features left out, and why — the caller decides whether to surface it.
     *
     * `zeroValue` is counted apart from `negativeValue` because they are left
     * out for different reasons: a cartogram sizes a shape by its value, so a
     * region worth zero is asked for zero area — there is nothing to draw, and
     * it is left out deliberately rather than by a falsy test that would also
     * swallow a missing value. A negative value is not a size at all.
     */
    skipped: {
        missingValue: number;
        zeroValue: number;
        negativeValue: number;
        noArea: number;
        belowMinimum: number;
    };
    /**
     * How many parts `minPartPercent` removed, and what share of the layer's
     * area went with them.
     *
     * Reported rather than warned about: on a world layer this fires every
     * single time, and a warning every reader learns to ignore is worse than
     * none. The caller decides at what share it is worth saying.
     */
    droppedParts: { count: number; areaShare: number };
    /**
     * What the method itself has to say — `flow` only, which is the one method
     * that knows something about its own answer this file cannot measure: how
     * many regions were still smaller than a grid cell and so had their areas
     * quantized to it. Such a region is the *reason* someone reaches for a
     * cartogram (a dense city against a sparse country) and the one it silently
     * fails to grow, so it is passed on rather than dropped.
     */
    methodWarnings: string[];
}

/**
 * Share of its own feature a part must reach to be kept, as a percentage.
 *
 * 0.05% measured on the demo's 247-country world-population layer: it takes
 * Canada from 277 parts to 25, Russia 206 to 11 and the United States 167 to 7
 * — which is what stops the flow from shearing them into filaments — while
 * Greece keeps all 32 of its islands, Japan 20 of 32, the Philippines 37 of 43,
 * Fiji 7 of 7 and the Maldives 2 of 2. It costs 0.29% of the layer's area and
 * empties no feature. Ten times higher (0.5%) starts taking real archipelagos:
 * Indonesia 125 parts down to 12, Norway 64 down to 3.
 */
const DEFAULT_MIN_PART_PERCENT = 0.05;

/** How many points a Dorling circle is drawn with. */
const CIRCLE_STEPS = 64;

/** Rounds of separation when the caller does not say. */
const DEFAULT_ITERATIONS = 60;

// ─── Geometry helpers ────────────────────────────────────────────────────────

/** Every polygon in a geometry, whatever wrapper it arrived in. */
function polygonsOf(geometry: GeoJSON.Geometry | null | undefined): GeoJSON.Position[][][] {
    if (!geometry) return [];
    if (geometry.type === 'Polygon') return [geometry.coordinates];
    if (geometry.type === 'MultiPolygon') return geometry.coordinates;
    if (geometry.type === 'GeometryCollection') return geometry.geometries.flatMap(polygonsOf);
    return [];
}

/** Mean Earth radius, the sphere every measurement here is made on. */
const EARTH_RADIUS = 6371008.8;

const RAD = Math.PI / 180;
const DEG = 180 / Math.PI;

/**
 * Area of a ring on the sphere, in square metres.
 *
 * The standard spherical excess formula (the one PostGIS, turf and Google Maps
 * all use). Signed, so a hole wound the other way subtracts.
 */
function sphericalRingArea(ring: GeoJSON.Position[]): number {
    if (ring.length < 4) return 0;

    // A ring that goes right round the globe encircles a pole, and the excess
    // formula below cannot see that: it measures the region *between* the ring
    // and the equator and misses the cap. Measuring such a ring in an equal-area
    // plane centred on it is exact and has no special cases. Found on Dorling
    // circles that had been pushed over the pole, which reported areas hundreds
    // of times too large.
    if (Math.abs(totalLongitudeTravel(ring)) > 350) return equalAreaPlanarRingArea(ring);

    let total = 0;
    for (let i = 0; i < ring.length - 1; i++) {
        const [lon1, lat1] = ring[i];
        const [lon2, lat2] = ring[i + 1];
        // Each step takes the *short* way round. A ring that crosses the date
        // line has a step from 179 to -179, and reading that as -358 degrees
        // instead of +2 does not dent the area, it inverts it: measured on world
        // countries, a blown-up Tuvalu came out at 45 million km², larger than
        // Russia.
        total += shortestLongitudeStep(lon1, lon2) * RAD * (2 + Math.sin(lat1 * RAD) + Math.sin(lat2 * RAD));
    }
    return (total * EARTH_RADIUS * EARTH_RADIUS) / 2;
}

/** The signed longitude difference, taken the short way round the globe. */
function shortestLongitudeStep(from: number, to: number): number {
    const delta = to - from;
    // Arithmetic rather than a loop: this is called per coordinate pair on every
    // ring, and a single non-finite input used to hang the whole calculation
    // rather than produce a wrong number.
    if (!Number.isFinite(delta)) return 0;
    return delta - 360 * Math.round(delta / 360);
}

/** How far a ring travels in longitude overall: ±360 means it went round a pole. */
function totalLongitudeTravel(ring: GeoJSON.Position[]): number {
    let total = 0;
    for (let i = 0; i < ring.length - 1; i++) {
        total += shortestLongitudeStep(ring[i][0], ring[i + 1][0]);
    }
    return total;
}

/**
 * Ring area measured in an equal-area plane centred on the ring itself.
 *
 * Exact, because the projection preserves area — the shoelace formula in that
 * plane *is* the ground area — and free of the pole and antimeridian special
 * cases the spherical formula needs. Not used as the default only because it
 * costs a projection of every vertex.
 */
function equalAreaPlanarRingArea(ring: GeoJSON.Position[]): number {
    const centre = centroidOfPolygons([[ring]]) ?? [ring[0][0], ring[0][1]];
    const plane = equalAreaPlaneAt(centre);
    const projected = ring.map(p => plane.forward(p));
    let sum = 0;
    for (let i = 0; i < projected.length - 1; i++) {
        sum += projected[i][0] * projected[i + 1][1] - projected[i + 1][0] * projected[i][1];
    }
    return sum / 2;
}

/**
 * Ground area of a feature in square metres, holes excluded.
 *
 * Absolute value per polygon rather than per ring: ring winding in real data is
 * not reliable enough to trust for the outer ring, but a hole is always wound
 * opposite to the ring containing it, so subtracting within a polygon works.
 */
export function featureArea(geometry: GeoJSON.Geometry | null | undefined): number {
    let total = 0;
    for (const polygon of polygonsOf(geometry)) {
        if (!polygon.length) continue;
        const outer = Math.abs(sphericalRingArea(polygon[0]));
        const holes = polygon.slice(1).reduce((sum, ring) => sum + Math.abs(sphericalRingArea(ring)), 0);
        total += Math.max(outer - holes, 0);
    }
    return total;
}

/**
 * Drops the parts of a multi-part feature that are too small to survive being
 * deformed, keeping the largest whatever happens.
 *
 * The largest part is kept unconditionally so that this can never empty a
 * feature: a threshold is a statement about the *islands*, and a feature that
 * vanished here would be indistinguishable from one the data never had.
 *
 * Holes travel with the ring they belong to, since a hole is only meaningful
 * inside its own polygon; dropping the polygon drops its holes with it.
 */
function dropSmallParts(
    geometry: GeoJSON.Geometry,
    minShare: number,
): { geometry: GeoJSON.Geometry; dropped: number; areaDropped: number } {
    const polygons = polygonsOf(geometry);
    if (minShare <= 0 || polygons.length < 2) return { geometry, dropped: 0, areaDropped: 0 };

    const measured = polygons.map(polygon => ({
        polygon,
        area: featureArea({ type: 'Polygon', coordinates: polygon }),
    }));
    const total = measured.reduce((sum, part) => sum + part.area, 0);
    if (!total) return { geometry, dropped: 0, areaDropped: 0 };

    let largest = 0;
    for (let i = 1; i < measured.length; i++) if (measured[i].area > measured[largest].area) largest = i;

    const kept = measured.filter((part, index) => index === largest || part.area / total >= minShare);
    if (kept.length === measured.length) return { geometry, dropped: 0, areaDropped: 0 };

    const areaDropped = total - kept.reduce((sum, part) => sum + part.area, 0);
    const coordinates = kept.map(part => part.polygon);
    return {
        geometry: coordinates.length === 1
            ? { type: 'Polygon', coordinates: coordinates[0] }
            : { type: 'MultiPolygon', coordinates },
        dropped: measured.length - kept.length,
        areaDropped,
    };
}

/**
 * Area-weighted centroid of a feature — the point a shape is scaled about, and
 * the centre of the equal-area plane it is scaled in.
 *
 * Weighting by area matters for an archipelago: the mean of the *vertices* sits
 * wherever the coastline happens to be most detailed, so a country with one
 * crenellated island would be scaled about that island. The planar formula is
 * enough here because this only has to land somewhere sensible inside the
 * feature; the areas that carry the answer are measured on the sphere.
 */
export function featureCentroid(geometry: GeoJSON.Geometry | null | undefined): GeoJSON.Position | null {
    return centroidOfPolygons(polygonsOf(geometry));
}

function centroidOfPolygons(polygons: GeoJSON.Position[][][]): GeoJSON.Position | null {
    let sumX = 0, sumY = 0, sumArea = 0;
    const shift = datelineShift(polygons);
    for (const polygon of polygons) {
        const ring = polygon[0]?.map(([lon, lat]) => [lon < 0 ? lon + shift : lon, lat] as GeoJSON.Position);
        if (!ring || ring.length < 4) continue;
        let cx = 0, cy = 0, area = 0;
        for (let i = 0; i < ring.length - 1; i++) {
            const cross = ring[i][0] * ring[i + 1][1] - ring[i + 1][0] * ring[i][1];
            area += cross;
            cx += (ring[i][0] + ring[i + 1][0]) * cross;
            cy += (ring[i][1] + ring[i + 1][1]) * cross;
        }
        area /= 2;
        if (Math.abs(area) < 1e-12) continue;
        const weight = Math.abs(area);
        sumX += (cx / (6 * area)) * weight;
        sumY += (cy / (6 * area)) * weight;
        sumArea += weight;
    }
    if (!sumArea) return null;
    return [normaliseLongitude(sumX / sumArea), sumY / sumArea];
}

/**
 * 360 when the shape is better understood as spanning the date line, 0 otherwise.
 *
 * Averaging longitudes across ±180 without this puts Fiji's centre in Africa —
 * half its coordinates are near +180 and half near -180, and the mean of those
 * is 0. The test is the same one used elsewhere in the codebase: shift the
 * western half one world east and keep the shift if the shape comes out
 * narrower.
 */
function datelineShift(polygons: GeoJSON.Position[][][]): number {
    let min = Infinity, max = -Infinity, shiftedMin = Infinity, shiftedMax = -Infinity;
    for (const polygon of polygons) {
        for (const ring of polygon) {
            for (const [lon] of ring) {
                const shifted = lon < 0 ? lon + 360 : lon;
                min = Math.min(min, lon);
                max = Math.max(max, lon);
                shiftedMin = Math.min(shiftedMin, shifted);
                shiftedMax = Math.max(shiftedMax, shifted);
            }
        }
    }
    return shiftedMax - shiftedMin < max - min ? 360 : 0;
}

// ─── The working plane ───────────────────────────────────────────────────────

/**
 * Lambert azimuthal equal-area, centred on the feature being resized.
 *
 * Scaling a shape needs a plane, and the plane has to be equal-area or the
 * factor applied is not a factor of ground area. Centring it on the shape itself
 * keeps distortion of the *outline* to a minimum too — a country a few hundred
 * kilometres across is barely deformed, where a single world-wide projection
 * would visibly stretch anything far from its standard parallel.
 *
 * A metre in this plane is a metre on the ground at the centre, so a target area
 * in square metres can be used directly.
 */
interface EqualAreaPlane {
    forward(lonLat: GeoJSON.Position): GeoJSON.Position;
    inverse(point: GeoJSON.Position): GeoJSON.Position;
}

function equalAreaPlaneAt([lon0, lat0]: GeoJSON.Position): EqualAreaPlane {
    const lambda0 = lon0 * RAD;
    const phi0 = lat0 * RAD;
    const sinPhi0 = Math.sin(phi0);
    const cosPhi0 = Math.cos(phi0);

    return {
        forward([lon, lat]) {
            const lambda = lon * RAD;
            const phi = lat * RAD;
            const cosPhi = Math.cos(phi);
            const sinPhi = Math.sin(phi);
            const cosDelta = Math.cos(lambda - lambda0);
            const denominator = 1 + sinPhi0 * sinPhi + cosPhi0 * cosPhi * cosDelta;
            // The antipode of the centre, where the projection is undefined. No
            // real feature spans half the globe, but a broken geometry can, and
            // an Infinity here would poison every later coordinate.
            if (denominator <= 1e-12) return [0, 0];
            const k = EARTH_RADIUS * Math.sqrt(2 / denominator);
            return [
                k * cosPhi * Math.sin(lambda - lambda0),
                k * (cosPhi0 * sinPhi - sinPhi0 * cosPhi * cosDelta),
            ];
        },
        inverse([x, y]) {
            const rho = Math.hypot(x, y);
            if (rho < 1e-9) return [lon0, lat0];
            // Clamped because a circle drawn at a radius beyond the projection's
            // reach would otherwise ask asin() for an impossible angle.
            const c = 2 * Math.asin(Math.min(rho / (2 * EARTH_RADIUS), 1));
            const sinC = Math.sin(c);
            const cosC = Math.cos(c);
            const lat = Math.asin(cosC * sinPhi0 + (y * sinC * cosPhi0) / rho);
            const lon = lambda0 + Math.atan2(x * sinC, rho * cosPhi0 * cosC - y * sinPhi0 * sinC);
            return [normaliseLongitude(lon * DEG), lat * DEG];
        },
    };
}

// ─── Back into the world ─────────────────────────────────────────────────────

/** Half the world, in degrees — the meridian a ring has to be cut at. */
const HALF_WORLD = 180;

/**
 * Brings a result geometry back inside [-180, 180], cutting rings at the date
 * line rather than folding their points.
 *
 * Every method here works in a metric plane and comes back through an inverse
 * projection, and every one of them can push a shape past the edge of that
 * plane: measured on 257 world countries, a diffusion cartogram returned the
 * USA spanning -197°..199° and Russia -213°..200°, with New Zealand, Fiji and
 * Kiribati alongside them. Folding each point on its own (which is what the
 * inverse projections used to do) puts half a ring at each edge of the map, and
 * the renderer joins them straight through the middle — the shapes smeared
 * across the whole globe.
 *
 * So the ring is made continuous first, shifted into the world by whole turns,
 * and only then cut — Sutherland–Hodgman against the two meridians, once per
 * world offset, which is exactly what the Voronoi code does in EPSG:3857.
 *
 * A geometry already inside the world is returned untouched, object identity
 * and all: this must not perturb the shared boundary coordinates that make the
 * contiguous method contiguous.
 */
function wrapToWorld(geometry: GeoJSON.Geometry): GeoJSON.Geometry {
    if (geometry.type === 'Polygon') {
        const parts = wrapPolygon(geometry.coordinates);
        if (!parts) return geometry;
        return parts.length === 1
            ? { type: 'Polygon', coordinates: parts[0] }
            : { type: 'MultiPolygon', coordinates: parts };
    }
    if (geometry.type === 'MultiPolygon') {
        const parts: GeoJSON.Position[][][] = [];
        let changed = false;
        for (const polygon of geometry.coordinates) {
            const wrapped = wrapPolygon(polygon);
            if (wrapped) {
                changed = true;
                parts.push(...wrapped);
            } else {
                parts.push(polygon);
            }
        }
        return changed ? { type: 'MultiPolygon', coordinates: parts } : geometry;
    }
    return geometry;
}

/**
 * One polygon (a shell and its holes), or `null` when it is already in the world
 * and needs nothing done to it.
 *
 * Holes travel with their shell: each is cut with the same offset, so a hole
 * that belongs to the piece on the far side of the line ends up in that piece
 * and nowhere else.
 */
function wrapPolygon(rings: GeoJSON.Position[][]): GeoJSON.Position[][][] | null {
    if (!rings.length) return null;
    const shell = unwrapRing(rings[0]);
    // A ring that goes round a pole has no meridian it can be cut at, and one
    // pushed past the edge of the map still has to end up on it: its longitudes
    // are pressed against the date line instead. Antarctica is the case that
    // matters, and it is a band, so pressing the overhang onto the meridian
    // costs a sliver of area and keeps the outline in one piece.
    if (!shell) return clampRings(rings);

    const holes: GeoJSON.Position[][] = [];
    for (const ring of rings.slice(1)) {
        const hole = unwrapRing(ring, meanLongitude(shell));
        // A hole that cannot be made continuous is dropped rather than left in a
        // frame of its own, where it would cut a hole out of open sea.
        if (hole) holes.push(hole);
    }

    const parts: GeoJSON.Position[][][] = [];
    for (const shift of [-2 * HALF_WORLD, 0, 2 * HALF_WORLD]) {
        const cut = clipToWorld(shell, shift);
        if (!cut) continue;
        const part = [cut];
        for (const hole of holes) {
            const cutHole = clipToWorld(hole, shift);
            if (cutHole) part.push(cutHole);
        }
        parts.push(part);
    }
    return parts.length ? parts : null;
}

/**
 * Presses a polygon's longitudes onto the world, or `null` when every one of
 * them is already inside it. The last resort, for a ring that cannot be cut.
 */
function clampRings(rings: GeoJSON.Position[][]): GeoJSON.Position[][][] | null {
    let outside = false;
    const clamped = rings.map(ring => ring.map(([lon, lat]) => {
        if (lon > HALF_WORLD || lon < -HALF_WORLD) outside = true;
        return [Math.min(Math.max(lon, -HALF_WORLD), HALF_WORLD), lat] as GeoJSON.Position;
    }));
    return outside ? [clamped] : null;
}

/**
 * Makes a ring's longitudes continuous and shifts it so it sits over the world,
 * or returns `null` when there is nothing to do or nothing safe to do.
 *
 * `null` covers two cases deliberately: a ring that is already inside the world
 * (the fast path — the great majority, and the one that must not be disturbed),
 * and a ring that travels a whole turn in longitude. The second is a ring
 * encircling a pole, which has no meridian to be cut at; Antarctica is one, and
 * cutting it would replace a correct outline with two wrong ones.
 */
function unwrapRing(ring: GeoJSON.Position[], nearLongitude?: number): GeoJSON.Position[] | null {
    if (ring.length < 4) return null;

    const continuous: GeoJSON.Position[] = [ring[0]];
    let outside = Math.abs(ring[0][0]) > HALF_WORLD;
    for (let i = 1; i < ring.length; i++) {
        const previous = continuous[i - 1][0];
        const lon = previous + shortestLongitudeStep(previous, ring[i][0]);
        outside ||= Math.abs(lon) > HALF_WORLD;
        continuous.push([lon, ring[i][1]]);
    }

    // A ring that ends close to a full turn from where it started goes round a
    // pole. The threshold is three quarters of a turn rather than a half, so a
    // merely very wide shape — a cartogram can stretch one right across the map
    // — is still cut at the date line rather than treated as polar.
    if (Math.abs(continuous[continuous.length - 1][0] - continuous[0][0]) > 1.5 * HALF_WORLD) return null;

    // Whole turns are taken out relative to where the ring should sit: the world
    // for a shell, its own shell for a hole, so a hole cannot be left one turn
    // away from the shape it belongs to.
    const turns = Math.round((meanLongitude(continuous) - (nearLongitude ?? 0)) / (2 * HALF_WORLD));
    if (!turns && !outside) return null;
    if (!turns) return continuous;
    return continuous.map(([lon, lat]) => [lon - turns * 2 * HALF_WORLD, lat] as GeoJSON.Position);
}

/** The mean longitude of a continuous ring — where it sits, in whole-turn terms. */
function meanLongitude(ring: GeoJSON.Position[]): number {
    let sum = 0;
    for (const [lon] of ring) sum += lon;
    return sum / ring.length;
}

/**
 * Cuts a ring to [-180, 180] after moving it `shift` degrees, returning `null`
 * when nothing of it lands there.
 *
 * Sutherland–Hodgman against two meridians. The clip region is convex, so the
 * cut is exact for any ring; a concave ring can come back with a zero-width
 * sliver along the meridian, which is the usual artefact of the algorithm and
 * invisible on a map.
 */
function clipToWorld(ring: GeoJSON.Position[], shift: number): GeoJSON.Position[] | null {
    const open = ring.length > 1
        && ring[0][0] === ring[ring.length - 1][0]
        && ring[0][1] === ring[ring.length - 1][1]
        ? ring.slice(0, -1)
        : ring;

    let clipped = shift ? open.map(([lon, lat]) => [lon + shift, lat] as GeoJSON.Position) : open;
    clipped = clipMeridian(clipped, -HALF_WORLD, true);
    clipped = clipMeridian(clipped, HALF_WORLD, false);
    if (clipped.length < 3) return null;

    const closed = [...clipped, clipped[0]];
    // A piece that survives only as a line on the cut is floating-point residue.
    if (Math.abs(ringSignedArea(closed)) < 1e-9) return null;
    return closed;
}

/** One Sutherland–Hodgman pass: keep what is east (`keepEast`) or west of `lon`. */
function clipMeridian(ring: GeoJSON.Position[], lon: number, keepEast: boolean): GeoJSON.Position[] {
    const inside = (p: GeoJSON.Position) => (keepEast ? p[0] >= lon : p[0] <= lon);
    const out: GeoJSON.Position[] = [];

    for (let i = 0; i < ring.length; i++) {
        const current = ring[i];
        const previous = ring[(i + ring.length - 1) % ring.length];
        if (inside(current) !== inside(previous)) {
            const t = (lon - previous[0]) / (current[0] - previous[0]);
            out.push([lon, previous[1] + t * (current[1] - previous[1])]);
        }
        if (inside(current)) out.push(current);
    }
    return out;
}

/** Signed shoelace area of a ring, in whatever units its coordinates are in. */
function ringSignedArea(ring: GeoJSON.Position[]): number {
    let sum = 0;
    for (let i = 0; i < ring.length - 1; i++) {
        sum += ring[i][0] * ring[i + 1][1] - ring[i + 1][0] * ring[i][1];
    }
    return sum / 2;
}

/** Keeps a longitude in [-180, 180] after the inverse projection. */
function normaliseLongitude(lon: number): number {
    if (lon > 180) return lon - 360 * Math.ceil((lon - 180) / 360);
    if (lon < -180) return lon + 360 * Math.ceil((-lon - 180) / 360);
    return lon;
}

/** Applies a coordinate function to every position of a geometry. */
export function mapGeometry(geometry: GeoJSON.Geometry, fn: (p: GeoJSON.Position) => GeoJSON.Position): GeoJSON.Geometry {
    const walk = (coords: unknown): unknown => {
        if (!Array.isArray(coords)) return coords;
        if (typeof coords[0] === 'number') return fn(coords as GeoJSON.Position);
        return coords.map(walk);
    };
    if (geometry.type === 'GeometryCollection') {
        return { ...geometry, geometries: geometry.geometries.map(g => mapGeometry(g, fn)) };
    }
    return { ...geometry, coordinates: walk((geometry as { coordinates: unknown }).coordinates) } as GeoJSON.Geometry;
}

/**
 * Resizes a lon/lat geometry about a point by a factor of *ground area*.
 *
 * The scaling happens in an equal-area plane centred on that point, so the
 * result's ground area is exactly `factor²` times the original — which is the
 * whole promise a cartogram makes. Doing it in lon/lat directly would scale
 * degrees, and a degree of longitude is not a fixed distance.
 */
function scaleOnSphere(
    geometry: GeoJSON.Geometry,
    factor: number,
    centre: GeoJSON.Position,
): GeoJSON.Geometry {
    const plane = equalAreaPlaneAt(centre);
    return mapGeometry(geometry, position => {
        const [x, y] = plane.forward(position);
        return plane.inverse([x * factor, y * factor]);
    });
}

/**
 * Grows every part of a feature *where it stands*, by one shared factor.
 *
 * Scaling a multipart feature about a single centroid — Olson's original —
 * multiplies the distances between its parts as well as their sizes, and that is
 * ruinous for a scattered one. Measured on world countries sized to equal area:
 * Tuvalu's nine islets have a centroid in open ocean and a scale factor of 136,
 * so they ended up flung across 45 million km², more than Russia; Kiribati,
 * which straddles the date line, collapsed to nothing. Scaling each part about
 * its own centre keeps the map recognisable and preserves the total exactly, since
 * every part's area is multiplied by the same factor².
 */
function scaleParts(geometry: GeoJSON.Geometry, factor: number): GeoJSON.Geometry {
    const parts = polygonsOf(geometry);
    if (parts.length <= 1) {
        const centre = centroidOfPolygons(parts);
        return centre ? scaleOnSphere(geometry, factor, centre) : geometry;
    }

    const scaled: GeoJSON.Position[][][] = [];
    for (const part of parts) {
        const centre = centroidOfPolygons([part]);
        if (!centre) continue;
        const grown = scaleOnSphere({ type: 'Polygon', coordinates: part }, factor, centre) as GeoJSON.Polygon;
        scaled.push(grown.coordinates);
    }
    return { type: 'MultiPolygon', coordinates: scaled };
}

/** A circle of a given ground radius, drawn on the sphere around a point. */
function circleOnSphere(centre: GeoJSON.Position, radius: number): GeoJSON.Polygon {
    const plane = equalAreaPlaneAt(centre);
    const ring: GeoJSON.Position[] = [];
    for (let i = 0; i <= CIRCLE_STEPS; i++) {
        const angle = (i / CIRCLE_STEPS) * 2 * Math.PI;
        ring.push(plane.inverse([radius * Math.cos(angle), radius * Math.sin(angle)]));
    }
    return { type: 'Polygon', coordinates: [ring] };
}

// ─── The cartogram ───────────────────────────────────────────────────────────

interface Unit {
    feature: GeoJSON.Feature;
    value: number;
    area: number;
    centre: GeoJSON.Position;
}

/**
 * Puts a geometry's coordinates back inside the world, or returns it untouched
 * when they already are.
 *
 * This is arithmetic, not a fit: nothing is scaled and nothing is clipped. A
 * longitude outside [-180, 180] has whole turns taken out of it — 657.5 and
 * -62.5 name the same meridian — and a latitude past a pole is pressed onto it.
 * Everything already legal is returned as the very same object, which matters
 * because the contiguous method is contiguous only while two neighbours' shared
 * boundary coordinates stay bit-identical.
 *
 * It exists because one bad coordinate anywhere in a layer silently changes what
 * the whole cartogram is. `@edugis/cartogram` decides whether its input is
 * geographic by testing the layer's *bounding box* against ±180.5/±90.5, and on
 * failure treats the data as an already-projected plane: it then warps raw
 * degrees, where area is not area, and skips its date-line unwrap, its
 * Equal Earth projection and the ±85 bound on its output. The result reaches the
 * renderer with latitudes past ±90 and the shapes at the corners of that plane —
 * Chile in the south-west, Chukotka in the north-east — are drawn as spikes to
 * the poles.
 *
 * Measured on the shipped `world-countries-simplified` layer, whose Antarctic
 * mainland ring closes along the pole line with a 1315-degree sweep (twenty
 * coordinates out to ±657.5 longitude, all of them at latitude -90, where a
 * longitude means nothing): median area error 58.4% and 111 of 265 countries
 * reaching past 89 degrees, against 12.8% and none once the layer is inside the
 * world.
 */
export function normaliseToWorld(geometry: GeoJSON.Geometry): GeoJSON.Geometry {
    let changed = false;
    const fixed = mapGeometry(geometry, ([lon, lat, ...rest]) => {
        const nLon = normaliseLongitude(lon);
        const nLat = Math.min(Math.max(lat, -90), 90);
        if (nLon !== lon || nLat !== lat) changed = true;
        return [nLon, nLat, ...rest];
    });
    return changed ? fixed : geometry;
}

/**
 * Collects the features a cartogram can be built from, and counts what it
 * cannot use.
 *
 * A feature is dropped for three different reasons, kept apart because they mean
 * different things to whoever chose the field: no value at all (the wrong field,
 * or a gap in the data), a value of zero or less (nothing to draw — a cartogram
 * has no way to show a negative area), and no area to scale (a point or line
 * layer, or a collapsed polygon).
 */
function unitsOf(
    input: GeoJSON.FeatureCollection,
    field: string,
    minValuePercent = 0,
    minPartPercent = 0,
): { units: Unit[]; skipped: CartogramResult['skipped']; droppedParts: CartogramResult['droppedParts'] } {
    const units: Unit[] = [];
    const skipped = { missingValue: 0, zeroValue: 0, negativeValue: 0, noArea: 0, belowMinimum: 0 };
    // Counted over the whole layer rather than per feature, because the question
    // it answers is "how much of this map did the threshold take away".
    let partsDropped = 0;
    let areaDropped = 0;
    let areaSeen = 0;

    for (const rawFeature of input.features) {
        // Small parts go before anything measures the feature, so the area, the
        // centroid and the target area all describe the shape that will actually
        // be drawn. Filtering afterwards would size the output by an area it no
        // longer has.
        const trimmed = rawFeature.geometry
            ? dropSmallParts(rawFeature.geometry, minPartPercent / 100)
            : null;
        if (trimmed) {
            partsDropped += trimmed.dropped;
            areaDropped += trimmed.areaDropped;
        }
        // Normalised before anything measures it, so the area, the centroid and
        // every method downstream all see the same, legal, geometry.
        const feature = trimmed
            ? { ...rawFeature, geometry: normaliseToWorld(trimmed.geometry) }
            : rawFeature;
        const raw = feature.properties?.[field];
        // `Number` is only trusted on things that are meant to be read as
        // numbers. A boolean would otherwise arrive as 1 and take part in the
        // cartogram as if it were a count, which is not a value the field holds
        // — it is the wrong field, and saying so is the useful answer.
        const value = typeof raw === 'number' || typeof raw === 'string' ? Number(raw) : NaN;
        if (raw === null || raw === undefined || raw === '' || !Number.isFinite(value)) {
            skipped.missingValue++;
            continue;
        }
        // Zero and negative are told apart on the *number*, never on falsiness:
        // `!value` would count a real zero as a missing value and report the
        // layer as broken when it is merely uninhabited.
        if (value === 0) {
            skipped.zeroValue++;
            continue;
        }
        if (value < 0) {
            skipped.negativeValue++;
            continue;
        }
        const area = featureArea(feature.geometry);
        const centre = featureCentroid(feature.geometry);
        if (!area || !centre) {
            skipped.noArea++;
            continue;
        }
        areaSeen += area;
        units.push({ feature, value, area, centre });
    }

    const droppedParts = {
        count: partsDropped,
        areaShare: areaSeen + areaDropped > 0 ? areaDropped / (areaSeen + areaDropped) : 0,
    };

    // The minimum is a share of the total rather than an absolute number, so it
    // means the same thing for a layer of people, of euros and of votes, and so
    // it survives a change of units. Applied after collecting, because the total
    // is not known until then.
    if (minValuePercent > 0 && units.length) {
        const floor = (units.reduce((sum, u) => sum + u.value, 0) * minValuePercent) / 100;
        const kept = units.filter(u => u.value >= floor);
        skipped.belowMinimum = units.length - kept.length;
        return { units: kept, skipped, droppedParts };
    }

    return { units, skipped, droppedParts };
}

/**
 * Builds a cartogram.
 *
 * The value is turned into a target area through one shared factor — total
 * input area divided by total value — so the map keeps its overall size and only
 * the *distribution* of area changes. That is what makes two cartograms of the
 * same layer comparable, and what stops a layer measured in millions from
 * producing shapes the size of a continent.
 */
export async function cartogram(input: GeoJSON.FeatureCollection, options: CartogramOptions): Promise<CartogramResult> {
    // Only the methods that deform a shape can shear a small part into a
    // filament, so only they pay for the threshold. `scaled` keeps every outline
    // exactly and would be breaking its own promise by dropping one; `dorling`
    // replaces the outline with a circle, so its parts never reach the output in
    // the first place and removing them would change nothing but the centroid.
    const deforms = options.method !== 'scaled' && options.method !== 'dorling';
    const minPartPercent = deforms ? options.minPartPercent ?? DEFAULT_MIN_PART_PERCENT : 0;

    const { units, skipped, droppedParts } = unitsOf(
        input,
        options.field,
        options.minValuePercent ?? 0,
        minPartPercent,
    );
    if (!units.length) {
        throw new Error(`No features have a usable number in "${options.field}".`);
    }

    const totalArea = units.reduce((sum, u) => sum + u.area, 0);
    const totalValue = units.reduce((sum, u) => sum + u.value, 0);
    const areaPerValue = totalArea / totalValue;

    // `flow` reports its own error, because it is the one method that does not
    // equalise areas on the sphere: it equalises them in the plane the map is
    // drawn in, which is the whole point of it, and measuring that result
    // against spherical areas would report a 96% error on a map that is exactly
    // right — as it did, on Web Mercator, before this existed.
    let planeError: number | null = null;
    let methodWarnings: string[] = [];

    const features = options.method === 'dorling'
        ? dorling(units, areaPerValue, options.iterations ?? DEFAULT_ITERATIONS)
        : options.method === 'scaled'
            ? scaled(units, areaPerValue)
            : options.method === 'contiguous'
                ? contiguous(units, areaPerValue, options.passes ?? DEFAULT_PASSES)
                : options.method === 'flow'
                    ? (() => {
                        const flow = edugisFlow(units, options.onProgress);
                        planeError = flow.medianAreaError;
                        methodWarnings = flow.warnings;
                        return flow.features;
                    })()
                    : await diffusion(units, options.wasmUrl);

    // Every method works in a metric plane and can push a shape past the edge of
    // it, so the date line is dealt with once, here, rather than in each of them.
    // Measured before the error is: a ring folded across the seam has an area
    // that means nothing, and it was that, not the algorithm, that made the
    // reported error on a world layer four times what it really was.
    const wrapped = features.map(feature => (feature.geometry
        ? { ...feature, geometry: wrapToWorld(feature.geometry) }
        : feature));

    return {
        features: { type: 'FeatureCollection', features: wrapped },
        skipped,
        droppedParts,
        medianAreaError: planeError ?? medianAreaError(wrapped, units, areaPerValue),
        methodWarnings,
    };
}

/**
 * The flow-based (diffusion) cartogram — Gastner, Seguy and More (2018), the
 * algorithm behind Worldmapper, run through `go-cart-wasm` (the authors' own
 * reference implementation compiled to WASM).
 *
 * It is the method to use when the numbers matter. Where the Dougenik rubber
 * sheet below converges towards the target areas and leaves a tail — measured on
 * 265 countries sized by population, a tenth of them still 15% out and the
 * extremes far worse — diffusion solves the density-equalising flow itself and
 * hits every target essentially exactly. It is also smoother, because the whole
 * plane is transported rather than boundary points being pushed about.
 *
 * The library requires input in an **equal-area projection** (its own README
 * says so): it measures area in the plane it is given, so degrees, or Mercator,
 * would hand it the wrong numbers to equalise. It gets the same shared plane the
 * rubber sheet uses.
 */
async function diffusion(units: Unit[], wasmUrl?: string): Promise<GeoJSON.Feature[]> {
    const GoCart = await loadGoCart(wasmUrl);
    const plane = sharedPlaneFor(units);

    // The value goes in as a plain property under a name of our choosing, so a
    // layer whose own attributes happen to collide with it cannot confuse the
    // library, and the original properties are put back afterwards by index.
    const input: GeoJSON.FeatureCollection = {
        type: 'FeatureCollection',
        features: units.map((unit, index) => ({
            type: 'Feature',
            properties: { [VALUE_FIELD]: unit.value, [INDEX_FIELD]: index },
            geometry: rewindForGoCart(mapGeometry(unit.feature.geometry!, p => plane.forward(p))),
        })),
    };

    const output = GoCart.makeCartogram(input, VALUE_FIELD) as GeoJSON.FeatureCollection;

    return output.features.map((feature, position) => {
        const index = Number(feature.properties?.[INDEX_FIELD] ?? position);
        // go-cart reports a polygon it could not place by writing `{}` rather
        // than by failing, so an unchecked run turns into an empty layer with no
        // explanation. Rewinding above is what prevents it; this is the alarm.
        if (!feature.geometry || !('coordinates' in feature.geometry)) {
            throw new Error('The diffusion cartogram could not use this layer\'s geometry. Try the classic method, or repair the polygons first.');
        }
        return {
            type: 'Feature' as const,
            properties: { ...(units[index]?.feature.properties ?? {}) },
            geometry: mapGeometry(feature.geometry, p => plane.inverse(p)),
        };
    });
}

/**
 * The same flow-based cartogram, computed by `@edugis/cartogram` instead of by
 * the go-cart WASM binary.
 *
 * Kept as a separate method rather than replacing `diffusion` because which of
 * the two survives a given layer is exactly the question: go-cart is a C
 * implementation reached through WASM that reports failure by writing back an
 * empty geometry, and on some real inputs it returns a tangle of crossing lines
 * instead of a map.
 *
 * **Nothing is projected here.** GeoJSON goes in and GeoJSON comes back: the
 * library projects to an equal-area plane, warps, and unprojects, all of it
 * inside. This file used to do that work itself — project to Equal Earth with
 * proj4, run the library on the plane with `projection: 'none'`, shrink the
 * whole map until every point had a latitude again, and unproject — because
 * before `@edugis/cartogram@0.1.3` the library returned coordinates past ±90 on
 * a world layer and clamping them pressed thousands of points onto the pole
 * line. It now bounds its own output (`fitLatitude`) and picks Equal Earth for
 * world-scale data itself, so all of that came out: two hundred lines, and this
 * file's only use of proj4.
 *
 * The accuracy did not suffer for it. Measured on 177 world countries by
 * population, ground-area error against value: 0.440% median through the library
 * on its own against 0.447% through the old hand-rolled route.
 *
 * Values arrive already filtered to positive numbers by `unitsOf`, hence
 * `missing: 'error'`: a gap here would be a bug in this file, not in the data.
 */
function edugisFlow(
    units: Unit[],
    onProgress?: (areaError: number) => void,
): { features: GeoJSON.Feature[]; medianAreaError: number; warnings: string[] } {
    // The value goes in as a plain property under a name of our choosing, so a
    // layer whose own attributes happen to collide with it cannot confuse the
    // library, and the original properties are put back afterwards by index.
    const input: GeoJSON.FeatureCollection = {
        type: 'FeatureCollection',
        features: units.map((unit, index) => ({
            type: 'Feature',
            properties: { [VALUE_FIELD]: unit.value, [INDEX_FIELD]: index },
            geometry: unit.feature.geometry!,
        })),
    };

    const result = edugisCartogram(input, {
        method: 'flow',
        value: VALUE_FIELD,
        missing: 'error',
        metrics: true,
        // A region smaller than one grid cell cannot be represented in the
        // density field at all: it owns no cell, exerts no pressure, and is
        // dragged along by its neighbours instead of growing. The library's
        // fixed default of 512 is far too coarse for a world layer, where a cell
        // is ~13 000 km² — measured on world countries plus a Greater-London-
        // sized region and a Paris-sized one, at 512 London grew 39x and Paris
        // *shrank to a tenth* of its size, which reads as the region having been
        // ignored. `auto` sizes the grid so the smallest region carrying real
        // value gets a cell (clamped to 1024, never below the 512 default): the
        // same layer then grows London 57x and Paris 134x, and the median area
        // error falls from 1.9% to 0.7%.
        //
        // It costs runtime — 11.5 s to 42 s on that layer — which is why the
        // panel has a cancel button and an elapsed clock. A cartogram that
        // quietly leaves out the densest places on the map is not worth the
        // seconds it saves.
        grid: 'auto',
        ...(onProgress ? { onIteration: (iteration: number) => onProgress(iteration) } : {}),
    });

    // The index goes in and comes back rather than the order being trusted, the
    // same way `diffusion` does it. Position happens to be preserved today, and
    // if it ever stops being — a feature dropped, a collection re-ordered — every
    // region would silently inherit its neighbour's attributes, which renders
    // perfectly and is wrong everywhere. The fallback to `position` covers a
    // library that strips unknown properties: no worse than before.
    const features = result.featureCollection.features.map((feature, position) => {
        const index = Number(feature.properties?.[INDEX_FIELD] ?? position);
        return {
            type: 'Feature' as const,
            properties: { ...(units[index]?.feature.properties ?? {}) },
            geometry: feature.geometry!,
        };
    });

    // The library's own warnings, which name the one failure this file cannot
    // see from outside: features still under a grid cell even at `auto`'s
    // ceiling, whose areas are therefore quantized to the grid. Dropping them
    // was how a shrunken Paris looked like a correct result.
    //
    // All but the fit-to-world one, which fires on every world-scale layer —
    // the flow always pushes something past 85° — and says in its own words
    // that relative areas are unchanged. It reports a recentring the reader
    // cannot act on and would not notice, and a warning shown every single run
    // is one nobody reads by the time it matters. Matched on its text because
    // the library has no warning codes; an unrecognised warning is passed on,
    // so a new one is surfaced rather than swallowed.
    const warnings = (result.warnings ?? []).filter(w => !w.includes('reached outside the world'));

    return {
        features,
        medianAreaError: valueWeightedError(result.diagnostics),
        warnings,
    };
}

/**
 * How wrong the map is where the reader can see it.
 *
 * Each feature's own error, weighted by its share of the total value — which in
 * a cartogram is its share of the finished map, since sizing area by value is
 * the whole exercise. So this is the error of the picture, not the average of
 * the errors of its parts.
 *
 * The library reports mean, median and p90 over features, all unweighted, and
 * on real data they say something quite different from what the map looks like:
 * a region whose value is too small to give it a grid cell cannot be sized
 * accurately, and a world layer has hundreds of them. They are simultaneously
 * the worst-measured and the least visible, so they run away with any statistic
 * that counts every feature once.
 *
 * `error` is Nusrat & Kobourov's |o - w| / max(o, w) on normalized areas, so it
 * is already a fraction per feature and the weights sum to one: the result is on
 * the same 0-1 scale as the numbers it replaces, and a caller's threshold still
 * means what it meant.
 */
function valueWeightedError(diagnostics: Array<{ value: number; error: number }> | undefined): number {
    if (!diagnostics || diagnostics.length === 0) return 0;
    let valueSum = 0;
    for (const d of diagnostics) if (Number.isFinite(d.value) && d.value > 0) valueSum += d.value;
    // Nothing to weight with: fall back to counting every feature once, which is
    // the best available answer rather than a silent zero.
    if (!(valueSum > 0)) {
        return diagnostics.reduce((sum, d) => sum + (Number.isFinite(d.error) ? d.error : 0), 0) / diagnostics.length;
    }
    let weighted = 0;
    for (const d of diagnostics) {
        if (!Number.isFinite(d.error) || !Number.isFinite(d.value) || d.value <= 0) continue;
        weighted += d.error * (d.value / valueSum);
    }
    return weighted;
}

/**
 * Winds every outer ring clockwise and every hole counter-clockwise, which is
 * what go-cart expects.
 *
 * Not cosmetic, and not optional: given a counter-clockwise outer ring the
 * library decides the polygon is a hole, prints `n_polyinreg[i] = 1 while
 * n_holes = 1` to stdout and writes the feature back with an **empty geometry
 * object** — no exception, no missing feature, just a layer of blanks. RFC 7946
 * asks for the opposite winding to this, so correct GeoJSON is precisely the
 * input that fails; the world-countries fixture happens to be clockwise, which
 * is why this only showed up on a hand-built test grid.
 */
function rewindForGoCart(geometry: GeoJSON.Geometry): GeoJSON.Geometry {
    const wind = (ring: GeoJSON.Position[], clockwise: boolean): GeoJSON.Position[] => {
        let sum = 0;
        // Wraps to the first point rather than stopping one short, so an unclosed
        // ring is measured over the edge that closes it too. A ring that is
        // closed contributes nothing extra (the final term is the degenerate
        // point-to-itself edge); one that is not would otherwise lose a whole
        // edge from the shoelace sum, and a thin ring can lose its sign that way
        // — which here means go-cart takes the outer ring for a hole and hands
        // the feature back with an empty geometry and no error.
        for (let i = 0; i < ring.length; i++) {
            const next = ring[(i + 1) % ring.length];
            sum += ring[i][0] * next[1] - next[0] * ring[i][1];
        }
        // Positive shoelace area means counter-clockwise in a y-up plane.
        return (sum > 0) === clockwise ? [...ring].reverse() : ring;
    };
    const polygon = (rings: GeoJSON.Position[][]) => rings.map((ring, index) => wind(ring, index === 0));

    if (geometry.type === 'Polygon') return { ...geometry, coordinates: polygon(geometry.coordinates) };
    if (geometry.type === 'MultiPolygon') return { ...geometry, coordinates: geometry.coordinates.map(polygon) };
    return geometry;
}

/** The typical gap between the area a feature got and the area its value asked for. */
function medianAreaError(features: GeoJSON.Feature[], units: Unit[], areaPerValue: number): number {
    if (!features.length) return 0;
    const errors = features
        .map((feature, index) => {
            const target = (units[index]?.value ?? 0) * areaPerValue;
            if (!target) return null;
            return Math.abs(featureArea(feature.geometry) - target) / target;
        })
        .filter((value): value is number => value !== null)
        .sort((a, b) => a - b);
    return errors.length ? errors[errors.length >> 1] : 0;
}

/** Property names handed to go-cart, kept out of the way of the layer's own. */
const VALUE_FIELD = '__webmapx_value';
const INDEX_FIELD = '__webmapx_index';

interface GoCartModule {
    makeCartogram(input: GeoJSON.FeatureCollection, field: string): GeoJSON.FeatureCollection;
}

/**
 * Loaded modules, keyed by the wasm url they were built from.
 *
 * Keyed rather than a single slot because the url is the one thing that decides
 * *which* binary this is: caching the first answer under no key would hand a
 * later caller a module loaded from somewhere else, silently and with no way to
 * tell from the result. One entry is the normal case (the worker passes one
 * bundler-resolved url for the life of the page); the map only matters when
 * that assumption stops holding.
 */
const goCartLoading = new Map<string, Promise<GoCartModule>>();

/**
 * Loads the WASM module once per url and keeps it — it costs a fetch and a
 * compile, and a cartogram is usually built more than once while a student
 * tries fields.
 *
 * Imported dynamically so nothing pays for a megabyte of WASM until a diffusion
 * cartogram is actually asked for, and so this module stays importable from
 * plain Node (tests, scripts) where a bundler-resolved URL does not exist.
 */
function loadGoCart(wasmUrl?: string): Promise<GoCartModule> {
    const key = wasmUrl ?? '';
    const loaded = goCartLoading.get(key);
    if (loaded) return loaded;

    const loading = import('go-cart-wasm')
        .then(module => module.default(wasmUrl ? { locateFile: () => wasmUrl } : undefined))
        .catch(error => {
            // Dropped so a transient failure (a lost network, a stale cache) can
            // be retried rather than poisoning every later run.
            goCartLoading.delete(key);
            throw error;
        });
    goCartLoading.set(key, loading);
    return loading;
}

/** How close the achieved area has to be to the target before scaling stops. */
const AREA_TOLERANCE = 1e-4;
const MAX_AREA_PASSES = 4;

/** Rounds of rubber-sheeting when the caller does not say. */
const DEFAULT_PASSES = 12;

/** Below this mean size error, more passes are not worth the wait. */
const CONTIGUOUS_GOOD_ENOUGH = 0.02;

/**
 * The contiguous cartogram — the one that still looks like a map, with every
 * country still touching its neighbours.
 *
 * Dougenik, Chrisman and Niemeyer's rubber sheet (1985), the algorithm behind
 * mapshaper's and ArcGIS's cartograms. Each region gets a force field: points
 * near a region that must grow are pushed outwards, points near one that must
 * shrink are pulled in, and **every boundary point is moved by the sum of the
 * forces from all regions**. That last part is what makes it contiguous —
 * neighbours do not each solve their own problem, they solve one shared one.
 *
 * Borders stay joined because the displacement is a function of *position*
 * alone: two countries that share a border share those coordinates, so both
 * copies move identically. The same caveat as topology-aware simplification
 * applies — coordinates have to match exactly, and data whose shared borders
 * differ by a millimetre will pull apart.
 *
 * Not the diffusion method (Gastner–Newman) that Worldmapper uses. That one
 * needs an FFT over a grid and a WASM library; this is a hundred lines, needs no
 * dependency, and produces the same *kind* of map.
 */
function contiguous(units: Unit[], areaPerValue: number, passes: number): GeoJSON.Feature[] {
    // One shared plane, because every point moves under every region's force.
    // Equal-area, so the areas driving the forces are ground areas.
    const plane = sharedPlaneFor(units);

    // Every coordinate of every region goes into two flat arrays, with the ring
    // structure kept as index ranges beside them. Not premature optimisation:
    // this is an all-points-against-all-regions loop — 30 000 points and 265
    // countries is eight million force evaluations *per pass* — and arrays of
    // [x, y] arrays spent more time chasing pointers than doing arithmetic. Flat
    // Float64Arrays and a hand-rolled `sqrt` (rather than `Math.hypot`, which is
    // several times slower because it guards against overflow) took a 12-pass
    // world from 31 seconds to under 3.
    const sheet = flattenToSheet(units, plane, areaPerValue);
    const { xs, ys, ringStart, ringEnd, shapes } = sheet;

    // One circle per *feature*, at its centroid — Dougenik's model, kept despite
    // its known weakness: a country whose islands are scattered across an ocean
    // has no meaningful centroid, and the disc drawn at it pushes its neighbours
    // around. Dropping such islands from the input takes the 90th-percentile area
    // error on 253 world countries from 71% to 12%, so the weakness is real and
    // measurable. Making each *part* a source of its own is the obvious fix and
    // does not work: `mass` goes as the square root of the area, so splitting a
    // feature into k parts multiplies the layer's total force by about √k and the
    // sheet runs away — measured, the median error went from 2.5% to 100%. A
    // correct fix has to renormalise the force, which is a change to the method
    // rather than to this loop.
    const centreX = new Float64Array(shapes.length);
    const centreY = new Float64Array(shapes.length);
    const radius = new Float64Array(shapes.length);
    const mass = new Float64Array(shapes.length);

    for (let pass = 0; pass < passes; pass++) {
        let totalError = 0;
        for (let s = 0; s < shapes.length; s++) {
            const shape = shapes[s];
            const area = shapeArea(shape, xs, ys, ringStart, ringEnd);
            const centre = shapeCentroid(shape, xs, ys, ringStart, ringEnd);
            centreX[s] = centre[0];
            centreY[s] = centre[1];
            radius[s] = Math.sqrt(Math.abs(area) / Math.PI);
            mass[s] = Math.sqrt(shape.target / Math.PI) - radius[s];
            totalError += Math.abs(shape.target - area) / Math.max(shape.target, area, 1);
        }

        const meanError = totalError / shapes.length;
        if (meanError < CONTIGUOUS_GOOD_ENOUGH) break;

        // Damping. Without it the sheet overshoots and oscillates — 20 undamped
        // passes came out worse than 12. Dougenik ties the step to how wrong the
        // map still is, so early passes move boldly and later ones settle.
        const damping = 1 / (1 + meanError);

        for (let i = 0; i < xs.length; i++) {
            const x = xs[i];
            const y = ys[i];
            let dx = 0;
            let dy = 0;
            for (let s = 0; s < shapes.length; s++) {
                const r = radius[s];
                if (r <= 0) continue;
                const ox = x - centreX[s];
                const oy = y - centreY[s];
                const distance = Math.sqrt(ox * ox + oy * oy);
                if (distance < 1e-9) continue;

                // Dougenik's force: outside a region it falls off as 1/distance,
                // so a region's influence is real but local; inside, it eases
                // from nothing at the centre to full strength at the edge, which
                // is what stops a growing region from turning inside out.
                const ratio = distance / r;
                const force = distance > r
                    ? mass[s] / ratio
                    : mass[s] * ratio * ratio * (4 - 3 * ratio);
                dx += (ox / distance) * force;
                dy += (oy / distance) * force;
            }
            xs[i] = x + dx * damping;
            ys[i] = y + dy * damping;
        }
    }

    return shapes.map(shape => ({
        type: 'Feature' as const,
        properties: { ...(shape.unit.feature.properties ?? {}) },
        geometry: rebuildGeometry(shape.polygons.map(polygon => polygon.map(ringIndex => {
            const ring: GeoJSON.Position[] = [];
            for (let i = ringStart[ringIndex]; i < ringEnd[ringIndex]; i++) {
                ring.push(plane.inverse([xs[i], ys[i]]));
            }
            return ring;
        }))),
    }));
}

interface SheetShape {
    unit: Unit;
    target: number;
    /** Polygons, each a list of ring indices into `ringStart`/`ringEnd`. */
    polygons: number[][];
}

interface Sheet {
    xs: Float64Array;
    ys: Float64Array;
    ringStart: Int32Array;
    ringEnd: Int32Array;
    shapes: SheetShape[];
}

/** Projects every region into the working plane and lays it out flat. */
function flattenToSheet(units: Unit[], plane: EqualAreaPlane, areaPerValue: number): Sheet {
    const x: number[] = [];
    const y: number[] = [];
    const starts: number[] = [];
    const ends: number[] = [];
    const shapes: SheetShape[] = [];

    for (const unit of units) {
        const polygons: number[][] = [];
        for (const polygon of polygonsOf(unit.feature.geometry)) {
            const ringIndices: number[] = [];
            for (const ring of polygon) {
                starts.push(x.length);
                for (const position of ring) {
                    const [px, py] = plane.forward(position);
                    x.push(px);
                    y.push(py);
                }
                ends.push(x.length);
                ringIndices.push(starts.length - 1);
            }
            polygons.push(ringIndices);
        }
        shapes.push({ unit, target: unit.value * areaPerValue, polygons });
    }

    return {
        xs: Float64Array.from(x),
        ys: Float64Array.from(y),
        ringStart: Int32Array.from(starts),
        ringEnd: Int32Array.from(ends),
        shapes,
    };
}

/** Area of one shape, read straight out of the flat arrays. */
function shapeArea(shape: SheetShape, xs: Float64Array, ys: Float64Array, ringStart: Int32Array, ringEnd: Int32Array): number {
    let total = 0;
    for (const polygon of shape.polygons) {
        let outer = 0;
        let holes = 0;
        polygon.forEach((ringIndex, position) => {
            const area = Math.abs(ringArea(ringIndex, xs, ys, ringStart, ringEnd));
            if (position === 0) outer = area;
            else holes += area;
        });
        total += Math.max(outer - holes, 0);
    }
    return total;
}

function ringArea(ringIndex: number, xs: Float64Array, ys: Float64Array, ringStart: Int32Array, ringEnd: Int32Array): number {
    let sum = 0;
    for (let i = ringStart[ringIndex]; i < ringEnd[ringIndex] - 1; i++) {
        sum += xs[i] * ys[i + 1] - xs[i + 1] * ys[i];
    }
    return sum / 2;
}

/** Area-weighted centroid of one shape, read straight out of the flat arrays. */
function shapeCentroid(shape: SheetShape, xs: Float64Array, ys: Float64Array, ringStart: Int32Array, ringEnd: Int32Array): [number, number] {
    let sumX = 0, sumY = 0, sumWeight = 0;
    for (const polygon of shape.polygons) {
        const ringIndex = polygon[0];
        if (ringIndex === undefined) continue;
        let cx = 0, cy = 0, area = 0;
        for (let i = ringStart[ringIndex]; i < ringEnd[ringIndex] - 1; i++) {
            const cross = xs[i] * ys[i + 1] - xs[i + 1] * ys[i];
            area += cross;
            cx += (xs[i] + xs[i + 1]) * cross;
            cy += (ys[i] + ys[i + 1]) * cross;
        }
        area /= 2;
        if (Math.abs(area) < 1e-12) continue;
        const weight = Math.abs(area);
        sumX += (cx / (6 * area)) * weight;
        sumY += (cy / (6 * area)) * weight;
        sumWeight += weight;
    }
    if (!sumWeight) return [0, 0];
    return [sumX / sumWeight, sumY / sumWeight];
}

function rebuildGeometry(polygons: GeoJSON.Position[][][]): GeoJSON.Geometry {
    return polygons.length === 1
        ? { type: 'Polygon', coordinates: polygons[0] }
        : { type: 'MultiPolygon', coordinates: polygons };
}

/** Olson's non-contiguous cartogram: every shape kept, resized where it stands. */
function scaled(units: Unit[], areaPerValue: number): GeoJSON.Feature[] {
    return units.map(unit => {
        const target = unit.value * areaPerValue;
        // Area scales with the square of a linear factor, hence the square root.
        let factor = Math.sqrt(target / unit.area);
        let geometry = scaleParts(unit.feature.geometry as GeoJSON.Geometry, factor);

        // One factor is not quite enough, because a ring's edges are straight in
        // lon/lat and scaling bends them: the bigger the change, the further the
        // result drifts from factor² (0.0001% for a half-degree shape, 3.5% for
        // a city state blown up to the size of a country). Measuring the result
        // and correcting converges in a pass or two, and costs one area sum.
        for (let pass = 0; pass < MAX_AREA_PASSES; pass++) {
            const achieved = featureArea(geometry);
            if (!achieved) break;
            const error = achieved / target - 1;
            if (Math.abs(error) < AREA_TOLERANCE) break;
            factor *= Math.sqrt(target / achieved);
            geometry = scaleParts(unit.feature.geometry as GeoJSON.Geometry, factor);
        }

        return {
            type: 'Feature' as const,
            properties: { ...(unit.feature.properties ?? {}), cartogram_scale: round(factor) },
            geometry,
        };
    });
}

/**
 * Dorling's circles: one per feature, sized by value, pushed apart until they
 * stop overlapping.
 *
 * The separation is the whole algorithm. Circles start at their feature's
 * centre, and each round moves every overlapping pair apart by half their
 * overlap, so a dense cluster spreads outward while the arrangement stays
 * roughly geographic. It converges quickly and is stopped by a round count
 * rather than a threshold: an exact solution may not exist, and a student
 * waiting on a map does not care whether the last micrometre was resolved.
 */
function dorling(units: Unit[], areaPerValue: number, iterations: number): GeoJSON.Feature[] {
    // The circles are laid out in one shared equal-area plane — they have to be
    // pushed apart relative to each other, so a per-feature plane is no use here.
    // A cylindrical equal-area projection with its standard parallel at the mean
    // latitude of the data keeps distances honest through the middle of the
    // layer, and squashes them north and south of it; for a layer spanning the
    // globe the arrangement near the poles is approximate.
    const meanLatitude = units.reduce((sum, u) => sum + u.centre[1], 0) / units.length;
    const meanLongitude = units.reduce((sum, u) => sum + u.centre[0], 0) / units.length;
    const plane = cylindricalEqualAreaPlane(meanLongitude, meanLatitude);

    const circles = units.map(unit => {
        const [x, y] = plane.forward(unit.centre);
        return { unit, x, y, r: Math.sqrt((unit.value * areaPerValue) / Math.PI) };
    });

    for (let round = 0; round < iterations; round++) {
        let moved = false;
        for (let i = 0; i < circles.length; i++) {
            for (let j = i + 1; j < circles.length; j++) {
                const a = circles[i], b = circles[j];
                let dx = b.x - a.x;
                let dy = b.y - a.y;
                let distance = Math.hypot(dx, dy);
                const wanted = a.r + b.r;
                if (distance >= wanted) continue;

                // Coincident centres have no direction to separate along — two
                // features with the same centroid is rare but not impossible, and
                // dividing by zero would put both circles at NaN and lose them.
                if (distance < 1e-9) {
                    dx = 1;
                    dy = 0;
                    distance = 1;
                }
                const shift = (wanted - distance) / 2;
                const ux = (dx / distance) * shift;
                const uy = (dy / distance) * shift;
                a.x -= ux; a.y = clampToPlane(a.y - uy, plane);
                b.x += ux; b.y = clampToPlane(b.y + uy, plane);
                moved = true;
            }
        }
        if (!moved) break;
    }

    return circles.map(circle => {
        // Back to lon/lat, then drawn as a true circle on the sphere around that
        // point rather than as an ellipse inherited from the layout plane.
        const centre = plane.inverse([circle.x, circle.y]);
        return {
            type: 'Feature' as const,
            properties: {
                ...(circle.unit.feature.properties ?? {}),
                cartogram_radius_m: Math.round(circle.r),
            },
            geometry: circleOnSphere(centre, circle.r),
        };
    });
}

/**
 * Keeps a circle centre off the poles.
 *
 * A crowded layout pushes circles north and south until they run out of planet:
 * the plane has a top and a bottom, and a centre past them comes back as a
 * circle sitting on the pole, wrapped right round it. Stopping short of ±88°
 * costs nothing — a circle that big is a data artefact — and avoids geometry
 * nobody can read.
 */
function clampToPlane(y: number, plane: EqualAreaPlane): number {
    const limit = plane.forward([0, 88])[1];
    return Math.min(Math.max(y, -limit), limit);
}

/**
 * The shared plane a layout runs in, chosen to fit the data.
 *
 * A shared plane has to be equal-area — that is what makes the areas driving the
 * forces real — but it also has to keep *shape* roughly honest, because the
 * forces are isotropic: a plane that squashes one direction turns an even push
 * into a lopsided one. The cylindrical projection fails badly at that. It
 * compresses latitude towards the poles, so a modest force becomes an enormous
 * change in latitude: rubber-sheeting the world with it left Lesotho sitting on
 * the South Pole and dragged France down to the tropics.
 *
 * So: a local layer gets an azimuthal equal-area plane centred on it, which is
 * very nearly isotropic across a few hundred kilometres; a layer spanning the
 * globe gets Equal Earth, the projection designed for exactly this — equal-area
 * with shapes that still look like the places they are.
 */
function sharedPlaneFor(units: Unit[]): EqualAreaPlane {
    let minLon = Infinity, maxLon = -Infinity, minLat = Infinity, maxLat = -Infinity;
    let sumLon = 0, sumLat = 0;
    for (const { centre } of units) {
        minLon = Math.min(minLon, centre[0]);
        maxLon = Math.max(maxLon, centre[0]);
        minLat = Math.min(minLat, centre[1]);
        maxLat = Math.max(maxLat, centre[1]);
        sumLon += centre[0];
        sumLat += centre[1];
    }
    const spread = Math.max(maxLon - minLon, maxLat - minLat);
    const centre: GeoJSON.Position = [sumLon / units.length, sumLat / units.length];
    return spread < 40 ? equalAreaPlaneAt(centre) : equalEarthPlane(centre[0]);
}

/**
 * Equal Earth (Šavrič, Patterson & Jenny 2018), as a metric plane.
 *
 * Equal-area — required here — while keeping continents the shape people
 * recognise, which is why it has become the default for world thematic maps.
 * The forward direction is a polynomial; the inverse has no closed form, so it
 * solves for the parametric latitude by Newton's method, which converges in
 * three or four steps.
 */
function equalEarthPlane(lon0: number): EqualAreaPlane {
    const A1 = 1.340264, A2 = -0.081106, A3 = 0.000893, A4 = 0.003796;
    const M = Math.sqrt(3) / 2;
    const poly = (t: number) => A1 + A2 * t * t + t ** 6 * (A3 + A4 * t * t);
    const polyDerivative = (t: number) => A1 + 3 * A2 * t * t + t ** 6 * (7 * A3 + 9 * A4 * t * t);

    return {
        forward([lon, lat]) {
            const lambda = shortestLongitudeStep(lon0, lon) * RAD;
            const theta = Math.asin(M * Math.sin(lat * RAD));
            return [
                (EARTH_RADIUS * lambda * Math.cos(theta)) / (M * polyDerivative(theta)),
                EARTH_RADIUS * theta * poly(theta),
            ];
        },
        inverse([x, y]) {
            let theta = y / EARTH_RADIUS;
            for (let i = 0; i < 12; i++) {
                const f = theta * poly(theta) - y / EARTH_RADIUS;
                const df = polyDerivative(theta);
                const step = f / df;
                theta -= step;
                if (Math.abs(step) < 1e-12) break;
            }
            // Past the poles the parametric latitude runs out of range; clamping
            // keeps a point that has been pushed too far on the map instead of
            // turning it into NaN.
            const sinLat = Math.min(Math.max(Math.sin(theta) / M, -1), 1);
            // cos(theta) reaches zero at the poles, where a longitude no longer
            // exists: a point pushed that far would come back as Infinity and
            // take every later step with it. The floor keeps it a number.
            const lambda = (M * x * polyDerivative(theta)) / (EARTH_RADIUS * Math.max(Math.cos(theta), 1e-6));
            // Deliberately *not* folded back into [-180, 180]: a cartogram pushes
            // coordinates past the edge of the plane, and folding each point on
            // its own tears the ring in half — the two pieces then join up the
            // wrong way round the globe. `wrapToWorld` cuts the ring instead.
            return [lon0 + lambda * DEG, Math.asin(sinLat) * DEG];
        },
    };
}

/**
 * Lambert cylindrical equal-area — kept for the Dorling layout, where only the
 * positions of circles matter and its exact scale along one parallel is useful.
 *
 * Standard parallel at the data's mean latitude, which is where its scale is
 * exact; north and south of that, distances compress. Equal-area everywhere,
 * which is what keeps a circle's radius meaning the same thing across the layer.
 */
function cylindricalEqualAreaPlane(lon0: number, standardParallel: number): EqualAreaPlane {
    const cosParallel = Math.max(Math.cos(standardParallel * RAD), 0.05);
    return {
        forward([lon, lat]) {
            return [
                EARTH_RADIUS * (lon - lon0) * RAD * cosParallel,
                (EARTH_RADIUS * Math.sin(lat * RAD)) / cosParallel,
            ];
        },
        inverse([x, y]) {
            const sinLat = Math.min(Math.max((y * cosParallel) / EARTH_RADIUS, -1), 1);
            // Continuous, for the same reason as Equal Earth above: a Dorling
            // circle laid out next to the date line reaches past it, and folding
            // its points one by one turns the circle into a band across the map.
            return [
                lon0 + (x / (EARTH_RADIUS * cosParallel)) * DEG,
                Math.asin(sinLat) * DEG,
            ];
        },
    };
}

/** Keeps the diagnostic properties readable rather than 17 digits long. */
function round(value: number): number {
    return Math.round(value * 1000) / 1000;
}
