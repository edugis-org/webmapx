// src/utils/panoramax.ts
// Street-level photos from Panoramax (https://panoramax.fr), an open,
// federated alternative to Google Street View: no key, no account, photos
// under open licences. Pure functions, so the tool and its tests share them.

import type { LngLat } from '../store/map-events';

/** The federated catalogue: searches every Panoramax instance at once. */
export const DEFAULT_PANORAMAX_API = 'https://api.panoramax.xyz/api';
/** The viewer that opens a photo full size, able to turn around and walk on. */
export const DEFAULT_PANORAMAX_VIEWER = 'https://api.panoramax.xyz/';
/** How far from the clicked spot a photo may be taken, in metres. */
export const DEFAULT_SEARCH_DISTANCE_M = 50;

export interface PanoramaxPhoto {
    id: string;
    /** Where the photo was taken from. */
    position: LngLat;
    /** A small image for the panel. */
    thumbUrl: string;
    /** A larger image for the enlarged view; the thumbnail when there is none. */
    largeUrl: string;
    /** When the photo was taken, ISO 8601, or null. */
    takenAt: string | null;
    /** Who to credit: the producers, or the instance the photo comes from. */
    credit: string;
    /** Licence id as Panoramax gives it (`CC-BY-SA-4.0`), or null. */
    licence: string | null;
    licenceUrl: string | null;
    /** The Panoramax viewer at this photo, for the "open" button. */
    viewerUrl: string;
}

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
export function parsePanoramaxPhoto(answer: unknown, viewerUrl = DEFAULT_PANORAMAX_VIEWER): PanoramaxPhoto | null {
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

    return {
        id: feature.id,
        position,
        thumbUrl,
        largeUrl: href(assets, 'sd') ?? thumbUrl,
        takenAt: typeof properties.datetime === 'string' ? properties.datetime : null,
        credit: producers.length ? [...new Set(producers)].join(', ') : instance ?? 'Panoramax',
        licence: typeof properties.license === 'string' ? properties.license : null,
        licenceUrl: typeof licenceLink?.href === 'string' && /^https?:\/\//.test(licenceLink.href) ? licenceLink.href : null,
        viewerUrl: panoramaxViewerUrl(viewerUrl, feature.id, position),
    };
}
