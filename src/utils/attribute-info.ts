/**
 * What the style panel knows about a source's attributes.
 *
 * Two different questions are asked of one pass over the data, and they want
 * different amounts of it. *What type is this column* is answered by a handful
 * of values — reading a hundred thousand of them proves nothing the first
 * hundred did not. *How many different values does it have* can only be
 * answered by looking at every one: the count decides whether a column is
 * offered for colouring at all, whether it is dismissed as a key, and what the
 * panel tells the user it contains.
 *
 * Sampling both together is what made a layer of 1798 NUTS regions report 8
 * different `CNTR_CODE`s. The first 200 features of that file are sorted by
 * region id, so they are AL, AT, BE, BG, CH, CY, CZ and DE — the sample was a
 * faithful account of the first tenth of the file and a wrong account of the
 * file, and the panel repeated it as fact.
 */

export interface SourceAttributeInfo {
    name: string;
    type: string;
    /** A bounded sample, enough to infer the type from. */
    values: unknown[];
    /** How many features carry the attribute; counted over all of them. */
    presentCount: number;
    /** How many do not. */
    missingCount: number;
    /** Distinct values, counted over all features rather than the sample. */
    uniqueCount: number;
}

/** How many values are kept per attribute to infer its type from. */
const TYPE_SAMPLE_SIZE = 200;

/**
 * Reads every feature once: an exact present/distinct count per attribute, and
 * a small sample of values to infer the type from.
 */
export function collectAttributeInfo(features: GeoJSON.Feature[] | null): SourceAttributeInfo[] {
    if (!features) return [];
    const attributes = new Map<string, { values: unknown[]; distinct: Set<string>; presentCount: number }>();

    for (const feature of features) {
        const properties = feature.properties;
        if (!properties || typeof properties !== 'object') continue;
        for (const [key, value] of Object.entries(properties)) {
            let entry = attributes.get(key);
            if (!entry) {
                entry = { values: [], distinct: new Set(), presentCount: 0 };
                attributes.set(key, entry);
            }
            if (value === null || value === undefined) continue;
            if (entry.values.length < TYPE_SAMPLE_SIZE) entry.values.push(value);
            entry.distinct.add(String(value));
            entry.presentCount += 1;
        }
    }

    return [...attributes.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([name, entry]) => ({
            name,
            type: inferAttributeType(entry.values),
            values: entry.values,
            presentCount: entry.presentCount,
            missingCount: features.length - entry.presentCount,
            uniqueCount: entry.distinct.size,
        }));
}

export function inferAttributeType(values: unknown[]): string {
    if (values.length === 0) return 'unknown';
    const types = new Set(values.map(valueType));
    return types.size === 1 ? [...types][0] : 'mixed';
}

function valueType(value: unknown): string {
    if (typeof value === 'number') return 'number';
    if (typeof value === 'boolean') return 'boolean';
    if (value instanceof Date) return 'date';
    if (Array.isArray(value)) return 'array';
    if (value && typeof value === 'object') return 'object';
    if (typeof value === 'string') return looksLikeDate(value) ? 'date' : 'string';
    return 'unknown';
}

function looksLikeDate(value: string): boolean {
    if (!/^\d{4}-\d{2}-\d{2}(?:[T ][\d:.+-Z]*)?$/.test(value)) return false;
    return !Number.isNaN(Date.parse(value));
}
