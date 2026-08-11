import { LitElement, html, css } from 'lit';
import type { TemplateResult } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

import '@shoelace-style/shoelace/dist/components/tree/tree.js';
import '@shoelace-style/shoelace/dist/components/tree-item/tree-item.js';
import '@shoelace-style/shoelace/dist/components/checkbox/checkbox.js';
import '@shoelace-style/shoelace/dist/components/spinner/spinner.js';

import type { TreeNodeConfig, TreeSelectionMode } from '../config/types';
import type { WebmapxMapElement } from './webmapx-map';
import type { IMap } from '../map/IMapInterfaces';
import type { LayerAddEvent, LayerRemoveEvent } from '../store/map-events';
import type { DiscoveredLayer } from '../utils/layer-discovery';
import { deriveLayerSwatch, splitLayerTitle, swatchStyle } from '../utils/layer-swatch';


type CapsStatus = { status: 'loading' } | { status: 'error'; error: string } | { status: 'loaded'; children: LayerNode[] };

export interface LayerNode {
    label?: string;
    children?: LayerNode[];
    layerId?: string;
    selectionMode?: TreeSelectionMode;
    selectionGroup?: string;
    allowNone?: boolean;
    stackOrder?: number;
    checked?: boolean;
    expanded?: boolean;
    separator?: boolean;
    /** 'getcapabilities' or 'capabilities' — lazy-loads WMS layers from a GetCapabilities URL */
    type?: string;
    /** WMS GetCapabilities URL (required when type is 'getcapabilities'/'capabilities') */
    url?: string;
    /** WMS layer names to include (whitelist). Comma-separated string or array. */
    allowedLayers?: string | string[];
    /** WMS layer names to exclude (blacklist). Comma-separated string or array. */
    deniedLayers?: string | string[];
    /** Override tile fetch base URL(s) — WMS query string from capabilities is appended to each. */
    tilecacheUrl?: string | string[];
    /** Inline layer payload for nodes discovered from WMS capabilities (not catalog-based). */
    layerSpec?: Record<string, unknown>;
}

type SelectionContext = {
    selectionMode: TreeSelectionMode;
    selectionGroup: string | null;
    exclusiveGroupKey: string | null;
    allowNone: boolean;
    stackOrder?: number;
};

type LayerCheckDetail = {
    layerInformation: { layer: unknown };
    checked: boolean;
    selectionGroup?: string;
    selectionMode?: TreeSelectionMode;
    stackOrder?: number;
};

type LayerSupportStatus = 'unknown' | 'checking' | 'supported' | 'unsupported';

/**
 * Layer tree component that displays a hierarchical tree of map layers.
 *
 * Can receive tree data in two ways:
 * 1. Via `tree` property (external control)
 * 2. Automatically from parent webmapx-map's config (declarative usage)
 */
@customElement('webmapx-layer-tree')
export class WebmapxLayerTree extends LitElement {
    /** Externally provided tree data (takes precedence over config) */
    @property({ type: Array }) tree: LayerNode[] = [];

    /** Optional tool id to bind this component to a specific layerTree tool config entry */
    @property({ type: String, attribute: 'tool-id' }) toolId: string | null = null;

    /** Tree data loaded from config */
    @state() private configTree: TreeNodeConfig[] = [];

    /** Current search query (filters tree by label) */
    @state() private searchQuery = '';

    /** Explicit show/hide override for the search box from tool config */
    private showSearchConfig: boolean | undefined;

    /** Leaf-count threshold above which the search box is shown when not explicitly configured */
    private searchThreshold = 8;

    private configHandler: ((e: Event) => void) | null = null;
    private addLayerFailedHandler: ((e: Event) => void) | null = null;
    private mapReadyHandler: ((e: Event) => void) | null = null;
    private adapter: IMap | null = null;
    private unsubscribeLayerAdd: (() => void) | null = null;
    private unsubscribeLayerRemove: (() => void) | null = null;
    private readonly nodeByKey = new Map<string, LayerNode>();
    private readonly supportStatusByLayerId = new Map<string, LayerSupportStatus>();
    @state() private readonly capsCache = new Map<string, CapsStatus>();
    private readonly pendingSupportChecks = new Set<string>();
    private readonly supportQueue: string[] = [];
    private supportChecksInFlight = 0;
    private readonly maxConcurrentSupportChecks = 3;
    private didQueueRootSupportChecks = false;

    static styles = css`
        :host {
            display: block;
            height: auto; /* let parent control available height */
            overflow: visible; /* do not create a nested scroll container */
            padding: 0.25rem;
            box-sizing: border-box;
            background: var(--webmapx-layer-tree-bg, var(--color-surface, #fff));
            border-left: 1px solid var(--color-border-light, #e2e7ec);
            width: 100%; /* inherit panel width; avoid forcing overflow */
            margin: 0;
            font-size: var(--webmapx-layer-tree-font-size, 0.8rem);
            --sl-font-size-medium: var(--webmapx-layer-tree-font-size, 0.8rem);
            --sl-font-size-small: var(--webmapx-layer-tree-font-size, 0.8rem);
            --sl-tree-item-label-font-size: var(--webmapx-layer-tree-font-size, 0.8rem);
        }
        sl-tree {
            display: block;
            height: auto;
            overflow: visible;
            box-sizing: border-box;
        }
        sl-tree-item::part(item) {
            padding-top: 0;
            padding-bottom: 0;
            min-height: 1.25rem;
        }
        sl-tree-item::part(label) {
            font-size: var(--webmapx-layer-tree-font-size, 0.8rem);
            line-height: 1.2;
        }
        sl-tree-item::part(expand-button) {
            padding: 0;
        }
        sl-checkbox {
            --sl-input-height-medium: 1rem;
        }
        sl-checkbox::part(control) {
            width: 0.75rem;
            height: 0.75rem;
        }
        sl-checkbox::part(label) {
            font-size: var(--webmapx-layer-tree-font-size, 0.8rem);
            line-height: 1.2;
            padding-left: 0.3rem;
        }
        /* A layer row reads as a map thing, not a filename: a derived colour
           swatch, the human name, and the technical qualifier demoted to a
           muted second line. */
        .layer-row {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            min-width: 0;
        }
        /* The derived colour arrives as --swatch-bg rather than an inline
           background shorthand, because the shorthand would reset the
           background-image that the raster/unknown kinds layer on top. */
        .layer-swatch {
            flex: none;
            width: 1.125rem;
            height: 1.125rem;
            border-radius: var(--webmapx-radius-xs, 3px);
            background: var(--swatch-bg, var(--color-background-tertiary, #e9edf1));
            /* The hairline is the swatch's own edge; a layer that states an
               outline colour (boundaries: transparent fill, coloured line)
               replaces it with a thicker ring in that colour, so the row shows
               both what the layer fills and what it draws around it. */
            box-shadow: inset 0 0 0 var(--swatch-border-width, 1px)
                var(--swatch-border, rgba(16, 24, 40, 0.16));
        }
        .layer-swatch[data-kind='line'] {
            height: 0.3125rem;
            border-radius: 999px;
        }
        .layer-swatch[data-kind='circle'] {
            border-radius: 50%;
            width: 0.875rem;
            height: 0.875rem;
        }
        /* A real tile (or a style's paper colour) stood in for the hatch.
           Cover + centre so an 18px box shows the middle of the tile, which at
           this size reads as the layer's average colour. */
        .layer-swatch[data-kind='preview'] {
            background-size: cover;
            background-position: center;
            background-repeat: no-repeat;
        }
        /* Nothing derivable: a small hatch says "a layer" without pretending
           to know what colour it is. */
        .layer-swatch[data-kind='raster'],
        .layer-swatch[data-kind='unknown'] {
            background-image: repeating-linear-gradient(45deg,
                rgba(16, 24, 40, 0.16) 0 2px, transparent 2px 5px);
        }
        .layer-text {
            display: flex;
            flex-direction: column;
            min-width: 0;
            line-height: 1.2;
        }
        .layer-name,
        .layer-qualifier {
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }
        .layer-qualifier {
            font-size: 0.9em;
            color: var(--color-text-muted, #6b7681);
        }

        .tree-separator {
            display: flex;
            align-items: center;
            gap: 0.4em;
            width: 100%;
            font-weight: 600;
            color: var(--color-text-muted, #6b7681);
            padding: 0.25rem 0 0.1rem;
            pointer-events: none;
            user-select: none;
        }
        .tree-separator::before {
            content: '';
            width: 12px;
            flex: 0 0 12px;
            height: 1px;
            background: currentColor;
            opacity: 0.35;
        }
        .tree-separator::after {
            content: '';
            flex: 1;
            min-width: 8px;
            height: 1px;
            background: currentColor;
            opacity: 0.35;
        }
        sl-tree-item.separator-item::part(item) {
            cursor: default;
        }
        sl-tree-item.separator-item::part(expand-button) {
            display: none;
        }
        sl-tree-item.separator-item::part(label) {
            flex: 1;
            min-width: 0;
        }
        .layer-radio {
            display: inline-flex;
            align-items: center;
            gap: 0.375rem;
            font: inherit;
            color: inherit;
            cursor: pointer;
        }
        .search {
            position: relative;
            margin-bottom: 0.25rem;
        }
        .search input {
            width: 100%;
            box-sizing: border-box;
            font: inherit;
            padding: 0.25rem 1.5rem 0.25rem 0.375rem;
            border: 1px solid var(--color-border, #d5dce3);
            border-radius: var(--sl-border-radius-medium);
        }
        .search-clear {
            position: absolute;
            right: 0.25rem;
            top: 50%;
            transform: translateY(-50%);
            border: none;
            background: none;
            cursor: pointer;
            line-height: 1;
            font-size: 1rem;
            color: var(--color-text-muted, #6b7681);
            padding: 0;
        }
        .layer-radio input[type='radio'] {
            width: 0.75rem;
            height: 0.75rem;
            margin: 0;
        }
    `;

    connectedCallback(): void {
        super.connectedCallback();
        this.subscribeToConfig();
        this.subscribeToAddLayerFailed();
        this.bindToMapEvents();
    }

    disconnectedCallback(): void {
        this.unsubscribeFromConfig();
        this.unsubscribeFromAddLayerFailed();
        this.unsubscribeFromMapEvents();
        super.disconnectedCallback();
    }

    /** Returns the parent webmapx-map element */
    private get mapHost(): WebmapxMapElement | null {
        return this.closest('webmapx-map') as WebmapxMapElement | null;
    }

    /** Subscribe to config-ready events from parent map */
    private subscribeToConfig(): void {
        this.unsubscribeFromConfig();

        // Check if config is already available
        const existingTree = this.getTreeFromMapConfig(this.mapHost?.config as Record<string, unknown> | null ?? null);
        if (existingTree.length > 0) {
            this.configTree = existingTree;
            this.readSearchConfig(this.mapHost?.config as Record<string, unknown> | null ?? null);
            this.didQueueRootSupportChecks = false;
            this.queueRootLazySupportChecks();
        }

        // Listen for future config changes
        this.configHandler = (e: Event) => {
            const detail = (e as CustomEvent).detail;
            const tree = this.getTreeFromMapConfig(detail.config ?? null);
            if (tree.length > 0) {
                this.configTree = tree;
                this.readSearchConfig(detail.config ?? null);
                this.didQueueRootSupportChecks = false;
                if (this.adapter) {
                    this.syncCheckedLayersFromStore();
                }
                this.queueRootLazySupportChecks();
            }
        };

        this.mapHost?.addEventListener('webmapx-config-ready', this.configHandler);
    }

    private async bindToMapEvents(): Promise<void> {
        this.unsubscribeFromMapEvents();

        const mapHost = this.mapHost;
        if (!mapHost) return;

        const adapter = await mapHost.getAdapterAsync?.();
        if (!adapter) {
            this.subscribeToMapReady();
            return;
        }

        this.adapter = adapter;
        this.unsubscribeLayerAdd = adapter.events.on('layer-add', (e: LayerAddEvent) => {
            this.setLayerCheckedState(e.layerId, true);
        });
        this.unsubscribeLayerRemove = adapter.events.on('layer-remove', (e: LayerRemoveEvent) => {
            this.setLayerCheckedState(e.layerId, false);
        });

        this.syncCheckedLayersFromStore();
        this.queueRootLazySupportChecks();
    }

    private getSupportStatus(layerId: string | undefined): LayerSupportStatus {
        if (!layerId) return 'unknown';
        return this.supportStatusByLayerId.get(layerId) ?? 'unknown';
    }

    private setSupportStatus(layerId: string, status: LayerSupportStatus): void {
        const current = this.supportStatusByLayerId.get(layerId);
        if (current === status) {
            return;
        }
        this.supportStatusByLayerId.set(layerId, status);
        this.requestUpdate();
    }

    private collectLayerIdsForSupport(node: LayerNode): string[] {
        if (node.layerId) {
            return [node.layerId];
        }

        const children = Array.isArray(node.children) ? node.children : [];
        const layerIds: string[] = [];
        for (const child of children) {
            if (!child.layerId && child.expanded !== true) {
                continue;
            }
            layerIds.push(...this.collectLayerIdsForSupport(child));
        }
        return layerIds;
    }

    private queueSupportCheck(layerId: string): void {
        const status = this.getSupportStatus(layerId);
        if (status === 'supported' || status === 'unsupported' || status === 'checking') {
            return;
        }
        if (this.pendingSupportChecks.has(layerId)) {
            return;
        }

        this.pendingSupportChecks.add(layerId);
        this.supportQueue.push(layerId);
        this.pumpSupportQueue();
    }

    private pumpSupportQueue(): void {
        while (this.supportChecksInFlight < this.maxConcurrentSupportChecks && this.supportQueue.length > 0) {
            const layerId = this.supportQueue.shift();
            if (!layerId) {
                continue;
            }
            void this.runSupportCheck(layerId);
        }
    }

    private async runSupportCheck(layerId: string): Promise<void> {
        if (!this.pendingSupportChecks.has(layerId)) {
            return;
        }

        const mapHost = this.mapHost;
        if (!mapHost) {
            this.pendingSupportChecks.delete(layerId);
            return;
        }

        this.pendingSupportChecks.delete(layerId);
        this.supportChecksInFlight += 1;
        this.setSupportStatus(layerId, 'checking');

        try {
            const supported = await mapHost.isCatalogLayerSupported(layerId);
            this.setSupportStatus(layerId, supported ? 'supported' : 'unsupported');

            if (!supported) {
                this.setLayerCheckedState(layerId, false);
            }
        } catch {
            this.setSupportStatus(layerId, 'unknown');
        } finally {
            this.supportChecksInFlight = Math.max(0, this.supportChecksInFlight - 1);
            this.pumpSupportQueue();
        }
    }

    private queueRootLazySupportChecks(): void {
        if (!this.adapter) {
            return;
        }

        if (this.didQueueRootSupportChecks) {
            return;
        }

        const rootNodes = this.effectiveTree;
        if (!Array.isArray(rootNodes) || rootNodes.length === 0) {
            return;
        }

        for (const node of rootNodes) {
            if (node.layerId) {
                this.queueSupportCheck(node.layerId);
                continue;
            }

            if (node.expanded === true && Array.isArray(node.children)) {
                for (const layerId of this.collectLayerIdsForSupport(node)) {
                    this.queueSupportCheck(layerId);
                }
            }
        }

        this.didQueueRootSupportChecks = true;
    }

    private handleTreeExpand(e: Event): void {
        const target = e.target as HTMLElement | null;
        const nodeKey = target?.getAttribute?.('data-node-key');
        if (!nodeKey) {
            return;
        }

        const node = this.nodeByKey.get(nodeKey);
        if (!node) {
            return;
        }

        for (const layerId of this.collectLayerIdsForSupport(node)) {
            this.queueSupportCheck(layerId);
        }
    }

    private subscribeToMapReady(): void {
        if (this.mapReadyHandler) return;
        const mapHost = this.mapHost;
        if (!mapHost) return;

        this.mapReadyHandler = () => {
            this.unsubscribeFromMapReady();
            void this.bindToMapEvents();
        };

        mapHost.addEventListener('webmapx-map-ready', this.mapReadyHandler);
    }

    private unsubscribeFromMapReady(): void {
        if (!this.mapReadyHandler) return;
        this.mapHost?.removeEventListener('webmapx-map-ready', this.mapReadyHandler);
        this.mapReadyHandler = null;
    }

    private unsubscribeFromMapEvents(): void {
        this.unsubscribeFromMapReady();
        this.unsubscribeLayerAdd?.();
        this.unsubscribeLayerRemove?.();
        this.unsubscribeLayerAdd = null;
        this.unsubscribeLayerRemove = null;
        this.adapter = null;
    }

    /** Subscribe to add-layer failure events */
    private subscribeToAddLayerFailed(): void {
        this.unsubscribeFromAddLayerFailed();
        this.addLayerFailedHandler = (e: Event) => {
            const detail = (e as CustomEvent<{ layerId?: string }>).detail;
            const layerId = detail?.layerId;
            if (!layerId) return;
            this.uncheckLayerById(layerId);
        };
        this.mapHost?.addEventListener('webmapx-addlayer-failed', this.addLayerFailedHandler);
    }

    private unsubscribeFromAddLayerFailed(): void {
        if (this.addLayerFailedHandler) {
            this.mapHost?.removeEventListener('webmapx-addlayer-failed', this.addLayerFailedHandler);
            this.addLayerFailedHandler = null;
        }
    }

    /** Uncheck the UI and node state for a given layerId */
    private uncheckLayerById(layerId: string): void {
        this.setLayerCheckedState(layerId, false);
    }

    private mapTreeNodes(
        nodes: LayerNode[],
        mapper: (node: LayerNode) => LayerNode,
    ): LayerNode[] {
        let changed = false;

        const next = nodes.map((node) => {
            const mapped = mapper(node);
            if (mapped !== node) {
                changed = true;
            }
            return mapped;
        });

        return changed ? next : nodes;
    }

    private updateEffectiveTree(mapper: (node: LayerNode) => LayerNode): void {
        if (this.tree.length > 0) {
            const next = this.mapTreeNodes(this.tree, mapper);
            if (next !== this.tree) {
                this.tree = next;
            }
            return;
        }

        const source = this.configTree as LayerNode[];
        const next = this.mapTreeNodes(source, mapper);
        if (next !== source) {
            this.configTree = next as unknown as TreeNodeConfig[];
        }
    }

    private setLayerCheckedInNode(node: LayerNode, layerId: string, checked: boolean): LayerNode {
        let changed = false;
        let nextChildren = node.children;

        if (node.children?.length) {
            nextChildren = this.mapTreeNodes(node.children, (child) => this.setLayerCheckedInNode(child, layerId, checked));
            if (nextChildren !== node.children) {
                changed = true;
            }
        }

        if (node.layerId === layerId && node.checked !== checked) {
            changed = true;
            return { ...node, checked, ...(nextChildren ? { children: nextChildren } : {}) };
        }

        if (changed) {
            return { ...node, ...(nextChildren ? { children: nextChildren } : {}) };
        }

        return node;
    }

    private setLayerCheckedState(layerId: string, checked: boolean): void {
        this.updateEffectiveTree((node) => this.setLayerCheckedInNode(node, layerId, checked));
    }

    private syncCheckedLayersFromStore(): void {
        const activeLayerIds = Object.keys(this.adapter?.store.getState().mapLayers ?? {});
        const active = new Set(activeLayerIds);

        const syncNode = (node: LayerNode): LayerNode => {
            let changed = false;
            let nextChildren = node.children;

            if (node.children?.length) {
                nextChildren = this.mapTreeNodes(node.children, syncNode);
                if (nextChildren !== node.children) {
                    changed = true;
                }
            }

            if (node.layerId) {
                const nextChecked = active.has(node.layerId);
                if (node.checked !== nextChecked) {
                    changed = true;
                    return { ...node, checked: nextChecked, ...(nextChildren ? { children: nextChildren } : {}) };
                }
            }

            if (changed) {
                return { ...node, ...(nextChildren ? { children: nextChildren } : {}) };
            }

            return node;
        };

        this.updateEffectiveTree(syncNode);
    }

    /** Unsubscribe from config events */
    private unsubscribeFromConfig(): void {
        if (this.configHandler) {
            this.mapHost?.removeEventListener('webmapx-config-ready', this.configHandler);
            this.configHandler = null;
        }
    }

    /** Returns the effective tree data (property takes precedence over config) */
    private get effectiveTree(): LayerNode[] {
        if (this.tree.length > 0) {
            return this.tree;
        }
        // TreeNodeConfig is compatible with LayerNode
        return this.configTree as LayerNode[];
    }

    private getChildSelectionContext(node: LayerNode, parentContext?: SelectionContext, nodeKey?: string): SelectionContext {
        const selectionMode = node.selectionMode ?? parentContext?.selectionMode ?? 'multiple';
        const selectionGroup = node.selectionGroup ?? parentContext?.selectionGroup ?? null;

        let exclusiveGroupKey: string | null = null;
        if (selectionMode === 'single') {
            if (selectionGroup) {
                exclusiveGroupKey = selectionGroup;
            } else if (node.children?.length) {
                exclusiveGroupKey = `tree-group:${nodeKey ?? 'root'}`;
            } else {
                exclusiveGroupKey = parentContext?.exclusiveGroupKey
                    ?? (typeof node.layerId === 'string' ? `layer:${node.layerId}` : null);
            }
        }

        return {
            selectionMode,
            selectionGroup,
            exclusiveGroupKey,
            allowNone: node.allowNone ?? parentContext?.allowNone ?? false,
            stackOrder: node.stackOrder ?? parentContext?.stackOrder,
        };
    }

    private resolveNodeLabel(node: LayerNode): string {
        if (node.label) return node.label;
        if (node.layerId) {
            const info = this.getLayerInformationById(node.layerId);
            const title = (info?.layer as any)?.title;
            if (typeof title === 'string' && title) return title;
            return node.layerId;
        }
        return '';
    }

    /**
     * Renders a catalog row: derived swatch + human name + muted qualifier.
     *
     * The title is split BEFORE the "unsupported" note is appended, otherwise
     * that note would be read as the layer's technical qualifier.
     *
     * The swatch is aria-hidden so the accessible name stays the layer name
     * plus its qualifier, exactly as before this became two lines.
     */
    private renderLayerLabel(node: LayerNode, disabled: boolean): TemplateResult {
        const { name, qualifier } = splitLayerTitle(this.resolveNodeLabel(node));
        const layer = node.layerId ? this.getLayerInformationById(node.layerId)?.layer : null;
        const swatch = deriveLayerSwatch(layer ?? node.layerSpec ?? null);
        const note = disabled ? 'unsupported for current engine' : qualifier;

        return html`
            <span class="layer-row" title=${qualifier ? `${name} (${qualifier})` : name}>
                <span
                    class="layer-swatch"
                    data-kind=${swatch.kind}
                    style=${swatchStyle(swatch)}
                    aria-hidden="true"
                ></span>
                <span class="layer-text">
                    <span class="layer-name">${name}</span>
                    ${note ? html`<span class="layer-qualifier">${note}</span>` : ''}
                </span>
            </span>
        `;
    }

    private getLayerInformationById(layerId: string): { layer: unknown } | null {
        const layerData = this.mapHost?.layerDataConfig;
        if (!layerData) return null;

        const layer = layerData.layers?.find(l => l.id === layerId);
        if (!layer) return null;

        return { layer };
    }

    private getTreeFromMapConfig(config: Record<string, unknown> | null): TreeNodeConfig[] {
        if (!config || typeof config !== 'object') {
            return [];
        }

        const tools = (config as { tools?: unknown }).tools;
        const treeFromTools = this.findTreeInTools(tools);
        if (treeFromTools.length > 0) {
            return treeFromTools;
        }

        // Legacy fallback: catalog-owned tree
        const legacyTree = (config as { catalog?: { tree?: TreeNodeConfig[] } }).catalog?.tree;
        return Array.isArray(legacyTree) ? legacyTree : [];
    }

    private findTreeInTools(tools: unknown): TreeNodeConfig[] {
        return this.findLayerTreeToolItem(tools)?.tree as TreeNodeConfig[] | undefined ?? [];
    }

    /** Locates the layerTree tool config entry (either `tools.layerTree` or a `type: 'layerTree'` item) */
    private findLayerTreeToolItem(tools: unknown): Record<string, unknown> | null {
        if (!tools || typeof tools !== 'object') {
            return null;
        }

        const direct = (tools as { layerTree?: Record<string, unknown> }).layerTree;
        if (direct && Array.isArray(direct.tree)) {
            return direct;
        }

        const toolEntries = Object.values(tools as Record<string, unknown>)
            .filter((entry): entry is Record<string, unknown> => !!entry && typeof entry === 'object');

        for (const entry of toolEntries) {
            const items = Array.isArray(entry.items) ? entry.items : [];
            for (const item of items) {
                if (!item || typeof item !== 'object') {
                    continue;
                }

                const toolItem = item as Record<string, unknown>;
                if (toolItem.type !== 'layerTree') {
                    continue;
                }

                const itemId = typeof toolItem.id === 'string' ? toolItem.id : null;
                if (this.toolId && itemId && itemId !== this.toolId) {
                    continue;
                }

                if (Array.isArray(toolItem.tree)) {
                    return toolItem;
                }
            }
        }

        return null;
    }

    /** Reads `showSearch` / `searchThreshold` options from the layerTree tool config */
    private readSearchConfig(config: Record<string, unknown> | null): void {
        const toolItem = this.findLayerTreeToolItem((config as { tools?: unknown } | null)?.tools);
        if (!toolItem) {
            return;
        }

        if (typeof toolItem.showSearch === 'boolean') {
            this.showSearchConfig = toolItem.showSearch;
        }
        if (typeof toolItem.searchThreshold === 'number') {
            this.searchThreshold = toolItem.searchThreshold;
        }
    }

    /** Counts leaf (selectable) nodes in the tree */
    private countLeaves(nodes: LayerNode[]): number {
        let count = 0;
        for (const node of nodes) {
            if (node.separator) continue;
            if (node.children?.length) {
                count += this.countLeaves(node.children);
            } else if (node.layerId) {
                count += 1;
            }
        }
        return count;
    }

    /** Whether the search box should be shown */
    private get showSearch(): boolean {
        if (this.showSearchConfig !== undefined) {
            return this.showSearchConfig;
        }
        return this.countLeaves(this.effectiveTree) > this.searchThreshold;
    }

    /** Returns a copy of the tree containing only nodes whose label/metadata matches the query (or that have a matching descendant) */
    private filterTree(nodes: LayerNode[], query: string, path: string[] = []): LayerNode[] {
        const result: LayerNode[] = [];
        let pendingSeparator: LayerNode | null = null;

        for (const node of nodes) {
            if (node.separator) {
                pendingSeparator = node;
                continue;
            }

            if (node.children?.length) {
                const filteredChildren = this.filterTree(node.children, query, [...path, this.resolveNodeLabel(node)]);
                if (filteredChildren.length > 0) {
                    if (pendingSeparator) { result.push(pendingSeparator); pendingSeparator = null; }
                    result.push({ ...node, children: filteredChildren, expanded: true });
                }
                continue;
            }

            if (this.nodeMatchesQuery(node, query, path)) {
                if (pendingSeparator) { result.push(pendingSeparator); pendingSeparator = null; }
                result.push(node);
            }
        }

        return result;
    }

    /** Whether a leaf node matches the search query, checking label, ancestor path, abstract and attribution */
    private nodeMatchesQuery(node: LayerNode, query: string, path: string[]): boolean {
        if (this.resolveNodeLabel(node).toLowerCase().includes(query)) {
            return true;
        }

        if (path.join(' ').toLowerCase().includes(query)) {
            return true;
        }

        if (!node.layerId) {
            return false;
        }

        const layer = this.getLayerInformationById(node.layerId)?.layer as
            | {
                metadata?: {
                    abstract?: string;
                    attributes?: { translations?: { name?: string; translation?: string; valuemap?: { value?: unknown; label?: string }[] }[] };
                };
                attribution?: string;
                source?: string;
            }
            | undefined;
        if (!layer) {
            return false;
        }

        if (layer.metadata?.abstract?.toLowerCase().includes(query)) {
            return true;
        }

        if (layer.attribution?.toLowerCase().includes(query)) {
            return true;
        }

        for (const translation of layer.metadata?.attributes?.translations ?? []) {
            if (translation.name?.toLowerCase().includes(query) || translation.translation?.toLowerCase().includes(query)) {
                return true;
            }
            for (const entry of translation.valuemap ?? []) {
                if (entry.label?.toLowerCase().includes(query) || String(entry.value ?? '').toLowerCase().includes(query)) {
                    return true;
                }
            }
        }

        if (typeof layer.source === 'string') {
            const sourceAttribution = this.mapHost?.layerDataConfig?.sources?.find((s) => s.id === layer.source)?.attribution;
            if (sourceAttribution?.toLowerCase().includes(query)) {
                return true;
            }
        }

        return false;
    }

    private handleSearchInput(e: Event): void {
        this.searchQuery = (e.target as HTMLInputElement).value;
    }

    private handleSearchClear(): void {
        this.searchQuery = '';
    }

    private dispatchLayerCheck(detail: LayerCheckDetail): void {
        this.dispatchEvent(new CustomEvent('add-layer', {
            detail,
            bubbles: true,
            composed: true
        }));
    }

    private getExclusiveGroupKey(node: LayerNode, context: SelectionContext): string | null {
        if (context.selectionMode !== 'single') {
            return null;
        }

        return context.exclusiveGroupKey ?? context.selectionGroup ?? (typeof node.layerId === 'string' ? `layer:${node.layerId}` : null);
    }

    private clearExclusiveSelection(
        nodes: LayerNode[],
        activeLayerId: string,
        groupKey: string,
    ): string[] {
        const removedLayerIds: string[] = [];

        const walk = (entries: LayerNode[], currentContext?: SelectionContext): void => {
            for (const entry of entries) {
                const nextContext = this.getChildSelectionContext(entry, currentContext);
                if (entry.children?.length) {
                    walk(entry.children, nextContext);
                    continue;
                }

                if (!entry.layerId || entry.layerId === activeLayerId) {
                    continue;
                }

                const entryGroupKey = this.getExclusiveGroupKey(entry, nextContext);
                if (entryGroupKey !== groupKey || entry.checked !== true) {
                    continue;
                }
                removedLayerIds.push(entry.layerId);
            }
        };

        walk(nodes, undefined);
        return removedLayerIds;
    }

    private capsKey(node: LayerNode): string {
        return `${node.url}||${JSON.stringify(node.allowedLayers ?? [])}||${JSON.stringify(node.deniedLayers ?? [])}`;
    }

    private normalizeLayerList(value: string | string[] | undefined): string[] {
        if (!value) return [];
        if (Array.isArray(value)) return value.map(s => s.trim()).filter(Boolean);
        return value.split(',').map(s => s.trim()).filter(Boolean);
    }

    private async fetchCapabilities(node: LayerNode): Promise<void> {
        const key = this.capsKey(node);
        if (this.capsCache.has(key)) return;
        this.capsCache.set(key, { status: 'loading' });
        this.requestUpdate();

        try {
            const { discoverWms } = await import('../utils/layer-discovery');
            const layers: DiscoveredLayer[] = await discoverWms(node.url!);

            const allowed = this.normalizeLayerList(node.allowedLayers);
            const denied = new Set(this.normalizeLayerList(node.deniedLayers));

            // Normalize tilecacheUrl to array (or undefined)
            const tilecacheUrls: string[] | undefined = node.tilecacheUrl
                ? (Array.isArray(node.tilecacheUrl) ? node.tilecacheUrl : [node.tilecacheUrl])
                : undefined;

            const children: LayerNode[] = layers
                .filter(l => {
                    const id = (l.layer as any).id as string;
                    if (denied.has(id)) return false;
                    if (allowed.length > 0 && !allowed.includes(id)) return false;
                    return true;
                })
                .map(l => {
                    const layer = l.layer as any;
                    const source = { ...(l.source as any) };
                    const layerId = layer.id as string;

                    // Apply tilecacheUrl: replace base URL, keep WMS query string
                    if (tilecacheUrls && source.url) {
                        const originalUrl = Array.isArray(source.url) ? source.url[0] : source.url;
                        const qIdx = (originalUrl as string).indexOf('?');
                        const search = qIdx >= 0 ? (originalUrl as string).slice(qIdx) : '';
                        const rewritten = tilecacheUrls.map((u: string) => u + search);
                        source.url = rewritten;
                        // rasterTilesSource() sets `tiles` to the SAME array as `url` (MapLibre's
                        // WMS branch reads `tiles`, other engines read `url`) — reassigning only
                        // `.url` above left `.tiles` pointing at the original, un-rewritten array,
                        // so MapLibre kept hitting the raw WMS endpoint while every other engine
                        // correctly used the tile cache.
                        if (source.tiles) source.tiles = rewritten;
                    }

                    return {
                        label: (layer.title ?? layerId) as string,
                        layerId,
                        layerSpec: { ...layer, sources: { [source.id]: source } } as Record<string, unknown>,
                    };
                });

            this.capsCache.set(key, { status: 'loaded', children });
        } catch (e) {
            this.capsCache.set(key, { status: 'error', error: e instanceof Error ? e.message : String(e) });
        }
        this.requestUpdate();
    }

    renderNode(node: LayerNode, context?: SelectionContext, nodeKey = '0'): TemplateResult {
        // Getcapabilities node: lazy-load WMS layers on first expand
        const isCaps = node.type === 'getcapabilities' || node.type === 'capabilities';
        if (isCaps && node.url) {
            const key = this.capsKey(node);
            const cacheEntry = this.capsCache.get(key);
            const nodeContext = this.getChildSelectionContext(node, context, nodeKey);

            let children: TemplateResult;
            if (!cacheEntry || cacheEntry.status === 'loading') {
                children = html`<sl-tree-item disabled><sl-spinner style="font-size:0.85rem"></sl-spinner> Loading…</sl-tree-item>`;
            } else if (cacheEntry.status === 'error') {
                children = html`<sl-tree-item disabled style="color:var(--sl-color-danger-600)">⚠ ${cacheEntry.error}</sl-tree-item>`;
            } else {
                children = html`${cacheEntry.children.map((child, i) => this.renderNode(child, nodeContext, `${nodeKey}.${i}`))}`;
            }

            return html`
                <sl-tree-item ?expanded=${node.expanded} data-node-key=${nodeKey}
                    @sl-expand=${() => { void this.fetchCapabilities(node); }}>
                    <span style="cursor:pointer">${node.label ?? node.url}</span>
                    ${children}
                </sl-tree-item>`;
        }

        if (node.separator) {
            return html`
                <sl-tree-item class="separator-item" data-node-key=${nodeKey} tabindex="-1" aria-hidden="true">
                    <span class="tree-separator">${this.resolveNodeLabel(node)}</span>
                </sl-tree-item>`;
        }

        const nodeContext = this.getChildSelectionContext(node, context, nodeKey);
        this.nodeByKey.set(nodeKey, node);

        if (node.children && node.children.length > 0) {
            return html`
                <sl-tree-item ?expanded=${node.expanded} data-node-key=${nodeKey}>
                    <span @click=${(e: Event) => {
                        const item = (e.currentTarget as HTMLElement).closest('sl-tree-item') as (HTMLElement & { expanded?: boolean }) | null;
                        if (item) { item.expanded = !item.expanded; }
                    }} style="cursor:pointer">${this.resolveNodeLabel(node)}</span>
                    ${node.children.map((child, index) => this.renderNode(child, nodeContext, `${nodeKey}.${index}`))}
                </sl-tree-item>
            `;
        } else {
            const isExclusive = nodeContext.selectionMode === 'single';
            const selectionGroup = this.getExclusiveGroupKey(node, nodeContext);
            const layerSupportStatus = this.getSupportStatus(node.layerId);
            const disabled = layerSupportStatus === 'unsupported';
            // The label (and the "unsupported" note) is composed by
            // renderLayerLabel, which also derives the swatch.

            const handleLeafKey = (e: KeyboardEvent) => {
                if (e.key === ' ' || e.key === 'Enter') {
                    e.preventDefault();
                    const inner = (e.currentTarget as HTMLElement).querySelector<HTMLElement>('sl-checkbox, input[type="radio"]');
                    inner?.click();
                }
                // Prevent browser native radio-group arrow-key cycling
                if ((e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'ArrowLeft' || e.key === 'ArrowRight') && isExclusive) {
                    e.preventDefault();
                }
            };

            return html`
                <sl-tree-item data-node-key=${nodeKey} @keydown=${handleLeafKey}>
                    ${isExclusive ? html`
                        <label class="layer-radio">
                            <input
                                type="radio"
                                ?checked=${node.checked}
                                ?disabled=${disabled}
                                name=${selectionGroup ?? nodeContext.exclusiveGroupKey ?? ''}
                                data-layer-id=${node.layerId ?? ''}
                                data-selection-group=${selectionGroup ?? ''}
                                @keydown=${(e: KeyboardEvent) => {
                                    if (e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
                                        e.preventDefault();
                                    }
                                }}
                                @change=${(e: Event) => this.handleCheck(e, node, nodeContext)}
                            />
                            ${this.renderLayerLabel(node, disabled)}
                        </label>
                    ` : html`
                        <sl-checkbox
                            ?checked=${node.checked}
                            ?disabled=${disabled}
                            data-layer-id=${node.layerId ?? ''}
                            @sl-change=${(e: Event) => this.handleCheck(e, node, nodeContext)}
                        >
                            ${this.renderLayerLabel(node, disabled)}
                        </sl-checkbox>
                    `}
                </sl-tree-item>
            `;
        }
    }

    handleCheck(e: Event, node: LayerNode, context: SelectionContext) {
        const target = e.target as EventTarget | null;
        const isChecked = target instanceof HTMLInputElement
            ? target.checked
            : (target as unknown as { checked?: boolean })?.checked === true;

        // Only handle leaf nodes with a layerId
        if (!node.layerId) return;

        this.setLayerCheckedState(node.layerId, isChecked);

        // Inline layer from capabilities: bypass catalog, dispatch directly
        if (node.layerSpec) {
            if (isChecked) {
                this.dispatchEvent(new CustomEvent('webmapx-add-layer', {
                    detail: node.layerSpec,
                    bubbles: true,
                    composed: true,
                }));
            } else {
                this.dispatchEvent(new CustomEvent('webmapx-remove-layer', {
                    detail: node.layerId,
                    bubbles: true,
                    composed: true,
                }));
            }
            return;
        }

        const layerInformation = this.getLayerInformationById(node.layerId);
        if (!layerInformation) return;

        const groupKey = this.getExclusiveGroupKey(node, context);
        if (isChecked && groupKey) {
            const removedLayerIds = this.clearExclusiveSelection(this.effectiveTree, node.layerId, groupKey);
            removedLayerIds.forEach((layerId) => {
                this.setLayerCheckedState(layerId, false);
                const removedLayerInfo = this.getLayerInformationById(layerId);
                if (!removedLayerInfo) {
                    return;
                }

                this.dispatchLayerCheck({
                    layerInformation: removedLayerInfo,
                    checked: false,
                    selectionGroup: groupKey,
                    selectionMode: 'single',
                    ...(context.stackOrder !== undefined ? { stackOrder: context.stackOrder } : {}),
                });
            });
        }

        if (!isChecked && groupKey && !context.allowNone) {
            this.setLayerCheckedState(node.layerId, true);
            return;
        }

        this.dispatchLayerCheck({
            layerInformation,
            checked: isChecked,
            ...(groupKey ? { selectionGroup: groupKey, selectionMode: 'single' as const } : {}),
            ...(context.stackOrder !== undefined ? { stackOrder: context.stackOrder } : {}),
        });
    }

    render() {
        this.nodeByKey.clear();

        const query = this.searchQuery.trim().toLowerCase();
        const nodes = query ? this.filterTree(this.effectiveTree, query) : this.effectiveTree;

        return html`
            ${this.showSearch ? html`
                <div class="search">
                    <input
                        type="text"
                        spellcheck="false"
                        autocomplete="off"
                        placeholder="Search layers..."
                        .value=${this.searchQuery}
                        @input=${this.handleSearchInput}
                    />
                    ${this.searchQuery ? html`<button class="search-clear" @click=${this.handleSearchClear} aria-label="Clear search">&times;</button>` : html``}
                </div>
            ` : html``}
            <sl-tree @sl-expand=${this.handleTreeExpand}>
                ${nodes.map((node, index) => this.renderNode(node, undefined, `${index}`))}
            </sl-tree>
        `;
    }
}
