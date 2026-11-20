import { h as e } from "./decorators-d8E4nZJy.js";
//#region src/components/internal/help-text-styles.ts
var t = e`
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
//#endregion
export { t };
