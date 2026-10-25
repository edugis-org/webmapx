import"./vendor-shoelace-CEoRvBMR.js";import{g as e,h as t,p as n,x as r,y as i}from"./vendor-lit-DP8NDNGT.js";import{Dr as a,Or as o,ai as s,ii as c,kr as l,oi as u,si as d}from"./webmapx-shared-X-MgrlSg.js";import{a as f,o as p,r as m,t as h}from"./decorate-BQ2eaeZV.js";import{t as g}from"./control-surface-styles-WAx9bflO.js";import{n as _}from"./info-toggle-Pj_88gxd.js";import{t as v}from"./form-label-styles-2ZYFAdeB.js";import{t as y}from"./engine-labels-D8kFwjGz.js";import{t as b}from"./help-text-styles-DMkkN2Q2.js";import{t as x}from"./section-heading-styles-CS9D7Lbw.js";var S=[{value:`atlas`,label:`Atlas`,hint:`Soft and roomy — public maps`},{value:`folio`,label:`Folio`,hint:`Flat and precise — page embeds`},{value:`console`,label:`Console`,hint:`Dense — daily operational use`},{value:`classroom`,label:`Classroom`,hint:`Coloured tool tiles — learners`}],C=[{value:`auto`,label:`Match system`},{value:`light`,label:`Light`},{value:`dark`,label:`Dark`}],w=class extends e{constructor(...e){super(...e),this.uiStyle=`atlas`,this.uiTheme=`auto`,this.apiKey=``,this.appearanceListener=()=>this.syncAppearance(),this.currentAdapter=f,this.availableAdapters=[]}static{this.styles=[v,b,g,x,r`
        :host {
            display: block;
            padding: var(--webmapx-tool-padding, 1rem);
            box-sizing: border-box;
        }

        /* 12px between fields, 8px under a section heading. */
        .panel-section > * {
            margin: 0;
        }

        .panel-section > * + * {
            margin-top: var(--webmapx-space-md, 0.75rem);
        }

        .panel-section > .section-heading + * {
            margin-top: var(--webmapx-space-sm, 0.5rem);
        }

    `]}connectedCallback(){super.connectedCallback(),this.loadSettings(),document.addEventListener(c,this.appearanceListener)}disconnectedCallback(){super.disconnectedCallback(),document.removeEventListener(c,this.appearanceListener)}syncAppearance(){let{style:e,theme:t}=u();this.uiStyle=e,this.uiTheme=t}loadSettings(){this.syncAppearance(),this.apiKey=localStorage.getItem(`webmapx-api-key`)||``,this.availableAdapters=p().filter(e=>![`ol`,`l`,`c`].includes(e)),this.currentAdapter=this.detectCurrentAdapter()}getMapStorageKey(e,t){return a(e.id,t,`${location.pathname}${location.search}`)}detectCurrentAdapter(){let e=m(this);if(!e)return f;let t=this.getMapStorageKey(e,`adapter`),n=l({explicitAdapter:e.getAttribute(`adapter`)??e.getAttribute(`type`),savedAdapter:t?localStorage.getItem(t):null,configuredAdapter:e.mapConfig?.type??null,defaultAdapter:f});return this.availableAdapters.includes(n)?n:f}emitAppearanceChange(){this.dispatchEvent(new CustomEvent(`theme-change`,{detail:{style:this.uiStyle,theme:this.uiTheme,resolvedTheme:d(this.uiTheme)},bubbles:!0,composed:!0}))}handleStyleChange(e){let t=e.target;this.uiStyle=t.value,s({style:this.uiStyle}),this.emitAppearanceChange()}handleThemeChange(e){let t=e.target;this.uiTheme=t.value,s({theme:this.uiTheme}),this.emitAppearanceChange()}handleApiKeyChange(e){let t=e.target;this.apiKey=t.value,localStorage.setItem(`webmapx-api-key`,this.apiKey),this.dispatchEvent(new CustomEvent(`apikey-change`,{detail:{apiKey:this.apiKey},bubbles:!0,composed:!0}))}handleAdapterChange(e){let t=e.target,n=o(t.value);if(!n||n===this.currentAdapter)return;let r=m(this);if(!r){console.error(`[webmapx-settings] No <webmapx-map> found for adapter switching.`);return}let i=this.getMapStorageKey(r,`adapter`);r.saveState?.(),i&&localStorage.setItem(i,n),window.location.reload()}render(){return i`
            <section class="panel-section">
                <h3 class="section-heading">Map Engine</h3>
                <sl-select
                    size="small"
                    label="Adapter"
                    value=${this.currentAdapter}
                    @sl-change=${this.handleAdapterChange}
                >
                    ${this.availableAdapters.map(e=>i`
                        <sl-option value=${e}>
                            ${y(e)}
                        </sl-option>
                    `)}
                </sl-select>
            </section>

            <section class="panel-section">
                <h3 class="section-heading">Appearance</h3>
                <div class="field-with-info">
                <sl-select
                    size="small"
                    label="Style"
                    value=${this.uiStyle}
                    @sl-change=${this.handleStyleChange}
                >
                    ${S.map(e=>i`
                        <sl-option value=${e.value}>${e.label}</sl-option>
                    `)}
                </sl-select>
                ${_(`Style`,i`${S.map(e=>i`<div><b>${e.label}</b>: ${e.hint.charAt(0).toLowerCase()}${e.hint.slice(1)}</div>`)}`)}
                </div>
                <sl-select
                    size="small"
                    label="Theme"
                    value=${this.uiTheme}
                    @sl-change=${this.handleThemeChange}
                >
                    ${C.map(e=>i`
                        <sl-option value=${e.value}>${e.label}</sl-option>
                    `)}
                </sl-select>
            </section>

            <section class="panel-section">
                <h3 class="section-heading">API Configuration</h3>
                <sl-input
                    size="small"
                    label="API Key"
                    type="password"
                    password-toggle
                    value=${this.apiKey}
                    @sl-input=${this.handleApiKeyChange}
                    placeholder="Enter your API key"
                ></sl-input>
            </section>
        `}};h([n()],w.prototype,`uiStyle`,void 0),h([n()],w.prototype,`uiTheme`,void 0),h([n()],w.prototype,`apiKey`,void 0),h([n()],w.prototype,`currentAdapter`,void 0),h([n()],w.prototype,`availableAdapters`,void 0),w=h([t(`webmapx-settings`)],w);export{w as WebmapxSettings};