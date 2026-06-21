export interface WebMapXConfig {
  engine?: 'maplibre' | 'openlayers' | 'leaflet' | 'cesium';
  locale?: string;
  tools?: string[];
  plugins?: string[];
  map?: Record<string, unknown>;
  datacatalog?: unknown[];
  [key: string]: unknown;
}

export interface WebMapXMountOptions {
  config: string | WebMapXConfig;
}
