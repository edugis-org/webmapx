import { css, html, type LitElement, type TemplateResult } from 'lit';

/**
 * Putting a panel-hosted dialog in the browser's top layer.
 *
 * These dialogs are opened from inside `webmapx-tool-panel`, and the panel
 * applies `backdrop-filter` under the "atlas"/"glossy" style. A `backdrop-filter`
 * on an ancestor creates a containing block for `position: fixed` descendants,
 * which trapped the dialog inside the panel's box instead of centring it on the
 * viewport. The fix used to be to reparent the element to `document.body` on
 * open, which worked on a page that owns its whole viewport — and failed on a
 * page that does not:
 *
 *   A host page that opens its own modal `<dialog>` (a preview of a map inside a
 *   modal, say) puts that dialog in the top layer, which makes *everything else
 *   in the document inert*. A webmapx dialog sitting on `document.body` then
 *   rendered behind the host's dialog and could not be clicked at all — not even
 *   its own close button.
 *
 * A `<dialog>` opened with `showModal()` is in the top layer itself, and that
 * solves both problems at once, without moving the element and without a single
 * z-index:
 *
 *   - Top-layer elements are painted outside the normal paint order, so an
 *     ancestor's `backdrop-filter`, `transform`, `overflow: hidden` or stacking
 *     context no longer clips or traps them. The dialog can stay exactly where
 *     it belongs in the DOM.
 *   - Modals stack in the order they were opened, so one opened from inside a
 *     host page's modal sits above it and stays interactive.
 *
 * `showModal()` is what does this — a plain `<dialog open>` or `.show()` is *not*
 * in the top layer and would be clipped as before. Supported since Chrome 37,
 * Edge 79, Firefox 98 and Safari 15.4 (so iOS 15.4, and every iOS browser with
 * it); browsers without it fall back to showing the Shoelace dialog in place,
 * which is what they did before this existed.
 *
 * The Shoelace dialog inside draws its own overlay and owns focus, so the native
 * dialog around it is a bare, transparent frame: no chrome, no backdrop of its
 * own, and no pointer target of its own.
 */
export const topLayerDialogStyles = css`
    dialog.webmapx-top-layer {
        border: none;
        padding: 0;
        margin: 0;
        background: transparent;
        max-width: none;
        max-height: none;
        width: 0;
        height: 0;
        overflow: visible;
    }

    dialog.webmapx-top-layer::backdrop {
        background: transparent;
    }
`;

/** Wraps a dialog's contents in the frame that carries it into the top layer. */
export function topLayerDialog(content: TemplateResult): TemplateResult {
    return html`
        <dialog class="webmapx-top-layer"
                @cancel=${onNativeCancel}
                @sl-after-hide=${onDialogHidden}>${content}</dialog>
    `;
}

const FRAME = 'dialog.webmapx-top-layer';

/** Escape closes through the Shoelace dialog, so a dialog that asks before
 *  discarding still gets to ask. */
function onNativeCancel(event: Event): void {
    event.preventDefault();
    const frame = event.currentTarget as HTMLDialogElement;
    frame.querySelector<HTMLElement & { hide?: () => void }>('sl-dialog')?.hide?.();
}

/** The frame leaves the top layer when the dialog inside it has hidden —
 *  however it was closed, so no close path has to remember to do it. */
function onDialogHidden(event: Event): void {
    // sl-after-hide is not the dialog's alone: sl-dropdown, sl-tooltip and
    // friends emit it too, and theirs bubble up through this same frame.
    if ((event.target as Element | null)?.tagName !== 'SL-DIALOG') return;
    const frame = event.currentTarget as HTMLDialogElement;
    if (frame.open) frame.close();
}

/**
 * Raises a dialog component's frame into the top layer. Call it where the
 * component used to reparent itself to `document.body`.
 *
 * A component whose first render has not happened yet has no frame to raise, so
 * this waits for it rather than making every caller think about it.
 */
export function raiseToTopLayer(host: LitElement): void {
    const raise = (): void => {
        const frame = host.renderRoot?.querySelector?.<HTMLDialogElement>(FRAME);
        if (!frame || frame.open) return;
        // A pre-2022 browser without showModal() shows the dialog in place, as
        // it did before this existed.
        if (typeof frame.showModal !== 'function') return;
        frame.showModal();
    };
    if (host.hasUpdated) raise();
    else void host.updateComplete.then(raise);
}
