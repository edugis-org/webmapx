/**
 * Layers whose data is computed, not fetched.
 *
 * A source url of `internalfunc://day-night` means "ask the code for it". Some
 * data is a *function of the moment* rather than a document on a server: where
 * night falls, where the sun stands. Serving those from a remote service makes
 * them worse in three ways — the answer is stale as soon as it arrives, it
 * cannot be had offline, and it costs a request for something the browser works
 * out in a millisecond.
 *
 * The protocol is deliberately not `http`: a reader of a configuration should
 * be able to see at a glance that nothing is fetched, and a source that looks
 * like a url but is answered locally would be a small lie in every config that
 * used it.
 *
 * Parameters ride along as a query string, so a story can pin a moment:
 *
 *   internalfunc://day-night
 *   internalfunc://day-night?at=2024-06-21T12:00:00Z
 *   internalfunc://sun-position
 */
import {
    analemma,
    dayLengthLines,
    daylightBands,
    solarTimeMeridians,
    sunPathLines,
    sunPositionFeature,
} from './solar';
import { graticule, referenceCircles } from './graticule';
import { antipode, greatCircleRoute, rangeRings, tissotIndicatrix } from './geodesy-features';
import { moonPositionFeature, moonVisibilityBand } from './moon';
import { utmZones } from './utm-zones';

/**
 * A comma-separated list of numbers from the query, or nothing.
 *
 * Empty strings are dropped before they are read as numbers: `Number('')` is 0,
 * so a missing parameter would otherwise arrive as the perfectly plausible
 * list `[0]` — which is how "every day-length line" became "only the polar
 * night line".
 */
function numbers(query: URLSearchParams, key: string): number[] | undefined {
    const raw = (query.get(key) ?? '')
        .split(',')
        .map((part) => part.trim())
        .filter((part) => part.length > 0)
        .map(Number)
        .filter(Number.isFinite);
    return raw.length > 0 ? raw : undefined;
}

/** `?at=12,52` — a place, for the generators that need one. */
function place(query: URLSearchParams, key: string, fallback: [number, number]): [number, number] {
    const raw = numbers(query, key);
    return raw?.length === 2 ? [raw[0], raw[1]] : fallback;
}

export const INTERNAL_FUNC_PROTOCOL = 'internalfunc:';

/** What a computed source is given, parsed out of its own url. */
export interface InternalSourceParams {
    /** Every parameter as written, so a generator can read its own. */
    query: URLSearchParams;
    /** `?at=<iso>` if given, otherwise the moment the layer was added. */
    at: Date;
}

export type InternalSourceGenerator = (params: InternalSourceParams) => GeoJSON.FeatureCollection;

/**
 * The generators a configuration may name. Deliberately a small, explicit list:
 * a config must not be able to run arbitrary code by naming it in a url.
 */
export const INTERNAL_SOURCES: Record<string, InternalSourceGenerator> = {
    'day-night': ({ at }) => daylightBands(at),
    'sun-position': ({ at }) => sunPositionFeature(at),
    // `?year=2026&step=2` — a line per day for a whole year. Never worth
    // refreshing: it is the same picture all year.
    'sun-path': ({ at, query }) => sunPathLines(
        // `?year=` pins a calendar year; otherwise the half-cycle around `at`.
        query.get('year') ? new Date(Date.UTC(Number(query.get('year')), 6, 1)) : at,
        {
            stepDegrees: Number(query.get('step')) || undefined,
            span: query.get('span') === 'year' || query.get('year') ? 'year' : 'solstice-to-solstice',
        },
    ),

    // ── The lines a map draws on the Earth rather than on the ground ──────
    'graticule': ({ query }) => graticule({ spacingDegrees: Number(query.get('spacing')) || undefined }),
    'reference-circles': ({ at }) => referenceCircles(at),

    // ── What a projection does to the world ───────────────────────────────
    'tissot': ({ query }) => tissotIndicatrix({
        spacingDegrees: Number(query.get('spacing')) || undefined,
        radiusKm: Number(query.get('radius')) || undefined,
    }),

    // ── Sun, beyond where it is now ───────────────────────────────────────
    'day-length': ({ at, query }) => dayLengthLines(at, { hours: numbers(query, 'hours') }),
    'solar-time': ({ at }) => solarTimeMeridians(at),
    'analemma': ({ at, query }) => analemma(
        Number(query.get('year')) || at.getUTCFullYear(),
        { hourUtc: query.get('hour') === null ? undefined : Number(query.get('hour')) },
    ),

    // ── Moon ──────────────────────────────────────────────────────────────
    'moon-position': ({ at }) => moonPositionFeature(at),
    'moon-visibility': ({ at }) => moonVisibilityBand(at),

    // ── Spherical geometry, about a place ─────────────────────────────────
    'range-rings': ({ query }) => {
        const [lon, lat] = place(query, 'at', [5, 52]);
        return rangeRings(lon, lat, numbers(query, 'radii'));
    },
    'great-circle': ({ query }) => greatCircleRoute(
        place(query, 'from', [4.9, 52.4]),
        place(query, 'to', [139.7, 35.7]),
    ),
    'antipode': ({ query }) => {
        const [lon, lat] = place(query, 'at', [5, 52]);
        return antipode(lon, lat);
    },

    // ── Grids defined by rules ────────────────────────────────────────────
    'utm-zones': () => utmZones(),
};

/**
 * Which of a layer's sources are computed *and* asked to keep themselves
 * current (`?refresh=auto`).
 *
 * Collected from the layer as written, before the urls are replaced by the data
 * they stand for — afterwards there is nothing left to say a source was
 * computed at all.
 */
export function collectRefreshableSources(layer: unknown, layerId: string): Array<{ sourceId: string; url: string }> {
    const found: Array<{ sourceId: string; url: string }> = [];
    if (!layer || typeof layer !== 'object') return found;
    const sources = (layer as { sources?: Record<string, unknown> }).sources;
    if (!sources || typeof sources !== 'object') return found;

    for (const [key, source] of Object.entries(sources)) {
        // `internalFuncUrl` is what a source that has already been resolved
        // remembers; `data`/`url` is a source that has not been through that
        // yet. A layer can arrive either way round.
        const record = source as { internalFuncUrl?: unknown; data?: unknown; url?: unknown } | null;
        const url = record?.internalFuncUrl ?? record?.data ?? record?.url;
        if (!isInternalFuncUrl(url)) continue;
        if (new URLSearchParams(url.split('?')[1] ?? '').get('refresh') !== 'auto') continue;
        // Composite layers register their sources under `layerId:key`; a plain
        // one keeps the key it was given. Both spellings are offered, and the
        // caller uses whichever the engine actually knows.
        found.push({ sourceId: `${layerId}:${key}`, url });
        found.push({ sourceId: key, url });
    }
    return found;
}

export function isInternalFuncUrl(value: unknown): value is string {
    return typeof value === 'string' && value.startsWith(`${INTERNAL_FUNC_PROTOCOL}//`);
}

/**
 * The data behind an `internalfunc://` url.
 *
 * An unknown name is an empty collection and a warning rather than an error:
 * one mistyped layer in a configuration should not stop the map from loading,
 * and an empty layer is visible in the legend as the thing to go and fix.
 */
export function resolveInternalFuncUrl(url: string): GeoJSON.FeatureCollection {
    const withoutProtocol = url.slice(`${INTERNAL_FUNC_PROTOCOL}//`.length);
    const [name, queryString = ''] = withoutProtocol.split('?');
    const generator = INTERNAL_SOURCES[name];
    if (!generator) {
        console.warn(`[internalfunc] no generator called "${name}". Known: ${Object.keys(INTERNAL_SOURCES).join(', ')}`);
        return { type: 'FeatureCollection', features: [] };
    }
    const query = new URLSearchParams(queryString);
    const rawAt = query.get('at');
    const at = rawAt ? new Date(rawAt) : new Date();
    return generator({ query, at: Number.isNaN(at.getTime()) ? new Date() : at });
}

/**
 * The same layer with every `internalfunc://` url replaced by the data it
 * stands for, so the engines never see the protocol at all.
 *
 * Both spellings a geojson source uses are handled — `data` for an inline
 * source and `url` for one declared the way a raster source is — because a
 * configuration author will reasonably write either.
 */
export function resolveInternalSources<T>(layer: T): T {
    if (!layer || typeof layer !== 'object') return layer;
    if (Array.isArray(layer)) return layer.map((entry) => resolveInternalSources(entry)) as unknown as T;

    let changed = false;
    const out: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(layer as Record<string, unknown>)) {
        if ((key === 'data' || key === 'url') && isInternalFuncUrl(value)) {
            out.data = resolveInternalFuncUrl(value);
            // A resolved source is a geojson source whatever it called itself,
            // and it remembers the url it came from so it can be asked again.
            out.type = 'geojson';
            out.internalFuncUrl = value;
            changed = true;
            continue;
        }
        const resolved = resolveInternalSources(value);
        if (resolved !== value) changed = true;
        out[key] = resolved;
    }
    return (changed ? out : layer) as T;
}
