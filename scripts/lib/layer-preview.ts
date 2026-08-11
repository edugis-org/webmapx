/**
 * BUILD-TIME ONLY — used by scripts/generate-layer-swatches.ts, never shipped
 * to the browser. Resolving these URLs at runtime would make listing layers
 * send requests to third-party tile hosts for layers the user never added.
 *
 * Resolves a small, real preview image for layers whose colour cannot be
 * derived from a paint spec — raster basemaps, remote vector styles, Allmaps
 * overlays. Those all fall back to a neutral hatch in `src/utils/layer-swatch.ts`,
 * which is honest but leaves most of a layer list looking grey and identical.
 *
 * The approach is to fetch ONE tile the layer would actually draw and use it as
 * the swatch background. At ~18px the tile is downscaled so far that it reads
 * as its own average colour, which is what a swatch wants — so this gets the
 * "average colour" result without a canvas, without CORS-tainted pixel
 * readback, and without a build step.
 *
 * Everything here fails soft: no template, a 404, a blocked host, or a layer
 * type we cannot preview all return null, and the caller keeps the hatch.
 */

/** Frankfurt am Main — mid-latitude, land, coastline and border nearby, so a
 *  world-scale tile here shows land, water and labels rather than open ocean. */
export const PREVIEW_ANCHOR = { lon: 8.6821, lat: 50.1109 };

/** Zoom for world-scale layers. Big enough to show structure, small enough
 *  that almost every layer has a tile at this level. */
export const PREVIEW_ZOOM = 6;

export interface TileCoord {
    z: number;
    x: number;
    y: number;
}

export type Bounds = [number, number, number, number];

/** Standard slippy-map projection of a lon/lat into tile indices. */
export function lonLatToTile(lon: number, lat: number, z: number): TileCoord {
    const n = 2 ** z;
    const latRad = (Math.max(-85.05112878, Math.min(85.05112878, lat)) * Math.PI) / 180;
    const x = Math.floor(((lon + 180) / 360) * n);
    const y = Math.floor(((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n);
    const clamp = (v: number) => Math.max(0, Math.min(n - 1, v));
    return { z, x: clamp(x), y: clamp(y) };
}

function boundsContain(b: Bounds, lon: number, lat: number): boolean {
    return lon >= b[0] && lon <= b[2] && lat >= b[1] && lat <= b[3];
}

/** Normalised (0..1) web-mercator Y of a latitude. */
function latToMercY(lat: number): number {
    const latRad = (Math.max(-85.05112878, Math.min(85.05112878, lat)) * Math.PI) / 180;
    return (1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2;
}

/**
 * Zoom at which one tile is comfortably *inside* the layer's extent.
 *
 * A tile at the world zoom is often far larger than a regional layer's bounds,
 * so the tile came back mostly blank with the data crammed into one corner
 * (AHN: a white tile with a thumbnail-sized Netherlands at the bottom right).
 * `floor(log2(1/span))` is the zoom whose tile just covers the extent. Go two
 * levels past it: a tile merely *smaller* than the extent can still straddle
 * an edge depending on where the tile grid falls, but at half the extent's
 * span some whole tile is guaranteed to sit inside it.
 */
export function fitZoomToBounds(b: Bounds): number {
    const spanX = Math.abs(b[2] - b[0]) / 360;
    const spanY = Math.abs(latToMercY(b[1]) - latToMercY(b[3]));
    const span = Math.max(spanX, spanY);
    if (!(span > 0)) return 22;
    return Math.floor(Math.log2(1 / span)) + 2;
}

/**
 * Shifts a tile onto the nearest one that lies wholly inside the extent.
 *
 * Zooming to fit sizes the tile right but says nothing about where the tile
 * grid falls: the tile holding the extent's centre can still hang over an
 * edge, which is how half a preview ends up as blank surround. When no tile at
 * this zoom fits (the extent is smaller than one tile), the centre tile stands.
 */
function nudgeTileInsideBounds(tile: TileCoord, b: Bounds): TileCoord {
    const n = 2 ** tile.z;
    const xOf = (lon: number) => ((lon + 180) / 360) * n;
    const yOf = (lat: number) => latToMercY(lat) * n;

    const clampAxis = (v: number, lo: number, hi: number): number => {
        const min = Math.ceil(lo);
        const max = Math.floor(hi) - 1;
        return max < min ? v : Math.max(min, Math.min(max, v));
    };

    return {
        z: tile.z,
        x: clampAxis(tile.x, xOf(b[0]), xOf(b[2])),
        // Tile Y grows southward, so the north edge is the lower index.
        y: clampAxis(tile.y, yOf(b[3]), yOf(b[1])),
    };
}

/** From this zoom on, a tile shows streets rather than regions. */
export const URBAN_ZOOM = 13;

/** Dense city centres, spread over the inhabited world. */
const URBAN_ANCHORS = [
    { lon: 4.895, lat: 52.372 },   // Amsterdam
    { lon: -0.1276, lat: 51.5072 }, // London
    { lon: 2.3522, lat: 48.8566 },  // Paris
    { lon: 13.405, lat: 52.52 },    // Berlin
    { lon: -74.006, lat: 40.7128 }, // New York
    { lon: -46.6333, lat: -23.5505 }, // São Paulo
    { lon: 77.209, lat: 28.6139 },  // Delhi
    { lon: 139.6917, lat: 35.6895 }, // Tokyo
    { lon: 3.3792, lat: 6.5244 },   // Lagos
    { lon: 151.2093, lat: -33.8688 }, // Sydney
];

/** The city inside the extent, nearest the point we would otherwise sample. */
function pickUrbanAnchor(bounds: Bounds | null | undefined, lon: number, lat: number) {
    const inRange = bounds && bounds.length === 4
        ? URBAN_ANCHORS.filter(a => boundsContain(bounds, a.lon, a.lat))
        : URBAN_ANCHORS;
    if (inRange.length === 0) return null;
    const dist = (a: { lon: number; lat: number }) => (a.lon - lon) ** 2 + (a.lat - lat) ** 2;
    return inRange.reduce((best, a) => (dist(a) < dist(best) ? a : best));
}

/**
 * The chosen tile first, then its neighbours, nearest first.
 *
 * Bounds say where a layer *may* have data, not where it does: AHN's extent
 * includes the North Sea, so the tile at its centre is three-quarters empty
 * water. The caller fetches these in order and keeps the first one with real
 * content, which is the only reliable way to tell "no data here" from
 * "this layer is genuinely pale".
 */
export function previewTileCandidates(
    opts: Parameters<typeof choosePreviewTile>[0],
    max = 9,
): TileCoord[] {
    const first = choosePreviewTile(opts);
    const n = 2 ** first.z;
    const seen = new Set<string>();
    const out: TileCoord[] = [];

    const push = (x: number, y: number) => {
        if (out.length >= max || x < 0 || y < 0 || x >= n || y >= n) return;
        const key = `${x}/${y}`;
        if (seen.has(key)) return;
        seen.add(key);
        out.push({ z: first.z, x, y });
    };

    push(first.x, first.y);
    for (let ring = 1; out.length < max && ring <= 2; ring++) {
        for (let dy = -ring; dy <= ring; dy++) {
            for (let dx = -ring; dx <= ring; dx++) {
                if (Math.max(Math.abs(dx), Math.abs(dy)) !== ring) continue;
                push(first.x + dx, first.y + dy);
            }
        }
    }
    return out;
}

/**
 * Picks where and how far in to sample.
 *
 * A single global anchor is wrong for a layer that only covers the Netherlands
 * at zoom 16+ — the tile would be blank or 404. So a layer that declares
 * bounds not containing the anchor is sampled at the centre of its own extent,
 * and a layer with a high minzoom is sampled at that minzoom.
 */
export function choosePreviewTile(opts: {
    bounds?: Bounds | null;
    minzoom?: number | null;
    maxzoom?: number | null;
    /** Extra zoom levels, for a layer whose ink only appears further in. */
    zoomBoost?: number | null;
}): TileCoord {
    const { bounds, minzoom, maxzoom, zoomBoost } = opts;

    let lon = PREVIEW_ANCHOR.lon;
    let lat = PREVIEW_ANCHOR.lat;
    let z = PREVIEW_ZOOM;

    if (bounds && bounds.length === 4) {
        if (!boundsContain(bounds, lon, lat)) {
            lon = (bounds[0] + bounds[2]) / 2;
            lat = (bounds[1] + bounds[3]) / 2;
        }
        // A regional layer must be sampled at a zoom where a tile fits inside
        // its extent, or the tile is mostly the blank area around the data.
        z = Math.max(z, fitZoomToBounds(bounds));
    }

    if (typeof minzoom === 'number' && minzoom > z) z = Math.ceil(minzoom);
    // The boost is applied after the minzoom floor, not before: a layer that
    // declares minzoom 15.5 but only serves data from 17 (PDOK's cadastral
    // map) would otherwise have its escalation swallowed by the floor.
    if (typeof zoomBoost === 'number' && Number.isFinite(zoomBoost)) z += zoomBoost;
    if (typeof maxzoom === 'number' && maxzoom < z) z = Math.floor(maxzoom);
    z = Math.max(0, Math.min(22, Math.round(z)));

    // Close in, the centre of an extent is a field: cadastral parcels and
    // building footprints only look like anything over a town, so from street
    // zoom on, sample the densest place the layer covers.
    if (z >= URBAN_ZOOM) {
        const urban = pickUrbanAnchor(bounds, lon, lat);
        if (urban) {
            lon = urban.lon;
            lat = urban.lat;
        }
    }

    const tile = lonLatToTile(lon, lat, z);
    return bounds && bounds.length === 4 ? nudgeTileInsideBounds(tile, bounds) : tile;
}

/**
 * Fills a slippy-map URL template.
 *
 * Handles the subdomain forms webmapx configs use in the wild: an explicit
 * `{s}` placeholder, a `{a-c}` range, and the common practice of listing one
 * URL per subdomain in a `tiles` array (we just take the first). `{-y}` is the
 * TMS row order, which is flipped relative to XYZ.
 */
export function fillTileTemplate(template: string, tile: TileCoord): string {
    const flippedY = 2 ** tile.z - 1 - tile.y;
    return template
        .replace(/\{quadkey\}/gi, tileToQuadkey(tile))
        .replace(/\{s\}/g, 'a')
        // `{bbox-epsg-3857}` must be substituted before the {a-c} subdomain rule,
        // which would otherwise eat "epsg-3857".
        .replace(/\{bbox-epsg-3857\}/gi, tileToBBox3857(tile).join(','))
        .replace(/\{([a-z0-9]+)-([a-z0-9]+)\}/gi, (_m, first: string) => first)
        .replace(/\{z\}/g, String(tile.z))
        .replace(/\{x\}/g, String(tile.x))
        .replace(/\{-y\}/g, String(flippedY))
        .replace(/\{y\}/g, String(tile.y));
}

/**
 * Bing/VirtualEarth quadkey for a tile: the same slippy-map grid, addressed as
 * one base-4 digit per zoom level rather than as separate x/y indices.
 * MapLibre resolves `{quadkey}` natively, so configs use it directly.
 */
export function tileToQuadkey(tile: TileCoord): string {
    let key = '';
    for (let z = tile.z; z > 0; z--) {
        const mask = 1 << (z - 1);
        let digit = 0;
        if (tile.x & mask) digit += 1;
        if (tile.y & mask) digit += 2;
        key += String(digit);
    }
    return key;
}

/** Half the circumference of the web-mercator world, in metres. */
const HALF_WORLD = 20037508.342789244;

/** Web-mercator extent of a tile: [minX, minY, maxX, maxY] in EPSG:3857 metres. */
export function tileToBBox3857(tile: TileCoord): [number, number, number, number] {
    const size = (HALF_WORLD * 2) / 2 ** tile.z;
    const minX = -HALF_WORLD + tile.x * size;
    const maxY = HALF_WORLD - tile.y * size;
    return [minX, maxY - size, minX + size, maxY];
}

/**
 * Builds a WMS GetMap request covering the preview tile.
 *
 * Some layers are plain WMS rather than tiled — the source carries an endpoint
 * plus `layers`, and there is no {z}/{x}/{y} to fill. Those are previewable,
 * just via a different request.
 */
export function resolveWmsPreviewUrl(layer: unknown, source: unknown, size = 256): string | null {
    return resolveWmsPreviewUrls(layer, source, size, 1)[0] ?? null;
}

/** As `resolveWmsPreviewUrl`, but one request per candidate tile. */
export function resolveWmsPreviewUrls(
    layer: unknown,
    source: unknown,
    size = 256,
    max = 9,
    zoomBoost = 0,
): string[] {
    const l = (layer ?? {}) as LayerLike;
    const s = (source ?? {}) as SourceLike & { layers?: unknown; format?: unknown; version?: unknown; crs?: unknown };

    const type = typeof l.type === 'string' ? l.type : '';
    if (type !== 'raster' && type !== 'hillshade') return [];

    // Two ways a config spells a WMS source. Either the endpoint is bare and
    // `layers` is a sibling key, or — far more common in the wild — the whole
    // GetMap query is already baked into the url ("...?layers=top1000raster",
    // or a full REQUEST=GetMap&LAYERS=...&STYLES=...). Reading only the first
    // shape left 59 of nl.json's 193 layers reported as "no tile template".
    // `url` is also a string OR an array here, same as the tiled case.
    const endpoint = firstString(s.url);
    if (!endpoint || endpoint.includes('{')) return []; // templated: not this code path
    const inlineParams = queryParams(endpoint);
    const layersParam = typeof s.layers === 'string' ? s.layers : inlineParams.get('LAYERS');
    if (!layersParam) return [];

    const tiles = previewTileCandidates({
        bounds: readBounds(s.bounds, (l.metadata as { bounds?: unknown } | undefined)?.bounds),
        minzoom: num(l.minzoom) ?? num(s.minzoom),
        maxzoom: num(s.maxzoom) ?? num(l.maxzoom),
        zoomBoost,
    }, max);

    const version = typeof s.version === 'string' ? s.version
        : inlineParams.get('VERSION') ?? '1.1.1';
    // WMS 1.3.0 renamed SRS to CRS; everything else is shared. A 1.3.0 request
    // also takes EPSG:3857 in x,y order, which is what tileToBBox3857 returns.
    const srsKey = version.startsWith('1.3') ? 'CRS' : 'SRS';
    const base = endpoint.split('?')[0];

    return tiles.map(tile => {
        // Start from whatever the config already put in the url (STYLES, a
        // vendor parameter, a chosen FORMAT) and override only what addresses
        // the tile, so a service-specific setting is never silently dropped.
        const params = new URLSearchParams();
        for (const [key, value] of inlineParams) params.set(key, value);
        params.set('SERVICE', 'WMS');
        params.set('VERSION', version);
        params.set('REQUEST', 'GetMap');
        params.set('LAYERS', layersParam);
        if (!params.has('STYLES')) params.set('STYLES', '');
        for (const stale of ['SRS', 'CRS']) params.delete(stale);
        params.set(srsKey, typeof s.crs === 'string' ? s.crs : 'EPSG:3857');
        params.set('BBOX', tileToBBox3857(tile).join(','));
        params.set('WIDTH', String(size));
        params.set('HEIGHT', String(size));
        params.set('FORMAT', typeof s.format === 'string' ? s.format : params.get('FORMAT') ?? 'image/png');
        return `${base}?${params.toString()}`;
    });
}

/** The url itself, or the first entry when a config lists one per subdomain. */
function firstString(value: unknown): string | null {
    if (typeof value === 'string') return value;
    if (Array.isArray(value)) return value.find((v): v is string => typeof v === 'string') ?? null;
    return null;
}

/** Query parameters of a url, keyed upper-case — WMS keys are case-insensitive. */
function queryParams(url: string): URLSearchParams {
    const out = new URLSearchParams();
    const query = url.split('?').slice(1).join('?');
    if (!query) return out;
    for (const [key, value] of new URLSearchParams(query)) out.set(key.toUpperCase(), value);
    return out;
}

interface SourceLike {
    type?: string;
    tiles?: unknown;
    url?: unknown;
    bounds?: unknown;
    minzoom?: unknown;
    maxzoom?: unknown;
}

interface LayerLike {
    type?: string;
    source?: unknown;
    url?: unknown;
    minzoom?: unknown;
    maxzoom?: unknown;
    metadata?: { bounds?: unknown } | unknown;
}

const num = (v: unknown): number | null => (typeof v === 'number' && Number.isFinite(v) ? v : null);

function readBounds(...candidates: unknown[]): Bounds | null {
    for (const c of candidates) {
        if (Array.isArray(c) && c.length === 4 && c.every(v => typeof v === 'number')) {
            return c as Bounds;
        }
    }
    return null;
}

/**
 * Builds the URL of one representative raster tile, or null when the layer
 * is not a templated raster source.
 */
export function resolveRasterPreviewUrl(layer: unknown, source: unknown): string | null {
    return resolveRasterPreviewUrls(layer, source, 1)[0] ?? null;
}

/** As `resolveRasterPreviewUrl`, but one URL per candidate tile. */
export function resolveRasterPreviewUrls(
    layer: unknown,
    source: unknown,
    max = 9,
    zoomBoost = 0,
): string[] {
    const l = (layer ?? {}) as LayerLike;
    const s = (source ?? {}) as SourceLike;

    const type = typeof l.type === 'string' ? l.type : '';
    if (type !== 'raster' && type !== 'raster-dem' && type !== 'hillshade') return [];

    // Two shapes reach here. Raw config / mapbox-style sources carry `tiles`;
    // the source objects webmapx hands to components at runtime carry `url`,
    // which is a string for a single endpoint and an ARRAY when the config
    // lists one URL per subdomain. Missing the array case left every
    // multi-subdomain basemap (OpenStreetMap among them) without a preview.
    const candidates = [s.tiles, s.url];
    let templates: string[] = [];
    for (const candidate of candidates) {
        if (Array.isArray(candidate)) {
            templates = candidate.filter((t): t is string => typeof t === 'string');
        } else if (typeof candidate === 'string') {
            templates = [candidate];
        }
        // A tiled endpoint is addressed by tile index, by the tile's bbox (WMS-
        // backed caches, which carry no {z}), or by quadkey (VirtualEarth).
        templates = templates.filter(t =>
            t.includes('{z}') || /\{bbox-epsg-3857\}/i.test(t) || /\{quadkey\}/i.test(t));
        if (templates.length > 0) break;
    }
    if (templates.length === 0) return [];

    const tiles = previewTileCandidates({
        bounds: readBounds(s.bounds, (l.metadata as { bounds?: unknown } | undefined)?.bounds),
        minzoom: num(l.minzoom) ?? num(s.minzoom),
        maxzoom: num(s.maxzoom) ?? num(l.maxzoom),
        zoomBoost,
    }, max);

    return tiles.map(tile => fillTileTemplate(templates[0], tile));
}

/**
 * Pulls the paper colour out of a fetched maplibre style document — the
 * `background` layer's paint, which is what you see between the data. It is a
 * good one-colour stand-in for a vector basemap (Liberty reads as pale cream,
 * a dark style as near-black).
 */
export function backgroundColorFromStyle(style: unknown): string | null {
    const doc = style as { layers?: unknown; source?: { layers?: unknown } } | null;
    // A webmapx layer document wraps the style under `source`; a plain maplibre
    // style has `layers` at the top. Both turn up as a layer's `url`.
    const layers = doc?.layers ?? doc?.source?.layers;
    if (!Array.isArray(layers)) return null;
    for (const layer of layers) {
        const l = layer as { type?: string; paint?: Record<string, unknown> };
        if (l?.type !== 'background') continue;
        const c = l.paint?.['background-color'];
        if (typeof c === 'string') return c;
    }
    return null;
}
