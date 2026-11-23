//#region node_modules/@shoelace-style/localize/dist/index.js
var e = /* @__PURE__ */ new Set(), t = /* @__PURE__ */ new Map(), n, r = "ltr", i = "en", a = typeof MutationObserver < "u" && typeof document < "u" && document.documentElement !== void 0;
if (a) {
	let e = new MutationObserver(s);
	r = document.documentElement.dir || "ltr", i = document.documentElement.lang || navigator.language, e.observe(document.documentElement, {
		attributes: !0,
		attributeFilter: ["dir", "lang"]
	});
}
function o(...e) {
	e.map((e) => {
		let r = e.$code.toLowerCase();
		t.has(r) ? t.set(r, Object.assign(Object.assign({}, t.get(r)), e)) : t.set(r, e), n ||= e;
	}), s();
}
function s() {
	a && (r = document.documentElement.dir || "ltr", i = document.documentElement.lang || navigator.language), [...e.keys()].map((e) => {
		typeof e.requestUpdate == "function" && e.requestUpdate();
	});
}
var c = class {
	constructor(e) {
		this.host = e, this.host.addController(this);
	}
	hostConnected() {
		e.add(this.host);
	}
	hostDisconnected() {
		e.delete(this.host);
	}
	dir() {
		return `${this.host.dir || r}`.toLowerCase();
	}
	lang() {
		return `${this.host.lang || i}`.toLowerCase();
	}
	getTranslationData(e) {
		let n = new Intl.Locale(e.replace(/_/g, "-")), r = n?.language.toLowerCase(), i = (n?.region)?.toLowerCase() ?? "";
		return {
			locale: n,
			language: r,
			region: i,
			primary: t.get(`${r}-${i}`),
			secondary: t.get(r)
		};
	}
	exists(e, t) {
		let { primary: r, secondary: i } = this.getTranslationData(t.lang ?? this.lang());
		return t = Object.assign({ includeFallback: !1 }, t), !!(r && r[e] || i && i[e] || t.includeFallback && n && n[e]);
	}
	term(e, ...t) {
		let { primary: r, secondary: i } = this.getTranslationData(this.lang()), a;
		if (r && r[e]) a = r[e];
		else if (i && i[e]) a = i[e];
		else if (n && n[e]) a = n[e];
		else return console.error(`No translation found for: ${String(e)}`), String(e);
		return typeof a == "function" ? a(...t) : a;
	}
	date(e, t) {
		return e = new Date(e), new Intl.DateTimeFormat(this.lang(), t).format(e);
	}
	number(e, t) {
		return e = Number(e), isNaN(e) ? "" : new Intl.NumberFormat(this.lang(), t).format(e);
	}
	relativeTime(e, t, n) {
		return new Intl.RelativeTimeFormat(this.lang(), n).format(e, t);
	}
}, l = {
	$code: "en",
	$name: "English",
	$dir: "ltr",
	carousel: "Carousel",
	clearEntry: "Clear entry",
	close: "Close",
	copied: "Copied",
	copy: "Copy",
	currentValue: "Current value",
	error: "Error",
	goToSlide: (e, t) => `Go to slide ${e} of ${t}`,
	hidePassword: "Hide password",
	loading: "Loading",
	nextSlide: "Next slide",
	numOptionsSelected: (e) => e === 0 ? "No options selected" : e === 1 ? "1 option selected" : `${e} options selected`,
	previousSlide: "Previous slide",
	progress: "Progress",
	remove: "Remove",
	resize: "Resize",
	scrollToEnd: "Scroll to end",
	scrollToStart: "Scroll to start",
	selectAColorFromTheScreen: "Select a color from the screen",
	showPassword: "Show password",
	slideNum: (e) => `Slide ${e}`,
	toggleColorFormat: "Toggle color format"
};
o(l);
var u = l, d = class extends c {};
o(u);
//#endregion
export { d as t };
