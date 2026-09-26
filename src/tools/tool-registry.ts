// src/tools/tool-registry.ts
//
// One entry per tool, and every tool registry derived from it.
//
// Registering a tool used to mean adding it to four hand-kept lists — the
// element-tag map, the default label/icon map, the setup page's tool list and
// the lazy-loader map — spread over two files. Nothing compared them, and each
// omission failed differently and silently: no loader entry gives a toolbar
// button that does nothing when clicked, no tag entry makes the config line
// disappear without a warning, no metadata entry renders a humanized id with no
// icon, and no setup entry means the tool cannot be switched on in the one UI
// built for switching tools on. Every one of those has actually happened.
//
// Here a tool is one object, a missing field is a type error, and the maps
// below are computed. `tool-loader.ts` still owns the `import()` thunks, since
// only a literal import specifier is statically analysable by the bundler; a
// test asserts that its keys and this file agree.

import type { ToolIconConfig } from '../config/types.js';
import bufferIconUrl from '../icons/buffer.svg?url';
import dinosaurIconUrl from '../icons/dinosaur.svg?url';

/**
 * Where a tool can appear in a config.
 *
 * `toolbar` tools are items inside a toolbar (or a toolbox/menu container) and
 * open a panel; `standalone` tools are map furniture placed by their own config
 * section (a scale bar, the attribution). `both` is for the rare tool usable
 * either way — the map-language picker is a toolbar tool and a standalone
 * control depending on the config.
 */
export type ToolPlacement = 'toolbar' | 'standalone' | 'both';

export interface ToolRegistryEntry {
    /** Canonical config `type` (toolbar items) or config section name (standalone). */
    id: string;
    /** Custom element built for this tool. Omitted for a type that builds no element of its own. */
    tag?: string;
    placement: ToolPlacement;
    /** Shown on the toolbar button and in the setup page. */
    label: string;
    icon?: ToolIconConfig;
    /**
     * Older spellings of `id` that configs in the wild still use. Accepted
     * everywhere the canonical id is: element lookup, loading and metadata.
     * They are deliberately not offered as separate tools in the setup page.
     */
    aliases?: string[];
    /**
     * Names that only ever resolve a label and icon — a config section may call
     * the catalog `layers`, but `layers` builds no element of its own.
     */
    metadataAliases?: string[];
    /**
     * Spellings accepted by the loader alone, so an old config naming one does
     * not warn about an unknown tool. They build nothing.
     */
    loaderAliases?: string[];
    /** Imported by webmapx-core-bundle, so it needs no lazy loader. */
    bundled?: boolean;
    /**
     * Holds other tools inside its own panel (the toolbox and the menu), so its
     * config `items` are tools rather than parameters.
     */
    container?: boolean;
    /** Offered in the setup page's "add a tool" list. Default true. */
    offered?: boolean;
    /**
     * The default `tools.<id>` config section. The setup page's ⚙ editor starts
     * from it when the config has none, and writes it into the config when the
     * tool is placed on a toolbar. Plugins only.
     */
    configTemplate?: Record<string, unknown>;
}

const BUILT_IN_TOOLS: readonly ToolRegistryEntry[] = [
    // --- toolbar tools, in the order the setup page offers them ---
    { id: 'search', tag: 'webmapx-search-tool', placement: 'toolbar', label: 'Search', icon: 'search' },
    {
        id: 'layerTree', tag: 'webmapx-layer-tree', placement: 'toolbar', label: 'Catalog', icon: 'layers',
        bundled: true, metadataAliases: ['layers', 'catalog', 'datacatalog'],
    },
    { id: 'measure', tag: 'webmapx-measure-tool', placement: 'toolbar', label: 'Measure', icon: 'rulers' },
    { id: 'info', tag: 'webmapx-info-tool', placement: 'toolbar', label: 'Feature info', icon: 'info-circle' },
    { id: 'draw', tag: 'webmapx-draw-tool', placement: 'toolbar', label: 'Draw', icon: 'pencil' },
    {
        id: 'geolocation', tag: 'webmapx-geolocation-tool', placement: 'toolbar', label: 'Geolocation',
        icon: 'crosshair', metadataAliases: ['geolocate'],
    },
    {
        // One tool now: the projection picker decides what to offer from the
        // engine. The old `view-mode` type keeps working so configurations do
        // not have to be rewritten.
        id: 'projection', tag: 'webmapx-projection-tool', placement: 'toolbar', label: 'Projection',
        icon: 'globe-americas', aliases: ['view-mode'],
    },
    {
        id: 'timeSlider', tag: 'webmapx-time-slider-tool', placement: 'toolbar', label: 'Time',
        icon: 'clock', aliases: ['time-slider'],
    },
    { id: 'cartogram', tag: 'webmapx-cartogram-tool', placement: 'toolbar', label: 'Cartogram', icon: 'pie-chart' },
    { id: '3d', tag: 'webmapx-3d-tool', placement: 'toolbar', label: '3D', icon: 'box' },
    {
        id: 'import-layer', tag: 'webmapx-import-layer-tool', placement: 'toolbar', label: 'Import layer',
        icon: 'file-earmark-arrow-up',
    },
    {
        id: 'layerOverview', tag: 'webmapx-layer-overview', placement: 'toolbar', label: 'Legend',
        icon: 'card-list', bundled: true, metadataAliases: ['legend'],
    },
    { id: 'layerLegend3d', tag: 'webmapx-layer-legend3d', placement: 'toolbar', label: 'Legend 3D', icon: 'stack' },
    {
        id: 'maplanguage', tag: 'webmapx-language-osmvector', placement: 'both', label: 'Map language',
        icon: 'translate', aliases: ['language-osmvector'],
    },
    { id: 'print', tag: 'webmapx-print-tool', placement: 'toolbar', label: 'Print', icon: 'printer' },
    { id: 'truearea', tag: 'webmapx-truearea-tool', placement: 'toolbar', label: 'True Area', icon: 'bounding-box-circles' },
    { id: 'routing', tag: 'webmapx-routing-tool', placement: 'toolbar', label: 'Routing', icon: 'signpost-split' },
    { id: 'isochrone', tag: 'webmapx-isochrone-tool', placement: 'toolbar', label: 'Isochrone', icon: 'broadcast' },
    { id: 'settings', tag: 'webmapx-settings', placement: 'toolbar', label: 'Settings', icon: 'gear' },
    { id: 'toolbox', tag: 'webmapx-toolbox-tool', placement: 'toolbar', label: 'Toolbox', icon: 'grid', bundled: true, container: true },
    { id: 'menu', tag: 'webmapx-menu-tool', placement: 'toolbar', label: 'Tools', icon: 'list', bundled: true, container: true },
    { id: 'buffer', tag: 'webmapx-buffer-tool', placement: 'toolbar', label: 'Buffer', icon: { src: bufferIconUrl } },
    { id: 'geoprocessing', tag: 'webmapx-geoprocessing-tool', placement: 'toolbar', label: 'Analysis', icon: 'intersect' },
    { id: 'data-analyzer', tag: 'webmapx-data-analyzer-tool', placement: 'toolbar', label: 'Data analyzer', icon: 'bar-chart-line' },
    { id: 'stories', tag: 'webmapx-stories-tool', placement: 'toolbar', label: 'Stories', icon: 'book' },
    { id: 'deeptime', tag: 'webmapx-deeptime-tool', placement: 'toolbar', label: 'Deep time', icon: { src: dinosaurIconUrl } },
    { id: 'sealevel', tag: 'webmapx-sealevel-tool', placement: 'toolbar', label: 'Sea level', icon: 'water' },
    { id: 'compare', tag: 'webmapx-compare-tool', placement: 'toolbar', label: 'Compare', icon: 'layout-split' },

    // --- standalone map furniture, in the order the setup page offers them ---
    { id: 'navigation', tag: 'webmapx-navigation-control', placement: 'standalone', label: 'Navigation', icon: 'compass', bundled: true },
    {
        id: 'scale', tag: 'webmapx-scale-control', placement: 'standalone', label: 'Scale bar', icon: 'rulers',
        bundled: true, loaderAliases: ['scaleControl'],
    },
    { id: 'coordinates', tag: 'webmapx-coordinates-tool', placement: 'standalone', label: 'Coordinates', icon: 'crosshair2' },
    { id: 'fullscreen', tag: 'webmapx-fullscreen-control', placement: 'standalone', label: 'Fullscreen', icon: 'fullscreen', bundled: true },
    { id: 'zoomLevel', tag: 'webmapx-zoom-level', placement: 'standalone', label: 'Zoom level', icon: 'zoom-in', bundled: true },
    {
        id: 'attribution', tag: 'webmapx-attribution-control', placement: 'standalone', label: 'Attribution',
        icon: 'info-circle', bundled: true, loaderAliases: ['attributionControl'],
    },
    { id: 'insetMap', tag: 'webmapx-inset-map', placement: 'standalone', label: 'Inset map', icon: 'map', bundled: true },
    {
        id: 'activeAdapter', tag: 'webmapx-active-adapter', placement: 'standalone', label: 'Engine label',
        icon: 'cpu', aliases: ['active-adapter'], bundled: true,
    },
    { id: 'spinner', tag: 'webmapx-spinner', placement: 'standalone', label: 'Spinner', icon: 'arrow-repeat', bundled: true },

    // --- types that are not tools a user adds ---
    // Layout filler inside a toolbar; the toolbar builder handles it directly.
    { id: 'spacer', placement: 'toolbar', label: 'Spacer', bundled: true, offered: false },
    // Injected by inject-config-edit-tool, never named in a config's tool list.
    { id: 'config-edit', placement: 'toolbar', label: 'Edit config', icon: 'pencil-square', offered: false },
];

const isToolbar = (entry: ToolRegistryEntry): boolean => entry.placement !== 'standalone';
const isStandalone = (entry: ToolRegistryEntry): boolean => entry.placement !== 'toolbar';

/** Every spelling that resolves to this entry, canonical id first. */
function spellings(entry: ToolRegistryEntry): string[] {
    return [entry.id, ...(entry.aliases ?? [])];
}

export interface ToolMetadata {
    label: string;
    icon?: ToolIconConfig;
}

// Every table below is a live object filled by `indexTool`, which runs once per
// built-in entry at module load and once per `registerTool` call afterwards. A
// plugin's tool therefore lands in exactly the tables a built-in one does, and
// callers that imported a table before the plugin loaded still see it: they
// hold the same object, not a snapshot.
const registry: ToolRegistryEntry[] = [];

/** Every tool this page knows: the built-ins, then any a plugin registered. */
export const TOOL_REGISTRY: readonly ToolRegistryEntry[] = registry;

/** Config tool `type` → custom element, for items inside a toolbar. */
export const TOOL_ELEMENT_TAGS: Record<string, string> = {};

/** Config section name → custom element, for standalone map furniture. */
export const STANDALONE_TAGS: Record<string, string> = {};

/**
 * Default label and icon per toolbar tool.
 *
 * Standalone-only tools are deliberately absent: their config sections are not
 * buttons, and injecting a label and icon into one would put a caption on the
 * scale bar.
 */
export const DEFAULT_TOOL_METADATA: Record<string, ToolMetadata> = {};

/**
 * Canonical tool list for the config editor and the setup page — one entry per
 * tool, aliases excluded.
 */
export const KNOWN_TOOLS: Array<{ id: string; label: string; icon?: ToolIconConfig; standalone?: boolean; plugin?: boolean }> = [];

const CANONICAL_IDS = new Map<string, string>();

const bundledToolIds = new Set<string>();
/** Tool ids that need no lazy loader because the core bundle imports them, or a plugin already defined them. */
export const BUNDLED_TOOL_IDS: ReadonlySet<string> = bundledToolIds;

const subtoolContainerTypes = new Set<string>();
/** Tool types whose `items` are other tools: the toolbox and the menu. */
export const SUBTOOL_CONTAINER_TYPES: ReadonlySet<string> = subtoolContainerTypes;

const taglessToolIds = new Set<string>();
/**
 * Registered types that build no element of their own — toolbar filler, and
 * types handled entirely by the code that injects them. They need no loader,
 * and a missing loader for one is not the silent failure the warning is for.
 */
export const TAGLESS_TOOL_IDS: ReadonlySet<string> = taglessToolIds;

function indexTool(entry: ToolRegistryEntry, plugin: boolean): void {
    registry.push(entry);
    const names = spellings(entry);
    const offered = entry.offered !== false;

    if (entry.tag) {
        for (const name of names) {
            if (isToolbar(entry)) TOOL_ELEMENT_TAGS[name] = entry.tag;
            if (isStandalone(entry)) STANDALONE_TAGS[name] = entry.tag;
        }
        if (offered) {
            KNOWN_TOOLS.push({
                id: entry.id,
                label: entry.label,
                icon: entry.icon,
                ...(entry.placement === 'standalone' ? { standalone: true } : {}),
                ...(plugin ? { plugin: true } : {}),
            });
        }
    } else {
        for (const name of names) taglessToolIds.add(name);
    }

    if (isToolbar(entry) && offered) {
        const metadata: ToolMetadata = { label: entry.label, icon: entry.icon };
        for (const name of [...names, ...(entry.metadataAliases ?? [])]) DEFAULT_TOOL_METADATA[name] = metadata;
    }

    for (const name of [...names, ...(entry.metadataAliases ?? [])]) CANONICAL_IDS.set(name, entry.id);
    if (entry.bundled) for (const name of [...names, ...(entry.loaderAliases ?? [])]) bundledToolIds.add(name);
    if (entry.container) for (const name of names) subtoolContainerTypes.add(name);
}

for (const entry of BUILT_IN_TOOLS) indexTool(entry, false);

/**
 * What a plugin declares to add a tool. The same fields a built-in entry has,
 * minus the ones that only describe how webmapx itself is built: a plugin's
 * element is defined by the time it registers (so it is always "bundled"), and
 * a plugin has no older spellings to keep alive yet.
 */
export type PluginToolEntry = Pick<ToolRegistryEntry, 'id' | 'tag' | 'placement' | 'label' | 'icon' | 'aliases' | 'offered' | 'configTemplate'> & {
    tag: string;
};

/**
 * Adds a plugin's tool to every registry table, so a config can name it as a
 * toolbar item or a standalone section, the validator accepts it, and the setup
 * page offers it — exactly like a built-in tool.
 *
 * Refuses (and returns false) rather than overriding: a plugin that reuses a
 * built-in id or tag would otherwise silently replace a tool every config
 * relies on. Registering the identical entry twice — the same plugin loaded
 * by two maps on one page — is accepted as a no-op.
 */
export function registerTool(entry: PluginToolEntry): boolean {
    const problem = pluginEntryProblem(entry);
    if (problem) {
        console.warn(`[webmapx] registerTool: ${problem} — tool not registered`);
        return false;
    }
    const existing = registry.find((known) => known.id === entry.id);
    if (existing) {
        if (existing.tag === entry.tag) return true;
        console.warn(`[webmapx] registerTool: "${entry.id}" is already registered as <${existing.tag ?? 'no element'}> — tool not registered`);
        return false;
    }
    const clash = [...spellings(entry)].find((name) => CANONICAL_IDS.has(name));
    if (clash) {
        console.warn(`[webmapx] registerTool: "${clash}" already names the "${CANONICAL_IDS.get(clash)}" tool — tool not registered`);
        return false;
    }
    const tagOwner = registry.find((known) => known.tag === entry.tag);
    if (tagOwner) {
        console.warn(`[webmapx] registerTool: <${entry.tag}> already belongs to "${tagOwner.id}" — tool not registered`);
        return false;
    }
    indexTool({ ...entry, bundled: true }, true);
    return true;
}

function pluginEntryProblem(entry: PluginToolEntry): string | null {
    if (!entry || typeof entry !== 'object') return 'entry must be an object';
    if (typeof entry.id !== 'string' || !/^[A-Za-z][\w-]*$/.test(entry.id)) return `invalid id ${JSON.stringify(entry?.id)}`;
    if (typeof entry.tag !== 'string' || !/^[a-z][a-z0-9]*-[a-z0-9-]*$/.test(entry.tag)) {
        return `"${entry.id}" needs a custom element tag containing a hyphen, got ${JSON.stringify(entry.tag)}`;
    }
    if (!['toolbar', 'standalone', 'both'].includes(entry.placement)) return `"${entry.id}" has invalid placement ${JSON.stringify(entry.placement)}`;
    if (typeof entry.label !== 'string' || !entry.label) return `"${entry.id}" needs a label`;
    const template = entry.configTemplate;
    if (template !== undefined && (template === null || typeof template !== 'object' || Array.isArray(template))) {
        return `"${entry.id}" configTemplate must be a plain object`;
    }
    return null;
}

/**
 * Resolves any spelling of a tool — an old type name, or a config section that
 * only ever meant the same tool (`layers`, `legend`) — to the id the registry
 * knows it by. Unknown names pass through, so a caller can still report them.
 */
export function canonicalToolId(id: string): string {
    return CANONICAL_IDS.get(id) ?? id;
}
