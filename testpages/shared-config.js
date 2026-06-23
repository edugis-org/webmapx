// Shared base configs for testpages. Import in test HTML files.

export const OSM_SOURCE = {
  type: 'raster',
  service: 'xyz',
  url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
  tileSize: 256,
  attribution: '&copy; OpenStreetMap contributors',
  maxzoom: 19
};

export const OSM_LAYER = { id: 'osm', type: 'raster', source: 'osm-source', title: 'OpenStreetMap' };

// Edugis/NextZen terrain-rgb (terrarium encoding) — no API key needed
export const TERRAIN_SOURCE = {
  type: 'raster-dem',
  tiles: [
    'https://t1.edugis.nl/mapproxy/nextzenelevation/wmts/nextzenelevation/webmercator/{z}/{x}/{y}.png',
    'https://t2.edugis.nl/mapproxy/nextzenelevation/wmts/nextzenelevation/webmercator/{z}/{x}/{y}.png',
    'https://t3.edugis.nl/mapproxy/nextzenelevation/wmts/nextzenelevation/webmercator/{z}/{x}/{y}.png',
    'https://t4.edugis.nl/mapproxy/nextzenelevation/wmts/nextzenelevation/webmercator/{z}/{x}/{y}.png'
  ],
  tileSize: 256,
  encoding: 'terrarium',
  maxzoom: 15,
  attribution: 'NextZen / EduGIS'
};

export const BASE_MAP = { center: [5, 52], zoom: 7 };

export const BASE_RUNTIME_MAP = { maxPitch: 85 };

export const BASE_LAYER_DATA = {
  sources: { 'osm-source': OSM_SOURCE },
  layers: { osm: OSM_LAYER }
};

export const BASE_LAYER_DATA_WITH_TERRAIN = {
  sources: { 'osm-source': OSM_SOURCE, 'terrain-source': TERRAIN_SOURCE },
  layers: { osm: OSM_LAYER }
};

export const BASE_STATE = { activeLayers: [{ ref: 'osm', visible: true }] };
