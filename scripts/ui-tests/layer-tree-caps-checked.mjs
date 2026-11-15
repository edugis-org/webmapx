// A catalog switch follows its layer even when the layer came from a WMS
// GetCapabilities category.
//
// Those layers are fetched when the category opens and kept in the tree's
// `capsCache`, not in the tree itself, so the tree's layer-add/layer-remove
// handling never reached them: a layer removed from the legend left its
// catalog switch on (found with the Blaeu maps in casgiscache.json). Checked
// here:
//
// - switching a fetched layer on in the catalog, then removing it in the
//   legend, turns its switch off;
// - a fetched layer added some other way while its category is open shows
//   as on.

export const engines = ['maplibre', 'openlayers'];

const FIXTURE = '/tests/fixtures/layer-tree-caps.json';
const WMS_HOST = 'wms.example.test';

const CAPABILITIES = `<?xml version="1.0" encoding="UTF-8"?>
<WMT_MS_Capabilities version="1.1.1">
  <Service><Name>OGC:WMS</Name><Title>Fixture WMS</Title></Service>
  <Capability>
    <Request>
      <GetCapabilities><Format>application/vnd.ogc.wms_xml</Format>
        <DCPType><HTTP><Get><OnlineResource xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="https://${WMS_HOST}/wms?map=historic&amp;"/></Get></HTTP></DCPType>
      </GetCapabilities>
      <GetMap><Format>image/png</Format>
        <DCPType><HTTP><Get><OnlineResource xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="https://${WMS_HOST}/wms?map=historic&amp;"/></Get></HTTP></DCPType>
      </GetMap>
    </Request>
    <Exception><Format>application/vnd.ogc.se_xml</Format></Exception>
    <Layer>
      <Title>Historic</Title>
      <SRS>EPSG:3857</SRS>
      <SRS>EPSG:4326</SRS>
      <LatLonBoundingBox minx="3" miny="50" maxx="8" maxy="54"/>
      <Layer queryable="0"><Name>map_1650</Name><Title>Map 1650</Title>
        <LatLonBoundingBox minx="3" miny="50" maxx="8" maxy="54"/></Layer>
      <Layer queryable="0"><Name>map_1700</Name><Title>Map 1700</Title>
        <LatLonBoundingBox minx="3" miny="50" maxx="8" maxy="54"/></Layer>
    </Layer>
  </Capability>
</WMT_MS_Capabilities>`;

// 1x1 transparent PNG.
const PIXEL = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64');

const HELPERS = `
window.__caps = {
  async waitFor(fn, ms, label) {
    const started = Date.now();
    while (Date.now() - started < ms) {
      const value = await fn();
      if (value) return value;
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
    throw new Error('Timed out waiting for ' + label);
  },
  find(root, tag) {
    for (const el of root.querySelectorAll('*')) {
      if (el.tagName === tag) return el;
      if (el.shadowRoot) { const found = this.find(el.shadowRoot, tag); if (found) return found; }
    }
    return null;
  },
  tree() { return this.find(document, 'WEBMAPX-LAYER-TREE'); },
  legend() { return this.find(document, 'WEBMAPX-LAYER-OVERVIEW'); },
  switchFor(layerId) { return this.tree()?.shadowRoot.querySelector('sl-switch[data-layer-id="' + layerId + '"]') ?? null; },
  adapter() { return document.querySelector('webmapx-map').getAdapterAsync(); },
};
`;

async function open(page, baseUrl) {
  const url = new URL(baseUrl);
  url.searchParams.set('config', FIXTURE);
  await page.goto(url.toString(), { waitUntil: 'domcontentloaded' });
  await page.evaluate(HELPERS);
  await page.evaluate(() => window.__caps.waitFor(() => window.__caps.tree(), 15000, 'layer tree'));
  await page.evaluate(() => window.__caps.adapter());
}

/** Opens the catalog and the fixture category; resolves once its layers are listed. */
async function openCategory(page) {
  await page.getByRole('button', { name: /catalog/i }).first().click();
  await page.evaluate(async () => {
    const caps = window.__caps;
    const items = () => [...caps.tree().shadowRoot.querySelectorAll('sl-tree-item')];
    // A tree item's own text, without that of the items nested in it.
    const ownText = (i) => [...i.childNodes].filter((n) => n.nodeName !== 'SL-TREE-ITEM').map((n) => n.textContent).join(' ').trim();
    // A group holding just the capabilities node is shown as that node, so
    // there is one level to open.
    const item = await caps.waitFor(
      () => items().find((i) => !i.expanded && ownText(i).includes('Historic maps')),
      10000,
      'category Historic maps',
    );
    item.expanded = true;
    item.dispatchEvent(new CustomEvent('sl-expand', { bubbles: true, composed: true }));
    await caps.waitFor(() => caps.switchFor('map_1650') && caps.switchFor('map_1700'), 10000, 'fetched layers');
  });
}

async function checkLegendRemoval(page) {
  return page.evaluate(async () => {
    const caps = window.__caps;
    const problems = [];
    const adapter = await caps.adapter();
    const sw = caps.switchFor('map_1650');
    sw.click();
    await caps.waitFor(() => adapter.hasLayer('map_1650'), 10000, 'map_1650 on the map');
    if (!caps.switchFor('map_1650').checked) problems.push('switch is not on after switching the layer on');

    const del = await caps.waitFor(
      () => caps.legend()?.shadowRoot.querySelector('.layer-card[data-layer-id="map_1650"] .delete-layer'),
      10000,
      'legend row for map_1650',
    );
    del.click();
    await caps.waitFor(() => !adapter.hasLayer('map_1650'), 10000, 'map_1650 removed');
    try {
      await caps.waitFor(() => !caps.switchFor('map_1650').checked, 3000, 'switch off');
    } catch {
      problems.push('switch stayed on after the layer was removed in the legend');
    }
    return problems;
  });
}

async function checkAddedElsewhere(page) {
  return page.evaluate(async () => {
    const caps = window.__caps;
    const adapter = await caps.adapter();
    const sw = caps.switchFor('map_1700');
    if (sw.checked) return ['map_1700 switch was on before anything added it'];
    // Re-add through the map host with the spec the catalog itself built, as
    // a permalink or another tool would — not through the switch.
    const mapEl = document.querySelector('webmapx-map');
    const spec = caps.tree().capsCache
      ? [...caps.tree().capsCache.values()].flatMap((e) => e.children ?? []).find((c) => c.layerId === 'map_1700')?.layerSpec
      : undefined;
    if (!spec) return ['could not read the fetched layer spec for map_1700'];
    await mapEl.addLayerRequest(spec);
    await caps.waitFor(() => adapter.hasLayer('map_1700'), 10000, 'map_1700 on the map');
    try {
      await caps.waitFor(() => caps.switchFor('map_1700').checked, 3000, 'switch on');
      return [];
    } catch {
      return ['switch stayed off after the layer was added outside the catalog'];
    }
  });
}

export async function run({ page, baseUrl }) {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.route(`**://${WMS_HOST}/**`, (route) => {
    const url = new URL(route.request().url());
    const request = (url.searchParams.get('REQUEST') ?? url.searchParams.get('request') ?? '').toLowerCase();
    if (request === 'getcapabilities') {
      return route.fulfill({ status: 200, contentType: 'application/vnd.ogc.wms_xml', body: CAPABILITIES });
    }
    return route.fulfill({ status: 200, contentType: 'image/png', body: PIXEL });
  });

  await open(page, baseUrl);
  await openCategory(page);
  const problems = [...await checkLegendRemoval(page), ...await checkAddedElsewhere(page)];
  if (errors.length) problems.push(...errors.map((e) => 'page error: ' + e));
  if (problems.length) throw new Error(problems.join('\n'));
}
