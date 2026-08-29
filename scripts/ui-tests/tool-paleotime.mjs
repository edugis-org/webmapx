/**
 * UI Test: the paleotime tool
 *
 * The whole design rests on one indirection — the tool moves `store.paleoTimeMa`,
 * and the layer redraws because its url mentions `{ma}` — and that indirection
 * is exactly what a screenshot cannot check. Broken, the map simply shows
 * today's coastlines whatever the slider says, which looks like a working tool.
 *
 * So this drives the real thing in each engine and asserts on the geometry the
 * source actually holds: that it moves when the age moves, that it moves *back*
 * to where it started, and that the layer is gone when the tool closes.
 */
const PAGE = 'testpages/paleotime.html';
const SOURCE = 'paleotime-coastlines-source';

// Cesium passes but is excluded from the routine run: it is much slower here
// and its remaining quirks are tracked separately. Run it explicitly with
// `--engines cesium` when working on that adapter.
export const engines = ['maplibre', 'openlayers', 'leaflet'];

function fail(message) {
    throw new Error(message);
}

/** Polls an async predicate in the page until it holds, or gives up. */
async function waitFor(page, timeoutMs, predicate, what) {
    const deadline = Date.now() + timeoutMs;
    for (;;) {
        if (await page.evaluate(predicate)) return;
        if (Date.now() > deadline) fail(`timed out waiting for ${what}`);
        await new Promise((resolve) => setTimeout(resolve, 250));
    }
}

/** A fingerprint of where the world is: the mean position of every vertex. */
async function worldCentre(page, sourceId) {
    return page.evaluate(async (source) => {
        const adapter = await document.querySelector('webmapx-map').getAdapterAsync();
        const data = adapter.getSourceData(source)
            ?? adapter.getSourceData(`paleotime-coastlines:${source}`);
        if (!data?.features?.length) return null;
        let sx = 0, sy = 0, n = 0;
        const walk = (node) => {
            if (!Array.isArray(node) || !node.length) return;
            if (typeof node[0] === 'number') { sx += node[0]; sy += node[1]; n++; return; }
            for (const child of node) walk(child);
        };
        for (const f of data.features) walk(f.geometry?.coordinates);
        return { x: sx / n, y: sy / n, features: data.features.length, vertices: n };
    }, sourceId);
}

async function setAge(page, ma) {
    await page.evaluate(async (value) => {
        const adapter = await document.querySelector('webmapx-map').getAdapterAsync();
        adapter.store.dispatch({ paleoTimeMa: value }, 'UI');
    }, ma);
    await new Promise((resolve) => setTimeout(resolve, 400));
}

export async function run({ page, engine, baseUrl }) {
    console.log(`  Running paleotime tool test for engine: ${engine}`);

    await page.goto(`${baseUrl}/${PAGE}?adapter=${engine}`, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(async () => {
        const map = document.querySelector('webmapx-map');
        if (!map || typeof map.getAdapterAsync !== 'function') return false;
        return Boolean(await map.getAdapterAsync());
    }, undefined, { timeout: 45_000 });

    const step = async (label, fn) => {
        try {
            await fn();
            console.log(`    ✓ ${label}`);
        } catch (err) {
            console.log(`    ✗ ${label}`);
            throw err;
        }
    };

    // Polled rather than waited on with `page.waitForFunction`.
    //
    // The adapter is only reachable through `getAdapterAsync`, so any predicate
    // that reads it has to be async — and an async predicate handed to
    // `waitForFunction` returns a Promise, which is an object, which is truthy,
    // so the wait succeeds on the first tick whatever the page is doing. That
    // made this suite report "no coastline data" for a layer that was in fact
    // drawn correctly half a second later.
    await waitFor(page, 60_000, async () => {
        const adapter = await document.querySelector('webmapx-map').getAdapterAsync();
        const data = adapter.getSourceData('paleotime-coastlines-source');
        return Boolean(data?.features?.length);
    }, 'the coastline layer to appear');

    let present = null;
    await step('the present-day world is drawn', async () => {
        present = await worldCentre(page, SOURCE);
        if (!present) fail('no coastline data');
        if (present.features < 2000) fail(`only ${present.features} features at present day`);
    });

    await step('the continents carry a present-day landmass', async () => {
        const named = await page.evaluate(async (source) => {
            const adapter = await document.querySelector('webmapx-map').getAdapterAsync();
            const data = adapter.getSourceData(source)
                ?? adapter.getSourceData(`paleotime-coastlines:${source}`);
            return [...new Set(data.features.map((f) => f.properties?.continent))].filter(Boolean).sort();
        }, SOURCE);
        // Colour by landmass is the point of the layer; without this property
        // every plate renders in the fallback grey and the animation says nothing.
        if (named.length < 6) fail(`only ${named.length} continents present: ${named.join(', ')}`);
    });

    await step('moving the age moves the world', async () => {
        await setAge(page, 200);
        const jurassic = await worldCentre(page, SOURCE);
        if (!jurassic) fail('no data at 200 Ma');
        const moved = Math.hypot(jurassic.x - present.x, jurassic.y - present.y);
        // Pangaea is assembled at 200 Ma: the mean vertex is a long way from
        // where today's spread-out continents put it.
        if (moved < 1) fail(`the world barely moved (${moved.toFixed(3)} degrees) — is {ma} wired up?`);
        // And land that had not formed yet is gone, rather than adrift.
        if (jurassic.features >= present.features) {
            fail(`${jurassic.features} features at 200 Ma against ${present.features} today`);
        }
    });

    await step('an age between two samples is interpolated, not snapped', async () => {
        await setAge(page, 100);
        const a = await worldCentre(page, SOURCE);
        await setAge(page, 102.5);
        const b = await worldCentre(page, SOURCE);
        const moved = Math.hypot(b.x - a.x, b.y - a.y);
        if (moved === 0) fail('2.5 Ma between sampled ages changed nothing');
    });

    await step('play runs history forwards, from the past towards the present', async () => {
        // The direction is the point: continents drifting apart into the world
        // we know. Running it the other way is a rewind and reads as one.
        const seen = await page.evaluate(async () => {
            const adapter = await document.querySelector('webmapx-map').getAdapterAsync();
            const tool = document.querySelector('webmapx-paleotime-tool');
            adapter.store.dispatch({ paleoTimeMa: 0 }, 'UI');
            await new Promise((r) => setTimeout(r, 300));
            tool.shadowRoot.querySelector('button.play').click();
            // Pressing play at the present must jump to the far end and start.
            await new Promise((r) => setTimeout(r, 400));
            const started = adapter.store.getState().paleoTimeMa;
            await new Promise((r) => setTimeout(r, 1200));
            const later = adapter.store.getState().paleoTimeMa;
            tool.shadowRoot.querySelector('button.play').click();
            return { started, later };
        });
        if (!(seen.started > 100)) fail(`play at the present started at ${seen.started} Ma, not in the deep past`);
        if (!(seen.later < seen.started)) {
            fail(`the age went from ${seen.started} to ${seen.later} Ma — play is running backwards`);
        }
    });

    await step('returning to the present restores the present', async () => {
        await setAge(page, 0);
        const back = await worldCentre(page, SOURCE);
        const drift = Math.hypot(back.x - present.x, back.y - present.y);
        if (drift > 1e-6) fail(`the world did not come back (${drift} degrees adrift)`);
        if (back.features !== present.features) {
            fail(`${back.features} features back at present day, was ${present.features}`);
        }
    });

    await step('closing the tool takes its layer but leaves the age standing', async () => {
        await setAge(page, 180);
        await page.evaluate(() => {
            document.querySelector('webmapx-paleotime-tool').deactivate();
        });
        await new Promise((resolve) => setTimeout(resolve, 500));
        const left = await page.evaluate(async () => {
            const adapter = await document.querySelector('webmapx-map').getAdapterAsync();
            return {
                layer: Boolean(adapter.store.getState().mapLayers['paleotime-coastlines']),
                ma: adapter.store.getState().paleoTimeMa,
            };
        });
        if (left.layer) fail('the coastline layer outlived the tool');
        // Closing the panel is how you get the map to yourself — to click a
        // coastline with the info tool. Snapping back to the present would undo
        // the thing you closed the panel to look at.
        if (left.ma !== 180) fail(`the age was reset to ${left.ma} when the tool closed`);
    });

    await step('reopening it resumes at the age the map stands at', async () => {
        const resumed = await page.evaluate(async () => {
            const tool = document.querySelector('webmapx-paleotime-tool');
            tool.active = true;
            await new Promise((r) => setTimeout(r, 3000));
            const adapter = await document.querySelector('webmapx-map').getAdapterAsync();
            return adapter.store.getState().paleoTimeMa;
        });
        if (resumed !== 180) fail(`reopening moved the age to ${resumed}`);
        await page.evaluate(() => document.querySelector('webmapx-paleotime-tool').deactivate());
        await new Promise((resolve) => setTimeout(resolve, 500));
    });

    // ── The layer on its own ────────────────────────────────────────────
    //
    // The data is a plain computed source, so it has to work as an ordinary
    // catalog layer with no tool involved — that is the point of putting it
    // behind `internalfunc://` instead of inside the tool. It resolves here as
    // well as at the application root because the directory is resolved against
    // the *config*, not the page.
    await step('the catalog layer draws coastlines with no tool involved', async () => {
        await page.evaluate(async () => {
            const map = document.querySelector('webmapx-map');
            const adapter = await map.getAdapterAsync();
            adapter.store.dispatch({ paleoTimeMa: 150 }, 'UI');
            await map.addLayerRequest({ layerId: 'paleo-coastlines' });
        });
        await waitFor(page, 60_000, async () => {
            const adapter = await document.querySelector('webmapx-map').getAdapterAsync();
            return Boolean(adapter.getSourceData('paleo-coastlines-source')?.features?.length);
        }, 'the catalog layer to draw');
    });

    await step('the tool draws no second copy over it', async () => {
        const own = await page.evaluate(async () => {
            const adapter = await document.querySelector('webmapx-map').getAdapterAsync();
            const tool = document.querySelector('webmapx-paleotime-tool');
            tool.active = true;
            await new Promise((r) => setTimeout(r, 4000));
            return Boolean(adapter.store.getState().mapLayers['paleotime-coastlines']);
        });
        if (own) fail('the tool added its own layer on top of the catalog one');
    });

    await step('and closing it leaves the catalog layer alone', async () => {
        const kept = await page.evaluate(async () => {
            const adapter = await document.querySelector('webmapx-map').getAdapterAsync();
            document.querySelector('webmapx-paleotime-tool').deactivate();
            await new Promise((r) => setTimeout(r, 800));
            return Boolean(adapter.store.getState().mapLayers['paleo-coastlines']);
        });
        if (!kept) fail('the tool removed a layer it did not add');
    });
}
