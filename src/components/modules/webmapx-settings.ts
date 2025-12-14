import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';

import '@shoelace-style/shoelace/dist/components/switch/switch.js';
import '@shoelace-style/shoelace/dist/components/input/input.js';
import '@shoelace-style/shoelace/dist/components/divider/divider.js';
import '@shoelace-style/shoelace/dist/components/select/select.js';
import '@shoelace-style/shoelace/dist/components/option/option.js';

import { getRegisteredAdapters, DEFAULT_ADAPTER_NAME } from '../../map/adapter-registry';
import { WebmapxMapElement } from './webmapx-map';

@customElement('webmapx-settings')
export class WebmapxSettings extends LitElement {
    @state() private darkMode = false;
    @state() private apiKey = '';
    @state() private currentAdapter = DEFAULT_ADAPTER_NAME;
    @state() private availableAdapters: string[] = [];

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

        sl-select {
            margin-top: 0.5rem;
        }

        sl-select::part(combobox) {
            min-height: 2.5rem;
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

        // Load adapter settings
        this.availableAdapters = getRegisteredAdapters().filter(
            name => name !== 'ol' // Filter out alias
        );
        this.currentAdapter = this.detectCurrentAdapter();
    }

    private detectCurrentAdapter(): string {
        // Check localStorage first
        const saved = localStorage.getItem('webmapx-adapter');
        if (saved && this.availableAdapters.includes(saved)) {
            return saved;
        }

        // Fall back to what's in the DOM
        const mapElement = document.querySelector('webmapx-map') as WebmapxMapElement | null;
        if (mapElement) {
            const attr = mapElement.getAttribute('adapter');
            if (attr && this.availableAdapters.includes(attr.toLowerCase())) {
                return attr.toLowerCase();
            }
        }

        return DEFAULT_ADAPTER_NAME;
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

    private handleAdapterChange(e: Event) {
        const target = e.target as HTMLSelectElement;
        const newAdapter = target.value;

        if (newAdapter === this.currentAdapter) {
            return;
        }

        // Get current viewport state before switching
        const mapElement = document.querySelector('webmapx-map') as WebmapxMapElement | null;
        const adapter = mapElement?.adapter;

        if (adapter) {
            const viewportState = adapter.core.getViewportState();
            localStorage.setItem('webmapx-viewport', JSON.stringify(viewportState));
        }

        // Save new adapter preference
        localStorage.setItem('webmapx-adapter', newAdapter);

        // Reload the page to apply the new adapter
        window.location.reload();
    }

    private formatAdapterName(name: string): string {
        const names: Record<string, string> = {
            'maplibre': 'MapLibre GL',
            'openlayers': 'OpenLayers'
        };
        return names[name] || name;
    }

    render() {
        return html`
            <div class="setting-group">
                <h4>Map Engine</h4>
                <sl-select
                    label="Adapter"
                    value=${this.currentAdapter}
                    @sl-change=${this.handleAdapterChange}
                >
                    ${this.availableAdapters.map(adapter => html`
                        <sl-option value=${adapter}>
                            ${this.formatAdapterName(adapter)}
                        </sl-option>
                    `)}
                </sl-select>
            </div>

            <sl-divider></sl-divider>

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
