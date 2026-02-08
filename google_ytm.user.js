// ==UserScript==
// @name         Youtube Music Tweak
// @description  -
// @icon         https://www.google.com/s2/favicons?sz=64&domain=music.youtube.com
// @author       dannycreations
// @version      0.0.1
// @namespace    https://github.com/dannycreations/Peke
// @homepage     https://github.com/dannycreations/Peke
// @match        *://music.youtube.com/*
// @grant        none
// @run-at       document-start
// ==/UserScript==

!function(){"use strict";function e(e,t,{signal:n,edges:l}={}){let r,i=null;const o=null!=l&&l.includes("leading"),s=null==l||l.includes("trailing"),u=()=>{null!==i&&(e.apply(r,i),r=void 0,i=null)};let c=null;const d=()=>{null!=c&&clearTimeout(c),c=setTimeout(()=>{c=null,s&&u(),a()},t)},a=()=>{null!==c&&(clearTimeout(c),c=null),r=void 0,i=null},m=function(...e){if(n?.aborted)return;r=this,i=e;const t=null==c;d(),o&&t&&u()};return m.schedule=d,m.cancel=a,m.flush=()=>{u()},n?.addEventListener("abort",a,{once:!0}),m}let t=0,n=null;function l(e){const t=e.querySelectorAll("ytmusic-responsive-list-item-renderer"),n=t.length;let l=null;if(n>0){const e=t[0].querySelector("a[href]");e?.href&&(l=e.href)}return{length:n,firstElement:l}}function r(){const e=document.querySelector("ytmusic-playlist-shelf-renderer #contents");if(!e)return;const r=e.querySelector("ytmusic-continuation-item-renderer");r&&r.remove();const i=e.querySelectorAll("ytmusic-responsive-list-item-renderer"),o=Array.from(i).map(e=>{const t=e.querySelector('yt-formatted-string[title*=" plays"]');return{element:e,plays:t?function(e){if(!e)return 0;const t=e.trim().toUpperCase(),n=parseFloat(t);if(isNaN(n))return 0;let l=1;return t.includes("K")?l=1e3:t.includes("M")?l=1e6:t.includes("B")&&(l=1e9),n*l}(t.title):0}}),s=()=>{r&&e.appendChild(r)};if(o.length<2)return void s();o.sort((e,t)=>t.plays-e.plays);const u=document.createDocumentFragment();o.forEach(e=>{u.appendChild(e.element)}),e.textContent="",e.appendChild(u),s();const c=l(e);t=c.length,n=c.firstElement}var i;i=function(){r();const i=e(r,100);new MutationObserver(()=>{const e=document.querySelector("ytmusic-playlist-shelf-renderer #contents");if(e){const r=l(e),o=r.length!==t,s=r.firstElement!==n;(o||s)&&i()}}).observe(document.body,{childList:!0,subtree:!0})},"complete"===document.readyState?i():window.addEventListener("load",i)}();