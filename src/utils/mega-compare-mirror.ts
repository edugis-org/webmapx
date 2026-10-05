// src/utils/mega-compare-mirror.ts
//
// The mega compare control's mirror map: a second, continuously live
// `<webmapx-map>` that renders the same layer stack as the live map except
// for one deliberate difference the caller applies — the current topmost
// eligible layer is forced hidden, so whatever sits directly beneath it
// becomes visible. Clipped to one side of the seam (by the component), this
// is what turns the seam into a swipe between "the top layer" and "the
// layer under it".
//
// Deliberately its own implementation rather than a reuse of
// `compare-replay.ts`'s `createFrozenMap`: that helper hardcodes both the
// element id and the `compare-reference` DOM role that the original compare
// tool's `findActiveComparison` searches for by exact string. Reusing it
// here would make this control's mirror indistinguishable from a real
// compare-tool comparison to that lookup, and could point its share-link
// feature at the wrong map. `syncCamera` is imported anyway — it is generic
// and already exported for exactly this kind of reuse.
import type { IMap } from '../map/IMapInterfaces';
import type { MapInitOptions } from '../map/base-adapter';
import type { WebmapxMapElement } from '../components/webmapx-map';
import type { AppConfig } from '../config/types';
import type { MapLayerStateEntry } from '../store/IMapState';

/** Marks the mirror map so `resolveMapElement`'s single-map fallback and the config-edit tool
 *  skip it (the same generic mechanism the compare tool's own reference map relies on), and so
 *  it never collides with `compare-reference` — see the module comment. */
export const MEGA_COMPARE_REFERENCE_ROLE = 'mega-compare-reference';

export interface MegaCompareMirror {
  element: WebmapxMapElement;
  adapter: IMap;
  destroy(): void;
}

let mirrorSeq = 0;

/**
 * Builds the mirror map: a replay of the live map's config, runtime layers and source data —
 * the same three ingredients `createFrozenMap` replays, for the same reason (a config snapshot
 * alone would lose paint edits mirrored into the store). Layer visibility/opacity/order/paint
 * are deliberately *not* replayed here — the caller (`syncLayerSettings`) applies them
 * immediately after, and continuously from then on, since this mirror never stops tracking
 * the live map.
 */
export async function createMegaCompareMirror(
  liveMapEl: WebmapxMapElement,
  liveAdapter: IMap,
): Promise<MegaCompareMirror | null> {
  const config = liveMapEl.config;
  if (!config) return null;

  const element = document.createElement('webmapx-map') as WebmapxMapElement;
  element.id = `${liveMapEl.id || 'map'}-mega-compare-reference-${mirrorSeq++}`;
  element.dataset.webmapxRole = MEGA_COMPARE_REFERENCE_ROLE;
  element.setAttribute('adapter', liveAdapter.engineId);
  element.style.position = 'absolute';
  element.style.inset = '0';
  element.style.pointerEvents = 'none';

  const layout = liveMapEl.querySelector(':scope > webmapx-layout');
  liveMapEl.insertBefore(element, layout);

  const adapter = await element.getAdapterAsync();
  if (!adapter) {
    element.remove();
    return null;
  }

  element.setConfig(config as AppConfig);
  adapter.initialize(element.id, initOptionsFor(config as AppConfig, liveAdapter));

  await element.whenLayersReady();

  for (const entry of liveMapEl.runtimeLayerRequests) {
    await element.addLayerRequest(entry.request, entry.fallback, entry.options);
  }
  copySourceData(liveAdapter, adapter);

  return { element, adapter, destroy: () => element.remove() };
}

function initOptionsFor(config: AppConfig, liveAdapter: IMap): MapInitOptions {
  const mapConfig = (config.map ?? {}) as unknown as Record<string, unknown>;
  const viewport = liveAdapter.getViewportState();
  const runtimeMap = config.runtimeMap;
  return {
    center: viewport.center,
    zoom: viewport.zoom,
    minZoom: (runtimeMap?.minZoom ?? mapConfig.minZoom) as number | undefined,
    maxZoom: (runtimeMap?.maxZoom ?? mapConfig.maxZoom) as number | undefined,
    minPitch: (runtimeMap?.minPitch ?? mapConfig.minPitch) as number | undefined,
    maxPitch: (runtimeMap?.maxPitch ?? mapConfig.maxPitch) as number | undefined,
    maxBounds: runtimeMap?.maxBounds,
    style: mapConfig.style as MapInitOptions['style'],
    backgroundColor: mapConfig.backgroundColor as string | undefined,
    projection: liveAdapter.getProjection()?.name ?? (mapConfig.projection as string | undefined),
  };
}

/** Every source id referenced by a layer, in the spelling the engine knows it by. */
function collectSourceIds(mapLayers: Record<string, unknown>): string[] {
  const ids = new Set<string>();
  for (const [layerId, entry] of Object.entries(mapLayers)) {
    const layer = entry as Record<string, unknown>;
    if (typeof layer.sourceId === 'string') ids.add(layer.sourceId);
    const sublayers = Array.isArray(layer.sublayers) ? layer.sublayers as Record<string, unknown>[] : [];
    for (const sub of sublayers) {
      if (typeof sub.source === 'string') ids.add(`${layerId}:${sub.source}`);
    }
  }
  return [...ids];
}

/** Copies in-memory GeoJSON the live map's sources hold (e.g. a drawn or imported layer) onto
 *  the mirror, the same way `createFrozenMap`'s `replaySourceData` does for the compare tool. */
function copySourceData(liveAdapter: IMap, mirrorAdapter: IMap): void {
  const liveLayers = liveAdapter.store.getState().mapLayers ?? {};
  for (const sourceId of collectSourceIds(liveLayers)) {
    const data = liveAdapter.getSourceData(sourceId);
    if (!data || typeof data === 'string') continue;

    if (mirrorAdapter.getSource(sourceId)) {
      mirrorAdapter.setSourceData(sourceId, data);
      continue;
    }
    const config = liveAdapter.getSourceConfig(sourceId);
    mirrorAdapter.addSource(sourceId, { type: 'geojson', ...(config ?? {}), data });
  }
}

/**
 * Applies the live map's current layer visibility/opacity/paint/order onto the mirror, with one
 * override: `forceHiddenId`, if given, is always hidden on the mirror regardless of what the
 * live entry says — that is the one deliberate difference between the two panes. Called on
 * every change to the live map's layers, so — unlike the compare tool's one-time freeze — this
 * mirror never goes stale while it exists. Only what differs is written: the mirror's own store
 * already says what it shows, and a mega slider drag changes one layer's opacity many times a
 * second, which must not re-apply every layer's paint and reorder the whole stack each time.
 */
export function syncLayerSettings(liveAdapter: IMap, mirrorAdapter: IMap, forceHiddenId: string | null): void {
  const liveLayers = liveAdapter.store.getState().mapLayers ?? {};

  // The mirror is rebuilt from the config, so it can hold a config layer the live map no longer
  // has — one removed in the legend. Left alone it would show on the mirror's side of the seam.
  for (const id of Object.keys(mirrorAdapter.store.getState().mapLayers ?? {})) {
    if (!liveLayers[id]) mirrorAdapter.removeLayer(id);
  }
  const mirrorLayers = mirrorAdapter.store.getState().mapLayers ?? {};

  const ids = Object.keys(liveLayers).filter((id) => mirrorLayers[id]);
  for (const id of ids) {
    const entry = liveLayers[id] as MapLayerStateEntry;
    const mirrored = mirrorLayers[id] as MapLayerStateEntry;

    const visible = id === forceHiddenId ? false : entry.visible !== false;
    if (visible !== (mirrored.visible !== false)) mirrorAdapter.setLayerVisibility(id, visible);

    // Compared loosely: transparency comes back from the mirror through an opacity fraction.
    const transparency = typeof entry.transparency === 'number' ? entry.transparency : 0;
    const mirroredTransparency = typeof mirrored.transparency === 'number' ? mirrored.transparency : 0;
    if (Math.abs(transparency - mirroredTransparency) > 1e-6) mirrorAdapter.setLayerOpacity(id, (100 - transparency) / 100);

    syncPaint(mirrorAdapter, id, entry as Record<string, unknown>, mirrored as Record<string, unknown>);
  }

  const mirrorOrder = Object.keys(mirrorAdapter.store.getState().mapLayers ?? {}).filter((id) => liveLayers[id]);
  if (mirrorOrder.join('\n') !== ids.join('\n')) {
    ids.forEach((id, index) => { if (index > 0) mirrorAdapter.moveLayer(id, null); });
  }
}

function syncPaint(mirrorAdapter: IMap, layerId: string, entry: Record<string, unknown>, mirrored: Record<string, unknown>): void {
  const same = (a: unknown, b: unknown): boolean => JSON.stringify(a ?? {}) === JSON.stringify(b ?? {});
  const sublayers = Array.isArray(entry.sublayers) ? entry.sublayers as Record<string, unknown>[] : null;
  if (sublayers) {
    const mirroredSublayers = Array.isArray(mirrored.sublayers) ? mirrored.sublayers as Record<string, unknown>[] : [];
    for (const sub of sublayers) {
      const paint = sub.paint as Record<string, unknown> | undefined;
      const subId = typeof sub.id === 'string' ? sub.id : null;
      if (!paint || !subId || Object.keys(paint).length === 0) continue;
      if (same(paint, mirroredSublayers.find((s) => s.id === subId)?.paint)) continue;
      mirrorAdapter.updateLayerStyle(layerId, subId, paint);
    }
    return;
  }
  const paint = entry.paint as Record<string, unknown> | undefined;
  if (paint && Object.keys(paint).length > 0 && !same(paint, mirrored.paint)) {
    mirrorAdapter.updateLayerStyle(layerId, layerId, paint);
  }
}

/** Keeps projection and terrain following the live map — the two pieces of "what the map looks
 *  like" that aren't part of `store.mapLayers` and so aren't covered by `syncLayerSettings`. */
export function syncProjectionAndTerrain(liveAdapter: IMap, mirrorAdapter: IMap): void {
  const projection = liveAdapter.getProjection();
  if (projection && projection.name !== mirrorAdapter.getProjection()?.name) {
    mirrorAdapter.setProjection(projection);
  }
  const terrain = liveAdapter.isTerrainEnabled();
  if (terrain !== null && terrain !== mirrorAdapter.isTerrainEnabled()) {
    mirrorAdapter.setTerrainEnabled(terrain === true);
  }
}
