import { html, css, TemplateResult, nothing } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { WebmapxModalTool } from './webmapx-modal-tool';
import type { IMapState } from '../store/IMapState';
import type { IMap } from '../map/IMapInterfaces';
import { createFrozenMap, syncCamera, type FrozenMap } from '../utils/compare-replay';
import type { WebmapxMapElement } from './webmapx-map';
import type { CompareToolConfig } from '../config/types';

const DEFAULT_SPLIT = 50;
const KEY_STEP = 2;

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

    private async freeze(): Promise<void> {
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
        this.split = clampSplit(config?.initialSplit ?? DEFAULT_SPLIT);
        this.busy = true;
        this.failed = false;

        this.frozen = await createFrozenMap(mapEl, adapter, mapEl);
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
        handle.style.cssText = [
            'position:absolute', 'top:0', 'bottom:0', 'width:2px',
            'background:var(--webmapx-data-primary, #d64545)',
            'cursor:ew-resize', 'z-index:2', 'touch-action:none',
        ].join(';');

        // Without labels a user returning to the tab cannot tell which half they are
        // changing, and will conclude a layer toggle is broken.
        const { reference, live } = this.labels;
        handle.appendChild(this.handleLabel(reference, 'right:calc(100% + 8px)'));
        handle.appendChild(this.handleLabel(live, 'left:calc(100% + 8px)'));

        handle.addEventListener('pointerdown', this.onPointerDown);
        handle.addEventListener('pointermove', this.onPointerMove);
        handle.addEventListener('pointerup', this.onPointerUp);
        handle.addEventListener('pointercancel', this.onPointerUp);
        handle.addEventListener('keydown', this.onHandleKeyDown);

        mapEl.appendChild(handle);
        this.handleEl = handle;
        this.positionHandle();
    }

    private handleLabel(text: string, position: string): HTMLElement {
        const label = document.createElement('span');
        label.textContent = text;
        label.style.cssText = [
            'position:absolute', 'top:8px', position, 'white-space:nowrap',
            'padding:2px 6px', 'border-radius:var(--webmapx-radius-sm, 4px)',
            'background:var(--color-surface, #fff)', 'color:var(--color-text, #1c2530)',
            'font-size:var(--webmapx-font-size-sm, 0.8rem)', 'pointer-events:none',
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
