// src/map/cesium-services/label-collision.ts

/** Hides overlapping `symbol` labels across ALL geojson data sources on a viewer, keeping the
 *  one with the lowest `symbol-sort-key` (mirrors MapLibre GL JS's / OL's `declutter` collision
 *  priority). Cesium's Entity `LabelGraphics` has no built-in cross-entity collision system, so
 *  every label would otherwise render unconditionally, overlapping when labels are dense.
 *
 *  Entities must carry their sort key on `_webmapxSortKey` and text on a real `label` graphics
 *  (see the `symbol` handling in cesium MapLayerService.applyGeoJsonStyles). */

function getCesium(): any {
    return (globalThis as any).Cesium;
}

let measureCtx: CanvasRenderingContext2D | null = null;
function getMeasureContext(): CanvasRenderingContext2D {
    if (!measureCtx) {
        measureCtx = document.createElement('canvas').getContext('2d')!;
    }
    return measureCtx;
}

const runners = new WeakMap<object, () => void>();

export function setupLabelCollision(viewer: any, getGeojsonDataSources: () => any[]): void {
    if (!viewer || runners.has(viewer)) return;

    // Measuring label text needs a real canvas, so this is browser-only. Outside a DOM
    // (unit tests) there is nothing to collide and nothing to measure with.
    if (typeof document === 'undefined') return;

    const Cesium = getCesium();
    if (!Cesium?.JulianDate) return;

    const run = () => {
        try {
            const scene = viewer.scene;
            if (!scene) return;
            const julian = Cesium.JulianDate.now();
            const ctx = getMeasureContext();

            const entries: { entity: any; sortKey: number; rect: { left: number; right: number; top: number; bottom: number } }[] = [];
            for (const dataSource of getGeojsonDataSources()) {
                const entities = dataSource?.entities?.values ?? [];
                for (const entity of entities) {
                    if (!entity.label) continue;
                    const text = entity.label.text?.getValue?.(julian);
                    if (!text) continue;
                    const position = entity.position?.getValue?.(julian);
                    if (!position) continue;
                    const canvasPos = scene.cartesianToCanvasCoordinates(position);
                    if (!canvasPos) continue;

                    const font = entity.label.font?.getValue?.(julian) ?? '12px sans-serif';
                    const fontSizeMatch = /(\d+(?:\.\d+)?)px/.exec(font);
                    const fontSize = fontSizeMatch ? Number(fontSizeMatch[1]) : 12;
                    ctx.font = font;
                    const width = ctx.measureText(text).width;
                    const height = fontSize * 1.2;

                    entries.push({
                        entity,
                        sortKey: entity._webmapxSortKey ?? 0,
                        rect: {
                            left: canvasPos.x - width / 2,
                            right: canvasPos.x + width / 2,
                            top: canvasPos.y - height / 2,
                            bottom: canvasPos.y + height / 2,
                        },
                    });
                }
            }

            entries.sort((a, b) => a.sortKey - b.sortKey);
            const placed: { left: number; right: number; top: number; bottom: number }[] = [];
            for (const { entity, rect } of entries) {
                const overlaps = placed.some((r) =>
                    !(rect.right < r.left || rect.left > r.right || rect.bottom < r.top || rect.top > r.bottom)
                );
                entity.label.show = !overlaps;
                if (!overlaps) placed.push(rect);
            }
        } catch (err) {
            console.error('[webmapx][cesium] label collision update failed', err);
        }
    };

    runners.set(viewer, run);
    // Re-run whenever the camera actually moves (pan/zoom/tilt), not on every render frame.
    viewer.camera.percentageChanged = 0.01;
    viewer.camera.changed.addEventListener(run);
    // Safety net: camera.changed can miss edge cases (e.g. purely programmatic view changes,
    // terrain/entity load settling after the camera already stopped moving), so also
    // periodically re-check via postRender, throttled to a few times per second.
    let lastRun = 0;
    viewer.scene.postRender.addEventListener(() => {
        const now = performance.now();
        if (now - lastRun < 250) return;
        lastRun = now;
        run();
    });
    run();
}

/** Call after adding/removing/re-styling geojson entities so newly rendered labels
 *  participate in collision detection immediately, without waiting for a camera move. */
export function updateLabelCollision(viewer: any): void {
    runners.get(viewer)?.();
}
