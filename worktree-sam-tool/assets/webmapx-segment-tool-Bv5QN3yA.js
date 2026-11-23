import"./vendor-shoelace-CCmdcRIF.js";import{_ as e,h as t,p as n,x as r,y as i}from"./vendor-lit-DP8NDNGT.js";import{A as a,C as o,D as s,E as c,F as l,I as u,L as d,M as f,N as p,O as ee,P as m,R as h,S as g,T as _,b as v,j as y,k as b,w as x,x as S,y as C}from"./webmapx-shared-CW18CGkS.js";import{g as w,h as T}from"./cesium-adapter-D-ExYo8b.js";import{t as E}from"./decorate-O6vL4zQK.js";import{t as D}from"./webmapx-modal-tool-Dl9HF4Jc.js";import{a as O,n as k,o as A,s as j,t as M}from"./data-colors-BxQ-mx5p.js";var N=new Set([`button`,`sl-button`,`sl-radio-button`,`sl-select`,`sl-option`,`a`]);function P(e){return e.composedPath().some(e=>typeof e.tagName==`string`&&N.has(e.tagName.toLowerCase()))}var F=`webmapx-segment-preview`,I=`webmapx-segment-preview-fill`,L=`webmapx-segment-preview-line`,R=`webmapx-segment-prompt-points`,z=`webmapx-segment-everything-fill`,B=`webmapx-segment-everything-line`,V=[z,B,I,L,R],H=[{points:8,label:`Coarse (64 prompts)`},{points:16,label:`Normal (256 prompts)`},{points:24,label:`Fine (576 prompts)`},{points:32,label:`Finest (1024 prompts)`}];function U(e){let t=[`match`,[`get`,`name`]];return e.forEach((e,n)=>t.push(e,M[n%M.length])),t.push(`#888888`),t}function W(e){return`${Math.round(e*100)}%`}function G(e,t){return t.map((t,n)=>({label:e[n],p:t})).sort((e,t)=>t.p-e.p).map(e=>`${e.label} ${W(e.p)}`).join(` · `)}function K(e,t){let n=new Set(t.map(e=>e.toLowerCase())),r=new Map;for(let t of e){let e=t.suggestions[0]?.word;e&&!n.has(e.toLowerCase())&&r.set(e,(r.get(e)??0)+1)}return[...r].map(([e,t])=>({word:e,count:t})).sort((e,t)=>t.count-e.count)}function q(e){return[...new Set(e.split(/[,\n]/).map(e=>e.trim()).filter(Boolean))]}function J(e){let t=[`match`,[`get`,`group`]];for(let n=0;n<e;n++)t.push(n,M[n%M.length]);return t.push(`#888888`),t}var Y=10,X=`webmapx-segments`,Z=`webmapx-segments-src`,Q=1024,$=class extends D{constructor(...e){super(...e),this.toolId=`segment`,this.capabilities=null,this.models=[],this.modelId=``,this.cached={},this.loadState=`idle`,this.progress=0,this.layers=[],this.layerId=``,this.mode=`point`,this.everythingDetail=16,this.groupCount=6,this.everythingProgress=null,this.segments=[],this.segmentStats=null,this.viewLayersKept=0,this.colourBy=`group`,this.clipId=`remoteclip`,this.clipCached={},this.labels=[...m],this.namedWith=null,this.namingProgress=null,this.suggestedWords=[],this.points=[],this.box=null,this.preview=null,this.busy=``,this.error=null,this.kept=0,this.granularity=`auto`,this.threshold=0,this.outlined=null,this.loadedModelKey=``,this.viewGeneration=0,this.encodedGeneration=-1,this.encodedPixelRatio=1,this.overlaysAdded=!1,this.resultFeatures=[],this.resultLayerAdded=!1,this.dragStart=null,this.unsubs=[],this.keyHandler=null,this.decodeRequested=!1,this.layerSignature=``,this.decodeRunning=!1,this.decodedGeneration=-1,this.outlineRequested=!1,this.outlineRunning=!1}static{this.styles=r`
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
    `}get section(){let e=this.toolsConfig;return e?.[this.instanceId]??e?.[this.toolId]}get clipModel(){return p.find(e=>e.id===this.clipId)??p[0]}get resolvedClip(){return d(this.clipModel,l(this.clipModel,this.modelBaseUrl),e=>this.resolveConfigAsset(e))}get modelBaseUrl(){let e=this.section?.modelBaseUrl;return typeof e==`string`&&e?e:void 0}resolved(e){let t=!!this.capabilities?.webgpu&&!!this.capabilities.fp16;return h(e,l(e,this.modelBaseUrl),t,e=>this.resolveConfigAsset(e))}get selectedModel(){return this.models.find(e=>e.id===this.modelId)}get backend(){return this.capabilities?.webgpu?`webgpu`:`wasm`}onStateChanged(e){let t=new Set([X,...V]),n=Object.entries(e.mapLayers??{}).filter(([e])=>!t.has(e));this.layers=n.filter(([,e])=>e.visible!==!1).map(([e,t])=>({id:e,label:String(t.label??e)})).reverse(),this.layerId&&!this.layers.some(e=>e.id===this.layerId)&&(this.layerId=``);let r=JSON.stringify(n.map(([e,t])=>[e,t.visible!==!1,t.transparency??0]));r!==this.layerSignature&&(this.layerSignature=r,this.viewGeneration++)}async onActivate(){this.error=null,this.listen(),this.capabilities?this.loadState===`ready`&&this.prepareMap():await this.initialise()}onDeactivate(){for(let e of this.unsubs)e();this.unsubs=[],this.keyHandler&&document.removeEventListener(`keydown`,this.keyHandler),this.keyHandler=null,this.clearPrompt(),this.removeOverlays(),this.adapter?.setCursor(``),this.adapter?.setPanEnabled(!0),this.adapter?.setDoubleClickZoomEnabled(!0)}async initialise(){this.loadState=`checking`;try{this.capabilities=await b()}catch(e){this.fail(e);return}this.models=u(this.section?.models);let e=this.section?.labels;Array.isArray(e)&&e.every(e=>typeof e==`string`)&&e.length&&(this.labels=e);let t=this.section?.clipModel;typeof t==`string`&&p.some(e=>e.id===t)&&(this.clipId=t);let n=this.section?.defaultModel,r=this.capabilities.webgpu?`sam2.1-tiny`:`slimsam-77`;this.modelId=[n,r,this.models[0]?.id].find(e=>typeof e==`string`&&this.models.some(t=>t.id===e));let i={};await Promise.all(this.models.map(async e=>{i[e.id]=await _(this.resolved(e)).catch(()=>!1)})),this.cached=i,this.loadState=`idle`,this.cached[this.modelId]&&await this.loadModel()}listen(){let e=this.adapter;!e||this.unsubs.length||(this.unsubs.push(e.events.on(`click`,e=>this.handleClick(e)),e.events.on(`contextmenu`,e=>this.handleContextMenu(e)),e.events.on(`pointer-down`,e=>this.handlePointerDown(e)),e.events.on(`pointer-move`,e=>this.handlePointerMove(e)),e.events.on(`pointer-up`,e=>this.handlePointerUp(e)),e.events.on(`view-change-end`,()=>this.handleViewChange())),this.keyHandler=e=>this.handleKey(e),document.addEventListener(`keydown`,this.keyHandler))}fail(e){this.error=e instanceof Error?e.message:String(e),this.busy=``}async loadModel(){let e=this.selectedModel;if(!e)return;let t=this.resolved(e),n=`${t.id}@${this.backend}`;if(!(n===this.loadedModelKey&&this.loadState===`ready`)){this.error=null,this.progress=0,this.loadState=this.cached[e.id]?`loading`:`downloading`;try{await c(t,this.backend,(e,t)=>{this.progress=t?e/t:0,e>=t&&(this.loadState=`loading`)})}catch(e){this.loadState=`error`,this.fail(e);return}e.id===this.modelId&&(this.cached={...this.cached,[e.id]:!0},this.loadedModelKey=n,this.loadState=`ready`,this.encodedGeneration=-1,this.active&&this.prepareMap(),this.hasPrompt&&this.requestDecode())}}handleModelChange(e){this.modelId=e.target.value,this.loadState=`idle`,this.loadedModelKey=``,this.preview=null,this.updateOverlays(),this.cached[this.modelId]&&this.loadModel()}handleLayerChange(e){this.layerId=e.target.value,this.viewGeneration++,this.hasPrompt&&this.requestDecode()}prepareMap(){this.adapter?.setCursor(`crosshair`),this.adapter?.setDoubleClickZoomEnabled(!1),this.adapter?.setPanEnabled(this.mode!==`box`),this.ensureOverlays()}setMode(e){e!==this.mode&&(this.mode=e,this.clearPrompt(),this.clearSegments(),this.loadState===`ready`&&this.adapter?.setPanEnabled(e!==`box`))}get interactive(){return this.active&&this.loadState===`ready`}get hasPrompt(){return this.points.length>0||!!this.box}handleClick(e){!this.interactive||this.mode!==`point`||this.addPoint(e.coords,!0)}handleContextMenu(e){!this.interactive||this.mode!==`point`||(e.originalEvent?.preventDefault?.(),this.addPoint(e.coords,!1))}addPoint(e,t){this.points=[...this.points,{lngLat:e,positive:t}],this.requestDecode()}handlePointerDown(e){!this.interactive||this.mode!==`box`||e.button!==0||(this.dragStart=e.coords,this.box=null)}handlePointerMove(e){this.dragStart&&(this.box=[this.dragStart,e.coords],this.updateOverlays())}handlePointerUp(e){if(!this.dragStart)return;let t=this.dragStart;this.dragStart=null;let n=this.adapter?.project(t),r=this.adapter?.project(e.coords);if(!n||!r||Math.abs(n[0]-r[0])<4||Math.abs(n[1]-r[1])<4){this.box=null,this.updateOverlays();return}this.box=[t,e.coords],this.requestDecode()}handleViewChange(){this.viewGeneration++}handleKey(e){if(this.active){if(e.key===`Backspace`||e.key===`z`&&(e.ctrlKey||e.metaKey)){if(!this.points.length||w(e))return;e.preventDefault(),this.points=this.points.slice(0,-1),this.hasPrompt?this.requestDecode():this.clearPrompt();return}e.key!==`Enter`||T(e)||P(e)||(this.mode===`everything`&&this.segments.length?(e.preventDefault(),this.keepSegments()):this.preview&&(e.preventDefault(),this.keep()))}}requestDecode(){this.updateOverlays(),this.decodeRequested=!0,this.decodeRunning||this.runDecodes()}async runDecodes(){this.decodeRunning=!0;try{for(;this.decodeRequested;)this.decodeRequested=!1,await this.decodeOnce()}finally{this.decodeRunning=!1,this.busy=``}}async ensureEncoded(e){if(this.encodedGeneration===this.viewGeneration)return!0;if(!e.renderViewImage)throw Error(`This map engine cannot render its view to an image, so it cannot be segmented. Switch to MapLibre.`);let t=this.viewGeneration;this.busy=`encoding`;let n=[X,...V],r=await e.renderViewImage(this.layerId?{include:[this.layerId],minLongestSide:Q}:{exclude:n,minLongestSide:Q});return t===this.viewGeneration?(await o(r.image),t===this.viewGeneration?(this.encodedGeneration=t,this.encodedPixelRatio=r.pixelRatio,!0):!1):(r.image.close(),!1)}async decodeOnce(){let e=this.adapter;if(!(!e||this.loadState!==`ready`||!this.hasPrompt)){this.error=null;try{if(!await this.ensureEncoded(e)){this.decodeRequested=!0;return}let t=this.viewGeneration,n=this.encodedPixelRatio,r=t=>{let[r,i]=e.project(t);return{x:r*n,y:i*n}},i={points:this.points.map(e=>({...r(e.lngLat),positive:e.positive}))};if(this.box){let e=r(this.box[0]),t=r(this.box[1]);i.box={x0:e.x,y0:e.y,x1:t.x,y1:t.y}}this.busy=`decoding`;let a=await g(i,this.outlineOptions);if(t!==this.viewGeneration){this.decodeRequested=!0;return}this.decodedGeneration=t,this.showResult(e,a)}catch(e){this.fail(e)}}}get outlineOptions(){return{granularity:this.granularity,threshold:this.threshold}}showResult(e,t){this.outlined=t.polygons.length?t.granularity:null,this.preview=this.toFeature(e,t,this.encodedPixelRatio),this.updateOverlays()}requestOutline(){if(!this.hasPrompt||this.decodeRunning){this.hasPrompt&&(this.decodeRequested=!0);return}if(this.decodedGeneration!==this.viewGeneration){this.requestDecode();return}this.outlineRequested=!0,this.outlineRunning||this.runOutlines()}async runOutlines(){this.outlineRunning=!0;try{for(;this.outlineRequested;){this.outlineRequested=!1;let e=this.adapter;if(!e||this.decodedGeneration!==this.viewGeneration)return;let t=await ee(this.outlineOptions);this.decodedGeneration===this.viewGeneration&&this.hasPrompt&&this.showResult(e,t)}}catch(e){this.fail(e)}finally{this.outlineRunning=!1}}handleGranularityChange(e){this.granularity=e.target.value,this.requestOutline()}handleThresholdInput(e){this.threshold=Number(e.target.value),this.requestOutline()}toFeature(e,t,n){let r=this.toLngLat(e,t.polygons,n);return r.length?{type:`Feature`,properties:{score:Math.round(t.score*1e3)/1e3,model:this.selectedModel?.label??this.modelId,granularity:t.granularity},geometry:{type:`MultiPolygon`,coordinates:r}}:null}toLngLat(e,t,n){let r=[];for(let i of t){let t=[];for(let r of i){let i=[];for(let[t,a]of r){let r=e.unproject([t/n,a/n]);r&&i.push([r[0],r[1]])}i.length===r.length&&i.length>=4&&t.push(i)}t.length&&r.push(f(t))}return r}async runEverything(){let e=this.adapter;if(!(!e||this.everythingProgress||this.decodeRunning)){this.error=null,this.clearSegments(),this.everythingProgress=[0,this.everythingDetail**2];try{if(!await this.ensureEncoded(e))throw Error(`The map moved while it was being analysed. Hold it still and try again.`);let t=this.viewGeneration;this.busy=``;let n=await y({pointsPerSide:this.everythingDetail,k:this.groupCount},(e,t)=>{this.everythingProgress=[e,t]});if(t!==this.viewGeneration)throw Error(`The map moved while it was being segmented, so the result no longer fits. Hold it still and try again.`);let r=this.selectedModel?.label??this.modelId;this.segments=n.segments.flatMap((t,i)=>{let a=this.toLngLat(e,t.polygons,this.encodedPixelRatio);return a.length?[{type:`Feature`,properties:{index:i,group:n.groups[i],kind:t.kind,score:Math.round(t.score*1e3)/1e3,model:r},geometry:{type:`MultiPolygon`,coordinates:a}}]:[]}),this.segmentStats=n.stats,this.updateOverlays()}catch(e){e instanceof v||this.fail(e)}finally{this.everythingProgress=null,this.busy=``}}}cancelEverything(){S()}async handleGroupCount(e){if(this.groupCount=Number(e.target.value),this.segments.length)try{let e=await a(this.groupCount);this.segments=this.segments.map(t=>({...t,properties:{...t.properties,group:e[Number(t.properties?.index??0)]}})),this.updateOverlays()}catch(e){this.fail(e)}}clearSegments(){this.segments=[],this.segmentStats=null,this.namedWith=null,this.suggestedWords=[],this.colourBy=`group`,this.updateOverlays()}colourIndex(e){if(this.colourBy===`name`&&this.namedWith){let t=this.namedWith.indexOf(String(e.properties?.name??``));return t<0?-1:t}return Number(e.properties?.group??0)}async checkClipCached(){let e=this.clipModel,t=await x(this.resolvedClip).catch(()=>!1);this.clipCached={...this.clipCached,[e.id]:t}}setColourBy(e){this.colourBy=e,e===`name`&&this.clipCached[this.clipId]===void 0&&this.checkClipCached(),this.updateOverlays()}addLabel(e){this.labels.includes(e)||(this.labels=[...this.labels,e])}handleLabelsInput(e){this.labels=q(e.target.value)}async nameSegments(){if(!this.segments.length||this.namingProgress)return;let e=[...this.labels];if(!e.length){this.error=`Give at least one name to choose from.`;return}this.error=null,this.namingProgress={phase:`texts`,done:0,total:1};try{let t=await s(this.resolvedClip,e,this.backend,(e,t,n)=>{this.namingProgress={phase:n??`regions`,done:e,total:t}});this.clipCached={...this.clipCached,[this.clipId]:!0},this.segments=this.segments.map(n=>{let r=t[Number(n.properties?.index??0)],i=Object.fromEntries((r?.suggestions??[]).map((e,t)=>[`suggestion_${t+1}`,`${e.word} (${W(e.probability)})`]));return{...n,properties:{...n.properties,name:r?e[r.label]:null,name_probability:r?Math.round(r.probability*1e3)/1e3:null,name_scores:r?G(e,r.probabilities):null,...i}}}),this.suggestedWords=K(t,e),this.namedWith=e,this.colourBy=`name`,this.updateOverlays()}catch(e){e instanceof v||this.fail(e)}finally{this.namingProgress=null}}async keepSegments(){if(!this.segments.length)return;let e=++this.viewLayersKept,t=Math.max(...this.segments.map(e=>Number(e.properties?.group??0)))+1,n=this.colourBy===`name`&&!!this.namedWith,r=`webmapx-segmented-view-${e}`,i=`${r}-src`,a=this.segments.map(e=>{let{index:t,...n}=e.properties??{};return{...e,properties:{...n,group:Number(n.group??0)}}});await this.mapHost?.addLayerRequest({id:r,type:`fill`,source:i,sources:{[i]:{id:i,type:`geojson`,data:{type:`FeatureCollection`,features:a}}},paint:{"fill-color":n?U(this.namedWith):J(t),"fill-opacity":.45,"fill-outline-color":`#ffffff`},metadata:{label:`Segmented view ${e}`,dynamic:!0,legendRole:`overlay`,attributes:{translations:[...n?[{name:`name`,translation:`Name`},{name:`name_probability`,translation:`Name certainty`},{name:`name_scores`,translation:`Scores`},{name:`suggestion_1`,translation:`Suggestion 1`},{name:`suggestion_2`,translation:`Suggestion 2`},{name:`suggestion_3`,translation:`Suggestion 3`}]:[],{name:`group`,translation:`Group`,valuemap:Array.from({length:t},(e,t)=>({value:t,label:`Group ${t+1}`}))}]}}}),this.clearSegments()}clearPrompt(){this.points=[],this.box=null,this.dragStart=null,this.preview=null,this.outlined=null,this.decodeRequested=!1,this.updateOverlays()}async keep(){if(!this.preview)return;let e={...this.preview,properties:{...this.preview.properties,id:this.resultFeatures.length+1}};this.resultFeatures=[...this.resultFeatures,e],this.kept=this.resultFeatures.length,this.clearPrompt(),await this.writeResults()}async writeResults(){let e={type:`FeatureCollection`,features:this.resultFeatures};if(this.resultLayerAdded&&this.store?.getState().mapLayers?.[X]){this.adapter?.getSource(Z)?.setData(e);return}this.resultLayerAdded&&(this.resultFeatures=this.resultFeatures.slice(-1),this.kept=1,e.features=this.resultFeatures),await this.mapHost?.addLayerRequest({id:X,type:`fill`,source:Z,sources:{[Z]:{id:Z,type:`geojson`,data:e}},paint:{"fill-color":A,"fill-opacity":.25,"fill-outline-color":A},metadata:{label:`Segments`,dynamic:!0,legendRole:`overlay`}}),this.resultLayerAdded=!0}emit(e,t){this.dispatchEvent(new CustomEvent(e,{detail:t,bubbles:!0,composed:!0}))}ensureOverlays(){if(this.overlaysAdded)return;this.emit(`webmapx-add-source`,{id:F,config:{type:`geojson`,data:{type:`FeatureCollection`,features:[]}}});let e=e=>({isToolLayer:!0,hideFromLegend:!0,label:e});this.emit(`webmapx-add-layer`,{id:z,type:`fill`,source:F,metadata:e(`Segmented view preview`),filter:[`==`,[`get`,`role`],`segment`],paint:{"fill-color":J(M.length),"fill-opacity":.45}}),this.emit(`webmapx-add-layer`,{id:B,type:`line`,source:F,metadata:e(`Segmented view outlines`),filter:[`==`,[`get`,`role`],`segment`],paint:{"line-color":`#ffffff`,"line-width":1,"line-opacity":.8}}),this.emit(`webmapx-add-layer`,{id:I,type:`fill`,source:F,metadata:e(`Segment preview`),filter:[`==`,[`get`,`role`],`mask`],paint:{"fill-color":A,"fill-opacity":.3}}),this.emit(`webmapx-add-layer`,{id:L,type:`line`,source:F,metadata:e(`Segment outline`),filter:[`in`,[`get`,`role`],[`literal`,[`mask`,`box`]]],paint:{"line-color":A,"line-width":2}}),this.emit(`webmapx-add-layer`,{id:R,type:`circle`,source:F,metadata:e(`Segment prompts`),filter:[`==`,[`get`,`role`],`point`],paint:{"circle-radius":6,"circle-color":[`case`,[`get`,`positive`],O,k],"circle-stroke-color":j,"circle-stroke-width":2}}),this.overlaysAdded=!0,this.updateOverlays()}updateOverlays(){if(!this.overlaysAdded)return;let e=[];for(let t of this.segments)e.push({...t,properties:{role:`segment`,group:this.colourIndex(t)}});if(this.preview&&e.push({...this.preview,properties:{role:`mask`}}),this.box){let[[t,n],[r,i]]=this.box;e.push({type:`Feature`,properties:{role:`box`},geometry:{type:`LineString`,coordinates:[[t,n],[r,n],[r,i],[t,i],[t,n]]}})}for(let t of this.points)e.push({type:`Feature`,properties:{role:`point`,positive:t.positive},geometry:{type:`Point`,coordinates:t.lngLat}});this.emit(`webmapx-set-source-data`,{id:F,data:{type:`FeatureCollection`,features:e}})}removeOverlays(){if(this.overlaysAdded){for(let e of V)this.emit(`webmapx-remove-layer`,e);this.emit(`webmapx-remove-source`,F),this.overlaysAdded=!1}}variantOf(e){return this.capabilities?.webgpu&&this.capabilities.fp16&&e.fp16?e.fp16:e.default}modelLabel(e){return`${e.label} · ${this.variantOf(e).sizeMB} MB`}modelHint(t){if(!t)return e;let n=!this.capabilities?.webgpu&&!t.cpuFriendly;return i`
            <p class="hint">
                ${this.cached[t.id]?`Already downloaded.`:`Downloaded once (${this.variantOf(t).sizeMB} MB) and kept by your browser.`}
                Images never leave your computer.
                ${n?i`<br>This browser has no WebGPU, so analysing each view takes 10–30 seconds with this model; SlimSAM is quicker.`:e}
            </p>
        `}renderModel(){let t=this.selectedModel,n=this.loadState===`downloading`||this.loadState===`loading`||this.loadState===`checking`;return i`
            <sl-select
                label="Model"
                size="small"
                value=${this.modelId}
                ?disabled=${n||!this.models.length}
                @sl-change=${this.handleModelChange}
            >
                ${this.models.map(e=>i`<sl-option value=${e.id}>${this.modelLabel(e)}</sl-option>`)}
            </sl-select>
            ${this.loadState===`idle`||this.loadState===`error`?i`
                <div class="row">
                    <sl-button size="small" variant="primary" ?disabled=${!t} @click=${()=>this.loadModel()}>
                        <sl-icon slot="prefix" name=${this.cached[this.modelId]?`play`:`download`}></sl-icon>
                        ${this.cached[this.modelId]?`Start`:`Download and start`}
                    </sl-button>
                </div>
                ${this.modelHint(t)}
            `:e}
            ${this.loadState===`downloading`?i`
                <sl-progress-bar value=${Math.round(this.progress*100)}></sl-progress-bar>
                <div class="status">Downloading ${t?.label}…</div>
            `:e}
            ${this.loadState===`loading`||this.loadState===`checking`?i`
                <div class="status"><sl-spinner></sl-spinner>${this.loadState===`checking`?`Checking this browser…`:`Starting ${t?.label}…`}</div>
            `:e}
        `}renderSegmenting(){return i`
            <sl-select
                label="Segment"
                size="small"
                value=${this.layerId}
                @sl-change=${this.handleLayerChange}
            >
                <sl-option value="">The map as shown</sl-option>
                ${this.layers.map(e=>i`<sl-option value=${e.id}>${e.label}</sl-option>`)}
            </sl-select>
            <sl-button-group label="Prompt">
                <sl-button size="small" variant=${this.mode===`point`?`primary`:`default`}
                    @click=${()=>this.setMode(`point`)}>
                    <sl-icon slot="prefix" name="hand-index"></sl-icon>Points
                </sl-button>
                <sl-button size="small" variant=${this.mode===`box`?`primary`:`default`}
                    @click=${()=>this.setMode(`box`)}>
                    <sl-icon slot="prefix" name="bounding-box"></sl-icon>Box
                </sl-button>
                <sl-button size="small" variant=${this.mode===`everything`?`primary`:`default`}
                    @click=${()=>this.setMode(`everything`)}>
                    <sl-icon slot="prefix" name="grid-3x3"></sl-icon>All
                </sl-button>
            </sl-button-group>
            ${this.mode===`everything`?this.renderEverything():this.renderPrompting()}
        `}renderEverything(){let t=!!this.everythingProgress,[n,r]=this.everythingProgress??[0,1],a=this.segments.length?Math.max(...this.segments.map(e=>Number(e.properties?.group??0)))+1:0;return i`
            <p class="hint">
                Divides the view into segments and colours alike those that look alike.
                SAM finds shapes, not names: the groups are unnamed.
            </p>
            <sl-select
                label="Detail"
                size="small"
                value=${String(this.everythingDetail)}
                ?disabled=${t}
                @sl-change=${e=>{this.everythingDetail=Number(e.target.value)}}
            >
                ${H.map(e=>i`<sl-option value=${String(e.points)}>${e.label}</sl-option>`)}
            </sl-select>
            ${t?i`
                <sl-progress-bar value=${this.busy===`encoding`?0:Math.round(n/r*100)}></sl-progress-bar>
                <div class="row">
                    <div class="status">
                        ${this.busy===`encoding`?i`<sl-spinner></sl-spinner>Analysing the view…`:i`Segmenting… ${n} of ${r}`}
                    </div>
                    <sl-button size="small" @click=${()=>this.cancelEverything()}>Cancel</sl-button>
                </div>
            `:i`
                <div class="actions">
                    <sl-button size="small" variant=${this.segments.length?`default`:`primary`} @click=${()=>this.runEverything()}>
                        <sl-icon slot="prefix" name="grid-3x3"></sl-icon>Segment the view
                    </sl-button>
                </div>
            `}
            ${this.segments.length&&!t?i`
                <sl-radio-group
                    label="Colour by"
                    size="small"
                    .value=${this.colourBy}
                    @sl-change=${e=>this.setColourBy(e.target.value)}
                >
                    <sl-radio-button value="group">Look-alike</sl-radio-button>
                    <sl-radio-button value="name">Name</sl-radio-button>
                </sl-radio-group>
                ${this.colourBy===`group`?i`
                    <div>
                        <sl-range
                            label="Groups"
                            min="2" max="12" step="1"
                            .value=${this.groupCount}
                            @sl-change=${this.handleGroupCount}
                        ></sl-range>
                        <div class="swatches">
                            ${Array.from({length:a},(e,t)=>i`
                                <span class="swatch" style="background:${M[t%M.length]}"
                                    title="Group ${t+1}"></span>`)}
                        </div>
                    </div>
                `:e}
                <div class="status">
                    ${this.segments.length} segments
                    ${this.segmentStats?.filled?i` (${this.segmentStats.filled} filling the gaps between outlines)`:e}
                </div>
                ${this.renderNaming()}
                <div class="actions">
                    <sl-button size="small" @click=${()=>this.clearSegments()}>Clear</sl-button>
                    <sl-button size="small" variant="primary" @click=${()=>this.keepSegments()}>
                        <sl-icon slot="prefix" name="check-lg"></sl-icon>Keep
                    </sl-button>
                </div>
            `:e}
            ${!this.segments.length&&!t&&this.segmentStats?i`<div class="status">Nothing stable enough to keep in this view.</div>`:e}
            ${this.viewLayersKept?i`<p class="hint">${this.viewLayersKept} segmented view${this.viewLayersKept===1?``:`s`} kept as layers.</p>`:e}
        `}renderNaming(){if(this.colourBy!==`name`)return e;let t=this.namingProgress,n=!!this.namedWith&&this.namedWith.join(`
`)!==this.labels.join(`
`),r=new Map;for(let e of this.segments){let t=e.properties?.name;typeof t==`string`&&r.set(t,(r.get(t)??0)+1)}let a=this.clipModel;return i`
            ${p.length>1?i`
                <sl-select
                    label="Naming model"
                    size="small"
                    value=${this.clipId}
                    ?disabled=${!!t}
                    @sl-change=${e=>{this.clipId=e.target.value,this.checkClipCached()}}
                >
                    ${p.map(e=>i`<sl-option value=${e.id}>${e.label} · ${e.sizeMB} MB</sl-option>`)}
                </sl-select>
            `:e}
            <sl-textarea
                label="Names to choose from"
                size="small"
                rows="3"
                resize="auto"
                help-text="Comma or line separated, in English."
                .value=${this.labels.join(`, `)}
                ?disabled=${!!t}
                @sl-change=${this.handleLabelsInput}
            ></sl-textarea>
            ${t?i`
                <sl-progress-bar value=${Math.round(t.done/Math.max(1,t.total)*100)}></sl-progress-bar>
                <div class="row">
                    <div class="status">
                        ${t.phase===`download`?i`Downloading ${a.label}…`:t.phase===`regions`?i`Looking at segment ${t.done} of ${t.total}…`:t.phase===`vocabulary`?i`<sl-spinner></sl-spinner>Trying ${C.length} words for suggestions…`:i`<sl-spinner></sl-spinner>Starting ${a.label}…`}
                    </div>
                    <sl-button size="small" @click=${()=>this.cancelEverything()}>Cancel</sl-button>
                </div>
            `:i`
                <div class="actions">
                    <sl-button size="small" variant=${this.namedWith&&!n?`default`:`primary`} @click=${()=>this.nameSegments()}>
                        <sl-icon slot="prefix" name="tags"></sl-icon>${this.namedWith?`Name again`:`Name the segments`}
                    </sl-button>
                </div>
                ${this.clipCached[a.id]===!1?i`<p class="hint">The first time downloads ${a.label} (${a.sizeMB} MB), kept by your browser afterwards.</p>`:e}
            `}
            ${this.namedWith?i`
                <div class="name-legend">
                    ${this.namedWith.map((e,t)=>i`
                        <span class="name-entry" ?data-empty=${!r.get(e)}>
                            <span class="swatch" style="background:${M[t%M.length]}"></span>
                            ${e} <span class="count">${r.get(e)??0}</span>
                        </span>`)}
                </div>
                ${n?i`<p class="hint">The list has changed; name again to use it.</p>`:e}
                ${this.suggestedWords.length?i`
                    <div class="suggestions">
                        <span class="hint">CLIP's own best word, per segment — click to add:</span>
                        ${this.suggestedWords.slice(0,Y).map(e=>i`
                            <button
                                type="button"
                                class="suggestion"
                                ?disabled=${this.labels.includes(e.word)}
                                title=${`Best word for ${e.count} segment${e.count===1?``:`s`}; add it to the names`}
                                @click=${()=>this.addLabel(e.word)}
                            >+ ${e.word} <span class="count">${e.count}</span></button>`)}
                    </div>
                `:e}
                <p class="hint">
                    Names are CLIP's best guess from your list for each segment — it always picks one, even when none fits.
                </p>
            `:e}
        `}renderPrompting(){return i`
            <p class="hint">
                ${this.mode===`point`?i`Click an object to outline it. Click again to add to it, right-click to leave something out.`:i`Drag a box around an object.`}
                Enter keeps the outline${this.mode===`point`?`, Backspace undoes the last click`:``}.
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
                    .tooltipFormatter=${e=>e===0?`model boundary`:e<0?`looser`:`tighter`}
                    @sl-input=${this.handleThresholdInput}
                ></sl-range>
                <div class="range-ends"><span>Looser</span><span>Tighter</span></div>
            </div>
            <div class="status">
                ${this.busy===`encoding`?i`<sl-spinner></sl-spinner>Analysing the view…`:e}
                ${this.busy===`decoding`?i`<sl-spinner></sl-spinner>Outlining…`:e}
                ${!this.busy&&this.preview?i`Model confidence ${Math.round(Number(this.preview.properties?.score??0)*100)}%${this.granularity===`auto`&&this.outlined?i` · ${this.outlined}`:e}`:e}
                ${!this.busy&&this.hasPrompt&&!this.preview?i`Nothing found here.`:e}
            </div>
            <div class="actions">
                <sl-button size="small" ?disabled=${!this.hasPrompt} @click=${()=>this.clearPrompt()}>Clear</sl-button>
                <sl-button size="small" variant="primary" ?disabled=${!this.preview} @click=${()=>this.keep()}>
                    <sl-icon slot="prefix" name="check-lg"></sl-icon>Keep
                </sl-button>
            </div>
            ${this.kept?i`<p class="hint">${this.kept} outline${this.kept===1?``:`s`} in the “Segments” layer.</p>`:e}
        `}render(){return i`
            <div class="tool-content">
                ${this.renderModel()}
                ${this.loadState===`ready`?this.renderSegmenting():e}
                ${this.error?i`
                    <sl-alert variant="danger" open>
                        <sl-icon slot="icon" name="exclamation-octagon"></sl-icon>
                        ${this.error}
                    </sl-alert>
                `:e}
            </div>
        `}};E([n()],$.prototype,`capabilities`,void 0),E([n()],$.prototype,`models`,void 0),E([n()],$.prototype,`modelId`,void 0),E([n()],$.prototype,`cached`,void 0),E([n()],$.prototype,`loadState`,void 0),E([n()],$.prototype,`progress`,void 0),E([n()],$.prototype,`layers`,void 0),E([n()],$.prototype,`layerId`,void 0),E([n()],$.prototype,`mode`,void 0),E([n()],$.prototype,`everythingDetail`,void 0),E([n()],$.prototype,`groupCount`,void 0),E([n()],$.prototype,`everythingProgress`,void 0),E([n()],$.prototype,`segments`,void 0),E([n()],$.prototype,`segmentStats`,void 0),E([n()],$.prototype,`viewLayersKept`,void 0),E([n()],$.prototype,`colourBy`,void 0),E([n()],$.prototype,`clipId`,void 0),E([n()],$.prototype,`clipCached`,void 0),E([n()],$.prototype,`labels`,void 0),E([n()],$.prototype,`namedWith`,void 0),E([n()],$.prototype,`namingProgress`,void 0),E([n()],$.prototype,`suggestedWords`,void 0),E([n()],$.prototype,`points`,void 0),E([n()],$.prototype,`box`,void 0),E([n()],$.prototype,`preview`,void 0),E([n()],$.prototype,`busy`,void 0),E([n()],$.prototype,`error`,void 0),E([n()],$.prototype,`kept`,void 0),E([n()],$.prototype,`granularity`,void 0),E([n()],$.prototype,`threshold`,void 0),E([n()],$.prototype,`outlined`,void 0),$=E([t(`webmapx-segment-tool`)],$);export{$ as WebmapxSegmentTool};