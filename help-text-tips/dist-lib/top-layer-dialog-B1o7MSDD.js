import { h as e, p as t } from "./decorators-d8E4nZJy.js";
//#region src/components/internal/top-layer-dialog.ts
var n = e`
    dialog.webmapx-top-layer {
        border: none;
        padding: 0;
        margin: 0;
        background: transparent;
        max-width: none;
        max-height: none;
        width: 0;
        height: 0;
        overflow: visible;
    }

    dialog.webmapx-top-layer::backdrop {
        background: transparent;
    }
`;
function r(e) {
	return t`
        <dialog class="webmapx-top-layer"
                @cancel=${a}
                @sl-after-hide=${o}>${e}</dialog>
    `;
}
var i = "dialog.webmapx-top-layer";
function a(e) {
	e.preventDefault(), e.currentTarget.querySelector("sl-dialog")?.hide?.();
}
function o(e) {
	if (e.target?.tagName !== "SL-DIALOG") return;
	let t = e.currentTarget;
	t.open && t.close();
}
function s(e) {
	let t = () => {
		let t = e.renderRoot?.querySelector?.(i);
		!t || t.open || typeof t.showModal == "function" && t.showModal();
	};
	e.hasUpdated ? t() : e.updateComplete.then(t);
}
function c(e) {
	l(e), typeof e.showPopover == "function" && (e.popover = "manual", e.matches(":popover-open") || e.showPopover());
}
function l(e) {
	let t = u(e).find((e) => e.tagName === "WEBMAPX-MAP");
	t && e.parentNode !== t && t.appendChild(e);
}
function u(e) {
	let t = [], n = e;
	for (; n;) n = n.parentNode ?? n.host ?? null, n instanceof Element && t.push(n);
	return t;
}
function d(e) {
	typeof e.hidePopover != "function" || e.popover === null || e.matches(":popover-open") && e.hidePopover();
}
//#endregion
export { n as a, r as i, c as n, s as r, d as t };
