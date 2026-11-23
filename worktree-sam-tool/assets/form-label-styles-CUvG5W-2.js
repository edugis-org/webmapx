import{x as e}from"./vendor-lit-DP8NDNGT.js";var t=e`
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

    /* An icon button in a row of controls (a play row, the search field's
       magnifier, a refresh beside a dropdown): the small Shoelace button made
       square, so it is exactly as high as the fields beside it, in every
       style. A held step button must not also select text or scroll. */
    sl-button.icon-only {
        touch-action: manipulation;
        -webkit-user-select: none;
        user-select: none;
    }
    sl-button.icon-only::part(base) {
        width: var(--sl-input-height-small, 1.875rem);
    }
    sl-button.icon-only::part(label) {
        padding: 0;
        display: inline-flex;
        align-items: center;
        justify-content: center;
    }

    /* Text for screen readers only — the name of an icon button. A Shoelace
       button does not pass an aria-label on to the button inside it. */
    .visually-hidden {
        position: absolute;
        width: 1px;
        height: 1px;
        overflow: hidden;
        clip: rect(0 0 0 0);
        white-space: nowrap;
    }

    .label-hidden::part(form-control-label) {
        position: absolute;
        width: 1px;
        height: 1px;
        overflow: hidden;
        clip: rect(0 0 0 0);
        white-space: nowrap;
    }
`;export{t};