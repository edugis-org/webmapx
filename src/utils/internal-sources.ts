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
import { moonAlongMeridian, moonPathLines, moonPhaseDisc, moonPositionFeature, moonVisibilityBand } from './moon';
import { equilibriumTide } from './tides';
import { utmZones } from './utm-zones';
import { paleoCoastlines } from './paleo-coastlines';

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

/**
 * Placeholders a computed source may use, filled in from the map's own state.
 *
 * A generator is a pure function of a moment and a query string — it cannot see
 * the map, and should not. But some of what it draws is about the map: the
 * crescent's angle depends on who is looking, and "who is looking" is wherever
 * the user last clicked.
 *
 * So the config writes `?observer={click}` and the adapter fills that in before
 * the url is resolved, redrawing the source whenever the value changes. It
 * needs no tool of its own: every engine records a click in `lastClickedCoordinates`
 * whatever tool is active, so the info tool's click, or any other, moves the
 * view along with it.
 */
export const MAP_STATE_PLACEHOLDERS = {
    /** The last place clicked, as `lon,lat`. */
    click: '{click}',
    /**
     * The age the map's geological clock stands at, in millions of years.
     *
     * Deliberately not the map's ordinary clock, which is a `Date`: the useful
     * range here is hundreds of millions of years, and a `Date` cannot hold
     * more than about a quarter of a million.
     */
    ma: '{ma}',
} as const;

/** What the map can fill into a computed url. */
export interface MapStateValues {
    click?: [number, number] | null;
    ma?: number | null;
}

/** True when a url waits on something only the map can tell it. */
export function usesMapState(url: string): boolean {
    return Object.values(MAP_STATE_PLACEHOLDERS).some((token) => url.includes(token));
}

/** True when a url waits on this one piece of map state. */
export function usesPlaceholder(url: string, token: string): boolean {
    return url.includes(token);
}

/**
 * The same url with its placeholders filled in.
 *
 * An unfilled placeholder is removed along with its parameter rather than left
 * in place: `observer={click}` with nothing clicked yet means "no observer",
 * which is exactly the marker's own default, and a generator asked to parse
 * "{click}" as a coordinate would get NaN and draw nonsense.
 */
export function applyMapState(url: string, state: MapStateValues | [number, number] | null | undefined): string {
    if (!usesMapState(url)) return url;
    // Callers used to pass the click alone, and a coordinate pair is still the
    // most common thing to hand over.
    const values: MapStateValues = Array.isArray(state) ? { click: state } : (state ?? {});

    let out = url;
    if (values.click) out = out.split(MAP_STATE_PLACEHOLDERS.click).join(`${values.click[0]},${values.click[1]}`);
    if (values.ma !== null && values.ma !== undefined) out = out.split(MAP_STATE_PLACEHOLDERS.ma).join(String(values.ma));
    if (!usesMapState(out)) return out;

    // Whatever is still unfilled has no value yet, and its parameter is dropped
    // rather than left in place: a generator handed the literal "{ma}" would
    // read NaN and draw nonsense, while a missing parameter is simply its own
    // default.
    const [name, query = ''] = out.split('?');
    const kept = query
        .split('&')
        .filter((pair) => pair.length > 0 && !Object.values(MAP_STATE_PLACEHOLDERS).some((token) => pair.includes(token)));
    return kept.length > 0 ? `${name}?${kept.join('&')}` : name;
}

export const INTERNAL_FUNC_PROTOCOL = 'internalfunc:';

/** What a computed source is given, parsed out of its own url. */
export interface InternalSourceParams {
    /** Every parameter as written, so a generator can read its own. */
    query: URLSearchParams;
    /** `?at=<iso>` if given, otherwise the moment the map's clock stands at. */
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
        {
            hourUtc: query.get('hour') === null ? undefined : Number(query.get('hour')),
            today: at,
        },
    ),

    // ── Tides ─────────────────────────────────────────────────────────────
    // `?levels=-0.2,0,0.3&step=2&extremes=no` — the shape the ocean would take
    // if it could keep up with the moon and the sun. Not a tide table: see
    // utils/tides.ts for why the two are different questions.
    'equilibrium-tide': ({ at, query }) => equilibriumTide(at, {
        levels: numbers(query, 'levels'),
        stepDegrees: Number(query.get('step')) || undefined,
        extremes: query.get('extremes') !== 'no',
    }),

    // ── Moon ──────────────────────────────────────────────────────────────
    'moon-position': ({ at }) => moonPositionFeature(at),
    // `?radius=7` — the moon drawn as a disc with its lit part shaded, at the
    // point it stands over, turned so the lit side faces the sun.
    'moon-phase': ({ at, query }) => moonPhaseDisc(at, {
        radiusDegrees: Number(query.get('radius')) || undefined,
        // `?observer={click}` turns the marker from a position into a view: how
        // the crescent hangs over the place last clicked on the map.
        observer: numbers(query, 'observer')?.length === 2
            ? [numbers(query, 'observer')![0], numbers(query, 'observer')![1]]
            : undefined,
    }),
    'moon-visibility': ({ at }) => moonVisibilityBand(at),
    // `?days=27.32&step=1` — the track of the sublunar point, which is where the
    // moon's north-south swing becomes one picture instead of a moving dot.
    // `?lon=5&from=-60&to=60&step=15` — the same moon at a row of latitudes, each
    // turned the way an observer there sees it. Defaults to the meridian where
    // the sun has just set.
    'moon-in-sky': ({ at, query }) => moonAlongMeridian(at, {
        lon: query.get('lon') === null ? undefined : Number(query.get('lon')),
        fromLat: query.get('from') === null ? undefined : Number(query.get('from')),
        toLat: query.get('to') === null ? undefined : Number(query.get('to')),
        stepLat: Number(query.get('step')) || undefined,
        radiusDegrees: Number(query.get('radius')) || undefined,
    }),
    'moon-path': ({ at, query }) => moonPathLines(at, {
        days: Number(query.get('days')) || undefined,
        stepHours: Number(query.get('step')) || undefined,
    }),

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

    // ── Deep time ─────────────────────────────────────────────────────────
    // `?data=data/paleo/merdith2021&ma={ma}` — where the coastlines were at an
    // age, reconstructed from plate rotations rather than fetched per step.
    'paleo-coastlines': ({ query }) => paleoCoastlines(query),
};

/** Whether an `internalfunc://` url asked to keep itself current. */
export function isAutoRefreshing(url: string): boolean {
    return new URLSearchParams(url.split('?')[1] ?? '').get('refresh') === 'auto';
}

/**
 * Whether the data behind an `internalfunc://` url depends on the map's clock.
 *
 * A url that names its own moment (`?at=`) does not: it means that instant, and
 * moving a time slider must leave it exactly where it is.
 */
export function followsMapClock(url: string): boolean {
    return !new URLSearchParams(url.split('?')[1] ?? '').get('at');
}

/**
 * Every computed source a layer carries, whether or not it refreshes itself.
 *
 * Collected from the layer as written, before the urls are replaced by the data
 * they stand for — afterwards there is nothing left to say a source was
 * computed at all.
 *
 * Both halves matter, and for different reasons: `?refresh=auto` decides who
 * keeps themselves current while the wall clock runs, while *every* computed
 * source has to be recomputed when the map's clock jumps to another moment. A
 * `sun-path` layer never refreshes — it is the same picture all day — and still
 * has to be redrawn when the slider moves six months.
 */
export function collectComputedSources(layer: unknown, layerId: string): Array<{ sourceId: string; url: string }> {
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
        // Composite layers register their sources under `layerId:key`; a plain
        // one keeps the key it was given. Both spellings are offered, and the
        // caller uses whichever the engine actually knows.
        found.push({ sourceId: `${layerId}:${key}`, url });
        found.push({ sourceId: key, url });
    }
    return found;
}

/** The subset of {@link collectComputedSources} that asked for `?refresh=auto`. */
export function collectRefreshableSources(layer: unknown, layerId: string): Array<{ sourceId: string; url: string }> {
    return collectComputedSources(layer, layerId).filter((entry) => isAutoRefreshing(entry.url));
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
export function resolveInternalFuncUrl(url: string, now: Date = new Date()): GeoJSON.FeatureCollection {
    const withoutProtocol = url.slice(`${INTERNAL_FUNC_PROTOCOL}//`.length);
    const [name, queryString = ''] = withoutProtocol.split('?');
    const generator = INTERNAL_SOURCES[name];
    if (!generator) {
        console.warn(`[internalfunc] no generator called "${name}". Known: ${Object.keys(INTERNAL_SOURCES).join(', ')}`);
        return { type: 'FeatureCollection', features: [] };
    }
    const query = new URLSearchParams(queryString);
    // An explicit `?at=` outranks the map's clock: a config or a story that
    // names a moment means that moment, and must not drift when a time slider
    // moves. Everything else is drawn for whenever the map says it is.
    const rawAt = query.get('at');
    const at = rawAt ? new Date(rawAt) : now;
    return generator({ query, at: Number.isNaN(at.getTime()) ? now : at });
}

/**
 * The same layer with every `internalfunc://` url replaced by the data it
 * stands for, so the engines never see the protocol at all.
 *
 * Both spellings a geojson source uses are handled — `data` for an inline
 * source and `url` for one declared the way a raster source is — because a
 * configuration author will reasonably write either.
 */
export function resolveInternalSources<T>(
    layer: T,
    now: Date = new Date(),
    /**
     * A last chance to rewrite the url before it is answered — how map-state
     * placeholders such as `{click}` get filled in. The url *remembered* on the
     * source is the original, so a later click can fill it in differently.
     */
    prepareUrl: (url: string) => string = (url) => url,
): T {
    if (!layer || typeof layer !== 'object') return layer;
    if (Array.isArray(layer)) {
        return layer.map((entry) => resolveInternalSources(entry, now, prepareUrl)) as unknown as T;
    }

    let changed = false;
    const out: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(layer as Record<string, unknown>)) {
        if ((key === 'data' || key === 'url') && isInternalFuncUrl(value)) {
            out.data = resolveInternalFuncUrl(prepareUrl(value), now);
            // A resolved source is a geojson source whatever it called itself,
            // and it remembers the url it came from so it can be asked again.
            out.type = 'geojson';
            out.internalFuncUrl = value;
            changed = true;
            continue;
        }
        const resolved = resolveInternalSources(value, now, prepareUrl);
        if (resolved !== value) changed = true;
        out[key] = resolved;
    }
    return (changed ? out : layer) as T;
}
