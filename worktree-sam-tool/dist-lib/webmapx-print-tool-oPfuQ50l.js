import { h as e, i as t, o as n, p as r } from "./decorators-d8E4nZJy.js";
import { r as i, t as a } from "./decorate-CjQrowRB.js";
import { t as o } from "./webmapx-modal-tool-BYZX-Eb9.js";
import "./button-DE9ytwxI.js";
import "./checkbox-DigllOlW.js";
import "./spinner-DHQKbDmr.js";
import "./input-eCCT7kEl.js";
import { t as s } from "./form-label-styles-CiXgi-FX.js";
import { i as c, n as l, t as u } from "./attribution-format-BnXMQyW7.js";
import "./option-C8qYanYH.js";
//#region src/components/webmapx-print-tool.ts
var d = 210, f = 297, p = 40, m = 10, h = 50, g = 12, _ = 6, v = 96 / 25.4;
function y(e) {
	return e * v;
}
function b(e) {
	return e.startsWith("landscape");
}
function x(e) {
	return e.endsWith("_with_legend");
}
function S(e) {
	return {
		w: (b(e) ? f : d) - 2 * m - (x(e) ? h : 0),
		h: (b(e) ? d : f) - 2 * m
	};
}
var C = class extends o {
	constructor(...e) {
		super(...e), this.toolId = "print", this.mapTitle = "", this.format = "portrait", this.addLink = !1, this.printing = !1, this.errorMsg = "", this.zoomDelta = 0, this.printBoxEl = null, this.resizeObserver = null;
	}
	static {
		this.styles = [s, e`
        :host { display: block; font-size: var(--sl-font-size-small); }
        .tool-content {
            padding: var(--webmapx-tool-panel-padding, 12px);
            display: flex; flex-direction: column; gap: 12px; min-width: 220px;
        }
        .description { color: var(--color-text-secondary, #5a6773); margin: 0; line-height: 1.4; }
        .field { display: flex; flex-direction: column; gap: 4px; }
        .error { color: var(--sl-color-danger-600); font-size: var(--sl-font-size-x-small); margin: 0; }
        .warning {
            font-size: var(--sl-font-size-x-small);
            color: var(--sl-color-warning-800, #854d0e);
            background: var(--sl-color-warning-50, #fefce8);
            border: 1px solid var(--sl-color-warning-200, #fef08a);
            border-radius: var(--sl-border-radius-small);
            padding: 6px 8px;
            margin: 0;
            line-height: 1.4;
        }
        .busy { display: flex; align-items: center; gap: 8px; color: var(--color-text-secondary, #5a6773); }
    `];
	}
	onActivate() {
		let e = i(this);
		if (!e) return;
		this.printBoxEl = document.createElement("div"), this.printBoxEl.className = "webmapx-print-box", Object.assign(this.printBoxEl.style, {
			position: "absolute",
			boxSizing: "border-box",
			backgroundImage: [
				"repeating-linear-gradient(90deg, #fff 0, #fff 6px, #000 6px, #000 12px)",
				"repeating-linear-gradient(90deg, #fff 0, #fff 6px, #000 6px, #000 12px)",
				"repeating-linear-gradient(0deg,  #fff 0, #fff 6px, #000 6px, #000 12px)",
				"repeating-linear-gradient(0deg,  #fff 0, #fff 6px, #000 6px, #000 12px)"
			].join(","),
			backgroundSize: "12px 2px, 12px 2px, 2px 12px, 2px 12px",
			backgroundPosition: "0 0, 0 100%, 0 0, 100% 0",
			backgroundRepeat: "repeat-x, repeat-x, repeat-y, repeat-y",
			boxShadow: "0 0 0 9999px rgba(0,0,0,0.35)",
			pointerEvents: "none"
		});
		let t = e.querySelector("webmapx-layout");
		e.insertBefore(this.printBoxEl, t ?? e.firstChild), this.resizeObserver = new ResizeObserver(() => this.updateBox()), this.resizeObserver.observe(e), this.updateBox();
	}
	onDeactivate() {
		this.printBoxEl?.remove(), this.printBoxEl = null, this.resizeObserver?.disconnect(), this.resizeObserver = null;
	}
	onStateChanged() {
		this.updateBox();
	}
	updateBox() {
		let e = i(this);
		if (!this.printBoxEl || !e) return;
		let t = e.clientWidth, n = e.clientHeight, r = t - 2 * p, a = n - 2 * p, o = S(this.format), s = y(o.w), c = y(o.h) - (this.mapTitle.trim() ? y(g) : 0) - (this.addLink ? y(_) : 0), l, u;
		if (s <= r && c <= a) l = s, u = c, this.zoomDelta = 0;
		else {
			let e = Math.min(r / s, a / c);
			l = s * e, u = c * e, this.zoomDelta = Math.log2(s / l);
		}
		Object.assign(this.printBoxEl.style, {
			left: `${(t - l) / 2}px`,
			top: `${(n - u) / 2}px`,
			width: `${l}px`,
			height: `${u}px`
		});
	}
	async handlePrint() {
		this.printing = !0, this.errorMsg = "";
		try {
			await this.renderAndPrint();
		} catch (e) {
			this.errorMsg = e instanceof Error ? e.message : "Print failed", console.error("[print-tool]", e);
		} finally {
			this.printing = !1;
		}
	}
	async renderAndPrint() {
		let e = this.adapter;
		if (!e) throw Error("No map adapter available.");
		let t = i(this), n = this.format, r = b(n), a = x(n), o = y(r ? f : d), s = y(r ? d : f), c = y(m), l = this.mapTitle.trim() ? y(g) : 0, u = this.addLink ? y(_) : 0, p = a ? y(h) : 0, v = S(n), C = y(v.w), w = y(v.h) - l - u, T = t.getBoundingClientRect(), E = this.printBoxEl.getBoundingClientRect(), D = E.left - T.left, O = E.top - T.top, k = E.width, A = typeof e.renderPrintMap == "function", j = document.createElement("div");
		if (j.id = "webmapx-print-overlay", Object.assign(j.style, {
			position: "fixed",
			top: "-99999px",
			left: "0",
			width: o + "px",
			height: s + "px",
			background: A ? "white" : "transparent",
			display: "flex",
			flexDirection: "column",
			padding: c + "px",
			boxSizing: "border-box",
			fontFamily: "sans-serif"
		}), l) {
			let e = document.createElement("div");
			e.textContent = this.mapTitle.trim(), Object.assign(e.style, {
				height: l + "px",
				lineHeight: l + "px",
				fontSize: "16px",
				fontWeight: "bold",
				flexShrink: "0",
				background: "white"
			}), j.appendChild(e);
		}
		let M = [], N = document.createElement("div");
		Object.assign(N.style, {
			display: "flex",
			gap: a ? "8px" : "0",
			height: w + "px",
			flexShrink: "0"
		});
		let P = document.createElement("div");
		if (Object.assign(P.style, {
			width: C + "px",
			height: w + "px",
			flexShrink: "0",
			overflow: "hidden",
			background: "transparent"
		}), N.appendChild(P), a) {
			let e = document.createElement("div");
			Object.assign(e.style, {
				width: p - 8 + "px",
				height: w + "px",
				flexShrink: "0",
				overflow: "hidden",
				paddingLeft: "6px",
				borderLeft: "1px solid #ddd",
				boxSizing: "border-box",
				display: "flex",
				flexDirection: "column",
				background: "white"
			});
			let t = document.createElement("div");
			t.textContent = "Legend", Object.assign(t.style, {
				fontWeight: "600",
				fontSize: "8px",
				letterSpacing: "0.06em",
				textTransform: "uppercase",
				color: "#555",
				marginBottom: "4px",
				flexShrink: "0"
			}), e.appendChild(t);
			let n = this.store?.getState()?.mapLayers ?? {};
			for (let [t, r] of Object.entries(n).reverse()) {
				if (r.hideFromLegend === !0 || r.legendExpandMode === "collapsed" || r.visible === !1) continue;
				let n = typeof r.label == "string" && r.label ? r.label : t, i = document.createElement("div");
				i.textContent = n, Object.assign(i.style, {
					fontSize: "13px",
					fontWeight: "700",
					color: "#111827",
					marginTop: "4px",
					marginBottom: "1px",
					flexShrink: "0",
					overflow: "hidden",
					textOverflow: "ellipsis",
					whiteSpace: "nowrap"
				}), e.appendChild(i);
				let a = document.createElement("webmapx-layer-legend");
				a.setAttribute("layer-id", t), a.collapsible = !1, Object.assign(a.style, {
					display: "block",
					marginBottom: "6px",
					flexShrink: "0"
				}), e.appendChild(a), M.push(a);
			}
			N.appendChild(e);
		}
		j.appendChild(N);
		let F = this.buildAttributionText();
		if (F) {
			let e = document.createElement("div");
			e.textContent = F, Object.assign(e.style, {
				flexShrink: "0",
				textAlign: "left",
				fontSize: "7px",
				lineHeight: "1.4",
				color: "#444",
				fontFamily: "sans-serif",
				paddingTop: "3px"
			}), j.appendChild(e);
		}
		if (u) {
			let e = document.createElement("div"), t = document.createElement("a");
			t.href = window.location.href, t.textContent = window.location.href, e.appendChild(t), Object.assign(e.style, {
				height: u + "px",
				lineHeight: u + "px",
				fontSize: "9px",
				flexShrink: "0",
				background: "white"
			}), j.appendChild(e);
		}
		document.body.appendChild(j), M.length > 0 && (await Promise.all(M.map((e) => e.updateComplete ?? Promise.resolve())), await Promise.all(M.map((e) => e.updateComplete ?? Promise.resolve())), await Promise.all(M.map((e) => {
			let t = e.shadowRoot ?? e, n = Array.from(t.querySelectorAll("img"));
			return Promise.all(n.map((e) => e.complete ? Promise.resolve() : new Promise((t) => {
				e.onload = () => t(), e.onerror = () => t();
			})));
		})));
		let I = () => {}, L;
		if (A) {
			try {
				I = await e.renderPrintMap(P, {
					center: [D + k / 2, O + E.height / 2],
					scale: C / k
				});
			} catch (e) {
				throw j.remove(), e;
			}
			L = `
  body > * { display: none !important; }
  #webmapx-print-overlay { display: flex !important; position: fixed !important; top: 0 !important; left: 0 !important; }
  #${t.id} > .webmapx-print-box { display: none !important; }`;
		} else {
			let e = C / k, n = c, r = c + l, i = T.width, a = T.height, o = O, s = i - D - k, u = a - O - E.height, d = D;
			L = `
  body > * { visibility: hidden !important; }
  #${t.id} {
    visibility: visible !important;
    position: fixed !important; top: 0 !important; left: 0 !important;
    width: ${i}px !important; height: ${a}px !important;
    transform-origin: 0 0 !important;
    transform: translate(${n}px,${r}px) scale(${e}) translate(${-D}px,${-O}px) !important;
    clip-path: inset(${o}px ${s}px ${u}px ${d}px) !important;
  }
  #${t.id} * { visibility: visible !important; }
  #${t.id} > .webmapx-print-box { display: none !important; }
  webmapx-layout { display: none !important; }
  #webmapx-print-overlay { display: flex !important; visibility: visible !important; position: fixed !important; top: 0 !important; left: 0 !important; background: transparent !important; }
  #webmapx-print-overlay * { visibility: visible !important; }`;
		}
		let R = document.createElement("style");
		R.id = "webmapx-print-style", R.textContent = `
@media print {
  @page { size: A4 ${r ? "landscape" : "portrait"}; margin: 0; }
  html, body { margin: 0 !important; padding: 0 !important; overflow: hidden !important; background: white !important; }
  ${L}
}`, document.head.appendChild(R), window.addEventListener("afterprint", () => {
			R.remove(), I(), j.remove();
		}, { once: !0 }), requestAnimationFrame(() => requestAnimationFrame(() => window.print()));
	}
	buildAttributionText() {
		let e = this.layerDataConfig, t = this.store?.getState()?.mapLayers ?? {}, n = /* @__PURE__ */ new Map(), r = /* @__PURE__ */ new Map();
		if (e) {
			for (let t of e.sources ?? []) n.set(t.id, t);
			for (let t of e.layers ?? []) r.set(t.id, t);
		}
		return u(Object.entries(t).filter(([, e]) => e.visible !== !1).map(([e, t]) => ({
			catalogLayer: r.get(e),
			entryAttribution: typeof t.attribution == "string" ? t.attribution : void 0,
			sourceId: typeof t.sourceId == "string" ? t.sourceId : void 0
		})), n, (e) => this.adapter?.getSourceAttribution?.(e)).map((e) => l(c(e)).trim()).join(" • ");
	}
	render() {
		return r`
            <div class="tool-content">
                <p class="description">Position the map inside the box, then click Print to save as PDF.</p>
                <div class="field">
                    <sl-input id="print-title" size="small" label="Title" placeholder="Map title"
                        .value=${this.mapTitle}
                        @sl-input=${(e) => {
			this.mapTitle = e.target.value, this.updateBox();
		}}
                    ></sl-input>
                </div>
                <div class="field">
                    <sl-select id="print-format" size="small" label="Format" .value=${this.format}
                        @sl-change=${(e) => {
			this.format = e.target.value, this.updateBox();
		}}
                    >
                        <sl-option value="portrait">Portrait</sl-option>
                        <sl-option value="landscape">Landscape</sl-option>
                        <sl-option value="portrait_with_legend">Portrait with legend</sl-option>
                        <sl-option value="landscape_with_legend">Landscape with legend</sl-option>
                    </sl-select>
                </div>
                <sl-checkbox size="small"
                    ?checked=${this.addLink}
                    @sl-change=${(e) => {
			this.addLink = e.target.checked, this.updateBox();
		}}
                >Add viewer link</sl-checkbox>
                ${Math.abs(this.zoomDelta) > .05 ? r`
                    <p class="warning">
                        <strong>Note:</strong> The print zoom differs from the screen zoom
                        (${this.zoomDelta > 0 ? "+" : ""}${this.zoomDelta.toFixed(1)} levels).
                        Labels and zoom-dependent layers may look different in the print.
                    </p>` : ""}
                ${this.printing ? r`<div class="busy"><sl-spinner></sl-spinner> Rendering map…</div>` : r`<sl-button variant="primary" size="small" @click=${this.handlePrint}>Print</sl-button>`}
                ${this.errorMsg ? r`<p class="error">${this.errorMsg}</p>` : ""}
            </div>
        `;
	}
};
a([t()], C.prototype, "mapTitle", void 0), a([t()], C.prototype, "format", void 0), a([t()], C.prototype, "addLink", void 0), a([t()], C.prototype, "printing", void 0), a([t()], C.prototype, "errorMsg", void 0), a([t()], C.prototype, "zoomDelta", void 0), C = a([n("webmapx-print-tool")], C);
//#endregion
export { C as WebmapxPrintTool };
