import { css } from 'lit';

/**
 * The two kinds of label a tool panel has, one look each, for every tool.
 *
 * A **field label** names the field below it ("Input layer", "Buffer
 * distance", "Service"): small, semi-bold, secondary colour — quiet, so the
 * fields and their values carry the panel. It is set apart from a section
 * heading (also small, semi-bold, secondary) by case: headings are uppercase.
 * Native labels take the `field-label` class; Shoelace controls get the same
 * look through their `form-control-label` part, scoped to the tools that
 * include this sheet rather than changed globally, so dialogs elsewhere keep
 * Shoelace's own.
 *
 * An **option label** is the text of a checkbox or switch ("Track me", "Log
 * scale", "Now"): it reads as content, so it is the body size, regular weight
 * and the primary colour.
 *
 * Sizes come from the active style's scale (`--webmapx-font-size-sm`/`-md`),
 * so console gets smaller labels and a future style gets its own, with no
 * tool touched.
 */
export const formLabelStyles = css`
    .field-label,
    sl-input::part(form-control-label),
    sl-select::part(form-control-label),
    sl-textarea::part(form-control-label),
    sl-range::part(form-control-label),
    sl-radio-group::part(form-control-label) {
        font-size: var(--webmapx-font-size-sm, 0.75rem);
        font-weight: 600;
        line-height: 1.4;
        color: var(--color-text-secondary, #5a6773);
    }

    .option-label,
    sl-checkbox::part(label),
    sl-switch::part(label) {
        font-size: var(--webmapx-font-size-md, 0.875rem);
        font-weight: 400;
        color: var(--color-text-primary, #16202a);
    }
`;
