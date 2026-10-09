import"./vendor-shoelace-B1bS8YN5.js";import{h as e,p as t,x as n,y as r}from"./vendor-lit-DP8NDNGT.js";import{_ as i,d as a,f as o,g as s,h as c,m as l,p as u,v as d}from"./webmapx-shared-wz7zw7_7.js";import{C as f}from"./cesium-adapter-DCP1QrEw.js";import{t as p}from"./decorate-DQd3KUs4.js";import{t as m}from"./webmapx-base-tool-Elw5kf2r.js";import{t as h}from"./control-surface-styles-WAx9bflO.js";import{t as g}from"./form-label-styles-CUvG5W-2.js";import{t as _}from"./help-text-styles-DMkkN2Q2.js";import{a as v,i as y,n as b,o as x,r as S,t as C}from"./step-button-DBcu4jAu.js";var w=183,T=10,E=1e3,D=[{label:`1 minute`,perSecond:o},{label:`10 minutes`,perSecond:10*o},{label:`1 hour`,perSecond:60*o},{label:`1 day`,perSecond:a*o,discrete:!0}];function O(e){return D.find(t=>t.perSecond===e)||{label:`${e} ms`,perSecond:e,discrete:e>=D[3].perSecond}}function k(e){let t=0;for(let n=1;n<D.length;n++)Math.abs(D[n].perSecond-e)<Math.abs(D[t].perSecond-e)&&(t=n);return t}var A=class extends m{constructor(...e){super(...e),this.mapTime={mode:`live`},this.origin=Date.now(),this.anchorYear=new Date().getUTCFullYear(),this.liveTick=Date.now(),this.speedIndex=2,this.playing=!1,this.playSpeedMs=null,this.liveTimer=null,this.stepper=new v,this.playTimer=null,this.playFrame=null,this.playLastFrame=0}get toolTip(){return f(this.mapTime)?`The map runs with the clock. Switch Now off to choose a moment.`:`The map shows the moment you chose. Switch Now on to follow the clock again.`}static{this.styles=[g,_,h,n`
        :host { display: block; padding: var(--webmapx-tool-padding, 0); font-size: 0.875rem; }
        .now {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            margin-bottom: 0.75rem;
        }
        .moment {
            font-variant-numeric: tabular-nums;
            margin-bottom: 0.75rem;
        }
        .moment .local {
            display: block;
            font-weight: 400;
            color: var(--color-text-secondary, #5a6773);
        }
        .row { margin-bottom: 0.75rem; }
        .row > label {
            display: flex;
            justify-content: space-between;
            gap: 0.5rem;
            margin-bottom: 0.25rem;
        }
        .row .value { font-variant-numeric: tabular-nums; }
        input[type="range"], #time-year { width: 100%; box-sizing: border-box; }
        .controls { display: flex; align-items: center; gap: 0.5rem; }
        .controls select { flex: 1; min-width: 0; width: auto; }
        :host([disabled-controls]) .row,
        .disabled { color: var(--color-text-muted, #6b7681); }
    `]}onMapAttached(){let e=this.adapter?.store.getState();this.readTime(e?.mapTime,e?.mapTimePlay)}onStateChanged(e){this.readTime(e.mapTime,e.mapTimePlay)}readTime(e,t){this.mapTime=e??{mode:`live`},this.mapTime.mode===`pinned`?this.stopLiveTicking():this.startLiveTicking(),this.readPlay(this.mapTime.mode===`pinned`?t??null:null)}readPlay(e){e!==this.playSpeedMs&&(this.playSpeedMs=e,this.stopPlaying(),!(e===null||e<=0)&&(this.speedIndex=k(e),this.startPlaying(e)))}connectedCallback(){super.connectedCallback(),this.origin=Date.now(),this.anchorYear=new Date().getUTCFullYear(),f(this.mapTime)&&this.startLiveTicking()}disconnectedCallback(){this.stopLiveTicking(),this.stopPlaying(),this.stepper.stop(),this.playSpeedMs=null,super.disconnectedCallback()}startLiveTicking(){this.liveTimer!==null||typeof setInterval!=`function`||(this.liveTimer=setInterval(()=>{this.liveTick=Date.now()},1e3))}stopLiveTicking(){this.liveTimer!==null&&clearInterval(this.liveTimer),this.liveTimer=null}get shownAt(){return this.mapTime.mode===`pinned`?this.mapTime.at:this.liveTick}setMapTime(e){this.adapter?.store.dispatch({mapTime:e},`UI`)}toggleNow(e){if(this.setPlaySpeed(null),e){this.setMapTime({mode:`live`});return}this.origin=Date.now(),this.setMapTime({mode:`pinned`,at:Date.now()})}pinTo(e){this.setMapTime({mode:`pinned`,at:e})}setYear(e){let t=d(this.shownAt,e-new Date(this.shownAt).getUTCFullYear());this.origin=t,this.pinTo(t)}togglePlay(){this.setPlaySpeed(this.playing?null:D[this.speedIndex].perSecond)}setPlaySpeed(e){this.adapter?.store.dispatch({mapTimePlay:e},`UI`)}startPlaying(e){if(this.mapTime.mode!==`pinned`)return;let t=O(e);this.playing=!0,this.playLastFrame=Date.now(),t.discrete?this.startDiscretePlay(t):this.startSmoothPlay(t)}startDiscretePlay(e){typeof setInterval==`function`&&(this.playTimer=setInterval(()=>this.advance(e.perSecond),E))}startSmoothPlay(e){if(typeof requestAnimationFrame!=`function`){this.startDiscretePlay(e);return}let t=()=>{if(!this.playing)return;let n=Date.now(),r=n-this.playLastFrame;this.playLastFrame=n,this.advance(r/1e3*e.perSecond)&&(this.playFrame=requestAnimationFrame(t))};this.playFrame=requestAnimationFrame(t)}advance(e){if(this.mapTime.mode!==`pinned`)return this.setPlaySpeed(null),!1;let t=this.mapTime.at+e;for(;u(this.origin,t)>w;)t=d(t,-1);for(;u(this.origin,t)<-183;)t=d(t,1);return this.pinTo(t),!0}stopPlaying(){this.playing=!1,this.playTimer!==null&&clearInterval(this.playTimer),this.playTimer=null,this.playFrame!==null&&typeof cancelAnimationFrame==`function`&&cancelAnimationFrame(this.playFrame),this.playFrame=null}nudge(e){this.playing&&this.setPlaySpeed(null),this.advance(e*D[this.speedIndex].perSecond)}renderStep(e,t,n){return x({icon:t,label:`${D[this.speedIndex].label} ${n}`,disabled:f(this.mapTime),step:()=>this.nudge(e),repeater:this.stepper})}setSpeed(e){this.speedIndex=e,this.playing&&this.setPlaySpeed(D[e].perSecond)}render(){let e=f(this.mapTime),t=this.shownAt,n=u(this.origin,t),o=i(t),d=new Date(t).toLocaleString(void 0,{dateStyle:`medium`,timeStyle:`short`}),p=new Date(t).getUTCFullYear(),m=[],h=Math.min(this.anchorYear-T,p),g=Math.max(this.anchorYear+T,p);for(let e=h;e<=g;e++)m.push(e);return r`
            <div class="now">
                <sl-switch size="small" id="time-now" .checked=${e}
                    @sl-change=${e=>this.toggleNow(e.target.checked)}>Now</sl-switch>
            </div>

            <div class="moment">
                ${c(t)} ${l(o)} UTC
                <span class="local">${d} local</span>
            </div>

            <div class="row ${e?`disabled`:``}">
                <sl-select id="time-year" size="small" hoist label="Year" ?disabled=${e} .value=${String(p)}
                    @sl-change=${e=>this.setYear(Number(e.target.value))}>
                    ${m.map(e=>r`
                        <sl-option value=${String(e)}>${e}</sl-option>`)}
                </sl-select>
            </div>

            <div class="row ${e?`disabled`:``}">
                <label for="time-date">
                    <span class="field-label">Date</span>
                    <span class="value">${c(t)}</span>
                </label>
                <input type="range" id="time-date"
                    min=${-183} max=${w} step="1"
                    .value=${String(n)} ?disabled=${e}
                    @input=${e=>this.pinTo(s(this.origin,Number(e.target.value),o))}>
            </div>

            <div class="row ${e?`disabled`:``}">
                <label for="time-minute">
                    <span class="field-label">Time of day (UTC)</span>
                    <span class="value">${l(o)}</span>
                </label>
                <input type="range" id="time-minute"
                    min="0" max=${a-1} step="1"
                    .value=${String(o)} ?disabled=${e}
                    @input=${e=>this.pinTo(s(this.origin,n,Number(e.target.value)))}>
            </div>

            <sl-select class="speed" size="small" hoist label="Speed" ?disabled=${e}
                .value=${String(this.speedIndex)}
                @sl-change=${e=>this.setSpeed(Number(e.target.value))}>
                ${D.map((e,t)=>r`
                    <sl-option value=${String(t)}>${e.label} per second</sl-option>`)}
            </sl-select>

            <!-- Step, play, step: the transport row of a media player. -->
            <div class="controls">
                ${this.renderStep(-1,S,`earlier`)}
                <sl-button size="small" class="play icon-only" ?disabled=${e}
                    title=${this.playing?`Pause`:`Play`}
                    @click=${()=>this.togglePlay()}>
                    ${this.playing?C:b}<span class="visually-hidden">${this.playing?`Pause`:`Play`}</span>
                </sl-button>
                ${this.renderStep(1,y,`later`)}
            </div>

        `}};p([t()],A.prototype,`mapTime`,void 0),p([t()],A.prototype,`origin`,void 0),p([t()],A.prototype,`anchorYear`,void 0),p([t()],A.prototype,`liveTick`,void 0),p([t()],A.prototype,`speedIndex`,void 0),p([t()],A.prototype,`playing`,void 0),A=p([e(`webmapx-time-slider-tool`)],A);export{A as WebmapxTimeSliderTool};