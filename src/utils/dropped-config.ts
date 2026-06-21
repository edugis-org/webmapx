/**
 * Stores and retrieves a dropped webmapx config across a page reload.
 * Uses IndexedDB (no size limit) with a sessionStorage flag to signal presence,
 * avoiding the ~5 MB sessionStorage quota for large configs.
 */

const DB_NAME = 'webmapx-dropped-config';
const STORE_NAME = 'config';
const RECORD_KEY = 'pending';
const FLAG_KEY = 'webmapx-dropped-config-pending';

function openDb(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        const req = indexedDB.open(DB_NAME, 1);
        req.onupgradeneeded = () => req.result.createObjectStore(STORE_NAME);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
}

export async function storeDroppedConfig(text: string): Promise<void> {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        tx.objectStore(STORE_NAME).put(text, RECORD_KEY);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
    db.close();
    sessionStorage.setItem(FLAG_KEY, '1');
}

export async function consumeDroppedConfig(): Promise<string | null> {
    if (!sessionStorage.getItem(FLAG_KEY)) return null;
    sessionStorage.removeItem(FLAG_KEY);
    const db = await openDb();
    const text = await new Promise<string | null>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const getReq = store.get(RECORD_KEY);
        getReq.onsuccess = () => {
            store.delete(RECORD_KEY);
            resolve(typeof getReq.result === 'string' ? getReq.result : null);
        };
        getReq.onerror = () => reject(getReq.error);
    });
    db.close();
    return text;
}
