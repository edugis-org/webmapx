/**
 * Plate boundaries at an age, including the zones that are deforming.
 *
 * The companion to `paleo-coastlines`, and deliberately built the other way
 * round. A coastline rides a single plate, so one rotation reconstructs it at
 * any moment and the slider moves it smoothly. A plate *boundary* has no such
 * continuity: boundaries are born, die, jump, and change in number, so there is
 * nothing to interpolate between two ages. This reads whichever snapshot is
 * nearest and says so by snapping — 10 Ma steps, built by
 * `scripts/build-plate-topologies.ts`.
 *
 * It is worth the bytes because it answers a question the coastlines cannot.
 * Reconstructed coastlines show India reaching Asia only in the last few
 * million years, which is wrong by ~45 Ma: the collision began when the plates
 * met, and the continental crust between them — Greater India, some 3 million
 * km² of it — has since been squeezed into Tibet and the Himalaya, so it is
 * absent from any reconstruction of *present-day* coastlines. The deforming
 * networks are exactly that missing crust, and they show the collision starting
 * when it actually started.
 */

import { announceComputedDataReady } from './computed-source-ready';

const EMPTY: GeoJSON.FeatureCollection = { type: 'FeatureCollection', features: [] };

interface PlateIndex {
    model: string;
    step: number;
    ages: number[];
}

const indexes = new Map<string, PlateIndex>();
const indexLoading = new Map<string, Promise<PlateIndex | null>>();
const snapshots = new Map<string, GeoJSON.FeatureCollection>();
const snapshotLoading = new Set<string>();

function indexUrl(base: string): string {
    return `${base.replace(/\/$/, '')}/plates-index.json`;
}

function snapshotUrl(base: string, age: number): string {
    return `${base.replace(/\/$/, '')}/plates-${String(age).padStart(4, '0')}.geojson`;
}

/** The sampled age closest to the one asked for. */
function nearestAge(ages: number[], age: number): number | null {
    if (ages.length === 0) return null;
    let best = ages[0];
    for (const candidate of ages) {
        if (Math.abs(candidate - age) < Math.abs(best - age)) best = candidate;
    }
    return best;
}

async function loadIndex(base: string): Promise<PlateIndex | null> {
    const cached = indexes.get(base);
    if (cached) return cached;
    const inFlight = indexLoading.get(base);
    if (inFlight) return inFlight;

    const attempt = (async () => {
        try {
            const response = await fetch(indexUrl(base));
            if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
            const index = await response.json() as PlateIndex;
            if (!Array.isArray(index?.ages) || index.ages.length === 0) return null;
            indexes.set(base, index);
            return index;
        } catch (error) {
            console.warn(`[paleo-plates] no plate boundaries in ${base}:`, error);
            return null;
        } finally {
            indexLoading.delete(base);
        }
    })();

    indexLoading.set(base, attempt);
    return attempt;
}

async function loadSnapshot(base: string, age: number): Promise<void> {
    const key = `${base}|${age}`;
    if (snapshots.has(key) || snapshotLoading.has(key)) return;
    snapshotLoading.add(key);
    try {
        const response = await fetch(snapshotUrl(base, age));
        if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
        snapshots.set(key, await response.json() as GeoJSON.FeatureCollection);
        // The map drew an empty collection while this was on its way; tell it
        // there is something to draw now.
        announceComputedDataReady();
    } catch (error) {
        console.warn(`[paleo-plates] ${age} Ma unavailable in ${base}:`, error);
    } finally {
        snapshotLoading.delete(key);
    }
}

/**
 * `internalfunc://paleo-plates?data=<directory>&ma={ma}`
 *
 * Empty while a snapshot is on its way, which is what the map already shows.
 */
export function paleoPlates(query: URLSearchParams): GeoJSON.FeatureCollection {
    const base = query.get('data');
    if (!base) {
        console.warn('[paleo-plates] needs ?data=<directory holding plates-index.json>');
        return EMPTY;
    }

    const index = indexes.get(base);
    if (!index) {
        void loadIndex(base).then((loaded) => { if (loaded) announceComputedDataReady(); });
        return EMPTY;
    }

    const asked = Number(query.get('ma'));
    const age = nearestAge(index.ages, Number.isFinite(asked) ? Math.max(0, asked) : 0);
    if (age === null) return EMPTY;

    const ready = snapshots.get(`${base}|${age}`);
    if (ready) return ready;

    void loadSnapshot(base, age);
    // The previous step is better than nothing while the next one arrives: the
    // boundaries barely move between two samples, and a layer that blinks out
    // on every slider drag is worse than one that lags by a step.
    for (const candidate of [...index.ages].sort((a, b) => Math.abs(a - age) - Math.abs(b - age))) {
        const near = snapshots.get(`${base}|${candidate}`);
        if (near) return near;
    }
    return EMPTY;
}
