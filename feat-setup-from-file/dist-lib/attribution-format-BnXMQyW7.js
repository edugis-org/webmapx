import { p as e } from "./decorators-d8E4nZJy.js";
//#region src/utils/attribution-format.ts
var t = /(https?:\/\/[^\s<"]+)/g, n = /<a\s[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
function r(e, t) {
	if (!e) return;
	if (e.type === "style") {
		let t = e.attribution;
		if (typeof t == "string") return t;
	}
	let n = e.type === "style" ? e.layers ?? [] : [e], r = e.sources, i = (e) => {
		if (!r || typeof r != "object") return;
		let t = Array.isArray(r) ? r.find((t) => t?.id === e) : r[e];
		return typeof t?.attribution == "string" ? t.attribution : void 0;
	};
	for (let e of n) {
		let n = e.source;
		if (!n) continue;
		let r = t.get(n);
		if (r && typeof r.attribution == "string") return r.attribution;
		let a = i(n);
		if (a) return a;
	}
}
function i(e) {
	return a(o(e)).toLowerCase().replace(/[\s\u00a0]+/g, " ").replace(/[.,;:]+$/, "").trim();
}
function a(e) {
	return e.replace(/<[^>]+>/g, "");
}
function o(e) {
	return e.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, "\"").replace(/&#39;/g, "'").replace(/&copy;/g, "©").replace(/&reg;/g, "®").replace(/&trade;/g, "™").replace(/&#(\d+);/g, (e, t) => String.fromCharCode(Number(t))).replace(/&#x([0-9a-f]+);/gi, (e, t) => String.fromCharCode(parseInt(t, 16)));
}
function s(e) {
	try {
		let { hostname: t } = new URL(e);
		return `_attr_${t.replace(/[^a-z0-9]/gi, "_")}`;
	} catch {
		return "_attr_link";
	}
}
function c(r) {
	let i = [], c = 0;
	n.lastIndex = 0;
	for (let e of r.matchAll(n)) {
		let t = e.index ?? 0;
		t > c && i.push(a(o(r.slice(c, t)))), i.push({
			href: e[1],
			label: a(o(e[2]))
		}), c = t + e[0].length;
	}
	let l = r.slice(c);
	t.lastIndex = 0;
	let u = 0;
	for (let e of l.matchAll(t)) {
		let t = e.index ?? 0;
		t > u && i.push(a(o(l.slice(u, t))));
		let n = e[0];
		try {
			n = new URL(e[0]).hostname.replace(/^www\./, "");
		} catch {}
		i.push({
			href: e[0],
			label: n
		}), u = t + e[0].length;
	}
	return u < l.length && i.push(a(o(l.slice(u)))), e`<span class="attribution-item">
        ${i.map((t) => typeof t == "string" ? e`${t}` : e`<a href=${t.href} target=${s(t.href)} rel="noopener noreferrer">${t.label}</a>`)}
    </span>`;
}
function l(e, t, n) {
	let a = /* @__PURE__ */ new Map(), o = [], s = (e) => {
		if (e) for (let t of e.split("|")) {
			let e = t.trim();
			if (!e) continue;
			let n = i(e);
			if (!n) continue;
			let r = a.get(n);
			if (r === void 0) {
				a.set(n, o.length), o.push(e);
				continue;
			}
			e.includes("<a") && !o[r].includes("<a") && (o[r] = e);
		}
	};
	for (let i of e) {
		if (i.catalogLayer) {
			s(r(i.catalogLayer, t));
			continue;
		}
		if (i.entryAttribution) {
			s(i.entryAttribution);
			continue;
		}
		i.sourceId && s(n?.(i.sourceId));
	}
	return o;
}
//#endregion
export { a as i, o as n, c as r, l as t };
