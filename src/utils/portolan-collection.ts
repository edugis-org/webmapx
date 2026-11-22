/**
 * A Portolan collection read as a webmapx layer (docs/adr/0001-portolan-catalogs.md, step 1).
 *
 * Portolan (https://github.com/portolan-sdi/portolan-spec) is static STAC for cloud-native
 * geodata: one dataset per `collection.json`, its files as assets told apart by role —
 * `data` (GeoParquet or COG), `visual` (PMTiles), `style` (MapLibre GL v8, exactly one also
 * `default` when there are several), `thumbnail`. This module is pure: JSON in, plain objects
 * out, no fetching, so the rules can be tested on the spec's own reference catalog.
 *
 * What a layer is drawn from (`renderPath`) follows the spec's "use a `visual` asset if
 * present, otherwise render from source", with one guard of our own: rendering from source
 * means loading the whole GeoParquet into memory, which is only acceptable for a small file.
 * A large collection without a `visual` is not drawn at all rather than freezing the tab.
 */

/** Most rows a GeoParquet may have to be drawn from source (loaded whole as GeoJSON). */
export const MAX_SOURCE_ROWS = 50_000;
/** When the row count is not declared, the file size decides instead. */
export const MAX_SOURCE_BYTES = 25 * 1024 * 1024;

const STYLE_MEDIA_TYPES = ['application/vnd.mapbox.style+json', 'application/json'];
const PMTILES_MEDIA_TYPE = 'application/vnd.pmtiles';
const PARQUET_MEDIA_TYPE = 'application/vnd.apache.parquet';
const COG_MEDIA_TYPE = 'image/tiff';

/** URL wrappers webmapx reads as "this file, through a protocol" (same set as the config loader). */
const WRAPPER = /^(pmtiles|geoparquet|cog):\/\//;

export interface PortolanStyleRef {
  /** Asset key, e.g. `style-labeled`. */
  key: string;
  /** Human-readable name (the asset title, else the key). */
  title: string;
  /** Absolute URL of the style document. */
  href: string;
  isDefault: boolean;
}

export interface PortolanColumn {
  name: string;
  type?: string;
  description?: string;
}

export type PortolanRenderPath = 'tiles' | 'geoparquet' | 'raster' | 'none';

export interface PortolanCollectionInfo {
  url: string;
  id: string;
  title: string;
  description?: string;
  license?: string;
  /** One line for the map's attribution control. */
  attribution?: string;
  /** WGS84 [west, south, east, north]. */
  bbox?: [number, number, number, number];
  /** Style assets, the default first, then in document order. */
  styles: PortolanStyleRef[];
  /** The PMTiles derivative and the source-layer names it holds. */
  visual?: { href: string; layers: string[] };
  data?: { href: string; format: 'geoparquet' | 'parquet' | 'cog' | 'other'; size?: number };
  thumbnail?: string;
  columns: PortolanColumn[];
  rowCount?: number;
  renderPath: PortolanRenderPath;
  /** Why the collection cannot be drawn, when `renderPath` is `none` (or `raster`, not yet supported). */
  notDrawable?: string;
}

type Json = Record<string, unknown>;

const isRecord = (value: unknown): value is Json =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const str = (value: unknown): string | undefined =>
  typeof value === 'string' && value.length > 0 ? value : undefined;

/** True for a STAC Collection document (what a Portolan dataset is). */
export function isStacCollection(doc: unknown): doc is Json {
  return isRecord(doc) && doc.type === 'Collection' && isRecord(doc.assets);
}

/**
 * Resolves `href` against `base`, keeping a `pmtiles://`/`geoparquet://`/`cog://` wrapper around
 * the resolved file URL. `new URL` cannot do that itself: it reads the wrapper as the scheme and
 * leaves a relative path relative (`pmtiles://../x.pmtiles` stays as it is), or mangles an
 * absolute one (`pmtiles://https://a/x` becomes `pmtiles://https//a/x`).
 */
export function resolveWrappedUrl(href: string, base: string): string {
  const wrapper = WRAPPER.exec(href)?.[0];
  if (wrapper) return `${wrapper}${resolveWrappedUrl(href.slice(wrapper.length), base)}`;
  try {
    return new URL(href, base).toString().replace(/%7B([\w-]+)%7D/gi, '{$1}');
  } catch {
    return href;
  }
}

/** Only http(s) is ever fetched: hrefs come from catalog JSON, which is not ours. */
function fetchableUrl(href: unknown, base: string): string | undefined {
  const value = str(href);
  if (!value) return undefined;
  const resolved = resolveWrappedUrl(value, base);
  return /^https?:\/\//i.test(resolved) ? resolved : undefined;
}

function roles(asset: Json): string[] {
  return Array.isArray(asset.roles) ? asset.roles.filter((r): r is string => typeof r === 'string') : [];
}

function mediaType(asset: Json): string {
  return (str(asset.type) ?? '').split(';')[0].trim().toLowerCase();
}

function fullMediaType(asset: Json): string {
  return (str(asset.type) ?? '').toLowerCase();
}

/**
 * The collection's styles. The spec way is assets with role `style`; catalogs written before it
 * listed them in a `portolan:styles` manifest, which is read only for styles the asset scan did
 * not find (the rule portolan-browser applies, so half-migrated catalogs still render).
 */
export function collectionStyles(collection: Json, url: string): PortolanStyleRef[] {
  const assets = isRecord(collection.assets) ? collection.assets : {};
  const found: PortolanStyleRef[] = [];
  for (const [key, value] of Object.entries(assets)) {
    if (!isRecord(value) || !roles(value).includes('style')) continue;
    const type = mediaType(value);
    if (type && !STYLE_MEDIA_TYPES.includes(type)) continue;
    const href = fetchableUrl(value.href, url);
    if (!href) continue;
    found.push({ key, title: str(value.title) ?? key.replace(/^styles\//, ''), href, isDefault: roles(value).includes('default') });
  }

  const manifest = collection['portolan:styles'] ?? (isRecord(collection.properties) ? collection.properties['portolan:styles'] : undefined);
  if (Array.isArray(manifest)) {
    const seen = new Set(found.flatMap((s) => [s.key, s.href]));
    for (const entry of manifest) {
      const asset = typeof entry === 'string' && isRecord(assets[entry]) ? assets[entry] as Json : undefined;
      const href = asset ? fetchableUrl(asset.href, url) : isRecord(entry) ? fetchableUrl(entry.href, url) : undefined;
      const key = typeof entry === 'string' ? entry : isRecord(entry) ? str(entry.name) ?? href : undefined;
      if (!href || !key || seen.has(key) || seen.has(href) || seen.has(`styles/${key}`)) continue;
      seen.add(key).add(href);
      found.push({ key, title: str(asset?.title) ?? key, href, isDefault: false });
    }
  }

  // The default first. A collection with styles but no marker is either single-styled (the
  // spec: that one is the default) or in breach; either way the first one is the best guess.
  const index = found.findIndex((s) => s.isDefault);
  if (index > 0) found.unshift(...found.splice(index, 1));
  if (index < 0 && found.length > 0) found[0] = { ...found[0], isDefault: true };
  return found;
}

function collectionBbox(collection: Json): [number, number, number, number] | undefined {
  const extent = isRecord(collection.extent) ? collection.extent : undefined;
  const spatial = extent && isRecord(extent.spatial) ? extent.spatial : undefined;
  const first = Array.isArray(spatial?.bbox) ? spatial.bbox[0] : undefined;
  if (!Array.isArray(first) || !first.every((n) => typeof n === 'number' && Number.isFinite(n))) return undefined;
  if (first.length === 4) return first as [number, number, number, number];
  if (first.length === 6) return [first[0], first[1], first[3], first[4]];
  return undefined;
}

function collectionAttribution(collection: Json): string | undefined {
  const own = str(collection.attribution);
  const providers = Array.isArray(collection.providers) ? collection.providers.filter(isRecord) : [];
  const makers = providers
    .filter((p) => roles(p).some((r) => r === 'producer' || r === 'licensor'))
    .map((p) => str(p.name))
    .filter((name): name is string => !!name);
  const who = own ?? (makers.length > 0 ? [...new Set(makers)].join(' / ') : undefined);
  const license = str(collection.license);
  const licenseText = license && license !== 'other' && license !== 'proprietary' ? license : undefined;
  if (!who) return licenseText;
  return licenseText ? `© ${who}, ${licenseText}` : `© ${who}`;
}

function hasGeometryColumn(collection: Json, columns: PortolanColumn[]): boolean {
  if (str(collection['table:primary_geometry'])) return true;
  return columns.some((c) => /^geometry\b/i.test(c.type ?? ''));
}

/** Reads what a viewer needs from a collection document fetched from `url`. */
export function readPortolanCollection(collection: Json, url: string): PortolanCollectionInfo {
  const assets = isRecord(collection.assets) ? collection.assets : {};
  const entries = Object.entries(assets).filter((e): e is [string, Json] => isRecord(e[1]));
  const withRole = (role: string) => entries.find(([, a]) => roles(a).includes(role));

  const columns: PortolanColumn[] = Array.isArray(collection['table:columns'])
    ? collection['table:columns'].filter(isRecord).flatMap((c) => {
      const name = str(c.name);
      return name ? [{ name, type: str(c.type), description: str(c.description) }] : [];
    })
    : [];
  const rowCount = typeof collection['table:row_count'] === 'number' ? collection['table:row_count'] : undefined;

  // `visual`: the PMTiles derivative. Its layer names come from the `rel: pmtiles` link.
  let visual: PortolanCollectionInfo['visual'];
  const visualAsset = entries.find(([, a]) => roles(a).includes('visual') && mediaType(a) === PMTILES_MEDIA_TYPE);
  const visualHref = visualAsset ? fetchableUrl(visualAsset[1].href, url) : undefined;
  if (visualHref) {
    const links = Array.isArray(collection.links) ? collection.links.filter(isRecord) : [];
    const pmtilesLink = links.find((l) => l.rel === 'pmtiles' && fetchableUrl(l.href, url) === visualHref)
      ?? links.find((l) => l.rel === 'pmtiles');
    const layers = Array.isArray(pmtilesLink?.['pmtiles:layers'])
      ? (pmtilesLink['pmtiles:layers'] as unknown[]).filter((n): n is string => typeof n === 'string')
      : [];
    visual = { href: visualHref, layers };
  }

  let data: PortolanCollectionInfo['data'];
  const dataAsset = withRole('data');
  const dataHref = dataAsset ? fetchableUrl(dataAsset[1].href, url) : undefined;
  if (dataAsset && dataHref) {
    const type = mediaType(dataAsset[1]);
    const format = type === PARQUET_MEDIA_TYPE
      ? (hasGeometryColumn(collection, columns) ? 'geoparquet' : 'parquet')
      : type === COG_MEDIA_TYPE && fullMediaType(dataAsset[1]).includes('geotiff') ? 'cog' : 'other';
    const size = typeof dataAsset[1]['file:size'] === 'number' ? dataAsset[1]['file:size'] as number : undefined;
    data = { href: dataHref, format, ...(size !== undefined ? { size } : {}) };
  }

  let renderPath: PortolanRenderPath = 'none';
  let notDrawable: string | undefined;
  if (visual) {
    renderPath = 'tiles';
  } else if (data?.format === 'geoparquet') {
    const small = rowCount !== undefined ? rowCount <= MAX_SOURCE_ROWS : (data.size ?? Infinity) <= MAX_SOURCE_BYTES;
    if (small) renderPath = 'geoparquet';
    else notDrawable = `too large to draw without map tiles (${rowCount !== undefined ? `${rowCount} rows` : 'size unknown'}); the collection has no PMTiles "visual" asset`;
  } else if (data?.format === 'cog') {
    renderPath = 'raster';
    notDrawable = 'raster (COG) collections are not supported yet';
  } else {
    notDrawable = data?.format === 'parquet' ? 'a table without geometry' : 'no drawable asset';
  }

  const thumbnailAsset = withRole('thumbnail');
  const thumbnail = thumbnailAsset ? fetchableUrl(thumbnailAsset[1].href, url) : undefined;
  const id = str(collection.id) ?? url;

  return {
    url,
    id,
    title: str(collection.title) ?? id,
    ...(str(collection.description) ? { description: str(collection.description) } : {}),
    ...(str(collection.license) ? { license: str(collection.license) } : {}),
    ...(collectionAttribution(collection) ? { attribution: collectionAttribution(collection) } : {}),
    ...(collectionBbox(collection) ? { bbox: collectionBbox(collection) } : {}),
    styles: collectionStyles(collection, url),
    ...(visual ? { visual } : {}),
    ...(data ? { data } : {}),
    ...(thumbnail ? { thumbnail } : {}),
    columns,
    ...(rowCount !== undefined ? { rowCount } : {}),
    renderPath,
    ...(notDrawable ? { notDrawable } : {}),
  };
}

/** Strips any wrapper and query, for comparing two references to one file. */
function fileKey(url: string): string {
  return url.replace(WRAPPER, '').split(/[?#]/)[0];
}

/** The source the collection's data is drawn from, in webmapx/MapLibre source form. */
function collectionSource(info: PortolanCollectionInfo): Json | null {
  // Attribution rides on the source: that is where every engine's attribution control reads it.
  const attribution = info.attribution ? { attribution: info.attribution } : {};
  if (info.renderPath === 'tiles' && info.visual) return { type: 'vector', url: `pmtiles://${info.visual.href}`, ...attribution };
  if (info.renderPath === 'geoparquet' && info.data) return { type: 'geojson', data: `geoparquet://${info.data.href}`, ...attribution };
  return null;
}

/**
 * Binds a style document to the collection's own data. A Portolan style names its source
 * relative to the style file (`pmtiles://../x.pmtiles`), and a style for a render-from-source
 * collection points a `vector` source at the `.parquet` file — not something MapLibre can
 * read. Every source that refers to one of the collection's files (or to nothing) is
 * therefore replaced by the collection's drawable source; other sources (a basemap the style
 * leans on) are kept, resolved against the style URL.
 */
export function bindStyleToCollection(style: Json, styleUrl: string, info: PortolanCollectionInfo): Json | null {
  const own = collectionSource(info);
  if (!own) return null;
  const ownFiles = new Set([info.visual?.href, info.data?.href].filter((h): h is string => !!h).map(fileKey));
  const sources = isRecord(style.sources) ? style.sources : {};
  const bound: Json = {};
  for (const [id, value] of Object.entries(sources)) {
    if (!isRecord(value)) continue;
    const ref = str(value.url) ?? str(value.data) ?? (Array.isArray(value.tiles) ? str(value.tiles[0]) : undefined);
    const resolved = ref ? resolveWrappedUrl(ref, styleUrl) : undefined;
    if (!resolved || ownFiles.has(fileKey(resolved))) {
      bound[id] = { ...own };
      continue;
    }
    const copy: Json = { ...value };
    if (str(value.url)) copy.url = resolveWrappedUrl(value.url as string, styleUrl);
    if (str(value.data)) copy.data = resolveWrappedUrl(value.data as string, styleUrl);
    if (Array.isArray(value.tiles)) copy.tiles = value.tiles.map((t) => (typeof t === 'string' ? resolveWrappedUrl(t, styleUrl) : t));
    bound[id] = copy;
  }
  const layers = Array.isArray(style.layers) ? style.layers.filter(isRecord) : [];
  // A layer drawing from the collection's GeoJSON must not keep a `source-layer`: a GeoJSON
  // source has none, and MapLibre then draws nothing.
  const geojsonSources = new Set(Object.entries(bound).filter(([, s]) => isRecord(s) && s.type === 'geojson').map(([id]) => id));
  const boundLayers = layers.map((layer) => {
    if (typeof layer.source === 'string' && geojsonSources.has(layer.source) && 'source-layer' in layer) {
      const { 'source-layer': _dropped, ...rest } = layer;
      return rest;
    }
    return layer;
  });
  return {
    ...style,
    sources: bound,
    layers: boundLayers,
    ...(str(style.glyphs) ? { glyphs: resolveWrappedUrl(style.glyphs as string, styleUrl) } : {}),
    ...(str(style.sprite) ? { sprite: resolveWrappedUrl(style.sprite as string, styleUrl) } : {}),
  };
}

/**
 * A style for a collection that ships none (the spec requires one, but a reader should not
 * show nothing for a collection that breaks that rule). One fill, line and circle layer per
 * source layer, each filtered on geometry type and without paint, so webmapx's unstyled look
 * (`default-paint.ts`) applies.
 */
export function fallbackStyle(info: PortolanCollectionInfo): Json | null {
  const own = collectionSource(info);
  if (!own) return null;
  const sourceLayers: (string | undefined)[] = own.type === 'vector'
    ? (info.visual?.layers.length ? info.visual.layers : [info.id.split('/').pop()])
    : [undefined];
  const kinds: [string, string[]][] = [
    ['fill', ['Polygon', 'MultiPolygon']],
    ['line', ['LineString', 'MultiLineString']],
    ['circle', ['Point', 'MultiPoint']],
  ];
  const layers = sourceLayers.flatMap((sourceLayer) => kinds.map(([type, geometries]) => ({
    id: `${sourceLayer ?? 'data'}-${type}`,
    type,
    source: 'data',
    ...(sourceLayer ? { 'source-layer': sourceLayer } : {}),
    filter: ['in', ['geometry-type'], ['literal', geometries]],
  })));
  return { version: 8, sources: { data: own }, layers };
}

/** Layer metadata webmapx keeps for a Portolan layer: what later steps (style picker, table) need. */
export function portolanLayerMetadata(info: PortolanCollectionInfo, style?: PortolanStyleRef): Json {
  return {
    ...(info.description ? { abstract: info.description } : {}),
    ...(info.bbox ? { bounds: info.bbox } : {}),
    ...(info.rowCount !== undefined ? { featureCount: info.rowCount } : {}),
    portolan: {
      collectionUrl: info.url,
      ...(style ? { style: style.key } : {}),
      styles: info.styles.map(({ key, title, isDefault }) => ({ key, title, isDefault })),
      ...(info.data ? { data: info.data.href, dataFormat: info.data.format } : {}),
      ...(info.visual ? { visual: info.visual.href } : {}),
      ...(info.thumbnail ? { thumbnail: info.thumbnail } : {}),
      ...(info.license ? { license: info.license } : {}),
      columns: info.columns,
    },
  };
}
