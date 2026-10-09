import"./vendor-shoelace-BiEeFWil.js";import{_ as e,h as t,m as n,p as r,v as i,x as a,y as o}from"./vendor-lit-DP8NDNGT.js";import{B as s,G as c,H as l,K as u,Q as d,U as f,V as p,W as m,q as h,xt as g}from"./webmapx-shared-AhBMPANj.js";import{t as _}from"./decorate-BQu4xszH.js";import{t as v}from"./webmapx-modal-tool-DmAqEkVJ.js";import{t as y}from"./form-label-styles-CUvG5W-2.js";import{r as b,t as x}from"./data-colors-BXVfrRzV.js";import{t as S}from"./announce-BnK8C14J.js";import{t as C}from"./section-heading-styles-BsMEM1VW.js";var w=`var(--webmapx-data-tool, #0f62fe)`,T=`var(--webmapx-data-end, #e63946)`,E=`var(--webmapx-data-start, #22c55e)`,D=`M14 10 H58 V44 H14 Z`,O=`M42 10 H86 V44 H42 Z`,k=`M42 10 H58 V44 H42 Z`,A=`M14 10 H42 V44 H14 Z`,j=`M58 10 H86 V44 H58 Z`;function M(e){return i`
        <svg viewBox="0 0 100 52" role="img" aria-hidden="true" focusable="false">
            ${e}
        </svg>`}function N(e,t,n){return i`<path class=${e} d=${t} fill="none" stroke=${n} stroke-width="1.5" stroke-dasharray="3 2" />`}var P=N(`gp-a`,D,w),F=N(`gp-b`,O,T);function I(e){return i`<path class="gp-result" d=${e} fill=${E} fill-opacity="0.55" stroke=${E} stroke-width="2" />`}var L={clip:M(i`
        ${P}${F}
        ${I(k)}`),erase:M(i`
        ${P}${F}
        ${I(A)}`),intersect:M(i`
        ${P}
        <g class="gp-b">
            <path d="M42 10 H86 V26 H42 Z" fill="none" stroke=${T} stroke-width="1.5" stroke-dasharray="3 2" />
            <path d="M42 28 H86 V44 H42 Z" fill="none" stroke=${T} stroke-width="1.5" stroke-dasharray="3 2" />
        </g>
        <g class="gp-result">
            <path d="M42 10 H58 V26 H42 Z" fill=${E} fill-opacity="0.55" stroke=${E} stroke-width="2" />
            <path d="M42 28 H58 V44 H42 Z" fill=${E} fill-opacity="0.55" stroke=${E} stroke-width="2" />
        </g>`),union:M(i`
        ${P}${F}
        <g class="gp-result">
            <path d=${A} fill=${E} fill-opacity="0.3" stroke=${E} stroke-width="2" />
            <path d=${k} fill=${E} fill-opacity="0.7" stroke=${E} stroke-width="2" />
            <path d=${j} fill=${E} fill-opacity="0.3" stroke=${E} stroke-width="2" />
        </g>`),selectByLocation:M(i`
        <g class="gp-a">
            <circle cx="20" cy="16" r="3.5" fill="none" stroke=${w} stroke-width="1.5" />
            <circle cx="24" cy="38" r="3.5" fill="none" stroke=${w} stroke-width="1.5" />
            <circle cx="52" cy="20" r="3.5" fill="none" stroke=${w} stroke-width="1.5" />
            <circle cx="62" cy="34" r="3.5" fill="none" stroke=${w} stroke-width="1.5" />
            <circle cx="76" cy="22" r="3.5" fill="none" stroke=${w} stroke-width="1.5" />
        </g>
        ${N(`gp-b`,O,T)}
        <g class="gp-result">
            <circle cx="52" cy="20" r="3.5" fill=${E} />
            <circle cx="62" cy="34" r="3.5" fill=${E} />
            <circle cx="76" cy="22" r="3.5" fill=${E} />
        </g>`),spatialJoin:M(i`
        <g class="gp-a">
            <circle cx="18" cy="20" r="3.5" fill="none" stroke=${w} stroke-width="1.5" />
            <circle cx="18" cy="36" r="3.5" fill="none" stroke=${w} stroke-width="1.5" />
        </g>
        <g class="gp-b">
            <path d=${O} fill=${T} fill-opacity="0.12" stroke=${T} stroke-width="1.5" stroke-dasharray="3 2" />
            <text x="48" y="17" font-size="8" fill=${T}>abc</text>
        </g>
        <g class="gp-result">
            <circle cx="56" cy="30" r="3.5" fill=${E} />
            <circle cx="70" cy="36" r="3.5" fill=${E} />
            <text x="52" y="48" font-size="8" fill=${E}>abc</text>
        </g>`),dissolve:M(i`
        ${I(`M14 10 H86 V44 H14 Z`)}
        <g class="gp-a">
            <path d="M14 10 H50 V44 H14 Z" fill="none" stroke=${w} stroke-width="1.5" stroke-dasharray="3 2" />
            <path d="M50 10 H86 V44 H50 Z" fill="none" stroke=${w} stroke-width="1.5" stroke-dasharray="3 2" />
        </g>`),labelPoint:M(i`
        <g class="gp-a">
            <path d="M12 12 H28 V30 H44 V12 H60 V42 H12 Z"
                  fill="none" stroke=${w} stroke-width="1.5" stroke-dasharray="3 2" />
            <path d="M70 14 H88 V40 H70 Z" fill="none" stroke=${w} stroke-width="1.5" stroke-dasharray="3 2" />
        </g>
        <g class="gp-result">
            <circle cx="20" cy="25" r="4" fill=${E} />
            <circle cx="79" cy="27" r="4" fill=${E} />
        </g>`),statistics:M(i`
        <g class="gp-a">
            <path d="M10 12 H30 V26 H10 Z" fill="none" stroke=${w} stroke-width="1.5" stroke-dasharray="3 2" />
            <path d="M10 30 H30 V44 H10 Z" fill="none" stroke=${w} stroke-width="1.5" stroke-dasharray="3 2" />
            <path d="M34 12 H50 V44 H34 Z" fill="none" stroke=${w} stroke-width="1.5" stroke-dasharray="3 2" />
        </g>
        <g class="gp-result">
            <path d="M60 12 H92 M60 22 H92 M60 32 H92 M60 42 H92" stroke=${E} stroke-width="1.5" opacity="0.5" />
            <path d="M60 12 V44" stroke=${E} stroke-width="1.5" opacity="0.5" />
            <rect x="62" y="15" width="12" height="4" fill=${E} />
            <rect x="78" y="15" width="10" height="4" fill=${E} />
            <rect x="62" y="25" width="8" height="4" fill=${E} />
            <rect x="78" y="25" width="13" height="4" fill=${E} />
            <rect x="62" y="35" width="14" height="4" fill=${E} />
            <rect x="78" y="35" width="7" height="4" fill=${E} />
        </g>`),centroid:M(i`
        <g class="gp-a">
            <path d="M14 10 H50 V44 H14 Z" fill="none" stroke=${w} stroke-width="1.5" stroke-dasharray="3 2" />
            <path d="M54 10 H86 V44 H54 Z" fill="none" stroke=${w} stroke-width="1.5" stroke-dasharray="3 2" />
        </g>
        <g class="gp-result">
            <circle cx="32" cy="27" r="4" fill=${E} />
            <circle cx="70" cy="27" r="4" fill=${E} />
        </g>`),convexHull:M(i`
        <g class="gp-a">
            <circle cx="20" cy="34" r="2.5" fill=${w} />
            <circle cx="34" cy="12" r="2.5" fill=${w} />
            <circle cx="62" cy="10" r="2.5" fill=${w} />
            <circle cx="84" cy="26" r="2.5" fill=${w} />
            <circle cx="66" cy="44" r="2.5" fill=${w} />
            <circle cx="30" cy="42" r="2.5" fill=${w} />
            <circle cx="48" cy="26" r="2.5" fill=${w} />
            <circle cx="58" cy="32" r="2.5" fill=${w} />
        </g>
        <path class="gp-result" d="M20 34 L34 12 L62 10 L84 26 L66 44 L30 42 Z"
              fill=${E} fill-opacity="0.35" stroke=${E} stroke-width="2" />`),buffer:M(i`
        <path class="gp-result" d="M22 40 Q34 8 50 26 Q64 42 78 14"
              fill="none" stroke=${E} stroke-width="14" stroke-opacity="0.4"
              stroke-linecap="round" stroke-linejoin="round" />
        <path class="gp-a" d="M22 40 Q34 8 50 26 Q64 42 78 14"
              fill="none" stroke=${w} stroke-width="1.5" stroke-dasharray="3 2" />`),cartogram:M(i`
        <g class="gp-a">
            <path d="M14 12 H36 V34 H14 Z" fill="none" stroke=${w} stroke-width="1.5" stroke-dasharray="3 2" />
            <path d="M42 12 H64 V34 H42 Z" fill="none" stroke=${w} stroke-width="1.5" stroke-dasharray="3 2" />
            <path d="M70 12 H92 V34 H70 Z" fill="none" stroke=${w} stroke-width="1.5" stroke-dasharray="3 2" />
        </g>
        <g class="gp-result">
            <path d="M20 18 H30 V28 H20 Z" fill=${E} fill-opacity="0.55" stroke=${E} stroke-width="2" />
            <path d="M40 10 H66 V36 H40 Z" fill=${E} fill-opacity="0.55" stroke=${E} stroke-width="2" />
            <path d="M74 15 H88 V31 H74 Z" fill=${E} fill-opacity="0.55" stroke=${E} stroke-width="2" />
        </g>`),voronoi:M(i`
        <g class="gp-result">
            <path d="M12 26 L34 20 L38 6" fill="none" stroke=${E} stroke-width="2" />
            <path d="M34 20 L58 30 L54 46" fill="none" stroke=${E} stroke-width="2" />
            <path d="M34 20 L48 12 L52 2" fill="none" stroke=${E} stroke-width="2" />
            <path d="M58 30 L80 24 L92 32" fill="none" stroke=${E} stroke-width="2" />
            <path d="M58 30 L64 48" fill="none" stroke=${E} stroke-width="2" />
            <path d="M48 12 L74 16 L80 24" fill="none" stroke=${E} stroke-width="2" />
            <path d="M74 16 L78 4" fill="none" stroke=${E} stroke-width="2" />
        </g>
        <g class="gp-a">
            <circle cx="22" cy="14" r="2.5" fill=${w} />
            <circle cx="26" cy="38" r="2.5" fill=${w} />
            <circle cx="48" cy="34" r="2.5" fill=${w} />
            <circle cx="56" cy="12" r="2.5" fill=${w} />
            <circle cx="74" cy="36" r="2.5" fill=${w} />
            <circle cx="84" cy="12" r="2.5" fill=${w} />
        </g>`),delaunay:M(i`
        <g class="gp-result">
            <path d="M22 14 L26 38 L48 34 Z" fill=${E} fill-opacity="0.25" stroke=${E} stroke-width="2" />
            <path d="M22 14 L48 34 L56 12 Z" fill=${E} fill-opacity="0.25" stroke=${E} stroke-width="2" />
            <path d="M48 34 L74 36 L56 12 Z" fill=${E} fill-opacity="0.25" stroke=${E} stroke-width="2" />
            <path d="M56 12 L74 36 L84 12 Z" fill=${E} fill-opacity="0.25" stroke=${E} stroke-width="2" />
        </g>
        <g class="gp-a">
            <circle cx="22" cy="14" r="2.5" fill=${w} />
            <circle cx="26" cy="38" r="2.5" fill=${w} />
            <circle cx="48" cy="34" r="2.5" fill=${w} />
            <circle cx="56" cy="12" r="2.5" fill=${w} />
            <circle cx="74" cy="36" r="2.5" fill=${w} />
            <circle cx="84" cy="12" r="2.5" fill=${w} />
        </g>`),simplify:M(i`
        <path class="gp-a" d="M12 38 L22 18 L30 30 L38 12 L48 32 L58 14 L68 34 L78 16 L88 30"
              fill="none" stroke=${w} stroke-width="1.5" stroke-dasharray="3 2" />
        <path class="gp-result" d="M12 38 L38 14 L68 32 L88 18" fill="none" stroke=${E} stroke-width="2.5" />`)};function R(e){return L[e]??null}var z=`webmapx-geoprocessing-out:`,B=`webmapx-geoprocessing-src:`,V=new Set([`fill`,`line`,`circle`,`symbol`,`geojson`,`vector`,`label`,`fill-extrusion`]),H=class extends v{constructor(...e){super(...e),this.toolId=`geoprocessing`,this.pinnedOperation=``,this.availableLayers=[],this.operationId=``,this.slots={a:{layerId:``,sourceLayer:``},b:{layerId:``,sourceLayer:``}},this.params={},this.openHints=new Set,this.outputName=``,this.outputNameEdited=!1,this.overwrite=!0,this.busy=!1,this.error=null,this.notice=null,this.summary=null,this.table=null,this.elapsed=0,this.busyDetail=``,this.elapsedTimer=null,this.lastOutputLayerId=null,this.fieldNames={a:[],b:[]},this.numericFieldNames={a:[],b:[]},this.fieldsLoading=!1,this.lastMapLayers=null,this.lastMapBusy=!1,this.escHandler=null,this.fieldLoadToken=0,this.hintWidthObserver=null}static{this.styles=[y,C,a`
        :host { display: block; }

        :host(:not([active])) .tool-content { display: none; }

        .tool-content {
            padding: var(--sl-spacing-medium);
            display: flex;
            flex-direction: column;
            gap: var(--sl-spacing-small);
            font-size: var(--sl-font-size-small);
        }

        .category {
            margin-bottom: var(--sl-spacing-x-small);
        }

        /* Two columns, so the panel keeps the shared 300px default width. */
        .grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: var(--sl-spacing-x-small);
        }

        .op {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 2px;
            padding: 6px 4px;
            border: 1px solid var(--color-border, #d5dbe1);
            border-radius: var(--webmapx-radius-md, 6px);
            background: none;
            color: inherit;
            font: inherit;
            font-size: var(--sl-font-size-x-small);
            line-height: 1.2;
            text-align: center;
            cursor: pointer;
        }

        .op:hover { border-color: var(--color-primary, #3a6ea5); }

        .op:focus-visible {
            outline: var(--webmapx-focus-width, 2px) solid var(--webmapx-focus-color, #3a6ea5);
            outline-offset: var(--webmapx-focus-offset, 2px);
        }

        .op svg { width: 100%; height: auto; display: block; }

        /*
         * Hover walks the diagram through the operation: first input A, then B is
         * added, then the result appears. At rest everything is shown at once, so
         * the grid still reads without pointing at anything — and touch devices,
         * which never hover, lose nothing.
         *
         * Selectors are on the group classes the diagram module emits (.gp-a /
         * .gp-b / .gp-result), so a new diagram animates without extra CSS.
         *
         * Hover only, deliberately not :focus-visible: the panel moves focus to
         * the first tool control on activation, which would leave the first
         * operation looping the moment the panel opens.
         */
        .op:hover .gp-b,
        .chosen:hover .gp-b {
            animation: gp-show-b 2.4s ease-in-out infinite;
        }

        .op:hover .gp-result,
        .chosen:hover .gp-result {
            animation: gp-show-result 2.4s ease-in-out infinite;
        }

        /* B joins a third of the way in, the result two thirds in — both share the
           2.4s cycle so the three phases stay locked together. */
        @keyframes gp-show-b {
            0%, 28% { opacity: 0; }
            36%, 100% { opacity: 1; }
        }

        @keyframes gp-show-result {
            0%, 61% { opacity: 0; }
            69%, 100% { opacity: 1; }
        }

        /* Stacked, not side by side: at the panel's 300px the description would be
           squeezed into a ~90px column and run to a dozen lines. */
        .chosen {
            display: flex;
            flex-direction: column;
            gap: 4px;
            padding: var(--sl-spacing-x-small);
            border: 1px solid var(--color-border, #d5dbe1);
            border-radius: var(--webmapx-radius-md, 6px);
        }

        .chosen-head {
            display: flex;
            align-items: center;
            gap: var(--sl-spacing-x-small);
        }

        .chosen svg { width: 72px; height: auto; flex: none; }

        .chosen .name { flex: 1; min-width: 0; font-weight: 600; }

        .chosen .description {
            font-size: var(--sl-font-size-x-small);
            color: var(--color-text-secondary, #5a6773);
        }

        .hint {
            font-size: var(--sl-font-size-x-small);
            color: var(--color-text-secondary, #5a6773);
            margin-top: 2px;
        }

        /* Not an sl-alert: this sits under a form field and must not shout, but
           it does need to be distinguishable from the neutral hint above it. */
        .hint.warning {
            display: flex;
            align-items: baseline;
            gap: 4px;
            color: var(--sl-color-warning-700, #915930);
        }

        /* A clipped hint is one line: the text takes what room there is and ends
           in an ellipsis, and the more-link sits at the end of that line. Baseline
           alignment so the link sits on the text's line, not on the box. */
        .hint.clipped {
            display: flex;
            align-items: baseline;
            gap: 4px;
        }

        /* min-width:0 is what actually lets a flex child shrink far enough to
           overflow — without it the text refuses to clip and pushes the
           more-link out of the panel. */
        .hint.clipped .hint-text {
            flex: 1;
            min-width: 0;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }

        /* Hidden until the text is measured as actually clipped, so a hint that
           already fits gets no more-link. markClippedHints adds the class. */
        .hint-more { display: none; }
        .hint.is-clipped .hint-more { display: inline; }

        /* Blue, because it is a link in everything but markup: it reveals the
           rest of a sentence rather than performing an action. */
        .hint-more {
            flex: none;
            border: 0;
            padding: 0;
            background: none;
            font: inherit;
            color: var(--color-primary, #1b6ec2);
            cursor: pointer;
        }

        .hint-more:hover { text-decoration: underline; }

        /* Never strip a focus ring without putting an equivalent back. */
        .hint-more:focus-visible {
            outline: var(--webmapx-focus-ring-width, 2px) solid var(--webmapx-focus-ring-color, #1b6ec2);
            outline-offset: 2px;
            border-radius: 2px;
        }

        .field-label {
            display: block;
            margin-bottom: 4px;
        }

        .agg-row {
            display: grid;
            grid-template-columns: 1fr 1fr auto;
            align-items: center;
            gap: 4px;
            margin-bottom: 4px;
        }

        /* Indented under its row: these belong to the list function above them,
           and only appear when it is chosen. Wrapping, not a fixed grid — three
           controls do not fit across a 300px panel. */
        .agg-options {
            display: flex;
            flex-wrap: wrap;
            align-items: center;
            gap: 4px;
            margin: 0 0 8px 12px;
        }

        .agg-options sl-input { flex: 1 1 90px; min-width: 70px; }
        .agg-options sl-select { flex: 0 1 110px; }

        /* The table scrolls inside its own box: at 300px it cannot be shown in
           full, and widening the panel would push the buttons off screen. */
        .table-wrap {
            max-height: 240px;
            overflow: auto;
            border: 1px solid var(--color-border, #d5dbe1);
            border-radius: var(--webmapx-radius-md, 6px);
        }

        table {
            border-collapse: collapse;
            font-size: var(--sl-font-size-x-small);
            white-space: nowrap;
        }

        th, td {
            padding: 3px 8px;
            text-align: left;
            border-bottom: 1px solid var(--color-border, #d5dbe1);
        }

        th {
            position: sticky;
            top: 0;
            background: var(--color-surface, #ffffff);
            font-weight: 600;
        }

        td:not(:first-child) { text-align: right; }

        tbody tr:last-child td { border-bottom: none; }

        .summary {
            font-size: var(--sl-font-size-x-small);
            color: var(--color-text-secondary, #5a6773);
            border-top: 1px solid var(--color-border, #d5dbe1);
            padding-top: var(--sl-spacing-x-small);
        }

        .actions {
            display: flex;
            align-items: center;
            gap: var(--sl-spacing-x-small);
            justify-content: flex-end;
            margin-top: var(--sl-spacing-x-small);
        }

        .status {
            display: flex;
            align-items: center;
            gap: var(--sl-spacing-x-small);
            margin-right: auto;
            font-size: var(--sl-font-size-x-small);
            color: var(--color-text-secondary, #5a6773);
        }

        sl-alert { font-size: var(--sl-font-size-x-small); }

        sl-select, sl-input {
            --sl-input-height-medium: 28px;
            --sl-input-font-size-medium: var(--sl-font-size-small);
        }

        /* The animation is explanatory, not decorative — but it loops, so it must
           stop entirely rather than merely shorten when motion is unwelcome. */
        @media (prefers-reduced-motion: reduce) {
            .op:hover .gp-b,
            .op:focus-visible .gp-b,
            .chosen:hover .gp-b,
            .op:hover .gp-result,
            .op:focus-visible .gp-result,
            .chosen:hover .gp-result {
                animation: none;
            }
        }
    `]}onActivate(){this.pinnedOperation&&this.operationId!==this.pinnedOperation&&this.handleOperationSelect(this.pinnedOperation),this.escHandler=e=>{e.key===`Escape`&&this.deactivate()},document.addEventListener(`keydown`,this.escHandler),this.afterPaint().then(()=>h())}onDeactivate(){this.escHandler&&document.removeEventListener(`keydown`,this.escHandler),this.escHandler=null}onStateChanged(e){let t=e.mapLayers??{};this.lastMapLayers=t,this.availableLayers=Object.entries(t).filter(([,e])=>{let t=e.layerType;return!t||V.has(t)}).map(([e,t])=>({id:e,label:t.label??e}));for(let e of[`a`,`b`]){let t=this.slots[e];t.layerId&&!this.availableLayers.some(e=>e.id===t.layerId)&&(this.setSlot(e,{layerId:``,sourceLayer:``}),this.clearFieldNames(e))}this.lastOutputLayerId&&!t[this.lastOutputLayerId]&&(this.lastOutputLayerId=null),this.autoSelectLayers();let n=e.mapBusy===!0,r=this.lastMapBusy&&!n;if(this.lastMapBusy=n,r)for(let e of[`a`,`b`])this.slots[e].layerId&&!this.fieldNames[e].length&&this.loadFieldNames(e)}dropUnknownFieldParams(e){let t=this.operation;if(!t)return;let n=this.params;for(let r of t.params)if(!(r.kind!==`field`&&r.kind!==`aggregations`)&&r.from===e){if(r.kind===`field`){let t=r.numericOnly?this.numericFieldNames[e]:this.fieldNames[e],i=String(n[r.key]??``);i&&!t.includes(i)&&(n={...n,[r.key]:``})}else if(r.kind===`aggregations`){let t=this.aggregationsFor(r.key),i=t.filter(t=>this.fieldNames[e].includes(t.field));i.length!==t.length&&(n={...n,[r.key]:i})}}n!==this.params&&(this.params=n,this.syncOutputName())}clearFieldNames(e){this.fieldNames={...this.fieldNames,[e]:[]},this.numericFieldNames={...this.numericFieldNames,[e]:[]}}get operation(){return m(this.operationId)}labelOf(e){return this.availableLayers.find(t=>t.id===e)?.label??e}sourceLayers(e){let t=(this.lastMapLayers??{})[e]?.sublayers;if(!Array.isArray(t))return[];let n=new Set,r=e=>{for(let t of e){if(!t||typeof t!=`object`)continue;let e=t,i=e[`source-layer`];typeof i==`string`&&i&&n.add(i),Array.isArray(e.sublayers)&&r(e.sublayers)}};return r(t),[...n]}isViewportLimited(e){let t=(this.lastMapLayers??{})[e]?.sourceId;return g(this.adapter,t)}get mapElement(){return this.mapHost}setSlot(e,t){this.slots={...this.slots,[e]:{...this.slots[e],...t}}}autoSelectLayers(){let e=this.operation;if(e){for(let t of e.inputs){if(this.slots[t.key].layerId)continue;let n=new Set(e.inputs.map(e=>this.slots[e.key].layerId).filter(Boolean)),r=this.availableLayers.find(e=>!n.has(e.id));r&&this.selectLayer(t.key,r.id,!1)}this.syncOutputName()}}selectLayer(e,t,n=!0){let r=this.sourceLayers(t);this.setSlot(e,{layerId:t,sourceLayer:r[0]??``}),this.clearFieldNames(e),this.error=null,n&&(this.lastOutputLayerId=null,this.syncOutputName()),this.loadFieldNames(e)}handleOperationSelect(e){let t=m(e);t&&(this.operationId=e,this.params=f(t),this.error=null,this.notice=null,this.summary=null,this.table=null,this.lastOutputLayerId=null,this.outputNameEdited=!1,this.autoSelectLayers(),this.loadFieldNames(`a`),t.inputs.some(e=>e.key===`b`)&&this.loadFieldNames(`b`))}syncOutputName(){if(this.outputNameEdited)return;let e=this.operation;if(!e)return;let t=this.slots.a.sourceLayer||this.labelOf(this.slots.a.layerId),n=this.slots.b.sourceLayer||this.labelOf(this.slots.b.layerId);this.outputName=e.outputName(t||`layer`,n||`layer`)}async loadFieldNames(e){let t=this.operation;if(!t||!t.params.some(t=>(t.kind===`field`||t.kind===`aggregations`)&&t.from===e)||!this.slots[e].layerId||!this.adapter)return;let n=++this.fieldLoadToken;this.fieldsLoading=!0;try{if(await this.afterPaint(),n!==this.fieldLoadToken)return;let t=await this.queryFeatures(e);if(n!==this.fieldLoadToken)return;let r=new Set,i=new Set,a=new Set;for(let e of t.features)for(let[t,n]of Object.entries(e.properties??{}))!t||typeof n==`object`&&n||(r.add(t),typeof n==`number`?i.add(t):n!==null&&a.add(t));for(let e of a)i.delete(e);this.fieldNames={...this.fieldNames,[e]:[...r]},this.numericFieldNames={...this.numericFieldNames,[e]:[...i]},this.dropUnknownFieldParams(e)}catch{n===this.fieldLoadToken&&(this.fieldNames={...this.fieldNames,[e]:[]},this.numericFieldNames={...this.numericFieldNames,[e]:[]})}finally{n===this.fieldLoadToken&&(this.fieldsLoading=!1)}}async afterPaint(){await this.updateComplete,await new Promise(e=>requestAnimationFrame(()=>e(null)))}queryFeatures(e){let t=this.slots[e],n=t.sourceLayer?{sourceLayer:t.sourceLayer}:void 0;return this.adapter.queryLayerFeatures(t.layerId,n)}async handleRun(){let e=this.operation;if(!e||!this.adapter||this.busy)return;let t=e.inputs.some(e=>e.key===`b`);if(!this.slots.a.layerId||t&&!this.slots.b.layerId){this.error=`Choose an input layer for every slot.`;return}this.busy=!0,this.error=null,this.notice=null,this.summary=null,this.table=null,this.busyDetail=``,this.startElapsedTimer();try{let n=await this.queryFeatures(`a`);if(!n.features.length){this.error=this.emptyInputMessage(`a`);return}let r;if(t&&(r=await this.queryFeatures(`b`),!r.features.length)){this.error=this.emptyInputMessage(`b`);return}let i=r?`${n.features.length} × ${r.features.length} features`:`${n.features.length} features`;this.busyDetail=i;let a=await d({op:`geoprocess`,operationId:e.id,inputA:n,inputB:r,params:this.params,centerLat:this.adapter.getViewportState().center[1]??0},e=>{this.busyDetail=`${i} — ${e}`});this.summary=this.runSummary(e,n,r,a);let o=a.warnings??[];if(o.length&&(this.notice=o.join(` `)),!a.features.length){this.notice=[`${e.label} produced no features — the layers may not overlap.`,...o].join(` `);return}if(e.outputGeometry===`table`){this.table=a.features.map(e=>e.properties??{});return}await this.addResultLayer(e,a)}catch(t){t instanceof c?(this.notice=`${e.label} cancelled after ${this.elapsed} s.`,this.summary=null):(console.error(`[geoprocessing] ${e.id} failed`,t),this.error=t instanceof Error?t.message:String(t))}finally{this.busy=!1,this.stopElapsedTimer()}}startElapsedTimer(){this.stopElapsedTimer(),this.elapsed=0;let e=Date.now();this.elapsedTimer=setInterval(()=>{this.elapsed=Math.round((Date.now()-e)/1e3)},1e3)}stopElapsedTimer(){this.elapsedTimer&&clearInterval(this.elapsedTimer),this.elapsedTimer=null}handleCancel(){this.busy&&u()}emptyInputMessage(e){let t=this.labelOf(this.slots[e].layerId);return this.isViewportLimited(this.slots[e].layerId)?`“${t}” has no features in view. Only what the map has drawn is used, so make sure the layer is switched on, is within its zoom range, and that the features you need are on screen — a layer filter also removes features here.`:`“${t}” has no features.`}runSummary(e,t,n,r){let i=e=>`${e} ${e===1?`feature`:`features`}`,a=[`${i(t.features.length)} from “${this.labelOf(this.slots.a.layerId)}”`];return n&&a.push(`${i(n.features.length)} from “${this.labelOf(this.slots.b.layerId)}”`),`${e.label} used ${a.join(` and `)} → ${i(r.features.length)}.`}resultAbstract(e){let t=[this.labelOf(this.slots.a.layerId),this.slots.b.layerId?this.labelOf(this.slots.b.layerId):null].filter(e=>!!e).join(`, `),n=Object.entries(this.params).map(([e,t])=>`${e}: ${t}`).join(`, `),r=`Created with webmapx tool ${e.label}, parameters: {${n}} from layer: ${t}`,i=e.attribution?.(this.params);return i?`${r}. ${i}`:r}async addResultLayer(e,t){let n=this.overwrite?``:`-${Date.now()}`,r=`${z}${e.id}:${this.slots.a.layerId}${n}`,i=`${B}${e.id}:${this.slots.a.layerId}${n}`;if(this.overwrite&&this.lastOutputLayerId&&this.mapElement){this.adapter?.getSource(i)?.setData({type:`FeatureCollection`,features:[]});try{this.mapElement.removeInlineLayer(this.lastOutputLayerId)}catch{}}let a=this.outputName.trim()||e.outputName(this.labelOf(this.slots.a.layerId),this.labelOf(this.slots.b.layerId)),o=this.resultAbstract(e),s={id:r,source:i,sources:{[i]:{id:i,type:`geojson`,data:t}},...this.styleFor(t),metadata:{label:a,abstract:o,dynamic:!0,legendRole:`overlay`}};await this.mapElement?.addLayerRequest(s),this.lastOutputLayerId=r;let c=Array.isArray(t.features)?t.features.length:0;S(this,`${a} added to the map, ${c} ${c===1?`feature`:`features`}`)}styleFor(e){let t=new Set(e.features.map(e=>e.geometry?.type).filter(Boolean)),n=(...e)=>e.some(e=>t.has(e));return n(`Polygon`,`MultiPolygon`)?{type:`fill`,paint:{"fill-color":b,"fill-opacity":.35,"fill-outline-color":x}}:n(`LineString`,`MultiLineString`)?{type:`line`,paint:{"line-color":b,"line-width":3}}:{type:`circle`,paint:{"circle-color":b,"circle-radius":5,"circle-stroke-color":`#ffffff`,"circle-stroke-width":1.5}}}render(){return o`
            <div class="tool-content">
                ${this.operation?this.renderChosenOperation(this.operation):this.pinnedOperation?e:this.renderOperationGrid()}
                ${this.operation?this.renderForm(this.operation):e}
                ${this.table?this.renderTable(this.table):e}
                ${this.summary?o`<div class="summary">${this.summary}</div>`:e}
                ${this.renderMessages()}
                ${this.renderActions()}
            </div>
        `}renderOperationGrid(){return o`
            <div class="hint">Choose what you want to do:</div>
            ${[...new Set(l.map(e=>e.category))].map(e=>o`
                <section class="panel-section">
                <div class="category section-heading">${p[e]}</div>
                <div class="grid">
                    ${l.filter(t=>t.category===e).map(e=>o`
                        <button
                            class="op"
                            type="button"
                            title=${e.description}
                            @click=${()=>this.handleOperationSelect(e.id)}
                        >
                            ${R(e.id)}
                            <span>${e.label}</span>
                        </button>
                    `)}
                </div>
                </section>
            `)}
        `}renderChosenOperation(t){return o`
            <div class="chosen">
                <div class="chosen-head">
                    ${R(t.id)}
                    <!-- A pinned operation is the panel's own title ("Cartogram"),
                         so naming it again here only repeats it. -->
                    ${this.pinnedOperation?e:o`<div class="name">${t.label}</div>`}
                    ${this.pinnedOperation?e:o`
                        <sl-button
                            size="small"
                            variant="text"
                            ?disabled=${this.busy}
                            @click=${()=>{this.operationId=``,this.error=null,this.notice=null,this.summary=null,this.table=null}}
                        >Change</sl-button>
                    `}
                </div>
                <div class="description">${t.description}</div>
            </div>
        `}renderForm(t){let n=this.availableLayers.length>0;return o`
            ${t.inputs.map(t=>{let r=this.slots[t.key],i=this.sourceLayers(r.layerId);return o`
                    <div>
                        <sl-select
                            label=${t.label}
                            size="small"
                            value=${r.layerId}
                            ?disabled=${!n||this.busy}
                            @sl-change=${e=>this.selectLayer(t.key,e.target.value)}
                        >
                            ${n?this.availableLayers.map(e=>o`<sl-option value=${e.id}>${e.label}</sl-option>`):o`<sl-option value="">No vector layers on the map</sl-option>`}
                        </sl-select>
                        ${this.renderHint(`input:${t.key}`,t.hint)}
                        ${r.layerId&&this.isViewportLimited(r.layerId)?o`
                            <div class="hint warning">
                                <sl-icon name="exclamation-triangle"></sl-icon>
                                Only the features drawn in the current view are used.
                            </div>
                        `:e}
                        ${i.length>1?o`
                            <sl-select
                                label="Sub-layer"
                                size="small"
                                value=${r.sourceLayer}
                                ?disabled=${this.busy}
                                @sl-change=${e=>{this.setSlot(t.key,{sourceLayer:e.target.value}),this.fieldNames={...this.fieldNames,[t.key]:[]},this.syncOutputName(),this.loadFieldNames(t.key)}}
                            >
                                ${i.map(e=>o`<sl-option value=${e}>${e}</sl-option>`)}
                            </sl-select>
                        `:e}
                    </div>
                `})}

            ${t.params.filter(e=>e.showWhen?.(this.params)!==!1).map(e=>this.renderParam(e))}

            ${t.outputGeometry===`table`?e:o`
                <sl-input
                    label="Output layer name"
                    size="small"
                    .value=${this.outputName}
                    ?disabled=${this.busy}
                    @sl-change=${e=>{this.outputName=e.target.value,this.outputNameEdited=!0}}
                ></sl-input>
            `}

            ${this.lastOutputLayerId?o`
                <sl-checkbox
                    size="small"
                    ?checked=${this.overwrite}
                    ?disabled=${this.busy}
                    @sl-change=${e=>{this.overwrite=e.target.checked}}
                >Replace previous result</sl-checkbox>
            `:e}
        `}updated(e){super.updated?.(e),this.markClippedHints(),e.has(`error`)&&this.error&&S(this,this.error),e.has(`notice`)&&this.notice&&S(this,this.notice)}markClippedHints(){let e=this.shadowRoot?.querySelectorAll(`.hint.clipped`);if(e)for(let t of e){let e=t.querySelector(`.hint-text`);e&&t.classList.toggle(`is-clipped`,e.scrollWidth>e.clientWidth+1)}}firstUpdated(e){super.firstUpdated?.(e),!(typeof ResizeObserver>`u`)&&(this.hintWidthObserver=new ResizeObserver(()=>this.markClippedHints()),this.hintWidthObserver.observe(this))}renderHint(t,n){if(!n)return e;let r=this.openHints.has(t);return o`
            <div class="hint ${r?`open`:`clipped`}" data-hint=${t}>
                <span class="hint-text">${n}</span>
                ${r?e:o`
                    <button
                        type="button"
                        class="hint-more"
                        title=${n}
                        @click=${()=>{this.openHints=new Set([...this.openHints,t])}}
                    >more…</button>
                `}
            </div>
        `}renderParamHint(e){return this.renderHint(`param:${e.key}`,e.hint)}renderParam(t){let n=e=>{this.params={...this.params,[t.key]:e}};if(t.kind===`number`)return o`
                <div>
                    <sl-input
                        label=${t.label}
                        size="small"
                        type="number"
                        min=${t.min??e}
                        max=${t.max??e}
                        step=${t.step??e}
                        value=${String(this.params[t.key]??t.default)}
                        ?disabled=${this.busy}
                        @sl-change=${e=>{let t=parseFloat(e.target.value);Number.isNaN(t)||n(t)}}
                    >
                        ${t.unit?o`<span slot="suffix">${t.unit}</span>`:e}
                    </sl-input>
                    ${this.renderParamHint(t)}
                </div>
            `;if(t.kind===`select`)return o`
                <div>
                    <sl-select
                        label=${t.label}
                        size="small"
                        value=${String(this.params[t.key]??t.default)}
                        ?disabled=${this.busy}
                        @sl-change=${e=>n(e.target.value)}
                    >
                        ${t.options.map(e=>o`<sl-option value=${e.value}>${e.label}</sl-option>`)}
                    </sl-select>
                    ${this.renderParamHint(t)}
                </div>
            `;if(t.kind===`aggregations`)return this.renderAggregations(t);let r=t.numericOnly?this.numericFieldNames[t.from]:this.fieldNames[t.from];return o`
            <div>
                <sl-select
                    label=${t.label}
                    size="small"
                    value=${String(this.params[t.key]??``)}
                    ?disabled=${this.busy||!r.length}
                    @sl-change=${e=>n(e.target.value)}
                >
                    ${t.optional?o`<sl-option value="">(all features together)</sl-option>`:e}
                    ${r.map(e=>o`<sl-option value=${e}>${e}</sl-option>`)}
                </sl-select>
                ${this.renderParamHint(t)}
            </div>
        `}renderAggregations(t){let n=this.aggregationsFor(t.key),r=this.fieldNames[t.from],i=this.numericFieldNames[t.from],a=e=>i.includes(e),c=e=>s.filter(t=>!t.numericOnly||a(e)),l=e=>{this.params={...this.params,[t.key]:e}},u=(e,n)=>{l(this.aggregationsFor(t.key).map((t,r)=>r===e?{...t,...n}:t))};return o`
            <div>
                <label class="field-label">${t.label}</label>
                ${n.map((n,i)=>o`
                    <div class="agg-row">
                        <sl-select
                            size="small"
                            value=${n.field}
                            ?disabled=${this.busy||!r.length}
                            @sl-change=${e=>{let t=e.target.value,r=c(t);u(i,{field:t,fn:r.some(e=>e.value===n.fn)?n.fn:r[0].value})}}
                        >
                            ${r.map(e=>o`<sl-option value=${e}>${e}</sl-option>`)}
                        </sl-select>
                        <sl-select
                            size="small"
                            value=${n.fn}
                            ?disabled=${this.busy}
                            @sl-change=${e=>u(i,{fn:e.target.value})}
                        >
                            ${c(n.field).map(e=>o`
                                <sl-option value=${e.value}>${e.label}</sl-option>
                            `)}
                        </sl-select>
                        <sl-icon-button
                            name="x-lg"
                            label="Remove"
                            ?disabled=${this.busy}
                            @click=${()=>l(this.aggregationsFor(t.key).filter((e,t)=>t!==i))}
                        ></sl-icon-button>
                    </div>
                    ${n.fn===`list`?o`
                        <div class="agg-options">
                            <sl-input
                                size="small"
                                placeholder="separator"
                                .value=${n.separator??`, `}
                                ?disabled=${this.busy}
                                @sl-change=${e=>u(i,{separator:e.target.value})}
                            ></sl-input>
                            <sl-select
                                size="small"
                                value=${n.order??`asc`}
                                ?disabled=${this.busy}
                                @sl-change=${e=>u(i,{order:e.target.value})}
                            >
                                <sl-option value="asc">A → Z</sl-option>
                                <sl-option value="desc">Z → A</sl-option>
                            </sl-select>
                            <sl-checkbox
                                size="small"
                                ?checked=${n.unique??!1}
                                ?disabled=${this.busy}
                                @sl-change=${e=>u(i,{unique:e.target.checked})}
                            >once</sl-checkbox>
                        </div>
                    `:e}
                `)}
                <sl-button
                    size="small"
                    variant="text"
                    ?disabled=${this.busy||!r.length}
                    @click=${()=>l([...this.aggregationsFor(t.key),i.length?{field:i[0],fn:`sum`}:{field:r[0]??``,fn:`count`}])}
                >
                    <sl-icon slot="prefix" name="plus-lg"></sl-icon>
                    Add attribute
                </sl-button>
                ${this.renderParamHint(t)}
            </div>
        `}aggregationsFor(e){let t=this.params[e];return Array.isArray(t)?t:[]}renderTable(e){let t=[...new Set(e.flatMap(e=>Object.keys(e)))],n=e=>typeof e==`number`?Number(e.toFixed(3)).toLocaleString():String(e??``);return o`
            <div class="table-wrap">
                <table>
                    <thead>
                        <tr>${t.map(e=>o`<th>${e}</th>`)}</tr>
                    </thead>
                    <tbody>
                        ${e.map(e=>o`
                            <tr>${t.map(t=>o`<td>${n(e[t])}</td>`)}</tr>
                        `)}
                    </tbody>
                </table>
            </div>
            <sl-button
                size="small"
                variant="text"
                @click=${()=>this.copyTable(t,e)}
            >
                <sl-icon slot="prefix" name="clipboard"></sl-icon>
                Copy as text
            </sl-button>
        `}async copyTable(e,t){let n=[e.join(`	`),...t.map(t=>e.map(e=>String(t[e]??``)).join(`	`))];try{await navigator.clipboard.writeText(n.join(`
`)),this.notice=`Table copied to the clipboard.`}catch{this.error=`Could not copy — your browser blocked clipboard access.`}}renderMessages(){return this.error?o`
                <sl-alert variant="danger" open>
                    <sl-icon slot="icon" name="exclamation-octagon"></sl-icon>
                    ${this.error}
                </sl-alert>
            `:this.notice?o`
                <sl-alert variant="warning" open>
                    <sl-icon slot="icon" name="exclamation-triangle"></sl-icon>
                    ${this.notice}
                </sl-alert>
            `:e}hasMissingRequiredField(){let e=this.operation;return e?e.params.some(e=>e.kind===`field`&&!e.optional&&!String(this.params[e.key]??``).trim()):!1}renderActions(){let t=this.operation;return o`
            <div class="actions">
                ${this.busy?o`
                    <div class="status">
                        <sl-spinner></sl-spinner>
                        <span>
                            Calculating${this.busyDetail?o` ${this.busyDetail}`:e}…
                            ${this.elapsed>2?o`${this.elapsed} s`:e}
                        </span>
                    </div>
                `:e}
                ${this.busy?o`
                        <sl-button size="small" variant="danger" outline @click=${this.handleCancel}>
                            Cancel
                        </sl-button>`:o`
                        <sl-button
                            size="small"
                            variant="primary"
                            ?disabled=${!t||!this.availableLayers.length||this.hasMissingRequiredField()}
                            @click=${this.handleRun}
                        >Calculate</sl-button>`}
            </div>`}disconnectedCallback(){super.disconnectedCallback(),this.stopElapsedTimer(),this.hintWidthObserver?.disconnect(),this.hintWidthObserver=null}};_([n({type:String,attribute:`operation`})],H.prototype,`pinnedOperation`,void 0),_([r()],H.prototype,`availableLayers`,void 0),_([r()],H.prototype,`operationId`,void 0),_([r()],H.prototype,`slots`,void 0),_([r()],H.prototype,`params`,void 0),_([r()],H.prototype,`openHints`,void 0),_([r()],H.prototype,`outputName`,void 0),_([r()],H.prototype,`outputNameEdited`,void 0),_([r()],H.prototype,`overwrite`,void 0),_([r()],H.prototype,`busy`,void 0),_([r()],H.prototype,`error`,void 0),_([r()],H.prototype,`notice`,void 0),_([r()],H.prototype,`summary`,void 0),_([r()],H.prototype,`table`,void 0),_([r()],H.prototype,`elapsed`,void 0),_([r()],H.prototype,`busyDetail`,void 0),_([r()],H.prototype,`lastOutputLayerId`,void 0),_([r()],H.prototype,`fieldNames`,void 0),_([r()],H.prototype,`numericFieldNames`,void 0),_([r()],H.prototype,`fieldsLoading`,void 0),H=_([t(`webmapx-geoprocessing-tool`)],H);export{H as t};