import { defineConfig } from 'vite';
import { readFileSync } from 'fs';

const pkg = JSON.parse(readFileSync('./package.json', 'utf8'));

export default defineConfig({
  publicDir: false,
  build: {
    lib: {
      entry: 'src/lib.ts',
      formats: ['es'],
      fileName: 'webmapx',
    },
    outDir: 'dist-lib',
    rollupOptions: {
      // Map engines are peer deps — consumers bring their own.
      // Lit and Shoelace are bundled so CDN users need no importmap for them.
      external: (id: string) =>
        id === 'maplibre-gl' ||
        id === 'ol' || id.startsWith('ol/') ||
        id === 'ol-mapbox-style' ||
        id === 'leaflet' ||
        id === 'cesium',
      output: {},
    },
  },
  define: {
    __WEBMAPX_VERSION__: JSON.stringify(pkg.version),
  },
});
