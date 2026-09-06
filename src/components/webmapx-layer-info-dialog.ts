import { LitElement, html, css } from 'lit';
import { customElement, state, query } from 'lit/decorators.js';
import { unsafeHTML } from 'lit-html/directives/unsafe-html.js';
import '@shoelace-style/shoelace/dist/components/dialog/dialog.js';
import '@shoelace-style/shoelace/dist/components/button/button.js';
import '@shoelace-style/shoelace/dist/components/spinner/spinner.js';
import type SlDialog from '@shoelace-style/shoelace/dist/components/dialog/dialog.js';
import { sanitizeAbstractHtml } from '../utils/sanitize-html';
import { renderAttributionText } from '../utils/attribution-format';
import { controlSurfaceStyles } from './internal/control-surface-styles';
import { raiseToTopLayer, topLayerDialog, topLayerDialogStyles } from './internal/top-layer-dialog';

const HTTPS_URL_ONLY = /^https:\/\/\S+$/i;

type ContentState =
  | { kind: 'none' }
  | { kind: 'html'; html: string }
  | { kind: 'loading' }
  | { kind: 'error'; message: string };

/**
 * Dialog showing layer information sourced from the layer config's
 * `metadata.abstract`. Bare https:// URLs are fetched and the fetched
 * body is treated as the abstract. All HTML is sanitized via DOMPurify
 * before rendering — scripts and event handlers are stripped.
 */
@customElement('webmapx-layer-info-dialog')
export class WebmapxLayerInfoDialog extends LitElement {

    @state() private dialogTitle = '';
    @state() private attribution = '';
    @state() private featureSummary = '';
    @state() private content: ContentState = { kind: 'none' };

    @query('sl-dialog') private dialog!: SlDialog;

    private fetchToken = 0;

    static styles = [controlSurfaceStyles, topLayerDialogStyles, css`
        :host { display: block; }

        sl-dialog::part(panel) {
            min-width: min(420px, 90vw);
            max-width: min(640px, 90vw);
        }

        .abstract {
            font-size: var(--webmapx-font-size-md, 0.9rem);
            line-height: 1.4;
            max-height: 60vh;
            overflow-y: auto;
        }

        .abstract img { max-width: 100%; }

        .placeholder {
            color: var(--color-text-muted, #6b7681);
            font-style: italic;
        }

        .layer-meta {
            margin-top: 0.75rem;
            padding-top: 0.5rem;
            border-top: 1px solid var(--color-border-light, #e2e7ec);
        }

        .feature-summary {
            font-size: var(--webmapx-font-size-md, 0.85rem);
            color: var(--color-text-secondary, #5a6773);
        }

        .feature-summary + .attribution {
            margin-top: 0.5rem;
        }

        .attribution {
            font-size: var(--webmapx-font-size-sm, 0.8rem);
            color: var(--color-text-muted, #6b7681);
        }

        .loading {
            display: flex;
            align-items: center;
            gap: var(--webmapx-space-sm, 0.5rem);
            color: var(--color-text-muted, #6b7681);
        }

        .footer {
            display: flex;
            justify-content: flex-end;
            margin-top: 1rem;
        }
    `];

    open(title: string, abstract: string | undefined, attribution?: string, featureSummary?: string): void {
        raiseToTopLayer(this);
        this.fetchToken += 1;
        this.dialogTitle = title;
        this.attribution = attribution?.trim() ?? '';
        this.featureSummary = featureSummary?.trim() ?? '';
        this.dialog?.show();

        const trimmed = abstract?.trim();
        if (!trimmed) {
            this.content = { kind: 'none' };
            return;
        }

        if (HTTPS_URL_ONLY.test(trimmed)) {
            this.loadFromUrl(trimmed);
            return;
        }

        this.content = { kind: 'html', html: sanitizeAbstractHtml(trimmed) };
    }

    close(): void {
        this.dialog?.hide();
    }

    private async loadFromUrl(url: string): Promise<void> {
        this.content = { kind: 'loading' };
        const token = ++this.fetchToken;
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const text = await response.text();
            if (token !== this.fetchToken) return;
            this.content = { kind: 'html', html: sanitizeAbstractHtml(text) };
        } catch {
            if (token !== this.fetchToken) return;
            this.content = { kind: 'error', message: 'Could not load layer information.' };
        }
    }

    private renderContent() {
        switch (this.content.kind) {
            case 'none':
                return this.featureSummary
                    ? null
                    : html`<p class="placeholder">No detailed layer information available.</p>`;
            case 'loading':
                return html`<div class="loading"><sl-spinner></sl-spinner> Loading layer information…</div>`;
            case 'error':
                return html`<p class="placeholder">${this.content.message}</p>`;
            case 'html':
                return html`<div class="abstract">${unsafeHTML(this.content.html)}</div>`;
        }
    }

    render() {
        return topLayerDialog(html`
                <sl-dialog label=${this.dialogTitle}
                           @sl-request-close=${(e: Event) => { if ((e as CustomEvent).detail?.source === 'overlay') this.close(); }}>
                    ${this.renderContent()}
                    ${this.featureSummary || this.attribution
                        ? html`<div class="layer-meta">
                            ${this.featureSummary
                                ? html`<div class="feature-summary">${this.featureSummary}</div>`
                                : null}
                            ${this.attribution
                                ? html`<div class="attribution"><strong>Attribution:</strong> ${renderAttributionText(this.attribution)}</div>`
                                : null}
                        </div>`
                        : null}
                    <div class="footer">
                        <sl-button autofocus @click=${this.close}>Close</sl-button>
                    </div>
                </sl-dialog>
        `);
    }
}

declare global {
    interface HTMLElementTagNameMap {
        'webmapx-layer-info-dialog': WebmapxLayerInfoDialog;
    }
}
