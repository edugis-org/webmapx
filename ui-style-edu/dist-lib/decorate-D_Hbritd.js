import { l as e } from "./appearance-DVUQGZTG.js";
import { a as t, r as n } from "./map-clock-BmIiPfc8.js";
import { n as r } from "./geojson-loader-BUzpNOID.js";
import { t as i } from "./toast-ChvSasml.js";
//#region src/map/adapter-registry.ts
var a = /* @__PURE__ */ new Map(), o = "maplibre";
function s(e, t) {
	if (!e || typeof e != "string") {
		console.error("[adapter-registry] Adapter name must be a non-empty string.");
		return;
	}
	a.set(e.toLowerCase(), t);
}
function c() {
	return Array.from(a.keys());
}
async function l(e) {
	let t = (e ?? "maplibre").toLowerCase(), n = a.get(t);
	if (!n) return console.error(`[adapter-registry] No adapter registered under "${t}".`), null;
	try {
		return await n();
	} catch (e) {
		return console.error(`[adapter-registry] Failed to create adapter "${t}".`, e), null;
	}
}
s(o, async () => {
	let { MapLibreAdapter: e } = await import("./maplibre-adapter-CUFkmQ-F.js");
	return new e();
}), s("openlayers", async () => {
	let { OpenLayersAdapter: e } = await import("./openlayers-adapter-X9R-Ivtm.js");
	return new e();
}), s("ol", async () => {
	let { OpenLayersAdapter: e } = await import("./openlayers-adapter-X9R-Ivtm.js");
	return new e();
}), s("leaflet", async () => {
	let { LeafletAdapter: e } = await import("./leaflet-adapter-VGThvF6r.js");
	return new e();
}), s("l", async () => {
	let { LeafletAdapter: e } = await import("./leaflet-adapter-VGThvF6r.js");
	return new e();
}), s("cesium", async () => {
	let { createCesiumAdapter: e } = await import("./cesium-adapter-Di31aLp1.js");
	return await e();
}), s("c", async () => {
	let { createCesiumAdapter: e } = await import("./cesium-adapter-Di31aLp1.js");
	return await e();
});
//#endregion
//#region src/config/adapter-resolution.ts
function u(e) {
	if (!e) return null;
	switch (e.toLowerCase()) {
		case "ol": return "openlayers";
		case "l": return "leaflet";
		case "c": return "cesium";
		default: return e.toLowerCase();
	}
}
function d(e, t, n) {
	return e ? `webmapx-${t}:${n}:${e}` : null;
}
function f({ explicitAdapter: e, savedAdapter: t, configuredAdapter: n, defaultAdapter: r = "maplibre" }) {
	return u(t) ?? u(e) ?? u(n) ?? u(r) ?? "maplibre";
}
//#endregion
//#region src/map/map-state-persistence.ts
var p = "webmapx-state";
function m(e, t) {
	return `${p}:${t}:${e}`;
}
function h(e, t, n) {
	try {
		sessionStorage.setItem(m(e, t), JSON.stringify(n));
	} catch {}
}
function g(e, t) {
	let n = sessionStorage.getItem(m(e, t));
	if (!n) return null;
	try {
		return JSON.parse(n);
	} catch {
		return null;
	}
}
function _(e, t) {
	let n = g(e, t);
	return n && sessionStorage.removeItem(m(e, t)), n;
}
var v = "config";
function y(e) {
	return e === 0 ? "s" : `s.${e}`;
}
function b(e) {
	return e === 0 ? v : `${v}.${e}`;
}
function x(e) {
	let t = new URLSearchParams(window.location.search), n = t.get(`${v}.${e}`);
	return n === null ? e === 0 ? t.get(v) : null : n;
}
function S(e) {
	let t = Array.from(document.querySelectorAll("webmapx-map")).indexOf(e);
	return t >= 0 ? t : 0;
}
function C(e) {
	return btoa(JSON.stringify(e));
}
function w(e) {
	try {
		let t = JSON.parse(atob(e));
		return !t || typeof t != "object" || !Array.isArray(t.l) || !Array.isArray(t.v) || t.v.length !== 5 ? null : t;
	} catch {
		return null;
	}
}
function T(e) {
	let t = new URLSearchParams(window.location.search), n = t.get(`s.${e}`) ?? (e === 0 ? t.get("s") : null);
	return n ? w(n) : null;
}
function E() {
	let e = new URLSearchParams(window.location.search).get("cmp");
	if (e === null) return null;
	let t = Number(e);
	return Number.isFinite(t) ? Math.min(100, Math.max(0, t)) : null;
}
function D(e) {
	let { layerIds: t, hiddenLayerIds: n, viewport: r, transparencyOverrides: i, projection: a, terrainEnabled: o, time: s, tools: c } = e, l = {};
	for (let [e, t] of i) t !== 0 && (l[e] = t);
	let u = {
		l: t,
		v: [
			Math.round(r.center[0] * 1e6) / 1e6,
			Math.round(r.center[1] * 1e6) / 1e6,
			Math.round(r.zoom * 100) / 100,
			Math.round(r.bearing * 10) / 10,
			Math.round(r.pitch * 10) / 10
		]
	};
	return n.length > 0 && (u.h = n), Object.keys(l).length > 0 && (u.t = l), a && a !== "mercator" && (u.p = a), o && (u.terrain = !0), typeof s?.at == "number" && Number.isFinite(s.at) && (u.tm = Math.round(s.at / 1e3), typeof s.play == "number" && s.play > 0 && (u.tp = s.play / 1e3)), c && Object.keys(c).length > 0 && (u.x = c), u;
}
function O(e, t, n, r, i, a, o, s, c, l, u) {
	let d = D({
		layerIds: t,
		hiddenLayerIds: n,
		viewport: r,
		transparencyOverrides: i,
		projection: a,
		terrainEnabled: s,
		time: c,
		tools: u
	}), f = new URL(window.location.href), p = y(e);
	if (f.searchParams.set(p, C(d)), e === 0 && f.searchParams.delete("s.0"), o) {
		let t = b(e);
		f.searchParams.set(t, o), e === 0 && f.searchParams.delete(`${v}.0`);
	}
	return l ? (f.searchParams.set(y(1), C(l.state)), f.searchParams.set("cmp", String(Math.round(l.split)))) : (f.searchParams.delete(y(1)), f.searchParams.delete("cmp")), f.toString();
}
//#endregion
//#region src/tools/tool-manager.ts
var k = class extends EventTarget {
	constructor(...e) {
		super(...e), this.tools = /* @__PURE__ */ new Map(), this._activeToolId = null, this.store = null;
	}
	setStore(e) {
		this.store = e;
	}
	register(e) {
		this.tools.set(e.instanceId, e);
	}
	unregister(e) {
		this._activeToolId === e && this.deactivate(), this.tools.delete(e);
	}
	activate(e) {
		let t = this.tools.get(e);
		if (!t) return console.warn(`Tool "${e}" not found`), !1;
		if (this._activeToolId === e) return !0;
		let n = this._activeToolId, r = n ? this.tools.get(n) ?? null : null;
		return r && n !== e && t.isModal && (this._activeToolId = null, r.active = !1, this.updateStoreActiveTool(null), this.dispatchDeactivatedEvent(n, r)), this._activeToolId = e, t.active = !0, this.updateStoreActiveTool(e, t), this.dispatchActivatedEvent(e, t), !0;
	}
	deactivate(e) {
		let t = e ?? this._activeToolId;
		if (!t) return;
		let n = this.tools.get(t);
		n && this._activeToolId === t && (this._activeToolId = null, n.active = !1, this.updateStoreActiveTool(null), this.dispatchDeactivatedEvent(t, n));
	}
	toggle(e) {
		return this._activeToolId === e ? (this.deactivate(e), !1) : this.activate(e);
	}
	get activeTool() {
		return this._activeToolId ? this.tools.get(this._activeToolId) ?? null : null;
	}
	get activeToolId() {
		return this._activeToolId;
	}
	getTool(e) {
		return this.tools.get(e);
	}
	getToolIds() {
		return Array.from(this.tools.keys());
	}
	updateStoreActiveTool(e, t) {
		this.store && this.store.dispatch({ activeTool: e ? {
			toolId: e,
			...t?.label ? { label: t.label } : {},
			...t?.icon ? { icon: t.icon } : {}
		} : null }, "UI");
	}
	dispatchActivatedEvent(e, t) {
		this.dispatchEvent(new CustomEvent("webmapx-tool-activated", { detail: {
			toolId: e,
			tool: t
		} }));
	}
	dispatchDeactivatedEvent(e, t) {
		this.dispatchEvent(new CustomEvent("webmapx-tool-deactivated", { detail: {
			toolId: e,
			tool: t
		} }));
	}
};
//#endregion
//#region src/components/internal/single-group-policy.ts
function A(e, t, n, r, i, a) {
	let o = r?.[t];
	(o?.legendRole === "background" || o?.legendRole === "overlay") && a.set(e, o.legendRole);
	let s = n.indexOf(t);
	if (s < 0) return;
	let c = n[s + 1], l = n[s - 1];
	if (typeof c == "string" && c.length > 0) {
		i.set(e, { beforeLayerId: c });
		return;
	}
	if (typeof l == "string" && l.length > 0) {
		i.set(e, { afterLayerId: l });
		return;
	}
	i.delete(e);
}
function j(e, t, n, r) {
	let i = r.get(e);
	if (!i) return n;
	let a = new Set(t), o = typeof i.beforeLayerId == "string" && a.has(i.beforeLayerId) ? i.beforeLayerId : void 0, s = typeof i.afterLayerId == "string" && a.has(i.afterLayerId) ? i.afterLayerId : void 0;
	if (!o && !s) return r.delete(e), n;
	let c = {
		...o ? { beforeLayerId: o } : {},
		...s ? { afterLayerId: s } : {},
		...n?.beforeLayerId ? { beforeLayerId: n.beforeLayerId } : {},
		...n?.afterLayerId ? { afterLayerId: n.afterLayerId } : {}
	};
	return Object.keys(c).length > 0 ? c : void 0;
}
//#endregion
//#region src/components/internal/legend-role-policy.ts
function M(e, t, n, r, i, a) {
	if (t?.legendRole === "background" || t?.legendRole === "overlay") return t.legendRole;
	if (n) {
		let e = r.get(n);
		if (e === "background" || e === "overlay") return e;
	}
	if (!i) return "overlay";
	if (e === i) return "background";
	let o = a.get(i), s = n ?? a.get(e);
	return o && s && o === s ? "background" : "overlay";
}
//#endregion
//#region src/map/layer-source-resolver.ts
function N(e, t) {
	if (!t || t.length === 0) return e;
	let n = new Map(t.map((e) => [e.id, e])), r = /* @__PURE__ */ new Set();
	if (typeof e.source == "string" && r.add(e.source), Array.isArray(e.layers)) for (let t of e.layers) typeof t?.source == "string" && r.add(t.source);
	if (r.size === 0) return e;
	let i = e.sources ?? {}, a = {};
	for (let e of r) {
		if (i[e]) continue;
		let t = n.get(e);
		t && (a[e] = { ...t });
	}
	return Object.keys(a).length === 0 ? e : {
		...e,
		sources: {
			...i,
			...a
		}
	};
}
//#endregion
//#region src/utils/layer-definition.ts
function P(e) {
	return !!e && typeof e == "object" && !Array.isArray(e);
}
function F(e) {
	return e === void 0 ? e : JSON.parse(JSON.stringify(e));
}
function I(e, t, n) {
	if (!t && !n) return null;
	let r = t ?? {}, i = n ? F(n) : {
		id: e,
		type: r.layerType ?? "fill",
		...r.sourceId ? { source: r.sourceId } : {},
		...r.sourceLayer ? { "source-layer": r.sourceLayer } : {}
	};
	if (i.id === void 0 && (i.id = e), Array.isArray(r.sublayers) && r.sublayers.length > 0 ? i.layers = F(r.sublayers) : (P(r.paint) && (i.paint = F(r.paint)), P(r.layout) && (i.layout = F(r.layout))), typeof r.minzoom == "number" && (i.minzoom = r.minzoom), typeof r.maxzoom == "number" && (i.maxzoom = r.maxzoom), typeof r.label == "string" && r.label.length > 0) {
		let e = P(i.metadata) ? { ...i.metadata } : {};
		e.title = r.label, i.metadata = e;
	}
	return {
		layer: i,
		...typeof r.visible == "boolean" ? { visible: r.visible } : {},
		...typeof r.transparency == "number" ? { transparency: r.transparency } : {}
	};
}
//#endregion
//#region src/components/internal/map-accessibility.ts
var L = 100, R = "data-webmapx-a11y", z = "a, button, input, select, textarea, [role=\"button\"], [role=\"link\"]";
function B(e) {
	return e.getAttribute(R) !== "focus" && e.tabIndex >= 0 && e.hasAttribute("tabindex") ? !0 : Array.from(e.querySelectorAll("[tabindex]")).some((e) => e.tabIndex >= 0 && !e.closest("[inert]") && !e.matches(z));
}
function V(e, t, n) {
	let r = e, i = (n) => {
		if (n.target !== e || n.altKey || n.ctrlKey || n.metaKey || t.getNavigationCapabilities().keyboard) return;
		let r = n.shiftKey ? L * 3 : L, i = 0, a = 0;
		switch (n.key) {
			case "ArrowLeft":
				i = -r;
				break;
			case "ArrowRight":
				i = r;
				break;
			case "ArrowUp":
				a = -r;
				break;
			case "ArrowDown":
				a = r;
				break;
			case "+":
			case "=":
				t.setZoom(t.getZoom() + 1), n.preventDefault();
				return;
			case "-":
			case "_":
				t.setZoom(t.getZoom() - 1), n.preventDefault();
				return;
			default: return;
		}
		let { center: o, zoom: s } = t.getViewportState(), [c, l] = t.project(o), u = t.unproject([c + i, l + a]);
		u && t.setViewport(u, s), n.preventDefault();
	}, a = () => {
		let t = e.querySelector("[role=\"region\"]"), i = t && !t.closest("[inert]") ? t : e;
		i !== r && r === e && (e.removeAttribute("role"), e.removeAttribute("aria-label"), e.removeAttribute("aria-busy")), r = i, r === e && e.setAttribute("role", "region"), r.setAttribute("aria-label", n());
		let a = e.getAttribute(R) === "focus";
		B(e) ? a && (e.removeAttribute("tabindex"), e.removeAttribute(R)) : a || (e.tabIndex = 0, e.setAttribute(R, "focus"));
	}, o = t.store.subscribe((e) => {
		e.mapBusy ? r.setAttribute("aria-busy", "true") : r.removeAttribute("aria-busy");
	});
	return e.addEventListener("keydown", i), a(), {
		refresh: a,
		dispose() {
			o(), e.removeEventListener("keydown", i), e.getAttribute(R) === "focus" && (e.removeAttribute("tabindex"), e.removeAttribute(R));
		}
	};
}
//#endregion
//#region src/components/webmapx-map.ts
var H = "map-view", U = "webmapx-map__surface", W = "adapter", G = class extends HTMLElement {
	constructor(...e) {
		super(...e), this.initialStateLayersApplied = !1, this.activeAdapterName = null, this.runtimeStyleLayerCounter = 0, this.styleLayerCache = /* @__PURE__ */ new Map(), this.singleGroupInsertSlotByGroup = /* @__PURE__ */ new Map(), this.singleGroupLegendRoleByGroup = /* @__PURE__ */ new Map(), this.logicalLayerOrder = [], this.logicalLayerRole = /* @__PURE__ */ new Map(), this.dynamicLayerRequests = /* @__PURE__ */ new Map(), this.handleFileDragOver = (e) => {
			e.dataTransfer?.types.includes("Files") && (e.preventDefault(), e.dataTransfer.dropEffect = "copy");
		}, this.handleFileDrop = (e) => {
			let t = e.dataTransfer?.files;
			!t || t.length === 0 || (e.preventDefault(), this.handleDroppedFiles(Array.from(t)));
		}, this.currentSurface = null, this.mapAccessibility = null, this.adapterInstance = null, this.adapterPromise = null, this.configInstance = null, this.initialLayersPromise = null, this.toolManagerInstance = null;
	}
	connectedCallback() {
		this.upsertAndStyleSurface(), this.observeSurfaceChanges(), this.addEventListener("add-layer", this.handleLayerAddRequest), this.addEventListener("webmapx-add-layer", this.handleAddLayerEvent), this.addEventListener("webmapx-remove-layer", this.handleRemoveLayerEvent), this.addEventListener("webmapx-add-source", this.handleAddSourceEvent), this.addEventListener("webmapx-remove-source", this.handleRemoveSourceEvent), this.addEventListener("webmapx-set-source-data", this.handleSetSourceDataEvent), this.addEventListener("webmapx-suppress-busy-for-source", this.handleSuppressBusyForSource), this.addEventListener("webmapx-unsuppress-busy-for-source", this.handleUnsuppressBusyForSource), this.addEventListener("dragover", this.handleFileDragOver), this.addEventListener("drop", this.handleFileDrop);
	}
	disconnectedCallback() {
		this.surfaceObserver?.disconnect(), this.mapAccessibility?.dispose(), this.mapAccessibility = null, this.removeEventListener("add-layer", this.handleLayerAddRequest), this.removeEventListener("webmapx-add-layer", this.handleAddLayerEvent), this.removeEventListener("webmapx-remove-layer", this.handleRemoveLayerEvent), this.removeEventListener("webmapx-add-source", this.handleAddSourceEvent), this.removeEventListener("webmapx-remove-source", this.handleRemoveSourceEvent), this.removeEventListener("webmapx-set-source-data", this.handleSetSourceDataEvent), this.removeEventListener("webmapx-suppress-busy-for-source", this.handleSuppressBusyForSource), this.removeEventListener("webmapx-unsuppress-busy-for-source", this.handleUnsuppressBusyForSource), this.removeEventListener("dragover", this.handleFileDragOver), this.removeEventListener("drop", this.handleFileDrop);
	}
	async handleDroppedFiles(e) {
		await this.addFilesAsLayers(e);
	}
	async addFilesAsLayers(e) {
		this.adapter?.store.dispatch({ mapBusy: !0 }, "UI");
		try {
			await this.processDroppedFiles(e);
		} finally {
			this.adapter?.store.dispatch({ mapBusy: !1 }, "UI");
		}
	}
	async tryHandleDroppedConfig(e) {
		if (e.length !== 1) return !1;
		let t = e[0], { sniffFile: n } = await import("./file-sniff-BKm0oN5-.js");
		if ((await n(t)).kind !== "webmapx-config") return !1;
		let { storeDroppedConfig: r } = await import("./dropped-config-C_GyVa8o.js");
		return await r(await t.text()), window.location.reload(), !0;
	}
	async processDroppedFiles(e) {
		if (await this.tryHandleDroppedConfig(e)) return;
		let { sniffBlob: t } = await import("./file-sniff-BKm0oN5-.js"), { groupDroppedFiles: n, buildLayerConfigsFromGroup: r } = await import("./dropped-layer-builder-Cv-pUTOs.js"), a = async (e, t) => {
			let { showLayerPickerDialog: n } = await import("./layer-picker-dialog-D6mHiYHp.js");
			return n(e, t);
		}, o = (e, t, n, r) => {
			let i = [`${r}${e} (${(t / 1024).toFixed(1)} KB): ${n.description}`];
			for (let e of n.children ?? []) i.push(...o(e.path, e.size, e.result, r + "  "));
			return i;
		}, s = await n(e), c = [];
		for (let e of s) {
			let n = await r(e, a);
			if (n.length > 0) {
				for (let e of n) {
					if (this.adapter?.hasLayer(e.id)) {
						let t = e.id, n = 1;
						for (; this.adapter.hasLayer(`${t}_${n}`);) n++;
						let r = `${t}_${n}`, i = `${t}:`, a = `${r}:`;
						e.id = r, e.sources = Object.fromEntries(Object.entries(e.sources ?? {}).map(([e, t]) => [e.startsWith(i) ? a + e.slice(i.length) : e, t])), e.layers = (e.layers ?? []).map((e) => ({
							...e,
							id: e.id?.startsWith(i) ? a + e.id.slice(i.length) : e.id,
							source: e.source?.startsWith(i) ? a + e.source.slice(i.length) : e.source
						}));
					}
					Object.keys(e.sources ?? {}).length > 0 && await this.addLayerRequest(e);
				}
				continue;
			}
			for (let n of e) {
				let e = await t(n.blob);
				c.push(...o(n.name, n.blob.size, e, ""));
			}
		}
		c.length > 0 && i(c.join("<br>"), {
			variant: "warning",
			duration: 16e3
		});
	}
	async handleAddLayerEvent(e) {
		let t = e.detail ?? {}, n = {
			...typeof t.beforeLayerId == "string" ? { beforeLayerId: t.beforeLayerId } : {},
			...typeof t.afterLayerId == "string" ? { afterLayerId: t.afterLayerId } : {}
		}, r = this.resolveFallbackFromRequest(t);
		if (!await this.addLayerRequest(t, r, n)) {
			let e = this.resolveCatalogLayerIdFromAddLayerDetail(t);
			this.dispatchEvent(new CustomEvent("webmapx-addlayer-failed", {
				detail: {
					...e ? { layerId: e } : {},
					request: t
				},
				bubbles: !0,
				composed: !0
			}));
		}
	}
	handleRemoveLayerEvent(e) {
		this.removeInlineLayer(e.detail);
	}
	removeInlineLayer(e) {
		this.adapter && (this.dynamicLayerRequests.delete(e), this.adapter.removeLayer(e), this.removeFromLogicalOrder(e), this.logicalLayerRole.delete(e));
	}
	handleAddSourceEvent(e) {
		this.adapter && this.adapter.addSource(e.detail.id, e.detail.config);
	}
	handleRemoveSourceEvent(e) {
		this.adapter && this.adapter.removeSource(e.detail);
	}
	handleSetSourceDataEvent(e) {
		let t = this.adapter?.getSource(e.detail.id);
		t && t.setData(e.detail.data);
	}
	handleSuppressBusyForSource(e) {
		this.adapter && this.adapter.suppressBusySignalForSource(e.detail);
	}
	handleUnsuppressBusyForSource(e) {
		this.adapter && this.adapter.unsuppressBusySignalForSource(e.detail);
	}
	async handleLayerAddRequest(e) {
		let t = this.toRecord(e.detail), n = this.toLayerInformation(t?.layerInformation), r = t?.checked === !0, i = typeof t?.selectionGroup == "string" && t.selectionGroup.length > 0 ? t.selectionGroup : null, a = this.adapter;
		if (a) if (r) {
			let e = typeof n?.layer?.id == "string" ? n.layer.id : null;
			if (!e) return;
			await this.tryAddLayerRequest(a, { layerId: e }, void 0, /* @__PURE__ */ new Set(), i ?? void 0) ? this.dynamicLayerRequests.set(e, { request: { layerId: e } }) : this.dispatchEvent(new CustomEvent("webmapx-addlayer-failed", {
				detail: { layerId: e },
				bubbles: !0,
				composed: !0
			}));
		} else n && (this.dynamicLayerRequests.delete(n.layer.id), this.rememberSingleGroupInsertSlot(a, n.layer.id, i ?? void 0), this.removeFromLogicalOrder(n.layer.id), this.logicalLayerRole.delete(n.layer.id), a.removeLogicalLayer(n.layer.id));
	}
	upsertAndStyleSurface() {
		let e = this.ensureMapViewElement();
		this.decorateMapSurface(e), this.currentSurface = e;
	}
	ensureMapViewElement() {
		let e = this.mapElement;
		if (e) return e;
		let t = document.createElement("div");
		return t.setAttribute("slot", H), t.classList.add("webmapx-map__auto-view"), this.prepend(t), t;
	}
	decorateMapSurface(e) {
		e.classList.add(U), e.style.position || (e.style.position = "absolute"), e.style.top || (e.style.top = "0"), e.style.right || (e.style.right = "0"), e.style.bottom || (e.style.bottom = "0"), e.style.left || (e.style.left = "0"), e.style.width || (e.style.width = "100%"), e.style.height || (e.style.height = "100%"), e.style.background || e.style.setProperty("background", "var(--color-background-secondary, #f4f6f8)");
	}
	observeSurfaceChanges() {
		this.surfaceObserver || (this.surfaceObserver = new MutationObserver(() => {
			let e = this.mapElement;
			if (!e) {
				this.upsertAndStyleSurface();
				return;
			}
			e !== this.currentSurface && (this.decorateMapSurface(e), this.currentSurface = e);
		}), this.surfaceObserver.observe(this, { childList: !0 }));
	}
	get adapter() {
		return this.ensureAdapter(), this.adapterInstance;
	}
	getAdapterAsync() {
		return this.ensureAdapter(), this.adapterPromise ?? Promise.resolve(this.adapterInstance);
	}
	get mapElement() {
		return this.querySelector(`[slot="${H}"]`);
	}
	get config() {
		return this.configInstance;
	}
	get runtimeLayerRequests() {
		return [...this.dynamicLayerRequests.values()];
	}
	async whenLayersReady() {
		await this.getAdapterAsync(), await this.initialLayersPromise;
	}
	get mapConfig() {
		return this.configInstance?.map;
	}
	get layerDataConfig() {
		return this.configInstance?.layerData ?? this.configInstance?.catalog;
	}
	get catalogConfig() {
		return this.configInstance?.catalog;
	}
	getLayerDefinition(e) {
		let t = this.adapterInstance?.store.getState().mapLayers?.[e];
		return I(e, t, this.findConfiguredLayer(e));
	}
	findConfiguredLayer(e) {
		let t = this.layerDataConfig?.layers;
		if (Array.isArray(t)) {
			let n = t.find((t) => t?.id === e);
			if (n) return n;
		} else if (t && typeof t == "object") {
			let n = t[e];
			if (n && typeof n == "object") return n;
		}
		for (let { request: t } of this.runtimeLayerRequests) {
			if (t?.id === e) return t;
			let n = t?.layer;
			if (n?.id === e) return n;
		}
	}
	get toolsConfig() {
		return this.configInstance?.tools;
	}
	async addLayerRequest(e, t, n) {
		let r = this.adapter;
		if (!r) return !1;
		let i = new Set(Object.keys(r.store.getState().mapLayers ?? {})), a = /* @__PURE__ */ new Set();
		if (await this.tryAddLayerRequest(r, e, n, a)) {
			let a = r.store.getState().mapLayers ?? {}, o = this.resolveRequestLayerId(e);
			if (o && a[o]) return this.dynamicLayerRequests.set(o, {
				request: e,
				fallback: t,
				options: n
			}), !0;
			for (let r of Object.keys(a)) i.has(r) || this.dynamicLayerRequests.set(r, {
				request: e,
				fallback: t,
				options: n
			});
			return !0;
		}
		return t ? typeof t == "string" ? this.tryAddLayerRequest(r, { layerId: t }, n, a) : this.tryAddLayerRequest(r, t, n, a) : !1;
	}
	resolveRequestLayerId(e) {
		let t = e;
		return typeof t.id == "string" && t.id.length > 0 ? t.id : typeof t.layerId == "string" && t.layerId.length > 0 ? t.layerId : null;
	}
	get toolManager() {
		return this.toolManagerInstance || (this.toolManagerInstance = new k(), this.adapterInstance?.store && this.toolManagerInstance.setStore(this.adapterInstance.store), this.toolManagerInstance.addEventListener("webmapx-tool-activated", (e) => {
			this.dispatchEvent(new CustomEvent("webmapx-tool-activated", {
				detail: e.detail,
				bubbles: !0,
				composed: !0
			}));
		}), this.toolManagerInstance.addEventListener("webmapx-tool-deactivated", (e) => {
			this.dispatchEvent(new CustomEvent("webmapx-tool-deactivated", {
				detail: e.detail,
				bubbles: !0,
				composed: !0
			}));
		})), this.toolManagerInstance;
	}
	setConfig(t) {
		this.configInstance = t, e(t.ui), this.initialStateLayersApplied = !1, this.applyCatalogToAdapter(), this.dispatchEvent(new CustomEvent("webmapx-config-ready", {
			detail: {
				config: t,
				map: this
			},
			bubbles: !0,
			composed: !0
		}));
	}
	getScopedStorageKey(e) {
		return d(this.id, e, `${location.pathname}${location.search}`);
	}
	saveState(e) {
		if (!this.id) return;
		let t = this.adapter?.getViewportState(), n = [...this.dynamicLayerRequests.values()];
		h(this.id, `${location.pathname}${location.search}`, {
			...t ? { viewport: t } : {},
			...n.length > 0 ? { layers: n } : {},
			...e?.projection ? { projection: e.projection } : {}
		});
	}
	setProjection(e) {
		this.adapter && (this.adapter.setProjection(e) || (this.saveState({ projection: e }), window.location.reload()));
	}
	async restoreState() {
		if (!this.id) return;
		let e = _(this.id, `${location.pathname}${location.search}`);
		if (e) for (let t of e.layers ?? []) await this.addLayerRequest(t.request, t.fallback, t.options);
	}
	getSavedAdapterPreference() {
		let e = this.getScopedStorageKey("adapter");
		return e ? localStorage.getItem(e) : null;
	}
	resolveRequestedAdapter() {
		return f({
			explicitAdapter: this.getAttribute(W) ?? this.getAttribute("type"),
			savedAdapter: this.getSavedAdapterPreference(),
			configuredAdapter: this.mapConfig?.type ?? null,
			defaultAdapter: o
		});
	}
	ensureAdapter() {
		if (this.adapterInstance || this.adapterPromise) return;
		let e = this.resolveRequestedAdapter();
		this.adapterPromise = (async () => {
			let t = await l(e);
			return t ? (this.adapterInstance = t, this.activeAdapterName = e, this.toolManagerInstance && t.store && this.toolManagerInstance.setStore(t.store), this.applyCatalogToAdapter(), this.attachMapAccessibility(t), this.dispatchEvent(new CustomEvent("webmapx-map-ready", {
				detail: {
					adapter: this.adapterInstance,
					map: this
				},
				bubbles: !0,
				composed: !0
			})), t) : (console.error(`[webmapx-map] No adapter available for "${e}".`), null);
		})();
	}
	attachMapAccessibility(e) {
		this.mapAccessibility?.dispose();
		let t = this.currentSurface ?? this.ensureMapViewElement();
		if (this.mapAccessibility = V(t, e, () => this.accessibleMapLabel()), e.store.getState().mapLoaded) {
			this.mapAccessibility.refresh();
			return;
		}
		let n = e.store.subscribe((e) => {
			e.mapLoaded && (n(), this.mapAccessibility?.refresh());
		});
	}
	accessibleMapLabel() {
		let e = this.mapConfig?.label?.trim() || "Map";
		return this.getAttribute("data-webmapx-role") === "compare-reference" ? `${e} (before)` : e;
	}
	async applyCatalogToAdapter() {
		let e = this.adapterInstance, t = this.layerDataConfig;
		!e || !t || (t.attributeMetadata && Object.keys(t.attributeMetadata).length > 0 && e.store.dispatch({ attributeMetadata: t.attributeMetadata }, "INIT"), this.initialStateLayersApplied || (this.initialStateLayersApplied = !0, this.initialLayersPromise = this.applyInitialStateLayers(e, t), this.initialLayersPromise));
	}
	collectInitialActiveLayerRefs() {
		let e = T(S(this));
		if (e?.l?.length) return e.l;
		let t = this.configInstance?.state?.activeLayers;
		if (!t) return (this.configInstance?.layerData?.layers ?? []).map((e) => typeof e?.id == "string" ? e.id : null).filter((e) => e !== null);
		let n = [];
		for (let e of t) {
			if (typeof e == "string") {
				n.push(e);
				continue;
			}
			if (!e || typeof e != "object") continue;
			let t = e, r = typeof t.ref == "string" ? t.ref : typeof t.layerId == "string" ? t.layerId : null, i = t.visible !== !1;
			r && i && n.push(r);
		}
		return Array.from(new Set(n));
	}
	getBackgroundSeedLayerId() {
		let e = this.collectInitialActiveLayerRefs();
		return e.length > 0 ? e[0] : null;
	}
	collectSingleSelectionGroupByLayerId() {
		let e = /* @__PURE__ */ new Map(), t = this.layerDataConfig?.layers;
		if (!Array.isArray(t)) return e;
		for (let n of t) {
			let t = this.getLayerMetadata(n), r = (typeof n.singleGroup == "string" ? n.singleGroup : null) ?? (typeof t?.singleSelectionGroupKey == "string" ? t.singleSelectionGroupKey : null) ?? (typeof t?.selectionGroup == "string" ? t.selectionGroup : null) ?? (typeof t?.["webmapx:selectionGroup"] == "string" ? t["webmapx:selectionGroup"] : null);
			r && r.length > 0 && e.set(n.id, r);
		}
		return e;
	}
	getSingleSelectionGroupKeyForLayer(e, t) {
		return typeof t == "string" && t.length > 0 ? t : this.collectSingleSelectionGroupByLayerId().get(e) ?? null;
	}
	insertIntoLogicalOrder(e, t) {
		if (this.logicalLayerOrder = this.logicalLayerOrder.filter((t) => t !== e), t?.beforeLayerId) {
			let n = this.logicalLayerOrder.indexOf(t.beforeLayerId);
			if (n >= 0) {
				this.logicalLayerOrder.splice(n, 0, e);
				return;
			}
		}
		this.logicalLayerOrder.push(e);
	}
	removeFromLogicalOrder(e) {
		this.logicalLayerOrder = this.logicalLayerOrder.filter((t) => t !== e);
	}
	currentLayerOrder() {
		let e = this.adapterInstance?.store.getState().mapLayers;
		return e ? Object.keys(e) : this.logicalLayerOrder;
	}
	computeInsertOptionsForLayer(e, t) {
		if (t?.beforeLayerId || t?.afterLayerId) return t;
		if (e === "background") {
			let e = this.adapterInstance?.store.getState().mapLayers ?? {}, t = this.currentLayerOrder().find((t) => (e[t]?.legendRole ?? this.logicalLayerRole.get(t) ?? "overlay") !== "background");
			return t ? { beforeLayerId: t } : void 0;
		}
	}
	rememberSingleGroupInsertSlot(e, t, n) {
		let r = this.getSingleSelectionGroupKeyForLayer(t, n);
		if (!r) return;
		let i = e.store.getState().mapLayers;
		A(r, t, i ? Object.keys(i) : this.logicalLayerOrder, i, this.singleGroupInsertSlotByGroup, this.singleGroupLegendRoleByGroup);
	}
	resolveSingleGroupInsertionOptions(e, t, n) {
		let r = this.getSingleSelectionGroupKeyForLayer(e, n);
		return r ? j(r, this.currentLayerOrder(), t, this.singleGroupInsertSlotByGroup) : t;
	}
	resolveCatalogLegendRole(e, t, n) {
		return M(e, this.getLayerMetadata(t), this.getSingleSelectionGroupKeyForLayer(e, n) ?? void 0, this.singleGroupLegendRoleByGroup, this.getBackgroundSeedLayerId(), this.collectSingleSelectionGroupByLayerId());
	}
	getConfiguredLayerInformation(e) {
		let t = this.layerDataConfig;
		if (!t) return null;
		let n = t.layers?.find((t) => t.id === e);
		return n ? { layer: n } : null;
	}
	resolveResourceUrl(e, t) {
		try {
			return new URL(e, t).toString().replace(/%7B/gi, "{").replace(/%7D/gi, "}");
		} catch {
			return e;
		}
	}
	resolveStyleBackedSource(e, t, n, r) {
		let i = n.type;
		if (i !== "vector" && i !== "raster" && i !== "geojson") return null;
		if (i === "vector") {
			let e = typeof n.url == "string" ? n.url : null, i = Array.isArray(n.tiles) ? n.tiles.filter((e) => typeof e == "string") : [], a = typeof n.attribution == "string" ? n.attribution : void 0, o = typeof n.minzoom == "number" ? n.minzoom : void 0, s = typeof n.maxzoom == "number" ? n.maxzoom : void 0;
			return !e && i.length === 0 ? null : {
				id: t,
				type: "vector",
				...e ? { url: this.resolveResourceUrl(e, r) } : {},
				...i.length > 0 ? { tiles: i.map((e) => this.resolveResourceUrl(e, r)) } : {},
				...o === void 0 ? {} : { minzoom: o },
				...s === void 0 ? {} : { maxzoom: s },
				...a ? { attribution: a } : {}
			};
		}
		if (i === "raster") {
			let e = Array.isArray(n.tiles) ? n.tiles.filter((e) => typeof e == "string") : [], i = typeof n.attribution == "string" ? n.attribution : void 0;
			return e.length === 0 ? null : {
				id: t,
				type: "raster",
				service: "xyz",
				url: e.map((e) => this.resolveResourceUrl(e, r)),
				tileSize: typeof n.tileSize == "number" ? n.tileSize : void 0,
				minzoom: typeof n.minzoom == "number" ? n.minzoom : void 0,
				maxzoom: typeof n.maxzoom == "number" ? n.maxzoom : void 0,
				...i ? { attribution: i } : {}
			};
		}
		let a = n.data, o = typeof n.attribution == "string" ? n.attribution : void 0;
		return typeof a == "string" ? {
			id: t,
			type: "geojson",
			data: this.resolveResourceUrl(a, r),
			...o ? { attribution: o } : {}
		} : null;
	}
	async expandStyleBackedLayer(e) {
		let t = (e.type === "style" ? e : null)?.url ?? null, n = e.id, r = `style:${n}:`, i = `${n}::${t ?? ""}`;
		if (!t) return null;
		let a = this.styleLayerCache.get(i);
		if (a) return a;
		let o = (async () => {
			try {
				let n = await fetch(t);
				if (!n.ok) return null;
				let i = this.toRecord(await n.json());
				return this.buildExpandedStyleLayer(e, i, t, r);
			} catch {
				return null;
			}
		})();
		return this.styleLayerCache.set(i, o), o.then((e) => {
			!e && this.styleLayerCache.get(i) === o && this.styleLayerCache.delete(i);
		}), o;
	}
	normalizeStyleDocument(e) {
		if (!e || e.sources || e.layers) return e;
		let t = this.toRecord(e.source);
		if (!t) return e;
		if (t.sources || t.layers) return t;
		if (typeof e.type != "string" || typeof t.type != "string") return e;
		let n = typeof e.id == "string" && e.id.length > 0 ? e.id : "source";
		return {
			sources: { [n]: t },
			layers: [{
				...e,
				source: n
			}]
		};
	}
	buildExpandedStyleLayer(e, t, n, r) {
		let i = this.normalizeStyleDocument(t), a = this.toRecord(i?.sources), o = Array.isArray(i?.layers) ? i.layers.map((e) => this.toRecord(e)).filter((e) => !!e) : [];
		if (!a || o.length === 0) return null;
		let s = r ?? `style:${e.id}:`, c = new Set([
			"background",
			"fill",
			"line",
			"circle",
			"symbol",
			"raster",
			"fill-extrusion",
			"hillshade"
		]), l = /* @__PURE__ */ new Map(), u = o.filter((e) => typeof e.type == "string" && c.has(e.type)).map((e) => {
			let t = typeof e.source == "string" ? `${s}${e.source}` : void 0;
			return typeof e.source == "string" && t && l.set(e.source, t), {
				id: typeof e.id == "string" ? `style:${e.id}` : void 0,
				type: e.type,
				source: t,
				"source-layer": e["source-layer"] ?? e.sourceLayer,
				minzoom: e.minzoom ?? e.minZoom,
				maxzoom: e.maxzoom ?? e.maxZoom,
				paint: e.paint,
				layout: e.layout,
				filter: e.filter
			};
		}), d = new Set(u.map((e) => e.source).filter((e) => typeof e == "string" && e.length > 0)), f = {};
		for (let [e, t] of l.entries()) {
			if (!d.has(t)) continue;
			let r = this.toRecord(a[e]);
			if (!r) continue;
			let i = n ? this.resolveStyleBackedSource(e, t, r, n) : this.resolveInlineStyleSource(t, r);
			i && (f[t] = { ...i });
		}
		let p = new Set(Object.keys(f)), m = u.filter((e) => !e.source || p.has(e.source));
		return m.length === 0 ? null : { layer: {
			id: e.id,
			type: "style",
			title: e.title,
			singleGroup: e.singleGroup,
			fallbackLayerId: e.fallbackLayerId,
			minzoom: e.minzoom,
			maxzoom: e.maxzoom,
			metadata: {
				...this.getLayerMetadata(e) ?? {},
				styleUrl: n ?? void 0,
				styleSpriteUrl: typeof t?.sprite == "string" && n ? this.resolveResourceUrl(t.sprite, n) : typeof t?.sprite == "string" ? t.sprite : void 0,
				styleGlyphsUrl: typeof t?.glyphs == "string" && n ? this.resolveResourceUrl(t.glyphs, n) : typeof t?.glyphs == "string" ? t.glyphs : void 0
			},
			sources: f,
			layers: m
		} };
	}
	resolveInlineStyleSource(e, t) {
		let n = t.type;
		if (n !== "vector" && n !== "raster" && n !== "geojson") return null;
		if (n === "vector") {
			let n = typeof t.url == "string" ? t.url : null, r = Array.isArray(t.tiles) ? t.tiles.filter((e) => typeof e == "string") : [];
			return !n && r.length === 0 || !n && r.length === 0 ? null : {
				id: e,
				type: "vector",
				url: n ?? r[0] ?? "",
				...r.length > 0 ? { tiles: r } : {},
				...typeof t.minzoom == "number" ? { minzoom: t.minzoom } : {},
				...typeof t.maxzoom == "number" ? { maxzoom: t.maxzoom } : {},
				...typeof t.attribution == "string" ? { attribution: t.attribution } : {}
			};
		}
		if (n === "raster") {
			let n = Array.isArray(t.tiles) ? t.tiles.filter((e) => typeof e == "string") : [];
			return n.length === 0 ? null : {
				id: e,
				type: "raster",
				service: "xyz",
				url: n,
				...typeof t.tileSize == "number" ? { tileSize: t.tileSize } : {},
				...typeof t.minzoom == "number" ? { minzoom: t.minzoom } : {},
				...typeof t.maxzoom == "number" ? { maxzoom: t.maxzoom } : {},
				...typeof t.attribution == "string" ? { attribution: t.attribution } : {}
			};
		}
		let r = t.data;
		return typeof r == "string" ? {
			id: e,
			type: "geojson",
			data: r,
			...typeof t.attribution == "string" ? { attribution: t.attribution } : {}
		} : null;
	}
	async getLayerInformation(e) {
		let t = this.getConfiguredLayerInformation(e);
		return t ? this.isStyleBackedLayer(t.layer) ? this.expandStyleBackedLayer(t.layer) : t : null;
	}
	resolveCatalogLayerIdFromAddLayerDetail(e) {
		let t = [
			e.catalogLayerId,
			e.layerId,
			e.ref
		];
		for (let e of t) if (typeof e == "string" && this.getConfiguredLayerInformation(e)) return e;
		return null;
	}
	isStyleRequest(e) {
		return !!(this.toRecord(e.style) || typeof e.styleUrl == "string" && e.styleUrl.length > 0);
	}
	resolveStyleUrlFromRequest(e) {
		return typeof e.styleUrl == "string" && e.styleUrl.length > 0 ? e.styleUrl : null;
	}
	resolveFallbackFromRequest(e) {
		let t = this.toRecord(e.fallbackLayer);
		if (t) return t;
		let n = [
			e.fallbackLayerId,
			e.fallbackRef,
			e.fallback
		];
		for (let e of n) if (typeof e == "string" && e.length > 0) return e;
	}
	async tryAddLayerRequest(e, t, n, r = /* @__PURE__ */ new Set(), i) {
		let a = this.resolveCatalogLayerIdFromAddLayerDetail(t);
		if (a) {
			if (r.has(a)) return !1;
			r.add(a);
			let t = this.getConfiguredLayerInformation(a);
			if (!t) return !1;
			let o = this.isStyleBackedLayer(t.layer) ? await this.expandStyleBackedLayer(t.layer) : t, s = o?.layer.metadata?.supportedEngines, c = !!o && (s ? s.includes(this.activeAdapterName) : !this.hasUnsupportedStyleComponents(o));
			if (o && c) {
				let t = this.getSingleSelectionGroupKeyForLayer(a, i);
				if (t) {
					let n = this.collectSingleSelectionGroupByLayerId(), r = Object.keys(e.store.getState().mapLayers ?? {});
					for (let o of r) o !== a && n.get(o) === t && (this.rememberSingleGroupInsertSlot(e, o, i), this.removeFromLogicalOrder(o), this.logicalLayerRole.delete(o), this.dynamicLayerRequests.delete(o), e.removeLogicalLayer(o));
				}
				let r = this.resolveCatalogLegendRole(a, o.layer, t ?? void 0), s = this.resolveSingleGroupInsertionOptions(a, n, i), c = this.computeInsertOptionsForLayer(r, s), l = {
					...o,
					layer: {
						...o.layer,
						metadata: {
							...this.getLayerMetadata(o.layer) ?? {},
							legendRole: r,
							...t ? { singleSelectionGroupKey: t } : {}
						}
					}
				};
				if (await this.addLogicalLayerInternal(e, l, c)) {
					let e = this.getSingleSelectionGroupKeyForLayer(a, i);
					return e && this.singleGroupInsertSlotByGroup.delete(e), !0;
				}
			}
			let l = this.getConfiguredFallbackLayerId(t.layer);
			return l ? this.tryAddLayerRequest(e, { layerId: l }, n, r, i) : !1;
		}
		if (typeof t.layerId == "string" || typeof t.catalogLayerId == "string" || typeof t.ref == "string") return !1;
		if (this.isStyleRequest(t)) {
			let n = await this.getLayerInformationFromStyleRequest(t);
			return !n || this.hasUnsupportedStyleComponents(n) ? !1 : this.addLogicalLayerInternal(e, n);
		}
		let { beforeLayerId: o, afterLayerId: s, fallbackLayer: c, fallbackLayerId: l, fallbackRef: u, fallback: d, ...f } = t;
		return this.addInlineLayerWithTracking(e, f, n);
	}
	async getLayerInformationFromStyleRequest(e) {
		let t = this.toRecord(e.style), n = this.resolveStyleUrlFromRequest(e);
		if (!t && !n) return null;
		let r = this.toRecord(e.metadata) ?? {}, i = typeof e.id == "string" && e.id.length > 0 ? e.id : `runtime-style-${++this.runtimeStyleLayerCounter}`;
		return t ? this.buildExpandedStyleLayer({
			id: i,
			type: "style",
			metadata: {
				...r,
				...n ? { styleUrl: n } : {}
			}
		}, t, n) : this.expandStyleBackedLayer({
			id: i,
			type: "style",
			metadata: {
				...r,
				styleUrl: n ?? void 0
			}
		});
	}
	toRecord(e) {
		return typeof e == "object" && e && !Array.isArray(e) ? e : null;
	}
	getLayerMetadata(e) {
		return this.toRecord(e?.metadata);
	}
	isStyleBackedLayer(e) {
		if (e.type !== "style") return !1;
		let t = e;
		return typeof t.url == "string" && t.url.length > 0;
	}
	getConfiguredFallbackLayerId(e) {
		if (typeof e.fallbackLayerId == "string" && e.fallbackLayerId.length > 0) return e.fallbackLayerId;
		let t = this.getLayerMetadata(e)?.fallbackLayerId;
		return typeof t == "string" && t.length > 0 ? t : null;
	}
	isSourceSupportedByActiveEngine(e) {
		return typeof e?.type == "string" && e.type ? this.adapterInstance?.canDrawSource(e) ?? !1 : !1;
	}
	hasUnsupportedStyleComponents(e) {
		let t = e.layer;
		if (t.type === "allmaps") return !(this.adapterInstance?.canDrawLayerType("allmaps") ?? !1);
		if (t.type === "style") {
			let e = t, n = e.sources ?? {}, r = [];
			for (let e of Object.values(n)) typeof e == "object" && e && typeof e.type == "string" && r.push(e);
			let i = e.layers ?? [];
			for (let e of i) {
				let t = typeof e?.source == "string" ? e.source : null;
				if (!t || t in n) continue;
				let i = this.layerDataConfig?.sources?.find((e) => e.id === t);
				i && typeof i.type == "string" && r.push(i);
			}
			return r.length === 0 ? !1 : r.some((e) => !this.isSourceSupportedByActiveEngine(e));
		}
		let n = t.source;
		if (!n) return !1;
		let r = this.layerDataConfig?.sources?.find((e) => e.id === n) ?? null;
		return r ? !this.isSourceSupportedByActiveEngine(r) : !1;
	}
	isLayerSpecSupported(e) {
		let t = (e?.sources && typeof e.sources == "object" ? Object.values(e.sources) : []).filter((e) => !!e && typeof e == "object" && typeof e.type == "string");
		return t.length === 0 ? !0 : t.every((e) => this.isSourceSupportedByActiveEngine(e));
	}
	async isCatalogLayerSupported(e) {
		let t = this.getConfiguredLayerInformation(e);
		if (!t) return !1;
		let n = t.layer.metadata?.supportedEngines;
		if (n) return n.includes(this.activeAdapterName);
		if (!this.isStyleBackedLayer(t.layer)) return !this.hasUnsupportedStyleComponents(t);
		let r = await this.expandStyleBackedLayer(t.layer);
		return r ? !this.hasUnsupportedStyleComponents(r) : !1;
	}
	async addLogicalLayerInternal(e, i, a) {
		let o = N(i.layer, this.layerDataConfig?.sources), s = [];
		o.sources && typeof o.sources == "object" && (s = await r(o.sources, n(e.store.getState().mapTime), (n) => t(n, e.store.getState().lastClickedCoordinates)));
		let c = o, l = c.metadata && typeof c.metadata == "object" ? c.metadata : void 0;
		if (!l?.bounds && typeof c.source == "string") {
			let e = this.layerDataConfig?.sources?.find((e) => e.id === c.source);
			e?.bounds && (c.metadata = {
				...l ?? {},
				bounds: e.bounds
			});
		}
		let u;
		try {
			u = await e.addLayer(c, a);
		} catch {
			return !1;
		}
		if (u) {
			let t = (c.metadata && typeof c.metadata == "object" ? c.metadata : {}).legendRole === "background" ? "background" : "overlay";
			this.logicalLayerRole.set(c.id, t), this.insertIntoLogicalOrder(c.id, a);
			for (let t of s) t.run((n) => {
				let r = e.getSource(t.id);
				return r ? (r.setData(n), !0) : !1;
			});
		}
		return u;
	}
	async addInlineLayerWithTracking(e, i, a) {
		let o = [];
		i.sources && typeof i.sources == "object" && (o = await r(i.sources, n(e.store.getState().mapTime), (n) => t(n, e.store.getState().lastClickedCoordinates)));
		let s = (i.metadata && typeof i.metadata == "object" ? i.metadata : {}).legendRole === "background" ? "background" : "overlay", c = this.computeInsertOptionsForLayer(s, a);
		await e.addLayer(i, c && Object.keys(c).length > 0 ? c : void 0);
		let l = typeof i.id == "string" ? i.id : null;
		l && (this.logicalLayerRole.set(l, s), this.insertIntoLogicalOrder(l, c));
		for (let t of o) t.run((n) => {
			let r = e.getSource(t.id);
			return r ? (r.setData(n), !0) : !1;
		});
		return !0;
	}
	async applyInitialStateLayers(e, t) {
		this.applyPermalinkTime(e);
		let n = this.collectInitialActiveLayerRefs();
		for (let t of n) await this.tryAddLayerRequest(e, { layerId: t }) || this.dispatchEvent(new CustomEvent("webmapx-addlayer-failed", {
			detail: { layerId: t },
			bubbles: !0,
			composed: !0
		}));
		await this.restoreState(), await this.applyPermalinkState(e), this.applyConfigTerrainState(e);
	}
	applyConfigTerrainState(e) {
		T(S(this)) || this.configInstance?.state?.terrainEnabled === !0 && e.store.dispatch({ terrainEnabled: !0 }, "UI");
	}
	applyPermalinkTime(e) {
		let t = T(S(this));
		typeof t?.tm != "number" || !Number.isFinite(t.tm) || (e.store.dispatch({ mapTime: {
			mode: "pinned",
			at: t.tm * 1e3
		} }, "INIT"), typeof t.tp == "number" && t.tp > 0 && e.store.dispatch({ mapTimePlay: t.tp * 1e3 }, "INIT"));
	}
	async applyPermalinkState(e) {
		let t = T(S(this));
		if (!t) return;
		if (t.h && t.h.length > 0) {
			let n = e.store.getState().mapLayers ?? {};
			for (let r of t.h) n[r] && e.setLayerVisibility(r, !1);
		}
		if (t.t) {
			let n = e.store.getState().mapLayers ?? {};
			for (let [r, i] of Object.entries(t.t)) n[r] && e.setLayerOpacity(r, (100 - i) / 100);
		}
		t.terrain && e.store.dispatch({ terrainEnabled: !0 }, "UI"), t.x && typeof t.x == "object" && e.store.dispatch({ toolRestore: t.x }, "INIT");
		let n = e.store.getState().mapLayers ?? {}, r = t.l.filter((e) => !n[e] && !(t.terrain && e === "webmapx-terrain-hillshade"));
		r.length > 0 && this.showPermalinkMissingLayersToast(r);
	}
	showPermalinkMissingLayersToast(e) {
		let t = e.length;
		i(`<strong>${t} layer${t > 1 ? "s" : ""} from the permalink could not be restored</strong><br>
      Layers may have been imported from files (not stored in permalink) or the map config may have changed:<br>
      <em>${e.join(", ")}</em>`, {
			variant: "warning",
			duration: 16e3
		});
	}
	toLayerInformation(e) {
		let t = this.toRecord(e), n = this.toRecord(t?.layer);
		if (!n) return null;
		let r = typeof n.id == "string" ? n.id : null, i = typeof n.type == "string" ? n.type : null;
		return !r || !i ? null : { layer: n };
	}
	isSubLayerSpec(e) {
		let t = this.toRecord(e);
		return !!t && typeof t.type == "string";
	}
	isSourceConfig(e) {
		let t = this.toRecord(e);
		return !!t && typeof t.id == "string" && typeof t.type == "string";
	}
};
customElements.get("webmapx-map") || customElements.define("webmapx-map", G);
//#endregion
//#region src/components/internal/map-context.ts
function K(e, t) {
	try {
		let n = e.querySelector(t);
		return n instanceof G ? n : null;
	} catch (e) {
		return console.error(`[webmapx] Invalid selector "${t}" provided via map attribute.`, e), null;
	}
}
function q(e) {
	let t = e.getAttribute("map");
	if (t) {
		let n = K(e.ownerDocument ?? document, t);
		return n || console.error(`[webmapx] No <webmapx-map> found for selector "${t}" on ${e.tagName.toLowerCase()}.`), n;
	}
	let n = e.closest("webmapx-map");
	if (n instanceof G) return n;
	let r = (e.ownerDocument ?? document).querySelectorAll("webmapx-map:not([data-webmapx-role])");
	return r.length === 1 && r[0] instanceof G ? r[0] : r.length > 1 ? (console.error(`[webmapx] Multiple <webmapx-map> elements found for ${e.tagName.toLowerCase()}. Set a "map" attribute with an explicit selector.`), null) : (console.error(`[webmapx] Unable to locate a <webmapx-map> for ${e.tagName.toLowerCase()}.`), null);
}
function J(e) {
	let t = q(e);
	return t ? t.adapter : null;
}
//#endregion
//#region \0@oxc-project+runtime@0.133.0/helpers/esm/decorate.js
function Y(e, t, n, r) {
	var i = arguments.length, a = i < 3 ? t : r === null ? r = Object.getOwnPropertyDescriptor(t, n) : r, o;
	if (typeof Reflect == "object" && typeof Reflect.decorate == "function") a = Reflect.decorate(e, t, n, r);
	else for (var s = e.length - 1; s >= 0; s--) (o = e[s]) && (a = (i < 3 ? o(a) : i > 3 ? o(t, n, a) : o(t, n)) || a);
	return i > 3 && a && Object.defineProperty(t, n, a), a;
}
//#endregion
export { E as a, T as c, u as d, f, O as i, D as l, c as m, J as n, x as o, o as p, q as r, S as s, Y as t, d as u };
