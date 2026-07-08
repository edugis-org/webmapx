// Serializes and restores full map state across page reloads (adapter switch, projection reinit).
// Engine-agnostic: stores viewport, dynamic layer requests, and target projection.

export interface PersistedLayerEntry {
    request: unknown;
    fallback?: unknown;
    options?: unknown;
}

export interface PersistedMapState {
    viewport?: { center: [number, number]; zoom: number; bearing: number; pitch: number };
    layers?: PersistedLayerEntry[];
    projection?: string;
}

const STATE_KEY_PREFIX = 'webmapx-state';

// `pageScope` (typically `location.pathname + location.search`) keeps this from leaking
// across same-origin sibling frames/tabs that reuse the same map element id — e.g. demo
// cards embedding the same `<webmapx-map id="map">` with different `?config=` values, or
// a same-origin "open full screen" link inheriting a cloned sessionStorage snapshot.
function stateKey(mapId: string, pageScope: string): string {
    return `${STATE_KEY_PREFIX}:${pageScope}:${mapId}`;
}

export function saveMapState(mapId: string, pageScope: string, state: PersistedMapState): void {
    try {
        sessionStorage.setItem(stateKey(mapId, pageScope), JSON.stringify(state));
    } catch {
        // sessionStorage full (e.g. large inline GeoJSON) — skip silently
    }
}

/** Read state without consuming it. Returns null if nothing stored. */
export function peekMapState(mapId: string, pageScope: string): PersistedMapState | null {
    const raw = sessionStorage.getItem(stateKey(mapId, pageScope));
    if (!raw) return null;
    try {
        return JSON.parse(raw) as PersistedMapState;
    } catch {
        return null;
    }
}

/** Read and clear state. */
export function consumeMapState(mapId: string, pageScope: string): PersistedMapState | null {
    const state = peekMapState(mapId, pageScope);
    if (state) sessionStorage.removeItem(stateKey(mapId, pageScope));
    return state;
}
