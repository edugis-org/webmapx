import { a as e, c as t, h as n, i as r, n as i, o as a, p as o } from "./decorators-d8E4nZJy.js";
import { t as s } from "./decorate-CjQrowRB.js";
import { t as c } from "./webmapx-modal-tool-BYZX-Eb9.js";
import { a as l, i as u, o as d, s as f } from "./directive-helpers-Debt3Tx3.js";
import { n as p, r as m, t as h } from "./chunk.NYIIDP5N-gftugmWL.js";
import { t as ee } from "./chunk.6CTB5ZDJ-DjZrBd6Y.js";
import "./alert-Dzf1BSLu.js";
import { t as te } from "./chunk.3RPBFEDE-DBlOq5Pm.js";
import "./button-DE9ytwxI.js";
import { n as ne, t as re } from "./live-BR4apkFB.js";
import { t as ie } from "./chunk.SI4ACBFK-CdJVQctt.js";
import "./icon-Qf3FyAAL.js";
import "./spinner-DHQKbDmr.js";
import { a as g, n as _, o as v, s as y, t as b } from "./data-colors-DygU5zOY.js";
import "./range-CWKTX2-C.js";
import { t as ae } from "./radio-group-DcrmsMH6.js";
import "./radio-button-a8zeRuOI.js";
import "./option-C8qYanYH.js";
import { t as oe } from "./style-map-BsuxqdiR.js";
import { n as se, t as ce } from "./dom-focus-utils-DlRk2798.js";
//#region src/utils/sam/sam-models.ts
var le = "https://huggingface.co/{repo}/resolve/main/", ue = "models/{repo}/";
function x(e, t) {
	return t || (e.mirrorOnly ? ue : le);
}
function S(e) {
	return {
		encoder: [`onnx/vision_encoder${e}.onnx`, `onnx/vision_encoder${e}.onnx_data`],
		decoder: [`onnx/prompt_encoder_mask_decoder${e}.onnx`, `onnx/prompt_encoder_mask_decoder${e}.onnx_data`]
	};
}
var C = [
	{
		id: "slimsam-77",
		label: "SlimSAM",
		family: "sam",
		repo: "Xenova/slimsam-77-uniform",
		default: {
			files: {
				encoder: ["onnx/vision_encoder_quantized.onnx"],
				decoder: ["onnx/prompt_encoder_mask_decoder_quantized.onnx"]
			},
			sizeMB: 14
		},
		cpuFriendly: !0
	},
	{
		id: "sam2.1-tiny",
		label: "SAM 2.1 Tiny",
		family: "sam2",
		repo: "onnx-community/sam2.1-hiera-tiny-ONNX",
		default: {
			files: S(""),
			sizeMB: 156
		},
		fp16: {
			files: S("_fp16"),
			sizeMB: 78
		}
	},
	{
		id: "sam2.1-small",
		label: "SAM 2.1 Small",
		family: "sam2",
		repo: "onnx-community/sam2.1-hiera-small-ONNX",
		default: {
			files: S(""),
			sizeMB: 184
		},
		fp16: {
			files: S("_fp16"),
			sizeMB: 92
		}
	},
	{
		id: "sam2.1-base-plus",
		label: "SAM 2.1 Base+",
		family: "sam2",
		repo: "onnx-community/sam2.1-hiera-base-plus-ONNX",
		default: {
			files: S(""),
			sizeMB: 328
		},
		fp16: {
			files: S("_fp16"),
			sizeMB: 164
		}
	},
	{
		id: "sam2.1-large",
		label: "SAM 2.1 Large",
		family: "sam2",
		repo: "onnx-community/sam2.1-hiera-large-ONNX",
		default: {
			files: S(""),
			sizeMB: 912
		},
		fp16: {
			files: S("_fp16"),
			sizeMB: 457
		}
	}
];
function w(e, t) {
	let n = e.includes("{repo}") ? e.replace("{repo}", t) : `${e.replace(/\/?$/, "/")}${t}/`;
	return n.endsWith("/") ? n : `${n}/`;
}
function de(e, t, n, r = (e) => e) {
	let i = n && e.fp16 ? e.fp16 : e.default, a = r(w(t, e.repo)), o = (e) => new URL(e, a).toString();
	return {
		id: `${e.id}${i === e.default ? "" : ":fp16"}`,
		family: e.family,
		encoder: i.files.encoder.map(o),
		decoder: i.files.decoder.map(o),
		sizeMB: i.sizeMB
	};
}
function fe(e) {
	if (!Array.isArray(e) || e.length === 0) return [...C];
	let t = [];
	for (let n of e) if (typeof n == "string") {
		let e = C.find((e) => e.id === n);
		e ? t.push(e) : console.warn(`[segment] unknown model "${n}" ignored`);
	} else if (n && typeof n == "object" && typeof n.id == "string") {
		let e = C.find((e) => e.id === n.id);
		t.push({
			...e,
			...n
		});
	}
	return t.length ? t : [...C];
}
var T = [{
	id: "remoteclip",
	label: "RemoteCLIP (aerial)",
	repo: "webmapx/remoteclip-vit-b-32",
	mirrorOnly: !0,
	vision: "onnx/vision_model_quantized.onnx",
	text: "onnx/text_model_quantized.onnx",
	tokenizer: "tokenizer.json",
	tokenizerConfig: "tokenizer_config.json",
	sizeMB: 156,
	template: "a satellite image of {label}."
}, {
	id: "clip",
	label: "CLIP (general)",
	repo: "Xenova/clip-vit-base-patch32",
	vision: "onnx/vision_model_quantized.onnx",
	text: "onnx/text_model_quantized.onnx",
	tokenizer: "tokenizer.json",
	tokenizerConfig: "tokenizer_config.json",
	sizeMB: 156,
	template: "an aerial photograph of {label}."
}];
function pe(e, t, n = (e) => e) {
	let r = n(w(t, e.repo)), i = (e) => new URL(e, r).toString();
	return {
		id: e.id,
		vision: i(e.vision),
		text: i(e.text),
		tokenizer: i(e.tokenizer),
		tokenizerConfig: i(e.tokenizerConfig),
		sizeMB: e.sizeMB,
		template: e.template
	};
}
var me = [
	"rooftops",
	"a street",
	"trees",
	"grass",
	"water",
	"a parking lot",
	"cars",
	"a field"
];
//#endregion
//#region src/utils/sam/mask-to-polygon.ts
function he(e) {
	let t = 0;
	for (let n = 0, r = e.length - 1; n < e.length; r = n++) t += (e[r][0] - e[n][0]) * (e[r][1] + e[n][1]);
	return t / 2;
}
function ge(e) {
	return e.map((e, t) => {
		let n = he(e) > 0;
		return t === 0 === n ? e : [...e].reverse();
	});
}
//#endregion
//#region src/utils/sam/sam-worker-client.ts
var E = class extends Error {
	constructor() {
		super("Cancelled."), this.name = "SamCancelledError";
	}
}, D = null, O = /* @__PURE__ */ new Map(), k = 0, A = Promise.resolve();
function j(e) {
	for (let t of O.values()) t.reject(e);
	O.clear();
}
function M() {
	if (D) return D;
	let e = new Worker(new URL(
		/* @vite-ignore */
		"" + new URL("assets/sam.worker-4yrpR9qo.js", import.meta.url).href,
		"" + import.meta.url
	), { type: "module" });
	return e.onmessage = (e) => {
		let t = e.data, n = O.get(t.id);
		if (n) {
			if (t.status === "progress") {
				n.onProgress?.(t.loaded, t.total, t.phase);
				return;
			}
			O.delete(t.id), t.status === "ok" ? n.resolve(t.result) : n.reject(t.cancelled ? new E() : Error(t.message));
		}
	}, e.onerror = (e) => {
		j(Error(e.message || "The segmentation worker crashed.")), D = null;
	}, D = e, e;
}
function N(e, t = {}) {
	let n = () => new Promise((n, r) => {
		let i = ++k;
		O.set(i, {
			resolve: n,
			reject: r,
			onProgress: t.onProgress
		}), M().postMessage({
			...e,
			id: i
		}, t.transfer ?? []);
	}), r = A.then(n, n);
	return A = r.catch(() => void 0), r;
}
function P() {
	return N({ op: "probe" });
}
function F(e) {
	return N({
		op: "cached",
		urls: [...e.encoder, ...e.decoder]
	});
}
function I(e, t, n) {
	return N({
		op: "load",
		model: e,
		backend: t
	}, { onProgress: n });
}
function L(e) {
	return N({
		op: "encode",
		image: e
	}, { transfer: [e] });
}
function _e(e, t = {}) {
	return N({
		op: "decode",
		prompt: e,
		outline: t
	});
}
function ve(e) {
	return N({
		op: "outline",
		outline: e
	});
}
function ye(e, t) {
	return N({
		op: "everything",
		options: e
	}, { onProgress: t });
}
function be(e, t, n, r) {
	return N({
		op: "name",
		clip: e,
		labels: t,
		backend: n
	}, { onProgress: r });
}
function xe(e) {
	return N({
		op: "cached",
		urls: [
			e.vision,
			e.text,
			e.tokenizer,
			e.tokenizerConfig
		]
	});
}
function Se(e) {
	return N({
		op: "regroup",
		k: e
	});
}
function Ce() {
	D?.postMessage({
		id: 0,
		op: "cancel"
	});
}
//#endregion
//#region src/utils/sam/clip-vocabulary.ts
var we = /* @__PURE__ */ "dense residential area.medium residential area.sparse residential area.buildings.a commercial area.an industrial area.a business park.a town centre.a church.a school.a farm.a farmyard.greenhouses.storage tanks.a construction site.solar panels.a mobile home park.a road.a highway.an intersection.an overpass.a viaduct.a bridge.a railway.a railway station.a parking lot.an airport.a runway.a harbor.a marina.farmland.agricultural fields.a meadow.grassland.pasture.an orchard.allotment gardens.bare land.a sand pit.a dike.a forest.trees.a tree row.a park.a golf course.a cemetery.shrubland.water.a river.a canal.a ditch.a lake.a pond.reeds.a marsh.a beach.a sports field.a playground.a stadium.a tennis court.a baseball field.a square".split(".");
//#endregion
//#region node_modules/@shoelace-style/shoelace/dist/chunks/chunk.DQT3C4BS.js
ae.define("sl-button-group");
//#endregion
//#region node_modules/@shoelace-style/shoelace/dist/chunks/chunk.GXC456DW.js
var Te = n`
  :host {
    --height: 1rem;
    --track-color: var(--sl-color-neutral-200);
    --indicator-color: var(--sl-color-primary-600);
    --label-color: var(--sl-color-neutral-0);

    display: block;
  }

  .progress-bar {
    position: relative;
    background-color: var(--track-color);
    height: var(--height);
    border-radius: var(--sl-border-radius-pill);
    box-shadow: inset var(--sl-shadow-small);
    overflow: hidden;
  }

  .progress-bar__indicator {
    height: 100%;
    font-family: var(--sl-font-sans);
    font-size: 12px;
    font-weight: var(--sl-font-weight-normal);
    background-color: var(--indicator-color);
    color: var(--label-color);
    text-align: center;
    line-height: var(--height);
    white-space: nowrap;
    overflow: hidden;
    transition:
      400ms width,
      400ms background-color;
    user-select: none;
    -webkit-user-select: none;
  }

  /* Indeterminate */
  .progress-bar--indeterminate .progress-bar__indicator {
    position: absolute;
    animation: indeterminate 2.5s infinite cubic-bezier(0.37, 0, 0.63, 1);
  }

  .progress-bar--indeterminate.progress-bar--rtl .progress-bar__indicator {
    animation-name: indeterminate-rtl;
  }

  @media (forced-colors: active) {
    .progress-bar {
      outline: solid 1px SelectedItem;
      background-color: var(--sl-color-neutral-0);
    }

    .progress-bar__indicator {
      outline: solid 1px SelectedItem;
      background-color: SelectedItem;
    }
  }

  @keyframes indeterminate {
    0% {
      left: -50%;
      width: 50%;
    }
    75%,
    100% {
      left: 100%;
      width: 50%;
    }
  }

  @keyframes indeterminate-rtl {
    0% {
      right: -50%;
      width: 50%;
    }
    75%,
    100% {
      right: 100%;
      width: 50%;
    }
  }
`, R = class extends u {
	constructor() {
		super(...arguments), this.localize = new ee(this), this.value = 0, this.indeterminate = !1, this.label = "";
	}
	render() {
		return o`
      <div
        part="base"
        class=${m({
			"progress-bar": !0,
			"progress-bar--indeterminate": this.indeterminate,
			"progress-bar--rtl": this.localize.dir() === "rtl"
		})}
        role="progressbar"
        title=${p(this.title)}
        aria-label=${this.label.length > 0 ? this.label : this.localize.term("progress")}
        aria-valuemin="0"
        aria-valuemax="100"
        aria-valuenow=${this.indeterminate ? 0 : this.value}
      >
        <div part="indicator" class="progress-bar__indicator" style=${oe({ width: `${this.value}%` })}>
          ${this.indeterminate ? "" : o` <slot part="label" class="progress-bar__label"></slot> `}
        </div>
      </div>
    `;
	}
};
//#endregion
//#region node_modules/@shoelace-style/shoelace/dist/chunks/chunk.3XI76F3K.js
R.styles = [l, Te], f([e({
	type: Number,
	reflect: !0
})], R.prototype, "value", 2), f([e({
	type: Boolean,
	reflect: !0
})], R.prototype, "indeterminate", 2), f([e()], R.prototype, "label", 2), R.define("sl-progress-bar");
//#endregion
//#region node_modules/@shoelace-style/shoelace/dist/chunks/chunk.6KE6SBMU.js
var Ee = n`
  :host {
    display: block;
  }

  .textarea {
    display: grid;
    align-items: center;
    position: relative;
    width: 100%;
    font-family: var(--sl-input-font-family);
    font-weight: var(--sl-input-font-weight);
    line-height: var(--sl-line-height-normal);
    letter-spacing: var(--sl-input-letter-spacing);
    vertical-align: middle;
    transition:
      var(--sl-transition-fast) color,
      var(--sl-transition-fast) border,
      var(--sl-transition-fast) box-shadow,
      var(--sl-transition-fast) background-color;
    cursor: text;
  }

  /* Standard textareas */
  .textarea--standard {
    background-color: var(--sl-input-background-color);
    border: solid var(--sl-input-border-width) var(--sl-input-border-color);
  }

  .textarea--standard:hover:not(.textarea--disabled) {
    background-color: var(--sl-input-background-color-hover);
    border-color: var(--sl-input-border-color-hover);
  }
  .textarea--standard:hover:not(.textarea--disabled) .textarea__control {
    color: var(--sl-input-color-hover);
  }

  .textarea--standard.textarea--focused:not(.textarea--disabled) {
    background-color: var(--sl-input-background-color-focus);
    border-color: var(--sl-input-border-color-focus);
    color: var(--sl-input-color-focus);
    box-shadow: 0 0 0 var(--sl-focus-ring-width) var(--sl-input-focus-ring-color);
  }

  .textarea--standard.textarea--focused:not(.textarea--disabled) .textarea__control {
    color: var(--sl-input-color-focus);
  }

  .textarea--standard.textarea--disabled {
    background-color: var(--sl-input-background-color-disabled);
    border-color: var(--sl-input-border-color-disabled);
    opacity: 0.5;
    cursor: not-allowed;
  }

  .textarea__control,
  .textarea__size-adjuster {
    grid-area: 1 / 1 / 2 / 2;
  }

  .textarea__size-adjuster {
    visibility: hidden;
    pointer-events: none;
    opacity: 0;
  }

  .textarea--standard.textarea--disabled .textarea__control {
    color: var(--sl-input-color-disabled);
  }

  .textarea--standard.textarea--disabled .textarea__control::placeholder {
    color: var(--sl-input-placeholder-color-disabled);
  }

  /* Filled textareas */
  .textarea--filled {
    border: none;
    background-color: var(--sl-input-filled-background-color);
    color: var(--sl-input-color);
  }

  .textarea--filled:hover:not(.textarea--disabled) {
    background-color: var(--sl-input-filled-background-color-hover);
  }

  .textarea--filled.textarea--focused:not(.textarea--disabled) {
    background-color: var(--sl-input-filled-background-color-focus);
    outline: var(--sl-focus-ring);
    outline-offset: var(--sl-focus-ring-offset);
  }

  .textarea--filled.textarea--disabled {
    background-color: var(--sl-input-filled-background-color-disabled);
    opacity: 0.5;
    cursor: not-allowed;
  }

  .textarea__control {
    font-family: inherit;
    font-size: inherit;
    font-weight: inherit;
    line-height: 1.4;
    color: var(--sl-input-color);
    border: none;
    background: none;
    box-shadow: none;
    cursor: inherit;
    -webkit-appearance: none;
  }

  .textarea__control::-webkit-search-decoration,
  .textarea__control::-webkit-search-cancel-button,
  .textarea__control::-webkit-search-results-button,
  .textarea__control::-webkit-search-results-decoration {
    -webkit-appearance: none;
  }

  .textarea__control::placeholder {
    color: var(--sl-input-placeholder-color);
    user-select: none;
    -webkit-user-select: none;
  }

  .textarea__control:focus {
    outline: none;
  }

  /*
   * Size modifiers
   */

  .textarea--small {
    border-radius: var(--sl-input-border-radius-small);
    font-size: var(--sl-input-font-size-small);
  }

  .textarea--small .textarea__control {
    padding: 0.5em var(--sl-input-spacing-small);
  }

  .textarea--medium {
    border-radius: var(--sl-input-border-radius-medium);
    font-size: var(--sl-input-font-size-medium);
  }

  .textarea--medium .textarea__control {
    padding: 0.5em var(--sl-input-spacing-medium);
  }

  .textarea--large {
    border-radius: var(--sl-input-border-radius-large);
    font-size: var(--sl-input-font-size-large);
  }

  .textarea--large .textarea__control {
    padding: 0.5em var(--sl-input-spacing-large);
  }

  /*
   * Resize types
   */

  .textarea--resize-none .textarea__control {
    resize: none;
  }

  .textarea--resize-vertical .textarea__control {
    resize: vertical;
  }

  .textarea--resize-auto .textarea__control {
    height: auto;
    resize: none;
    overflow-y: hidden;
  }
`, z = class extends u {
	constructor() {
		super(...arguments), this.formControlController = new te(this, { assumeInteractionOn: ["sl-blur", "sl-input"] }), this.hasSlotController = new h(this, "help-text", "label"), this.hasFocus = !1, this.title = "", this.name = "", this.value = "", this.size = "medium", this.filled = !1, this.label = "", this.helpText = "", this.placeholder = "", this.rows = 4, this.resize = "vertical", this.disabled = !1, this.readonly = !1, this.form = "", this.required = !1, this.spellcheck = !0, this.defaultValue = "";
	}
	get validity() {
		return this.input.validity;
	}
	get validationMessage() {
		return this.input.validationMessage;
	}
	connectedCallback() {
		super.connectedCallback(), this.resizeObserver = new ResizeObserver(() => this.setTextareaHeight()), this.updateComplete.then(() => {
			this.setTextareaHeight(), this.resizeObserver.observe(this.input);
		});
	}
	firstUpdated() {
		this.formControlController.updateValidity();
	}
	disconnectedCallback() {
		var e;
		super.disconnectedCallback(), this.input && ((e = this.resizeObserver) == null || e.unobserve(this.input));
	}
	handleBlur() {
		this.hasFocus = !1, this.emit("sl-blur");
	}
	handleChange() {
		this.value = this.input.value, this.setTextareaHeight(), this.emit("sl-change");
	}
	handleFocus() {
		this.hasFocus = !0, this.emit("sl-focus");
	}
	handleInput() {
		this.value = this.input.value, this.emit("sl-input");
	}
	handleInvalid(e) {
		this.formControlController.setValidity(!1), this.formControlController.emitInvalidEvent(e);
	}
	setTextareaHeight() {
		this.resize === "auto" ? (this.sizeAdjuster.style.height = `${this.input.clientHeight}px`, this.input.style.height = "auto", this.input.style.height = `${this.input.scrollHeight}px`) : this.input.style.height = "";
	}
	handleDisabledChange() {
		this.formControlController.setValidity(this.disabled);
	}
	handleRowsChange() {
		this.setTextareaHeight();
	}
	async handleValueChange() {
		await this.updateComplete, this.formControlController.updateValidity(), this.setTextareaHeight();
	}
	focus(e) {
		this.input.focus(e);
	}
	blur() {
		this.input.blur();
	}
	select() {
		this.input.select();
	}
	scrollPosition(e) {
		if (e) {
			typeof e.top == "number" && (this.input.scrollTop = e.top), typeof e.left == "number" && (this.input.scrollLeft = e.left);
			return;
		}
		return {
			top: this.input.scrollTop,
			left: this.input.scrollTop
		};
	}
	setSelectionRange(e, t, n = "none") {
		this.input.setSelectionRange(e, t, n);
	}
	setRangeText(e, t, n, r = "preserve") {
		let i = t ?? this.input.selectionStart, a = n ?? this.input.selectionEnd;
		this.input.setRangeText(e, i, a, r), this.value !== this.input.value && (this.value = this.input.value, this.setTextareaHeight());
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
        class=${m({
			"form-control": !0,
			"form-control--small": this.size === "small",
			"form-control--medium": this.size === "medium",
			"form-control--large": this.size === "large",
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
            class=${m({
			textarea: !0,
			"textarea--small": this.size === "small",
			"textarea--medium": this.size === "medium",
			"textarea--large": this.size === "large",
			"textarea--standard": !this.filled,
			"textarea--filled": this.filled,
			"textarea--disabled": this.disabled,
			"textarea--focused": this.hasFocus,
			"textarea--empty": !this.value,
			"textarea--resize-none": this.resize === "none",
			"textarea--resize-vertical": this.resize === "vertical",
			"textarea--resize-auto": this.resize === "auto"
		})}
          >
            <textarea
              part="textarea"
              id="input"
              class="textarea__control"
              title=${this.title}
              name=${p(this.name)}
              .value=${re(this.value)}
              ?disabled=${this.disabled}
              ?readonly=${this.readonly}
              ?required=${this.required}
              placeholder=${p(this.placeholder)}
              rows=${p(this.rows)}
              minlength=${p(this.minlength)}
              maxlength=${p(this.maxlength)}
              autocapitalize=${p(this.autocapitalize)}
              autocorrect=${p(this.autocorrect)}
              ?autofocus=${this.autofocus}
              spellcheck=${p(this.spellcheck)}
              enterkeyhint=${p(this.enterkeyhint)}
              inputmode=${p(this.inputmode)}
              aria-describedby="help-text"
              @change=${this.handleChange}
              @input=${this.handleInput}
              @invalid=${this.handleInvalid}
              @focus=${this.handleFocus}
              @blur=${this.handleBlur}
            ></textarea>
            <!-- This "adjuster" exists to prevent layout shifting. https://github.com/shoelace-style/shoelace/issues/2180 -->
            <div part="textarea-adjuster" class="textarea__size-adjuster" ?hidden=${this.resize !== "auto"}></div>
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
//#region node_modules/@shoelace-style/shoelace/dist/chunks/chunk.WMS2VUJ6.js
z.styles = [
	l,
	ie,
	Ee
], f([i(".textarea__control")], z.prototype, "input", 2), f([i(".textarea__size-adjuster")], z.prototype, "sizeAdjuster", 2), f([r()], z.prototype, "hasFocus", 2), f([e()], z.prototype, "title", 2), f([e()], z.prototype, "name", 2), f([e()], z.prototype, "value", 2), f([e({ reflect: !0 })], z.prototype, "size", 2), f([e({
	type: Boolean,
	reflect: !0
})], z.prototype, "filled", 2), f([e()], z.prototype, "label", 2), f([e({ attribute: "help-text" })], z.prototype, "helpText", 2), f([e()], z.prototype, "placeholder", 2), f([e({ type: Number })], z.prototype, "rows", 2), f([e()], z.prototype, "resize", 2), f([e({
	type: Boolean,
	reflect: !0
})], z.prototype, "disabled", 2), f([e({
	type: Boolean,
	reflect: !0
})], z.prototype, "readonly", 2), f([e({ reflect: !0 })], z.prototype, "form", 2), f([e({
	type: Boolean,
	reflect: !0
})], z.prototype, "required", 2), f([e({ type: Number })], z.prototype, "minlength", 2), f([e({ type: Number })], z.prototype, "maxlength", 2), f([e()], z.prototype, "autocapitalize", 2), f([e()], z.prototype, "autocorrect", 2), f([e()], z.prototype, "autocomplete", 2), f([e({ type: Boolean })], z.prototype, "autofocus", 2), f([e()], z.prototype, "enterkeyhint", 2), f([e({
	type: Boolean,
	converter: {
		fromAttribute: (e) => !(!e || e === "false"),
		toAttribute: (e) => e ? "true" : "false"
	}
})], z.prototype, "spellcheck", 2), f([e()], z.prototype, "inputmode", 2), f([ne()], z.prototype, "defaultValue", 2), f([d("disabled", { waitUntilFirstUpdate: !0 })], z.prototype, "handleDisabledChange", 1), f([d("rows", { waitUntilFirstUpdate: !0 })], z.prototype, "handleRowsChange", 1), f([d("value", { waitUntilFirstUpdate: !0 })], z.prototype, "handleValueChange", 1), z.define("sl-textarea");
//#endregion
//#region src/components/webmapx-segment-tool.ts
var De = new Set([
	"button",
	"sl-button",
	"sl-radio-button",
	"sl-select",
	"sl-option",
	"a"
]);
function Oe(e) {
	return e.composedPath().some((e) => typeof e.tagName == "string" && De.has(e.tagName.toLowerCase()));
}
var B = "webmapx-segment-preview", V = "webmapx-segment-preview-fill", H = "webmapx-segment-preview-line", U = "webmapx-segment-prompt-points", W = "webmapx-segment-everything-fill", G = "webmapx-segment-everything-line", K = [
	W,
	G,
	V,
	H,
	U
], ke = [
	{
		points: 8,
		label: "Coarse (64 prompts)"
	},
	{
		points: 16,
		label: "Normal (256 prompts)"
	},
	{
		points: 24,
		label: "Fine (576 prompts)"
	},
	{
		points: 32,
		label: "Finest (1024 prompts)"
	}
];
function Ae(e) {
	let t = ["match", ["get", "name"]];
	return e.forEach((e, n) => t.push(e, b[n % b.length])), t.push("#888888"), t;
}
function q(e) {
	return `${Math.round(e * 100)}%`;
}
function je(e, t) {
	return t.map((t, n) => ({
		label: e[n],
		p: t
	})).sort((e, t) => t.p - e.p).map((e) => `${e.label} ${q(e.p)}`).join(" · ");
}
function Me(e, t) {
	let n = new Set(t.map((e) => e.toLowerCase())), r = /* @__PURE__ */ new Map();
	for (let t of e) {
		let e = t.suggestions[0]?.word;
		e && !n.has(e.toLowerCase()) && r.set(e, (r.get(e) ?? 0) + 1);
	}
	return [...r].map(([e, t]) => ({
		word: e,
		count: t
	})).sort((e, t) => t.count - e.count);
}
function J(e) {
	return [...new Set(e.split(/[,\n]/).map((e) => e.trim()).filter(Boolean))];
}
function Y(e) {
	let t = ["match", ["get", "group"]];
	for (let n = 0; n < e; n++) t.push(n, b[n % b.length]);
	return t.push("#888888"), t;
}
var Ne = 10, X = "webmapx-segments", Z = "webmapx-segments-src", Q = 1024, $ = class extends c {
	constructor(...e) {
		super(...e), this.toolId = "segment", this.capabilities = null, this.models = [], this.modelId = "", this.cached = {}, this.loadState = "idle", this.progress = 0, this.layers = [], this.layerId = "", this.mode = "point", this.everythingDetail = 16, this.groupCount = 6, this.everythingProgress = null, this.segments = [], this.segmentStats = null, this.viewLayersKept = 0, this.colourBy = "group", this.clipId = "remoteclip", this.clipCached = {}, this.labels = [...me], this.namedWith = null, this.namingProgress = null, this.suggestedWords = [], this.points = [], this.box = null, this.preview = null, this.busy = "", this.error = null, this.kept = 0, this.granularity = "auto", this.threshold = 0, this.outlined = null, this.loadedModelKey = "", this.viewGeneration = 0, this.encodedGeneration = -1, this.encodedPixelRatio = 1, this.overlaysAdded = !1, this.resultFeatures = [], this.resultLayerAdded = !1, this.dragStart = null, this.unsubs = [], this.keyHandler = null, this.decodeRequested = !1, this.layerSignature = "", this.decodeRunning = !1, this.decodedGeneration = -1, this.outlineRequested = !1, this.outlineRunning = !1;
	}
	static {
		this.styles = n`
        :host { display: block; }
        :host(:not([active])) .tool-content { display: none; }

        .tool-content {
            padding: var(--sl-spacing-medium);
            display: flex;
            flex-direction: column;
            gap: var(--sl-spacing-small);
            font-size: var(--sl-font-size-small);
        }
        .hint {
            color: var(--color-text-secondary, #5a6773);
            font-size: var(--sl-font-size-x-small);
            line-height: 1.4;
            margin: 0;
        }
        .status {
            display: flex;
            align-items: center;
            gap: var(--sl-spacing-x-small);
            font-size: var(--sl-font-size-x-small);
            color: var(--color-text-secondary, #5a6773);
            min-height: 1.4em;
        }
        .row {
            display: flex;
            gap: var(--sl-spacing-x-small);
            align-items: center;
            flex-wrap: wrap;
        }
        .actions {
            display: flex;
            gap: var(--sl-spacing-x-small);
            justify-content: flex-end;
        }
        sl-select {
            --sl-input-height-medium: 28px;
            --sl-input-font-size-medium: var(--sl-font-size-small);
        }
        sl-alert { font-size: var(--sl-font-size-x-small); }
        sl-radio-group::part(form-control-label),
        sl-range::part(form-control-label) { font-size: var(--sl-font-size-small); }
        .swatches {
            display: flex;
            gap: 4px;
            flex-wrap: wrap;
            margin-top: var(--sl-spacing-2x-small);
        }
        .swatch {
            width: 14px;
            height: 14px;
            border-radius: 3px;
            box-shadow: inset 0 0 0 1px rgb(0 0 0 / 0.2);
        }
        .name-legend {
            display: flex;
            flex-wrap: wrap;
            gap: var(--sl-spacing-2x-small) var(--sl-spacing-small);
            font-size: var(--sl-font-size-x-small);
        }
        .name-entry {
            display: inline-flex;
            align-items: center;
            gap: 4px;
        }
        .name-entry[data-empty] { opacity: 0.5; }
        .suggestions {
            display: flex;
            flex-wrap: wrap;
            align-items: center;
            gap: var(--sl-spacing-2x-small);
        }
        .suggestion {
            font: inherit;
            font-size: var(--sl-font-size-x-small);
            color: var(--color-text-primary, inherit);
            background: var(--color-surface, transparent);
            border: 1px solid var(--color-border, #c5cdd5);
            border-radius: 999px;
            padding: 1px 8px;
            cursor: pointer;
        }
        .suggestion:hover:not(:disabled) { border-color: var(--color-primary, #0369a1); }
        .suggestion:focus-visible {
            outline: var(--webmapx-focus-ring, 2px solid #0369a1);
            outline-offset: var(--webmapx-focus-offset, 2px);
        }
        .suggestion:disabled { opacity: 0.5; cursor: default; }
        .count { color: var(--color-text-secondary, #5a6773); }
        .range-ends {
            display: flex;
            justify-content: space-between;
            font-size: var(--sl-font-size-x-small);
            color: var(--color-text-secondary, #5a6773);
        }
    `;
	}
	get section() {
		let e = this.toolsConfig;
		return e?.[this.instanceId] ?? e?.[this.toolId];
	}
	get clipModel() {
		return T.find((e) => e.id === this.clipId) ?? T[0];
	}
	get resolvedClip() {
		return pe(this.clipModel, x(this.clipModel, this.modelBaseUrl), (e) => this.resolveConfigAsset(e));
	}
	get modelBaseUrl() {
		let e = this.section?.modelBaseUrl;
		return typeof e == "string" && e ? e : void 0;
	}
	resolved(e) {
		let t = !!this.capabilities?.webgpu && !!this.capabilities.fp16;
		return de(e, x(e, this.modelBaseUrl), t, (e) => this.resolveConfigAsset(e));
	}
	get selectedModel() {
		return this.models.find((e) => e.id === this.modelId);
	}
	get backend() {
		return this.capabilities?.webgpu ? "webgpu" : "wasm";
	}
	onStateChanged(e) {
		let t = new Set([X, ...K]), n = Object.entries(e.mapLayers ?? {}).filter(([e]) => !t.has(e));
		this.layers = n.filter(([, e]) => e.visible !== !1).map(([e, t]) => ({
			id: e,
			label: String(t.label ?? e)
		})).reverse(), this.layerId && !this.layers.some((e) => e.id === this.layerId) && (this.layerId = "");
		let r = JSON.stringify(n.map(([e, t]) => [
			e,
			t.visible !== !1,
			t.transparency ?? 0
		]));
		r !== this.layerSignature && (this.layerSignature = r, this.viewGeneration++);
	}
	async onActivate() {
		this.error = null, this.listen(), this.capabilities ? this.loadState === "ready" && this.prepareMap() : await this.initialise();
	}
	onDeactivate() {
		for (let e of this.unsubs) e();
		this.unsubs = [], this.keyHandler && document.removeEventListener("keydown", this.keyHandler), this.keyHandler = null, this.clearPrompt(), this.removeOverlays(), this.adapter?.setCursor(""), this.adapter?.setPanEnabled(!0), this.adapter?.setDoubleClickZoomEnabled(!0);
	}
	async initialise() {
		this.loadState = "checking";
		try {
			this.capabilities = await P();
		} catch (e) {
			this.fail(e);
			return;
		}
		this.models = fe(this.section?.models);
		let e = this.section?.labels;
		Array.isArray(e) && e.every((e) => typeof e == "string") && e.length && (this.labels = e);
		let t = this.section?.clipModel;
		typeof t == "string" && T.some((e) => e.id === t) && (this.clipId = t);
		let n = this.section?.defaultModel, r = this.capabilities.webgpu ? "sam2.1-tiny" : "slimsam-77";
		this.modelId = [
			n,
			r,
			this.models[0]?.id
		].find((e) => typeof e == "string" && this.models.some((t) => t.id === e));
		let i = {};
		await Promise.all(this.models.map(async (e) => {
			i[e.id] = await F(this.resolved(e)).catch(() => !1);
		})), this.cached = i, this.loadState = "idle", this.cached[this.modelId] && await this.loadModel();
	}
	listen() {
		let e = this.adapter;
		!e || this.unsubs.length || (this.unsubs.push(e.events.on("click", (e) => this.handleClick(e)), e.events.on("contextmenu", (e) => this.handleContextMenu(e)), e.events.on("pointer-down", (e) => this.handlePointerDown(e)), e.events.on("pointer-move", (e) => this.handlePointerMove(e)), e.events.on("pointer-up", (e) => this.handlePointerUp(e)), e.events.on("view-change-end", () => this.handleViewChange())), this.keyHandler = (e) => this.handleKey(e), document.addEventListener("keydown", this.keyHandler));
	}
	fail(e) {
		this.error = e instanceof Error ? e.message : String(e), this.busy = "";
	}
	async loadModel() {
		let e = this.selectedModel;
		if (!e) return;
		let t = this.resolved(e), n = `${t.id}@${this.backend}`;
		if (!(n === this.loadedModelKey && this.loadState === "ready")) {
			this.error = null, this.progress = 0, this.loadState = this.cached[e.id] ? "loading" : "downloading";
			try {
				await I(t, this.backend, (e, t) => {
					this.progress = t ? e / t : 0, e >= t && (this.loadState = "loading");
				});
			} catch (e) {
				this.loadState = "error", this.fail(e);
				return;
			}
			e.id === this.modelId && (this.cached = {
				...this.cached,
				[e.id]: !0
			}, this.loadedModelKey = n, this.loadState = "ready", this.encodedGeneration = -1, this.active && this.prepareMap(), this.hasPrompt && this.requestDecode());
		}
	}
	handleModelChange(e) {
		this.modelId = e.target.value, this.loadState = "idle", this.loadedModelKey = "", this.preview = null, this.updateOverlays(), this.cached[this.modelId] && this.loadModel();
	}
	handleLayerChange(e) {
		this.layerId = e.target.value, this.viewGeneration++, this.hasPrompt && this.requestDecode();
	}
	prepareMap() {
		this.adapter?.setCursor("crosshair"), this.adapter?.setDoubleClickZoomEnabled(!1), this.adapter?.setPanEnabled(this.mode !== "box"), this.ensureOverlays();
	}
	setMode(e) {
		e !== this.mode && (this.mode = e, this.clearPrompt(), this.clearSegments(), this.loadState === "ready" && this.adapter?.setPanEnabled(e !== "box"));
	}
	get interactive() {
		return this.active && this.loadState === "ready";
	}
	get hasPrompt() {
		return this.points.length > 0 || !!this.box;
	}
	handleClick(e) {
		!this.interactive || this.mode !== "point" || this.addPoint(e.coords, !0);
	}
	handleContextMenu(e) {
		!this.interactive || this.mode !== "point" || (e.originalEvent?.preventDefault?.(), this.addPoint(e.coords, !1));
	}
	addPoint(e, t) {
		this.points = [...this.points, {
			lngLat: e,
			positive: t
		}], this.requestDecode();
	}
	handlePointerDown(e) {
		!this.interactive || this.mode !== "box" || e.button !== 0 || (this.dragStart = e.coords, this.box = null);
	}
	handlePointerMove(e) {
		this.dragStart && (this.box = [this.dragStart, e.coords], this.updateOverlays());
	}
	handlePointerUp(e) {
		if (!this.dragStart) return;
		let t = this.dragStart;
		this.dragStart = null;
		let n = this.adapter?.project(t), r = this.adapter?.project(e.coords);
		if (!n || !r || Math.abs(n[0] - r[0]) < 4 || Math.abs(n[1] - r[1]) < 4) {
			this.box = null, this.updateOverlays();
			return;
		}
		this.box = [t, e.coords], this.requestDecode();
	}
	handleViewChange() {
		this.viewGeneration++;
	}
	handleKey(e) {
		if (this.active) {
			if (e.key === "Backspace" || e.key === "z" && (e.ctrlKey || e.metaKey)) {
				if (!this.points.length || se(e)) return;
				e.preventDefault(), this.points = this.points.slice(0, -1), this.hasPrompt ? this.requestDecode() : this.clearPrompt();
				return;
			}
			e.key !== "Enter" || ce(e) || Oe(e) || (this.mode === "everything" && this.segments.length ? (e.preventDefault(), this.keepSegments()) : this.preview && (e.preventDefault(), this.keep()));
		}
	}
	requestDecode() {
		this.updateOverlays(), this.decodeRequested = !0, this.decodeRunning || this.runDecodes();
	}
	async runDecodes() {
		this.decodeRunning = !0;
		try {
			for (; this.decodeRequested;) this.decodeRequested = !1, await this.decodeOnce();
		} finally {
			this.decodeRunning = !1, this.busy = "";
		}
	}
	async ensureEncoded(e) {
		if (this.encodedGeneration === this.viewGeneration) return !0;
		if (!e.renderViewImage) throw Error("This map engine cannot render its view to an image, so it cannot be segmented. Switch to MapLibre.");
		let t = this.viewGeneration;
		this.busy = "encoding";
		let n = [X, ...K], r = await e.renderViewImage(this.layerId ? {
			include: [this.layerId],
			minLongestSide: Q
		} : {
			exclude: n,
			minLongestSide: Q
		});
		return t === this.viewGeneration ? (await L(r.image), t === this.viewGeneration ? (this.encodedGeneration = t, this.encodedPixelRatio = r.pixelRatio, !0) : !1) : (r.image.close(), !1);
	}
	async decodeOnce() {
		let e = this.adapter;
		if (!(!e || this.loadState !== "ready" || !this.hasPrompt)) {
			this.error = null;
			try {
				if (!await this.ensureEncoded(e)) {
					this.decodeRequested = !0;
					return;
				}
				let t = this.viewGeneration, n = this.encodedPixelRatio, r = (t) => {
					let [r, i] = e.project(t);
					return {
						x: r * n,
						y: i * n
					};
				}, i = { points: this.points.map((e) => ({
					...r(e.lngLat),
					positive: e.positive
				})) };
				if (this.box) {
					let e = r(this.box[0]), t = r(this.box[1]);
					i.box = {
						x0: e.x,
						y0: e.y,
						x1: t.x,
						y1: t.y
					};
				}
				this.busy = "decoding";
				let a = await _e(i, this.outlineOptions);
				if (t !== this.viewGeneration) {
					this.decodeRequested = !0;
					return;
				}
				this.decodedGeneration = t, this.showResult(e, a);
			} catch (e) {
				this.fail(e);
			}
		}
	}
	get outlineOptions() {
		return {
			granularity: this.granularity,
			threshold: this.threshold
		};
	}
	showResult(e, t) {
		this.outlined = t.polygons.length ? t.granularity : null, this.preview = this.toFeature(e, t, this.encodedPixelRatio), this.updateOverlays();
	}
	requestOutline() {
		if (!this.hasPrompt || this.decodeRunning) {
			this.hasPrompt && (this.decodeRequested = !0);
			return;
		}
		if (this.decodedGeneration !== this.viewGeneration) {
			this.requestDecode();
			return;
		}
		this.outlineRequested = !0, this.outlineRunning || this.runOutlines();
	}
	async runOutlines() {
		this.outlineRunning = !0;
		try {
			for (; this.outlineRequested;) {
				this.outlineRequested = !1;
				let e = this.adapter;
				if (!e || this.decodedGeneration !== this.viewGeneration) return;
				let t = await ve(this.outlineOptions);
				this.decodedGeneration === this.viewGeneration && this.hasPrompt && this.showResult(e, t);
			}
		} catch (e) {
			this.fail(e);
		} finally {
			this.outlineRunning = !1;
		}
	}
	handleGranularityChange(e) {
		this.granularity = e.target.value, this.requestOutline();
	}
	handleThresholdInput(e) {
		this.threshold = Number(e.target.value), this.requestOutline();
	}
	toFeature(e, t, n) {
		let r = this.toLngLat(e, t.polygons, n);
		return r.length ? {
			type: "Feature",
			properties: {
				score: Math.round(t.score * 1e3) / 1e3,
				model: this.selectedModel?.label ?? this.modelId,
				granularity: t.granularity
			},
			geometry: {
				type: "MultiPolygon",
				coordinates: r
			}
		} : null;
	}
	toLngLat(e, t, n) {
		let r = [];
		for (let i of t) {
			let t = [];
			for (let r of i) {
				let i = [];
				for (let [t, a] of r) {
					let r = e.unproject([t / n, a / n]);
					r && i.push([r[0], r[1]]);
				}
				i.length === r.length && i.length >= 4 && t.push(i);
			}
			t.length && r.push(ge(t));
		}
		return r;
	}
	async runEverything() {
		let e = this.adapter;
		if (!(!e || this.everythingProgress || this.decodeRunning)) {
			this.error = null, this.clearSegments(), this.everythingProgress = [0, this.everythingDetail ** 2];
			try {
				if (!await this.ensureEncoded(e)) throw Error("The map moved while it was being analysed. Hold it still and try again.");
				let t = this.viewGeneration;
				this.busy = "";
				let n = await ye({
					pointsPerSide: this.everythingDetail,
					k: this.groupCount
				}, (e, t) => {
					this.everythingProgress = [e, t];
				});
				if (t !== this.viewGeneration) throw Error("The map moved while it was being segmented, so the result no longer fits. Hold it still and try again.");
				let r = this.selectedModel?.label ?? this.modelId;
				this.segments = n.segments.flatMap((t, i) => {
					let a = this.toLngLat(e, t.polygons, this.encodedPixelRatio);
					return a.length ? [{
						type: "Feature",
						properties: {
							index: i,
							group: n.groups[i],
							kind: t.kind,
							score: Math.round(t.score * 1e3) / 1e3,
							model: r
						},
						geometry: {
							type: "MultiPolygon",
							coordinates: a
						}
					}] : [];
				}), this.segmentStats = n.stats, this.updateOverlays();
			} catch (e) {
				e instanceof E || this.fail(e);
			} finally {
				this.everythingProgress = null, this.busy = "";
			}
		}
	}
	cancelEverything() {
		Ce();
	}
	async handleGroupCount(e) {
		if (this.groupCount = Number(e.target.value), this.segments.length) try {
			let e = await Se(this.groupCount);
			this.segments = this.segments.map((t) => ({
				...t,
				properties: {
					...t.properties,
					group: e[Number(t.properties?.index ?? 0)]
				}
			})), this.updateOverlays();
		} catch (e) {
			this.fail(e);
		}
	}
	clearSegments() {
		this.segments = [], this.segmentStats = null, this.namedWith = null, this.suggestedWords = [], this.colourBy = "group", this.updateOverlays();
	}
	colourIndex(e) {
		if (this.colourBy === "name" && this.namedWith) {
			let t = this.namedWith.indexOf(String(e.properties?.name ?? ""));
			return t < 0 ? -1 : t;
		}
		return Number(e.properties?.group ?? 0);
	}
	async checkClipCached() {
		let e = this.clipModel, t = await xe(this.resolvedClip).catch(() => !1);
		this.clipCached = {
			...this.clipCached,
			[e.id]: t
		};
	}
	setColourBy(e) {
		this.colourBy = e, e === "name" && this.clipCached[this.clipId] === void 0 && this.checkClipCached(), this.updateOverlays();
	}
	addLabel(e) {
		this.labels.includes(e) || (this.labels = [...this.labels, e]);
	}
	handleLabelsInput(e) {
		this.labels = J(e.target.value);
	}
	async nameSegments() {
		if (!this.segments.length || this.namingProgress) return;
		let e = [...this.labels];
		if (!e.length) {
			this.error = "Give at least one name to choose from.";
			return;
		}
		this.error = null, this.namingProgress = {
			phase: "texts",
			done: 0,
			total: 1
		};
		try {
			let t = await be(this.resolvedClip, e, this.backend, (e, t, n) => {
				this.namingProgress = {
					phase: n ?? "regions",
					done: e,
					total: t
				};
			});
			this.clipCached = {
				...this.clipCached,
				[this.clipId]: !0
			}, this.segments = this.segments.map((n) => {
				let r = t[Number(n.properties?.index ?? 0)], i = Object.fromEntries((r?.suggestions ?? []).map((e, t) => [`suggestion_${t + 1}`, `${e.word} (${q(e.probability)})`]));
				return {
					...n,
					properties: {
						...n.properties,
						name: r ? e[r.label] : null,
						name_probability: r ? Math.round(r.probability * 1e3) / 1e3 : null,
						name_scores: r ? je(e, r.probabilities) : null,
						...i
					}
				};
			}), this.suggestedWords = Me(t, e), this.namedWith = e, this.colourBy = "name", this.updateOverlays();
		} catch (e) {
			e instanceof E || this.fail(e);
		} finally {
			this.namingProgress = null;
		}
	}
	async keepSegments() {
		if (!this.segments.length) return;
		let e = ++this.viewLayersKept, t = Math.max(...this.segments.map((e) => Number(e.properties?.group ?? 0))) + 1, n = this.colourBy === "name" && !!this.namedWith, r = `webmapx-segmented-view-${e}`, i = `${r}-src`, a = this.segments.map((e) => {
			let { index: t, ...n } = e.properties ?? {};
			return {
				...e,
				properties: {
					...n,
					group: Number(n.group ?? 0)
				}
			};
		});
		await this.mapHost?.addLayerRequest({
			id: r,
			type: "fill",
			source: i,
			sources: { [i]: {
				id: i,
				type: "geojson",
				data: {
					type: "FeatureCollection",
					features: a
				}
			} },
			paint: {
				"fill-color": n ? Ae(this.namedWith) : Y(t),
				"fill-opacity": .45,
				"fill-outline-color": "#ffffff"
			},
			metadata: {
				label: `Segmented view ${e}`,
				dynamic: !0,
				legendRole: "overlay",
				attributes: { translations: [...n ? [
					{
						name: "name",
						translation: "Name"
					},
					{
						name: "name_probability",
						translation: "Name certainty"
					},
					{
						name: "name_scores",
						translation: "Scores"
					},
					{
						name: "suggestion_1",
						translation: "Suggestion 1"
					},
					{
						name: "suggestion_2",
						translation: "Suggestion 2"
					},
					{
						name: "suggestion_3",
						translation: "Suggestion 3"
					}
				] : [], {
					name: "group",
					translation: "Group",
					valuemap: Array.from({ length: t }, (e, t) => ({
						value: t,
						label: `Group ${t + 1}`
					}))
				}] }
			}
		}), this.clearSegments();
	}
	clearPrompt() {
		this.points = [], this.box = null, this.dragStart = null, this.preview = null, this.outlined = null, this.decodeRequested = !1, this.updateOverlays();
	}
	async keep() {
		if (!this.preview) return;
		let e = {
			...this.preview,
			properties: {
				...this.preview.properties,
				id: this.resultFeatures.length + 1
			}
		};
		this.resultFeatures = [...this.resultFeatures, e], this.kept = this.resultFeatures.length, this.clearPrompt(), await this.writeResults();
	}
	async writeResults() {
		let e = {
			type: "FeatureCollection",
			features: this.resultFeatures
		};
		if (this.resultLayerAdded && this.store?.getState().mapLayers?.[X]) {
			this.adapter?.getSource(Z)?.setData(e);
			return;
		}
		this.resultLayerAdded && (this.resultFeatures = this.resultFeatures.slice(-1), this.kept = 1, e.features = this.resultFeatures), await this.mapHost?.addLayerRequest({
			id: X,
			type: "fill",
			source: Z,
			sources: { [Z]: {
				id: Z,
				type: "geojson",
				data: e
			} },
			paint: {
				"fill-color": v,
				"fill-opacity": .25,
				"fill-outline-color": v
			},
			metadata: {
				label: "Segments",
				dynamic: !0,
				legendRole: "overlay"
			}
		}), this.resultLayerAdded = !0;
	}
	emit(e, t) {
		this.dispatchEvent(new CustomEvent(e, {
			detail: t,
			bubbles: !0,
			composed: !0
		}));
	}
	ensureOverlays() {
		if (this.overlaysAdded) return;
		this.emit("webmapx-add-source", {
			id: B,
			config: {
				type: "geojson",
				data: {
					type: "FeatureCollection",
					features: []
				}
			}
		});
		let e = (e) => ({
			isToolLayer: !0,
			hideFromLegend: !0,
			label: e
		});
		this.emit("webmapx-add-layer", {
			id: W,
			type: "fill",
			source: B,
			metadata: e("Segmented view preview"),
			filter: [
				"==",
				["get", "role"],
				"segment"
			],
			paint: {
				"fill-color": Y(b.length),
				"fill-opacity": .45
			}
		}), this.emit("webmapx-add-layer", {
			id: G,
			type: "line",
			source: B,
			metadata: e("Segmented view outlines"),
			filter: [
				"==",
				["get", "role"],
				"segment"
			],
			paint: {
				"line-color": "#ffffff",
				"line-width": 1,
				"line-opacity": .8
			}
		}), this.emit("webmapx-add-layer", {
			id: V,
			type: "fill",
			source: B,
			metadata: e("Segment preview"),
			filter: [
				"==",
				["get", "role"],
				"mask"
			],
			paint: {
				"fill-color": v,
				"fill-opacity": .3
			}
		}), this.emit("webmapx-add-layer", {
			id: H,
			type: "line",
			source: B,
			metadata: e("Segment outline"),
			filter: [
				"in",
				["get", "role"],
				["literal", ["mask", "box"]]
			],
			paint: {
				"line-color": v,
				"line-width": 2
			}
		}), this.emit("webmapx-add-layer", {
			id: U,
			type: "circle",
			source: B,
			metadata: e("Segment prompts"),
			filter: [
				"==",
				["get", "role"],
				"point"
			],
			paint: {
				"circle-radius": 6,
				"circle-color": [
					"case",
					["get", "positive"],
					g,
					_
				],
				"circle-stroke-color": y,
				"circle-stroke-width": 2
			}
		}), this.overlaysAdded = !0, this.updateOverlays();
	}
	updateOverlays() {
		if (!this.overlaysAdded) return;
		let e = [];
		for (let t of this.segments) e.push({
			...t,
			properties: {
				role: "segment",
				group: this.colourIndex(t)
			}
		});
		if (this.preview && e.push({
			...this.preview,
			properties: { role: "mask" }
		}), this.box) {
			let [[t, n], [r, i]] = this.box;
			e.push({
				type: "Feature",
				properties: { role: "box" },
				geometry: {
					type: "LineString",
					coordinates: [
						[t, n],
						[r, n],
						[r, i],
						[t, i],
						[t, n]
					]
				}
			});
		}
		for (let t of this.points) e.push({
			type: "Feature",
			properties: {
				role: "point",
				positive: t.positive
			},
			geometry: {
				type: "Point",
				coordinates: t.lngLat
			}
		});
		this.emit("webmapx-set-source-data", {
			id: B,
			data: {
				type: "FeatureCollection",
				features: e
			}
		});
	}
	removeOverlays() {
		if (this.overlaysAdded) {
			for (let e of K) this.emit("webmapx-remove-layer", e);
			this.emit("webmapx-remove-source", B), this.overlaysAdded = !1;
		}
	}
	variantOf(e) {
		return this.capabilities?.webgpu && this.capabilities.fp16 && e.fp16 ? e.fp16 : e.default;
	}
	modelLabel(e) {
		return `${e.label} · ${this.variantOf(e).sizeMB} MB`;
	}
	modelHint(e) {
		if (!e) return t;
		let n = !this.capabilities?.webgpu && !e.cpuFriendly;
		return o`
            <p class="hint">
                ${this.cached[e.id] ? "Already downloaded." : `Downloaded once (${this.variantOf(e).sizeMB} MB) and kept by your browser.`}
                Images never leave your computer.
                ${n ? o`<br>This browser has no WebGPU, so analysing each view takes 10–30 seconds with this model; SlimSAM is quicker.` : t}
            </p>
        `;
	}
	renderModel() {
		let e = this.selectedModel, n = this.loadState === "downloading" || this.loadState === "loading" || this.loadState === "checking";
		return o`
            <sl-select
                label="Model"
                size="small"
                value=${this.modelId}
                ?disabled=${n || !this.models.length}
                @sl-change=${this.handleModelChange}
            >
                ${this.models.map((e) => o`<sl-option value=${e.id}>${this.modelLabel(e)}</sl-option>`)}
            </sl-select>
            ${this.loadState === "idle" || this.loadState === "error" ? o`
                <div class="row">
                    <sl-button size="small" variant="primary" ?disabled=${!e} @click=${() => this.loadModel()}>
                        <sl-icon slot="prefix" name=${this.cached[this.modelId] ? "play" : "download"}></sl-icon>
                        ${this.cached[this.modelId] ? "Start" : "Download and start"}
                    </sl-button>
                </div>
                ${this.modelHint(e)}
            ` : t}
            ${this.loadState === "downloading" ? o`
                <sl-progress-bar value=${Math.round(this.progress * 100)}></sl-progress-bar>
                <div class="status">Downloading ${e?.label}…</div>
            ` : t}
            ${this.loadState === "loading" || this.loadState === "checking" ? o`
                <div class="status"><sl-spinner></sl-spinner>${this.loadState === "checking" ? "Checking this browser…" : `Starting ${e?.label}…`}</div>
            ` : t}
        `;
	}
	renderSegmenting() {
		return o`
            <sl-select
                label="Segment"
                size="small"
                value=${this.layerId}
                @sl-change=${this.handleLayerChange}
            >
                <sl-option value="">The map as shown</sl-option>
                ${this.layers.map((e) => o`<sl-option value=${e.id}>${e.label}</sl-option>`)}
            </sl-select>
            <sl-button-group label="Prompt">
                <sl-button size="small" variant=${this.mode === "point" ? "primary" : "default"}
                    @click=${() => this.setMode("point")}>
                    <sl-icon slot="prefix" name="hand-index"></sl-icon>Points
                </sl-button>
                <sl-button size="small" variant=${this.mode === "box" ? "primary" : "default"}
                    @click=${() => this.setMode("box")}>
                    <sl-icon slot="prefix" name="bounding-box"></sl-icon>Box
                </sl-button>
                <sl-button size="small" variant=${this.mode === "everything" ? "primary" : "default"}
                    @click=${() => this.setMode("everything")}>
                    <sl-icon slot="prefix" name="grid-3x3"></sl-icon>All
                </sl-button>
            </sl-button-group>
            ${this.mode === "everything" ? this.renderEverything() : this.renderPrompting()}
        `;
	}
	renderEverything() {
		let e = !!this.everythingProgress, [n, r] = this.everythingProgress ?? [0, 1], i = this.segments.length ? Math.max(...this.segments.map((e) => Number(e.properties?.group ?? 0))) + 1 : 0;
		return o`
            <p class="hint">
                Divides the view into segments and colours alike those that look alike.
                SAM finds shapes, not names: the groups are unnamed.
            </p>
            <sl-select
                label="Detail"
                size="small"
                value=${String(this.everythingDetail)}
                ?disabled=${e}
                @sl-change=${(e) => {
			this.everythingDetail = Number(e.target.value);
		}}
            >
                ${ke.map((e) => o`<sl-option value=${String(e.points)}>${e.label}</sl-option>`)}
            </sl-select>
            ${e ? o`
                <sl-progress-bar value=${this.busy === "encoding" ? 0 : Math.round(n / r * 100)}></sl-progress-bar>
                <div class="row">
                    <div class="status">
                        ${this.busy === "encoding" ? o`<sl-spinner></sl-spinner>Analysing the view…` : o`Segmenting… ${n} of ${r}`}
                    </div>
                    <sl-button size="small" @click=${() => this.cancelEverything()}>Cancel</sl-button>
                </div>
            ` : o`
                <div class="actions">
                    <sl-button size="small" variant=${this.segments.length ? "default" : "primary"} @click=${() => this.runEverything()}>
                        <sl-icon slot="prefix" name="grid-3x3"></sl-icon>Segment the view
                    </sl-button>
                </div>
            `}
            ${this.segments.length && !e ? o`
                <sl-radio-group
                    label="Colour by"
                    size="small"
                    .value=${this.colourBy}
                    @sl-change=${(e) => this.setColourBy(e.target.value)}
                >
                    <sl-radio-button value="group">Look-alike</sl-radio-button>
                    <sl-radio-button value="name">Name</sl-radio-button>
                </sl-radio-group>
                ${this.colourBy === "group" ? o`
                    <div>
                        <sl-range
                            label="Groups"
                            min="2" max="12" step="1"
                            .value=${this.groupCount}
                            @sl-change=${this.handleGroupCount}
                        ></sl-range>
                        <div class="swatches">
                            ${Array.from({ length: i }, (e, t) => o`
                                <span class="swatch" style="background:${b[t % b.length]}"
                                    title="Group ${t + 1}"></span>`)}
                        </div>
                    </div>
                ` : t}
                <div class="status">
                    ${this.segments.length} segments
                    ${this.segmentStats?.filled ? o` (${this.segmentStats.filled} filling the gaps between outlines)` : t}
                </div>
                ${this.renderNaming()}
                <div class="actions">
                    <sl-button size="small" @click=${() => this.clearSegments()}>Clear</sl-button>
                    <sl-button size="small" variant="primary" @click=${() => this.keepSegments()}>
                        <sl-icon slot="prefix" name="check-lg"></sl-icon>Keep
                    </sl-button>
                </div>
            ` : t}
            ${!this.segments.length && !e && this.segmentStats ? o`<div class="status">Nothing stable enough to keep in this view.</div>` : t}
            ${this.viewLayersKept ? o`<p class="hint">${this.viewLayersKept} segmented view${this.viewLayersKept === 1 ? "" : "s"} kept as layers.</p>` : t}
        `;
	}
	renderNaming() {
		if (this.colourBy !== "name") return t;
		let e = this.namingProgress, n = !!this.namedWith && this.namedWith.join("\n") !== this.labels.join("\n"), r = /* @__PURE__ */ new Map();
		for (let e of this.segments) {
			let t = e.properties?.name;
			typeof t == "string" && r.set(t, (r.get(t) ?? 0) + 1);
		}
		let i = this.clipModel;
		return o`
            ${T.length > 1 ? o`
                <sl-select
                    label="Naming model"
                    size="small"
                    value=${this.clipId}
                    ?disabled=${!!e}
                    @sl-change=${(e) => {
			this.clipId = e.target.value, this.checkClipCached();
		}}
                >
                    ${T.map((e) => o`<sl-option value=${e.id}>${e.label} · ${e.sizeMB} MB</sl-option>`)}
                </sl-select>
            ` : t}
            <sl-textarea
                label="Names to choose from"
                size="small"
                rows="3"
                resize="auto"
                help-text="Comma or line separated, in English."
                .value=${this.labels.join(", ")}
                ?disabled=${!!e}
                @sl-change=${this.handleLabelsInput}
            ></sl-textarea>
            ${e ? o`
                <sl-progress-bar value=${Math.round(e.done / Math.max(1, e.total) * 100)}></sl-progress-bar>
                <div class="row">
                    <div class="status">
                        ${e.phase === "download" ? o`Downloading ${i.label}…` : e.phase === "regions" ? o`Looking at segment ${e.done} of ${e.total}…` : e.phase === "vocabulary" ? o`<sl-spinner></sl-spinner>Trying ${we.length} words for suggestions…` : o`<sl-spinner></sl-spinner>Starting ${i.label}…`}
                    </div>
                    <sl-button size="small" @click=${() => this.cancelEverything()}>Cancel</sl-button>
                </div>
            ` : o`
                <div class="actions">
                    <sl-button size="small" variant=${this.namedWith && !n ? "default" : "primary"} @click=${() => this.nameSegments()}>
                        <sl-icon slot="prefix" name="tags"></sl-icon>${this.namedWith ? "Name again" : "Name the segments"}
                    </sl-button>
                </div>
                ${this.clipCached[i.id] === !1 ? o`<p class="hint">The first time downloads ${i.label} (${i.sizeMB} MB), kept by your browser afterwards.</p>` : t}
            `}
            ${this.namedWith ? o`
                <div class="name-legend">
                    ${this.namedWith.map((e, t) => o`
                        <span class="name-entry" ?data-empty=${!r.get(e)}>
                            <span class="swatch" style="background:${b[t % b.length]}"></span>
                            ${e} <span class="count">${r.get(e) ?? 0}</span>
                        </span>`)}
                </div>
                ${n ? o`<p class="hint">The list has changed; name again to use it.</p>` : t}
                ${this.suggestedWords.length ? o`
                    <div class="suggestions">
                        <span class="hint">CLIP's own best word, per segment — click to add:</span>
                        ${this.suggestedWords.slice(0, Ne).map((e) => o`
                            <button
                                type="button"
                                class="suggestion"
                                ?disabled=${this.labels.includes(e.word)}
                                title=${`Best word for ${e.count} segment${e.count === 1 ? "" : "s"}; add it to the names`}
                                @click=${() => this.addLabel(e.word)}
                            >+ ${e.word} <span class="count">${e.count}</span></button>`)}
                    </div>
                ` : t}
                <p class="hint">
                    Names are CLIP's best guess from your list for each segment — it always picks one, even when none fits.
                </p>
            ` : t}
        `;
	}
	renderPrompting() {
		return o`
            <p class="hint">
                ${this.mode === "point" ? o`Click an object to outline it. Click again to add to it, right-click to leave something out.` : o`Drag a box around an object.`}
                Enter keeps the outline${this.mode === "point" ? ", Backspace undoes the last click" : ""}.
            </p>
            <sl-radio-group
                label="Outline"
                size="small"
                .value=${this.granularity}
                @sl-change=${this.handleGranularityChange}
            >
                <sl-radio-button value="auto">Auto</sl-radio-button>
                <sl-radio-button value="whole">Whole</sl-radio-button>
                <sl-radio-button value="part">Part</sl-radio-button>
                <sl-radio-button value="detail">Detail</sl-radio-button>
            </sl-radio-group>
            <div>
                <sl-range
                    label="Edge"
                    min="-2" max="2" step="0.1"
                    .value=${this.threshold}
                    .tooltipFormatter=${(e) => e === 0 ? "model boundary" : e < 0 ? "looser" : "tighter"}
                    @sl-input=${this.handleThresholdInput}
                ></sl-range>
                <div class="range-ends"><span>Looser</span><span>Tighter</span></div>
            </div>
            <div class="status">
                ${this.busy === "encoding" ? o`<sl-spinner></sl-spinner>Analysing the view…` : t}
                ${this.busy === "decoding" ? o`<sl-spinner></sl-spinner>Outlining…` : t}
                ${!this.busy && this.preview ? o`Model confidence ${Math.round(Number(this.preview.properties?.score ?? 0) * 100)}%${this.granularity === "auto" && this.outlined ? o` · ${this.outlined}` : t}` : t}
                ${!this.busy && this.hasPrompt && !this.preview ? o`Nothing found here.` : t}
            </div>
            <div class="actions">
                <sl-button size="small" ?disabled=${!this.hasPrompt} @click=${() => this.clearPrompt()}>Clear</sl-button>
                <sl-button size="small" variant="primary" ?disabled=${!this.preview} @click=${() => this.keep()}>
                    <sl-icon slot="prefix" name="check-lg"></sl-icon>Keep
                </sl-button>
            </div>
            ${this.kept ? o`<p class="hint">${this.kept} outline${this.kept === 1 ? "" : "s"} in the “Segments” layer.</p>` : t}
        `;
	}
	render() {
		return o`
            <div class="tool-content">
                ${this.renderModel()}
                ${this.loadState === "ready" ? this.renderSegmenting() : t}
                ${this.error ? o`
                    <sl-alert variant="danger" open>
                        <sl-icon slot="icon" name="exclamation-octagon"></sl-icon>
                        ${this.error}
                    </sl-alert>
                ` : t}
            </div>
        `;
	}
};
s([r()], $.prototype, "capabilities", void 0), s([r()], $.prototype, "models", void 0), s([r()], $.prototype, "modelId", void 0), s([r()], $.prototype, "cached", void 0), s([r()], $.prototype, "loadState", void 0), s([r()], $.prototype, "progress", void 0), s([r()], $.prototype, "layers", void 0), s([r()], $.prototype, "layerId", void 0), s([r()], $.prototype, "mode", void 0), s([r()], $.prototype, "everythingDetail", void 0), s([r()], $.prototype, "groupCount", void 0), s([r()], $.prototype, "everythingProgress", void 0), s([r()], $.prototype, "segments", void 0), s([r()], $.prototype, "segmentStats", void 0), s([r()], $.prototype, "viewLayersKept", void 0), s([r()], $.prototype, "colourBy", void 0), s([r()], $.prototype, "clipId", void 0), s([r()], $.prototype, "clipCached", void 0), s([r()], $.prototype, "labels", void 0), s([r()], $.prototype, "namedWith", void 0), s([r()], $.prototype, "namingProgress", void 0), s([r()], $.prototype, "suggestedWords", void 0), s([r()], $.prototype, "points", void 0), s([r()], $.prototype, "box", void 0), s([r()], $.prototype, "preview", void 0), s([r()], $.prototype, "busy", void 0), s([r()], $.prototype, "error", void 0), s([r()], $.prototype, "kept", void 0), s([r()], $.prototype, "granularity", void 0), s([r()], $.prototype, "threshold", void 0), s([r()], $.prototype, "outlined", void 0), $ = s([a("webmapx-segment-tool")], $);
//#endregion
export { $ as WebmapxSegmentTool };
