/**
 * The paint a vector layer gets when it arrives without any.
 *
 * A layer definition is allowed to carry no `paint` at all, and then each engine
 * answers with its own default: MapLibre follows the style spec (`fill-color`
 * `#000000`, opaque), while this codebase's Leaflet and Cesium layer factories
 * fall back to `#3388ff`. The legend draws the same fallback as those two. So a
 * harvested WFS layer — `{ type: 'fill', source, metadata }` and nothing else,
 * which is exactly what a catalog that only knows the service produces — came
 * out solid black on MapLibre while its legend swatch showed blue, and the two
 * halves of the same screen disagreed about what colour the layer was.
 *
 * Filling the paint in here, once, in generic code, is what makes them agree:
 * every engine is handed the colour the legend is about to draw, instead of
 * three engines guessing separately and a fourth reading the spec.
 *
 * Only a wholly absent paint is filled in. A layer that sets one property and
 * leaves the rest to the spec means that, and merging into it would override
 * choices the author made by omission.
 */

/** Blue, the colour webmapx paints a layer nobody has styled. */
export const DEFAULT_DATA_COLOR = '#3388ff';

/**
 * Paint per layer type. A fill is translucent so an unstyled overlay does not
 * hide the map underneath it; the values match what `layer-discovery` already
 * gives a service it styles itself.
 */
const DEFAULT_PAINT: Record<string, Record<string, unknown>> = {
    fill: { 'fill-color': DEFAULT_DATA_COLOR, 'fill-opacity': 0.5 },
    line: { 'line-color': DEFAULT_DATA_COLOR, 'line-width': 1 },
    circle: { 'circle-color': DEFAULT_DATA_COLOR, 'circle-radius': 4 },
};

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
