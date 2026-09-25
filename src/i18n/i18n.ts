import i18next from 'i18next';
import enCore from '../locales/en/core.json';

// Initialize with EN built-in (bundled inline — no network fetch)
export const i18n = i18next.createInstance();

let initialized = false;

export async function initI18n(): Promise<void> {
  if (initialized) return;
  initialized = true;
  await i18n.init({
    lng: 'en',
    fallbackLng: 'en',
    ns: ['webmapx'],
    defaultNS: 'webmapx',
    resources: {
      en: { webmapx: enCore },
    },
    interpolation: { escapeValue: false },
  });
}

// `initI18n` used to be something only `WebMapX.mount` called — every other
// entry point that builds a map (the dev app's own `src/app.js`, and by
// extension every testpage and every UI test in this repo) wires the map up
// directly instead and never called it, so `t()` ran against an instance
// i18next hadn't initialized yet. i18next answers a `t()` before `init()`
// with an empty string, not the key — so this wasn't a wrong translation,
// it was a genuinely blank one: `webmapx-mega-reset`'s label, title and
// aria-label all rendered as `""`. Kicking this off here, as a side effect
// of importing the module `t` itself lives in, means any caller of `t()` is
// covered regardless of which bootstrap path it came up through — resources
// are static and inline, so this resolves within the same microtask, well
// before a component's first render. `WebMapX.mount`'s own explicit
// `await initI18n()` still works exactly as before (the `initialized` guard
// makes the second call a no-op) and is what still matters for `loadLocale`
// to have somewhere to load a second language's bundle into.
void initI18n();

export function t(key: string, options?: Record<string, unknown>): string {
  return i18n.t(key, options);
}
