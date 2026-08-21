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
        swatches: COLOR_PALETTE,
        components: {
            preview: true,
            opacity: true,
            hue: true,
            interaction: { input: true, cancel: true, save: true, rgba: false, hsla: false, hsva: false, cmyk: false, hex: false },
        },
    });

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
