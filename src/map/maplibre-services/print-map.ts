import * as maplibregl from 'maplibre-gl';
import type { PrintFrame } from '../IMapInterfaces';

/**
 * Renders a second, non-interactive MapLibre map at print resolution.
 *
 * MapLibre draws into a WebGL canvas without `preserveDrawingBuffer`, so the
 * live map comes out blank on paper and cannot simply be scaled with CSS the
 * way the DOM- and 2D-canvas engines are. A fresh map with the same style,
 * sized to the paper, is rendered instead and removed after printing.
 */
export async function renderMapLibrePrintMap(
    source: maplibregl.Map,
    container: HTMLElement,
    frame: PrintFrame,
): Promise<() => void> {
    const center = source.unproject(frame.center);
    const printMap = new maplibregl.Map({
        container,
        style: source.getStyle(),
        center,
        zoom: source.getZoom() + Math.log2(frame.scale),
        bearing: source.getBearing(),
        pitch: source.getPitch(),
        interactive: false,
        attributionControl: false,
    });

    try {
        await new Promise<void>((resolve, reject) => {
            const timer = setTimeout(() => reject(new Error('Map render timed out (30 s)')), 30_000);
            printMap.once('idle', () => { clearTimeout(timer); resolve(); });
        });
    } catch (error) {
        printMap.remove();
        throw error;
    }
    return () => printMap.remove();
}
