import type { IMap } from '../map/IMapInterfaces';
import type { PermalinkTimeState } from './permalink';

/**
 * The layer the 3D tool manages on the map's behalf.
 *
 * It lives here rather than on `webmapx-3d-tool` (which re-exports it) because a permalink
 * has to know the id to leave it out, and a utility pulling in a Lit component to read one
 * string would drag the whole tool into every bundle that shares a link.
 */
export const TERRAIN_LAYER_ID = 'webmapx-terrain-hillshade';

/** Everything a permalink records about one map, read straight from its adapter and store. */
export interface MapPermalinkSnapshot {
  /** All layer ids in bottom-to-top stack order. */
  layerIds: string[];
  hiddenLayerIds: string[];
  viewport: { center: [number, number]; zoom: number; bearing: number; pitch: number };
  /** Per-layer transparency (0–100 %); only non-zero entries. */
  transparencyOverrides: Map<string, number>;
  projection: string | null;
  terrainEnabled: boolean;
  /** The pinned moment and its play speed, or null for a map running live. */
  time: PermalinkTimeState | null;
  /**
   * Layers that exist only in this browser — a dropped file, a drawn layer, a computed
   * result. A permalink records the id and the other machine finds nothing behind it, so the
   * share dialog names them rather than letting the link fail quietly.
   */
  dynamicLayerIds: string[];
}

/**
 * Reads one map's shareable state.
 *
 * Both legends built this identically and independently — the same thirty lines twice, and a
 * fix to one silently left the other behind. It is a function of an adapter, not of a panel,
 * which is also what lets the compare tool encode its frozen map: that map has no legend of
 * its own to ask.
 */
export function snapshotMapForPermalink(adapter: IMap): MapPermalinkSnapshot {
  const storeState = adapter.store.getState();
  const mapLayers = storeState.mapLayers ?? {};
  const allLayerIds = Object.keys(mapLayers); // bottom-to-top stack order
  const hiddenLayerIds = allLayerIds.filter(id => mapLayers[id]?.visible === false);

  const transparencyOverrides = new Map<string, number>();
  for (const [id, entry] of Object.entries(mapLayers)) {
    if (typeof entry.transparency === 'number' && entry.transparency !== 0) {
      transparencyOverrides.set(id, entry.transparency);
    }
  }

  const terrainEnabled = adapter.isTerrainEnabled?.() === true;

  // The auto-managed terrain hillshade layer is implied by terrain:true — leaving it in the
  // layer list would have the other end report it as a layer it could not restore.
  const layerIds = terrainEnabled
    ? allLayerIds.filter(id => id !== TERRAIN_LAYER_ID)
    : allLayerIds;

  // The map's clock travels with the link: a pinned moment, and the speed it is playing at.
  // A live map contributes nothing — "now" is not a value.
  const mapTime = storeState.mapTime;
  const time = mapTime?.mode === 'pinned'
    ? { at: mapTime.at, play: storeState.mapTimePlay ?? null }
    : null;

  return {
    layerIds,
    hiddenLayerIds: hiddenLayerIds.filter(id => id !== TERRAIN_LAYER_ID),
    viewport: adapter.getViewportState(),
    transparencyOverrides,
    projection: adapter.getProjection?.()?.name ?? null,
    terrainEnabled,
    time,
    dynamicLayerIds: allLayerIds.filter(id => mapLayers[id]?.dynamic === true),
  };
}
