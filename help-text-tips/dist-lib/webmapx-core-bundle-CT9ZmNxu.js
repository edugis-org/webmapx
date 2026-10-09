import { a as e, c as t, h as n, i as r, n as i, o as a, p as o, r as s, s as c, t as l } from "./decorators-d8E4nZJy.js";
import { i as u, l as d, o as f, r as p, s as m, t as h } from "./decorate-Bl-DXcQA.js";
import { n as ee, t as g } from "./webmapx-base-tool-Zh-Gv2m6.js";
import "./webmapx-modal-tool-DS_L8Zce.js";
import { a as _, i as v, o as y, s as b } from "./directive-helpers-Debt3Tx3.js";
import { i as te, o as ne, r as re, s as ie, t as ae } from "./chunk.AJ3ENQ5C-CwL2xu8w.js";
import { t as oe } from "./chunk.YHLNUJ7P-BjspQfLm.js";
import { n as x, r as S, t as se } from "./chunk.NYIIDP5N-gftugmWL.js";
import { t as C } from "./chunk.6CTB5ZDJ-DjZrBd6Y.js";
import { t as ce } from "./chunk.36O46B5H-CNPWSZFH.js";
import { t as le } from "./chunk.3RPBFEDE-DBlOq5Pm.js";
import "./button-DE9ytwxI.js";
import { t as ue } from "./checkbox-DigllOlW.js";
import { n as de, t as fe } from "./live-BR4apkFB.js";
import { t as pe } from "./chunk.SI4ACBFK-CdJVQctt.js";
import "./icon-Qf3FyAAL.js";
import { t as me } from "./control-surface-styles-zbl1JfZH.js";
import "./tooltip-ARL5tKAI.js";
import "./icon-button-DxwGf0BN.js";
import { t as he } from "./info-toggle-tL04Yu0p.js";
import { t as ge } from "./chunk.HF7GESMZ-DTzcQjL1.js";
import "./switch-caSfmU2w.js";
import "./spinner-DHQKbDmr.js";
import "./input-eCCT7kEl.js";
import { t as _e } from "./form-label-styles-CiXgi-FX.js";
import { n as ve, t as ye } from "./webmapx-clear-layers-dialog-G9JhxCik.js";
import { A as be } from "./classify-channel-C-BCLcL8.js";
import { r as xe, t as Se } from "./attribution-format-BnXMQyW7.js";
import { i as Ce } from "./data-colors-BglhXRFr.js";
import { t as we } from "./throttle-BD7udUwY.js";
import { r as Te } from "./compare-replay-Nc8FG2S9.js";
import { n as Ee } from "./permalink-state-OmXXq5L0.js";
import { n as De } from "./layer-features-NC94kZP4.js";
import { a as Oe } from "./geo-calculations-DcpPxqU9.js";
import { t as ke } from "./engine-labels-PQywGOyZ.js";
//#region src/components/webmapx-layout.ts
var w = class extends c {
	constructor(...e) {
		super(...e), this.slotDirections = {
			"top-left": "vertical",
			"middle-left": "vertical",
			"bottom-left": "vertical",
			"top-center": "vertical",
			"middle-center": "vertical",
			"bottom-center": "vertical",
			"top-right": "vertical",
			"middle-right": "vertical",
			"bottom-right": "vertical"
		};
	}
	static {
		this.styles = n`
    :host {
      position: absolute;
      inset: 0;
      display: block;
      pointer-events: none;
      /* Follow the density axis: --overlay-inset is 16px under atlas/folio and
         8px under console, so a dense preset pulls the chrome in toward the
         map edges without every zone needing its own override. */
      --webmapx-layout-inset: var(--overlay-inset, 16px);
      --webmapx-layout-inset-vertical: calc(var(--webmapx-layout-inset, 16px) + 2px);
      --webmapx-layout-slot-gap: var(--webmapx-space-sm, 8px);
    }

    .overlay-surface {
      position: relative;
      width: 100%;
      height: 100%;
      box-sizing: border-box;
    }

    .slot-zone {
      position: absolute;
      display: flex;
      flex-direction: column;
      gap: var(--webmapx-layout-slot-gap, 12px);
      pointer-events: none;
      min-height: 0;
      max-height: 100%;
      overflow: hidden;
    }

    .slot-zone[data-direction='horizontal'] {
      flex-direction: row;
    }


    /* Left column */
    .slot-zone--top-left {
      top: var(--webmapx-zone-top-left-top, var(--webmapx-layout-inset-vertical, 18px));
      bottom: var(--webmapx-zone-top-left-bottom, var(--webmapx-layout-inset-vertical, 18px));
      left: var(--webmapx-zone-top-left-left, var(--webmapx-layout-inset, 16px));
      right: var(--webmapx-zone-top-left-right, var(--webmapx-layout-inset, 16px));
      justify-content: flex-start;
      align-items: flex-start;
    }

    .slot-zone--middle-left {
      top: var(--webmapx-zone-middle-left-top, var(--webmapx-layout-inset-vertical, 18px));
      bottom: var(--webmapx-zone-middle-left-bottom, var(--webmapx-layout-inset-vertical, 18px));
      left: var(--webmapx-zone-middle-left-left, var(--webmapx-layout-inset, 16px));
      right: var(--webmapx-zone-middle-left-right, var(--webmapx-layout-inset, 16px));
      justify-content: center;
      align-items: flex-start;
    }

    .slot-zone--bottom-left {
      top: var(--webmapx-zone-bottom-left-top, var(--webmapx-layout-inset-vertical, 18px));
      bottom: var(--webmapx-zone-bottom-left-bottom, var(--webmapx-layout-inset-vertical, 18px));
      left: var(--webmapx-zone-bottom-left-left, var(--webmapx-layout-inset, 16px));
      right: var(--webmapx-zone-bottom-left-right, var(--webmapx-layout-inset, 16px));
      justify-content: flex-end;
      align-items: flex-start;
    }

    .slot-zone--bottom-left[data-direction='horizontal'] {
      justify-content: flex-start;
      align-items: flex-end;
    }

    /* Center column */
    .slot-zone--top-center {
      top: var(--webmapx-zone-top-center-top, var(--webmapx-layout-inset-vertical, 18px));
      bottom: var(--webmapx-zone-top-center-bottom, var(--webmapx-layout-inset-vertical, 18px));
      left: var(--webmapx-zone-top-center-left, var(--webmapx-layout-inset, 16px));
      right: var(--webmapx-zone-top-center-right, var(--webmapx-layout-inset, 16px));
      justify-content: flex-start;
      align-items: center;
    }

    .slot-zone--middle-center {
      top: var(--webmapx-zone-middle-center-top, var(--webmapx-layout-inset-vertical, 18px));
      bottom: var(--webmapx-zone-middle-center-bottom, var(--webmapx-layout-inset-vertical, 18px));
      left: var(--webmapx-zone-middle-center-left, var(--webmapx-layout-inset, 16px));
      right: var(--webmapx-zone-middle-center-right, var(--webmapx-layout-inset, 16px));
      justify-content: center;
      align-items: center;
    }

    .slot-zone--bottom-center {
      top: var(--webmapx-zone-bottom-center-top, var(--webmapx-layout-inset-vertical, 18px));
      bottom: var(--webmapx-zone-bottom-center-bottom, var(--webmapx-layout-inset-vertical, 18px));
      left: var(--webmapx-zone-bottom-center-left, var(--webmapx-layout-inset, 16px));
      right: var(--webmapx-zone-bottom-center-right, var(--webmapx-layout-inset, 16px));
      justify-content: flex-end;
      align-items: center;
    }

    /* Right column */
    .slot-zone--top-right {
      top: var(--webmapx-zone-top-right-top, var(--webmapx-layout-inset-vertical, 18px));
      bottom: var(--webmapx-zone-top-right-bottom, var(--webmapx-layout-inset-vertical, 18px));
      left: var(--webmapx-zone-top-right-left, var(--webmapx-layout-inset, 16px));
      right: var(--webmapx-zone-top-right-right, var(--webmapx-layout-inset, 16px));
      justify-content: flex-start;
      align-items: flex-end;
    }

    .slot-zone--middle-right {
      top: var(--webmapx-zone-middle-right-top, var(--webmapx-layout-inset-vertical, 18px));
      bottom: var(--webmapx-zone-middle-right-bottom, var(--webmapx-layout-inset-vertical, 18px));
      left: var(--webmapx-zone-middle-right-left, var(--webmapx-layout-inset, 16px));
      right: var(--webmapx-zone-middle-right-right, var(--webmapx-layout-inset, 16px));
      justify-content: center;
      align-items: flex-end;
    }

    .slot-zone--bottom-right {
      top: var(--webmapx-zone-bottom-right-top, var(--webmapx-layout-inset-vertical, 18px));
      bottom: var(--webmapx-zone-bottom-right-bottom, var(--webmapx-layout-inset-vertical, 18px));
      left: var(--webmapx-zone-bottom-right-left, var(--webmapx-layout-inset, 16px));
      right: var(--webmapx-zone-bottom-right-right, var(--webmapx-layout-inset, 16px));
      justify-content: flex-end;
      align-items: flex-end;
    }

    /* Edge zones: zero inset, for controls that must hug the map border (e.g. attribution) */
    .slot-zone--edge-bottom-right {
      bottom: 0;
      right: 0;
      left: 0;
      justify-content: flex-end;
      align-items: flex-end;
    }

    .slot-zone--edge-bottom-left {
      bottom: 0;
      left: 0;
      right: 0;
      justify-content: flex-end;
      align-items: flex-start;
    }

    .slot-zone--edge-bottom-center {
      bottom: 0;
      left: 0;
      right: 0;
      justify-content: flex-end;
      align-items: center;
    }
  `;
	}
	render() {
		return o`
      <div class="overlay-surface">
        <!-- Edge zones first (lowest stacking order) -->
        <div class="slot-zone slot-zone--edge-bottom-right">
          <slot name="edge-bottom-right"></slot>
        </div>
        <div class="slot-zone slot-zone--edge-bottom-left">
          <slot name="edge-bottom-left"></slot>
        </div>
        <div class="slot-zone slot-zone--edge-bottom-center">
          <slot name="edge-bottom-center"></slot>
        </div>

        <!-- Middle zones (lower stacking order) -->
        <div class="slot-zone slot-zone--middle-left" data-direction=${this.slotDirections["middle-left"]}>
          <slot name="middle-left" @slotchange=${this.handleSlotChange}></slot>
        </div>
        <div class="slot-zone slot-zone--middle-right" data-direction=${this.slotDirections["middle-right"]}>
          <slot name="middle-right" @slotchange=${this.handleSlotChange}></slot>
        </div>
        <div class="slot-zone slot-zone--middle-center" data-direction=${this.slotDirections["middle-center"]}>
          <slot name="middle-center" @slotchange=${this.handleSlotChange}></slot>
        </div>

        <!-- Corner and Center zones — ordered left-to-right, top-to-bottom for logical tab flow -->
        <div class="slot-zone slot-zone--top-left" data-direction=${this.slotDirections["top-left"]}>
          <slot name="top-left" @slotchange=${this.handleSlotChange}></slot>
        </div>
        <div class="slot-zone slot-zone--top-center" data-direction=${this.slotDirections["top-center"]}>
          <slot name="top-center" @slotchange=${this.handleSlotChange}></slot>
        </div>
        <div class="slot-zone slot-zone--top-right" data-direction=${this.slotDirections["top-right"]}>
          <slot name="top-right" @slotchange=${this.handleSlotChange}></slot>
        </div>
        <div class="slot-zone slot-zone--bottom-left" data-direction=${this.slotDirections["bottom-left"]}>
          <slot name="bottom-left" @slotchange=${this.handleSlotChange}></slot>
        </div>
        <div class="slot-zone slot-zone--bottom-center" data-direction=${this.slotDirections["bottom-center"]}>
          <slot name="bottom-center" @slotchange=${this.handleSlotChange}></slot>
        </div>
        <div class="slot-zone slot-zone--bottom-right" data-direction=${this.slotDirections["bottom-right"]}>
          <slot name="bottom-right" @slotchange=${this.handleSlotChange}></slot>
        </div>
      </div>
    `;
	}
	handleSlotChange(e) {
		let t = e.target, n = t?.name;
		if (!n) return;
		let r = this.resolveSlotDirection(t);
		this.slotDirections[n] !== r && (this.slotDirections = {
			...this.slotDirections,
			[n]: r
		});
	}
	resolveSlotDirection(e) {
		return e.assignedElements({ flatten: !0 }).find((e) => {
			let t = e.getAttribute("direction");
			return t === "horizontal" || t === "vertical";
		})?.getAttribute("direction") === "horizontal" ? "horizontal" : "vertical";
	}
};
h([r()], w.prototype, "slotDirections", void 0), w = h([a("webmapx-layout")], w);
//#endregion
//#region src/components/internal/tool-selection-scope.ts
function Ae(e) {
	let t = e.getAttribute("tool-id") || e.getAttribute("data-tool") || e.getAttribute("name");
	if (t) return t;
	let n = e.toolId;
	return typeof n == "string" && n ? n : null;
}
function T(e, t) {
	return !!(t && e.includes(t));
}
function je(e, t) {
	return !!(e.sourceToolbar && t && e.sourceToolbar !== t);
}
function Me(e) {
	let { toolIds: t, detail: n, ownToolbar: r } = e;
	if (!je(n, r)) return n.toolId ? T(t, n.toolId) ? n.toolId : void 0 : n.previousToolId ? T(t, n.previousToolId) ? null : void 0 : n.toolId === null ? null : void 0;
}
//#endregion
//#region src/components/webmapx-toolbar.ts
var E = class extends c {
	constructor(...e) {
		super(...e), this.orientation = "vertical", this.toolManager = null, this.toolPanel = null, this.boundHandleToolActivated = (e) => this.handleToolActivated(e), this.boundHandleToolDeactivated = (e) => this.handleToolDeactivated(e), this.boundHandleToolSelect = (e) => this.handleToolSelect(e), this.boundHandlePanelClose = (e) => this.handlePanelClose(e), this.handleArrowKeys = (e) => {
			let t = this.focusableButtons();
			if (t.length === 0) return;
			let n = t.findIndex((e) => e === document.activeElement || e.shadowRoot?.activeElement != null);
			if (e.key === "Enter" || e.key === " ") {
				n !== -1 && (e.preventDefault(), t[n].click());
				return;
			}
			let r = this.orientation !== "horizontal", i = r ? "ArrowUp" : "ArrowLeft", a = r ? "ArrowDown" : "ArrowRight";
			if (e.key !== i && e.key !== a || n === -1) return;
			e.preventDefault();
			let o = t[(n + (e.key === a ? 1 : -1) + t.length) % t.length];
			this.applyRovingTabindex(o), o.focus();
		}, this.boundHandleClick = (e) => this.handleButtonClick(e);
	}
	static {
		this.styles = n`
    :host {
      display: flex;
      flex-direction: column;
      flex-wrap: wrap; /* Allow wrapping to new column */
      flex: 0 0 auto;
      background: var(--webmapx-toolbar-bg, rgb(var(--color-surface-rgb, 255 255 255) / var(--webmapx-surface-alpha, 1)));
      -webkit-backdrop-filter: var(--webmapx-surface-blur, none);
      backdrop-filter: var(--webmapx-surface-blur, none);
      border: var(--webmapx-surface-border, 1px solid var(--color-border-light, #e2e7ec));
      border-radius: var(--webmapx-toolbar-radius, var(--webmapx-surface-radius, 6px));
      height: fit-content;
      align-self: stretch;
      width: fit-content;
      padding: 0;
      gap: 0;
      pointer-events: none;
      box-shadow: var(--webmapx-surface-shadow, 0 1px 2px rgba(16, 24, 40, 0.07));
    }

    ::slotted(*) {
      pointer-events: auto;
    }

    ::slotted(sl-button) {
      margin: 0;
      width: var(--webmapx-toolbar-button-size, var(--webmapx-hit-size, 36px));
      height: var(--webmapx-toolbar-button-size, var(--webmapx-hit-size, 36px));
      --sl-input-border-color: transparent;
      --sl-input-border-radius-small: var(--webmapx-radius-sm, 4px);
      --sl-input-border-radius-medium: var(--webmapx-radius-sm, 4px);
      --sl-input-border-radius-large: var(--webmapx-radius-sm, 4px);
    }

    slot[name="before"]::slotted(*),
    slot[name="after"]::slotted(*) {
      pointer-events: auto;
    }

    :host([orientation="vertical"]) {
      flex-direction: column;
      max-height: var(--webmapx-toolbar-max-height, 100%);
    }

    :host([orientation="vertical"]) ::slotted(sl-button) {
      box-shadow: inset 0 -1px 0 var(--webmapx-toolbar-separator-color, transparent);
    }

    :host([orientation="vertical"]) ::slotted(sl-button[data-toolbar-last="true"]) {
      box-shadow: none;
    }

    :host([orientation="horizontal"]) {
      flex-direction: row;
      max-width: var(--webmapx-toolbar-max-width, 100%);
    }
  `;
	}
	connectedCallback() {
		super.connectedCallback(), this.setAttribute("role", "toolbar"), this.setAttribute("aria-orientation", this.orientation);
		let e = this.closest("webmapx-map");
		e?.toolManager && (this.toolManager = e.toolManager), e?.addEventListener("webmapx-tool-activated", this.boundHandleToolActivated), e?.addEventListener("webmapx-tool-deactivated", this.boundHandleToolDeactivated), e?.addEventListener("webmapx-tool-select", this.boundHandleToolSelect), this.toolPanel = this.resolveToolPanel(), this.toolPanel?.addEventListener("webmapx-panel-close", this.boundHandlePanelClose), this.addEventListener("keydown", this.handleArrowKeys), queueMicrotask(() => this.applyToolbarSeparators());
	}
	disconnectedCallback() {
		let e = this.closest("webmapx-map");
		e?.removeEventListener("webmapx-tool-activated", this.boundHandleToolActivated), e?.removeEventListener("webmapx-tool-deactivated", this.boundHandleToolDeactivated), e?.removeEventListener("webmapx-tool-select", this.boundHandleToolSelect), this.toolPanel?.removeEventListener("webmapx-panel-close", this.boundHandlePanelClose), this.removeEventListener("keydown", this.handleArrowKeys), this.toolPanel = null, this.toolManager = null, super.disconnectedCallback();
	}
	handleSlotChange() {
		let e = this.buttons.filter((e) => e.tagName.toLowerCase() === "sl-button");
		e.forEach((e) => {
			e.removeAttribute("data-toolbar-first"), e.removeAttribute("data-toolbar-last");
		}), e[0]?.setAttribute("data-toolbar-first", "true"), e[e.length - 1]?.setAttribute("data-toolbar-last", "true"), this.buttons.forEach((e) => {
			e.removeEventListener("click", this.boundHandleClick), e.addEventListener("click", this.boundHandleClick);
		}), this.applyRovingTabindex(), this.applyToolbarSeparators();
	}
	applyRovingTabindex(e) {
		let t = this.focusableButtons();
		t.forEach((e) => e.setAttribute("tabindex", "-1")), (e ?? t.find((e) => e.getAttribute("variant") === "primary") ?? t[0])?.setAttribute("tabindex", "0");
	}
	focusableButtons() {
		return this.buttons.filter((e) => e.tagName.toLowerCase() === "sl-button");
	}
	updated(e) {
		e.has("orientation") && (this.setAttribute("aria-orientation", this.orientation), this.applyToolbarSeparators());
	}
	applyToolbarSeparators() {
		let e = this.buttons.filter((e) => e.tagName.toLowerCase() === "sl-button");
		e.forEach((t, n) => {
			let r = n === e.length - 1, i = t.shadowRoot?.querySelector("[part=\"base\"]");
			i && (this.orientation === "vertical" && !r ? i.style.borderBottom = "1px solid var(--webmapx-toolbar-separator-color, var(--color-border-light, #e2e7ec))" : i.style.borderBottom = "");
		});
	}
	handleButtonClick(e) {
		let t = e.currentTarget, n = t.getAttribute("name") || t.getAttribute("data-tool");
		if (!n) return;
		let r = this.toolManager?.getTool(n) !== void 0;
		if (this.toolManager && r) {
			this.toolManager.toggle(n);
			return;
		}
		let i = t.hasAttribute("active") || t.getAttribute("variant") === "primary";
		this.clearActiveButtons(), this.toolManager?.activeToolId && this.toolManager.getTool(n) && this.toolManager.deactivate(this.toolManager.activeToolId), i ? this.dispatchEvent(new CustomEvent("webmapx-tool-select", {
			detail: {
				toolId: null,
				previousToolId: n,
				sourceToolbar: this
			},
			bubbles: !0,
			composed: !0
		})) : (this.setActiveButton(n), this.dispatchEvent(new CustomEvent("webmapx-tool-select", {
			detail: {
				toolId: n,
				previousToolId: null,
				sourceToolbar: this
			},
			bubbles: !0,
			composed: !0
		})));
	}
	handleToolActivated(e) {
		let { toolId: t } = e.detail;
		this.hasButtonForTool(t) && (this.clearActiveButtons(), this.setActiveButton(t));
	}
	handleToolDeactivated(e) {
		let { toolId: t } = e.detail;
		this.hasButtonForTool(t) && this.clearActiveButtons();
	}
	handleToolSelect(e) {
		let t = e.detail ?? {}, n = Me({
			toolIds: this.getToolIds(),
			currentActiveToolId: this.getActiveButtonToolId(),
			detail: t,
			ownToolbar: this
		});
		n !== void 0 && (this.clearActiveButtons(), n && this.setActiveButton(n));
	}
	handlePanelClose(e) {
		let t = e.detail?.toolId;
		t && this.toolManager?.getTool(t) && this.toolManager.deactivate(t), this.clearActiveButtons();
	}
	resolveToolPanel() {
		let e = this.closest("webmapx-control-group");
		if (e) {
			let t = e.querySelector("webmapx-tool-panel");
			if (t) return t;
		}
		return this.closest("webmapx-map")?.querySelector("webmapx-tool-panel") ?? null;
	}
	setActiveButton(e) {
		let t = this.buttons.find((t) => t.getAttribute("name") === e || t.getAttribute("data-tool") === e);
		t && (t.setAttribute("active", ""), t.tagName.toLowerCase() === "sl-button" && t.setAttribute("variant", "primary"), this.applyRovingTabindex(t));
	}
	clearActiveButtons() {
		this.buttons.forEach((e) => {
			e.removeAttribute("active"), e.tagName.toLowerCase() === "sl-button" && e.setAttribute("variant", "default");
		}), this.applyRovingTabindex();
	}
	hasButtonForTool(e) {
		return T(this.getToolIds(), e);
	}
	getToolIds() {
		return this.buttons.map((e) => e.getAttribute("name") || e.getAttribute("data-tool")).filter((e) => !!e);
	}
	getActiveButtonToolId() {
		let e = this.buttons.find((e) => e.hasAttribute("active") || e.getAttribute("variant") === "primary");
		return e?.getAttribute("name") || e?.getAttribute("data-tool") || null;
	}
	render() {
		return o`
      <slot name="before"></slot>
      <slot @slotchange=${this.handleSlotChange}></slot>
      <slot name="after"></slot>
    `;
	}
};
h([e({
	type: String,
	reflect: !0
})], E.prototype, "orientation", void 0), h([l()], E.prototype, "buttons", void 0), E = h([a("webmapx-toolbar")], E);
//#endregion
//#region src/components/webmapx-tool-panel.ts
var D, O = class extends c {
	static {
		D = this;
	}
	constructor(...e) {
		super(...e), this.label = "Tools", this.active = !1, this.collapsed = !1, this.description = "", this.tip = "", this.defaultLabel = "Tools", this.activeToolId = null, this.toolIndex = /* @__PURE__ */ new Map(), this.mapHost = null, this.boundHandleToolActivated = (e) => this.handleToolActivated(e), this.boundHandleToolDeactivated = (e) => this.handleToolDeactivated(e), this.boundHandleToolSelect = (e) => this.handleToolSelect(e), this.boundHandleKeydown = (e) => this.handleKeydown(e), this.boundHandlePanelWidth = (e) => this.handlePanelWidth(e), this.boundReadTip = () => this.readTip(), this.triggerButton = null;
	}
	static {
		this.DEFAULT_WIDTH = "300px";
	}
	connectedCallback() {
		super.connectedCallback(), this.setAttribute("role", "region"), this.defaultLabel = this.label || "Tools", this.hideAllTools(), this.mapHost = this.closest("webmapx-map"), this.mapHost?.addEventListener("webmapx-tool-activated", this.boundHandleToolActivated), this.mapHost?.addEventListener("webmapx-tool-deactivated", this.boundHandleToolDeactivated), this.mapHost?.addEventListener("webmapx-tool-select", this.boundHandleToolSelect), document.addEventListener("keydown", this.boundHandleKeydown, { capture: !0 }), this.addEventListener("webmapx-content-updated", this.handleContentUpdated), this.addEventListener("webmapx-panel-width", this.boundHandlePanelWidth), this.addEventListener(ee, this.boundReadTip);
	}
	disconnectedCallback() {
		super.disconnectedCallback(), this.mapHost?.removeEventListener("webmapx-tool-activated", this.boundHandleToolActivated), this.mapHost?.removeEventListener("webmapx-tool-deactivated", this.boundHandleToolDeactivated), this.mapHost?.removeEventListener("webmapx-tool-select", this.boundHandleToolSelect), document.removeEventListener("keydown", this.boundHandleKeydown, { capture: !0 }), this.mapHost = null, this.removeEventListener("webmapx-content-updated", this.handleContentUpdated), this.removeEventListener("webmapx-panel-width", this.boundHandlePanelWidth), this.removeEventListener(ee, this.boundReadTip);
	}
	firstUpdated() {
		let e = (this.shadowRoot?.querySelector("slot"))?.assignedElements({ flatten: !0 }) ?? [];
		this.indexTools(e), this.syncActiveTool();
	}
	handleContentUpdated() {
		let e = this.shadowRoot?.querySelector(".panel-content");
		e && requestAnimationFrame(() => {
			e.scrollTop = e.scrollHeight;
		});
	}
	handleSlotChange(e) {
		let t = e.target?.assignedElements({ flatten: !0 }) ?? [];
		this.indexTools(t), this.syncActiveTool();
	}
	indexTools(e) {
		this.toolIndex.clear(), e.forEach((e) => {
			let t = Ae(e);
			if (!t) return;
			let n = this.resolveToolLabel(t, e), r = e.getAttribute("panel-description") ?? "";
			this.toolIndex.set(t, {
				element: e,
				label: n,
				description: r
			});
		});
	}
	resolveToolLabel(e, t) {
		return t.getAttribute("panel-label") || t.getAttribute("data-label") || t.getAttribute("label") || (e ? e.charAt(0).toUpperCase() + e.slice(1) : this.defaultLabel);
	}
	hideAllTools() {
		Array.from(this.children).forEach((e) => {
			let t = e;
			t.hidden = !0, t.inert = !0;
		});
	}
	applyVisibility() {
		if (this.toolIndex.forEach(({ element: e }, t) => {
			let n = t === this.activeToolId, r = !e.hidden;
			e.hidden = !n, e.inert = !n, n && !r && typeof e.activate == "function" ? e.activate() : !n && r && typeof e.deactivate == "function" && e.deactivate();
		}), this.activeToolId && this.toolIndex.has(this.activeToolId)) {
			let e = this.toolIndex.get(this.activeToolId);
			e && (this.label = e.label, this.description = e.description, this.applyWidth(e.element.getAttribute("panel-width"))), this.active = !0, this.readTip(), this.setAttribute("aria-label", this.label), requestAnimationFrame(() => this.focusFirstInActiveTool());
			return;
		}
		this.label = this.defaultLabel, this.description = "", this.tip = "", this.active = !1, this.setAttribute("aria-label", this.label), this.applyWidth(null);
	}
	readTip() {
		let e = this.activeToolId ? this.toolIndex.get(this.activeToolId)?.element : null;
		this.tip = e?.toolTip ?? "";
	}
	applyWidth(e) {
		this.style.width = e || D.DEFAULT_WIDTH;
	}
	handlePanelWidth(e) {
		let { toolId: t, width: n } = e.detail ?? {};
		t && t !== this.activeToolId || this.applyWidth(n ?? null);
	}
	syncActiveTool() {
		if (this.activeToolId) {
			this.applyVisibility();
			return;
		}
		let e = this.mapHost?.toolManager?.activeToolId ?? null;
		e && this.toolIndex.has(e) && (this.activeToolId = e), this.applyVisibility();
	}
	handleToolActivated(e) {
		let t = e.detail?.toolId;
		!t || !this.toolIndex.has(t) || (this.triggerButton = document.activeElement ?? null, this.activeToolId = t, this.collapsed = !1, this.applyVisibility());
	}
	handleToolDeactivated(e) {
		let t = e.detail?.toolId;
		!t || this.activeToolId !== t || (this.activeToolId = null, this.applyVisibility());
	}
	handleToolSelect(e) {
		let t = e.detail ?? {};
		if (je(t, this.resolveToolbar())) return;
		let n = t.toolId ?? null, r = t.previousToolId ?? null;
		if (!(n && this.mapHost?.toolManager?.getTool(n))) {
			if (!n) {
				if (r && !this.toolIndex.has(r) && this.activeToolId !== r) return;
				this.activeToolId = null, this.applyVisibility();
				return;
			}
			this.toolIndex.has(n) && (this.triggerButton = document.activeElement ?? null, this.activeToolId = n, this.collapsed = !1, this.applyVisibility());
		}
	}
	resolveToolbar() {
		let e = this.closest("webmapx-control-group");
		if (e) {
			let t = e.querySelector("webmapx-toolbar");
			if (t) return t;
		}
		return this.mapHost?.querySelector("webmapx-toolbar") ?? null;
	}
	static {
		this.styles = [me, n`
    /* The host is a column of two boxes: the panel itself (.card) and, under
       it, the active tool's next step (.tip). Both share the host's width and
       maximum height; when space runs out the card's content scrolls and the
       tip stays in view. */
    :host {
      display: none;
      box-sizing: border-box;
      flex-direction: column;
      gap: var(--webmapx-space-sm, 0.5rem);
      align-self: flex-start;
      width: 300px;
      height: auto;
      max-height: 100%;
      pointer-events: none;
    }

    :host([active]) {
      display: flex;
    }

    .card {
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      flex: 0 1 auto;
      min-height: calc(
        var(--webmapx-panel-header-min-height, 3rem) +
        var(--webmapx-panel-min-content, 0px)
      );
      background: var(--webmapx-panel-bg, rgb(var(--color-surface-rgb, 255 255 255) / var(--webmapx-surface-alpha, 1)));
      -webkit-backdrop-filter: var(--webmapx-surface-blur, none);
      backdrop-filter: var(--webmapx-surface-blur, none);
      border: var(--webmapx-surface-border, 1px solid var(--color-border-light, #e2e7ec));
      border-radius: var(--webmapx-panel-radius, var(--webmapx-surface-radius, 6px));
      box-shadow: var(--webmapx-surface-shadow, 0 4px 12px rgba(16, 24, 40, 0.12));
      pointer-events: auto;
      overflow: hidden; /* clamp the card; inner content manages scroll */
    }

    /* On the map, not in the panel, so it is drawn like map chrome: the
       panel's own surface, body size, primary colour. Medium weight, because
       it is the one sentence on screen that says what to do next. */
    .tip {
      box-sizing: border-box;
      flex: none;
      display: flex;
      align-items: flex-start;
      gap: var(--webmapx-space-sm, 0.5rem);
      padding: var(--webmapx-space-sm, 0.5rem) var(--webmapx-space-md, 0.75rem);
      background: var(--webmapx-panel-bg, rgb(var(--color-surface-rgb, 255 255 255) / var(--webmapx-surface-alpha, 1)));
      -webkit-backdrop-filter: var(--webmapx-surface-blur, none);
      backdrop-filter: var(--webmapx-surface-blur, none);
      border: var(--webmapx-surface-border, 1px solid var(--color-border-light, #e2e7ec));
      border-radius: var(--webmapx-panel-radius, var(--webmapx-surface-radius, 6px));
      box-shadow: var(--webmapx-surface-shadow, 0 4px 12px rgba(16, 24, 40, 0.12));
      font-size: var(--webmapx-font-size-md, 0.875rem);
      font-weight: 500;
      line-height: 1.4;
      color: var(--color-text-primary, #16202a);
      pointer-events: auto;
    }

    .tip sl-icon {
      flex: none;
      margin-top: 0.15em;
      color: var(--color-primary, #1b6ec2);
    }

    .tip[hidden] {
      display: none;
    }

    .panel-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: var(--webmapx-panel-header-padding, var(--webmapx-space-sm, 0.5rem) var(--webmapx-space-lg, 1rem));
      border-bottom: var(--webmapx-panel-header-divider, 1px solid var(--color-border-light, #e2e7ec));
      background: var(--webmapx-panel-header-bg, transparent);
      flex-shrink: 0;
    }

    .panel-header h2 {
      margin: 0;
      font-size: var(--webmapx-font-size-lg, 1rem);
      font-weight: 600;
      letter-spacing: -0.005em;
      color: var(--color-text-primary, #16202a);
    }

    /* What the tool is for: one sentence under the title that heads the tool
       as a whole. Bold, so it stands apart from the instructions below it,
       but smaller and in the secondary colour, so it stays under the title
       rather than reading as a second one. Padded like tool content, since it
       sits inside the scrolling content above the tool. */
    .panel-description {
      margin: 0;
      padding: var(--webmapx-panel-content-padding, var(--webmapx-space-md, 0.75rem));
      padding-bottom: 0;
      font-size: var(--webmapx-font-size-md, 0.875rem);
      font-weight: 600;
      line-height: 1.4;
      color: var(--color-text-secondary, #5a6773);
    }

    .panel-content {
      box-sizing: border-box;
      flex: 0 1 auto;
      min-height: var(--webmapx-panel-min-content, 0px);
      max-height: var(--webmapx-panel-content-max-height, 100%);
      overflow-y: auto;
      overflow-x: hidden;
      --webmapx-tool-padding: var(--webmapx-panel-content-padding, var(--webmapx-space-md, 0.75rem));
    }

    :host([collapsed]) .card {
      min-height: 0;
    }

    :host([collapsed]) .panel-content,
    :host([collapsed]) slot[name="footer"] {
      display: none;
    }

    ::slotted([hidden]) {
      display: none !important;
    }

  `];
	}
	toggleCollapsed() {
		this.collapsed = !this.collapsed;
	}
	handleClose() {
		let e = this.activeToolId, t = this.triggerButton;
		this.triggerButton = null, this.activeToolId = null, this.applyVisibility(), this.dispatchEvent(new CustomEvent("webmapx-panel-close", {
			detail: { toolId: e },
			bubbles: !0,
			composed: !0
		})), requestAnimationFrame(() => requestAnimationFrame(() => t?.focus()));
	}
	handleKeydown(e) {
		if (e.key === "Escape" && this.active) {
			if (document.querySelector("sl-select[open], sl-dropdown[open], sl-popup[active]") || he((this.activeToolId ? this.toolIndex.get(this.activeToolId)?.element : null)?.shadowRoot)) return;
			e.preventDefault(), e.stopPropagation(), this.handleClose();
		}
	}
	focusFirstInActiveTool() {
		let e = this.activeToolId ? this.toolIndex.get(this.activeToolId) : null;
		if (!e) return;
		let t = e.element, n = (t.shadowRoot ?? t).querySelector("input, textarea, select, button, [tabindex]:not([tabindex=\"-1\"]), sl-input, sl-button, sl-select, sl-checkbox");
		n && n.focus?.();
	}
	render() {
		return o`
      <div class="card">
      <div class="panel-header">
        <slot name="header"><h2>${this.label}</h2></slot>
        <sl-button size="small" circle variant="text" @click=${this.toggleCollapsed}>
          <sl-icon name=${this.collapsed ? "chevron-down" : "chevron-up"} label=${this.collapsed ? "Expand" : "Collapse"}></sl-icon>
        </sl-button>
        <sl-button size="small" circle variant="text" @click=${this.handleClose}>
          <sl-icon name="x-lg" label="Close"></sl-icon>
        </sl-button>
      </div>
      <div class="panel-content">
        ${this.description ? o`<p class="panel-description">${this.description}</p>` : t}
        <slot @slotchange=${this.handleSlotChange}></slot>
      </div>
      <slot name="footer"></slot>
      </div>
      <!-- A live region, so a changed next step is spoken. Kept in the DOM while
           empty: a live region inserted together with its text is not announced. -->
      <div class="tip" role="status" ?hidden=${!this.tip}>
        ${this.tip ? o`<sl-icon name="hand-index" aria-hidden="true"></sl-icon><span>${this.tip}</span>` : t}
      </div>
    `;
	}
};
h([e({ type: String })], O.prototype, "label", void 0), h([e({
	type: Boolean,
	reflect: !0
})], O.prototype, "active", void 0), h([e({
	type: Boolean,
	reflect: !0
})], O.prototype, "collapsed", void 0), h([r()], O.prototype, "description", void 0), h([r()], O.prototype, "tip", void 0), O = D = h([a("webmapx-tool-panel")], O);
//#endregion
//#region node_modules/@shoelace-style/shoelace/dist/chunks/chunk.BWVSW6TI.js
var Ne = n`
  :host {
    display: block;
    outline: 0;
    z-index: 0;
  }

  :host(:focus) {
    outline: none;
  }

  slot:not([name])::slotted(sl-icon) {
    margin-inline-end: var(--sl-spacing-x-small);
  }

  .tree-item {
    position: relative;
    display: flex;
    align-items: stretch;
    flex-direction: column;
    color: var(--sl-color-neutral-700);
    cursor: pointer;
    user-select: none;
    -webkit-user-select: none;
  }

  .tree-item__checkbox {
    pointer-events: none;
  }

  .tree-item__expand-button,
  .tree-item__checkbox,
  .tree-item__label {
    font-family: var(--sl-font-sans);
    font-size: var(--sl-font-size-medium);
    font-weight: var(--sl-font-weight-normal);
    line-height: var(--sl-line-height-dense);
    letter-spacing: var(--sl-letter-spacing-normal);
  }

  .tree-item__checkbox::part(base) {
    display: flex;
    align-items: center;
  }

  .tree-item__indentation {
    display: block;
    width: 1em;
    flex-shrink: 0;
  }

  .tree-item__expand-button {
    display: flex;
    align-items: center;
    justify-content: center;
    box-sizing: content-box;
    color: var(--sl-color-neutral-500);
    padding: var(--sl-spacing-x-small);
    width: 1rem;
    height: 1rem;
    flex-shrink: 0;
    cursor: pointer;
  }

  .tree-item__expand-button {
    transition: var(--sl-transition-medium) rotate ease;
  }

  .tree-item--expanded .tree-item__expand-button {
    rotate: 90deg;
  }

  .tree-item--expanded.tree-item--rtl .tree-item__expand-button {
    rotate: -90deg;
  }

  .tree-item--expanded slot[name='expand-icon'],
  .tree-item:not(.tree-item--expanded) slot[name='collapse-icon'] {
    display: none;
  }

  .tree-item:not(.tree-item--has-expand-button) .tree-item__expand-icon-slot {
    display: none;
  }

  .tree-item__expand-button--visible {
    cursor: pointer;
  }

  .tree-item__item {
    display: flex;
    align-items: center;
    border-inline-start: solid 3px transparent;
  }

  .tree-item--disabled .tree-item__item {
    opacity: 0.5;
    outline: none;
    cursor: not-allowed;
  }

  :host(:focus-visible) .tree-item__item {
    outline: var(--sl-focus-ring);
    outline-offset: var(--sl-focus-ring-offset);
    z-index: 2;
  }

  :host(:not([aria-disabled='true'])) .tree-item--selected .tree-item__item {
    background-color: var(--sl-color-neutral-100);
    border-inline-start-color: var(--sl-color-primary-600);
  }

  :host(:not([aria-disabled='true'])) .tree-item__expand-button {
    color: var(--sl-color-neutral-600);
  }

  .tree-item__label {
    display: flex;
    align-items: center;
    transition: var(--sl-transition-fast) color;
  }

  .tree-item__children {
    display: block;
    font-size: calc(1em + var(--indent-size, var(--sl-spacing-medium)));
  }

  /* Indentation lines */
  .tree-item__children {
    position: relative;
  }

  .tree-item__children::before {
    content: '';
    position: absolute;
    top: var(--indent-guide-offset);
    bottom: var(--indent-guide-offset);
    left: calc(1em - (var(--indent-guide-width) / 2) - 1px);
    border-inline-end: var(--indent-guide-width) var(--indent-guide-style) var(--indent-guide-color);
    z-index: 1;
  }

  .tree-item--rtl .tree-item__children::before {
    left: auto;
    right: 1em;
  }

  @media (forced-colors: active) {
    :host(:not([aria-disabled='true'])) .tree-item--selected .tree-item__item {
      outline: dashed 1px SelectedItem;
    }
  }
`;
//#endregion
//#region node_modules/lit-html/directives/when.js
function Pe(e, t, n) {
	return e ? t(e) : n?.(e);
}
//#endregion
//#region node_modules/@shoelace-style/shoelace/dist/chunks/chunk.P4TU54CC.js
var k = class e extends v {
	constructor() {
		super(...arguments), this.localize = new C(this), this.indeterminate = !1, this.isLeaf = !1, this.loading = !1, this.selectable = !1, this.expanded = !1, this.selected = !1, this.disabled = !1, this.lazy = !1;
	}
	static isTreeItem(e) {
		return e instanceof Element && e.getAttribute("role") === "treeitem";
	}
	connectedCallback() {
		super.connectedCallback(), this.setAttribute("role", "treeitem"), this.setAttribute("tabindex", "-1"), this.isNestedItem() && (this.slot = "children");
	}
	firstUpdated() {
		this.childrenContainer.hidden = !this.expanded, this.childrenContainer.style.height = this.expanded ? "auto" : "0", this.isLeaf = !this.lazy && this.getChildrenItems().length === 0, this.handleExpandedChange();
	}
	async animateCollapse() {
		this.emit("sl-collapse"), await te(this.childrenContainer);
		let { keyframes: e, options: t } = ne(this, "tree-item.collapse", { dir: this.localize.dir() });
		await ae(this.childrenContainer, re(e, this.childrenContainer.scrollHeight), t), this.childrenContainer.hidden = !0, this.emit("sl-after-collapse");
	}
	isNestedItem() {
		let t = this.parentElement;
		return !!t && e.isTreeItem(t);
	}
	handleChildrenSlotChange() {
		this.loading = !1, this.isLeaf = !this.lazy && this.getChildrenItems().length === 0;
	}
	willUpdate(e) {
		e.has("selected") && !e.has("indeterminate") && (this.indeterminate = !1);
	}
	async animateExpand() {
		this.emit("sl-expand"), await te(this.childrenContainer), this.childrenContainer.hidden = !1;
		let { keyframes: e, options: t } = ne(this, "tree-item.expand", { dir: this.localize.dir() });
		await ae(this.childrenContainer, re(e, this.childrenContainer.scrollHeight), t), this.childrenContainer.style.height = "auto", this.emit("sl-after-expand");
	}
	handleLoadingChange() {
		this.setAttribute("aria-busy", this.loading ? "true" : "false"), this.loading || this.animateExpand();
	}
	handleDisabledChange() {
		this.setAttribute("aria-disabled", this.disabled ? "true" : "false");
	}
	handleSelectedChange() {
		this.setAttribute("aria-selected", this.selected ? "true" : "false");
	}
	handleExpandedChange() {
		this.isLeaf ? this.removeAttribute("aria-expanded") : this.setAttribute("aria-expanded", this.expanded ? "true" : "false");
	}
	handleExpandAnimation() {
		this.expanded ? this.lazy ? (this.loading = !0, this.emit("sl-lazy-load")) : this.animateExpand() : this.animateCollapse();
	}
	handleLazyChange() {
		this.emit("sl-lazy-change");
	}
	getChildrenItems({ includeDisabled: t = !0 } = {}) {
		return this.childrenSlot ? [...this.childrenSlot.assignedElements({ flatten: !0 })].filter((n) => e.isTreeItem(n) && (t || !n.disabled)) : [];
	}
	render() {
		let e = this.localize.dir() === "rtl", t = !this.loading && (!this.isLeaf || this.lazy);
		return o`
      <div
        part="base"
        class="${S({
			"tree-item": !0,
			"tree-item--expanded": this.expanded,
			"tree-item--selected": this.selected,
			"tree-item--disabled": this.disabled,
			"tree-item--leaf": this.isLeaf,
			"tree-item--has-expand-button": t,
			"tree-item--rtl": this.localize.dir() === "rtl"
		})}"
      >
        <div
          class="tree-item__item"
          part="
            item
            ${this.disabled ? "item--disabled" : ""}
            ${this.expanded ? "item--expanded" : ""}
            ${this.indeterminate ? "item--indeterminate" : ""}
            ${this.selected ? "item--selected" : ""}
          "
        >
          <div class="tree-item__indentation" part="indentation"></div>

          <div
            part="expand-button"
            class=${S({
			"tree-item__expand-button": !0,
			"tree-item__expand-button--visible": t
		})}
            aria-hidden="true"
          >
            ${Pe(this.loading, () => o` <sl-spinner part="spinner" exportparts="base:spinner__base"></sl-spinner> `)}
            <slot class="tree-item__expand-icon-slot" name="expand-icon">
              <sl-icon library="system" name=${e ? "chevron-left" : "chevron-right"}></sl-icon>
            </slot>
            <slot class="tree-item__expand-icon-slot" name="collapse-icon">
              <sl-icon library="system" name=${e ? "chevron-left" : "chevron-right"}></sl-icon>
            </slot>
          </div>

          ${Pe(this.selectable, () => o`
              <sl-checkbox
                part="checkbox"
                exportparts="
                    base:checkbox__base,
                    control:checkbox__control,
                    control--checked:checkbox__control--checked,
                    control--indeterminate:checkbox__control--indeterminate,
                    checked-icon:checkbox__checked-icon,
                    indeterminate-icon:checkbox__indeterminate-icon,
                    label:checkbox__label
                  "
                class="tree-item__checkbox"
                ?disabled="${this.disabled}"
                ?checked="${fe(this.selected)}"
                ?indeterminate="${this.indeterminate}"
                tabindex="-1"
              ></sl-checkbox>
            `)}

          <slot class="tree-item__label" part="label"></slot>
        </div>

        <div class="tree-item__children" part="children" role="group">
          <slot name="children" @slotchange="${this.handleChildrenSlotChange}"></slot>
        </div>
      </div>
    `;
	}
};
k.styles = [_, Ne], k.dependencies = {
	"sl-checkbox": ue,
	"sl-icon": oe,
	"sl-spinner": ce
}, b([r()], k.prototype, "indeterminate", 2), b([r()], k.prototype, "isLeaf", 2), b([r()], k.prototype, "loading", 2), b([r()], k.prototype, "selectable", 2), b([e({
	type: Boolean,
	reflect: !0
})], k.prototype, "expanded", 2), b([e({
	type: Boolean,
	reflect: !0
})], k.prototype, "selected", 2), b([e({
	type: Boolean,
	reflect: !0
})], k.prototype, "disabled", 2), b([e({
	type: Boolean,
	reflect: !0
})], k.prototype, "lazy", 2), b([i("slot:not([name])")], k.prototype, "defaultSlot", 2), b([i("slot[name=children]")], k.prototype, "childrenSlot", 2), b([i(".tree-item__item")], k.prototype, "itemElement", 2), b([i(".tree-item__children")], k.prototype, "childrenContainer", 2), b([i(".tree-item__expand-button slot")], k.prototype, "expandButtonSlot", 2), b([y("loading", { waitUntilFirstUpdate: !0 })], k.prototype, "handleLoadingChange", 1), b([y("disabled")], k.prototype, "handleDisabledChange", 1), b([y("selected")], k.prototype, "handleSelectedChange", 1), b([y("expanded", { waitUntilFirstUpdate: !0 })], k.prototype, "handleExpandedChange", 1), b([y("expanded", { waitUntilFirstUpdate: !0 })], k.prototype, "handleExpandAnimation", 1), b([y("lazy", { waitUntilFirstUpdate: !0 })], k.prototype, "handleLazyChange", 1);
var A = k;
ie("tree-item.expand", {
	keyframes: [{
		height: "0",
		opacity: "0",
		overflow: "hidden"
	}, {
		height: "auto",
		opacity: "1",
		overflow: "hidden"
	}],
	options: {
		duration: 250,
		easing: "cubic-bezier(0.4, 0.0, 0.2, 1)"
	}
}), ie("tree-item.collapse", {
	keyframes: [{
		height: "auto",
		opacity: "1",
		overflow: "hidden"
	}, {
		height: "0",
		opacity: "0",
		overflow: "hidden"
	}],
	options: {
		duration: 200,
		easing: "cubic-bezier(0.4, 0.0, 0.2, 1)"
	}
});
//#endregion
//#region node_modules/@shoelace-style/shoelace/dist/chunks/chunk.G7B7WU5W.js
var Fe = n`
  :host {
    /*
     * These are actually used by tree item, but we define them here so they can more easily be set and all tree items
     * stay consistent.
     */
    --indent-guide-color: var(--sl-color-neutral-200);
    --indent-guide-offset: 0;
    --indent-guide-style: solid;
    --indent-guide-width: 0;
    --indent-size: var(--sl-spacing-large);

    display: block;

    /*
     * Tree item indentation uses the "em" unit to increment its width on each level, so setting the font size to zero
     * here removes the indentation for all the nodes on the first level.
     */
    font-size: 0;
  }
`;
//#endregion
//#region node_modules/@shoelace-style/shoelace/dist/chunks/chunk.MSDIZVRW.js
function Ie(e, t = !1) {
	function n(e) {
		let t = e.getChildrenItems({ includeDisabled: !1 });
		if (t.length) {
			let n = t.every((e) => e.selected), r = t.every((e) => !e.selected && !e.indeterminate);
			e.selected = n, e.indeterminate = !n && !r;
		}
	}
	function r(e) {
		let t = e.parentElement;
		A.isTreeItem(t) && (n(t), r(t));
	}
	function i(e) {
		for (let n of e.getChildrenItems()) n.selected = t ? e.selected || n.selected : !n.disabled && e.selected, i(n);
		t && n(e);
	}
	i(e), r(e);
}
var j = class extends v {
	constructor() {
		super(), this.selection = "single", this.clickTarget = null, this.localize = new C(this), this.initTreeItem = (e) => {
			e.selectable = this.selection === "multiple", ["expand", "collapse"].filter((e) => !!this.querySelector(`[slot="${e}-icon"]`)).forEach((t) => {
				let n = e.querySelector(`[slot="${t}-icon"]`), r = this.getExpandButtonIcon(t);
				r && (n === null ? e.append(r) : n.hasAttribute("data-default") && n.replaceWith(r));
			});
		}, this.handleTreeChanged = (e) => {
			for (let t of e) {
				let e = [...t.addedNodes].filter(A.isTreeItem), n = [...t.removedNodes].filter(A.isTreeItem);
				e.forEach(this.initTreeItem), this.lastFocusedItem && n.includes(this.lastFocusedItem) && (this.lastFocusedItem = null);
			}
		}, this.handleFocusOut = (e) => {
			let t = e.relatedTarget;
			(!t || !this.contains(t)) && (this.tabIndex = 0);
		}, this.handleFocusIn = (e) => {
			let t = e.target;
			e.target === this && this.focusItem(this.lastFocusedItem || this.getAllTreeItems()[0]), A.isTreeItem(t) && !t.disabled && (this.lastFocusedItem && (this.lastFocusedItem.tabIndex = -1), this.lastFocusedItem = t, this.tabIndex = -1, t.tabIndex = 0);
		}, this.addEventListener("focusin", this.handleFocusIn), this.addEventListener("focusout", this.handleFocusOut), this.addEventListener("sl-lazy-change", this.handleSlotChange);
	}
	async connectedCallback() {
		super.connectedCallback(), this.setAttribute("role", "tree"), this.setAttribute("tabindex", "0"), await this.updateComplete, this.mutationObserver = new MutationObserver(this.handleTreeChanged), this.mutationObserver.observe(this, {
			childList: !0,
			subtree: !0
		});
	}
	disconnectedCallback() {
		var e;
		super.disconnectedCallback(), (e = this.mutationObserver) == null || e.disconnect();
	}
	getExpandButtonIcon(e) {
		let t = (e === "expand" ? this.expandedIconSlot : this.collapsedIconSlot).assignedElements({ flatten: !0 })[0];
		if (t) {
			let n = t.cloneNode(!0);
			return [n, ...n.querySelectorAll("[id]")].forEach((e) => e.removeAttribute("id")), n.setAttribute("data-default", ""), n.slot = `${e}-icon`, n;
		}
		return null;
	}
	selectItem(e) {
		let t = [...this.selectedItems];
		if (this.selection === "multiple") e.selected = !e.selected, e.lazy && (e.expanded = !0), Ie(e);
		else if (this.selection === "single" || e.isLeaf) {
			let t = this.getAllTreeItems();
			for (let n of t) n.selected = n === e;
		} else this.selection === "leaf" && (e.expanded = !e.expanded);
		let n = this.selectedItems;
		(t.length !== n.length || n.some((e) => !t.includes(e))) && Promise.all(n.map((e) => e.updateComplete)).then(() => {
			this.emit("sl-selection-change", { detail: { selection: n } });
		});
	}
	getAllTreeItems() {
		return [...this.querySelectorAll("sl-tree-item")];
	}
	focusItem(e) {
		e?.focus();
	}
	handleKeyDown(e) {
		if (![
			"ArrowDown",
			"ArrowUp",
			"ArrowRight",
			"ArrowLeft",
			"Home",
			"End",
			"Enter",
			" "
		].includes(e.key) || e.composedPath().some((e) => ["input", "textarea"].includes((e?.tagName)?.toLowerCase()))) return;
		let t = this.getFocusableItems(), n = this.localize.dir() === "ltr", r = this.localize.dir() === "rtl";
		if (t.length > 0) {
			e.preventDefault();
			let i = t.findIndex((e) => e.matches(":focus")), a = t[i], o = (e) => {
				let n = t[ge(e, 0, t.length - 1)];
				this.focusItem(n);
			}, s = (e) => {
				a.expanded = e;
			};
			e.key === "ArrowDown" ? o(i + 1) : e.key === "ArrowUp" ? o(i - 1) : n && e.key === "ArrowRight" || r && e.key === "ArrowLeft" ? !a || a.disabled || a.expanded || a.isLeaf && !a.lazy ? o(i + 1) : s(!0) : n && e.key === "ArrowLeft" || r && e.key === "ArrowRight" ? !a || a.disabled || a.isLeaf || !a.expanded ? o(i - 1) : s(!1) : e.key === "Home" ? o(0) : e.key === "End" ? o(t.length - 1) : (e.key === "Enter" || e.key === " ") && (a.disabled || this.selectItem(a));
		}
	}
	handleClick(e) {
		let t = e.target, n = t.closest("sl-tree-item"), r = e.composedPath().some((e) => (e?.classList)?.contains("tree-item__expand-button"));
		!n || n.disabled || t !== this.clickTarget || (r ? n.expanded = !n.expanded : this.selectItem(n));
	}
	handleMouseDown(e) {
		this.clickTarget = e.target;
	}
	handleSlotChange() {
		this.getAllTreeItems().forEach(this.initTreeItem);
	}
	async handleSelectionChange() {
		let e = this.selection === "multiple", t = this.getAllTreeItems();
		this.setAttribute("aria-multiselectable", e ? "true" : "false");
		for (let n of t) n.selectable = e;
		e && (await this.updateComplete, [...this.querySelectorAll(":scope > sl-tree-item")].forEach((e) => Ie(e, !0)));
	}
	get selectedItems() {
		return this.getAllTreeItems().filter((e) => e.selected);
	}
	getFocusableItems() {
		let e = this.getAllTreeItems(), t = /* @__PURE__ */ new Set();
		return e.filter((e) => {
			if (e.disabled) return !1;
			let n = e.parentElement?.closest("[role=treeitem]");
			return n && (!n.expanded || n.loading || t.has(n)) && t.add(e), !t.has(e);
		});
	}
	render() {
		return o`
      <div
        part="base"
        class="tree"
        @click=${this.handleClick}
        @keydown=${this.handleKeyDown}
        @mousedown=${this.handleMouseDown}
      >
        <slot @slotchange=${this.handleSlotChange}></slot>
        <span hidden aria-hidden="true"><slot name="expand-icon"></slot></span>
        <span hidden aria-hidden="true"><slot name="collapse-icon"></slot></span>
      </div>
    `;
	}
};
//#endregion
//#region node_modules/@shoelace-style/shoelace/dist/chunks/chunk.GTHX4FOE.js
j.styles = [_, Fe], b([i("slot:not([name])")], j.prototype, "defaultSlot", 2), b([i("slot[name=expand-icon]")], j.prototype, "expandedIconSlot", 2), b([i("slot[name=collapse-icon]")], j.prototype, "collapsedIconSlot", 2), b([e()], j.prototype, "selection", 2), b([y("selection")], j.prototype, "handleSelectionChange", 1), j.define("sl-tree"), A.define("sl-tree-item");
//#endregion
//#region src/utils/layer-swatch.ts
function Le(e) {
	let t = `--swatch-bg: ${e.background}`;
	return e.border ? `${t}; --swatch-border: ${e.border}; --swatch-border-width: 2px` : t;
}
var M = "var(--color-background-tertiary, #e9edf1)", Re = "var(--color-surface, #fff)", N = 5, ze = new Set(/* @__PURE__ */ "black.silver.gray.grey.white.maroon.red.purple.fuchsia.green.lime.olive.yellow.navy.blue.teal.aqua.cyan.orange.brown.pink.gold.beige.tan.transparent.steelblue.darkblue.lightblue.darkgreen.lightgreen.darkred".split("."));
function P(e) {
	if (typeof e != "string") return !1;
	let t = e.trim().toLowerCase();
	return /^#[0-9a-f]{3,8}$/.test(t) || /^(rgb|rgba|hsl|hsla|hwb|lab|lch|oklab|oklch|color)\(/.test(t) ? !0 : ze.has(t);
}
function F(e, t) {
	let n = [];
	for (let r of t) {
		let t = e[r];
		P(t) && n.push(t);
	}
	return n;
}
function Be(e) {
	if (P(e)) return [e];
	if (!Array.isArray(e) || e.length === 0) return [];
	let t = e[0];
	if (typeof t != "string") return [];
	let n = (t, n) => {
		let r = [];
		for (let i = t; i < e.length; i += n) r.push(i);
		return r;
	};
	if (t === "interpolate" || t === "interpolate-hcl" || t === "interpolate-lab") return F(e, n(4, 2)).slice(0, N);
	if (t === "step") return F(e, [2, ...n(4, 2)]).slice(0, N);
	if (t === "match") return F(e, [...n(3, 2), e.length - 1]).slice(0, N);
	if (t === "case") return F(e, [...n(2, 2), e.length - 1]).slice(0, N);
	if (t === "coalesce" || t === "to-color") for (let t of e.slice(1)) {
		let e = Be(t);
		if (e.length) return e;
	}
	return [];
}
function Ve(e) {
	let t = e.trim().toLowerCase();
	if (t === "transparent") return !0;
	if (/^#[0-9a-f]{4}$/.test(t)) return t[4] === "0";
	if (/^#[0-9a-f]{8}$/.test(t)) return t.slice(7) === "00";
	let n = /^(?:rgba|hsla)\([^)]*?,\s*([\d.]+)\s*\)$/.exec(t);
	return n ? Number(n[1]) === 0 : !1;
}
function I(e, t) {
	if (e = e.filter((e) => !Ve(e)), e.length === 0) return M;
	if (e.length === 1) return e[0];
	if (t) return `linear-gradient(135deg, ${e.join(", ")})`;
	let n = 100 / e.length;
	return `linear-gradient(135deg, ${e.map((e, t) => `${e} ${t * n}% ${(t + 1) * n}%`).join(", ")})`;
}
function He(e) {
	let t = e.metadata?.swatch;
	if (typeof t != "string" || t.length === 0) return null;
	let n = t.trim();
	return n.startsWith("data:image/") ? {
		background: `url("${n}")`,
		kind: "preview"
	} : P(n) ? {
		background: n,
		kind: "preview"
	} : null;
}
var Ue = {
	fill: 5,
	"fill-extrusion": 5,
	circle: 4,
	line: 3,
	symbol: 1
};
function We(e) {
	let t = e?.type;
	return typeof t == "string" ? t : "";
}
function Ge(e) {
	let t = e ?? {}, n = t.paint ?? {}, r = typeof t.type == "string" ? t.type : "", i = He(t);
	if (i) return i;
	let a = (e) => {
		let t = n[e], r = Array.isArray(t) ? t[0] : null;
		return {
			stops: Be(t),
			smooth: typeof r == "string" && r.startsWith("interpolate")
		};
	};
	if (Array.isArray(t.layers) && t.layers.length > 0) {
		let e = null, n = null, i = !1;
		for (let r of t.layers) {
			let t = We(r), a = Ue[t] ?? 0;
			if (a === 0) continue;
			let o = Ge(r);
			(t === "fill" || t === "fill-extrusion") && (i = !0), o.background !== M && (t === "line" && !n && (n = o.background), (!e || a > e.rank) && (e = {
				swatch: o,
				rank: a
			}));
		}
		if (e) {
			let t = e.swatch.border ?? (i ? n : null);
			return t ? {
				background: e.swatch.kind === "line" ? Re : e.swatch.background,
				kind: "fill",
				border: t
			} : e.swatch;
		}
		return i && n ? {
			background: Re,
			kind: "fill",
			border: n
		} : {
			background: M,
			kind: r === "style" ? "raster" : "unknown"
		};
	}
	if (r === "raster" || r === "raster-dem" || r === "hillshade" || r === "style") return {
		background: M,
		kind: "raster"
	};
	if (r === "background") {
		let { stops: e, smooth: t } = a("background-color");
		return {
			background: I(e, t),
			kind: "fill"
		};
	}
	if (r === "fill" || r === "fill-extrusion") {
		let { stops: e, smooth: t } = a(r === "fill" ? "fill-color" : "fill-extrusion-color"), n = I(e, t), i = I(a("fill-outline-color").stops, !1);
		return i === M ? {
			background: n,
			kind: "fill"
		} : {
			background: n === M ? Re : n,
			kind: "fill",
			border: i
		};
	}
	if (r === "line") {
		let { stops: e, smooth: t } = a("line-color");
		return {
			background: I(e, t),
			kind: "line"
		};
	}
	if (r === "circle") {
		let { stops: e, smooth: t } = a("circle-color");
		return {
			background: I(e, t),
			kind: "circle"
		};
	}
	if (r === "symbol") {
		let { stops: e, smooth: t } = a("text-color");
		return {
			background: I(e, t),
			kind: "unknown"
		};
	}
	return {
		background: M,
		kind: "unknown"
	};
}
function Ke(e) {
	let t = /^(.*\S)\s*\(([^()]+)\)\s*$/.exec(e ?? "");
	return t ? {
		name: t[1],
		qualifier: t[2]
	} : {
		name: e ?? "",
		qualifier: ""
	};
}
//#endregion
//#region src/components/webmapx-layer-tree.ts
var L = class extends c {
	constructor(...e) {
		super(...e), this.tree = [], this.toolId = null, this.configTree = [], this.searchQuery = "", this.searchThreshold = 8, this.configHandler = null, this.addLayerFailedHandler = null, this.mapReadyHandler = null, this.adapter = null, this.unsubscribeLayerAdd = null, this.unsubscribeLayerRemove = null, this.nodeByKey = /* @__PURE__ */ new Map(), this.supportStatusByLayerId = /* @__PURE__ */ new Map(), this.capsCache = /* @__PURE__ */ new Map(), this.pendingSupportChecks = /* @__PURE__ */ new Set(), this.supportQueue = [], this.supportChecksInFlight = 0, this.maxConcurrentSupportChecks = 3, this.didQueueRootSupportChecks = !1;
	}
	static {
		this.styles = [_e, n`
        :host {
            display: block;
            height: auto; /* let parent control available height */
            overflow: visible; /* do not create a nested scroll container */
            padding: 0.25rem;
            box-sizing: border-box;
            background: var(--webmapx-layer-tree-bg, var(--color-surface, #fff));
            border-left: 1px solid var(--color-border-light, #e2e7ec);
            width: 100%; /* inherit panel width; avoid forcing overflow */
            margin: 0;
            font-size: var(--webmapx-layer-tree-font-size, 0.8rem);
            --sl-font-size-medium: var(--webmapx-layer-tree-font-size, 0.8rem);
            --sl-font-size-small: var(--webmapx-layer-tree-font-size, 0.8rem);
            --sl-tree-item-label-font-size: var(--webmapx-layer-tree-font-size, 0.8rem);
        }
        sl-tree {
            display: block;
            height: auto;
            overflow: visible;
            box-sizing: border-box;
        }
        sl-tree-item::part(item) {
            padding-top: 0;
            padding-bottom: 0;
            min-height: 1.25rem;
        }
        /* The control sits at the row's trailing edge, as in the legend, which
           takes growth at BOTH levels. Shoelace's label part is a <slot> that
           its own stylesheet gives display:flex — so the slot, not the slotted
           control, is the flex item of the row, and it shrink-wraps unless
           told to grow. Widening only the control (or only the slot) leaves
           the switch mid-row. */
        sl-tree-item::part(label) {
            font-size: var(--webmapx-layer-tree-font-size, 0.8rem);
            line-height: 1.2;
            flex: 1 1 auto;
            min-width: 0;
        }
        sl-switch,
        .layer-radio {
            flex: 1 1 auto;
            width: 100%;
            min-width: 0;
        }
        sl-tree-item::part(expand-button) {
            padding: 0;
        }
        /* Visibility is a state you flip, not a selection you tick — the switch
           says "this layer is on the map" the way the legend rows do. Sized
           down from the Shoelace default so the tree keeps its density, and
           pointed at the webmapx accent rather than the Shoelace primary. */
        sl-switch {
            --width: 1.75rem;
            --height: 1rem;
            --thumb-size: 0.75rem;
            --sl-input-height-medium: 1rem;
            --sl-color-primary-600: var(--color-primary, #2b6c8f);
            --sl-color-primary-500: var(--color-primary, #2b6c8f);
        }
        /* row-reverse rather than the order property, so the DOM keeps control-then-label
           (which is what Shoelace's own label/for wiring and the keyboard
           handler expect) while the eye reads name-then-switch. */
        sl-switch::part(base) {
            width: 100%;
            flex-direction: row-reverse;
            justify-content: space-between;
            gap: 0.4rem;
        }
        sl-switch::part(control) {
            flex: none;
        }
        sl-switch::part(label) {
            font-size: var(--webmapx-layer-tree-font-size, 0.8rem);
            line-height: 1.2;
            padding-left: 0;
            margin-inline-start: 0;
            flex: 1;
            min-width: 0;
        }
        /* A layer row reads as a map thing, not a filename: a derived colour
           swatch, the human name, and the technical qualifier demoted to a
           muted second line. */
        .layer-row {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            min-width: 0;
        }
        /* The derived colour arrives as --swatch-bg rather than an inline
           background shorthand, because the shorthand would reset the
           background-image that the raster/unknown kinds layer on top. */
        .layer-swatch {
            flex: none;
            width: 1.125rem;
            height: 1.125rem;
            border-radius: var(--webmapx-radius-xs, 3px);
            background: var(--swatch-bg, var(--color-background-tertiary, #e9edf1));
            /* The hairline is the swatch's own edge; a layer that states an
               outline colour (boundaries: transparent fill, coloured line)
               replaces it with a thicker ring in that colour, so the row shows
               both what the layer fills and what it draws around it. */
            box-shadow: inset 0 0 0 var(--swatch-border-width, 1px)
                var(--swatch-border, rgba(16, 24, 40, 0.16));
        }
        .layer-swatch[data-kind='line'] {
            height: 0.3125rem;
            border-radius: 999px;
        }
        .layer-swatch[data-kind='circle'] {
            border-radius: 50%;
            width: 0.875rem;
            height: 0.875rem;
        }
        /* A real tile (or a style's paper colour) stood in for the hatch.
           Cover + centre so an 18px box shows the middle of the tile, which at
           this size reads as the layer's average colour. */
        .layer-swatch[data-kind='preview'] {
            background-size: cover;
            background-position: center;
            background-repeat: no-repeat;
        }
        /* Nothing derivable: a small hatch says "a layer" without pretending
           to know what colour it is. */
        .layer-swatch[data-kind='raster'],
        .layer-swatch[data-kind='unknown'] {
            background-image: repeating-linear-gradient(45deg,
                rgba(16, 24, 40, 0.16) 0 2px, transparent 2px 5px);
        }
        .layer-text {
            display: flex;
            flex-direction: column;
            min-width: 0;
            line-height: 1.2;
        }
        .layer-name,
        .layer-qualifier {
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }
        .layer-qualifier {
            font-size: 0.9em;
            color: var(--color-text-muted, #6b7681);
        }

        .tree-separator {
            display: flex;
            align-items: center;
            gap: 0.4em;
            width: 100%;
            font-weight: 600;
            color: var(--color-text-muted, #6b7681);
            padding: 0.25rem 0 0.1rem;
            pointer-events: none;
            user-select: none;
        }
        .tree-separator::before {
            content: '';
            width: 12px;
            flex: 0 0 12px;
            height: 1px;
            background: currentColor;
            opacity: 0.35;
        }
        .tree-separator::after {
            content: '';
            flex: 1;
            min-width: 8px;
            height: 1px;
            background: currentColor;
            opacity: 0.35;
        }
        sl-tree-item.separator-item::part(item) {
            cursor: default;
        }
        sl-tree-item.separator-item::part(expand-button) {
            display: none;
        }
        sl-tree-item.separator-item::part(label) {
            flex: 1;
            min-width: 0;
        }
        /* Same trailing-edge alignment as the switch above, so an exclusive
           background row and a toggleable overlay row line up in one column. */
        .layer-radio {
            display: flex;
            flex-direction: row-reverse;
            justify-content: space-between;
            align-items: center;
            width: 100%;
            gap: 0.4rem;
            font: inherit;
            color: inherit;
            cursor: pointer;
        }
        .layer-radio > :not(input) {
            flex: 1;
            min-width: 0;
        }
        .search {
            position: relative;
            margin-bottom: 0.25rem;
        }
        .layer-radio input[type='radio'] {
            width: 0.75rem;
            height: 0.75rem;
            margin: 0;
            flex: none;
        }
    `];
	}
	connectedCallback() {
		super.connectedCallback(), this.subscribeToConfig(), this.subscribeToAddLayerFailed(), this.bindToMapEvents();
	}
	disconnectedCallback() {
		this.unsubscribeFromConfig(), this.unsubscribeFromAddLayerFailed(), this.unsubscribeFromMapEvents(), super.disconnectedCallback();
	}
	get mapHost() {
		return this.closest("webmapx-map");
	}
	subscribeToConfig() {
		this.unsubscribeFromConfig();
		let e = this.getTreeFromMapConfig(this.mapHost?.config ?? null);
		e.length > 0 && (this.configTree = e, this.readSearchConfig(this.mapHost?.config ?? null), this.didQueueRootSupportChecks = !1, this.queueRootLazySupportChecks()), this.configHandler = (e) => {
			let t = e.detail, n = this.getTreeFromMapConfig(t.config ?? null);
			n.length > 0 && (this.configTree = n, this.readSearchConfig(t.config ?? null), this.didQueueRootSupportChecks = !1, this.adapter && this.syncCheckedLayersFromStore(), this.queueRootLazySupportChecks());
		}, this.mapHost?.addEventListener("webmapx-config-ready", this.configHandler);
	}
	async bindToMapEvents() {
		this.unsubscribeFromMapEvents();
		let e = this.mapHost;
		if (!e) return;
		let t = await e.getAdapterAsync?.();
		if (!t) {
			this.subscribeToMapReady();
			return;
		}
		this.adapter = t, this.unsubscribeLayerAdd = t.events.on("layer-add", (e) => {
			this.setLayerCheckedState(e.layerId, !0);
		}), this.unsubscribeLayerRemove = t.events.on("layer-remove", (e) => {
			this.setLayerCheckedState(e.layerId, !1);
		}), this.syncCheckedLayersFromStore(), this.queueRootLazySupportChecks();
	}
	supportOfSpec(e) {
		let t = this.mapHost;
		return typeof t?.isLayerSpecSupported == "function" ? t.isLayerSpecSupported(e) ? "supported" : "unsupported" : "unknown";
	}
	getSupportStatus(e) {
		return e ? this.supportStatusByLayerId.get(e) ?? "unknown" : "unknown";
	}
	setSupportStatus(e, t) {
		this.supportStatusByLayerId.get(e) !== t && (this.supportStatusByLayerId.set(e, t), this.requestUpdate());
	}
	collectLayerIdsForSupport(e) {
		if (e.layerId) return e.layerSpec ? [] : [e.layerId];
		let t = Array.isArray(e.children) ? e.children : [], n = [];
		for (let e of t) !e.layerId && e.expanded !== !0 || n.push(...this.collectLayerIdsForSupport(e));
		return n;
	}
	queueSupportCheck(e) {
		let t = this.getSupportStatus(e);
		t === "supported" || t === "unsupported" || t === "checking" || this.pendingSupportChecks.has(e) || (this.pendingSupportChecks.add(e), this.supportQueue.push(e), this.pumpSupportQueue());
	}
	pumpSupportQueue() {
		for (; this.supportChecksInFlight < this.maxConcurrentSupportChecks && this.supportQueue.length > 0;) {
			let e = this.supportQueue.shift();
			e && this.runSupportCheck(e);
		}
	}
	async runSupportCheck(e) {
		if (!this.pendingSupportChecks.has(e)) return;
		let t = this.mapHost;
		if (!t) {
			this.pendingSupportChecks.delete(e);
			return;
		}
		this.pendingSupportChecks.delete(e), this.supportChecksInFlight += 1, this.setSupportStatus(e, "checking");
		try {
			let n = await t.isCatalogLayerSupported(e);
			this.setSupportStatus(e, n ? "supported" : "unsupported"), n || this.setLayerCheckedState(e, !1);
		} catch {
			this.setSupportStatus(e, "unknown");
		} finally {
			this.supportChecksInFlight = Math.max(0, this.supportChecksInFlight - 1), this.pumpSupportQueue();
		}
	}
	queueRootLazySupportChecks() {
		if (!this.adapter || this.didQueueRootSupportChecks) return;
		let e = this.effectiveTree;
		if (!(!Array.isArray(e) || e.length === 0)) {
			for (let t of e) {
				if (t.layerId) {
					this.queueSupportCheck(t.layerId);
					continue;
				}
				if (t.expanded === !0 && Array.isArray(t.children)) for (let e of this.collectLayerIdsForSupport(t)) this.queueSupportCheck(e);
			}
			this.didQueueRootSupportChecks = !0;
		}
	}
	handleTreeExpand(e) {
		let t = e.target?.getAttribute?.("data-node-key");
		if (!t) return;
		let n = this.nodeByKey.get(t);
		if (n) for (let e of this.collectLayerIdsForSupport(n)) this.queueSupportCheck(e);
	}
	subscribeToMapReady() {
		if (this.mapReadyHandler) return;
		let e = this.mapHost;
		e && (this.mapReadyHandler = () => {
			this.unsubscribeFromMapReady(), this.bindToMapEvents();
		}, e.addEventListener("webmapx-map-ready", this.mapReadyHandler));
	}
	unsubscribeFromMapReady() {
		this.mapReadyHandler &&= (this.mapHost?.removeEventListener("webmapx-map-ready", this.mapReadyHandler), null);
	}
	unsubscribeFromMapEvents() {
		this.unsubscribeFromMapReady(), this.unsubscribeLayerAdd?.(), this.unsubscribeLayerRemove?.(), this.unsubscribeLayerAdd = null, this.unsubscribeLayerRemove = null, this.adapter = null;
	}
	subscribeToAddLayerFailed() {
		this.unsubscribeFromAddLayerFailed(), this.addLayerFailedHandler = (e) => {
			let t = e.detail?.layerId;
			t && this.uncheckLayerById(t);
		}, this.mapHost?.addEventListener("webmapx-addlayer-failed", this.addLayerFailedHandler);
	}
	unsubscribeFromAddLayerFailed() {
		this.addLayerFailedHandler &&= (this.mapHost?.removeEventListener("webmapx-addlayer-failed", this.addLayerFailedHandler), null);
	}
	uncheckLayerById(e) {
		this.setLayerCheckedState(e, !1);
	}
	mapTreeNodes(e, t) {
		let n = !1, r = e.map((e) => {
			let r = t(e);
			return r !== e && (n = !0), r;
		});
		return n ? r : e;
	}
	updateEffectiveTree(e) {
		if (this.tree.length > 0) {
			let t = this.mapTreeNodes(this.tree, e);
			t !== this.tree && (this.tree = t);
			return;
		}
		let t = this.configTree, n = this.mapTreeNodes(t, e);
		n !== t && (this.configTree = n);
	}
	setLayerCheckedInNode(e, t, n) {
		let r = !1, i = e.children;
		return e.children?.length && (i = this.mapTreeNodes(e.children, (e) => this.setLayerCheckedInNode(e, t, n)), i !== e.children && (r = !0)), e.layerId === t && e.checked !== n ? {
			...e,
			checked: n,
			...i ? { children: i } : {}
		} : r ? {
			...e,
			...i ? { children: i } : {}
		} : e;
	}
	setLayerCheckedState(e, t) {
		this.updateEffectiveTree((n) => this.setLayerCheckedInNode(n, e, t));
	}
	syncCheckedLayersFromStore() {
		let e = Object.keys(this.adapter?.store.getState().mapLayers ?? {}), t = new Set(e), n = (e) => {
			let r = !1, i = e.children;
			if (e.children?.length && (i = this.mapTreeNodes(e.children, n), i !== e.children && (r = !0)), e.layerId) {
				let n = t.has(e.layerId);
				if (e.checked !== n) return {
					...e,
					checked: n,
					...i ? { children: i } : {}
				};
			}
			return r ? {
				...e,
				...i ? { children: i } : {}
			} : e;
		};
		this.updateEffectiveTree(n);
	}
	unsubscribeFromConfig() {
		this.configHandler &&= (this.mapHost?.removeEventListener("webmapx-config-ready", this.configHandler), null);
	}
	get effectiveTree() {
		return this.tree.length > 0 ? this.tree : this.configTree;
	}
	getChildSelectionContext(e, t, n) {
		let r = e.selectionMode ?? t?.selectionMode ?? "multiple", i = e.selectionGroup ?? t?.selectionGroup ?? null, a = null;
		return r === "single" && (a = i || (e.children?.length ? `tree-group:${n ?? "root"}` : t?.exclusiveGroupKey ?? (typeof e.layerId == "string" ? `layer:${e.layerId}` : null))), {
			selectionMode: r,
			selectionGroup: i,
			exclusiveGroupKey: a,
			allowNone: e.allowNone ?? t?.allowNone ?? !1,
			stackOrder: e.stackOrder ?? t?.stackOrder
		};
	}
	resolveNodeLabel(e) {
		if (e.label) return e.label;
		if (e.layerId) {
			let t = this.getLayerInformationById(e.layerId)?.layer?.title;
			return typeof t == "string" && t ? t : e.layerId;
		}
		return "";
	}
	renderLayerLabel(e, t) {
		let { name: n, qualifier: r } = Ke(this.resolveNodeLabel(e)), i = Ge((e.layerId ? this.getLayerInformationById(e.layerId)?.layer : null) ?? e.layerSpec ?? null), a = t ? "unsupported for current engine" : r;
		return o`
            <span class="layer-row" title=${r ? `${n} (${r})` : n}>
                <span
                    class="layer-swatch"
                    data-kind=${i.kind}
                    style=${Le(i)}
                    aria-hidden="true"
                ></span>
                <span class="layer-text">
                    <span class="layer-name">${n}</span>
                    ${a ? o`<span class="layer-qualifier">${a}</span>` : ""}
                </span>
            </span>
        `;
	}
	getLayerInformationById(e) {
		let t = this.mapHost?.layerDataConfig;
		if (!t) return null;
		let n = t.layers?.find((t) => t.id === e);
		return n ? { layer: n } : null;
	}
	getTreeFromMapConfig(e) {
		if (!e || typeof e != "object") return [];
		let t = e.tools, n = this.findTreeInTools(t);
		if (n.length > 0) return n;
		let r = e.catalog?.tree;
		return Array.isArray(r) ? r : [];
	}
	findTreeInTools(e) {
		return this.findLayerTreeToolItem(e)?.tree ?? [];
	}
	findLayerTreeToolItem(e) {
		if (!e || typeof e != "object") return null;
		let t = e.layerTree;
		if (t && Array.isArray(t.tree)) return t;
		let n = Object.values(e).filter((e) => !!e && typeof e == "object");
		for (let e of n) {
			let t = Array.isArray(e.items) ? e.items : [];
			for (let e of t) {
				if (!e || typeof e != "object") continue;
				let t = e;
				if (t.type !== "layerTree") continue;
				let n = typeof t.id == "string" ? t.id : null;
				if (!(this.toolId && n && n !== this.toolId) && Array.isArray(t.tree)) return t;
			}
		}
		return null;
	}
	readSearchConfig(e) {
		let t = this.findLayerTreeToolItem(e?.tools);
		t && (typeof t.showSearch == "boolean" && (this.showSearchConfig = t.showSearch), typeof t.searchThreshold == "number" && (this.searchThreshold = t.searchThreshold));
	}
	countLeaves(e) {
		let t = 0;
		for (let n of e) n.separator || (n.children?.length ? t += this.countLeaves(n.children) : n.layerId && (t += 1));
		return t;
	}
	get showSearch() {
		return this.showSearchConfig === void 0 ? this.countLeaves(this.effectiveTree) > this.searchThreshold : this.showSearchConfig;
	}
	filterTree(e, t, n = []) {
		let r = [], i = null;
		for (let a of e) {
			if (a.separator) {
				i = a;
				continue;
			}
			if (a.children?.length) {
				let e = this.filterTree(a.children, t, [...n, this.resolveNodeLabel(a)]);
				e.length > 0 && (i &&= (r.push(i), null), r.push({
					...a,
					children: e,
					expanded: !0
				}));
				continue;
			}
			this.nodeMatchesQuery(a, t, n) && (i &&= (r.push(i), null), r.push(a));
		}
		return r;
	}
	nodeMatchesQuery(e, t, n) {
		if (this.resolveNodeLabel(e).toLowerCase().includes(t) || n.join(" ").toLowerCase().includes(t)) return !0;
		if (!e.layerId) return !1;
		let r = this.getLayerInformationById(e.layerId)?.layer;
		if (!r) return !1;
		if (r.metadata?.abstract?.toLowerCase().includes(t) || r.attribution?.toLowerCase().includes(t)) return !0;
		for (let e of r.metadata?.attributes?.translations ?? []) {
			if (e.name?.toLowerCase().includes(t) || e.translation?.toLowerCase().includes(t)) return !0;
			for (let n of e.valuemap ?? []) if (n.label?.toLowerCase().includes(t) || String(n.value ?? "").toLowerCase().includes(t)) return !0;
		}
		return !!(typeof r.source == "string" && (this.mapHost?.layerDataConfig?.sources?.find((e) => e.id === r.source)?.attribution)?.toLowerCase().includes(t));
	}
	handleSearchInput(e) {
		this.searchQuery = e.target.value;
	}
	handleSearchClear() {
		this.searchQuery = "";
	}
	dispatchLayerCheck(e) {
		this.dispatchEvent(new CustomEvent("add-layer", {
			detail: e,
			bubbles: !0,
			composed: !0
		}));
	}
	getExclusiveGroupKey(e, t) {
		return t.selectionMode === "single" ? t.exclusiveGroupKey ?? t.selectionGroup ?? (typeof e.layerId == "string" ? `layer:${e.layerId}` : null) : null;
	}
	clearExclusiveSelection(e, t, n) {
		let r = [], i = (e, a) => {
			for (let o of e) {
				let e = this.getChildSelectionContext(o, a);
				if (o.children?.length) {
					i(o.children, e);
					continue;
				}
				!o.layerId || o.layerId === t || this.getExclusiveGroupKey(o, e) !== n || o.checked !== !0 || r.push(o.layerId);
			}
		};
		return i(e, void 0), r;
	}
	capsKey(e) {
		return `${e.url}||${JSON.stringify(e.allowedLayers ?? [])}||${JSON.stringify(e.deniedLayers ?? [])}`;
	}
	normalizeLayerList(e) {
		return e ? Array.isArray(e) ? e.map((e) => e.trim()).filter(Boolean) : e.split(",").map((e) => e.trim()).filter(Boolean) : [];
	}
	async fetchCapabilities(e) {
		let t = this.capsKey(e);
		if (!this.capsCache.has(t)) {
			this.capsCache.set(t, { status: "loading" }), this.requestUpdate();
			try {
				let { discoverWms: n } = await import("./layer-discovery-BqmCTUon.js"), r = await n(e.url), i = this.normalizeLayerList(e.allowedLayers), a = new Set(this.normalizeLayerList(e.deniedLayers)), o = e.tilecacheUrl ? Array.isArray(e.tilecacheUrl) ? e.tilecacheUrl : [e.tilecacheUrl] : void 0, s = r.filter((e) => {
					let t = e.layer.id;
					return !(a.has(t) || i.length > 0 && !i.includes(t));
				}).map((e) => {
					let t = e.layer, n = { ...e.source }, r = t.id;
					if (o && n.url) {
						let e = Array.isArray(n.url) ? n.url[0] : n.url, t = e.indexOf("?"), r = t >= 0 ? e.slice(t) : "", i = o.map((e) => e + r);
						n.url = i, n.tiles &&= i;
					}
					return {
						label: t.title ?? r,
						layerId: r,
						layerSpec: {
							...t,
							sources: { [n.id]: n }
						}
					};
				});
				i.length > 0 && s.sort((e, t) => i.indexOf(e.layerId) - i.indexOf(t.layerId)), this.capsCache.set(t, {
					status: "loaded",
					children: s
				});
			} catch (e) {
				this.capsCache.set(t, {
					status: "error",
					error: e instanceof Error ? e.message : String(e)
				});
			}
			this.requestUpdate();
		}
	}
	isCapsNode(e) {
		return (e.type === "getcapabilities" || e.type === "capabilities") && !!e.url;
	}
	renderCapsLayers(e, t, n) {
		let r = this.capsCache.get(this.capsKey(e));
		if (!r || r.status === "loading") return o`<sl-tree-item disabled><sl-spinner style="font-size:0.85rem"></sl-spinner> Loading…</sl-tree-item>`;
		if (r.status === "error") return o`<sl-tree-item disabled style="color:var(--sl-color-danger-600)">⚠ ${r.error}</sl-tree-item>`;
		let i = this.getChildSelectionContext(e, t, n);
		return o`${r.children.map((e, t) => this.renderNode(e, i, `${n}.${t}`))}`;
	}
	renderNode(e, t, n = "0") {
		if ((e.type === "getcapabilities" || e.type === "capabilities") && e.url) {
			let r = this.capsKey(e), i = this.capsCache.get(r), a = this.getChildSelectionContext(e, t, n), s;
			return s = !i || i.status === "loading" ? o`<sl-tree-item disabled><sl-spinner style="font-size:0.85rem"></sl-spinner> Loading…</sl-tree-item>` : i.status === "error" ? o`<sl-tree-item disabled style="color:var(--sl-color-danger-600)">⚠ ${i.error}</sl-tree-item>` : o`${i.children.map((e, t) => this.renderNode(e, a, `${n}.${t}`))}`, o`
                <sl-tree-item ?expanded=${e.expanded} data-node-key=${n}
                    @sl-expand=${() => {
				this.fetchCapabilities(e);
			}}>
                    <span style="cursor:pointer">${e.label ?? e.url}</span>
                    ${s}
                </sl-tree-item>`;
		}
		if (e.separator) return o`
                <sl-tree-item class="separator-item" data-node-key=${n} tabindex="-1" aria-hidden="true">
                    <span class="tree-separator">${this.resolveNodeLabel(e)}</span>
                </sl-tree-item>`;
		let r = this.getChildSelectionContext(e, t, n);
		if (this.nodeByKey.set(n, e), e.children && e.children.length > 0) {
			let t = e.children.filter((e) => this.isCapsNode(e)), i = () => {
				for (let e of t) this.fetchCapabilities(e);
			};
			return e.expanded && t.length > 0 && queueMicrotask(i), o`
                <sl-tree-item ?expanded=${e.expanded} data-node-key=${n}
                    @sl-expand=${(e) => {
				e.target === e.currentTarget && i();
			}}>
                    <span @click=${(e) => {
				let t = e.currentTarget.closest("sl-tree-item");
				t && (t.expanded = !t.expanded);
			}} style="cursor:pointer">${this.resolveNodeLabel(e)}</span>
                    ${e.children.map((e, t) => this.isCapsNode(e) ? this.renderCapsLayers(e, r, `${n}.${t}`) : this.renderNode(e, r, `${n}.${t}`))}
                </sl-tree-item>
            `;
		} else {
			let t = r.selectionMode === "single", i = this.getExclusiveGroupKey(e, r), a = (e.layerSpec ? this.supportOfSpec(e.layerSpec) : this.getSupportStatus(e.layerId)) === "unsupported";
			return o`
                <sl-tree-item data-node-key=${n} @keydown=${(e) => {
				(e.key === " " || e.key === "Enter") && (e.preventDefault(), e.currentTarget.querySelector("sl-switch, input[type=\"radio\"]")?.click()), (e.key === "ArrowUp" || e.key === "ArrowDown" || e.key === "ArrowLeft" || e.key === "ArrowRight") && t && e.preventDefault();
			}}>
                    ${t ? o`
                        <label class="layer-radio">
                            <input
                                type="radio"
                                ?checked=${e.checked}
                                ?disabled=${a}
                                name=${i ?? r.exclusiveGroupKey ?? ""}
                                data-layer-id=${e.layerId ?? ""}
                                data-selection-group=${i ?? ""}
                                @keydown=${(e) => {
				(e.key === "ArrowUp" || e.key === "ArrowDown" || e.key === "ArrowLeft" || e.key === "ArrowRight") && e.preventDefault();
			}}
                                @change=${(t) => this.handleCheck(t, e, r)}
                            />
                            ${this.renderLayerLabel(e, a)}
                        </label>
                    ` : o`
                        <sl-switch
                            ?checked=${e.checked}
                            ?disabled=${a}
                            data-layer-id=${e.layerId ?? ""}
                            @sl-change=${(t) => this.handleCheck(t, e, r)}
                        >
                            ${this.renderLayerLabel(e, a)}
                        </sl-switch>
                    `}
                </sl-tree-item>
            `;
		}
	}
	handleCheck(e, t, n) {
		let r = e.target, i = r instanceof HTMLInputElement ? r.checked : r?.checked === !0;
		if (!t.layerId) return;
		if (this.setLayerCheckedState(t.layerId, i), t.layerSpec) {
			i ? this.dispatchEvent(new CustomEvent("webmapx-add-layer", {
				detail: t.layerSpec,
				bubbles: !0,
				composed: !0
			})) : this.dispatchEvent(new CustomEvent("webmapx-remove-layer", {
				detail: t.layerId,
				bubbles: !0,
				composed: !0
			}));
			return;
		}
		let a = this.getLayerInformationById(t.layerId);
		if (!a) return;
		let o = this.getExclusiveGroupKey(t, n);
		if (i && o && this.clearExclusiveSelection(this.effectiveTree, t.layerId, o).forEach((e) => {
			this.setLayerCheckedState(e, !1);
			let t = this.getLayerInformationById(e);
			t && this.dispatchLayerCheck({
				layerInformation: t,
				checked: !1,
				selectionGroup: o,
				selectionMode: "single",
				...n.stackOrder === void 0 ? {} : { stackOrder: n.stackOrder }
			});
		}), !i && o && !n.allowNone) {
			this.setLayerCheckedState(t.layerId, !0);
			return;
		}
		this.dispatchLayerCheck({
			layerInformation: a,
			checked: i,
			...o ? {
				selectionGroup: o,
				selectionMode: "single"
			} : {},
			...n.stackOrder === void 0 ? {} : { stackOrder: n.stackOrder }
		});
	}
	render() {
		this.nodeByKey.clear();
		let e = this.searchQuery.trim().toLowerCase(), t = e ? this.filterTree(this.effectiveTree, e) : this.effectiveTree;
		return o`
            ${this.showSearch ? o`
                <div class="search">
                    <!-- A filter above the list it filters: the magnifier and the
                         placeholder say what it does, so its label is for screen readers. -->
                    <sl-input
                        class="label-hidden"
                        size="small"
                        clearable
                        label="Search layers"
                        spellcheck="false"
                        autocomplete="off"
                        placeholder="Search layers..."
                        .value=${this.searchQuery}
                        @sl-input=${this.handleSearchInput}
                        @sl-clear=${this.handleSearchClear}
                    >
                        <sl-icon name="search" slot="prefix"></sl-icon>
                    </sl-input>
                </div>
            ` : o``}
            <sl-tree @sl-expand=${this.handleTreeExpand}>
                ${t.map((e, t) => this.renderNode(e, void 0, `${t}`))}
            </sl-tree>
        `;
	}
};
h([e({ type: Array })], L.prototype, "tree", void 0), h([e({
	type: String,
	attribute: "tool-id"
})], L.prototype, "toolId", void 0), h([r()], L.prototype, "configTree", void 0), h([r()], L.prototype, "searchQuery", void 0), h([r()], L.prototype, "capsCache", void 0), L = h([a("webmapx-layer-tree")], L);
//#endregion
//#region src/components/webmapx-layer-overview.ts
var R;
function qe(e) {
	let t = Infinity, n = Infinity, r = -Infinity, i = -Infinity, a = (e) => {
		if (typeof e[0] == "number") {
			let [a, o] = e;
			a < t && (t = a), a > r && (r = a), o < n && (n = o), o > i && (i = o);
		} else if (Array.isArray(e)) for (let t of e) a(t);
	};
	for (let t of e.features ?? []) {
		let e = t.geometry;
		e?.coordinates && a(e.coordinates);
	}
	return Number.isFinite(t) ? [
		Math.max(-180, t),
		Math.max(-85.05112878, n),
		Math.min(180, r),
		Math.min(85.05112878, i)
	] : null;
}
function Je(e, t) {
	return e ? t ? [
		Math.min(e[0], t[0]),
		Math.min(e[1], t[1]),
		Math.max(e[2], t[2]),
		Math.max(e[3], t[3])
	] : e : t;
}
function Ye(e) {
	if (!e) return 0;
	switch (e.type) {
		case "GeometryCollection": return e.geometries.reduce((e, t) => e + Ye(t), 0);
		case "Point": return 1;
		case "MultiPoint":
		case "LineString": return e.coordinates.length;
		case "MultiLineString":
		case "Polygon": return e.coordinates.reduce((e, t) => e + t.length, 0);
		case "MultiPolygon": return e.coordinates.reduce((e, t) => e + t.reduce((e, t) => e + t.length, 0), 0);
		default: return 0;
	}
}
function Xe(e) {
	let t = /* @__PURE__ */ new Map(), n = 0;
	for (let r of e.features ?? []) {
		let e = r.geometry?.type ?? "unknown";
		t.set(e, (t.get(e) ?? 0) + 1), n += Ye(r.geometry);
	}
	let r = e.features?.length ?? 0, i = [...t.entries()].map(([e, t]) => `${e}: ${t}`).join(", ");
	return `${i && t.size > 1 ? `${r} features (${i})` : `${r} feature${r === 1 ? "" : "s"}${i ? ` (${[...t.keys()][0]})` : ""}`}, ${n} ${n === 1 ? "vertex" : "vertices"}`;
}
function Ze(e, t) {
	if (Array.isArray(t?.sublayers) && t.sublayers.length > 0) {
		let n = /* @__PURE__ */ new Set();
		for (let e of t.sublayers) typeof e.source == "string" && n.add(e.source);
		return [...n].map((t) => [`${e}:${t}`, t]);
	}
	return typeof t?.sourceId == "string" ? [[t.sourceId]] : [];
}
var Qe = new Set([
	"circle",
	"symbol",
	"label",
	"line",
	"fill",
	"fill-extrusion"
]), z = class extends g {
	static {
		R = this;
	}
	constructor(...e) {
		super(...e), this.backgroundGroupLabel = "Base Maps", this.backgroundTitle = "Base map", this.overviewTitle = "Active layers", this.backgroundLayers = [], this.overviewLayers = [], this.layerTransparency = /* @__PURE__ */ new Map(), this.editingTransparencyLayerId = null, this.hoveredTransparencySliderLayerId = null, this.dropTargetLayerId = null, this.dropTargetPosition = null, this.sourceExtentCache = /* @__PURE__ */ new Map(), this.layerExtentCache = /* @__PURE__ */ new Map(), this.unsubscribeLayerAdd = null, this.unsubscribeLayerRemove = null, this.dragState = null, this.autoScrollState = null, this._lastMapLayers = void 0;
	}
	static {
		this.AUTO_SCROLL_EDGE_PX = 32;
	}
	static {
		this.AUTO_SCROLL_STEP_PX = 8;
	}
	static {
		this.AUTO_SCROLL_INTERVAL_MS = 20;
	}
	static {
		this.styles = n`
    :host {
      display: block;
      box-sizing: border-box;
      background: var(--webmapx-legend-bg, var(--color-background, #fff));
      color: var(--webmapx-legend-color, var(--color-text-primary, #16202a));
    }

    /* Shoelace's own tooltip body is pointer-events: none, but its arrow
       and the popup's own outer wrapper aren't — confirmed either one can
       sit directly over a neighboring icon (e.g. the eye icon right next
       to the drag-handle) and silently eat a click meant for that icon
       while the tooltip is still open. */
    sl-tooltip::part(base__arrow),
    sl-tooltip::part(base__popup) {
      pointer-events: none;
    }

    /* No overflow/max-height here: the real scrollport is the ancestor
       reached through slot assignment (webmapx-tool-panel's
       .panel-content) — see findScrollableAncestor below. Making this
       element its own scroll container too would give sticky headers and
       drag auto-scroll the wrong ancestor to stick/scroll against. */
    .panel {
      display: flex;
      flex-direction: column;
      gap: var(--webmapx-space-lg, 1rem);
      padding: var(--webmapx-space-sm, 0.5rem);
      box-sizing: border-box;
    }

    .section {
      display: flex;
      flex-direction: column;
      gap: var(--webmapx-space-sm, 0.5rem);
    }

    /* A section heading is structure, not an action. It used to be bold and
       accent-coloured, which put it in the same visual class as selected
       layers and active buttons; a muted micro-label keeps the accent
       meaning "interactive" and nothing else. */
    .section-title {
      margin: 0;
      font-size: var(--webmapx-label-size, var(--webmapx-font-size-sm, 0.75rem));
      font-weight: 600;
      letter-spacing: var(--webmapx-label-spacing, 0.06em);
      text-transform: var(--webmapx-label-transform, uppercase);
      color: var(--webmapx-legend-title-color, var(--color-text-muted, #6b7681));
      /* Truncates instead of wrapping/pushing the action buttons off when a
         section has both a title and buttons (Active layers) and the two
         don't both fit — the buttons must never shrink or lose their click
         target. Equally harmless when a section's row has no buttons to
         protect (Base map): with only one flex child, there's nothing for
         truncation to make room for. */
      flex: 1 1 auto;
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .layer-list {
      display: flex;
      flex-direction: column;
      gap: var(--webmapx-space-sm, 0.5rem);
    }

    .drop-indicator {
      height: 2px;
      margin: -1px 0;
      background: var(--color-text-primary, #16202a);
      border-radius: 1px;
      pointer-events: none;
    }

    .layer-card.dragging {
      position: relative;
      z-index: 2;
      opacity: 0.75;
      box-shadow: var(--webmapx-shadow-lg, 0 6px 16px rgba(15, 23, 42, 0.2));
      cursor: grabbing;
    }

    .layer-card {
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: var(--webmapx-space-xs, 0.35rem);
      padding: var(--webmapx-space-xs, 0.35rem) var(--webmapx-space-sm, 0.625rem);
      border: 1px solid var(--color-border, #d5dce3);
      border-radius: var(--webmapx-radius-lg, 0.75rem);
      background: var(--color-background, #fff);
      box-shadow: var(--webmapx-shadow-sm, 0 1px 3px rgba(15, 23, 42, 0.08));
      box-sizing: border-box;
      /* drag-handle width (1em, i.e. its own font-size) plus the .layer-row
         gap that sits between it and the eye icon — the indent everything
         in .layer-details lines up with, except .layer-details-actions,
         which breaks back out of it (see below). */
      --details-indent: calc(var(--webmapx-font-size-md, 0.95rem) + var(--webmapx-space-xs, 0.25rem));
    }

    .layer-row {
      display: flex;
      /* flex-start (not center): a long title wraps to several lines, and
         centering against the whole wrapped block drifted the drag/eye/delete
         icons down to the label's vertical middle instead of its first line.
         flex-start alone sits the icons flush with the row's top edge, above
         where the label's own line-height leading starts its first line of
         glyphs — .row-icon below nudges them down to match that. */
      align-items: flex-start;
      gap: var(--webmapx-space-xs, 0.25rem);
      width: 100%;
      touch-action: none;
    }

    /* Half the label's line-height leading, minus half the icon's own
       height — centers each icon on the label's first line instead of on
       the row's top edge. Both icons and the label read
       --webmapx-font-size-md, so this stays correct if that token changes. */
    .row-icon {
      margin-top: calc((var(--webmapx-font-size-md, 0.95rem) * 1.3 - var(--webmapx-font-size-md, 0.95rem)) / 2);
    }

    /* Reordering must stay within .layer-list, vertical-only (matches EduGIS):
       implement via pointer-based drag that translateY's the row, clamped to
       the list's bounding box and ignoring horizontal pointer movement —
       not native HTML5 DnD, whose drag image floats freely with the cursor. */
    /* Hidden until the card is hovered — mirrors legend3D's drag-handle, which
       stays visible mid-drag even if the pointer drifts off the card. */
    .drag-handle {
      flex: 0 0 auto;
      font-size: var(--webmapx-font-size-md, 0.95rem);
      color: var(--color-text-muted, #6b7681);
      cursor: grab;
      touch-action: none;
      opacity: 0;
      transition: opacity var(--webmapx-motion-fast, 120ms) ease, color var(--webmapx-motion-fast, 120ms) ease;
    }

    /* Hidden the same way as .drag-handle — visible only on card hover, and
       disappears on mouse-out even if the button still holds focus from a
       click, matching the drag icon's hover-only behavior exactly. */
    .delete-layer,
    .layer-details-actions {
      opacity: 0;
      transition: opacity var(--webmapx-motion-fast, 120ms) ease;
    }

    .layer-card:hover .drag-handle,
    .layer-card.dragging .drag-handle,
    .layer-card:hover .delete-layer,
    .layer-card:hover .layer-details-actions {
      opacity: 1;
    }

    /* Single-layer lists render the same icon (never draggable, so no
       pointer handlers are attached — see the template) purely to reserve
       its layout width, so .layer-details' padding-left still lines up with
       the eye icon below it. Higher specificity than the hover-reveal rule
       above, so it always wins regardless of source order. */
    .layer-card:hover .drag-handle.drag-handle-disabled,
    .layer-card.dragging .drag-handle.drag-handle-disabled {
      opacity: 0;
    }

    .drag-handle-disabled {
      cursor: default;
      pointer-events: none;
    }

    /* Matches sl-icon-button's own hover/active colors (--sl-color-primary-600/700)
       so a plain sl-icon reads consistently with the real icon-buttons around it. */
    .drag-handle:hover {
      color: var(--sl-color-primary-600, var(--color-primary, #2b6c8f));
    }

    .drag-handle:active {
      cursor: grabbing;
      color: var(--sl-color-primary-700, var(--color-primary, #2b6c8f));
    }

    .visibility-toggle::part(base),
    .delete-layer::part(base),
    .layer-details-actions sl-icon-button::part(base) {
      font-size: var(--webmapx-font-size-md, 0.95rem);
      padding: 0;
    }

    .layer-legend-wrap {
      width: 100%;
      padding-left: var(--details-indent);
      box-sizing: border-box;
    }

    .layer-label {
      flex: 1 1 auto;
      min-width: 0;
      cursor: pointer;
      font-size: var(--webmapx-font-size-md, 0.95rem);
      line-height: 1.3;
      white-space: normal;
      word-break: break-word;
      transition: color var(--webmapx-motion-fast, 120ms) ease;
    }

    .layer-label:focus-visible {
      outline: var(--webmapx-focus-ring, 2px solid var(--color-primary, #2b6c8f));
      outline-offset: var(--webmapx-focus-offset, 2px);
    }

    .layer-label.out-of-zoom {
      color: var(--color-text-muted, #6b7681);
      opacity: 0.6;
    }

    /* After .out-of-zoom so hover/focus feedback wins even on a dimmed label
       (equal specificity to .layer-label.out-of-zoom — source order decides). */
    /* Our own hover token, not Shoelace's primary-600: that one is a sky blue
       (#0284c7) at 4.09:1 on white, below the 4.5:1 AA needs for text. */
    .layer-label:hover,
    .layer-label:focus-visible {
      color: var(--color-primary-hover, #21566f);
    }

    /* No padding here (unlike before): .layer-details-inner below has
       overflow:hidden for the collapse animation, so a parent-level indent
       that .layer-details-actions then tried to break back out of via a
       negative margin got clipped by that overflow — the info icon (the
       piece pushed furthest left) disappeared entirely. Each row that needs
       the eye-aligned indent (.layer-legend-wrap, .opacity-row, .layer-meta)
       applies --details-indent itself instead; .layer-details-actions is
       simply never indented, so it uses the full width with no clipping. */
    .layer-details {
      display: grid;
      grid-template-rows: 1fr;
      width: 100%;
      box-sizing: border-box;
      transition: grid-template-rows var(--webmapx-motion-fast, 120ms) ease-in-out;
    }

    .layer-details.collapsed {
      grid-template-rows: 0fr;
    }

    .layer-details-inner {
      display: flex;
      flex-direction: column;
      gap: var(--webmapx-space-xs, 0.35rem);
      overflow: hidden;
      min-height: 0;
    }

    .layer-details-actions {
      display: flex;
      align-items: center;
      justify-content: space-between;
      width: 100%;
    }

    .opacity-row {
      display: flex;
      align-items: center;
      gap: 0.2rem;
      font-size: var(--webmapx-font-size-sm, 0.8rem);
      color: var(--color-text-secondary, #5a6773);
      padding-left: var(--details-indent);
      padding-right: 2.5rem;
      box-sizing: border-box;
    }

    /* --slider-pct (set inline per-row from the current transparency value)
       splits the track at the thumb: lower values (left, already "used") in
       the lighter tone, higher values (right, remaining) in the darker
       tone — so the whole line reads dark at 0% and light at 100%. Resting
       state uses greys; hovering or dragging swaps in the blue pair. */
    .opacity-row input[type="range"] {
      --slider-track-grey: linear-gradient(to right,
        var(--color-border, #d5dce3) 0%,
        var(--color-border, #d5dce3) var(--slider-pct, 0%),
        var(--color-text-muted, #6b7681) var(--slider-pct, 0%),
        var(--color-text-muted, #6b7681) 100%
      );
      --slider-track-blue: linear-gradient(to right,
        var(--sl-color-primary-200, #bcdcf5) 0%,
        var(--sl-color-primary-200, #bcdcf5) var(--slider-pct, 0%),
        var(--sl-color-primary-600, var(--color-primary, #2b6c8f)) var(--slider-pct, 0%),
        var(--sl-color-primary-600, var(--color-primary, #2b6c8f)) 100%
      );
      flex: 1 1 auto;
      -webkit-appearance: none;
      appearance: none;
      height: 2px;
      background: var(--slider-track-grey);
      border-radius: var(--webmapx-radius-xs, 2px);
      outline: none;
      transition: background var(--webmapx-motion-fast, 120ms) ease;
    }

    .opacity-row input[type="range"]:hover,
    .opacity-row input[type="range"]:active {
      background: var(--slider-track-blue);
    }

    /* The rule above removes the UA focus ring from a keyboard-operable
       control (arrow keys change the value), so put an equivalent back. */
    .opacity-row input[type="range"]:focus-visible {
      outline: var(--webmapx-focus-ring, 2px solid var(--color-primary, #2b6c8f));
      outline-offset: var(--webmapx-focus-offset, 2px);
    }

    /* The thumb doubles as the "drag to change transparency" affordance, so
       it always shows the same circle-half glyph, in white — sized close to
       the thumb's own diameter so the grey fill reads as a thin ring around
       the glyph rather than a separate dot behind it. Default diameter
       matches the info-layer button's icon (~0.95rem). Hover/grab tint it
       blue like every other control here; grabbing additionally enlarges.
       --thumb-fill (rather than a :hover selector on the pseudo-element) is
       set from the input's own style attribute, driven by
       hoveredTransparencySliderLayerId: Chromium/Firefox have a long-standing
       bug where a :hover selector match on ::-webkit-slider-thumb/
       ::-moz-range-thumb doesn't reliably repaint the thumb (:active works
       only because dragging already forces continuous repaints as the thumb
       moves). Changing a custom property's resolved value doesn't have that
       problem — it's the same invalidation path --slider-pct already relies
       on for the track gradient above. This has to be reactive state rather
       than an imperative style.setProperty() on mouseenter/mouseleave too:
       clicking the track to jump the value re-renders the whole style
       string from the template on every input event, which would otherwise
       silently wipe out a property set outside that render. */
    .opacity-row input[type="range"]::-webkit-slider-thumb {
      -webkit-appearance: none;
      appearance: none;
      width: 16px;
      height: 16px;
      border-radius: 50%;
      background-color: var(--thumb-fill, var(--color-text-muted, #6b7681));
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='white' viewBox='0 0 16 16'%3E%3Cpath d='M8 15A7 7 0 1 0 8 1zm0 1A8 8 0 1 1 8 0a8 8 0 0 1 0 16'/%3E%3C/svg%3E");
      background-repeat: no-repeat;
      background-position: center;
      background-size: 80%;
      cursor: pointer;
      transition: width var(--webmapx-motion-fast, 120ms) ease,
                  height var(--webmapx-motion-fast, 120ms) ease,
                  background-color var(--webmapx-motion-fast, 120ms) ease;
    }

    .opacity-row input[type="range"]::-moz-range-thumb {
      width: 16px;
      height: 16px;
      border-radius: 50%;
      border: none;
      background-color: var(--thumb-fill, var(--color-text-muted, #6b7681));
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='white' viewBox='0 0 16 16'%3E%3Cpath d='M8 15A7 7 0 1 0 8 1zm0 1A8 8 0 1 1 8 0a8 8 0 0 1 0 16'/%3E%3C/svg%3E");
      background-repeat: no-repeat;
      background-position: center;
      background-size: 80%;
      cursor: pointer;
      transition: width var(--webmapx-motion-fast, 120ms) ease,
                  height var(--webmapx-motion-fast, 120ms) ease,
                  background-color var(--webmapx-motion-fast, 120ms) ease;
    }

    /* Grabbed: enlarge, and switch to the active shade (matches .drag-handle:active elsewhere). */
    .opacity-row input[type="range"]:active::-webkit-slider-thumb {
      width: 24px;
      height: 24px;
      background-color: var(--sl-color-primary-700, var(--color-primary, #2b6c8f));
    }

    .opacity-row input[type="range"]:active::-moz-range-thumb {
      width: 24px;
      height: 24px;
      background-color: var(--sl-color-primary-700, var(--color-primary, #2b6c8f));
    }

    .opacity-row input[type="range"]::-moz-range-track {
      height: 2px;
      background: var(--slider-track-grey);
      border-radius: var(--webmapx-radius-xs, 2px);
      transition: background var(--webmapx-motion-fast, 120ms) ease;
    }

    .opacity-row input[type="range"]:hover::-moz-range-track,
    .opacity-row input[type="range"]:active::-moz-range-track {
      background: var(--slider-track-blue);
    }

    .opacity-value {
      flex: 0 0 auto;
      min-width: 1.5em;
      text-align: left;
      font-variant-numeric: tabular-nums;
      cursor: pointer;
      border-radius: var(--webmapx-radius-xs, 2px);
      /* Dotted underline (not solid) is the recognized "click to edit"
         convention (spreadsheets, Notion-style inline properties) — it
         reads as a hint, not a hyperlink. No explicit text-decoration-color:
         it defaults to currentColor, so the underline automatically follows
         the same hover/focus color change as the text itself, below. */
      text-decoration: underline dotted;
      text-underline-offset: 2px;
      transition: color var(--webmapx-motion-fast, 120ms) ease;
    }

    .opacity-value:hover,
    .opacity-value:focus-visible {
      color: var(--sl-color-primary-600, var(--color-primary, #2b6c8f));
    }

    .opacity-value:focus-visible {
      outline: var(--webmapx-focus-ring, 2px solid var(--color-primary, #2b6c8f));
      outline-offset: var(--webmapx-focus-offset, 2px);
    }

    .opacity-value-input {
      flex: 0 0 auto;
      width: 2.6em;
      text-align: right;
      font: inherit;
      font-variant-numeric: tabular-nums;
      color: inherit;
      background: var(--color-background, #fff);
      /* Neutral border matching every other plain input in the project
         (e.g. webmapx-isochrone-tool.ts, webmapx-config-edit-tool.ts). This
         input is only ever on screen while actively focused (it appears
         already-focused the instant you click the percentage), so a
         separate offset outline on top of the border read as two nested
         boxes — recolor the same single border on focus instead of adding
         a second box. */
      border: 1px solid var(--color-border, #d5dce3);
      border-radius: var(--webmapx-radius-xs, 2px);
      padding: 0 2px;
      outline: none;
      -moz-appearance: textfield;
      appearance: textfield;
      transition: border-color var(--webmapx-motion-fast, 120ms) ease;
    }

    .opacity-value-input:focus-visible {
      border-color: var(--sl-color-primary-600, var(--color-primary, #2b6c8f));
    }

    .opacity-value-input::-webkit-outer-spin-button,
    .opacity-value-input::-webkit-inner-spin-button {
      -webkit-appearance: none;
      margin: 0;
    }

    .section-header-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--webmapx-space-sm, 0.5rem);
      background: var(--webmapx-legend-bg, var(--color-background, #fff));
      padding-bottom: var(--webmapx-space-xs, 0.25rem);
    }

    /* Only the Active layers header carries buttons worth keeping visible
       while its layer list scrolls underneath — Base map's header was never
       sticky before this merge and still isn't. */
    .section-header-row.sticky {
      position: sticky;
      top: 0;
      z-index: 1;
    }

    /* Its own flex group (rather than letting the buttons sit as direct
       flex children of .section-header-row) so justify-content: space-between
       above pushes the title and the whole button cluster to opposite
       ends, instead of spacing every item apart individually. Never
       shrinks — see .section-title. */
    .section-actions {
      display: flex;
      align-items: center;
      flex: 0 0 auto;
      gap: var(--webmapx-space-xs, 0.4rem);
    }

    .layer-meta {
      font-size: var(--webmapx-font-size-sm, 0.75rem);
      color: var(--color-text-secondary, #5a6773);
      white-space: nowrap;
      /* --details-indent (eye-alignment) plus its own original extra
         sub-indent, unchanged from before .layer-details stopped providing
         the base indent itself. */
      margin-left: calc(var(--details-indent) + 0.75rem);
    }

    .layer-editing-notice {
      font-size: var(--webmapx-font-size-sm, 0.75rem);
      color: var(--color-text-secondary, #5a6773);
      font-style: italic;
      padding: var(--webmapx-space-xs, 0.25rem) var(--webmapx-space-md, 0.75rem) var(--webmapx-space-sm, 0.5rem);
    }

    .empty {
      padding: 0.875rem;
      border: 1px dashed var(--color-border, #d5dce3);
      border-radius: var(--webmapx-radius-lg, 0.75rem);
      color: var(--color-text-secondary, #5a6773);
      font-size: var(--webmapx-font-size-md, 0.875rem);
      background: var(--color-background-secondary, #f4f6f8);
    }
  `;
	}
	onStateChanged(e) {
		e.mapLayers !== this._lastMapLayers && (this._lastMapLayers = e.mapLayers, this.applyVisibleLayers(e));
	}
	onMapAttached(e) {
		this.unsubscribeLayerAdd = e.events.on("layer-add", (t) => {
			this.applyVisibleLayers(e.store.getState());
		}), this.unsubscribeLayerRemove = e.events.on("layer-remove", (t) => {
			this.applyVisibleLayers(e.store.getState());
		}), this.applyVisibleLayers(e.store.getState());
	}
	onMapDetached() {
		this.unsubscribeLayerAdd?.(), this.unsubscribeLayerRemove?.(), this.unsubscribeLayerAdd = null, this.unsubscribeLayerRemove = null;
	}
	updated(e) {
		super.updated(e), this.disableTooltipHoverBridges();
	}
	disableTooltipHoverBridges() {
		this.shadowRoot?.querySelectorAll("sl-tooltip").forEach((e) => {
			e.updateComplete.then(() => {
				let t = e.shadowRoot?.querySelector("sl-popup");
				t && (t.hoverBridge = !1);
			});
		});
	}
	render() {
		return o`
      <div class="panel">
        ${this.renderSection(this.overviewTitle, this.overviewLayers, "No layers on the map yet. Add one from the Catalog.", !0)}
        ${this.renderSection(this.backgroundTitle, this.backgroundLayers, "No base map selected.")}
      </div>
      <webmapx-layer-info-dialog></webmapx-layer-info-dialog>
      <webmapx-layer-styler></webmapx-layer-styler>
      <webmapx-save-layers-dialog></webmapx-save-layers-dialog>
      <webmapx-permalink-dialog></webmapx-permalink-dialog>
      <webmapx-clear-layers-dialog @webmapx-clear-layers-confirm=${() => this.handleConfirmClearAllLayers()}></webmapx-clear-layers-dialog>
    `;
	}
	renderSection(e, t, n, r = !1) {
		return o`
      <section class="section">
        <div class="section-header-row ${r ? "sticky" : ""}">
          <h3 class="section-title" title=${e}>${e}</h3>
          ${r ? o`
                <div class="section-actions">
                  ${t.length > 0 ? o`
                    <sl-tooltip content="Show all layers">
                      <sl-icon-button
                        name="eye"
                        label="Show all layers"
                        @click=${() => this.handleShowAllLayers()}
                      ></sl-icon-button>
                    </sl-tooltip>
                    <sl-tooltip content="Hide all layers">
                      <sl-icon-button
                        name="eye-slash"
                        label="Hide all layers"
                        @click=${() => this.handleHideAllLayers()}
                      ></sl-icon-button>
                    </sl-tooltip>
                    <sl-tooltip content="Clear all layers">
                      <sl-icon-button
                        name="trash"
                        label="Clear all layers"
                        @click=${() => this.handleClearAllLayers()}
                      ></sl-icon-button>
                    </sl-tooltip>
                  ` : null}
                  <sl-tooltip content="Permalink">
                    <sl-icon-button
                      name="link-45deg"
                      label="Permalink"
                      @click=${() => this.handlePermalink()}
                    ></sl-icon-button>
                  </sl-tooltip>
                  ${t.length > 0 ? o`
                    <sl-tooltip content="Save layer(s)…">
                      <sl-icon-button
                        name="download"
                        label="Save layer(s)…"
                        @click=${() => this.handleSaveLayers()}
                      ></sl-icon-button>
                    </sl-tooltip>
                  ` : null}
                </div>
              ` : null}
        </div>
        ${t.length > 0 ? o`
              <div class="layer-list">
                ${t.map((e, n) => o`
                  ${this.dropTargetLayerId === e.layerId && this.dropTargetPosition === "above" ? o`<div class="drop-indicator"></div>` : null}
                  <div class="layer-card" data-layer-id=${e.layerId}>
                    <div class="layer-row">
                      <sl-tooltip content="Drag to change layer order" ?disabled=${t.length <= 1}>
                        <sl-icon
                          class="drag-handle row-icon${t.length <= 1 ? " drag-handle-disabled" : ""}"
                          name=${n === 0 ? "arrow-down" : n === t.length - 1 ? "arrow-up" : "arrow-down-up"}
                          @pointerdown=${t.length > 1 ? (e) => this.onDragHandlePointerDown(e) : void 0}
                          @pointermove=${t.length > 1 ? (e) => this.onDragHandlePointerMove(e) : void 0}
                          @pointerup=${t.length > 1 ? (e) => this.onDragHandlePointerUp(e) : void 0}
                          @pointercancel=${t.length > 1 ? (e) => this.onDragHandlePointerUp(e) : void 0}
                        ></sl-icon>
                      </sl-tooltip>
                      <sl-tooltip content=${e.visible ? "Hide layer" : "Show layer"}>
                        <sl-icon-button
                          class="visibility-toggle row-icon"
                          name=${e.visible ? "eye" : "eye-slash"}
                          label=${e.visible ? "Hide layer" : "Show layer"}
                          @click=${() => this.handleVisibilityToggle(e.layerId)}
                        ></sl-icon-button>
                      </sl-tooltip>
                      <span
                        class="layer-label ${e.outOfZoom ? "out-of-zoom" : ""}"
                        role="button"
                        tabindex="0"
                        aria-expanded=${this.isLegendCollapsed(e.layerId) ? "false" : "true"}
                        @click=${() => this.handleCollapseToggle(e.layerId)}
                        @keydown=${(t) => {
			t.key !== "Enter" && t.key !== " " || (t.preventDefault(), this.handleCollapseToggle(e.layerId));
		}}
                      >${Ke(e.label).name}${e.beingEdited ? o`&nbsp;<sl-icon name="pencil" title="Layer is currently being edited"></sl-icon>` : null}</span>
                      ${r ? o`
                        <sl-tooltip content="Remove layer">
                          <sl-icon-button
                            class="delete-layer row-icon"
                            name="x-circle"
                            label="Remove layer"
                            @click=${() => this.handleDeleteLayer(e.layerId)}
                          ></sl-icon-button>
                        </sl-tooltip>
                      ` : null}
                    </div>
                    <div class="layer-details ${this.isLegendCollapsed(e.layerId) ? "collapsed" : ""}">
                      <div class="layer-details-inner">
                        ${e.beingEdited ? o`<div class="layer-editing-notice">editing</div>` : o`
                            ${e.visible ? o`
                                  <div class="layer-legend-wrap" style=${e.layerType === "hillshade" ? "" : `opacity: ${(100 - (this.layerTransparency.get(e.layerId) ?? 0)) / 100}`}>
                                    <webmapx-layer-legend layer-id=${e.layerId}></webmapx-layer-legend>
                                  </div>
                                  <div class="opacity-row">
                                    <sl-tooltip content="Transparency">
                                      <input
                                        type="range"
                                        aria-label=${`Transparency of ${e.label}`}
                                        min="0"
                                        max="100"
                                        style="--slider-pct: ${this.layerTransparency.get(e.layerId) ?? 0}%${this.hoveredTransparencySliderLayerId === e.layerId ? "; --thumb-fill: var(--sl-color-primary-600, var(--color-primary, #2b6c8f))" : ""}"
                                        .value=${String(this.layerTransparency.get(e.layerId) ?? 0)}
                                        @input=${(t) => this.handleTransparencyChange(e.layerId, t)}
                                        @mouseenter=${() => {
			this.hoveredTransparencySliderLayerId = e.layerId;
		}}
                                        @mouseleave=${() => {
			this.hoveredTransparencySliderLayerId = null;
		}}
                                        @pointerdown=${(e) => e.currentTarget.closest("sl-tooltip")?.hide()}
                                        @focus=${(e) => e.currentTarget.closest("sl-tooltip")?.hide()}
                                      />
                                    </sl-tooltip>
                                    ${this.editingTransparencyLayerId === e.layerId ? o`<input
                                          class="opacity-value-input"
                                          type="number"
                                          min="0"
                                          max="100"
                                          inputmode="numeric"
                                          aria-label=${`Transparency of ${e.label}, percent`}
                                          .value=${String(this.layerTransparency.get(e.layerId) ?? 0)}
                                          @blur=${(t) => this.commitTransparencyInput(e.layerId, t)}
                                          @keydown=${(e) => this.handleTransparencyInputKeydown(e)}
                                        />` : o`<sl-tooltip content="Fill in">
                                          <span
                                            class="opacity-value"
                                            role="button"
                                            tabindex="0"
                                            @click=${() => this.beginEditTransparency(e.layerId)}
                                            @keydown=${(t) => {
			t.key !== "Enter" && t.key !== " " || (t.preventDefault(), this.beginEditTransparency(e.layerId));
		}}
                                          >${this.layerTransparency.get(e.layerId) ?? 0}%</span>
                                        </sl-tooltip>`}
                                  </div>
                                ` : null}
                            ${e.topLevelGroup ? o`<div class="layer-meta">${e.topLevelGroup}</div>` : null}
                            <!-- sl-icon-button's label attribute is the accessible name only
                                 (it renders as aria-label, never title), so each action
                                 needs an explicit sl-tooltip to be readable on hover —
                                 same pattern as the section actions above. sl-tooltip is
                                 display:contents, so the flex row is unaffected. -->
                            <div class="layer-details-actions">
                              <sl-tooltip content="About this layer">
                                <sl-icon-button
                                  name="info-circle"
                                  label="About this layer"
                                  @click=${() => this.handleShowLayerInfo(e.layerId, e.label)}
                                ></sl-icon-button>
                              </sl-tooltip>
                              ${e.hasStyleDialog ? o`<sl-tooltip content="Layer style">
                                    <sl-icon-button
                                      name="palette"
                                      label="Layer style"
                                      @click=${() => this.handleShowLayerStyle(e.layerId, e.label)}
                                    ></sl-icon-button>
                                  </sl-tooltip>` : null}
                              ${e.hasExtent ? o`<sl-tooltip content="Zoom to layer">
                                    <sl-icon-button
                                      name="arrows-fullscreen"
                                      label="Zoom to layer"
                                      @click=${() => this.handleZoomToLayer(e.layerId)}
                                    ></sl-icon-button>
                                  </sl-tooltip>` : null}
                            </div>
                          `}
                      </div>
                    </div>
                  </div>
                  ${this.dropTargetLayerId === e.layerId && this.dropTargetPosition === "below" ? o`<div class="drop-indicator"></div>` : null}
                `)}
              </div>
            ` : o`<div class="empty">${n}</div>`}
      </section>
    `;
	}
	onDragHandlePointerDown(e) {
		let t = e.currentTarget, n = t.closest(".layer-card"), r = t.closest(".layer-list");
		if (!n || !r) return;
		e.preventDefault(), t.setPointerCapture(e.pointerId), t.closest("sl-tooltip")?.hide();
		let i = n.getBoundingClientRect(), a = r.getBoundingClientRect(), o = this.findScrollableAncestor(e), s = n.dataset.layerId ?? "", c = Array.from(r.querySelectorAll(".layer-card")).filter((e) => e !== n).map((e) => {
			let t = e.getBoundingClientRect();
			return {
				layerId: e.dataset.layerId ?? "",
				top: t.top,
				bottom: t.bottom
			};
		});
		this.dragState = {
			card: n,
			layerId: s,
			startClientY: e.clientY,
			minTranslate: a.top - i.top,
			maxTranslate: a.bottom - i.bottom,
			scroller: o,
			startScrollTop: o?.scrollTop ?? 0,
			cardTop: i.top,
			cardBottom: i.bottom,
			siblings: c
		}, n.classList.add("dragging");
	}
	findScrollableAncestor(e) {
		for (let t of e.composedPath()) {
			if (!(t instanceof HTMLElement)) continue;
			let e = getComputedStyle(t);
			if (/(auto|scroll)/.test(e.overflowY) && t.scrollHeight > t.clientHeight) return t;
		}
		return null;
	}
	onDragHandlePointerMove(e) {
		if (!this.dragState) return;
		let { card: t, startClientY: n, minTranslate: r, maxTranslate: i, scroller: a, startScrollTop: o } = this.dragState, s = (a?.scrollTop ?? o) - o, c = e.clientY - n + s, l = Math.min(i, Math.max(r, c));
		t.style.transform = `translateY(${l}px)`, this.updateAutoScroll(e.clientY, a), this.updateDropTarget(l);
	}
	updateDropTarget(e) {
		if (!this.dragState) return;
		let { cardTop: t, cardBottom: n, siblings: r } = this.dragState, i = null;
		if (e < 0) {
			let n = t + e;
			for (let e of r) if (n < e.bottom) {
				i = {
					layerId: e.layerId,
					position: "above"
				};
				break;
			}
		} else if (e > 0) {
			let t = n + e;
			for (let e of r) t > e.top && (i = {
				layerId: e.layerId,
				position: "below"
			});
		}
		this.dropTargetLayerId = i?.layerId ?? null, this.dropTargetPosition = i?.position ?? null;
	}
	commitDrop(e) {
		let t = this.dropTargetLayerId, n = this.dropTargetPosition;
		if (!this.adapter || !t || !n || t === e) return;
		let r = Object.keys(this.adapter.store.getState().mapLayers ?? {}), i = r.indexOf(t);
		if (i === -1) return;
		let a = n === "below" ? t : r[i + 1] ?? null;
		a !== e && this.adapter.moveLayer(e, a);
	}
	onDragHandlePointerUp(e) {
		if (!this.dragState) return;
		let t = e.currentTarget;
		t.hasPointerCapture?.(e.pointerId) && t.releasePointerCapture(e.pointerId);
		let { card: n, layerId: r } = this.dragState;
		n.style.transform = "", n.classList.remove("dragging"), this.commitDrop(r), this.dragState = null, this.dropTargetLayerId = null, this.dropTargetPosition = null, this.stopAutoScroll();
		let i = document.elementFromPoint(e.clientX, e.clientY)?.closest(".layer-card")?.querySelector(".drag-handle");
		i && (i.classList.add("suppress-hover"), document.addEventListener("pointermove", () => {
			i.classList.remove("suppress-hover");
		}, { once: !0 }));
	}
	updateAutoScroll(e, t) {
		if (!t) return;
		let n = t.getBoundingClientRect(), r = R.AUTO_SCROLL_EDGE_PX, i = null;
		if (e < n.top + r ? i = "up" : e > n.bottom - r && (i = "down"), !i) {
			this.stopAutoScroll();
			return;
		}
		this.autoScrollState?.direction === i && this.autoScrollState.panel === t || (this.stopAutoScroll(), this.autoScrollState = {
			panel: t,
			direction: i,
			timer: 0
		}, this.runAutoScrollStep());
	}
	runAutoScrollStep() {
		let e = this.autoScrollState;
		if (!e) return;
		let { panel: t, direction: n } = e, r = t.scrollTop <= 0, i = t.scrollTop >= t.scrollHeight - t.clientHeight;
		if (n === "up" && r || n === "down" && i) {
			this.stopAutoScroll();
			return;
		}
		t.scrollTop += n === "up" ? -R.AUTO_SCROLL_STEP_PX : R.AUTO_SCROLL_STEP_PX, e.timer = window.setTimeout(() => this.runAutoScrollStep(), R.AUTO_SCROLL_INTERVAL_MS);
	}
	stopAutoScroll() {
		this.autoScrollState &&= (window.clearTimeout(this.autoScrollState.timer), null);
	}
	handlePermalink() {
		if (!this.adapter) return;
		let e = Ee(this.adapter), t = this.closest("webmapx-map") ?? this.adapter, n = m(t), r = f(n), i = n === 0 ? Te(t) : null, a = i ? Ee(i.adapter) : null, o = i && a ? {
			split: i.split,
			state: d(a)
		} : null, s = u(n, e.layerIds, e.hiddenLayerIds, e.viewport, e.transparencyOverrides, e.projection, r, e.terrainEnabled, e.time, o, e.tools), c = [...new Set([...e.dynamicLayerIds, ...a?.dynamicLayerIds ?? []])];
		this.permalinkDialog?.open(s, !!r, c);
	}
	handleSaveLayers() {
		if (!this.adapter) return;
		let e = this.adapter.store.getState().mapLayers ?? {}, t = this.overviewLayers.map((t) => {
			let n = e[t.layerId];
			return {
				layerId: t.layerId,
				label: t.label,
				sourceId: typeof n?.sourceId == "string" ? n.sourceId : void 0,
				layerType: typeof n?.layerType == "string" ? n.layerType : void 0,
				paint: n?.paint && typeof n.paint == "object" ? n.paint : void 0,
				sublayers: Array.isArray(n?.sublayers) ? n.sublayers : void 0,
				sourceData: n?.sourceData && typeof n.sourceData == "object" ? n.sourceData : void 0,
				sourceConfig: typeof n?.sourceId == "string" ? this.adapter?.getSourceConfig(n.sourceId) ?? void 0 : void 0
			};
		});
		this.saveLayersDialog?.open(t, this.adapter);
	}
	applyVisibleLayers(e) {
		let t = e.mapLayers ?? {}, n = [...Object.keys(t)].reverse(), r = [], i = [], a = this.backgroundGroupLabel.trim().toLowerCase();
		for (let o of n) {
			let n = t[o];
			if (n?.hideFromLegend === !0) continue;
			let s = n?.legendRole === "background" || n?.legendRole === "overlay" ? n.legendRole : null, c = typeof n?.label == "string" && n.label.length > 0 ? n.label : o, l = typeof n?.group == "string" && n.group.length > 0 ? n.group : null, u = typeof n?.minzoom == "number" ? n.minzoom : 0, d = typeof n?.maxzoom == "number" ? n.maxzoom : 24, f = typeof e.zoomLevel == "number" ? e.zoomLevel : 0, p = {
				layerId: o,
				label: c,
				layerType: typeof n?.layerType == "string" ? n.layerType : void 0,
				topLevelGroup: l,
				visible: n?.visible !== !1,
				hasExtent: this.layerHasExtent(o, n),
				hasStyleDialog: this.layerHasStyleDialog(n),
				outOfZoom: f < u || f >= d + 1,
				beingEdited: n?.borrowedByDrawTool === !0
			};
			s === "background" ? r.push(p) : s === "overlay" ? i.push(p) : l?.trim().toLowerCase() === a ? r.push(p) : i.push(p);
		}
		this.backgroundLayers = r, this.overviewLayers = i;
		let o = /* @__PURE__ */ new Map();
		for (let e of n) {
			let n = t[e];
			if (typeof n?.transparency == "number") o.set(e, n.transparency);
			else if (n?.layerType === "hillshade") {
				let t = Number(n?.paint?.["hillshade-exaggeration"] ?? 1);
				o.set(e, Math.round((1 - t) * 100));
			}
		}
		this.layerTransparency = o;
	}
	handleTransparencyChange(e, t) {
		this.applyTransparency(e, Number(t.target.value));
	}
	applyTransparency(e, t) {
		if (!this.adapter) return;
		let n = this.adapter.store.getState().mapLayers, r = n[e], i = r;
		if (i?.layerType === "hillshade") {
			r && this.adapter.store.dispatch({ mapLayers: {
				...n,
				[e]: {
					...r,
					transparency: t
				}
			} }, "UI");
			let a = (i?.sublayers)?.find((e) => e?.type === "hillshade")?.id ?? e;
			this.adapter.updateLayerStyle(e, a, { "hillshade-exaggeration": (100 - t) / 100 });
		} else this.adapter.setLayerOpacity(e, (100 - t) / 100);
	}
	beginEditTransparency(e) {
		this.editingTransparencyLayerId = e, this.updateComplete.then(() => {
			let e = this.shadowRoot?.querySelector(".opacity-value-input");
			e?.focus(), e?.select();
		});
	}
	commitTransparencyInput(e, t) {
		this.editingTransparencyLayerId = null;
		let n = Number(t.target.value), r = this.layerTransparency.get(e) ?? 0, i = Number.isFinite(n) ? Math.min(100, Math.max(0, Math.round(n))) : r;
		this.applyTransparency(e, i);
	}
	handleTransparencyInputKeydown(e) {
		e.key === "Enter" && e.target.blur();
	}
	async handleShowLayerInfo(e, t) {
		let n = this.adapter?.store.getState().mapLayers?.[e], r = n?.label ?? t, i = n?.attribution, a = n?.abstract, o = await this.getLayerFeatureSummary(e, n);
		this.infoDialog?.open(r, a, i, o);
	}
	handleShowLayerStyle(e, t) {
		let n = this.adapter?.store.getState().mapLayers?.[e], r = {
			title: n?.label ?? t,
			layerMeta: n ?? null,
			engine: this.adapter?.engineId,
			layerId: e,
			groups: [],
			apply: (t, n) => this.adapter?.updateLayerStyle(e, t || e, n) ?? !1,
			resample: () => this.getLayerStyleGroups(e, this.adapter?.store.getState().mapLayers?.[e]),
			attributeLabels: be(n?.attributes, this.adapter?.store.getState().attributeMetadata),
			watchView: (e) => this.adapter?.events.on("view-change-end", (t) => {
				e({
					west: t.bounds.sw[0],
					south: t.bounds.sw[1],
					east: t.bounds.ne[0],
					north: t.bounds.ne[1]
				});
			}) ?? (() => {}),
			layers: {
				add: (e) => this.adapter?.addLayer(e) ?? !1,
				remove: (e) => {
					this.adapter?.hasLayer?.(e) && this.adapter.removeLayer(e);
				},
				setExtraSubLayer: (e, t) => this.adapter?.setExtraSubLayer(e, t) ?? Promise.resolve(!1),
				setSubLayers: (e, t) => this.adapter?.setSubLayers(e, t) ?? Promise.resolve(!1),
				getSubLayers: (e) => this.adapter?.getSubLayers(e) ?? null,
				setSubLayerMetadata: (e, t, n) => this.adapter?.setSubLayerMetadata(e, t, n) ?? !1,
				canRebuild: (e) => this.adapter?.canRebuildLayer(e) ?? !1
			},
			...typeof n?.sourceId == "string" && n?.layerType === "raster" ? { raster: {
				sourceId: n.sourceId,
				sourceConfig: this.adapter?.getSourceConfig(n.sourceId) ?? null
			} } : {},
			...Array.isArray(n?.bounds) ? { bounds: n.bounds } : {},
			writeFeatures: (e, t) => this.adapter?.setSourceData(e, {
				type: "FeatureCollection",
				features: t
			}) ?? !1,
			fontStacks: () => ye(Object.keys(this.adapter?.store.getState().mapLayers ?? {}).map((e) => this.adapter?.getSubLayers(e) ?? null)),
			sourceControl: {
				setTiles: (e, t) => this.adapter?.setSourceTiles(e, t) ?? !1,
				setParams: (e, t) => this.adapter?.setSourceParams(e, t) ?? !1,
				getTiles: (e) => this.adapter?.getSourceTiles(e) ?? null,
				setLayerOpacity: (t) => this.adapter?.setLayerOpacity(e, t),
				getView: () => {
					let e = this.adapter?.getViewportState();
					if (!e) return null;
					let t = this.closest("webmapx-map") ?? this.parentElement, n = t?.clientWidth ?? 0, r = t?.clientHeight ?? 0;
					return n > 0 && r > 0 ? {
						...e,
						size: [n, r]
					} : e;
				}
			}
		};
		this.layerStyler?.open(r);
	}
	async getLayerFeatureSummary(e, t) {
		let n = typeof t?.sourceId == "string" ? t.sourceId : void 0, r = typeof t?.sourceLayer == "string" ? t.sourceLayer : void 0, { features: i, complete: a } = await De(this.adapter, e, {
			sourceId: n,
			sourceLayer: r,
			sourceData: t?.sourceData
		});
		if (!i || i.length === 0) return;
		let o = Xe({
			type: "FeatureCollection",
			features: i
		});
		return a ? o : `${o} — loaded and visible on the map now`;
	}
	layerHasExtent(e, t) {
		return Array.isArray(t?.bounds) && t.bounds.length === 4 ? !0 : Ze(e, t).some((e) => e.some((e) => this.adapter?.hasSourceData(e) === !0));
	}
	layerHasStyleDialog(e) {
		return this.getLayerStyleTargets("", e).length > 0 ? !0 : e?.layerType === "raster";
	}
	getLayerStyleTargets(e, t) {
		let n = [];
		if (Array.isArray(t?.sublayers) && t.sublayers.length > 0) this.collectStyleTargetsFromSublayers(e, t.sublayers, n);
		else {
			let r = typeof t?.layerType == "string" ? t.layerType : void 0, i = typeof t?.sourceId == "string" ? t.sourceId : "", a = typeof t?.sourceLayer == "string" ? t.sourceLayer : void 0;
			if (r && Qe.has(r)) {
				let o = t?.paint && typeof t.paint == "object" ? t.paint : void 0, s = t?.layout && typeof t.layout == "object" ? t.layout : void 0;
				n.push({
					id: e,
					type: r,
					sourceId: i,
					...o ? { paint: o } : {},
					...s ? { layout: s } : {},
					...a ? { sourceLayer: a } : {}
				});
			}
		}
		return n;
	}
	collectStyleTargetsFromSublayers(e, t, n) {
		if (Array.isArray(t)) for (let r of t) {
			if (!r || typeof r != "object") continue;
			let t = r, i = typeof t.type == "string" ? t.type : void 0, a = typeof t.id == "string" && t.id.length > 0 ? t.id : i, o = typeof t.source == "string" ? t.source : "", s = o ? `${e}:${o}` : "", c = typeof t["source-layer"] == "string" ? t["source-layer"] : void 0;
			if (i && a && Qe.has(i)) {
				let e = t.paint && typeof t.paint == "object" ? t.paint : void 0, r = t.layout && typeof t.layout == "object" ? t.layout : void 0;
				n.push({
					id: a,
					type: i,
					sourceId: s,
					...e ? { paint: e } : {},
					...r ? { layout: r } : {},
					...c ? { sourceLayer: c } : {}
				});
			}
			this.collectStyleTargetsFromSublayers(e, t.sublayers, n);
		}
	}
	async getLayerStyleGroups(e, t) {
		let n = this.getLayerStyleTargets(e, t), r = /* @__PURE__ */ new Map();
		for (let e of n) {
			let t = e.sourceId || "unknown source", n = r.get(t) ?? [];
			n.push(e), r.set(t, n);
		}
		let i = t?.attributes && typeof t.attributes == "object" ? t.attributes : {}, a = Array.isArray(i.allowedAttributes) ? new Set(i.allowedAttributes) : null, o = Array.isArray(i.deniedAttributes) ? new Set(i.deniedAttributes) : null;
		return Promise.all([...r.entries()].map(async ([n, r]) => {
			let i = r.find((e) => !!e.sourceLayer)?.sourceLayer, { features: s, complete: c } = await De(this.adapter, e, {
				sourceId: n,
				sourceLayer: i,
				sourceData: t?.sourceData
			}), l = ve(s);
			return (a || o) && (l = l.filter((e) => (!o || !o.has(e.name)) && (!a || a.has(e.name)))), {
				sourceId: n,
				featureCountLabel: this.featureCountLabel(s, c),
				featureCount: s?.length ?? null,
				features: s,
				completeData: c,
				geometryTypes: this.geometryTypeLabels(s),
				attributes: l,
				sourceLayer: i,
				sourceConfig: this.adapter?.getSourceConfig?.(n) ?? null,
				featureRows: this.featureRows(s),
				layers: r.map(({ sourceId: e, sourceLayer: t, ...n }) => n)
			};
		}));
	}
	dedupeFeatures(e) {
		let t = /* @__PURE__ */ new Set();
		return e.filter((e) => {
			let n = e.id === void 0 ? JSON.stringify([e.geometry, e.properties ?? {}]) : `id:${String(e.id)}`;
			return t.has(n) ? !1 : (t.add(n), !0);
		});
	}
	featureCountLabel(e, t) {
		if (!e) return "Feature sample unavailable";
		let n = t ? "features" : "loaded visible features";
		return `${e.length} ${n}`;
	}
	geometryTypeLabels(e) {
		if (!e || e.length === 0) return ["geometry unknown"];
		let t = /* @__PURE__ */ new Set();
		for (let n of e) {
			let e = n.geometry?.type;
			e && t.add(e);
		}
		return t.size > 0 ? [...t].sort() : ["geometry unknown"];
	}
	featureRows(e) {
		return e ? e.slice(0, 200).map((e) => e.properties && typeof e.properties == "object" ? { ...e.properties } : {}) : [];
	}
	getSourceExtent(e) {
		let t = e[0];
		if (this.sourceExtentCache.has(t)) return this.sourceExtentCache.get(t) ?? null;
		let n = null;
		for (let t of e) {
			let e = this.adapter?.getSourceData(t) ?? null;
			if (e && typeof e == "object") {
				n = qe(e);
				break;
			}
		}
		return this.sourceExtentCache.set(t, n), n;
	}
	resolveLayerExtent(e) {
		if (this.layerExtentCache.has(e)) return this.layerExtentCache.get(e) ?? null;
		let t = this.adapter?.store.getState().mapLayers?.[e], n = null;
		if (Array.isArray(t?.bounds) && t.bounds.length === 4) n = t.bounds;
		else for (let r of Ze(e, t)) n = Je(n, this.getSourceExtent(r));
		return this.layerExtentCache.set(e, n), n;
	}
	handleZoomToLayer(e) {
		let t = this.resolveLayerExtent(e);
		t && this.adapter?.fitBounds(t);
	}
	handleDeleteLayer(e) {
		this.adapter && (this.adapter.removeLayer(e), this.applyVisibleLayers(this.adapter.store.getState()));
	}
	isLegendCollapsed(e) {
		let t = this.store?.getState()?.mapLayers?.[e]?.legendExpandMode;
		return t === "expanded" ? !1 : t === "collapsed" ? !0 : this.overviewLayers.find((e) => e.visible)?.layerId !== e;
	}
	handleCollapseToggle(e) {
		if (!this.store) return;
		let t = this.store.getState(), n = t.mapLayers?.[e];
		if (!n) return;
		let r = this.isLegendCollapsed(e) ? "expanded" : "collapsed";
		this.store.dispatch({ mapLayers: {
			...t.mapLayers,
			[e]: {
				...n,
				legendExpandMode: r
			}
		} }, "UI");
	}
	setAllLayersVisibility(e) {
		if (!this.adapter || !this.store) return;
		let t = this.store.getState().mapLayers, n = { ...t };
		for (let r of this.overviewLayers) {
			let i = t[r.layerId];
			!i || i.visible === e || (this.adapter.setLayerVisibility(r.layerId, e), n[r.layerId] = {
				...i,
				visible: e
			});
		}
		this.store.dispatch({ mapLayers: n }, "UI"), this.applyVisibleLayers(this.store.getState());
	}
	handleHideAllLayers() {
		this.setAllLayersVisibility(!1);
	}
	handleShowAllLayers() {
		this.setAllLayersVisibility(!0);
	}
	handleClearAllLayers() {
		this.clearLayersDialog?.open();
	}
	handleConfirmClearAllLayers() {
		if (this.clearLayersDialog?.hide(), this.adapter) {
			for (let e of this.overviewLayers) this.adapter.removeLayer(e.layerId);
			this.applyVisibleLayers(this.adapter.store.getState());
		}
	}
	handleVisibilityToggle(e) {
		if (!this.adapter || !this.store) return;
		let t = this.store.getState().mapLayers[e]?.visible === !1;
		this.adapter.setLayerVisibility(e, t), this.applyVisibleLayers(this.store.getState());
	}
};
h([e({
	type: String,
	attribute: "background-group-label"
})], z.prototype, "backgroundGroupLabel", void 0), h([e({
	type: String,
	attribute: "background-title"
})], z.prototype, "backgroundTitle", void 0), h([e({
	type: String,
	attribute: "overview-title"
})], z.prototype, "overviewTitle", void 0), h([r()], z.prototype, "backgroundLayers", void 0), h([r()], z.prototype, "overviewLayers", void 0), h([r()], z.prototype, "layerTransparency", void 0), h([r()], z.prototype, "editingTransparencyLayerId", void 0), h([r()], z.prototype, "hoveredTransparencySliderLayerId", void 0), h([r()], z.prototype, "dropTargetLayerId", void 0), h([r()], z.prototype, "dropTargetPosition", void 0), h([i("webmapx-layer-info-dialog", !0)], z.prototype, "infoDialog", void 0), h([i("webmapx-layer-styler", !0)], z.prototype, "layerStyler", void 0), h([i("webmapx-save-layers-dialog", !0)], z.prototype, "saveLayersDialog", void 0), h([i("webmapx-permalink-dialog", !0)], z.prototype, "permalinkDialog", void 0), h([i("webmapx-clear-layers-dialog", !0)], z.prototype, "clearLayersDialog", void 0), z = R = h([a("webmapx-layer-overview")], z);
//#endregion
//#region src/components/webmapx-spinner.ts
var B = class extends g {
	constructor(...e) {
		super(...e), this.busy = !1, this.small = !1, this.nocolor = !1;
	}
	static {
		this.styles = n`
        :host {
            display: block;
            --webmapx-pointer-events: none;
            pointer-events: none;
        }
        .spinner-container {
            z-index: 1000;
            opacity: 0;
            transition: opacity var(--webmapx-motion-base, 200ms) ease-in-out;
        }
        .spinner-container.visible {
            opacity: 1;
        }
        sl-spinner {
            font-size: 1.5rem;
            --track-width: 3px;
            --indicator-color: var(--sl-color-primary-600);
            --track-color: var(--color-border-light, #e2e7ec);
        }
        :host([small]) sl-spinner {
            font-size: 1em;
            --track-width: 2px;
        }
        :host([nocolor]) sl-spinner {
            --indicator-color: var(--color-text-primary, #16202a);
            --track-color: var(--color-border, #d5dce3);
        }
    `;
	}
	connectedCallback() {
		super.connectedCallback(), this.setAttribute("aria-hidden", "true");
	}
	onStateChanged(e) {
		this.busy = e.mapBusy && !e.mapTimePlay;
	}
	render() {
		return o`
            <div class="spinner-container ${this.busy ? "visible" : ""}">
                <sl-spinner></sl-spinner>
            </div>
        `;
	}
};
h([r()], B.prototype, "busy", void 0), h([e({
	type: Boolean,
	reflect: !0
})], B.prototype, "small", void 0), h([e({
	type: Boolean,
	reflect: !0
})], B.prototype, "nocolor", void 0), B = h([a("webmapx-spinner")], B);
//#endregion
//#region src/components/webmapx-control-group.ts
var V = class extends c {
	constructor(...e) {
		super(...e), this.orientation = "vertical", this.panelPosition = "after", this.alignment = "start", this.slotAnchorY = "top", this.panelActive = !1, this.priority = "normal", this.panelObserver = null;
	}
	static {
		this.styles = n`
    :host {
      display: flex;
      pointer-events: none;
      gap: var(--webmapx-space-sm, 0.5rem);
      /* Fill (and cap at 80% of) the slot-zone's main axis, so this group
         has a definite height that slotted tool panels can size against
         via max-height: 100%. */
      flex: 1 1 auto;
      min-height: 0; /* let child flex items manage their own minimums */
      max-height: var(--webmapx-panel-max-height, 90%);
      max-width: 100%;
      align-items: stretch; /* Stretch children to full available cross-size */
      /* The flex direction is reversed (see below), so main-end is where the
         group used to start: pack there to keep the group on the same edge. */
      justify-content: flex-end;
      position: relative;
      z-index: var(--webmapx-control-group-z-index, auto);
    }

    :host([priority="high"]) {
      z-index: var(--webmapx-control-group-z-index-high, 10);
    }

    /* Alignment overrides */
    :host([alignment="end"]) { align-items: flex-end; }
    :host([alignment="center"]) { align-items: center; }

    /* The panel is the FIRST child in the DOM (so the toolbar paints over it,
       which is what lets the toolbar tooltips overlap an open panel), so the
       reversed direction is the one that puts the panel *after* the toolbar. */

    /* Vertical Toolbar -> Group is Row */
    :host([orientation="vertical"]) {
      flex-direction: row-reverse;
    }
    :host([orientation="vertical"][panel-position="before"]) {
      flex-direction: row;
    }

    /* Horizontal Toolbar -> Group is Column */
    :host([orientation="horizontal"]) {
      flex-direction: column-reverse;
    }
    :host([orientation="horizontal"][panel-position="before"]) {
      flex-direction: column;
    }
    
    /* Each slotted child manages its own pointer-events */

    /* Keep the panel attached to the slot edge. */
    :host([slot-anchor-y="top"])::slotted(webmapx-tool-panel) {
      align-self: flex-start;
    }

    :host([slot-anchor-y="bottom"])::slotted(webmapx-tool-panel) {
      align-self: flex-end;
    }

    :host([slot-anchor-y="middle"])::slotted(webmapx-tool-panel) {
      align-self: center;
    }

    /* When closed, the toolbar follows the same edge as the panel. */
    :host(:not([panel-active])[slot-anchor-y="top"])::slotted(webmapx-toolbar) {
      align-self: flex-start;
    }

    :host(:not([panel-active])[slot-anchor-y="bottom"])::slotted(webmapx-toolbar) {
      align-self: flex-end;
    }

    :host(:not([panel-active])[slot-anchor-y="middle"])::slotted(webmapx-toolbar) {
      align-self: center;
    }

  `;
	}
	connectedCallback() {
		super.connectedCallback(), this.updateSlotAnchor();
	}
	disconnectedCallback() {
		this.disconnectPanelObserver(), super.disconnectedCallback();
	}
	handleSlotChange() {
		this.updateToolbarOrientation(), this.observePanelState();
	}
	updateToolbarOrientation() {
		let e = this.childrenElements.find((e) => e.tagName.toLowerCase() === "webmapx-toolbar");
		e && (e.orientation = this.orientation);
	}
	updateSlotAnchor() {
		let e = this.getAttribute("slot") ?? "";
		this.slotAnchorY = e.includes("bottom") ? "bottom" : e.includes("middle") ? "middle" : "top";
	}
	observePanelState() {
		this.disconnectPanelObserver();
		let e = this.childrenElements.find((e) => e.tagName.toLowerCase() === "webmapx-tool-panel");
		if (!e) {
			this.panelActive = !1;
			return;
		}
		this.panelActive = e.hasAttribute("active"), this.panelObserver = new MutationObserver(() => {
			this.panelActive = e.hasAttribute("active");
		}), this.panelObserver.observe(e, {
			attributes: !0,
			attributeFilter: ["active"]
		});
	}
	disconnectPanelObserver() {
		this.panelObserver?.disconnect(), this.panelObserver = null;
	}
	updated(e) {
		e.has("orientation") && this.updateToolbarOrientation(), e.has("slot") && this.updateSlotAnchor();
	}
	render() {
		return o`<slot @slotchange=${this.handleSlotChange}></slot>`;
	}
};
h([e({
	type: String,
	reflect: !0
})], V.prototype, "orientation", void 0), h([e({
	type: String,
	reflect: !0,
	attribute: "panel-position"
})], V.prototype, "panelPosition", void 0), h([e({
	type: String,
	reflect: !0
})], V.prototype, "alignment", void 0), h([e({
	type: String,
	reflect: !0,
	attribute: "slot-anchor-y"
})], V.prototype, "slotAnchorY", void 0), h([e({
	type: Boolean,
	reflect: !0,
	attribute: "panel-active"
})], V.prototype, "panelActive", void 0), h([e({
	type: String,
	reflect: !0
})], V.prototype, "priority", void 0), h([l()], V.prototype, "childrenElements", void 0), V = h([a("webmapx-control-group")], V);
//#endregion
//#region src/components/webmapx-zoom-level.ts
var H = class extends g {
	constructor(...e) {
		super(...e), this.currentZoom = null, this.inputValue = "", this.unsubscribeEvents = null;
	}
	static {
		this.styles = n`
        :host {
            position: relative;
            display: inline-flex;
            pointer-events: auto;
        }

        .tool-container {
            border: var(--webmapx-zoom-border, 1px solid var(--color-border));
            padding: var(--compact-padding-vertical) var(--compact-padding-horizontal);
            background: var(--webmapx-zoom-bg, var(--color-background-secondary));
            opacity: var(--tool-background-opacity);
            color: var(--webmapx-zoom-color, var(--color-text-primary));
            display: inline-flex;
            align-items: center;
            gap: var(--compact-gap);
            font-size: var(--webmapx-zoom-font-size, var(--font-size-small));
        }

        input[type="number"] {
            width: 3.4em;
            height: 1.8em;
            padding: 0 0.2em;
            font-size: var(--font-size-small);
            font-family: inherit;
            color: inherit;
            background: transparent;
            border: 1px solid var(--color-border);
            border-radius: var(--sl-input-border-radius-small, 3px);
            outline: none;
            -moz-appearance: textfield;
        }

        input[type="number"]:hover,
        input[type="number"]:focus {
            border-bottom-color: var(--color-primary);
            box-shadow: 0 1px 0 0 var(--color-primary);
        }

        input[type="number"]::-webkit-outer-spin-button,
        input[type="number"]::-webkit-inner-spin-button {
            -webkit-appearance: none;
            margin: 0;
        }
    `;
	}
	onMapAttached(e) {
		this.unsubscribeEvents = e.events.on("view-change-end", (e) => {
			this.handleViewChange(e);
		});
	}
	onMapDetached() {
		this.unsubscribeEvents?.(), this.unsubscribeEvents = null;
	}
	onStateChanged(e) {
		e.zoomLevel != null && this.currentZoom === null && (this.currentZoom = e.zoomLevel, this.inputValue = this.currentZoom.toFixed(2));
	}
	handleViewChange(e) {
		this.currentZoom = e.zoom, this.inputValue = e.zoom.toFixed(2);
	}
	handleInputChange(e) {
		this.inputValue = e.target.value;
	}
	handleInputSubmit(e) {
		e.key === "Enter" && this.dispatchZoomIntent();
	}
	handleInputBlur() {
		this.dispatchZoomIntent();
	}
	dispatchZoomIntent() {
		if (!this.inputValue || !this.adapter) return;
		let e = parseFloat(this.inputValue);
		!isNaN(e) && e >= 0 && this.adapter.setZoom(e);
	}
	render() {
		return o`
            <div class="tool-container">
                <label for="zoom-input">Zoom:</label>
                <input
                    id="zoom-input"
                    .value="${this.inputValue}"
                    type="number"
                    min="1"
                    max="20"
                    step="0.01"
                    @input="${this.handleInputChange}"
                    @keydown="${this.handleInputSubmit}"
                    @blur="${this.handleInputBlur}"
                />
            </div>
        `;
	}
};
h([r()], H.prototype, "currentZoom", void 0), h([r()], H.prototype, "inputValue", void 0), H = h([a("webmapx-zoom-level")], H);
//#endregion
//#region src/components/webmapx-navigation-control.ts
var U = class extends g {
	constructor(...e) {
		super(...e), this.orientation = "vertical", this.showCompass = !0, this.showZoom = !0, this.visualizePitch = !0, this.currentZoom = null, this.bearing = 0, this.pitch = 0, this.compassSupported = !1, this.unsubscribeEvents = [], this.zoomMin = null, this.zoomMax = null, this.compassRect = null, this.compassPointerId = null, this.compassPointerTarget = null, this.startBearing = 0, this.startPitch = 0, this.startPointer = null, this.compassDragMoved = !1, this.suppressNextCompassClick = !1, this.compassClickTolerance = 4, this.compassDragMode = null, this.handleZoomIn = () => {
			if (!this.adapter) return;
			let e = this.adapter.getViewportState().zoom ?? this.currentZoom ?? this.adapter.getZoom(), t = this.clampZoom(e + 1);
			this.adapter.setZoom(t);
		}, this.handleZoomOut = () => {
			if (!this.adapter) return;
			let e = this.adapter.getViewportState().zoom ?? this.currentZoom ?? this.adapter.getZoom(), t = this.clampZoom(e - 1);
			this.adapter.setZoom(t);
		}, this.handleCompassClick = () => {
			if (this.suppressNextCompassClick) {
				this.suppressNextCompassClick = !1;
				return;
			}
			this.adapter && (this.adapter.getNavigationCapabilities?.()?.pitch && this.visualizePitch ? this.adapter.resetNorthPitch() : this.adapter.resetNorth());
		}, this.handleCompassPointerDown = (e) => {
			if (!this.adapter || !this.compassSupported) return;
			let t = e.currentTarget;
			if (t && (e.preventDefault(), this.compassPointerId = e.pointerId, this.compassPointerTarget = t, this.compassRect = t.getBoundingClientRect(), this.startBearing = this.bearing, this.startPitch = this.pitch, this.startPointer = {
				x: e.clientX,
				y: e.clientY
			}, this.compassDragMoved = !1, this.suppressNextCompassClick = !1, this.compassDragMode = this.resolveCompassDragMode(e), this.compassDragMode)) {
				try {
					t.setPointerCapture(e.pointerId);
				} catch {}
				window.addEventListener("pointermove", this.handleCompassPointerMove), window.addEventListener("pointerup", this.handleCompassPointerUp);
			}
		}, this.handleCompassPointerMove = (e) => {
			if (e.pointerId !== this.compassPointerId || !this.adapter || !this.compassRect || !this.compassDragMode) return;
			let t = this.compassRect.left + this.compassRect.width / 2, n = this.compassRect.top + this.compassRect.height / 2;
			if (Math.hypot(e.clientX - (this.startPointer?.x ?? e.clientX), e.clientY - (this.startPointer?.y ?? e.clientY)) > this.compassClickTolerance && (this.compassDragMoved = !0), this.compassDragMode === "rotate") {
				let r = (Math.atan2(e.clientY - n, e.clientX - t) - Math.atan2((this.startPointer?.y ?? n) - n, (this.startPointer?.x ?? t) - t)) * (180 / Math.PI), i = this.normalizeBearing(this.startBearing - r);
				this.adapter.setBearing(i), this.bearing = i;
			} else if (this.compassDragMode === "pitch" && this.startPointer) {
				let t = e.clientY - this.startPointer.y, n = this.clampPitch(this.startPitch - t * .35);
				this.adapter.setPitch(n), this.pitch = n;
			}
		}, this.handleCompassPointerUp = (e) => {
			e.pointerId === this.compassPointerId && (this.compassDragMoved && (this.suppressNextCompassClick = !0), this.releaseCompassPointer());
		};
	}
	static {
		this.styles = n`
    :host {
      display: inline-flex;
      pointer-events: auto;
      font-size: var(--webmapx-navigation-font-size, var(--font-size-small, 12px));
      color: var(--webmapx-navigation-color, var(--color-text-primary, #16202a));
    }

    .nav-shell {
      display: inline-flex;
      background: var(--webmapx-navigation-bg, rgb(var(--color-surface-rgb, 255 255 255) / var(--webmapx-surface-alpha, 1)));
      -webkit-backdrop-filter: var(--webmapx-surface-blur, none);
      backdrop-filter: var(--webmapx-surface-blur, none);
      border: var(--webmapx-navigation-border, var(--webmapx-surface-border, 1px solid var(--color-border-light, #e2e7ec)));
      box-shadow: var(--webmapx-navigation-shadow, var(--webmapx-surface-shadow, 0 1px 2px rgba(16, 24, 40, 0.07)));
      overflow: hidden;
      border-radius: var(--webmapx-navigation-radius, var(--webmapx-surface-radius, 6px));
      touch-action: none;
    }

    :host([orientation='vertical']) .nav-shell {
      flex-direction: column;
    }

    :host([orientation='horizontal']) .nav-shell {
      flex-direction: row;
    }

    .nav-btn:focus-visible {
      outline: var(--webmapx-focus-ring, 2px solid var(--color-primary, #2b6c8f));
      outline-offset: calc(-1 * var(--webmapx-focus-offset, 2px));
    }

    .nav-btn {
      appearance: none;
      border: none;
      background: transparent;
      box-sizing: border-box;
      width: var(--webmapx-navigation-button-size, var(--webmapx-hit-size, 36px));
      height: var(--webmapx-navigation-button-size, var(--webmapx-hit-size, 36px));
      padding: 0;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      color: inherit;
      transition: background var(--webmapx-motion-fast, 120ms) ease, transform var(--webmapx-motion-fast, 120ms) ease;
      touch-action: none;
    }

    .nav-btn + .nav-btn {
      border-top: 1px solid var(--webmapx-navigation-separator-color, var(--color-border-light, #e2e7ec));
    }

    :host([orientation='horizontal']) .nav-btn + .nav-btn {
      border-top: none;
      border-left: 1px solid var(--webmapx-navigation-separator-color, var(--color-border-light, #e2e7ec));
    }

    .nav-btn:hover:not(:disabled) {
      background: var(--webmapx-navigation-hover-bg, var(--color-background-hover, rgba(22, 32, 42, 0.06)));
      color: var(--webmapx-navigation-hover-color, var(--color-text-primary, #16202a));
    }

    .nav-btn:active:not(:disabled) {
      transform: scale(0.98);
    }

    .nav-btn:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }

    .icon {
      font-weight: 400;
      font-size: 20px;
      line-height: 1;
      user-select: none;
    }

    .compass-body {
      position: relative;
      width: 16px;
      height: 16px;
      border-radius: 50%;
      border: 1.5px solid var(--webmapx-navigation-separator-color, var(--color-border-light, #e2e7ec));
      display: inline-flex;
      align-items: center;
      justify-content: center;
      background: var(--webmapx-navigation-bg, var(--color-surface, #fff));
      transform-style: preserve-3d;
      transition: transform var(--webmapx-motion-fast, 120ms) ease;
    }

    .compass-arrow {
      width: 0;
      height: 0;
      border-left: 4px solid transparent;
      border-right: 4px solid transparent;
      border-bottom: 7px solid var(--color-primary, #2b6c8f);
      transform-origin: center 70%;
      filter: drop-shadow(0 0 1px rgba(0, 0, 0, 0.2));
    }
  `;
	}
	onMapAttached(e) {
		this.cleanup(), this.compassSupported = this.resolveCompassSupport(e), this.zoomMin = this.mapConfig?.minZoom ?? null, this.zoomMax = this.mapConfig?.maxZoom ?? null;
		let t = e.getViewportState();
		this.currentZoom = t.zoom, this.bearing = t.bearing ?? 0, this.pitch = t.pitch ?? 0;
		let n = (e) => {
			this.currentZoom = e.zoom, this.bearing = e.bearing ?? 0, this.pitch = e.pitch ?? 0;
		};
		this.unsubscribeEvents.push(e.events.on("view-change", n)), this.unsubscribeEvents.push(e.events.on("view-change-end", n));
	}
	onMapDetached() {
		this.cleanup(), this.currentZoom = null, this.bearing = 0, this.pitch = 0, this.compassSupported = !1, this.zoomMin = null, this.zoomMax = null;
	}
	onStateChanged(e) {
		e.zoomLevel != null && e.zoomLevel !== this.currentZoom && (this.currentZoom = e.zoomLevel);
	}
	cleanup() {
		this.unsubscribeEvents.forEach((e) => e()), this.unsubscribeEvents = [], this.releaseCompassPointer();
	}
	resolveCompassSupport(e) {
		let t = e?.getNavigationCapabilities?.() ?? null;
		return t ? !!(t.bearing || this.visualizePitch && t.pitch) : !1;
	}
	clampZoom(e) {
		let t = e;
		return this.zoomMin !== null && (t = Math.max(t, this.zoomMin)), this.zoomMax !== null && (t = Math.min(t, this.zoomMax)), t;
	}
	clampPitch(e) {
		return Math.max(0, Math.min(89, e));
	}
	normalizeBearing(e) {
		let t = e % 360;
		return t > 180 && (t -= 360), t <= -180 && (t += 360), t;
	}
	releaseCompassPointer() {
		let e = this.compassPointerId;
		if (this.compassPointerId = null, this.compassRect = null, this.startPointer = null, this.compassDragMoved = !1, this.compassDragMode = null, e !== null && this.compassPointerTarget?.releasePointerCapture) try {
			this.compassPointerTarget.releasePointerCapture(e);
		} catch {}
		this.compassPointerTarget = null, window.removeEventListener("pointermove", this.handleCompassPointerMove), window.removeEventListener("pointerup", this.handleCompassPointerUp);
	}
	resolveCompassDragMode(e) {
		if (!this.compassRect || !this.adapter) return null;
		let t = this.adapter.getNavigationCapabilities?.() ?? {
			bearing: !1,
			pitch: !1
		}, n = this.compassRect.left + this.compassRect.width / 2, r = this.compassRect.top + this.compassRect.height / 2, i = e.clientX - n, a = e.clientY - r, o = Math.abs(a) > Math.abs(i);
		return o && this.visualizePitch && t.pitch ? "pitch" : !o && t.bearing || t.bearing ? "rotate" : this.visualizePitch && t.pitch ? "pitch" : null;
	}
	renderCompass() {
		let e = [];
		e.push(`rotate(${this.normalizeBearing(-this.bearing)}deg)`), this.visualizePitch && e.unshift(`rotateX(${this.pitch}deg)`);
		let t = e.join(" ");
		return o`
      <button
        class="nav-btn"
        @click=${this.handleCompassClick}
        @pointerdown=${this.handleCompassPointerDown}
        title="Reset north"
        aria-label="Compass reset"
      >
        <span class="compass-body" style=${`transform: ${t};`}>
          <span class="compass-arrow"></span>
        </span>
      </button>
    `;
	}
	render() {
		let e = this.showCompass && this.compassSupported, t = this.zoomMin ?? -Infinity, n = this.zoomMax ?? Infinity, r = this.currentZoom ?? 0;
		return o`
      <div class="nav-shell">
        ${this.showZoom ? o`<button class="nav-btn" @click=${this.handleZoomIn} ?disabled=${r >= n} title="Zoom in">
              <span class="icon">+</span>
            </button>` : null}
        ${this.showZoom ? o`<button class="nav-btn" @click=${this.handleZoomOut} ?disabled=${r <= t} title="Zoom out">
              <span class="icon">-</span>
            </button>` : null}
        ${e ? this.renderCompass() : null}
      </div>
    `;
	}
};
h([e({
	type: String,
	reflect: !0
})], U.prototype, "orientation", void 0), h([e({
	type: Boolean,
	attribute: "show-compass",
	reflect: !0
})], U.prototype, "showCompass", void 0), h([e({
	type: Boolean,
	attribute: "show-zoom",
	reflect: !0
})], U.prototype, "showZoom", void 0), h([e({
	type: Boolean,
	attribute: "visualize-pitch",
	reflect: !0
})], U.prototype, "visualizePitch", void 0), h([r()], U.prototype, "currentZoom", void 0), h([r()], U.prototype, "bearing", void 0), h([r()], U.prototype, "pitch", void 0), h([r()], U.prototype, "compassSupported", void 0), U = h([a("webmapx-navigation-control")], U);
//#endregion
//#region src/components/webmapx-scale-control.ts
var W = class extends g {
	constructor(...e) {
		super(...e), this.maxWidth = 100, this.unit = "metric", this.barWidth = 0, this.label = "—", this.resizeObserver = null, this.unsubscribeEvents = [], this.lastBounds = null, this.lastCenter = null, this.lastZoom = null, this.hasLiveView = !1, this.attachedAdapter = null, this.lastUnprojectStatus = "none";
	}
	static {
		this.styles = n`
    :host {
      display: inline-flex;
      /* Default carries bottom breathing room: this control is usually placed
         in a bottom zone directly above the attribution line, and the bar is
         open at the bottom, so with no gap it reads as sitting on it. It stays
         part of the shorthand fallback rather than a separate margin-bottom
         declaration — a later margin-bottom would silently beat the margin a
         config sets through --webmapx-tool-margin. */
      margin: var(--webmapx-tool-margin, 0 0 4px 0);
      /* Read-only chrome: the bar has no interaction of its own, and it sits
         over the map, so pan/zoom/tap must pass straight through it. The
         layout's overlay surface is pointer-events:none and re-enables it per
         control, so this is an opt-out, not a default. */
      pointer-events: none;
      font-size: var(--font-size-small, 12px);
      color: var(--webmapx-scale-color, var(--color-text-primary, #16202a));
    }

    /*
     * The bar sits directly on the map, so it has no surface of its own to give
     * it contrast — and over satellite imagery a dark bar on a dark sea is
     * invisible. A halo rather than a background plate: a plate would hide the
     * imagery it is measuring, while an outline keeps the map visible through
     * the control and works over anything, light or dark.
     *
     * The text gets it from four offset shadows (there is no text-outline in
     * CSS), the rules from a drop-shadow filter, which follows the border
     * shape rather than the box.
     */
    .scale-shell {
      filter:
        drop-shadow(0 0 1px var(--webmapx-scale-halo, rgba(255, 255, 255, 0.9)))
        drop-shadow(0 0 2px var(--webmapx-scale-halo, rgba(255, 255, 255, 0.9)));
    }

    .scale-label {
      --halo: var(--webmapx-scale-halo, rgba(255, 255, 255, 0.9));
      text-shadow:
        -1px 0 var(--halo), 1px 0 var(--halo),
        0 -1px var(--halo), 0 1px var(--halo),
        -1px -1px var(--halo), 1px -1px var(--halo),
        -1px 1px var(--halo), 1px 1px var(--halo);
    }

    /*
     * In dark mode the map chrome is light on dark, so the halo turns dark to
     * keep the same job: separating the bar from whatever is behind it.
     */
    :host-context([data-theme='dark']) .scale-shell,
    :host-context([data-theme='dark']) .scale-label {
      --webmapx-scale-halo: rgba(0, 0, 0, 0.75);
    }

    .scale-shell {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 22px;
      padding: 0;
      margin: 0;
      background: var(--webmapx-scale-bg, transparent);
      border-left: var(--webmapx-scale-border-thickness, 2px) solid var(--webmapx-scale-border-color, var(--color-text-primary, #16202a));
      border-right: var(--webmapx-scale-border-thickness, 2px) solid var(--webmapx-scale-border-color, var(--color-text-primary, #16202a));
      border-bottom: var(--webmapx-scale-border-thickness, 2px) solid var(--webmapx-scale-border-color, var(--color-text-primary, #16202a));
      box-sizing: border-box;
      user-select: none;
    }

    .scale-label {
      font-weight: 500;
      letter-spacing: 0.01em;
      text-transform: none;
      line-height: 1;
      font-size: 11px;
    }

    .muted {
      color: var(--color-text-secondary, #5a6773);
    }
  `;
	}
	connectedCallback() {
		super.connectedCallback(), this.observeContainer();
	}
	disconnectedCallback() {
		this.teardownObservers(), this.clearEventSubscriptions(), super.disconnectedCallback();
	}
	onMapAttached(e) {
		this.clearEventSubscriptions(), this.hasLiveView = !1, this.attachedAdapter = e, this.observeContainer(), this.unsubscribeEvents.push(e.events.on("view-change", (e) => {
			this.hasLiveView = !0, this.lastBounds = e.bounds, this.lastCenter = e.center, this.lastZoom = e.zoom;
		})), this.unsubscribeEvents.push(e.events.on("view-change-end", (e) => {
			this.hasLiveView = !0, this.lastBounds = e.bounds, this.lastCenter = e.center, this.lastZoom = e.zoom, this.recalculateScale();
		})), this.applyStateSnapshot(e.store.getState(), !0);
	}
	updated(e) {
		(e.has("maxWidth") || e.has("unit")) && this.recalculateScale();
	}
	onMapDetached() {
		this.clearEventSubscriptions(), this.hasLiveView = !1, this.barWidth = 0, this.label = "—", this.attachedAdapter = null;
	}
	onStateChanged(e) {
		this.applyStateSnapshot(e, !this.hasLiveView);
	}
	applyStateSnapshot(e, t) {
		if (!t) return;
		let n = !1, r = this.extractBounds(e.mapViewportBounds);
		r && (this.lastBounds = r, n = !0), e.mapCenter && (this.lastCenter = e.mapCenter, n = !0), e.zoomLevel != null && (this.lastZoom = e.zoomLevel, n = !0), n && this.recalculateScale();
	}
	recalculateScale() {
		if (!this.attachedAdapter?.store.getState().mapLoaded) return;
		this.lastUnprojectStatus = "none";
		let e = this.maxWidthPx, t = this.getSurfaceMetrics(), n = t?.width ?? 0, r = this.getTargetPixel(t), i = r?.x ?? null, a = r?.y ?? null, o = this.getSampleLatitude(a, t);
		if (!n || n <= 0) {
			this.barWidth = 0, this.label = "—";
			return;
		}
		let s = this.estimateMetersForWidth(e, n, o, i, a);
		if (!s || s <= 0 || !isFinite(s)) {
			this.barWidth = 0, this.label = "—";
			return;
		}
		let c = this.buildDisplay(s, e, this.normalizedUnit);
		if (!c) {
			this.barWidth = 0, this.label = "—";
			return;
		}
		this.barWidth = c.widthPx, this.label = c.label;
	}
	estimateMetersForWidth(e, t, n, r, i) {
		let a = this.segmentDistanceViaUnproject(e, r, i);
		if (a?.status === "ok" && a.meters > 0) return this.lastUnprojectStatus = "ok", a.meters;
		if (!a || a.status === "off-globe" || a.status === "failed") return this.lastUnprojectStatus = a?.status ?? "failed", null;
		if (this.lastZoom != null) {
			let t = n ?? this.lastCenter?.[1];
			return $e(this.lastZoom, t ?? 0) * e;
		}
		let o = this.horizontalMetersAcrossBounds(this.lastBounds, n);
		return o && o > 0 && t > 0 ? o / t * e : null;
	}
	horizontalMetersAcrossBounds(e, t) {
		if (!e) return null;
		let n = et(t ?? (e.sw[1] + e.ne[1]) / 2), r = e.sw[0], i = e.ne[0], a = tt(i - r);
		if (a <= 0) return null;
		let o = nt * Math.cos(n * Math.PI / 180), s = Math.abs(a) * o;
		return s > 0 ? s : null;
	}
	buildDisplay(e, t, n) {
		if (!isFinite(e) || e <= 0) return null;
		if (n === "imperial") {
			let n = e * 3.28084;
			if (n > 5280) {
				let e = n / 5280, r = G(e);
				return {
					widthPx: r / e * t,
					label: `${r} mi`
				};
			}
			let r = G(n);
			return {
				widthPx: r / n * t,
				label: `${r} ft`
			};
		}
		if (n === "nautical") {
			let n = e / 1852, r = G(n);
			return {
				widthPx: r / n * t,
				label: `${r} nm`
			};
		}
		if (e >= 1e3) {
			let n = e / 1e3, r = G(n);
			return {
				widthPx: r / n * t,
				label: `${r} km`
			};
		}
		let r = G(e);
		return {
			widthPx: r / e * t,
			label: `${r} m`
		};
	}
	get normalizedUnit() {
		let e = (this.unit || "").toLowerCase();
		return e === "imperial" || e === "nautical" ? e : "metric";
	}
	get maxWidthPx() {
		let e = Number(this.maxWidth);
		return !Number.isFinite(e) || e <= 0 ? 100 : e;
	}
	extractBounds(e) {
		let t = e?.geometry?.coordinates?.[0];
		return !Array.isArray(t) || t.length < 4 ? null : {
			sw: t[0],
			ne: t[2]
		};
	}
	getContainerWidth() {
		let e = this.mapHost, t = e?.mapElement ?? e;
		return t && t.clientWidth || 0;
	}
	observeContainer() {
		this.teardownObservers();
		let e = this.mapHost?.mapElement ?? this.mapHost;
		!e || typeof ResizeObserver > "u" || (this.resizeObserver = new ResizeObserver(() => this.recalculateScale()), this.resizeObserver.observe(e));
	}
	teardownObservers() {
		this.resizeObserver &&= (this.resizeObserver.disconnect(), null);
	}
	clearEventSubscriptions() {
		this.unsubscribeEvents.length && (this.unsubscribeEvents.forEach((e) => e()), this.unsubscribeEvents = []);
	}
	getSampleLatitude(e, t) {
		if (!(this.mapHost?.mapElement ?? this.mapHost) || !this.attachedAdapter || e == null || !(t ?? this.getSurfaceMetrics())) return null;
		let n = this.lastCenter?.[0] ?? 0, r = -85.05112878, i = 85.05112878, a = (r + i) / 2;
		for (let t = 0; t < 24; t++) {
			let t = (r + i) / 2, o = this.attachedAdapter.project([n, t])?.[1] ?? NaN;
			if (!isFinite(o) || (a = t, Math.abs(o - e) < .1)) break;
			o > e ? r = t : i = t;
		}
		return et(a);
	}
	getTargetPixel(e) {
		let t = this.mapHost?.mapElement ?? this.mapHost;
		if (!t) return null;
		let n = t.getBoundingClientRect(), r = this.getBoundingClientRect();
		if (!n.height || !n.width) return null;
		let i = e ?? this.getSurfaceMetrics();
		if (!i) return null;
		let a = (r.top + r.bottom) / 2 - n.top, o = (r.left + r.right) / 2 - n.left;
		return {
			x: Math.min(Math.max(o, 0), i.width),
			y: Math.min(Math.max(a, 0), i.height)
		};
	}
	segmentDistanceViaUnproject(e, t, n) {
		if (!this.attachedAdapter) return null;
		let r = this.mapHost?.mapElement ?? this.mapHost;
		if (!r) return null;
		let i = this.getSurfaceMetrics();
		if (!i) return null;
		let { width: a, height: o } = i;
		if (!a || !o || !e || n == null || t == null) return null;
		let s = (n, r) => {
			let i = Math.min(e / 2, a / 2), o = Math.min(Math.max(t, i), a - i), s = [o - i, n], c = [o + i, n];
			if (!this.attachedAdapter) return null;
			let l = this.attachedAdapter.unproject(s), u = this.attachedAdapter.unproject(c);
			if (!l || !u) return null;
			let d = Oe(l, u) / 100;
			return !isFinite(d) || d <= 0 ? null : { meters: d };
		}, c = n ?? o / 2, l = s(c, "primary");
		if (!l) {
			let e = r.clientHeight / 2;
			e !== c && (l = s(e, "center-fallback"));
		}
		return l ? (this.lastUnprojectStatus = "ok", {
			status: "ok",
			meters: l.meters
		}) : (this.lastUnprojectStatus = "off-globe", { status: "off-globe" });
	}
	debugLog(e, t) {}
	getSurfaceMetrics() {
		let e = this.mapHost?.mapElement ?? this.mapHost;
		if (!e) return null;
		let t = e.clientWidth, n = e.clientHeight;
		return !t || !n ? null : {
			width: t,
			height: n
		};
	}
	render() {
		let e = this.barWidth <= 0, t = this.getSurfaceMetrics()?.width ?? this.getContainerWidth();
		return o`
      <div class="scale-shell" role="presentation" style=${`width: ${this.barWidth > 0 ? Math.max(0, Math.min(this.barWidth, t || Infinity)) : Math.min(this.maxWidthPx, t || this.maxWidthPx)}px`}>
        <div class="scale-label ${e ? "muted" : ""}">${this.label}</div>
      </div>
    `;
	}
};
h([e({
	type: Number,
	attribute: "max-width"
})], W.prototype, "maxWidth", void 0), h([e({
	type: String,
	attribute: "unit"
})], W.prototype, "unit", void 0), h([r()], W.prototype, "barWidth", void 0), h([r()], W.prototype, "label", void 0), W = h([a("webmapx-scale-control")], W);
function $e(e, t) {
	let n = et(t) * Math.PI / 180;
	return 40075016.68557849 * Math.cos(n) / (512 * 2 ** e);
}
function et(e) {
	return Math.max(-85.05112878, Math.min(85.05112878, e));
}
function tt(e) {
	let t = e;
	return t < 0 && (t += 360), t === 0 || t > 360 ? 360 : t;
}
var nt = 111319.49079327357;
function rt(e) {
	let t = 10 ** Math.ceil(-Math.log(e) / Math.LN10);
	return Math.round(e * t) / t;
}
function G(e) {
	let t = 10 ** (`${Math.floor(e)}`.length - 1), n = e / t;
	return n = n >= 10 ? 10 : n >= 5 ? 5 : n >= 3 ? 3 : n >= 2 ? 2 : n >= 1 ? 1 : rt(n), t * n;
}
//#endregion
//#region src/components/webmapx-fullscreen-control.ts
var it = class extends g {
	constructor(...e) {
		super(...e), this.isFullscreen = !1, this.handleFullscreenChange = () => {
			this.isFullscreen = document.fullscreenElement === this.fullscreenTarget();
		}, this.handleToggle = () => {
			document.fullscreenElement ? document.exitFullscreen() : this.fullscreenTarget().requestFullscreen();
		};
	}
	static {
		this.styles = n`
    :host {
      display: inline-flex;
      pointer-events: auto;
      font-size: var(--webmapx-navigation-font-size, var(--font-size-small, 12px));
      color: var(--webmapx-navigation-color, var(--color-text-primary, #16202a));
    }

    .nav-shell {
      display: inline-flex;
      background: var(--webmapx-navigation-bg, rgb(var(--color-surface-rgb, 255 255 255) / var(--webmapx-surface-alpha, 1)));
      -webkit-backdrop-filter: var(--webmapx-surface-blur, none);
      backdrop-filter: var(--webmapx-surface-blur, none);
      border: var(--webmapx-navigation-border, var(--webmapx-surface-border, 1px solid var(--color-border-light, #e2e7ec)));
      box-shadow: var(--webmapx-navigation-shadow, var(--webmapx-surface-shadow, 0 1px 2px rgba(16, 24, 40, 0.07)));
      border-radius: var(--webmapx-navigation-radius, var(--webmapx-surface-radius, 6px));
    }

    .nav-btn:focus-visible {
      outline: var(--webmapx-focus-ring, 2px solid var(--color-primary, #2b6c8f));
      outline-offset: calc(-1 * var(--webmapx-focus-offset, 2px));
    }

    .nav-btn {
      appearance: none;
      border: none;
      background: transparent;
      box-sizing: border-box;
      width: var(--webmapx-navigation-button-size, var(--webmapx-toolbar-button-size, var(--webmapx-hit-size, 36px)));
      height: var(--webmapx-navigation-button-size, var(--webmapx-toolbar-button-size, var(--webmapx-hit-size, 36px)));
      padding: 0;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      color: inherit;
      transition: background var(--webmapx-motion-fast, 120ms) ease, transform var(--webmapx-motion-fast, 120ms) ease;
    }

    .nav-btn:hover {
      background: var(--webmapx-navigation-hover-bg, var(--color-background-hover, rgba(22, 32, 42, 0.06)));
      color: var(--webmapx-navigation-hover-color, var(--color-text-primary, #16202a));
    }

    .nav-btn:active {
      transform: scale(0.98);
    }

    svg {
      width: 16px;
      height: 16px;
      fill: none;
      stroke: currentColor;
      stroke-width: 2;
      stroke-linecap: round;
      stroke-linejoin: round;
    }
  `;
	}
	onMapAttached() {
		document.addEventListener("fullscreenchange", this.handleFullscreenChange), this.isFullscreen = document.fullscreenElement === this.fullscreenTarget();
	}
	onMapDetached() {
		document.removeEventListener("fullscreenchange", this.handleFullscreenChange);
	}
	onStateChanged() {}
	onConfigReady() {}
	fullscreenTarget() {
		return p(this) ?? this;
	}
	render() {
		return o`
      <div class="nav-shell">
        <button class="nav-btn" @click=${this.handleToggle} title="${this.isFullscreen ? "Exit fullscreen" : "Fullscreen"}" aria-label="Toggle fullscreen">
          ${this.isFullscreen ? o`<svg viewBox="0 0 24 24"><path d="M9 3v3a2 2 0 0 1-2 2H4M21 9h-3a2 2 0 0 1-2-2V4M3 15h3a2 2 0 0 1 2 2v3M15 21v-3a2 2 0 0 1 2-2h3"/></svg>` : o`<svg viewBox="0 0 24 24"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg>`}
        </button>
      </div>
    `;
	}
};
h([r()], it.prototype, "isFullscreen", void 0), it = h([a("webmapx-fullscreen-control")], it);
//#endregion
//#region src/components/webmapx-attribution-control.ts
var K = class extends g {
	constructor(...e) {
		super(...e), this.attributions = [], this._showLeft = !1, this._showRight = !1, this.layerData = null, this.visibleLayerIds = [], this.mapLayersState = {}, this._dragStartX = 0, this._dragStartScroll = 0, this._dragging = !1;
	}
	connectedCallback() {
		super.connectedCallback(), this._applyPositionAlignment(), this.subscribeToConfig();
	}
	disconnectedCallback() {
		super.disconnectedCallback(), this._resizeObserver?.disconnect();
	}
	onMapAttached(e) {
		this.subscribeToConfig();
	}
	onConfigReady(e) {
		this.layerData = e.layerData ?? e.catalog ?? null, this._applyPositionAlignment(), this.recalculate();
	}
	_applyPositionAlignment() {
		let e = this.getAttribute("slot") ?? "";
		e.includes("-left") ? this.style.justifyContent = "flex-start" : e.includes("-center") ? this.style.justifyContent = "center" : this.style.justifyContent = "flex-end";
	}
	onStateChanged(e) {
		let t = e.mapLayers ?? {}, n = Object.keys(t).filter((e) => t[e]?.visible !== !1);
		this.visibleLayerIds.join(",") !== n.join(",") && (this.visibleLayerIds = n, this.mapLayersState = t, this.recalculate());
	}
	onMapDetached() {
		this.attributions = [], this.visibleLayerIds = [], this.mapLayersState = {}, this.layerData = null, super.onMapDetached();
	}
	recalculate() {
		let e = /* @__PURE__ */ new Map(), t = /* @__PURE__ */ new Map();
		if (this.layerData) {
			for (let t of this.layerData.sources ?? []) e.set(t.id, t);
			for (let e of this.layerData.layers ?? []) t.set(e.id, e);
		}
		this.attributions = Se(this.visibleLayerIds.map((e) => {
			let n = this.mapLayersState[e];
			return {
				catalogLayer: t.get(e),
				entryAttribution: typeof n?.attribution == "string" ? n.attribution : void 0,
				sourceId: typeof n?.sourceId == "string" ? n.sourceId : void 0
			};
		}), e, (e) => this.adapter?.getSourceAttribution(e)), this.updateComplete.then(() => this._updateOverflow());
	}
	_updateOverflow() {
		let e = this._scrollEl;
		if (!e) return;
		let t = e.scrollWidth - e.clientWidth;
		this._showLeft = e.scrollLeft > 1, this._showRight = e.scrollLeft < t - 1;
	}
	firstUpdated() {
		let e = this._scrollEl;
		if (!e) return;
		this._resizeObserver = new ResizeObserver(() => this._updateOverflow()), this._resizeObserver.observe(e), e.addEventListener("scroll", () => this._updateOverflow(), { passive: !0 }), e.addEventListener("pointerdown", (t) => {
			t.button === 0 && (this._dragging = !0, this._dragStartX = t.clientX, this._dragStartScroll = e.scrollLeft, e.setPointerCapture(t.pointerId), e.style.cursor = "grabbing");
		}), e.addEventListener("pointermove", (t) => {
			this._dragging && (e.scrollLeft = this._dragStartScroll - (t.clientX - this._dragStartX));
		});
		let t = () => {
			this._dragging = !1, e.style.cursor = "";
		};
		e.addEventListener("pointerup", t), e.addEventListener("pointercancel", t), e.addEventListener("touchstart", (t) => {
			this._dragStartX = t.touches[0].clientX, this._dragStartScroll = e.scrollLeft;
		}, { passive: !0 }), e.addEventListener("touchmove", (t) => {
			e.scrollLeft = this._dragStartScroll - (t.touches[0].clientX - this._dragStartX);
		}, { passive: !0 });
	}
	render() {
		return o`
            <div class="attribution-shell" ?hidden=${!(this.attributions.length > 0)} role="region" aria-label="Map attributions">
                ${this._showLeft ? o`<span class="overflow-indicator left" aria-hidden="true">‹</span>` : null}
                <div class="attribution-scroll">
                    <div class="attribution-inner">
                        ${this.attributions.map((e, t) => o`
                            ${xe(e)}
                            ${t < this.attributions.length - 1 ? o`<span class="separator">•</span>` : null}
                        `)}
                    </div>
                </div>
                ${this._showRight ? o`<span class="overflow-indicator right" aria-hidden="true">›</span>` : null}
            </div>
        `;
	}
	static {
		this.styles = n`
        :host {
            display: flex;
            justify-content: flex-end;
            width: 100%;
            --webmapx-pointer-events: none;
            pointer-events: none;
            font-size: var(--webmapx-font-size-sm, 11px);
            color: var(--color-text-secondary, #5a6773);
            box-sizing: border-box;
        }

        .attribution-shell {
            display: inline-flex;
            align-items: center;
            max-width: 80%;
            flex: 0 1 auto;
            background: rgb(var(--color-surface-rgb, 255 255 255) / calc(var(--webmapx-surface-alpha, 1) * 0.85));
            -webkit-backdrop-filter: var(--webmapx-surface-blur, none);
            backdrop-filter: var(--webmapx-surface-blur, none);
            border-radius: var(--webmapx-radius-sm, 4px) var(--webmapx-radius-sm, 4px) 0 0;
            box-sizing: border-box;
            pointer-events: none;
            overflow: hidden;
        }

        .attribution-scroll {
            overflow: hidden;
            flex: 1 1 auto;
            min-width: 0;
            padding: 2px 6px 1px;
            cursor: grab;
            pointer-events: auto;
            user-select: none;
            -webkit-user-select: none;
        }

        .attribution-inner {
            display: inline-flex;
            align-items: center;
            gap: 0.35em;
            white-space: nowrap;
        }

        .overflow-indicator {
            flex: 0 0 auto;
            padding: 2px 4px 1px;
            font-size: var(--webmapx-font-size-md, 14px);
            line-height: 1;
            opacity: 0.6;
            pointer-events: none;
            user-select: none;
        }

        .attribution-item {
            pointer-events: auto;
        }

        .attribution-item a {
            color: inherit;
            text-decoration: none;
            pointer-events: auto;
        }

        .attribution-item a:hover {
            text-decoration: underline;
        }

        .separator {
            opacity: 0.6;
        }

        [hidden] {
            display: none !important;
        }
    `;
	}
};
h([r()], K.prototype, "attributions", void 0), h([r()], K.prototype, "_showLeft", void 0), h([r()], K.prototype, "_showRight", void 0), h([i(".attribution-scroll")], K.prototype, "_scrollEl", void 0), K = h([a("webmapx-attribution-control")], K);
//#endregion
//#region node_modules/@shoelace-style/shoelace/dist/chunks/chunk.5D6IT2SR.js
var at = n`
  :host {
    --thumb-size: 20px;
    --tooltip-offset: 10px;
    --track-color-active: var(--sl-color-neutral-200);
    --track-color-inactive: var(--sl-color-neutral-200);
    --track-active-offset: 0%;
    --track-height: 6px;

    display: block;
  }

  .range {
    position: relative;
  }

  .range__control {
    --percent: 0%;
    -webkit-appearance: none;
    border-radius: 3px;
    width: 100%;
    height: var(--track-height);
    background: transparent;
    line-height: var(--sl-input-height-medium);
    vertical-align: middle;
    margin: 0;

    background-image: linear-gradient(
      to right,
      var(--track-color-inactive) 0%,
      var(--track-color-inactive) min(var(--percent), var(--track-active-offset)),
      var(--track-color-active) min(var(--percent), var(--track-active-offset)),
      var(--track-color-active) max(var(--percent), var(--track-active-offset)),
      var(--track-color-inactive) max(var(--percent), var(--track-active-offset)),
      var(--track-color-inactive) 100%
    );
  }

  .range--rtl .range__control {
    background-image: linear-gradient(
      to left,
      var(--track-color-inactive) 0%,
      var(--track-color-inactive) min(var(--percent), var(--track-active-offset)),
      var(--track-color-active) min(var(--percent), var(--track-active-offset)),
      var(--track-color-active) max(var(--percent), var(--track-active-offset)),
      var(--track-color-inactive) max(var(--percent), var(--track-active-offset)),
      var(--track-color-inactive) 100%
    );
  }

  /* Webkit */
  .range__control::-webkit-slider-runnable-track {
    width: 100%;
    height: var(--track-height);
    border-radius: 3px;
    border: none;
  }

  .range__control::-webkit-slider-thumb {
    border: none;
    width: var(--thumb-size);
    height: var(--thumb-size);
    border-radius: 50%;
    background-color: var(--sl-color-primary-600);
    border: solid var(--sl-input-border-width) var(--sl-color-primary-600);
    -webkit-appearance: none;
    margin-top: calc(var(--thumb-size) / -2 + var(--track-height) / 2);
    cursor: pointer;
  }

  .range__control:enabled::-webkit-slider-thumb:hover {
    background-color: var(--sl-color-primary-500);
    border-color: var(--sl-color-primary-500);
  }

  .range__control:enabled:focus-visible::-webkit-slider-thumb {
    outline: var(--sl-focus-ring);
    outline-offset: var(--sl-focus-ring-offset);
  }

  .range__control:enabled::-webkit-slider-thumb:active {
    background-color: var(--sl-color-primary-500);
    border-color: var(--sl-color-primary-500);
    cursor: grabbing;
  }

  /* Firefox */
  .range__control::-moz-focus-outer {
    border: 0;
  }

  .range__control::-moz-range-progress {
    background-color: var(--track-color-active);
    border-radius: 3px;
    height: var(--track-height);
  }

  .range__control::-moz-range-track {
    width: 100%;
    height: var(--track-height);
    background-color: var(--track-color-inactive);
    border-radius: 3px;
    border: none;
  }

  .range__control::-moz-range-thumb {
    border: none;
    height: var(--thumb-size);
    width: var(--thumb-size);
    border-radius: 50%;
    background-color: var(--sl-color-primary-600);
    border-color: var(--sl-color-primary-600);
    transition:
      var(--sl-transition-fast) border-color,
      var(--sl-transition-fast) background-color,
      var(--sl-transition-fast) color,
      var(--sl-transition-fast) box-shadow;
    cursor: pointer;
  }

  .range__control:enabled::-moz-range-thumb:hover {
    background-color: var(--sl-color-primary-500);
    border-color: var(--sl-color-primary-500);
  }

  .range__control:enabled:focus-visible::-moz-range-thumb {
    outline: var(--sl-focus-ring);
    outline-offset: var(--sl-focus-ring-offset);
  }

  .range__control:enabled::-moz-range-thumb:active {
    background-color: var(--sl-color-primary-500);
    border-color: var(--sl-color-primary-500);
    cursor: grabbing;
  }

  /* States */
  .range__control:focus-visible {
    outline: none;
  }

  .range__control:disabled {
    opacity: 0.5;
  }

  .range__control:disabled::-webkit-slider-thumb {
    cursor: not-allowed;
  }

  .range__control:disabled::-moz-range-thumb {
    cursor: not-allowed;
  }

  /* Tooltip output */
  .range__tooltip {
    position: absolute;
    z-index: var(--sl-z-index-tooltip);
    left: 0;
    border-radius: var(--sl-tooltip-border-radius);
    background-color: var(--sl-tooltip-background-color);
    font-family: var(--sl-tooltip-font-family);
    font-size: var(--sl-tooltip-font-size);
    font-weight: var(--sl-tooltip-font-weight);
    line-height: var(--sl-tooltip-line-height);
    color: var(--sl-tooltip-color);
    opacity: 0;
    padding: var(--sl-tooltip-padding);
    transition: var(--sl-transition-fast) opacity;
    pointer-events: none;
  }

  .range__tooltip:after {
    content: '';
    position: absolute;
    width: 0;
    height: 0;
    left: 50%;
    translate: calc(-1 * var(--sl-tooltip-arrow-size));
  }

  .range--tooltip-visible .range__tooltip {
    opacity: 1;
  }

  /* Tooltip on top */
  .range--tooltip-top .range__tooltip {
    top: calc(-1 * var(--thumb-size) - var(--tooltip-offset));
  }

  .range--tooltip-top .range__tooltip:after {
    border-top: var(--sl-tooltip-arrow-size) solid var(--sl-tooltip-background-color);
    border-left: var(--sl-tooltip-arrow-size) solid transparent;
    border-right: var(--sl-tooltip-arrow-size) solid transparent;
    top: 100%;
  }

  /* Tooltip on bottom */
  .range--tooltip-bottom .range__tooltip {
    bottom: calc(-1 * var(--thumb-size) - var(--tooltip-offset));
  }

  .range--tooltip-bottom .range__tooltip:after {
    border-bottom: var(--sl-tooltip-arrow-size) solid var(--sl-tooltip-background-color);
    border-left: var(--sl-tooltip-arrow-size) solid transparent;
    border-right: var(--sl-tooltip-arrow-size) solid transparent;
    bottom: 100%;
  }

  @media (forced-colors: active) {
    .range__control,
    .range__tooltip {
      border: solid 1px transparent;
    }

    .range__control::-webkit-slider-thumb {
      border: solid 1px transparent;
    }

    .range__control::-moz-range-thumb {
      border: solid 1px transparent;
    }

    .range__tooltip:after {
      display: none;
    }
  }
`, q = class extends v {
	constructor() {
		super(...arguments), this.formControlController = new le(this), this.hasSlotController = new se(this, "help-text", "label"), this.localize = new C(this), this.hasFocus = !1, this.hasTooltip = !1, this.title = "", this.name = "", this.value = 0, this.label = "", this.helpText = "", this.disabled = !1, this.min = 0, this.max = 100, this.step = 1, this.tooltip = "top", this.tooltipFormatter = (e) => e.toString(), this.form = "", this.defaultValue = 0;
	}
	get validity() {
		return this.input.validity;
	}
	get validationMessage() {
		return this.input.validationMessage;
	}
	connectedCallback() {
		super.connectedCallback(), this.resizeObserver = new ResizeObserver(() => this.syncRange()), this.value < this.min && (this.value = this.min), this.value > this.max && (this.value = this.max), this.updateComplete.then(() => {
			this.syncRange(), this.resizeObserver.observe(this.input);
		});
	}
	disconnectedCallback() {
		var e;
		super.disconnectedCallback(), (e = this.resizeObserver) == null || e.unobserve(this.input);
	}
	handleChange() {
		this.emit("sl-change");
	}
	handleInput() {
		this.value = parseFloat(this.input.value), this.emit("sl-input"), this.syncRange();
	}
	handleBlur() {
		this.hasFocus = !1, this.hasTooltip = !1, this.emit("sl-blur");
	}
	handleFocus() {
		this.hasFocus = !0, this.hasTooltip = !0, this.emit("sl-focus");
	}
	handleThumbDragStart() {
		this.hasTooltip = !0;
	}
	handleThumbDragEnd() {
		this.hasTooltip = !1;
	}
	syncProgress(e) {
		this.input.style.setProperty("--percent", `${e * 100}%`);
	}
	syncTooltip(e) {
		if (this.output !== null) {
			let t = this.input.offsetWidth, n = this.output.offsetWidth, r = getComputedStyle(this.input).getPropertyValue("--thumb-size"), i = this.localize.dir() === "rtl", a = t * e;
			if (i) {
				let i = `${t - a}px + ${e} * ${r}`;
				this.output.style.translate = `calc((${i} - ${n / 2}px - ${r} / 2))`;
			} else {
				let t = `${a}px - ${e} * ${r}`;
				this.output.style.translate = `calc(${t} - ${n / 2}px + ${r} / 2)`;
			}
		}
	}
	handleValueChange() {
		this.formControlController.updateValidity(), this.input.value = this.value.toString(), this.value = parseFloat(this.input.value), this.syncRange();
	}
	handleDisabledChange() {
		this.formControlController.setValidity(this.disabled);
	}
	syncRange() {
		let e = Math.max(0, (this.value - this.min) / (this.max - this.min));
		this.syncProgress(e), this.tooltip !== "none" && this.hasTooltip && this.updateComplete.then(() => this.syncTooltip(e));
	}
	handleInvalid(e) {
		this.formControlController.setValidity(!1), this.formControlController.emitInvalidEvent(e);
	}
	focus(e) {
		this.input.focus(e);
	}
	blur() {
		this.input.blur();
	}
	stepUp() {
		this.input.stepUp(), this.value !== Number(this.input.value) && (this.value = Number(this.input.value));
	}
	stepDown() {
		this.input.stepDown(), this.value !== Number(this.input.value) && (this.value = Number(this.input.value));
	}
	checkValidity() {
		return this.input.checkValidity();
	}
	getForm() {
		return this.formControlController.getForm();
	}
	reportValidity() {
		return this.input.reportValidity();
	}
	setCustomValidity(e) {
		this.input.setCustomValidity(e), this.formControlController.updateValidity();
	}
	render() {
		let e = this.hasSlotController.test("label"), t = this.hasSlotController.test("help-text"), n = this.label ? !0 : !!e, r = this.helpText ? !0 : !!t;
		return o`
      <div
        part="form-control"
        class=${S({
			"form-control": !0,
			"form-control--medium": !0,
			"form-control--has-label": n,
			"form-control--has-help-text": r
		})}
      >
        <label
          part="form-control-label"
          class="form-control__label"
          for="input"
          aria-hidden=${n ? "false" : "true"}
        >
          <slot name="label">${this.label}</slot>
        </label>

        <div part="form-control-input" class="form-control-input">
          <div
            part="base"
            class=${S({
			range: !0,
			"range--disabled": this.disabled,
			"range--focused": this.hasFocus,
			"range--rtl": this.localize.dir() === "rtl",
			"range--tooltip-visible": this.hasTooltip,
			"range--tooltip-top": this.tooltip === "top",
			"range--tooltip-bottom": this.tooltip === "bottom"
		})}
            @mousedown=${this.handleThumbDragStart}
            @mouseup=${this.handleThumbDragEnd}
            @touchstart=${this.handleThumbDragStart}
            @touchend=${this.handleThumbDragEnd}
          >
            <input
              part="input"
              id="input"
              class="range__control"
              title=${this.title}
              type="range"
              name=${x(this.name)}
              ?disabled=${this.disabled}
              min=${x(this.min)}
              max=${x(this.max)}
              step=${x(this.step)}
              .value=${fe(this.value.toString())}
              aria-describedby="help-text"
              @change=${this.handleChange}
              @focus=${this.handleFocus}
              @input=${this.handleInput}
              @invalid=${this.handleInvalid}
              @blur=${this.handleBlur}
            />
            ${this.tooltip !== "none" && !this.disabled ? o`
                  <output part="tooltip" class="range__tooltip">
                    ${typeof this.tooltipFormatter == "function" ? this.tooltipFormatter(this.value) : this.value}
                  </output>
                ` : ""}
          </div>
        </div>

        <div
          part="form-control-help-text"
          id="help-text"
          class="form-control__help-text"
          aria-hidden=${r ? "false" : "true"}
        >
          <slot name="help-text">${this.helpText}</slot>
        </div>
      </div>
    `;
	}
};
//#endregion
//#region node_modules/@shoelace-style/shoelace/dist/chunks/chunk.CKH4GVK3.js
q.styles = [
	_,
	pe,
	at
], b([i(".range__control")], q.prototype, "input", 2), b([i(".range__tooltip")], q.prototype, "output", 2), b([r()], q.prototype, "hasFocus", 2), b([r()], q.prototype, "hasTooltip", 2), b([e()], q.prototype, "title", 2), b([e()], q.prototype, "name", 2), b([e({ type: Number })], q.prototype, "value", 2), b([e()], q.prototype, "label", 2), b([e({ attribute: "help-text" })], q.prototype, "helpText", 2), b([e({
	type: Boolean,
	reflect: !0
})], q.prototype, "disabled", 2), b([e({ type: Number })], q.prototype, "min", 2), b([e({ type: Number })], q.prototype, "max", 2), b([e({ type: Number })], q.prototype, "step", 2), b([e()], q.prototype, "tooltip", 2), b([e({ attribute: !1 })], q.prototype, "tooltipFormatter", 2), b([e({ reflect: !0 })], q.prototype, "form", 2), b([de()], q.prototype, "defaultValue", 2), b([s({ passive: !0 })], q.prototype, "handleThumbDragStart", 1), b([y("value", { waitUntilFirstUpdate: !0 })], q.prototype, "handleValueChange", 1), b([y("disabled", { waitUntilFirstUpdate: !0 })], q.prototype, "handleDisabledChange", 1), b([y("hasTooltip", { waitUntilFirstUpdate: !0 })], q.prototype, "syncRange", 1), q.define("sl-range");
//#endregion
//#region src/components/webmapx-tool-template.ts
var J = class extends g {
	constructor(...e) {
		super(...e), this.bufferRadius = 0, this.isToolActive = !1, this.toolService = null;
	}
	static {
		this.styles = n`
        :host {
            display: inline-flex;
            pointer-events: auto;
        }
        .tool-container {
            padding: var(--webmapx-tool-padding, 0);
            color: var(--color-text-primary);
            display: flex;
            flex-direction: column;
            gap: 6px;
            font-size: 0.8rem;
        }
        .tool-title {
            font-size: 0.7rem;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            color: var(--color-text-secondary, #5a6773);
        }
        .radius-row {
            display: flex;
            align-items: center;
            gap: 6px;
        }
    `;
	}
	onMapAttached(e) {
		this.toolService = e.toolService;
	}
	onMapDetached() {
		this.toolService = null;
	}
	onStateChanged(e) {
		this.bufferRadius = e.bufferRadiusKm, this.isToolActive = e.activeTool?.toolId === "Buffer";
	}
	handleSliderInput(e) {
		let t = parseInt(e.target.value);
		this.isSettingValue = !0, !(!this.store || !this.toolService) && (this.store.dispatch({ bufferRadiusKm: t }, "UI"), this.toolService.setBufferRadius(t), setTimeout(() => {
			this.isSettingValue = !1;
		}, 50));
	}
	handleToolToggle() {
		this.toolService?.toggleTool();
	}
	render() {
		return o`
            <div class="tool-container">
                <div class="tool-title">Template Tool — Buffer</div>
                <div class="radius-row">
                    <span>Radius: ${this.bufferRadius} km</span>
                    <sl-range
                        min="1"
                        max="50"
                        label="Radius"
                        .value="${this.bufferRadius}"
                        @sl-change="${this.handleSliderInput}"
                        tooltip="top"
                        style="flex:1;min-width:80px"></sl-range>
                </div>
                <sl-button
                    size="small"
                    @click="${this.handleToolToggle}"
                    variant="${this.isToolActive ? "primary" : "default"}"
                    outline
                >Toggle Buffer</sl-button>
            </div>
        `;
	}
};
h([r()], J.prototype, "bufferRadius", void 0), h([r()], J.prototype, "isToolActive", void 0), J = h([a("webmapx-tool-template")], J);
//#endregion
//#region src/components/webmapx-inset-map.ts
var ot = "https://demotiles.maplibre.org/style.json", st = 0, ct = 22, lt = 85.05112878, ut = 89.999, dt = 1, Y = "viewport", ft = "viewport-fill", pt = "viewport-outline", X = class extends c {
	constructor(...e) {
		super(...e), this.zoomOffset = -3, this.baseScale = .5, this.minimizable = !1, this._collapsed = !1, this.adapter = null, this.insetMap = null, this.viewportSource = null, this.unsubscribe = null, this.lastCenter = null, this.lastZoom = null, this.lastSourceZoom = null, this.projectionMode = "mercator", this.lastBoundsKey = null, this.initPromise = null, this.pendingViewportBounds = null, this.idleCallbackId = null, this.throttledViewportUpdate = we(() => {
			let e = this.pendingViewportBounds;
			this.pendingViewportBounds = void 0, this.idleCallbackId !== null && (window.cancelIdleCallback ?? clearTimeout)(this.idleCallbackId);
			let t = () => {
				this.idleCallbackId = null, this.doUpdateViewportRectangle(e);
			};
			typeof window.requestIdleCallback == "function" ? this.idleCallbackId = window.requestIdleCallback(t) : this.idleCallbackId = window.setTimeout(t, 300);
		}, 150), this.throttledApplyStateWithZoomOffset = we((e, t) => {
			this.applyState(e, t);
		}, 150);
	}
	get insetContainer() {
		return this.renderRoot.querySelector(".inset-map");
	}
	static {
		this.styles = n`
    :host {
      display: inline-block;
      position: relative;
      width: var(--webmapx-inset-width, 256px);
      height: var(--webmapx-inset-height, 256px);
      border: 1px solid var(--color-border, #d5dce3);
      border-radius: var(--webmapx-radius-md, 6px);
      overflow: hidden;
      background: var(--color-background-secondary, #f4f6f8);
      box-shadow: var(--webmapx-shadow-md, 0 4px 12px rgba(0, 0, 0, 0.12));
      pointer-events: auto;
    }

    :host([minimizable]) {
      transition: width var(--webmapx-motion-base, 200ms), height var(--webmapx-motion-base, 200ms);
    }

    :host([collapsed]) {
      width: 32px;
      height: 32px;
      overflow: visible;
    }

    .toggle-btn {
      position: absolute;
      top: 2px;
      right: 2px;
      z-index: 10;
      background: rgba(255, 255, 255, 0.85);
      border-radius: 4px;
      line-height: 0;
      opacity: 0;
      transition: opacity var(--webmapx-motion-fast, 120ms);
    }

    :host(:hover) .toggle-btn,
    :host(:focus-within) .toggle-btn,
    :host([collapsed]) .toggle-btn {
      opacity: 1;
    }

    .inset-map-frame.hidden {
      display: none;
    }

    /* Pointer focus on the frame should not draw a ring, but the frame is
       tabindex=0 when minimizable, so keyboard focus must stay visible. */
    .inset-map-frame:focus {
      outline: none;
    }

    .inset-map-frame:focus-visible {
      outline: var(--webmapx-focus-ring, 2px solid var(--color-primary, #2b6c8f));
      outline-offset: var(--webmapx-focus-offset, 2px);
    }

    .inset-map-frame {
      position: relative;
      width: 100%;
      height: 100%;
      overflow: hidden;
    }

    .inset-map {
      position: absolute;
      top: 50%;
      left: 50%;
      width: var(--webmapx-inset-internal-size, 512px);
      height: var(--webmapx-inset-internal-size, 512px);
      transform-origin: center;
      transform: translate(-50%, -50%) scale(var(--webmapx-inset-scale, 0.5));
    }
  `;
	}
	firstUpdated() {
		this.initializeInset();
	}
	updated(e) {
		(e.has("zoomOffset") || e.has("styleUrl") || e.has("baseScale") || e.has("backgroundLayer")) && (this.destroyInset(), this.initializeInset());
	}
	disconnectedCallback() {
		this.destroyInset(), super.disconnectedCallback();
	}
	async initializeInset() {
		if (this.initPromise) {
			await this.initPromise;
			return;
		}
		this.initPromise = this.doInitializeInset();
		try {
			await this.initPromise;
		} finally {
			this.initPromise = null;
		}
	}
	async doInitializeInset() {
		let e = this.insetContainer;
		if (!e) return;
		let t = p(this);
		if (!t) return;
		let n = await t.getAdapterAsync?.();
		if (!n) return;
		this.adapter = n, this.projectionMode = this.resolveProjectionMode(t);
		let r = this.adapter.store.getState();
		await this.waitForConfig(t);
		let i = this.resolveInsetToolConfig(t), a = this.resolveInsetNumber("zoom-offset", this.zoomOffset, i.zoomOffset), o = this.resolveInsetNumber("base-scale", this.baseScale, i.baseScale), s = this.backgroundLayer ? this.resolveBackgroundFromLayer(t, this.backgroundLayer) : null, c = this.hasAttribute("style-url") ? this.styleUrl : s?.styleUrl ?? i.styleUrl, l = s ? s.background ?? null : this.resolveInsetBackground(i), u = {
			styleUrl: c ?? ot,
			center: r.mapCenter ?? [0, 0],
			zoom: this.clampZoom((r.zoomLevel ?? 0) + a),
			interactive: !1,
			...l ? {
				tileUrl: l.url,
				tileUrls: Array.isArray(l.tiles) ? l.tiles.filter((e) => typeof e == "string" && e.length > 0) : void 0,
				tileAttribution: l.attribution,
				tileSize: l.tileSize
			} : {}
		};
		this.insetMap = this.adapter.mapFactory.createMap(e, u), e.style.setProperty("--webmapx-inset-scale", `${o}`), this.insetMap.onReady(() => {
			this.setupViewportLayers(), this.applyState(r, a);
		}), this.unsubscribe = this.adapter.store.subscribe((e) => {
			this.hasRelevantStateChange(e) && this.throttledApplyStateWithZoomOffset(e, a);
		});
	}
	waitForConfig(e) {
		return e?.config ? Promise.resolve() : new Promise((t) => {
			let n = () => {
				e.removeEventListener("webmapx-config-ready", n), t();
			};
			e.addEventListener("webmapx-config-ready", n);
		});
	}
	resolveInsetToolConfig(e) {
		let t = (e?.config)?.tools?.insetMap;
		return !t || typeof t != "object" ? { enabled: !0 } : t;
	}
	resolveInsetBackground(e) {
		let t = e.background;
		if (!t || t.service !== "xyz") return null;
		let n = typeof t.url == "string" && t.url.length > 0, r = Array.isArray(t.tiles) && t.tiles.length > 0 && t.tiles.every((e) => typeof e == "string" && e.length > 0);
		return !n && !r ? null : t;
	}
	resolveBackgroundFromLayer(e, t) {
		let n = e?.layerDataConfig, r = n?.layers ?? [], i = n?.sources ?? [], a = r.find((e) => e?.id === t);
		if (!a) return console.error(`[webmapx-inset-map] background-layer "${t}" not found in layerData.layers; using default background.`), null;
		if (a.type === "style") return typeof a.url == "string" && a.url ? { styleUrl: a.url } : (console.error(`[webmapx-inset-map] background-layer "${t}" is an inline style (no remote "url"); using default background.`), null);
		let o = typeof a.source == "string" ? a.source : t, s = i.find((e) => e?.id === o);
		if (!s || s.service !== "xyz") return console.error(`[webmapx-inset-map] background-layer "${t}" has no XYZ raster source or remote style; using default background.`), null;
		let c = s.url, l = Array.isArray(c) ? c.filter((e) => typeof e == "string") : void 0, u = typeof c == "string" ? c : void 0;
		return !l?.length && !u ? (console.error(`[webmapx-inset-map] background-layer "${t}" source has no tile URL; using default background.`), null) : { background: {
			service: "xyz",
			url: u,
			tiles: l,
			attribution: typeof s.attribution == "string" ? s.attribution : void 0,
			tileSize: typeof s.tileSize == "number" ? s.tileSize : void 0
		} };
	}
	resolveInsetNumber(e, t, n) {
		return this.hasAttribute(e) ? t : typeof n == "number" && Number.isFinite(n) ? n : t;
	}
	destroyInset() {
		this.unsubscribe &&= (this.unsubscribe(), null), this.idleCallbackId !== null && ((window.cancelIdleCallback ?? clearTimeout)(this.idleCallbackId), this.idleCallbackId = null), this.insetMap &&= (this.insetMap.destroy(), null), this.viewportSource = null, this.lastCenter = null, this.lastZoom = null, this.lastSourceZoom = null, this.projectionMode = "mercator", this.lastBoundsKey = null;
	}
	resolveProjectionMode(e) {
		let t = e?.mapConfig?.style;
		if (t && typeof t == "object") {
			let e = t.projection;
			if (e && typeof e == "object") {
				let t = e.type;
				if (typeof t == "string" && t.toLowerCase() === "globe") return "geodetic";
			}
		}
		return "mercator";
	}
	updateProjectionModeFromBounds(e) {
		let t = this.coerceRing(e?.geometry?.coordinates?.[0]);
		t.length && t.reduce((e, [, t]) => Math.max(e, Math.abs(t)), 0) > 85.05212878 && (this.projectionMode = "geodetic");
	}
	maxViewportLat() {
		return this.projectionMode === "geodetic" ? ut : lt;
	}
	setupViewportLayers() {
		if (!this.insetMap) return;
		let e = {
			type: "FeatureCollection",
			features: []
		};
		this.viewportSource = this.insetMap.createSource(Y, e), this.insetMap.createLayer({
			id: ft,
			type: "fill",
			source: Y,
			paint: {
				"fill-color": Ce,
				"fill-opacity": .15
			}
		}), this.insetMap.createLayer({
			id: pt,
			type: "line",
			source: Y,
			paint: {
				"line-color": Ce,
				"line-width": 1.5
			}
		});
	}
	applyState(e, t = this.zoomOffset) {
		if (!this.insetMap) return;
		let n = this.insetContainer;
		if (n) {
			if (this.updateProjectionModeFromBounds(e.mapViewportBounds), e.mapCenter) {
				let r = (e.zoomLevel ?? 0) + t, { mapZoom: i, scale: a } = this.resolveViewState(r);
				n.style.setProperty("--webmapx-inset-scale", `${a}`), this.isSameView(e.mapCenter, i) || (this.insetMap.setViewport(e.mapCenter, i), this.lastCenter = [...e.mapCenter], this.lastZoom = i);
			}
			this.updateViewportRectangle(e.mapViewportBounds);
		}
	}
	isSameView(e, t) {
		return !this.lastCenter || this.lastZoom === null ? !1 : this.lastCenter[0] === e[0] && this.lastCenter[1] === e[1] && this.lastZoom === t;
	}
	updateViewportRectangle(e) {
		this.pendingViewportBounds = e, this.throttledViewportUpdate();
	}
	doUpdateViewportRectangle(e) {
		if (!this.viewportSource || (this.computeBoundsKey(e) ?? "__null__") === this.lastBoundsKey) return;
		if (!e || !e.geometry?.coordinates?.[0]?.length) {
			this.lastBoundsKey = "__null__", this.viewportSource.setData({
				type: "FeatureCollection",
				features: []
			});
			return;
		}
		let t = this.getInsetBounds();
		if (t) {
			let n = this.coerceRing(e.geometry.coordinates[0]);
			if (n.length >= 3) {
				let r = this.clipRingToAabb(n, t.minLng, t.minLat, t.maxLng, t.maxLat);
				if (r.length < 3) {
					this.lastBoundsKey !== "__outside__" && (this.lastBoundsKey = "__outside__", this.viewportSource.setData({
						type: "FeatureCollection",
						features: []
					}));
					return;
				}
				if (r.length !== n.length || r.some((e, t) => e[0] !== n[t][0] || e[1] !== n[t][1])) {
					let t = {
						...e,
						geometry: {
							type: "Polygon",
							coordinates: [this.ensureClosed(r)]
						}
					}, n = this.computeBoundsKey(t);
					n !== this.lastBoundsKey && (this.lastBoundsKey = n, this.viewportSource.setData({
						type: "FeatureCollection",
						features: [t]
					}));
					return;
				}
			}
		}
		let n = this.buildFullWidthViewportFeature(e);
		if (n) {
			let e = this.computeBoundsKey(n);
			if (e === this.lastBoundsKey) return;
			this.lastBoundsKey = e, this.viewportSource.setData({
				type: "FeatureCollection",
				features: [n]
			});
			return;
		}
		let r = this.buildWideViewportFeature(e);
		if (r) {
			let e = this.computeBoundsKey(r);
			if (e === this.lastBoundsKey) return;
			this.lastBoundsKey = e, this.viewportSource.setData({
				type: "FeatureCollection",
				features: [r]
			});
			return;
		}
		let i = this.densifyViewportBounds(e);
		if (!i) return;
		let a = this.computeBoundsKey(i);
		if (a === this.lastBoundsKey) return;
		this.lastBoundsKey = a;
		let o = i ? this.coerceRing(i.geometry.coordinates?.[0]) : void 0, s = o && o.length ? this.computeSpan(o) : null, c = o ? this.hasSelfIntersection(o) : !1, l = s && s.lon >= 359.5, u = i;
		if (c || l) {
			let t = this.normalizeViewportBounds(e), n = t ? this.coerceRing(t.geometry.coordinates?.[0]) : [], r = n.length ? this.hasSelfIntersection(n) : !0;
			u = t && !r ? t : null;
		}
		let d = {
			type: "FeatureCollection",
			features: u ? [u] : []
		};
		this.viewportSource.setData(d);
	}
	hasRelevantStateChange(e) {
		let t = e.mapCenter, n = e.zoomLevel, r = this.computeBoundsKey(e.mapViewportBounds), i = !!t && !this.isSameCenter(t, this.lastCenter), a = n !== this.lastSourceZoom, o = r !== this.lastBoundsKey, s = !this.lastCenter && !!t || this.lastSourceZoom === null && n !== null;
		return this.lastSourceZoom = n, s || i || a || o;
	}
	isSameCenter(e, t) {
		return t ? e[0] === t[0] && e[1] === t[1] : !1;
	}
	computeBoundsKey(e) {
		if (!e) return null;
		let t = this.coerceRing(e.geometry?.coordinates?.[0]);
		if (!t || t.length < 4) return null;
		let n = (e) => e.toFixed(6);
		return t.map((e) => `${n(e[0])}:${n(e[1])}`).join("|");
	}
	normalizeViewportBounds(e) {
		if (!e) return null;
		let t = this.coerceRing(e.geometry?.coordinates?.[0]), n = this.lastCenter?.[0] ?? t[0]?.[0] ?? 0, r = this.ensureClosed(this.unwrapLongitudes(t, n));
		if (r.length < 4) return null;
		let i = r.map(([e, t]) => !Number.isFinite(e) || !Number.isFinite(t) ? null : [this.normalizeLngAround(e, n), this.clampLat(t)]).filter((e) => !!e);
		if (i.length < 4) return null;
		let a = this.ensureClosed(i);
		return {
			type: "Feature",
			properties: e.properties ?? {},
			geometry: {
				type: "Polygon",
				coordinates: [a]
			}
		};
	}
	densifyViewportBounds(e) {
		if (!e) return null;
		let t = this.normalizeViewportBounds(e);
		if (!t) return null;
		let n = this.coerceRing(t.geometry.coordinates[0]);
		if (n.length < 4) return t;
		let r = this.densifyRingWithPixels(n);
		if (!r.length) return null;
		let i = this.ensureClosed(r);
		return {
			type: "Feature",
			properties: e.properties ?? {},
			geometry: {
				type: "Polygon",
				coordinates: [i]
			}
		};
	}
	densifyRingWithPixels(e) {
		if (!this.adapter || !this.adapter.store.getState().mapLoaded) return e;
		let t = this.ensureClosed(e), n = this.lastCenter?.[0] ?? t[0]?.[0] ?? 0, r = this.ensureClosed(this.unwrapLongitudes(e, n)), i = this.computeSpan(r);
		if (i.lat <= 2 && i.lon <= 2) return t;
		let a = r.map((e) => this.adapter?.project(e)).filter((e) => Array.isArray(e) && e.length === 2 && e.every(Number.isFinite));
		if (a.length < 2) return t;
		let o = [];
		for (let e = 1; e < a.length; e++) {
			let t = a[e - 1], n = a[e], r = n[0] - t[0], i = n[1] - t[1], s = Math.sqrt(r * r + i * i), c = Math.min(25, Math.max(1, Math.ceil(s / 50)));
			for (let e = 0; e <= c; e++) {
				let n = e / c;
				o.push([t[0] + r * n, t[1] + i * n]);
			}
		}
		let s = o;
		if (s.length > 100) {
			let e = Math.ceil(s.length / 100);
			s = s.filter((t, n) => n % e === 0), s[s.length - 1] !== o[o.length - 1] && s.push(o[o.length - 1]);
		}
		let c = [];
		for (let e of s) {
			let t = this.adapter.unproject(e);
			if (!t || !Number.isFinite(t[0]) || !Number.isFinite(t[1])) continue;
			let n = this.clampLat(t[1]), r = this.normalizeLng(t[0]);
			c.push([r, n]);
		}
		let l = c.map(([e, t]) => [e, this.clampLat(t)]).filter(([, e]) => Math.abs(e) <= this.maxViewportLat()), u = this.rewrapContinuousLongitudes(l.length ? l : t), d = this.limitLongitudeSpan(u, 359), f = this.dedupeSequential(d), p = this.collapseFlatRuns(f), m = p.length >= 4 ? p : d.length >= 4 ? d : t;
		return this.ensureClosed(m.length ? m : t);
	}
	computeSpan(e) {
		if (!e.length) return {
			lon: 0,
			lat: 0
		};
		let t = Infinity, n = -Infinity, r = Infinity, i = -Infinity;
		for (let [a, o] of e) t = Math.min(t, a), n = Math.max(n, a), r = Math.min(r, o), i = Math.max(i, o);
		return {
			lon: n - t,
			lat: i - r
		};
	}
	buildFullWidthViewportFeature(e) {
		let t = this.coerceRing(e.geometry?.coordinates?.[0]);
		if (t.length < 4) return null;
		let n = this.lastCenter?.[0] ?? t[0][0] ?? 0, r = this.sampleViewportLongitudeRange(n)?.width, i = this.estimateViewportWidthDeg(t, n);
		if (Math.max(r ?? 0, i) < 345) return null;
		let a = this.normalizeViewportBounds(e), o = a ? this.coerceRing(a.geometry.coordinates?.[0]) : [];
		if (!o.length) return null;
		let s = o.map(([, e]) => e), c = this.maxViewportLat(), l = Math.max(-c, Math.min(...s)), u = Math.min(c, Math.max(...s));
		if (!Number.isFinite(l) || !Number.isFinite(u) || u < l) return null;
		let d = -179.999, f = 179.999, p = [
			[d, l],
			[d, u],
			[f, u],
			[f, l],
			[d, l]
		];
		return {
			type: "Feature",
			properties: e.properties ?? {},
			geometry: {
				type: "Polygon",
				coordinates: [p]
			}
		};
	}
	buildWideViewportFeature(e) {
		let t = this.coerceRing(e.geometry?.coordinates?.[0]);
		if (t.length < 4) return null;
		let n = this.lastCenter?.[0] ?? t[0][0] ?? 0, r = this.sampleViewportLongitudeRange(n), i = r?.width, a = this.estimateViewportWidthDeg(t, n), o = Math.max(i ?? 0, a);
		if (o <= 170 || o >= 345) return null;
		let s = this.normalizeViewportBounds(e);
		if (!s) return null;
		let c = this.coerceRing(s.geometry.coordinates?.[0]);
		if (!c.length || this.hasSelfIntersection(c)) return null;
		if (r && r.width > 170 && r.width < 345) {
			let t = c.map(([, e]) => e), n = this.maxViewportLat(), i = Math.max(-n, Math.min(...t)), a = Math.min(n, Math.max(...t));
			if (Number.isFinite(i) && Number.isFinite(a) && a >= i) {
				let t = [
					[r.minLon, i],
					[r.minLon, a],
					[r.maxLon, a],
					[r.maxLon, i],
					[r.minLon, i]
				];
				return {
					type: "Feature",
					properties: e.properties ?? {},
					geometry: {
						type: "Polygon",
						coordinates: [t]
					}
				};
			}
		}
		return s;
	}
	estimateViewportWidthFromScreenSamples(e) {
		if (!this.adapter) return null;
		let t = p(this)?.mapElement;
		if (!t) return null;
		let n = t.clientWidth, r = t.clientHeight;
		if (!Number.isFinite(n) || !Number.isFinite(r) || n <= 0 || r <= 0) return null;
		let i = this.sampleViewportLongitudeRange(e);
		return i && i.width > 0 ? i.width : null;
	}
	sampleViewportLongitudeRange(e) {
		if (!this.adapter || !this.adapter.store.getState().mapLoaded) return null;
		let t = p(this)?.mapElement;
		if (!t) return null;
		let n = t.clientWidth, r = t.clientHeight;
		if (!Number.isFinite(n) || !Number.isFinite(r) || n <= 0 || r <= 0) return null;
		let i = [
			.12,
			.32,
			.5,
			.68,
			.88
		], a = Array.from({ length: 21 }, (e, t) => t / 20), o = Infinity, s = -Infinity, c = !1;
		for (let t of i) {
			let i = [];
			for (let e of a) {
				let a = n * e, o = r * t, s = this.adapter.unproject([a, o]);
				!s || !Number.isFinite(s[0]) || Math.abs(s[1]) > 85.05 || i.push(s[0]);
			}
			if (i.length < 2) continue;
			let l = i.map((t) => this.normalizeLngAround(t, e)), u = this.unwrapLongitudeSeries(l), d = Math.min(...u), f = Math.max(...u);
			Number.isFinite(d) && Number.isFinite(f) && (o = Math.min(o, d), s = Math.max(s, f), c = !0);
		}
		return !c || !Number.isFinite(o) || !Number.isFinite(s) ? null : {
			minLon: o,
			maxLon: s,
			width: Math.max(0, s - o)
		};
	}
	unwrapLongitudeSeries(e) {
		if (!e.length) return [];
		let t = [e[0]], n = 0;
		for (let r = 1; r < e.length; r++) {
			let i = e[r - 1], a = e[r], o = a - i;
			o < -180 ? n += 360 : o > 180 && (n -= 360), t.push(a + n);
		}
		return t;
	}
	estimateViewportWidthDeg(e, t) {
		if (e.length < 3) return 0;
		let n = e.map(([e]) => this.normalizeLngAround(e, t));
		return Math.max(...n) - Math.min(...n);
	}
	hasSelfIntersection(e) {
		if (e.length < 4) return !1;
		let t = this.ensureClosed(e), n = t.length, r = (e, t, n, r) => {
			let i = (e, t, n) => (t[0] - e[0]) * (n[1] - e[1]) - (t[1] - e[1]) * (n[0] - e[0]), a = i(e, t, n), o = i(e, t, r), s = i(n, r, e), c = i(n, r, t);
			return a === 0 && o === 0 && s === 0 && c === 0 ? !1 : a * o < 0 && s * c < 0;
		};
		for (let e = 0; e < n - 1; e++) {
			let i = t[e], a = t[e + 1];
			for (let o = e + 2; o < n - 1; o++) {
				if (e === 0 && o === n - 2) continue;
				let s = t[o], c = t[o + 1];
				if (r(i, a, s, c)) return !0;
			}
		}
		return !1;
	}
	unwrapLongitudes(e, t = 0) {
		if (!e.length) return [];
		let n = [[this.normalizeLngAround(e[0][0], t), e[0][1]]];
		for (let r = 1; r < e.length; r++) {
			let i = n[r - 1][0], a = this.normalizeLngAround(e[r][0], t), o = this.resolveDeltaWithAnchor(i, a, t);
			n.push([i + o, e[r][1]]);
		}
		return n;
	}
	resolveDeltaWithAnchor(e, t, n) {
		let r = this.shortestDelta(e, t), i = r > 0 ? r - 360 : r + 360, a = e + r / 2, o = e + i / 2, s = Math.abs(a - n);
		return Math.abs(o - n) + 1e-6 < s ? i : r;
	}
	normalizeLngAround(e, t) {
		let n = this.normalizeLng(e);
		return n + Math.round((t - n) / 360) * 360;
	}
	shortestDelta(e, t) {
		return (t - e + 540) % 360 - 180;
	}
	rewrapContinuousLongitudes(e) {
		if (!e.length) return e;
		let t = [], n = this.normalizeLng(e[0][0]);
		t.push([n, e[0][1]]);
		for (let r = 1; r < e.length; r++) {
			let i = e[r][0], a = this.normalizeLng(i), o = this.shortestDelta(n, a), s = n + o;
			t.push([s, e[r][1]]), n = s;
		}
		let r = Math.round(t[0][0] / 360) * 360;
		return t.map(([e, t]) => [e - r, t]);
	}
	limitLongitudeSpan(e, t) {
		if (!e.length || !Number.isFinite(t) || t <= 0) return e;
		let n = this.unwrapLongitudes(e);
		if (this.computeSpan(n).lon <= t) return e;
		let r = (Math.min(...n.map(([e]) => e)) + Math.max(...n.map(([e]) => e))) / 2, i = t / 2, a = n.map(([e, t]) => [Math.max(r - i, Math.min(r + i, e)), t]);
		return this.rewrapContinuousLongitudes(a);
	}
	dedupeSequential(e) {
		let t = [];
		for (let n of e) {
			let e = t[t.length - 1];
			(!e || e[0] !== n[0] || e[1] !== n[1]) && t.push(n);
		}
		return t;
	}
	collapseFlatRuns(e) {
		if (e.length < 3) return e;
		let t = [e[0], e[1]];
		for (let n = 2; n < e.length; n++) {
			let r = t[t.length - 2], i = t[t.length - 1], a = e[n], o = r[1] === i[1] && i[1] === a[1], s = r[0] === i[0] && i[0] === a[0];
			o || s ? t[t.length - 1] = a : t.push(a);
		}
		return t;
	}
	normalizeLng(e) {
		return ((e + 180) % 360 + 360) % 360 - 180;
	}
	clampLat(e) {
		let t = this.maxViewportLat();
		return Math.max(-t, Math.min(t, e));
	}
	ensureClosed(e) {
		if (e.length === 0) return [];
		let t = e[0], n = e[e.length - 1];
		return t[0] === n[0] && t[1] === n[1] ? e : [...e, t];
	}
	coerceRing(e) {
		if (!e) return [];
		let t = [];
		for (let n of e) {
			if (!Array.isArray(n) || n.length < 2) continue;
			let [e, r] = n;
			!Number.isFinite(e) || !Number.isFinite(r) || t.push([e, r]);
		}
		return t;
	}
	sanitizeCoord(e) {
		let [t, n] = e;
		return !Number.isFinite(t) || !Number.isFinite(n) ? null : (n = this.clampLat(n), t = this.normalizeLng(t), [t, n]);
	}
	clampZoom(e) {
		return Math.min(ct, Math.max(st, e));
	}
	getInsetBounds() {
		if (this.lastCenter === null || this.lastZoom === null) return null;
		let e = this.insetContainer;
		if (!e) return null;
		let t = e.clientWidth, n = e.clientHeight;
		if (t <= 0 || n <= 0) return null;
		let [r, i] = this.lastCenter, a = 360 / (256 * 2 ** this.lastZoom), o = a / (Math.cos(i * Math.PI / 180) || 1e-6), s = t / 2 * o, c = n / 2 * a;
		return {
			minLng: r - s,
			maxLng: r + s,
			minLat: Math.max(-85.05112878, i - c),
			maxLat: Math.min(lt, i + c)
		};
	}
	clipAgainstPlane(e, t, n) {
		if (e.length === 0) return [];
		let r = [];
		for (let i = 0; i < e.length; i++) {
			let a = e[i], o = e[(i + e.length - 1) % e.length], s = t(a), c = t(o);
			s ? (c || r.push(n(o, a)), r.push(a)) : c && r.push(n(o, a));
		}
		return r;
	}
	clipRingToAabb(e, t, n, r, i) {
		let a = (e, t, n) => [e[0] + (t[0] - e[0]) * n, e[1] + (t[1] - e[1]) * n], o = (e, t, n) => (n - e[0]) / (t[0] - e[0]), s = (e, t, n) => (n - e[1]) / (t[1] - e[1]), c = e;
		return c = this.clipAgainstPlane(c, (e) => e[0] >= t, (e, n) => a(e, n, o(e, n, t))), c = this.clipAgainstPlane(c, (e) => e[0] <= r, (e, t) => a(e, t, o(e, t, r))), c = this.clipAgainstPlane(c, (e) => e[1] >= n, (e, t) => a(e, t, s(e, t, n))), c = this.clipAgainstPlane(c, (e) => e[1] <= i, (e, t) => a(e, t, s(e, t, i))), c;
	}
	resolveViewState(e) {
		if (e <= 0) return {
			mapZoom: 0,
			scale: this.baseScale
		};
		if (e <= dt) return {
			mapZoom: 0,
			scale: this.baseScale + (1 - this.baseScale) * (e / dt)
		};
		let t = e - dt;
		return {
			mapZoom: this.clampZoom(t),
			scale: 1
		};
	}
	render() {
		return o`
      <!-- One labelled picture to assistive technology. The engine inside
           labels its own canvas like the main map's ("Map", a landmark), so
           left exposed the page would carry two identical map landmarks, and
           nothing in the overview can be operated anyway (the sub-map is
           created non-interactive). \`inert\` rather than aria-hidden: Leaflet
           makes its container focusable, and a hidden element must not be
           reachable with Tab. -->
      <div class="inset-map-frame ${this._collapsed ? "hidden" : ""}" tabindex=${this.minimizable ? "0" : "-1"}
        role="img" aria-label="Overview map">
        <div class="inset-map" inert></div>
      </div>
      ${this.minimizable ? o`
        <div class="toggle-btn">
          <sl-icon-button
            name=${this._collapsed ? "arrows-angle-expand" : "arrows-angle-contract"}
            label=${this._collapsed ? "Expand overview map" : "Collapse overview map"}
            @click=${() => {
			this._collapsed = !this._collapsed;
		}}>
          </sl-icon-button>
        </div>
      ` : ""}
    `;
	}
};
h([e({
	type: Number,
	attribute: "zoom-offset"
})], X.prototype, "zoomOffset", void 0), h([e({
	type: String,
	attribute: "style-url"
})], X.prototype, "styleUrl", void 0), h([e({
	type: String,
	attribute: "background-layer"
})], X.prototype, "backgroundLayer", void 0), h([e({
	type: Number,
	attribute: "base-scale"
})], X.prototype, "baseScale", void 0), h([e({
	type: Boolean,
	attribute: "minimizable"
})], X.prototype, "minimizable", void 0), h([e({
	type: Boolean,
	reflect: !0,
	attribute: "collapsed"
})], X.prototype, "_collapsed", void 0), X = h([a("webmapx-inset-map")], X);
//#endregion
//#region src/components/webmapx-active-adapter.ts
var Z = class extends g {
	constructor(...e) {
		super(...e), this.adapterName = "—", this.engineVersion = "";
	}
	static {
		this.styles = n`
        :host { display: inline-block; }
        .badge {
            display: inline-flex;
            align-items: center;
            gap: var(--webmapx-space-xs, 0.4rem);
            padding: var(--webmapx-space-xs, 0.2rem) var(--webmapx-space-sm, 0.6rem);
            border: 1px solid var(--color-border, #d5dce3);
            background: var(--color-background-secondary, #f4f6f8);
            color: var(--color-text-primary, #16202a);
            font-size: 0.8rem;
            border-radius: var(--webmapx-radius-xs, 3px);
            white-space: nowrap;
        }
        .dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: var(--color-primary, #2b6c8f);
        }
    `;
	}
	onStateChanged() {}
	onMapAttached(e) {
		this.adapterName = ke(e.engineId);
		let t = e.engineVersion?.split(".");
		this.engineVersion = t ? `${t[0]}.${t[1]}` : "";
	}
	onMapDetached() {
		this.adapterName = "—", this.engineVersion = "";
	}
	render() {
		return o`
            <span class="badge">
                <span class="dot"></span>
                ${this.adapterName}${this.engineVersion ? ` ${this.engineVersion}` : ""}
            </span>
        `;
	}
};
h([r()], Z.prototype, "adapterName", void 0), h([r()], Z.prototype, "engineVersion", void 0), Z = h([a("webmapx-active-adapter")], Z);
//#endregion
//#region src/components/webmapx-toolbox-tool.ts
var Q = class extends g {
	constructor(...e) {
		super(...e), this.toolId = "toolbox", this.activeSubToolId = null, this.searchQuery = "", this.showSearch = !1, this.entries = [];
	}
	get toolTip() {
		return this.entries.find((e) => e.id === this.activeSubToolId)?.element?.toolTip ?? "";
	}
	static {
		this.styles = [me, n`
    :host {
      display: block;
    }

    .toolbox-header {
      display: flex;
      flex-direction: column;
      gap: 4px;
      padding: 4px;
      border-bottom: 1px solid var(--color-border-light, #e2e7ec);
    }

    .toolbox-scroll {
      display: flex;
      flex-direction: row;
      overflow-x: auto;
      gap: 2px;
      scroll-behavior: smooth;
      -webkit-overflow-scrolling: touch;
      scrollbar-width: thin;
    }

    .tool-btn {
      flex: 0 0 auto;
      min-width: var(--sl-input-height-medium);
    }

    .tool-btn[hidden] {
      display: none;
    }

    sl-input.search-input {
      --sl-input-height-medium: 28px;
      --sl-input-font-size-medium: var(--sl-font-size-small);
    }

    .tool-content-area {
      overflow: auto;
    }

    .tool-content-area ::slotted(*) {
      display: none;
    }

    .tool-content-area ::slotted([data-toolbox-active]) {
      display: block;
    }
  `];
	}
	connectedCallback() {
		super.connectedCallback(), this.indexEntries();
	}
	disconnectedCallback() {
		this.resizeObserver?.disconnect(), super.disconnectedCallback();
	}
	firstUpdated() {
		this.checkOverflow(), this.resizeObserver = new ResizeObserver(() => this.checkOverflow()), this.scrollEl && this.resizeObserver.observe(this.scrollEl);
	}
	indexEntries() {
		this.entries = [];
		for (let e of Array.from(this.children)) {
			let t = e, n = t.getAttribute("tool-id") ?? t.getAttribute("name") ?? t.toolId ?? null;
			if (!n) continue;
			let r = t.getAttribute("label") ?? n, i = (t.getAttribute("toolbox-keywords") ?? "").split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);
			i.push(r.toLowerCase(), n.toLowerCase());
			let a = t.getAttribute("toolbox-icon") ?? t.getAttribute("icon-name"), o = t.getAttribute("toolbox-icon-src"), s = a || o ? {
				name: a ?? void 0,
				src: o ?? void 0
			} : void 0;
			this.entries.push({
				id: n,
				label: r,
				icon: s,
				keywords: i,
				element: t
			}), t.hidden = !0, t.inert = !0;
		}
	}
	checkOverflow() {
		if (!this.scrollEl) return;
		let e = this.scrollEl.scrollWidth > this.scrollEl.clientWidth + 2;
		e !== this.showSearch && (this.showSearch = e);
	}
	get filteredEntries() {
		let e = this.searchQuery.trim().toLowerCase();
		return e ? this.entries.filter((t) => t.keywords.some((t) => t.includes(e))) : this.entries;
	}
	activateSubTool(e) {
		if (this.activeSubToolId === e) {
			this.deactivateSubTool();
			return;
		}
		if (this.activeSubToolId) {
			let e = this.entries.find((e) => e.id === this.activeSubToolId);
			e && (e.element.removeAttribute("data-toolbox-active"), e.element.hidden = !0, e.element.inert = !0, typeof e.element.deactivate == "function" && e.element.deactivate());
		}
		this.activeSubToolId = e;
		let t = this.entries.find((t) => t.id === e);
		t && (t.element.setAttribute("data-toolbox-active", ""), t.element.hidden = !1, t.element.inert = !1, typeof t.element.activate == "function" && t.element.activate());
	}
	deactivateSubTool() {
		if (this.activeSubToolId) {
			let e = this.entries.find((e) => e.id === this.activeSubToolId);
			e && (e.element.removeAttribute("data-toolbox-active"), e.element.hidden = !0, e.element.inert = !0, typeof e.element.deactivate == "function" && e.element.deactivate());
		}
		this.activeSubToolId = null;
	}
	activate() {
		this.indexEntries();
	}
	deactivate() {
		this.deactivateSubTool();
	}
	onStateChanged(e) {}
	handleSearchInput(e) {
		this.searchQuery = e.target.value, this.requestUpdate();
	}
	renderIcon(e, t) {
		if (e) {
			let n = typeof e == "string" ? { name: e } : e;
			return o`
        <sl-icon name=${n.name ?? ""} library=${n.library ?? "default"} src=${n.src ?? ""} aria-hidden="true"></sl-icon>
        <span style="position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0">${t}</span>
      `;
		}
		return o`${t}`;
	}
	render() {
		let e = this.filteredEntries;
		return o`
      <div class="tool-content">
        <div class="toolbox-header">
          <div class="toolbox-scroll" @scroll=${() => this.checkOverflow()}>
            ${this.entries.map((t) => {
			let n = e.includes(t), r = this.activeSubToolId === t.id;
			return o`
                <sl-tooltip content=${t.label} placement="bottom">
                  <sl-button
                    class="tool-btn"
                    size="medium"
                    variant=${r ? "primary" : "default"}
                    ?hidden=${!n}
                    @click=${() => this.activateSubTool(t.id)}
                  >
                    ${this.renderIcon(t.icon, t.label)}
                  </sl-button>
                </sl-tooltip>
              `;
		})}
          </div>
          ${this.showSearch ? o`
            <sl-input
              class="search-input"
              size="small"
              aria-label="Search tools"
              placeholder="Search tools…"
              clearable
              .value=${this.searchQuery}
              @sl-input=${this.handleSearchInput}
              @sl-clear=${() => {
			this.searchQuery = "", this.requestUpdate();
		}}
            >
              <sl-icon name="search" slot="prefix"></sl-icon>
            </sl-input>
          ` : ""}
        </div>
        <div class="tool-content-area">
          <slot @slotchange=${() => this.indexEntries()}></slot>
        </div>
      </div>
    `;
	}
};
h([r()], Q.prototype, "activeSubToolId", void 0), h([r()], Q.prototype, "searchQuery", void 0), h([r()], Q.prototype, "showSearch", void 0), h([r()], Q.prototype, "entries", void 0), h([i(".toolbox-scroll")], Q.prototype, "scrollEl", void 0), Q = h([a("webmapx-toolbox-tool")], Q);
//#endregion
//#region src/components/webmapx-menu-tool.ts
var mt = 8, $ = class extends g {
	constructor(...e) {
		super(...e), this.toolId = "menu", this.activeSubToolId = null, this.searchQuery = "", this.currentPath = "", this.entries = [], this.groups = [], this.focusedIndex = 0, this.pendingRowFocus = !1;
	}
	get toolTip() {
		return this.entries.find((e) => e.id === this.activeSubToolId)?.element?.toolTip ?? "";
	}
	static {
		this.styles = [me, n`
    :host {
      display: block;
    }

    .menu-header {
      display: flex;
      flex-direction: column;
      gap: 4px;
      padding: 4px;
      border-bottom: 1px solid var(--color-border-light, #e2e7ec);
    }

    .breadcrumb {
      display: flex;
      align-items: center;
      gap: 4px;
      min-height: 24px;
      font-size: var(--sl-font-size-small);
      color: var(--color-text-secondary, #5a6773);
    }

    .breadcrumb .crumb-text {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .back-btn::part(base) {
      padding-left: 4px;
      padding-right: 4px;
    }

    .menu-list {
      display: flex;
      flex-direction: column;
      padding: 4px;
      gap: 2px;
      overflow: auto;
    }

    .menu-row {
      display: flex;
      align-items: center;
      gap: 8px;
      width: 100%;
      padding: 6px 8px;
      border: 0;
      border-radius: var(--webmapx-radius-sm, 4px);
      background: transparent;
      font: inherit;
      font-size: var(--sl-font-size-small);
      color: var(--color-text-primary, #16202a);
      text-align: left;
      cursor: pointer;
    }

    .menu-row:hover,
    .menu-row:focus-visible {
      background: var(--color-background-secondary, #f4f6f8);
    }

    .menu-row .row-label {
      flex: 1;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .menu-row .row-path {
      font-size: var(--sl-font-size-x-small);
      color: var(--color-text-muted, #6b7681);
      white-space: nowrap;
    }

    .menu-row sl-icon {
      flex: 0 0 auto;
      font-size: 1.1em;
    }

    .empty {
      padding: 8px;
      font-size: var(--sl-font-size-small);
      color: var(--color-text-muted, #6b7681);
    }

    sl-input.search-input {
      --sl-input-height-medium: 28px;
      --sl-input-font-size-medium: var(--sl-font-size-small);
    }

    .tool-content-area {
      overflow: auto;
    }

    /* Only hide the inactive ones — the active sub-tool keeps whatever display
       its own :host rule sets (several tools are flex containers). */
    .tool-content-area ::slotted(:not([data-menu-active])) {
      display: none;
    }
  `];
	}
	connectedCallback() {
		super.connectedCallback(), this.readGroups(), this.indexEntries();
	}
	readGroups() {
		let e = this.getAttribute("groups");
		if (!e) {
			this.groups = [];
			return;
		}
		try {
			let t = JSON.parse(e);
			this.groups = Array.isArray(t) ? t : [];
		} catch {
			console.warn("[webmapx] webmapx-menu-tool: invalid \"groups\" JSON — ignored"), this.groups = [];
		}
	}
	indexEntries() {
		let e = [];
		for (let t of Array.from(this.children)) {
			let n = t, r = n.getAttribute("tool-id") ?? n.getAttribute("name") ?? n.toolId ?? null;
			if (!r) continue;
			let i = n.getAttribute("label") ?? r, a = (n.getAttribute("menu-keywords") ?? n.getAttribute("toolbox-keywords") ?? "").split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);
			a.push(i.toLowerCase(), r.toLowerCase());
			let o = n.getAttribute("menu-icon") ?? n.getAttribute("toolbox-icon") ?? n.getAttribute("icon-name"), s = n.getAttribute("menu-icon-src"), c = o || s ? {
				name: o ?? void 0,
				src: s ?? void 0
			} : void 0, l = (n.getAttribute("menu-path") ?? "").replace(/^\/+|\/+$/g, "");
			e.push({
				id: r,
				label: i,
				icon: c,
				keywords: a,
				path: l,
				element: n
			}), r !== this.activeSubToolId && (n.hidden = !0, n.inert = !0);
		}
		this.entries = e;
	}
	childGroups(e) {
		let t = e ? `${e}/` : "", n = /* @__PURE__ */ new Set(), r = [];
		for (let e of this.entries) {
			if (!e.path.startsWith(t)) continue;
			let i = e.path.slice(t.length);
			if (!i) continue;
			let a = t + i.split("/")[0];
			if (n.has(a)) continue;
			n.add(a);
			let o = this.groups.find((e) => e.path === a);
			r.push(o ?? {
				path: a,
				label: a.split("/").pop() ?? a
			});
		}
		return r;
	}
	childEntries(e) {
		return this.entries.filter((t) => t.path === e);
	}
	get searchResults() {
		let e = this.searchQuery.trim().toLowerCase();
		return e ? this.entries.filter((t) => t.keywords.some((t) => t.includes(e))) : [];
	}
	groupLabel(e) {
		return this.groups.find((t) => t.path === e)?.label ?? e.split("/").pop() ?? e;
	}
	pathLabel(e) {
		if (!e) return "";
		let t = e.split("/");
		return t.map((e, n) => this.groupLabel(t.slice(0, n + 1).join("/"))).join(" / ");
	}
	setSubToolActive(e, t) {
		if (!e) return;
		let n = e.element;
		t ? n.setAttribute("data-menu-active", "") : n.removeAttribute("data-menu-active"), n.hidden = !t, n.inert = !t;
		let r = n[t ? "activate" : "deactivate"];
		typeof r == "function" && r.call(n);
	}
	activateSubTool(e) {
		if (this.activeSubToolId === e) {
			this.deactivateSubTool();
			return;
		}
		this.activeSubToolId && this.setSubToolActive(this.entries.find((e) => e.id === this.activeSubToolId), !1);
		let t = this.entries.find((t) => t.id === e);
		this.activeSubToolId = e, t && (this.currentPath = t.path), this.searchQuery = "", this.setSubToolActive(t, !0);
	}
	deactivateSubTool() {
		this.activeSubToolId && this.setSubToolActive(this.entries.find((e) => e.id === this.activeSubToolId), !1), this.activeSubToolId = null;
	}
	goBack() {
		if (this.activeSubToolId) {
			this.deactivateSubTool();
			return;
		}
		let e = this.currentPath.split("/").filter(Boolean), t = e.pop();
		this.currentPath = e.join("/");
		let n = t ? this.childGroups(this.currentPath).findIndex((e) => e.path === t || e.path.endsWith(`/${t}`)) : -1;
		this.focusRow(Math.max(0, n));
	}
	enterGroup(e) {
		this.currentPath = e, this.focusRow(0);
	}
	get rowCount() {
		return this.searchQuery.trim() ? this.searchResults.length : this.childGroups(this.currentPath).length + this.childEntries(this.currentPath).length;
	}
	get rowElements() {
		return Array.from(this.renderRoot.querySelectorAll(".menu-row"));
	}
	focusRow(e) {
		let t = this.rowCount;
		if (t === 0) {
			this.focusedIndex = 0;
			return;
		}
		this.focusedIndex = (e % t + t) % t, this.pendingRowFocus = !0;
	}
	updated() {
		this.pendingRowFocus && (this.pendingRowFocus = !1, this.rowElements[this.focusedIndex]?.focus());
	}
	handleListKeydown(e) {
		let t = this.rowElements;
		if (t.length === 0) return;
		let n = t.findIndex((e) => e === this.renderRoot.activeElement), r = n === -1 ? this.focusedIndex : n;
		switch (e.key) {
			case "ArrowDown":
				this.focusRow(r + 1);
				break;
			case "ArrowUp":
				this.focusRow(r - 1);
				break;
			case "Home":
				this.focusRow(0);
				break;
			case "End":
				this.focusRow(t.length - 1);
				break;
			case "ArrowRight": {
				if (this.searchQuery.trim()) return;
				let e = this.childGroups(this.currentPath)[r];
				if (!e) return;
				this.enterGroup(e.path);
				break;
			}
			case "ArrowLeft":
				if (this.currentPath === "") return;
				this.goBack();
				break;
			default: return;
		}
		e.preventDefault(), e.stopPropagation();
	}
	handleSearchKeydown(e) {
		e.key === "ArrowDown" && (e.preventDefault(), this.focusRow(0));
	}
	activate() {
		this.readGroups(), this.indexEntries();
	}
	deactivate() {
		this.deactivateSubTool(), this.currentPath = "", this.searchQuery = "";
	}
	onStateChanged(e) {}
	handleSearchInput(e) {
		this.searchQuery = e.target.value, this.focusedIndex = 0;
	}
	renderIcon(e) {
		let n = typeof e == "string" ? { name: e } : e;
		return !n?.name && !n?.src ? t : o`<sl-icon
      name=${n.name ?? ""}
      library=${n.library ?? "default"}
      src=${n.src ?? ""}
      aria-hidden="true"
    ></sl-icon>`;
	}
	renderRow(e, n, r, i, a = {}) {
		return o`
      <button
        type="button"
        class="menu-row"
        role="menuitem"
        aria-haspopup=${a.submenu ? "true" : t}
        tabindex=${e === this.focusedIndex ? 0 : -1}
        @focus=${() => {
			this.focusedIndex = e;
		}}
        @click=${i}
      >
        ${this.renderIcon(r)}
        <span class="row-label">${n}</span>
        ${a.sublabel ? o`<span class="row-path">${a.sublabel}</span>` : t}
        ${a.trailing ?? t}
      </button>
    `;
	}
	renderList() {
		if (this.searchQuery.trim()) {
			let e = this.searchResults;
			return e.length === 0 ? o`<div class="empty">No matching tools</div>` : o`
        <div class="menu-list" role="menu" @keydown=${this.handleListKeydown}>
          ${e.map((e, t) => this.renderRow(t, e.label, e.icon, () => this.activateSubTool(e.id), { sublabel: this.pathLabel(e.path) }))}
        </div>
      `;
		}
		let e = this.childGroups(this.currentPath), t = this.childEntries(this.currentPath);
		return e.length === 0 && t.length === 0 ? o`<div class="empty">No tools configured</div>` : o`
      <div class="menu-list" role="menu" @keydown=${this.handleListKeydown}>
        ${e.map((e, t) => this.renderRow(t, e.label, e.icon ?? "folder", () => this.enterGroup(e.path), {
			trailing: o`<sl-icon name="chevron-right" aria-hidden="true"></sl-icon>`,
			submenu: !0
		}))}
        ${t.map((t, n) => this.renderRow(e.length + n, t.label, t.icon, () => this.activateSubTool(t.id)))}
      </div>
    `;
	}
	render() {
		let e = this.entries.find((e) => e.id === this.activeSubToolId), n = !e && this.entries.length >= mt, r = [this.pathLabel(this.currentPath), e?.label].filter(Boolean).join(" / ");
		return o`
      <div class="tool-content">
        <div class="menu-header">
          ${e || this.currentPath !== "" ? o`
            <div class="breadcrumb">
              <sl-button class="back-btn" size="small" variant="text" @click=${() => this.goBack()}>
                <sl-icon name="chevron-left" aria-hidden="true"></sl-icon>
                Back
              </sl-button>
              <span class="crumb-text">${r}</span>
            </div>
          ` : t}
          ${n ? o`
            <sl-input
              class="search-input"
              size="small"
              aria-label="Search tools"
              placeholder="Search tools…"
              clearable
              .value=${this.searchQuery}
              @sl-input=${this.handleSearchInput}
              @keydown=${this.handleSearchKeydown}
              @sl-clear=${() => {
			this.searchQuery = "", this.focusedIndex = 0;
		}}
            >
              <sl-icon name="search" slot="prefix"></sl-icon>
            </sl-input>
          ` : t}
        </div>
        ${e ? t : this.renderList()}
        <div class="tool-content-area">
          <slot @slotchange=${() => this.indexEntries()}></slot>
        </div>
      </div>
    `;
	}
};
h([r()], $.prototype, "activeSubToolId", void 0), h([r()], $.prototype, "searchQuery", void 0), h([r()], $.prototype, "currentPath", void 0), h([r()], $.prototype, "entries", void 0), h([r()], $.prototype, "groups", void 0), h([r()], $.prototype, "focusedIndex", void 0), $ = h([a("webmapx-menu-tool")], $);
//#endregion
