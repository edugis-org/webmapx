import { defineConfig, type Plugin } from 'vite';
import { readFileSync } from 'fs';
import path from 'path';

const pkg = JSON.parse(readFileSync('./package.json', 'utf8'));

/**
 * Three entry points, because they are used in three different places.
 *
 * `webmapx` is the app: Lit, Shoelace, the stylesheets, every component.
 * `webmapx-config` is validation only — no DOM, no CSS — so a config
 * repository's CI or the EduGIS converter can check a file in a bare Node
 * process without loading a browser's worth of code. `webmapx-validate` is the
 * same validator behind a command line, which is what a CI job actually runs.
 */
const CLI_ENTRY = 'webmapx-validate';

/** Makes the built CLI chunk directly executable as a `bin` script. */
function cliShebang(): Plugin {
  return {
    name: 'webmapx-cli-shebang',
    generateBundle(_options, bundle) {
      for (const [fileName, chunk] of Object.entries(bundle)) {
        if (chunk.type !== 'chunk' || !fileName.startsWith(CLI_ENTRY)) continue;
        chunk.code = `#!/usr/bin/env node\n${chunk.code}`;
      }
    },
  };
}

/**
 * Undoes library mode's unconditional asset inlining for the big binaries.
 *
 * Vite inlines every asset in library mode — `assetsInlineLimit` is ignored
 * there — which turned the spatial worker into a 53 MB file: gdal3.js's 26.9 MB
 * wasm, its 11.1 MB data and go-cart's 0.7 MB, base64'd into JavaScript. Base64
 * costs a third again in size, cannot be streamed to the WASM compiler, and
 * cannot be cached by the browser as a wasm module. The app build does not do
 * this — its `?url` imports emit real files beside the worker — so this makes
 * the published library behave the way the app already does.
 *
 * Small assets stay inlined on purpose. gdal3.js's own 0.2 MB loader is fetched
 * as a script, and a script served from a `.bin` file trips MIME checking.
 */
function extractInlinedAssets(minBase64Chars = 500_000): Plugin {
  return {
    name: 'webmapx-extract-inlined-assets',
    generateBundle(_options, bundle) {
      for (const [fileName, chunk] of Object.entries(bundle)) {
        if (chunk.type !== 'chunk') continue;

        let index = 0;
        const code = chunk.code.replace(
          /`data:(application\/wasm|application\/octet-stream);base64,([A-Za-z0-9+/=]+)`/g,
          (whole: string, mime: string, base64: string) => {
            if (base64.length < minBase64Chars) return whole;
            const extension = mime === 'application/wasm' ? 'wasm' : 'bin';
            const base = path.basename(fileName).replace(/\.[^.]+$/, '').replace(/[^\w.-]+/g, '-');
            const assetName = `${base}-inlined-${index++}.${extension}`;
            this.emitFile({ type: 'asset', fileName: `assets/${assetName}`, source: Buffer.from(base64, 'base64') });
            // Addressed relative to the chunk that used it, which is where it
            // is emitted — the same shape the app build produces.
            return '(new URL(`./' + assetName + '`, self.location.href).href)';
          },
        );

        if (index > 0) chunk.code = code;
      }
    },
  };
}

export default defineConfig({
  publicDir: false,
  plugins: [cliShebang(), extractInlinedAssets()],
  // Workers are built by a separate rollup pass with its own plugin list, so
  // the extraction has to be registered there too — that pass is the one that
  // produces the spatial worker, which is where all the weight is.
  worker: {
    format: 'es',
    plugins: () => [extractInlinedAssets()],
  },
  build: {
    lib: {
      entry: {
        webmapx: 'src/lib.ts',
        'webmapx-config': 'src/config-lib.ts',
        [CLI_ENTRY]: 'src/cli/validate-config.ts',
      },
      formats: ['es'],
      fileName: (_format, entryName) => `${entryName}.js`,
    },
    outDir: 'dist-lib',
    rollupOptions: {
      // Map engines are peer deps — consumers bring their own.
      // Lit and Shoelace are bundled so CDN users need no importmap for them.
      // Node builtins are external so the CLI keeps working as a Node script.
      external: (id: string) =>
        id.startsWith('node:') ||
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
