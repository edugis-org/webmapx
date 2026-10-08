import { html, type TemplateResult } from 'lit';
import '@shoelace-style/shoelace/dist/components/tooltip/tooltip.js';
import '@shoelace-style/shoelace/dist/components/icon-button/icon-button.js';

/**
 * The explanation of a field, behind an (i) at the right end of its label line.
 *
 * Explanations ("Geodesic keeps the true shape on the globe…") are read by the
 * few who wonder, at the moment they wonder, so they wait next to the field they
 * explain instead of taking a line under every field. The panel stays calm and
 * the answer is still next to the question. What to do next is not an
 * explanation: that is the tool's tip under the panel (`internal/tool-tip.ts`).
 *
 * Put it inside an element with class `field-with-info` that also holds the
 * field; `helpTextStyles` places it. It sits beside the label rather than in it:
 * a button inside a Shoelace field's label becomes part of the field's
 * accessible name ("Method About Method").
 *
 * Opens on hover, on keyboard focus and on a click or tap (there is no hover on
 * a touch screen); Escape closes it, before it closes the panel.
 */
export function infoToggle(field: string, explanation: string | TemplateResult): TemplateResult {
    return html`
        <sl-tooltip class="info-toggle" hoist placement="top-end" trigger="hover focus click">
            <div slot="content" class="info-toggle-text">${explanation}</div>
            <sl-icon-button name="info-circle" label=${`About ${field}`}></sl-icon-button>
        </sl-tooltip>
    `;
}

/**
 * Whether an explanation is open inside `root`. Anything that closes on Escape
 * asks this first, so Escape closes the explanation and leaves the rest alone.
 */
export function hasOpenInfo(root: ParentNode | null | undefined): boolean {
    return Boolean(root?.querySelector('sl-tooltip.info-toggle[open]'));
}
