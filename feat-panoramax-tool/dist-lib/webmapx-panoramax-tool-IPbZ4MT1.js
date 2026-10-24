import { c as e, h as t, i as n, o as r, p as i } from "./decorators-d8E4nZJy.js";
import { t as a } from "./decorate-Dbo3QKbS.js";
import { t as o } from "./webmapx-base-tool-D0BchkqJ.js";
import "./button-BmvunzcI.js";
import "./icon-Qf3FyAAL.js";
import "./icon-button-ByffBw_f.js";
import "./spinner-BnB3OpDj.js";
import { i as s } from "./data-colors-BglhXRFr.js";
import { t as c } from "./help-text-styles-BFw9dhCq.js";
import { t as l } from "./announce-DxxaToE8.js";
import { t as u } from "./touch-pointer-CXtXj6Ie.js";
var d = "https://api.panoramax.xyz/";
function f(e, [t, n], r = 50) {
	return `${e.replace(/\/+$/, "")}/search?${new URLSearchParams({
		place_position: `${t},${n}`,
		place_distance: `0-${Math.max(1, Math.round(r))}`,
		limit: "1"
	})}`;
}
function p(e, t, [n, r]) {
	let i = new URL(e);
	return i.searchParams.set("pic", t), i.searchParams.set("focus", "pic"), i.searchParams.set("map", `18/${r}/${n}`), i.toString();
}
function m(e) {
	return e && typeof e == "object" && !Array.isArray(e) ? e : null;
}
function h(e, t) {
	let n = m(e?.[t])?.href;
	return typeof n == "string" && /^https?:\/\//.test(n) ? n : null;
}
function g(e, t = d) {
	let n = m(e)?.features, r = Array.isArray(n) ? m(n[0]) : null;
	if (!r || typeof r.id != "string") return null;
	let i = m(r.geometry)?.coordinates;
	if (!Array.isArray(i) || typeof i[0] != "number" || typeof i[1] != "number") return null;
	let a = [i[0], i[1]], o = m(r.assets), s = m(r.properties) ?? {}, c = h(o, "thumb") ?? (typeof s["geovisio:thumbnail"] == "string" ? s["geovisio:thumbnail"] : null);
	if (!c) return null;
	let l = Array.isArray(r.links) ? r.links.map(m) : [], u = l.find((e) => e?.rel === "license"), f = l.find((e) => e?.rel === "via"), g = (Array.isArray(r.providers) ? r.providers : []).map(m).filter((e) => Array.isArray(e?.roles) && e.roles.includes("producer") && typeof e.name == "string").map((e) => e.name), _ = typeof f?.href == "string" ? new URL(f.href).hostname : null;
	return {
		id: r.id,
		position: a,
		thumbUrl: c,
		largeUrl: h(o, "sd") ?? c,
		takenAt: typeof s.datetime == "string" ? s.datetime : null,
		credit: g.length ? [...new Set(g)].join(", ") : _ ?? "Panoramax",
		licence: typeof s.license == "string" ? s.license : null,
		licenceUrl: typeof u?.href == "string" && /^https?:\/\//.test(u.href) ? u.href : null,
		viewerUrl: p(t, r.id, a)
	};
}
//#endregion
//#region src/components/webmapx-panoramax-tool.ts
var _ = "webmapx-panoramax-spot", v = class extends o {
	constructor(...e) {
		super(...e), this.active = !1, this.status = "idle", this.photo = null, this.touch = new u(this), this.markerAdded = !1, this.unsubClick = null, this.requestNo = 0;
	}
	get toolTip() {
		return this.status === "idle" ? `${this.touch.click} a road or path on the map to see a street photo of it.` : `${this.touch.click} another spot to see a photo there.`;
	}
	handleEscape() {
		let e = this.dialog;
		return e?.open ? (e.close(), !0) : !1;
	}
	static {
		this.styles = [c, t`
        :host {
            display: block;
            pointer-events: auto;
        }

        .panoramax {
            display: flex;
            flex-direction: column;
            gap: var(--webmapx-space-md, 0.75rem);
            padding: var(--webmapx-tool-padding, 0);
            font-size: var(--font-size-small, 0.875rem);
        }

        .status {
            display: flex;
            align-items: center;
            gap: var(--webmapx-space-sm, 0.5rem);
            margin: 0;
        }

        .thumb-button {
            display: block;
            width: 100%;
            padding: 0;
            border: 0;
            background: none;
            cursor: zoom-in;
            border-radius: 4px;
        }

        .thumb-button:focus-visible {
            outline: var(--webmapx-focus-ring-width, 2px) solid var(--webmapx-focus-ring-color, var(--color-primary, #2b6c8f));
            outline-offset: 2px;
        }

        .thumb-button img {
            display: block;
            width: 100%;
            aspect-ratio: 3 / 2;
            object-fit: cover;
            border-radius: 4px;
            background: var(--color-surface-raised, #f4f6f8);
        }

        .credit {
            margin: 0;
            font-size: 0.75rem;
            color: var(--color-text-secondary, #5a6773);
        }

        .credit a {
            color: inherit;
        }

        /* A native dialog sits in the browser's top layer, so a translucent
           panel (backdrop-filter) cannot trap it inside its own box. */
        dialog {
            width: min(860px, calc(100vw - 2rem));
            padding: var(--webmapx-space-md, 0.75rem);
            border: 1px solid var(--color-border-light, #e2e7ec);
            border-radius: var(--webmapx-radius-md, 8px);
            background: var(--color-surface, #fff);
            color: var(--color-text, #1d2a36);
            box-shadow: var(--webmapx-shadow-lg, 0 10px 30px rgba(0, 0, 0, 0.25));
        }

        dialog::backdrop {
            background: rgba(0, 0, 0, 0.45);
        }

        .dialog-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: var(--webmapx-space-sm, 0.5rem);
        }

        .dialog-header h3 {
            margin: 0;
            font-size: 1rem;
        }

        .large {
            display: block;
            width: 100%;
            max-height: 70vh;
            object-fit: contain;
            border-radius: 4px;
            background: var(--color-surface-raised, #f4f6f8);
        }

        .dialog-footer {
            display: flex;
            align-items: center;
            justify-content: space-between;
            flex-wrap: wrap;
            gap: var(--webmapx-space-sm, 0.5rem);
            margin-top: var(--webmapx-space-md, 0.75rem);
        }

        sl-spinner {
            font-size: 0.9rem;
        }
    `];
	}
	onMapAttached(e) {
		super.onMapAttached(e), this.unsubClick = e.events.on("click", (e) => {
			this.handleClick(e);
		});
	}
	onMapDetached() {
		this.unsubClick?.(), this.unsubClick = null, super.onMapDetached();
	}
	disconnectedCallback() {
		this.removeMarker(), super.disconnectedCallback();
	}
	activate() {
		this.active = !0, this.style.display = "block";
	}
	deactivate() {
		this.active = !1, this.style.display = "none", this.dialog?.close(), this.requestNo++, this.status = "idle", this.photo = null, this.removeMarker();
	}
	onStateChanged(e) {}
	get settings() {
		let e = this.toolsConfig?.panoramax ?? {};
		return {
			apiUrl: e.apiUrl || "https://api.panoramax.xyz/api",
			viewerUrl: e.viewerUrl || "https://api.panoramax.xyz/",
			searchDistance: e.searchDistance ?? 50
		};
	}
	async handleClick(e) {
		if (!this.active || !this.adapter) return;
		let t = ++this.requestNo, n = e.coords;
		this.updateMarker(n), this.status = "loading", this.photo = null;
		let { apiUrl: r, viewerUrl: i, searchDistance: a } = this.settings, o;
		try {
			let e = await fetch(f(r, n, a));
			if (!e.ok) throw Error(`HTTP ${e.status}`);
			o = g(await e.json(), i);
		} catch (e) {
			if (t !== this.requestNo) return;
			console.warn("[panoramax-tool] search failed", e), this.status = "error", l(this, "Panoramax could not be reached");
			return;
		}
		t === this.requestNo && (this.photo = o, this.status = o ? "found" : "none", l(this, o ? `Street photo found, by ${o.credit}` : "No street photos here"));
	}
	updateMarker(e) {
		this.adapter && (this.markerAdded ? this.adapter.moveMarker(_, e) : (this.adapter.addMarker(_, e, { color: s }), this.markerAdded = !0));
	}
	removeMarker() {
		this.markerAdded &&= (this.adapter?.removeMarker(_), !1);
	}
	get dialog() {
		return this.shadowRoot?.querySelector("dialog") ?? null;
	}
	renderCredit(t) {
		let n = t.takenAt ? new Date(t.takenAt) : null, r = n && !Number.isNaN(n.getTime()) ? n.toLocaleDateString(void 0, {
			year: "numeric",
			month: "long",
			day: "numeric"
		}) : null;
		return i`
            <p class="credit">
                Photo: ${t.credit}${r ? i`, ${r}` : e}
                ${t.licence ? i` · ${t.licenceUrl ? i`<a href=${t.licenceUrl} target="_blank" rel="noopener noreferrer">${t.licence}</a>` : t.licence}` : e}
            </p>`;
	}
	renderOpenButton(e) {
		return i`
            <sl-button size="small" href=${e.viewerUrl} target="_blank" rel="noopener noreferrer"
                title="Open this photo in the Panoramax viewer in a new tab, to look around and walk on">
                <sl-icon name="box-arrow-up-right" slot="suffix" label="opens in a new tab"></sl-icon>
                Open in Panoramax
            </sl-button>`;
	}
	render() {
		let t = this.photo;
		return i`
            <div class="panoramax">
                ${this.status === "loading" ? i`
                    <p class="status help-text"><sl-spinner></sl-spinner> Looking for photos…</p>` : e}
                ${this.status === "none" ? i`
                    <p class="status help-text">No street photos here. Photos are mostly taken along roads and paths.</p>` : e}
                ${this.status === "error" ? i`
                    <p class="status help-text">Panoramax could not be reached. Try again in a moment.</p>` : e}
                ${t ? i`
                    <button type="button" class="thumb-button" aria-haspopup="dialog"
                        title="Enlarge the photo" @click=${() => this.dialog?.showModal()}>
                        <img src=${t.thumbUrl} alt="Street photo near this spot, select to enlarge">
                    </button>
                    ${this.renderCredit(t)}
                    <div>${this.renderOpenButton(t)}</div>

                    <dialog aria-labelledby="panoramax-dialog-title">
                        <div class="dialog-header">
                            <h3 id="panoramax-dialog-title">Street photo</h3>
                            <sl-icon-button name="x-lg" label="Close" @click=${() => this.dialog?.close()}></sl-icon-button>
                        </div>
                        <img class="large" src=${t.largeUrl} alt="Street photo near this spot">
                        <div class="dialog-footer">
                            ${this.renderCredit(t)}
                            ${this.renderOpenButton(t)}
                        </div>
                    </dialog>
                ` : e}
            </div>
        `;
	}
};
a([n()], v.prototype, "status", void 0), a([n()], v.prototype, "photo", void 0), v = a([r("webmapx-panoramax-tool")], v);
//#endregion
export { v as WebmapxPanoramaxTool };
