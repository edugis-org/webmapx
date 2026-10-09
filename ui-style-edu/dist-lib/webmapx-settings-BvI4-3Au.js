import { h as e, i as t, o as n, p as r, s as i } from "./decorators-d8E4nZJy.js";
import { d as a, f as o, m as s, p as c, r as l, t as u, u as d } from "./decorate-D_Hbritd.js";
import { a as f, c as p, i as m, t as h } from "./appearance-DVUQGZTG.js";
import { t as g } from "./control-surface-styles-zbl1JfZH.js";
import "./input-eCCT7kEl.js";
import { t as _ } from "./form-label-styles-CiXgi-FX.js";
import "./option-C8qYanYH.js";
import { t as v } from "./section-heading-styles-DkCw_K2W.js";
//#region src/components/webmapx-settings.ts
var y = [
	{
		value: "atlas",
		label: "Atlas",
		hint: "Soft and roomy — public maps"
	},
	{
		value: "folio",
		label: "Folio",
		hint: "Flat and precise — page embeds"
	},
	{
		value: "console",
		label: "Console",
		hint: "Dense — daily operational use"
	},
	{
		value: "classroom",
		label: "Classroom",
		hint: "Coloured tool tiles — learners"
	}
], b = [
	{
		value: "auto",
		label: "Match system"
	},
	{
		value: "light",
		label: "Light"
	},
	{
		value: "dark",
		label: "Dark"
	}
], x = class extends i {
	constructor(...e) {
		super(...e), this.uiStyle = "atlas", this.uiTheme = "auto", this.apiKey = "", this.appearanceListener = () => this.syncAppearance(), this.currentAdapter = c, this.availableAdapters = [];
	}
	static {
		this.styles = [
			_,
			g,
			v,
			e`
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

    `
		];
	}
	connectedCallback() {
		super.connectedCallback(), this.loadSettings(), document.addEventListener(h, this.appearanceListener);
	}
	disconnectedCallback() {
		super.disconnectedCallback(), document.removeEventListener(h, this.appearanceListener);
	}
	syncAppearance() {
		let { style: e, theme: t } = f();
		this.uiStyle = e, this.uiTheme = t;
	}
	loadSettings() {
		this.syncAppearance(), this.apiKey = localStorage.getItem("webmapx-api-key") || "", this.availableAdapters = s().filter((e) => ![
			"ol",
			"l",
			"c"
		].includes(e)), this.currentAdapter = this.detectCurrentAdapter();
	}
	getMapStorageKey(e, t) {
		return d(e.id, t, `${location.pathname}${location.search}`);
	}
	detectCurrentAdapter() {
		let e = l(this);
		if (!e) return c;
		let t = this.getMapStorageKey(e, "adapter"), n = o({
			explicitAdapter: e.getAttribute("adapter") ?? e.getAttribute("type"),
			savedAdapter: t ? localStorage.getItem(t) : null,
			configuredAdapter: e.mapConfig?.type ?? null,
			defaultAdapter: c
		});
		return this.availableAdapters.includes(n) ? n : c;
	}
	emitAppearanceChange() {
		this.dispatchEvent(new CustomEvent("theme-change", {
			detail: {
				style: this.uiStyle,
				theme: this.uiTheme,
				resolvedTheme: p(this.uiTheme)
			},
			bubbles: !0,
			composed: !0
		}));
	}
	handleStyleChange(e) {
		let t = e.target;
		this.uiStyle = t.value, m({ style: this.uiStyle }), this.emitAppearanceChange();
	}
	handleThemeChange(e) {
		let t = e.target;
		this.uiTheme = t.value, m({ theme: this.uiTheme }), this.emitAppearanceChange();
	}
	handleApiKeyChange(e) {
		let t = e.target;
		this.apiKey = t.value, localStorage.setItem("webmapx-api-key", this.apiKey), this.dispatchEvent(new CustomEvent("apikey-change", {
			detail: { apiKey: this.apiKey },
			bubbles: !0,
			composed: !0
		}));
	}
	handleAdapterChange(e) {
		let t = e.target, n = a(t.value);
		if (!n || n === this.currentAdapter) return;
		let r = l(this);
		if (!r) {
			console.error("[webmapx-settings] No <webmapx-map> found for adapter switching.");
			return;
		}
		let i = this.getMapStorageKey(r, "adapter");
		r.saveState?.(), i && localStorage.setItem(i, n), window.location.reload();
	}
	formatAdapterName(e) {
		return {
			maplibre: "MapLibre GL",
			openlayers: "OpenLayers",
			leaflet: "Leaflet",
			cesium: "Cesium"
		}[e] || e;
	}
	render() {
		return r`
            <section class="panel-section">
                <h3 class="section-heading">Map Engine</h3>
                <sl-select
                    size="small"
                    label="Adapter"
                    value=${this.currentAdapter}
                    @sl-change=${this.handleAdapterChange}
                >
                    ${this.availableAdapters.map((e) => r`
                        <sl-option value=${e}>
                            ${this.formatAdapterName(e)}
                        </sl-option>
                    `)}
                </sl-select>
            </section>

            <section class="panel-section">
                <h3 class="section-heading">Appearance</h3>
                <sl-select
                    size="small"
                    label="Style"
                    help-text=${y.find((e) => e.value === this.uiStyle)?.hint ?? ""}
                    value=${this.uiStyle}
                    @sl-change=${this.handleStyleChange}
                >
                    ${y.map((e) => r`
                        <sl-option value=${e.value}>${e.label}</sl-option>
                    `)}
                </sl-select>
                <sl-select
                    size="small"
                    label="Theme"
                    value=${this.uiTheme}
                    @sl-change=${this.handleThemeChange}
                >
                    ${b.map((e) => r`
                        <sl-option value=${e.value}>${e.label}</sl-option>
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
};
u([t()], x.prototype, "uiStyle", void 0), u([t()], x.prototype, "uiTheme", void 0), u([t()], x.prototype, "apiKey", void 0), u([t()], x.prototype, "currentAdapter", void 0), u([t()], x.prototype, "availableAdapters", void 0), x = u([n("webmapx-settings")], x);
//#endregion
export { x as WebmapxSettings };
