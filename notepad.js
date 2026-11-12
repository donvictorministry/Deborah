/* ===== MODULE: notepad.js (Editor tab landing page). Self-contained: own CSS, HTML, JS. =====
   Talks to the rest of the app ONLY through DOM events and the shared IndexedDB 'deborah-note'.
   Listens: dv:notes:filter, dv:notes:changed, dv:tab      Emits: dv:note:new, dv:editor:open */
(function () {
'use strict';
var host = document.getElementById('dv-view-editor');
if (!host) return;

/* ---------- own styles (phone only, full width, text never below 1rem) ---------- */
var CSS = '.dvnp,.dvnp-tm{--dvnp-p:var(--dv-p,#1877F2);--dvnp-op:var(--dv-op,#fff);--dvnp-pc:var(--dv-pc,#D6E4FF);--dvnp-opc:var(--dv-opc,#001B3E);--dvnp-bg:var(--dv-bg,#FDFBFF);--dvnp-sf:var(--dv-sf,#F1F3FA);--dvnp-sv:var(--dv-sv,#E1E2EC);--dvnp-ol:var(--dv-ol,#74777F);--dvnp-tx:var(--dv-tx,#1A1C1E);--dvnp-tx2:var(--dv-tx2,#44474E);--dvnp-er:var(--dv-er,#BA1A1A)}' +
'.dvnp{position:absolute;top:0;left:0;right:0;bottom:0;display:flex;flex-direction:column;background:var(--dvnp-bg);color:var(--dvnp-tx);font-family:Roboto,sans-serif;font-size:1rem}' +
'.dvnp button{font:inherit;color:inherit;border:0;background:none;cursor:pointer;touch-action:manipulation;-webkit-user-select:none;user-select:none}' +
'.dvnp button:active,.dvnp-tm button:active{box-shadow:inset 0 0 0 100vmax rgba(128,128,128,.24)}' +
'.dvnp-bar{flex-shrink:0;display:flex;align-items:center;gap:4px;padding:4px 4px 4px;position:relative;background:var(--dv-head,#1877F2);color:#fff;border-bottom:3px solid var(--dvnp-p)}' +
'.dvnp-ib{width:48px;height:48px;border-radius:50%;display:grid!important;place-items:center;flex:none;padding:0}' +
'.dvnp-ib svg{width:28px;height:28px}' +
'.dvnp-bar h2{margin:0;flex:1;font-size:1.25rem;font-weight:500}' +
'.dvnp-menu{position:absolute;top:56px;left:8px;z-index:5;min-width:260px;background:var(--dvnp-sf);border-radius:16px;box-shadow:0 6px 16px rgba(0,0,0,.3);padding:8px 0}' +
'.dvnp-menu div{display:flex;justify-content:space-between;gap:24px;padding:12px 20px}' +
'.dvnp-menu b{font-weight:500;color:var(--dvnp-p)}' +
'.dvnp-chips{flex-shrink:0;display:flex;gap:8px;padding:8px 12px;overflow-x:auto;scrollbar-width:none}' +
'.dvnp-chips::-webkit-scrollbar,.dvnp-tabs::-webkit-scrollbar{display:none}' +
'.dvnp-chip{flex:none;min-height:40px;padding:0 18px;border:1px solid var(--dvnp-ol)!important;border-radius:12px;font-weight:500}' +
'.dvnp-chip.on{background:var(--dvnp-pc)!important;color:var(--dvnp-opc)!important;border-color:transparent!important}' +
'.dvnp-list{flex:1;overflow:auto;padding:4px 12px 112px}' +
'.dvnp-card{display:flex;align-items:center;gap:4px;margin-bottom:10px;border-radius:20px;background:var(--dvnp-sf);box-shadow:0 1px 3px rgba(0,0,0,.2);overflow:hidden}' +
'.dvnp-open{flex:1;min-width:0;text-align:left;padding:14px 16px}' +
'.dvnp-open strong{display:flex;align-items:center;gap:8px;font-weight:500}' +
'.dvnp-open strong span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}' +
'.dvnp-open p{margin:2px 0 0;color:var(--dvnp-tx2);overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}' +
'.dvnp-open small{display:block;margin-top:4px;font-size:1rem;color:var(--dvnp-tx2)}' +
'.dvnp-del{color:var(--dvnp-er)!important}' +
'.dvnp-none{padding:32px 16px;text-align:center;color:var(--dvnp-tx2)}' +
'.dvnp-fs{position:absolute;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,.36);z-index:6}' +
'.dvnp-fab{position:absolute;right:16px;bottom:16px;width:72px;height:72px;border-radius:24px!important;background:var(--dvnp-p)!important;color:var(--dvnp-op)!important;display:grid!important;place-items:center;box-shadow:0 6px 16px rgba(0,0,0,.35);z-index:8}' +
'.dvnp-fab svg{width:34px;height:34px;transition:transform .2s}.dvnp-fab.on svg{transform:rotate(45deg)}' +
'.dvnp-fm{position:absolute;right:16px;bottom:100px;z-index:8;display:flex;flex-direction:column;align-items:flex-end;gap:12px}' +
'.dvnp-fi{display:flex!important;align-items:center;gap:12px;min-height:56px;padding:0 22px 0 18px;border-radius:18px!important;background:var(--dvnp-pc)!important;color:var(--dvnp-opc)!important;font-weight:500;box-shadow:0 4px 12px rgba(0,0,0,.3)}' +
'.dvnp-fi svg{width:26px;height:26px}' +
'.dvnp-tm{position:fixed;top:0;left:0;width:100dvw;height:100dvh;z-index:120;display:flex;flex-direction:column;background:var(--dvnp-bg);color:var(--dvnp-tx);font-family:Roboto,sans-serif;font-size:1rem}' +
'.dvnp-tm[hidden],.dvnp [hidden],.dvnp-scrim[hidden]{display:none!important}' +
'.dvnp-tm button{font:inherit;color:inherit;border:0;background:none;cursor:pointer;touch-action:manipulation}' +
'.dvnp-tabs{flex-shrink:0;display:flex;gap:8px;padding:8px 12px;overflow-x:auto;scrollbar-width:none;border-bottom:1px solid var(--dvnp-sv)}' +
'.dvnp-tab{flex:none;min-height:44px;padding:0 20px;border-radius:22px!important;border:2px solid var(--dvnp-p)!important;color:var(--dvnp-p)!important;font-weight:500;white-space:nowrap}' +
'.dvnp-tab.on{background:var(--dvnp-p)!important;color:var(--dvnp-op)!important}' +
'.dvnp-tb{flex:1;overflow:auto;padding:16px}' +
'.dvnp-tb pre{white-space:pre-wrap;word-break:break-word;margin:12px 0;padding:16px;border-radius:20px;background:var(--dvnp-sf);font:inherit;line-height:1.6}' +
'.dvnp-btn{min-height:52px;padding:0 26px;border-radius:26px!important;background:var(--dvnp-p)!important;color:var(--dvnp-op)!important;font-weight:500;margin:0 8px 8px 0}' +
'.dvnp-btn.o{background:transparent!important;color:var(--dvnp-p)!important;border:1px solid var(--dvnp-ol)!important}' +
'.dvnp-scrim{position:fixed;top:0;left:0;width:100dvw;height:100dvh;background:rgba(0,0,0,.5);display:grid;place-items:center;padding:24px;z-index:260}' +
'.dvnp-card2{width:100%;padding:24px;border-radius:28px;background:var(--dvnp-sf);color:var(--dvnp-tx);font-family:Roboto,sans-serif}' +
'.dvnp-spin{width:56px;height:56px;border-radius:50%;border:6px solid var(--dvnp-sv);border-top-color:var(--dvnp-p);animation:dvnpspin 1s linear infinite}' +
'@keyframes dvnpspin{to{transform:rotate(360deg)}}' +
'.dvnp-toast{position:fixed;left:0;right:0;top:50%;transform:translateY(-50%);padding:0 24px;text-align:center;pointer-events:none;opacity:0;transition:opacity .2s;z-index:400;font-family:Roboto,sans-serif;font-size:1rem}' +
'.dvnp-toast.on{opacity:1}.dvnp-toast span{display:inline-block;padding:14px 24px;border-radius:24px;background:#323232;color:#fff}';
var st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);

/* ---------- helpers ---------- */
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
  dots: '<circle cx="12" cy="5" r="1.8" fill="currentColor"/><circle cx="12" cy="12" r="1.8" fill="currentColor"/><circle cx="12" cy="19" r="1.8" fill="currentColor"/>',
  plus: '<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>',
  pen: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
  book: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5z"/><path d="M4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5"/>',
  lock: '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
  trash: '<polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/>',
  back: '<line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>'
};
var tt, toastEl = h('div', { class: 'dvnp-toast', role: 'status' });
function toast(m) { toastEl.replaceChildren(h('span', {}, m)); toastEl.classList.add('on'); clearTimeout(tt); tt = setTimeout(function () { toastEl.classList.remove('on'); }, 2200); }
var spinEl = h('div', { class: 'dvnp-scrim', hidden: '' }, h('div', { class: 'dvnp-spin', role: 'progressbar', 'aria-label': 'Working' }));
var askEl = h('div', { class: 'dvnp-scrim', hidden: '', role: 'alertdialog', 'aria-modal': 'true' });
document.body.append(toastEl, spinEl, askEl);
function ask(title, msg, yes) {
  return new Promise(function (res) {
    var end = function (v) { askEl.hidden = true; res(v); };
    askEl.replaceChildren(h('div', { class: 'dvnp-card2' }, h('h3', { style: 'margin:0 0 8px;font-size:1.15rem;font-weight:500' }, title), h('p', { style: 'margin:0 0 20px;color:var(--dvnp-tx2,#44474E)' }, msg),
      h('div', { style: 'display:flex;justify-content:flex-end;gap:8px' }, h('button', { class: 'dvnp-btn o', onclick: function () { end(false); } }, 'Cancel'),
        h('button', { class: 'dvnp-btn', style: 'background:var(--dvnp-er,#BA1A1A)!important;color:#fff!important', onclick: function () { end(true); } }, yes || 'Delete'))));
    askEl.hidden = false; buzz(25);
  });
}

/* ---------- storage: shared contract (README) ---------- */
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
function allNotes() { return openDB().then(function (d) { return new Promise(function (res, rej) { var r = d.transaction('notes').objectStore('notes').getAll(); r.onsuccess = function () { res(r.result); }; r.onerror = function () { rej(r.error); }; }); }); }
function delNote(id) {
  return openDB().then(function (d) {
    var t; try { t = d.transaction('notes', 'readwrite', { durability: 'strict' }); } catch (e) { t = d.transaction('notes', 'readwrite'); }
    t.objectStore('notes').delete(id);
    return new Promise(function (res, rej) { t.oncomplete = res; t.onerror = t.onabort = function () { rej(t.error); }; });
  });
}

/* ---------- landing page ---------- */
var notes = [], mode = 'saved';
var dots = h('button', { class: 'dvnp-ib', 'aria-label': 'Counters', 'aria-expanded': 'false' }, svg(IC.dots));
var menu = h('div', { class: 'dvnp-menu', hidden: '' });
var count = h('span', { style: 'padding:0 12px;opacity:.9' });
var chips = h('div', { class: 'dvnp-chips' }, [['saved', 'Saved'], ['recent', 'Recent'], ['locked', 'Locked']].map(function (c) {
  return h('button', { class: 'dvnp-chip', 'data-m': c[0], onclick: function () { setMode(c[0]); } }, c[1]);
}));
var list = h('div', { class: 'dvnp-list' });
var fs = h('div', { class: 'dvnp-fs', hidden: '' });
var fm = h('div', { class: 'dvnp-fm', hidden: '' },
  h('button', { class: 'dvnp-fi', onclick: function () { fabClose(); emit('dv:note:new'); } }, svg(IC.pen), 'Take Note'),
  h('button', { class: 'dvnp-fi', onclick: function () { fabClose(); openTemplates(); } }, svg(IC.book), 'Note Template'));
var fab = h('button', { class: 'dvnp-fab', 'aria-label': 'Create', 'aria-expanded': 'false' }, svg(IC.plus));
var root = h('div', { class: 'dvnp' }, h('div', { class: 'dvnp-bar' }, dots, h('h2', {}, 'Notes'), count, menu), chips, list, fs, fm, fab);
host.replaceChildren(root);

function stats() {
  var t = notes.map(function (n) { return n.text || ''; }).join('\n\n');
  return [['Word counter', (t.match(/\S+/g) || []).length], ['Character counter', t.length], ['Sentence counter', (t.match(/[^.!?\n]+[.!?]+/g) || []).length], ['Paragraph counter', t.split(/\n\s*\n/).filter(function (x) { return x.trim(); }).length]];
}
function menuClose() { menu.hidden = true; dots.setAttribute('aria-expanded', 'false'); }
dots.onclick = function () {
  buzz();
  if (!menu.hidden) { menuClose(); return; }
  menu.replaceChildren.apply(menu, stats().map(function (s) { return h('div', {}, h('span', {}, s[0]), h('b', {}, s[1].toLocaleString())); }));
  menu.hidden = false; dots.setAttribute('aria-expanded', 'true');
};
root.addEventListener('pointerdown', function (e) { if (!menu.hidden && !e.target.closest('.dvnp-menu') && !e.target.closest('.dvnp-ib')) menuClose(); });
function fabClose() { fm.hidden = true; fs.hidden = true; fab.classList.remove('on'); fab.setAttribute('aria-expanded', 'false'); }
fab.onclick = function () { buzz(15); if (fm.hidden) { fm.hidden = false; fs.hidden = false; fab.classList.add('on'); fab.setAttribute('aria-expanded', 'true'); } else fabClose(); };
fs.onclick = fabClose;

function setMode(m) { mode = m; buzz(); draw(); }
function draw() {
  Array.prototype.forEach.call(chips.children, function (b) { b.classList.toggle('on', b.getAttribute('data-m') === mode); });
  var l = notes.slice();
  if (mode === 'locked') l = l.filter(function (n) { return n.pin; }).sort(function (a, b) { return b.updated - a.updated; });
  else if (mode === 'recent') l = l.sort(function (a, b) { return b.updated - a.updated; }).slice(0, 10);
  else l = l.sort(function (a, b) { return String(a.title).localeCompare(String(b.title)); });
  count.textContent = notes.length + (notes.length === 1 ? ' note' : ' notes');
  list.replaceChildren.apply(list, l.length ? l.map(card) : [h('div', { class: 'dvnp-none' }, mode === 'locked' ? 'No locked notes yet.' : 'No notes yet. Tap the plus button to write your first note.')]);
}
function card(n) {
  return h('div', { class: 'dvnp-card' },
    h('button', { class: 'dvnp-open', onclick: function () { buzz(); emit('dv:editor:open', { id: n.id }); } },
      h('strong', {}, n.pin ? svg(IC.lock, 'dvnp-lk') : '', h('span', {}, n.title || 'Untitled')),
      h('p', {}, n.pin ? 'This note is locked.' : String(n.text || '').slice(0, 160)),
      h('small', {}, new Date(n.updated || n.created || Date.now()).toLocaleDateString())),
    h('button', { class: 'dvnp-ib dvnp-del', 'aria-label': 'Delete note', onclick: function () {
      ask('Delete note?', '"' + (n.title || 'Untitled') + '" will be deleted for good.').then(function (ok) {
        if (!ok) return;
        delNote(n.id).then(function () { toast('Note deleted'); buzz(30); emit('dv:notes:changed'); }, function () { toast('Could not delete the note'); });
      });
    } }, svg(IC.trash)));
}
var firstLoad = true;
function load() {
  if (firstLoad) spinEl.hidden = false;
  allNotes().then(function (r) { notes = r; }, function () { toast('Could not load your notes'); }).then(function () { firstLoad = false; spinEl.hidden = true; draw(); });
}
document.addEventListener('dv:notes:filter', function (e) { mode = (e.detail && e.detail.mode) || 'saved'; draw(); });
document.addEventListener('dv:notes:changed', load);
document.addEventListener('dv:tab', function (e) { if (e.detail && e.detail.name === 'editor') load(); });
load();

/* ---------- note templates: full-page modal with ten horizontal titles ---------- */
var TPL = [
  ['Meeting Notes', 'Capture decisions and next steps.', 'MEETING NOTES\nDate:\nAttendees:\n\nAgenda\n1.\n2.\n\nDiscussion\n- \n\nDecisions\n- \n\nAction items\n- Who / What / By when'],
  ['Daily Journal', 'End each day with a short reflection.', 'DAILY JOURNAL\nDate:\n\nHow I feel today:\n\nThree good things:\n1.\n2.\n3.\n\nWhat I learned:\n\nTomorrow I will:'],
  ['To-Do Plan', 'Sort your day by priority.', 'TO-DO PLAN\n\nMust do today\n- \n\nShould do\n- \n\nCan wait\n- \n\nDone\n- '],
  ['Sermon Notes', 'Follow the message and its application.', 'SERMON NOTES\nSpeaker:\nDate:\nScripture:\n\nMain points\n1.\n2.\n3.\n\nKey verse:\n\nHow I will apply it:\n\nPrayer response:'],
  ['Bible Study', 'Observe, interpret and apply.', 'BIBLE STUDY\nPassage:\n\nObservation (what does it say?)\n\nInterpretation (what does it mean?)\n\nApplication (what will I do?)\n\nPrayer:'],
  ['Prayer Journal', 'Record requests and answers.', 'PRAYER JOURNAL\nDate:\n\nThanksgiving:\n\nRequests:\n- \n\nIntercession:\n- \n\nAnswers received:\n- '],
  ['Lesson Plan', 'Plan a class from aim to review.', 'LESSON PLAN\nTopic:\nClass:\nDate:\n\nAim:\n\nMaterials:\n\nIntroduction:\n\nMain teaching:\n\nActivity:\n\nReview questions:\n1.\n2.'],
  ['Shopping List', 'Group items so nothing is missed.', 'SHOPPING LIST\n\nFood\n- \n\nHousehold\n- \n\nPersonal care\n- \n\nOther\n- '],
  ['Project Plan', 'Define goals, steps and deadlines.', 'PROJECT PLAN\nProject:\nOwner:\nDeadline:\n\nGoal:\n\nSteps\n1.\n2.\n3.\n\nResources needed:\n\nRisks:\n\nSuccess looks like:'],
  ['Study Notes', 'Summarise what you are learning.', 'STUDY NOTES\nSubject:\nTopic:\nDate:\n\nKey ideas\n- \n\nDefinitions\n- \n\nExamples\n- \n\nQuestions to review:\n- ']
];
var tab = 0, tm = null, tabsEl, tbEl;
function buildT() {
  tabsEl = h('div', { class: 'dvnp-tabs' }, TPL.map(function (t, i) { return h('button', { class: 'dvnp-tab', onclick: function () { buzz(); showT(i); } }, t[0]); }));
  tbEl = h('div', { class: 'dvnp-tb' });
  tm = h('section', { class: 'dvnp-tm', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Note Templates', hidden: '' },
    h('div', { class: 'dvnp-bar', style: 'padding-top:calc(4px + env(safe-area-inset-top));min-height:calc(64px + env(safe-area-inset-top))' },
      h('button', { class: 'dvnp-ib', 'aria-label': 'Back', onclick: function () { history.back(); } }, svg(IC.back)), h('h2', {}, 'Note Templates')), tabsEl, tbEl);
  document.body.append(tm);
}
function showT(i) {
  tab = i; var t = TPL[i];
  Array.prototype.forEach.call(tabsEl.children, function (b, k) { b.classList.toggle('on', k === i); });
  tbEl.replaceChildren(h('h3', { style: 'margin:0;font-size:1.25rem;font-weight:500' }, t[0]), h('p', { style: 'margin:4px 0 0;color:var(--dvnp-tx2)' }, t[1]), h('pre', {}, t[2]),
    h('button', { class: 'dvnp-btn', onclick: function () { useT(t); } }, 'Use this template'),
    h('button', { class: 'dvnp-btn o', onclick: function () { copyT(t); } }, 'Copy'));
  tbEl.scrollTop = 0;
  var b = tabsEl.children[i]; if (b && b.scrollIntoView) b.scrollIntoView({ inline: 'center', block: 'nearest' });
}
function copyT(t) { (navigator.clipboard ? navigator.clipboard.writeText(t[2]) : Promise.reject()).then(function () { toast('Template copied'); buzz(); }, function () { toast('Copy is not available on this browser'); }); }
function useT(t) {
  buzz(20);
  var fired = false, go = function () { if (fired) return; fired = true; window.removeEventListener('popstate', go); emit('dv:editor:open', { title: t[0], text: t[2] }); };
  window.addEventListener('popstate', go); setTimeout(go, 400); history.back();
}
function openTemplates() { if (!tm) buildT(); tm.hidden = false; showT(tab); history.pushState({ dvT: 1 }, ''); }
window.addEventListener('popstate', function () { if (tm && !tm.hidden && !(history.state && history.state.dvT)) tm.hidden = true; });
})();
