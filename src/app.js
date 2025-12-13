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
    
    // Initialize with OpenStreetMap style and custom viewport
    adapter.core.initialize(mapContainerId, {
        center: [4.9041, 52.3676], // Amsterdam
        zoom: 4.5,
        // Use MapLibre demo OSM style; replace with your own if needed
        styleUrl: 'https://demotiles.maplibre.org/style.json'
    });
    
    console.log("Modular GIS UI is running. Map initialized and components registered.");
});