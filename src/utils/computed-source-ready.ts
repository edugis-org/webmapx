/**
 * A computed source telling the map it can answer properly now.
 *
 * Most `internalfunc://` generators are pure arithmetic and answer the first
 * time they are asked. A few stand in front of data that has to be fetched, and
 * those have no choice but to return an empty collection on the first call and
 * fetch in the background — the generator signature is synchronous, which is
 * what lets a source be resolved from a url anywhere in the app.
 *
 * So the map has to be told when the data arrives, or a layer that came from a
 * configuration would sit there empty until something else happened to move it.
 * `BaseAdapter` listens; a generator announces.
 *
 * Deliberately its own module rather than part of `internal-sources`: the
 * generators are imported *by* that module, so anything they import from it
 * closes a cycle.
 */

const listeners = new Set<() => void>();

/** Called by the map. Returns a function that stops listening. */
export function onComputedDataReady(listener: () => void): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
}

/** Called by a generator once the data behind it has loaded. */
export function announceComputedDataReady(): void {
    for (const listener of listeners) listener();
}
