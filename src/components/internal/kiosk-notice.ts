import { css, html, nothing, type ReactiveController, type ReactiveControllerHost } from 'lit';

/**
 * Says, on the map, that a kiosk control has nothing to work with — the mega
 * slider with no layer to fade, mega compare with fewer than two layers.
 *
 * A kiosk is set up beforehand, so a visitor never sees this; it is for the
 * person configuring one, for whom the control otherwise just silently isn't
 * there. It waits before showing: layers arrive one at a time while a map
 * loads, and a correctly configured kiosk must not flash a warning on start.
 */
const NOTICE_DELAY_MS = 2000;

export class KioskNotice implements ReactiveController {
    /** The notice being shown, or null. */
    text: string | null = null;
    private pending: string | null = null;
    private timer: number | null = null;

    constructor(private readonly host: ReactiveControllerHost) {
        host.addController(this);
    }

    /** What is missing now, or null when the control has what it needs. */
    set(text: string | null): void {
        this.pending = text;
        if (text === null) {
            this.clearTimer();
            this.show(null);
        } else if (this.text !== null) {
            // Already showing: a change of wording needs no second wait.
            this.show(text);
        } else if (this.timer === null) {
            this.timer = window.setTimeout(() => {
                this.timer = null;
                this.show(this.pending);
            }, NOTICE_DELAY_MS);
        }
    }

    hostDisconnected(): void {
        this.clearTimer();
    }

    render() {
        return this.text === null
            ? nothing
            : html`<div class="kiosk-notice" role="status">${this.text}</div>`;
    }

    private show(text: string | null): void {
        if (text === this.text) return;
        this.text = text;
        this.host.requestUpdate();
    }

    private clearTimer(): void {
        if (this.timer !== null) window.clearTimeout(this.timer);
        this.timer = null;
    }
}

export const kioskNoticeStyles = css`
    .kiosk-notice {
        max-width: 22rem;
        padding: var(--webmapx-space-sm, 0.5rem) var(--webmapx-space-md, 0.75rem);
        border: 1px dashed var(--color-border, #d5dce3);
        border-radius: var(--webmapx-radius-md, 0.5rem);
        background: var(--color-surface, #fff);
        color: var(--color-text, #1f2a33);
        font-size: var(--webmapx-font-size-sm, 0.8125rem);
        line-height: 1.4;
        box-shadow: 0 1px 4px rgb(0 0 0 / 0.15);
    }
`;
