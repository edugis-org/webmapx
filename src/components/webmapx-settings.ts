import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';

import '@shoelace-style/shoelace/dist/components/input/input.js';
import '@shoelace-style/shoelace/dist/components/divider/divider.js';
import '@shoelace-style/shoelace/dist/components/select/select.js';
import '@shoelace-style/shoelace/dist/components/option/option.js';

import { getRegisteredAdapters, DEFAULT_ADAPTER_NAME } from '../map/adapter-registry';
import {
    getMapScopedStorageKey,
    normalizeAdapterName,
    resolveAdapterSelection
} from '../config/adapter-resolution';
import { resolveMapElement } from './internal/map-context';
import { controlSurfaceStyles } from './internal/control-surface-styles';

/**
 * Appearance is two independent choices, mirroring the token axes in
 * webmapx-style-core.css: `data-style` is form, `data-theme` is colour.
 *
 * They used to be one dropdown (Light/Dark/Compact/Glossy), which made
 * "dark" and "compact" mutually exclusive even though they describe
 * different things — there was no way to ask for a dense dark UI.
 */
export type WebmapxUiStyle = 'atlas' | 'folio' | 'console';
export type WebmapxUiTheme = 'auto' | 'light' | 'dark';

const UI_STYLES: { value: WebmapxUiStyle; label: string; hint: string }[] = [
    { value: 'atlas', label: 'Atlas', hint: 'Soft and roomy — public maps' },
    { value: 'folio', label: 'Folio', hint: 'Flat and precise — page embeds' },
    { value: 'console', label: 'Console', hint: 'Dense — daily operational use' }
];

const UI_THEMES: { value: WebmapxUiTheme; label: string }[] = [
    { value: 'auto', label: 'Match system' },
    { value: 'light', label: 'Light' },
    { value: 'dark', label: 'Dark' }
];

const STYLE_KEY = 'webmapx-style';
const THEME_KEY = 'webmapx-theme';

/**
 * Values written by the previous single-dropdown version, mapped onto the two
 * axes. Without this, someone who had picked "Compact" would silently land on
 * the default after upgrading.
 */
const LEGACY_STYLE_MIGRATION: Record<string, { style: WebmapxUiStyle; theme: WebmapxUiTheme }> = {
    light: { style: 'atlas', theme: 'light' },
    dark: { style: 'atlas', theme: 'dark' },
    compact: { style: 'console', theme: 'light' },
    glossy: { style: 'atlas', theme: 'light' }
};

@customElement('webmapx-settings')
export class WebmapxSettings extends LitElement {
    @state() private uiStyle: WebmapxUiStyle = 'atlas';
    @state() private uiTheme: WebmapxUiTheme = 'auto';
    @state() private apiKey = '';
    /** Live OS preference, watched so 'Match system' keeps following it. */
    private systemDark: MediaQueryList | null = null;
    private systemDarkHandler: (() => void) | null = null;
    @state() private currentAdapter = DEFAULT_ADAPTER_NAME;
    @state() private availableAdapters: string[] = [];

    static styles = [controlSurfaceStyles, css`
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
            color: var(--color-text-secondary, #5a6773);
            text-transform: uppercase;
            letter-spacing: 0.05em;
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
    `];

    connectedCallback() {
        super.connectedCallback();
        this.loadSettings();

        // 'Match system' has to keep matching, not just read the preference once.
        this.systemDark = window.matchMedia('(prefers-color-scheme: dark)');
        this.systemDarkHandler = () => {
            if (this.uiTheme === 'auto') this.applyAppearance();
        };
        this.systemDark.addEventListener('change', this.systemDarkHandler);
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        if (this.systemDark && this.systemDarkHandler) {
            this.systemDark.removeEventListener('change', this.systemDarkHandler);
        }
        this.systemDark = null;
        this.systemDarkHandler = null;
    }

    private loadSettings() {
        const savedStyle = localStorage.getItem(STYLE_KEY);
        const savedTheme = localStorage.getItem(THEME_KEY) as WebmapxUiTheme | null;

        const legacy = savedStyle ? LEGACY_STYLE_MIGRATION[savedStyle] : undefined;
        if (legacy) {
            // One-time upgrade from the old combined dropdown.
            this.uiStyle = legacy.style;
            this.uiTheme = savedTheme ?? legacy.theme;
        } else {
            this.uiStyle = UI_STYLES.some(s => s.value === savedStyle) ? savedStyle as WebmapxUiStyle : 'atlas';
            this.uiTheme = UI_THEMES.some(t => t.value === savedTheme) ? savedTheme! : 'auto';
        }
        this.applyAppearance();

        // Load API key
        this.apiKey = localStorage.getItem('webmapx-api-key') || '';

        // Load adapter settings
        this.availableAdapters = getRegisteredAdapters().filter(
            name => !['ol', 'l', 'c'].includes(name) // Filter out aliases
        );
        this.currentAdapter = this.detectCurrentAdapter();
    }

    private getMapStorageKey(mapElement: HTMLElement, kind: 'adapter' | 'viewport'): string | null {
        return getMapScopedStorageKey(mapElement.id, kind, `${location.pathname}${location.search}`);
    }

    private detectCurrentAdapter(): string {
        const mapElement = resolveMapElement(this);
        if (!mapElement) {
            return DEFAULT_ADAPTER_NAME;
        }

        const storedKey = this.getMapStorageKey(mapElement, 'adapter');
        const resolved = resolveAdapterSelection({
            explicitAdapter: mapElement.getAttribute('adapter') ?? mapElement.getAttribute('type'),
            savedAdapter: storedKey ? localStorage.getItem(storedKey) : null,
            configuredAdapter: mapElement.mapConfig?.type ?? null,
            defaultAdapter: DEFAULT_ADAPTER_NAME
        });
        return this.availableAdapters.includes(resolved) ? resolved : DEFAULT_ADAPTER_NAME;
    }

    /** Resolves 'auto' against the OS; light/dark are taken at face value. */
    private resolvedTheme(): 'light' | 'dark' {
        if (this.uiTheme === 'auto') {
            return this.systemDark?.matches ?? window.matchMedia('(prefers-color-scheme: dark)').matches
                ? 'dark'
                : 'light';
        }
        return this.uiTheme;
    }

    private applyAppearance() {
        const style = UI_STYLES.find(s => s.value === this.uiStyle) ?? UI_STYLES[0];
        const theme = this.resolvedTheme();
        const html = document.documentElement;

        // 'auto' is resolved here rather than left to a CSS media query, so the
        // attribute always states the theme actually in force — the artifact of
        // truth other components and host pages read.
        html.setAttribute('data-theme', theme);
        html.classList.toggle('sl-theme-dark', theme === 'dark');

        html.setAttribute('data-style', style.value);

        localStorage.setItem(STYLE_KEY, style.value);
        localStorage.setItem(THEME_KEY, this.uiTheme);
    }

    private emitAppearanceChange() {
        this.dispatchEvent(new CustomEvent('theme-change', {
            // `style` is kept for backwards compatibility with listeners written
            // against the old single-axis dropdown.
            detail: { style: this.uiStyle, theme: this.uiTheme, resolvedTheme: this.resolvedTheme() },
            bubbles: true,
            composed: true
        }));
    }

    private handleStyleChange(e: Event) {
        const target = e.target as HTMLSelectElement;
        this.uiStyle = target.value as WebmapxUiStyle;
        this.applyAppearance();
        this.emitAppearanceChange();
    }

    private handleThemeChange(e: Event) {
        const target = e.target as HTMLSelectElement;
        this.uiTheme = target.value as WebmapxUiTheme;
        this.applyAppearance();
        this.emitAppearanceChange();
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
        const newAdapter = normalizeAdapterName(target.value);

        if (!newAdapter) {
            return;
        }

        if (newAdapter === this.currentAdapter) {
            return;
        }

        const mapElement = resolveMapElement(this);
        if (!mapElement) {
            console.error('[webmapx-settings] No <webmapx-map> found for adapter switching.');
            return;
        }

        const adapterKey = this.getMapStorageKey(mapElement, 'adapter');

        // Save full map state (viewport + dynamic layers) so it survives the reload
        (mapElement as any).saveState?.();

        // Save new adapter preference
        if (adapterKey) {
            localStorage.setItem(adapterKey, newAdapter);
        }

        // Reload the page to apply the new adapter
        window.location.reload();
    }

    private formatAdapterName(name: string): string {
        const names: Record<string, string> = {
            'maplibre': 'MapLibre GL',
            'openlayers': 'OpenLayers',
            'leaflet': 'Leaflet',
            'cesium': 'Cesium'
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
                <sl-select
                    label="Style"
                    help-text=${UI_STYLES.find(s => s.value === this.uiStyle)?.hint ?? ''}
                    value=${this.uiStyle}
                    @sl-change=${this.handleStyleChange}
                >
                    ${UI_STYLES.map(s => html`
                        <sl-option value=${s.value}>${s.label}</sl-option>
                    `)}
                </sl-select>
                <sl-select
                    label="Theme"
                    value=${this.uiTheme}
                    @sl-change=${this.handleThemeChange}
                >
                    ${UI_THEMES.map(t => html`
                        <sl-option value=${t.value}>${t.label}</sl-option>
                    `)}
                </sl-select>
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
