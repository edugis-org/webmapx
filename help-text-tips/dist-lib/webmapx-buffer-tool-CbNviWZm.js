import { t as e } from "./buffer-BDDrHjXc.js";
import { c as t, h as n, i as r, o as i, p as a } from "./decorators-d8E4nZJy.js";
import { t as o } from "./decorate-Bl-DXcQA.js";
import { t as s } from "./webmapx-modal-tool-DS_L8Zce.js";
import "./alert-Dzf1BSLu.js";
import "./button-DE9ytwxI.js";
import "./checkbox-DigllOlW.js";
import "./icon-Qf3FyAAL.js";
import "./spinner-DHQKbDmr.js";
import "./input-eCCT7kEl.js";
import { t as c } from "./form-label-styles-CiXgi-FX.js";
import { c as l } from "./spatial-worker-manager-CJbIhckt.js";
import "./option-REOFPMrE.js";
//#region src/components/webmapx-buffer-tool.ts
var u = "webmapx-buffer-out:", d = "webmapx-buffer-src:", f = new Set([
	"fill",
	"line",
	"circle",
	"symbol",
	"geojson",
	"vector",
	"label",
	"fill-extrusion"
]), p = class extends s {
	constructor(...e) {
		super(...e), this.toolId = "buffer", this.availableLayers = [], this.selectedLayerId = "", this.availableSourceLayers = [], this.selectedSourceLayer = "", this.distanceMeters = 500, this.segments = 16, this.outputName = "", this.overwrite = !0, this.busy = !1, this.error = null, this.lastOutputLayerId = null, this.lastMapLayers = null, this._escHandler = null;
	}
	static {
		this.styles = [c, n`
        :host { display: block; }

        :host(:not([active])) .tool-content { display: none; }

        .tool-content {
            padding: var(--sl-spacing-medium);
            display: flex;
            flex-direction: column;
            gap: var(--sl-spacing-small);
            font-size: var(--sl-font-size-small);
            min-width: 240px;
        }

        .actions {
            display: flex;
            gap: var(--sl-spacing-x-small);
            justify-content: flex-end;
            margin-top: var(--sl-spacing-x-small);
        }

        .status {
            display: flex;
            align-items: center;
            gap: var(--sl-spacing-x-small);
            font-size: var(--sl-font-size-x-small);
            color: var(--color-text-secondary, #5a6773);
        }

        sl-alert {
            font-size: var(--sl-font-size-x-small);
        }

        sl-select, sl-input {
            --sl-input-height-medium: 28px;
            --sl-input-font-size-medium: var(--sl-font-size-small);
        }
    `];
	}
	onActivate() {
		this._escHandler = (e) => {
			e.key === "Escape" && this.deactivate();
		}, document.addEventListener("keydown", this._escHandler);
	}
	onDeactivate() {
		document.removeEventListener("keydown", this._escHandler), this._escHandler = null;
	}
	onStateChanged(e) {
		let t = e.mapLayers ?? {};
		this.lastMapLayers = t, this.availableLayers = Object.entries(t).filter(([, e]) => {
			let t = e.layerType;
			return !t || f.has(t);
		}).map(([e, t]) => ({
			id: e,
			label: t.label ?? e
		})), !this.selectedLayerId && this.availableLayers.length > 0 && (this.selectedLayerId = this.availableLayers[0].id, this.syncLayerState()), this.selectedLayerId && !this.availableLayers.find((e) => e.id === this.selectedLayerId) && (this.selectedLayerId = this.availableLayers[0]?.id ?? "", this.syncLayerState(), this.lastOutputLayerId = null, this.overwrite = !0), this.syncSourceLayers();
	}
	syncLayerState() {
		this.syncSourceLayers(), this.syncOutputName();
	}
	syncOutputName() {
		let e = this.selectedSourceLayer || this.availableLayers.find((e) => e.id === this.selectedLayerId)?.label || this.selectedLayerId;
		this.outputName = `${e} buffer`;
	}
	sourceLayers(e) {
		let t = (this.lastMapLayers ?? {})[e]?.sublayers;
		if (!Array.isArray(t)) return [];
		let n = /* @__PURE__ */ new Set(), r = (e) => {
			for (let t of e) {
				if (!t || typeof t != "object") continue;
				let e = t, i = e["source-layer"];
				typeof i == "string" && i && n.add(i), Array.isArray(e.sublayers) && r(e.sublayers);
			}
		};
		return r(t), [...n];
	}
	syncSourceLayers() {
		let e = this.sourceLayers(this.selectedLayerId);
		e.join(",") !== this.availableSourceLayers.join(",") && (this.availableSourceLayers = e, e.includes(this.selectedSourceLayer) || (this.selectedSourceLayer = e[0] ?? "", this.syncOutputName()));
	}
	get mapElement() {
		return this.mapHost;
	}
	handleLayerChange(e) {
		this.selectedLayerId = e.target.value, this.syncLayerState(), this.error = null, this.lastOutputLayerId = null, this.overwrite = !0;
	}
	handleSourceLayerChange(e) {
		this.selectedSourceLayer = e.target.value, this.syncOutputName();
	}
	handleDistanceChange(e) {
		let t = parseFloat(e.target.value);
		isNaN(t) || (this.distanceMeters = t);
	}
	handleSegmentsChange(e) {
		let t = parseInt(e.target.value);
		!isNaN(t) && t >= 4 && (this.segments = t);
	}
	handleOutputNameChange(e) {
		this.outputName = e.target.value;
	}
	handleOverwriteChange(e) {
		this.overwrite = e.target.checked;
	}
	async handleRun() {
		if (!(!this.adapter || !this.selectedLayerId || this.busy)) {
			this.busy = !0, this.error = null;
			try {
				let e = this.selectedSourceLayer ? { sourceLayer: this.selectedSourceLayer } : void 0, t = await this.adapter.queryLayerFeatures(this.selectedLayerId, e);
				if (!t.features.length) {
					this.error = "Selected layer has no features (try zooming in for vector tile layers).";
					return;
				}
				let n = this.adapter?.getViewportState().center[1] ?? 0, r = await l({
					op: "buffer",
					input: t,
					distanceMeters: this.distanceMeters,
					segments: this.segments,
					centerLat: n
				});
				if (!r.features.length) {
					this.error = "Buffer produced no output features.";
					return;
				}
				let i = `${u}${this.selectedLayerId}`, a = `${d}${this.selectedLayerId}`, o = this.overwrite ? "" : `-${Date.now()}`, s = `${i}${o}`, c = `${a}${o}`, f = this.outputName.trim() || `${this.availableLayers.find((e) => e.id === this.selectedLayerId)?.label ?? "layer"} buffer`;
				if (this.overwrite && this.lastOutputLayerId && this.mapElement) {
					this.adapter?.getSource(c)?.setData({
						type: "FeatureCollection",
						features: []
					});
					try {
						this.mapElement.removeInlineLayer(this.lastOutputLayerId);
					} catch {}
				}
				let p = {
					id: s,
					type: "fill",
					source: c,
					sources: { [c]: {
						id: c,
						type: "geojson",
						data: r
					} },
					paint: {
						"fill-color": "#4a90d9",
						"fill-opacity": .35,
						"fill-outline-color": "#1a5fa8"
					},
					metadata: {
						label: f,
						dynamic: !0,
						legendRole: "overlay"
					}
				};
				await this.mapElement?.addLayerRequest(p), this.lastOutputLayerId = p.id;
			} catch (e) {
				this.error = e instanceof Error ? e.message : String(e);
			} finally {
				this.busy = !1;
			}
		}
	}
	render() {
		let n = this.availableLayers.length > 0;
		return a`
            <div class="tool-content">

                <sl-select
                    label="Input layer"
                    size="small"
                    value=${this.selectedLayerId}
                    ?disabled=${!n || this.busy}
                    @sl-change=${this.handleLayerChange}
                >
                    ${n ? this.availableLayers.map((e) => a`
                            <sl-option value=${e.id}>${e.label}</sl-option>
                        `) : a`<sl-option value="">No vector layers</sl-option>`}
                </sl-select>

                ${this.availableSourceLayers.length > 1 ? a`
                    <sl-select
                        label="Sub-layer"
                        size="small"
                        value=${this.selectedSourceLayer}
                        ?disabled=${this.busy}
                        @sl-change=${this.handleSourceLayerChange}
                    >
                        ${this.availableSourceLayers.map((e) => a`
                            <sl-option value=${e}>${e}</sl-option>
                        `)}
                    </sl-select>
                ` : t}

                <div>
                    <sl-input
                        label="Buffer distance"
                        size="small"
                        type="number"
                        step="100"
                        value=${this.distanceMeters}
                        ?disabled=${this.busy}
                        @sl-change=${this.handleDistanceChange}
                    >
                        <span slot="suffix">m</span>
                    </sl-input>
                </div>

                <sl-input
                    label="Segments per quarter circle"
                    size="small"
                    type="number"
                    min="4"
                    max="64"
                    step="4"
                    value=${this.segments}
                    ?disabled=${this.busy}
                    @sl-change=${this.handleSegmentsChange}
                ></sl-input>

                <sl-input
                    label="Output layer name"
                    size="small"
                    .value=${this.outputName}
                    ?disabled=${this.busy}
                    @sl-change=${this.handleOutputNameChange}
                ></sl-input>

                ${this.lastOutputLayerId ? a`
                    <sl-checkbox
                        size="small"
                        ?checked=${this.overwrite}
                        ?disabled=${this.busy}
                        @sl-change=${this.handleOverwriteChange}
                    >Replace previous buffer output</sl-checkbox>
                ` : t}

                ${this.error ? a`
                    <sl-alert variant="danger" open>
                        <sl-icon slot="icon" name="exclamation-octagon"></sl-icon>
                        ${this.error}
                    </sl-alert>
                ` : t}

                <div class="actions">
                    ${this.busy ? a`
                        <div class="status">
                            <sl-spinner></sl-spinner>
                            Computing buffer…
                        </div>
                    ` : t}
                    <sl-button
                        size="small"
                        variant="primary"
                        ?disabled=${!n || this.busy}
                        @click=${this.handleRun}
                    >
                        <sl-icon slot="prefix" src="${e}"></sl-icon>
                        Buffer
                    </sl-button>
                </div>

            </div>
        `;
	}
};
o([r()], p.prototype, "availableLayers", void 0), o([r()], p.prototype, "selectedLayerId", void 0), o([r()], p.prototype, "availableSourceLayers", void 0), o([r()], p.prototype, "selectedSourceLayer", void 0), o([r()], p.prototype, "distanceMeters", void 0), o([r()], p.prototype, "segments", void 0), o([r()], p.prototype, "outputName", void 0), o([r()], p.prototype, "overwrite", void 0), o([r()], p.prototype, "busy", void 0), o([r()], p.prototype, "error", void 0), o([r()], p.prototype, "lastOutputLayerId", void 0), p = o([i("webmapx-buffer-tool")], p);
//#endregion
export { p as WebmapxBufferTool };
