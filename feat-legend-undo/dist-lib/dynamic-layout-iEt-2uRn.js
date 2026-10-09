import { a as e, i as t, n, s as r } from "./tool-registry-Dj8WNvUg.js";
//#region src/utils/dynamic-layout.ts
function i(e) {
	return e ? e === "3d" ? "3D" : e.replace(/([a-z0-9])([A-Z])/g, "$1 $2").replace(/[-_]+/g, " ").trim().replace(/\b\w/g, (e) => e.toUpperCase()) : "Tool";
}
function a(e) {
	if (e) return typeof e == "string" ? { name: e } : e;
}
function o(e) {
	let t = n[e.type ?? ""] ?? n[e.id ?? ""];
	return {
		label: e.label ?? e.title ?? t?.label ?? i(e.id ?? e.type),
		description: t?.description,
		icon: e.icon ?? t?.icon
	};
}
function s(e) {
	try {
		if (e.startsWith("data:") || !e.includes("://")) return !0;
		let t = new URL(e, typeof window < "u" ? window.location.href : "http://localhost"), n = typeof window < "u" ? window.location.origin : "http://localhost";
		return t.origin === n;
	} catch {
		return !1;
	}
}
function c(e, t) {
	let n = a(t);
	if (!n) return !1;
	let r = n.src;
	return r && !s(r) && (console.warn(`[webmapx] Icon "src" blocked: cross-origin SVG URLs may contain executable code. Use a same-origin URL or a Shoelace named icon instead. Blocked: ${r}`), r = void 0), l(e, {
		name: n.name,
		library: n.library,
		src: r
	}), !!(n.name || r);
}
function l(e, t) {
	for (let [n, r] of Object.entries(t)) r == null || r === !1 || e.setAttribute(n, r === !0 ? "" : String(r));
}
function u(t, n, i, c, l) {
	for (let d of n) {
		if (d.enabled === !1) continue;
		let n = o(d), f = String(d.id ?? d.type ?? "");
		if (!f) continue;
		if (d.type && e.has(d.type)) {
			let e = c ? `${c}/${f}` : f;
			l.push({
				path: e,
				label: n.label,
				icon: n.icon
			}), u(t, Array.isArray(d.items) ? d.items : [], i, e, l);
			continue;
		}
		let p = d.type ? r[d.type] : void 0;
		if (!p) continue;
		let m = document.createElement(p);
		if (m.setAttribute("tool-id", f), m.setAttribute("label", n.label), n.icon) {
			let e = a(n.icon);
			e?.name && m.setAttribute(`${i}-icon`, e.name), e?.src && s(e.src) && m.setAttribute(`${i}-icon-src`, e.src), m.icon = n.icon;
		}
		d.keywords && m.setAttribute(`${i}-keywords`, String(d.keywords)), i === "menu" && c && m.setAttribute("menu-path", c), t.appendChild(m);
	}
}
function d(t) {
	let n = t.panel, i = document.createElement("webmapx-control-group");
	l(i, {
		slot: t.position,
		orientation: t.orientation ?? "vertical",
		"panel-position": n?.position ?? "after",
		alignment: t.alignment ?? "start",
		priority: t.priority ?? "normal"
	});
	let a = document.createElement("webmapx-toolbar");
	l(a, {
		"tooltip-placement": t.tooltipPlacement,
		orientation: t.orientation
	});
	let s = document.createElement("webmapx-tool-panel");
	n?.label && s.setAttribute("label", String(n.label));
	let d = Array.isArray(t.items) ? t.items : [];
	for (let t of d) {
		if (t.enabled === !1) continue;
		if (t.type === "spacer") {
			let e = document.createElement("div");
			e.style.flex = "1", e.style.pointerEvents = "none", a.appendChild(e);
			continue;
		}
		let n = o(t), i = t.id ?? t.type, d = document.createElement("sl-button");
		l(d, {
			name: i,
			size: "medium",
			"data-tooltip": n.label
		});
		let f = document.createElement("sl-icon");
		if (c(f, n.icon)) {
			f.setAttribute("aria-hidden", "true"), d.appendChild(f);
			let e = document.createElement("span");
			e.style.cssText = "position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0", e.textContent = n.label, d.appendChild(e);
		} else d.textContent = n.label;
		a.appendChild(d);
		let p = t.type ? r[t.type] : void 0;
		if (p) {
			let r = document.createElement(p);
			if (r.setAttribute("tool-id", String(i)), r.setAttribute("label", n.label), n.description && r.setAttribute("panel-description", n.description), n.icon && (r.icon = n.icon), t.type && e.has(t.type)) {
				let e = t.type, n = [];
				u(r, Array.isArray(t.items) ? t.items : [], e, "", n), e === "menu" && n.length > 0 && r.setAttribute("groups", JSON.stringify(n));
			}
			s.appendChild(r);
		}
	}
	return i.appendChild(s), i.appendChild(a), i;
}
function f(e, n) {
	let r = t[e];
	if (!r) return null;
	let i = document.createElement(r);
	switch (i.setAttribute("slot", String(n.position)), e) {
		case "scale":
			n.maxWidth !== void 0 && i.setAttribute("max-width", String(n.maxWidth)), n.margin && i.setAttribute("style", `--webmapx-tool-margin: ${n.margin}`);
			break;
		case "navigation":
			n.direction && i.setAttribute("direction", String(n.direction)), n.orientation && i.setAttribute("orientation", String(n.orientation));
			break;
		case "insetMap":
			n.zoomOffset !== void 0 && i.setAttribute("zoom-offset", String(n.zoomOffset)), n.minimizable && i.setAttribute("minimizable", "");
			break;
		case "maplanguage":
			(n.visible === !1 || n.visible === 0) && i.setAttribute("hide-ui", ""), typeof n.language == "string" && i.setAttribute("language", n.language);
			break;
	}
	return i;
}
function p(e, t) {
	if (t) for (let [r, i] of Object.entries(t)) {
		if (!i || typeof i != "object") continue;
		let t = i;
		if (t.enabled === !1) continue;
		let a = n[r], o = a ? {
			...t,
			label: t.label ?? a.label,
			icon: t.icon ?? a.icon
		} : t;
		if (o.type === "toolbar") {
			e.appendChild(d(o));
			continue;
		}
		let s = f(r, o);
		s && e.appendChild(s);
	}
}
//#endregion
export { p as t };
