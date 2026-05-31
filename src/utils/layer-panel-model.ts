import type { AnyLayerConfig, LayerDataConfig } from '../config/types';

export interface LayerPanelItem {
  layerId: string;
  label: string;
  topLevelGroup: string | null;
}

export interface LayerPanelSections {
  background: LayerPanelItem[];
  overview: LayerPanelItem[];
}

function getLayerMetadata(layer: AnyLayerConfig): Record<string, unknown> | null {
  if (!layer?.metadata || typeof layer.metadata !== 'object') {
    return null;
  }
  return layer.metadata as Record<string, unknown>;
}

function getLayerLabel(layer: AnyLayerConfig): string {
  const metadata = getLayerMetadata(layer);
  const metadataTitle =
    (typeof metadata?.title === 'string' ? metadata.title : null)
    ?? (typeof metadata?.['webmapx:title'] === 'string' ? (metadata['webmapx:title'] as string) : null)
    ?? (typeof metadata?.label === 'string' ? metadata.label : null);

  return metadataTitle ?? layer.title ?? layer.id;
}

function getLayerGroup(layer: AnyLayerConfig): string | null {
  const metadata = getLayerMetadata(layer);
  const group =
    (typeof metadata?.group === 'string' ? metadata.group : null)
    ?? (typeof metadata?.['webmapx:group'] === 'string' ? (metadata['webmapx:group'] as string) : null);

  return typeof group === 'string' && group.length > 0 ? group : null;
}

function getLayerLegendRole(layer: AnyLayerConfig): 'background' | 'overlay' | null {
  const metadata = getLayerMetadata(layer);
  return metadata?.legendRole === 'background' || metadata?.legendRole === 'overlay'
    ? metadata.legendRole
    : null;
}

function normalizeGroupLabel(label: string | null | undefined): string | null {
  return label ? label.trim().toLowerCase() : null;
}

export function buildLayerPanelSections(
  layerData: LayerDataConfig | undefined,
  visibleLayerIds: string[],
  backgroundGroupLabel = 'Base Maps',
): LayerPanelSections {
  if (!layerData || visibleLayerIds.length === 0) {
    return { background: [], overview: [] };
  }

  const layersById = new Map<string, AnyLayerConfig>(layerData.layers.map((layer) => [layer.id, layer]));
  const backgroundGroup = normalizeGroupLabel(backgroundGroupLabel);
  const orderedIds = [...visibleLayerIds].reverse();
  const sections: LayerPanelSections = { background: [], overview: [] };

  for (const layerId of orderedIds) {
    const layer = layersById.get(layerId);
    if (!layer) {
      continue;
    }

    const item: LayerPanelItem = {
      layerId,
      label: getLayerLabel(layer),
      topLevelGroup: getLayerGroup(layer),
    };

    const legendRole = getLayerLegendRole(layer);

    if (legendRole === 'background' || normalizeGroupLabel(item.topLevelGroup) === backgroundGroup) {
      sections.background.push(item);
    } else {
      sections.overview.push(item);
    }
  }

  return sections;
}
