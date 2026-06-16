import { html, css, TemplateResult } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { WebmapxBaseTool } from './webmapx-base-tool';
import type { IMapState } from '../store/IMapState';

const PITCH_PRESETS = [0, 30, 60];

@customElement('webmapx-3d-tool')
export class Webmapx3dTool extends WebmapxBaseTool {
    @state() private pitch = 0;
    @state() private terrainEnabled = false;
    @state() private terrainSupported = false;
    @state() private pitchSupported = true;

    static styles = css`
        :host { display: block; padding: var(--webmapx-tool-padding, 0); font-size: 0.875rem; }
        .unsupported { color: var(--sl-color-neutral-500, #888); font-style: italic; }
        label { display: block; font-weight: 600; margin-bottom: 0.25rem; }
        .pitch-buttons { display: flex; gap: 0.5rem; margin-bottom: 0.75rem; }
        .pitch-buttons button {
            flex: 1; padding: 0.35rem 0; border: 1px solid var(--color-border, #d7dce3);
            border-radius: 4px; background: var(--color-background, #fff); cursor: pointer; font-size: 0.875rem;
        }
        .pitch-buttons button.active {
            background: var(--color-primary, #0f62fe); color: #fff; border-color: var(--color-primary, #0f62fe);
        }
        .pitch-hint { font-size: 0.8rem; color: var(--sl-color-neutral-600, #555); margin-bottom: 0.5rem; line-height: 1.5; }
        .terrain-row { display: flex; align-items: center; gap: 0.5rem; }
    `;

    protected onMapAttached(): void {
        this.syncFromAdapter();
    }

    protected onStateChanged(_state: IMapState): void {
        this.syncFromAdapter();
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

    private getMaplibreTerrainSource(): unknown {
        const url = this.getToolAttr('maplibre-terrain-url');
        if (url) {
            return { type: 'raster-dem', tiles: [url], tileSize: 256, encoding: 'terrarium', maxzoom: 15 };
        }
        const source = this.layerDataConfig?.sources?.find((s: any) => s?.type === 'raster-dem');
        return source;
    }

    private getCesiumTerrainUrl(): string | undefined {
        const url = this.getToolAttr('cesium-terrain-url');
        if (url) return url;
        const layer = this.layerDataConfig?.layers?.find((l: any) => l?.type === 'terrain' || l?.type === 'cesium-terrain');
        return (layer as any)?.url ?? (layer as any)?.source?.url;
    }

    private static readonly TERRAIN_LAYER_ID = 'webmapx-terrain-hillshade';

    private findActiveHillshadeSource(): unknown | undefined {
        const layers = this.store?.getState().mapLayers ?? {};
        for (const meta of Object.values(layers)) {
            if ((meta as any)?.layerType === 'hillshade') {
                const sourceId = (meta as any)?.sourceId as string | undefined;
                if (sourceId) {
                    const src = this.layerDataConfig?.sources?.find((s: any) => s?.id === sourceId);
                    if (src) return src;
                    // inline source embedded in the layer (added by 3D tool)
                    const inlineSrc = this.getMaplibreTerrainSource() as any;
                    if (inlineSrc) return { ...inlineSrc, id: sourceId };
                }
            }
        }
        return undefined;
    }

    private async toggleTerrain(): Promise<void> {
        if (!this.adapter) return;
        if (this.mapConfig?.type === 'cesium') {
            const next = !this.terrainEnabled;
            if (this.adapter.setTerrainEnabled(next, this.getCesiumTerrainUrl())) {
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
            const terrainSource = this.getMaplibreTerrainSource() as Record<string, unknown> | undefined;
            if (!terrainSource) return;
            const sourceId = (terrainSource.id as string | undefined) ?? 'webmapx-terrain-source';
            const layerConfig = {
                id: Webmapx3dTool.TERRAIN_LAYER_ID,
                type: 'hillshade',
                source: sourceId,
                title: 'Terrain (hillshade)',
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
                <label>3D terrain and viewing angle</label>
                <div class="pitch-buttons">
                    <button class=${activePreset === 0 ? 'active' : ''} @click=${() => this.setPitch(0)}>0°</button>
                    <button class=${(activePreset === 30 || midActive) ? 'active' : ''} @click=${() => this.setPitch(30)}>${midLabel}</button>
                    <button class=${(activePreset === 60 || rightActive) ? 'active' : ''} @click=${() => this.setPitch(60)}>${rightLabel}</button>
                </div>
                <div class="pitch-hint">
                    Choose a different viewing angle above,<br>
                    or use CTRL + mouse button,<br>
                    or drag the compass needle at the bottom left of the map,<br>
                    or use 2 fingers on a touch screen.
                </div>
            ` : ''}
            ${this.terrainSupported ? html`
                <div class="terrain-row">
                    <input type="checkbox" id="webmapx-3d-terrain" .checked=${this.terrainEnabled}
                        @change=${() => this.toggleTerrain()}>
                    <label for="webmapx-3d-terrain" style="margin:0;font-weight:normal;">Show terrain in 3D</label>
                </div>
            ` : ''}
        `;
    }
}
