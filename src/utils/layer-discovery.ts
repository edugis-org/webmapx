// src/utils/layer-discovery.ts
// Given a URL (often copy-pasted from the browser devtools network tab),
// tries to discover what map services are available and returns ready-to-use
// webmapx source/layer config pairs.

import { WmsEndpoint, WmtsEndpoint, WfsEndpoint } from '@camptocamp/ogc-client';
import type { AnyLayerConfig, SourceConfig, StandardLayerConfig } from '../config/types';
import { buildWMSGetMapUrl } from './wms-url-builder';

// @camptocamp/ogc-client's WmtsEndpoint caches its capabilities-fetch promise
// by URL and resolves it via a Web Worker postMessage; if the service doesn't
// support WMTS, that cached promise rejects with "No service: ( WMTS )" on
// its own timeline — possibly well after discoverWmts's try/catch has
// returned — and surfaces as an unhandled rejection. We handle the same
// failure (return []) inside discoverWmts, so swallow only this exact,
// known-benign message globally.
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (e) => {
    if (e.reason?.name === 'ServiceExceptionError' && /No service:\s*\(\s*WMTS\s*\)/.test(String(e.reason?.message))) {
      e.preventDefault();
    }
  });
}

export interface DiscoveredLayer {
  /** Service kind this layer was discovered from. */
  serviceType: 'wms' | 'wmts' | 'wfs' | 'xyz' | 'esri-tile' | 'esri-feature';
  /** Human-readable title for the discovery dialog. */
  title: string;
  /** Optional descriptive text (e.g. WMS layer abstract), used for search/filter. */
  abstract?: string;
  source: SourceConfig;
  layer: AnyLayerConfig;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40) || 'layer';
}

function uniqueId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}`;
}

/** Strips the query string from a URL, returning just `${origin}${pathname}`. */
function stripQuery(url: string): string {
  return url.split('?')[0].split('#')[0];
}

/**
 * Builds a native MapLibre raster source spec (`tiles` array, not webmapx's
 * `service`/`url` shape). Discovered layers are injected via `adapter.addSource`
 * which passes the config straight to the engine, bypassing the
 * `service: 'xyz'|'wms'` -> `tiles` conversion that `MapLayerService` does for
 * config-driven sources — so the source here must already be engine-native.
 */
function rasterTilesSource(id: string, tiles: string[], extra: { tileSize?: number; attribution?: string; bounds?: [number, number, number, number]; service?: string; gfiUrl?: string; gfiLayers?: string; gfiVersion?: string } = {}): SourceConfig {
  return { id, type: 'raster', tiles, ...extra } as unknown as SourceConfig;
}

/** Coerces a bounding box (ogc-client sometimes returns string components) to numbers. */
function toNumberBounds(bbox: readonly unknown[] | undefined): [number, number, number, number] | undefined {
  if (!bbox || bbox.length !== 4) return undefined;
  const nums = bbox.map((v) => typeof v === 'number' ? v : parseFloat(String(v)));
  return nums.every(Number.isFinite) ? (nums as [number, number, number, number]) : undefined;
}

/** Converts a WMS scale denominator to an approximate web-mercator zoom level. */
function scaleDenominatorToZoom(scaleDenominator: number): number {
  if (!Number.isFinite(scaleDenominator) || scaleDenominator <= 0) return 0;
  const zoom = Math.log2(559082264.02867 / scaleDenominator);
  return Math.max(0, Math.round(zoom * 100) / 100);
}

/**
 * If the URL looks like an OSM/MapLibre-style XYZ tile request
 * (.../{z}/{x}/{y}.ext), returns a templated XYZ source for it.
 */
function detectXyzTile(url: string): DiscoveredLayer | null {
  const match = url.match(/^(.*\/)(\d+)\/(\d+)\/(\d+)(\.[a-z0-9]+)?(\?.*)?$/i);
  if (!match) return null;

  const [, prefix, , , , ext] = match;
  const template = `${prefix}{z}/{x}/{y}${ext ?? ''}`;
  const id = uniqueId('xyz');

  return {
    serviceType: 'xyz',
    title: `XYZ tiles (${prefix.replace(/^https?:\/\//, '')})`,
    source: rasterTilesSource(id, [template]),
    layer: { id, type: 'raster', source: id, title: 'XYZ tiles' },
  };
}

/**
 * If the URL is an Esri ".../tile/{z}/{y}/{x}" request, returns the
 * MapServer/ImageServer base and a templated XYZ source for the tile cache.
 */
function detectEsriTile(url: string): { base: string; layer: DiscoveredLayer } | null {
  const match = url.match(/^(.*\/(?:MapServer|ImageServer))\/tile\/\d+\/\d+\/\d+(\?.*)?$/i);
  if (!match) return null;

  const base = match[1];
  const template = `${base}/tile/{z}/{y}/{x}`;
  const id = uniqueId('esri-tile');

  return {
    base,
    layer: {
      serviceType: 'esri-tile',
      title: `Esri tile cache (${base.split('/').slice(-2).join('/')})`,
      source: rasterTilesSource(id, [template]),
      layer: { id, type: 'raster', source: id, title: 'Esri tile cache' },
    },
  };
}

/** Finds an Esri "/rest/services/.../{MapServer|FeatureServer|ImageServer}" base in a URL. */
function detectEsriServiceBase(url: string): string | null {
  const match = url.match(/^(.*\/rest\/services\/.*\/(?:MapServer|FeatureServer|ImageServer))/i);
  return match ? match[1] : null;
}

async function fetchJson(url: string): Promise<Record<string, unknown> | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

async function discoverWms(baseUrl: string): Promise<DiscoveredLayer[]> {
  try {
    const endpoint = await new WmsEndpoint(baseUrl).isReady();
    const info = endpoint.getServiceInfo();
    const layers = endpoint.getFlattenedLayers();
    const version = endpoint.getVersion();
    const results: DiscoveredLayer[] = [];

    for (const layer of layers) {
      if (!layer.name) continue;
      const id = uniqueId(`wms-${slugify(layer.name)}`);

      // getFlattenedLayers() returns summaries (name/title/abstract only); fetch
      // the full layer for bounds/scale limits where available.
      let full: { boundingBoxes?: Record<string, [number, number, number, number]>; minScaleDenominator?: number; maxScaleDenominator?: number; styles?: { legendUrl?: string }[]; queryable?: boolean } | null = null;
      try {
        full = endpoint.getLayerByName(layer.name);
      } catch {
        full = null;
      }

      const bounds = toNumberBounds(full?.boundingBoxes?.['EPSG:4326'] ?? full?.boundingBoxes?.['CRS:84']);
      const minzoom = typeof full?.maxScaleDenominator === 'number' ? scaleDenominatorToZoom(full.maxScaleDenominator) : undefined;
      const maxzoom = typeof full?.minScaleDenominator === 'number' ? scaleDenominatorToZoom(full.minScaleDenominator) : undefined;
      const legendurl = full?.styles?.find((s) => s.legendUrl)?.legendUrl;

      results.push({
        serviceType: 'wms',
        title: `${layer.title || layer.name} (WMS)`,
        ...(layer.abstract ? { abstract: layer.abstract } : {}),
        source: rasterTilesSource(id, [
          buildWMSGetMapUrl({
            baseUrl: stripQuery(endpoint.getOperationUrl('GetMap') || baseUrl),
            layers: layer.name,
            version,
          }, 'maplibre'),
        ], {
          ...(info?.title ? { attribution: info.title } : {}),
          ...(bounds ? { bounds } : {}),
          // GetFeatureInfo support: identified via service==='wms' by getVisibleWMSLayers,
          // and used by fetchWMSFeatureInfo to build the query URL independent of `tiles`.
          // Only set when the capabilities document marks the layer queryable. Note:
          // these are NOT named `url`/`layers`/`version` to avoid colliding with
          // MapLibre's raster source spec (an `url` key there triggers a TileJSON fetch).
          ...(full?.queryable ? {
            service: 'wms',
            gfiUrl: stripQuery(endpoint.getOperationUrl('GetFeatureInfo') || endpoint.getOperationUrl('GetMap') || baseUrl),
            gfiLayers: layer.name,
            gfiVersion: version,
          } : {}),
        }),
        layer: {
          id, type: 'raster', source: id, title: layer.title || layer.name,
          ...(minzoom !== undefined ? { minzoom } : {}),
          ...(maxzoom !== undefined ? { maxzoom } : {}),
          ...((layer.abstract || bounds || legendurl) ? { metadata: {
            ...(layer.abstract ? { abstract: layer.abstract } : {}),
            ...(bounds ? { bounds } : {}),
            ...(legendurl ? { legendurl } : {}),
          } } : {}),
        },
      });
    }

    return results;
  } catch {
    return [];
  }
}

async function discoverWmts(baseUrl: string): Promise<DiscoveredLayer[]> {
  try {
    const endpoint = await new WmtsEndpoint(baseUrl).isReady();
    const info = endpoint.getServiceInfo();
    const results: DiscoveredLayer[] = [];

    for (const layer of endpoint.getLayers()) {
      const matrixSetLink = layer.matrixSets[0];
      if (!matrixSetLink) continue;

      const tileUrl = endpoint.getTileUrl(
        layer.name,
        layer.defaultStyle,
        matrixSetLink.identifier,
        '{z}',
        '{y}' as unknown as number,
        '{x}' as unknown as number
      );
      if (!tileUrl) continue;

      // KVP encoding URL-encodes the {z}/{y}/{x} placeholders; restore them.
      const template = tileUrl.replace(/%7B/gi, '{').replace(/%7D/gi, '}');
      const id = uniqueId(`wmts-${slugify(layer.name)}`);

      const bounds = toNumberBounds(layer.latLonBoundingBox);

      results.push({
        serviceType: 'wmts',
        title: `${layer.name} (WMTS)`,
        source: rasterTilesSource(id, [template], {
          ...(info?.title ? { attribution: info.title } : {}),
          ...(bounds ? { bounds } : {}),
        }),
        layer: {
          id, type: 'raster', source: id, title: layer.name,
          ...(bounds ? { metadata: { bounds } } : {}),
        },
      });
    }

    return results;
  } catch {
    return [];
  }
}

async function discoverWfs(baseUrl: string): Promise<DiscoveredLayer[]> {
  try {
    const endpoint = await new WfsEndpoint(baseUrl).isReady();
    const featureTypes = endpoint.getFeatureTypes();
    const results: DiscoveredLayer[] = [];

    for (const ft of featureTypes) {
      if (!ft.name || !endpoint.supportsJson(ft.name)) continue;

      const id = uniqueId(`wfs-${slugify(ft.name)}`);
      const data = endpoint.getFeatureUrl(ft.name, { outputFormat: 'application/json', maxFeatures: 1000 })
        ?? endpoint.getFeatureUrl(ft.name);
      if (!data) continue;

      const bounds = toNumberBounds(ft.boundingBox);

      results.push({
        serviceType: 'wfs',
        title: `${ft.title || ft.name} (WFS)`,
        ...(ft.abstract ? { abstract: ft.abstract } : {}),
        source: { id, type: 'geojson', data, ...(bounds ? { bounds } : {}) } as unknown as SourceConfig,
        layer: {
          id, type: 'fill', source: id, title: ft.title || ft.name,
          ...((ft.abstract || bounds) ? { metadata: {
            ...(ft.abstract ? { abstract: ft.abstract } : {}),
            ...(bounds ? { bounds } : {}),
          } } : {}),
        },
      });
    }

    return results;
  } catch {
    return [];
  }
}

const ESRI_GEOMETRY_TO_LAYER_TYPE: Record<string, StandardLayerConfig['type']> = {
  esriGeometryPoint: 'circle',
  esriGeometryMultipoint: 'circle',
  esriGeometryPolyline: 'line',
  esriGeometryPolygon: 'fill',
};

async function discoverEsri(base: string): Promise<DiscoveredLayer[]> {
  const info = await fetchJson(`${base}?f=json`);
  if (!info) return [];

  const results: DiscoveredLayer[] = [];

  // Extent is only directly usable as WGS84 bounds when given in EPSG:4326/CRS84.
  const extentBounds = (extent: unknown): [number, number, number, number] | undefined => {
    const e = extent as Record<string, unknown> | undefined;
    const wkid = (e?.spatialReference as Record<string, unknown> | undefined)?.wkid;
    if (!e || (wkid !== 4326 && wkid !== 4269)) return undefined;
    const { xmin, ymin, xmax, ymax } = e as Record<string, number>;
    if (![xmin, ymin, xmax, ymax].every(Number.isFinite)) return undefined;
    return [xmin, ymin, xmax, ymax];
  };

  const serviceBounds = extentBounds(info.fullExtent);
  const serviceDescription = typeof info.description === 'string' && info.description ? info.description : undefined;

  // Tiled MapServer/ImageServer: offer the XYZ tile cache.
  if (info.tileInfo) {
    const id = uniqueId('esri-tile');
    const template = `${base}/tile/{z}/{y}/{x}`;
    results.push({
      serviceType: 'esri-tile',
      title: `${info.mapName || info.name || 'Esri'} tile cache`,
      ...(serviceDescription ? { abstract: serviceDescription } : {}),
      source: rasterTilesSource(id, [template], serviceBounds ? { bounds: serviceBounds } : {}),
      layer: {
        id, type: 'raster', source: id, title: String(info.mapName || info.name || 'Esri tile cache'),
        ...((serviceDescription || serviceBounds) ? { metadata: {
          ...(serviceDescription ? { abstract: serviceDescription } : {}),
          ...(serviceBounds ? { bounds: serviceBounds } : {}),
        } } : {}),
      },
    });
  }

  // Feature/map layers: offer each as a GeoJSON query layer.
  const layers = Array.isArray(info.layers) ? info.layers : [];
  for (const layerInfo of layers as Array<Record<string, unknown>>) {
    const layerId = layerInfo.id;
    const geometryType = typeof layerInfo.geometryType === 'string' ? layerInfo.geometryType : undefined;
    if (layerId === undefined || !geometryType || !(geometryType in ESRI_GEOMETRY_TO_LAYER_TYPE)) continue;

    const id = uniqueId(`esri-${slugify(String(layerInfo.name ?? layerId))}`);
    const data = `${base}/${layerId}/query?where=1%3D1&outFields=*&f=geojson&outSR=4326`;
    const bounds = extentBounds(layerInfo.extent) ?? serviceBounds;
    const abstract = typeof layerInfo.description === 'string' && layerInfo.description ? layerInfo.description : serviceDescription;
    const minzoom = typeof layerInfo.minScale === 'number' && layerInfo.minScale > 0 ? scaleDenominatorToZoom(layerInfo.minScale) : undefined;
    const maxzoom = typeof layerInfo.maxScale === 'number' && layerInfo.maxScale > 0 ? scaleDenominatorToZoom(layerInfo.maxScale) : undefined;

    results.push({
      serviceType: 'esri-feature',
      title: `${layerInfo.name ?? `Layer ${layerId}`} (Esri features)`,
      ...(abstract ? { abstract } : {}),
      source: { id, type: 'geojson', data, ...(bounds ? { bounds } : {}) } as unknown as SourceConfig,
      layer: {
        id, type: ESRI_GEOMETRY_TO_LAYER_TYPE[geometryType], source: id, title: String(layerInfo.name ?? `Layer ${layerId}`),
        ...(minzoom !== undefined ? { minzoom } : {}),
        ...(maxzoom !== undefined ? { maxzoom } : {}),
        ...((abstract || bounds) ? { metadata: {
          ...(abstract ? { abstract } : {}),
          ...(bounds ? { bounds } : {}),
        } } : {}),
      },
    });
  }

  return results;
}

/**
 * Probes a URL (typically copy-pasted from devtools) for available map
 * services, trying WMS, WMTS, Esri REST and plain XYZ tile patterns.
 * Returns all layers discovered across the services that responded.
 */
export async function discoverLayers(inputUrl: string): Promise<DiscoveredLayer[]> {
  const url = inputUrl.trim();
  if (!url) return [];

  const results: DiscoveredLayer[] = [];
  const probes: Promise<DiscoveredLayer[]>[] = [];

  const xyzTile = detectXyzTile(url);
  if (xyzTile) results.push(xyzTile);

  const esriTile = detectEsriTile(url);
  if (esriTile) results.push(esriTile.layer);

  const bare = stripQuery(url);
  probes.push(discoverWms(bare));
  probes.push(discoverWmts(bare));
  probes.push(discoverWfs(bare));

  const esriBase = detectEsriServiceBase(url) ?? (esriTile ? esriTile.base : null);
  if (esriBase) probes.push(discoverEsri(esriBase));

  const settled = await Promise.all(probes);
  for (const layers of settled) results.push(...layers);

  return rankByRequestedLayer(results, url);
}

/**
 * Promotes the layer(s) matching the `LAYERS`/`layer` query param of the
 * input URL (e.g. a WMS GetMap request) to the front of the results.
 */
function rankByRequestedLayer(results: DiscoveredLayer[], inputUrl: string): DiscoveredLayer[] {
  let params: URLSearchParams;
  try {
    params = new URL(inputUrl).searchParams;
  } catch {
    return results;
  }

  const requested = new Set<string>();
  for (const key of ['LAYERS', 'layers', 'LAYER', 'layer']) {
    const value = params.get(key);
    if (!value) continue;
    for (const name of value.split(',')) {
      const trimmed = name.trim();
      if (trimmed) requested.add(trimmed.toLowerCase());
    }
  }
  if (requested.size === 0) return results;

  // Layer ids are `${prefix}-${slugify(layerName)}-${rand}`; normalize the
  // requested name the same way and check it appears in the id.
  const requestedSlugs = new Set(Array.from(requested, slugify));

  const matches = (item: DiscoveredLayer): boolean => {
    const id = item.layer.id?.toLowerCase() ?? '';
    return Array.from(requested).some((r) => id === r) ||
      Array.from(requestedSlugs).some((slug) => id.includes(`-${slug}-`));
  };

  const front: DiscoveredLayer[] = [];
  const rest: DiscoveredLayer[] = [];
  for (const item of results) (matches(item) ? front : rest).push(item);
  return [...front, ...rest];
}
