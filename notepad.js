/* Notepad + To-Do module. Own CSS, HTML, JS. Everything is stored in IndexedDB. Needs only window.DV. */
(function () {
  try {
    var V = window.DV, M = document.getElementById('editorMount');
    if (!V || !M) return;
    var D = document, $ = function (s, r) { return (r || D).querySelector(s); };
    var notes = [];
    function ic(p) { return '<svg viewBox="0 0 24 24">' + p + '</svg>'; }
    var I = { dots: '<circle cx="12" cy="5" r="1.6" fill="currentColor"/><circle cx="12" cy="12" r="1.6" fill="currentColor"/><circle cx="12" cy="19" r="1.6" fill="currentColor"/>', plus: '<path d="M12 5v14M5 12h14"/>', pen: '<path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>', book: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5z"/><path d="M6.5 17H20v4H6.5a2.5 2.5 0 0 1 0-4z"/>', del: '<path d="M3 6h18M19 6l-1 14H6L5 6M9 6V3h6v3"/>', save: '<path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><path d="M17 21v-8H7v8M7 3v5h8"/>' };

    /* ---- IndexedDB ---- */
    function open() { return new Promise(function (res, rej) { var r = indexedDB.open('deboranote', 1); r.onupgradeneeded = function () { r.result.createObjectStore('notes', { keyPath: 'id' }); r.result.createObjectStore('todos', { keyPath: 'id' }); }; r.onsuccess = function () { res(r.result); }; r.onerror = rej; }); }
    function tx(s, m, f) { return open().then(function (d) { return new Promise(function (res, rej) { var t = d.transaction(s, m), o = f(t.objectStore(s)); t.oncomplete = function () { res(o && o.result); }; t.onerror = rej; }); }); }
    function all(s) { return tx(s, 'readonly', function (o) { return o.getAll(); }); }
    function put(s, v) { return tx(s, 'readwrite', function (o) { return o.put(v); }); }
    function rem(s, k) { return tx(s, 'readwrite', function (o) { return o.delete(k); }); }

    /* ---- styles ---- */
    var st = D.createElement('style');
    st.textContent =
      '.np{position:relative;min-height:100%;padding-bottom:110px}.np-top{display:flex;align-items:center;gap:8px;padding:8px 8px 0;position:relative}.np-top b{font-size:1.15rem}' +
      '.np-dd{position:absolute;left:8px;top:60px;z-index:50;min-width:250px;background:var(--bg);border:1px solid var(--ol);border-radius:16px;box-shadow:0 8px 28px rgba(0,0,0,.3);display:none;overflow:hidden}.np-dd.on{display:block}' +
      '.np-dd div,.np-dd button{display:flex;align-items:center;justify-content:space-between;gap:20px;width:100%;padding:16px 18px;border-bottom:1px solid var(--ol);text-align:left;font-weight:500}.np-dd b{color:var(--blue)}' +
      '.np-strip{display:flex;gap:8px;overflow-x:auto;padding:12px;scrollbar-width:none}.np-strip::-webkit-scrollbar{display:none}' +
      '.np-pill{flex:none;max-width:70vw;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;padding:8px 16px;border-radius:999px;border:2px solid var(--blue);color:var(--blue);font-weight:700}' +
      '.np-card{display:flex;align-items:flex-start;gap:8px;margin:0 12px 12px;padding:16px 8px 16px 18px;border-radius:20px;background:var(--sf);border:1px solid var(--ol)}.np-card:active{opacity:.8}' +
      '.np-cb{flex:1;min-width:0;text-align:left}.np-cb b{display:block;font-size:1.1rem;overflow:hidden;white-space:nowrap;text-overflow:ellipsis}.np-cb p{margin-top:4px;color:var(--sub);display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}' +
      '.np-empty{padding:40px 20px;text-align:center;color:var(--sub);line-height:1.5}' +
      '.np-fab{position:fixed;right:20px;bottom:calc(96px + env(safe-area-inset-bottom));z-index:60;width:72px;height:72px;border-radius:22px;background:var(--blue);color:#fff;display:flex;align-items:center;justify-content:center;box-shadow:0 6px 18px rgba(0,0,0,.35)}.np-fab svg{width:36px;height:36px}.np-fab:active{opacity:.85}' +
      '.np-fm{position:fixed;right:20px;bottom:calc(178px + env(safe-area-inset-bottom));z-index:60;background:var(--bg);border:1px solid var(--ol);border-radius:18px;box-shadow:0 8px 28px rgba(0,0,0,.3);display:none;overflow:hidden}.np-fm.on{display:block}' +
      '.np-fm button{display:flex;align-items:center;gap:14px;width:100%;padding:18px 22px;font-weight:600;white-space:nowrap}.np-fm button+button{border-top:1px solid var(--ol)}.np-fm svg{color:var(--blue)}' +
      '.np-ed{display:flex;flex-direction:column;height:100%}.np-ed textarea,.np-td textarea{flex:1;width:100%;border:0;outline:0;resize:none;padding:16px;background:var(--bg);color:var(--tx);font:inherit;font-size:1.2rem;line-height:1.6}' +
      '.np-sv{display:flex;align-items:center;justify-content:center;gap:10px;margin:10px 12px;padding:14px;border-radius:16px;background:var(--blue);color:#fff;font-weight:800}.np-sv:active{opacity:.8}' +
      '.np-dlg{position:fixed;inset:0;z-index:250;background:rgba(0,0,0,.6);display:flex;align-items:center;justify-content:center;padding:20px}.np-dc{width:100%;background:var(--bg);color:var(--tx);border-radius:20px;padding:22px}.np-dc h3{font-size:1.25rem;margin-bottom:10px}.np-dc p{color:var(--sub);margin-bottom:14px;line-height:1.5}' +
      '.np-dc input{width:100%;padding:14px;margin-bottom:16px;border:2px solid var(--ol);border-radius:12px;background:var(--sf);color:var(--tx);font:inherit;outline:0}.np-dc input:focus{border-color:var(--blue)}' +
      '.np-bs{display:flex;gap:10px}.np-bs button{flex:1;padding:14px;border-radius:12px;color:#fff;font-weight:700}.np-bs button:active{opacity:.8}' +
      '.np-td{display:flex;flex-direction:column;height:100%}.np-td textarea{flex:none;height:30dvh;border-bottom:1px solid var(--ol)}.np-tl{flex:1;overflow-y:auto}.np-cnt{padding:0 16px 4px;color:var(--sub);text-align:right}';
    D.head.appendChild(st);

    /* ---- helpers ---- */
    function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
    function dlg(o) {
      var w = D.createElement('div'); w.className = 'np-dlg';
      w.innerHTML = '<div class="np-dc"><h3>' + esc(o.title) + '</h3>' + (o.msg ? '<p>' + esc(o.msg) + '</p>' : '') + (o.input ? '<input type="text" maxlength="60" placeholder="' + esc(o.input) + '" value="' + esc(o.value || '') + '">' : '') +
        '<div class="np-bs"><button style="background:#000" data-x>Cancel</button><button style="background:' + (o.red ? '#DC2626' : '#16A34A') + '" data-ok>' + esc(o.ok) + '</button></div></div>';
      D.body.appendChild(w);
      var i = $('input', w); if (i) setTimeout(function () { i.focus(); }, 50);
      w.onclick = function (e) {
        if (e.target === w || e.target.hasAttribute('data-x')) { w.remove(); return; }
        if (e.target.hasAttribute('data-ok')) { var v = i ? i.value.trim() : ''; if (i && !v) { V.toast('Enter a title'); return; } V.buzz(); w.remove(); o.go(v); }
      };
    }
    function refresh() { return all('notes').then(function (a) { notes = a.sort(function (x, y) { return y.updated - x.updated; }); render(); }); }

    /* ---- landing ---- */
    M.innerHTML = '<div class="np"><div class="np-top"><button class="ib" id="npDots" aria-label="Counters" style="color:var(--blue)">' + ic(I.dots) + '</button><b>Saved notes</b><div class="np-dd" id="npDD"></div></div><div class="np-strip" id="npStrip"></div><div id="npList"></div></div>' +
      '<button class="np-fab" id="npFab" aria-label="New">' + ic(I.plus) + '</button><div class="np-fm" id="npFm"><button data-a="note">' + ic(I.pen) + 'Take Note</button><button data-a="tpl">' + ic(I.book) + 'Note Template</button></div>';
    function render() {
      $('#npStrip').innerHTML = notes.length ? notes.map(function (n) { return '<button class="np-pill" data-id="' + n.id + '">' + esc(n.title) + '</button>'; }).join('') : '<span style="color:var(--sub)">No saved notes yet</span>';
      $('#npList').innerHTML = notes.length ? notes.map(function (n) { return '<div class="np-card"><button class="np-cb" data-id="' + n.id + '"><b>' + esc(n.title) + '</b><p>' + esc(n.text.replace(/\s+/g, ' ').slice(0, 140)) + '</p></button><button class="ib" data-del="' + n.id + '" aria-label="Delete" style="color:#DC2626">' + ic(I.del) + '</button></div>'; }).join('') : '<div class="np-empty">No notes yet. Tap the plus button to write your first note.</div>';
    }
    function stats() {
      var w = 0, c = 0, s = 0, p = 0;
      notes.forEach(function (n) { var t = n.text; w += (t.match(/\S+/g) || []).length; c += t.length; s += (t.match(/[^.!?]*[.!?]+/g) || []).length; p += t.split(/\n+/).filter(function (x) { return x.trim(); }).length; });
      return [['Word counter', w], ['Character counter', c], ['Sentence counter', s], ['Paragraph counter', p]];
    }
    $('#npDots').onclick = function () {
      var d = $('#npDD'); V.buzz(8);
      if (d.classList.contains('on')) { d.classList.remove('on'); return; }
      d.innerHTML = stats().map(function (r) { return '<div><span>' + r[0] + '</span><b>' + r[1] + '</b></div>'; }).join(''); d.classList.add('on');
    };
    $('#npFab').onclick = function () { V.buzz(); $('#npFm').classList.toggle('on'); };
    $('#npFm').onclick = function (e) { var b = e.target.closest('[data-a]'); if (!b) return; $('#npFm').classList.remove('on'); if (b.dataset.a === 'note') editor(null, ''); else templates(); };
    M.onclick = function (e) {
      var del = e.target.closest('[data-del]'), op = e.target.closest('[data-id]');
      if (del) { var n = find(del.dataset.del); dlg({ title: 'Delete Note', msg: 'Delete "' + n.title + '" permanently?', ok: 'Delete', red: 1, go: function () { rem('notes', n.id).then(function () { V.toast('Note deleted'); return refresh(); }); } }); }
      else if (op) editor(find(op.dataset.id), '');
    };
    function find(id) { return notes.filter(function (n) { return n.id === id; })[0]; }

    /* ---- editor ---- */
    function editor(n, seed) {
      var el = V.page(n ? esc(n.title) : 'Note Editor', '<div class="np-ed"><textarea placeholder="Start writing..." spellcheck="true"></textarea><button class="np-sv">' + ic(I.save) + 'SAVE</button></div>');
      var ta = $('textarea', el); ta.value = n ? n.text : seed;
      $('.np-sv', el).onclick = function () {
        if (!ta.value.trim()) { V.toast('Write something first'); return; }
        dlg({ title: 'Save Note', input: 'Note title', value: n ? n.title : '', ok: 'Save', go: function (t) {
          V.busy(true);
          var rec = { id: n ? n.id : Date.now().toString(36), title: t, text: ta.value, updated: Date.now() };
          put('notes', rec).then(function () { n = rec; V.busy(false); V.toast('Note saved'); return refresh(); }).catch(function () { V.busy(false); V.toast('Could not save'); });
        } });
      };
    }

    /* ---- templates ---- */
    var T = [['Meeting Notes', 'Meeting:\nDate:\nAttendees:\n\nAgenda:\n\nDecisions:\n\nAction items:\n'], ['Daily Journal', 'Date:\n\nToday I am grateful for:\n\nWhat happened today:\n\nTomorrow I will:\n'], ['Sermon Outline', 'Title:\nScripture:\n\nIntroduction:\n\nPoint 1:\nPoint 2:\nPoint 3:\n\nConclusion:\n'], ['Prayer List', 'Praise:\n\nThanksgiving:\n\nRequests:\n\nAnswered prayers:\n'], ['Shopping List', 'Groceries:\n\nHousehold:\n\nOther:\n'], ['Study Notes', 'Subject:\nTopic:\n\nKey ideas:\n\nQuestions:\n\nSummary:\n'], ['Project Plan', 'Project:\nGoal:\n\nTasks:\n\nDeadline:\n\nResources:\n'], ['Goal Tracker', 'Goal:\nWhy it matters:\n\nSteps:\n\nProgress:\n'], ['Event Planner', 'Event:\nDate and time:\nVenue:\n\nGuests:\n\nBudget:\n\nChecklist:\n'], ['Letter', 'Dear ,\n\n\n\nYours sincerely,\n']];
    function templates() {
      var el = V.page('Note Template', T.map(function (t, i) { return '<button class="row" data-t="' + i + '">' + ic(I.book) + '<span>' + t[0] + '</span></button>'; }).join(''));
      el.onclick = function (e) { var b = e.target.closest('[data-t]'); if (b) { V.buzz(); editor(null, T[+b.dataset.t][1]); } };
    }

    /* ---- to-do ---- */
    function todo() {
      var el = V.page('To-Do List', '<div class="np-td"><textarea maxlength="500" placeholder="Write a task. Up to 500 characters."></textarea><div class="np-cnt">0/500</div><button class="np-sv">' + ic(I.plus) + 'ADD TASK</button><div class="np-tl"></div></div>');
      var ta = $('textarea', el), tl = $('.np-tl', el);
      function draw() { all('todos').then(function (a) { a.sort(function (x, y) { return y.id - x.id; }); tl.innerHTML = a.length ? a.map(function (t) { return '<div class="np-card" style="margin-top:12px"><div class="np-cb" style="white-space:pre-wrap;word-break:break-word">' + esc(t.text) + '</div><button class="ib" data-d="' + t.id + '" aria-label="Delete" style="color:#DC2626">' + ic(I.del) + '</button></div>'; }).join('') : '<div class="np-empty">No tasks yet.</div>'; }); }
      ta.oninput = function () { $('.np-cnt', el).textContent = ta.value.length + '/500'; };
      $('.np-sv', el).onclick = function () { var v = ta.value.trim(); if (!v) { V.toast('Write a task first'); return; } put('todos', { id: Date.now(), text: v }).then(function () { ta.value = ''; ta.oninput(); V.toast('Task added'); draw(); }); };
      tl.onclick = function (e) { var b = e.target.closest('[data-d]'); if (b) dlg({ title: 'Delete Task', msg: 'Delete this task?', ok: 'Delete', red: 1, go: function () { rem('todos', +b.dataset.d).then(function () { V.toast('Task deleted'); draw(); }); } }); };
      draw();
    }
    V.route('todo', todo);
    V.onQuick = function (k) {
      D.querySelector('.nb[data-v=editor]').click();
      if (k === 'take') editor(null, '');
      else if (k === 'locked') V.toast('Locked notes are not available yet');
    };
    refresh();
    try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist(); } catch (e) {}
  } catch (e) {}
})();
