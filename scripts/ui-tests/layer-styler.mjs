/**
 * The hierarchy styler, driven the way a user drives it.
 *
 * The claims worth a browser are the ones a unit test cannot make: that a
 * change to one entry reaches the *engine*, that adding and reordering entries
 * rebuild a live layer without losing the rest of it, and — the invariant the
 * whole design rests on — that opening the panel and closing it again leaves
 * the layer byte-identical. So every assertion reads the adapter back, never
 * the panel's own state.
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdir } from 'node:fs/promises';
import { appUrl } from './lib/fixture-config.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCREENSHOT_DIR = path.resolve(__dirname, '../temp/screenshots');

const ORIGIN = [30, 40];
const LAYER_ID = 'styler-test';
const LINE_LAYER_ID = 'styler-line-test';

async function waitForMapReady(page) {
    await page.waitForFunction(async () => {
        const map = document.querySelector('webmapx-map');
        if (!map || typeof map.getAdapterAsync !== 'function') return false;
        return Boolean(await map.getAdapterAsync());
    }, undefined, { timeout: 45_000 });
}

async function screenshot(page, name) {
    await mkdir(SCREENSHOT_DIR, { recursive: true });
    const file = path.join(SCREENSHOT_DIR, `${name}.png`);
    await page.screenshot({ path: file, fullPage: false });
    return file;
}

/** A composite layer: a fill and its own outline over one source, like world-countries. */
async function addCompositeLayer(page) {
    await page.evaluate(async ([lon, lat, layerId]) => {
        const size = 0.5;
        const features = Array.from({ length: 4 }, (_, i) => ({
            type: 'Feature',
            id: `cell-${i}`,
            properties: { name: `cell ${i}`, pop: [1, 5, 400, 9000][i] },
            geometry: {
                type: 'Polygon',
                coordinates: [[
                    [lon + i * size, lat], [lon + (i + 1) * size, lat],
                    [lon + (i + 1) * size, lat + size], [lon + i * size, lat + size], [lon + i * size, lat],
                ]],
            },
        }));
        await document.querySelector('webmapx-map').addLayerRequest({
            id: layerId,
            type: 'style',
            version: 8,
            sources: {
                [`${layerId}-src`]: {
                    id: `${layerId}-src`,
                    type: 'geojson',
                    data: { type: 'FeatureCollection', features },
                },
            },
            layers: [
                { id: `${layerId}-fill`, type: 'fill', source: `${layerId}-src`, paint: { 'fill-color': '#4a90d9', 'fill-opacity': 0.4 } },
                // Named the way a dropped file names its sublayers: the layer's
                // own id repeated in full, then the role.
                { id: `${layerId}:NUTS_RG_01M_2024_4326_LEVL_3_uk_stats-line`, type: 'line', source: `${layerId}-src`, paint: { 'line-color': '#2c6fad', 'line-width': 2 } },
            ],
            metadata: { label: 'Styler test', dynamic: true },
        });
    }, [...ORIGIN, LAYER_ID]);

    await page.waitForFunction((layerId) => document.querySelector('webmapx-map')
        ?.getAdapterAsync?.().then?.((adapter) => Boolean(adapter?.store?.getState?.().mapLayers?.[layerId])),
    LAYER_ID, { timeout: 15_000 });
}

/** A plain line layer — the one geometry a dash pattern is offered on. */
async function addLineLayer(page) {
    await page.evaluate(async ([lon, lat, layerId]) => {
        await document.querySelector('webmapx-map').addLayerRequest({
            id: layerId,
            type: 'style',
            version: 8,
            sources: {
                [`${layerId}-src`]: {
                    id: `${layerId}-src`,
                    type: 'geojson',
                    data: {
                        type: 'FeatureCollection',
                        features: [{
                            type: 'Feature',
                            properties: { name: 'track' },
                            geometry: { type: 'LineString', coordinates: [[lon, lat], [lon + 1, lat + 0.5], [lon + 2, lat]] },
                        }],
                    },
                },
            },
            layers: [{ id: `${layerId}-line`, type: 'line', source: `${layerId}-src`, paint: { 'line-color': '#d1001c', 'line-width': 3 } }],
            metadata: { label: 'Line test', dynamic: true },
        });
    }, [...ORIGIN, LINE_LAYER_ID]);

    await page.waitForFunction((layerId) => document.querySelector('webmapx-map')
        ?.getAdapterAsync?.().then?.((adapter) => Boolean(adapter?.store?.getState?.().mapLayers?.[layerId])),
    LINE_LAYER_ID, { timeout: 15_000 });
}

/** Opens the styler with the context the legend builds for it. */
async function openStyler(page, options = {}) {
    await page.evaluate(async ([layerId, geometry]) => {
        const map = document.querySelector('webmapx-map');
        const adapter = await map.getAdapterAsync();
        await import('/src/components/webmapx-layer-styler.ts');
        const panel = document.createElement('webmapx-layer-styler');
        document.body.appendChild(panel);

        const sourceId = `${layerId}:${layerId}-src`;
        const source = adapter.getSourceData(sourceId) ?? adapter.getSourceData(`${layerId}-src`);
        const features = source?.features ?? [];
        // Every attribute the panel is handed must carry uniqueCount: that is what
        // tells it a column is a name or a code rather than something to group by.
        // Deriving it here keeps the fixture honest with buildSourceAttributes,
        // which counts distinct values for real.
        const present = (v) => v !== undefined && v !== null && v !== '';
        const attr = (name, type, read) => {
            const values = features.map(read);
            return {
                name,
                type,
                values,
                presentCount: values.filter(present).length,
                missingCount: values.filter((v) => !present(v)).length,
                uniqueCount: new Set(values.filter(present)).size,
            };
        };
        panel.open({
            title: 'Styler test',
            layerId,
            engine: adapter.engineId,
            groups: [{
                sourceId,
                featureCountLabel: `${features.length} areas`,
                featureCount: features.length,
                geometryTypes: [geometry],
                attributes: [
                    attr('name', 'string', (f) => f.properties.name),
                    attr('pop', 'number', (f) => f.properties.pop),
                ],
                featureRows: features.map((f) => f.properties),
                layers: [],
                features,
                completeData: true,
                sourceConfig: { type: 'geojson' },
            }],
            apply: (subLayerId, paint) => adapter.updateLayerStyle(layerId, subLayerId || layerId, paint),
            layers: {
                add: (config) => adapter.addLayer(config),
                remove: (id) => { if (adapter.hasLayer?.(id)) adapter.removeLayer(id); },
                setExtraSubLayer: (id, sublayer) => adapter.setExtraSubLayer(id, sublayer),
                setSubLayers: (id, sublayers) => adapter.setSubLayers(id, sublayers),
                getSubLayers: (id) => adapter.getSubLayers(id),
                setSubLayerMetadata: (id, subLayerId, metadata) => adapter.setSubLayerMetadata(id, subLayerId, metadata),
            },
            // The panel re-reads a viewport-limited source when the map opens
            // up; the test drives that listener directly, since a real camera
            // move would be four different cameras across four engines.
            watchView: (listener) => { window.__viewListener = listener; return () => { window.__viewListener = null; }; },
            sourceControl: {
                setTiles: () => false,
                setLayerOpacity: (opacity) => adapter.setLayerOpacity(layerId, opacity),
            },
            writeFeatures: (id, features) => adapter.setSourceData(id, { type: 'FeatureCollection', features }),
        });
        window.__styler = panel;
    }, [options.layerId ?? LAYER_ID, options.geometry ?? 'Polygon']);

    await page.waitForFunction(() => Boolean(window.__styler?.shadowRoot?.querySelector('.panel')), undefined, { timeout: 10_000 });
}

/** The sublayers the map is drawing, as the store holds them. */
async function liveSubLayers(page, layerId = LAYER_ID) {
    return page.evaluate(async (layerId) => {
        const adapter = await document.querySelector('webmapx-map').getAdapterAsync();
        const entry = adapter.store.getState().mapLayers[layerId];
        return (entry?.sublayers ?? []).map((sub) => ({
            id: sub.id, type: sub.type, paint: sub.paint ?? null, layout: sub.layout ?? null,
            metadata: sub.metadata ?? null,
        }));
    }, layerId);
}

/** The summary lines of the style list, in draw order. */
async function summaries(page) {
    return page.evaluate(() => [...window.__styler.shadowRoot.querySelectorAll('.entry-summary')]
        .map((button) => (button.querySelector('.entry-detail') ?? button).textContent.trim().replace(/\s+/g, ' ')));
}

/** Opens the entry whose summary starts with this text. */
async function expandNamed(page, label) {
    const ok = await page.evaluate((text) => {
        const rows = [...window.__styler.shadowRoot.querySelectorAll('.entry-summary')];
        const row = rows.find((candidate) => (candidate.querySelector('.entry-detail') ?? candidate).textContent.trim().startsWith(text));
        if (!row) return false;
        if (row.getAttribute('aria-expanded') !== 'true') row.click();
        return true;
    }, label);
    if (!ok) throw new Error(`no entry named ${label}`);
    await page.waitForTimeout(150);
}

async function expandEntry(page, index) {
    await page.evaluate((at) => {
        window.__styler.shadowRoot.querySelectorAll('.entry-summary')[at].click();
    }, index);
    await page.waitForTimeout(120);
}

function fail(message) {
    throw new Error(message);
}

export async function run({ page, engine, baseUrl }) {
    console.log(`  Running layer styler test for engine: ${engine}`);

    const step = async (label, fn) => {
        try {
            return await fn();
        } catch (error) {
            await screenshot(page, `layer-styler-${engine}-failed`);
            throw new Error(`${label}: ${error instanceof Error ? error.message : String(error)}`, { cause: error });
        }
    };

    await step('load page', async () => {
        await page.goto(appUrl(baseUrl), { waitUntil: 'domcontentloaded' });
        await waitForMapReady(page);
    });

    await step('every sublayer of a catalog layer is actually on the map', async () => {
        // Carried over from the step dialog's test, because it is about the map
        // rather than about a panel. world-countries is a style layer with a
        // fill and a line over one source. Its fill used to be refused at
        // startup — the executor flushed the queued sublayer adds before its
        // source was registered — so the layer came up as outlines only and
        // styling the areas silently did nothing. A sublayer that is not on the
        // map cannot be repainted, which is the engine-agnostic way to see it.
        const refused = await page.evaluate(async () => {
            const map = document.querySelector('webmapx-map');
            const adapter = await map.getAdapterAsync();
            await map.addLayerRequest({ layerId: 'world-countries' });
            await new Promise((resolve) => setTimeout(resolve, 3000));
            const sublayers = adapter.store.getState().mapLayers['world-countries']?.sublayers ?? [];
            return sublayers
                .filter((sub) => !adapter.updateLayerStyle('world-countries', sub.id, { ...(sub.paint ?? {}) }))
                .map((sub) => sub.id);
        });
        if (refused.length > 0) fail(`these sublayers are in the legend but not on the map: ${refused.join(', ')}`);
    });

    await step('add a composite test layer', () => addCompositeLayer(page));

    const before = await step('record the layer as authored', () => liveSubLayers(page));

    await step('the panel opens on what the layer already is', async () => {
        await openStyler(page);
        const lines = await summaries(page);
        // The list is the layer: a fill and its own outline, in draw order, each
        // naming the colour it is actually drawn with.
        if (lines.length !== 2) fail(`expected two styles, got ${JSON.stringify(lines)}`);
        // Topmost first, like the legend: the outline is drawn over the fill.
        // A line over polygons is that polygon's outline, which the sublayer
        // type alone cannot say.
        if (!lines[0].startsWith('Outline')) fail(`a line over areas should read as an outline, listed first: ${lines[0]}`);
        if (!lines[1].includes('#4a90d9')) fail(`the fill does not open on its own colour: ${lines[1]}`);
    });

    await step('nothing is expanded until the user expands it', async () => {
        const open = await page.evaluate(() => window.__styler.shadowRoot.querySelectorAll('.entry-body').length);
        if (open !== 0) fail(`${open} entries were open before anything was clicked`);
    });

    await step('closing without touching anything leaves the layer identical', async () => {
        await page.evaluate(() => window.__styler.close());
        const after = await liveSubLayers(page);
        if (JSON.stringify(after) !== JSON.stringify(before)) {
            fail(`the layer changed by being looked at:\n  before ${JSON.stringify(before)}\n  after  ${JSON.stringify(after)}`);
        }
        await openStyler(page);
    });

    await step('a width change reaches the engine', async () => {
        await expandEntry(page, 0);
        await page.evaluate(() => {
            const root = window.__styler.shadowRoot;
            const slider = [...root.querySelectorAll('.entry-body input[type="range"]')]
                .find((input) => input.getAttribute('aria-label') === 'Width');
            if (!slider) throw new Error('no width slider on the outline entry');
            slider.value = '6';
            slider.dispatchEvent(new Event('input', { bubbles: true }));
        });
        await page.waitForTimeout(250);
        const live = await liveSubLayers(page);
        const outline = live.find((sub) => sub.type === 'line');
        if (outline?.paint?.['line-width'] !== 6) {
            fail(`the engine still draws ${JSON.stringify(outline?.paint)}`);
        }
        // The change is one paint key, not a rewritten sublayer.
        if (outline?.paint?.['line-color'] !== '#2c6fad') {
            fail(`the outline lost its colour: ${JSON.stringify(outline?.paint)}`);
        }
    });

    await step('a channel the layer says nothing about opens on the GL default', async () => {
        // The outline carries no `line-opacity`, and MapLibre draws it at 1. A
        // control resting at its slider minimum would report the style as
        // invisible and send the user to fix a problem that does not exist.
        const shown = await page.evaluate(() => {
            const rows = [...window.__styler.shadowRoot.querySelectorAll('.entry-body .row')];
            const row = rows.find((candidate) => candidate.querySelector('.name')?.textContent.trim() === 'Opacity');
            return row?.querySelector('.value')?.textContent.trim() ?? null;
        });
        if (shown !== '100%') fail(`opacity opened on ${shown}, not the default it is drawn with`);
    });

    await step('adding a style adds a sublayer and leaves the others alone', async () => {
        await page.evaluate(() => {
            const select = window.__styler.shadowRoot.querySelector('select[aria-label="Add a style"]');
            if (!select) throw new Error('no add-style control');
            select.value = 'label';
            select.dispatchEvent(new Event('change', { bubbles: true }));
        });
        await page.waitForTimeout(600);
        const live = await liveSubLayers(page);
        if (live.length !== 3) fail(`expected three sublayers, got ${JSON.stringify(live.map((s) => s.id))}`);
        if (!live.some((sub) => sub.type === 'symbol')) fail(`no label sublayer: ${JSON.stringify(live.map((s) => s.type))}`);
        const fill = live.find((sub) => sub.type === 'fill');
        if (fill?.paint?.['fill-color'] !== '#4a90d9') {
            fail(`adding a style rewrote the fill: ${JSON.stringify(fill?.paint)}`);
        }
    });

    await step('a label’s More tier reaches the engine, where the engine reads it', async () => {
        await expandNamed(page, 'Labels');
        const hasToggle = await page.evaluate(() => Boolean(
            window.__styler.shadowRoot.querySelector('.entry-body .more-toggle')));
        // Leaflet and Cesium draw a label in one plain font on its point and
        // read none of these keys: an affordance there would change nothing.
        if (engine === 'leaflet' || engine === 'cesium') {
            if (hasToggle) fail(`${engine} reads no label layout keys, yet offers the More tier`);
            return;
        }
        if (!hasToggle) fail('no ⋯ on the label entry');
        await page.evaluate(() => window.__styler.shadowRoot.querySelector('.entry-body .more-toggle').click());
        await page.waitForTimeout(120);
        await page.evaluate(() => {
            const select = window.__styler.shadowRoot.querySelector('select[aria-label="Where the label sits"]');
            if (!select) throw new Error('no placement control for labels on areas');
            select.value = 'line';
            select.dispatchEvent(new Event('change', { bubbles: true }));
        });
        await page.waitForTimeout(600);
        const live = await liveSubLayers(page);
        const symbol = live.find((sub) => sub.type === 'symbol');
        if (symbol?.layout?.['symbol-placement'] !== 'line') {
            fail(`placement did not reach the layer: ${JSON.stringify(symbol?.layout)}`);
        }
        // A rebuild re-renders the list; the tier must still be open, and the
        // collapsed-row marker must say something non-default is inside.
        const state = await page.evaluate(() => {
            const toggle = window.__styler.shadowRoot.querySelector('.entry-body .more-toggle');
            return { open: toggle?.getAttribute('aria-expanded'), marked: toggle?.classList.contains('overridden') };
        });
        if (state.open !== 'true') fail('the More tier closed itself after a change');
        if (!state.marked) fail('a non-default placement is not marked on the ⋯');
    });

    await step('a polygon outline is offered no dash pattern', async () => {
        // A border shared by two areas is in the data twice and stroked twice,
        // so the two dash phases interleave and the border reads as noise. The
        // control is on `line`, where a feature is drawn once.
        await expandNamed(page, 'Outline');
        const patterns = await page.evaluate(() => [...window.__styler.shadowRoot.querySelectorAll('.entry-body select')]
            .filter((candidate) => candidate.getAttribute('aria-label') === 'Line pattern').length);
        if (patterns !== 0) fail('a polygon outline still offers a dash pattern');
    });

    await step('rounding the corners writes both the join and the cap', async () => {
        await page.evaluate(() => {
            const select = [...window.__styler.shadowRoot.querySelectorAll('.entry-body select')]
                .find((candidate) => candidate.getAttribute('aria-label') === 'Corners and ends');
            select.value = 'round';
            select.dispatchEvent(new Event('change', { bubbles: true }));
        });
        await page.waitForTimeout(700);
        const line = (await liveSubLayers(page)).find((sub) => sub.type === 'line');
        // A rounded corner with a square end is not a choice anybody makes, so
        // one control writes both keys.
        if (line?.layout?.['line-join'] !== 'round' || line?.layout?.['line-cap'] !== 'round') {
            fail(`corners did not reach the engine: ${JSON.stringify(line?.layout)}`);
        }
    });

    await step('the list reads top-first, like the legend', async () => {
        const lines = await summaries(page);
        const live = await liveSubLayers(page);
        // The last sublayer in draw order is the one drawn on top, and it is
        // the row at the top of the panel.
        const topmost = live[live.length - 1];
        const expected = topmost.type === 'line' ? 'Outline' : topmost.type === 'symbol' ? 'Labels' : 'Fill';
        if (!lines[0].startsWith(expected)) {
            fail(`the panel lists ${lines[0]} first while the map draws ${topmost.type} on top`);
        }
    });

    await step('reordering changes the draw order and nothing else', async () => {
        const paintBefore = (await liveSubLayers(page)).map((sub) => JSON.stringify(sub.paint)).sort();
        await page.evaluate(() => {
            const buttons = [...window.__styler.shadowRoot.querySelectorAll('button[aria-label="Move up, so it draws on top"]')];
            buttons[buttons.length - 1].click();
        });
        await page.waitForTimeout(600);
        const live = await liveSubLayers(page);
        if (live[0].type !== 'line') fail(`the order did not change: ${JSON.stringify(live.map((s) => s.type))}`);
        if (live[1].type !== 'fill') fail(`the wrong entry moved: ${JSON.stringify(live.map((s) => s.type))}`);
        const paintAfter = live.map((sub) => JSON.stringify(sub.paint)).sort();
        if (JSON.stringify(paintAfter) !== JSON.stringify(paintBefore)) {
            fail(`reordering changed the paint:\n  before ${paintBefore}\n  after  ${paintAfter}`);
        }
    });

    await step('deleting a style removes exactly that sublayer', async () => {
        await page.evaluate(() => {
            const entries = [...window.__styler.shadowRoot.querySelectorAll('.entry')];
            const labels = entries.find((entry) => {
                const summary = entry.querySelector('.entry-summary');
                return (summary.querySelector('.entry-detail') ?? summary).textContent.trim().startsWith('Labels');
            });
            if (!labels) throw new Error('no labels entry to delete');
            labels.querySelector('button[aria-label="Delete this style"]').click();
        });
        await page.waitForTimeout(600);
        const live = await liveSubLayers(page);
        if (live.length !== 2) fail(`expected two sublayers after the delete, got ${JSON.stringify(live.map((s) => s.id))}`);
        if (live.some((sub) => sub.type === 'symbol')) fail('the deleted labels are still drawn');
    });

    await step('on a line layer, setting a dash back to solid actually clears it', async () => {
        await addLineLayer(page);
        await page.evaluate(() => window.__styler.close());
        await openStyler(page, { layerId: LINE_LAYER_ID, geometry: 'LineString' });
        await expandEntry(page, 0);

        const setPattern = async (value) => {
            await page.evaluate((choice) => {
                const select = [...window.__styler.shadowRoot.querySelectorAll('.entry-body select')]
                    .find((candidate) => candidate.getAttribute('aria-label') === 'Line pattern');
                if (!select) throw new Error('no pattern control on a line entry');
                select.value = choice;
                select.dispatchEvent(new Event('change', { bubbles: true }));
            }, value);
            await page.waitForTimeout(700);
        };

        await setPattern('Dashed');
        const dashed = (await liveSubLayers(page, LINE_LAYER_ID))[0];
        if (!Array.isArray(dashed?.paint?.['line-dasharray'])) fail(`the line never became dashed: ${JSON.stringify(dashed?.paint)}`);

        await setPattern('Solid');
        const solid = (await liveSubLayers(page, LINE_LAYER_ID))[0];
        // The paint object simply lacking the key is not enough: the engine
        // merges what it is given, so the removal has to be a rebuild.
        if (solid?.paint?.['line-dasharray']) fail(`still dashed after choosing Solid: ${JSON.stringify(solid?.paint)}`);
    });

    await step('classifying by a column paints an expression, not a colour', async () => {
        await page.evaluate(() => window.__styler.close());
        await openStyler(page);
        await expandNamed(page, 'Fill');

        await page.evaluate(() => {
            const select = [...window.__styler.shadowRoot.querySelectorAll('.entry-body select')]
                .find((candidate) => candidate.getAttribute('aria-label') === 'How colour is decided');
            if (!select) throw new Error('no driver control on the fill entry');
            select.value = 'attribute';
            select.dispatchEvent(new Event('change', { bubbles: true }));
        });
        await page.waitForTimeout(500);

        const fill = (await liveSubLayers(page)).find((sub) => sub.type === 'fill');
        const color = fill?.paint?.['fill-color'];
        // Choosing the driver classifies immediately: level 4 opens already
        // answered, so there is no state where the panel waits for input before
        // the map will draw.
        if (!Array.isArray(color)) fail(`the fill is still a flat colour: ${JSON.stringify(color)}`);
        const json = JSON.stringify(color);
        if (!json.includes('pop')) fail(`the classification names no column: ${json}`);
        if (!json.includes('step')) fail(`a numeric column should classify into ranges: ${json}`);
    });

    await step('the panel reopens on the classification it applied', async () => {
        await page.evaluate(() => window.__styler.close());
        await openStyler(page);
        const lines = await summaries(page);
        const fillRow = lines.find((line) => line.startsWith('Fill'));
        // The decoder has to read back what level 4 wrote, or every second visit
        // to a layer starts from defaults.
        if (!/by pop, \d+ classes/.test(fillRow ?? '')) fail(`reopened on ${fillRow}`);
    });

    await step('changing the class count re-classifies', async () => {
        await expandNamed(page, 'Fill');
        await page.evaluate(() => {
            const slider = [...window.__styler.shadowRoot.querySelectorAll('.level4 input[type="range"]')]
                .find((candidate) => candidate.getAttribute('aria-label') === 'Number of classes');
            if (!slider) throw new Error('no class-count control');
            slider.value = '3';
            slider.dispatchEvent(new Event('input', { bubbles: true }));
        });
        await page.waitForTimeout(500);
        const fill = (await liveSubLayers(page)).find((sub) => sub.type === 'fill');
        const lines = await summaries(page);
        if (!/by pop, 3 classes/.test(lines.find((line) => line.startsWith('Fill')) ?? '')) {
            fail(`the summary did not follow the class count: ${JSON.stringify(lines)}`);
        }
        // Three classes is two breaks: a `step` with one colour then break/colour
        // pairs, wrapped in the missing-value guard.
        const step = JSON.stringify(fill?.paint?.['fill-color']);
        if (!step.includes('step')) fail(`no step expression after re-classifying: ${step}`);
    });

    await step('the legend can read the classification the panel wrote', async () => {
        // Carried over from the step dialog's test. A classification guarded
        // against missing values puts its `step` inside a `case`, and a legend
        // reading only the outer `case` found two grey branches and one
        // "colour" that was a whole expression — a layer styled here reached
        // the legend with no classes at all. Driven through the legend's own
        // reader, since it is the rows that were missing.
        const fill = (await liveSubLayers(page)).find((sub) => sub.type === 'fill');
        const expression = fill?.paint?.['fill-color'];
        if (!Array.isArray(expression)) fail(`the fill is not classified: ${JSON.stringify(fill?.paint)}`);
        const rows = await page.evaluate(async (paint) => {
            await import('/src/components/webmapx-layer-legend.ts');
            const legend = document.createElement('webmapx-layer-legend');
            document.body.appendChild(legend);
            await legend.updateComplete;
            const classes = legend.extractColorClasses(paint, legend.getAttrTranslations());
            legend.remove();
            return (classes ?? []).map((entry) => entry.label);
        }, expression);
        if (rows.length < 3) fail(`the legend made ${rows.length} row(s) of a classification: ${JSON.stringify(rows)}`);
        if (!rows.some((row) => /–/.test(row))) fail(`the legend labels no class as a range: ${JSON.stringify(rows)}`);
        if (rows.filter((row) => row === '').length > 1) fail(`the legend repeats the no-data row: ${JSON.stringify(rows)}`);
    });

    await step('a style can be renamed, and the name is the one the legend reads', async () => {
        await expandNamed(page, 'Fill');
        // The field opens on the name the style already has, not an empty box.
        const opened = await page.evaluate(() => [...window.__styler.shadowRoot.querySelectorAll('.entry-body input[type="text"]')]
            .find((candidate) => candidate.getAttribute('aria-label') === 'What this style is called')?.value ?? null);
        if (!opened) fail('the name field opened empty rather than on the current name');

        const before = await liveSubLayers(page);
        await page.evaluate(() => {
            const field = [...window.__styler.shadowRoot.querySelectorAll('.entry-body input[type="text"]')]
                .find((candidate) => candidate.getAttribute('aria-label') === 'What this style is called');
            if (!field) throw new Error('no name field');
            field.value = 'People per km²';
            field.dispatchEvent(new Event('input', { bubbles: true }));
        });
        await page.waitForTimeout(150);
        // While still typing: the legend's store already has the name, and the
        // layer was not rebuilt for it (every sublayer keeps its paint object).
        const typing = await liveSubLayers(page);
        if (typing.find((sub) => sub.type === 'fill')?.metadata?.label !== 'People per km²') {
            fail(`the name did not reach the legend while typing: ${JSON.stringify(typing.map((sub) => sub.metadata))}`);
        }
        if (typing.length !== before.length) fail('typing a name rebuilt the layer');
        const header = await summaries(page);
        if (!header.length) fail('no style list after typing');

        await page.evaluate(() => {
            const field = [...window.__styler.shadowRoot.querySelectorAll('.entry-body input[type="text"]')]
                .find((candidate) => candidate.getAttribute('aria-label') === 'What this style is called');
            field.dispatchEvent(new Event('change', { bubbles: true }));
        });
        await page.waitForTimeout(700);

        const fill = (await liveSubLayers(page)).find((sub) => sub.type === 'fill');
        // `metadata.label` and not a field of the styler's own: it is what
        // `legendSublayerLabel` reads, so the legend and the panel cannot
        // disagree about what a style is called.
        if (fill?.metadata?.label !== 'People per km²') {
            fail(`the name did not reach the sublayer: ${JSON.stringify(fill?.metadata ?? null)}`);
        }
        const lines = await summaries(page);
        if (!lines.some((line) => line.includes('by pop'))) fail(`the fill row lost its summary: ${JSON.stringify(lines)}`);
    });

    await step('the no-data colour survives the next change to any other control', async () => {
        await expandNamed(page, 'Fill');
        await page.evaluate(() => {
            const root = window.__styler.shadowRoot;
            const rows = [...root.querySelectorAll('.level4 .row')];
            const row = rows.find((candidate) => candidate.querySelector('input[type="text"]'));
            if (!row) throw new Error('no no-data row');
            const field = row.querySelector('input[type="text"]');
            field.value = 'no data';
            field.dispatchEvent(new Event('change', { bubbles: true }));
        });
        await page.waitForTimeout(700);
        const withLabel = (await liveSubLayers(page)).find((sub) => sub.type === 'fill');
        if (withLabel?.metadata?.noDataLabel !== 'no data') {
            fail(`the legend wording did not reach the sublayer: ${JSON.stringify(withLabel?.metadata ?? null)}`);
        }

        // Every control on this panel rebuilds the channel from the settings, so
        // a colour kept only in the expression would be back to grey after this.
        await page.evaluate(() => {
            window.__styler.updateSettings(
                window.__styler.list.find((item) => item.entry.role === 'fill'),
                'color',
                { noDataColor: '#112233' },
            );
        });
        await page.waitForTimeout(500);
        await page.evaluate(() => {
            const slider = [...window.__styler.shadowRoot.querySelectorAll('.level4 input[type="range"]')]
                .find((candidate) => candidate.getAttribute('aria-label') === 'Number of classes');
            slider.value = '4';
            slider.dispatchEvent(new Event('input', { bubbles: true }));
        });
        await page.waitForTimeout(600);

        const fill = (await liveSubLayers(page)).find((sub) => sub.type === 'fill');
        const paint = JSON.stringify(fill?.paint?.['fill-color']);
        if (!paint.includes('#112233')) fail(`the chosen no-data colour was overwritten: ${paint}`);
    });

    await step('a width that grows with zoom can still be made thicker', async () => {
        // Authored styles write width, radius and text size as a zoom curve.
        // Read as `custom` it was read-only, so the only way to change it was to
        // replace the curve with one flat number and lose the zoom behaviour.
        await page.evaluate(async ([layerId]) => {
            const adapter = await document.querySelector('webmapx-map').getAdapterAsync();
            const subs = adapter.getSubLayers(layerId);
            const line = subs.find((sub) => sub.type === 'line');
            line.paint = { ...line.paint, 'line-width': ['interpolate', ['linear'], ['zoom'], 10, 2, 14, 6] };
            await adapter.setSubLayers(layerId, subs);
        }, [LAYER_ID]);
        await page.waitForTimeout(600);

        await page.evaluate(() => window.__styler.close());
        await openStyler(page);
        // The map's own zoom decides what the slider shows, so the test fixes it.
        await page.evaluate(() => { window.__styler.context.sourceControl.getView = () => ({ zoom: 12 }); });
        await expandNamed(page, 'Outline');

        const shown = await page.evaluate(async () => {
            const styler = window.__styler;
            styler.requestUpdate();
            await styler.updateComplete;
            const slider = [...styler.shadowRoot.querySelectorAll('.entry-body input[type="range"]')]
                .find((candidate) => (candidate.getAttribute('aria-label') ?? '').startsWith('Width'));
            if (!slider) return { error: 'no width slider' };
            const before = slider.value;
            slider.value = '8';
            slider.dispatchEvent(new Event('input', { bubbles: true }));
            await new Promise((resolve) => setTimeout(resolve, 600));
            return { before, label: slider.getAttribute('aria-label') };
        });
        // Halfway between the stops at z12, the authored width is 4.
        if (shown.before !== '4') fail(`the slider opened on ${JSON.stringify(shown)}`);

        const width = (await liveSubLayers(page)).find((sub) => sub.type === 'line')?.paint?.['line-width'];
        // Twice as thick here is twice as thick everywhere: the curve survives.
        if (JSON.stringify(width) !== JSON.stringify(['interpolate', ['linear'], ['zoom'], 10, 4, 14, 12])) {
            fail(`the curve did not scale: ${JSON.stringify(width)}`);
        }
    });

    await step('a column is offered by the name the configuration gives it', async () => {
        // The legend has always read `metadata.attributes.translations`; the
        // panel offered the raw column name, which on a layer with one column
        // called `mean` told the user nothing about what they were styling.
        await expandNamed(page, 'Fill');
        const shown = await page.evaluate(async () => {
            const styler = window.__styler;
            styler.context.attributeLabels = new Map([['pop', { label: 'Inwoners', unit: ' per km²' }]]);
            styler.requestUpdate();
            await styler.updateComplete;
            const select = [...styler.shadowRoot.querySelectorAll('.level4 select')]
                .find((candidate) => candidate.getAttribute('aria-label') === 'Attribute to classify by');
            const option = select ? [...select.options].find((o) => o.value === 'pop') : null;
            const summary = [...styler.shadowRoot.querySelectorAll('.entry-summary')]
                .map((row) => row.textContent.trim().replace(/\s+/g, ' '))
                .find((line) => line.includes('Fill'));
            return { option: option?.textContent?.trim() ?? null, summary: summary ?? null };
        });
        // Both halves in the chooser: the words, and the column they mean.
        if (shown.option !== 'Inwoners (pop)') fail(`the column reads as ${JSON.stringify(shown.option)}`);
        // And the words alone in the summary, where there is no room for both.
        if (!/by Inwoners/.test(shown.summary ?? '')) fail(`the summary reads as ${JSON.stringify(shown.summary)}`);
    });

    await step('a viewport-limited source is re-read when the map opens up', async () => {
        // The panel reads what the map has *drawn*, so one opened over a layer
        // that draws nothing here has nothing to offer and no button to press.
        // Driven through the context the panel was opened with, because that is
        // where the rule lives; the engines' own cameras differ too much to
        // assert a feature count against.
        const result = await page.evaluate(async () => {
            const styler = window.__styler;
            const groups = styler.groups.map((group) => ({ ...group, completeData: false }));
            styler.groups = groups;
            let reads = 0;
            const real = styler.context.resample;
            // First answer empty, as a tile that has not arrived does; then full.
            styler.context.resample = async () => {
                reads += 1;
                return reads === 1 ? groups.map((group) => ({ ...group, features: [], attributes: [] })) : real();
            };
            const listener = window.__viewListener;
            const before = styler.groups[0].features.length;
            listener({ west: 0, south: 40, east: 20, north: 60 });   // first move: panel has data, no read
            await new Promise((resolve) => setTimeout(resolve, 300));
            const afterFirst = reads;
            listener({ west: 4, south: 50, east: 6, north: 52 });     // narrower: no read
            await new Promise((resolve) => setTimeout(resolve, 300));
            const afterNarrower = reads;
            listener({ west: -40, south: 0, east: 60, north: 70 });   // wider: reads, and retries past the empty answer
            await new Promise((resolve) => setTimeout(resolve, 2500));
            return { afterFirst, afterNarrower, afterWider: reads, keptFeatures: styler.groups[0].features.length, before };
        });
        if (result.afterFirst !== 0) fail(`the first move re-read a panel that already had data: ${JSON.stringify(result)}`);
        if (result.afterNarrower !== 0) fail(`zooming in re-read the source: ${JSON.stringify(result)}`);
        if (result.afterWider < 2) fail(`a wider view did not retry past the empty answer: ${JSON.stringify(result)}`);
        // The empty answer in between must not have replaced what was there.
        if (result.keptFeatures !== result.before) fail(`an empty answer wiped the sample: ${JSON.stringify(result)}`);
    });

    await step('a classification written as a ladder of comparisons is editable', async () => {
        // The shape real configs carry. Read as `custom` it offered no level 4
        // at all — and so no way to recolour the branch painting every feature
        // that has no value, which is what this is really about.
        await page.evaluate(async ([layerId]) => {
            const adapter = await document.querySelector('webmapx-map').getAdapterAsync();
            const subs = adapter.getSubLayers(layerId);
            const fill = subs.find((sub) => sub.type === 'fill');
            fill.paint = { ...fill.paint, 'fill-color': ['case',
                ['!', ['has', 'pop']], 'lightgray',
                ['<', ['get', 'pop'], 10], '#fef0d9',
                ['<', ['get', 'pop'], 100], '#fdcc8a',
                '#d7301f'] };
            await adapter.setSubLayers(layerId, subs);
        }, [LAYER_ID]);
        await page.waitForTimeout(600);

        await page.evaluate(() => window.__styler.close());
        await openStyler(page);
        const lines = await summaries(page);
        const fillRow = lines.find((line) => line.startsWith('Fill'));
        if (!/by pop, 3 classes/.test(fillRow ?? '')) fail(`the ladder was not read as classes: ${fillRow}`);

        await expandNamed(page, 'Fill');
        const noData = await page.evaluate(() => {
            const row = [...window.__styler.shadowRoot.querySelectorAll('.level4 .row')]
                .find((candidate) => candidate.querySelector('input[type="text"]'));
            return row ? row.querySelector('.color-button')?.getAttribute('aria-label') ?? null : null;
        });
        // Opened on the layer's own no-data colour, not on the styler's default.
        if (!/lightgray/i.test(noData ?? '')) fail(`the no-data control did not open on the layer's colour: ${noData}`);

        await page.evaluate(() => {
            window.__styler.updateSettings(
                window.__styler.list.find((item) => item.entry.role === 'fill'), 'color', { noDataColor: '#ff0000' });
        });
        await page.waitForTimeout(600);
        const paint = JSON.stringify((await liveSubLayers(page)).find((sub) => sub.type === 'fill')?.paint?.['fill-color']);
        // Both guards, because a feature with no value reaches the map two ways:
        // the key absent (vector tiles drop an empty column) and the key null.
        if ((paint.match(/#ff0000/g) ?? []).length !== 2) fail(`the no-data colour reached ${paint}`);
    });

    await step('colouring by neighbours writes a class into the data and paints it', async () => {
        await expandNamed(page, 'Fill');
        await page.evaluate(() => {
            const select = [...window.__styler.shadowRoot.querySelectorAll('.entry-body select')]
                .find((candidate) => candidate.getAttribute('aria-label') === 'How colour is decided');
            select.value = 'neighbours';
            select.dispatchEvent(new Event('change', { bubbles: true }));
        });
        await page.waitForTimeout(600);

        const painted = (await liveSubLayers(page)).find((sub) => sub.type === 'fill')?.paint?.['fill-color'];
        const json = JSON.stringify(painted);
        // The colouring has no attribute of its own, so one is written into the
        // features: a handful of match branches rather than one per feature.
        if (!json.includes('__webmapx_neighbour_class')) fail(`the colouring names no column: ${json}`);

        const written = await page.evaluate(async () => {
            const adapter = await document.querySelector('webmapx-map').getAdapterAsync();
            const data = adapter.getSourceData('styler-test:styler-test-src') ?? adapter.getSourceData('styler-test-src');
            return (data?.features ?? []).map((feature) => feature.properties?.__webmapx_neighbour_class);
        });
        if (written.some((value) => typeof value !== 'number')) {
            fail(`the class index did not reach the data: ${JSON.stringify(written)}`);
        }
        // Touching areas must differ, which is the entire point.
        if (new Set(written).size < 2) fail(`every area got the same colour: ${JSON.stringify(written)}`);
    });

    await step('a neighbour colouring can take another palette', async () => {
        // It could not, at first: the palette was fixed to the first qualitative
        // scheme, and the palette row existed only under `By attribute`.
        const colorsOf = (paint) => JSON.stringify(paint).match(/#[0-9a-f]{6}|rgba?\([^)]*\)/gi) ?? [];
        const before = colorsOf((await liveSubLayers(page)).find((sub) => sub.type === 'fill')?.paint?.['fill-color']);
        const picked = await page.evaluate(() => {
            const buttons = [...window.__styler.shadowRoot.querySelectorAll('.level4 .schemes button.scheme')];
            const other = buttons.find((button) => button.getAttribute('aria-pressed') !== 'true');
            if (!other) return null;
            other.click();
            return other.getAttribute('aria-label');
        });
        if (!picked) fail('no other palette offered under By neighbours');
        await page.waitForTimeout(600);
        const after = colorsOf((await liveSubLayers(page)).find((sub) => sub.type === 'fill')?.paint?.['fill-color']);
        if (JSON.stringify(after) === JSON.stringify(before)) fail(`choosing ${picked} left the colours as they were: ${after}`);
        const pressed = await page.evaluate(() => [...window.__styler.shadowRoot.querySelectorAll('.level4 .schemes button.scheme')]
            .find((button) => button.getAttribute('aria-pressed') === 'true')?.getAttribute('aria-label') ?? null);
        if (pressed !== picked) fail(`the chosen palette is ${pressed}, not ${picked}`);
    });

    await step('asking for more colour-blind-safe colours than exist says so beside the slider', async () => {
        // No qualitative palette rated colour-blind safe has ten colours (Tol muted, the largest, has nine).
        // The warning used to go to the top of the panel, out of view, while the
        // slider moved and the palette row went on showing palettes.
        const ticked = await page.evaluate(async () => {
            const root = window.__styler.shadowRoot;
            const safe = [...root.querySelectorAll('.level4 label.check')]
                .find((label) => label.textContent.trim() === 'Colour-blind safe')?.querySelector('input');
            if (!safe) return false;
            if (!safe.checked) {
                safe.checked = true;
                safe.dispatchEvent(new Event('change', { bubbles: true }));
            }
            return true;
        });
        if (!ticked) fail('no Colour-blind safe checkbox under By neighbours');
        await page.waitForTimeout(600);
        // Ticking it at a count a safe palette has recolours the map, rightly;
        // the claim is only about the slider asking for more than exist.
        const before = JSON.stringify((await liveSubLayers(page)).find((sub) => sub.type === 'fill')?.paint?.['fill-color']);
        const result = await page.evaluate(async () => {
            const root = window.__styler.shadowRoot;
            const slider = root.querySelector('input[aria-label="How many colours to spread over"]');
            slider.value = '10';
            slider.dispatchEvent(new Event('input', { bubbles: true }));
            await new Promise((resolve) => setTimeout(resolve, 400));
            const level4 = slider.closest('.level4');
            return {
                inline: level4?.querySelector('.warning')?.textContent.replace(/\s+/g, ' ').trim() ?? null,
                top: root.querySelector('.panel > .warning, .panel-body > .warning')?.textContent.trim() ?? null,
            };
        });
        if (result.error) fail(result.error);
        if (!result.inline || !/colour-blind-safe/i.test(result.inline)) {
            fail(`no warning beside the slider: ${JSON.stringify(result)}`);
        }
        const after = JSON.stringify((await liveSubLayers(page)).find((sub) => sub.type === 'fill')?.paint?.['fill-color']);
        if (after !== before) fail('the map changed although no palette had that many colours');
    });

    await step('a long sublayer name cannot push the row\u2019s buttons out', async () => {
        // A dropped file names its sublayers after the file:
        // `NUTS_RG_01M_2024_4326_LEVL_3_uk_stats:…-line`. A flex item will not
        // shrink below its content unless told to, so that one unbreakable word
        // pushed the reorder and delete buttons clean out of the row.
        const overflowing = await page.evaluate(() => {
            const root = window.__styler.shadowRoot;
            const entries = [...root.querySelectorAll('.entry')];
            return entries.map((entry) => {
                const head = entry.querySelector('.entry-head').getBoundingClientRect();
                const actions = entry.querySelector('.entry-actions').getBoundingClientRect();
                return {
                    name: entry.querySelector('.entry-summary').textContent.replace(/\s+/g, ' ').trim().slice(0, 30),
                    // Two pixels of slack for sub-pixel layout.
                    outside: actions.right > head.right + 2 || actions.width === 0,
                };
            });
        });
        const bad = overflowing.filter((entry) => entry.outside);
        if (bad.length > 0) fail(`the buttons left the row on: ${JSON.stringify(bad)}`);
    });

    await step('a paint change made straight after a delete still reaches the map', async () => {
        // The sequence that loses a change: deleting a style rebuilds the layer,
        // and `addLayer` is async — a paint write during that lands on a native
        // layer about to be replaced, so the engine reports success, the legend
        // updates, and the map never shows it. No waiting between the two here,
        // deliberately.
        await page.evaluate(() => window.__styler.close());
        await openStyler(page);
        // Expand the fill first, so its controls exist before the delete starts.
        await expandNamed(page, 'Fill');
        const wrote = await page.evaluate(() => {
            const root = window.__styler.shadowRoot;
            const slider = [...root.querySelectorAll('.entry-body input[type="range"]')]
                .find((candidate) => candidate.getAttribute('aria-label') === 'Opacity');
            if (!slider) return false;
            const target = [...root.querySelectorAll('.entry')]
                .find((entry) => /Labels|Outline/.test(entry.textContent));
            if (!target) return false;
            // Both in one tick, with the rebuild still in flight when the paint
            // is written — which is the whole point.
            target.querySelector('button[aria-label="Delete this style"]').click();
            slider.value = '0.25';
            slider.dispatchEvent(new Event('input', { bubbles: true }));
            return true;
        });
        if (!wrote) fail('no opacity control on the fill entry');
        await page.waitForTimeout(1500);

        const fill = (await liveSubLayers(page)).find((sub) => sub.type === 'fill');
        if (Math.abs(Number(fill?.paint?.['fill-opacity']) - 0.25) > 0.001) {
            fail(`the change was lost in the rebuild: ${JSON.stringify(fill?.paint)}`);
        }

        // Put the deleted style back, so the steps after this one still have a
        // layer of more than one style to work with.
        await page.evaluate(() => {
            [...window.__styler.shadowRoot.querySelectorAll('sl-button')]
                .find((button) => button.textContent.trim() === 'Reset')?.click();
        });
        await page.waitForTimeout(900);
    });

    await step('turning a fill edge off and on again brings the edge back', async () => {
        // MapLibre decides whether a fill carries outline geometry when the
        // layer is uploaded: `setPaintProperty('fill-outline-color', …)` on a
        // live fill layer reports success, mirrors into the store, ticks the
        // box — and draws nothing. So the channel has to be declared at build
        // time. Measured on 1527 polygons before this was a rule.
        await page.evaluate(() => window.__styler.close());
        await openStyler(page);
        await expandNamed(page, 'Fill');

        const toggleEdge = async (on) => {
            await page.evaluate((on) => {
                const rows = [...window.__styler.shadowRoot.querySelectorAll('.entry-body .row')];
                const row = rows.find((candidate) => candidate.querySelector('.name')?.textContent.trim() === 'Edge');
                if (!row) throw new Error('no Edge row');
                const box = row.querySelector('input[type="checkbox"]');
                box.checked = on;
                box.dispatchEvent(new Event('change', { bubbles: true }));
            }, on);
            await page.waitForTimeout(1200);
        };
        const edgeInPaint = async () => (await liveSubLayers(page))
            .find((sub) => sub.type === 'fill')?.paint?.['fill-outline-color'] ?? null;

        await toggleEdge(true);
        if (!(await edgeInPaint())) fail('the edge never reached the paint');
        await toggleEdge(false);
        if (await edgeInPaint()) fail('the edge survived being switched off');
        await toggleEdge(true);
        if (!(await edgeInPaint())) fail('switching the edge back on did nothing');

        // What the paint says is not what the map draws unless the layer was
        // rebuilt, so check the sublayer really was re-added with it declared.
        const declared = await page.evaluate(async (layerId) => {
            const adapter = await document.querySelector('webmapx-map').getAdapterAsync();
            const subs = adapter.getSubLayers(layerId) ?? [];
            return subs.find((sub) => sub.type === 'fill')?.paint?.['fill-outline-color'] ?? null;
        }, LAYER_ID);
        if (!declared) fail('the rebuilt layer does not declare the edge');
    });

    await step('every engine that draws features offers a fill edge', async () => {
        await expandNamed(page, 'Fill');
        const edge = await page.evaluate(() => {
            const rows = [...window.__styler.shadowRoot.querySelectorAll('.entry-body .row')];
            const row = rows.find((candidate) => candidate.querySelector('.name')?.textContent.trim() === 'Edge');
            return { checkbox: Boolean(row?.querySelector('input[type="checkbox"]')), text: row?.textContent.replace(/\s+/g, ' ').trim() ?? null };
        });
        // Both MapLibre and OpenLayers draw `fill-outline-color`; OpenLayers
        // spells the key as `layer.type + '-outline-color'` inside
        // `ol-mapbox-style`, which is why grepping for the literal once
        // suggested — wrongly — that it had no support at all.
        if (!edge.checkbox) fail(`no fill edge offered on ${engine}: ${edge.text}`);
    });

    await step('Reset puts the layer back exactly as the panel found it', async () => {
        // Reopen first: "as found" means the state at *this* opening, so the
        // snapshot has to be taken where the panel takes its own.
        await page.evaluate(() => window.__styler.close());
        await openStyler(page);
        const opened = await liveSubLayers(page);

        // A deletion, because that is the change repainting cannot undo — the
        // old panel's per-sublayer `originalPaint` could not put back a style
        // the session had removed.
        await page.evaluate(() => {
            const entries = [...window.__styler.shadowRoot.querySelectorAll('.entry')];
            entries[0].querySelector('button[aria-label="Delete this style"]').click();
        });
        await page.waitForTimeout(700);
        const afterDelete = await liveSubLayers(page);
        if (afterDelete.length !== opened.length - 1) fail(`the delete did not happen: ${JSON.stringify(afterDelete.map((s) => s.id))}`);

        await page.evaluate(() => {
            const reset = [...window.__styler.shadowRoot.querySelectorAll('sl-button')]
                .find((button) => button.textContent.trim() === 'Reset');
            if (!reset) throw new Error('no Reset button');
            if (reset.disabled) throw new Error('Reset is disabled after editing the layer');
            reset.click();
        });
        await page.waitForTimeout(800);

        const after = await liveSubLayers(page);
        if (JSON.stringify(after) !== JSON.stringify(opened)) {
            fail(`Reset did not restore the layer:\n  opened ${JSON.stringify(opened)}\n  after  ${JSON.stringify(after)}`);
        }
    });

    // Expanded for the screenshot: the channel rows and level 4 are the half of
    // the panel a summary line cannot show.
    await expandNamed(page, 'Fill');
    const file = await screenshot(page, `layer-styler-${engine}`);
    console.log(`  ✓ layer styler works on ${engine} (screenshot: ${file})`);
}

export const engines = ['maplibre', 'openlayers', 'leaflet', 'cesium'];
