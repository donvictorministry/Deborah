/* ===== MODULE: cover-page.js (launch cover). Self-contained: own CSS, HTML, JS. Needs no other file. =====
   First launch: cover with a Get Started button. Later launches: a short splash. Delete this file to remove it. */
(function () {
'use strict';
var KEY = 'dvcp.seen', seen = false;
try { seen = localStorage.getItem(KEY) === '1'; } catch (e) {}
var name = (document.title || 'Notes').trim();
var css = '.dvcp{position:fixed;top:0;left:0;width:100dvw;height:100dvh;z-index:2000;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;padding:32px;text-align:center;background:linear-gradient(160deg,#1877F2,#0B3C8C);color:#fff;font-family:Roboto,sans-serif;font-size:1rem;transition:opacity .35s}' +
'.dvcp.off{opacity:0;pointer-events:none}.dvcp h1{margin:0;font-size:2rem;font-weight:500}.dvcp p{margin:0;opacity:.9}' +
'.dvcp-logo{width:112px;height:112px;border-radius:32px;background:#fff;color:#1877F2;display:grid;place-items:center;box-shadow:0 8px 24px rgba(0,0,0,.35);animation:dvcpin .6s ease-out}' +
'.dvcp-logo svg{width:64px;height:64px}' +
'.dvcp button{margin-top:16px;min-height:56px;padding:0 40px;border:0;border-radius:28px;background:#fff;color:#1877F2;font:inherit;font-weight:500;cursor:pointer;touch-action:manipulation}' +
'.dvcp button:active{box-shadow:inset 0 0 0 100vmax rgba(128,128,128,.24)}' +
'@keyframes dvcpin{from{transform:scale(.6);opacity:0}to{transform:scale(1);opacity:1}}';
var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
var el = document.createElement('div'); el.className = 'dvcp'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', 'Welcome');
el.innerHTML = '<div class="dvcp-logo"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/></svg></div><h1></h1><p>Write it down. Keep it safe. Share it anywhere.</p>';
el.querySelector('h1').textContent = name;
function hide() { el.classList.add('off'); try { localStorage.setItem(KEY, '1'); } catch (e) {} setTimeout(function () { el.remove(); }, 400); if (navigator.vibrate) try { navigator.vibrate(12); } catch (e) {} }
if (!seen) { var b = document.createElement('button'); b.textContent = 'Get Started'; b.onclick = hide; el.appendChild(b); } else setTimeout(hide, 1100);
document.body.appendChild(el);
})();
