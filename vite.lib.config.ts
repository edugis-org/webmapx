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
      external: (id: string) =>
        id === 'maplibre-gl' ||
        id === 'ol' || id.startsWith('ol/') ||
        id === 'ol-mapbox-style' ||
        id === 'leaflet' ||
        id === 'cesium' ||
        id === 'lit' || id.startsWith('lit/') ||
        id === '@lit/reactive-element' || id.startsWith('@lit/reactive-element/') ||
        id === 'lit-html' || id.startsWith('lit-html/') ||
        id === 'lit-element' || id.startsWith('lit-element/') ||
        id === '@shoelace-style/shoelace' || id.startsWith('@shoelace-style/shoelace/'),
      output: {},
    },
  },
  define: {
    __WEBMAPX_VERSION__: JSON.stringify(pkg.version),
  },
});
