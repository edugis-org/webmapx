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
 *
 * A field that deliberately shows no label (the field is the tool, or the
 * description sentence or a section heading already names it) still needs a
 * name for screen readers. On a Shoelace control that name *is* its `label`
 * — an aria-label on the host does not reach the inner input, and a native
 * <label for> cannot point into its shadow root — so it keeps the label and
 * takes `label-hidden`, which hides it visually but not from assistive
 * technology.
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

    /* The speed of a play row ("‹ ▶ ›  [1 hour ▾] per second"): "per second" is
       the field's own label, shown after the field rather than above it. A
       label kept only for screen readers is not enough on a dropdown — axe's
       label-title-only wants it visible — and here the visible text was
       already there, so it simply became the label. One width and one look
       in every tool with a play row. */
    sl-select.speed {
        flex: 0 0 auto;
    }
    sl-select.speed::part(form-control) {
        display: flex;
        flex-direction: row-reverse;
        justify-content: flex-end;
        align-items: center;
        gap: 0.5rem;
    }
    sl-select.speed::part(form-control-input) {
        width: 7.5rem;
    }
    sl-select.speed::part(form-control-label) {
        margin: 0;
        font-size: var(--webmapx-font-size-md, 0.875rem);
        font-weight: 400;
        white-space: nowrap;
        color: var(--color-text-secondary, #5a6773);
    }

    .label-hidden::part(form-control-label) {
        position: absolute;
        width: 1px;
        height: 1px;
        overflow: hidden;
        clip: rect(0 0 0 0);
        white-space: nowrap;
    }
`;
