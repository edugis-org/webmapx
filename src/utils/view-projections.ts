/**
 * The map projections a 2D view can be drawn in.
 *
 * Pure data — no OpenLayers, no proj4 — because the tool that lists these runs
 * in every build, while the code that *installs* one is engine-specific and
 * lives in `map/openlayers-services/projection-support.ts`.
 *
 * Why this exists at all: Web Mercator inflates area by 1/cos²(latitude), so
 * Greenland comes out the size of Africa. That is harmless when navigating a
 * city and actively misleading for any world-scale thematic map — a choropleth
 * of population density, or a cartogram, which is a lie in Mercator by
 * construction. An equal-area view is what makes those honest.
 *
 * Only OpenLayers can render these: MapLibre is Mercator or globe, Leaflet is
 * Mercator, and Cesium is a globe (honest near the centre of the screen,
 * foreshortened at the limb, and never showing more than a hemisphere).
 */

export interface ViewProjectionDef {
    /** Authority code, and the id used everywhere (`store.mapProjection.name`). */
    id: string;
    label: string;
    /** One line, aimed at a student rather than a cartographer. */
    description: string;
    /** proj4 definition string; omitted for the two projections OL ships with. */
    proj4?: string;
    /**
     * True when the projection preserves *area* — the property that makes a
     * choropleth or a cartogram mean what it says. Shown in the tool, because
     * "which of these is safe for comparing sizes?" is the whole question.
     */
    equalArea: boolean;
    /**
     * The band of latitudes the projection is meant for, and outside which it
     * must not even be *measured*.
     *
     * Not documentation — load-bearing. A polar stereographic projection sends
     * its antipode to infinity: sampling EPSG:3031 across the whole globe
     * produces an extent 4e23 m wide, OL derives a maximum resolution from that,
     * and the map hangs trying to lay out a tile grid for a world 10¹⁰ times too
     * big. Even where the maths stays finite the answer is useless — a north
     * polar view of Antarctica is a smear round the edge of the disc.
     *
     * Defaults to the whole world for the cylindrical projections, which really
     * are defined everywhere.
     */
    latitudeRange?: [number, number];
    /**
     * True when a metre in the projection is a metre on the ground. Mercator is
     * the odd one out here: its unit is a metre only at the equator, which is
     * why switching views has to rescale the resolution (see
     * `resolutionScaleAt`) or the map jumps by a factor of 1/cos(lat).
     */
    metric: boolean;
}

export const DEFAULT_VIEW_PROJECTION = 'EPSG:3857';

export const VIEW_PROJECTIONS: ViewProjectionDef[] = [
    {
        id: 'EPSG:3857',
        label: 'Web Mercator',
        description: 'The usual web map. Shapes and angles are right everywhere, areas are inflated towards the poles.',
        equalArea: false,
        metric: false,
    },
    {
        id: 'EPSG:4326',
        label: 'Equirectangular (WGS84)',
        description: 'Longitude and latitude drawn as a plain grid. Simple, but stretches everything away from the equator.',
        equalArea: false,
        metric: false,
    },
    {
        id: 'EPSG:8857',
        label: 'Equal Earth',
        description: 'Equal-area world map that still looks like a map. Good default for comparing countries.',
        proj4: '+proj=eqearth +lon_0=0 +datum=WGS84 +units=m +no_defs',
        equalArea: true,
        metric: true,
    },
    {
        id: 'ESRI:54009',
        label: 'Mollweide',
        description: 'Equal-area ellipse. Areas are exact; shapes stretch badly near the edges.',
        proj4: '+proj=moll +lon_0=0 +x_0=0 +y_0=0 +datum=WGS84 +units=m +no_defs',
        equalArea: true,
        metric: true,
    },
    {
        id: 'EPSG:6933',
        label: 'Equal-area cylindrical (NSIDC EASE-Grid 2.0)',
        description: 'Equal-area with a straight grid, like Mercator without the area distortion. Squashes the poles flat.',
        proj4: '+proj=cea +lon_0=0 +lat_ts=30 +x_0=0 +y_0=0 +datum=WGS84 +units=m +no_defs',
        equalArea: true,
        metric: true,
    },
    {
        id: 'EPSG:3575',
        label: 'North Pole equal-area',
        description: 'Equal-area view from above the North Pole. For the Arctic, where every world map lies worst.',
        proj4: '+proj=laea +lat_0=90 +lon_0=10 +x_0=0 +y_0=0 +datum=WGS84 +units=m +no_defs',
        // Finite all the way to the far pole, but only the northern hemisphere
        // is worth looking at — the rest smears round the rim of the disc.
        latitudeRange: [0, 90],
        equalArea: true,
        metric: true,
    },
    {
        id: 'EPSG:3031',
        label: 'South Pole (Antarctic)',
        description: 'Polar stereographic, the standard for Antarctica. Shapes are right, areas grow away from the pole.',
        proj4: '+proj=stere +lat_0=-90 +lat_ts=-71 +lon_0=0 +x_0=0 +y_0=0 +datum=WGS84 +units=m +no_defs',
        // Stereographic sends the opposite pole to infinity. This bound is what
        // stops that from becoming the map's extent — see `latitudeRange`.
        latitudeRange: [-90, -50],
        equalArea: false,
        metric: true,
    },
];

export function getViewProjectionDef(id: string): ViewProjectionDef | undefined {
    return VIEW_PROJECTIONS.find(p => p.id === id);
}

/**
 * The latitudes a projection may be used at.
 *
 * The default stops just short of the poles: a cylindrical equal-area
 * projection is finite there, but a view centred exactly on ±90° has no
 * meaningful longitude and the transforms lose precision approaching it.
 */
export function latitudeRangeOf(id: string): [number, number] {
    return getViewProjectionDef(id)?.latitudeRange ?? [-89.9, 89.9];
}

/** True when a projection covers only part of the world (and so should say so). */
export function isRegional(id: string): boolean {
    const [south, north] = latitudeRangeOf(id);
    return south > -89.9 || north < 89.9;
}

/**
 * Where to centre the view when a projection is switched on.
 *
 * A centre already inside the projection's band is left exactly where it is —
 * changing projection should not move the map. One outside it goes to the
 * *middle* of the band rather than to the nearest edge: someone choosing the
 * Antarctic projection while looking at Europe wants to see Antarctica, and
 * clamping to 50°S would show them a screen half-filled with the blank beyond
 * the projection's extent.
 */
export function centreWithinProjection(id: string, lonLat: [number, number]): [number, number] {
    const [south, north] = latitudeRangeOf(id);
    if (lonLat[1] >= south && lonLat[1] <= north) return lonLat;
    return [lonLat[0], (south + north) / 2];
}

/**
 * How many projection units one ground metre is, near a given latitude.
 *
 * Only Mercator needs this: its unit is a metre at the equator and 1/cos(lat)
 * of one elsewhere. Keeping the *ground* scale across a projection switch — as
 * opposed to the raw resolution number — is what stops the map from jumping to
 * a different scale the moment the view changes.
 */
export function resolutionScaleAt(id: string, latitude: number): number {
    const def = getViewProjectionDef(id);
    if (def?.metric) return 1;
    if (id === 'EPSG:4326') {
        // Degrees, not metres: one degree of longitude is ~111 320 m at the equator.
        return 1 / 111320;
    }
    return 1 / Math.max(Math.cos((latitude * Math.PI) / 180), 1e-6);
}
