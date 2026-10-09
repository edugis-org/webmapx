import"./vendor-shoelace-BiEeFWil.js";import{_ as e,h as t,p as n,x as r,y as i}from"./vendor-lit-DP8NDNGT.js";import{j as a}from"./cesium-adapter-DCP1QrEw.js";import{t as o}from"./decorate-BQu4xszH.js";import{t as s}from"./webmapx-modal-tool-DmAqEkVJ.js";import{t as c}from"./form-label-styles-CUvG5W-2.js";import{a as l,n as u}from"./data-colors-BXVfrRzV.js";var d=`webmapx-isochrone-source`,f=`webmapx-isochrone-fill`,p=`webmapx-isochrone-line`,m=[`rgba(26, 150, 65, 0.5)`,`rgba(120, 198, 121, 0.45)`,`rgba(255, 255, 191, 0.4)`,`rgba(253, 174, 97, 0.4)`,`rgba(215, 25, 28, 0.35)`,`rgba(170, 170, 170, 0.3)`];function h(e){return m[Math.min(e,m.length-1)]}function g(e){let t=[`match`,[`get`,`contour`]];return e.forEach((e,n)=>{t.push(e,h(n))}),t.push(`rgba(0,0,0,0)`),t}var _=[{id:`openrouteservice`,label:`OpenRouteService`,modes:[{value:`driving-car`,label:`Car`,category:`car`},{value:`driving-hgv`,label:`Truck`,category:`truck`},{value:`cycling-regular`,label:`Bicycle`,category:`bicycle`},{value:`foot-walking`,label:`Foot`,category:`foot`},{value:`wheelchair`,label:`Wheelchair`,category:`wheelchair`}],attribution:`<a href="https://openrouteservice.org/" target="_blank" rel="noopener">openrouteservice.org</a> by HeiGIT | &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap contributors</a>`,keyPlaceholder:`{key-openrouteservice}`,keyAttr:`ors-api-key`,async calculate(e,t,n,r,i){if(!i)throw Error(`No OpenRouteService API key configured.`);let a=t.map(e=>n===`time`?e*60:e*1e3),o=await fetch(`https://api.openrouteservice.org/v2/isochrones/${r}`,{method:`POST`,headers:{Authorization:i,"Content-Type":`application/json`},body:JSON.stringify({locations:[[e[0],e[1]]],range:a,range_type:n})});if(!o.ok){let e=await o.json().catch(()=>({}));throw Error(e?.error?.message??`ORS ${o.status}`)}let s=await o.json(),c=[...s.features].sort((e,t)=>{let n=e.properties?.value??0;return(t.properties?.value??0)-n});return c.forEach(e=>{let t=e.properties?.value??0;e.properties.contour=n===`time`?Math.round(t/60):Math.round(t/100)/10}),{...s,features:c}}},{id:`valhalla`,label:`Valhalla (free)`,modes:[{value:`auto`,label:`Car`,category:`car`},{value:`truck`,label:`Truck`,category:`truck`},{value:`motorcycle`,label:`Motorcycle`,category:`motorcycle`},{value:`bicycle`,label:`Bicycle`,category:`bicycle`},{value:`pedestrian`,label:`Pedestrian`,category:`foot`},{value:`bus`,label:`Bus`,category:`bus`}],attribution:`<a href="https://valhalla.github.io/valhalla/" target="_blank" rel="noopener">Valhalla</a>, hosted by <a href="https://www.fossgis.de/" target="_blank" rel="noopener">FOSSGIS e.V.</a> | &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap contributors</a>`,keyPlaceholder:null,keyAttr:null,async calculate(e,t,n,r){let i=t.map(e=>n===`time`?{time:e}:{distance:e}),a=await fetch(`https://valhalla1.openstreetmap.de/isochrone`,{method:`POST`,headers:{"Content-Type":`application/json`},body:JSON.stringify({locations:[{lon:e[0],lat:e[1]}],costing:r,contours:i,polygons:!0})});if(!a.ok){let e=await a.json().catch(()=>({}));throw Error(e?.error??`Valhalla ${a.status}`)}let o=await a.json(),s=[...o.features].sort((e,t)=>{let n=e.properties?.contour??0;return(t.properties?.contour??0)-n});return{...o,features:s}}}];function v(e){return typeof structuredClone==`function`?structuredClone(e):JSON.parse(JSON.stringify(e))}var y=new Map(_.map(e=>[e.id,e])),b=class extends s{constructor(...e){super(...e),this.toolId=`isochrone`,this.center=null,this.serviceId=`openrouteservice`,this.mode=`auto`,this.rangeType=`time`,this.rangesInput=`10, 20, 30`,this.loading=!1,this.error=null,this.currentFc=null,this.previewAttribution=null,this.unsubClick=null,this.layersCreated=!1,this._escHandler=null}static{this.styles=[c,r`
        :host { display: block; padding: var(--webmapx-tool-padding, 0); font-size: 0.875rem; }
        label { display: block; margin-bottom: 0.25rem; }
        .hint { color: var(--color-text-secondary, #5a6773); font-size: 0.8rem; margin-bottom: 0.75rem; line-height: 1.4; }
        .row { display: flex; gap: 0.5rem; align-items: center; margin-bottom: 0.5rem; }
        sl-select, sl-input { flex: 1; min-width: 0; }
        /* A row whose fields carry their labels above: buttons line up with the field, not the label. */
        .row.fields { align-items: flex-end; }
        button { padding: 0.35rem 0.75rem; border: 1px solid var(--color-border, #d5dce3); border-radius: 4px; background: var(--color-background, #fff); cursor: pointer; font-size: 0.875rem; color: var(--color-text-primary, #16202a); }
        sl-button.calculate { flex: 1; }
        button:disabled { opacity: 0.5; cursor: default; }
        .field { margin-bottom: 0.5rem; }
        .error { color: var(--sl-color-danger-600, #c00); font-size: 0.8rem; margin-top: 0.25rem; }
        .center-row { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem; font-size: 0.8rem; color: var(--color-text-secondary, #5a6773); }
        .dot { width: 10px; height: 10px; border-radius: 50%; background: var(--webmapx-data-route, #2563eb); display: inline-block; flex-shrink: 0; }
        .spinner { display: inline-block; width: 14px; height: 14px; border: 2px solid var(--color-border, #d5dce3); border-top-color: var(--color-primary, #2b6c8f); border-radius: 50%; animation: spin 0.6s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
    `]}getToolAttr(e){let t=this.getAttribute(`tool-id`),n=this.toolsConfig?Object.values(this.toolsConfig):[];for(let r of n){let n=Array.isArray(r?.items)?r.items:[];for(let r of n)if(r?.id===t&&typeof r[e]==`string`)return r[e]}}get configuredService(){let e=this.getToolAttr(`routingService`);return!e||e===`all`?null:y.has(e)?e:null}serviceHasKey(e){return e.keyPlaceholder?this.getApiKey(e)!==null:!0}getApiKey(e){if(!e.keyPlaceholder)return null;if(e.keyAttr){let t=this.getToolAttr(e.keyAttr);if(t)return t}let t=a(e.keyPlaceholder);return t.startsWith(`{`)?null:t}get availableServices(){return _.filter(e=>this.serviceHasKey(e))}get activeService(){let e=this.configuredService??this.serviceId,t=y.get(e);return t&&this.serviceHasKey(t)?t:this.availableServices[0]??_[0]}get effectiveMode(){let e=this.activeService.modes;return e.some(e=>e.value===this.mode)?this.mode:e[0].value}get showServiceDropdown(){return this.configuredService===null}onMapAttached(e){super.onMapAttached(e),this.unsubClick=e.events.on(`click`,e=>this.handleMapClick(e))}onMapDetached(){this.unsubClick?.(),this.unsubClick=null,this.adapter?.setCursor(``),this.removeLayers(),this.adapter?.removeMarker(`webmapx-isochrone-center`),super.onMapDetached()}onActivate(){this.createLayers(),this.adapter?.setCursor(`crosshair`),this._escHandler=e=>{e.key===`Escape`&&this.deactivate()},document.addEventListener(`keydown`,this._escHandler)}onDeactivate(){document.removeEventListener(`keydown`,this._escHandler),this._escHandler=null,this.adapter?.setCursor(``),this.clearIsochrone(),this.removeLayers()}onStateChanged(e){}createLayers(e=this.previewAttribution){this.layersCreated||=(this.previewAttribution=e,this.dispatchEvent(new CustomEvent(`webmapx-add-source`,{detail:{id:d,config:{type:`geojson`,data:{type:`FeatureCollection`,features:[]},...e?{attribution:e}:{}}},bubbles:!0,composed:!0})),this.dispatchEvent(new CustomEvent(`webmapx-add-layer`,{detail:{id:f,type:`fill`,source:d,paint:{"fill-color":`rgba(120,198,121,0.4)`,"fill-opacity":1},metadata:{isToolLayer:!0,hideFromLegend:!0}},bubbles:!0,composed:!0})),this.dispatchEvent(new CustomEvent(`webmapx-add-layer`,{detail:{id:p,type:`line`,source:d,paint:{"line-color":`rgba(120,198,121,0.8)`,"line-width":1.5,"line-opacity":1},metadata:{isToolLayer:!0,hideFromLegend:!0}},bubbles:!0,composed:!0})),!0)}removeLayers(){this.layersCreated&&=(this.dispatchEvent(new CustomEvent(`webmapx-remove-layer`,{detail:p,bubbles:!0,composed:!0})),this.dispatchEvent(new CustomEvent(`webmapx-remove-layer`,{detail:f,bubbles:!0,composed:!0})),this.dispatchEvent(new CustomEvent(`webmapx-remove-source`,{detail:d,bubbles:!0,composed:!0})),!1)}setData(e,t){if(this.currentFc=e.features.length>0?e:null,this.adapter?.getSource(d)?.setData(e),t&&t.length>0){let e=g(t);this.adapter?.updateLayerStyle(f,f,{"fill-color":e}),this.adapter?.updateLayerStyle(p,p,{"line-color":e})}}persistToMap(){if(!this.currentFc||!this.center)return;let e=this.parseRanges();if(!e)return;let t=`webmapx-iso-${Date.now()}`,n=this.activeService,r=n.modes.find(e=>e.value===this.mode)?.label??this.mode,i=this.rangeType===`time`?`min`:`km`,a=`Isochrone ${r} · ${this.rangesInput.trim()} ${i}`,o=g(e),s=new Date().toISOString(),c=[`<b>Service:</b> ${n.label}`,`<b>Mode:</b> ${r}`,`<b>Range type:</b> ${this.rangeType===`time`?`Time`:`Distance`}`,`<b>Ranges:</b> ${e.join(`, `)} ${i}`,`<b>Center:</b> ${this.center[1].toFixed(6)}, ${this.center[0].toFixed(6)}`,`<b>Created:</b> ${s}`].join(`<br>`),d=v({type:`FeatureCollection`,features:this.currentFc.features}),p=v({type:`FeatureCollection`,features:[{type:`Feature`,geometry:{type:`Point`,coordinates:this.center},properties:{point_color:u}}]}),m=this.rangeType===`time`?`Isochrones`:`Isodistances`;this.dispatchEvent(new CustomEvent(`webmapx-add-layer`,{detail:{id:t,type:`style`,version:8,beforeLayerId:f,metadata:{label:a,abstract:c,legendRole:`overlay`},attribution:this.previewAttribution??n.attribution,sources:{polygons:{type:`geojson`,data:d,attribution:this.previewAttribution??n.attribution},center:{type:`geojson`,data:p}},layers:[{id:`${t}-fill`,type:`fill`,source:`polygons`,paint:{"fill-color":o},metadata:{label:m}},{id:`${t}-line`,type:`line`,source:`polygons`,paint:{"line-color":o,"line-width":1.5,"line-opacity":.8},metadata:{label:`Isolines`}},{id:`${t}-circle`,type:`circle`,source:`center`,paint:{"circle-color":[`get`,`point_color`],"circle-radius":6,"circle-stroke-color":l,"circle-stroke-width":2},metadata:{label:`Center`}}]},bubbles:!0,composed:!0}))}handleMapClick(e){this.active&&(this.center=e.coords,this.adapter?.addMarker(`webmapx-isochrone-center`,e.coords,{color:u,draggable:!0,onDragEnd:e=>{this.center=e}}))}onServiceChange(e){let t=e.target.value,n=y.get(t);if(!n)return;let r=this.activeService.modes.find(e=>e.value===this.mode)?.category;this.serviceId=t;let i=r?n.modes.find(e=>e.category===r):void 0;this.mode=i?.value??n.modes[0].value,this.error=null}onModeChange(e){this.mode=e.target.value}onRangeTypeChange(e){this.rangeType=e.target.value,this.rangesInput=this.rangeType===`time`?`10, 20, 30`:`1, 5, 10`}parseRanges(){let e=this.rangesInput.split(`,`).map(e=>parseFloat(e.trim())).filter(e=>!isNaN(e)&&e>0);return e.length===0?null:[...new Set(e)].sort((e,t)=>e-t)}async calculate(){if(this.loading||!this.center)return;let e=this.parseRanges();if(!e){this.error=`Enter at least one valid range value.`;return}let t=this.activeService,n=this.getApiKey(t);this.loading=!0,this.error=null,this.setData({type:`FeatureCollection`,features:[]});try{let r=await t.calculate(this.center,e,this.rangeType,this.effectiveMode,n);this.creditPreviewTo(t.attribution),this.setData(r,e)}catch(e){this.error=e instanceof Error?e.message:`Calculation failed`,this.setData({type:`FeatureCollection`,features:[]})}finally{this.loading=!1}}creditPreviewTo(e){this.previewAttribution!==e&&(this.removeLayers(),this.createLayers(e))}clearIsochrone(){this.center=null,this.error=null,this.adapter?.removeMarker(`webmapx-isochrone-center`),this.setData({type:`FeatureCollection`,features:[]})}render(){let t=this.activeService,n=this.rangeType===`time`?`minutes`:`km`;return i`
            <p class="hint">${this.center?`Click the map to move the centre, then press Calculate.`:`Click the map to set the centre point.`}</p>

            ${this.center?i`
                <div class="center-row">
                    <span class="dot"></span>
                    ${this.center[1].toFixed(5)}, ${this.center[0].toFixed(5)}
                    <sl-icon-button name="x-lg" label="Clear isochrone" style="margin-left:auto;" @click=${()=>this.clearIsochrone()}></sl-icon-button>
                </div>`:e}

            ${this.showServiceDropdown?i`
                <div class="field">
                    <sl-select id="iso-service" size="small" hoist label="Service" .value=${t.id}
                        @sl-change=${e=>this.onServiceChange(e)}>
                        ${this.availableServices.map(e=>i`<sl-option value=${e.id}>${e.label}</sl-option>`)}
                    </sl-select>
                </div>
            `:e}

            <div class="row fields">
                <sl-select id="iso-mode" size="small" hoist label="Mode" .value=${this.effectiveMode}
                    @sl-change=${e=>this.onModeChange(e)}>
                    ${t.modes.map(e=>i`<sl-option value=${e.value}>${e.label}</sl-option>`)}
                </sl-select>
                <sl-select id="iso-range-type" size="small" hoist label="Range type" .value=${this.rangeType}
                    @sl-change=${e=>this.onRangeTypeChange(e)}>
                    <sl-option value="time">Time</sl-option>
                    <sl-option value="distance">Distance</sl-option>
                </sl-select>
            </div>

            <div class="field">
                <div class="row fields">
                    <sl-input id="iso-ranges" size="small" label="Ranges (${n}, comma-separated)"
                        .value=${this.rangesInput}
                        @sl-input=${e=>{this.rangesInput=e.target.value}}
                        placeholder="e.g. 10, 20, 30"></sl-input>
                    <sl-button size="small" @click=${()=>this.clearIsochrone()}>Clear</sl-button>
                </div>
            </div>

            <div class="row" style="margin-top:0.5rem;">
                <!-- Disabled rather than hidden: the button is where the reader looks for
                     what to do next, and a missing one reads as a broken panel. -->
                <sl-button
                    class="calculate"
                    size="small"
                    variant="primary"
                    ?disabled=${!this.center||this.loading}
                    title=${this.center?`Ask the service for this isochrone`:`Click the map to set a centre point first`}
                    @click=${()=>void this.calculate()}
                >${this.loading?`Calculating…`:`Calculate`}</sl-button>
            </div>

            ${this.loading?i`<div class="row"><span class="spinner"></span> Calculating…</div>`:e}
            ${this.error?i`<div class="error">⚠ ${this.error}</div>`:e}

            ${this.currentFc&&!this.loading?i`
                <div class="row" style="margin-top:0.5rem;">
                    <sl-button size="small" style="flex:1" @click=${()=>this.persistToMap()}>Persist to map</sl-button>
                </div>
            `:e}
        `}};o([n()],b.prototype,`center`,void 0),o([n()],b.prototype,`serviceId`,void 0),o([n()],b.prototype,`mode`,void 0),o([n()],b.prototype,`rangeType`,void 0),o([n()],b.prototype,`rangesInput`,void 0),o([n()],b.prototype,`loading`,void 0),o([n()],b.prototype,`error`,void 0),b=o([t(`webmapx-isochrone-tool`)],b);export{b as WebmapxIsochroneTool};