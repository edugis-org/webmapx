import { defineConfig } from 'vite';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import { readFileSync } from 'fs';

const _mlVersion = JSON.parse(readFileSync('./node_modules/maplibre-gl/package.json', 'utf8')).version;
const _mlMajor = parseInt(_mlVersion.split('.')[0]);

export default defineConfig({
  base: './', // Set base to relative path for correct asset loading
  optimizeDeps: _mlMajor >= 6 ? { exclude: ['maplibre-gl'] } : {},
  plugins: [
    // Configure the plugin to copy Shoelace assets
    viteStaticCopy({
      targets: [
        {
          src: 'config/**/*.json',
          dest: 'config'
        },
        {
          src: 'favicon.ico',
          dest: ''
        },
        {
          src: 'node_modules/@shoelace-style/shoelace/dist/assets',
          // Assets will be copied to dist/shoelace-assets/assets
          dest: 'shoelace-assets' 
        },
        {
          // Cesium runtime assets (Workers, Assets, Widgets, ThirdParty, Cesium.js)
          // are required at runtime and are copied from node_modules so CI builds
          // (e.g. GitHub Pages) do not depend on local public/cesium setup.
          src: 'node_modules/cesium/Build/Cesium/**',
          dest: 'cesium'
        }
      ]
    })
  ],
  build: {
    // Output directory for the production build
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: 'index.html',
        setup: 'testpages/setup.html',
        preview: 'testpages/preview.html',
      },
      output: {
        manualChunks(id) {
          if (
            id.includes('/src/store/') ||
            id.includes('/src/config/') ||
            id.includes('/src/utils/') ||
            id.includes('/src/map/IMap')
          ) {
            return 'webmapx-shared';
          }

          if (!id.includes('node_modules') && !id.includes('/src/map/')) {
            return;
          }

          if (id.includes('/src/map/maplibre-') || id.includes('/src/map/maplibre-services/')) {
            return 'maplibre-adapter';
          }
          if (id.includes('/src/map/openlayers-') || id.includes('/src/map/openlayers-services/')) {
            return 'openlayers-adapter';
          }
          if (id.includes('/src/map/leaflet-') || id.includes('/src/map/leaflet-services/')) {
            return 'leaflet-adapter';
          }
          if (id.includes('/src/map/cesium-') || id.includes('/src/map/cesium-services/')) {
            return 'cesium-adapter';
          }

          if (id.includes('node_modules/maplibre-gl')) {
            return 'vendor-maplibre-core';
          }
          if (id.includes('node_modules/ol-mapbox-style')) {
            return 'vendor-openlayers-style';
          }
          if (id.includes('node_modules/ol/')) {
            return 'vendor-openlayers-core';
          }
          if (id.includes('node_modules/leaflet')) {
            return 'vendor-leaflet';
          }
          if (id.includes('node_modules/@allmaps/maplibre/')) {
            return 'vendor-allmaps-maplibre';
          }
          if (id.includes('node_modules/@allmaps/openlayers/')) {
            return 'vendor-allmaps-openlayers';
          }
          if (id.includes('node_modules/@allmaps/leaflet/')) {
            return 'vendor-allmaps-leaflet';
          }
          if (id.includes('node_modules/@allmaps/render/')) {
            return 'vendor-allmaps-render';
          }
          if (id.includes('node_modules/@allmaps/warpedmaplayer/')) {
            return 'vendor-allmaps-warped';
          }
          if (
            id.includes('node_modules/@allmaps/stdlib/') ||
            id.includes('node_modules/@allmaps/transform/') ||
            id.includes('node_modules/@allmaps/project/') ||
            id.includes('node_modules/@allmaps/annotation/') ||
            id.includes('node_modules/@allmaps/iiif-parser/') ||
            id.includes('node_modules/@allmaps/id/') ||
            id.includes('node_modules/@allmaps/types/') ||
            id.includes('node_modules/@allmaps/triangulate/')
          ) {
            return 'vendor-allmaps-foundation';
          }
          if (id.includes('node_modules/@allmaps/')) {
            return 'vendor-allmaps-core';
          }
          if (
            id.includes('node_modules/@mapbox/') ||
            id.includes('node_modules/@maplibre/') ||
            id.includes('node_modules/earcut') ||
            id.includes('node_modules/pbf') ||
            id.includes('node_modules/vt-pbf') ||
            id.includes('node_modules/supercluster') ||
            id.includes('node_modules/geojson-vt') ||
            id.includes('node_modules/potpack') ||
            id.includes('node_modules/gl-matrix') ||
            id.includes('node_modules/kdbush')
          ) {
            return 'vendor-maplibre-support';
          }
          if (id.includes('node_modules/lit') || id.includes('node_modules/@lit')) {
            return 'vendor-lit';
          }
          if (id.includes('node_modules/@shoelace-style')) {
            return 'vendor-shoelace';
          }
        }
      }
    }
  },
});
