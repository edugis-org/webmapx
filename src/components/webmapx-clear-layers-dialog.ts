import { LitElement, html, css } from 'lit';
import { customElement, query } from 'lit/decorators.js';
import '@shoelace-style/shoelace/dist/components/dialog/dialog.js';
import '@shoelace-style/shoelace/dist/components/button/button.js';
import type SlDialog from '@shoelace-style/shoelace/dist/components/dialog/dialog.js';
import { raiseToTopLayer, topLayerDialog, topLayerDialogStyles } from './internal/top-layer-dialog';

@customElement('webmapx-clear-layers-dialog')
export class WebmapxClearLayersDialog extends LitElement {
    @query('sl-dialog') private dialog!: SlDialog;

    static styles = [topLayerDialogStyles, css`
        :host { display: block; }
    `];

    open(): void {
        raiseToTopLayer(this);
        this.dialog.show();
    }

    hide(): void {
        this.dialog?.hide();
    }

    private handleConfirm(): void {
        this.dispatchEvent(new CustomEvent('webmapx-clear-layers-confirm', { bubbles: true, composed: true }));
    }

    render() {
        return topLayerDialog(html`
                <sl-dialog label="Alle kaartlagen wissen">
                    <p>Dit wist alle kaartlagen uit 'actieve lagen'. Sla zelfgemaakte lagen eerst op. Je kunt bestaande lagen weer openen via de kaartlagen knop.</p>
                    <sl-button slot="footer" variant="default" @click=${() => this.hide()}>Annuleren</sl-button>
                    <sl-button slot="footer" variant="danger" @click=${() => this.handleConfirm()}>Wissen</sl-button>
                </sl-dialog>
        `);
    }
}
