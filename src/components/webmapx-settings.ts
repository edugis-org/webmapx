import { LitElement, html, css } from 'lit';
import { formLabelStyles } from './internal/form-label-styles';
import { customElement, state } from 'lit/decorators.js';

import '@shoelace-style/shoelace/dist/components/input/input.js';
import '@shoelace-style/shoelace/dist/components/select/select.js';
import '@shoelace-style/shoelace/dist/components/option/option.js';

import { getRegisteredAdapters, DEFAULT_ADAPTER_NAME } from '../map/adapter-registry';
import {
    APPEARANCE_CHANGE_EVENT,
    chooseAppearance,
    effectiveAppearance,
    resolveTheme,
    type UiStyle,
    type UiTheme
} from '../utils/appearance';
import {
    getMapScopedStorageKey,
    normalizeAdapterName,
    resolveAdapterSelection
} from '../config/adapter-resolution';
import { resolveMapElement } from './internal/map-context';
import { controlSurfaceStyles } from './internal/control-surface-styles';
import { sectionHeadingStyles } from './internal/section-heading-styles';

/**
 * Appearance is two independent choices, mirroring the token axes in
 * webmapx-style-core.css: `data-style` is form, `data-theme` is colour.
 *
 * They used to be one dropdown (Light/Dark/Compact/Glossy), which made
 * "dark" and "compact" mutually exclusive even though they describe
 * different things — there was no way to ask for a dense dark UI.
 */
export type WebmapxUiStyle = UiStyle;
export type WebmapxUiTheme = UiTheme;

const UI_STYLES: { value: WebmapxUiStyle; label: string; hint: string }[] = [
    { value: 'atlas', label: 'Atlas', hint: 'Soft and roomy — public maps' },
    { value: 'folio', label: 'Folio', hint: 'Flat and precise — page embeds' },
    { value: 'console', label: 'Console', hint: 'Dense — daily operational use' },
    { value: 'classroom', label: 'Classroom', hint: 'Coloured tool tiles — learners' }
];

const UI_THEMES: { value: WebmapxUiTheme; label: string }[] = [
    { value: 'auto', label: 'Match system' },
    { value: 'light', label: 'Light' },
    { value: 'dark', label: 'Dark' }
];

@customElement('webmapx-settings')
export class WebmapxSettings extends LitElement {
    @state() private uiStyle: WebmapxUiStyle = 'atlas';
    @state() private uiTheme: WebmapxUiTheme = 'auto';
    @state() private apiKey = '';
    /** Keeps the dropdowns in step when a config (or another settings) changes the appearance. */
    private appearanceListener = () => this.syncAppearance();
    @state() private currentAdapter = DEFAULT_ADAPTER_NAME;
    @state() private availableAdapters: string[] = [];

    static styles = [formLabelStyles, controlSurfaceStyles, sectionHeadingStyles, css`
        :host {
            display: block;
            padding: 1rem;
            box-sizing: border-box;
        }

        h3 {
            margin: 0 0 0.75rem 0;
        }

        sl-input {
            margin-top: 0.5rem;
        }

        sl-select {
            margin-top: 0.5rem;
        }

    `];

    connectedCallback() {
        super.connectedCallback();
        this.loadSettings();
        document.addEventListener(APPEARANCE_CHANGE_EVENT, this.appearanceListener);
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        document.removeEventListener(APPEARANCE_CHANGE_EVENT, this.appearanceListener);
    }

    /** Shows the appearance in force: the viewer's own choice, else the config's. */
    private syncAppearance() {
        const { style, theme } = effectiveAppearance();
        this.uiStyle = style;
        this.uiTheme = theme;
    }

    private loadSettings() {
        // Reading only: applying (and remembering) happens when the viewer
        // changes something. Writing here made every visit look like a choice.
        this.syncAppearance();

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

    private emitAppearanceChange() {
        this.dispatchEvent(new CustomEvent('theme-change', {
            // `style` is kept for backwards compatibility with listeners written
            // against the old single-axis dropdown.
            detail: { style: this.uiStyle, theme: this.uiTheme, resolvedTheme: resolveTheme(this.uiTheme) },
            bubbles: true,
            composed: true
        }));
    }

    private handleStyleChange(e: Event) {
        const target = e.target as HTMLSelectElement;
        this.uiStyle = target.value as WebmapxUiStyle;
        chooseAppearance({ style: this.uiStyle });
        this.emitAppearanceChange();
    }

    private handleThemeChange(e: Event) {
        const target = e.target as HTMLSelectElement;
        this.uiTheme = target.value as WebmapxUiTheme;
        chooseAppearance({ theme: this.uiTheme });
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
            <section class="panel-section">
                <h3 class="section-heading">Map Engine</h3>
                <sl-select
                    size="small"
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
            </section>

            <section class="panel-section">
                <h3 class="section-heading">Appearance</h3>
                <sl-select
                    size="small"
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
                    size="small"
                    label="Theme"
                    value=${this.uiTheme}
                    @sl-change=${this.handleThemeChange}
                >
                    ${UI_THEMES.map(t => html`
                        <sl-option value=${t.value}>${t.label}</sl-option>
                    `)}
                </sl-select>
            </section>

            <section class="panel-section">
                <h3 class="section-heading">API Configuration</h3>
                <sl-input
                    size="small"
                    label="API Key"
                    type="password"
                    password-toggle
                    value=${this.apiKey}
                    @sl-input=${this.handleApiKeyChange}
                    placeholder="Enter your API key"
                ></sl-input>
            </section>
        `;
    }
}
