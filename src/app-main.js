// src/app-main.js (Final Corrected Version)

// 0. Import setBasePath using the bare module specifier
import { setBasePath } from '@shoelace-style/shoelace/dist/utilities/base-path.js';

// 1. Import Shoelace components used by your modules
import '@shoelace-style/shoelace/dist/components/button/button.js';
// FIX: Change to the correct component file: range/range.js
import '@shoelace-style/shoelace/dist/components/range/range.js';

// CRITICAL: Set the base path to the public directory where assets are copied.
setBasePath('/shoelace-assets/'); 

// 2. Register your custom Web Components
import './components/modules/gis-new-tool.js'; 

// 3. Import the Central State Store and Map Adapter
import { mapAdapter } from './map/maplibre-adapter.js'; 

// 4. Initialize the map when the DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const mapContainerId = 'map-container';
    
    mapAdapter.core.initialize(mapContainerId);
    
    console.log("Modular GIS UI is running. Map initialized and components registered.");
});