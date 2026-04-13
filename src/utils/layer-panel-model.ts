import type { CatalogConfig, TreeNodeConfig } from '../config/types';

export interface LayerPanelItem {
  layerId: string;
  label: string;
  topLevelGroup: string | null;
}

export interface LayerPanelSections {
  background: LayerPanelItem[];
  overview: LayerPanelItem[];
}

interface LayerTreeIndexEntry {
  label: string;
  topLevelGroup: string | null;
}

function indexTreeNodes(
  nodes: TreeNodeConfig[],
  topLevelGroup: string | null,
  index: Map<string, LayerTreeIndexEntry>,
): void {
  for (const node of nodes) {
    const group = topLevelGroup ?? node.label;
    if (node.layerId) {
      index.set(node.layerId, {
        label: node.label,
        topLevelGroup,
      });
    }
    if (node.children?.length) {
      indexTreeNodes(node.children, group, index);
    }
  }
}

function buildLayerTreeIndex(catalog: CatalogConfig): Map<string, LayerTreeIndexEntry> {
  const index = new Map<string, LayerTreeIndexEntry>();
  for (const node of catalog.tree) {
    if (node.layerId) {
      index.set(node.layerId, { label: node.label, topLevelGroup: null });
      continue;
    }
    if (node.children?.length) {
      indexTreeNodes(node.children, node.label, index);
    }
  }
  return index;
}

function normalizeGroupLabel(label: string | null | undefined): string | null {
  return label ? label.trim().toLowerCase() : null;
}

export function buildLayerPanelSections(
  catalog: CatalogConfig | undefined,
  visibleLayerIds: string[],
  backgroundGroupLabel = 'Base Maps',
): LayerPanelSections {
  if (!catalog || visibleLayerIds.length === 0) {
    return { background: [], overview: [] };
  }

  const treeIndex = buildLayerTreeIndex(catalog);
  const backgroundGroup = normalizeGroupLabel(backgroundGroupLabel);
  const orderedIds = [...visibleLayerIds].reverse();
  const sections: LayerPanelSections = { background: [], overview: [] };

  for (const layerId of orderedIds) {
    const indexed = treeIndex.get(layerId);
    const fallbackLayer = catalog.layers.find((layer) => layer.id === layerId);
    if (!indexed && !fallbackLayer) {
      continue;
    }

    const item: LayerPanelItem = {
      layerId,
      label: indexed?.label ?? fallbackLayer?.id ?? layerId,
      topLevelGroup: indexed?.topLevelGroup ?? null,
    };

    if (normalizeGroupLabel(item.topLevelGroup) === backgroundGroup) {
      sections.background.push(item);
    } else {
      sections.overview.push(item);
    }
  }

  return sections;
}
