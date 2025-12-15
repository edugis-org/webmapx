import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

import '@shoelace-style/shoelace/dist/components/tree/tree.js';
import '@shoelace-style/shoelace/dist/components/tree-item/tree-item.js';
import '@shoelace-style/shoelace/dist/components/checkbox/checkbox.js';

import type { TreeNodeConfig } from '../../config/types';
import type { WebmapxMapElement } from './webmapx-map';

export interface LayerNode {
    label: string;
    children?: LayerNode[];
    layerId?: string;
    checked?: boolean;
    expanded?: boolean;
}

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

    /** Tree data loaded from config */
    @state() private configTree: TreeNodeConfig[] = [];

    private configHandler: ((e: Event) => void) | null = null;

    static styles = css`
        :host {
            display: block;
            height: auto; /* let parent control available height */
            overflow: visible; /* do not create a nested scroll container */
            padding: 0.5rem 0.5rem 0.5rem 0.5rem;
            box-sizing: border-box;
            background: var(--sl-color-neutral-0);
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
    `;

    connectedCallback(): void {
        super.connectedCallback();
        this.subscribeToConfig();
    }

    disconnectedCallback(): void {
        this.unsubscribeFromConfig();
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
        const existingConfig = this.mapHost?.catalogConfig;
        if (existingConfig?.tree) {
            this.configTree = existingConfig.tree;
        }

        // Listen for future config changes
        this.configHandler = (e: Event) => {
            const detail = (e as CustomEvent).detail;
            const tree = detail.config?.catalog?.tree;
            if (tree) {
                this.configTree = tree;
            }
        };

        this.mapHost?.addEventListener('webmapx-config-ready', this.configHandler);
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

    renderNode(node: LayerNode) {
        if (node.children && node.children.length > 0) {
            return html`
                <sl-tree-item ?expanded=${node.expanded}>
                    ${node.label}
                    ${node.children.map(child => this.renderNode(child))}
                </sl-tree-item>
            `;
        } else {
            // Leaf node with checkbox
            return html`
                <sl-tree-item>
                    <sl-checkbox 
                        ?checked=${node.checked}
                        @sl-change=${(e: Event) => this.handleCheck(e, node)}
                        style="--sl-input-height-medium: 1.2rem;"
                    >
                        ${node.label}
                    </sl-checkbox>
                </sl-tree-item>
            `;
        }
    }

    handleCheck(e: Event, node: LayerNode) {
        const checkbox = e.target as any;
        const isChecked = checkbox.checked;
        node.checked = isChecked;

        // Only handle leaf nodes with a layerId
        if (!node.layerId) return;

        // Look up catalog from parent map
        const mapHost = this.mapHost;
        const catalog = mapHost?.catalogConfig;
        if (!catalog) return;

        // Find the layer config
        const layer = catalog.layers.find(l => l.id === node.layerId);
        if (!layer) return;

        // Find all unique source IDs referenced by the layer's layerset
        const sourceIds = Array.from(new Set(layer.layerset.map(sl => sl.source)));
        const sources = catalog.sources.filter(s => sourceIds.includes(s.id));

        // Compose the layerInformation object
        const layerInformation = { layer, sources };

        // Dispatch a custom event for the map to handle
        this.dispatchEvent(new CustomEvent('add-layer', {
            detail: { layerInformation, checked: isChecked },
            bubbles: true,
            composed: true
        }));
    }

    render() {
        return html`
            <sl-tree>
                ${this.effectiveTree.map(node => this.renderNode(node))}
            </sl-tree>
        `;
    }
}
