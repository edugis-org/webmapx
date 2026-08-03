// src/components/webmapx-stories-tool.ts
// Guided-tour tool: chapters/steps that fly the camera, toggle layer visibility/opacity,
// and show HTML content (inline or fetched from a URL).

import { html, css, nothing, TemplateResult } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { unsafeHTML } from 'lit-html/directives/unsafe-html.js';
import { WebmapxModalTool } from './webmapx-modal-tool';
import type { IMap } from '../map/IMapInterfaces';
import type { AppConfig, StoryChapterConfig, StoryConfig, StoryStepConfig } from '../config/types';
import { toStoryStepState } from '../config/story-step-state';
import { sanitizeAbstractHtml } from '../utils/sanitize-html';
import '@shoelace-style/shoelace/dist/components/button/button.js';
import '@shoelace-style/shoelace/dist/components/icon/icon.js';
import '@shoelace-style/shoelace/dist/components/spinner/spinner.js';

interface FlattenedStep {
    step: StoryStepConfig;
    chapter: StoryChapterConfig;
}

interface StartState {
    viewport: { center: [number, number]; zoom: number; bearing: number; pitch: number };
    visible: Map<string, boolean>;
    transparency: Map<string, number>;
    terrain: boolean;
    projection: string;
}

/** True if a logical layer id has actually been added to the map (present in mapLayers). */
function isLayerLoaded(adapter: IMap, layerId: string): boolean {
    return layerId in (adapter.store.getState().mapLayers ?? {});
}

type HtmlContent =
    | { kind: 'html'; html: string }
    | { kind: 'loading' }
    | { kind: 'error' };

@customElement('webmapx-stories-tool')
export class WebmapxStoriesTool extends WebmapxModalTool {
    readonly toolId = 'stories';

    @state() private stories: StoryConfig[] = [];
    @state() private selectedStory: StoryConfig | null = null;
    @state() private stepIndex = 0;
    @state() private content: HtmlContent = { kind: 'html', html: '' };

    private flattenedSteps: FlattenedStep[] = [];
    private startState: StartState | null = null;
    /** Layer ids the current story added (weren't already loaded) — removed again on close. */
    private addedLayerIds = new Set<string>();
    /** Bumped on every step change/close so a stale in-flight applyStep() can no-op. */
    private stepToken = 0;
    /** Union of layer ids referenced by any step of the current story — a layer visible from
     *  an earlier step but absent from the current step's `state.layers` must be hidden again. */
    private storyLayerIds = new Set<string>();
    private htmlCache = new Map<string, string>();
    private fetchToken = 0;
    private deepLinkStoryName: string | null = null;
    /** Layer ids the config activates by default — never torn down by closeStory(), even if
     *  a story happens to add one before the config's own initial-state restore finishes. */
    private defaultActiveLayerIds = new Set<string>();

    // ─────────────────────────────────────────────────────────────────────
    // Config
    // ─────────────────────────────────────────────────────────────────────

    protected onMapAttached(adapter: IMap): void {
        super.onMapAttached(adapter);
        this.subscribeToConfig();
    }

    protected onMapDetached(): void {
        this.unsubscribeFromConfig();
        super.onMapDetached();
    }

    protected onConfigReady(config: AppConfig): void {
        this.stories = config.stories?.stories ?? [];
        this.defaultActiveLayerIds = new Set(
            (config.state?.activeLayers ?? []).map(entry =>
                typeof entry === 'string' ? entry : (entry.ref ?? entry.layerId ?? entry.id)
            ).filter((id): id is string => typeof id === 'string')
        );

        if (this.deepLinkStoryName === null) {
            this.deepLinkStoryName = typeof window !== 'undefined'
                ? new URLSearchParams(window.location.search).get('story')
                : null;
        }
        if (this.deepLinkStoryName) {
            const match = this.stories.find(s => s.name.toLowerCase() === this.deepLinkStoryName!.toLowerCase());
            if (match) {
                this.deepLinkStoryName = null;
                this.activate();
                this.openStory(match);
            }
        }
    }

    // ─────────────────────────────────────────────────────────────────────
    // Story lifecycle
    // ─────────────────────────────────────────────────────────────────────

    protected onDeactivate(): void {
        super.onDeactivate();
        this.closeStory();
    }

    private openStory(story: StoryConfig): void {
        if (!this.adapter) return;

        this.flattenedSteps = story.chapters.flatMap(chapter =>
            chapter.steps.map(step => ({ step, chapter }))
        );
        if (this.flattenedSteps.length === 0) return;

        this.storyLayerIds = new Set(
            story.chapters.flatMap(chapter => chapter.steps.flatMap(step => step.state.layers))
        );
        this.startState = this.captureStartState();
        this.addedLayerIds.clear();
        this.selectedStory = story;
        this.stepIndex = 0;
        void this.applyStep(this.flattenedSteps[0].step);
        this.setPanelWidth(story.width ?? null);
    }

    private closeStory(): void {
        this.stepToken++;
        if (this.startState && this.adapter) {
            this.restoreStartState(this.startState);
        }
        for (const id of this.addedLayerIds) {
            this.adapter?.removeLogicalLayer(id);
        }
        this.addedLayerIds.clear();
        this.selectedStory = null;
        this.flattenedSteps = [];
        this.startState = null;
        this.setPanelWidth(null);
    }

    /** Notifies the enclosing webmapx-tool-panel to widen/reset itself for this story. */
    private setPanelWidth(width: string | null): void {
        this.dispatchEvent(new CustomEvent('webmapx-panel-width', {
            detail: { toolId: this.instanceId, width },
            bubbles: true,
            composed: true
        }));
    }

    private captureStartState(): StartState {
        const adapter = this.adapter!;
        const viewport = adapter.getViewportState();
        const visible = new Map<string, boolean>();
        const transparency = new Map<string, number>();
        const mapLayers = adapter.store.getState().mapLayers ?? {};

        for (const id of this.storyLayerIds) {
            const entry = mapLayers[id];
            // Layers not yet loaded aren't tracked here — they get added on demand by
            // applyStep and fully removed again on close instead of restored to a fabricated
            // "before" state that never existed.
            if (!entry) continue;
            visible.set(id, entry.visible ?? true);
            transparency.set(id, entry.transparency ?? 0);
        }

        return {
            viewport,
            visible,
            transparency,
            terrain: adapter.isTerrainEnabled() === true,
            projection: adapter.getProjection()?.name ?? 'mercator'
        };
    }

    private restoreStartState(start: StartState): void {
        const adapter = this.adapter!;
        // Bearing/pitch first: MapLibre's setBearing/setPitch call jumpTo internally, which
        // cancels any in-progress flyTo — so the animated setViewport call must go last.
        adapter.setBearing(start.viewport.bearing);
        adapter.setPitch(start.viewport.pitch);
        adapter.setViewport(start.viewport.center, start.viewport.zoom);

        // setLayerVisibility/setLayerOpacity mirror into store.mapLayers themselves (see
        // base-adapter.ts), so the legend reflects the restored state without any extra work
        // here.
        for (const [id, visible] of start.visible) {
            adapter.setLayerVisibility(id, visible);
        }
        for (const [id, transparency] of start.transparency) {
            adapter.setLayerOpacity(id, (100 - transparency) / 100);
        }

        adapter.setTerrainEnabled(start.terrain);
        adapter.setProjection(start.projection);
    }

    // ─────────────────────────────────────────────────────────────────────
    // Step navigation
    // ─────────────────────────────────────────────────────────────────────

    private goToStep(index: number): void {
        if (index < 0 || index >= this.flattenedSteps.length) return;
        this.stepIndex = index;
        void this.applyStep(this.flattenedSteps[index].step);
    }

    private goToChapter(chapter: StoryChapterConfig): void {
        const index = this.flattenedSteps.findIndex(f => f.chapter === chapter);
        if (index >= 0) this.goToStep(index);
    }

    /** Applies a step's camera/layer/terrain state via adapter calls. setLayerVisibility/
     *  setLayerOpacity mirror into store.mapLayers themselves (see base-adapter.ts), so the
     *  legend reflects what the story is showing without this needing to touch the store
     *  directly. Camera/projection/terrain are still never dispatched — no UI needs those
     *  live, and captureStartState/restoreStartState already give the story its own restore
     *  path for them. Layers the step references that aren't loaded yet are added on demand
     *  (tracked in `addedLayerIds`); unlike permalink restore, a story step is allowed to
     *  bring in layers the map didn't start with. A story-added layer no longer referenced by
     *  the new step is removed outright rather than just hidden, so the legend never lists a
     *  leftover layer from a step the story isn't currently on. */
    private async applyStep(step: StoryStepConfig): Promise<void> {
        const adapter = this.adapter;
        const mapHost = this.mapHost;
        if (!adapter || !mapHost) return;

        const token = ++this.stepToken;
        const { l, h, v, t, p, terrain } = toStoryStepState(step.state);

        await Promise.all(l.map(async (id) => {
            if (isLayerLoaded(adapter, id)) return;
            const added = await mapHost.addLayerRequest({ layerId: id });
            if (added && !this.defaultActiveLayerIds.has(id)) this.addedLayerIds.add(id);
        }));
        if (token !== this.stepToken) return; // superseded by a later step/close

        const [lng, lat, zoom, bearing, pitch] = v;
        // Bearing/pitch first: MapLibre's setBearing/setPitch call jumpTo internally, which
        // cancels any in-progress flyTo — so the animated setViewport call must go last.
        adapter.setBearing(bearing);
        adapter.setPitch(pitch);
        adapter.setViewport([lng, lat], zoom);

        // Iterate the story's full layer union, not just this step's `l` — a layer shown by
        // an earlier step but not referenced by this one must be dealt with again (regression:
        // going Prev from a step that showed a layer back to one that doesn't mention it at
        // all previously left that layer visible).
        const visibleHere = new Set(l);
        const hidden = new Set(h ?? []);
        // setLayerVisibility/setLayerOpacity mirror into store.mapLayers themselves (see
        // base-adapter.ts), so the legend reflects what the story is showing automatically.
        for (const id of this.storyLayerIds) {
            if (!visibleHere.has(id)) {
                // A layer the story itself added is fully removed once no longer needed,
                // instead of merely hidden — otherwise the legend keeps listing (hidden)
                // layers left over from whichever steps happened to be visited earlier,
                // making it depend on navigation history rather than just the current step.
                // A layer that was already on the map before the story opened isn't the
                // story's to delete, so that one is only hidden (restored by
                // captureStartState/restoreStartState when the story closes).
                if (this.addedLayerIds.has(id)) {
                    adapter.removeLogicalLayer(id);
                    this.addedLayerIds.delete(id);
                } else {
                    adapter.setLayerVisibility(id, false);
                }
                continue;
            }
            adapter.setLayerVisibility(id, !hidden.has(id));
            const transparency = t?.[id] ?? 0;
            adapter.setLayerOpacity(id, (100 - transparency) / 100);
        }

        adapter.setTerrainEnabled(!!terrain);
        adapter.setProjection(p ?? 'mercator');

        this.loadContent(step);
    }

    // ─────────────────────────────────────────────────────────────────────
    // HTML content (inline or fetched from htmlUrl)
    // ─────────────────────────────────────────────────────────────────────

    private loadContent(step: StoryStepConfig): void {
        if (step.htmlUrl) {
            void this.loadContentFromUrl(step.htmlUrl);
            return;
        }
        this.content = { kind: 'html', html: sanitizeAbstractHtml(step.html ?? '') };
    }

    private async loadContentFromUrl(url: string): Promise<void> {
        const token = ++this.fetchToken;

        const cached = this.htmlCache.get(url);
        if (cached !== undefined) {
            this.content = { kind: 'html', html: cached };
            return;
        }

        this.content = { kind: 'loading' };
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const text = await response.text();
            if (token !== this.fetchToken) return;
            const sanitized = sanitizeAbstractHtml(text, url);
            this.htmlCache.set(url, sanitized);
            this.content = { kind: 'html', html: sanitized };
        } catch {
            if (token !== this.fetchToken) return;
            this.content = { kind: 'error' };
        }
    }

    // ─────────────────────────────────────────────────────────────────────
    // Render
    // ─────────────────────────────────────────────────────────────────────

    static styles = css`
        :host {
            display: block;
            pointer-events: auto;
        }

        :host(:not([active])) .tool-content {
            display: none;
        }

        .stories-container {
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
            padding: var(--webmapx-tool-padding, 0);
            font-size: var(--font-size-small, 0.875rem);
        }

        .story-list-item {
            display: block;
            width: 100%;
            padding: 0.5rem;
            border: 0;
            border-bottom: 1px solid var(--color-border-light, #eee);
            background: transparent;
            font: inherit;
            color: inherit;
            text-align: left;
            cursor: pointer;
        }

        .story-list-item:hover {
            background: var(--color-surface-hover, #f5f5f5);
        }

        .story-name {
            font-weight: 600;
        }

        .story-description {
            color: var(--color-text-secondary, #666);
            font-size: 0.8125rem;
        }

        .story-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 0.5rem;
        }

        .story-header .story-name {
            flex: 1;
        }

        .chapter-buttons {
            display: flex;
            flex-wrap: wrap;
            gap: 0.25rem;
        }

        .step-content {
            border-top: 1px solid var(--color-border-light, #eee);
            padding-top: 0.5rem;
            max-height: 20rem;
            overflow-y: auto;
        }

        .step-title {
            font-weight: 600;
            margin-bottom: 0.25rem;
        }

        .step-nav {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 0.5rem;
        }

        .step-counter {
            color: var(--color-text-secondary, #666);
            font-size: 0.75rem;
        }

        .loading {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            color: var(--color-text-secondary, #666);
        }
    `;

    private renderList(): TemplateResult {
        if (this.stories.length === 0) {
            return html`<p class="story-description">No stories configured.</p>`;
        }
        return html`
            ${this.stories.map(story => html`
                <button type="button" class="story-list-item" @click=${() => this.openStory(story)}>
                    <div class="story-name">${story.name}</div>
                    ${story.description ? html`<div class="story-description">${story.description}</div>` : nothing}
                </button>
            `)}
        `;
    }

    private renderContent(): TemplateResult {
        switch (this.content.kind) {
            case 'loading':
                return html`<div class="loading"><sl-spinner></sl-spinner> Loading…</div>`;
            case 'error':
                return html`<p class="story-description">Could not load content.</p>`;
            case 'html':
                return html`${unsafeHTML(this.content.html)}`;
        }
    }

    private renderStory(story: StoryConfig): TemplateResult {
        const total = this.flattenedSteps.length;
        const current = this.flattenedSteps[this.stepIndex];

        return html`
            <div class="story-header">
                <span class="story-name">${story.name}</span>
                <sl-button size="small" @click=${() => this.closeStory()}>
                    <sl-icon name="x-lg" slot="prefix"></sl-icon>
                    Close
                </sl-button>
            </div>

            <div class="chapter-buttons">
                ${story.chapters.map(chapter => html`
                    <sl-button
                        size="small"
                        variant=${current?.chapter === chapter ? 'primary' : 'default'}
                        @click=${() => this.goToChapter(chapter)}
                    >${chapter.buttonText ?? chapter.title}</sl-button>
                `)}
            </div>

            <div class="step-content" aria-live="polite">
                ${current?.step.title ? html`<div class="step-title">${current.step.title}</div>` : nothing}
                ${this.renderContent()}
            </div>

            <div class="step-nav">
                <sl-button size="small" ?disabled=${this.stepIndex === 0} @click=${() => this.goToStep(this.stepIndex - 1)}>
                    <sl-icon name="chevron-left" slot="prefix"></sl-icon>
                    Prev
                </sl-button>
                <span class="step-counter">${this.stepIndex + 1} / ${total}</span>
                <sl-button size="small" ?disabled=${this.stepIndex >= total - 1} @click=${() => this.goToStep(this.stepIndex + 1)}>
                    Next
                    <sl-icon name="chevron-right" slot="suffix"></sl-icon>
                </sl-button>
            </div>
        `;
    }

    protected render(): TemplateResult {
        return html`
            <div class="tool-content stories-container">
                ${this.selectedStory ? this.renderStory(this.selectedStory) : this.renderList()}
            </div>
        `;
    }
}
