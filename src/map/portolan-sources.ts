/**
 * `portolan://<collection.json>` as a source URL (docs/adr/0001-portolan-catalogs.md).
 *
 * The `pmtiles://` convention, one level up: the URL names a Portolan collection,
 * and the source is whatever that collection currently draws from. Publishers put
 * a content hash in every data file name (a CDN must never mix byte ranges of two
 * PMTiles versions) and serve collection.json uncached, so a config naming the
 * collection keeps working through every republication, while a config naming
 * the PMTiles would break at the first one.
 *
 * Resolved here, in generic code before any engine sees the source, the way
 * `geoparquet://` is: an engine only ever receives `pmtiles://…` (or, for a small
 * collection without tiles, a GeoJSON source the GeoJSON loader then reads from
 * `geoparquet://…`).
 */
import { readPortolanCollection, isStacCollection, ownStyleLayers, type PortolanCollectionInfo } from '../utils/portolan-collection';

export const PORTOLAN_PREFIX = 'portolan://';

/** The collection URL inside `portolan://`, without a `#style` fragment. */
export function portolanTarget(url: string): { collectionUrl: string; styleKey?: string } | null {
  if (!url.startsWith(PORTOLAN_PREFIX)) return null;
  const inner = url.slice(PORTOLAN_PREFIX.length);
  const hash = inner.indexOf('#');
  const collectionUrl = hash >= 0 ? inner.slice(0, hash) : inner;
  const styleKey = hash >= 0 ? decodeURIComponent(inner.slice(hash + 1)) : undefined;
  return /^https?:\/\//i.test(collectionUrl) ? { collectionUrl, ...(styleKey ? { styleKey } : {}) } : null;
}

const cache = new Map<string, Promise<{ collection: Record<string, unknown>; info: PortolanCollectionInfo }>>();

/**
 * Reads a collection once per page. A failed read is not remembered: a slow CDN
 * at one moment must not make the layer unavailable for the rest of the session.
 */
export function loadPortolanCollection(collectionUrl: string): Promise<{ collection: Record<string, unknown>; info: PortolanCollectionInfo }> {
  let promise = cache.get(collectionUrl);
  if (!promise) {
    promise = (async () => {
      const response = await fetch(collectionUrl);
      if (!response.ok) throw new Error(`HTTP ${response.status} reading ${collectionUrl}`);
      const collection = await response.json();
      if (!isStacCollection(collection)) throw new Error(`${collectionUrl} is not a STAC Collection`);
      return { collection, info: readPortolanCollection(collection, collectionUrl) };
    })();
    cache.set(collectionUrl, promise);
    promise.catch(() => { if (cache.get(collectionUrl) === promise) cache.delete(collectionUrl); });
  }
  return promise;
}

/**
 * Replaces every `portolan://` source with one for the collection's current data:
 * `{ type: 'vector', url: 'pmtiles://…' }`, or for a small collection without
 * tiles `{ type: 'geojson', data: 'geoparquet://…' }`. The collection's
 * attribution is added unless the config gave one. A collection that cannot be
 * drawn (too large without tiles, a raster, a table) leaves the source as it is
 * and says why — the layer then fails as any layer with a bad source does.
 */
export async function resolvePortolanSources(sources: Record<string, any>): Promise<void> {
  // Each source is replaced by a copy rather than edited: the object may be the
  // config's own, and a config saved after the map loaded must still say
  // portolan:// — the hashed file name it resolves to today is gone tomorrow.
  const pending = Object.entries(sources).filter(([, s]) => s && typeof s.url === 'string' && s.url.startsWith(PORTOLAN_PREFIX));
  await Promise.all(pending.map(async ([key, original]) => {
    const s: Record<string, any> = { ...original };
    const target = portolanTarget(s.url);
    if (!target) {
      console.warn(`[webmapx] ${s.url}: portolan:// needs an absolute http(s) collection URL`);
      return;
    }
    let info: PortolanCollectionInfo;
    try {
      ({ info } = await loadPortolanCollection(target.collectionUrl));
    } catch (error) {
      console.warn(`[webmapx] Portolan collection ${target.collectionUrl} could not be read: ${(error as Error).message}`);
      return;
    }
    const attribution = typeof s.attribution === 'string' && s.attribution ? s.attribution : info.attribution;
    s.portolanCollection = target.collectionUrl;
    if (info.renderPath === 'tiles' && info.visual) {
      s.type = 'vector';
      s.url = `pmtiles://${info.visual.href}`;
    } else if (info.renderPath === 'geoparquet' && info.data) {
      s.type = 'geojson';
      delete s.url;
      s.data = `geoparquet://${info.data.href}`;
    } else {
      console.warn(`[webmapx] Portolan collection ${target.collectionUrl} cannot be drawn: ${info.notDrawable ?? 'unknown reason'}`);
      return;
    }
    if (attribution) s.attribution = attribution;
    sources[key] = s;
  }));
}

/**
 * What a config needs to draw a collection in a style of its own: a source naming the
 * collection and a copy of one of its styles (the default unless `styleKey` names another)
 * drawing from that source. Used by setup's "own style" choice; the copy is a starting
 * point for the author, not a link — a later change to the publisher's style is not seen.
 */
export async function portolanOwnStyle(collectionUrl: string, sourceId: string, styleKey?: string): Promise<{
  source: { type: 'vector'; url: string };
  layers: Record<string, unknown>[];
  dropped: number;
  info: PortolanCollectionInfo;
  styleTitle?: string;
}> {
  const { info } = await loadPortolanCollection(collectionUrl);
  if (info.renderPath !== 'tiles' && info.renderPath !== 'geoparquet') {
    throw new Error(info.notDrawable ?? 'this collection cannot be drawn');
  }
  const ref = (styleKey ? info.styles.find((s) => s.key === styleKey) : undefined) ?? info.styles[0];
  let style: { doc: Record<string, unknown>; url: string } | null = null;
  if (ref) {
    const response = await fetch(ref.href);
    if (!response.ok) throw new Error(`HTTP ${response.status} reading style ${ref.href}`);
    style = { doc: await response.json(), url: ref.href };
  }
  const own = ownStyleLayers(info, sourceId, style);
  if (!own || own.layers.length === 0) throw new Error('its style has no layers for this collection');
  return { source: { type: 'vector', url: `${PORTOLAN_PREFIX}${collectionUrl}` }, ...own, info, styleTitle: ref?.title };
}
