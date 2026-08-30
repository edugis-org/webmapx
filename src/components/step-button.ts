/**
 * The pair of buttons that move a slider one interval at a time.
 *
 * A range input already steps from the arrow keys, but only once it has focus —
 * and on touch there are no arrow keys at all, while tapping the track to give
 * it focus jumps the value to wherever the tap landed. So the step is offered as
 * a control of its own, which is also the only way to reach an exact value with
 * a finger.
 *
 * Shared by the time slider and the deep-time tool because they are the same
 * control over the same kind of axis; the interval each one steps by is its own
 * business, and it is named in the button's label rather than assumed here.
 */

import { html, svg, type TemplateResult } from 'lit';

/**
 * A plain chevron, as a stepper is drawn in a paginator or a date picker.
 *
 * Not a triangle against a bar: that is the transport control for "to the
 * start" and "to the end", and these move by one interval. Not a double chevron
 * either, which reads as fast — that is what a play button and its speed are
 * for.
 */
export const STEP_BACK_ICON = svg`<svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" focusable="false">
    <path d="M10 2.5 4.5 8l5.5 5.5" fill="none" stroke="currentColor" stroke-width="2"
        stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

export const STEP_FORWARD_ICON = svg`<svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" focusable="false">
    <path d="M6 2.5 11.5 8 6 13.5" fill="none" stroke="currentColor" stroke-width="2"
        stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

/**
 * Press-and-hold: the wait before it starts repeating, and the interval it
 * repeats at. Taken from a keyboard's own auto-repeat, so a held button feels
 * like a held arrow key — the thing it exists to replace on touch.
 */
const REPEAT_DELAY_MS = 400;
const REPEAT_INTERVAL_MS = 90;

/**
 * Keeps a step going while its button is held.
 *
 * One per component rather than one per button: only one button can be held at
 * a time, and starting a step ends whatever was running.
 */
export class StepRepeater {
    /** A timeout until the delay has passed, an interval after it. */
    private timer: number | null = null;
    /** Whether the click now pending was already served by a pointer press. */
    private handledByPointer = false;

    /** Steps once, then keeps stepping until `stop`. */
    press(step: () => void): void {
        this.stop();
        this.handledByPointer = true;
        step();
        this.timer = window.setTimeout(() => {
            this.timer = window.setInterval(step, REPEAT_INTERVAL_MS);
        }, REPEAT_DELAY_MS);
    }

    stop(): void {
        if (this.timer === null) return;
        // Clearing both is cheaper than remembering which kind of handle it is.
        window.clearTimeout(this.timer);
        window.clearInterval(this.timer);
        this.timer = null;
    }

    /**
     * Serves the click that a keyboard or assistive technology synthesises —
     * which arrives with no pointer press before it — and swallows the one that
     * merely follows a press this repeater has already acted on.
     */
    click(step: () => void): void {
        if (this.handledByPointer) {
            this.handledByPointer = false;
            return;
        }
        step();
    }
}

/**
 * One step button. `label` names the interval ("1 hour earlier"), since that is
 * the only thing distinguishing it from the other one.
 */
export function renderStepButton(options: {
    icon: TemplateResult<2>;
    label: string;
    disabled: boolean;
    step: () => void;
    repeater: StepRepeater;
}): TemplateResult {
    const { icon, label, disabled, step, repeater } = options;
    return html`
        <button type="button" class="step webmapx-control" aria-label=${label} title=${label} ?disabled=${disabled}
            @pointerdown=${() => repeater.press(step)}
            @pointerup=${() => repeater.stop()}
            @pointercancel=${() => repeater.stop()}
            @pointerleave=${() => repeater.stop()}
            @click=${() => repeater.click(step)}>
            ${icon}
        </button>`;
}
