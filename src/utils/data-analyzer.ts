export interface NumericStats {
    min: number;
    max: number;
    mean: number;
    median: number;
    standardDeviation: number;
}

export interface FieldProfile {
    name: string;
    total: number;
    missing: number;
    unique: number;
    numeric: number;
    numericShare: number;
    dataType: 'integer' | 'number' | 'text';
    family: string;
    role: 'measure' | 'id' | 'constant' | 'mostly-missing' | 'text';
    stats?: NumericStats;
    suspectedNoData: Array<{ value: number; count: number; reason: string }>;
    topValues: Array<{ value: string; count: number }>;
}

export interface CorrelationResult {
    a: string;
    b: string;
    r: number;
    n: number;
}

export interface AnalyzerSuggestion {
    id: string;
    title: string;
    kind: 'map' | 'relationship' | 'hygiene' | 'family' | 'spatial';
    strength: number;
    description: string;
    fields: string[];
}

export interface AttributeFamilyBorder {
    index: number;
    afterField: string;
    beforeField: string;
    reason: string;
    confidence: number;
}

export interface DatasetAnalysis {
    featureCount: number;
    complete: boolean;
    profiles: FieldProfile[];
    usableNumericFields: string[];
    families: Array<{ name: string; fields: string[]; reason?: string }>;
    familyBorders: AttributeFamilyBorder[];
    correlations: CorrelationResult[];
    suggestions: AnalyzerSuggestion[];
    /** Global Moran's I per usable numeric field; absent when the features carry no geometry. */
    spatial?: SpatialPattern[];
    /** Fields whose values follow the features' measured area: an area in some unit, never to be divided by area. */
    areaFields?: string[];
}

export interface SpatialPattern {
    field: string;
    /** Whether the value was turned into a density per km² first (a count on polygons). */
    density: boolean;
    /** Whether the values were log-transformed first, because they were strongly skewed. */
    log: boolean;
    i: number;
    z: number;
    p: number;
    n: number;
    neighbours: 'contiguity' | 'nearest';
}

const CBS_NO_DATA = new Set([99996, 99997, 99998, 99999]);
const RASTER_NO_DATA = new Set([-9999, -99999, -32768, -2147483648]);

const FAMILY_PATTERNS: Array<{ name: string; patterns: RegExp[] }> = [
    {
        name: 'Demography',
        patterns: [
            /bevolk|inwon|personen|leeftijd|ouder|jong|man|vrouw|geslacht|ongehuwd|gehuwd|gescheid|verweduwd|herkomst/i,
            /(^|[^a-z])age([^a-z]|$)|population|inhabitant|male|female|gender/i,
            /poblaci[oó]n|habitante|edad|hombre|mujer|sexo/i,
            /v[aä]est[oö]|asukas|ik[aä]|mies|nainen|sukupuoli/i,
            /πληθυσ|κατοικ|ηλικ|ανδρ|γυναικ|φυλο/i,
        ],
    },
    {
        name: 'Households',
        patterns: [
            /huishoud|gezin|alleenstaand|woningbezetting/i,
            /household|family/i,
            /hogar|familia|unipersonal/i,
            /asuntokunta|kotitalo|perhe|yksinas/i,
            /νοικοκυρ|οικογεν|μονοπροσωπ/i,
        ],
    },
    {
        name: 'Income',
        patterns: [
            /inkomen|welvaart|vermogen|uitkering|arbeid|werkloos/i,
            /income|wealth|benefit|employment|unemployment/i,
            /ingreso|renta|riqueza|subsidio|empleo|paro|desempleo/i,
            /tulo|varallisuus|etuus|ty[oö]|ty[oö]tt[oö]/i,
            /εισοδη|πλουτ|επιδο|εργασ|ανεργ/i,
        ],
    },
    {
        name: 'Mobility',
        patterns: [
            /auto|motor|fiets|ov|verkeer/i,
            /mobility|car|vehicle|transport/i,
            /coche|auto|veh[ií]culo|transporte|tr[aá]fico/i,
            /auto|ajoneuvo|liikenne|kuljetus/i,
            /αυτοκιν|οχημ|μεταφορ|κυκλοφορ/i,
        ],
    },
    {
        name: 'Housing',
        patterns: [
            /woning|huur|koop|woz|bouwjaar/i,
            /house|home|rent|owner|property/i,
            /vivienda|alquiler|propiedad|casa/i,
            /asunto|vuokra|omistus|talo/i,
            /κατοικ|ενοικ|ιδιοκτη|σπιτ/i,
        ],
    },
    {
        name: 'Spatial',
        patterns: [
            /oppervlak|dichtheid|stedelijk|adres/i,
            /urban|density|area|hectare|km2/i,
            /superficie|densidad|urbano|direcci[oó]n/i,
            /pinta.?ala|tiheys|kaupunki|osoite/i,
            /εκταση|πυκνοτ|αστικ|διευθυν/i,
        ],
    },
];

function familyFor(name: string): string {
    return FAMILY_PATTERNS.find(group => group.patterns.some(pattern => pattern.test(name)))?.name ?? 'Other';
}

function asNumber(value: unknown): number | null {
    if (typeof value === 'number') return Number.isFinite(value) ? value : null;
    if (typeof value !== 'string') return null;
    const trimmed = value.trim();
    if (!trimmed) return null;
    const normalized = trimmed.includes(',') && !trimmed.includes('.') ? trimmed.replace(',', '.') : trimmed;
    const number = Number(normalized);
    return Number.isFinite(number) ? number : null;
}

function isMissing(value: unknown): boolean {
    return value === null || value === undefined || (typeof value === 'string' && value.trim() === '');
}

function median(values: number[]): number {
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function stats(values: number[]): NumericStats {
    const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
    const variance = values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length;
    return {
        min: Math.min(...values),
        max: Math.max(...values),
        mean,
        median: median(values),
        standardDeviation: Math.sqrt(variance),
    };
}

function topValues(values: unknown[]): Array<{ value: string; count: number }> {
    const counts = new Map<string, number>();
    for (const value of values) {
        const key = value === null ? 'null' : value === undefined ? 'undefined' : String(value);
        counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return [...counts.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([value, count]) => ({ value, count }));
}

function suspectedNoData(values: number[], counts: Map<number, number>, s: NumericStats): Array<{ value: number; count: number; reason: string }> {
    const result: Array<{ value: number; count: number; reason: string }> = [];
    const normalMax = percentile(values, 0.95);
    const normalMin = percentile(values, 0.05);
    for (const [value, count] of counts) {
        if (CBS_NO_DATA.has(value)) {
            result.push({ value, count, reason: 'CBS missing-value code' });
        } else if (RASTER_NO_DATA.has(value)) {
            result.push({ value, count, reason: 'common raster no-data value' });
        } else if (Number.isInteger(value) && count > 1 && s.standardDeviation > 0 && Math.abs(value - s.median) > s.standardDeviation * 8) {
            result.push({ value, count, reason: 'repeated extreme value' });
        } else if (Number.isInteger(value) && count > 1 && value > 1000 && normalMax < 1000 && value > normalMax * 10) {
            result.push({ value, count, reason: 'far above normal range' });
        } else if (Number.isInteger(value) && count > 1 && value < -1000 && normalMin > -1000) {
            result.push({ value, count, reason: 'far below normal range' });
        }
    }
    return result.sort((a, b) => b.count - a.count);
}

function percentile(values: number[], p: number): number {
    if (values.length === 0) return NaN;
    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.min(sorted.length - 1, Math.max(0, Math.floor((sorted.length - 1) * p)));
    return sorted[index];
}

function hasIdName(name: string): boolean {
    return /(^|_)(objectid|fid|gid|ident|id)($|_)|(^|_)code$|_code$|code$/i.test(name);
}

function looksLikeCodeValues(values: unknown[], featureCount: number): boolean {
    const nonMissing = values.filter(value => !isMissing(value));
    if (nonMissing.length < Math.min(8, featureCount)) return false;
    const uniqueShare = new Set(nonMissing.map(value => String(value))).size / Math.max(1, nonMissing.length);
    if (uniqueShare < 0.85) return false;
    return nonMissing.every(value => {
        if (typeof value !== 'string') return false;
        const text = value.trim();
        return text.length <= 24 && /[a-z]/i.test(text) && /[0-9]/.test(text) && /^[a-z0-9_.:-]+$/i.test(text);
    });
}

function profileField(name: string, rawValues: unknown[], featureCount: number): FieldProfile {
    const missing = rawValues.filter(isMissing).length;
    const nonMissing = rawValues.filter(value => !isMissing(value));
    const unique = new Set(nonMissing.map(value => String(value))).size;
    const numericValues = nonMissing.map(asNumber).filter((value): value is number => value !== null);
    const numericShare = nonMissing.length ? numericValues.length / nonMissing.length : 0;
    const dataType = numericShare >= 0.8
        ? (numericValues.length > 0 && numericValues.every(Number.isInteger) ? 'integer' : 'number')
        : 'text';
    const counts = new Map<number, number>();
    for (const value of numericValues) counts.set(value, (counts.get(value) ?? 0) + 1);

    const preliminaryStats = numericValues.length ? stats(numericValues) : undefined;
    const noData = preliminaryStats ? suspectedNoData(numericValues, counts, preliminaryStats) : [];
    const noDataValues = new Set(noData.map(item => item.value));
    const validNumericValues = numericValues.filter(value => !noDataValues.has(value));
    const numericStats = validNumericValues.length ? stats(validNumericValues) : undefined;
    const likelyId = hasIdName(name) || looksLikeCodeValues(nonMissing, featureCount);

    let role: FieldProfile['role'] = 'text';
    if (missing / Math.max(1, featureCount) > 0.8) role = 'mostly-missing';
    else if (unique <= 1) role = 'constant';
    else if (numericShare >= 0.8) role = likelyId ? 'id' : 'measure';
    else if (likelyId) role = 'id';

    return {
        name,
        total: featureCount,
        missing,
        unique,
        numeric: numericValues.length,
        numericShare,
        dataType,
        family: familyFor(name),
        role,
        ...(numericStats ? { stats: numericStats } : {}),
        suspectedNoData: noData,
        topValues: topValues(rawValues),
    };
}

function comparableNumber(feature: GeoJSON.Feature, field: string): number | null {
    const value = asNumber(feature.properties?.[field]);
    if (value === null || CBS_NO_DATA.has(value) || RASTER_NO_DATA.has(value)) return null;
    return value;
}

function relationshipScore(features: GeoJSON.Feature[], target: string, parts: string[], expected: number | null): number {
    let compared = 0;
    let matching = 0;
    for (const feature of features) {
        const values = parts.map(field => comparableNumber(feature, field));
        if (values.some(value => value === null)) continue;
        const sum = (values as number[]).reduce((total, value) => total + value, 0);
        const targetValue = expected ?? comparableNumber(feature, target);
        if (targetValue === null) continue;
        const tolerance = expected === null ? Math.max(1, Math.abs(targetValue) * 0.02) : 1.5;
        compared++;
        if (Math.abs(sum - targetValue) <= tolerance) matching++;
    }
    return compared >= Math.max(4, features.length * 0.5) ? matching / compared : 0;
}

function complementaryScore(features: GeoJSON.Feature[], a: string, b: string, expected: number): number {
    return relationshipScore(features, '', [a, b], expected);
}

function sharedWords(fields: string[]): string[] {
    const stop = new Set(['pct', 'perc', 'percentage', 'aantal', 'totaal', 'total', 'sum', 'of', 'van', 'de', 'het']);
    const wordSets = fields.map(field => new Set(field.toLowerCase().split(/[^a-z0-9]+/).filter(word => word.length > 2 && !stop.has(word))));
    if (wordSets.length === 0) return [];
    return [...wordSets[0]].filter(word => wordSets.every(set => set.has(word)));
}

function compositionName(fields: string[]): string {
    const words = sharedWords(fields);
    if (words[0]) return `Composition: ${words[0]}`;
    return `Composition: ${fields.slice(0, 3).join(' + ')}`;
}

function detectAttributeFamilies(features: GeoJSON.Feature[], profiles: FieldProfile[]): Array<{ name: string; fields: string[]; reason?: string }> {
    const families = new Map<string, { fields: Set<string>; reason?: string }>();
    const addFamily = (name: string, fields: string[], reason?: string) => {
        const existing = families.get(name) ?? { fields: new Set<string>(), reason };
        for (const field of fields) existing.fields.add(field);
        existing.reason ??= reason;
        families.set(name, existing);
    };

    for (const profile of profiles.filter(p => p.role === 'measure')) {
        addFamily(profile.family, [profile.name], 'recognized from field names');
    }

    const measures = profiles.filter(p => p.role === 'measure' && p.numericShare >= 0.8);
    for (const group of correlatedGroups(features, measures.map(profile => profile.name))) {
        addFamily('Statistical group', group, 'fields move together across the data');
    }

    const explicitPercentFields = measures
        .filter(profile => /(^|_)(pct|perc|percentage)|(%|pct|perc|percentage)$/i.test(profile.name))
        .map(profile => profile.name);
    const boundedPercentFields = measures
        .filter(profile => profile.stats && profile.stats.min >= 0 && profile.stats.max <= 100)
        .map(profile => profile.name);
    const percentFields = explicitPercentFields.length >= 2 ? explicitPercentFields : boundedPercentFields;

    for (const fields of orderedCompositionCandidates(percentFields.slice(0, 24), 2, 8)) {
        if (relationshipScore(features, '', fields, 100) < 0.85) continue;
        addFamily(compositionName(fields), fields, 'fields add up to about 100%');
    }

    for (let i = 0; i < boundedPercentFields.length; i++) {
        for (let j = i + 1; j < boundedPercentFields.length; j++) {
            if (complementaryScore(features, boundedPercentFields[i], boundedPercentFields[j], 100) >= 0.85) {
                addFamily('Complementary percentages', [boundedPercentFields[i], boundedPercentFields[j]], 'two fields add up to about 100%');
            }
        }
    }

    for (let totalIndex = 0; totalIndex < measures.length; totalIndex++) {
        const total = measures[totalIndex];
        const candidates = measures
            .map((profile, index) => ({ profile, distance: Math.abs(index - totalIndex) }))
            .filter(({ profile }) => profile.name !== total.name && profile.stats && total.stats)
            .filter(({ profile }) => profile.stats!.mean <= total.stats!.mean * 1.02)
            .sort((a, b) => a.distance - b.distance)
            .slice(0, 12);
        for (let i = 0; i < candidates.length; i++) {
            for (let j = i + 1; j < candidates.length; j++) {
                const parts = [candidates[i].profile.name, candidates[j].profile.name];
                if (relationshipScore(features, total.name, parts, null) >= 0.85) {
                    addFamily(`Total: ${total.name}`, [total.name, ...parts], 'parts add up to this total');
                }
            }
        }
    }

    return [...families.entries()]
        .map(([name, value]) => ({ name, fields: [...value.fields], ...(value.reason ? { reason: value.reason } : {}) }))
        .filter(family => family.name !== 'Other' || family.fields.length > 1)
        .sort((a, b) => b.fields.length - a.fields.length);
}

function correlatedGroups(features: GeoJSON.Feature[], fields: string[]): string[][] {
    const parent = new Map<string, string>();
    const find = (field: string): string => {
        const p = parent.get(field) ?? field;
        if (p === field) return p;
        const root = find(p);
        parent.set(field, root);
        return root;
    };
    const union = (a: string, b: string) => {
        const ra = find(a);
        const rb = find(b);
        if (ra !== rb) parent.set(rb, ra);
    };

    for (const field of fields) parent.set(field, field);
    for (let i = 0; i < fields.length; i++) {
        for (let j = i + 1; j < fields.length; j++) {
            const a: number[] = [];
            const b: number[] = [];
            for (const feature of features) {
                const va = comparableNumber(feature, fields[i]);
                const vb = comparableNumber(feature, fields[j]);
                if (va === null || vb === null) continue;
                a.push(va);
                b.push(vb);
            }
            const r = pearson(a, b);
            if (Number.isFinite(r) && Math.abs(r) >= 0.92) union(fields[i], fields[j]);
        }
    }

    const groups = new Map<string, string[]>();
    for (const field of fields) {
        const root = find(field);
        groups.set(root, [...(groups.get(root) ?? []), field]);
    }
    return [...groups.values()].filter(group => group.length >= 3).slice(0, 8);
}

function orderedCompositionCandidates(values: string[], minSize: number, maxSize: number): string[][] {
    const result: string[][] = [];
    for (let start = 0; start < values.length; start++) {
        for (let size = minSize; size <= maxSize && start + size <= values.length; size++) {
            result.push(values.slice(start, start + size));
        }
    }
    return result.sort((a, b) => b.length - a.length);
}

function fieldFamilyNames(field: string, families: Array<{ name: string; fields: string[]; reason?: string }>): Set<string> {
    return new Set(families.filter(family => family.fields.includes(field)).map(family => family.name));
}

function adjacentSimilarity(
    features: GeoJSON.Feature[],
    left: FieldProfile,
    right: FieldProfile,
    families: Array<{ name: string; fields: string[]; reason?: string }>,
): number {
    let score = 0;
    if (left.role === right.role && left.role !== 'measure') score += 0.25;
    if (left.family !== 'Other' && left.family === right.family) score += 0.4;

    const leftFamilies = fieldFamilyNames(left.name, families);
    const rightFamilies = fieldFamilyNames(right.name, families);
    for (const family of leftFamilies) {
        if (rightFamilies.has(family)) score += family.startsWith('Statistical') ? 0.35 : 0.7;
    }

    if (left.role === 'measure' && right.role === 'measure') {
        const a: number[] = [];
        const b: number[] = [];
        for (const feature of features) {
            const va = comparableNumber(feature, left.name);
            const vb = comparableNumber(feature, right.name);
            if (va === null || vb === null) continue;
            a.push(va);
            b.push(vb);
        }
        const r = pearson(a, b);
        if (Number.isFinite(r) && Math.abs(r) >= 0.75) score += 0.35;
        if (left.stats && right.stats && left.stats.min >= 0 && right.stats.min >= 0 && left.stats.max <= 100 && right.stats.max <= 100) {
            if (complementaryScore(features, left.name, right.name, 100) >= 0.85) score += 0.7;
        }
    }

    return Math.min(1, score);
}

function detectFamilyBorders(
    features: GeoJSON.Feature[],
    profiles: FieldProfile[],
    families: Array<{ name: string; fields: string[]; reason?: string }>,
): AttributeFamilyBorder[] {
    const borders: AttributeFamilyBorder[] = [];
    for (let i = 1; i < profiles.length; i++) {
        const left = profiles[i - 1];
        const right = profiles[i];
        const similarity = adjacentSimilarity(features, left, right, families);
        if (similarity >= 0.35) continue;

        const differentNamedFamily = left.family !== right.family && (left.family !== 'Other' || right.family !== 'Other');
        const differentRole = left.role !== right.role;
        const reason = differentRole
            ? `${left.role} field followed by ${right.role} field`
            : differentNamedFamily
                ? `${left.family} followed by ${right.family}`
                : 'weak statistical connection to neighboring field';

        borders.push({
            index: i,
            afterField: left.name,
            beforeField: right.name,
            reason,
            confidence: 1 - similarity,
        });
    }
    return borders;
}

function pearson(a: number[], b: number[]): number {
    const n = Math.min(a.length, b.length);
    if (n < 3) return NaN;
    const meanA = a.reduce((sum, value) => sum + value, 0) / n;
    const meanB = b.reduce((sum, value) => sum + value, 0) / n;
    let numerator = 0;
    let denomA = 0;
    let denomB = 0;
    for (let i = 0; i < n; i++) {
        const da = a[i] - meanA;
        const db = b[i] - meanB;
        numerator += da * db;
        denomA += da * da;
        denomB += db * db;
    }
    const denom = Math.sqrt(denomA * denomB);
    return denom === 0 ? NaN : numerator / denom;
}

function correlations(features: GeoJSON.Feature[], fields: string[]): CorrelationResult[] {
    const results: CorrelationResult[] = [];
    for (let i = 0; i < fields.length; i++) {
        for (let j = i + 1; j < fields.length; j++) {
            const a: number[] = [];
            const b: number[] = [];
            for (const feature of features) {
                const va = asNumber(feature.properties?.[fields[i]]);
                const vb = asNumber(feature.properties?.[fields[j]]);
                if (va === null || vb === null || CBS_NO_DATA.has(va) || CBS_NO_DATA.has(vb) || RASTER_NO_DATA.has(va) || RASTER_NO_DATA.has(vb)) continue;
                a.push(va);
                b.push(vb);
            }
            const r = pearson(a, b);
            if (Number.isFinite(r) && Math.abs(r) >= 0.55) results.push({ a: fields[i], b: fields[j], r, n: a.length });
        }
    }
    return results.sort((x, y) => Math.abs(y.r) - Math.abs(x.r)).slice(0, 12);
}

function isPercentageField(name: string, profile?: FieldProfile): boolean {
    return /(^|_)(pct|perc|percentage)|(%|pct|perc|percentage)$/i.test(name)
        || Boolean(profile?.stats && profile.stats.min >= 0 && profile.stats.max <= 100 && /deel|share|proportion|rate|ratio/i.test(name));
}

function isDerivedRateField(name: string): boolean {
    return /percentage|(^|_)pct|(^|_)perc|dichtheid|density|gemiddeld|average|mean|per_|_per_|per$/i.test(name);
}

function isAbsoluteCountField(name: string): boolean {
    return /^aantal_|_aantal$|count|total|totaal|mannen|vrouwen|hombres|mujeres|miehet|naiset|ανδρες|γυναικες/i.test(name);
}

function isMetadataMeasure(name: string): boolean {
    return /dekkingspercentage|coverage|indelingswijziging|jaar|year/i.test(name);
}

function totalPartFields(families: Array<{ name: string; fields: string[]; reason?: string }>): Set<string> {
    const parts = new Set<string>();
    for (const family of families) {
        if (family.reason !== 'parts add up to this total') continue;
        for (const field of family.fields.slice(1)) parts.add(field);
    }
    return parts;
}

function structuralFamilyMap(families: Array<{ name: string; fields: string[]; reason?: string }>): Map<string, Set<string>> {
    const result = new Map<string, Set<string>>();
    for (const family of families) {
        if (!family.reason || family.reason === 'recognized from field names' || family.reason === 'fields move together across the data') continue;
        for (const field of family.fields) {
            const names = result.get(field) ?? new Set<string>();
            names.add(family.name);
            result.set(field, names);
        }
    }
    return result;
}

function sameStructuralFamily(a: string, b: string, structuralFamilies: Map<string, Set<string>>): boolean {
    const left = structuralFamilies.get(a);
    const right = structuralFamilies.get(b);
    if (!left || !right) return false;
    return [...left].some(name => right.has(name));
}

function familySuggestionStrength(family: { name: string; fields: string[]; reason?: string }): number {
    if (family.reason === 'fields add up to about 100%') return 0.98;
    if (family.reason === 'two fields add up to about 100%') return 0.9;
    if (family.reason === 'parts add up to this total') return 0.82;
    if (family.reason === 'fields move together across the data') return 0.74;
    return Math.min(0.72, 0.42 + family.fields.length / 20);
}

function familySuggestionDescription(family: { name: string; fields: string[]; reason?: string }): string {
    if (family.reason === 'fields add up to about 100%') {
        return 'These fields form one composition, so a profile or typology map is more useful than separate choropleths.';
    }
    if (family.reason === 'parts add up to this total') {
        return 'These fields are parts of one total; map the total or the proportions, not each raw part as an independent pattern.';
    }
    if (family.reason === 'fields move together across the data') {
        return 'These fields mostly express the same underlying dimension and should be interpreted together.';
    }
    return `${family.fields.length} related fields can be compared together or used later for PCA/clustering.`;
}

function suggestions(
    profiles: FieldProfile[],
    families: Array<{ name: string; fields: string[]; reason?: string }>,
    correlationResults: CorrelationResult[],
): AnalyzerSuggestion[] {
    const output: AnalyzerSuggestion[] = [];
    const profileByName = new Map(profiles.map(profile => [profile.name, profile]));
    const partsOfTotals = totalPartFields(families);
    const structuralFamilies = structuralFamilyMap(families);
    const hygiene = profiles.filter(profile => profile.suspectedNoData.length || profile.role !== 'measure');
    if (hygiene.length) {
        output.push({
            id: 'hygiene',
            title: 'Review data hygiene',
            kind: 'hygiene',
            strength: Math.min(1, hygiene.length / Math.max(1, profiles.length)),
            description: `${hygiene.length} fields look like IDs, constants, mostly missing fields, or contain possible no-data codes.`,
            fields: hygiene.slice(0, 8).map(profile => profile.name),
        });
    }

    for (const family of families) {
        if (family.fields.length < 3) continue;
        output.push({
            id: `family:${family.name}`,
            title: `${family.name} profile`,
            kind: 'family',
            strength: familySuggestionStrength(family),
            description: familySuggestionDescription(family),
            fields: family.fields.slice(0, 8),
        });
    }

    for (const profile of profiles.filter(p => p.role === 'measure' && p.stats && p.stats.standardDeviation > 0)) {
        if (partsOfTotals.has(profile.name)) continue;
        if (isMetadataMeasure(profile.name)) continue;
        const range = profile.stats!.max - profile.stats!.min;
        const relativeSpread = Math.abs(profile.stats!.mean) > 1e-9 ? range / Math.abs(profile.stats!.mean) : range;
        if (relativeSpread < 0.1) continue;
        const derivedBoost = isDerivedRateField(profile.name) || isPercentageField(profile.name, profile) ? 0.35 : 0;
        const countPenalty = isAbsoluteCountField(profile.name) ? 0.62 : 0;
        const noDataPenalty = profile.suspectedNoData.length ? 0.25 : 0;
        const cap = isAbsoluteCountField(profile.name) ? 0.62 : 0.86;
        const strength = Math.max(0.05, Math.min(cap, relativeSpread / 5 + derivedBoost - countPenalty - noDataPenalty));
        if (strength < 0.18) continue;
        output.push({
            id: `map:${profile.name}`,
            title: `Map ${profile.name}`,
            kind: 'map',
            strength,
            description: `${profile.name} varies enough across features to be a useful thematic map.`,
            fields: [profile.name],
        });
    }

    for (const correlation of correlationResults.slice(0, 8)) {
        if (partsOfTotals.has(correlation.a) || partsOfTotals.has(correlation.b)) continue;
        if (sameStructuralFamily(correlation.a, correlation.b, structuralFamilies)) continue;
        if (isMetadataMeasure(correlation.a) || isMetadataMeasure(correlation.b)) continue;
        const a = profileByName.get(correlation.a);
        const b = profileByName.get(correlation.b);
        const derived = [correlation.a, correlation.b].some((field, index) => isDerivedRateField(field) || isPercentageField(field, index === 0 ? a : b));
        const sameNamedFamily = a?.family === b?.family && a?.family !== 'Other';
        output.push({
            id: `corr:${correlation.a}:${correlation.b}`,
            title: `${correlation.a} ${correlation.r > 0 ? 'rises with' : 'contrasts with'} ${correlation.b}`,
            kind: 'relationship',
            strength: Math.min(0.92, Math.abs(correlation.r) - (derived ? 0 : 0.12) - (sameNamedFamily ? 0.2 : 0)),
            description: `Correlation r=${correlation.r.toFixed(2)} across ${correlation.n} comparable features.`,
            fields: [correlation.a, correlation.b],
        });
    }

    return output.sort((a, b) => b.strength - a.strength).slice(0, 10);
}

export function analyzeDataset(features: GeoJSON.Feature[], complete = true): DatasetAnalysis {
    const fields = new Set<string>();
    for (const feature of features) {
        for (const key of Object.keys(feature.properties ?? {})) fields.add(key);
    }

    const profiles = [...fields].map(field => profileField(
        field,
        features.map(feature => feature.properties?.[field]),
        features.length,
    ));
    const usableNumericFields = profiles
        .filter(profile => profile.role === 'measure' && profile.numericShare >= 0.8 && !profile.suspectedNoData.some(item => item.count / Math.max(1, profile.numeric) > 0.25))
        .map(profile => profile.name);

    const correlationResults = correlations(features, usableNumericFields.slice(0, 40));
    const families = detectAttributeFamilies(features, profiles);
    const familyBorders = detectFamilyBorders(features, profiles, families);

    return {
        featureCount: features.length,
        complete,
        profiles,
        usableNumericFields,
        families,
        familyBorders,
        correlations: correlationResults,
        suggestions: suggestions(profiles, families, correlationResults),
    };
}
