// src/utils/layer-transparency.ts
import type { IMap } from '../map/IMapInterfaces';

/**
 * Applies a 0-100 transparency value to a layer, shared by every UI control
 * that offers one (the legend's per-layer slider, the mega slider) so the
 * hillshade exception below lives in exactly one place.
 *
 * A plain layer goes through `setLayerOpacity`, which mirrors `transparency`
 * into the store itself (see BaseAdapter). Hillshade has no opacity property —
 * it renders through `hillshade-exaggeration` — so the store is dispatched to
 * directly and the paint property is moved instead; two callers doing that
 * independently is exactly the duplicate-writer pattern this codebase avoids
 * everywhere else.
 */
export function applyLayerTransparency(adapter: IMap, layerId: string, transparency: number): void {
  const current = adapter.store.getState().mapLayers;
  const entry = current[layerId];
  const meta = entry as Record<string, unknown> | undefined;

  if (meta?.layerType === 'hillshade') {
    if (entry) {
      adapter.store.dispatch({ mapLayers: { ...current, [layerId]: { ...entry, transparency } } }, 'UI');
    }
    const sublayers = meta?.sublayers as Array<{ id?: string; type?: string }> | undefined;
    const primarySub = sublayers?.find((s) => s?.type === 'hillshade');
    const subLayerId = primarySub?.id ?? layerId;
    adapter.updateLayerStyle(layerId, subLayerId, { 'hillshade-exaggeration': (100 - transparency) / 100 });
  } else {
    adapter.setLayerOpacity(layerId, (100 - transparency) / 100);
  }
}
