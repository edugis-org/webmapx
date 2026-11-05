import{_ as e,x as t,y as n}from"./vendor-lit-DP8NDNGT.js";var r=2e3,i=class{constructor(e){this.host=e,this.text=null,this.pending=null,this.timer=null,e.addController(this)}set(e){this.pending=e,e===null?(this.clearTimer(),this.show(null)):this.text===null?this.timer===null&&(this.timer=window.setTimeout(()=>{this.timer=null,this.show(this.pending)},r)):this.show(e)}hostDisconnected(){this.clearTimer()}render(){return this.text===null?e:n`<div class="kiosk-notice" role="status">${this.text}</div>`}show(e){e!==this.text&&(this.text=e,this.host.requestUpdate())}clearTimer(){this.timer!==null&&window.clearTimeout(this.timer),this.timer=null}},a=t`
    .kiosk-notice {
        max-width: 22rem;
        padding: var(--webmapx-space-sm, 0.5rem) var(--webmapx-space-md, 0.75rem);
        border: 1px dashed var(--color-border, #d5dce3);
        border-radius: var(--webmapx-radius-md, 0.5rem);
        background: var(--color-surface, #fff);
        color: var(--color-text, #1f2a33);
        font-size: var(--webmapx-font-size-sm, 0.8125rem);
        line-height: 1.4;
        box-shadow: 0 1px 4px rgb(0 0 0 / 0.15);
    }
`;export{a as n,i as t};