import"./vendor-shoelace-CCmdcRIF.js";import{h as e,p as t,v as n,x as r,y as i}from"./vendor-lit-DP8NDNGT.js";import{r as a,t as o}from"./decorate-O6vL4zQK.js";import{t as s}from"./webmapx-base-tool-Rw1OOGfN.js";import{t as c}from"./control-surface-styles-WAx9bflO.js";import{t as l}from"./form-label-styles-CUvG5W-2.js";import{t as u}from"./announce-BnK8C14J.js";import{n as d,t as f}from"./add-layer-icon-BSjJ7Zon.js";var p,m=class extends s{static{p=this}constructor(...e){super(...e),this.active=!1,this.mapElement=null,this.searchInputName=`wmx-7f3a9c1`,this.query=``,this.results=null,this.searching=!1,this.selectedIndex=-1,this.previewSourceId=`search-preview`,this.previewLayerIds=[`search-preview-fill`,`search-preview-line`,`search-preview-point`],this.previewLayersAdded=!1,this.persistedMap=new Map,this.cfg={endpoint:`https://nominatim.openstreetmap.org/search`,params:{format:`geojson`,polygon_geojson:1,addressdetails:1},maxResults:15,defaultZoom:14,marker:!1,persistOnSelect:!1,provider:`nominatim`,attribution:``},this.searchIcon=i`
    <svg viewBox="0 0 22 22" aria-hidden="true">
      <circle cx="9" cy="9" r="6" fill="none" stroke="currentColor" stroke-width="2"/>
      <line x1="13.2" y1="13.2" x2="19" y2="19" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    </svg>
  `,this.layerToggleIcon=f}randomColorHex(){let e=Math.floor(Math.random()*360)/360,t=50/100,n=(e,t,n)=>(n<0&&(n+=1),n>1&&--n,n<1/6?e+(t-e)*6*n:n<1/2?t:n<2/3?e+(t-e)*(2/3-n)*6:e),r,i,a;{let o=1.2-t*.7,s=2*t-o;r=n(s,o,e+1/3),i=n(s,o,e),a=n(s,o,e-1/3)}let o=Math.round(r*255),s=Math.round(i*255),c=Math.round(a*255),l=e=>e.toString(16).padStart(2,`0`);return`#${l(o)}${l(s)}${l(c)}`}static{this.PROVIDER_DEFAULTS={nominatim:{endpoint:`https://nominatim.openstreetmap.org/search`,params:{format:`geojson`,polygon_geojson:1,addressdetails:1},attribution:`&copy; OpenStreetMap contributors | &copy; Nominatim`},pdok:{endpoint:`https://api.pdok.nl/bzk/locatieserver/search/v3_1/free`,params:{fl:`id,type,weergavenaam,centroide_ll,geometrie_ll`},attribution:`&copy; PDOK Locatieserver, Kadaster`}}}static{this.KNOWN_PROVIDERS=new Set(Object.keys(p.PROVIDER_DEFAULTS))}isKnownProvider(e){return p.KNOWN_PROVIDERS.has(e.toLowerCase())}static{this.styles=[l,c,d,r`
    :host { display: block; width: 100%; pointer-events: auto; }
    :host([hidden]) { display: none !important; }
    .container { width: 100%; max-width: 100%; color: var(--webmapx-search-color, var(--color-text-primary)); box-sizing: border-box; padding: var(--webmapx-tool-padding, 0); }
    .searchbox { display:flex; gap:6px; align-items:center; }
    /* The search field: the same small Shoelace field as every other tool,
       with its own clear button (it acts on the text, not on the search, so it
       lives inside the field rather than as a third control in the row). */
    sl-input.search-field { flex: 1; min-width: 0; }
    button { flex:0 0 auto; }
    .searchbox button { cursor: pointer; }
    /* Same house style as the toolbar's own search button in its resting state
       (a Shoelace default-variant button: neutral border, no fill) — .webmapx-control
       picks up the active [data-style] preset the way every other plain button here does. */
    .go-button svg { width: 1rem; height: 1rem; }
    .results { margin-top:8px; max-height:50%; overflow:auto; }
    .results ul { list-style: none; margin: 0; padding: 0; }
    .result-item { padding:6px; border-bottom:1px solid rgba(0,0,0,0.05); display:flex; align-items:center; gap:8px; }
    .result-item:hover, .result-item[selected] { background: rgba(0,0,0,0.03); }
    .result-select {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: 1px;
      /* The OS-supplied zoom-in cursor renders as a tiny, blurry bitmap on some
         displays — a hand-drawn SVG (white halo + dark line, like a native pointer)
         stays crisp at any DPI instead. Hotspot sits at the lens centre. */
      cursor: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='26' height='26' viewBox='0 0 26 26'%3E%3Cg fill='none' stroke='white' stroke-width='3.4' stroke-linecap='round' stroke-linejoin='round'%3E%3Ccircle cx='11' cy='11' r='6.5'/%3E%3Cline x1='15.8' y1='15.8' x2='23' y2='23'/%3E%3C/g%3E%3Cg fill='none' stroke='black' stroke-width='1.6' stroke-linecap='round' stroke-linejoin='round'%3E%3Ccircle cx='11' cy='11' r='6.5'/%3E%3Cline x1='15.8' y1='15.8' x2='23' y2='23'/%3E%3C/g%3E%3C/svg%3E") 11 11, zoom-in;
      border: 0;
      background: transparent;
      font: inherit;
      color: inherit;
      text-align: left;
      padding: 0;
    }
    .result-title {
      font-size: 12.5px;
      font-weight: 400;
      line-height: 1.3;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .result-title strong { font-weight: 600; }
    /* Subtitle: the result's type/category, one step quieter and smaller than the title. */
    .meta { display: inline-flex; align-items: center; gap: 3px; font-size: 10.5px; line-height: 1.2; color: var(--color-text-muted, #6b7681); }
    /* Same CSS colour as the subtitle text, but a filled shape reads visually heavier
       than thin text glyphs at identical colour (more ink coverage) — opacity brings
       the two back to the same optical weight. */
    .geom-icon { display: inline-flex; flex: none; opacity: 0.75; }
    .geom-icon svg { width: 12px; height: 12px; overflow: visible; }

  `]}onMapAttached(e){super.onMapAttached(e),this.adapter=e,this.mapElement=a(this),this.subscribeToConfig()}onMapDetached(){this.adapter=null,this.mapElement=null,this.unsubscribeFromConfig(),super.onMapDetached()}onConfigReady(e){let t=e?.tools?.search,n=(t?.provider??this.cfg.provider??`nominatim`).toLowerCase(),r=p.PROVIDER_DEFAULTS[n];r?this.cfg={...this.cfg,endpoint:r.endpoint,attribution:r.attribution,...t,provider:n,params:{...r.params,...t?.params??{}}}:t&&(this.cfg={...this.cfg,...t}),this.isKnownProvider(this.cfg.provider)||console.warn(`webmapx-search-tool: unknown provider "${this.cfg.provider}"`)}activate(){this.active=!0,this.hidden=!1,setTimeout(()=>{(this.renderRoot?.querySelector(`sl-input.search-field`))?.focus()},0),this.dispatchEvent(new CustomEvent(`webmapx-search-opened`,{bubbles:!0,composed:!0}))}deactivate(){this.active=!1,this.clearPreview(),this.hidden=!0,this.dispatchEvent(new CustomEvent(`webmapx-search-closed`,{bubbles:!0,composed:!0}))}onStateChanged(e){let t=e.mapLayers??{};for(let[e,n]of this.persistedMap)n.layerId in t?n.seen=!0:n.seen&&(this.persistedMap.delete(e),this.persistedChanged(n.feature,!1))}static{this.NOMINATIM_SCAN_LIMIT=40}static{this.PDOK_SCAN_LIMIT=100}buildSearchUrl(e){let t=new URLSearchParams;if(Object.entries(this.cfg.params||{}).forEach(([e,n])=>t.set(e,String(n))),t.set(`q`,e),this.cfg.provider===`pdok`)t.set(`rows`,String(Math.min(this.cfg.maxResults?Math.max(this.cfg.maxResults,15):p.PDOK_SCAN_LIMIT,p.PDOK_SCAN_LIMIT)));else{t.set(`limit`,String(Math.min(this.cfg.maxResults?Math.max(this.cfg.maxResults,15):p.NOMINATIM_SCAN_LIMIT,p.NOMINATIM_SCAN_LIMIT)));let e=this.getCurrentViewBbox();if(e){let[n,r,i,a]=e;t.set(`viewbox`,`${n},${a},${i},${r}`)}}return`${this.cfg.endpoint}?${t.toString()}`}parseWkt(e){let t=e.match(/^\s*([A-Z]+)\s*\((.*)\)\s*$/s);if(!t)return null;let n=t[1].toUpperCase(),r=t[2],i=e=>{let t=[],n=0,r=0;for(let i=0;i<e.length;i++)e[i]===`(`?n++:e[i]===`)`?n--:e[i]===`,`&&n===0&&(t.push(e.slice(r,i)),r=i+1);return t.push(e.slice(r)),t.map(e=>e.trim())},a=e=>e.trim().replace(/^\(/,``).replace(/\)$/,``),o=e=>{let[t,n]=e.trim().split(/\s+/).map(Number);return[t,n]},s=e=>i(e).map(o),c=e=>i(e).map(e=>s(a(e))),l=e=>i(e).map(e=>c(a(e)));switch(n){case`POINT`:return{type:`Point`,coordinates:o(r)};case`LINESTRING`:return{type:`LineString`,coordinates:s(r)};case`MULTILINESTRING`:return{type:`MultiLineString`,coordinates:i(r).map(e=>s(a(e)))};case`POLYGON`:return{type:`Polygon`,coordinates:c(r)};case`MULTIPOLYGON`:return{type:`MultiPolygon`,coordinates:l(r)};default:return null}}pdokDocToFeature(e){let t=e.geometrie_ll||e.centroide_ll;if(!t)return null;let n=this.parseWkt(t);return n?{type:`Feature`,geometry:n,properties:{...e,display_name:e.weergavenaam}}:null}async fetchResults(e){let t=await fetch(e);if(!t.ok)return console.error(`search failed:`,t.statusText),{type:`FeatureCollection`,features:[]};let n=await t.json();return this.cfg.provider===`pdok`?{type:`FeatureCollection`,features:(n?.response?.docs||[]).map(e=>this.pdokDocToFeature(e)).filter(e=>e!==null)}:n}getCurrentViewBbox(){let e=(this.adapter?.store?.getState()?.mapViewportBounds)?.geometry?.coordinates?.[0];if(!e||e.length===0)return null;let t=1/0,n=1/0,r=-1/0,i=-1/0;for(let[a,o]of e)a<t&&(t=a),a>r&&(r=a),o<n&&(n=o),o>i&&(i=o);return!isFinite(t)||!isFinite(n)||!isFinite(r)||!isFinite(i)?null:[t,n,r,i]}featureKey(e){let t=e.properties||{};return t.osm_type||t.osm_id?`osm:${t.osm_type}:${t.osm_id}`:t.id?`id:${t.id}`:JSON.stringify(e.geometry)}featureRepresentativePoint(e){if(e.geometry?.type===`Point`)return e.geometry.coordinates;let t=this.geometryBbox(e.geometry);return t?[(t[0]+t[2])/2,(t[1]+t[3])/2]:null}featureInBbox(e,t){let n=this.featureRepresentativePoint(e);if(!n)return!1;let[r,i]=n,[a,o,s,c]=t;return r>=a&&r<=s&&i>=o&&i<=c}clearSearch(){this.query=``,this.results=null,this.selectedIndex=-1,this.clearPreview(),this.updateComplete.then(()=>{this.shadowRoot?.querySelector(`sl-input.search-field`)?.focus()})}async doSearch(){let e=this.query.trim();if(!e||e.length<1){this.results=null;return}this.searching=!0;try{let t=(await this.fetchResults(this.buildSearchUrl(e))).features||[],n=e.toLowerCase(),r=this.getCurrentViewBbox(),i=e=>+!this.getFeatureTitle(e).toLowerCase().startsWith(n),a=e=>r&&this.featureInBbox(e,r)?0:1;t=t.map((e,t)=>({f:e,i:t})).sort((e,t)=>i(e.f)-i(t.f)||a(e.f)-a(t.f)||e.i-t.i).map(({f:e})=>e),this.results={type:`FeatureCollection`,features:t},u(this,t.length===0?`No results for ${e}`:`${t.length} ${t.length===1?`result`:`results`} for ${e}`)}catch(t){console.error(`search error`,t),this.results={type:`FeatureCollection`,features:[]},u(this,`Search for ${e} failed`)}finally{this.searching=!1,this.dispatchEvent(new CustomEvent(`webmapx-search-result`,{detail:this.results,bubbles:!0,composed:!0}))}}async handleKey(e){e.key===`Enter`?await this.doSearch():e.key===`ArrowDown`?this.selectedIndex=Math.min((this.results?.features?.length??0)-1,Math.max(0,this.selectedIndex+1)):e.key===`ArrowUp`&&(this.selectedIndex=Math.max(0,this.selectedIndex-1))}getFeatureTitle(e){return(e.properties&&(e.properties.display_name||e.properties.name))??JSON.stringify(e.geometry?.type??``)}renderResultTitle(e){let t=this.getFeatureTitle(e),n=t.indexOf(` `);return n===-1?i`<strong>${t}</strong>`:i`<strong>${t.slice(0,n)}</strong>${t.slice(n)}`}geometryKind(e){return e===`Polygon`||e===`MultiPolygon`?`polygon`:e===`LineString`||e===`MultiLineString`?`line`:`point`}nodeMarker(e,t){return n`
      <rect x="${e-1.9}" y="${t-1.9}" width="3.8" height="3.8" rx="1" fill="currentColor"></rect>
      <rect x="${e-.8}" y="${t-.8}" width="1.6" height="1.6" rx="0.4" fill="var(--color-background, #fff)"></rect>
    `}geometryKindIcon(e){if(e===`polygon`){let e=[[2.3,2],[12,3],[11.3,12.2],[2,10.6]];return i`<svg viewBox="0 0 14 14" aria-hidden="true">
        <polygon points="${e.map(([e,t])=>`${e},${t}`).join(` `)}" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/>
        ${e.map(([e,t])=>this.nodeMarker(e,t))}
      </svg>`}return e===`line`?i`<svg viewBox="0 0 14 14" aria-hidden="true">
        <line x1="2" y1="11.5" x2="12" y2="2.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
        ${this.nodeMarker(2,11.5)}
        ${this.nodeMarker(12,2.5)}
      </svg>`:i`<svg viewBox="0 0 14 14" aria-hidden="true"><circle cx="7" cy="7" r="4.5" fill="currentColor"/></svg>`}geometryBbox(e){if(!e)return null;let t=1/0,n=1/0,r=-1/0,i=-1/0,a=e=>{if(typeof e[0]==`number`){let[a,o]=e;a<t&&(t=a),a>r&&(r=a),o<n&&(n=o),o>i&&(i=o)}else for(let t of e)a(t)};return a(e.coordinates),!isFinite(t)||!isFinite(n)||!isFinite(r)||!isFinite(i)?null:[t,n,r,i]}centerFeature(e){let t=null,n=e.bbox??(e.geometry?.type===`Point`?void 0:this.geometryBbox(e.geometry)??void 0);if(n&&n.length===4&&this.adapter){t=[(n[0]+n[2])/2,(n[1]+n[3])/2];try{if(typeof this.adapter.fitBounds==`function`){this.adapter.fitBounds(n);return}}catch(e){console.warn(`adapter fitBounds failed`,e)}}if(e.geometry?.type===`Point`){let n=e.geometry.coordinates;t=[n[0],n[1]]}let r=e.properties&&(e.properties.zoom||this.cfg.defaultZoom)||this.cfg.defaultZoom;if(t&&this.adapter)try{this.adapter.setViewport(t,r)}catch(e){console.warn(`setViewport failed`,e)}}handleSelect(e){this.centerFeature(e);let t=e.bbox??null;this.dispatchEvent(new CustomEvent(`webmapx-search-selected`,{detail:{feature:e,bbox:t,center:null},bubbles:!0,composed:!0}))}persistedChanged(e,t){this.dispatchEvent(new CustomEvent(`webmapx-search-persist-change`,{detail:{feature:e,persisted:t},bubbles:!0,composed:!0})),this.requestUpdate()}persistKeyFor(e){let t=e.properties??{};if(t.osm_id||t.osm_type)return`search-persist-osm-${t.osm_type??``}-${t.osm_id??``}`;if(t.place_id)return`search-persist-place-${t.place_id}`;let n=this.firstCoordinate(e.geometry),r=n?`${n[0].toFixed(5)},${n[1].toFixed(5)}`:`no-geom`;return`search-persist-${this.getFeatureTitle(e)}-${r}`}firstCoordinate(e){if(!e||e.type===`GeometryCollection`)return null;let t=e.coordinates;for(;Array.isArray(t)&&Array.isArray(t[0]);)t=t[0];return Array.isArray(t)&&typeof t[0]==`number`&&typeof t[1]==`number`?[t[0],t[1]]:null}isPersisted(e){return this.persistedMap.has(this.persistKeyFor(e))}addPersistedFeature(e){if(!this.adapter||!this.mapElement)return;let t=this.mapElement,n=this.persistKeyFor(e),r=n,i={type:`FeatureCollection`,features:[e]};try{let a=this.randomColorHex(),o={type:`geojson`,data:i};this.cfg.attribution&&(o.attribution=this.cfg.attribution);let s={[r]:o},c=e.geometry?.type,l=this.geometryKind(c),u=`${r}-fill`,d=`${r}-line`,f=`${r}-point`,p=this.getFeatureTitle(e),m=l===`polygon`?u:l===`line`?d:f;l===`polygon`?t.addLayerRequest({id:u,type:`style`,sources:s,layers:[{id:`fill`,type:`fill`,source:r,paint:{"fill-color":a,"fill-opacity":.25}},{id:`line`,type:`line`,source:r,paint:{"line-color":a,"line-width":2}}],metadata:{label:p,hideFromLegend:!1}}):l===`line`?t.addLayerRequest({id:d,type:`line`,source:r,sources:s,metadata:{label:p,hideFromLegend:!1},paint:{"line-color":a,"line-width":3}}):t.addLayerRequest({id:f,type:`circle`,source:r,sources:s,metadata:{label:p,hideFromLegend:!1},paint:{"circle-color":a,"circle-radius":6}}),this.persistedMap.set(n,{sourceId:r,color:a,layerId:m,feature:e,seen:!1})}catch(e){console.error(`Failed to persist feature`,e)}}removePersistedFeature(e){if(!this.adapter||!this.mapElement)return;let t=this.adapter,n=this.mapElement,r=this.persistKeyFor(e),i=this.persistedMap.get(r);if(!i)return;let a=i.sourceId;try{try{n.removeInlineLayer(`${a}-fill`)}catch{}try{n.removeInlineLayer(`${a}-line`)}catch{}try{n.removeInlineLayer(`${a}-point`)}catch{}try{t.removeSource(a)}catch{}}catch(e){console.warn(`Error removing persisted feature`,e)}this.persistedMap.delete(r)}async showPreviewLayers(e,t){if(!this.adapter||!this.mapElement)return;let n=this.adapter,r=this.mapElement;for(let e of this.previewLayerIds)n.hasLayer(e)&&r.removeInlineLayer(e);try{let t=n.getSource(this.previewSourceId);t&&typeof t.setData==`function`?t.setData(e):n.addSource(this.previewSourceId,{type:`geojson`,data:e})}catch(e){console.warn(`preview source update failed`,e)}try{await r.addLayerRequest({id:this.previewLayerIds[0],type:`fill`,source:this.previewSourceId,filter:[`in`,`$type`,`Polygon`],metadata:{hideFromLegend:!0,label:`Search preview fill`},paint:{"fill-color":t?.fill??`#f1c40f`,"fill-opacity":.25}}),await r.addLayerRequest({id:this.previewLayerIds[1],type:`line`,source:this.previewSourceId,filter:[`in`,`$type`,`LineString`,`Polygon`],metadata:{hideFromLegend:!0,label:`Search preview line`},paint:{"line-color":t?.line??`#f39c12`,"line-width":3}}),await r.addLayerRequest({id:this.previewLayerIds[2],type:`circle`,source:this.previewSourceId,filter:[`==`,`$type`,`Point`],metadata:{hideFromLegend:!0,label:`Search preview point`},paint:{"circle-color":t?.point??`#e67e22`,"circle-radius":6}}),this.previewLayersAdded=!0}catch(e){console.warn(`preview layers update failed`,e)}}darkenHex(e,t=.15){let n=e.replace(`#`,``);n.length===3&&(n=n.split(``).map(e=>e+e).join(``));let r=parseInt(n.substring(0,2),16),i=parseInt(n.substring(2,4),16),a=parseInt(n.substring(4,6),16),o=e=>Math.max(0,Math.min(255,Math.round(e*(1-t)))),s=o(r),c=o(i),l=o(a),u=e=>e.toString(16).padStart(2,`0`);return`#${u(s)}${u(c)}${u(l)}`}clearPreview(){if(!this.adapter||!this.mapElement)return;let e=this.adapter,t=this.mapElement;for(let n of this.previewLayerIds)e.hasLayer(n)&&t.removeInlineLayer(n);try{e.removeSource(this.previewSourceId)}catch{}this.previewLayersAdded=!1}showPreviewForFeature(e){let t={type:`FeatureCollection`,features:[e]},n=this.persistedMap.get(e),r=n?.color?(()=>{let e=this.darkenHex(n.color,.18);return{fill:e,line:e,point:e}})():void 0;this.showPreviewLayers(t,r)}onResultLayerToggle(e,t){try{t.stopPropagation()}catch{}this.isPersisted(e)?(this.removePersistedFeature(e),this.persistedChanged(e,!1)):(this.clearPreview(),this.addPersistedFeature(e),this.persistedChanged(e,!0)),this.requestUpdate()}render(){return i`
      <div class="container tool-content">
        <div class="searchbox">
          <!-- The field is the tool, so its label is for screen readers only. -->
          <sl-input
            class="search-field label-hidden"
            size="small"
            clearable
            label="Search"
            name="${this.searchInputName}"
            autocomplete="off"
            autocorrect="off"
            autocapitalize="off"
            spellcheck="false"
            placeholder="Search cities, rivers, mountains…"
            .value="${this.query}"
            @sl-input="${e=>{this.query=e.target.value}}"
            @sl-clear="${()=>this.clearSearch()}"
            @keyup="${e=>this.handleKey(e)}"
          ></sl-input>
          <sl-button size="small" class="go-button icon-only" title="Search" @click="${()=>this.doSearch()}">${this.searchIcon}<span class="visually-hidden">Search</span></sl-button>
        </div>

        <div class="results">
          ${this.searching?i`<div>Searching...</div>`:``}
          ${this.results?i`
            <div style="display:flex; flex-direction:column; gap:2px; padding:2px 6px; font-size:11px; color:var(--color-text-secondary); border-bottom:1px solid var(--color-border);">
              <span>Hover to preview | Click to zoom</span>
              <span>Add as map layer with +, remove with ✓</span>
            </div>
            <ul>
              ${(this.results.features||[]).map((e,t)=>i`
                <li class="result-item" ?selected=${t===this.selectedIndex}
                    @mouseenter=${()=>this.showPreviewForFeature(e)}
                    @mouseleave=${()=>this.clearPreview()}>
                  <button type="button" class="result-select" @click=${()=>this.handleSelect(e)}
                          @focus=${()=>this.showPreviewForFeature(e)}
                          @blur=${()=>this.clearPreview()}>
                    <span class="result-title">${this.renderResultTitle(e)}</span>
                    ${(()=>{let t=e.properties&&(e.properties.type||e.properties.category)||``;if(!t)return``;let n=this.geometryKind(e.geometry?.type);return i`<span class="meta"><span class="geom-icon">${this.geometryKindIcon(n)}</span>${t}</span>`})()}
                  </button>
                  <button
                    type="button"
                    class="layer-toggle"
                    aria-pressed=${this.isPersisted(e)?`true`:`false`}
                    data-added=${this.isPersisted(e)?`true`:`false`}
                    aria-label="Add as map layer"
                    title=${this.isPersisted(e)?`Remove from map`:`Add as map layer`}
                    @click=${t=>this.onResultLayerToggle(e,t)}>
                    ${this.layerToggleIcon}
                  </button>
                </li>
              `)}
            </ul>
          `:i``}
        </div>
      </div>
    `}};o([t()],m.prototype,`query`,void 0),o([t()],m.prototype,`results`,void 0),o([t()],m.prototype,`searching`,void 0),o([t()],m.prototype,`selectedIndex`,void 0),m=p=o([e(`webmapx-search-tool`)],m);export{m as WebmapxSearchTool};