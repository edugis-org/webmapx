import { html, css, TemplateResult } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { WebmapxModalTool } from './webmapx-modal-tool';
import type { IMapState } from '../store/IMapState';
import type { IMap } from '../map/IMapInterfaces';
import bearing from '@turf/bearing';
import distance from '@turf/distance';
import destination from '@turf/destination';

type LngLat = [number, number];

interface TrueAreaCopy {
    id: string;
    label: string;
    color: string;
}

const COLORS = ['#e63946', '#2a9d8f', '#e9c46a', '#457b9d', '#f4a261', '#6a4c93', '#06d6a0', '#ff6b6b'];

const TRUEAREA_LAYER = 'truearea';
const TRUEAREA_SOURCE = `${TRUEAREA_LAYER}:data`;
const GHOST_LAYER = 'truearea-ghost';
const GHOST_SOURCE = `${GHOST_LAYER}:data`;

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

function hitSubPolygonCentroid(pt: LngLat, geom: GeoJSON.Geometry): LngLat {
    if (geom.type === 'Polygon') return geoCentroid(geom);
    if (geom.type === 'MultiPolygon') {
        const hit = geom.coordinates.find(poly =>
            pointInRing(pt, poly[0]) && !poly.slice(1).some(hole => pointInRing(pt, hole)));
        if (hit) {
            const pts = hit[0];
            const s = pts.reduce((a, c) => [a[0] + c[0], a[1] + c[1]], [0, 0]);
            return [s[0] / pts.length, s[1] / pts.length];
        }
    }
    return geoCentroid(geom);
}

function rotateGeometry(geom: GeoJSON.Geometry, angleDeg: number, pivot: LngLat): GeoJSON.Geometry {
    const center: GeoJSON.Feature<GeoJSON.Point> = { type: 'Feature', geometry: { type: 'Point', coordinates: pivot }, properties: {} };
    const rotatePt = (c: number[]): number[] => {
        const pt: GeoJSON.Feature<GeoJSON.Point> = { type: 'Feature', geometry: { type: 'Point', coordinates: c }, properties: {} };
        const b = bearing(center, pt);
        const d = distance(center, pt, { units: 'kilometers' });
        return destination(center, d, b + angleDeg, { units: 'kilometers' }).geometry.coordinates;
    };
    const mapRing = (ring: number[][]) => ring.map(rotatePt);
    const mapPoly = (poly: number[][][]) => poly.map(mapRing);
    if (geom.type === 'Polygon') return { type: 'Polygon', coordinates: geom.coordinates.map(mapRing) };
    if (geom.type === 'MultiPolygon') return { type: 'MultiPolygon', coordinates: geom.coordinates.map(mapPoly) };
    return geom;
}

function translateGeoMercator(geom: GeoJSON.Geometry, dLng: number, dLat: number, origCentLng: number): GeoJSON.Geometry {
    const newCentLng = origCentLng + dLng;
    const DEG = Math.PI / 180;
    const t = (c: number[]): number[] => {
        const cosOrig = Math.cos(c[1] * DEG);
        const newLat = c[1] + dLat;
        const cosNew = Math.cos(newLat * DEG);
        const lngScale = cosNew > 1e-6 ? cosOrig / cosNew : 1;
        return [newCentLng + (c[0] - origCentLng) * lngScale, newLat];
    };
    const mapRing = (ring: number[][]) => ring.map(t);
    const mapPoly = (poly: number[][][]) => poly.map(mapRing);
    if (geom.type === 'Polygon') return { type: 'Polygon', coordinates: geom.coordinates.map(mapRing) };
    if (geom.type === 'MultiPolygon') return { type: 'MultiPolygon', coordinates: geom.coordinates.map(mapPoly) };
    return geom;
}

type BearingDistance = { bearing: number; distance: number };

function computeBearingDistances(geom: GeoJSON.Geometry, centroid: LngLat): BearingDistance[][] {
    const center: GeoJSON.Feature<GeoJSON.Point> = { type: 'Feature', geometry: { type: 'Point', coordinates: centroid }, properties: {} };
    const processRing = (ring: number[][]): BearingDistance[] =>
        ring.map(c => ({
            bearing: bearing(center, { type: 'Feature', geometry: { type: 'Point', coordinates: c }, properties: {} }),
            distance: distance(center, { type: 'Feature', geometry: { type: 'Point', coordinates: c }, properties: {} }, { units: 'kilometers' }),
        }));
    if (geom.type === 'Polygon') return geom.coordinates.map(processRing);
    if (geom.type === 'MultiPolygon') return geom.coordinates.flat().map(processRing);
    return [];
}

function placeGeometry(geom: GeoJSON.Geometry, newCentroid: LngLat, bds: BearingDistance[][]): GeoJSON.Geometry {
    const center: GeoJSON.Feature<GeoJSON.Point> = { type: 'Feature', geometry: { type: 'Point', coordinates: newCentroid }, properties: {} };
    let ringIdx = 0;
    const placeRing = (): number[][] => {
        const ring = bds[ringIdx++] ?? [];
        return ring.map(({ bearing: b, distance: d }) =>
            destination(center, d, b, { units: 'kilometers' }).geometry.coordinates
        );
    };
    if (geom.type === 'Polygon') {
        return { type: 'Polygon', coordinates: geom.coordinates.map(() => placeRing()) };
    }
    if (geom.type === 'MultiPolygon') {
        return {
            type: 'MultiPolygon',
            coordinates: geom.coordinates.map(poly => poly.map(() => placeRing())),
        };
    }
    return geom;
}

@customElement('webmapx-truearea-tool')
export class WebmapxTrueAreaTool extends WebmapxModalTool {
    readonly toolId = 'truearea';
    @state() private availableLayers: { id: string; label: string; sourceId: string }[] = [];
    @state() private selectedLayerId = '';
    @state() private copies: TrueAreaCopy[] = [];
    @state() private dragging = false;
    @state() private lastTouchedCopyId: string | null = null;
    @state() private rotationDeg = 0;
    @state() private geodesic = true;

    private copyMeta: Map<string, {
        origGeom: GeoJSON.Geometry;
        origCentroid: LngLat;
        placedCentroid: LngLat;
        bearingDistances: BearingDistance[][];
        geodesic: boolean;
    }> = new Map();

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
        bearingDistances: BearingDistance[][];
    } | null = null;

    protected onActivate(): void {
        if (this.adapter) this.adapter.setTouchCaptureEnabled(false);
        this.bindEvents();
    }

    protected onDeactivate(): void {
        this.cleanupEvents();
        if (this.adapter) {
            this.adapter.setPanEnabled(true);
            this.adapter.setTouchCaptureEnabled(true);
        }
        this.dragState = null;
        this.dragging = false;
        this.clearGhost();
        if (this.copies.length === 0) this.cleanupLayers();
    }

    static styles = css`
        :host { display: none; padding: var(--webmapx-tool-padding, 0); font-size: 0.875rem; min-width: 200px; }
        :host([active]) { display: block; }
        label { display: block; font-weight: 600; margin-bottom: 0.25rem; }
        select { width: 100%; margin-bottom: 0.75rem; padding: 0.25rem; box-sizing: border-box; }
        .hint { color: var(--sl-color-neutral-500, #888); font-style: italic; margin-bottom: 0.5rem; font-size: 0.8rem; }
        .copy-item { display: flex; align-items: center; gap: 0.4rem; margin-bottom: 0.5rem; }
        .copy-swatch { width: 14px; height: 14px; border-radius: 3px; flex-shrink: 0; }
        .copy-label { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .copy-remove { cursor: pointer; color: var(--sl-color-danger-600, #c00); border: none; background: none; padding: 0 2px; font-size: 0.9rem; }
        .clear-btn { width: 100%; padding: 0.3rem; cursor: pointer; }
        .no-copies { color: var(--sl-color-neutral-500, #888); font-style: italic; font-size: 0.8rem; margin-bottom: 0.5rem; margin-top: 0.25rem; }
        .dragging-hint { color: var(--sl-color-primary-600, #3b82f6); font-size: 0.8rem; margin-bottom: 0.4rem; }
        .method-row { display: flex; align-items: center; gap: 0.4rem; margin-bottom: 0.5rem; font-size: 0.8rem; color: var(--sl-color-neutral-600, #555); }
        .method-row input { cursor: pointer; }
        .method-row label { cursor: pointer; }
        .rotation-row { display: flex; align-items: center; gap: 0.4rem; margin-bottom: 0.5rem; }
        .rotation-row input[type=range] { flex: 1; }
        .rotation-reset { border: none; background: none; cursor: pointer; padding: 0 2px; font-size: 1rem; line-height: 1; color: var(--sl-color-neutral-600, #555); }
        .rotation-reset:hover { color: var(--sl-color-primary-600, #3b82f6); }
        .rotation-value { font-variant-numeric: tabular-nums; min-width: 3.5em; text-align: right; font-size: 0.8rem; color: var(--sl-color-neutral-600, #555); }
    `;

    protected onMapAttached(adapter: IMap): void {
        super.onMapAttached(adapter);
        this.refreshLayers(adapter.store.getState());
        if (this.active) {
            adapter.setTouchCaptureEnabled(false);
            this.bindEvents();
        }
    }

    protected onMapDetached(): void {
        this.cleanupEvents();
        this.cleanupLayers();
        this.dragState = null;
        this.dragging = false;
        this.features = [];
        this.copies = [];
        this.copyMeta.clear();
        this.availableLayers = [];
        super.onMapDetached();
    }

    protected onStateChanged(state: IMapState): void {
        this.refreshLayers(state);
    }

    private refreshLayers(state: IMapState): void {
        const layers = state.mapLayers ?? {};
        const result: { id: string; label: string; sourceId: string }[] = [];
        for (const [id, entry] of Object.entries(layers)) {
            if (id === TRUEAREA_LAYER || id.startsWith('truearea-')) continue;
            const data = (entry as any).sourceData as GeoJSON.FeatureCollection | undefined;
            if (!data) continue;
            if (!this.hasPolygonFeatures(data)) continue;
            const label = entry.label ?? id;
            result.push({ id, label: String(label), sourceId: id });
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
        if (!this.adapter.hasLayer(TRUEAREA_LAYER)) {
            await this.adapter.addLayer({
                id: TRUEAREA_LAYER,
                type: 'style',
                metadata: { label: 'TrueArea copies', legendRole: 'overlay', attribution: '<a href="https://thetruesize.com">The True Size Of</a>' },
                sources: {
                    data: { type: 'geojson', data: { type: 'FeatureCollection', features: [] } },
                },
                layers: [
                    {
                        id: 'truearea-fill',
                        type: 'fill',
                        source: 'data',
                        paint: {
                            'fill-color': ['get', 'color'],
                            'fill-opacity': 0.35,
                        },
                    },
                    {
                        id: 'truearea-line',
                        type: 'line',
                        source: 'data',
                        paint: {
                            'line-color': ['get', 'color'],
                            'line-width': 2,
                        },
                        hideFromLegend: true,
                    },
                ],
            });
        }
        if (!this.adapter.hasLayer(GHOST_LAYER)) {
            await this.adapter.addLayer({
                id: GHOST_LAYER,
                type: 'style',
                metadata: { hideFromLegend: true },
                sources: {
                    data: { type: 'geojson', data: { type: 'FeatureCollection', features: [] } },
                },
                layers: [
                    {
                        id: 'truearea-ghost-fill',
                        type: 'fill',
                        source: 'data',
                        paint: {
                            'fill-color': ['get', 'color'],
                            'fill-opacity': 0.2,
                        },
                    },
                    {
                        id: 'truearea-ghost-line',
                        type: 'line',
                        source: 'data',
                        paint: {
                            'line-color': ['get', 'color'],
                            'line-width': 2,
                            'line-dasharray': [4, 3],
                        },
                        hideFromLegend: true,
                    },
                ],
            });
        }
    }

    private cleanupLayers(): void {
        if (!this.adapter) return;
        [GHOST_LAYER, TRUEAREA_LAYER].forEach(id => {
            if (this.adapter!.hasLayer(id)) this.adapter!.removeLayer(id);
        });
    }

    private bindEvents(): void {
        if (!this.adapter) return;
        this.cleanupEvents();
        const u1 = this.adapter.events.on('pointer-down', e => this.onPointerDown(e));
        const u2 = this.adapter.events.on('pointer-move', e => this.onDrag(e));
        const u3 = this.adapter.events.on('pointer-up', e => this.onDragEnd(e));
        const u4 = this.adapter.events.on('pointer-cancel', () => this.onDragCancel());
        this.unsubEvents = [u1, u2, u3, u4];
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
            this.updateTrueAreaSource();
            const centroid = hitSubPolygonCentroid(pt, hitCopy.geometry!);
            const bearingDistances = computeBearingDistances(hitCopy.geometry!, centroid);
            this.dragState = { feature: hitCopy, centroid, startCoords: pt, color, label, existingCopyId: copyId, bearingDistances };
            this.dragging = true;
            if (copyId !== this.lastTouchedCopyId) {
                this.lastTouchedCopyId = copyId;
                this.rotationDeg = hitCopy.properties?.rotation ?? 0;
                const meta = this.copyMeta.get(copyId);
                if (meta) this.geodesic = meta.geodesic;
            }
            this.adapter.setPanEnabled(false);
            this.updateGhost(pt);
            return;
        }

        // Otherwise pick from source layer
        const sel = this.getSelectedSource();
        if (!sel) return;
        const mapLayers = this.adapter.store.getState().mapLayers ?? {};
        const fc = (mapLayers[sel.sourceId] as any)?.sourceData as GeoJSON.FeatureCollection | undefined;
        if (!fc) return;
        const hit = fc.features.find(f => f.geometry && hitTestFeature(pt, f.geometry));
        if (!hit) return;
        const centroid = hitSubPolygonCentroid(pt, hit.geometry!);
        const bearingDistances = computeBearingDistances(hit.geometry!, centroid);
        const color = COLORS[this.colorIdx % COLORS.length];
        const label = String(hit.properties?.name ?? hit.properties?.label ?? hit.properties?.id ?? `Copy ${this.copies.length + 1}`);
        this.dragState = { feature: hit, centroid, startCoords: pt, color, label, bearingDistances };
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
        const { centroid, startCoords, color, bearingDistances, feature } = this.dragState;
        const dLng = coords[0] - startCoords[0];
        const dLat = coords[1] - startCoords[1];
        const newCentroid: LngLat = [centroid[0] + dLng, centroid[1] + dLat];
        const moved = this.geodesic
            ? placeGeometry(feature.geometry!, newCentroid, bearingDistances)
            : translateGeoMercator(feature.geometry!, dLng, dLat, centroid[0]);
        const ghostFc: GeoJSON.FeatureCollection = {
            type: 'FeatureCollection',
            features: [{ type: 'Feature', geometry: moved, properties: { color } }],
        };
        const src = this.adapter.getSource(GHOST_SOURCE);
        src?.setData(ghostFc);
    }

    private onDragCancel(): void {
        if (!this.adapter) return;
        this.adapter.setPanEnabled(true);
        if (this.dragState?.existingCopyId) {
            this.features = [...this.features, this.dragState.feature];
            this.updateTrueAreaSource();
        }
        this.dragState = null;
        this.dragging = false;
        this.clearGhost();
    }

    private onDragEnd(e: { coords: LngLat }): void {
        if (!this.adapter) {
            this.dragState = null;
            this.dragging = false;
            return;
        }
        this.adapter.setPanEnabled(true);
        if (!this.dragState) return;
        const { feature, centroid, startCoords, color, label, bearingDistances } = this.dragState;
        const dLng = e.coords[0] - startCoords[0];
        const dLat = e.coords[1] - startCoords[1];
        const { existingCopyId } = this.dragState;
        if (Math.abs(dLng) < 1e-6 && Math.abs(dLat) < 1e-6) {
            // Restore copy if it was lifted
            if (existingCopyId) {
                this.features = [...this.features, feature];
                this.updateTrueAreaSource();
            }
            this.dragState = null;
            this.dragging = false;
            this.clearGhost();
            return;
        }
        const newCentroid: LngLat = [centroid[0] + dLng, centroid[1] + dLat];
        const moved = this.geodesic
            ? placeGeometry(feature.geometry!, newCentroid, bearingDistances)
            : translateGeoMercator(feature.geometry!, dLng, dLat, centroid[0]);
        const copyId = existingCopyId ?? `copy-${Date.now()}`;
        const rotation = existingCopyId ? (this.lastTouchedCopyId === existingCopyId ? this.rotationDeg : (feature.properties?.rotation ?? 0)) : 0;

        if (existingCopyId) {
            const prev = this.copyMeta.get(existingCopyId);
            if (prev) {
                // Track original centroid's position by applying drag delta to previous placedCentroid,
                // not to the placed geometry's centroid — keeps recalc consistent across methods.
                const updatedPlaced: LngLat = [prev.placedCentroid[0] + dLng, prev.placedCentroid[1] + dLat];
                this.copyMeta.set(existingCopyId, { ...prev, placedCentroid: updatedPlaced, geodesic: this.geodesic });
            }
        } else {
            this.copyMeta.set(copyId, { origGeom: feature.geometry!, origCentroid: centroid, placedCentroid: newCentroid, bearingDistances, geodesic: this.geodesic });
        }

        const rotatedMoved = rotation !== 0 ? rotateGeometry(moved, rotation, geoCentroid(moved)) : moved;
        this.features = [...this.features, {
            type: 'Feature',
            geometry: rotatedMoved,
            properties: { ...feature.properties, color, copyId, rotation },
        }];
        const fc: GeoJSON.FeatureCollection = { type: 'FeatureCollection', features: this.features };
        const src = this.adapter.getSource(TRUEAREA_SOURCE);
        src?.setData(fc);
        if (!existingCopyId) {
            this.copies = [...this.copies, { id: copyId, label, color }];
            this.colorIdx++;
            this.lastTouchedCopyId = copyId;
            this.rotationDeg = 0;
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

    private recomputeLastCopy(): void {
        if (!this.lastTouchedCopyId) return;
        const meta = this.copyMeta.get(this.lastTouchedCopyId);
        if (!meta) return;
        const { origGeom, origCentroid, placedCentroid, bearingDistances } = meta;
        this.copyMeta.set(this.lastTouchedCopyId, { ...meta, geodesic: this.geodesic });
        const dLng = placedCentroid[0] - origCentroid[0];
        const dLat = placedCentroid[1] - origCentroid[1];
        const translated = this.geodesic
            ? placeGeometry(origGeom, placedCentroid, bearingDistances)
            : translateGeoMercator(origGeom, dLng, dLat, origCentroid[0]);
        const rotation = this.rotationDeg;
        const finalGeom = rotation !== 0 ? rotateGeometry(translated, rotation, placedCentroid) : translated;
        const copyId = this.lastTouchedCopyId;
        this.features = this.features.map(f =>
            f.properties?.copyId === copyId
                ? { ...f, geometry: finalGeom, properties: { ...f.properties, rotation } }
                : f
        );
        this.updateTrueAreaSource();
    }

    private removeCopy(copyId: string): void {
        this.copies = this.copies.filter(c => c.id !== copyId);
        this.features = this.features.filter(f => f.properties?.copyId !== copyId);
        this.copyMeta.delete(copyId);
        if (this.lastTouchedCopyId === copyId) {
            this.lastTouchedCopyId = this.copies[this.copies.length - 1]?.id ?? null;
            if (this.lastTouchedCopyId) {
                this.rotationDeg = this.features.find(f => f.properties?.copyId === this.lastTouchedCopyId)?.properties?.rotation ?? 0;
                const prevMeta = this.copyMeta.get(this.lastTouchedCopyId);
                if (prevMeta) this.geodesic = prevMeta.geodesic;
            } else {
                this.rotationDeg = 0;
            }
        }
        this.updateTrueAreaSource();
    }

    private rotateLastCopy(angleDeg: number): void {
        if (!this.lastTouchedCopyId) return;
        const feature = this.features.find(f => f.properties?.copyId === this.lastTouchedCopyId);
        if (!feature?.geometry) return;
        const prevAngle: number = feature.properties?.rotation ?? 0;
        const delta = angleDeg - prevAngle;
        const meta = this.copyMeta.get(this.lastTouchedCopyId!);
        const pivot: LngLat = meta ? meta.placedCentroid : geoCentroid(feature.geometry);
        const rotated = rotateGeometry(feature.geometry, delta, pivot);
        this.features = this.features.map(f =>
            f.properties?.copyId === this.lastTouchedCopyId
                ? { ...f, geometry: rotated, properties: { ...f.properties, rotation: angleDeg } }
                : f
        );
        this.rotationDeg = angleDeg;
        this.updateTrueAreaSource();
    }

    private clearAll(): void {
        this.copies = [];
        this.features = [];
        this.copyMeta.clear();
        this.lastTouchedCopyId = null;
        this.rotationDeg = 0;
        this.updateTrueAreaSource();
    }

    private updateTrueAreaSource(): void {
        if (!this.adapter) return;
        const src = this.adapter.getSource(TRUEAREA_SOURCE);
        src?.setData({ type: 'FeatureCollection', features: this.features });
    }

    render(): TemplateResult {
        return html`
            <label>Source layer</label>
            ${this.availableLayers.length === 0
                ? html`<div class="hint">No visible polygon layers on map.</div>`
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

            ${(() => {
                const active = this.copies.find(c => c.id === this.lastTouchedCopyId);
                if (!active && this.availableLayers.length === 0) return '';
                if (!active) return html`<div class="no-copies">No copy selected. Click a polygon on the map.</div>`;
                return html`
                    <div class="copy-item">
                        <div class="copy-swatch" style="background:${active.color}"></div>
                        <span class="copy-label" title=${active.label}>${active.label}</span>
                        <button class="copy-remove" @click=${() => this.removeCopy(active.id)} title="Remove">✕</button>
                    </div>
                    <div class="rotation-row">
                        <input type="range" min="-180" max="180" step="1"
                            .value=${String(this.rotationDeg)}
                            @input=${(e: Event) => this.rotateLastCopy(Number((e.target as HTMLInputElement).value))}
                        />
                        <button class="rotation-reset" title="Reset to 0°" @click=${() => this.rotateLastCopy(0)}>↺</button>
                        <span class="rotation-value">${this.rotationDeg}°</span>
                    </div>
                    <div class="method-row">
                        <input type="checkbox" id="geodesic-toggle" .checked=${this.geodesic}
                            @change=${(e: Event) => { this.geodesic = (e.target as HTMLInputElement).checked; this.recomputeLastCopy(); }}
                        />
                        <label for="geodesic-toggle">Geodesic (shape-accurate, may rotate borders)</label>
                    </div>

                    ${this.copies.length > 0
                        ? html`<button class="clear-btn" @click=${() => this.clearAll()}>Clear all</button>`
                        : ''
                    }
                `;
            })()}
        `;
    }
}
