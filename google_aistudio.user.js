// ==UserScript==
// @name         AI Studio Tweak
// @description  -
// @icon         https://www.google.com/s2/favicons?sz=64&domain=aistudio.google.com
// @author       dannycreations
// @version      0.0.1
// @namespace    https://github.com/dannycreations/Peke
// @homepage     https://github.com/dannycreations/Peke
// @match        *://aistudio.google.com/apps/drive/*
// @grant        none
// @run-at       document-start
// ==/UserScript==

!function(){"use strict";function n(n,e,{signal:t,edges:l}={}){let u,o=null;const i=null!=l&&l.includes("leading"),c=null==l||l.includes("trailing"),r=()=>{null!==o&&(n.apply(u,o),u=void 0,o=null)};let s=null;const d=()=>{null!=s&&clearTimeout(s),s=setTimeout(()=>{s=null,c&&r(),a()},e)},a=()=>{null!==s&&(clearTimeout(s),s=null),u=void 0,o=null},f=function(...n){if(t?.aborted)return;u=this,o=n;const e=null==s;d(),i&&e&&r()};return f.schedule=d,f.cancel=a,f.flush=()=>{r()},t?.addEventListener("abort",a,{once:!0}),f}var e;e=function(){const e=n(function(){let n=null;return function(){if(!document.querySelector("svg.running-icon.ng-star-inserted"))return;const e=document.querySelectorAll("div.tab"),t=e.length;if(1!==t){if(t>=3){const l=e[Math.floor((t-1)/2)];if(l&&l!==n){const n=l.querySelector('button[mattooltip="Close file"]');n&&n.click()}}}else n=e[0]}}(),100);new MutationObserver(()=>{e()}).observe(document.body,{childList:!0,subtree:!0})},"complete"===document.readyState?e():window.addEventListener("load",e)}();