import"./vendor-shoelace-CCmdcRIF.js";import{d as e,g as t,h as n,m as r,p as i,x as a,y as o}from"./vendor-lit-DP8NDNGT.js";import{Bt as s,It as c,J as l,Mn as u,Nn as d,Yt as ee,zt as f}from"./webmapx-shared-CW18CGkS.js";import{y as p}from"./cesium-adapter-D-ExYo8b.js";import{t as m}from"./decorate-O6vL4zQK.js";import{t as te}from"./webmapx-modal-tool-Dl9HF4Jc.js";import{t as h}from"./control-surface-styles-WAx9bflO.js";import{a as g,i as _,r as v}from"./top-layer-dialog-DcJK4Y8h.js";import{o as y,s as b}from"./data-colors-BxQ-mx5p.js";var x={Point:[`string`,`number`,`longitude`,`latitude`,`linkURL`,`imageURL`,`create-time`,`update-time`],LineString:[`string`,`number`,`length`,`linkURL`,`imageURL`,`create-time`,`update-time`],Polygon:[`string`,`number`,`area`,`perimeter`,`longitude`,`latitude`,`linkURL`,`imageURL`,`create-time`,`update-time`]},S=[{name:`id`,type:`number`},{name:`name`,type:`string`}],C={Point:y,LineString:y,Polygon:y};function w(e){return{id:`layer-${Date.now()}-${Math.random().toString(36).slice(2,6)}`,name:``,type:e,color:C[e],properties:S.map(e=>({...e}))}}var T=class extends t{constructor(...e){super(...e),this.geometryType=`Point`,this.existingLayers=[],this.mapLayers=[],this.step=`select`,this.selectedId=`new`,this.layer=w(`Point`),this.nameError=!1,this.newPropName=``,this.newPropType=`string`,this.allowedAttributes=null}static{this.styles=[h,g,a`
        :host { display: block; }

        sl-dialog::part(panel) {
            min-width: min(420px, 90vw);
        }

        .layer-list {
            display: flex;
            flex-direction: column;
            gap: var(--webmapx-space-xs, 0.25rem);
            max-height: 220px;
            overflow-y: auto;
            margin-bottom: var(--webmapx-space-lg, 1rem);
        }

        .layer-option {
            display: flex;
            width: 100%;
            background: transparent;
            font: inherit;
            color: inherit;
            text-align: left;
            align-items: center;
            gap: var(--webmapx-space-sm, 0.5rem);
            padding: var(--webmapx-space-xs, 0.4rem) var(--webmapx-space-sm, 0.6rem);
            border-radius: var(--webmapx-radius-sm, 4px);
            cursor: pointer;
            border: 1px solid transparent;
            font-size: var(--webmapx-font-size-md, 0.9rem);
        }

        .layer-option:hover { background: var(--color-background-secondary, #f4f6f8); }

        .layer-option.selected {
            background: var(--sl-color-primary-100);
            border-color: var(--sl-color-primary-400);
        }

        .color-dot {
            width: 12px; height: 12px;
            border-radius: 50%;
            flex-shrink: 0;
        }

        .new-icon { color: var(--color-text-muted, #6b7681); font-size: var(--webmapx-font-size-lg, 1rem); }

        .prop-table {
            width: 100%;
            border-collapse: collapse;
            font-size: var(--webmapx-font-size-md, 0.85rem);
            margin-top: var(--webmapx-space-sm, 0.5rem);
        }

        .prop-table th {
            text-align: left;
            background: var(--color-background-secondary, #f4f6f8);
            padding: var(--webmapx-space-xs, 0.25rem) var(--webmapx-space-xs, 0.4rem);
            border-bottom: 1px solid var(--color-border-light, #e2e7ec);
        }

        .prop-table td {
            padding: var(--webmapx-space-xs, 0.2rem) var(--webmapx-space-xs, 0.4rem);
            border-bottom: 1px solid var(--color-border-light, #e2e7ec);
            vertical-align: middle;
        }

        .prop-table tr:last-child td { border-bottom: none; }

        .prop-row-auto td { color: var(--color-text-muted, #6b7681); font-style: italic; }

        .type-computed { color: var(--color-primary, #2b6c8f); font-size: var(--webmapx-font-size-sm, 0.75rem); }

        .add-row td { background: var(--color-surface-raised, #f4f6f8); }

        .add-row sl-input,
        .add-row sl-select { font-size: var(--webmapx-font-size-md, 0.85rem); }

        .name-input-row {
            display: flex;
            align-items: center;
            gap: var(--webmapx-space-sm, 0.5rem);
            margin-bottom: var(--webmapx-space-md, 0.75rem);
        }

        .color-swatch {
            padding: 0;
            width: 32px; height: 32px;
            border-radius: var(--webmapx-radius-sm, 4px);
            border: 1px solid var(--color-border, #d5dce3);
            cursor: pointer;
            flex-shrink: 0;
        }

        .footer {
            display: flex;
            justify-content: flex-end;
            gap: var(--webmapx-space-sm, 0.5rem);
            margin-top: var(--webmapx-space-lg, 1rem);
        }

        .error-msg {
            color: var(--sl-color-danger-600);
            font-size: var(--webmapx-font-size-sm, 0.8rem);
            margin-top: var(--webmapx-space-xs, 0.25rem);
        }
    `]}open(){v(this),this.step=`select`,this.selectedId=this.existingLayers.length===0?`new`:this.existingLayers[0].id,this.layer=w(this.geometryType),this.newPropName=``,this.newPropType=`string`,this.nameError=!1,this.dialog?.show()}close(){this.dialog?.hide()}selectOption(e){this.selectedId=e}goToDetail(){if(this.selectedId===`new`)this.layer=w(this.geometryType),this.allowedAttributes=null;else{let e=this.existingLayers.find(e=>e.id===this.selectedId);if(e)this.layer={...e,properties:e.properties.map(e=>({...e}))},this.allowedAttributes=null;else{let e=this.mapLayers.find(e=>e.layerId===this.selectedId);this.layer={...w(this.geometryType),name:e?.label??this.selectedId,properties:e?.properties?.map(e=>({...e}))??S.map(e=>({...e})),borrowedSourceId:e?.sourceId},this.allowedAttributes=e?.allowedAttributes??null}}this.step=`detail`,this.updateComplete.then(()=>this.renderRoot.querySelector(`sl-input[name="layername"]`)?.focus())}goBack(){this.step=`select`}addProperty(){this.newPropName.trim()&&(this.layer={...this.layer,properties:[...this.layer.properties,{name:this.newPropName.trim(),type:this.newPropType}]},this.newPropName=``,this.newPropType=`string`)}removeProperty(e){let t=[...this.layer.properties];t.splice(e,1),this.layer={...this.layer,properties:t}}confirm(){let e=this.renderRoot.querySelector(`sl-input[name="layername"]`)?.value?.trim()??this.layer.name;if(!e){this.nameError=!0,this.requestUpdate();return}this.nameError=!1;let t=this.newPropName.trim(),n=t?[...this.layer.properties,{name:t,type:this.newPropType}]:[...this.layer.properties],r={...this.layer,name:e,properties:n};this.dispatchEvent(new CustomEvent(`webmapx-draw-layer-confirm`,{detail:r,bubbles:!0,composed:!0})),this.dialog.hide()}cancel(){this.dispatchEvent(new CustomEvent(`webmapx-draw-layer-cancel`,{bubbles:!0,composed:!0})),this.dialog.hide()}renderSelectStep(){let e=this.geometryType===`LineString`?`Line`:this.geometryType;return o`
            <div class="layer-list">
                <button type="button" class="layer-option ${this.selectedId===`new`?`selected`:``}"
                     aria-pressed=${this.selectedId===`new`}
                     @click=${()=>this.selectOption(`new`)}
                     @dblclick=${()=>{this.selectOption(`new`),this.goToDetail()}}>
                    <span class="new-icon">＋</span>
                    <span>New ${e} layer</span>
                </button>
                ${this.existingLayers.map(e=>o`
                    <button type="button" class="layer-option ${this.selectedId===e.id?`selected`:``}"
                         aria-pressed=${this.selectedId===e.id}
                         @click=${()=>this.selectOption(e.id)}
                         @dblclick=${()=>{this.selectOption(e.id),this.goToDetail()}}>
                        <span class="color-dot" style="background:${e.color}"></span>
                        <span>${e.name}</span>
                    </button>
                `)}
                ${this.mapLayers.length>0?o`
                    <div style="font-size:0.72rem;color:var(--color-text-muted, #6b7681);padding:0.4rem 0.2rem 0.1rem;text-transform:uppercase;letter-spacing:0.05em">Map layers</div>
                    ${this.mapLayers.map(e=>o`
                        <button type="button" class="layer-option ${this.selectedId===e.layerId?`selected`:``}"
                             aria-pressed=${this.selectedId===e.layerId}
                             @click=${()=>this.selectOption(e.layerId)}
                             @dblclick=${()=>{this.selectOption(e.layerId),this.goToDetail()}}>
                            <span class="new-icon" style="color:var(--sl-color-warning-600)">✎</span>
                            <span>${e.label}</span>
                            <span style="font-size:0.7rem;color:var(--color-text-muted, #6b7681);margin-left:auto">map layer</span>
                        </button>
                    `)}
                `:``}
            </div>
            <div class="footer">
                <sl-button @click=${this.cancel}>Cancel</sl-button>
                <sl-button autofocus variant="primary" @click=${this.goToDetail}>Next →</sl-button>
            </div>
        `}renderDetailStep(){let e=x[this.geometryType],t={longitude:`longitude (auto)`,latitude:`latitude (auto)`,area:`area (auto)`,perimeter:`perimeter (auto)`,length:`length (auto)`,linkURL:`link URL`,imageURL:`image URL`,"create-time":`create-time (auto)`,"update-time":`update-time (auto)`};return o`
            <div class="name-input-row">
                <sl-input name="layername"
                    style="flex:1"
                    placeholder="Layer name"
                    aria-label="Layer name"
                    value=${this.layer.name}
                    @keydown=${e=>e.key===`Enter`&&this.renderRoot.querySelector(`#new-prop-name`)?.focus()}
                ></sl-input>
                <button type="button" class="color-swatch"
                     style="background:${this.layer.color}"
                     title="Layer color"
                     aria-label="Layer color"
                     @click=${()=>this.renderRoot.querySelector(`input[type=color]`)?.click()}>
                </button>
                <input type="color" style="display:none" .value=${this.layer.color}
                    @input=${e=>{this.layer={...this.layer,color:e.target.value}}}>
            </div>
            ${this.nameError?o`<div class="error-msg">Enter a layer name.</div>`:``}

            <table class="prop-table">
                <thead>
                    <tr><th>Property</th><th>Type</th><th style="width:2rem"></th></tr>
                </thead>
                <tbody>
                    ${this.layer.properties.map((e,t)=>o`
                        <tr class="${e.name===`id`?`prop-row-auto`:``}">
                            <td>${e.name}</td>
                            <td class="${[`string`,`number`,`linkURL`,`imageURL`].includes(e.type)?``:`type-computed`}">${e.type}${e.name===`id`?` (auto)`:``}</td>
                            <td>
                                ${t===0?``:o`
                                    <sl-icon-button name="x" label="Remove property ${e.name}" @click=${()=>this.removeProperty(t)}></sl-icon-button>
                                `}
                            </td>
                        </tr>
                    `)}
                    <tr class="add-row">
                        <td>
                            ${this.allowedAttributes?o`
                                <sl-select id="new-prop-name" size="small" aria-label="Property name"
                                    .value=${this.newPropName}
                                    @sl-change=${e=>this.newPropName=e.target.value}>
                                    <sl-option value="">— select —</sl-option>
                                    ${this.allowedAttributes.filter(e=>!this.layer.properties.find(t=>t.name===e)).map(e=>o`<sl-option value=${e}>${e}</sl-option>`)}
                                </sl-select>
                            `:o`
                                <sl-input id="new-prop-name" size="small" placeholder="property name" aria-label="Property name"
                                    .value=${this.newPropName}
                                    @sl-input=${e=>this.newPropName=e.target.value}
                                    @keydown=${e=>e.key===`Enter`&&this.addProperty()}>
                                </sl-input>
                            `}
                        </td>
                        <td>
                            <sl-select id="new-prop-type" size="small" .value=${this.newPropType}
                                @sl-change=${e=>this.newPropType=e.target.value}>
                                ${e.map(e=>o`<sl-option value=${e}>${t[e]??e}</sl-option>`)}
                            </sl-select>
                        </td>
                        <td>
                            <sl-icon-button name="plus" label="Add property" @click=${this.addProperty}></sl-icon-button>
                        </td>
                    </tr>
                </tbody>
            </table>

            <div class="footer">
                <sl-button @click=${this.goBack}>← Back</sl-button>
                <sl-button @click=${this.cancel}>Cancel</sl-button>
                <sl-button variant="primary" @click=${this.confirm}>OK</sl-button>
            </div>
        `}render(){let e=this.geometryType===`LineString`?`Line`:this.geometryType;return _(o`
                <sl-dialog label="${this.step===`select`?`Select ${e} layer`:`Configure ${e} layer`}"
                           @sl-request-close=${e=>{e.detail?.source===`overlay`&&this.cancel()}}>
                    ${this.step===`select`?this.renderSelectStep():this.renderDetailStep()}
                </sl-dialog>
        `)}};m([r({type:String})],T.prototype,`geometryType`,void 0),m([r({attribute:!1})],T.prototype,`existingLayers`,void 0),m([r({attribute:!1})],T.prototype,`mapLayers`,void 0),m([i()],T.prototype,`step`,void 0),m([i()],T.prototype,`selectedId`,void 0),m([i()],T.prototype,`layer`,void 0),m([i()],T.prototype,`nameError`,void 0),m([i()],T.prototype,`newPropName`,void 0),m([i()],T.prototype,`newPropType`,void 0),m([i()],T.prototype,`allowedAttributes`,void 0),m([e(`sl-dialog`)],T.prototype,`dialog`,void 0),T=m([n(`webmapx-draw-layer-dialog`)],T);var E=`webmapx-draw-rubber-source`,D=`webmapx-draw-rubber-line`,O=`webmapx-draw-vertex-source`,k=`webmapx-draw-vertex-layer`,A=`geom`;function j(e,t){return t===`Polygon`?`${e}:${A}`:`webmapx-draw-src-${e}`}function M(e){return`${e}-map`}function N(e,t,n,r){if(t.type===`Polygon`)return{id:e,type:`style`,version:8,title:t.name,metadata:r,sources:{[A]:{type:`geojson`,data:{type:`FeatureCollection`,features:[]}}},layers:[{id:`${e}-fill`,type:`fill`,source:A,metadata:{label:`Fill`},paint:{"fill-color":n,"fill-opacity":.35}},{id:`${e}-line`,type:`line`,source:A,metadata:{label:`Line`},paint:{"line-color":n,"line-width":2}}]};let i=j(e,t.type);return t.type===`LineString`?{id:e,type:`line`,source:i,title:t.name,metadata:r,paint:{"line-color":n,"line-width":2}}:{id:e,type:`circle`,source:i,title:t.name,metadata:r,paint:{"circle-radius":6,"circle-color":n,"circle-stroke-width":2,"circle-stroke-color":`#fff`}}}var P=`#888888`,F=`#ff3b30`,I=10,L=`webmapx-draw-sel-source`,R=`webmapx-draw-sel-point`,z=`webmapx-draw-draft-source`,B=`webmapx-draw-draft-points`,V=`webmapx-draw-edit-vert-source`,H=`webmapx-draw-edit-vert`,U=`webmapx-draw-edit-mid-source`,W=`webmapx-draw-edit-mid`,G=`webmapx-draw-sel-vert-source`,K=`webmapx-draw-sel-vert`,q=12,J=`webmapx-draw-snap-source`,Y=`webmapx-draw-snap-layer`,ne=16,X=1,Z=class extends te{constructor(...e){super(...e),this.toolId=`draw`,this.mode=`select`,this.drawLayers=[],this.features=[],this.selectedFeatureId=null,this.helpText=``,this.pendingMode=null,this.uiVersion=0,this.draftPoints=[],this.draftRedoStack=[],this.cursorPos=null,this.circleDraft=null,this.activeLayerIds={},this.history=[],this.historyIndex=-1,this.sharedLayersCreated=!1,this.createdDrawLayerIds=new Set,this.touchMQ=window.matchMedia(`(pointer: coarse)`),this.isTouchDevice=this.touchMQ.matches,this.onTouchMQChange=e=>{this.isTouchDevice=e.matches},this.snapEnabled=!0,this.altActive=!1,this.snapPos=null,this.lastCursorPx=null,this.editState=`none`,this.editHandles=[],this.hoveredHandle=null,this.dragging=null,this.selectedHandle=null,this.featureDrag=null,this.unsubClick=null,this.unsubMove=null,this.moveRafId=null,this.pendingMoveEvent=null,this.unsubCtx=null,this.unsubDown=null,this.unsubUp=null,this.exportFilename=`draw-export`,this.exportMode=`combined`,this.pendingSourceRefresh=new Map,this.onKeyDown=e=>{if(this.isRelevantTarget(e)){if(e.key===`Alt`){e.preventDefault(),this.altActive||(this.altActive=!0,this.snapPos=null,this.updateRubberband(),this.updateSnapIndicator());return}if(!this.isTypingTarget(e)){if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()===`z`){e.preventDefault(),this.undoOrDraftBack();return}if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()===`y`){e.preventDefault(),this.redoOrDraftForward();return}(e.key===`Delete`||e.key===`Backspace`)&&(this.draftPoints.length>0?(e.preventDefault(),this.removeLastDraftPoint()):this.selectedHandle?(e.preventDefault(),this.deleteSelectedVertex()):this.selectedFeatureId&&(e.preventDefault(),this.deleteSelected()))}}},this.onWindowBlur=()=>{this.altActive&&(this.altActive=!1,(this.mode===`draw-point`||this.mode===`draw-line`||this.mode===`draw-polygon`)&&this.updateRubberband())},this.onKeyUp=e=>{e.key===`Alt`&&(this.altActive=!1,(this.mode===`draw-point`||this.mode===`draw-line`||this.mode===`draw-polygon`)&&this.updateRubberband())}}connectedCallback(){super.connectedCallback(),this.touchMQ.addEventListener(`change`,this.onTouchMQChange)}get effectiveSnap(){return this.snapEnabled&&!this.altActive}static{this.styles=a`
        :host {
            display: flex;
            flex-direction: column;
            padding: var(--webmapx-tool-padding, 0);
            min-width: 200px;
            max-height: var(--webmapx-draw-tool-max-height, 100%);
            overflow: hidden;
        }

        .scroll-content {
            flex: 1;
            overflow-y: auto;
            min-height: 0;
        }

        .toolbar {
            display: flex;
            gap: 0.25rem;
            flex-wrap: wrap;
            margin-bottom: 0.5rem;
            flex-shrink: 0;
        }

        /* Sized and coloured like the sl-icon-buttons beside it. */
        .toggle-button {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            font-size: var(--sl-font-size-large, 1.25rem);
            padding: var(--sl-spacing-x-small, 0.5rem);
            border: none;
            border-radius: 4px;
            background: none;
            color: var(--sl-color-neutral-600, #5a6773);
            cursor: pointer;
        }
        .toggle-button:hover {
            color: var(--color-primary, #2b6c8f);
        }
        .toggle-button:focus-visible {
            outline: var(--webmapx-focus-ring, 2px solid var(--color-primary, #2b6c8f));
            outline-offset: var(--webmapx-focus-offset, 2px);
        }
        .toggle-button[aria-pressed="true"] {
            color: var(--color-primary, #2b6c8f);
            background: var(--color-primary-soft, rgba(43, 108, 143, 0.12));
        }

        .help {
            font-size: 0.8rem;
            color: var(--color-text-secondary, #5a6773);
            margin-bottom: 0.5rem;
            min-height: 2.5em;
        }

        .layers-section {
            margin-top: 0.5rem;
        }

        .section-label {
            font-size: 0.7rem;
            text-transform: uppercase;
            letter-spacing: 0.06em;
            color: var(--color-text-muted, #6b7681);
            margin-bottom: 0.25rem;
        }

        .layer-row {
            display: flex;
            align-items: center;
            gap: 0.4rem;
            padding: 0.2rem 0.4rem;
            border-radius: 4px;
            font-size: 0.85rem;
        }

        /* The row itself holds a remove button, so the "switch layer" affordance
           is its own button rather than a click handler on the row. */
        .layer-select-btn {
            display: flex;
            flex: 1;
            min-width: 0;
            align-items: center;
            gap: 0.4rem;
            padding: 0;
            border: 0;
            background: transparent;
            font: inherit;
            color: inherit;
            text-align: left;
            cursor: pointer;
        }

        .layer-row:hover {
            background: var(--color-background-secondary, #f4f6f8);
        }

        .remove-layer-btn {
            font-size: 0.75rem;
            opacity: 0;
            transition: opacity var(--webmapx-motion-fast, 120ms);
        }

        .layer-row:hover .remove-layer-btn,
        .layer-row:focus-within .remove-layer-btn {
            opacity: 1;
        }

        .color-dot {
            width: 10px; height: 10px;
            border-radius: 50%;
            flex-shrink: 0;
        }

        .layer-name { flex: 1; }

        .layer-type {
            font-size: 0.7rem;
            color: var(--color-text-muted, #6b7681);
        }

        .features-section {
            margin-top: 0.25rem;
            max-height: 180px;
            overflow-y: auto;
        }

        .feature-row {
            display: flex;
            align-items: center;
            gap: 0.4rem;
            padding: 0.2rem 0.6rem;
            border-radius: 4px;
            cursor: pointer;
            font-size: 0.82rem;
        }

        .feature-row:hover { background: var(--color-background-secondary, #f4f6f8); }
        .feature-row.selected { background: var(--sl-color-primary-100); }

        .divider {
            width: 1px; height: 1.2rem;
            background: var(--color-background-secondary, #f4f6f8);
            margin: 0 0.1rem;
        }

        .prop-row { display: flex; gap: 0.4rem; align-items: center; font-size: 0.82rem; margin-bottom: 0.2rem; }
        .prop-label { width: 80px; color: var(--color-text-muted, #6b7681); flex-shrink: 0; }
        .prop-value { flex: 1; min-width: 0; }
        .prop-link { display: block; width: 100%; font-size: 0.75rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .prop-img { max-width: 100%; max-height: 80px; border-radius: 3px; object-fit: cover; }
        .prop-img-error { font-size: 0.75rem; color: var(--sl-color-danger-600, #c0392b); font-style: italic; }
        .prop-url-wrap { flex: 1; min-width: 0; overflow: hidden; display: flex; flex-direction: column; gap: 0.2rem; }
    `}onActivate(){if(this.adapter?.store.getState().mapLoaded)this.createSharedLayers();else{let e=this.adapter?.store.subscribe(t=>{t.mapLoaded&&(e?.(),this.createSharedLayers())})}for(let e of this.drawLayers)this.createdDrawLayerIds.has(e.id)||(this.addMapLayersForDrawLayer(e),this.refreshDrawLayerSource(e.id)),e.borrowedSourceId&&(this.adapter?.getSource(e.borrowedSourceId)?.setData({type:`FeatureCollection`,features:[]}),this.setBorrowedLayerMetadata(e.borrowedSourceId,{borrowedByDrawTool:!0}));for(let e of[E,O,L,z,V,U,G,J])this.dispatchEvent(new CustomEvent(`webmapx-suppress-busy-for-source`,{detail:e,bubbles:!0,composed:!0}));this.bindEvents(),window.addEventListener(`keydown`,this.onKeyDown,!0),window.addEventListener(`keyup`,this.onKeyUp),window.addEventListener(`blur`,this.onWindowBlur),this.setModeInternal(`select`)}onDeactivate(){for(let e of[E,O,L,z,V,U,G,J])this.dispatchEvent(new CustomEvent(`webmapx-unsuppress-busy-for-source`,{detail:e,bubbles:!0,composed:!0}));this.moveRafId!==null&&(cancelAnimationFrame(this.moveRafId),this.moveRafId=null);for(let[,e]of this.pendingSourceRefresh)cancelAnimationFrame(e);this.pendingSourceRefresh.clear(),this.pendingMoveEvent=null,this.unbindEvents(),window.removeEventListener(`keydown`,this.onKeyDown,!0),window.removeEventListener(`keyup`,this.onKeyUp),window.removeEventListener(`blur`,this.onWindowBlur),this.altActive=!1;for(let e of this.drawLayers)e.borrowedSourceId&&this.restoreBorrowedLayer(e),this.suspendDrawLayerFromMap(e);this.draftPoints=[],this.circleDraft=null,this.cursorPos=null,this.snapPos=null,this.lastCursorPx=null,this.dragging=null,this.featureDrag=null,this.selectedFeatureId=null,this.editState=`none`,this.editHandles=[],this.hoveredHandle=null,this.adapter?.setPanEnabled(!0),this.adapter?.setDoubleClickZoomEnabled(!0),this.updateSelectedSource(),this.removeSharedLayers(),this.adapter?.setCursor(``)}disconnectedCallback(){this.touchMQ.removeEventListener(`change`,this.onTouchMQChange),this.removeAllMapLayers(),super.disconnectedCallback()}onMapAttached(e){super.onMapAttached(e)}onMapDetached(){this.removeAllMapLayers(),super.onMapDetached()}createSharedLayers(){if(!this.sharedLayersCreated){this.dispatch(`webmapx-add-source`,{id:E,config:{type:`geojson`,data:{type:`FeatureCollection`,features:[]}}}),this.dispatch(`webmapx-add-source`,{id:O,config:{type:`geojson`,data:{type:`FeatureCollection`,features:[]}}}),this.dispatch(`webmapx-add-layer`,{id:D,type:`line`,source:E,metadata:{isToolLayer:!0,hideFromLegend:!0},paint:{"line-color":y,"line-width":2,"line-dasharray":[4,4]}}),this.dispatch(`webmapx-add-layer`,{id:k,type:`circle`,source:O,metadata:{isToolLayer:!0,hideFromLegend:!0},paint:{"circle-radius":8,"circle-color":`transparent`,"circle-stroke-width":2,"circle-stroke-color":`#ff6600`}}),this.dispatch(`webmapx-add-source`,{id:L,config:{type:`geojson`,data:{type:`FeatureCollection`,features:[]}}}),this.dispatch(`webmapx-add-layer`,{id:R,type:`circle`,source:L,metadata:{isToolLayer:!0,hideFromLegend:!0},paint:{"circle-radius":I,"circle-color":this.cssVar(`--webmapx-draw-selected-color`,F)}}),this.dispatch(`webmapx-add-source`,{id:z,config:{type:`geojson`,data:{type:`FeatureCollection`,features:[]}}}),this.dispatch(`webmapx-add-layer`,{id:B,type:`circle`,source:z,metadata:{isToolLayer:!0,hideFromLegend:!0},paint:{"circle-radius":5,"circle-color":b,"circle-stroke-width":2,"circle-stroke-color":y}}),this.dispatch(`webmapx-add-source`,{id:V,config:{type:`geojson`,data:{type:`FeatureCollection`,features:[]}}}),this.dispatch(`webmapx-add-layer`,{id:H,type:`circle`,source:V,metadata:{isToolLayer:!0,hideFromLegend:!0},paint:{"circle-radius":6,"circle-color":b,"circle-stroke-width":2,"circle-stroke-color":y}}),this.dispatch(`webmapx-add-source`,{id:U,config:{type:`geojson`,data:{type:`FeatureCollection`,features:[]}}}),this.dispatch(`webmapx-add-layer`,{id:W,type:`circle`,source:U,metadata:{isToolLayer:!0,hideFromLegend:!0},paint:{"circle-radius":4,"circle-color":b,"circle-stroke-width":1.5,"circle-stroke-color":y,"circle-opacity":.7}}),this.dispatch(`webmapx-add-source`,{id:G,config:{type:`geojson`,data:{type:`FeatureCollection`,features:[]}}}),this.dispatch(`webmapx-add-layer`,{id:K,type:`circle`,source:G,metadata:{isToolLayer:!0,hideFromLegend:!0},paint:{"circle-radius":I,"circle-color":this.cssVar(`--webmapx-draw-selected-color`,F),"circle-stroke-width":2,"circle-stroke-color":`#fff`}}),this.dispatch(`webmapx-add-source`,{id:J,config:{type:`geojson`,data:{type:`FeatureCollection`,features:[]}}}),this.dispatch(`webmapx-add-layer`,{id:Y,type:`circle`,source:J,metadata:{isToolLayer:!0,hideFromLegend:!0},paint:{"circle-radius":7,"circle-color":`#ffdd00`,"circle-stroke-width":2,"circle-stroke-color":`#fff`,"circle-opacity":.9}}),this.sharedLayersCreated=!0;for(let e of this.drawLayers)this.addMapLayersForDrawLayer(e),this.refreshDrawLayerSource(e.id)}}addMapLayersForDrawLayer(e){this.createdDrawLayerIds.has(e.id)||(e.type!==`Polygon`&&this.dispatch(`webmapx-add-source`,{id:j(e.id,e.type),config:{type:`geojson`,data:{type:`FeatureCollection`,features:[]}}}),this.dispatch(`webmapx-add-layer`,N(e.id,e,e.color,{label:e.name,legendRole:`overlay`,hideFromLegend:!0})),this.createdDrawLayerIds.add(e.id))}removeMapLayersForDrawLayer(e){this.dispatch(`webmapx-remove-layer`,e.id),this.dispatch(`webmapx-remove-source`,j(e.id,e.type)),this.adapter?.store&&p(this.adapter.store,e.id),this.createdDrawLayerIds.delete(e.id)}removeSharedLayers(){for(let e of[D,k,R,B,H,W,K,Y])this.dispatch(`webmapx-remove-layer`,e);for(let e of[E,O,L,z,V,U,G,J])this.dispatch(`webmapx-remove-source`,e);this.sharedLayersCreated=!1}removeAllMapLayers(){this.removeSharedLayers();for(let e of this.drawLayers)this.removeMapLayersForDrawLayer(e);this.createdDrawLayerIds.clear()}refreshDrawLayerSource(e){this.pendingSourceRefresh.has(e)||this.pendingSourceRefresh.set(e,requestAnimationFrame(()=>{this.pendingSourceRefresh.delete(e),this.flushDrawLayerSource(e)}))}flushDrawLayerSource(e){let t=this.features.filter(t=>t.layerId===e).map(e=>({type:`Feature`,id:e.id,geometry:{type:e.type,coordinates:e.coordinates},properties:e.properties})),n=this.drawLayers.find(t=>t.id===e)?.type??`Polygon`;this.dispatch(`webmapx-set-source-data`,{id:j(e,n),data:{type:`FeatureCollection`,features:t}});let r=this.drawLayers.find(t=>t.id===e);if(r?.borrowedSourceId&&this.adapter?.store){let e={type:`FeatureCollection`,features:t};this.setBorrowedLayerMetadata(r.borrowedSourceId,{sourceData:e})}}setBorrowedLayerMetadata(e,t){if(!this.adapter?.store)return;let n=this.adapter.store.getState().mapLayers??{},[r,i]=Object.entries(n).find(([,t])=>t.sourceId===e)??[];r&&i&&this.adapter.store.dispatch({mapLayers:{...n,[r]:{...i,...t}}},`MAP`)}cssVar(e,t){return getComputedStyle(this).getPropertyValue(e).trim()||t}get modKey(){return/Mac|iPhone|iPad/.test(navigator.platform)?`Cmd`:`Ctrl`}isTypingTarget(e){let t=e.composedPath()[0],n=t?.tagName?.toLowerCase();return n===`input`||n===`textarea`||n===`sl-input`||n===`sl-textarea`||t?.isContentEditable===!0}isRelevantTarget(e){let t=e.composedPath(),n=this.mapHost;if(t.includes(this)||n&&t.includes(n))return!0;let r=t[0];return r===document.body||r===document.documentElement}bindEvents(){this.adapter&&(this.unsubClick=this.adapter.events.on(`click`,e=>this.handleClick(e)),this.unsubMove=this.adapter.events.on(`pointer-move`,e=>{this.pendingMoveEvent=e,this.moveRafId===null&&(this.moveRafId=requestAnimationFrame(()=>{this.moveRafId=null,this.pendingMoveEvent&&this.handlePointerMove(this.pendingMoveEvent),this.pendingMoveEvent=null}))}),this.unsubCtx=this.adapter.events.on(`contextmenu`,e=>this.handleContextMenu(e)),this.unsubDown=this.adapter.events.on(`pointer-down`,e=>this.handlePointerDown(e)),this.unsubUp=this.adapter.events.on(`pointer-up`,e=>this.handlePointerUp(e)))}unbindEvents(){this.unsubClick?.(),this.unsubClick=null,this.unsubMove?.(),this.unsubMove=null,this.unsubCtx?.(),this.unsubCtx=null,this.unsubDown?.(),this.unsubDown=null,this.unsubUp?.(),this.unsubUp=null}async requestDrawMode(e){let t=Q(e);if(!t){this.setModeInternal(e);return}if(this.activeLayerIds[t]){this.setModeInternal(e);return}await this.openLayerDialog(e)}async openLayerDialog(e){let t=Q(e);if(!t)return;this.pendingMode=e;let n=this.drawLayers.filter(e=>e.type===t&&!e.borrowedSourceId),r=this.adapter?await this.getEditableMapLayers(t):[],i=this.activeLayerIds[t],a=this.drawLayers.find(e=>e.id===i&&e.borrowedSourceId),o=a?.borrowedSourceId,s=o?r.find(e=>e.sourceId===o)?.layerId:void 0;if(a&&s){let e=r.find(e=>e.layerId===s);e&&(e.properties=a.properties.map(e=>({...e})))}this.layerDialog.geometryType=t,this.layerDialog.existingLayers=n,this.layerDialog.mapLayers=r,this.layerDialog.open(),s&&(this.layerDialog.selectedId=s)}async getEditableMapLayers(e){if(!this.adapter)return[];let t=this.adapter.store.getState().mapLayers??{},n=new Set,r=[],i=this.activeLayerIds[e],a=new Set(this.drawLayers.filter(e=>e.borrowedSourceId&&e.id!==i).map(e=>e.borrowedSourceId));for(let[i,o]of Object.entries(t)){if(o.isToolLayer||this.createdDrawLayerIds.has(i))continue;let t=typeof o.sourceId==`string`?o.sourceId:null;if(!t||n.has(t)||a.has(t))continue;let s=this.adapter.getSourceData(t);if(!s)continue;let c=await this.resolveFeatureCollection(s);if(typeof s==`string`){let a=c?.features[0]?.geometry?.type,s=a?this.geometryFamilyForGeoJSONType(a):null,l=this.geometryFamilyForLayerType(o.layerType);if((s??l)!==e)continue;n.add(t),r.push({layerId:i,sourceId:t,label:o.label??i,properties:o.properties??(c?this.inferPropertyDefs(c):void 0),allowedAttributes:o.attributes?.allowedAttributes??void 0});continue}let l=s.features[0]?.geometry?.type,u=l?this.geometryFamilyForGeoJSONType(l):null,d=this.geometryFamilyForLayerType(o.layerType);(u??d)===e&&(n.add(t),r.push({layerId:i,sourceId:t,label:o.label??i,properties:o.properties??this.inferPropertyDefs(s),allowedAttributes:o.attributes?.allowedAttributes??void 0}))}return r}async resolveFeatureCollection(e){if(typeof e!=`string`)return e;try{let t=await fetch(e);return t.ok?await t.json():null}catch{return null}}geometryFamilyForGeoJSONType(e){return e===`Point`||e===`MultiPoint`?`Point`:e===`LineString`||e===`MultiLineString`?`LineString`:e===`Polygon`||e===`MultiPolygon`?`Polygon`:null}geometryFamilyForLayerType(e){return e===`circle`?`Point`:e===`line`?`LineString`:e===`fill`?`Polygon`:null}inferPropertyDefs(e){let t=e.features.find(e=>e.properties&&Object.keys(e.properties).length>0)?.properties;return t?Object.entries(t).map(([e,t])=>({name:e,type:typeof t==`number`?`number`:`string`})):[{name:`id`,type:`number`},{name:`name`,type:`string`}]}setModeInternal(e){switch(this.circleDraft&&(this.circleDraft=null,this.adapter?.setPanEnabled(!0)),this.mode=e,this.draftPoints=[],this.cursorPos=null,this.snapPos=null,this.lastCursorPx=null,this.updateRubberband(),e){case`select`:this.adapter?.setDoubleClickZoomEnabled(!0),this.adapter?.setCursor(``),this.editState=`none`,this.editHandles=[],this.updateEditHandles(),this.helpText=`Click a feature to select it.`;break;case`draw-point`:case`draw-line`:case`draw-polygon`:case`draw-circle`:this.adapter?.setDoubleClickZoomEnabled(!1),this.editState=`none`,this.editHandles=[],this.hoveredHandle=null,this.selectedFeatureId=null,this.updateEditHandles(),this.updateSelectedSource(),this.adapter?.setCursor(`crosshair`),this.helpText=this.mode===`draw-point`?`Click to place a point.`:this.mode===`draw-line`?`Click to add vertices. Right-click or double-click to finish.`:this.mode===`draw-circle`?`Click and drag to draw a circle.`:`Click to add vertices. Click first point or double-click to close.`;break}}async handleLayerConfirm(e){let t=e.detail,n=this.activeLayerIds[t.type];if(n&&n!==t.id){let e=this.drawLayers.find(e=>e.id===n);e&&this.releaseLayer(e)}let r=this.drawLayers.findIndex(e=>e.id===t.id);if(r>=0)this.drawLayers=this.drawLayers.map((e,n)=>n===r?t:e);else if(t.borrowedSourceId||(t={...t,borrowedSourceId:this.createPermLayer(t)}),this.drawLayers=[...this.drawLayers,t],this.addMapLayersForDrawLayer(t),t.borrowedSourceId&&this.adapter){let e=this.adapter.getSourceData(t.borrowedSourceId),n=e?await this.resolveFeatureCollection(e):null;if(n){let e=[];for(let r of n.features){if(!r.geometry||!re(r.geometry.type))continue;let n={...r.properties};e.push({id:this.newId(),layerId:t.id,type:r.geometry.type,coordinates:r.geometry.coordinates,properties:n})}if(this.features=[...this.features,...e],t.properties.length<=2){let e=this.inferPropertyDefs(n);t={...t,properties:e},this.drawLayers=this.drawLayers.map(e=>e.id===t.id?t:e)}}this.adapter.getSource(t.borrowedSourceId)?.setData({type:`FeatureCollection`,features:[]}),this.setBorrowedLayerMetadata(t.borrowedSourceId,{borrowedByDrawTool:!0})}this.activeLayerIds[t.type]=t.id,this.refreshDrawLayerSource(t.id);let i=M(t.id);if(this.adapter?.store){let e=this.adapter.store.getState().mapLayers??{},n=e[i];n&&this.adapter.store.dispatch({mapLayers:{...e,[i]:{...n,properties:t.properties}}},`MAP`)}this.pendingMode&&=(this.setModeInternal(this.pendingMode),null)}restoreBorrowedLayer(e){if(!e.borrowedSourceId||!this.adapter)return;let t={type:`FeatureCollection`,features:this.features.filter(t=>t.layerId===e.id).map(e=>({type:`Feature`,geometry:{type:e.type,coordinates:e.coordinates},properties:{...e.properties}}))};this.adapter.getSource(e.borrowedSourceId)?.setData(t),this.setBorrowedLayerMetadata(e.borrowedSourceId,{borrowedByDrawTool:!1,sourceData:t})}createPermLayer(e){let t=M(e.id);return e.type!==`Polygon`&&this.dispatch(`webmapx-add-source`,{id:j(t,e.type),config:{type:`geojson`,data:{type:`FeatureCollection`,features:[]}}}),this.dispatch(`webmapx-add-layer`,N(t,e,P,{label:e.name,legendRole:`overlay`,properties:e.properties,borrowedByDrawTool:!0})),j(t,e.type)}releaseBorrowedLayer(e){if(e.borrowedSourceId){this.restoreBorrowedLayer(e),this.removeMapLayersForDrawLayer(e),this.features=this.features.filter(t=>t.layerId!==e.id),this.drawLayers=this.drawLayers.filter(t=>t.id!==e.id);for(let[t,n]of Object.entries(this.activeLayerIds))n===e.id&&delete this.activeLayerIds[t]}}suspendDrawLayerFromMap(e){this.dispatch(`webmapx-remove-layer`,e.id),this.dispatch(`webmapx-remove-source`,j(e.id,e.type)),this.adapter?.store&&p(this.adapter.store,e.id),this.createdDrawLayerIds.delete(e.id)}releaseLayer(e){this.releaseBorrowedLayer(e)}removeFromEditing(e){let t=this.activeLayerIds[e.type]===e.id;this.releaseLayer(e),t&&this.setModeInternal(`select`)}handleLayerCancel(){this.pendingMode=null}handleClick(e){let t=this.effectiveSnap&&this.snapPos?this.snapPos:e.coords,n=Q(this.mode),r=n?this.activeLayerIds[n]:null;if(!(!r&&this.mode!==`select`)){if(this.mode===`draw-point`){this.commitFeature({id:this.newId(),layerId:r,type:`Point`,coordinates:t,properties:this.defaultProperties(r)});return}if(this.mode===`draw-line`||this.mode===`draw-polygon`){if(this.draftPoints.length>=2){let e=this.draftPoints[this.draftPoints.length-1];if(this.withinPixelThreshold(t,e,10)||this.mode===`draw-polygon`&&this.withinPixelThreshold(t,this.draftPoints[0],14)){this.finishDraft(r);return}}this.draftPoints.length===0&&this.selectedFeatureId&&(this.selectedFeatureId=null,this.editState=`none`,this.editHandles=[],this.updateSelectedSource(),this.updateEditHandles()),this.draftPoints.push(t),this.draftRedoStack=[],this.uiVersion++,this.updateRubberband(),this.updateHelpTextDuring();return}if(this.mode===`select`){let e=this.adapter.project(t),n=[e[0],e[1]],r=this.findFeatureAt(n,t);r&&r.id===this.selectedFeatureId&&this.editState===`selected`&&(ie(r.type)||ae(r.type))?this.enterEditMode(r.id):r&&r.id===this.selectedFeatureId&&this.editState===`editing`||(r?(this.selectedFeatureId=r.id,this.editState=$(r.type)?`editing`:`selected`,this.editState===`selected`?this.helpText=`Click again to edit vertices.`:$(r.type)&&(this.helpText=`Drag to move point.`),this.updateSelectedSource(),this.updateEditHandles(),this.requestUpdate()):this.editState===`editing`?(this.editState=`selected`,this.updateEditHandles(),this.requestUpdate()):(this.selectedFeatureId=null,this.editState=`none`,this.updateSelectedSource(),this.updateEditHandles(),this.requestUpdate()))}}}handlePointerMove(e){if(this.cursorPos=e.coords,this.circleDraft){this.updateCircleDraft(e.coords);return}if(this.featureDrag){let t=this.features.find(e=>e.id===this.featureDrag.featureId);if(t){let n=e.coords[0]-this.featureDrag.startCoords[0],r=e.coords[1]-this.featureDrag.startCoords[1];t.coordinates=this.translateCoordsGeoPreserving(this.featureDrag.origCoords,t.type,n,r,this.featureDrag.origCentroidLng,this.featureDrag.origCentroidLat),this.refreshDrawLayerSource(t.layerId),this.updateEditHandles(),this.updateSelectedSource()}return}if(this.dragging){let t=this.features.find(e=>e.id===this.dragging.handle.featureId);if(t){let n=e.coords;if(this.effectiveSnap&&this.features.length>0){let r=this.adapter.project(e.coords),i=this.computeSnapExcluding([r[0],r[1]],this.dragging.handle.featureId,$(t.type));this.snapPos=i,i&&(n=i)}else this.snapPos=null;this.applyDragMove(t,this.dragging.handle,n),this.dragging.lastCoords=e.coords,this.refreshDrawLayerSource(t.layerId),this.updateEditHandles(),this.updateSelectedSource(),this.updateSnapIndicator();let r=this.dragging.handle;this.selectedHandle&&r.kind===`vertex`&&this.selectedHandle.featureId===r.featureId&&this.selectedHandle.partIdx===r.partIdx&&this.selectedHandle.ringIdx===r.ringIdx&&this.selectedHandle.vertIdx===r.vertIdx&&(this.selectedHandle.coords=r.coords,this.updateSelectedVertexSource())}return}if(this.mode===`draw-point`||this.mode===`draw-line`||this.mode===`draw-polygon`){if(this.effectiveSnap&&this.features.length>0){let t=this.adapter.project(e.coords),n=[t[0],t[1]];(!this.lastCursorPx||Math.hypot(n[0]-this.lastCursorPx[0],n[1]-this.lastCursorPx[1])>.5)&&(this.lastCursorPx=n,this.snapPos=this.computeSnap(n))}else this.snapPos=null;this.updateRubberband();return}if(this.mode===`select`){let t=this.adapter.project(e.coords),n=this.findFeatureAt([t[0],t[1]],e.coords);this.editState===`selected`&&this.selectedFeatureId?this.adapter?.setCursor(n?.id===this.selectedFeatureId?`grab`:``):this.editState===`none`&&this.adapter?.setCursor(n?`pointer`:``)}if(this.mode===`select`&&this.editState===`editing`&&this.editHandles.length>0){let t=this.adapter.project(e.coords),n=this.findHandleAt([t[0],t[1]]);n!==this.hoveredHandle&&(this.hoveredHandle=n,this.adapter?.setCursor(n?`grab`:``))}}handlePointerDown(e){if(e.button!==0)return;if(this.mode===`draw-circle`){this.startCircleDraft(e.coords);return}if(this.editState===`selected`&&this.selectedFeatureId){let t=[e.pixel[0],e.pixel[1]],n=this.findFeatureAt(t,e.coords);if(n&&n.id===this.selectedFeatureId){let t=this.centroid(n);this.featureDrag={featureId:n.id,startCoords:e.coords,origCoords:JSON.parse(JSON.stringify(n.coordinates)),origCentroidLat:t[1],origCentroidLng:t[0]},this.adapter?.setPanEnabled(!1),this.adapter?.setCursor(`grabbing`)}return}if(this.editState!==`editing`)return;let t=[e.pixel[0],e.pixel[1]],n=this.findHandleAt(t);if(!n){this.selectedHandle&&(this.selectedHandle=null,this.updateSelectedVertexSource());return}if(this.selectedHandle=n.kind===`vertex`?n:null,this.updateSelectedVertexSource(),this.dragging={handle:n,lastCoords:e.coords},this.adapter?.setPanEnabled(!1),this.adapter?.setCursor(`grabbing`),n.kind===`midpoint`){let t=this.features.find(e=>e.id===n.featureId);if(t){this.insertVertex(t,n);let r=n.afterVertIdx+1,i={kind:`vertex`,featureId:n.featureId,partIdx:n.partIdx,ringIdx:n.ringIdx,vertIdx:r,coords:n.coords};this.dragging={handle:i,lastCoords:e.coords},this.selectedHandle=i,this.updateSelectedVertexSource(),this.refreshDrawLayerSource(t.layerId),this.updateEditHandles()}}}handlePointerUp(e){if(this.circleDraft){this.finishCircleDraft();return}if(this.featureDrag){let e=this.features.find(e=>e.id===this.featureDrag.featureId);if(e){let t=this.drawLayers.find(t=>t.id===e.layerId);t&&this.computeSpecialProperties(e,t),this.pushHistory({type:`update`,features:[{...e}]}),this.features=[...this.features],this.refreshDrawLayerSource(e.layerId)}this.featureDrag=null,this.adapter?.setPanEnabled(!0),this.adapter?.setCursor(``);return}if(!this.dragging)return;this.snapPos=null,this.updateSnapIndicator(),this.adapter?.setPanEnabled(!0),this.adapter?.setCursor(this.hoveredHandle?`grab`:``);let t=this.features.find(e=>e.id===this.dragging.handle.featureId);if(t){let e=this.drawLayers.find(e=>e.id===t.layerId);e&&this.computeSpecialProperties(t,e),this.pushHistory({type:`update`,features:[{...t}]}),this.features=[...this.features],this.refreshDrawLayerSource(t.layerId)}this.dragging=null}handleContextMenu(e){let t=Q(this.mode),n=t?this.activeLayerIds[t]:null;n&&(this.mode===`draw-line`||this.mode===`draw-polygon`)&&this.finishDraft(n)}defaultProperties(e){let t=this.drawLayers.find(t=>t.id===e);return t?Object.fromEntries(t.properties.map(e=>[e.name,null])):{}}finishDraft(e){let t=this.draftPoints;if(this.mode===`draw-line`&&t.length>=2)this.commitFeature({id:this.newId(),layerId:e,type:`LineString`,coordinates:t.map(e=>[e[0],e[1]]),properties:this.defaultProperties(e)},t);else if(this.mode===`draw-polygon`&&t.length>=3){let n=[...t.map(e=>[e[0],e[1]]),[t[0][0],t[0][1]]];this.commitFeature({id:this.newId(),layerId:e,type:`Polygon`,coordinates:[n],properties:this.defaultProperties(e)},t)}this.draftPoints=[],this.draftRedoStack=[],this.cursorPos=null,this.updateRubberband()}startCircleDraft(e){if(!this.activeLayerIds.Polygon)return;let t=this.effectiveSnap&&this.snapPos?this.snapPos:e;this.circleDraft={center:t,radiusM:0},this.adapter?.setPanEnabled(!1),this.helpText=`Drag to set circle radius.`}updateCircleDraft(e){this.circleDraft&&(this.circleDraft.radiusM=s(this.circleDraft.center,e)/100,this.updateCirclePreview(),this.helpText=`Radius: ${f(this.circleDraft.radiusM*100)}`)}updateCirclePreview(){if(!this.sharedLayersCreated||!this.circleDraft)return;let e=this.circleDraft.radiusM>=X?[{type:`Feature`,geometry:{type:`LineString`,coordinates:c(this.circleDraft.center,this.circleDraft.radiusM)},properties:{}}]:[];this.dispatch(`webmapx-set-source-data`,{id:E,data:{type:`FeatureCollection`,features:e}})}finishCircleDraft(){if(!this.circleDraft)return;let{center:e,radiusM:t}=this.circleDraft;this.circleDraft=null,this.adapter?.setPanEnabled(!0),this.dispatch(`webmapx-set-source-data`,{id:E,data:{type:`FeatureCollection`,features:[]}});let n=this.activeLayerIds.Polygon;n&&t>=X&&this.commitFeature({id:this.newId(),layerId:n,type:`Polygon`,coordinates:[c(e,t)],properties:this.defaultProperties(n)}),this.helpText=`Click and drag to draw a circle.`}computeSnap(e){return this.computeSnapExcluding(e,null,this.mode===`draw-point`)}computeSnapExcluding(e,t,n){return this.adapter?l(e,this.features.filter(e=>e.id!==t&&!(n&&$(e.type))),e=>{let t=this.adapter.project(e);return[t[0],t[1]]},{threshold:ne,edgePenalty:8,unproject:e=>this.adapter.unproject(e)}):null}updateSnapIndicator(){if(!this.sharedLayersCreated)return;let e=this.effectiveSnap&&this.snapPos?[{type:`Feature`,geometry:{type:`Point`,coordinates:this.snapPos},properties:{}}]:[];this.dispatch(`webmapx-set-source-data`,{id:J,data:{type:`FeatureCollection`,features:e}})}updateRubberband(){if(!this.sharedLayersCreated)return;let e=[],t=[],n=this.mode===`draw-point`||this.mode===`draw-line`||this.mode===`draw-polygon`,r=this.effectiveSnap&&this.snapPos?this.snapPos:this.cursorPos;if(n&&this.draftPoints.length>0&&r){let n=[...this.draftPoints.map(e=>[e[0],e[1]]),[r[0],r[1]]];e.push({type:`Feature`,geometry:{type:`LineString`,coordinates:n},properties:{}});for(let e of this.draftPoints)t.push({type:`Feature`,geometry:{type:`Point`,coordinates:[e[0],e[1]]},properties:{}})}this.dispatch(`webmapx-set-source-data`,{id:E,data:{type:`FeatureCollection`,features:e}}),this.dispatch(`webmapx-set-source-data`,{id:z,data:{type:`FeatureCollection`,features:t}});let i=n&&this.effectiveSnap&&this.snapPos?[{type:`Feature`,geometry:{type:`Point`,coordinates:this.snapPos},properties:{}}]:[];this.dispatch(`webmapx-set-source-data`,{id:J,data:{type:`FeatureCollection`,features:i}})}updateSelectedSource(){if(!this.sharedLayersCreated)return;let e=this.features.find(e=>e.id===this.selectedFeatureId),t=e&&$(e.type)?[{type:`Feature`,id:e.id,geometry:{type:e.type,coordinates:e.coordinates},properties:{}}]:[];this.dispatch(`webmapx-set-source-data`,{id:L,data:{type:`FeatureCollection`,features:t}})}enterEditMode(e){this.editState=`editing`,this.helpText=`Drag points to move. Drag midpoints to add a point. Click a point and press Delete to remove it. Click empty to exit.`,this.updateEditHandles(),this.adapter?.setCursor(`default`),this.requestUpdate()}computeHandles(e){let t=[];if(e.type===`Point`)return t.push({kind:`vertex`,featureId:e.id,partIdx:0,ringIdx:0,vertIdx:0,coords:e.coordinates}),t;if(e.type===`MultiPoint`)return e.coordinates.forEach((n,r)=>{t.push({kind:`vertex`,featureId:e.id,partIdx:r,ringIdx:0,vertIdx:0,coords:n})}),t;let n=(n,r,i,a)=>{let o=a?n.length-1:n.length;for(let s=0;s<o;s++){if(t.push({kind:`vertex`,featureId:e.id,partIdx:r,ringIdx:i,vertIdx:s,coords:n[s]}),!a&&s===o-1)continue;let c=(s+1)%o,l=[(n[s][0]+n[c][0])/2,(n[s][1]+n[c][1])/2];t.push({kind:`midpoint`,featureId:e.id,partIdx:r,ringIdx:i,afterVertIdx:s,coords:l})}};return e.type===`LineString`?n(e.coordinates,0,0,!1):e.type===`MultiLineString`?e.coordinates.forEach((e,t)=>n(e,t,0,!1)):e.type===`Polygon`?e.coordinates.forEach((e,t)=>n(e,0,t,!0)):e.type===`MultiPolygon`&&e.coordinates.forEach((e,t)=>{e.forEach((e,r)=>n(e,t,r,!0))}),t}updateEditHandles(){if(!this.sharedLayersCreated)return;let e=this.selectedFeatureId?this.features.find(e=>e.id===this.selectedFeatureId):null;if(!e){this.editHandles=[],this.selectedHandle=null,this.updateSelectedVertexSource(),this.dispatch(`webmapx-set-source-data`,{id:V,data:{type:`FeatureCollection`,features:[]}}),this.dispatch(`webmapx-set-source-data`,{id:U,data:{type:`FeatureCollection`,features:[]}});return}this.selectedHandle&&this.selectedHandle.featureId!==e.id&&(this.selectedHandle=null,this.updateSelectedVertexSource()),this.editHandles=this.computeHandles(e);let t=this.editState===`editing`,n=this.editHandles.filter(e=>e.kind===`vertex`).map(e=>({type:`Feature`,geometry:{type:`Point`,coordinates:e.coords},properties:{}})),r=t?this.editHandles.filter(e=>e.kind===`midpoint`).map(e=>({type:`Feature`,geometry:{type:`Point`,coordinates:e.coords},properties:{}})):[];this.dispatch(`webmapx-set-source-data`,{id:V,data:{type:`FeatureCollection`,features:n}}),this.dispatch(`webmapx-set-source-data`,{id:U,data:{type:`FeatureCollection`,features:r}})}findHandleAt(e){let t=null,n=q;for(let r of this.editHandles){let i=this.adapter.project(r.coords),a=Math.hypot(e[0]-i[0],e[1]-i[1]);a<n&&(n=a,t=r)}return t}applyDragMove(e,t,n){let r=JSON.parse(JSON.stringify(e.coordinates));if(t.kind!==`vertex`)return;let{partIdx:i,ringIdx:a,vertIdx:o}=t;if(e.type===`Point`){e.coordinates=[n[0],n[1]],t.coords=n;return}else if(e.type===`MultiPoint`)r[i]=[n[0],n[1]];else if(e.type===`LineString`)r[o]=[n[0],n[1]];else if(e.type===`MultiLineString`)r[i][o]=[n[0],n[1]];else if(e.type===`Polygon`){r[a][o]=[n[0],n[1]];let e=r[a];o===0&&(e[e.length-1]=e[0])}else if(e.type===`MultiPolygon`){r[i][a][o]=[n[0],n[1]];let e=r[i][a];o===0&&(e[e.length-1]=e[0])}e.coordinates=r,t.coords=n}translateCoordsGeoPreserving(e,t,n,r,i,a){if(!isFinite(a)||!isFinite(i))return this.translateCoords(e,t,n,r);let o=a+r,s=Math.cos(a*Math.PI/180),c=Math.cos(o*Math.PI/180),l=c>1e-6?s/c:1,u=i+n,d=e=>[u+(e[0]-i)*l,e[1]+r];return t===`Point`?d(e):t===`MultiPoint`||t===`LineString`?e.map(d):t===`MultiLineString`?e.map(e=>e.map(d)):t===`Polygon`?e.map(e=>e.map(d)):t===`MultiPolygon`?e.map(e=>e.map(e=>e.map(d))):e}translateCoords(e,t,n,r){let i=e=>[e[0]+n,e[1]+r];return t===`Point`?i(e):t===`MultiPoint`||t===`LineString`?e.map(i):t===`MultiLineString`?e.map(e=>e.map(i)):t===`Polygon`?e.map(e=>e.map(i)):t===`MultiPolygon`?e.map(e=>e.map(e=>e.map(i))):e}insertVertex(e,t){let n=JSON.parse(JSON.stringify(e.coordinates)),{partIdx:r,ringIdx:i,afterVertIdx:a}=t;e.type===`LineString`?n.splice(a+1,0,[t.coords[0],t.coords[1]]):e.type===`MultiLineString`?n[r].splice(a+1,0,[t.coords[0],t.coords[1]]):e.type===`Polygon`?n[i].splice(a+1,0,[t.coords[0],t.coords[1]]):e.type===`MultiPolygon`&&n[r][i].splice(a+1,0,[t.coords[0],t.coords[1]]),e.coordinates=n,this.pushHistory({type:`update`,features:[{...e}]})}updateSelectedVertexSource(){if(this.uiVersion++,!this.sharedLayersCreated)return;let e=this.selectedHandle?[{type:`Feature`,geometry:{type:`Point`,coordinates:this.selectedHandle.coords},properties:{}}]:[];this.dispatch(`webmapx-set-source-data`,{id:G,data:{type:`FeatureCollection`,features:e}})}deleteSelectedVertex(){let e=this.selectedHandle;if(!e)return;let t=this.features.find(t=>t.id===e.featureId);if(!t)return;let n=JSON.parse(JSON.stringify(t.coordinates)),{partIdx:r,ringIdx:i,vertIdx:a}=e;if(t.type===`LineString`){if(n.length<=2)return;n.splice(a,1)}else if(t.type===`MultiLineString`){if(n[r].length<=2)return;n[r].splice(a,1)}else if(t.type===`Polygon`){let e=n[i];if(e.length-1<=3)return;a===0||a===e.length-1?(e.splice(e.length-1,1),e.splice(0,1),e.push([...e[0]])):e.splice(a,1)}else if(t.type===`MultiPolygon`){let e=n[r][i];if(e.length-1<=3)return;a===0||a===e.length-1?(e.splice(e.length-1,1),e.splice(0,1),e.push([...e[0]])):e.splice(a,1)}else if(t.type===`MultiPoint`){if(n.length<=1)return;n.splice(r,1)}else return;t.coordinates=n;let o=this.drawLayers.find(e=>e.id===t.layerId);o&&this.computeSpecialProperties(t,o),this.pushHistory({type:`update`,features:[{...t}]}),this.features=[...this.features],this.refreshDrawLayerSource(t.layerId),this.selectedHandle=null,this.updateSelectedVertexSource(),this.updateEditHandles()}commitFeature(e,t){let n=this.features.filter(t=>t.layerId===e.layerId).reduce((e,t)=>{let n=parseInt(String(t.properties.id??0),10);return isNaN(n)?e:Math.max(e,n)},0);e.properties.id=n+1;let r=this.drawLayers.find(t=>t.id===e.layerId);if(r&&this.computeSpecialProperties(e,r),r)for(let t of r.properties)t.type===`create-time`&&(e.properties[t.name]=Date.now());this.pushHistory(t?{type:`finish`,features:[e],draftPoints:t.map(e=>[e[0],e[1]])}:{type:`add`,features:[e]}),this.features=[...this.features,e],this.refreshDrawLayerSource(e.layerId),this.setModeInternal(this.mode),this.selectedFeatureId=e.id,this.editState=$(e.type)?`editing`:`selected`,this.updateSelectedSource(),this.updateEditHandles()}deleteSelected(){if(!this.selectedFeatureId)return;let e=this.features.filter(e=>e.id===this.selectedFeatureId);this.pushHistory({type:`delete`,features:e}),this.features=this.features.filter(e=>e.id!==this.selectedFeatureId),new Set(e.map(e=>e.layerId)).forEach(e=>this.refreshDrawLayerSource(e)),this.selectedFeatureId=null,this.editState=`none`,this.editHandles=[],this.adapter?.setCursor(``),this.updateSelectedSource(),this.updateEditHandles()}pushHistory(e){this.history=this.history.slice(0,this.historyIndex+1),this.history.push(e),this.historyIndex=this.history.length-1,this.uiVersion++}removeLastDraftPoint(){this.draftRedoStack.push(this.draftPoints.pop()),this.uiVersion++,this.updateRubberband(),this.updateHelpTextDuring()}undoOrDraftBack(){this.draftPoints.length>0?this.removeLastDraftPoint():this.undo()}redoOrDraftForward(){this.draftRedoStack.length>0?(this.draftPoints.push(this.draftRedoStack.pop()),this.uiVersion++,this.updateRubberband(),this.updateHelpTextDuring()):this.redo()}undo(){if(this.historyIndex<0)return;let e=this.history[this.historyIndex--];this.uiVersion++;let t=new Set;if(e.type===`add`||e.type===`finish`){let n=new Set(e.features.map(e=>e.id));this.features=this.features.filter(e=>!n.has(e.id)),e.features.forEach(e=>t.add(e.layerId))}else e.type===`delete`?(this.features=[...this.features,...e.features],e.features.forEach(e=>t.add(e.layerId))):e.type===`update`&&(this.features=this.features.map(n=>{let r=e.features.find(e=>e.id===n.id);return r?(t.add(n.layerId),{...n,coordinates:r.coordinates}):n}));if(this.selectedFeatureId=null,this.editState=`none`,this.updateSelectedSource(),this.updateEditHandles(),t.forEach(e=>this.refreshDrawLayerSource(e)),e.type===`finish`&&e.draftPoints){let t=e.features[0];this.mode=t.type===`LineString`?`draw-line`:`draw-polygon`,this.draftPoints=e.draftPoints.map(e=>[e[0],e[1]]),this.draftRedoStack=[],this.cursorPos=this.draftPoints[this.draftPoints.length-1],this.updateRubberband(),this.updateHelpTextDuring()}}redo(){if(this.historyIndex>=this.history.length-1)return;let e=this.history[++this.historyIndex];this.uiVersion++;let t=new Set;if(e.type===`add`||e.type===`finish`)this.features=[...this.features,...e.features],e.features.forEach(e=>t.add(e.layerId));else if(e.type===`delete`){let n=new Set(e.features.map(e=>e.id));this.features=this.features.filter(e=>!n.has(e.id)),e.features.forEach(e=>t.add(e.layerId))}else e.type===`update`&&(this.features=this.features.map(n=>{let r=e.features.find(e=>e.id===n.id);return r?(t.add(n.layerId),{...n,coordinates:r.coordinates}):n}));if(t.forEach(e=>this.refreshDrawLayerSource(e)),e.type===`finish`){let t=e.features[0];this.draftPoints=[],this.draftRedoStack=[],this.cursorPos=null,this.selectedFeatureId=t.id,this.editState=$(t.type)?`editing`:`selected`,this.updateSelectedSource(),this.updateEditHandles(),this.updateRubberband()}}exportGeoJSON(){this.exportFilename=`draw-export`,this.exportMode=`combined`,this.exportDialog.show()}async doExport(){this.exportDialog.hide();let e=this.exportFilename.trim()||`draw-export`;if(this.drawLayers.length<=1||this.exportMode===`combined`){let t={type:`FeatureCollection`,features:this.features.map(e=>({type:`Feature`,id:e.id,geometry:{type:e.type,coordinates:e.coordinates},properties:{...e.properties,_layer:this.drawLayers.find(t=>t.id===e.layerId)?.name??e.layerId}}))};this.downloadBlob(new Blob([JSON.stringify(t,null,2)],{type:`application/json`}),`${e}.geojson`)}else{let t=new ee(new u(`application/zip`));for(let e of this.drawLayers){let n={type:`FeatureCollection`,features:this.features.filter(t=>t.layerId===e.id).map(e=>({type:`Feature`,id:e.id,geometry:{type:e.type,coordinates:e.coordinates},properties:{...e.properties}}))},r=e.name.replace(/[/\\?%*:|"<>]/g,`_`);await t.add(`${r}.geojson`,new d(JSON.stringify(n,null,2)))}this.downloadBlob(await t.close(),`${e}.zip`)}}downloadBlob(e,t){let n=URL.createObjectURL(e),r=document.createElement(`a`);r.href=n,r.download=t,r.click(),URL.revokeObjectURL(n)}newId(){return`draw-${Date.now()}-${Math.random().toString(36).slice(2,7)}`}computeSpecialProperties(e,t){for(let n of t.properties)switch(n.type){case`longitude`:case`latitude`:{let t=e.type===`Point`?e.coordinates:this.centroid(e);e.properties[n.name]=n.type===`longitude`?t[0]:t[1];break}case`area`:e.properties[n.name]=e.type===`Polygon`?this.polygonArea(e.coordinates):null;break;case`perimeter`:case`length`:e.properties[n.name]=e.type===`Polygon`?this.ringLength(e.coordinates[0]):e.type===`LineString`?this.ringLength(e.coordinates,!1):null;break;case`update-time`:e.properties[n.name]=Date.now();break}}centroid(e){let t;switch(e.type){case`Point`:t=[e.coordinates];break;case`MultiPoint`:t=e.coordinates;break;case`LineString`:t=e.coordinates;break;case`MultiLineString`:t=e.coordinates.flat();break;case`Polygon`:t=e.coordinates[0];break;case`MultiPolygon`:t=e.coordinates.flat(2);break;default:t=[]}if(t.length===0)return[0,0];let n=t.reduce((e,t)=>[e[0]+t[0],e[1]+t[1]],[0,0]);return[n[0]/t.length,n[1]/t.length]}haversineKm(e,t){let n=(t[1]-e[1])*Math.PI/180,r=(t[0]-e[0])*Math.PI/180,i=Math.sin(n/2)**2+Math.cos(e[1]*Math.PI/180)*Math.cos(t[1]*Math.PI/180)*Math.sin(r/2)**2;return 6371*2*Math.atan2(Math.sqrt(i),Math.sqrt(1-i))}ringLength(e,t=!0){let n=0,r=e.length-1;for(let t=0;t<r;t++)n+=this.haversineKm(e[t],e[t+1]);return Math.round(n*1e3)}polygonArea(e){let t=e[0],n=0;for(let e=0,r=t.length-1;e<t.length;r=e++)n+=(t[r][0]+t[e][0])*(t[r][1]-t[e][1]);let r=Math.abs(n/2),i=t[0][1]*Math.PI/180;return Math.round(111320*Math.cos(i)*r*111320)}withinPixelThreshold(e,t,n){if(!this.adapter)return!1;let r=this.adapter.project(e),i=this.adapter.project(t);return Math.hypot(r[0]-i[0],r[1]-i[1])<n}findFeatureAt(e,t){for(let n of[...this.features].reverse())if(n.type===`Point`){let t=this.adapter.project(n.coordinates);if(Math.hypot(t[0]-e[0],t[1]-e[1])<10)return n}else if(n.type===`MultiPoint`)for(let t of n.coordinates){let r=this.adapter.project(t);if(Math.hypot(r[0]-e[0],r[1]-e[1])<10)return n}else if(n.type===`LineString`){if(this.pixelNearPolyline(e,n.coordinates,10))return n}else if(n.type===`MultiLineString`){if(n.coordinates.some(t=>this.pixelNearPolyline(e,t,10)))return n}else if(n.type===`Polygon`){if(this.pointInRing(t,n.coordinates[0])||this.pixelNearPolyline(e,n.coordinates[0],10))return n}else if(n.type===`MultiPolygon`)for(let r of n.coordinates){let i=r[0];if(i&&(this.pointInRing(t,i)||this.pixelNearPolyline(e,i,10)))return n}return null}pixelNearPolyline(e,t,n){for(let r=0;r<t.length-1;r++){let i=this.adapter.project(t[r]),a=this.adapter.project(t[r+1]);if(this.distToSegment(e,i,a)<n)return!0}return!1}distToSegment(e,t,n){let r=n[0]-t[0],i=n[1]-t[1];if(r===0&&i===0)return Math.hypot(e[0]-t[0],e[1]-t[1]);let a=Math.max(0,Math.min(1,((e[0]-t[0])*r+(e[1]-t[1])*i)/(r*r+i*i)));return Math.hypot(e[0]-(t[0]+a*r),e[1]-(t[1]+a*i))}pointInRing(e,t){let n=!1;for(let r=0,i=t.length-1;r<t.length;i=r++){let a=t[r][0],o=t[r][1],s=t[i][0],c=t[i][1];o>e[1]!=c>e[1]&&e[0]<(s-a)*(e[1]-o)/(c-o)+a&&(n=!n)}return n}dispatch(e,t){this.dispatchEvent(new CustomEvent(e,{detail:t,bubbles:!0,composed:!0}))}updateHelpTextDuring(){let e=this.draftPoints.length;this.mode===`draw-line`?this.helpText=`${e} pt${e===1?``:`s`}. Double-click or right-click to finish.`:this.mode===`draw-polygon`&&(this.helpText=e>=3?`${e} pts. Click first point, double-click, or right-click to close.`:`${e} pt${e===1?``:`s`}. Need at least 3 to close.`)}toggleButton(e,t,n,r,i=t){return o`
            <sl-tooltip content=${i}>
                <button type="button" class="toggle-button" name=${e}
                    aria-label=${t} aria-pressed=${n?`true`:`false`}
                    @click=${r}>
                    <sl-icon name=${e} aria-hidden="true"></sl-icon>
                </button>
            </sl-tooltip>`}render(){let e=this.features.find(e=>e.id===this.selectedFeatureId),t=e?this.drawLayers.find(t=>t.id===e.layerId):null;return o`
            <div class="toolbar">
                ${this.toggleButton(`cursor`,`Select`,this.mode===`select`,()=>this.requestDrawMode(`select`))}
                ${this.toggleButton(`geo-fill`,`Draw point`,this.mode===`draw-point`,()=>this.requestDrawMode(`draw-point`))}
                ${this.toggleButton(`slash-lg`,`Draw line`,this.mode===`draw-line`,()=>this.requestDrawMode(`draw-line`))}
                ${this.toggleButton(`pentagon`,`Draw polygon`,this.mode===`draw-polygon`,()=>this.requestDrawMode(`draw-polygon`))}
                ${this.toggleButton(`circle`,`Draw circle`,this.mode===`draw-circle`,()=>this.requestDrawMode(`draw-circle`))}

                <div class="divider"></div>

                ${this.toggleButton(`magnet`,`Snap to points and edges`,this.effectiveSnap,()=>{this.snapEnabled=!this.snapEnabled,this.snapEnabled||(this.snapPos=null,this.updateRubberband())},`Snap to points and edges (${this.snapEnabled?`on`:`off`}) — hold Alt to toggle`)}

                <div class="divider"></div>

                <sl-tooltip content="Undo (${this.modKey}+Z)">
                    <sl-icon-button name="arrow-counterclockwise" label="Undo"
                        ?disabled=${this.historyIndex<0&&this.draftPoints.length===0}
                        @click=${()=>this.undoOrDraftBack()}>
                    </sl-icon-button>
                </sl-tooltip>
                <sl-tooltip content="Redo (${this.modKey}+Y)">
                    <sl-icon-button name="arrow-clockwise" label="Redo"
                        ?disabled=${this.historyIndex>=this.history.length-1&&this.draftRedoStack.length===0}
                        @click=${()=>this.redoOrDraftForward()}>
                    </sl-icon-button>
                </sl-tooltip>

                <div class="divider"></div>

                <sl-tooltip content=${this.draftPoints.length>0?`Remove last point`:this.selectedHandle?`Delete selected point`:`Delete selected`}>
                    <sl-icon-button name="trash"
                        label=${this.draftPoints.length>0?`Remove last point`:this.selectedHandle?`Delete selected point`:`Delete selected`}
                        ?disabled=${this.draftPoints.length===0&&!this.selectedFeatureId&&!this.selectedHandle}
                        @click=${()=>this.draftPoints.length>0?this.removeLastDraftPoint():this.selectedHandle?this.deleteSelectedVertex():this.deleteSelected()}>
                    </sl-icon-button>
                </sl-tooltip>
                <sl-tooltip content="Export GeoJSON">
                    <sl-icon-button name="download" label="Export GeoJSON"
                        ?disabled=${this.features.length===0}
                        @click=${()=>this.exportGeoJSON()}>
                    </sl-icon-button>
                </sl-tooltip>
            </div>

            <div class="scroll-content">
            <div class="help">${this.helpText}</div>

            ${this.isTouchDevice&&(this.mode===`draw-line`||this.mode===`draw-polygon`)&&this.draftPoints.length>=(this.mode===`draw-line`?2:3)?o`
                <sl-button size="small" variant="primary" style="margin-bottom:.4rem;width:100%"
                    @click=${()=>{let e=Q(this.mode),t=e?this.activeLayerIds[e]:null;t&&this.finishDraft(t)}}>
                    Finish
                </sl-button>
            `:``}

            ${this.drawLayers.length>0?o`
                <div class="layers-section">
                    <div class="section-label">Editing</div>
                    ${this.drawLayers.map(e=>o`
                        <div class="layer-row">
                            <button type="button" class="layer-select-btn" title="Click to change layer"
                                 @click=${()=>this.openLayerDialog(e.type===`Point`?`draw-point`:e.type===`LineString`?`draw-line`:`draw-polygon`)}>
                                <span class="color-dot" style="background:${e.color}"></span>
                                <span class="layer-name">${e.name}</span>
                                <span class="layer-type">${e.type===`LineString`?`Line`:e.type}</span>
                                <small style="color:var(--color-text-muted, #6b7681);font-size:.7rem">${this.features.filter(t=>t.layerId===e.id).length}</small>
                            </button>
                            ${this.drawLayers.length>1?o`
                                <sl-tooltip content="Stop editing">
                                    <sl-icon-button name="x" class="remove-layer-btn" label="Stop editing ${e.name}"
                                        @click=${t=>{t.stopPropagation(),this.removeFromEditing(e)}}>
                                    </sl-icon-button>
                                </sl-tooltip>
                            `:``}
                        </div>
                    `)}
                </div>
            `:``}

            ${e&&t?o`
                <div class="section-label" style="margin-top:.5rem">Selected: ${t.name}</div>
                ${t.properties.map(n=>o`
                    <div class="prop-row">
                        <span class="prop-label">${n.name}</span>
                        ${n.name===`id`||[`longitude`,`latitude`,`area`,`perimeter`,`length`,`create-time`,`update-time`].includes(n.type)?o`<span class="prop-value" style="color:var(--color-text-muted, #6b7681);font-style:italic;padding:0 0.3rem">${[`create-time`,`update-time`].includes(n.type)?e.properties[n.name]?new Date(e.properties[n.name]).toLocaleString():`—`:e.properties[n.name]??`—`}</span>`:n.type===`imageURL`?o`<div class="prop-url-wrap">
                                        <sl-input size="small"
                                            .value=${String(e.properties[n.name]??``)}
                                            placeholder="image URL"
                                            @sl-change=${r=>{e.properties[n.name]=r.target.value,t&&this.computeSpecialProperties(e,t),this.features=[...this.features],this.refreshDrawLayerSource(e.layerId)}}></sl-input>
                                        ${e.properties[n.name]?o`<img class="prop-img" src=${String(e.properties[n.name])} @error=${e=>{let t=e.target,n=document.createElement(`span`);n.className=`prop-img-error`,n.textContent=`⚠ invalid image`,t.replaceWith(n)}}>`:``}
                                       </div>`:n.type===`linkURL`?o`<div class="prop-url-wrap">
                                            <sl-input size="small"
                                                .value=${String(e.properties[n.name]??``)}
                                                placeholder="link URL"
                                                @sl-change=${r=>{e.properties[n.name]=r.target.value,t&&this.computeSpecialProperties(e,t),this.features=[...this.features],this.refreshDrawLayerSource(e.layerId)}}></sl-input>
                                            ${e.properties[n.name]?o`<a class="prop-link" href=${String(e.properties[n.name])} target="_blank" rel="noopener noreferrer">${e.properties[n.name]}</a>`:``}
                                           </div>`:o`<sl-input size="small" class="prop-value"
                                            .value=${String(e.properties[n.name]??``)}
                                            @sl-change=${r=>{e.properties[n.name]=r.target.value,t&&this.computeSpecialProperties(e,t),this.features=[...this.features],this.refreshDrawLayerSource(e.layerId)}}></sl-input>`}
                    </div>
                `)}
            `:``}
            </div>

            <webmapx-draw-layer-dialog
                @webmapx-draw-layer-confirm=${this.handleLayerConfirm}
                @webmapx-draw-layer-cancel=${this.handleLayerCancel}>
            </webmapx-draw-layer-dialog>

            <sl-dialog id="export-dialog" label="Export GeoJSON">
                <div class="prop-row">
                    <span class="prop-label">Filename</span>
                    <sl-input class="prop-value" size="small"
                        .value=${this.exportFilename}
                        @sl-input=${e=>{this.exportFilename=e.target.value}}>
                        <span slot="suffix">${this.exportMode===`separate`?`.zip`:`.geojson`}</span>
                    </sl-input>
                </div>
                ${this.drawLayers.length>1?o`
                    <div style="margin-top:.6rem">
                        <sl-radio-group label="Export as" .value=${this.exportMode}
                            @sl-change=${e=>{this.exportMode=e.target.value}}>
                            <sl-radio value="combined">Single GeoJSON file (all layers combined)</sl-radio>
                            <sl-radio value="separate">Separate files per layer (ZIP archive)</sl-radio>
                        </sl-radio-group>
                    </div>
                `:``}
                <sl-button slot="footer" variant="primary" autofocus @click=${()=>this.doExport()}>Download</sl-button>
                <sl-button slot="footer" variant="default" @click=${()=>this.exportDialog.hide()}>Cancel</sl-button>
            </sl-dialog>
        `}};m([i()],Z.prototype,`mode`,void 0),m([i()],Z.prototype,`drawLayers`,void 0),m([i()],Z.prototype,`features`,void 0),m([i()],Z.prototype,`selectedFeatureId`,void 0),m([i()],Z.prototype,`helpText`,void 0),m([i()],Z.prototype,`pendingMode`,void 0),m([i()],Z.prototype,`uiVersion`,void 0),m([i()],Z.prototype,`isTouchDevice`,void 0),m([i()],Z.prototype,`snapEnabled`,void 0),m([i()],Z.prototype,`altActive`,void 0),m([i()],Z.prototype,`editState`,void 0),m([e(`webmapx-draw-layer-dialog`,!0)],Z.prototype,`layerDialog`,void 0),m([e(`#export-dialog`)],Z.prototype,`exportDialog`,void 0),m([i()],Z.prototype,`exportFilename`,void 0),m([i()],Z.prototype,`exportMode`,void 0),Z=m([n(`webmapx-draw-tool`)],Z);function Q(e){return e===`draw-point`?`Point`:e===`draw-line`?`LineString`:e===`draw-polygon`||e===`draw-circle`?`Polygon`:null}function re(e){return e===`Point`||e===`MultiPoint`||e===`LineString`||e===`MultiLineString`||e===`Polygon`||e===`MultiPolygon`}function $(e){return e===`Point`||e===`MultiPoint`}function ie(e){return e===`LineString`||e===`MultiLineString`}function ae(e){return e===`Polygon`||e===`MultiPolygon`}export{Z as WebmapxDrawTool};