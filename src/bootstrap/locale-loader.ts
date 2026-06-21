import { i18n } from '../i18n/i18n.js';

// Replaced by Vite define at build time
declare const __WEBMAPX_VERSION__: string;

const LOCALE_CDN_BASE = `https://cdn.jsdelivr.net/npm/@edugis-org/webmapx@${typeof __WEBMAPX_VERSION__ !== 'undefined' ? __WEBMAPX_VERSION__ : 'latest'}/src/locales`;

export async function loadLocale(lang: string): Promise<void> {
  if (i18n.hasResourceBundle(lang, 'webmapx')) {
    await i18n.changeLanguage(lang);
    return;
  }
  try {
    const url = `${LOCALE_CDN_BASE}/${lang}/core.json`;
    const data = await fetch(url).then(r => {
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json();
    });
    i18n.addResourceBundle(lang, 'webmapx', data);
    await i18n.changeLanguage(lang);
  } catch (e) {
    console.error(`[webmapx] Failed to load locale "${lang}", falling back to EN`, e);
  }
}
