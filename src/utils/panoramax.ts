// src/utils/panoramax.ts
// Street-level photos from Panoramax (https://panoramax.fr), an open,
// federated alternative to Google Street View: no key, no account, photos
// under open licences. Pure functions, so the tool and its tests share them.

import type { LngLat } from '../store/map-events';
import { bearingDegrees, type StreetPhoto } from './street-photo';

/** The federated catalogue: searches every Panoramax instance at once. */
export const DEFAULT_PANORAMAX_API = 'https://api.panoramax.xyz/api';
/** The viewer that opens a photo full size, able to turn around and walk on. */
export const DEFAULT_PANORAMAX_VIEWER = 'https://api.panoramax.xyz/';
/** How far from the clicked spot a photo may be taken, in metres. */
export const DEFAULT_SEARCH_DISTANCE_M = 50;

/** Id of the coverage layer the tool lends the map while it is open. */
export const PANORAMAX_COVERAGE_LAYER_ID = 'panoramax-coverage';

/**
 * The search for photos that *show* a spot, nearest first. `place_position`
 * asks for pictures looking at that position, which is the question the user
 * asked by clicking it — not for pictures merely taken nearby, which may face
 * the other way.
 */
export function buildPanoramaxSearchUrl(apiUrl: string, [lng, lat]: LngLat, distanceM = DEFAULT_SEARCH_DISTANCE_M): string {
    const base = apiUrl.replace(/\/+$/, '');
    const params = new URLSearchParams({
        place_position: `${lng},${lat}`,
        place_distance: `0-${Math.max(1, Math.round(distanceM))}`,
        limit: '1',
    });
    return `${base}/search?${params}`;
}

/** One photo by its id — what a click on a photo dot of the coverage map asks for. */
export function buildPanoramaxPhotoUrl(apiUrl: string, id: string): string {
    return `${apiUrl.replace(/\/+$/, '')}/search?${new URLSearchParams({ ids: id })}`;
}

/** What the photographed routes and photo dots are coloured by. */
export type PanoramaxColourBy = 'coverage' | 'date' | 'camera';

const COVERAGE_COLOUR = '#FF6F00';
const CAMERA_COLOURS = { equirectangular: '#FF6F00', flat: '#00897B' } as const;
/** Newest first, so the classes read top to bottom as the legend lists them. */
const DATE_COLOURS = ['#C62828', '#F57C00', '#7E57C2', '#311B92'] as const;
const UNKNOWN_COLOUR = '#9E9E9E';

/** The year boundaries of the date classes: this year, last year, 2–4 years old, older. */
function dateBreaks(thisYear: number): [string, string, string] {
    return [`${thisYear}-01-01`, `${thisYear - 1}-01-01`, `${thisYear - 4}-01-01`];
}

/**
 * Colour for one part of the coverage: `date` holds the capture date on
 * routes, `ts` (a timestamp starting with the date) on photos; both compare
 * as strings, so `>= "2025-01-01"` means "taken in 2025 or later".
 */
export function panoramaxColour(colourBy: PanoramaxColourBy, part: 'sequences' | 'pictures', thisYear: number): unknown {
    // A route may carry no camera type (seen: 1 in 30 routes over Amsterdam;
    // photos always have one). Its class is named, not left to the fallback:
    // the legend hides unlabelled fallbacks, so a grey route would be a colour
    // nobody explains.
    if (colourBy === 'camera') {
        return ['case',
            ['==', ['get', 'type'], 'equirectangular'], CAMERA_COLOURS.equirectangular,
            ['==', ['get', 'type'], 'flat'], CAMERA_COLOURS.flat,
            ['==', ['get', 'type'], null], UNKNOWN_COLOUR,
            UNKNOWN_COLOUR];
    }
    if (colourBy === 'date') {
        const prop = part === 'sequences' ? 'date' : 'ts';
        const [y0, y1, y4] = dateBreaks(thisYear);
        // Missing first: an ordering comparison of a missing value with a
        // string is an evaluation error, not false.
        return ['case',
            ['==', ['get', prop], null], UNKNOWN_COLOUR,
            ['>=', ['get', prop], y0], DATE_COLOURS[0],
            ['>=', ['get', prop], y1], DATE_COLOURS[1],
            ['>=', ['get', prop], y4], DATE_COLOURS[2],
            ['<', ['get', prop], y4], DATE_COLOURS[3],
            UNKNOWN_COLOUR];
    }
    return COVERAGE_COLOUR;
}

/** Legend wording for the classes above, keyed the way the legend looks them up. */
function attributeLabels(thisYear: number): Record<string, unknown> {
    const [y0, y1, y4] = dateBreaks(thisYear);
    const dateMap = (name: string) => ({
        name,
        translation: 'Taken',
        valuemap: [
            { value: y0, operator: '>=', label: `This year (${thisYear})` },
            { value: y1, operator: '>=', label: `Last year (${thisYear - 1})` },
            { value: y4, operator: '>=', label: `${thisYear - 4}–${thisYear - 2}` },
            { value: y4, operator: '<', label: `Before ${thisYear - 4}` },
            { value: null, operator: '==', label: 'Date unknown' },
        ],
    });
    return {
        translations: [
            {
                name: 'type',
                translation: 'Camera',
                valuemap: [
                    { value: 'equirectangular', operator: '==', label: '360° photos' },
                    { value: 'flat', operator: '==', label: 'Flat photos' },
                    { value: null, operator: '==', label: 'Camera unknown' },
                ],
            },
            dateMap('date'),
            dateMap('ts'),
        ],
    };
}

/**
 * The first zoom at which Panoramax's tiles carry routes. Below it they hold
 * only a density grid — measured over Iceland: grid only up to 5, routes and
 * grid at 6, routes only from 7.
 */
export const PANORAMAX_ROUTES_MIN_ZOOM = 6;

/**
 * Where photos exist, as a composite layer of Panoramax's own vector tiles:
 * the routes photographed (lines) and, at street level, one dot per photo.
 *
 * Panoramax's density grid is deliberately left out. Every cell is drawn the
 * same size whether it holds one photo or ten thousand, so sparse areas (all
 * of Iceland) looked as covered as a city, and a cell stands for a large
 * square, so zooming in on one mostly landed where there was nothing. Below
 * PANORAMAX_ROUTES_MIN_ZOOM the layer therefore shows nothing and fetches no
 * tiles, and the tool says to zoom in.
 */
export function panoramaxCoverageLayer(
    apiUrl: string,
    colourBy: PanoramaxColourBy = 'coverage',
    thisYear = new Date().getFullYear(),
): Record<string, unknown> {
    const id = PANORAMAX_COVERAGE_LAYER_ID;
    const source = 'panoramax';
    return {
        id,
        type: 'style',
        version: 8,
        title: 'Panoramax photos',
        sources: {
            [source]: {
                type: 'vector',
                tiles: [`${apiUrl.replace(/\/+$/, '')}/map/{z}/{x}/{y}.mvt`],
                minzoom: PANORAMAX_ROUTES_MIN_ZOOM,
                maxzoom: 15,
                attribution: '<a href="https://panoramax.fr" target="_blank" rel="noopener">Panoramax</a>',
            },
        },
        layers: [
            {
                // Fully visible from the first zoom that has routes; Panoramax's
                // own map faded them in from 6.25 to 7, behind its grid.
                id: `${id}-sequences`, type: 'line', source, 'source-layer': 'sequences',
                minzoom: PANORAMAX_ROUTES_MIN_ZOOM,
                metadata: { label: 'Photographed routes' },
                layout: { 'line-cap': 'square' },
                paint: {
                    'line-color': panoramaxColour(colourBy, 'sequences', thisYear),
                    // Wide enough zoomed out to find a short route in a large area.
                    'line-width': ['interpolate', ['linear'], ['zoom'], 6, 3, 10, 3, 14, 4, 16, 5, 22, 3],
                },
            },
            {
                id: `${id}-pictures`, type: 'circle', source, 'source-layer': 'pictures',
                metadata: { label: 'Photos' },
                paint: {
                    'circle-color': panoramaxColour(colourBy, 'pictures', thisYear),
                    'circle-opacity': ['interpolate', ['linear'], ['zoom'], 15, 0, 16, 1],
                    'circle-radius': ['interpolate', ['linear'], ['zoom'], 15, 4.5, 17, 8, 22, 12],
                    'circle-stroke-color': '#ffffff',
                    'circle-stroke-width': ['interpolate', ['linear'], ['zoom'], 17, 0, 20, 2],
                },
            },
        ],
        metadata: {
            label: 'Panoramax photos',
            dynamic: true,
            ownerTool: 'street-photos',
            legendRole: 'overlay',
            abstract: 'Where street-level photos exist on Panoramax. Shown while the Street photos tool is open.',
            attributes: attributeLabels(thisYear),
        },
    };
}

/**
 * Which way to turn a 360° photo so it opens facing the clicked spot, in
 * degrees relative to the middle of the photo (Pannellum's `yaw`). Zero when
 * the photo's heading is unknown or there is no spot to face.
 */
export function yawTowards(photo: Pick<StreetPhoto, 'position' | 'heading'>, spot: LngLat | null): number {
    if (photo.heading === null || !spot) return 0;
    const bearing = bearingDegrees(photo.position, spot);
    return ((bearing - photo.heading + 540) % 360) - 180;
}

/** The viewer at one photo, centred on the map where it was taken. */
export function panoramaxViewerUrl(viewerUrl: string, id: string, [lng, lat]: LngLat): string {
    const url = new URL(viewerUrl);
    url.searchParams.set('pic', id);
    url.searchParams.set('focus', 'pic');
    url.searchParams.set('map', `18/${lat}/${lng}`);
    return url.toString();
}

type Json = Record<string, unknown>;

function asObject(value: unknown): Json | null {
    return value && typeof value === 'object' && !Array.isArray(value) ? value as Json : null;
}

function href(assets: Json | null, key: string): string | null {
    const value = asObject(assets?.[key])?.href;
    return typeof value === 'string' && /^https?:\/\//.test(value) ? value : null;
}

/**
 * The first photo of a Panoramax search answer, or null when there is none.
 * Defensive throughout: the answer comes from whichever instance holds the
 * photo, and anything missing is left out rather than shown as "undefined".
 */
export function parsePanoramaxPhoto(answer: unknown, viewerUrl = DEFAULT_PANORAMAX_VIEWER): StreetPhoto | null {
    const features = asObject(answer)?.features;
    const feature = Array.isArray(features) ? asObject(features[0]) : null;
    if (!feature || typeof feature.id !== 'string') return null;

    const coordinates = asObject(feature.geometry)?.coordinates;
    if (!Array.isArray(coordinates) || typeof coordinates[0] !== 'number' || typeof coordinates[1] !== 'number') return null;
    const position: LngLat = [coordinates[0], coordinates[1]];

    const assets = asObject(feature.assets);
    const properties = asObject(feature.properties) ?? {};
    const thumbUrl = href(assets, 'thumb')
        ?? (typeof properties['geovisio:thumbnail'] === 'string' ? properties['geovisio:thumbnail'] : null);
    if (!thumbUrl) return null;

    const links = Array.isArray(feature.links) ? feature.links.map(asObject) : [];
    const licenceLink = links.find((l) => l?.rel === 'license');
    const instanceLink = links.find((l) => l?.rel === 'via');

    const producers = (Array.isArray(feature.providers) ? feature.providers : [])
        .map(asObject)
        .filter((p) => Array.isArray(p?.roles) && (p!.roles as unknown[]).includes('producer') && typeof p!.name === 'string')
        .map((p) => p!.name as string);
    const instance = typeof instanceLink?.href === 'string' ? new URL(instanceLink.href).hostname : null;
    const orientation = asObject(properties['pers:interior_orientation']);
    const azimuth = properties['view:azimuth'];

    return {
        source: 'panoramax',
        id: feature.id,
        position,
        thumbUrl,
        largeUrl: href(assets, 'sd') ?? thumbUrl,
        takenAt: typeof properties.datetime === 'string' ? properties.datetime : null,
        credit: producers.length ? [...new Set(producers)].join(', ') : instance ?? 'Panoramax',
        licence: typeof properties.license === 'string' ? properties.license : null,
        licenceUrl: typeof licenceLink?.href === 'string' && /^https?:\/\//.test(licenceLink.href) ? licenceLink.href : null,
        viewerUrl: panoramaxViewerUrl(viewerUrl, feature.id, position),
        is360: orientation?.field_of_view === 360,
        heading: typeof azimuth === 'number' && Number.isFinite(azimuth) ? azimuth : null,
    };
}
