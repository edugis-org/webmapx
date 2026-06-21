import i18next from 'i18next';

// Initialize with EN built-in (no network fetch needed for default locale)
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
      en: {
        webmapx: (await import('../locales/en/core.json', { with: { type: 'json' } })).default,
      },
    },
    interpolation: { escapeValue: false },
  });
}

export function t(key: string, options?: Record<string, unknown>): string {
  return i18n.t(key, options);
}
