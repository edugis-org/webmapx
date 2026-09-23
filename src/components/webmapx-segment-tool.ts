/**
 * Segment tool — outline objects on the map with Segment Anything, in the browser.
 *
 * Click an object and its outline appears; click more of it (or right-click
 * what does not belong) to refine; press Keep to add it to a "Segments" layer.
 * Or switch to Box and drag around the object. Nothing leaves the browser: the
 * view is rendered to an image by the engine (`adapter.renderViewImage`),
 * encoded once by the model in a worker, and every click after that is a
 * decoder run of tens of milliseconds.
 *
 * - **What is segmented is what the engine renders**, so any raster the map
 *   can draw — WMS, WMTS, XYZ, a COG — works without the tool knowing its
 *   format. By default that is the whole map minus the tool's own overlays;
 *   choosing one layer (the aerial photo, without labels and boundaries on
 *   top) usually gives cleaner outlines.
 * - **The image belongs to one camera.** Moving the map invalidates the
 *   embedding; prompts are kept in lon/lat and re-projected, and the next
 *   prompt re-encodes the new view. A decode that finishes after the camera
 *   moved is discarded rather than unprojected through the wrong view.
 * - **Models are the user's choice and cost.** The panel shows each model's
 *   download size and whether it is already cached; nothing is downloaded
 *   until asked, except a model already in the cache. SAM 2.1 needs WebGPU to
 *   be quick; without it the tool starts on SlimSAM (14 MB, CPU).
 *
 * Config (`tools.segment`, all optional):
 *   modelBaseUrl  where model repositories live; `{repo}` is replaced by the
 *                 model's repository path. Default `models/{repo}/`, relative
 *                 to the config. HuggingFace: `https://huggingface.co/{repo}/resolve/main/`.
 *   models        model ids (or full entries) to offer; default all built-in.
 *   defaultModel  model selected first; default SAM 2.1 Tiny with WebGPU, else SlimSAM.
 */

import { html, css, nothing } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { WebmapxModalTool } from './webmapx-modal-tool';
import type { IMapState } from '../store/IMapState';
import type { IMap, ViewImage } from '../map/IMapInterfaces';
import type {
    ClickEvent, ContextMenuEvent, PointerDownEvent, PointerMoveEvent, PointerUpEvent,
} from '../store/map-events';
import type { WebmapxMapElement } from './webmapx-map';
import { DATA_END, DATA_START, DATA_TOOL, DATA_TOOL_HALO } from '../theme/data-colors';
import {
    DEFAULT_MODEL_BASE_URL, modelsFromConfig, resolveSamModel,
    type ResolvedSamModel, type SamModelEntry,
} from '../utils/sam/sam-models';
import { rewindPolygon } from '../utils/sam/mask-to-polygon';
import {
    decodeSamPrompt, encodeSamImage, isSamModelCached, loadSamModel, outlineSamMasks, probeSam,
} from '../utils/sam/sam-worker-client';
import type { SamCapabilities } from '../workers/sam.worker';
import type { SamGranularity, SamGranularityLevel, SamPrompt, SamResult } from '../workers/sam-runner';
import { isEventFromEditableElement } from '../utils/dom-focus-utils';

import '@shoelace-style/shoelace/dist/components/button/button.js';
import '@shoelace-style/shoelace/dist/components/button-group/button-group.js';
import '@shoelace-style/shoelace/dist/components/icon/icon.js';
import '@shoelace-style/shoelace/dist/components/select/select.js';
import '@shoelace-style/shoelace/dist/components/option/option.js';
import '@shoelace-style/shoelace/dist/components/progress-bar/progress-bar.js';
import '@shoelace-style/shoelace/dist/components/spinner/spinner.js';
import '@shoelace-style/shoelace/dist/components/alert/alert.js';
import '@shoelace-style/shoelace/dist/components/radio-group/radio-group.js';
import '@shoelace-style/shoelace/dist/components/radio-button/radio-button.js';
import '@shoelace-style/shoelace/dist/components/range/range.js';

type LngLat = [number, number];

const PREVIEW_SOURCE = 'webmapx-segment-preview';
const PREVIEW_FILL = 'webmapx-segment-preview-fill';
const PREVIEW_LINE = 'webmapx-segment-preview-line';
const PROMPT_POINTS = 'webmapx-segment-prompt-points';
const TOOL_LAYERS = [PREVIEW_FILL, PREVIEW_LINE, PROMPT_POINTS];

const RESULT_LAYER = 'webmapx-segments';
const RESULT_SOURCE = 'webmapx-segments-src';

/** SAM works on a 1024-pixel image; a smaller map is rendered sharper to supply it. */
const SAM_IMAGE_SIZE = 1024;

type LoadState = 'idle' | 'checking' | 'downloading' | 'loading' | 'ready' | 'error';

interface PromptPoint {
    lngLat: LngLat;
    positive: boolean;
}

interface LayerOption {
    id: string;
    label: string;
}

@customElement('webmapx-segment-tool')
export class WebmapxSegmentTool extends WebmapxModalTool {
    readonly toolId = 'segment';

    @state() private capabilities: SamCapabilities | null = null;
    @state() private models: SamModelEntry[] = [];
    @state() private modelId = '';
    @state() private cached: Record<string, boolean> = {};
    @state() private loadState: LoadState = 'idle';
    @state() private progress = 0;
    @state() private layers: LayerOption[] = [];
    /** '' means the map as shown. */
    @state() private layerId = '';
    @state() private mode: 'point' | 'box' = 'point';
    @state() private points: PromptPoint[] = [];
    @state() private box: [LngLat, LngLat] | null = null;
    @state() private preview: GeoJSON.Feature<GeoJSON.MultiPolygon> | null = null;
    @state() private busy: '' | 'encoding' | 'decoding' = '';
    @state() private error: string | null = null;
    @state() private kept = 0;
    /** Which of SAM's three candidates to outline; kept across prompts, it is a preference. */
    @state() private granularity: SamGranularity = 'auto';
    /** Logit at which the outline is drawn: negative looser, positive tighter. */
    @state() private threshold = 0;
    /** The candidate actually outlined, which `auto` does not say by itself. */
    @state() private outlined: SamGranularityLevel | null = null;

    private loadedModelKey = '';
    /** Bumped whenever the camera or the rendered content changes; an embedding is valid for one value. */
    private viewGeneration = 0;
    private encodedGeneration = -1;
    private encodedPixelRatio = 1;
    private overlaysAdded = false;
    private resultFeatures: GeoJSON.Feature[] = [];
    private resultLayerAdded = false;
    private dragStart: LngLat | null = null;
    private unsubs: (() => void)[] = [];
    private keyHandler: ((e: KeyboardEvent) => void) | null = null;
    private decodeRequested = false;
    private layerSignature = '';
    private decodeRunning = false;
    /** View generation the worker's current masks were decoded for; re-outlining is only valid within it. */
    private decodedGeneration = -1;
    private outlineRequested = false;
    private outlineRunning = false;

    static styles = css`
        :host { display: block; }
        :host(:not([active])) .tool-content { display: none; }

        .tool-content {
            padding: var(--sl-spacing-medium);
            display: flex;
            flex-direction: column;
            gap: var(--sl-spacing-small);
            font-size: var(--sl-font-size-small);
        }
        .hint {
            color: var(--color-text-secondary, #5a6773);
            font-size: var(--sl-font-size-x-small);
            line-height: 1.4;
            margin: 0;
        }
        .status {
            display: flex;
            align-items: center;
            gap: var(--sl-spacing-x-small);
            font-size: var(--sl-font-size-x-small);
            color: var(--color-text-secondary, #5a6773);
            min-height: 1.4em;
        }
        .row {
            display: flex;
            gap: var(--sl-spacing-x-small);
            align-items: center;
            flex-wrap: wrap;
        }
        .actions {
            display: flex;
            gap: var(--sl-spacing-x-small);
            justify-content: flex-end;
        }
        sl-select {
            --sl-input-height-medium: 28px;
            --sl-input-font-size-medium: var(--sl-font-size-small);
        }
        sl-alert { font-size: var(--sl-font-size-x-small); }
        sl-radio-group::part(form-control-label),
        sl-range::part(form-control-label) { font-size: var(--sl-font-size-small); }
        .range-ends {
            display: flex;
            justify-content: space-between;
            font-size: var(--sl-font-size-x-small);
            color: var(--color-text-secondary, #5a6773);
        }
    `;

    // ─── Config and state ────────────────────────────────────────────────

    private get section(): Record<string, unknown> | undefined {
        const tools = this.toolsConfig as Record<string, unknown> | undefined;
        return (tools?.[this.instanceId] ?? tools?.[this.toolId]) as Record<string, unknown> | undefined;
    }

    private get modelBaseUrl(): string {
        const configured = this.section?.modelBaseUrl;
        return typeof configured === 'string' && configured ? configured : DEFAULT_MODEL_BASE_URL;
    }

    private resolved(entry: SamModelEntry): ResolvedSamModel {
        const useFp16 = !!this.capabilities?.webgpu && !!this.capabilities.fp16;
        return resolveSamModel(entry, this.modelBaseUrl, useFp16, p => this.resolveConfigAsset(p));
    }

    private get selectedModel(): SamModelEntry | undefined {
        return this.models.find(m => m.id === this.modelId);
    }

    private get backend(): 'webgpu' | 'wasm' {
        return this.capabilities?.webgpu ? 'webgpu' : 'wasm';
    }

    protected onStateChanged(state: IMapState): void {
        const own = new Set([RESULT_LAYER, ...TOOL_LAYERS]);
        const entries = Object.entries(state.mapLayers ?? {}).filter(([id]) => !own.has(id));
        this.layers = entries
            .filter(([, meta]) => meta.visible !== false)
            .map(([id, meta]) => ({ id, label: String((meta as { label?: unknown }).label ?? id) }))
            .reverse(); // top of the map first, as in the legend
        if (this.layerId && !this.layers.some(l => l.id === this.layerId)) this.layerId = '';

        // Layers appearing, disappearing, hiding or fading change the picture,
        // and so the embedding. Nothing else in the store does: re-encoding
        // costs seconds, so it must not follow every unrelated store update.
        const signature = JSON.stringify(entries.map(([id, meta]) => [id, meta.visible !== false, meta.transparency ?? 0]));
        if (signature !== this.layerSignature) {
            this.layerSignature = signature;
            this.viewGeneration++;
        }
    }

    // ─── Lifecycle ───────────────────────────────────────────────────────

    protected async onActivate(): Promise<void> {
        this.error = null;
        this.listen();
        if (!this.capabilities) await this.initialise();
        else if (this.loadState === 'ready') this.prepareMap();
    }

    protected onDeactivate(): void {
        for (const off of this.unsubs) off();
        this.unsubs = [];
        if (this.keyHandler) document.removeEventListener('keydown', this.keyHandler);
        this.keyHandler = null;
        this.clearPrompt();
        this.removeOverlays();
        this.adapter?.setCursor('');
        this.adapter?.setPanEnabled(true);
        this.adapter?.setDoubleClickZoomEnabled(true);
    }

    private async initialise(): Promise<void> {
        this.loadState = 'checking';
        try {
            this.capabilities = await probeSam();
        } catch (err) {
            this.fail(err);
            return;
        }
        this.models = modelsFromConfig(this.section?.models);
        const configured = this.section?.defaultModel;
        const fallback = this.capabilities.webgpu ? 'sam2.1-tiny' : 'slimsam-77';
        this.modelId = [configured, fallback, this.models[0]?.id]
            .find(id => typeof id === 'string' && this.models.some(m => m.id === id)) as string;

        const cached: Record<string, boolean> = {};
        await Promise.all(this.models.map(async m => {
            cached[m.id] = await isSamModelCached(this.resolved(m)).catch(() => false);
        }));
        this.cached = cached;
        this.loadState = 'idle';
        // A model already in the cache costs nothing to open; anything else waits for the user.
        if (this.cached[this.modelId]) await this.loadModel();
    }

    private listen(): void {
        const adapter = this.adapter;
        if (!adapter || this.unsubs.length) return;
        this.unsubs.push(
            adapter.events.on('click', (e: ClickEvent) => this.handleClick(e)),
            adapter.events.on('contextmenu', (e: ContextMenuEvent) => this.handleContextMenu(e)),
            adapter.events.on('pointer-down', (e: PointerDownEvent) => this.handlePointerDown(e)),
            adapter.events.on('pointer-move', (e: PointerMoveEvent) => this.handlePointerMove(e)),
            adapter.events.on('pointer-up', (e: PointerUpEvent) => this.handlePointerUp(e)),
            adapter.events.on('view-change-end', () => this.handleViewChange()),
        );
        this.keyHandler = (e: KeyboardEvent) => this.handleKey(e);
        document.addEventListener('keydown', this.keyHandler);
    }

    private fail(err: unknown): void {
        this.error = err instanceof Error ? err.message : String(err);
        this.busy = '';
    }

    // ─── Model ───────────────────────────────────────────────────────────

    private async loadModel(): Promise<void> {
        const entry = this.selectedModel;
        if (!entry) return;
        const model = this.resolved(entry);
        const key = `${model.id}@${this.backend}`;
        if (key === this.loadedModelKey && this.loadState === 'ready') return;

        this.error = null;
        this.progress = 0;
        this.loadState = this.cached[entry.id] ? 'loading' : 'downloading';
        try {
            await loadSamModel(model, this.backend, (loaded, total) => {
                this.progress = total ? loaded / total : 0;
                if (loaded >= total) this.loadState = 'loading';
            });
        } catch (err) {
            this.loadState = 'error';
            this.fail(err);
            return;
        }
        // The user may have picked another model while this one downloaded.
        if (entry.id !== this.modelId) return;
        this.cached = { ...this.cached, [entry.id]: true };
        this.loadedModelKey = key;
        this.loadState = 'ready';
        this.encodedGeneration = -1;
        if (this.active) this.prepareMap();
        if (this.hasPrompt) this.requestDecode();
    }

    private handleModelChange(e: Event): void {
        this.modelId = (e.target as HTMLSelectElement).value;
        this.loadState = 'idle';
        this.loadedModelKey = '';
        this.preview = null;
        this.updateOverlays();
        if (this.cached[this.modelId]) void this.loadModel();
    }

    private handleLayerChange(e: Event): void {
        this.layerId = (e.target as HTMLSelectElement).value;
        this.viewGeneration++;
        if (this.hasPrompt) this.requestDecode();
    }

    // ─── Map interaction ─────────────────────────────────────────────────

    private prepareMap(): void {
        this.adapter?.setCursor('crosshair');
        this.adapter?.setDoubleClickZoomEnabled(false);
        this.adapter?.setPanEnabled(this.mode === 'point');
        this.ensureOverlays();
    }

    private setMode(mode: 'point' | 'box'): void {
        this.mode = mode;
        if (this.loadState === 'ready') this.adapter?.setPanEnabled(mode === 'point');
    }

    private get interactive(): boolean {
        return this.active && this.loadState === 'ready';
    }

    private get hasPrompt(): boolean {
        return this.points.length > 0 || !!this.box;
    }

    private handleClick(e: ClickEvent): void {
        if (!this.interactive || this.mode !== 'point') return;
        this.addPoint(e.coords as LngLat, true);
    }

    private handleContextMenu(e: ContextMenuEvent): void {
        if (!this.interactive || this.mode !== 'point') return;
        (e.originalEvent as Event | undefined)?.preventDefault?.();
        this.addPoint(e.coords as LngLat, false);
    }

    private addPoint(lngLat: LngLat, positive: boolean): void {
        this.points = [...this.points, { lngLat, positive }];
        this.requestDecode();
    }

    private handlePointerDown(e: PointerDownEvent): void {
        if (!this.interactive || this.mode !== 'box' || e.button !== 0) return;
        this.dragStart = e.coords as LngLat;
        this.box = null;
    }

    private handlePointerMove(e: PointerMoveEvent): void {
        if (!this.dragStart) return;
        this.box = [this.dragStart, e.coords as LngLat];
        this.updateOverlays();
    }

    private handlePointerUp(e: PointerUpEvent): void {
        if (!this.dragStart) return;
        const start = this.dragStart;
        this.dragStart = null;
        const a = this.adapter?.project(start);
        const b = this.adapter?.project(e.coords);
        // A click in box mode is not a box.
        if (!a || !b || Math.abs(a[0] - b[0]) < 4 || Math.abs(a[1] - b[1]) < 4) {
            this.box = null;
            this.updateOverlays();
            return;
        }
        this.box = [start, e.coords as LngLat];
        this.requestDecode();
    }

    private handleViewChange(): void {
        this.viewGeneration++;
    }

    private handleKey(e: KeyboardEvent): void {
        if (!this.active || isEventFromEditableElement(e)) return;
        if (e.key === 'Enter' && this.preview) {
            e.preventDefault();
            this.keep();
        } else if ((e.key === 'Backspace' || (e.key === 'z' && (e.ctrlKey || e.metaKey))) && this.points.length) {
            e.preventDefault();
            this.points = this.points.slice(0, -1);
            if (this.hasPrompt) this.requestDecode();
            else this.clearPrompt();
        }
    }

    // ─── Segmenting ──────────────────────────────────────────────────────

    /**
     * Coalesces prompts: clicks arriving while a decode runs are answered by
     * one more decode with all of them, not one each.
     */
    private requestDecode(): void {
        this.updateOverlays();
        this.decodeRequested = true;
        if (!this.decodeRunning) void this.runDecodes();
    }

    private async runDecodes(): Promise<void> {
        this.decodeRunning = true;
        try {
            while (this.decodeRequested) {
                this.decodeRequested = false;
                await this.decodeOnce();
            }
        } finally {
            this.decodeRunning = false;
            this.busy = '';
        }
    }

    private async ensureEncoded(adapter: IMap): Promise<boolean> {
        if (this.encodedGeneration === this.viewGeneration) return true;
        if (!adapter.renderViewImage) {
            throw new Error('This map engine cannot render its view to an image, so it cannot be segmented. Switch to MapLibre.');
        }
        const generation = this.viewGeneration;
        this.busy = 'encoding';
        const exclude = [RESULT_LAYER, ...TOOL_LAYERS];
        const view: ViewImage = await adapter.renderViewImage(this.layerId
            ? { include: [this.layerId], minLongestSide: SAM_IMAGE_SIZE }
            : { exclude, minLongestSide: SAM_IMAGE_SIZE });
        if (generation !== this.viewGeneration) {
            view.image.close();
            return false; // moved while rendering: try again with the new view
        }
        await encodeSamImage(view.image);
        if (generation !== this.viewGeneration) return false;
        this.encodedGeneration = generation;
        this.encodedPixelRatio = view.pixelRatio;
        return true;
    }

    private async decodeOnce(): Promise<void> {
        const adapter = this.adapter;
        if (!adapter || this.loadState !== 'ready' || !this.hasPrompt) return;
        this.error = null;
        try {
            if (!(await this.ensureEncoded(adapter))) {
                this.decodeRequested = true;
                return;
            }
            const generation = this.viewGeneration;
            const ratio = this.encodedPixelRatio;
            const toImage = (lngLat: LngLat) => {
                const [x, y] = adapter.project(lngLat);
                return { x: x * ratio, y: y * ratio };
            };
            const prompt: SamPrompt = {
                points: this.points.map(p => ({ ...toImage(p.lngLat), positive: p.positive })),
            };
            if (this.box) {
                const a = toImage(this.box[0]);
                const b = toImage(this.box[1]);
                prompt.box = { x0: a.x, y0: a.y, x1: b.x, y1: b.y };
            }
            this.busy = 'decoding';
            const result = await decodeSamPrompt(prompt, this.outlineOptions);
            if (generation !== this.viewGeneration) {
                this.decodeRequested = true; // outline belongs to a view that is gone
                return;
            }
            this.decodedGeneration = generation;
            this.showResult(adapter, result);
        } catch (err) {
            this.fail(err);
        }
    }

    private get outlineOptions() {
        return { granularity: this.granularity, threshold: this.threshold };
    }

    private showResult(adapter: IMap, result: SamResult): void {
        this.outlined = result.polygons.length ? result.granularity : null;
        this.preview = this.toFeature(adapter, result, this.encodedPixelRatio);
        this.updateOverlays();
    }

    /**
     * Granularity or threshold changed: redraw from the masks the worker kept,
     * without inference — unless the view moved since, in which case those
     * masks are in the wrong pixels and only a new decode will do.
     */
    private requestOutline(): void {
        if (!this.hasPrompt || this.decodeRunning) {
            if (this.hasPrompt) this.decodeRequested = true;
            return;
        }
        if (this.decodedGeneration !== this.viewGeneration) {
            this.requestDecode();
            return;
        }
        this.outlineRequested = true;
        if (!this.outlineRunning) void this.runOutlines();
    }

    private async runOutlines(): Promise<void> {
        this.outlineRunning = true;
        try {
            while (this.outlineRequested) {
                this.outlineRequested = false;
                const adapter = this.adapter;
                if (!adapter || this.decodedGeneration !== this.viewGeneration) return;
                const result = await outlineSamMasks(this.outlineOptions);
                if (this.decodedGeneration === this.viewGeneration && this.hasPrompt) this.showResult(adapter, result);
            }
        } catch (err) {
            this.fail(err);
        } finally {
            this.outlineRunning = false;
        }
    }

    private handleGranularityChange(e: Event): void {
        this.granularity = (e.target as HTMLInputElement).value as SamGranularity;
        this.requestOutline();
    }

    private handleThresholdInput(e: Event): void {
        this.threshold = Number((e.target as HTMLInputElement).value);
        this.requestOutline();
    }

    private toFeature(adapter: IMap, result: SamResult, ratio: number): GeoJSON.Feature<GeoJSON.MultiPolygon> | null {
        const polygons: LngLat[][][] = [];
        for (const polygon of result.polygons) {
            const rings: LngLat[][] = [];
            for (const ring of polygon) {
                const out: LngLat[] = [];
                for (const [x, y] of ring) {
                    const ll = adapter.unproject([x / ratio, y / ratio]);
                    if (ll) out.push([ll[0], ll[1]]);
                }
                // A ring partly off the globe (sky behind a pitched map) loses points; drop it rather than distort it.
                if (out.length === ring.length && out.length >= 4) rings.push(out);
            }
            if (rings.length) polygons.push(rewindPolygon(rings));
        }
        if (!polygons.length) return null;
        return {
            type: 'Feature',
            properties: {
                score: Math.round(result.score * 1000) / 1000,
                model: this.selectedModel?.label ?? this.modelId,
                granularity: result.granularity,
            },
            geometry: { type: 'MultiPolygon', coordinates: polygons },
        };
    }

    private clearPrompt(): void {
        this.points = [];
        this.box = null;
        this.dragStart = null;
        this.preview = null;
        this.outlined = null;
        this.decodeRequested = false;
        this.updateOverlays();
    }

    private async keep(): Promise<void> {
        if (!this.preview) return;
        const feature: GeoJSON.Feature = {
            ...this.preview,
            properties: { ...this.preview.properties, id: this.resultFeatures.length + 1 },
        };
        this.resultFeatures = [...this.resultFeatures, feature];
        this.kept = this.resultFeatures.length;
        this.clearPrompt();
        await this.writeResults();
    }

    /**
     * The result is an ordinary layer from the moment it exists: it stays when
     * the tool closes and is removed from the legend like any other. If the
     * user has removed it, the next kept outline starts a fresh one.
     */
    private async writeResults(): Promise<void> {
        const data: GeoJSON.FeatureCollection = { type: 'FeatureCollection', features: this.resultFeatures };
        const stillThere = this.resultLayerAdded && !!this.store?.getState().mapLayers?.[RESULT_LAYER];
        if (stillThere) {
            this.adapter?.getSource(RESULT_SOURCE)?.setData(data);
            return;
        }
        if (this.resultLayerAdded) {
            // Removed by the user: start over with just the newest outline.
            this.resultFeatures = this.resultFeatures.slice(-1);
            this.kept = 1;
            data.features = this.resultFeatures;
        }
        const host = this.mapHost as (WebmapxMapElement & { addLayerRequest(c: Record<string, unknown>): Promise<boolean> }) | null;
        await host?.addLayerRequest({
            id: RESULT_LAYER,
            type: 'fill',
            source: RESULT_SOURCE,
            sources: { [RESULT_SOURCE]: { id: RESULT_SOURCE, type: 'geojson', data } },
            paint: {
                'fill-color': DATA_TOOL,
                'fill-opacity': 0.25,
                'fill-outline-color': DATA_TOOL,
            },
            metadata: { label: 'Segments', dynamic: true, legendRole: 'overlay' },
        });
        this.resultLayerAdded = true;
    }

    // ─── Overlays ────────────────────────────────────────────────────────

    private emit(name: string, detail: unknown): void {
        this.dispatchEvent(new CustomEvent(name, { detail, bubbles: true, composed: true }));
    }

    private ensureOverlays(): void {
        if (this.overlaysAdded) return;
        this.emit('webmapx-add-source', {
            id: PREVIEW_SOURCE,
            config: { type: 'geojson', data: { type: 'FeatureCollection', features: [] } },
        });
        const meta = (label: string) => ({ isToolLayer: true, hideFromLegend: true, label });
        this.emit('webmapx-add-layer', {
            id: PREVIEW_FILL, type: 'fill', source: PREVIEW_SOURCE,
            metadata: meta('Segment preview'),
            filter: ['==', ['get', 'role'], 'mask'],
            paint: { 'fill-color': DATA_TOOL, 'fill-opacity': 0.3 },
        });
        this.emit('webmapx-add-layer', {
            id: PREVIEW_LINE, type: 'line', source: PREVIEW_SOURCE,
            metadata: meta('Segment outline'),
            filter: ['in', ['get', 'role'], ['literal', ['mask', 'box']]],
            paint: { 'line-color': DATA_TOOL, 'line-width': 2 },
        });
        this.emit('webmapx-add-layer', {
            id: PROMPT_POINTS, type: 'circle', source: PREVIEW_SOURCE,
            metadata: meta('Segment prompts'),
            filter: ['==', ['get', 'role'], 'point'],
            paint: {
                'circle-radius': 6,
                'circle-color': ['case', ['get', 'positive'], DATA_START, DATA_END],
                'circle-stroke-color': DATA_TOOL_HALO,
                'circle-stroke-width': 2,
            },
        });
        this.overlaysAdded = true;
        this.updateOverlays();
    }

    private updateOverlays(): void {
        if (!this.overlaysAdded) return;
        const features: GeoJSON.Feature[] = [];
        if (this.preview) {
            features.push({ ...this.preview, properties: { role: 'mask' } });
        }
        if (this.box) {
            const [[x0, y0], [x1, y1]] = this.box;
            features.push({
                type: 'Feature',
                properties: { role: 'box' },
                geometry: { type: 'LineString', coordinates: [[x0, y0], [x1, y0], [x1, y1], [x0, y1], [x0, y0]] },
            });
        }
        for (const p of this.points) {
            features.push({
                type: 'Feature',
                properties: { role: 'point', positive: p.positive },
                geometry: { type: 'Point', coordinates: p.lngLat },
            });
        }
        this.emit('webmapx-set-source-data', {
            id: PREVIEW_SOURCE,
            data: { type: 'FeatureCollection', features },
        });
    }

    private removeOverlays(): void {
        if (!this.overlaysAdded) return;
        for (const id of TOOL_LAYERS) this.emit('webmapx-remove-layer', id);
        this.emit('webmapx-remove-source', PREVIEW_SOURCE);
        this.overlaysAdded = false;
    }

    // ─── Render ──────────────────────────────────────────────────────────

    private variantOf(m: SamModelEntry) {
        return this.capabilities?.webgpu && this.capabilities.fp16 && m.fp16 ? m.fp16 : m.default;
    }

    /**
     * Static per model: Shoelace's select keeps the text an option had when it
     * was chosen, so anything that changes (cached or not) goes in the hint instead.
     */
    private modelLabel(m: SamModelEntry): string {
        return `${m.label} · ${this.variantOf(m).sizeMB} MB`;
    }

    private modelHint(m: SamModelEntry | undefined) {
        if (!m) return nothing;
        const slow = !this.capabilities?.webgpu && !m.cpuFriendly;
        return html`
            <p class="hint">
                ${this.cached[m.id]
                    ? 'Already downloaded.'
                    : `Downloaded once (${this.variantOf(m).sizeMB} MB) and kept by your browser.`}
                Images never leave your computer.
                ${slow ? html`<br>This browser has no WebGPU, so analysing each view takes 10–30 seconds with this model; SlimSAM is quicker.` : nothing}
            </p>
        `;
    }

    private renderModel() {
        const entry = this.selectedModel;
        const busyLoading = this.loadState === 'downloading' || this.loadState === 'loading' || this.loadState === 'checking';
        return html`
            <sl-select
                label="Model"
                size="small"
                value=${this.modelId}
                ?disabled=${busyLoading || !this.models.length}
                @sl-change=${this.handleModelChange}
            >
                ${this.models.map(m => html`<sl-option value=${m.id}>${this.modelLabel(m)}</sl-option>`)}
            </sl-select>
            ${this.loadState === 'idle' || this.loadState === 'error' ? html`
                <div class="row">
                    <sl-button size="small" variant="primary" ?disabled=${!entry} @click=${() => this.loadModel()}>
                        <sl-icon slot="prefix" name=${this.cached[this.modelId] ? 'play' : 'download'}></sl-icon>
                        ${this.cached[this.modelId] ? 'Start' : 'Download and start'}
                    </sl-button>
                </div>
                ${this.modelHint(entry)}
            ` : nothing}
            ${this.loadState === 'downloading' ? html`
                <sl-progress-bar value=${Math.round(this.progress * 100)}></sl-progress-bar>
                <div class="status">Downloading ${entry?.label}…</div>
            ` : nothing}
            ${this.loadState === 'loading' || this.loadState === 'checking' ? html`
                <div class="status"><sl-spinner></sl-spinner>${this.loadState === 'checking' ? 'Checking this browser…' : `Starting ${entry?.label}…`}</div>
            ` : nothing}
        `;
    }

    private renderSegmenting() {
        return html`
            <sl-select
                label="Segment"
                size="small"
                value=${this.layerId}
                @sl-change=${this.handleLayerChange}
            >
                <sl-option value="">The map as shown</sl-option>
                ${this.layers.map(l => html`<sl-option value=${l.id}>${l.label}</sl-option>`)}
            </sl-select>
            <sl-button-group label="Prompt">
                <sl-button size="small" variant=${this.mode === 'point' ? 'primary' : 'default'}
                    @click=${() => this.setMode('point')}>
                    <sl-icon slot="prefix" name="hand-index"></sl-icon>Points
                </sl-button>
                <sl-button size="small" variant=${this.mode === 'box' ? 'primary' : 'default'}
                    @click=${() => this.setMode('box')}>
                    <sl-icon slot="prefix" name="bounding-box"></sl-icon>Box
                </sl-button>
            </sl-button-group>
            <p class="hint">
                ${this.mode === 'point'
                    ? html`Click an object to outline it. Click again to add to it, right-click to leave something out.`
                    : html`Drag a box around an object.`}
                Enter keeps the outline${this.mode === 'point' ? ', Backspace undoes the last click' : ''}.
            </p>
            <sl-radio-group
                label="Outline"
                size="small"
                .value=${this.granularity}
                @sl-change=${this.handleGranularityChange}
            >
                <sl-radio-button value="auto">Auto</sl-radio-button>
                <sl-radio-button value="whole">Whole</sl-radio-button>
                <sl-radio-button value="part">Part</sl-radio-button>
                <sl-radio-button value="detail">Detail</sl-radio-button>
            </sl-radio-group>
            <div>
                <sl-range
                    label="Edge"
                    min="-2" max="2" step="0.1"
                    .value=${this.threshold}
                    .tooltipFormatter=${(v: number) => (v === 0 ? 'model boundary' : v < 0 ? 'looser' : 'tighter')}
                    @sl-input=${this.handleThresholdInput}
                ></sl-range>
                <div class="range-ends"><span>Looser</span><span>Tighter</span></div>
            </div>
            <div class="status">
                ${this.busy === 'encoding' ? html`<sl-spinner></sl-spinner>Analysing the view…` : nothing}
                ${this.busy === 'decoding' ? html`<sl-spinner></sl-spinner>Outlining…` : nothing}
                ${!this.busy && this.preview ? html`Model confidence ${Math.round(Number(this.preview.properties?.score ?? 0) * 100)}%${this.granularity === 'auto' && this.outlined ? html` · ${this.outlined}` : nothing}` : nothing}
                ${!this.busy && this.hasPrompt && !this.preview ? html`Nothing found here.` : nothing}
            </div>
            <div class="actions">
                <sl-button size="small" ?disabled=${!this.hasPrompt} @click=${() => this.clearPrompt()}>Clear</sl-button>
                <sl-button size="small" variant="primary" ?disabled=${!this.preview} @click=${() => this.keep()}>
                    <sl-icon slot="prefix" name="check-lg"></sl-icon>Keep
                </sl-button>
            </div>
            ${this.kept ? html`<p class="hint">${this.kept} outline${this.kept === 1 ? '' : 's'} in the “Segments” layer.</p>` : nothing}
        `;
    }

    protected render() {
        return html`
            <div class="tool-content">
                ${this.renderModel()}
                ${this.loadState === 'ready' ? this.renderSegmenting() : nothing}
                ${this.error ? html`
                    <sl-alert variant="danger" open>
                        <sl-icon slot="icon" name="exclamation-octagon"></sl-icon>
                        ${this.error}
                    </sl-alert>
                ` : nothing}
            </div>
        `;
    }
}
