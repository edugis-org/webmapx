import { build } from 'esbuild';
import { access, mkdtemp, readdir, rm } from 'node:fs/promises';
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

function parseArgs(argv) {
  const files = [];
  const nodeArgs = [];
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg.startsWith('--')) {
      nodeArgs.push(arg);
      if (!arg.includes('=') && i + 1 < argv.length && !argv[i + 1].startsWith('-') && !argv[i + 1].endsWith('.ts')) {
        nodeArgs.push(argv[++i]);
      }
    } else {
      files.push(arg);
    }
  }
  return { files, nodeArgs };
}

async function collectTestFiles() {
  const entries = await readdir(testsDir, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith('.test.ts'))
    .map((entry) => path.join(testsDir, entry.name))
    .sort();
}

async function resolveRequestedFiles(requestedFiles) {
  if (requestedFiles.length === 0) return collectTestFiles();

  const resolved = requestedFiles.map((file) => {
    const candidate = path.isAbsolute(file) ? file : path.resolve(repoRoot, file);
    return candidate.endsWith('.test.ts')
      ? candidate
      : path.join(testsDir, `${file.replace(/\.ts$/, '')}.test.ts`);
  });

  for (const file of resolved) {
    try {
      await access(file);
    } catch {
      console.error(`Test file not found: ${path.relative(repoRoot, file)}`);
      process.exit(1);
    }
  }

  return resolved.sort();
}

function runNodeTests(compiledFiles, nodeArgs) {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, ['--test', ...nodeArgs, ...compiledFiles], {
      cwd: repoRoot,
      stdio: 'inherit',
    });

    child.on('exit', (code) => {
      resolve(code ?? 1);
    });
  });
}

const { files: requestedFiles, nodeArgs } = parseArgs(process.argv.slice(2));
const testFiles = await resolveRequestedFiles(requestedFiles);

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

  const exitCode = await runNodeTests(compiledFiles, nodeArgs);
  process.exit(exitCode);
} finally {
  await rm(tempDir, { recursive: true, force: true });
}
