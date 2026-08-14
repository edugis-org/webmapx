/**
 * Types for the topojson modules that ship untyped.
 *
 * `topojson-client` already has @types (pulled in as a dependency of
 * @types/topojson-simplify's ecosystem); only the server and simplify halves are
 * missing. Both are declared minimally — just the shapes `simplifyShared` uses.
 */
declare module 'topojson-server' {
    import type { Topology, Objects } from 'topojson-specification';

    /**
     * Builds a topology from named GeoJSON objects, turning coincident boundaries
     * into shared arcs. Omit `quantization` to keep exact coordinates.
     */
    export function topology(
        objects: { [key: string]: GeoJSON.GeoJsonObject },
        quantization?: number,
    ): Topology<Objects<GeoJSON.GeoJsonProperties>>;
}

declare module 'topojson-simplify' {
    import type { Topology, Objects } from 'topojson-specification';

    type Topo = Topology<Objects<GeoJSON.GeoJsonProperties>>;

    /** Computes a Visvalingam weight (triangle area) for every arc point. */
    export function presimplify(
        topology: Topo,
        weight?: (triangle: number[][]) => number,
    ): Topo;

    /** Drops every point whose weight is below `minWeight`, and collapsed rings. */
    export function simplify(topology: Topo, minWeight?: number): Topo;

    /** Planar triangle area — correct for projected coordinates such as EPSG:3857. */
    export function planarTriangleArea(triangle: number[][]): number;

    /** Spherical triangle area — for lon/lat input. */
    export function sphericalTriangleArea(triangle: number[][]): number;

    /** Weight threshold at a given quantile of all arc-point weights. */
    export function quantile(topology: Topo, p: number): number;
}
