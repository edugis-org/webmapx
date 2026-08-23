/**
 * The lines a map draws on the Earth rather than on the ground.
 *
 * A graticule and the reference circles are usually shipped as data. They are
 * better computed: the spacing can follow the zoom, and — the part a stored file
 * gets quietly wrong — the tropics and the polar circles are **not where they
 * were**. They are set by the tilt of the axis, which is drifting by about
 * 0.47 arcseconds a year; the Arctic Circle is moving north some 14 metres a
 * year, and an atlas printed in 1960 has it half a kilometre out of place.
 */
import { axialTilt } from './solar';

/** Latitudes and longitudes as multiples of these, coarse to fine. */
const SPACINGS = [30, 15, 10, 5, 2, 1, 0.5, 0.25, 0.1];

/** One point every this many degrees along a line, so it curves where the map curves. */
const SAMPLE_STEP = 2;

function label(value: number, positive: string, negative: string): string {
    const rounded = Number(value.toFixed(4));
    if (rounded === 0) return '0°';
    return `${Math.abs(rounded)}° ${rounded > 0 ? positive : negative}`;
}

/**
 * A graticule at the given spacing.
 *
 * Meridians are sampled rather than drawn as two points, because in every
 * projection except the equirectangular one a meridian is a curve; a straight
 * segment between the poles would cut the corner in Mollweide and in every
 * polar projection.
 */
export function graticule(options: { spacingDegrees?: number } = {}): GeoJSON.FeatureCollection {
    const spacing = SPACINGS.includes(options.spacingDegrees ?? 0)
        ? options.spacingDegrees!
        : 15;
    const features: GeoJSON.Feature[] = [];

    for (let lon = -180; lon < 180; lon += spacing) {
        const coordinates: number[][] = [];
        for (let lat = -90; lat <= 90; lat += SAMPLE_STEP) coordinates.push([lon, lat]);
        features.push({
            type: 'Feature',
            properties: { kind: 'meridian', degrees: lon, label: label(lon, 'E', 'W') },
            geometry: { type: 'LineString', coordinates },
        } as GeoJSON.Feature);
    }

    for (let lat = -90 + spacing; lat < 90; lat += spacing) {
        const coordinates: number[][] = [];
        for (let lon = -180; lon <= 180; lon += SAMPLE_STEP) coordinates.push([lon, lat]);
        features.push({
            type: 'Feature',
            properties: { kind: 'parallel', degrees: lat, label: label(lat, 'N', 'S') },
            geometry: { type: 'LineString', coordinates },
        } as GeoJSON.Feature);
    }

    return { type: 'FeatureCollection', features };
}

/**
 * Equator, tropics and polar circles, for the tilt the Earth has on that date.
 *
 * The tropics are where the sun can stand overhead — at latitude ±tilt — and the
 * polar circles where it can fail to rise, at ±(90 − tilt). Both therefore move
 * together, and towards each other: the tropics are widening by nothing anyone
 * will notice in a lifetime, but the *reason* they can move at all is worth a
 * lesson.
 */
export function referenceCircles(date: Date = new Date()): GeoJSON.FeatureCollection {
    const tilt = axialTilt(date);
    const circles: Array<{ id: string; description: string; lat: number }> = [
        { id: 'arctic', description: 'Arctic Circle', lat: 90 - tilt },
        { id: 'cancer', description: 'Tropic of Cancer', lat: tilt },
        { id: 'equator', description: 'Equator', lat: 0 },
        { id: 'capricorn', description: 'Tropic of Capricorn', lat: -tilt },
        { id: 'antarctic', description: 'Antarctic Circle', lat: -(90 - tilt) },
    ];

    return {
        type: 'FeatureCollection',
        features: circles.map((circle) => ({
            type: 'Feature',
            properties: {
                id: circle.id,
                description: circle.description,
                latitude: Number(circle.lat.toFixed(5)),
                axialTilt: Number(tilt.toFixed(5)),
                date: date.toISOString().slice(0, 10),
            },
            geometry: {
                type: 'LineString',
                coordinates: Array.from({ length: 181 }, (_, i) => [-180 + i * 2, Number(circle.lat.toFixed(5))]),
            },
        }) as GeoJSON.Feature),
    };
}
