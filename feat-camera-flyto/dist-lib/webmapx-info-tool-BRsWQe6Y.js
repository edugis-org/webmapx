import { c as e, h as t, i as n, o as r, p as i } from "./decorators-d8E4nZJy.js";
import { t as a } from "./decorate-D2tFcxUg.js";
import { t as o } from "./webmapx-base-tool-DZ9rzLbS.js";
import { r as s } from "./apikeys-DFtVEG81.js";
import "./icon-Qf3FyAAL.js";
import "./spinner-DHQKbDmr.js";
import { i as c } from "./data-colors-BglhXRFr.js";
import { t as l } from "./throttle-BD7udUwY.js";
import { t as u } from "./announce-DxxaToE8.js";
import { n as d, t as f } from "./wms-feature-info-BjPjL6VU.js";
//#region src/components/webmapx-info-tool.ts
var p = "webmapx-info-pin", m = 8, h = 120, g = 4, _ = 6, v = class extends o {
	constructor(...e) {
		super(...e), this.active = !1, this.features = [], this.loading = !1, this.mode = "hover", this.pinnedLocation = null, this.elevation = null, this.streetviewImageUrl = null, this.streetviewPanoId = null, this.streetviewLoading = !1, this.streetviewUnavailable = !1, this.pinnedPixel = null, this.pinMarkerAdded = !1, this.unsubClick = null, this.unsubPointerMove = null, this.unsubViewChange = null, this.unsubViewChangeEnd = null, this.mapIsMoving = !1, this.throttledHoverQuery = l(async (e, t) => {
			if (this.mode !== "hover" || !this.active || !this.adapter) return;
			let n;
			try {
				n = await this.adapter.queryService.queryFeatures({
					pixel: e,
					lngLat: t
				}, {
					tolerancePx: g,
					includeWMS: !1
				});
			} catch (e) {
				console.warn("[info-tool] queryFeatures failed", e), n = [];
			}
			this.mode === "hover" && (this.features = n);
		}, h);
	}
	static {
		this.styles = t`
        :host {
            display: block;
            pointer-events: auto;
        }

        .info-container {
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
            padding: var(--webmapx-tool-padding, 0);
            font-size: var(--font-size-small, 0.875rem);
            min-width: 200px;
        }

        .mode-badge {
            display: inline-flex;
            align-items: center;
            gap: 0.25rem;
            font-size: 0.7rem;
            font-weight: 600;
            letter-spacing: 0.05em;
            text-transform: uppercase;
            color: var(--color-text-secondary, #5a6773);
        }

        .mode-badge.pinned {
            color: var(--color-primary, #2b6c8f);
        }

        .instructions {
            color: var(--color-text-secondary, #5a6773);
            font-size: 0.75rem;
            font-style: italic;
            margin: 0;
        }

        .streetview-link {
            font-style: normal;
            color: var(--color-primary, #2b6c8f);
            text-decoration: none;
        }

        .streetview-link:hover {
            text-decoration: underline;
        }

        .streetview-wrap {
            margin: 0.4rem 0;
        }

        .streetview-thumb {
            width: 100%;
            max-width: 300px;
            border-radius: 4px;
            display: block;
            cursor: pointer;
        }

        .streetview-caption {
            font-size: 0.7rem;
            color: var(--color-text-secondary, #5a6773);
            font-style: italic;
            margin: 0.2rem 0 0;
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
            padding: 0.3rem 0.5rem;
            color: var(--color-text-secondary, #5a6773);
            font-size: 0.8rem;
            font-style: italic;
        }

        .elevation-row {
            padding: 0.3rem 0.5rem;
            font-size: 0.8rem;
            color: var(--color-text-secondary, #5a6773);
        }

        sl-spinner {
            font-size: 0.9rem;
        }
    `;
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
		this.features = [], this.elevation = null, this.mode = "hover", this.pinnedLocation = null, this.pinnedPixel = null;
	}
	onDeactivate() {
		this.features = [], this.elevation = null, this.mode = "hover", this.pinnedLocation = null, this.pinnedPixel = null, this.removePinMarker();
	}
	handlePointerMove(e) {
		!this.active || this.mode === "pinned" || this.mapIsMoving || this.throttledHoverQuery(e.pixel, e.coords);
	}
	async handleClick(e) {
		if (!(!this.active || !this.adapter)) {
			if (this.mode === "pinned" && this.pinnedPixel) {
				let t = e.pixel[0] - this.pinnedPixel[0], n = e.pixel[1] - this.pinnedPixel[1];
				if (Math.sqrt(t * t + n * n) <= m) {
					this.unpin();
					return;
				}
			}
			this.mode = "pinned", this.pinnedLocation = e.coords, this.pinnedPixel = e.pixel, this.loading = !0, this.features = [], this.elevation = this.adapter.getElevation?.(e.coords) ?? null, this.streetviewImageUrl = null, this.streetviewPanoId = null, this.streetviewUnavailable = !1, this.updatePinMarker(e.coords);
			try {
				let t = await this.adapter.queryService.queryFeatures({
					pixel: e.pixel,
					lngLat: e.coords
				}, {
					tolerancePx: _,
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
		this.adapter && (this.pinMarkerAdded ? this.adapter.moveMarker(p, e) : (this.adapter.addMarker(p, e, { color: c }), this.pinMarkerAdded = !0));
	}
	removePinMarker() {
		this.pinMarkerAdded &&= (this.adapter?.removeMarker(p), !1);
	}
	unpin() {
		this.mode = "hover", this.pinnedLocation = null, this.pinnedPixel = null, this.features = [], this.elevation = null, this.streetviewImageUrl = null, this.streetviewPanoId = null, this.streetviewLoading = !1, this.streetviewUnavailable = !1, this.removePinMarker();
	}
	get googleApiKey() {
		let e = this.toolsConfig?.info?.googleApiKey ?? null;
		if (!e) return null;
		let t = s(e);
		return t.startsWith("{key-") ? null : t;
	}
	async loadStreetview(e) {
		let t = this.googleApiKey, [n, r] = e;
		if (t) {
			this.streetviewLoading = !0, this.streetviewImageUrl = null, this.streetviewPanoId = null, this.streetviewUnavailable = !1;
			try {
				let e = `https://maps.googleapis.com/maps/api/streetview/metadata?location=${r},${n}&key=${t}`, i = await (await fetch(e)).json();
				i.status === "OK" && i.pano_id ? (this.streetviewPanoId = i.pano_id, this.streetviewImageUrl = `https://maps.googleapis.com/maps/api/streetview?size=300x150&pano=${i.pano_id}&key=${t}`) : this.streetviewUnavailable = !0;
			} catch {
				this.streetviewUnavailable = !0;
			} finally {
				this.streetviewLoading = !1;
			}
		}
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
		return s.length === 0 ? i`<div class="empty-hint">No properties</div>` : i`<div class="props-list">${s}</div>`;
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
            <div class="info-container">
                <div class="mode-badge ${t ? "pinned" : ""}">
                    <sl-icon name=${t ? "pin-angle-fill" : "cursor"}></sl-icon>
                    ${t ? "Pinned" : "Hover"}
                    ${this.loading ? i`<sl-spinner></sl-spinner>` : e}
                </div>

                ${!t && this.features.length === 0 ? i`<p class="instructions">Move cursor over features to inspect. Click to pin and query WMS.</p>` : e}

                ${t && !this.loading && this.features.length === 0 ? i`<p class="empty-hint">No features at this location.</p>` : e}

                ${t && this.elevation !== null ? i`<div class="elevation-row">Elevation: <strong>${Math.round(this.elevation)} m</strong></div>` : e}

                ${this.renderFeatures()}

                ${t && this.pinnedLocation ? i`
                        ${this.googleApiKey ? i`
                            ${!this.streetviewImageUrl && !this.streetviewLoading && !this.streetviewUnavailable ? i`
                                <p class="instructions">
                                    <a class="streetview-link" href="#"
                                       @click=${(e) => {
			e.preventDefault(), this.loadStreetview(this.pinnedLocation);
		}}>StreetView</a>
                                    &nbsp;·&nbsp; Click same location to unpin.
                                </p>` : ""}
                            ${this.streetviewLoading ? i`<p class="instructions"><sl-spinner></sl-spinner> Loading StreetView…</p>` : ""}
                            ${this.streetviewUnavailable ? i`<p class="instructions">No StreetView at this location.</p>` : ""}
                            ${this.streetviewImageUrl ? i`
                                <div class="streetview-wrap">
                                    <a href="https://www.google.com/maps/@?api=1&amp;map_action=pano&amp;pano=${this.streetviewPanoId}"
                                       target="_blank" rel="noopener noreferrer">
                                        <img class="streetview-thumb" src="${this.streetviewImageUrl}" alt="StreetView">
                                    </a>
                                    <p class="streetview-caption">Click image for full StreetView</p>
                                </div>
                                <p class="instructions">Click same location to unpin.</p>` : ""}
                        ` : i`
                            <p class="instructions">
                                <a class="streetview-link"
                                   href="https://www.google.com/maps/@?api=1&amp;map_action=pano&amp;viewpoint=${this.pinnedLocation[1]},${this.pinnedLocation[0]}"
                                   target="_blank" rel="noopener noreferrer">StreetView</a>
                                &nbsp;·&nbsp; Click same location to unpin.
                            </p>`}
                    ` : t ? i`<p class="instructions">Click same location to unpin.</p>` : e}
            </div>
        `;
	}
};
a([n()], v.prototype, "features", void 0), a([n()], v.prototype, "loading", void 0), a([n()], v.prototype, "mode", void 0), a([n()], v.prototype, "pinnedLocation", void 0), a([n()], v.prototype, "elevation", void 0), a([n()], v.prototype, "streetviewImageUrl", void 0), a([n()], v.prototype, "streetviewPanoId", void 0), a([n()], v.prototype, "streetviewLoading", void 0), a([n()], v.prototype, "streetviewUnavailable", void 0), v = a([r("webmapx-info-tool")], v);
//#endregion
export { v as WebmapxInfoTool };
