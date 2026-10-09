import"./vendor-shoelace-BiEeFWil.js";import{g as e,h as t,p as n,x as r,y as i}from"./vendor-lit-DP8NDNGT.js";import{Cr as a,Tr as o,ii as s,ni as c,ri as l,ti as u,wr as d}from"./webmapx-shared-BPzFIcB6.js";import{a as f,o as p,r as m,t as h}from"./decorate-C4V0gXFQ.js";import{t as g}from"./control-surface-styles-WAx9bflO.js";import{t as _}from"./form-label-styles-CUvG5W-2.js";import{t as v}from"./section-heading-styles-BsMEM1VW.js";var y=[{value:`atlas`,label:`Atlas`,hint:`Soft and roomy — public maps`},{value:`folio`,label:`Folio`,hint:`Flat and precise — page embeds`},{value:`console`,label:`Console`,hint:`Dense — daily operational use`},{value:`classroom`,label:`Classroom`,hint:`Coloured tool tiles — learners`}],b=[{value:`auto`,label:`Match system`},{value:`light`,label:`Light`},{value:`dark`,label:`Dark`}],x=class extends e{constructor(...e){super(...e),this.uiStyle=`atlas`,this.uiTheme=`auto`,this.apiKey=``,this.appearanceListener=()=>this.syncAppearance(),this.currentAdapter=f,this.availableAdapters=[]}static{this.styles=[_,g,v,r`
        :host {
            display: block;
            padding: 1rem;
            box-sizing: border-box;
        }

        h3 {
            margin: 0 0 0.75rem 0;
        }

        sl-input {
            margin-top: 0.5rem;
        }

        sl-select {
            margin-top: 0.5rem;
        }

    `]}connectedCallback(){super.connectedCallback(),this.loadSettings(),document.addEventListener(u,this.appearanceListener)}disconnectedCallback(){super.disconnectedCallback(),document.removeEventListener(u,this.appearanceListener)}syncAppearance(){let{style:e,theme:t}=l();this.uiStyle=e,this.uiTheme=t}loadSettings(){this.syncAppearance(),this.apiKey=localStorage.getItem(`webmapx-api-key`)||``,this.availableAdapters=p().filter(e=>![`ol`,`l`,`c`].includes(e)),this.currentAdapter=this.detectCurrentAdapter()}getMapStorageKey(e,t){return a(e.id,t,`${location.pathname}${location.search}`)}detectCurrentAdapter(){let e=m(this);if(!e)return f;let t=this.getMapStorageKey(e,`adapter`),n=o({explicitAdapter:e.getAttribute(`adapter`)??e.getAttribute(`type`),savedAdapter:t?localStorage.getItem(t):null,configuredAdapter:e.mapConfig?.type??null,defaultAdapter:f});return this.availableAdapters.includes(n)?n:f}emitAppearanceChange(){this.dispatchEvent(new CustomEvent(`theme-change`,{detail:{style:this.uiStyle,theme:this.uiTheme,resolvedTheme:s(this.uiTheme)},bubbles:!0,composed:!0}))}handleStyleChange(e){let t=e.target;this.uiStyle=t.value,c({style:this.uiStyle}),this.emitAppearanceChange()}handleThemeChange(e){let t=e.target;this.uiTheme=t.value,c({theme:this.uiTheme}),this.emitAppearanceChange()}handleApiKeyChange(e){let t=e.target;this.apiKey=t.value,localStorage.setItem(`webmapx-api-key`,this.apiKey),this.dispatchEvent(new CustomEvent(`apikey-change`,{detail:{apiKey:this.apiKey},bubbles:!0,composed:!0}))}handleAdapterChange(e){let t=e.target,n=d(t.value);if(!n||n===this.currentAdapter)return;let r=m(this);if(!r){console.error(`[webmapx-settings] No <webmapx-map> found for adapter switching.`);return}let i=this.getMapStorageKey(r,`adapter`);r.saveState?.(),i&&localStorage.setItem(i,n),window.location.reload()}formatAdapterName(e){return{maplibre:`MapLibre GL`,openlayers:`OpenLayers`,leaflet:`Leaflet`,cesium:`Cesium`}[e]||e}render(){return i`
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
                            ${this.formatAdapterName(e)}
                        </sl-option>
                    `)}
                </sl-select>
            </section>

            <section class="panel-section">
                <h3 class="section-heading">Appearance</h3>
                <sl-select
                    size="small"
                    label="Style"
                    help-text=${y.find(e=>e.value===this.uiStyle)?.hint??``}
                    value=${this.uiStyle}
                    @sl-change=${this.handleStyleChange}
                >
                    ${y.map(e=>i`
                        <sl-option value=${e.value}>${e.label}</sl-option>
                    `)}
                </sl-select>
                <sl-select
                    size="small"
                    label="Theme"
                    value=${this.uiTheme}
                    @sl-change=${this.handleThemeChange}
                >
                    ${b.map(e=>i`
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
        `}};h([n()],x.prototype,`uiStyle`,void 0),h([n()],x.prototype,`uiTheme`,void 0),h([n()],x.prototype,`apiKey`,void 0),h([n()],x.prototype,`currentAdapter`,void 0),h([n()],x.prototype,`availableAdapters`,void 0),x=h([t(`webmapx-settings`)],x);export{x as WebmapxSettings};