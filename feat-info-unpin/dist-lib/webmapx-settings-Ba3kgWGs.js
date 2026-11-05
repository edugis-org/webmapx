import { h as e, i as t, o as n, p as r, s as i } from "./decorators-d8E4nZJy.js";
import { d as a, f as o, m as s, p as c, r as l, t as u, u as d } from "./decorate-CmPZ6p_g.js";
import { a as f, c as p, i as m, t as h } from "./appearance-DVUQGZTG.js";
import { t as g } from "./control-surface-styles-zbl1JfZH.js";
import { n as _ } from "./info-toggle-tL04Yu0p.js";
import "./input-eCCT7kEl.js";
import { t as v } from "./form-label-styles-D-b4atN_.js";
import { t as y } from "./engine-labels-PQywGOyZ.js";
import { t as b } from "./help-text-styles-BFw9dhCq.js";
import "./option-REOFPMrE.js";
import { t as x } from "./section-heading-styles-C5uUvYgD.js";
//#region src/components/webmapx-settings.ts
var S = [
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
], C = [
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
], w = class extends i {
	constructor(...e) {
		super(...e), this.uiStyle = "atlas", this.uiTheme = "auto", this.apiKey = "", this.appearanceListener = () => this.syncAppearance(), this.currentAdapter = c, this.availableAdapters = [];
	}
	static {
		this.styles = [
			v,
			b,
			g,
			x,
			e`
        :host {
            display: block;
            padding: var(--webmapx-tool-padding, 1rem);
            box-sizing: border-box;
        }

        /* 12px between fields, 8px under a section heading. */
        .panel-section > * {
            margin: 0;
        }

        .panel-section > * + * {
            margin-top: var(--webmapx-space-md, 0.75rem);
        }

        .panel-section > .section-heading + * {
            margin-top: var(--webmapx-space-sm, 0.5rem);
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
                            ${y(e)}
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
                    ${S.map((e) => r`
                        <sl-option value=${e.value}>${e.label}</sl-option>
                    `)}
                </sl-select>
                ${_("Style", r`${S.map((e) => r`<div><b>${e.label}</b>: ${e.hint.charAt(0).toLowerCase()}${e.hint.slice(1)}</div>`)}`)}
                </div>
                <sl-select
                    size="small"
                    label="Theme"
                    value=${this.uiTheme}
                    @sl-change=${this.handleThemeChange}
                >
                    ${C.map((e) => r`
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
u([t()], w.prototype, "uiStyle", void 0), u([t()], w.prototype, "uiTheme", void 0), u([t()], w.prototype, "apiKey", void 0), u([t()], w.prototype, "currentAdapter", void 0), u([t()], w.prototype, "availableAdapters", void 0), w = u([n("webmapx-settings")], w);
//#endregion
export { w as WebmapxSettings };
