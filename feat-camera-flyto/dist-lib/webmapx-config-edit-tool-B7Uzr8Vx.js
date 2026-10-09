import { l as e, r as t } from "./tool-registry-Dj8WNvUg.js";
import { a as n, c as r, h as i, i as a, o, p as s, s as c } from "./decorators-d8E4nZJy.js";
import { r as l, t as u } from "./decorate-D2tFcxUg.js";
import { a as d, i as f, o as p, s as m } from "./directive-helpers-Debt3Tx3.js";
import "./button-DE9ytwxI.js";
import "./checkbox-DigllOlW.js";
import "./icon-Qf3FyAAL.js";
import "./input-eCCT7kEl.js";
import "./icon-button-DxwGf0BN.js";
import "./option-C8qYanYH.js";
import "./dynamic-layout-iEt-2uRn.js";
//#region node_modules/@shoelace-style/shoelace/dist/chunks/chunk.SUSCR7CI.js
var h = i`
  :host {
    --color: var(--sl-panel-border-color);
    --width: var(--sl-panel-border-width);
    --spacing: var(--sl-spacing-medium);
  }

  :host(:not([vertical])) {
    display: block;
    border-top: solid var(--width) var(--color);
    margin: var(--spacing) 0;
  }

  :host([vertical]) {
    display: inline-block;
    height: 100%;
    border-left: solid var(--width) var(--color);
    margin: 0 var(--spacing);
  }
`, g = class extends f {
	constructor() {
		super(...arguments), this.vertical = !1;
	}
	connectedCallback() {
		super.connectedCallback(), this.setAttribute("role", "separator");
	}
	handleVerticalChange() {
		this.setAttribute("aria-orientation", this.vertical ? "vertical" : "horizontal");
	}
};
//#endregion
//#region node_modules/@shoelace-style/shoelace/dist/chunks/chunk.IVVHNXMC.js
g.styles = [d, h], m([n({
	type: Boolean,
	reflect: !0
})], g.prototype, "vertical", 2), m([p("vertical")], g.prototype, "handleVerticalChange", 1), g.define("sl-divider");
//#endregion
//#region src/components/webmapx-config-edit-tool.ts
var _ = new Set([
	"configedit",
	"config-edit",
	"settings"
]), v = new Set([
	"id",
	"type",
	"enabled",
	"items",
	"tree"
]), y = e, b = {
	defaultFormat: [
		"geographic-en",
		"geographic-local",
		"lonlat",
		"latlon"
	],
	position: [
		"top-left",
		"middle-left",
		"bottom-left",
		"top-center",
		"middle-center",
		"bottom-center",
		"top-right",
		"middle-right",
		"bottom-right",
		"edge-bottom-left",
		"edge-bottom-center",
		"edge-bottom-right"
	],
	orientation: ["vertical", "horizontal"],
	"panel-position": ["after", "before"],
	"panel.position": ["after", "before"],
	provider: ["nominatim"],
	direction: [
		"up",
		"down",
		"left",
		"right"
	],
	tooltipPlacement: [
		"right",
		"left",
		"top",
		"bottom"
	],
	alignment: [
		"start",
		"center",
		"end"
	],
	priority: [
		"normal",
		"high",
		"low"
	]
}, x = {
	coordinates: { defaultFormat: "geographic-en" },
	search: { provider: "nominatim" }
}, S = ["mainToolbar", "legendToolbar"], C = {
	mainToolbar: {
		type: "toolbar",
		enabled: !0,
		position: "top-left",
		orientation: "vertical",
		tooltipPlacement: "right",
		panel: {
			enabled: !0,
			position: "after"
		}
	},
	legendToolbar: {
		type: "toolbar",
		enabled: !0,
		position: "top-right",
		orientation: "vertical",
		tooltipPlacement: "left",
		panel: {
			enabled: !0,
			position: "after"
		}
	}
}, w = [
	"position",
	"orientation",
	"tooltipPlacement",
	"alignment",
	"priority"
], T = ["label", "position"];
function E(e) {
	return t.find((t) => t.id === e || t.id === y(e))?.label ?? e;
}
function D(e, t = !1) {
	let n = y(String(e.id ?? e.type ?? "")), r = Array.isArray(e.items) ? e.items.filter((e) => !_.has(y(String(e.id ?? e.type ?? "")))).map((e) => D(e)) : void 0;
	return {
		id: n,
		label: E(n),
		configItem: e,
		subItems: r,
		isNew: t
	};
}
function O(e, t, n) {
	let r = [...e.layerData?.layers ?? []], i = [...e.layerData?.sources ?? []], a = new Set(r.map((e) => e.id)), o = new Set(i.map((e) => e.id));
	for (let e of n) {
		if (a.has(e)) continue;
		let n = t.get(e);
		if (!n) continue;
		let { sources: s, ...c } = n;
		if (r.push(c), a.add(e), s && typeof s == "object") for (let [e, t] of Object.entries(s)) o.has(e) || (i.push({
			...t,
			id: e
		}), o.add(e));
	}
	return {
		layers: r,
		sources: i
	};
}
function k(e, t, n, r, i, a, o, s, c, l, u) {
	let d = { ...e.tools ?? {} };
	for (let n of t) {
		let t = (e.tools ?? {})[n.key]?.items ?? [], r = [];
		for (let e of n.items) {
			let n = t.find((t) => y(String(t.id ?? t.type ?? "")) === e.id), i = n ? {
				...n,
				...e.configItem,
				enabled: !0
			} : {
				...e.configItem,
				enabled: !0
			};
			if (Array.isArray(e.subItems)) {
				let t = n?.items ?? [], r = [];
				for (let n of e.subItems) {
					let e = t.find((e) => y(String(e.id ?? e.type ?? "")) === n.id);
					r.push(e ? {
						...e,
						...n.configItem,
						enabled: !0
					} : {
						...n.configItem,
						enabled: !0
					});
				}
				for (let n of t) {
					let t = y(String(n.id ?? n.type ?? ""));
					e.subItems.find((e) => e.id === t) || r.push({
						...n,
						enabled: !1
					});
				}
				i.items = r;
			}
			r.push(i);
		}
		for (let e of t) {
			let t = y(String(e.id ?? e.type ?? ""));
			if (_.has(t)) {
				r.push({
					...e,
					enabled: !1
				});
				continue;
			}
			n.items.find((e) => e.id === t) || r.push({
				...e,
				enabled: !1
			});
		}
		r.filter((e) => e.enabled !== !1).length === 0 ? delete d[n.key] : d[n.key] = {
			...n.configItem,
			items: r
		};
	}
	for (let t of n) {
		let n = (e.tools ?? {})[t.id];
		(n !== void 0 || t.enabled) && (d[t.id] = {
			...n ?? {},
			...t.configItem,
			enabled: t.enabled
		});
	}
	for (let e of _) d[e] && (d[e] = {
		...d[e],
		enabled: !1
	});
	let f = l ?? /* @__PURE__ */ new Set(), p = f.size > 0 ? (() => {
		let t = (e.layerData?.layers ?? []).filter((e) => !f.has(e.id)), n = new Set(t.map((e) => e.source).filter(Boolean)), r = (e.layerData?.sources ?? []).filter((e) => n.has(e.id));
		return {
			...e.layerData,
			layers: t,
			sources: r
		};
	})() : e.layerData, m = e.project, h = c?.trim() ? {
		...m,
		title: c.trim(),
		id: c.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "") || "config"
	} : m, g = o ? {
		...e.map,
		center: o.center,
		zoom: Math.round(o.zoom * 100) / 100,
		...o.bearing === 0 ? { bearing: void 0 } : { bearing: Math.round(o.bearing * 10) / 10 },
		...o.pitch === 0 ? { pitch: void 0 } : { pitch: Math.round(o.pitch * 10) / 10 },
		...s && s !== "mercator" ? { projection: s } : { projection: void 0 }
	} : e.map, v = [...a && !f.has(a) ? [a] : [], ...i.filter((e) => !f.has(e))], b = {
		...e.state,
		activeLayers: v.map((e) => ({
			ref: e,
			visible: !0
		})),
		...a ? { activeBackground: a } : {},
		...u ? { terrainEnabled: !0 } : { terrainEnabled: void 0 }
	};
	if (!r) return {
		...e,
		project: h,
		map: g,
		layerData: p,
		tools: d,
		state: b
	};
	let x = new Set([...i, ...a ? [a] : []]), S = (e.layerData?.layers ?? []).filter((e) => x.has(e.id)), C = new Set(S.map((e) => e.source).filter(Boolean)), w = (e.layerData?.sources ?? []).filter((e) => C.has(e.id)), T = {
		...e.layerData,
		layers: S,
		sources: w
	}, E = (e) => {
		let t = [];
		for (let n of e) {
			let e = n;
			if (e.layerId) x.has(e.layerId) && !f.has(e.layerId) && t.push(n);
			else if (Array.isArray(e.children)) {
				let n = E(e.children);
				n.length && t.push({
					...e,
					children: n
				});
			}
		}
		return t;
	}, D = {};
	for (let [e, t] of Object.entries(d)) {
		let n = t;
		D[e] = Array.isArray(n?.items) ? {
			...n,
			items: n.items.map((e) => {
				let t = e;
				return Array.isArray(t.tree) ? {
					...t,
					tree: E(t.tree)
				} : e;
			})
		} : t;
	}
	return {
		...e,
		project: h,
		map: g,
		tools: D,
		layerData: T,
		state: b
	};
}
var A = class extends c {
	constructor(...e) {
		super(...e), this.toolbars = [], this.controls = [], this.onlyActiveLayers = !1, this.removeUnsupported = !1, this.projectTitle = "", this.filename = "config.json", this.popup = null, this.popupDraft = {}, this._dragId = null, this._dragToolbar = null, this._dragParent = null;
	}
	static {
		this.styles = i`
        :host { display: block; padding: 0.75rem; box-sizing: border-box; min-width: 260px; }
        h4 { margin: 0 0 0.6rem; font-size: var(--webmapx-font-size-md, 0.85rem); font-weight: 600; display: flex; align-items: center; gap: 0.4rem; }
        .section-label { font-size: var(--webmapx-font-size-sm, 0.78rem); font-weight: 600; color: var(--color-text-secondary, #5a6773); margin: 0.75rem 0 0.3rem; text-transform: uppercase; letter-spacing: .04em; }
        .toolbar-label { font-size: var(--webmapx-font-size-sm, 0.8rem); font-weight: 600; color: var(--color-text-secondary, #5a6773); margin: 0.5rem 0 0.25rem; }

        /* Tool rows */
        .tool-list { display: flex; flex-direction: column; gap: 2px; }
        .tool-row {
            display: flex; align-items: center; gap: 0.25rem;
            padding: 0.2rem 0.3rem; border-radius: var(--webmapx-radius-sm, 4px);
            border: 1px solid var(--color-border-light, #e2e7ec);
            background: var(--color-surface, #fff);
            font-size: var(--webmapx-font-size-sm, 0.82rem);
        }
        .tool-row.drag-over { outline: 2px solid var(--sl-color-primary-500); background: var(--sl-color-primary-50); }
        .tool-row.dragging  { opacity: 0.4; }
        .drag-handle { cursor: grab; color: var(--color-text-muted, #6b7681); user-select: none; flex-shrink: 0; }
        .drag-handle:active { cursor: grabbing; }
        .tool-name { flex: 1; }

        /* Toolbox sub-section */
        .toolbox-sub { margin: 2px 0 2px 1rem; padding: 0.25rem 0.4rem; border-left: 2px solid var(--color-border, #d5dce3); }
        .toolbox-sub-label { font-size: 0.73rem; color: var(--color-text-muted, #6b7681); text-transform: uppercase; letter-spacing: .04em; margin-bottom: 0.2rem; }

        /* Map controls (no drag) */
        .control-row { display: flex; align-items: center; gap: 0.25rem; padding: 0.15rem 0.3rem; font-size: var(--webmapx-font-size-sm, 0.82rem); }
        sl-checkbox::part(label) { font-size: var(--webmapx-font-size-sm, 0.82rem); }

        /* Add-tool dropdown */
        .add-row { margin-top: 0.4rem; }

        /* Misc */
        sl-input, sl-select { width: 100%; }
        sl-button[variant="primary"] { margin-top: 0.5rem; width: 100%; }

        /* Popup */
        .prop-popup {
            position: fixed;
            background: var(--color-surface, #fff);
            border: 1px solid var(--color-border, #d5dce3);
            border-radius: var(--webmapx-radius-md, 6px);
            box-shadow: var(--webmapx-shadow-lg, 0 4px 16px rgba(0,0,0,.18));
            padding: 0.7rem;
            z-index: 9999;
            min-width: 240px;
            max-width: 320px;
            max-height: 480px;
            overflow-y: auto;
        }
        .prop-popup h3 { margin: 0 0 0.5rem; font-size: var(--webmapx-font-size-md, 0.85rem); border-bottom: 1px solid var(--color-border-light, #e2e7ec); padding-bottom: 0.35rem; }
        .prop-row { display: flex; align-items: center; gap: 0.4rem; margin-bottom: 0.4rem; font-size: var(--webmapx-font-size-sm, 0.8rem); }
        .prop-row label { flex: 0 0 120px; color: var(--color-text-secondary, #5a6773); }
        .prop-row input[type="text"],
        .prop-row input[type="number"],
        .prop-row select { flex: 1; padding: 0.15rem 0.3rem; font-size: var(--webmapx-font-size-sm, 0.8rem); border: 1px solid var(--color-border, #d5dce3); border-radius: var(--webmapx-radius-xs, 3px); }
        .prop-row input[type="checkbox"] { width: 1rem; height: 1rem; }
        .prop-row textarea { flex: 1; font-size: var(--webmapx-font-size-sm, 0.78rem); font-family: monospace; border: 1px solid #ccc; border-radius: var(--webmapx-radius-xs, 3px); padding: 0.2rem; resize: vertical; }
        .prop-row textarea.json-invalid { border-color: red; }
        .prop-footer { display: flex; justify-content: flex-end; gap: 0.4rem; margin-top: 0.5rem; }
        .prop-footer button { padding: 0.25rem 0.6rem; font-size: var(--webmapx-font-size-sm, 0.8rem); border-radius: var(--webmapx-radius-xs, 3px); cursor: pointer; border: 1px solid var(--color-border, #d5dce3); background: var(--color-surface-raised, #f4f6f8); }
        .prop-footer .btn-apply { background: var(--color-primary, #2b6c8f); color: var(--color-on-primary, #fff); border-color: var(--color-primary, #2b6c8f); }
    `;
	}
	get mapElement() {
		return l(this);
	}
	connectedCallback() {
		super.connectedCallback(), this.loadFromConfig(), this._onDocMouseDown = this._onDocMouseDown.bind(this), this._onDocKeyDown = this._onDocKeyDown.bind(this), document.addEventListener("mousedown", this._onDocMouseDown), document.addEventListener("keydown", this._onDocKeyDown);
	}
	disconnectedCallback() {
		super.disconnectedCallback(), document.removeEventListener("mousedown", this._onDocMouseDown), document.removeEventListener("keydown", this._onDocKeyDown);
	}
	_onDocMouseDown(e) {
		if (!this.popup) return;
		let t = this.shadowRoot?.querySelector(".prop-popup");
		t && !t.contains(e.target) && this.closePopup();
	}
	_onDocKeyDown(e) {
		e.key === "Escape" && this.closePopup();
	}
	loadFromConfig() {
		let e = this.mapElement?.config, n = e?.tools ?? {}, r = [], i = /* @__PURE__ */ new Set(), a = [...S, ...Object.keys(n).filter((e) => n[e]?.type === "toolbar" && !S.includes(e))];
		for (let e of a) {
			i.add(e);
			let t = n[e] ?? C[e] ?? {
				type: "toolbar",
				enabled: !0
			}, a = (t.items ?? []).filter((e) => !_.has(y(String(e.id ?? e.type ?? ""))) && e.enabled !== !1).map((e) => D(e));
			r.push({
				key: e,
				configItem: t,
				items: a
			});
		}
		this.toolbars = r;
		let o = [], s = t.filter((e) => e.standalone);
		for (let e of s) {
			if (_.has(e.id)) continue;
			let t, r;
			for (let [i, a] of Object.entries(n)) if (y(i) === e.id || y(String(a.type ?? "")) === e.id || i === e.id) {
				t = a, r = i;
				break;
			}
			let i = r ?? e.id, a = {
				...t ?? {
					id: i,
					type: e.id
				},
				...x[e.id] ?? {}
			};
			o.push({
				id: e.id,
				label: e.label,
				enabled: t ? t.enabled !== !1 : !1,
				configItem: a
			});
		}
		this.controls = o;
		let c = e?.project;
		this.projectTitle = typeof c?.title == "string" ? c.title : "";
		let l = typeof c?.id == "string" ? c.id : "config";
		this.filename = `${l.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "") || "config"}.json`;
	}
	removeItem(e, t, n) {
		this.toolbars = this.toolbars.map((r) => r.key === e ? n ? {
			...r,
			items: r.items.map((e) => e.id === n ? {
				...e,
				subItems: e.subItems?.filter((e) => e.id !== t)
			} : e)
		} : {
			...r,
			items: r.items.filter((e) => e.id !== t)
		} : r);
	}
	addItem(e, n, r) {
		let i = t.find((e) => e.id === n);
		if (!i) return;
		let a = {
			id: n,
			label: i.label,
			configItem: {
				id: n,
				type: n,
				enabled: !0,
				...x[n] ?? {}
			},
			isNew: !0
		};
		this.toolbars = this.toolbars.map((t) => t.key === e ? r ? {
			...t,
			items: t.items.map((e) => e.id === r ? {
				...e,
				subItems: [...e.subItems ?? [], a]
			} : e)
		} : {
			...t,
			items: [...t.items, a]
		} : t);
	}
	updateItemConfig(e, t, n, r) {
		this.toolbars = this.toolbars.map((i) => {
			if (i.key !== e) return i;
			let a = (e) => e.id === t ? {
				...e,
				configItem: {
					...e.configItem,
					...n
				}
			} : e;
			return r ? {
				...i,
				items: i.items.map((e) => e.id === r ? {
					...e,
					subItems: e.subItems?.map(a)
				} : e)
			} : {
				...i,
				items: i.items.map(a)
			};
		});
	}
	onDragStart(e, t, n, r) {
		this._dragId = t, this._dragToolbar = n, this._dragParent = r ?? null, e.dataTransfer?.setData("text/plain", t);
	}
	onDragEnd() {
		this._dragId = null, this._dragToolbar = null, this._dragParent = null;
	}
	onDrop(e, t, n, r) {
		e.preventDefault();
		let i = this._dragId;
		!i || i === t || this._dragToolbar !== n || this._dragParent !== (r ?? null) || (this.toolbars = this.toolbars.map((e) => {
			if (e.key !== n) return e;
			let a = (e) => {
				let n = [...e], r = n.findIndex((e) => e.id === i), a = n.findIndex((e) => e.id === t);
				if (r === -1 || a === -1) return e;
				let [o] = n.splice(r, 1);
				return n.splice(a, 0, o), n;
			};
			return r ? {
				...e,
				items: e.items.map((e) => e.id === r ? {
					...e,
					subItems: a(e.subItems ?? [])
				} : e)
			} : {
				...e,
				items: a(e.items)
			};
		}));
	}
	openPopup(e, t, n, r, i, a = !1) {
		let o = e.currentTarget.getBoundingClientRect();
		if (this.popup?.toolId === t && this.popup?.toolbarKey === r && this.popup?.isToolbar === a) {
			this.closePopup();
			return;
		}
		let s;
		if (a) {
			s = {};
			for (let e of w) n[e] !== void 0 && (s[e] = n[e]);
			let e = n.panel ?? {};
			for (let t of T) e[t] !== void 0 && (s[`panel.${t}`] = e[t]);
		} else {
			s = {};
			for (let [e, t] of Object.entries(n)) v.has(e) || (s[e] = t);
		}
		this.popupDraft = s, this.popup = {
			toolId: t,
			toolbarKey: r,
			parentId: i,
			isToolbar: a,
			rect: o
		};
	}
	closePopup() {
		this.popup = null, this.popupDraft = {};
	}
	applyPopup() {
		if (!this.popup) return;
		let { toolId: e, toolbarKey: t, parentId: n, isToolbar: r } = this.popup;
		if (r && t) {
			let e = {}, n = {};
			for (let [t, r] of Object.entries(this.popupDraft)) t.startsWith("panel.") ? n[t.slice(6)] = r : e[t] = r;
			this.toolbars = this.toolbars.map((r) => {
				if (r.key !== t) return r;
				let i = {
					...r.configItem.panel ?? {},
					...n
				};
				return {
					...r,
					configItem: {
						...r.configItem,
						...e,
						panel: i
					}
				};
			});
		} else t ? this.updateItemConfig(t, e, this.popupDraft, n) : this.controls = this.controls.map((t) => t.id === e ? {
			...t,
			configItem: {
				...t.configItem,
				...this.popupDraft
			}
		} : t);
		this.closePopup();
	}
	resetPopup() {
		if (!this.popup) return;
		let { toolId: e, toolbarKey: t, parentId: n, isToolbar: r } = this.popup, i = this.mapElement?.config?.tools ?? {}, a;
		if (r && t) {
			a = i[t] ?? C[t] ?? {};
			let e = {};
			for (let t of w) a[t] !== void 0 && (e[t] = a[t]);
			let n = a.panel ?? {};
			for (let t of T) n[t] !== void 0 && (e[`panel.${t}`] = n[t]);
			this.popupDraft = e;
		} else {
			if (t) {
				let r = i[t]?.items ?? [], o = (t) => {
					for (let n of t) {
						if (y(String(n.id ?? n.type ?? "")) === e) return n;
						if (Array.isArray(n.items)) {
							let e = o(n.items);
							if (e) return e;
						}
					}
				};
				a = o(n ? r.find((e) => y(String(e.id ?? e.type ?? "")) === n)?.items ?? [] : r) ?? {};
			} else a = i[e] ?? {};
			let r = {};
			for (let [e, t] of Object.entries(a)) v.has(e) || (r[e] = t);
			this.popupDraft = r;
		}
	}
	async handleDownload() {
		let e = this.mapElement, t = e?.config;
		if (!t) return;
		let n = e?.adapter, r = n?.store?.getState?.()?.mapLayers ?? {}, i = n?.getViewportState?.(), a = n?.getProjection?.()?.name ?? null, o = [], s;
		for (let [e, t] of Object.entries(r)) t?.visible !== !1 && (t?.legendRole === "background" ? s = e : o.push(e));
		let { layers: c, sources: l } = O(t, n?.getLayerConfigs?.() ?? /* @__PURE__ */ new Map(), [...o, ...s ? [s] : []]), u = {
			...t,
			layerData: {
				...t.layerData,
				layers: c,
				sources: l
			}
		}, d = /* @__PURE__ */ new Set(), f;
		if (this.removeUnsupported) {
			let t = (t) => e?.isCatalogLayerSupported?.(t) ?? Promise.resolve(!0), n = await Promise.all((u.layerData?.layers ?? []).map(async (e) => {
				let n = e.id;
				return await t(n) ? null : n;
			}));
			if (d = new Set(n.filter((e) => e !== null)), s && d.has(s)) {
				let e = (u.layerData?.layers ?? []).find((e) => e.id === s)?.singleGroup;
				if (e) for (let t of u.layerData?.layers ?? []) {
					let n = t;
					if (n.singleGroup === e && !d.has(n.id)) {
						f = n.id;
						break;
					}
				}
				if (!f) {
					let { showToast: e } = await import("./toast-CrdWDpWE.js");
					e("<strong>No supported background layer available</strong><br>All background layers are unsupported by the current engine. Uncheck \"Remove engine-unsupported layers\" or switch engine.", { variant: "danger" });
					return;
				}
			}
		}
		let p = s && d.has(s) ? f : s, m = n?.isTerrainEnabled?.() === !0, h = k(u, this.toolbars, this.controls, this.onlyActiveLayers, o, p, i, a, this.projectTitle, d, m), g = new Blob([JSON.stringify(h, null, 2)], { type: "application/json" }), _ = URL.createObjectURL(g);
		Object.assign(document.createElement("a"), {
			href: _,
			download: this.filename || "config.json"
		}).click(), URL.revokeObjectURL(_);
	}
	renderToolRow(e, t, n) {
		let i = Object.keys(e.configItem).filter((e) => !v.has(e));
		return s`
            <div class="tool-row"
                draggable="true"
                @dragstart=${(r) => {
			this.onDragStart(r, e.id, t, n), r.currentTarget.classList.add("dragging");
		}}
                @dragend=${(e) => {
			this.onDragEnd(), e.currentTarget.classList.remove("dragging");
		}}
                @dragover=${(e) => {
			e.preventDefault(), e.currentTarget.classList.add("drag-over");
		}}
                @dragleave=${(e) => e.currentTarget.classList.remove("drag-over")}
                @drop=${(r) => {
			r.currentTarget.classList.remove("drag-over"), this.onDrop(r, e.id, t, n);
		}}>
                <span class="drag-handle" title="Drag to reorder">⠿</span>
                <span class="tool-name">${e.label}</span>
                ${i.length > 0 ? s`
                    <sl-icon-button name="gear" label="Options" style="font-size:0.85rem"
                        @click=${(r) => this.openPopup(r, e.id, e.configItem, t, n)}>
                    </sl-icon-button>
                ` : r}
                <sl-icon-button name="x" label="Remove" style="font-size:0.85rem"
                    @click=${() => this.removeItem(t, e.id, n)}>
                </sl-icon-button>
            </div>
            ${e.subItems === void 0 ? r : this.renderToolboxSub(e, t)}
        `;
	}
	renderToolboxSub(e, n) {
		let i = n, a = e.id, o = new Set(e.subItems.map((e) => e.id)), c = t.filter((e) => !e.standalone && e.id !== "toolbox" && !_.has(e.id) && !o.has(e.id));
		return s`
            <div class="toolbox-sub">
                <div class="toolbox-sub-label">${e.label} contents</div>
                <div class="tool-list">
                    ${e.subItems.map((e) => this.renderToolRow(e, i, a))}
                </div>
                ${c.length > 0 ? s`
                    <div class="add-row">
                        <sl-select size="small" placeholder="Add sub-tool…" clearable
                            @sl-change=${(e) => {
			let t = e.target.value;
			t && (this.addItem(i, t, a), e.target.value = "");
		}}>
                            ${c.map((e) => s`<sl-option value=${e.id}>${e.label}</sl-option>`)}
                        </sl-select>
                    </div>
                ` : r}
            </div>
        `;
	}
	renderPopup() {
		if (!this.popup) return r;
		let { toolId: e, toolbarKey: t, parentId: n, isToolbar: i, rect: a } = this.popup, o;
		if (i && t) o = t === "mainToolbar" ? "Toolbar" : t;
		else if (o = E(e), t) {
			let r = this.toolbars.find((e) => e.key === t), i = (n ? r?.items.find((e) => e.id === n)?.subItems : r?.items)?.find((t) => t.id === e);
			i && (o = i.label);
		}
		let c = a.bottom + 4, l = a.left;
		c + 400 > window.innerHeight && (c = Math.max(4, a.top - 404)), l + 330 > window.innerWidth && (l = Math.max(4, window.innerWidth - 334));
		let u = Object.entries(this.popupDraft);
		return s`
            <div class="prop-popup" style="top:${c}px;left:${l}px" @mousedown=${(e) => e.stopPropagation()}>
                <h3>${o} options</h3>
                ${u.length === 0 ? s`<p style="font-size:0.8rem;color:var(--color-text-muted,#6b7681);margin:0">No editable options.</p>` : r}
                ${u.map(([e, t]) => {
			let n = b[e];
			return s`
                        <div class="prop-row">
                            <label title=${e} for=${`prop-${e}`}>${e}</label>
                            ${typeof t == "boolean" ? s`
                                <input type="checkbox" id=${`prop-${e}`} ?checked=${t}
                                    @change=${(t) => {
				this.popupDraft = {
					...this.popupDraft,
					[e]: t.target.checked
				};
			}}>
                            ` : typeof t == "number" ? s`
                                <input type="number" id=${`prop-${e}`} .value=${String(t)}
                                    @input=${(t) => {
				let n = parseFloat(t.target.value);
				isNaN(n) || (this.popupDraft = {
					...this.popupDraft,
					[e]: n
				});
			}}>
                            ` : n ? s`
                                <select id=${`prop-${e}`} .value=${String(t)}
                                    @change=${(t) => {
				this.popupDraft = {
					...this.popupDraft,
					[e]: t.target.value
				};
			}}>
                                    ${n.includes(String(t)) ? r : s`<option value=${String(t)}>${String(t)}</option>`}
                                    ${n.map((e) => s`<option value=${e} ?selected=${String(t) === e}>${e}</option>`)}
                                </select>
                            ` : typeof t == "string" ? s`
                                <input type="text" id=${`prop-${e}`} .value=${t}
                                    @input=${(t) => {
				this.popupDraft = {
					...this.popupDraft,
					[e]: t.target.value
				};
			}}>
                            ` : s`
                                <textarea rows="3" id=${`prop-${e}`} .value=${JSON.stringify(t, null, 2)}
                                    @input=${(t) => {
				let n = t.target;
				try {
					let t = JSON.parse(n.value);
					n.classList.remove("json-invalid"), this.popupDraft = {
						...this.popupDraft,
						[e]: t
					};
				} catch {
					n.classList.add("json-invalid");
				}
			}}></textarea>
                            `}
                        </div>
                    `;
		})}
                <div class="prop-footer">
                    <button @click=${() => this.resetPopup()}>Reset</button>
                    <button class="btn-apply" @click=${() => this.applyPopup()}>OK</button>
                </div>
            </div>
        `;
	}
	render() {
		return s`
            <h4><sl-icon name="pencil-square"></sl-icon> Edit config</h4>

            <sl-input size="small" label="Project title" required
                ?invalid=${!this.projectTitle.trim()}
                help-text=${this.projectTitle.trim() ? "" : "Title is required"}
                .value=${this.projectTitle}
                @sl-input=${(e) => {
			this.projectTitle = e.target.value;
			let t = this.projectTitle.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "") || "config";
			this.filename = `${t}.json`;
		}}>
            </sl-input>

            <sl-checkbox ?checked=${this.onlyActiveLayers}
                @sl-change=${(e) => {
			this.onlyActiveLayers = e.target.checked;
		}}>
                Only active layers
            </sl-checkbox>
            <sl-checkbox ?checked=${this.removeUnsupported}
                @sl-change=${(e) => {
			this.removeUnsupported = e.target.checked;
		}}>
                Remove engine-unsupported layers
            </sl-checkbox>

            ${this.toolbars.map((e) => {
			let n = e.key === "mainToolbar" ? "Toolbar tools" : `${e.key} tools`, i = new Set(e.items.map((e) => e.id)), a = t.filter((e) => !e.standalone && !_.has(e.id) && !i.has(e.id));
			return s`
                    <div class="section-label" style="display:flex;align-items:center;gap:0.25rem">
                        <span style="flex:1">${n}</span>
                        <sl-icon-button name="gear" label="Toolbar settings" style="font-size:0.85rem"
                            @click=${(t) => this.openPopup(t, e.key, e.configItem, e.key, void 0, !0)}>
                        </sl-icon-button>
                    </div>
                    <div class="tool-list">
                        ${e.items.map((t) => this.renderToolRow(t, e.key))}
                    </div>
                    ${a.length > 0 ? s`
                        <div class="add-row">
                            <sl-select size="small" placeholder="Add tool…" clearable
                                @sl-change=${(t) => {
				let n = t.target.value;
				n && (this.addItem(e.key, n), t.target.value = "");
			}}>
                                ${a.map((e) => s`<sl-option value=${e.id}>${e.label}</sl-option>`)}
                            </sl-select>
                        </div>
                    ` : r}
                `;
		})}

            <div class="section-label">Map controls</div>
            <div class="tool-list">
                ${this.controls.map((e) => {
			let t = Object.keys(e.configItem).filter((e) => !v.has(e));
			return s`
                        <div class="control-row">
                            <sl-checkbox ?checked=${e.enabled}
                                @sl-change=${(t) => {
				let n = t.target.checked;
				this.controls = this.controls.map((t) => t.id === e.id ? {
					...t,
					enabled: n
				} : t);
			}}>
                                ${e.label}
                            </sl-checkbox>
                            ${t.length > 0 ? s`
                                <sl-icon-button name="gear" label="Options" style="font-size:0.85rem"
                                    @click=${(t) => this.openPopup(t, e.id, e.configItem)}>
                                </sl-icon-button>
                            ` : r}
                        </div>
                    `;
		})}
            </div>

            <sl-divider></sl-divider>

            <sl-input size="small" label="Filename"
                .value=${this.filename}
                @sl-input=${(e) => {
			this.filename = e.target.value;
		}}>
            </sl-input>

            <sl-button variant="primary" ?disabled=${!this.projectTitle.trim()} @click=${this.handleDownload}>
                <sl-icon slot="prefix" name="download"></sl-icon>
                Download config
            </sl-button>

            ${this.renderPopup()}
        `;
	}
};
u([a()], A.prototype, "toolbars", void 0), u([a()], A.prototype, "controls", void 0), u([a()], A.prototype, "onlyActiveLayers", void 0), u([a()], A.prototype, "removeUnsupported", void 0), u([a()], A.prototype, "projectTitle", void 0), u([a()], A.prototype, "filename", void 0), u([a()], A.prototype, "popup", void 0), u([a()], A.prototype, "popupDraft", void 0), A = u([o("webmapx-config-edit-tool")], A);
//#endregion
export { A as WebmapxConfigEditTool };
