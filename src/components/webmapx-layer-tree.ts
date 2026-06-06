import { LitElement, html, css } from 'lit';
import type { TemplateResult } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

import '@shoelace-style/shoelace/dist/components/tree/tree.js';
import '@shoelace-style/shoelace/dist/components/tree-item/tree-item.js';
import '@shoelace-style/shoelace/dist/components/checkbox/checkbox.js';

import type { TreeNodeConfig, TreeSelectionMode } from '../config/types';
import type { WebmapxMapElement } from './webmapx-map';
import type { IMap } from '../map/IMapInterfaces';
import type { LayerAddEvent, LayerRemoveEvent } from '../store/map-events';

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

    private configHandler: ((e: Event) => void) | null = null;
    private addLayerFailedHandler: ((e: Event) => void) | null = null;
    private mapReadyHandler: ((e: Event) => void) | null = null;
    private adapter: IMap | null = null;
    private unsubscribeLayerAdd: (() => void) | null = null;
    private unsubscribeLayerRemove: (() => void) | null = null;
    private readonly nodeByKey = new Map<string, LayerNode>();
    private readonly supportStatusByLayerId = new Map<string, LayerSupportStatus>();
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
            background: var(--webmapx-layer-tree-bg, var(--sl-color-neutral-0));
            border-left: 1px solid var(--sl-color-neutral-200);
            width: 100%; /* inherit panel width; avoid forcing overflow */
            margin: 0;
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
            min-height: 1.5rem;
        }
        sl-tree-item::part(label) {
            line-height: 1.2;
        }
        sl-tree-item::part(expand-button) {
            padding: 0;
        }
        sl-checkbox {
            --sl-input-height-medium: 1rem;
        }
        sl-checkbox::part(control) {
            width: 0.875rem;
            height: 0.875rem;
        }
        sl-checkbox::part(label) {
            line-height: 1.2;
            padding-left: 0.375rem;
        }
        .layer-radio {
            display: inline-flex;
            align-items: center;
            gap: 0.375rem;
            font: inherit;
            color: inherit;
            cursor: pointer;
        }
        .layer-radio input[type='radio'] {
            width: 0.875rem;
            height: 0.875rem;
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
            this.didQueueRootSupportChecks = false;
            this.queueRootLazySupportChecks();
        }

        // Listen for future config changes
        this.configHandler = (e: Event) => {
            const detail = (e as CustomEvent).detail;
            const tree = this.getTreeFromMapConfig(detail.config ?? null);
            if (tree.length > 0) {
                this.configTree = tree;
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
        if (!tools || typeof tools !== 'object') {
            return [];
        }

        const directTree = (tools as { layerTree?: { tree?: TreeNodeConfig[] } }).layerTree?.tree;
        if (Array.isArray(directTree)) {
            return directTree;
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
                    return toolItem.tree as TreeNodeConfig[];
                }
            }
        }

        return [];
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

    renderNode(node: LayerNode, context?: SelectionContext, nodeKey = '0'): TemplateResult {
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
            const resolvedLabel = this.resolveNodeLabel(node);
            const label = disabled ? `${resolvedLabel} (unsupported for current engine)` : resolvedLabel;

            return html`
                <sl-tree-item data-node-key=${nodeKey}>
                    ${isExclusive ? html`
                        <label class="layer-radio">
                            <input
                                type="radio"
                                ?checked=${node.checked}
                                ?disabled=${disabled}
                                name=${selectionGroup ?? nodeContext.exclusiveGroupKey ?? ''}
                                data-layer-id=${node.layerId ?? ''}
                                data-selection-group=${selectionGroup ?? ''}
                                @change=${(e: Event) => this.handleCheck(e, node, nodeContext)}
                            />
                            <span>${label}</span>
                        </label>
                    ` : html`
                        <sl-checkbox
                            ?checked=${node.checked}
                            ?disabled=${disabled}
                            data-layer-id=${node.layerId ?? ''}
                            @sl-change=${(e: Event) => this.handleCheck(e, node, nodeContext)}
                        >
                            ${label}
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

        return html`
            <sl-tree @sl-expand=${this.handleTreeExpand}>
                ${this.effectiveTree.map((node, index) => this.renderNode(node, undefined, `${index}`))}
            </sl-tree>
        `;
    }
}
