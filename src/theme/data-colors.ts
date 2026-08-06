/**
 * Colours for geometry webmapx draws ON the map.
 *
 * These are deliberately NOT part of the light/dark theme axis in
 * webmapx-style-core.css, and deliberately not the UI accent:
 *
 *  - Tool geometry sits over basemaps ranging from white paper to satellite
 *    imagery, so it needs saturation plus a light halo to stay visible. The
 *    UI accent (--color-primary) is muted on purpose to sit quietly in panel
 *    chrome; used on a map it disappears against water and dark imagery.
 *  - Engine paint specs (maplibre, OpenLayers, Leaflet, Cesium) are JS and
 *    cannot read a CSS custom property, so the canonical values must live
 *    here in TS.
 *
 * webmapx-style-core.css mirrors these as --webmapx-data-* so legend dots and
 * swatches in the UI can match the geometry a tool draws. Change a value here
 * and change its mirror there.
 */

/** Active tool geometry: draw shapes, measure lines, info pin. */
export const DATA_TOOL = '#0f62fe';

/** Casing / vertex fill that keeps tool geometry legible on any basemap. */
export const DATA_TOOL_HALO = '#ffffff';

/** Routing lines and isochrone rings. */
export const DATA_ROUTE = '#2563eb';

/** Route origin marker. */
export const DATA_START = '#22c55e';

/** Route destination marker. */
export const DATA_END = '#e63946';

/** Selection / hover highlight. */
export const DATA_HIGHLIGHT = '#ffdd00';
