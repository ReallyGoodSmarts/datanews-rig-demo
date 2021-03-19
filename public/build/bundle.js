var app=function(){"use strict";function t(){}function e(t){return t()}function n(){return Object.create(null)}function o(t){t.forEach(e)}function r(t){return"function"==typeof t}function s(t,e){return t!=t?e==e:t!==e||t&&"object"==typeof t||"function"==typeof t}function i(t,e){t.appendChild(e)}function l(t,e,n){t.insertBefore(e,n||null)}function a(t){t.parentNode.removeChild(t)}function c(t,e){for(let n=0;n<t.length;n+=1)t[n]&&t[n].d(e)}function u(t){return document.createElement(t)}function d(t){return document.createTextNode(t)}function f(){return d(" ")}function g(t,e,n,o){return t.addEventListener(e,n,o),()=>t.removeEventListener(e,n,o)}function h(t,e,n){null==n?t.removeAttribute(e):t.getAttribute(e)!==n&&t.setAttribute(e,n)}function p(t,e){e=""+e,t.wholeText!==e&&(t.data=e)}function m(t,e,n,o){t.style.setProperty(e,n,o?"important":"")}let v,b;function _(){if(void 0===v){v=!1;try{"undefined"!=typeof window&&window.parent&&window.parent.document}catch(t){v=!0}}return v}function $(t){b=t}const y=[],w=[],k=[],x=[],j=Promise.resolve();let z=!1;function C(t){k.push(t)}let E=!1;const A=new Set;function M(){if(!E){E=!0;do{for(let t=0;t<y.length;t+=1){const e=y[t];$(e),P(e.$$)}for($(null),y.length=0;w.length;)w.pop()();for(let t=0;t<k.length;t+=1){const e=k[t];A.has(e)||(A.add(e),e())}k.length=0}while(y.length);for(;x.length;)x.pop()();z=!1,E=!1,A.clear()}}function P(t){if(null!==t.fragment){t.update(),o(t.before_update);const e=t.dirty;t.dirty=[-1],t.fragment&&t.fragment.p(t.ctx,e),t.after_update.forEach(C)}}const D=new Set;function S(t,e){t&&t.i&&(D.delete(t),t.i(e))}function L(t,e,n,o){if(t&&t.o){if(D.has(t))return;D.add(t),undefined.c.push((()=>{D.delete(t),o&&(n&&t.d(1),o())})),t.o(e)}}function N(t){t&&t.c()}function O(t,n,s,i){const{fragment:l,on_mount:a,on_destroy:c,after_update:u}=t.$$;l&&l.m(n,s),i||C((()=>{const n=a.map(e).filter(r);c?c.push(...n):o(n),t.$$.on_mount=[]})),u.forEach(C)}function T(t,e){const n=t.$$;null!==n.fragment&&(o(n.on_destroy),n.fragment&&n.fragment.d(e),n.on_destroy=n.fragment=null,n.ctx=[])}function W(t,e){-1===t.$$.dirty[0]&&(y.push(t),z||(z=!0,j.then(M)),t.$$.dirty.fill(0)),t.$$.dirty[e/31|0]|=1<<e%31}function J(e,r,s,i,l,c,u=[-1]){const d=b;$(e);const f=e.$$={fragment:null,ctx:null,props:c,update:t,not_equal:l,bound:n(),on_mount:[],on_destroy:[],on_disconnect:[],before_update:[],after_update:[],context:new Map(d?d.$$.context:[]),callbacks:n(),dirty:u,skip_bound:!1};let g=!1;if(f.ctx=s?s(e,r.props||{},((t,n,...o)=>{const r=o.length?o[0]:n;return f.ctx&&l(f.ctx[t],f.ctx[t]=r)&&(!f.skip_bound&&f.bound[t]&&f.bound[t](r),g&&W(e,t)),n})):[],f.update(),g=!0,o(f.before_update),f.fragment=!!i&&i(f.ctx),r.target){if(r.hydrate){const t=function(t){return Array.from(t.childNodes)}(r.target);f.fragment&&f.fragment.l(t),t.forEach(a)}else f.fragment&&f.fragment.c();r.intro&&S(e.$$.fragment),O(e,r.target,r.anchor,r.customElement),M()}$(d)}class B{$destroy(){T(this,1),this.$destroy=t}$on(t,e){const n=this.$$.callbacks[t]||(this.$$.callbacks[t]=[]);return n.push(e),()=>{const t=n.indexOf(e);-1!==t&&n.splice(t,1)}}$set(t){var e;this.$$set&&(e=t,0!==Object.keys(e).length)&&(this.$$.skip_bound=!0,this.$$set(t),this.$$.skip_bound=!1)}}function H(t,e,n){const o=t.slice();return o[9]=e[n],o}function I(t,e,n){const o=t.slice();return o[12]=e[n],o[14]=n,o}function q(e){let n,o;return{c(){n=u("div"),o=u("div"),h(o,"class","level svelte-1azrjgf"),m(o,"background-color",e[12]),h(n,"class","bar svelte-1azrjgf")},m(t,e){l(t,n,e),i(n,o)},p:t,d(t){t&&a(n)}}}function F(e){let n,o;return{c(){n=u("div"),o=u("div"),h(o,"class","level svelte-1azrjgf"),m(o,"background-color",e[12]),h(n,"class","bar bar-tick svelte-1azrjgf")},m(t,e){l(t,n,e),i(n,o)},p:t,d(t){t&&a(n)}}}function G(t){let e;let n=function(t,e){return t[14]<t[5].length-1?F:q}(t)(t);return{c(){n.c(),e=d("")},m(t,o){n.m(t,o),l(t,e,o)},p(t,e){n.p(t,e)},d(t){n.d(t),t&&a(e)}}}function K(t){let e,n;return{c(){e=u("div"),n=u("div"),h(n,"class","level svelte-1azrjgf"),m(n,"background-color",t[3]),h(e,"class","bar bar-last svelte-1azrjgf")},m(t,o){l(t,e,o),i(e,n)},p(t,e){8&e&&m(n,"background-color",t[3])},d(t){t&&a(e)}}}function U(e){let n,o,r,s=e[9]+"";return{c(){n=u("div"),o=u("span"),r=d(s),h(o,"class","svelte-1azrjgf"),h(n,"class","level-label svelte-1azrjgf")},m(t,e){l(t,n,e),i(n,o),i(o,r)},p:t,d(t){t&&a(n)}}}function V(t){let e;return{c(){e=u("div"),e.innerHTML='<span class="svelte-1azrjgf">No data</span>',h(e,"class","level-label svelte-1azrjgf")},m(t,n){l(t,e,n)},d(t){t&&a(e)}}}function Q(e){let n,o,r,s,g,m,v,b,_,$,y,w,k,x,j,z,C=e[5],E=[];for(let t=0;t<C.length;t+=1)E[t]=G(I(e,C,t));let A=e[2]&&K(e),M=e[6],P=[];for(let t=0;t<M.length;t+=1)P[t]=U(H(e,M,t));let D=e[2]&&V();return{c(){n=u("main"),o=u("div"),r=u("div"),s=d(e[0]),g=f(),m=u("div"),v=d(e[1]),b=f(),_=u("div");for(let t=0;t<E.length;t+=1)E[t].c();$=f(),A&&A.c(),y=f(),w=u("div");for(let t=0;t<P.length;t+=1)P[t].c();k=f(),D&&D.c(),x=f(),j=u("p"),z=d(e[4]),h(r,"class","map-key-hed svelte-1azrjgf"),h(m,"class","map-key-subhed svelte-1azrjgf"),h(_,"class","bars svelte-1azrjgf"),h(w,"class","level-labels svelte-1azrjgf"),h(j,"class","map-interaction-tip svelte-1azrjgf"),h(o,"class","map-key svelte-1azrjgf")},m(t,e){l(t,n,e),i(n,o),i(o,r),i(r,s),i(o,g),i(o,m),i(m,v),i(o,b),i(o,_);for(let t=0;t<E.length;t+=1)E[t].m(_,null);i(_,$),A&&A.m(_,null),i(o,y),i(o,w);for(let t=0;t<P.length;t+=1)P[t].m(w,null);i(w,k),D&&D.m(w,null),i(o,x),i(o,j),i(j,z)},p(t,[e]){if(1&e&&p(s,t[0]),2&e&&p(v,t[1]),32&e){let n;for(C=t[5],n=0;n<C.length;n+=1){const o=I(t,C,n);E[n]?E[n].p(o,e):(E[n]=G(o),E[n].c(),E[n].m(_,$))}for(;n<E.length;n+=1)E[n].d(1);E.length=C.length}if(t[2]?A?A.p(t,e):(A=K(t),A.c(),A.m(_,null)):A&&(A.d(1),A=null),64&e){let n;for(M=t[6],n=0;n<M.length;n+=1){const o=H(t,M,n);P[n]?P[n].p(o,e):(P[n]=U(o),P[n].c(),P[n].m(w,k))}for(;n<P.length;n+=1)P[n].d(1);P.length=M.length}t[2]?D||(D=V(),D.c(),D.m(w,null)):D&&(D.d(1),D=null),16&e&&p(z,t[4])},i:t,o:t,d(t){t&&a(n),c(E,t),A&&A.d(),c(P,t),D&&D.d()}}}function R(t,e,n){let{hed:o=""}=e,{subhed:r=""}=e,{color_string:s=""}=e,{level_breaks_string:i=""}=e,{has_missing_data:l=!1}=e,{missing_data_color:a="#eee"}=e,{interaction_tip:c=""}=e,u=s.split(","),d=i.split(",");return t.$$set=t=>{"hed"in t&&n(0,o=t.hed),"subhed"in t&&n(1,r=t.subhed),"color_string"in t&&n(7,s=t.color_string),"level_breaks_string"in t&&n(8,i=t.level_breaks_string),"has_missing_data"in t&&n(2,l=t.has_missing_data),"missing_data_color"in t&&n(3,a=t.missing_data_color),"interaction_tip"in t&&n(4,c=t.interaction_tip)},[o,r,l,a,c,u,d,s,i]}class X extends B{constructor(t){super(),J(this,t,R,Q,s,{hed:0,subhed:1,color_string:7,level_breaks_string:8,has_missing_data:2,missing_data_color:3,interaction_tip:4})}}function Y(e){let n,o,r,s,c;return{c(){n=u("main"),o=u("div"),r=u("img"),r.src!==(s=e[0])&&h(r,"src",s),h(r,"width",e[1]),C((()=>e[2].call(o)))},m(t,s){l(t,n,s),i(n,o),i(o,r),c=function(t,e){"static"===getComputedStyle(t).position&&(t.style.position="relative");const n=u("iframe");n.setAttribute("style","display: block; position: absolute; top: 0; left: 0; width: 100%; height: 100%; overflow: hidden; border: 0; opacity: 0; pointer-events: none; z-index: -1;"),n.setAttribute("aria-hidden","true"),n.tabIndex=-1;const o=_();let r;return o?(n.src="data:text/html,<script>onresize=function(){parent.postMessage(0,'*')}<\/script>",r=g(window,"message",(t=>{t.source===n.contentWindow&&e()}))):(n.src="about:blank",n.onload=()=>{r=g(n.contentWindow,"resize",e)}),i(t,n),()=>{(o||r&&n.contentWindow)&&r(),a(n)}}(o,e[2].bind(o))},p(t,[e]){1&e&&r.src!==(s=t[0])&&h(r,"src",s),2&e&&h(r,"width",t[1])},i:t,o:t,d(t){t&&a(n),c()}}}function Z(t,e,n){let o,{filename:r}=e;return t.$$set=t=>{"filename"in t&&n(0,r=t.filename)},[r,o,function(){o=this.clientWidth,n(1,o)}]}class tt extends B{constructor(t){super(),J(this,t,Z,Y,s,{filename:0})}}function et(e){let n,o,r,s,c,d,g,p,m,v,b;return d=new X({props:{hed:"",subhed:"Portion fully vaccinated",color_string:"#fff7fb,#ede5f1,#d5d5e8,#b3c4df,#83b2d4,#529ec8,#258bac,#067c80,#016657,#014636",level_breaks_string:" ,10%,20%,30%,40%,50%,60%,70%,80%,90%"}}),p=new tt({props:{filename:"./vaccinations_map.svg"}}),{c(){n=u("main"),o=u("h1"),o.textContent="Fully vaccinated across the U.S.",r=f(),s=u("p"),s.textContent="Percentage of the state's adult population who've received both doses of Pfizer or Moderna shots, or the single-dose Johnson & Johnson shot.",c=f(),N(d.$$.fragment),g=f(),N(p.$$.fragment),m=f(),v=u("p"),v.innerHTML='Data as of March 18, 2021 | Source: Centers for Disease Control and Prevention | Get the <a href="https://covid.cdc.gov/covid-data-tracker/COVIDData/getAjaxData?id=vaccination_data">data</a> | By John Keefe',h(o,"class","svelte-u1n7b5"),h(s,"class","g-leadin svelte-u1n7b5"),h(v,"class","g-notes svelte-u1n7b5"),h(n,"class","svelte-u1n7b5")},m(t,e){l(t,n,e),i(n,o),i(n,r),i(n,s),i(n,c),O(d,n,null),i(n,g),O(p,n,null),i(n,m),i(n,v),b=!0},p:t,i(t){b||(S(d.$$.fragment,t),S(p.$$.fragment,t),b=!0)},o(t){L(d.$$.fragment,t),L(p.$$.fragment,t),b=!1},d(t){t&&a(n),T(d),T(p)}}}return new class extends B{constructor(t){super(),J(this,t,null,et,s,{})}}({target:document.body,props:{name:"world"}})}();
//# sourceMappingURL=bundle.js.map
