/**
 * What a style entry is *called*, and what a new one starts as.
 *
 * Both are pure functions of the model, deliberately: the level-1 list is the
 * only thing standing between a user and the entry they want, so its summary
 * lines are worth testing, and "adding a style draws something immediately" is
 * a requirement of the specification rather than a property of some panel's
 * event handler.
 */
import { DATA_OUTLINE, DATA_START } from '../../theme/data-colors';
import {
    channelsOf,
    type ChannelId,
    type ChannelState,
    type StyleEntry,
    type StyleRole,
} from '../../utils/layer-style-model';
import { metadataLabel } from '../../utils/layer-label';

export const ROLE_LABELS: Record<StyleRole, string> = {
    fill: 'Fill',
    outline: 'Outline',
    line: 'Line',
    circle: 'Points',
    label: 'Labels',
    background: 'Background',
};

/**
 * Roles a source's geometry can be drawn as, in the order the specification
 * lists them.
 *
 * Outline comes first for polygons, and a new polygon style starts with one:
 * coloured areas with no visible boundary are unreadable as a map — neighbours
 * merge into one blob and the reader cannot tell whether two areas are one
 * feature or two.
 */
export function rolesForGeometry(geometryTypes: readonly string[]): StyleRole[] {
    const has = (pattern: RegExp) => geometryTypes.some((type) => pattern.test(type));
    const roles: StyleRole[] = [];
    // A source holding more than one geometry — ordinary in imported and drawn
    // data — offers all of their roles rather than only the first one found.
    if (has(/polygon/i)) roles.push('outline', 'fill', 'label');
    if (has(/linestring/i)) roles.push('line', 'label');
    if (has(/point/i)) roles.push('circle', 'label');
    if (roles.length === 0) return ['fill', 'outline', 'line', 'circle', 'label'];
    return roles.filter((role, index) => roles.indexOf(role) === index);
}

/** A colour a channel is showing, when it is showing exactly one. */
export function singleColorOf(state: ChannelState | undefined): string | null {
    return state?.driver === 'single' && typeof state.value === 'string' ? state.value : null;
}

/**
 * The colours a channel draws with, for the swatch beside an entry's name.
 *
 * A classified channel has no single colour, and leaving its swatch blank made
 * a classified entry look like the one thing it is not — unstyled. The palette
 * itself is the honest answer, and it is the same information the legend shows.
 */
export function swatchColorsOf(state: ChannelState | undefined): string[] {
    const single = singleColorOf(state);
    if (single) return [single];
    if (state?.driver === 'neighbours') return [...state.colors].slice(0, 6);
    if (state?.driver === 'attribute' && state.classification.kind !== 'proportional') {
        const colors = state.classification.colors;
        // At most six: the swatch is a hint at a distance, not a legend, and a
        // nine-class ramp squeezed into 14px is a smear.
        if (colors.length <= 6) return [...colors];
        const step = (colors.length - 1) / 5;
        return Array.from({ length: 6 }, (_, i) => colors[Math.round(i * step)]);
    }
    return [];
}

/**
 * The one line the collapsed entry shows.
 *
 * It has to say enough to *skip* the entry: `Fill — by population density, 5
 * classes` is why the user does not need to open it, and a summary reading
 * `Fill` is not. A filter or a zoom range is named too, because an entry that
 * draws nothing because of either is otherwise indistinguishable from a broken
 * one.
 */
export function summarizeEntry(entry: StyleEntry): string {
    const parts: string[] = [];
    for (const channel of channelsOf(entry.role)) {
        const described = describeChannel(entry.role, channel, entry.channels[channel]);
        if (described) parts.push(described);
    }
    const scope: string[] = [];
    if (entry.filter !== undefined) scope.push('filtered');
    if (entry.minzoom !== undefined || entry.maxzoom !== undefined) {
        scope.push(zoomRangeLabel(entry.minzoom, entry.maxzoom));
    }
    const detail = [...parts.slice(0, 2), ...scope].join(', ');
    return detail ? `${ROLE_LABELS[entry.role]} — ${detail}` : ROLE_LABELS[entry.role];
}

function zoomRangeLabel(minzoom: number | undefined, maxzoom: number | undefined): string {
    if (minzoom !== undefined && maxzoom !== undefined) return `z${minzoom}–${maxzoom}`;
    if (minzoom !== undefined) return `z${minzoom}+`;
    return `to z${maxzoom}`;
}

function describeChannel(role: StyleRole, channel: ChannelId, state: ChannelState | undefined): string | null {
    if (!state) return null;
    if (state.driver === 'custom') return channel === 'color' ? 'a custom expression' : null;
    if (state.driver === 'neighbours') return 'no two neighbours alike';
    if (state.driver === 'attribute') {
        const classification = state.classification;
        if (classification.kind === 'proportional') return `sized by ${state.attribute}`;
        const count = classification.kind === 'ranges'
            ? classification.colors.length
            : classification.values.length;
        const noun = classification.kind === 'ranges' ? 'classes' : 'categories';
        const scheme = state.schemeName ? `, ${state.schemeName}` : '';
        return `by ${state.attribute}, ${count} ${noun}${scheme}`;
    }
    // A single value is worth naming only where it is what the user would
    // recognise the entry by: its colour, and its weight.
    if (channel === 'color') return typeof state.value === 'string' ? state.value : null;
    if (channel === 'width' || channel === 'radius' || channel === 'textSize') {
        return typeof state.value === 'number' ? `${state.value}px` : null;
    }
    if (channel === 'text' && typeof state.value === 'string') return state.value;
    return null;
}

/**
 * The name an authored sublayer already has, or `null` when its id says nothing.
 *
 * A hand-written style names its sublayers — `place_label_city`,
 * `road_motorway_casing` — and that name is the only thing telling seven label
 * entries apart: by role and paint they are identical ("Labels — #000,
 * filtered, to z9", seven times over). An id the app generated is not a name,
 * so it is not shown as one.
 */
export function entryName(entry: StyleEntry, layerId: string): string | null {
    const metadata = entry.origin?.metadata && typeof entry.origin.metadata === 'object'
        ? entry.origin.metadata as Record<string, unknown>
        : null;
    const authoredLabel = metadataLabel(metadata);
    if (authoredLabel) return authoredLabel;

    const id = entry.id;
    if (!id || id === layerId) return null;
    if (id.startsWith(`${layerId}--`)) return null;
    // `style:` is the prefix a fetched style document's layers are registered
    // under; it is on every row, so it distinguishes nothing.
    let trimmed = id.replace(/^style:/, '');
    // Neither does the layer's own id, which a dropped file's sublayers repeat
    // in full: `NUTS_RG_01M_2024_4326_LEVL_3_uk_stats:NUTS_…_stats-line` says
    // "line" and spends forty characters doing it.
    if (trimmed.startsWith(layerId)) {
        const rest = trimmed.slice(layerId.length).replace(/^[:\-_.]+/, '');
        if (rest) trimmed = rest;
    }
    // What is left may be nothing but the role, which the summary line says
    // already — two words for one fact reads as two different things.
    const generic = new Set<string>(['fill', 'line', 'outline', 'circle', 'symbol', 'label', 'labels', 'background', 'point', 'points']);
    if (trimmed === layerId || generic.has(trimmed.toLowerCase())) return null;
    return trimmed;
}

/**
 * A new style entry, drawing immediately.
 *
 * There is never a state where the panel is waiting for an answer before the
 * map will draw: role from the geometry, driver `single`, a colour from the
 * data palette, a default width. Everything after this is refinement.
 */
export function defaultEntry(role: StyleRole, id: string): StyleEntry {
    const channels: Partial<Record<ChannelId, ChannelState>> = {};
    switch (role) {
        case 'fill':
            channels.color = { driver: 'single', value: DATA_START };
            break;
        case 'outline':
            channels.color = { driver: 'single', value: DATA_OUTLINE };
            channels.width = { driver: 'single', value: 1 };
            // Round by default: the GL defaults spike every corner of a thick
            // line, which is what a user reads as "the line is not smooth".
            channels.lineJoin = { driver: 'single', value: 'round' };
            channels.lineCap = { driver: 'single', value: 'round' };
            break;
        case 'line':
            channels.color = { driver: 'single', value: DATA_START };
            channels.width = { driver: 'single', value: 2 };
            channels.lineJoin = { driver: 'single', value: 'round' };
            channels.lineCap = { driver: 'single', value: 'round' };
            break;
        case 'circle':
            channels.color = { driver: 'single', value: DATA_START };
            channels.radius = { driver: 'single', value: 5 };
            channels.strokeColor = { driver: 'single', value: DATA_OUTLINE };
            channels.strokeWidth = { driver: 'single', value: 1 };
            break;
        case 'label':
            channels.textSize = { driver: 'single', value: 12 };
            channels.color = { driver: 'single', value: DATA_OUTLINE };
            // A label over satellite imagery is unreadable without a halo, so
            // one is part of what a label *is* rather than something to add.
            channels.haloColor = { driver: 'single', value: '#ffffff' };
            channels.haloWidth = { driver: 'single', value: 1.4 };
            break;
        case 'background':
            channels.color = { driver: 'single', value: DATA_START };
            break;
    }
    return { id, role, channels };
}

/**
 * An id for a style entry the user added.
 *
 * It has to be unique within the layer *and* stable for as long as the entry
 * lives, because it is what a paint change is addressed to. The counter is the
 * number of entries the list already holds, so the ids read in the order they
 * were made rather than as timestamps.
 */
export function nextEntryId(layerId: string, taken: readonly string[]): string {
    for (let index = taken.length + 1; ; index++) {
        const id = `${layerId}--style-${index}`;
        if (!taken.includes(id)) return id;
    }
}

/** A copy of an entry under a new id — the whole railway-casing workflow. */
export function duplicateEntry(entry: StyleEntry, id: string): StyleEntry {
    return {
        id,
        role: entry.role,
        channels: JSON.parse(JSON.stringify(entry.channels)) as StyleEntry['channels'],
        ...(entry.filter === undefined ? {} : { filter: JSON.parse(JSON.stringify(entry.filter)) as unknown }),
        ...(entry.minzoom === undefined ? {} : { minzoom: entry.minzoom }),
        ...(entry.maxzoom === undefined ? {} : { maxzoom: entry.maxzoom }),
        // Deliberately no `origin`: a duplicate is a new sublayer, so every
        // channel it carries must be written out rather than left to the
        // sublayer it was copied from, which belongs to the other entry.
    };
}
