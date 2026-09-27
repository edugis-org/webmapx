/**
 * Whether a feature can possibly pass a MapLibre filter, judged from its
 * properties alone.
 *
 * Used to give a filtered GeoJSON sublayer a source holding only the features
 * it can draw. OpenLayers restyles a layer by running its style function over
 * every feature of its source, so a layer split into 51 classes that shared one
 * source ran all 45 000 features through the style function for every class
 * that changed colour — 8 frames a second while the sea level tool played,
 * against 60 with a source per class.
 *
 * This only ever narrows, never decides: the style function still applies the
 * real filter to what is left. So anything this cannot evaluate exactly —
 * geometry type, zoom, expressions it does not know — answers `true`, and a
 * feature is dropped only when the filter certainly rejects it.
 */
export function mayMatchFilter(filter: unknown, props: Record<string, unknown>): boolean {
    return evaluate(filter, props) !== false;
}

/** Whether a filter is worth a narrowed source: it can reject something by properties alone. */
export function isSelectiveFilter(filter: unknown): boolean {
    if (!Array.isArray(filter) || filter.length === 0) return false;
    const [op, ...args] = filter;
    if (op === 'all') return args.some(isSelectiveFilter);
    if (op === 'any') return args.length > 0 && args.every(isSelectiveFilter);
    return COMPARISONS.has(op as string) && args.length === 2 && propertyOf(args[0], args[1]) !== null && isLiteral(args[1]);
}

const COMPARISONS = new Set(['==', '!=', '<', '<=', '>', '>=']);

/** true: may match; false: certainly does not; null: cannot tell. */
function evaluate(filter: unknown, props: Record<string, unknown>): boolean | null {
    if (!Array.isArray(filter) || filter.length === 0) return null;
    const [op, ...args] = filter;
    if (op === 'all') {
        let result: boolean | null = true;
        for (const arg of args) {
            const r = evaluate(arg, props);
            if (r === false) return false;
            if (r === null) result = null;
        }
        return result;
    }
    if (op === 'any') {
        let result: boolean | null = false;
        for (const arg of args) {
            const r = evaluate(arg, props);
            if (r === true) return true;
            if (r === null) result = null;
        }
        return result;
    }
    if (!COMPARISONS.has(op as string) || args.length !== 2) return null;
    const key = propertyOf(args[0], args[1]);
    if (key === null || !isLiteral(args[1])) return null;
    return compare(op as string, props[key], literalOf(args[1]));
}

/**
 * `['get', 'k']`, or a bare property name in the legacy filter syntax — which
 * MapLibre only assumes when neither operand is an array. In an expression
 * (`['==', 'k', ['literal', 1]]`) a bare string is a string, not a property.
 */
function propertyOf(value: unknown, other: unknown): string | null {
    if (Array.isArray(value) && value[0] === 'get' && value.length === 2 && typeof value[1] === 'string') return value[1];
    // `$type` and `$id` are the legacy spellings of geometry type and feature id.
    if (typeof value === 'string' && !Array.isArray(other) && !value.startsWith('$')) return value;
    return null;
}

function isLiteral(value: unknown): boolean {
    if (Array.isArray(value)) return value[0] === 'literal' && value.length === 2 && !Array.isArray(value[1]);
    return value === null || ['string', 'number', 'boolean'].includes(typeof value);
}

function literalOf(value: unknown): unknown {
    return Array.isArray(value) ? value[1] : value;
}

/**
 * MapLibre's comparison semantics: equality is strict, and an ordering
 * comparison between values of different types is false rather than coerced.
 */
function compare(op: string, a: unknown, b: unknown): boolean {
    if (op === '==') return a === b;
    if (op === '!=') return a !== b;
    if (typeof a !== typeof b || (typeof a !== 'number' && typeof a !== 'string')) return false;
    const x = a as number | string;
    const y = b as number | string;
    if (op === '<') return x < y;
    if (op === '<=') return x <= y;
    if (op === '>') return x > y;
    return x >= y;
}
