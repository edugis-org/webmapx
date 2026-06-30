import { build } from 'esbuild';
import { mkdtemp, readdir, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');
const testsDir = path.join(repoRoot, 'tests');
const tempDir = await mkdtemp(path.join(os.tmpdir(), 'webmapx-tests-'));

async function collectTestFiles() {
  const entries = await readdir(testsDir, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith('.test.ts'))
    .map((entry) => path.join(testsDir, entry.name))
    .sort();
}

function runNodeTests(compiledFiles) {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, ['--test', ...compiledFiles], {
      cwd: repoRoot,
      stdio: 'inherit',
    });

    child.on('exit', (code) => {
      resolve(code ?? 1);
    });
  });
}

const testFiles = await collectTestFiles();

if (testFiles.length === 0) {
  console.error('No test files found in ./tests');
  process.exit(1);
}

try {
  const compiledFiles = [];

  for (const testFile of testFiles) {
    const outfile = path.join(tempDir, `${path.basename(testFile, '.ts')}.mjs`);
    await build({
      entryPoints: [testFile],
      outfile,
      bundle: true,
      format: 'esm',
      platform: 'node',
      sourcemap: 'inline',
      target: 'node22',
      logLevel: 'silent',
      plugins: [
        {
          // Vite-style `?url` imports: resolve to a data URI of the file contents.
          name: 'vite-url-import',
          setup(b) {
            b.onResolve({ filter: /\?url$/ }, (args) => ({
              path: args.path.replace(/\?url$/, ''),
              namespace: 'url-import',
              pluginData: { resolveDir: args.resolveDir },
            }));
            b.onLoad({ filter: /.*/, namespace: 'url-import' }, async (args) => {
              const abs = path.resolve(args.pluginData.resolveDir, args.path);
              const contents = await readFile(abs);
              const mime = abs.endsWith('.svg') ? 'image/svg+xml' : 'application/octet-stream';
              const dataUrl = `data:${mime};base64,${contents.toString('base64')}`;
              return { contents: `export default ${JSON.stringify(dataUrl)};`, loader: 'js' };
            });
          },
        },
      ],
    });
    compiledFiles.push(outfile);
  }

  const exitCode = await runNodeTests(compiledFiles);
  process.exit(exitCode);
} finally {
  await rm(tempDir, { recursive: true, force: true });
}
