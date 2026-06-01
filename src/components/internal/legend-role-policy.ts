export type LegendRole = 'background' | 'overlay';

export function resolveLegendRoleForLayer(
  layerId: string,
  layerMetadata: Record<string, unknown> | null,
  preferredGroupKey: string | undefined,
  groupRoleMap: Map<string, LegendRole>,
  backgroundSeedLayerId: string | null,
  groupByLayerId: Map<string, string>,
): LegendRole {
  if (layerMetadata?.legendRole === 'background' || layerMetadata?.legendRole === 'overlay') {
    return layerMetadata.legendRole;
  }

  if (preferredGroupKey) {
    const role = groupRoleMap.get(preferredGroupKey);
    if (role === 'background' || role === 'overlay') {
      return role;
    }
  }

  if (!backgroundSeedLayerId) {
    return 'overlay';
  }
  if (layerId === backgroundSeedLayerId) {
    return 'background';
  }

  const seedGroup = groupByLayerId.get(backgroundSeedLayerId);
  const candidateGroup = preferredGroupKey ?? groupByLayerId.get(layerId);
  if (seedGroup && candidateGroup && seedGroup === candidateGroup) {
    return 'background';
  }

  return 'overlay';
}
