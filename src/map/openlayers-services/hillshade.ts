/**
 * MapLibre's `hillshade` layer on OpenLayers.
 *
 * Drawn the way MapLibre draws it, in two steps. First each elevation tile is
 * turned into slope derivatives (MapLibre's "prepare" pass, here on the CPU
 * when the tile loads): Sobel derivatives, scaled per zoom and latitude as
 * MapLibre scales them and stored in a byte per axis. Then a WebGL tile
 * layer lights them per pixel with MapLibre's default `standard` method. Doing
 * the derivatives in the style instead would read every elevation dozens of
 * times per pixel, more than a GPU will compile.
 *
 * Elevation comes from the terrarium / mapbox RGB-encoded tiles a MapLibre
 * `raster-dem` source names, or from a `cog://…#dem` elevation COG.
 *
 * Imported dynamically by the layer service, so this and geotiff load only for
 * a map that draws a hillshade.
 */
import WebGLTileLayer from 'ol/layer/WebGLTile';
import DataTile from 'ol/source/DataTile';
import { asArray } from 'ol/color';
import type BaseLayer from 'ol/layer/Base';
import { fromUrl, type GeoTIFF, type GeoTIFFImage } from 'geotiff';

export interface HillshadeOptions {
    attribution?: string;
    minZoom?: number;
    maxZoom?: number;
    /** `hillshade-exaggeration`, 0–1; MapLibre's default is 0.5. */
    exaggeration: number;
    /** `hillshade-illumination-direction`, degrees clockwise from north; MapLibre's default is 335. */
    illuminationDirection: number;
    /** `hillshade-illumination-anchor`; MapLibre's default is `viewport`: the light turns with the map. */
    illuminationAnchor?: 'map' | 'viewport';
    /** `hillshade-shadow-color`, `hillshade-highlight-color` and `hillshade-accent-color`, as CSS colours. */
    shadowColor?: string;
    highlightColor?: string;
    accentColor?: string;
}

const EARTH_CIRCUMFERENCE = 40075016.68557849;

/** A view resolution as a zoom on a 256 px Web Mercator grid. */
function zoomForResolution(resolution: number): number {
    return Math.log2(EARTH_CIRCUMFERENCE / (256 * resolution));
}

/**
 * MapLibre's factor from a Sobel sum to its slope derivative at tile
 * zoom `z`, for a tile `size` pixels wide: steeper below zoom 15, the more so
 * the further out.
 */
function derivativeScale(z: number, size: number): number {
    const factor = z < 2 ? 0.4 : z < 4.5 ? 0.35 : 0.3;
    const exaggeration = z < 15 ? (z - 15) * factor : 0;
    return size / Math.pow(2, exaggeration + 28.2562 - z);
}

/**
 * Elevations of a tile with a one-pixel border all round (`(size + 2)²`
 * values, rows from the north), NaN where there is no elevation.
 */
export interface ElevationGrid {
    size: number;
    values: Float32Array;
}

/**
 * MapLibre's prepare pass for one tile: per pixel the slope derivative in x
 * and y, each stored as a byte (`derivative / 8 + 0.5`, so ±4 at most), with
 * alpha 0 where there is no elevation. MapLibre divides by the cosine of the
 * latitude when it draws; that is done here, per row.
 */
export function prepareDerivatives(grid: ElevationGrid, z: number, y: number): Uint8Array {
    const { size, values } = grid;
    const stride = size + 2;
    const scale = derivativeScale(z, size);
    const tiles = Math.pow(2, z);
    const out = new Uint8Array(size * size * 4);
    for (let row = 0; row < size; row++) {
        const mercatorY = (y + (row + 0.5) / size) / tiles;
        const latitude = Math.atan(Math.sinh(Math.PI * (1 - 2 * mercatorY)));
        const rowScale = scale / Math.cos(latitude);
        for (let col = 0; col < size; col++) {
            const at = (dx: number, dy: number, centre: number): number => {
                const v = values[(row + 1 + dy) * stride + col + 1 + dx];
                return Number.isNaN(v) ? centre : v;
            };
            const e = values[(row + 1) * stride + col + 1];
            const o = (row * size + col) * 4;
            if (Number.isNaN(e)) continue; // all zero: transparent
            const a = at(-1, -1, e), b = at(0, -1, e), c = at(1, -1, e);
            const d = at(-1, 0, e), f = at(1, 0, e);
            const g = at(-1, 1, e), h = at(0, 1, e), i = at(1, 1, e);
            const derivX = ((c + f + f + i) - (a + d + d + g)) * rowScale;
            const derivY = ((g + h + h + i) - (a + b + b + c)) * rowScale;
            out[o] = Math.round(Math.min(Math.max(derivX / 8 + 0.5, 0), 1) * 255);
            out[o + 1] = Math.round(Math.min(Math.max(derivY / 8 + 0.5, 0), 1) * 255);
            out[o + 3] = 255;
        }
    }
    return out;
}

/** A CSS colour as premultiplied 0–1 rgba, the way MapLibre's shader blends it. */
function premultiplied(color: string | undefined, fallback: string): [number, number, number, number] {
    let rgba: number[];
    try {
        rgba = asArray(color ?? fallback);
    } catch {
        rgba = asArray(fallback);
    }
    const a = rgba[3] ?? 1;
    return [(rgba[0] / 255) * a, (rgba[1] / 255) * a, (rgba[2] / 255) * a, a];
}

/** MapLibre's `standard` hillshade, as an OpenLayers WebGL style expression on prepared derivative tiles. */
function hillshadeColor(options: HillshadeOptions): unknown[] {
    const derivative = (band: number) => ['-', ['*', 8, ['band', band]], 4];
    const derivX = derivative(1);
    const derivY = derivative(2);
    const slope = ['atan', ['*', 0.625, ['sqrt', ['+', ['*', derivX, derivX], ['*', derivY, derivY]]]]];
    const aspect = ['case',
        ['!=', derivX, 0], ['atan', derivY, ['-', 0, derivX]],
        ['>', derivY, 0], Math.PI / 2,
        -Math.PI / 2,
    ];
    const intensity = options.exaggeration;
    const base = 1.875 - intensity * 1.75;
    const maxSlope = Math.PI / 2;
    const scaledSlope = intensity !== 0.5
        ? ['*', ['/', ['-', ['^', base, slope], 1], Math.pow(base, maxSlope) - 1], maxSlope]
        : slope;
    const strength = Math.min(Math.max(intensity * 2, 0), 1);
    const accent = ['-', 1, ['cos', scaledSlope]];
    const shade = ['abs', ['-', ['%', ['+', ['/', ['+', aspect, ['var', 'azimuth']], Math.PI], 0.5], 2], 1]];
    const lit = ['*', ['sin', scaledSlope], strength];

    const shadow = premultiplied(options.shadowColor, '#000000');
    const highlight = premultiplied(options.highlightColor, '#ffffff');
    const accentColor = premultiplied(options.accentColor, '#000000');
    // MapLibre: accent·(1 − shade.a) + shade, in premultiplied colour.
    const shadeChannel = (n: number) => ['*', ['+', shadow[n], ['*', highlight[n] - shadow[n], shade]], lit];
    const channel = (n: number) => ['+', ['*', accent, strength * accentColor[n], ['-', 1, shadeChannel(3)]], shadeChannel(n)];
    const alpha = channel(3);
    // OpenLayers takes straight colour and premultiplies it itself.
    const straight = (n: number) => ['*', 255, ['/', channel(n), ['clamp', alpha, 1e-6, 1]]];

    return ['case',
        ['==', ['band', 4], 0], [0, 0, 0, 0],
        ['color', straight(0), straight(1), straight(2), alpha],
    ];
}

interface DemSource {
    /** Elevations of tile z/x/y with their border, or null where the DEM has none. */
    load(z: number, x: number, y: number, signal: AbortSignal): Promise<ElevationGrid | null>;
    /** Tile size on the map grid, as MapLibre's `tileSize`. */
    tileSize: number;
    maxZoom: number;
}

/** The layer: derivative tiles prepared as they load, lit on the GPU, the light turning with the view. */
function createHillshadeLayer(dem: DemSource, options: HillshadeOptions): BaseLayer {
    const { tileSize, maxZoom } = dem;
    const source = new DataTile({
        tileSize,
        maxZoom,
        wrapX: true,
        // Derivatives, unlike encoded elevations, may be blended between pixels, as MapLibre does.
        interpolate: true,
        attributions: options.attribution,
        // MapLibre rounds to the nearest zoom on a log scale; OpenLayers' default compares resolutions linearly.
        zDirection: (value, high, low) => value - Math.sqrt(high * low),
        loader: async (z, x, y, { signal }) => {
            const grid = await dem.load(z, x, y, signal);
            if (!grid) return new Uint8Array(tileSize * tileSize * 4);
            const prepared = prepareDerivatives(grid, z, y);
            return grid.size === tileSize ? prepared : resize(prepared, grid.size, tileSize);
        },
    });

    const sunAzimuth = (options.illuminationDirection * Math.PI) / 180 + Math.PI;
    const layer = new WebGLTileLayer({
        source,
        minZoom: options.minZoom,
        maxZoom: options.maxZoom,
        // 128 tiles of 256 px RGBA is 32 MB of textures; the default 512 can grow four times that.
        cacheSize: 128,
        style: {
            variables: { azimuth: sunAzimuth },
            color: hillshadeColor(options),
        },
    });
    if (options.illuminationAnchor !== 'map') {
        // Anchored to the viewport the light turns with the map; OpenLayers' rotation is the opposite of MapLibre's bearing.
        let rotation = 0;
        layer.on('prerender', (event) => {
            const viewRotation = event.frameState?.viewState.rotation ?? 0;
            if (viewRotation === rotation) return;
            rotation = viewRotation;
            layer.updateStyleVariables({ azimuth: sunAzimuth - rotation });
        });
    }
    return layer;
}

/** Nearest-neighbour resize of an RGBA tile, for tiles whose images are not `tileSize` wide. */
function resize(rgba: Uint8Array, from: number, to: number): Uint8Array {
    const out = new Uint8Array(to * to * 4);
    for (let row = 0; row < to; row++) {
        for (let col = 0; col < to; col++) {
            const s = (Math.floor((row * from) / to) * from + Math.floor((col * from) / to)) * 4;
            out.set(rgba.subarray(s, s + 4), (row * to + col) * 4);
        }
    }
    return out;
}

export interface TileHillshadeOptions extends HillshadeOptions {
    /** MapLibre's `raster-dem` encoding; MapLibre's default is `mapbox`. */
    encoding?: 'terrarium' | 'mapbox';
    /** MapLibre's `raster-dem` tileSize; MapLibre's default is 512. */
    tileSize?: number;
    /** The highest zoom the tiles exist at; beyond it they are stretched. */
    sourceMaxZoom?: number;
}

/** Elevation in metres from an RGB-encoded pixel. */
export function decodeElevation(encoding: 'terrarium' | 'mapbox', r: number, g: number, b: number): number {
    return encoding === 'terrarium'
        ? r * 256 + g + b / 256 - 32768
        : -10000 + 0.1 * (r * 65536 + g * 256 + b);
}

/** Decoded elevation tiles kept for their neighbours' borders; 64 tiles of 256 px is 16 MB. */
const DECODED_TILES_KEPT = 64;

/**
 * Hillshade from the RGB-encoded elevation tiles of a MapLibre `raster-dem`
 * source. Like MapLibre, a tile's border is taken from its neighbours, so the
 * slope along tile edges is measured as everywhere else; only where a
 * neighbour is missing does the tile repeat its own edge.
 */
export function createTileHillshadeLayer(tiles: string[], options: TileHillshadeOptions): BaseLayer {
    const encoding = options.encoding ?? 'mapbox';
    const decoded = new Map<string, Promise<DecodedTile | null>>();

    /** A tile's elevations without border, decoded once and shared between it and its neighbours. */
    function elevations(z: number, x: number, y: number): Promise<DecodedTile | null> {
        const n = Math.pow(2, z);
        if (y < 0 || y >= n) return Promise.resolve(null);
        x = ((x % n) + n) % n;
        const key = `${z}/${x}/${y}`;
        let tile = decoded.get(key);
        if (tile) {
            decoded.delete(key); // re-inserted below as most recently used
        } else {
            const template = tiles[(x + y) % tiles.length];
            const url = template.replace('{z}', String(z)).replace('{x}', String(x)).replace('{y}', String(y));
            tile = decodeTile(url, encoding).catch(() => null);
        }
        decoded.set(key, tile);
        if (decoded.size > DECODED_TILES_KEPT) decoded.delete(decoded.keys().next().value!);
        return tile;
    }

    return createHillshadeLayer({
        tileSize: options.tileSize ?? 512,
        maxZoom: options.sourceMaxZoom ?? 22,
        async load(z, x, y) {
            const [centre, north, south, west, east] = await Promise.all([
                elevations(z, x, y), elevations(z, x, y - 1), elevations(z, x, y + 1), elevations(z, x - 1, y), elevations(z, x + 1, y),
            ]);
            if (!centre) return null;
            const { size, values } = centre;
            const fits = (tile: DecodedTile | null) => (tile && tile.size === size ? tile.values : null);
            const [n, s, w, e] = [fits(north), fits(south), fits(west), fits(east)];
            const stride = size + 2;
            const bordered = new Float32Array(stride * stride);
            for (let row = -1; row <= size; row++) {
                for (let col = -1; col <= size; col++) {
                    const r = Math.min(Math.max(row, 0), size - 1);
                    const c = Math.min(Math.max(col, 0), size - 1);
                    let v = values[r * size + c];
                    if (row === -1 && col === c && n) v = n[(size - 1) * size + c];
                    else if (row === size && col === c && s) v = s[c];
                    else if (col === -1 && row === r && w) v = w[r * size + size - 1];
                    else if (col === size && row === r && e) v = e[r * size];
                    bordered[(row + 1) * stride + col + 1] = v;
                }
            }
            return { size, values: bordered };
        },
    }, options);
}

/** A tile's elevations in metres, `size²` values row by row from the north-west, NaN where it is transparent. */
interface DecodedTile {
    size: number;
    values: Float32Array;
}

async function decodeTile(url: string, encoding: 'terrarium' | 'mapbox'): Promise<DecodedTile | null> {
    const response = await fetch(url);
    if (!response.ok) return null;
    const bitmap = await createImageBitmap(await response.blob());
    const size = bitmap.width;
    const canvas = new OffscreenCanvas(size, size);
    const context = canvas.getContext('2d', { willReadFrequently: true })!;
    context.drawImage(bitmap, 0, 0);
    bitmap.close();
    const pixels = context.getImageData(0, 0, size, size).data;
    const values = new Float32Array(size * size);
    for (let i = 0; i < values.length; i++) {
        const p = i * 4;
        values[i] = pixels[p + 3] === 0 ? NaN : decodeElevation(encoding, pixels[p], pixels[p + 1], pixels[p + 2]);
    }
    return { size, values };
}

/** EPSG:3857 and the codes that name it in older files. */
const WEB_MERCATOR_CODES = new Set([3857, 900913, 3785, 102100, 102113]);

function webMercatorImage(image: GeoTIFFImage): boolean {
    const keys = image.geoKeys ?? {};
    return WEB_MERCATOR_CODES.has(keys.ProjectedCSTypeGeoKey);
}

/**
 * Hillshade from a single-band elevation COG in Web Mercator, read as 256 px
 * tiles the way maplibre-cog-protocol reads it, each with a border taken from
 * the file itself, so tile edges join without a seam.
 */
export async function createCogHillshadeLayer(fileUrl: string, options: HillshadeOptions): Promise<BaseLayer> {
    const tiff: GeoTIFF = await fromUrl(fileUrl);
    const image = await tiff.getImage();
    if (!webMercatorImage(image)) {
        throw new Error(`COG elevation model ${fileUrl} is not in EPSG:3857, which a cog:// hillshade requires`);
    }
    const [minX, minY, maxX, maxY] = image.getBoundingBox();
    const noData = image.getGDALNoData();
    const tileSize = 256;
    const finest = Math.abs(image.getResolution()[0]);

    return createHillshadeLayer({
        tileSize,
        maxZoom: Math.max(0, Math.round(zoomForResolution(finest))),
        async load(z, x, y, signal) {
            const span = EARTH_CIRCUMFERENCE / Math.pow(2, z);
            const pixel = span / tileSize;
            const west = -EARTH_CIRCUMFERENCE / 2 + x * span - pixel;
            const north = EARTH_CIRCUMFERENCE / 2 - y * span + pixel;
            const east = west + span + 2 * pixel;
            const south = north - span - 2 * pixel;
            // Only the part of the tile the file covers is read; the rest stays NaN.
            const read = [Math.max(west, minX), Math.max(south, minY), Math.min(east, maxX), Math.min(north, maxY)];
            const width = Math.round((read[2] - read[0]) / pixel);
            const height = Math.round((read[3] - read[1]) / pixel);
            if (width <= 0 || height <= 0) return null;
            const rasters = await tiff.readRasters({ bbox: read, width, height, samples: [0], resampleMethod: 'nearest', signal });
            const band = rasters[0] as ArrayLike<number>;
            const stride = tileSize + 2;
            const values = new Float32Array(stride * stride).fill(NaN);
            const left = Math.round((read[0] - west) / pixel);
            const top = Math.round((north - read[3]) / pixel);
            for (let row = 0; row < height && top + row < stride; row++) {
                for (let col = 0; col < width && left + col < stride; col++) {
                    const v = band[row * width + col];
                    values[(top + row) * stride + left + col] = v === noData || !Number.isFinite(v) ? NaN : v;
                }
            }
            return { size: tileSize, values };
        },
    }, options);
}
