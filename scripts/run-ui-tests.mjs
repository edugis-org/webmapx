import { spawn, spawnSync } from 'node:child_process';
import path from 'node:path';
import net from 'node:net';
import os from 'node:os';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');
const suitesDir = path.join(__dirname, 'ui-tests');
// How long each suite × engine took last time, so the next run can start the
// longest ones first. With several runs in flight, a long one picked up last
// keeps the whole run waiting while every other worker sits idle. Local cache,
// not committed: the numbers belong to this machine.
const TIMINGS_FILE = path.join(repoRoot, 'node_modules', '.cache', 'webmapx-ui-timings.json');

async function readTimings() {
  try {
    return JSON.parse(await readFile(TIMINGS_FILE, 'utf8'));
  } catch {
    return {};
  }
}

async function writeTimings(timings) {
  try {
    await mkdir(path.dirname(TIMINGS_FILE), { recursive: true });
    await writeFile(TIMINGS_FILE, `${JSON.stringify(timings, null, 2)}\n`);
  } catch {
    // A missing cache only costs the ordering next time.
  }
}

const DEFAULT_ENGINES = ['maplibre', 'openlayers', 'leaflet', 'cesium'];
const DEV_HOST = process.env.UI_TEST_HOST ?? '127.0.0.1';
// UI_TEST_PORT pins an exact port (e.g. for CI log parsing or attaching a debugger) and is
// used as-is, single attempt. Without it, each run gets its own free OS-assigned port so
// concurrent `npm run ui-test` invocations (different people, or CI + local) never collide
// on a fixed port.
const EXPLICIT_PORT = process.env.UI_TEST_PORT ? Number(process.env.UI_TEST_PORT) : null;

// What one suite × engine run costs, measured with four in flight on a
// 12-core laptop: Chromium held ~3.1 GB (≈ 750 MB a run, its share of the
// browser and GPU processes included) and the load average sat at 10 —
// SwiftShader renders WebGL on the CPU, so a run keeps two to three cores busy.
const MEMORY_PER_RUN = 750 * 1024 * 1024;
const CORES_PER_RUN = 3;
// Left over for the dev server, the OS and whatever else the machine is doing.
const MEMORY_RESERVE = 1024 * 1024 * 1024;
// Cesium runs in flight at once, whatever `--jobs` says; see the worker below.
const MAX_CESIUM_IN_FLIGHT = 2;

/**
 * How many runs to keep in flight. `auto` takes whichever of cores and
 * *currently available* memory runs out first, so a busy laptop gets fewer
 * than an idle one; past that, more runs only make each one slower (and a slow
 * run is a run that times out).
 */
function resolveJobs(requested) {
  if (requested !== 'auto') {
    const jobs = Number(requested);
    if (!Number.isInteger(jobs) || jobs < 1) throw new Error(`--jobs expects a positive number or "auto", got "${requested}"`);
    return { jobs, reason: 'requested' };
  }
  const cores = os.availableParallelism?.() ?? os.cpus().length;
  const byCpu = Math.max(1, Math.ceil(cores / CORES_PER_RUN));
  const byMemory = Math.max(1, Math.floor((os.freemem() - MEMORY_RESERVE) / MEMORY_PER_RUN));
  return {
    jobs: Math.min(byCpu, byMemory),
    reason: `auto: ${cores} cores allow ${byCpu}, ${(os.freemem() / 2 ** 30).toFixed(1)} GB free allows ${byMemory}`,
  };
}

function parseArgs(argv) {
  const result = {
    all: false,
    suite: null,
    engines: null,
    jobs: process.env.UI_TEST_JOBS ?? 'auto',
    shard: null,
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
    if (arg === '--shard') {
      // `--shard 2/4`: the second of four slices of the suite × engine runs,
      // so separate machines (the CI matrix) can each take one.
      const match = /^(\d+)\/(\d+)$/.exec(argv[i + 1] ?? '');
      if (!match || Number(match[1]) < 1 || Number(match[1]) > Number(match[2])) {
        throw new Error(`--shard expects k/n with 1 <= k <= n, got "${argv[i + 1] ?? ''}"`);
      }
      result.shard = { index: Number(match[1]) - 1, count: Number(match[2]) };
      i += 1;
      continue;
    }
    if (arg === '--jobs') {
      result.jobs = argv[i + 1] ?? 'auto';
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
    return args.suite.split(',').map((id) => id.trim()).filter(Boolean);
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
  const args = ['run', 'dev', '--', '--host', host, '--port', String(port), '--strictPort', '--no-open'];
  // With a shell (Windows, below) the command is one string: Node deprecates
  // separate args alongside `shell`. Every part here is fixed or a number.
  const child = spawn(process.platform === 'win32' ? `npm ${args.join(' ')}` : 'npm', process.platform === 'win32' ? [] : args, {
    cwd: repoRoot,
    // See `server.hmr` in vite.config.js: no reloads under a running test.
    env: { WEBMAPX_UI_TEST: '1', ...process.env },
    detached: true,
    // Windows has no `npm` executable, only npm.cmd, and Node refuses to
    // spawn a .cmd without a shell.
    shell: process.platform === 'win32',
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
    // Windows has no process groups to signal, and with a shell in between the
    // child is cmd.exe: killing only it would leave the dev server running.
    // taskkill /T takes the whole tree.
    if (process.platform === 'win32') {
      if (proc.pid) spawnSync('taskkill', ['/pid', String(proc.pid), '/T', '/F'], { stdio: 'ignore' });
      return;
    }
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

    // Collect every suite × engine run first, then work through them with
    // `--jobs` runs in flight at once. Each run has its own browser context, so
    // they share nothing but the dev server and the browser process.
    const timings = await readTimings();
    const tasks = [];
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

      for (const engine of engines) tasks.push({ suiteId, suite, engine });
    }

    // Dealt back and forth (1..n, n..1, 1..n…) over the alphabetical
    // suite × engine list. Plain round-robin would line four engines up with
    // four shards and hand one shard every Cesium run, the slow ones.
    if (args.shard) {
      const { index, count } = args.shard;
      const shardOf = (position) => {
        const lap = Math.floor(position / count);
        const offset = position % count;
        return lap % 2 === 0 ? offset : count - 1 - offset;
      };
      const mine = tasks.filter((_, position) => shardOf(position) === index);
      tasks.length = 0;
      tasks.push(...mine);
    }

    const runTask = async ({ suiteId, suite, engine }) => {
        const context = await browser.newContext({
          extraHTTPHeaders: { 'Referer': 'https://webmapx.com' },
        });
        const page = await context.newPage();

        // What happened to the page, printed only when the suite fails. A
        // Cesium run failed intermittently with "Execution context was
        // destroyed, most likely because of a navigation" in the middle of a
        // suite, where no step navigates; this is what tells a reload (and
        // what caused it: Vite logs to the console before reloading) from a
        // crash from a navigation elsewhere.
        const startedAt = Date.now();
        const elapsed = () => `${((Date.now() - startedAt) / 1000).toFixed(1)}s`;
        const pageEvents = [];
        const note = (text) => pageEvents.push(`${((Date.now() - startedAt) / 1000).toFixed(1)}s ${text}`);
        page.on('framenavigated', (frame) => { if (frame === page.mainFrame()) note(`navigated ${frame.url()}`); });
        page.on('crash', () => note('page crashed'));
        page.on('close', () => note('page closed'));
        page.on('console', (message) => { if (/\[vite\]/.test(message.text())) note(`console ${message.text()}`); });
        page.on('pageerror', (error) => note(`pageerror ${error.message.split('\n')[0]}`));

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

          timings[`${suiteId}:${engine}`] = Date.now() - startedAt;
          process.stdout.write(`PASS ${suiteId} (${engine}) ${elapsed()}\n`);
        } catch (error) {
          failures += 1;
          process.stderr.write(`FAIL ${suiteId} (${engine}) ${elapsed()}: ${error instanceof Error ? error.message : String(error)}\n`);
          process.stderr.write(`  page events:\n${pageEvents.map((line) => `    ${line}`).join('\n')}\n`);
        } finally {
          await context.close();
        }
    };

    // Longest first; a run never timed before counts as long, since nothing
    // says it is short.
    const expected = ({ suiteId, engine }) => timings[`${suiteId}:${engine}`] ?? Infinity;
    const queue = [...tasks].sort((a, b) => expected(b) - expected(a));

    // Cesium draws on the CPU here (SwiftShader), and four Cesium runs at once
    // starve each other: with only Cesium suites queued, three random suites
    // failed per run (timeouts, a 5 s arrow-key move) and each passed on its own.
    // A worker that would start a third Cesium run takes the next other engine
    // instead, and waits only when nothing else is left.
    let cesiumInFlight = 0;
    const waitingForCesiumSlot = [];
    const takeNext = () => {
      const index = queue.findIndex((task) => task.engine !== 'cesium' || cesiumInFlight < MAX_CESIUM_IN_FLIGHT);
      return index === -1 ? null : queue.splice(index, 1)[0];
    };
    const worker = async () => {
      while (queue.length > 0) {
        const task = takeNext();
        if (!task) {
          await new Promise((resolve) => waitingForCesiumSlot.push(resolve));
          continue;
        }
        if (task.engine !== 'cesium') {
          await runTask(task);
          continue;
        }
        cesiumInFlight++;
        try {
          await runTask(task);
        } finally {
          cesiumInFlight--;
          waitingForCesiumSlot.splice(0).forEach((resolve) => resolve());
        }
      }
    };
    const { jobs, reason } = resolveJobs(args.jobs);
    process.stdout.write(`[ui-test] ${tasks.length} runs, ${jobs} at a time (${reason})\n`);
    const runStartedAt = Date.now();
    await Promise.all(Array.from({ length: Math.min(jobs, tasks.length) }, worker));
    await writeTimings(timings);
    process.stdout.write(`[ui-test] ${tasks.length} runs, ${failures} failed, ${((Date.now() - runStartedAt) / 1000).toFixed(0)}s with ${jobs} at a time\n`);
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
