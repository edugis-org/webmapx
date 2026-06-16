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

function stateKey(mapId: string): string {
    return `${STATE_KEY_PREFIX}:${mapId}`;
}

export function saveMapState(mapId: string, state: PersistedMapState): void {
    try {
        sessionStorage.setItem(stateKey(mapId), JSON.stringify(state));
    } catch {
        // sessionStorage full (e.g. large inline GeoJSON) — skip silently
    }
}

/** Read state without consuming it. Returns null if nothing stored. */
export function peekMapState(mapId: string): PersistedMapState | null {
    const raw = sessionStorage.getItem(stateKey(mapId));
    if (!raw) return null;
    try {
        return JSON.parse(raw) as PersistedMapState;
    } catch {
        return null;
    }
}

/** Read and clear state. */
export function consumeMapState(mapId: string): PersistedMapState | null {
    const state = peekMapState(mapId);
    if (state) sessionStorage.removeItem(stateKey(mapId));
    return state;
}
