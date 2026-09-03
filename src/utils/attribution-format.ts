import { html, TemplateResult } from 'lit';
import type { AnyLayerConfig, CompositeStyleLayerConfig, SourceConfig } from '../config/types';

const URL_REGEX = /(https?:\/\/[^\s<"]+)/g;
const HREF_REGEX = /<a\s[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;

/** Resolves the attribution text for a layer config from its source(s) (via sub-layers for style layers). */
export function resolveLayerAttribution(
    layer: AnyLayerConfig | undefined,
    sourcesById: Map<string, SourceConfig>
): string | undefined {
    if (!layer) return undefined;

    if (layer.type === 'style') {
        // Style layers may pull in many remote sources not enumerated locally —
        // allow a layer-level attribution override.
        const styleAttribution = (layer as CompositeStyleLayerConfig).attribution;
        if (typeof styleAttribution === 'string') {
            return styleAttribution;
        }
    }

    const subLayers = layer.type === 'style'
        ? ((layer as CompositeStyleLayerConfig).layers ?? [])
        : [layer];
    // A composite layer may bring its own sources rather than name catalog ones
    // — that is what makes it self-contained, and it is the shape a tool-made
    // layer always has. Those ids are not in the map of top-level sources, so
    // looking only there found nothing and the layer's credit went unshown.
    const ownSources = (layer as { sources?: unknown }).sources;
    const ownSourceAttribution = (sourceId: string): string | undefined => {
        if (!ownSources || typeof ownSources !== 'object') return undefined;
        const source = Array.isArray(ownSources)
            ? (ownSources as Array<{ id?: string; attribution?: unknown }>).find(entry => entry?.id === sourceId)
            : (ownSources as Record<string, { attribution?: unknown }>)[sourceId];
        return typeof source?.attribution === 'string' ? source.attribution : undefined;
    };

    for (const sub of subLayers) {
        const sourceId = (sub as any).source;
        if (!sourceId) continue;
        const source = sourcesById.get(sourceId);
        if (source && typeof source.attribution === 'string') {
            return source.attribution;
        }
        const own = ownSourceAttribution(sourceId);
        if (own) return own;
    }
    return undefined;
}

/**
 * What a credit says, with how it is written taken out.
 *
 * The same body is credited in as many spellings as there are configs — linked
 * or plain, `&copy;` or `©`, one space or two — and a reader sees one sentence
 * either way. Comparing the rendered words is what lets two layers crediting
 * OpenStreetMap produce one line instead of two.
 */
export function attributionMeaning(text: string): string {
    return stripTags(decodeEntities(text))
        .toLowerCase()
        .replace(/[\s\u00a0]+/g, ' ')
        .replace(/[.,;:]+$/, '')
        .trim();
}

export function stripTags(text: string): string {
    return text.replace(/<[^>]+>/g, '');
}

export function decodeEntities(text: string): string {
    return text
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&copy;/g, '©')
        .replace(/&reg;/g, '®')
        .replace(/&trade;/g, '™')
        .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
        .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCharCode(parseInt(h, 16)));
}

function targetForUrl(href: string): string {
    try {
        const { hostname } = new URL(href);
        return `_attr_${hostname.replace(/[^a-z0-9]/gi, '_')}`;
    } catch {
        return '_attr_link';
    }
}

/**
 * Renders an attribution string as a lit TemplateResult: `<a href="...">label</a>` and bare
 * URLs become real links (opened in a per-host named tab); any other markup is stripped to
 * plain text after decoding HTML entities. Keeps rendering identical between the attribution
 * control and the layer info dialog.
 */
export function renderAttributionText(text: string): TemplateResult {
    type Segment = string | { href: string; label: string };
    const segments: Segment[] = [];
    let lastIndex = 0;

    HREF_REGEX.lastIndex = 0;
    for (const match of text.matchAll(HREF_REGEX)) {
        const index = match.index ?? 0;
        if (index > lastIndex) {
            segments.push(stripTags(decodeEntities(text.slice(lastIndex, index))));
        }
        segments.push({ href: match[1], label: stripTags(decodeEntities(match[2])) });
        lastIndex = index + match[0].length;
    }
    const remaining = text.slice(lastIndex);

    URL_REGEX.lastIndex = 0;
    let urlLastIndex = 0;
    for (const match of remaining.matchAll(URL_REGEX)) {
        const index = match.index ?? 0;
        if (index > urlLastIndex) {
            segments.push(stripTags(decodeEntities(remaining.slice(urlLastIndex, index))));
        }
        let label = match[0];
        try { label = new URL(match[0]).hostname.replace(/^www\./, ''); } catch { /* keep full url */ }
        segments.push({ href: match[0], label });
        urlLastIndex = index + match[0].length;
    }
    if (urlLastIndex < remaining.length) {
        segments.push(stripTags(decodeEntities(remaining.slice(urlLastIndex))));
    }

    return html`<span class="attribution-item">
        ${segments.map((segment) =>
            typeof segment === 'string'
                ? html`${segment}`
                : html`<a href=${segment.href} target=${targetForUrl(segment.href)} rel="noopener noreferrer">${segment.label}</a>`
        )}
    </span>`;
}

/** One visible layer, as the two attribution surfaces can each describe it. */
export interface AttributionLayer {
    /** The catalog's config for this layer, where it has one. */
    catalogLayer?: AnyLayerConfig;
    /** `store.mapLayers[id].attribution` — what `registerMapLayer` lifted off an inline source. */
    entryAttribution?: string;
    /** `store.mapLayers[id].sourceId`, for asking the engine as a last resort. */
    sourceId?: string;
}

/**
 * The credits a map is showing, in order, each body once.
 *
 * Shared by the on-screen control and the print tool, because they were two
 * implementations of one rule and drifted apart exactly as you would expect:
 * the printed map went on asking the engine for a runtime layer's credit long
 * after the screen had learnt to read the store, so an isochrone, a route or a
 * search result was credited on screen and silently missing from the print.
 *
 * Where a layer's credit is found is a three-step fallback, and the order
 * matters. The catalog config is the richest answer where it exists. A runtime
 * layer has none, so the store's entry is next — it is the *only* place a
 * composite layer's credit can be read, since its sources reach the engine
 * under a scoped id the engine alone knows. Asking the engine comes last, for a
 * plain runtime layer whose source was registered by id.
 */
export function collectAttributions(
    layers: AttributionLayer[],
    sourcesById: Map<string, SourceConfig>,
    engineAttribution?: (sourceId: string) => string | undefined,
): string[] {
    const indexByMeaning = new Map<string, number>();
    const collected: string[] = [];

    const add = (text: string | undefined): void => {
        if (!text) return;
        for (const part of text.split('|')) {
            const trimmed = part.trim();
            if (!trimmed) continue;
            const meaning = attributionMeaning(trimmed);
            if (!meaning) continue;
            const existing = indexByMeaning.get(meaning);
            if (existing === undefined) {
                indexByMeaning.set(meaning, collected.length);
                collected.push(trimmed);
                continue;
            }
            // Same credit, better written: a spelling that links to the licence
            // is worth more to the reader than a bare one, and which of the two
            // arrives first is an accident of layer order.
            if (trimmed.includes('<a') && !collected[existing].includes('<a')) {
                collected[existing] = trimmed;
            }
        }
    };

    for (const layer of layers) {
        if (layer.catalogLayer) {
            add(resolveLayerAttribution(layer.catalogLayer, sourcesById));
            continue;
        }
        if (layer.entryAttribution) {
            add(layer.entryAttribution);
            continue;
        }
        if (layer.sourceId) add(engineAttribution?.(layer.sourceId));
    }

    return collected;
}
