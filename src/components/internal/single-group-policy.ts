import type { LayerInsertOptions } from '../../map/IMapInterfaces';
import type { LegendRole } from './legend-role-policy';

export function rememberSingleGroupInsertSlotForGroup(
  groupKey: string,
  layerId: string,
  visibleLayers: string[],
  runtimeLayerMetadata: Record<string, unknown> | undefined,
  slotMap: Map<string, LayerInsertOptions>,
  roleMap: Map<string, LegendRole>,
): void {
  const metadata = runtimeLayerMetadata?.[layerId] as Record<string, unknown> | undefined;
  if (metadata?.legendRole === 'background' || metadata?.legendRole === 'overlay') {
    roleMap.set(groupKey, metadata.legendRole);
  }

  const index = visibleLayers.indexOf(layerId);
  if (index < 0) {
    return;
  }

  const beforeLayerId = visibleLayers[index + 1];
  const afterLayerId = visibleLayers[index - 1];

  if (typeof beforeLayerId === 'string' && beforeLayerId.length > 0) {
    slotMap.set(groupKey, { beforeLayerId });
    return;
  }

  if (typeof afterLayerId === 'string' && afterLayerId.length > 0) {
    slotMap.set(groupKey, { afterLayerId });
    return;
  }

  slotMap.delete(groupKey);
}

export function resolveSingleGroupInsertionOptionsForGroup(
  groupKey: string,
  visibleLayers: string[],
  baseOptions: LayerInsertOptions | undefined,
  slotMap: Map<string, LayerInsertOptions>,
): LayerInsertOptions | undefined {
  const slot = slotMap.get(groupKey);
  if (!slot) {
    return baseOptions;
  }

  const visible = new Set(visibleLayers);
  const slotBefore = typeof slot.beforeLayerId === 'string' && visible.has(slot.beforeLayerId)
    ? slot.beforeLayerId
    : undefined;
  const slotAfter = typeof slot.afterLayerId === 'string' && visible.has(slot.afterLayerId)
    ? slot.afterLayerId
    : undefined;

  if (!slotBefore && !slotAfter) {
    slotMap.delete(groupKey);
    return baseOptions;
  }

  const merged: LayerInsertOptions = {
    ...(slotBefore ? { beforeLayerId: slotBefore } : {}),
    ...(slotAfter ? { afterLayerId: slotAfter } : {}),
    ...(baseOptions?.beforeLayerId ? { beforeLayerId: baseOptions.beforeLayerId } : {}),
    ...(baseOptions?.afterLayerId ? { afterLayerId: baseOptions.afterLayerId } : {}),
  };

  return Object.keys(merged).length > 0 ? merged : undefined;
}

