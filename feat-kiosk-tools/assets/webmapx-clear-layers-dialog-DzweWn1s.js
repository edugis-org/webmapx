import{a as e,t}from"./rolldown-runtime-Cyuzqnbw.js";import"./vendor-shoelace-BiEeFWil.js";import{_ as n,d as r,g as i,h as a,m as o,n as s,p as c,v as l,x as u,y as d}from"./vendor-lit-DP8NDNGT.js";import{$n as f,Dn as p,En as m,Gn as h,Hn as g,Kn as _,Ln as v,Mn as y,Nn as b,Nt as x,Pn as S,Qn as C,Rn as w,Un as T,Vn as E,Xn as D,_n as O,_r as ee,ar as te,br as ne,cr as re,dr as k,fr as ie,gn as ae,gr as oe,hr as se,ir as ce,jn as le,kn as ue,lr as A,mr as de,nr as fe,or as pe,pr as me,qn as he,sr as ge,ur as _e,vr as ve,xr as ye,yr as j}from"./webmapx-shared-94CEwXBr.js";import{y as be}from"./cesium-adapter-DCP1QrEw.js";import{t as M}from"./decorate-B0yrMnax.js";import{t as xe}from"./webmapx-base-tool-DU73VUs7.js";import{t as N}from"./control-surface-styles-WAx9bflO.js";import{a as P,i as F,n as Se,r as I,t as Ce}from"./top-layer-dialog-DcJK4Y8h.js";import{r as L,t as R}from"./data-colors-BXVfrRzV.js";import{a as we,c as z,i as Te,l as Ee,n as De,o as Oe,r as ke,s as Ae,t as je}from"./classify-channel-D8IQsm4n.js";var Me=e(t(((e,t)=>{(function(n,r){typeof e==`object`&&typeof t==`object`?t.exports=r():typeof define==`function`&&define.amd?define([],r):typeof e==`object`?e.Pickr=r():n.Pickr=r()})(self,(()=>(()=>{var e={d:(t,n)=>{for(var r in n)e.o(n,r)&&!e.o(t,r)&&Object.defineProperty(t,r,{enumerable:!0,get:n[r]})},o:(e,t)=>Object.prototype.hasOwnProperty.call(e,t),r:e=>{typeof Symbol<`u`&&Symbol.toStringTag&&Object.defineProperty(e,Symbol.toStringTag,{value:`Module`}),Object.defineProperty(e,"__esModule",{value:!0})}},t={};e.d(t,{default:()=>O});var n={};function r(e,t,n,r,i={}){t instanceof HTMLCollection||t instanceof NodeList?t=Array.from(t):Array.isArray(t)||(t=[t]),Array.isArray(n)||(n=[n]);for(let a of t)for(let t of n)a[e](t,r,{capture:!1,...i});return Array.prototype.slice.call(arguments,1)}e.r(n),e.d(n,{adjustableInputNumbers:()=>u,createElementFromString:()=>o,createFromTemplate:()=>s,eventPath:()=>c,off:()=>a,on:()=>i,resolveElement:()=>l});let i=r.bind(null,`addEventListener`),a=r.bind(null,`removeEventListener`);function o(e){let t=document.createElement(`div`);return t.innerHTML=e.trim(),t.firstElementChild}function s(e){let t=(e,t)=>{let n=e.getAttribute(t);return e.removeAttribute(t),n},n=(e,r={})=>{let i=t(e,`:obj`),a=t(e,`:ref`),o=i?r[i]={}:r;a&&(r[a]=e);for(let r of Array.from(e.children)){let e=t(r,`:arr`),i=n(r,e?{}:o);e&&(o[e]||(o[e]=[])).push(Object.keys(i).length?i:r)}return r};return n(o(e))}function c(e){let t=e.path||e.composedPath&&e.composedPath();if(t)return t;let n=e.target.parentElement;for(t=[e.target,n];n=n.parentElement;)t.push(n);return t.push(document,window),t}function l(e){return e instanceof Element?e:typeof e==`string`?e.split(/>>/g).reduce(((e,t,n,r)=>(e=e.querySelector(t),n<r.length-1?e.shadowRoot:e)),document):null}function u(e,t=(e=>e)){function n(n){let r=[.001,.01,.1][Number(n.shiftKey||2*n.ctrlKey)]*(n.deltaY<0?1:-1),i=0,a=e.selectionStart;e.value=e.value.replace(/[\d.]+/g,((e,n)=>n<=a&&n+e.length>=a?(a=n,t(Number(e),r,i)):(i++,e))),e.focus(),e.setSelectionRange(a,a),n.preventDefault(),e.dispatchEvent(new Event(`input`))}i(e,`focus`,(()=>i(window,`wheel`,n,{passive:!1}))),i(e,`blur`,(()=>a(window,`wheel`,n)))}let{min:d,max:f,floor:p,round:m}=Math;function h(e,t,n){t/=100,n/=100;let r=p(e=e/360*6),i=e-r,a=n*(1-t),o=n*(1-i*t),s=n*(1-(1-i)*t),c=r%6;return[255*[n,o,a,a,s,n][c],255*[s,n,n,o,a,a][c],255*[a,a,s,n,n,o][c]]}function g(e,t,n){let r=(2-(t/=100))*(n/=100)/2;return r!==0&&(t=r===1?0:r<.5?t*n/(2*r):t*n/(2-2*r)),[e,100*t,100*r]}function _(e,t,n){let r=d(e/=255,t/=255,n/=255),i=f(e,t,n),a=i-r,o,s;if(a===0)o=s=0;else{s=a/i;let r=((i-e)/6+a/2)/a,c=((i-t)/6+a/2)/a,l=((i-n)/6+a/2)/a;e===i?o=l-c:t===i?o=1/3+r-l:n===i&&(o=2/3+c-r),o<0?o+=1:o>1&&--o}return[360*o,100*s,100*i]}function v(e,t,n,r){return t/=100,n/=100,[..._(255*(1-d(1,(e/=100)*(1-(r/=100))+r)),255*(1-d(1,t*(1-r)+r)),255*(1-d(1,n*(1-r)+r)))]}function y(e,t,n){t/=100;let r=2*(t*=(n/=100)<.5?n:1-n)/(n+t)*100,i=100*(n+t);return[e,isNaN(r)?0:r,i]}function b(e){return _(...e.match(/.{2}/g).map((e=>parseInt(e,16))))}function x(e){e=e.match(/^[a-zA-Z]+$/)?function(e){if(e.toLowerCase()===`black`)return`#000`;let t=document.createElement(`canvas`).getContext(`2d`);return t.fillStyle=e,t.fillStyle===`#000`?null:t.fillStyle}(e):e;let t={cmyk:/^cmyk\D+([\d.]+)\D+([\d.]+)\D+([\d.]+)\D+([\d.]+)/i,rgba:/^rgba?\D+([\d.]+)(%?)\D+([\d.]+)(%?)\D+([\d.]+)(%?)\D*?(([\d.]+)(%?)|$)/i,hsla:/^hsla?\D+([\d.]+)\D+([\d.]+)\D+([\d.]+)\D*?(([\d.]+)(%?)|$)/i,hsva:/^hsva?\D+([\d.]+)\D+([\d.]+)\D+([\d.]+)\D*?(([\d.]+)(%?)|$)/i,hexa:/^#?(([\dA-Fa-f]{3,4})|([\dA-Fa-f]{6})|([\dA-Fa-f]{8}))$/i},n=e=>e.map((e=>/^(|\d+)\.\d+|\d+$/.test(e)?Number(e):void 0)),r;t:for(let i in t)if(r=t[i].exec(e))switch(i){case`cmyk`:{let[,e,t,a,o]=n(r);if(e>100||t>100||a>100||o>100)break t;return{values:v(e,t,a,o),type:i}}case`rgba`:{let[,e,,t,,a,,,o]=n(r);if(e=r[2]===`%`?e/100*255:e,t=r[4]===`%`?t/100*255:t,a=r[6]===`%`?a/100*255:a,o=r[9]===`%`?o/100:o,e>255||t>255||a>255||o<0||o>1)break t;return{values:[..._(e,t,a),o],a:o,type:i}}case`hexa`:{let[,e]=r;e.length!==4&&e.length!==3||(e=e.split(``).map((e=>e+e)).join(``));let t=e.substring(0,6),n=e.substring(6);return n=n?parseInt(n,16)/255:void 0,{values:[...b(t),n],a:n,type:i}}case`hsla`:{let[,e,t,a,,o]=n(r);if(o=r[6]===`%`?o/100:o,e>360||t>100||a>100||o<0||o>1)break t;return{values:[...y(e,t,a),o],a:o,type:i}}case`hsva`:{let[,e,t,a,,o]=n(r);if(o=r[6]===`%`?o/100:o,e>360||t>100||a>100||o<0||o>1)break t;return{values:[e,t,a,o],a:o,type:i}}}return{values:null,type:null}}function S(e=0,t=0,n=0,r=1){let i=(e,t)=>(n=-1)=>t(~n?e.map((e=>Number(e.toFixed(n)))):e),a={h:e,s:t,v:n,a:r,toHSVA(){let e=[a.h,a.s,a.v,a.a];return e.toString=i(e,(e=>`hsva(${e[0]}, ${e[1]}%, ${e[2]}%, ${a.a})`)),e},toHSLA(){let e=[...g(a.h,a.s,a.v),a.a];return e.toString=i(e,(e=>`hsla(${e[0]}, ${e[1]}%, ${e[2]}%, ${a.a})`)),e},toRGBA(){let e=[...h(a.h,a.s,a.v),a.a];return e.toString=i(e,(e=>`rgba(${e[0]}, ${e[1]}, ${e[2]}, ${a.a})`)),e},toCMYK(){let e=function(e,t,n){let r=h(e,t,n),i=r[0]/255,a=r[1]/255,o=r[2]/255,s=d(1-i,1-a,1-o);return[100*(s===1?0:(1-i-s)/(1-s)),100*(s===1?0:(1-a-s)/(1-s)),100*(s===1?0:(1-o-s)/(1-s)),100*s]}(a.h,a.s,a.v);return e.toString=i(e,(e=>`cmyk(${e[0]}%, ${e[1]}%, ${e[2]}%, ${e[3]}%)`)),e},toHEXA(){let e=function(e,t,n){return h(e,t,n).map((e=>m(e).toString(16).padStart(2,`0`)))}(a.h,a.s,a.v),t=a.a>=1?``:Number((255*a.a).toFixed(0)).toString(16).toUpperCase().padStart(2,`0`);return t&&e.push(t),e.toString=()=>`#${e.join(``).toUpperCase()}`,e},clone:()=>S(a.h,a.s,a.v,a.a)};return a}let C=e=>Math.max(Math.min(e,1),0);function w(e){let t={options:Object.assign({lock:null,onchange:()=>0,onstop:()=>0},e),_keyboard(e){let{options:n}=t,{type:r,key:i}=e;if(document.activeElement===n.wrapper){let{lock:n}=t.options,a=i===`ArrowUp`,o=i===`ArrowRight`,s=i===`ArrowDown`,c=i===`ArrowLeft`;if(r===`keydown`&&(a||o||s||c)){let r=0,i=0;n===`v`?r=a||o?1:-1:n===`h`?r=a||o?-1:1:(i=a?-1:+!!s,r=c?-1:+!!o),t.update(C(t.cache.x+.01*r),C(t.cache.y+.01*i)),e.preventDefault()}else i.startsWith(`Arrow`)&&(t.options.onstop(),e.preventDefault())}},_tapstart(e){i(document,[`mouseup`,`touchend`,`touchcancel`],t._tapstop),i(document,[`mousemove`,`touchmove`],t._tapmove),e.cancelable&&e.preventDefault(),t._tapmove(e)},_tapmove(e){let{options:n,cache:r}=t,{lock:i,element:a,wrapper:o}=n,s=o.getBoundingClientRect(),c=0,l=0;if(e){let t=e&&e.touches&&e.touches[0];c=e?(t||e).clientX:0,l=e?(t||e).clientY:0,c<s.left?c=s.left:c>s.left+s.width&&(c=s.left+s.width),l<s.top?l=s.top:l>s.top+s.height&&(l=s.top+s.height),c-=s.left,l-=s.top}else r&&(c=r.x*s.width,l=r.y*s.height);i!==`h`&&(a.style.left=`calc(${c/s.width*100}% - ${a.offsetWidth/2}px)`),i!==`v`&&(a.style.top=`calc(${l/s.height*100}% - ${a.offsetHeight/2}px)`),t.cache={x:c/s.width,y:l/s.height};let u=C(c/s.width),d=C(l/s.height);switch(i){case`v`:return n.onchange(u);case`h`:return n.onchange(d);default:return n.onchange(u,d)}},_tapstop(){t.options.onstop(),a(document,[`mouseup`,`touchend`,`touchcancel`],t._tapstop),a(document,[`mousemove`,`touchmove`],t._tapmove)},trigger(){t._tapmove()},update(e=0,n=0){let{left:r,top:i,width:a,height:o}=t.options.wrapper.getBoundingClientRect();t.options.lock===`h`&&(n=e),t._tapmove({clientX:r+a*e,clientY:i+o*n})},destroy(){let{options:e,_tapstart:n,_keyboard:r}=t;a(document,[`keydown`,`keyup`],r),a([e.wrapper,e.element],`mousedown`,n),a([e.wrapper,e.element],`touchstart`,n,{passive:!1})}},{options:n,_tapstart:r,_keyboard:o}=t;return i([n.wrapper,n.element],`mousedown`,r),i([n.wrapper,n.element],`touchstart`,r,{passive:!1}),i(document,[`keydown`,`keyup`],o),t}function T(e={}){e=Object.assign({onchange:()=>0,className:``,elements:[]},e);let t=i(e.elements,`click`,(t=>{e.elements.forEach((n=>n.classList[t.target===n?`add`:`remove`](e.className))),e.onchange(t),t.stopPropagation()}));return{destroy:()=>a(...t)}}let E={variantFlipOrder:{start:`sme`,middle:`mse`,end:`ems`},positionFlipOrder:{top:`tbrl`,right:`rltb`,bottom:`btrl`,left:`lrbt`},position:`bottom`,margin:8,padding:0},D=(e,t,n)=>{let r=typeof e!=`object`||e instanceof HTMLElement?{reference:e,popper:t,...n}:e;return{update(e=r){let{reference:t,popper:n}=Object.assign(r,e);if(!n||!t)throw Error(`Popper- or reference-element missing.`);return((e,t,n)=>{let{container:r,arrow:i,margin:a,padding:o,position:s,variantFlipOrder:c,positionFlipOrder:l}={container:document.documentElement.getBoundingClientRect(),...E,...n},{left:u,top:d}=t.style;t.style.left=`0`,t.style.top=`0`;let f=e.getBoundingClientRect(),p=t.getBoundingClientRect(),m={t:f.top-p.height-a,b:f.bottom+a,r:f.right+a,l:f.left-p.width-a},h={vs:f.left,vm:f.left+f.width/2-p.width/2,ve:f.left+f.width-p.width,hs:f.top,hm:f.bottom-f.height/2-p.height/2,he:f.bottom-p.height},[g,_=`middle`]=s.split(`-`),v=l[g],y=c[_],{top:b,left:x,bottom:S,right:C}=r;for(let e of v){let n=e===`t`||e===`b`,r=m[e],[a,s]=n?[`top`,`left`]:[`left`,`top`],[c,l]=n?[p.height,p.width]:[p.width,p.height],[u,d]=n?[S,C]:[C,S],[g,_]=n?[b,x]:[x,b];if(!(r<g||r+c+o>u))for(let u of y){let m=h[(n?`v`:`h`)+u];if(!(m<_||m+l+o>d)){if(m-=p[s],r-=p[a],t.style[s]=`${m}px`,t.style[a]=`${r}px`,i){let t=n?f.width/2:f.height/2,o=l/2,d=t>o,p=m+{s:d?o:t,m:o,e:d?o:l-t}[u],h=r+{t:c,b:0,r:0,l:c}[e];i.style[s]=`${p}px`,i.style[a]=`${h}px`}return e+u}}}return t.style.left=u,t.style.top=d,null})(t,n,r)}}};class O{static utils=n;static version=`1.9.1`;static I18N_DEFAULTS={"ui:dialog":`color picker dialog`,"btn:toggle":`toggle color picker dialog`,"btn:swatch":`color swatch`,"btn:last-color":`use previous color`,"btn:save":`Save`,"btn:cancel":`Cancel`,"btn:clear":`Clear`,"aria:btn:save":`save and close`,"aria:btn:cancel":`cancel and close`,"aria:btn:clear":`clear and close`,"aria:input":`color input field`,"aria:palette":`color selection area`,"aria:hue":`hue selection slider`,"aria:opacity":`selection slider`};static DEFAULT_OPTIONS={appClass:null,theme:`classic`,useAsButton:!1,padding:8,disabled:!1,comparison:!0,closeOnScroll:!1,outputPrecision:0,lockOpacity:!1,autoReposition:!0,container:`body`,components:{interaction:{}},i18n:{},swatches:null,inline:!1,sliders:null,default:`#42445a`,defaultRepresentation:null,position:`bottom-middle`,adjustableNumbers:!0,showAlways:!1,closeWithKey:`Escape`};_initializingActive=!0;_recalc=!0;_nanopop=null;_root=null;_color=S();_lastColor=S();_swatchColors=[];_setupAnimationFrame=null;_eventListener={init:[],save:[],hide:[],show:[],clear:[],change:[],changestop:[],cancel:[],swatchselect:[]};constructor(e){this.options=e=Object.assign({...O.DEFAULT_OPTIONS},e);let{swatches:t,components:n,theme:r,sliders:i,lockOpacity:a,padding:o}=e;[`nano`,`monolith`].includes(r)&&!i&&(e.sliders=`h`),n.interaction||={};let{preview:s,opacity:c,hue:l,palette:u}=n;n.opacity=!a&&c,n.palette=u||s||c||l,this._preBuild(),this._buildComponents(),this._bindEvents(),this._finalBuild(),t&&t.length&&t.forEach((e=>this.addSwatch(e)));let{button:d,app:f}=this._root;this._nanopop=D(d,f,{margin:o}),d.setAttribute(`role`,`button`),d.setAttribute(`aria-label`,this._t(`btn:toggle`));let p=this;this._setupAnimationFrame=requestAnimationFrame((function t(){if(!f.offsetWidth)return requestAnimationFrame(t);p.setColor(e.default),p._rePositioningPicker(),e.defaultRepresentation&&(p._representation=e.defaultRepresentation,p.setColorRepresentation(p._representation)),e.showAlways&&p.show(),p._initializingActive=!1,p._emit(`init`)}))}static create=e=>new O(e);_preBuild(){let{options:e}=this;for(let t of[`el`,`container`])e[t]=l(e[t]);this._root=(e=>{let{components:t,useAsButton:n,inline:r,appClass:i,theme:a,lockOpacity:o}=e.options,c=e=>e?``:`style="display:none" hidden`,l=t=>e._t(t),u=s(`\n      <div :ref="root" class="pickr">\n\n        ${n?``:`<button type="button" :ref="button" class="pcr-button"></button>`}\n\n        <div :ref="app" class="pcr-app ${i||``}" data-theme="${a}" ${r?`style="position: unset"`:``} aria-label="${l(`ui:dialog`)}" role="window">\n          <div class="pcr-selection" ${c(t.palette)}>\n            <div :obj="preview" class="pcr-color-preview" ${c(t.preview)}>\n              <button type="button" :ref="lastColor" class="pcr-last-color" aria-label="${l(`btn:last-color`)}"></button>\n              <div :ref="currentColor" class="pcr-current-color"></div>\n            </div>\n\n            <div :obj="palette" class="pcr-color-palette">\n              <div :ref="picker" class="pcr-picker"></div>\n              <div :ref="palette" class="pcr-palette" tabindex="0" aria-label="${l(`aria:palette`)}" role="listbox"></div>\n            </div>\n\n            <div :obj="hue" class="pcr-color-chooser" ${c(t.hue)}>\n              <div :ref="picker" class="pcr-picker"></div>\n              <div :ref="slider" class="pcr-hue pcr-slider" tabindex="0" aria-label="${l(`aria:hue`)}" role="slider"></div>\n            </div>\n\n            <div :obj="opacity" class="pcr-color-opacity" ${c(t.opacity)}>\n              <div :ref="picker" class="pcr-picker"></div>\n              <div :ref="slider" class="pcr-opacity pcr-slider" tabindex="0" aria-label="${l(`aria:opacity`)}" role="slider"></div>\n            </div>\n          </div>\n\n          <div class="pcr-swatches ${t.palette?``:`pcr-last`}" :ref="swatches"></div>\n\n          <div :obj="interaction" class="pcr-interaction" ${c(Object.keys(t.interaction).length)}>\n            <input :ref="result" class="pcr-result" type="text" spellcheck="false" ${c(t.interaction.input)} aria-label="${l(`aria:input`)}">\n\n            <input :arr="options" class="pcr-type" data-type="HEXA" value="${o?`HEX`:`HEXA`}" type="button" ${c(t.interaction.hex)}>\n            <input :arr="options" class="pcr-type" data-type="RGBA" value="${o?`RGB`:`RGBA`}" type="button" ${c(t.interaction.rgba)}>\n            <input :arr="options" class="pcr-type" data-type="HSLA" value="${o?`HSL`:`HSLA`}" type="button" ${c(t.interaction.hsla)}>\n            <input :arr="options" class="pcr-type" data-type="HSVA" value="${o?`HSV`:`HSVA`}" type="button" ${c(t.interaction.hsva)}>\n            <input :arr="options" class="pcr-type" data-type="CMYK" value="CMYK" type="button" ${c(t.interaction.cmyk)}>\n\n            <input :ref="save" class="pcr-save" value="${l(`btn:save`)}" type="button" ${c(t.interaction.save)} aria-label="${l(`aria:btn:save`)}">\n            <input :ref="cancel" class="pcr-cancel" value="${l(`btn:cancel`)}" type="button" ${c(t.interaction.cancel)} aria-label="${l(`aria:btn:cancel`)}">\n            <input :ref="clear" class="pcr-clear" value="${l(`btn:clear`)}" type="button" ${c(t.interaction.clear)} aria-label="${l(`aria:btn:clear`)}">\n          </div>\n        </div>\n      </div>\n    `),d=u.interaction;return d.options.find((e=>!e.hidden&&!e.classList.add(`active`))),d.type=()=>d.options.find((e=>e.classList.contains(`active`))),u})(this),e.useAsButton&&(this._root.button=e.el),e.container.appendChild(this._root.root)}_finalBuild(){let e=this.options,t=this._root;if(e.container.removeChild(t.root),e.inline){let n=e.el.parentElement;e.el.nextSibling?n.insertBefore(t.app,e.el.nextSibling):n.appendChild(t.app)}else e.container.appendChild(t.app);e.useAsButton?e.inline&&e.el.remove():e.el.parentNode.replaceChild(t.root,e.el),e.disabled&&this.disable(),e.comparison||(t.button.style.transition=`none`,e.useAsButton||(t.preview.lastColor.style.transition=`none`)),this.hide()}_buildComponents(){let e=this,t=this.options.components,n=(e.options.sliders||`v`).repeat(2),[r,i]=n.match(/^[vh]+$/g)?n:[],a=()=>this._color||=this._lastColor.clone(),o={palette:w({element:e._root.palette.picker,wrapper:e._root.palette.palette,onstop:()=>e._emit(`changestop`,`slider`,e),onchange(n,r){if(!t.palette)return;let i=a(),{_root:o,options:s}=e,{lastColor:c,currentColor:l}=o.preview;e._recalc&&(i.s=100*n,i.v=100-100*r,i.v<0&&(i.v=0),e._updateOutput(`slider`));let u=i.toRGBA().toString(0);this.element.style.background=u,this.wrapper.style.background=`\n                        linear-gradient(to top, rgba(0, 0, 0, ${i.a}), transparent),\n                        linear-gradient(to left, hsla(${i.h}, 100%, 50%, ${i.a}), rgba(255, 255, 255, ${i.a}))\n                    `,s.comparison?s.useAsButton||e._lastColor||c.style.setProperty(`--pcr-color`,u):(o.button.style.setProperty(`--pcr-color`,u),o.button.classList.remove(`clear`));let d=i.toHEXA().toString();for(let{el:t,color:n}of e._swatchColors)t.classList[d===n.toHEXA().toString()?`add`:`remove`](`pcr-active`);l.style.setProperty(`--pcr-color`,u)}}),hue:w({lock:i===`v`?`h`:`v`,element:e._root.hue.picker,wrapper:e._root.hue.slider,onstop:()=>e._emit(`changestop`,`slider`,e),onchange(n){if(!t.hue||!t.palette)return;let r=a();e._recalc&&(r.h=360*n),this.element.style.backgroundColor=`hsl(${r.h}, 100%, 50%)`,o.palette.trigger()}}),opacity:w({lock:r===`v`?`h`:`v`,element:e._root.opacity.picker,wrapper:e._root.opacity.slider,onstop:()=>e._emit(`changestop`,`slider`,e),onchange(n){if(!t.opacity||!t.palette)return;let r=a();e._recalc&&(r.a=Math.round(100*n)/100),this.element.style.background=`rgba(0, 0, 0, ${r.a})`,o.palette.trigger()}}),selectable:T({elements:e._root.interaction.options,className:`active`,onchange(t){e._representation=t.target.getAttribute(`data-type`).toUpperCase(),e._recalc&&e._updateOutput(`swatch`)}})};this._components=o}_bindEvents(){let{_root:e,options:t}=this,n=[i(e.interaction.clear,`click`,(()=>this._clearColor())),i([e.interaction.cancel,e.preview.lastColor],`click`,(()=>{this.setHSVA(...(this._lastColor||this._color).toHSVA(),!0),this._emit(`cancel`)})),i(e.interaction.save,`click`,(()=>{!this.applyColor()&&!t.showAlways&&this.hide()})),i(e.interaction.result,[`keyup`,`input`],(e=>{this.setColor(e.target.value,!0)&&!this._initializingActive&&(this._emit(`change`,this._color,`input`,this),this._emit(`changestop`,`input`,this)),e.stopImmediatePropagation()})),i(e.interaction.result,[`focus`,`blur`],(e=>{this._recalc=e.type===`blur`,this._recalc&&this._updateOutput(null)})),i([e.palette.palette,e.palette.picker,e.hue.slider,e.hue.picker,e.opacity.slider,e.opacity.picker],[`mousedown`,`touchstart`],(()=>this._recalc=!0),{passive:!0})];if(!t.showAlways){let r=t.closeWithKey;n.push(i(e.button,`click`,(()=>this.isOpen()?this.hide():this.show())),i(document,`keyup`,(e=>this.isOpen()&&(e.key===r||e.code===r)&&this.hide())),i(document,[`touchstart`,`mousedown`],(t=>{this.isOpen()&&!c(t).some((t=>t===e.app||t===e.button))&&this.hide()}),{capture:!0}))}if(t.adjustableNumbers){let t={rgba:[255,255,255,1],hsva:[360,100,100,1],hsla:[360,100,100,1],cmyk:[100,100,100,100]};u(e.interaction.result,((e,n,r)=>{let i=t[this.getColorRepresentation().toLowerCase()];if(i){let t=i[r],a=e+(t>=100?1e3*n:n);return a<=0?0:Number((a<t?a:t).toPrecision(3))}return e}))}if(t.autoReposition&&!t.inline){let e=null,r=this;n.push(i(window,[`scroll`,`resize`],(()=>{r.isOpen()&&(t.closeOnScroll&&r.hide(),e===null?(e=setTimeout((()=>e=null),100),requestAnimationFrame((function t(){r._rePositioningPicker(),e!==null&&requestAnimationFrame(t)}))):(clearTimeout(e),e=setTimeout((()=>e=null),100)))}),{capture:!0}))}this._eventBindings=n}_rePositioningPicker(){let{options:e}=this;if(!e.inline&&!this._nanopop.update({container:document.body.getBoundingClientRect(),position:e.position})){let e=this._root.app,t=e.getBoundingClientRect();e.style.top=(window.innerHeight-t.height)/2+`px`,e.style.left=(window.innerWidth-t.width)/2+`px`}}_updateOutput(e){let{_root:t,_color:n,options:r}=this;if(t.interaction.type()){let e=`to${t.interaction.type().getAttribute(`data-type`)}`;t.interaction.result.value=typeof n[e]==`function`?n[e]().toString(r.outputPrecision):``}!this._initializingActive&&this._recalc&&this._emit(`change`,n,e,this)}_clearColor(e=!1){let{_root:t,options:n}=this;n.useAsButton||t.button.style.setProperty(`--pcr-color`,`rgba(0, 0, 0, 0.15)`),t.button.classList.add(`clear`),n.showAlways||this.hide(),this._lastColor=null,this._initializingActive||e||(this._emit(`save`,null),this._emit(`clear`))}_parseLocalColor(e){let{values:t,type:n,a:r}=x(e),{lockOpacity:i}=this.options,a=r!==void 0&&r!==1;return t&&t.length===3&&(t[3]=void 0),{values:!t||i&&a?null:t,type:n}}_t(e){return this.options.i18n[e]||O.I18N_DEFAULTS[e]}_emit(e,...t){this._eventListener[e].forEach((e=>e(...t,this)))}on(e,t){return this._eventListener[e].push(t),this}off(e,t){let n=this._eventListener[e]||[],r=n.indexOf(t);return~r&&n.splice(r,1),this}addSwatch(e){let{values:t}=this._parseLocalColor(e);if(t){let{_swatchColors:e,_root:n}=this,r=S(...t),a=o(`<button type="button" style="--pcr-color: ${r.toRGBA().toString(0)}" aria-label="${this._t(`btn:swatch`)}"/>`);return n.swatches.appendChild(a),e.push({el:a,color:r}),this._eventBindings.push(i(a,`click`,(()=>{this.setHSVA(...r.toHSVA(),!0),this._emit(`swatchselect`,r),this._emit(`change`,r,`swatch`,this)}))),!0}return!1}removeSwatch(e){let t=this._swatchColors[e];if(t){let{el:n}=t;return this._root.swatches.removeChild(n),this._swatchColors.splice(e,1),!0}return!1}applyColor(e=!1){let{preview:t,button:n}=this._root,r=this._color.toRGBA().toString(0);return t.lastColor.style.setProperty(`--pcr-color`,r),this.options.useAsButton||n.style.setProperty(`--pcr-color`,r),n.classList.remove(`clear`),this._lastColor=this._color.clone(),this._initializingActive||e||this._emit(`save`,this._color),this}destroy(){cancelAnimationFrame(this._setupAnimationFrame),this._eventBindings.forEach((e=>a(...e))),Object.keys(this._components).forEach((e=>this._components[e].destroy()))}destroyAndRemove(){this.destroy();let{root:e,app:t}=this._root;e.parentElement&&e.parentElement.removeChild(e),t.parentElement.removeChild(t),Object.keys(this).forEach((e=>this[e]=null))}hide(){return!!this.isOpen()&&(this._root.app.classList.remove(`visible`),this._emit(`hide`),!0)}show(){return!this.options.disabled&&!this.isOpen()&&(this._root.app.classList.add(`visible`),this._rePositioningPicker(),this._emit(`show`,this._color),this)}isOpen(){return this._root.app.classList.contains(`visible`)}setHSVA(e=360,t=0,n=0,r=1,i=!1){let a=this._recalc;if(this._recalc=!1,e<0||e>360||t<0||t>100||n<0||n>100||r<0||r>1)return!1;this._color=S(e,t,n,r);let{hue:o,opacity:s,palette:c}=this._components;return o.update(e/360),s.update(r),c.update(t/100,1-n/100),i||this.applyColor(),a&&this._updateOutput(),this._recalc=a,!0}setColor(e,t=!1){if(e===null)return this._clearColor(t),!0;let{values:n,type:r}=this._parseLocalColor(e);if(n){let e=r.toUpperCase(),{options:i}=this._root.interaction,a=i.find((t=>t.getAttribute(`data-type`)===e));if(a&&!a.hidden)for(let e of i)e.classList[e===a?`add`:`remove`](`active`);return!!this.setHSVA(...n,t)&&this.setColorRepresentation(e)}return!1}setColorRepresentation(e){return e=e.toUpperCase(),!!this._root.interaction.options.find((t=>t.getAttribute(`data-type`).startsWith(e)&&!t.click()))}getColorRepresentation(){return this._representation}getColor(){return this._color}getSelectedColor(){return this._lastColor}getRoot(){return this._root}disable(){return this.hide(),this.options.disabled=!0,this._root.button.classList.add(`disabled`),this}enable(){return this.options.disabled=!1,this._root.button.classList.remove(`disabled`),this}}return t=t.default})()))}))(),1),Ne=[`#000000`,`#ffffff`,`#7f7f7f`,`#ff0000`,`#ff8000`,`#ffff00`,`#00ff00`,`#008000`,`#00ffff`,`#0000ff`,`#8000ff`,`#ff00ff`,`rgba(0,0,0,0)`];function Pe(e){let{button:t,value:n,onChange:r,paintButton:i=!0}=e,a=Me.default.create({el:t,theme:`nano`,default:n,useAsButton:!0,comparison:!1,appClass:`webmapx-pickr`,autoReposition:!1,swatches:Ne,components:{preview:!0,opacity:!0,hue:!0,interaction:{input:!0,cancel:!0,save:!0,rgba:!1,hsla:!1,hsva:!1,cmyk:!1,hex:!1}}});Fe(a,t);let o=n;return a.on(`change`,e=>{let n=e.toRGBA().toString(0);i&&(t.style.background=n),r(n)}),a.on(`save`,()=>{o=a.getColor()?.toRGBA().toString(0)??o,a.hide()}),a.on(`cancel`,()=>{i&&(t.style.background=o),e.onCancel?.(o),a.hide()}),a}function Fe(e,t){let n=e.getRoot().app;!n||typeof n.showPopover!=`function`||(n.popover=`manual`,n.style.border=`0`,n.style.padding=`0`,n.style.overflow=`visible`,e.on(`show`,()=>{Ie(n,t),n.matches(`:popover-open`)||n.showPopover(),Re(n,t)}),e.on(`hide`,()=>{n.matches(`:popover-open`)&&n.hidePopover()}))}function Ie(e,t){let n=Le(t)??document.body;e.parentElement!==n&&(e.matches(`:popover-open`)&&e.hidePopover(),n.appendChild(e))}function Le(e){let t=e;for(;t;){if(t instanceof ShadowRoot){t=t.host;continue}if(!(t instanceof Element))return null;let e=t.closest(`dialog`);if(!e){let e=t.getRootNode();if(!(e instanceof ShadowRoot))return null;t=e;continue}if(e.matches(`:modal`)&&e.getRootNode()===document)return e;t=e.parentNode}return null}function Re(e,t){let n=t.getBoundingClientRect(),{width:r,height:i}=e.getBoundingClientRect(),a=n.bottom+6,o=a+i<=window.innerHeight?a:Math.max(6,n.top-6-i),s=Math.min(Math.max(6,n.left),window.innerWidth-r-6);e.style.position=`fixed`,e.style.margin=`0`,e.style.inset=`auto`,e.style.left=`${s}px`,e.style.top=`${o}px`}var B,ze=`#bdbdbd`;function V(e){return String(e).replace(/([_/.])(?=\S)/g,`$1​`)}var Be=`__legend-outline-width`;function H(e,t){return t===`line`?`linear-gradient(to bottom, transparent 0 33%, ${e} 33% 67%, transparent 67% 100%)`:e}function U(e){return e===`interpolate`||e===`interpolate-hcl`||e===`interpolate-lab`}var W=class extends xe{static{B=this}constructor(...e){super(...e),this.layerId=``,this.collapsible=!0,this.meta=null,this.failedLegendUrl=null,this.zoom=2,this.legendCollapsed=!0,this.legendOverflowing=!1,this.editOverrides={},this.outlineWork=Promise.resolve(),this.editorOpenKey=null,this.terrainEnabled=!1,this.legendResizeObserver=null,this.measureLegendQueued=!1,this.pickrInstances=new Map,this.pickrOriginal=new Map}static{this.carriedOver=new Map}static{this.collapsedLegendHeight=180}static{this.styles=u`
        :host { display: block; }
        .legend-wrap { display: flex; flex-direction: column; gap: 2px; }
        .legend-collapse {
            position: relative;
        }
        .legend-collapse-content {
            overflow: visible;
        }
        .legend-collapse.collapsed .legend-collapse-content {
            max-height: ${B.collapsedLegendHeight}px;
            overflow: hidden;
        }
        .legend-collapse.collapsed::after {
            content: '';
            position: absolute;
            left: 0;
            right: 0;
            bottom: 26px;
            height: 42px;
            pointer-events: none;
            background: linear-gradient(
                to bottom,
                rgba(255, 255, 255, 0),
                var(--webmapx-legend-bg, var(--color-background, #fff))
            );
        }
        .legend-toggle {
            display: inline-flex;
            align-items: center;
            align-self: flex-start;
            margin-top: 4px;
            padding: 0;
            border: 0;
            background: none;
            color: var(--webmapx-legend-title-color, var(--color-primary, #2b6c8f));
            font: inherit;
            font-size: 0.75rem;
            line-height: 1.2;
            cursor: pointer;
        }
        .legend-toggle:hover {
            text-decoration: underline;
        }
        /* Top-aligned: a label that wraps to several lines keeps its swatch beside the first line, where reading starts. */
        .legend-row { display: flex; align-items: flex-start; gap: 6px; min-height: 18px; width: 100%; padding: 0; border: 0; background: transparent; font: inherit; color: inherit; text-align: left; }
        .legend-label { font-size: 0.75rem; color: var(--color-text-primary, #16202a); line-height: 1.2; min-width: 0; overflow-wrap: anywhere; }
        .legend-img { max-width: 100%; width: auto; height: auto; display: block; border-radius: 3px; align-self: flex-start; }
        .img-error { font-size: 0.75rem; color: var(--sl-color-danger-600, #c0392b); font-style: italic; }
        .sub-group-title { font-size: 0.75rem; font-weight: 600; color: var(--color-text-secondary, #5a6773); margin-top: 4px; }
        .sub-row { padding-left: 8px; }
        .editable { cursor: pointer; }
        output.expression { font-style: italic; opacity: 0.7; }
        .editable:hover { background: var(--color-background-secondary, #f4f6f8); }
        .style-editor {
            display: flex;
            flex-direction: column;
            gap: 4px;
            padding: 6px 4px 8px 8px;
            font-size: 0.75rem;
            color: var(--color-text-primary, #16202a);
        }
        .style-editor-row { display: flex; align-items: center; gap: 6px; }
        .style-editor-row label { flex: 0 0 5.5rem; }
        .style-editor-row input[type='range'] { flex: 1 1 auto; min-width: 0; }
        .style-editor-row output { flex: 0 0 2.5rem; text-align: right; color: var(--color-text-secondary, #5a6773); }
        .color-swatch {
            width: 20px;
            height: 12px;
            padding: 0;
            border: 1px solid var(--color-border, #d5dce3);
            border-radius: 3px;
            cursor: pointer;
            background-image:
                linear-gradient(45deg, #bbb 25%, transparent 25%, transparent 75%, #bbb 75%),
                linear-gradient(45deg, #bbb 25%, transparent 25%, transparent 75%, #bbb 75%);
            background-size: 6px 6px;
            background-position: 0 0, 3px 3px;
        }
        /* An outline is a line, so its swatch draws one rather than a filled
           block — with a fill and an outline row side by side, two identical
           blocks say nothing about which is which. */
        .color-swatch.line {
            background-image: none;
            border-color: transparent;
        }
    `}connectedCallback(){super.connectedCallback(),this.legendResizeObserver=new ResizeObserver(()=>this.queueLegendMeasure())}firstUpdated(){this.observeLegendContent(),this.queueLegendMeasure()}onStateChanged(e){let t=(e.mapLayers??{})[this.layerId];this.meta=t??null,this.dropSupersededOverrides(),typeof e.zoomLevel==`number`&&(this.zoom=e.zoomLevel),this.terrainEnabled=this.adapter?.isTerrainEnabled()===!0}dropSupersededOverrides(){let e=Object.entries(this.editOverrides);if(e.length===0)return;let t=!1,n={};for(let[r,i]of e){let e=this.paintOfSublayer(r),a={};for(let[n,r]of Object.entries(i))e&&JSON.stringify(e[n])===JSON.stringify(r)?a[n]=r:t=!0;Object.keys(a).length>0&&(n[r]=a)}t&&(this.editOverrides=n)}paintOfSublayer(e){let t=this.meta;if(!t)return null;let n=e=>e&&typeof e==`object`?e:{};if(!e||e===this.layerId){let e={...n(t.paint),...n(t.layout)};if(Object.keys(e).length>0||!Array.isArray(t.sublayers))return e}let r=t=>{if(!Array.isArray(t))return null;for(let i of t){let t=n(i);if(String(t.id??``)===e)return{...n(t.paint),...n(t.layout)};let a=r(t.sublayers);if(a)return a}return null};return r(t.sublayers)}observeLegendContent(){if(!this.legendResizeObserver)return;this.legendResizeObserver.disconnect();let e=this.renderRoot?.querySelector(`.legend-collapse-content`);e&&this.legendResizeObserver.observe(e)}queueLegendMeasure(){this.measureLegendQueued||(this.measureLegendQueued=!0,requestAnimationFrame(()=>{this.measureLegendQueued=!1,this.measureLegendOverflow()}))}measureLegendOverflow(){if(!this.collapsible){this.legendOverflowing&&=!1;return}let e=this.renderRoot?.querySelector(`.legend-collapse-content`),t=!!(e&&e.scrollHeight>B.collapsedLegendHeight+1);this.legendOverflowing!==t&&(this.legendOverflowing=t)}renderCollapsibleLegend(e){let t=this.collapsible&&this.legendOverflowing&&this.legendCollapsed,n=this.collapsible&&this.legendOverflowing;return d`
            <div class="legend-collapse ${t?`collapsed`:``}">
                <div class="legend-collapse-content">
                    ${e}
                </div>
                ${n?d`
                    <button
                        type="button"
                        class="legend-toggle"
                        @click=${()=>{this.legendCollapsed=!this.legendCollapsed}}>
                        ${this.legendCollapsed?`show more...`:`show less`}
                    </button>
                `:``}
            </div>
        `}evalAtZoom(e,t){if(!Array.isArray(e))return e;let n=e[0];if(U(n)&&e.length>=4){let n=[];for(let t=3;t+1<e.length;t+=2)n.push([Number(e[t]),e[t+1]]);if(n.length===0)return null;if(t<=n[0][0])return n[0][1];if(t>=n[n.length-1][0])return n[n.length-1][1];for(let e=0;e<n.length-1;e++){let[r,i]=n[e],[a,o]=n[e+1];if(t>=r&&t<=a){if(typeof i==`number`&&typeof o==`number`){let e=(t-r)/(a-r);return i+(o-i)*e}return t-r<a-t?i:o}}}if(n===`step`&&e.length>=3){let n=e[2];for(let r=3;r+1<e.length;r+=2)t>=Number(e[r])&&(n=e[r+1]);return n}return n===`literal`?e[1]:e}evalFilter(e,t){if(!Array.isArray(e)||e.length===0)return!0;let n=e[0];if(n===`all`)return e.slice(1).every(e=>this.evalFilter(e,t));if(n===`any`)return e.slice(1).some(e=>this.evalFilter(e,t));if(n===`none`)return!e.slice(1).some(e=>this.evalFilter(e,t));let r=e[1],i=e[2],a=Array.isArray(r)&&r[0]===`zoom`,o=Array.isArray(i)&&i[0]===`zoom`;if(a||o){let e=t,o=Number(a?i:r),s=a?e:o,c=a?o:e;if(n===`==`||n===`===`)return s===c;if(n===`!=`||n===`!==`)return s!==c;if(n===`<`)return s<c;if(n===`<=`)return s<=c;if(n===`>`)return s>c;if(n===`>=`)return s>=c}return!0}extractDataCases(e,t){if(!Array.isArray(e))return null;let n=e[0];if(n===`match`&&e.length>=5){let n=this.getPropName(e[1]),r=n?t?.get(n):void 0,i=r?.unit??``,a=r?.valuemap,o=[];for(let t=2;t+1<e.length-1;t+=2){let n=e[t],r=Array.isArray(n)?n.join(`, `):String(n),s=a?.find(e=>String(e.value)===String(n)),c=s?s.label:i?`${r}${i}`:r;o.push({label:c,paint:e[t+1],path:[t+1]})}return o.push({label:``,paint:e[e.length-1],path:[e.length-1]}),o.length>1?o:null}if(n===`step`&&e.length>=5){let n=e[1];if(!Array.isArray(n)||n[0]===`zoom`)return null;let r=this.getPropName(n),i=(r?t?.get(r):void 0)?.unit??``,a=[];for(let t=3;t+1<e.length;t+=2)typeof e[t]==`number`&&a.push(e[t]);let o=j(a,i),s=e=>o(e),c=[{label:a.length>0?`< ${s(a[0])}`:``,paint:e[2],path:[2]}];for(let t=3,n=0;t+1<e.length;t+=2,n+=1){let r=a[n],i=a[n+1];c.push({label:i===void 0?`≥ ${s(r)}`:`${s(r)} – ${s(i)}`,paint:e[t+1],path:[t+1]})}return c}if(U(n)&&e.length>=5){let n=e[2];if(!Array.isArray(n)||n[0]===`zoom`)return null;let r=this.getPropName(n),i=(r?t?.get(r):void 0)?.unit??``,a=[];for(let t=3;t+1<e.length;t+=2)typeof e[t]==`number`&&a.push(e[t]);let o=j(a,i),s=[];for(let t=3;t+1<e.length;t+=2){let n=e[t];s.push({label:typeof n==`number`?o(n):String(n),paint:e[t+1],path:[t+1]})}return s.length>1?s:null}if(n===`case`&&e.length>=3){let n=[];for(let r=1;r+1<e.length;r+=2){let i=this.conditionLabel(e[r],t)??`class ${Math.floor(r/2)+1}`;n.push({label:i,paint:e[r+1],path:[r+1]})}return n.push({label:``,paint:e[e.length-1],path:[e.length-1]}),n.length<=1?null:this.expandNestedCases(n,t)}return null}expandNestedCases(e,t){let n=[];for(let r of e){let e=Array.isArray(r.paint)?this.extractDataCases(r.paint,t):null;e?n.push(...e.map(e=>({...e,path:[...r.path,...e.path]}))):n.push(r)}let r=[],i=[];for(let e of n)(e.label===``&&typeof e.paint==`string`&&n.some(t=>t!==e&&t.label===``&&t.paint===e.paint)?r:i).push(e);return r.length>0?[...i,r[0]]:i}extractColorRamp(e,t){if(!Array.isArray(e)||!U(e[0])||e.length<7)return null;let n=e[2];if(!Array.isArray(n)||n[0]===`zoom`)return null;let r=[];for(let t=3;t+1<e.length;t+=2){if(typeof e[t]!=`number`||typeof e[t+1]!=`string`)return null;r.push({value:e[t],color:e[t+1]})}let i=this.getPropName(n),a=i?t?.get(i):void 0;return{title:a?.label||i||``,unit:a?.unit??``,stops:r}}renderColorRamp(e){let{stops:t}=e,n=t[0].value,r=t[t.length-1].value-n||1,i=t.map(e=>`${e.color} ${(e.value-n)/r*100}%`).join(`, `),a=j(t.map(e=>e.value),e.unit);return d`
            <div class="legend-row" style="flex-direction:column;align-items:flex-start;gap:2px">
                ${e.title?d`<span class="legend-label" title=${e.title}>${V(e.title)}</span>`:``}
                <div style="width:150px;height:15px;background:linear-gradient(to right, ${i})"></div>
                <div style="width:150px;display:flex;justify-content:space-between;font-size:0.85em">
                    <span>${a(t[0].value)}</span><span>${a(t[t.length-1].value)}</span>
                </div>
            </div>`}isDataDriven(e){if(!Array.isArray(e))return!1;let t=e[0];return t===`match`||t===`case`?!0:t===`step`?!(Array.isArray(e[1])&&e[1][0]===`zoom`):U(t)?Array.isArray(e[2])&&e[2][0]!==`zoom`:!1}renderZoomHint(e,t,n){let r=n>t;return d`<div class="legend-row"><span class="legend-label">${r?`zoom out`:`zoom in`} to level ${r?t:e} for display</span></div>`}renderCompositeLegend(e,t){let n=[],r=new Set,i=new Map,a=e.filter(e=>!!e&&typeof e==`object`),o=me(a),s=new Set(o.values()),c=e.length-s.size===1,l=this.getAttrTranslations(),u=1/0,f=-1/0;for(let t of e){let e=t;if(!e||typeof e.type!=`string`||e.hideFromLegend===!0||e.layout?.visibility===`none`)continue;let n=typeof e.minzoom==`number`?e.minzoom:0,r=(typeof e.maxzoom==`number`?e.maxzoom:24)+1;u=Math.min(u,n),f=Math.max(f,r)}if(u!==1/0&&(t<u||t>=f))return this.renderZoomHint(u,f-1,t);for(let u of[...e].reverse()){let e=u;if(!e||typeof e.type!=`string`||e.hideFromLegend===!0||s.has(String(e.id??``)))continue;let f=typeof e.minzoom==`number`?e.minzoom:0,p=typeof e.maxzoom==`number`?e.maxzoom:24;if(t<f||t>=p+1||e.filter&&!this.evalFilter(e.filter,t)||e.layout?.visibility===`none`)continue;let m=e.type,h=e.paint&&typeof e.paint==`object`?e.paint:{},g=e.layout&&typeof e.layout==`object`?e.layout:{},_=String(e.id??``),v=ee(this.meta,e,_,c,this.layerId),y={};for(let[e,n]of Object.entries(h))y[e]=this.isDataDriven(n)?n:this.evalAtZoom(n,t);let b={};for(let[e,n]of Object.entries(g))b[e]=this.evalAtZoom(n,t);let x={...y},S={...b},C=this.editOverrides[_];C&&(Object.assign(y,C),`text-size`in C&&(b[`text-size`]=C[`text-size`]));let w=o.has(_)?a.find(e=>String(e.id??``)===o.get(_)):void 0;if(m===`fill`){let t=se(e,w??null);w&&(y[`fill-outline-color`]=t.color),y[Be]=t.width}let T=m===`fill`?`fill-color`:m===`fill-extrusion`?`fill-extrusion-color`:m===`line`?`line-color`:m===`circle`?`circle-color`:m===`symbol`?`text-color`:m===`background`?`background-color`:null,E=T?y[T]??h[T]:null,D=E?this.extractDataCases(E,l):null,O=this.extractColorRamp(E,l);if(O){let e=`${m}|${_}`;if(r.has(e))continue;r.add(e),i.has(e)||i.set(e,[_]),c||n.push(d`<div class="sub-group-title">${v}</div>`),n.push(this.renderColorRamp(O))}else if(D&&D.length>1){let a=`${m}|${_}`;if(r.has(a))continue;r.add(a),i.has(a)||i.set(a,[_]),c||n.push(d`<div class="sub-group-title">${v}</div>`);let o=Array.isArray(E)?E:null,s=typeof e.metadata?.noDataLabel==`string`?String(e.metadata.noDataLabel):``;for(let e=0;e<D.length;e++){let{paint:i,path:a}=D[e],c=D[e].label===``?s:D[e].label;if(c===``)continue;let l={...y,[T]:i},u=this.renderSwatch(m,l,t,b);if(!u)continue;let f=`${m}|${String(i)}`;if(r.has(f))continue;r.add(f);let p=o&&typeof i==`string`&&a.length>0?d`<button type="button" style="background:none;border:none;padding:0;cursor:pointer;display:flex;align-items:center"
                            @click=${e=>{e.stopPropagation(),this.openStopColorPicker(e.currentTarget,[_],T,o,a,i)}}>
                            ${u}</button>`:u;n.push(d`
                        <div class="legend-row sub-row">
                            ${p}
                            <span class="legend-label" title=${c}>${V(c)}</span>
                        </div>`)}m===`fill`&&n.push(...this.renderClassedOutline(_,y))}else if(m===`circle`){let e=`${m}|${_}`;r.has(e)||(r.add(e),i.has(e)||i.set(e,[_]),c||n.push(d`<div class="sub-group-title">${v}</div>`),n.push(...this.renderLegendItems([_],m,y)))}else{let e=T?String(x[T]??`#aaa`):`#aaa`,a=`${m}|${e}`;if(m===`line`){let t=x[`line-dasharray`];a=`line|${e}|${Array.isArray(t)?t.join(`,`):String(t??``)}`}else if(m===`fill`&&w)a=`fill|${_}`;else if(m===`symbol`){let t=S[`text-size`]??x[`text-size`],n=Math.round(Number(typeof t==`number`?t:12)),r=(Array.isArray(S[`text-font`])?S[`text-font`]:[]).join(` `).toLowerCase(),i=r.includes(`bold`)||r.includes(`black`)?`700`:r.includes(`semibold`)||r.includes(`demibold`)||r.includes(`medium`)?`600`:`400`,o=Math.round(Number(x[`text-halo-width`]??0)*2)/2;a=`symbol|${e}|${n}|${i}|${o}|${o>0?String(x[`text-halo-color`]??``):``}`}if(i.has(a)||i.set(a,[]),i.get(a).push(_),r.has(a))continue;r.add(a);let o=this.renderSwatch(m,y,t,b);if(!o)continue;let s=this.isEditableType(m,y,!0),c=i.get(a),l=c.includes(this.editorOpenKey??``);if(n.push(d`
                    ${s?d`<button type="button" class="legend-row editable" aria-expanded=${l}
                            @click=${()=>{this.editorOpenKey=l?null:c[0]}}>
                            ${o}
                            <span class="legend-label" title=${v}>${V(v)}</span>
                        </button>`:d`<div class="legend-row">
                            ${o}
                            <span class="legend-label" title=${v}>${V(v)}</span>
                        </div>`}`),s&&l){let e=m===`symbol`?{...y,"text-size":b[`text-size`]??y[`text-size`]}:y;n.push(this.renderStyleEditor(c,m,e))}}}return d`<div class="legend-wrap">${n}</div>`}resolveSwatchColor(e,t){return typeof e==`string`?e:t}renderSwatch(e,t,n,r){if(e===`fill`){let e=this.resolveSwatchColor(t[`fill-color`],`#000000`),n=Number(t[`fill-opacity`]??.7),r=String(t[`fill-outline-color`]??e),i=Math.min(Number(t[Be]??1)||1,3),a=Math.max(1,i/2);return l`<svg width="20" height="12" style="flex-shrink:0">
                <rect x="${a}" y="${a}" width="${20-2*a}" height="${12-2*a}" fill="${e}" fill-opacity="${n}"
                    stroke="${r}" stroke-width="${i}" rx="1"/>
            </svg>`}if(e===`fill-extrusion`)return l`<svg width="20" height="12" style="flex-shrink:0">
                <rect x="1" y="1" width="18" height="10" fill="${String(t[`fill-extrusion-color`]??`#aaa`)}" fill-opacity="${Number(t[`fill-extrusion-opacity`]??.8)}" stroke="none"/>
                <line x1="19" y1="1" x2="19" y2="11" stroke="rgba(0,0,0,0.3)" stroke-width="2"/>
                <line x1="1" y1="11" x2="19" y2="11" stroke="rgba(0,0,0,0.3)" stroke-width="2"/>
            </svg>`;if(e===`line`)return l`<svg width="20" height="12" style="flex-shrink:0">
                <line x1="1" y1="6" x2="19" y2="6" stroke="${this.resolveSwatchColor(t[`line-color`],`#616161`)}" stroke-width="${Math.min(Number(t[`line-width`]??2),4)}"
                    stroke-dasharray="${Array.isArray(t[`line-dasharray`])?t[`line-dasharray`].join(` `):``}" stroke-linecap="round"/>
            </svg>`;if(e===`circle`){let e=String(t[`circle-color`]??`#aaa`);return l`<svg width="20" height="12" style="flex-shrink:0">
                <circle cx="10" cy="6" r="${Math.min(Number(t[`circle-radius`]??4),5)}" fill="${e}" stroke="${String(t[`circle-stroke-color`]??e)}" stroke-width="${Number(t[`circle-stroke-width`]??0)}"/>
            </svg>`}if(e===`symbol`){let e=String(t[`text-color`]??`#555`),n=t[`text-halo-width`]&&Number(t[`text-halo-width`])>0?String(t[`text-halo-color`]??`rgba(255,255,255,0.8)`):null,i=r?.[`text-size`]??t[`text-size`],a=Math.min(Math.max(Math.round((typeof i==`number`?i:12)*.9),7),24),o=(Array.isArray(r?.[`text-font`])?r[`text-font`]:[]).join(` `).toLowerCase(),s=o.includes(`bold`)||o.includes(`black`)?`700`:o.includes(`semibold`)||o.includes(`demibold`)||o.includes(`medium`)?`600`:`400`,c=o.includes(`italic`)||o.includes(`oblique`)?`italic`:`normal`,u=Math.max(20,a+4);return l`<svg width="${u}" height="${a+4}" style="flex-shrink:0">
                ${n?l`<text x="${u/2}" y="${a}" text-anchor="middle"
                    font-size="${a}" font-weight="${s}" font-style="${c}"
                    stroke="${n}" stroke-width="3" stroke-linejoin="round"
                    fill="none" font-family="sans-serif">A</text>`:``}
                <text x="${u/2}" y="${a}" text-anchor="middle"
                    font-size="${a}" font-weight="${s}" font-style="${c}"
                    fill="${e}" font-family="sans-serif">A</text>
            </svg>`}return e===`background`?l`<svg width="20" height="12" style="flex-shrink:0">
                <rect x="1" y="1" width="18" height="10" fill="${String(t[`background-color`]??`#eee`)}" rx="1"/>
            </svg>`:e===`raster`||e===`hillshade`?l`<svg width="20" height="12" style="flex-shrink:0">
                <defs><pattern id="rp" width="4" height="4" patternUnits="userSpaceOnUse">
                    <rect width="2" height="2" fill="#ccc"/>
                    <rect x="2" y="2" width="2" height="2" fill="#eee"/>
                </pattern></defs>
                <rect x="1" y="1" width="18" height="10" fill="url(#rp)" rx="1"/>
            </svg>`:null}extractLegendStops(e){if(typeof e==`string`||typeof e==`number`)return[{value:null,paint:e}];if(!Array.isArray(e))return[{value:null,paint:null}];let t=e[0];if(U(t)){let t=[];for(let n=3;n+1<e.length;n+=2)t.push({value:e[n],paint:e[n+1]});return t.length?t:[{value:null,paint:null}]}if(t===`step`){let t=[{value:null,paint:e[2]}];for(let n=3;n+1<e.length;n+=2)t.push({value:e[n],paint:e[n+1]});return t}if(t===`match`){let t=[];for(let n=2;n+1<e.length-1;n+=2)t.push({value:e[n],paint:e[n+1]});return t.length?t:[{value:null,paint:null}]}return[{value:null,paint:null}]}renderBubbleLegend(e,t,n){let r=Math.min(n,1.5),i=Math.max(...e.map(e=>e.radius)),a=i+r+2,o=a*2,s=i*2+r*2+4,c=s-2,u=o+8,f=o+60,p=[...e].sort((e,t)=>t.radius-e.radius).map(e=>{let n=Math.max(1,e.radius*1),i=c-n-r,o=i-n;return l`
                <circle cx="${a}" cy="${i}" r="${n}"
                    fill="${e.color}" fill-opacity="0.75"
                    stroke="${t}" stroke-width="${r}"/>
                <line x1="${a+n+r}" y1="${o}" x2="${u-2}" y2="${o}"
                    stroke="#999" stroke-width="0.5" stroke-dasharray="2 2"/>
                <text x="${u}" y="${o+4}" font-size="9" fill="#555">${e.value}</text>
            `}),m=Math.max(14,Math.floor((o+60)/e.length)),h=e.length*m,g=e.map((e,t)=>l`<rect x="${t*m}" y="0" width="${m}" height="${8}" fill="${e.color}"/>
                <text x="${t*m+m/2}" y="${17}" font-size="8"
                    text-anchor="middle" fill="#555">${e.value}</text>`),_=e.every(t=>t.color===e[0].color);return d`
            <div class="legend-row" style="flex-direction:column;align-items:flex-start;gap:6px">
                ${l`<svg width="${f}" height="${s}" style="overflow:visible">
                    <line x1="${a}" y1="${c}" x2="${a}" y2="2" stroke="#bbb" stroke-width="1"/>
                    ${p}
                </svg>`}
                ${_?``:l`<svg width="${h}" height="${20}" style="overflow:visible">
                    ${g}
                </svg>`}
            </div>`}renderCircleRow(e,t,n,r,i){let a=Math.min(Math.max(r,2),12),o=Math.min(n,2),s=(a+o)*2+2;return d`
            <div class="legend-row">
                ${l`<svg width="${s}" height="${s}" style="flex-shrink:0">
                    <circle cx="${s/2}" cy="${s/2}" r="${a}"
                        fill="${e}" stroke="${t}" stroke-width="${o}"/>
                </svg>`}
                ${i===null?``:d`<span class="legend-label" title=${i}>${V(i)}</span>`}
            </div>`}renderFillRow(e,t,n,r,i){let a=l`<svg width="24" height="14" style="flex-shrink:0">
            <rect x="1" y="1" width="22" height="12"
                fill="${e}" fill-opacity="${n}"
                stroke="${t}" stroke-width="1.5" rx="2"/>
        </svg>`;return d`
            <div class="legend-row">
                ${i?d`<button type="button" aria-label=${r?`Change colour for ${r}`:`Change colour`} style="background:none;border:none;padding:0;cursor:pointer;display:flex;align-items:center" @click=${i}>${a}</button>`:a}
                ${r===null?``:d`<span class="legend-label" title=${r}>${V(r)}</span>`}
            </div>`}colorExprStopIndices(e){let t=e[0];if(t===`match`){let t=[];for(let n=3;n<e.length-1;n+=2)t.push(n);return t}if(t===`case`){if(e.slice(1).some((e,t)=>t%2==1&&typeof e!=`string`)||typeof e[e.length-1]!=`string`)return null;let t=[];for(let n=1;n+1<e.length;n+=2)t.push(n+1);return t}if(t===`step`){let t=[2];for(let n=3;n+1<e.length;n+=2)t.push(n+1);return t}return null}openStopColorPicker(e,t,n,r,i,a){let o=`${t.join(`,`)}::${n}::${i.join(`.`)}`;this.openColorPicker(e,t,o,a,e=>{let a=(t,n)=>{let r=[...t],o=i[n];return r[o]=n===i.length-1?e:a(t[o],n+1),r};this.setPaintOverride(t,n,a(r,0))},!1)}renderLineRow(e,t,n,r){return d`
            <div class="legend-row">
                ${l`<svg width="24" height="14" style="flex-shrink:0">
                    <line x1="2" y1="7" x2="22" y2="7"
                        stroke="${e}" stroke-width="${Math.min(t,4)}"
                        stroke-dasharray="${n}" stroke-linecap="round"/>
                </svg>`}
                ${r===null?``:d`<span class="legend-label" title=${r}>${V(r)}</span>`}
            </div>`}renderEditableLineRow(e,t,n,r,i,a,o){return d`
            <div class="legend-row">
                <button type="button" class="color-swatch" style="background:transparent; border:none; padding:0; width:24px; height:14px; flex-shrink:0; cursor:pointer;"
                    @click=${n=>{n.stopPropagation(),this.openStopColorPicker(n.currentTarget,e,`line-color`,a,o,t)}}>
                    ${l`<svg width="24" height="14">
                        <line x1="2" y1="7" x2="22" y2="7"
                            stroke="${t}" stroke-width="${Math.min(n,4)}"
                            stroke-dasharray="${r}" stroke-linecap="round"/>
                    </svg>`}
                </button>
                ${i===null?``:d`<span class="legend-label" title=${i}>${V(i)}</span>`}
            </div>`}getAttrTranslations(){return ye(this.meta?.attributes,this.adapter?.store.getState().attributeMetadata)}getPropName(e){return Array.isArray(e)&&e[0]===`get`&&typeof e[1]==`string`?e[1]:null}conditionLabel(e,t){if(!Array.isArray(e)||e.length<3)return``;let n=e[0],r=this.getPropName(e[1]),i=e[2],a=r?t?.get(r):void 0,o=a?.unit??``;if(a?.valuemap){let e=a.valuemap.find(e=>String(e.value)===String(i)&&(e.operator===void 0||e.operator===n));if(e)return e.label}return n===`==`?typeof i==`number`||typeof i==`string`?`${i}${o}`:``:[`<`,`<=`,`>`,`>=`].includes(n)&&(typeof i==`number`||typeof i==`string`)?`${n} ${i}${o}`:``}formatNumber(e,t,n){return ve(e,{unit:t,decimals:n})}mergeNoDataRows(e){let t=new Set;return e.filter(e=>e.label===``?t.has(e.color)?!1:(t.add(e.color),!0):!0)}extractColorClasses(e,t){if(!Array.isArray(e))return null;let n=e[0];if(n===`step`&&e.length>=5){let n=e[1];if(!Array.isArray(n)||n[0]===`zoom`)return null;let r=this.getPropName(n),i=(r?t?.get(r):void 0)?.unit??``,a=[];for(let t=3;t+1<e.length;t+=2)typeof e[t]==`number`&&a.push(e[t]);let o=[],s=j(a,i);typeof e[2]==`string`&&a.length>0&&o.push({label:`< ${s(a[0])}`,color:e[2]});for(let t=3,n=0;t+1<e.length;t+=2,n+=1){let r=e[t+1];if(typeof r!=`string`)continue;let i=a[n+1];o.push({label:i===void 0?`≥ ${s(a[n])}`:`${s(a[n])} – ${s(i)}`,color:r})}return o.length>1?o:null}if(n===`case`){let n=[];for(let r=1;r+1<e.length;r+=2){let i=this.conditionLabel(e[r],t);if(i===null)continue;let a=e[r+1];typeof a==`string`?n.push({label:i||``,color:a}):n.push(...this.extractColorClasses(a,t)??[])}let r=e[e.length-1];return typeof r==`string`?n.push({label:``,color:r}):n.push(...this.extractColorClasses(r,t)??[]),n.length>1?this.mergeNoDataRows(n):null}if(n===`match`){let n=this.getPropName(e[1]),r=n?t?.get(n):void 0,i=r?.unit??``,a=r?.valuemap,o=[];for(let t=2;t+1<e.length-1;t+=2){let n=(Array.isArray(e[t]),e[t]),r=Array.isArray(n)?n.join(`, `):String(n),s=a?.find(e=>String(e.value)===String(n)),c=s?s.label:i?`${r}${i}`:r,l=typeof e[t+1]==`string`?e[t+1]:``;l&&o.push({label:c,color:l})}let s=e[e.length-1];return typeof s==`string`&&o.push({label:``,color:s}),o.length>1?o:null}return null}textFieldName(e){if(typeof e==`string`){let t=e.match(/^\{([^}]+)\}$/);return t?t[1]:null}if(!Array.isArray(e))return null;if(e[0]===`get`&&typeof e[1]==`string`)return e[1];for(let t of e.slice(1)){let e=this.textFieldName(t);if(e)return e}return null}isZoomExpression(e){if(!Array.isArray(e))return!1;let t=e[0];return(U(t)||t===`step`)&&Array.isArray(e[1])?e[1][0]===`zoom`||e[2]?.[0]===`zoom`:U(t)&&e.length>=3?Array.isArray(e[2])&&e[2][0]===`zoom`:!1}parseRadiusFormula(e){if(!Array.isArray(e))return null;if(e[0]===`*`&&typeof e[1]==`number`){let t=e[2];if(Array.isArray(t)&&t[0]===`sqrt`&&Array.isArray(t[1])&&t[1][0]===`get`)return{coeff:e[1],base:0,prop:t[1][1],isSqrt:!0};if(Array.isArray(t)&&t[0]===`get`)return{coeff:e[1],base:0,prop:t[1],isSqrt:!1}}if(e[0]===`+`){let t=typeof e[1]==`number`?e[1]:typeof e[2]==`number`?e[2]:0,n=[e[1],e[2]].find(e=>Array.isArray(e)&&e[0]===`*`);if(n&&Array.isArray(n)){let e=n[2];if(Array.isArray(e)&&e[0]===`sqrt`&&Array.isArray(e[1])&&e[1][0]===`get`)return{coeff:n[1],base:t,prop:e[1][1],isSqrt:!0}}}return null}extractProportionalRadius(e,t){let n=this.parseRadiusFormula(e);if(n)return n;if(!Array.isArray(e)||e[0]!==`interpolate`)return null;let r=e[1],i=Array.isArray(r)&&r[0]===`exponential`&&typeof r[1]==`number`?r[1]:1,a=[];for(let t=3;t+1<e.length;t+=2)a.push({z:Number(e[t]),expr:e[t+1]});if(a.length===0)return null;let o=a[0],s=a[a.length-1];for(let e=0;e<a.length-1;e++)if(t>=a[e].z&&t<=a[e+1].z){o=a[e],s=a[e+1];break}let c=this.parseRadiusFormula(o.expr),l=this.parseRadiusFormula(s.expr);if(!c&&!l)return null;if(o.z===s.z||t<=o.z)return c??l;if(t>=s.z)return l??c;let u;u=i!==1&&i>0?(i**+(t-o.z)-1)/(i**+(s.z-o.z)-1):(t-o.z)/(s.z-o.z),u=Math.max(0,Math.min(1,u));let d=c??{coeff:0,base:0,prop:l.prop,isSqrt:l.isSqrt},f=l??{coeff:0,base:0,prop:c.prop,isSqrt:c.isSqrt};return{coeff:d.coeff+u*(f.coeff-d.coeff),base:d.base+u*(f.base-d.base),prop:f.prop||d.prop,isSqrt:f.isSqrt||d.isSqrt}}toCssColor(e,t){if(typeof e==`string`)return e;if(Array.isArray(e)&&(e[0]===`match`||e[0]===`case`)&&e.length>=2){let t=e[e.length-1];if(typeof t==`string`)return t}return t}destroyPickrs(){for(let e of this.pickrInstances.values())e.destroyAndRemove();this.pickrInstances.clear(),this.pickrOriginal.clear()}disconnectedCallback(){super.disconnectedCallback(),this.legendResizeObserver?.disconnect(),this.legendResizeObserver=null,this.destroyPickrs()}updated(e){if(e.has(`layerId`)){this.legendCollapsed=!0;let e=B.carriedOver.get(this.layerId);e&&(B.carriedOver.delete(this.layerId),this.editorOpenKey=e.editorOpenKey,this.legendCollapsed=e.legendCollapsed),this.store&&this.onStateChanged(this.store.getState())}e.has(`editorOpenKey`)&&this.destroyPickrs(),this.observeLegendContent(),this.queueLegendMeasure()}openColorPicker(e,t,n,r,i,a=!0){let o=`${t.join(`,`)}::${n}`,s=i??(e=>this.setPaintOverride(t,n,e)),c=this.pickrInstances.get(o);c?(c.setColor(r),this.pickrOriginal.set(o,r)):(c=Me.default.create({el:e,theme:`nano`,default:r,useAsButton:!0,comparison:!1,appClass:`webmapx-pickr`,autoReposition:!1,swatches:Ne,components:{preview:!0,opacity:!0,hue:!0,interaction:{input:!0,cancel:!0,save:!0,rgba:!1,hsla:!1,hsva:!1,cmyk:!1,hex:!1}}}),c.on(`change`,t=>{let n=t.toRGBA().toString(0);a&&(e.style.background=n),s(n)}),c.on(`save`,()=>{c.hide()}),c.on(`cancel`,()=>{let t=this.pickrOriginal.get(o);a&&(e.style.background=t),s(t),c.hide()}),!a&&e.style.backgroundColor===`transparent`&&c.on(`hide`,()=>{e.style.background=`transparent`}),Fe(c,e),this.pickrInstances.set(o,c),this.pickrOriginal.set(o,r),c.show())}setPaintOverride(e,t,n){let r={...this.editOverrides};for(let i of e)r[i]={...r[i]??{},[t]:n},this.adapter?.updateLayerStyle(this.layerId,i||this.layerId,{[t]:n});this.isConnected&&(this.editOverrides=r)}renderRangeRow(e,t,n,r,i,a,o,s=``){let c=!Number.isFinite(r),l=c?(i+a)/2:r;return d`
            <div class="style-editor-row">
                <label>${t}
                    <input type="range" min=${i} max=${a} step=${o} .value=${String(l)}
                        title=${c?`Data-driven value — moving this slider replaces the expression with a fixed number`:``}
                        @input=${t=>{let r=Number(t.target.value);for(let t of e)this.adapter?.updateLayerStyle(this.layerId,t||this.layerId,{[n]:r});let i=t.target.closest(`.style-editor-row`)?.querySelector(`output`);i&&(i.textContent=`${r}${s}`,i.classList.remove(`expression`))}}
                        @change=${t=>this.setPaintOverride(e,n,Number(t.target.value))}>
                </label>
                <output class=${c?`expression`:``}>${c?`expression`:d`${r}${s}`}</output>
            </div>`}renderClassedOutline(e,t){let n=this.toCssColor(t[`fill-outline-color`],`#000000`),r=Math.min(Number(t[Be]??1)||1,4),i=`${e}::outline`,a=this.editorOpenKey===i;return[d`
            <button type="button" class="legend-row sub-row editable" aria-expanded=${a} aria-label="Edit outline"
                @click=${e=>{e.stopPropagation(),this.editorOpenKey=a?null:i}}>
                ${l`<svg width="24" height="14" style="flex-shrink:0">
                    <line x1="2" y1="7" x2="22" y2="7" stroke="${n}" stroke-width="${r}" stroke-linecap="round"/>
                </svg>`}
                <span class="legend-label">outline</span>
            </button>`,...a?[d`<div class="style-editor">${this.renderOutlineRows(e,t)}</div>`]:[]]}fillOutlineOf(e){let t=this.adapter?.getSubLayers(this.layerId);if(!t)return null;let n=t.findIndex(t=>String(t.id??``)===e&&t.type===`fill`);if(n<0)return null;let r=de(t,n),i=r>=0?t[r]:null;return{subs:t,outline:se(t[n],i),companionId:i?String(i.id??``):null}}applyFillOutline(e,t){return this.outlineWork=this.outlineWork.then(async()=>{let n=this.adapter,r=this.fillOutlineOf(e);if(!n||!r)return;let i=oe(r.subs,e,{...r.outline,...t}),a=i.length===r.subs.length&&i.every((e,t)=>e.id===r.subs[t].id&&JSON.stringify(e.layout??null)===JSON.stringify(r.subs[t].layout??null)),o=[],s=!1;if(a&&i.forEach((e,t)=>{let n=r.subs[t].paint??{},i=e.paint??{};Object.keys(n).some(e=>!(e in i))&&(s=!0);let a=Object.fromEntries(Object.entries(i).filter(([e,t])=>JSON.stringify(n[e])!==JSON.stringify(t)));Object.keys(a).length>0&&o.push([String(e.id??``),a])}),a&&!s){for(let[e,t]of o)n.updateLayerStyle(this.layerId,e,t);return}n.canRebuildLayer(this.layerId)&&(B.carriedOver.set(this.layerId,{editorOpenKey:this.editorOpenKey,legendCollapsed:this.legendCollapsed}),await n.setSubLayers(this.layerId,i),B.carriedOver.delete(this.layerId))}).catch(e=>{console.warn(`[webmapx-layer-legend] outline change failed`,e)}),this.outlineWork}renderOutlineRows(e,t){let n=this.fillOutlineOf(e),r=!!n&&(n.companionId!==null||this.adapter?.canRebuildLayer(this.layerId)===!0);if(!n||!r){let n=this.toCssColor(t[`fill-outline-color`],this.toCssColor(t[`fill-color`],`#000000`));return[this.renderColorRow([e],`outline color`,`fill-outline-color`,n,`line`)]}let{outline:i,companionId:a}=n,o=this.toCssColor(i.color,`#000000`);return[d`
            <div class="style-editor-row">
                <label>outline color</label>
                <button type="button" class="color-swatch line" aria-label="Outline colour"
                    style="background:${H(o,`line`)}"
                    @click=${t=>{let n=t.currentTarget;this.openColorPicker(n,[e],`outline`,o,t=>{n.style.background=H(t,`line`);let r=this.fillOutlineOf(e)?.outline.width??0;this.applyFillOutline(e,r>0?{color:t}:{color:t,width:1})},!1)}}></button>
            </div>`,d`
            <div class="style-editor-row">
                <label>outline width
                    <input type="range" min="0" max="10" step="0.5" .value=${String(i.width)}
                        @input=${e=>{let t=Number(e.target.value);a&&t>0&&this.adapter?.updateLayerStyle(this.layerId,a,{"line-width":t});let n=e.target.closest(`.style-editor-row`)?.querySelector(`output`);n&&(n.textContent=t===0?`none`:`${t}px`)}}
                        @change=${t=>{this.applyFillOutline(e,{width:Number(t.target.value)})}}>
                </label>
                <output>${i.width===0?`none`:`${i.width}px`}</output>
            </div>`]}renderColorRow(e,t,n,r,i=`area`){return d`
            <div class="style-editor-row">
                <label>${t}</label>
                <button type="button" class="color-swatch ${i===`line`?`line`:``}"
                    style="background:${H(r,i)}"
                    @click=${t=>{let a=t.currentTarget;this.openColorPicker(a,e,n,r,t=>{a.style.background=H(t,i),this.setPaintOverride(e,n,t)},!1)}}></button>
            </div>`}renderStyleEditor(e,t,n){if(t===`fill`||t===`fill-extrusion`){let r=t===`fill`?`fill-color`:`fill-extrusion-color`,i=this.toCssColor(n[r],`#000000`),a=t===`fill`?`fill-opacity`:`fill-extrusion-opacity`,o=Number(n[a]??1),s=[this.renderColorRow(e,`fill color`,r,i),this.renderRangeRow(e,`opacity`,a,o,0,1,.05)];if(t===`fill`&&e.length===1)s.push(...this.renderOutlineRows(e[0]||this.layerId,n));else if(t===`fill`){let t=this.toCssColor(n[`fill-outline-color`],i);s.push(this.renderColorRow(e,`outline color`,`fill-outline-color`,t,`line`))}return d`<div class="style-editor">${s}</div>`}if(t===`line`){let t=this.toCssColor(n[`line-color`],`#000000`),r=Number(n[`line-width`]??2),i=Number(n[`line-opacity`]??1);return d`<div class="style-editor">
                ${this.renderColorRow(e,`line color`,`line-color`,t)}
                ${this.renderRangeRow(e,`width`,`line-width`,r,.5,10,.5,`px`)}
                ${this.renderRangeRow(e,`opacity`,`line-opacity`,i,0,1,.05)}
            </div>`}if(t===`circle`){let t=this.toCssColor(n[`circle-color`],`#000000`),r=Number(n[`circle-radius`]??5),i=this.toCssColor(n[`circle-stroke-color`],t),a=Number(n[`circle-stroke-width`]??0),o=Number(n[`circle-opacity`]??1);return d`<div class="style-editor">
                ${this.renderRangeRow(e,`radius`,`circle-radius`,r,1,30,1,`px`)}
                ${this.renderColorRow(e,`fill color`,`circle-color`,t)}
                ${this.renderRangeRow(e,`opacity`,`circle-opacity`,o,0,1,.05)}
                ${this.renderRangeRow(e,`outline width`,`circle-stroke-width`,a,0,10,.5,`px`)}
                ${this.renderColorRow(e,`outline color`,`circle-stroke-color`,i,`line`)}
            </div>`}if(t===`symbol`){let t=this.toCssColor(n[`text-color`],`#1f2937`),r=Number(n[`text-opacity`]??1),i=Number(n[`text-size`]??12),a=n[`text-halo-color`]!==void 0||Number(n[`text-halo-width`]??0)>0,o=this.toCssColor(n[`text-halo-color`],`#ffffff`);return d`<div class="style-editor">
                ${this.renderRangeRow(e,`size`,`text-size`,i,8,32,1,`px`)}
                ${this.renderColorRow(e,`text color`,`text-color`,t)}
                ${this.renderRangeRow(e,`opacity`,`text-opacity`,r,0,1,.05)}
                ${a?this.renderColorRow(e,`halo color`,`text-halo-color`,o):``}
            </div>`}if(t===`background`){let t=this.toCssColor(n[`background-color`],`#ffffff`),r=Number(n[`background-opacity`]??1);return d`<div class="style-editor">
                ${this.renderColorRow(e,`color`,`background-color`,t)}
                ${this.renderRangeRow(e,`opacity`,`background-opacity`,r,0,1,.05)}
            </div>`}if(t===`raster`){let t=n[`raster-opacity`],r=Array.isArray(t)?this.evalAtZoom(t,this.zoom):t,i=Number(isFinite(Number(r))?r:1);return d`<div class="style-editor">
                ${this.renderRangeRow(e,`opacity`,`raster-opacity`,i,0,1,.05)}
            </div>`}return d``}renderHillshadeTerrainCheckbox(){return d`
            <div class="style-editor-row" style="padding:2px 0">
                <input type="checkbox" id="hillshade-terrain-${this.layerId}" .checked=${this.terrainEnabled}
                    @change=${e=>this.toggleTerrainFromHillshade(e.target.checked)}>
                <label for="hillshade-terrain-${this.layerId}" style="flex:1">Show terrain in 3D</label>
            </div>`}toggleTerrainFromHillshade(e){let t,n=typeof this.meta?.sourceId==`string`?this.meta.sourceId:void 0;if(n&&(t=this.layerDataConfig?.sources?.find(e=>e?.id===n)??(this.adapter?.getSource(n)?{id:n,type:`raster-dem`}:void 0)),!t){let e=Array.isArray(this.meta?.sublayers)?this.meta.sublayers:[];for(let n of e){if(n?.type!==`hillshade`)continue;let e=typeof n.source==`string`?n.source:`source`,r=`${this.layerId}:${e}`;if(this.adapter?.getSource(r)){t={id:r,type:`raster-dem`};break}}}this.adapter?.setTerrainEnabled(e,t),this.terrainEnabled=this.adapter?.isTerrainEnabled()===!0}isEditableType(e,t,n=!1){if(!e)return!1;if(e===`hillshade`)return!0;if(e===`raster`)return n;let r=e===`fill`?`fill-color`:e===`fill-extrusion`?`fill-extrusion-color`:e===`line`?`line-color`:e===`circle`?`circle-color`:e===`symbol`?`text-color`:e===`background`?`background-color`:null;return r?!Array.isArray(t[r]):!1}renderLegendItems(e,t,n,r){let i=this.getAttrTranslations();if(t===`circle`){let e=String(n[`circle-stroke-color`]??`#aaa`),t=Number(n[`circle-stroke-width`]??1),r=n[`circle-color`],a=n[`circle-radius`],o=String(Array.isArray(r)?this.evalAtZoom(r,this.zoom)??r[r.length-1]??`#000000`:r??`#000000`),s=this.extractColorClasses(r,i),c=this.extractProportionalRadius(a,this.zoom);if(c){let{coeff:n,base:r,isSqrt:a}=c,l=e=>r+n*(a?Math.sqrt(e):e),u=e=>{let t=Math.max(0,e-r);return a?(t/n)**2:t/n},d=c.prop?i.get(c.prop):void 0,f=typeof d?.maxvalue==`number`?d.maxvalue:null,p=Math.max(r+1,3),m=f===null?r+38:l(f),h=[0,1/3,2/3,1].map(e=>p*(m/p)**+e),g=h.map(e=>u(e)),_=c.prop?i.get(c.prop)?.unit:void 0,v=h.map(e=>Math.max(1,e)),y=v[v.length-1],b=y<4?4/y:1,x=g.map((e,t)=>({value:this.formatNumber(e,_),color:o,radius:Math.max(1,Math.round(v[t]*b))})),S=new Set,C=x.filter(e=>!S.has(e.radius)&&S.add(e.radius));if(s){let n=C.map(e=>({...e,color:ze}));return[this.renderBubbleLegend(n,e,t),...s.filter(e=>e.label!==``).map(n=>this.renderCircleRow(n.color,e,t,6,n.label))]}return[this.renderBubbleLegend(C,e,t)]}if(s){let n=this.evalAtZoom(a,this.zoom),r=Math.min(Number(isFinite(Number(n))?n:6),20);return s.filter(e=>e.label!==``).map(n=>this.renderCircleRow(n.color,e,t,r,n.label))}let l=this.extractLegendStops(r),u=this.isZoomExpression(a),d=u?[]:this.extractLegendStops(a),f=[],p=Math.max(l.length,d.length||1),m=``;for(let e=0;e<p;e++){let t=String(l[e]?.paint??l[0]?.paint??`#444444`),n=d.length>0?d[e]?.paint??d[0]?.paint??6:this.evalAtZoom(a,this.zoom)??6,r=Array.isArray(n)?this.evalAtZoom(n,this.zoom):n,i=Math.min(Number(isFinite(Number(r))?r:6),50),o=`${t}|${i}`;if(o===m)continue;m=o;let s=(!u&&(l[e]?.value??d[e]?.value))??null;f.push({value:s===null?``:String(s),color:t,radius:i})}return f.length>1&&d.length>1?[this.renderBubbleLegend(f,e,t)]:f.map(n=>this.renderCircleRow(n.color,e,t,n.radius,n.value))}if(t===`fill`||t===`fill-extrusion`){let r=t===`fill`?`fill-color`:`fill-extrusion-color`,a=Number(n[t===`fill`?`fill-opacity`:`fill-extrusion-opacity`]??(t===`fill`?.7:.8)),o=String(t===`fill`?n[`fill-outline-color`]??n[`fill-color`]??`#aaa`:n[`fill-extrusion-color`]??`#aaa`),s=n[r],c=this.extractColorClasses(s,i);if(c){let t=Array.isArray(s)?this.colorExprStopIndices(s):null;return c.filter(e=>e.label!==``).map((n,i)=>{let c=t?.[i]??null,l=c!==null&&Array.isArray(s)?t=>{t.stopPropagation(),this.openStopColorPicker(t.currentTarget,e,r,s,[c],n.color)}:void 0;return this.renderFillRow(n.color,o,a,n.label,l)})}return this.extractLegendStops(s).filter((e,t,n)=>n.length===1||e.value!==null).map(e=>this.renderFillRow(String(e.paint??`#444444`),o,a,e.value===null?``:String(e.value)))}if(t===`line`){let t=n[`line-color`],r=this.extractLegendStops(t),i=this.extractLegendStops(n[`line-width`]),a=Array.isArray(n[`line-dasharray`])?n[`line-dasharray`].join(` `):``,o=Array.isArray(t)?this.colorExprStopIndices(t):null;return r.map((n,s)=>{let c=Number(i[s]?.paint??i[0]?.paint??2),l=n.value===null?``:String(n.value),u=String(n.paint??`#444444`);return o&&o.length===r.length?this.renderEditableLineRow(e,u,c,a,l,t,[o[s]]):this.renderLineRow(u,c,a,l)})}if(t===`symbol`){let e=String(n[`text-color`]??`#1f2937`),t=this.textFieldName(r?.[`text-field`]);return[d`
                <div class="legend-row">
                    ${l`<svg width="24" height="14" style="flex-shrink:0">
                        <text x="12" y="11" text-anchor="middle" font-size="11"
                            fill="${e}" font-family="sans-serif">A</text>
                    </svg>`}
                    ${t?d`<span class="legend-label" title=${t}>${V(t)}</span>`:``}
                </div>`]}if(t===`background`){let e=this.resolveSwatchColor(n[`background-color`],`#ffffff`),t=Number(n[`background-opacity`]??1);return[this.renderFillRow(e,e,t,``)]}return t===`raster`||t===`hillshade`?[d`
                <div class="legend-row">
                    ${l`<svg width="24" height="14" style="flex-shrink:0">
                        <defs>
                            <pattern id="grid" width="4" height="4" patternUnits="userSpaceOnUse">
                                <rect width="2" height="2" fill="#ccc"/>
                                <rect x="2" y="2" width="2" height="2" fill="#eee"/>
                            </pattern>
                        </defs>
                        <rect x="1" y="1" width="22" height="12" fill="url(#grid)" rx="2"/>
                    </svg>`}
                </div>`]:[]}wmsLegendUrl(e){if(e?.layerType!==`raster`)return null;let t=typeof e?.sourceId==`string`?e.sourceId:null;if(!t||!this.adapter)return null;let n=k(this.adapter.getSourceConfig?.(t)??null);if(!n)return null;let r=e?.sourceParams&&typeof e.sourceParams==`object`?e.sourceParams:{};return re(n.endpoint,n.layers.split(`,`)[0].trim(),{sld:r.SLD_BODY??null,style:r.STYLES??n.style,version:n.version})}render(){if(!this.layerId)return d``;let e=this.meta,t=typeof e?.layerType==`string`?e.layerType:null,n=e?.paint&&typeof e.paint==`object`?e.paint:{},r=e?.layout&&typeof e.layout==`object`?e.layout:void 0,i=(typeof e?.legendurl==`string`&&e.legendurl.length>0?e.legendurl:null)??this.wmsLegendUrl(e),a=typeof e?.label==`string`?e.label:this.layerId,o=Array.isArray(e?.sublayers)?e.sublayers:null,s=typeof e?.minzoom==`number`?e.minzoom:0,c=typeof e?.maxzoom==`number`?e.maxzoom:24;if(this.zoom<s||this.zoom>c)return this.renderZoomHint(s,c,this.zoom);if(o&&o.length>0){let e=this.renderCompositeLegend(o,this.zoom);return o.length===1&&typeof o[0]?.type==`string`&&o[0].type===`hillshade`?this.renderCollapsibleLegend(d`
                <div class="legend-wrap">
                    ${e}
                    ${this.renderHillshadeTerrainCheckbox()}
                </div>`):this.renderCollapsibleLegend(e)}let l=s,u=c;if(this.zoom<l||this.zoom>u)return this.renderZoomHint(l,u,this.zoom);let f=t&&[`fill`,`fill-extrusion`,`line`,`circle`,`symbol`,`raster`,`background`,`hillshade`].includes(t)&&!i,p=[this.layerId],m=this.editOverrides[this.layerId],h=m?{...n,...m}:n,g=!o&&f&&this.isEditableType(t,h),_=this.editorOpenKey===this.layerId;return this.renderCollapsibleLegend(d`
            <div class="legend-wrap">
                ${f?d`
                    ${g?d`<button type="button" class="editable legend-row" aria-expanded=${_} aria-label=${`Edit style of ${a}`}
                            @click=${()=>{this.editorOpenKey=_?null:this.layerId}}>
                            ${this.renderLegendItems(p,t,h,r)}
                        </button>`:d`<div>${this.renderLegendItems(p,t,h,r)}</div>`}
                    ${t===`hillshade`?this.renderHillshadeTerrainCheckbox():``}
                    ${g&&_?this.renderStyleEditor(p,t,h):``}
                `:``}
                ${i?this.failedLegendUrl===i?d`<span class="img-error">⚠ invalid legend image</span>`:d`
                    <img class="legend-img" src=${i} alt=${a}
                        @error=${()=>{this.failedLegendUrl=i}}>
                `:``}
            </div>
        `)}};M([o({type:String,attribute:`layer-id`})],W.prototype,`layerId`,void 0),M([o({type:Boolean,reflect:!0})],W.prototype,`collapsible`,void 0),M([c()],W.prototype,`meta`,void 0),M([c()],W.prototype,`failedLegendUrl`,void 0),M([c()],W.prototype,`zoom`,void 0),M([c()],W.prototype,`legendCollapsed`,void 0),M([c()],W.prototype,`legendOverflowing`,void 0),M([c()],W.prototype,`editOverrides`,void 0),M([c()],W.prototype,`editorOpenKey`,void 0),M([c()],W.prototype,`terrainEnabled`,void 0),W=B=M([a(`webmapx-layer-legend`)],W);var Ve=/^https:\/\/\S+$/i,G=class extends i{constructor(...e){super(...e),this.dialogTitle=``,this.attribution=``,this.featureSummary=``,this.content={kind:`none`},this.fetchToken=0}static{this.styles=[N,P,u`
        :host { display: block; }

        sl-dialog::part(panel) {
            min-width: min(420px, 90vw);
            max-width: min(640px, 90vw);
        }

        .abstract {
            font-size: var(--webmapx-font-size-md, 0.9rem);
            line-height: 1.4;
            max-height: 60vh;
            overflow-y: auto;
        }

        .abstract img { max-width: 100%; }

        .placeholder {
            color: var(--color-text-muted, #6b7681);
            font-style: italic;
        }

        .layer-meta {
            margin-top: 0.75rem;
            padding-top: 0.5rem;
            border-top: 1px solid var(--color-border-light, #e2e7ec);
        }

        .feature-summary {
            font-size: var(--webmapx-font-size-md, 0.85rem);
            color: var(--color-text-secondary, #5a6773);
        }

        .feature-summary + .attribution {
            margin-top: 0.5rem;
        }

        .attribution {
            font-size: var(--webmapx-font-size-sm, 0.8rem);
            color: var(--color-text-muted, #6b7681);
        }

        .loading {
            display: flex;
            align-items: center;
            gap: var(--webmapx-space-sm, 0.5rem);
            color: var(--color-text-muted, #6b7681);
        }

        .footer {
            display: flex;
            justify-content: flex-end;
            margin-top: 1rem;
        }
    `]}open(e,t,n,r){I(this),this.fetchToken+=1,this.dialogTitle=e,this.attribution=n?.trim()??``,this.featureSummary=r?.trim()??``,this.dialog?.show();let i=t?.trim();if(!i){this.content={kind:`none`};return}if(Ve.test(i)){this.loadFromUrl(i);return}this.content={kind:`html`,html:ce(i)}}close(){this.dialog?.hide()}async loadFromUrl(e){this.content={kind:`loading`};let t=++this.fetchToken;try{let n=await fetch(e);if(!n.ok)throw Error(`HTTP ${n.status}`);let r=await n.text();if(t!==this.fetchToken)return;this.content={kind:`html`,html:ce(r)}}catch{if(t!==this.fetchToken)return;this.content={kind:`error`,message:`Could not load layer information.`}}}renderContent(){switch(this.content.kind){case`none`:return this.featureSummary?null:d`<p class="placeholder">No detailed layer information available.</p>`;case`loading`:return d`<div class="loading"><sl-spinner></sl-spinner> Loading layer information…</div>`;case`error`:return d`<p class="placeholder">${this.content.message}</p>`;case`html`:return d`<div class="abstract">${s(this.content.html)}</div>`}}render(){return F(d`
                <sl-dialog label=${this.dialogTitle}
                           @sl-request-close=${e=>{e.detail?.source===`overlay`&&this.close()}}>
                    ${this.renderContent()}
                    ${this.featureSummary||this.attribution?d`<div class="layer-meta">
                            ${this.featureSummary?d`<div class="feature-summary">${this.featureSummary}</div>`:null}
                            ${this.attribution?d`<div class="attribution"><strong>Attribution:</strong> ${fe(this.attribution)}</div>`:null}
                        </div>`:null}
                    <div class="footer">
                        <sl-button autofocus @click=${this.close}>Close</sl-button>
                    </div>
                </sl-dialog>
        `)}};M([c()],G.prototype,`dialogTitle`,void 0),M([c()],G.prototype,`attribution`,void 0),M([c()],G.prototype,`featureSummary`,void 0),M([c()],G.prototype,`content`,void 0),M([r(`sl-dialog`)],G.prototype,`dialog`,void 0),G=M([a(`webmapx-layer-info-dialog`)],G);var He=u`
    :host { display: none; }
    :host([visible]) { display: block; }

    /* The host is a bare frame around .panel, so the box the UA gives a popover
       — centred, bordered, padded, scrollable — has to come off, or it draws a
       small white square over the map for as long as the panel is open. */
    :host([popover]) {
        position: static;
        inset: auto;
        width: auto;
        height: auto;
        margin: 0;
        border: none;
        padding: 0;
        background: transparent;
        overflow: visible;
    }

    .panel {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        display: flex;
        flex-direction: column;
        width: min(26rem, 96vw);
        max-height: min(80vh, 44rem);
        background: var(--color-surface, #fff);
        color: var(--color-text-primary, #16202a);
        border: 1px solid var(--color-border, #cbd5df);
        border-radius: var(--webmapx-radius-md, 0.5rem);
        box-shadow: var(--webmapx-shadow-lg, 0 10px 30px rgba(0, 0, 0, 0.25));
    }

    .panel-head {
        display: flex;
        align-items: center;
        gap: 0.4rem;
        padding: 0.5rem 0.6rem;
        border-bottom: 1px solid var(--color-border-light, #e2e7ec);
        background: var(--color-surface-raised, #f4f6f8);
        border-radius: var(--webmapx-radius-md, 0.5rem) var(--webmapx-radius-md, 0.5rem) 0 0;
        /* The whole header is the handle, so there is no small target to hit. */
        cursor: move;
        touch-action: none;
        user-select: none;
    }
    /* Decorative, and hidden from assistive technology: dragging is not
       something this icon makes available to a keyboard. */
    .drag-grip {
        flex: 0 0 auto;
        font-size: 1rem;
        color: var(--color-text-secondary, #5a6773);
        opacity: 0.55;
    }
    .panel-title { flex: 1 1 auto; font-weight: 600; }
    .panel-close {
        background: none;
        border: none;
        padding: 0.15rem 0.35rem;
        font: inherit;
        color: var(--color-text-secondary, #5a6773);
        cursor: pointer;
    }
    .panel-close:hover { color: var(--color-text-primary, #16202a); }

    .panel-body { overflow: auto; padding: 0.75rem; }

    .footer {
        display: flex;
        justify-content: flex-end;
        gap: 0.5rem;
        padding: 0.5rem 0.6rem;
        border-top: 1px solid var(--color-border-light, #e2e7ec);
    }
`,Ue=class extends i{constructor(...e){super(...e),this.position=null,this.drag=null,this.onPanelKeydown=e=>{e.key===`Escape`&&this.isVisible&&this.closePanel()},this.onDrag=e=>{!this.drag||e.pointerId!==this.drag.pointerId||(this.position={x:e.clientX-this.drag.dx,y:e.clientY-this.drag.dy})},this.endDrag=e=>{if(!this.drag||e.pointerId!==this.drag.pointerId)return;let t=e.currentTarget;t.releasePointerCapture?.(e.pointerId),t.removeEventListener(`pointermove`,this.onDrag),t.removeEventListener(`pointerup`,this.endDrag),t.removeEventListener(`pointercancel`,this.endDrag),this.drag=null,this.clampPosition()}}panelPosition(){return this.position?`left:${this.position.x}px; top:${this.position.y}px; transform:none`:``}showPanel(){Se(this),document.addEventListener(`keydown`,this.onPanelKeydown),this.updateComplete.then(()=>this.ensureOnScreen())}hidePanel(){Ce(this),document.removeEventListener(`keydown`,this.onPanelKeydown)}startDrag(e){let t=e.currentTarget,n=t.parentElement;if(!n||e.button!==0||e.target.closest(`.panel-close`))return;let r=n.getBoundingClientRect();this.drag={pointerId:e.pointerId,dx:e.clientX-r.left,dy:e.clientY-r.top},t.setPointerCapture(e.pointerId),t.addEventListener(`pointermove`,this.onDrag),t.addEventListener(`pointerup`,this.endDrag),t.addEventListener(`pointercancel`,this.endDrag),e.preventDefault()}ensureOnScreen(){if(!this.position)return;let e=this.panelBox();if(!e)return;let t=Math.min(Math.max(this.position.x,0),Math.max(window.innerWidth-e.width,0)),n=Math.min(Math.max(this.position.y,0),Math.max(window.innerHeight-e.height,0));(t!==this.position.x||n!==this.position.y)&&(this.position={x:t,y:n})}clampPosition(){let e=this.panelBox();!e||!this.position||(this.position={x:Math.min(Math.max(this.position.x,160-e.width),window.innerWidth-160),y:Math.min(Math.max(this.position.y,0),window.innerHeight-48)})}panelBox(){let e=this.renderRoot?.querySelector(`.panel`);return e?e.getBoundingClientRect():null}};M([c()],Ue.prototype,`position`,void 0);var We={opacity:{min:0,max:1,step:.05,unit:``},width:{min:.5,max:12,step:.5,unit:` px`},radius:{min:1,max:30,step:1,unit:` px`},strokeWidth:{min:0,max:6,step:.5,unit:` px`},textSize:{min:8,max:40,step:1,unit:` px`},haloWidth:{min:0,max:4,step:.2,unit:` px`}},Ge={opacity:1,width:1,radius:5,strokeWidth:0,textSize:16,haloWidth:0},K=[`color`,`strokeColor`,`haloColor`,`fillOutline`],q={color:`Colour`,opacity:`Opacity`,width:`Width`,radius:`Size`,dash:`Pattern`,fillOutline:`Edge`,lineJoin:`Corners`,lineCap:`Ends`,strokeColor:`Outline colour`,strokeWidth:`Outline width`,text:`Text`,textSize:`Text size`,haloColor:`Halo colour`,haloWidth:`Halo width`,font:`Font`,placement:`Placement`,anchor:`Position`,offset:`Distance`,allowOverlap:`Overlap`},Ke=[{label:`Solid`,value:null},{label:`Dashed`,value:[2,2]},{label:`Dotted`,value:[.5,2]},{label:`Dash-dot`,value:[4,2,.5,2]}];function qe(e){if(!e||e.driver!==`single`)return e?`Custom`:`Solid`;let t=Array.isArray(e.value)?[...e.value]:null;if(!t)return`Solid`;let n=Ke.find(e=>e.value&&e.value.join()===t.join());return n?n.label:`Custom`}function Je(e){if(!e)return null;if(e.driver===`single`&&typeof e.value==`string`){let t=/^\{([^{}]+)\}$/.exec(e.value);return t?t[1]:null}if(e.driver!==`custom`)return null;let t=e.expression;return Array.isArray(t)&&t[0]===`get`&&typeof t[1]==`string`?t[1]:null}function Ye(e){return{driver:`custom`,expression:[`get`,e]}}var Xe={fill:`Fill`,outline:`Outline`,line:`Line`,circle:`Points`,label:`Labels`,background:`Background`};function Ze(e){let t=t=>e.some(e=>t.test(e)),n=[];return t(/polygon/i)&&n.push(`outline`,`fill`,`label`),t(/linestring/i)&&n.push(`line`,`label`),t(/point/i)&&n.push(`circle`,`label`),n.length===0?[`fill`,`outline`,`line`,`circle`,`label`]:n.filter((e,t)=>n.indexOf(e)===t)}function Qe(e){return e?.driver===`single`&&typeof e.value==`string`?e.value:null}function $e(e){let t=Qe(e);if(t)return[t];if(e?.driver===`neighbours`)return[...e.colors].slice(0,6);if(e?.driver===`attribute`&&e.classification.kind!==`proportional`){let t=e.classification.colors;if(t.length<=6)return[...t];let n=(t.length-1)/5;return Array.from({length:6},(e,r)=>t[Math.round(r*n)])}return[]}function et(e,t){let n=[];for(let r of T(e.role)){let i=nt(e.role,r,e.channels[r],t);i&&n.push(i)}let r=[];e.filter!==void 0&&r.push(`filtered`),(e.minzoom!==void 0||e.maxzoom!==void 0)&&r.push(tt(e.minzoom,e.maxzoom));let i=[...n.slice(0,2),...r].join(`, `);return i?`${Xe[e.role]} — ${i}`:Xe[e.role]}function tt(e,t){return e!==void 0&&t!==void 0?`z${e}–${t}`:e===void 0?`to z${t}`:`z${e}+`}function nt(e,t,n,r){if(!n)return null;if(n.driver===`custom`)return t===`color`?`a custom expression`:null;if(n.driver===`neighbours`)return`no two neighbours alike`;if(n.driver===`attribute`){let e=n.classification,t=r?.get(n.attribute)?.label??n.attribute;return e.kind===`proportional`?`sized by ${t}${e.zoomFactor?`, grows with zoom`:``}`:`by ${t}, ${e.kind===`ranges`?e.colors.length:e.values.length} ${e.kind===`ranges`?`classes`:`categories`}${n.schemeName?`, ${n.schemeName}`:``}`}if(n.driver===`zoom`){let e=n.stops.map(([,e])=>e*(n.scale??1)),t=Math.min(...e),r=Math.max(...e);return t===r?`${t}px`:`${t}–${r}px by zoom`}return t===`color`?typeof n.value==`string`?n.value:null:t===`width`||t===`radius`||t===`textSize`?typeof n.value==`number`?`${n.value}px`:null:t===`text`&&typeof n.value==`string`?n.value:null}function rt(e,t){let n={};switch(e){case`fill`:n.color={driver:`single`,value:L};break;case`outline`:n.color={driver:`single`,value:R},n.width={driver:`single`,value:1},n.lineJoin={driver:`single`,value:`round`},n.lineCap={driver:`single`,value:`round`};break;case`line`:n.color={driver:`single`,value:L},n.width={driver:`single`,value:2},n.lineJoin={driver:`single`,value:`round`},n.lineCap={driver:`single`,value:`round`};break;case`circle`:n.color={driver:`single`,value:L},n.radius={driver:`single`,value:5},n.strokeColor={driver:`single`,value:R},n.strokeWidth={driver:`single`,value:1};break;case`label`:n.textSize={driver:`single`,value:12},n.color={driver:`single`,value:R},n.haloColor={driver:`single`,value:`#ffffff`},n.haloWidth={driver:`single`,value:1.4};break;case`background`:n.color={driver:`single`,value:L};break}return{id:t,role:e,channels:n}}function it(e,t){for(let n=t.length+1;;n++){let r=`${e}--style-${n}`;if(!t.includes(r))return r}}function at(e,t){return{id:t,role:e.role,channels:JSON.parse(JSON.stringify(e.channels)),...e.filter===void 0?{}:{filter:JSON.parse(JSON.stringify(e.filter))},...e.minzoom===void 0?{}:{minzoom:e.minzoom},...e.maxzoom===void 0?{}:{maxzoom:e.maxzoom}}}function ot(e,t,n=[]){let r=typeof t.source==`string`?t.source:``;if(!r)return``;let i=`${e}:${r}`;return n.includes(i)?i:n.includes(r)?r:i}var st=new Set([`fill`,`line`,`circle`,`symbol`,`background`]);function ct(e,t,n){return t.map((t,r)=>{let i=ot(e,t,n.map(e=>e.sourceId))||n[0]?.sourceId||``,a=n.find(e=>e.sourceId===i)?.geometryTypes?.join(` `),o=st.has(String(t.type??``)),s=v(t,a);return s.id||=`${e}--${r}`,{entry:s,sourceId:i,styleable:o}})}function lt(e){let t=[];for(let n of e){let e=n.geometryTypes?.join(` `);for(let r of n.layers){let i={id:r.id,type:r.type,...r.paint?{paint:r.paint}:{},...r.layout?{layout:r.layout}:{}};t.push({entry:v(i,e),sourceId:n.sourceId,styleable:!0})}}return t}function ut(e){return e.map(e=>h(e.entry))}function dt(e,t,n){let r=e.findIndex(e=>e.entry.id===t),i=e.findIndex(e=>e.entry.id===n);if(r<0||i<0||r===i)return[...e];let a=[...e],[o]=a.splice(r,1);return a.splice(i,0,o),a}function ft(e,t,n=1.1){return pt(e)>pt(t)*n}function pt(e){let t=e.east>=e.west?e.east-e.west:e.east+360-e.west;return Math.abs(t)*Math.abs(e.north-e.south)}function mt(e){return e.some(e=>(e.features?.length??0)>0)}function ht(e,t,n){if(!e||!k(e.sourceConfig))return{kind:`tiles`};if(!(t&&(t.getTiles?.(e.sourceId)??null)!==null))return{kind:`fixed`};let r=n??[];return r.length<2?r.length===1?{kind:`single`,only:r[0]}:{kind:`single`}:{kind:`choice`}}function gt(e,t,n){let r=t?.getTiles?.(e.sourceId)??null,i=e.sourceConfig?.tiles??e.sourceConfig?.url;return(r??(Array.isArray(i)?i:typeof i==`string`?[i]:[])).map(e=>ie(A(e,null),n))}var _t=2e3,vt=156543.03392804097,yt=256,bt=2048,J=20037508.342789244;function xt(e,t){let n=Math.max(-85.05112878,Math.min(85.05112878,t));return[e*J/180,Math.log(Math.tan((90+n)*Math.PI/360))*J/Math.PI]}function St(e,t){let n=[];if(e){let[t,r]=xt(e.center[0],e.center[1]),i=vt/2**e.zoom;if(e.size){let[a,o]=e.size,s=i*a/2,c=i*o/2;n.push({bbox:[t-s,r-c,t+s,r+c],size:Ct(a,o)})}let a=yt/2*i;n.push({bbox:[t-a,r-a,t+a,r+a],size:[yt*2,yt*2]})}if(Array.isArray(t)&&t.length===4){let[e,r]=xt(t[0],t[1]),[i,a]=xt(t[2],t[3]);n.push({bbox:[e,r,i,a]})}return n.length===0&&n.push({bbox:[-20037508.342789244,-20037508.342789244,J,J]}),n}function Ct(e,t){let n=Math.max(e,t);if(n<=bt)return[Math.round(e),Math.round(t)];let r=bt/n;return[Math.max(1,Math.round(e*r)),Math.max(1,Math.round(t*r))]}function wt(){return{driver:`single`,color:`#3182bd`,strokeColor:``,attribute:null,method:`quantile`,classCount:5,scheme:``,values:null}}function Tt(e){let t={...e.strokeColor?{strokeColor:e.strokeColor}:{}};if(e.driver===`single`||!e.attribute)return{style:{kind:`single`,color:e.color,...t},classes:[{label:`all features`,color:e.color}]};let n=e.values??[];if(n.length===0)return{style:null,classes:[],problem:`No values came back for that column, so there is nothing to classify.`};let r=n.filter(e=>typeof e==`number`&&Number.isFinite(e));if(r.length>=n.length*.8&&r.length>1){let n=S(r,{method:e.method,classCount:e.classCount});if(n.classes.length===0)return{style:null,classes:[],problem:`Those values are all the same, so there is nothing to classify.`};let i=Et(e.scheme,n.classes.length,`seq`),a=ge(e.attribute,n.classes,i,t);return{style:a,classes:a.breaks.map((e,t)=>({label:e.label??String(t),color:e.color}))}}let i=b(n.filter(e=>e!=null&&e!==``).map(e=>({type:`Feature`,properties:{value:e},geometry:null})),`value`,{maxCategories:e.classCount});if(i.categories.length===0)return{style:null,classes:[],problem:`That column is empty in every feature we sampled.`};let a=Et(e.scheme,i.categories.length,`qual`),o=pe(e.attribute,i.categories.map(e=>e.value),a,{...t,otherColor:`#cccccc`});return{style:o,classes:[...o.categories.map(e=>({label:String(e.value),color:e.color})),...i.otherValues>0?[{label:`other`,color:`#cccccc`}]:[]]}}function Et(e,t,n){let r=w(t,n);return(r.find(t=>t.name===e)??r[0])?.colors??Array.from({length:t},()=>`#3182bd`)}function Dt(e,t,n){let r=Tt(n);return r.style?{sld:te(e,t,r.style),classes:r.classes}:{sld:null,classes:[],problem:r.problem}}var Ot=new Set([`maplibre`,`openlayers`]);function kt(e){return e===void 0||Ot.has(e)}function At(e){let t=new Map;for(let n of e)for(let e of n??[]){let n=e?.layout?.[`text-font`];jt(n)&&(t.has(n[0])||t.set(n[0],[...n]))}return[...t.values()].sort((e,t)=>e[0].localeCompare(t[0]))}function jt(e){return Array.isArray(e)&&e.length>0&&e.every(e=>typeof e==`string`&&e.length>0)&&e.some(e=>e.includes(` `))}function Mt(e){return e?.driver===`single`&&jt(e.value)?[...e.value]:null}function Nt(e){return e.some(e=>/polygon/i.test(e))?[{value:`point`,label:`Inside the area`},{value:`line`,label:`Along the edge`}]:e.some(e=>/line/i.test(e))?[{value:`point`,label:`Flat, at one spot`},{value:`line`,label:`Along the line, repeated`},{value:`line-center`,label:`Along the line, once`}]:[]}function Pt(e){return e?e.driver===`single`&&(e.value===`point`||e.value===`line`||e.value===`line-center`)?e.value:null:`point`}var Ft={center:`On the spot`,above:`Above`,below:`Below`,right:`Right`,left:`Left`},It={center:`center`,above:`bottom`,below:`top`,right:`left`,left:`right`},Lt={center:[0,0],above:[0,-1],below:[0,1],right:[1,0],left:[-1,0]};function Rt(e,t){let n=e===void 0?`center`:e.driver===`single`?e.value:null,r=Object.keys(It).find(e=>It[e]===n);if(!r)return null;let i=[0,0];if(t!==void 0){if(t.driver!==`single`||!Array.isArray(t.value)||t.value.length!==2)return null;let[e,n]=t.value;if(typeof e!=`number`||typeof n!=`number`)return null;i=[e,n]}if(r===`center`)return i[0]===0&&i[1]===0?{direction:r,distance:0}:null;let[a,o]=Lt[r],s=i[0]*a+i[1]*o,c=i[0]*o-i[1]*a;return s<0||c!==0?null:{direction:r,distance:s}}function zt(e){if(e.direction===`center`)return{};let[t,n]=Lt[e.direction],r=Math.max(0,e.distance);return{anchor:{driver:`single`,value:It[e.direction]},...r===0?{}:{offset:{driver:`single`,value:[t*r+0,n*r+0]}}}}function Bt(e){let{font:t,placement:n,anchor:r,offset:i,allowOverlap:a}=e.channels;if(t!==void 0||n!==void 0&&Pt(n)!==`point`)return!0;let o=Rt(r,i);return!o||o.direction!==`center`?!0:a!==void 0&&!(a.driver===`single`&&a.value===!1)}var Vt=80,Ht=4,Ut=900,Wt=28,Gt=32,Y=6,Kt=`This layer is drawn from a style document on the server, so its styles cannot be added to, removed or reordered`,qt={single:`Single value`,attribute:`By attribute`,neighbours:`By neighbours`,zoom:`Grows with zoom`,custom:`Custom (expression)`},X=class extends Ue{constructor(...e){super(...e),this.visible=!1,this.panelTitle=`Layer style`,this.list=[],this.groups=[],this.sourceId=null,this.expandedId=null,this.layerOpacity=1,this.filterText=``,this.message=null,this.wmsStyles=null,this.wmsStyle=``,this.wmsLoading=!1,this.sldProbe=null,this.sldProbing=!1,this.sldAttributes=null,this.sldLoadingValues=!1,this.sldDraft=wt(),this.sldApplied=!1,this.sldClasses=[],this.sldProblem=null,this.sldVerifying=!1,this.sldAttempt=0,this.layerId=``,this.context=null,this.listIsWritable=!1,this.work=Promise.resolve(),this.openedWith=[],this.touched=!1,this.pickers=new Map,this.classifySettings=new Map,this.neighbourColors=new Map,this.neighbourPalettes=new Map,this.lastColoring=null,this.moreOpen=new Set,this.textDrafts=new Map,this.sampleAttempt=0,this.sampledExtent=null,this.unwatchView=null,this.pending=new Map,this.releasePending=be(()=>{let e=[...this.pending.values()];this.pending.clear();for(let t of e)t()},Vt),this.metadataWritten=new Set}static{this.styles=[N,He,u`
        .sections { display: flex; flex-direction: column; gap: 0.6rem; }

        .row {
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }
        .row > label, .row > .name {
            flex: 0 0 7.5rem;
            font-size: 0.85rem;
            color: var(--color-text-secondary, #5a6773);
        }
        .row input[type="range"] { flex: 1 1 auto; min-width: 0; }
        /* A text field takes the rest of the row: a name and a legend wording
           are both longer than the box a shrink-wrapped input would give them. */
        .row input.grow {
            flex: 1 1 auto;
            min-width: 0;
            font: inherit;
            padding: 0.2rem 0.35rem;
            border: 1px solid var(--color-border, #cbd5df);
            border-radius: var(--webmapx-radius-sm, 0.35rem);
            background: var(--color-surface, #fff);
            color: var(--color-text-primary, #16202a);
        }
        .row .value { flex: 0 0 3.5rem; text-align: right; font-variant-numeric: tabular-nums; }

        /* The same "show more..." link the legend uses when it is taller than
           its box, so one pattern means "there is more here" everywhere. */
        .more-toggle {
            position: relative;
            align-self: flex-start;
            padding: 0;
            border: 0;
            background: none;
            color: var(--color-primary, #2b6cb0);
            font: inherit;
            font-size: 0.8rem;
            cursor: pointer;
        }
        .more-toggle:hover { text-decoration: underline; }
        /* Marks a tier holding something other than the defaults, which the
           collapsed row would otherwise hide. */
        .more-toggle.overridden::after {
            content: '';
            position: absolute;
            top: 0.05rem;
            right: -0.55rem;
            width: 0.4rem;
            height: 0.4rem;
            border-radius: 50%;
            background: var(--color-primary, #2b6cb0);
        }

        .source-line {
            font-size: 0.85rem;
            color: var(--color-text-secondary, #5a6773);
        }

        .list-head {
            display: flex;
            align-items: center;
            justify-content: space-between;
            font-weight: 600;
            font-size: 0.9rem;
        }

        .entry {
            border: 1px solid var(--color-border, #cbd5df);
            border-radius: var(--webmapx-radius-sm, 0.35rem);
            overflow: hidden;
        }
        .entry + .entry { margin-top: 0.35rem; }
        .entry-head {
            display: flex;
            align-items: center;
            gap: 0.3rem;
            padding: 0.35rem 0.45rem;
            background: var(--color-surface-raised, #f4f6f8);
        }
        .entry-summary {
            flex: 1 1 auto;
            /* A flex item will not shrink below its content unless told to, and
               a sublayer id is one long unbreakable word — without this it
               pushed the reorder and delete buttons out of the row entirely. */
            min-width: 0;
            display: flex;
            align-items: center;
            gap: 0.4rem;
            background: none;
            border: 0;
            padding: 0.1rem;
            font: inherit;
            text-align: left;
            color: inherit;
            cursor: pointer;
        }
        .swatch {
            flex: 0 0 auto;
            width: 0.9rem;
            height: 0.9rem;
            border-radius: 0.15rem;
            border: 1px solid var(--color-border, #cbd5df);
        }
        .entry-actions button {
            background: none;
            border: 0;
            padding: 0.15rem 0.25rem;
            font: inherit;
            color: var(--color-text-secondary, #5a6773);
            cursor: pointer;
        }
        /* Never squeezed out by a long name: the row's controls come first. */
        /* Never squeezed out by a long name: the row's controls come first. */
        .entry-actions { display: flex; align-items: center; gap: 0.1rem; flex: 0 0 auto; }
        /* Icons rather than glyphs: ⧉ and 🗑 are missing from enough system
           fonts to come out as tofu boxes, which is what they did. */
        .entry-actions sl-icon { font-size: 0.85rem; display: block; }
        .entry-actions button:hover:not([disabled]) { color: var(--color-text-primary, #16202a); }
        .entry-actions button[disabled] { opacity: 0.35; cursor: not-allowed; }
        .entry-body {
            display: flex;
            flex-direction: column;
            gap: 0.4rem;
            padding: 0.5rem;
        }

        .color-button {
            width: 1.6rem;
            height: 1.6rem;
            border-radius: var(--webmapx-radius-sm, 0.35rem);
            border: 1px solid var(--color-border, #cbd5df);
            cursor: pointer;
            padding: 0;
        }

        .custom {
            font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
            font-size: 0.72rem;
            background: var(--color-surface-raised, #f4f6f8);
            border-radius: var(--webmapx-radius-sm, 0.35rem);
            padding: 0.35rem;
            margin: 0;
            overflow-x: auto;
            max-height: 6rem;
        }

        .warning {
            font-size: 0.8rem;
            padding: 0.45rem 0.55rem;
            border-radius: var(--webmapx-radius-sm, 0.35rem);
            background: var(--color-warning-surface, #fff4e0);
            color: var(--color-text-primary, #16202a);
        }
        .muted { font-size: 0.8rem; color: var(--color-text-secondary, #5a6773); }
        .raster { display: flex; flex-direction: column; gap: 0.35rem; }
        .raster p { margin: 0; }
        .choices { display: flex; flex-wrap: wrap; gap: 0.4rem; }
        .choice {
            display: flex;
            flex-direction: column;
            gap: 0.15rem;
            align-items: flex-start;
            text-align: left;
            padding: 0.45rem 0.6rem;
            border: 1px solid var(--color-border, #d6dbe1);
            border-radius: var(--webmapx-radius, 6px);
            background: var(--color-surface, #fff);
            color: inherit;
            font: inherit;
            cursor: pointer;
        }
        .choice[aria-pressed="true"] {
            border-color: var(--color-primary, #2b6cb0);
            outline: 2px solid var(--color-primary, #2b6cb0);
            outline-offset: -1px;
        }
        .style-legend { max-width: 100%; max-height: 6rem; margin-top: 0.25rem; }
        .sld { margin-top: 0.35rem; padding-top: 0.5rem; border-top: 1px solid var(--color-border, #d6dbe1); }
        .sld-legend { display: flex; flex-wrap: wrap; gap: 0.35rem; font-size: 0.75rem; }
        .sld-class { display: inline-flex; align-items: center; gap: 0.25rem; }
        .sld-class .swatch { width: 0.75rem; height: 0.75rem; border-radius: 2px; display: inline-block; }
        /* An inline action inside a sentence, which is a control, not decoration. */
        button.link {
            background: none;
            border: 0;
            padding: 0;
            font: inherit;
            color: var(--color-primary, #2b6cb0);
            text-decoration: underline;
            cursor: pointer;
        }

        .filter-row { margin: 0.35rem 0; }
        .filter-row input[type="search"] { flex: 1 1 auto; min-width: 0; }
        /* Which of a multi-source layer's datasets an entry draws. */
        .entry-text { display: flex; flex-direction: column; gap: 0.05rem; min-width: 0; }
        /* One line, clipped: the name identifies the row, and a forty-character
           id wrapping over three lines buries the summary that explains it. */
        .entry-name {
            font-weight: 600;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }
        .entry-detail {
            font-size: 0.78rem;
            color: var(--color-text-secondary, #5a6773);
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }
        .source-key {
            margin-left: 0.3rem;
            color: var(--color-text-secondary, #5a6773);
            font-size: 0.75rem;
        }
        .check-row { gap: 0.35rem; }
        /* A checkbox and its words stay on one line: wrapping between them puts
           the label under the box and reads as two controls. */
        .check { display: flex; align-items: center; gap: 0.3rem; font-size: 0.85rem; }
        .check input { flex: 0 0 auto; }
        .checks { display: flex; flex-wrap: wrap; gap: 0.15rem 0.6rem; min-width: 0; }
        .check-row { align-items: flex-start; }

        /* Level 4 sits under the channel it drives, indented so the nesting is
           visible without a box around every classification. */
        .level4 {
            display: flex;
            flex-direction: column;
            gap: 0.35rem;
            margin: 0.1rem 0 0.35rem 0.6rem;
            padding-left: 0.5rem;
            border-left: 2px solid var(--color-border-light, #e2e7ec);
        }
        /* Indented by the level-4 rule, so the label column gives room back. */
        .level4 .row > .name { flex-basis: 5.5rem; }
        .schemes { display: flex; flex-wrap: wrap; gap: 0.25rem; }
        .scheme {
            display: flex;
            border: 1px solid var(--color-border, #cbd5df);
            border-radius: var(--webmapx-radius-sm, 0.35rem);
            padding: 0;
            overflow: hidden;
            cursor: pointer;
            background: none;
        }
        .scheme span { width: 0.85rem; height: 0.85rem; display: block; }
        .scheme[aria-pressed="true"] { outline: 2px solid var(--color-primary, #2b6cb0); outline-offset: 1px; }
    `]}get isVisible(){return this.visible}closePanel(){this.close()}open(e){this.context=e,this.layerId=e.layerId,this.panelTitle=e.title,this.groups=e.groups,this.message=null,this.expandedId=null,this.classifySettings=new Map,this.wmsStyles=null,this.wmsLoading=!1,this.wmsStyle=k(e.raster?.sourceConfig)?.style??``,this.sldProbe=null,this.sldProbing=!1,this.sldAttributes=null,this.sldDraft=wt(),this.sldApplied=!1,this.sldClasses=[],this.sldProblem=null,this.sldVerifying=!1,this.sldAttempt++,this.destroyPickers(),this.adopt(e),this.visible=!0,this.showPanel(),this.loadGroups(e),this.watchTheView(e)}watchTheView(e){this.unwatchView?.(),this.unwatchView=e.watchView?.(t=>{if(this.context!==e||!this.visible||!this.viewportLimited())return;let n=this.sampledExtent;this.sampledExtent=t,!(n?!ft(t,n):mt(this.groups))&&this.resampleUntilDrawn(e)})??null}async resampleUntilDrawn(e){let t=++this.sampleAttempt;for(let n=0;n<Ht;n++){let n=await this.loadGroups(e,{keepWhenEmpty:!0});if(this.context!==e||t!==this.sampleAttempt||n||(await new Promise(e=>setTimeout(e,Ut)),this.context!==e||t!==this.sampleAttempt))return}}viewportLimited(){return this.groups.some(e=>e.completeData===!1)}async loadGroups(e,t={}){if(!e.resample)return!1;let n=await e.resample();if(this.context!==e)return!1;let r=mt(n);return t.keepWhenEmpty&&!r&&mt(this.groups)?!1:(this.groups=n,this.touched||this.openedWith.length===0||(this.list=ct(this.layerId,this.openedWith,n)),r)}close(){this.flushPending(),this.unwatchView?.(),this.unwatchView=null,this.sampledExtent=null,this.visible=!1,this.destroyPickers(),this.hidePanel()}disconnectedCallback(){this.unwatchView?.(),this.unwatchView=null,this.destroyPickers(),super.disconnectedCallback()}adopt(e){let t=e.layers?.getSubLayers?.(e.layerId)??null,n=Array.isArray(t)&&t.length>0;this.listIsWritable=n&&!!e.layers?.setSubLayers&&e.layers?.canRebuild?.(e.layerId)!==!1,this.openedWith=n?t.map(e=>({...e})):[],this.touched=!1,this.list=n?ct(e.layerId,t,e.groups):lt(e.groups),this.sourceId=null}sourceIds(){let e=this.groups.map(e=>e.sourceId);for(let t of this.list)t.sourceId&&!e.includes(t.sourceId)&&e.push(t.sourceId);return e}group(e){return this.groups.find(t=>t.sourceId===e)??null}visibleEntries(){let e=this.filterText.trim().toLowerCase();return this.list.filter(e=>!this.sourceId||e.sourceId===this.sourceId).filter(t=>!e||this.entryLabel(t).toLowerCase().includes(e)).slice().reverse()}entryLabel(e){let t=this.displayEntryName(e)??e.entry.id;return e.styleable?`${t} ${et(e.entry,this.context?.attributeLabels)}`:`${t} ${e.entry.origin?.type??``}`}displayEntryName(e,t={}){if(t.authored!==!1&&e.entry.title)return e.entry.title;let n=e.entry.id,r=t.authored===!1?{...e.entry.origin??{},metadata:void 0}:e.entry.origin;return ee(this.context?.layerMeta??null,r,n,this.list.length===1,this.layerId)||null}sourceLabel(e){let t=this.group(e),n=e.split(`:`).pop()||e;return t?`${n} — ${t.featureCountLabel}`:n}applyEntry(e,t){this.schedule(`${e.entry.id}:${t}`,()=>{let n=this.list.find(t=>t.entry.id===e.entry.id)??e;this.work=this.work.then(()=>this.applyEntryNow(n,t))})}schedule(e,t){this.pending.set(e,t),this.releasePending()}flushPending(){if(this.releasePending.flush(),this.pending.size===0)return;let e=[...this.pending.values()];this.pending.clear();for(let t of e)t()}applyEntryNow(e,t){let n=h(e.entry),r=E[e.entry.role]?.[t]?.slot===`layout`,i=e.entry.channels[t]===void 0;if(r||i||t===`fillOutline`||!this.context?.apply){this.rebuildNow();return}let a=n.paint??{},o=this.context.apply(e.entry.id,a);this.message=o===!1?`The map did not accept this change: this part of the layer is described in the legend but is not drawn on the map.`:null}async resetStyle(){if(this.pending.clear(),this.openedWith.length===0){this.message=`This panel has nothing to put back: it never read the layer as a whole.`;return}let e=this.context?.layers;if(e?.setSubLayers&&this.listIsWritable){if(!await e.setSubLayers(this.layerId,this.openedWith.map(e=>({...e})))){this.message=`The map did not accept the original styles.`;return}}else if(this.context?.apply)for(let e of this.openedWith)e.id&&this.context.apply(e.id,e.paint??{});this.list=ct(this.layerId,this.openedWith,this.groups),this.classifySettings=new Map,this.expandedId=null,this.touched=!1,this.message=null}rebuild(){this.flushPending(),this.work=this.work.then(()=>this.rebuildNow())}async rebuildNow(){let e=this.context?.layers;if(!e?.setSubLayers||!this.listIsWritable){this.message=`This layer cannot be rebuilt here, so the style list cannot be changed. Its existing styles can still be edited.`;return}let t=await e.setSubLayers(this.layerId,ut(this.list));this.message=t?null:`The map did not accept the new style list.`,t&&this.refreshOrigins()}refreshOrigins(){let e=this.context?.layers?.getSubLayers?.(this.layerId);if(!Array.isArray(e))return;let t=new Map(e.map(e=>[String(e.id??``),e]));this.list=this.list.map(e=>{let n=t.get(e.entry.id);if(!n)return e;let r=v(n,this.group(e.sourceId)?.geometryTypes?.join(` `));return{...e,entry:{...e.entry,origin:r.origin,originChannels:r.originChannels}}})}setChannel(e,t,n,r={}){let i=this.list.find(t=>t.entry.id===e.entry.id)??e,a={...i.entry.channels};n?a[t]=n:delete a[t];let o=(i.entry.role===`line`||i.entry.role===`outline`)&&t!==`lineJoin`&&t!==`lineCap`&&!a.lineJoin&&!a.lineCap;o&&(a.lineJoin={driver:`single`,value:`round`},a.lineCap={driver:`single`,value:`round`});let s={...i.entry,channels:a};this.list=this.list.map(e=>e===i?{...e,entry:s}:e),this.touched=!0;let c=this.list.find(e=>e.entry.id===s.id);o&&this.applyEntry(c,`lineJoin`),!r.silent&&this.applyEntry(c,t)}setEntryField(e,t,n,r={finished:!0}){let i=this.list.find(t=>t.entry.id===e.entry.id)??e,a=n.trim(),o=(i.entry[t]??``)===a;if(!o){let e={...i.entry};a?e[t]=a:delete e[t],this.list=this.list.map(t=>t===i?{...t,entry:e}:t),this.touched=!0;let n=this.list.find(t=>t.entry.id===e.id);if(this.writeEntryMetadata(n)){this.metadataWritten.add(e.id);return}}r.finished&&!this.metadataWritten.has(i.entry.id)&&!o&&this.rebuild()}writeEntryMetadata(e){let t=this.context?.layers?.setSubLayerMetadata;if(!t||!this.context)return!1;let n=h(e.entry).metadata;return t(this.context.layerId,e.entry.id,n&&typeof n==`object`?n:null)}setTextDraft(e,t){let n=new Map(this.textDrafts);t===null?n.delete(e):n.set(e,t),this.textDrafts=n}addEntry(e){this.touched=!0;let t=it(this.layerId,this.list.map(e=>e.entry.id)),n=this.sourceId??this.sourceIds()[0]??``,r=rt(e,t);r.origin=this.sublayerShell(n),this.list=[...this.list,{entry:r,sourceId:n,styleable:!0}],this.expandedId=t,this.rebuild()}sublayerShell(e){let t=this.list.find(t=>t.sourceId===e)?.entry.origin,n={};return t&&typeof t.source==`string`&&(n.source=t.source),t&&typeof t[`source-layer`]==`string`&&(n[`source-layer`]=t[`source-layer`]),n}duplicate(e){this.touched=!0;let t=it(this.layerId,this.list.map(e=>e.entry.id)),n=at(e.entry,t);n.origin=this.sublayerShell(e.sourceId);let r=this.list.indexOf(e);this.list=[...this.list.slice(0,r+1),{...e,entry:n},...this.list.slice(r+1)],this.expandedId=t,this.rebuild()}removeEntry(e){this.touched=!0,this.list=this.list.filter(t=>t!==e),this.expandedId===e.entry.id&&(this.expandedId=null),this.rebuild()}move(e,t){t&&(this.touched=!0,this.list=dt(this.list,e.entry.id,t.entry.id),this.rebuild())}setLayerOpacity(e){this.layerOpacity=e,this.context?.sourceControl?.setLayerOpacity(e)}render(){return d`
            <div class="panel" role="dialog" aria-modal="false" aria-label=${this.panelTitle}
                 style=${this.panelPosition()}>
                <header class="panel-head" title="Drag to move"
                        @pointerdown=${e=>this.startDrag(e)}>
                    <sl-icon class="drag-grip" name="grip-vertical" aria-hidden="true"></sl-icon>
                    <span class="panel-title">${this.panelTitle}</span>
                    <button class="panel-close" type="button" aria-label="Close" @click=${()=>this.close()}>✕</button>
                </header>
                <div class="panel-body">
                    <div class="sections">
                        ${this.renderLayerOpacity()}
                        ${this.renderSource()}
                        ${this.renderRaster()}
                        ${this.renderList()}
                        ${this.message?d`<div class="warning">${this.message}</div>`:n}
                    </div>
                </div>
                <div class="footer">
                    <sl-button size="small" ?disabled=${!this.touched} @click=${()=>void this.resetStyle()}>Reset</sl-button>
                    <sl-button size="small" variant="primary" @click=${()=>this.close()}>Done</sl-button>
                </div>
            </div>
        `}renderLayerOpacity(){return this.context?.sourceControl?d`
            <div class="row">
                <label for="layer-opacity">Layer opacity</label>
                <input id="layer-opacity" type="range" min="0" max="1" step="0.05"
                       .value=${String(this.layerOpacity)}
                       @input=${e=>this.setLayerOpacity(Number(e.target.value))}>
                <span class="value">${Math.round(this.layerOpacity*100)}%</span>
            </div>
        `:n}renderSource(){let e=this.group(this.sourceId)??this.groups[0]??null,t=e?.completeData===!1;return d`
            ${e?d`<div class="source-line">Data: ${e.featureCountLabel}</div>`:n}
            ${t?d`
                <div class="warning">
                    This layer arrives as tiles, so what the panel knows about it is what the map has drawn.
                    Move to a part of the map that represents the whole before classifying.
                </div>`:n}
        `}renderRaster(){let e=this.context?.raster;if(!e)return n;let t=k(e.sourceConfig);t&&this.wmsStyles===null&&!this.wmsLoading&&this.loadWmsStyles(t);let r=(this.context?.sourceControl?.getTiles?.(e.sourceId)??null)!==null;if(t&&r&&this.sldProbe===null&&!this.sldProbing&&this.loadSldBranch(t),this.wmsLoading)return d`<div class="raster"><strong>Styles</strong>
                <p class="muted">Asking the service which ways it can draw this layer…</p></div>`;let i=ht(e,this.context?.sourceControl,this.wmsStyles);if(i.kind===`tiles`)return d`<div class="raster"><strong>Images, not features</strong>
                <p class="muted">
                    This layer arrives as finished pictures from a tile service, so there is nothing here to colour
                    or classify — the drawing was done before the tiles were sent. Its opacity is above.
                </p></div>`;if(i.kind===`fixed`)return d`<div class="raster"><strong>Drawn by the service</strong>
                <p class="muted">
                    A WMS decides the colours itself, and this map engine cannot ask it for a different style once
                    the layer is on the map. Its opacity is what can be changed here.
                </p></div>${this.renderSldBranch(t)}`;if(i.kind===`single`)return d`<div class="raster"><strong>Drawn by the service</strong>
                <p class="muted">
                    ${i.only?`This service draws this layer one way only ("${i.only.title}").`:`This service advertises no named styles for this layer, so it draws it one way only.`}
                    A WMS decides the colours itself; only its opacity can be changed here.
                </p></div>${this.renderSldBranch(t)}`;let a=this.wmsStyles??[];return d`
            <div class="raster">
                <strong>Which style?</strong>
                <p class="muted">
                    ${this.sldApplied?`Your own style is drawing this layer. Choosing one of these hands it back to the service.`:`The service draws this layer; these are the ways it offers.`}
                </p>
                <div class="choices">
                    ${a.map(e=>d`
                        <button class="choice" type="button"
                                aria-pressed=${!this.sldApplied&&e.name===this.wmsStyle?`true`:`false`}
                                @click=${()=>this.applyWmsStyle(e.name)}>
                            <span>${e.title}</span>
                            ${e.legendUrl?d`<img class="style-legend" src=${e.legendUrl} alt="" loading="lazy">`:n}
                        </button>
                    `)}
                </div>
            </div>
            ${this.renderSldBranch(t)}
        `}renderSldBranch(e){let t=this.context?.raster;if(!(t&&(this.context?.sourceControl?.getTiles?.(t.sourceId)??null)!==null))return n;if(this.sldProbing)return d`<p class="muted">Asking the service whether it can draw a style of your own…</p>`;if(!this.sldProbe?.supported)return this.sldProbe?.reason===`no-ink`?d`
                    <div class="raster">
                        <p class="muted">
                            This layer draws nothing where the map is looking, so it cannot be styled here yet.
                            Move to somewhere it has data, then look again.
                        </p>
                        <div class="row">
                            <sl-button size="small" @click=${()=>void this.retrySldProbe(e)}>Look again</sl-button>
                        </div>
                    </div>`:n;let r=this.sldAttributes?.attributes??[],i=this.sldAttributes?.from===`featureinfo`;return d`
            <div class="raster sld">
                <strong>Or draw it yourself</strong>
                <p class="muted">This service will draw its data the way you ask, so it can be coloured here.</p>
                <div class="row">
                    <label for="sld-driver">Colour by</label>
                    <select id="sld-driver" .value=${this.sldDraft.driver}
                            @change=${e=>this.setDraft({driver:e.target.value})}>
                        <option value="single">One colour</option>
                        <option value="attribute" ?disabled=${r.length===0}>An attribute</option>
                    </select>
                </div>
                ${this.sldDraft.driver===`single`?d`
                    <div class="row">
                        <label>Colour</label>
                        <button id="sld-color" class="color-button" type="button"
                                style=${`background:${this.sldDraft.color}`}
                                aria-label=${`Colour: ${this.sldDraft.color}`}
                                @click=${e=>this.openPicker(`sld:color`,e.currentTarget,this.sldDraft.color,e=>this.setDraft({color:e}))}></button>
                    </div>`:this.renderSldAttribute(r,i)}
                <div class="row">
                    <label>Outline</label>
                    <button id="sld-stroke" class="color-button" type="button"
                            style=${`background:${this.sldDraft.strokeColor||`transparent`}`}
                            aria-label=${`Outline: ${this.sldDraft.strokeColor||`none`}`}
                            @click=${e=>this.openPicker(`sld:stroke`,e.currentTarget,this.sldDraft.strokeColor||`#333333`,e=>this.setDraft({strokeColor:e}))}></button>
                    <button type="button" @click=${()=>this.setDraft({strokeColor:``})}
                            ?disabled=${!this.sldDraft.strokeColor}>None</button>
                </div>
                ${this.sldClasses.length>1?d`
                    <div class="sld-legend">
                        ${this.sldClasses.map(e=>d`
                            <span class="sld-class">
                                <span class="swatch" style="background:${e.color}"></span>${e.label}
                            </span>`)}
                    </div>`:n}
                ${this.sldProblem?d`<div class="warning">${this.sldProblem}</div>`:n}
                <div class="row">
                    <!-- Never disabled while a check is in flight: a check is
                         about a style the user may already have changed, and
                         swallowing the next click is worse than superseding the
                         check, which the attempt counter makes safe. -->
                    <sl-button size="small" variant="primary"
                               ?disabled=${this.sldLoadingValues}
                               @click=${()=>void this.applySld(e)}>Draw it</sl-button>
                    ${this.sldVerifying?d`<span class="muted">Checking…</span>`:n}
                    <sl-button size="small" ?disabled=${!this.sldApplied}
                               @click=${()=>this.clearSld()}>Back to the service's style</sl-button>
                </div>
            </div>
        `}renderSldAttribute(e,t){return d`
            <div class="row">
                <label for="sld-attribute">Attribute</label>
                <select id="sld-attribute" .value=${this.sldDraft.attribute??``}
                        @change=${e=>void this.chooseSldAttribute(e.target.value)}>
                    <option value="">Choose…</option>
                    ${e.map(e=>d`
                        <option value=${e.name} ?selected=${e.name===this.sldDraft.attribute}>
                            ${e.name}${e.numeric?` (number)`:``}
                        </option>`)}
                </select>
            </div>
            <div class="row">
                <label for="sld-classes">Classes</label>
                <input id="sld-classes" type="number" min="2" max="9" .value=${String(this.sldDraft.classCount)}
                       @input=${e=>void this.setDraft({classCount:Number(e.target.value)||5})}>
            </div>
            ${this.sldLoadingValues?d`<p class="muted">Reading values from the service…</p>`:n}
            ${t?d`
                <p class="muted">
                    This service publishes no data service alongside its pictures, so these column names come from a
                    single feature and there are no values to classify by. One colour is what can be drawn here.
                </p>`:n}
        `}setDraft(e){this.sldAttempt++,this.sldVerifying=!1,this.sldDraft={...this.sldDraft,...e};let t=Tt(this.sldDraft);this.sldClasses=t.classes,this.sldProblem=t.problem??null}sldGeometry(){return this.sldAttributes?.geometry??this.sldProbe?.geometry??`unknown`}async chooseSldAttribute(e){this.setDraft({attribute:e||null,values:null});let t=this.sldAttributes?.wfs;if(!(!e||!t)){this.sldLoadingValues=!0;try{let n=await p(t,e,_t);this.setDraft({values:n??[]})}finally{this.sldLoadingValues=!1}}}async retrySldProbe(e){this.sldProbe=null,await this.loadSldBranch(e,{force:!0})}async loadSldBranch(e,t={}){let n=this.context;this.sldProbing=!0;try{let r=await le(e,St(n?.sourceControl?.getView?.()??null,n?.bounds??null),void 0,t);if(this.context!==n||(this.sldProbe=r,!r.supported))return;let i=await m(e,r.hit??null);if(this.context!==n)return;this.sldAttributes=i}catch{this.context===n&&(this.sldProbe={supported:!1,reason:`error`})}finally{this.context===n&&(this.sldProbing=!1)}}async applySld(e){let t=this.context?.raster;if(!t)return;let n=Dt(e.layers.split(`,`)[0].trim(),this.sldGeometry(),this.sldDraft);if(this.sldClasses=n.classes,this.sldProblem=n.problem??null,!n.sld||!this.writeSourceParams(t.sourceId,{SLD_BODY:n.sld,STYLES:``},e=>A(e,n.sld)))return;this.sldApplied=!0,this.message=null;let r=++this.sldAttempt,i=this.context;this.sldProblem=null,this.sldVerifying=!0;try{let[t]=St(this.context?.sourceControl?.getView?.()??null,this.context?.bounds??null),a=await y(A(ue(e,t.bbox,{},t.size??void 0),n.sld));if(r!==this.sldAttempt||this.context!==i)return;if(a.ok){this.sldProblem=null;return}this.sldApplied=a.problem!==`too-long`,this.sldProblem=a.problem===`too-long`?`This service will not accept a request this long. Use fewer classes, or an attribute with shorter values.`:a.detail?`The service refused this style: ${a.detail}`:`The service refused this style.`}catch(e){r===this.sldAttempt&&(this.sldProblem=`The style could not be checked: ${String(e?.message??e)}`)}finally{r===this.sldAttempt&&(this.sldVerifying=!1)}}clearSld(){let e=this.context?.raster;if(!e)return;let t=this.wmsStyle;this.writeSourceParams(e.sourceId,{SLD_BODY:null,STYLES:t},e=>ie(A(e,null),t))&&(this.sldApplied=!1,this.sldClasses=[])}writeSourceParams(e,t,n){return(this.context?.sourceControl)?.setParams?.(e,t)?!0:this.writeSourceUrls(e,n)!==null}writeSourceUrls(e,t){let n=this.context?.sourceControl,r=n?.getTiles?.(e)??null;if(!r||r.length===0)return this.message=`This map engine cannot change this layer's request while it is on the map.`,null;let i=r.map(t);return n?.setTiles(e,i)?i:(this.message=`This map engine cannot change this layer's request while it is on the map.`,null)}async loadWmsStyles(e){this.wmsLoading=!0;try{this.wmsStyles=await _e(e)}catch{this.wmsStyles=[],this.message=`The service did not answer with the styles it offers.`}finally{this.wmsLoading=!1}}applyWmsStyle(e){let t=this.context?.raster;if(t){if(!this.writeSourceParams(t.sourceId,{STYLES:e,SLD_BODY:null},n=>gt(t,this.context?.sourceControl,e)[0]??n)){this.message=`This map engine cannot change a layer's style while it is on the map.`;return}this.wmsStyle=e,this.sldApplied=!1,this.sldClasses=[],this.message=null}}renderList(){let e=this.visibleEntries(),t=this.group(this.sourceId)??this.groups[0]??null,r=Ze(t?.geometryTypes??[]),i=this.list.some(e=>e.styleable)||(t?.geometryTypes?.length??0)>0,a=this.sourceIds().length>1;return d`
            <div>
                <div class="list-head">
                    <span>Styles</span>
                    ${this.listIsWritable&&i?d`
                        <select aria-label="Add a style"
                                @change=${e=>{let t=e.target,n=t.value;t.value=``,n&&this.addEntry(n)}}>
                            <option value="">+ Add style</option>
                            ${r.map(e=>d`<option value=${e}>${Xe[e]}</option>`)}
                        </select>`:n}
                </div>
                ${this.renderFilter()}
                ${this.list.length===0?d`<p class="muted">This layer draws nothing this panel can style.</p>`:e.length===0?d`<p class="muted">No style matches that.</p>`:e.map(t=>this.renderEntry(t,e,a))}
                ${!i&&this.list.length>0?d`
                    <p class="muted">
                        This layer arrives as finished pictures rather than features, so there is nothing here to
                        colour. What it can be asked is above.
                    </p>`:n}
                ${!this.listIsWritable&&this.list.length>0&&i?d`
                    <p class="muted">
                        This layer's styles come from a style document on the server, so they can be recoloured here
                        but not added to, removed or reordered.
                    </p>`:n}
            </div>
        `}renderFilter(){if(this.list.length<=12)return n;let e=this.sourceIds();return d`
            <div class="row filter-row">
                <input type="search" placeholder="Filter styles" aria-label="Filter styles"
                       .value=${this.filterText}
                       @input=${e=>{this.filterText=e.target.value}}>
                ${e.length>1?d`
                    <select aria-label="Show styles drawing from"
                            @change=${e=>{this.sourceId=e.target.value||null}}>
                        <option value="">All data</option>
                        ${e.map(e=>d`<option value=${e} ?selected=${e===this.sourceId}>${this.sourceLabel(e)}</option>`)}
                    </select>`:n}
            </div>
        `}renderEntry(e,t,r){let i=this.expandedId===e.entry.id,a=t.indexOf(e),o=$e(e.entry.channels.color),s=this.displayEntryName(e),c=this.listIsWritable,l=t[a-1],u=t[a+1];return d`
            <div class="entry">
                <div class="entry-head">
                    <button class="entry-summary" type="button" aria-expanded=${i}
                            @click=${()=>{this.expandedId=i?null:e.entry.id}}>
                        <span class="swatch" style=${Jt(o)}></span>
                        <span class="entry-text">
                            ${s?d`<span class="entry-name">${s}</span>`:n}
                            <span class=${s?`entry-detail`:``}>
                                ${e.styleable?et(e.entry,this.context?.attributeLabels):`${e.entry.origin?.type??`Other`} — not styled here`}
                                ${r?d`<small class="source-key">${e.sourceId.split(`:`).pop()}</small>`:n}
                            </span>
                        </span>
                    </button>
                    <span class="entry-actions">
                        ${c?d`
                            <button type="button" aria-label="Move up, so it draws on top"
                                    title=${a===0?`Already drawn on top`:`Move up`}
                                    ?disabled=${a===0} @click=${()=>this.move(e,l)}>
                                <sl-icon name="arrow-up"></sl-icon>
                            </button>
                            <button type="button" aria-label="Move down, so it draws underneath"
                                    title=${a===t.length-1?`Already at the bottom`:`Move down`}
                                    ?disabled=${a===t.length-1} @click=${()=>this.move(e,u)}>
                                <sl-icon name="arrow-down"></sl-icon>
                            </button>`:n}
                        <button type="button" aria-label="Duplicate this style"
                                title=${this.listIsWritable?`Duplicate`:Kt}
                                ?disabled=${!this.listIsWritable} @click=${()=>this.duplicate(e)}>
                            <sl-icon name="copy"></sl-icon>
                        </button>
                        <button type="button" aria-label="Delete this style"
                                title=${this.listIsWritable?this.list.length<=1?`A layer needs at least one style`:`Delete`:Kt}
                                ?disabled=${!this.listIsWritable||this.list.length<=1} @click=${()=>this.removeEntry(e)}>
                            <sl-icon name="trash"></sl-icon>
                        </button>
                    </span>
                </div>
                ${i?d`<div class="entry-body">${this.renderChannels(e)}</div>`:n}
            </div>
        `}renderChannels(e){return e.styleable?[this.renderTitle(e),...T(e.entry.role).map(t=>this.renderChannel(e,t)),this.renderMoreToggle(e)]:d`<p class="muted">
                This part of the layer is drawn as <code>${e.entry.origin?.type}</code>, which this panel has no
                controls for. It is left exactly as it is.
            </p>`}renderTitle(e){let t=this.displayEntryName(e,{authored:!1})??et(e.entry,this.context?.attributeLabels),n=`${e.entry.id}:title`,r=e=>e.trim()===t?``:e;return d`
            <div class="row">
                <span class="name">Name</span>
                <input type="text" class="grow" aria-label="What this style is called"
                       placeholder=${t}
                       .value=${this.textDrafts.get(n)??e.entry.title??t}
                       @input=${t=>{let i=t.target.value;this.setTextDraft(n,i),this.setEntryField(e,`title`,r(i),{finished:!1})}}
                       @change=${t=>{this.setTextDraft(n,null),this.setEntryField(e,`title`,r(t.target.value))}}>
            </div>
        `}canClassify(e){return K.includes(e)||e===`radius`||e===`textSize`}featuresOf(e){return this.group(e.sourceId)?.features??this.groups[0]?.features??[]}attributesOf(e){return this.group(e.sourceId)?.attributes??this.groups[0]?.attributes??[]}attributeDriverBlocker(e){return this.featuresOf(e).length===0?`No features are loaded`:this.attributesOf(e).length===0?`This layer has no columns`:null}settingsKey(e,t){return`${e.entry.id}:${t}`}settingsFor(e,t){let n=this.settingsKey(e,t),r=this.classifySettings.get(n);if(r)return r;let i=e.entry.channels[t],a=this.attributesOf(e),o=a.find(e=>z(e.type))?.name??a[0]?.name??``;if(i?.driver!==`attribute`)return Ae(o);let s=i.classification,c=Ae(i.attribute||o);return c.schemeName=i.schemeName??null,s.kind===`ranges`&&(c.classCount=s.colors.length,s.noDataColor&&(c.noDataColor=s.noDataColor)),s.kind===`categories`&&(c.maxCategories=Math.max(s.values.length,1),c.cycle=!0,s.fallbackColor&&(c.noDataColor=s.fallbackColor)),s.kind===`proportional`&&(c.growWithZoom=s.zoomFactor!==void 0),c}updateSettings(e,t,n){let r=this.settingsFor(e,t),i={...r,...n},a=new Map(this.classifySettings);a.set(this.settingsKey(e,t),i),this.classifySettings=a,this.renameForAttribute(e,r.attribute,i.attribute),this.applyClassification(e,t,i)}renameForAttribute(e,t,n){if(!t||!n||t===n)return;let r=this.list.find(t=>t.entry.id===e.entry.id)??e;r.entry.title===t&&this.setEntryField(r,`title`,n)}applyClassification(e,t,n){this.schedule(`${e.entry.id}:${t}:classify`,()=>{let r=this.list.find(t=>t.entry.id===e.entry.id)??e;this.classifyNow(r,t,n)})}classifyNow(e,t,n){let r=this.featuresOf(e);if(!n.attribute||r.length===0)return;let i=t===`radius`||t===`textSize`?t===`radius`?Oe(r,n.attribute,Wt,n.growWithZoom===!1?void 0:this.context?.sourceControl?.getView?.()?.zoom):Oe(r,n.attribute,Gt):we(r,this.isNumeric(e,n.attribute),n);if(!i){this.message=`Nothing to classify: “${n.attribute}” has no usable values.`;return}if(i.channel===null){this.message=i.problem;return}this.message=i.warning??null,this.setChannel(e,t,i.channel)}isNumeric(e,t){return z(this.attributesOf(e).find(e=>e.name===t)?.type)}neighbourDriverBlocker(e,t){if(!K.includes(t))return`Not something neighbours can decide`;let n=this.group(e.sourceId)??this.groups[0]??null,r=(n?.geometryTypes??[]).some(e=>/polygon/i.test(e));return n&&!r?`Areas only`:this.featuresOf(e).length===0?`No features are loaded`:!this.canWriteFeatures(e)&&!C(this.featuresOf(e))?`Nothing tells these areas apart: no id, and no columns unique together`:null}canWriteFeatures(e){let t=this.group(e.sourceId)??this.groups[0]??null;return!t||!this.context?.writeFeatures||t.completeData===!1?!1:t.sourceConfig?.type===`geojson`&&(t.features?.length??0)>0}renderNeighbours(e,t){let r=this.neighbourColors.get(this.settingsKey(e,t))??Y,i=this.lastColoring;return d`
            <div class="level4">
                <div class="row">
                    <span class="name">Colours</span>
                    <input type="range" min="4" max="12" step="1" aria-label="How many colours to spread over"
                           .value=${String(r)}
                           @input=${n=>this.applyNeighbours(e,t,Number(n.target.value))}>
                    <span class="value">${r}</span>
                </div>
                ${this.renderNeighbourPalette(e,t)}
                <p class="muted">
                    A colour here names no value, so this map has no legend — it is for showing where the areas are
                    and where their borders run.
                </p>
                ${e.entry.channels[t]?.key?d`
                    <p class="muted">
                        This layer's data cannot be added to, so every area is named in the style, coloured from the
                        areas drawn now. An area that comes into view later is drawn in the fallback colour until the
                        colouring is run again: move the Colours slider to do that.
                    </p>`:n}
                ${i&&i.isolatedRegions>0?d`
                    <p class="muted">
                        ${i.isolatedRegions} of ${i.isolatedRegions+i.colors.length-i.isolatedRegions}
                        areas touch nothing. A few is normal — real islands — but if most do, the borders in this data
                        do not share coordinates and the colouring means little.
                    </p>`:n}
            </div>
        `}neighbourPalette(e,t){return this.neighbourPalettes.get(this.settingsKey(e,t))??{schemeName:null,reversed:!1,blindSafe:!1}}neighbourSchemes(e,t,n){return Ee(Math.min(Math.max(n,3),12),`qual`,this.neighbourPalette(e,t))}neighbourScheme(e,t,n){let r=this.neighbourSchemes(e,t,n),{schemeName:i}=this.neighbourPalette(e,t);return r.find(e=>e.name===i)??r[0]??null}noNeighbourSchemeMessage(e,t,n){return this.neighbourPalette(e,t).blindSafe?`No colour-blind-safe palette has ${n} colours. Use fewer colours, or untick Colour-blind safe.`:`No palette has ${n} distinct colours.`}updateNeighbourPalette(e,t,n){let r=new Map(this.neighbourPalettes);r.set(this.settingsKey(e,t),{...this.neighbourPalette(e,t),...n}),this.neighbourPalettes=r,this.applyNeighbours(e,t,this.neighbourColors.get(this.settingsKey(e,t))??Y)}renderNeighbourPalette(e,t){let n=e.entry.channels[t],r=this.neighbourPalette(e,t),i=this.neighbourColors.get(this.settingsKey(e,t))??(n?.driver===`neighbours`?n.colors.length:Y),a=n?.driver===`neighbours`?n.colors.length:null,o=this.neighbourSchemes(e,t,i),s=this.neighbourScheme(e,t,i)?.name??null;return d`
            <div class="row check-row">
                <span class="name">Palette</span>
                <div class="checks">
                    <label class="check">
                        <input type="checkbox" .checked=${r.reversed}
                               @change=${n=>this.updateNeighbourPalette(e,t,{reversed:n.target.checked})}>
                        Reverse
                    </label>
                    <label class="check">
                        <input type="checkbox" .checked=${r.blindSafe}
                               @change=${n=>this.updateNeighbourPalette(e,t,{blindSafe:n.target.checked})}>
                        Colour-blind safe
                    </label>
                </div>
            </div>
            ${o.length===0?d`<div class="warning">
                    ${this.noNeighbourSchemeMessage(e,t,i)}
                    ${a===null?``:` The map still shows the last colouring, with ${a} colours.`}
                  </div>`:d`
                    <div class="schemes">
                        ${o.map(n=>d`
                            <button class="scheme" type="button" aria-label=${n.name}
                                    aria-pressed=${n.name===s}
                                    title=${n.name}
                                    @click=${()=>this.updateNeighbourPalette(e,t,{schemeName:n.name})}>
                                ${n.colors.map(e=>d`<span style=${`background:${e}`}></span>`)}
                            </button>`)}
                    </div>`}
        `}applyKeyedNeighbours(e,t,n,r){let i=C(n);if(!i){this.message=`Nothing tells these areas apart (no id, and no columns unique together), so a colouring cannot name them.`;return}let a=this.neighbourScheme(e,t,r.colorCount);if(!a){this.message=null;return}let o=new Map;n.forEach((e,t)=>{let n=f(i,e),a=r.colors[t];n===null||a===void 0||o.has(n)||o.set(n,a)}),this.message=null,this.setChannel(e,t,{driver:`neighbours`,key:i,assignments:[...o],colors:Array.from({length:r.colorCount},(e,t)=>a.colors[t%a.colors.length])})}applyNeighbours(e,t,n){let r=new Map(this.neighbourColors);r.set(this.settingsKey(e,t),n),this.neighbourColors=r;let i=this.group(e.sourceId)??this.groups[0]??null,a=i?.features;if(!i||!a?.length){this.message=`Colouring by neighbours needs the layer’s own features, and this layer has not handed them over.`;return}let o=D(a,{paletteSize:n});if(this.lastColoring=o,!this.canWriteFeatures(e)){this.applyKeyedNeighbours(e,t,a,o);return}if(!this.context?.writeFeatures)return;if(a.forEach((e,t)=>{let n=o.colors[t];n!==void 0&&(e.properties={...e.properties??{},[g]:n})}),!this.context.writeFeatures(i.sourceId,a)){this.message=`This layer’s data could not be added to, so the colouring has nothing the map can name.`;return}let s=this.neighbourScheme(e,t,o.colorCount);if(!s){this.message=null;return}this.message=null,this.setChannel(e,t,{driver:`neighbours`,attribute:g,colors:Array.from({length:o.colorCount},(e,t)=>s.colors[t%s.colors.length])})}renderChannel(e,t){let r=e.entry.channels[t],i=q[t];if(t===`text`)return this.renderTextChannel(e,r);if(t===`fillOutline`)return this.renderFillEdge(e,r);if(t===`lineJoin`)return this.renderCorners(e,r);let a=this.canClassify(t),o=a?this.attributeDriverBlocker(e):`Not something a column can decide`,s=this.neighbourDriverBlocker(e,t),c=[`single`];a&&c.push(`attribute`),K.includes(t)&&c.push(`neighbours`),r&&!c.includes(r.driver)&&c.push(r.driver);let l=e=>e===`attribute`?o:e===`neighbours`?s:null;return d`
            <div class="row">
                <span class="name">${i}</span>
                ${c.length>1?d`
                    <select aria-label=${`How ${i.toLowerCase()} is decided`}
                            @change=${n=>this.changeDriver(e,t,n.target.value)}>
                        ${c.map(e=>d`
                            <option value=${e}
                                    ?selected=${e===(r?.driver??`single`)}
                                    ?disabled=${!!l(e)}>
                                ${qt[e]}${l(e)?` — ${l(e)}`:``}
                            </option>`)}
                    </select>`:n}
                ${this.renderChannelValue(e,t,r)}
            </div>
            ${r?.driver===`attribute`?this.renderClassification(e,t):n}
            ${r?.driver===`neighbours`?this.renderNeighbours(e,t):n}
            ${r?.driver===`zoom`?d`
                <p class="muted">${Xt(r)}</p>`:n}
            ${r&&r.driver===`custom`&&t!==`dash`?d`<pre class="custom">${JSON.stringify(r.expression)}</pre>`:n}
        `}renderClassification(e,t){let r=this.settingsFor(e,t),i=this.attributesOf(e),a=this.isNumeric(e,r.attribute),o=t===`radius`||t===`textSize`;return d`
            <div class="level4">
                ${i.length===0?d`
                    <p class="muted">
                        No columns to classify by yet — the map has drawn no features of this layer here. Move to
                        where it draws, and this fills itself in.
                    </p>`:n}
                <div class="row">
                    <span class="name">Attribute</span>
                    <select aria-label="Attribute to classify by"
                            @change=${n=>this.updateSettings(e,t,{attribute:n.target.value})}>
                        ${i.map(e=>{let t=!z(e.type)&&e.uniqueCount>=e.presentCount&&e.presentCount>1,n=o&&!z(e.type);return d`
                                <option value=${e.name} ?selected=${e.name===r.attribute}
                                        ?disabled=${n}>
                                    ${ne(e.name,this.context?.attributeLabels)}${t?` — a colour each`:n?` — not a number`:``}
                                </option>`})}
                    </select>
                </div>
                ${o?d`
                    <p class="muted">
                        Sized straight from the value — twice the value draws twice the area, which a class
                        boundary would throw away. No classes, and no legend of them.
                    </p>
                    ${t===`radius`?d`
                        <div class="row check-row">
                            <span class="name">Zoom</span>
                            <div class="checks">
                                <label class="check">
                                    <input type="checkbox" .checked=${r.growWithZoom!==!1}
                                           @change=${n=>this.updateSettings(e,t,{growWithZoom:n.target.checked})}>
                                    Grow with zoom
                                </label>
                            </div>
                        </div>`:n}`:a?this.renderNumericLevel4(e,t,r):this.renderCategoryLevel4(e,t,r)}
                ${o?n:this.renderPalette(e,t,r)}
                ${o?n:this.renderNoData(e,t,r)}
            </div>
        `}renderNoData(e,t,r){if(!K.includes(t))return n;let i=this.isNumeric(e,r.attribute),a=r.noDataColor,o=`${e.entry.id}:${t}:nodata`;return d`
            <div class="row">
                <span class="name">${i?`No value`:`No value, or not listed`}</span>
                <button class="color-button" type="button" style=${`background:${a}`}
                        aria-label=${`Colour for features with no value: ${a}`}
                        @click=${n=>this.openPicker(o,n.currentTarget,a,n=>this.updateSettings(e,t,{noDataColor:n}))}></button>
                <input type="text" class="grow" aria-label="What the legend calls them — leave empty to leave them out"
                       placeholder="Not in the legend"
                       .value=${e.entry.noDataLabel??``}
                       @input=${t=>this.setEntryField(e,`noDataLabel`,t.target.value,{finished:!1})}
                       @change=${t=>this.setEntryField(e,`noDataLabel`,t.target.value)}>
            </div>
        `}renderNumericLevel4(e,t,n){return d`
            <div class="row">
                <span class="name">Method</span>
                <select aria-label="How the numbers are divided"
                        title=${je[n.method]}
                        @change=${n=>this.updateSettings(e,t,{method:n.target.value})}>
                    ${ke.map(e=>d`
                        <option value=${e} ?selected=${e===n.method}>${De[e]}</option>`)}
                </select>
            </div>
            <p class="muted">${je[n.method]}</p>
            <div class="row">
                <span class="name">Classes</span>
                <input type="range" min="2" max="9" step="1" aria-label="Number of classes"
                       .value=${String(n.classCount)}
                       @input=${n=>this.updateSettings(e,t,{classCount:Number(n.target.value)})}>
                <span class="value">${n.classCount}</span>
            </div>
        `}renderCategoryLevel4(e,t,n){return d`
            <div class="row">
                <span class="name">Colours</span>
                <input type="range" min="2" max="12" step="1" aria-label="How many colours to use"
                       .value=${String(n.maxCategories)}
                       @input=${n=>this.updateSettings(e,t,{maxCategories:Number(n.target.value)})}>
                <span class="value">${n.maxCategories}</span>
            </div>
        `}renderPalette(e,t,n){let r=e.entry.channels[t],i=this.isNumeric(e,n.attribute),a=i?`seq`:`qual`,o=i?r?.driver===`attribute`&&r.classification.kind!==`proportional`?r.classification.colors.length:n.classCount:Te(this.featuresOf(e),n),s=Ee(o,a,n),c=r?.driver===`attribute`?r.schemeName:n.schemeName;return d`
            <div class="row check-row">
                <span class="name">Palette</span>
                <div class="checks">
                    <label class="check">
                        <input type="checkbox" .checked=${n.reversed}
                               @change=${n=>this.updateSettings(e,t,{reversed:n.target.checked})}>
                        Reverse
                    </label>
                    <label class="check">
                        <input type="checkbox" .checked=${n.blindSafe}
                               @change=${n=>this.updateSettings(e,t,{blindSafe:n.target.checked})}>
                        Colour-blind safe
                    </label>
                </div>
            </div>
            ${s.length===0?d`<p class="muted">No palette has ${o} colours under these settings.</p>`:d`
                    <div class="schemes">
                        ${s.map(n=>d`
                            <button class="scheme" type="button" aria-label=${n.name}
                                    aria-pressed=${n.name===c}
                                    title=${n.name}
                                    @click=${()=>this.updateSettings(e,t,{schemeName:n.name})}>
                                ${n.colors.map(e=>d`<span style=${`background:${e}`}></span>`)}
                            </button>`)}
                    </div>`}
        `}renderChannelValue(e,t,r){if(r?.driver===`zoom`)return this.renderZoomSize(e,t,r);if(r&&r.driver!==`single`)return d`<span class="muted">${Qt(r)}</span>`;if(K.includes(t))return this.renderColor(e,t,r);if(t===`dash`)return this.renderDash(e,r);let i=We[t];if(!i)return n;let a=typeof r?.value==`number`?r.value:Ge[t]??i.min;return d`
            <input type="range" min=${i.min} max=${i.max} step=${i.step}
                   aria-label=${q[t]}
                   .value=${String(a)}
                   @input=${n=>this.setChannel(e,t,{driver:`single`,value:Number(n.target.value)})}>
            <span class="value">${t===`opacity`?`${Math.round(a*100)}%`:`${a}${i.unit}`}</span>
        `}renderZoomSize(e,t,n){let r=We[t],i=this.context?.sourceControl?.getView?.()?.zoom,a=he(n,i);return d`
            ${r&&a!==null?d`
                <input type="range" min=${r.min} max=${r.max} step=${r.step}
                       aria-label=${`${q[t]} at this zoom`}
                       .value=${String(a)}
                       @input=${r=>{let a=Number(r.target.value);this.setChannel(e,t,_(n,a,i))}}>
                <span class="value">${Yt(a)}${r.unit}</span>`:d`<span class="muted">${Qt(n)}</span>`}
        `}renderColor(e,t,n){let r=Qe(n)??`#000000`,i=`${e.entry.id}:${t}`;return d`
            <button class="color-button" type="button" style=${`background:${r}`}
                    aria-label=${`${q[t]}: ${r}`}
                    @click=${n=>this.openPicker(i,n.currentTarget,r,n=>this.setChannel(e,t,{driver:`single`,value:n}))}></button>
        `}renderDash(e,t){let r=qe(t);return d`
            <select aria-label="Line pattern"
                    @change=${t=>{let n=Ke.find(e=>e.label===t.target.value);this.setChannel(e,`dash`,n?.value?{driver:`single`,value:n.value}:void 0)}}>
                ${Ke.map(e=>d`
                    <option value=${e.label} ?selected=${e.label===r}>${e.label}</option>`)}
                ${r===`Custom`?d`<option value="Custom" selected>Custom</option>`:n}
            </select>
        `}renderCorners(e,t){let n=t?.driver===`single`&&typeof t.value==`string`?t.value:`miter`;return d`
            <div class="row">
                <span class="name">${q.lineJoin}</span>
                <select aria-label="Corners and ends"
                        @change=${t=>{let n=t.target.value===`round`;this.setChannel(e,`lineCap`,{driver:`single`,value:n?`round`:`butt`},{silent:!0}),this.setChannel(e,`lineJoin`,{driver:`single`,value:n?`round`:`miter`})}}>
                    <option value="round" ?selected=${n===`round`}>Round</option>
                    <option value="miter" ?selected=${n!==`round`}>Sharp</option>
                </select>
            </div>
        `}renderFillEdge(e,t){let r=t!==void 0,i=Qe(t)??`#000000`;return d`
            <div class="row check-row">
                <span class="name">${q.fillOutline}</span>
                <label class="check">
                    <input type="checkbox" .checked=${r}
                           @change=${t=>this.setChannel(e,`fillOutline`,t.target.checked?{driver:`single`,value:i}:void 0)}>
                    Draw a 1px edge
                </label>
                ${r?this.renderColor(e,`fillOutline`,t):n}
            </div>
            ${r?d`<p class="muted">A thicker boundary is an Outline style of its own — add one above.</p>`:n}
        `}renderTextChannel(e,t){let r=((this.group(e.sourceId)??this.groups[0]??null)?.attributes??[]).map(e=>e.name),i=Je(t),a=t&&!i;return d`
            <div class="row">
                <span class="name">${q.text}</span>
                ${a?d`<span class="muted">a custom expression</span>`:d`
                        <select aria-label="Label text"
                                @change=${t=>{let n=t.target.value;this.setChannel(e,`text`,n?Ye(n):void 0)}}>
                            <option value="">None</option>
                            ${r.map(e=>d`
                                <option value=${e} ?selected=${e===i}>${e}</option>`)}
                        </select>`}
            </div>
            ${a?d`<pre class="custom">${JSON.stringify(t.driver===`custom`?t.expression:t)}</pre>`:n}
        `}renderMoreToggle(e){if(e.entry.role!==`label`||!kt(this.context?.engine))return n;let t=this.moreOpen.has(e.entry.id),r=Bt(e.entry);return d`
            <button type="button" class=${r?`more-toggle overridden`:`more-toggle`}
                    aria-expanded=${t?`true`:`false`}
                    aria-label=${r?`Font, placement and overlap (changed)`:`Font, placement and overlap`}
                    title="Font, placement and overlap"
                    @click=${()=>{let n=new Set(this.moreOpen);t?n.delete(e.entry.id):n.add(e.entry.id),this.moreOpen=n}}>${t?`show less`:`show more...`}</button>
            ${t?this.renderLabelMore(e):n}
        `}renderLabelMore(e){let{font:t,placement:r,anchor:i,offset:a,allowOverlap:o}=e.entry.channels,s=Nt((this.group(e.sourceId)??this.groups[0]??null)?.geometryTypes??[]),c=Pt(r),l=Rt(i,a);return d`
            <div class="level4">
                ${this.renderFont(e,t)}
                ${s.length>0||c!==`point`?d`
                    <div class="row">
                        <span class="name">${q.placement}</span>
                        ${c===null?d`<span class="muted">a custom expression</span>`:d`
                                <select aria-label="Where the label sits"
                                        @change=${t=>{let n=t.target.value;this.setChannel(e,`placement`,n===`point`?void 0:{driver:`single`,value:n})}}>
                                    ${s.map(e=>d`
                                        <option value=${e.value} ?selected=${e.value===c}>${e.label}</option>`)}
                                    ${s.some(e=>e.value===c)?n:d`<option value=${c} selected>${c}</option>`}
                                </select>`}
                    </div>`:n}
                ${c===`point`?this.renderPosition(e,l):n}
                <div class="row check-row">
                    <span class="name">${q.allowOverlap}</span>
                    <label class="check">
                        <input type="checkbox"
                               .checked=${o?.driver===`single`&&o.value===!0}
                               ?disabled=${o!==void 0&&o.driver!==`single`}
                               @change=${t=>this.setChannel(e,`allowOverlap`,t.target.checked?{driver:`single`,value:!0}:void 0)}>
                        Draw every label, even where they collide
                    </label>
                </div>
            </div>
        `}renderFont(e,t){if(t&&!Mt(t))return d`
                <div class="row">
                    <span class="name">${q.font}</span>
                    <span class="muted">a custom expression</span>
                </div>`;let r=Mt(t),i=this.context?.fontStacks?.()??[],a=r&&!i.some(e=>e[0]===r[0])?[r,...i]:i;return d`
            <div class="row">
                <span class="name">${q.font}</span>
                <select aria-label="Label font"
                        @change=${t=>{let n=a[Number(t.target.value)];this.setChannel(e,`font`,n?{driver:`single`,value:n}:void 0)}}>
                    <option value="-1" ?selected=${!r}>Map default</option>
                    ${a.map((e,t)=>d`
                        <option value=${String(t)} ?selected=${r?.[0]===e[0]}>${e[0]}</option>`)}
                </select>
            </div>
            ${a.length===0?d`
                <p class="muted">
                    No other layer on this map names a font. A face the map cannot draw shows no text at all, so only
                    the default is offered.
                </p>`:n}
        `}renderPosition(e,t){if(!t)return d`
                <div class="row">
                    <span class="name">${q.anchor}</span>
                    <span class="muted">set in the layer in a way this control cannot show</span>
                </div>`;let r=t=>{let{anchor:n,offset:r}=zt(t);this.setChannel(e,`offset`,r,{silent:!0}),this.setChannel(e,`anchor`,n)},i=t.direction===`center`?0:t.distance;return d`
            <div class="row">
                <span class="name">${q.anchor}</span>
                <select aria-label="Which side of the point"
                        @change=${e=>r({direction:e.target.value,distance:t.direction===`center`?.5:t.distance})}>
                    ${Object.keys(Ft).map(e=>d`
                        <option value=${e} ?selected=${e===t.direction}>${Ft[e]}</option>`)}
                </select>
            </div>
            ${t.direction===`center`?n:d`
                <div class="row">
                    <span class="name">${q.offset}</span>
                    <input type="range" min="0" max="3" step="0.25" aria-label="Distance from the point"
                           .value=${String(i)}
                           @input=${e=>r({direction:t.direction,distance:Number(e.target.value)})}>
                    <span class="value">${i} em</span>
                </div>`}
        `}changeDriver(e,t,n){if(n===`attribute`){this.applyClassification(e,t,this.settingsFor(e,t));return}if(n===`neighbours`){this.applyNeighbours(e,t,this.neighbourColors.get(this.settingsKey(e,t))??Y);return}if(n!==`single`)return;let r=rt(e.entry.role,e.entry.id).channels[t];this.setChannel(e,t,r??{driver:`single`,value:`#000000`})}openPicker(e,t,n,r){let i=this.pickers.get(e);if(i&&i.button===t){i.instance.setColor(n);return}i?.instance.destroy();let a=Pe({button:t,value:n,paintButton:!1,onChange:r});this.pickers.set(e,{button:t,instance:a}),a.show()}destroyPickers(){for(let e of this.pickers.values())e.instance.destroy();this.pickers.clear()}};M([o({type:Boolean,reflect:!0})],X.prototype,`visible`,void 0),M([c()],X.prototype,`panelTitle`,void 0),M([c()],X.prototype,`list`,void 0),M([c()],X.prototype,`groups`,void 0),M([c()],X.prototype,`sourceId`,void 0),M([c()],X.prototype,`expandedId`,void 0),M([c()],X.prototype,`layerOpacity`,void 0),M([c()],X.prototype,`filterText`,void 0),M([c()],X.prototype,`message`,void 0),M([c()],X.prototype,`wmsStyles`,void 0),M([c()],X.prototype,`wmsStyle`,void 0),M([c()],X.prototype,`wmsLoading`,void 0),M([c()],X.prototype,`sldProbe`,void 0),M([c()],X.prototype,`sldProbing`,void 0),M([c()],X.prototype,`sldAttributes`,void 0),M([c()],X.prototype,`sldLoadingValues`,void 0),M([c()],X.prototype,`sldDraft`,void 0),M([c()],X.prototype,`sldApplied`,void 0),M([c()],X.prototype,`sldClasses`,void 0),M([c()],X.prototype,`sldProblem`,void 0),M([c()],X.prototype,`sldVerifying`,void 0),M([c()],X.prototype,`classifySettings`,void 0),M([c()],X.prototype,`neighbourColors`,void 0),M([c()],X.prototype,`neighbourPalettes`,void 0),M([c()],X.prototype,`lastColoring`,void 0),M([c()],X.prototype,`moreOpen`,void 0),M([c()],X.prototype,`textDrafts`,void 0),X=M([a(`webmapx-layer-styler`)],X);function Jt(e){return e.length===0?`background:transparent`:e.length===1?`background:${e[0]}`:`background:linear-gradient(90deg, ${e.map((t,n)=>`${t} ${n/e.length*100}%, ${t} ${(n+1)/e.length*100}%`).join(`, `)})`}function Yt(e){return Number(e.toFixed(1))}function Xt(e){let t=e.scale??1;return`Grows with zoom: ${e.stops.map(([e,n])=>`${Yt(n*t)}px at z${e}`).join(`, `)}. Between and beyond those, it follows the line.`}function Zt(e){let t=e.stops.map(([,t])=>t*(e.scale??1)),n=Math.min(...t),r=Math.max(...t);return n===r?`${n}px`:`${n}–${r}px by zoom`}function Qt(e){if(e.driver===`neighbours`)return`no two neighbours alike`;if(e.driver===`custom`)return`a custom expression`;if(e.driver===`single`)return String(e.value);if(e.driver===`zoom`)return Zt(e);let t=e.classification;if(t.kind===`proportional`)return`sized by ${e.attribute}${t.zoomFactor?`, grows with zoom`:``}`;let n=t.kind===`ranges`?t.colors.length:t.values.length,r=t.kind===`ranges`?`classes`:`categories`;return`${e.attribute}, ${n} ${r}`}var Z,$t=7,en=10**$t;function tn(e){return typeof e==`number`?Math.round(e*en)/en:Array.isArray(e)?e.map(tn):e}function nn(e){return e.type===`GeometryCollection`?{...e,geometries:e.geometries.map(nn)}:{...e,coordinates:tn(e.coordinates)}}function rn(e,t){return typeof e==`string`?e:JSON.stringify(t?{...e,features:e.features.map(e=>e.geometry?{...e,geometry:nn(e.geometry)}:e)}:e)}var an=`map-layers`,Q=class extends i{static{Z=this}constructor(...e){super(...e),this.items=[],this.filename=an,this.includeStyle=!0,this.zip=!0,this.roundCoordinates=!0,this.filenameEdited=!1}static{this.styles=[N,P,u`
        :host { display: block; }

        sl-dialog::part(panel) {
            min-width: min(420px, 90vw);
            max-width: min(520px, 90vw);
        }

        .layer-list {
            display: flex;
            flex-direction: column;
            gap: var(--webmapx-space-xs, 0.4rem);
            max-height: 40vh;
            overflow-y: auto;
            margin-bottom: var(--webmapx-space-md, 0.75rem);
        }

        .layer-row sl-checkbox::part(label) {
            display: flex;
            align-items: center;
            gap: var(--webmapx-space-xs, 0.4rem);
        }

        .unsupported {
            color: var(--color-text-muted, #6b7681);
            font-size: var(--webmapx-font-size-sm, 0.8rem);
        }

        .external-hint {
            color: var(--color-text-muted, #6b7681);
            font-size: var(--webmapx-font-size-sm, 0.8rem);
        }

        .options {
            display: flex;
            flex-direction: column;
            gap: var(--webmapx-space-sm, 0.5rem);
            margin-top: var(--webmapx-space-md, 0.75rem);
        }

        .footer {
            display: flex;
            justify-content: flex-end;
            gap: var(--webmapx-space-sm, 0.5rem);
            margin-top: var(--webmapx-space-lg, 1rem);
        }
    `]}open(e,t){I(this),this.items=e.map(e=>{let n=e.sourceData??(e.sourceId?t?.getSourceData(e.sourceId)??null:null),r=n!==null||e.sourceConfig!=null;return{...e,data:n,checked:r}}),this.filenameEdited=!1,this.syncFilenameToSelection(),this.includeStyle=!0,this.zip=!0,this.roundCoordinates=!0,this.dialog?.show()}close(){this.dialog?.hide()}get selectedItems(){return this.items.filter(e=>e.checked&&(e.data!==null||e.sourceConfig!=null))}get singleFileEligible(){return this.selectedItems.length===1&&!this.includeStyle}toggleItem(e,t){this.items=this.items.map(n=>n.layerId===e?{...n,checked:t}:n),this.syncFilenameToSelection()}syncFilenameToSelection(){if(this.filenameEdited)return;let e=this.selectedItems;this.filename=e.length===1?Z.sanitizeFileBase(e[0].label??e[0].layerId):an}static sanitizeFileBase(e){return e.replace(/[^A-Za-z0-9_-]+/g,`_`).replace(/^_+|_+$/g,``)||`layer`}buildFileBases(e){let t=new Map,n=new Set;for(let r of e){let e=Z.sanitizeFileBase(r.label??r.layerId),i=e,a=2;for(;n.has(i);)i=`${e}_${a++}`;n.add(i),t.set(r.layerId,i)}return t}buildStyleConfig(e,t){let n={},r=[],i=e.layerId;return e.data===null&&e.sourceConfig!=null?n[i]=e.sourceConfig:n[i]={type:`geojson`,data:`${t}.geojson`},Array.isArray(e.sublayers)&&e.sublayers.length>0?e.sublayers.forEach((t,n)=>{let a=t,o=a.metadata&&typeof a.metadata==`object`?a.metadata:{},s=String(a.id??``),c=typeof o.label==`string`&&o.label.length>0?o.label:s.replace(/^[^:]*:/,``).replace(/-/g,` `);r.push({...a,id:s||`${e.layerId}_${n}`,source:i,metadata:{...o,label:c}})}):r.push({id:e.layerId,type:e.layerType??`fill`,source:i,metadata:{label:e.label},...e.paint?{paint:e.paint}:{}}),{version:8,id:e.layerId,title:e.label,sources:n,layers:r}}async handleDownload(){let e=this.selectedItems;if(e.length===0)return;let t=(this.filenameInput?.value??this.filename).trim()||an;if(this.singleFileEligible&&!this.zip){let n=e[0],r=rn(n.data,this.roundCoordinates);this.downloadBlob(new Blob([r],{type:`application/geo+json`}),`${t}.geojson`),this.close();return}let n=[...e].reverse(),r=this.buildFileBases(n),i=new x(new ae(`application/zip`));for(let e of n){let t=e.data===null&&e.sourceConfig!=null;if(!t){let t=rn(e.data,this.roundCoordinates);await i.add(`${r.get(e.layerId)}.geojson`,new O(t))}if(this.includeStyle||t){let t=this.buildStyleConfig(e,r.get(e.layerId));await i.add(`${r.get(e.layerId)}_style.json`,new O(JSON.stringify(t,null,2)))}}this.downloadBlob(await i.close(),`${t}.zip`),this.close()}downloadBlob(e,t){let n=URL.createObjectURL(e),r=document.createElement(`a`);r.href=n,r.download=t,r.click(),URL.revokeObjectURL(n)}render(){let e=this.selectedItems.length,t=this.singleFileEligible;return F(d`
                <sl-dialog label="Save layer(s)"
                           @sl-request-close=${e=>{e.detail?.source===`overlay`&&this.close()}}>
                    <div class="layer-list">
                        ${this.items.map(e=>d`
                            <div class="layer-row">
                                <sl-checkbox
                                    ?checked=${e.checked}
                                    ?disabled=${e.data===null&&e.sourceConfig==null}
                                    @sl-change=${t=>this.toggleItem(e.layerId,t.target.checked)}
                                >
                                    ${e.label}
                                    ${e.data===null&&e.sourceConfig==null?d`<span class="unsupported">(no exportable data)</span>`:null}
                                    ${e.data===null&&e.sourceConfig!=null?d`<span class="external-hint">(style only)</span>`:null}
                                </sl-checkbox>
                            </div>
                        `)}
                    </div>

                    <sl-input class="filename-input" label="Filename" .value=${this.filename}
                              @sl-input=${e=>{this.filename=e.target.value,this.filenameEdited=!0}}>
                    </sl-input>

                    <div class="options">
                        <sl-checkbox ?checked=${this.includeStyle}
                                      @sl-change=${e=>{this.includeStyle=e.target.checked}}>
                            Include style
                        </sl-checkbox>
                        <sl-checkbox ?checked=${this.roundCoordinates}
                                      @sl-change=${e=>{this.roundCoordinates=e.target.checked}}>
                            Round coordinates to ${$t} decimals (about 5 cm)
                        </sl-checkbox>
                        ${t?d`
                            <sl-checkbox ?checked=${this.zip}
                                          @sl-change=${e=>{this.zip=e.target.checked}}>
                                Save as .zip
                            </sl-checkbox>
                        `:null}
                    </div>

                    <div slot="footer" class="footer">
                        <sl-button autofocus @click=${this.close}>Cancel</sl-button>
                        <sl-button variant="primary" ?disabled=${e===0} @click=${()=>this.handleDownload()}>
                            Download
                        </sl-button>
                    </div>
                </sl-dialog>
        `)}};M([c()],Q.prototype,`items`,void 0),M([c()],Q.prototype,`filename`,void 0),M([c()],Q.prototype,`includeStyle`,void 0),M([c()],Q.prototype,`zip`,void 0),M([c()],Q.prototype,`roundCoordinates`,void 0),M([r(`sl-dialog`)],Q.prototype,`dialog`,void 0),M([r(`.filename-input`)],Q.prototype,`filenameInput`,void 0),Q=Z=M([a(`webmapx-save-layers-dialog`)],Q);var $=class extends i{constructor(...e){super(...e),this.url=``,this.hasConfig=!1,this.dynamicLayerIds=[],this.copied=!1}static{this.styles=[N,P,u`
        :host { display: block; }

        sl-dialog::part(panel) {
            min-width: min(480px, 90vw);
            max-width: min(620px, 90vw);
        }

        .url-box {
            font-family: var(--sl-font-mono);
            font-size: var(--webmapx-font-size-sm, 0.78rem);
            background: var(--color-background-secondary, #f4f6f8);
            border: 1px solid var(--color-border, #d5dce3);
            border-radius: var(--sl-border-radius-medium);
            padding: var(--webmapx-space-sm, 0.5rem) var(--webmapx-space-md, 0.75rem);
            word-break: break-all;
            margin-bottom: var(--webmapx-space-md, 0.75rem);
            user-select: all;
            line-height: 1.5;
        }

        .warning {
            display: flex;
            align-items: flex-start;
            gap: var(--webmapx-space-xs, 0.4rem);
            font-size: var(--webmapx-font-size-md, 0.85rem);
            color: var(--sl-color-warning-800);
            background: var(--sl-color-warning-50);
            border: 1px solid var(--sl-color-warning-200);
            border-radius: var(--sl-border-radius-medium);
            padding: var(--webmapx-space-sm, 0.5rem) var(--webmapx-space-sm, 0.65rem);
            margin-bottom: var(--webmapx-space-md, 0.75rem);
        }

        .warning sl-icon {
            flex-shrink: 0;
            margin-top: 0.1rem;
        }
    `]}open(e,t,n=[]){I(this),this.url=e,this.hasConfig=t,this.dynamicLayerIds=n,this.copied=!1,this.dialog.show()}async handleCopy(){await navigator.clipboard.writeText(this.url),this.copied=!0,setTimeout(()=>{this.copied=!1},2e3)}render(){return F(d`
                <sl-dialog label="Permalink">
                    ${this.dynamicLayerIds.length>0?d`
                        <div class="warning">
                            <sl-icon name="exclamation-triangle"></sl-icon>
                            <span>
                                <strong>${this.dynamicLayerIds.length} imported layer${this.dynamicLayerIds.length>1?`s`:``} will not restore</strong>
                                — layers added from files (${this.dynamicLayerIds.join(`, `)}) are not stored in the permalink.
                                Recipients will see those layers missing.
                            </span>
                        </div>
                    `:null}
                    ${this.hasConfig?null:d`
                        <div class="warning">
                            <sl-icon name="exclamation-triangle"></sl-icon>
                            <span>Config was not loaded from a URL — layer state may not restore for recipients using a different config.</span>
                        </div>
                    `}
                    <div class="url-box">${this.url}</div>
                    <div slot="footer" style="display:flex;gap:0.5rem;justify-content:flex-end">
                        <sl-button @click=${()=>this.dialog.hide()}>Close</sl-button>
                        <sl-button variant="primary" @click=${this.handleCopy}>
                            <sl-icon slot="prefix" name=${this.copied?`check2`:`clipboard`}></sl-icon>
                            ${this.copied?`Copied!`:`Copy to clipboard`}
                        </sl-button>
                    </div>
                </sl-dialog>
        `)}};M([c()],$.prototype,`url`,void 0),M([c()],$.prototype,`hasConfig`,void 0),M([c()],$.prototype,`dynamicLayerIds`,void 0),M([c()],$.prototype,`copied`,void 0),M([r(`sl-dialog`)],$.prototype,`dialog`,void 0),$=M([a(`webmapx-permalink-dialog`)],$);var on=class extends i{static{this.styles=[P,u`
        :host { display: block; }
    `]}open(){I(this),this.dialog.show()}hide(){this.dialog?.hide()}handleConfirm(){this.dispatchEvent(new CustomEvent(`webmapx-clear-layers-confirm`,{bubbles:!0,composed:!0}))}render(){return F(d`
                <sl-dialog label="Alle kaartlagen wissen">
                    <p>Dit wist alle kaartlagen uit 'actieve lagen'. Sla zelfgemaakte lagen eerst op. Je kunt bestaande lagen weer openen via de kaartlagen knop.</p>
                    <sl-button slot="footer" variant="default" @click=${()=>this.hide()}>Annuleren</sl-button>
                    <sl-button slot="footer" variant="danger" @click=${()=>this.handleConfirm()}>Wissen</sl-button>
                </sl-dialog>
        `)}};M([r(`sl-dialog`)],on.prototype,`dialog`,void 0),on=M([a(`webmapx-clear-layers-dialog`)],on);export{At as t};