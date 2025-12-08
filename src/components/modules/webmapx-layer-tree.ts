import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import '@shoelace-style/shoelace/dist/components/tree/tree.js';
import '@shoelace-style/shoelace/dist/components/tree-item/tree-item.js';
import '@shoelace-style/shoelace/dist/components/checkbox/checkbox.js';

export interface LayerNode {
    label: string;
    children?: LayerNode[];
    layerId?: string;
    checked?: boolean;
    expanded?: boolean;
}

@customElement('webmapx-layer-tree')
export class WebmapxLayerTree extends LitElement {
    @property({ type: Array }) config: LayerNode[] = [];

    static styles = css`
        :host {
            display: block;
            height: 100%;
            overflow-y: auto;
            padding: 0.5rem;
            background: var(--sl-color-neutral-0);
            border-left: 1px solid var(--sl-color-neutral-200);
            width: 300px; /* Default width, can be overridden */
        }
    `;

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
        
        // Update local state (optional, depending on if we want to be controlled or uncontrolled)
        node.checked = isChecked;
        
        this.dispatchEvent(new CustomEvent('layer-toggle', {
            detail: { layerId: node.layerId, checked: isChecked },
            bubbles: true,
            composed: true
        }));
    }

    render() {
        return html`
            <sl-tree>
                ${this.config.map(node => this.renderNode(node))}
            </sl-tree>
        `;
    }
}
