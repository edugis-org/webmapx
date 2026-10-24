//#region src/utils/gdal-progress-dialog.ts
var e = 20 * 1024 * 1024;
async function t(t, n) {
	if (n < e) return !0;
	await import("./dialog-B1VciGWj.js"), await import("./button-Bg-QGCSd.js");
	let r = (n / (1024 * 1024)).toFixed(0);
	return new Promise((e) => {
		let n = document.createElement("sl-dialog");
		n.setAttribute("label", "Large file"), n.style.setProperty("--width", "26rem"), n.innerHTML = `
      <p style="margin:0 0 0.75rem">
        <strong>${t}</strong> is ${r} MB.
        Large GeoPackages may take a long time to convert and could crash the browser tab.
      </p>
      <p style="margin:0">Continue with the import?</p>
      <div slot="footer" style="display:flex;gap:0.5rem;justify-content:flex-end">
        <sl-button variant="default" class="no-btn">Cancel</sl-button>
        <sl-button variant="primary" class="yes-btn">Continue</sl-button>
      </div>
    `;
		let i = (t) => {
			n.hide(), n.addEventListener("sl-after-hide", () => n.remove(), { once: !0 }), e(t);
		};
		n.querySelector(".no-btn").addEventListener("click", () => i(!1)), n.querySelector(".yes-btn").addEventListener("click", () => i(!0)), document.body.appendChild(n), n.show();
	});
}
function n(e, t) {
	let n = document.createElement("div");
	n.style.cssText = [
		"position:fixed",
		"bottom:1.25rem",
		"right:1.25rem",
		"z-index:9999",
		"background:var(--sl-panel-background-color,#fff)",
		"border:1px solid var(--sl-color-neutral-200,#e2e8f0)",
		"border-radius:var(--sl-border-radius-medium,0.375rem)",
		"box-shadow:var(--sl-shadow-large,0 4px 16px rgba(0,0,0,.15))",
		"padding:0.9rem 1.1rem",
		"min-width:18rem",
		"max-width:24rem",
		"overflow:hidden",
		"font-family:var(--sl-font-sans,sans-serif)",
		"font-size:0.875rem",
		"color:var(--sl-color-neutral-900,#1a202c)"
	].join(";"), n.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:0.5rem">
      <strong style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:16rem"
              title="${e}">${e}</strong>
      <button class="cancel-btn" style="
        background:none;border:none;cursor:pointer;padding:0.1rem 0.3rem;
        color:var(--sl-color-neutral-500,#718096);font-size:0.8rem;white-space:nowrap;margin-left:0.5rem
      ">Cancel</button>
    </div>
    <div style="display:flex;align-items:center;gap:0.5rem">
      <span class="spinner" style="
        display:inline-block;width:1em;height:1em;border:2px solid var(--sl-color-neutral-300,#cbd5e0);
        border-top-color:var(--sl-color-primary-600,#3b82f6);border-radius:50%;
        animation:gdal-spin 0.7s linear infinite;flex-shrink:0
      "></span>
      <span class="step-label">Starting…</span>
    </div>
    <style>@keyframes gdal-spin{to{transform:rotate(360deg)}}</style>
  `, document.body.appendChild(n);
	let r = !1, i = n.querySelector(".step-label");
	return n.querySelector(".cancel-btn").addEventListener("click", () => {
		r = !0, i.textContent = "Cancelling…", n.querySelector(".cancel-btn").setAttribute("disabled", ""), t?.();
	}), {
		setStep(e) {
			i.textContent = e;
		},
		get cancelled() {
			return r;
		},
		close() {
			n.remove();
		}
	};
}
//#endregion
export { t as confirmLargeFile, n as showGdalProgress };
