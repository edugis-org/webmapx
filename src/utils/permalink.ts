export const PERMALINK_PARAM = 's';

export interface PermalinkState {
    /** All layer IDs in bottom-to-top stack order (used for loading on restore). */
    l: string[];
    /** Layer IDs that are hidden. Omitted when all layers are visible. */
    h?: string[];
    /** [lng, lat, zoom, bearing, pitch] */
    v: [number, number, number, number, number];
    /** Per-layer transparency overrides (0–100 %). Only non-zero entries. */
    t?: Record<string, number>;
    /** Projection name (e.g. 'globe', 'equalEarth'). Omitted when mercator (default). */
    p?: string;
}

export function encodePermalink(state: PermalinkState): string {
    return btoa(JSON.stringify(state));
}

export function decodePermalink(param: string): PermalinkState | null {
    try {
        const raw = JSON.parse(atob(param));
        if (!raw || typeof raw !== 'object') return null;
        if (!Array.isArray(raw.l) || !Array.isArray(raw.v) || raw.v.length !== 5) return null;
        return raw as PermalinkState;
    } catch {
        return null;
    }
}

export function buildPermalinkUrl(
    allLayerIds: string[],
    hiddenLayerIds: string[],
    viewport: { center: [number, number]; zoom: number; bearing: number; pitch: number },
    transparencyOverrides: Map<string, number>,
    projection?: string | null,
): string {
    const t: Record<string, number> = {};
    for (const [id, val] of transparencyOverrides) {
        if (val !== 0) t[id] = val;
    }

    const state: PermalinkState = {
        l: allLayerIds,
        v: [
            Math.round(viewport.center[0] * 1e6) / 1e6,
            Math.round(viewport.center[1] * 1e6) / 1e6,
            Math.round(viewport.zoom * 100) / 100,
            Math.round(viewport.bearing * 10) / 10,
            Math.round(viewport.pitch * 10) / 10,
        ],
    };
    if (hiddenLayerIds.length > 0) state.h = hiddenLayerIds;
    if (Object.keys(t).length > 0) state.t = t;
    if (projection && projection !== 'mercator') state.p = projection;

    const url = new URL(window.location.href);
    url.searchParams.set(PERMALINK_PARAM, encodePermalink(state));
    return url.toString();
}
