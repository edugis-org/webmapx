import { html, css, TemplateResult, nothing } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { WebmapxModalTool } from './webmapx-modal-tool';
import type { IMapState } from '../store/IMapState';
import type { IMap } from '../map/IMapInterfaces';
import { COMPARE_SPLIT_ATTRIBUTE, createFrozenMap, syncCamera, type FrozenMap } from '../utils/compare-replay';
import { getComparePermalinkSplit } from '../utils/permalink';
import type { WebmapxMapElement } from './webmapx-map';
import type { CompareToolConfig } from '../config/types';

const DEFAULT_SPLIT = 50;
const KEY_STEP = 2;
/**
 * How wide the *grab* area around the seam is. The seam itself stays 2px — it is a
 * measuring line and a thick one would hide the very difference it points at — so the
 * hit area is a transparent strip centred on it.
 *
 * A fingertip is about 9mm and cannot be aimed at 2px: on a touch screen the handle was
 * effectively immovable, and every miss landed on the map instead and panned it. 44px is
 * the usual minimum touch target. A mouse does not need it and the strip does cost
 * something — it swallows drags near the seam — so a fine pointer keeps a narrow one.
 */
const HANDLE_HIT_TOUCH = 44;
const HANDLE_HIT_MOUSE = 16;

/**
 * A vertical handle across the map: left of it the map as it was when the tool was opened,
 * right of it the map as you keep changing it. One camera, so any difference you see is a
 * difference in the content, never in the view.
 *
 * The frozen side is a second `<webmapx-map>` overlaid on the live one and clipped with
 * `clip-path`, not a per-layer clip on one map. Per-layer clipping exists only in OpenLayers
 * and Leaflet, and — the larger objection — it would need one map to hold two layer stacks:
 * colliding layer ids, one exclusive background group, one legend listing both. Clipping the
 * *element* works identically on all four engines and costs one CSS property, which is
 * composited, so dragging the handle repaints neither map.
 *
 * Every tool keeps acting on the live side without a special case: tools sit inside the live
 * `<webmapx-map>` and `resolveMapElement` resolves by `closest('webmapx-map')`, while the
 * reference map has no tools of its own and takes no pointer events.
 */
@customElement('webmapx-compare-tool')
export class WebmapxCompareTool extends WebmapxModalTool {
    readonly toolId = 'compare';

    @state() private split = DEFAULT_SPLIT;
    @state() private busy = false;
    @state() private failed = false;

    private frozen: FrozenMap | null = null;
    private restoredFromLink = false;
    private handleEl: HTMLElement | null = null;
    private viewChangeUnsubscribe: (() => void) | null = null;
    private dragPointerId: number | null = null;

    static styles = css`
        :host { display: block; padding: var(--webmapx-tool-padding, 0); font-size: var(--webmapx-font-size-md, 0.875rem); }
        p { margin: 0 0 var(--webmapx-space-sm, 0.5rem); line-height: 1.5; }
        .muted { color: var(--color-text-secondary, #5a6773); }
        .sides { display: flex; gap: var(--webmapx-space-sm, 0.5rem); margin-top: var(--webmapx-space-sm, 0.5rem); }
        .side { flex: 1; border: 1px solid var(--color-border, #d5dce3); border-radius: var(--webmapx-radius-sm, 4px); padding: var(--webmapx-space-sm, 0.5rem); }
        .side b { display: block; }
        .action {
            width: 100%; margin-top: var(--webmapx-space-sm, 0.5rem); padding: 0.4rem 0;
            border: 1px solid var(--color-border, #d5dce3); border-radius: var(--webmapx-radius-sm, 4px);
            background: var(--color-background, #fff); cursor: pointer; font-size: inherit;
        }
        .action[disabled] { opacity: 0.6; cursor: default; }
    `;

    protected onStateChanged(_state: IMapState): void {
        // The frozen map is built once, from the state at the moment the tool was opened;
        // later store changes are exactly what the user is comparing against and must not
        // reach it. Only a projection change has to be forwarded — see onActivate.
    }

    /**
     * Opening the panel starts the comparison; closing it does not end it.
     *
     * The comparison outlives its panel for the same reason the deep-time tool's coastlines
     * and the 3D tool's terrain do: adding a layer to the live half means opening the
     * catalog, and a panel is exclusive — so ending the comparison on deactivate would throw
     * the frozen map away at the exact moment the user went to fetch something to compare
     * against. It ends when the user says so, from the button in this panel.
     */
    protected onActivate(): void {
        // Deliberately nothing: the comparison is started and stopped from the panel's own
        // button. Opening the panel to read what the tool does should not freeze the map, and
        // closing it must not throw the frozen half away — see the class comment.
    }

    protected onDeactivate(): void {
        // Deliberately nothing: see onActivate.
    }

    disconnectedCallback(): void {
        super.disconnectedCallback();
        this.thaw();
    }

    private get labels(): { reference: string; live: string } {
        const config = this.toolsConfig?.['compare'] as CompareToolConfig | undefined;
        return {
            reference: config?.labels?.reference ?? 'before',
            live: config?.labels?.live ?? 'now',
        };
    }

    /**
     * Starts the comparison a link asked for.
     *
     * `cmp` is what says a comparison is open — a link carrying `s.1` without it would
     * restore two stacked maps and no handle. The frozen map is then built from the link
     * rather than from the live map: it is the page's second `<webmapx-map>`, so `s.1`
     * reaches it through the same restore path every map uses.
     */
    protected onMapAttached(adapter: IMap): void {
        super.onMapAttached(adapter);
        const split = getComparePermalinkSplit();
        if (split === null || this.frozen || this.restoredFromLink) return;
        this.restoredFromLink = true;
        void this.freeze({ split, fromPermalink: true });
    }

    private async freeze(restore?: { split: number; fromPermalink: boolean }): Promise<void> {
        const mapEl = this.mapHost;
        const adapter = this.adapter;
        if (!mapEl || !adapter || this.frozen) return;

        // Compare is a full-bleed interaction, and a page of several maps has nowhere to put a
        // handle — but the real reason for the rule is `getMapDomIndex`, which counts every
        // `<webmapx-map>` in the document: on a single-map page the frozen map takes index 1
        // and shifts nothing, which is also what later lets it *be* index 1 when a compared
        // map is shared.
        if (document.querySelectorAll('webmapx-map:not([data-webmapx-role])').length > 1) {
            console.warn('[compare] The compare tool is only available on a page with a single map.');
            this.failed = true;
            return;
        }

        const config = this.toolsConfig?.['compare'] as CompareToolConfig | undefined;
        this.split = clampSplit(restore?.split ?? config?.initialSplit ?? DEFAULT_SPLIT);
        this.busy = true;
        this.failed = false;

        this.frozen = await createFrozenMap(mapEl, adapter, mapEl, {
            replayLiveMap: !restore?.fromPermalink,
        });
        this.busy = false;
        if (!this.frozen) {
            this.failed = true;
            return;
        }

        this.applyClip();
        this.addHandle(mapEl);
        this.linkCamera(adapter);
        this.requestUpdate();
    }

    private thaw(): void {
        this.viewChangeUnsubscribe?.();
        this.viewChangeUnsubscribe = null;
        this.handleEl?.remove();
        this.handleEl = null;
        this.frozen?.element.remove();
        this.frozen = null;
    }

    /**
     * Live drives reference, one direction only — the reference map takes no pointer events,
     * so there is no second camera to reconcile and no echo to suppress. On `view-change`
     * rather than `view-change-end`: at end-only the two halves visibly slide apart during a
     * pan, which reads as a rendering bug rather than as a comparison.
     */
    private linkCamera(liveAdapter: IMap): void {
        const onViewChange = (): void => {
            if (this.frozen) syncCamera(liveAdapter, this.frozen.adapter);
        };
        liveAdapter.events.on('view-change', onViewChange);
        // And again when the movement stops. OpenLayers emits its continuous event from
        // `pointerdrag`, which fires before the view has taken that step, so the last
        // continuous value is one drag step behind — measured, the frozen half came to rest
        // half a pan away from the live one. `view-change-end` carries the settled camera.
        liveAdapter.events.on('view-change-end', onViewChange);

        // A projection change on the live side has to travel too, or the two halves are no
        // longer the same place. `store.mapProjection` carries the engine-reported value, so
        // this follows the map rather than the projection tool.
        let lastProjection = liveAdapter.getProjection()?.name;
        const unsubscribeStore = liveAdapter.store.subscribe((state) => {
            const name = state.mapProjection?.name;
            if (!name || name === lastProjection) return;
            lastProjection = name;
            this.frozen?.adapter.setProjection(name);
        });

        this.viewChangeUnsubscribe = () => {
            liveAdapter.events.off('view-change', onViewChange);
            liveAdapter.events.off('view-change-end', onViewChange);
            unsubscribeStore();
        };
    }

    private applyClip(): void {
        const el = this.frozen?.element;
        if (!el) return;
        el.style.clipPath = `inset(0 ${100 - this.split}% 0 0)`;
        // Kept on the element so a share link can read the split without importing this tool.
        el.setAttribute(COMPARE_SPLIT_ATTRIBUTE, String(Math.round(this.split)));
    }

    private addHandle(mapEl: WebmapxMapElement): void {
        const handle = document.createElement('div');
        handle.className = 'webmapx-compare-handle';
        handle.setAttribute('role', 'separator');
        handle.setAttribute('tabindex', '0');
        handle.setAttribute('aria-orientation', 'vertical');
        handle.setAttribute('aria-label', 'Compare split position');
        handle.setAttribute('aria-valuemin', '0');
        handle.setAttribute('aria-valuemax', '100');
        // Touch-capable rather than touch-only (`any-pointer`, not `pointer`): a laptop with a
        // touch screen reports a fine primary pointer and would otherwise get the narrow strip
        // for the finger it also has.
        const coarse = window.matchMedia?.('(any-pointer: coarse)').matches ?? false;
        const hit = coarse ? HANDLE_HIT_TOUCH : HANDLE_HIT_MOUSE;
        handle.style.cssText = [
            'position:absolute', 'top:0', 'bottom:0', `width:${hit}px`,
            // The strip is centred on the split, so `left` stays the split percentage and the
            // seam keeps pointing exactly where the clip-path cuts.
            'transform:translateX(-50%)',
            'background:transparent',
            'cursor:ew-resize', 'touch-action:none',
        ].join(';');

        handle.appendChild(this.seamLine());
        // A transparent strip is invisible, so on touch there is nothing to aim at. The grip is
        // the thing a finger goes for, and it is what makes the seam look draggable at all.
        handle.appendChild(this.handleGrip());

        // Without labels a user returning to the tab cannot tell which half they are
        // changing, and will conclude a layer toggle is broken.
        const { reference, live } = this.labels;
        // Clear of the grip chip in the middle, not of the seam.
        handle.appendChild(this.handleLabel(reference, 'right:calc(50% + 20px)'));
        handle.appendChild(this.handleLabel(live, 'left:calc(50% + 20px)'));

        handle.addEventListener('pointerdown', this.onPointerDown);
        handle.addEventListener('pointermove', this.onPointerMove);
        handle.addEventListener('pointerup', this.onPointerUp);
        handle.addEventListener('pointercancel', this.onPointerUp);
        handle.addEventListener('keydown', this.onHandleKeyDown);

        // Before the layout, exactly like the frozen map, and with no z-index of its own: order
        // decides. Appended last it painted over the whole overlay — the seam ran across the
        // attribution, and it only looked as though the toolbar were above it because the
        // toolbar sits away from the seam. The layout's zones are `pointer-events: none`, so the
        // handle is still draggable everywhere except directly over a control.
        mapEl.insertBefore(handle, mapEl.querySelector(':scope > webmapx-layout'));
        this.handleEl = handle;
        this.positionHandle();
    }

    /** The visible seam: 2px down the middle of the grab strip. */
    private seamLine(): HTMLElement {
        const line = document.createElement('div');
        line.style.cssText = [
            'position:absolute', 'top:0', 'bottom:0', 'left:50%', 'width:2px',
            'transform:translateX(-50%)', 'pointer-events:none',
            'background:var(--webmapx-data-primary, #d64545)',
        ].join(';');
        return line;
    }

    /**
     * What the grip and the two labels have in common. One list rather than two similar ones,
     * because they sit in a row at the top of the seam and any drift between them shows as a
     * misaligned chip.
     */
    private static readonly CHIP_STYLE = [
        'position:absolute', 'top:8px', 'white-space:nowrap',
        'padding:2px 6px', 'border-radius:var(--webmapx-radius-sm, 4px)',
        'background:var(--color-surface, #fff)',
        'font-size:var(--webmapx-font-size-sm, 0.8rem)',
        // Explicit, so the grip's single glyph and the labels' text are the same height.
        'line-height:1.25',
    ];

    /**
     * The grip, drawn as a third chip between the two labels rather than as a knob halfway down
     * the map: at the top it is next to the words that say what the seam separates, and it is
     * out of the way of the map itself — a knob in the middle covers whatever is being compared,
     * which on a phone is most of the screen.
     */
    private handleGrip(): HTMLElement {
        const grip = document.createElement('div');
        grip.style.cssText = [
            ...WebmapxCompareTool.CHIP_STYLE,
            'left:50%', 'transform:translateX(-50%)',
            // Square-ish: the labels' height, and the horizontal padding trimmed to match it
            // rather than inheriting the text padding, which made a wide lozenge.
            'display:flex', 'align-items:center', 'justify-content:center',
            'padding:2px', 'min-width:15px',
            'color:var(--webmapx-data-primary, #d64545)', 'pointer-events:none',
        ].join(';');
        grip.textContent = '↔';
        return grip;
    }

    private handleLabel(text: string, position: string): HTMLElement {
        const label = document.createElement('span');
        label.textContent = text;
        label.style.cssText = [
            ...WebmapxCompareTool.CHIP_STYLE, position,
            'color:var(--color-text, #1c2530)', 'pointer-events:none',
        ].join(';');
        return label;
    }

    private positionHandle(): void {
        if (!this.handleEl) return;
        this.handleEl.style.left = `${this.split}%`;
        this.handleEl.setAttribute('aria-valuenow', String(Math.round(this.split)));
    }

    private setSplit(value: number): void {
        this.split = clampSplit(value);
        this.applyClip();
        this.positionHandle();
    }

    private splitFromClientX(clientX: number): number {
        const host = this.mapHost;
        if (!host) return this.split;
        const rect = host.getBoundingClientRect();
        if (rect.width === 0) return this.split;
        return ((clientX - rect.left) / rect.width) * 100;
    }

    private onPointerDown = (event: PointerEvent): void => {
        this.dragPointerId = event.pointerId;
        (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
        event.preventDefault();
        // A touch that starts on the handle is a drag of the handle and never a pan of the map
        // underneath it, whatever the engine has bound higher up.
        event.stopPropagation();
    };

    private onPointerMove = (event: PointerEvent): void => {
        if (this.dragPointerId !== event.pointerId) return;
        this.setSplit(this.splitFromClientX(event.clientX));
    };

    private onPointerUp = (event: PointerEvent): void => {
        if (this.dragPointerId !== event.pointerId) return;
        (event.currentTarget as HTMLElement).releasePointerCapture(event.pointerId);
        this.dragPointerId = null;
    };

    private onHandleKeyDown = (event: KeyboardEvent): void => {
        const moves: Record<string, number> = {
            ArrowLeft: this.split - KEY_STEP,
            ArrowRight: this.split + KEY_STEP,
            Home: 0,
            End: 100,
        };
        const next = moves[event.key];
        if (next === undefined) return;
        event.preventDefault();
        this.setSplit(next);
    };

    private stop(): void {
        this.thaw();
        this.requestUpdate();
    }

    protected render(): TemplateResult {
        const { reference, live } = this.labels;
        return html`
            ${this.busy ? html`<p class="muted">Freezing the current map…</p>` : nothing}
            ${this.failed
                ? html`<p class="muted">The comparison could not be started on this page.</p>`
                : nothing}
            <p>Drag the handle across the map. The left half stays as it was when this tool was
               opened; every change you make from now on shows on the right.</p>
            <div class="sides">
                <div class="side"><b>${reference}</b><span class="muted">frozen</span></div>
                <div class="side"><b>${live}</b><span class="muted">live — tools act here</span></div>
            </div>
            <button class="action" ?disabled=${this.busy}
                    @click=${() => (this.frozen ? this.stop() : void this.freeze())}>
                ${this.frozen ? 'Stop comparing' : 'Start comparing'}
            </button>
            ${this.frozen
                ? html`<p class="muted">Closing this panel keeps the comparison running, so you can
                          open the catalog and add a layer to the live half.</p>`
                : nothing}
        `;
    }
}

function clampSplit(value: number): number {
    if (!Number.isFinite(value)) return DEFAULT_SPLIT;
    return Math.min(100, Math.max(0, value));
}

declare global {
    interface HTMLElementTagNameMap {
        'webmapx-compare-tool': WebmapxCompareTool;
    }
}
