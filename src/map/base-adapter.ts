// src/map/base-adapter.ts
//
// Abstract base for all engine adapters. Centralises generic bookkeeping so
// engine-specific code stays engine-only.
//
// Contract for engine implementors:
//   - Implement engineAddLayer  / engineRemoveLayer for the actual engine work.
//   - Do NOT call registerMapLayer / unregisterMapLayer inside engine services —
//     that is handled here, after the engine confirms success.
//   - removeSource that cascades to layer removal must call engineRemoveLayer (or
//     directly unregisterMapLayer) for each implicitly removed layer. This is a
//     known remaining exception because only the engine knows the source→layer
//     mapping at removal time.

import { MapStateStore } from '../store/map-state-store';
import { registerMapLayer, unregisterMapLayer, reorderMapLayers } from './map-layer-registry';
import type {
    IMapCore, ISource, LayerInsertOptions, MarkerOptions,
    NavigationCapabilities, QueryLayerFeaturesOptions,
} from './IMapInterfaces';
import type { CompositeStyleLayerConfig, MapStyle } from '../config/types';
import type { LngLat, Pixel } from '../store/map-events';
import type { MapProjectionState, MapTimeState } from '../store/IMapState';
import { MapEventBus } from '../store/map-events';
import type { DeferredLogicalLayerExecutor } from './logical-layer-executor';
import { ensureApiKeysLoaded, substituteApiKeysDeep } from '../config/apikeys';
import {
    applyMapState,
    collectComputedSources,
    collectRefreshableSources,
    followsMapClock,
    isInternalFuncUrl,
    resolveInternalFuncUrl,
    resolveInternalSources,
    usesPlaceholder,
    MAP_STATE_PLACEHOLDERS,
} from '../utils/internal-sources';
import { onComputedDataReady } from '../utils/computed-source-ready';
import { isLive, isSameClock, timeOf } from '../utils/map-clock';
import { InternalSourceRefresher } from './internal-source-refresh';
import { normalizeCompositeLayer, findNormalizedSource } from './composite-layer-utils';

/** Marks a sublayer added by a tool rather than by the layer's author. */
export const EXTRA_SUBLAYER_SUFFIX = '--extra';

/** Options accepted by every adapter's `initialize` (mirrors IMap.initialize). */
export interface MapInitOptions {
    center?: [number, number];
    zoom?: number;
    minZoom?: number;
    maxZoom?: number;
    minPitch?: number;
    maxPitch?: number;
    /** Restricts panning/zoom-out to [west, south, east, north] (lon/lat). */
    maxBounds?: [number, number, number, number];
    styleUrl?: string;
    style?: MapStyle;
    /** CSS colour painted behind everything the map draws. */
    backgroundColor?: string;
    /**
     * The projection to draw in, resolved by `resolveInitOptions` from permalink,
     * session or config. Engines differ in what they can honour: OpenLayers draws
     * in any projection from `view-projections.ts`, MapLibre in mercator/globe/
     * vertical-perspective, Leaflet only in Web Mercator, and Cesium is a globe.
     * An engine that cannot honour it says so once and draws its default.
     */
    projection?: string;
}

interface MarkerService {
    add(id: string, lngLat: LngLat, options?: MarkerOptions): void;
    move(id: string, lngLat: LngLat): void;
    remove(id: string): void;
}

export abstract class BaseAdapter {
    public readonly store: MapStateStore;
    public readonly events: MapEventBus;

    /**
     * When true, composite (`type: 'style'`) layers are decomposed here in generic
     * code: sources registered individually, each sublayer passed to engineAddLayer
     * tagged with `metadata.logicalLayerId`. The engine sees only simple single layers.
     * Override in engine adapters that support this model (MapLibre first).
     */
    // Overridden in MapLibreAdapter (and future engines) to enable generic composite decomposition.
    protected readonly _decomposeComposite: boolean = false;
    private sourceAttributions = new Map<string, string>();
    private sourceConfigs = new Map<string, Record<string, unknown>>();
    private layerConfigStore = new Map<string, { config: unknown; options?: LayerInsertOptions }>();
    /**
     * Keeps computed sources current while their layer is on the map. Created
     * on first use and asked to stop in `removeLayer`, so a refresher can never
     * outlive the layer that wanted it.
     */
    private refresher: InternalSourceRefresher | null = null;
    /**
     * Every computed source on this map, by source id.
     *
     * A configuration usually declares its sources next to its layers rather
     * than inside them, so by the time a layer arrives it names a source it does
     * not carry — this is where that name is turned back into the url behind it.
     *
     * Holds *all* of them, not only the `?refresh=auto` ones: a source that
     * never refreshes itself still has to be recomputed when the map's clock
     * moves to another moment.
     */
    private computedSources = new Map<string, string>();
    /** What the clock said last time, so an unrelated store update costs nothing. */
    private lastSeenMapTime: MapTimeState | undefined;
    /** Likewise for the last click, which some computed sources follow. */
    private lastSeenClick: [number, number] | null | undefined;
    private lastSeenDeepTimeMa: number | null | undefined;

    /**
     * The moment this map's computed layers are drawn for.
     *
     * Read from the store on every use rather than cached: a time slider moves
     * it, and a cached clock would keep serving the moment a layer happened to
     * be added at.
     */
    protected clockNow(): Date {
        return timeOf(this.store.getState().mapTime);
    }

    /**
     * Reacts to the map's clock being moved.
     *
     * Two things follow from a clock change, and they are separate: pinned time
     * silences the refresh loop entirely (`?refresh=auto` is a wall-clock idea,
     * and a frozen map has no wall clock), and every computed source is redrawn
     * once for the new moment — including the ones that never refresh on their
     * own, which is the whole reason a slider can move a `sun-path` layer.
     *
     * Any store update runs this, so unchanged clocks are filtered out here
     * rather than at every dispatch site — and "unchanged" has to include two
     * live clocks. Treating live as always-changed redrew every computed source
     * on every dispatch, which MapLibre absorbs because its `setData` is cheap
     * and silent, but which locks Cesium up completely: rebuilding a
     * `GeoJsonDataSource` touches the store, that dispatch lands back here, and
     * the two feed each other until the tab stops responding. A change of mode
     * in either direction still counts as a change, so going live still
     * restarts the refresh loop and redraws.
     */
    private onMapTimeChanged(next: MapTimeState | undefined): void {
        const previous = this.lastSeenMapTime;
        if (previous !== undefined && isSameClock(previous, next)) return;
        this.lastSeenMapTime = next;
        this.refresher?.setLive(isLive(next));
        // Both directions redraw. Going live is not "the loop will handle it":
        // the loop only touches `?refresh=auto` sources, so a sun-path layer
        // would otherwise sit at the moment the slider was let go of while the
        // map claims to be showing now.
        this.redrawComputedSources();
    }

    /**
     * Keeps a computed source out of the busy spinner, for as long as it exists.
     *
     * Nothing is fetched for one of these: the data is worked out locally in a
     * millisecond, so the "loading" the engine reports is not a wait anyone is
     * having. Reporting it anyway turns the spinner on with every redraw — and
     * since the engine only turns it off when the map goes idle, a source
     * redrawn every frame (an animation) or several times a second (a live
     * day/night layer) leaves the spinner on and apparently stuck.
     *
     * The refresher silenced the sources it drives for exactly this reason;
     * this widens it to every computed source, because a time slider redraws
     * the ones that never refresh themselves too.
     */
    private silenceComputedSource(sourceId: string): void {
        try {
            this.suppressBusySignalForSource(sourceId);
        } catch {
            // No core yet (a layer added before the engine is up). The redraw
            // path asserts it again, so nothing is lost.
        }
    }

    /**
     * Redraws the computed sources that follow the map's own state.
     *
     * Only those: a click is not a clock, and a source that does not mention
     * `{click}` has no reason to be recomputed because someone tapped the map.
     */
    private onClickedCoordinateChanged(click: [number, number] | null): void {
        const previous = this.lastSeenClick;
        if (previous?.[0] === click?.[0] && previous?.[1] === click?.[1]) return;
        this.lastSeenClick = click;
        this.redrawSourcesUsing(MAP_STATE_PLACEHOLDERS.click);
    }

    /**
     * Redraws the computed sources that follow the map's geological clock.
     *
     * Its own subscription rather than a branch of the one above, because the
     * two clocks are unrelated: a plate-tectonics slider must not redraw the
     * day/night layer, and a click must not move the continents.
     */
    private onDeepTimeChanged(ma: number | null): void {
        if (this.lastSeenDeepTimeMa === ma) return;
        this.lastSeenDeepTimeMa = ma;
        this.redrawSourcesUsing(MAP_STATE_PLACEHOLDERS.ma);
    }

    /**
     * Redraws every computed source whose url names one particular piece of map
     * state.
     *
     * Only those: a source that does not mention the placeholder has no reason
     * to be recomputed because the value behind it moved.
     */
    private redrawSourcesUsing(token: string): void {
        const now = this.clockNow();
        for (const [sourceId, url] of this.computedSources) {
            if (!usesPlaceholder(url, token)) continue;
            const source = this.getSource(sourceId);
            if (!source?.setData) continue;
            this.silenceComputedSource(sourceId);
            source.setData(resolveInternalFuncUrl(this.withMapState(url), now));
        }
    }

    /** Draws every computed source again for the moment the map now stands at. */
    private redrawComputedSources(): void {
        const now = this.clockNow();
        for (const [sourceId, url] of this.computedSources) {
            // A url naming its own moment is not ours to move.
            if (!followsMapClock(url)) continue;
            const source = this.getSource(sourceId);
            if (!source?.setData) continue;
            // Asserted again here rather than trusted: the refresher hands the
            // spinner back for the sources it was driving when its layer goes,
            // which would otherwise un-silence a source this still redraws.
            this.silenceComputedSource(sourceId);
            source.setData(resolveInternalFuncUrl(this.withMapState(url), now));
        }
    }

    /**
     * Resolves a newly added layer's computed sources once more, now that the
     * engine actually has them.
     *
     * Most computed sources are worked out in a millisecond, but not all: one
     * that stands in front of a few megabytes of data has to answer the first
     * call with an empty collection and fetch in the background. It then asks
     * for a redraw when the data lands — and if that happens *during* the add,
     * the redraw looks for a source the engine has not created yet, finds
     * nothing, and there is no second chance. The layer stays empty until
     * something else moves, which is why switching it off and on again appeared
     * to fix it.
     *
     * Re-resolving here removes the race rather than narrowing it: by this point
     * the source exists, so whatever the generator can answer now is drawn, no
     * matter which of the two finished first. A generator that was ready all
     * along simply produces the same data twice, which costs a millisecond.
     */
    private settleComputedSources(entries: Array<{ sourceId: string; url: string }>): void {
        if (entries.length === 0) return;
        const now = this.clockNow();
        for (const entry of entries) {
            const source = this.getSource(entry.sourceId);
            if (!source?.setData) continue;
            this.silenceComputedSource(entry.sourceId);
            source.setData(resolveInternalFuncUrl(this.withMapState(entry.url), now));
        }
    }

    /** A computed url with its map-state placeholders filled in. */
    private withMapState(url: string): string {
        const state = this.store.getState();
        return applyMapState(url, { click: state.lastClickedCoordinates, ma: state.deepTimeMa });
    }

    constructor() {
        this.store = new MapStateStore();
        this.events = new MapEventBus();
        this.events.on('view-change-end', (e) => {
            this.store.dispatch({ mapBearing: e.bearing, mapPitch: e.pitch }, 'MAP');
        });
        // Seed store.mapProjection once the map is up. Before `mapLoaded` the engine has
        // not applied the configured projection yet, so reading earlier gives a stale
        // default; at this point getProjection() is definitive (object, or null when the
        // engine has no runtime projection support).
        const unsubscribe = this.store.subscribe((state) => {
            if (!state.mapLoaded || state.mapProjection !== undefined) return;
            unsubscribe();
            this.store.dispatch({ mapProjection: this.getProjection() }, 'MAP');
        });
        this.store.subscribe((state) => this.onMapTimeChanged(state.mapTime));
        this.store.subscribe((state) => this.onClickedCoordinateChanged(state.lastClickedCoordinates));
        this.store.subscribe((state) => this.onDeepTimeChanged(state.deepTimeMa));
        // A computed source can stand in front of data that has to be fetched.
        // Its first resolve necessarily draws nothing, so the map asks again
        // once the data has arrived — otherwise a layer that came from a
        // configuration, with no tool driving it, would stay empty until
        // something else happened to move.
        onComputedDataReady(() => this.redrawComputedSources());
    }

    /** Records the `attribution` from a source config (style-spec field) for later lookup. */
    private trackSourceAttribution(id: string, config: any): void {
        if (config && typeof config.attribution === 'string' && config.attribution.length > 0) {
            this.sourceAttributions.set(id, config.attribution);
        } else {
            this.sourceAttributions.delete(id);
        }
    }

    getSourceAttribution(id: string): string | undefined {
        return this.sourceAttributions.get(id);
    }

    getSourceConfig(sourceId: string): Record<string, unknown> | null {
        return this.sourceConfigs.get(sourceId) ?? null;
    }

    /**
     * Unsupported by default: an engine that cannot repoint a live source must
     * say so, so the UI can hide the option instead of appearing to apply it.
     * Engines that can override `engineSetSourceTiles`; the tracked config is
     * updated here only when the engine reports the change applied.
     */
    setSourceTiles(sourceId: string, tiles: string[]): boolean {
        if (!this.engineSetSourceTiles(sourceId, tiles)) return false;
        const config = this.sourceConfigs.get(sourceId);
        if (config) {
            this.sourceConfigs.set(sourceId, { ...config, tiles, ...(config.url ? { url: tiles } : {}) });
        }
        return true;
    }

    protected engineSetSourceTiles(_sourceId: string, _tiles: string[]): boolean {
        return false;
    }

    /** Engines that can repoint a source can also say where it currently points. */
    getSourceTiles(_sourceId: string): string[] | null {
        return null;
    }

    addSource(id: string, config: any): void {
        // `internalFuncUrl` is left behind by whichever step resolved the data.
        const url = config?.internalFuncUrl ?? config?.data ?? config?.url;
        if (isInternalFuncUrl(url)) {
            this.computedSources.set(id, url);
            this.silenceComputedSource(id);
        }
        config = resolveInternalSources(config, this.clockNow(), (url) => this.withMapState(url));
        this.trackSourceAttribution(id, config);
        if (config && typeof config === 'object') {
            this.sourceConfigs.set(id, config as Record<string, unknown>);
        }
        this.engineAddSource(id, config);
    }

    hasLayer(layerId: string): boolean {
        return (this.store.getState().mapLayers ?? {})[layerId] !== undefined;
    }

    /** Config-authored `metadata.transparency` (0-100, matches the slider) applied once at add time. */
    private applyConfigTransparency(layerId: string, layer: any): void {
        const transparency = layer?.metadata?.transparency;
        if (typeof transparency === 'number' && transparency > 0) {
            this.setLayerOpacity(layerId, (100 - transparency) / 100);
        }
    }

    // ── Generic layer lifecycle ───────────────────────────────────────────────

    async addLayer(layer: any, options?: LayerInsertOptions): Promise<boolean> {
        await ensureApiKeysLoaded();
        layer = substituteApiKeysDeep(layer);
        // Which sources asked to keep themselves current has to be read *before*
        // the urls are replaced by the data they stand for: afterwards nothing
        // says the source was computed at all.
        const ownLayerId = layer?.id ?? layer?.metadata?.mapLayerId ?? '';
        const refreshable = collectRefreshableSources(layer, ownLayerId);
        // Every computed source the layer carries is remembered, refreshing or
        // not, so a clock change can recompute the lot.
        const computed = collectComputedSources(layer, ownLayerId);
        for (const entry of computed) {
            this.computedSources.set(entry.sourceId, entry.url);
            this.silenceComputedSource(entry.sourceId);
        }
        // A source may be computed rather than fetched (`internalfunc://`).
        // Resolved here, in generic code, so no engine ever sees the protocol.
        layer = resolveInternalSources(layer, this.clockNow(), (url) => this.withMapState(url));

        // Composite (type: 'style') with populated sources/layers — decompose generically
        // when the engine supports it (decomposeComposite = true).
        if (
            this._decomposeComposite &&
            layer?.type === 'style' &&
            Array.isArray(layer.layers) && layer.layers.length > 0 &&
            layer.sources && typeof layer.sources === 'object'
        ) {
            const composite = await this.addDecomposedComposite(layer as CompositeStyleLayerConfig, options);
            if (composite) {
                this.settleComputedSources(computed);
                this.startRefreshing(layer.id, refreshable);
            }
            return composite;
        }

        this.trackInlineSources(layer);
        const added = await this.engineAddLayer(layer, options);
        if (added) {
            this.settleComputedSources(computed);
            registerMapLayer(this.store, layer);
            const layerId = layer?.id ?? layer?.metadata?.mapLayerId;
            if (typeof layerId === 'string') {
                this.syncMapLayerOrder(layerId, options);
                this.layerConfigStore.set(layerId, { config: layer, options });
                this.applyConfigTransparency(layerId, layer);
                const activeLayers = Object.keys(this.store.getState().mapLayers ?? {});
                this.events.emit({ type: 'layer-add', layerId, activeLayers });
                this.startRefreshing(layerId, refreshable);
            }
        }
        return added;
    }

    /**
     * Records the sources a layer carries with it, so `getSourceConfig` can
     * answer for them.
     *
     * Only `addSource` used to register anything, and a layer added through
     * `addLayerRequest` arrives with its sources inline — the engine's own layer
     * service consumes them and the adapter never sees an `addSource` call. On
     * MapLibre that went unnoticed, because its override reads the live style
     * instead; on every other engine `getSourceConfig` returned null and the
     * style panel concluded a WMS was a plain tile service, since what tells
     * them apart is the source url.
     *
     * Registered under both spellings a caller may hold: the key as written, and
     * the `${layerId}:${key}` a composite's sources are registered under.
     */
    private trackInlineSources(layer: any): void {
        const sources = layer?.sources;
        if (!sources || typeof sources !== 'object') return;
        const layerId = layer?.id ?? layer?.metadata?.mapLayerId;
        for (const [key, source] of Object.entries(sources)) {
            if (!source || typeof source !== 'object') continue;
            const config = source as Record<string, unknown>;
            this.trackSourceAttribution(key, config);
            if (!this.sourceConfigs.has(key)) this.sourceConfigs.set(key, config);
            const scoped = typeof layerId === 'string' ? `${layerId}:${key}` : null;
            if (scoped && !this.sourceConfigs.has(scoped)) this.sourceConfigs.set(scoped, config);
        }
    }

    /**
     * Starts keeping a layer's computed sources current, if it asked.
     *
     * The engine registers a composite layer's sources under `layerId:key` and a
     * plain layer's under the key alone, so both spellings were collected and
     * whichever the engine actually knows is the one that gets refreshed.
     */
    private startRefreshing(layerId: string, declared: Array<{ sourceId: string; url: string }>): void {
        const candidates = [...declared, ...this.referencedComputedSources(layerId)];
        if (candidates.length === 0) return;
        const live = candidates.filter((entry) => this.getSource(entry.sourceId));
        if (live.length === 0) return;
        this.refresher ??= new InternalSourceRefresher({
            getSource: (sourceId) => this.getSource(sourceId),
            prepareUrl: (url) => this.withMapState(url),
            getZoom: () => this.getZoom(),
            getCentreLatitude: () => this.getCore().getViewportState().center[1],
            setSourceSilent: (sourceId, silent) => {
                if (silent) this.suppressBusySignalForSource(sourceId);
                else this.unsuppressBusySignalForSource(sourceId);
            },
            store: this.store,
        });
        this.refresher.watch(layerId, live);
    }

    /** The computed sources a layer draws, named rather than carried. */
    private referencedComputedSources(layerId: string): Array<{ sourceId: string; url: string }> {
        const entry = (this.store.getState().mapLayers ?? {})[layerId] as Record<string, unknown> | undefined;
        const ids = new Set<string>();
        if (typeof entry?.sourceId === 'string') ids.add(entry.sourceId);
        for (const sub of (Array.isArray(entry?.sublayers) ? entry.sublayers : []) as Array<Record<string, unknown>>) {
            if (typeof sub?.source === 'string') ids.add(sub.source);
        }
        return [...ids]
            .map((sourceId) => ({ sourceId, url: this.computedSources.get(sourceId) }))
            .filter((entry2): entry2 is { sourceId: string; url: string } => typeof entry2.url === 'string');
    }

    /** registerMapLayer appends at the top of `mapLayers`; when the engine inserted the
     *  layer at a hinted position, mirror that position in the store's key order so the
     *  legend and the engine agree on the stack. */
    private syncMapLayerOrder(layerId: string, options?: LayerInsertOptions): void {
        if (options?.beforeLayerId) {
            reorderMapLayers(this.store, layerId, options.beforeLayerId);
            return;
        }
        if (options?.afterLayerId) {
            const ids = Object.keys(this.store.getState().mapLayers ?? {}).filter((id) => id !== layerId);
            const idx = ids.indexOf(options.afterLayerId);
            if (idx !== -1) reorderMapLayers(this.store, layerId, ids[idx + 1] ?? null);
        }
    }

    private async addDecomposedComposite(layer: CompositeStyleLayerConfig, options?: LayerInsertOptions): Promise<boolean> {
        const logicalId = layer.id;
        const legendRole = (layer.metadata as Record<string, unknown> | undefined)?.legendRole ?? 'overlay';

        // Normalize sources to the same globally-addressable `${logicalId}:${key}` id
        // convention every other engine's composite-layer path uses (composite-layer-utils),
        // so store.mapLayers[id].sourceId (set by registerMapLayer below) actually
        // resolves to a source the engine registered.
        const normalized = normalizeCompositeLayer(layer);
        const sources = normalized?.sources ?? [];
        for (const source of sources) {
            this.engineRegisterCompositeSource(source.globalId, source.config);
        }

        // Add each sublayer individually; engine groups them under logicalLayerId
        let anySuccess = false;
        for (const sublayer of (layer.layers ?? [])) {
            const resolvedSource = (normalized && findNormalizedSource(normalized, (sublayer as any).source)?.globalId)
                ?? (sublayer as any).source;
            const sublayerWithMeta: any = {
                ...sublayer,
                source: resolvedSource,
                metadata: {
                    ...((sublayer as any).metadata ?? {}),
                    logicalLayerId: logicalId,
                    legendRole,
                },
            };
            const ok = await this.engineAddLayer(sublayerWithMeta, options);
            if (ok) anySuccess = true;
        }

        if (anySuccess) {
            registerMapLayer(this.store, layer);
            this.syncMapLayerOrder(logicalId, options);
            this.layerConfigStore.set(logicalId, { config: layer, options });
            this.applyConfigTransparency(logicalId, layer);
            const activeLayers = Object.keys(this.store.getState().mapLayers ?? {});
            this.events.emit({ type: 'layer-add', layerId: logicalId, activeLayers });
        }
        return anySuccess;
    }

    /**
     * Gives a layer an extra sublayer of its own, or takes it away again.
     *
     * Labels are the case this exists for. They are part of the layer, not a
     * layer beside it: one row in the legend, one delete button, one style
     * panel — and a legend that shows the classes *and* what the labels say.
     * A layer beside it got all four wrong.
     *
     * Every engine already draws a composite (`type: 'style'`) layer, so rather
     * than teaching four adapters to attach a sublayer to a live layer, the
     * layer is rebuilt from the config it was added with — which `addLayer`
     * keeps for exactly this kind of thing — as a composite carrying both. Its
     * place in the stack is preserved by re-adding it before whatever sat above.
     */
    async setExtraSubLayer(layerId: string, sublayer: Record<string, unknown> | null): Promise<boolean> {
        const stored = this.layerConfigStore.get(layerId);
        const config = stored?.config as Record<string, unknown> | undefined;
        if (!config) return false;

        const original = this.originalSubLayers(config, layerId);
        const kept = original.filter((entry) => (entry as { id?: string }).id !== sublayer?.id
            && !String((entry as { id?: string }).id ?? '').endsWith(EXTRA_SUBLAYER_SUFFIX));
        const layers = sublayer ? [...kept, sublayer] : kept;

        const composite: Record<string, unknown> = {
            ...config,
            type: 'style',
            version: 8,
            sources: (config.sources && typeof config.sources === 'object') ? config.sources : {},
            layers,
        };
        delete composite.paint;
        delete composite.layout;
        delete composite['source-layer'];

        // Whatever sat directly above it, so the rebuilt layer lands back in the
        // same place rather than on top of everything.
        const ids = Object.keys(this.store.getState().mapLayers ?? {});
        const above = ids[ids.indexOf(layerId) + 1];

        this.removeLayer(layerId);
        return this.addLayer(composite, above ? { beforeLayerId: above } : stored?.options);
    }

    /**
     * The sublayers a layer draws with *today*.
     *
     * The paint comes from the store, not from the config it was added with:
     * the style panel has usually just recoloured the layer, and rebuilding it
     * from the original config would throw that away — choosing labels would
     * undo the colouring they were chosen to go with.
     */
    private originalSubLayers(config: Record<string, unknown>, layerId: string): Array<Record<string, unknown>> {
        const entry = (this.store.getState().mapLayers ?? {})[layerId] as Record<string, unknown> | undefined;
        const live = Array.isArray(entry?.sublayers) ? entry!.sublayers as Array<Record<string, unknown>> : null;
        const paintOf = (id: unknown): Record<string, unknown> | undefined => {
            const match = live?.find((sub) => sub.id === id);
            const paint = match?.paint ?? (live ? undefined : entry?.paint);
            return paint && typeof paint === 'object' ? paint as Record<string, unknown> : undefined;
        };

        if (Array.isArray(config.layers)) {
            return (config.layers as Array<Record<string, unknown>>).map((sub) => {
                const paint = paintOf(sub.id);
                return paint ? { ...sub, paint } : sub;
            });
        }
        // A plain layer becomes the first sublayer of the composite it is about
        // to be; its own id is kept so paint edits keep addressing it.
        const { metadata: _metadata, ...rest } = config;
        const id = typeof config.id === 'string' ? config.id : layerId;
        const paint = paintOf(id) ?? (entry?.paint as Record<string, unknown> | undefined);
        return [{ ...rest, id, ...(paint ? { paint } : {}) }];
    }

    removeLayer(id: string): void {
        this.refresher?.unwatch(id);
        this.layerConfigStore.delete(id);
        this.engineRemoveLayer(id);
        unregisterMapLayer(this.store, id);
        const activeLayers = Object.keys(this.store.getState().mapLayers ?? {});
        this.events.emit({ type: 'layer-remove', layerId: id, activeLayers });
        this.removeOwnedLayers(id);
    }

    /**
     * Takes away the layers that only exist to accompany another one.
     *
     * The style panel's labels are a layer of their own — that is what makes
     * them work on every engine and switchable in the legend — but they are not
     * a dataset anybody asked for: leaving them behind when their layer goes
     * left country names floating over an empty map, with no row left to
     * switch them off by. A layer says who it belongs to with
     * `metadata.ownerLayerId`.
     */
    private removeOwnedLayers(ownerId: string): void {
        const layers = this.store.getState().mapLayers ?? {};
        for (const [layerId, entry] of Object.entries(layers)) {
            if ((entry as { ownerLayerId?: string })?.ownerLayerId === ownerId) {
                this.removeLayer(layerId);
            }
        }
    }

    /** Returns the layer config for every currently active layer, keyed by logical layer id. */
    getLayerConfigs(): Map<string, unknown> {
        const result = new Map<string, unknown>();
        for (const [id, entry] of this.layerConfigStore) {
            result.set(id, entry.config);
        }
        return result;
    }

    /** Returns stored layer configs in current stack order (bottom to top), then clears the store. */
    protected drainLayerConfigs(): Array<{ config: unknown; options?: LayerInsertOptions }> {
        const order = Object.keys(this.store.getState().mapLayers ?? {});
        const result = order
            .map(id => this.layerConfigStore.get(id))
            .filter((e): e is { config: unknown; options?: LayerInsertOptions } => e !== undefined);
        this.layerConfigStore.clear();
        this.store.dispatch({ mapLayers: {} }, 'INIT');
        return result;
    }

    /** Repositions `layerId` immediately below `beforeLayerId` (or to the top if null/undefined). */
    moveLayer(layerId: string, beforeLayerId?: string | null): void {
        this.getLogicalLayerExecutor().moveLayer(layerId, beforeLayerId);
        reorderMapLayers(this.store, layerId, beforeLayerId);
        const activeLayers = Object.keys(this.store.getState().mapLayers ?? {});
        this.events.emit({ type: 'layer-reorder', layerId, activeLayers });
    }

    /**
     * Repaints one sublayer, and mirrors the new paint into `store.mapLayers` so
     * everything reading the style from the store — the legend, and a save that
     * writes the layer back out — reflects it.
     *
     * The mirror lives here for the same reason `setLayerVisibility`'s does: two
     * callers keeping their own copy in step is exactly how engine and store
     * drifted apart before. A style edit that only reached the engine left the
     * legend showing the colours the layer used to have.
     */
    updateLayerStyle(layerId: string, subLayerId: string, partialPaint: Record<string, unknown>): boolean {
        const applied = this.getLogicalLayerExecutor().updateLayerStyle(layerId, subLayerId, partialPaint);
        if (applied) this.mirrorPaintToStore(layerId, subLayerId, partialPaint);
        return applied;
    }

    private mirrorPaintToStore(layerId: string, subLayerId: string, partialPaint: Record<string, unknown>): void {
        const current = this.store.getState().mapLayers ?? {};
        const entry = current[layerId] as Record<string, unknown> | undefined;
        if (!entry) return;

        const merge = (existing: unknown): Record<string, unknown> => ({
            ...(existing && typeof existing === 'object' ? existing as Record<string, unknown> : {}),
            ...partialPaint,
        });

        // A composite layer keeps its paint per sublayer; a standard layer keeps
        // it at the top level and is addressed with subLayerId === layerId.
        const sublayers = Array.isArray(entry.sublayers) ? entry.sublayers as Record<string, unknown>[] : null;
        const updated = sublayers
            ? {
                ...entry,
                sublayers: sublayers.map((sub) =>
                    String(sub.id ?? '') === subLayerId ? { ...sub, paint: merge(sub.paint) } : sub),
            }
            : { ...entry, paint: merge(entry.paint) };

        this.store.dispatch({ mapLayers: { ...current, [layerId]: updated } }, 'UI');
    }

    /** Engine-agnostic: delegates the actual rendering to whichever executor the concrete
     *  adapter is bound to, and mirrors the change into store.mapLayers so anything reading
     *  visibility from the store (the legend, story steps, etc.) stays in sync automatically —
     *  callers no longer need to dispatch this themselves. */
    setLayerVisibility(layerId: string, visible: boolean): void {
        this.getLogicalLayerExecutor().setLayerVisibility(layerId, visible);
        const current = this.store.getState().mapLayers ?? {};
        const entry = current[layerId];
        if (entry && entry.visible !== visible) {
            this.store.dispatch({ mapLayers: { ...current, [layerId]: { ...entry, visible } } }, 'UI');
        }
    }

    /** Engine-agnostic counterpart to setLayerVisibility — see its comment. `opacity` is the
     *  0-1 fraction the engine expects; the store tracks the inverse as `transparency` (0-100,
     *  matching the legend's slider). */
    setLayerOpacity(layerId: string, opacity: number): void {
        this.getLogicalLayerExecutor().setLayerOpacity(layerId, opacity);
        const transparency = Math.round((1 - opacity) * 100);
        const current = this.store.getState().mapLayers ?? {};
        const entry = current[layerId];
        if (entry && entry.transparency !== transparency) {
            this.store.dispatch({ mapLayers: { ...current, [layerId]: { ...entry, transparency } } }, 'UI');
        }
    }

    /** Engine-agnostic counterpart to setLayerVisibility — the engine only does the engine
     *  work in `engineSetTerrainEnabled`; mirroring the result into `store.terrainEnabled`
     *  happens here, so every engine (and every caller) stays in sync automatically.
     *  Nothing is dispatched when the engine reports the change was not applied. */
    setTerrainEnabled(enabled: boolean, terrainSource?: unknown): boolean {
        const applied = this.engineSetTerrainEnabled(enabled, terrainSource);
        if (applied && this.store.getState().terrainEnabled !== enabled) {
            this.store.dispatch({ terrainEnabled: enabled }, 'UI');
        }
        return applied;
    }

    /** Engine-specific terrain toggle. Default: engine has no terrain support. */
    protected engineSetTerrainEnabled(_enabled: boolean, _terrainSource?: unknown): boolean {
        return false;
    }

    removeSource(id: string): void {
        // Unregister all layers whose sourceId matches this source before delegating
        // to the engine. Only the store knows which layer IDs were registered under
        // this source — the engine must not call unregisterMapLayer in removeSource.
        const layers = this.store.getState().mapLayers ?? {};
        for (const [layerId, meta] of Object.entries(layers)) {
            if ((meta as any).sourceId === id) {
                unregisterMapLayer(this.store, layerId);
                const activeLayers = Object.keys(this.store.getState().mapLayers ?? {});
                this.events.emit({ type: 'layer-remove', layerId, activeLayers });
            }
        }
        this.sourceAttributions.delete(id);
        this.engineRemoveSource(id);
    }

    // ── Engine hooks (implement in each concrete adapter) ────────────────────

    /**
     * Engine-specific layer add. Return true if the layer was accepted and added.
     * Default: try the logical-layer executor first, fall back to the engine core for
     * inline/native layer defs. Override only when the engine needs extra routing.
     */
    protected async engineAddLayer(layer: any, options?: LayerInsertOptions): Promise<boolean> {
        const success = await this.getLogicalLayerExecutor().addLayer(layer, options);
        if (success) return true;
        return this.getCore().addLayer(layer, options);
    }

    /** Engine-specific layer remove. */
    protected engineRemoveLayer(id: string): void {
        this.getLogicalLayerExecutor().removeLayer(id);
        this.getCore().removeLayer(id);
    }

    /** Engine-specific source remove. */
    protected engineRemoveSource(id: string): void {
        this.computedSources.delete(id);
        this.unsuppressBusySignalForSource(id);
        this.getCore().removeSource(id);
    }

    /** Engine-specific source add. */
    protected engineAddSource(id: string, config: any): void {
        this.getCore().addSource(id, config);
    }

    /**
     * Registers a composite layer source. Override in engines that need format conversion
     * (e.g. MapLibre: webmapx SourceConfig → native MapLibre source object).
     * Default falls back to engineAddSource.
     */
    protected engineRegisterCompositeSource(id: string, config: unknown): void {
        this.engineAddSource(id, config);
    }

    // ── Shared engine accessors (implement in each concrete adapter) ─────────

    /** Returns the engine's core service (handles addSource/removeSource/getSource/etc). */
    protected abstract getCore(): IMapCore;

    /** Returns the logical-layer executor used for catalog/source-data fallbacks. */
    protected abstract getLogicalLayerExecutor(): DeferredLogicalLayerExecutor;

    /** Returns the marker service, or null if not yet bound. */
    protected abstract getMarkerService(): MarkerService | null;

    // ── Shared pass-through implementations ──────────────────────────────────

    getSource(id: string): ISource | undefined {
        return this.getCore().getSource(id) ?? (
            this.getLogicalLayerExecutor().getSourceData(id) !== null
                ? { id, setData: (data: GeoJSON.FeatureCollection) => { this.getLogicalLayerExecutor().setSourceData(id, data); } }
                : undefined
        );
    }

    suppressBusySignalForSource(sourceId: string): void {
        this.getCore().suppressBusySignalForSource(sourceId);
    }

    unsuppressBusySignalForSource(sourceId: string): void {
        this.getCore().unsuppressBusySignalForSource(sourceId);
    }

    addMarker(id: string, lngLat: LngLat, options?: MarkerOptions): void {
        this.getMarkerService()?.add(id, lngLat, options);
    }

    moveMarker(id: string, lngLat: LngLat): void {
        this.getMarkerService()?.move(id, lngLat);
    }

    removeMarker(id: string): void {
        this.getMarkerService()?.remove(id);
    }

    // ── Camera / core pass-throughs ──────────────────────────────────────────
    // Plain delegation to the engine core. Engines override only where their
    // behaviour actually differs — anything not overridden below is identical
    // across all engines by construction.

    initialize(containerId: string, options?: MapInitOptions): void {
        this.getCore().initialize(containerId, options);
        if (options?.backgroundColor) {
            this.setBackgroundColor(options.backgroundColor);
        }
        // A configured projection an engine cannot draw in is otherwise silent:
        // the map comes up in Web Mercator and looks like the config was ignored,
        // which is exactly what happened. Engines that support one report it from
        // `getProjection()`; the others answer null.
        if (options?.projection && this.getProjection() === null) {
            console.warn(`[projection] this engine has no runtime projection support, so "${options.projection}" was not applied. Use the OpenLayers adapter for a map in a chosen projection.`);
        }
    }

    /**
     * Paints a colour behind everything the map draws.
     *
     * A map with no background layer otherwise shows the engine's own default,
     * and those defaults disagree: black for a Cesium globe and the space
     * around it, the page's background through a transparent canvas elsewhere.
     * A palaeogeography map has no basemap by definition, so this is what "the
     * sea" is made of.
     *
     * Remembered rather than applied once, because the engine can be replaced
     * under the same map element — switching to Cesium must not lose the
     * colour — and because a colour set before the engine is ready has to be
     * applied when it is.
     */
    setBackgroundColor(color: string | null): boolean {
        this.backgroundColor = color;
        return this.engineSetBackgroundColor(color);
    }

    /** The colour last asked for, whether or not the engine could apply it. */
    getBackgroundColor(): string | null {
        return this.backgroundColor;
    }

    protected backgroundColor: string | null = null;

    /** Engine-specific background paint. Default: engine cannot paint one. */
    protected engineSetBackgroundColor(_color: string | null): boolean {
        return false;
    }

    getViewportState() {
        return this.getCore().getViewportState();
    }

    setViewport(center: [number, number], zoom: number): void {
        this.getCore().setViewport(center, zoom);
    }

    getZoom(): number {
        return this.getCore().getZoom();
    }

    setZoom(level: number): void {
        this.getCore().setZoom(level);
    }

    getBearing(): number {
        return this.getCore().getBearing();
    }

    setBearing(bearing: number): void {
        this.getCore().setBearing(bearing);
    }

    getPitch(): number {
        return this.getCore().getPitch();
    }

    setPitch(pitch: number): void {
        this.getCore().setPitch(pitch);
    }

    resetNorth(): void {
        this.getCore().resetNorth();
    }

    resetNorthPitch(): void {
        this.getCore().resetNorthPitch();
    }

    fitBounds(bbox: [number, number, number, number]): void {
        this.getCore().fitBounds(bbox);
    }

    setCursor(cursor: string): void {
        this.getCore().setCursor(cursor);
    }

    setPanEnabled(enabled: boolean): void {
        this.getCore().setPanEnabled(enabled);
    }

    /** Default: nothing to do — most engines' canvases already have touch-action: none. */
    setTouchCaptureEnabled(_enabled: boolean): void {}

    setDoubleClickZoomEnabled(enabled: boolean): void {
        this.getCore().setDoubleClickZoomEnabled(enabled);
    }

    project(coords: LngLat): Pixel {
        return this.getCore().project(coords);
    }

    unproject(pixel: Pixel): LngLat | null {
        return this.getCore().unproject(pixel);
    }

    getNavigationCapabilities(): NavigationCapabilities {
        return this.getCore().getNavigationCapabilities();
    }

    getElevation(lngLat: LngLat): number | null {
        return this.getCore().getElevation?.(lngLat) ?? null;
    }

    /** Default: engine has no terrain support (see setTerrainEnabled/engineSetTerrainEnabled). */
    isTerrainEnabled(): boolean | null {
        return null;
    }

    /**
     * Engine-agnostic counterpart to setLayerVisibility/setTerrainEnabled: the engine half
     * lives in `engineSetProjection`, the store mirror happens here. Mirrors the projection
     * the engine actually ended up with (`getProjection()`), not the requested one, so
     * normalisation by the engine is reflected. Nothing is dispatched when unsupported.
     */
    setProjection(projection: string | MapProjectionState): boolean {
        const applied = this.engineSetProjection(projection);
        if (applied) {
            this.store.dispatch({ mapProjection: this.getProjection() }, 'UI');
        }
        return applied;
    }

    /** Engine-specific projection switch. Default: engine has no runtime projection switching. */
    protected engineSetProjection(_projection: string | MapProjectionState): boolean {
        return false;
    }

    /** Reads live engine state (not the store mirror). `null` = engine has no projection support. */
    getProjection(): MapProjectionState | null {
        return null;
    }

    // ── Logical-layer pass-throughs ──────────────────────────────────────────

    /** Alias of removeLayer — logical and native removal follow the same path. */
    removeLogicalLayer(layerId: string): void {
        this.removeLayer(layerId);
    }

    getSourceData(sourceId: string): GeoJSON.FeatureCollection | string | null {
        return this.getCore().getSourceData(sourceId) ?? this.getLogicalLayerExecutor().getSourceData(sourceId);
    }

    setSourceData(sourceId: string, data: GeoJSON.FeatureCollection): boolean {
        return this.getLogicalLayerExecutor().setSourceData(sourceId, data);
    }

    queryLayerFeatures(layerId: string, options?: QueryLayerFeaturesOptions): Promise<GeoJSON.FeatureCollection> {
        return this.getLogicalLayerExecutor().queryLayerFeatures(layerId, options);
    }

    getLayerSourceLayers(layerId: string): string[] {
        return this.getLogicalLayerExecutor().getLayerSourceLayers(layerId);
    }
}
