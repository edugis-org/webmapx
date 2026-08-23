/**
 * Finding an element without caring where it lives.
 *
 * Dialogs in this app move: a panel-hosted dialog reparents itself to
 * `document.body` when it opens, because an ancestor's backdrop-filter
 * otherwise traps a position:fixed element inside the panel (see
 * webmapx-layer-info-dialog's open()). Four UI suites addressed those dialogs
 * by DOM location — `tool.shadowRoot.querySelector(...)` — and every one of
 * them broke the day that reparenting landed, on all four engines, while the
 * app itself worked perfectly.
 *
 * Sixteen red rows for one internal change is not a test suite doing its job;
 * it is a test suite asserting implementation details. A test should say what
 * the user can do, and "the dialog is open" is true wherever the element sits.
 */

/** Defines `window.__wmxDeepQuery` in the page. */
export const DEEP_QUERY_SOURCE = `
window.__wmxDeepQuery = (selector, { open = false } = {}) => {
    const matches = [];
    const walk = (root) => {
        for (const element of root.querySelectorAll('*')) {
            if (element.matches?.(selector)) matches.push(element);
            if (element.shadowRoot) walk(element.shadowRoot);
        }
    };
    walk(document);
    // A dialog that has been opened and closed again may still be in the DOM,
    // so prefer one that is actually showing when asked for an open one.
    if (open) {
        const showing = matches.find((element) => {
            const dialog = element.shadowRoot?.querySelector('sl-dialog') ?? element;
            return dialog.open === true || element.hasAttribute?.('open') || element.visible === true;
        });
        if (showing) return showing;
    }
    return matches[0] ?? null;
};
window.__wmxDeepQueryAll = (selector) => {
    const matches = [];
    const walk = (root) => {
        for (const element of root.querySelectorAll('*')) {
            if (element.matches?.(selector)) matches.push(element);
            if (element.shadowRoot) walk(element.shadowRoot);
        }
    };
    walk(document);
    return matches;
};
`;

/**
 * Makes `__wmxDeepQuery` available for the rest of the run, including after
 * navigations — suites that reload (permalink restore, projection switches)
 * would otherwise lose it half way through.
 */
export async function installDeepQuery(page) {
    await page.addInitScript(DEEP_QUERY_SOURCE);
    await page.evaluate(DEEP_QUERY_SOURCE);
}
