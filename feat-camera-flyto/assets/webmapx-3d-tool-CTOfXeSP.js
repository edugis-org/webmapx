import"./vendor-shoelace-BiEeFWil.js";import{h as e,p as t,x as n,y as r}from"./vendor-lit-DP8NDNGT.js";import{Ct as i}from"./webmapx-shared-DEt6PjHs.js";import{t as a}from"./decorate-BHbTgTzK.js";import{t as o}from"./webmapx-base-tool-CQ4alh3B.js";import{t as s}from"./control-surface-styles-WAx9bflO.js";import{t as c}from"./form-label-styles-CUvG5W-2.js";var l,u=[0,30,60],d=class extends o{static{l=this}constructor(...e){super(...e),this.pitch=0,this.terrainEnabled=!1,this.terrainSupported=!1,this.pitchSupported=!0}static{this.styles=[c,s,n`
        :host { display: block; padding: var(--webmapx-tool-padding, 0); font-size: var(--webmapx-font-size-md, 0.875rem); }
        .unsupported { color: var(--color-text-muted, #6b7681); font-style: italic; }
        /* The viewing angle: one choice between named angles, so a segmented
           control spread over the panel's width as the three buttons were. */
        .pitch { display: block; margin-bottom: var(--webmapx-space-md, 0.75rem); }
        .pitch::part(button-group) { width: 100%; }
        .pitch sl-radio-button { flex: 1; }
        .pitch-hint { font-size: var(--webmapx-font-size-sm, 0.8rem); color: var(--color-text-secondary, #5a6773); margin-bottom: var(--webmapx-space-sm, 0.5rem); line-height: 1.5; }
        .terrain-row { display: flex; align-items: center; gap: var(--webmapx-space-sm, 0.5rem); }
    `]}onMapAttached(){this.syncFromAdapter()}onStateChanged(e){this.syncFromAdapter(),e.terrainEnabled&&!this.terrainEnabled&&this.terrainSupported&&this.toggleTerrain()}syncFromAdapter(){if(!this.adapter)return;let e=this.adapter.getNavigationCapabilities();this.pitchSupported=e?.pitch!==!1,this.pitch=this.adapter.getPitch();let t=this.adapter.isTerrainEnabled();this.terrainSupported=t!==null,this.terrainEnabled=t===!0}reselectPitch(e,t){e.currentTarget.checked&&this.setPitch(t)}setPitch(e){this.adapter&&(this.adapter.setPitch(e),this.pitch=e)}getToolAttr(e){let t=this.getAttribute(`tool-id`),n=this.toolsConfig?Object.values(this.toolsConfig):[];for(let r of n){let n=Array.isArray(r?.items)?r.items:[];for(let r of n)if(r?.id===t&&typeof r[e]==`string`)return r[e]}}getDemTerrainSource(){let e=this.layerDataConfig?.sources?.find(e=>e?.type===`raster-dem`);if(e)return e;for(let e of this.layerDataConfig?.layers??[]){let t=e?.sources;if(!(!t||typeof t!=`object`)){for(let[n,r]of Object.entries(t))if(r?.type===`raster-dem`){let t=e?.id;return{...r,id:t?`${t}:${n}`:n}}}}let t=this.getToolAttr(`maplibre-terrain-fallback-url`);if(t)return{type:`raster-dem`,tiles:[t],tileSize:256,encoding:`terrarium`,maxzoom:15}}getTerrainServiceUrl(){let e=this.layerDataConfig?.layers?.find(e=>e?.type===`terrain`||e?.type===`cesium-terrain`);return e?.url??e?.source?.url??this.getToolAttr(`cesium-terrain-fallback-url`)}static{this.TERRAIN_LAYER_ID=i}findActiveHillshadeSource(){let e=this.store?.getState().mapLayers??{};for(let[t,n]of Object.entries(e)){if(n?.layerType!==`hillshade`)continue;let e=n?.sourceId;if(e){let t=this.layerDataConfig?.sources?.find(t=>t?.id===e);if(t)return t;if(this.adapter?.getSource(e))return{id:e,type:`raster-dem`}}let r=n?.sublayers;if(r)for(let e of r){if(e?.type!==`hillshade`)continue;let n=`${t}:${typeof e.source==`string`?e.source:`source`}`;if(this.adapter?.getSource(n))return{id:n,type:`raster-dem`}}}}async toggleTerrain(){if(!this.adapter)return;if(this.adapter.getTerrainSourceKind()===`terrain-service`){let e=!this.terrainEnabled;this.adapter.setTerrainEnabled(e,this.getTerrainServiceUrl())&&(this.terrainEnabled=e);return}if(this.terrainEnabled){this.adapter.setTerrainEnabled(!1),this.terrainEnabled=!1;return}let e=this.findActiveHillshadeSource();if(!e){let t=this.getDemTerrainSource();if(!t)return;let n=t.id??`webmapx-terrain-source`,r=this.layerDataConfig?.layers?.find(e=>e?.sources?.[n.split(`:`).pop()??``]?.type===`raster-dem`||e?.id&&n.startsWith(e.id))?.title??`Terrain (hillshade)`,i={id:l.TERRAIN_LAYER_ID,type:`hillshade`,source:n,title:r,paint:{"hillshade-exaggeration":.2},sources:{[n]:{...t,id:n}}};if(!await this.adapter.addLayer(i))return;e={...t,id:n}}this.adapter.setTerrainEnabled(!0,e)&&(this.terrainEnabled=!0)}render(){if(!this.pitchSupported&&!this.terrainSupported)return r`<div class="unsupported">3D view is not supported by this engine.</div>`;let e=Math.round(this.pitch),t=u.includes(e)?e:-1,n=t<0&&e>0&&e<60?`${e}°`:`30°`,i=t<0&&e>60?`${e}°`:`60°`,a=t<0&&e>0&&e<=60,o=t<0&&e>60;return r`
            ${this.pitchSupported?r`
                <!-- A new choice, by mouse or arrow keys, arrives as the group's change.
                     Clicking the option that is already selected changes nothing, so
                     that click is handled on its own: after a hand tilt to 45° the
                     middle option reads 45° and is selected, and choosing it must
                     still return to 30°. -->
                <sl-radio-group class="pitch" size="small" label="Viewing angle"
                    .value=${t>=0?String(t):o?`60`:a?`30`:`0`}
                    @sl-change=${e=>this.setPitch(Number(e.target.value))}>
                    <sl-radio-button value="0" @click=${e=>this.reselectPitch(e,0)}>0°</sl-radio-button>
                    <sl-radio-button value="30" @click=${e=>this.reselectPitch(e,30)}>${n}</sl-radio-button>
                    <sl-radio-button value="60" @click=${e=>this.reselectPitch(e,60)}>${i}</sl-radio-button>
                </sl-radio-group>
                <div class="pitch-hint">
                    Choose a different viewing angle above,<br>
                    or use CTRL + mouse button,<br>
                    or drag the compass needle at the bottom left of the map,<br>
                    or use 2 fingers on a touch screen.
                </div>
            `:``}
            ${this.terrainSupported?r`
                <div class="terrain-row">
                    <sl-switch size="small" id="webmapx-3d-terrain" .checked=${this.terrainEnabled}
                        @sl-change=${()=>this.toggleTerrain()}>Show terrain in 3D</sl-switch>
                </div>
            `:``}
        `}};a([t()],d.prototype,`pitch`,void 0),a([t()],d.prototype,`terrainEnabled`,void 0),a([t()],d.prototype,`terrainSupported`,void 0),a([t()],d.prototype,`pitchSupported`,void 0),d=l=a([e(`webmapx-3d-tool`)],d);export{d as Webmapx3dTool};