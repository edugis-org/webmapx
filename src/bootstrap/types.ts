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
  /**
   * URL the config object came from. Relative resource paths inside the config
   * (source `data`/`url`/`tiles`, story `htmlUrl`) are resolved against it, so a
   * config fetched from another origin keeps pointing at its own sibling files.
   * Ignored when `config` is a URL string — the fetch response URL is used then.
   * Defaults to the page URL for inline configs that have no file of their own.
   */
  configUrl?: string;
}
