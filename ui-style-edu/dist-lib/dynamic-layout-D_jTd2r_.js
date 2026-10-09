import { i as e, l as t, n, o as r, s as i } from "./tool-accent-BKir59si.js";
//#region src/utils/dynamic-layout.ts
function a(e) {
	return e ? e === "3d" ? "3D" : e.replace(/([a-z0-9])([A-Z])/g, "$1 $2").replace(/[-_]+/g, " ").trim().replace(/\b\w/g, (e) => e.toUpperCase()) : "Tool";
}
function o(e) {
	if (e) return typeof e == "string" ? { name: e } : e;
}
function s(t) {
	let n = e[t.type ?? ""] ?? e[t.id ?? ""];
	return {
		label: t.label ?? t.title ?? n?.label ?? a(t.id ?? t.type),
		description: n?.description,
		icon: t.icon ?? n?.icon
	};
}
function c(e) {
	try {
		if (e.startsWith("data:") || !e.includes("://")) return !0;
		let t = new URL(e, typeof window < "u" ? window.location.href : "http://localhost"), n = typeof window < "u" ? window.location.origin : "http://localhost";
		return t.origin === n;
	} catch {
		return !1;
	}
}
function l(e, t) {
	let n = o(t);
	if (!n) return !1;
	let r = n.src;
	return r && !c(r) && (console.warn(`[webmapx] Icon "src" blocked: cross-origin SVG URLs may contain executable code. Use a same-origin URL or a Shoelace named icon instead. Blocked: ${r}`), r = void 0), u(e, {
		name: n.name,
		library: n.library,
		src: r
	}), !!(n.name || r);
}
function u(e, t) {
	for (let [n, r] of Object.entries(t)) r == null || r === !1 || e.setAttribute(n, r === !0 ? "" : String(r));
}
function d(e, n, r, a, l) {
	for (let u of n) {
		if (u.enabled === !1) continue;
		let n = s(u), f = String(u.id ?? u.type ?? "");
		if (!f) continue;
		if (u.type && i.has(u.type)) {
			let t = a ? `${a}/${f}` : f;
			l.push({
				path: t,
				label: n.label,
				icon: n.icon
			}), d(e, Array.isArray(u.items) ? u.items : [], r, t, l);
			continue;
		}
		let p = u.type ? t[u.type] : void 0;
		if (!p) continue;
		let m = document.createElement(p);
		if (m.setAttribute("tool-id", f), m.setAttribute("label", n.label), n.icon) {
			let e = o(n.icon);
			e?.name && m.setAttribute(`${r}-icon`, e.name), e?.src && c(e.src) && m.setAttribute(`${r}-icon-src`, e.src), m.icon = n.icon;
		}
		u.keywords && m.setAttribute(`${r}-keywords`, String(u.keywords)), r === "menu" && a && m.setAttribute("menu-path", a), e.appendChild(m);
	}
}
function f(e) {
	let r = e.panel, a = document.createElement("webmapx-control-group");
	u(a, {
		slot: e.position,
		orientation: e.orientation ?? "vertical",
		"panel-position": r?.position ?? "after",
		alignment: e.alignment ?? "start",
		priority: e.priority ?? "normal"
	});
	let o = document.createElement("webmapx-toolbar"), c = e.labels === !0;
	u(o, {
		"tooltip-placement": e.tooltipPlacement,
		orientation: e.orientation,
		labels: c
	});
	let f = new n(), p = document.createElement("webmapx-tool-panel");
	r?.label && p.setAttribute("label", String(r.label));
	let m = Array.isArray(e.items) ? e.items : [];
	for (let e of m) {
		if (e.enabled === !1) continue;
		if (e.type === "spacer") {
			let e = document.createElement("div");
			e.style.flex = "1", e.style.pointerEvents = "none", o.appendChild(e);
			continue;
		}
		let n = s(e), r = e.id ?? e.type, a = document.createElement("sl-button");
		u(a, {
			name: r,
			size: "medium",
			"data-tooltip": c ? void 0 : n.label
		});
		let m = f.take(e.color);
		a.style.setProperty("--webmapx-tool-accent", m);
		let h = document.createElement("sl-icon");
		if (l(h, n.icon)) {
			h.setAttribute("aria-hidden", "true"), a.appendChild(h);
			let e = document.createElement("span");
			e.className = "webmapx-toolbar-label", c || (e.style.cssText = "position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0"), e.textContent = n.label, a.appendChild(e);
		} else a.textContent = n.label;
		o.appendChild(a);
		let g = e.type ? t[e.type] : void 0;
		if (g) {
			let t = document.createElement(g);
			if (t.setAttribute("tool-id", String(r)), t.setAttribute("label", n.label), t.style.setProperty("--webmapx-tool-accent", m), n.description && t.setAttribute("panel-description", n.description), n.icon && (t.icon = n.icon), e.type && i.has(e.type)) {
				let n = e.type, r = [];
				d(t, Array.isArray(e.items) ? e.items : [], n, "", r), n === "menu" && r.length > 0 && t.setAttribute("groups", JSON.stringify(r));
			}
			p.appendChild(t);
		}
	}
	return a.appendChild(p), a.appendChild(o), a;
}
function p(e, t) {
	let n = r[e];
	if (!n) return null;
	let i = document.createElement(n);
	switch (i.setAttribute("slot", String(t.position)), e) {
		case "scale":
			t.maxWidth !== void 0 && i.setAttribute("max-width", String(t.maxWidth)), t.margin && i.setAttribute("style", `--webmapx-tool-margin: ${t.margin}`);
			break;
		case "navigation":
			t.direction && i.setAttribute("direction", String(t.direction)), t.orientation && i.setAttribute("orientation", String(t.orientation));
			break;
		case "insetMap":
			t.zoomOffset !== void 0 && i.setAttribute("zoom-offset", String(t.zoomOffset)), t.minimizable && i.setAttribute("minimizable", "");
			break;
		case "maplanguage":
			(t.visible === !1 || t.visible === 0) && i.setAttribute("hide-ui", ""), typeof t.language == "string" && i.setAttribute("language", t.language);
			break;
	}
	return i;
}
function m(t, n) {
	if (n) for (let [r, i] of Object.entries(n)) {
		if (!i || typeof i != "object") continue;
		let n = i;
		if (n.enabled === !1) continue;
		let a = e[r], o = a ? {
			...n,
			label: n.label ?? a.label,
			icon: n.icon ?? a.icon
		} : n;
		if (o.type === "toolbar") {
			t.appendChild(f(o));
			continue;
		}
		let s = p(r, o);
		s && t.appendChild(s);
	}
}
//#endregion
export { m as t };
