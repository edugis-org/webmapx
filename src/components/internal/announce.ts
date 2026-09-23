/**
 * Says something to screen-reader users without moving focus: "3 results",
 * "Distance 12.4 km", "Route: 5.2 km, 14 min".
 *
 * A tool's result otherwise appears silently in its panel, so someone who
 * cannot see it has no way to know the search finished or the click found
 * nothing. One polite live region per map carries every tool's message.
 *
 * The region lives inside the nearest `<webmapx-map>`, not on `<body>`: when a
 * host page shows the map in its own modal `<dialog>`, everything outside that
 * dialog is inert, and a live region there is never read. A tool outside any
 * map (`map="#selector"`) falls back to `<body>`.
 */

const REGION_CLASS = 'webmapx-live-region';

const VISUALLY_HIDDEN = [
    'position:absolute', 'width:1px', 'height:1px', 'margin:-1px', 'padding:0',
    'overflow:hidden', 'clip:rect(0 0 0 0)', 'white-space:nowrap', 'border:0',
].join(';');

function regionFor(source: Element): HTMLElement {
    const host = (source.closest('webmapx-map') as HTMLElement | null) ?? document.body;
    let region = Array.from(host.children).find((child) => child.classList.contains(REGION_CLASS)) as HTMLElement | undefined;
    if (!region) {
        region = document.createElement('div');
        region.className = REGION_CLASS;
        region.setAttribute('role', 'status');
        region.setAttribute('aria-live', 'polite');
        region.setAttribute('aria-atomic', 'true');
        region.style.cssText = VISUALLY_HIDDEN;
        host.appendChild(region);
    }
    return region;
}

const pending = new WeakMap<HTMLElement, ReturnType<typeof setTimeout>>();

export function announce(source: Element, message: string): void {
    if (typeof document === 'undefined' || !message) return;
    const region = regionFor(source);
    // Emptied first and filled a moment later: a live region only speaks when
    // its content changes, so the same message twice ("No results") would
    // otherwise be read once.
    region.textContent = '';
    clearTimeout(pending.get(region));
    pending.set(region, setTimeout(() => { region.textContent = message; }, 60));
}
