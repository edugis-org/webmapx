/**
 * Runs a TypeScript file as a CLI.
 *
 * Node 20 cannot execute .ts directly, but webmapx is a TypeScript codebase and
 * its tools should be written in TypeScript rather than drifting into
 * hand-maintained JavaScript. This bundles the entry point (and everything it
 * imports from src/) with esbuild into a temp dir, then runs it — the same
 * approach scripts/run-tests.mjs uses for the test suite.
 *
 * Usage: node scripts/run-ts.mjs <entry.ts> [args passed through]
 */
import { build } from 'esbuild';
import { mkdir, mkdtemp, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');

const [entry, ...forwarded] = process.argv.slice(2);

if (!entry) {
  console.error('Usage: node scripts/run-ts.mjs <entry.ts> [args...]');
  process.exit(1);
}

const entryPath = path.resolve(repoRoot, entry);
// The bundle must live inside the repo, not in os.tmpdir(): dependencies are
// kept external (see below), so Node resolves them from the *output* file's
// location, and a bundle in /tmp cannot see ./node_modules.
const cacheRoot = path.join(repoRoot, 'node_modules', '.cache');
await mkdir(cacheRoot, { recursive: true });
const tempDir = await mkdtemp(path.join(cacheRoot, 'webmapx-ts-'));
const outfile = path.join(tempDir, 'entry.mjs');

try {
  await build({
    entryPoints: [entryPath],
    outfile,
    bundle: true,
    platform: 'node',
    format: 'esm',
    target: 'node20',
    // Keep real dependencies external so the bundle stays small and native
    // modules (playwright) resolve from node_modules as usual.
    packages: 'external',
    logLevel: 'warning',
  });

  const exitCode = await new Promise((resolve) => {
    const child = spawn(process.execPath, [outfile, ...forwarded], {
      cwd: repoRoot,
      stdio: 'inherit',
    });
    child.on('exit', (code) => resolve(code ?? 1));
  });

  process.exitCode = exitCode;
} finally {
  await rm(tempDir, { recursive: true, force: true });
}
