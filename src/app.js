// src/app.js

// 0. Import setBasePath using the bare module specifier
import { setBasePath } from '@shoelace-style/shoelace/dist/utilities/base-path.js';

// CRITICAL: Set the base path to the public directory where assets are copied.
setBasePath('/shoelace-assets/');

// 1. Import configuration loader
import { loadAppConfig, resolveMapConfig, fetchConfig, DEFAULT_MAP_CONFIG } from './config/index.ts';

// 2. Register your custom Web Components
import './components/modules/webmapx-map.ts';
import './components/modules/webmapx-tool-template.ts';
import './components/modules/webmapx-zoom-level.ts';
import './components/modules/webmapx-layout.ts';
import './components/modules/webmapx-inset-map.ts';
import './components/modules/webmapx-toolbar.ts';
import './components/modules/webmapx-control-group.ts';
import './components/modules/webmapx-tool-panel.ts';
import './components/modules/webmapx-layer-tree.ts';
import './components/modules/webmapx-settings.ts';
import './components/modules/webmapx-coordinates-tool.ts';
import './components/modules/webmapx-spinner.ts';
import './components/modules/webmapx-measure-tool.ts';

// 3. Initialize the app when the DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
    // Load app config from ?config= URL parameter (if present)
    let appConfig = null;
    try {
        const loaded = await loadAppConfig();
        if (loaded) {
            appConfig = loaded.config;
            console.log(`[app] Loaded config from: ${loaded.source}`);
        }
    } catch (error) {
        console.error('[app] Failed to load app config:', error);
    }

    // Initialize each webmapx-map on the page
    const mapElements = document.querySelectorAll('webmapx-map');

    for (const mapElement of mapElements) {
        await initializeMap(mapElement, appConfig);
    }

    console.log("Modular GIS UI is running. Map(s) initialized and components registered.");
});

/**
 * Initialize a single webmapx-map element with resolved configuration.
 * @param {HTMLElement} mapElement - The webmapx-map element
 * @param {object|null} appConfig - App-level config from URL param (overrides all)
 */
async function initializeMap(mapElement, appConfig) {
    const mapId = mapElement.id || 'unnamed-map';

    const adapter = await mapElement.getAdapterAsync?.();
    if (!adapter) {
        console.error(`[app] Map adapter is not available on <webmapx-map id="${mapId}">.`);
        return;
    }

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

    // If we have a full config, set it on the map element for tools to access
    if (fullConfig) {
        mapElement.setConfig(fullConfig);
    }

    // Resolve map configuration with priority cascade
    const mapConfig = await resolveMapConfig(mapElement, fullConfig);

    // Check for saved viewport state (from adapter switch)
    const savedViewport = localStorage.getItem('webmapx-viewport');

    // Determine style options: string = URL, object = inline style
    const styleConfig = mapConfig.style;
    const isStyleUrl = typeof styleConfig === 'string';

    let initOptions = {
        center: mapConfig.center,
        zoom: mapConfig.zoom,
        // Use styleUrl if string, otherwise inline style object
        ...(isStyleUrl ? { styleUrl: styleConfig } : { style: styleConfig })
    };

    if (savedViewport) {
        try {
            const viewport = JSON.parse(savedViewport);
            initOptions.center = viewport.center;
            initOptions.zoom = viewport.zoom;
            localStorage.removeItem('webmapx-viewport');
            console.log(`[app] Restored viewport for "${mapId}" from adapter switch:`, viewport);
        } catch (e) {
            console.warn(`[app] Failed to parse saved viewport for "${mapId}":`, e);
            localStorage.removeItem('webmapx-viewport');
        }
    }

    // Initialize the map
    adapter.core.initialize(mapElement.id, initOptions);
    console.log(`[app] Initialized map "${mapId}" with config:`, mapConfig);
}
