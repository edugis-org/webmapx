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

export function t(key: string, options?: Record<string, unknown>): string {
  return i18n.t(key, options);
}
