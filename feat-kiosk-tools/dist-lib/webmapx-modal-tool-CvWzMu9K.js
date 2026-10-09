import { a as e } from "./decorators-d8E4nZJy.js";
import { r as t, t as n } from "./decorate-Bl-DXcQA.js";
import { t as r } from "./webmapx-base-tool-U6KxfRFV.js";
//#region src/components/webmapx-modal-tool.ts
var i = class extends r {
	constructor(...e) {
		super(...e), this.isModal = !0, this._active = !1, this.registerWithToolManager = !0, this.portalContainer = null, this.toolManager = null;
	}
	get instanceId() {
		return this.getAttribute("tool-id") ?? this.toolId;
	}
	get active() {
		return this._active;
	}
	set active(e) {
		let t = this._active;
		e !== t && (this._active = e, e ? this.onActivate() : this.onDeactivate(), this.requestUpdate("active", t));
	}
	onMapAttached(e) {
		super.onMapAttached(e);
		let n = t(this);
		this.registerWithToolManager && n?.toolManager && !this.closest("webmapx-toolbox-tool, webmapx-menu-tool") && (this.toolManager = n.toolManager, this.toolManager.register(this));
	}
	onMapDetached() {
		this.toolManager &&= (this.toolManager.unregister(this.instanceId), null), super.onMapDetached();
	}
	onStateChanged(e) {}
	updated(e) {
		super.updated(e), (e.has("renderTarget") || e.has("active")) && this.updatePortal();
	}
	activate() {
		if (!this._active) {
			if (this.registerWithToolManager && this.toolManager && this.toolManager.activeToolId !== this.instanceId) {
				this.toolManager.activate(this.instanceId);
				return;
			}
			this.active = !0;
		}
	}
	deactivate() {
		if (this._active) {
			if (this.registerWithToolManager && this.toolManager && this.toolManager.activeToolId === this.instanceId) {
				this.toolManager.deactivate(this.instanceId);
				return;
			}
			this.active = !1;
		}
	}
	toggle() {
		this.registerWithToolManager && this.toolManager ? this.toolManager.toggle(this.instanceId) : this._active ? this.deactivate() : this.activate();
	}
	onActivate() {}
	onDeactivate() {}
	updatePortal() {
		if (!this.renderTarget) {
			this.restoreContent();
			return;
		}
		let e = document.querySelector(this.renderTarget);
		if (!e) {
			console.warn(`[${this.toolId}] Render target "${this.renderTarget}" not found`);
			return;
		}
		if (this.active) {
			let t = this.shadowRoot?.querySelector(".tool-content");
			t && (e.innerHTML = "", e.appendChild(t), this.portalContainer = e);
		} else this.portalContainer && (this.portalContainer.innerHTML = "");
	}
	restoreContent() {
		if (this.portalContainer) {
			let e = this.portalContainer.querySelector(".tool-content");
			e && this.shadowRoot && this.shadowRoot.appendChild(e), this.portalContainer.innerHTML = "", this.portalContainer = null;
		}
	}
};
n([e({ type: String })], i.prototype, "label", void 0), n([e({ attribute: !1 })], i.prototype, "icon", void 0), n([e({
	type: Boolean,
	reflect: !0
})], i.prototype, "active", null), n([e({
	type: String,
	attribute: "render-target"
})], i.prototype, "renderTarget", void 0), n([e({
	type: Boolean,
	attribute: "register-with-toolmanager"
})], i.prototype, "registerWithToolManager", void 0);
//#endregion
export { i as t };
