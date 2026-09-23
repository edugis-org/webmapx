// Runs axe-core over the app, first as it loads and then with every toolbar
// panel opened in turn, and fails on any violation.
//
// axe checks what can be checked mechanically — names, roles, landmarks,
// heading order, contrast. It cannot tell whether the map can be used from the
// keyboard, so that is checked separately below: one landmark named after the
// map, the first Tab lands on it, and an arrow key and `+` each move it exactly
// once (an engine's own keyboard handling and webmapx's fallback must never
// both run); a tool's result is announced; and toggles report their state.

import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { appUrl } from './lib/fixture-config.mjs';

const require = createRequire(import.meta.url);
const AXE_SOURCE = readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');

async function violations(page) {
  return page.evaluate(async () => {
    const result = await window.axe.run(document, { resultTypes: ['violations'] });
    return result.violations.flatMap((v) => v.nodes.map((n) => `${v.impact} ${v.id}: ${JSON.stringify(n.target)} — ${v.help}`));
  });
}

function toolbarButtons(page) {
  return page.evaluate(() => {
    const out = [];
    const walk = (root) => {
      for (const el of root.querySelectorAll('*')) {
        if (el.matches('sl-button[name]')) out.push(el.getAttribute('name'));
        if (el.shadowRoot) walk(el.shadowRoot);
      }
    };
    walk(document);
    return [...new Set(out)];
  });
}

function clickToolbarButton(page, name) {
  return page.evaluate((name) => {
    const find = (root) => root.querySelector(`sl-button[name="${name}"]`)
      ?? [...root.querySelectorAll('*')].map((el) => el.shadowRoot && find(el.shadowRoot)).find(Boolean);
    find(document)?.click();
  }, name);
}

async function checkMapKeyboard(page) {
  const problems = [];
  const landmarks = await page.evaluate(() => [...document.querySelector('webmapx-map').querySelectorAll('[role="region"]')]
    .filter((el) => !el.closest('webmapx-layout, webmapx-inset-map'))
    .map((el) => el.getAttribute('aria-label')));
  if (landmarks.length !== 1 || landmarks[0] !== 'Demo Map') problems.push(`map landmarks ${JSON.stringify(landmarks)}, expected one named "Demo Map"`);

  const view = () => page.evaluate(async () => {
    const adapter = await document.querySelector('webmapx-map').getAdapterAsync();
    const { center, zoom } = adapter.getViewportState();
    return { lng: center[0], zoom };
  });
  await page.keyboard.press('Tab');
  const inMap = await page.evaluate(() => {
    let el = document.activeElement;
    while (el?.shadowRoot?.activeElement) el = el.shadowRoot.activeElement;
    return Boolean(el?.closest?.('[slot="map-view"]'));
  });
  if (!inMap) problems.push('the first Tab does not reach the map');

  const before = await view();
  await page.keyboard.press('ArrowRight');
  await page.waitForTimeout(900);
  const panned = await view();
  if (!(panned.lng > before.lng)) problems.push(`ArrowRight did not pan east (${before.lng} -> ${panned.lng})`);
  await page.keyboard.press('+');
  await page.waitForTimeout(900);
  const zoomed = await view();
  const step = zoomed.zoom - panned.zoom;
  if (Math.abs(step - 1) > 0.25) problems.push(`"+" changed zoom by ${step.toFixed(2)}, expected 1`);
  return problems;
}

// A result that appears only in a panel is silent to a screen reader. Every
// tool speaks through one live region per map (`internal/announce.ts`); the
// info tool is used to check it because its data is local to the fixture.
async function checkInfoAnnouncement(page) {
  await clickToolbarButton(page, 'info');
  await page.waitForFunction(() => document.querySelector('webmapx-info-tool')?.active, undefined, { timeout: 10_000 });
  await page.evaluate(async () => {
    const adapter = await document.querySelector('webmapx-map').getAdapterAsync();
    // Central France: inside the fixture's world-countries layer at any zoom.
    const coords = [2.5, 46.5];
    adapter.setViewport(coords, 4, { animate: false });
    await new Promise((r) => setTimeout(r, 1500));
    adapter.events.emit({ type: 'click', coords, pixel: adapter.project(coords) });
  });
  const said = await page.waitForFunction(() => {
    const text = document.querySelector('webmapx-map > .webmapx-live-region')?.textContent ?? '';
    return /found here$/.test(text) ? text : false;
  }, undefined, { timeout: 15_000 }).then((h) => h.jsonValue()).catch(() => null);
  await clickToolbarButton(page, 'info');
  return said ? [] : ['the info tool did not announce its result'];
}

// Toggles must say whether they are on. The draw modes are one-of-many and
// snap is on/off; both are native buttons with aria-pressed.
async function checkDrawToggles(page) {
  await clickToolbarButton(page, 'draw');
  await page.waitForFunction(() => document.querySelector('webmapx-draw-tool')?.shadowRoot?.querySelector('button[name="cursor"]'), undefined, { timeout: 10_000 });
  const state = await page.evaluate(() => {
    const root = document.querySelector('webmapx-draw-tool').shadowRoot;
    const modes = ['cursor', 'geo-fill', 'slash-lg', 'pentagon', 'circle']
      .map((name) => root.querySelector(`button[name="${name}"]`)?.getAttribute('aria-pressed'));
    return { modes, snap: root.querySelector('button[name="magnet"]')?.getAttribute('aria-pressed') };
  });
  await clickToolbarButton(page, 'draw');
  const problems = [];
  if (state.modes.filter((v) => v === 'true').length !== 1 || state.modes.some((v) => v !== 'true' && v !== 'false')) {
    problems.push(`draw modes should have exactly one aria-pressed="true", got ${JSON.stringify(state.modes)}`);
  }
  if (state.snap !== 'true' && state.snap !== 'false') problems.push(`snap has no aria-pressed (${state.snap})`);
  return problems;
}

export async function run({ page, baseUrl }) {
  await page.goto(appUrl(baseUrl), { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(async () => {
    const adapter = await document.querySelector('webmapx-map')?.getAdapterAsync?.();
    return Boolean(adapter?.store.getState().mapLoaded);
  }, undefined, { timeout: 60_000 });
  await page.waitForTimeout(1500);

  const keyboard = await checkMapKeyboard(page);
  if (keyboard.length) throw new Error(`map keyboard access:\n  ${keyboard.join('\n  ')}`);
  const announced = await checkInfoAnnouncement(page);
  if (announced.length) throw new Error(announced.join('\n'));
  const toggles = await checkDrawToggles(page);
  if (toggles.length) throw new Error(toggles.join('\n'));
  await page.addScriptTag({ content: AXE_SOURCE });

  const found = new Map();
  const record = (list, where) => { for (const v of list) if (!found.has(v)) found.set(v, where); };

  record(await violations(page), 'on load');
  for (const name of await toolbarButtons(page)) {
    await clickToolbarButton(page, name);
    await page.waitForTimeout(1200);
    record(await violations(page), `${name} open`);
    await clickToolbarButton(page, name);
    await page.waitForTimeout(300);
  }

  if (found.size) {
    throw new Error(`${found.size} accessibility violation(s):\n${[...found].map(([v, where]) => `  [${where}] ${v}`).join('\n')}`);
  }
}

export const engines = ['maplibre', 'openlayers', 'leaflet', 'cesium'];
