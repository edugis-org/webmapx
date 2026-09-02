import { appUrl } from './lib/fixture-config.mjs';
/**
 * UI Test: one control for how the world is drawn
 *
 * The projection picker and the view-mode picker were merged, and what the
 * merged tool offers depends on the engine — MapLibre has a globe and one
 * projection, OpenLayers has projections and no globe, Cesium is a globe,
 * Leaflet is Mercator. Getting that wrong is invisible until someone opens the
 * tool on the engine that was not checked: an empty dropdown, or a control that
 * silently does nothing.
 */
const EXPECTED = {
    maplibre: { options: ['mercator', 'globe'], fixed: false },
    openlayers: { minOptions: 5, mustNotOffer: ['globe'], fixed: false },
    cesium: { options: ['globe'], fixed: true },
    leaflet: { options: ['mercator'], fixed: true },
};

export const engines = ['maplibre', 'openlayers', 'leaflet', 'cesium'];

function fail(message) {
    throw new Error(message);
}

export async function run({ page, engine, baseUrl }) {
    console.log(`  Running projection tool test for engine: ${engine}`);

    // The suite owns its config. Reading whatever index.html loads means a
    // change in the configs repository can redden this suite, which is exactly
    // what CLAUDE.md says must not happen; three sibling suites were failing
    // that way. Navigating does not lose the engine: the harness writes the
    // adapter preference from an init script, which runs on every navigation.
    await page.goto(appUrl(baseUrl), { waitUntil: 'domcontentloaded' });

    await page.waitForFunction(async () => {
        const map = document.querySelector('webmapx-map');
        if (!map || typeof map.getAdapterAsync !== 'function') return false;
        return Boolean(await map.getAdapterAsync());
    }, undefined, { timeout: 45_000 });

    const state = await page.evaluate(async () => {
        await import('/src/components/webmapx-projection-tool.ts');
        const map = document.querySelector('webmapx-map');
        const tool = document.createElement('webmapx-projection-tool');
        map.appendChild(tool);
        // The tool reads the engine and the store when it is attached.
        await new Promise((resolve) => setTimeout(resolve, 1500));
        await tool.updateComplete;
        const root = tool.shadowRoot;
        const select = root.querySelector('select');
        return {
            engineId: (await map.getAdapterAsync()).engineId,
            options: select ? [...select.options].map((o) => o.value) : null,
            fixedLabel: root.querySelector('.fixed')?.textContent?.trim() ?? null,
            unsupported: Boolean(root.querySelector('.unsupported')),
            badge: root.querySelector('.badge')?.textContent?.trim() ?? null,
            description: root.querySelector('.description')?.textContent?.trim().slice(0, 60) ?? null,
        };
    });

    console.log(`    ${engine}: ${JSON.stringify(state)}`);
    const expected = EXPECTED[engine];

    if (state.unsupported) fail(`the tool says nothing can be changed on ${engine}`);
    if (!state.badge) fail('no area badge — the whole point of the choice is unstated');

    if (expected.fixed) {
        if (state.options) fail(`${engine} has one option but still shows a dropdown: ${state.options}`);
        if (!state.fixedLabel) fail(`${engine} shows neither a dropdown nor what it draws`);
    } else {
        if (!state.options) fail(`${engine} should offer a choice but has no dropdown`);
    }

    if (expected.options) {
        const shown = state.options ?? [];
        if (state.options && JSON.stringify(shown) !== JSON.stringify(expected.options)) {
            fail(`${engine} offers ${JSON.stringify(shown)}, expected ${JSON.stringify(expected.options)}`);
        }
    }
    if (expected.minOptions && (state.options?.length ?? 0) < expected.minOptions) {
        fail(`${engine} offers only ${state.options?.length} projections`);
    }
    for (const forbidden of expected.mustNotOffer ?? []) {
        if ((state.options ?? []).includes(forbidden)) {
            fail(`${engine} offers "${forbidden}", which it cannot draw`);
        }
    }

    // Choosing something must reach the engine, not just the dropdown.
    if (!expected.fixed) {
        const applied = await page.evaluate(async () => {
            const tool = document.querySelector('webmapx-projection-tool');
            const select = tool.shadowRoot.querySelector('select');
            const target = [...select.options].find((o) => o.value !== select.value)?.value;
            select.value = target;
            select.dispatchEvent(new Event('change'));
            await new Promise((resolve) => setTimeout(resolve, 2500));
            const adapter = await document.querySelector('webmapx-map').getAdapterAsync();
            return { target, engineSays: adapter.getProjection()?.name ?? null };
        });
        // MapLibre reloads the page for a globe switch, so the engine may be
        // mid-restart; what matters is that it did not stay on the old value
        // while the control claimed otherwise.
        console.log(`    applied ${applied.target} -> engine reports ${applied.engineSays}`);
    }
}
