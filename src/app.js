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
import { loadAppConfig, resolveMapConfig, fetchConfig, parseAndValidateConfig } from './config/index.ts';
import { DROPPED_CONFIG_KEY } from './utils/dropped-config.ts';
import { DEFAULT_ADAPTER_NAME } from './map/adapter-registry';
import {
    getMapScopedStorageKey,
    resolveAdapterSelection
} from './config/adapter-resolution.ts';

// 2. Register your custom Web Components
import './components/webmapx-map.ts';
import './components/webmapx-tool-template.ts';
import './components/webmapx-zoom-level.ts';
import './components/webmapx-layout.ts';
import './components/webmapx-inset-map.ts';
import './components/webmapx-search-tool.ts';
import './components/webmapx-toolbar.ts';
import './components/webmapx-control-group.ts';
import './components/webmapx-tool-panel.ts';
import './components/webmapx-layer-tree.ts';
import './components/webmapx-layer-overview.ts';
import './components/webmapx-settings.ts';
import './components/webmapx-coordinates-tool.ts';
import './components/webmapx-spinner.ts';
import './components/webmapx-measure-tool.ts';
import './components/webmapx-info-tool.ts';
import './components/webmapx-draw-tool.ts';
import './components/webmapx-geolocation-tool.ts';
import './components/webmapx-scale-control.ts';
import './components/webmapx-navigation-control.ts';
import './components/webmapx-attribution-control.ts';

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

    // A config dropped onto the map is staged in sessionStorage and the page
    // reloaded, so a fresh app/map init picks it up here (one-time use).
    let appConfig = null;
    const droppedConfig = sessionStorage.getItem(DROPPED_CONFIG_KEY);
    if (droppedConfig) {
        sessionStorage.removeItem(DROPPED_CONFIG_KEY);
        try {
            appConfig = parseAndValidateConfig(JSON.parse(droppedConfig), 'dropped config');
            console.log('[app] Loaded config from dropped file');
        } catch (error) {
            console.error('[app] Failed to load dropped config:', error);
        }
    }

    // Load app config from ?config= URL parameter (if present)
    if (!appConfig) {
        try {
            const loaded = await loadAppConfig();
            if (loaded) {
                appConfig = loaded.config;
                console.log(`[app] Loaded config from: ${loaded.source}`);
            }
        } catch (error) {
            console.error('[app] Failed to load app config:', error);
        }
    }

    // Initialize each webmapx-map on the page
    const mapElements = document.querySelectorAll('webmapx-map');

    for (const mapElement of mapElements) {
        await initializeMap(mapElement, appConfig);
    }

    console.log("Modular GIS UI is running. Map(s) initialized and components registered.");
});

function resolveRequestedAdapter(mapElement, mapConfig) {
    const savedKey = getMapScopedStorageKey(mapElement.id, 'adapter');
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
async function initializeMap(mapElement, appConfig) {
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
    }

    const adapter = await mapElement.getAdapterAsync?.();
    if (!adapter) {
        console.error(`[app] Map adapter is not available on <webmapx-map id="${mapId}">.`);
        return;
    }

    // Check for saved viewport state (from a map-scoped adapter switch)
    const savedViewportKey = getMapScopedStorageKey(mapElement.id, 'viewport');
    const savedViewport = savedViewportKey ? localStorage.getItem(savedViewportKey) : null;

    // Determine style options: string = URL, object = inline style
    const styleConfig = mapConfig.style;
    const isStyleUrl = typeof styleConfig === 'string';

    let initOptions = {
        center: mapConfig.center,
        zoom: mapConfig.zoom,
        minZoom: mapConfig.minZoom,
        maxZoom: mapConfig.maxZoom,
        minPitch: mapConfig.minPitch,
        maxPitch: mapConfig.maxPitch,
        // Use styleUrl if string, otherwise inline style object
        ...(isStyleUrl ? { styleUrl: styleConfig } : { style: styleConfig })
    };

    if (savedViewport) {
        try {
            const viewport = JSON.parse(savedViewport);
            initOptions.center = viewport.center;
            initOptions.zoom = viewport.zoom;
            if (savedViewportKey) {
                localStorage.removeItem(savedViewportKey);
            }
        } catch (e) {
            console.warn(`[app] Failed to parse saved viewport for "${mapId}":`, e);
            if (savedViewportKey) {
                localStorage.removeItem(savedViewportKey);
            }
        }
    }

    // Initialize the map
    adapter.initialize(mapElement.id, initOptions);
    console.log(`[app] Initialized map "${mapId}" with config:`, mapConfig);
}
import './components/webmapx-view-mode-tool.ts';
import './components/webmapx-truearea-tool.ts';
import './components/webmapx-active-adapter.ts';
