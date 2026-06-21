const TRUSTED_CDN_PREFIXES = [
  'https://cdn.jsdelivr.net/npm/',
  'https://unpkg.com/',
  'https://esm.sh/',
];

export async function loadPlugins(plugins: string[]): Promise<void> {
  for (const url of plugins) {
    const trusted = TRUSTED_CDN_PREFIXES.some(p => url.startsWith(p));
    if (!trusted) {
      console.warn(`[webmapx] Plugin URL not from a trusted CDN — skipped: ${url}`);
      console.warn('[webmapx] Allowed CDNs: ' + TRUSTED_CDN_PREFIXES.join(', '));
      continue;
    }
    try {
      const mod = await import(/* @vite-ignore */ url);
      mod.default?.register?.();
    } catch (e) {
      console.error(`[webmapx] Failed to load plugin: ${url}`, e);
    }
  }
}
