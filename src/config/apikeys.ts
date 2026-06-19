let keys: Record<string, string> | null = null;
let loadPromise: Promise<void> | null = null;

async function load(): Promise<void> {
  try {
    const response = await fetch('config/apikeys.json');
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

export function substituteApiKeysDeep<T>(obj: T): T {
  if (!keys) return obj;
  if (typeof obj === 'string') return substituteApiKeys(obj) as unknown as T;
  if (Array.isArray(obj)) return obj.map(substituteApiKeysDeep) as unknown as T;
  if (obj !== null && typeof obj === 'object') {
    const result: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
      result[k] = substituteApiKeysDeep(v);
    }
    return result as T;
  }
  return obj;
}
