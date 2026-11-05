import"./vendor-shoelace-CEoRvBMR.js";import{_ as e,h as t,p as n,x as r,y as i}from"./vendor-lit-DP8NDNGT.js";import{A as a,C as o,D as s,E as c,O as l,S as u,T as d,k as f,w as p,x as m}from"./webmapx-shared-e5uIjO4d.js";import{N as h,b as g,j as _}from"./cesium-adapter-8oU_E8dL.js";import{t as v}from"./decorate-DG27ed3c.js";import{t as y}from"./webmapx-base-tool-uaKxufHw.js";import{t as b}from"./accent-control-styles-bfMM63ZQ.js";import{t as x}from"./form-label-styles-2ZYFAdeB.js";import{i as S}from"./data-colors-BXVfrRzV.js";import{t as C}from"./help-text-styles-DMkkN2Q2.js";import{t as w}from"./announce-BnK8C14J.js";import{t as T}from"./touch-pointer-CvO0aCw9.js";var E=`webmapx-street-photos-spot`,D=6,O=12,k=500,A=100,j=null;function M(){return j??=Promise.all([_(()=>import(`./pannellum-DGXvQYYv.js`),[],import.meta.url),_(()=>import(`./pannellum-DZwgoZC-.js`),[],import.meta.url)]).then(([,e])=>e.default),j}var N=class extends y{constructor(...e){super(...e),this.active=!1,this.status=`idle`,this.photo=null,this.source=`panoramax`,this.errorText=``,this.coverageUnsupported=!1,this.panoramaFailed=!1,this.colourBy=`coverage`,this.zoomedOut=!1,this.touch=new T(this),this.markerAdded=!1,this.unsubClick=null,this.requestNo=0,this.spot=null,this.panorama=null,this.unsubPointerMove=null,this.unsubViewChangeEnd=null,this.hoverCursor=``,this.throttledHover=g(async(e,t)=>{if(!this.active)return;let n=await this.coverageAt(e,t);this.active&&this.setHoverCursor(n?`pointer`:``)},A),this.selectSource=e=>{let t=e.target.value;t!==`panoramax`&&t!==`google`||(this.source=t,this.dialog?.close(),this.requestNo++,this.status=`idle`,this.photo=null,this.spot=null,this.removeMarker(),t===`google`?(this.removeCoverage(),this.setHoverCursor(``)):this.addCoverage())},this.selectColourBy=e=>{let t=e.target.value;if(t!==`coverage`&&t!==`date`&&t!==`camera`)return;this.colourBy=t;let n=m;if(!this.adapter?.hasLayer?.(n))return;let r=new Date().getFullYear();this.adapter.updateLayerStyle(n,`${n}-sequences`,{"line-color":p(t,`sequences`,r)}),this.adapter.updateLayerStyle(n,`${n}-pictures`,{"circle-color":p(t,`pictures`,r)})},this.imageFailed=()=>{let e=this.photo;e&&(this.photo=null,this.fail(e.source===`google`?`Google Street View found a photo here but would not send the image. Check that the Google key may use the Street View Static API.`:`The photo could not be loaded. Try again in a moment.`))},this.openDialog=async()=>{let e=this.photo,t=this.dialog;!e||!t||(this.panoramaFailed=!1,t.showModal(),e.is360&&await this.openPanorama(e))}}get showsCoverage(){return this.source===`panoramax`&&!this.coverageUnsupported}get toolTip(){return this.source===`google`?this.status===`idle`?`${this.touch.click} a street on the map to see a Google Street View photo of it.`:`${this.touch.click} another street to see a photo there.`:this.zoomedOut&&!this.coverageUnsupported?`Zoom in to see where photos were taken.`:this.status===`idle`?this.coverageUnsupported?`${this.touch.click} a road or path on the map to see a street photo of it.`:`${this.touch.click} a coloured line or dot to see a street photo.`:`${this.touch.click} another spot to see a photo there.`}handleEscape(){let e=this.dialog;return e?.open?(e.close(),!0):!1}static{this.styles=[b,x,C,r`
        :host {
            display: block;
            pointer-events: auto;
        }

        .street-photos {
            display: flex;
            flex-direction: column;
            gap: var(--webmapx-space-md, 0.75rem);
            padding: var(--webmapx-tool-padding, 0);
            font-size: var(--font-size-small, 0.875rem);
        }

        .status {
            display: flex;
            align-items: center;
            gap: var(--webmapx-space-sm, 0.5rem);
            margin: 0;
        }

        .thumb-button {
            position: relative;
            display: block;
            width: 100%;
            padding: 0;
            border: 0;
            background: none;
            cursor: zoom-in;
            border-radius: 4px;
        }

        .thumb-button:focus-visible {
            outline: var(--webmapx-focus-ring-width, 2px) solid var(--webmapx-focus-ring-color, var(--color-primary, #2b6c8f));
            outline-offset: 2px;
        }

        .thumb-button img {
            display: block;
            width: 100%;
            aspect-ratio: 3 / 2;
            object-fit: cover;
            border-radius: 4px;
            background: var(--color-surface-raised, #f4f6f8);
        }

        .badge-360 {
            position: absolute;
            top: 0.4rem;
            left: 0.4rem;
            padding: 0.05rem 0.4rem;
            border-radius: 3px;
            font-size: 0.7rem;
            font-weight: 600;
            color: #fff;
            background: rgba(0, 0, 0, 0.6);
        }

        .credit {
            margin: 0;
            font-size: 0.75rem;
            color: var(--color-text-secondary, #5a6773);
        }

        .credit a {
            color: inherit;
        }

        /* A native dialog sits in the browser's top layer, so a translucent
           panel (backdrop-filter) cannot trap it inside its own box. */
        dialog {
            width: min(860px, calc(100vw - 2rem));
            padding: var(--webmapx-space-md, 0.75rem);
            border: 1px solid var(--color-border-light, #e2e7ec);
            border-radius: var(--webmapx-radius-md, 8px);
            background: var(--color-surface, #fff);
            color: var(--color-text, #1d2a36);
            box-shadow: var(--webmapx-shadow-lg, 0 10px 30px rgba(0, 0, 0, 0.25));
        }

        dialog::backdrop {
            background: rgba(0, 0, 0, 0.45);
        }

        .dialog-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: var(--webmapx-space-sm, 0.5rem);
        }

        .dialog-header h3 {
            margin: 0;
            font-size: 1rem;
        }

        .large {
            display: block;
            width: 100%;
            max-height: 70vh;
            object-fit: contain;
            border-radius: 4px;
            background: var(--color-surface-raised, #f4f6f8);
        }

        .panorama {
            width: 100%;
            height: min(60vh, 480px);
            border-radius: 4px;
            overflow: hidden;
            background: #000;
        }

        .dialog-footer {
            display: flex;
            align-items: center;
            justify-content: space-between;
            flex-wrap: wrap;
            gap: var(--webmapx-space-sm, 0.5rem);
            margin-top: var(--webmapx-space-md, 0.75rem);
        }

        sl-spinner {
            font-size: 0.9rem;
        }
    `]}onMapAttached(e){super.onMapAttached(e),this.unsubClick=e.events.on(`click`,e=>{this.handleClick(e)}),this.unsubPointerMove=e.events.on(`pointer-move`,e=>{this.active&&this.showsCoverage&&this.throttledHover(e.pixel,e.coords)}),this.unsubViewChangeEnd=e.events.on(`view-change-end`,()=>this.updateZoomedOut())}onMapDetached(){this.unsubClick?.(),this.unsubClick=null,this.unsubPointerMove?.(),this.unsubPointerMove=null,this.unsubViewChangeEnd?.(),this.unsubViewChangeEnd=null,super.onMapDetached()}disconnectedCallback(){this.removeMarker(),this.removeCoverage(),this.closePanorama(),super.disconnectedCallback()}activate(){this.active=!0,this.style.display=`block`,this.updateZoomedOut(),this.source===`panoramax`&&this.addCoverage()}updateZoomedOut(){let e=this.adapter?.getViewportState()?.zoom;this.zoomedOut=typeof e==`number`&&e<6}deactivate(){this.active=!1,this.style.display=`none`,this.dialog?.close(),this.requestNo++,this.status=`idle`,this.photo=null,this.spot=null,this.removeMarker(),this.removeCoverage(),this.setHoverCursor(``)}onStateChanged(e){}get settings(){let e=this.toolConfig;return{apiUrl:e.apiUrl||`https://api.panoramax.xyz/api`,viewerUrl:e.viewerUrl||`https://api.panoramax.xyz/`,searchDistance:e.searchDistance??50}}get toolConfig(){return this.toolsConfig?.[`street-photos`]??this.toolsConfig?.panoramax??{}}get googleApiKey(){let e=this.toolConfig.googleApiKey;if(!e)return null;let t=h(e);return t&&!t.includes(`{key-`)?t:null}async addCoverage(){let e=this.adapter,t=this.mapHost;if(!e||!t)return;let n=d(this.settings.apiUrl,this.colourBy),r=Object.values(n.sources)[0];this.coverageUnsupported=!e.canDrawSource(r),!(this.coverageUnsupported||e.hasLayer?.(`panoramax-coverage`))&&(await t.addLayerRequest(n),this.active||this.removeCoverage())}setHoverCursor(e){e!==this.hoverCursor&&(this.hoverCursor=e,this.adapter?.setCursor(e))}removeCoverage(){this.adapter?.hasLayer?.(`panoramax-coverage`)&&this.mapHost?.removeInlineLayer(m)}async coverageAt(e,t){if(!this.adapter?.hasLayer?.(`panoramax-coverage`))return null;let n=m;try{let r=await this.adapter.queryService.queryFeatures({pixel:e,lngLat:t},{tolerancePx:D,layerIds:[n]}),i=r.find(e=>typeof e.properties.ts==`string`&&typeof e.properties.id==`string`);return i?{kind:`photo`,id:i.properties.id}:r.some(e=>typeof e.properties.date==`string`)?{kind:`route`}:null}catch{return null}}searchDistanceAt(e,t){let n=this.settings.searchDistance;try{let r=this.adapter?.unproject([e[0]+O,e[1]]);if(!r)return n;let[i,a]=r,o=Math.PI/180,s=(a-t[1])*o,c=(i-t[0])*o,l=Math.sin(s/2)**2+Math.cos(t[1]*o)*Math.cos(a*o)*Math.sin(c/2)**2,u=2*6371008.8*Math.asin(Math.sqrt(l));return Number.isFinite(u)?Math.min(k,Math.max(n,u)):n}catch{return n}}async handleClick(e){if(!this.active||!this.adapter)return;let t=++this.requestNo;if(this.source===`google`){await this.searchGoogle(e,t);return}if(this.zoomedOut&&!this.coverageUnsupported){w(this,`Zoom in to see where photos were taken.`);return}let n=await this.coverageAt(e.pixel,e.coords);if(t!==this.requestNo)return;this.updateMarker(e.coords),this.status=`loading`,this.photo=null;let{apiUrl:r,viewerUrl:i}=this.settings,a;try{let t=n?.kind===`photo`?n.id:null;this.spot=t?null:e.coords;let s=t?u(r,t):o(r,e.coords,this.searchDistanceAt(e.pixel,e.coords)),l=await fetch(s);if(!l.ok)throw Error(`HTTP ${l.status}`);a=c(await l.json(),i)}catch(e){if(t!==this.requestNo)return;console.warn(`[street-photos-tool] Panoramax search failed`,e),this.fail(`Panoramax could not be reached. Try again in a moment.`);return}t===this.requestNo&&this.found(a)}async searchGoogle(e,t){let n=this.googleApiKey;if(!n)return;this.updateMarker(e.coords),this.status=`loading`,this.photo=null,this.spot=e.coords;let r;try{let t=await fetch(l(e.coords,this.searchDistanceAt(e.pixel,e.coords),n));if(!t.ok)throw Error(`HTTP ${t.status}`);r=await t.json()}catch(e){if(t!==this.requestNo)return;console.warn(`[street-photos-tool] Google Street View search failed`,e),this.fail(`Google Street View could not be reached. Try again in a moment.`);return}if(t!==this.requestNo)return;let i=f(r);if(i){console.warn(`[street-photos-tool] ${i}`),this.fail(`${i}. Check the Google key in the map's settings.`);return}this.found(a(r,e.coords,n))}found(e){this.photo=e,this.status=e?`found`:`none`,w(this,e?`Street photo found, by ${e.credit}`:`No street photos here`)}fail(e){this.errorText=e,this.status=`error`,w(this,e)}updateMarker(e){this.adapter&&(this.markerAdded?this.adapter.moveMarker(E,e):(this.adapter.addMarker(E,e,{color:S}),this.markerAdded=!0))}removeMarker(){this.markerAdded&&=(this.adapter?.removeMarker(E),!1)}get dialog(){return this.shadowRoot?.querySelector(`dialog`)??null}async openPanorama(e){let t=this.shadowRoot?.querySelector(`.panorama`);if(t)try{let n=await M();if(!this.dialog?.open||this.photo!==e)return;if(!this.shadowRoot.querySelector(`style[data-pannellum]`)){let e=document.createElement(`style`);e.dataset.pannellum=``,e.textContent=n,this.shadowRoot.append(e)}this.closePanorama(),this.panorama=window.pannellum.viewer(t,{type:`equirectangular`,panorama:e.largeUrl,autoLoad:!0,crossOrigin:`anonymous`,yaw:s(e,this.spot),hfov:100,showFullscreenCtrl:!1,strings:{loadingLabel:`Loading photo…`}})}catch(e){console.warn(`[street-photos-tool] panorama viewer failed`,e),this.panoramaFailed=!0}}closePanorama(){this.panorama?.destroy(),this.panorama=null}renderCredit(t){let n=t.takenAt?new Date(t.takenAt):null,r=/^\d{4}-\d{2}$/.test(t.takenAt??``),a=n&&!Number.isNaN(n.getTime())?n.toLocaleDateString(void 0,r?{year:`numeric`,month:`long`}:{year:`numeric`,month:`long`,day:`numeric`}):null;return i`
            <p class="credit">
                Photo: ${t.credit}${a?i`, ${a}`:e}
                ${t.licence?i` · ${t.licenceUrl?i`<a href=${t.licenceUrl} target="_blank" rel="noopener noreferrer">${t.licence}</a>`:t.licence}`:e}
            </p>`}renderOpenButton(e){let t=e.source===`google`?`Google Street View`:`Panoramax`;return i`
            <sl-button size="small" href=${e.viewerUrl} target="_blank" rel="noopener noreferrer"
                title=${`Open this photo in ${t} in a new tab, to look around and walk on`}>
                <sl-icon name="box-arrow-up-right" slot="suffix" label="opens in a new tab"></sl-icon>
                Open in ${t}
            </sl-button>`}renderLarge(e){return e.is360?this.panoramaFailed?i`<p class="status help-text">This 360° photo could not be shown here. Open it in Panoramax to look around.</p>`:i`<div class="panorama" role="img" aria-label="360° street photo near this spot. Drag or use the arrow keys to look around."></div>`:i`<img class="large" src=${e.largeUrl} alt="Street photo near this spot">`}render(){let t=this.photo;return i`
            <div class="street-photos">
                ${this.googleApiKey?i`
                    <sl-radio-group size="small" label="Photos from" value=${this.source} @sl-change=${this.selectSource}>
                        <sl-radio-button value="panoramax">Panoramax</sl-radio-button>
                        <sl-radio-button value="google">Google Street View</sl-radio-button>
                    </sl-radio-group>`:e}
                ${this.showsCoverage?i`
                    <sl-radio-group size="small" label="Colour by" value=${this.colourBy} @sl-change=${this.selectColourBy}>
                        <sl-radio-button value="coverage">Coverage</sl-radio-button>
                        <sl-radio-button value="date">Date</sl-radio-button>
                        <sl-radio-button value="camera">Camera</sl-radio-button>
                    </sl-radio-group>`:e}
                ${this.coverageUnsupported&&this.source===`panoramax`?i`
                    <p class="status help-text">This map engine cannot show where photos are. Click a road or path to look for one.</p>`:e}
                ${this.status===`loading`?i`
                    <p class="status help-text"><sl-spinner></sl-spinner> Looking for photos…</p>`:e}
                ${this.status===`none`?i`
                    <p class="status help-text">No street photos here. ${this.showsCoverage?`Click a coloured line or dot.`:`Photos are mostly taken along roads and paths.`}</p>`:e}
                ${this.status===`error`?i`
                    <p class="status help-text">${this.errorText}</p>`:e}
                ${t?i`
                    <button type="button" class="thumb-button" aria-haspopup="dialog"
                        title=${t.is360?`Enlarge the photo and look around`:`Enlarge the photo`}
                        @click=${this.openDialog}>
                        <img src=${t.thumbUrl} alt="Street photo near this spot, select to enlarge" @error=${this.imageFailed}>
                        ${t.is360?i`<span class="badge-360" aria-hidden="true">360°</span>`:e}
                    </button>
                    ${this.renderCredit(t)}
                    <div>
                        <sl-button size="small" class="enlarge" aria-haspopup="dialog" @click=${this.openDialog}>
                            <sl-icon name="arrows-angle-expand" slot="prefix"></sl-icon>
                            ${t.is360?`Open 360 view`:`Open larger picture`}
                        </sl-button>
                    </div>

                    <dialog aria-labelledby="street-photos-dialog-title" @close=${()=>this.closePanorama()}>
                        <div class="dialog-header">
                            <h3 id="street-photos-dialog-title">${t.is360?`Street photo, 360°`:`Street photo`}</h3>
                            <sl-icon-button name="x-lg" label="Close" @click=${()=>this.dialog?.close()}></sl-icon-button>
                        </div>
                        ${this.renderLarge(t)}
                        <div class="dialog-footer">
                            ${this.renderCredit(t)}
                            ${this.renderOpenButton(t)}
                        </div>
                    </dialog>
                `:e}
            </div>
        `}};v([n()],N.prototype,`status`,void 0),v([n()],N.prototype,`photo`,void 0),v([n()],N.prototype,`source`,void 0),v([n()],N.prototype,`errorText`,void 0),v([n()],N.prototype,`coverageUnsupported`,void 0),v([n()],N.prototype,`panoramaFailed`,void 0),v([n()],N.prototype,`colourBy`,void 0),v([n()],N.prototype,`zoomedOut`,void 0),N=v([t(`webmapx-street-photos-tool`)],N);export{N as WebmapxStreetPhotosTool};