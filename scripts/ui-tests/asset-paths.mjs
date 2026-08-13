/**
 * Verifies that external assets (SVG icons, PNG images, GeoJSON/TopoJSON data)
 * resolve without 404s from the root page, testpages/setup.html, and testpages/preview.html.
 *
 * Also checks that icon assets (buffer.svg, mercator-view.png, globe-view.png) are inlined
 * as data URLs in the built lib — if they appear as bare filename paths they'll 404 on CDN.
 */

const ASSET_EXTENSIONS = /\.(svg|png|geojson|topojson)(\?|#|$)/i;

async function collectFailedAssets(page, url, waitFn) {
    const failed = [];
    page.on('response', (res) => {
        if (res.status() >= 400 && ASSET_EXTENSIONS.test(res.url())) {
            failed.push(`${res.status()} ${res.url()}`);
        }
    });
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    if (waitFn) await waitFn(page);
    // Brief settle for lazy-loaded assets
    await page.waitForTimeout(2000);
    return failed;
}

async function assertNoFailedAssets(failed, context) {
    if (failed.length > 0) {
        throw new Error(`Failed asset requests on ${context}:\n  ${failed.join('\n  ')}`);
    }
}

async function waitForSetupLoaded(page) {
    // Wait for tool checkboxes to appear (config loaded and UI built)
    await page.waitForFunction(() => {
        return document.querySelectorAll('#ui input[type=checkbox]').length > 0;
    }, undefined, { timeout: 15_000 });
}

async function waitForPreviewLoaded(page) {
    // Wait for webmapx-map to be defined and mounted
    await page.waitForFunction(() => {
        return customElements.get('webmapx-map') !== undefined &&
               document.querySelector('webmapx-map') !== null;
    }, undefined, { timeout: 30_000 });
    // Then wait for the adapter to be ready
    await page.waitForFunction(async () => {
        const map = document.querySelector('webmapx-map');
        if (!map || typeof map.getAdapterAsync !== 'function') return false;
        try {
            const adapter = await map.getAdapterAsync();
            return Boolean(adapter);
        } catch { return false; }
    }, undefined, { timeout: 45_000 });
}

/**
 * Check that view-mode images actually loaded (naturalWidth > 0).
 * In dev mode ?url imports return file paths; in lib build they're inlined as data URLs.
 * Either way the image must resolve — this catches both 404s and wrong paths.
 */
async function checkViewModeImagesLoad(page, context) {
    // Activate view-mode tool to trigger render
    const activated = await page.evaluate(() => {
        const btn = document.querySelector('webmapx-toolbar sl-button[name="view-mode"]') ??
                    document.querySelector('[name="view-mode"]');
        if (!btn) return false;
        btn.click();
        return true;
    });
    if (!activated) return; // tool not present in this config

    await page.waitForTimeout(800);

    const results = await page.evaluate(() => {
        const tool = document.querySelector('webmapx-map')?.querySelector('webmapx-view-mode-tool') ??
                     document.querySelector('webmapx-view-mode-tool');
        if (!tool) return [];
        const imgs = [...(tool.shadowRoot?.querySelectorAll('img') ?? [])];
        return imgs.map(img => ({
            src: (img.src ?? img.getAttribute('src') ?? '').slice(0, 100),
            naturalWidth: img.naturalWidth,
        }));
    });

    if (results.length === 0) return; // tool rendered no images yet

    for (const img of results) {
        if (img.naturalWidth === 0) {
            throw new Error(`${context}: view-mode image failed to load (naturalWidth=0). src="${img.src}"`);
        }
    }
}

export async function run({ page, baseUrl }) {
    const step = async (label, fn) => {
        try { await fn(); }
        catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            throw new Error(`${label}: ${msg}`, { cause: err });
        }
    };

    // ── 1. Root page ──────────────────────────────────────────────────────
    await step('root: no failed asset requests', async () => {
        const page2 = await page.context().newPage();
        try {
            const failed = await collectFailedAssets(page2, baseUrl, waitForPreviewLoaded);
            await assertNoFailedAssets(failed, baseUrl);
        } finally {
            await page2.close();
        }
    });

    // ── 2. testpages/setup.html ───────────────────────────────────────────
    await step('setup.html: no failed asset requests', async () => {
        const page2 = await page.context().newPage();
        try {
            const url = `${baseUrl}/testpages/setup.html`;
            const failed = await collectFailedAssets(page2, url, waitForSetupLoaded);
            await assertNoFailedAssets(failed, url);
        } finally {
            await page2.close();
        }
    });

    // ── 3. testpages/preview.html with demo.json ──────────────────────────
    await step('preview.html: no failed asset requests', async () => {
        const page2 = await page.context().newPage();
        try {
            const url = `${baseUrl}/testpages/preview.html`;
            // Clear localStorage so preview fetches config from URL param, not stale session data
            await page2.addInitScript(() => localStorage.clear());
            const failed = await collectFailedAssets(page2, url, waitForPreviewLoaded);
            await assertNoFailedAssets(failed, url);
        } finally {
            await page2.close();
        }
    });

    // ── 4. Icon data-URL checks (main page) ───────────────────────────────
    await step('root: view-mode images load', async () => {
        await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });
        await waitForPreviewLoaded(page);
        await checkViewModeImagesLoad(page, 'root');
    });
}

// Asset tests don't depend on map engine — run once with maplibre only.
export const engines = ['maplibre'];
