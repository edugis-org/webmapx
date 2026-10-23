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
        // JPEG-compressed COGs store YCbCr, which maplibre-cog-protocol shows as RGB.
        convertToRGB: ramp ? false : 'auto',
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
