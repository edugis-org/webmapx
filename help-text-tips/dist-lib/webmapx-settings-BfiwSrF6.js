import { h as e, i as t, o as n, p as r, s as i } from "./decorators-d8E4nZJy.js";
import { d as a, f as o, m as s, p as c, r as l, t as u, u as d } from "./decorate-Bl-DXcQA.js";
import { t as f } from "./control-surface-styles-zbl1JfZH.js";
import { n as p } from "./info-toggle-tL04Yu0p.js";
import "./input-eCCT7kEl.js";
import { t as m } from "./form-label-styles-CiXgi-FX.js";
import { t as h } from "./engine-labels-PQywGOyZ.js";
import { t as g } from "./help-text-styles-BFw9dhCq.js";
import "./option-REOFPMrE.js";
import { t as _ } from "./section-heading-styles-DkCw_K2W.js";
//#region src/components/webmapx-settings.ts
var v = [
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
	}
], y = [
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
], b = "webmapx-style", x = "webmapx-theme", S = {
	light: {
		style: "atlas",
		theme: "light"
	},
	dark: {
		style: "atlas",
		theme: "dark"
	},
	compact: {
		style: "console",
		theme: "light"
	},
	glossy: {
		style: "atlas",
		theme: "light"
	}
}, C = class extends i {
	constructor(...e) {
		super(...e), this.uiStyle = "atlas", this.uiTheme = "auto", this.apiKey = "", this.systemDark = null, this.systemDarkHandler = null, this.currentAdapter = c, this.availableAdapters = [];
	}
	static {
		this.styles = [
			m,
			g,
			f,
			_,
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
		super.connectedCallback(), this.loadSettings(), this.systemDark = window.matchMedia("(prefers-color-scheme: dark)"), this.systemDarkHandler = () => {
			this.uiTheme === "auto" && this.applyAppearance();
		}, this.systemDark.addEventListener("change", this.systemDarkHandler);
	}
	disconnectedCallback() {
		super.disconnectedCallback(), this.systemDark && this.systemDarkHandler && this.systemDark.removeEventListener("change", this.systemDarkHandler), this.systemDark = null, this.systemDarkHandler = null;
	}
	loadSettings() {
		let e = localStorage.getItem(b), t = localStorage.getItem(x), n = e ? S[e] : void 0;
		n ? (this.uiStyle = n.style, this.uiTheme = t ?? n.theme) : (this.uiStyle = v.some((t) => t.value === e) ? e : "atlas", this.uiTheme = y.some((e) => e.value === t) ? t : "auto"), this.applyAppearance(), this.apiKey = localStorage.getItem("webmapx-api-key") || "", this.availableAdapters = s().filter((e) => ![
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
	resolvedTheme() {
		return this.uiTheme === "auto" ? this.systemDark?.matches ?? window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light" : this.uiTheme;
	}
	applyAppearance() {
		let e = v.find((e) => e.value === this.uiStyle) ?? v[0], t = this.resolvedTheme(), n = document.documentElement;
		n.setAttribute("data-theme", t), n.classList.toggle("sl-theme-dark", t === "dark"), n.setAttribute("data-style", e.value), localStorage.setItem(b, e.value), localStorage.setItem(x, this.uiTheme);
	}
	emitAppearanceChange() {
		this.dispatchEvent(new CustomEvent("theme-change", {
			detail: {
				style: this.uiStyle,
				theme: this.uiTheme,
				resolvedTheme: this.resolvedTheme()
			},
			bubbles: !0,
			composed: !0
		}));
	}
	handleStyleChange(e) {
		let t = e.target;
		this.uiStyle = t.value, this.applyAppearance(), this.emitAppearanceChange();
	}
	handleThemeChange(e) {
		let t = e.target;
		this.uiTheme = t.value, this.applyAppearance(), this.emitAppearanceChange();
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
                            ${h(e)}
                        </sl-option>
                    `)}
                </sl-select>
            </section>

            <section class="panel-section">
                <h3 class="section-heading">Appearance</h3>
                <div class="field-with-info">
                <sl-select
                    size="small"
                    label="Style"
                    value=${this.uiStyle}
                    @sl-change=${this.handleStyleChange}
                >
                    ${v.map((e) => r`
                        <sl-option value=${e.value}>${e.label}</sl-option>
                    `)}
                </sl-select>
                ${p("Style", r`${v.map((e) => r`<div><b>${e.label}</b>: ${e.hint.charAt(0).toLowerCase()}${e.hint.slice(1)}</div>`)}`)}
                </div>
                <sl-select
                    size="small"
                    label="Theme"
                    value=${this.uiTheme}
                    @sl-change=${this.handleThemeChange}
                >
                    ${y.map((e) => r`
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
u([t()], C.prototype, "uiStyle", void 0), u([t()], C.prototype, "uiTheme", void 0), u([t()], C.prototype, "apiKey", void 0), u([t()], C.prototype, "currentAdapter", void 0), u([t()], C.prototype, "availableAdapters", void 0), C = u([n("webmapx-settings")], C);
//#endregion
export { C as WebmapxSettings };
