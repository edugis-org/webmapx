// src/map/leaflet-services/label-collision.ts

import * as L from 'leaflet';

/** Hides overlapping text labels across ALL symbol layers registered on a given map, keeping
 *  the one with the lowest `symbol-sort-key` (mirrors MapLibre GL JS's / OL's `declutter`
 *  collision-detection priority, which also considers labels across layers). Leaflet has no
 *  built-in label collision system, so every marker would otherwise render unconditionally.
 *
 *  Markers must carry their sort key on `_webmapxSortKey` (see `createTextLabelIcon` /
 *  `createGeoJSONLayer` in LeafletLayerFactory). */

const registeredLayers = new WeakMap<L.Map, Set<L.GeoJSON>>();
const mapRunners = new WeakMap<L.Map, () => void>();

function runCollision(map: L.Map): void {
    const layers = registeredLayers.get(map);
    if (!layers) return;

    // The icon div itself is sized 0x0 (see createTextLabelIcon's `iconSize`), so its own
    // bounding rect never reflects the label's actual (font-size-dependent) footprint —
    // measure the inner <span> that holds the text instead.
    const entries: { el: HTMLElement; measureEl: HTMLElement; sortKey: number }[] = [];
    for (const layer of layers) {
        layer.eachLayer((l) => {
            const el = (l as any)._icon as HTMLElement | undefined;
            const measureEl = el?.querySelector('span') as HTMLElement | null;
            if (!el || !measureEl) return;
            entries.push({ el, measureEl, sortKey: (l as any)._webmapxSortKey ?? 0 });
        });
    }
    entries.sort((a, b) => a.sortKey - b.sortKey);
    const placed: DOMRect[] = [];
    for (const { el } of entries) {
        el.style.visibility = 'visible';
    }
    for (const { el, measureEl } of entries) {
        const rect = measureEl.getBoundingClientRect();
        const overlaps = placed.some((r) =>
            !(rect.right < r.left || rect.left > r.right || rect.bottom < r.top || rect.top > r.bottom)
        );
        if (overlaps) {
            el.style.visibility = 'hidden';
        } else {
            placed.push(rect);
        }
    }
}

export function setupLabelCollision(layer: L.GeoJSON, map: L.Map): void {
    let layers = registeredLayers.get(map);
    if (!layers) {
        layers = new Set();
        registeredLayers.set(map, layers);
    }
    layers.add(layer);

    let runner = mapRunners.get(map);
    if (!runner) {
        runner = () => runCollision(map);
        mapRunners.set(map, runner);
        map.on('zoomend moveend', runner);
    }
    const runner_ = runner;

    layer.on('add', runner_);
    layer.on('remove', () => {
        layers!.delete(layer);
        if (layers!.size === 0) {
            map.off('zoomend moveend', runner_);
            mapRunners.delete(map);
            registeredLayers.delete(map);
        } else {
            runner_();
        }
    });
}
