// src/utils/appearance.ts
//
// Which style (form) and theme (colour) the page is drawn in, and who decides.
//
// Two parties have a say: the config author (`ui.style` / `ui.theme`) and the
// person looking at the map (the settings tool). The author's choice is the
// default, because a classroom map is designed to look like one; a choice the
// viewer made in settings wins over it, because they asked for it.
//
// "Made" matters. The settings tool used to write both keys on every page
// load, so a stored value said nothing about whether anyone chose it, and a
// config's style would have been overruled by every browser that ever opened
// a webmapx page. Stored values now count only alongside CHOSEN_KEY, which is
// written by an actual change in settings. The keys themselves are unchanged
// because host pages read `webmapx-theme` in an inline script before first
// paint (see testpages/preview.html).

export const UI_STYLE_VALUES = ['atlas', 'folio', 'console', 'classroom'] as const;
export const UI_THEME_VALUES = ['auto', 'light', 'dark'] as const;
export type UiStyle = typeof UI_STYLE_VALUES[number];
export type UiTheme = typeof UI_THEME_VALUES[number];

export interface UiAppearance {
  style: UiStyle;
  theme: UiTheme;
}

export const DEFAULT_APPEARANCE: UiAppearance = { style: 'atlas', theme: 'auto' };

const STYLE_KEY = 'webmapx-style';
const THEME_KEY = 'webmapx-theme';
const CHOSEN_KEY = 'webmapx-appearance-chosen';

/** Dispatched on `document` whenever the appearance in force changes. */
export const APPEARANCE_CHANGE_EVENT = 'webmapx-appearance-change';

/**
 * Values written by the old single-dropdown settings, mapped onto the style
 * axis. `compact`/`glossy` are also still honoured as CSS aliases.
 */
const LEGACY_STYLES: Record<string, UiStyle> = {
  light: 'atlas', dark: 'atlas', compact: 'console', glossy: 'atlas',
};

export function isUiStyle(value: unknown): value is UiStyle {
  return typeof value === 'string' && (UI_STYLE_VALUES as readonly string[]).includes(value);
}

export function isUiTheme(value: unknown): value is UiTheme {
  return typeof value === 'string' && (UI_THEME_VALUES as readonly string[]).includes(value);
}

let configured: Partial<UiAppearance> = {};
let systemDark: MediaQueryList | null = null;

function storage(): Storage | null {
  try { return typeof localStorage === 'undefined' ? null : localStorage; } catch { return null; }
}

/** What the viewer chose in settings, if they ever did. */
export function readChosenAppearance(): Partial<UiAppearance> {
  const store = storage();
  if (!store || store.getItem(CHOSEN_KEY) !== '1') return {};
  const style = store.getItem(STYLE_KEY);
  const theme = store.getItem(THEME_KEY);
  return {
    ...(isUiStyle(style) ? { style } : style && LEGACY_STYLES[style] ? { style: LEGACY_STYLES[style] } : {}),
    ...(isUiTheme(theme) ? { theme } : {}),
  };
}

/** The appearance in force: the viewer's choice, else the config's, else the default. */
export function effectiveAppearance(): UiAppearance {
  return { ...DEFAULT_APPEARANCE, ...configured, ...readChosenAppearance() };
}

/** Resolves `auto` against the OS preference. */
export function resolveTheme(theme: UiTheme): 'light' | 'dark' {
  if (theme !== 'auto') return theme;
  return typeof matchMedia === 'function' && matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

/**
 * Writes the appearance in force onto <html>. `auto` is resolved here rather
 * than left to a media query, so `data-theme` always states the theme actually
 * shown — the attribute other components and host pages read.
 */
export function applyAppearance(): UiAppearance {
  const appearance = effectiveAppearance();
  if (typeof document === 'undefined') return appearance;
  const html = document.documentElement;
  const theme = resolveTheme(appearance.theme);
  html.setAttribute('data-style', appearance.style);
  html.setAttribute('data-theme', theme);
  html.classList.toggle('sl-theme-dark', theme === 'dark');
  html.style.colorScheme = theme;
  watchSystemTheme();
  document.dispatchEvent(new CustomEvent(APPEARANCE_CHANGE_EVENT, { detail: { ...appearance, resolvedTheme: theme } }));
  return appearance;
}

/** 'Match system' has to keep matching, not just read the preference once. */
function watchSystemTheme(): void {
  if (systemDark || typeof matchMedia !== 'function') return;
  systemDark = matchMedia('(prefers-color-scheme: dark)');
  systemDark.addEventListener('change', () => {
    if (effectiveAppearance().theme === 'auto') applyAppearance();
  });
}

/**
 * The config author's choice (`ui.style` / `ui.theme`). Unknown values are
 * ignored here; the validator is what reports them.
 */
export function setConfiguredAppearance(ui: unknown): void {
  const record = ui && typeof ui === 'object' ? ui as Record<string, unknown> : {};
  configured = {
    ...(isUiStyle(record.style) ? { style: record.style } : {}),
    ...(isUiTheme(record.theme) ? { theme: record.theme } : {}),
  };
  applyAppearance();
}

/** The viewer's choice from settings: remembered, and outranks the config from now on. */
export function chooseAppearance(choice: Partial<UiAppearance>): UiAppearance {
  const store = storage();
  const next = { ...effectiveAppearance(), ...choice };
  try {
    store?.setItem(STYLE_KEY, next.style);
    store?.setItem(THEME_KEY, next.theme);
    store?.setItem(CHOSEN_KEY, '1');
  } catch { /* storage full or blocked: still applied for this page */ }
  if (!store) configured = { ...configured, ...choice };
  return applyAppearance();
}
