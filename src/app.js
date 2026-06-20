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
import { getConfigUrlForIndex } from './utils/permalink.ts';
import { DROPPED_CONFIG_KEY } from './utils/dropped-config.ts';
import { DEFAULT_ADAPTER_NAME } from './map/adapter-registry';
import {
    getMapScopedStorageKey,
    resolveAdapterSelection
} from './config/adapter-resolution.ts';
import { peekMapState } from './map/map-state-persistence.ts';

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
import './components/webmapx-add-layer-tool.ts';
import './components/webmapx-scale-control.ts';
import './components/webmapx-navigation-control.ts';
import './components/webmapx-fullscreen-control.ts';
import './components/webmapx-attribution-control.ts';
import './components/webmapx-language-osmvector.ts';
import './components/webmapx-print-tool.ts';

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
                alert(`Failed to load config from "${perMapConfigUrl}":\n${error.message}`);
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
                alert(`Failed to load config from "${getConfigUrlParam()}":\n${error.message}`);
            }
        }

        await initializeMap(mapElement, mapConfig, mapIndex);
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
    const persistedState = peekMapState(mapElement.id);
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

    // Permalink viewport takes highest priority — apply before map init so the
    // engine never renders at the config's default center/zoom
    // s.0= takes precedence over s= for index 0
    const searchParams = new URLSearchParams(window.location.search);
    const permalinkParam = searchParams.get(`s.${mapIndex}`) ?? (mapIndex === 0 ? searchParams.get('s') : null);
    if (permalinkParam) {
        try {
            const permalinkState = JSON.parse(atob(permalinkParam));
            if (Array.isArray(permalinkState?.v) && permalinkState.v.length === 5) {
                const [lng, lat, zoom, bearing, pitch] = permalinkState.v;
                initOptions.center = [lng, lat];
                initOptions.zoom = zoom;
                if (bearing !== 0) initOptions.bearing = bearing;
                if (pitch !== 0) initOptions.pitch = pitch;
            }
        } catch { /* ignore malformed permalink */ }
    } else if (persistedState?.viewport) {
        initOptions.center = persistedState.viewport.center;
        initOptions.zoom = persistedState.viewport.zoom;
    } else if (savedViewport) {
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

    // Determine which projection to apply: permalink > persisted state
    const projectionToApply = (() => {
        if (permalinkParam) {
            try {
                const ps = JSON.parse(atob(permalinkParam));
                if (typeof ps?.p === 'string') return ps.p;
            } catch { /* ignore */ }
            return null;
        }
        return persistedState?.projection ?? null;
    })();

    if (projectionToApply) {
        // Always set projection option — MapCoreService adds it to the style spec via projectionSpec
        initOptions.projection = projectionToApply;
        if (isStyleUrl) {
            // Switch URL style to inline so MapCoreService can inject projection into setStyle()
            // v4 only applies projection during initial renderer setup (first setStyle call)
            try {
                const resp = await fetch(styleConfig);
                initOptions.style = await resp.json();
                delete initOptions.styleUrl;
            } catch (e) {
                console.warn('[app] Failed to fetch style for projection injection:', e);
                // styleUrl fallback — projection will still apply in v5+ via runtime setProjection
            }
        }
    }


    // Initialize the map
    adapter.initialize(mapElement.id, initOptions);
    console.log(`[app] Initialized map "${mapId}" with config:`, mapConfig);
}
import './components/webmapx-view-mode-tool.ts';
import './components/webmapx-3d-tool.ts';
import './components/webmapx-truearea-tool.ts';
import './components/webmapx-active-adapter.ts';
