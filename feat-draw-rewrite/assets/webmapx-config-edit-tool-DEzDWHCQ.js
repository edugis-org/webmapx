const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["./toast-G1rmXVvk.js","./webmapx-shared-BlSlzgHy.js","./rolldown-runtime-Cyuzqnbw.js","./leaflet-adapter-BYVANefu.js","./cesium-adapter-DCP1QrEw.js","./leaflet-adapter-vh-t_kPv.css","./vendor-allmaps-foundation-BwHqksok.js","./openlayers-adapter-0v0PCf3z.js","./maplibre-adapter-6ktFp313.js","./maplibre-adapter-B2k4QVOw.css","./openlayers-adapter-c_1sG1-7.css","./vendor-lit-DP8NDNGT.js"])))=>i.map(i=>d[i]);
import"./vendor-shoelace-DBc2J2Ui.js";import{_ as e,g as t,h as n,p as r,x as i,y as a}from"./vendor-lit-DP8NDNGT.js";import{Wr as o,Xr as s}from"./webmapx-shared-BlSlzgHy.js";import{r as c}from"./leaflet-adapter-BYVANefu.js";import{r as l,t as u}from"./decorate-Bxy85Xl5.js";var d=new Set([`configedit`,`config-edit`,`settings`]),f=new Set([`id`,`type`,`enabled`,`items`,`tree`]),p=s,m={defaultFormat:[`geographic-en`,`geographic-local`,`lonlat`,`latlon`],position:[`top-left`,`middle-left`,`bottom-left`,`top-center`,`middle-center`,`bottom-center`,`top-right`,`middle-right`,`bottom-right`,`edge-bottom-left`,`edge-bottom-center`,`edge-bottom-right`],orientation:[`vertical`,`horizontal`],"panel-position":[`after`,`before`],"panel.position":[`after`,`before`],provider:[`nominatim`],direction:[`up`,`down`,`left`,`right`],tooltipPlacement:[`right`,`left`,`top`,`bottom`],alignment:[`start`,`center`,`end`],priority:[`normal`,`high`,`low`]},h={coordinates:{defaultFormat:`geographic-en`},search:{provider:`nominatim`}},g=[`mainToolbar`,`legendToolbar`],_={mainToolbar:{type:`toolbar`,enabled:!0,position:`top-left`,orientation:`vertical`,tooltipPlacement:`right`,panel:{enabled:!0,position:`after`}},legendToolbar:{type:`toolbar`,enabled:!0,position:`top-right`,orientation:`vertical`,tooltipPlacement:`left`,panel:{enabled:!0,position:`after`}}},v=[`position`,`orientation`,`tooltipPlacement`,`alignment`,`priority`],y=[`label`,`position`];function b(e){return o.find(t=>t.id===e||t.id===p(e))?.label??e}function x(e,t=!1){let n=p(String(e.id??e.type??``)),r=Array.isArray(e.items)?e.items.filter(e=>!d.has(p(String(e.id??e.type??``)))).map(e=>x(e)):void 0;return{id:n,label:b(n),configItem:e,subItems:r,isNew:t}}function S(e,t,n){let r=[...e.layerData?.layers??[]],i=[...e.layerData?.sources??[]],a=new Set(r.map(e=>e.id)),o=new Set(i.map(e=>e.id));for(let e of n){if(a.has(e))continue;let n=t.get(e);if(!n)continue;let{sources:s,...c}=n;if(r.push(c),a.add(e),s&&typeof s==`object`)for(let[e,t]of Object.entries(s))o.has(e)||(i.push({...t,id:e}),o.add(e))}return{layers:r,sources:i}}function C(e,t,n,r,i,a,o,s,c,l,u){let f={...e.tools??{}};for(let n of t){let t=(e.tools??{})[n.key]?.items??[],r=[];for(let e of n.items){let n=t.find(t=>p(String(t.id??t.type??``))===e.id),i=n?{...n,...e.configItem,enabled:!0}:{...e.configItem,enabled:!0};if(Array.isArray(e.subItems)){let t=n?.items??[],r=[];for(let n of e.subItems){let e=t.find(e=>p(String(e.id??e.type??``))===n.id);r.push(e?{...e,...n.configItem,enabled:!0}:{...n.configItem,enabled:!0})}for(let n of t){let t=p(String(n.id??n.type??``));e.subItems.find(e=>e.id===t)||r.push({...n,enabled:!1})}i.items=r}r.push(i)}for(let e of t){let t=p(String(e.id??e.type??``));if(d.has(t)){r.push({...e,enabled:!1});continue}n.items.find(e=>e.id===t)||r.push({...e,enabled:!1})}r.filter(e=>e.enabled!==!1).length===0?delete f[n.key]:f[n.key]={...n.configItem,items:r}}for(let t of n){let n=(e.tools??{})[t.id];(n!==void 0||t.enabled)&&(f[t.id]={...n??{},...t.configItem,enabled:t.enabled})}for(let e of d)f[e]&&(f[e]={...f[e],enabled:!1});let m=l??new Set,h=m.size>0?(()=>{let t=(e.layerData?.layers??[]).filter(e=>!m.has(e.id)),n=new Set(t.map(e=>e.source).filter(Boolean)),r=(e.layerData?.sources??[]).filter(e=>n.has(e.id));return{...e.layerData,layers:t,sources:r}})():e.layerData,g=e.project,_=c?.trim()?{...g,title:c.trim(),id:c.trim().toLowerCase().replace(/[^a-z0-9]+/g,`_`).replace(/^_|_$/g,``)||`config`}:g,v=o?{...e.map,center:o.center,zoom:Math.round(o.zoom*100)/100,...o.bearing===0?{bearing:void 0}:{bearing:Math.round(o.bearing*10)/10},...o.pitch===0?{pitch:void 0}:{pitch:Math.round(o.pitch*10)/10},...s&&s!==`mercator`?{projection:s}:{projection:void 0}}:e.map,y=[...a&&!m.has(a)?[a]:[],...i.filter(e=>!m.has(e))],b={...e.state,activeLayers:y.map(e=>({ref:e,visible:!0})),...a?{activeBackground:a}:{},...u?{terrainEnabled:!0}:{terrainEnabled:void 0}};if(!r)return{...e,project:_,map:v,layerData:h,tools:f,state:b};let x=new Set([...i,...a?[a]:[]]),S=(e.layerData?.layers??[]).filter(e=>x.has(e.id)),C=new Set(S.map(e=>e.source).filter(Boolean)),w=(e.layerData?.sources??[]).filter(e=>C.has(e.id)),T={...e.layerData,layers:S,sources:w},E=e=>{let t=[];for(let n of e){let e=n;if(e.layerId)x.has(e.layerId)&&!m.has(e.layerId)&&t.push(n);else if(Array.isArray(e.children)){let n=E(e.children);n.length&&t.push({...e,children:n})}}return t},D={};for(let[e,t]of Object.entries(f)){let n=t;D[e]=Array.isArray(n?.items)?{...n,items:n.items.map(e=>{let t=e;return Array.isArray(t.tree)?{...t,tree:E(t.tree)}:e})}:t}return{...e,project:_,map:v,tools:D,layerData:T,state:b}}var w=class extends t{constructor(...e){super(...e),this.toolbars=[],this.controls=[],this.onlyActiveLayers=!1,this.removeUnsupported=!1,this.projectTitle=``,this.filename=`config.json`,this.popup=null,this.popupDraft={},this._dragId=null,this._dragToolbar=null,this._dragParent=null}static{this.styles=i`
        :host { display: block; padding: 0.75rem; box-sizing: border-box; min-width: 260px; }
        h4 { margin: 0 0 0.6rem; font-size: var(--webmapx-font-size-md, 0.85rem); font-weight: 600; display: flex; align-items: center; gap: 0.4rem; }
        .section-label { font-size: var(--webmapx-font-size-sm, 0.78rem); font-weight: 600; color: var(--color-text-secondary, #5a6773); margin: 0.75rem 0 0.3rem; text-transform: uppercase; letter-spacing: .04em; }
        .toolbar-label { font-size: var(--webmapx-font-size-sm, 0.8rem); font-weight: 600; color: var(--color-text-secondary, #5a6773); margin: 0.5rem 0 0.25rem; }

        /* Tool rows */
        .tool-list { display: flex; flex-direction: column; gap: 2px; }
        .tool-row {
            display: flex; align-items: center; gap: 0.25rem;
            padding: 0.2rem 0.3rem; border-radius: var(--webmapx-radius-sm, 4px);
            border: 1px solid var(--color-border-light, #e2e7ec);
            background: var(--color-surface, #fff);
            font-size: var(--webmapx-font-size-sm, 0.82rem);
        }
        .tool-row.drag-over { outline: 2px solid var(--sl-color-primary-500); background: var(--sl-color-primary-50); }
        .tool-row.dragging  { opacity: 0.4; }
        .drag-handle { cursor: grab; color: var(--color-text-muted, #6b7681); user-select: none; flex-shrink: 0; }
        .drag-handle:active { cursor: grabbing; }
        .tool-name { flex: 1; }

        /* Toolbox sub-section */
        .toolbox-sub { margin: 2px 0 2px 1rem; padding: 0.25rem 0.4rem; border-left: 2px solid var(--color-border, #d5dce3); }
        .toolbox-sub-label { font-size: 0.73rem; color: var(--color-text-muted, #6b7681); text-transform: uppercase; letter-spacing: .04em; margin-bottom: 0.2rem; }

        /* Map controls (no drag) */
        .control-row { display: flex; align-items: center; gap: 0.25rem; padding: 0.15rem 0.3rem; font-size: var(--webmapx-font-size-sm, 0.82rem); }
        sl-checkbox::part(label) { font-size: var(--webmapx-font-size-sm, 0.82rem); }

        /* Add-tool dropdown */
        .add-row { margin-top: 0.4rem; }

        /* Misc */
        sl-input, sl-select { width: 100%; }
        sl-button[variant="primary"] { margin-top: 0.5rem; width: 100%; }

        /* Popup */
        .prop-popup {
            position: fixed;
            background: var(--color-surface, #fff);
            border: 1px solid var(--color-border, #d5dce3);
            border-radius: var(--webmapx-radius-md, 6px);
            box-shadow: var(--webmapx-shadow-lg, 0 4px 16px rgba(0,0,0,.18));
            padding: 0.7rem;
            z-index: 9999;
            min-width: 240px;
            max-width: 320px;
            max-height: 480px;
            overflow-y: auto;
        }
        .prop-popup h3 { margin: 0 0 0.5rem; font-size: var(--webmapx-font-size-md, 0.85rem); border-bottom: 1px solid var(--color-border-light, #e2e7ec); padding-bottom: 0.35rem; }
        .prop-row { display: flex; align-items: center; gap: 0.4rem; margin-bottom: 0.4rem; font-size: var(--webmapx-font-size-sm, 0.8rem); }
        .prop-row label { flex: 0 0 120px; color: var(--color-text-secondary, #5a6773); }
        .prop-row input[type="text"],
        .prop-row input[type="number"],
        .prop-row select { flex: 1; padding: 0.15rem 0.3rem; font-size: var(--webmapx-font-size-sm, 0.8rem); border: 1px solid var(--color-border, #d5dce3); border-radius: var(--webmapx-radius-xs, 3px); }
        .prop-row input[type="checkbox"] { width: 1rem; height: 1rem; }
        .prop-row textarea { flex: 1; font-size: var(--webmapx-font-size-sm, 0.78rem); font-family: monospace; border: 1px solid #ccc; border-radius: var(--webmapx-radius-xs, 3px); padding: 0.2rem; resize: vertical; }
        .prop-row textarea.json-invalid { border-color: red; }
        .prop-footer { display: flex; justify-content: flex-end; gap: 0.4rem; margin-top: 0.5rem; }
        .prop-footer button { padding: 0.25rem 0.6rem; font-size: var(--webmapx-font-size-sm, 0.8rem); border-radius: var(--webmapx-radius-xs, 3px); cursor: pointer; border: 1px solid var(--color-border, #d5dce3); background: var(--color-surface-raised, #f4f6f8); }
        .prop-footer .btn-apply { background: var(--color-primary, #2b6c8f); color: var(--color-on-primary, #fff); border-color: var(--color-primary, #2b6c8f); }
    `}get mapElement(){return l(this)}connectedCallback(){super.connectedCallback(),this.loadFromConfig(),this._onDocMouseDown=this._onDocMouseDown.bind(this),this._onDocKeyDown=this._onDocKeyDown.bind(this),document.addEventListener(`mousedown`,this._onDocMouseDown),document.addEventListener(`keydown`,this._onDocKeyDown)}disconnectedCallback(){super.disconnectedCallback(),document.removeEventListener(`mousedown`,this._onDocMouseDown),document.removeEventListener(`keydown`,this._onDocKeyDown)}_onDocMouseDown(e){if(!this.popup)return;let t=this.shadowRoot?.querySelector(`.prop-popup`);t&&!t.contains(e.target)&&this.closePopup()}_onDocKeyDown(e){e.key===`Escape`&&this.closePopup()}loadFromConfig(){let e=this.mapElement?.config,t=e?.tools??{},n=[],r=new Set,i=[...g,...Object.keys(t).filter(e=>t[e]?.type===`toolbar`&&!g.includes(e))];for(let e of i){r.add(e);let i=t[e]??_[e]??{type:`toolbar`,enabled:!0},a=(i.items??[]).filter(e=>!d.has(p(String(e.id??e.type??``)))&&e.enabled!==!1).map(e=>x(e));n.push({key:e,configItem:i,items:a})}this.toolbars=n;let a=[],s=o.filter(e=>e.standalone);for(let e of s){if(d.has(e.id))continue;let n,r;for(let[i,a]of Object.entries(t))if(p(i)===e.id||p(String(a.type??``))===e.id||i===e.id){n=a,r=i;break}let i=r??e.id,o={...n??{id:i,type:e.id},...h[e.id]??{}};a.push({id:e.id,label:e.label,enabled:n?n.enabled!==!1:!1,configItem:o})}this.controls=a;let c=e?.project;this.projectTitle=typeof c?.title==`string`?c.title:``;let l=typeof c?.id==`string`?c.id:`config`;this.filename=`${l.toLowerCase().replace(/[^a-z0-9]+/g,`_`).replace(/^_|_$/g,``)||`config`}.json`}removeItem(e,t,n){this.toolbars=this.toolbars.map(r=>r.key===e?n?{...r,items:r.items.map(e=>e.id===n?{...e,subItems:e.subItems?.filter(e=>e.id!==t)}:e)}:{...r,items:r.items.filter(e=>e.id!==t)}:r)}addItem(e,t,n){let r=o.find(e=>e.id===t);if(!r)return;let i={id:t,label:r.label,configItem:{id:t,type:t,enabled:!0,...h[t]??{}},isNew:!0};this.toolbars=this.toolbars.map(t=>t.key===e?n?{...t,items:t.items.map(e=>e.id===n?{...e,subItems:[...e.subItems??[],i]}:e)}:{...t,items:[...t.items,i]}:t)}updateItemConfig(e,t,n,r){this.toolbars=this.toolbars.map(i=>{if(i.key!==e)return i;let a=e=>e.id===t?{...e,configItem:{...e.configItem,...n}}:e;return r?{...i,items:i.items.map(e=>e.id===r?{...e,subItems:e.subItems?.map(a)}:e)}:{...i,items:i.items.map(a)}})}onDragStart(e,t,n,r){this._dragId=t,this._dragToolbar=n,this._dragParent=r??null,e.dataTransfer?.setData(`text/plain`,t)}onDragEnd(){this._dragId=null,this._dragToolbar=null,this._dragParent=null}onDrop(e,t,n,r){e.preventDefault();let i=this._dragId;!i||i===t||this._dragToolbar!==n||this._dragParent!==(r??null)||(this.toolbars=this.toolbars.map(e=>{if(e.key!==n)return e;let a=e=>{let n=[...e],r=n.findIndex(e=>e.id===i),a=n.findIndex(e=>e.id===t);if(r===-1||a===-1)return e;let[o]=n.splice(r,1);return n.splice(a,0,o),n};return r?{...e,items:e.items.map(e=>e.id===r?{...e,subItems:a(e.subItems??[])}:e)}:{...e,items:a(e.items)}}))}openPopup(e,t,n,r,i,a=!1){let o=e.currentTarget.getBoundingClientRect();if(this.popup?.toolId===t&&this.popup?.toolbarKey===r&&this.popup?.isToolbar===a){this.closePopup();return}let s;if(a){s={};for(let e of v)n[e]!==void 0&&(s[e]=n[e]);let e=n.panel??{};for(let t of y)e[t]!==void 0&&(s[`panel.${t}`]=e[t])}else{s={};for(let[e,t]of Object.entries(n))f.has(e)||(s[e]=t)}this.popupDraft=s,this.popup={toolId:t,toolbarKey:r,parentId:i,isToolbar:a,rect:o}}closePopup(){this.popup=null,this.popupDraft={}}applyPopup(){if(!this.popup)return;let{toolId:e,toolbarKey:t,parentId:n,isToolbar:r}=this.popup;if(r&&t){let e={},n={};for(let[t,r]of Object.entries(this.popupDraft))t.startsWith(`panel.`)?n[t.slice(6)]=r:e[t]=r;this.toolbars=this.toolbars.map(r=>{if(r.key!==t)return r;let i={...r.configItem.panel??{},...n};return{...r,configItem:{...r.configItem,...e,panel:i}}})}else t?this.updateItemConfig(t,e,this.popupDraft,n):this.controls=this.controls.map(t=>t.id===e?{...t,configItem:{...t.configItem,...this.popupDraft}}:t);this.closePopup()}resetPopup(){if(!this.popup)return;let{toolId:e,toolbarKey:t,parentId:n,isToolbar:r}=this.popup,i=this.mapElement?.config?.tools??{},a;if(r&&t){a=i[t]??_[t]??{};let e={};for(let t of v)a[t]!==void 0&&(e[t]=a[t]);let n=a.panel??{};for(let t of y)n[t]!==void 0&&(e[`panel.${t}`]=n[t]);this.popupDraft=e}else{if(t){let r=i[t]?.items??[],o=t=>{for(let n of t){if(p(String(n.id??n.type??``))===e)return n;if(Array.isArray(n.items)){let e=o(n.items);if(e)return e}}};a=o(n?r.find(e=>p(String(e.id??e.type??``))===n)?.items??[]:r)??{}}else a=i[e]??{};let r={};for(let[e,t]of Object.entries(a))f.has(e)||(r[e]=t);this.popupDraft=r}}async handleDownload(){let e=this.mapElement,t=e?.config;if(!t)return;let n=e?.adapter,r=n?.store?.getState?.()?.mapLayers??{},i=n?.getViewportState?.(),a=n?.getProjection?.()?.name??null,o=[],s;for(let[e,t]of Object.entries(r))t?.visible!==!1&&(t?.legendRole===`background`?s=e:o.push(e));let{layers:l,sources:u}=S(t,n?.getLayerConfigs?.()??new Map,[...o,...s?[s]:[]]),d={...t,layerData:{...t.layerData,layers:l,sources:u}},f=new Set,p;if(this.removeUnsupported){let t=t=>e?.isCatalogLayerSupported?.(t)??Promise.resolve(!0),n=await Promise.all((d.layerData?.layers??[]).map(async e=>{let n=e.id;return await t(n)?null:n}));if(f=new Set(n.filter(e=>e!==null)),s&&f.has(s)){let e=(d.layerData?.layers??[]).find(e=>e.id===s)?.singleGroup;if(e)for(let t of d.layerData?.layers??[]){let n=t;if(n.singleGroup===e&&!f.has(n.id)){p=n.id;break}}if(!p){let{showToast:e}=await c(async()=>{let{showToast:e}=await import(`./toast-G1rmXVvk.js`);return{showToast:e}},__vite__mapDeps([0,1,2,3,4,5,6,7,8,9,10,11]),import.meta.url);e(`<strong>No supported background layer available</strong><br>All background layers are unsupported by the current engine. Uncheck "Remove engine-unsupported layers" or switch engine.`,{variant:`danger`});return}}}let m=s&&f.has(s)?p:s,h=n?.isTerrainEnabled?.()===!0,g=C(d,this.toolbars,this.controls,this.onlyActiveLayers,o,m,i,a,this.projectTitle,f,h),_=new Blob([JSON.stringify(g,null,2)],{type:`application/json`}),v=URL.createObjectURL(_);Object.assign(document.createElement(`a`),{href:v,download:this.filename||`config.json`}).click(),URL.revokeObjectURL(v)}renderToolRow(t,n,r){let i=Object.keys(t.configItem).filter(e=>!f.has(e));return a`
            <div class="tool-row"
                draggable="true"
                @dragstart=${e=>{this.onDragStart(e,t.id,n,r),e.currentTarget.classList.add(`dragging`)}}
                @dragend=${e=>{this.onDragEnd(),e.currentTarget.classList.remove(`dragging`)}}
                @dragover=${e=>{e.preventDefault(),e.currentTarget.classList.add(`drag-over`)}}
                @dragleave=${e=>e.currentTarget.classList.remove(`drag-over`)}
                @drop=${e=>{e.currentTarget.classList.remove(`drag-over`),this.onDrop(e,t.id,n,r)}}>
                <span class="drag-handle" title="Drag to reorder">⠿</span>
                <span class="tool-name">${t.label}</span>
                ${i.length>0?a`
                    <sl-icon-button name="gear" label="Options" style="font-size:0.85rem"
                        @click=${e=>this.openPopup(e,t.id,t.configItem,n,r)}>
                    </sl-icon-button>
                `:e}
                <sl-icon-button name="x" label="Remove" style="font-size:0.85rem"
                    @click=${()=>this.removeItem(n,t.id,r)}>
                </sl-icon-button>
            </div>
            ${t.subItems===void 0?e:this.renderToolboxSub(t,n)}
        `}renderToolboxSub(t,n){let r=n,i=t.id,s=new Set(t.subItems.map(e=>e.id)),c=o.filter(e=>!e.standalone&&e.id!==`toolbox`&&!d.has(e.id)&&!s.has(e.id));return a`
            <div class="toolbox-sub">
                <div class="toolbox-sub-label">${t.label} contents</div>
                <div class="tool-list">
                    ${t.subItems.map(e=>this.renderToolRow(e,r,i))}
                </div>
                ${c.length>0?a`
                    <div class="add-row">
                        <sl-select size="small" placeholder="Add sub-tool…" clearable
                            @sl-change=${e=>{let t=e.target.value;t&&(this.addItem(r,t,i),e.target.value=``)}}>
                            ${c.map(e=>a`<sl-option value=${e.id}>${e.label}</sl-option>`)}
                        </sl-select>
                    </div>
                `:e}
            </div>
        `}renderPopup(){if(!this.popup)return e;let{toolId:t,toolbarKey:n,parentId:r,isToolbar:i,rect:o}=this.popup,s;if(i&&n)s=n===`mainToolbar`?`Toolbar`:n;else if(s=b(t),n){let e=this.toolbars.find(e=>e.key===n),i=(r?e?.items.find(e=>e.id===r)?.subItems:e?.items)?.find(e=>e.id===t);i&&(s=i.label)}let c=o.bottom+4,l=o.left;c+400>window.innerHeight&&(c=Math.max(4,o.top-404)),l+330>window.innerWidth&&(l=Math.max(4,window.innerWidth-334));let u=Object.entries(this.popupDraft);return a`
            <div class="prop-popup" style="top:${c}px;left:${l}px" @mousedown=${e=>e.stopPropagation()}>
                <h3>${s} options</h3>
                ${u.length===0?a`<p style="font-size:0.8rem;color:var(--color-text-muted,#6b7681);margin:0">No editable options.</p>`:e}
                ${u.map(([t,n])=>{let r=m[t];return a`
                        <div class="prop-row">
                            <label title=${t} for=${`prop-${t}`}>${t}</label>
                            ${typeof n==`boolean`?a`
                                <input type="checkbox" id=${`prop-${t}`} ?checked=${n}
                                    @change=${e=>{this.popupDraft={...this.popupDraft,[t]:e.target.checked}}}>
                            `:typeof n==`number`?a`
                                <input type="number" id=${`prop-${t}`} .value=${String(n)}
                                    @input=${e=>{let n=parseFloat(e.target.value);isNaN(n)||(this.popupDraft={...this.popupDraft,[t]:n})}}>
                            `:r?a`
                                <select id=${`prop-${t}`} .value=${String(n)}
                                    @change=${e=>{this.popupDraft={...this.popupDraft,[t]:e.target.value}}}>
                                    ${r.includes(String(n))?e:a`<option value=${String(n)}>${String(n)}</option>`}
                                    ${r.map(e=>a`<option value=${e} ?selected=${String(n)===e}>${e}</option>`)}
                                </select>
                            `:typeof n==`string`?a`
                                <input type="text" id=${`prop-${t}`} .value=${n}
                                    @input=${e=>{this.popupDraft={...this.popupDraft,[t]:e.target.value}}}>
                            `:a`
                                <textarea rows="3" id=${`prop-${t}`} .value=${JSON.stringify(n,null,2)}
                                    @input=${e=>{let n=e.target;try{let e=JSON.parse(n.value);n.classList.remove(`json-invalid`),this.popupDraft={...this.popupDraft,[t]:e}}catch{n.classList.add(`json-invalid`)}}}></textarea>
                            `}
                        </div>
                    `})}
                <div class="prop-footer">
                    <button @click=${()=>this.resetPopup()}>Reset</button>
                    <button class="btn-apply" @click=${()=>this.applyPopup()}>OK</button>
                </div>
            </div>
        `}render(){return a`
            <h4><sl-icon name="pencil-square"></sl-icon> Edit config</h4>

            <sl-input size="small" label="Project title" required
                ?invalid=${!this.projectTitle.trim()}
                help-text=${this.projectTitle.trim()?``:`Title is required`}
                .value=${this.projectTitle}
                @sl-input=${e=>{this.projectTitle=e.target.value;let t=this.projectTitle.trim().toLowerCase().replace(/[^a-z0-9]+/g,`_`).replace(/^_|_$/g,``)||`config`;this.filename=`${t}.json`}}>
            </sl-input>

            <sl-checkbox ?checked=${this.onlyActiveLayers}
                @sl-change=${e=>{this.onlyActiveLayers=e.target.checked}}>
                Only active layers
            </sl-checkbox>
            <sl-checkbox ?checked=${this.removeUnsupported}
                @sl-change=${e=>{this.removeUnsupported=e.target.checked}}>
                Remove engine-unsupported layers
            </sl-checkbox>

            ${this.toolbars.map(t=>{let n=t.key===`mainToolbar`?`Toolbar tools`:`${t.key} tools`,r=new Set(t.items.map(e=>e.id)),i=o.filter(e=>!e.standalone&&!d.has(e.id)&&!r.has(e.id));return a`
                    <div class="section-label" style="display:flex;align-items:center;gap:0.25rem">
                        <span style="flex:1">${n}</span>
                        <sl-icon-button name="gear" label="Toolbar settings" style="font-size:0.85rem"
                            @click=${e=>this.openPopup(e,t.key,t.configItem,t.key,void 0,!0)}>
                        </sl-icon-button>
                    </div>
                    <div class="tool-list">
                        ${t.items.map(e=>this.renderToolRow(e,t.key))}
                    </div>
                    ${i.length>0?a`
                        <div class="add-row">
                            <sl-select size="small" placeholder="Add tool…" clearable
                                @sl-change=${e=>{let n=e.target.value;n&&(this.addItem(t.key,n),e.target.value=``)}}>
                                ${i.map(e=>a`<sl-option value=${e.id}>${e.label}</sl-option>`)}
                            </sl-select>
                        </div>
                    `:e}
                `})}

            <div class="section-label">Map controls</div>
            <div class="tool-list">
                ${this.controls.map(t=>{let n=Object.keys(t.configItem).filter(e=>!f.has(e));return a`
                        <div class="control-row">
                            <sl-checkbox ?checked=${t.enabled}
                                @sl-change=${e=>{let n=e.target.checked;this.controls=this.controls.map(e=>e.id===t.id?{...e,enabled:n}:e)}}>
                                ${t.label}
                            </sl-checkbox>
                            ${n.length>0?a`
                                <sl-icon-button name="gear" label="Options" style="font-size:0.85rem"
                                    @click=${e=>this.openPopup(e,t.id,t.configItem)}>
                                </sl-icon-button>
                            `:e}
                        </div>
                    `})}
            </div>

            <sl-divider></sl-divider>

            <sl-input size="small" label="Filename"
                .value=${this.filename}
                @sl-input=${e=>{this.filename=e.target.value}}>
            </sl-input>

            <sl-button variant="primary" ?disabled=${!this.projectTitle.trim()} @click=${this.handleDownload}>
                <sl-icon slot="prefix" name="download"></sl-icon>
                Download config
            </sl-button>

            ${this.renderPopup()}
        `}};u([r()],w.prototype,`toolbars`,void 0),u([r()],w.prototype,`controls`,void 0),u([r()],w.prototype,`onlyActiveLayers`,void 0),u([r()],w.prototype,`removeUnsupported`,void 0),u([r()],w.prototype,`projectTitle`,void 0),u([r()],w.prototype,`filename`,void 0),u([r()],w.prototype,`popup`,void 0),u([r()],w.prototype,`popupDraft`,void 0),w=u([n(`webmapx-config-edit-tool`)],w);export{w as WebmapxConfigEditTool};