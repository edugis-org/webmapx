// src/app-main.js (Final Corrected Version)

// 0. Import setBasePath using the bare module specifier
import { setBasePath } from '@shoelace-style/shoelace/dist/utilities/base-path.js';

// 1. Import Shoelace components used by your modules
import '@shoelace-style/shoelace/dist/components/button/button.js';
import '@shoelace-style/shoelace/dist/components/range/range.js';
import '@shoelace-style/shoelace/dist/components/input/input.js';

// CRITICAL: Set the base path to the public directory where assets are copied.
setBasePath('/shoelace-assets/'); 

// 2. Register your custom Web Components
import './components/modules/gis-new-tool.js';
import './components/modules/gis-zoom-display.js';

// 3. Import the Central State Store and Map Adapter
import { mapAdapter } from './map/maplibre-adapter.js'; 

// 4. Initialize the map when the DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const mapContainerId = 'map-container';
    
    // Initialize with OpenStreetMap style and custom viewport
    mapAdapter.core.initialize(mapContainerId, {
        center: [4.9041, 52.3676], // Amsterdam
        zoom: 4.5,
        // Use MapLibre demo OSM style; replace with your own if needed
        styleUrl: 'https://demotiles.maplibre.org/style.json'
    });
    
    console.log("Modular GIS UI is running. Map initialized and components registered.");
});