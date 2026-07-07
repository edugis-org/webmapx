import type { PermalinkState } from '../utils/permalink.js';

export interface InitOptionsMapConfig {
    center?: [number, number];
    zoom?: number;
    bearing?: number | null;
    pitch?: number | null;
    minZoom?: number;
    maxZoom?: number;
    minPitch?: number;
    maxPitch?: number;
    maxBounds?: [number, number, number, number];
    style?: unknown;
    projection?: string | null;
}

export interface ResolveInitOptionsParams {
    mapConfig: InitOptionsMapConfig;
    /** Decoded permalink state for this map, if the URL carries one. Takes priority over everything else. */
    permalinkState?: PermalinkState | null;
    /** Viewport to use when there's no permalink (e.g. a persisted/legacy saved session viewport). */
    fallbackViewport?: { center: [number, number]; zoom: number } | null;
    /** Projection to use when there's no permalink (e.g. a persisted session projection). */
    fallbackProjection?: string | null;
}

/**
 * Resolves the adapter.initialize() options for a map from its config plus permalink/session
 * overrides. Single source of truth for viewport/projection priority (permalink > fallback >
 * config) so every entry point that boots a map (the demo app, the embeddable WebMapX.mount API,
 * ...) behaves identically instead of drifting apart.
 */
export async function resolveInitOptions(params: ResolveInitOptionsParams): Promise<Record<string, unknown>> {
    const { mapConfig, permalinkState, fallbackViewport, fallbackProjection } = params;
    const styleConfig = mapConfig.style;
    const isStyleUrl = typeof styleConfig === 'string';

    const initOptions: Record<string, unknown> = {
        center: mapConfig.center ?? [0, 0],
        zoom: mapConfig.zoom ?? 2,
        ...(mapConfig.bearing != null ? { bearing: mapConfig.bearing } : {}),
        ...(mapConfig.pitch != null ? { pitch: mapConfig.pitch } : {}),
        ...(mapConfig.minZoom != null ? { minZoom: mapConfig.minZoom } : {}),
        ...(mapConfig.maxZoom != null ? { maxZoom: mapConfig.maxZoom } : {}),
        ...(mapConfig.minPitch != null ? { minPitch: mapConfig.minPitch } : {}),
        ...(mapConfig.maxPitch != null ? { maxPitch: mapConfig.maxPitch } : {}),
        ...(mapConfig.maxBounds != null ? { maxBounds: mapConfig.maxBounds } : {}),
        ...(isStyleUrl ? { styleUrl: styleConfig } : { style: styleConfig }),
    };

    // Viewport priority: permalink > fallback (persisted/legacy session) > config (already set above)
    if (permalinkState?.v) {
        const [lng, lat, zoom, bearing, pitch] = permalinkState.v;
        initOptions.center = [lng, lat];
        initOptions.zoom = zoom;
        if (bearing !== 0) initOptions.bearing = bearing;
        else delete initOptions.bearing;
        if (pitch !== 0) initOptions.pitch = pitch;
        else delete initOptions.pitch;
    } else if (fallbackViewport) {
        initOptions.center = fallbackViewport.center;
        initOptions.zoom = fallbackViewport.zoom;
    }

    // Projection priority: permalink > fallback (persisted session) > config
    const projectionToApply = permalinkState?.p ?? fallbackProjection ?? mapConfig.projection ?? null;
    if (projectionToApply) {
        // Always set projection option — MapCoreService adds it to the style spec via projectionSpec
        initOptions.projection = projectionToApply;
        if (isStyleUrl) {
            // Switch URL style to inline so MapCoreService can inject projection into setStyle()
            // v4 only applies projection during initial renderer setup (first setStyle call)
            try {
                const resp = await fetch(styleConfig as string);
                initOptions.style = await resp.json();
                delete initOptions.styleUrl;
            } catch (e) {
                console.warn('[webmapx] Failed to fetch style for projection injection:', e);
                // styleUrl fallback — projection will still apply in v5+ via runtime setProjection
            }
        }
    }

    return initOptions;
}
