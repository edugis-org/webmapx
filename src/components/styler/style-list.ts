/**
 * The layer's sublayers as one ordered list of style entries, and back again.
 *
 * Flat and ordered on purpose. A layer's sublayers are a draw order, and a
 * composite may interleave sublayers of different sources — fill from A, line
 * from B, fill from A again. Holding the entries grouped per source and
 * re-concatenating them on save would quietly restack the layer, which is a
 * change nobody asked for and nothing reports.
 */
import { decodeStyleEntry } from '../../utils/style-decoder';
import { encodeStyleEntry, type StyleEntry, type StyleSubLayer } from '../../utils/layer-style-model';
import type { LayerStyleTarget, SourceStyleGroup } from './style-context';

export interface StyleListEntry {
    entry: StyleEntry;
    /** Which source the entry draws from, in the same spelling the groups use. */
    sourceId: string;
    /**
     * False for a sublayer the styler has no role for — a raster sublayer
     * inside a composite, a type this build does not draw. It is carried
     * through untouched so that saving the list cannot drop it.
     */
    styleable: boolean;
}

/** The source id a sublayer reads, spelled as the engine registers it: `<layerId>:<key>`. */
export function sourceIdOfSubLayer(layerId: string, sublayer: StyleSubLayer): string {
    const key = typeof sublayer.source === 'string' ? sublayer.source : '';
    return key ? `${layerId}:${key}` : '';
}

const STYLEABLE_TYPES = new Set(['fill', 'line', 'circle', 'symbol', 'background']);

/**
 * The style list, read from the sublayers the map is drawing.
 *
 * `groups` is consulted only for a source's geometry, which decides whether a
 * `line` sublayer is a line or a polygon's outline — the sublayer itself cannot
 * say.
 */
export function readStyleList(
    layerId: string,
    sublayers: readonly StyleSubLayer[],
    groups: readonly SourceStyleGroup[],
): StyleListEntry[] {
    return sublayers.map((sublayer, index) => {
        const sourceId = sourceIdOfSubLayer(layerId, sublayer) || groups[0]?.sourceId || '';
        const geometry = groups.find((group) => group.sourceId === sourceId)?.geometryTypes?.join(' ');
        const styleable = STYLEABLE_TYPES.has(String(sublayer.type ?? ''));
        const entry = decodeStyleEntry(sublayer, geometry);
        // A sublayer with no id of its own still has to be addressable, because
        // an id is what a paint change is applied to. Its position is the only
        // stable name it has.
        if (!entry.id) entry.id = `${layerId}--${index}`;
        return { entry, sourceId, styleable };
    });
}

/**
 * The same list built from the style targets, for a host that cannot hand over
 * its sublayers. Editing works; adding, deleting and reordering do not, since
 * the targets are not the whole layer and saving them would drop the rest.
 */
export function readStyleListFromTargets(
    groups: readonly SourceStyleGroup[],
): StyleListEntry[] {
    const list: StyleListEntry[] = [];
    for (const group of groups) {
        const geometry = group.geometryTypes?.join(' ');
        for (const target of group.layers as LayerStyleTarget[]) {
            const sublayer: StyleSubLayer = {
                id: target.id,
                type: target.type,
                ...(target.paint ? { paint: target.paint } : {}),
                ...(target.layout ? { layout: target.layout } : {}),
            };
            list.push({ entry: decodeStyleEntry(sublayer, geometry), sourceId: group.sourceId, styleable: true });
        }
    }
    return list;
}

/** The list as sublayers again, in the order it holds them. */
export function writeStyleList(list: readonly StyleListEntry[]): StyleSubLayer[] {
    return list.map((item) => encodeStyleEntry(item.entry));
}

/** Moves an entry one place towards the front or the back of the draw order. */
export function moveEntry(list: readonly StyleListEntry[], id: string, direction: -1 | 1): StyleListEntry[] {
    const index = list.findIndex((item) => item.entry.id === id);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= list.length) return [...list];
    const moved = [...list];
    [moved[index], moved[target]] = [moved[target], moved[index]];
    return moved;
}

/**
 * Moves an entry to the other side of a named one, however far away it is.
 *
 * What the reorder arrows use, because the row above you *on screen* is not
 * your neighbour in the draw order as soon as the list is filtered. Swapping
 * with the true neighbour would move the entry past something invisible and
 * read as a button that does nothing; stepping past the nearest visible
 * neighbour instead makes the arrow mean what it shows in both cases — and when
 * nothing is filtered, that neighbour *is* the adjacent entry, so this is the
 * same move.
 */
export function moveEntryPast(list: readonly StyleListEntry[], id: string, otherId: string): StyleListEntry[] {
    const from = list.findIndex((item) => item.entry.id === id);
    const to = list.findIndex((item) => item.entry.id === otherId);
    if (from < 0 || to < 0 || from === to) return [...list];
    const moved = [...list];
    const [item] = moved.splice(from, 1);
    // `to` is an index into the list *before* the removal, so stepping towards
    // the back needs no adjustment (everything after `from` has shifted down by
    // one already) and stepping towards the front inserts at the other's place.
    moved.splice(to, 0, item);
    return moved;
}
