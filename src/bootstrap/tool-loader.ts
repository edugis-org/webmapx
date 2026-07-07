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
  'import-layer':     () => import('../components/webmapx-import-layer-tool.js'),
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
  routing:            () => import('../components/webmapx-routing-tool.js'),
  isochrone:          () => import('../components/webmapx-isochrone-tool.js'),
  buffer:             () => import('../components/webmapx-buffer-tool.js'),
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

// Reverse lookup (custom element tag name -> tool id) built from dynamic-layout's tag
// registries, so this stays in sync with what buildLayoutFromConfig actually creates
// instead of hand-duplicating the tag list here.
let tagToToolId: Record<string, string> | null = null;
async function getTagToToolId(): Promise<Record<string, string>> {
  if (!tagToToolId) {
    const { TOOL_ELEMENT_TAGS, STANDALONE_TAGS } = await import('../utils/dynamic-layout.js');
    tagToToolId = {};
    for (const [id, tag] of Object.entries({ ...TOOL_ELEMENT_TAGS, ...STANDALONE_TAGS })) {
      tagToToolId[tag] = id;
    }
  }
  return tagToToolId;
}

const triggeredTags = new Set<string>();
function loadForTag(tag: string, tagMap: Record<string, string>): void {
  const id = tagMap[tag];
  if (!id || triggeredTags.has(tag)) return;
  triggeredTags.add(tag);
  loadTools([id]).catch(error => {
    console.error(`[webmapx] Failed to lazily load tool component for <${tag}>:`, error);
  });
}

/**
 * Watches the document for any webmapx-* tool custom element being inserted, however it got
 * there — built by the config-driven toolbar/dynamic-layout system, dropped directly into
 * arbitrary HTML (e.g. a standalone tool button outside the map's toolbar), or created by a
 * future plugin — and lazily loads its module the moment it appears. This is what lets tool
 * loading stay fully lazy (no "load everything up front" fallback) without needing a config
 * to enumerate every tool that might ever be used: extractToolIds() only sees tools declared
 * inside a config's `tools` object, so anything used outside that (like index.html's external
 * tools column, or a plugin's own element) would otherwise never get loaded at all.
 *
 * Loading being triggered late doesn't itself make a click "too early" — custom elements
 * auto-upgrade whenever their module finishes loading regardless of DOM insertion order.
 * Code that creates an element and immediately calls a method on it in the same tick (like
 * index.html's external tool buttons) still needs `await customElements.whenDefined(tag)`
 * first; this only guarantees loading actually starts.
 */
export function observeToolElements(root: ParentNode = document): void {
  void getTagToToolId().then(tagMap => {
    const tags = Object.keys(tagMap);
    if (tags.length === 0) return;
    const selector = tags.join(',');

    const scan = (node: ParentNode | Element): void => {
      if (node instanceof Element && tagMap[node.tagName.toLowerCase()]) {
        loadForTag(node.tagName.toLowerCase(), tagMap);
      }
      node.querySelectorAll?.(selector).forEach(el => loadForTag(el.tagName.toLowerCase(), tagMap));
    };

    scan(root);

    new MutationObserver(mutations => {
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (node instanceof Element) scan(node);
        }
      }
    }).observe(document.documentElement, { childList: true, subtree: true });
  });
}

/**
 * Flattens an AppConfig-style `tools` object into the list of tool ids it references —
 * top-level entries plus items nested inside any grouping (toolbars, and toolbox submenus
 * nested inside a toolbar, to any depth). Single source of truth for "which tool ids does
 * this config need" so every bootstrap entry point (WebMapX.mount, the demo app) loads
 * exactly the same set via loadTools() — a tool added only inside a toolbox submenu must be
 * discovered just as reliably as one placed directly on a toolbar.
 */
export function extractToolIds(tools: Record<string, unknown> | undefined | null): string[] {
  if (!tools) return [];
  const ids: string[] = [];

  const visit = (cfg: Record<string, unknown>, fallbackId: string | null): void => {
    if (typeof cfg.type === 'string') {
      // 'toolbar' is a structural grouping, not a loadable tool — only its items are.
      if (cfg.type !== 'toolbar') ids.push(cfg.type);
    } else if (fallbackId !== null) {
      ids.push(fallbackId);
    }
    if (Array.isArray(cfg.items)) {
      for (const item of cfg.items) {
        if (item && typeof item === 'object') visit(item as Record<string, unknown>, null);
      }
    }
  };

  for (const [key, value] of Object.entries(tools)) {
    if (!value || typeof value !== 'object') continue;
    visit(value as Record<string, unknown>, key);
  }

  return ids;
}
