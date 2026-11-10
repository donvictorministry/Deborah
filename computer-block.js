/* ===== MODULE: computer-block.js (desktop blocker). Self-contained: own CSS, HTML, JS. Needs no other file. =====
   Allows only Android phones: the browser must say Android + Mobile and the screen must be touch. Everything else is covered and hidden. */
(function () {
'use strict';
var ua = navigator.userAgent || '';
var ok = /Android/i.test(ua) && /Mobile/i.test(ua) && (navigator.maxTouchPoints || 0) > 0;
if (ok) return;
var css = '.dvcb{position:fixed;top:0;left:0;width:100dvw;height:100dvh;z-index:2147483000;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;padding:32px;text-align:center;background:#000;color:#fff;font-family:Roboto,sans-serif;font-size:1.1rem}' +
'.dvcb h1{margin:0;font-size:1.6rem;font-weight:500}.dvcb p{margin:0;color:#C4C6D0}.dvcb svg{width:72px;height:72px;color:#6AA6FF}' +
'body>*:not(.dvcb):not(style){display:none!important}html,body{overflow:hidden!important}';
var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
var el = document.createElement('div'); el.className = 'dvcb'; el.setAttribute('role', 'alertdialog');
el.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="6" y="2" width="12" height="20" rx="3"/><line x1="11" y1="18" x2="13" y2="18"/></svg><h1>Android phones only</h1><p>This app is built for Android phones. Please open this page in Chrome on your Android phone.</p><p>If you are already on an Android phone, turn off Desktop site in the browser menu and reload.</p>';
document.body.appendChild(el);
})();
