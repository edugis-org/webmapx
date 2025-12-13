import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';

import '@shoelace-style/shoelace/dist/components/switch/switch.js';
import '@shoelace-style/shoelace/dist/components/input/input.js';
import '@shoelace-style/shoelace/dist/components/divider/divider.js';

@customElement('webmapx-settings')
export class WebmapxSettings extends LitElement {
    @state() private darkMode = false;
    @state() private apiKey = '';

    static styles = css`
        :host {
            display: block;
            padding: 1rem;
            box-sizing: border-box;
        }

        .setting-group {
            margin-bottom: 1.5rem;
        }

        .setting-group:last-child {
            margin-bottom: 0;
        }

        h4 {
            margin: 0 0 0.75rem 0;
            font-size: 0.875rem;
            font-weight: 600;
            color: var(--color-text-secondary, #666);
            text-transform: uppercase;
            letter-spacing: 0.05em;
        }

        sl-switch {
            --sl-toggle-size-medium: 1.25rem;
        }

        sl-input {
            margin-top: 0.5rem;
        }
    `;

    connectedCallback() {
        super.connectedCallback();
        this.loadSettings();
    }

    private loadSettings() {
        // Load theme
        const savedTheme = localStorage.getItem('webmapx-theme');
        if (savedTheme) {
            this.darkMode = savedTheme === 'dark';
        } else {
            this.darkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
        }
        this.applyTheme();

        // Load API key
        this.apiKey = localStorage.getItem('webmapx-api-key') || '';
    }

    private applyTheme() {
        const html = document.documentElement;
        if (this.darkMode) {
            html.setAttribute('data-theme', 'dark');
            html.classList.add('sl-theme-dark');
        } else {
            html.removeAttribute('data-theme');
            html.classList.remove('sl-theme-dark');
        }
        localStorage.setItem('webmapx-theme', this.darkMode ? 'dark' : 'light');
    }

    private handleThemeChange(e: Event) {
        const target = e.target as HTMLInputElement;
        this.darkMode = target.checked;
        this.applyTheme();

        this.dispatchEvent(new CustomEvent('theme-change', {
            detail: { theme: this.darkMode ? 'dark' : 'light' },
            bubbles: true,
            composed: true
        }));
    }

    private handleApiKeyChange(e: Event) {
        const target = e.target as HTMLInputElement;
        this.apiKey = target.value;
        localStorage.setItem('webmapx-api-key', this.apiKey);

        this.dispatchEvent(new CustomEvent('apikey-change', {
            detail: { apiKey: this.apiKey },
            bubbles: true,
            composed: true
        }));
    }

    render() {
        return html`
            <div class="setting-group">
                <h4>Appearance</h4>
                <sl-switch
                    ?checked=${this.darkMode}
                    @sl-change=${this.handleThemeChange}
                >
                    Dark Mode
                </sl-switch>
            </div>

            <sl-divider></sl-divider>

            <div class="setting-group">
                <h4>API Configuration</h4>
                <sl-input
                    label="API Key"
                    type="password"
                    password-toggle
                    value=${this.apiKey}
                    @sl-input=${this.handleApiKeyChange}
                    placeholder="Enter your API key"
                ></sl-input>
            </div>
        `;
    }
}
