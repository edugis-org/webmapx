import { defineConfig } from 'vite';
import { readFileSync } from 'fs';

const pkg = JSON.parse(readFileSync('./package.json', 'utf8'));

export default defineConfig({
  build: {
    lib: {
      entry: 'src/lib.ts',
      formats: ['es'],
      fileName: 'webmapx',
    },
    outDir: 'dist-lib',
    rollupOptions: {
      external: [
        'maplibre-gl',
        'ol',
        'ol-mapbox-style',
        'leaflet',
        'cesium',
        'lit',
        '@lit/reactive-element',
        'lit-html',
        'lit-element',
        '@shoelace-style/shoelace',
      ],
      output: {},
    },
  },
  define: {
    __WEBMAPX_VERSION__: JSON.stringify(pkg.version),
  },
});
