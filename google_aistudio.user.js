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

!function(){"use strict";function e(e,t,{signal:n,edges:l}={}){let o,c=null;const i=null!=l&&l.includes("leading"),r=null==l||l.includes("trailing"),u=()=>{null!==c&&(e.apply(o,c),o=void 0,c=null)};let d=null;const a=()=>{null!=d&&clearTimeout(d),d=setTimeout(()=>{d=null,r&&u(),s()},t)},s=()=>{null!==d&&(clearTimeout(d),d=null),o=void 0,c=null},f=function(...e){if(n?.aborted)return;o=this,c=e;const t=null==d;a(),i&&t&&u()};return f.schedule=a,f.cancel=s,f.flush=()=>{u()},n?.addEventListener("abort",s,{once:!0}),f}!function(e,t,n={}){switch(e){case"immediate":default:t();break;case"interactive":"loading"===document.readyState?document.addEventListener("DOMContentLoaded",t):t();break;case"complete":"complete"===document.readyState?t():window.addEventListener("load",t);break;case"dynamic":new MutationObserver(e=>{for(const l of e)0!==l.addedNodes.length&&l.addedNodes.forEach(e=>{e instanceof HTMLElement&&(n.dynamicSelector&&!e.matches(n.dynamicSelector)||t())})}).observe(document.body,{childList:!0,subtree:!0});break}}("complete",function(){const t=function(){let e=!1;return function(){if(e)return;const t=document.querySelector("mat-slide-toggle"),n=document.querySelector('button[aria-label="Run the app"]'),l=document.querySelector("div.buttons-wrapper");if(t&&n&&l){const o=t.querySelector("button.mdc-switch--selected");o&&o.click(),l.insertBefore(t,l.firstChild),l.insertBefore(n,t.nextSibling),e=!0}}}(),n=function(){let e=null;return function(){if(!document.querySelector("svg.running-icon.ng-star-inserted"))return;const t=document.querySelectorAll("a.mat-mdc-tab-link"),n=t.length;if(1!==n){if(n>=3){const l=t[Math.floor((n-1)/2)];if(l&&l!==e){const e=l.querySelector('button[aria-label="Close file"]');e&&e.click()}}}else e=t[0]}}(),l=e(t,100),o=e(n,100);new MutationObserver(()=>{l(),o()}).observe(document.body,{childList:!0,subtree:!0})})}();