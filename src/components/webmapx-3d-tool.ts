import { html, css, TemplateResult } from 'lit';
import { formLabelStyles } from './internal/form-label-styles';
import { helpTextStyles } from './internal/help-text-styles';
import '@shoelace-style/shoelace/dist/components/radio-group/radio-group.js';
import '@shoelace-style/shoelace/dist/components/radio-button/radio-button.js';
import '@shoelace-style/shoelace/dist/components/switch/switch.js';
import { customElement, state } from 'lit/decorators.js';
import { WebmapxBaseTool } from './webmapx-base-tool';
import type { IMapState } from '../store/IMapState';
import { controlSurfaceStyles } from './internal/control-surface-styles';
import { TERRAIN_LAYER_ID } from '../utils/permalink-state';

const PITCH_PRESETS = [0, 30, 60];

@customElement('webmapx-3d-tool')
export class Webmapx3dTool extends WebmapxBaseTool {
    @state() private pitch = 0;
    @state() private terrainEnabled = false;
    @state() private terrainSupported = false;
    @state() private pitchSupported = true;

    static styles = [formLabelStyles, helpTextStyles, controlSurfaceStyles, css`
        :host { display: block; padding: var(--webmapx-tool-padding, 0); font-size: var(--webmapx-font-size-md, 0.875rem); }
        .unsupported { color: var(--color-text-muted, #6b7681); font-style: italic; }
        /* The viewing angle: one choice between named angles, so a segmented
           control spread over the panel's width as the three buttons were. */
        .pitch { display: block; margin-bottom: var(--webmapx-space-md, 0.75rem); }
        .pitch::part(button-group) { width: 100%; }
        .pitch sl-radio-button { flex: 1; }
        .pitch-hint { margin-bottom: var(--webmapx-space-sm, 0.5rem); }
        .terrain-row { display: flex; align-items: center; gap: var(--webmapx-space-sm, 0.5rem); }
    `];

    protected onMapAttached(): void {
        this.syncFromAdapter();
    }

    protected onStateChanged(state: IMapState): void {
        this.syncFromAdapter();
        if (state.terrainEnabled && !this.terrainEnabled && this.terrainSupported) {
            void this.toggleTerrain();
        }
    }

    private syncFromAdapter(): void {
        if (!this.adapter) return;
        const caps = this.adapter.getNavigationCapabilities();
        this.pitchSupported = caps?.pitch !== false;
        this.pitch = this.adapter.getPitch();
        const terrainState = this.adapter.isTerrainEnabled();
        this.terrainSupported = terrainState !== null;
        this.terrainEnabled = terrainState === true;
    }

    /** A click on the option already selected: the group fires no change for it. */
    private reselectPitch(e: Event, pitch: number): void {
        if ((e.currentTarget as HTMLInputElement).checked) this.setPitch(pitch);
    }

    private setPitch(pitch: number): void {
        if (!this.adapter) return;
        this.adapter.setPitch(pitch);
        this.pitch = pitch;
    }

    private getToolAttr(name: string): string | undefined {
        const toolId = this.getAttribute('tool-id');
        const groups = this.toolsConfig ? Object.values(this.toolsConfig) : [];
        for (const group of groups) {
            const items = Array.isArray((group as any)?.items) ? (group as any).items : [];
            for (const item of items) {
                if (item?.id === toolId && typeof item[name] === 'string') {
                    return item[name] as string;
                }
            }
        }
        return undefined;
    }

    private getDemTerrainSource(): unknown {
        // Check top-level sources
        const source = this.layerDataConfig?.sources?.find((s: any) => s?.type === 'raster-dem');
        if (source) return source;
        // Check inline sources within layers (e.g. hillshade layer with embedded raster-dem)
        for (const layer of (this.layerDataConfig?.layers ?? [])) {
            const inlineSources = (layer as any)?.sources;
            if (!inlineSources || typeof inlineSources !== 'object') continue;
            for (const [key, src] of Object.entries(inlineSources as Record<string, unknown>)) {
                if ((src as any)?.type === 'raster-dem') {
                    const layerId = (layer as any)?.id as string | undefined;
                    // Return with the logical id so adapter can resolve to existing native source
                    return { ...(src as object), id: layerId ? `${layerId}:${key}` : key };
                }
            }
        }
        const url = this.getToolAttr('maplibre-terrain-fallback-url');
        if (url) {
            return { type: 'raster-dem', tiles: [url], tileSize: 256, encoding: 'terrarium', maxzoom: 15 };
        }
        return undefined;
    }

    private getTerrainServiceUrl(): string | undefined {
        const layer = this.layerDataConfig?.layers?.find((l: any) => l?.type === 'terrain' || l?.type === 'cesium-terrain');
        return (layer as any)?.url ?? (layer as any)?.source?.url ?? this.getToolAttr('cesium-terrain-fallback-url');
    }

    /** The layer this tool manages. Defined in `utils/permalink-state` because a permalink
     *  has to leave it out, and that must not mean importing this component. */
    static readonly TERRAIN_LAYER_ID = TERRAIN_LAYER_ID;

    private findActiveHillshadeSource(): unknown | undefined {
        const layers = this.store?.getState().mapLayers ?? {};
        for (const [logicalLayerId, meta] of Object.entries(layers)) {
            if ((meta as any)?.layerType !== 'hillshade') continue;

            // Standard layer: sourceId stored directly in metadata
            const sourceId = (meta as any)?.sourceId as string | undefined;
            if (sourceId) {
                const src = this.layerDataConfig?.sources?.find((s: any) => s?.id === sourceId);
                if (src) return src;
                if (this.adapter?.getSource(sourceId)) {
                    return { id: sourceId, type: 'raster-dem' };
                }
            }

            // Composite style layer: sourceId not in metadata — derive from sublayers.
            // The native source id is "${logicalLayerId}:${localKey}" (e.g. "relief:source").
            const sublayers = (meta as any)?.sublayers as any[] | undefined;
            if (sublayers) {
                for (const sub of sublayers) {
                    if (sub?.type !== 'hillshade') continue;
                    const localKey = typeof sub.source === 'string' ? sub.source : 'source';
                    const nativeId = `${logicalLayerId}:${localKey}`;
                    if (this.adapter?.getSource(nativeId)) {
                        return { id: nativeId, type: 'raster-dem' };
                    }
                }
            }
        }
        return undefined;
    }

    private async toggleTerrain(): Promise<void> {
        if (!this.adapter) return;
        // A terrain service is switched on by URL; elevation tiles need a
        // hillshade layer and its raster-dem source, below. Which one is the
        // engine's to say, not this tool's to guess from the engine's name.
        if (this.adapter.getTerrainSourceKind() === 'terrain-service') {
            const next = !this.terrainEnabled;
            if (this.adapter.setTerrainEnabled(next, this.getTerrainServiceUrl())) {
                this.terrainEnabled = next;
            }
            return;
        }

        if (this.terrainEnabled) {
            // uncheck: remove 3D effect but keep hillshade layer visible
            this.adapter.setTerrainEnabled(false);
            this.terrainEnabled = false;
            return;
        }

        // check: find existing hillshade layer, or add one
        let sourceConfig = this.findActiveHillshadeSource();
        if (!sourceConfig) {
            const terrainSource = this.getDemTerrainSource() as Record<string, unknown> | undefined;
            if (!terrainSource) return;
            const sourceId = (terrainSource.id as string | undefined) ?? 'webmapx-terrain-source';
            // Use catalog layer title if source came from an inline layer
            const catalogTitle = this.layerDataConfig?.layers?.find((l: any) => {
                const src = (l as any)?.sources?.[sourceId.split(':').pop() ?? ''];
                return src?.type === 'raster-dem' || (l as any)?.id && sourceId.startsWith((l as any).id);
            }) as any;
            const title = catalogTitle?.title ?? 'Terrain (hillshade)';
            const layerConfig = {
                id: Webmapx3dTool.TERRAIN_LAYER_ID,
                type: 'hillshade',
                source: sourceId,
                title,
                paint: { 'hillshade-exaggeration': 0.2 },
                sources: { [sourceId]: { ...terrainSource, id: sourceId } },
            };
            if (!await this.adapter.addLayer(layerConfig as any)) return;
            sourceConfig = { ...terrainSource, id: sourceId };
        }
        if (this.adapter.setTerrainEnabled(true, sourceConfig)) {
            this.terrainEnabled = true;
        }
    }

    render(): TemplateResult {
        if (!this.pitchSupported && !this.terrainSupported) {
            return html`<div class="unsupported">3D view is not supported by this engine.</div>`;
        }
        const rounded = Math.round(this.pitch);
        const activePreset = PITCH_PRESETS.includes(rounded) ? rounded : -1;
        // Button labels: left=0°, middle=30° or actual if between, right=60° or actual if >60
        const midLabel = (activePreset < 0 && rounded > 0 && rounded < 60) ? `${rounded}°` : '30°';
        const rightLabel = (activePreset < 0 && rounded > 60) ? `${rounded}°` : '60°';
        const midActive = activePreset < 0 && rounded > 0 && rounded <= 60;
        const rightActive = activePreset < 0 && rounded > 60;

        return html`
            ${this.pitchSupported ? html`
                <!-- A new choice, by mouse or arrow keys, arrives as the group's change.
                     Clicking the option that is already selected changes nothing, so
                     that click is handled on its own: after a hand tilt to 45° the
                     middle option reads 45° and is selected, and choosing it must
                     still return to 30°. -->
                <sl-radio-group class="pitch" size="small" label="Viewing angle"
                    .value=${activePreset >= 0 ? String(activePreset) : rightActive ? '60' : midActive ? '30' : '0'}
                    @sl-change=${(e: Event) => this.setPitch(Number((e.target as HTMLInputElement).value))}>
                    <sl-radio-button value="0" @click=${(e: Event) => this.reselectPitch(e, 0)}>0°</sl-radio-button>
                    <sl-radio-button value="30" @click=${(e: Event) => this.reselectPitch(e, 30)}>${midLabel}</sl-radio-button>
                    <sl-radio-button value="60" @click=${(e: Event) => this.reselectPitch(e, 60)}>${rightLabel}</sl-radio-button>
                </sl-radio-group>
                <div class="pitch-hint help-text">
                    You can also tilt the map with Ctrl + drag, by dragging the compass needle,
                    or with two fingers on a touch screen.
                </div>
            ` : ''}
            ${this.terrainSupported ? html`
                <div class="terrain-row">
                    <sl-switch size="small" id="webmapx-3d-terrain" .checked=${this.terrainEnabled}
                        @sl-change=${() => this.toggleTerrain()}>Show terrain in 3D</sl-switch>
                </div>
            ` : ''}
        `;
    }
}
