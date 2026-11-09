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


/** Engines that draw vector tiles, and so the coverage map. */
const COVERAGE_ENGINES = ['maplibre', 'openlayers'];

async function hasCoverage(page) {
    return page.evaluate(async () => {
        const adapter = await document.querySelector('webmapx-map').getAdapterAsync();
        return adapter.hasLayer('panoramax-coverage') || Boolean(adapter.store.getState().mapLayers['panoramax-coverage']);
    });
}

function answerFor(mode) {
    if (mode === 'none') return { type: 'FeatureCollection', features: [] };
    if (mode !== '360') return ANSWER;
    const answer = structuredClone(ANSWER);
    answer.features[0].properties['pers:interior_orientation'] = { field_of_view: 360 };
    answer.features[0].properties['view:azimuth'] = 20;
    return answer;
}

/**
 * With a Google key the panel offers Google Street View: chosen with the
 * keyboard, it takes the Panoramax coverage away, asks Google whether there is
 * imagery near a click before fetching any image, credits Google with the
 * month taken, enlarges the flat view, and links to Google Maps. Nothing
 * there and a refused key each say so; back on Panoramax the coverage returns.
 */
async function assertGoogle(page, { coverage, googleAnswer, googleSearches, imageRequests }) {
    const sourceGroup = await page.evaluate(() => {
        const group = document.querySelector('webmapx-street-photos-tool').shadowRoot.querySelectorAll('sl-radio-group')[0];
        return group?.getAttribute('label');
    });
    if (sourceGroup !== 'Photos from') fail(`with a Google key the first choice is "${sourceGroup}", expected "Photos from"`);

    await page.evaluate(() => document.querySelector('webmapx-street-photos-tool').shadowRoot
        .querySelector('sl-radio-button[value="panoramax"]').focus());
    await page.keyboard.press('ArrowRight');
    await page.waitForFunction(() => document.querySelector('webmapx-street-photos-tool').source === 'google',
        undefined, { timeout: 5_000 }).catch(() => fail('the keyboard did not choose Google Street View'));
    if (await hasCoverage(page)) fail('the Panoramax coverage stayed on the map with Google chosen');
    if (await page.evaluate(() => [...document.querySelector('webmapx-street-photos-tool').shadowRoot.querySelectorAll('sl-radio-group')]
        .some((g) => g.getAttribute('label') === 'Colour by'))) {
        fail('"Colour by" is offered with Google, which has no coverage to colour');
    }
    const tip = await page.evaluate(() => document.querySelector('webmapx-street-photos-tool').toolTip);
    if (!/Google Street View/.test(tip)) fail(`with Google the tip reads "${tip}"`);

    googleAnswer('ok');
    const imagesBefore = imageRequests.length;
    await clickMapCenter(page);
    await page.waitForFunction(() => document.querySelector('webmapx-street-photos-tool').shadowRoot.querySelector('.thumb-button img'),
        undefined, { timeout: 10_000 }).catch(() => fail('Google: no photo shown after a click'));
    const metadata = new URL(googleSearches.at(-1));
    if (!metadata.searchParams.get('location') || metadata.searchParams.get('source') !== 'outdoor') {
        fail(`Google was asked ${metadata} instead of for outdoor imagery near the spot`);
    }
    await page.waitForTimeout(300);
    if (imageRequests.length === imagesBefore) fail('Google: no image was requested for a found panorama');

    const shown = await page.evaluate(() => {
        const r = document.querySelector('webmapx-street-photos-tool').shadowRoot;
        return {
            credit: r.querySelector('.credit')?.textContent.replace(/\s+/g, ' ').trim(),
            enlarge: r.querySelector('sl-button.enlarge')?.textContent.trim(),
            open: r.querySelector('dialog sl-button[href]'),
        };
    });
    if (!/Google/.test(shown.credit ?? '') || !/2023/.test(shown.credit ?? '') || /\b1\b/.test(shown.credit ?? '')) {
        fail(`Google credit "${shown.credit}" should name Google and the month taken, not a day`);
    }
    if (shown.enlarge !== 'Open larger picture') fail(`Google: the panel button reads "${shown.enlarge}"`);

    await page.evaluate(() => document.querySelector('webmapx-street-photos-tool').shadowRoot.querySelector('sl-button.enlarge').click());
    const dialog = await page.evaluate(() => {
        const r = document.querySelector('webmapx-street-photos-tool').shadowRoot;
        const open = r.querySelector('dialog sl-button[href]');
        return {
            open: r.querySelector('dialog').open,
            flat: Boolean(r.querySelector('dialog img.large')),
            href: open?.getAttribute('href'),
            label: open?.textContent.trim(),
        };
    });
    if (!dialog.open || !dialog.flat) fail('Google: "Open larger picture" did not show the larger image');
    if (!dialog.href?.includes('pano=PANO-1') || !/Google Street View/.test(dialog.label ?? '')) {
        fail(`Google: the enlarged view links to ${dialog.href} as "${dialog.label}"`);
    }
    await page.keyboard.press('Escape');

    googleAnswer('none');
    await clickMapCenter(page);
    await page.waitForFunction(() => /No street photos here/.test(document.querySelector('webmapx-street-photos-tool').shadowRoot.textContent),
        undefined, { timeout: 10_000 }).catch(() => fail('Google: no imagery was not reported'));
    googleAnswer('denied');
    await clickMapCenter(page);
    await page.waitForFunction(() => /REQUEST_DENIED/.test(document.querySelector('webmapx-street-photos-tool').shadowRoot.textContent),
        undefined, { timeout: 10_000 }).catch(() => fail('Google: a refused key was not reported with its reason'));

    // Back to Panoramax: its coverage returns where the engine can draw it.
    await page.evaluate(() => document.querySelector('webmapx-street-photos-tool').shadowRoot
        .querySelector('sl-radio-button[value="panoramax"]').click());
    if (coverage) {
        await page.waitForFunction(async () => (await document.querySelector('webmapx-map').getAdapterAsync()).hasLayer('panoramax-coverage'),
            undefined, { timeout: 10_000 }).catch(() => fail('choosing Panoramax again did not bring the coverage back'));
    }
}

export async function run({ page, engine, baseUrl }) {
    let mode = 'photo';
    const searches = [];
    await page.route('https://api.panoramax.xyz/api/search**', (route) => {
        searches.push(route.request().url());
        if (mode === 'down') return route.fulfill({ status: 503, body: 'down' });
        return route.fulfill({ contentType: 'application/json', body: JSON.stringify(answerFor(mode)) });
    });
    // No coverage tiles in CI: an empty tile is a valid answer.
    await page.route('https://api.panoramax.xyz/api/map/**', (route) => route.fulfill({ status: 204 }));
    // The panorama viewer loads its image as a WebGL texture, which needs CORS.
    await page.route('https://nl.panoramax.xyz/**', (route) => route.fulfill({
        contentType: 'image/png', body: PNG, headers: { 'Access-Control-Allow-Origin': '*' },
    }));

    // Google, as faked: the fixture's key is not a real one.
    let googleMode = 'ok';
    const googleSearches = [];
    const imageRequests = [];
    await page.route('https://maps.googleapis.com/maps/api/streetview/metadata**', (route) => {
        googleSearches.push(route.request().url());
        const answers = {
            ok: { status: 'OK', pano_id: 'PANO-1', location: { lat: 52.3698, lng: 4.8900 }, date: '2023-05', copyright: '© Google' },
            none: { status: 'ZERO_RESULTS' },
            denied: { status: 'REQUEST_DENIED', error_message: 'The provided API key is invalid.' },
        };
        return route.fulfill({ contentType: 'application/json', body: JSON.stringify(answers[googleMode]) });
    });
    await page.route(/https:\/\/maps\.googleapis\.com\/maps\/api\/streetview\?/, (route) => {
        imageRequests.push(route.request().url());
        return route.fulfill({ contentType: 'image/png', body: PNG });
    });

    await page.goto(appUrl(baseUrl), { waitUntil: 'domcontentloaded' });
    await waitForMapReady(page);

    // Toolbar tools load lazily: a click before the element is defined is lost.
    await page.waitForFunction(() => customElements.get('webmapx-street-photos-tool')
        && document.querySelector('webmapx-toolbar sl-button[name="street-photos"]'), undefined, { timeout: 20_000 });
    await page.evaluate(() => document.querySelector('webmapx-toolbar sl-button[name="street-photos"]').click());
    await page.waitForFunction(() => document.querySelector('webmapx-street-photos-tool')?.active, undefined, { timeout: 10_000 })
        .catch(() => fail('the Street photos button did not open the tool'));

    // While open, the map shows where photos are — on engines that draw vector
    // tiles; the others say so instead of showing nothing without a word.
    const coverage = COVERAGE_ENGINES.includes(engine);
    if (coverage) {
        await page.waitForFunction(async () => {
            const adapter = await document.querySelector('webmapx-map').getAdapterAsync();
            return adapter.hasLayer('panoramax-coverage') && Boolean(adapter.store.getState().mapLayers['panoramax-coverage']);
        }, undefined, { timeout: 10_000 }).catch(() => fail('opening the tool did not show the coverage layer'));
        const parts = await (await page.waitForFunction(async () => {
            const adapter = await document.querySelector('webmapx-map').getAdapterAsync();
            return adapter.store.getState().mapLayers['panoramax-coverage']?.sublayers?.map((s) => s['source-layer']);
        }, undefined, { timeout: 10_000 })).jsonValue();
        if (parts.includes('grid')) fail('the density grid is drawn; it misleads, showing one photo as much as thousands');

        // The fixture starts zoomed out, where the tiles carry no routes: the
        // tip says to zoom in, and a click does not search blind.
        const tip = () => page.evaluate(() => document.querySelector('webmapx-street-photos-tool').toolTip);
        if (!/Zoom in/.test(await tip())) fail(`zoomed out, the tip reads "${await tip()}" instead of saying to zoom in`);
        const searchesBefore = searches.length;
        await clickMapCenter(page);
        await page.waitForTimeout(500);
        if (searches.length !== searchesBefore) fail('a click zoomed out searched for photos the map cannot show');

        // From zoom 6 the routes are there, and so is the usual tip.
        await page.evaluate(async () => {
            const adapter = await document.querySelector('webmapx-map').getAdapterAsync();
            adapter.setViewport(adapter.getViewportState().center, 7, { animate: false });
        });
        await page.waitForFunction(() => !/Zoom in/.test(document.querySelector('webmapx-street-photos-tool').toolTip),
            undefined, { timeout: 10_000 }).catch(() => fail('zoomed in, the tip still says to zoom in'));
    } else {
        await page.waitForFunction(() => /cannot show where photos are/.test(document.querySelector('webmapx-street-photos-tool').shadowRoot.textContent),
            undefined, { timeout: 10_000 }).catch(() => fail('no notice that this engine cannot show coverage'));
        if (await hasCoverage(page)) fail('a coverage layer was added on an engine that cannot draw it');
    }

    // A photo of the clicked spot, with its credit and licence.
    await clickMapCenter(page);
    await page.waitForFunction(() => document.querySelector('webmapx-street-photos-tool').shadowRoot.querySelector('.thumb-button img'),
        undefined, { timeout: 10_000 }).catch(() => fail('no photo shown after a click'));

    const search = new URL(searches.at(-1));
    if (!search.searchParams.get('place_position')) fail(`search did not ask for photos of the spot: ${search}`);
    // At region level a few pixels are far more than 50 m, so the search
    // reaches as far as it is allowed to.
    if (search.searchParams.get('place_distance') !== '0-500') {
        fail(`a click at region level searched ${search.searchParams.get('place_distance')} m, expected the 500 m cap`);
    }

    const shown = await page.evaluate(() => {
        const root = document.querySelector('webmapx-street-photos-tool').shadowRoot;
        // The panel offers the larger picture; leaving for Panoramax is in the dialog only.
        const open = root.querySelector('dialog sl-button[href]');
        return {
            credit: root.querySelector('.credit')?.textContent.replace(/\s+/g, ' ').trim(),
            licenceHref: root.querySelector('.credit a')?.getAttribute('href'),
            enlarge: root.querySelector('sl-button.enlarge')?.textContent.trim(),
            panelLinks: root.querySelectorAll('.street-photos > div > sl-button[href]').length,
            openHref: open?.getAttribute('href'),
            openTarget: open?.getAttribute('target'),
        };
    });
    if (!shown.credit?.includes('City of Amsterdam')) fail(`credit "${shown.credit}" does not name the maker`);
    if (!shown.credit?.includes('CC-BY-SA-4.0') || !shown.licenceHref) fail('the licence is not shown with a link');
    if (shown.enlarge !== 'Open larger picture') fail(`the panel button reads "${shown.enlarge}", expected "Open larger picture"`);
    if (shown.panelLinks !== 0) fail('"Open in Panoramax" is shown in the panel, not only in the enlarged view');
    if (!shown.openHref?.includes('pic=test-photo-1') || shown.openTarget !== '_blank') {
        fail(`"Open in Panoramax" goes to ${shown.openHref} (target ${shown.openTarget})`);
    }

    // Enlarge with the keyboard; Escape closes the enlarged view only.
    await page.evaluate(() => document.querySelector('webmapx-street-photos-tool').shadowRoot.querySelector('.thumb-button').focus());
    await page.keyboard.press('Enter');
    if (!await page.evaluate(() => document.querySelector('webmapx-street-photos-tool').shadowRoot.querySelector('dialog').open)) {
        fail('Enter on the photo did not enlarge it');
    }
    await page.keyboard.press('Escape');
    const afterEscape = await page.evaluate(() => {
        const t = document.querySelector('webmapx-street-photos-tool');
        return { dialog: t.shadowRoot.querySelector('dialog').open, active: t.active, focus: t.shadowRoot.activeElement?.className };
    });
    if (afterEscape.dialog) fail('Escape did not close the enlarged photo');
    if (!afterEscape.active) fail('Escape closed the panel as well as the enlarged photo');
    if (afterEscape.focus !== 'thumb-button') fail(`focus went to "${afterEscape.focus}" after closing, expected the photo`);

    // A 360° photo enlarges in the panorama viewer, not as a flat (distorted) image.
    mode = '360';
    await clickMapCenter(page);
    await page.waitForFunction(() => document.querySelector('webmapx-street-photos-tool').shadowRoot.querySelector('.badge-360'),
        undefined, { timeout: 10_000 }).catch(() => fail('a 360° photo is not marked as one'));
    const label360 = await page.evaluate(() =>
        document.querySelector('webmapx-street-photos-tool').shadowRoot.querySelector('sl-button.enlarge')?.textContent.trim());
    if (label360 !== 'Open 360 view') fail(`the panel button reads "${label360}" for a 360° photo, expected "Open 360 view"`);
    await page.evaluate(() => document.querySelector('webmapx-street-photos-tool').shadowRoot.querySelector('sl-button.enlarge').click());
    await page.waitForFunction(() => document.querySelector('webmapx-street-photos-tool').shadowRoot.querySelector('.panorama.pnlm-container'),
        undefined, { timeout: 15_000 }).catch(() => fail('a 360° photo did not open in the panorama viewer'));
    if (await page.evaluate(() => document.querySelector('webmapx-street-photos-tool').shadowRoot.querySelector('dialog img.large'))) {
        fail('a 360° photo was also shown flat');
    }
    await page.keyboard.press('Escape');

    // What lies under the pointer on the coverage map is stood in for, since CI
    // has no Panoramax tiles: the feature as the tiles carry it, nothing more.
    const standIn = (properties) => page.evaluate(async (props) => {
        const adapter = await document.querySelector('webmapx-map').getAdapterAsync();
        window.__realQuery ??= adapter.queryService.queryFeatures.bind(adapter.queryService);
        adapter.queryService.queryFeatures = async (location, options) => {
            if (!options?.layerIds?.includes('panoramax-coverage')) return window.__realQuery(location, options);
            return props ? [{ layerId: 'panoramax-coverage', properties: props, source: 'vector' }] : [];
        };
    }, properties);
    const PHOTO_DOT = { id: 'test-photo-1', ts: '2025-01-09 12:02:23+00', type: 'equirectangular' };
    const ROUTE = { id: 'sequence-1', date: '2025-01-09', type: 'flat' };

    if (coverage) {
        // A click on a photo dot asks for that photo by id.
        mode = 'photo';
        await standIn(PHOTO_DOT);
        await clickMapCenter(page);
        await page.waitForFunction(() => document.querySelector('webmapx-street-photos-tool').shadowRoot.querySelector('.thumb-button img'),
            undefined, { timeout: 10_000 });
        const asked = new URL(searches.at(-1));
        if (asked.searchParams.get('ids') !== 'test-photo-1') fail(`a dot click searched ${asked} instead of asking for that photo`);

        // A click on a route asks for a photo of that spot, not for the route.
        await standIn(ROUTE);
        const searchesBefore = searches.length;
        await page.evaluate(() => { document.querySelector('webmapx-street-photos-tool').status = 'idle'; });
        await clickMapCenter(page);
        await page.waitForFunction(() => document.querySelector('webmapx-street-photos-tool').status === 'found',
            undefined, { timeout: 10_000 }).catch(() => fail('a click on a route showed no photo'));
        const routeSearch = new URL(searches.at(-1));
        if (searches.length === searchesBefore || !routeSearch.searchParams.get('place_position')) {
            fail('a click on a route did not search for a photo of that spot');
        }

        // A hand over anything clickable, the normal cursor elsewhere.
        const cursorAfterHover = async () => {
            await page.evaluate(async () => {
                const adapter = await document.querySelector('webmapx-map').getAdapterAsync();
                window.__cursors = [];
                const real = adapter.setCursor.bind(adapter);
                adapter.setCursor = (c) => { window.__cursors.push(c); real(c); };
                const p = [Math.random() * 50 + 400, 300];
                adapter.events.emit({ type: 'pointer-move', coords: adapter.unproject(p), pixel: p, resolution: null });
            });
            await page.waitForTimeout(400);
            return page.evaluate(() => window.__cursors.at(-1));
        };
        await standIn(PHOTO_DOT);
        if (await cursorAfterHover() !== 'pointer') fail('the pointer is not a hand over a photo dot');
        await standIn(null);
        if (await cursorAfterHover() !== '') fail('the pointer stayed a hand away from the coverage');
        await standIn(ROUTE);
        if (await cursorAfterHover() !== 'pointer') fail('the pointer is not a hand over a route');

        // Colour by: with the keyboard, recolouring routes and dots in place.
        const routeColour = () => page.evaluate(async () => {
            const adapter = await document.querySelector('webmapx-map').getAdapterAsync();
            const entry = adapter.store.getState().mapLayers['panoramax-coverage'];
            const sub = (entry?.sublayers ?? []).find((l) => l.id === 'panoramax-coverage-sequences');
            const colour = sub?.paint?.['line-color'];
            return Array.isArray(colour) ? colour[0] : colour;
        });
        if (await routeColour() !== '#FF6F00') fail('routes do not start in the coverage colour');
        await page.evaluate(() => document.querySelector('webmapx-street-photos-tool').shadowRoot
            .querySelector('sl-radio-button[value="coverage"]').focus());
        await page.keyboard.press('ArrowRight');
        await page.waitForFunction(async () => {
            const adapter = await document.querySelector('webmapx-map').getAdapterAsync();
            const sub = adapter.store.getState().mapLayers['panoramax-coverage']?.sublayers?.find((l) => l.id === 'panoramax-coverage-sequences');
            return JSON.stringify(sub?.paint?.['line-color'] ?? '').includes('["get","date"]');
        }, undefined, { timeout: 5_000 }).catch(() => fail('choosing "Date" did not colour the routes by date'));
        await page.keyboard.press('ArrowRight');
        await page.waitForFunction(async () => {
            const adapter = await document.querySelector('webmapx-map').getAdapterAsync();
            const sub = adapter.store.getState().mapLayers['panoramax-coverage']?.sublayers?.find((l) => l.id === 'panoramax-coverage-sequences');
            return JSON.stringify(sub?.paint?.['line-color'] ?? '').includes('["get","type"]');
        }, undefined, { timeout: 5_000 }).catch(() => fail('choosing "Camera" did not colour the routes by camera type'));
        await standIn(undefined);
        await page.evaluate(() => { document.querySelector('webmapx-map').getAdapterAsync().then((a) => { a.queryService.queryFeatures = window.__realQuery; }); });
    }

    // Nothing nearby, and Panoramax down: both said plainly.
    mode = 'none';
    await clickMapCenter(page);
    await page.waitForFunction(() => /No street photos here/.test(document.querySelector('webmapx-street-photos-tool').shadowRoot.textContent),
        undefined, { timeout: 10_000 }).catch(() => fail('an empty answer was not reported'));
    mode = 'down';
    await clickMapCenter(page);
    await page.waitForFunction(() => /could not be reached/.test(document.querySelector('webmapx-street-photos-tool').shadowRoot.textContent),
        undefined, { timeout: 10_000 }).catch(() => fail('an outage was not reported'));

    await assertGoogle(page, { coverage, googleAnswer: (a) => { googleMode = a; }, googleSearches, imageRequests });

    // Closing the tool takes the coverage away again.
    await page.evaluate(() => document.querySelector('webmapx-toolbar sl-button[name="street-photos"]').click());
    await page.waitForFunction(() => !document.querySelector('webmapx-street-photos-tool').active, undefined, { timeout: 10_000 })
        .catch(() => fail('the toolbar button did not close the tool'));
    if (await hasCoverage(page)) fail('the coverage layer stayed after the tool closed');
}

export const engines = ['maplibre', 'openlayers', 'leaflet', 'cesium'];
