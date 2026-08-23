import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdir } from 'node:fs/promises';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCREENSHOT_DIR = path.resolve(__dirname, '../temp/screenshots');

function fail(message) {
    throw new Error(message);
}

async function waitForMapReady(page) {
    await page.waitForFunction(async () => {
        const map = document.querySelector('webmapx-map');
        if (!map || typeof map.getAdapterAsync !== 'function') return false;
        const adapter = await map.getAdapterAsync();
        return Boolean(adapter);
    }, undefined, { timeout: 45_000 });
}

async function screenshot(page, name) {
    await mkdir(SCREENSHOT_DIR, { recursive: true });
    const file = path.join(SCREENSHOT_DIR, `${name}.png`);
    await page.screenshot({ path: file, fullPage: false });
    return file;
}

/** Create a draw layer with rich attribute schema and draw one point feature. */
async function setupDrawLayer(page) {
    // Toolbar buttons exist once the config is applied, but the tool component behind them
    // loads lazily — wait for it rather than assuming map-ready implies toolbar-fully-built.
    await page.waitForFunction(() => {
        return Boolean(document.querySelector('webmapx-toolbar sl-button[name="draw"]'))
            && customElements.get('webmapx-draw-tool') !== undefined;
    }, undefined, { timeout: 15_000 });

    // Activate draw tool
    await page.evaluate(() => {
        const btn = document.querySelector('webmapx-toolbar sl-button[name="draw"]');
        if (!btn) throw new Error('Draw toolbar button not found');
        btn.click();
    });
    await page.waitForFunction(() => {
        const tool = document.querySelector('webmapx-map')?.querySelector('webmapx-draw-tool');
        return Boolean(tool?.active);
    }, undefined, { timeout: 10_000 });

    // Dispatch layer-confirm directly with special attribute types
    await page.evaluate(() => {
        const tool = document.querySelector('webmapx-draw-tool');
        const dialog = tool?.shadowRoot?.querySelector('webmapx-draw-layer-dialog');
        if (!dialog) throw new Error('Draw layer dialog not found');

        // Click draw-point button first to open dialog
        const btn = tool.shadowRoot.querySelector('sl-icon-button[name="geo-fill"]');
        if (!btn) throw new Error('Point draw button not found');
        btn.click();
    });

    // The dialog escapes to document.body when it opens (an ancestor's
    // backdrop-filter would otherwise trap this position:fixed element), so it
    // is no longer inside the tool's shadow root by the time it is showing.
    await page.waitForFunction(() => {
        const dialogRoot = document.querySelector('webmapx-draw-layer-dialog')?.shadowRoot;
        return Boolean(dialogRoot?.querySelector('.layer-option'));
    }, undefined, { timeout: 5_000 });

    await page.evaluate(() => {
        const tool = document.querySelector('webmapx-draw-tool');
        const dialog = document.querySelector('webmapx-draw-layer-dialog')
            ?? tool?.shadowRoot?.querySelector('webmapx-draw-layer-dialog');
        if (!dialog) throw new Error('Dialog not found');
        dialog.dispatchEvent(new CustomEvent('webmapx-draw-layer-confirm', {
            detail: {
                id: 'info-test-layer',
                name: 'info-test',
                type: 'Point',
                color: '#0f62fe',
                properties: [
                    { name: 'id',      type: 'number' },
                    { name: 'link',    type: 'linkURL' },
                    { name: 'image',   type: 'imageURL' },
                    { name: 'created', type: 'create-time' },
                    { name: 'updated', type: 'update-time' },
                ],
            },
            bubbles: true,
            composed: true,
        }));
    });

    await page.waitForFunction(() => {
        const tool = document.querySelector('webmapx-draw-tool');
        return Boolean(tool?.activeLayerIds?.Point);
    }, undefined, { timeout: 10_000 });

    // Draw a point at map center
    await page.evaluate(async () => {
        const map = document.querySelector('webmapx-map');
        const adapter = await map?.getAdapterAsync?.();
        if (!adapter) throw new Error('Adapter unavailable');
        const center = adapter.getViewportState().center;
        adapter.events.emit({ type: 'click', coords: center, pixel: adapter.project(center), resolution: null });
    });

    await page.waitForFunction(() => {
        const tool = document.querySelector('webmapx-draw-tool');
        return Array.isArray(tool?.features) && tool.features.length >= 1;
    }, undefined, { timeout: 10_000 });

    // Set link and image attribute values on the drawn feature
    await page.evaluate(() => {
        const tool = document.querySelector('webmapx-draw-tool');
        const feature = tool?.features?.[tool.features.length - 1];
        if (!feature) throw new Error('No feature found');
        feature.properties['link'] = 'https://www.arcgis.com/sharing/rest/content/items/test';
        // Use an SVG data URI so the image loads visibly in headless
        feature.properties['image'] = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='40'%3E%3Crect width='60' height='40' fill='%230f62fe'/%3E%3C/svg%3E";
        tool.features = [...tool.features];
        tool.refreshDrawLayerSource?.(feature.layerId);
    });

    // Close draw tool so features are written to perm source
    await page.evaluate(() => {
        document.querySelector('webmapx-toolbar sl-button[name="draw"]')?.click();
    });
    await page.waitForFunction(() => {
        const tool = document.querySelector('webmapx-draw-tool');
        return Boolean(tool && !tool.active);
    }, undefined, { timeout: 10_000 });
}

async function openInfoToolAndClickFeature(page) {
    // Activate info tool
    await page.evaluate(() => {
        const btn = document.querySelector('webmapx-toolbar sl-button[name="info"]');
        if (!btn) throw new Error('Info toolbar button not found');
        btn.click();
    });
    await page.waitForFunction(() => {
        const tool = document.querySelector('webmapx-info-tool');
        return Boolean(tool?.active);
    }, undefined, { timeout: 10_000 });

    // Click at map center to pin the info tool
    await page.evaluate(async () => {
        const map = document.querySelector('webmapx-map');
        const adapter = await map?.getAdapterAsync?.();
        if (!adapter) throw new Error('Adapter unavailable');
        const center = adapter.getViewportState().center;
        adapter.events.emit({ type: 'click', coords: center, pixel: adapter.project(center), resolution: null });
    });

    // Wait for features to appear in info tool
    await page.waitForFunction(() => {
        const tool = document.querySelector('webmapx-info-tool');
        return tool?.shadowRoot?.querySelector('.props-list') != null;
    }, undefined, { timeout: 10_000 });
}

async function assertInfoRendering(page) {
    return page.evaluate(() => {
        const root = document.querySelector('webmapx-info-tool')?.shadowRoot;
        if (!root) return { ok: false, reason: 'no shadow root' };

        const list = root.querySelector('.props-list');
        if (!list) return { ok: false, reason: 'no .props-list' };

        const link = list.querySelector('a[href]');
        if (!link) return { ok: false, reason: 'no <a href> found — linkURL not rendered as link' };

        const img = list.querySelector('img');
        if (!img) return { ok: false, reason: 'no <img> found — imageURL not rendered as image' };

        // Check time values are date strings, not raw numbers
        const rows = Array.from(list.querySelectorAll('.props-row'));
        for (const row of rows) {
            const key = row.querySelector('.props-key')?.textContent?.trim();
            const val = row.querySelector('.props-val')?.textContent?.trim();
            if ((key === 'created' || key === 'updated') && val) {
                if (/^\d{10,}$/.test(val)) {
                    return { ok: false, reason: `${key} shows raw timestamp "${val}", expected formatted date` };
                }
            }
        }

        return { ok: true };
    });
}

export async function run({ page, engine }) {
    const step = async (label, fn) => {
        try {
            await fn();
        } catch (error) {
            const msg = error instanceof Error ? error.message : String(error);
            throw new Error(`${label}: ${msg}`, { cause: error });
        }
    };

    await step('wait map ready', () => waitForMapReady(page));

    await step('setup draw layer with special attribute types', () => setupDrawLayer(page));

    await step('open info tool and click feature', () => openInfoToolAndClickFeature(page));

    const screenshotPath = await screenshot(page, `info-tool-${engine}`);
    process.stdout.write(`  screenshot: ${screenshotPath}\n`);

    const result = await assertInfoRendering(page);
    if (!result.ok) fail(result.reason);
}

export const engines = ['maplibre'];
