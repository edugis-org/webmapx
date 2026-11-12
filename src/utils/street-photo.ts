// src/utils/street-photo.ts
// One street-level photo, whichever service it came from, so the street photos
// tool shows, enlarges and credits Panoramax and Google Street View the same way.

import type { LngLat } from '../store/map-events';

export type StreetPhotoSource = 'panoramax' | 'google';

export interface StreetPhoto {
    source: StreetPhotoSource;
    id: string;
    /** Where the photo was taken from. */
    position: LngLat;
    /** A small image for the panel. */
    thumbUrl: string;
    /** A larger image for the enlarged view; the thumbnail when there is none. */
    largeUrl: string;
    /**
     * When the photo was taken, ISO 8601, or null. Google gives only a month
     * (`2023-05`), which is shown as a month, not as its first day.
     */
    takenAt: string | null;
    /** Who to credit: the photographers, or the service. */
    credit: string;
    /** Licence id (`CC-BY-SA-4.0`), or null where there is none to name. */
    licence: string | null;
    licenceUrl: string | null;
    /** The service's own viewer at this photo, for the "open" button. */
    viewerUrl: string;
    /**
     * A 360° photo, stored flattened (equirectangular): shown as an image it
     * is distorted, so it is enlarged in a panorama viewer instead.
     */
    is360: boolean;
    /** Compass direction the middle of the photo faces, in degrees, or null. */
    heading: number | null;
}

/** Compass bearing from one point to another, in degrees from north (−180…180). */
export function bearingDegrees(from: LngLat, to: LngLat): number {
    const [lng1, lat1] = from.map((d) => d * Math.PI / 180);
    const [lng2, lat2] = to.map((d) => d * Math.PI / 180);
    const y = Math.sin(lng2 - lng1) * Math.cos(lat2);
    const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(lng2 - lng1);
    return Math.atan2(y, x) * 180 / Math.PI;
}
