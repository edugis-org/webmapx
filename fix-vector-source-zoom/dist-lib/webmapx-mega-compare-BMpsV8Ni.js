import { h as e, i as t, o as n } from "./decorators-d8E4nZJy.js";
import { t as r } from "./decorate-DC23DRf-.js";
import { t as i } from "./webmapx-base-tool-B9G3jUwL.js";
import { i as a } from "./compare-replay-Nc8FG2S9.js";
import { n as o, t as s } from "./kiosk-notice-j9T9xnlg.js";
//#region src/utils/mega-compare-mirror.ts
var c = "mega-compare-reference", l = 0;
async function u(e, t) {
	let n = e.config;
	if (!n) return null;
	let r = document.createElement("webmapx-map");
	r.id = `${e.id || "map"}-mega-compare-reference-${l++}`, r.dataset.webmapxRole = c, r.setAttribute("adapter", t.engineId), r.style.position = "absolute", r.style.inset = "0", r.style.pointerEvents = "none";
	let i = e.querySelector(":scope > webmapx-layout");
	e.insertBefore(r, i);
	let a = await r.getAdapterAsync();
	if (!a) return r.remove(), null;
	r.setConfig(n), a.initialize(r.id, d(n, t)), await r.whenLayersReady();
	for (let t of e.runtimeLayerRequests) await r.addLayerRequest(t.request, t.fallback, t.options);
	return p(t, a), {
		element: r,
		adapter: a,
		destroy: () => r.remove()
	};
}
function d(e, t) {
	let n = e.map ?? {}, r = t.getViewportState(), i = e.runtimeMap;
	return {
		center: r.center,
		zoom: r.zoom,
		minZoom: i?.minZoom ?? n.minZoom,
		maxZoom: i?.maxZoom ?? n.maxZoom,
		minPitch: i?.minPitch ?? n.minPitch,
		maxPitch: i?.maxPitch ?? n.maxPitch,
		maxBounds: i?.maxBounds,
		style: n.style,
		backgroundColor: n.backgroundColor,
		projection: t.getProjection()?.name ?? n.projection
	};
}
function f(e) {
	let t = /* @__PURE__ */ new Set();
	for (let [n, r] of Object.entries(e)) {
		let e = r;
		typeof e.sourceId == "string" && t.add(e.sourceId);
		let i = Array.isArray(e.sublayers) ? e.sublayers : [];
		for (let e of i) typeof e.source == "string" && t.add(`${n}:${e.source}`);
	}
	return [...t];
}
function p(e, t) {
	let n = e.store.getState().mapLayers ?? {};
	for (let r of f(n)) {
		let n = e.getSourceData(r);
		if (!n || typeof n == "string") continue;
		if (t.getSource(r)) {
			t.setSourceData(r, n);
			continue;
		}
		let i = e.getSourceConfig(r);
		t.addSource(r, {
			type: "geojson",
			...i ?? {},
			data: n
		});
	}
}
function m(e, t, n) {
	let r = e.store.getState().mapLayers ?? {};
	for (let e of Object.keys(t.store.getState().mapLayers ?? {})) r[e] || t.removeLayer(e);
	let i = t.store.getState().mapLayers ?? {}, a = Object.keys(r).filter((e) => i[e]);
	for (let e of a) {
		let a = r[e], o = i[e], s = e === n ? !1 : a.visible !== !1;
		s !== (o.visible !== !1) && t.setLayerVisibility(e, s);
		let c = typeof a.transparency == "number" ? a.transparency : 0, l = typeof o.transparency == "number" ? o.transparency : 0;
		Math.abs(c - l) > 1e-6 && t.setLayerOpacity(e, (100 - c) / 100), h(t, e, a, o);
	}
	Object.keys(t.store.getState().mapLayers ?? {}).filter((e) => r[e]).join("\n") !== a.join("\n") && a.forEach((e, n) => {
		n > 0 && t.moveLayer(e, null);
	});
}
function h(e, t, n, r) {
	let i = (e, t) => JSON.stringify(e ?? {}) === JSON.stringify(t ?? {}), a = Array.isArray(n.sublayers) ? n.sublayers : null;
	if (a) {
		let n = Array.isArray(r.sublayers) ? r.sublayers : [];
		for (let r of a) {
			let a = r.paint, o = typeof r.id == "string" ? r.id : null;
			!a || !o || Object.keys(a).length === 0 || i(a, n.find((e) => e.id === o)?.paint) || e.updateLayerStyle(t, o, a);
		}
		return;
	}
	let o = n.paint;
	o && Object.keys(o).length > 0 && !i(o, r.paint) && e.updateLayerStyle(t, t, o);
}
function g(e, t) {
	let n = e.getProjection();
	n && n.name !== t.getProjection()?.name && t.setProjection(n);
	let r = e.isTerrainEnabled();
	r !== null && r !== t.isTerrainEnabled() && t.setTerrainEnabled(r === !0);
}
//#endregion
//#region src/components/webmapx-mega-compare.ts
var _ = 50, v = 2, y = 44, b = 16, x = class extends i {
	constructor(...e) {
		super(...e), this.active = !1, this.topLabel = "", this.secondLabel = "", this.mirror = null, this.knownLayerIds = /* @__PURE__ */ new Set(), this.topId = null, this.rebuildInFlight = !1, this.mirrorGeneration = 0, this.syncedFrom = null, this.split = _, this.notice = new s(this), this.handleEl = null, this.cameraUnsubscribe = null, this.dragPointerId = null, this.onPointerDown = (e) => {
			this.dragPointerId = e.pointerId, e.currentTarget.setPointerCapture(e.pointerId), e.preventDefault(), e.stopPropagation();
		}, this.onPointerMove = (e) => {
			this.dragPointerId === e.pointerId && this.setSplit(this.splitFromClientX(e.clientX));
		}, this.onPointerUp = (e) => {
			this.dragPointerId === e.pointerId && (e.currentTarget.releasePointerCapture(e.pointerId), this.dragPointerId = null);
		}, this.onHandleKeyDown = (e) => {
			let t = {
				ArrowLeft: this.split - v,
				ArrowRight: this.split + v,
				Home: 0,
				End: 100
			}[e.key];
			t !== void 0 && (e.preventDefault(), this.setSplit(t));
		};
	}
	static {
		this.styles = [o, e`
    :host { display: none; }
    :host([notice]) { display: block; }
  `];
	}
	onStateChanged(e) {
		this.evaluate(e);
	}
	onMapAttached(e) {
		this.attachCameraSync(e);
	}
	onMapDetached() {
		this.teardown();
	}
	disconnectedCallback() {
		super.disconnectedCallback(), this.teardown();
	}
	render() {
		return this.notice.render();
	}
	updated() {
		this.toggleAttribute("notice", this.notice.text !== null);
	}
	attachCameraSync(e) {
		let t = () => {
			this.mirror && a(e, this.mirror.adapter);
		};
		e.events.on("view-change", t), e.events.on("view-change-end", t), this.cameraUnsubscribe = () => {
			e.events.off("view-change", t), e.events.off("view-change-end", t);
		};
	}
	async evaluate(e) {
		let t = this.adapter, n = this.mapHost;
		if (!t || !n) return;
		let r = {
			mapLayers: e.mapLayers,
			projection: e.mapProjection,
			terrain: e.terrainEnabled
		}, i = this.syncedFrom;
		if (this.mirror && i && i.mapLayers === r.mapLayers && i.projection === r.projection && i.terrain === r.terrain) return;
		let o = e.mapLayers ?? {};
		this.notice.set(T(o));
		let { topId: s, secondId: c } = w(o);
		if (this.topId = s, !s || !c) {
			this.teardownOverlay(), this.active = !1;
			return;
		}
		let l = new Set(Object.keys(o)), u = !C(l, this.knownLayerIds);
		if (!this.mirror || u) {
			if (this.rebuildInFlight) return;
			this.rebuildInFlight = !0, this.knownLayerIds = l;
			try {
				await this.rebuildMirror(n, t);
			} finally {
				this.rebuildInFlight = !1;
			}
			let r = this.adapter?.store.getState();
			if (r && r.mapLayers !== e.mapLayers) {
				this.evaluate(r);
				return;
			}
			if (!this.mirror) return;
		}
		m(t, this.mirror.adapter, s), g(t, this.mirror.adapter), a(t, this.mirror.adapter), this.syncedFrom = r, this.topLabel = E(s, o), this.secondLabel = E(c, o), this.ensureHandle(n), this.updateLabelText(), this.active = !0;
	}
	async rebuildMirror(e, t) {
		this.mirror?.destroy(), this.mirror = null, this.syncedFrom = null;
		let n = this.mirrorGeneration, r = await u(e, t);
		if (n !== this.mirrorGeneration) {
			r?.destroy();
			return;
		}
		this.mirror = r, this.mirror && (this.applyClip(), this.handleEl && e.insertBefore(this.handleEl, e.querySelector(":scope > webmapx-layout")));
	}
	teardownOverlay() {
		this.mirrorGeneration += 1, this.syncedFrom = null, this.mirror?.destroy(), this.mirror = null, this.handleEl?.remove(), this.handleEl = null, this.knownLayerIds = /* @__PURE__ */ new Set();
	}
	teardown() {
		this.notice.set(null), this.cameraUnsubscribe?.(), this.cameraUnsubscribe = null, this.teardownOverlay();
	}
	applyClip() {
		let e = this.mirror?.element;
		e && (e.style.clipPath = `inset(0 0 0 ${this.split}%)`);
	}
	ensureHandle(e) {
		if (this.handleEl) {
			this.positionHandle();
			return;
		}
		let t = document.createElement("div");
		t.className = "webmapx-mega-compare-handle", t.setAttribute("role", "separator"), t.setAttribute("tabindex", "0"), t.setAttribute("aria-orientation", "vertical"), t.setAttribute("aria-label", "Compare split position"), t.setAttribute("aria-valuemin", "0"), t.setAttribute("aria-valuemax", "100");
		let n = window.matchMedia?.("(any-pointer: coarse)").matches ?? !1 ? y : b;
		t.style.cssText = [
			"position:absolute",
			"top:0",
			"bottom:0",
			`width:${n}px`,
			"transform:translateX(-50%)",
			"background:transparent",
			"cursor:ew-resize",
			"touch-action:none"
		].join(";"), t.appendChild(this.seamLine()), t.appendChild(this.labelChip("start")), t.appendChild(this.thumb()), t.appendChild(this.labelChip("end")), t.addEventListener("pointerdown", this.onPointerDown), t.addEventListener("pointermove", this.onPointerMove), t.addEventListener("pointerup", this.onPointerUp), t.addEventListener("pointercancel", this.onPointerUp), t.addEventListener("keydown", this.onHandleKeyDown), e.insertBefore(t, e.querySelector(":scope > webmapx-layout")), this.handleEl = t, this.positionHandle();
	}
	seamLine() {
		let e = document.createElement("div");
		return e.style.cssText = [
			"position:absolute",
			"top:0",
			"bottom:0",
			"left:50%",
			"width:var(--webmapx-mega-compare-seam-width, 6px)",
			"transform:translateX(-50%)",
			"pointer-events:none",
			"background:var(--sl-color-primary-600, var(--color-primary, #2b6c8f))"
		].join(";"), e;
	}
	thumb() {
		let e = "var(--webmapx-mega-compare-thumb-size, 60px)", t = document.createElement("div");
		t.className = "webmapx-mega-compare-thumb", t.style.cssText = [
			"position:absolute",
			"left:50%",
			"bottom:var(--webmapx-mega-compare-handle-bottom, 100px)",
			`width:${e}`,
			`height:${e}`,
			"transform:translate(-50%, 50%)",
			"border-radius:50%",
			"border:4px solid var(--color-background, #fff)",
			"background-color:var(--sl-color-primary-700, var(--color-primary, #2b6c8f))",
			"box-shadow:0 2px 8px rgb(0 0 0 / 0.35)",
			"display:flex",
			"align-items:center",
			"justify-content:center",
			"color:var(--color-background, #fff)",
			"pointer-events:none",
			"user-select:none"
		].join(";"), t.innerHTML = "<svg viewBox=\"0 0 32 20\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><line x1=\"4\" y1=\"10\" x2=\"28\" y2=\"10\"/><polyline points=\"10 3 4 10 10 17\"/><polyline points=\"22 3 28 10 22 17\"/></svg>";
		let n = t.querySelector("svg");
		return n.style.cssText = "width:auto;height:var(--webmapx-mega-compare-thumb-icon-size, 26px);display:block;", t;
	}
	labelChip(e) {
		let t = document.createElement("span");
		t.dataset.megaCompareLabel = e;
		let n = e === "start" ? "right:calc(50% + 44px)" : "left:calc(50% + 44px)";
		return t.style.cssText = [
			"position:absolute",
			"bottom:var(--webmapx-mega-compare-handle-bottom, 100px)",
			"transform:translateY(50%)",
			n,
			"white-space:nowrap",
			"padding:4px 10px",
			"border-radius:var(--webmapx-radius-sm, 4px)",
			"background:var(--color-surface, #fff)",
			"font-size:var(--webmapx-font-size-md, 0.875rem)",
			"font-weight:600",
			"color:var(--color-text-primary, #16202a)",
			"pointer-events:none"
		].join(";"), t;
	}
	updateLabelText() {
		let e = this.handleEl?.querySelector("[data-mega-compare-label=\"start\"]"), t = this.handleEl?.querySelector("[data-mega-compare-label=\"end\"]");
		e && (e.textContent = this.topLabel), t && (t.textContent = this.secondLabel);
	}
	positionHandle() {
		this.handleEl && (this.handleEl.style.left = `${this.split}%`, this.handleEl.setAttribute("aria-valuenow", String(Math.round(this.split))));
	}
	setSplit(e) {
		this.split = S(e), this.applyClip(), this.positionHandle();
	}
	splitFromClientX(e) {
		let t = this.mapHost;
		if (!t) return this.split;
		let n = t.getBoundingClientRect();
		return n.width === 0 ? this.split : (e - n.left) / n.width * 100;
	}
};
r([t()], x.prototype, "active", void 0), r([t()], x.prototype, "topLabel", void 0), r([t()], x.prototype, "secondLabel", void 0), x = r([n("webmapx-mega-compare")], x);
function S(e) {
	return Number.isFinite(e) ? Math.min(100, Math.max(0, e)) : _;
}
function C(e, t) {
	if (e.size !== t.size) return !1;
	for (let n of e) if (!t.has(n)) return !1;
	return !0;
}
function w(e) {
	let t = [...Object.keys(e)].reverse().filter((t) => {
		let n = e[t];
		return n?.hideFromLegend !== !0 && n?.visible !== !1;
	});
	return {
		topId: t[0] ?? null,
		secondId: t[1] ?? null
	};
}
function T(e) {
	let t = Object.keys(e).filter((t) => e[t]?.hideFromLegend !== !0);
	return t.length === 0 ? "Mega compare: there are no layers to compare. Add two layers to the map." : t.length === 1 ? `Mega compare: "${E(t[0], e)}" is the only layer. Add a second one to compare it with.` : null;
}
function E(e, t) {
	if (!e) return "";
	let n = t[e]?.label;
	return typeof n == "string" && n.length > 0 ? n : e;
}
//#endregion
export { x as WebmapxMegaCompare };
