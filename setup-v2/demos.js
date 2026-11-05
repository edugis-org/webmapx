/**
 * Demo cards shown on the landing page.
 *
 * Shared, single source of truth: the browser imports this module from
 * index.html, and scripts/update-map-previews.ts imports it from Node to know
 * which demos to screenshot. Keep it plain ESM JS so both can load it directly.
 *
 * `id` doubles as the preview filename: previews/<id>.jpg
 *
 * @typedef {object} Demo
 * @property {string} id      slug, also the preview image basename
 * @property {string} config  config path relative to the site root
 * @property {string} label   caption shown on the card
 * @property {string} engine  map engine badge
 * @property {string[]} tools tool badges
 */

/** @type {Demo[]} */
export const DEMOS = [
  {
    id: 'nl-choropleth',
    config: 'config/demo-ol-chorepleth.json',
    label: 'Netherlands — choropleth, vector tiles',
    engine: 'OpenLayers',
    tools: ['legend', 'info'],
  },
  {
    id: 'volcano-terrain',
    config: 'config/demo-mlgl-terrain.json',
    label: 'Volcano — terrain view',
    engine: 'MapLibre',
    tools: ['3D terrain'],
  },
  {
    id: 'timezones-globe',
    config: 'config/demo-mlgl-globe.json',
    label: 'Time zones — globe view',
    engine: 'MapLibre',
    tools: ['info', 'legend'],
  },
  {
    id: 'belgium-layers',
    config: 'config/belgie.json',
    label: 'Belgium — multiple layers',
    engine: 'Leaflet',
    tools: ['layer switcher', 'legend'],
  },
];
