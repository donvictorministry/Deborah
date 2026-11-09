(function () {
'use strict';

/* ===== CONFIG: change names, texts and contacts here ===== */
var dvConfig = {
  appName: 'Deborah)-(Note',
  tagline: 'Write it down. Keep it safe. Share it anywhere.',
  shareText: 'Deborah)-(Note: a powerful, private notepad for your Android phone.',
  developer: {
    name: 'Joy', title: 'Reverend minister, researcher and digital technology ministry pioneer', photo: '',
    bio: 'Focused on gospel outreach, evangelism training and discipleship across multiple continents.\nBuilds web apps for ministry use, designed to work well on Android phones.'
  },
  contact: { email: '', whatsapp: '', phone: '', facebook: '' }
};

/* ===== HELPERS ===== */
function $(s) { return document.querySelector(s); }
function $$(s) { return Array.prototype.slice.call(document.querySelectorAll(s)); }
function H(t, p) {
  var e = document.createElement(t);
  for (var a in (p || {})) { if (a === 'class') e.className = p[a]; else if (a.slice(0, 2) === 'on') e.addEventListener(a.slice(2), p[a]); else e.setAttribute(a, p[a]); }
  for (var i = 2; i < arguments.length; i++) { var k = arguments[i]; if (Array.isArray(k)) e.append.apply(e, k); else if (k != null && k !== '') e.append(k); }
  return e;
}
function svg(p, c) {
  var w = H('span'); w.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + p + '</svg>';
  var e = w.firstChild; if (c) e.setAttribute('class', c); return e;
}
function emit(n, d) { document.dispatchEvent(new CustomEvent(n, { detail: d || {} })); }
function buzz(ms) { try { if (navigator.vibrate) navigator.vibrate(ms || 12); } catch (e) {} }
var IC = {
  chev: '<polyline points="9 6 15 12 9 18"/>',
  pen: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
  file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>',
  clock: '<circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15 14"/>',
  lock: '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
  info: '<circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>',
  user: '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
  help: '<circle cx="12" cy="12" r="10"/><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>',
  shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><line x1="12" y1="8" x2="12" y2="13"/><line x1="12" y1="16" x2="12.01" y2="16"/>',
  mail: '<path d="M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"/><polyline points="22,6 12,13 2,6"/>',
  moon: '<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>',
  size: '<polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/>',
  todo: '<polyline points="3 6 5 8 9 4"/><polyline points="3 13 5 15 9 11"/><line x1="12" y1="6" x2="21" y2="6"/><line x1="12" y1="13" x2="21" y2="13"/><line x1="3" y1="20" x2="21" y2="20"/>',
  install: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>',
  share: '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>',
  trash: '<polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/>',
  box: '<rect x="4" y="4" width="16" height="16" rx="4"/>',
  boxOn: '<rect x="4" y="4" width="16" height="16" rx="4" fill="currentColor"/><polyline points="8 12 11 15 16 9" style="stroke:var(--dv-op)"/>'
};

/* ===== FEEDBACK: toast, spinner, confirmation, haptics ===== */
var tT;
function toast(m) {
  var t = $('#dv-toast'); t.replaceChildren(H('span', {}, m)); t.classList.add('dv-show');
  clearTimeout(tT); tT = setTimeout(function () { t.classList.remove('dv-show'); }, 2200);
}
var busyN = 0;
function busy(on) { busyN = Math.max(0, busyN + (on ? 1 : -1)); $('#dv-busy').hidden = !busyN; }
function ask(o) {
  return new Promise(function (res) {
    var s = $('#dv-ask'), y = $('#dv-askY');
    $('#dv-askT').textContent = o.title; $('#dv-askM').textContent = o.msg || '';
    y.textContent = o.yes || 'Confirm'; y.className = 'dv-btn dv-tap' + (o.danger ? ' dv-d' : '');
    s.hidden = false; buzz(25);
    function end(v) { s.hidden = true; res(v); }
    y.onclick = function () { end(true); }; $('#dv-askN').onclick = function () { end(false); };
  });
}
document.addEventListener('pointerdown', function (e) { if (e.target.closest && e.target.closest('.dv-tap')) buzz(10); }, { passive: true });

/* ===== STORAGE: IndexedDB shared contract (see README) ===== */
var db = null;
function openDB() {
  return new Promise(function (res, rej) {
    var r = indexedDB.open('deborah-note', 1);
    r.onupgradeneeded = function () {
      var d = r.result;
      ['notes', 'todos'].forEach(function (n) { if (!d.objectStoreNames.contains(n)) d.createObjectStore(n, { keyPath: 'id' }); });
      if (!d.objectStoreNames.contains('meta')) d.createObjectStore('meta', { keyPath: 'k' });
    };
    r.onsuccess = function () { db = r.result; db.onversionchange = function () { db.close(); }; res(db); };
    r.onerror = function () { rej(r.error); };
  });
}
function rq(r) { return new Promise(function (res, rej) { r.onsuccess = function () { res(r.result); }; r.onerror = function () { rej(r.error); }; }); }
function write(name, fn) {
  var t; try { t = db.transaction(name, 'readwrite', { durability: 'strict' }); } catch (e) { t = db.transaction(name, 'readwrite'); }
  fn(t.objectStore(name));
  return new Promise(function (res, rej) { t.oncomplete = res; t.onerror = t.onabort = function () { rej(t.error); }; });
}
if (navigator.storage && navigator.storage.persist) navigator.storage.persist();

/* ===== LAYERS: every sheet and page is full screen; Android Back closes the top one ===== */
var L = [];
function openLayer(el) { el.hidden = false; L.push(el); history.pushState({ dvL: L.length }, ''); buzz(8); }
function back() { if (L.length) history.back(); }
window.addEventListener('popstate', function (e) { var n = (e.state && e.state.dvL) || 0; while (L.length > n) L.pop().hidden = true; });
$$('.dv-bk').forEach(function (b) { b.onclick = back; });

/* ===== TABS ===== */
function go(name) {
  $$('.dv-view').forEach(function (v) { v.hidden = v.id !== 'dv-view-' + name; });
  $$('.dv-nb').forEach(function (b) {
    var on = b.dataset.t === name; b.classList.toggle('dv-on', on);
    if (on) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current');
  });
  emit('dv:tab', { name: name });
}
$$('.dv-nb').forEach(function (b) { b.onclick = function () { go(b.dataset.t); }; });
document.addEventListener('dv:go', function (e) { go(e.detail.name); });

/* ===== HOME ===== */
function quick(mode) { if (mode === 'new') emit('dv:note:new'); else emit('dv:notes:filter', { mode: mode }); go('editor'); }
var QA = [['Take Note', IC.pen, 'new'], ['Saved Note', IC.file, 'saved'], ['Recent Files', IC.clock, 'recent'], ['Locked Note', IC.lock, 'locked']];
$('#dv-view-home').replaceChildren(
  H('div', { class: 'dv-hero' }, svg(IC.pen, 'dv-hi'), H('h2', {}, 'Welcome to ' + dvConfig.appName), H('p', {}, dvConfig.tagline)),
  H('h3', { class: 'dv-h dv-hd' }, 'Quick actions'),
  H('div', { class: 'dv-qa' }, QA.map(function (q) { return H('button', { class: 'dv-qb dv-tap', onclick: function () { quick(q[2]); } }, svg(q[1]), H('span', {}, q[0])); })));

/* ===== PAGES (full-page modals) ===== */
function P(t) { return H('p', { style: 'margin:8px 0' }, t); }
function T(t) { return H('h3', { class: 'dv-h' }, t); }
function LI(a, t) { return H(t || 'ul', { class: 'dv-bul' }, a.map(function (x) { return H('li', {}, x); })); }
function openPage(o) {
  $('#dv-pageT').textContent = o.t; var b = $('#dv-pageB');
  b.replaceChildren.apply(b, o.b()); b.scrollTop = 0; openLayer($('#dv-page'));
}
function developerPage() {
  var d = dvConfig.developer, teeth = '';
  var ph = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 160 160'%3E%3Crect width='160' height='160' fill='%23ccd0d5'/%3E%3Ccircle cx='80' cy='62' r='28' fill='%23fff'/%3E%3Cpath d='M24 160c0-34 25-56 56-56s56 22 56 56z' fill='%23fff'/%3E%3C/svg%3E";
  for (var i = 0; i < 16; i++) teeth += '<rect x="94" y="2" width="12" height="16" rx="2" transform="rotate(' + (i * 22.5) + ' 100 100)"/>';
  var gear = H('div', { class: 'dv-gear' });
  gear.innerHTML = '<svg viewBox="0 0 200 200" aria-hidden="true"><g fill="currentColor"><circle cx="100" cy="100" r="88" fill="none" stroke="currentColor" stroke-width="10"/>' + teeth + '</g></svg>';
  var img = H('img', { src: d.photo || ph, alt: d.name, width: '160', height: '160', onerror: function () { if (img.src !== ph) img.src = ph; } });
  gear.append(img);
  var bio = H('div', { class: 'dv-bio' }, d.bio), more = H('button', { class: 'dv-btn dv-o dv-tap' }, 'Show more');
  more.onclick = function () { var o = bio.classList.toggle('dv-open'); more.textContent = o ? 'Show less' : 'Show more'; };
  setTimeout(function () { if (bio.scrollHeight <= bio.clientHeight + 1 && !bio.classList.contains('dv-open')) more.hidden = true; }, 80);
  return [H('div', { class: 'dv-dev' }, gear, H('h3', { class: 'dv-h' }, d.name), P(d.title), bio, more)];
}
function contactPage() {
  var t = dvConfig.contact, dg = function (v) { return String(v || '').replace(/\D/g, ''); }, fb = String(t.facebook || '').trim();
  var items = [
    ['Email (Gmail)', '#EA4335', t.email ? 'mailto:' + t.email : '', '<rect x="3" y="5" width="18" height="14" rx="2" fill="none" stroke="#fff" stroke-width="2"/><polyline points="3 7 12 13 21 7" fill="none" stroke="#fff" stroke-width="2"/>'],
    ['WhatsApp', '#25D366', dg(t.whatsapp) ? 'https://wa.me/' + dg(t.whatsapp) : '', '<path d="M12 3a9 9 0 0 0-7.8 13.5L3 21l4.6-1.2A9 9 0 1 0 12 3z" fill="none" stroke="#fff" stroke-width="2"/><path d="M9 8.5c0 3 3.5 6.5 6.5 6.5l1-1.5-2-1-1 .8a5 5 0 0 1-2.3-2.3l.8-1-1-2z" fill="#fff"/>'],
    ['Phone', '#5F6368', t.phone ? 'tel:' + t.phone : '', '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z" fill="#fff"/>'],
    ['Facebook', '#1877F2', fb ? (/^https?:/i.test(fb) ? fb : 'https://facebook.com/' + fb) : '', '<path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" fill="#fff"/>']
  ];
  return [T('Contact Us'), P('Tap an icon to reach the developer.'), H('div', { class: 'dv-socs' }, items.map(function (it) {
    var el = it[2] ? H('a', { class: 'dv-soc dv-tap', href: it[2], target: '_blank', rel: 'noopener', 'aria-label': it[0] })
      : H('button', { class: 'dv-soc dv-tap', type: 'button', 'aria-label': it[0], onclick: function () { toast(it[0] + ' is not available yet.'); } });
    el.style.background = it[1]; el.innerHTML = '<svg viewBox="0 0 24 24" width="34" height="34" aria-hidden="true">' + it[3] + '</svg>'; return el;
  }))];
}
function todoPage() {
  var box = H('div'), items = [], list = H('div'), inp = H('input', { class: 'dv-in', placeholder: 'Add a task', maxlength: '200', 'aria-label': 'New task' });
  function draw() {
    items.sort(function (a, b) { return a.created - b.created; });
    list.replaceChildren(items.length ? items.map(function (t) {
      return H('div', { class: 'dv-todo' },
        H('button', { class: 'dv-ib dv-tap dv-ck' + (t.done ? ' dv-on' : ''), 'aria-label': 'Mark done', onclick: function () { t.done = !t.done; save(t); } }, svg(t.done ? IC.boxOn : IC.box)),
        H('span', { class: t.done ? 'dv-dn' : '' }, t.text),
        H('button', { class: 'dv-ib dv-tap', 'aria-label': 'Delete task', onclick: function () { remove(t); } }, svg(IC.trash)));
    }) : [H('p', { class: 'dv-none' }, 'Nothing to do yet. Add your first task.')]);
  }
  function save(t) { write('todos', function (s) { s.put(t); }).then(draw, function () { toast('Could not save the task'); }); }
  function remove(t) {
    ask({ title: 'Delete task?', msg: 'This task will be removed for good.', yes: 'Delete', danger: true }).then(function (ok) {
      if (!ok) return;
      write('todos', function (s) { s.delete(t.id); }).then(function () { items = items.filter(function (x) { return x.id !== t.id; }); draw(); toast('Task deleted'); buzz(30); }, function () { toast('Could not delete the task'); });
    });
  }
  function add() {
    var v = inp.value.trim(); if (!v) { toast('Type a task first'); return; }
    var t = { id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), text: v, done: false, created: Date.now() };
    items.push(t); inp.value = ''; save(t); toast('Task added');
  }
  function clearDone() {
    var d = items.filter(function (t) { return t.done; }); if (!d.length) { toast('No finished tasks'); return; }
    ask({ title: 'Clear finished tasks?', msg: d.length + ' finished task(s) will be deleted.', yes: 'Clear', danger: true }).then(function (ok) {
      if (!ok) return;
      write('todos', function (s) { d.forEach(function (t) { s.delete(t.id); }); }).then(function () { items = items.filter(function (t) { return !t.done; }); draw(); toast('Cleared'); }, function () { toast('Could not clear'); });
    });
  }
  inp.addEventListener('keydown', function (e) { if (e.key === 'Enter') add(); });
  box.append(H('div', { class: 'dv-add' }, inp, H('button', { class: 'dv-btn dv-tap', onclick: add }, 'Add')), list, H('button', { class: 'dv-btn dv-o dv-tap', style: 'margin-top:16px', onclick: clearDone }, 'Clear finished'));
  busy(true);
  (db ? Promise.resolve() : openDB()).then(function () { return rq(db.transaction('todos').objectStore('todos').getAll()); })
    .then(function (r) { items = r; }, function () { toast('Could not load your list'); }).then(function () { busy(false); draw(); });
  return [box];
}
var PAGES = {
  about: { t: 'About the App', i: IC.info, b: function () { return [T(dvConfig.appName), P('A powerful, private notepad built for Android phones. Write, lock, organise and share your notes from anywhere.'), T('What you get'), LI(['Notes saved on your phone and kept safe.', 'A link for every note so you can share it.', 'Templates, a calculator, a calendar and a to-do list.', 'Light and dark modes with adjustable text size.'])]; } },
  dev: { t: 'About Developer', i: IC.user, b: developerPage },
  how: { t: 'How To Use', i: IC.help, b: function () { return [T('Getting started'), LI(['Open the Editor tab and tap the plus button to start a note.', 'Your saved notes appear above the toolbar. Tap one to open it.', 'Use More for the calculator, calendar and text-to-image tools.', 'Open Options (top right) for dark mode, text size, your to-do list, install and share.'], 'ol')]; } },
  warn: { t: 'Proprietary Software Warning', i: IC.shield, b: function () { var o = dvConfig.developer.name; return [T('Proprietary Software Warning'), P('This application, its design, its code and its name belong to ' + o + '. Copyright ' + new Date().getFullYear() + '. All rights reserved.'), P('You may not copy, clone, modify, resell, redistribute, decompile or reverse engineer this application without written permission.'), P('Unauthorised copying or distribution may lead to legal action. To ask for permission, open Contact Us.')]; } },
  contact: { t: 'Contact Us', i: IC.mail, b: contactPage },
  todo: { t: 'To-Do List', i: IC.todo, b: todoPage }
};
function row(icon, label, fn, chev) { return H('button', { class: 'dv-row dv-tap', onclick: fn }, svg(icon), H('span', {}, label), chev ? svg(IC.chev, 'dv-chev') : ''); }

/* ===== LEFT SIDEBAR ===== */
$('#dv-leftB').replaceChildren(['about', 'dev', 'how', 'warn', 'contact'].map(function (k) { return row(PAGES[k].i, PAGES[k].t, function () { openPage(PAGES[k]); }, true); }));
$('#dv-menuL').onclick = function () { openLayer($('#dv-left')); };

/* ===== RIGHT SIDEBAR ===== */
function setTheme(t) {
  document.documentElement.dataset.theme = t; try { localStorage.setItem('dvn.theme', t); } catch (e) {}
  $('meta[name=theme-color]').content = t === 'dark' ? '#000000' : '#1877F2';
}
var dark = document.documentElement.dataset.theme === 'dark';
var dm = H('button', { class: 'dv-row dv-tap', role: 'switch', 'aria-checked': String(dark), onclick: function () { dark = !dark; dm.setAttribute('aria-checked', String(dark)); setTheme(dark ? 'dark' : 'light'); } }, svg(IC.moon), H('span', {}, 'Dark mode'), H('span', { class: 'dv-sw' }));
var fsv = parseInt(localStorage.getItem('dvn.fs') || 19, 10), fsl = H('b', {}, fsv + 'px');
var fs = H('input', { type: 'range', min: '19', max: '22', step: '1', value: String(fsv), 'aria-label': 'Font size' });
fs.oninput = function () { fsl.textContent = fs.value + 'px'; document.documentElement.style.setProperty('--dv-fs', fs.value + 'px'); try { localStorage.setItem('dvn.fs', fs.value); } catch (e) {} };
var inst = null;
window.addEventListener('beforeinstallprompt', function (e) { e.preventDefault(); inst = e; });
window.addEventListener('appinstalled', function () { inst = null; toast('App installed'); });
function install() {
  if (matchMedia('(display-mode: standalone)').matches) { toast('The app is already installed.'); return; }
  if (inst) { inst.prompt(); inst.userChoice.then(function () { inst = null; }); return; }
  toast('Open the browser menu and tap Install app or Add to Home screen.');
}
function shareApp() {
  var d = { title: dvConfig.appName, text: dvConfig.shareText, url: location.href.split(/[?#]/)[0] };
  (navigator.share ? navigator.share(d) : Promise.reject()).catch(function (e) {
    if (e && e.name === 'AbortError') return;
    (navigator.clipboard ? navigator.clipboard.writeText(d.url) : Promise.reject()).then(function () { toast('Link copied. Paste it to share.'); }, function () { toast('Copy this link: ' + d.url); });
  });
}
$('#dv-rightB').replaceChildren(dm, H('div', { class: 'dv-row dv-col' }, H('div', { class: 'dv-line' }, svg(IC.size), H('span', {}, 'Font size'), fsl), fs),
  row(IC.todo, 'To-Do List', function () { openPage(PAGES.todo); }, true), row(IC.install, 'Install App', install), row(IC.share, 'Share App', shareApp));
$('#dv-menuR').onclick = function () { openLayer($('#dv-right')); };

/* ===== START ===== */
document.title = dvConfig.appName; $('#dv-title').textContent = dvConfig.appName;
openDB().catch(function () { toast('Storage is not available on this browser'); });
if ('serviceWorker' in navigator) window.addEventListener('load', function () { navigator.serviceWorker.register('sw.js').catch(function () {}); });
})();
