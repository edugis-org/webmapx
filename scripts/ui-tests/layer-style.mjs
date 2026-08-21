/**
 * The layer styling panel, driven the way a user drives it.
 *
 * What matters is not that the form renders — it is that the paint reaching the
 * engine changes, and changes into an expression that gives different features
 * different colours. So every assertion reads back the *engine's* paint through
 * the adapter, not the panel's own state.
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdir } from 'node:fs/promises';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCREENSHOT_DIR = path.resolve(__dirname, '../temp/screenshots');

/** Somewhere with room for a 3×3 grid of degree-sized squares. */
const ORIGIN = [30, 40];
const LAYER_ID = 'style-test';

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

/**
 * A 3×3 grid of touching squares, each with a population and a region — enough
 * for every branch: numeric classification, categories, and neighbours.
 */
async function addTestLayer(page) {
    await page.evaluate(async ([lon, lat, layerId]) => {
        const size = 0.5;
        const features = [];
        for (let row = 0; row < 3; row++) {
            for (let col = 0; col < 3; col++) {
                const x = lon + col * size;
                const y = lat + row * size;
                features.push({
                    type: 'Feature',
                    id: `cell-${row}-${col}`,
                    properties: {
                        name: `cell ${row}${col}`,
                        // Deliberately skewed: natural breaks and equal intervals
                        // must disagree about it.
                        pop: [1, 2, 3, 4, 5, 10, 50, 400, 9000][row * 3 + col],
                        region: row === 0 ? 'north' : row === 1 ? 'middle' : 'south',
                    },
                    geometry: {
                        type: 'Polygon',
                        coordinates: [[[x, y], [x + size, y], [x + size, y + size], [x, y + size], [x, y]]],
                    },
                });
            }
        }

        await document.querySelector('webmapx-map').addLayerRequest({
            id: layerId,
            type: 'fill',
            source: `${layerId}-src`,
            sources: {
                [`${layerId}-src`]: {
                    id: `${layerId}-src`,
                    type: 'geojson',
                    data: { type: 'FeatureCollection', features },
                },
            },
            paint: { 'fill-color': '#888888', 'fill-opacity': 0.6 },
            metadata: { label: 'Style test', dynamic: true },
        });
    }, [...ORIGIN, LAYER_ID]);

    await page.waitForFunction(async (layerId) => {
        const adapter = await document.querySelector('webmapx-map')?.getAdapterAsync?.();
        return Boolean(adapter?.store?.getState?.().mapLayers?.[layerId]);
    }, LAYER_ID, { timeout: 15_000 });
}

/** A layer drawn as fill *and* line over one source, like world-countries. */
async function addCompositeLayer(page) {
    await page.evaluate(async ([lon, lat]) => {
        const size = 0.5;
        const features = [];
        for (let i = 0; i < 4; i++) {
            const x = lon + i * size;
            features.push({
                type: 'Feature',
                id: `wide-${i}`,
                properties: { pop: [1, 5, 400, 9000][i] },
                geometry: { type: 'Polygon', coordinates: [[[x, lat], [x + size, lat], [x + size, lat + size], [x, lat + size], [x, lat]]] },
            });
        }
        await document.querySelector('webmapx-map').addLayerRequest({
            id: 'style-composite',
            type: 'style',
            version: 8,
            sources: {
                'style-composite-src': {
                    id: 'style-composite-src',
                    type: 'geojson',
                    data: { type: 'FeatureCollection', features },
                },
            },
            layers: [
                { id: 'style-composite-fill', type: 'fill', source: 'style-composite-src', paint: { 'fill-color': '#4a90d9', 'fill-opacity': 0.2 } },
                { id: 'style-composite-line', type: 'line', source: 'style-composite-src', paint: { 'line-color': '#2c6fad', 'line-width': 2 } },
            ],
            metadata: { label: 'Composite test', dynamic: true },
        });
    }, ORIGIN);

    await page.waitForFunction(async () => {
        const adapter = await document.querySelector('webmapx-map')?.getAdapterAsync?.();
        return Boolean(adapter?.store?.getState?.().mapLayers?.['style-composite']);
    }, undefined, { timeout: 15_000 });
}

/** A layer whose only columns are a name and a code, like world-countries. */
async function addKeyOnlyLayer(page) {
    await page.evaluate(async ([lon, lat]) => {
        const features = Array.from({ length: 12 }, (_, i) => ({
            type: 'Feature',
            id: `key-${i}`,
            properties: { NAME: `country ${i}`, ISO_A3: `C${i.toString().padStart(2, '0')}` },
            geometry: {
                type: 'Polygon',
                coordinates: [[[lon + i, lat], [lon + i + 1, lat], [lon + i + 1, lat + 1], [lon + i, lat + 1], [lon + i, lat]]],
            },
        }));
        await document.querySelector('webmapx-map').addLayerRequest({
            id: 'style-keys',
            type: 'fill',
            source: 'style-keys-src',
            sources: { 'style-keys-src': { id: 'style-keys-src', type: 'geojson', data: { type: 'FeatureCollection', features } } },
            paint: { 'fill-color': '#4a90d9', 'fill-opacity': 0.2 },
            metadata: { label: 'Keys only', dynamic: true },
        });
    }, ORIGIN);

    await page.waitForFunction(async () => {
        const adapter = await document.querySelector('webmapx-map')?.getAdapterAsync?.();
        return Boolean(adapter?.store?.getState?.().mapLayers?.['style-keys']);
    }, undefined, { timeout: 15_000 });
}

/** Opens the styling panel the way the legend does. */
async function openStylePanel(page, options = {}) {
    await page.evaluate(async ([layerId, composite]) => {
        const map = document.querySelector('webmapx-map');
        const adapter = await map.getAdapterAsync();
        const overview = document.querySelector('webmapx-layer-overview')
            ?? document.querySelector('webmapx-layer-legend3d');
        if (!overview) throw new Error('no legend component on the page');

        // The legend's own handler is private; calling the dialog with the same
        // context the legend builds keeps this test honest about the contract
        // between them without reaching into a click target that may move.
        await import('/src/components/webmapx-layer-style-dialog.ts');
        const dialog = document.createElement('webmapx-layer-style-dialog');
        document.body.appendChild(dialog);

        // A composite layer's sources are registered under the ids its own
        // sublayers name, which is not always the id they were declared with —
        // read it back rather than guessing.
        const entry = adapter.store.getState().mapLayers[layerId];
        const declared = composite === true
            ? (entry?.sublayers ?? []).map(sub => sub.source).find(Boolean)
            : `${layerId}-src`;
        const sourceId = declared ?? `${layerId}-src`;
        const source = adapter.getSourceData(sourceId)
            ?? adapter.getSourceData(`${layerId}:${sourceId}`);
        if (!source) throw new Error(`no source data for ${sourceId} (layer ${layerId})`);
        const keysOnly = composite === 'keys';
        const layers = composite === true
            ? [
                { id: 'style-composite-fill', type: 'fill', paint: { 'fill-color': '#4a90d9', 'fill-opacity': 0.2 } },
                { id: 'style-composite-line', type: 'line', paint: { 'line-color': '#2c6fad', 'line-width': 2 } },
            ]
            : [{ id: layerId, type: 'fill', paint: { 'fill-color': '#888888', 'fill-opacity': 0.6 } }];
        dialog.open({
            title: 'Style test',
            layerId,
            groups: [{
                sourceId,
                featureCountLabel: `${source.features.length} features`,
                featureCount: source.features.length,
                geometryTypes: ['Polygon'],
                attributes: keysOnly ? [
                    { name: 'NAME', type: 'string', values: source.features.map(f => f.properties.NAME), presentCount: source.features.length, missingCount: 0 },
                    { name: 'ISO_A3', type: 'string', values: source.features.map(f => f.properties.ISO_A3), presentCount: source.features.length, missingCount: 0 },
                ] : [
                    { name: 'pop', type: 'number', values: source.features.map(f => f.properties.pop), presentCount: source.features.length, missingCount: 0 },
                    { name: 'name', type: 'string', values: source.features.map(f => f.properties.name), presentCount: source.features.length, missingCount: 0 },
                    { name: 'region', type: 'string', values: source.features.map(f => f.properties.region), presentCount: source.features.length, missingCount: 0 },
                ],
                featureRows: source.features.map(f => f.properties),
                layers,
                features: source.features,
                completeData: true,
            }],
            apply: (subLayerId, paint) => adapter.updateLayerStyle(layerId, subLayerId || layerId, paint),
        });
        window.__stylePanel = dialog;
    }, [options.layerId ?? LAYER_ID, options.targetType === 'line' ? true : options.targetType === 'keys' ? 'keys' : false]);

    await page.waitForFunction(() => Boolean(window.__stylePanel?.shadowRoot?.querySelector('sl-dialog')), undefined, { timeout: 10_000 });
}

/** Clicks a choice button by its visible text. */
async function choose(page, label) {
    const clicked = await page.evaluate((text) => {
        const root = window.__stylePanel.shadowRoot;
        const button = [...root.querySelectorAll('button.choice')]
            .find(candidate => candidate.textContent.trim().toLowerCase().startsWith(text.toLowerCase()));
        if (!button) return false;
        button.click();
        return true;
    }, label);
    if (!clicked) {
        const available = await page.evaluate(() =>
            [...window.__stylePanel.shadowRoot.querySelectorAll('button.choice')].map(b => b.textContent.trim().split('\n')[0]));
        throw new Error(`no choice "${label}" — panel offers: ${available.join(' | ')}`);
    }
    await page.waitForTimeout(150);
}

/** The colour the engine would paint a feature with the given properties. */
async function paintedColors(page, propertiesList) {
    return page.evaluate(async ([layerId, list]) => {
        const map = document.querySelector('webmapx-map');
        const adapter = await map.getAdapterAsync();
        const paint = adapter.getLayerPaint?.(layerId) ?? window.__lastPaint;
        const { evaluateColor } = await import('/src/utils/maplibre-expression-evaluator.ts');
        return list.map(properties => evaluateColor(
            paint['fill-color'],
            { type: 'Feature', id: properties.__id, properties, geometry: { type: 'Polygon' } },
            6,
            '#000000',
        ));
    }, [LAYER_ID, propertiesList]);
}

/** Captures every paint the panel pushes, so the test reads what the engine got. */
async function recordApplies(page) {
    await page.evaluate(() => {
        const dialog = window.__stylePanel;
        const original = dialog.applyStyle;
        window.__lastPaint = null;
        dialog.applyStyle = (subLayerId, paint) => {
            window.__lastPaint = paint;
            original?.(subLayerId, paint);
        };
    });
}

function fail(message) {
    throw new Error(message);
}

export async function run({ page, engine, baseUrl }) {
    console.log(`  Running layer style panel test for engine: ${engine}`);

    const step = async (label, fn) => {
        try {
            return await fn();
        } catch (error) {
            await screenshot(page, `layer-style-${engine}-failed`);
            throw new Error(`${label}: ${error instanceof Error ? error.message : String(error)}`, { cause: error });
        }
    };

    await step('load page', async () => {
        await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });
        await waitForMapReady(page);
    });

    await step('add a 3x3 test layer', () => addTestLayer(page));
    await step('open the styling panel', () => openStylePanel(page));
    await step('record what the panel applies', () => recordApplies(page));

    // ── One colour ───────────────────────────────────────────────────────────
    await step('choose one colour', () => choose(page, 'One colour'));
    await step('a single colour reaches the engine', async () => {
        const paint = await page.evaluate(() => window.__lastPaint);
        if (!paint || typeof paint['fill-color'] !== 'string') {
            fail(`expected a plain colour, got ${JSON.stringify(paint)}`);
        }
    });

    // ── By attribute, numeric ────────────────────────────────────────────────
    await step('reopen the colour question', () => page.evaluate(() => {
        [...window.__stylePanel.shadowRoot.querySelectorAll('.done-row button')]
            .find(b => b.parentElement.textContent.includes('Colour')).click();
    }));
    await step('choose by attribute', () => choose(page, 'By attribute'));
    await step('choose the pop field', () => choose(page, 'pop'));

    await step('the panel is actually on screen', async () => {
        const state = await page.evaluate(() => {
            const dialog = window.__stylePanel.shadowRoot.querySelector('sl-dialog');
            // sl-dialog's own host box is empty; what is on screen is its
            // internal panel part.
            const box = dialog?.shadowRoot?.querySelector('[part~="panel"]')?.getBoundingClientRect();
            return { open: Boolean(dialog?.open), width: box?.width ?? 0, height: box?.height ?? 0 };
        });
        if (!state.open || state.height <= 0) {
            fail(`the styling panel never became visible: ${JSON.stringify(state)}`);
        }
        await screenshot(page, `layer-style-${engine}-panel`);
    });

    const classified = await step('a classified expression reaches the engine', async () => {
        const paint = await page.evaluate(() => window.__lastPaint);
        if (!paint || !Array.isArray(paint['fill-color'])) {
            fail(`expected an expression, got ${JSON.stringify(paint)}`);
        }
        return paint;
    });

    await step('different values are painted different colours', async () => {
        const colors = await paintedColors(page, [{ pop: 1 }, { pop: 5 }, { pop: 9000 }]);
        if (new Set(colors).size < 2) {
            fail(`the classification paints everything the same: ${colors.join(', ')} from ${JSON.stringify(classified['fill-color'])}`);
        }
    });

    await step('a feature with no value is painted as no data', async () => {
        const [missing, lowest] = await paintedColors(page, [{}, { pop: 1 }]);
        if (missing === lowest) {
            fail(`a missing value is painted like the lowest class (${missing})`);
        }
    });

    await step('switching method changes the breaks', async () => {
        // The data is deliberately skewed (1..10, then 50, 400, 9000). Equal
        // intervals crowd almost everything into the bottom class; natural
        // breaks spread the same nine features over the classes. Comparing how
        // many distinct colours the whole layer gets is the robust way to see
        // that — asserting about one value depends on where a break happens to
        // fall, which is exactly what the methods disagree about.
        const all = [1, 2, 3, 4, 5, 10, 50, 400, 9000].map(pop => ({ pop }));
        const natural = new Set(await paintedColors(page, all)).size;
        await choose(page, 'Equal intervals');
        const equal = new Set(await paintedColors(page, all)).size;
        if (natural <= equal) {
            fail(`natural breaks used ${natural} colours and equal intervals ${equal}: on data this skewed natural breaks must spread it wider`);
        }
    });

    await step('the panel says when every scheme is already colour-blind safe', async () => {
        // Every ColorBrewer sequential scheme is safe, so the filter removes
        // nothing here — and a checkbox that appears to do nothing is worse
        // than one that explains itself.
        const text = await page.evaluate(async () => {
            const root = window.__stylePanel.shadowRoot;
            const checkbox = [...root.querySelectorAll('sl-checkbox')].find(c => c.textContent.includes('Colour-blind'));
            checkbox.click();
            await new Promise(resolve => setTimeout(resolve, 250));
            const text = root.textContent;
            // Leave the filter as it was found, so the next step measures its
            // own change rather than inheriting this one.
            checkbox.click();
            await new Promise(resolve => setTimeout(resolve, 250));
            return text;
        });
        if (!/Every one of these is colour-blind safe/.test(text)) {
            fail('the panel filtered sequential schemes silently instead of explaining');
        }
    });

    // ── Neighbours differ ────────────────────────────────────────────────────
    await step('reopen the colour question', () => page.evaluate(() => {
        [...window.__stylePanel.shadowRoot.querySelectorAll('.done-row button')]
            .find(b => b.parentElement.textContent.includes('Colour')).click();
    }));
    await step('choose neighbours differ', () => choose(page, 'Neighbours differ'));

    await step('touching squares get different colours', async () => {
        const colors = await paintedColors(page, [
            { __id: 'cell-0-0' }, { __id: 'cell-0-1' }, { __id: 'cell-1-0' },
        ]);
        if (colors[0] === colors[1]) fail(`cell 00 and its right neighbour share ${colors[0]}`);
        if (colors[0] === colors[2]) fail(`cell 00 and the cell above share ${colors[0]}`);
    });

    await step('colour-blind filtering narrows the qualitative schemes', async () => {
        // Unlike the sequential ramps, the qualitative ones are not all safe:
        // this is where the flag earns its place in the data.
        const counts = await page.evaluate(async () => {
            const root = window.__stylePanel.shadowRoot;
            const listed = () => root.querySelectorAll('.scheme-row').length;
            const checkbox = [...root.querySelectorAll('sl-checkbox')].find(c => c.textContent.includes('Colour-blind'));
            const before = listed();
            checkbox.click();
            await new Promise(resolve => setTimeout(resolve, 250));
            const after = listed();
            checkbox.click();
            await new Promise(resolve => setTimeout(resolve, 250));
            return { before, after };
        });
        if (counts.after >= counts.before) {
            fail(`qualitative schemes went from ${counts.before} to ${counts.after} with the colour-blind filter on`);
        }
    });

    await step('the panel reports how many colours it needed', async () => {
        const text = await page.evaluate(() => window.__stylePanel.shadowRoot.textContent);
        if (!/\d+ colours, no two touching areas alike/.test(text)) {
            fail('the panel does not say how many colours the colouring used');
        }
    });

    // ── Reset ────────────────────────────────────────────────────────────────
    await step('reset puts the original paint back', async () => {
        await page.evaluate(() => {
            [...window.__stylePanel.shadowRoot.querySelectorAll('sl-button')]
                .find(b => b.textContent.includes('Reset')).click();
        });
        await page.waitForTimeout(200);
        const paint = await page.evaluate(() => window.__lastPaint);
        if (paint?.['fill-color'] !== '#888888') {
            fail(`reset left ${JSON.stringify(paint)} instead of the original colour`);
        }
    });

    await step('the legend sees the new style, not the old one', async () => {
        // The store mirror is what the legend reads. Without it the map showed
        // the new colours and the legend went on showing the authored ones.
        const stored = await page.evaluate(async ([layerId]) => {
            const adapter = await document.querySelector('webmapx-map').getAdapterAsync();
            return adapter.store.getState().mapLayers[layerId]?.paint?.['fill-color'] ?? null;
        }, [LAYER_ID]);
        if (stored !== '#888888') {
            fail(`after reset the store holds ${JSON.stringify(stored)}`);
        }

        await choose(page, 'One colour');
        const afterChange = await page.evaluate(async ([layerId]) => {
            const adapter = await document.querySelector('webmapx-map').getAdapterAsync();
            return adapter.store.getState().mapLayers[layerId]?.paint?.['fill-color'] ?? null;
        }, [LAYER_ID]);
        if (afterChange === '#888888' || afterChange === null) {
            fail(`the store still holds ${JSON.stringify(afterChange)} after a style change`);
        }
    });

    await step('opacity is an answer, not something inherited silently', async () => {
        const shown = await page.evaluate(() => {
            const root = window.__stylePanel.shadowRoot;
            const slider = [...root.querySelectorAll('input[type="range"]')]
                .find(input => input.max === '1');
            return slider ? Number(slider.value) : null;
        });
        // The test layer is authored at 0.6, and the panel must start there
        // rather than at full strength.
        if (shown !== 0.6) fail(`the opacity control shows ${shown}, not the layer's own 0.6`);

        const applied = await page.evaluate(async () => {
            const root = window.__stylePanel.shadowRoot;
            const slider = [...root.querySelectorAll('input[type="range"]')].find(input => input.max === '1');
            slider.value = '1';
            slider.dispatchEvent(new Event('input'));
            await new Promise(resolve => setTimeout(resolve, 250));
            return window.__lastPaint;
        });
        if (applied['fill-opacity'] !== 1) {
            fail(`moving the opacity control produced ${JSON.stringify(applied)}`);
        }
    });

    await step('the preview swatches show the opacity being applied', async () => {
        const swatches = await page.evaluate(async () => {
            const root = window.__stylePanel.shadowRoot;
            const slider = [...root.querySelectorAll('input[type="range"]')].find(input => input.max === '1');
            slider.value = '0.3';
            slider.dispatchEvent(new Event('input'));
            await new Promise(resolve => setTimeout(resolve, 250));
            return [...root.querySelectorAll('.preview-swatch')].map(el => el.style.opacity);
        });
        await screenshot(page, `layer-style-${engine}-opacity`);
        if (swatches.length === 0 || !swatches.every(value => value === '0.3')) {
            fail(`preview swatches show opacity ${swatches.join(', ') || '(none)'} instead of the 0.3 being applied`);
        }
    });

    // ── A layer drawn as fill *and* line ─────────────────────────────────────
    await step('style the outlines of a two-sublayer layer', async () => {
        await addCompositeLayer(page);
        await openStylePanel(page, { layerId: 'style-composite', targetType: 'line' });
        await recordApplies(page);
        await choose(page, 'Lines');
        await choose(page, 'By attribute');
        await choose(page, 'pop');

        const paint = await page.evaluate(() => window.__lastPaint);
        if (!paint || !Array.isArray(paint['line-color'])) {
            fail(`outlines got ${JSON.stringify(paint)} instead of a classified line-color`);
        }
        const colors = await page.evaluate(async ([list]) => {
            const { evaluateColor } = await import('/src/utils/maplibre-expression-evaluator.ts');
            return list.map(properties => evaluateColor(
                window.__lastPaint['line-color'],
                { type: 'Feature', properties, geometry: { type: 'Polygon' } }, 6, '#000000'));
        }, [[{ pop: 1 }, { pop: 400 }, { pop: 9000 }]]);
        if (new Set(colors).size < 2) {
            fail(`every outline is painted the same colour: ${colors.join(', ')}`);
        }
    });

    await step('a column with one value per feature cannot be grouped by', async () => {
        // world-countries carries only NAME and ISO_A3: 257 different values in
        // 257 features. Classified into eight categories that put 249 countries
        // in the grey "other", which reads as a one-colour map.
        await addKeyOnlyLayer(page);
        await openStylePanel(page, { layerId: 'style-keys', targetType: 'keys' });
        await choose(page, 'By attribute');

        const state = await page.evaluate(() => {
            const root = window.__stylePanel.shadowRoot;
            return {
                disabled: [...root.querySelectorAll('button.choice')].filter(b => b.disabled).map(b => b.textContent.trim().split('\n')[0]),
                explains: /every value is different/.test(root.textContent),
                suggests: /Neighbours differ/.test(root.textContent),
            };
        });
        if (state.disabled.length === 0) fail('a name column was offered as something to group by');
        if (!state.explains || !state.suggests) fail('the panel does not explain why, or what to do instead');
    });

    const file = await screenshot(page, `layer-style-${engine}`);
    console.log(`  ✓ layer style panel works on ${engine} (screenshot: ${file})`);
}
