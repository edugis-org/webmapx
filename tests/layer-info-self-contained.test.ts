import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';

// Architecture contract: per-layer info shown in the legend (title, abstract,
// attribution, feature summary) must come ONLY from store.mapLayers[layerId]
// — populated by registerMapLayer() from the `layer` object passed to
// adapter.addLayer(). Discovered/inline layers (e.g. "Add layer from URL")
// have no entry in layerDataConfig/catalogConfig, so any reintroduced lookup
// of those configs in the layer-info path would silently break them.
test('webmapx-layer-overview does not read catalogConfig/layerDataConfig for layer info', () => {
    const file = path.resolve(process.cwd(), 'src/components/webmapx-layer-overview.ts');
    const src = readFileSync(file, 'utf8');

    for (const forbidden of ['catalogConfig', 'layerDataConfig', 'findLayerConfig', 'resolveLayerAttribution']) {
        assert.ok(
            !src.includes(forbidden),
            `webmapx-layer-overview.ts must not reference "${forbidden}" — layer info must come from store.mapLayers[layerId] only (see registerMapLayer)`,
        );
    }
});
