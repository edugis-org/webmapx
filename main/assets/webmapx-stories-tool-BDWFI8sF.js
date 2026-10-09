import"./vendor-shoelace-BiEeFWil.js";import{_ as e,h as t,n,p as r,x as i,y as a}from"./vendor-lit-DP8NDNGT.js";import{er as o,et as s}from"./webmapx-shared-AhBMPANj.js";import{t as c}from"./decorate-BQu4xszH.js";import{t as l}from"./webmapx-modal-tool-DmAqEkVJ.js";function u(e,t){return t in(e.store.getState().mapLayers??{})}var d=class extends l{constructor(...e){super(...e),this.toolId=`stories`,this.stories=[],this.selectedStory=null,this.stepIndex=0,this.content={kind:`html`,html:``},this.flattenedSteps=[],this.startState=null,this.addedLayerIds=new Set,this.stepToken=0,this.storyLayerIds=new Set,this.htmlCache=new Map,this.fetchToken=0,this.deepLinkStoryName=null,this.defaultActiveLayerIds=new Set}onMapAttached(e){super.onMapAttached(e),this.subscribeToConfig()}onMapDetached(){this.unsubscribeFromConfig(),super.onMapDetached()}onConfigReady(e){if(this.stories=e.stories?.stories??[],this.defaultActiveLayerIds=new Set((e.state?.activeLayers??[]).map(e=>typeof e==`string`?e:e.ref??e.layerId??e.id).filter(e=>typeof e==`string`)),this.deepLinkStoryName===null&&(this.deepLinkStoryName=typeof window<`u`?new URLSearchParams(window.location.search).get(`story`):null),this.deepLinkStoryName){let e=this.stories.find(e=>e.name.toLowerCase()===this.deepLinkStoryName.toLowerCase());e&&(this.deepLinkStoryName=null,this.activate(),this.openStory(e))}}onDeactivate(){super.onDeactivate(),this.closeStory()}openStory(e){this.adapter&&(this.flattenedSteps=e.chapters.flatMap(e=>e.steps.map(t=>({step:t,chapter:e}))),this.flattenedSteps.length!==0&&(this.storyLayerIds=new Set(e.chapters.flatMap(e=>e.steps.flatMap(e=>e.state.layers))),this.startState=this.captureStartState(),this.addedLayerIds.clear(),this.selectedStory=e,this.stepIndex=0,this.applyStep(this.flattenedSteps[0].step),this.setPanelWidth(e.width??null)))}closeStory(){this.stepToken++,this.startState&&this.adapter&&this.restoreStartState(this.startState);for(let e of this.addedLayerIds)this.adapter?.removeLogicalLayer(e);this.addedLayerIds.clear(),this.selectedStory=null,this.flattenedSteps=[],this.startState=null,this.setPanelWidth(null)}setPanelWidth(e){this.dispatchEvent(new CustomEvent(`webmapx-panel-width`,{detail:{toolId:this.instanceId,width:e},bubbles:!0,composed:!0}))}captureStartState(){let e=this.adapter,t=e.getViewportState(),n=new Map,r=new Map,i=e.store.getState().mapLayers??{};for(let e of this.storyLayerIds){let t=i[e];t&&(n.set(e,t.visible??!0),r.set(e,t.transparency??0))}return{viewport:t,visible:n,transparency:r,terrain:e.isTerrainEnabled()===!0,projection:e.getProjection()?.name??`mercator`}}restoreStartState(e){let t=this.adapter;t.setBearing(e.viewport.bearing),t.setPitch(e.viewport.pitch),t.setViewport(e.viewport.center,e.viewport.zoom);for(let[n,r]of e.visible)t.setLayerVisibility(n,r);for(let[n,r]of e.transparency)t.setLayerOpacity(n,(100-r)/100);t.setTerrainEnabled(e.terrain),t.setProjection(e.projection)}goToStep(e){e<0||e>=this.flattenedSteps.length||(this.stepIndex=e,this.applyStep(this.flattenedSteps[e].step))}goToChapter(e){let t=this.flattenedSteps.findIndex(t=>t.chapter===e);t>=0&&this.goToStep(t)}async applyStep(e){let t=this.adapter,n=this.mapHost;if(!t||!n)return;let r=++this.stepToken,{l:i,h:a,v:o,t:c,p:l,terrain:d}=s(e.state);if(await Promise.all(i.map(async e=>{u(t,e)||await n.addLayerRequest({layerId:e})&&!this.defaultActiveLayerIds.has(e)&&this.addedLayerIds.add(e)})),r!==this.stepToken)return;let[f,p,m,h,g]=o;t.setBearing(h),t.setPitch(g),t.setViewport([f,p],m);let _=new Set(i),v=new Set(a??[]);for(let e of this.storyLayerIds){if(!_.has(e)){this.addedLayerIds.has(e)?(t.removeLogicalLayer(e),this.addedLayerIds.delete(e)):t.setLayerVisibility(e,!1);continue}t.setLayerVisibility(e,!v.has(e));let n=c?.[e]??0;t.setLayerOpacity(e,(100-n)/100)}t.setTerrainEnabled(!!d),t.setProjection(l??`mercator`),this.loadContent(e)}loadContent(e){if(e.htmlUrl){this.loadContentFromUrl(e.htmlUrl);return}this.content={kind:`html`,html:o(e.html??``)}}async loadContentFromUrl(e){let t=++this.fetchToken,n=this.htmlCache.get(e);if(n!==void 0){this.content={kind:`html`,html:n};return}this.content={kind:`loading`};try{let n=await fetch(e);if(!n.ok)throw Error(`HTTP ${n.status}`);let r=await n.text();if(t!==this.fetchToken)return;let i=o(r,e);this.htmlCache.set(e,i),this.content={kind:`html`,html:i}}catch{if(t!==this.fetchToken)return;this.content={kind:`error`}}}static{this.styles=i`
        :host {
            display: block;
            pointer-events: auto;
        }

        :host(:not([active])) .tool-content {
            display: none;
        }

        .stories-container {
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
            padding: var(--webmapx-tool-padding, 0);
            font-size: var(--font-size-small, 0.875rem);
        }

        .story-list-item {
            display: block;
            width: 100%;
            padding: 0.5rem;
            border: 0;
            border-bottom: 1px solid var(--color-border-light, #e2e7ec);
            background: transparent;
            font: inherit;
            color: inherit;
            text-align: left;
            cursor: pointer;
        }

        .story-list-item:hover {
            background: var(--color-background-hover, #f5f5f5);
        }

        .story-name {
            font-weight: 600;
        }

        .story-description {
            color: var(--color-text-secondary, #5a6773);
            font-size: 0.8125rem;
        }

        .story-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 0.5rem;
        }

        .story-header .story-name {
            flex: 1;
        }

        .chapter-buttons {
            display: flex;
            flex-wrap: wrap;
            gap: 0.25rem;
        }

        .step-content {
            border-top: 1px solid var(--color-border-light, #e2e7ec);
            padding-top: 0.5rem;
            max-height: 20rem;
            overflow-y: auto;
        }

        .step-title {
            font-weight: 600;
            margin-bottom: 0.25rem;
        }

        .step-nav {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 0.5rem;
        }

        .step-counter {
            color: var(--color-text-secondary, #5a6773);
            font-size: 0.75rem;
        }

        .loading {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            color: var(--color-text-secondary, #5a6773);
        }
    `}renderList(){return this.stories.length===0?a`<p class="story-description">No stories configured.</p>`:a`
            ${this.stories.map(t=>a`
                <button type="button" class="story-list-item" @click=${()=>this.openStory(t)}>
                    <div class="story-name">${t.name}</div>
                    ${t.description?a`<div class="story-description">${t.description}</div>`:e}
                </button>
            `)}
        `}renderContent(){switch(this.content.kind){case`loading`:return a`<div class="loading"><sl-spinner></sl-spinner> Loading…</div>`;case`error`:return a`<p class="story-description">Could not load content.</p>`;case`html`:return a`${n(this.content.html)}`}}renderStory(t){let n=this.flattenedSteps.length,r=this.flattenedSteps[this.stepIndex];return a`
            <div class="story-header">
                <span class="story-name">${t.name}</span>
                <sl-button size="small" @click=${()=>this.closeStory()}>
                    <sl-icon name="x-lg" slot="prefix"></sl-icon>
                    Close
                </sl-button>
            </div>

            <div class="chapter-buttons">
                ${t.chapters.map(e=>a`
                    <sl-button
                        size="small"
                        variant=${r?.chapter===e?`primary`:`default`}
                        @click=${()=>this.goToChapter(e)}
                    >${e.buttonText??e.title}</sl-button>
                `)}
            </div>

            <div class="step-content" aria-live="polite">
                ${r?.step.title?a`<div class="step-title">${r.step.title}</div>`:e}
                ${this.renderContent()}
            </div>

            <div class="step-nav">
                <sl-button size="small" ?disabled=${this.stepIndex===0} @click=${()=>this.goToStep(this.stepIndex-1)}>
                    <sl-icon name="chevron-left" slot="prefix"></sl-icon>
                    Prev
                </sl-button>
                <span class="step-counter">${this.stepIndex+1} / ${n}</span>
                <sl-button size="small" ?disabled=${this.stepIndex>=n-1} @click=${()=>this.goToStep(this.stepIndex+1)}>
                    Next
                    <sl-icon name="chevron-right" slot="suffix"></sl-icon>
                </sl-button>
            </div>
        `}render(){return a`
            <div class="tool-content stories-container">
                ${this.selectedStory?this.renderStory(this.selectedStory):this.renderList()}
            </div>
        `}};c([r()],d.prototype,`stories`,void 0),c([r()],d.prototype,`selectedStory`,void 0),c([r()],d.prototype,`stepIndex`,void 0),c([r()],d.prototype,`content`,void 0),d=c([t(`webmapx-stories-tool`)],d);export{d as WebmapxStoriesTool};