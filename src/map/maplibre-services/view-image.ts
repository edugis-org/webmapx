import * as maplibregl from 'maplibre-gl';
import type { ViewImage, ViewImageOptions } from '../IMapInterfaces';

/**
 * Renders the current view into an image, with only the layers asked for.
 *
 * The live map cannot simply be read back: its WebGL canvas is created without
 * `preserveDrawingBuffer`, so reading it outside a render frame returns black,
 * and turning that on costs every frame of every map to serve an occasional
 * capture. And it draws everything — labels, boundaries, the tool's own
 * markers — which an image analyser would treat as part of the scene. So, like
 * printing (`print-map.ts`), a second map is built: same style minus the
 * layers not wanted, same camera and size, off screen, read once when idle.
 *
 * Custom layers (Allmaps' warped maps) are not part of the style document and
 * cannot be copied; asking for one alone fails with a message saying so.
 */
export async function renderMapLibreViewImage(
    source: maplibregl.Map,
    nativeLayerIdsOf: (logicalLayerId: string) => string[],
    options: ViewImageOptions,
): Promise<ViewImage> {
    const live = source.getContainer();
    const width = live.clientWidth;
    const height = live.clientHeight;
    if (!width || !height) throw new Error('The map has no size to render.');

    const style = source.getStyle();
    const wanted = options.include
        ? new Set(options.include.flatMap(nativeLayerIdsOf))
        : null;
    const unwanted = new Set((options.exclude ?? []).flatMap(nativeLayerIdsOf));
    style.layers = style.layers.filter(layer =>
        (!wanted || wanted.has(layer.id)) && !unwanted.has(layer.id));
    if (wanted && style.layers.length === 0) {
        throw new Error('The chosen layer is not part of the map style (an Allmaps overlay?) and cannot be captured on its own.');
    }

    const pixelRatio = options.minLongestSide
        ? Math.min(2, Math.max(1, options.minLongestSide / Math.max(width, height)))
        : 1;

    // Laid out at full size (a zero-size or display:none container renders
    // nothing) but invisible and out of the way.
    const container = document.createElement('div');
    container.style.cssText = `position:fixed;left:0;top:0;width:${width}px;height:${height}px;visibility:hidden;pointer-events:none;`;
    document.body.appendChild(container);

    const map = new maplibregl.Map({
        container,
        style,
        center: source.getCenter(),
        zoom: source.getZoom(),
        bearing: source.getBearing(),
        pitch: source.getPitch(),
        renderWorldCopies: source.getRenderWorldCopies(),
        pixelRatio,
        interactive: false,
        attributionControl: false,
        fadeDuration: 0,
        canvasContextAttributes: { preserveDrawingBuffer: true },
    });

    try {
        await new Promise<void>((resolve, reject) => {
            const timer = setTimeout(() => reject(new Error('Rendering the view timed out (30 s).')), 30_000);
            map.once('idle', () => { clearTimeout(timer); resolve(); });
            map.on('error', (e) => {
                // Tile errors are routine (a missing tile at the edge); only a
                // style that fails to load at all is fatal.
                if (!map.isStyleLoaded()) { clearTimeout(timer); reject(e.error ?? new Error('Map style failed to load.')); }
            });
        });
        const image = await createImageBitmap(map.getCanvas());
        return { image, pixelRatio };
    } finally {
        map.remove();
        container.remove();
    }
}
