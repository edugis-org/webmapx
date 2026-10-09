import { a as e, h as t, o as n, p as r } from "./decorators-d8E4nZJy.js";
import { t as i } from "./decorate-Bl-DXcQA.js";
import { t as a } from "./webmapx-modal-tool-DS_L8Zce.js";
import { t as o } from "./form-label-styles-CiXgi-FX.js";
import { t as s } from "./help-text-styles-BFw9dhCq.js";
import "./option-REOFPMrE.js";
//#region src/components/webmapx-language-osmvector.ts
var c = "webmapx-language-osmvector", l = "webmapx-language-osmvector-change", u = /* @__PURE__ */ new WeakMap(), d = [
	{
		code: "local",
		label: "Local name",
		en: "Local name"
	},
	{
		code: "browser",
		label: "Browser language",
		en: "Browser language"
	},
	{
		code: "en",
		label: "English",
		en: "English"
	},
	{
		code: "nl",
		label: "Nederlands",
		en: "Dutch"
	},
	{
		code: "de",
		label: "Deutsch",
		en: "German"
	},
	{
		code: "fr",
		label: "Français",
		en: "French"
	},
	{
		code: "es",
		label: "Español",
		en: "Spanish"
	},
	{
		code: "it",
		label: "Italiano",
		en: "Italian"
	},
	{
		code: "pt",
		label: "Português",
		en: "Portuguese"
	},
	{
		code: "ca",
		label: "Català",
		en: "Catalan"
	},
	{
		code: "eu",
		label: "Euskara",
		en: "Basque"
	},
	{
		code: "la",
		label: "Latina",
		en: "Latin"
	},
	{
		code: "latin",
		label: "Latin script",
		en: "Latin script"
	},
	{
		code: "cy",
		label: "Cymraeg",
		en: "Welsh"
	},
	{
		code: "ga",
		label: "Gaeilge",
		en: "Irish"
	},
	{
		code: "gd",
		label: "Gàidhlig",
		en: "Scottish Gaelic"
	},
	{
		code: "br",
		label: "Brezhoneg",
		en: "Breton"
	},
	{
		code: "co",
		label: "Corsu",
		en: "Corsican"
	},
	{
		code: "oc",
		label: "Occitan",
		en: "Occitan"
	},
	{
		code: "rm",
		label: "Rumantsch",
		en: "Romansh"
	},
	{
		code: "lb",
		label: "Lëtzebuergesch",
		en: "Luxembourgish"
	},
	{
		code: "af",
		label: "Afrikaans",
		en: "Afrikaans"
	},
	{
		code: "da",
		label: "Dansk",
		en: "Danish"
	},
	{
		code: "no",
		label: "Norsk",
		en: "Norwegian"
	},
	{
		code: "sv",
		label: "Svenska",
		en: "Swedish"
	},
	{
		code: "is",
		label: "Íslenska",
		en: "Icelandic"
	},
	{
		code: "fi",
		label: "Suomi",
		en: "Finnish"
	},
	{
		code: "et",
		label: "Eesti",
		en: "Estonian"
	},
	{
		code: "lv",
		label: "Latviešu",
		en: "Latvian"
	},
	{
		code: "lt",
		label: "Lietuvių",
		en: "Lithuanian"
	},
	{
		code: "pl",
		label: "Polski",
		en: "Polish"
	},
	{
		code: "cs",
		label: "Čeština",
		en: "Czech"
	},
	{
		code: "sk",
		label: "Slovenčina",
		en: "Slovak"
	},
	{
		code: "hu",
		label: "Magyar",
		en: "Hungarian"
	},
	{
		code: "sl",
		label: "Slovenščina",
		en: "Slovenian"
	},
	{
		code: "hr",
		label: "Hrvatski",
		en: "Croatian"
	},
	{
		code: "bs",
		label: "Bosanski",
		en: "Bosnian"
	},
	{
		code: "sr",
		label: "Српски",
		en: "Serbian"
	},
	{
		code: "mk",
		label: "Македонски",
		en: "Macedonian"
	},
	{
		code: "sq",
		label: "Shqip",
		en: "Albanian"
	},
	{
		code: "ro",
		label: "Română",
		en: "Romanian"
	},
	{
		code: "bg",
		label: "Български",
		en: "Bulgarian"
	},
	{
		code: "uk",
		label: "Українська",
		en: "Ukrainian"
	},
	{
		code: "be",
		label: "Беларуская",
		en: "Belarusian"
	},
	{
		code: "ru",
		label: "Русский",
		en: "Russian"
	},
	{
		code: "el",
		label: "Ελληνικά",
		en: "Greek"
	},
	{
		code: "tr",
		label: "Türkçe",
		en: "Turkish"
	},
	{
		code: "az",
		label: "Azərbaycan",
		en: "Azerbaijani"
	},
	{
		code: "ka",
		label: "ქართული",
		en: "Georgian"
	},
	{
		code: "hy",
		label: "Հայերեն",
		en: "Armenian"
	},
	{
		code: "kk",
		label: "Қазақша",
		en: "Kazakh"
	},
	{
		code: "mt",
		label: "Malti",
		en: "Maltese"
	},
	{
		code: "he",
		label: "עברית",
		en: "Hebrew"
	},
	{
		code: "ar",
		label: "العربية",
		en: "Arabic"
	},
	{
		code: "fa",
		label: "فارسی",
		en: "Persian"
	},
	{
		code: "ur",
		label: "اردو",
		en: "Urdu"
	},
	{
		code: "pnb",
		label: "پنجابی",
		en: "Western Punjabi"
	},
	{
		code: "pa",
		label: "ਪੰਜਾਬੀ",
		en: "Punjabi"
	},
	{
		code: "hi",
		label: "हिन्दी",
		en: "Hindi"
	},
	{
		code: "bn",
		label: "বাংলা",
		en: "Bengali"
	},
	{
		code: "ta",
		label: "தமிழ்",
		en: "Tamil"
	},
	{
		code: "te",
		label: "తెలుగు",
		en: "Telugu"
	},
	{
		code: "kn",
		label: "ಕನ್ನಡ",
		en: "Kannada"
	},
	{
		code: "ml",
		label: "മലയാളം",
		en: "Malayalam"
	},
	{
		code: "th",
		label: "ภาษาไทย",
		en: "Thai"
	},
	{
		code: "vi",
		label: "Tiếng Việt",
		en: "Vietnamese"
	},
	{
		code: "id",
		label: "Bahasa Indonesia",
		en: "Indonesian"
	},
	{
		code: "ja",
		label: "日本語",
		en: "Japanese"
	},
	{
		code: "ko",
		label: "한국어",
		en: "Korean"
	},
	{
		code: "zh",
		label: "中文",
		en: "Chinese"
	},
	{
		code: "zh-Hans",
		label: "简体中文",
		en: "Chinese (Simplified)"
	},
	{
		code: "zh-Hant",
		label: "繁體中文",
		en: "Chinese (Traditional)"
	},
	{
		code: "am",
		label: "አማርኛ",
		en: "Amharic"
	},
	{
		code: "eo",
		label: "Esperanto",
		en: "Esperanto"
	},
	{
		code: "ku",
		label: "Kurdî",
		en: "Kurdish"
	},
	{
		code: "tok",
		label: "Toki Pona",
		en: "Toki Pona"
	}
], f = /"name(?:[:_][\w-]+)?"/, p = /\{name(?:[:_][\w-]+)?\}/;
function m(e) {
	return e === void 0 ? !1 : typeof e == "string" ? p.test(e) : f.test(JSON.stringify(e));
}
var h = class extends a {
	constructor(...e) {
		super(...e), this.toolId = "maplanguage", this.hideUi = !1, this.language = localStorage.getItem(c) ?? "browser", this.boundLanguageChangeEvent = (e) => {
			let t = e.detail?.language;
			t === void 0 || t === this.language || (this.language = t, this.applyLanguage());
		};
	}
	static {
		this.styles = [
			o,
			s,
			t`
        :host {
            display: block;
        }
        .container {
            padding: 0.5rem 1rem;
            font-size: 0.875rem;
        }
        sl-select {
            width: 100%;
        }
    `
		];
	}
	connectedCallback() {
		this.hideUi && (this.registerWithToolManager = !1), this.hasAttribute("role") || this.setAttribute("role", "region"), super.connectedCallback(), window.addEventListener(l, this.boundLanguageChangeEvent);
	}
	disconnectedCallback() {
		window.removeEventListener(l, this.boundLanguageChangeEvent), super.disconnectedCallback();
	}
	onMapAttached(e) {
		super.onMapAttached(e), this.hookAddLayer(e), this.language !== "local" && this.applyLanguage();
	}
	hookAddLayer(e) {
		if (u.get(e)) return;
		let t = {
			tracked: [],
			originalAddLayer: e.addLayer.bind(e)
		};
		u.set(e, t);
		for (let [n, r] of e.getLayerConfigs()) {
			let e = r;
			if (!(e?.type !== "style" || !Array.isArray(e?.layers))) for (let r of e.layers) {
				if (r.type !== "symbol") continue;
				let e = r.layout?.["text-field"];
				if (!m(e)) continue;
				let i = r.id ?? `${r.source}-${r.type}`;
				t.tracked.some((e) => e.layerId === n && e.subLayerId === i) || t.tracked.push({
					layerId: n,
					subLayerId: i,
					originalTextField: e
				});
			}
		}
		e.addLayer = async (e, n) => {
			let r = e?.id;
			if (e?.type === "style" && Array.isArray(e.layers) && typeof r == "string") for (let n of e.layers) {
				if (n.type !== "symbol") continue;
				let e = n.layout?.["text-field"];
				if (!m(e)) continue;
				let i = n.id ?? `${n.source}-${n.type}`;
				t.tracked.push({
					layerId: r,
					subLayerId: i,
					originalTextField: e
				}), this.language !== "local" && (n.layout = {
					...n.layout,
					"text-field": this.buildTextField(this.language, e)
				});
			}
			return t.originalAddLayer(e, n);
		};
	}
	buildTextField(e, t) {
		let n = e === "browser" ? (navigator.language ?? "en").split("-")[0] : e;
		return typeof t == "string" ? [
			"coalesce",
			["get", `name:${n}`],
			["get", "name:latin"],
			["get", "name"]
		] : [
			"coalesce",
			["get", `name:${n}`],
			t
		];
	}
	applyLanguage() {
		if (!this.adapter) return;
		let e = u.get(this.adapter)?.tracked ?? [];
		for (let { layerId: t, subLayerId: n, originalTextField: r } of e) {
			let e = this.language === "local" ? r : this.buildTextField(this.language, r);
			this.adapter.updateLayerStyle(t, n, { "text-field": e });
		}
	}
	handleLanguageChange(e) {
		let t = e.target.value;
		this.language = t, localStorage.setItem(c, t), this.applyLanguage(), window.dispatchEvent(new CustomEvent(l, { detail: { language: t } }));
	}
	render() {
		if (this.hideUi) return r``;
		let e = d.find((e) => e.code === this.language);
		return r`
            <div class="tool-content container">
                <!-- The help text gives the chosen language's English name ("Español" →
                     "Spanish"), for a reader who does not recognise it in its own
                     script. Left out where it would only repeat the option. -->
                <sl-select
                    size="small"
                    label="Language"
                    help-text=${e && e.en !== e.label ? e.en : ""}
                    value=${this.language}
                    hoist
                    @sl-change=${this.handleLanguageChange}
                >
                    ${d.map((e) => r`
                        <sl-option value=${e.code}>${e.label}</sl-option>
                    `)}
                </sl-select>
            </div>
        `;
	}
};
i([e({
	type: Boolean,
	attribute: "hide-ui"
})], h.prototype, "hideUi", void 0), i([e({ type: String })], h.prototype, "language", void 0), h = i([n("webmapx-language-osmvector")], h);
//#endregion
export { h as WebmapxLanguageOsmVector };
