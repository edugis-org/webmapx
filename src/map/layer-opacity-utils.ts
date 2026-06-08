import type { AnyLayerConfig, CompositeStyleLayerConfig, StandardLayerConfig } from '../config/types';

const OPACITY_PAINT_KEYS = [
    'fill-opacity', 'line-opacity', 'circle-opacity', 'raster-opacity',
    'fill-extrusion-opacity', 'heatmap-opacity', 'background-opacity',
    'icon-opacity', 'text-opacity',
];

function opacityFromPaint(paint: Record<string, unknown> | undefined): number | undefined {
    if (!paint) return undefined;
    for (const key of OPACITY_PAINT_KEYS) {
        const value = paint[key];
        if (typeof value === 'number') return value;
    }
    return undefined;
}

/**
 * Extracts a layer's config-defined base opacity (1 = fully opaque) from its `paint`
 * spec (or its first sub-layer's `paint` for style layers). The transparency slider
 * scales relative to this baseline instead of overriding it, so a layer authored at
 * e.g. 0.3 opacity stays at most 0.3 — never becomes more opaque than designed.
 */
export function extractBaseOpacity(layerConfig: AnyLayerConfig): number {
    if (layerConfig.type === 'style') {
        for (const subLayer of (layerConfig as CompositeStyleLayerConfig).layers ?? []) {
            const value = opacityFromPaint(subLayer.paint);
            if (value !== undefined) return value;
        }
        return 1;
    }
    return opacityFromPaint((layerConfig as StandardLayerConfig).paint) ?? 1;
}
