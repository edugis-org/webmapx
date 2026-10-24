// src/utils/google-street-view.ts
// Google Street View for the street photos tool, through Google's Street View
// Static API: a metadata request (free) says whether there is imagery near a
// spot and where; image requests (billed per image) fetch a flat view of it.
// Pure functions, so the tool and its tests share them.
//
// No coverage map: Google allows its Street View coverage layer only through
// the Maps JavaScript library, and requesting those tiles directly is against
// its terms. No look-around in the page either, for the same reason; the
// "open" button goes to Google Maps for that.

import type { LngLat } from '../store/map-events';
import { bearingDegrees, type StreetPhoto } from './street-photo';

const STATIC_API = 'https://maps.googleapis.com/maps/api/streetview';
/** Panel and enlarged view; 640 px is the largest the Static API serves without a premium plan. */
const THUMB_SIZE = '400x260';
const LARGE_SIZE = '640x400';
/** Field of view of the flat image, in degrees: about what a phone camera sees. */
const FIELD_OF_VIEW = 90;

/**
 * Whether there is imagery near a spot. `source=outdoor` leaves out indoor
 * panoramas (shops, museums), which are not what a street photo means here.
 */
export function buildGoogleMetadataUrl([lng, lat]: LngLat, distanceM: number, key: string): string {
    const params = new URLSearchParams({
        location: `${lat},${lng}`,
        radius: String(Math.max(1, Math.round(distanceM))),
        source: 'outdoor',
        key,
    });
    return `${STATIC_API}/metadata?${params}`;
}

function staticImageUrl(panoId: string, heading: number, size: string, key: string): string {
    const params = new URLSearchParams({
        pano: panoId,
        size,
        heading: heading.toFixed(1),
        fov: String(FIELD_OF_VIEW),
        pitch: '0',
        key,
    });
    return `${STATIC_API}?${params}`;
}

/** Google Maps at the panorama, facing the same way as the image. */
export function googleStreetViewPageUrl(panoId: string, [lng, lat]: LngLat, heading: number): string {
    const params = new URLSearchParams({
        api: '1',
        map_action: 'pano',
        pano: panoId,
        viewpoint: `${lat},${lng}`,
        heading: heading.toFixed(1),
        pitch: '0',
        fov: String(FIELD_OF_VIEW),
    });
    return `https://www.google.com/maps/@?${params}`;
}

type Json = Record<string, unknown>;

/**
 * A metadata answer as a photo facing the clicked spot, or null when Google
 * has nothing there (`ZERO_RESULTS`) or refused (a bad key, an API not enabled).
 * The view is turned towards the spot, since the panorama is usually taken
 * from the road beside it rather than on it.
 */
export function parseGoogleStreetView(answer: unknown, spot: LngLat, key: string): StreetPhoto | null {
    const json = answer && typeof answer === 'object' ? answer as Json : null;
    if (!json || json.status !== 'OK' || typeof json.pano_id !== 'string') return null;
    const location = json.location && typeof json.location === 'object' ? json.location as Json : null;
    const position: LngLat = typeof location?.lng === 'number' && typeof location?.lat === 'number'
        ? [location.lng, location.lat]
        : spot;
    const heading = (bearingDegrees(position, spot) + 360) % 360;
    const panoId = json.pano_id;
    return {
        source: 'google',
        id: panoId,
        position,
        thumbUrl: staticImageUrl(panoId, heading, THUMB_SIZE, key),
        largeUrl: staticImageUrl(panoId, heading, LARGE_SIZE, key),
        takenAt: typeof json.date === 'string' ? json.date : null,
        // Google's own line, e.g. "© Google" or a contributor's name.
        credit: typeof json.copyright === 'string' && json.copyright.trim()
            ? json.copyright.trim().replace(/^©\s*/, '')
            : 'Google',
        licence: null,
        licenceUrl: null,
        viewerUrl: googleStreetViewPageUrl(panoId, position, heading),
        is360: false,
        heading,
    };
}

/**
 * Why Google gave no photo, for the panel: nothing there is not an error; a
 * refusal is, and says which, since a teacher setting up a key needs to know.
 */
export function googleRefusal(answer: unknown): string | null {
    const json = answer && typeof answer === 'object' ? answer as Json : null;
    const status = json?.status;
    if (status === 'OK' || status === 'ZERO_RESULTS' || status === 'NOT_FOUND') return null;
    const message = typeof json?.error_message === 'string' ? json.error_message : '';
    return `Google Street View refused the request (${String(status ?? 'no answer')})${message ? `: ${message}` : ''}`;
}
