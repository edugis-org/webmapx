/**
 * Types for polylabel, which ships untyped.
 *
 * Hand-written rather than @types/polylabel: that package describes v1, whose
 * signature differs from the v2 we depend on.
 */
declare module 'polylabel' {
    /**
     * Pole of inaccessibility — the point inside a polygon furthest from any edge.
     *
     * @param polygon Rings in GeoJSON order: outer ring first, then holes.
     * @param precision Stop refining once the answer is this close (same units as
     *                  the coordinates).
     * @returns `[x, y]`, with the distance to the nearest edge attached.
     */
    export default function polylabel(
        polygon: number[][][],
        precision?: number,
        debug?: boolean,
    ): number[] & { distance: number };
}
