/**
 * Colouring a polygon layer so that no two neighbours share a colour, using no
 * attribute at all.
 *
 * This is the one styling option that works on a layer with no usable columns,
 * and it is what a printed atlas does to make an administrative map readable.
 *
 * **It is not "the four-colour theorem".** The theorem (Appel & Haken 1976)
 * guarantees four colours for a map whose every region is a single connected
 * piece — which real data is not: a country with islands or an exclave is
 * several pieces that must all share one colour, and that is precisely the case
 * the theorem excludes. The known four-colour *procedure* is also hundreds of
 * lines. DSATUR is a few dozen, colours real country and municipality layers in
 * four or five, and the extra colour is invisible to anyone who was not
 * counting. So this promises "neighbours differ, in as few colours as it can
 * manage" and reports how many it used.
 *
 * Adjacency is **shared vertices, quantised to a tolerance**: two regions are
 * neighbours when they share at least two vertices, i.e. a border *segment*.
 * One shared vertex is a corner touch, and corner-touching regions may share a
 * colour — the same rule the theorem uses. The exact-coordinate caveat from
 * topology-aware simplification applies: layers whose shared borders were
 * exported separately may not share vertices at all, and then every region is an
 * island. `tolerance` exists for that, and `isolatedRegions` in the result is how
 * a caller notices it happened rather than shipping a one-colour map.
 */

/** Grid the coordinates are snapped to before matching, in degrees. */
export const DEFAULT_TOLERANCE = 1e-7;

/** Vertices two regions must share before they count as neighbours. */
const SHARED_VERTICES_FOR_BORDER = 2;

export interface ColoringOptions {
    /**
     * How many colours to spread the map over. The minimum a map *needs* is
     * usually four; asking for more is a legitimate taste: a twelve-colour map
     * of municipalities reads as variety rather than as a scheme. Fewer than the
     * map needs is capped by `maxColors` instead, which allows a clash.
     */
    paletteSize?: number;
    /**
     * Snap distance for matching vertices, in degrees (the units of GeoJSON).
     * The default is about a centimetre — tight enough that unrelated vertices
     * do not merge, loose enough to absorb rounding.
     */
    tolerance?: number;
    /** Upper bound on colours; DSATUR usually needs 4–5. */
    maxColors?: number;
}

export interface ColoringResult {
    /** Colour index per input feature, in input order. */
    colors: number[];
    /** How many distinct colours were needed. */
    colorCount: number;
    /** Neighbour lists per feature index — useful for testing and for a report. */
    adjacency: number[][];
    /**
     * Features with no neighbour at all. A handful is normal (real islands); a
     * layer where *every* region is isolated means the borders do not share
     * vertices, and the colouring is meaningless.
     */
    isolatedRegions: number;
    /** Features with no polygon geometry, which take no part. */
    skipped: number;
}

/**
 * Builds the neighbour graph and colours it.
 *
 * Deliberately index-based: it says nothing about ids or expressions, so it can
 * be tested on plain geometry and reused by anything that needs adjacency.
 */
export function colorByAdjacency(
    features: readonly GeoJSON.Feature[],
    options: ColoringOptions = {},
): ColoringResult {
    const tolerance = options.tolerance ?? DEFAULT_TOLERANCE;
    const adjacency = buildAdjacency(features, tolerance);
    const skipped = features.filter((feature) => !hasPolygon(feature.geometry)).length;
    const colors = dsatur(adjacency, options.maxColors ?? Infinity, options.paletteSize);

    return {
        colors,
        colorCount: colors.length === 0 ? 0 : Math.max(...colors) + 1,
        adjacency,
        isolatedRegions: adjacency.filter((neighbours, i) => neighbours.length === 0 && hasPolygon(features[i]?.geometry)).length,
        skipped,
    };
}

/**
 * Neighbour lists by shared border.
 *
 * Every vertex of every ring is snapped to the tolerance grid and filed under
 * that key; two regions sharing at least two keys share a segment. A vertex
 * repeated within one region (a ring closes on its first point, and a multipart
 * feature repeats nothing) is counted once, so a region cannot become its own
 * neighbour or inflate a pair's count on its own.
 */
export function buildAdjacency(features: readonly GeoJSON.Feature[], tolerance = DEFAULT_TOLERANCE): number[][] {
    const byVertex = new Map<string, Set<number>>();

    features.forEach((feature, index) => {
        if (!hasPolygon(feature.geometry)) return;
        const seen = new Set<string>();
        for (const ring of polygonRings(feature.geometry)) {
            for (const point of ring) {
                const key = vertexKey(point, tolerance);
                if (seen.has(key)) continue;
                seen.add(key);
                const owners = byVertex.get(key);
                if (owners) owners.add(index);
                else byVertex.set(key, new Set([index]));
            }
        }
    });

    // How many vertices each pair of regions has in common. Keyed on the pair
    // rather than held as a matrix: a layer of 4000 regions would need 16
    // million cells, of which a few thousand are non-zero.
    const shared = new Map<number, number>();
    for (const owners of byVertex.values()) {
        if (owners.size < 2) continue;
        const list = [...owners].sort((a, b) => a - b);
        for (let i = 0; i < list.length; i++) {
            for (let j = i + 1; j < list.length; j++) {
                const key = list[i] * features.length + list[j];
                shared.set(key, (shared.get(key) ?? 0) + 1);
            }
        }
    }

    const adjacency: number[][] = features.map(() => []);
    for (const [key, count] of shared) {
        // One shared vertex is a corner touch, not a border.
        if (count < SHARED_VERTICES_FOR_BORDER) continue;
        const a = Math.floor(key / features.length);
        const b = key % features.length;
        adjacency[a].push(b);
        adjacency[b].push(a);
    }
    return adjacency;
}

/**
 * DSATUR (Brélaz 1979): colour the region with the most differently-coloured
 * neighbours first, breaking ties by degree.
 *
 * Greedy in the order the regions come is what produces a map needing seven
 * colours; choosing the most-constrained region next is what keeps real layers
 * to four or five. `maxColors` caps the palette: past the cap a region takes the
 * least-used colour among its neighbours' colours, so the map still looks
 * varied and the caller is told (by `colorCount` reaching the cap) that some
 * neighbours match.
 */
export function dsatur(adjacency: readonly (readonly number[])[], maxColors = Infinity, paletteSize?: number): number[] {
    const n = adjacency.length;
    const colors = new Array<number>(n).fill(-1);
    const saturation = adjacency.map(() => new Set<number>());

    for (let step = 0; step < n; step++) {
        let best = -1;
        for (let i = 0; i < n; i++) {
            if (colors[i] !== -1) continue;
            if (best === -1) { best = i; continue; }
            const bySaturation = saturation[i].size - saturation[best].size;
            if (bySaturation > 0 || (bySaturation === 0 && adjacency[i].length > adjacency[best].length)) {
                best = i;
            }
        }
        if (best === -1) break;

        let color = 0;
        while (saturation[best].has(color) && color < maxColors - 1) color++;
        if (saturation[best].has(color)) {
            // The cap has been reached and every colour is taken by a
            // neighbour: pick the one that appears least often among them, so
            // the unavoidable clash is as inconspicuous as it can be.
            const counts = new Array<number>(maxColors).fill(0);
            for (const neighbour of adjacency[best]) {
                if (colors[neighbour] >= 0) counts[colors[neighbour]]++;
            }
            color = counts.indexOf(Math.min(...counts));
        }

        colors[best] = color;
        for (const neighbour of adjacency[best]) saturation[neighbour].add(color);
    }

    return rebalance(adjacency, colors, paletteSize);
}

/**
 * Spreads the regions evenly over the colours already in use, without adding
 * one and without ever putting two neighbours together.
 *
 * Taking the lowest free colour is correct and ugly: every island, and every
 * region coloured early, lands on colour 0. Measured on 242 world countries
 * (76 of them islands with no land border) that put 128 in a single colour and
 * 19 in the smallest — half the world one shade. Balancing *during* the greedy
 * pass fixes the distribution but costs a colour, because reaching for a
 * lesser-used colour blocks a neighbour later. Doing it afterwards keeps both:
 * a region only ever moves to a colour none of its neighbours holds, so the
 * result stays valid and the palette cannot grow.
 */
function rebalance(adjacency: readonly (readonly number[])[], colors: number[], paletteSize?: number): number[] {
    const needed = colors.length === 0 ? 0 : Math.max(...colors) + 1;
    // A caller asking for more colours than the map needs gets them here: the
    // spare colours are simply candidates the balancing pass can move regions
    // into, so the extra colours are used evenly instead of sitting unused at
    // the end of the palette.
    const colorCount = Math.max(needed, Math.min(paletteSize ?? 0, colors.length));
    if (colorCount < 2) return colors;

    const counts = new Array<number>(colorCount).fill(0);
    for (const color of colors) counts[color]++;

    // One pass in order of how crowded a region's current colour is: the most
    // over-used colour gives up regions first. A second pass buys nothing
    // measurable (the distribution is within one region of even after the
    // first), so there is no loop to tune.
    const order = colors.map((_, index) => index).sort((a, b) => counts[colors[b]] - counts[colors[a]]);
    for (const index of order) {
        const taken = new Set(adjacency[index].map((neighbour) => colors[neighbour]));
        let target = colors[index];
        for (let candidate = 0; candidate < colorCount; candidate++) {
            if (taken.has(candidate)) continue;
            if (counts[candidate] + 1 < counts[target]) target = candidate;
        }
        if (target !== colors[index]) {
            counts[colors[index]]--;
            counts[target]++;
            colors[index] = target;
        }
    }
    return colors;
}

function hasPolygon(geometry: GeoJSON.Geometry | null | undefined): boolean {
    return geometry?.type === 'Polygon' || geometry?.type === 'MultiPolygon';
}

function polygonRings(geometry: GeoJSON.Geometry): GeoJSON.Position[][] {
    if (geometry.type === 'Polygon') return geometry.coordinates;
    if (geometry.type === 'MultiPolygon') return geometry.coordinates.flat();
    return [];
}

function vertexKey(point: GeoJSON.Position, tolerance: number): string {
    return `${Math.round(point[0] / tolerance)},${Math.round(point[1] / tolerance)}`;
}

/**
 * A per-feature key the paint expression can address a region by.
 *
 * A colouring has no attribute behind it — it is a decision per feature — so the
 * expression has to name features somehow, and this tool must not write the
 * answer into the data (`docs/developer/layer-style-ui.md`, §7: the UI edits
 * style, never data). GeoJSON `id` is the right handle when it is there and
 * unique; failing that, any property that is unique across the layer will do.
 *
 * Returns null when neither exists, which is a real outcome and not an error:
 * the caller reports "this layer has nothing to tell its features apart by"
 * rather than colouring the wrong ones.
 */
export function coloringKeyFor(features: readonly GeoJSON.Feature[]): { kind: 'id' } | { kind: 'property'; name: string } | null {
    const usable = features.filter((feature) => hasPolygon(feature.geometry));
    if (usable.length === 0) return null;

    const ids = usable.map((feature) => feature.id);
    if (ids.every((id) => id !== undefined && id !== null) && new Set(ids.map(String)).size === ids.length) {
        return { kind: 'id' };
    }

    // Property order is the data's own, so the first unique column wins — which
    // is usually a code or a name, in that order, and both are stable.
    for (const name of Object.keys(usable[0].properties ?? {})) {
        const values = usable.map((feature) => feature.properties?.[name]);
        if (values.some((value) => value === null || value === undefined || typeof value === 'object')) continue;
        if (new Set(values.map(String)).size !== values.length) continue;
        return { kind: 'property', name };
    }
    return null;
}
