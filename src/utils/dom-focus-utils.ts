/**
 * True when a keyboard/other event originated from a text-editable element — an `<input>`,
 * `<textarea>`, `<select>`, or `contenteditable` node — including when that element lives
 * inside a shadow root (e.g. Shoelace's `<sl-input>`). `event.target` gets retargeted to the
 * shadow host for listeners attached outside the shadow tree, so checking it directly misses
 * shadow-DOM inputs; `composedPath()` walks the real path and finds the actual element.
 */
export function isEventFromEditableElement(event: Event): boolean {
    const path = typeof event.composedPath === 'function' ? event.composedPath() : [event.target];
    for (const node of path) {
        const el = node as HTMLElement | null;
        if (!el || typeof el.tagName !== 'string') continue;
        const tag = el.tagName.toLowerCase();
        if (tag === 'input' || tag === 'textarea' || tag === 'select') return true;
        if (el.isContentEditable) return true;
    }
    return false;
}
