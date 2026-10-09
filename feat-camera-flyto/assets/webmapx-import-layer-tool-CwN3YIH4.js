import"./vendor-shoelace-BiEeFWil.js";import{h as e,p as t,x as n,y as r}from"./vendor-lit-DP8NDNGT.js";import{tt as i}from"./webmapx-shared-DEt6PjHs.js";import{r as a,t as o}from"./decorate-BHbTgTzK.js";import{t as s}from"./webmapx-base-tool-CQ4alh3B.js";import{t as c}from"./form-label-styles-CUvG5W-2.js";import{t as l}from"./section-heading-styles-BsMEM1VW.js";var u=class extends s{constructor(...e){super(...e),this.active=!1,this.mapElement=null,this.url=``,this.discovering=!1,this.results=[],this.selected=new Set,this.error=null,this.filterText=``,this.catalog=[],this.fileDropActive=!1,this.fileImporting=!1,this.discoverySeq=0}static{this.styles=[l,c,n`
    :host { display: block; width: 100%; pointer-events: auto; }
    :host([hidden]) { display: none !important; }
    .container { width: 100%; color: var(--color-text-primary); box-sizing: border-box; padding: var(--webmapx-tool-padding, 0); }
    .section-title { margin: 0 0 6px; }
    .urlbox { display:flex; gap:6px; align-items:center; }
    sl-input.url { flex:1; min-width:0; }
    .error { color: var(--sl-color-danger-600, #c0392b); font-size: 12px; margin-top: 6px; }
    .filter { display:block; margin-top:8px; }
    .results { margin-top:8px; max-height:50%; overflow:auto; }
    .results ul { list-style: none; margin: 0; padding: 0; }
    .result-item { padding:6px; border-bottom:1px solid rgba(0,0,0,0.05); display:flex; align-items:center; gap:8px; }
    .meta { font-size: 11px; color: var(--color-text-secondary); }
    .actions { margin: 8px 0; display:flex; justify-content:flex-end; gap:6px; }
    .file-row { display: flex; gap: 6px; align-items: center; }
    .drop-zone {
      border: 2px dashed var(--color-border, #d5dce3);
      border-radius: var(--sl-border-radius-medium);
      padding: 16px 8px;
      text-align: center;
      font-size: 0.8rem;
      color: var(--color-text-secondary);
      cursor: pointer;
      transition: border-color var(--webmapx-motion-fast, 120ms), background var(--webmapx-motion-fast, 120ms);
      margin-top: 6px;
    }
    .drop-zone:hover, .drop-zone.active {
      border-color: var(--sl-color-primary-500);
      background: var(--sl-color-primary-50);
      color: var(--sl-color-primary-700);
    }
    input[type="file"] { display: none; }
  `]}onMapAttached(e){super.onMapAttached(e),this.adapter=e,this.mapElement=a(this)}onMapDetached(){this.adapter=null,this.mapElement=null,super.onMapDetached()}onConfigReady(e){}onStateChanged(e){}activate(){this.active=!0,this.hidden=!1,setTimeout(()=>{(this.renderRoot?.querySelector(`sl-input.url`))?.focus()},0)}deactivate(){this.active=!1,this.hidden=!0}async discoverUrl(e){let t=++this.discoverySeq;this.discovering=!0,this.error=null,this.results=[],this.catalog=[],this.selected=new Set,this.filterText=``;try{let n=await i(e);if(t!==this.discoverySeq)return;this.results=n.layers,this.catalog=n.catalog??[],this.selected=new Set,n.layers.length===0&&this.catalog.length===0&&(this.error=`No services discovered at this URL.`)}catch(e){if(t!==this.discoverySeq)return;console.error(`layer discovery failed`,e),this.error=e instanceof Error?e.message:`Discovery failed`}finally{t===this.discoverySeq&&(this.discovering=!1)}}handleDiscover(){let e=(this.renderRoot?.querySelector(`sl-input.url`)?.value??this.url).trim();this.url=e,e&&this.discoverUrl(e)}openCatalogEntry(e){this.discoverUrl(e.url)}get filteredResults(){let e=this.filterText.trim().toLowerCase();return e?this.results.filter(t=>{let n=t.source;return[t.title,t.abstract,t.layer.id,n.data,n.tiles,n.url].flat().some(t=>typeof t==`string`&&t.toLowerCase().includes(e))}):this.results}toggleSelected(e,t){let n=t,r=typeof n?.detail?.checked==`boolean`?n.detail.checked:!!t.target?.checked,i=new Set(this.selected);r?i.add(e):i.delete(e),this.selected=i}handleAdd(){if(!this.adapter||!this.mapElement||this.selected.size===0)return;let e=Array.from(this.selected);for(let{source:t,layer:n}of e)try{this.mapElement.addLayerRequest({...n,sources:{[t.id]:t}})}catch(e){console.error(`Failed to add discovered layer`,n.id,e)}this.dispatchEvent(new CustomEvent(`webmapx-layers-found`,{detail:{url:this.url.trim(),layers:e},bubbles:!0,composed:!0})),this.results=[],this.selected=new Set}async handleFiles(e){if(!(!this.mapElement||e.length===0)){this.fileImporting=!0;try{await this.mapElement.addFilesAsLayers(e)}finally{this.fileImporting=!1}}}handleFileInput(e){let t=e.target,n=Array.from(t.files??[]);t.value=``,this.handleFiles(n)}handleDropZoneDrop(e){e.preventDefault(),e.stopPropagation(),this.fileDropActive=!1;let t=Array.from(e.dataTransfer?.files??[]);this.handleFiles(t)}handleDropZoneDragOver(e){e.dataTransfer?.types.includes(`Files`)&&(e.preventDefault(),e.stopPropagation(),e.dataTransfer.dropEffect=`copy`,this.fileDropActive=!0)}render(){return r`
      <div class="container tool-content">
        <section class="panel-section">
        <div class="section-title section-heading">From URL</div>
        <div class="urlbox">
          <!-- Named by the "From URL" heading above, so its label is for screen readers only. -->
          <sl-input
            class="url label-hidden"
            size="small"
            label="Service or tile URL"
            placeholder="Paste a service or tile URL"
            autocomplete="off"
            autocorrect="off"
            autocapitalize="off"
            spellcheck="false"
            data-lpignore="true"
            data-1p-ignore
            .value="${this.url}"
            @sl-input="${e=>{this.url=e.target.value}}"
            @keyup="${e=>{e.key===`Enter`&&this.handleDiscover()}}"
          ></sl-input>
          <sl-button size="small" ?loading=${this.discovering} ?disabled=${this.discovering} @click="${()=>this.handleDiscover()}">Discover</sl-button>
        </div>

        ${this.error?r`<div class="error">${this.error}</div>`:``}

        ${this.catalog.length===0?``:r`
          <div class="results">
            <ul>
              ${this.catalog.map(e=>r`
                <li class="result-item">
                  <button type="button" @click="${()=>this.openCatalogEntry(e)}"
                          style="flex:1; min-width:0; cursor:pointer; border:0; background:transparent; font:inherit; color:inherit; text-align:left; padding:0;">
                    <div style="white-space:normal; word-break:break-word;" title="${e.name}">${e.kind===`folder`?`📁`:`🗺`} ${e.name}</div>
                    ${e.type?r`<div class="meta">${e.type}</div>`:``}
                  </button>
                </li>
              `)}
            </ul>
          </div>
        `}

        ${this.results.length===0?``:r`
          <sl-input
            class="filter label-hidden"
            size="small"
            label="Filter layers"
            placeholder="Filter layers..."
            .value="${this.filterText}"
            @sl-input="${e=>{this.filterText=e.target.value}}"
          ></sl-input>
          <div class="actions">
            <sl-button size="small" variant="primary" ?disabled=${this.selected.size===0} @click="${()=>this.handleAdd()}">
              Add selected
            </sl-button>
          </div>
          <div class="results">
            <ul>
              ${this.filteredResults.map(e=>r`
                <li class="result-item">
                  <sl-checkbox
                    .checked=${this.selected.has(e)}
                    @sl-change=${t=>this.toggleSelected(e,t)}
                  ></sl-checkbox>
                  <div style="flex:1; min-width:0;">
                    <div style="white-space:normal; word-break:break-word;" title="${e.title}">${e.title}</div>
                    <div class="meta">${e.serviceType}</div>
                    ${e.abstract?r`<div class="meta">${e.abstract}</div>`:``}
                  </div>
                </li>
              `)}
            </ul>
          </div>
        `}
        </section>

        <section class="panel-section">
        <div class="section-title section-heading">From file</div>
        <div class="file-row">
          <sl-button size="small" ?loading=${this.fileImporting} ?disabled=${this.fileImporting}
            @click=${()=>(this.renderRoot?.querySelector(`input[type="file"]`))?.click()}>
            <sl-icon slot="prefix" name="folder2-open"></sl-icon>
            Open file…
          </sl-button>
        </div>
        <input type="file" multiple accept=".geojson,.json,.zip,.topojson,.gpx,.kml,.kmz,.csv"
          @change=${this.handleFileInput} />
        <div
          class="drop-zone ${this.fileDropActive?`active`:``}"
          @dragover=${this.handleDropZoneDragOver}
          @dragleave=${()=>{this.fileDropActive=!1}}
          @drop=${this.handleDropZoneDrop}
          @click=${()=>(this.renderRoot?.querySelector(`input[type="file"]`))?.click()}
        >
          <sl-icon name="file-earmark-arrow-up"></sl-icon>
          Drop files here or click to browse
        </div>
        </section>
      </div>
    `}};o([t()],u.prototype,`url`,void 0),o([t()],u.prototype,`discovering`,void 0),o([t()],u.prototype,`results`,void 0),o([t()],u.prototype,`selected`,void 0),o([t()],u.prototype,`error`,void 0),o([t()],u.prototype,`filterText`,void 0),o([t()],u.prototype,`catalog`,void 0),o([t()],u.prototype,`fileDropActive`,void 0),o([t()],u.prototype,`fileImporting`,void 0),u=o([e(`webmapx-import-layer-tool`)],u);export{u as WebmapxImportLayerTool};