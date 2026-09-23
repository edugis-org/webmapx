// Builds a WMS GetMap URL as a style-spec raster `tiles` template.
//
// There is one output form, not one per engine: webmapx's shared layer format
// is the MapLibre style spec, whose tile templates spell the tile's extent
// `{bbox-epsg-3857}` and give the image size as a number. An engine that
// needs another spelling translates it in its own layer service.

export interface WMSGetMapParams {
  baseUrl: string; // e.g. 'https://example.com/wms'
  layers: string;
  version?: string;
  styles?: string;
  format?: string;
  transparent?: boolean;
  crs?: string;
  tileSize?: number;
  extraParams?: Record<string, string>;
}

// Case-insensitive map that preserves original key casing
class CaseInsensitiveMap {
  private values: Map<string, string> = new Map();
  private originalKeys: Map<string, string> = new Map(); // lowercase -> original

  set(key: string, value: string): void {
    const lower = key.toLowerCase();
    // Keep original key casing if already set, otherwise use new key
    if (!this.originalKeys.has(lower)) {
      this.originalKeys.set(lower, key);
    }
    this.values.set(lower, value);
  }

  get(key: string): string | undefined {
    return this.values.get(key.toLowerCase());
  }

  has(key: string): boolean {
    return this.values.has(key.toLowerCase());
  }

  getOriginalKey(key: string): string {
    return this.originalKeys.get(key.toLowerCase()) || key;
  }

  entries(): [string, string][] {
    const result: [string, string][] = [];
    for (const [lower, value] of this.values) {
      const originalKey = this.originalKeys.get(lower) || lower;
      result.push([originalKey, value]);
    }
    return result;
  }
}

/**
 * Builds a WMS GetMap URL template in style-spec form: `bbox={bbox-epsg-3857}`
 * and `width`/`height` set to the tile size.
 */
export function buildWMSGetMapUrl(params: WMSGetMapParams): string {
  const {
    baseUrl,
    layers,
    version = '1.3.0',
    styles = '',
    format = 'image/png',
    transparent = true,
    crs = 'EPSG:3857',
    tileSize = 256,
    extraParams = {}
  } = params;

  // Parse the base URL
  let urlObj: URL;
  try {
    urlObj = new URL(baseUrl, window?.location?.origin || 'http://localhost');
  } catch {
    // Fallback for non-absolute URLs
    const anchor = document.createElement('a');
    anchor.href = baseUrl;
    urlObj = new URL(anchor.href, window?.location?.origin || 'http://localhost');
  }

  // Collect all parameters preserving original case
  const paramMap = new CaseInsensitiveMap();

  // First, add all existing URL parameters (preserves their original casing)
  urlObj.searchParams.forEach((value, key) => {
    paramMap.set(key, value);
  });

  // Add extraParams (preserves their casing, won't overwrite existing key casing)
  for (const [key, value] of Object.entries(extraParams)) {
    paramMap.set(key, value);
  }

  // Add default WMS parameters only if not already present
  if (!paramMap.has('service')) paramMap.set('service', 'WMS');
  if (!paramMap.has('request')) paramMap.set('request', 'GetMap');
  if (!paramMap.has('version')) paramMap.set('version', version);
  if (!paramMap.has('layers')) paramMap.set('layers', layers);
  if (!paramMap.has('styles')) paramMap.set('styles', styles);
  if (!paramMap.has('format')) paramMap.set('format', format);
  if (!paramMap.has('transparent')) paramMap.set('transparent', transparent ? 'TRUE' : 'FALSE');

  // CRS/SRS handling based on WMS version
  const wmsVersion = paramMap.get('version') || version;
  const useCRS = isVersion130OrHigher(wmsVersion);

  if (!paramMap.has('crs') && !paramMap.has('srs')) {
    paramMap.set(useCRS ? 'crs' : 'srs', crs);
  }

  paramMap.set('bbox', '{bbox-epsg-3857}');
  if (!paramMap.has('width')) paramMap.set('width', String(tileSize));
  if (!paramMap.has('height')) paramMap.set('height', String(tileSize));

  // Build the query string
  const queryParts = paramMap.entries().map(([key, value]) => {
    // Don't encode placeholders (values containing { and })
    if (value.includes('{') && value.includes('}')) {
      return `${key}=${value}`;
    }
    return `${key}=${encodeURIComponent(value)}`;
  });

  // Build final URL (strip existing query string from base)
  const baseWithoutQuery = baseUrl.split('?')[0].replace(/[?&]+$/, '');
  return `${baseWithoutQuery}?${queryParts.join('&')}`;
}

function isVersion130OrHigher(version: string): boolean {
  const parts = version.trim().split('.').map(Number);
  if (parts.length >= 2) {
    if (parts[0] > 1) return true;
    if (parts[0] === 1 && parts[1] >= 3) return true;
  }
  return false;
}
