import test from 'node:test';
import assert from 'node:assert/strict';

import { buildLayerPanelSections } from '../src/utils/layer-panel-model.ts';
import type { CatalogConfig } from '../src/config/types.ts';

const catalog: CatalogConfig = {
  label: 'Demo',
  tree: [
    {
      label: 'Base Maps',
      children: [
        { label: 'OpenStreetMap', layerId: 'osm' },
        { label: 'Blue Marble', layerId: 'bluemarble' },
      ],
    },
    {
      label: 'Data Layers',
      children: [
        { label: 'Transport Network', layerId: 'transport' },
        { label: 'Air Quality', layerId: 'air' },
      ],
    },
  ],
  sources: [],
  layers: [
    { id: 'osm', layerset: [{ type: 'raster', source: 'osm-source' }] },
    { id: 'bluemarble', layerset: [{ type: 'raster', source: 'bluemarble-source' }] },
    { id: 'transport', layerset: [{ type: 'line', source: 'transport-source' }] },
    { id: 'air', layerset: [{ type: 'circle', source: 'air-source' }] },
  ],
};

test('buildLayerPanelSections splits visible layers into overview and background sections', () => {
  const sections = buildLayerPanelSections(catalog, ['osm', 'transport', 'air']);

  assert.deepEqual(sections.overview.map((item) => item.layerId), ['air', 'transport']);
  assert.deepEqual(sections.background.map((item) => item.layerId), ['osm']);
});

test('buildLayerPanelSections uses tree labels and preserves top-first display order', () => {
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
    tree: [
      {
        label: 'Background',
        children: [{ label: 'OpenStreetMap', layerId: 'osm' }],
      },
      {
        label: 'Overview',
        children: [{ label: 'Transport Network', layerId: 'transport' }],
      },
    ],
  };

  const sections = buildLayerPanelSections(customCatalog, ['osm', 'transport'], 'Background');
  assert.deepEqual(sections.background.map((item) => item.layerId), ['osm']);
  assert.deepEqual(sections.overview.map((item) => item.layerId), ['transport']);
});
