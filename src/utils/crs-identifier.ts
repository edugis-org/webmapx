/**
 * Turns the many spellings of a coordinate reference system into one code.
 *
 * A CRS arrives written any of half a dozen ways — `EPSG:4326`, `EPSG::4326`,
 * `urn:ogc:def:crs:OGC:1.3:CRS84`, `http://www.opengis.net/def/crs/EPSG/0/4326`
 * — and a library only ever recognises the spellings it was told about. That is
 * not a cosmetic problem: OpenLayers ships a projection object for
 * `urn:ogc:def:crs:OGC:1.3:CRS84`, but proj4 does not, so a layer tagged that
 * way could be drawn on a Web Mercator map (built-in transform) and died with
 * `transformFn is not a function` on a proj4-registered one such as Equal Earth.
 *
 * Why the URNs exist at all: `EPSG:4326` never said which axis comes first. The
 * EPSG registry defines it latitude-first; every file in the world stores
 * longitude first. OGC could not redefine 4326, so it minted `CRS84` — same
 * datum, axis order pinned to longitude/latitude — and the URN form to carry
 * authority, version and code without ambiguity.
 *
 * **This module never reorders coordinates.** It resolves an identifier to a
 * projection *code* and nothing else; data is read exactly as it is written.
 * Swapping a pair because a registry says the axes are the other way round turns
 * a file that was about to work into a file whose points are in the wrong ocean.
 */

/** The three CRSs OGC minted itself; they are not EPSG codes. */
const OGC_CODES: Record<string, string> = {
    CRS84: 'EPSG:4326',
    CRS83: 'EPSG:4269',
    CRS27: 'EPSG:4267',
    // `urn:ogc:def:crs:OGC:2:84` is the same thing under the OGC-2 authority.
    '84': 'EPSG:4326',
    '83': 'EPSG:4269',
    '27': 'EPSG:4267',
};

/**
 * `AUTH:CODE` for a CRS however it was written, or `null` if the string is not
 * an identifier this can make sense of.
 *
 * Every spelling of WGS84 collapses to `EPSG:4326`, since they name one
 * projection and differ only in the axis order they claim — which nothing here
 * acts on.
 */
export function normalizeCrsIdentifier(name: string | null | undefined): string | null {
    if (!name) return null;
    const text = name.trim();
    if (!text) return null;

    // urn:ogc:def:crs:<authority>:<version?>:<code>  (version is often empty)
    const urn = /^urn:(?:x-)?ogc:def:crs:([^:]+):([^:]*):(.+)$/i.exec(text);
    if (urn) return authorityCode(urn[1], urn[3]);

    // http(s)://www.opengis.net/def/crs/<authority>/<version>/<code>
    // and the older http://www.opengis.net/gml/srs/epsg.xml#4326
    const url = /^https?:\/\/[^/]*opengis\.net\/def\/crs\/([^/]+)\/[^/]*\/(.+)$/i.exec(text);
    if (url) return authorityCode(url[1], url[2]);
    const gml = /^https?:\/\/[^/]*opengis\.net\/gml\/srs\/([a-z]+)\.xml#(\d+)$/i.exec(text);
    if (gml) return authorityCode(gml[1], gml[2]);

    // AUTH:CODE, AUTH::CODE
    const plain = /^([A-Za-z][A-Za-z0-9_-]*)::?([^:]+)$/.exec(text);
    if (plain) return authorityCode(plain[1], plain[2]);

    // A bare number is EPSG by convention — nothing else numbers its CRSs.
    if (/^\d+$/.test(text)) return `EPSG:${text}`;

    return null;
}

function authorityCode(authority: string, code: string): string {
    const auth = authority.trim().toUpperCase();
    const value = code.trim();

    if (auth === 'OGC' || auth === 'CRS') {
        const mapped = OGC_CODES[value.toUpperCase()];
        if (mapped) return mapped;
    }
    // EPSG:4326 and its longhands all mean WGS84; the axis order they disagree
    // about is deliberately not represented here.
    if (auth === 'EPSG' && value === '4326') return 'EPSG:4326';

    // Authority OGC-2 and friends arrive as "OGC" already; anything else keeps
    // its own authority so ESRI:54009 and IAU2000 codes survive.
    return `${auth}:${value}`;
}

/** True if the identifier names WGS84 lon/lat, in whatever spelling. */
export function isWgs84(name: string | null | undefined): boolean {
    return normalizeCrsIdentifier(name) === 'EPSG:4326';
}
