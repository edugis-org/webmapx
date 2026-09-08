/**
 * The paint a vector layer gets when it arrives without any.
 *
 * A layer definition is allowed to carry no `paint` at all, and then each
 * engine answers with its own default: MapLibre follows the style spec
 * (`fill-color` `#000000`, opaque), while this codebase's Leaflet and Cesium
 * layer factories used to fall back to `#3388ff`, as did the legend. So a
 * harvested WFS layer — `{ type: 'fill', source, metadata }` and nothing else,
 * which is exactly what a catalog that only knows the service produces — came
 * out solid black on MapLibre while its legend swatch showed blue.
 *
 * The legend must follow the layer, not the other way round, so the paint is
 * filled in here, once, in generic code, before the layer reaches any engine
 * (`BaseAdapter.addLayer`). Every engine and the legend then read the same
 * paint off the layer itself rather than four fallbacks guessing separately.
 *
 * The values are webmapx's unstyled look, and they are the ones a dropped file
 * with no style already got (`dropped-layer-builder.ts`): a dark outline over a
 * translucent grey fill. Opaque black covering the basemap is what the style
 * spec's own default gives, and it is not useful on a map. A layer whose style
 * was forgotten, never authored, or lost to a bug therefore looks the same
 * however it arrived.
 *
 * Only a wholly absent paint is filled in, and no sub-layer is ever added. A
 * layer that sets one property and leaves the rest to the spec means that, and
 * merging into it would override choices the author made by omission.
 */

/** Dark grey, the colour webmapx draws a layer nobody has styled. */
export const DEFAULT_DATA_COLOR = '#444444';

/** The outline of an unstyled polygon. */
export const DEFAULT_OUTLINE_COLOR = '#000000';

/** Fill opacity of an unstyled polygon: the map underneath stays readable. */
export const DEFAULT_FILL_OPACITY = 0.3;

/**
 * Paint per layer type. A polygon carries its outline as `fill-outline-color`
 * rather than a second `line` sub-layer: this fills in paint on the layer it is
 * given and never invents another one.
 */
const DEFAULT_PAINT: Record<string, Record<string, unknown>> = {
    fill: {
        'fill-color': DEFAULT_DATA_COLOR,
        'fill-opacity': DEFAULT_FILL_OPACITY,
        'fill-outline-color': DEFAULT_OUTLINE_COLOR,
    },
    line: { 'line-color': DEFAULT_DATA_COLOR, 'line-width': 2 },
    circle: { 'circle-color': DEFAULT_DATA_COLOR, 'circle-radius': 6 },
};

/** The default value of one paint property, for an engine or legend fallback. */
export function defaultPaintValue(type: string, property: string): unknown {
    return DEFAULT_PAINT[type]?.[property];
}

/** True when the layer carries no paint property of its own. */
function hasNoPaint(layer: Record<string, unknown>): boolean {
    const paint = layer.paint;
    return paint == null || (typeof paint === 'object' && Object.keys(paint as object).length === 0);
}

/**
 * Returns `layer` with a default paint where it has none, leaving anything that
 * carries paint of its own untouched. Composite (`type: 'style'`) layers are
 * descended into, since their sublayers reach the engine the same way.
 */
export function withDefaultPaint<T>(layer: T): T {
    if (!layer || typeof layer !== 'object') return layer;
    const record = layer as Record<string, unknown>;

    if (Array.isArray(record.layers)) {
        return { ...record, layers: record.layers.map(sub => withDefaultPaint(sub)) } as T;
    }

    const defaults = DEFAULT_PAINT[String(record.type)];
    if (!defaults || !hasNoPaint(record)) return layer;
    return { ...record, paint: { ...defaults } } as T;
}
