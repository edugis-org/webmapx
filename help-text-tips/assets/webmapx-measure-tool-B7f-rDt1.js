import"./vendor-shoelace-B1bS8YN5.js";import{_ as e,h as t,m as n,p as r,x as i,y as a}from"./vendor-lit-DP8NDNGT.js";import{_t as o,bt as s,vt as c,yt as l}from"./webmapx-shared-wz7zw7_7.js";import{h as u,y as d}from"./cesium-adapter-DCP1QrEw.js";import{t as f}from"./decorate-DQd3KUs4.js";import{t as p}from"./webmapx-modal-tool-OHGwAkdU.js";import{t as m}from"./form-label-styles-CUvG5W-2.js";import{a as h,i as g}from"./data-colors-BXVfrRzV.js";import{t as _}from"./help-text-styles-DMkkN2Q2.js";import{t as v}from"./announce-BnK8C14J.js";import{t as y}from"./touch-pointer-CvO0aCw9.js";import{n as b,t as x}from"./add-layer-icon-BSjJ7Zon.js";var S,C=`webmapx-measure-static-source`,w=`webmapx-measure-points`,T=`webmapx-measure-lines`,E=`webmapx-measure-polygon`,D=`webmapx-measure-segment-labels`,O=`webmapx-measure-rubberband-source`,k=`measurement`,A=`webmapx-measure-rubberband-layer`,j=`webmapx-measure-snap-layer`,M=16,N=`webmapx-measure-units`;function P(){try{return localStorage.getItem(N)===`imperial`?`imperial`:`metric`}catch{return`metric`}}function F(e){return Math.round(e*1e3)/1e3}function I(e){return Math.round(e*1e7)/1e7}var L=class extends p{static{S=this}constructor(...e){super(...e),this.toolId=`measure`,this.closeThreshold=14,this.finishThreshold=10,this.points=[],this.segments=[],this.totalDistanceCm=0,this.cursorPosition=null,this.snapToStart=!1,this.altHeld=!1,this.isClosed=!1,this.areaM2=0,this.elevationProfile=null,this.finished=!1,this.clearedMeasurement=null,this.addedLayerId=null,this.unitSystem=P(),this.touch=new y(this),this.layersCreated=!1,this.throttledUpdateVisualization=d(()=>{this.doUpdateRubberbandVisualization()},50),this.unsubClick=null,this.unsubDblClick=null,this.unsubPointerMove=null,this.unsubContextMenu=null,this.unsubPointerLeave=null,this.keydownHandler=null,this.handleKeyup=e=>{e.key===`Alt`&&this.altHeld&&(this.altHeld=!1,this.doUpdateRubberbandVisualization())},this.handleWindowBlur=()=>{this.altHeld&&(this.altHeld=!1,this.doUpdateRubberbandVisualization())},this.clearByUser=()=>{this.points.length!==0&&(this.clearedMeasurement=this.addedLayerId?null:this.snapshotMeasurement(),this.clearMeasurement())},this.toggleMapLayer=()=>{this.addedLayerId?this.removeFromMap():this.addToMap()},this.addToMap=async()=>{let e=this.mapHost;if(!this.canAddToMap||!e)return;let t=this.isClosed?`Area ${c(this.areaM2,this.unitSystem)}`:`Distance ${l(this.totalDistanceCm,this.unitSystem)}`,n=`measurement-${Date.now().toString(36)}`;if(!await e.addLayerRequest({id:n,type:`style`,sources:{[k]:{type:`geojson`,data:this.buildLayerGeoJSON()}},layers:this.buildLayerSublayers(),metadata:{label:t,hideFromLegend:!1}})){v(this,`The measurement could not be added to the map`);return}this.addedLayerId=n,this.finished=!0,this.cursorPosition=null,this.updateMapVisualization(),this.doUpdateRubberbandVisualization(),this.applyCursorForState(),v(this,`Added to the map: ${t}`)},this.selectUnitSystem=e=>{let t=e.target.value;if(!(t!==`metric`&&t!==`imperial`)){this.unitSystem=t;try{localStorage.setItem(N,this.unitSystem)}catch{}}}}get isFinished(){return this.finished||this.isClosed}static{this.styles=[m,_,b,i`
        :host {
            display: block;
            pointer-events: auto;
        }

        :host(:not([active])) .measure-content {
            display: none;
        }

        .measure-container {
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
            padding: var(--webmapx-tool-padding, 0);
            font-size: var(--font-size-small, 0.875rem);
        }

        .segment-list {
            /* max-height is removed to allow the panel to grow */
        }

        .segment {
            display: flex;
            justify-content: space-between;
            padding: 0.25rem 0;
            border-bottom: 1px solid var(--color-border-light, #e2e7ec);
        }

        .segment:last-child {
            border-bottom: none;
        }

        .segment-label {
            color: var(--color-text-secondary, #5a6773);
        }

        .segment-value {
            font-weight: 600;
            font-variant-numeric: tabular-nums;
        }

        .total-row {
            display: flex;
            justify-content: space-between;
            padding-top: 0.5rem;
            border-top: 2px solid var(--color-border, #d5dce3);
            font-weight: 600;
            font-variant-numeric: tabular-nums;
        }

        /* The segment being drawn, and a total that still includes it: values
           that change with the mouse until the next click fixes them. */
        .segment.live .segment-value,
        .total-row.live span:last-child {
            font-style: italic;
            color: var(--color-text-secondary, #5a6773);
        }

        .area-row {
            display: flex;
            justify-content: space-between;
            padding-top: 0.25rem;
            color: var(--color-primary, #2b6c8f);
            font-weight: 600;
        }

        /* Four buttons do not fit across a 300px panel, so they take two rows —
           and the split follows what they do. The unit switch changes only how the
           numbers are read, so it sits with them, right-aligned under the column
           they line up in; the three that act on the measurement itself sit below,
           left-aligned where a toolbar is looked for. Wrapping keeps that honest at
           any panel width a config asks for. */
        /* Right-aligned, above the column of values it changes */
        .unit-row {
            display: flex;
            justify-content: flex-end;
            margin-bottom: 0.5rem;
        }

        /* "Units" sits beside the control rather than above it */
        .unit-row sl-radio-group::part(form-control) {
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }

        .unit-row sl-radio-group::part(form-control-label) {
            margin: 0;
        }

        .actions {
            display: flex;
            flex-wrap: wrap;
            align-items: center;
            gap: 0.5rem;
            margin-top: 0.35rem;
        }

        .elevation-profile {
            margin-top: 0.25rem;
        }

        .elevation-profile svg {
            display: block;
            width: 100%;
        }

        .elevation-profile-label {
            font-size: 0.7rem;
            color: var(--color-text-secondary, #5a6773);
            margin-bottom: 2px;
        }

        /* The add-as-map-layer toggle closes the action row, far right */
        .actions .layer-toggle {
            margin-left: auto;
        }
    `]}onMapAttached(e){super.onMapAttached(e),this.setupMapEventListeners(e),this.loadConfigDefaults()}onMapDetached(){this.cleanupEventListeners(),this.cleanupMapLayers(),super.onMapDetached()}connectedCallback(){super.connectedCallback()}disconnectedCallback(){this.cleanupEventListeners(),super.disconnectedCallback()}async updated(e){(e.has(`segments`)||e.has(`points`))&&(await this.updateComplete,this.dispatchEvent(new CustomEvent(`webmapx-content-updated`,{bubbles:!0,composed:!0})))}loadConfigDefaults(){let e=this.toolsConfig?.measure;e&&(this.closeThreshold=e.closeThreshold??14,this.finishThreshold=e.finishThreshold??10)}setupMapEventListeners(e){this.unsubClick=e.events.on(`click`,this.handleClick.bind(this)),this.unsubDblClick=e.events.on(`dblclick`,this.handleDblClick.bind(this)),this.unsubPointerMove=e.events.on(`pointer-move`,this.handlePointerMove.bind(this)),this.unsubContextMenu=e.events.on(`contextmenu`,this.handleContextMenu.bind(this)),this.unsubPointerLeave=e.events.on(`pointer-leave`,this.handlePointerLeave.bind(this)),this.keydownHandler=this.handleKeydown.bind(this),document.addEventListener(`keydown`,this.keydownHandler),document.addEventListener(`keyup`,this.handleKeyup),window.addEventListener(`blur`,this.handleWindowBlur)}cleanupEventListeners(){this.unsubClick?.(),this.unsubDblClick?.(),this.unsubPointerMove?.(),this.unsubContextMenu?.(),this.unsubPointerLeave?.(),this.keydownHandler&&=(document.removeEventListener(`keydown`,this.keydownHandler),null),document.removeEventListener(`keyup`,this.handleKeyup),window.removeEventListener(`blur`,this.handleWindowBlur),this.altHeld=!1}createMeasureLayers(){this.layersCreated||=(this.dispatchEvent(new CustomEvent(`webmapx-add-source`,{detail:{id:C,config:{type:`geojson`,data:this.buildStaticGeoJSON()}},bubbles:!0,composed:!0})),this.dispatchEvent(new CustomEvent(`webmapx-add-source`,{detail:{id:O,config:{type:`geojson`,data:this.buildRubberbandGeoJSON()}},bubbles:!0,composed:!0})),this.dispatchEvent(new CustomEvent(`webmapx-add-layer`,{detail:{id:E,type:`fill`,source:C,metadata:{hideFromLegend:!0,label:`Measure polygon`},filter:[`==`,[`geometry-type`],`Polygon`],paint:{"fill-color":`#0f62fe`,"fill-opacity":.1}},bubbles:!0,composed:!0})),this.dispatchEvent(new CustomEvent(`webmapx-add-layer`,{detail:{id:T,type:`line`,source:C,metadata:{hideFromLegend:!0,label:`Measure lines`},filter:[`==`,[`get`,`type`],`line`],paint:{"line-color":`#0f62fe`,"line-width":2}},bubbles:!0,composed:!0})),this.dispatchEvent(new CustomEvent(`webmapx-add-layer`,{detail:{id:A,type:`line`,source:O,metadata:{hideFromLegend:!0,label:`Measure rubberband`},filter:[`==`,[`get`,`type`],`rubberband`],paint:{"line-color":`#0f62fe`,"line-width":2,"line-dasharray":[4,4]}},bubbles:!0,composed:!0})),this.dispatchEvent(new CustomEvent(`webmapx-add-layer`,{detail:{id:D,type:`symbol`,source:C,metadata:{isToolLayer:!0,hideFromLegend:!0,label:`Measure segment labels`},filter:[`==`,[`get`,`type`],`segment-label`],layout:{"text-field":[`get`,`label`],"text-font":[`Noto Sans Regular`],"text-size":12,"text-anchor":`center`,"text-allow-overlap":!0,"text-ignore-placement":!0},paint:{"text-color":g,"text-halo-color":h,"text-halo-width":1.5}},bubbles:!0,composed:!0})),this.dispatchEvent(new CustomEvent(`webmapx-add-layer`,{detail:{id:w,type:`circle`,source:C,metadata:{isToolLayer:!0,hideFromLegend:!0,label:`Measure points`},filter:[`==`,[`get`,`type`],`point`],paint:{"circle-radius":5,"circle-color":h,"circle-opacity":1,"circle-stroke-color":g,"circle-stroke-width":2}},bubbles:!0,composed:!0})),this.dispatchEvent(new CustomEvent(`webmapx-add-layer`,{detail:{id:j,type:`circle`,source:O,metadata:{isToolLayer:!0,hideFromLegend:!0,label:`Measure snap`},filter:[`==`,[`get`,`type`],`snap`],paint:{"circle-radius":7,"circle-color":`#ffdd00`,"circle-stroke-width":2,"circle-stroke-color":`#fff`,"circle-opacity":.9}},bubbles:!0,composed:!0})),!0)}cleanupMapLayers(){this.removeMeasureLayers()}removeMeasureLayers(){this.layersCreated&&=(this.dispatchEvent(new CustomEvent(`webmapx-remove-layer`,{detail:j,bubbles:!0,composed:!0})),this.dispatchEvent(new CustomEvent(`webmapx-remove-layer`,{detail:w,bubbles:!0,composed:!0})),this.dispatchEvent(new CustomEvent(`webmapx-remove-layer`,{detail:D,bubbles:!0,composed:!0})),this.dispatchEvent(new CustomEvent(`webmapx-remove-layer`,{detail:T,bubbles:!0,composed:!0})),this.dispatchEvent(new CustomEvent(`webmapx-remove-layer`,{detail:E,bubbles:!0,composed:!0})),this.dispatchEvent(new CustomEvent(`webmapx-remove-layer`,{detail:A,bubbles:!0,composed:!0})),this.dispatchEvent(new CustomEvent(`webmapx-remove-source`,{detail:C,bubbles:!0,composed:!0})),this.dispatchEvent(new CustomEvent(`webmapx-remove-source`,{detail:O,bubbles:!0,composed:!0})),!1)}updateMapVisualization(){this.doUpdateStaticVisualization()}doUpdateStaticVisualization(){if(!this.layersCreated)return;let e=this.buildStaticGeoJSON();this.dispatchEvent(new CustomEvent(`webmapx-set-source-data`,{detail:{id:C,data:e},bubbles:!0,composed:!0}))}doUpdateRubberbandVisualization(){if(!this.layersCreated)return;let e=this.buildRubberbandGeoJSON();this.dispatchEvent(new CustomEvent(`webmapx-set-source-data`,{detail:{id:O,data:e},bubbles:!0,composed:!0}))}buildStaticGeoJSON(){let e=[];if(this.addedLayerId)return{type:`FeatureCollection`,features:e};if(this.points.forEach((t,n)=>{e.push({type:`Feature`,properties:{index:n,type:`point`,isFirst:n===0,isLast:n===this.points.length-1},geometry:{type:`Point`,coordinates:t}})}),this.points.length>=2){let t=this.buildLineCoordinates(this.points,this.isClosed);e.push({type:`Feature`,properties:{type:`line`},geometry:{type:`LineString`,coordinates:t}})}if(this.segments.forEach((t,n)=>{e.push({type:`Feature`,properties:{type:`segment-label`,label:String(n+1)},geometry:{type:`Point`,coordinates:this.segmentLabelPosition(t)}})}),this.isClosed&&this.points.length>=3){let t=this.buildLineCoordinates(this.points,!0);e.push({type:`Feature`,properties:{type:`polygon`},geometry:{type:`Polygon`,coordinates:[t]}})}return{type:`FeatureCollection`,features:e}}buildRubberbandGeoJSON(){let e=[];if(!this.isClosed&&this.points.length>0&&this.cursorPosition&&this.active){let t=this.isSnappedToStart?this.points[0]:this.cursorPosition,n=this.buildSegmentCoordinates(this.points[this.points.length-1],t);e.push({type:`Feature`,properties:{type:`rubberband`},geometry:{type:`LineString`,coordinates:n}}),this.isSnappedToStart&&e.push({type:`Feature`,properties:{type:`snap`},geometry:{type:`Point`,coordinates:this.points[0]}})}return{type:`FeatureCollection`,features:e}}handleClick(e){if(!this.active)return;let t=e.coords,n=this.adapter?.project(t);if(!n)return;let r=[n[0],n[1]];if(!this.isFinished){if(this.isSnappedToStart){this.closePolygon();return}if(this.points.length>=3&&this.isWithinThreshold(r,this.points[0],this.closeThreshold)){this.closePolygon();return}if(this.points.length>=1){let e=this.points[this.points.length-1];if(this.isWithinThreshold(r,e,this.finishThreshold)){this.finishMeasurement();return}}this.addPoint(t)}}handleDblClick(e){!this.active||this.isFinished||this.points.length<2||this.finishMeasurement()}handlePointerMove(e){!this.active||this.isFinished||this.points.length!==0&&(this.cursorPosition=e.coords,this.updateSnapToStart(),this.throttledUpdateVisualization())}handlePointerLeave(){!this.active||!this.cursorPosition||(this.cursorPosition=null,this.snapToStart=!1,this.doUpdateRubberbandVisualization())}handleContextMenu(e){!this.active||this.isFinished||this.finishMeasurement()}get isSnappedToStart(){return this.snapToStart&&!this.altHeld&&!this.isFinished&&this.points.length>=3&&this.cursorPosition!==null}updateSnapToStart(){if(this.snapToStart=!1,this.points.length<3||!this.cursorPosition||!this.adapter)return;let e=this.adapter.project(this.cursorPosition),t=this.adapter.project(this.points[0]);this.snapToStart=Math.hypot(t[0]-e[0],t[1]-e[1])<=M}handleKeydown(e){if(!this.active||u(e))return;if(e.key===`Alt`){e.preventDefault(),this.altHeld||(this.altHeld=!0,this.doUpdateRubberbandVisualization());return}if(e.key===`Escape`){if(this.isFinished)return;this.finishMeasurement();return}let t=(e.ctrlKey||e.metaKey)&&e.key.toLowerCase()===`z`,n=!e.ctrlKey&&!e.metaKey&&!e.altKey&&(e.key===`Backspace`||e.key===`Delete`);if(t||n){if(!this.canUndo)return;e.preventDefault(),this.undoLastAction()}}isWithinThreshold(e,t,n){let r=this.adapter?.project(t);if(!r)return!1;let i=e[0]-r[0],a=e[1]-r[1];return Math.sqrt(i*i+a*a)<n}segmentLabelPosition(e){let t=this.computeAngularDistanceRad(e.from,e.to);return t===0?e.from:this.interpolateGreatCirclePoint(e.from,e.to,.5,t)}buildSegmentCoordinates(e,t){let n=Math.abs(t[1]-e[1]),r=Math.abs(this.normalizeLongitudeDeltaDegrees(t[0]-e[0]));if(!(n>1||r>1))return[e,t];let i=this.computeAngularDistanceRad(e,t);if(i===0)return[e];let a=i*180/Math.PI,o=Math.max(1,Math.ceil(a)),s=[];for(let n=0;n<=o;n++){let r=n/o;s.push(this.interpolateGreatCirclePoint(e,t,r,i))}return s}buildLineCoordinates(e,t){if(e.length<2)return e;let n=t?[...e,e[0]]:e,r=[];for(let e=1;e<n.length;e++){let t=this.buildSegmentCoordinates(n[e-1],n[e]);r.length===0?r.push(...t):r.push(...t.slice(1))}return r}computeAngularDistanceRad(e,t){let n=this.toRadians(e[1]),r=this.toRadians(t[1]),i=r-n,a=this.normalizeLongitudeDeltaRadians(this.toRadians(t[0]-e[0])),o=Math.sin(i/2)**2+Math.cos(n)*Math.cos(r)*Math.sin(a/2)**2;return 2*Math.atan2(Math.sqrt(o),Math.sqrt(1-o))}interpolateGreatCirclePoint(e,t,n,r){let i=this.toRadians(e[1]),a=this.toRadians(e[0]),o=this.toRadians(t[1]),s=this.toRadians(t[0]),c=Math.sin(r);if(c===0)return e;let l=Math.sin((1-n)*r)/c,u=Math.sin(n*r)/c,d=l*Math.cos(i)*Math.cos(a)+u*Math.cos(o)*Math.cos(s),f=l*Math.cos(i)*Math.sin(a)+u*Math.cos(o)*Math.sin(s),p=l*Math.sin(i)+u*Math.sin(o),m=Math.atan2(p,Math.sqrt(d*d+f*f)),h=Math.atan2(f,d);return[this.toDegrees(h),this.toDegrees(m)]}toRadians(e){return e*Math.PI/180}toDegrees(e){return e*180/Math.PI}normalizeLongitudeDeltaDegrees(e){return(e+540)%360-180}normalizeLongitudeDeltaRadians(e){return(e+3*Math.PI)%(2*Math.PI)-Math.PI}addPoint(e){this.points.length===0&&(this.clearedMeasurement=null);let t=[...this.points,e];if(t.length>=2){let e=t[t.length-2],n=t[t.length-1],r=s(e,n),i={from:e,to:n,distanceCm:r};this.segments=[...this.segments,i],this.totalDistanceCm+=r}this.points=t,this.updateMapVisualization(),this.updateElevationProfile()}closePolygon(){if(this.points.length<3)return;let e=this.points[this.points.length-1],t=this.points[0],n=s(e,t),r={from:e,to:t,distanceCm:n};this.segments=[...this.segments,r],this.totalDistanceCm+=n,this.areaM2=o({type:`Polygon`,coordinates:[this.points]}),this.isClosed=!0,this.cursorPosition=null,v(this,`Area ${c(this.areaM2,this.unitSystem)}, perimeter ${l(this.totalDistanceCm,this.unitSystem)}`),this.updateMapVisualization(),this.doUpdateRubberbandVisualization(),this.updateElevationProfile(),this.applyCursorForState()}finishMeasurement(){this.finished=!0,!this.isClosed&&this.segments.length>0&&v(this,`Distance ${l(this.totalDistanceCm,this.unitSystem)}`),this.cursorPosition=null,this.doUpdateRubberbandVisualization(),this.updateElevationProfile(),this.applyCursorForState()}applyCursorForState(){this.active&&this.adapter?.setCursor(this.isFinished?``:`crosshair`)}get canUndo(){return this.points.length>0||this.clearedMeasurement!==null}snapshotMeasurement(){return{points:this.points,segments:this.segments,totalDistanceCm:this.totalDistanceCm,isClosed:this.isClosed,finished:this.finished,areaM2:this.areaM2}}restoreClearedMeasurement(){let e=this.clearedMeasurement;e&&(this.clearedMeasurement=null,this.points=e.points,this.segments=e.segments,this.totalDistanceCm=e.totalDistanceCm,this.isClosed=e.isClosed,this.finished=e.finished,this.areaM2=e.areaM2,this.cursorPosition=null,this.updateMapVisualization(),this.doUpdateRubberbandVisualization(),this.updateElevationProfile(),this.applyCursorForState())}undoLastAction(){if(this.canUndo){if(this.points.length===0){this.restoreClearedMeasurement();return}if(this.addedLayerId){this.removeFromMap();return}if(this.isClosed){let e=this.segments[this.segments.length-1];this.segments=this.segments.slice(0,-1),this.totalDistanceCm-=e?.distanceCm??0,this.isClosed=!1,this.areaM2=0,this.finished=!1,this.applyCursorForState()}else if(this.finished)this.finished=!1,this.applyCursorForState();else{let e=this.segments[this.segments.length-1];if(this.points=this.points.slice(0,-1),this.points.length>=1&&e&&(this.segments=this.segments.slice(0,-1),this.totalDistanceCm-=e.distanceCm),this.points.length===0){this.clearMeasurement();return}}this.cursorPosition=null,this.updateMapVisualization(),this.doUpdateRubberbandVisualization(),this.updateElevationProfile()}}clearMeasurement(){this.addedLayerId=null,this.points=[],this.segments=[],this.totalDistanceCm=0,this.cursorPosition=null,this.isClosed=!1,this.finished=!1,this.areaM2=0,this.elevationProfile=null,this.doUpdateStaticVisualization(),this.doUpdateRubberbandVisualization(),this.applyCursorForState()}static{this.ELEVATION_SAMPLES=100}updateElevationProfile(){let e=this.adapter?.getElevation?.bind(this.adapter);if(!e||this.points.length<2){this.elevationProfile=null;return}let t=this.isClosed,n=this.buildLineCoordinates(this.points,t);if(n.length<2){this.elevationProfile=null;return}let r=S.ELEVATION_SAMPLES,i=[],a=n.length-1;for(let t=0;t<r;t++){let o=t/(r-1)*a,s=Math.floor(o),c=Math.min(s+1,a),l=o-s,u=e([n[s][0]+(n[c][0]-n[s][0])*l,n[s][1]+(n[c][1]-n[s][1])*l]);if(u===null){this.elevationProfile=null;return}i.push(u)}this.elevationProfile=i}onActivate(){this.adapter?.setDoubleClickZoomEnabled(!1),this.adapter?.setCursor(this.isFinished?``:`crosshair`),this.layersCreated||this.createMeasureLayers(),this.dispatchEvent(new CustomEvent(`webmapx-suppress-busy-for-source`,{detail:O,bubbles:!0,composed:!0})),this.dispatchEvent(new CustomEvent(`webmapx-suppress-busy-for-source`,{detail:C,bubbles:!0,composed:!0})),this.dispatchEvent(new CustomEvent(`webmapx-measure-activate`,{bubbles:!0,composed:!0}))}onDeactivate(){this.cursorPosition=null,this.snapToStart=!1,this.altHeld=!1,this.adapter?.setDoubleClickZoomEnabled(!0),this.adapter?.setCursor(``),this.removeMeasureLayers(),this.dispatchEvent(new CustomEvent(`webmapx-unsuppress-busy-for-source`,{detail:O,bubbles:!0,composed:!0})),this.dispatchEvent(new CustomEvent(`webmapx-unsuppress-busy-for-source`,{detail:C,bubbles:!0,composed:!0})),this.dispatchEvent(new CustomEvent(`webmapx-measure-deactivate`,{bubbles:!0,composed:!0}))}removeFromMap(){let e=this.addedLayerId;e&&(this.addedLayerId=null,this.mapHost?.removeInlineLayer(e),this.updateMapVisualization(),v(this,`Removed from the map`))}onStateChanged(e){super.onStateChanged(e),this.addedLayerId&&!(this.addedLayerId in(e.mapLayers??{}))&&(this.addedLayerId=null,this.updateMapVisualization())}get canAddToMap(){return this.segments.length>0}buildLayerGeoJSON(){let e=this.buildLineCoordinates(this.points,this.isClosed).map(e=>[e[0],e[1]]),t=this.isClosed?{type:`Polygon`,coordinates:[e]}:{type:`LineString`,coordinates:e},n={type:`measurement`,name:this.isClosed?`Measured area`:`Measured line`};this.segments.forEach((e,t)=>{n[`segment_${t+1}`]=F(e.distanceCm/100)}),n[this.isClosed?`perimeter`:`total`]=F(this.totalDistanceCm/100),this.isClosed&&(n.area=F(this.areaM2)),n.measured_in=this.unitSystem;let r=this.segments.map((e,t)=>({type:`Feature`,geometry:{type:`Point`,coordinates:this.segmentLabelPosition(e).map(I)},properties:{type:`segment-label`,label:String(t+1),segment:t+1,length:F(e.distanceCm/100)}}));return{type:`FeatureCollection`,features:[{type:`Feature`,geometry:t,properties:n},...r]}}buildLayerSublayers(){let e={translations:this.buildAttributeTranslations()},t=[];return this.isClosed&&t.push({id:`measurement-fill`,type:`fill`,filter:[`==`,[`get`,`type`],`measurement`],metadata:{label:`Measured area`,attributes:e},paint:{"fill-color":g,"fill-opacity":.1}}),t.push({id:`measurement-line`,type:`line`,filter:[`==`,[`get`,`type`],`measurement`],metadata:{label:this.isClosed?`Measured outline`:`Measured line`,attributes:e},paint:{"line-color":g,"line-width":2}}),t.push({id:`measurement-labels`,type:`symbol`,filter:[`==`,[`get`,`type`],`segment-label`],metadata:{label:`Segment numbers`,attributes:{translations:[{name:`segment`,translation:`Segment`,unit:``},{name:`length`,translation:`Length`,unit:` m`}]}},layout:{"text-field":[`get`,`label`],"text-font":[`Noto Sans Regular`],"text-size":12,"text-anchor":`center`,"text-allow-overlap":!0,"text-ignore-placement":!0},paint:{"text-color":g,"text-halo-color":h,"text-halo-width":1.5}}),t.map(e=>({...e,source:k}))}buildAttributeTranslations(){let e=[{name:`name`,translation:`name`,unit:``}];return this.segments.forEach((t,n)=>{e.push({name:`segment_${n+1}`,translation:`Segment ${n+1}`,unit:` m`})}),e.push(this.isClosed?{name:`perimeter`,translation:`Perimeter`,unit:` m`}:{name:`total`,translation:`Total`,unit:` m`}),this.isClosed&&e.push({name:`area`,translation:`Area`,unit:` m²`}),e.push({name:`measured_in`,translation:`Read in`,unit:``}),e}get hasLiveSegment(){return!this.isFinished&&this.points.length>0}get liveDistanceCm(){if(!this.hasLiveSegment||!this.cursorPosition)return null;let e=this.isSnappedToStart?this.points[0]:this.cursorPosition;return s(this.points[this.points.length-1],e)}renderSegments(){if(this.segments.length===0&&!this.hasLiveSegment)return e;let t=this.liveDistanceCm;return a`
            <div class="segment-list">
                ${this.segments.map((e,t)=>a`
                    <div class="segment">
                        <span class="segment-label">Segment ${t+1}</span>
                        <span class="segment-value">${l(e.distanceCm,this.unitSystem)}</span>
                    </div>
                `)}
                ${this.hasLiveSegment?a`
                    <div class="segment live">
                        <span class="segment-label">Segment ${this.segments.length+1}</span>
                        <span class="segment-value">${t===null?`—`:l(t,this.unitSystem)}</span>
                    </div>
                `:e}
            </div>
        `}renderTotal(){if(this.segments.length===0&&!this.hasLiveSegment)return e;let t=this.liveDistanceCm;return a`
            <div class="total-row ${t===null?``:`live`}">
                <span>${this.isClosed?`Perimeter`:`Total`}</span>
                <span>${this.segments.length===0&&t===null?`—`:l(this.totalDistanceCm+(t??0),this.unitSystem)}</span>
            </div>
        `}renderLayerToggle(){let e=this.addedLayerId!==null;return a`
            <button
                type="button"
                class="layer-toggle"
                data-added=${e?`true`:`false`}
                aria-pressed=${e?`true`:`false`}
                aria-label="Add as map layer"
                title=${e?`Remove from map`:`Add as map layer`}
                ?disabled=${!this.canAddToMap}
                @click=${this.toggleMapLayer}
            >${x}</button>
        `}renderArea(){return!this.isClosed||this.areaM2===0?e:a`
            <div class="area-row">
                <span>Area</span>
                <span>${c(this.areaM2,this.unitSystem)}</span>
            </div>
        `}get toolTip(){if(this.isFinished){let e=this.touch.click;return this.addedLayerId?`Added to the map, and listed in the legend. ${e} Clear to start a new measurement.`:`Measurement finished. Add it to the map with the layer button, or ${e.toLowerCase()} Clear to start a new one.`}let e=this.touch.click;if(this.points.length===0)return`${e} the map to start measuring.`;if(this.points.length===1)return`${e} to add the next point.`;let t=this.touch.isTouch?`finish with the Finish button`:`finish with the Finish button, a double-click or Esc`;return this.points.length===2?`${e} to add points, or ${t}.`:`${e} the first point to close the area, or ${t}.`}get canFinish(){return!this.isFinished&&this.points.length>=2}renderElevationProfile(){let t=this.elevationProfile;if(!t||t.length<2)return e;let n=Math.min(...t),r=Math.max(...t),i=r-n||1,o=t.map((e,r)=>{let a=r/(t.length-1)*220,o=60-(e-n)/i*60;return`${a.toFixed(1)},${o.toFixed(1)}`}).join(` `);return a`
            <div class="elevation-profile">
                <div class="elevation-profile-label">Elevation profile (${`${Math.round(n).toLocaleString()} m`} – ${`${Math.round(r).toLocaleString()} m`})</div>
                <svg viewBox="0 0 ${220} ${60}" width="${220}" height="${60}" xmlns="http://www.w3.org/2000/svg">
                    <polyline
                        points="${o}"
                        fill="none"
                        stroke="var(--color-primary, #2b6c8f)"
                        stroke-width="1.5"
                        stroke-linejoin="round"
                    />
                </svg>
            </div>
        `}render(){return a`
            <div class="tool-content measure-container">
                <div class="measure-content">
                    <div class="unit-row">
                        <!-- Both choices visible, the current one highlighted: a single
                             button labelled with the current units read as an action
                             and left the other option hidden until clicked. -->
                        <sl-radio-group
                            size="small"
                            label="Units"
                            value=${this.unitSystem}
                            @sl-change=${this.selectUnitSystem}
                        >
                            <sl-radio-button value="metric">m / km</sl-radio-button>
                            <sl-radio-button value="imperial">ft / mi</sl-radio-button>
                        </sl-radio-group>
                    </div>
                    ${this.renderSegments()}
                    ${this.renderTotal()}
                    ${this.renderArea()}
                    ${this.renderElevationProfile()}

                    <div class="actions">
                        <sl-button
                            size="small"
                            ?disabled=${!this.canUndo}
                            title="Undo the last change (Ctrl+Z, Backspace or Delete)"
                            @click=${this.undoLastAction}
                        >
                            <sl-icon name="arrow-counterclockwise" slot="prefix"></sl-icon>
                            Undo
                        </sl-button>
                        <sl-button size="small" @click=${this.clearByUser}>
                            <sl-icon name="trash" slot="prefix"></sl-icon>
                            Clear
                        </sl-button>
                        ${this.canFinish?a`
                            <sl-button
                                size="small"
                                title="Finish the measurement (double-click, right-click or Esc)"
                                @click=${()=>this.finishMeasurement()}
                            >
                                <sl-icon name="check-lg" slot="prefix"></sl-icon>
                                Finish
                            </sl-button>
                        `:e}
                        ${this.renderLayerToggle()}
                    </div>
                </div>
            </div>
        `}};f([n({type:Number,attribute:`close-threshold`})],L.prototype,`closeThreshold`,void 0),f([n({type:Number,attribute:`finish-threshold`})],L.prototype,`finishThreshold`,void 0),f([r()],L.prototype,`points`,void 0),f([r()],L.prototype,`segments`,void 0),f([r()],L.prototype,`totalDistanceCm`,void 0),f([r()],L.prototype,`cursorPosition`,void 0),f([r()],L.prototype,`snapToStart`,void 0),f([r()],L.prototype,`altHeld`,void 0),f([r()],L.prototype,`isClosed`,void 0),f([r()],L.prototype,`areaM2`,void 0),f([r()],L.prototype,`elevationProfile`,void 0),f([r()],L.prototype,`finished`,void 0),f([r()],L.prototype,`clearedMeasurement`,void 0),f([r()],L.prototype,`addedLayerId`,void 0),f([r()],L.prototype,`unitSystem`,void 0),L=S=f([t(`webmapx-measure-tool`)],L);export{L as WebmapxMeasureTool};