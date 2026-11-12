/* Debora Note core shell. Modules attach only through window.DV. */
(function () {
  var D = document, $ = function (s) { return D.querySelector(s); };
  var P = {
    menu: '<path d="M3 6h18M3 12h18M3 18h18"/>', dots: '<circle cx="12" cy="5" r="1.6" fill="currentColor"/><circle cx="12" cy="12" r="1.6" fill="currentColor"/><circle cx="12" cy="19" r="1.6" fill="currentColor"/>',
    back: '<path d="M19 12H5M12 19l-7-7 7-7"/>', home: '<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
    edit: '<path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>', more: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
    file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/>', clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
    lock: '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>', info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>', help: '<circle cx="12" cy="12" r="10"/><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3M12 17h.01"/>',
    shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>', heart: '<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1.1L12 21l7.8-7.5 1-1.1a5.5 5.5 0 0 0 0-7.8z"/>',
    mail: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="M22 6l-10 7L2 6"/>', list: '<path d="M9 6h12M9 12h12M9 18h12M3 6l1 1 2-2M3 12l1 1 2-2M3 18l1 1 2-2"/>',
    moon: '<path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8z"/>', share: '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4"/>',
    dl: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>'
  };
  function ic(n) { return '<svg viewBox="0 0 24 24">' + P[n] + '</svg>'; }
  D.querySelectorAll('[data-ic]').forEach(function (e) { e.innerHTML = ic(e.getAttribute('data-ic')); });
  $('#btnLeft').innerHTML = ic('menu'); $('#btnRight').innerHTML = ic('dots');

  var tt, routes = {}, pages = [];
  function toast(m) { var t = $('#toast'); t.innerHTML = '<span style="display:inline-block;background:#121212;color:#fff;padding:14px 22px;border-radius:16px"></span>'; t.firstChild.textContent = m; t.className = 'on'; clearTimeout(tt); tt = setTimeout(function () { t.className = ''; }, 1800); }
  function buzz(n) { try { navigator.vibrate && navigator.vibrate(n || 15); } catch (e) {} }
  function busy(on) { $('#spin').className = on ? 'on' : ''; }

  /* Full-screen page stack. Android Back (or the arrow) closes the top page only. */
  function page(title, html) {
    var el = D.createElement('section'); el.className = 'page';
    el.innerHTML = '<header class="bar"><button class="ib" data-back aria-label="Back">' + ic('back') + '</button><b style="text-align:left">' + title + '</b></header><div class="pbody">' + html + '</div>';
    $('#pages').appendChild(el); pages.push(el); history.pushState({ dn: pages.length }, ''); buzz(10); return el;
  }
  window.addEventListener('popstate', function () { var e = pages.pop(); if (e) e.remove(); });
  D.addEventListener('click', function (e) { if (e.target.closest('[data-back]')) history.back(); });

  function rows(list) { return list.map(function (r, i) { return '<button class="row" data-r="' + i + '">' + ic(r[0]) + '<span>' + r[1] + '</span>' + (r[3] || '') + '</button>'; }).join(''); }
  function menu(title, list) {
    var el = page(title, rows(list));
    el.addEventListener('click', function (e) { var b = e.target.closest('[data-r]'); if (!b) return; buzz(); list[+b.getAttribute('data-r')][2](b); });
  }
  function txt(h, p) { return '<div class="txt"><h2>' + h + '</h2>' + p.map(function (x) { return '<p>' + x + '</p>'; }).join('') + '</div>'; }

  /* Left menu: public information */
  var ORG = 'Your Organization Name';
  function contacts() { return '<div class="contacts"><button class="cb" style="background:#EA4335" aria-label="Gmail">G</button><button class="cb" style="background:#25D366" aria-label="WhatsApp">W</button><button class="cb" style="background:#34A853" aria-label="Phone">P</button><button class="cb" style="background:#1877F2" aria-label="Facebook">f</button></div>'; }
  var left = [
    ['info', 'About the App', function () { page('About the App', txt('Debora Note', ['A fast, private notepad built for Android. Notes are stored on your phone and protected from cache clearing.', 'Version 1.0.0'])); }],
    ['user', 'About Developer', function () {
      var el = page('About Developer', '<div class="dev"><div class="ringw"><div class="gear"></div><img src="DEVELOPER_PHOTO_URL_HERE" alt="Developer"></div><h2>Developer Name</h2><div class="role">Software Developer</div><div class="bio clip"><p>Replace this with the developer biography.</p><p>Add a second paragraph about experience and mission.</p><p>Add a third paragraph about contact and vision.</p></div><button class="btn" style="margin:12px 0;width:100%" id="more">Show More</button></div>');
      el.querySelector('#more').onclick = function () { var b = el.querySelector('.bio'); b.classList.toggle('clip'); this.textContent = b.classList.contains('clip') ? 'Show More' : 'Show Less'; };
    }],
    ['help', 'How to Use', function () { page('How to Use', txt('Getting started', ['1. Open the Editor tab and tap the plus button to take a note.', '2. Choose Note Template for ready-made layouts.', '3. Saved notes appear above the toolbar and on the Editor page.', '4. Open the right menu for dark mode, to-do list, sharing and install.'])); }],
    ['shield', 'Terms of Use', function () { page('Terms of Use', txt('Terms', ['Replace with your organization terms of use.', 'Your notes stay on your device. ' + ORG + ' does not read them.'])); }],
    ['heart', 'Support Us', function () { page('Support Us', txt(ORG, ['Replace with your mission and how supporters can help.']) + contacts()); }],
    ['mail', 'Contact Us', function () { page('Contact Us', txt(ORG, ['Replace with your address, hours and contact details.']) + contacts()); }]
  ];
  $('#btnLeft').onclick = function () { menu('Menu', left); };

  /* Right menu */
  var dark = false;
  function kdb() { return new Promise(function (res, rej) { var r = indexedDB.open('deboranote-core', 1); r.onupgradeneeded = function () { r.result.createObjectStore('kv'); }; r.onsuccess = function () { res(r.result); }; r.onerror = rej; }); }
  function theme(d) { dark = d; D.documentElement.setAttribute('data-theme', d ? 'dark' : 'light'); kdb().then(function (x) { x.transaction('kv', 'readwrite').objectStore('kv').put(d ? 'dark' : 'light', 'theme'); }).catch(function () {}); }
  kdb().then(function (x) { var g = x.transaction('kv').objectStore('kv').get('theme'); g.onsuccess = function () { if (g.result === 'dark') { dark = true; D.documentElement.setAttribute('data-theme', 'dark'); } }; }).catch(function () {});
  var inst = null;
  window.addEventListener('beforeinstallprompt', function (e) { e.preventDefault(); inst = e; });
  function sharePage() {
    var u = location.origin + location.pathname, t = 'Debora Note - a powerful Android notepad';
    var ch = [
      ['share', 'WhatsApp', function () { window.open('https://wa.me/?text=' + encodeURIComponent(t + ' ' + u)); }],
      ['share', 'Facebook', function () { window.open('https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(u)); }],
      ['share', 'Twitter', function () { window.open('https://twitter.com/intent/tweet?text=' + encodeURIComponent(t) + '&url=' + encodeURIComponent(u)); }],
      ['share', 'Bluetooth', function () { nat(); }],
      ['share', 'Android share sheet', function () { nat(); }]
    ];
    function nat() { if (navigator.share) navigator.share({ title: 'Debora Note', text: t, url: u }).catch(function () {}); else toast('Sharing is not supported here'); }
    menu('Share App', ch);
  }
  function installPage() {
    var el = page('Install App', txt('Install Debora Note', ['Add the app to your home screen for full-screen, offline use.']) + '<button class="btn" id="ins">Install App</button>');
    el.querySelector('#ins').onclick = function () {
      if (!inst) { toast('Use the browser menu, then Add to Home screen'); return; }
      busy(true); inst.prompt(); inst.userChoice.then(function (c) { busy(false); toast(c.outcome === 'accepted' ? 'App installed' : 'Cancelled'); inst = null; });
    };
  }
  $('#btnRight').onclick = function () {
    menu('Options', [
      ['user', 'Guest account', function () { toast('Account sign-in is not set up'); }],
      ['list', 'To-Do List', function () { DV.open('todo'); }],
      ['moon', 'Dark mode', function (b) { theme(!dark); b.querySelector('.sw').classList.toggle('on', dark); }, '<i class="sw' + (dark ? ' on' : '') + '"></i>'],
      ['share', 'Share App', sharePage],
      ['dl', 'Install App', installPage]
    ]);
  };

  /* Tabs */
  D.querySelectorAll('.nb').forEach(function (b) {
    b.onclick = function () {
      buzz(8);
      D.querySelectorAll('.nb,.view').forEach(function (x) { x.classList.remove('on'); });
      b.classList.add('on'); $('#v-' + b.getAttribute('data-v')).classList.add('on');
    };
  });
  D.querySelectorAll('[data-q]').forEach(function (b) {
    b.onclick = function () { buzz(); if (window.DV.onQuick) DV.onQuick(b.getAttribute('data-q')); else toast('Notepad module not installed'); };
  });

  /* Persistent storage: ask the browser not to evict notes or to-dos */
  try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist(); } catch (e) {}
  try { if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js'); } catch (e) {}

  window.DV = {
    toast: toast, buzz: buzz, busy: busy, page: page, menu: menu, icon: ic,
    mount: function (id) { return $('#' + id); },
    route: function (n, fn) { routes[n] = fn; },
    open: function (n) { if (routes[n]) routes[n](); else toast('Module not installed'); }
  };
})();
