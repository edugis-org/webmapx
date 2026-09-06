export const PERMALINK_PARAM = 's';
export const CONFIG_URL_PARAM_BASE = 'config';
/**
 * The compare tool's split position, as a percentage of the map width.
 *
 * It also says *that* a comparison is open: a link carrying `s.1` and no `cmp` restores two
 * stacked maps and no handle, which is a broken page rather than a missing feature. So this
 * is what tells the tool to start on load.
 */
export const COMPARE_PARAM = 'cmp';

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
    /**
     * The pinned moment, in whole epoch SECONDS. Omitted when the map runs live.
     *
     * Its absence is what "now" means — a link to a live map must keep saying
     * *now* when it is opened next year, so there is nothing to store. Seconds
     * rather than milliseconds because that is the finest grain any of this is
     * read at (the sliders step in minutes, the computed layers in seconds) and
     * it is three characters shorter in a URL people paste into chat.
     */
    tm?: number;
    /**
     * Play speed, in map-seconds per real second. Omitted when paused.
     *
     * One field for both questions: playing at all, and how fast. A paused
     * speed is not stored — it is a preference of the control, not a state of
     * the map, and restoring a map that is *not* playing at a speed you cannot
     * see is state nobody can verify from the picture.
     */
    tp?: number;
}

/** The clock half of a permalink, as `buildPermalinkUrl` takes it. */
export interface PermalinkTimeState {
    /** Pinned moment in epoch milliseconds, or null/undefined when live. */
    at?: number | null;
    /** Map-milliseconds per real second while playing, or null when paused. */
    play?: number | null;
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

/** Reads the split percentage a link asks the compare tool to start at, or null. */
export function getComparePermalinkSplit(): number | null {
    const raw = new URLSearchParams(window.location.search).get(COMPARE_PARAM);
    if (raw === null) return null;
    const value = Number(raw);
    if (!Number.isFinite(value)) return null;
    return Math.min(100, Math.max(0, value));
}

/**
 * The frozen half of a comparison, as `buildPermalinkUrl` takes it.
 *
 * It needs no encoding of its own: the frozen map is a second `<webmapx-map>`, so it is map
 * index 1 and `s.1` already means exactly this. Only the handle position is new.
 */
export interface ComparePermalinkState {
    /** Split position, percent of the map width. */
    split: number;
    /** The frozen map's state, in the same shape every map's is written in. */
    state: PermalinkState;
}

/** What a permalink records about one map, before it is encoded. */
export interface PermalinkStateInput {
    layerIds: string[];
    hiddenLayerIds: string[];
    viewport: { center: [number, number]; zoom: number; bearing: number; pitch: number };
    transparencyOverrides: Map<string, number>;
    projection?: string | null;
    terrainEnabled?: boolean;
    time?: PermalinkTimeState | null;
}

/**
 * Rounds and packs one map's state into the short-key shape a url carries.
 *
 * Separate from `buildPermalinkUrl` because a link can now describe two maps — the live one
 * and the compare tool's frozen one — and they must be written by the same code, or the two
 * halves of a shared comparison would round differently and drift apart.
 */
export function permalinkStateFrom(input: PermalinkStateInput): PermalinkState {
    const { layerIds, hiddenLayerIds, viewport, transparencyOverrides, projection, terrainEnabled, time } = input;

    const t: Record<string, number> = {};
    for (const [id, val] of transparencyOverrides) {
        if (val !== 0) t[id] = val;
    }

    const state: PermalinkState = {
        l: layerIds,
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
    // A pinned moment travels; "now" does not, and a play speed only means
    // something while there is a pinned moment for it to move.
    if (typeof time?.at === 'number' && Number.isFinite(time.at)) {
        state.tm = Math.round(time.at / 1000);
        if (typeof time.play === 'number' && time.play > 0) state.tp = time.play / 1000;
    }
    return state;
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
    time?: PermalinkTimeState | null,
    compare?: ComparePermalinkState | null,
): string {
    const state = permalinkStateFrom({
        layerIds: allLayerIds,
        hiddenLayerIds,
        viewport,
        transparencyOverrides,
        projection,
        terrainEnabled,
        time,
    });

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

    // The frozen half of an open comparison, written as the second map on the page — which
    // is what it is. A shared comparison is a reconstruction, not the replayed frozen map:
    // `s.1` carries layer order, visibility, opacity, projection, terrain and the clock, but
    // no paint, and a layer that only exists in this browser has nothing behind its id on the
    // other machine.
    if (compare) {
        url.searchParams.set(permalinkParamName(1), encodePermalink(compare.state));
        url.searchParams.set(COMPARE_PARAM, String(Math.round(compare.split)));
    } else {
        url.searchParams.delete(permalinkParamName(1));
        url.searchParams.delete(COMPARE_PARAM);
    }

    return url.toString();
}
