// Types already included in webmapx-core-bundle — no separate import needed.
const BUNDLED_TOOL_TYPES = new Set([
  'layerTree', 'layerOverview', 'toolbox', 'spacer',
  'navigation', 'fullscreen', 'scaleControl', 'zoomLevel',
  'attributionControl', 'spinner', 'insetMap', 'active-adapter', 'activeAdapter',
]);

const TOOL_MAP: Record<string, () => Promise<unknown>> = {
  draw:               () => import('../components/webmapx-draw-tool.js'),
  measure:            () => import('../components/webmapx-measure-tool.js'),
  print:              () => import('../components/webmapx-print-tool.js'),
  importLayer:        () => import('../components/webmapx-import-layer-tool.js'),
  search:             () => import('../components/webmapx-search-tool.js'),
  geolocation:        () => import('../components/webmapx-geolocation-tool.js'),
  info:               () => import('../components/webmapx-info-tool.js'),
  maplanguage:          () => import('../components/webmapx-language-osmvector.js'),
  'language-osmvector': () => import('../components/webmapx-language-osmvector.js'),
  '3d':               () => import('../components/webmapx-3d-tool.js'),
  truearea:           () => import('../components/webmapx-truearea-tool.js'),
  'view-mode':        () => import('../components/webmapx-view-mode-tool.js'),
  coordinates:        () => import('../components/webmapx-coordinates-tool.js'),
  settings:           () => import('../components/webmapx-settings.js'),
  'config-edit':      () => import('../components/webmapx-config-edit-tool.js'),
  'active-adapter':   () => import('../components/webmapx-active-adapter.js'),
  activeAdapter:      () => import('../components/webmapx-active-adapter.js'),
};

export async function loadTools(tools: string[]): Promise<void> {
  await import('./webmapx-core-bundle.js');
  await Promise.all(tools.map(name => {
    const loader = TOOL_MAP[name];
    if (!loader) {
      if (!BUNDLED_TOOL_TYPES.has(name)) {
        console.warn(`[webmapx] Unknown tool: "${name}" — skipped`);
      }
      return Promise.resolve();
    }
    return loader();
  }));
}
