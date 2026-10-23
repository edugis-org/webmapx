import test from 'node:test';
import assert from 'node:assert/strict';

// A Map-backed localStorage; no document, so applyAppearance only resolves.
const store = new Map<string, string>();
(globalThis as Record<string, unknown>).localStorage = {
  getItem: (k: string) => store.get(k) ?? null,
  setItem: (k: string, v: string) => { store.set(k, String(v)); },
  removeItem: (k: string) => { store.delete(k); },
};

const { effectiveAppearance, setConfiguredAppearance, chooseAppearance } = await import('../src/utils/appearance.js');
const { validateConfig } = await import('../src/config/validator.js');

test('the config sets the default appearance', () => {
  store.clear();
  setConfiguredAppearance({ style: 'classroom', theme: 'dark' });
  assert.deepEqual(effectiveAppearance(), { style: 'classroom', theme: 'dark' });
});

test('stored values that nobody chose do not outrank the config', () => {
  // What every page load used to write, choice or not.
  store.clear();
  store.set('webmapx-style', 'atlas');
  store.set('webmapx-theme', 'light');
  setConfiguredAppearance({ style: 'classroom' });
  assert.equal(effectiveAppearance().style, 'classroom');
});

test('a choice made in settings outranks the config', () => {
  store.clear();
  setConfiguredAppearance({ style: 'classroom', theme: 'light' });
  chooseAppearance({ theme: 'dark' });
  assert.deepEqual(effectiveAppearance(), { style: 'classroom', theme: 'dark' });
  setConfiguredAppearance({ style: 'folio', theme: 'light' });
  assert.deepEqual(effectiveAppearance(), { style: 'classroom', theme: 'dark' });
});

test('unknown config values fall back to the default', () => {
  store.clear();
  setConfiguredAppearance({ style: 'glitter', theme: 'sepia' });
  assert.deepEqual(effectiveAppearance(), { style: 'atlas', theme: 'auto' });
});

function minimalConfig(extra: Record<string, unknown>) {
  return { map: { center: [0, 0], zoom: 2 }, layerData: { sources: [], layers: [] }, ...extra };
}

test('validator warns on an unknown ui style or theme, and accepts known ones', () => {
  const bad = validateConfig(minimalConfig({ ui: { style: 'glitter', theme: 'sepia', font: 'x' } }));
  const paths = bad.warnings.map(w => w.path);
  assert.ok(paths.includes('ui.style'));
  assert.ok(paths.includes('ui.theme'));
  assert.ok(paths.some(p => p.startsWith('ui') && p.includes('font')));

  const good = validateConfig(minimalConfig({ ui: { style: 'classroom', theme: 'auto' } }));
  assert.equal(good.warnings.filter(w => w.path.startsWith('ui')).length, 0);
});

test('validator warns on a non-string toolbar item color', () => {
  const result = validateConfig(minimalConfig({
    tools: { bar: { type: 'toolbar', enabled: true, items: [{ type: 'search', color: 42 }] } },
  }));
  assert.ok(result.warnings.some(w => w.path === 'tools.bar.items[0].color'));
});
