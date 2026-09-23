// A plugin named in a config registers a toolbar tool before the config is
// validated and the layout built, so the tool gets a button, opens a panel and
// reads its own config section — the same as a built-in tool.
//
// Driven by tests/fixtures/plugin-demo.json and the example plugin at
// public/plugins/bookmarks.js.

const PLUGIN_CONFIG = '/tests/fixtures/plugin-demo.json';

function fail(message) {
  throw new Error(message);
}

export async function run({ page, baseUrl }) {
  const warnings = [];
  page.on('console', (msg) => {
    if (msg.type() === 'warning' || msg.type() === 'error') warnings.push(msg.text());
  });

  const url = new URL(baseUrl);
  url.searchParams.set('config', PLUGIN_CONFIG);
  await page.goto(url.toString(), { waitUntil: 'domcontentloaded' });

  await page.waitForFunction(async () => {
    const map = document.querySelector('webmapx-map');
    return Boolean(await map?.getAdapterAsync?.());
  }, undefined, { timeout: 45_000 });

  await page.waitForFunction(() => Boolean(document.querySelector('webmapx-bookmarks-tool')), undefined, { timeout: 15_000 });

  const unknown = warnings.filter((w) => w.includes('bookmarks') && /unknown|skipped/i.test(w));
  if (unknown.length) fail(`plugin tool reported as unknown: ${unknown.join(' | ')}`);

  // The toolbar button carries the label and icon the plugin registered.
  const buttonIcon = await page.evaluate(() => {
    const deep = (root, selector) => {
      const hit = root.querySelector(selector);
      if (hit) return hit;
      for (const el of root.querySelectorAll('*')) {
        if (el.shadowRoot) {
          const inner = deep(el.shadowRoot, selector);
          if (inner) return inner;
        }
      }
      return null;
    };
    const button = deep(document, 'sl-button[data-tooltip="Bookmarks"]');
    return button ? button.querySelector('sl-icon')?.getAttribute('name') ?? '' : null;
  });
  if (buttonIcon === null) fail('no toolbar button labelled with the plugin tool\'s registered label');
  if (buttonIcon !== 'bookmark-star') fail(`toolbar button icon is "${buttonIcon}", expected the registered "bookmark-star"`);

  // Activating the tool shows the view from the config section, and clicking it moves the map.
  // Through the toolbar button, not toolManager: an item naming only its type
  // used to register as "undefined", which only the button path shows.
  await page.evaluate(() => {
    const deep = (root) => root.querySelector('sl-button[data-tooltip="Bookmarks"]')
      ?? [...root.querySelectorAll('*')].map((el) => el.shadowRoot && deep(el.shadowRoot)).find(Boolean);
    deep(document).click();
  });
  await page.waitForFunction(() => {
    const tool = document.querySelector('webmapx-bookmarks-tool');
    return tool?.active && tool.shadowRoot?.querySelector('button.go');
  }, undefined, { timeout: 10_000 });

  // The fixed views are exactly the config's "views"; the plugin has no built-in ones.
  const rowsFor = (views) => page.evaluate(async (views) => {
    const tool = document.querySelector('webmapx-bookmarks-tool');
    const section = tool.toolsConfig.bookmarks;
    if (views === undefined) delete section.views; else section.views = views;
    tool.requestUpdate();
    await tool.updateComplete;
    return [...tool.shadowRoot.querySelectorAll('button.go')].map((b) => b.textContent.replace(/z\d+\s*$/, '').trim());
  }, views);
  const configured = await rowsFor([{ label: 'Amsterdam', center: [4.9, 52.37], zoom: 12 }]);
  if (configured.join() !== 'Amsterdam') fail(`fixed views should be the config's views, got ${configured.join()}`);
  const absent = await rowsFor(undefined);
  if (absent.length !== 0) fail(`no "views" should mean no fixed views, got ${absent.join()}`);
  await rowsFor([{ label: 'Amsterdam', center: [4.9, 52.37], zoom: 12 }]);

  await page.evaluate(() => {
    document.querySelector('webmapx-bookmarks-tool').shadowRoot.querySelector('button.go').click();
  });
  await page.waitForFunction(async () => {
    const adapter = await document.querySelector('webmapx-map').getAdapterAsync();
    const { mapCenter, zoomLevel } = adapter.store.getState();
    return mapCenter && Math.abs(mapCenter[0] - 4.9) < 0.05 && Math.abs(mapCenter[1] - 52.37) < 0.05 && Math.abs(zoomLevel - 12) < 0.1;
  }, undefined, { timeout: 15_000 });
}

export const engines = ['maplibre', 'openlayers', 'leaflet', 'cesium'];
