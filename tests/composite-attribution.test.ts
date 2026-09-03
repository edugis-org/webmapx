/**
 * A layer the catalog never heard of still says where its data came from.
 *
 * A tool's output — an isochrone, a buffer, a geoprocessing result, a saved
 * search — is a composite `style` layer carrying its own sources, and it
 * outlives the panel that made it: it is saved, exported and shared, and by
 * then nothing else on the map says which service produced it.
 *
 * Two lookups have to agree for that credit to appear, and neither is obvious
 * from the layer it is written on. The attribution control has only
 * `store.mapLayers[id].sourceId` for a runtime layer, and that id is derived
 * from the *first* geojson source the layer declares; the info dialog resolves
 * the layer config instead, which used to look for the source id in the map of
 * top-level catalog sources — where a self-contained layer's sources are not.
 *
 * The isochrone tool is the worked example throughout, because it is what
 * exposed both.
 */
import test from 'node:test';
import assert from 'node:assert/strict';

import { readFileSync } from 'node:fs';
import path from 'node:path';

import { registerMapLayer } from '../src/map/map-layer-registry';
import { MapStateStore } from '../src/store/map-state-store';
import { resolveLayerAttribution } from '../src/utils/attribution-format';
import type { AnyLayerConfig, SourceConfig } from '../src/config/types';

const ATTRIBUTION = 'openrouteservice.org by HeiGIT | &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap contributors</a>';

/** The shape `webmapx-isochrone-tool` dispatches, reduced to what carries the credit. */
function isochroneLayer(): Record<string, unknown> {
    return {
        id: 'webmapx-iso-1',
        type: 'style',
        attribution: ATTRIBUTION,
        metadata: { label: 'Isochrone Car · 10, 20 min', legendRole: 'overlay' },
        sources: {
            polygons: { type: 'geojson', data: { type: 'FeatureCollection', features: [] }, attribution: ATTRIBUTION },
            center: { type: 'geojson', data: { type: 'FeatureCollection', features: [] } },
        },
        layers: [
            { id: 'webmapx-iso-1-fill', type: 'fill', source: 'polygons' },
            { id: 'webmapx-iso-1-circle', type: 'circle', source: 'center' },
        ],
    };
}

test('the layer registers the polygons source, which is the one carrying the credit', () => {
    const store = new MapStateStore();
    registerMapLayer(store, isochroneLayer());

    const entry = store.getState().mapLayers!['webmapx-iso-1'] as Record<string, unknown>;
    // `${layerId}:${key}` is the id the adapter registers a composite source
    // under, so this is what getSourceAttribution can be asked about.
    assert.equal(entry.sourceId, 'webmapx-iso-1:polygons');
});

test('the credit is on the polygons, not on the centre the user clicked', () => {
    const layer = isochroneLayer();
    const sources = layer.sources as Record<string, { attribution?: string }>;
    assert.equal(sources.polygons.attribution, ATTRIBUTION);
    assert.equal(sources.center.attribution, undefined);

    // Order matters as much as presence: registerMapLayer takes the first
    // geojson source it meets, so an unattributed source declared first would
    // silently take the layer's sourceId and the credit would never be found.
    assert.equal(Object.keys(sources)[0], 'polygons');
});

test('a composite layer credits its own inline source, not only a catalog one', () => {
    // The shape every self-contained composite has — one source, declared on the
    // layer, attribution on the source. The map of top-level catalog sources is
    // empty here on purpose: that is what a tool-made layer looks like, and
    // looking only there is what used to lose the credit.
    const attribution = resolveLayerAttribution(
        {
            id: 'webmapx-iso-1',
            type: 'style',
            sources: { polygons: { type: 'geojson', data: { type: 'FeatureCollection', features: [] }, attribution: ATTRIBUTION } },
            layers: [{ id: 'webmapx-iso-1-fill', type: 'fill', source: 'polygons' }],
        } as unknown as AnyLayerConfig,
        new Map<string, SourceConfig>(),
    );
    assert.equal(attribution, ATTRIBUTION);
});

test('a catalog source still wins where the layer names one', () => {
    const attribution = resolveLayerAttribution(
        {
            id: 'catalog-composite',
            type: 'style',
            layers: [{ id: 'catalog-composite-fill', type: 'fill', source: 'shared' }],
        } as unknown as AnyLayerConfig,
        new Map<string, SourceConfig>([['shared', { id: 'shared', type: 'geojson', attribution: 'Catalog credit' } as unknown as SourceConfig]]),
    );
    assert.equal(attribution, 'Catalog credit');
});

test('the layer info dialog reads the same credit from the layer itself', () => {
    const attribution = resolveLayerAttribution(
        isochroneLayer() as unknown as AnyLayerConfig,
        new Map<string, SourceConfig>(),
    );
    assert.equal(attribution, ATTRIBUTION);
});

test('the data half is spelled exactly as a basemap spells it, so the two merge', () => {
    // The attribution control splits on `|` and drops a part it already shows,
    // comparing the text itself. Matching the shipped spelling character for
    // character is therefore the whole mechanism: `Data: &copy; …` would show
    // as a second line under an OSM basemap's own credit.
    const parts = ATTRIBUTION.split('|').map(part => part.trim());
    assert.equal(parts.length, 2);
    assert.match(parts[0], /openrouteservice/i);

    const basemapCredit = JSON.parse(
        readFileSync(path.join(process.cwd(), 'public/config/docs/tools/isochrone.json'), 'utf8'),
    ).layerData.sources.find((source: { id: string }) => source.id === 'osm-source').attribution;
    assert.equal(parts[1], basemapCredit);
});
