//#region src/utils/layer-picker-dialog.ts
async function e(e, t) {
	return await import("./dialog-B1VciGWj.js"), await import("./checkbox-CaRafJ4P.js"), await import("./button-Bg-QGCSd.js"), new Promise((n) => {
		let r = document.createElement("sl-dialog");
		r.setAttribute("label", `Import layers from ${e}`), r.style.setProperty("--width", "28rem"), r.innerHTML = `
      <div style="display:flex;flex-direction:column;gap:0.5rem">
        ${t.map((e) => `<sl-checkbox name="${e.name}" checked style="display:block;margin-bottom:0.4rem">${e.name}` + (e.featureCount > 0 ? ` <span style="color:var(--sl-color-neutral-400);font-size:0.85em">(${e.featureCount.toLocaleString()} features)</span>` : "") + "</sl-checkbox>").join("")}
      </div>
      <div slot="footer" style="display:flex;gap:0.5rem;justify-content:flex-end">
        <sl-button variant="default" class="cancel-btn">Cancel</sl-button>
        <sl-button variant="primary" class="import-btn">Import</sl-button>
      </div>
    `;
		let i = (e) => {
			r.hide(), r.addEventListener("sl-after-hide", () => r.remove(), { once: !0 }), n(e);
		};
		r.querySelector(".cancel-btn").addEventListener("click", () => i(null)), r.querySelector(".import-btn").addEventListener("click", () => {
			let e = Array.from(r.querySelectorAll("sl-checkbox")).filter((e) => e.checked).map((e) => e.getAttribute("name"));
			i(e.length > 0 ? e : null);
		}), document.body.appendChild(r), r.show();
	});
}
//#endregion
export { e as showLayerPickerDialog };
