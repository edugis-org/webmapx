import { d as e, p as t } from "./decorators-d8E4nZJy.js";
import "./button-DE9ytwxI.js";
//#region src/components/step-button.ts
var n = e`<svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" focusable="false">
    <path d="M10 2.5 4.5 8l5.5 5.5" fill="none" stroke="currentColor" stroke-width="2"
        stroke-linecap="round" stroke-linejoin="round"/>
</svg>`, r = e`<svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" focusable="false">
    <path d="M6 2.5 11.5 8 6 13.5" fill="none" stroke="currentColor" stroke-width="2"
        stroke-linecap="round" stroke-linejoin="round"/>
</svg>`, i = e`<svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" focusable="false">
    <path d="M4 2.5v11l9-5.5z" fill="currentColor"/>
</svg>`, a = e`<svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" focusable="false">
    <rect x="4" y="2.5" width="3" height="11" fill="currentColor"/>
    <rect x="9" y="2.5" width="3" height="11" fill="currentColor"/>
</svg>`, o = 400, s = 90, c = class {
	constructor() {
		this.timer = null;
	}
	press(e) {
		this.stop(), e(), this.timer = window.setTimeout(() => {
			this.timer = window.setInterval(e, s);
		}, o);
	}
	stop() {
		this.timer !== null && (window.clearTimeout(this.timer), window.clearInterval(this.timer), this.timer = null);
	}
	click(e, t) {
		t.detail === 0 && e();
	}
};
function l(e) {
	let { icon: n, label: r, disabled: i, step: a, repeater: o } = e;
	return t`
        <sl-button size="small" class="step icon-only" title=${r} ?disabled=${i}
            @pointerdown=${() => {
		i || o.press(a);
	}}
            @pointerup=${() => o.stop()}
            @pointercancel=${() => o.stop()}
            @pointerleave=${() => o.stop()}
            @click=${(e) => {
		i || o.click(a, e);
	}}>
            ${n}<span class="visually-hidden">${r}</span>
        </sl-button>`;
}
//#endregion
export { c as a, r as i, i as n, l as o, n as r, a as t };
