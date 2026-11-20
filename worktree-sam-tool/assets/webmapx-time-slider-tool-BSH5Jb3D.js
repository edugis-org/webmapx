import"./vendor-shoelace-CCmdcRIF.js";import{h as e,p as t,x as n,y as r}from"./vendor-lit-DP8NDNGT.js";import{_ as i,d as a,f as o,g as s,h as c,m as l,p as u,v as d}from"./webmapx-shared-CW18CGkS.js";import{w as f}from"./cesium-adapter-D-ExYo8b.js";import{t as p}from"./decorate-O6vL4zQK.js";import{t as m}from"./webmapx-base-tool-Rw1OOGfN.js";import{t as h}from"./control-surface-styles-WAx9bflO.js";import{t as g}from"./form-label-styles-CUvG5W-2.js";import{a as _,i as v,n as y,o as b,r as x,t as S}from"./step-button-BF5PjrWy.js";var C=183,w=10,T=1e3,E=[{label:`1 minute`,perSecond:o},{label:`10 minutes`,perSecond:10*o},{label:`1 hour`,perSecond:60*o},{label:`1 day`,perSecond:a*o,discrete:!0}];function D(e){return E.find(t=>t.perSecond===e)||{label:`${e} ms`,perSecond:e,discrete:e>=E[3].perSecond}}function O(e){let t=0;for(let n=1;n<E.length;n++)Math.abs(E[n].perSecond-e)<Math.abs(E[t].perSecond-e)&&(t=n);return t}var k=class extends m{constructor(...e){super(...e),this.mapTime={mode:`live`},this.origin=Date.now(),this.anchorYear=new Date().getUTCFullYear(),this.liveTick=Date.now(),this.speedIndex=2,this.playing=!1,this.playSpeedMs=null,this.liveTimer=null,this.stepper=new _,this.playTimer=null,this.playFrame=null,this.playLastFrame=0}static{this.styles=[g,h,n`
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
        .hint {
            margin-top: 0.75rem;
            font-size: 0.8125rem;
            color: var(--color-text-secondary, #5a6773);
        }
        :host([disabled-controls]) .row,
        .disabled { color: var(--color-text-muted, #6b7681); }
    `]}onMapAttached(){let e=this.adapter?.store.getState();this.readTime(e?.mapTime,e?.mapTimePlay)}onStateChanged(e){this.readTime(e.mapTime,e.mapTimePlay)}readTime(e,t){this.mapTime=e??{mode:`live`},this.mapTime.mode===`pinned`?this.stopLiveTicking():this.startLiveTicking(),this.readPlay(this.mapTime.mode===`pinned`?t??null:null)}readPlay(e){e!==this.playSpeedMs&&(this.playSpeedMs=e,this.stopPlaying(),!(e===null||e<=0)&&(this.speedIndex=O(e),this.startPlaying(e)))}connectedCallback(){super.connectedCallback(),this.origin=Date.now(),this.anchorYear=new Date().getUTCFullYear(),f(this.mapTime)&&this.startLiveTicking()}disconnectedCallback(){this.stopLiveTicking(),this.stopPlaying(),this.stepper.stop(),this.playSpeedMs=null,super.disconnectedCallback()}startLiveTicking(){this.liveTimer!==null||typeof setInterval!=`function`||(this.liveTimer=setInterval(()=>{this.liveTick=Date.now()},1e3))}stopLiveTicking(){this.liveTimer!==null&&clearInterval(this.liveTimer),this.liveTimer=null}get shownAt(){return this.mapTime.mode===`pinned`?this.mapTime.at:this.liveTick}setMapTime(e){this.adapter?.store.dispatch({mapTime:e},`UI`)}toggleNow(e){if(this.setPlaySpeed(null),e){this.setMapTime({mode:`live`});return}this.origin=Date.now(),this.setMapTime({mode:`pinned`,at:Date.now()})}pinTo(e){this.setMapTime({mode:`pinned`,at:e})}setYear(e){let t=d(this.shownAt,e-new Date(this.shownAt).getUTCFullYear());this.origin=t,this.pinTo(t)}togglePlay(){this.setPlaySpeed(this.playing?null:E[this.speedIndex].perSecond)}setPlaySpeed(e){this.adapter?.store.dispatch({mapTimePlay:e},`UI`)}startPlaying(e){if(this.mapTime.mode!==`pinned`)return;let t=D(e);this.playing=!0,this.playLastFrame=Date.now(),t.discrete?this.startDiscretePlay(t):this.startSmoothPlay(t)}startDiscretePlay(e){typeof setInterval==`function`&&(this.playTimer=setInterval(()=>this.advance(e.perSecond),T))}startSmoothPlay(e){if(typeof requestAnimationFrame!=`function`){this.startDiscretePlay(e);return}let t=()=>{if(!this.playing)return;let n=Date.now(),r=n-this.playLastFrame;this.playLastFrame=n,this.advance(r/1e3*e.perSecond)&&(this.playFrame=requestAnimationFrame(t))};this.playFrame=requestAnimationFrame(t)}advance(e){if(this.mapTime.mode!==`pinned`)return this.setPlaySpeed(null),!1;let t=this.mapTime.at+e;for(;u(this.origin,t)>C;)t=d(t,-1);for(;u(this.origin,t)<-183;)t=d(t,1);return this.pinTo(t),!0}stopPlaying(){this.playing=!1,this.playTimer!==null&&clearInterval(this.playTimer),this.playTimer=null,this.playFrame!==null&&typeof cancelAnimationFrame==`function`&&cancelAnimationFrame(this.playFrame),this.playFrame=null}nudge(e){this.playing&&this.setPlaySpeed(null),this.advance(e*E[this.speedIndex].perSecond)}renderStep(e,t,n){return b({icon:t,label:`${E[this.speedIndex].label} ${n}`,disabled:f(this.mapTime),step:()=>this.nudge(e),repeater:this.stepper})}setSpeed(e){this.speedIndex=e,this.playing&&this.setPlaySpeed(E[e].perSecond)}render(){let e=f(this.mapTime),t=this.shownAt,n=u(this.origin,t),o=i(t),d=new Date(t).toLocaleString(void 0,{dateStyle:`medium`,timeStyle:`short`}),p=new Date(t).getUTCFullYear(),m=[],h=Math.min(this.anchorYear-w,p),g=Math.max(this.anchorYear+w,p);for(let e=h;e<=g;e++)m.push(e);return r`
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
                    min=${-183} max=${C} step="1"
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
                ${E.map((e,t)=>r`
                    <sl-option value=${String(t)}>${e.label} per second</sl-option>`)}
            </sl-select>

            <!-- Step, play, step: the transport row of a media player. -->
            <div class="controls">
                ${this.renderStep(-1,x,`earlier`)}
                <sl-button size="small" class="play icon-only" ?disabled=${e}
                    title=${this.playing?`Pause`:`Play`}
                    @click=${()=>this.togglePlay()}>
                    ${this.playing?S:y}<span class="visually-hidden">${this.playing?`Pause`:`Play`}</span>
                </sl-button>
                ${this.renderStep(1,v,`later`)}
            </div>

            <div class="hint">
                ${e?`The map runs with the clock. Switch Now off to choose a moment.`:`Frozen. Switch Now on to run with the clock again.`}
            </div>
        `}};p([t()],k.prototype,`mapTime`,void 0),p([t()],k.prototype,`origin`,void 0),p([t()],k.prototype,`anchorYear`,void 0),p([t()],k.prototype,`liveTick`,void 0),p([t()],k.prototype,`speedIndex`,void 0),p([t()],k.prototype,`playing`,void 0),k=p([e(`webmapx-time-slider-tool`)],k);export{k as WebmapxTimeSliderTool};