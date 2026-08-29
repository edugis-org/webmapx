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
import { geoEquirectangular, geoStream } from 'd3-geo';

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
        if (Math.abs(ring[i][1]) > 80) return true;
        if (i > 0 && Math.abs(ring[i][0] - ring[i - 1][0]) > 180) return true;
    }
    return false;
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
export function clipToSphere(geometry: GeoJSON.Geometry): GeoJSON.Geometry | null {
    const rings: GeoJSON.Position[][] = [];
    let current: GeoJSON.Position[] | null = null;

    const sink: Sink = {
        point(x, y) { current?.push([x, -y]); },
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

    geoStream(geometry as never, IDENTITY_IN_DEGREES.stream(sink as never));

    if (rings.length === 0) return null;
    return rings.length === 1
        ? { type: 'Polygon', coordinates: [rings[0]] }
        : { type: 'MultiPolygon', coordinates: rings.map((ring) => [ring]) };
}
