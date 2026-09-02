import { spawn } from 'node:child_process';
import path from 'node:path';
import net from 'node:net';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { readdir } from 'node:fs/promises';
import { chromium } from 'playwright';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');
const suitesDir = path.join(__dirname, 'ui-tests');

const DEFAULT_ENGINES = ['maplibre', 'openlayers', 'leaflet', 'cesium'];
const DEV_HOST = process.env.UI_TEST_HOST ?? '127.0.0.1';
// UI_TEST_PORT pins an exact port (e.g. for CI log parsing or attaching a debugger) and is
// used as-is, single attempt. Without it, each run gets its own free OS-assigned port so
// concurrent `npm run ui-test` invocations (different people, or CI + local) never collide
// on a fixed port.
const EXPLICIT_PORT = process.env.UI_TEST_PORT ? Number(process.env.UI_TEST_PORT) : null;

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

/** Asks the OS for a currently-free port by binding to port 0 and reading back what it picked. */
function getFreePort(host) {
  return new Promise((resolve, reject) => {
    const probe = net.createServer();
    probe.unref();
    probe.on('error', reject);
    probe.listen(0, host, () => {
      const { port } = probe.address();
      probe.close(() => resolve(port));
    });
  });
}

async function waitForServer(url, timeoutMs, proc) {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    if (proc.exitCode !== null) {
      throw new Error(`Dev server process exited early (code ${proc.exitCode}) before becoming ready at ${url}`);
    }
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

function startDevServer(host, port) {
  const child = spawn('npm', ['run', 'dev', '--', '--host', host, '--port', String(port), '--strictPort', '--no-open'], {
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

/**
 * Starts the dev server on a free port, retrying with a different port if a rare bind race
 * loses the port between our free-port probe and vite's --strictPort bind. An explicit
 * UI_TEST_PORT is honored exactly, single attempt, so a deliberately pinned port still fails
 * loudly instead of silently moving elsewhere.
 */
async function startDevServerWithRetry(host) {
  const maxAttempts = EXPLICIT_PORT ? 1 : 5;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const port = EXPLICIT_PORT ?? await getFreePort(host);
    const baseUrl = `http://${host}:${port}`;
    const server = startDevServer(host, port);

    try {
      await waitForServer(baseUrl, 90_000, server);
      return { server, baseUrl };
    } catch (error) {
      await stopProcess(server);
      if (attempt === maxAttempts) throw error;
      console.warn(`[ui-test] Dev server failed to start on port ${port} (attempt ${attempt}/${maxAttempts}), retrying on a different port…`);
    }
  }
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

  const { server, baseUrl } = await startDevServerWithRetry(DEV_HOST);
  console.log(`[ui-test] Dev server running at ${baseUrl}`);
  let browser;
  let failures = 0;

  try {
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
        const context = await browser.newContext({
          extraHTTPHeaders: { 'Referer': 'https://webmapx.com' },
        });
        const page = await context.newPage();

        await context.addInitScript((selectedEngine) => {
          // The key is scoped by page and map id — `webmapx-adapter:{scope}:{mapId}`
          // (getMapScopedStorageKey). Without the scope the preference is never
          // read, and every engine in the matrix quietly runs the default one.
          //
          // The scope is `location.pathname + location.search`, and the search
          // half is not optional: every suite navigates to `appUrl(baseUrl)`,
          // which appends `?config=/tests/fixtures/demo.json`, so a key written
          // from the path alone is never the key the component reads. It failed
          // exactly the way the scope was added to prevent — silently, with the
          // matrix reporting PASS for openlayers, leaflet and cesium while all
          // four engine runs drove MapLibre. The init script runs on every
          // navigation, so `location` here is the page being loaded.
          window.localStorage.setItem(
            `webmapx-adapter:${location.pathname}${location.search}:map-container`,
            selectedEngine,
          );
        }, engine);

        try {
          await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });

          await suite.run({
            page,
            engine,
            baseUrl,
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
