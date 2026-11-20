import"./vendor-shoelace-CCmdcRIF.js";import{_ as e,h as t,p as n,x as r,y as i}from"./vendor-lit-DP8NDNGT.js";import{$ as a,Ht as o,Lr as s,Q as c,Vt as l,X as u,Y as d,Z as f,dr as p,et as m,it as h,nr as g,nt as _,or as v,rt as y,tt as b}from"./webmapx-shared-CW18CGkS.js";import{t as x}from"./decorate-O6vL4zQK.js";import{t as S}from"./webmapx-modal-tool-Dl9HF4Jc.js";import{t as C}from"./form-label-styles-CUvG5W-2.js";import{a as w}from"./data-colors-BxQ-mx5p.js";import{a as T,s as E}from"./classify-channel-BSJsjivu.js";var D=new Set([`fill`,`line`,`circle`,`symbol`,`geojson`,`vector`,`label`,`fill-extrusion`]),O=`webmapx-data-analyzer-out:`,k=`webmapx-data-analyzer-src:`,A=[{cls:`high-high`,label:`High among high (hot spot)`,color:`#d7191c`},{cls:`low-low`,label:`Low among low (cold spot)`,color:`#2c7bb6`},{cls:`high-low`,label:`High among low (outlier)`,color:`#fdae61`},{cls:`low-high`,label:`Low among high (outlier)`,color:`#abd9e9`},{cls:`not-significant`,label:`Not significant`,color:`#eeeeee`},{cls:`no-data`,label:`No data`,color:`#bdbdbd`}],j=`Set1`,M=`#d9d9d9`,N=`#f7f7f7`,P=[`#e41a1c`,`#377eb8`,`#4daf4a`,`#984ea3`,`#ff7f00`,`#ffff33`],F=30,I=class extends S{constructor(...e){super(...e),this.toolId=`data-analyzer`,this.availableLayers=[],this.selectedLayerId=``,this.selectedSourceLayer=``,this.analysis=null,this.busy=!1,this.status=``,this.error=null,this.cancelled=!1,this.actionMessage=null,this.lastMapLayers={},this.overwrite=!0,this.lastOutputLayerIds=[],this.logOverride={},this.kindOverride={},this.lastFeatures=[],this.attributeCatalog={},this.analyzeToken=0,this.lastMapBusy=!1,this.worker=null}static{this.styles=[C,r`
        :host { display: block; }
        :host(:not([active])) .tool-content { display: none; }

        .tool-content {
            padding: var(--sl-spacing-medium);
            min-height: 260px;
            display: flex;
            flex-direction: column;
            gap: var(--sl-spacing-small);
            font-size: var(--sl-font-size-small);
        }

        .row {
            display: flex;
            align-items: center;
            gap: var(--sl-spacing-x-small);
        }

        .row sl-select { flex: 1; min-width: 0; }

        .hint, .meta {
            font-size: var(--sl-font-size-x-small);
            color: var(--color-text-secondary, #5a6773);
        }

        .warning {
            display: flex;
            align-items: flex-start;
            gap: 6px;
            color: var(--sl-color-warning-700, #915930);
            font-size: var(--sl-font-size-x-small);
        }

        .summary {
            display: grid;
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: 6px;
        }

        .metric {
            border: 1px solid var(--color-border, #d5dbe1);
            border-radius: var(--webmapx-radius-md, 6px);
            padding: 6px;
        }

        .metric strong {
            display: block;
            font-size: var(--sl-font-size-medium);
        }

        .cards {
            display: flex;
            flex-direction: column;
            gap: 6px;
        }

        .item {
            border: 1px solid var(--color-border, #d5dbe1);
            border-radius: var(--webmapx-radius-md, 6px);
            padding: 8px;
        }

        .item-head {
            display: flex;
            align-items: center;
            gap: 6px;
            margin-bottom: 3px;
        }

        .item-title {
            flex: 1;
            min-width: 0;
            font-weight: 600;
            overflow-wrap: anywhere;
        }

        .field-list {
            display: flex;
            flex-wrap: wrap;
            gap: 4px;
            margin-top: 6px;
        }

        .field {
            border: 1px solid var(--color-border, #d5dbe1);
            border-radius: var(--webmapx-radius-sm, 4px);
            padding: 2px 5px;
            font-size: var(--sl-font-size-x-small);
            overflow-wrap: anywhere;
        }

        .profile {
            display: grid;
            grid-template-columns: minmax(0, 1fr) auto;
            gap: 2px 8px;
        }

        .profile-name {
            font-weight: 600;
            overflow-wrap: anywhere;
        }

        .profile-stats {
            grid-column: 1 / -1;
            display: flex;
            flex-wrap: wrap;
            gap: 2px 10px;
            color: var(--sl-color-neutral-600, #5f6b76);
            font-size: var(--sl-font-size-x-small);
        }

        .profile-stats span {
            white-space: nowrap;
        }

        .actions {
            display: flex;
            flex-wrap: wrap;
            align-items: center;
            justify-content: flex-end;
            gap: 4px 6px;
            margin-top: 6px;
        }

        .related {
            display: flex;
            flex-wrap: wrap;
            align-items: center;
            gap: 4px;
            margin-top: 6px;
        }

        /* Field names are long and the panel is narrow: a button wraps its
           label instead of pushing the row out of the panel. */
        .actions sl-button, .related sl-button { max-width: 100%; }
        .actions sl-button::part(base), .related sl-button::part(base) { height: auto; min-height: var(--sl-input-height-small); }
        .actions sl-button::part(label), .related sl-button::part(label) {
            white-space: normal;
            overflow-wrap: anywhere;
            line-height: 1.3;
            padding-block: 3px;
            text-align: left;
        }

        sl-tab-group {
            --indicator-color: var(--color-primary, #1b6ec2);
        }

        sl-alert { font-size: var(--sl-font-size-x-small); }
        sl-select { --sl-input-height-medium: 28px; --sl-input-font-size-medium: var(--sl-font-size-small); }
    `]}onActivate(){!this.selectedLayerId&&this.availableLayers.length?this.selectLayer(this.defaultLayerId()):this.selectedLayerId&&!this.analysis&&!this.busy&&this.runAnalysis()}onStateChanged(e){let t=e.mapLayers??{};this.lastMapLayers=t,this.attributeCatalog=e.attributeMetadata??{},this.lastOutputLayerIds.some(e=>!t[e])&&(this.lastOutputLayerIds=this.lastOutputLayerIds.filter(e=>t[e])),this.availableLayers=Object.entries(t).filter(([,e])=>{let t=e.layerType;return!t||D.has(t)}).map(([e,t])=>({id:e,label:t.label??e})),this.selectedLayerId&&!this.availableLayers.some(e=>e.id===this.selectedLayerId)&&(this.selectedLayerId=``,this.selectedSourceLayer=``,this.analysis=null),!this.selectedLayerId&&this.active&&this.availableLayers.length&&this.selectLayer(this.defaultLayerId());let n=e.mapBusy===!0,r=this.lastMapBusy&&!n;this.lastMapBusy=n,r&&this.active&&this.selectedLayerId&&!this.analysis&&this.isViewportLimited(this.selectedLayerId)&&this.runAnalysis()}defaultLayerId(){let e=[...this.availableLayers].reverse();return(e.find(e=>!e.id.startsWith(O)&&this.lastMapLayers[e.id]?.visible!==!1)??e[0]).id}selectLayer(e){let t=this.sourceLayers(e);this.selectedLayerId=e,this.selectedSourceLayer=t[0]??``,this.analysis=null,this.error=null,this.cancelled=!1,this.actionMessage=null,this.active&&this.runAnalysis()}sourceLayers(e){let t=this.lastMapLayers[e]?.sublayers;if(!Array.isArray(t))return[];let n=new Set,r=e=>{for(let t of e){if(!t||typeof t!=`object`)continue;let e=t;typeof e[`source-layer`]==`string`&&e[`source-layer`]&&n.add(e[`source-layer`]),Array.isArray(e.sublayers)&&r(e.sublayers)}};return r(t),[...n]}isViewportLimited(e){let t=this.lastMapLayers[e]?.sourceId;return l(this.adapter,t)}labelOf(e){return this.availableLayers.find(t=>t.id===e)?.label??e}async runAnalysis(){if(!this.adapter||!this.selectedLayerId||this.busy)return;let e=++this.analyzeToken;this.cancelWorker(),this.busy=!0,this.status=`Reading layer features...`,this.error=null,this.cancelled=!1,this.actionMessage=null;try{await this.updateComplete,await new Promise(e=>requestAnimationFrame(()=>e(null)));let t=await o(this.adapter,this.selectedLayerId,{sourceId:this.lastMapLayers[this.selectedLayerId]?.sourceId,sourceLayer:this.selectedSourceLayer||void 0});if(e!==this.analyzeToken)return;if(!t.features){this.error=`This layer cannot be read for analysis.`,this.analysis=null;return}if(t.features.length===0){this.error=this.isViewportLimited(this.selectedLayerId)?`No features are drawn in the current view. Zoom or pan to the features you want to analyze.`:`This layer has no features.`,this.analysis=null;return}this.status=`Preparing ${t.features.length} features for analysis...`,this.lastFeatures=t.features,this.analysis=await this.analyzeInWorker(t.features,t.complete,e)}catch(t){e===this.analyzeToken&&(console.error(`[data-analyzer] analysis failed`,t),this.error=t instanceof Error?t.message:String(t),this.analysis=null)}finally{e===this.analyzeToken&&(this.busy=!1,this.status=``)}}analyzeInWorker(e,t,n){return this.runWorker({op:`analyze`,properties:e.map(e=>e.properties??{}),geometries:e.map(e=>e.geometry??null),complete:t},n).then(e=>{if(e.status!==`ok`)throw Error(`Unexpected analysis response.`);return e.analysis})}runWorker(e,t){return new Promise((n,r)=>{let i=new Worker(new URL(``+new URL(`data-analyzer.worker-DH4kxN8k.js`,import.meta.url).href,``+import.meta.url),{type:`module`});this.worker=i,i.onmessage=e=>{if(t!==this.analyzeToken||i!==this.worker)return;let a=e.data;a.status===`progress`?this.status=a.message:a.status===`error`?(this.cancelWorker(),r(Error(a.message))):(this.cancelWorker(),n(a))},i.onerror=e=>{t!==this.analyzeToken||i!==this.worker||(this.cancelWorker(),r(Error(e.message||`Data analysis worker failed.`)))};try{i.postMessage(e)}catch(e){this.cancelWorker(),r(e instanceof Error?e:Error(String(e)))}})}disconnectedCallback(){this.cancelWorker(),super.disconnectedCallback()}cancelAnalysis(){this.analyzeToken++,this.cancelWorker(),this.busy=!1,this.status=``,this.cancelled=!0}cancelWorker(){this.worker?.terminate(),this.worker=null}render(){let t=this.selectedLayerId?this.sourceLayers(this.selectedLayerId):[];return i`
            <div class="tool-content">
                <div class="row">
                    <sl-select
                        label="Layer"
                        size="small"
                        value=${this.selectedLayerId}
                        ?disabled=${this.busy||this.availableLayers.length===0}
                        @sl-change=${e=>this.selectLayer(e.target.value)}
                    >
                        ${this.availableLayers.length?this.availableLayers.map(e=>i`<sl-option value=${e.id}>${e.label}</sl-option>`):i`<sl-option value="">No vector layers on the map</sl-option>`}
                    </sl-select>
                    <!-- The name is the icon's label: an aria-label on a Shoelace button
                         never reaches the button inside it, so this one had no name. -->
                    <sl-button
                        size="small"
                        class=${this.busy?``:`icon-only`}
                        ?disabled=${!this.selectedLayerId}
                        title=${this.busy?`Cancel analysis`:`Run analysis`}
                        @click=${()=>this.busy?this.cancelAnalysis():this.runAnalysis()}
                    >
                        ${this.busy?i`Cancel`:i`<sl-icon name="arrow-clockwise" label="Run analysis"></sl-icon>`}
                    </sl-button>
                </div>
                ${t.length>1?i`
                    <sl-select
                        label="Sub-layer"
                        size="small"
                        value=${this.selectedSourceLayer}
                        ?disabled=${this.busy}
                        @sl-change=${e=>{this.selectedSourceLayer=e.target.value,this.analysis=null,this.runAnalysis()}}
                    >
                        ${t.map(e=>i`<sl-option value=${e}>${e}</sl-option>`)}
                    </sl-select>
                `:e}
                ${this.selectedLayerId&&this.isViewportLimited(this.selectedLayerId)?i`
                    <div class="warning">
                        <sl-icon name="exclamation-triangle"></sl-icon>
                        MVT and other tile-backed layers are analyzed from features drawn in the current view.
                    </div>
                `:e}
                ${this.busy?i`<div class="hint">${this.status||`Waiting for ${this.labelOf(this.selectedLayerId)} analysis...`}</div>`:e}
                ${this.cancelled?i`<div class="hint">Analysis cancelled. Use refresh to run it again.</div>`:e}
                ${this.error?i`<sl-alert variant="danger" open>${this.error}</sl-alert>`:e}
                ${this.actionMessage?i`<sl-alert variant="success" open>${this.actionMessage}</sl-alert>`:e}
                ${this.analysis?this.renderAnalysis(this.analysis):e}
            </div>
        `}renderAnalysis(t){return i`
            <div class="summary">
                <div class="metric"><strong>${t.featureCount}</strong><span class="meta">features</span></div>
                <div class="metric"><strong>${t.profiles.length}</strong><span class="meta">fields</span></div>
                <div class="metric"><strong>${t.usableNumericFields.length}</strong><span class="meta">usable</span></div>
            </div>
            ${t.complete?e:i`
                <sl-alert variant="warning" open>Results use loaded viewport features, not the full source.</sl-alert>
            `}
            <sl-tab-group>
                <sl-tab slot="nav" panel="suggestions">Options</sl-tab>
                <sl-tab slot="nav" panel="fields">Fields</sl-tab>
                <sl-tab slot="nav" panel="families">Families</sl-tab>

                <sl-tab-panel name="suggestions">${this.renderSuggestions(t.suggestions,t.profiles)}</sl-tab-panel>
                <sl-tab-panel name="fields">${this.renderProfiles(t.profiles)}</sl-tab-panel>
                <sl-tab-panel name="families">${this.renderFamilies(t)}</sl-tab-panel>
            </sl-tab-group>
        `}renderSuggestions(t,n){if(!t.length)return i`<div class="hint">No strong options found yet.</div>`;let r=new Map(n.map(e=>[e.name,e]));return i`<div class="cards">${t.map(t=>i`
            <div class="item">
                <div class="item-head">
                    <div class="item-title">${t.title}</div>
                    <sl-badge>${Math.round(t.strength*100)}%</sl-badge>
                </div>
                <div class="meta">${t.description}</div>
                <div class="field-list">${t.fields.map(e=>i`<span class="field">${e}</span>`)}</div>
                ${t.kind===`family`&&this.familyOf(t)?i`
                    <div class="actions">
                        <sl-button size="small" ?disabled=${this.busy} @click=${()=>this.mapProfiles(this.familyOf(t))}>
                            Map profiles
                        </sl-button>
                    </div>
                `:e}
                ${t.kind===`spatial`&&t.fields[0]?i`
                    <div class="actions">
                        <sl-switch
                            size="small"
                            ?checked=${this.logFor(t.fields[0])}
                            @sl-change=${e=>{this.logOverride={...this.logOverride,[t.fields[0]]:e.target.checked}}}
                        >Log scale</sl-switch>
                        <sl-button size="small" ?disabled=${this.busy} @click=${()=>this.mapClusters([t.fields[0]])}>
                            Map clusters
                        </sl-button>
                    </div>
                    ${this.relatedClusterFields(t.fields[0]).length>1?i`
                        <div class="related">
                            <span class="meta">Clusters of related fields:</span>
                            ${this.relatedClusterFields(t.fields[0]).filter(e=>e!==t.fields[0]).map(e=>i`
                                <sl-button size="small" ?disabled=${this.busy} @click=${()=>this.mapClusters([e])}>${e}</sl-button>
                            `)}
                        </div>
                    `:e}
                `:e}
                ${t.kind===`map`&&t.fields[0]?i`
                    <div class="actions">
                        <sl-radio-group
                            size="small"
                            class="label-hidden"
                            label="Map values as"
                            value=${this.kindOf(t.fields[0])}
                            @sl-change=${e=>{this.kindOverride={...this.kindOverride,[t.fields[0]]:e.target.value}}}
                        >
                            <sl-radio-button value="absolute">Count</sl-radio-button>
                            <sl-radio-button value="relative">Rate</sl-radio-button>
                        </sl-radio-group>
                        <sl-button size="small" @click=${()=>this.mapSuggestion(t,r.get(t.fields[0]))}>
                            Map this
                        </sl-button>
                    </div>
                `:e}
            </div>
        `)}</div>
        ${this.lastOutputLayerIds.length?i`
            <sl-checkbox size="small" ?checked=${this.overwrite}
                @sl-change=${e=>{this.overwrite=e.target.checked}}
            >Replace previous result</sl-checkbox>
        `:e}`}get mapElement(){return this.mapHost}unitOf(e){let t=this.lastMapLayers[this.selectedLayerId]?.attributes;return s(t,this.attributeCatalog).get(e)?.unit??``}numbersOf(e,t){return e.map(e=>e.properties?.[t]).filter(e=>e!=null&&e!==``).map(Number).filter(Number.isFinite)}kindOf(e){return this.kindOverride[e]?this.kindOverride[e]:this.analysis?.areaFields?.includes(e)?`relative`:m(e,this.numbersOf(this.lastFeatures,e),this.unitOf(e))}async mapSuggestion(e,t){let n=e.fields[0];if(!n||this.lastFeatures.length===0){this.error=`Run the analysis before creating a map.`;return}let r=a(this.lastFeatures);if(r===`none`||r===`mixed`){this.error=r===`none`?`This layer has no geometry to map.`:`This layer mixes points, lines and polygons; map one geometry type at a time.`;return}let i=this.kindOf(n),o=t?t.numericShare>=.8:!0,s=this.labelOf(this.selectedLayerId),l=[],u=this.lastFeatures.map(e=>({type:`Feature`,...e.id===void 0?{}:{id:e.id},geometry:e.geometry,properties:{...e.properties??{}}})),d=n,f=n,m,g=null,x=!1,S=o&&i===`absolute`&&r===`polygon`?this.areaFieldFor(n):null;if(S){let e=`${n}_per_km2`,t=S.factor;u=u.map(r=>{let i=Number(r.properties?.[n]),a=Number(r.properties?.[S.field])*t,o=r.properties?.[n],s=o!=null&&o!==``&&Number.isFinite(i)&&a>0;return{...r,properties:{...r.properties,[e]:s?i/a:null}}}),g={value:[`/`,[`to-number`,[`get`,n]],[`*`,[`to-number`,[`get`,S.field]],t]],has:[`all`,[`has`,n],[`has`,S.field],[`>`,[`to-number`,[`get`,S.field],0],0]]},d=e,f=`${n} per km²`,l.push(`Area taken from ${S.field} (1 unit = ${S.factor} km²).`)}else if(o&&i===`absolute`&&r===`polygon`){x=!0;let e=c(u,n);u=e.features,d=e.densityField,f=`${n} per km²`,e.groupCount<e.partCount&&l.push(`${e.partCount} parts with identical attributes counted as ${e.groupCount} features.`),e.groupingSkipped&&l.push(e.groupingSkipped)}if(o&&i===`absolute`&&r===`point`){let e=Math.max(0,...this.numbersOf(u,n));if(e<=0){this.error=`Nothing to size by in ${n}.`;return}m={type:`circle`,layout:{"circle-sort-key":[`-`,[`to-number`,[`get`,n],0]]},paint:{"circle-color":w,"circle-opacity":.75,"circle-radius":p({field:n,maxValue:e,maxRadius:F}).expression,"circle-stroke-color":`#ffffff`,"circle-stroke-width":1}}}else if(o&&i===`absolute`&&r===`line`){let e=Math.max(0,...this.numbersOf(u,n));if(e<=0){this.error=`Nothing to size by in ${n}.`;return}m={type:`line`,paint:{"line-color":w,"line-width":b(n,e)}}}else{let e=o?h(u,d):{split:!1,zeroCount:0,rest:u},t=T(e.rest,o,{...E(d),niceBreaks:!0});if(!t){this.error=`Nothing to classify for ${d}.`;return}if(t.channel===null){this.error=t.problem;return}let n=e.split?y(d,v(t.channel)):v(t.channel);e.split&&l.push(`${e.zeroCount} ${e.zeroCount===1?`feature`:`features`} with ${d} = 0 ${e.zeroCount===1?`has its`:`have their`} own class.`),m=r===`polygon`?{type:`fill`,paint:{"fill-color":n,"fill-opacity":.8}}:r===`line`?{type:`line`,paint:{"line-color":n,"line-width":3}}:{type:`circle`,paint:{"circle-color":n,"circle-radius":6,"circle-stroke-color":`#ffffff`,"circle-stroke-width":1}}}let C=i===`absolute`?r===`polygon`?`density per km²`:r===`line`?`proportional width`:`proportional circles`:`colour classes`,D=x?null:this.originalSource(r);if(D){g&&(m=_(m,d,g.value,g.has));let e=!(o&&i===`absolute`&&(r===`point`||r===`line`));this.isViewportLimited(this.selectedLayerId)&&l.push(e?`Styled on the original source; class breaks come from the ${this.lastFeatures.length} features that were in view.`:`Styled on the original source; sizes are scaled to the largest value among the ${this.lastFeatures.length} features that were in view.`)}else x&&l.push(`Areas were measured from the drawn geometry, so the result is a copy of the features.`);let O=D?{key:n,source:D,style:m,label:`${s}: ${f}`,what:`${n} as ${C}`}:{key:n,features:u,style:m,label:`${s}: ${f}`,what:`${n} as ${C}`};if(await this.addOutputLayers([O])===0){this.error=`Could not add a layer for ${n}.`;return}this.error=null,this.actionMessage=[`Mapped ${f} from ${s} as ${C}.`,...l].join(` `)}async addOutputLayers(e){let t=this.overwrite?``:`-${Date.now()}`;if(this.overwrite&&this.mapElement){for(let e of this.lastOutputLayerIds){this.adapter?.getSource(e.replace(O,k))?.setData({type:`FeatureCollection`,features:[]});try{this.mapElement.removeInlineLayer(e)}catch{}}this.lastOutputLayerIds=[]}let n=!this.isViewportLimited(this.selectedLayerId),r=this.labelOf(this.selectedLayerId),i=[];for(let a of e){let e=`${O}${this.selectedLayerId}:${a.key}${t}`,o=`${k}${this.selectedLayerId}:${a.key}${t}`,s=`Created with webmapx tool Data analyzer: ${a.what}, from layer: ${r}`+(a.source?n?`.`:`. Styled on the full source; class breaks were computed from the features in view at the time.`:n?`.`:`. Contains only the features drawn in the view at the time.`),c=a.source?{source:a.source.sourceId,sources:{[a.source.sourceId]:a.source.config},...a.source.sourceLayer?{"source-layer":a.source.sourceLayer}:{},...a.source.filter?{filter:a.source.filter}:{}}:{source:o,sources:{[o]:{id:o,type:`geojson`,data:{type:`FeatureCollection`,features:a.features??[]}}}};await this.mapElement?.addLayerRequest({id:e,...c,...a.style,metadata:{label:a.label,abstract:s,dynamic:!0,legendRole:`overlay`}})&&i.push(e)}return this.lastOutputLayerIds=i,i.length}originalSource(e){let t=this.lastMapLayers[this.selectedLayerId],n=typeof t?.sourceId==`string`?t.sourceId:null;if(!n||!this.adapter)return null;let r=this.adapter.getSourceConfig(n),i=r?.type;if(!r||i!==`vector`&&i!==`geojson`)return null;let a=e===`polygon`?`fill`:e===`line`?`line`:`circle`,o=e=>!this.selectedSourceLayer||e[`source-layer`]===this.selectedSourceLayer,s=this.adapter.getSubLayers(this.selectedLayerId)??[],c=s.find(e=>o(e)&&e.type===a)??s.find(o),l=(typeof c?.[`source-layer`]==`string`?c[`source-layer`]:``)||this.selectedSourceLayer||(typeof t?.sourceLayer==`string`?t.sourceLayer:``);return i===`vector`&&!l?null:{sourceId:n,config:r,...l?{sourceLayer:l}:{},...c?.filter?{filter:c.filter}:{}}}areaFieldFor(e){for(let t of this.analysis?.areaFields??[]){if(t===e)continue;let n=f(this.lastFeatures,t);if(n)return{field:t,factor:n}}return null}familyOf(e){let t=this.analysis?.families.find(t=>`family:${t.name}`===e.id);return t&&t.fields.length>=2?t:null}async mapProfiles(e){if(this.lastFeatures.length===0||!this.analysis||this.busy)return;let t=a(this.lastFeatures);if(t===`none`||t===`mixed`){this.error=t===`none`?`This layer has no geometry to map.`:`This layer mixes points, lines and polygons; map one geometry type at a time.`;return}let n=this.analysis,r=++this.analyzeToken;this.busy=!0,this.error=null,this.actionMessage=null;let i;try{let t=await this.runWorker({op:`profile`,properties:this.lastFeatures.map(e=>e.properties??{}),fields:e.fields.map(e=>({field:e,noData:(n.profiles.find(t=>t.name===e)?.suspectedNoData??[]).map(e=>e.value)}))},r);if(t.status!==`profile`)throw Error(`Unexpected profile response.`);i=t.types}catch(e){r===this.analyzeToken&&(this.error=e instanceof Error?e.message:String(e));return}finally{r===this.analyzeToken&&(this.busy=!1,this.status=``)}if(r!==this.analyzeToken)return;if(!i){this.error=`Too few features with all of ${e.fields.length} parts to find types.`;return}let o=u(e.fields),s=i.centres.map((e,t)=>`${`ABCDEF`[t]}: ${d(e,i.overall,o)}`),c=`No data`,l=`profile_type`,f=this.lastFeatures.map((e,t)=>({type:`Feature`,...e.id===void 0?{}:{id:e.id},geometry:e.geometry,properties:{...e.properties??{},[l]:i.assignments[t]>=0?s[i.assignments[t]]:c}})),p=i.centres.map(e=>d(e,i.overall,o)===`close to average`),m=p.filter(e=>!e).length,h=g(j,Math.max(3,m))?.colors??P,_=0,v=s.flatMap((e,t)=>[e,p[t]?M:h[_++%h.length]]),y=i.assignments.some(e=>e<0),b=[`match`,[`get`,l],...v,...y?[c,N]:[],N],x=t===`polygon`?{type:`fill`,paint:{"fill-color":b,"fill-opacity":.8}}:t===`line`?{type:`line`,paint:{"line-color":b,"line-width":3}}:{type:`circle`,paint:{"circle-color":b,"circle-radius":6,"circle-stroke-color":`#ffffff`,"circle-stroke-width":1}},S=this.labelOf(this.selectedLayerId);if(await this.addOutputLayers([{key:`profile:${e.name}`,features:f,style:x,label:`${S}: ${e.name} types`,what:`composition types of ${e.fields.join(`, `)} (k-means on centred log-ratios, ${i.sizes.length} types)`}])===0){this.error=`Could not add a layer for ${e.name}.`;return}let C=i.silhouette>=.5?`well separated`:i.silhouette>=.25?`reasonably separated`:`weakly separated — the mixes change gradually rather than falling into types`,w=i.assignments.filter(e=>e<0).length;this.actionMessage=`Mapped ${i.sizes.length} types of ${e.name} (${i.sizes.join(` / `)} features, ${C}, silhouette ${i.silhouette.toFixed(2)}).`+(w?` ${w} features miss a part and have no type.`:``)}relatedClusterFields(e){let t=new Set(this.analysis?.areaFields??[]),n=new Set((this.analysis?.spatial??[]).map(e=>e.field).filter(n=>!t.has(n)||n===e));return(this.analysis?.families??[]).map(e=>e.fields.filter(e=>n.has(e))).filter(t=>t.includes(e)&&t.length>1).sort((e,t)=>e.length-t.length)[0]??[e]}logFor(e){return this.logOverride[e]??this.analysis?.spatial?.find(t=>t.field===e)?.log??!1}async mapClusters(e){if(e.length===0||this.lastFeatures.length===0||!this.analysis||this.busy)return;let t=a(this.lastFeatures);if(t===`none`||t===`mixed`){this.error=t===`none`?`This layer has no geometry to test.`:`This layer mixes points, lines and polygons; test one geometry type at a time.`;return}let n=this.analysis,r=e.map(e=>({field:e,noData:(n.profiles.find(t=>t.name===e)?.suspectedNoData??[]).map(e=>e.value),density:t===`polygon`&&this.kindOf(e)===`absolute`,log:this.logFor(e)})),i=++this.analyzeToken;this.busy=!0,this.error=null,this.actionMessage=null;let o;try{let e=await this.runWorker({op:`lisa`,properties:this.lastFeatures.map(e=>e.properties??{}),geometries:this.lastFeatures.map(e=>e.geometry??null),fields:r},i);if(e.status!==`lisa`)throw Error(`Unexpected cluster response.`);o=e.results}catch(e){i===this.analyzeToken&&(this.error=e instanceof Error?e.message:String(e));return}finally{i===this.analyzeToken&&(this.busy=!1,this.status=``)}if(i!==this.analyzeToken||o.length===0)return;let s=new Map(A.map(e=>[e.cls,e.label])),c=this.labelOf(this.selectedLayerId),l=o.map(e=>{let n=`lisa_${e.field}`,r=this.lastFeatures.map((t,r)=>({type:`Feature`,...t.id===void 0?{}:{id:t.id},geometry:t.geometry,properties:{...t.properties??{},[n]:s.get(e.classes[r])}})),i=A.filter(t=>e.counts[t.cls]>0),a=[`match`,[`get`,n],...i.flatMap(e=>[e.label,e.color]),`#bdbdbd`],o=t===`polygon`?{type:`fill`,paint:{"fill-color":a,"fill-opacity":.8}}:t===`line`?{type:`line`,paint:{"line-color":a,"line-width":3}}:{type:`circle`,paint:{"circle-color":a,"circle-radius":6,"circle-stroke-color":`#ffffff`,"circle-stroke-width":1}},l=`${e.density?` per km²`:``}${e.log?`, log scale`:``}`;return{key:`lisa:${e.field}`,features:r,style:o,label:`${c}: ${e.field}${e.density?` per km²`:``} clusters`,what:`local clusters of ${e.field}${l} (local Moran's I, analytic p-values, FDR 5%)`}});if(await this.addOutputLayers(l)===0){this.error=`Could not add a cluster layer for ${e.join(`, `)}.`;return}let u=(e,t)=>`${e} ${t}${e===1?``:`s`}`,d=o[0],f=d.neighbours===`contiguity`?`shared borders`:`distance (6 nearest)`,p=d.unitCount<this.lastFeatures.length?` ${this.lastFeatures.length} parts with identical attributes were tested as ${d.unitCount} features.`:``,m=e=>{let t=e.counts;return`${t[`high-high`]} hot, ${t[`low-low`]} cold, ${u(t[`high-low`]+t[`low-high`],`outlier`)}${e.log?` (log)`:``}`};if(o.length===1){let e=d.counts,t=[`${e[`high-high`]} in hot spots`,`${e[`low-low`]} in cold spots`,u(e[`high-low`]+e[`low-high`],`outlier`),`${e[`not-significant`]} not significant`];e[`no-data`]&&t.push(`${e[`no-data`]} without data`),this.actionMessage=`Mapped ${d.field} clusters${d.log?` on a log scale`:``}: ${t.join(`, `)}. Neighbours by ${f}.${p}`}else this.actionMessage=`Mapped clusters for ${o.length} fields — ${o.map(e=>`${e.field}: ${m(e)}`).join(`; `)}. Neighbours by ${f}.${p}`}renderProfiles(t){return i`<div class="cards">${[...t].sort((e,t)=>{let n=e=>(e.role===`measure`?3:0)+(e.suspectedNoData.length?2:0)+(e.stats?.standardDeviation??0);return n(t)-n(e)}).slice(0,30).map(t=>i`
                <div class="item profile">
                    <div class="profile-name">${t.name}</div>
                    <sl-badge variant=${t.role===`measure`?`success`:`neutral`}>${t.role}</sl-badge>
                <div class="meta">${t.family}</div>
                <div class="profile-stats">
                    <span>type: ${t.dataType}</span>
                    <span>count: ${t.total-t.missing}</span>
                    <span>unique: ${t.unique}</span>
                    <span>missing: ${t.missing}</span>
                    ${t.stats?i`
                        <span>min: ${L(t.stats.min)}</span>
                        <span>max: ${L(t.stats.max)}</span>
                        <span>avg: ${L(t.stats.mean)}</span>
                        <span>median: ${L(t.stats.median)}</span>
                    `:e}
                </div>
                ${t.suspectedNoData.length?i`
                    <div class="meta">no-data: ${t.suspectedNoData.map(e=>`${e.value} (${e.count})`).join(`, `)}</div>
                `:e}
            </div>
        `)}</div>`}renderFamilies(t){let n=t.families.filter(e=>e.fields.length>0);return n.length?i`<div class="cards">${n.map(t=>i`
            <div class="item">
                <div class="item-head">
                    <div class="item-title">${t.name}</div>
                    <sl-badge>${t.fields.length}</sl-badge>
                </div>
                ${t.reason?i`<div class="meta">${t.reason}</div>`:e}
                <div class="field-list">${t.fields.slice(0,12).map(e=>i`<span class="field">${e}</span>`)}</div>
            </div>
        `)}
        ${t.familyBorders.length?i`
            <div class="item">
                <div class="item-head">
                    <div class="item-title">Likely family borders</div>
                    <sl-badge>${t.familyBorders.length}</sl-badge>
                </div>
                <div class="cards">
                    ${t.familyBorders.slice(0,10).map(e=>i`
                        <div class="meta">
                            ${e.afterField} → ${e.beforeField}
                            · ${Math.round(e.confidence*100)}%
                            · ${e.reason}
                        </div>
                    `)}
                </div>
            </div>
        `:e}
        </div>`:i`<div class="hint">No variable families recognized.</div>`}};x([n()],I.prototype,`availableLayers`,void 0),x([n()],I.prototype,`selectedLayerId`,void 0),x([n()],I.prototype,`selectedSourceLayer`,void 0),x([n()],I.prototype,`analysis`,void 0),x([n()],I.prototype,`busy`,void 0),x([n()],I.prototype,`status`,void 0),x([n()],I.prototype,`error`,void 0),x([n()],I.prototype,`cancelled`,void 0),x([n()],I.prototype,`actionMessage`,void 0),x([n()],I.prototype,`lastMapLayers`,void 0),x([n()],I.prototype,`overwrite`,void 0),x([n()],I.prototype,`lastOutputLayerIds`,void 0),x([n()],I.prototype,`logOverride`,void 0),x([n()],I.prototype,`kindOverride`,void 0),I=x([t(`webmapx-data-analyzer-tool`)],I);function L(e){if(!Number.isFinite(e))return String(e);let t=Math.abs(e);if(t>1e9||t>0&&t<1e-6)return e.toExponential(4);if(Number.isInteger(e))return String(e);let n=Math.max(0,4-Math.floor(Math.log10(t))-1);return e.toFixed(Math.min(8,n)).replace(/\.0+$/,``).replace(/(\.\d*?)0+$/,`$1`)}export{I as WebmapxDataAnalyzerTool};