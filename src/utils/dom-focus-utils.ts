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

/** Input types that take typed text, where Backspace deletes a character. */
const TEXT_INPUT_TYPES = new Set([
    'text', 'search', 'email', 'number', 'password', 'tel', 'url',
    'date', 'datetime-local', 'month', 'time', 'week',
]);

/**
 * True only when the event comes from somewhere text is being typed.
 *
 * Narrower than `isEventFromEditableElement`, on purpose: a slider, radio
 * button or Shoelace select is an `<input>` too (range, radio, a readonly
 * text box), and after clicking one, focus stays there. Arrow keys belong to
 * such a control, but Backspace does nothing in it — so a tool's
 * "Backspace undoes" must not be switched off by it.
 */
export function isEventFromTextEntry(event: Event): boolean {
    const path = typeof event.composedPath === 'function' ? event.composedPath() : [event.target];
    for (const node of path) {
        const el = node as HTMLElement | null;
        if (!el || typeof el.tagName !== 'string') continue;
        const tag = el.tagName.toLowerCase();
        if (tag === 'textarea') return !(el as HTMLTextAreaElement).readOnly;
        if (tag === 'input') {
            const input = el as HTMLInputElement;
            return TEXT_INPUT_TYPES.has((input.type || 'text').toLowerCase()) && !input.readOnly;
        }
        if (el.isContentEditable) return true;
    }
    return false;
}
