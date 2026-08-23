export const PERMALINK_PARAM = 's';
export const CONFIG_URL_PARAM_BASE = 'config';

/** Returns the URL param name for map at DOM index i. Index 0 → 's', 1 → 's.1', etc. */
export function permalinkParamName(index: number): string {
    return index === 0 ? PERMALINK_PARAM : `${PERMALINK_PARAM}.${index}`;
}

/** Returns the URL param name for config at DOM index i. Index 0 → 'config', 1 → 'config.1', etc. */
export function configParamName(index: number): string {
    return index === 0 ? CONFIG_URL_PARAM_BASE : `${CONFIG_URL_PARAM_BASE}.${index}`;
}

/**
 * Returns the config URL for the map at DOM index i.
 * config.<i>= takes precedence over config= (for index 0 only).
 */
export function getConfigUrlForIndex(index: number): string | null {
    const params = new URLSearchParams(window.location.search);
    // Always check explicit indexed form (config.0=, config.1=, ...) first
    const explicit = params.get(`${CONFIG_URL_PARAM_BASE}.${index}`);
    if (explicit !== null) return explicit;
    // For index 0, fall back to the short alias config=
    if (index === 0) return params.get(CONFIG_URL_PARAM_BASE);
    return null;
}

/**
 * Returns the DOM index of the given webmapx-map element among all
 * webmapx-map elements on the page.
 */
export function getMapDomIndex(mapElement: Element): number {
    const maps = Array.from(document.querySelectorAll('webmapx-map'));
    const idx = maps.indexOf(mapElement);
    return idx >= 0 ? idx : 0;
}

export interface PermalinkState {
    /** All layer IDs in bottom-to-top stack order (used for loading on restore). */
    l: string[];
    /** Layer IDs that are hidden. Omitted when all layers are visible. */
    h?: string[];
    /** [lng, lat, zoom, bearing, pitch] */
    v: [number, number, number, number, number];
    /** Per-layer transparency overrides (0–100 %). Only non-zero entries. */
    t?: Record<string, number>;
    /** Projection name (e.g. 'globe', or an OpenLayers view projection like 'EPSG:8857'). Omitted when mercator (default). */
    p?: string;
    /** True when 3D terrain was enabled. Omitted when terrain is off. */
    terrain?: boolean;
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

/** Returns the decoded permalink state for the map at DOM index i, or null. */
export function getPermalinkStateForIndex(index: number): PermalinkState | null {
    const params = new URLSearchParams(window.location.search);
    // Always check explicit s.<i>= form first; for index 0 fall back to s=
    const param = params.get(`${PERMALINK_PARAM}.${index}`) ?? (index === 0 ? params.get(PERMALINK_PARAM) : null);
    if (!param) return null;
    return decodePermalink(param);
}

export function buildPermalinkUrl(
    mapIndex: number,
    allLayerIds: string[],
    hiddenLayerIds: string[],
    viewport: { center: [number, number]; zoom: number; bearing: number; pitch: number },
    transparencyOverrides: Map<string, number>,
    projection?: string | null,
    configUrl?: string | null,
    terrainEnabled?: boolean,
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
    if (terrainEnabled) state.terrain = true;

    const url = new URL(window.location.href);

    // Set permalink state param (s= or s.i=)
    const sParam = permalinkParamName(mapIndex);
    url.searchParams.set(sParam, encodePermalink(state));
    // If writing s= (index 0), remove s.0= to avoid conflict; if writing s.i=, leave s= alone
    if (mapIndex === 0) url.searchParams.delete(`${PERMALINK_PARAM}.0`);

    // Set config param (config= or config.i=), config.i= takes precedence so remove config= when writing config.i=
    if (configUrl) {
        const cParam = configParamName(mapIndex);
        url.searchParams.set(cParam, configUrl);
        if (mapIndex === 0) {
            // Writing config= — remove config.0= to avoid the more-precise form lingering
            url.searchParams.delete(`${CONFIG_URL_PARAM_BASE}.0`);
        } else {
            // Writing config.i= — more precise, leave config= alone (it applies to index 0)
        }
    }

    return url.toString();
}
