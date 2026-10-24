import"./vendor-shoelace-CEoRvBMR.js";import{_ as e,h as t,p as n,x as r,y as i}from"./vendor-lit-DP8NDNGT.js";import{A as a,j as o}from"./webmapx-shared-DN9Pm2FX.js";import{t as s}from"./decorate-CUg1Matp.js";import{t as c}from"./webmapx-base-tool-CY2mN2xa.js";import{i as l}from"./data-colors-BXVfrRzV.js";import{t as u}from"./help-text-styles-DMkkN2Q2.js";import{t as d}from"./announce-BnK8C14J.js";import{t as f}from"./touch-pointer-CvO0aCw9.js";var p=`webmapx-panoramax-spot`,m=class extends c{constructor(...e){super(...e),this.active=!1,this.status=`idle`,this.photo=null,this.touch=new f(this),this.markerAdded=!1,this.unsubClick=null,this.requestNo=0}get toolTip(){return this.status===`idle`?`${this.touch.click} a road or path on the map to see a street photo of it.`:`${this.touch.click} another spot to see a photo there.`}handleEscape(){let e=this.dialog;return e?.open?(e.close(),!0):!1}static{this.styles=[u,r`
        :host {
            display: block;
            pointer-events: auto;
        }

        .panoramax {
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
    `]}onMapAttached(e){super.onMapAttached(e),this.unsubClick=e.events.on(`click`,e=>{this.handleClick(e)})}onMapDetached(){this.unsubClick?.(),this.unsubClick=null,super.onMapDetached()}disconnectedCallback(){this.removeMarker(),super.disconnectedCallback()}activate(){this.active=!0,this.style.display=`block`}deactivate(){this.active=!1,this.style.display=`none`,this.dialog?.close(),this.requestNo++,this.status=`idle`,this.photo=null,this.removeMarker()}onStateChanged(e){}get settings(){let e=this.toolsConfig?.panoramax??{};return{apiUrl:e.apiUrl||`https://api.panoramax.xyz/api`,viewerUrl:e.viewerUrl||`https://api.panoramax.xyz/`,searchDistance:e.searchDistance??50}}async handleClick(e){if(!this.active||!this.adapter)return;let t=++this.requestNo,n=e.coords;this.updateMarker(n),this.status=`loading`,this.photo=null;let{apiUrl:r,viewerUrl:i,searchDistance:s}=this.settings,c;try{let e=await fetch(a(r,n,s));if(!e.ok)throw Error(`HTTP ${e.status}`);c=o(await e.json(),i)}catch(e){if(t!==this.requestNo)return;console.warn(`[panoramax-tool] search failed`,e),this.status=`error`,d(this,`Panoramax could not be reached`);return}t===this.requestNo&&(this.photo=c,this.status=c?`found`:`none`,d(this,c?`Street photo found, by ${c.credit}`:`No street photos here`))}updateMarker(e){this.adapter&&(this.markerAdded?this.adapter.moveMarker(p,e):(this.adapter.addMarker(p,e,{color:l}),this.markerAdded=!0))}removeMarker(){this.markerAdded&&=(this.adapter?.removeMarker(p),!1)}get dialog(){return this.shadowRoot?.querySelector(`dialog`)??null}renderCredit(t){let n=t.takenAt?new Date(t.takenAt):null,r=n&&!Number.isNaN(n.getTime())?n.toLocaleDateString(void 0,{year:`numeric`,month:`long`,day:`numeric`}):null;return i`
            <p class="credit">
                Photo: ${t.credit}${r?i`, ${r}`:e}
                ${t.licence?i` · ${t.licenceUrl?i`<a href=${t.licenceUrl} target="_blank" rel="noopener noreferrer">${t.licence}</a>`:t.licence}`:e}
            </p>`}renderOpenButton(e){return i`
            <sl-button size="small" href=${e.viewerUrl} target="_blank" rel="noopener noreferrer"
                title="Open this photo in the Panoramax viewer in a new tab, to look around and walk on">
                <sl-icon name="box-arrow-up-right" slot="suffix" label="opens in a new tab"></sl-icon>
                Open in Panoramax
            </sl-button>`}render(){let t=this.photo;return i`
            <div class="panoramax">
                ${this.status===`loading`?i`
                    <p class="status help-text"><sl-spinner></sl-spinner> Looking for photos…</p>`:e}
                ${this.status===`none`?i`
                    <p class="status help-text">No street photos here. Photos are mostly taken along roads and paths.</p>`:e}
                ${this.status===`error`?i`
                    <p class="status help-text">Panoramax could not be reached. Try again in a moment.</p>`:e}
                ${t?i`
                    <button type="button" class="thumb-button" aria-haspopup="dialog"
                        title="Enlarge the photo" @click=${()=>this.dialog?.showModal()}>
                        <img src=${t.thumbUrl} alt="Street photo near this spot, select to enlarge">
                    </button>
                    ${this.renderCredit(t)}
                    <div>${this.renderOpenButton(t)}</div>

                    <dialog aria-labelledby="panoramax-dialog-title">
                        <div class="dialog-header">
                            <h3 id="panoramax-dialog-title">Street photo</h3>
                            <sl-icon-button name="x-lg" label="Close" @click=${()=>this.dialog?.close()}></sl-icon-button>
                        </div>
                        <img class="large" src=${t.largeUrl} alt="Street photo near this spot">
                        <div class="dialog-footer">
                            ${this.renderCredit(t)}
                            ${this.renderOpenButton(t)}
                        </div>
                    </dialog>
                `:e}
            </div>
        `}};s([n()],m.prototype,`status`,void 0),s([n()],m.prototype,`photo`,void 0),m=s([t(`webmapx-panoramax-tool`)],m);export{m as WebmapxPanoramaxTool};