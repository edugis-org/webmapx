// src/app.js (Final Corrected Version)

// 0. Import setBasePath using the bare module specifier
import { setBasePath } from '@shoelace-style/shoelace/dist/utilities/base-path.js';

// CRITICAL: Set the base path to the public directory where assets are copied.
setBasePath('/shoelace-assets/'); 

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

// 3. Initialize the map when the DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const mapContainerId = 'map-container';
    const mapElement = document.getElementById(mapContainerId);
    if (!mapElement) {
        console.error(`[app] Unable to find <webmapx-map id="${mapContainerId}">`);
        return;
    }

    const adapter = mapElement.adapter;
    if (!adapter) {
        console.error('[app] Map adapter is not available on <webmapx-map>.');
        return;
    }

    // Check for saved viewport state (from adapter switch)
    const savedViewport = localStorage.getItem('webmapx-viewport');
    let initOptions = {
        center: [4.9041, 52.3676], // Amsterdam (default)
        zoom: 4.5,
        styleUrl: 'https://demotiles.maplibre.org/style.json'
    };

    if (savedViewport) {
        try {
            const viewport = JSON.parse(savedViewport);
            initOptions.center = viewport.center;
            initOptions.zoom = viewport.zoom;
            // Clear the saved viewport after using it
            localStorage.removeItem('webmapx-viewport');
            console.log('[app] Restored viewport from adapter switch:', viewport);
        } catch (e) {
            console.warn('[app] Failed to parse saved viewport:', e);
            localStorage.removeItem('webmapx-viewport');
        }
    }

    // Initialize the map
    adapter.core.initialize(mapContainerId, initOptions);

    console.log("Modular GIS UI is running. Map initialized and components registered.");
});