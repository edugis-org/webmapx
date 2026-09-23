// Kept apart from plugin-loader, which pulls in the component base classes, so
// the rule for which URLs may run as a plugin can be tested without a DOM.

export const TRUSTED_CDN_PREFIXES = [
  'https://cdn.jsdelivr.net/npm/',
  'https://unpkg.com/',
  'https://esm.sh/',
];

/**
 * Where a plugin URL may point: the page's own origin (so a plugin can sit
 * beside the config on a passive server and be named by a relative path), or
 * one of the trusted CDNs.
 *
 * Relative URLs resolve against the *config's* URL, like every other path in a
 * config. A config fetched from another origin therefore cannot use a relative
 * path to run code here: it resolves to that other origin and is refused.
 */
export function resolvePluginUrl(
  url: string,
  baseUrl: string,
  pageOrigin: string | null = typeof location !== 'undefined' ? location.origin : null,
): string | null {
  let resolved: URL;
  try {
    resolved = new URL(url, baseUrl);
  } catch {
    return null;
  }
  if (pageOrigin && resolved.origin === pageOrigin) return resolved.href;
  if (TRUSTED_CDN_PREFIXES.some((prefix) => resolved.href.startsWith(prefix))) return resolved.href;
  return null;
}
