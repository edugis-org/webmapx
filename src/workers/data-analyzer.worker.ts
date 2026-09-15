import { analyzeDataset, type AnalyzerSuggestion, type DatasetAnalysis, type SpatialPattern } from '../utils/data-analyzer';
import { featureArea } from '../utils/geo-calculations';
import { buildWeights, globalMoran, localMoran, type LisaClass, type SpatialWeights } from '../utils/spatial-autocorrelation';
import { identicalAttributeGroups, measureKind } from '../utils/thematic-map';
import { logTransform, looksLikeArea, suggestsLog } from '../utils/value-shape';
import { compositionTypes, type CompositionTypes } from '../utils/composition-profile';

export interface DataAnalyzerAnalyzeRequest {
    op?: 'analyze';
    properties: GeoJSON.GeoJsonProperties[];
    /** Parallel to `properties`; omitted or all null when the layer has no geometry to test. */
    geometries?: (GeoJSON.Geometry | null)[];
    complete: boolean;
}

/** How one field is prepared before it is tested. */
export interface LisaField {
    field: string;
    /** Values to treat as missing, from the analysis' no-data detection. */
    noData: number[];
    density: boolean;
    log: boolean;
}

export interface DataAnalyzerLisaRequest {
    op: 'lisa';
    properties: GeoJSON.GeoJsonProperties[];
    geometries: (GeoJSON.Geometry | null)[];
    /** Several fields share one set of neighbours, which is the expensive part to build. */
    fields: LisaField[];
}

export interface DataAnalyzerProfileRequest {
    op: 'profile';
    properties: GeoJSON.GeoJsonProperties[];
    /** The parts of one composition, each with its own no-data values. */
    fields: Array<{ field: string; noData: number[] }>;
}

export type DataAnalyzerRequest = DataAnalyzerAnalyzeRequest | DataAnalyzerLisaRequest | DataAnalyzerProfileRequest;

export interface LisaResult {
    field: string;
    density: boolean;
    log: boolean;
    /** One class per input feature, parts of an exploded feature sharing theirs. */
    classes: LisaClass[];
    counts: Record<LisaClass, number>;
    neighbours: SpatialWeights['method'];
    unitCount: number;
}

export type DataAnalyzerResponse =
    | { status: 'progress'; message: string }
    | { status: 'ok'; analysis: DatasetAnalysis }
    | { status: 'lisa'; results: LisaResult[] }
    | { status: 'profile'; types: CompositionTypes | null }
    | { status: 'error'; message: string };

/** Fields tested for spatial pattern; each is O(features × neighbours), so bounded. */
const MAX_SPATIAL_FIELDS = 40;
/** A pattern worth a suggestion: clearly clustered, not merely significant on a big layer. */
const MIN_SUGGESTED_I = 0.15;
const MAX_SUGGESTED_P = 0.001;
const MAX_SPATIAL_SUGGESTIONS = 4;

function post(response: DataAnalyzerResponse): void {
    self.postMessage(response);
}

function isPolygonal(geometries: readonly (GeoJSON.Geometry | null)[]): boolean {
    return geometries.some(g => g?.type === 'Polygon' || g?.type === 'MultiPolygon');
}

interface Units {
    groups: number[];
    unitCount: number;
    /** Ground area per unit in km²; 0 for non-polygons. */
    area: number[];
    weights: SpatialWeights;
}

function prepareUnits(properties: GeoJSON.GeoJsonProperties[], geometries: (GeoJSON.Geometry | null)[]): Units {
    const features = properties.map((p, i) => ({ type: 'Feature' as const, geometry: geometries[i], properties: p }));
    const { groups, unitCount } = identicalAttributeGroups(features as GeoJSON.Feature[]);
    const area = new Array<number>(unitCount).fill(0);
    geometries.forEach((geometry, i) => { area[groups[i]] += featureArea(geometry) / 1e6; });
    return { groups, unitCount, area, weights: buildWeights(geometries, groups, unitCount) };
}

/**
 * One raw value per unit. Parts of an exploded feature carry identical
 * attributes by definition, so the first part's value speaks for the unit.
 */
function rawUnitValues(units: Units, properties: GeoJSON.GeoJsonProperties[], field: string, noData: ReadonlySet<number>): number[] {
    const values = new Array<number>(units.unitCount).fill(NaN);
    const filled = new Uint8Array(units.unitCount);
    properties.forEach((p, i) => {
        const unit = units.groups[i];
        if (filled[unit]) return;
        filled[unit] = 1;
        const raw = p?.[field];
        const value = raw === null || raw === undefined || raw === '' || typeof raw === 'boolean' ? NaN : Number(raw);
        if (Number.isFinite(value) && !noData.has(value)) values[unit] = value;
    });
    return values;
}

/** Raw values → per km² (a count on polygons) → log (strongly skewed), as asked. */
function preparedValues(units: Units, raw: number[], density: boolean, log: boolean): number[] {
    const values = density ? raw.map((v, unit) => (units.area[unit] > 0 ? v / units.area[unit] : NaN)) : raw;
    return log ? logTransform(values) : values;
}

function spatialSuggestions(patterns: SpatialPattern[]): AnalyzerSuggestion[] {
    return patterns
        .filter(p => p.i >= MIN_SUGGESTED_I && p.p <= MAX_SUGGESTED_P)
        .sort((a, b) => b.i - a.i)
        .slice(0, MAX_SPATIAL_SUGGESTIONS)
        .map(p => ({
            id: `spatial:${p.field}`,
            title: `${p.field}${p.density ? ' per km²' : ''} forms clusters`,
            kind: 'spatial' as const,
            strength: Math.min(0.9, 0.35 + p.i * 0.6),
            description: `Similar values lie next to each other more than chance would give (Moran's I ${p.i.toFixed(2)}, z ${p.z.toFixed(1)}, ${p.n} features${p.log ? ', log scale' : ''}, neighbours by ${p.neighbours === 'contiguity' ? 'shared borders' : 'distance'}).`,
            fields: [p.field],
        }));
}

function analyze(request: DataAnalyzerAnalyzeRequest): void {
    const { properties, complete } = request;
    post({ status: 'progress', message: `Calculating on ${properties.length} features...` });
    const features = properties.map(p => ({ type: 'Feature' as const, geometry: { type: 'Point' as const, coordinates: [0, 0] }, properties: p }));
    const analysis = analyzeDataset(features, complete);

    const geometries = request.geometries;
    if (geometries && geometries.some(Boolean) && analysis.usableNumericFields.length > 0) {
        post({ status: 'progress', message: 'Looking for spatial patterns...' });
        const units = prepareUnits(properties, geometries);
        const polygonal = isPolygonal(geometries);
        const profiles = new Map(analysis.profiles.map(p => [p.name, p]));
        const patterns: SpatialPattern[] = [];
        const areaFields: string[] = [];
        for (const field of analysis.usableNumericFields.slice(0, MAX_SPATIAL_FIELDS)) {
            const noData = new Set((profiles.get(field)?.suspectedNoData ?? []).map(item => item.value));
            const raw = rawUnitValues(units, properties, field, noData);
            // An area measurement follows the measured area whatever its unit,
            // and divided by area it is only a unit conversion factor.
            const isArea = polygonal && looksLikeArea(raw, units.area);
            if (isArea) areaFields.push(field);
            // Only by value: a count on polygons would otherwise find that big
            // areas lie next to big areas.
            const density = polygonal && !isArea && measureKind(field, raw) === 'absolute';
            const perKm2 = preparedValues(units, raw, density, false);
            const log = suggestsLog(perKm2);
            const result = globalMoran(units.weights, log ? logTransform(perKm2) : perKm2);
            if (result) patterns.push({ field, density, log, i: result.i, z: result.z, p: result.p, n: result.n, neighbours: units.weights.method });
        }
        analysis.spatial = patterns;
        analysis.areaFields = areaFields;
        analysis.suggestions = [...analysis.suggestions, ...spatialSuggestions(patterns)]
            .sort((a, b) => b.strength - a.strength)
            .slice(0, 12);
    }
    post({ status: 'ok', analysis });
}

function lisa(request: DataAnalyzerLisaRequest): void {
    const { properties, geometries, fields } = request;
    post({ status: 'progress', message: `Finding neighbours for ${properties.length} features...` });
    const units = prepareUnits(properties, geometries);
    const results: LisaResult[] = fields.map((spec, index) => {
        post({ status: 'progress', message: `Testing ${spec.field} for local clusters (${index + 1} of ${fields.length})...` });
        const raw = rawUnitValues(units, properties, spec.field, new Set(spec.noData));
        const local = localMoran(units.weights, preparedValues(units, raw, spec.density, spec.log));
        const classes = units.groups.map(unit => local.classes[unit]);
        const counts: Record<LisaClass, number> = { 'high-high': 0, 'low-low': 0, 'high-low': 0, 'low-high': 0, 'not-significant': 0, 'no-data': 0 };
        for (const c of classes) counts[c]++;
        return { field: spec.field, density: spec.density, log: spec.log, classes, counts, neighbours: units.weights.method, unitCount: units.unitCount };
    });
    post({ status: 'lisa', results });
}

function profile(request: DataAnalyzerProfileRequest): void {
    post({ status: 'progress', message: `Finding composition types in ${request.properties.length} features...` });
    const noData = request.fields.map(spec => new Set(spec.noData));
    const rows = request.properties.map(p => request.fields.map((spec, d) => {
        const raw = p?.[spec.field];
        const value = raw === null || raw === undefined || raw === '' || typeof raw === 'boolean' ? NaN : Number(raw);
        return Number.isFinite(value) && !noData[d].has(value) ? value : NaN;
    }));
    post({ status: 'profile', types: compositionTypes(rows) });
}

self.onmessage = (event: MessageEvent<DataAnalyzerRequest>) => {
    try {
        if (event.data.op === 'lisa') lisa(event.data);
        else if (event.data.op === 'profile') profile(event.data);
        else analyze(event.data);
    } catch (error) {
        post({ status: 'error', message: error instanceof Error ? error.message : String(error) });
    }
};
