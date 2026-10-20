/**
 * `pmtiles://` and `cog://` sources on OpenLayers.
 *
 * MapLibre reads both through `addProtocol`. OpenLayers has no protocol hook,
 * so the same urls are turned into OpenLayers sources here: vector PMTiles get
 * a tile loader that reads the archive instead of fetching a url, raster
 * PMTiles use ol-pmtiles, and a COG is OpenLayers' own GeoTIFF source — which,
 * unlike maplibre-cog-protocol, reprojects, so a COG need not be in Web Mercator.
 *
 * Imported dynamically by the layer service, so pmtiles, ol-pmtiles and
 * geotiff load only for a map that draws one of these.
 */
import { PMTiles } from 'pmtiles';
import { PMTilesRasterSource } from 'ol-pmtiles';
import TileLayer from 'ol/layer/Tile';
import WebGLTileLayer from 'ol/layer/WebGLTile';
import GeoTIFF from 'ol/source/GeoTIFF';
import TileState from 'ol/TileState';
import type Tile from 'ol/Tile';
import type VectorTile from 'ol/VectorTile';
import type BaseLayer from 'ol/layer/Base';
import { colorScale } from '@geomatico/maplibre-cog-protocol';
import { archiveFileUrl, cogColorRamp, type CogColorRamp } from '../archive-urls';

const archives = new Map<string, PMTiles>();

function archive(url: string): PMTiles {
    const file = archiveFileUrl(url);
    let pmtiles = archives.get(file);
    if (!pmtiles) {
        pmtiles = new PMTiles(file);
        archives.set(file, pmtiles);
    }
    return pmtiles;
}

export interface PmtilesVectorTileInfo {
    /** Stands in for a tile url; the tile loader reads z/x/y back out of it. */
    urlTemplate: string;
    minZoom: number;
    maxZoom: number;
    tileLoadFunction: (tile: Tile, url: string) => void;
}

/** What a VectorTileSource needs to read MVT tiles straight from a `.pmtiles` archive. */
export async function pmtilesVectorTileInfo(url: string): Promise<PmtilesVectorTileInfo> {
    const pmtiles = archive(url);
    const header = await pmtiles.getHeader();
    return {
        urlTemplate: 'pmtiles://{z}/{x}/{y}',
        minZoom: header.minZoom,
        maxZoom: header.maxZoom,
        tileLoadFunction: (tile, tileUrl) => {
            const vectorTile = tile as VectorTile<never>;
            const [z, x, y] = (/pmtiles:\/\/(\d+)\/(\d+)\/(\d+)/.exec(tileUrl) ?? []).slice(1).map(Number);
            vectorTile.setLoader((extent, _resolution, projection) => {
                pmtiles.getZxy(z, x, y).then((result) => {
                    if (!result) {
                        vectorTile.setFeatures([]);
                        vectorTile.setState(TileState.EMPTY);
                        return;
                    }
                    vectorTile.setFeatures(vectorTile.getFormat().readFeatures(result.data, { extent, featureProjection: projection }) as never[]);
                    vectorTile.setState(TileState.LOADED);
                }).catch(() => {
                    vectorTile.setFeatures([]);
                    vectorTile.setState(TileState.ERROR);
                });
            });
        },
    };
}

export interface ArchiveLayerOptions {
    attribution?: string;
    minZoom?: number;
    maxZoom?: number;
    opacity?: number;
}

export function createPmtilesRasterLayer(url: string, options: ArchiveLayerOptions): BaseLayer {
    return new TileLayer({
        source: new PMTilesRasterSource({ url: archiveFileUrl(url), attributions: options.attribution, tileSize: 256 }),
        minZoom: options.minZoom,
        maxZoom: options.maxZoom,
        opacity: options.opacity,
    });
}

type ColorStop = number | number[];

/** A `#color:` ramp as an OpenLayers WebGL style expression on band 1, same colours as maplibre-cog-protocol. */
function rampExpression(ramp: CogColorRamp): unknown[] {
    const scale = colorScale({
        colorScheme: ramp.scheme,
        min: ramp.min,
        max: ramp.max,
        isContinuous: ramp.continuous,
        isReverse: ramp.reverse,
    }) as ((value: number) => [number, number, number]) & { domain(): number[] };
    const value = ['band', 1];
    if (ramp.continuous) {
        const steps = 16;
        const stops: ColorStop[] = [];
        for (let i = 0; i <= steps; i++) {
            const v = ramp.min + (ramp.max - ramp.min) * (i / steps);
            stops.push(v, [...scale(v), 1]);
        }
        return ['interpolate', ['linear'], value, ...stops];
    }
    // A threshold scale: one colour below the first break, one per break after it.
    const breaks = scale.domain();
    const cases: unknown[] = ['case'];
    for (const limit of breaks) cases.push(['<', value, limit], [...scale(limit - Number.EPSILON * Math.abs(limit || 1)), 1]);
    cases.push([...scale(ramp.max), 1]);
    return cases;
}

/**
 * A COG as a WebGL tile layer. Without a `#color:` ramp it is drawn as the
 * image it is (RGB or grey); with one, band 1 is coloured by it and nodata is
 * left transparent, as maplibre-cog-protocol does.
 */
export function createCogLayer(url: string, options: ArchiveLayerOptions): BaseLayer {
    const ramp = cogColorRamp(url);
    const source = new GeoTIFF({
        sources: [{ url: archiveFileUrl(url) }],
        // A ramp works on the stored values; an image is shown as its bytes scaled to 0–1.
        normalize: !ramp,
    });
    if (options.attribution) source.setAttributions(options.attribution);
    return new WebGLTileLayer({
        source,
        minZoom: options.minZoom,
        maxZoom: options.maxZoom,
        opacity: options.opacity,
        ...(ramp ? { style: { color: ['case', ['==', ['band', 2], 0], [0, 0, 0, 0], rampExpression(ramp)] } } : {}),
    });
}

export interface HillshadeOptions extends ArchiveLayerOptions {
    /** MapLibre's `hillshade-exaggeration`: how strongly light and shadow show, 0–1. */
    exaggeration: number;
    /** MapLibre's `hillshade-illumination-direction`: where the light comes from, degrees clockwise from north. */
    illuminationDirection: number;
}

/** MapLibre lights its hillshade from 45° above the horizon. */
const SUN_ELEVATION = Math.PI / 4;

/**
 * Hillshade from a single-band elevation COG, computed per pixel on the GPU.
 *
 * Slope and aspect come from the neighbouring pixels (OpenLayers' `band`
 * operator takes pixel offsets), the light from MapLibre's defaults, and the
 * result is drawn the way MapLibre draws it: transparent where the ground faces
 * the sun at the angle flat ground does, darker in shadow, lighter in the light.
 */
export function createCogHillshadeLayer(url: string, options: HillshadeOptions): BaseLayer {
    const source = new GeoTIFF({ sources: [{ url: archiveFileUrl(url) }], normalize: false });
    if (options.attribution) source.setAttributions(options.attribution);

    // Metres of elevation per metre of ground, across two pixels.
    const run = ['*', 2, ['resolution']];
    const dzdx = ['/', ['-', ['band', 1, 1, 0], ['band', 1, -1, 0]], run];
    const dzdy = ['/', ['-', ['band', 1, 0, -1], ['band', 1, 0, 1]], run];
    const slope = ['atan', ['sqrt', ['+', ['*', dzdx, dzdx], ['*', dzdy, dzdy]]]];
    const aspect = ['clamp', ['atan', ['-', 0, dzdx], dzdy], -Math.PI, Math.PI];
    const sunAzimuth = (options.illuminationDirection * Math.PI) / 180;
    const incidence = ['+',
        ['*', Math.sin(SUN_ELEVATION), ['cos', slope]],
        ['*', Math.cos(SUN_ELEVATION), ['sin', slope], ['cos', ['-', sunAzimuth, aspect]]],
    ];
    // Relative to flat ground: negative is shadow, positive is light.
    const shade = ['-', incidence, Math.sin(SUN_ELEVATION)];
    const strength = 2 * options.exaggeration;
    const color = ['case',
        ['==', ['band', 2], 0], [0, 0, 0, 0],
        ['<', shade, 0], ['color', 0, 0, 0, ['clamp', ['*', -strength, shade], 0, 1]],
        ['color', 255, 255, 255, ['clamp', ['*', strength, shade], 0, 1]],
    ];
    return new WebGLTileLayer({
        source,
        minZoom: options.minZoom,
        maxZoom: options.maxZoom,
        opacity: options.opacity,
        style: { color },
    });
}
