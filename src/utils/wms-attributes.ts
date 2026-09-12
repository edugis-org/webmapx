/**
 * What a WMS layer's features are made of, without any features in hand.
 *
 * Styling by attribute needs two things a WMS never volunteers: the column
 * names, and enough values to build categories or class breaks from. There are
 * two ways to ask, and they are not equally good:
 *
 * - **The sibling WFS.** Every service in our own configs that honours a user
 *   SLD also publishes a WFS at the same path with `wms` swapped for `wfs`,
 *   with `Access-Control-Allow-Origin: *`. `DescribeFeatureType` answers with
 *   the whole schema *and its types*, so numeric and text are known rather than
 *   guessed, and `GetFeature` returns real values — the only way to get a
 *   distribution, since a WMS cannot be enumerated at all.
 * - **GetFeatureInfo.** One feature at one pixel. It gives names but no types
 *   (a number arrives as a number, which is a hint, not a schema) and only the
 *   values that pixel happens to carry. It is the fallback, and the panel says
 *   so, because "the categories are what we happened to hit" is a different
 *   promise from "these are the categories".
 *
 * The hard part of the fallback is *which pixel*: a land layer asked about a
 * point at sea answers with nothing, and so does a layer that draws nothing at
 * the current zoom. `inkedPixel` answers that from the layer's own rendering —
 * see `wms-sld-probe.ts`, which needs the same pixel for a different reason.
 */
import type { WmsSourceInfo } from './wms-source';

export interface WmsAttribute {
    name: string;
    /** The XSD type where a schema said so, otherwise what a sample looked like. */
    type: string;
    numeric: boolean;
}

export interface WmsAttributeSource {
    attributes: WmsAttribute[];
    /**
     * What the layer draws, where the schema said.
     *
     * A WMS never says, and the guess is not harmless: an SLD carrying only a
     * PolygonSymbolizer draws *nothing at all* on a point or line layer, and
     * the service reports success either way. Where the schema is silent the
     * style carries every symbolizer instead — see `symbolizersFor`.
     */
    geometry?: 'polygon' | 'line' | 'point' | null;
    /** Where the answer came from, which decides what the panel may claim. */
    from: 'wfs' | 'featureinfo';
    /** The WFS this layer was found in, so values can be read from it later. */
    wfs?: { url: string; typeName: string; version: string };
}

type Fetcher = typeof fetch;

/** How a geometry column's XSD type spells what it draws. */
function geometryKindOf(type: string): 'polygon' | 'line' | 'point' | null {
    if (/point/i.test(type)) return 'point';
    if (/(line|curve)/i.test(type)) return 'line';
    if (/(polygon|surface)/i.test(type)) return 'polygon';
    return null;
}

/**
 * The geometry the schema declares, as `gml:PointPropertyType` and friends.
 *
 * `gml:GeometryPropertyType` is the unhelpful spelling — it means "some
 * geometry" — and answers null, which is the honest answer rather than a guess.
 */
export function parseGeometryType(xml: string): 'polygon' | 'line' | 'point' | null {
    for (const match of xml.matchAll(/<(?:[a-z0-9]+:)?element\b([^>]*)\/?>/gi)) {
        const raw = /\btype\s*=\s*"([^"]+)"/i.exec(match[1])?.[1];
        if (!raw || !/gml:/i.test(raw)) continue;
        const kind = geometryKindOf(raw);
        if (kind) return kind;
    }
    return null;
}

/** XSD types that can be classified as numbers. */
const NUMERIC_TYPES = /^(xsd:)?(int|integer|long|short|byte|decimal|double|float|number)$/i;

/**
 * The WFS that publishes the same data as this WMS, by convention.
 *
 * A guess, and deliberately a small one: `…/wms/v1_0` → `…/wfs/v1_0` is how
 * PDOK, RCE and every GeoServer in our configs spell it. The alternative — the
 * same endpoint answering `SERVICE=WFS` — is how a bare GeoServer behaves, so
 * both are tried and whichever answers is used.
 */
export function wfsCandidates(endpoint: string): string[] {
    const candidates: string[] = [];
    try {
        const url = new URL(endpoint);
        if (/wms/i.test(url.pathname)) {
            const swapped = new URL(url.href);
            swapped.pathname = url.pathname.replace(/wms/gi, (match) => (match === 'WMS' ? 'WFS' : 'wfs'));
            candidates.push(swapped.href);
        }
        candidates.push(url.href);
    } catch (_) {
        return [];
    }
    return [...new Set(candidates)];
}

/**
 * The attributes an XSD schema declares, geometry excluded.
 *
 * Parsed with a regular expression rather than a DOM: the schema is a flat list
 * of `<element>` children whose namespace prefix varies by server (`xsd:`,
 * `xs:`, none), and the interesting part of the document has no nesting to
 * speak of. This also keeps the module usable in a worker and in a test.
 */
export function parseDescribeFeatureType(xml: string): WmsAttribute[] {
    const attributes: WmsAttribute[] = [];
    const pattern = /<(?:[a-z0-9]+:)?element\b([^>]*)\/?>/gi;
    for (const match of xml.matchAll(pattern)) {
        const tag = match[1];
        const name = /\bname\s*=\s*"([^"]+)"/i.exec(tag)?.[1];
        const raw = /\btype\s*=\s*"([^"]+)"/i.exec(tag)?.[1];
        if (!name || !raw) continue;
        // The geometry column is not an attribute, and is spelled a dozen ways
        // (`gml:GeometryPropertyType`, `gml:SurfacePropertyType`, …).
        if (/gml:/i.test(raw)) continue;
        const type = raw.replace(/^[a-z0-9]+:/i, '');
        // The schema also declares the feature type itself — `<element
        // name="pand" type="bag:pandType"/>` — which is the container, not a
        // column, and would otherwise be offered as something to classify by.
        if (new RegExp(`^${name}Type$`, 'i').test(type)) continue;
        attributes.push({ name, type, numeric: NUMERIC_TYPES.test(type) });
    }
    return attributes;
}

/** The feature type in this WFS that serves the WMS layer of this name. */
export function matchTypeName(typeNames: string[], wmsLayer: string): string | null {
    const local = (name: string) => name.split(':').pop() ?? name;
    const wanted = local(wmsLayer);
    return typeNames.find((name) => name === wmsLayer)
        ?? typeNames.find((name) => local(name) === wanted)
        ?? null;
}

/** The feature types a WFS capabilities document advertises. */
export function parseWfsTypeNames(xml: string): string[] {
    const names: string[] = [];
    for (const match of xml.matchAll(/<(?:[a-z0-9]+:)?Name>([^<]+)<\/(?:[a-z0-9]+:)?Name>/gi)) {
        names.push(match[1].trim());
    }
    return names;
}

function wfsUrl(base: string, params: Record<string, string>): string {
    const url = new URL(base);
    // A capabilities url may already carry SERVICE/REQUEST; ours must win.
    for (const key of [...url.searchParams.keys()]) {
        if (/^(service|request|version|typename|typenames|outputformat|count|maxfeatures|propertyname)$/i.test(key)) {
            url.searchParams.delete(key);
        }
    }
    for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
    return url.href;
}

/**
 * The attributes of a WMS layer, read from its sibling WFS.
 *
 * Returns null rather than throwing: there being no WFS is the ordinary case,
 * not a failure, and the caller has a second way to ask.
 */
export async function attributesFromWfs(
    info: WmsSourceInfo,
    fetchImpl: Fetcher = fetch,
): Promise<WmsAttributeSource | null> {
    const layer = info.layers.split(',')[0].trim();
    for (const base of wfsCandidates(info.endpoint)) {
        try {
            const capsUrl = wfsUrl(base, { SERVICE: 'WFS', REQUEST: 'GetCapabilities' });
            const caps = await fetchImpl(capsUrl);
            if (!caps.ok) continue;
            const capsXml = await caps.text();
            if (!/WFS_Capabilities/i.test(capsXml)) continue;
            // From the capabilities element, never the first `version="…"` in
            // the document: that is the XML declaration's own 1.0, and asking
            // a WFS 2 service for version 1.0 gets a service exception rather
            // than a schema — which reads as "there is no WFS here".
            const version = /<(?:[a-z0-9]+:)?WFS_Capabilities[^>]*\bversion="([\d.]+)"/i.exec(capsXml)?.[1] ?? '2.0.0';
            const typeName = matchTypeName(parseWfsTypeNames(capsXml), layer);
            if (!typeName) continue;
            // WFS 2 spells it TYPENAMES, WFS 1 TYPENAME. Sending both is
            // harmless and saves branching on a version string that services
            // report inconsistently.
            const describe = await fetchImpl(wfsUrl(base, {
                SERVICE: 'WFS', VERSION: version, REQUEST: 'DescribeFeatureType',
                TYPENAME: typeName, TYPENAMES: typeName,
            }));
            if (!describe.ok) continue;
            const schema = await describe.text();
            const attributes = parseDescribeFeatureType(schema);
            if (attributes.length === 0) continue;
            return {
                attributes,
                geometry: parseGeometryType(schema),
                from: 'wfs',
                wfs: { url: base, typeName, version },
            };
        } catch (_) {
            // A WFS that is not there, or refuses CORS, is not an error to
            // report: the fallback is the point of there being a fallback.
        }
    }
    return null;
}

/** The properties a GetFeatureInfo answer carries, whatever format it came in. */
export function parseFeatureInfoProperties(body: string): Record<string, unknown> | null {
    try {
        const json = JSON.parse(body);
        const properties = json?.features?.[0]?.properties;
        if (properties && typeof properties === 'object') return properties as Record<string, unknown>;
        return null;
    } catch (_) {
        // GML, which the MapServer/MapProxy services answer with. Its fields
        // are elements of the feature member, so the first level of children
        // with text content is the property list.
        const inner = /<[a-z0-9]*:?(?:FIELDS|featureMember|Feature)\b[\s\S]*?>([\s\S]*)</i.exec(body);
        const source = inner ? body : body;
        const properties: Record<string, unknown> = {};
        for (const match of source.matchAll(/<([a-z0-9_]+:)?([a-z0-9_]+)>([^<]*)<\/\1?\2>/gi)) {
            const [, , name, value] = match;
            if (/^(boundedBy|geom|geometry|the_geom|Box|coordinates|pos|posList)$/i.test(name)) continue;
            properties[name] = value.trim();
        }
        // MapServer's `text/plain`-ish GML also spells fields as attributes.
        for (const match of source.matchAll(/\b([a-z0-9_]+)\s*=\s*"([^"]*)"/gi)) {
            const [, name, value] = match;
            if (/^(xmlns|xsi|gml|version|srsName|fid|schemaLocation)/i.test(name)) continue;
            if (!(name in properties)) properties[name] = value;
        }
        return Object.keys(properties).length > 0 ? properties : null;
    }
}

/** Attributes inferred from one sampled feature. Types are a guess, and say so. */
export function attributesFromProperties(properties: Record<string, unknown>): WmsAttribute[] {
    return Object.entries(properties)
        .filter(([name]) => !/^(geom|geometry|the_geom|boundedBy)$/i.test(name))
        .map(([name, value]) => {
            const numeric = typeof value === 'number'
                || (typeof value === 'string' && value.trim() !== '' && Number.isFinite(Number(value)));
            return { name, type: numeric ? 'number' : 'string', numeric };
        });
}

/**
 * Values of one attribute, read from the WFS.
 *
 * `PROPERTYNAME` keeps the response to the column being classified — the
 * geometry is most of a feature's bytes, and a classification needs none of it.
 * Services vary in whether they honour it; when one does not, the extra bytes
 * are wasted but the values are still right.
 */
export async function valuesFromWfs(
    wfs: { url: string; typeName: string; version: string },
    attribute: string,
    limit: number,
    fetchImpl: Fetcher = fetch,
): Promise<unknown[] | null> {
    const two = wfs.version.startsWith('2');
    try {
        const url = wfsUrl(wfs.url, {
            SERVICE: 'WFS', VERSION: wfs.version, REQUEST: 'GetFeature',
            [two ? 'TYPENAMES' : 'TYPENAME']: wfs.typeName,
            [two ? 'COUNT' : 'MAXFEATURES']: String(limit),
            OUTPUTFORMAT: 'application/json',
            PROPERTYNAME: attribute,
        });
        const res = await fetchImpl(url);
        if (!res.ok) return null;
        const json = JSON.parse(await res.text());
        const features = Array.isArray(json?.features) ? json.features : null;
        if (!features) return null;
        return features.map((feature: { properties?: Record<string, unknown> }) => feature?.properties?.[attribute]);
    } catch (_) {
        return null;
    }
}

/**
 * The attributes of one feature, asked about the pixel the probe found ink at.
 *
 * `INFO_FORMAT` is tried in order of how much it tells us: JSON gives typed
 * values, GML gives strings, plain text gives whatever the server felt like.
 * Every service in our configs answers one of these.
 */
const INFO_FORMATS = ['application/json', 'application/geo+json', 'application/vnd.ogc.gml', 'text/plain'];

async function attributesFromFeatureInfo(
    info: WmsSourceInfo,
    hit: { i: number; j: number; bbox: [number, number, number, number]; size?: [number, number] },
    fetchImpl: Fetcher = fetch,
): Promise<WmsAttributeSource | null> {
    const { probeGetMapUrl } = await import('./wms-sld-probe');
    const layer = info.layers.split(',')[0].trim();
    const version = info.version && /^1\.[0-3]\.\d$/.test(info.version) ? info.version : '1.3.0';
    // WMS 1.3 spells the pixel I/J; 1.1 spells it X/Y. Both are sent, since a
    // service ignores the one it does not know.
    const pixel = { I: String(hit.i), J: String(hit.j), X: String(hit.i), Y: String(hit.j) };
    for (const format of INFO_FORMATS) {
        try {
            // The same image size the pixel was found in: an `I`/`J` means
            // nothing without the request it belongs to.
            const url = probeGetMapUrl(info, hit.bbox, {
                REQUEST: 'GetFeatureInfo', QUERY_LAYERS: layer, INFO_FORMAT: format,
                FEATURE_COUNT: '1', VERSION: version, ...pixel,
            }, hit.size);
            const res = await fetchImpl(url);
            if (!res.ok) continue;
            const properties = parseFeatureInfoProperties(await res.text());
            if (!properties) continue;
            const attributes = attributesFromProperties(properties);
            if (attributes.length > 0) return { attributes, from: 'featureinfo' };
        } catch (_) {
            // Try the next format; a service that refuses one often serves another.
        }
    }
    return null;
}

/**
 * Everything the styler knows about a WMS layer's columns.
 *
 * The WFS is asked first because it answers with the schema rather than with a
 * sample — see this module's header for why that difference is worth a second
 * request.
 */
export async function discoverWmsAttributes(
    info: WmsSourceInfo,
    hit: { i: number; j: number; bbox: [number, number, number, number]; size?: [number, number] } | null,
    fetchImpl: Fetcher = fetch,
): Promise<WmsAttributeSource | null> {
    const fromWfs = await attributesFromWfs(info, fetchImpl);
    if (fromWfs) return fromWfs;
    if (!hit) return null;
    return attributesFromFeatureInfo(info, hit, fetchImpl);
}
