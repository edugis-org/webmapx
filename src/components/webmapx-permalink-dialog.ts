import { LitElement, html, css } from 'lit';
import { customElement, state, query } from 'lit/decorators.js';
import '@shoelace-style/shoelace/dist/components/dialog/dialog.js';
import '@shoelace-style/shoelace/dist/components/button/button.js';
import '@shoelace-style/shoelace/dist/components/icon/icon.js';
import type SlDialog from '@shoelace-style/shoelace/dist/components/dialog/dialog.js';
import { controlSurfaceStyles } from './internal/control-surface-styles';
import { raiseToTopLayer, topLayerDialog, topLayerDialogStyles } from './internal/top-layer-dialog';

@customElement('webmapx-permalink-dialog')
export class WebmapxPermalinkDialog extends LitElement {
    @state() private url = '';
    @state() private hasConfig = false;
    @state() private dynamicLayerIds: string[] = [];
    @state() private copied = false;

    @query('sl-dialog') private dialog!: SlDialog;

    static styles = [controlSurfaceStyles, topLayerDialogStyles, css`
        :host { display: block; }

        sl-dialog::part(panel) {
            min-width: min(480px, 90vw);
            max-width: min(620px, 90vw);
        }

        .url-box {
            font-family: var(--sl-font-mono);
            font-size: var(--webmapx-font-size-sm, 0.78rem);
            background: var(--color-background-secondary, #f4f6f8);
            border: 1px solid var(--color-border, #d5dce3);
            border-radius: var(--sl-border-radius-medium);
            padding: var(--webmapx-space-sm, 0.5rem) var(--webmapx-space-md, 0.75rem);
            word-break: break-all;
            margin-bottom: var(--webmapx-space-md, 0.75rem);
            user-select: all;
            line-height: 1.5;
        }

        .warning {
            display: flex;
            align-items: flex-start;
            gap: var(--webmapx-space-xs, 0.4rem);
            font-size: var(--webmapx-font-size-md, 0.85rem);
            color: var(--sl-color-warning-800);
            background: var(--sl-color-warning-50);
            border: 1px solid var(--sl-color-warning-200);
            border-radius: var(--sl-border-radius-medium);
            padding: var(--webmapx-space-sm, 0.5rem) var(--webmapx-space-sm, 0.65rem);
            margin-bottom: var(--webmapx-space-md, 0.75rem);
        }

        .warning sl-icon {
            flex-shrink: 0;
            margin-top: 0.1rem;
        }
    `];

    open(url: string, hasConfig: boolean, dynamicLayerIds: string[] = []): void {
        raiseToTopLayer(this);
        this.url = url;
        this.hasConfig = hasConfig;
        this.dynamicLayerIds = dynamicLayerIds;
        this.copied = false;
        this.dialog.show();
    }

    private async handleCopy(): Promise<void> {
        await navigator.clipboard.writeText(this.url);
        this.copied = true;
        setTimeout(() => { this.copied = false; }, 2000);
    }

    render() {
        return topLayerDialog(html`
                <sl-dialog label="Permalink">
                    ${this.dynamicLayerIds.length > 0 ? html`
                        <div class="warning">
                            <sl-icon name="exclamation-triangle"></sl-icon>
                            <span>
                                <strong>${this.dynamicLayerIds.length} imported layer${this.dynamicLayerIds.length > 1 ? 's' : ''} will not restore</strong>
                                — layers added from files (${this.dynamicLayerIds.join(', ')}) are not stored in the permalink.
                                Recipients will see those layers missing.
                            </span>
                        </div>
                    ` : null}
                    ${!this.hasConfig ? html`
                        <div class="warning">
                            <sl-icon name="exclamation-triangle"></sl-icon>
                            <span>Config was not loaded from a URL — layer state may not restore for recipients using a different config.</span>
                        </div>
                    ` : null}
                    <div class="url-box">${this.url}</div>
                    <div slot="footer" style="display:flex;gap:0.5rem;justify-content:flex-end">
                        <sl-button @click=${() => this.dialog.hide()}>Close</sl-button>
                        <sl-button variant="primary" @click=${this.handleCopy}>
                            <sl-icon slot="prefix" name=${this.copied ? 'check2' : 'clipboard'}></sl-icon>
                            ${this.copied ? 'Copied!' : 'Copy to clipboard'}
                        </sl-button>
                    </div>
                </sl-dialog>
        `);
    }
}

