import { c as e, h as t, i as n, o as r, p as i } from "./decorators-d8E4nZJy.js";
import { r as a, t as o } from "./decorate-Bl-DXcQA.js";
import { t as s } from "./webmapx-base-tool-Zh-Gv2m6.js";
import { n as c } from "./info-toggle-tL04Yu0p.js";
import { t as l } from "./form-label-styles-CiXgi-FX.js";
import { t as u } from "./engine-labels-PQywGOyZ.js";
import { t as d } from "./help-text-styles-BFw9dhCq.js";
import "./option-REOFPMrE.js";
import { a as f, i as p, n as m, o as h, t as g } from "./view-projections-C5IjVhUX.js";
//#region src/components/webmapx-projection-tool.ts
var _ = "globe", v = "mercator", y = "In this projection your browser redraws the background map, so it may look softer and its labels less tidy.", b = {
	id: _,
	label: "Globe",
	description: "The Earth as a sphere. Nothing is distorted, because nothing is flattened — but only one side is visible at a time.",
	equalArea: !0,
	rendering: !0
}, x = {
	id: v,
	label: "Mercator (flat)",
	description: "The usual web map. Shapes and angles are right everywhere, areas are inflated towards the poles.",
	equalArea: !1,
	rendering: !0
};
function S(e) {
	return e.flatMap((e) => {
		if (e === _) return [b];
		if (e === v) return [x];
		let t = m.find((t) => t.id === e);
		return t ? [{
			id: t.id,
			label: t.label,
			description: t.description,
			equalArea: t.equalArea,
			rendering: !1
		}] : [];
	});
}
function C(e) {
	let [t, n] = h(e), r = (e) => `${Math.abs(Math.round(e))}°${e < 0 ? "S" : "N"}`;
	return n >= 89.9 ? `Covers latitudes north of ${r(t)}` : t <= -89.9 ? `Covers latitudes south of ${r(n)}` : `Covers ${r(t)} to ${r(n)}`;
}
var w = class extends s {
	constructor(...e) {
		super(...e), this.selectedId = g, this.engineId = "", this.viewIds = [], this.supported = null, this.applyingOwnChange = !1;
	}
	static {
		this.styles = [
			l,
			d,
			t`
        :host { display: block; padding: var(--webmapx-tool-padding, 0); font-size: 0.875rem; }
        .unsupported { color: var(--color-text-muted, #6b7681); font-style: italic; }
        label { display: block; font-weight: 600; margin-bottom: 0.25rem; }
        sl-select { width: 100%; }
        .fixed { font-weight: 600; }
        .description { margin-top: 0.5rem; }
        .badge {
            display: inline-block;
            margin-top: 0.5rem;
            padding: 0.1rem 0.4rem;
            border-radius: 4px;
            font-size: 0.75rem;
            background: var(--color-surface-sunken, rgba(0, 0, 0, 0.06));
        }
        .badge.equal-area { color: var(--color-success, #1a7f37); }
        .note { margin-top: 0.75rem; }
    `
		];
	}
	onMapAttached() {
		this.engineId = this.adapter?.engineId ?? "", this.viewIds = this.adapter?.getViewProjections() ?? [], this.readProjection(this.adapter?.store.getState().mapProjection);
	}
	onStateChanged(e) {
		this.applyingOwnChange || this.readProjection(e.mapProjection);
	}
	readProjection(e) {
		if (e === void 0) return;
		if (e === null) {
			this.supported = !1;
			return;
		}
		this.supported = !0;
		let t = e.name, n = S(this.viewIds), r = n.find((e) => e.id === t) ?? (p(t) ? n.find((e) => e.id === p(t).id) : void 0);
		r && (this.selectedId = r.id);
	}
	apply(e) {
		this.selectedId = e;
		let t = S(this.viewIds).find((t) => t.id === e);
		this.applyingOwnChange = !0;
		try {
			if (t?.rendering) {
				let t = a(this);
				if (t?.setProjection) {
					t.setProjection(e);
					return;
				}
			}
			this.adapter?.setProjection(e) || this.readProjection(this.adapter?.getProjection());
		} finally {
			this.applyingOwnChange = !1;
		}
	}
	render() {
		let t = S(this.viewIds);
		if (t.length === 0) return i`<div class="unsupported">
                How this map is drawn cannot be changed${this.engineId ? i` on the ${u(this.engineId)} engine` : e}.
            </div>`;
		let n = t.length === 1, r = t.find((e) => e.id === this.selectedId) ?? t[0], a = !r.rendering && r.id !== "EPSG:3857", o = p(r.id);
		return i`
            ${n ? i`<div class="fixed">${r.label}</div>` : i`<div class="field-with-info"><sl-select id="projection-select" size="small" hoist
                                label="Projection"
                                .value=${r.id}
                                @sl-change=${(e) => this.apply(e.target.value)}>
                    ${t.map((e) => i`
                        <sl-option value=${e.id}>${e.label}</sl-option>`)}
                  </sl-select>${a ? c("Projection", y) : e}</div>`}
            <div class="description help-text">${r.description}</div>
            <div class="badge ${r.equalArea ? "equal-area" : ""}">
                ${r.equalArea ? "Areas are comparable" : "Areas are distorted"}
            </div>
            ${o && f(r.id) ? i`<div class="badge">${C(r.id)}</div>` : e}
            ${n ? i`<div class="note help-text">
                    The ${u(this.engineId)} engine can only draw this projection. To compare
                    projections, switch to OpenLayers in Settings.
                  </div>` : e}
            ${n && a ? i`<div class="note help-text">${y}</div>` : e}
        `;
	}
};
o([n()], w.prototype, "selectedId", void 0), o([n()], w.prototype, "engineId", void 0), o([n()], w.prototype, "viewIds", void 0), o([n()], w.prototype, "supported", void 0), w = o([r("webmapx-projection-tool")], w);
//#endregion
export { w as WebmapxProjectionTool, S as viewOptionsFor };
