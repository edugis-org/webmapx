import"./vendor-shoelace-BiEeFWil.js";import{h as e,m as t,n,p as r,x as i,y as a}from"./vendor-lit-DP8NDNGT.js";import{C as o,D as s,E as c,S as l,T as u,b as d,er as f,w as p,x as m,y as h}from"./webmapx-shared-AhBMPANj.js";import{t as g}from"./decorate-BQu4xszH.js";import{t as _}from"./webmapx-modal-tool-DmAqEkVJ.js";import{t as v}from"./control-surface-styles-WAx9bflO.js";import{t as y}from"./form-label-styles-CUvG5W-2.js";import{a as b,i as x,n as S,o as C,r as w,t as T}from"./step-button-UXJn9kyE.js";var E=[{label:`2 m`,perSecond:2},{label:`5 m`,perSecond:5},{label:`10 m`,perSecond:10},{label:`20 m`,perSecond:20}],D=[{label:`250 yr`,perSecond:.25},{label:`500 yr`,perSecond:.5},{label:`1,000 yr`,perSecond:1},{label:`2,000 yr`,perSecond:2}],O=.1,k=.5,A=[{from:14.5,to:14,label:`Meltwater pulse 1A: about 20 m in 500 years`},{from:9.6,to:9.4,label:`The sea passes the Bosporus sill (−28 m): the Black Sea connects`},{from:8.4,to:8,label:`Storegga tsunami; the last of Doggerland drowns`},{from:11.7,to:11.3,label:`The Holocene begins`},{from:12.9,to:11.7,label:`Younger Dryas cold spell: the rise slows`},{from:14.7,to:12.9,label:`Bølling–Allerød warm period`},{from:21.5,to:20.5,label:`Last glacial maximum: the lowest sea level, about 134 m below today`},{from:26,to:19,label:`Last glacial maximum`},{from:19,to:11.7,label:`Deglaciation`},{from:6.5,to:0,label:`Sea level close to today’s`}],j=`data/sealevel/lambeck2014-approx.json`,M=`../data/coastal_zones.pmtiles`,N=`../data/coastal_zones_16m.geojson`,P=`zones`,F=`Coastal zones: <a href="https://github.com/edugis-org/coastal_zones" target="_blank" rel="noopener">EduGIS</a>, from <a href="https://doi.org/10.5285/4f68d5c7-45eb-f999-e063-7086abc036fa" target="_blank" rel="noopener">GEBCO_2026 Grid</a>`,I=`#aad3df`,L=`#f2efe9`,R=[{level:-134,label:`Last glacial maximum, ~21,000 years ago`},{level:-60,label:`About 11,000 years ago`},{level:1,label:`Upper end of likely projections for 2100 (IPCC AR6)`},{level:7,label:`Greenland ice sheet melted`},{level:58,label:`Antarctic ice sheet melted`},{level:65,label:`All land ice melted`}],z=class extends _{constructor(...e){super(...e),this.toolId=`sealevel`,this.layer=`coastal-zones`,this.attribute=`flood_level`,this.min=-134,this.max=70,this.step=1,this.today=-1,this.water=I,this.land=L,this.levels=null,this.data=null,this.tiles=null,this.geojson=null,this.level=null,this.playing=!1,this.speedIndex=1,this.error=null,this.mode=`level`,this.curve=null,this.ageKa=null,this.timeSpeedIndex=2,this.curveRequested=null,this.appliedRoles=new Map,this.frame=null,this.lastFrameAt=0,this.wanted=!1,this.started=!1,this.stepper=new b,this.hadLayer=!1}get permalinkKey(){return`sealevel`}static{this.styles=[y,v,i`
        :host { display: block; padding: var(--webmapx-tool-padding, 0); font-size: 0.875rem; }
        .level { font-size: 1.5rem; font-weight: 600; line-height: 1.1; font-variant-numeric: tabular-nums; }
        .relative { color: var(--color-text-muted, #666); margin-bottom: 0.25rem; }
        .landmark { color: var(--color-text-secondary, #5a6773); min-height: 1.2em; margin-bottom: 0.5rem; }
        input[type="range"] { width: 100%; }
        .scale { display: flex; justify-content: space-between; color: var(--color-text-muted, #666); font-size: 0.75rem; }
        .controls { display: flex; flex-wrap: wrap; align-items: center; gap: 0.5rem; margin-top: 0.5rem; }
        .today { margin-left: auto; }
        .legend { display: flex; flex-wrap: wrap; gap: 0.25rem 0.75rem; margin-top: 0.75rem; }
        .legend span { display: inline-flex; align-items: center; gap: 0.35rem; }
        .legend i { width: 0.75rem; height: 0.75rem; border-radius: 2px; display: inline-block; border: 1px solid var(--color-border, #d5dce3); }
        .error { color: var(--color-danger, #b3261e); margin-top: 0.5rem; }
        .modes { display: block; margin-bottom: 0.5rem; }
        .credit { color: var(--color-text-muted, #666); font-size: 0.75rem; margin-top: 0.5rem; }
    `]}get mapElement(){return this.mapHost}onActivate(){this.wanted=!0,this.begin()}onMapAttached(e){super.onMapAttached(e),this.wanted&&this.begin()}onDeactivate(){this.wanted=!1,this.started=!1,this.stopPlaying(),this.stepper.stop()}readConfig(){let e=this.toolsConfig,t=e?.[this.instanceId]??e?.[this.toolId];if(!this.hasAttribute(`data`)&&this.data===null&&(this.data=this.resolveConfigAsset(j)),t){for(let e of[`layer`,`attribute`,`water`,`land`,`tiles`,`geojson`])!this.hasAttribute(e)&&typeof t[e]==`string`&&(this[e]=t[e]);for(let e of[`min`,`max`,`step`,`today`])!this.hasAttribute(e)&&typeof t[e]==`number`&&(this[e]=t[e]);Array.isArray(t.levels)&&t.levels.every(e=>typeof e==`number`)&&(this.levels=[...t.levels].sort((e,t)=>e-t)),!this.hasAttribute(`data`)&&typeof t.data==`string`&&(this.data=t.data)}}async loadCurve(){let e=this.data;if(!(!e||this.curveRequested===e)){this.curveRequested=e;try{let t=await fetch(e);this.curve=t.ok?d(await t.json()):null}catch{this.curve=null}this.curve&&this.ageKa===null&&(this.ageKa=h(this.curve).oldest),!this.curve&&this.mode===`time`&&(this.mode=`level`)}}get classLevels(){return this.levels??c(this.min,this.max)}get styleOptions(){return{attribute:this.attribute,today:this.today,water:this.water,land:this.land}}async begin(){if(!(this.started||!this.adapter||!this.mapElement)){if(this.started=!0,this.readConfig(),this.error=null,this.level=this.clamp(this.level??this.today),this.loadCurve(),!(this.layer in(this.adapter.store.getState().mapLayers??{}))&&!await this.mapElement.addLayerRequest(this.lentLayerConfig())){this.error=`The coastal zones could not be added to the map.`;return}if(!await this.ensureClassSubLayers()){this.error=`Layer "${this.layer}" cannot be split into sea level classes.`;return}this.apply()}}lentLayerConfig(){let e=`${this.layer}-source`,t={id:e,type:`vector`,url:`pmtiles://${this.resolveConfigAsset((this.tiles??M).replace(/^pmtiles:\/\//,``))}`,attribution:F},n=this.adapter?.canDrawSource(t)??!0,r=n?t:{id:e,type:`geojson`,data:this.resolveConfigAsset(this.geojson??N),attribution:F};return{id:this.layer,type:`fill`,source:e,...n?{"source-layer":P}:{},sources:{[e]:r},paint:{"fill-color":[`case`,[`<=`,[`get`,this.attribute],this.today],this.water,`rgba(0, 0, 0, 0)`],"fill-antialias":!1},title:`Coastal zones`,metadata:{title:`Coastal zones`,ownerTool:this.permalinkKey}}}async ensureClassSubLayers(){let e=this.adapter,t=e?.getSubLayers(this.layer);if(!e||!t?.length)return!1;let n=this.classLevels,r=new Map(t.map(e=>[e.id,e]));if(this.appliedRoles.clear(),n.every(e=>r.has(p(this.layer,e)))){let e=[`sea`,`dry`,`today`];for(let t of n){let n=r.get(p(this.layer,t))?.paint?.[`fill-color`],i=e.find(e=>s(e,this.styleOptions)===n);i&&this.appliedRoles.set(t,i)}return!0}let{id:i,filter:a,paint:c,layout:l,type:d,...f}=t[0],m=this.roundedLevel();if(!await e.setSubLayers(this.layer,u(this.layer,f,n,m,this.styleOptions)))return!1;for(let e of n)this.appliedRoles.set(e,o(e,m,this.today));return!0}roundedLevel(){return Math.round((this.level??this.today)/this.step)*this.step}clamp(e){return Math.min(Math.max(e,this.min),this.max)}apply(){if(!this.adapter||!this.started)return;let e=this.roundedLevel();this.publishToolState({lv:e,...this.mode===`time`&&this.ageKa!==null?{m:`time`,a:Math.round(this.ageKa*10)/10}:{}});for(let t of this.classLevels){let n=o(t,e,this.today);if(this.appliedRoles.get(t)===n)continue;let r=p(this.layer,t);this.adapter.updateLayerStyle(this.layer,r,{"fill-color":s(n,this.styleOptions)})&&(this.adapter.setSubLayerMetadata(this.layer,r,{title:l[n]}),this.appliedRoles.set(t,n))}}setLevel(e){let t=this.clamp(e);t!==this.level&&(this.level=t,this.apply())}nudge(e){this.playing&&this.stopPlaying(),this.setLevel(this.roundedLevel()+e*this.step)}setAge(e){if(!this.curve)return;let{oldest:t,youngest:n}=h(this.curve);this.ageKa=Math.min(Math.max(e,n),t),this.setLevel(this.today+m(this.curve,this.ageKa))}nudgeAge(e){this.playing&&this.stopPlaying();let t=this.ageKa??(this.curve?h(this.curve).oldest:0);this.setAge(Math.round((t+e*k)/O)*O)}setMode(e){e!==this.mode&&(this.stopPlaying(),this.mode=e,e===`time`&&this.ageKa!==null&&this.setAge(this.ageKa),this.apply())}onStateChanged(e){super.onStateChanged(e),this.layer in(e.mapLayers??{})?this.hadLayer=!0:this.hadLayer&&(this.hadLayer=!1,this.publishToolState(null))}applyToolState(e){typeof e.lv==`number`&&Number.isFinite(e.lv)&&(this.level=e.lv),e.m===`time`&&typeof e.a==`number`&&Number.isFinite(e.a)&&(this.mode=`time`,this.ageKa=e.a),this.begin()}togglePlay(){if(this.playing)return this.stopPlaying();if(this.mode===`time`&&this.curve){let{oldest:e,youngest:t}=h(this.curve);(this.ageKa??t)<=t&&this.setAge(e),this.run(n=>{let r=(this.ageKa??e)-n*D[this.timeSpeedIndex].perSecond;this.setAge(r<t?e:r)});return}(this.level??this.today)>=this.max&&this.setLevel(this.min),this.run(e=>{let t=(this.level??this.today)+e*E[this.speedIndex].perSecond;this.setLevel(t>this.max?this.min:t)})}run(e){this.playing=!0,this.lastFrameAt=performance.now();let t=n=>{if(!this.playing)return;let r=(n-this.lastFrameAt)/1e3;this.lastFrameAt=n,e(r),this.frame=requestAnimationFrame(t)};this.frame=requestAnimationFrame(t)}stopPlaying(){this.playing=!1,this.frame!==null&&cancelAnimationFrame(this.frame),this.frame=null}renderStep(e){let t=this.level??this.today;return C({icon:e===-1?w:x,label:`${this.step} m ${e===-1?`lower`:`higher`}`,disabled:e===-1?t<=this.min:t>=this.max,step:()=>this.nudge(e),repeater:this.stepper})}renderPlay(){return a`
            <sl-button size="small" class="play icon-only"
                title=${this.playing?`Pause`:`Play`}
                @click=${()=>this.togglePlay()}>
                ${this.playing?T:S}<span class="visually-hidden">${this.playing?`Pause`:`Play`}</span>
            </sl-button>`}renderLevelMode(e){let t=e-this.today,n=R.find(t=>t.level===e);return a`
            <div class="level">${B(e)}</div>
            <div class="relative">
                ${t===0?`Today’s sea level`:`${Math.abs(t)} m ${t>0?`above`:`below`} today`}
            </div>
            <div class="landmark">${n?.label??``}</div>

            <input type="range" aria-label="Sea level in metres"
                min=${this.min} max=${this.max} step=${this.step}
                .value=${String(e)}
                @input=${e=>{this.playing&&this.stopPlaying(),this.setLevel(Number(e.target.value))}}>
            <div class="scale"><span>${B(this.min)}</span><span>${B(this.max)}</span></div>

            <sl-select class="speed" size="small" hoist label="Speed"
                .value=${String(this.speedIndex)}
                @sl-change=${e=>{this.speedIndex=Number(e.target.value)}}>
                ${E.map((e,t)=>a`
                    <sl-option value=${String(t)}>${e.label} per second</sl-option>`)}
            </sl-select>

            <div class="controls">
                ${this.renderStep(-1)}
                ${this.renderPlay()}
                ${this.renderStep(1)}
                <sl-button size="small" class="today" ?disabled=${e===this.today}
                    @click=${()=>{this.stopPlaying(),this.setLevel(this.today)}}>Today</sl-button>
            </div>`}renderTimeMode(e){let{oldest:t,youngest:r}=h(e),i=this.ageKa??t,o=A.find(e=>i<=e.from&&i>=e.to);return a`
            <div class="level">${V(i)}</div>
            <div class="relative">Sea level ${B(Math.round(m(e,i)))}</div>
            <div class="landmark">${o?.label??``}</div>

            <!-- Runs from -oldest to -youngest, so the thumb moves the way time does. -->
            <input type="range" aria-label="Thousands of years before present"
                min=${-t} max=${-r} step=${O}
                .value=${String(-i)}
                @input=${e=>{this.playing&&this.stopPlaying(),this.setAge(-Number(e.target.value))}}>
            <div class="scale"><span>${V(t)}</span><span>${V(r)}</span></div>

            <sl-select class="speed" size="small" hoist label="Speed"
                .value=${String(this.timeSpeedIndex)}
                @sl-change=${e=>{this.timeSpeedIndex=Number(e.target.value)}}>
                ${D.map((e,t)=>a`
                    <sl-option value=${String(t)}>${e.label} per second</sl-option>`)}
            </sl-select>

            <div class="controls">
                ${C({icon:w,label:`${k*1e3} years earlier`,disabled:i>=t,step:()=>this.nudgeAge(1),repeater:this.stepper})}
                ${this.renderPlay()}
                ${C({icon:x,label:`${k*1e3} years later`,disabled:i<=r,step:()=>this.nudgeAge(-1),repeater:this.stepper})}
            </div>
            ${e.attribution?a`
                <div class="credit" title=${e.note??``}>${n(f(e.attribution))}</div>`:``}`}render(){let e=this.roundedLevel(),t=this.mode===`time`?this.curve:null;return a`
            ${this.curve?a`
                <sl-radio-group class="modes label-hidden" size="small" label="Slider" .value=${this.mode}
                    @sl-change=${e=>this.setMode(e.target.value)}>
                    <sl-radio-button value="level">Level</sl-radio-button>
                    <sl-radio-button value="time">Time</sl-radio-button>
                </sl-radio-group>`:``}

            ${t?this.renderTimeMode(t):this.renderLevelMode(e)}

            ${this.error?a`<div class="error">${this.error}</div>`:``}

            <div class="legend">
                <span><i style="background:${this.water}"></i>Sea</span>
                ${e<this.today?a`<span><i style="background:${this.land}"></i>Dry sea floor</span>`:``}
            </div>
        `}};g([t({type:String})],z.prototype,`layer`,void 0),g([t({type:String})],z.prototype,`attribute`,void 0),g([t({type:Number})],z.prototype,`min`,void 0),g([t({type:Number})],z.prototype,`max`,void 0),g([t({type:Number})],z.prototype,`step`,void 0),g([t({type:Number})],z.prototype,`today`,void 0),g([t({type:String})],z.prototype,`water`,void 0),g([t({type:String})],z.prototype,`land`,void 0),g([t({attribute:!1})],z.prototype,`levels`,void 0),g([t({type:String})],z.prototype,`data`,void 0),g([t({type:String})],z.prototype,`tiles`,void 0),g([t({type:String})],z.prototype,`geojson`,void 0),g([r()],z.prototype,`level`,void 0),g([r()],z.prototype,`playing`,void 0),g([r()],z.prototype,`speedIndex`,void 0),g([r()],z.prototype,`error`,void 0),g([r()],z.prototype,`mode`,void 0),g([r()],z.prototype,`curve`,void 0),g([r()],z.prototype,`ageKa`,void 0),g([r()],z.prototype,`timeSpeedIndex`,void 0),z=g([e(`webmapx-sealevel-tool`)],z);function B(e){return`${e>0?`+`:e<0?`−`:``}${Math.abs(e)} m`}function V(e){let t=Math.round(e*10)*100;return t===0?`Today`:`${t.toLocaleString(`en-US`)} years ago`}export{z as WebmapxSealevelTool};