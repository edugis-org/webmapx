import { createExpression, featureFilter } from '@maplibre/maplibre-gl-style-spec';

type FeatureLike = { properties?: Record<string, unknown> | null; geometry?: { type: string } | null };

function makeEvalFeature(f: FeatureLike): any {
    return { type: 'Feature', properties: f.properties ?? {}, geometry: f.geometry ?? { type: 'Point', coordinates: [0, 0] } };
}

const colorSpec: any = { type: 'color', 'property-type': 'data-driven', transition: false, overridable: false, expression: { interpolated: true, parameters: ['zoom', 'feature'] } };
const numberSpec: any = { type: 'number', 'property-type': 'data-driven', transition: false, overridable: false, expression: { interpolated: true, parameters: ['zoom', 'feature'] } };
const booleanSpec: any = { type: 'boolean', 'property-type': 'data-driven', transition: false, overridable: false, expression: { interpolated: false, parameters: ['zoom', 'feature'] } };

function evaluateColor(expression: unknown, feature: FeatureLike, zoom: number, fallback: string): string {
    if (typeof expression === 'string') return expression;
    if (!Array.isArray(expression)) return fallback;
    const result = createExpression(expression as any, colorSpec);
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
    const result = createExpression(expression as any, numberSpec);
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
    const result = createExpression(expression as any, booleanSpec);
    if (result.result !== 'success') return fallback;
    try {
        return Boolean(result.value.evaluate({ zoom }, makeEvalFeature(feature)));
    } catch {
        return fallback;
    }
}

// Normalize Multi* geometry types to base types (like MapLibre does for $type)
function normalizeGeometryType(type: string): string {
    switch (type) {
        case 'MultiPoint': return 'Point';
        case 'MultiLineString': return 'LineString';
        case 'MultiPolygon': return 'Polygon';
        default: return type;
    }
}

function matchesFilter(expression: unknown, feature: FeatureLike, zoom = 0): boolean {
    if (!expression) return true;
    if (!Array.isArray(expression)) return true;

    // Use featureFilter for legacy filters (handles $type, $id correctly)
    try {
        const compiled = featureFilter(expression as any);
        // featureFilter expects type to be the geometry type, not "Feature"
        // Normalize Multi* types to base types (MapLibre does this for $type filters)
        const geometryType = normalizeGeometryType(feature.geometry?.type ?? 'Point');
        const filterFeature = {
            type: geometryType,
            properties: feature.properties ?? {},
            geometry: feature.geometry ?? { type: 'Point', coordinates: [0, 0] }
        };
        return compiled.filter({ zoom }, filterFeature);
    } catch {
        // Fall back to expression evaluation
        return evaluateBoolean(expression, feature, zoom, true);
    }
}

export { evaluateColor, evaluateNumber, evaluateBoolean, matchesFilter };
