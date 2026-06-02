import test from 'node:test';
import assert from 'node:assert/strict';

import { buildLayerPanelSections } from '../src/utils/layer-panel-model';
import type { CatalogConfig } from '../src/config/types';

const catalog: CatalogConfig = {
  label: 'Demo',
  tree: [],
  sources: [],
  layers: [
    {
      id: 'osm', type: 'raster' as const, source: 'osm-source',
      metadata: { title: 'OpenStreetMap', legendRole: 'background', group: 'Base Maps' },
    },
    {
      id: 'bluemarble', type: 'raster' as const, source: 'bluemarble-source',
      metadata: { title: 'Blue Marble', legendRole: 'background', group: 'Base Maps' },
    },
    {
      id: 'transport', type: 'line' as const, source: 'transport-source',
      metadata: { title: 'Transport Network', group: 'Data Layers' },
    },
    {
      id: 'air', type: 'circle' as const, source: 'air-source',
      metadata: { title: 'Air Quality', group: 'Data Layers' },
    },
  ],
};

test('buildLayerPanelSections splits visible layers into overview and background sections', () => {
  const sections = buildLayerPanelSections(catalog, ['osm', 'transport', 'air']);

  assert.deepEqual(sections.overview.map((item) => item.layerId), ['air', 'transport']);
  assert.deepEqual(sections.background.map((item) => item.layerId), ['osm']);
});

test('buildLayerPanelSections uses layer metadata labels and preserves top-first display order', () => {
  const sections = buildLayerPanelSections(catalog, ['bluemarble', 'transport']);

  assert.deepEqual(sections.overview, [
    { layerId: 'transport', label: 'Transport Network', topLevelGroup: 'Data Layers' },
  ]);
  assert.deepEqual(sections.background, [
    { layerId: 'bluemarble', label: 'Blue Marble', topLevelGroup: 'Base Maps' },
  ]);
});

test('buildLayerPanelSections supports custom background group labels', () => {
  const customCatalog: CatalogConfig = {
    ...catalog,
    layers: [
      {
        id: 'osm', type: 'raster' as const, source: 'osm-source',
        metadata: { title: 'OpenStreetMap', group: 'Background' },
      },
      {
        id: 'transport', type: 'line' as const, source: 'transport-source',
        metadata: { title: 'Transport Network', group: 'Overview' },
      },
    ],
  };

  const sections = buildLayerPanelSections(customCatalog, ['osm', 'transport'], 'Background');
  assert.deepEqual(sections.background.map((item) => item.layerId), ['osm']);
  assert.deepEqual(sections.overview.map((item) => item.layerId), ['transport']);
});
