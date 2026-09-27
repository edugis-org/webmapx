let keys: Record<string, string> | null = null;
let loadPromise: Promise<void> | null = null;
let keysUrl: string | null = null;

/**
 * Where the keys are looked for when no config has said.
 *
 * Resolved against the *page*, which is the whole problem this fallback is a
 * remnant of: the same code then looks in a different place depending on where
 * the HTML sits, so a map embedded at /testpages/ wanted its own copy of the
 * file. A config names the location instead — see `setApiKeysUrl`.
 */
const FALLBACK_URL = 'config/apikeys.json';

/**
 * Points the loader at the keys file this config asked for.
 *
 * Called by the config loader with `apiKeysFile` already resolved against the
 * config's own URL, so the file is found relative to the config rather than to
 * whatever page happens to be showing it — which is what lets one keys file
 * serve every config in a directory, and lets a config in a subdirectory reach
 * it with `../apikeys.json`.
 *
 * A change of location discards anything already loaded: two configs on one
 * page may legitimately carry different keys, and answering the second from
 * the first one's file would be worse than not answering at all.
 */
export function setApiKeysUrl(url: string): void {
  if (url === keysUrl) return;
  keysUrl = url;
  keys = null;
  loadPromise = null;
}

async function load(): Promise<void> {
  try {
    const response = await fetch(keysUrl ?? FALLBACK_URL);
    if (response.ok) {
      keys = await response.json();
    }
  } catch {
    // apikeys.json is optional
  }
}

export function ensureApiKeysLoaded(): Promise<void> {
  if (!loadPromise) {
    loadPromise = load();
  }
  return loadPromise;
}

export function substituteApiKeys(text: string): string {
  if (!keys) return text;
  return text.replace(/\{key-([^}]+)\}/g, (match, name) => keys![name] ?? match);
}

/**
 * `substituteApiKeys` on every string in a layer or source. What it does not
 * change it returns as it was, and it does not look inside inline GeoJSON
 * (`data` as an object): keys live in urls, and copying a layer's data copies
 * every coordinate in it — on every layer added.
 */
export function substituteApiKeysDeep<T>(obj: T): T {
  if (!keys) return obj;
  if (typeof obj === 'string') return substituteApiKeys(obj) as unknown as T;
  if (Array.isArray(obj)) {
    const mapped = obj.map(substituteApiKeysDeep);
    return (mapped.some((entry, i) => entry !== obj[i]) ? mapped : obj) as unknown as T;
  }
  if (obj !== null && typeof obj === 'object') {
    let changed = false;
    const result: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
      const next = k === 'data' && v !== null && typeof v === 'object' ? v : substituteApiKeysDeep(v);
      if (next !== v) changed = true;
      result[k] = next;
    }
    return (changed ? result : obj) as T;
  }
  return obj;
}
