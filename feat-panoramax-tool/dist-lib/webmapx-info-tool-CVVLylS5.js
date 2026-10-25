import { c as e, h as t, i as n, o as r, p as i } from "./decorators-d8E4nZJy.js";
import { t as a } from "./decorate-Dbo3QKbS.js";
import { t as o } from "./webmapx-base-tool-D0BchkqJ.js";
import "./button-BmvunzcI.js";
import "./icon-Qf3FyAAL.js";
import "./spinner-BnB3OpDj.js";
import { i as s } from "./data-colors-BglhXRFr.js";
import { t as c } from "./throttle-BD7udUwY.js";
import { t as l } from "./help-text-styles-BFw9dhCq.js";
import { t as u } from "./announce-DxxaToE8.js";
import { n as d, t as f } from "./wms-feature-info-BjPjL6VU.js";
import { t as p } from "./touch-pointer-CXtXj6Ie.js";
//#region src/icons/pin-off.svg?url
var m = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNiIgaGVpZ2h0PSIxNiIgZmlsbD0iY3VycmVudENvbG9yIiB2aWV3Qm94PSIwIDAgMTYgMTYiPgogIDwhLS0gQm9vdHN0cmFwIEljb25zJyBwaW4tYW5nbGUgKE1JVCksIHN0cnVjayB0aHJvdWdoOiAidW5waW4iLiBUaGUgbWFzayBjdXRzIGEKICAgICAgIGdhcCBhcm91bmQgdGhlIHN0cm9rZSBzbyB0aGUgbGluZSByZWFkcyBhcyBjcm9zc2luZyB0aGUgcGluLCBub3QgcGFydCBvZiBpdC4gLS0+CiAgPGRlZnM+CiAgICA8bWFzayBpZD0icGluLW9mZi1nYXAiPgogICAgICA8cmVjdCB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIGZpbGw9IndoaXRlIi8+CiAgICAgIDxwYXRoIGQ9Ik0xLjIgMS4yIDE0LjggMTQuOCIgc3Ryb2tlPSJibGFjayIgc3Ryb2tlLXdpZHRoPSIzIi8+CiAgICA8L21hc2s+CiAgPC9kZWZzPgogIDxwYXRoIG1hc2s9InVybCgjcGluLW9mZi1nYXApIiBkPSJNOS44MjguNzIyYS41LjUgMCAwIDEgLjM1NC4xNDZsNC45NSA0Ljk1YS41LjUgMCAwIDEgMCAuNzA3Yy0uNDguNDgtMS4wNzIuNTg4LTEuNTAzLjU4OC0uMTc3IDAtLjMzNS0uMDE4LS40Ni0uMDM5bC0zLjEzNCAzLjEzNGE2IDYgMCAwIDEgLjE2IDEuMDEzYy4wNDYuNzAyLS4wMzIgMS42ODctLjcyIDIuMzc1YS41LjUgMCAwIDEtLjcwNyAwbC0yLjgyOS0yLjgyOC0zLjE4MiAzLjE4MmMtLjE5NS4xOTUtMS4yMTkuOTAyLTEuNDE0LjcwN3MuNTEyLTEuMjIuNzA3LTEuNDE0bDMuMTgyLTMuMTgyLTIuODI4LTIuODI5YS41LjUgMCAwIDEgMC0uNzA3Yy42ODgtLjY4OCAxLjY3My0uNzY3IDIuMzc1LS43MmE2IDYgMCAwIDEgMS4wMTMuMTZsMy4xMzQtMy4xMzNhMyAzIDAgMCAxLS4wNC0uNDYxYzAtLjQzLjEwOC0xLjAyMi41ODktMS41MDNhLjUuNSAwIDAgMSAuMzUzLS4xNDZtLjEyMiAyLjExMnYtLjAwMnptMC0uMDAydi4wMDJhLjUuNSAwIDAgMS0uMTIyLjUxTDYuMjkzIDYuODc4YS41LjUgMCAwIDEtLjUxMS4xMkg1Ljc4bC0uMDE0LS4wMDRhNSA1IDAgMCAwLS4yODgtLjA3NiA1IDUgMCAwIDAtLjc2NS0uMTE2Yy0uNDIyLS4wMjgtLjgzNi4wMDgtMS4xNzUuMTVsNS41MSA1LjUwOWMuMTQxLS4zNC4xNzctLjc1My4xNDktMS4xNzVhNSA1IDAgMCAwLS4xOTItMS4wNTRsLS4wMDQtLjAxM3YtLjAwMWEuNS41IDAgMCAxIC4xMi0uNTEybDMuNTM2LTMuNTM1YS41LjUgMCAwIDEgLjUzMi0uMTE1bC4wOTYuMDIyYy4wODcuMDE3LjIwOC4wMzQuMzQ0LjAzNHEuMTcyLjAwMi4zNDMtLjA0TDkuOTI3IDIuMDI4cS0uMDQyLjE3Mi0uMDQuMzQzYTEuOCAxLjggMCAwIDAgLjA2Mi40NnoiLz4KICA8cGF0aCBkPSJNMS41IDEuNSAxNC41IDE0LjUiIHN0cm9rZT0iY3VycmVudENvbG9yIiBzdHJva2Utd2lkdGg9IjEuMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIi8+Cjwvc3ZnPgo=", h = "webmapx-info-pin", g = 120, _ = 4, v = 6, y = class extends o {
	constructor(...e) {
		super(...e), this.active = !1, this.features = [], this.touch = new p(this), this.loading = !1, this.mode = "hover", this.elevation = null, this.pinMarkerAdded = !1, this.unsubClick = null, this.unsubPointerMove = null, this.unsubViewChange = null, this.unsubViewChangeEnd = null, this.mapIsMoving = !1, this.throttledHoverQuery = c(async (e, t) => {
			if (this.mode !== "hover" || !this.active || !this.adapter) return;
			let n;
			try {
				n = await this.adapter.queryService.queryFeatures({
					pixel: e,
					lngLat: t
				}, {
					tolerancePx: _,
					includeWMS: !1
				});
			} catch (e) {
				console.warn("[info-tool] queryFeatures failed", e), n = [];
			}
			this.mode === "hover" && (this.features = n);
		}, g), this.unpinByUser = () => {
			this.unpin(), u(this, "Unpinned"), this.updateComplete.then(() => this.shadowRoot?.querySelector(".info-container")?.focus());
		};
	}
	get toolTip() {
		return this.mode === "pinned" ? this.touch.isTouch ? "Tap another feature, or choose Unpin to remove the marker." : "Click another feature, or choose Unpin to point again." : this.touch.isTouch ? "Tap a feature for more information." : "Point at a feature for more information, click to keep it in view.";
	}
	handleEscape() {
		return this.mode === "pinned" ? (this.unpinByUser(), !0) : !1;
	}
	static {
		this.styles = [l, t`
        :host {
            display: block;
            pointer-events: auto;
        }

        .info-container {
            display: flex;
            flex-direction: column;
            gap: var(--webmapx-space-md, 0.75rem);
            padding: var(--webmapx-tool-padding, 0);
            font-size: var(--font-size-small, 0.875rem);
            min-width: 200px;
        }

        .info-container:focus {
            outline: none;
        }

        /* Unpin sits at the right, out of the way of the result it acts on. */
        .held-row {
            display: flex;
            align-items: center;
            justify-content: flex-end;
            gap: var(--webmapx-space-sm, 0.5rem);
        }

        .layer-group {
            border: 1px solid var(--color-border-light, #e2e7ec);
            border-radius: 4px;
            overflow: hidden;
        }
        .feature-limit-notice {
            padding: 0.2rem 0.5rem;
            font-size: 0.7rem;
            color: var(--color-text-secondary, #5a6773);
            font-style: italic;
            border-top: 1px solid var(--color-border-light, #e2e7ec);
        }

        .feature-index {
            display: flex;
            align-items: center;
            gap: 0.4rem;
            padding: 0.15rem 0.5rem;
            font-size: 0.7rem;
            font-weight: 600;
            color: var(--color-text-secondary, #5a6773);
            background: var(--color-surface-raised, #f4f6f8);
            border-top: 1px solid var(--color-border-light, #e2e7ec);
        }
        .feature-index::before,
        .feature-index::after {
            content: '';
            flex: 1;
            border-top: 1px solid var(--color-text-secondary, #5a6773);
        }

        .layer-title {
            background: var(--color-surface-raised, #f4f6f8);
            padding: 0.25rem 0.5rem;
            font-weight: 600;
            font-size: 0.75rem;
            color: var(--color-text-secondary, #5a6773);
            border-bottom: 1px solid var(--color-border-light, #e2e7ec);
        }

        .props-list {
            display: grid;
            grid-template-columns: minmax(0, 0.8fr) minmax(0, 1fr);
            font-size: 0.8rem;
        }

        .props-row {
            display: contents;
        }

        .props-row:nth-child(even) > .props-key,
        .props-row:nth-child(even) > .props-val {
            background: var(--color-surface-raised, #f4f6f8);
        }

        .props-key {
            min-width: 0;
            padding: 0.2rem 0.5rem;
            font-weight: 500;
            color: var(--color-text-secondary, #5a6773);
            overflow-wrap: break-word;
            border-bottom: 1px solid var(--color-border-light, #e2e7ec);
        }

        .props-val {
            min-width: 0;
            overflow-wrap: break-word;
            padding: 0.2rem 0.5rem;
            border-bottom: 1px solid var(--color-border-light, #e2e7ec);
        }

        .img-error {
            font-size: 0.75rem;
            color: var(--sl-color-danger-600, #c0392b);
            font-style: italic;
        }

        .props-val a[href] {
            display: block;
            width: 100%;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }

        .props-val img {
            max-width: 100%;
            max-height: 120px;
            border-radius: 3px;
            object-fit: cover;
        }

        .raw-value {
            padding: 0.4rem 0.5rem;
            font-size: 0.75rem;
            white-space: pre-wrap;
            overflow: auto;
            max-height: 200px;
        }

        .props-table img {
            max-width: 100%;
            max-height: 120px;
            border-radius: 3px;
            object-fit: cover;
        }

        .sub-layer-title {
            display: flex;
            align-items: center;
            gap: 0.3rem;
            padding: 0.15rem 0.5rem;
            background: var(--color-surface-raised, #f4f6f8);
            border-bottom: 1px solid var(--color-border-light, #e2e7ec);
        }

        .sub-layer-name {
            font-size: 0.75rem;
            font-weight: 500;
            color: var(--color-text-secondary, #5a6773);
        }

        .sub-layer-type {
            font-size: 0.65rem;
            color: var(--color-text-secondary, #5a6773);
            font-style: italic;
        }

        .source-badge.composite {
            background: var(--sl-color-violet-100, #ede9fe);
            color: var(--sl-color-violet-700, #6d28d9);
        }

        .source-badge {
            display: inline-block;
            font-size: 0.65rem;
            padding: 0 0.3rem;
            border-radius: 3px;
            background: var(--color-border-light, #e2e7ec);
            color: var(--color-text-secondary, #5a6773);
            margin-left: 0.25rem;
            vertical-align: middle;
        }

        .source-badge.wms {
            background: var(--color-primary-soft, #e6f0f5);
            color: var(--color-primary, #2b6c8f);
        }

        .empty-hint {
            margin: 0;
            padding: 0.3rem 0.5rem;
        }

        .elevation-row {
            padding: 0.3rem 0.5rem;
            font-size: 0.8rem;
            color: var(--color-text-secondary, #5a6773);
        }

        sl-spinner {
            font-size: 0.9rem;
        }
    `];
	}
	onMapAttached(e) {
		super.onMapAttached(e), this.unsubClick = e.events.on("click", this.handleClick.bind(this)), this.unsubPointerMove = e.events.on("pointer-move", this.handlePointerMove.bind(this)), this.unsubViewChange = e.events.on("view-change", () => {
			this.mapIsMoving = !0;
		}), this.unsubViewChangeEnd = e.events.on("view-change-end", () => {
			this.mapIsMoving = !1;
		});
	}
	onMapDetached() {
		this.unsubClick?.(), this.unsubPointerMove?.(), this.unsubViewChange?.(), this.unsubViewChangeEnd?.(), this.unsubClick = null, this.unsubPointerMove = null, this.unsubViewChange = null, this.unsubViewChangeEnd = null, this.mapIsMoving = !1, super.onMapDetached();
	}
	disconnectedCallback() {
		this.removePinMarker(), super.disconnectedCallback();
	}
	activate() {
		this.active = !0, this.style.display = "block", this.onActivate();
	}
	deactivate() {
		this.active = !1, this.style.display = "none", this.onDeactivate();
	}
	onStateChanged(e) {}
	onActivate() {
		this.features = [], this.elevation = null, this.mode = "hover";
	}
	onDeactivate() {
		this.features = [], this.elevation = null, this.mode = "hover", this.removePinMarker();
	}
	handlePointerMove(e) {
		!this.active || this.mode === "pinned" || this.mapIsMoving || this.throttledHoverQuery(e.pixel, e.coords);
	}
	async handleClick(e) {
		if (!(!this.active || !this.adapter)) {
			this.mode = "pinned", this.loading = !0, this.features = [], this.elevation = this.adapter.getElevation?.(e.coords) ?? null, this.updatePinMarker(e.coords);
			try {
				let t = await this.adapter.queryService.queryFeatures({
					pixel: e.pixel,
					lngLat: e.coords
				}, {
					tolerancePx: v,
					includeWMS: !0
				}), n = await this.queryGFILayers(e.pixel, e.coords);
				this.features = [...t, ...n];
				let r = this.features.length;
				u(this, r === 0 ? "Nothing found here" : `${r} ${r === 1 ? "feature" : "features"} found here`);
			} finally {
				this.loading = !1;
			}
		}
	}
	async queryGFILayers(e, t) {
		if (!this.adapter) return [];
		let n = this.adapter.store.getState().mapLayers ?? {}, r = 128 * (360 / (256 * 2 ** (this.adapter.getViewportState()?.zoom ?? 0))), i = {
			west: t[0] - r,
			south: t[1] - r,
			east: t[0] + r,
			north: t[1] + r
		}, a = [];
		return await Promise.all(Object.entries(n).map(async ([e, t]) => {
			let n = t, r = typeof n?.getFeatureInfoUrl == "string" ? n.getFeatureInfoUrl : null;
			if (r && d(n)) try {
				let t = new URL(r), o = (e) => {
					for (let [n, r] of t.searchParams) if (n.toLowerCase() === e) return r;
					return null;
				}, s = await f({
					sourceConfig: {
						id: e,
						type: "raster",
						service: "wms",
						url: r,
						version: o("version") ?? "1.1.1",
						layers: o("layers") ?? o("query_layers") ?? "",
						format: typeof n.getFeatureInfoFormat == "string" ? n.getFeatureInfoFormat : "application/json",
						crs: o("crs") ?? o("srs") ?? "EPSG:3857"
					},
					layerId: e,
					layerTitle: typeof n.label == "string" ? n.label : e,
					bounds: i,
					containerWidth: 256,
					containerHeight: 256,
					pixelX: 128,
					pixelY: 128
				});
				a.push(...s);
			} catch {}
		})), a;
	}
	updatePinMarker(e) {
		this.adapter && (this.pinMarkerAdded ? this.adapter.moveMarker(h, e) : (this.adapter.addMarker(h, e, { color: s }), this.pinMarkerAdded = !0));
	}
	removePinMarker() {
		this.pinMarkerAdded &&= (this.adapter?.removeMarker(h), !1);
	}
	unpin() {
		this.mode = "hover", this.features = [], this.elevation = null, this.removePinMarker();
	}
	renderFeatures() {
		if (this.features.length === 0) return e;
		let t = /* @__PURE__ */ new Map();
		for (let e of this.features) {
			let n = t.get(e.layerId);
			n ? n.push(e) : t.set(e.layerId, [e]);
		}
		let n = Object.keys(this.adapter?.store.getState().mapLayers ?? {}), r = (e) => {
			let t = n.indexOf(e);
			return t === -1 ? Infinity : n.length - 1 - t;
		};
		return i`
            ${[...t.entries()].sort((e, t) => r(e[0]) - r(t[0])).map(([e, t]) => {
			let n = this.adapter?.store.getState().mapLayers?.[e], r = Array.isArray(n?.sublayers) && n.sublayers.length > 1, a = r ? "composite" : t[0].source, o = typeof n?.featureInfoLimit == "number" ? n.featureInfoLimit : null, s = o !== null && t.length > o, c = s ? t.slice(0, o) : t, l = /* @__PURE__ */ new Map();
			for (let e of c) {
				let t = e.subLayerId ?? "", n = l.get(t);
				n ? n.push(e) : l.set(t, [e]);
			}
			return i`
                <div class="layer-group">
                    <div class="layer-title">
                        ${t[0].layerTitle ?? e}
                        <span class="source-badge ${r ? "composite" : t[0].source}">${a}</span>
                    </div>
                    ${[...l.entries()].map(([e, t]) => i`
                        ${e ? i`<div class="sub-layer-title">
                            <span class="sub-layer-name">${e}</span>
                            ${t[0].subLayerType ? i`<span class="sub-layer-type">${t[0].subLayerType}</span>` : ""}
                        </div>` : ""}
                        ${t.length > 1 ? t.map((e, n) => i`
                                <div class="feature-index">${n + 1} / ${t.length}</div>
                                ${this.renderPropsTable(e)}`) : t.map((e) => this.renderPropsTable(e))}
                    `)}
                    ${s ? i`<div class="feature-limit-notice">Showing ${o} of ${t.length} features</div>` : ""}
                </div>`;
		})}
        `;
	}
	getPropertySchema(e) {
		let t = this.adapter?.store.getState().mapLayers?.[e];
		return Array.isArray(t?.properties) ? t.properties : null;
	}
	getAttributeMeta(e) {
		let t = this.adapter?.store.getState().mapLayers?.[e], n = t?.attributes && typeof t.attributes == "object" ? t.attributes : {};
		return {
			translations: Array.isArray(n.translations) ? n.translations : [],
			allowed: Array.isArray(n.allowedAttributes) ? new Set(n.allowedAttributes) : null,
			denied: Array.isArray(n.deniedAttributes) ? new Set(n.deniedAttributes) : /* @__PURE__ */ new Set()
		};
	}
	renderPropsTable(e) {
		let t = this.getPropertySchema(e.layerId), { translations: n, allowed: r, denied: a } = this.getAttributeMeta(e.layerId), o = e.properties;
		if (o._raw) return i`<div class="raw-value">${o._raw}</div>`;
		let s = [], c = /* @__PURE__ */ new Set();
		for (let e of n) {
			let n = e.name;
			if (a.has(n) || r && !r.has(n) || !(n in o) || o[n] === null || o[n] === void 0) continue;
			c.add(n);
			let i = o[n];
			if (e.multiplier && !isNaN(parseFloat(String(e.multiplier))) && (i = parseFloat(String(i)) * parseFloat(String(e.multiplier))), e.decimals !== void 0 && !isNaN(parseInt(String(e.decimals)))) {
				let t = 10 ** parseInt(String(e.decimals));
				i = Math.round(parseFloat(String(i)) * t) / t;
			}
			if (e.valuemap && Array.isArray(e.valuemap)) {
				let t = e.valuemap.find((e) => e.value === i);
				t && (i = t.label);
			}
			e.date && (i &&= new Date(i).toLocaleString());
			let l = e.unit && !isNaN(Number(i)) ? e.unit : "", u = e.translation || n, d = l ? `${i}${l}` : typeof i == "object" ? JSON.stringify(i) : String(i ?? "");
			s.push(this.renderPropRow(n, u, d, t));
		}
		for (let [e, i] of Object.entries(o)) {
			if (e === "_raw" || c.has(e) || a.has(e) || r && !r.has(e) || i == null || n.length > 0 && !n.find((t) => t.name === e) && r === null) continue;
			let o = typeof i == "object" ? JSON.stringify(i) : String(i ?? "");
			s.push(this.renderPropRow(e, e.replace(/_/g, " "), o, t));
		}
		return s.length === 0 ? i`<div class="empty-hint help-text">This feature has no details.</div>` : i`<div class="props-list">${s}</div>`;
	}
	renderPropRow(e, t, n, r) {
		let a = r?.find((t) => t.name === e)?.type ?? "string", o = /^https?:\/\/\S+$/.test(n.trim()), s = /^data:image\//i.test(n), c = a === "string" ? s ? "imageURL" : o ? "linkURL" : "string" : a;
		return i`
            <div class="props-row">
                <span class="props-key" title=${e}>${t}</span>
                <span class="props-val">${(c === "create-time" || c === "update-time") && n ? new Date(Number(n)).toLocaleString() : c === "imageURL" && n ? i`<img src=${n} @error=${(e) => {
			let t = e.target, n = document.createElement("span");
			n.className = "img-error", n.textContent = "⚠ invalid image", t.replaceWith(n);
		}}>` : c === "linkURL" && n ? i`<a href=${n} target="_blank" rel="noopener noreferrer">${n}</a>` : n.split(",").map((e, t) => t === 0 ? i`${e}` : i`,<wbr>${e}`)}</span>
            </div>
        `;
	}
	render() {
		let t = this.mode === "pinned";
		return i`
            <div class="info-container" tabindex="-1">
                ${t ? i`
                    <div class="held-row">
                        ${this.loading ? i`<sl-spinner></sl-spinner>` : e}
                        <sl-button size="small" title="Let go of this result (Esc)" @click=${this.unpinByUser}>
                            <sl-icon src=${m} slot="prefix"></sl-icon>
                            Unpin
                        </sl-button>
                    </div>
                ` : e}

                ${t && !this.loading && this.features.length === 0 ? i`<p class="empty-hint help-text">Nothing here. Try another spot.</p>` : e}

                ${t && this.elevation !== null ? i`<div class="elevation-row">Elevation: <strong>${Math.round(this.elevation)} m</strong></div>` : e}

                ${this.renderFeatures()}
            </div>
        `;
	}
};
a([n()], y.prototype, "features", void 0), a([n()], y.prototype, "loading", void 0), a([n()], y.prototype, "mode", void 0), a([n()], y.prototype, "elevation", void 0), y = a([r("webmapx-info-tool")], y);
//#endregion
export { y as WebmapxInfoTool };
