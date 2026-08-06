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
}): TileCoord {
    const { bounds, minzoom, maxzoom } = opts;

    let lon = PREVIEW_ANCHOR.lon;
    let lat = PREVIEW_ANCHOR.lat;
    if (bounds && bounds.length === 4 && !boundsContain(bounds, lon, lat)) {
        lon = (bounds[0] + bounds[2]) / 2;
        lat = (bounds[1] + bounds[3]) / 2;
    }

    let z = PREVIEW_ZOOM;
    if (typeof minzoom === 'number' && minzoom > z) z = Math.ceil(minzoom);
    if (typeof maxzoom === 'number' && maxzoom < z) z = Math.floor(maxzoom);
    z = Math.max(0, Math.min(22, Math.round(z)));

    return lonLatToTile(lon, lat, z);
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
    const l = (layer ?? {}) as LayerLike;
    const s = (source ?? {}) as SourceLike & { layers?: unknown; format?: unknown; version?: unknown; crs?: unknown };

    const type = typeof l.type === 'string' ? l.type : '';
    if (type !== 'raster' && type !== 'hillshade') return null;
    if (typeof s.url !== 'string' || typeof s.layers !== 'string') return null;
    if (s.url.includes('{')) return null; // templated: not this code path

    const tile = choosePreviewTile({
        bounds: readBounds(s.bounds, (l.metadata as { bounds?: unknown } | undefined)?.bounds),
        minzoom: num(l.minzoom) ?? num(s.minzoom),
        maxzoom: num(s.maxzoom) ?? num(l.maxzoom),
    });

    const version = typeof s.version === 'string' ? s.version : '1.1.1';
    // WMS 1.3.0 renamed SRS to CRS; everything else is shared.
    const srsKey = version.startsWith('1.3') ? 'CRS' : 'SRS';
    const params = new URLSearchParams({
        SERVICE: 'WMS',
        VERSION: version,
        REQUEST: 'GetMap',
        LAYERS: s.layers,
        STYLES: '',
        [srsKey]: typeof s.crs === 'string' ? s.crs : 'EPSG:3857',
        BBOX: tileToBBox3857(tile).join(','),
        WIDTH: String(size),
        HEIGHT: String(size),
        FORMAT: typeof s.format === 'string' ? s.format : 'image/png',
    });

    return `${s.url}${s.url.includes('?') ? '&' : '?'}${params.toString()}`;
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
    const l = (layer ?? {}) as LayerLike;
    const s = (source ?? {}) as SourceLike;

    const type = typeof l.type === 'string' ? l.type : '';
    if (type !== 'raster' && type !== 'raster-dem' && type !== 'hillshade') return null;

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
        // A tiled endpoint is addressed either by tile index or by the tile's
        // bbox — WMS-backed tile caches use the latter and carry no {z}.
        templates = templates.filter(t => t.includes('{z}') || /\{bbox-epsg-3857\}/i.test(t));
        if (templates.length > 0) break;
    }
    if (templates.length === 0) return null;

    const tile = choosePreviewTile({
        bounds: readBounds(s.bounds, (l.metadata as { bounds?: unknown } | undefined)?.bounds),
        minzoom: num(l.minzoom) ?? num(s.minzoom),
        maxzoom: num(s.maxzoom) ?? num(l.maxzoom),
    });

    return fillTileTemplate(templates[0], tile);
}

/**
 * Pulls the paper colour out of a fetched maplibre style document — the
 * `background` layer's paint, which is what you see between the data. It is a
 * good one-colour stand-in for a vector basemap (Liberty reads as pale cream,
 * a dark style as near-black).
 */
export function backgroundColorFromStyle(style: unknown): string | null {
    const layers = (style as { layers?: unknown })?.layers;
    if (!Array.isArray(layers)) return null;
    for (const layer of layers) {
        const l = layer as { type?: string; paint?: Record<string, unknown> };
        if (l?.type !== 'background') continue;
        const c = l.paint?.['background-color'];
        if (typeof c === 'string') return c;
    }
    return null;
}
