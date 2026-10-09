import"./vendor-shoelace-BiEeFWil.js";import{g as e,h as t,p as n,x as r,y as i}from"./vendor-lit-DP8NDNGT.js";import{Cr as a,Tr as o,wr as s}from"./webmapx-shared-AhBMPANj.js";import{a as c,o as l,r as u,t as d}from"./decorate-BQu4xszH.js";import{t as f}from"./control-surface-styles-WAx9bflO.js";import{t as p}from"./form-label-styles-CUvG5W-2.js";import{t as m}from"./section-heading-styles-BsMEM1VW.js";var h=[{value:`atlas`,label:`Atlas`,hint:`Soft and roomy — public maps`},{value:`folio`,label:`Folio`,hint:`Flat and precise — page embeds`},{value:`console`,label:`Console`,hint:`Dense — daily operational use`}],g=[{value:`auto`,label:`Match system`},{value:`light`,label:`Light`},{value:`dark`,label:`Dark`}],_=`webmapx-style`,v=`webmapx-theme`,y={light:{style:`atlas`,theme:`light`},dark:{style:`atlas`,theme:`dark`},compact:{style:`console`,theme:`light`},glossy:{style:`atlas`,theme:`light`}},b=class extends e{constructor(...e){super(...e),this.uiStyle=`atlas`,this.uiTheme=`auto`,this.apiKey=``,this.systemDark=null,this.systemDarkHandler=null,this.currentAdapter=c,this.availableAdapters=[]}static{this.styles=[p,f,m,r`
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

    `]}connectedCallback(){super.connectedCallback(),this.loadSettings(),this.systemDark=window.matchMedia(`(prefers-color-scheme: dark)`),this.systemDarkHandler=()=>{this.uiTheme===`auto`&&this.applyAppearance()},this.systemDark.addEventListener(`change`,this.systemDarkHandler)}disconnectedCallback(){super.disconnectedCallback(),this.systemDark&&this.systemDarkHandler&&this.systemDark.removeEventListener(`change`,this.systemDarkHandler),this.systemDark=null,this.systemDarkHandler=null}loadSettings(){let e=localStorage.getItem(_),t=localStorage.getItem(v),n=e?y[e]:void 0;n?(this.uiStyle=n.style,this.uiTheme=t??n.theme):(this.uiStyle=h.some(t=>t.value===e)?e:`atlas`,this.uiTheme=g.some(e=>e.value===t)?t:`auto`),this.applyAppearance(),this.apiKey=localStorage.getItem(`webmapx-api-key`)||``,this.availableAdapters=l().filter(e=>![`ol`,`l`,`c`].includes(e)),this.currentAdapter=this.detectCurrentAdapter()}getMapStorageKey(e,t){return a(e.id,t,`${location.pathname}${location.search}`)}detectCurrentAdapter(){let e=u(this);if(!e)return c;let t=this.getMapStorageKey(e,`adapter`),n=o({explicitAdapter:e.getAttribute(`adapter`)??e.getAttribute(`type`),savedAdapter:t?localStorage.getItem(t):null,configuredAdapter:e.mapConfig?.type??null,defaultAdapter:c});return this.availableAdapters.includes(n)?n:c}resolvedTheme(){return this.uiTheme===`auto`?this.systemDark?.matches??window.matchMedia(`(prefers-color-scheme: dark)`).matches?`dark`:`light`:this.uiTheme}applyAppearance(){let e=h.find(e=>e.value===this.uiStyle)??h[0],t=this.resolvedTheme(),n=document.documentElement;n.setAttribute(`data-theme`,t),n.classList.toggle(`sl-theme-dark`,t===`dark`),n.setAttribute(`data-style`,e.value),localStorage.setItem(_,e.value),localStorage.setItem(v,this.uiTheme)}emitAppearanceChange(){this.dispatchEvent(new CustomEvent(`theme-change`,{detail:{style:this.uiStyle,theme:this.uiTheme,resolvedTheme:this.resolvedTheme()},bubbles:!0,composed:!0}))}handleStyleChange(e){let t=e.target;this.uiStyle=t.value,this.applyAppearance(),this.emitAppearanceChange()}handleThemeChange(e){let t=e.target;this.uiTheme=t.value,this.applyAppearance(),this.emitAppearanceChange()}handleApiKeyChange(e){let t=e.target;this.apiKey=t.value,localStorage.setItem(`webmapx-api-key`,this.apiKey),this.dispatchEvent(new CustomEvent(`apikey-change`,{detail:{apiKey:this.apiKey},bubbles:!0,composed:!0}))}handleAdapterChange(e){let t=e.target,n=s(t.value);if(!n||n===this.currentAdapter)return;let r=u(this);if(!r){console.error(`[webmapx-settings] No <webmapx-map> found for adapter switching.`);return}let i=this.getMapStorageKey(r,`adapter`);r.saveState?.(),i&&localStorage.setItem(i,n),window.location.reload()}formatAdapterName(e){return{maplibre:`MapLibre GL`,openlayers:`OpenLayers`,leaflet:`Leaflet`,cesium:`Cesium`}[e]||e}render(){return i`
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
                    help-text=${h.find(e=>e.value===this.uiStyle)?.hint??``}
                    value=${this.uiStyle}
                    @sl-change=${this.handleStyleChange}
                >
                    ${h.map(e=>i`
                        <sl-option value=${e.value}>${e.label}</sl-option>
                    `)}
                </sl-select>
                <sl-select
                    size="small"
                    label="Theme"
                    value=${this.uiTheme}
                    @sl-change=${this.handleThemeChange}
                >
                    ${g.map(e=>i`
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
        `}};d([n()],b.prototype,`uiStyle`,void 0),d([n()],b.prototype,`uiTheme`,void 0),d([n()],b.prototype,`apiKey`,void 0),d([n()],b.prototype,`currentAdapter`,void 0),d([n()],b.prototype,`availableAdapters`,void 0),b=d([t(`webmapx-settings`)],b);export{b as WebmapxSettings};