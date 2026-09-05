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

/**
 * How many near neighbours an island is given, when it has no real ones.
 *
 * Three, because two is not enough to separate an island from a coastline it
 * sits beside *and* from the other islands beside it — Taiwan wants to differ
 * from mainland China, from Japan and from the Philippines — while more than
 * three starts constraining a lone island against places nobody would compare
 * it with, and every extra constraint costs a colour somewhere else.
 */
const NEAR_NEIGHBOURS_FOR_AN_ISLAND = 3;

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
 * Colours a *grouping* so that touching groups differ — the quotient graph.
 *
 * Colouring by an attribute cycles the scheme by position (`index % colors`),
 * which is fine for a list of unrelated categories and wrong for a map. Style a
 * layer of regions by the country they belong to and, with more countries than
 * the scheme has colours, two countries sharing a border land on the same
 * colour often enough to be the normal case rather than bad luck — and the
 * border between them disappears, which is the one thing the map was drawn to
 * show. Regions of one country must match; regions of *different* countries
 * that touch must not, and only adjacency can say which those are.
 *
 * So the regions are collapsed into their groups and DSATUR is run on the graph
 * of groups: an edge wherever a region of one group shares a border with a
 * region of another. Within-group adjacency is ignored — that is the sharing
 * the grouping asked for.
 *
 * Groups that border nothing — islands, and a third of the world layer is one —
 * are linked to the groups nearest them instead, so a strait does not make two
 * countries look like one. See `linkIsolated`.
 *
 * Returns one palette index per entry of `groups`, or **null** when nothing
 * borders and nothing is near: a layer of points, or geometry with no polygons
 * in it. DSATUR on an edgeless graph would put every group on colour 0 — one
 * flat colour for the whole map, far worse than the position-cycling it
 * replaced — so null tells the caller to keep doing what it did before.
 */
/** Bounding box of a feature's polygons: [minX, minY, maxX, maxY]. */
function featureBounds(feature: GeoJSON.Feature): [number, number, number, number] | null {
    if (!hasPolygon(feature.geometry)) return null;
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const ring of polygonRings(feature.geometry)) {
        for (const [x, y] of ring) {
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
        }
    }
    return Number.isFinite(minX) ? [minX, minY, maxX, maxY] : null;
}

/** Gap between two boxes, zero where they overlap. */
function boxGap(a: readonly number[], b: readonly number[]): number {
    const dx = Math.max(0, Math.max(a[0] - b[2], b[0] - a[2]));
    const dy = Math.max(0, Math.max(a[1] - b[3], b[1] - a[3]));
    return Math.hypot(dx, dy);
}

/**
 * Links each island to the few things nearest it.
 *
 * An island shares a border with nothing, so the colouring has nothing to say
 * about it and it takes whatever colour is going — which is how Taiwan comes out
 * the same colour as mainland China, or Japan the same as Korea. To a reader
 * those are exactly the pairs the colour was supposed to tell apart: a strait is
 * not a reason to look like the same country.
 *
 * "Near" is by the gap between bounding boxes, and the boxes are the point
 * rather than a shortcoming — a box hugs an archipelago about as well as its
 * outline does, and comparing 250 boxes is instant where comparing their
 * hundreds of thousands of vertices is not.
 *
 * Only regions that have *no* real neighbour get these edges. A coastline that
 * already borders someone is constrained by that border, and adding "things
 * across the water" everywhere would pile constraints onto a graph that is
 * already exactly as constrained as the map is.
 */
function linkIsolated(
    bounds: readonly (readonly number[] | null)[],
    neighbours: Set<number>[],
    k = NEAR_NEIGHBOURS_FOR_AN_ISLAND,
): number {
    let added = 0;
    for (let i = 0; i < neighbours.length; i++) {
        if (neighbours[i].size > 0) continue;
        const own = bounds[i];
        if (!own) continue;

        const near: Array<{ index: number; gap: number }> = [];
        for (let j = 0; j < bounds.length; j++) {
            if (j === i) continue;
            const other = bounds[j];
            if (!other) continue;
            near.push({ index: j, gap: boxGap(own, other) });
        }
        near.sort((a, b) => a.gap - b.gap);

        for (const { index } of near.slice(0, k)) {
            if (neighbours[i].has(index)) continue;
            neighbours[i].add(index);
            neighbours[index].add(i);
            added++;
        }
    }
    return added;
}

export function colorGroupsByAdjacency(
    features: readonly GeoJSON.Feature[],
    groupIndexOf: (feature: GeoJSON.Feature) => number | null,
    groupCount: number,
    paletteSize: number,
    tolerance = DEFAULT_TOLERANCE,
): number[] | null {
    if (groupCount === 0 || paletteSize <= 0) return null;

    const featureAdjacency = buildAdjacency(features, tolerance);
    const groupOf = features.map((feature) => {
        const index = groupIndexOf(feature);
        return index !== null && index >= 0 && index < groupCount ? index : -1;
    });

    // A set per group rather than a list: two countries share a border along
    // hundreds of region pairs, and the graph wants the edge once.
    const neighbours: Set<number>[] = Array.from({ length: groupCount }, () => new Set<number>());
    let edges = 0;
    featureAdjacency.forEach((list, i) => {
        const a = groupOf[i];
        if (a < 0) return;
        for (const j of list) {
            const b = groupOf[j];
            if (b < 0 || b === a) continue;
            if (!neighbours[a].has(b)) {
                neighbours[a].add(b);
                neighbours[b].add(a);
                edges++;
            }
        }
    });

    // An island group borders nothing, so nothing above constrains it and it
    // takes whatever colour is left — Taiwan the same as mainland China, Japan
    // the same as Korea. Give each one the groups nearest it instead.
    //
    // Before the edge count is judged, not after: a layer that is *all* islands
    // — the Caribbean, the Pacific states, the provinces of Indonesia — has no
    // borders at all, and bailing out on that would leave the very map that
    // needs this most with none of it.
    const groupBounds: Array<[number, number, number, number] | null> = Array.from({ length: groupCount }, () => null);
    features.forEach((feature, i) => {
        const group = groupOf[i];
        if (group < 0) return;
        const box = featureBounds(feature);
        if (!box) return;
        const current = groupBounds[group];
        groupBounds[group] = current
            ? [Math.min(current[0], box[0]), Math.min(current[1], box[1]),
               Math.max(current[2], box[2]), Math.max(current[3], box[3])]
            : box;
    });
    edges += linkIsolated(groupBounds, neighbours);

    // Nothing borders and nothing is near: a layer of points, or one whose
    // geometry has no polygons at all. DSATUR on an edgeless graph puts every
    // group on colour 0 — one flat colour for the whole map — so the caller is
    // told to keep cycling by position, which is at least varied.
    if (edges === 0) return null;

    return dsatur(neighbours.map((set) => [...set]), paletteSize, paletteSize);
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
export type ColoringKey =
    | { kind: 'id' }
    | { kind: 'property'; name: string }
    | { kind: 'properties'; names: string[] };

/** Separator for a composite key. A unit separator cannot occur in real data. */
export const COMPOSITE_KEY_SEPARATOR = '\u001f';

/**
 * How many columns a composite key may combine.
 *
 * Generous, because the alternative to a six-part key is no colouring at all,
 * and the cost is a `concat` of six `get`s evaluated per feature. Greedy from
 * the most distinguishing column reaches uniqueness in one or two parts on
 * ordinary data; a layer that needs more is a layer that repeats itself a lot.
 */
const MAX_COMPOSITE_COLUMNS = 8;

/** The value of a key for one feature, as the paint expression will compute it. */
export function coloringKeyValue(key: ColoringKey, feature: GeoJSON.Feature): string | null {
    if (key.kind === 'id') return feature.id === undefined || feature.id === null ? null : String(feature.id);
    const names = key.kind === 'property' ? [key.name] : key.names;
    // A missing value is spelled the way the expression will spell it: MapLibre's
    // `to-string` of a null (which is what `get` of an absent property returns)
    // is the empty string. Getting this wrong would build keys that never match
    // — and absent properties are the norm here, since a tile server asked for
    // `include_nulls=0` simply omits them.
    const parts = names.map((name) => {
        const value = feature.properties?.[name];
        return value === null || value === undefined ? '' : String(value);
    });
    if (key.kind === 'property' && parts[0] === '') return null;
    return parts.join(COMPOSITE_KEY_SEPARATOR);
}

export function coloringKeyFor(features: readonly GeoJSON.Feature[]): ColoringKey | null {
    const usable = features.filter((feature) => hasPolygon(feature.geometry));
    if (usable.length === 0) return null;

    const ids = usable.map((feature) => feature.id);
    if (ids.every((id) => id !== undefined && id !== null) && new Set(ids.map(String)).size === ids.length) {
        return { kind: 'id' };
    }

    // Every column any feature carries, not only those every feature carries: a
    // property absent from some features still tells the rest apart, and the
    // most distinguishing columns are often exactly the patchy ones. Only a
    // nested value is unusable, since no expression can spell it.
    const names = new Set<string>();
    for (const feature of usable) {
        for (const [name, value] of Object.entries(feature.properties ?? {})) {
            if (typeof value !== 'object' || value === null) names.add(name);
        }
    }
    const usableNames = [...names].filter((name) =>
        usable.every((feature) => {
            const value = feature.properties?.[name];
            return value === null || value === undefined || typeof value !== 'object';
        }));

    const distinct = (columns: string[]): number =>
        new Set(usable.map((feature) => coloringKeyValue({ kind: 'properties', names: columns }, feature))).size;

    // Property order is the data's own, so the first unique column wins — which
    // is usually a code or a name, in that order, and both are stable.
    for (const name of usableNames) {
        const values = usable.map((feature) => coloringKeyValue({ kind: 'property', name }, feature));
        if (values.every((value) => value !== null) && new Set(values).size === usable.length) {
            return { kind: 'property', name };
        }
    }

    // No single column is unique, which is the normal case for administrative
    // data: provinces called the same thing in different countries, and a
    // measurement that happens to repeat. A *combination* usually is, and it
    // costs nothing to build one — measured on 4013 tiled regions, name alone
    // gives 3885 distinct values and name+admin+type+pop_sum gives all 4013.
    //
    // Greedy, starting from the most distinguishing column, because that is
    // what reaches uniqueness in the fewest parts; the cap keeps a key that
    // fails from turning into every column of the layer.
    const ranked = [...usableNames].sort((a, b) => distinct([b]) - distinct([a]));
    const chosen: string[] = [];
    for (const name of ranked.slice(0, MAX_COMPOSITE_COLUMNS)) {
        chosen.push(name);
        if (distinct(chosen) === usable.length) {
            return chosen.length === 1 ? { kind: 'property', name: chosen[0] } : { kind: 'properties', names: [...chosen] };
        }
    }
    return null;
}
