// Setup page: undo/redo per user action, and "Back to the original".
//
// - Each user action is one undo step (button, Ctrl+Z); Redo (button, Ctrl+Shift+Z /
//   Ctrl+Y) takes it again, and a new action after an undo drops what could be redone.
// - Ctrl+Z while typing in a field or with a dialog open is not ours.
// - The header tells "edited copy" (opened from Recent) apart from "edited" (changed
//   since opening). An edited copy as opened has nothing to undo — the contradiction
//   the review of #29 found: the header said "edited", Undo said "nothing to undo".
// - Back to the original: for a config opened as it is, one more step that Undo
//   reverses; for an edited copy, the original opened in its place (asked first),
//   with the copy kept under Recent.
//
// Tools are addressed by name, never by position: ticking one moves it in the list.

import { FIXTURE_CONFIG } from './lib/fixture-config.mjs';

// Setup runs in a browser context of its own. The runner's context sends a Referer
// header with every request (for the tile servers), and Chrome then refuses to load
// setup's preview iframes at all — they end on chrome-error://, setup's first
// `contentWindow.location.reload()` throws, and the page never finishes opening.
export async function run({ page, baseUrl }) {
  const context = await page.context().browser().newContext({ viewport: { width: 1400, height: 900 } });
  try {
    await drive(await context.newPage(), baseUrl);
  } finally {
    await context.close();
  }
}

async function drive(page, baseUrl) {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const fail = (what, detail = '') => { throw new Error(`${what}${detail ? ` (${detail})` : ''}`); };
  const expect = (ok, what, detail) => { if (!ok) fail(what, detail); };

  const state = () => page.evaluate(() => ({
    source: document.getElementById('config-source').textContent.trim(),
    undo: !document.getElementById('btn-undo').disabled,
    redo: !document.getElementById('btn-redo').disabled,
    original: !document.getElementById('btn-original').hidden,
  }));
  const box = (tool) => page.locator(`#ui input[data-tool="${tool}"][data-toolbar="mainToolbar"]`);
  const on = (tool) => box(tool).isChecked();
  // Longer than the page's settle time (350 ms), so each action is its own step.
  const settle = (ms = 700) => page.waitForTimeout(ms);
  const statusStarts = (t) => page.waitForFunction((t) => document.getElementById('status').textContent.startsWith(t), t, { timeout: 30_000 });
  const recent = () => page.evaluate(() => JSON.parse(localStorage.getItem('webmapx-setup-recent') ?? '[]'));
  const answer = async (value) => {
    await page.waitForSelector('#open-confirm[open]');
    await page.click(`#open-confirm button[value=${value}]`);
  };

  // Recent lives in localStorage; start without anything a previous suite left there.
  await page.goto(`${baseUrl}/testpages/setup.html?config=${encodeURIComponent(FIXTURE_CONFIG)}`, { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => localStorage.removeItem('webmapx-setup-recent'));
  await page.reload({ waitUntil: 'domcontentloaded' });
  // The header line is written last, once the config is open and its history started.
  await page.waitForFunction(() => document.getElementById('config-source').textContent.length > 0
    && document.querySelectorAll('#ui input[data-tool]').length > 2, undefined, { timeout: 30_000 });
  await settle();

  let s = await state();
  expect(!s.undo && !s.redo && !s.original && !s.source.includes('edited'), 'fresh open: nothing to undo, clean header', s.source);

  const A = 'search', B = 'measure';
  const a0 = await on(A), b0 = await on(B);
  await box(A).click(); await settle();
  await box(B).click(); await settle();
  s = await state();
  expect(s.undo && !s.redo, 'two edits: undo on, redo off');
  expect(s.source.endsWith('· edited') && !s.source.includes('edited copy'), 'header says "edited"', s.source);
  expect(s.original, 'Back to the original is offered for an edited config');

  await page.click('#btn-undo'); await statusStarts('Undone.'); await settle();
  expect(await on(A) !== a0 && await on(B) === b0, 'one Undo reverts only the last action');
  s = await state();
  expect(s.undo && s.redo, 'after one undo: undo and redo on');

  await page.locator('.v2-topbar').click({ position: { x: 2, y: 2 } });
  await page.keyboard.press('Control+z'); await statusStarts('Undone.'); await settle();
  expect(await on(A) === a0 && await on(B) === b0, 'Ctrl+Z undoes the first action');
  s = await state();
  expect(!s.undo && s.redo && !s.source.includes('edited'), 'back at the start: undo off, clean header', s.source);

  await page.click('#btn-redo'); await statusStarts('Redone.'); await settle();
  await page.keyboard.press('Control+y'); await settle(1200);
  expect(await on(A) !== a0 && await on(B) !== b0, 'Redo, then Ctrl+Y, restore both actions');

  // Ctrl+Z in a field is that field's own undo.
  await page.click('#btn-open-config');
  await page.locator('#gallery-filter').fill('x');
  const beforeB = await on(B);
  await page.keyboard.press('Control+z'); await settle();
  expect(await on(B) === beforeB, 'Ctrl+Z while typing in a field leaves the config alone');
  await page.keyboard.press('Escape'); await settle(300);

  await page.click('#btn-undo'); await statusStarts('Undone.'); await settle();
  await box('info').click(); await settle();
  expect(!(await state()).redo, 'a new action after Undo clears Redo');

  // Opened as it is: going back is a step of its own.
  await page.click('#btn-original'); await statusStarts('Back to the original'); await settle();
  expect(await on(A) === a0 && await on(B) === b0, 'Back to the original restores the config as opened');
  s = await state();
  expect(!s.source.includes('edited') && s.undo && !s.original, 'then: clean header, undo on, button hidden', s.source);
  await page.click('#btn-undo'); await statusStarts('Undone.'); await settle();
  expect(await on(A) !== a0, 'Undo brings the changes back');

  // An edited copy from Recent.
  await page.waitForFunction(() => JSON.parse(localStorage.getItem('webmapx-setup-recent') ?? '[]').some(e => e.edited),
    undefined, { timeout: 10_000 });
  const copy = (await recent()).find(e => e.edited);
  await page.click('#btn-open-config');
  await page.locator('#gallery-recent-grid .gallery-card', { hasText: 'edited' }).first().click();
  await answer('open');   // the config on screen is edited, so setup asks first
  await statusStarts('Opened'); await settle();
  s = await state();
  expect(s.source.endsWith('· edited copy'), 'edited copy as opened: header says "edited copy" only', s.source);
  expect(!s.undo, 'edited copy as opened: nothing to undo');
  expect(s.original, 'edited copy: Back to the original is offered');
  await box('draw').click(); await settle();
  s = await state();
  expect(s.source.endsWith('· edited copy · edited'), 'edited copy changed: "edited copy · edited"', s.source);

  await page.click('#btn-original');
  await page.waitForSelector('#open-confirm[open]');
  const question = await page.locator('#open-confirm-text').textContent();
  expect(question.includes('stays under Recent'), 'the question says the copy stays under Recent', question);
  await answer('open');
  await statusStarts('Opened'); await settle();
  s = await state();
  expect(!s.source.includes('edited') && !s.original && !s.undo, 'original opened: clean header, no button, new history', s.source);
  expect(await on(A) === a0 && await on(B) === b0, 'the original has its own settings');
  expect((await recent()).some(e => e.id === copy.id), 'the edited copy is still under Recent');

  expect(errors.length === 0, 'no page errors', errors.join(' | '));
}

// Setup is the same page whatever the map engine: run it once.
export const engines = ['maplibre'];
