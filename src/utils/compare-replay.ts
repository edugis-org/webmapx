import type { IMap } from '../map/IMapInterfaces';
import type { MapInitOptions } from '../map/base-adapter';
import type { WebmapxMapElement } from '../components/webmapx-map';
import type { AppConfig } from '../config/types';

/** Marks a map element that exists to render something, not because the user asked for a map.
 *  `resolveMapElement` and `WebMapX.enableConfigEditTool` skip anything carrying it. */
export const COMPARE_REFERENCE_ROLE = 'compare-reference';

/**
 * Builds the compare tool's frozen map: a second `<webmapx-map>` showing the live map exactly
 * as it is at this moment.
 *
 * It is a *replay*, not a serialised config. Every piece of "how the map looks" is already
 * state something else keeps, and both maps live in one document, so the frozen side reads it
 * from memory:
 *
 * 1. the same parsed config object — its `activeLayers` rebuild the base stack, catalog and all;
 * 2. `runtimeLayerRequests` — every layer added at runtime, replayed the way `saveState`/
 *    `restoreState` already carry them across an engine switch;
 * 3. `store.mapLayers` — visibility, opacity, stack order and (the part a config snapshot loses)
 *    the paint mirrored there by `updateLayerStyle`, so a style-panel edit survives the freeze;
 * 4. projection, terrain and camera — three reads, three writes.
 *
 * Generating a config document instead would drop (3), which is the one thing a compare tool
 * cannot get wrong: the frozen side would look different from the map the button was pressed on.
 */
export interface FrozenMap {
  element: WebmapxMapElement;
  adapter: IMap;
}

/** The attribute the compare tool keeps the split position in, so a share link can read it
 *  without importing the tool. */
export const COMPARE_SPLIT_ATTRIBUTE = 'data-compare-split';

/**
 * The comparison running on this map, if any, read from the DOM.
 *
 * Read rather than asked for: the legend builds the share link and would otherwise have to
 * import the compare tool to reach its state, which is a component importing a component for
 * one number. The frozen map announces itself with its role and carries the split alongside.
 */
export function findActiveComparison(
  liveMapEl: Element,
): { element: WebmapxMapElement; adapter: IMap; split: number } | null {
  const element = liveMapEl.querySelector<WebmapxMapElement>(
    `:scope > webmapx-map[data-webmapx-role="${COMPARE_REFERENCE_ROLE}"]`,
  );
  const adapter = element?.adapter;
  if (!element || !adapter) return null;
  const split = Number(element.getAttribute(COMPARE_SPLIT_ATTRIBUTE));
  return { element, adapter, split: Number.isFinite(split) ? split : 50 };
}

export interface FrozenMapOptions {
  /**
   * False builds the frozen map from the link instead of from the live map.
   *
   * A restored comparison is a *reconstruction*: the frozen map is the second `<webmapx-map>`
   * on the page, so `webmapx-map` restores it from `s.1` by itself — layers, visibility,
   * opacity, projection, terrain and the clock — exactly as it restores any other map. There
   * is nothing to replay from the live map, and replaying it anyway would overwrite the very
   * state the link asked for with a copy of the half the visitor can already see.
   */
  replayLiveMap?: boolean;
}

export async function createFrozenMap(
  liveMapEl: WebmapxMapElement,
  liveAdapter: IMap,
  container: HTMLElement,
  options?: FrozenMapOptions,
): Promise<FrozenMap | null> {
  const replayLiveMap = options?.replayLiveMap !== false;
  const config = liveMapEl.config;
  if (!config) return null;

  const element = document.createElement('webmapx-map') as WebmapxMapElement;
  element.id = `${liveMapEl.id || 'map'}-compare-reference`;
  element.dataset.webmapxRole = COMPARE_REFERENCE_ROLE;
  // The same engine as the live map, or the two halves render differently and the seam
  // stops being a comparison of content.
  element.setAttribute('adapter', liveAdapter.engineId);
  element.style.position = 'absolute';
  element.style.inset = '0';
  // A picture, not a map: no layout child, no tools, and nothing reaches its camera but us.
  element.style.pointerEvents = 'none';
  // Before the layout, never after it: `webmapx-layout` is deliberately the last child so it
  // renders above the map canvas, and a frozen map appended after it covers the toolbar —
  // leaving no way to switch the comparison off or to add a layer to the live side.
  const layout = container.querySelector(':scope > webmapx-layout');
  container.insertBefore(element, layout);

  const adapter = await element.getAdapterAsync();
  if (!adapter) {
    element.remove();
    return null;
  }

  // The clocks first, before the config's own layers are built: a computed source reads the
  // moment through the `{ma}` (or time) placeholder *when it is added*, so setting the clock
  // afterwards would build every layer for now and then rebuild it — which is the same reason
  // `webmapx-map` applies a permalink's time before its layers. Frozen means frozen: the two
  // maps have separate stores, so the time and deep-time tools keep driving the live one only.
  if (replayLiveMap) replayClocks(liveAdapter, adapter);

  element.setConfig(config as AppConfig);
  adapter.initialize(element.id, initOptionsFor(config as AppConfig, liveAdapter));

  await element.whenLayersReady();

  if (replayLiveMap) {
    const unresolved = await replayRuntimeLayers(liveMapEl, element);
    // After the layers, never before them: a request that carries its source inline has
    // already created it, and what is copied here is the data those sources now hold.
    replaySourceData(liveAdapter, adapter);
    for (const entry of unresolved) {
      await element.addLayerRequest(entry.request, entry.fallback, entry.options);
    }
    replayLayerSettings(liveAdapter, adapter);
    replayMapState(liveAdapter, adapter);
  } else {
    // `whenLayersReady` has already applied `s.1`; only the camera is ours, since the link's
    // frozen viewport is written for every map but is overwritten by the live map's first
    // view change anyway.
    syncCamera(liveAdapter, adapter);
  }

  return { element, adapter };
}

/**
 * Copies the map's two clocks — `mapTime` (a date, driven by the time tool) and `deepTimeMa`
 * (an age in millions of years, driven by the deep-time tool) — onto the frozen map.
 *
 * Playback (`mapTimePlay`) deliberately does not travel: the frozen half is the map at one
 * moment, and a second animation running behind the seam would make the two halves differ by
 * how long the panel had been open.
 */
function replayClocks(liveAdapter: IMap, frozenAdapter: IMap): void {
  const { mapTime, deepTimeMa } = liveAdapter.store.getState();
  if (mapTime && mapTime.mode === 'pinned') {
    frozenAdapter.store.dispatch({ mapTime }, 'INIT');
  }
  if (typeof deepTimeMa === 'number') {
    frozenAdapter.store.dispatch({ deepTimeMa }, 'INIT');
  }
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

/**
 * Gives the frozen map the geometry that lives in the live map's sources rather than in any
 * layer definition.
 *
 * A layer added through `addLayerRequest` carries its source inline, so replaying the request
 * rebuilds both — that is why a dropped file arrives on the frozen side. Anything the user
 * *edits* cannot work that way: the draw tool creates its source empty (inline for a polygon
 * layer, with a `webmapx-add-source` event for a point or line one) and then pushes features
 * into it with `webmapx-set-source-data` on every vertex, because a layer request is a
 * snapshot and there is nothing to re-issue per mouse move. Replaying the request therefore
 * reproduces an *empty* draw layer, or none at all when the source was made out of band, and
 * a drawn rectangle silently never appeared on the frozen half.
 *
 * So both halves of the problem are handled here: a source the frozen map lacks is created,
 * and one it has is filled with what the live source currently holds.
 *
 * Sources are found through `store.mapLayers` rather than by asking the engine for its source
 * list, which no adapter exposes. A composite layer names its sources with the local key it
 * uses internally, so the engine's id is tried first (`<layerId>:<key>`) and the bare key
 * only as a fallback.
 */
function replaySourceData(liveAdapter: IMap, frozenAdapter: IMap): void {
  const liveLayers = liveAdapter.store.getState().mapLayers ?? {};
  for (const sourceId of collectSourceIds(liveLayers)) {
    const data = liveAdapter.getSourceData(sourceId);
    // A string is a url the frozen map fetches for itself; only in-memory GeoJSON has to travel.
    if (!data || typeof data === 'string') continue;

    if (frozenAdapter.getSource(sourceId)) {
      frozenAdapter.setSourceData(sourceId, data);
      continue;
    }
    const config = liveAdapter.getSourceConfig(sourceId);
    frozenAdapter.addSource(sourceId, { type: 'geojson', ...(config ?? {}), data });
  }
}

/** Every source id referenced by a layer, in the spelling the engine knows it by. */
function collectSourceIds(mapLayers: Record<string, unknown>): string[] {
  const ids = new Set<string>();
  for (const [layerId, entry] of Object.entries(mapLayers)) {
    const layer = entry as Record<string, unknown>;
    if (typeof layer.sourceId === 'string') ids.add(layer.sourceId);
    const sublayers = Array.isArray(layer.sublayers) ? layer.sublayers as Record<string, unknown>[] : [];
    for (const sub of sublayers) {
      // A composite's sublayer names its source by the key local to that layer; the engine
      // registers it prefixed with the layer id.
      if (typeof sub.source === 'string') ids.add(`${layerId}:${sub.source}`);
    }
  }
  return [...ids];
}

/** Replays every runtime layer request, returning the ones that failed — a layer whose source
 *  the request does not carry cannot be added until `replayInlineSources` has copied it. */
async function replayRuntimeLayers(
  liveMapEl: WebmapxMapElement,
  frozenEl: WebmapxMapElement,
): Promise<WebmapxMapElement['runtimeLayerRequests'][number][]> {
  const failed: WebmapxMapElement['runtimeLayerRequests'][number][] = [];
  for (const entry of liveMapEl.runtimeLayerRequests) {
    const added = await frozenEl.addLayerRequest(entry.request, entry.fallback, entry.options);
    if (!added) failed.push(entry);
  }
  return failed;
}

/**
 * Walks `store.mapLayers` in key order — which is the bottom-to-top stack — and applies each
 * layer's user settings to the frozen adapter. Order is replayed by moving every layer, in
 * order, in front of the one below it; `moveLayer` resolves a `beforeLayerId` an engine does
 * not track by walking `mapLayers` forward, exactly as a legend drag does.
 */
function replayLayerSettings(liveAdapter: IMap, frozenAdapter: IMap): void {
  const liveLayers = liveAdapter.store.getState().mapLayers ?? {};
  const frozenLayers = frozenAdapter.store.getState().mapLayers ?? {};
  const ids = Object.keys(liveLayers).filter((id) => frozenLayers[id]);

  let previous: string | null = null;
  for (const id of ids) {
    const entry = liveLayers[id] as Record<string, unknown>;

    if (entry.visible === false) frozenAdapter.setLayerVisibility(id, false);

    const transparency = typeof entry.transparency === 'number' ? entry.transparency : 0;
    if (transparency > 0) frozenAdapter.setLayerOpacity(id, (100 - transparency) / 100);

    replayPaint(frozenAdapter, id, entry);

    if (previous) frozenAdapter.moveLayer(id, null);
    previous = id;
  }
}

function replayPaint(frozenAdapter: IMap, layerId: string, entry: Record<string, unknown>): void {
  const sublayers = Array.isArray(entry.sublayers) ? entry.sublayers as Record<string, unknown>[] : null;
  if (sublayers) {
    for (const sub of sublayers) {
      const paint = sub.paint as Record<string, unknown> | undefined;
      const subId = typeof sub.id === 'string' ? sub.id : null;
      if (paint && subId && Object.keys(paint).length > 0) {
        frozenAdapter.updateLayerStyle(layerId, subId, paint);
      }
    }
    return;
  }
  // A standard layer keeps its paint at the top level and is addressed with its own id.
  const paint = entry.paint as Record<string, unknown> | undefined;
  if (paint && Object.keys(paint).length > 0) {
    frozenAdapter.updateLayerStyle(layerId, layerId, paint);
  }
}

function replayMapState(liveAdapter: IMap, frozenAdapter: IMap): void {
  const projection = liveAdapter.getProjection();
  if (projection) frozenAdapter.setProjection(projection);

  if (liveAdapter.isTerrainEnabled() === true) frozenAdapter.setTerrainEnabled(true);

  syncCamera(liveAdapter, frozenAdapter);
}

/** One direction only: live drives reference. Called per `view-change`, not per
 *  `view-change-end` — at end-only the two halves visibly slide apart during a pan, which
 *  reads as a rendering bug rather than as a comparison. */
export function syncCamera(liveAdapter: IMap, frozenAdapter: IMap): void {
  const { center, zoom, bearing, pitch } = liveAdapter.getViewportState();
  // Instantly, not animated: MapLibre's default flight is cancelled by the bearing and pitch
  // writes below, so an animated follow leaves the frozen half standing still.
  frozenAdapter.setViewport(center, zoom, { animate: false });
  frozenAdapter.setBearing(bearing);
  frozenAdapter.setPitch(pitch);
}
