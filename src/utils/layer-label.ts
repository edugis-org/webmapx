export function metadataLabel(metadata: Record<string, unknown> | null | undefined): string | null {
    for (const key of ['label', 'title', 'webmapx:title']) {
        const value = metadata?.[key];
        if (typeof value === 'string' && value.length > 0) return value;
    }
    return null;
}

export function styleSublayerLabel(
    sublayer: Record<string, unknown> | null | undefined,
    fallbackId?: string,
): string | null {
    const label = styleSublayerMetadataLabel(sublayer);
    if (label) return label;

    const rawId = typeof fallbackId === 'string' ? fallbackId : typeof sublayer?.id === 'string' ? sublayer.id : '';
    return rawId ? rawId.replace(/^style:/, '').replace(/-/g, ' ') : null;
}

export function styleSublayerMetadataLabel(sublayer: Record<string, unknown> | null | undefined): string | null {
    const metadata = sublayer?.metadata && typeof sublayer.metadata === 'object'
        ? sublayer.metadata as Record<string, unknown>
        : null;
    return metadataLabel(metadata);
}

export function styleSublayerTypeLabel(sublayer: Record<string, unknown> | null | undefined): string | null {
    const type = typeof sublayer?.type === 'string' ? sublayer.type : '';
    if (!type) return null;
    if (type === 'symbol') return 'label';
    if (type === 'circle') return 'points';
    return type;
}

/** Words that say how something is drawn, not what it is: an id made only of these names nothing. */
const GENERIC_ID_WORDS = new Set([
    'edit', 'copy', 'new', 'layer', 'layers', 'sublayer', 'style', 'default',
    'fill', 'line', 'symbol', 'circle', 'raster', 'background', 'hillshade', 'heatmap', 'extrusion',
    'label', 'labels', 'points', 'outline',
]);

/**
 * A sublayer id as words, or null when it is not made of any.
 *
 * Hand-written styles name their layers (`landuse_residential`,
 * `road_motorway_casing`), and that is the best description there is. Generated
 * ones do not (`aacf212ue3f_edit_layer3__`, a UUID), and showing those is worse
 * than showing nothing, so a token mixing letters and digits, or a
 * token without a vowel rejects the whole id. The parent layer's id is stripped
 * first: `world-countries-fill` says `fill`, which is only the type.
 */
export function readableSublayerId(id: string, parentLayerId?: string): string | null {
    let rest = id.replace(/^style:/, '');
    if (parentLayerId && rest.startsWith(parentLayerId)) rest = rest.slice(parentLayerId.length);
    const tokens = rest.toLowerCase().split(/[\s_\-:.]+/).filter(Boolean);
    if (tokens.length === 0) return null;
    for (const token of tokens) {
        if (/[a-z]/.test(token) && /\d/.test(token)) return null;
        if (/^[a-z]+$/.test(token) && token.length > 1 && !/[aeiouy]/.test(token)) return null;
    }
    if (tokens.every((token) => GENERIC_ID_WORDS.has(token) || /^\d+$/.test(token))) return null;
    return tokens.join(' ');
}

/** Attribute values a filter selects on, from the simple forms styles use. */
function filterValues(filter: unknown, out: string[] = []): string[] {
    if (!Array.isArray(filter)) return out;
    const [op, a, b] = filter;
    const isGet = Array.isArray(a) && a[0] === 'get' && typeof a[1] === 'string';
    if (op === 'all') {
        for (const part of filter.slice(1)) filterValues(part, out);
    } else if (op === '==' && (isGet || typeof a === 'string') && (typeof b === 'string' || typeof b === 'number')) {
        // Legacy filters name the property bare: ["==", "class", "wood"].
        if (!isGet && (a === '$type' || a === '$id')) return out;
        out.push(String(b));
    } else if (op === 'match' && isGet && filter[filter.length - 1] === false) {
        const values = Array.isArray(b) ? b : [b];
        out.push(...values.filter((v): v is string | number => typeof v === 'string' || typeof v === 'number').map(String));
    }
    return out;
}

/**
 * A sublayer described by what it draws: `landcover: wood`, from its
 * source-layer and the value its filter selects. For styles whose ids say
 * nothing but whose data does.
 */
export function sublayerDataLabel(sublayer: Record<string, unknown> | null | undefined): string | null {
    const sourceLayer = typeof sublayer?.['source-layer'] === 'string' ? sublayer['source-layer'] as string : '';
    const values = filterValues(sublayer?.filter).map((v) => v.replace(/_/g, ' '));
    const name = sourceLayer.replace(/_/g, ' ');
    if (name && values.length > 0) return `${name}: ${values.join(', ')}`;
    return name || null;
}

export function legendSublayerLabel(
    parentMetadata: Record<string, unknown> | null | undefined,
    sublayer: Record<string, unknown> | null | undefined,
    fallbackId: string,
    singleSublayer: boolean,
    parentLayerId?: string,
): string {
    // A sublayer's own name wins even when it is the only one: that is where the
    // styler writes a rename, and a layer's name falling back in behind it is
    // what the style is called until someone gives it one of its own.
    if (singleSublayer) {
        return styleSublayerMetadataLabel(sublayer) ?? metadataLabel(parentMetadata) ?? styleSublayerTypeLabel(sublayer) ?? '';
    }
    // Several: each needs telling apart. Its own name, else its id when that
    // is words, else what it draws, and only then its type.
    return styleSublayerMetadataLabel(sublayer)
        ?? readableSublayerId(fallbackId, parentLayerId)
        ?? sublayerDataLabel(sublayer)
        ?? styleSublayerTypeLabel(sublayer)
        ?? fallbackId.replace(/^style:/, '').replace(/-/g, ' ');
}
