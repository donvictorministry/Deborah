/* DV shell shim: lets the notepad below run as a self-contained widget when no host shell (window.DV) exists.
   It only activates on Android when no host shell exists, adds a Note tile to the
   home grid, and provides route, toast and navigation helpers. The notepad code below is unchanged. */
(function () {
  try {
    if (window.DV || !/Android/i.test(navigator.userAgent)) return;
    var grid = document.querySelector('.feature-grid');
    if (!grid) return;
    var routes = {}, active = null, tt = 0;
    var st = document.createElement('style');
    st.textContent =
      ':root{--dv-primary:var(--primary,#1877F2);--dv-surface:var(--bg-color,#fff);--dv-bg:var(--surface-color,#F8F9FA);--dv-text:var(--text-color,#121212);--dv-text-sub:#5F6368;--dv-border:var(--outline-color,#E0E0E0);--dv-shadow:0 2px 8px rgba(0,0,0,.12);--dv-shadow-lg:0 12px 40px rgba(0,0,0,.3)}' +
      'body[data-theme=dark]{--dv-text-sub:#B0B0B0}' +
      '.dv-np *,.dv-np-dlg *{color:inherit;font-size:inherit}' +
      '.dv-icon-btn{width:48px;height:48px;border:0;border-radius:50%;background:transparent;display:flex;align-items:center;justify-content:center;cursor:pointer;flex-shrink:0}.dv-icon-btn:active{background:rgba(255,255,255,.2)}' +
      '.dvx-tile{background:var(--surface-color,#F8F9FA);border:1px solid var(--outline-color,#E0E0E0);border-radius:20px;padding:16px 12px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;text-align:center;cursor:pointer;min-height:110px;color:var(--text-color,#121212);font:600 19px Roboto,sans-serif}' +
      '.dvx-tile:active{background:var(--primary-ripple,rgba(24,119,242,.2));border-color:var(--primary,#1877F2)}.dvx-tile svg{width:32px;height:32px;color:var(--primary,#1877F2)}' +
      '.dvx-toast{position:fixed;left:20px;right:20px;top:50%;transform:translateY(-50%);z-index:20000;text-align:center;pointer-events:none;opacity:0;transition:opacity .2s}.dvx-toast.on{opacity:1}' +
      '.dvx-toast span{display:inline-block;background:#121212;color:#fff;padding:14px 22px;border-radius:16px;font:600 19px Roboto,sans-serif;box-shadow:0 8px 24px rgba(0,0,0,.35)}';
    document.head.appendChild(st);
    var toastEl = document.createElement('div');
    toastEl.className = 'dvx-toast'; toastEl.setAttribute('role', 'status'); toastEl.setAttribute('aria-live', 'polite');
    document.body.appendChild(toastEl);
    window.addEventListener('popstate', function () {
      if (active) { var r = routes[active]; active = null; if (r && r.close) r.close(); }
    });
    window.DV = {
      toast: function (m) {
        toastEl.innerHTML = '<span></span>'; toastEl.firstChild.textContent = m;
        toastEl.classList.add('on'); clearTimeout(tt); tt = setTimeout(function () { toastEl.classList.remove('on'); }, 1800);
      },
      route: function (name, cfg) { routes[name] = cfg; },
      openRoute: function (name) {
        var r = routes[name]; if (!r || active) return;
        active = name; r.open(); history.pushState({ dvx: name }, '');
      },
      closeRoute: function () { if (active) history.back(); },
      addNavItem: function (o) {
        var b = document.createElement('button');
        b.id = o.id; b.className = 'dvx-tile'; b.innerHTML = o.html;
        b.onclick = function () { window.DV.openRoute(o.key); };
        grid.appendChild(b);
      },
      addQuickAction: function () {}
    };
  } catch (e) {}
})();

/* =====================================================================
   NOTE LINKS MODULE - every note gets its own clean URL automatically:
       <app folder>/note/<title>-<id>
   A shared link adds the note itself after the # so anyone who opens it can
   READ it (read-only reader, no editing, nothing written to their notepad).
   Clean URLs on GitHub Pages work through 404.html (it forwards /note/...
   to the app, and this module restores the clean address).
   Independent of the notepad module and of the shell.
   ===================================================================== */
(function () {
  try {
    var loc = window.location;
    var cut = loc.pathname.indexOf('/note/');
    var dir = cut > -1 ? loc.pathname.slice(0, cut + 1) : loc.pathname.replace(/[^\/]*$/, '');
    var base = loc.origin + dir;
    if (/^\?\/note\//.test(loc.search)) history.replaceState(null, '', dir + loc.search.slice(2).split('&')[0] + loc.hash);

    function noteURL(n) {
      var s = String(n.title || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40).replace(/-+$/, '');
      return base + 'note/' + (s ? s + '-' : '') + n.id;
    }
    function parse() {
      var m = loc.pathname.match(/\/note\/([^\/]+)\/?$/);
      if (!m) return null;
      var seg; try { seg = decodeURIComponent(m[1]); } catch (e) { seg = m[1]; }
      var h = loc.hash.match(/^#n=([cp][A-Za-z0-9_-]+)$/);
      return { id: seg.split('-').pop(), data: h ? h[1] : null };
    }
    function toB64u(u8) {
      var s = '', i;
      for (i = 0; i < u8.length; i += 8192) s += String.fromCharCode.apply(null, u8.subarray(i, i + 8192));
      return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    }
    function fromB64u(t) {
      t = t.replace(/-/g, '+').replace(/_/g, '/');
      while (t.length % 4) t += '=';
      var s = atob(t), u = new Uint8Array(s.length), i;
      for (i = 0; i < s.length; i++) u[i] = s.charCodeAt(i);
      return u;
    }
    function pipe(stream, u8) {
      return new Response(new Blob([u8]).stream().pipeThrough(stream)).arrayBuffer().then(function (b) { return new Uint8Array(b); });
    }
    function encode(n) {
      var u8 = new TextEncoder().encode(JSON.stringify({ t: n.title, x: n.text, u: n.updated }));
      if (window.CompressionStream) return pipe(new CompressionStream('deflate-raw'), u8).then(function (c) { return 'c' + toB64u(c); });
      return Promise.resolve('p' + toB64u(u8));
    }
    function decode(p) {
      var u8 = fromB64u(p.slice(1));
      var get = p.charAt(0) === 'c' ? (window.DecompressionStream ? pipe(new DecompressionStream('deflate-raw'), u8) : Promise.reject(new Error('unsupported'))) : Promise.resolve(u8);
      return get.then(function (b) { return JSON.parse(new TextDecoder().decode(b)); });
    }
    function link(n) { return encode(n).then(function (p) { return noteURL(n) + '#n=' + p; }); }

    /* ----- read-only reader ----- */
    var st = document.createElement('style');
    st.textContent =
      '.dvr{position:fixed;inset:0;z-index:10003;background:var(--dv-surface,#fff);color:var(--dv-text,#121212);display:none;flex-direction:column;font-family:Roboto,sans-serif}' +
      '.dvr.on{display:flex}' +
      '.dvr-bar{background:var(--dv-primary,#1877F2);color:#fff;display:flex;align-items:center;gap:12px;padding:10px 12px;font-size:1.15rem;font-weight:700;flex-shrink:0}' +
      '.dvr-bar button{width:48px;height:48px;border:0;border-radius:50%;background:transparent;color:#fff;display:flex;align-items:center;justify-content:center;cursor:pointer;flex-shrink:0}' +
      '.dvr-bar span{flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}' +
      '.dvr-bar small{font-size:1rem;font-weight:500;white-space:nowrap}' +
      '.dvr-body{flex:1;overflow-y:auto;padding:18px 16px;font-size:23px;line-height:1.6;white-space:pre-wrap;word-break:break-word;-webkit-user-select:text;user-select:text}' +
      '.dvr-foot{display:flex;gap:10px;padding:12px;border-top:1px solid var(--dv-border,#E0E0E0);flex-shrink:0}' +
      '.dvr-foot button{flex:1;padding:14px;border:0;border-radius:12px;font-size:1.05rem;font-weight:700;font-family:inherit;color:#fff;background:#1877F2;cursor:pointer}' +
      '.dvr-foot button[hidden]{display:none}' +
      '.dvr-foot .dvr-g{background:#16A34A}' +
      '.dvr-toast{position:fixed;left:20px;right:20px;top:50%;transform:translateY(-50%);z-index:20001;text-align:center;pointer-events:none}' +
      '.dvr-toast span{display:inline-block;background:#121212;color:#fff;padding:14px 22px;border-radius:16px;font:600 19px Roboto,sans-serif}';
    document.head.appendChild(st);
    var el = document.createElement('div');
    el.className = 'dvr';
    el.innerHTML =
      '<div class="dvr-bar"><button id="dvrBack" aria-label="Back"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg></button><span id="dvrTitle"></span><small>Read only</small></div>' +
      '<div class="dvr-body" id="dvrBody"></div>' +
      '<div class="dvr-foot"><button id="dvrCopy">Copy text</button><button id="dvrOpen" class="dvr-g" hidden>Open my note</button></div>';
    document.body.appendChild(el);
    function Rq(s) { return el.querySelector(s); }
    var on = false, pend = null, curNote = null, curId = '', tt = 0;
    function toast(m) {
      if (window.DV && DV.toast) { DV.toast(m); return; }
      var t = document.querySelector('.dvr-toast');
      if (!t) { t = document.createElement('div'); t.className = 'dvr-toast'; document.body.appendChild(t); }
      t.innerHTML = '<span></span>'; t.firstChild.textContent = m; t.style.display = 'block';
      clearTimeout(tt); tt = setTimeout(function () { t.style.display = 'none'; }, 1800);
    }
    function show(note, id, msg) {
      curNote = note; curId = id || '';
      Rq('#dvrTitle').textContent = note ? note.title : 'Note not available';
      Rq('#dvrBody').textContent = note ? note.text : (msg || 'This note is not available.');
      Rq('#dvrCopy').hidden = !note;
      Rq('#dvrOpen').hidden = !(note && window.DVNP_HAS && window.DVNP_HAS(curId));
      el.classList.add('on');
      if (!on) { on = true; history.pushState({ dvnpR: 1 }, ''); }
    }
    function close(then) {
      if (!on) { if (then) then(); return; }
      pend = then || null;
      history.back();
    }
    window.addEventListener('popstate', function (e) {
      if (!on) return;
      e.stopImmediatePropagation();
      on = false; el.classList.remove('on');
      history.replaceState(null, '', dir);
      var p = pend; pend = null;
      if (p) p();
    }, true);
    Rq('#dvrBack').addEventListener('click', function () { close(); });
    Rq('#dvrCopy').addEventListener('click', function () {
      if (!curNote) return;
      var v = curNote.title + '\n\n' + curNote.text;
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(v).then(function () { toast('Note copied'); }).catch(function () { toast('Copy failed'); });
      else toast('Copy is not available');
    });
    Rq('#dvrOpen').addEventListener('click', function () {
      var id = curId;
      close(function () { if (window.DVNP_OPEN) window.DVNP_OPEN(id); });
    });

    window.DVNP_URL = { dir: dir, base: base, noteURL: noteURL, parse: parse, link: link, show: show, close: close };
    setTimeout(function () {
      var r = parse();
      if (!r) return;
      if (r.data) {
        decode(r.data).then(function (o) { show({ title: String(o.t || 'Note'), text: String(o.x || '') }, r.id); })
          .catch(function () { show(null, r.id, 'This link is damaged or incomplete. Ask the sender to share the note link again.'); });
      } else if (!window.DV) {
        show(null, r.id, 'This note is only on the device where it was written. Ask the sender for the share link.');
      }
    }, 0);
  } catch (e) {}
})();

/* =====================================================================
   NOTEPAD MODULE - full-page notepad opened from the right menu (Note).
   Independent module: delete this file (and its script tag) and the app
   keeps working (the Note item simply disappears). Talks to the
   shell only via DV. Owns its own styles, markup, storage and route.
   Never uses browser alert / confirm / prompt.

   Screens (each one returns to where it was opened):
     Notes landing page  ->  Editor page  ->  Note actions page  ->  dialogs
     Notes landing page  ->  three-dot dropdown  ->  dialogs
   Android Back closes only the top screen / modal, never jumps to Home.
   No auto-save: a note is saved only with SAVE and a title.
   ===================================================================== */
(function() {
  try {
    if (!window.DV) return;
    var U = window.DVNP_URL;
    if (!U) return;

    var KEY = 'prayer_notes';
    var notes = [], curId = null, actId = null, dropId = null;
    var hist = [''], hi = 0, histTimer = null;
    var homeQ = '', homeGrid = false, homeRecent = false, homeSearchOn = false;
    var dlgOn = false, editorForce = false;

    function Q(s) { return document.querySelector(s); }
    function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
    function toast(m) { DV.toast(m); }
    function loadNotes() { try { notes = JSON.parse(localStorage.getItem(KEY) || '[]') || []; } catch (e) { notes = []; } }
    function saveNotes() { try { localStorage.setItem(KEY, JSON.stringify(notes)); } catch (e) { toast('Storage is full'); } }
    function findNote(id) { for (var i = 0; i < notes.length; i++) { if (notes[i].id === id) return notes[i]; } return null; }

    /* ===== LAYERS (Android Back closes only the top screen or modal) ===== */
    var layers = [], pending = null, closing = false;
    function pushLayer(l, url) {
      l.url = url || null; layers.push(l);
      if (url) history.pushState({ dvnpL: 1 }, '', url); else history.pushState({ dvnpL: 1 }, '');
    }
    function closeTop(then) {
      if (!layers.length) { if (then) then(); return; }
      if (closing) return;
      closing = true; pending = then || null;
      history.back();
    }
    window.addEventListener('popstate', function(e) {
      if (!layers.length) return;
      e.stopImmediatePropagation();
      closing = false;
      var top = layers[layers.length - 1];
      if (top.blocked && top.blocked()) {
        pending = null;
        if (top.url) history.pushState({ dvnpL: 1 }, '', top.url); else history.pushState({ dvnpL: 1 }, '');
        top.onBlock();
        return;
      }
      layers.pop();
      top.close();
      var p = pending; pending = null;
      if (p) p();
    }, true);

    /* ===== ICONS ===== */
    var ic = {
      back: '<line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>',
      plus: '<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>',
      redo: '<path d="M21 7v6h-6"/><path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3L21 13"/>',
      undo: '<path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"/>',
      paste: '<path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/>',
      copy: '<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
      exit: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>',
      save: '<path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>',
      open: '<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>',
      rename: '<path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>',
      lock: '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
      del: '<polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>',
      share: '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>',
      eye: '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>',
      eyeoff: '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>',
      imp: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>',
      note: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>',
      dots: '<circle cx="12" cy="5" r="1.6" fill="currentColor"/><circle cx="12" cy="12" r="1.6" fill="currentColor"/><circle cx="12" cy="19" r="1.6" fill="currentColor"/>',
      search: '<circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>',
      grid: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
      list: '<line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>',
      clock: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
      home: '<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>'
    };
    function svg(p, s) { s = s || 22; return '<svg width="' + s + '" height="' + s + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + p + '</svg>'; }

    /* ===== STYLES ===== */
    var css = '' +
      '.dv-np{position:fixed;inset:0;z-index:9999;background:var(--dv-surface);display:none;flex-direction:column;font-family:Roboto,sans-serif;color:var(--dv-text)}' +
      '.dv-np.dv-np-on{display:flex}' +
      '#dvNpHome{z-index:9998}' +
      '#dvNpActions{z-index:10000}' +
      '.dv-np-bar{background:var(--dv-primary);color:#fff;display:flex;align-items:center;gap:12px;padding:10px 12px;font-size:1.15rem;font-weight:700;flex-shrink:0}' +
      '.dv-np-bar .dv-icon-btn{color:#fff}' +
      '.dv-np-bar span{flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}' +
      '.dv-np-bar small{font-size:1rem;font-weight:500;white-space:nowrap}' +
      '.dv-np-pills{display:flex;gap:8px;overflow-x:auto;overflow-y:hidden;padding:10px 12px;border-bottom:1px solid var(--dv-border);scrollbar-width:none;flex-shrink:0;align-items:center}' +
      '.dv-np-pills::-webkit-scrollbar,.dv-np-tools::-webkit-scrollbar,.dv-np-chips::-webkit-scrollbar{display:none}' +
      '.dv-np-pill{flex:none;max-width:70vw;display:flex;align-items:center;gap:6px;overflow:hidden;white-space:nowrap;padding:8px 16px;border-radius:999px;border:2px solid var(--dv-primary);background:var(--dv-bg);color:var(--dv-primary);font-size:1rem;font-weight:700;font-family:inherit;cursor:pointer}' +
      '.dv-np-pill.dv-np-cur{background:var(--dv-primary);color:#fff}' +
      '.dv-np-pill b{overflow:hidden;text-overflow:ellipsis;font-weight:700}' +
      '.dv-np-none{font-size:1rem;color:var(--dv-text-sub);white-space:nowrap}' +
      '.dv-np-tools{display:flex;gap:4px;overflow-x:auto;overflow-y:hidden;padding:8px 8px;border-bottom:3px solid var(--dv-border);scrollbar-width:none;flex-shrink:0;background:var(--dv-surface)}' +
      '.dv-np-tool{flex:none;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;min-width:84px;padding:8px 12px;border:none;border-radius:12px;background:transparent;color:var(--dv-text);font-size:1rem;font-weight:500;font-family:inherit;cursor:pointer;white-space:nowrap}' +
      '.dv-np-tool svg{color:var(--dv-primary)}' +
      '.dv-np-tool:active{background:var(--dv-bg)}' +
      '.dv-np-savebtn{flex:none;display:flex;align-items:center;gap:10px;padding:10px 22px;border:none;border-radius:999px;background:#FFD700;color:#FF0000;font-size:1.2rem;font-weight:800;font-family:inherit;cursor:pointer}' +
      '.dv-np-savebtn:active{opacity:0.8}' +
      '.dv-np-scroll{flex:1;overflow-y:auto;overflow-x:hidden;display:flex;flex-direction:column}' +
      '.dv-np-editor{flex:1 0 auto;min-height:60dvh;overflow:hidden;width:100%;border:none;outline:none;resize:none;padding:16px;background:var(--dv-surface);color:var(--dv-text);font-size:23px;line-height:1.6;font-family:Roboto,sans-serif}' +
      '.dv-np-list{flex:1;overflow-y:auto;display:flex;flex-direction:column}' +
      '.dv-np-row{display:flex;align-items:center;gap:16px;width:100%;padding:20px 18px;border:none;border-bottom:1px solid var(--dv-border);background:var(--dv-surface);color:var(--dv-text);font-size:1.2rem;font-weight:700;font-family:inherit;cursor:pointer;text-align:left}' +
      '.dv-np-row:active{background:var(--dv-bg)}' +
      '.dv-np-row svg{color:var(--dv-primary);flex-shrink:0}' +
      '.dv-np-row.dv-np-danger,.dv-np-row.dv-np-danger svg{color:#DC2626}' +
      '.dv-np-row small{margin-left:auto;font-size:1rem;color:var(--dv-text-sub);font-weight:600}' +
      '.dv-np-menu{margin:8px 18px 18px;border:2px solid var(--dv-border);border-radius:14px;overflow:hidden;background:var(--dv-surface);box-shadow:var(--dv-shadow)}' +
      '.dv-np-menu[hidden]{display:none}' +
      '.dv-np-mi{display:flex;align-items:center;gap:14px;width:100%;padding:16px 18px;border:none;border-bottom:1px solid var(--dv-border);background:transparent;color:var(--dv-text);font-size:1.1rem;font-weight:600;font-family:inherit;cursor:pointer;text-align:left}' +
      '.dv-np-mi:last-child{border-bottom:none}' +
      '.dv-np-mi svg{color:var(--dv-primary)}' +
      '.dv-np-dlg{position:fixed;inset:0;z-index:10001;background:rgba(0,0,0,0.6);display:none;align-items:center;justify-content:center;padding:20px;font-family:Roboto,sans-serif}' +
      '.dv-np-dlg.dv-np-on{display:flex}' +
      '.dv-np-card{width:100%;background:var(--dv-surface);color:var(--dv-text);border-radius:16px;padding:22px;box-shadow:var(--dv-shadow-lg)}' +
      '.dv-np-ct{font-size:1.3rem;font-weight:800;margin-bottom:10px}' +
      '.dv-np-cm{font-size:1.05rem;color:var(--dv-text-sub);line-height:1.5;margin-bottom:14px}' +
      '.dv-np-iw{position:relative;margin-bottom:16px}' +
      '.dv-np-input{width:100%;padding:13px 14px;font-size:1.1rem;font-family:inherit;border:2px solid var(--dv-border);border-radius:12px;background:var(--dv-bg);color:var(--dv-text);outline:none}' +
      '.dv-np-input:focus{border-color:var(--dv-primary)}' +
      '.dv-np-iw.dv-np-pinw .dv-np-input{padding-right:54px;letter-spacing:6px}' +
      '.dv-np-eye{position:absolute;right:4px;top:50%;transform:translateY(-50%);width:46px;height:46px;border:none;background:transparent;color:var(--dv-text-sub);display:flex;align-items:center;justify-content:center;cursor:pointer}' +
      '.dv-np-bs{display:flex;gap:10px;flex-wrap:wrap}' +
      '.dv-np-b{flex:1;min-width:110px;padding:14px;border:2px solid transparent;border-radius:12px;font-size:1.05rem;font-weight:700;font-family:inherit;color:#fff;cursor:pointer}' +
      '.dv-np-b:active{opacity:0.8}' +
      '.dv-np-blue{background:#1877F2}.dv-np-red{background:#DC2626}.dv-np-green{background:#16A34A}' +
      '.dv-np-black{background:#000;border-color:var(--dv-border)}' +
      /* landing page */
      '.dv-np-chips{display:flex;gap:10px;overflow-x:auto;overflow-y:hidden;padding:12px;scrollbar-width:none;flex-shrink:0}' +
      '.dv-np-chip{flex:none;display:flex;align-items:center;gap:8px;padding:10px 18px;border-radius:12px;border:1.5px solid var(--dv-border);background:var(--dv-surface);color:var(--dv-text);font-size:1.05rem;font-weight:600;font-family:inherit;cursor:pointer}' +
      '.dv-np-chip svg{color:var(--dv-primary)}' +
      '.dv-np-chip.dv-np-chon{background:var(--dv-primary);border-color:var(--dv-primary);color:#fff}' +
      '.dv-np-chip.dv-np-chon svg{color:#fff}' +
      '.dv-np-sw{padding:0 12px 10px;flex-shrink:0}' +
      '.dv-np-sw[hidden]{display:none}' +
      '.dv-np-cards{flex:1;overflow-y:auto;padding:4px 12px 120px;display:flex;flex-direction:column;gap:12px}' +
      '.dv-np-cards.dv-np-grid{display:grid;grid-template-columns:1fr 1fr;align-content:start;gap:12px}' +
      '.dv-np-nc{position:relative;display:flex;align-items:flex-start;gap:6px;background:var(--dv-bg);border-radius:20px;padding:16px 8px 16px 18px;box-shadow:var(--dv-shadow);cursor:pointer;min-width:0}' +
      '.dv-np-nc:active{opacity:0.85}' +
      '.dv-np-ncb{flex:1;min-width:0}' +
      '.dv-np-nct{display:flex;align-items:center;gap:6px;font-size:1.15rem;font-weight:800;color:var(--dv-text)}' +
      '.dv-np-nct b{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-weight:800}' +
      '.dv-np-nct svg{color:var(--dv-primary);flex-shrink:0}' +
      '.dv-np-ncp{margin:6px 0 8px;font-size:1rem;line-height:1.45;color:var(--dv-text-sub);display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;word-break:break-word}' +
      '.dv-np-ncd{font-size:0.9rem;color:var(--dv-text-sub)}' +
      '.dv-np-dots{flex:none;width:44px;height:44px;border:none;border-radius:50%;background:transparent;color:var(--dv-text);display:flex;align-items:center;justify-content:center;cursor:pointer}' +
      '.dv-np-dots:active{background:var(--dv-border)}' +
      '.dv-np-empty{padding:40px 20px;text-align:center;font-size:1.1rem;color:var(--dv-text-sub);line-height:1.5}' +
      '.dv-np-fab{position:absolute;right:20px;bottom:24px;width:72px;height:72px;border:none;border-radius:22px;background:var(--dv-primary);color:#fff;display:flex;align-items:center;justify-content:center;box-shadow:0 6px 18px rgba(0,0,0,.3);cursor:pointer}' +
      '.dv-np-fab:active{opacity:0.85}' +
      /* dropdown (note actions + counters) */
      '.dv-np-drop{position:fixed;inset:0;z-index:10002;display:none;font-family:Roboto,sans-serif}' +
      '.dv-np-drop.dv-np-on{display:block}' +
      '.dv-np-dmenu{position:fixed;min-width:230px;max-width:calc(100vw - 16px);max-height:calc(100dvh - 16px);overflow-y:auto;background:var(--dv-surface);border:1px solid var(--dv-border);border-radius:16px;box-shadow:var(--dv-shadow-lg)}' +
      '.dv-np-dmenu .dv-np-di{display:flex;align-items:center;gap:14px;width:100%;padding:15px 18px;border:none;border-bottom:1px solid var(--dv-border);background:transparent;color:var(--dv-text);font-size:1.1rem;font-weight:600;font-family:inherit;cursor:pointer;text-align:left}' +
      '.dv-np-dmenu .dv-np-di:active{background:var(--dv-bg)}' +
      '.dv-np-dmenu .dv-np-di svg{color:var(--dv-primary);flex-shrink:0}' +
      '.dv-np-dmenu .dv-np-di small{margin-left:auto;font-size:1rem;color:var(--dv-text-sub);font-weight:600}' +
      '.dv-np-dmenu .dv-np-di.dv-np-danger,.dv-np-dmenu .dv-np-di.dv-np-danger svg{color:#DC2626}' +
      '.dv-np-dsub{background:var(--dv-bg)}' +
      '.dv-np-dsub[hidden]{display:none}' +
      '.dv-np-dsub .dv-np-di{padding-left:34px}' +
      '.dv-np-dmenu .dv-np-cr{display:flex;align-items:center;justify-content:space-between;gap:24px;padding:16px 20px;border-bottom:1px solid var(--dv-border);color:var(--dv-text);font-size:1.1rem;font-weight:500}' +
      '.dv-np-dmenu .dv-np-cr:last-child,.dv-np-dmenu .dv-np-di:last-child{border-bottom:none}' +
      '.dv-np-dmenu .dv-np-cr b{color:var(--dv-primary);font-weight:800}';
    var st = document.createElement('style');
    st.textContent = css;
    document.head.appendChild(st);

    /* ===== MARKUP ===== */
    var tools = [
      ['new', 'plus', '+ New Note'], ['redo', 'redo', 'Redo'], ['undo', 'undo', 'Undo'], ['paste', 'paste', 'Paste'],
      ['copy', 'copy', 'Copy'], ['import', 'imp', 'Import'], ['export', 'save', 'Export'], ['exit', 'exit', 'Exit']
    ];
    var toolsHTML = tools.map(function(t) {
      return '<button class="dv-np-tool" data-dvnp="' + t[0] + '">' + svg(ic[t[1]], 30) + '<span>' + t[2] + '</span></button>';
    }).join('');
    var rows = [['open', 'open', 'Open'], ['rename', 'rename', 'Rename'], ['pin', 'lock', 'PIN'], ['delete', 'del', 'Delete'], ['share', 'share', 'Share'], ['home', 'home', 'Add to home screen']];
    var menu = [['wa', 'share', 'WhatsApp'], ['bt', 'share', 'Bluetooth'], ['lk', 'share', 'Note link'], ['imp', 'save', 'Export to device'], ['x', 'exit', 'Exit']];
    var menuHTML = menu.map(function(m) { return '<button class="dv-np-mi" data-dvsh="' + m[0] + '">' + svg(ic[m[1]], 22) + m[2] + '</button>'; }).join('');
    var rowsHTML = rows.map(function(r) {
      var h = '<button class="dv-np-row' + (r[0] === 'delete' ? ' dv-np-danger' : '') + '" data-dvact="' + r[0] + '">' + svg(ic[r[1]], 24) + r[2] + (r[0] === 'pin' ? '<small id="dvNpPinState"></small>' : '') + '</button>';
      if (r[0] === 'share') h += '<div class="dv-np-menu" id="dvNpMenu" hidden>' + menuHTML + '</div>';
      return h;
    }).join('');
    var chips = [['search', 'search', 'Search'], ['grid', 'grid', 'Grid'], ['list', 'list', 'List'], ['recent', 'clock', 'Recent']];
    var chipsHTML = chips.map(function(c) {
      return '<button class="dv-np-chip" data-dvchip="' + c[0] + '">' + svg(ic[c[1]], 20) + c[2] + '</button>';
    }).join('');

    document.body.insertAdjacentHTML('beforeend',
      '<div class="dv-np" id="dvNpHome">' +
        '<div class="dv-np-bar"><button class="dv-icon-btn" id="dvNpHomeBack" aria-label="Back">' + svg(ic.back, 24) + '</button>' +
          '<button class="dv-icon-btn" id="dvNpCnt" aria-label="Counters">' + svg(ic.dots, 24) + '</button>' +
          '<span>Notes</span><small id="dvNpHomeCount"></small></div>' +
        '<div class="dv-np-chips" id="dvNpChips">' + chipsHTML + '</div>' +
        '<div class="dv-np-sw" id="dvNpSearchW" hidden><input class="dv-np-input" id="dvNpSearch" type="text" placeholder="Search notes" maxlength="60"></div>' +
        '<div class="dv-np-cards" id="dvNpCards"></div>' +
        '<button class="dv-np-fab" id="dvNpFab" aria-label="New note">' + svg(ic.plus, 34) + '</button>' +
      '</div>' +
      '<div class="dv-np" id="dvNpPage">' +
        '<div class="dv-np-bar"><button class="dv-icon-btn" id="dvNpBack" aria-label="Back">' + svg(ic.back, 24) + '</button><span>Notepad</span>' +
          '<button class="dv-np-savebtn" id="dvNpSave">' + svg(ic.save, 26) + 'SAVE</button></div>' +
        '<div class="dv-np-pills" id="dvNpPills"></div>' +
        '<div class="dv-np-scroll" id="dvNpScroll">' +
          '<div class="dv-np-tools" id="dvNpTools">' + toolsHTML + '</div>' +
          '<textarea class="dv-np-editor" id="dvNpEditor" placeholder="Start writing..." spellcheck="true"></textarea>' +
          '<input type="file" id="dvNpFile" accept=".txt,text/plain" style="display:none">' +
        '</div>' +
      '</div>' +
      '<div class="dv-np" id="dvNpActions">' +
        '<div class="dv-np-bar"><button class="dv-icon-btn" id="dvNpActBack" aria-label="Back">' + svg(ic.back, 24) + '</button><span id="dvNpActTitle"></span></div>' +
        '<div class="dv-np-list">' + rowsHTML + '</div>' +
      '</div>' +
      '<div class="dv-np-drop" id="dvNpDrop"><div class="dv-np-dmenu" id="dvNpDM"></div></div>' +
      '<div class="dv-np-dlg" id="dvNpDlg"></div>');

    /* ===== DIALOG (centre pop-up, replaces alert/confirm/prompt) ===== */
    function closeDlg() { var w = Q('#dvNpDlg'); w.classList.remove('dv-np-on'); w.innerHTML = ''; dlgOn = false; }
    function dialog(o) {
      var h = '<div class="dv-np-card"><div class="dv-np-ct">' + esc(o.title) + '</div>';
      if (o.message) h += '<div class="dv-np-cm">' + esc(o.message) + '</div>';
      if (o.input) {
        h += '<div class="dv-np-iw' + (o.input.pin ? ' dv-np-pinw' : '') + '"><input class="dv-np-input" id="dvNpIn" type="' + (o.input.pin ? 'password' : 'text') + '"' +
          (o.input.pin ? ' inputmode="numeric" maxlength="4" autocomplete="off"' : ' maxlength="60"') + ' placeholder="' + esc(o.input.placeholder || '') + '" value="' + esc(o.input.value || '') + '">' +
          (o.input.pin ? '<button class="dv-np-eye" id="dvNpEye" type="button" aria-label="Show PIN">' + svg(ic.eye, 24) + '</button>' : '') + '</div>';
      }
      h += '<div class="dv-np-bs">' + o.buttons.map(function(b, i) { return '<button class="dv-np-b dv-np-' + b.cls + '" data-dvb="' + i + '">' + esc(b.label) + '</button>'; }).join('') + '</div></div>';
      var w = Q('#dvNpDlg');
      w.innerHTML = h;
      w.classList.add('dv-np-on');
      if (!dlgOn) { dlgOn = true; pushLayer({ close: closeDlg }); }
      var inp = Q('#dvNpIn');
      if (inp) {
        if (o.input.pin) inp.addEventListener('input', function() { inp.value = inp.value.replace(/\D/g, '').slice(0, 4); });
        setTimeout(function() { inp.focus(); inp.select(); }, 50);
        var eye = Q('#dvNpEye');
        if (eye) eye.addEventListener('click', function() {
          var show = inp.type === 'password';
          inp.type = show ? 'text' : 'password';
          eye.innerHTML = svg(show ? ic.eyeoff : ic.eye, 24);
          eye.setAttribute('aria-label', show ? 'Hide PIN' : 'Show PIN');
        });
      }
      w.querySelectorAll('.dv-np-b').forEach(function(btn) {
        btn.addEventListener('click', function() {
          var b = o.buttons[+btn.getAttribute('data-dvb')];
          if (!b.onClick) { closeTop(); return; }
          Promise.resolve(b.onClick(inp ? inp.value : '')).then(function(r) {
            if (r === false) return;
            closeTop(typeof r === 'function' ? r : null);
          });
        });
      });
    }

    /* ===== PIN ===== */
    function hash(pin, salt) {
      var s = salt + ':' + pin;
      if (window.crypto && crypto.subtle && window.TextEncoder) {
        return crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)).then(function(b) {
          return Array.prototype.map.call(new Uint8Array(b), function(x) { return ('0' + x.toString(16)).slice(-2); }).join('');
        });
      }
      var h = 5381, i;
      for (i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
      return Promise.resolve('f' + h);
    }
    function unlock(note, then, title) {
      if (!note.pin) { then(); return; }
      dialog({
        title: title || 'Enter PIN', message: 'This note is locked.', input: { pin: true, placeholder: '4-digit PIN' },
        buttons: [
          { label: 'Cancel', cls: 'black' },
          { label: 'Unlock', cls: 'green', onClick: function(v) {
            if (!/^\d{4}$/.test(v)) { toast('Enter the 4-digit PIN'); return false; }
            return hash(v, note.pin.s).then(function(hx) {
              if (hx !== note.pin.h) { toast('Wrong PIN'); return false; }
              return then;
            });
          } }
        ]
      });
    }

    /* ===== EDITOR + HISTORY ===== */
    function flush() {
      clearTimeout(histTimer);
      var v = Q('#dvNpEditor').value;
      if (v === hist[hi]) return;
      hist = hist.slice(0, hi + 1); hist.push(v);
      if (hist.length > 200) hist.shift();
      hi = hist.length - 1;
    }
    function fit() { var t = Q('#dvNpEditor'); t.style.height = 'auto'; t.style.height = t.scrollHeight + 'px'; }
    function setText(v) { Q('#dvNpEditor').value = v; fit(); flush(); }
    function resetHistory() { hist = [Q('#dvNpEditor').value]; hi = 0; }

    /* ===== PILLS ===== */
    function renderPills() {
      var el = Q('#dvNpPills');
      if (!notes.length) { el.innerHTML = '<span class="dv-np-none">No saved notes yet</span>'; return; }
      el.innerHTML = notes.slice().sort(function(a, b) { return b.updated - a.updated; }).map(function(n) {
        return '<button class="dv-np-pill' + (n.id === curId ? ' dv-np-cur' : '') + '" data-dvid="' + n.id + '">' + (n.pin ? svg(ic.lock, 18) : '') + '<b>' + esc(n.title) + '</b></button>';
      }).join('');
    }

    /* ===== EDITOR PAGE (a screen on top of the Notes landing page) ===== */
    function editorOn() { return Q('#dvNpPage').classList.contains('dv-np-on'); }
    function editorDirty() {
      var t = Q('#dvNpEditor').value, c = curId ? findNote(curId) : null;
      return c ? t !== c.text : t.trim() !== '';
    }
    function openEditor(url) {
      Q('#dvNpPage').classList.add('dv-np-on');
      pushLayer({
        isEditor: true,
        close: function() { Q('#dvNpPage').classList.remove('dv-np-on'); editorForce = false; clearTimeout(histTimer); renderHome(); },
        blocked: function() { return !editorForce && editorDirty(); },
        onBlock: function() {
          dialog({
            title: 'Unsaved Note', message: 'This note has changes that are not saved.',
            buttons: [
              { label: 'Cancel', cls: 'blue' },
              { label: 'Discard', cls: 'red', onClick: function() { return function() { editorForce = true; closeTop(); }; } },
              { label: 'Save', cls: 'green', onClick: function() { return function() { doSave(true); }; } }
            ]
          });
        }
      }, url);
      fit();
    }
    function setEditorURL(u) {
      history.replaceState(history.state, '', u);
      for (var i = 0; i < layers.length; i++) { if (layers[i].isEditor) layers[i].url = u; }
    }
    function loadEditor(n) {
      setText(n ? n.text : '');
      curId = n ? n.id : null;
      resetHistory(); renderPills();
      var u = n ? U.noteURL(n) : U.dir;
      if (!editorOn()) openEditor(u); else setEditorURL(u);
      fit();
    }

    /* ===== TOOLBAR ===== */
    function doNew() {
      if (Q('#dvNpEditor').value.trim()) {
        dialog({
          title: 'Unsaved Note', message: 'There is a note in the editor. Save it first, or clear it to start a new note.',
          buttons: [
            { label: 'Cancel', cls: 'blue' },
            { label: 'Clear', cls: 'red', onClick: function() { setText(''); curId = null; renderPills(); toast('New note started'); } }
          ]
        });
        return;
      }
      curId = null; renderPills(); toast('New note');
    }
    function doUndo() { flush(); if (hi > 0) { hi--; Q('#dvNpEditor').value = hist[hi]; fit(); toast('Undo'); } else toast('Nothing to undo'); }
    function doRedo() { flush(); if (hi < hist.length - 1) { hi++; Q('#dvNpEditor').value = hist[hi]; fit(); toast('Redo'); } else toast('Nothing to redo'); }
    function doPaste() {
      var ta = Q('#dvNpEditor');
      if (!navigator.clipboard || !navigator.clipboard.readText) { toast('Paste is not available. Long-press the editor.'); return; }
      navigator.clipboard.readText().then(function(t) {
        if (!t) { toast('Clipboard is empty'); return; }
        flush();
        var s = ta.selectionStart, e = ta.selectionEnd;
        ta.value = ta.value.slice(0, s) + t + ta.value.slice(e);
        ta.selectionStart = ta.selectionEnd = s + t.length;
        fit(); flush(); toast('Pasted');
      }).catch(function() { toast('Paste blocked. Long-press the editor.'); });
    }
    function doCopy() {
      var ta = Q('#dvNpEditor'), v = ta.value;
      if (!v.trim()) { toast('Nothing to copy'); return; }
      function fallback() {
        try { ta.select(); document.execCommand('copy'); ta.setSelectionRange(v.length, v.length); toast('Note copied'); } catch (e) { toast('Copy failed'); }
      }
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(v).then(function() { toast('Note copied'); }).catch(fallback);
      else fallback();
    }
    function doImport() { Q('#dvNpFile').value = ''; Q('#dvNpFile').click(); }
    function onImportFile() {
      var f = Q('#dvNpFile').files && Q('#dvNpFile').files[0];
      if (!f) return;
      var r = new FileReader();
      r.onload = function() { flush(); setText(String(r.result || '')); curId = null; renderPills(); toast('Note imported'); };
      r.onerror = function() { toast('Could not read the file'); };
      r.readAsText(f);
    }
    function doExport() {
      var v = Q('#dvNpEditor').value;
      if (!v.trim()) { toast('Nothing to export'); return; }
      var cur = curId ? findNote(curId) : null;
      var t = cur ? cur.title : 'note';
      var blob = new Blob([v], { type: 'text/plain' });
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob); a.download = (t.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '') || 'note') + '.txt';
      document.body.appendChild(a); a.click(); a.remove();
      toast('Note exported to your device');
    }
    /* Saving always asks for a title first. Nothing is ever saved automatically. */
    function doSave(closeAfter) {
      var ta = Q('#dvNpEditor');
      if (!ta.value.trim()) { toast('Write something first'); return; }
      var cur = curId ? findNote(curId) : null;
      dialog({
        title: 'Save Note', input: { placeholder: 'Note title', value: cur ? cur.title : '' },
        buttons: [
          { label: 'Cancel', cls: 'black' },
          { label: 'Save', cls: 'green', onClick: function(v) {
            v = v.trim();
            if (!v) { toast('Enter a title'); return false; }
            if (cur) { cur.title = v; cur.text = ta.value; cur.updated = Date.now(); }
            else { cur = { id: Date.now().toString(36), title: v, text: ta.value, updated: Date.now(), pin: null }; notes.push(cur); curId = cur.id; }
            saveNotes(); renderPills(); renderHome(); toast('Note saved');
            var sv = cur;
            return function() {
              setEditorURL(U.noteURL(sv));
              if (closeAfter) { editorForce = true; closeTop(); }
            };
          } }
        ]
      });
    }

    /* ===== NOTE ACTIONS (shared by the actions page and the landing three-dot dropdown) ===== */
    function actNote() { return actId ? findNote(actId) : null; }
    function refreshAct() { var n = actNote(); if (n) { Q('#dvNpActTitle').textContent = n.title; Q('#dvNpPinState').textContent = n.pin ? 'On' : 'Off'; } }
    function refreshAll() { renderPills(); renderHome(); refreshAct(); }
    function showActions(id) {
      var n = findNote(id);
      if (!n) return;
      actId = id;
      Q('#dvNpActTitle').textContent = n.title;
      Q('#dvNpPinState').textContent = n.pin ? 'On' : 'Off';
      Q('#dvNpMenu').hidden = true;
      Q('#dvNpActions').classList.add('dv-np-on');
      pushLayer({ close: function() { Q('#dvNpActions').classList.remove('dv-np-on'); actId = null; } });
    }
    function hideActions() { closeTop(); }

    function actOpen(n, ctx) {
      unlock(n, function() {
        if (ctx === 'act') closeTop(function() { loadEditor(n); toast('Note opened'); });
        else { loadEditor(n); toast('Note opened'); }
      });
    }
    function actRename(n) {
      dialog({
        title: 'Rename Note', input: { placeholder: 'Note title', value: n.title },
        buttons: [
          { label: 'Cancel', cls: 'black' },
          { label: 'Save', cls: 'green', onClick: function(v) {
            v = v.trim();
            if (!v) { toast('Enter a title'); return false; }
            n.title = v; n.updated = Date.now(); saveNotes(); refreshAll(); toast('Note renamed');
          } }
        ]
      });
    }
    function setPinDialog(n) {
      var btns = [
        { label: 'Cancel', cls: 'black' },
        { label: 'Save', cls: 'green', onClick: function(v) {
          if (!/^\d{4}$/.test(v)) { toast('PIN must be 4 digits'); return false; }
          var salt = Date.now().toString(36);
          return hash(v, salt).then(function(hx) { n.pin = { s: salt, h: hx }; saveNotes(); refreshAll(); toast('PIN saved'); });
        } }
      ];
      if (n.pin) btns.push({ label: 'Remove PIN', cls: 'red', onClick: function() { n.pin = null; saveNotes(); refreshAll(); toast('PIN removed'); } });
      dialog({ title: n.pin ? 'Change PIN' : 'Set PIN', message: 'Choose a 4-digit PIN to lock this note.', input: { pin: true, placeholder: '4-digit PIN' }, buttons: btns });
    }
    function actPin(n) {
      if (n.pin) unlock(n, function() { setPinDialog(n); }, 'Enter current PIN');
      else setPinDialog(n);
    }
    function actDelete(n, ctx) {
      dialog({
        title: 'Delete Note', message: 'Delete "' + n.title + '" permanently? This cannot be undone.',
        buttons: [
          { label: 'Cancel', cls: 'blue' },
          { label: 'Delete', cls: 'red', onClick: function() {
            notes = notes.filter(function(x) { return x.id !== n.id; });
            if (curId === n.id) curId = null;
            saveNotes(); renderPills(); renderHome(); toast('Note deleted');
            if (ctx === 'act') return function() { closeTop(); };
          } }
        ]
      });
    }

    /* ===== SHARE ===== */
    function noteText(n) { return n.title + '\n\n' + n.text; }
    function fileName(n) { return (n.title.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '') || 'note') + '.txt'; }
    function shareWA(n) { window.open('https://wa.me/?text=' + encodeURIComponent(noteText(n)), '_blank'); toast('Opening WhatsApp'); }
    function shareBT(n) {
      var file = null;
      try { file = new File([noteText(n)], fileName(n), { type: 'text/plain' }); } catch (e) {}
      if (navigator.share && file && navigator.canShare && navigator.canShare({ files: [file] })) {
        navigator.share({ files: [file], title: n.title }).then(function() { toast('Shared'); }).catch(function() {});
      } else if (navigator.share) {
        navigator.share({ title: n.title, text: noteText(n) }).then(function() { toast('Shared'); }).catch(function() {});
      } else toast('Sharing is not supported on this device');
      toast('Choose Bluetooth from the list');
    }
    function shareImport(n) {
      var blob = new Blob([noteText(n)], { type: 'text/plain' });
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob); a.download = fileName(n);
      document.body.appendChild(a); a.click(); a.remove();
      toast('Note saved to your device');
    }
    function doShare(kind, n, ctx) {
      if (kind === 'x') { if (ctx === 'act') Q('#dvNpMenu').hidden = true; toast('Share menu closed'); return; }
      unlock(n, function() {
        if (ctx === 'act') Q('#dvNpMenu').hidden = true;
        if (kind === 'wa') shareWA(n);
        else if (kind === 'bt') shareBT(n);
        else if (kind === 'lk') shareLink(n);
        else shareImport(n);
      });
    }
    function runAction(k, n, ctx) {
      if (k === 'open') actOpen(n, ctx);
      else if (k === 'rename') actRename(n);
      else if (k === 'pin') actPin(n);
      else if (k === 'delete') actDelete(n, ctx);
      else if (k === 'home') addToHome(n);
    }

    /* ===== NOTE LINK + ADD TO HOME SCREEN (each note is its own shortcut) ===== */
    function shareLink(n) {
      U.link(n).then(function(url) {
        if (navigator.share) navigator.share({ title: n.title, url: url }).catch(function() {});
        else if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(url).then(function() { toast('Note link copied'); }).catch(function() { toast('Copy failed'); });
        else toast('Sharing is not supported on this device');
      }).catch(function() { toast('Could not make the link'); });
    }
    var ADDKEY = 'dvnp_addhome';
    var mLink = document.querySelector('link[rel="manifest"]');
    var mOrig = mLink ? mLink.getAttribute('href') : null;
    function iconURL(n, s) {
      var c = document.createElement('canvas'); c.width = c.height = s;
      var g = c.getContext('2d');
      g.fillStyle = '#1877F2'; g.fillRect(0, 0, s, s);
      g.fillStyle = '#FFFFFF'; g.font = 'bold ' + Math.round(s * 0.5) + 'px Roboto,Arial,sans-serif';
      g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText((String(n.title).trim().charAt(0) || 'N').toUpperCase(), s / 2, s / 2 + s * 0.03);
      return c.toDataURL('image/png');
    }
    function setNoteManifest(n) {
      var url = U.noteURL(n), nm = String(n.title);
      var man = {
        id: url, name: nm, short_name: nm.slice(0, 12), start_url: url, scope: U.base, display: 'standalone',
        background_color: '#FFFFFF', theme_color: '#1877F2',
        icons: [{ src: iconURL(n, 192), sizes: '192x192', type: 'image/png', purpose: 'any maskable' }, { src: iconURL(n, 512), sizes: '512x512', type: 'image/png', purpose: 'any maskable' }]
      };
      var href = URL.createObjectURL(new Blob([JSON.stringify(man)], { type: 'application/manifest+json' }));
      if (!mLink) { mLink = document.createElement('link'); mLink.rel = 'manifest'; document.head.appendChild(mLink); }
      mLink.setAttribute('href', href);
    }
    function resetManifest() {
      if (!mLink) return;
      if (mOrig !== null) mLink.setAttribute('href', mOrig); else mLink.removeAttribute('href');
    }
    /* Takes the browser's add-to-home-screen offer only while a note is being added, so it never touches the app's own install button. */
    var waitInst = null;
    window.addEventListener('beforeinstallprompt', function(e) {
      if (!waitInst) return;
      e.preventDefault(); e.stopImmediatePropagation();
      var r = waitInst; waitInst = null; r(e);
    }, true);
    function waitInstall(ms) {
      return new Promise(function(res) {
        waitInst = res;
        setTimeout(function() { if (waitInst === res) { waitInst = null; res(null); } }, ms);
      });
    }
    function addToHome(n) {
      unlock(n, function() {
        setNoteManifest(n);
        waitInstall(2500).then(function(ev) {
          if (ev) {
            ev.prompt();
            ev.userChoice.then(function(c) { toast(c.outcome === 'accepted' ? 'Note added to home screen' : 'Cancelled'); resetManifest(); });
            return;
          }
          resetManifest();
          try { sessionStorage.setItem(ADDKEY, n.id); } catch (e) {}
          location.href = U.noteURL(n);
        });
      });
    }
    function homeDialog(n, ev) {
      dialog({
        title: 'Add to home screen',
        message: ev ? 'Tap Add to put this note on your home screen.' : 'Open the browser menu and tap Add to home screen. The shortcut opens this note.',
        buttons: ev ? [
          { label: 'Cancel', cls: 'black' },
          { label: 'Add', cls: 'green', onClick: function() { ev.prompt(); ev.userChoice.then(function(c) { toast(c.outcome === 'accepted' ? 'Note added to home screen' : 'Cancelled'); }); } }
        ] : [{ label: 'OK', cls: 'blue' }]
      });
    }
    /* Opening a note address (a home-screen shortcut or your own link) opens that note. */
    function boot() {
      var r = U.parse();
      if (!r || r.data) return;
      loadNotes();
      var n = findNote(r.id);
      if (!n) { U.show(null, r.id, 'This note is not on this device. Ask the sender for the share link.'); return; }
      history.replaceState(null, '', U.dir);
      setNoteManifest(n);
      DV.openRoute('notepad');
      setTimeout(function() { actOpen(findNote(n.id) || n, 'home'); }, 80);
      try {
        if (sessionStorage.getItem(ADDKEY) === n.id) {
          sessionStorage.removeItem(ADDKEY);
          waitInstall(3500).then(function(ev) { homeDialog(n, ev); });
        }
      } catch (e) {}
    }

    /* ===== NOTES LANDING PAGE ===== */
    function fmtDate(t) { try { return new Date(t).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }); } catch (e) { return ''; } }
    function renderHome() {
      var box = Q('#dvNpCards');
      Q('#dvNpHomeCount').textContent = notes.length + (notes.length === 1 ? ' note' : ' notes');
      var list = notes.slice().sort(function(a, b) { return b.updated - a.updated; });
      if (homeRecent) { var lim = Date.now() - 7 * 86400000; list = list.filter(function(n) { return n.updated >= lim; }); }
      if (homeQ) { var q = homeQ.toLowerCase(); list = list.filter(function(n) { return n.title.toLowerCase().indexOf(q) > -1 || (!n.pin && n.text.toLowerCase().indexOf(q) > -1); }); }
      box.className = 'dv-np-cards' + (homeGrid ? ' dv-np-grid' : '');
      Q('#dvNpChips').querySelectorAll('[data-dvchip]').forEach(function(c) {
        var k = c.getAttribute('data-dvchip');
        var on = k === 'search' ? homeSearchOn : k === 'grid' ? homeGrid : k === 'list' ? !homeGrid : homeRecent;
        c.classList.toggle('dv-np-chon', on);
      });
      if (!list.length) {
        box.innerHTML = '<div class="dv-np-empty">' + (notes.length ? 'No notes match.' : 'No notes yet. Tap + to write your first note.') + '</div>';
        return;
      }
      box.innerHTML = list.map(function(n) {
        var prev = n.pin ? 'This note is locked.' : n.text.replace(/\s+/g, ' ').slice(0, 140);
        return '<div class="dv-np-nc" data-dvcard="' + n.id + '"><div class="dv-np-ncb"><div class="dv-np-nct">' + (n.pin ? svg(ic.lock, 18) : '') + '<b>' + esc(n.title) + '</b></div>' +
          '<div class="dv-np-ncp">' + esc(prev) + '</div><div class="dv-np-ncd">' + esc(fmtDate(n.updated)) + '</div></div>' +
          '<button class="dv-np-dots" data-dvdots="' + n.id + '" aria-label="Note actions">' + svg(ic.dots, 24) + '</button></div>';
      }).join('');
    }
    function countStats() {
      var w = 0, c = 0, s = 0, p = 0;
      notes.forEach(function(n) {
        var t = n.text || '';
        w += (t.match(/\S+/g) || []).length;
        c += t.length;
        s += (t.match(/[^.!?]*[.!?]+/g) || []).length;
        p += t.split(/\n+/).filter(function(x) { return x.trim(); }).length;
      });
      return [['Word counter', w], ['Character counter', c], ['Sentence counter', s], ['Paragraph counter', p]];
    }

    /* ===== DROPDOWN (three-dot menus) ===== */
    var dropAnchor = null, dropRight = false;
    function placeDrop() {
      var m = Q('#dvNpDM'), r = dropAnchor.getBoundingClientRect(), vw = window.innerWidth, vh = window.innerHeight;
      var w = m.offsetWidth, h = m.offsetHeight;
      var left = dropRight ? r.right - w : r.left;
      left = Math.max(8, Math.min(left, vw - w - 8));
      var top = r.bottom + 4;
      if (top + h > vh - 8) top = Math.max(8, r.top - h - 4);
      m.style.left = left + 'px'; m.style.top = top + 'px';
    }
    function openDrop(html, anchor, right) {
      Q('#dvNpDM').innerHTML = html;
      Q('#dvNpDrop').classList.add('dv-np-on');
      dropAnchor = anchor; dropRight = right;
      placeDrop();
      pushLayer({ close: function() { Q('#dvNpDrop').classList.remove('dv-np-on'); Q('#dvNpDM').innerHTML = ''; dropId = null; } });
    }
    function noteDropHTML(n) {
      return rows.map(function(r) {
        var h = '<button class="dv-np-di' + (r[0] === 'delete' ? ' dv-np-danger' : '') + '" data-dvd="' + r[0] + '">' + svg(ic[r[1]], 22) + r[2] + (r[0] === 'pin' ? '<small>' + (n.pin ? 'On' : 'Off') + '</small>' : '') + '</button>';
        if (r[0] === 'share') h += '<div class="dv-np-dsub" id="dvNpDSub" hidden>' + menu.map(function(m) { return '<button class="dv-np-di" data-dvdsh="' + m[0] + '">' + svg(ic[m[1]], 22) + m[2] + '</button>'; }).join('') + '</div>';
        return h;
      }).join('');
    }

    /* ===== EVENTS ===== */
    var ed = Q('#dvNpEditor');
    ed.addEventListener('input', function() {
      fit();
      clearTimeout(histTimer);
      histTimer = setTimeout(flush, 500);
    });
    Q('#dvNpTools').addEventListener('click', function(e) {
      var b = e.target.closest('[data-dvnp]'); if (!b) return;
      var k = b.getAttribute('data-dvnp');
      if (k === 'new') doNew();
      else if (k === 'redo') doRedo();
      else if (k === 'undo') doUndo();
      else if (k === 'paste') doPaste();
      else if (k === 'copy') doCopy();
      else if (k === 'import') doImport();
      else if (k === 'export') doExport();
      else if (k === 'exit') closeTop();
    });
    Q('#dvNpPills').addEventListener('click', function(e) {
      var p = e.target.closest('[data-dvid]'); if (p) showActions(p.getAttribute('data-dvid'));
    });
    Q('#dvNpBack').addEventListener('click', function() { closeTop(); });
    Q('#dvNpSave').addEventListener('click', function() { doSave(false); });
    Q('#dvNpFile').addEventListener('change', onImportFile);
    Q('#dvNpActBack').addEventListener('click', hideActions);
    Q('#dvNpActions').addEventListener('click', function(e) {
      var s = e.target.closest('[data-dvsh]');
      var n = actNote(); if (!n) return;
      if (s) { doShare(s.getAttribute('data-dvsh'), n, 'act'); return; }
      var r = e.target.closest('[data-dvact]'); if (!r) return;
      var k = r.getAttribute('data-dvact');
      if (k === 'share') { var m = Q('#dvNpMenu'); m.hidden = !m.hidden; }
      else runAction(k, n, 'act');
    });

    /* landing page */
    Q('#dvNpHomeBack').addEventListener('click', function() { DV.closeRoute(); });
    Q('#dvNpFab').addEventListener('click', function() { loadEditor(null); });
    Q('#dvNpChips').addEventListener('click', function(e) {
      var c = e.target.closest('[data-dvchip]'); if (!c) return;
      var k = c.getAttribute('data-dvchip');
      if (k === 'search') {
        homeSearchOn = !homeSearchOn;
        Q('#dvNpSearchW').hidden = !homeSearchOn;
        if (homeSearchOn) setTimeout(function() { Q('#dvNpSearch').focus(); }, 50);
        else { homeQ = ''; Q('#dvNpSearch').value = ''; }
      } else if (k === 'grid') homeGrid = true;
      else if (k === 'list') homeGrid = false;
      else if (k === 'recent') homeRecent = !homeRecent;
      renderHome();
    });
    Q('#dvNpSearch').addEventListener('input', function() { homeQ = this.value.trim(); renderHome(); });
    Q('#dvNpCards').addEventListener('click', function(e) {
      var d = e.target.closest('[data-dvdots]');
      if (d) {
        var n = findNote(d.getAttribute('data-dvdots')); if (!n) return;
        dropId = n.id;
        openDrop(noteDropHTML(n), d, true);
        return;
      }
      var c = e.target.closest('[data-dvcard]');
      if (c) { var nn = findNote(c.getAttribute('data-dvcard')); if (nn) actOpen(nn, 'home'); }
    });
    Q('#dvNpCnt').addEventListener('click', function() {
      var h = countStats().map(function(r) { return '<div class="dv-np-cr"><span>' + r[0] + '</span><b>' + r[1] + '</b></div>'; }).join('');
      dropId = null;
      openDrop(h, this, false);
    });
    Q('#dvNpDrop').addEventListener('click', function(e) {
      if (e.target === this) { closeTop(); return; }
      var n = dropId ? findNote(dropId) : null;
      var sh = e.target.closest('[data-dvdsh]');
      if (sh && n) {
        var k = sh.getAttribute('data-dvdsh');
        if (k === 'x') { Q('#dvNpDSub').hidden = true; placeDrop(); toast('Share menu closed'); return; }
        closeTop(function() { doShare(k, n, 'home'); });
        return;
      }
      var d = e.target.closest('[data-dvd]');
      if (!d || !n) return;
      var a = d.getAttribute('data-dvd');
      if (a === 'share') { var sub = Q('#dvNpDSub'); sub.hidden = !sub.hidden; placeDrop(); return; }
      closeTop(function() { runAction(a, n, 'home'); });
    });

    /* ===== REGISTER WITH THE SHELL ===== */
    DV.route('notepad', {
      title: 'Notepad',
      description: 'A simple private notepad. Write, save, lock with a PIN and share your notes.',
      open: function() {
        loadNotes();
        layers = []; pending = null; closing = false; dlgOn = false; editorForce = false;
        homeQ = ''; homeGrid = false; homeRecent = false; homeSearchOn = false;
        Q('#dvNpSearch').value = ''; Q('#dvNpSearchW').hidden = true;
        ed.value = ''; curId = null; actId = null; dropId = null;
        resetHistory();
        renderPills();
        renderHome();
        Q('#dvNpHome').classList.add('dv-np-on');
      },
      close: function() {
        clearTimeout(histTimer);
        layers = []; pending = null; closing = false; editorForce = false;
        closeDlg();
        Q('#dvNpDrop').classList.remove('dv-np-on'); Q('#dvNpDM').innerHTML = '';
        Q('#dvNpActions').classList.remove('dv-np-on'); actId = null; dropId = null;
        Q('#dvNpPage').classList.remove('dv-np-on');
        Q('#dvNpHome').classList.remove('dv-np-on');
      }
    });
    DV.addNavItem({
      key: 'notepad',
      id: 'dvNoteNavBtn',
      html: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' + ic.rename + '</svg>Note'
    });
    DV.addQuickAction({
      label: 'Note',
      route: 'notepad',
      order: 20,
      icon: ic.rename
    });
    window.DVNP_HAS = function(id) { loadNotes(); return !!findNote(id); };
    window.DVNP_OPEN = function(id) {
      loadNotes();
      var n = findNote(id);
      if (!n) return false;
      DV.openRoute('notepad');
      setTimeout(function() { actOpen(findNote(id) || n, 'home'); }, 80);
      return true;
    };
    setTimeout(boot, 400);
  } catch (e) {}
})();
