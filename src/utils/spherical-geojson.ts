/**
 * Making a polygon that lives on a sphere safe to hand to a flat renderer.
 *
 * Two problems, and the second is why this uses a library rather than a few
 * lines of arithmetic.
 *
 * A ring that crosses the antimeridian has vertices either side of ±180, and
 * read as plain coordinates it spans the whole world the wrong way round — the
 * classic smear across the map. That much is easy to cut.
 *
 * A ring that *encircles a pole* is not. Its longitudes run through a full turn,
 * so it ends 360° from where it began and is, read literally, an open curve; an
 * engine closes it with a straight line back across the map, and a continent
 * that has drifted onto a pole becomes a band of land stretching horizontally
 * across the world. Closing it means walking along the pole — but only on the
 * side that is actually inside the polygon, and deciding which side that is, on
 * a sphere, is the whole problem. Guessing at it (nearest pole by mean latitude)
 * was tried: it fixed Equal Earth and, in equirectangular, inverted the fill so
 * that one polygon coloured the entire world.
 *
 * `d3-geo` already solves this, because every d3 projection has to: its
 * clipping stage cuts at the antimeridian and interpolates along the pole when a
 * polygon contains one. Running geometry through a projection that happens to be
 * the identity in degrees borrows that machinery and hands back ordinary
 * lon/lat GeoJSON. The stream also resamples, which subdivides the long edges
 * that would otherwise cut chords across a curved meridian.
 */
import { geoArea, geoEquirectangular, geoStream } from 'd3-geo';

/**
 * Equirectangular at this scale is the identity in degrees: the raw projection
 * returns radians, so a scale of 180/π gives degrees back. d3 measures y
 * downwards like a screen, which is why the sink negates it.
 *
 * `precision` is the resampling threshold in output units — degrees here.
 */
const IDENTITY_IN_DEGREES = geoEquirectangular()
    .translate([0, 0])
    .scale(180 / Math.PI)
    .precision(0.5);

/**
 * How far the pole edge is held back from the pole itself, in degrees.
 *
 * A ring closed *exactly* along ±90 is rendered inside out by OpenLayers: the
 * Antarctic cap at 300 Ma filled 48% of an equirectangular map instead of 1.3%,
 * swallowing every other continent. Moving the edge by any amount at all fixes
 * it — 0.0001° works as well as 0.1° — so this is a singular-value problem in
 * the projection path rather than one of precision, and the smallest useful
 * nudge is the right one: 1e-4° is about 11 metres, which no view of a
 * reconstructed world will ever resolve.
 */
const POLE_EPSILON = 1e-4;

interface Sink {
    point(x: number, y: number): void;
    lineStart(): void;
    lineEnd(): void;
    polygonStart(): void;
    polygonEnd(): void;
    sphere(): void;
}

/**
 * True when a ring needs the full treatment: it crosses the antimeridian, or it
 * reaches close enough to a pole that it may go round one.
 *
 * Worth asking, because the stream costs several times what plain arithmetic
 * does and almost no ring needs it — at any age a handful out of two or three
 * thousand.
 */
export function needsSphericalClip(ring: GeoJSON.Position[]): boolean {
    for (let i = 0; i < ring.length; i++) {
        // Past the edge of the world. Rotation does not wrap its output, so a
        // ring that has drifted over the antimeridian keeps counting — 204°,
        // -201° — with no jump between neighbouring points to give it away, and
        // at any latitude at all. Missing these was what left bands stretched
        // across the map at 382 Ma after the rest of this was working.
        if (Math.abs(ring[i][0]) > 180) return true;
        if (Math.abs(ring[i][1]) > 80) return true;
        // Already wrapped, and crossing: consecutive points on opposite edges.
        if (i > 0 && Math.abs(ring[i][0] - ring[i - 1][0]) > 180) return true;
    }
    return false;
}

/**
 * A ring wound so that d3 reads it as the shape rather than its complement.
 *
 * On a sphere a closed ring divides the surface into two, and which half is
 * "inside" is decided by winding alone: d3 takes the interior to be on the left,
 * so a clockwise ring means everything *except* the shape. GeoJSON asks for
 * counterclockwise exteriors (RFC 7946) but plenty of data ignores it, and this
 * reconstruction is rotating rings from a source that predates the rule.
 *
 * The symptom is unmistakable once seen: a triangle a degree across comes back
 * with an area of 4π — the entire globe — and fills the map. It cost this
 * feature two rewrites, because on Mercator and the globe nothing goes through
 * a spherical clipper, so the same data looks perfectly fine there.
 *
 * A coastline piece is never larger than a hemisphere, so more than 2π means
 * the ring is inside out.
 */
function withInteriorOnTheLeft(ring: GeoJSON.Position[]): GeoJSON.Position[] {
    const area = geoArea({ type: 'Polygon', coordinates: [ring] } as never);
    return area > 2 * Math.PI ? [...ring].reverse() : ring;
}

/**
 * Rings that describe no area at all: fewer than three distinct points, or a
 * path that goes out and comes back along itself.
 *
 * They draw nothing, but they are not harmless — with no enclosed area the
 * winding is undefined, so the test above cannot tell the shape from its
 * complement, and a clipper is free to hand back either.
 */
function hasArea(ring: GeoJSON.Position[]): boolean {
    const distinct = new Set(ring.map(([lon, lat]) => `${lon},${lat}`));
    if (distinct.size < 3) return false;
    const area = geoArea({ type: 'Polygon', coordinates: [ring] } as never);
    const flipped = geoArea({ type: 'Polygon', coordinates: [[...ring].reverse()] } as never);
    return Math.min(area, flipped) > 1e-12;
}

/**
 * The same geometry, cut at the antimeridian and closed around any pole it
 * contains, as ordinary lon/lat GeoJSON.
 *
 * Every ring the clipper produces becomes its own polygon. That is right for
 * this data and wrong in general: a source polygon with holes would have its
 * holes promoted to islands. The callers here (reconstructed coastlines) are
 * all single-ring polygons, and the alternative — working out which of the
 * clipper's rings are holes of which — is a second nesting problem that this
 * data does not pose.
 */
function prepareGeometry(geometry: GeoJSON.Geometry): GeoJSON.Geometry | null {
    const fix = (rings: GeoJSON.Position[][]): GeoJSON.Position[][] =>
        rings.filter(hasArea).map(withInteriorOnTheLeft);

    if (geometry.type === 'Polygon') {
        const rings = fix(geometry.coordinates);
        return rings.length ? { type: 'Polygon', coordinates: rings } : null;
    }
    if (geometry.type === 'MultiPolygon') {
        const polygons = geometry.coordinates.map(fix).filter((rings) => rings.length > 0);
        return polygons.length ? { type: 'MultiPolygon', coordinates: polygons } : null;
    }
    return geometry;
}

export function clipToSphere(geometry: GeoJSON.Geometry): GeoJSON.Geometry | null {
    const rings: GeoJSON.Position[][] = [];
    let current: GeoJSON.Position[] | null = null;

    const sink: Sink = {
        point(x, y) {
            const lat = -y;
            current?.push([x, Math.max(-90 + POLE_EPSILON, Math.min(90 - POLE_EPSILON, lat))]);
        },
        lineStart() { current = []; },
        lineEnd() {
            // d3 emits open rings; GeoJSON wants the first point repeated.
            if (current && current.length >= 3) rings.push([...current, current[0]]);
            current = null;
        },
        polygonStart() { /* rings are collected individually */ },
        polygonEnd() { /* nothing to close: see the note above about holes */ },
        sphere() { /* never streamed here */ },
    };

    // Winding first: a clockwise ring means "everything but this" to d3, and the
    // clipper would faithfully return the complement — a world-covering polygon.
    const prepared = prepareGeometry(geometry);
    if (!prepared) return null;

    geoStream(prepared as never, IDENTITY_IN_DEGREES.stream(sink as never));

    if (rings.length === 0) return null;
    return rings.length === 1
        ? { type: 'Polygon', coordinates: [rings[0]] }
        : { type: 'MultiPolygon', coordinates: rings.map((ring) => [ring]) };
}
