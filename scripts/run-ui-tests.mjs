import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { readdir } from 'node:fs/promises';
import { chromium } from 'playwright';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');
const suitesDir = path.join(__dirname, 'ui-tests');

const DEFAULT_ENGINES = ['maplibre', 'openlayers', 'leaflet', 'cesium'];
const DEV_HOST = process.env.UI_TEST_HOST ?? '127.0.0.1';
const DEV_PORT = Number(process.env.UI_TEST_PORT ?? '41730');
const BASE_URL = `http://${DEV_HOST}:${DEV_PORT}`;

function parseArgs(argv) {
  const result = {
    all: false,
    suite: null,
    engines: null,
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--all') {
      result.all = true;
      continue;
    }
    if (arg === '--suite') {
      result.suite = argv[i + 1] ?? null;
      i += 1;
      continue;
    }
    if (arg === '--engines') {
      const raw = argv[i + 1] ?? '';
      const parsed = raw
        .split(',')
        .map((name) => name.trim().toLowerCase())
        .filter(Boolean);
      result.engines = parsed.length > 0 ? parsed : null;
      i += 1;
      continue;
    }
  }

  return result;
}

async function listSuiteIds() {
  const entries = await readdir(suitesDir, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith('.mjs'))
    .map((entry) => entry.name.replace(/\.mjs$/, ''))
    .sort();
}

async function resolveSuiteIds(args) {
  if (args.suite) {
    return [args.suite];
  }
  if (args.all) {
    return listSuiteIds();
  }
  return ['tool-draw'];
}

async function importSuite(suiteId) {
  const filePath = path.join(suitesDir, `${suiteId}.mjs`);
  const moduleUrl = pathToFileURL(filePath).href;
  const mod = await import(moduleUrl);
  if (typeof mod.run !== 'function') {
    throw new Error(`UI suite "${suiteId}" must export a run function.`);
  }
  return mod;
}

async function waitForServer(url, timeoutMs, proc) {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch (_) {
      // keep polling
    }

    await new Promise((resolve) => setTimeout(resolve, 350));
  }

  throw new Error(`Timed out waiting for dev server at ${url}`);
}

function startDevServer() {
  const child = spawn('npm', ['run', 'dev', '--', '--host', DEV_HOST, '--port', String(DEV_PORT), '--strictPort', '--no-open'], {
    cwd: repoRoot,
    detached: true,
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  child.stdout?.on('data', (chunk) => {
    process.stdout.write(`[dev] ${chunk}`);
  });

  child.stderr?.on('data', (chunk) => {
    process.stderr.write(`[dev] ${chunk}`);
  });

  return child;
}

async function stopProcess(proc) {
  if (!proc || proc.exitCode !== null) return;

  const killGroup = (signal) => {
    try {
      if (proc.pid) {
        process.kill(-proc.pid, signal);
        return;
      }
    } catch (_) {
      // Fall back to killing only the direct child.
    }

    try {
      proc.kill(signal);
    } catch (_) {
      // ignore
    }
  };

  killGroup('SIGTERM');
  await new Promise((resolve) => {
    const timeout = setTimeout(() => {
      killGroup('SIGKILL');
      resolve();
    }, 3000);

    proc.once('exit', () => {
      clearTimeout(timeout);
      resolve();
    });
  });

  proc.stdout?.removeAllListeners();
  proc.stderr?.removeAllListeners();
  proc.stdout?.destroy();
  proc.stderr?.destroy();
}

async function run() {
  const args = parseArgs(process.argv.slice(2));
  const suiteIds = await resolveSuiteIds(args);

  if (suiteIds.length === 0) {
    console.error('No UI suites found.');
    process.exit(1);
  }

  const server = startDevServer();
  let browser;
  let failures = 0;

  try {
    await waitForServer(BASE_URL, 90_000, server);
    browser = await chromium.launch({
      headless: true,
      args: ['--disable-gpu', '--use-gl=swiftshader'],
    });

    for (const suiteId of suiteIds) {
      const suite = await importSuite(suiteId);
      const suiteEngines = Array.isArray(suite.engines) && suite.engines.length > 0
        ? suite.engines
        : DEFAULT_ENGINES;
      const engines = args.engines
        ? suiteEngines.filter((engine) => args.engines.includes(engine))
        : suiteEngines;

      if (engines.length === 0) {
        process.stdout.write(`SKIP ${suiteId} (no matching engines)\n`);
        continue;
      }

      for (const engine of engines) {
        const context = await browser.newContext();
        const page = await context.newPage();

        await context.addInitScript((selectedEngine) => {
          window.localStorage.setItem('webmapx-adapter:map-container', selectedEngine);
        }, engine);

        try {
          await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });

          await suite.run({
            page,
            engine,
            baseUrl: BASE_URL,
          });

          process.stdout.write(`PASS ${suiteId} (${engine})\n`);
        } catch (error) {
          failures += 1;
          process.stderr.write(`FAIL ${suiteId} (${engine}): ${error instanceof Error ? error.message : String(error)}\n`);
        } finally {
          await context.close();
        }
      }
    }
  } catch (error) {
    if (error instanceof Error && /Executable doesn't exist|browserType\.launch/i.test(error.message)) {
      console.error('Playwright browser binaries are missing. Run: npx playwright install chromium');
    }
    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
    await stopProcess(server);
  }

  process.exit(failures > 0 ? 1 : 0);
}

await run();
