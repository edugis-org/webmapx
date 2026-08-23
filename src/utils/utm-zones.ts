/**
 * The UTM grid zones, from the rules rather than from a file.
 *
 * Sixty columns of six degrees and twenty rows of eight, which would be one line
 * of code — except that the grid has been amended twice by hand and the
 * exceptions are the whole reason a stored copy of it goes wrong:
 *
 *   - **Zone 32V is widened** to keep south-west Norway in one zone, taking
 *     three degrees from 31V.
 *   - **Svalbard drops zones 32X, 34X and 36X entirely**, and widens 31X, 33X,
 *     35X and 37X to swallow them.
 *   - **Row X is twelve degrees tall**, not eight, so the grid reaches 84°N.
 *   - Rows I and O do not exist, because they are too easily read as 1 and 0.
 *
 * A student who measures a zone in Norway against the rule and finds it wrong
 * has learnt something real about standards.
 */

/** Row letters, C to X, with I and O left out on purpose. */
const ROW_LETTERS = 'CDEFGHJKLMNPQRSTUVWX';

interface ZoneBox {
    zone: number;
    band: string;
    west: number;
    east: number;
    south: number;
    north: number;
    exception: string | null;
}

/** The west and east edges of one zone in one band, exceptions included. */
function zoneBounds(zone: number, band: string): { west: number; east: number; exception: string | null } {
    const west = -180 + (zone - 1) * 6;
    const east = west + 6;

    // Norway: 32V is widened westward at the expense of 31V.
    if (band === 'V' && zone === 31) return { west, east: 3, exception: 'narrowed for Norway' };
    if (band === 'V' && zone === 32) return { west: 3, east, exception: 'widened for Norway' };

    // Svalbard: three zones are absent and four are doubled in width.
    if (band === 'X') {
        if (zone === 32 || zone === 34 || zone === 36) {
            return { west: NaN, east: NaN, exception: 'not used (Svalbard)' };
        }
        if (zone === 31) return { west: 0, east: 9, exception: 'widened for Svalbard' };
        if (zone === 33) return { west: 9, east: 21, exception: 'widened for Svalbard' };
        if (zone === 35) return { west: 21, east: 33, exception: 'widened for Svalbard' };
        if (zone === 37) return { west: 33, east: 42, exception: 'widened for Svalbard' };
    }

    return { west, east, exception: null };
}

function bandBounds(band: string): { south: number; north: number } {
    const index = ROW_LETTERS.indexOf(band);
    const south = -80 + index * 8;
    // The last row is twelve degrees tall so that the grid reaches 84°N — the
    // limit of UTM, above which the polar stereographic system takes over.
    return { south, north: band === 'X' ? 84 : south + 8 };
}

export function utmZoneBoxes(): ZoneBox[] {
    const boxes: ZoneBox[] = [];
    for (const band of ROW_LETTERS) {
        const { south, north } = bandBounds(band);
        for (let zone = 1; zone <= 60; zone++) {
            const { west, east, exception } = zoneBounds(zone, band);
            if (!Number.isFinite(west)) continue;
            boxes.push({ zone, band, west, east, south, north, exception });
        }
    }
    return boxes;
}

/**
 * The grid as polygons, one per zone, each carrying its own designation.
 *
 * Drawn as rectangles in lon/lat, which is what they are: a UTM zone is defined
 * by meridians and parallels, however curved it looks once projected.
 */
export function utmZones(): GeoJSON.FeatureCollection {
    return {
        type: 'FeatureCollection',
        features: utmZoneBoxes().map((box) => ({
            type: 'Feature',
            properties: {
                designation: `${box.zone}${box.band}`,
                zone: box.zone,
                band: box.band,
                epsg: box.south >= 0 ? 32600 + box.zone : 32700 + box.zone,
                centralMeridian: box.west + (box.east - box.west) / 2,
                exception: box.exception,
            },
            geometry: {
                type: 'Polygon',
                coordinates: [[
                    [box.west, box.south],
                    [box.east, box.south],
                    [box.east, box.north],
                    [box.west, box.north],
                    [box.west, box.south],
                ]],
            },
        }) as GeoJSON.Feature),
    };
}
