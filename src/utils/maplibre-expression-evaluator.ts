import { createExpression, featureFilter } from '@maplibre/maplibre-gl-style-spec';
import type { Feature as MapLibreFeature } from '@maplibre/maplibre-gl-style-spec';

type FeatureLike = {
    id?: string | number;
    properties?: Record<string, unknown> | null;
    geometry?: { type: string } | null;
};

function makeEvalFeature(feature: FeatureLike): MapLibreFeature {
    return {
        type: normalizeGeometryType(feature.geometry?.type),
        id: feature.id,
        properties: feature.properties ?? {}
    };
}

const colorSpec: any = { type: 'color', 'property-type': 'data-driven', transition: false, overridable: false, expression: { interpolated: true, parameters: ['zoom', 'feature'] } };
const numberSpec: any = { type: 'number', 'property-type': 'data-driven', transition: false, overridable: false, expression: { interpolated: true, parameters: ['zoom', 'feature'] } };
const booleanSpec: any = { type: 'boolean', 'property-type': 'data-driven', transition: false, overridable: false, expression: { interpolated: false, parameters: ['zoom', 'feature'] } };
const stringSpec: any = { type: 'string', 'property-type': 'data-driven', transition: false, overridable: false, expression: { interpolated: false, parameters: ['zoom', 'feature'] } };

// createExpression()/featureFilter() parse and validate the whole expression tree, which is
// too expensive to redo for every single feature (data-driven paint properties get evaluated
// once per entity/feature — large layers have tens of thousands of them). Cache the compiled
// result per expression array (by reference — callers always pass the same paint/layout
// array instance for a given style layer) so repeated evaluate() calls are cheap.
const colorExprCache = new WeakMap<object, ReturnType<typeof createExpression>>();
const numberExprCache = new WeakMap<object, ReturnType<typeof createExpression>>();
const booleanExprCache = new WeakMap<object, ReturnType<typeof createExpression>>();
const stringExprCache = new WeakMap<object, ReturnType<typeof createExpression>>();
const filterCache = new WeakMap<object, ReturnType<typeof featureFilter>>();

function evaluateColor(expression: unknown, feature: FeatureLike, zoom: number, fallback: string): string {
    if (typeof expression === 'string') return expression;
    if (!Array.isArray(expression)) return fallback;
    let result = colorExprCache.get(expression);
    if (!result) {
        result = createExpression(expression as any, colorSpec);
        colorExprCache.set(expression, result);
    }
    if (result.result !== 'success') return fallback;
    try {
        const origWarn = console.warn;
        console.warn = () => {};
        let color: any;
        try { color = result.value.evaluate({ zoom }, makeEvalFeature(feature)); }
        finally { console.warn = origWarn; }
        const str = color?.toString?.() ?? fallback;
        return str && str !== 'null' ? str : fallback;
    } catch {
        return fallback;
    }
}

function evaluateNumber(expression: unknown, feature: FeatureLike, zoom: number, fallback: number): number {
    if (typeof expression === 'number') return expression;
    if (!Array.isArray(expression)) return fallback;
    let result = numberExprCache.get(expression);
    if (!result) {
        result = createExpression(expression as any, numberSpec);
        numberExprCache.set(expression, result);
    }
    if (result.result !== 'success') return fallback;
    try {
        const val = result.value.evaluate({ zoom }, makeEvalFeature(feature));
        return typeof val === 'number' && Number.isFinite(val) ? val : fallback;
    } catch {
        return fallback;
    }
}

function evaluateBoolean(expression: unknown, feature: FeatureLike, zoom: number, fallback: boolean): boolean {
    if (typeof expression === 'boolean') return expression;
    if (!Array.isArray(expression)) return fallback;
    let result = booleanExprCache.get(expression);
    if (!result) {
        result = createExpression(expression as any, booleanSpec);
        booleanExprCache.set(expression, result);
    }
    if (result.result !== 'success') return fallback;
    try {
        return Boolean(result.value.evaluate({ zoom }, makeEvalFeature(feature)));
    } catch {
        return fallback;
    }
}

/** Legacy mapbox-gl "token" syntax, e.g. `"{NamenNL}"`. MapLibre GL JS resolves these natively
 *  at render time (`resolveTokens`); our own evaluator must do the same since it evaluates
 *  text-field independently of the real MapLibre renderer. */
function resolveTokens(template: string, feature: FeatureLike): string {
    return template.replace(/\{([^{}]+)\}/g, (match, key) => {
        const val = feature.properties?.[key];
        return val == null ? '' : String(val);
    });
}

function evaluateString(expression: unknown, feature: FeatureLike, zoom: number, fallback: string): string {
    if (typeof expression === 'string') return /\{[^{}]+\}/.test(expression) ? resolveTokens(expression, feature) : expression;
    if (!Array.isArray(expression)) return fallback;
    let result = stringExprCache.get(expression);
    if (!result) {
        result = createExpression(expression as any, stringSpec);
        stringExprCache.set(expression, result);
    }
    if (result.result !== 'success') return fallback;
    try {
        const val = result.value.evaluate({ zoom }, makeEvalFeature(feature));
        return val == null ? fallback : String(val);
    } catch {
        return fallback;
    }
}

// Normalize Multi* geometry types to base types (like MapLibre does for $type)
function normalizeGeometryType(type = 'Point'): MapLibreFeature['type'] {
    switch (type) {
        case 'MultiPoint': return 'Point';
        case 'MultiLineString': return 'LineString';
        case 'MultiPolygon': return 'Polygon';
        case 'Point':
        case 'LineString':
        case 'Polygon':
        case 'Unknown':
            return type;
        default:
            return 'Unknown';
    }
}

function matchesFilter(expression: unknown, feature: FeatureLike, zoom = 0): boolean {
    if (!expression) return true;
    if (!Array.isArray(expression)) return true;

    // Use featureFilter for legacy filters (handles $type, $id correctly)
    try {
        let compiled = filterCache.get(expression);
        if (!compiled) {
            compiled = featureFilter(expression as any);
            filterCache.set(expression, compiled);
        }
        // featureFilter expects type to be the geometry type, not "Feature"
        // Normalize Multi* types to base types (MapLibre does this for $type filters)
        const filterFeature: MapLibreFeature = {
            type: normalizeGeometryType(feature.geometry?.type),
            id: feature.id,
            properties: feature.properties ?? {},
        };
        return compiled.filter({ zoom }, filterFeature);
    } catch {
        // Fall back to expression evaluation
        return evaluateBoolean(expression, feature, zoom, true);
    }
}

export { evaluateColor, evaluateNumber, evaluateBoolean, evaluateString, matchesFilter };
