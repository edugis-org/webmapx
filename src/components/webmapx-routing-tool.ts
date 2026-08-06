import { html, css, TemplateResult, nothing } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { WebmapxModalTool } from './webmapx-modal-tool';
import type { IMap } from '../map/IMapInterfaces';
import type { LngLat, ClickEvent } from '../store/map-events';
import type { IMapState } from '../store/IMapState';
import { substituteApiKeys } from '../config/apikeys';
import { DATA_ROUTE } from '../theme/data-colors';

const ROUTE_SOURCE_ID = 'webmapx-routing-source';
const ROUTE_LAYER_ID  = 'webmapx-routing-route';

type Phase = 'set-start' | 'set-end' | 'ready';

interface RouteResult {
    coordinates: number[][];
    distanceM: number;
    durationS: number;
}

type ModeCategory = 'car' | 'truck' | 'motorcycle' | 'bicycle' | 'foot' | 'bus' | 'wheelchair';

interface ServiceMode {
    value: string;
    label: string;
    category: ModeCategory;
    isTruck?: boolean;
}

// ─── Service definitions ──────────────────────────────────────────────────────

interface RoutingServiceDef {
    id: string;
    label: string;
    modes: ServiceMode[];
    keyPlaceholder: string | null;
    keyAttr: string | null;
    calculate(start: LngLat, end: LngLat, mode: string, key: string | null, truck: TruckParams): Promise<RouteResult>;
}

interface TruckParams {
    weight: number;
    axleWeight: number;
    length: number;
    width: number;
    height: number;
}

interface OsrmMode extends ServiceMode {
    server: string;
    profile: string;
}

const OSRM_MODES: OsrmMode[] = [
    { value: 'driving', label: 'Car',     category: 'car',     server: 'routed-car',  profile: 'driving' },
    { value: 'cycling', label: 'Bicycle', category: 'bicycle', server: 'routed-bike', profile: 'cycling' },
    { value: 'foot',    label: 'Foot',    category: 'foot',    server: 'routed-foot', profile: 'foot' },
];

const ORS_MODES: ServiceMode[] = [
    { value: 'driving-car',     label: 'Car',         category: 'car' },
    { value: 'driving-hgv',     label: 'Truck',       category: 'truck',       isTruck: true },
    { value: 'cycling-regular', label: 'Bicycle',     category: 'bicycle' },
    { value: 'foot-walking',    label: 'Foot',        category: 'foot' },
    { value: 'wheelchair',      label: 'Wheelchair',  category: 'wheelchair' },
];

// Decode Valhalla's polyline6 encoding (precision 1e6, [lat,lng] pairs → [lng,lat])
function decodePolyline6(encoded: string): number[][] {
    const coords: number[][] = [];
    let index = 0, lat = 0, lng = 0;
    while (index < encoded.length) {
        let b: number, shift = 0, result = 0;
        do { b = encoded.charCodeAt(index++) - 63; result |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
        lat += (result & 1) ? ~(result >> 1) : (result >> 1);
        shift = 0; result = 0;
        do { b = encoded.charCodeAt(index++) - 63; result |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
        lng += (result & 1) ? ~(result >> 1) : (result >> 1);
        coords.push([lng / 1e6, lat / 1e6]);
    }
    return coords;
}

const VALHALLA_MODES: ServiceMode[] = [
    { value: 'auto',       label: 'Car',         category: 'car' },
    { value: 'truck',      label: 'Truck',       category: 'truck',      isTruck: true },
    { value: 'motorcycle', label: 'Motorcycle',  category: 'motorcycle' },
    { value: 'bicycle',    label: 'Bicycle',     category: 'bicycle' },
    { value: 'pedestrian', label: 'Pedestrian',  category: 'foot' },
    { value: 'bus',        label: 'Bus',         category: 'bus' },
];

const TOMTOM_MODES: ServiceMode[] = [
    { value: 'car',        label: 'Car',         category: 'car' },
    { value: 'truck',      label: 'Truck',       category: 'truck',      isTruck: true },
    { value: 'bicycle',    label: 'Bicycle',     category: 'bicycle' },
    { value: 'pedestrian', label: 'Pedestrian',  category: 'foot' },
];

const ROUTING_SERVICES: RoutingServiceDef[] = [
    {
        id: 'osrm',
        label: 'OSRM (free)',
        modes: OSRM_MODES,
        keyPlaceholder: null,
        keyAttr: null,
        async calculate(start, end, mode) {
            const [sLng, sLat] = start;
            const [eLng, eLat] = end;
            const m = OSRM_MODES.find(x => x.value === mode) ?? OSRM_MODES[0];
            const url = `https://routing.openstreetmap.de/${m.server}/route/v1/${m.profile}/${sLng},${sLat};${eLng},${eLat}?overview=full&geometries=geojson`;
            const resp = await fetch(url);
            if (!resp.ok) throw new Error(`OSRM ${resp.status}`);
            const data = await resp.json();
            if (data.code !== 'Ok') throw new Error(data.message ?? 'No route');
            const route = data.routes[0];
            return {
                coordinates: route.geometry.coordinates,
                distanceM: route.distance,
                durationS: route.duration,
            };
        },
    },
    {
        id: 'openrouteservice',
        label: 'OpenRouteService',
        modes: ORS_MODES,
        keyPlaceholder: '{key-openrouteservice}',
        keyAttr: 'ors-api-key',
        async calculate(start, end, mode, key, truck) {
            if (!key) throw new Error('No OpenRouteService API key configured.');
            const url = `https://api.openrouteservice.org/v2/directions/${mode}/geojson`;
            const body = {
                coordinates: [[start[0], start[1]], [end[0], end[1]]],
                ...(mode === 'driving-hgv' ? {
                    options: {
                        vehicle_type: 'hgv',
                        profile_params: {
                            restrictions: {
                                weight: truck.weight / 1000,
                                axleload: truck.axleWeight / 1000,
                                length: truck.length,
                                width: truck.width,
                                height: truck.height,
                            },
                        },
                    },
                } : {}),
            };
            const resp = await fetch(url, {
                method: 'POST',
                headers: { 'Authorization': key, 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });
            if (!resp.ok) {
                const err = await resp.json().catch(() => ({}));
                throw new Error((err as any)?.error?.message ?? `ORS ${resp.status}`);
            }
            const data = await resp.json();
            const feature = data.features?.[0];
            if (!feature) throw new Error('No route');
            return {
                coordinates: feature.geometry.coordinates,
                distanceM: feature.properties.summary.distance,
                durationS: feature.properties.summary.duration,
            };
        },
    },
    {
        id: 'tomtom',
        label: 'TomTom',
        modes: TOMTOM_MODES,
        keyPlaceholder: '{key-tomtom}',
        keyAttr: 'tomtom-api-key',
        async calculate(start, end, mode, key, truck) {
            if (!key) throw new Error('No TomTom API key configured.');
            const [sLng, sLat] = start;
            const [eLng, eLat] = end;
            let url = `https://api.tomtom.com/routing/1/calculateRoute/${sLat},${sLng}:${eLat},${eLng}/json?travelMode=${mode}&key=${key}`;
            if (mode === 'truck') {
                url += `&vehicleWeight=${truck.weight}&axleWeight=${truck.axleWeight}`;
                url += `&vehicleLength=${truck.length}&vehicleWidth=${truck.width}&vehicleHeight=${truck.height}`;
            }
            const resp = await fetch(url);
            if (!resp.ok) throw new Error(`TomTom ${resp.status}`);
            const data = await resp.json();
            const route = data?.routes?.[0];
            if (!route) throw new Error('No route found');
            const coords: number[][] = [];
            for (const leg of route.legs ?? []) {
                for (const pt of leg.points ?? []) coords.push([pt.longitude, pt.latitude]);
            }
            return {
                coordinates: coords,
                distanceM: route.summary.lengthInMeters,
                durationS: route.summary.travelTimeInSeconds,
            };
        },
    },
    {
        id: 'valhalla',
        label: 'Valhalla (free)',
        modes: VALHALLA_MODES,
        keyPlaceholder: null,
        keyAttr: null,
        async calculate(start, end, mode, _key, truck) {
            const body: Record<string, unknown> = {
                locations: [
                    { lon: start[0], lat: start[1] },
                    { lon: end[0],   lat: end[1] },
                ],
                costing: mode,
                directions_options: { units: 'km' },
            };
            if (mode === 'truck') {
                body.costing_options = {
                    truck: {
                        weight: truck.weight / 1000,
                        axle_load: truck.axleWeight / 1000,
                        length: truck.length,
                        width: truck.width,
                        height: truck.height,
                    },
                };
            }
            const resp = await fetch('https://valhalla1.openstreetmap.de/route', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });
            if (!resp.ok) {
                const err = await resp.json().catch(() => ({}));
                throw new Error((err as any)?.error ?? `Valhalla ${resp.status}`);
            }
            const data = await resp.json();
            const trip = data.trip;
            if (!trip) throw new Error('No route');
            const coords = trip.legs.flatMap((leg: any) => decodePolyline6(leg.shape));
            return {
                coordinates: coords,
                distanceM: trip.summary.length * 1000,
                durationS: trip.summary.time,
            };
        },
    },
    {
        id: 'graphhopper',
        label: 'GraphHopper',
        modes: [
            { value: 'car',        label: 'Car',        category: 'car' as ModeCategory },
            { value: 'truck',      label: 'Truck',      category: 'truck' as ModeCategory,      isTruck: true },
            { value: 'motorcycle', label: 'Motorcycle', category: 'motorcycle' as ModeCategory },
            { value: 'bike',       label: 'Bicycle',    category: 'bicycle' as ModeCategory },
            { value: 'foot',       label: 'Foot',       category: 'foot' as ModeCategory },
        ],
        keyPlaceholder: '{key-graphhopper}',
        keyAttr: 'graphhopper-api-key',
        async calculate(start, end, mode, key, _truck) {
            if (!key) throw new Error('No GraphHopper API key configured.');
            const url = `https://graphhopper.com/api/1/route?point=${start[1]},${start[0]}&point=${end[1]},${end[0]}&profile=${mode}&key=${key}&points_encoded=false`;
            const resp = await fetch(url);
            if (!resp.ok) {
                const err = await resp.json().catch(() => ({}));
                throw new Error((err as any)?.message ?? `GraphHopper ${resp.status}`);
            }
            const data = await resp.json();
            const path = data.paths?.[0];
            if (!path) throw new Error('No route');
            return {
                coordinates: path.points.coordinates,
                distanceM: path.distance,
                durationS: path.time / 1000,
            };
        },
    },
];

const SERVICE_MAP = new Map(ROUTING_SERVICES.map(s => [s.id, s]));

// ─── Component ────────────────────────────────────────────────────────────────

@customElement('webmapx-routing-tool')
export class WebmapxRoutingTool extends WebmapxModalTool {
    readonly toolId = 'routing';

    @state() private phase: Phase = 'set-start';
    @state() private start: LngLat | null = null;
    @state() private end:   LngLat | null = null;
    @state() private serviceId = 'osrm';
    @state() private travelMode = 'driving';
    @state() private distanceM: number | null = null;
    @state() private durationS: number | null = null;
    @state() private loading = false;
    @state() private error: string | null = null;
    @state() private truckWeight     = 49000;
    @state() private truckAxleWeight = 11500;
    @state() private truckLength     = 10.2;
    @state() private truckWidth      = 2.5;
    @state() private truckHeight     = 3.7;

    private routeCoords: number[][] = [];
    private unsubClick: (() => void) | null = null;
    private layersCreated = false;

    static styles = css`
        :host { display: block; padding: var(--webmapx-tool-padding, 0); font-size: 0.875rem; }
        label { display: block; font-weight: 600; margin-bottom: 0.25rem; }
        .hint { color: var(--color-text-secondary, #5a6773); font-size: 0.8rem; margin-bottom: 0.75rem; line-height: 1.4; }
        .row { display: flex; gap: 0.5rem; align-items: center; margin-bottom: 0.5rem; }
        select { flex: 1; padding: 0.3rem 0.5rem; border: 1px solid var(--color-border, #d5dce3); border-radius: 4px; font-size: 0.875rem; background: var(--color-background, #fff); color: var(--color-text-primary, #16202a); }
        button { padding: 0.35rem 0.75rem; border: 1px solid var(--color-border, #d5dce3); border-radius: 4px; background: var(--color-background, #fff); cursor: pointer; font-size: 0.875rem; color: var(--color-text-primary, #16202a); }
        button:disabled { opacity: 0.5; cursor: default; }
        .result { margin-top: 0.5rem; padding: 0.5rem; background: var(--color-surface-raised, #f4f6f8); border-radius: 4px; }
        .result strong { display: block; }
        .error { color: var(--sl-color-danger-600, #c00); font-size: 0.8rem; margin-top: 0.25rem; }
        .waypoint { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.25rem; font-size: 0.8rem; color: var(--color-text-secondary, #5a6773); }
        .dot { width: 12px; height: 12px; border-radius: 50%; display: inline-block; flex-shrink: 0; }
        .dot.start { background: var(--webmapx-data-start, #22c55e); }
        .dot.end   { background: var(--webmapx-data-end, #e63946); }
        details { margin-bottom: 0.5rem; }
        summary { cursor: pointer; font-weight: 600; font-size: 0.8rem; margin-bottom: 0.25rem; user-select: none; }
        .truck-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.35rem 0.5rem; font-size: 0.8rem; }
        .truck-grid label { font-weight: normal; margin: 0; }
        .truck-grid input { width: 100%; padding: 0.2rem 0.35rem; border: 1px solid var(--color-border, #d5dce3); border-radius: 4px; font-size: 0.8rem; background: var(--color-background, #fff); color: var(--color-text-primary, #16202a); }
        .spinner { display: inline-block; width: 14px; height: 14px; border: 2px solid var(--color-border, #d5dce3); border-top-color: var(--color-primary, #2b6c8f); border-radius: 50%; animation: spin 0.6s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
    `;

    // ─── Config helpers ───────────────────────────────────────────────────────

    private getToolAttr(name: string): string | undefined {
        const toolId = this.getAttribute('tool-id');
        const groups = this.toolsConfig ? Object.values(this.toolsConfig) : [];
        for (const group of groups) {
            const items = Array.isArray((group as any)?.items) ? (group as any).items : [];
            for (const item of items) {
                if (item?.id === toolId && typeof item[name] === 'string') return item[name] as string;
            }
        }
        return undefined;
    }

    /** Returns the configured routingService value, or null if absent / 'all'. */
    private get configuredService(): string | null {
        const v = this.getToolAttr('routingService');
        if (!v || v === 'all') return null;
        return SERVICE_MAP.has(v) ? v : null;
    }

    private get showServiceDropdown(): boolean {
        return this.configuredService === null;
    }

    private serviceHasKey(svc: RoutingServiceDef): boolean {
        if (!svc.keyPlaceholder) return true; // no key needed
        return this.getApiKey(svc) !== null;
    }

    private get availableServices(): RoutingServiceDef[] {
        return ROUTING_SERVICES.filter(s => this.serviceHasKey(s));
    }

    private get activeService(): RoutingServiceDef {
        const id = this.configuredService ?? this.serviceId;
        const svc = SERVICE_MAP.get(id);
        if (svc && this.serviceHasKey(svc)) return svc;
        return this.availableServices[0] ?? ROUTING_SERVICES[0];
    }

    private getApiKey(service: RoutingServiceDef): string | null {
        if (!service.keyPlaceholder) return null;
        if (service.keyAttr) {
            const fromAttr = this.getToolAttr(service.keyAttr);
            if (fromAttr) return fromAttr;
        }
        const substituted = substituteApiKeys(service.keyPlaceholder);
        return substituted.startsWith('{') ? null : substituted;
    }

    private get currentMode(): ServiceMode | undefined {
        return this.activeService.modes.find(m => m.value === this.travelMode);
    }

    private get showTruckOptions(): boolean {
        return this.currentMode?.isTruck === true;
    }

    private get truckParams(): TruckParams {
        return {
            weight: this.truckWeight,
            axleWeight: this.truckAxleWeight,
            length: this.truckLength,
            width: this.truckWidth,
            height: this.truckHeight,
        };
    }

    // ─── Lifecycle ────────────────────────────────────────────────────────────

    protected onMapAttached(adapter: IMap): void {
        super.onMapAttached(adapter);
        this.unsubClick = adapter.events.on('click', (e: ClickEvent) => this.handleMapClick(e));
        // Apply configured service on first attach
        const cfg = this.configuredService;
        if (cfg) this.applyServiceId(cfg);
    }

    protected onMapDetached(): void {
        this.unsubClick?.();
        this.unsubClick = null;
        this.adapter?.setCursor('');
        this.removeLayers();
        this.adapter?.removeMarker('webmapx-routing-start');
        this.adapter?.removeMarker('webmapx-routing-end');
        super.onMapDetached();
    }

    private _escHandler: ((e: KeyboardEvent) => void) | null = null;

    protected onActivate(): void {
        this.createLayers();
        this.adapter?.setCursor('crosshair');
        this._escHandler = (e: KeyboardEvent) => { if (e.key === 'Escape') this.deactivate(); };
        document.addEventListener('keydown', this._escHandler);
    }

    protected onDeactivate(): void {
        document.removeEventListener('keydown', this._escHandler!);
        this._escHandler = null;
        this.adapter?.setCursor('');
        this.clearRoute();
        this.removeLayers();
    }

    protected onStateChanged(_state: IMapState): void {}

    // ─── Layer management ─────────────────────────────────────────────────────

    private createLayers(): void {
        if (this.layersCreated) return;
        this.dispatchEvent(new CustomEvent('webmapx-add-source', {
            detail: { id: ROUTE_SOURCE_ID, config: { type: 'geojson', data: { type: 'FeatureCollection', features: [] } } },
            bubbles: true, composed: true,
        }));
        this.dispatchEvent(new CustomEvent('webmapx-add-layer', {
            detail: {
                id: ROUTE_LAYER_ID, type: 'line', source: ROUTE_SOURCE_ID,
                paint: { 'line-color': DATA_ROUTE, 'line-width': 5, 'line-opacity': 0.85 },
                layout: { 'line-cap': 'round', 'line-join': 'round' },
                metadata: { isToolLayer: true, hideFromLegend: true },
            },
            bubbles: true, composed: true,
        }));
        this.layersCreated = true;
    }

    private removeLayers(): void {
        if (!this.layersCreated) return;
        this.dispatchEvent(new CustomEvent('webmapx-remove-layer', { detail: ROUTE_LAYER_ID, bubbles: true, composed: true }));
        this.dispatchEvent(new CustomEvent('webmapx-remove-source', { detail: ROUTE_SOURCE_ID, bubbles: true, composed: true }));
        this.layersCreated = false;
    }

    private setRouteData(coordinates: number[][]): void {
        this.routeCoords = coordinates;
        const fc: GeoJSON.FeatureCollection = {
            type: 'FeatureCollection',
            features: coordinates.length > 0 ? [{
                type: 'Feature',
                geometry: { type: 'LineString', coordinates },
                properties: {},
            }] : [],
        };
        this.adapter?.getSource(ROUTE_SOURCE_ID)?.setData(fc);
    }

    private persistToMap(): void {
        if (!this.routeCoords.length || !this.start || !this.end) return;
        const id = `webmapx-route-${Date.now()}`;
        const svc = this.activeService;
        const modeLabel = svc.modes.find(m => m.value === this.travelMode)?.label ?? this.travelMode;
        const label = `Route ${modeLabel}${this.distanceM !== null ? ' · ' + this.formatDistance(this.distanceM) : ''}${this.durationS !== null ? ' / ' + this.formatDuration(this.durationS) : ''}`;
        const created = new Date().toISOString();
        const abstract = [
            `<b>Service:</b> ${svc.label}`,
            `<b>Mode:</b> ${modeLabel}`,
            `<b>From:</b> ${this.start[1].toFixed(6)}, ${this.start[0].toFixed(6)}`,
            `<b>To:</b> ${this.end[1].toFixed(6)}, ${this.end[0].toFixed(6)}`,
            ...(this.distanceM !== null ? [`<b>Distance:</b> ${this.formatDistance(this.distanceM)}`] : []),
            ...(this.durationS !== null ? [`<b>Duration:</b> ${this.formatDuration(this.durationS)}`] : []),
            ...(this.showTruckOptions ? [
                `<b>Truck weight:</b> ${this.truckWeight} kg`,
                `<b>Truck axle weight:</b> ${this.truckAxleWeight} kg`,
                `<b>Truck dimensions:</b> ${this.truckLength} × ${this.truckWidth} × ${this.truckHeight} m (L×W×H)`,
            ] : []),
            `<b>Created:</b> ${created}`,
        ].join('<br>');

        const routeFc: GeoJSON.FeatureCollection = {
            type: 'FeatureCollection',
            features: [{ type: 'Feature', geometry: { type: 'LineString', coordinates: this.routeCoords }, properties: {} }],
        };
        const waypointFc: GeoJSON.FeatureCollection = {
            type: 'FeatureCollection',
            features: [
                { type: 'Feature', geometry: { type: 'Point', coordinates: this.start }, properties: { name: 'start' } },
                { type: 'Feature', geometry: { type: 'Point', coordinates: this.end },   properties: { name: 'end' } },
            ],
        };
        const waypointColor = ['match', ['get', 'name'], 'start', '#22c55e', 'end', '#e63946', 'rgba(0,0,0,0)'];

        this.dispatchEvent(new CustomEvent('webmapx-add-layer', {
            detail: {
                id,
                type: 'style',
                version: 8,
                beforeLayerId: ROUTE_LAYER_ID,
                metadata: { label, abstract, legendRole: 'overlay' },
                sources: {
                    route:     { type: 'geojson', data: routeFc },
                    waypoints: { type: 'geojson', data: waypointFc },
                },
                layers: [
                    {
                        id: `${id}-line`, type: 'line', source: 'route',
                        paint: { 'line-color': DATA_ROUTE, 'line-width': 5, 'line-opacity': 0.85 },
                        layout: { 'line-cap': 'round', 'line-join': 'round' },
                        metadata: { label: 'Route' },
                    },
                    {
                        id: `${id}-circle`, type: 'circle', source: 'waypoints',
                        paint: { 'circle-color': waypointColor, 'circle-radius': 8, 'circle-stroke-color': '#fff', 'circle-stroke-width': 2 },
                        metadata: { label: 'Waypoints' },
                    },
                ],
            },
            bubbles: true, composed: true,
        }));
    }

    // ─── Map interaction ──────────────────────────────────────────────────────

    private handleMapClick(e: ClickEvent): void {
        if (!this.active) return;
        const coords = e.coords;
        if (this.phase === 'set-start') {
            this.start = coords;
            this.adapter?.addMarker('webmapx-routing-start', coords, {
                color: '#22c55e', draggable: true,
                onDrag:    (ll) => { this.start = ll; },
                onDragEnd: (ll) => { this.start = ll; if (this.end) void this.calculateRoute(); },
            });
            this.phase = 'set-end';
        } else {
            this.end = coords;
            this.adapter?.addMarker('webmapx-routing-end', coords, {
                color: '#e63946', draggable: true,
                onDrag:    (ll) => { this.end = ll; },
                onDragEnd: (ll) => { this.end = ll; if (this.start) void this.calculateRoute(); },
            });
            this.phase = 'ready';
            void this.calculateRoute();
        }
    }

    // ─── Service / mode switching ─────────────────────────────────────────────

    private applyServiceId(id: string): void {
        const svc = SERVICE_MAP.get(id);
        if (!svc) return;
        const currentCategory = this.activeService.modes.find(m => m.value === this.travelMode)?.category;
        this.serviceId = id;
        const sameCategory = currentCategory ? svc.modes.find(m => m.category === currentCategory) : undefined;
        this.travelMode = sameCategory?.value ?? svc.modes[0].value;
    }

    private onServiceChange(e: Event): void {
        this.applyServiceId((e.target as HTMLSelectElement).value);
        this.distanceM = null;
        this.durationS = null;
        this.error = null;
        if (this.start && this.end) void this.calculateRoute();
    }

    private onModeChange(e: Event): void {
        this.travelMode = (e.target as HTMLSelectElement).value;
        if (this.start && this.end) void this.calculateRoute();
    }

    // ─── Route calculation ────────────────────────────────────────────────────

    private async calculateRoute(): Promise<void> {
        if (!this.start || !this.end) return;
        const svc = this.activeService;
        const key = this.getApiKey(svc);

        this.loading = true;
        this.error = null;

        try {
            const result = await svc.calculate(this.start, this.end, this.travelMode, key, this.truckParams);
            this.setRouteData(result.coordinates);
            this.distanceM = result.distanceM;
            this.durationS = result.durationS;
        } catch (err) {
            this.error = err instanceof Error ? err.message : 'Route calculation failed';
            this.setRouteData([]);
        } finally {
            this.loading = false;
        }
    }

    private clearRoute(): void {
        this.start = null;
        this.end = null;
        this.phase = 'set-start';
        this.distanceM = null;
        this.durationS = null;
        this.error = null;
        this.adapter?.removeMarker('webmapx-routing-start');
        this.adapter?.removeMarker('webmapx-routing-end');
        this.setRouteData([]);
    }

    private resetToSetStart(): void {
        this.phase = 'set-start';
        this.start = null;
        this.adapter?.removeMarker('webmapx-routing-start');
        this.setRouteData([]);
        this.distanceM = null;
        this.durationS = null;
        this.error = null;
    }

    private swapWaypoints(): void {
        [this.start, this.end] = [this.end, this.start];
        if (this.start) {
            this.adapter?.addMarker('webmapx-routing-start', this.start, {
                color: '#22c55e', draggable: true,
                onDrag:    (ll) => { this.start = ll; },
                onDragEnd: (ll) => { this.start = ll; if (this.end) void this.calculateRoute(); },
            });
        } else {
            this.adapter?.removeMarker('webmapx-routing-start');
        }
        if (this.end) {
            this.adapter?.addMarker('webmapx-routing-end', this.end, {
                color: '#e63946', draggable: true,
                onDrag:    (ll) => { this.end = ll; },
                onDragEnd: (ll) => { this.end = ll; if (this.start) void this.calculateRoute(); },
            });
        } else {
            this.adapter?.removeMarker('webmapx-routing-end');
        }
        if (this.start && this.end) void this.calculateRoute();
    }

    // ─── Formatting ───────────────────────────────────────────────────────────

    private formatDistance(m: number): string {
        return m >= 1000 ? `${(m / 1000).toFixed(1)} km` : `${Math.round(m)} m`;
    }

    private formatDuration(s: number): string {
        const h = Math.floor(s / 3600);
        const min = Math.floor((s % 3600) / 60);
        return h > 0 ? `${h}h ${min}min` : `${min} min`;
    }

    // ─── Render ───────────────────────────────────────────────────────────────

    render(): TemplateResult {
        const svc = this.activeService;
        const hintText =
            this.phase === 'set-start' ? 'Click the map to set the start point.' :
            this.phase === 'set-end'   ? 'Click the map to set the end point.' :
                                         'Click the map to update the end point.';

        return html`
            <label>Route</label>
            <p class="hint">${hintText}</p>

            ${this.start ? html`
                <div class="waypoint">
                    <span class="dot start"></span>
                    ${this.start[1].toFixed(5)}, ${this.start[0].toFixed(5)}
                    <button @click=${() => this.resetToSetStart()} style="margin-left:auto;padding:0.1rem 0.4rem;font-size:0.75rem;" aria-label="Clear route">✕</button>
                </div>` : nothing}
            ${this.end ? html`
                <div class="waypoint">
                    <span class="dot end"></span>
                    ${this.end[1].toFixed(5)}, ${this.end[0].toFixed(5)}
                </div>` : nothing}

            ${this.showServiceDropdown ? html`
                <div class="row" style="margin-top:0.5rem;">
                    <select aria-label="Routing service" @change=${(e: Event) => this.onServiceChange(e)}>
                        ${this.availableServices.map(s => html`<option value=${s.id} ?selected=${s.id === this.serviceId}>${s.label}</option>`)}
                    </select>
                </div>
            ` : nothing}

            <div class="row" style="${this.showServiceDropdown ? '' : 'margin-top:0.5rem;'}">
                <select aria-label="Travel mode" @change=${(e: Event) => this.onModeChange(e)}>
                    ${svc.modes.map(m => html`<option value=${m.value} ?selected=${m.value === this.travelMode}>${m.label}</option>`)}
                </select>
                ${this.start && this.end ? html`
                    <button @click=${() => this.swapWaypoints()} title="Swap start and end">⇅</button>
                ` : nothing}
                <button @click=${() => this.clearRoute()}>Clear</button>
            </div>

            ${this.showTruckOptions ? html`
                <details open>
                    <summary>Truck parameters</summary>
                    <div class="truck-grid">
                        <label>Weight (kg)
                            <input type="number" min="500" max="50000" .value=${String(this.truckWeight)}
                                @change=${(e: Event) => { this.truckWeight = +(e.target as HTMLInputElement).value; if (this.start && this.end) void this.calculateRoute(); }}>
                        </label>
                        <label>Axle weight (kg)
                            <input type="number" min="500" max="12000" .value=${String(this.truckAxleWeight)}
                                @change=${(e: Event) => { this.truckAxleWeight = +(e.target as HTMLInputElement).value; if (this.start && this.end) void this.calculateRoute(); }}>
                        </label>
                        <label>Length (m)
                            <input type="number" min="4" max="24" step="0.1" .value=${String(this.truckLength)}
                                @change=${(e: Event) => { this.truckLength = +(e.target as HTMLInputElement).value; if (this.start && this.end) void this.calculateRoute(); }}>
                        </label>
                        <label>Width (m)
                            <input type="number" min="1" max="2.6" step="0.1" .value=${String(this.truckWidth)}
                                @change=${(e: Event) => { this.truckWidth = +(e.target as HTMLInputElement).value; if (this.start && this.end) void this.calculateRoute(); }}>
                        </label>
                        <label>Height (m)
                            <input type="number" min="1" max="10" step="0.1" .value=${String(this.truckHeight)}
                                @change=${(e: Event) => { this.truckHeight = +(e.target as HTMLInputElement).value; if (this.start && this.end) void this.calculateRoute(); }}>
                        </label>
                    </div>
                </details>
            ` : nothing}

            ${this.loading ? html`<div class="row"><span class="spinner"></span> Calculating route…</div>` : nothing}
            ${this.error ? html`<div class="error">⚠ ${this.error}</div>` : nothing}

            ${this.distanceM !== null && !this.loading ? html`
                <div class="result">
                    <strong>${this.formatDistance(this.distanceM)}</strong>
                    ${this.durationS !== null ? html`<span>${this.formatDuration(this.durationS)}</span>` : nothing}
                </div>
                <div class="row" style="margin-top:0.5rem;">
                    <button class="primary" @click=${() => this.persistToMap()} style="flex:1">Persist to map</button>
                </div>
            ` : nothing}
        `;
    }
}
