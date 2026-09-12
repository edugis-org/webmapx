/**
 * A modeless panel that can be dragged by its header.
 *
 * Lifted so the styler does not re-derive it: the behaviour is small but every
 * detail in it was a bug once — committing the position on pointerdown pinned
 * the panel for the session, clamping during the drag stuck it to the edges,
 * and a `position: fixed` panel inside an ancestor with a `backdrop-filter` is
 * trapped in that ancestor until it is raised into the top layer.
 *
 * A popover rather than a modal: the map underneath has to stay usable while
 * the panel is open, which is the whole point of a live style preview.
 */
import { LitElement, css } from 'lit';
import { state } from 'lit/decorators.js';
import { dropModelessFromTopLayer, raiseModelessToTopLayer } from '../internal/top-layer-dialog';

export const panelChromeStyles = css`
    :host { display: none; }
    :host([visible]) { display: block; }

    .panel {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        display: flex;
        flex-direction: column;
        width: min(26rem, 96vw);
        max-height: min(80vh, 44rem);
        background: var(--color-surface, #fff);
        color: var(--color-text-primary, #16202a);
        border: 1px solid var(--color-border, #cbd5df);
        border-radius: var(--webmapx-radius-md, 0.5rem);
        box-shadow: var(--webmapx-shadow-lg, 0 10px 30px rgba(0, 0, 0, 0.25));
    }

    .panel-head {
        display: flex;
        align-items: center;
        gap: 0.4rem;
        padding: 0.5rem 0.6rem;
        border-bottom: 1px solid var(--color-border-light, #e2e7ec);
        background: var(--color-surface-raised, #f4f6f8);
        border-radius: var(--webmapx-radius-md, 0.5rem) var(--webmapx-radius-md, 0.5rem) 0 0;
        /* The whole header is the handle, so there is no small target to hit. */
        cursor: move;
        touch-action: none;
        user-select: none;
    }
    /* Decorative, and hidden from assistive technology: dragging is not
       something this icon makes available to a keyboard. */
    .drag-grip {
        flex: 0 0 auto;
        font-size: 1rem;
        color: var(--color-text-secondary, #5a6773);
        opacity: 0.55;
    }
    .panel-title { flex: 1 1 auto; font-weight: 600; }
    .panel-close {
        background: none;
        border: none;
        padding: 0.15rem 0.35rem;
        font: inherit;
        color: var(--color-text-secondary, #5a6773);
        cursor: pointer;
    }
    .panel-close:hover { color: var(--color-text-primary, #16202a); }

    .panel-body { overflow: auto; padding: 0.75rem; }

    .footer {
        display: flex;
        justify-content: flex-end;
        gap: 0.5rem;
        padding: 0.5rem 0.6rem;
        border-top: 1px solid var(--color-border-light, #e2e7ec);
    }
`;

export abstract class DraggablePanel extends LitElement {
    @state() protected position: { x: number; y: number } | null = null;

    private drag: { pointerId: number; dx: number; dy: number } | null = null;

    /** Whether the panel is on screen; mirrored to an attribute so CSS can show it. */
    protected abstract get isVisible(): boolean;

    /** The style attribute a dragged panel needs, and nothing when it has not been dragged. */
    protected panelPosition(): string {
        return this.position ? `left:${this.position.x}px; top:${this.position.y}px; transform:none` : '';
    }

    protected showPanel(): void {
        raiseModelessToTopLayer(this);
        document.addEventListener('keydown', this.onPanelKeydown);
        // After layout, so the panel's size is known: a remembered position is
        // only kept while it still lands on screen.
        void this.updateComplete.then(() => this.ensureOnScreen());
    }

    protected hidePanel(): void {
        dropModelessFromTopLayer(this);
        document.removeEventListener('keydown', this.onPanelKeydown);
    }

    /** Escape closes the panel, which the `<dialog>` it replaced did for free. */
    private onPanelKeydown = (event: KeyboardEvent): void => {
        if (event.key === 'Escape' && this.isVisible) this.closePanel();
    };

    protected abstract closePanel(): void;

    /**
     * Drags the panel by its header.
     *
     * Pointer events rather than mouse events, so a touch drag works, and the
     * pointer is captured so a fast drag that leaves the header does not drop
     * the panel mid-move. The position is committed only once the pointer has
     * actually moved: committing on pointerdown meant a single click pinned the
     * panel for the rest of the session, after which it never re-centred.
     */
    protected startDrag(event: PointerEvent): void {
        const head = event.currentTarget as HTMLElement;
        const panel = head.parentElement as HTMLElement | null;
        if (!panel || event.button !== 0) return;
        if ((event.target as HTMLElement).closest('.panel-close')) return;

        const box = panel.getBoundingClientRect();
        this.drag = { pointerId: event.pointerId, dx: event.clientX - box.left, dy: event.clientY - box.top };
        head.setPointerCapture(event.pointerId);
        head.addEventListener('pointermove', this.onDrag);
        head.addEventListener('pointerup', this.endDrag);
        head.addEventListener('pointercancel', this.endDrag);
        event.preventDefault();
    }

    private onDrag = (event: PointerEvent): void => {
        if (!this.drag || event.pointerId !== this.drag.pointerId) return;
        this.position = { x: event.clientX - this.drag.dx, y: event.clientY - this.drag.dy };
    };

    private endDrag = (event: PointerEvent): void => {
        if (!this.drag || event.pointerId !== this.drag.pointerId) return;
        const head = event.currentTarget as HTMLElement;
        head.releasePointerCapture?.(event.pointerId);
        head.removeEventListener('pointermove', this.onDrag);
        head.removeEventListener('pointerup', this.endDrag);
        head.removeEventListener('pointercancel', this.endDrag);
        this.drag = null;
        this.clampPosition();
    };

    /**
     * Brings a remembered position back inside the window when the panel opens.
     *
     * The window may have been resized since, and a panel that opens half
     * outside it with its buttons unreachable is worse than one that has
     * forgotten where it was.
     */
    private ensureOnScreen(): void {
        if (!this.position) return;
        const box = this.panelBox();
        if (!box) return;
        const x = Math.min(Math.max(this.position.x, 0), Math.max(window.innerWidth - box.width, 0));
        const y = Math.min(Math.max(this.position.y, 0), Math.max(window.innerHeight - box.height, 0));
        if (x !== this.position.x || y !== this.position.y) this.position = { x, y };
    }

    /** Keeps at least the header on screen, whatever the drag did. */
    private clampPosition(): void {
        const box = this.panelBox();
        if (!box || !this.position) return;
        // Enough of the panel to grab and read the title by, on whichever edge
        // it was pushed towards; the header must never leave the top.
        const visible = 160;
        this.position = {
            x: Math.min(Math.max(this.position.x, visible - box.width), window.innerWidth - visible),
            y: Math.min(Math.max(this.position.y, 0), window.innerHeight - 48),
        };
    }

    private panelBox(): DOMRect | null {
        const panel = this.renderRoot?.querySelector('.panel') as HTMLElement | null;
        return panel ? panel.getBoundingClientRect() : null;
    }
}
