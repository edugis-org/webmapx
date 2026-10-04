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

    /* The options of an open dropdown at the field's own size. Shoelace draws
       every option at its *medium* size whatever the select's size, so a
       small field showed "Español" at 14px and its list at 16px — the list
       looked like it belonged to a larger field. Taking the small field's
       own font size keeps the two equal in every style (console's fields
       are smaller, so are its options). */
    sl-select[size="small"] sl-option::part(base) {
        font-size: var(--sl-input-font-size-small, 0.875rem);
    }

    /* No text cursor in a dropdown's value. Shoelace shows the chosen option
       in a read-only input, and focus returns there after choosing, so the
       browser drew a blinking cursor as if the value could be typed over.
       The focus ring still shows where focus is. */
    sl-select::part(display-input) {
        caret-color: transparent;
    }

    /* An open list keeps clear of its field's focus ring. Shoelace places the
       list flush against the field, over the bottom of the 3px ring; the gap
       is on both sides so it holds when the list flips above the field. */
    sl-select::part(listbox) {
        margin-block: 0.375rem;
    }

    /* The speed of a play row ("1 hour per second"): an ordinary labelled
       field above the row of play buttons, full width, the same in every tool
       with a play row. (Inside the row it pushed "per second" out of the
       panel and lost its border.) */
    sl-select.speed {
        display: block;
        width: 100%;
        margin-bottom: 0.5rem;
    }

    /* Sliders stay the browser's own (a range input is fine as it is, and the
       tools draw value readouts around it), but in the colour Shoelace gives
       a checked checkbox, a selected option and the m/km switch — so what is
       "on" or "set" in a panel is one blue, not the browser's default one. */
    input[type="range"] {
        accent-color: var(--sl-color-primary-600, #0284c7);
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
