import { LitElement, html, css } from 'lit';
import { customElement, state, query } from 'lit/decorators.js';
import { unsafeHTML } from 'lit-html/directives/unsafe-html.js';
import '@shoelace-style/shoelace/dist/components/dialog/dialog.js';
import '@shoelace-style/shoelace/dist/components/button/button.js';
import '@shoelace-style/shoelace/dist/components/spinner/spinner.js';
import type SlDialog from '@shoelace-style/shoelace/dist/components/dialog/dialog.js';
import { sanitizeAbstractHtml } from '../utils/sanitize-html';
import { renderAttributionText } from '../utils/attribution-format';

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
    @state() private content: ContentState = { kind: 'none' };

    @query('sl-dialog') private dialog!: SlDialog;

    private fetchToken = 0;

    static styles = css`
        :host { display: block; }

        sl-dialog::part(panel) {
            min-width: min(420px, 90vw);
            max-width: min(640px, 90vw);
        }

        .abstract {
            font-size: 0.9rem;
            line-height: 1.4;
            max-height: 60vh;
            overflow-y: auto;
        }

        .abstract img { max-width: 100%; }

        .placeholder {
            color: var(--sl-color-neutral-500);
            font-style: italic;
        }

        .attribution {
            margin-top: 0.75rem;
            padding-top: 0.5rem;
            border-top: 1px solid var(--sl-color-neutral-200);
            font-size: 0.8rem;
            color: var(--sl-color-neutral-500);
        }

        .loading {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            color: var(--sl-color-neutral-500);
        }

        .footer {
            display: flex;
            justify-content: flex-end;
            margin-top: 1rem;
        }
    `;

    open(title: string, abstract: string | undefined, attribution?: string): void {
        this.fetchToken += 1;
        this.dialogTitle = title;
        this.attribution = attribution?.trim() ?? '';
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
                return html`<p class="placeholder">No detailed layer information available.</p>`;
            case 'loading':
                return html`<div class="loading"><sl-spinner></sl-spinner> Loading layer information…</div>`;
            case 'error':
                return html`<p class="placeholder">${this.content.message}</p>`;
            case 'html':
                return html`<div class="abstract">${unsafeHTML(this.content.html)}</div>`;
        }
    }

    render() {
        return html`
            <sl-dialog label=${this.dialogTitle}
                       @sl-request-close=${(e: Event) => { (e as CustomEvent).detail?.source === 'overlay' && this.close(); }}>
                ${this.renderContent()}
                ${this.attribution
                    ? html`<div class="attribution"><strong>Attribution:</strong> ${renderAttributionText(this.attribution)}</div>`
                    : null}
                <div class="footer">
                    <sl-button @click=${this.close}>Close</sl-button>
                </div>
            </sl-dialog>
        `;
    }
}

declare global {
    interface HTMLElementTagNameMap {
        'webmapx-layer-info-dialog': WebmapxLayerInfoDialog;
    }
}
