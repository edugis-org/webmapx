/**
 * The one colour picker.
 *
 * The legend's inline editor grew a Pickr popup with a palette that includes
 * black, white and transparent; the styling panel started with a bare
 * `<input type="color">`, which offers none of those (a native picker cannot
 * express transparent at all). Two pickers in one product is one too many, so
 * this is the shared one and both call it.
 *
 * Pickr renders its popup into `document.body`, which is what makes it work from
 * inside a shadow root — and inside `sl-dialog`, where an `<input type="color">`
 * would open a browser-chrome panel the page has no say over.
 *
 * `document.body` is also why the popup needs raising: the panels that open it
 * are in the browser's top layer (the style panel is a popover, the dialogs are
 * modal `<dialog>`s), and nothing painted by z-index can rise above the top
 * layer. The popup appeared *under* the map. So it joins the top layer too —
 * see raisePopup() below.
 */
import Pickr from '@simonwep/pickr';
import '@simonwep/pickr/dist/themes/nano.min.css';

/**
 * Ready-made colours, ending with transparent.
 *
 * Transparent earns its place: "no fill, outline only" is a real cartographic
 * choice and there is no other way to say it.
 */
export const COLOR_PALETTE = [
    '#000000', '#ffffff', '#7f7f7f', '#ff0000', '#ff8000', '#ffff00',
    '#00ff00', '#008000', '#00ffff', '#0000ff', '#8000ff', '#ff00ff',
    'rgba(0,0,0,0)',
];

export interface ColorPickerOptions {
    /** The element the popup hangs off; it doubles as the swatch. */
    button: HTMLElement;
    value: string;
    /** Called on every change, including while dragging — apply live. */
    onChange: (rgba: string) => void;
    /** Called when the picker is cancelled, with the value it opened on. */
    onCancel?: (original: string) => void;
    /** Paints the picked colour onto the button. */
    paintButton?: boolean;
}

/**
 * Creates a Pickr bound to `button`, or re-points an existing one at a new
 * value. Returns the instance so the caller can keep it and destroy it.
 */
export function createColorPicker(options: ColorPickerOptions): Pickr {
    const { button, value, onChange, paintButton = true } = options;

    const pickr = Pickr.create({
        el: button,
        theme: 'nano',
        default: value,
        useAsButton: true,
        comparison: false,
        appClass: 'webmapx-pickr',
        // Pickr's own repositioning writes document coordinates into
        // `position: absolute`. A top-layer popover is positioned against the
        // viewport instead, so the placement here is ours to do — see
        // placeAtButton() — and Pickr's must be off or the two fight on scroll.
        autoReposition: false,
        swatches: COLOR_PALETTE,
        components: {
            preview: true,
            opacity: true,
            hue: true,
            interaction: { input: true, cancel: true, save: true, rgba: false, hsla: false, hsva: false, cmyk: false, hex: false },
        },
    });

    raiseColorPickerPopup(pickr, button);

    let original = value;
    pickr.on('change', (color: Pickr.HSVaColor) => {
        const rgba = color.toRGBA().toString(0);
        if (paintButton) button.style.background = rgba;
        onChange(rgba);
    });
    pickr.on('save', () => {
        original = pickr.getColor()?.toRGBA().toString(0) ?? original;
        pickr.hide();
    });
    pickr.on('cancel', () => {
        if (paintButton) button.style.background = original;
        options.onCancel?.(original);
        pickr.hide();
    });

    return pickr;
}

/**
 * Carries the popup into the top layer, above whatever opened it.
 *
 * The style panel is a popover and the layer dialogs are modal `<dialog>`s, so
 * both paint in the top layer. Pickr's popup lives on `document.body` with a
 * z-index, and z-index cannot reach past the top layer at all — the popup opened
 * under the map, which is where this started.
 *
 * Making the popup a popover of its own puts it in the same layer, and top-layer
 * elements stack in the order they were shown: opened from the panel, it comes
 * after it, so it lands on top. `manual` because Pickr owns its own dismissal
 * (Save, Cancel, click-outside); `auto` would light-dismiss the panel underneath
 * along with it.
 *
 * A browser without popover support keeps what it had: `document.body` and a
 * z-index, which is correct everywhere except above the top layer.
 */
export function raiseColorPickerPopup(pickr: Pickr, button: HTMLElement): void {
    const app = (pickr.getRoot() as { app?: HTMLElement }).app;
    if (!app || typeof app.showPopover !== 'function') return;

    app.popover = 'manual';
    // The UA stylesheet dresses a popover as a dialog box: `border: solid`
    // (medium — a 3px black frame), `padding: 0.25em`, `overflow: auto`. The
    // nano theme sets none of those on .pcr-app, so the UA's win and the panel
    // gains a black border it never had. Only those three are undone: the
    // theme's own background and box-shadow are what should show, and setting
    // either here would override the stylesheet that draws them.
    app.style.border = '0';
    app.style.padding = '0';
    app.style.overflow = 'visible';

    pickr.on('show', () => {
        moveIntoEnclosingModal(app, button);
        if (!app.matches(':popover-open')) app.showPopover();
        placeAtButton(app, button);
    });
    pickr.on('hide', () => {
        if (app.matches(':popover-open')) app.hidePopover();
    });
}

/**
 * Moves the popup inside the modal `<dialog>` the map is embedded in, if there
 * is one.
 *
 * A modal dialog makes the rest of the document inert, and the top layer does
 * not exempt a popover from that — inertness follows the DOM, not the paint
 * order. Pickr builds its popup on `document.body`, so a map inside a host
 * page's own modal dialog (a layer repository's preview, `testpages/
 * embedded-in-modal.html`) got a popup that was painted correctly and could not
 * be clicked: the pointer fell straight through to the map canvas behind it, and
 * Pickr's own outside-click handler then saw a path without the popup in it and
 * closed. Clicking anywhere on the picker dismissed it.
 *
 * Re-parenting into the dialog makes it a descendant, so it is live again. Only
 * a dialog in the light DOM will do: the nano theme is a document stylesheet,
 * and inside a shadow root the popup would come out unstyled. Our own modal
 * dialogs live in shadow roots, but none of them holds a colour picker — the
 * style panel and the legend's inline editor are popovers, which make nothing
 * inert.
 */
function moveIntoEnclosingModal(app: HTMLElement, button: HTMLElement): void {
    const dialog = enclosingModalDialog(button);
    const target = dialog ?? document.body;
    if (app.parentElement === target) return;
    // A popover cannot be moved while it is open: re-parenting removes it from
    // the top layer, and the class Pickr paints `visible` with would remain.
    if (app.matches(':popover-open')) app.hidePopover();
    target.appendChild(app);
}

/**
 * The nearest open modal `<dialog>` above `el`, crossing shadow boundaries, or
 * null. Only a dialog in the document's own tree counts — see above.
 */
function enclosingModalDialog(el: Element): HTMLDialogElement | null {
    let node: Node | null = el;
    while (node) {
        if (node instanceof ShadowRoot) { node = node.host; continue; }
        if (!(node instanceof Element)) return null;
        const dialog: HTMLDialogElement | null = node.closest('dialog');
        if (!dialog) {
            const root = node.getRootNode();
            if (!(root instanceof ShadowRoot)) return null;
            node = root;
            continue;
        }
        if (dialog.matches(':modal') && dialog.getRootNode() === document) return dialog;
        node = dialog.parentNode;
    }
    return null;
}

/**
 * Puts the popup beside its swatch, in viewport coordinates.
 *
 * A popover is positioned against the viewport, not the document, so the button's
 * `getBoundingClientRect()` is already in the right frame. Below the button by
 * default, above it when there is no room below, and never off either edge —
 * these open from a panel that can sit anywhere on the map.
 */
function placeAtButton(app: HTMLElement, button: HTMLElement): void {
    const rect = button.getBoundingClientRect();
    // Measured after showPopover(), so the popup has its size.
    const { width, height } = app.getBoundingClientRect();
    const gap = 6;

    const below = rect.bottom + gap;
    const top = below + height <= window.innerHeight ? below
        : Math.max(gap, rect.top - gap - height);
    const left = Math.min(Math.max(gap, rect.left), window.innerWidth - width - gap);

    app.style.position = 'fixed';
    app.style.margin = '0';
    app.style.inset = 'auto';
    app.style.left = `${left}px`;
    app.style.top = `${top}px`;
}
