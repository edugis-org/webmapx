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
 * Three methods:
 *
 * - `contiguous` (Dougenik rubber sheet, the default) stretches one sheet, so
 *   neighbours stay joined and the result still reads as a map. This is what
 *   people picture when they ask for a cartogram.
 * - `scaled` (Olson) resizes each shape on the spot, keeping every outline
 *   exactly and leaving gaps between them.
 * - `dorling` throws the shape away and draws circles, which is easier to
 *   compare by eye when the values differ by orders of magnitude.
 *
 * Not implemented: Gastner–Newman diffusion, the smoother contiguous method
 * Worldmapper uses. It needs an FFT over a grid and belongs in a WASM library
 * (`go-cart-wasm`); Dougenik gets the same kind of map in a hundred lines and
 * no dependency.
 */

export type CartogramMethod = 'contiguous' | 'scaled' | 'dorling';

export interface CartogramOptions {
    /** Attribute holding the value to size features by. */
    field: string;
    method?: CartogramMethod;
    /** `dorling` only: how many rounds of pushing overlapping circles apart. */
    iterations?: number;
    /** `contiguous` only: how many rounds of rubber-sheeting. */
    passes?: number;
}

export interface CartogramResult {
    features: GeoJSON.FeatureCollection;
    /** Features left out, and why — the caller decides whether to surface it. */
    skipped: { missingValue: number; nonPositive: number; noArea: number };
}

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
    let delta = to - from;
    while (delta > 180) delta -= 360;
    while (delta < -180) delta += 360;
    return delta;
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
 * Collects the features a cartogram can be built from, and counts what it
 * cannot use.
 *
 * A feature is dropped for three different reasons, kept apart because they mean
 * different things to whoever chose the field: no value at all (the wrong field,
 * or a gap in the data), a value of zero or less (nothing to draw — a cartogram
 * has no way to show a negative area), and no area to scale (a point or line
 * layer, or a collapsed polygon).
 */
function unitsOf(input: GeoJSON.FeatureCollection, field: string): { units: Unit[]; skipped: CartogramResult['skipped'] } {
    const units: Unit[] = [];
    const skipped = { missingValue: 0, nonPositive: 0, noArea: 0 };

    for (const feature of input.features) {
        const raw = feature.properties?.[field];
        const value = typeof raw === 'number' ? raw : Number(raw);
        if (raw === null || raw === undefined || raw === '' || !Number.isFinite(value)) {
            skipped.missingValue++;
            continue;
        }
        if (value <= 0) {
            skipped.nonPositive++;
            continue;
        }
        const area = featureArea(feature.geometry);
        const centre = featureCentroid(feature.geometry);
        if (!area || !centre) {
            skipped.noArea++;
            continue;
        }
        units.push({ feature, value, area, centre });
    }
    return { units, skipped };
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
export function cartogram(input: GeoJSON.FeatureCollection, options: CartogramOptions): CartogramResult {
    const { units, skipped } = unitsOf(input, options.field);
    if (!units.length) {
        throw new Error(`No features have a usable number in "${options.field}".`);
    }

    const totalArea = units.reduce((sum, u) => sum + u.area, 0);
    const totalValue = units.reduce((sum, u) => sum + u.value, 0);
    const areaPerValue = totalArea / totalValue;

    const features = options.method === 'dorling'
        ? dorling(units, areaPerValue, options.iterations ?? DEFAULT_ITERATIONS)
        : options.method === 'scaled'
            ? scaled(units, areaPerValue)
            : contiguous(units, areaPerValue, options.passes ?? DEFAULT_PASSES);

    return { features: { type: 'FeatureCollection', features }, skipped };
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
            totalError += Math.abs(shape.target - area) / Math.max(shape.target, 1);
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
            const lambda = (M * x * polyDerivative(theta)) / (EARTH_RADIUS * Math.cos(theta));
            return [normaliseLongitude(lon0 + lambda * DEG), Math.asin(sinLat) * DEG];
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
            return [
                normaliseLongitude(lon0 + (x / (EARTH_RADIUS * cosParallel)) * DEG),
                Math.asin(sinLat) * DEG,
            ];
        },
    };
}

/** Keeps the diagnostic properties readable rather than 17 digits long. */
function round(value: number): number {
    return Math.round(value * 1000) / 1000;
}
