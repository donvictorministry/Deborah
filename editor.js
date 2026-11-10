/* ===== MODULE: editor.js (full-page note editor). Self-contained: own CSS, HTML, JS. =====
   Talks to the rest of the app ONLY through DOM events and the shared IndexedDB 'deborah-note'.
   Listens: dv:note:new, dv:editor:open {id | title,text}      Emits: dv:notes:changed
   Share links:  pretty  <base>note/<slug>-<id>#n=<payload>     fallback  <base>#/note/<id>/<payload>
   payload = 'z' + base64url(deflate-raw(JSON {t,x,u}))  or  'p' + base64url(JSON) when compression is unavailable */
(function () {
'use strict';

var CSS = '.dved{--dved-p:var(--dv-p,#1877F2);--dved-op:var(--dv-op,#fff);--dved-pc:var(--dv-pc,#D6E4FF);--dved-opc:var(--dv-opc,#001B3E);--dved-bg:var(--dv-bg,#FDFBFF);--dved-sf:var(--dv-sf,#F1F3FA);--dved-sv:var(--dv-sv,#E1E2EC);--dved-ol:var(--dv-ol,#74777F);--dved-tx:var(--dv-tx,#1A1C1E);--dved-tx2:var(--dv-tx2,#44474E);--dved-er:var(--dv-er,#BA1A1A);position:fixed;top:0;left:0;width:100dvw;height:100dvh;z-index:120;display:flex;flex-direction:column;background:var(--dved-bg);color:var(--dved-tx);font-family:Roboto,sans-serif;font-size:1rem}' +
'.dved[hidden],.dved-scrim[hidden]{display:none!important}' +
'.dved button,.dved input,.dved textarea{font:inherit;color:inherit}' +
'.dved button{border:0;background:none;cursor:pointer;touch-action:manipulation;-webkit-user-select:none;user-select:none}' +
'.dved button:active{box-shadow:inset 0 0 0 100vmax rgba(128,128,128,.24)}' +
'.dved-top{flex-shrink:0;display:flex;align-items:center;gap:4px;background:var(--dved-sf);padding:env(safe-area-inset-top) 4px 0;min-height:calc(64px + env(safe-area-inset-top))}' +
'.dved-ib{width:48px;height:48px;border-radius:50%;display:grid;place-items:center;flex:none;padding:0}' +
'.dved-ib svg{width:28px;height:28px}' +
'.dved-title{flex:1;min-width:0;height:48px;border:0;background:transparent;font-size:1.25rem;font-weight:500;outline:none}' +
'.dved-st{flex:none;color:var(--dved-tx2);padding:0 4px}' +
'.dved-pills,.dved-tools{flex-shrink:0;display:flex;overflow-x:auto;overflow-y:hidden;scrollbar-width:none}' +
'.dved-pills::-webkit-scrollbar,.dved-tools::-webkit-scrollbar{display:none}' +
'.dved-pills{gap:8px;padding:10px 12px;border-bottom:1px solid var(--dved-sv);align-items:center}' +
'.dved-pill{flex:none;display:flex;align-items:center;gap:6px;min-height:44px;padding:0 18px;border-radius:22px;border:2px solid var(--dved-p)!important;color:var(--dved-p);font-weight:500;white-space:nowrap;overflow:hidden}' +
'.dved-pill.on{background:var(--dved-p)!important;color:var(--dved-op)}' +
'.dved-pill span{overflow:hidden;text-overflow:ellipsis}.dved-pill svg{width:18px;height:18px;flex:none}' +
'.dved-none{color:var(--dved-tx2);white-space:nowrap}' +
'.dved-tools{gap:4px;padding:6px 8px;border-bottom:3px solid var(--dved-sv)}' +
'.dved-tool{flex:none;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;min-width:84px;min-height:68px;padding:6px 10px;border-radius:14px;font-weight:500;white-space:nowrap}' +
'.dved-tool svg{width:28px;height:28px;color:var(--dved-p)}' +
'.dved-ta{flex:1;width:100%;min-height:0;border:0;resize:none;outline:none;padding:16px;background:var(--dved-bg);font-size:1.2rem;line-height:1.6}' +
'.dved-scrim{position:fixed;top:0;left:0;width:100dvw;height:100dvh;background:rgba(0,0,0,.5);display:grid;place-items:center;padding:24px;z-index:260}' +
'.dved-card{width:100%;padding:24px;border-radius:28px;background:var(--dved-sf);color:var(--dved-tx);font-family:Roboto,sans-serif;font-size:1rem}' +
'.dved-card h3{margin:0 0 8px;font-size:1.15rem;font-weight:500}.dved-card p{margin:0 0 16px;color:var(--dved-tx2)}' +
'.dved-in{width:100%;min-height:56px;padding:0 16px;margin-bottom:16px;border:1px solid var(--dved-ol);border-radius:16px;background:var(--dved-bg);color:var(--dved-tx);font:inherit;letter-spacing:6px;text-align:center}' +
'.dved-acts{display:flex;flex-wrap:wrap;justify-content:flex-end;gap:8px}' +
'.dved-btn{min-height:48px;padding:0 22px;border:0;border-radius:24px;background:var(--dved-p);color:var(--dved-op);font:inherit;font-weight:500;cursor:pointer;touch-action:manipulation}' +
'.dved-btn.o{background:transparent;color:var(--dved-p);border:1px solid var(--dved-ol)}.dved-btn.d{background:var(--dved-er);color:#fff}' +
'.dved-btn:active{box-shadow:inset 0 0 0 100vmax rgba(128,128,128,.24)}' +
'.dved-spin{width:56px;height:56px;border-radius:50%;border:6px solid var(--dved-sv);border-top-color:var(--dved-p);animation:dvedspin 1s linear infinite}' +
'@keyframes dvedspin{to{transform:rotate(360deg)}}' +
'.dved-toast{position:fixed;left:0;right:0;top:50%;transform:translateY(-50%);padding:0 24px;text-align:center;pointer-events:none;opacity:0;transition:opacity .2s;z-index:400;font-family:Roboto,sans-serif;font-size:1rem}' +
'.dved-toast.on{opacity:1}.dved-toast span{display:inline-block;padding:14px 24px;border-radius:24px;background:#323232;color:#fff}';
var st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);

function h(t, p) {
  var e = document.createElement(t);
  for (var a in (p || {})) { if (a === 'class') e.className = p[a]; else if (a.slice(0, 2) === 'on') e.addEventListener(a.slice(2), p[a]); else e.setAttribute(a, p[a]); }
  for (var i = 2; i < arguments.length; i++) { var k = arguments[i]; if (Array.isArray(k)) e.append.apply(e, k); else if (k != null && k !== '') e.append(k); }
  return e;
}
function svg(p, c) { var w = h('span'); w.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + p + '</svg>'; var e = w.firstChild; if (c) e.setAttribute('class', c); return e; }
function emit(n, d) { document.dispatchEvent(new CustomEvent(n, { detail: d || {} })); }
function buzz(ms) { try { if (navigator.vibrate) navigator.vibrate(ms || 10); } catch (e) {} }
var IC = {
  back: '<line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>',
  check: '<polyline points="20 6 9 17 4 12"/>',
  plus: '<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>',
  undo: '<path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"/>',
  redo: '<path d="M21 7v6h-6"/><path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3L21 13"/>',
  paste: '<path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/>',
  copy: '<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
  lock: '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
  share: '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>',
  trash: '<polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/>',
  imp: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>',
  exp: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>'
};

/* ---------- feedback: toast, spinner, dialogs (own copies, no shared code) ---------- */
var tt, toastEl = h('div', { class: 'dved-toast', role: 'status' });
function toast(m) { toastEl.replaceChildren(h('span', {}, m)); toastEl.classList.add('on'); clearTimeout(tt); tt = setTimeout(function () { toastEl.classList.remove('on'); }, 2200); }
var spinEl = h('div', { class: 'dved-scrim', hidden: '' }, h('div', { class: 'dved-spin', role: 'progressbar', 'aria-label': 'Working' }));
var dlgEl = h('div', { class: 'dved-scrim', hidden: '', role: 'alertdialog', 'aria-modal': 'true' });
function dlg(o) {
  return new Promise(function (res) {
    var inp = o.pin ? h('input', { class: 'dved-in', type: 'password', inputmode: 'numeric', maxlength: '4', autocomplete: 'off', placeholder: '4 digits', 'aria-label': 'PIN' }) : null;
    if (inp) inp.addEventListener('input', function () { inp.value = inp.value.replace(/\D/g, '').slice(0, 4); });
    function end(v) { dlgEl.hidden = true; res(v); }
    dlgEl.replaceChildren(h('div', { class: 'dved-card' }, h('h3', {}, o.title), o.msg ? h('p', {}, o.msg) : '', inp || '',
      h('div', { class: 'dved-acts' }, o.buttons.map(function (b) { return h('button', { class: 'dved-btn ' + (b.c || ''), onclick: function () { buzz(); end({ k: b.k, v: inp ? inp.value : '' }); } }, b.t); }))));
    dlgEl.hidden = false; buzz(20); if (inp) setTimeout(function () { inp.focus(); }, 60);
  });
}
function confirmDelete() { return dlg({ title: 'Delete note?', msg: 'This note will be deleted for good.', buttons: [{ t: 'Cancel', k: 'n', c: 'o' }, { t: 'Delete', k: 'y', c: 'd' }] }).then(function (r) { return r.k === 'y'; }); }

/* ---------- storage: shared contract ---------- */
var db = null;
function openDB() {
  if (db) return Promise.resolve(db);
  return new Promise(function (res, rej) {
    var r = indexedDB.open('deborah-note', 1);
    r.onupgradeneeded = function () { var d = r.result; ['notes', 'todos'].forEach(function (n) { if (!d.objectStoreNames.contains(n)) d.createObjectStore(n, { keyPath: 'id' }); }); if (!d.objectStoreNames.contains('meta')) d.createObjectStore('meta', { keyPath: 'k' }); };
    r.onsuccess = function () { db = r.result; db.onversionchange = function () { db.close(); db = null; }; res(db); };
    r.onerror = function () { rej(r.error); };
  });
}
function rq(r) { return new Promise(function (res, rej) { r.onsuccess = function () { res(r.result); }; r.onerror = function () { rej(r.error); }; }); }
function getNote(id) { return openDB().then(function (d) { return rq(d.transaction('notes').objectStore('notes').get(id)); }); }
function allNotes() { return openDB().then(function (d) { return rq(d.transaction('notes').objectStore('notes').getAll()); }); }
function wr(fn) {
  return openDB().then(function (d) {
    var t; try { t = d.transaction('notes', 'readwrite', { durability: 'strict' }); } catch (e) { t = d.transaction('notes', 'readwrite'); }
    fn(t.objectStore('notes'));
    return new Promise(function (res, rej) { t.oncomplete = res; t.onerror = t.onabort = function () { rej(t.error); }; });
  });
}

/* ---------- editor UI ---------- */
var cur = null, isOpen = false, hist = [''], hi = 0, hT = null, aT = null, pillsEl, taEl, titleEl, stEl, fileEl;
function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
var tools = [['new', IC.plus, 'New'], ['undo', IC.undo, 'Undo'], ['redo', IC.redo, 'Redo'], ['paste', IC.paste, 'Paste'], ['copy', IC.copy, 'Copy'], ['lock', IC.lock, 'Lock'],
  ['share', IC.share, 'Share'], ['import', IC.imp, 'Import'], ['export', IC.exp, 'Export'], ['delete', IC.trash, 'Delete']];
titleEl = h('input', { class: 'dved-title', placeholder: 'Title', maxlength: '80', 'aria-label': 'Note title' });
stEl = h('span', { class: 'dved-st' }, '');
pillsEl = h('div', { class: 'dved-pills' });
taEl = h('textarea', { class: 'dved-ta', placeholder: 'Start writing...', spellcheck: 'true', 'aria-label': 'Note text' });
fileEl = h('input', { type: 'file', accept: '.txt,text/plain', hidden: '' });
var root = h('section', { class: 'dved', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Note editor', hidden: '' },
  h('div', { class: 'dved-top' }, h('button', { class: 'dved-ib', 'aria-label': 'Back', onclick: function () { history.back(); } }, svg(IC.back)), titleEl, stEl,
    h('button', { class: 'dved-ib', 'aria-label': 'Save note', onclick: function () { persist(true); } }, svg(IC.check))),
  pillsEl,
  h('div', { class: 'dved-tools' }, tools.map(function (t) { return h('button', { class: 'dved-tool', 'data-k': t[0], onclick: function () { buzz(); act(t[0]); } }, svg(t[1]), h('span', {}, t[2])); })),
  taEl, fileEl);
document.body.append(root, spinEl, dlgEl, toastEl);

function status(s) { stEl.textContent = s; }
function snap() { return JSON.stringify([titleEl.value, taEl.value]); }
var lastSnap = '';
function histFlush() { clearTimeout(hT); var v = taEl.value; if (v === hist[hi]) return; hist = hist.slice(0, hi + 1); hist.push(v); if (hist.length > 200) hist.shift(); hi = hist.length - 1; }
function onEdit() { status('Editing'); clearTimeout(hT); hT = setTimeout(histFlush, 500); clearTimeout(aT); aT = setTimeout(function () { persist(false); }, 700); }
taEl.addEventListener('input', onEdit); titleEl.addEventListener('input', onEdit);

function persist(explicit) {
  clearTimeout(aT); histFlush();
  if (!cur) return Promise.resolve();
  var t = titleEl.value.trim(), x = taEl.value;
  if (!t && !x.trim()) { if (explicit) toast('Write something first'); return Promise.resolve(); }
  if (!explicit && snap() === lastSnap) return Promise.resolve();
  cur.title = t || x.trim().split('\n')[0].slice(0, 60) || 'Untitled'; cur.text = x; cur.updated = Date.now();
  var note = { id: cur.id, title: cur.title, text: cur.text, created: cur.created, updated: cur.updated, pin: cur.pin || null };
  return wr(function (s) { s.put(note); }).then(function () { lastSnap = snap(); status('Saved'); renderPills(); if (explicit) { toast('Note saved'); buzz(20); } },
    function () { status('Not saved'); toast('Could not save. Storage may be full.'); });
}
function renderPills() {
  allNotes().then(function (l) {
    l.sort(function (a, b) { return (b.updated || 0) - (a.updated || 0); });
    pillsEl.replaceChildren.apply(pillsEl, l.length ? l.map(function (n) {
      return h('button', { class: 'dved-pill' + (cur && n.id === cur.id ? ' on' : ''), onclick: function () { buzz(); switchTo(n.id); } }, n.pin ? svg(IC.lock) : '', h('span', {}, String(n.title || 'Untitled').slice(0, 26)));
    }) : [h('span', { class: 'dved-none' }, 'No saved notes yet')]);
  }, function () {});
}
function show(n) {
  cur = n; titleEl.value = n.title || ''; taEl.value = n.text || ''; lastSnap = n._new ? '' : snap(); delete n._new;
  hist = [taEl.value]; hi = 0; status(lastSnap ? 'Saved' : 'New'); renderPills();
  if (!isOpen) { isOpen = true; root.hidden = false; history.pushState({ dvE: 1 }, ''); }
  if (!taEl.value) setTimeout(function () { taEl.focus(); }, 80);
}
function newNote(title, text) { var now = Date.now(); return { id: uid(), title: title || '', text: text || '', created: now, updated: now, pin: null, _new: true }; }
function sha(s) { return crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)).then(function (b) { return Array.prototype.map.call(new Uint8Array(b), function (x) { return ('0' + x.toString(16)).slice(-2); }).join(''); }); }
function unlock(n) {
  if (!n.pin) return Promise.resolve(true);
  return dlg({ title: 'Locked note', msg: 'Enter the 4-digit PIN to open this note.', pin: true, buttons: [{ t: 'Cancel', k: 'n', c: 'o' }, { t: 'Unlock', k: 'y' }] }).then(function (r) {
    if (r.k !== 'y') return false;
    return sha(n.pin.s + ':' + r.v).then(function (hx) { if (hx === n.pin.h) return true; toast('Wrong PIN'); buzz(40); return unlock(n); });
  });
}
function openNote(o) {
  o = o || {};
  if (!o.id) { persist(false).then(function () { show(newNote(o.title, o.text)); }); return; }
  getNote(o.id).then(function (n) {
    if (!n) { toast('Note not found'); return; }
    return unlock(n).then(function (ok) { if (ok) return persist(false).then(function () { show(n); }); });
  }, function () { toast('Could not open the note'); });
}
function switchTo(id) { if (cur && id === cur.id) return; openNote({ id: id }); }
function closeNow() { if (!isOpen) return; persist(false).then(function () { isOpen = false; root.hidden = true; cur = null; emit('dv:notes:changed'); }); }
window.addEventListener('popstate', function () { if (isOpen && !(history.state && history.state.dvE)) closeNow(); });
document.addEventListener('visibilitychange', function () { if (document.hidden && isOpen) persist(false); });
document.addEventListener('dv:note:new', function () { openNote({}); });
document.addEventListener('dv:editor:open', function (e) { openNote(e.detail); });

/* ---------- tools ---------- */
function setText(v) { taEl.value = v; histFlush(); onEdit(); }
function act(k) {
  if (k === 'new') { persist(false).then(function () { show(newNote()); toast('New note'); }); }
  else if (k === 'undo') { histFlush(); if (hi > 0) { hi--; taEl.value = hist[hi]; onEdit(); } else toast('Nothing to undo'); }
  else if (k === 'redo') { histFlush(); if (hi < hist.length - 1) { hi++; taEl.value = hist[hi]; onEdit(); } else toast('Nothing to redo'); }
  else if (k === 'paste') {
    if (!navigator.clipboard || !navigator.clipboard.readText) { toast('Paste is not available. Long-press the text.'); return; }
    navigator.clipboard.readText().then(function (t) { if (!t) { toast('Clipboard is empty'); return; } histFlush(); var s = taEl.selectionStart, e = taEl.selectionEnd; taEl.value = taEl.value.slice(0, s) + t + taEl.value.slice(e); taEl.selectionStart = taEl.selectionEnd = s + t.length; histFlush(); onEdit(); toast('Pasted'); }, function () { toast('Paste blocked. Long-press the text.'); });
  }
  else if (k === 'copy') { if (!taEl.value.trim()) { toast('Nothing to copy'); return; } (navigator.clipboard ? navigator.clipboard.writeText(taEl.value) : Promise.reject()).then(function () { toast('Note copied'); }, function () { toast('Copy is not available'); }); }
  else if (k === 'lock') lockDialog();
  else if (k === 'share') shareNote();
  else if (k === 'import') { fileEl.value = ''; fileEl.click(); }
  else if (k === 'export') exportNote();
  else if (k === 'delete') delNote();
}
fileEl.addEventListener('change', function () {
  var f = fileEl.files && fileEl.files[0]; if (!f) return; var r = new FileReader();
  r.onload = function () { histFlush(); setText(String(r.result || '')); if (!titleEl.value) titleEl.value = f.name.replace(/\.[^.]+$/, ''); toast('Text imported'); };
  r.onerror = function () { toast('Could not read the file'); }; r.readAsText(f);
});
function fname() { return ((cur && cur.title || titleEl.value || 'note').replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '') || 'note') + '.txt'; }
function exportNote() {
  if (!taEl.value.trim()) { toast('Nothing to export'); return; }
  var a = h('a', { href: URL.createObjectURL(new Blob([taEl.value], { type: 'text/plain' })), download: fname() });
  document.body.append(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(a.href); }, 4000); toast('Note exported to your device');
}
function delNote() {
  confirmDelete().then(function (ok) {
    if (!ok || !cur) return;
    var id = cur.id; clearTimeout(aT);
    wr(function (s) { s.delete(id); }).then(function () { cur = null; toast('Note deleted'); buzz(30); isOpen && history.back(); }, function () { toast('Could not delete the note'); });
  });
}
function lockDialog() {
  if (!(window.crypto && crypto.subtle)) { toast('Locking needs a secure (https) connection'); return; }
  var b = [{ t: 'Cancel', k: 'n', c: 'o' }];
  if (cur.pin) b.push({ t: 'Remove PIN', k: 'r', c: 'd' });
  b.push({ t: cur.pin ? 'Change PIN' : 'Set PIN', k: 's' });
  dlg({ title: cur.pin ? 'Locked note' : 'Lock this note', msg: 'Choose a 4-digit PIN. The PIN stops others opening the note in this app. It does not encrypt the text.', pin: true, buttons: b }).then(function (r) {
    if (r.k === 'r') { cur.pin = null; lastSnap = ''; return persist(true).then(function () { toast('PIN removed'); renderPills(); }); }
    if (r.k !== 's') return;
    if (!/^\d{4}$/.test(r.v)) { toast('PIN must be 4 digits'); return; }
    var salt = uid();
    return sha(salt + ':' + r.v).then(function (hx) { cur.pin = { s: salt, h: hx }; lastSnap = ''; return persist(true); }).then(function () { toast('Note locked'); renderPills(); });
  });
}

/* ---------- deep-link sharing (no backend) ---------- */
function b64u(u8) { var s = ''; for (var i = 0; i < u8.length; i++) s += String.fromCharCode(u8[i]); return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); }
function encode(o) {
  var raw = new TextEncoder().encode(JSON.stringify(o));
  if (window.CompressionStream) {
    try { var cs = new CompressionStream('deflate-raw'), w = cs.writable.getWriter(); w.write(raw); w.close(); return new Response(cs.readable).arrayBuffer().then(function (b) { return 'z' + b64u(new Uint8Array(b)); }); } catch (e) {}
  }
  return Promise.resolve('p' + b64u(raw));
}
function base() { return location.origin + location.pathname.replace(/index\.html$/, '').replace(/note\/[^/]*\/?$/, ''); }
function sendLink(url, title) {
  var d = { title: title, text: title, url: url };
  (navigator.share ? navigator.share(d) : Promise.reject()).catch(function (e) {
    if (e && e.name === 'AbortError') return;
    (navigator.clipboard ? navigator.clipboard.writeText(url) : Promise.reject()).then(function () { toast('Link copied. Paste it to share.'); }, function () { toast('Could not share the link'); });
  });
}
function shareNote() {
  if (!taEl.value.trim()) { toast('Write something first'); return; }
  spinEl.hidden = false;
  persist(true).then(function () { return encode({ t: cur.title, x: cur.text, u: cur.updated }); }).then(function (p) {
    spinEl.hidden = true;
    var slug = String(cur.title).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'note';
    var pretty = base() + 'note/' + slug + '-' + cur.id + '#n=' + p, fallback = base() + '#/note/' + cur.id + '/' + p;
    if (pretty.length > 6000) { toast('This note is too long for a link. Use Export instead.'); return; }
    var title = cur.title;
    return dlg({ title: 'Share note link', msg: 'Anyone with the link can read this note. Use the fallback link if the clean link does not open.', buttons: [{ t: 'Cancel', k: 'n', c: 'o' }, { t: 'Fallback link', k: 'f', c: 'o' }, { t: 'Clean link', k: 'p' }] })
      .then(function (r) { if (r.k === 'p') sendLink(pretty, title); else if (r.k === 'f') sendLink(fallback, title); });
  }, function () { spinEl.hidden = true; toast('Could not create the link'); });
}
})();
