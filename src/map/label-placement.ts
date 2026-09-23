/**
 * Which labels to show when they would overlap: the rule MapLibre and
 * OpenLayers (`declutter`) apply natively, for engines that have none.
 *
 * Labels are taken in order of `symbol-sort-key`, lowest first, and each one is
 * kept unless it touches a label already kept. Greedy, like the engines it
 * mirrors: a low-priority label is never shown at the cost of a higher one.
 *
 * Engine-neutral on purpose. Finding the labels and measuring their boxes on
 * screen is engine work (DOM markers in Leaflet, entities in Cesium); deciding
 * between them is not, and was written twice before this existed.
 */

export interface LabelBox {
    left: number;
    right: number;
    top: number;
    bottom: number;
}

export interface LabelCandidate<T> {
    item: T;
    /** `symbol-sort-key`: lower wins. */
    sortKey: number;
    /** On-screen footprint, in pixels. */
    box: LabelBox;
}

/** The items to show; every other candidate collides with one of them. */
export function placeLabels<T>(candidates: readonly LabelCandidate<T>[]): Set<T> {
    const ordered = [...candidates].sort((a, b) => a.sortKey - b.sortKey);
    const placed: LabelBox[] = [];
    const shown = new Set<T>();
    for (const { item, box } of ordered) {
        const overlaps = placed.some((other) =>
            !(box.right < other.left || box.left > other.right || box.bottom < other.top || box.top > other.bottom));
        if (overlaps) continue;
        placed.push(box);
        shown.add(item);
    }
    return shown;
}
