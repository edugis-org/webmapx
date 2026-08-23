/**
 * UI Test: a computed layer that keeps itself current
 *
 * The subsolar point moves 464 m/s, so a day/night layer drawn once is wrong
 * within seconds at street zoom and unchanged for minutes at world zoom. This
 * checks the three things that can each fail silently: that the data actually
 * changes while the layer sits there, that it changes *faster when zoomed in*,
 * and that the ticking stops when the layer is removed — a refresher that
 * outlives its layer is invisible until the battery is gone.
 */
const LAYER = 'sunposition-computed';

export const engines = ['maplibre', 'openlayers'];

function fail(message) {
    throw new Error(message);
}

async function sunLongitude(page) {
    return page.evaluate(async () => {
        const adapter = await document.querySelector('webmapx-map').getAdapterAsync();
        const data = adapter.getSourceData('sunposition-computed-source')
            ?? adapter.getSourceData('sunposition-computed:sunposition-computed-source');
        return data?.features?.[0]?.geometry?.coordinates?.[0] ?? null;
    });
}

export async function run({ page, engine, baseUrl }) {
    console.log(`  Running computed-layer refresh test for engine: ${engine}`);

    await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(async () => {
        const map = document.querySelector('webmapx-map');
        if (!map || typeof map.getAdapterAsync !== 'function') return false;
        return Boolean(await map.getAdapterAsync());
    }, undefined, { timeout: 45_000 });

    const step = async (label, fn) => {
        try {
            await fn();
            console.log(`    ✓ ${label}`);
        } catch (error) {
            throw new Error(`${label}: ${error instanceof Error ? error.message : String(error)}`, { cause: error });
        }
    };

    await step('the layer draws where the sun is now', async () => {
        const added = await page.evaluate(async (id) => {
            const map = document.querySelector('webmapx-map');
            const ok = await map.addLayerRequest({ layerId: id });
            const adapter = await map.getAdapterAsync();
            // Street zoom: the terminator crosses a pixel every ~20ms here.
            adapter.setViewport([0, 0], 14);
            return ok;
        }, LAYER);
        if (!added) fail('the computed sun layer was not added');
        if (await sunLongitude(page) === null) fail('the layer has no data');
    });

    await step('zoomed in, the position keeps up with the sun', async () => {
        const before = await sunLongitude(page);
        await new Promise((resolve) => setTimeout(resolve, 3000));
        const after = await sunLongitude(page);
        // Three seconds of Earth rotation is 0.0125 degrees — small, but the
        // point is that it moved at all without anything being touched.
        const moved = Math.abs(after - before);
        if (moved === 0) fail('the sun stood still while the map was open');
        if (moved > 1) fail(`the sun jumped ${moved} degrees in three seconds`);
    });

    await step('zoomed out, it redraws far less often', async () => {
        // The rate is the point, not the absence of updates: at z0 a pixel of
        // movement takes five and a half minutes, at z14 twenty milliseconds.
        const count = async () => page.evaluate(async () => {
            const adapter = await document.querySelector('webmapx-map').getAdapterAsync();
            const read = () => adapter.getSourceData('sunposition-computed-source')
                ?.features?.[0]?.geometry?.coordinates?.[0] ?? null;
            let changes = 0;
            let last = read();
            const until = performance.now() + 2500;
            while (performance.now() < until) {
                await new Promise((resolve) => setTimeout(resolve, 50));
                const now = read();
                if (now !== last) { changes += 1; last = now; }
            }
            return changes;
        });

        const zoomed = await count();
        await page.evaluate(async () => {
            const adapter = await document.querySelector('webmapx-map').getAdapterAsync();
            adapter.setViewport([0, 0], 0);
        });
        // Let the camera settle: while it animates the old zoom still applies.
        await new Promise((resolve) => setTimeout(resolve, 1500));
        const world = await count();

        if (zoomed < 5) fail(`only ${zoomed} redraws in 2.5s at z14`);
        if (world > 1) fail(`${world} redraws in 2.5s at z0, where one pixel takes minutes`);
    });

    await step('removing the layer stops the refreshing', async () => {
        const stopped = await page.evaluate(async (id) => {
            const adapter = await document.querySelector('webmapx-map').getAdapterAsync();
            adapter.removeLayer(id);
            await new Promise((resolve) => setTimeout(resolve, 500));
            // Nothing left to update, and nothing left to update it with.
            return {
                gone: !adapter.store.getState().mapLayers[id],
                source: adapter.getSourceData('sunposition-computed-source'),
            };
        }, LAYER);
        if (!stopped.gone) fail('the layer is still there');
        if (stopped.source) fail('the source outlived the layer');
    });
}
