/* ===== MODULE: editor.js = YOUR notepad (full-page modal). Self-contained: own CSS, HTML, JS. =====
   Your toolbar, saved-note pills, PIN, note-actions page, SAVE flow and share menu are kept as you built them.
   Only the plumbing changed: notes now live in IndexedDB 'deborah-note' (not localStorage) and the page opens as a modal.
   Listens: dv:note:new, dv:editor:open {id | title,text}     Emits: dv:notes:changed
   Share link formats are documented in README.md */
(function() {
  try {
    var notes = [], curId = null, actId = null;
    var hist = [''], hi = 0, histTimer = null;

    function Q(s) { return document.querySelector(s); }
    function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
    function emit(n, d) { document.dispatchEvent(new CustomEvent(n, { detail: d || {} })); }
    var toastEl = document.createElement('div'), toastT; toastEl.className = 'dvnw-toast'; toastEl.setAttribute('role', 'status');
    var spinEl = document.createElement('div'); spinEl.className = 'dvnw-scrim'; spinEl.hidden = true; spinEl.innerHTML = '<div class="dvnw-spin" role="progressbar" aria-label="Working"></div>';
    document.body.appendChild(toastEl); document.body.appendChild(spinEl);
    function toast(m) { var sp = document.createElement('span'); sp.textContent = m; toastEl.replaceChildren(sp); toastEl.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(function() { toastEl.classList.remove('on'); }, 2200); }
    function spin(on) { spinEl.hidden = !on; }
    function buzz(ms) { try { if (navigator.vibrate) navigator.vibrate(ms || 10); } catch (e) {} }
    var db = null;
    function openDB() {
      if (db) return Promise.resolve(db);
      return new Promise(function(res, rej) {
        var r = indexedDB.open('deborah-note', 1);
        r.onupgradeneeded = function() { var d = r.result; ['notes', 'todos'].forEach(function(n) { if (!d.objectStoreNames.contains(n)) d.createObjectStore(n, { keyPath: 'id' }); }); if (!d.objectStoreNames.contains('meta')) d.createObjectStore('meta', { keyPath: 'k' }); };
        r.onsuccess = function() { db = r.result; db.onversionchange = function() { db.close(); db = null; }; res(db); };
        r.onerror = function() { rej(r.error); };
      });
    }
    function rq(r) { return new Promise(function(res, rej) { r.onsuccess = function() { res(r.result); }; r.onerror = function() { rej(r.error); }; }); }
    function norm(n) {
      n.title = n.title || String(n.text || '').split('\n')[0].trim().slice(0, 60) || 'Untitled';
      if (!('pin' in n)) n.pin = null;
      if (!n.updated) n.updated = n.created || 0;
      return n;
    }
    function loadNotes(cb) {
      spin(true);
      openDB().then(function(d) { return rq(d.transaction('notes').objectStore('notes').getAll()); })
        .then(function(r) { notes = r.map(norm); }, function() { toast('Could not load your notes'); }).then(function() { spin(false); if (cb) cb(); });
    }
    function saveNotes() {
      spin(true); var snapshot = JSON.parse(JSON.stringify(notes));
      return openDB().then(function(d) {
        var t; try { t = d.transaction('notes', 'readwrite', { durability: 'strict' }); } catch (e) { t = d.transaction('notes', 'readwrite'); }
        var st = t.objectStore('notes'); st.clear(); snapshot.forEach(function(n) { st.put(n); });
        return new Promise(function(res, rej) { t.oncomplete = res; t.onerror = t.onabort = function() { rej(t.error); }; });
      }).then(function() { spin(false); emit('dv:notes:changed'); return true; }, function() { spin(false); toast('Could not save. Storage may be full.'); return false; });
    }
    function failed() { loadNotes(renderPills); return false; }
    function findNote(id) { for (var i = 0; i < notes.length; i++) { if (notes[i].id === id) return notes[i]; } return null; }
    function saveDraft() { var v = { k: 'np-draft', text: Q('#dvNpEditor').value, id: curId }; openDB().then(function(d) { d.transaction('meta', 'readwrite').objectStore('meta').put(v); }).catch(function() {}); }
    function readDraft(cb) { openDB().then(function(d) { return rq(d.transaction('meta').objectStore('meta').get('np-draft')); }).then(function(v) { cb(v || null); }, function() { cb(null); }); }

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
      imp: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>'
    };
    function svg(p, s) { s = s || 22; return '<svg width="' + s + '" height="' + s + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + p + '</svg>'; }

    var css = '' +
      '.dv-np{position:fixed;inset:0;z-index:9999;background:var(--dv-bg,#FDFBFF);display:none;flex-direction:column;font-family:inherit;color:var(--dv-tx,#1A1C1E)}' +
      '.dv-np.dv-np-on{display:flex}' +
      '#dvNpActions{z-index:10000}' +
      '.dv-np-bar{background:var(--dv-head,#1877F2);color:#fff;display:flex;align-items:center;gap:12px;padding:10px 12px;font-size:1.15rem;font-weight:700;flex-shrink:0;border-bottom:3px solid var(--dv-p,#1877F2)}' +
      '.dv-np-bar .dv-icon-btn{color:#fff}' +
      '.dv-np-bar span{flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}' +
      '.dv-np-pills{display:flex;gap:8px;overflow-x:auto;overflow-y:hidden;padding:10px 12px;border-bottom:1px solid var(--dv-sv,#E1E2EC);scrollbar-width:none;flex-shrink:0;align-items:center}' +
      '.dv-np-pills::-webkit-scrollbar,.dv-np-tools::-webkit-scrollbar{display:none}' +
      '.dv-np-pill{flex:none;display:flex;align-items:center;gap:6px;overflow:hidden;white-space:nowrap;padding:8px 16px;border-radius:999px;border:2px solid var(--dv-p,#1877F2);background:var(--dv-sf,#F1F3FA);color:var(--dv-p,#1877F2);font-size:1rem;font-weight:700;font-family:inherit;cursor:pointer}' +
      '.dv-np-pill.dv-np-cur{background:var(--dv-p,#1877F2);color:#fff}' +
      '.dv-np-pill b{overflow:hidden;text-overflow:ellipsis;font-weight:700}' +
      '.dv-np-none{font-size:1rem;color:var(--dv-tx2,#44474E);white-space:nowrap}' +
      '.dv-np-tools{display:flex;gap:4px;overflow-x:auto;overflow-y:hidden;padding:8px 8px;border-bottom:3px solid var(--dv-sv,#E1E2EC);scrollbar-width:none;flex-shrink:0;background:var(--dv-bg,#FDFBFF)}' +
      '.dv-np-tool{flex:none;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;min-width:84px;padding:8px 12px;border:none;border-radius:12px;background:transparent;color:var(--dv-tx,#1A1C1E);font-size:1rem;font-weight:500;font-family:inherit;cursor:pointer;white-space:nowrap}' +
      '.dv-np-tool svg{color:var(--dv-p,#1877F2)}' +
      '.dv-np-tool:active{background:var(--dv-sf,#F1F3FA)}' +
      '.dv-np-savebtn{flex:none;display:flex;align-items:center;gap:10px;padding:10px 22px;border:none;border-radius:999px;background:#fff;color:var(--dv-p,#1877F2);font-size:1.2rem;font-weight:800;font-family:inherit;cursor:pointer}' +
      '.dv-np-savebtn:active{opacity:0.8}' +
      '.dv-np-scroll{flex:1;overflow-y:auto;overflow-x:hidden;display:flex;flex-direction:column}' +
      '.dv-np-editor{flex:1 0 auto;min-height:60dvh;overflow:hidden;width:100%;border:none;outline:none;resize:none;padding:16px;background:var(--dv-bg,#FDFBFF);color:var(--dv-tx,#1A1C1E);font-size:23px;line-height:1.6;font-family:inherit;border-radius:0}' +
      '.dv-np-list{flex:1;overflow-y:auto;display:flex;flex-direction:column}' +
      '.dv-np-row{display:flex;align-items:center;gap:16px;width:100%;padding:20px 18px;border:none;border-bottom:1px solid var(--dv-sv,#E1E2EC);background:var(--dv-bg,#FDFBFF);color:var(--dv-tx,#1A1C1E);font-size:1.2rem;font-weight:700;font-family:inherit;cursor:pointer;text-align:left}' +
      '.dv-np-row:active{background:var(--dv-sf,#F1F3FA)}' +
      '.dv-np-row svg{color:var(--dv-p,#1877F2);flex-shrink:0}' +
      '.dv-np-row.dv-np-danger,.dv-np-row.dv-np-danger svg{color:var(--dv-er,#BA1A1A)}' +
      '.dv-np-row small{margin-left:auto;font-size:1rem;color:var(--dv-tx2,#44474E);font-weight:600}' +
      '.dv-np-menu{margin:8px 18px 18px;border:2px solid var(--dv-sv,#E1E2EC);border-radius:14px;overflow:hidden;background:var(--dv-bg,#FDFBFF);box-shadow:0 2px 8px rgba(0,0,0,.2)}' +
      '.dv-np-menu[hidden]{display:none}' +
      '.dv-np-mi{display:flex;align-items:center;gap:14px;width:100%;padding:16px 18px;border:none;border-bottom:1px solid var(--dv-sv,#E1E2EC);background:transparent;color:var(--dv-tx,#1A1C1E);font-size:1.1rem;font-weight:600;font-family:inherit;cursor:pointer;text-align:left}' +
      '.dv-np-mi:last-child{border-bottom:none}' +
      '.dv-np-mi svg{color:var(--dv-p,#1877F2)}' +
      '.dv-np-dlg{position:fixed;inset:0;z-index:10001;background:rgba(0,0,0,0.6);display:none;align-items:center;justify-content:center;padding:20px;font-family:inherit}' +
      '.dv-np-dlg.dv-np-on{display:flex}' +
      '.dv-np-card{width:100%;background:var(--dv-bg,#FDFBFF);color:var(--dv-tx,#1A1C1E);border-radius:16px;padding:22px;box-shadow:0 12px 40px rgba(0,0,0,.3)}' +
      '.dv-np-ct{font-size:1.3rem;font-weight:800;margin-bottom:10px}' +
      '.dv-np-cm{font-size:1.05rem;color:var(--dv-tx2,#44474E);line-height:1.5;margin-bottom:14px}' +
      '.dv-np-iw{position:relative;margin-bottom:16px}' +
      '.dv-np-input{width:100%;padding:13px 14px;font-size:1.1rem;font-family:inherit;border:2px solid var(--dv-sv,#E1E2EC);border-radius:12px;background:var(--dv-sf,#F1F3FA);color:var(--dv-tx,#1A1C1E);outline:none}' +
      '.dv-np-input:focus{border-color:var(--dv-p,#1877F2)}' +
      '.dv-np-iw.dv-np-pinw .dv-np-input{padding-right:54px;letter-spacing:6px}' +
      '.dv-np-eye{position:absolute;right:4px;top:50%;transform:translateY(-50%);width:46px;height:46px;border:none;background:transparent;color:var(--dv-tx2,#44474E);display:flex;align-items:center;justify-content:center;cursor:pointer}' +
      '.dv-np-bs{display:flex;gap:10px;flex-wrap:wrap}' +
      '.dv-np-b{flex:1;min-width:110px;padding:14px;border:2px solid transparent;border-radius:12px;font-size:1.05rem;font-weight:700;font-family:inherit;color:#fff;cursor:pointer}' +
      '.dv-np-b:active{opacity:0.8}' +
      '.dv-np-green{background:var(--dv-p,#1877F2)}.dv-np-red{background:#DC2626}' +
      '.dv-np-blue{background:transparent;color:var(--dv-p,#1877F2);border-color:var(--dv-p,#1877F2)}' +
      '.dv-np-black{background:#000;border-color:var(--dv-sv,#E1E2EC)}';
    var extra = '.dv-icon-btn{width:48px;height:48px;border:0;border-radius:50%;background:transparent;display:flex;align-items:center;justify-content:center;flex-shrink:0;cursor:pointer}' +
      '.dv-np button,.dv-np-dlg button{touch-action:manipulation;-webkit-user-select:none;user-select:none}' +
      '.dv-icon-btn:active,.dv-np-tool:active,.dv-np-pill:active,.dv-np-row:active,.dv-np-mi:active,.dv-np-b:active,.dv-np-savebtn:active{box-shadow:inset 0 0 0 100vmax rgba(128,128,128,.24)}' +
      '.dv-np-bar{padding-top:calc(10px + env(safe-area-inset-top))}' +
      '.dvnw-scrim{position:fixed;top:0;left:0;width:100dvw;height:100dvh;background:rgba(0,0,0,.45);display:grid;place-items:center;z-index:20000}.dvnw-scrim[hidden]{display:none}' +
      '.dvnw-spin{width:56px;height:56px;border-radius:50%;border:6px solid rgba(255,255,255,.4);border-top-color:var(--dv-p,#1877F2);animation:dvnwspin 1s linear infinite}@keyframes dvnwspin{to{transform:rotate(360deg)}}' +
      '.dvnw-toast{position:fixed;left:0;right:0;top:50%;transform:translateY(-50%);padding:0 24px;text-align:center;pointer-events:none;opacity:0;transition:opacity .2s;z-index:20001;font-family:Roboto,sans-serif;font-size:1rem}' +
      '.dvnw-toast.on{opacity:1}.dvnw-toast span{display:inline-block;padding:14px 24px;border-radius:24px;background:#323232;color:#fff}';
    var st = document.createElement('style');
    st.textContent = css + extra;
    document.head.appendChild(st);
    var tools = [
      ['new', 'plus', 'Note'], ['redo', 'redo', 'Redo'], ['undo', 'undo', 'Undo'], ['paste', 'paste', 'Paste'],
      ['copy', 'copy', 'Copy'], ['import', 'imp', 'Import'], ['export', 'save', 'Export'], ['exit', 'exit', 'Exit']
    ];
    var toolsHTML = tools.map(function(t) {
      return '<button class="dv-np-tool" data-dvnp="' + t[0] + '">' + svg(ic[t[1]], 30) + '<span>' + t[2] + '</span></button>';
    }).join('');
    var rows = [['open', 'open', 'Open'], ['rename', 'rename', 'Rename'], ['pin', 'lock', 'PIN'], ['delete', 'del', 'Delete'], ['share', 'share', 'Share']];
    var rowsHTML = rows.map(function(r) {
      return '<button class="dv-np-row' + (r[0] === 'delete' ? ' dv-np-danger' : '') + '" data-dvact="' + r[0] + '">' + svg(ic[r[1]], 24) + r[2] + (r[0] === 'pin' ? '<small id="dvNpPinState"></small>' : '') + '</button>';
    }).join('');
    var menu = [['lnk', 'share', 'Share link'], ['wa', 'share', 'WhatsApp'], ['bt', 'share', 'Bluetooth'], ['imp', 'save', 'Export to device'], ['x', 'exit', 'Exit']];
    var menuHTML = menu.map(function(m) { return '<button class="dv-np-mi" data-dvsh="' + m[0] + '">' + svg(ic[m[1]], 22) + m[2] + '</button>'; }).join('');

    document.body.insertAdjacentHTML('beforeend',
      '<div class="dv-np" id="dvNpPage">' +
        '<div class="dv-np-bar"><button class="dv-icon-btn" id="dvNpBack" aria-label="Back">' + svg(ic.back, 24) + '</button><span>Notepad</span>' +
          '<button class="dv-np-savebtn" id="dvNpSave">' + svg(ic.save, 26) + 'SAVE</button></div>' +
        '<div class="dv-np-pills" id="dvNpPills"></div>' +
        '<div class="dv-np-scroll" id="dvNpScroll">' +
          '<div class="dv-np-tools" id="dvNpTools">' + toolsHTML + '</div>' +
          '<textarea class="dv-np-editor" id="dvNpEditor" placeholder="Start writing..." spellcheck="true"></textarea>' +
          '<input type="file" id="dvNpFile" accept=".txt,text/plain" style="display:none">' +
        '</div>' +
      '</div>');
    document.body.insertAdjacentHTML('beforeend',
      '<div class="dv-np" id="dvNpActions">' +
        '<div class="dv-np-bar"><button class="dv-icon-btn" id="dvNpActBack" aria-label="Back">' + svg(ic.back, 24) + '</button><span id="dvNpActTitle"></span></div>' +
        '<div class="dv-np-list">' + rowsHTML + '<div class="dv-np-menu" id="dvNpMenu" hidden>' + menuHTML + '</div></div>' +
      '</div>' +
      '<div class="dv-np-dlg" id="dvNpDlg"></div>');
    function closeDlg() { Q('#dvNpDlg').classList.remove('dv-np-on'); Q('#dvNpDlg').innerHTML = ''; }
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
          if (!b.onClick) { closeDlg(); return; }
          Promise.resolve(b.onClick(inp ? inp.value : '')).then(function(r) { if (r !== false) closeDlg(); });
        });
      });
    }

    /* ===== PIN (a screen lock, not encryption: note text is stored and exported as plain text) ===== */
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
              setTimeout(then, 0);
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
    function setText(v) { Q('#dvNpEditor').value = v; fit(); flush(); saveDraft(); }
    function resetHistory() { hist = [Q('#dvNpEditor').value]; hi = 0; }

    /* ===== PILLS ===== */
    function renderPills() {
      var el = Q('#dvNpPills');
      if (!notes.length) { el.innerHTML = '<span class="dv-np-none">No saved notes yet</span>'; return; }
      el.innerHTML = notes.slice().sort(function(a, b) { return b.updated - a.updated; }).map(function(n) {
        return '<button class="dv-np-pill' + (n.id === curId ? ' dv-np-cur' : '') + '" data-dvid="' + esc(n.id) + '">' + (n.pin ? svg(ic.lock, 18) : '') + '<b>' + esc(String(n.title).slice(0, 26)) + '</b></button>';
      }).join('');
    }

    /* ===== TOOLBAR ===== */
    function doNew() {
      if (Q('#dvNpEditor').value.trim()) {
        dialog({
          title: 'Unsaved Note', message: 'There is a note in the editor. Save it first, or clear it to start a new note.',
          buttons: [
            { label: 'Cancel', cls: 'blue' },
            { label: 'Clear', cls: 'red', onClick: function() { setText(''); curId = null; saveDraft(); renderPills(); toast('New note started'); } }
          ]
        });
        return;
      }
      curId = null; saveDraft(); renderPills(); toast('New note');
    }
    function doUndo() { flush(); if (hi > 0) { hi--; Q('#dvNpEditor').value = hist[hi]; fit(); saveDraft(); toast('Undo'); } else toast('Nothing to undo'); }
    function doRedo() { flush(); if (hi < hist.length - 1) { hi++; Q('#dvNpEditor').value = hist[hi]; fit(); saveDraft(); toast('Redo'); } else toast('Nothing to redo'); }
    function doPaste() {
      var ta = Q('#dvNpEditor');
      if (!navigator.clipboard || !navigator.clipboard.readText) { toast('Paste is not available. Long-press the editor.'); return; }
      navigator.clipboard.readText().then(function(t) {
        if (!t) { toast('Clipboard is empty'); return; }
        flush();
        var s = ta.selectionStart, e = ta.selectionEnd;
        ta.value = ta.value.slice(0, s) + t + ta.value.slice(e);
        ta.selectionStart = ta.selectionEnd = s + t.length;
        fit(); flush(); saveDraft(); toast('Pasted');
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
    function doSave() {
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
            else { cur = { id: Date.now().toString(36), title: v, text: ta.value, created: Date.now(), updated: Date.now(), pin: null }; notes.push(cur); curId = cur.id; }
            return saveNotes().then(function(ok) { if (!ok) return failed(); saveDraft(); renderPills(); toast('Note saved'); });
          } }
        ]
      });
    }

    /* ===== NOTE ACTIONS PAGE ===== */
    function actNote() { return actId ? findNote(actId) : null; }
    function showActions(id) {
      var n = findNote(id);
      if (!n) return;
      actId = id;
      Q('#dvNpActTitle').textContent = n.title;
      Q('#dvNpPinState').textContent = n.pin ? 'On' : 'Off';
      Q('#dvNpMenu').hidden = true;
      Q('#dvNpActions').classList.add('dv-np-on');
      history.pushState({ dvAct: 1 }, '');
    }
    function hideActionsNow() { Q('#dvNpActions').classList.remove('dv-np-on'); actId = null; }
    function hideActions() { if (history.state && history.state.dvAct) history.back(); else hideActionsNow(); }
    function refreshAct() { var n = actNote(); if (n) { Q('#dvNpActTitle').textContent = n.title; Q('#dvNpPinState').textContent = n.pin ? 'On' : 'Off'; } }

    function actOpen() {
      var n = actNote(); if (!n) return;
      unlock(n, function() {
        flush(); setText(n.text); curId = n.id; saveDraft(); renderPills(); hideActions(); toast('Note opened');
      });
    }
    function actRename() {
      var n = actNote(); if (!n) return;
      dialog({
        title: 'Rename Note', input: { placeholder: 'Note title', value: n.title },
        buttons: [
          { label: 'Cancel', cls: 'black' },
          { label: 'Save', cls: 'green', onClick: function(v) {
            v = v.trim();
            if (!v) { toast('Enter a title'); return false; }
            n.title = v; n.updated = Date.now();
            return saveNotes().then(function(ok) { if (!ok) return failed(); renderPills(); refreshAct(); toast('Note renamed'); });
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
          return hash(v, salt).then(function(hx) { n.pin = { s: salt, h: hx }; return saveNotes(); })
            .then(function(ok) { if (!ok) return failed(); renderPills(); refreshAct(); toast('PIN saved'); });
        } }
      ];
      if (n.pin) btns.push({ label: 'Remove PIN', cls: 'red', onClick: function() {
        n.pin = null;
        return saveNotes().then(function(ok) { if (!ok) return failed(); renderPills(); refreshAct(); toast('PIN removed'); });
      } });
      dialog({ title: n.pin ? 'Change PIN' : 'Set PIN', message: 'Choose a 4-digit PIN to lock this note.', input: { pin: true, placeholder: '4-digit PIN' }, buttons: btns });
    }
    function actPin() {
      var n = actNote(); if (!n) return;
      if (n.pin) unlock(n, function() { setPinDialog(n); }, 'Enter current PIN');
      else setPinDialog(n);
    }
    function actDelete() {
      var n = actNote(); if (!n) return;
      dialog({
        title: 'Delete Note', message: 'Delete "' + n.title + '" permanently? This cannot be undone.',
        buttons: [
          { label: 'Cancel', cls: 'blue' },
          { label: 'Delete', cls: 'red', onClick: function() {
            notes = notes.filter(function(x) { return x.id !== n.id; });
            if (curId === n.id) curId = null;
            return saveNotes().then(function(ok) { if (!ok) return failed(); saveDraft(); renderPills(); hideActions(); toast('Note deleted'); });
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
    function b64u(u8) { var x = ''; for (var i = 0; i < u8.length; i++) x += String.fromCharCode(u8[i]); return btoa(x).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); }
    function encode(o) {
      var raw = new TextEncoder().encode(JSON.stringify(o));
      if (window.CompressionStream) { try { var cs = new CompressionStream('deflate-raw'), w = cs.writable.getWriter(); w.write(raw); w.close(); return new Response(cs.readable).arrayBuffer().then(function(b) { return 'z' + b64u(new Uint8Array(b)); }); } catch (e) {} }
      return Promise.resolve('p' + b64u(raw));
    }
    function appBase() { return location.origin + location.pathname.replace(/index\.html$/, '').replace(/note\/[^/]*\/?$/, ''); }
    function sendLink(url, title) {
      var d = { title: title, text: title, url: url };
      (navigator.share ? navigator.share(d) : Promise.reject()).catch(function(e) {
        if (e && e.name === 'AbortError') return;
        (navigator.clipboard ? navigator.clipboard.writeText(url) : Promise.reject()).then(function() { toast('Link copied. Paste it to share.'); }, function() { toast('Could not share the link'); });
      });
    }
    function shareLink(n) {
      spin(true);
      encode({ t: n.title, x: n.text, u: n.updated }).then(function(p) {
        spin(false);
        var slug = String(n.title).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'note';
        var pretty = appBase() + 'note/' + slug + '-' + n.id + '#n=' + p, fallback = appBase() + '#/note/' + n.id + '/' + p;
        if (pretty.length > 6000) { toast('This note is too long for a link. Use Export instead.'); return; }
        dialog({ title: 'Share note link', message: 'Anyone with the link can read this note. Use the fallback link if the clean link does not open.',
          buttons: [{ label: 'Cancel', cls: 'black' }, { label: 'Fallback link', cls: 'blue', onClick: function() { sendLink(fallback, n.title); } }, { label: 'Clean link', cls: 'green', onClick: function() { sendLink(pretty, n.title); } }] });
      }, function() { spin(false); toast('Could not create the link'); });
    }
    function doShare(kind) {
      var n = actNote(); if (!n) return;
      if (kind === 'x') { Q('#dvNpMenu').hidden = true; toast('Share menu closed'); return; }
      unlock(n, function() {
        Q('#dvNpMenu').hidden = true;
        if (kind === 'lnk') shareLink(n);
        else if (kind === 'wa') shareWA(n);
        else if (kind === 'bt') shareBT(n);
        else shareImport(n);
      });
    }

    /* ===== EVENTS ===== */
    var ed = Q('#dvNpEditor');
    ed.addEventListener('input', function() {
      fit();
      clearTimeout(histTimer);
      histTimer = setTimeout(function() { flush(); saveDraft(); }, 500);
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
      else if (k === 'exit') closeEd();
    });
    Q('#dvNpPills').addEventListener('click', function(e) {
      var p = e.target.closest('[data-dvid]'); if (p) showActions(p.getAttribute('data-dvid'));
    });
    Q('#dvNpSave').addEventListener('click', doSave);
    Q('#dvNpBack').addEventListener('click', closeEd);
    Q('#dvNpFile').addEventListener('change', onImportFile);
    Q('#dvNpActBack').addEventListener('click', hideActions);
    Q('#dvNpActions').addEventListener('click', function(e) {
      var s = e.target.closest('[data-dvsh]');
      if (s) { doShare(s.getAttribute('data-dvsh')); return; }
      var r = e.target.closest('[data-dvact]'); if (!r) return;
      var k = r.getAttribute('data-dvact');
      if (k === 'open') actOpen();
      else if (k === 'rename') actRename();
      else if (k === 'pin') actPin();
      else if (k === 'delete') actDelete();
      else if (k === 'share') { var m = Q('#dvNpMenu'); m.hidden = !m.hidden; }
    });
    window.addEventListener('popstate', function() { if (Q('#dvNpActions').classList.contains('dv-np-on')) hideActionsNow(); });
    document.addEventListener('visibilitychange', function() { if (document.hidden) { flush(); saveDraft(); } });

    /* ===== OPEN / CLOSE: full-page modal (100dvw x 100dvh) ===== */
    var isOpen = false;
    function show() { if (!isOpen) { isOpen = true; Q('#dvNpPage').classList.add('dv-np-on'); history.pushState({ dvE: 1 }, ''); } fit(); }
    function openEd(o) {
      o = o || {};
      loadNotes(function() {
        if (o.id) {
          var n = findNote(o.id); if (!n) { toast('Note not found'); return; }
          unlock(n, function() { flush(); setText(n.text); curId = n.id; resetHistory(); saveDraft(); renderPills(); show(); });
          return;
        }
        if (o.text != null) { ed.value = o.text; curId = null; resetHistory(); fit(); saveDraft(); renderPills(); show(); toast('Template ready. Tap SAVE to keep it.'); return; }
        readDraft(function(d) { ed.value = d && d.text ? d.text : ''; curId = d && d.id && findNote(d.id) ? d.id : null; resetHistory(); fit(); renderPills(); show(); });
      });
    }
    function closeEd() { if (isOpen) history.back(); }
    function closeNow() { flush(); saveDraft(); hideActionsNow(); closeDlg(); Q('#dvNpPage').classList.remove('dv-np-on'); isOpen = false; emit('dv:notes:changed'); }
    window.addEventListener('popstate', function() { if (isOpen && !(history.state && history.state.dvE)) closeNow(); });
    document.addEventListener('dv:note:new', function() { openEd({}); });
    document.addEventListener('dv:editor:open', function(e) { openEd(e.detail || {}); });
    document.addEventListener('pointerdown', function(e) { if (e.target.closest && e.target.closest('.dv-np button,.dv-np-dlg button')) buzz(10); }, { passive: true });
  } catch (e) { try { document.dispatchEvent(new CustomEvent('dv:toast', { detail: { msg: 'Notepad failed to start' } })); } catch (x) {} }
})();
