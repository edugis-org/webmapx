import"./vendor-shoelace-BiEeFWil.js";import{_ as e,h as t,p as n,x as r,y as i}from"./vendor-lit-DP8NDNGT.js";import{r as a,t as o}from"./decorate-C4V0gXFQ.js";import{t as s}from"./webmapx-base-tool-DaUGXzzu.js";import{t as c}from"./form-label-styles-CUvG5W-2.js";import{a as l,i as u,n as d,o as f,r as p}from"./openlayers-adapter-0v0PCf3z.js";var m=`globe`,h=`mercator`,g={id:m,label:`Globe`,description:`The Earth as a sphere. Nothing is distorted, because nothing is flattened — but only one side is visible at a time.`,equalArea:!0,rendering:!0},_={id:h,label:`Mercator (flat)`,description:`The usual web map. Shapes and angles are right everywhere, areas are inflated towards the poles.`,equalArea:!1,rendering:!0};function v(e){return e.flatMap(e=>{if(e===m)return[g];if(e===h)return[_];let t=p.find(t=>t.id===e);return t?[{id:t.id,label:t.label,description:t.description,equalArea:t.equalArea,rendering:!1}]:[]})}function y(e){let[t,n]=f(e),r=e=>`${Math.abs(Math.round(e))}°${e<0?`S`:`N`}`;return n>=89.9?`Covers latitudes north of ${r(t)}`:t<=-89.9?`Covers latitudes south of ${r(n)}`:`Covers ${r(t)} to ${r(n)}`}var b=class extends s{constructor(...e){super(...e),this.selectedId=d,this.engineId=``,this.viewIds=[],this.supported=null,this.applyingOwnChange=!1}static{this.styles=[c,r`
        :host { display: block; padding: var(--webmapx-tool-padding, 0); font-size: 0.875rem; }
        .unsupported { color: var(--color-text-muted, #6b7681); font-style: italic; }
        label { display: block; font-weight: 600; margin-bottom: 0.25rem; }
        sl-select { width: 100%; }
        .fixed { font-weight: 600; }
        .description { margin-top: 0.5rem; color: var(--color-text-secondary, #5a6773); }
        .badge {
            display: inline-block;
            margin-top: 0.5rem;
            padding: 0.1rem 0.4rem;
            border-radius: 4px;
            font-size: 0.75rem;
            background: var(--color-surface-sunken, rgba(0, 0, 0, 0.06));
        }
        .badge.equal-area { color: var(--color-success, #1a7f37); }
        .note { margin-top: 0.75rem; font-size: 0.8125rem; color: var(--color-text-secondary, #5a6773); }
    `]}onMapAttached(){this.engineId=this.adapter?.engineId??``,this.viewIds=this.adapter?.getViewProjections()??[],this.readProjection(this.adapter?.store.getState().mapProjection)}onStateChanged(e){this.applyingOwnChange||this.readProjection(e.mapProjection)}readProjection(e){if(e===void 0)return;if(e===null){this.supported=!1;return}this.supported=!0;let t=e.name,n=v(this.viewIds),r=n.find(e=>e.id===t)??(u(t)?n.find(e=>e.id===u(t).id):void 0);r&&(this.selectedId=r.id)}apply(e){this.selectedId=e;let t=v(this.viewIds).find(t=>t.id===e);this.applyingOwnChange=!0;try{if(t?.rendering){let t=a(this);if(t?.setProjection){t.setProjection(e);return}}this.adapter?.setProjection(e)||this.readProjection(this.adapter?.getProjection())}finally{this.applyingOwnChange=!1}}render(){let t=v(this.viewIds);if(t.length===0)return i`<div class="unsupported">
                How this map is drawn cannot be changed${this.engineId?i` on the ${this.engineId} engine`:e}.
            </div>`;let n=t.length===1,r=t.find(e=>e.id===this.selectedId)??t[0],a=u(r.id);return i`
            ${n?i`<div class="fixed">${r.label}</div>`:i`<sl-select id="projection-select" size="small" hoist
                                label="Projection"
                                .value=${r.id}
                                @sl-change=${e=>this.apply(e.target.value)}>
                    ${t.map(e=>i`
                        <sl-option value=${e.id}>${e.label}</sl-option>`)}
                  </sl-select>`}
            <div class="description">${r.description}</div>
            <div class="badge ${r.equalArea?`equal-area`:``}">
                ${r.equalArea?`Areas are comparable`:`Areas are distorted`}
            </div>
            ${a&&l(r.id)?i`<div class="badge">${y(r.id)}</div>`:e}
            ${n?i`<div class="note">
                    The ${this.engineId} engine draws the world this way and no other, so there is
                    nothing to change here. Switch engine to compare projections.
                  </div>`:e}
            ${!r.rendering&&r.id!==`EPSG:3857`?i`<div class="note">
                    Raster and vector tiles are re-projected in the browser, so a background map
                    may look softer and labels less tidy than in Web Mercator.
                  </div>`:e}
        `}};o([n()],b.prototype,`selectedId`,void 0),o([n()],b.prototype,`engineId`,void 0),o([n()],b.prototype,`viewIds`,void 0),o([n()],b.prototype,`supported`,void 0),b=o([t(`webmapx-projection-tool`)],b);export{b as WebmapxProjectionTool,v as viewOptionsFor};