import { build } from 'esbuild';
import { mkdtemp, readdir, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import { viteUrlImportPlugin } from './lib/vite-url-import.mjs';

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
      plugins: [viteUrlImportPlugin()],
    });
    compiledFiles.push(outfile);
  }

  const exitCode = await runNodeTests(compiledFiles);
  process.exit(exitCode);
} finally {
  await rm(tempDir, { recursive: true, force: true });
}
