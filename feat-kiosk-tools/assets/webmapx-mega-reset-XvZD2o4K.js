import"./vendor-shoelace-BiEeFWil.js";import{h as e,p as t,x as n,y as r}from"./vendor-lit-DP8NDNGT.js";import{t as i}from"./decorate-B0yrMnax.js";import{t as a}from"./webmapx-base-tool-DU73VUs7.js";import{r as o}from"./i18n-CSwrzCKI.js";import{t as s}from"./control-surface-styles-WAx9bflO.js";var c=class extends a{constructor(...e){super(...e),this.initialView=null,this.handleReset=()=>{if(!this.adapter||!this.initialView)return;let{center:e,zoom:t,bearing:n,pitch:r}=this.initialView;this.adapter.setBearing(n),this.adapter.setPitch(r),this.adapter.setViewport(e,t)}}static{this.styles=[s,n`
      :host {
        display: inline-flex;
        pointer-events: auto;
      }

      sl-button {
        --sl-input-height-large: auto;
      }

      sl-button::part(base) {
        gap: var(--webmapx-mega-reset-gap, 10px);
        padding: var(--webmapx-mega-reset-padding, 16px 26px);
        border-radius: var(--webmapx-mega-reset-radius, var(--webmapx-surface-radius, 10px));
        font-size: var(--webmapx-mega-reset-font-size, 1.25rem);
        font-weight: 600;
      }

      sl-button::part(label) {
        white-space: nowrap;
      }

      /* sl-icon sizes itself from font-size (1em), so this sets its own
         rather than inheriting ::part(base)'s — deliberately bigger than the
         label text, not matched to it, so the icon reads at a glance. */
      sl-icon {
        font-size: var(--webmapx-mega-reset-icon-size, 2em);
        flex: 0 0 auto;
      }
    `]}onMapAttached(e){this.captureInitialViewOnceLoaded(e)}onMapDetached(){this.initialView=null}onStateChanged(e){this.adapter&&this.captureInitialViewOnceLoaded(this.adapter,e)}captureInitialViewOnceLoaded(e,t){if(this.initialView||!(t?.mapLoaded??this.store?.getState().mapLoaded))return;let n=e.getViewportState();this.initialView={center:n.center,zoom:n.zoom,bearing:n.bearing??0,pitch:n.pitch??0}}render(){let e=o(`tools.megaReset`);return r`
      <sl-button variant="default" ?disabled=${!this.initialView} @click=${this.handleReset} title=${e} aria-label=${e}>
        <sl-icon slot="prefix" name="arrow-counterclockwise" aria-hidden="true"></sl-icon>
        ${e}
      </sl-button>
    `}};i([t()],c.prototype,`initialView`,void 0),c=i([e(`webmapx-mega-reset`)],c);export{c as WebmapxMegaReset};