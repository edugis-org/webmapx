// The street photos tool against a faked Panoramax, so the suite never depends
// on Panoramax being up: a click asks for photos *of* that spot, the photo
// comes with its maker and licence, enlarges with the keyboard, Escape closes
// only the enlarged view, and an empty answer or an outage says so plainly.
import { appUrl } from './lib/fixture-config.mjs';

function fail(message) {
    throw new Error(message);
}

// A 3×2 grey JPEG-sized PNG; the test checks wiring, not pictures.
const PNG = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAMAAAACCAYAAACddGYaAAAAEUlEQVR4nGNgYGD4z8DAwMAAAAkAAX4dVHQAAAAASUVORK5CYII=',
    'base64'
);

const ANSWER = {
    type: 'FeatureCollection',
    features: [{
        id: 'test-photo-1',
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [4.8898, 52.3701] },
        links: [
            { rel: 'license', href: 'https://creativecommons.org/licenses/by-sa/4.0/' },
            { rel: 'via', href: 'https://nl.panoramax.xyz' },
        ],
        assets: {
            sd: { href: 'https://nl.panoramax.xyz/derivates/test/sd.jpg' },
            thumb: { href: 'https://nl.panoramax.xyz/derivates/test/thumb.jpg' },
        },
        properties: { datetime: '2025-01-09T12:02:23+00:00', license: 'CC-BY-SA-4.0' },
        providers: [{ name: 'City of Amsterdam', roles: ['producer'] }],
    }],
};

async function waitForMapReady(page) {
    await page.waitForFunction(async () => {
        const map = document.querySelector('webmapx-map');
        if (!map || typeof map.getAdapterAsync !== 'function') return false;
        return Boolean(await map.getAdapterAsync());
    }, undefined, { timeout: 45_000 });
}

async function clickMapCenter(page) {
    await page.evaluate(async () => {
        const adapter = await document.querySelector('webmapx-map').getAdapterAsync();
        const center = adapter.getViewportState().center;
        adapter.events.emit({ type: 'click', coords: center, pixel: adapter.project(center), resolution: null });
    });
}


export async function run({ page, baseUrl }) {
    let mode = 'photo';
    const searches = [];
    await page.route('https://api.panoramax.xyz/api/search**', (route) => {
        searches.push(route.request().url());
        if (mode === 'down') return route.fulfill({ status: 503, body: 'down' });
        return route.fulfill({
            contentType: 'application/json',
            body: JSON.stringify(mode === 'none' ? { type: 'FeatureCollection', features: [] } : ANSWER),
        });
    });
    await page.route('https://nl.panoramax.xyz/**', (route) => route.fulfill({ contentType: 'image/png', body: PNG }));

    await page.goto(appUrl(baseUrl), { waitUntil: 'domcontentloaded' });
    await waitForMapReady(page);

    // Toolbar tools load lazily: a click before the element is defined is lost.
    await page.waitForFunction(() => customElements.get('webmapx-panoramax-tool')
        && document.querySelector('webmapx-toolbar sl-button[name="panoramax"]'), undefined, { timeout: 20_000 });
    await page.evaluate(() => document.querySelector('webmapx-toolbar sl-button[name="panoramax"]').click());
    await page.waitForFunction(() => document.querySelector('webmapx-panoramax-tool')?.active, undefined, { timeout: 10_000 })
        .catch(() => fail('the Street photos button did not open the tool'));

    // A photo of the clicked spot, with its credit and licence.
    await clickMapCenter(page);
    await page.waitForFunction(() => document.querySelector('webmapx-panoramax-tool').shadowRoot.querySelector('.thumb-button img'),
        undefined, { timeout: 10_000 }).catch(() => fail('no photo shown after a click'));

    const search = new URL(searches.at(-1));
    if (!search.searchParams.get('place_position')) fail(`search did not ask for photos of the spot: ${search}`);

    const shown = await page.evaluate(() => {
        const root = document.querySelector('webmapx-panoramax-tool').shadowRoot;
        const open = root.querySelector('.panoramax > div > sl-button[href]');
        return {
            credit: root.querySelector('.credit')?.textContent.replace(/\s+/g, ' ').trim(),
            licenceHref: root.querySelector('.credit a')?.getAttribute('href'),
            openHref: open?.getAttribute('href'),
            openTarget: open?.getAttribute('target'),
        };
    });
    if (!shown.credit?.includes('City of Amsterdam')) fail(`credit "${shown.credit}" does not name the maker`);
    if (!shown.credit?.includes('CC-BY-SA-4.0') || !shown.licenceHref) fail('the licence is not shown with a link');
    if (!shown.openHref?.includes('pic=test-photo-1') || shown.openTarget !== '_blank') {
        fail(`"Open in Panoramax" goes to ${shown.openHref} (target ${shown.openTarget})`);
    }

    // Enlarge with the keyboard; Escape closes the enlarged view only.
    await page.evaluate(() => document.querySelector('webmapx-panoramax-tool').shadowRoot.querySelector('.thumb-button').focus());
    await page.keyboard.press('Enter');
    if (!await page.evaluate(() => document.querySelector('webmapx-panoramax-tool').shadowRoot.querySelector('dialog').open)) {
        fail('Enter on the photo did not enlarge it');
    }
    await page.keyboard.press('Escape');
    const afterEscape = await page.evaluate(() => {
        const t = document.querySelector('webmapx-panoramax-tool');
        return { dialog: t.shadowRoot.querySelector('dialog').open, active: t.active, focus: t.shadowRoot.activeElement?.className };
    });
    if (afterEscape.dialog) fail('Escape did not close the enlarged photo');
    if (!afterEscape.active) fail('Escape closed the panel as well as the enlarged photo');
    if (afterEscape.focus !== 'thumb-button') fail(`focus went to "${afterEscape.focus}" after closing, expected the photo`);

    // Nothing nearby, and Panoramax down: both said plainly.
    mode = 'none';
    await clickMapCenter(page);
    await page.waitForFunction(() => /No street photos here/.test(document.querySelector('webmapx-panoramax-tool').shadowRoot.textContent),
        undefined, { timeout: 10_000 }).catch(() => fail('an empty answer was not reported'));
    mode = 'down';
    await clickMapCenter(page);
    await page.waitForFunction(() => /could not be reached/.test(document.querySelector('webmapx-panoramax-tool').shadowRoot.textContent),
        undefined, { timeout: 10_000 }).catch(() => fail('an outage was not reported'));

}

export const engines = ['maplibre', 'openlayers', 'leaflet', 'cesium'];
