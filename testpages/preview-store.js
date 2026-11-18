// Hand-over of configs from setup.html to preview.html (iframes and the "Open in new tab"
// window). This used to go through localStorage, but that has a ~5 MB budget per origin
// and setup keeps several copies of the config (one per preview), so a few imported
// layers with inline data were enough to make every write throw — and the previews
// silently kept showing the last config that still fitted. IndexedDB has no such small
// limit. A BroadcastChannel replaces the `storage` event as the "reload now" signal.

const DB_NAME = 'webmapx-setup-previews';
const STORE = 'configs';
const CHANNEL = 'webmapx-setup-previews';

let dbPromise = null;
function openDb() {
  dbPromise ??= new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

/** Stores `{ config, url }` under `key`, then tells open previews to reload. */
export async function putPreviewConfig(key, config, url) {
  const db = await openDb();
  await new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put({ config, url: url ?? null, time: Date.now() }, key);
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });
  const channel = new BroadcastChannel(CHANNEL);
  channel.postMessage({ key });
  channel.close();
}

/** Returns `{ config, url }` stored under `key`, or null. */
export async function getPreviewConfig(key) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const req = db.transaction(STORE).objectStore(STORE).get(key);
    req.onsuccess = () => resolve(req.result ?? null);
    req.onerror = () => reject(req.error);
  });
}

/** Calls `onChange` whenever setup stores a new config under `key`. */
export function onPreviewConfigChange(key, onChange) {
  const channel = new BroadcastChannel(CHANNEL);
  channel.onmessage = (e) => { if (e.data?.key === key) onChange(); };
}
