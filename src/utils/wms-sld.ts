/**
 * Styling a WMS layer by handing the service a style of our own.
 *
 * A WMS draws its own pictures, so everything the styler does to a vector layer
 * is out of reach — except that some services accept an SLD document with the
 * request and draw the layer that way instead. That turns a raster layer from
 * "images, not features" into something a student can actually colour, which is
 * the whole point: the interesting Dutch datasets (BAG buildings, physical
 * geographic regions, monuments) are served as WMS.
 *
 * Two things constrain the shape of this module:
 *
 * - **The document travels in the tile url.** Every engine requests a WMS tile
 *   by GET, so the SLD goes in `SLD_BODY` and counts against the url length
 *   limit (~8 kB in practice, and some services are stricter). Everything here
 *   is therefore written to be small: no indentation, no namespaces that are
 *   not required, no rule that says what the default already says. How long is
 *   too long is the service's answer, not ours: see `URL_TOO_LONG_STATUS`.
 * - **Only what SLD 1.0 spells is offered.** The service parses the document,
 *   not us, so an expression the styler can evaluate locally means nothing
 *   here. That is why the drivers are single value and by attribute only, and
 *   why by-attribute is spelled as rules with filters rather than as a
 *   function.
 */

/**
 * What a service answers when the request url is too long for it.
 *
 * Deliberately *not* a limit this module enforces. The ceiling differs per
 * service — bisected with a padded document: PDOK BAG refuses at 7822 bytes,
 * PDOK's physical-geographic regions at 7886, RCE's monuments at 8049, all of
 * them the familiar 8192-byte request line of whatever sits in front — so a
 * constant either refuses a style a more generous service would have drawn, or
 * lets a stricter one fail anyway. The style is sent and the refusal read back
 * (`verifyStyledRequest`); these are the statuses that mean "make it shorter"
 * rather than "the document is wrong".
 */
export const URL_TOO_LONG_STATUS = [414, 431];

/**
 * What is being drawn, which decides the symbolizer a rule carries.
 *
 * `unknown` is a real answer, not a missing one: a WMS does not say what its
 * features are, and a rule carrying only a PolygonSymbolizer draws *nothing* on
 * a point layer while the service still reports success. An unknown geometry
 * therefore carries all three symbolizers — which draws the right thing
 * whatever the data turns out to be, at the cost of a mark on an area layer's
 * centroid where the service chooses to render one.
 */
export type SldGeometry = 'polygon' | 'line' | 'point' | 'unknown';

export interface SldSingle {
    kind: 'single';
    color: string;
    /** Outline of an area, and the colour of a line. */
    strokeColor?: string;
    strokeWidth?: number;
    /** Point size, ignored for the other two geometries. */
    size?: number;
    opacity?: number;
}

export interface SldCategory {
    value: string | number;
    color: string;
    label?: string;
}

export interface SldCategories {
    kind: 'categories';
    attribute: string;
    categories: SldCategory[];
    /** Drawn for a feature matching no category. Omitted: those are not drawn. */
    otherColor?: string;
    strokeColor?: string;
    strokeWidth?: number;
    size?: number;
    opacity?: number;
}

export interface SldBreak {
    /** Upper bound, exclusive. The last break carries `null` for "and above". */
    upTo: number | null;
    color: string;
    label?: string;
}

export interface SldGraduated {
    kind: 'graduated';
    attribute: string;
    breaks: SldBreak[];
    strokeColor?: string;
    strokeWidth?: number;
    size?: number;
    opacity?: number;
}

export type SldStyle = SldSingle | SldCategories | SldGraduated;

/** XML text escaping. An attribute name is author data and can carry anything. */
function xml(value: string | number): string {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

function css(name: string, value: string | number): string {
    return `<CssParameter name="${name}">${xml(value)}</CssParameter>`;
}

/**
 * A CSS colour as SLD 1.0 spells it: `#rrggbb`, with the alpha taken out.
 *
 * SLD accepts a hex colour and nothing else, and a service handed anything else
 * does not complain — it falls back to its own default style, which reads as
 * "the style did not work" with no error anywhere. The styler's colour picker
 * emits `rgba(0,170,0,1)`, which is how that happened: the first draw used the
 * hex default and worked, and the first *picked* colour drew the service's grey.
 * Alpha comes back separately, since SLD carries it as its own parameter.
 */
export function toSldColor(value: string): { color: string; opacity: number } {
    const text = String(value ?? '').trim();
    const rgba = /^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)(?:[\s,/]+([\d.]+%?))?\s*\)$/i.exec(text);
    if (rgba) {
        const channel = (raw: string) => Math.max(0, Math.min(255, Math.round(Number(raw))))
            .toString(16).padStart(2, '0');
        const alphaRaw = rgba[4];
        const alpha = alphaRaw === undefined ? 1
            : alphaRaw.endsWith('%') ? Number(alphaRaw.slice(0, -1)) / 100
            : Number(alphaRaw);
        return {
            color: `#${channel(rgba[1])}${channel(rgba[2])}${channel(rgba[3])}`,
            opacity: Number.isFinite(alpha) ? Math.max(0, Math.min(1, alpha)) : 1,
        };
    }
    const hex = /^#([0-9a-f]{3,8})$/i.exec(text);
    if (hex) {
        const digits = hex[1];
        if (digits.length === 3 || digits.length === 4) {
            const expand = [...digits].map((d) => d + d).join('');
            return {
                color: `#${expand.slice(0, 6)}`.toLowerCase(),
                opacity: digits.length === 4 ? parseInt(expand.slice(6, 8), 16) / 255 : 1,
            };
        }
        if (digits.length === 6) return { color: `#${digits}`.toLowerCase(), opacity: 1 };
        if (digits.length === 8) {
            return { color: `#${digits.slice(0, 6)}`.toLowerCase(), opacity: parseInt(digits.slice(6, 8), 16) / 255 };
        }
    }
    // A named colour is left as it is: SLD does not promise to understand it,
    // but guessing a hex value for it would be worse than passing it through.
    return { color: text || '#000000', opacity: 1 };
}

/**
 * The symbolizer for one rule.
 *
 * A polygon carries its own outline rather than a separate line rule: SLD draws
 * symbolizers in order within a rule, so one rule gives fill-then-stroke with
 * no second pass over the data — and a stroke declared here is the *feature's*
 * outline, which is what a user asking for a border means.
 */
function symbolizer(geometry: SldGeometry, rawFill: string, style: SldStyle): string {
    const { color: fill, opacity: fillAlpha } = toSldColor(rawFill);
    const opacity = (style.opacity ?? 1) * fillAlpha;
    const strokeSpec = style.strokeColor ? toSldColor(style.strokeColor) : null;
    const stroke = strokeSpec?.color;
    const strokeWidth = style.strokeWidth ?? 1;
    const fillParts = `<Fill>${css('fill', fill)}${opacity < 1 ? css('fill-opacity', opacity) : ''}</Fill>`;
    const strokeParts = stroke
        ? `<Stroke>${css('stroke', stroke)}${css('stroke-width', strokeWidth)}${
            (strokeSpec?.opacity ?? 1) < 1 ? css('stroke-opacity', strokeSpec!.opacity) : ''}</Stroke>`
        : '';
    if (geometry === 'polygon') {
        return `<PolygonSymbolizer>${fillParts}${strokeParts}</PolygonSymbolizer>`;
    }
    if (geometry === 'line') {
        // A line has no fill: its colour is its stroke, so the style's own
        // colour is what is drawn and `strokeColor` is not consulted.
        return `<LineSymbolizer><Stroke>${css('stroke', fill)}${css('stroke-width', strokeWidth)}${opacity < 1 ? css('stroke-opacity', opacity) : ''}</Stroke></LineSymbolizer>`;
    }
    const size = style.size ?? 8;
    return `<PointSymbolizer><Graphic><Mark><WellKnownName>circle</WellKnownName>${fillParts}${strokeParts}</Mark><Size>${xml(size)}</Size></Graphic></PointSymbolizer>`;
}

/**
 * The symbolizers for a geometry nobody could name, as separate *rules*.
 *
 * Measured, because both readings looked equally plausible: three symbolizers
 * inside one rule draws only the first — PDOK's roads come back blank from
 * exactly the document that draws the buildings — while three rules draw
 * everything the data matches. The cost is that "everything" is literal: on a
 * polygon layer the point rule puts a circle on every vertex, which is why this
 * is a last resort and the geometry is determined rather than assumed wherever
 * possible (`SldProbeResult.geometry`).
 */
function unknownGeometryRules(style: SldStyle, filter: string, name: string): string {
    return (['polygon', 'line', 'point'] as const)
        .map((kind, index) => rule(`${name}-${index}`, filter, symbolizer(kind, colorOf(style), style)))
        .join('');
}

/** The one colour a style draws with, for the geometry-probing rules above. */
function colorOf(style: SldStyle): string {
    if (style.kind === 'single') return style.color;
    if (style.kind === 'categories') return style.categories[0]?.color ?? '#000000';
    return style.breaks[0]?.color ?? '#000000';
}

function rule(name: string, filter: string, body: string): string {
    return `<Rule><Name>${xml(name)}</Name>${filter}${body}</Rule>`;
}

/** `<ogc:PropertyIsEqualTo>` etc., which is all SLD 1.0 filtering needs here. */
function propertyIs(op: string, attribute: string, value: string | number): string {
    return `<ogc:${op}><ogc:PropertyName>${xml(attribute)}</ogc:PropertyName><ogc:Literal>${xml(value)}</ogc:Literal></ogc:${op}>`;
}

function rulesFor(geometry: SldGeometry, style: SldStyle): string {
    if (style.kind === 'single') {
        return geometry === 'unknown'
            ? unknownGeometryRules(style, '', 'all')
            : rule('all', '', symbolizer(geometry, style.color, style));
    }
    if (style.kind === 'categories') {
        const rules = style.categories.map((category) => rule(
            String(category.label ?? category.value),
            `<ogc:Filter>${propertyIs('PropertyIsEqualTo', style.attribute, category.value)}</ogc:Filter>`,
            symbolizer(geometry, category.color, style),
        ));
        if (style.otherColor) {
            // ElseFilter is how SLD spells "everything the rules above missed",
            // and it is the only way to keep the rest of the layer visible
            // without listing every value the data happens to hold.
            rules.push(`<Rule><Name>other</Name><ElseFilter/>${symbolizer(geometry, style.otherColor, style)}</Rule>`);
        }
        return rules.join('');
    }
    // Graduated: each rule is the half-open band [previous, upTo). The bands are
    // written as two comparisons rather than as `PropertyIsBetween` because the
    // lowest band has no lower bound and the highest no upper one, and a band
    // with one open end is not a "between" at all.
    let lower: number | null = null;
    return style.breaks.map((band) => {
        const tests: string[] = [];
        if (lower !== null) tests.push(propertyIs('PropertyIsGreaterThanOrEqualTo', style.attribute, lower));
        if (band.upTo !== null) tests.push(propertyIs('PropertyIsLessThan', style.attribute, band.upTo));
        lower = band.upTo;
        const filter = tests.length === 0 ? ''
            : `<ogc:Filter>${tests.length > 1 ? `<ogc:And>${tests.join('')}</ogc:And>` : tests[0]}</ogc:Filter>`;
        return rule(band.label ?? `${band.upTo ?? 'max'}`, filter, symbolizer(geometry, band.color, style));
    }).join('');
}

/**
 * The SLD document for one WMS layer.
 *
 * `layer` must be the name the *service* knows, exactly as the `layers`
 * parameter spells it: a NamedLayer whose name the service does not recognise
 * is not an error anywhere, it simply draws nothing.
 */
export function buildSld(layer: string, geometry: SldGeometry, style: SldStyle): string {
    return '<?xml version="1.0" encoding="UTF-8"?>'
        + '<StyledLayerDescriptor version="1.0.0"'
        + ' xmlns="http://www.opengis.net/sld"'
        + ' xmlns:ogc="http://www.opengis.net/ogc">'
        + `<NamedLayer><Name>${xml(layer)}</Name>`
        + '<UserStyle><Name>webmapx</Name><FeatureTypeStyle>'
        + rulesFor(geometry, style)
        + '</FeatureTypeStyle></UserStyle></NamedLayer></StyledLayerDescriptor>';
}

/**
 * A url whose query cannot be cut short by a stray `#`.
 *
 * An engine may hand back a decoded url, and a decoded SLD carries colours —
 * `#ff00ff`. Parsed as a url that is a fragment, so the query truncates there
 * and the rest rides along as a hash, to be appended again on every later
 * rewrite. Escaping `#` inside the query keeps it a value.
 */
function hashSafe(raw: string): string {
    const query = raw.indexOf('?');
    if (query === -1) return raw;
    return raw.slice(0, query + 1) + raw.slice(query + 1).replace(/#/g, '%23');
}

/**
 * One GetMap url asking for this SLD.
 *
 * `STYLES` is emptied alongside: a named style and a user style in the same
 * request is undefined between services — some honour the SLD, some the name —
 * and an empty `STYLES` is what the spec says to send with an SLD.
 */
export function withSldBodyUrl(raw: string, sld: string | null): string {
    let url: URL;
    try {
        url = new URL(hashSafe(raw), typeof window !== 'undefined' ? window.location.href : 'http://localhost/');
    } catch (_) {
        return raw;
    }
    for (const key of [...url.searchParams.keys()]) {
        if (key.toLowerCase() === 'sld_body') url.searchParams.delete(key);
        if (key.toLowerCase() === 'styles') url.searchParams.set(key, '');
    }
    if (sld) url.searchParams.set('SLD_BODY', sld);
    // `{bbox-epsg-3857}` and `{z}/{x}/{y}` must survive, so the url is handed
    // back decoded — but the SLD itself carries `&`, `?` and `=`, which cannot
    // be. Only the placeholders' braces are put back.
    return url.href.replace(/%7B/g, '{').replace(/%7D/g, '}');
}



/**
 * A classification, as a style the service can draw.
 *
 * The styler classifies WMS values with exactly the same code it classifies a
 * vector layer with (`classification.ts`), so a choropleth of BAG building ages
 * is built the same way as one of a GeoJSON layer — the only difference is that
 * the result is written as SLD rules instead of a GL expression.
 */
export function graduatedSld(
    attribute: string,
    classes: ReadonlyArray<{ min: number; max: number }>,
    colors: readonly string[],
    extra: Partial<Omit<SldGraduated, 'kind' | 'attribute' | 'breaks'>> = {},
): SldGraduated {
    const breaks: SldBreak[] = classes.map((item, index) => ({
        // The last class is open-ended: a value above the largest one seen in
        // the sample is still part of the data, and a rule that stops at the
        // sample's maximum would leave those features undrawn.
        upTo: index === classes.length - 1 ? null : item.max,
        color: colors[index] ?? colors[colors.length - 1] ?? '#cccccc',
        label: index === classes.length - 1 ? `${item.min} and above` : `${item.min} – ${item.max}`,
    }));
    return { kind: 'graduated', attribute, breaks, ...extra };
}

export function categoricalSld(
    attribute: string,
    values: ReadonlyArray<string | number | boolean>,
    colors: readonly string[],
    extra: Partial<Omit<SldCategories, 'kind' | 'attribute' | 'categories'>> = {},
): SldCategories {
    return {
        kind: 'categories',
        attribute,
        categories: values.map((value, index) => ({
            value: typeof value === 'boolean' ? String(value) : value,
            color: colors[index] ?? colors[colors.length - 1] ?? '#cccccc',
        })),
        ...extra,
    };
}

/**
 * The picture a service draws of a style — `GetLegendGraphic`.
 *
 * Only for a style the service cannot have advertised. A *named* style comes
 * with its own `LegendURL` in the capabilities document — that is what the
 * style list already shows, and it must be preferred: the service's own link may
 * carry sizing, a font, a `SCALE`, or point somewhere else entirely. A style the
 * user just invented has no such link, so the request is composed here, with the
 * document in `SLD_BODY`. PDOK answers it with a legend drawn from our own rules,
 * labels and all — which is why the rules are named (`<Name>1900 – 1970</Name>`)
 * rather than numbered.
 *
 * Not part of the WMS standard proper (it is an SLD-profile request), so a
 * service may refuse it. The legend already shows a broken image as a small
 * notice rather than an empty box, which is the right behaviour for that.
 */
export function legendGraphicUrl(
    endpoint: string,
    layer: string,
    options: { sld?: string | null; style?: string; version?: string } = {},
): string {
    let url: URL;
    try {
        url = new URL(endpoint, typeof window !== 'undefined' ? window.location.href : 'http://localhost/');
    } catch (_) {
        return '';
    }
    // Whatever the endpoint already carried is a GetMap's business, not a
    // legend's: only the parameters below address this request.
    for (const key of [...url.searchParams.keys()]) {
        if (/^(service|version|request|layer|layers|format|style|styles|sld|sld_body|width|height|bbox|crs|srs|transparent)$/i.test(key)) {
            url.searchParams.delete(key);
        }
    }
    const version = options.version && /^1\.[0-3]\.\d$/.test(options.version) ? options.version : '1.1.1';
    url.searchParams.set('SERVICE', 'WMS');
    url.searchParams.set('VERSION', version);
    url.searchParams.set('REQUEST', 'GetLegendGraphic');
    url.searchParams.set('LAYER', layer);
    url.searchParams.set('FORMAT', 'image/png');
    if (options.sld) url.searchParams.set('SLD_BODY', options.sld);
    else if (options.style) url.searchParams.set('STYLE', options.style);
    return url.href;
}
