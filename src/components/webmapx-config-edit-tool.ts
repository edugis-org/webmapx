import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';

import '@shoelace-style/shoelace/dist/components/button/button.js';
import '@shoelace-style/shoelace/dist/components/checkbox/checkbox.js';
import '@shoelace-style/shoelace/dist/components/input/input.js';
import '@shoelace-style/shoelace/dist/components/icon/icon.js';
import '@shoelace-style/shoelace/dist/components/divider/divider.js';

import { resolveMapElement } from './internal/map-context';
import type { WebmapxMapElement } from './webmapx-map';
import type { AppConfig } from '../config/types';
import { KNOWN_TOOLS } from '../utils/dynamic-layout';

/** Tool IDs that are authoring-only — disabled in the saved output. */
const AUTHORING_TOOL_IDS = new Set(['configedit', 'config-edit', 'settings']);

/** Canonical IDs for deduplication (aliases map to the same entry). */
const ALIAS_TO_CANONICAL: Record<string, string> = {
    layers: 'layerTree', catalog: 'layerTree', datacatalog: 'layerTree',
    legend: 'layerOverview',
    geolocate: 'geolocation',
};

function canonicalId(id: string): string {
    return ALIAS_TO_CANONICAL[id] ?? id;
}

function isToolEnabled(config: AppConfig, canonId: string): boolean | null {
    const tools = config.tools ?? {};
    // Check canonical id and known aliases
    for (const [id, tool] of Object.entries(tools)) {
        if (canonicalId(id) === canonId) {
            return (tool as Record<string, unknown>)?.enabled !== false;
        }
    }
    // Also check inside toolbar items
    for (const tool of Object.values(tools)) {
        const items = (tool as Record<string, unknown>)?.items as unknown[] | undefined;
        if (!Array.isArray(items)) continue;
        for (const item of items) {
            const i = item as Record<string, unknown>;
            if (canonicalId(String(i.id ?? i.type ?? '')) === canonId) {
                return i.enabled !== false;
            }
        }
    }
    return null; // not in config
}

function buildSaveConfig(
    base: AppConfig,
    toolEnabled: Map<string, boolean>,
    onlyActiveLayers: boolean,
    runtimeActiveLayers: string[],
    runtimeBackground: string | undefined,
    viewport?: { center: [number, number]; zoom: number; bearing: number; pitch: number } | null,
    projection?: string | null,
    projectTitle?: string,
    unsupportedLayerIds?: Set<string>,
): AppConfig {
    // Track which canonical tool IDs have been handled (to detect missing ones)
    const handled = new Set<string>();
    let firstToolbarKey: string | null = null;

    // Tools: apply enabled overrides, disable authoring tools, update toolbar items
    const tools: Record<string, unknown> = {};
    for (const [id, tool] of Object.entries(base.tools ?? {})) {
        const t = (tool ?? {}) as Record<string, unknown>;
        const cid = canonicalId(id);
        if (AUTHORING_TOOL_IDS.has(id) || AUTHORING_TOOL_IDS.has(cid)) {
            tools[id] = { ...t, enabled: false };
            handled.add(cid);
        } else if (Array.isArray(t.items)) {
            // Toolbar: update enabled state of each item
            if (!firstToolbarKey) firstToolbarKey = id;
            const newItems = (t.items as unknown[]).map((item) => {
                const i = item as Record<string, unknown>;
                const itemCid = canonicalId(String(i.id ?? i.type ?? ''));
                if (AUTHORING_TOOL_IDS.has(itemCid)) { handled.add(itemCid); return { ...i, enabled: false }; }
                if (toolEnabled.has(itemCid)) { handled.add(itemCid); return { ...i, enabled: toolEnabled.get(itemCid) }; }
                return item;
            });
            tools[id] = { ...t, items: newItems };
        } else {
            if (toolEnabled.has(cid)) { handled.add(cid); tools[id] = { ...t, enabled: toolEnabled.get(cid) }; }
            else tools[id] = tool;
        }
    }

    // Add tools that were checked but don't exist in the config yet
    const missingChecked = Array.from(toolEnabled.entries())
        .filter(([cid, en]) => en === true && !handled.has(cid) && !AUTHORING_TOOL_IDS.has(cid));
    if (missingChecked.length > 0 && firstToolbarKey) {
        const tb = tools[firstToolbarKey] as Record<string, unknown>;
        const items = [...((tb.items as unknown[]) ?? [])];
        for (const [cid] of missingChecked) {
            items.push({ id: cid, type: cid, enabled: true });
        }
        tools[firstToolbarKey] = { ...tb, items };
    }

    // Remove engine-unsupported layers from layerData and active lists
    const unsupported = unsupportedLayerIds ?? new Set<string>();
    const filteredLayerData = unsupported.size > 0 ? (() => {
        const layers = (base.layerData?.layers ?? []).filter(
            (l) => !unsupported.has((l as unknown as Record<string, unknown>).id as string)
        );
        const usedSources = new Set(layers.map((l) => (l as unknown as Record<string, unknown>).source as string).filter(Boolean));
        const sources = (base.layerData?.sources ?? []).filter(
            (s) => usedSources.has((s as unknown as Record<string, unknown>).id as string)
        );
        return { ...base.layerData, layers, sources };
    })() : base.layerData;

    // Update project title and id if title changed
    const baseProject = (base as unknown as Record<string, unknown>).project as Record<string, unknown> | undefined;
    const project = projectTitle?.trim()
        ? {
            ...baseProject,
            title: projectTitle.trim(),
            id: projectTitle.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '') || 'config',
          }
        : baseProject;

    // Update map section with current viewport and projection
    const runtimeMap = viewport ? {
        ...base.map,
        center: viewport.center,
        zoom: Math.round(viewport.zoom * 100) / 100,
        ...(viewport.bearing !== 0 ? { bearing: Math.round(viewport.bearing * 10) / 10 } : { bearing: undefined }),
        ...(viewport.pitch !== 0 ? { pitch: Math.round(viewport.pitch * 10) / 10 } : { pitch: undefined }),
        ...(projection && projection !== 'mercator' ? { projection } : { projection: undefined }),
    } : base.map;

    // Build state from runtime layer info (reflects deletions, reorders).
    // Background must be included in activeLayers too (so collectInitialActiveLayerRefs loads it)
    // AND in activeBackground (so the background group policy selects the right radio).
    const allActiveIds = [
        ...(runtimeBackground && !unsupported.has(runtimeBackground) ? [runtimeBackground] : []),
        ...runtimeActiveLayers.filter((id) => !unsupported.has(id)),
    ];
    const runtimeState = {
        ...base.state,
        activeLayers: allActiveIds.map((id) => ({ ref: id, visible: true })),
        ...(runtimeBackground ? { activeBackground: runtimeBackground } : {}),
    };

    if (!onlyActiveLayers) {
        return { ...base, project: project as AppConfig['project'], map: runtimeMap, layerData: filteredLayerData, tools: tools as AppConfig['tools'], state: runtimeState };
    }

    // Use runtime active layers (reflects deletions, reorders)
    const activeIds = new Set<string>(runtimeActiveLayers);
    if (runtimeBackground) activeIds.add(runtimeBackground);

    // Filter layerData.layers
    const filteredLayers = (base.layerData?.layers ?? []).filter((l) => activeIds.has((l as unknown as Record<string, unknown>).id as string));
    // Remove unused sources
    const usedSourceIds = new Set(filteredLayers.map((l) => (l as unknown as Record<string, unknown>).source as string).filter(Boolean));
    const filteredSources = (base.layerData?.sources ?? []).filter((s) => usedSourceIds.has((s as unknown as Record<string, unknown>).id as string));
    const layerData = { ...base.layerData, layers: filteredLayers, sources: filteredSources };

    // Filter layer tree nodes recursively
    const filterTree = (nodes: unknown[]): unknown[] => {
        const result: unknown[] = [];
        for (const node of nodes) {
            const n = node as Record<string, unknown>;
            if (n.layerId) {
                if (activeIds.has(n.layerId as string) && !unsupported.has(n.layerId as string)) result.push(node);
            } else if (Array.isArray(n.children)) {
                const children = filterTree(n.children);
                if (children.length > 0) result.push({ ...n, children });
            }
            // getcapabilities nodes are removed: discovered layers (if active)
            // exist in the adapter directly, not in the static tree config
        }
        return result;
    };
    const filteredTools: Record<string, unknown> = {};
    for (const [key, tool] of Object.entries(tools)) {
        const t = tool as Record<string, unknown>;
        if (Array.isArray(t?.items)) {
            filteredTools[key] = {
                ...t,
                items: (t.items as unknown[]).map((item) => {
                    const i = item as Record<string, unknown>;
                    if (Array.isArray(i.tree)) return { ...i, tree: filterTree(i.tree) };
                    return item;
                }),
            };
        } else {
            filteredTools[key] = tool;
        }
    }

    return { ...base, project: project as AppConfig['project'], map: runtimeMap, tools: filteredTools as AppConfig['tools'], layerData, state: runtimeState };
}

@customElement('webmapx-config-edit-tool')
export class WebmapxConfigEditTool extends LitElement {
    /** null = not in config (unchecked by default), true/false = explicit state */
    @state() private toolEnabled = new Map<string, boolean | null>();
    @state() private onlyActiveLayers = false;
    @state() private removeUnsupported = false;
    @state() private projectTitle = '';
    @state() private filename = 'config.json';

    static styles = css`
        :host { display: block; padding: 0.75rem; box-sizing: border-box; min-width: 220px; }
        h4 { margin: 0 0 0.6rem; font-size: 0.85rem; font-weight: 600; display: flex; align-items: center; gap: 0.4rem; }
        .section-label { font-size: 0.78rem; font-weight: 600; color: var(--sl-color-neutral-600); margin: 0.6rem 0 0.3rem; }
        .tool-list { display: flex; flex-direction: column; gap: 0.15rem; }
        sl-checkbox::part(label) { font-size: 0.82rem; }
        sl-input { margin-top: 0.6rem; }
        sl-button { margin-top: 0.5rem; width: 100%; }
    `;

    private get mapElement(): WebmapxMapElement | null {
        return resolveMapElement(this) as WebmapxMapElement | null;
    }

    connectedCallback(): void {
        super.connectedCallback();
        this.loadFromConfig();
    }

    private loadFromConfig(): void {
        const config = this.mapElement?.config;
        const map = new Map<string, boolean | null>();
        for (const { id } of KNOWN_TOOLS) {
            if (AUTHORING_TOOL_IDS.has(id)) continue;
            map.set(id, isToolEnabled(config ?? ({} as AppConfig), id));
        }
        this.toolEnabled = map;
        const project = (config as unknown as Record<string, unknown>)?.project as Record<string, unknown> | undefined;
        this.projectTitle = typeof project?.title === 'string' ? project.title : '';
        const rawId = typeof project?.id === 'string' ? project.id : 'config';
        const slug = rawId.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '') || 'config';
        this.filename = `${slug}.json`;
    }

    private handleTitleInput(e: Event): void {
        this.projectTitle = (e.target as HTMLInputElement).value;
        // Sync filename to slugified title
        const slug = this.projectTitle.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '') || 'config';
        this.filename = `${slug}.json`;
    }

    private toggle(id: string, enabled: boolean): void {
        this.toolEnabled = new Map(this.toolEnabled).set(id, enabled);
    }

    private async handleDownload(): Promise<void> {
        const mapEl = this.mapElement;
        const config = mapEl?.config;
        if (!config) return;

        // Read current runtime layer state from adapter — reflects deletions, reorders, etc.
        const adapter = (mapEl as unknown as Record<string, unknown>)?.adapter as {
            store?: { getState?: () => { mapLayers?: Record<string, Record<string, unknown>> } };
            getViewportState?: () => { center: [number, number]; zoom: number; bearing: number; pitch: number };
            getProjection?: () => { name: string } | null;
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

        // Collect unsupported layer IDs if requested
        type MapElWithSupport = { isCatalogLayerSupported?: (id: string) => Promise<boolean> };
        let unsupportedLayerIds = new Set<string>();
        let fallbackBackground: string | undefined;

        if (this.removeUnsupported) {
            const checkSupport = (id: string) =>
                (mapEl as unknown as MapElWithSupport)?.isCatalogLayerSupported?.(id) ?? Promise.resolve(true);

            const results = await Promise.all(
                (config.layerData?.layers ?? []).map(async (l) => {
                    const id = (l as unknown as Record<string, unknown>).id as string;
                    return (await checkSupport(id)) ? null : id;
                })
            );
            unsupportedLayerIds = new Set(results.filter((id): id is string => id !== null));

            // If the active background is unsupported, find the first supported alternative
            if (runtimeBackground && unsupportedLayerIds.has(runtimeBackground)) {
                // Find the singleGroup of the current background layer
                const bgLayer = (config.layerData?.layers ?? []).find(
                    (l) => (l as unknown as Record<string, unknown>).id === runtimeBackground
                ) as Record<string, unknown> | undefined;
                const bgGroup = bgLayer?.singleGroup as string | undefined;

                if (bgGroup) {
                    // Find first supported layer with same singleGroup
                    for (const l of config.layerData?.layers ?? []) {
                        const ll = l as unknown as Record<string, unknown>;
                        if (ll.singleGroup === bgGroup && !unsupportedLayerIds.has(ll.id as string)) {
                            fallbackBackground = ll.id as string;
                            break;
                        }
                    }
                }

                if (!fallbackBackground) {
                    // No supported background available — block download
                    const { showToast } = await import('../utils/toast');
                    showToast('<strong>No supported background layer available</strong><br>All background layers are unsupported by the current engine. Uncheck "Remove engine-unsupported layers" or switch engine.', { variant: 'danger' });
                    return;
                }
            }
        }

        const overrides = new Map<string, boolean>();
        for (const [id, val] of this.toolEnabled) {
            if (val !== null) overrides.set(id, val as boolean);
        }
        const effectiveBackground = (runtimeBackground && unsupportedLayerIds.has(runtimeBackground))
            ? fallbackBackground
            : runtimeBackground;
        const out = buildSaveConfig(config, overrides, this.onlyActiveLayers, runtimeActiveLayers, effectiveBackground, viewport, projectionName, this.projectTitle, unsupportedLayerIds);
        const blob = new Blob([JSON.stringify(out, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        Object.assign(document.createElement('a'), { href: url, download: this.filename || 'config.json' }).click();
        URL.revokeObjectURL(url);
    }

    render() {
        const visibleTools = KNOWN_TOOLS.filter(t => !AUTHORING_TOOL_IDS.has(t.id));
        return html`
            <h4><sl-icon name="pencil-square"></sl-icon> Edit config</h4>

            <sl-input size="small" label="Project title" required
                ?invalid=${!this.projectTitle.trim()}
                help-text=${!this.projectTitle.trim() ? 'Title is required' : ''}
                .value=${this.projectTitle}
                @sl-input=${this.handleTitleInput}>
            </sl-input>

            <sl-checkbox
                ?checked=${this.onlyActiveLayers}
                @sl-change=${(e: Event) => { this.onlyActiveLayers = (e.target as HTMLInputElement).checked; }}>
                Only active layers
            </sl-checkbox>
            <sl-checkbox
                ?checked=${this.removeUnsupported}
                @sl-change=${(e: Event) => { this.removeUnsupported = (e.target as HTMLInputElement).checked; }}>
                Remove engine-unsupported layers
            </sl-checkbox>

            <div class="section-label">Visible tools:</div>
            <div class="tool-list">
                ${visibleTools.map(t => html`
                    <sl-checkbox
                        ?checked=${this.toolEnabled.get(t.id) === true}
                        @sl-change=${(e: Event) => this.toggle(t.id, (e.target as HTMLInputElement).checked)}>
                        ${t.label}
                    </sl-checkbox>
                `)}
            </div>

            <sl-input size="small" label="Filename"
                .value=${this.filename}
                @sl-input=${(e: Event) => { this.filename = (e.target as HTMLInputElement).value; }}>
            </sl-input>

            <sl-button variant="primary" ?disabled=${!this.projectTitle.trim()} @click=${this.handleDownload}>
                <sl-icon slot="prefix" name="download"></sl-icon>
                Download config
            </sl-button>
        `;
    }
}
