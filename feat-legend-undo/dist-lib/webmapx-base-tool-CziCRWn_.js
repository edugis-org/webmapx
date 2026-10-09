import { s as e } from "./decorators-d8E4nZJy.js";
import { n as t, r as n } from "./decorate-JFLkHk_V.js";
//#region src/components/webmapx-base-tool.ts
var r = class extends e {
	constructor(...e) {
		super(...e), this.adapter = null, this.store = null, this.unsubscribe = null, this.configReadyHandler = null, this.mapReadyHandler = null, this.isSettingValue = !1, this.toolStateTimer = null, this.takenRestore = null;
	}
	connectedCallback() {
		if (super.connectedCallback(), !this.hasAttribute("aria-label") && !this.hasAttribute("aria-labelledby")) {
			let e = this.getAttribute("label") ?? this.label, t = this.toolId ?? this.getAttribute("tool-id") ?? void 0, n = e ?? (t ? t.replace(/-/g, " ").replace(/\b\w/g, (e) => e.toUpperCase()) : void 0);
			n && this.setAttribute("aria-label", n);
		}
		this.bindToMap();
	}
	disconnectedCallback() {
		this.unsubscribeFromConfig(), this.releaseStore(), super.disconnectedCallback();
	}
	bindToMap() {
		this.releaseStore();
		let e = t(this);
		if (!e) {
			this.subscribeToMapReady();
			return;
		}
		this.adapter = e, this.store = e.store, this.unsubscribe = this.store.subscribe(this.handleStateChange.bind(this)), this.onMapAttached(e), this.takeToolRestore(this.store.getState()), this.onStateChanged(this.store.getState());
	}
	releaseStore() {
		this.unsubscribeFromMapReady(), this.unsubscribe &&= (this.unsubscribe(), null), this.store = null, this.adapter = null, this.onMapDetached();
	}
	subscribeToMapReady() {
		if (this.mapReadyHandler) return;
		let e = n(this);
		e && (this.mapReadyHandler = () => {
			this.unsubscribeFromMapReady(), this.bindToMap();
		}, e.addEventListener("webmapx-map-ready", this.mapReadyHandler));
	}
	unsubscribeFromMapReady() {
		this.mapReadyHandler &&= (n(this)?.removeEventListener("webmapx-map-ready", this.mapReadyHandler), null);
	}
	handleStateChange(e, t) {
		t === "UI" && this.isSettingValue || (this.takeToolRestore(e), this.onStateChanged(e));
	}
	get permalinkKey() {
		return null;
	}
	publishToolState(e) {
		let t = this.permalinkKey;
		t && (this.toolStateTimer !== null && clearTimeout(this.toolStateTimer), this.toolStateTimer = setTimeout(() => {
			this.toolStateTimer = null;
			let n = this.store;
			if (!n) return;
			let r = { ...n.getState().toolStates ?? {} };
			e ? r[t] = e : delete r[t], n.dispatch({ toolStates: r }, "UI");
		}, 250));
	}
	applyToolState(e) {}
	takeToolRestore(e) {
		let t = this.permalinkKey, n = t ? e.toolRestore?.[t] : void 0;
		!t || !n || typeof n != "object" || this.takenRestore === n || (this.takenRestore = n, queueMicrotask(() => {
			let e = this.store;
			if (e) {
				let n = { ...e.getState().toolRestore ?? {} };
				delete n[t], e.dispatch({ toolRestore: n }, "INIT");
			}
			this.applyToolState(n);
		}));
	}
	onMapAttached(e) {}
	onMapDetached() {}
	get mapHost() {
		return n(this);
	}
	get config() {
		return this.mapHost?.config ?? null;
	}
	get mapConfig() {
		return this.config?.map;
	}
	get layerDataConfig() {
		return this.config?.layerData ?? this.config?.catalog;
	}
	get catalogConfig() {
		return this.config?.catalog;
	}
	get toolsConfig() {
		return this.config?.tools;
	}
	resolveConfigAsset(e) {
		let t = this.config?.baseUrl;
		if (!t) return e;
		try {
			return new URL(e, t).toString();
		} catch {
			return e;
		}
	}
	subscribeToConfig() {
		this.unsubscribeFromConfig(), this.config && this.onConfigReady(this.config), this.configReadyHandler = (e) => {
			let t = e.detail;
			this.onConfigReady(t.config);
		}, this.mapHost?.addEventListener("webmapx-config-ready", this.configReadyHandler);
	}
	unsubscribeFromConfig() {
		this.configReadyHandler &&= (this.mapHost?.removeEventListener("webmapx-config-ready", this.configReadyHandler), null);
	}
	onConfigReady(e) {}
};
//#endregion
export { r as t };
