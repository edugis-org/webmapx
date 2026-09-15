/**
 * Level 5: the leaf controls, and what each channel's numbers mean.
 *
 * Ranges are per channel rather than per role because a halo and a line width
 * are both "a width" and want nothing like the same slider: 0–4px against
 * 0.5–12px. They gate nothing, so they are never a step — always rendered,
 * always open.
 */
import type { ChannelId, ChannelState } from '../../utils/layer-style-model';

export interface ChannelRange {
    min: number;
    max: number;
    step: number;
    unit: string;
}

/** Channels edited as a number, and the range offered for each. */
export const CHANNEL_RANGES: Partial<Record<ChannelId, ChannelRange>> = {
    opacity: { min: 0, max: 1, step: 0.05, unit: '' },
    width: { min: 0.5, max: 12, step: 0.5, unit: ' px' },
    radius: { min: 1, max: 30, step: 1, unit: ' px' },
    strokeWidth: { min: 0, max: 6, step: 0.5, unit: ' px' },
    textSize: { min: 8, max: 40, step: 1, unit: ' px' },
    haloWidth: { min: 0, max: 4, step: 0.2, unit: ' px' },
};

/**
 * What a channel is drawn with when the layer says nothing about it.
 *
 * These are the GL spec's own defaults, and they are not cosmetic: falling back
 * to the slider's *minimum* instead told the user a layer with no
 * `line-opacity` was drawn at 0 — reading as "this style is invisible" for a
 * line the map was drawing at full strength, and inviting them to fix a problem
 * that did not exist.
 */
export const CHANNEL_DEFAULTS: Partial<Record<ChannelId, number>> = {
    opacity: 1,
    width: 1,
    radius: 5,
    strokeWidth: 0,
    textSize: 16,
    haloWidth: 0,
};

/** Channels edited as a colour. */
export const COLOR_CHANNELS: ChannelId[] = ['color', 'strokeColor', 'haloColor', 'fillOutline'];

export const CHANNEL_LABELS: Record<ChannelId, string> = {
    color: 'Colour',
    opacity: 'Opacity',
    width: 'Width',
    radius: 'Size',
    dash: 'Pattern',
    fillOutline: 'Edge',
    lineJoin: 'Corners',
    lineCap: 'Ends',
    strokeColor: 'Outline colour',
    strokeWidth: 'Outline width',
    text: 'Text',
    textSize: 'Text size',
    haloColor: 'Halo colour',
    haloWidth: 'Halo width',
    font: 'Font',
    placement: 'Placement',
    anchor: 'Position',
    offset: 'Distance',
    allowOverlap: 'Overlap',
};

/**
 * Dash patterns, as the few a map actually uses.
 *
 * A dash array is a list of lengths in line widths, so these read the same at
 * any weight — and a free-text array would be a control nobody can judge the
 * result of without drawing it.
 *
 * Offered on the `line` role only, never on `outline`: a polygon carries the
 * whole of its own ring, so a border shared by two areas exists twice in the
 * data and is stroked twice. Each stroke starts its own dash phase and the two
 * run in opposite directions, so the dashes interleave — the border comes out
 * as noise, or as a solid line where they happen to fill each other's gaps, and
 * a translucent one doubles its opacity along exactly those edges. Nothing in
 * the paint can fix it: it is two features, each drawn correctly. See the
 * channel order in `layer-style-model.ts`.
 */
export const DASH_PRESETS: { label: string; value: number[] | null }[] = [
    { label: 'Solid', value: null },
    { label: 'Dashed', value: [2, 2] },
    { label: 'Dotted', value: [0.5, 2] },
    { label: 'Dash-dot', value: [4, 2, 0.5, 2] },
];

export function dashLabel(state: ChannelState | undefined): string {
    if (!state || state.driver !== 'single') return state ? 'Custom' : 'Solid';
    const value = Array.isArray(state.value) ? [...state.value] : null;
    if (!value) return 'Solid';
    const match = DASH_PRESETS.find((preset) => preset.value && preset.value.join() === value.join());
    return match ? match.label : 'Custom';
}

/** The column a `text-field` reads, when it reads exactly one. */
export function textColumnOf(state: ChannelState | undefined): string | null {
    if (!state) return null;
    if (state.driver === 'single' && typeof state.value === 'string') {
        // `{name}` is the old token spelling, still common in authored configs.
        const token = /^\{([^{}]+)\}$/.exec(state.value);
        return token ? token[1] : null;
    }
    if (state.driver !== 'custom') return null;
    const expression = state.expression;
    return Array.isArray(expression) && expression[0] === 'get' && typeof expression[1] === 'string'
        ? expression[1]
        : null;
}

/** A label channel set to one column. */
export function textColumnState(column: string): ChannelState {
    return { driver: 'custom', expression: ['get', column] };
}
