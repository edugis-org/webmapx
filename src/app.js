// src/app.js

// 0. Import setBasePath using the bare module specifier
import { setBasePath } from '@shoelace-style/shoelace/dist/utilities/base-path.js';
import { ReactiveElement } from 'lit';

// Use Vite's resolved base URL so Shoelace assets work on root and subpath deployments.
setBasePath(`${import.meta.env.BASE_URL}shoelace-assets/`);

// Suppress noisy dev-only warning emitted by third-party Lit components.
// This does not affect production behavior.
if (import.meta.env.DEV) {
    ReactiveElement.disableWarning?.('change-in-update');
}

// 1. Import configuration loader
import { loadAppConfig, resolveMapConfig, fetchConfig, parseAndValidateConfig, getConfigUrlParam } from './config/index.ts';
import { getConfigUrlForIndex, getPermalinkStateForIndex } from './utils/permalink.ts';
import { consumeDroppedConfig } from './utils/dropped-config.ts';
import { isConfigEditEnabled } from './utils/config-edit-mode.ts';
import { showToast } from './utils/toast.ts';
import { DEFAULT_ADAPTER_NAME } from './map/adapter-registry';
import {
    getMapScopedStorageKey,
    resolveAdapterSelection
} from './config/adapter-resolution.ts';
import { peekMapState } from './map/map-state-persistence.ts';
import { resolveInitOptions } from './bootstrap/resolve-init-options.ts';
import { injectConfigEditTool } from './bootstrap/inject-config-edit-tool.ts';
import { observeToolElements } from './bootstrap/tool-loader.ts';

// 2. Register the core framework components (map, layout, toolbar, ...) — always needed.
// Tool-specific components (measure, draw, buffer, ...) are loaded lazily, the moment their
// custom element actually appears in the DOM — see observeToolElements() below. A tool only
// needs to be added to tool-loader.ts's TOOL_MAP to work everywhere, instead of also needing
// a static import here that's easy to forget (see: buffer/routing/isochrone tools shipping
// without one).
import './bootstrap/webmapx-core-bundle.ts';

// Starts watching the whole document for any webmapx-* tool element and lazily loads its
// module on first sight — covers config-driven toolbar tools AND tools used standalone
// outside any config (e.g. this page's "External Tools" column below, or a future plugin).
observeToolElements();

function installMobileAddressBarNudge() {
    const mobileLikeViewport = window.matchMedia('(hover: none) and (pointer: coarse)').matches;
    if (!mobileLikeViewport) {
        return;
    }

    let nudgeTimer = null;
    const nudge = () => {
        // EduGIS uses this classic nudge; keep it mobile-only to avoid desktop side effects.
        window.scrollTo(0, 1);
    };

    const scheduleNudge = (delay = 80) => {
        if (nudgeTimer !== null) {
            window.clearTimeout(nudgeTimer);
        }
        nudgeTimer = window.setTimeout(() => {
            nudgeTimer = null;
            requestAnimationFrame(nudge);
        }, delay);
    };

    window.addEventListener('load', () => scheduleNudge(0), { once: true });
    window.addEventListener('orientationchange', () => scheduleNudge(180), { passive: true });
    window.addEventListener('resize', () => scheduleNudge(120), { passive: true });
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
            scheduleNudge(120);
        }
    });

    scheduleNudge(0);
}

// 3. Initialize the app when the DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
    installMobileAddressBarNudge();

    // A config dropped onto the map is staged in IndexedDB and the page
    // reloaded, so a fresh app/map init picks it up here (one-time use).
    let appConfig = null;
    try {
        const droppedConfig = await consumeDroppedConfig();
        if (droppedConfig) {
            try {
                appConfig = parseAndValidateConfig(JSON.parse(droppedConfig), 'dropped config');
                console.log('[app] Loaded config from dropped file');
            } catch (error) {
                console.error('[app] Failed to load dropped config:', error);
                showToast(`<strong>Failed to load dropped config</strong><br>${error.message}`, { variant: 'danger' });
            }
        }
    } catch (error) {
        console.error('[app] Failed to read dropped config from IndexedDB:', error);
    }

    // Initialize each webmapx-map on the page
    const mapElements = Array.from(document.querySelectorAll('webmapx-map'));

    for (let mapIndex = 0; mapIndex < mapElements.length; mapIndex++) {
        const mapElement = mapElements[mapIndex];

        // Per-map config: config.i= (or config= for index 0) takes priority over dropped/appConfig
        let mapConfig = appConfig;
        const perMapConfigUrl = getConfigUrlForIndex(mapIndex);
        if (perMapConfigUrl) {
            try {
                mapConfig = await fetchConfig(perMapConfigUrl);
                console.log(`[app] Loaded config for map[${mapIndex}] from: ${perMapConfigUrl}`);
            } catch (error) {
                console.error(`[app] Failed to load config for map[${mapIndex}] from "${perMapConfigUrl}":`, error);
                showToast(`<strong>Failed to load config</strong><br>${perMapConfigUrl}<br>${error.message}`, { variant: 'danger' });
            }
        } else if (mapIndex === 0 && !mapConfig) {
            // Index 0, no per-map URL param: fall back to legacy ?config= / dropped config
            try {
                const loaded = await loadAppConfig();
                if (loaded) {
                    mapConfig = loaded.config;
                    console.log(`[app] Loaded config from: ${loaded.source}`);
                }
            } catch (error) {
                console.error('[app] Failed to load app config:', error);
                showToast(`<strong>Failed to load config</strong><br>${getConfigUrlParam()}<br>${error.message}`, { variant: 'danger' });
            }
        }

        await initializeMap(mapElement, mapConfig, mapIndex);
    }

    console.log("Modular GIS UI is running. Map(s) initialized and components registered.");
});

function resolveRequestedAdapter(mapElement, mapConfig) {
    const savedKey = getMapScopedStorageKey(mapElement.id, 'adapter', `${location.pathname}${location.search}`);
    return resolveAdapterSelection({
        explicitAdapter: mapElement.getAttribute('adapter') ?? mapElement.getAttribute('type'),
        savedAdapter: savedKey ? localStorage.getItem(savedKey) : null,
        configuredAdapter: mapConfig?.type ?? null,
        defaultAdapter: DEFAULT_ADAPTER_NAME
    });
}

/**
 * Initialize a single webmapx-map element with resolved configuration.
 * @param {HTMLElement} mapElement - The webmapx-map element
 * @param {object|null} appConfig - App-level config from URL param (overrides all)
 */
async function initializeMap(mapElement, appConfig, mapIndex = 0) {
    const mapId = mapElement.id || 'unnamed-map';

    // Determine the full config for this map
    let fullConfig = appConfig;

    // If no app-level config, check for map's own src attribute
    if (!fullConfig) {
        const srcAttr = mapElement.getAttribute('src');
        if (srcAttr) {
            try {
                fullConfig = await fetchConfig(srcAttr);
                console.log(`[app] Loaded config for "${mapId}" from src="${srcAttr}"`);
            } catch (error) {
                console.error(`[app] Failed to load config from src="${srcAttr}":`, error);
                showToast(`<strong>Failed to load config</strong><br>${srcAttr}<br>${error.message}`, { variant: 'danger' });
            }
        }
    }

    // Resolve map configuration with priority cascade
    const mapConfig = await resolveMapConfig(mapElement, fullConfig);
    const resolvedAdapter = resolveRequestedAdapter(mapElement, mapConfig);

    // If we have a full config, set the resolved map config on the map element for tools to access
    if (fullConfig) {
        mapElement.setConfig({
            ...fullConfig,
            map: {
                ...mapConfig,
                type: resolvedAdapter
            }
        });

        const layout = mapElement.querySelector('webmapx-layout');
        if (layout && layout.childElementCount === 0) {
            const { buildLayoutFromConfig } = await import('./utils/dynamic-layout.ts');
            buildLayoutFromConfig(layout, fullConfig.tools);
        }
    }

    const adapter = await mapElement.getAdapterAsync?.();
    if (!adapter) {
        console.error(`[app] Map adapter is not available on <webmapx-map id="${mapId}">.`);
        return;
    }

    // Check for saved viewport state — sessionStorage state (from saveState) takes priority,
    // fall back to legacy localStorage viewport key (from old adapter-switch path).
    const pageScope = `${location.pathname}${location.search}`;
    const persistedState = peekMapState(mapElement.id, pageScope);
    const savedViewportKey = getMapScopedStorageKey(mapElement.id, 'viewport', pageScope);
    const savedViewport = savedViewportKey ? localStorage.getItem(savedViewportKey) : null;

    // Determine style options: string = URL, object = inline style
    const styleConfig = mapConfig.style;

    // Permalink viewport/projection takes highest priority — parsed once and reused
    // (s.0= takes precedence over s= for index 0, handled by getPermalinkStateForIndex).
    const permalinkState = getPermalinkStateForIndex(mapIndex);

    // Fallback viewport/projection when there's no permalink: sessionStorage state first,
    // then the legacy localStorage viewport key (consumed once, regardless of whether it's used).
    let fallbackViewport = null;
    let fallbackProjection = null;
    if (!permalinkState) {
        if (persistedState?.viewport) {
            fallbackViewport = persistedState.viewport;
            fallbackProjection = persistedState.projection ?? null;
        } else if (savedViewport) {
            try {
                fallbackViewport = JSON.parse(savedViewport);
            } catch (e) {
                console.warn(`[app] Failed to parse saved viewport for "${mapId}":`, e);
            }
            if (savedViewportKey) {
                localStorage.removeItem(savedViewportKey);
            }
        }
    }

    const initOptions = await resolveInitOptions({
        mapConfig: {
            center: mapConfig.center,
            zoom: mapConfig.zoom,
            bearing: mapConfig.bearing,
            pitch: mapConfig.pitch,
            minZoom: mapConfig.minZoom,
            maxZoom: mapConfig.maxZoom,
            minPitch: mapConfig.minPitch,
            maxPitch: mapConfig.maxPitch,
            maxBounds: mapConfig.maxBounds,
            style: styleConfig,
            projection: mapConfig.projection,
        },
        permalinkState,
        fallbackViewport,
        fallbackProjection,
    });

    // Initialize the map
    adapter.initialize(mapElement.id, initOptions);
    console.log(`[app] Initialized map "${mapId}" with config:`, mapConfig);

    // Inject config-edit tool if ?configedit= is set for this map index
    if (isConfigEditEnabled(mapIndex)) {
        await injectConfigEditTool(mapElement);
    }
}
