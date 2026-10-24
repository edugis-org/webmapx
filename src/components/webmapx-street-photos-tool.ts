// src/components/webmapx-street-photos-tool.ts
// Street photos tool: click a spot, see a street-level photo of it. From
// Panoramax by default — an open alternative to Google Street View that needs
// no key and sends no click to an advertising company, which matters for
// schools — and from Google Street View as a choice in the panel when the
// config has a Google key.
// With Panoramax, while open, the tool lends the map Panoramax's coverage, so you can see where
// clicking is worth it, coloured by coverage, capture date or camera type; the
// pointer turns to a hand over anything clickable. A click on a photo dot shows
// that very photo. Zoomed out further than the tiles carry routes, the map
// shows nothing and the tip says to zoom in. The
// photo enlarges in the page — a 360° photo in a panorama viewer, since shown
// flat it is distorted — and opens in the service's own viewer to walk on.
// Google has no coverage map here (its terms allow one only through the Maps
// JavaScript library) and gives flat views, so with Google a click simply asks
// whether there is imagery near the spot.

import { announce } from './internal/announce';
import { html, css, nothing, TemplateResult } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { WebmapxBaseTool } from './webmapx-base-tool';
import type { IMapState } from '../store/IMapState';
import type { IMap } from '../map/IMapInterfaces';
import type { ClickEvent, LngLat, Pixel, PointerMoveEvent } from '../store/map-events';
import { throttle } from '../utils/throttle';
import type { StreetPhotosToolConfig } from '../config/types';
import { substituteApiKeys } from '../config/apikeys';
import type { StreetPhoto, StreetPhotoSource } from '../utils/street-photo';
import { buildGoogleMetadataUrl, googleRefusal, parseGoogleStreetView } from '../utils/google-street-view';
import {
    buildPanoramaxPhotoUrl,
    buildPanoramaxSearchUrl,
    panoramaxCoverageLayer,
    panoramaxColour,
    parsePanoramaxPhoto,
    yawTowards,
    DEFAULT_PANORAMAX_API,
    DEFAULT_PANORAMAX_VIEWER,
    DEFAULT_SEARCH_DISTANCE_M,
    PANORAMAX_COVERAGE_LAYER_ID,
    PANORAMAX_ROUTES_MIN_ZOOM,
    type PanoramaxColourBy,
} from '../utils/panoramax';
import '@shoelace-style/shoelace/dist/components/button/button.js';
import '@shoelace-style/shoelace/dist/components/icon/icon.js';
import '@shoelace-style/shoelace/dist/components/icon-button/icon-button.js';
import '@shoelace-style/shoelace/dist/components/spinner/spinner.js';
import '@shoelace-style/shoelace/dist/components/radio-group/radio-group.js';
import '@shoelace-style/shoelace/dist/components/radio-button/radio-button.js';
import { DATA_TOOL } from '../theme/data-colors';
import { accentControlStyles } from './internal/accent-control-styles';
import { formLabelStyles } from './internal/form-label-styles';
import { helpTextStyles } from './internal/help-text-styles';
import { TouchPointerController } from './internal/touch-pointer';

const MARKER_ID = 'webmapx-street-photos-spot';
/** Hit radius for a click on, or hover over, the coverage map, in pixels. */
const DOT_TOLERANCE_PX = 6;
/**
 * How near a click must be to a photo, on screen. A fixed distance on the
 * ground is right at street level but misses an orange line clicked at city
 * level, where a few pixels are a hundred metres.
 */
const SEARCH_RADIUS_PX = 12;
/** The search distance never exceeds this, however far out the map is zoomed. */
const MAX_SEARCH_DISTANCE_M = 500;
const HOVER_THROTTLE_MS = 100;

type CoverageHit = { kind: 'photo'; id: string } | { kind: 'route' } | null;

type Status = 'idle' | 'loading' | 'found' | 'none' | 'error';

/** Pannellum and its stylesheet, loaded once, on the first 360° photo enlarged. */
let pannellumLoad: Promise<string> | null = null;
function loadPannellum(): Promise<string> {
    pannellumLoad ??= Promise.all([
        import('pannellum/build/pannellum.js'),
        import('pannellum/build/pannellum.css?inline'),
    ]).then(([, cssModule]) => (cssModule as { default: string }).default);
    return pannellumLoad;
}

@customElement('webmapx-street-photos-tool')
export class WebmapxStreetPhotosTool extends WebmapxBaseTool {
    public active = false;

    @state() private status: Status = 'idle';
    @state() private photo: StreetPhoto | null = null;
    /** Panoramax unless the user chose Google, which needs a key in the config. */
    @state() private source: StreetPhotoSource = 'panoramax';
    /** Why the last search failed, for the panel. */
    @state() private errorText = '';
    /** This engine cannot draw vector tiles, so the map cannot show coverage. */
    @state() private coverageUnsupported = false;
    @state() private panoramaFailed = false;
    @state() private colourBy: PanoramaxColourBy = 'coverage';
    /** Zoomed out further than the tiles carry routes, so the coverage shows nothing. */
    @state() private zoomedOut = false;

    private readonly touch = new TouchPointerController(this);
    private markerAdded = false;
    private unsubClick: (() => void) | null = null;
    /** Each click's number; an answer for an older click is dropped. */
    private requestNo = 0;
    /** The clicked spot, which a 360° photo opens facing; null after a dot click. */
    private spot: LngLat | null = null;
    private panorama: PannellumViewer | null = null;
    private unsubPointerMove: (() => void) | null = null;
    private unsubViewChangeEnd: (() => void) | null = null;
    private hoverCursor = '';

    /** A hand over anything clickable on the coverage map, the normal cursor elsewhere. */
    private throttledHover = throttle(async (pixel: Pixel, lngLat: LngLat) => {
        if (!this.active) return;
        const hit = await this.coverageAt(pixel, lngLat);
        if (this.active) this.setHoverCursor(hit ? 'pointer' : '');
    }, HOVER_THROTTLE_MS);

    /** The Panoramax coverage map is on the map; not with Google, nor on engines without vector tiles. */
    private get showsCoverage(): boolean {
        return this.source === 'panoramax' && !this.coverageUnsupported;
    }

    get toolTip(): string {
        if (this.source === 'google') {
            return this.status === 'idle'
                ? `${this.touch.click} a street on the map to see a Google Street View photo of it.`
                : `${this.touch.click} another street to see a photo there.`;
        }
        if (this.zoomedOut && !this.coverageUnsupported) return 'Zoom in to see where photos were taken.';
        if (this.status === 'idle') {
            return this.coverageUnsupported
                ? `${this.touch.click} a road or path on the map to see a street photo of it.`
                : `${this.touch.click} a coloured line or dot to see a street photo.`;
        }
        return `${this.touch.click} another spot to see a photo there.`;
    }

    /** Escape closes the enlarged photo before it closes the panel. */
    handleEscape(): boolean {
        const dialog = this.dialog;
        if (!dialog?.open) return false;
        dialog.close();
        return true;
    }

    static styles = [accentControlStyles, formLabelStyles, helpTextStyles, css`
        :host {
            display: block;
            pointer-events: auto;
        }

        .street-photos {
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
            position: relative;
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

        .badge-360 {
            position: absolute;
            top: 0.4rem;
            left: 0.4rem;
            padding: 0.05rem 0.4rem;
            border-radius: 3px;
            font-size: 0.7rem;
            font-weight: 600;
            color: #fff;
            background: rgba(0, 0, 0, 0.6);
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

        .panorama {
            width: 100%;
            height: min(60vh, 480px);
            border-radius: 4px;
            overflow: hidden;
            background: #000;
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
        this.unsubPointerMove = adapter.events.on('pointer-move', (event: PointerMoveEvent) => {
            if (this.active && this.showsCoverage) this.throttledHover(event.pixel, event.coords);
        });
        this.unsubViewChangeEnd = adapter.events.on('view-change-end', () => this.updateZoomedOut());
    }

    protected onMapDetached(): void {
        this.unsubClick?.();
        this.unsubClick = null;
        this.unsubPointerMove?.();
        this.unsubPointerMove = null;
        this.unsubViewChangeEnd?.();
        this.unsubViewChangeEnd = null;
        super.onMapDetached();
    }

    disconnectedCallback(): void {
        this.removeMarker();
        this.removeCoverage();
        this.closePanorama();
        super.disconnectedCallback();
    }

    activate(): void {
        this.active = true;
        this.style.display = 'block';
        this.updateZoomedOut();
        if (this.source === 'panoramax') void this.addCoverage();
    }

    /** The tiles carry routes only from PANORAMAX_ROUTES_MIN_ZOOM; below it there is nothing to show. */
    private updateZoomedOut(): void {
        const zoom = this.adapter?.getViewportState()?.zoom;
        this.zoomedOut = typeof zoom === 'number' && zoom < PANORAMAX_ROUTES_MIN_ZOOM;
    }

    deactivate(): void {
        this.active = false;
        this.style.display = 'none';
        this.dialog?.close();
        this.requestNo++;
        this.status = 'idle';
        this.photo = null;
        this.spot = null;
        this.removeMarker();
        this.removeCoverage();
        this.setHoverCursor('');
    }

    protected onStateChanged(_state: IMapState): void {
        // No-op
    }

    private get settings(): Required<Pick<StreetPhotosToolConfig, 'apiUrl' | 'viewerUrl' | 'searchDistance'>> {
        const cfg = this.toolConfig;
        return {
            apiUrl: cfg.apiUrl || DEFAULT_PANORAMAX_API,
            viewerUrl: cfg.viewerUrl || DEFAULT_PANORAMAX_VIEWER,
            searchDistance: cfg.searchDistance ?? DEFAULT_SEARCH_DISTANCE_M,
        };
    }

    /** The tool's section; `panoramax` is the tool's earlier name. */
    private get toolConfig(): StreetPhotosToolConfig {
        return (this.toolsConfig?.['street-photos'] ?? this.toolsConfig?.['panoramax'] ?? {}) as StreetPhotosToolConfig;
    }

    /** The Google key, once `{key-google}` resolves; null offers Panoramax only. */
    private get googleApiKey(): string | null {
        const raw = this.toolConfig.googleApiKey;
        if (!raw) return null;
        const resolved = substituteApiKeys(raw);
        return resolved && !resolved.includes('{key-') ? resolved : null;
    }

    /** Switching service starts afresh: the photo shown came from the other one. */
    private selectSource = (event: Event): void => {
        const value = (event.target as HTMLInputElement).value;
        if (value !== 'panoramax' && value !== 'google') return;
        this.source = value;
        this.dialog?.close();
        this.requestNo++;
        this.status = 'idle';
        this.photo = null;
        this.spot = null;
        this.removeMarker();
        if (value === 'google') {
            this.removeCoverage();
            this.setHoverCursor('');
        } else {
            void this.addCoverage();
        }
    };

    // ─────────────────────────────────────────────────────────────────────
    // Coverage: shown while the tool is open, removed when it closes
    // ─────────────────────────────────────────────────────────────────────

    private async addCoverage(): Promise<void> {
        const adapter = this.adapter;
        const host = this.mapHost;
        if (!adapter || !host) return;
        const layer = panoramaxCoverageLayer(this.settings.apiUrl, this.colourBy);
        const source = Object.values(layer.sources as Record<string, { type: string; tiles: string[] }>)[0];
        // Asked, never inferred from the engine's name: Leaflet and Cesium draw no vector tiles.
        this.coverageUnsupported = !adapter.canDrawSource(source);
        if (this.coverageUnsupported || adapter.hasLayer?.(PANORAMAX_COVERAGE_LAYER_ID)) return;
        await host.addLayerRequest(layer);
        // Closed again while the layer was being added.
        if (!this.active) this.removeCoverage();
    }

    /** Recolours the routes and photo dots in place; the legend follows the store. */
    private selectColourBy = (event: Event): void => {
        const value = (event.target as HTMLInputElement).value;
        if (value !== 'coverage' && value !== 'date' && value !== 'camera') return;
        this.colourBy = value;
        const id = PANORAMAX_COVERAGE_LAYER_ID;
        if (!this.adapter?.hasLayer?.(id)) return;
        const year = new Date().getFullYear();
        this.adapter.updateLayerStyle(id, `${id}-sequences`, { 'line-color': panoramaxColour(value, 'sequences', year) });
        this.adapter.updateLayerStyle(id, `${id}-pictures`, { 'circle-color': panoramaxColour(value, 'pictures', year) });
    };

    private setHoverCursor(cursor: string): void {
        if (cursor === this.hoverCursor) return;
        this.hoverCursor = cursor;
        this.adapter?.setCursor(cursor);
    }

    private removeCoverage(): void {
        if (this.adapter?.hasLayer?.(PANORAMAX_COVERAGE_LAYER_ID)) {
            this.mapHost?.removeInlineLayer(PANORAMAX_COVERAGE_LAYER_ID);
        }
    }

    // ─────────────────────────────────────────────────────────────────────
    // Search
    // ─────────────────────────────────────────────────────────────────────

    /** What of the coverage map is under a point: a photo dot, a route, a density dot, or nothing. */
    private async coverageAt(pixel: Pixel, lngLat: LngLat): Promise<CoverageHit> {
        if (!this.adapter?.hasLayer?.(PANORAMAX_COVERAGE_LAYER_ID)) return null;
        const id = PANORAMAX_COVERAGE_LAYER_ID;
        try {
            const hits = await this.adapter.queryService.queryFeatures(
                { pixel, lngLat },
                { tolerancePx: DOT_TOLERANCE_PX, layerIds: [id] }
            );
            // Told apart by their own fields (Panoramax's tile schema), not by
            // sublayer id: engines do not all report which sublayer of an
            // inline composite a feature was drawn by.
            const dot = hits.find((h) => typeof h.properties.ts === 'string' && typeof h.properties.id === 'string');
            if (dot) return { kind: 'photo', id: dot.properties.id as string };
            if (hits.some((h) => typeof h.properties.date === 'string')) return { kind: 'route' };
            return null;
        } catch {
            return null;
        }
    }

    /**
     * The search distance for a click: what SEARCH_RADIUS_PX covers on the
     * ground at the current zoom, measured through the engine so it holds on
     * every engine and projection; never below the configured distance, never
     * above MAX_SEARCH_DISTANCE_M.
     */
    private searchDistanceAt(pixel: Pixel, lngLat: LngLat): number {
        const configured = this.settings.searchDistance;
        try {
            const edge = this.adapter?.unproject([pixel[0] + SEARCH_RADIUS_PX, pixel[1]]);
            if (!edge) return configured;
            const [lng2, lat2] = edge;
            const toRad = Math.PI / 180;
            const dLat = (lat2 - lngLat[1]) * toRad;
            const dLng = (lng2 - lngLat[0]) * toRad;
            const a = Math.sin(dLat / 2) ** 2
                + Math.cos(lngLat[1] * toRad) * Math.cos(lat2 * toRad) * Math.sin(dLng / 2) ** 2;
            const metres = 2 * 6371008.8 * Math.asin(Math.sqrt(a));
            return Number.isFinite(metres) ? Math.min(MAX_SEARCH_DISTANCE_M, Math.max(configured, metres)) : configured;
        } catch {
            return configured;
        }
    }

    private async handleClick(event: ClickEvent): Promise<void> {
        if (!this.active || !this.adapter) return;
        const requestNo = ++this.requestNo;

        if (this.source === 'google') {
            await this.searchGoogle(event, requestNo);
            return;
        }

        // Where the map can show coverage but is too far out to, a click
        // would search blind; the tip already says to zoom in.
        if (this.zoomedOut && !this.coverageUnsupported) {
            announce(this, 'Zoom in to see where photos were taken.');
            return;
        }
        const hit = await this.coverageAt(event.pixel, event.coords);
        if (requestNo !== this.requestNo) return;

        this.updateMarker(event.coords);
        this.status = 'loading';
        this.photo = null;

        const { apiUrl, viewerUrl } = this.settings;
        let photo: StreetPhoto | null;
        try {
            // A dot means "this photo"; anywhere else means "a photo of this spot".
            const dotId = hit?.kind === 'photo' ? hit.id : null;
            this.spot = dotId ? null : event.coords;
            const url = dotId
                ? buildPanoramaxPhotoUrl(apiUrl, dotId)
                : buildPanoramaxSearchUrl(apiUrl, event.coords, this.searchDistanceAt(event.pixel, event.coords));
            const res = await fetch(url);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            photo = parsePanoramaxPhoto(await res.json(), viewerUrl);
        } catch (error) {
            if (requestNo !== this.requestNo) return;
            console.warn('[street-photos-tool] Panoramax search failed', error);
            this.fail('Panoramax could not be reached. Try again in a moment.');
            return;
        }
        if (requestNo !== this.requestNo) return;
        this.found(photo);
    }

    /**
     * Google: the metadata request (free) says whether there is imagery near
     * the spot and where it was taken from; only then are images requested,
     * so a click on a field costs nothing.
     */
    private async searchGoogle(event: ClickEvent, requestNo: number): Promise<void> {
        const key = this.googleApiKey;
        if (!key) return;
        this.updateMarker(event.coords);
        this.status = 'loading';
        this.photo = null;
        this.spot = event.coords;
        let answer: unknown;
        try {
            const res = await fetch(buildGoogleMetadataUrl(event.coords, this.searchDistanceAt(event.pixel, event.coords), key));
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            answer = await res.json();
        } catch (error) {
            if (requestNo !== this.requestNo) return;
            console.warn('[street-photos-tool] Google Street View search failed', error);
            this.fail('Google Street View could not be reached. Try again in a moment.');
            return;
        }
        if (requestNo !== this.requestNo) return;
        const refusal = googleRefusal(answer);
        if (refusal) {
            console.warn(`[street-photos-tool] ${refusal}`);
            this.fail(`${refusal}. Check the Google key in the map's settings.`);
            return;
        }
        this.found(parseGoogleStreetView(answer, event.coords, key));
    }

    private found(photo: StreetPhoto | null): void {
        this.photo = photo;
        this.status = photo ? 'found' : 'none';
        announce(this, photo ? `Street photo found, by ${photo.credit}` : 'No street photos here');
    }

    private fail(text: string): void {
        this.errorText = text;
        this.status = 'error';
        announce(this, text);
    }

    /**
     * The image itself did not come. For Google that is a key accepted for the
     * free imagery check but refused for images (billing or the Static API
     * not enabled), which otherwise shows as a broken picture with no reason.
     */
    private imageFailed = (): void => {
        const photo = this.photo;
        if (!photo) return;
        this.photo = null;
        this.fail(photo.source === 'google'
            ? 'Google Street View found a photo here but would not send the image. Check that the Google key may use the Street View Static API.'
            : 'The photo could not be loaded. Try again in a moment.');
    };

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
    // Enlarged photo
    // ─────────────────────────────────────────────────────────────────────

    private get dialog(): HTMLDialogElement | null {
        return this.shadowRoot?.querySelector('dialog') ?? null;
    }

    private openDialog = async (): Promise<void> => {
        const photo = this.photo;
        const dialog = this.dialog;
        if (!photo || !dialog) return;
        this.panoramaFailed = false;
        dialog.showModal();
        if (photo.is360) await this.openPanorama(photo);
    };

    /**
     * A 360° photo is stored flattened, like a world map of the sphere around
     * the camera; Pannellum projects it back so the view is undistorted and
     * can be turned. It opens facing the clicked spot.
     */
    private async openPanorama(photo: StreetPhoto): Promise<void> {
        const container = this.shadowRoot?.querySelector<HTMLElement>('.panorama');
        if (!container) return;
        try {
            const pannellumCss = await loadPannellum();
            if (!this.dialog?.open || this.photo !== photo) return;
            if (!this.shadowRoot!.querySelector('style[data-pannellum]')) {
                const style = document.createElement('style');
                style.dataset.pannellum = '';
                style.textContent = pannellumCss;
                this.shadowRoot!.append(style);
            }
            this.closePanorama();
            this.panorama = window.pannellum!.viewer(container, {
                type: 'equirectangular',
                panorama: photo.largeUrl,
                autoLoad: true,
                crossOrigin: 'anonymous',
                yaw: yawTowards(photo, this.spot),
                hfov: 100,
                showFullscreenCtrl: false,
                strings: { loadingLabel: 'Loading photo…' },
            });
        } catch (error) {
            console.warn('[street-photos-tool] panorama viewer failed', error);
            this.panoramaFailed = true;
        }
    }

    private closePanorama(): void {
        this.panorama?.destroy();
        this.panorama = null;
    }

    // ─────────────────────────────────────────────────────────────────────
    // Rendering
    // ─────────────────────────────────────────────────────────────────────

    private renderCredit(photo: StreetPhoto): TemplateResult {
        const date = photo.takenAt ? new Date(photo.takenAt) : null;
        // Google gives a month ("2023-05"); naming a day would invent one.
        const monthOnly = /^\d{4}-\d{2}$/.test(photo.takenAt ?? '');
        const when = date && !Number.isNaN(date.getTime())
            ? date.toLocaleDateString(undefined, monthOnly
                ? { year: 'numeric', month: 'long' }
                : { year: 'numeric', month: 'long', day: 'numeric' })
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

    private renderOpenButton(photo: StreetPhoto): TemplateResult {
        const service = photo.source === 'google' ? 'Google Street View' : 'Panoramax';
        return html`
            <sl-button size="small" href=${photo.viewerUrl} target="_blank" rel="noopener noreferrer"
                title=${`Open this photo in ${service} in a new tab, to look around and walk on`}>
                <sl-icon name="box-arrow-up-right" slot="suffix" label="opens in a new tab"></sl-icon>
                Open in ${service}
            </sl-button>`;
    }

    private renderLarge(photo: StreetPhoto): TemplateResult {
        if (!photo.is360) return html`<img class="large" src=${photo.largeUrl} alt="Street photo near this spot">`;
        if (this.panoramaFailed) {
            return html`<p class="status help-text">This 360° photo could not be shown here. Open it in Panoramax to look around.</p>`;
        }
        return html`<div class="panorama" role="img" aria-label="360° street photo near this spot. Drag or use the arrow keys to look around."></div>`;
    }

    protected render(): TemplateResult {
        const photo = this.photo;
        return html`
            <div class="street-photos">
                ${this.googleApiKey ? html`
                    <sl-radio-group size="small" label="Photos from" value=${this.source} @sl-change=${this.selectSource}>
                        <sl-radio-button value="panoramax">Panoramax</sl-radio-button>
                        <sl-radio-button value="google">Google Street View</sl-radio-button>
                    </sl-radio-group>` : nothing}
                ${!this.showsCoverage ? nothing : html`
                    <sl-radio-group size="small" label="Colour by" value=${this.colourBy} @sl-change=${this.selectColourBy}>
                        <sl-radio-button value="coverage">Coverage</sl-radio-button>
                        <sl-radio-button value="date">Date</sl-radio-button>
                        <sl-radio-button value="camera">Camera</sl-radio-button>
                    </sl-radio-group>`}
                ${this.coverageUnsupported && this.source === 'panoramax' ? html`
                    <p class="status help-text">This map engine cannot show where photos are. Click a road or path to look for one.</p>` : nothing}
                ${this.status === 'loading' ? html`
                    <p class="status help-text"><sl-spinner></sl-spinner> Looking for photos…</p>` : nothing}
                ${this.status === 'none' ? html`
                    <p class="status help-text">No street photos here. ${this.showsCoverage
                        ? 'Click a coloured line or dot.'
                        : 'Photos are mostly taken along roads and paths.'}</p>` : nothing}
                ${this.status === 'error' ? html`
                    <p class="status help-text">${this.errorText}</p>` : nothing}
                ${photo ? html`
                    <button type="button" class="thumb-button" aria-haspopup="dialog"
                        title=${photo.is360 ? 'Enlarge the photo and look around' : 'Enlarge the photo'}
                        @click=${this.openDialog}>
                        <img src=${photo.thumbUrl} alt="Street photo near this spot, select to enlarge" @error=${this.imageFailed}>
                        ${photo.is360 ? html`<span class="badge-360" aria-hidden="true">360°</span>` : nothing}
                    </button>
                    ${this.renderCredit(photo)}
                    <div>
                        <sl-button size="small" class="enlarge" aria-haspopup="dialog" @click=${this.openDialog}>
                            <sl-icon name="arrows-angle-expand" slot="prefix"></sl-icon>
                            ${photo.is360 ? 'Open 360 view' : 'Open larger picture'}
                        </sl-button>
                    </div>

                    <dialog aria-labelledby="street-photos-dialog-title" @close=${() => this.closePanorama()}>
                        <div class="dialog-header">
                            <h3 id="street-photos-dialog-title">${photo.is360 ? 'Street photo, 360°' : 'Street photo'}</h3>
                            <sl-icon-button name="x-lg" label="Close" @click=${() => this.dialog?.close()}></sl-icon-button>
                        </div>
                        ${this.renderLarge(photo)}
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
