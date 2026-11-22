import { appUrl } from './lib/fixture-config.mjs';

/**
 * UI Test: a clicked search result stays highlighted.
 *
 * Hovering a result previews it and moving away clears that preview — but a
 * *clicked* result keeps its preview after the mouse leaves, until another
 * result is clicked (which then takes over) or the search is cleared.
 * Real mouse moves, since the behaviour lives in mouseenter/mouseleave.
 */

const PREVIEW = 'search-preview-line';

function fail(message) { throw new Error(message); }

async function step(name, fn) {
  try { await fn(); } catch (error) {
    throw new Error(`Step "${name}" failed: ${error.message}`, { cause: error });
  }
}

/** Preview source data as the first feature's display name, or null when no preview. */
async function previewName(page) {
  return page.evaluate(async () => {
    const map = document.querySelector('webmapx-map');
    const adapter = await map.getAdapterAsync();
    if (!adapter.hasLayer('search-preview-line')) return null;
    const data = await adapter.getSourceData?.('search-preview');
    const f = data?.features?.[0];
    // Name plus geometry: several results can share a name (Cesium gets five "Utrecht, Nederland").
    return f ? `${f.properties?.display_name ?? ''} ${JSON.stringify(f.geometry).slice(0, 80)}` : 'present';
  });
}

async function rowBox(page, index) {
  const handle = await page.evaluateHandle((i) => {
    const tool = document.querySelector('webmapx-map webmapx-search-tool');
    return tool.shadowRoot.querySelectorAll('.result-item .result-select')[i];
  }, index);
  const box = await handle.asElement().boundingBox();
  if (!box) fail(`result ${index} has no box`);
  return box;
}

async function hover(page, index) {
  const b = await rowBox(page, index);
  await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2, { steps: 3 });
}

async function moveToMap(page) {
  const vp = page.viewportSize();
  await page.mouse.move(vp.width - 40, vp.height - 60, { steps: 3 });
}

async function settle(page) { await page.waitForTimeout(400); }

export async function run({ page, engine, baseUrl }) {
  console.log(`  Running search-click-keep test for engine: ${engine}`);
  await page.goto(appUrl(baseUrl), { waitUntil: 'domcontentloaded' });

  await step('open search and search Utrecht', async () => {
    await page.waitForFunction(async () => {
      const map = document.querySelector('webmapx-map');
      return Boolean(map?.getAdapterAsync && await map.getAdapterAsync())
        && Boolean(document.querySelector('webmapx-toolbar sl-button[name="search"]'))
        && customElements.get('webmapx-search-tool') !== undefined;
    }, undefined, { timeout: 45_000 });
    // The toolbar can be drawn before the tool behind it is wired up; a click then does
    // nothing, so click until the panel opens.
    for (let attempt = 0; ; attempt++) {
      await page.evaluate(() => document.querySelector('webmapx-toolbar sl-button[name="search"]').click());
      const opened = await page.waitForFunction(() => document.querySelector('webmapx-map webmapx-search-tool')?.active,
        undefined, { timeout: 3_000 }).then(() => true, () => false);
      if (opened) break;
      if (attempt >= 4) fail('search panel did not open');
    }
    await page.evaluate(() => {
      const tool = document.querySelector('webmapx-map webmapx-search-tool');
      const input = tool.shadowRoot.querySelector('sl-input.search-field');
      input.value = 'Utrecht';
      input.dispatchEvent(new CustomEvent('sl-input', { bubbles: true, composed: true }));
      tool.shadowRoot.querySelector('sl-button.go-button').click();
    });
    await page.waitForFunction(() => document.querySelector('webmapx-map webmapx-search-tool')
      ?.shadowRoot?.querySelectorAll('.result-item').length >= 2, undefined, { timeout: 30_000 });
  });

  await step('hover then leave: preview cleared', async () => {
    await hover(page, 0); await settle(page);
    if (!(await previewName(page))) fail('hover showed no preview');
    await moveToMap(page); await settle(page);
    // Blur too, in case hover left focus anywhere.
    if (await previewName(page)) fail('preview stayed after leaving an unclicked result');
  });

  // A second result with a different name than the first, so the two can be told apart.
  let other = 1;
  await step('pick a second, different result', async () => {
    other = await page.evaluate(() => {
      const fs = document.querySelector('webmapx-map webmapx-search-tool').results.features;
      const n = (f) => `${f.properties?.display_name} ${JSON.stringify(f.geometry)}`;
      return fs.findIndex((f) => n(f) !== n(fs[0]));
    });
    if (other < 1) fail('all results are identical');
  });

  let first;
  await step('click result 0 and leave: preview kept', async () => {
    await hover(page, 0);
    await page.mouse.down(); await page.mouse.up();
    await settle(page);
    await moveToMap(page); await settle(page);
    first = await previewName(page);
    if (!first) fail('clicked result vanished after the mouse moved away');
    console.log(`    kept: ${first}`);
  });

  await step('hover result other then leave: back to result 0', async () => {
    await hover(page, other); await settle(page);
    const hovered = await previewName(page);
    await moveToMap(page); await settle(page);
    const after = await previewName(page);
    if (after !== first) fail(`expected ${first} after leaving result other, got ${after} (hovered ${hovered})`);
  });

  await step('click result other: it takes over', async () => {
    await hover(page, other);
    await page.mouse.down(); await page.mouse.up();
    await settle(page);
    await moveToMap(page); await settle(page);
    const now = await previewName(page);
    if (!now) fail('second clicked result not kept');
    if (now === first) fail(`clicking result other kept result 0 (${now})`);
    console.log(`    now: ${now}`);
  });

  await step('clear search: preview gone', async () => {
    await page.evaluate(() => {
      const tool = document.querySelector('webmapx-map webmapx-search-tool');
      tool.shadowRoot.querySelector('sl-input.search-field')?.shadowRoot?.querySelector('[part~="clear-button"]').click();
    });
    await settle(page);
    if (await previewName(page)) fail('preview survived clearing the search');
  });
}

export const engines = ['maplibre', 'openlayers', 'leaflet', 'cesium'];
