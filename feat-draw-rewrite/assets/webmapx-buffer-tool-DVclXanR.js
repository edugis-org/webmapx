import"./vendor-shoelace-DBc2J2Ui.js";import{_ as e,h as t,p as n,x as r,y as i}from"./vendor-lit-DP8NDNGT.js";import{Q as a,Qr as o}from"./webmapx-shared-BlSlzgHy.js";import{t as s}from"./decorate-Bxy85Xl5.js";import{t as c}from"./webmapx-modal-tool-BKFfcFXL.js";import{t as l}from"./form-label-styles-CUvG5W-2.js";var u=`webmapx-buffer-out:`,d=`webmapx-buffer-src:`,f=new Set([`fill`,`line`,`circle`,`symbol`,`geojson`,`vector`,`label`,`fill-extrusion`]),p=class extends c{constructor(...e){super(...e),this.toolId=`buffer`,this.availableLayers=[],this.selectedLayerId=``,this.availableSourceLayers=[],this.selectedSourceLayer=``,this.distanceMeters=500,this.segments=16,this.outputName=``,this.overwrite=!0,this.busy=!1,this.error=null,this.lastOutputLayerId=null,this.lastMapLayers=null,this._escHandler=null}static{this.styles=[l,r`
        :host { display: block; }

        :host(:not([active])) .tool-content { display: none; }

        .tool-content {
            padding: var(--sl-spacing-medium);
            display: flex;
            flex-direction: column;
            gap: var(--sl-spacing-small);
            font-size: var(--sl-font-size-small);
            min-width: 240px;
        }

        .actions {
            display: flex;
            gap: var(--sl-spacing-x-small);
            justify-content: flex-end;
            margin-top: var(--sl-spacing-x-small);
        }

        .status {
            display: flex;
            align-items: center;
            gap: var(--sl-spacing-x-small);
            font-size: var(--sl-font-size-x-small);
            color: var(--color-text-secondary, #5a6773);
        }

        sl-alert {
            font-size: var(--sl-font-size-x-small);
        }

        sl-select, sl-input {
            --sl-input-height-medium: 28px;
            --sl-input-font-size-medium: var(--sl-font-size-small);
        }
    `]}onActivate(){this._escHandler=e=>{e.key===`Escape`&&this.deactivate()},document.addEventListener(`keydown`,this._escHandler)}onDeactivate(){document.removeEventListener(`keydown`,this._escHandler),this._escHandler=null}onStateChanged(e){let t=e.mapLayers??{};this.lastMapLayers=t,this.availableLayers=Object.entries(t).filter(([,e])=>{let t=e.layerType;return!t||f.has(t)}).map(([e,t])=>({id:e,label:t.label??e})),!this.selectedLayerId&&this.availableLayers.length>0&&(this.selectedLayerId=this.availableLayers[0].id,this.syncLayerState()),this.selectedLayerId&&!this.availableLayers.find(e=>e.id===this.selectedLayerId)&&(this.selectedLayerId=this.availableLayers[0]?.id??``,this.syncLayerState(),this.lastOutputLayerId=null,this.overwrite=!0),this.syncSourceLayers()}syncLayerState(){this.syncSourceLayers(),this.syncOutputName()}syncOutputName(){let e=this.selectedSourceLayer||this.availableLayers.find(e=>e.id===this.selectedLayerId)?.label||this.selectedLayerId;this.outputName=`${e} buffer`}sourceLayers(e){let t=(this.lastMapLayers??{})[e]?.sublayers;if(!Array.isArray(t))return[];let n=new Set,r=e=>{for(let t of e){if(!t||typeof t!=`object`)continue;let e=t,i=e[`source-layer`];typeof i==`string`&&i&&n.add(i),Array.isArray(e.sublayers)&&r(e.sublayers)}};return r(t),[...n]}syncSourceLayers(){let e=this.sourceLayers(this.selectedLayerId);e.join(`,`)!==this.availableSourceLayers.join(`,`)&&(this.availableSourceLayers=e,e.includes(this.selectedSourceLayer)||(this.selectedSourceLayer=e[0]??``,this.syncOutputName()))}get mapElement(){return this.mapHost}handleLayerChange(e){this.selectedLayerId=e.target.value,this.syncLayerState(),this.error=null,this.lastOutputLayerId=null,this.overwrite=!0}handleSourceLayerChange(e){this.selectedSourceLayer=e.target.value,this.syncOutputName()}handleDistanceChange(e){let t=parseFloat(e.target.value);isNaN(t)||(this.distanceMeters=t)}handleSegmentsChange(e){let t=parseInt(e.target.value);!isNaN(t)&&t>=4&&(this.segments=t)}handleOutputNameChange(e){this.outputName=e.target.value}handleOverwriteChange(e){this.overwrite=e.target.checked}async handleRun(){if(!(!this.adapter||!this.selectedLayerId||this.busy)){this.busy=!0,this.error=null;try{let e=this.selectedSourceLayer?{sourceLayer:this.selectedSourceLayer}:void 0,t=await this.adapter.queryLayerFeatures(this.selectedLayerId,e);if(!t.features.length){this.error=`Selected layer has no features (try zooming in for vector tile layers).`;return}let n=this.adapter?.getViewportState().center[1]??0,r=await a({op:`buffer`,input:t,distanceMeters:this.distanceMeters,segments:this.segments,centerLat:n});if(!r.features.length){this.error=`Buffer produced no output features.`;return}let i=`${u}${this.selectedLayerId}`,o=`${d}${this.selectedLayerId}`,s=this.overwrite?``:`-${Date.now()}`,c=`${i}${s}`,l=`${o}${s}`,f=this.outputName.trim()||`${this.availableLayers.find(e=>e.id===this.selectedLayerId)?.label??`layer`} buffer`;if(this.overwrite&&this.lastOutputLayerId&&this.mapElement){this.adapter?.getSource(l)?.setData({type:`FeatureCollection`,features:[]});try{this.mapElement.removeInlineLayer(this.lastOutputLayerId)}catch{}}let p={id:c,type:`fill`,source:l,sources:{[l]:{id:l,type:`geojson`,data:r}},paint:{"fill-color":`#4a90d9`,"fill-opacity":.35,"fill-outline-color":`#1a5fa8`},metadata:{label:f,dynamic:!0,legendRole:`overlay`}};await this.mapElement?.addLayerRequest(p),this.lastOutputLayerId=p.id}catch(e){this.error=e instanceof Error?e.message:String(e)}finally{this.busy=!1}}}render(){let t=this.availableLayers.length>0;return i`
            <div class="tool-content">

                <sl-select
                    label="Input layer"
                    size="small"
                    value=${this.selectedLayerId}
                    ?disabled=${!t||this.busy}
                    @sl-change=${this.handleLayerChange}
                >
                    ${t?this.availableLayers.map(e=>i`
                            <sl-option value=${e.id}>${e.label}</sl-option>
                        `):i`<sl-option value="">No vector layers</sl-option>`}
                </sl-select>

                ${this.availableSourceLayers.length>1?i`
                    <sl-select
                        label="Sub-layer"
                        size="small"
                        value=${this.selectedSourceLayer}
                        ?disabled=${this.busy}
                        @sl-change=${this.handleSourceLayerChange}
                    >
                        ${this.availableSourceLayers.map(e=>i`
                            <sl-option value=${e}>${e}</sl-option>
                        `)}
                    </sl-select>
                `:e}

                <div>
                    <sl-input
                        label="Buffer distance"
                        size="small"
                        type="number"
                        step="100"
                        value=${this.distanceMeters}
                        ?disabled=${this.busy}
                        @sl-change=${this.handleDistanceChange}
                    >
                        <span slot="suffix">m</span>
                    </sl-input>
                </div>

                <sl-input
                    label="Segments per quarter circle"
                    size="small"
                    type="number"
                    min="4"
                    max="64"
                    step="4"
                    value=${this.segments}
                    ?disabled=${this.busy}
                    @sl-change=${this.handleSegmentsChange}
                ></sl-input>

                <sl-input
                    label="Output layer name"
                    size="small"
                    .value=${this.outputName}
                    ?disabled=${this.busy}
                    @sl-change=${this.handleOutputNameChange}
                ></sl-input>

                ${this.lastOutputLayerId?i`
                    <sl-checkbox
                        size="small"
                        ?checked=${this.overwrite}
                        ?disabled=${this.busy}
                        @sl-change=${this.handleOverwriteChange}
                    >Replace previous buffer output</sl-checkbox>
                `:e}

                ${this.error?i`
                    <sl-alert variant="danger" open>
                        <sl-icon slot="icon" name="exclamation-octagon"></sl-icon>
                        ${this.error}
                    </sl-alert>
                `:e}

                <div class="actions">
                    ${this.busy?i`
                        <div class="status">
                            <sl-spinner></sl-spinner>
                            Computing buffer…
                        </div>
                    `:e}
                    <sl-button
                        size="small"
                        variant="primary"
                        ?disabled=${!t||this.busy}
                        @click=${this.handleRun}
                    >
                        <sl-icon slot="prefix" src="${o}"></sl-icon>
                        Buffer
                    </sl-button>
                </div>

            </div>
        `}};s([n()],p.prototype,`availableLayers`,void 0),s([n()],p.prototype,`selectedLayerId`,void 0),s([n()],p.prototype,`availableSourceLayers`,void 0),s([n()],p.prototype,`selectedSourceLayer`,void 0),s([n()],p.prototype,`distanceMeters`,void 0),s([n()],p.prototype,`segments`,void 0),s([n()],p.prototype,`outputName`,void 0),s([n()],p.prototype,`overwrite`,void 0),s([n()],p.prototype,`busy`,void 0),s([n()],p.prototype,`error`,void 0),s([n()],p.prototype,`lastOutputLayerId`,void 0),p=s([t(`webmapx-buffer-tool`)],p);export{p as WebmapxBufferTool};