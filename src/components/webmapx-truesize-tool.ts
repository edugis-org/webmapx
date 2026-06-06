import { html, css, TemplateResult } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { WebmapxBaseTool } from './webmapx-base-tool';
import type { IMapState } from '../store/IMapState';
import type { IMap } from '../map/IMapInterfaces';

type LngLat = [number, number];

interface TrueSizeCopy {
    id: string;
    label: string;
    color: string;
}

const COLORS = ['#e63946', '#2a9d8f', '#e9c46a', '#457b9d', '#f4a261', '#6a4c93', '#06d6a0', '#ff6b6b'];

const TRUESIZE_SOURCE = 'truesize-source';
const TRUESIZE_FILL = 'truesize-fill';
const TRUESIZE_LINE = 'truesize-line';
const GHOST_SOURCE = 'truesize-ghost-source';
const GHOST_FILL = 'truesize-ghost-fill';
const GHOST_LINE = 'truesize-ghost-line';

function geoCentroid(geom: GeoJSON.Geometry): LngLat {
    let pts: number[][] = [];
    if (geom.type === 'Polygon') pts = geom.coordinates[0];
    else if (geom.type === 'MultiPolygon') pts = geom.coordinates.flat(2);
    else if (geom.type === 'LineString') pts = geom.coordinates;
    else if (geom.type === 'MultiLineString') pts = geom.coordinates.flat();
    else if (geom.type === 'Point') pts = [geom.coordinates];
    if (pts.length === 0) return [0, 0];
    const s = pts.reduce((a, c) => [a[0] + c[0], a[1] + c[1]], [0, 0]);
    return [s[0] / pts.length, s[1] / pts.length];
}

function pointInRing(pt: LngLat, ring: number[][]): boolean {
    let inside = false;
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
        const xi = ring[i][0], yi = ring[i][1];
        const xj = ring[j][0], yj = ring[j][1];
        if (((yi > pt[1]) !== (yj > pt[1])) && pt[0] < ((xj - xi) * (pt[1] - yi)) / (yj - yi) + xi) {
            inside = !inside;
        }
    }
    return inside;
}

function hitTestFeature(pt: LngLat, geom: GeoJSON.Geometry): boolean {
    if (geom.type === 'Polygon') {
        return pointInRing(pt, geom.coordinates[0]) &&
            !geom.coordinates.slice(1).some(hole => pointInRing(pt, hole));
    }
    if (geom.type === 'MultiPolygon') {
        return geom.coordinates.some(poly =>
            pointInRing(pt, poly[0]) && !poly.slice(1).some(hole => pointInRing(pt, hole)));
    }
    return false;
}

function translateGeoPreserving(geom: GeoJSON.Geometry, dLng: number, dLat: number, origCentLng: number, origCentLat: number): GeoJSON.Geometry {
    const newCentLat = origCentLat + dLat;
    const cosOrig = Math.cos(origCentLat * Math.PI / 180);
    const cosNew = Math.cos(newCentLat * Math.PI / 180);
    const lngScale = cosNew > 1e-6 ? cosOrig / cosNew : 1;
    const newCentLng = origCentLng + dLng;
    const t = (c: number[]): number[] => [
        newCentLng + (c[0] - origCentLng) * lngScale,
        c[1] + dLat,
    ];
    const mapRing = (ring: number[][]) => ring.map(t);
    const mapPoly = (poly: number[][][]) => poly.map(mapRing);
    if (geom.type === 'Polygon') return { type: 'Polygon', coordinates: geom.coordinates.map(mapRing) };
    if (geom.type === 'MultiPolygon') return { type: 'MultiPolygon', coordinates: geom.coordinates.map(mapPoly) };
    return geom;
}

@customElement('webmapx-truesize-tool')
export class WebmapxTrueSizeTool extends WebmapxBaseTool {
    @state() private availableLayers: { id: string; label: string; sourceId: string }[] = [];
    @state() private selectedLayerId = '';
    @state() private copies: TrueSizeCopy[] = [];
    @state() private dragging = false;

    public active = false;

    private features: GeoJSON.Feature[] = [];
    private colorIdx = 0;

    private unsubEvents: (() => void)[] = [];

    private dragState: {
        feature: GeoJSON.Feature;
        centroid: LngLat;
        startCoords: LngLat;
        color: string;
        label: string;
        existingCopyId?: string;
    } | null = null;

    activate(): void {
        this.active = true;
        this.style.display = 'block';
        this.bindEvents();
    }

    deactivate(): void {
        this.active = false;
        this.style.display = 'none';
        this.cleanupEvents();
        if (this.adapter) this.adapter.setPanEnabled(true);
        this.dragState = null;
        this.dragging = false;
        this.clearGhost();
        if (this.copies.length === 0) this.cleanupLayers();
    }

    static styles = css`
        :host { display: none; padding: 0.75rem; font-size: 0.875rem; min-width: 200px; }
        label { display: block; font-weight: 600; margin-bottom: 0.25rem; }
        select { width: 100%; margin-bottom: 0.75rem; padding: 0.25rem; box-sizing: border-box; }
        .hint { color: var(--sl-color-neutral-500, #888); font-style: italic; margin-bottom: 0.5rem; font-size: 0.8rem; }
        .copy-list { margin-bottom: 0.5rem; max-height: 130px; overflow-y: auto; }
        .copy-item { display: flex; align-items: center; gap: 0.4rem; margin-bottom: 0.25rem; }
        .copy-swatch { width: 14px; height: 14px; border-radius: 3px; flex-shrink: 0; }
        .copy-label { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .copy-remove { cursor: pointer; color: var(--sl-color-danger-600, #c00); border: none; background: none; padding: 0 2px; font-size: 0.9rem; }
        .clear-btn { width: 100%; padding: 0.3rem; cursor: pointer; }
        .no-copies { color: var(--sl-color-neutral-500, #888); font-style: italic; font-size: 0.8rem; margin-bottom: 0.5rem; }
        .dragging-hint { color: var(--sl-color-primary-600, #3b82f6); font-size: 0.8rem; margin-bottom: 0.4rem; }
    `;

    protected onMapAttached(adapter: IMap): void {
        this.refreshLayers(adapter.store.getState());
        if (this.active) this.bindEvents();
    }

    protected onMapDetached(): void {
        this.cleanupEvents();
        this.cleanupLayers();
        this.dragState = null;
        this.dragging = false;
        this.features = [];
        this.copies = [];
        this.availableLayers = [];
    }

    protected onStateChanged(state: IMapState): void {
        this.refreshLayers(state);
    }

    private refreshLayers(state: IMapState): void {
        const layers = state.mapLayers ?? {};
        const result: { id: string; label: string; sourceId: string }[] = [];
        const checkedSources = new Set<string>();
        for (const [id, entry] of Object.entries(layers)) {
            if (id.startsWith('truesize-') || id.startsWith(GHOST_SOURCE)) continue;
            const sublayers = Array.isArray(entry.sublayers) ? entry.sublayers as any[] : null;
            const localSourceKey = typeof entry.sourceId === 'string'
                ? entry.sourceId
                : sublayers?.find((s: any) => typeof s?.source === 'string')?.source ?? null;
            if (!localSourceKey) continue;
            // Composite style layers register sources as "{layerId}:{sourceKey}"; try both
            const resolvedSourceId = this.adapter?.getSourceData(`${id}:${localSourceKey}`) !== null
                ? `${id}:${localSourceKey}`
                : localSourceKey;
            if (checkedSources.has(resolvedSourceId)) continue;
            checkedSources.add(resolvedSourceId);
            if (!this.adapter) continue;
            const data = this.adapter.getSourceData(resolvedSourceId);
            if (!data || typeof data === 'string') continue;
            if (!this.hasPolygonFeatures(data)) continue;
            const label = entry.label ?? id;
            result.push({ id, label: String(label), sourceId: resolvedSourceId });
        }
        this.availableLayers = result;
        if (this.selectedLayerId && !result.find(r => r.id === this.selectedLayerId)) {
            this.selectedLayerId = result[0]?.id ?? '';
        }
        if (!this.selectedLayerId && result.length > 0) {
            this.selectedLayerId = result[0].id;
        }
    }

    private hasPolygonFeatures(fc: GeoJSON.FeatureCollection): boolean {
        return fc.features.some(f =>
            f.geometry?.type === 'Polygon' || f.geometry?.type === 'MultiPolygon');
    }

    private async setupLayers(): Promise<void> {
        if (!this.adapter) return;
        if (!this.adapter.hasLayer(TRUESIZE_FILL)) {
            await this.adapter.addSource(TRUESIZE_SOURCE, {
                type: 'geojson',
                data: { type: 'FeatureCollection', features: [] },
            });
            await this.adapter.addLayer({
                id: TRUESIZE_FILL,
                type: 'fill',
                source: TRUESIZE_SOURCE,
                paint: {
                    'fill-color': ['get', 'color'],
                    'fill-opacity': 0.35,
                },
                metadata: { label: 'TrueSize copies', legendRole: 'overlay' },
            });
            await this.adapter.addLayer({
                id: TRUESIZE_LINE,
                type: 'line',
                source: TRUESIZE_SOURCE,
                paint: {
                    'line-color': ['get', 'color'],
                    'line-width': 2,
                },
                metadata: { hideFromLegend: true },
            });
        }
        if (!this.adapter.hasLayer(GHOST_FILL)) {
            await this.adapter.addSource(GHOST_SOURCE, {
                type: 'geojson',
                data: { type: 'FeatureCollection', features: [] },
            });
            await this.adapter.addLayer({
                id: GHOST_FILL,
                type: 'fill',
                source: GHOST_SOURCE,
                paint: {
                    'fill-color': ['get', 'color'],
                    'fill-opacity': 0.2,
                },
                metadata: { hideFromLegend: true },
            });
            await this.adapter.addLayer({
                id: GHOST_LINE,
                type: 'line',
                source: GHOST_SOURCE,
                paint: {
                    'line-color': ['get', 'color'],
                    'line-width': 2,
                    'line-dasharray': [4, 3],
                },
                metadata: { hideFromLegend: true },
            });
        }
    }

    private cleanupLayers(): void {
        if (!this.adapter) return;
        [GHOST_FILL, GHOST_LINE, TRUESIZE_FILL, TRUESIZE_LINE].forEach(id => {
            if (this.adapter!.hasLayer(id)) this.adapter!.removeLayer(id);
        });
        [GHOST_SOURCE, TRUESIZE_SOURCE].forEach(id => this.adapter!.removeSource(id));
    }

    private bindEvents(): void {
        if (!this.adapter) return;
        this.cleanupEvents();
        const u1 = this.adapter.events.on('pointer-down', e => this.onPointerDown(e));
        const u2 = this.adapter.events.on('pointer-move', e => this.onDrag(e));
        const u3 = this.adapter.events.on('pointer-up', e => this.onDragEnd(e));
        this.unsubEvents = [u1, u2, u3];
    }

    private cleanupEvents(): void {
        this.unsubEvents.forEach(u => u());
        this.unsubEvents = [];
    }

    private getSelectedSource(): { sourceId: string; label: string } | null {
        const entry = this.availableLayers.find(l => l.id === this.selectedLayerId);
        return entry ? { sourceId: entry.sourceId, label: entry.label } : null;
    }

    private async onPointerDown(e: { coords: LngLat }): Promise<void> {
        if (!this.adapter) return;
        await this.setupLayers();
        const pt = e.coords;

        // Check existing copies first
        const hitCopy = this.features.find(f => f.geometry && hitTestFeature(pt, f.geometry));
        if (hitCopy) {
            const copyId = hitCopy.properties?.copyId as string;
            const copyMeta = this.copies.find(c => c.id === copyId);
            const color = hitCopy.properties?.color as string ?? COLORS[0];
            const label = copyMeta?.label ?? copyId;
            // Remove from persistent layer while dragging
            this.features = this.features.filter(f => f.properties?.copyId !== copyId);
            this.updateTrueSizeSource();
            const centroid = geoCentroid(hitCopy.geometry!);
            this.dragState = { feature: hitCopy, centroid, startCoords: pt, color, label, existingCopyId: copyId };
            this.dragging = true;
            this.adapter.setPanEnabled(false);
            this.updateGhost(pt);
            return;
        }

        // Otherwise pick from source layer
        const sel = this.getSelectedSource();
        if (!sel) return;
        const fc = this.adapter.getSourceData(sel.sourceId);
        if (!fc || typeof fc === 'string') return;
        const hit = fc.features.find(f => f.geometry && hitTestFeature(pt, f.geometry));
        if (!hit) return;
        const centroid = geoCentroid(hit.geometry!);
        const color = COLORS[this.colorIdx % COLORS.length];
        const label = String(hit.properties?.name ?? hit.properties?.label ?? hit.properties?.id ?? `Copy ${this.copies.length + 1}`);
        this.dragState = { feature: hit, centroid, startCoords: pt, color, label };
        this.dragging = true;
        this.adapter.setPanEnabled(false);
        this.updateGhost(pt);
    }

    private onDrag(e: { coords: LngLat }): void {
        if (!this.dragState) return;
        this.updateGhost(e.coords);
    }

    private updateGhost(coords: LngLat): void {
        if (!this.dragState || !this.adapter) return;
        const { feature, centroid, startCoords, color } = this.dragState;
        const dLng = coords[0] - startCoords[0];
        const dLat = coords[1] - startCoords[1];
        const moved = translateGeoPreserving(feature.geometry!, dLng, dLat, centroid[0], centroid[1]);
        const ghostFc: GeoJSON.FeatureCollection = {
            type: 'FeatureCollection',
            features: [{ type: 'Feature', geometry: moved, properties: { color } }],
        };
        const src = this.adapter.getSource(GHOST_SOURCE);
        src?.setData(ghostFc);
    }

    private onDragEnd(e: { coords: LngLat }): void {
        if (!this.adapter) {
            this.dragState = null;
            this.dragging = false;
            return;
        }
        this.adapter.setPanEnabled(true);
        if (!this.dragState) return;
        const { feature, centroid, startCoords, color, label } = this.dragState;
        const dLng = e.coords[0] - startCoords[0];
        const dLat = e.coords[1] - startCoords[1];
        const { existingCopyId } = this.dragState;
        if (Math.abs(dLng) < 1e-6 && Math.abs(dLat) < 1e-6) {
            // Restore copy if it was lifted
            if (existingCopyId) {
                this.features = [...this.features, feature];
                this.updateTrueSizeSource();
            }
            this.dragState = null;
            this.dragging = false;
            this.clearGhost();
            return;
        }
        const moved = translateGeoPreserving(feature.geometry!, dLng, dLat, centroid[0], centroid[1]);
        const copyId = existingCopyId ?? `copy-${Date.now()}`;
        this.features = [...this.features, {
            type: 'Feature',
            geometry: moved,
            properties: { color, copyId },
        }];
        const fc: GeoJSON.FeatureCollection = { type: 'FeatureCollection', features: this.features };
        const src = this.adapter.getSource(TRUESIZE_SOURCE);
        src?.setData(fc);
        if (!existingCopyId) {
            this.copies = [...this.copies, { id: copyId, label, color }];
            this.colorIdx++;
        }
        this.dragState = null;
        this.dragging = false;
        this.clearGhost();
    }

    private clearGhost(): void {
        if (!this.adapter) return;
        const src = this.adapter.getSource(GHOST_SOURCE);
        src?.setData({ type: 'FeatureCollection', features: [] });
    }

    private removeCopy(copyId: string): void {
        this.copies = this.copies.filter(c => c.id !== copyId);
        this.features = this.features.filter(f => f.properties?.copyId !== copyId);
        this.updateTrueSizeSource();
    }

    private clearAll(): void {
        this.copies = [];
        this.features = [];
        this.updateTrueSizeSource();
    }

    private updateTrueSizeSource(): void {
        if (!this.adapter) return;
        const src = this.adapter.getSource(TRUESIZE_SOURCE);
        src?.setData({ type: 'FeatureCollection', features: this.features });
    }

    render(): TemplateResult {
        return html`
            <label>Source layer</label>
            ${this.availableLayers.length === 0
                ? html`<div class="hint">No polygon layers visible on map.</div>`
                : html`
                    <select @change=${(e: Event) => { this.selectedLayerId = (e.target as HTMLSelectElement).value; }}>
                        ${this.availableLayers.map(l => html`
                            <option value=${l.id} ?selected=${l.id === this.selectedLayerId}>${l.label}</option>
                        `)}
                    </select>
                    ${this.dragging
                        ? html`<div class="dragging-hint">Drag to target location, release to place.</div>`
                        : html`<div class="hint">Click and drag a polygon to compare sizes.</div>`
                    }
                `
            }

            <div class="copy-list">
                ${this.copies.length === 0
                    ? html`<div class="no-copies">No copies placed yet.</div>`
                    : this.copies.map(c => html`
                        <div class="copy-item">
                            <div class="copy-swatch" style="background:${c.color}"></div>
                            <span class="copy-label" title=${c.label}>${c.label}</span>
                            <button class="copy-remove" @click=${() => this.removeCopy(c.id)} title="Remove">✕</button>
                        </div>
                    `)
                }
            </div>

            ${this.copies.length > 0
                ? html`<button class="clear-btn" @click=${() => this.clearAll()}>Clear all</button>`
                : ''
            }
        `;
    }
}
