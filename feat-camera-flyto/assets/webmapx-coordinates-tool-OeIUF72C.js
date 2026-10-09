const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["./lib-CUh5lubX.js","./openlayers-adapter-DaDAdewE.js","./leaflet-adapter-C4zm0zGG.js","./rolldown-runtime-Cyuzqnbw.js","./cesium-adapter-DjKA0OGN.js","./leaflet-adapter-vh-t_kPv.css","./maplibre-adapter-Dv1MSexl.js","./maplibre-adapter-B2k4QVOw.css","./openlayers-adapter-c_1sG1-7.css","./epsg-definitions-DoJhXxaG.js","./webmapx-shared-DEt6PjHs.js","./vendor-allmaps-foundation-BN2vGw2q.js","./vendor-lit-DP8NDNGT.js"])))=>i.map(i=>d[i]);
import{_ as e,d as t,h as n,p as r,x as i,y as a}from"./vendor-lit-DP8NDNGT.js";import{z as o}from"./webmapx-shared-DEt6PjHs.js";import{r as s}from"./leaflet-adapter-C4zm0zGG.js";import{t as c}from"./decorate-BHbTgTzK.js";import{t as l}from"./webmapx-base-tool-CQ4alh3B.js";var u=1/1e3,d={en:{N:`N`,E:`E`,S:`S`,W:`W`},nl:{N:`N`,E:`O`,S:`Z`,W:`W`},fr:{N:`N`,E:`E`,S:`S`,W:`O`},de:{N:`N`,E:`O`,S:`S`,W:`W`},es:{N:`N`,E:`E`,S:`S`,W:`O`}},f=null,p=null,m=class extends l{constructor(...e){super(...e),this.cursorCoords=null,this.pinnedCoords=null,this.resolution=null,this.pinnedResolution=null,this.mapCenter=null,this.showPopup=!1,this.popupDirection=`up`,this.showCursorFormatPopup=!1,this.cursorFormatPopupDirection=`up`,this.selectedCursorFormat=`geographic-en`,this.localCRS=[],this.loadingCRS=!1,this.cursorFormatLocalCRS=[],this.loadingCursorFormatCRS=!1,this.handleOutsideClick=e=>{if(this.showPopup||this.showCursorFormatPopup){let t=e.target;this.shadowRoot?.contains(t)||(this.showPopup=!1,this.showCursorFormatPopup=!1)}}}static{this.styles=i`
    :host {
      display: inline-flex;
      pointer-events: auto;
      font-size: var(--webmapx-coordinates-font-size, var(--font-size-small));
      position: relative;
    }

    .coordinates-shell {
      display: inline-flex;
      flex-direction: column;
      border: var(--webmapx-coordinates-border, 1px solid var(--color-border));
      background: var(--webmapx-coordinates-bg, var(--color-background-secondary));
      color: var(--webmapx-coordinates-color, var(--color-text-primary));
      padding: var(--compact-padding-vertical) var(--compact-padding-horizontal);
      font-variant-numeric: tabular-nums;
      line-height: 1.3;
      min-width: 150px;
      pointer-events: auto;
    }

    .value-line {
      display: flex;
      align-items: center;
      gap: var(--compact-gap);
      white-space: nowrap;
    }

    .value-line + .value-line {
      border-top: 1px solid var(--color-border-light);
      padding-top: var(--compact-padding-vertical);
      margin-top: var(--compact-padding-vertical);
    }

    .click-row, .cursor-row {
      position: relative;
      width: 100%;
      padding: 0;
      border: 0;
      background: transparent;
      font: inherit;
      color: inherit;
      text-align: left;
      cursor: pointer;
      transition: background-color var(--webmapx-motion-fast, 120ms) ease;
      pointer-events: auto;
    }

    .click-row:hover, .cursor-row:hover {
      background-color: var(--color-background-hover, rgba(0, 0, 0, 0.05));
    }

    .format-line.active-format {
      background-color: var(--color-background-hover, rgba(0, 0, 0, 0.05));
    }

    .format-line.active-format .format-label::after {
      content: ' ✓';
      color: var(--color-primary, #2b6c8f);
    }

    .value {
      font-weight: 600;
      letter-spacing: 0.01em;
    }

    .click-label {
      text-transform: uppercase;
      letter-spacing: 0.08em;
      font-weight: 600;
      color: var(--color-text-secondary);
      font-size: 0.75em;
    }

    .popup-container {
      position: absolute;
      left: 0;
      right: 0;
      background: var(--color-background, #fff);
      border: 1px solid var(--color-border);
      box-shadow: var(--webmapx-shadow-md, 0 4px 12px rgba(0, 0, 0, 0.15));
      padding: 8px;
      min-width: 250px;
      max-width: 400px;
      pointer-events: auto;
    }

    .popup-container.direction-up {
      bottom: 100%;
      margin-bottom: 4px;
    }

    .popup-container.direction-down {
      top: 100%;
      margin-top: 4px;
    }

    .format-line {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 6px 8px;
      gap: 12px;
      transition: background-color var(--webmapx-motion-fast, 120ms) ease;
    }

    .format-line:hover {
      background-color: var(--color-background-hover, rgba(0, 0, 0, 0.05));
    }

    .format-line + .format-line {
      border-top: 1px solid var(--color-border-light, #e2e7ec);
    }

    .format-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 2px;
      min-width: 0;
    }

    .format-label {
      font-size: 0.75em;
      color: var(--color-text-secondary, #5a6773);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      font-weight: 600;
    }

    .format-value {
      font-family: monospace;
      font-size: 0.9em;
      color: var(--color-text-primary, #16202a);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .copy-button {
      flex-shrink: 0;
      padding: 4px 8px;
      background: transparent;
      border: 1px solid var(--color-border, #d5dce3);
      border-radius: var(--webmapx-radius-xs, 3px);
      cursor: pointer;
      color: var(--color-text-primary, #16202a);
      font-size: 0.85em;
      transition: all var(--webmapx-motion-fast, 120ms) ease;
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .copy-button:hover {
      background: var(--color-primary, #2b6c8f);
      color: white;
      border-color: var(--color-primary, #2b6c8f);
    }

    .copy-button:active {
      transform: scale(0.95);
    }

    .copy-button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .copy-icon {
      width: 14px;
      height: 14px;
    }

    .loading-indicator {
      padding: 8px;
      text-align: center;
      color: var(--color-text-secondary, #5a6773);
      font-size: 0.85em;
      font-style: italic;
    }

    .crs-section-header {
      padding: 8px;
      font-size: 0.75em;
      color: var(--color-text-secondary, #5a6773);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      font-weight: 600;
      background: var(--color-background-hover, rgba(0, 0, 0, 0.02));
      margin: 4px 0;
    }

    .accuracy-note {
      font-size: 0.7em;
      color: var(--color-text-secondary, #5a6773);
      font-style: italic;
      margin-top: 2px;
    }
  `}onStateChanged(e){this.cursorCoords=e.pointerCoordinates;let t=this.pinnedCoords;this.pinnedCoords=e.lastClickedCoordinates,this.resolution=e.pointerResolution,this.pinnedResolution=e.lastClickedResolution,this.mapCenter=e.mapCenter,this.showPopup&&this.pinnedCoords&&this.pinnedCoords!==t&&this.fetchLocalCRS(this.pinnedCoords)}formatPair(e,t){return e?this.formatWithMode(e,t,this.selectedCursorFormat):`—`}formatWithMode(e,t,n){if(n===`lonlat`)return this.formatLonLat(e,t);if(n===`latlon`)return this.formatLatLon(e,t);if(n===`geographic-local`)return this.formatGeographic(e,t,this.getBrowserLanguage());if(n.startsWith(`crs:`)){let t=n.slice(4);return this.transformCoordinatesClientSide(e,t)}let[r,i]=e;return`${this.formatCoordinate(i,`lat`,t,`en`)}, ${this.formatCoordinate(r,`lng`,t,`en`)}`}renderCursorRow(){return a`
      <button type="button" class="value-line cursor-row" aria-label="Cursor coordinate format"
        aria-expanded=${this.showCursorFormatPopup} @click=${this.handleCursorRowClick}>
        <span class="value">${this.formatPair(this.cursorCoords,this.resolution)}</span>
      </button>
      ${this.renderCursorFormatPopup()}
    `}renderCursorFormatPopup(){if(!this.showCursorFormatPopup)return e;let t=this.cursorCoords??this.mapCenter,n=this.cursorCoords?this.resolution:null,r=(t,n,r,i=!1)=>a`
      <button
        type="button"
        class="format-line ${this.selectedCursorFormat===t?`active-format`:``}"
        ?disabled=${i}
        aria-pressed=${this.selectedCursorFormat===t}
        @click=${i?e:e=>{e.stopPropagation(),this.selectedCursorFormat=t,this.showCursorFormatPopup=!1}}
        style="${i?`opacity:0.5;cursor:default`:`cursor:pointer`};width:100%;border:0;background:transparent;font:inherit;color:inherit;text-align:left"
      >
        <div class="format-content">
          <div class="format-label">${n}</div>
          <div class="format-value">${r}</div>
        </div>
      </button>
    `;return a`
      <div class="popup-container direction-${this.cursorFormatPopupDirection}" @click=${e=>e.stopPropagation()}>
        ${t?a`
          ${r(`geographic-en`,`Geographic (English)`,this.formatGeographic(t,n,`en`))}
          ${r(`geographic-local`,`Geographic (${this.getLocalFormatLabel()})`,this.formatGeographic(t,n,this.getBrowserLanguage()))}
          ${r(`lonlat`,`Lon, Lat`,this.formatLonLat(t,n))}
          ${r(`latlon`,`Lat, Lon`,this.formatLatLon(t,n))}
        `:e}

        ${this.loadingCursorFormatCRS?a`<div class="loading-indicator">Loading local coordinate systems...</div>`:e}

        ${this.cursorFormatLocalCRS.length>0&&t?a`
          <div class="crs-section-header">Local Coordinate Systems</div>
          ${this.cursorFormatLocalCRS.map(e=>r(`crs:${e.code}`,`${e.name} (${e.code})`,t?this.transformCoordinatesClientSide(t,e.code)??`…`:`…`))}
        `:e}
      </div>
    `}renderClickRow(){return this.pinnedCoords?a`
      <button type="button" class="value-line click-row" aria-label="Clicked coordinate"
        aria-expanded=${this.showPopup} @click=${this.handleClickRowClick}>
        <span class="click-label">Click</span>
        <span class="value">${this.formatPair(this.pinnedCoords,this.pinnedResolution)}</span>
      </button>
      ${this.renderPopup()}
    `:e}renderPopup(){return!this.showPopup||!this.pinnedCoords?e:a`
      <div class="popup-container direction-${this.popupDirection}" @click=${e=>e.stopPropagation()}>
        <div class="format-line">
          <div class="format-content">
            <div class="format-label">Lon, Lat</div>
            <div class="format-value">${this.formatLonLat(this.pinnedCoords,this.pinnedResolution)}</div>
          </div>
          <button 
            class="copy-button" 
            @click=${e=>this.copyToClipboard(this.formatLonLat(this.pinnedCoords,this.pinnedResolution),e)}
            title="Copy to clipboard"
          >
            <svg class="copy-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
          </button>
        </div>
        
        <div class="format-line">
          <div class="format-content">
            <div class="format-label">Lat, Lon</div>
            <div class="format-value">${this.formatLatLon(this.pinnedCoords,this.pinnedResolution)}</div>
          </div>
          <button 
            class="copy-button" 
            @click=${e=>this.copyToClipboard(this.formatLatLon(this.pinnedCoords,this.pinnedResolution),e)}
            title="Copy to clipboard"
          >
            <svg class="copy-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
          </button>
        </div>
        
        <div class="format-line">
          <div class="format-content">
            <div class="format-label">Geographic (English)</div>
            <div class="format-value">${this.formatGeographic(this.pinnedCoords,this.pinnedResolution,`en`)}</div>
          </div>
          <button 
            class="copy-button" 
            @click=${e=>this.copyToClipboard(this.formatGeographic(this.pinnedCoords,this.pinnedResolution,`en`),e)}
            title="Copy to clipboard"
          >
            <svg class="copy-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
          </button>
        </div>
        
        ${this.shouldShowLocalizedFormat()?a`
          <div class="format-line">
            <div class="format-content">
              <div class="format-label">Geographic (${this.getLanguageName(this.getBrowserLanguage())})</div>
              <div class="format-value">${this.formatGeographic(this.pinnedCoords,this.pinnedResolution,this.getBrowserLanguage())}</div>
            </div>
            <button 
              class="copy-button" 
              @click=${e=>this.copyToClipboard(this.formatGeographic(this.pinnedCoords,this.pinnedResolution,this.getBrowserLanguage()),e)}
              title="Copy to clipboard"
            >
              <svg class="copy-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
              </svg>
            </button>
          </div>
        `:e}

        ${this.loadingCRS?a`
          <div class="loading-indicator">Loading local coordinate systems...</div>
        `:e}

        ${this.localCRS.length>0?a`
          <div class="crs-section-header">Local Coordinate Systems</div>
          ${this.localCRS.map(t=>a`
            <div class="format-line">
              <div class="format-content">
                <div class="format-label">${t.name} (${t.code})</div>
                <div class="format-value">${t.coords||`Transforming...`}</div>
                ${t.accuracy?a`<div class="accuracy-note">Accuracy: ${t.accuracy}</div>`:e}
              </div>
              <button 
                class="copy-button" 
                ?disabled=${!t.coords}
                @click=${e=>t.coords&&this.copyToClipboard(t.coords,e)}
                title="Copy to clipboard"
              >
                <svg class="copy-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
              </button>
            </div>
          `)}
        `:e}
      </div>
    `}render(){return a`
      <div class="coordinates-shell" role="status" aria-live="polite" tabindex="0" aria-label="Cursor coordinates">
        ${this.renderCursorRow()}
        ${this.renderClickRow()}
      </div>
    `}formatCoordinate(e,t,n,r=`en`){let i=this.getDegreeStep(t,n),a=this.quantize(e,i),o=d[r]||d.en,s=t===`lat`?a>=0?o.N:o.S:a>=0?o.E:o.W,c=Math.abs(a),l=Math.floor(c),u=(c-l)*60;u>=59.9995&&(l+=1,u=0),t===`lat`&&l>90&&(l=90,u=0),t===`lng`&&l>180&&(l=180,u=0);let f=this.computeMinuteDecimals(i*60),p=u.toFixed(f);return`${l}° ${p}' ${s}`}getDegreeStep(e,t){let n=u;if(!t)return n;let r=e===`lat`?t.lat:t.lng;return!isFinite(r)||r<=0?n:Math.max(r,1e-12)}quantize(e,t){return!isFinite(t)||t<=0?e:Math.round(e/t)*t}computeMinuteDecimals(e){if(!isFinite(e)||e<=0)return 2;let t=Math.ceil(-Math.log10(e));return t<0?0:Math.min(t,6)}getDecimalPrecision(e,t){if(!e)return 6;let n=t===`lat`?e.lat:e.lng;if(!isFinite(n)||n<=0)return 6;let r=Math.ceil(-Math.log10(n));return Math.max(0,Math.min(r,8))}formatLonLat(e,t){let[n,r]=e,i=this.getDecimalPrecision(t,`lng`),a=this.getDecimalPrecision(t,`lat`);return`${n.toFixed(i)}, ${r.toFixed(a)}`}formatLatLon(e,t){let[n,r]=e,i=this.getDecimalPrecision(t,`lng`),a=this.getDecimalPrecision(t,`lat`);return`${r.toFixed(a)}, ${n.toFixed(i)}`}formatGeographic(e,t,n=`en`){let[r,i]=e;return`${this.formatCoordinate(i,`lat`,t,n)}, ${this.formatCoordinate(r,`lng`,t,n)}`}getBrowserLanguage(){return(navigator.language||navigator.userLanguage||`en`).split(`-`)[0].toLowerCase()}getLanguageName(e){return{nl:`Nederlands`,fr:`Français`,de:`Deutsch`,es:`Español`}[e]||e}getLocalFormatLabel(){let e=this.getBrowserLanguage(),t=this.getLanguageName(e);return t===e?`browser locale`:t}shouldShowLocalizedFormat(){let e=this.getBrowserLanguage();return e!==`en`&&Object.prototype.hasOwnProperty.call(d,e)}handleCursorRowClick(e){if(e.stopPropagation(),this.showPopup=!1,!this.cursorRowElement)return;let t=this.cursorRowElement.getBoundingClientRect().top,n=200+this.cursorFormatLocalCRS.length*60;this.cursorFormatPopupDirection=t>=n?`up`:`down`;let r=this.showCursorFormatPopup;if(this.showCursorFormatPopup=!this.showCursorFormatPopup,!r&&this.showCursorFormatPopup){let e=this.cursorCoords??this.mapCenter;e&&this.fetchCursorFormatCRS(e)}}handleClickRowClick(e){if(e.stopPropagation(),this.showCursorFormatPopup=!1,!this.clickRowElement)return;let t=this.clickRowElement.getBoundingClientRect().top,n=150+this.localCRS.length*60;this.popupDirection=t>=n?`up`:`down`;let r=this.showPopup;this.showPopup=!this.showPopup,!r&&this.showPopup&&this.pinnedCoords&&this.fetchLocalCRS(this.pinnedCoords)}async resolveCRS(e){let[t,n]=e;if(!f){let[e,t]=await Promise.all([s(()=>import(`./lib-CUh5lubX.js`),__vite__mapDeps([0,1,2,3,4,5,6,7,8]),import.meta.url),s(()=>import(`./epsg-definitions-DoJhXxaG.js`),__vite__mapDeps([9,10,3,2,4,5,11,1,6,7,8,12]),import.meta.url)]);f=e.default,p=t,Object.entries(p.EPSG_DEFS).forEach(([e,t])=>{f.defs(`EPSG:${e}`,t)})}let r=new Map;try{let e=await o.lookup(n,t);if(e.success&&e.epsgCodes&&(r.set(e.countryCode,{name:e.countryName,codes:e.epsgCodes}),e.alternativeMatches&&e.alternativeMatches.length>0))for(let t of e.alternativeMatches)r.set(t.countryCode,{name:t.countryName,codes:t.epsgCodes})}catch(e){console.warn(`EPSG lookup worker failed, falling back to regional bounds:`,e)}let i=[];if(r.size>0){let e=[];for(let[,{name:t,codes:n}]of r)for(let r of n)r!==`4326`&&e.push({code:r,countryName:t});i=e.map(({code:e,countryName:t})=>{let n=p.REGIONAL_CRS.find(t=>t.code===e);if(n)return{...n,name:`${n.name} (${t})`};let r=`EPSG:${e}`,i=f.defs(r)||p.EPSG_DEFS[e];return i?(f.defs(r)||f.defs(r,i),{code:e,name:`EPSG:${e} (${t})`,bounds:[-180,-90,180,90],proj4:i}):null}).filter(Boolean);let t=new Map;for(let e of i)t.has(e.code)||t.set(e.code,e);i=Array.from(t.values())}if(i.length===0&&(i=p.REGIONAL_CRS.filter(e=>{let[r,i,a,o]=e.bounds;return t>=r&&t<=a&&n>=i&&n<=o})),i.length===0){let e=Math.floor((t+180)/6)+1,r=n>=0,a=r?`326${e.toString().padStart(2,`0`)}`:`327${e.toString().padStart(2,`0`)}`,o=`EPSG:${a}`;if(!f.defs(o)){let t=`+proj=utm +zone=${e} ${r?``:`+south `}+datum=WGS84 +units=m +no_defs`;f.defs(o,t)}i.push({code:a,name:`WGS 84 / UTM zone ${e}${r?`N`:`S`}`,bounds:[-180,-90,180,90],proj4:f.defs(o)})}let a=r.size>1?5:3;return i.slice(0,a).map(t=>({code:t.code,name:t.name,coords:this.transformCoordinatesClientSide(e,t.code)}))}async fetchLocalCRS(e){this.loadingCRS=!0,this.localCRS=[];try{this.localCRS=await this.resolveCRS(e)}catch(e){console.error(`Error determining local coordinate systems:`,e)}finally{this.loadingCRS=!1}}async fetchCursorFormatCRS(e){this.loadingCursorFormatCRS=!0,this.cursorFormatLocalCRS=[];try{this.cursorFormatLocalCRS=await this.resolveCRS(e)}catch(e){console.error(`Error determining local coordinate systems for cursor format:`,e)}finally{this.loadingCursorFormatCRS=!1}}transformCoordinatesClientSide(e,t){if(!f)return`Error: proj4 not loaded`;try{let[n,r]=e,i=f(`EPSG:4326`,`EPSG:${t}`,[n,r]);if(!i||!Array.isArray(i))return`Transformation failed`;let[a,o]=i,s=this.getTransformedPrecision(t);return`${a.toFixed(s)}, ${o.toFixed(s)}`}catch(e){return console.error(`Error transforming to EPSG:${t}:`,e),`Transformation failed`}}getTransformedPrecision(e){return 2}async copyToClipboard(e,t){t.stopPropagation();try{await navigator.clipboard.writeText(e)}catch(e){console.error(`Failed to copy to clipboard:`,e)}}connectedCallback(){super.connectedCallback(),document.addEventListener(`click`,this.handleOutsideClick),this.subscribeToConfig()}onConfigReady(e){let t=this.toolsConfig?.coordinates?.defaultFormat;t&&(this.selectedCursorFormat=t,t.startsWith(`crs:`)&&this.ensureProj4Loaded())}async ensureProj4Loaded(){if(!f)try{let[e,t]=await Promise.all([s(()=>import(`./lib-CUh5lubX.js`),__vite__mapDeps([0,1,2,3,4,5,6,7,8]),import.meta.url),s(()=>import(`./epsg-definitions-DoJhXxaG.js`),__vite__mapDeps([9,10,3,2,4,5,11,1,6,7,8,12]),import.meta.url)]);f=e.default,p=t,Object.entries(p.EPSG_DEFS).forEach(([e,t])=>{f.defs(`EPSG:${e}`,t)}),this.requestUpdate()}catch(e){console.error(`Failed to pre-load proj4:`,e)}}disconnectedCallback(){super.disconnectedCallback(),document.removeEventListener(`click`,this.handleOutsideClick)}};c([r()],m.prototype,`cursorCoords`,void 0),c([r()],m.prototype,`pinnedCoords`,void 0),c([r()],m.prototype,`resolution`,void 0),c([r()],m.prototype,`pinnedResolution`,void 0),c([r()],m.prototype,`mapCenter`,void 0),c([r()],m.prototype,`showPopup`,void 0),c([r()],m.prototype,`popupDirection`,void 0),c([r()],m.prototype,`showCursorFormatPopup`,void 0),c([r()],m.prototype,`cursorFormatPopupDirection`,void 0),c([r()],m.prototype,`selectedCursorFormat`,void 0),c([r()],m.prototype,`localCRS`,void 0),c([r()],m.prototype,`loadingCRS`,void 0),c([r()],m.prototype,`cursorFormatLocalCRS`,void 0),c([r()],m.prototype,`loadingCursorFormatCRS`,void 0),c([t(`.click-row`)],m.prototype,`clickRowElement`,void 0),c([t(`.cursor-row`)],m.prototype,`cursorRowElement`,void 0),m=c([n(`webmapx-coordinates-tool`)],m);export{m as WebmapxCoordinatesTool};