import { css } from 'lit';

/**
 * Help and instruction text in a tool panel, one look for every tool.
 *
 * This is the quiet text that tells you what to do next ("Click the map to
 * set the start point."), explains a field or the option chosen in it, or
 * says why there is nothing to show yet ("Add a layer with countries or
 * areas to the map first."). Native elements take the `help-text` class;
 * Shoelace controls get the same look through their `form-control-help-text`
 * part.
 *
 * Small, regular weight, upright, secondary colour. It shares the size of a
 * field label and is set apart from it by weight alone (labels are
 * semi-bold). It is not italic: italic is harder to read at this size, and
 * the tools that used it (Feature info, Measure, True area) did not mean
 * anything by it that the others did not. The size comes from the active
 * style's scale, so console's help text shrinks with its labels.
 *
 * Margins stay with each tool, since they depend on what sits around the
 * text. Status and progress messages, warnings and value readouts are not
 * help text and keep their own look.
 */
export const helpTextStyles = css`
    .help-text,
    sl-input::part(form-control-help-text),
    sl-select::part(form-control-help-text),
    sl-textarea::part(form-control-help-text),
    sl-range::part(form-control-help-text),
    sl-radio-group::part(form-control-help-text) {
        font-size: var(--webmapx-font-size-sm, 0.75rem);
        font-weight: 400;
        font-style: normal;
        line-height: 1.45;
        color: var(--color-text-secondary, #5a6773);
    }

    /* An explanation behind an (i) (internal/info-toggle.ts): the icon sits at
       the right end of the field's label line, the same place in every field.
       The button is 24px square, the smallest target WCAG allows, pulled out
       by its padding so the icon itself lines up with the label text. */
    .field-with-info {
        position: relative;
    }

    /* sl-tooltip draws no box of its own (display: contents), so the button
       is what gets placed. */
    .info-toggle {
        --max-width: 16rem;
    }

    .info-toggle > sl-icon-button {
        font-size: var(--webmapx-font-size-md, 0.875rem);
        color: var(--color-primary, #1b6ec2);
    }

    .field-with-info > .info-toggle > sl-icon-button {
        position: absolute;
        top: -5px;
        right: -5px;
    }

    .info-toggle > sl-icon-button::part(base) {
        padding: 5px;
    }

    .info-toggle-text {
        font-size: var(--webmapx-font-size-sm, 0.75rem);
        line-height: 1.45;
    }
`;
