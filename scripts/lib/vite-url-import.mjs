/**
 * esbuild plugin for Vite-style `?url` imports.
 *
 * `src/` imports icons as `import iconUrl from '../icons/x.svg?url'`, which Vite
 * turns into a URL string. Anything that bundles `src/` outside Vite — the test
 * runner, the TypeScript CLI runner — hits those imports and fails with "No
 * loader is configured for .svg files" unless it resolves them the same way.
 * Inlining as a data URI keeps the value self-contained, which is what a Node
 * process wants: there is no server to serve a separate file from.
 *
 * Both runners must stay JavaScript: they are what makes running TypeScript
 * possible in the first place, so they cannot be written in it.
 */
import { readFile } from 'node:fs/promises';
import path from 'node:path';

const MIME_TYPES = {
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
};

export function viteUrlImportPlugin() {
  return {
    name: 'vite-url-import',
    setup(build) {
      build.onResolve({ filter: /\?url$/ }, (args) => ({
        path: args.path.replace(/\?url$/, ''),
        namespace: 'url-import',
        pluginData: { resolveDir: args.resolveDir },
      }));

      build.onLoad({ filter: /.*/, namespace: 'url-import' }, async (args) => {
        const abs = path.resolve(args.pluginData.resolveDir, args.path);
        const contents = await readFile(abs);
        const mime = MIME_TYPES[path.extname(abs).toLowerCase()] ?? 'application/octet-stream';
        const dataUrl = `data:${mime};base64,${contents.toString('base64')}`;
        return { contents: `export default ${JSON.stringify(dataUrl)};`, loader: 'js' };
      });
    },
  };
}
