import type { ReactiveController, ReactiveControllerHost } from 'lit';

/**
 * Whether the main pointer is a finger, kept up to date for a Lit element.
 *
 * Tools use it to word their instructions ("Tap" instead of "Click", "point
 * at" makes no sense without a hover) and to show touch-only controls such as
 * Draw's Finish button. The host re-renders when it changes — a tablet with a
 * keyboard cover attached, or device emulation in the browser's dev tools.
 */
export class TouchPointerController implements ReactiveController {
    private readonly query = window.matchMedia('(pointer: coarse)');

    /** True when the primary pointer is coarse (a finger). */
    isTouch = this.query.matches;

    constructor(private readonly host: ReactiveControllerHost) {
        host.addController(this);
    }

    /** "Tap" on touch, "Click" otherwise, for the start of an instruction. */
    get click(): 'Tap' | 'Click' {
        return this.isTouch ? 'Tap' : 'Click';
    }

    hostConnected(): void {
        this.isTouch = this.query.matches;
        this.query.addEventListener('change', this.onChange);
    }

    hostDisconnected(): void {
        this.query.removeEventListener('change', this.onChange);
    }

    private onChange = (e: MediaQueryListEvent): void => {
        this.isTouch = e.matches;
        this.host.requestUpdate();
    };
}
