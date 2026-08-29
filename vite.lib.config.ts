import { defineConfig, type Plugin } from 'vite';
import { readFileSync } from 'fs';

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

export default defineConfig({
  publicDir: false,
  plugins: [cliShebang()],
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
