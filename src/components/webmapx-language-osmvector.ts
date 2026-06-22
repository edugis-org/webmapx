// src/components/webmapx-language-osmvector.ts
//
// Passive tool that sets the label language for OpenStreetMap/openmaptiles-schema
// vector layers. Hooks `adapter.addLayer` to rewrite `text-field` expressions on
// resolved `type: 'style'` composite layers (symbol sub-layers whose text-field
// references OSM `name`/`name:<lang>` fields) before the layer reaches any engine.
// Already-added matching layers are updated live via `adapter.updateLayerStyle`.

import { html, css, TemplateResult } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { WebmapxModalTool } from './webmapx-modal-tool';
import type { IMap } from '../map/IMapInterfaces';
import type { SubLayerSpec } from '../config/types';

import '@shoelace-style/shoelace/dist/components/select/select.js';
import '@shoelace-style/shoelace/dist/components/option/option.js';

const STORAGE_KEY = 'webmapx-language-osmvector';

/** Broadcast on `window` when any instance changes the language, so sibling instances stay in sync. */
const LANGUAGE_CHANGE_EVENT = 'webmapx-language-osmvector-change';

/** Per-adapter state shared by all tool instances attached to the same map (avoids double-hooking addLayer). */
const adapterState = new WeakMap<IMap, { tracked: TrackedSubLayer[]; originalAddLayer: IMap['addLayer'] }>();

/** Languages offered in the dropdown. 'local' restores the style's original labels. */
const LANGUAGES: Array<{ code: string; label: string; en: string }> = [
    { code: 'local', label: 'Local name', en: 'Local name' },
    { code: 'browser', label: 'Browser language', en: 'Browser language' },
    { code: 'en', label: 'English', en: 'English' },
    { code: 'nl', label: 'Nederlands', en: 'Dutch' },
    { code: 'de', label: 'Deutsch', en: 'German' },
    { code: 'fr', label: 'Français', en: 'French' },
    { code: 'es', label: 'Español', en: 'Spanish' },
    { code: 'it', label: 'Italiano', en: 'Italian' },
    { code: 'pt', label: 'Português', en: 'Portuguese' },
    { code: 'ca', label: 'Català', en: 'Catalan' },
    { code: 'eu', label: 'Euskara', en: 'Basque' },
    { code: 'la', label: 'Latina', en: 'Latin' },
    { code: 'latin', label: 'Latin script', en: 'Latin script' },
    { code: 'cy', label: 'Cymraeg', en: 'Welsh' },
    { code: 'ga', label: 'Gaeilge', en: 'Irish' },
    { code: 'gd', label: 'Gàidhlig', en: 'Scottish Gaelic' },
    { code: 'br', label: 'Brezhoneg', en: 'Breton' },
    { code: 'co', label: 'Corsu', en: 'Corsican' },
    { code: 'oc', label: 'Occitan', en: 'Occitan' },
    { code: 'rm', label: 'Rumantsch', en: 'Romansh' },
    { code: 'lb', label: 'Lëtzebuergesch', en: 'Luxembourgish' },
    { code: 'af', label: 'Afrikaans', en: 'Afrikaans' },
    { code: 'da', label: 'Dansk', en: 'Danish' },
    { code: 'no', label: 'Norsk', en: 'Norwegian' },
    { code: 'sv', label: 'Svenska', en: 'Swedish' },
    { code: 'is', label: 'Íslenska', en: 'Icelandic' },
    { code: 'fi', label: 'Suomi', en: 'Finnish' },
    { code: 'et', label: 'Eesti', en: 'Estonian' },
    { code: 'lv', label: 'Latviešu', en: 'Latvian' },
    { code: 'lt', label: 'Lietuvių', en: 'Lithuanian' },
    { code: 'pl', label: 'Polski', en: 'Polish' },
    { code: 'cs', label: 'Čeština', en: 'Czech' },
    { code: 'sk', label: 'Slovenčina', en: 'Slovak' },
    { code: 'hu', label: 'Magyar', en: 'Hungarian' },
    { code: 'sl', label: 'Slovenščina', en: 'Slovenian' },
    { code: 'hr', label: 'Hrvatski', en: 'Croatian' },
    { code: 'bs', label: 'Bosanski', en: 'Bosnian' },
    { code: 'sr', label: 'Српски', en: 'Serbian' },
    { code: 'mk', label: 'Македонски', en: 'Macedonian' },
    { code: 'sq', label: 'Shqip', en: 'Albanian' },
    { code: 'ro', label: 'Română', en: 'Romanian' },
    { code: 'bg', label: 'Български', en: 'Bulgarian' },
    { code: 'uk', label: 'Українська', en: 'Ukrainian' },
    { code: 'be', label: 'Беларуская', en: 'Belarusian' },
    { code: 'ru', label: 'Русский', en: 'Russian' },
    { code: 'el', label: 'Ελληνικά', en: 'Greek' },
    { code: 'tr', label: 'Türkçe', en: 'Turkish' },
    { code: 'az', label: 'Azərbaycan', en: 'Azerbaijani' },
    { code: 'ka', label: 'ქართული', en: 'Georgian' },
    { code: 'hy', label: 'Հայերեն', en: 'Armenian' },
    { code: 'kk', label: 'Қазақша', en: 'Kazakh' },
    { code: 'mt', label: 'Malti', en: 'Maltese' },
    { code: 'he', label: 'עברית', en: 'Hebrew' },
    { code: 'ar', label: 'العربية', en: 'Arabic' },
    { code: 'fa', label: 'فارسی', en: 'Persian' },
    { code: 'ur', label: 'اردو', en: 'Urdu' },
    { code: 'pnb', label: 'پنجابی', en: 'Western Punjabi' },
    { code: 'pa', label: 'ਪੰਜਾਬੀ', en: 'Punjabi' },
    { code: 'hi', label: 'हिन्दी', en: 'Hindi' },
    { code: 'bn', label: 'বাংলা', en: 'Bengali' },
    { code: 'ta', label: 'தமிழ்', en: 'Tamil' },
    { code: 'te', label: 'తెలుగు', en: 'Telugu' },
    { code: 'kn', label: 'ಕನ್ನಡ', en: 'Kannada' },
    { code: 'ml', label: 'മലയാളം', en: 'Malayalam' },
    { code: 'th', label: 'ภาษาไทย', en: 'Thai' },
    { code: 'vi', label: 'Tiếng Việt', en: 'Vietnamese' },
    { code: 'id', label: 'Bahasa Indonesia', en: 'Indonesian' },
    { code: 'ja', label: '日本語', en: 'Japanese' },
    { code: 'ko', label: '한국어', en: 'Korean' },
    { code: 'zh', label: '中文', en: 'Chinese' },
    { code: 'zh-Hans', label: '简体中文', en: 'Chinese (Simplified)' },
    { code: 'zh-Hant', label: '繁體中文', en: 'Chinese (Traditional)' },
    { code: 'am', label: 'አማርኛ', en: 'Amharic' },
    { code: 'eo', label: 'Esperanto', en: 'Esperanto' },
    { code: 'ku', label: 'Kurdî', en: 'Kurdish' },
    { code: 'tok', label: 'Toki Pona', en: 'Toki Pona' },
];

/** Matches expression-based OSM/openmaptiles label fields: "name", "name:en", "name_int", etc. */
const OSM_NAME_FIELD_RE = /"name(?:[:_][\w-]+)?"/;

/** Matches legacy template-string OSM label fields: {name:latin}, {name:nonlatin}, {name}, etc. */
const OSM_TEMPLATE_NAME_RE = /\{name(?:[:_][\w-]+)?\}/;

function isOsmNameField(textField: unknown): boolean {
    if (textField === undefined) return false;
    if (typeof textField === 'string') return OSM_TEMPLATE_NAME_RE.test(textField);
    return OSM_NAME_FIELD_RE.test(JSON.stringify(textField));
}

interface TrackedSubLayer {
    layerId: string;
    subLayerId: string;
    originalTextField: unknown;
}

@customElement('webmapx-language-osmvector')
export class WebmapxLanguageOsmVector extends WebmapxModalTool {

    readonly toolId = 'maplanguage';

    /** When true, render no UI — the tool still hooks addLayer and applies the language. */
    @property({ type: Boolean, attribute: 'hide-ui' }) hideUi = false;

    /** Initial language, e.g. from config. Overridden by a stored user choice, if any. */
    @property({ type: String }) language: string = localStorage.getItem(STORAGE_KEY) ?? 'browser';

    private boundLanguageChangeEvent = (e: Event) => {
        const lang = (e as CustomEvent<{ language: string }>).detail?.language;
        if (lang === undefined || lang === this.language) return;
        this.language = lang;
        this.applyLanguage();
    };

    static styles = css`
        :host {
            display: block;
        }
        .container {
            padding: 0.5rem 1rem;
            font-size: 0.875rem;
        }
        .current-en {
            color: var(--sl-color-neutral-500);
            margin-bottom: 0.25rem;
        }
        sl-select {
            width: 100%;
        }
    `;

    connectedCallback(): void {
        // External, invisible instances (config `visible:false` or standalone usage) don't need
        // exclusive toolbar/panel slots, and several invisible instances may share a toolId.
        if (this.hideUi) this.registerWithToolManager = false;
        if (!this.hasAttribute('role')) this.setAttribute('role', 'region');
        super.connectedCallback();
        window.addEventListener(LANGUAGE_CHANGE_EVENT, this.boundLanguageChangeEvent);
    }

    disconnectedCallback(): void {
        window.removeEventListener(LANGUAGE_CHANGE_EVENT, this.boundLanguageChangeEvent);
        super.disconnectedCallback();
    }

    protected onMapAttached(adapter: IMap): void {
        super.onMapAttached(adapter);
        this.hookAddLayer(adapter);
        // Apply language to any layers already tracked (scanned from existing layers above).
        if (this.language !== 'local') {
            this.applyLanguage();
        }
    }

    /** Wraps `adapter.addLayer` (once per adapter, shared across instances) to rewrite OSM label fields
     *  on resolved style layers before they're applied. */
    private hookAddLayer(adapter: IMap): void {
        const existing = adapterState.get(adapter);
        if (existing) return;

        const state: { tracked: TrackedSubLayer[]; originalAddLayer: IMap['addLayer'] } = {
            tracked: [],
            originalAddLayer: adapter.addLayer.bind(adapter),
        };
        adapterState.set(adapter, state);

        // Scan layers already on the map (tool may be created after layers were added).
        for (const [layerId, config] of adapter.getLayerConfigs()) {
            const c = config as any;
            if (c?.type !== 'style' || !Array.isArray(c?.layers)) continue;
            for (const subLayer of c.layers as SubLayerSpec[]) {
                if (subLayer.type !== 'symbol') continue;
                const textField = subLayer.layout?.['text-field'];
                if (!isOsmNameField(textField)) continue;
                const subLayerId = subLayer.id ?? `${subLayer.source}-${subLayer.type}`;
                if (!state.tracked.some(t => t.layerId === layerId && t.subLayerId === subLayerId)) {
                    state.tracked.push({ layerId, subLayerId, originalTextField: textField });
                }
            }
        }

        adapter.addLayer = async (layer: any, options?: any): Promise<boolean> => {
            const layerId: string | undefined = layer?.id;
            if (layer?.type === 'style' && Array.isArray(layer.layers) && typeof layerId === 'string') {
                for (const subLayer of layer.layers as SubLayerSpec[]) {
                    if (subLayer.type !== 'symbol') continue;
                    const textField = subLayer.layout?.['text-field'];
                    if (!isOsmNameField(textField)) continue;

                    const subLayerId = subLayer.id ?? `${subLayer.source}-${subLayer.type}`;
                    state.tracked.push({ layerId, subLayerId, originalTextField: textField });

                    if (this.language !== 'local') {
                        subLayer.layout = {
                            ...subLayer.layout,
                            'text-field': this.buildTextField(this.language, textField),
                        };
                    }
                }
            }
            return state.originalAddLayer(layer, options);
        };
    }

    /** Builds a `text-field` expression for `lang`, falling back to the original local name. */
    private buildTextField(lang: string, originalTextField: unknown): unknown {
        const resolved = lang === 'browser'
            ? (navigator.language ?? 'en').split('-')[0]
            : lang;
        // Legacy template strings (e.g. "{name:latin} {name:nonlatin}") cannot be
        // used inside a coalesce expression — convert entirely to an expression with
        // a latin-script fallback chain so the label is never blank.
        if (typeof originalTextField === 'string') {
            return ['coalesce', ['get', `name:${resolved}`], ['get', 'name:latin'], ['get', 'name']];
        }
        return ['coalesce', ['get', `name:${resolved}`], originalTextField];
    }

    /** Re-applies the current language to all previously tracked OSM label sub-layers. */
    private applyLanguage(): void {
        if (!this.adapter) return;
        const tracked = adapterState.get(this.adapter)?.tracked ?? [];
        for (const { layerId, subLayerId, originalTextField } of tracked) {
            const textField = this.language === 'local'
                ? originalTextField
                : this.buildTextField(this.language, originalTextField);
            this.adapter.updateLayerStyle(layerId, subLayerId, { 'text-field': textField });
        }
    }

    private handleLanguageChange(e: Event): void {
        const value = (e.target as HTMLSelectElement).value;
        this.language = value;
        localStorage.setItem(STORAGE_KEY, value);
        this.applyLanguage();
        window.dispatchEvent(new CustomEvent(LANGUAGE_CHANGE_EVENT, { detail: { language: value } }));
    }

    protected render(): TemplateResult {
        if (this.hideUi) return html``;

        const current = LANGUAGES.find((lang) => lang.code === this.language);

        return html`
            <div class="tool-content container">
                <div>Map label language</div>
                <div class="current-en">${current?.en ?? this.language}</div>
                <sl-select
                    value=${this.language}
                    hoist
                    @sl-change=${this.handleLanguageChange}
                >
                    ${LANGUAGES.map((lang) => html`
                        <sl-option value=${lang.code}>${lang.label}</sl-option>
                    `)}
                </sl-select>
            </div>
        `;
    }
}
