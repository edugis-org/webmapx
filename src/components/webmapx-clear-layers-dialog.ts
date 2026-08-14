import { LitElement, html, css } from 'lit';
import { customElement, query } from 'lit/decorators.js';
import '@shoelace-style/shoelace/dist/components/dialog/dialog.js';
import '@shoelace-style/shoelace/dist/components/button/button.js';
import type SlDialog from '@shoelace-style/shoelace/dist/components/dialog/dialog.js';

@customElement('webmapx-clear-layers-dialog')
export class WebmapxClearLayersDialog extends LitElement {
    @query('sl-dialog') private dialog!: SlDialog;

    static styles = css`
        :host { display: block; }
    `;

    open(): void {
        // Escape to document.body before showing — see webmapx-layer-info-dialog.ts's open()
        // for why: an ancestor's backdrop-filter (webmapx-tool-panel under the "atlas"/
        // "glossy" style) otherwise traps this position:fixed dialog inside the panel.
        if (this.parentNode !== document.body) {
            document.body.appendChild(this);
        }
        this.dialog.show();
    }

    hide(): void {
        this.dialog?.hide();
    }

    private handleConfirm(): void {
        this.dispatchEvent(new CustomEvent('webmapx-clear-layers-confirm', { bubbles: true, composed: true }));
    }

    render() {
        return html`
            <sl-dialog label="Alle kaartlagen wissen">
                <p>Dit wist alle kaartlagen uit 'actieve lagen'. Sla zelfgemaakte lagen eerst op. Je kunt bestaande lagen weer openen via de kaartlagen knop.</p>
                <sl-button slot="footer" variant="default" @click=${() => this.hide()}>Annuleren</sl-button>
                <sl-button slot="footer" variant="danger" @click=${() => this.handleConfirm()}>Wissen</sl-button>
            </sl-dialog>
        `;
    }
}
