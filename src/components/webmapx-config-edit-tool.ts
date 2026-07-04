import { LitElement, html, css, nothing, TemplateResult } from 'lit';
import { customElement, state } from 'lit/decorators.js';

import '@shoelace-style/shoelace/dist/components/button/button.js';
import '@shoelace-style/shoelace/dist/components/icon/icon.js';
import '@shoelace-style/shoelace/dist/components/icon-button/icon-button.js';
import '@shoelace-style/shoelace/dist/components/input/input.js';
import '@shoelace-style/shoelace/dist/components/select/select.js';
import '@shoelace-style/shoelace/dist/components/option/option.js';
import '@shoelace-style/shoelace/dist/components/checkbox/checkbox.js';
import '@shoelace-style/shoelace/dist/components/divider/divider.js';

import { resolveMapElement } from './internal/map-context';
import type { WebmapxMapElement } from './webmapx-map';
import type { AppConfig } from '../config/types';
import { KNOWN_TOOLS } from '../utils/dynamic-layout';

// ── Constants ────────────────────────────────────────────────────────────────

const AUTHORING_IDS = new Set(['configedit', 'config-edit', 'settings']);
const SKIP_PROPS = new Set(['id', 'type', 'enabled', 'items', 'tree']);

const ALIAS_TO_CANONICAL: Record<string, string> = {
    layers: 'layerTree', catalog: 'layerTree', datacatalog: 'layerTree',
    legend: 'layerOverview', geolocate: 'geolocation',
};
function canon(id: string): string { return ALIAS_TO_CANONICAL[id] ?? id; }

const PROP_OPTIONS: Record<string, string[]> = {
    defaultFormat:    ['geographic-en', 'geographic-local', 'lonlat', 'latlon'],
    position:         ['top-left','middle-left','bottom-left','top-center','middle-center','bottom-center','top-right','middle-right','bottom-right','edge-bottom-left','edge-bottom-center','edge-bottom-right'],
    orientation:      ['vertical', 'horizontal'],
    'panel-position': ['after', 'before'],
    'panel.position': ['after', 'before'],
    provider:         ['nominatim'],
    direction:        ['up', 'down', 'left', 'right'],
    tooltipPlacement: ['right', 'left', 'top', 'bottom'],
    alignment:        ['start', 'center', 'end'],
    priority:         ['normal', 'high', 'low'],
};

// Extra defaults surfaced in popup even if absent from config
const TOOL_EXTRA_PROPS: Record<string, Record<string, unknown>> = {
    coordinates: { defaultFormat: 'geographic-en' },
    search:      { provider: 'nominatim' },
};

// Known toolbar keys always shown even when absent from config
const KNOWN_TOOLBAR_KEYS = ['mainToolbar', 'legendToolbar'];
const DEFAULT_TOOLBAR_CONFIG: Record<string, Record<string, unknown>> = {
    mainToolbar:   { type: 'toolbar', enabled: true, position: 'top-left',  orientation: 'vertical',   tooltipPlacement: 'right', panel: { enabled: true, position: 'after' } },
    legendToolbar: { type: 'toolbar', enabled: true, position: 'top-right', orientation: 'vertical',   tooltipPlacement: 'left',  panel: { enabled: true, position: 'after' } },
};

// Toolbar-level own props + panel.* props
const TOOLBAR_OWN_PROPS   = ['position', 'orientation', 'tooltipPlacement', 'alignment', 'priority'];
const TOOLBAR_PANEL_PROPS = ['label', 'position'];

// ── Data model ────────────────────────────────────────────────────────────────

interface ToolItem {
    id: string;          // canonical KNOWN_TOOLS id (or type)
    label: string;
    configItem: Record<string, unknown>;
    subItems?: ToolItem[]; // toolbox sub-items
    isNew: boolean;
}

interface ToolbarSection {
    key: string;         // config key (mainToolbar, legendToolbar, …)
    configItem: Record<string, unknown>;
    items: ToolItem[];
}

interface MapControl {
    id: string;
    label: string;
    enabled: boolean;
    configItem: Record<string, unknown>;
}

// Popup target
interface PopupTarget {
    toolId: string;
    toolbarKey?: string;     // undefined = standalone control
    parentId?: string;       // set when inside a toolbox
    isToolbar?: boolean;     // popup is for toolbar-level props
    rect: DOMRect;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function knownLabel(id: string): string {
    return KNOWN_TOOLS.find(t => t.id === id || t.id === canon(id))?.label ?? id;
}

function itemToToolItem(item: Record<string, unknown>, isNew = false): ToolItem {
    const id = canon(String(item.id ?? item.type ?? ''));
    const subItems: ToolItem[] | undefined = Array.isArray(item.items)
        ? (item.items as Record<string, unknown>[])
            .filter(s => !AUTHORING_IDS.has(canon(String(s.id ?? s.type ?? ''))))
            .map(s => itemToToolItem(s))
        : undefined;
    return { id, label: knownLabel(id), configItem: item, subItems, isNew };
}

function configToToolItem(id: string, cfg: Record<string, unknown>): ToolItem {
    const merged = { id, type: id, ...cfg, ...TOOL_EXTRA_PROPS[id] };
    return { id, label: knownLabel(id), configItem: merged, isNew: false };
}

// ── Dynamic (tool-added) layers ─────────────────────────────────────────────
//
// Tools like webmapx-3d-tool can call adapter.addLayer() at runtime with an
// ad-hoc layer (e.g. an on-demand hillshade layer with an inline `sources`
// object) that never existed in the loaded config's static layerData.layers.
// The download logic below lists every currently-active layer id as a
// state.activeLayers ref regardless of origin, so without this, saving after
// using such a tool produces a config referencing a layer that was never
// added to layerData.layers — invalid on next load ("Layer ... not found").
// adapter.getLayerConfigs() (BaseAdapter) tracks the exact config every
// active layer was added with, dynamic or not, so use it to backfill.
function mergeDynamicLayers(
    base: AppConfig,
    layerConfigs: Map<string, unknown>,
    activeIds: string[],
): { layers: unknown[]; sources: unknown[] } {
    const layers: unknown[] = [...(base.layerData?.layers ?? [])];
    const sources: unknown[] = [...(base.layerData?.sources ?? [])];
    const existingLayerIds = new Set(layers.map(l => (l as unknown as Record<string, unknown>).id));
    const existingSourceIds = new Set(sources.map(s => (s as unknown as Record<string, unknown>).id));

    for (const id of activeIds) {
        if (existingLayerIds.has(id)) continue;
        const cfg = layerConfigs.get(id) as Record<string, unknown> | undefined;
        if (!cfg) continue;

        const { sources: inlineSources, ...layerWithoutInlineSources } = cfg;
        layers.push(layerWithoutInlineSources);
        existingLayerIds.add(id);

        if (inlineSources && typeof inlineSources === 'object') {
            for (const [sourceId, sourceDef] of Object.entries(inlineSources as Record<string, unknown>)) {
                if (existingSourceIds.has(sourceId)) continue;
                sources.push({ ...(sourceDef as Record<string, unknown>), id: sourceId });
                existingSourceIds.add(sourceId);
            }
        }
    }

    return { layers, sources };
}

// ── buildSaveConfig ───────────────────────────────────────────────────────────

function buildSaveConfig(
    base: AppConfig,
    toolbars: ToolbarSection[],
    controls: MapControl[],
    onlyActiveLayers: boolean,
    runtimeActiveLayers: string[],
    runtimeBackground: string | undefined,
    viewport?: { center: [number, number]; zoom: number; bearing: number; pitch: number } | null,
    projection?: string | null,
    projectTitle?: string,
    unsupportedLayerIds?: Set<string>,
    terrainEnabled?: boolean,
): AppConfig {
    const tools: Record<string, unknown> = { ...(base.tools ?? {}) };

    // Apply toolbar edits
    for (const section of toolbars) {
        const orig = (base.tools ?? {})[section.key] as Record<string, unknown> | undefined;
        const origItems = (orig?.items ?? []) as Record<string, unknown>[];

        // Build new items list: ordered by section.items, preserving authoring/non-known items at end
        const newItems: unknown[] = [];
        for (const toolItem of section.items) {
            const origItem = origItems.find(i => canon(String(i.id ?? i.type ?? '')) === toolItem.id);
            const merged = origItem ? { ...origItem, ...toolItem.configItem, enabled: true } : { ...toolItem.configItem, enabled: true };
            // Toolbox: rebuild sub-items
            if (Array.isArray(toolItem.subItems)) {
                const origSubs = (origItem?.items ?? []) as Record<string, unknown>[];
                const newSubs: unknown[] = [];
                for (const sub of toolItem.subItems) {
                    const origSub = origSubs.find(s => canon(String(s.id ?? s.type ?? '')) === sub.id);
                    newSubs.push(origSub ? { ...origSub, ...sub.configItem, enabled: true } : { ...sub.configItem, enabled: true });
                }
                // Append disabled origSubs not in sub list
                for (const s of origSubs) {
                    const sid = canon(String(s.id ?? s.type ?? ''));
                    if (!toolItem.subItems.find(sub => sub.id === sid)) newSubs.push({ ...s, enabled: false });
                }
                (merged as Record<string, unknown>).items = newSubs;
            }
            newItems.push(merged);
        }
        // Append authoring/non-listed items from original (disabled)
        for (const origItem of origItems) {
            const id = canon(String(origItem.id ?? origItem.type ?? ''));
            if (AUTHORING_IDS.has(id)) { newItems.push({ ...origItem, enabled: false }); continue; }
            if (!section.items.find(i => i.id === id)) newItems.push({ ...origItem, enabled: false });
        }

        // Empty toolbar → omit from output entirely
        if (newItems.filter(i => (i as Record<string, unknown>).enabled !== false).length === 0) {
            delete tools[section.key];
        } else {
            tools[section.key] = { ...section.configItem, items: newItems };
        }
    }

    // Apply standalone/control edits
    for (const ctrl of controls) {
        const existing = (base.tools ?? {})[ctrl.id] as Record<string, unknown> | undefined;
        if (existing !== undefined || ctrl.enabled) {
            tools[ctrl.id] = { ...(existing ?? {}), ...ctrl.configItem, enabled: ctrl.enabled };
        }
    }

    // Disable authoring tools
    for (const id of AUTHORING_IDS) {
        if (tools[id]) tools[id] = { ...(tools[id] as Record<string, unknown>), enabled: false };
    }

    const unsupported = unsupportedLayerIds ?? new Set<string>();
    const filteredLayerData = unsupported.size > 0 ? (() => {
        const layers = (base.layerData?.layers ?? []).filter(l => !unsupported.has((l as unknown as Record<string, unknown>).id as string));
        const usedSources = new Set(layers.map(l => (l as unknown as Record<string, unknown>).source as string).filter(Boolean));
        const sources = (base.layerData?.sources ?? []).filter(s => usedSources.has((s as unknown as Record<string, unknown>).id as string));
        return { ...base.layerData, layers, sources };
    })() : base.layerData;

    const baseProject = (base as unknown as Record<string, unknown>).project as Record<string, unknown> | undefined;
    const project = projectTitle?.trim()
        ? { ...baseProject, title: projectTitle.trim(), id: projectTitle.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '') || 'config' }
        : baseProject;

    const runtimeMap = viewport ? {
        ...base.map, center: viewport.center, zoom: Math.round(viewport.zoom * 100) / 100,
        ...(viewport.bearing !== 0 ? { bearing: Math.round(viewport.bearing * 10) / 10 } : { bearing: undefined }),
        ...(viewport.pitch !== 0   ? { pitch: Math.round(viewport.pitch * 10) / 10 }   : { pitch: undefined }),
        ...(projection && projection !== 'mercator' ? { projection } : { projection: undefined }),
    } : base.map;

    const allActiveIds = [
        ...(runtimeBackground && !unsupported.has(runtimeBackground) ? [runtimeBackground] : []),
        ...runtimeActiveLayers.filter(id => !unsupported.has(id)),
    ];
    const runtimeState = {
        ...base.state,
        activeLayers: allActiveIds.map(id => ({ ref: id, visible: true })),
        ...(runtimeBackground ? { activeBackground: runtimeBackground } : {}),
        ...(terrainEnabled ? { terrainEnabled: true } : { terrainEnabled: undefined }),
    };

    if (!onlyActiveLayers) {
        return { ...base, project: project as AppConfig['project'], map: runtimeMap, layerData: filteredLayerData, tools: tools as AppConfig['tools'], state: runtimeState };
    }

    const activeIds = new Set<string>([...runtimeActiveLayers, ...(runtimeBackground ? [runtimeBackground] : [])]);
    const filteredLayers = (base.layerData?.layers ?? []).filter(l => activeIds.has((l as unknown as Record<string, unknown>).id as string));
    const usedSourceIds = new Set(filteredLayers.map(l => (l as unknown as Record<string, unknown>).source as string).filter(Boolean));
    const filteredSources = (base.layerData?.sources ?? []).filter(s => usedSourceIds.has((s as unknown as Record<string, unknown>).id as string));
    const layerData = { ...base.layerData, layers: filteredLayers, sources: filteredSources };

    const filterTree = (nodes: unknown[]): unknown[] => {
        const out: unknown[] = [];
        for (const n of nodes) {
            const node = n as Record<string, unknown>;
            if (node.layerId) { if (activeIds.has(node.layerId as string) && !unsupported.has(node.layerId as string)) out.push(n); }
            else if (Array.isArray(node.children)) { const ch = filterTree(node.children); if (ch.length) out.push({ ...node, children: ch }); }
        }
        return out;
    };
    const filteredTools: Record<string, unknown> = {};
    for (const [key, tool] of Object.entries(tools)) {
        const t = tool as Record<string, unknown>;
        filteredTools[key] = Array.isArray(t?.items)
            ? { ...t, items: (t.items as unknown[]).map(item => { const i = item as Record<string, unknown>; return Array.isArray(i.tree) ? { ...i, tree: filterTree(i.tree) } : item; }) }
            : tool;
    }

    return { ...base, project: project as AppConfig['project'], map: runtimeMap, tools: filteredTools as AppConfig['tools'], layerData, state: runtimeState };
}

// ── Component ─────────────────────────────────────────────────────────────────

@customElement('webmapx-config-edit-tool')
export class WebmapxConfigEditTool extends LitElement {
    @state() private toolbars: ToolbarSection[] = [];
    @state() private controls: MapControl[] = [];
    @state() private onlyActiveLayers = false;
    @state() private removeUnsupported = false;
    @state() private projectTitle = '';
    @state() private filename = 'config.json';

    // Popup state
    @state() private popup: PopupTarget | null = null;
    @state() private popupDraft: Record<string, unknown> = {};

    // Drag state
    private _dragId: string | null = null;
    private _dragToolbar: string | null = null;
    private _dragParent: string | null = null; // toolbox id if dragging sub-item

    static styles = css`
        :host { display: block; padding: 0.75rem; box-sizing: border-box; min-width: 260px; }
        h4 { margin: 0 0 0.6rem; font-size: var(--webmapx-font-size-md, 0.85rem); font-weight: 600; display: flex; align-items: center; gap: 0.4rem; }
        .section-label { font-size: var(--webmapx-font-size-sm, 0.78rem); font-weight: 600; color: var(--sl-color-neutral-600); margin: 0.75rem 0 0.3rem; text-transform: uppercase; letter-spacing: .04em; }
        .toolbar-label { font-size: var(--webmapx-font-size-sm, 0.8rem); font-weight: 600; color: var(--sl-color-neutral-700); margin: 0.5rem 0 0.25rem; }

        /* Tool rows */
        .tool-list { display: flex; flex-direction: column; gap: 2px; }
        .tool-row {
            display: flex; align-items: center; gap: 0.25rem;
            padding: 0.2rem 0.3rem; border-radius: var(--webmapx-radius-sm, 4px);
            border: 1px solid var(--sl-color-neutral-200);
            background: var(--sl-color-neutral-0);
            font-size: var(--webmapx-font-size-sm, 0.82rem);
        }
        .tool-row.drag-over { outline: 2px solid var(--sl-color-primary-500); background: var(--sl-color-primary-50); }
        .tool-row.dragging  { opacity: 0.4; }
        .drag-handle { cursor: grab; color: var(--sl-color-neutral-400); user-select: none; flex-shrink: 0; }
        .drag-handle:active { cursor: grabbing; }
        .tool-name { flex: 1; }

        /* Toolbox sub-section */
        .toolbox-sub { margin: 2px 0 2px 1rem; padding: 0.25rem 0.4rem; border-left: 2px solid var(--sl-color-neutral-300); }
        .toolbox-sub-label { font-size: 0.73rem; color: var(--sl-color-neutral-500); text-transform: uppercase; letter-spacing: .04em; margin-bottom: 0.2rem; }

        /* Map controls (no drag) */
        .control-row { display: flex; align-items: center; gap: 0.25rem; padding: 0.15rem 0.3rem; font-size: var(--webmapx-font-size-sm, 0.82rem); }
        sl-checkbox::part(label) { font-size: var(--webmapx-font-size-sm, 0.82rem); }

        /* Add-tool dropdown */
        .add-row { margin-top: 0.4rem; }

        /* Misc */
        sl-input, sl-select { width: 100%; }
        sl-button[variant="primary"] { margin-top: 0.5rem; width: 100%; }

        /* Popup */
        .prop-popup {
            position: fixed;
            background: #fff;
            border: 1px solid #ccc;
            border-radius: var(--webmapx-radius-md, 6px);
            box-shadow: var(--webmapx-shadow-lg, 0 4px 16px rgba(0,0,0,.18));
            padding: 0.7rem;
            z-index: 9999;
            min-width: 240px;
            max-width: 320px;
            max-height: 480px;
            overflow-y: auto;
        }
        .prop-popup h3 { margin: 0 0 0.5rem; font-size: var(--webmapx-font-size-md, 0.85rem); border-bottom: 1px solid #eee; padding-bottom: 0.35rem; }
        .prop-row { display: flex; align-items: center; gap: 0.4rem; margin-bottom: 0.4rem; font-size: var(--webmapx-font-size-sm, 0.8rem); }
        .prop-row label { flex: 0 0 120px; color: #555; }
        .prop-row input[type="text"],
        .prop-row input[type="number"],
        .prop-row select { flex: 1; padding: 0.15rem 0.3rem; font-size: var(--webmapx-font-size-sm, 0.8rem); border: 1px solid #ccc; border-radius: var(--webmapx-radius-xs, 3px); }
        .prop-row input[type="checkbox"] { width: 1rem; height: 1rem; }
        .prop-row textarea { flex: 1; font-size: var(--webmapx-font-size-sm, 0.78rem); font-family: monospace; border: 1px solid #ccc; border-radius: var(--webmapx-radius-xs, 3px); padding: 0.2rem; resize: vertical; }
        .prop-row textarea.json-invalid { border-color: red; }
        .prop-footer { display: flex; justify-content: flex-end; gap: 0.4rem; margin-top: 0.5rem; }
        .prop-footer button { padding: 0.25rem 0.6rem; font-size: var(--webmapx-font-size-sm, 0.8rem); border-radius: var(--webmapx-radius-xs, 3px); cursor: pointer; border: 1px solid #ccc; background: #f5f5f5; }
        .prop-footer .btn-apply { background: #0f62fe; color: #fff; border-color: #0f62fe; }
    `;

    // ── Lifecycle ─────────────────────────────────────────────────────────────

    private get mapElement(): WebmapxMapElement | null {
        return resolveMapElement(this) as WebmapxMapElement | null;
    }

    connectedCallback(): void {
        super.connectedCallback();
        this.loadFromConfig();
        this._onDocMouseDown = this._onDocMouseDown.bind(this);
        this._onDocKeyDown  = this._onDocKeyDown.bind(this);
        document.addEventListener('mousedown', this._onDocMouseDown);
        document.addEventListener('keydown',   this._onDocKeyDown);
    }

    disconnectedCallback(): void {
        super.disconnectedCallback();
        document.removeEventListener('mousedown', this._onDocMouseDown);
        document.removeEventListener('keydown',   this._onDocKeyDown);
    }

    private _onDocMouseDown(e: MouseEvent): void {
        if (!this.popup) return;
        const popupEl = this.shadowRoot?.querySelector('.prop-popup');
        if (popupEl && !popupEl.contains(e.target as Node)) this.closePopup();
    }

    private _onDocKeyDown(e: KeyboardEvent): void {
        if (e.key === 'Escape') this.closePopup();
    }

    // ── Load ──────────────────────────────────────────────────────────────────

    private loadFromConfig(): void {
        const config = this.mapElement?.config;
        const cfgTools = (config?.tools ?? {}) as Record<string, Record<string, unknown>>;

        // Toolbars — always include KNOWN_TOOLBAR_KEYS, then any extra ones from config
        const toolbars: ToolbarSection[] = [];
        const seenToolbarKeys = new Set<string>();
        const allToolbarKeys = [
            ...KNOWN_TOOLBAR_KEYS,
            ...Object.keys(cfgTools).filter(k => cfgTools[k]?.type === 'toolbar' && !KNOWN_TOOLBAR_KEYS.includes(k)),
        ];
        for (const key of allToolbarKeys) {
            seenToolbarKeys.add(key);
            const v: Record<string, unknown> = cfgTools[key] ?? DEFAULT_TOOLBAR_CONFIG[key] ?? { type: 'toolbar', enabled: true };
            const items: ToolItem[] = (v.items as Record<string, unknown>[] ?? [])
                .filter(i => !AUTHORING_IDS.has(canon(String(i.id ?? i.type ?? ''))) && i.enabled !== false)
                .map(i => itemToToolItem(i));
            toolbars.push({ key, configItem: v, items });
        }
        this.toolbars = toolbars;

        // Map controls (standalone)
        const controls: MapControl[] = [];
        const knownControls = KNOWN_TOOLS.filter(t => t.standalone);
        for (const kt of knownControls) {
            if (AUTHORING_IDS.has(kt.id)) continue;
            // Find in config by id or by type matching STANDALONE_TYPES
            let cfgItem: Record<string, unknown> | undefined;
            let cfgKey: string | undefined;
            for (const [k, v] of Object.entries(cfgTools)) {
                if (canon(k) === kt.id || canon(String(v.type ?? '')) === kt.id || k === kt.id) {
                    cfgItem = v; cfgKey = k; break;
                }
            }
            const id = cfgKey ?? kt.id;
            const baseItem = cfgItem ?? { id, type: kt.id };
            const merged = { ...baseItem, ...(TOOL_EXTRA_PROPS[kt.id] ?? {}) };
            controls.push({ id: kt.id, label: kt.label, enabled: cfgItem ? cfgItem.enabled !== false : false, configItem: merged });
        }
        this.controls = controls;

        const project = (config as unknown as Record<string, unknown>)?.project as Record<string, unknown> | undefined;
        this.projectTitle = typeof project?.title === 'string' ? project.title : '';
        const rawId = typeof project?.id === 'string' ? project.id : 'config';
        this.filename = `${rawId.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '') || 'config'}.json`;
    }

    // ── Toolbar item mutations ────────────────────────────────────────────────

    private removeItem(toolbarKey: string, id: string, parentId?: string): void {
        this.toolbars = this.toolbars.map(tb => {
            if (tb.key !== toolbarKey) return tb;
            if (!parentId) return { ...tb, items: tb.items.filter(i => i.id !== id) };
            return { ...tb, items: tb.items.map(i => i.id !== parentId ? i : { ...i, subItems: i.subItems?.filter(s => s.id !== id) }) };
        });
    }

    private addItem(toolbarKey: string, id: string, parentId?: string): void {
        const kt = KNOWN_TOOLS.find(t => t.id === id);
        if (!kt) return;
        const newItem: ToolItem = { id, label: kt.label, configItem: { id, type: id, enabled: true, ...(TOOL_EXTRA_PROPS[id] ?? {}) }, isNew: true };
        this.toolbars = this.toolbars.map(tb => {
            if (tb.key !== toolbarKey) return tb;
            if (!parentId) return { ...tb, items: [...tb.items, newItem] };
            return { ...tb, items: tb.items.map(i => i.id !== parentId ? i : { ...i, subItems: [...(i.subItems ?? []), newItem] }) };
        });
    }

    private updateItemConfig(toolbarKey: string, id: string, updates: Record<string, unknown>, parentId?: string): void {
        this.toolbars = this.toolbars.map(tb => {
            if (tb.key !== toolbarKey) return tb;
            const patchItem = (item: ToolItem): ToolItem =>
                item.id === id ? { ...item, configItem: { ...item.configItem, ...updates } } : item;
            if (!parentId) return { ...tb, items: tb.items.map(patchItem) };
            return { ...tb, items: tb.items.map(i => i.id !== parentId ? i : { ...i, subItems: i.subItems?.map(patchItem) }) };
        });
    }

    // ── Drag ─────────────────────────────────────────────────────────────────

    private onDragStart(e: DragEvent, id: string, toolbarKey: string, parentId?: string): void {
        this._dragId = id; this._dragToolbar = toolbarKey; this._dragParent = parentId ?? null;
        e.dataTransfer?.setData('text/plain', id);
    }

    private onDragEnd(): void { this._dragId = null; this._dragToolbar = null; this._dragParent = null; }

    private onDrop(e: DragEvent, toId: string, toolbarKey: string, parentId?: string): void {
        e.preventDefault();
        const fromId = this._dragId; if (!fromId || fromId === toId) return;
        if (this._dragToolbar !== toolbarKey || this._dragParent !== (parentId ?? null)) return;
        this.toolbars = this.toolbars.map(tb => {
            if (tb.key !== toolbarKey) return tb;
            const reorder = (items: ToolItem[]): ToolItem[] => {
                const arr = [...items];
                const fi = arr.findIndex(i => i.id === fromId), ti = arr.findIndex(i => i.id === toId);
                if (fi === -1 || ti === -1) return items;
                const [moved] = arr.splice(fi, 1); arr.splice(ti, 0, moved); return arr;
            };
            if (!parentId) return { ...tb, items: reorder(tb.items) };
            return { ...tb, items: tb.items.map(i => i.id !== parentId ? i : { ...i, subItems: reorder(i.subItems ?? []) }) };
        });
    }

    // ── Popup ─────────────────────────────────────────────────────────────────

    private openPopup(e: Event, toolId: string, configItem: Record<string, unknown>, toolbarKey?: string, parentId?: string, isToolbar = false): void {
        const btn = e.currentTarget as HTMLElement;
        const rect = btn.getBoundingClientRect();
        if (this.popup?.toolId === toolId && this.popup?.toolbarKey === toolbarKey && this.popup?.isToolbar === isToolbar) { this.closePopup(); return; }
        let draft: Record<string, unknown>;
        if (isToolbar) {
            // Flatten toolbar own props + panel.* into draft
            draft = {};
            for (const k of TOOLBAR_OWN_PROPS) if (configItem[k] !== undefined) draft[k] = configItem[k];
            const panel = (configItem.panel ?? {}) as Record<string, unknown>;
            for (const k of TOOLBAR_PANEL_PROPS) if (panel[k] !== undefined) draft[`panel.${k}`] = panel[k];
        } else {
            draft = {};
            for (const [k, v] of Object.entries(configItem)) { if (!SKIP_PROPS.has(k)) draft[k] = v; }
        }
        this.popupDraft = draft;
        this.popup = { toolId, toolbarKey, parentId, isToolbar, rect };
    }

    private closePopup(): void { this.popup = null; this.popupDraft = {}; }

    private applyPopup(): void {
        if (!this.popup) return;
        const { toolId, toolbarKey, parentId, isToolbar } = this.popup;
        if (isToolbar && toolbarKey) {
            // Unflatten panel.* back into nested panel object
            const updates: Record<string, unknown> = {};
            const panelUpdates: Record<string, unknown> = {};
            for (const [k, v] of Object.entries(this.popupDraft)) {
                if (k.startsWith('panel.')) panelUpdates[k.slice(6)] = v;
                else updates[k] = v;
            }
            this.toolbars = this.toolbars.map(tb => {
                if (tb.key !== toolbarKey) return tb;
                const panel = { ...(tb.configItem.panel as Record<string, unknown> ?? {}), ...panelUpdates };
                return { ...tb, configItem: { ...tb.configItem, ...updates, panel } };
            });
        } else if (toolbarKey) {
            this.updateItemConfig(toolbarKey, toolId, this.popupDraft, parentId);
        } else {
            this.controls = this.controls.map(c => c.id !== toolId ? c : { ...c, configItem: { ...c.configItem, ...this.popupDraft } });
        }
        this.closePopup();
    }

    private resetPopup(): void {
        if (!this.popup) return;
        const { toolId, toolbarKey, parentId, isToolbar } = this.popup;
        const original = this.mapElement?.config;
        const cfgTools = (original?.tools ?? {}) as Record<string, Record<string, unknown>>;
        let configItem: Record<string, unknown> = {};
        if (isToolbar && toolbarKey) {
            configItem = cfgTools[toolbarKey] ?? DEFAULT_TOOLBAR_CONFIG[toolbarKey] ?? {};
            const draft: Record<string, unknown> = {};
            for (const k of TOOLBAR_OWN_PROPS) if (configItem[k] !== undefined) draft[k] = configItem[k];
            const panel = (configItem.panel ?? {}) as Record<string, unknown>;
            for (const k of TOOLBAR_PANEL_PROPS) if (panel[k] !== undefined) draft[`panel.${k}`] = panel[k];
            this.popupDraft = draft;
        } else {
            if (toolbarKey) {
                const tb = cfgTools[toolbarKey];
                const items = tb?.items as Record<string, unknown>[] ?? [];
                const findItem = (arr: Record<string, unknown>[]): Record<string, unknown> | undefined => {
                    for (const i of arr) {
                        if (canon(String(i.id ?? i.type ?? '')) === toolId) return i;
                        if (Array.isArray(i.items)) { const f = findItem(i.items as Record<string, unknown>[]); if (f) return f; }
                    }
                    return undefined;
                };
                configItem = findItem(parentId ? (items.find(i => canon(String(i.id ?? i.type ?? '')) === parentId) as Record<string, unknown>)?.items as Record<string, unknown>[] ?? [] : items) ?? {};
            } else {
                configItem = cfgTools[toolId] ?? {};
            }
            const draft: Record<string, unknown> = {};
            for (const [k, v] of Object.entries(configItem)) { if (!SKIP_PROPS.has(k)) draft[k] = v; }
            this.popupDraft = draft;
        }
    }

    // ── Download ─────────────────────────────────────────────────────────────

    private async handleDownload(): Promise<void> {
        const mapEl = this.mapElement;
        const loadedConfig = mapEl?.config;
        if (!loadedConfig) return;

        const adapter = (mapEl as unknown as Record<string, unknown>)?.adapter as {
            store?: { getState?: () => { mapLayers?: Record<string, Record<string, unknown>> } };
            getViewportState?: () => { center: [number, number]; zoom: number; bearing: number; pitch: number };
            getProjection?: () => { name: string } | null;
            getLayerConfigs?: () => Map<string, unknown>;
            isTerrainEnabled?: () => boolean | null;
        } | undefined;
        const runtimeLayers = adapter?.store?.getState?.()?.mapLayers ?? {};
        const viewport = adapter?.getViewportState?.();
        const projectionName = adapter?.getProjection?.()?.name ?? null;
        const runtimeActiveLayers: string[] = [];
        let runtimeBackground: string | undefined;
        for (const [id, entry] of Object.entries(runtimeLayers)) {
            if (entry?.visible === false) continue;
            if (entry?.legendRole === 'background') runtimeBackground = id;
            else runtimeActiveLayers.push(id);
        }

        // Backfill any tool-added dynamic layers (e.g. 3D tool's on-demand hillshade) into
        // layerData before building the save config, so activeLayers refs resolve on next load.
        const layerConfigs = adapter?.getLayerConfigs?.() ?? new Map<string, unknown>();
        const { layers: mergedLayers, sources: mergedSources } = mergeDynamicLayers(
            loadedConfig, layerConfigs, [...runtimeActiveLayers, ...(runtimeBackground ? [runtimeBackground] : [])]
        );
        const config: AppConfig = { ...loadedConfig, layerData: { ...loadedConfig.layerData, layers: mergedLayers as AppConfig['layerData']['layers'], sources: mergedSources as AppConfig['layerData']['sources'] } };

        type MapElWithSupport = { isCatalogLayerSupported?: (id: string) => Promise<boolean> };
        let unsupportedLayerIds = new Set<string>();
        let fallbackBackground: string | undefined;

        if (this.removeUnsupported) {
            const checkSupport = (id: string) => (mapEl as unknown as MapElWithSupport)?.isCatalogLayerSupported?.(id) ?? Promise.resolve(true);
            const results = await Promise.all((config.layerData?.layers ?? []).map(async l => {
                const id = (l as unknown as Record<string, unknown>).id as string;
                return (await checkSupport(id)) ? null : id;
            }));
            unsupportedLayerIds = new Set(results.filter((id): id is string => id !== null));
            if (runtimeBackground && unsupportedLayerIds.has(runtimeBackground)) {
                const bgLayer = (config.layerData?.layers ?? []).find(l => (l as unknown as Record<string, unknown>).id === runtimeBackground) as Record<string, unknown> | undefined;
                const bgGroup = bgLayer?.singleGroup as string | undefined;
                if (bgGroup) {
                    for (const l of config.layerData?.layers ?? []) {
                        const ll = l as unknown as Record<string, unknown>;
                        if (ll.singleGroup === bgGroup && !unsupportedLayerIds.has(ll.id as string)) { fallbackBackground = ll.id as string; break; }
                    }
                }
                if (!fallbackBackground) {
                    const { showToast } = await import('../utils/toast');
                    showToast('<strong>No supported background layer available</strong><br>All background layers are unsupported by the current engine. Uncheck "Remove engine-unsupported layers" or switch engine.', { variant: 'danger' });
                    return;
                }
            }
        }

        const effectiveBackground = (runtimeBackground && unsupportedLayerIds.has(runtimeBackground)) ? fallbackBackground : runtimeBackground;
        const terrainEnabled = adapter?.isTerrainEnabled?.() === true;
        const out = buildSaveConfig(config, this.toolbars, this.controls, this.onlyActiveLayers, runtimeActiveLayers, effectiveBackground, viewport, projectionName, this.projectTitle, unsupportedLayerIds, terrainEnabled);
        const blob = new Blob([JSON.stringify(out, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        Object.assign(document.createElement('a'), { href: url, download: this.filename || 'config.json' }).click();
        URL.revokeObjectURL(url);
    }

    // ── Render helpers ────────────────────────────────────────────────────────

    private renderToolRow(item: ToolItem, toolbarKey: string, parentId?: string): TemplateResult {
        const editableProps = Object.keys(item.configItem).filter(k => !SKIP_PROPS.has(k));
        return html`
            <div class="tool-row"
                draggable="true"
                @dragstart=${(e: DragEvent) => { this.onDragStart(e, item.id, toolbarKey, parentId); (e.currentTarget as HTMLElement).classList.add('dragging'); }}
                @dragend=${(e: DragEvent)   => { this.onDragEnd(); (e.currentTarget as HTMLElement).classList.remove('dragging'); }}
                @dragover=${(e: DragEvent)  => { e.preventDefault(); (e.currentTarget as HTMLElement).classList.add('drag-over'); }}
                @dragleave=${(e: DragEvent) => (e.currentTarget as HTMLElement).classList.remove('drag-over')}
                @drop=${(e: DragEvent)      => { (e.currentTarget as HTMLElement).classList.remove('drag-over'); this.onDrop(e, item.id, toolbarKey, parentId); }}>
                <span class="drag-handle" title="Drag to reorder">⠿</span>
                <span class="tool-name">${item.label}</span>
                ${editableProps.length > 0 ? html`
                    <sl-icon-button name="gear" label="Options" style="font-size:0.85rem"
                        @click=${(e: Event) => this.openPopup(e, item.id, item.configItem, toolbarKey, parentId)}>
                    </sl-icon-button>
                ` : nothing}
                <sl-icon-button name="x" label="Remove" style="font-size:0.85rem"
                    @click=${() => this.removeItem(toolbarKey, item.id, parentId)}>
                </sl-icon-button>
            </div>
            ${item.subItems !== undefined ? this.renderToolboxSub(item, toolbarKey) : nothing}
        `;
    }

    private renderToolboxSub(toolboxItem: ToolItem, toolbarKey: string): TemplateResult {
        const tbKey = toolbarKey;
        const parentId = toolboxItem.id;
        const enabledIds = new Set(toolboxItem.subItems!.map(s => s.id));
        const addable = KNOWN_TOOLS.filter(t => !t.standalone && t.id !== 'toolbox' && !AUTHORING_IDS.has(t.id) && !enabledIds.has(t.id));
        return html`
            <div class="toolbox-sub">
                <div class="toolbox-sub-label">${toolboxItem.label} contents</div>
                <div class="tool-list">
                    ${toolboxItem.subItems!.map(sub => this.renderToolRow(sub, tbKey, parentId))}
                </div>
                ${addable.length > 0 ? html`
                    <div class="add-row">
                        <sl-select size="small" placeholder="Add sub-tool…" clearable
                            @sl-change=${(e: Event) => { const v = (e.target as HTMLSelectElement).value; if (v) { this.addItem(tbKey, v, parentId); (e.target as HTMLSelectElement).value = ''; } }}>
                            ${addable.map(t => html`<sl-option value=${t.id}>${t.label}</sl-option>`)}
                        </sl-select>
                    </div>
                ` : nothing}
            </div>
        `;
    }

    private renderPopup(): TemplateResult | typeof nothing {
        if (!this.popup) return nothing;
        const { toolId, toolbarKey, parentId, isToolbar, rect } = this.popup;

        // Find label
        let label: string;
        if (isToolbar && toolbarKey) {
            label = toolbarKey === 'mainToolbar' ? 'Toolbar' : toolbarKey;
        } else {
            label = knownLabel(toolId);
            if (toolbarKey) {
                const tb = this.toolbars.find(t => t.key === toolbarKey);
                const items = parentId ? tb?.items.find(i => i.id === parentId)?.subItems : tb?.items;
                const found = items?.find(i => i.id === toolId);
                if (found) label = found.label;
            }
        }

        // Position: below button, flip up if too close to bottom
        let top = rect.bottom + 4;
        let left = rect.left;
        if (top + 400 > window.innerHeight) top = Math.max(4, rect.top - 404);
        if (left + 330 > window.innerWidth)  left = Math.max(4, window.innerWidth - 334);

        const fields = Object.entries(this.popupDraft);

        return html`
            <div class="prop-popup" style="top:${top}px;left:${left}px" @mousedown=${(e: Event) => e.stopPropagation()}>
                <h3>${label} options</h3>
                ${fields.length === 0 ? html`<p style="font-size:0.8rem;color:#888;margin:0">No editable options.</p>` : nothing}
                ${fields.map(([k, v]) => {
                    const options = PROP_OPTIONS[k];
                    return html`
                        <div class="prop-row">
                            <label title=${k}>${k}</label>
                            ${typeof v === 'boolean' ? html`
                                <input type="checkbox" ?checked=${v}
                                    @change=${(e: Event) => { this.popupDraft = { ...this.popupDraft, [k]: (e.target as HTMLInputElement).checked }; }}>
                            ` : typeof v === 'number' ? html`
                                <input type="number" .value=${String(v)}
                                    @input=${(e: Event) => { const n = parseFloat((e.target as HTMLInputElement).value); if (!isNaN(n)) this.popupDraft = { ...this.popupDraft, [k]: n }; }}>
                            ` : options ? html`
                                <select .value=${String(v)}
                                    @change=${(e: Event) => { this.popupDraft = { ...this.popupDraft, [k]: (e.target as HTMLSelectElement).value }; }}>
                                    ${!options.includes(String(v)) ? html`<option value=${String(v)}>${String(v)}</option>` : nothing}
                                    ${options.map(o => html`<option value=${o} ?selected=${String(v) === o}>${o}</option>`)}
                                </select>
                            ` : typeof v === 'string' ? html`
                                <input type="text" .value=${v}
                                    @input=${(e: Event) => { this.popupDraft = { ...this.popupDraft, [k]: (e.target as HTMLInputElement).value }; }}>
                            ` : html`
                                <textarea rows="3" .value=${JSON.stringify(v, null, 2)}
                                    @input=${(e: Event) => {
                                        const ta = e.target as HTMLTextAreaElement;
                                        try { const parsed = JSON.parse(ta.value); ta.classList.remove('json-invalid'); this.popupDraft = { ...this.popupDraft, [k]: parsed }; }
                                        catch { ta.classList.add('json-invalid'); }
                                    }}></textarea>
                            `}
                        </div>
                    `;
                })}
                <div class="prop-footer">
                    <button @click=${() => this.resetPopup()}>Reset</button>
                    <button class="btn-apply" @click=${() => this.applyPopup()}>OK</button>
                </div>
            </div>
        `;
    }

    render() {
        return html`
            <h4><sl-icon name="pencil-square"></sl-icon> Edit config</h4>

            <sl-input size="small" label="Project title" required
                ?invalid=${!this.projectTitle.trim()}
                help-text=${!this.projectTitle.trim() ? 'Title is required' : ''}
                .value=${this.projectTitle}
                @sl-input=${(e: Event) => {
                    this.projectTitle = (e.target as HTMLInputElement).value;
                    const slug = this.projectTitle.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '') || 'config';
                    this.filename = `${slug}.json`;
                }}>
            </sl-input>

            <sl-checkbox ?checked=${this.onlyActiveLayers}
                @sl-change=${(e: Event) => { this.onlyActiveLayers = (e.target as HTMLInputElement).checked; }}>
                Only active layers
            </sl-checkbox>
            <sl-checkbox ?checked=${this.removeUnsupported}
                @sl-change=${(e: Event) => { this.removeUnsupported = (e.target as HTMLInputElement).checked; }}>
                Remove engine-unsupported layers
            </sl-checkbox>

            ${this.toolbars.map(tb => {
                const toolbarLabel = tb.key === 'mainToolbar' ? 'Toolbar tools' : `${tb.key} tools`;
                const enabledIds = new Set(tb.items.map(i => i.id));
                const addable = KNOWN_TOOLS.filter(t => !t.standalone && !AUTHORING_IDS.has(t.id) && !enabledIds.has(t.id));
                return html`
                    <div class="section-label" style="display:flex;align-items:center;gap:0.25rem">
                        <span style="flex:1">${toolbarLabel}</span>
                        <sl-icon-button name="gear" label="Toolbar settings" style="font-size:0.85rem"
                            @click=${(e: Event) => this.openPopup(e, tb.key, tb.configItem, tb.key, undefined, true)}>
                        </sl-icon-button>
                    </div>
                    <div class="tool-list">
                        ${tb.items.map(item => this.renderToolRow(item, tb.key))}
                    </div>
                    ${addable.length > 0 ? html`
                        <div class="add-row">
                            <sl-select size="small" placeholder="Add tool…" clearable
                                @sl-change=${(e: Event) => { const v = (e.target as HTMLSelectElement).value; if (v) { this.addItem(tb.key, v); (e.target as HTMLSelectElement).value = ''; } }}>
                                ${addable.map(t => html`<sl-option value=${t.id}>${t.label}</sl-option>`)}
                            </sl-select>
                        </div>
                    ` : nothing}
                `;
            })}

            <div class="section-label">Map controls</div>
            <div class="tool-list">
                ${this.controls.map(ctrl => {
                    const editableProps = Object.keys(ctrl.configItem).filter(k => !SKIP_PROPS.has(k));
                    return html`
                        <div class="control-row">
                            <sl-checkbox ?checked=${ctrl.enabled}
                                @sl-change=${(e: Event) => {
                                    const checked = (e.target as HTMLInputElement).checked;
                                    this.controls = this.controls.map(c => c.id !== ctrl.id ? c : { ...c, enabled: checked });
                                }}>
                                ${ctrl.label}
                            </sl-checkbox>
                            ${editableProps.length > 0 ? html`
                                <sl-icon-button name="gear" label="Options" style="font-size:0.85rem"
                                    @click=${(e: Event) => this.openPopup(e, ctrl.id, ctrl.configItem)}>
                                </sl-icon-button>
                            ` : nothing}
                        </div>
                    `;
                })}
            </div>

            <sl-divider></sl-divider>

            <sl-input size="small" label="Filename"
                .value=${this.filename}
                @sl-input=${(e: Event) => { this.filename = (e.target as HTMLInputElement).value; }}>
            </sl-input>

            <sl-button variant="primary" ?disabled=${!this.projectTitle.trim()} @click=${this.handleDownload}>
                <sl-icon slot="prefix" name="download"></sl-icon>
                Download config
            </sl-button>

            ${this.renderPopup()}
        `;
    }
}
