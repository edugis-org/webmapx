import"./vendor-shoelace-DBc2J2Ui.js";import{d as e,g as t,h as n,m as r,p as i,v as a,x as o,y as s}from"./vendor-lit-DP8NDNGT.js";import{O as c,bt as l,gt as u,yt as d}from"./webmapx-shared-BlSlzgHy.js";import{v as f}from"./cesium-adapter-DCP1QrEw.js";import{t as p}from"./decorate-Bxy85Xl5.js";import{t as ee}from"./webmapx-modal-tool-BKFfcFXL.js";import{t as te}from"./control-surface-styles-WAx9bflO.js";import{a as ne,i as re,r as ie}from"./top-layer-dialog-DcJK4Y8h.js";import{a as m,i as h,r as ae}from"./data-colors-BXVfrRzV.js";var g={longitude:`longitude (auto)`,latitude:`latitude (auto)`,area:`area (auto)`,perimeter:`perimeter (auto)`,length:`length (auto)`,linkURL:`link URL`,imageURL:`image URL`,"create-time":`create-time (auto)`,"update-time":`update-time (auto)`},_={Point:[`string`,`number`,`longitude`,`latitude`,`linkURL`,`imageURL`,`create-time`,`update-time`],LineString:[`string`,`number`,`length`,`linkURL`,`imageURL`,`create-time`,`update-time`],Polygon:[`string`,`number`,`area`,`perimeter`,`longitude`,`latitude`,`linkURL`,`imageURL`,`create-time`,`update-time`]},oe=new Set([`longitude`,`latitude`,`area`,`perimeter`,`length`,`create-time`,`update-time`]),v={longitude:{name:`longitude`,label:`Longitude`},latitude:{name:`latitude`,label:`Latitude`},area:{name:`area`,label:`Area`},perimeter:{name:`perimeter`,label:`Perimeter`},length:{name:`length`,label:`Length`},"create-time":{name:`created`,label:`Created date`},"update-time":{name:`updated`,label:`Updated date`}},se=[{name:`id`,type:`number`},{name:`name`,type:`string`}],ce={Point:h,LineString:h,Polygon:h};function y(e){return{id:`layer-${Date.now()}-${Math.random().toString(36).slice(2,6)}`,name:``,type:e,color:ce[e],properties:se.map(e=>({...e}))}}var b=class extends t{constructor(...e){super(...e),this.geometryType=`Point`,this.existingLayers=[],this.mapLayers=[],this.step=`select`,this.selectedId=`new`,this.layer=y(`Point`),this.nameError=!1,this.newPropName=``,this.newPropType=`string`,this.allowedAttributes=null}static{this.styles=[te,ne,o`
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
    `]}open(){ie(this),this.step=`select`,this.selectedId=this.existingLayers.length===0?`new`:this.existingLayers[0].id,this.layer=y(this.geometryType),this.newPropName=``,this.newPropType=`string`,this.nameError=!1,this.dialog?.show()}close(){this.dialog?.hide()}selectOption(e){this.selectedId=e}goToDetail(){if(this.selectedId===`new`)this.layer=y(this.geometryType),this.allowedAttributes=null;else{let e=this.existingLayers.find(e=>e.id===this.selectedId);if(e)this.layer={...e,properties:e.properties.map(e=>({...e}))},this.allowedAttributes=null;else{let e=this.mapLayers.find(e=>e.layerId===this.selectedId);this.layer={...y(this.geometryType),name:e?.label??this.selectedId,properties:e?.properties?.map(e=>({...e}))??se.map(e=>({...e})),borrowedSourceId:e?.sourceId},this.allowedAttributes=e?.allowedAttributes??null}}this.step=`detail`,this.updateComplete.then(()=>this.renderRoot.querySelector(`sl-input[name="layername"]`)?.focus())}goBack(){this.step=`select`}addProperty(){this.newPropName.trim()&&(this.layer={...this.layer,properties:[...this.layer.properties,{name:this.newPropName.trim(),type:this.newPropType}]},this.newPropName=``,this.newPropType=`string`)}removeProperty(e){let t=[...this.layer.properties];t.splice(e,1),this.layer={...this.layer,properties:t}}confirm(){let e=this.renderRoot.querySelector(`sl-input[name="layername"]`)?.value?.trim()??this.layer.name;if(!e){this.nameError=!0,this.requestUpdate();return}this.nameError=!1;let t=this.newPropName.trim(),n=t?[...this.layer.properties,{name:t,type:this.newPropType}]:[...this.layer.properties],r={...this.layer,name:e,properties:n};this.dispatchEvent(new CustomEvent(`webmapx-draw-layer-confirm`,{detail:r,bubbles:!0,composed:!0})),this.dialog.hide()}cancel(){this.dispatchEvent(new CustomEvent(`webmapx-draw-layer-cancel`,{bubbles:!0,composed:!0})),this.dialog.hide()}renderSelectStep(){let e=this.geometryType===`LineString`?`Line`:this.geometryType;return s`
            <div class="layer-list">
                <button type="button" class="layer-option ${this.selectedId===`new`?`selected`:``}"
                     aria-pressed=${this.selectedId===`new`}
                     @click=${()=>this.selectOption(`new`)}
                     @dblclick=${()=>{this.selectOption(`new`),this.goToDetail()}}>
                    <span class="new-icon">＋</span>
                    <span>New ${e} layer</span>
                </button>
                ${this.existingLayers.map(e=>s`
                    <button type="button" class="layer-option ${this.selectedId===e.id?`selected`:``}"
                         aria-pressed=${this.selectedId===e.id}
                         @click=${()=>this.selectOption(e.id)}
                         @dblclick=${()=>{this.selectOption(e.id),this.goToDetail()}}>
                        <span class="color-dot" style="background:${e.color}"></span>
                        <span>${e.name}</span>
                    </button>
                `)}
                ${this.mapLayers.length>0?s`
                    <div style="font-size:0.72rem;color:var(--color-text-muted, #6b7681);padding:0.4rem 0.2rem 0.1rem;text-transform:uppercase;letter-spacing:0.05em">Map layers</div>
                    ${this.mapLayers.map(e=>s`
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
        `}renderDetailStep(){let e=_[this.geometryType];return s`
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
            ${this.nameError?s`<div class="error-msg">Enter a layer name.</div>`:``}

            <table class="prop-table">
                <thead>
                    <tr><th>Property</th><th>Type</th><th style="width:2rem"></th></tr>
                </thead>
                <tbody>
                    ${this.layer.properties.map((e,t)=>s`
                        <tr class="${e.name===`id`?`prop-row-auto`:``}">
                            <td>${e.name}</td>
                            <td class="${[`string`,`number`,`linkURL`,`imageURL`].includes(e.type)?``:`type-computed`}">${e.type}${e.name===`id`?` (auto)`:``}</td>
                            <td>
                                ${t===0?``:s`
                                    <sl-icon-button name="x" label="Remove property ${e.name}" @click=${()=>this.removeProperty(t)}></sl-icon-button>
                                `}
                            </td>
                        </tr>
                    `)}
                    <tr class="add-row">
                        <td>
                            ${this.allowedAttributes?s`
                                <sl-select id="new-prop-name" size="small" aria-label="Property name"
                                    .value=${this.newPropName}
                                    @sl-change=${e=>this.newPropName=e.target.value}>
                                    <sl-option value="">— select —</sl-option>
                                    ${this.allowedAttributes.filter(e=>!this.layer.properties.find(t=>t.name===e)).map(e=>s`<sl-option value=${e}>${e}</sl-option>`)}
                                </sl-select>
                            `:s`
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
                                ${e.map(e=>s`<sl-option value=${e}>${g[e]??e}</sl-option>`)}
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
        `}render(){let e=this.geometryType===`LineString`?`Line`:this.geometryType;return re(s`
                <sl-dialog label="${this.step===`select`?`Select ${e} layer`:`Configure ${e} layer`}"
                           @sl-request-close=${e=>{e.detail?.source===`overlay`&&this.cancel()}}>
                    ${this.step===`select`?this.renderSelectStep():this.renderDetailStep()}
                </sl-dialog>
        `)}};p([r({type:String})],b.prototype,`geometryType`,void 0),p([r({attribute:!1})],b.prototype,`existingLayers`,void 0),p([r({attribute:!1})],b.prototype,`mapLayers`,void 0),p([i()],b.prototype,`step`,void 0),p([i()],b.prototype,`selectedId`,void 0),p([i()],b.prototype,`layer`,void 0),p([i()],b.prototype,`nameError`,void 0),p([i()],b.prototype,`newPropName`,void 0),p([i()],b.prototype,`newPropType`,void 0),p([i()],b.prototype,`allowedAttributes`,void 0),p([e(`sl-dialog`)],b.prototype,`dialog`,void 0),b=p([n(`webmapx-draw-layer-dialog`)],b);var le=`data:image/svg+xml,%3csvg%20xmlns='http://www.w3.org/2000/svg'%20width='16'%20height='16'%20viewBox='0%200%2016%2016'%20fill='none'%20stroke='currentColor'%20stroke-width='1.4'%20stroke-linecap='round'%3e%3cline%20x1='13.5'%20y1='2.5'%20x2='2.5'%20y2='13.5'%20stroke-dasharray='2.6%202.2'/%3e%3c/svg%3e`,ue=`data:image/svg+xml,%3csvg%20xmlns='http://www.w3.org/2000/svg'%20width='16'%20height='16'%20viewBox='0%200%2016%2016'%20fill='none'%20stroke='currentColor'%20stroke-width='1.4'%3e%3crect%20x='2.5'%20y='3.5'%20width='11'%20height='9'%20rx='0.5'%20stroke-dasharray='2%201.8'/%3e%3c/svg%3e`,de=`data:image/svg+xml,%3csvg%20xmlns='http://www.w3.org/2000/svg'%20width='16'%20height='16'%20viewBox='0%200%2016%2016'%20fill='none'%20stroke='currentColor'%20stroke-width='1.3'%20stroke-linecap='round'%20stroke-linejoin='round'%3e%3cpath%20d='M3%2012%20L7%205%20L13%209'/%3e%3ccircle%20cx='3'%20cy='12'%20r='1.6'%20fill='currentColor'%20stroke='none'/%3e%3ccircle%20cx='7'%20cy='5'%20r='1.6'%20fill='currentColor'%20stroke='none'/%3e%3ccircle%20cx='13'%20cy='9'%20r='1.6'%20fill='currentColor'%20stroke='none'/%3e%3c/svg%3e`,fe=`data:image/svg+xml,%3csvg%20xmlns='http://www.w3.org/2000/svg'%20width='16'%20height='16'%20viewBox='0%200%2016%2016'%20fill='none'%20stroke='currentColor'%20stroke-linecap='round'%20stroke-linejoin='round'%3e%3cpath%20d='M8%202.8%20L13.2%206.5%20L10.2%2013.2%20L2.8%208.2%20Z'%20stroke-width='1.6'/%3e%3ccircle%20cx='8'%20cy='2.8'%20r='2'%20fill='%23fff'%20stroke-width='1.1'/%3e%3ccircle%20cx='13.2'%20cy='6.5'%20r='2'%20fill='%23fff'%20stroke-width='1.1'/%3e%3ccircle%20cx='10.2'%20cy='13.2'%20r='2'%20fill='%23fff'%20stroke-width='1.1'/%3e%3ccircle%20cx='2.8'%20cy='8.2'%20r='2'%20fill='%23fff'%20stroke-width='1.1'/%3e%3c/svg%3e`,pe=`data:image/svg+xml,%3csvg%20xmlns='http://www.w3.org/2000/svg'%20width='16'%20height='16'%20viewBox='0%200%2016%2016'%20fill='none'%20stroke='currentColor'%20stroke-linecap='round'%20stroke-linejoin='round'%3e%3cdefs%3e%3cclipPath%20id='wmx-fv-clip'%3e%3crect%20x='3'%20y='2.5'%20width='10'%20height='11'%20rx='1.2'/%3e%3c/clipPath%3e%3c/defs%3e%3crect%20x='3'%20y='2.5'%20width='10'%20height='2.75'%20fill='currentColor'%20clip-path='url(%23wmx-fv-clip)'/%3e%3crect%20x='3'%20y='2.5'%20width='10'%20height='11'%20rx='1.2'%20stroke-width='1.2'/%3e%3cpath%20d='M3.3%208%20H12.7'%20stroke-width='0.7'/%3e%3cpath%20d='M3.3%2010.75%20H12.7'%20stroke-width='0.7'/%3e%3c/svg%3e`,me=`data:image/svg+xml,%3csvg%20xmlns='http://www.w3.org/2000/svg'%20width='16'%20height='16'%20viewBox='0%200%2016%2016'%20fill='none'%20stroke='currentColor'%20stroke-width='1.3'%20stroke-linecap='round'%20stroke-linejoin='round'%3e%3cpath%20d='M8%202.8c2.9%200%205%201.4%205%203.4%200%201.4-1%202.5-2.3%203.1.8.4%201.3%201%201.3%201.8%200%201.4-1.6%202.1-3.5%202.1-.8%200-1.6-.2-2.2-.4-.4.3-1%20.4-1.5.4-1.4%200-2.6-.9-2.6-2.1%200-.7.4-1.3%201-1.7-1-.7-1.5-1.5-1.5-2.6%200-2.2%202.7-4%206.3-4z'%20stroke-dasharray='2%201.8'/%3e%3c/svg%3e`,he=`var(--webmapx-data-tool, ${h})`,x=`var(--webmapx-data-start, ${ae})`,ge={a:[14,10],b:[34,8],c:[54,18],d:[10,26],e:[20,36],f:[46,34]},_e=[`a`,`b`,`c`,`d`,`e`,`f`],ve=[`f`,`e`,`d`,`a`,`b`,`c`];function S(e,t){let[n,...r]=e.map(e=>ge[e]);return`M${n[0]} ${n[1]} `+r.map(([e,t])=>`L${e} ${t}`).join(` `)+(t?` Z`:``)}function C(e){return a`
        <svg viewBox="0 0 64 44" role="img" aria-hidden="true" focusable="false">
            ${e}
        </svg>`}var w=a`
    ${Object.values(ge).map(([e,t])=>a`<circle cx=${e} cy=${t} r="2.6" fill=${he} />`)}
`,ye=C(w),be=C(a`
    <path d=${S(_e,!1)} fill="none" stroke=${x} stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
    ${w}
`),xe=C(a`
    <path d=${S(ve,!0)} fill=${x} fill-opacity="0.3" stroke=${x} stroke-width="2" stroke-linejoin="round" />
    ${w}
`);function Se(e){return e===`Point`?ye:e===`LineString`?be:xe}var T=`webmapx-draw-rubber-source`,E=`webmapx-draw-rubber-line`,D=`webmapx-draw-vertex-source`,O=`webmapx-draw-vertex-layer`,k=`New layer`,A=`geom`;function j(e,t){return t===`Point`?`webmapx-draw-src-${e}`:`${e}:${A}`}function M(e){return`${e}-map`}function N(e,t,n,r){return t.type===`Polygon`?{id:e,type:`style`,version:8,title:t.name,metadata:r,sources:{[A]:{type:`geojson`,data:{type:`FeatureCollection`,features:[]}}},layers:[{id:`${e}-fill`,type:`fill`,source:A,metadata:{label:`Fill`},paint:{"fill-color":n,"fill-opacity":.35}},{id:`${e}-line`,type:`line`,source:A,metadata:{label:`Line`},paint:{"line-color":n,"line-width":2}}]}:t.type===`LineString`?{id:e,type:`style`,version:8,title:t.name,metadata:r,sources:{[A]:{type:`geojson`,data:{type:`FeatureCollection`,features:[]}}},layers:[{id:`${e}-solid`,type:`line`,source:A,metadata:{label:`Line`},filter:[`!=`,[`get`,`__dashed`],!0],paint:{"line-color":n,"line-width":2}},{id:`${e}-dashed`,type:`line`,source:A,metadata:{label:`Dashed line`},filter:[`==`,[`get`,`__dashed`],!0],paint:{"line-color":n,"line-width":2,"line-dasharray":[2,2]}}]}:{id:e,type:`circle`,source:j(e,t.type),title:t.name,metadata:r,paint:{"circle-radius":6,"circle-color":n,"circle-stroke-width":2,"circle-stroke-color":`#fff`}}}var Ce=`#888888`,P=`#ff3b30`,F=10,I=`webmapx-draw-draft-source`,we=`webmapx-draw-draft-points`,L=`webmapx-draw-active-nodes-source`,Te=`webmapx-draw-active-nodes`,R=`webmapx-draw-edit-vert-source`,Ee=`webmapx-draw-edit-vert`,z=`webmapx-draw-edit-mid-source`,De=`webmapx-draw-edit-mid`,B=`webmapx-draw-sel-vert-source`,Oe=`webmapx-draw-sel-vert`,ke=12,V=`webmapx-draw-snap-source`,Ae=`webmapx-draw-snap-layer`,je=16,H=1,U=`webmapx-draw-marquee-source`,Me=`webmapx-draw-marquee-fill`,Ne=`webmapx-draw-marquee-line`,W=`webmapx-draw-multisel-source`,Pe=`webmapx-draw-multisel-point`,G=class extends ee{constructor(...e){super(...e),this.toolId=`draw`,this.mode=`select`,this.drawLayers=[],this.features=[],this.selectedFeatureId=null,this.selectedFeatureIds=[],this.hoveredFeatureId=null,this.lastFocusedAttributeName=null,this.helpText=``,this.pendingMode=null,this.uiVersion=0,this.panelView=`type`,this.pickedType=null,this.showDrawIntro=!0,this.catalogLayerOptions=[],this.catalogLayerCounts={},this.pendingCatalogEditOption=null,this.pausedLayerIds=new Set,this.ownsPermLayer=new Set,this.confirmedRestingLayerIds=new Set,this.unsubMapLayers=null,this.unsubMapLoaded=null,this.boundMap=null,this.lastMapLayerIdsKey=``,this.draftPoints=[],this.draftRedoStack=[],this.cursorPos=null,this.circleDraft=null,this.rectDraft=null,this.rectSelectDraft=null,this.lassoSelectDraft=null,this.activeLayerIds={},this.drawHistory=[],this.drawHistoryIndex=-1,this.moveHistory=[],this.moveHistoryIndex=-1,this.sharedLayersCreated=!1,this.createdDrawLayerIds=new Set,this.touchMQ=window.matchMedia(`(pointer: coarse)`),this.isTouchDevice=this.touchMQ.matches,this.onTouchMQChange=e=>{this.isTouchDevice=e.matches},this.snapEnabled=!0,this.altActive=!1,this.snapPos=null,this.lastCursorPx=null,this.editState=`none`,this.editHandles=[],this.dragging=null,this.selectedHandle=null,this.featureDrag=null,this.unsubClick=null,this.unsubMove=null,this.moveRafId=null,this.pendingMoveEvent=null,this.unsubCtx=null,this.unsubDown=null,this.unsubUp=null,this.unsubLeave=null,this.layerNameInvalid=!1,this.layerNameDraft=null,this.addingAttribute=!1,this.newAttrName=``,this.newAttrType=``,this.removedAttributeStack=[],this.removedAttributeRedoStack=[],this.renamingAttributeIndex=null,this.renameAttrDraft=``,this.pendingSourceRefresh=new Map,this.onKeyDown=e=>{if(this.isRelevantTarget(e)){if(e.key===`Alt`){e.preventDefault(),this.altActive||(this.altActive=!0,this.snapPos=null,this.updateRubberband(),this.updateSnapIndicator());return}if(!this.isTypingTarget(e)&&this.panelView===`editing`){if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()===`z`){e.preventDefault(),this.isDrawMode()?this.undoOrDraftBack():this.undoMove();return}if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()===`y`){e.preventDefault(),this.isDrawMode()?this.redoOrDraftForward():this.redoMove();return}(e.key===`Delete`||e.key===`Backspace`)&&(this.draftPoints.length>0?(e.preventDefault(),this.removeLastDraftPoint()):this.selectedHandle?(e.preventDefault(),this.deleteSelectedVertex()):this.selectedFeatureId&&(e.preventDefault(),this.deleteSelected()))}}},this.onWindowBlur=()=>{this.altActive&&(this.altActive=!1,J(this.mode)&&this.updateRubberband())},this.onKeyUp=e=>{e.key===`Alt`&&(this.altActive=!1,J(this.mode)&&this.updateRubberband())},this.onFinishEditingRequest=e=>{let t=e.detail?.layerId;if(!t||!this.adapter)return;let n=this.adapter.store.getState().mapLayers??{},r=Object.entries(this.activeLayerIds).find(([,e])=>{let r=this.drawLayers.find(t=>t.id===e);return r?.borrowedSourceId?Object.entries(n).find(([,e])=>e.sourceId===r.borrowedSourceId)?.[0]===t:!1});if(!r)return;let[i,a]=r;if(this.pickedType===i){this.confirmDone();return}let o=this.drawLayers.find(e=>e.id===a);o&&this.pauseDrawLayer(o),delete this.activeLayerIds[i],this.refreshCatalogLayerOptions(),this.refreshTypeCatalogCounts()}}connectedCallback(){super.connectedCallback(),this.touchMQ.addEventListener(`change`,this.onTouchMQChange)}get effectiveSnap(){return this.snapEnabled&&!this.altActive}static{this.styles=o`
        :host {
            /* Shared by the "Edit attributes" table's Attribute/Type
             * columns and the add-attribute form below it (the "Add
             * attribute" button, and the name input/type select once it's
             * expanded), so those stay visually aligned with the columns
             * above them without the values drifting apart. */
            --prop-attr-col-width: 46%;
            --prop-type-col-width: 32%;
            display: flex;
            flex-direction: column;
            padding: var(--webmapx-tool-padding, 0);
            min-width: 200px;
            max-height: var(--webmapx-draw-tool-max-height, 100%);
            /* Deliberately not 'hidden': an overflow value other than
             * 'visible' here would make :host itself the nearest ancestor
             * .session-footer's 'position: sticky' looks for — and since
             * :host's own height never actually gets clamped (see the
             * .session-footer comment below), nothing would ever overflow
             * it, so stickiness against it would be a no-op. Leaving this
             * 'visible' lets it pass through to the real scrolling
             * container, webmapx-tool-panel's .panel-content.
             */
            overflow: visible;
        }

        /* The editing session's .session-footer supplies its own matching
         * bottom padding (so that padding stays part of its opaque,
         * sticky-pinned box — see its own comment) — without this, :host's
         * padding would stack on top of it, doubling the gap below the
         * buttons whenever the attribute list is short enough not to need
         * scrolling. Views without a footer (type/layer pickers) are
         * unaffected and keep :host's own bottom padding as their gutter.
         */
        :host:has(.session-footer) {
            padding-bottom: 0;
        }

        .scroll-content {
            flex: 1;
            overflow-y: auto;
            min-height: 0;
        }

        /* Each mode row is its own boxed pill — select, draw shape, snap —
           since those are switches you pick between. Undo/redo/delete are
           one-off actions, not a mode, so they get the plain, unboxed
           .history-actions treatment instead (see below), slightly smaller
           than the mode icons they sit beside. */
        .pill {
            display: inline-flex;
            gap: 0.15rem;
            padding: 3px;
            border: 1px solid var(--color-background-secondary, #e2e5e8);
            border-radius: 8px;
            flex-shrink: 0;
        }
        .history-actions {
            display: inline-flex;
            align-items: center;
            gap: 0.1rem;
            flex-shrink: 0;
        }
        .toolbar-row {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            flex-wrap: wrap;
            margin-bottom: 0.5rem;
            flex-shrink: 0;
        }
        .toolbar-label {
            font-size: 0.66rem;
            font-weight: 700;
            color: var(--color-text-muted, #8a95a1);
            text-transform: uppercase;
            letter-spacing: 0.06em;
            width: 2.75rem;
            flex-shrink: 0;
        }
        /* Sized like the sl-icon-buttons beside it. A native button, not
           sl-icon-button, because only a real button can carry aria-pressed
           (see toggleButton). */
        .toggle-button {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            font-size: inherit;
            padding: var(--sl-spacing-x-small, 0.5rem);
            border: none;
            border-radius: 6px;
            background: none;
            color: var(--sl-color-neutral-600, #5a6773);
            cursor: pointer;
        }
        .toggle-button:not([aria-pressed="true"]):not(:disabled):hover {
            color: var(--color-primary, #2b6c8f);
            background: var(--color-background-secondary, #e8ebee);
        }
        .toggle-button:focus-visible {
            outline: var(--webmapx-focus-ring, 2px solid var(--color-primary, #2b6c8f));
            outline-offset: var(--webmapx-focus-offset, 2px);
        }
        .toggle-button[aria-pressed="true"] {
            color: #fff;
            background: var(--color-primary, #2b6c8f);
            box-shadow: 0 2px 6px -2px var(--color-primary, #2b6c8f);
        }
        .toggle-button:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }

        .help {
            font-size: 0.8rem;
            color: var(--color-text-secondary, #5a6773);
            margin-bottom: 0.5rem;
            min-height: 2.5em;
        }

        .section-label {
            font-size: 0.7rem;
            text-transform: uppercase;
            letter-spacing: 0.06em;
            color: var(--color-text-muted, #6b7681);
            margin-bottom: 0.25rem;
        }

        .flow-heading {
            font-size: 0.85rem;
            font-weight: 600;
            margin-bottom: 0.5rem;
        }

        /*
         * Sticks to the bottom of whichever ancestor is actually scrolling —
         * in practice webmapx-tool-panel's own .panel-content wrapper,
         * since :host's 'max-height: 100%' never resolves to a definite
         * size through the slot boundary (a percentage height on a flex item
         * that got its size from *shrinking* rather than an explicit height
         * or stretch isn't treated as definite for a descendant's percentage
         * resolution), so .scroll-content's own 'overflow-y: auto' never
         * actually engages and :host just grows to fit its content instead.
         * 'position: sticky' sidesteps that entirely: it pins relative to
         * whatever the real nearest scrolling ancestor turns out to be,
         * which is exactly what keeps this bar visible instead of scrolling
         * away with a long attribute list — see :host's 'overflow: visible'
         * above, which is what lets stickiness reach past this component's
         * own (non-scrolling) box to find it.
         */
        .session-footer {
            display: flex;
            align-items: center;
            justify-content: flex-end;
            gap: 0.5rem;
            margin-top: 0.6rem;
            padding-top: 0.5rem;
            /*
             * Matches :host's own padding (the gutter .panel-content itself
             * has none of — see :host's 'padding' above), so the buttons
             * keep the same distance from the panel's bottom edge whether
             * this bar is sitting in its natural, unstuck position (bounded
             * by :host's own bottom padding) or genuinely stuck against
             * .panel-content's edge while scrolling a long attribute list.
             * It's padding rather than the 'bottom' sticky offset so this
             * gap is part of the footer's own opaque box — pushed out as a
             * sticky offset instead, that strip would sit *below* the
             * footer's background, uncovered, letting whatever scrolled
             * content and its transparent backdrop happened to be there
             * show through underneath the buttons.
             */
            padding-bottom: var(--webmapx-tool-padding, 0);
            flex-shrink: 0;
            position: sticky;
            bottom: 0;
            background: var(--webmapx-panel-bg, rgb(var(--color-surface-rgb, 255 255 255) / var(--webmapx-surface-alpha, 1)));
            border-top: 1px solid var(--color-border-light, #e2e7ec);
        }

        /* Always rendered (unlike the hint, which only appears on a naming
           error) so the "Edit attributes" button stays pinned to the
           left edge and "Done" to the right, whichever else is showing. */
        .footer-spacer {
            flex: 1;
        }

        .name-required-hint {
            font-size: 0.78rem;
            color: var(--sl-color-danger-600, #dc2626);
        }

        .layer-picker-header {
            display: flex;
            align-items: center;
            margin-top: 0.75rem;
            margin-bottom: 0.5rem;
        }

        .add-layer-btn {
            flex-shrink: 0;
        }

        .editing-title-row {
            display: flex;
            flex-direction: column;
            gap: 0.3rem;
            margin-bottom: 0.5rem;
        }

        .editing-title-second-row {
            display: flex;
            align-items: center;
            gap: 0.3rem;
        }

        .editing-title-label {
            font-size: 0.8rem;
            color: var(--color-text-secondary, #5a6773);
            flex-shrink: 0;
        }


        .type-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 0.5rem;
        }

        .type-card {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 0.3rem;
            padding: 0.8rem 0.3rem;
            border: 1px solid var(--color-background-secondary, #e2e5e8);
            border-radius: 8px;
            background: transparent;
            cursor: pointer;
            font: inherit;
            color: inherit;
        }

        .type-card:hover {
            background: var(--color-background-secondary, #f4f6f8);
            border-color: var(--sl-color-primary-400, #7dc4fa);
        }

        .type-card[active] {
            background: var(--color-primary-soft, rgba(43, 108, 143, 0.12));
            border-color: var(--color-primary, #2b6c8f);
        }

        .type-icon {
            display: block;
            width: 100%;
        }

        .type-icon svg {
            width: 100%;
            height: auto;
            display: block;
        }

        .type-name { font-size: 0.72rem; font-weight: 600; text-align: center; line-height: 1.2; }
        .type-count { font-size: 0.68rem; color: var(--color-text-muted, #6b7681); }
        /* Muted text passes AA on white, not on the selected card's tint. */
        .type-card[active] .type-count { color: var(--color-text-secondary, #5a6773); }

        .empty-state {
            font-size: 0.82rem;
            color: var(--color-text-muted, #6b7681);
            padding: 0.4rem 0;
        }

        .layer-list {
            margin-bottom: 0.5rem;
        }

        .layer-group {
            display: flex;
            flex-direction: column;
            border: 1px solid var(--color-background-secondary, #e2e5e8);
            border-radius: 8px;
            overflow: hidden;
        }

        .layer-row {
            display: flex;
            align-items: center;
            gap: 0.4rem;
            padding: 0.5rem 0.6rem;
            font-size: 0.85rem;
            border-bottom: 1px solid var(--color-background-secondary, #e2e5e8);
        }

        .layer-row:last-child {
            border-bottom: none;
        }

        .layer-row:hover {
            background: var(--color-background-secondary, #f4f6f8);
        }

        .remove-layer-btn {
            font-size: 0.75rem;
        }

        .color-dot {
            flex-shrink: 0;
            box-sizing: border-box;
        }
        /* Shape echoes the geometry the layer holds — a small dot, a thin
           line, an outlined area — rather than one swatch shape for every
           layer type. Polygon's fill is a light tint (see swatchStyle,
           which appends alpha to the hex colour) with the outline carrying
           the full colour, so it reads as an area rather than a solid chip. */
        .color-dot--point {
            width: 6px; height: 6px;
            border-radius: 50%;
        }
        .color-dot--line {
            width: 12px;
            height: 2px;
            border-radius: 1px;
        }
        .color-dot--polygon {
            width: 10px; height: 10px;
            border-radius: 2px;
            border: 1.5px solid;
        }

        .layer-name-wrap {
            flex: 1;
            min-width: 0;
            display: flex;
            align-items: baseline;
            gap: 0.3rem;
            overflow: hidden;
            white-space: nowrap;
        }

        .layer-name {
            overflow: hidden;
            text-overflow: ellipsis;
        }

        .feature-count {
            flex-shrink: 0;
            color: var(--color-text-muted, #6b7681);
            font-size: 0.75rem;
        }

        .editing-layer-name {
            flex: 1;
            min-width: 0;
        }
        .editing-layer-name::part(base) {
            background: transparent;
            border: none;
            border-bottom: 1px dashed var(--color-background-secondary, #d5dce3);
            border-radius: 0;
            box-shadow: none;
        }
        .editing-layer-name::part(base):hover,
        .editing-layer-name::part(base):focus-within {
            background: var(--sl-input-background-color, #fff);
            border-bottom-style: solid;
            border-bottom-color: var(--sl-input-border-color, #d5dce3);
        }
        /* Shoelace's default focus ring is a box-shadow glow, sized for a
           form field — it overflows this title-sized rename box's bounds
           instead of hugging it. The border-bottom above (turned solid on
           focus, same as hover) is cue enough on its own. */
        .editing-layer-name::part(base):focus-within {
            border-bottom-color: var(--sl-color-primary-400, #6ea8dc);
            box-shadow: none;
        }
        /* "Done" refuses to leave a layer still called "New layer" — this is
           what tells the user why, instead of the button silently doing
           nothing. */
        .editing-layer-name.name-invalid::part(base) {
            background: var(--sl-color-danger-50, #fef2f2);
            border: 1px solid var(--sl-color-danger-500, #ef4444);
            border-radius: 4px;
        }
        .editing-layer-name.name-invalid::part(input) {
            color: var(--sl-color-danger-600, #dc2626);
        }
        /* A muted pencil is the "click to rename" tell — cheap to notice at a
           glance, unlike a hover-only border that only confirms editability
           after the user already suspected it. */
        .editing-layer-name-icon {
            color: var(--color-text-muted, #9aa4ad);
            font-size: 0.85rem;
            cursor: pointer;
        }
        .editing-layer-name:hover .editing-layer-name-icon,
        .editing-layer-name:focus-within .editing-layer-name-icon {
            color: var(--color-primary, #2b6c8f);
        }
        /* Same check/cross pairing as the attribute rename row's own
           "Save name"/"Cancel rename" buttons, so confirming or discarding
           an edit looks the same everywhere in this panel. Shown only while
           a rename is in progress — the pencil above returns once it's
           confirmed or cancelled. Muted to match the pencil's own resting
           color rather than Shoelace's default (near-black) icon color,
           which read as too heavy for a pair of small inline icons. */
        .editing-layer-name-confirm {
            font-size: 0.85rem;
            flex-shrink: 0;
            color: var(--color-text-muted, #9aa4ad);
        }
        .editing-layer-name-confirm::part(base) {
            padding: 0.1rem;
        }
        .editing-layer-name-confirm[name="check-lg"]:not([disabled])::part(base):hover {
            color: var(--color-primary, #2b6c8f);
        }
        .editing-layer-name-confirm[name="x-lg"]::part(base):hover {
            color: var(--sl-color-danger-600, #dc2626);
        }

        .color-swatch-wrap {
            position: relative;
            width: 22px; height: 22px;
            flex-shrink: 0;
            /* The "Back" row's arrow-icon-button has its glyph inset ~8px
               from the button's own edge; this swatch has no such inset, so
               without this it hangs visibly further left than everything
               above it instead of lining up with it. */
            margin-left: 8px;
        }
        .color-swatch {
            position: absolute;
            inset: 0;
            padding: 0;
            border: 2px solid var(--color-background-secondary, #e2e5e8);
            /* Read-only preview — styling is done from the Legend, not here. */
            pointer-events: none;
        }
        /* Shape echoes the geometry the layer holds, same as .color-dot. */
        .color-swatch--point {
            inset: 5px;
            border-radius: 50%;
        }
        .color-swatch--line {
            top: 50%;
            bottom: auto;
            height: 4px;
            margin-top: -2px;
            border-radius: 2px;
        }
        .color-swatch--polygon {
            border-radius: 4px;
        }

        .prop-table-wrap {
            overflow-x: auto;
            overflow-y: auto;
            max-height: 220px;
            margin-top: 0.4rem;
            border: 1px solid var(--color-background-secondary, #e2e7ec);
            border-radius: 4px;
        }
        /*
         * A CSS Grid, not an HTML table — deliberately. With mixed %/fixed
         * column widths (Type is a percentage, the trash column a fixed
         * 2.4rem) that don't sum to exactly 100%, 'table-layout: fixed'
         * redistributes the leftover space across columns using its own
         * (browser-specific, not simply proportional) algorithm — so a
         * td's *rendered* width stops matching 'width: var(...)' as
         * soon as a sibling column doesn't share that same unit. That
         * silently broke the add-attribute row's alignment below the table
         * (built from the same variables, but as plain flex items, which
         * don't have that redistribution): its width matched the
         * *specified* percentage while the table's own column had already
         * drifted away from it. Grid tracks are used exactly as specified
         * with no redistribution, so both places measure the same way and
         * stay in lockstep.
         */
        .prop-grid {
            display: grid;
            /* minmax(2.4rem, 1fr), not a flat 2.4rem: the first two columns
               are percentages that don't sum to 100% with a fixed-width
               third one, and unlike a table's own redistribution, Grid
               leaves genuinely unused tracks as blank space rather than
               filling the row — this is what absorbs that leftover width
               instead of leaving a bare strip between the table and the
               scrollbar. The icon still sits flush against the right edge
               via .prop-grid-cell--actions' justify-content: flex-end. */
            grid-template-columns: var(--prop-attr-col-width) var(--prop-type-col-width) minmax(2.4rem, 1fr);
            font-size: 0.76rem;
        }
        /* Each row is 'display: contents' — its cells become direct grid
           items (placed into the grid's row/column tracks automatically),
           while the wrapper still exists in the DOM for ':last-child' and
           the per-row auto/muted-row styling below. */
        .prop-grid-row {
            display: contents;
        }
        .prop-grid-cell {
            display: flex;
            align-items: center;
            min-width: 0;
            padding: 0.15rem 0.35rem;
            border-bottom: 1px solid var(--color-background-secondary, #e2e7ec);
        }
        .prop-grid-header .prop-grid-cell {
            font-weight: 600;
            background: var(--color-background-secondary, #f4f6f8);
            position: sticky;
            top: 0;
        }
        .prop-grid-cell--actions {
            padding-left: 0;
            padding-right: 0.2rem;
            justify-content: flex-end;
        }
        .prop-grid-row:last-child .prop-grid-cell { border-bottom: none; }
        .prop-row-auto .prop-grid-cell { color: var(--color-text-muted, #6b7681); font-style: italic; }
        /* The name cell's usual ellipsis/nowrap clipping (on .prop-cell-text)
           is for plain text — while it holds the rename row's input +
           confirm/cancel buttons instead, let it actually show all three
           rather than clipping them. */
        .prop-grid-cell:has(.rename-attr-row) { overflow: visible; }

        /* Plain cell text (the Type column, and the Attribute column outside
           a rename) — truncated on its own inner span rather than the flex
           cell itself, since text-overflow doesn't reliably apply directly
           to a flex container's text content. */
        .prop-cell-text {
            min-width: 0;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }

        /* The name, then the rename (pencil) icon pinned to the cell's far
           right edge — right before the Type column starts. */
        .prop-name-cell {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 0.2rem;
            min-width: 0;
            width: 100%;
        }

        .rename-attr-row {
            display: flex;
            align-items: center;
            gap: 0.15rem;
            width: 100%;
            min-width: 0;
        }
        .rename-attr-row sl-input {
            flex: 1;
            min-width: 0;
        }
        .rename-attr-row sl-input::part(base) {
            font-size: 0.76rem;
        }
        .rename-attr-btn {
            color: var(--color-text-muted, #6b7681);
            flex-shrink: 0;
        }
        .rename-attr-btn::part(base) { padding: 0.15rem; }
        .rename-attr-btn::part(base):hover { color: var(--color-text-primary, #16202a); }

        .remove-attr-btn {
            color: var(--sl-color-danger-600, #c0392b);
            font-size: 1.1rem;
        }
        .remove-attr-btn::part(base) { padding: 0.15rem; }
        .remove-attr-btn::part(base):hover { color: var(--sl-color-danger-700, #a52f22); }

        /* Red only once there's actually something to delete — an always-red
           trash can reads as "something's wrong" before a feature is even
           selected. */
        .delete-feature-btn:not([disabled]) {
            color: var(--sl-color-danger-600, #c0392b);
        }
        .delete-feature-btn:not([disabled])::part(base):hover {
            color: var(--sl-color-danger-700, #a52f22);
        }

        /* Shoelace's own body padding otherwise leaves a visible gap between
         * the dialog's title and this content — the table (or the undo/redo
         * row above it) sits right under the header instead. Left/right/
         * bottom padding are untouched. */
        #attributes-dialog::part(body) {
            padding-top: 0;
        }

        /* Shoelace's own footer is plain 'text-align: right', packing
         * everything slotted into it against the right edge — this spreads
         * "Optional attributes" to the left instead, lined up with the "Add
         * attribute" button above it (both start at the same left inset,
         * since --footer-spacing and --body-spacing match), while "Done"
         * stays on the right. */
        #attributes-dialog::part(footer) {
            display: flex;
            align-items: center;
            justify-content: space-between;
        }

        .add-attr-form {
            display: flex;
            flex-direction: column;
            gap: 0.4rem;
            margin-top: 0.5rem;
        }
        /* Kept unpadded/unbordered (unlike a typical form box) so the name
         * input and type select below resolve their column-matching widths
         * against the same reference as the table and the "Add attribute"
         * button — a wrapping box here would shrink that reference by its
         * own padding and throw the alignment off. A small gap separates
         * the input and select themselves (and the select from the cancel
         * icon) — flush against each other their focus rings visibly
         * overlapped. */
        .add-attr-fields-row {
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }
        /* Same width as the table's Attribute column, matching the "Add
         * attribute" button this replaces — so typing a name doesn't shift
         * anything, it just continues in the same slot. */
        .add-attr-name-input {
            flex: 0 0 var(--prop-attr-col-width);
            min-width: 0;
        }
        /* Appears once a name is typed, close to the name input, in the
         * Type column's own slot right next to it — the second step of
         * "name, then type" laid out the same way the table itself pairs an
         * attribute with its type. */
        .add-attr-type-select {
            flex: 0 0 var(--prop-type-col-width);
            min-width: 0;
        }
        /* Shoelace sizes the select's own closed-state text ("Choose a type")
         * from --sl-input-font-size-small, but sl-option hardcodes
         * --sl-font-size-medium internally regardless of the select's own
         * size — plain font-size can't reach through that, only overriding
         * the same custom property it reads (which, being a custom
         * property, still cascades through the shadow boundary). Otherwise
         * the opened list is noticeably larger than the placeholder that
         * opened it. */
        .add-attr-type-select sl-option {
            --sl-font-size-medium: var(--sl-font-size-small, 0.875rem);
        }
        /* "Add attribute" on the left, undo/redo on the right — one row,
         * not two, so the undo/redo pair doesn't cost the dialog a whole
         * extra line whenever there's nothing to add yet. */
        .add-attr-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-top: 0.5rem;
        }
        /* Same width as the table's Attribute column (--prop-attr-col-width)
         * — it's where a newly added row will land, right under that column. */
        .add-attr-btn-below {
            width: var(--prop-attr-col-width);
            flex-shrink: 0;
        }
        /* Undo/redo move here — one row below the add-attribute form — while
         * it's open, since the button they'd otherwise share a row with is
         * replaced by the form itself. Still right-aligned. */
        .add-attr-undo-row {
            display: flex;
            justify-content: flex-end;
        }
        /* Keeps the undo/redo icons themselves next to each other — see
         * renderAttributeUndoRedo for why this can't just be a gap on the
         * row that also holds the "Add attribute" button. */
        .add-attr-undo-group {
            display: flex;
            align-items: center;
            gap: 0.3rem;
        }
        /* Matches the "Add attribute" button's width, since it sits directly
         * below it (left-aligned in the footer — see ::part(footer) above).
         * The width has to go on the dropdown itself, not just the trigger
         * button: sl-dropdown's :host is shrink-to-fit (inline-block, no
         * explicit width), and a percentage width on a descendant of a
         * shrink-to-fit box can't resolve (the container's own size would
         * depend on it) — it silently falls back to the button's natural
         * content width instead. Giving the dropdown itself a definite
         * width breaks that, and the trigger just fills it at 100%. */
        .optional-attrs-dropdown {
            width: var(--prop-attr-col-width);
        }
        .optional-attrs-trigger {
            width: 100%;
        }
        .auto-attr-dropdown-panel {
            display: flex;
            flex-direction: column;
            gap: 0.45rem;
            padding: 0.6rem 0.7rem;
            background: var(--sl-panel-background-color, #fff);
            border: 1px solid var(--color-background-secondary, #e2e7ec);
            border-radius: 6px;
            box-shadow: var(--sl-shadow-medium);
        }
        .auto-attr-checkbox {
            display: flex;
            align-items: center;
            gap: 0.4rem;
            font-size: 0.82rem;
            cursor: pointer;
            white-space: nowrap;
        }
        /* A plain checkbox otherwise renders in the browser's own default
         * accent color, not the app's theme blue — accent-color is the
         * standards-based way to recolor native form controls without
         * rebuilding the checkbox from scratch. */
        .auto-attr-checkbox input[type="checkbox"] {
            accent-color: var(--color-primary, #2b6c8f);
        }
        .add-attr-note {
            font-size: 0.72rem;
            color: var(--color-text-muted, #6b7681);
            margin-top: 0.1rem;
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
        .feature-row.selected { background: var(--color-primary-soft, rgba(43, 108, 143, 0.12)); }

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
    `}onActivate(){if(this.adapter?.store.getState().mapLoaded?this.createSharedLayers():this.unsubMapLoaded=this.adapter?.store.subscribe(e=>{e.mapLoaded&&(this.unsubMapLoaded?.(),this.unsubMapLoaded=null,this.createSharedLayers())})??null,this.adapter){for(let e of this.ownsPermLayer)this.confirmedRestingLayerIds.add(e);this.reconcileExternallyDeletedLayers(this.adapter.store.getState()),this.unsubMapLayers=this.adapter.store.subscribe(e=>this.reconcileExternallyDeletedLayers(e))}for(let e of this.drawLayers)this.pausedLayerIds.has(e.id)||this.resumeDrawLayer(e);for(let e of[T,D,I,R,z,B,V,U,W,L])this.dispatchEvent(new CustomEvent(`webmapx-suppress-busy-for-source`,{detail:e,bubbles:!0,composed:!0}));this.bindEvents(),window.addEventListener(`keydown`,this.onKeyDown,!0),window.addEventListener(`keyup`,this.onKeyUp),window.addEventListener(`blur`,this.onWindowBlur),this.boundMap?.addEventListener(`webmapx-draw-finish-editing`,this.onFinishEditingRequest),this.setModeInternal(`select`),this.refreshTypeCatalogCounts()}onDeactivate(){this.unsubMapLoaded?.(),this.unsubMapLoaded=null,this.unsubMapLayers?.(),this.unsubMapLayers=null;for(let e of[T,D,I,R,z,B,V,U,W,L])this.dispatchEvent(new CustomEvent(`webmapx-unsuppress-busy-for-source`,{detail:e,bubbles:!0,composed:!0}));this.moveRafId!==null&&(cancelAnimationFrame(this.moveRafId),this.moveRafId=null);for(let[,e]of this.pendingSourceRefresh)cancelAnimationFrame(e);this.pendingSourceRefresh.clear(),this.pendingMoveEvent=null,this.unbindEvents(),window.removeEventListener(`keydown`,this.onKeyDown,!0),window.removeEventListener(`keyup`,this.onKeyUp),window.removeEventListener(`blur`,this.onWindowBlur),this.boundMap?.removeEventListener(`webmapx-draw-finish-editing`,this.onFinishEditingRequest),this.altActive=!1;for(let e of this.drawLayers)e.borrowedSourceId&&this.restoreBorrowedLayer(e),this.suspendDrawLayerFromMap(e);this.draftPoints=[],this.circleDraft=null,this.rectDraft=null,this.rectSelectDraft=null,this.lassoSelectDraft=null,this.cursorPos=null,this.snapPos=null,this.lastCursorPx=null,this.dragging=null,this.featureDrag=null,this.selectedFeatureId=null,this.selectedFeatureIds=[],this.editState=`none`,this.editHandles=[],this.adapter?.setPanEnabled(!0),this.adapter?.setDoubleClickZoomEnabled(!0),this.updateSelectedSource(),this.removeSharedLayers(),this.adapter?.setCursor(``)}disconnectedCallback(){this.touchMQ.removeEventListener(`change`,this.onTouchMQChange),this.unsubMapLayers?.(),this.unsubMapLayers=null,super.disconnectedCallback()}updated(e){if(super.updated(e),e.has(`drawLayers`))for(let e of this.drawLayers)this.syncLayerPropertiesToStore(e.id,e.properties)}onMapAttached(e){this.boundMap=this.mapHost,super.onMapAttached(e)}onMapDetached(){this.removeAllMapLayers(),super.onMapDetached(),this.boundMap=null}createSharedLayers(){if(!this.sharedLayersCreated){this.dispatch(`webmapx-add-source`,{id:T,config:{type:`geojson`,data:{type:`FeatureCollection`,features:[]}}}),this.dispatch(`webmapx-add-source`,{id:D,config:{type:`geojson`,data:{type:`FeatureCollection`,features:[]}}}),this.dispatch(`webmapx-add-layer`,{id:E,type:`line`,source:T,metadata:{isToolLayer:!0,hideFromLegend:!0},paint:{"line-color":h,"line-width":2}}),this.dispatch(`webmapx-add-layer`,{id:O,type:`circle`,source:D,metadata:{isToolLayer:!0,hideFromLegend:!0},paint:{"circle-radius":8,"circle-color":`transparent`,"circle-stroke-width":2,"circle-stroke-color":`#ff6600`}}),this.dispatch(`webmapx-add-source`,{id:L,config:{type:`geojson`,data:{type:`FeatureCollection`,features:[]}}}),this.dispatch(`webmapx-add-layer`,{id:Te,type:`circle`,source:L,metadata:{isToolLayer:!0,hideFromLegend:!0},paint:{"circle-radius":4,"circle-color":[`get`,`color`]}}),this.dispatch(`webmapx-add-source`,{id:I,config:{type:`geojson`,data:{type:`FeatureCollection`,features:[]}}}),this.dispatch(`webmapx-add-layer`,{id:we,type:`circle`,source:I,metadata:{isToolLayer:!0,hideFromLegend:!0},paint:{"circle-radius":5,"circle-color":m,"circle-stroke-width":2,"circle-stroke-color":h}}),this.dispatch(`webmapx-add-source`,{id:R,config:{type:`geojson`,data:{type:`FeatureCollection`,features:[]}}}),this.dispatch(`webmapx-add-layer`,{id:Ee,type:`circle`,source:R,metadata:{isToolLayer:!0,hideFromLegend:!0},paint:{"circle-radius":6,"circle-color":m,"circle-stroke-width":2,"circle-stroke-color":h}}),this.dispatch(`webmapx-add-source`,{id:z,config:{type:`geojson`,data:{type:`FeatureCollection`,features:[]}}}),this.dispatch(`webmapx-add-layer`,{id:De,type:`circle`,source:z,metadata:{isToolLayer:!0,hideFromLegend:!0},paint:{"circle-radius":4,"circle-color":m,"circle-stroke-width":1.5,"circle-stroke-color":h,"circle-opacity":.7}}),this.dispatch(`webmapx-add-source`,{id:B,config:{type:`geojson`,data:{type:`FeatureCollection`,features:[]}}}),this.dispatch(`webmapx-add-layer`,{id:Oe,type:`circle`,source:B,metadata:{isToolLayer:!0,hideFromLegend:!0},paint:{"circle-radius":F,"circle-color":this.cssVar(`--webmapx-draw-selected-color`,P),"circle-stroke-width":2,"circle-stroke-color":`#fff`}}),this.dispatch(`webmapx-add-source`,{id:V,config:{type:`geojson`,data:{type:`FeatureCollection`,features:[]}}}),this.dispatch(`webmapx-add-layer`,{id:Ae,type:`circle`,source:V,metadata:{isToolLayer:!0,hideFromLegend:!0},paint:{"circle-radius":7,"circle-color":`#ffdd00`,"circle-stroke-width":2,"circle-stroke-color":`#fff`,"circle-opacity":.9}}),this.dispatch(`webmapx-add-source`,{id:U,config:{type:`geojson`,data:{type:`FeatureCollection`,features:[]}}}),this.dispatch(`webmapx-add-layer`,{id:Me,type:`fill`,source:U,metadata:{isToolLayer:!0,hideFromLegend:!0},paint:{"fill-color":h,"fill-opacity":.12}}),this.dispatch(`webmapx-add-layer`,{id:Ne,type:`line`,source:U,metadata:{isToolLayer:!0,hideFromLegend:!0},paint:{"line-color":h,"line-width":1.5,"line-dasharray":[2,2]}}),this.dispatch(`webmapx-add-source`,{id:W,config:{type:`geojson`,data:{type:`FeatureCollection`,features:[]}}}),this.dispatch(`webmapx-add-layer`,{id:Pe,type:`circle`,source:W,metadata:{isToolLayer:!0,hideFromLegend:!0},paint:{"circle-radius":F,"circle-color":P,"circle-opacity":.8}}),this.sharedLayersCreated=!0;for(let e of this.drawLayers)this.pausedLayerIds.has(e.id)||(this.addMapLayersForDrawLayer(e),this.refreshDrawLayerSource(e.id))}}addMapLayersForDrawLayer(e){this.createdDrawLayerIds.has(e.id)||(e.type===`Point`&&this.dispatch(`webmapx-add-source`,{id:j(e.id,e.type),config:{type:`geojson`,data:{type:`FeatureCollection`,features:[]}}}),this.dispatch(`webmapx-add-layer`,{...N(e.id,e,this.currentDrawLayerColor(e),{label:e.name,legendRole:`overlay`,hideFromLegend:!0}),beforeLayerId:E}),this.createdDrawLayerIds.add(e.id))}removeMapLayersForDrawLayer(e){this.dispatch(`webmapx-remove-layer`,e.id),this.dispatch(`webmapx-remove-source`,j(e.id,e.type)),this.adapter?.store&&f(this.adapter.store,e.id),this.createdDrawLayerIds.delete(e.id)}removeSharedLayers(){for(let e of[E,O,we,Ee,De,Oe,Ae,Me,Ne,Pe,Te])this.dispatch(`webmapx-remove-layer`,e);for(let e of[T,D,I,R,z,B,V,U,W,L])this.dispatch(`webmapx-remove-source`,e);this.sharedLayersCreated=!1}removeAllMapLayers(){this.removeSharedLayers();for(let e of this.drawLayers)this.removeMapLayersForDrawLayer(e);this.createdDrawLayerIds.clear()}refreshDrawLayerSource(e){this.pendingSourceRefresh.has(e)||this.pendingSourceRefresh.set(e,requestAnimationFrame(()=>{this.pendingSourceRefresh.delete(e),this.flushDrawLayerSource(e)}))}outgoingProperties(e){return Le(e.type)?{...e.properties,__dashed:e.dashed===!0}:e.properties}flushDrawLayerSource(e){let t=this.features.filter(t=>t.layerId===e).map(e=>({type:`Feature`,id:e.id,geometry:{type:e.type,coordinates:e.coordinates},properties:this.outgoingProperties(e)})),n=this.drawLayers.find(t=>t.id===e)?.type??`Polygon`;this.dispatch(`webmapx-set-source-data`,{id:j(e,n),data:{type:`FeatureCollection`,features:t}});let r=this.drawLayers.find(t=>t.id===e);if(r?.borrowedSourceId&&this.adapter?.store){let e={type:`FeatureCollection`,features:t};this.setBorrowedLayerMetadata(r.borrowedSourceId,{sourceData:e})}}setBorrowedLayerMetadata(e,t){if(!this.adapter?.store)return;let n=this.adapter.store.getState().mapLayers??{},[r,i]=Object.entries(n).find(([,t])=>t.sourceId===e)??[];r&&i&&this.adapter.store.dispatch({mapLayers:{...n,[r]:{...i,...t}}},`MAP`)}cssVar(e,t){return getComputedStyle(this).getPropertyValue(e).trim()||t}get modKey(){return/Mac|iPhone|iPad/.test(navigator.platform)?`Cmd`:`Ctrl`}isTypingTarget(e){let t=e.composedPath()[0],n=t?.tagName?.toLowerCase();return n===`input`||n===`textarea`||n===`sl-input`||n===`sl-textarea`||t?.isContentEditable===!0}isRelevantTarget(e){let t=e.composedPath(),n=this.mapHost;if(t.includes(this)||n&&t.includes(n))return!0;let r=t[0];return r===document.body||r===document.documentElement}bindEvents(){this.adapter&&(this.unsubClick=this.adapter.events.on(`click`,e=>this.handleClick(e)),this.unsubMove=this.adapter.events.on(`pointer-move`,e=>{this.pendingMoveEvent=e,this.moveRafId===null&&(this.moveRafId=requestAnimationFrame(()=>{this.moveRafId=null,this.pendingMoveEvent&&this.handlePointerMove(this.pendingMoveEvent),this.pendingMoveEvent=null}))}),this.unsubCtx=this.adapter.events.on(`contextmenu`,e=>this.handleContextMenu(e)),this.unsubDown=this.adapter.events.on(`pointer-down`,e=>this.handlePointerDown(e)),this.unsubUp=this.adapter.events.on(`pointer-up`,e=>this.handlePointerUp(e)),this.unsubLeave=this.adapter.events.on(`pointer-leave`,()=>this.handlePointerLeave()))}unbindEvents(){this.unsubClick?.(),this.unsubClick=null,this.unsubMove?.(),this.unsubMove=null,this.unsubCtx?.(),this.unsubCtx=null,this.unsubDown?.(),this.unsubDown=null,this.unsubUp?.(),this.unsubUp=null,this.unsubLeave?.(),this.unsubLeave=null}nextDefaultLayerName(e){let t=new Set(this.drawLayers.filter(t=>t.type===e).map(e=>e.name));if(!t.has(k))return k;let n=2;for(;t.has(`${k} (${n})`);)n++;return`${k} (${n})`}async createNewLayer(){let e=this.pickedType;e&&(await this.applyLayerConfig({...y(e),name:this.nextDefaultLayerName(e)}),this.active&&(this.setModeInternal(q(e)),await this.updateComplete,this.editingLayerNameInput?.select()))}async getEditableMapLayers(e){if(!this.adapter)return[];let t=this.adapter.store.getState().mapLayers??{},n=new Set,r=[],i=new Set(this.drawLayers.map(e=>M(e.id)));for(let[a,o]of Object.entries(t)){if(o.isToolLayer||this.createdDrawLayerIds.has(a)||i.has(a))continue;let t=typeof o.sourceId==`string`?o.sourceId:null;if(!t||n.has(t))continue;let s=this.adapter.getSourceData(t);if(!s)continue;let c=await this.resolveFeatureCollection(s);if(typeof s==`string`){let i=c?.features[0]?.geometry?.type,s=i?this.geometryFamilyForGeoJSONType(i):null,l=this.geometryFamilyForLayerType(o.layerType);if((s??l)!==e)continue;n.add(t),r.push({layerId:a,sourceId:t,label:o.label??a,properties:o.properties??(c?this.inferPropertyDefs(c):void 0),allowedAttributes:o.attributes?.allowedAttributes??void 0});continue}let l=s.features[0]?.geometry?.type,u=l?this.geometryFamilyForGeoJSONType(l):null,d=this.geometryFamilyForLayerType(o.layerType);(u??d)===e&&(n.add(t),r.push({layerId:a,sourceId:t,label:o.label??a,properties:o.properties??this.inferPropertyDefs(s),allowedAttributes:o.attributes?.allowedAttributes??void 0}))}return r}async resolveFeatureCollection(e){if(typeof e!=`string`)return e;try{let t=await fetch(e);return t.ok?await t.json():null}catch{return null}}geometryFamilyForGeoJSONType(e){return e===`Point`||e===`MultiPoint`?`Point`:e===`LineString`||e===`MultiLineString`?`LineString`:e===`Polygon`||e===`MultiPolygon`?`Polygon`:null}geometryFamilyForLayerType(e){return e===`circle`?`Point`:e===`line`?`LineString`:e===`fill`?`Polygon`:null}inferPropertyDefs(e){let t=e.features.find(e=>e.properties&&Object.keys(e.properties).length>0)?.properties;return t?Object.entries(t).filter(([e])=>!e.startsWith(`__`)).map(([e,t])=>({name:e,type:typeof t==`number`?`number`:`string`})):[{name:`id`,type:`number`},{name:`name`,type:`string`}]}isSelectMode(e=this.mode){return e===`select`||e===`select-rect`||e===`select-lasso`}isEditMode(e=this.mode){return e===`edit-move`||e===`edit-vertices`}isDrawMode(e=this.mode){return e===`draw-point`||e===`draw-line`||e===`draw-line-dashed`||e===`draw-polygon`||e===`draw-circle`||e===`draw-rectangle`}isSingleFeatureFocusMode(e=this.mode){return e===`edit-move`||e===`edit-vertices`||e===`attributes`}carriesFocusInto(e){return this.isSingleFeatureFocusMode(e)||this.isDrawMode(e)&&this.selectedFeatureId!==null}setModeInternal(e){this.circleDraft&&(this.circleDraft=null,this.adapter?.setPanEnabled(!0)),this.rectDraft&&(this.rectDraft=null,this.adapter?.setPanEnabled(!0)),this.rectSelectDraft&&(this.rectSelectDraft=null,this.updateMarquee(null),this.adapter?.setPanEnabled(!0)),this.lassoSelectDraft&&(this.lassoSelectDraft=null,this.updateMarquee(null),this.adapter?.setPanEnabled(!0));let t=this.mode;switch(this.mode=e,this.draftPoints=[],this.cursorPos=null,this.snapPos=null,this.lastCursorPx=null,this.updateRubberband(),this.isDrawMode(t)&&!this.isDrawMode(e)&&(this.drawHistory=[],this.drawHistoryIndex=-1,this.draftRedoStack=[]),e){case`select`:case`select-rect`:case`select-lasso`:this.adapter?.setDoubleClickZoomEnabled(!0),this.adapter?.setCursor(e===`select`?``:`crosshair`),this.isSelectMode(t)||(this.selectedFeatureId=null,this.selectedFeatureIds=[],this.hoveredFeatureId=null,this.editState=`none`,this.editHandles=[],this.updateSelectedSource(),this.updateMultiSelectSource(),this.updateEditHandles()),this.helpText=e===`select`?`Click a feature to delete it.`:e===`select-rect`?`Drag a rectangle to delete the features inside it.`:`Draw a free-hand shape to delete the features inside it.`;break;case`attributes`:this.adapter?.setDoubleClickZoomEnabled(!0),this.adapter?.setCursor(``),this.carriesFocusInto(t)||(this.selectedFeatureId=null),this.selectedFeatureIds=this.selectedFeatureId?[this.selectedFeatureId]:[],this.hoveredFeatureId=null,this.editState=`none`,this.editHandles=[],this.updateSelectedSource(),this.updateMultiSelectSource(),this.updateEditHandles(),this.helpText=`Hover a feature to preview it, then click to view or edit its attributes.`,this.selectedFeatureId&&this.updateComplete.then(()=>this.focusFirstAttributeValueInput());break;case`edit-move`:case`edit-vertices`:{this.adapter?.setDoubleClickZoomEnabled(!0),this.adapter?.setCursor(``),this.carriesFocusInto(t)||(this.selectedFeatureId=null),this.selectedFeatureIds=[],this.hoveredFeatureId=null,this.editHandles=[];let n=this.selectedFeatureId?this.features.find(e=>e.id===this.selectedFeatureId):null;this.editState=n?e===`edit-vertices`?`editing`:$(n.type)?`none`:`selected`:`none`,this.updateSelectedSource(),this.updateMultiSelectSource(),this.updateEditHandles(),this.helpText=e===`edit-move`?`Click a feature to select it, or drag it directly to move it.`:`Click a feature to edit its points — drag one to reshape it, or select one and press Delete to remove it.`;break}case`draw-point`:case`draw-line`:case`draw-line-dashed`:case`draw-polygon`:case`draw-circle`:case`draw-rectangle`:this.adapter?.setDoubleClickZoomEnabled(!1),this.editState=`none`,this.editHandles=[],this.selectedFeatureId=null,this.selectedFeatureIds=[],this.updateEditHandles(),this.updateSelectedSource(),this.updateMultiSelectSource(),this.adapter?.setCursor(`crosshair`),this.helpText=this.mode===`draw-point`?`Click to place a point.`:this.mode===`draw-line`||this.mode===`draw-line-dashed`?`Click to add vertices. Right-click or double-click to finish.`:this.mode===`draw-circle`?`Click and drag to draw a circle.`:this.mode===`draw-rectangle`?`Click and drag to draw a rectangle.`:`Click to add vertices. Click first point or double-click to close.`;break}}async applyLayerConfig(e,t){let n=e,r=this.activeLayerIds[n.type];if(r&&r!==n.id){let e=this.drawLayers.find(e=>e.id===r);e&&this.pauseDrawLayer(e)}let i=this.drawLayers.findIndex(e=>e.id===n.id);if(i>=0)this.drawLayers=this.drawLayers.map((e,t)=>t===i?n:e);else if(n.borrowedSourceId||(n={...n,borrowedSourceId:this.createPermLayer(n)},this.ownsPermLayer.add(n.id)),this.drawLayers=[...this.drawLayers,n],this.addMapLayersForDrawLayer(n),n.borrowedSourceId&&this.adapter){let e=t??this.adapter.getSourceData(n.borrowedSourceId),r=e?await this.resolveFeatureCollection(e):null;if(r){let e=[];for(let t of r.features){if(!t.geometry||!Ie(t.geometry.type))continue;let r={...t.properties},i=r.__dashed===!0;delete r.__dashed,e.push({id:this.newId(),layerId:n.id,type:t.geometry.type,coordinates:t.geometry.coordinates,properties:r,dashed:i})}if(this.features=[...this.features,...e],n.properties.length<=2){let e=this.inferPropertyDefs(r);n={...n,properties:e},this.drawLayers=this.drawLayers.map(e=>e.id===n.id?n:e)}}this.active?(this.adapter.getSource(n.borrowedSourceId)?.setData({type:`FeatureCollection`,features:[]}),this.setBorrowedLayerMetadata(n.borrowedSourceId,{borrowedByDrawTool:!0})):this.restoreBorrowedLayer(n)}this.activeLayerIds[n.type]=n.id,this.refreshDrawLayerSource(n.id),this.syncLayerPropertiesToStore(n.id,n.properties),this.pendingMode&&=(this.active&&this.setModeInternal(this.pendingMode),null),this.pickedType=n.type,this.panelView=`editing`,this.addingAttribute=!1,this.newAttrName=``,this.newAttrType=``,this.layerNameInvalid=!1,this.layerNameDraft=null,this.removedAttributeStack=[],this.removedAttributeRedoStack=[],this.cancelRenameAttribute()}restoreBorrowedLayer(e){if(!e.borrowedSourceId||!this.adapter)return;let t={type:`FeatureCollection`,features:this.features.filter(t=>t.layerId===e.id).map(e=>({type:`Feature`,geometry:{type:e.type,coordinates:e.coordinates},properties:this.outgoingProperties(e)}))};this.adapter.getSource(e.borrowedSourceId)?.setData(t),this.setBorrowedLayerMetadata(e.borrowedSourceId,{borrowedByDrawTool:!1,sourceData:t})}createPermLayer(e){let t=M(e.id);return e.type===`Point`&&this.dispatch(`webmapx-add-source`,{id:j(t,e.type),config:{type:`geojson`,data:{type:`FeatureCollection`,features:[]}}}),this.dispatch(`webmapx-add-layer`,{...N(t,e,e.color,{label:e.name,legendRole:`overlay`,properties:e.properties,borrowedByDrawTool:!0,hideFromLegend:Q(e.name)}),beforeLayerId:E}),j(t,e.type)}releaseBorrowedLayer(e){if(e.borrowedSourceId){this.restoreBorrowedLayer(e),this.removeMapLayersForDrawLayer(e),this.features=this.features.filter(t=>t.layerId!==e.id),this.drawLayers=this.drawLayers.filter(t=>t.id!==e.id);for(let[t,n]of Object.entries(this.activeLayerIds))n===e.id&&delete this.activeLayerIds[t]}}suspendDrawLayerFromMap(e){this.dispatch(`webmapx-remove-layer`,e.id),this.dispatch(`webmapx-remove-source`,j(e.id,e.type)),this.adapter?.store&&f(this.adapter.store,e.id),this.createdDrawLayerIds.delete(e.id)}releaseLayer(e){this.ownsPermLayer.has(e.id)&&this.removePermLayer(e),this.releaseBorrowedLayer(e),this.pausedLayerIds.delete(e.id),this.ownsPermLayer.delete(e.id),this.confirmedRestingLayerIds.delete(e.id),this.refreshCatalogLayerOptions(),this.refreshTypeCatalogCounts()}removePermLayer(e){let t=M(e.id);this.dispatch(`webmapx-remove-layer`,t),this.dispatch(`webmapx-remove-source`,j(t,e.type)),this.adapter?.store&&f(this.adapter.store,t)}pauseDrawLayer(e){e.borrowedSourceId&&this.restoreBorrowedLayer(e),this.suspendDrawLayerFromMap(e),this.pausedLayerIds.add(e.id)}resumeDrawLayer(e){this.pausedLayerIds.delete(e.id),this.createdDrawLayerIds.has(e.id)||(this.addMapLayersForDrawLayer(e),this.refreshDrawLayerSource(e.id)),e.borrowedSourceId&&this.adapter&&(this.adapter.getSource(e.borrowedSourceId)?.setData({type:`FeatureCollection`,features:[]}),this.setBorrowedLayerMetadata(e.borrowedSourceId,{borrowedByDrawTool:!0}))}reconcileExternallyDeletedLayers(e){let t=e.mapLayers??{};for(let e of[...this.drawLayers])if(this.ownsPermLayer.has(e.id)){if(t[M(e.id)]){this.confirmedRestingLayerIds.add(e.id);continue}this.confirmedRestingLayerIds.has(e.id)&&this.handleExternallyDeletedLayer(e)}let n=Object.keys(t).sort().join(`,`);n!==this.lastMapLayerIdsKey&&(this.lastMapLayerIdsKey=n,this.refreshCatalogLayerOptions(),this.refreshTypeCatalogCounts())}handleExternallyDeletedLayer(e){let t=this.panelView===`editing`&&this.pickedType===e.type&&this.activeLayerIds[e.type]===e.id;this.releaseLayer(e),t&&(this.selectedFeatureId=null,this.setModeInternal(`select`),this.panelView=`layers`)}selectType(e){this.pickedType=e,this.panelView=`layers`,this.refreshCatalogLayerOptions()}async refreshTypeCatalogCounts(){if(!this.adapter){this.catalogLayerCounts={};return}let e=[`Point`,`LineString`,`Polygon`],t=await Promise.all(e.map(e=>this.getEditableMapLayers(e))),n={};e.forEach((e,r)=>{n[e]=t[r].length}),this.catalogLayerCounts=n}async refreshCatalogLayerOptions(){let e=this.pickedType;if(!e||!this.adapter){this.catalogLayerOptions=[];return}let t=await this.getEditableMapLayers(e);this.pickedType===e&&(this.catalogLayerOptions=t)}cancelEditCatalogLayer(){this.pendingCatalogEditOption=null}startEditingCatalogLayer(e){if(this.pendingCatalogEditOption=null,!this.pickedType||!this.adapter)return;let t=this.pickedType,n=y(t),r={...n,name:`Copy of ${e.label}`,properties:e.properties?.map(e=>({...e}))??n.properties},i=this.adapter.getSourceData(e.sourceId)??void 0;this.adapter.setLayerVisibility(e.layerId,!1),this.pendingMode=`select`,this.applyLayerConfig(r,i)}startEditingLayer(e){this.resumeDrawLayer(e),this.activeLayerIds[e.type]=e.id,this.pickedType=e.type,this.setModeInternal(`select`),this.panelView=`editing`,this.addingAttribute=!1,this.newAttrName=``,this.newAttrType=``,this.layerNameInvalid=!1,this.layerNameDraft=null,this.removedAttributeStack=[],this.removedAttributeRedoStack=[],this.cancelRenameAttribute()}stopEditingCurrent(){if(!this.pickedType)return;let e=this.activeLayerIds[this.pickedType],t=e?this.drawLayers.find(t=>t.id===e):void 0;this.selectedFeatureId=null,this.setModeInternal(`select`),this.updateSelectedSource(),t&&this.pauseDrawLayer(t),delete this.activeLayerIds[this.pickedType],this.panelView=`layers`,this.refreshCatalogLayerOptions(),this.refreshTypeCatalogCounts()}confirmDone(){let e=this.pickedType,t=e?this.activeLayerIds[e]:void 0,n=t?this.drawLayers.find(e=>e.id===t):void 0;if(n&&this.layerNameDraft!==null&&(this.commitLayerNameEdit(n),n=this.drawLayers.find(e=>e.id===t)),n&&Q(n.name)){this.layerNameInvalid=!0,this.editingLayerNameInput?.select();return}this.layerNameInvalid=!1,this.showDrawIntro=!1,this.stopEditingCurrent()}focusFirstAttributeValueInput(){let e=this.shadowRoot?.querySelectorAll(`.prop-row sl-input`);if(!e||e.length===0)return;let t=Array.from(e).find(e=>!e.value),n=this.lastFocusedAttributeName?Array.from(e).find(e=>e.closest(`.prop-row`)?.dataset.attrName===this.lastFocusedAttributeName):void 0,r=t??n??e[0];r.focus(),this.lastFocusedAttributeName=r.closest(`.prop-row`)?.dataset.attrName??null}updateActiveLayerName(e,t){let n=t.trim();if(!n||n===e.name)return;let r=Q(e.name)&&this.ownsPermLayer.has(e.id);this.drawLayers=this.drawLayers.map(t=>t.id===e.id?{...t,name:n}:t),this.layerNameInvalid=!1,e.borrowedSourceId&&this.setBorrowedLayerMetadata(e.borrowedSourceId,{label:n,...r?{hideFromLegend:!1}:{}}),r&&(this.dispatch(`webmapx-tool-select`,{toolId:`layerOverview`,previousToolId:null}),this.setModeInternal(q(e.type)))}layerNameDraftValid(){return(this.layerNameDraft??``).trim().length>0}commitLayerNameEdit(e){this.layerNameDraft===null||!this.layerNameDraftValid()||(this.updateActiveLayerName(e,this.layerNameDraft),this.layerNameDraft=null)}cancelLayerNameEdit(){this.layerNameDraft=null}currentDrawLayerColor(e){let t=this.adapter?.store.getState().mapLayers?.[M(e.id)];if(!t)return e.color;if(e.type===`Point`){let n=t.paint?.[`circle-color`];return typeof n==`string`?n:e.color}let n=M(e.id),r=e.type===`Polygon`?`fill-color`:`line-color`,i=e.type===`Polygon`?`${n}-fill`:`${n}-solid`,a=t.sublayers?.find(e=>e.id===i)?.paint?.[r];return typeof a==`string`?a:e.color}syncLayerPropertiesToStore(e,t){let n=M(e);if(!this.adapter?.store)return;let r=this.adapter.store.getState().mapLayers??{},i=r[n];i&&this.adapter.store.dispatch({mapLayers:{...r,[n]:{...i,properties:t}}},`MAP`)}addActiveLayerProperty(e){let t=this.newAttrName.trim();if(!t||!this.newAttrType||e.properties.some(e=>e.name===t))return;let n=[...e.properties,{name:t,type:this.newAttrType}];this.drawLayers=this.drawLayers.map(t=>t.id===e.id?{...t,properties:n}:t),this.syncLayerPropertiesToStore(e.id,n),this.cancelAddAttribute(),this.cancelRenameAttribute(),this.updateComplete.then(()=>this.scrollPropertyListToBottom())}scrollPropertyListToBottom(){let e=this.shadowRoot?.querySelector(`.prop-table-wrap`);e&&e.scrollTo({top:e.scrollHeight,behavior:`smooth`})}availableAutoAttributeTypes(e){return _[e.type].filter(e=>v[e])}isAutoAttributeChecked(e,t){let n=v[t];return!!(n&&e.properties.some(e=>e.name===n.name))}toggleAutoAttribute(e,t){let n=v[t];if(!n)return;let r=this.isAutoAttributeChecked(e,t)?e.properties.filter(e=>e.name!==n.name):[...e.properties,{name:n.name,type:t}];this.drawLayers=this.drawLayers.map(t=>t.id===e.id?{...t,properties:r}:t),this.syncLayerPropertiesToStore(e.id,r),this.cancelRenameAttribute()}cancelAddAttribute(){this.addingAttribute=!1,this.newAttrName=``,this.newAttrType=``}removeActiveLayerProperty(e,t){let n=e.properties[t],r=e.properties.filter((e,n)=>n!==t);this.drawLayers=this.drawLayers.map(t=>t.id===e.id?{...t,properties:r}:t),this.syncLayerPropertiesToStore(e.id,r);let i=[];this.features=this.features.map(t=>{if(t.layerId!==e.id||!(n.name in t.properties))return t;i.push({featureId:t.id,value:t.properties[n.name]});let{[n.name]:r,...a}=t.properties;return{...t,properties:a}}),this.removedAttributeStack=[...this.removedAttributeStack,{index:t,property:n,values:i}],this.removedAttributeRedoStack=[],this.cancelRenameAttribute(),this.refreshDrawLayerSource(e.id)}undoRemoveAttribute(e){if(this.removedAttributeStack.length===0)return;let t=this.removedAttributeStack[this.removedAttributeStack.length-1];if(this.removedAttributeStack=this.removedAttributeStack.slice(0,-1),e.properties.some(e=>e.name===t.property.name))return;let n=[...e.properties];n.splice(Math.min(t.index,n.length),0,t.property),this.drawLayers=this.drawLayers.map(t=>t.id===e.id?{...t,properties:n}:t),this.syncLayerPropertiesToStore(e.id,n);let r=new Map(t.values.map(e=>[e.featureId,e.value]));this.features=this.features.map(e=>r.has(e.id)?{...e,properties:{...e.properties,[t.property.name]:r.get(e.id)}}:e),this.removedAttributeRedoStack=[...this.removedAttributeRedoStack,t],this.cancelRenameAttribute(),this.refreshDrawLayerSource(e.id)}redoRemoveAttribute(e){if(this.removedAttributeRedoStack.length===0)return;let t=this.removedAttributeRedoStack[this.removedAttributeRedoStack.length-1];this.removedAttributeRedoStack=this.removedAttributeRedoStack.slice(0,-1);let n=e.properties.filter(e=>e.name!==t.property.name);this.drawLayers=this.drawLayers.map(t=>t.id===e.id?{...t,properties:n}:t),this.syncLayerPropertiesToStore(e.id,n);let r=new Set(t.values.map(e=>e.featureId));this.features=this.features.map(e=>{if(!r.has(e.id)||!(t.property.name in e.properties))return e;let{[t.property.name]:n,...i}=e.properties;return{...e,properties:i}}),this.removedAttributeStack=[...this.removedAttributeStack,t],this.cancelRenameAttribute(),this.refreshDrawLayerSource(e.id)}renderAttributeUndoRedo(e){return s`
            <span class="add-attr-undo-group">
                <sl-tooltip content="Undo remove">
                    <sl-icon-button name="arrow-counterclockwise" size="small" label="Undo remove"
                        ?disabled=${this.removedAttributeStack.length===0}
                        @click=${()=>this.undoRemoveAttribute(e)}>
                    </sl-icon-button>
                </sl-tooltip>
                <sl-tooltip content="Redo remove">
                    <sl-icon-button name="arrow-clockwise" size="small" label="Redo remove"
                        ?disabled=${this.removedAttributeRedoStack.length===0}
                        @click=${()=>this.redoRemoveAttribute(e)}>
                    </sl-icon-button>
                </sl-tooltip>
            </span>
        `}canRenameAttribute(e){return e.name!==`id`&&!oe.has(e.type)}startRenameAttribute(e,t){this.renamingAttributeIndex=e,this.renameAttrDraft=t}cancelRenameAttribute(){this.renamingAttributeIndex=null,this.renameAttrDraft=``}renameAttributeDraftValid(e,t){let n=this.renameAttrDraft.trim(),r=e.properties[t]?.name;return!r||!n||n===r?!1:!e.properties.some((e,r)=>r!==t&&e.name===n)}commitRenameAttribute(e,t){if(!this.renameAttributeDraftValid(e,t)){this.cancelRenameAttribute();return}let n=this.renameAttrDraft.trim(),r=e.properties[t].name,i=e.properties.map((e,r)=>r===t?{...e,name:n}:e);this.drawLayers=this.drawLayers.map(t=>t.id===e.id?{...t,properties:i}:t),this.syncLayerPropertiesToStore(e.id,i),this.features=this.features.map(t=>{if(t.layerId!==e.id||!(r in t.properties))return t;let{[r]:i,...a}=t.properties;return{...t,properties:{...a,[n]:i}}}),this.refreshDrawLayerSource(e.id),this.lastFocusedAttributeName===r&&(this.lastFocusedAttributeName=n),this.cancelRenameAttribute()}handleClick(e){let t=this.effectiveSnap&&this.snapPos?this.snapPos:e.coords,n=K(this.mode),r=n?this.activeLayerIds[n]:null;if(!(!r&&this.mode!==`select`&&this.mode!==`attributes`)){if(this.mode===`draw-point`){this.commitFeature({id:this.newId(),layerId:r,type:`Point`,coordinates:t,properties:this.defaultProperties(r)});return}if(this.mode===`draw-line`||this.mode===`draw-line-dashed`||this.mode===`draw-polygon`){if(this.draftPoints.length>=2){let e=this.draftPoints[this.draftPoints.length-1];if(this.withinPixelThreshold(t,e,10)||this.mode===`draw-polygon`&&this.withinPixelThreshold(t,this.draftPoints[0],14)){this.finishDraft(r);return}}this.draftPoints.length===0&&this.selectedFeatureId&&(this.selectedFeatureId=null,this.editState=`none`,this.editHandles=[],this.updateSelectedSource(),this.updateEditHandles()),this.draftPoints.push(t),this.draftRedoStack=[],this.uiVersion++,this.updateRubberband(),this.updateHelpTextDuring();return}if(this.mode===`select`||this.mode===`attributes`){let e=this.adapter.project(t),n=[e[0],e[1]],r=this.findFeatureAt(n,t);this.setSelection(r?[r.id]:[]),this.requestUpdate()}}}handlePointerMove(e){if(this.cursorPos=e.coords,this.circleDraft){this.updateCircleDraft(e.coords);return}if(this.rectDraft){this.updateRectDraft(e.coords);return}if(this.rectSelectDraft){this.updateRectSelectDraft(e.coords);return}if(this.lassoSelectDraft){this.updateLassoSelectDraft(e.coords);return}if(this.featureDrag){let t=this.features.find(e=>e.id===this.featureDrag.featureId);if(t){let n=e.coords[0]-this.featureDrag.startCoords[0],r=e.coords[1]-this.featureDrag.startCoords[1];t.coordinates=this.translateCoordsGeoPreserving(this.featureDrag.origCoords,t.type,n,r,this.featureDrag.origCentroidLng,this.featureDrag.origCentroidLat),this.refreshDrawLayerSource(t.layerId),this.updateEditHandles(),this.updateSelectedSource()}return}if(this.dragging){let t=this.features.find(e=>e.id===this.dragging.handle.featureId);if(t){let n=e.coords;if(this.effectiveSnap&&this.features.length>0){let r=this.adapter.project(e.coords),i=this.computeSnapExcluding([r[0],r[1]],this.dragging.handle.featureId,$(t.type));this.snapPos=i,i&&(n=i)}else this.snapPos=null;this.applyDragMove(t,this.dragging.handle,n),this.dragging.lastCoords=e.coords,this.refreshDrawLayerSource(t.layerId),this.updateEditHandles(),this.updateSelectedSource(),this.updateSnapIndicator();let r=this.dragging.handle;this.selectedHandle&&r.kind===`vertex`&&this.selectedHandle.featureId===r.featureId&&this.selectedHandle.partIdx===r.partIdx&&this.selectedHandle.ringIdx===r.ringIdx&&this.selectedHandle.vertIdx===r.vertIdx&&(this.selectedHandle.coords=r.coords,this.updateSelectedVertexSource())}return}if(J(this.mode)){let t=this.mode===`draw-polygon`&&this.draftPoints.length>=2;if(this.effectiveSnap&&(this.features.length>0||t)){let t=this.adapter.project(e.coords),n=[t[0],t[1]];(!this.lastCursorPx||Math.hypot(n[0]-this.lastCursorPx[0],n[1]-this.lastCursorPx[1])>.5)&&(this.lastCursorPx=n,this.snapPos=this.computeSnap(n))}else this.snapPos=null;this.updateRubberband();return}if(this.isSelectMode()){let t=this.adapter.project(e.coords),n=this.findFeatureAt([t[0],t[1]],e.coords),r=n&&!this.selectedFeatureIds.includes(n.id)?n.id:null;r!==this.hoveredFeatureId&&(this.hoveredFeatureId=r,this.updateSelectedSource()),this.adapter?.setCursor(n?`pointer`:``);return}if(this.mode===`attributes`){let t=this.adapter.project(e.coords),n=this.findFeatureAt([t[0],t[1]],e.coords),r=n&&n.id!==this.selectedFeatureId?n.id:null;r!==this.hoveredFeatureId&&(this.hoveredFeatureId=r,this.updateSelectedSource()),this.adapter?.setCursor(n?`pointer`:``);return}if(this.mode===`edit-move`){let t=this.adapter.project(e.coords),n=[t[0],t[1]],r=this.findFeatureAt(n,e.coords),i=r&&r.id!==this.selectedFeatureId?r.id:null;i!==this.hoveredFeatureId&&(this.hoveredFeatureId=i,this.updateSelectedSource()),this.adapter?.setCursor(r?`grab`:``);return}if(this.mode===`edit-vertices`){let t=this.adapter.project(e.coords),n=[t[0],t[1]],r=this.selectedFeatureId?this.findHandleAt(n):null,i=r?null:this.findFeatureAt(n,e.coords),a=i&&i.id!==this.selectedFeatureId?i.id:null;a!==this.hoveredFeatureId&&(this.hoveredFeatureId=a,this.updateSelectedSource()),r?this.adapter?.setCursor(`grab`):i?this.adapter?.setCursor(i.id===this.selectedFeatureId?`default`:`pointer`):this.adapter?.setCursor(``)}}handlePointerDown(e){if(e.button===0){if(this.mode===`draw-circle`){this.startCircleDraft(e.coords);return}if(this.mode===`draw-rectangle`){this.startRectDraft(e.coords);return}if(this.mode===`select-rect`){this.startRectSelectDraft(e.coords);return}if(this.mode===`select-lasso`){this.startLassoSelectDraft(e.coords);return}if(this.mode===`edit-move`){let t=[e.pixel[0],e.pixel[1]],n=this.findFeatureAt(t,e.coords);if(!n){this.selectedFeatureId&&(this.selectedFeatureId=null,this.editState=`none`,this.hoveredFeatureId=null,this.updateSelectedSource(),this.updateEditHandles());return}n.id!==this.selectedFeatureId&&(this.selectedFeatureId=n.id,this.editState=$(n.type)?`none`:`selected`,this.hoveredFeatureId=null,this.updateSelectedSource(),this.updateEditHandles());let r=this.centroid(n);this.featureDrag={featureId:n.id,startCoords:e.coords,origCoords:JSON.parse(JSON.stringify(n.coordinates)),origCentroidLat:r[1],origCentroidLng:r[0]},this.adapter?.setPanEnabled(!1),this.adapter?.setCursor(`grabbing`);return}if(this.mode===`edit-vertices`){let t=[e.pixel[0],e.pixel[1]],n=this.selectedFeatureId?this.features.find(e=>e.id===this.selectedFeatureId):null,r=n?this.findHandleAt(t):null;if(n&&r){if(this.selectedHandle=r.kind===`vertex`?r:null,this.updateSelectedVertexSource(),this.dragging={handle:r,lastCoords:e.coords,origCoords:JSON.parse(JSON.stringify(n.coordinates))},this.adapter?.setPanEnabled(!1),this.adapter?.setCursor(`grabbing`),r.kind===`midpoint`){this.insertVertex(n,r);let t=r.afterVertIdx+1,i={kind:`vertex`,featureId:r.featureId,partIdx:r.partIdx,ringIdx:r.ringIdx,vertIdx:t,coords:r.coords};this.dragging={handle:i,lastCoords:e.coords,origCoords:JSON.parse(JSON.stringify(n.coordinates))},this.selectedHandle=i,this.updateSelectedVertexSource(),this.refreshDrawLayerSource(n.layerId),this.updateEditHandles()}return}let i=this.findFeatureAt(t,e.coords);i?.id!==this.selectedFeatureId&&(this.selectedFeatureId=i?.id??null,this.editState=i?`editing`:`none`,this.hoveredFeatureId=null,this.updateSelectedSource(),this.updateEditHandles());return}}}handlePointerUp(e){if(this.circleDraft){this.finishCircleDraft();return}if(this.rectDraft){this.finishRectDraft();return}if(this.rectSelectDraft){this.finishRectSelectDraft();return}if(this.lassoSelectDraft){this.finishLassoSelectDraft();return}if(this.featureDrag){let e=this.features.find(e=>e.id===this.featureDrag.featureId),t=e&&JSON.stringify(e.coordinates)!==JSON.stringify(this.featureDrag.origCoords);if(e&&t){let t={...e,coordinates:this.featureDrag.origCoords},n=this.drawLayers.find(t=>t.id===e.layerId);n&&this.computeSpecialProperties(e,n),this.pushHistory({type:`update`,features:[t],afterFeatures:[{...e}]}),this.features=[...this.features],this.refreshDrawLayerSource(e.layerId)}this.featureDrag=null,this.adapter?.setPanEnabled(!0),this.adapter?.setCursor(``);return}if(!this.dragging)return;this.snapPos=null,this.updateSnapIndicator(),this.adapter?.setPanEnabled(!0),this.adapter?.setCursor(``);let t=this.features.find(e=>e.id===this.dragging.handle.featureId),n=t&&JSON.stringify(t.coordinates)!==JSON.stringify(this.dragging.origCoords);if(t&&n){let e={...t,coordinates:this.dragging.origCoords},n=this.drawLayers.find(e=>e.id===t.layerId);n&&this.computeSpecialProperties(t,n),this.pushHistory({type:`update`,features:[e],afterFeatures:[{...t}]}),this.features=[...this.features],this.refreshDrawLayerSource(t.layerId)}this.dragging=null}handlePointerLeave(){if(this.dragging||this.featureDrag)return;let e=this.isSelectMode()||this.isEditMode()||this.mode===`attributes`;e&&this.hoveredFeatureId&&(this.hoveredFeatureId=null,this.updateSelectedSource()),e&&this.adapter?.setCursor(``)}handleContextMenu(e){let t=K(this.mode),n=t?this.activeLayerIds[t]:null;n&&(this.mode===`draw-line`||this.mode===`draw-line-dashed`||this.mode===`draw-polygon`)&&this.finishDraft(n)}defaultProperties(e){let t=this.drawLayers.find(t=>t.id===e);return t?Object.fromEntries(t.properties.map(e=>[e.name,null])):{}}finishDraft(e){let t=this.draftPoints;if((this.mode===`draw-line`||this.mode===`draw-line-dashed`)&&t.length>=2)this.commitFeature({id:this.newId(),layerId:e,type:`LineString`,coordinates:t.map(e=>[e[0],e[1]]),properties:this.defaultProperties(e),dashed:this.mode===`draw-line-dashed`},t);else if(this.mode===`draw-polygon`&&t.length>=3){let n=[...t.map(e=>[e[0],e[1]]),[t[0][0],t[0][1]]];this.commitFeature({id:this.newId(),layerId:e,type:`Polygon`,coordinates:[n],properties:this.defaultProperties(e)},t)}this.draftPoints=[],this.draftRedoStack=[],this.cursorPos=null,this.updateRubberband()}startCircleDraft(e){if(!this.activeLayerIds.Polygon)return;let t=this.effectiveSnap&&this.snapPos?this.snapPos:e;this.circleDraft={center:t,radiusM:0},this.adapter?.setPanEnabled(!1),this.helpText=`Drag to set circle radius.`}updateCircleDraft(e){this.circleDraft&&(this.circleDraft.radiusM=l(this.circleDraft.center,e)/100,this.updateCirclePreview(),this.helpText=`Radius: ${d(this.circleDraft.radiusM*100)}`)}updateCirclePreview(){if(!this.sharedLayersCreated||!this.circleDraft)return;let e=this.circleDraft.radiusM>=H?[{type:`Feature`,geometry:{type:`LineString`,coordinates:u(this.circleDraft.center,this.circleDraft.radiusM)},properties:{}}]:[];this.dispatch(`webmapx-set-source-data`,{id:T,data:{type:`FeatureCollection`,features:e}})}finishCircleDraft(){if(!this.circleDraft)return;let{center:e,radiusM:t}=this.circleDraft;this.circleDraft=null,this.adapter?.setPanEnabled(!0),this.dispatch(`webmapx-set-source-data`,{id:T,data:{type:`FeatureCollection`,features:[]}});let n=this.activeLayerIds.Polygon;n&&t>=H&&this.commitFeature({id:this.newId(),layerId:n,type:`Polygon`,coordinates:[u(e,t)],properties:this.defaultProperties(n)}),this.helpText=`Click and drag to draw a circle.`}startRectDraft(e){if(!this.activeLayerIds.Polygon)return;let t=this.effectiveSnap&&this.snapPos?this.snapPos:e;this.rectDraft={corner1:t,corner2:t},this.adapter?.setPanEnabled(!1),this.helpText=`Drag to the opposite corner.`}updateRectDraft(e){if(!this.rectDraft)return;this.rectDraft.corner2=this.effectiveSnap&&this.snapPos?this.snapPos:e,this.updateRectPreview();let t=l(this.rectDraft.corner1,this.rectDraft.corner2)/100;this.helpText=`Diagonal: ${d(t*100)}`}rectRing(e,t){let[n,r]=e,[i,a]=t;return[[n,r],[i,r],[i,a],[n,a],[n,r]]}updateRectPreview(){if(!this.sharedLayersCreated||!this.rectDraft)return;let e=l(this.rectDraft.corner1,this.rectDraft.corner2)/100>=H?[{type:`Feature`,geometry:{type:`LineString`,coordinates:this.rectRing(this.rectDraft.corner1,this.rectDraft.corner2)},properties:{}}]:[];this.dispatch(`webmapx-set-source-data`,{id:T,data:{type:`FeatureCollection`,features:e}})}finishRectDraft(){if(!this.rectDraft)return;let{corner1:e,corner2:t}=this.rectDraft;this.rectDraft=null,this.adapter?.setPanEnabled(!0),this.dispatch(`webmapx-set-source-data`,{id:T,data:{type:`FeatureCollection`,features:[]}});let n=this.activeLayerIds.Polygon,r=l(e,t)/100;n&&r>=H&&this.commitFeature({id:this.newId(),layerId:n,type:`Polygon`,coordinates:[this.rectRing(e,t)],properties:this.defaultProperties(n)}),this.helpText=`Click and drag to draw a rectangle.`}startRectSelectDraft(e){this.rectSelectDraft={corner1:e,corner2:e},this.adapter?.setPanEnabled(!1)}updateRectSelectDraft(e){if(!this.rectSelectDraft)return;this.rectSelectDraft.corner2=e;let{corner1:t,corner2:n}=this.rectSelectDraft,r=this.rectRing(t,n);this.updateMarquee(r),l(t,n)/100>=H?this.applyShapeSelection(r):this.selectedFeatureIds.length>0&&this.setSelection([])}finishRectSelectDraft(){if(!this.rectSelectDraft)return;let{corner1:e,corner2:t}=this.rectSelectDraft;this.rectSelectDraft=null,this.adapter?.setPanEnabled(!0),this.updateMarquee(null),l(e,t)/100>=H&&this.applyShapeSelection(this.rectRing(e,t)),this.helpText=`Drag a rectangle to select the features inside it.`}startLassoSelectDraft(e){this.lassoSelectDraft={points:[e]},this.adapter?.setPanEnabled(!1)}updateLassoSelectDraft(e){if(!this.lassoSelectDraft)return;let t=this.lassoSelectDraft.points,n=t[t.length-1];if(this.adapter){let t=this.adapter.project(n),r=this.adapter.project(e);if(Math.hypot(r[0]-t[0],r[1]-t[1])<3)return}if(t.push(e),t.length>=3){let e=[...t,t[0]];this.updateMarquee(e),this.applyShapeSelection(e)}else this.updateMarquee(null)}finishLassoSelectDraft(){if(!this.lassoSelectDraft)return;let e=this.lassoSelectDraft.points;this.lassoSelectDraft=null,this.adapter?.setPanEnabled(!0),this.updateMarquee(null),e.length>=3&&this.applyShapeSelection([...e,e[0]]),this.helpText=`Draw a free-hand shape to select the features inside it.`}updateMarquee(e){if(!this.sharedLayersCreated)return;let t=e?[{type:`Feature`,geometry:{type:`Polygon`,coordinates:[e]},properties:{}}]:[];this.dispatch(`webmapx-set-source-data`,{id:U,data:{type:`FeatureCollection`,features:t}})}applyShapeSelection(e){if(e.length<3)return;let t=this.currentSessionLayerId,n=[];for(let r of this.features)r.layerId===t&&this.featureIntersectsRing(r,e)&&n.push(r.id);this.setSelection(n)}featureIntersectsRing(e,t){if(e.type===`Point`)return this.pointInRing(e.coordinates,t);if(e.type===`MultiPoint`||e.type===`LineString`)return e.coordinates.some(e=>this.pointInRing(e,t));if(e.type===`MultiLineString`)return e.coordinates.some(e=>e.some(e=>this.pointInRing(e,t)));if(e.type===`Polygon`){let n=e.coordinates[0];return n.some(e=>this.pointInRing(e,t))||t.some(e=>this.pointInRing(e,n))}return e.type===`MultiPolygon`?e.coordinates.some(e=>{let n=e[0];return!!n&&(n.some(e=>this.pointInRing(e,t))||t.some(e=>this.pointInRing(e,n)))}):!1}setSelection(e){this.selectedFeatureIds=e,this.selectedFeatureId=e.length===1?e[0]:null,this.hoveredFeatureId=null,this.updateSelectedSource(),this.updateMultiSelectSource(),this.mode===`attributes`&&this.selectedFeatureId&&this.updateComplete.then(()=>this.focusFirstAttributeValueInput())}updateMultiSelectSource(){if(!this.sharedLayersCreated)return;let e=this.selectedFeatureIds.map(e=>this.features.find(t=>t.id===e)).filter(e=>!!(e&&$(e.type))).map(e=>({type:`Feature`,id:e.id,geometry:{type:e.type,coordinates:e.coordinates},properties:{}}));this.dispatch(`webmapx-set-source-data`,{id:W,data:{type:`FeatureCollection`,features:e}})}computeSnap(e){let t=this.computeSnapExcluding(e,null,this.mode===`draw-point`);if(this.mode===`draw-polygon`&&this.draftPoints.length>=2&&this.adapter){let n=this.draftPoints[0],r=this.adapter.project(n),i=Math.hypot(r[0]-e[0],r[1]-e[1]);if(i<=je){if(!t)return n;let r=this.adapter.project(t);return i<=Math.hypot(r[0]-e[0],r[1]-e[1])?n:t}}return t}computeSnapExcluding(e,t,n){return this.adapter?c(e,this.features.filter(e=>e.id!==t&&!(n&&$(e.type))),e=>{let t=this.adapter.project(e);return[t[0],t[1]]},{threshold:je,edgePenalty:8,unproject:e=>this.adapter.unproject(e)}):null}updateSnapIndicator(){if(!this.sharedLayersCreated)return;let e=this.effectiveSnap&&this.snapPos?[{type:`Feature`,geometry:{type:`Point`,coordinates:this.snapPos},properties:{}}]:[];this.dispatch(`webmapx-set-source-data`,{id:V,data:{type:`FeatureCollection`,features:e}})}updateRubberband(){if(!this.sharedLayersCreated)return;let e=[],t=[],n=J(this.mode),r=this.effectiveSnap&&this.snapPos?this.snapPos:this.cursorPos;if(n&&this.draftPoints.length>0&&r){let n=[...this.draftPoints.map(e=>[e[0],e[1]]),[r[0],r[1]]];e.push({type:`Feature`,geometry:{type:`LineString`,coordinates:n},properties:{}});for(let e of this.draftPoints)t.push({type:`Feature`,geometry:{type:`Point`,coordinates:[e[0],e[1]]},properties:{}})}this.dispatch(`webmapx-set-source-data`,{id:T,data:{type:`FeatureCollection`,features:e}}),this.dispatch(`webmapx-set-source-data`,{id:I,data:{type:`FeatureCollection`,features:t}});let i=n&&this.effectiveSnap&&this.snapPos?[{type:`Feature`,geometry:{type:`Point`,coordinates:this.snapPos},properties:{}}]:[];this.dispatch(`webmapx-set-source-data`,{id:V,data:{type:`FeatureCollection`,features:i}})}previewPlusPicked(e){return this.hoveredFeatureId&&!e.includes(this.hoveredFeatureId)?[...e,this.hoveredFeatureId]:e}updateSelectedSource(){if(!this.sharedLayersCreated)return;let e=(this.isSelectMode()?this.previewPlusPicked(this.selectedFeatureIds):this.mode===`edit-vertices`?this.hoveredFeatureId?[this.hoveredFeatureId]:[]:this.mode===`attributes`||this.mode===`edit-move`?this.previewPlusPicked(this.selectedFeatureId?[this.selectedFeatureId]:[]):this.selectedFeatureId?[this.selectedFeatureId]:[]).flatMap(e=>{let t=this.features.find(t=>t.id===e),n=t?this.drawLayers.find(e=>e.id===t.layerId):void 0;return!t||!n||$(t.type)?[]:this.computeHandles(t).filter(e=>e.kind===`vertex`).map(e=>({type:`Feature`,geometry:{type:`Point`,coordinates:e.coords},properties:{color:this.currentDrawLayerColor(n)}}))});this.dispatch(`webmapx-set-source-data`,{id:L,data:{type:`FeatureCollection`,features:e}})}computeHandles(e){let t=[];if(e.type===`Point`)return t.push({kind:`vertex`,featureId:e.id,partIdx:0,ringIdx:0,vertIdx:0,coords:e.coordinates}),t;if(e.type===`MultiPoint`)return e.coordinates.forEach((n,r)=>{t.push({kind:`vertex`,featureId:e.id,partIdx:r,ringIdx:0,vertIdx:0,coords:n})}),t;let n=(n,r,i,a)=>{let o=a?n.length-1:n.length;for(let s=0;s<o;s++){if(t.push({kind:`vertex`,featureId:e.id,partIdx:r,ringIdx:i,vertIdx:s,coords:n[s]}),!a&&s===o-1)continue;let c=(s+1)%o,l=[(n[s][0]+n[c][0])/2,(n[s][1]+n[c][1])/2];t.push({kind:`midpoint`,featureId:e.id,partIdx:r,ringIdx:i,afterVertIdx:s,coords:l})}};return e.type===`LineString`?n(e.coordinates,0,0,!1):e.type===`MultiLineString`?e.coordinates.forEach((e,t)=>n(e,t,0,!1)):e.type===`Polygon`?e.coordinates.forEach((e,t)=>n(e,0,t,!0)):e.type===`MultiPolygon`&&e.coordinates.forEach((e,t)=>{e.forEach((e,r)=>n(e,t,r,!0))}),t}updateEditHandles(){if(!this.sharedLayersCreated)return;let e=this.selectedFeatureId?this.features.find(e=>e.id===this.selectedFeatureId):null;if(!e){this.editHandles=[],this.selectedHandle=null,this.updateSelectedVertexSource(),this.dispatch(`webmapx-set-source-data`,{id:R,data:{type:`FeatureCollection`,features:[]}}),this.dispatch(`webmapx-set-source-data`,{id:z,data:{type:`FeatureCollection`,features:[]}});return}this.selectedHandle&&this.selectedHandle.featureId!==e.id&&(this.selectedHandle=null,this.updateSelectedVertexSource()),this.editHandles=this.computeHandles(e);let t=this.editState===`editing`,n=t?this.editHandles.filter(e=>e.kind===`vertex`).map(e=>({type:`Feature`,geometry:{type:`Point`,coordinates:e.coords},properties:{}})):[],r=t?this.editHandles.filter(e=>e.kind===`midpoint`).map(e=>({type:`Feature`,geometry:{type:`Point`,coordinates:e.coords},properties:{}})):[];this.dispatch(`webmapx-set-source-data`,{id:R,data:{type:`FeatureCollection`,features:n}}),this.dispatch(`webmapx-set-source-data`,{id:z,data:{type:`FeatureCollection`,features:r}})}findHandleAt(e){let t=null,n=ke;for(let r of this.editHandles){let i=this.adapter.project(r.coords),a=Math.hypot(e[0]-i[0],e[1]-i[1]);a<n&&(n=a,t=r)}return t}applyDragMove(e,t,n){let r=JSON.parse(JSON.stringify(e.coordinates));if(t.kind!==`vertex`)return;let{partIdx:i,ringIdx:a,vertIdx:o}=t;if(e.type===`Point`){e.coordinates=[n[0],n[1]],t.coords=n;return}else if(e.type===`MultiPoint`)r[i]=[n[0],n[1]];else if(e.type===`LineString`)r[o]=[n[0],n[1]];else if(e.type===`MultiLineString`)r[i][o]=[n[0],n[1]];else if(e.type===`Polygon`){r[a][o]=[n[0],n[1]];let e=r[a];o===0&&(e[e.length-1]=e[0])}else if(e.type===`MultiPolygon`){r[i][a][o]=[n[0],n[1]];let e=r[i][a];o===0&&(e[e.length-1]=e[0])}e.coordinates=r,t.coords=n}translateCoordsGeoPreserving(e,t,n,r,i,a){if(!isFinite(a)||!isFinite(i))return this.translateCoords(e,t,n,r);let o=a+r,s=Math.cos(a*Math.PI/180),c=Math.cos(o*Math.PI/180),l=c>1e-6?s/c:1,u=i+n,d=e=>[u+(e[0]-i)*l,e[1]+r];return t===`Point`?d(e):t===`MultiPoint`||t===`LineString`?e.map(d):t===`MultiLineString`?e.map(e=>e.map(d)):t===`Polygon`?e.map(e=>e.map(d)):t===`MultiPolygon`?e.map(e=>e.map(e=>e.map(d))):e}translateCoords(e,t,n,r){let i=e=>[e[0]+n,e[1]+r];return t===`Point`?i(e):t===`MultiPoint`||t===`LineString`?e.map(i):t===`MultiLineString`?e.map(e=>e.map(i)):t===`Polygon`?e.map(e=>e.map(i)):t===`MultiPolygon`?e.map(e=>e.map(e=>e.map(i))):e}insertVertex(e,t){let n={...e,coordinates:JSON.parse(JSON.stringify(e.coordinates))},r=JSON.parse(JSON.stringify(e.coordinates)),{partIdx:i,ringIdx:a,afterVertIdx:o}=t;e.type===`LineString`?r.splice(o+1,0,[t.coords[0],t.coords[1]]):e.type===`MultiLineString`?r[i].splice(o+1,0,[t.coords[0],t.coords[1]]):e.type===`Polygon`?r[a].splice(o+1,0,[t.coords[0],t.coords[1]]):e.type===`MultiPolygon`&&r[i][a].splice(o+1,0,[t.coords[0],t.coords[1]]),e.coordinates=r,this.pushHistory({type:`update`,features:[n],afterFeatures:[{...e}]})}updateSelectedVertexSource(){if(this.uiVersion++,!this.sharedLayersCreated)return;let e=this.selectedHandle?[{type:`Feature`,geometry:{type:`Point`,coordinates:this.selectedHandle.coords},properties:{}}]:[];this.dispatch(`webmapx-set-source-data`,{id:B,data:{type:`FeatureCollection`,features:e}})}deleteSelectedVertex(){let e=this.selectedHandle;if(!e)return;let t=this.features.find(t=>t.id===e.featureId);if(!t)return;let n=JSON.parse(JSON.stringify(t.coordinates)),{partIdx:r,ringIdx:i,vertIdx:a}=e;if(t.type===`LineString`){if(n.length<=2)return;n.splice(a,1)}else if(t.type===`MultiLineString`){if(n[r].length<=2)return;n[r].splice(a,1)}else if(t.type===`Polygon`){let e=n[i];if(e.length-1<=3)return;a===0||a===e.length-1?(e.splice(e.length-1,1),e.splice(0,1),e.push([...e[0]])):e.splice(a,1)}else if(t.type===`MultiPolygon`){let e=n[r][i];if(e.length-1<=3)return;a===0||a===e.length-1?(e.splice(e.length-1,1),e.splice(0,1),e.push([...e[0]])):e.splice(a,1)}else if(t.type===`MultiPoint`){if(n.length<=1)return;n.splice(r,1)}else return;let o={...t};t.coordinates=n;let s=this.drawLayers.find(e=>e.id===t.layerId);s&&this.computeSpecialProperties(t,s),this.pushHistory({type:`update`,features:[o],afterFeatures:[{...t}]}),this.features=[...this.features],this.refreshDrawLayerSource(t.layerId),this.selectedHandle=null,this.updateSelectedVertexSource(),this.updateEditHandles()}commitFeature(e,t){let n=this.features.filter(t=>t.layerId===e.layerId).reduce((e,t)=>{let n=parseInt(String(t.properties.id??0),10);return isNaN(n)?e:Math.max(e,n)},0);e.properties.id=n+1;let r=this.drawLayers.find(t=>t.id===e.layerId);if(r&&this.computeSpecialProperties(e,r),r)for(let t of r.properties)t.type===`create-time`&&(e.properties[t.name]=Date.now());this.pushHistory(t?{type:`finish`,features:[e],draftPoints:t.map(e=>[e[0],e[1]])}:{type:`add`,features:[e]}),this.features=[...this.features,e],this.refreshDrawLayerSource(e.layerId),this.setModeInternal(this.mode),this.selectedFeatureId=e.id,this.updateSelectedSource(),this.updateEditHandles()}deleteSelected(){let e=this.selectedFeatureId?[this.selectedFeatureId]:this.selectedFeatureIds;if(e.length===0)return;let t=new Set(e),n=this.features.filter(e=>t.has(e.id));this.pushHistory({type:`delete`,features:n}),this.features=this.features.filter(e=>!t.has(e.id)),new Set(n.map(e=>e.layerId)).forEach(e=>this.refreshDrawLayerSource(e)),this.selectedFeatureId=null,this.selectedFeatureIds=[],this.editState=`none`,this.editHandles=[],this.adapter?.setCursor(``),this.updateSelectedSource(),this.updateMultiSelectSource(),this.updateEditHandles(),this.exitToDrawIfLayerEmpty()}exitToDrawIfLayerEmpty(){if(!this.pickedType||!this.isSelectMode()&&!this.isEditMode()&&this.mode!==`attributes`)return;let e=this.activeLayerIds[this.pickedType];e&&this.features.some(t=>t.layerId===e)||this.moveHistoryIndex>=0||this.setModeInternal(q(this.pickedType))}pushHistory(e){e.type===`update`||e.type===`delete`?(this.moveHistory=this.moveHistory.slice(0,this.moveHistoryIndex+1),this.moveHistory.push(e),this.moveHistoryIndex=this.moveHistory.length-1):(this.drawHistory=this.drawHistory.slice(0,this.drawHistoryIndex+1),this.drawHistory.push(e),this.drawHistoryIndex=this.drawHistory.length-1),this.uiVersion++}removeLastDraftPoint(){this.draftRedoStack.push(this.draftPoints.pop()),this.uiVersion++,this.updateRubberband(),this.updateHelpTextDuring()}undoOrDraftBack(){this.draftPoints.length>0?this.removeLastDraftPoint():this.undoDraw()}redoOrDraftForward(){this.draftRedoStack.length>0?(this.draftPoints.push(this.draftRedoStack.pop()),this.uiVersion++,this.updateRubberband(),this.updateHelpTextDuring()):this.redoDraw()}stepBackDrawHistory(){if(this.drawHistoryIndex<0)return null;let e=this.drawHistory[this.drawHistoryIndex--];this.uiVersion++;let t=new Set,n=new Set(e.features.map(e=>e.id));return this.features=this.features.filter(e=>!n.has(e.id)),e.features.forEach(e=>t.add(e.layerId)),this.selectedFeatureId=null,this.selectedFeatureIds=[],this.editState=`none`,this.updateSelectedSource(),this.updateMultiSelectSource(),this.updateEditHandles(),t.forEach(e=>this.refreshDrawLayerSource(e)),e}undoDraw(){let e=this.stepBackDrawHistory();if(e?.type===`finish`&&e.draftPoints){let t=e.features[0];this.mode=t.type===`LineString`?t.dashed?`draw-line-dashed`:`draw-line`:`draw-polygon`,this.draftPoints=e.draftPoints.map(e=>[e[0],e[1]]),this.draftRedoStack=[],this.cursorPos=this.draftPoints[this.draftPoints.length-1],this.updateRubberband(),this.updateHelpTextDuring()}}deleteJustDrawnFeature(){this.stepBackDrawHistory()}redoDraw(){if(this.drawHistoryIndex>=this.drawHistory.length-1)return;let e=this.drawHistory[++this.drawHistoryIndex];this.uiVersion++;let t=new Set;if(this.features=[...this.features,...e.features],e.features.forEach(e=>t.add(e.layerId)),t.forEach(e=>this.refreshDrawLayerSource(e)),e.type===`finish`){let t=e.features[0];this.draftPoints=[],this.draftRedoStack=[],this.cursorPos=null,this.selectedFeatureId=t.id,this.editState=`none`,this.updateSelectedSource(),this.updateEditHandles(),this.updateRubberband()}}reselectAfterHistoryStep(e){this.selectedFeatureIds=e,this.selectedFeatureId=e.length===1?e[0]:null;let t=this.selectedFeatureId?this.features.find(e=>e.id===this.selectedFeatureId):null;this.editState=t?this.mode===`edit-vertices`?`editing`:this.mode===`edit-move`?$(t.type)?`none`:`selected`:`none`:`none`,this.selectedHandle=null,this.updateSelectedVertexSource(),this.updateSelectedSource(),this.updateMultiSelectSource(),this.updateEditHandles()}undoMove(){if(this.moveHistoryIndex<0)return;let e=this.moveHistory[this.moveHistoryIndex--];this.uiVersion++;let t=new Set;e.type===`delete`?(this.features=[...this.features,...e.features],e.features.forEach(e=>t.add(e.layerId))):this.features=this.features.map(n=>{let r=e.features.find(e=>e.id===n.id);return r?(t.add(n.layerId),{...n,coordinates:r.coordinates}):n}),this.reselectAfterHistoryStep(e.features.map(e=>e.id)),t.forEach(e=>this.refreshDrawLayerSource(e))}redoMove(){if(this.moveHistoryIndex>=this.moveHistory.length-1)return;let e=this.moveHistory[++this.moveHistoryIndex];this.uiVersion++;let t=new Set;if(e.type===`delete`){let n=new Set(e.features.map(e=>e.id));this.features=this.features.filter(e=>!n.has(e.id)),e.features.forEach(e=>t.add(e.layerId)),this.reselectAfterHistoryStep([])}else{let n=e.afterFeatures??e.features;this.features=this.features.map(e=>{let r=n.find(t=>t.id===e.id);return r?(t.add(e.layerId),{...e,coordinates:r.coordinates}):e}),this.reselectAfterHistoryStep(e.features.map(e=>e.id))}t.forEach(e=>this.refreshDrawLayerSource(e)),this.exitToDrawIfLayerEmpty()}newId(){return`draw-${Date.now()}-${Math.random().toString(36).slice(2,7)}`}computeSpecialProperties(e,t){for(let n of t.properties)switch(n.type){case`longitude`:case`latitude`:{let t=e.type===`Point`?e.coordinates:this.centroid(e);e.properties[n.name]=n.type===`longitude`?t[0]:t[1];break}case`area`:e.properties[n.name]=e.type===`Polygon`?this.polygonArea(e.coordinates):null;break;case`perimeter`:case`length`:e.properties[n.name]=e.type===`Polygon`?this.ringLength(e.coordinates[0]):e.type===`LineString`?this.ringLength(e.coordinates,!1):null;break;case`update-time`:e.properties[n.name]=Date.now();break}}centroid(e){let t;switch(e.type){case`Point`:t=[e.coordinates];break;case`MultiPoint`:t=e.coordinates;break;case`LineString`:t=e.coordinates;break;case`MultiLineString`:t=e.coordinates.flat();break;case`Polygon`:t=e.coordinates[0];break;case`MultiPolygon`:t=e.coordinates.flat(2);break;default:t=[]}if(t.length===0)return[0,0];let n=t.reduce((e,t)=>[e[0]+t[0],e[1]+t[1]],[0,0]);return[n[0]/t.length,n[1]/t.length]}haversineKm(e,t){let n=(t[1]-e[1])*Math.PI/180,r=(t[0]-e[0])*Math.PI/180,i=Math.sin(n/2)**2+Math.cos(e[1]*Math.PI/180)*Math.cos(t[1]*Math.PI/180)*Math.sin(r/2)**2;return 6371*2*Math.atan2(Math.sqrt(i),Math.sqrt(1-i))}ringLength(e,t=!0){let n=0,r=e.length-1;for(let t=0;t<r;t++)n+=this.haversineKm(e[t],e[t+1]);return Math.round(n*1e3)}polygonArea(e){let t=e[0],n=0;for(let e=0,r=t.length-1;e<t.length;r=e++)n+=(t[r][0]+t[e][0])*(t[r][1]-t[e][1]);let r=Math.abs(n/2),i=t[0][1]*Math.PI/180;return Math.round(111320*Math.cos(i)*r*111320)}withinPixelThreshold(e,t,n){if(!this.adapter)return!1;let r=this.adapter.project(e),i=this.adapter.project(t);return Math.hypot(r[0]-i[0],r[1]-i[1])<n}get currentSessionLayerId(){return this.pickedType?this.activeLayerIds[this.pickedType]??null:null}findFeatureAt(e,t){let n=this.currentSessionLayerId;for(let r of[...this.features].reverse())if(r.layerId===n){if(r.type===`Point`){let t=this.adapter.project(r.coordinates);if(Math.hypot(t[0]-e[0],t[1]-e[1])<10)return r}else if(r.type===`MultiPoint`)for(let t of r.coordinates){let n=this.adapter.project(t);if(Math.hypot(n[0]-e[0],n[1]-e[1])<10)return r}else if(r.type===`LineString`){if(this.pixelNearPolyline(e,r.coordinates,10))return r}else if(r.type===`MultiLineString`){if(r.coordinates.some(t=>this.pixelNearPolyline(e,t,10)))return r}else if(r.type===`Polygon`){if(this.pointInRing(t,r.coordinates[0])||this.pixelNearPolyline(e,r.coordinates[0],10))return r}else if(r.type===`MultiPolygon`)for(let n of r.coordinates){let i=n[0];if(i&&(this.pointInRing(t,i)||this.pixelNearPolyline(e,i,10)))return r}}return null}pixelNearPolyline(e,t,n){for(let r=0;r<t.length-1;r++){let i=this.adapter.project(t[r]),a=this.adapter.project(t[r+1]);if(this.distToSegment(e,i,a)<n)return!0}return!1}distToSegment(e,t,n){let r=n[0]-t[0],i=n[1]-t[1];if(r===0&&i===0)return Math.hypot(e[0]-t[0],e[1]-t[1]);let a=Math.max(0,Math.min(1,((e[0]-t[0])*r+(e[1]-t[1])*i)/(r*r+i*i)));return Math.hypot(e[0]-(t[0]+a*r),e[1]-(t[1]+a*i))}pointInRing(e,t){let n=!1;for(let r=0,i=t.length-1;r<t.length;i=r++){let a=t[r][0],o=t[r][1],s=t[i][0],c=t[i][1];o>e[1]!=c>e[1]&&e[0]<(s-a)*(e[1]-o)/(c-o)+a&&(n=!n)}return n}dispatch(e,t){(this.isConnected?this:this.boundMap)?.dispatchEvent(new CustomEvent(e,{detail:t,bubbles:!0,composed:!0}))}updateHelpTextDuring(){let e=this.draftPoints.length;this.mode===`draw-line`||this.mode===`draw-line-dashed`?this.helpText=`${e} pt${e===1?``:`s`}. Double-click or right-click to finish.`:this.mode===`draw-polygon`&&(this.helpText=e>=3?`${e} pts. Click first point, double-click, or right-click to close.`:`${e} pt${e===1?``:`s`}. Need at least 3 to close.`)}renderTypeGrid(e){return s`
            <div class="type-grid">
                ${[`Point`,`LineString`,`Polygon`].map(t=>s`
                    <button type="button" class="type-card" data-type=${t} ?active=${t===e} aria-pressed=${t===e?`true`:`false`} @click=${()=>this.selectType(t)}>
                        <span class="type-icon">${Se(t)}</span>
                        <span class="type-name">${Fe(t)}</span>
                        <span class="type-count">${this.layerCountLabel(t)}</span>
                    </button>
                `)}
            </div>
        `}renderTypePicker(){return s`
            ${this.showDrawIntro?s`<div class="flow-heading">What do you want to draw or edit?</div>`:``}
            ${this.renderTypeGrid(null)}
        `}layerCountLabel(e){let t=this.drawLayers.filter(t=>t.type===e).length+(this.catalogLayerCounts[e]??0);return`${t} layer${t===1?``:`s`}`}renderLayerPicker(){let e=this.pickedType,t=this.drawLayers.filter(t=>t.type===e),n=this.catalogLayerOptions,r=Y(e),i=t.length===0&&n.length===0,a=e===`Point`?`flex-start`:e===`LineString`?`center`:`flex-end`;return s`
            ${this.showDrawIntro?s`<div class="flow-heading">What do you want to draw or edit?</div>`:``}
            ${this.renderTypeGrid(e)}
            <div class="layer-picker-header" style="justify-content:${a}">
                <sl-button variant="default" size="small" class="add-layer-btn" @click=${()=>this.createNewLayer()}>
                    <sl-icon slot="prefix" name="plus-lg"></sl-icon>
                    New layer
                </sl-button>
            </div>
            ${i?s`<p class="empty-state">No ${r.toLowerCase()} layers yet.</p>`:s`
                <div class="layer-list">
                    ${t.length>0?s`
                        ${n.length>0?s`<div class="section-label">Your layers</div>`:``}
                        <div class="layer-group">
                            ${t.map(e=>s`
                                <div class="layer-row">
                                    <span class="color-dot color-dot--${X(e.type)}" style="${Z(this.currentDrawLayerColor(e),e.type)}"></span>
                                    <span class="layer-name-wrap">
                                        <span class="layer-name">${e.name||`(untitled)`}</span>
                                        <span class="feature-count">(${this.features.filter(t=>t.layerId===e.id).length} features)</span>
                                    </span>
                                    <sl-button size="small" variant="primary" @click=${()=>this.startEditingLayer(e)}>Edit</sl-button>
                                    <sl-tooltip content="Remove layer">
                                        <sl-icon-button name="trash" class="remove-layer-btn" label="Remove ${e.name}"
                                            @click=${t=>{t.stopPropagation(),this.releaseLayer(e)}}>
                                        </sl-icon-button>
                                    </sl-tooltip>
                                </div>
                            `)}
                        </div>
                    `:``}
                    ${n.length>0?s`
                        <div class="section-label" style=${t.length>0?`margin-top:.5rem`:``}>From the catalog</div>
                        <div class="layer-group">
                            ${n.map(t=>s`
                                <div class="layer-row">
                                    <span class="color-dot color-dot--${X(e)}" style="${Z(Ce,e)}"></span>
                                    <span class="layer-name-wrap">
                                        <span class="layer-name">${t.label}</span>
                                    </span>
                                    <sl-button size="small" variant="primary" @click=${()=>{this.pendingCatalogEditOption=t}}>Edit</sl-button>
                                </div>
                            `)}
                        </div>
                    `:``}
                </div>
            `}

            <sl-dialog label="Edit ${this.pendingCatalogEditOption?.label??``}?"
                ?open=${this.pendingCatalogEditOption!==null}
                @sl-request-close=${()=>this.cancelEditCatalogLayer()}>
                ${this.pendingCatalogEditOption?s`
                    You are about to create and edit a copy of &ldquo;${this.pendingCatalogEditOption.label}&rdquo;.
                    The original stays on the map, hidden in the Legend &mdash; you can show it again anytime.
                `:``}
                <sl-button slot="footer" @click=${()=>this.cancelEditCatalogLayer()}>Cancel</sl-button>
                <sl-button slot="footer" variant="primary"
                    @click=${()=>{this.pendingCatalogEditOption&&this.startEditingCatalogLayer(this.pendingCatalogEditOption)}}>
                    Create a copy and edit
                </sl-button>
            </sl-dialog>
        `}renderEditingSession(){let e=this.pickedType,t=this.activeLayerIds[e],n=this.drawLayers.find(e=>e.id===t),r=q(e),i=this.features.find(e=>e.id===this.selectedFeatureId),a=i?this.drawLayers.find(e=>e.id===i.layerId):null,o=t?this.features.some(e=>e.layerId===t):!1;return s`
            ${n?s`
                <div class="editing-title-row">
                    <span class="editing-title-label">You are editing:</span>
                    <div class="editing-title-second-row">
                        <span class="color-swatch-wrap">
                            <span class="color-swatch color-swatch--${X(n.type)}" style="${Z(this.currentDrawLayerColor(n),n.type)}"
                                title="Layer color — style it from the Legend" aria-label="Layer color">
                            </span>
                        </span>
                        <sl-input class="editing-layer-name${this.layerNameInvalid?` name-invalid`:``}" size="small" aria-label="Layer name" title="Click to rename"
                            .value=${this.layerNameDraft??n.name}
                            @sl-input=${e=>{this.layerNameDraft=e.target.value}}
                            @keydown=${e=>{e.key===`Enter`?this.commitLayerNameEdit(n):e.key===`Escape`&&this.cancelLayerNameEdit()}}>
                            ${this.layerNameDraft===null?s`
                                <sl-icon slot="suffix" name="pencil" class="editing-layer-name-icon"
                                    @click=${()=>this.editingLayerNameInput?.select()}></sl-icon>
                            `:s`
                                <sl-icon-button slot="suffix" name="check-lg" label="Save name"
                                    class="editing-layer-name-confirm"
                                    ?disabled=${!this.layerNameDraftValid()}
                                    @click=${()=>this.commitLayerNameEdit(n)}>
                                </sl-icon-button>
                                <sl-icon-button slot="suffix" name="x-lg" label="Cancel rename"
                                    class="editing-layer-name-confirm"
                                    @click=${()=>this.cancelLayerNameEdit()}>
                                </sl-icon-button>
                            `}
                        </sl-input>
                    </div>
                </div>
            `:``}

            <div class="toolbar-row">
                <span class="toolbar-label">Draw</span>
                <div class="pill">
                    ${this.toggleButton({icon:e===`Point`?`geo-fill`:e===`LineString`?`slash-lg`:`pentagon`,label:`Draw ${Y(e).toLowerCase()}`,pressed:this.mode===r,onClick:()=>this.setModeInternal(r)})}
                    ${e===`LineString`?s`
                        ${this.toggleButton({src:le,name:`dash-line`,label:`Draw dashed lines`,pressed:this.mode===`draw-line-dashed`,onClick:()=>this.setModeInternal(`draw-line-dashed`)})}
                    `:``}
                    ${e===`Polygon`?s`
                        ${this.toggleButton({icon:`circle`,label:`Draw circles`,pressed:this.mode===`draw-circle`,onClick:()=>this.setModeInternal(`draw-circle`)})}
                        ${this.toggleButton({icon:`square`,label:`Draw rectangles`,pressed:this.mode===`draw-rectangle`,onClick:()=>this.setModeInternal(`draw-rectangle`)})}
                    `:``}
                </div>
                ${this.isDrawMode()?s`
                    <div class="history-actions">
                        <sl-tooltip content="Undo (${this.modKey}+Z)">
                            <sl-icon-button name="arrow-counterclockwise" size="small" label="Undo"
                                ?disabled=${this.drawHistoryIndex<0&&this.draftPoints.length===0}
                                @click=${()=>this.undoOrDraftBack()}>
                            </sl-icon-button>
                        </sl-tooltip>
                        <sl-tooltip content="Redo (${this.modKey}+Y)">
                            <sl-icon-button name="arrow-clockwise" size="small" label="Redo"
                                ?disabled=${this.drawHistoryIndex>=this.drawHistory.length-1&&this.draftRedoStack.length===0}
                                @click=${()=>this.redoOrDraftForward()}>
                            </sl-icon-button>
                        </sl-tooltip>
                        <div class="divider"></div>
                        <sl-tooltip content=${this.draftPoints.length>0?`Remove last point`:`Delete this feature`}>
                            <sl-icon-button name="trash" size="small" class="delete-feature-btn"
                                label=${this.draftPoints.length>0?`Remove last point`:`Delete this feature`}
                                ?disabled=${this.draftPoints.length===0&&!this.selectedFeatureId}
                                @click=${()=>this.draftPoints.length>0?this.removeLastDraftPoint():this.deleteJustDrawnFeature()}>
                            </sl-icon-button>
                        </sl-tooltip>
                    </div>
                `:``}
            </div>

            ${o||this.moveHistoryIndex>=0?s`
                <div class="toolbar-row">
                    <span class="toolbar-label">Edit</span>
                    <div class="pill">
                        ${this.toggleButton({icon:`arrows-move`,label:`Move features`,tooltip:`Click a feature to select it, or drag it directly to move it`,pressed:this.mode===`edit-move`,disabled:!o,onClick:()=>this.setModeInternal(`edit-move`)})}
                        ${this.toggleButton({src:e===`Polygon`?fe:de,name:`edit-vertices`,label:`Edit points`,tooltip:`Click a feature to edit its points`,pressed:this.mode===`edit-vertices`,disabled:!o,onClick:()=>this.setModeInternal(`edit-vertices`)})}
                        ${this.toggleButton({src:pe,name:`feature-values`,label:`Edit attributes`,tooltip:`Hover a feature, then click it to view or edit its attributes`,pressed:this.mode===`attributes`,disabled:!o,onClick:()=>this.setModeInternal(`attributes`)})}
                    </div>
                    ${this.isEditMode()?s`
                        <div class="history-actions">
                            <sl-tooltip content="Undo (${this.modKey}+Z)">
                                <sl-icon-button name="arrow-counterclockwise" size="small" label="Undo"
                                    ?disabled=${this.moveHistoryIndex<0}
                                    @click=${()=>this.undoMove()}>
                                </sl-icon-button>
                            </sl-tooltip>
                            <sl-tooltip content="Redo (${this.modKey}+Y)">
                                <sl-icon-button name="arrow-clockwise" size="small" label="Redo"
                                    ?disabled=${this.moveHistoryIndex>=this.moveHistory.length-1}
                                    @click=${()=>this.redoMove()}>
                                </sl-icon-button>
                            </sl-tooltip>
                            ${this.mode===`edit-vertices`?s`
                                <div class="divider"></div>
                                <sl-tooltip content="Delete selected point">
                                    <sl-icon-button name="trash" size="small" class="delete-feature-btn" label="Delete selected point"
                                        ?disabled=${!this.selectedHandle}
                                        @click=${()=>this.deleteSelectedVertex()}>
                                    </sl-icon-button>
                                </sl-tooltip>
                            `:``}
                        </div>
                    `:``}
                </div>
            `:``}

            ${o||this.moveHistoryIndex>=0?s`
                <div class="toolbar-row">
                    <span class="toolbar-label">Delete</span>
                    <div class="pill">
                        ${this.toggleButton({icon:`hand-index-thumb`,label:`Select features by clicking`,tooltip:`Click a feature to delete it`,pressed:this.mode===`select`,disabled:!o,onClick:()=>this.setModeInternal(`select`)})}
                        ${this.toggleButton({src:ue,name:`rect-select`,label:`Select features in a rectangle`,tooltip:`Drag a rectangle to delete the features inside it`,pressed:this.mode===`select-rect`,disabled:!o,onClick:()=>this.setModeInternal(`select-rect`)})}
                        ${this.toggleButton({src:me,name:`lasso-select`,label:`Select features in a free-hand shape`,tooltip:`Draw a free-hand shape to delete the features inside it`,pressed:this.mode===`select-lasso`,disabled:!o,onClick:()=>this.setModeInternal(`select-lasso`)})}
                    </div>
                    ${this.isSelectMode()?s`
                        <div class="history-actions">
                            <sl-tooltip content="Undo (${this.modKey}+Z)">
                                <sl-icon-button name="arrow-counterclockwise" size="small" label="Undo"
                                    ?disabled=${this.moveHistoryIndex<0}
                                    @click=${()=>this.undoMove()}>
                                </sl-icon-button>
                            </sl-tooltip>
                            <sl-tooltip content="Redo (${this.modKey}+Y)">
                                <sl-icon-button name="arrow-clockwise" size="small" label="Redo"
                                    ?disabled=${this.moveHistoryIndex>=this.moveHistory.length-1}
                                    @click=${()=>this.redoMove()}>
                                </sl-icon-button>
                            </sl-tooltip>
                            <div class="divider"></div>
                            <sl-tooltip content=${this.selectedFeatureIds.length>1?`Delete ${this.selectedFeatureIds.length} selected`:`Delete selected`}>
                                <sl-icon-button name="trash" size="small" class="delete-feature-btn"
                                    label=${this.selectedFeatureIds.length>1?`Delete ${this.selectedFeatureIds.length} selected`:`Delete selected`}
                                    ?disabled=${this.selectedFeatureIds.length===0}
                                    @click=${()=>this.deleteSelected()}>
                                </sl-icon-button>
                            </sl-tooltip>
                        </div>
                    `:``}
                </div>
            `:``}

            <div class="toolbar-row">
                <span class="toolbar-label">Tools</span>
                <div class="pill">
                    ${this.toggleButton({icon:`magnet`,label:`Snap to points and edges`,tooltip:`Snap to points and edges (${this.snapEnabled?`on`:`off`}) — hold Alt to toggle`,pressed:this.effectiveSnap,onClick:()=>{this.snapEnabled=!this.snapEnabled,this.snapEnabled||(this.snapPos=null,this.updateRubberband())}})}
                </div>
            </div>

            <div class="help">${this.helpText}</div>

            ${this.isTouchDevice&&(this.mode===`draw-line`||this.mode===`draw-line-dashed`||this.mode===`draw-polygon`)&&this.draftPoints.length>=(this.mode===`draw-polygon`?3:2)?s`
                <sl-button size="small" variant="primary" style="margin-bottom:.4rem;width:100%"
                    @click=${()=>{let e=K(this.mode),t=e?this.activeLayerIds[e]:null;t&&this.finishDraft(t)}}>
                    Finish
                </sl-button>
            `:``}

            ${i&&a?s`
                <div class="prop-row" style="margin-top:.5rem">
                    <span class="prop-label section-label" style="margin-bottom:0">Attribute</span>
                    <span class="prop-value section-label" style="margin-bottom:0">Value</span>
                </div>
                ${a.properties.map(e=>s`
                    <div class="prop-row" data-attr-name=${e.name}>
                        <span class="prop-label">${e.name}</span>
                        ${e.name===`id`||[`longitude`,`latitude`,`area`,`perimeter`,`length`,`create-time`,`update-time`].includes(e.type)?s`<span class="prop-value" style="color:var(--color-text-muted, #6b7681);font-style:italic;padding:0 0.3rem">${[`create-time`,`update-time`].includes(e.type)?i.properties[e.name]?new Date(i.properties[e.name]).toLocaleString():`—`:i.properties[e.name]??`—`}</span>`:e.type===`imageURL`?s`<div class="prop-url-wrap">
                                        <sl-input size="small"
                                            .value=${String(i.properties[e.name]??``)}
                                            placeholder="image URL"
                                            @sl-focus=${()=>{this.lastFocusedAttributeName=e.name}}
                                            @sl-change=${t=>{i.properties[e.name]=t.target.value,a&&this.computeSpecialProperties(i,a),this.features=[...this.features],this.refreshDrawLayerSource(i.layerId)}}></sl-input>
                                        ${i.properties[e.name]?s`<img class="prop-img" src=${String(i.properties[e.name])} @error=${e=>{let t=e.target,n=document.createElement(`span`);n.className=`prop-img-error`,n.textContent=`⚠ invalid image`,t.replaceWith(n)}}>`:``}
                                       </div>`:e.type===`linkURL`?s`<div class="prop-url-wrap">
                                            <sl-input size="small"
                                                .value=${String(i.properties[e.name]??``)}
                                                placeholder="link URL"
                                                @sl-focus=${()=>{this.lastFocusedAttributeName=e.name}}
                                                @sl-change=${t=>{i.properties[e.name]=t.target.value,a&&this.computeSpecialProperties(i,a),this.features=[...this.features],this.refreshDrawLayerSource(i.layerId)}}></sl-input>
                                            ${i.properties[e.name]?s`<a class="prop-link" href=${String(i.properties[e.name])} target="_blank" rel="noopener noreferrer">${i.properties[e.name]}</a>`:``}
                                           </div>`:s`<sl-input size="small" class="prop-value"
                                            .value=${String(i.properties[e.name]??``)}
                                            @sl-focus=${()=>{this.lastFocusedAttributeName=e.name}}
                                            @sl-change=${t=>{i.properties[e.name]=t.target.value,a&&this.computeSpecialProperties(i,a),this.features=[...this.features],this.refreshDrawLayerSource(i.layerId)}}></sl-input>`}
                    </div>
                `)}
            `:``}

            ${n?s`
                <sl-dialog id="attributes-dialog" label="Attributes">
                    <div class="prop-table-wrap">
                        <div class="prop-grid" role="table">
                            <div class="prop-grid-row prop-grid-header" role="row">
                                <span class="prop-grid-cell" role="columnheader">Attribute</span>
                                <span class="prop-grid-cell" role="columnheader">Type</span>
                                <span class="prop-grid-cell" role="columnheader"></span>
                            </div>
                            ${n.properties.map((e,t)=>s`
                                <div class="prop-grid-row ${e.name===`id`?`prop-row-auto`:``}" role="row">
                                    <span class="prop-grid-cell" role="cell">
                                        ${this.renamingAttributeIndex===t?s`
                                            <div class="rename-attr-row">
                                                <sl-input size="small" autofocus
                                                    .value=${this.renameAttrDraft}
                                                    @sl-input=${e=>{this.renameAttrDraft=e.target.value}}
                                                    @keydown=${e=>{e.key===`Enter`?this.commitRenameAttribute(n,t):e.key===`Escape`&&this.cancelRenameAttribute()}}>
                                                </sl-input>
                                                <sl-icon-button name="check-lg" label="Save name"
                                                    ?disabled=${!this.renameAttributeDraftValid(n,t)}
                                                    @click=${()=>this.commitRenameAttribute(n,t)}>
                                                </sl-icon-button>
                                                <sl-icon-button name="x-lg" label="Cancel rename"
                                                    @click=${()=>this.cancelRenameAttribute()}>
                                                </sl-icon-button>
                                            </div>
                                        `:s`
                                            <div class="prop-name-cell">
                                                <span class="prop-cell-text" title=${e.name}>${e.name}</span>
                                                ${this.canRenameAttribute(e)?s`
                                                    <sl-icon-button name="pencil" class="rename-attr-btn" label="Rename property"
                                                        @click=${()=>this.startRenameAttribute(t,e.name)}>
                                                    </sl-icon-button>
                                                `:``}
                                            </div>
                                        `}
                                    </span>
                                    <span class="prop-grid-cell" role="cell">
                                        <span class="prop-cell-text" title=${e.type}>${g[e.type]??e.type}${e.name===`id`?` (auto)`:``}</span>
                                    </span>
                                    <span class="prop-grid-cell prop-grid-cell--actions" role="cell">
                                        ${t===0||this.renamingAttributeIndex===t?``:s`
                                            <sl-icon-button name="trash" class="remove-attr-btn" label="Remove property"
                                                @click=${()=>this.removeActiveLayerProperty(n,t)}>
                                            </sl-icon-button>
                                        `}
                                    </span>
                                </div>
                            `)}
                        </div>
                    </div>

                    ${this.addingAttribute?s`
                        <div class="add-attr-form">
                            <div class="add-attr-fields-row">
                                <sl-input size="small" class="add-attr-name-input" placeholder="Add attribute name" aria-label="Attribute name" autofocus
                                    .value=${this.newAttrName}
                                    @sl-input=${e=>{this.newAttrName=e.target.value}}
                                    @keydown=${e=>e.key===`Enter`&&this.newAttrName.trim()&&this.addActiveLayerProperty(n)}>
                                </sl-input>
                                ${this.newAttrName.trim()?s`
                                    <sl-select size="small" hoist class="add-attr-type-select" placeholder="Choose a type" aria-label="Attribute type" value=${this.newAttrType}
                                        @sl-change=${e=>{this.newAttrType=e.target.value}}>
                                        ${_[n.type].filter(e=>!oe.has(e)).map(e=>s`
                                            <sl-option value=${e}>${g[e]??e}</sl-option>
                                        `)}
                                    </sl-select>
                                `:``}
                                <sl-button size="small" variant="primary"
                                    ?disabled=${!(this.newAttrName.trim()&&this.newAttrType)}
                                    @click=${()=>this.addActiveLayerProperty(n)}>
                                    OK
                                </sl-button>
                                <sl-icon-button name="x-lg" label="Cancel" @click=${()=>this.cancelAddAttribute()}></sl-icon-button>
                            </div>
                            <div class="add-attr-undo-row">${this.renderAttributeUndoRedo(n)}</div>
                            <div class="add-attr-note">New attributes are added to the bottom of the list above.</div>
                        </div>
                    `:s`
                        <div class="add-attr-row">
                            <sl-button variant="default" size="small" class="add-attr-btn-below"
                                @click=${()=>{this.addingAttribute=!0}}>
                                <sl-icon slot="prefix" name="plus-lg"></sl-icon>
                                Add attribute
                            </sl-button>
                            ${this.renderAttributeUndoRedo(n)}
                        </div>
                    `}

                    <sl-dropdown slot="footer" placement="top-start" class="optional-attrs-dropdown">
                        <sl-button slot="trigger" size="small" caret class="optional-attrs-trigger">
                            Optional attributes
                        </sl-button>
                        <div class="auto-attr-dropdown-panel">
                            ${this.availableAutoAttributeTypes(n).map(e=>s`
                                <label class="auto-attr-checkbox">
                                    <input type="checkbox"
                                        .checked=${this.isAutoAttributeChecked(n,e)}
                                        @change=${()=>this.toggleAutoAttribute(n,e)}>
                                    ${v[e]?.label??e}
                                </label>
                            `)}
                        </div>
                    </sl-dropdown>
                    <sl-button slot="footer" size="small" variant="primary" @click=${()=>this.attributesDialog?.hide()}>Done</sl-button>
                </sl-dialog>
            `:``}
        `}renderSessionFooter(){let e=this.pickedType,t=this.activeLayerIds[e],n=this.drawLayers.find(e=>e.id===t);return n?s`
            <div class="session-footer">
                <sl-button variant="default" size="small" @click=${()=>this.attributesDialog?.show()}>
                    <sl-icon slot="prefix" name="table"></sl-icon>
                    Edit attributes (${n.properties.length})
                </sl-button>
                <span class="footer-spacer"></span>
                ${this.layerNameInvalid?s`<span class="name-required-hint">Give the new layer a name.</span>`:``}
                <sl-button size="small" variant="primary" @click=${()=>this.confirmDone()}>Done</sl-button>
            </div>
        `:``}toggleButton(e){let{icon:t,src:n,label:r,pressed:i,disabled:a=!1,tooltip:o=r,onClick:c}=e;return s`
            <sl-tooltip content=${o}>
                <button type="button" class="toggle-button" name=${e.name??t??``}
                    aria-label=${r} aria-pressed=${i?`true`:`false`}
                    ?disabled=${a}
                    @click=${c}>
                    ${n?s`<sl-icon src=${n} aria-hidden="true"></sl-icon>`:s`<sl-icon name=${t} aria-hidden="true"></sl-icon>`}
                </button>
            </sl-tooltip>`}render(){return s`
            <div class="scroll-content">
                ${this.panelView===`type`?this.renderTypePicker():this.panelView===`layers`?this.renderLayerPicker():this.renderEditingSession()}
            </div>
            ${this.panelView===`editing`?this.renderSessionFooter():``}
        `}};p([i()],G.prototype,`mode`,void 0),p([i()],G.prototype,`drawLayers`,void 0),p([i()],G.prototype,`features`,void 0),p([i()],G.prototype,`selectedFeatureId`,void 0),p([i()],G.prototype,`selectedFeatureIds`,void 0),p([i()],G.prototype,`hoveredFeatureId`,void 0),p([i()],G.prototype,`helpText`,void 0),p([i()],G.prototype,`pendingMode`,void 0),p([i()],G.prototype,`uiVersion`,void 0),p([i()],G.prototype,`panelView`,void 0),p([i()],G.prototype,`pickedType`,void 0),p([i()],G.prototype,`showDrawIntro`,void 0),p([i()],G.prototype,`catalogLayerOptions`,void 0),p([i()],G.prototype,`catalogLayerCounts`,void 0),p([i()],G.prototype,`pendingCatalogEditOption`,void 0),p([i()],G.prototype,`isTouchDevice`,void 0),p([i()],G.prototype,`snapEnabled`,void 0),p([i()],G.prototype,`altActive`,void 0),p([i()],G.prototype,`editState`,void 0),p([e(`#attributes-dialog`)],G.prototype,`attributesDialog`,void 0),p([e(`.editing-layer-name`)],G.prototype,`editingLayerNameInput`,void 0),p([i()],G.prototype,`layerNameInvalid`,void 0),p([i()],G.prototype,`layerNameDraft`,void 0),p([i()],G.prototype,`addingAttribute`,void 0),p([i()],G.prototype,`newAttrName`,void 0),p([i()],G.prototype,`newAttrType`,void 0),p([i()],G.prototype,`removedAttributeStack`,void 0),p([i()],G.prototype,`removedAttributeRedoStack`,void 0),p([i()],G.prototype,`renamingAttributeIndex`,void 0),p([i()],G.prototype,`renameAttrDraft`,void 0),G=p([n(`webmapx-draw-tool`)],G);function K(e){return e===`draw-point`?`Point`:e===`draw-line`||e===`draw-line-dashed`?`LineString`:e===`draw-polygon`||e===`draw-circle`||e===`draw-rectangle`?`Polygon`:null}function q(e){return e===`Point`?`draw-point`:e===`LineString`?`draw-line`:`draw-polygon`}function J(e){return e===`draw-point`||e===`draw-line`||e===`draw-line-dashed`||e===`draw-polygon`}function Y(e){return e===`Point`?`Points`:e===`LineString`?`Lines`:`Polygons`}function X(e){return e===`Point`?`point`:e===`LineString`?`line`:`polygon`}function Z(e,t){return t===`Polygon`?`border-color:${e};background:${e}33`:`background:${e}`}function Q(e){let t=e.trim();return t===k||RegExp(`^${k} \\(\\d+\\)$`).test(t)}function Fe(e){return`Layer with ${Y(e).toLowerCase()}`}function Ie(e){return e===`Point`||e===`MultiPoint`||e===`LineString`||e===`MultiLineString`||e===`Polygon`||e===`MultiPolygon`}function $(e){return e===`Point`||e===`MultiPoint`}function Le(e){return e===`LineString`||e===`MultiLineString`}export{G as WebmapxDrawTool};