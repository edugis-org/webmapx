// src/utils/thematic-map.ts
//
// What "Map this" in the data analyzer draws, decided by cartographic rule
// rather than by what the source layer happened to be styled with:
//
// - an absolute quantity (a count, a total) is shown by *size* — proportional
//   circles for points, proportional width for lines;
// - a relative quantity (a rate, a share, a density) is shown by *colour*;
// - an absolute quantity on polygons is never a choropleth, because a big
//   polygon then reads as "a lot" for being big. It is normalised to a density
//   per km² first, and the density is what gets classified.
//
// The output is always a new GeoJSON layer: a copy can carry new attributes
// (`area_km2`, `<field>_per_km2`) whatever the source was, and for a tile-backed
// source it makes plain that the result holds only what was drawn.

import { featureArea } from './geo-calculations';

export type MeasureKind = 'absolute' | 'relative';
export type GeometryKind = 'polygon' | 'line' | 'point' | 'mixed' | 'none';

/** Words in a name or unit that mark a value as already relative to something. */
// `(^|[^a-z])per([^a-z]|$)` rather than `\bper\b`: in snake_case the underscore
// is a word character, so `\b` never matched `adressen_per_km2`.
const RELATIVE_HINT = /%|‰|(^|[^a-z])per([^a-z]|$)|\/|pct|percent|procent|perc|ratio|rate|share|aandeel|dens|dichtheid|gemiddeld|average|mean|avg|median|index/i;

/** A column of few small whole numbers is a class or code (urbanity 1–5), not a count. */
const MAX_ORDINAL_DISTINCT = 12;
const MAX_ORDINAL_VALUE = 20;

/**
 * Whether a numeric column is an absolute quantity or already relative.
 *
 * A heuristic, so the tool lets the user switch it. Name and unit are the
 * strongest evidence; failing that, values that stay within 0–1 or carry
 * fractions within 0–100 read as shares, and everything else as a count.
 */
export function measureKind(field: string, values: readonly number[], unit = ''): MeasureKind {
    if (RELATIVE_HINT.test(field) || RELATIVE_HINT.test(unit)) return 'relative';
    const finite = values.filter(Number.isFinite);
    if (finite.length === 0) return 'absolute';
    const min = Math.min(...finite);
    const max = Math.max(...finite);
    if (min >= 0 && max <= 1) return 'relative';
    if (finite.every(Number.isInteger) && max <= MAX_ORDINAL_VALUE && new Set(finite).size <= MAX_ORDINAL_DISTINCT) return 'relative';
    const fractional = finite.some(value => !Number.isInteger(value));
    if (fractional && min >= 0 && max <= 100) return 'relative';
    return 'absolute';
}

/** The geometry a layer consists of, collapsing multi-types into their family. */
export function geometryKind(features: readonly GeoJSON.Feature[]): GeometryKind {
    const kinds = new Set<GeometryKind>();
    for (const feature of features) {
        const type = feature.geometry?.type;
        if (type === 'Polygon' || type === 'MultiPolygon') kinds.add('polygon');
        else if (type === 'LineString' || type === 'MultiLineString') kinds.add('line');
        else if (type === 'Point' || type === 'MultiPoint') kinds.add('point');
    }
    if (kinds.size === 0) return 'none';
    return kinds.size === 1 ? [...kinds][0] : 'mixed';
}

export interface DensityResult {
    features: GeoJSON.Feature[];
    /** Name of the attribute holding the density. */
    densityField: string;
    /** Parts sharing identical attributes that were counted as one feature. */
    partCount: number;
    groupCount: number;
    /** Why exploded parts were *not* grouped, when they looked exploded but the evidence was too weak. */
    groupingSkipped: string | null;
}

/** Name of the area attribute written into every output feature. */
export const AREA_FIELD = 'area_km2';

/**
 * Copies polygon features with their area and `<field>_per_km2` added.
 *
 * A layer may have been exploded — a country's population repeated on every
 * island — and dividing by each part's own area would give a tiny island an
 * absurd density. Parts are therefore grouped, but **only when every attribute
 * is identical**: a shared province or trade-area code is not evidence of
 * exploding, it is what a municipality layer looks like. The feature `id` is
 * ignored, since exploding often assigns fresh ids. And identical attributes
 * only count as evidence when there is more to compare than the mapped value
 * itself — two municipalities can have the same population by chance.
 */
export function densityFeatures(features: readonly GeoJSON.Feature[], field: string): DensityResult {
    const densityField = `${field}_per_km2`;
    const polygons = features.filter(feature => feature.geometry && featureArea(feature.geometry) > 0);

    const otherAttributes = (properties: GeoJSON.GeoJsonProperties): string[] =>
        Object.keys(properties ?? {}).filter(key => key !== field && key !== AREA_FIELD && key !== densityField);
    const hasEvidence = polygons.some(feature => otherAttributes(feature.properties).length > 0);

    const keyOf = (feature: GeoJSON.Feature, index: number): string => {
        if (!hasEvidence) return `#${index}`;
        const properties = feature.properties ?? {};
        return JSON.stringify(Object.keys(properties).sort().map(key => [key, properties[key]]));
    };

    const areas = polygons.map(feature => featureArea(feature.geometry) / 1e6);
    const groupArea = new Map<string, number>();
    polygons.forEach((feature, index) => {
        const key = keyOf(feature, index);
        groupArea.set(key, (groupArea.get(key) ?? 0) + areas[index]);
    });

    const out = polygons.map((feature, index): GeoJSON.Feature => {
        const area = groupArea.get(keyOf(feature, index)) ?? areas[index];
        const raw = feature.properties?.[field];
        const value = raw === null || raw === undefined || raw === '' ? NaN : Number(raw);
        return {
            type: 'Feature',
            ...(feature.id !== undefined ? { id: feature.id } : {}),
            geometry: feature.geometry,
            properties: {
                ...(feature.properties ?? {}),
                [AREA_FIELD]: roundTo(area, 6),
                [densityField]: Number.isFinite(value) && area > 0 ? roundTo(value / area, 6) : null,
            },
        };
    });

    const looksExploded = !hasEvidence && new Set(polygons.map(f => JSON.stringify(f.properties ?? {}))).size < polygons.length;
    return {
        features: out,
        densityField,
        partCount: polygons.length,
        groupCount: groupArea.size,
        groupingSkipped: looksExploded
            ? `Some polygons share the value of ${field} but have no other attributes to tell whether they are parts of one feature, so each is measured on its own.`
            : null,
    };
}

/** Rounds to significant digits, so a density does not carry sixteen of them into the info tool. */
function roundTo(value: number, digits: number): number {
    return value === 0 || !Number.isFinite(value) ? value : Number(value.toPrecision(digits));
}

/**
 * A line width proportional to the value: zero draws nothing, the largest
 * value draws `maxWidth`. Linear, unlike a circle's radius, because a line's
 * width is already the one dimension the eye compares.
 */
export function proportionalLineWidth(field: string, maxValue: number, maxWidth = 12): unknown[] {
    const top = maxValue > 0 ? maxValue : 1;
    return ['interpolate', ['linear'], ['to-number', ['get', field], 0], 0, 0.5, top, maxWidth];
}

/** Colour of the zero class: lighter than any class colour, and not the grey of no data. */
export const ZERO_CLASS_COLOR = '#ffffff';

/**
 * Whether zero should be a class of its own, and the features to classify the rest from.
 *
 * Zero is usually a different *kind* of answer — no inhabitants, no incidents —
 * rather than the low end of the range, and a quantile or natural-breaks class
 * that lumps it in with small positive values hides exactly that. So zero is
 * split off whenever it occurs alongside positive values. Not when the data has
 * negatives: there zero is the middle of a diverging scale, not an absence.
 */
export function zeroClass(features: readonly GeoJSON.Feature[], field: string): { split: boolean; zeroCount: number; rest: GeoJSON.Feature[] } {
    let zeroCount = 0;
    let positive = 0;
    let negative = 0;
    const rest: GeoJSON.Feature[] = [];
    for (const feature of features) {
        const raw = feature.properties?.[field];
        const value = raw === null || raw === undefined || raw === '' ? NaN : Number(raw);
        if (value === 0) zeroCount++;
        else {
            if (value > 0) positive++;
            if (value < 0) negative++;
            rest.push(feature);
        }
    }
    const split = zeroCount > 0 && positive > 0 && negative === 0;
    return { split, zeroCount, rest: split ? rest : [...features] };
}

/**
 * Adds the zero class to a colour expression: after the no-data guards, which
 * must still win for a missing value, and before the classes.
 */
export function withZeroClass(field: string, colorExpression: unknown, zeroColor = ZERO_CLASS_COLOR): unknown {
    const zeroBranch = [['==', ['get', field], 0], zeroColor];
    if (Array.isArray(colorExpression) && colorExpression[0] === 'case') {
        const fallback = colorExpression[colorExpression.length - 1];
        return [...colorExpression.slice(0, -1), ...zeroBranch, fallback];
    }
    return ['case', ...zeroBranch, colorExpression];
}

/**
 * Which features are parts of one exploded feature: a unit number per feature.
 *
 * The same rule as the density grouping, usable without a mapped field: parts
 * share a unit only when *every* attribute is identical, and only when there
 * are at least two non-empty attributes to compare — a lone value identical in
 * two features is a coincidence, not evidence. Only polygons are grouped;
 * identical points are separate observations.
 */
export function identicalAttributeGroups(features: readonly GeoJSON.Feature[]): { groups: number[]; unitCount: number } {
    const units = new Map<string, number>();
    const groups = features.map((feature, index) => {
        const type = feature.geometry?.type;
        const properties = feature.properties ?? {};
        const filled = Object.values(properties).filter(value => value !== null && value !== undefined && value !== '').length;
        const key = (type === 'Polygon' || type === 'MultiPolygon') && filled >= 2
            ? JSON.stringify(Object.keys(properties).sort().map(k => [k, properties[k]]))
            : `#${index}`;
        let unit = units.get(key);
        if (unit === undefined) { unit = units.size; units.set(key, unit); }
        return unit;
    });
    return { groups, unitCount: units.size };
}

/**
 * A style with every `['get', field]` and `['has', field]` replaced.
 *
 * The classification is computed on a field that exists only in memory (a
 * density), and the style written for it names that field. On the original
 * source the field does not exist, so its reads become the expression that
 * computes it — the map then styles the source itself, and a saved map points
 * at the real data instead of at a snapshot of it.
 */
export function substituteField(node: unknown, field: string, value: unknown, has: unknown): unknown {
    if (Array.isArray(node)) {
        // A null guard on the field cannot survive as `computed == null`: the
        // expression is a number, and MapLibre refuses to compare it with null.
        if (node.length === 3 && node[0] === '==' && node[2] === null
            && Array.isArray(node[1]) && node[1][0] === 'get' && node[1][1] === field) {
            return ['!', has];
        }
        if (node.length === 2 && node[1] === field && node[0] === 'get') return value;
        if (node.length === 2 && node[1] === field && node[0] === 'has') return has;
        return node.map(child => substituteField(child, field, value, has));
    }
    if (node && typeof node === 'object') {
        return Object.fromEntries(Object.entries(node).map(([key, child]) => [key, substituteField(child, field, value, has)]));
    }
    return node;
}

/**
 * Square kilometres per unit of an area field — 0.01 for hectares, 1e-6 for
 * m² — as the median ratio of measured area to the field's value.
 *
 * A median, because the measured area is of what is drawn: a feature cut by
 * the view edge or simplified hard gives a wild ratio, and most features give
 * the right one. Null when no feature has both.
 */
export function areaUnitFactor(features: readonly GeoJSON.Feature[], areaField: string): number | null {
    const ratios: number[] = [];
    for (const feature of features) {
        const value = Number(feature.properties?.[areaField]);
        if (!Number.isFinite(value) || value <= 0) continue;
        const km2 = featureArea(feature.geometry) / 1e6;
        if (km2 > 0) ratios.push(km2 / value);
    }
    if (ratios.length === 0) return null;
    ratios.sort((a, b) => a - b);
    const middle = ratios.length >> 1;
    const median = ratios.length % 2 ? ratios[middle] : (ratios[middle - 1] + ratios[middle]) / 2;
    // Measured areas are estimates — tile geometry is simplified, small polygons
    // most of all — so the median is near the unit, not on it. Units are mostly
    // powers of ten a hundredfold apart (m², ha, km²): snap within a factor 1.3.
    const decade = 10 ** Math.round(Math.log10(median));
    return Math.max(median / decade, decade / median) < 1.3 ? decade : Number(median.toPrecision(3));
}
