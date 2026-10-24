// src/components/webmapx-panoramax-tool.ts
// Street photos tool: click a spot, see a street-level photo of it from
// Panoramax — an open alternative to Google Street View that needs no key and
// sends no click to an advertising company, which matters for schools.
// The photo can be enlarged in the page and opened in the Panoramax viewer.

import { announce } from './internal/announce';
import { html, css, nothing, TemplateResult } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { WebmapxBaseTool } from './webmapx-base-tool';
import type { IMapState } from '../store/IMapState';
import type { IMap } from '../map/IMapInterfaces';
import type { ClickEvent, LngLat } from '../store/map-events';
import type { PanoramaxToolConfig } from '../config/types';
import {
    buildPanoramaxSearchUrl,
    parsePanoramaxPhoto,
    DEFAULT_PANORAMAX_API,
    DEFAULT_PANORAMAX_VIEWER,
    DEFAULT_SEARCH_DISTANCE_M,
    type PanoramaxPhoto,
} from '../utils/panoramax';
import '@shoelace-style/shoelace/dist/components/button/button.js';
import '@shoelace-style/shoelace/dist/components/icon/icon.js';
import '@shoelace-style/shoelace/dist/components/icon-button/icon-button.js';
import '@shoelace-style/shoelace/dist/components/spinner/spinner.js';
import { DATA_TOOL } from '../theme/data-colors';
import { helpTextStyles } from './internal/help-text-styles';
import { TouchPointerController } from './internal/touch-pointer';

const MARKER_ID = 'webmapx-panoramax-spot';

type Status = 'idle' | 'loading' | 'found' | 'none' | 'error';

@customElement('webmapx-panoramax-tool')
export class WebmapxPanoramaxTool extends WebmapxBaseTool {
    public active = false;

    @state() private status: Status = 'idle';
    @state() private photo: PanoramaxPhoto | null = null;

    private readonly touch = new TouchPointerController(this);
    private markerAdded = false;
    private unsubClick: (() => void) | null = null;
    /** Each click's number; an answer for an older click is dropped. */
    private requestNo = 0;

    get toolTip(): string {
        return this.status === 'idle'
            ? `${this.touch.click} a road or path on the map to see a street photo of it.`
            : `${this.touch.click} another spot to see a photo there.`;
    }

    /** Escape closes the enlarged photo before it closes the panel. */
    handleEscape(): boolean {
        const dialog = this.dialog;
        if (!dialog?.open) return false;
        dialog.close();
        return true;
    }

    static styles = [helpTextStyles, css`
        :host {
            display: block;
            pointer-events: auto;
        }

        .panoramax {
            display: flex;
            flex-direction: column;
            gap: var(--webmapx-space-md, 0.75rem);
            padding: var(--webmapx-tool-padding, 0);
            font-size: var(--font-size-small, 0.875rem);
        }

        .status {
            display: flex;
            align-items: center;
            gap: var(--webmapx-space-sm, 0.5rem);
            margin: 0;
        }

        .thumb-button {
            display: block;
            width: 100%;
            padding: 0;
            border: 0;
            background: none;
            cursor: zoom-in;
            border-radius: 4px;
        }

        .thumb-button:focus-visible {
            outline: var(--webmapx-focus-ring-width, 2px) solid var(--webmapx-focus-ring-color, var(--color-primary, #2b6c8f));
            outline-offset: 2px;
        }

        .thumb-button img {
            display: block;
            width: 100%;
            aspect-ratio: 3 / 2;
            object-fit: cover;
            border-radius: 4px;
            background: var(--color-surface-raised, #f4f6f8);
        }

        .credit {
            margin: 0;
            font-size: 0.75rem;
            color: var(--color-text-secondary, #5a6773);
        }

        .credit a {
            color: inherit;
        }

        /* A native dialog sits in the browser's top layer, so a translucent
           panel (backdrop-filter) cannot trap it inside its own box. */
        dialog {
            width: min(860px, calc(100vw - 2rem));
            padding: var(--webmapx-space-md, 0.75rem);
            border: 1px solid var(--color-border-light, #e2e7ec);
            border-radius: var(--webmapx-radius-md, 8px);
            background: var(--color-surface, #fff);
            color: var(--color-text, #1d2a36);
            box-shadow: var(--webmapx-shadow-lg, 0 10px 30px rgba(0, 0, 0, 0.25));
        }

        dialog::backdrop {
            background: rgba(0, 0, 0, 0.45);
        }

        .dialog-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: var(--webmapx-space-sm, 0.5rem);
        }

        .dialog-header h3 {
            margin: 0;
            font-size: 1rem;
        }

        .large {
            display: block;
            width: 100%;
            max-height: 70vh;
            object-fit: contain;
            border-radius: 4px;
            background: var(--color-surface-raised, #f4f6f8);
        }

        .dialog-footer {
            display: flex;
            align-items: center;
            justify-content: space-between;
            flex-wrap: wrap;
            gap: var(--webmapx-space-sm, 0.5rem);
            margin-top: var(--webmapx-space-md, 0.75rem);
        }

        sl-spinner {
            font-size: 0.9rem;
        }
    `];

    // ─────────────────────────────────────────────────────────────────────
    // Lifecycle
    // ─────────────────────────────────────────────────────────────────────

    protected onMapAttached(adapter: IMap): void {
        super.onMapAttached(adapter);
        this.unsubClick = adapter.events.on('click', (event: ClickEvent) => { void this.handleClick(event); });
    }

    protected onMapDetached(): void {
        this.unsubClick?.();
        this.unsubClick = null;
        super.onMapDetached();
    }

    disconnectedCallback(): void {
        this.removeMarker();
        super.disconnectedCallback();
    }

    activate(): void {
        this.active = true;
        this.style.display = 'block';
    }

    deactivate(): void {
        this.active = false;
        this.style.display = 'none';
        this.dialog?.close();
        this.requestNo++;
        this.status = 'idle';
        this.photo = null;
        this.removeMarker();
    }

    protected onStateChanged(_state: IMapState): void {
        // No-op
    }

    // ─────────────────────────────────────────────────────────────────────
    // Search
    // ─────────────────────────────────────────────────────────────────────

    private get settings(): Required<Pick<PanoramaxToolConfig, 'apiUrl' | 'viewerUrl' | 'searchDistance'>> {
        const cfg = (this.toolsConfig?.['panoramax'] ?? {}) as PanoramaxToolConfig;
        return {
            apiUrl: cfg.apiUrl || DEFAULT_PANORAMAX_API,
            viewerUrl: cfg.viewerUrl || DEFAULT_PANORAMAX_VIEWER,
            searchDistance: cfg.searchDistance ?? DEFAULT_SEARCH_DISTANCE_M,
        };
    }

    private async handleClick(event: ClickEvent): Promise<void> {
        if (!this.active || !this.adapter) return;
        const requestNo = ++this.requestNo;
        const spot: LngLat = event.coords;
        this.updateMarker(spot);
        this.status = 'loading';
        this.photo = null;

        const { apiUrl, viewerUrl, searchDistance } = this.settings;
        let photo: PanoramaxPhoto | null;
        try {
            const res = await fetch(buildPanoramaxSearchUrl(apiUrl, spot, searchDistance));
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            photo = parsePanoramaxPhoto(await res.json(), viewerUrl);
        } catch (error) {
            if (requestNo !== this.requestNo) return;
            console.warn('[panoramax-tool] search failed', error);
            this.status = 'error';
            announce(this, 'Panoramax could not be reached');
            return;
        }
        if (requestNo !== this.requestNo) return;
        this.photo = photo;
        this.status = photo ? 'found' : 'none';
        announce(this, photo ? `Street photo found, by ${photo.credit}` : 'No street photos here');
    }

    // ─────────────────────────────────────────────────────────────────────
    // Marker
    // ─────────────────────────────────────────────────────────────────────

    private updateMarker(spot: LngLat): void {
        if (!this.adapter) return;
        if (this.markerAdded) {
            this.adapter.moveMarker(MARKER_ID, spot);
        } else {
            this.adapter.addMarker(MARKER_ID, spot, { color: DATA_TOOL });
            this.markerAdded = true;
        }
    }

    private removeMarker(): void {
        if (!this.markerAdded) return;
        this.adapter?.removeMarker(MARKER_ID);
        this.markerAdded = false;
    }

    // ─────────────────────────────────────────────────────────────────────
    // Rendering
    // ─────────────────────────────────────────────────────────────────────

    private get dialog(): HTMLDialogElement | null {
        return this.shadowRoot?.querySelector('dialog') ?? null;
    }

    private renderCredit(photo: PanoramaxPhoto): TemplateResult {
        const date = photo.takenAt ? new Date(photo.takenAt) : null;
        const when = date && !Number.isNaN(date.getTime())
            ? date.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
            : null;
        // CC BY-SA asks for the maker and the licence beside every photo.
        return html`
            <p class="credit">
                Photo: ${photo.credit}${when ? html`, ${when}` : nothing}
                ${photo.licence ? html` · ${photo.licenceUrl
                    ? html`<a href=${photo.licenceUrl} target="_blank" rel="noopener noreferrer">${photo.licence}</a>`
                    : photo.licence}` : nothing}
            </p>`;
    }

    private renderOpenButton(photo: PanoramaxPhoto): TemplateResult {
        return html`
            <sl-button size="small" href=${photo.viewerUrl} target="_blank" rel="noopener noreferrer"
                title="Open this photo in the Panoramax viewer in a new tab, to look around and walk on">
                <sl-icon name="box-arrow-up-right" slot="suffix" label="opens in a new tab"></sl-icon>
                Open in Panoramax
            </sl-button>`;
    }

    protected render(): TemplateResult {
        const photo = this.photo;
        return html`
            <div class="panoramax">
                ${this.status === 'loading' ? html`
                    <p class="status help-text"><sl-spinner></sl-spinner> Looking for photos…</p>` : nothing}
                ${this.status === 'none' ? html`
                    <p class="status help-text">No street photos here. Photos are mostly taken along roads and paths.</p>` : nothing}
                ${this.status === 'error' ? html`
                    <p class="status help-text">Panoramax could not be reached. Try again in a moment.</p>` : nothing}
                ${photo ? html`
                    <button type="button" class="thumb-button" aria-haspopup="dialog"
                        title="Enlarge the photo" @click=${() => this.dialog?.showModal()}>
                        <img src=${photo.thumbUrl} alt="Street photo near this spot, select to enlarge">
                    </button>
                    ${this.renderCredit(photo)}
                    <div>${this.renderOpenButton(photo)}</div>

                    <dialog aria-labelledby="panoramax-dialog-title">
                        <div class="dialog-header">
                            <h3 id="panoramax-dialog-title">Street photo</h3>
                            <sl-icon-button name="x-lg" label="Close" @click=${() => this.dialog?.close()}></sl-icon-button>
                        </div>
                        <img class="large" src=${photo.largeUrl} alt="Street photo near this spot">
                        <div class="dialog-footer">
                            ${this.renderCredit(photo)}
                            ${this.renderOpenButton(photo)}
                        </div>
                    </dialog>
                ` : nothing}
            </div>
        `;
    }
}
