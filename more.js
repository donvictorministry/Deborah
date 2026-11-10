/* ===== MODULE: more.js (More tab: Text to Image, Calculator, Calendar). Self-contained. =====
   Needs only the empty container #dv-view-more. Uses no other file, no storage, no events. */
(function () {
'use strict';
var host = document.getElementById('dv-view-more');
if (!host) return;

var CSS = '.dvm,.dvm-pg{--dvm-p:var(--dv-p,#1877F2);--dvm-op:var(--dv-op,#fff);--dvm-pc:var(--dv-pc,#D6E4FF);--dvm-opc:var(--dv-opc,#001B3E);--dvm-bg:var(--dv-bg,#FDFBFF);--dvm-sf:var(--dv-sf,#F1F3FA);--dvm-sv:var(--dv-sv,#E1E2EC);--dvm-ol:var(--dv-ol,#74777F);--dvm-tx:var(--dv-tx,#1A1C1E);--dvm-tx2:var(--dv-tx2,#44474E);font-family:Roboto,sans-serif;font-size:1rem;color:var(--dvm-tx)}' +
'.dvm{padding:16px;display:flex;flex-direction:column;gap:14px}' +
'.dvm button,.dvm-pg button,.dvm-pg input,.dvm-pg textarea{font:inherit;color:inherit}' +
'.dvm button,.dvm-pg button{border:0;cursor:pointer;touch-action:manipulation;-webkit-user-select:none;user-select:none}' +
'.dvm button:active,.dvm-pg button:active{box-shadow:inset 0 0 0 100vmax rgba(128,128,128,.24)}' +
'.dvm-tile{display:flex;align-items:center;gap:16px;width:100%;min-height:104px;padding:18px 20px;border-radius:28px;background:var(--dvm-sf);box-shadow:0 1px 3px rgba(0,0,0,.22);text-align:left}' +
'.dvm-ic{width:64px;height:64px;border-radius:20px;background:var(--dvm-pc);color:var(--dvm-opc);display:grid;place-items:center;flex:none}' +
'.dvm-ic svg{width:34px;height:34px}' +
'.dvm-tile b{display:block;font-size:1.2rem;font-weight:500}.dvm-tile small{display:block;font-size:1rem;color:var(--dvm-tx2)}' +
'.dvm-pg{position:fixed;top:0;left:0;width:100dvw;height:100dvh;z-index:120;display:flex;flex-direction:column;background:var(--dvm-bg)}' +
'.dvm-pg[hidden],.dvm-toast[hidden],.dvm-scrim[hidden]{display:none!important}' +
'.dvm-top{flex-shrink:0;display:flex;align-items:center;gap:4px;background:var(--dvm-sf);padding:env(safe-area-inset-top) 4px 0;min-height:calc(64px + env(safe-area-inset-top))}' +
'.dvm-top h2{margin:0 0 0 4px;flex:1;font-size:1.25rem;font-weight:500}' +
'.dvm-ib{width:48px;height:48px;border-radius:50%;background:transparent;display:grid;place-items:center;flex:none;padding:0}' +
'.dvm-ib svg{width:28px;height:28px}' +
'.dvm-body{flex:1;overflow:auto;padding:12px 16px calc(16px + env(safe-area-inset-bottom))}' +
'.dvm-btn{min-height:52px;padding:0 26px;border-radius:26px;background:var(--dvm-p);color:var(--dvm-op);font-weight:500;margin:0 8px 8px 0}' +
'.dvm-btn.o{background:transparent;color:var(--dvm-p);border:1px solid var(--dvm-ol)}' +
'.dvm-row{display:flex;gap:8px;overflow-x:auto;scrollbar-width:none;padding:4px 0 10px}.dvm-row::-webkit-scrollbar{display:none}' +
'.dvm-chip{flex:none;min-height:44px;padding:0 18px;border-radius:12px;border:1px solid var(--dvm-ol)!important;background:transparent;font-weight:500}' +
'.dvm-chip.on{background:var(--dvm-pc);color:var(--dvm-opc);border-color:transparent!important}' +
'.dvm-cv{display:block;width:100%;height:auto;border-radius:20px;box-shadow:0 2px 8px rgba(0,0,0,.25);margin:4px 0 14px;background:#ccc}' +
'.dvm-in{width:100%;border:1px solid var(--dvm-ol);border-radius:16px;background:var(--dvm-bg);color:var(--dvm-tx);padding:12px 16px;margin-bottom:12px;resize:none}' +
'.dvm-in:focus{outline:2px solid var(--dvm-p);border-color:var(--dvm-p)}' +
'.dvm-disp{padding:8px 20px 16px;text-align:right}.dvm-disp small{display:block;font-size:1rem;min-height:1.5em;color:var(--dvm-tx2);overflow:hidden;white-space:nowrap;text-overflow:ellipsis}' +
'.dvm-disp b{display:block;font-size:2.6rem;font-weight:400;overflow:hidden;white-space:nowrap}' +
'.dvm-keys{flex:1;min-height:0;display:grid;grid-template-columns:repeat(4,1fr);grid-auto-rows:1fr;gap:10px;padding:8px 12px calc(12px + env(safe-area-inset-bottom))}' +
'.dvm-key{border-radius:28px;background:var(--dvm-sf);font-size:1.5rem;font-weight:500}' +
'.dvm-key.op{background:var(--dvm-pc);color:var(--dvm-opc)}.dvm-key.eq{background:var(--dvm-p);color:var(--dvm-op)}.dvm-key.fn{background:var(--dvm-sv)}' +
'.dvm-cal{display:grid;grid-template-columns:repeat(7,1fr);gap:4px;text-align:center}' +
'.dvm-cal span{display:grid;place-items:center;min-height:52px;border-radius:26px}.dvm-cal .h{color:var(--dvm-tx2);font-weight:500;min-height:40px}' +
'.dvm-cal button{min-height:52px;border-radius:26px;background:transparent}' +
'.dvm-cal .t{border:2px solid var(--dvm-p)!important}.dvm-cal .s{background:var(--dvm-p);color:var(--dvm-op)}' +
'.dvm-toast{position:fixed;left:0;right:0;top:50%;transform:translateY(-50%);padding:0 24px;text-align:center;pointer-events:none;opacity:0;transition:opacity .2s;z-index:400;font-family:Roboto,sans-serif;font-size:1rem}' +
'.dvm-toast.on{opacity:1}.dvm-toast span{display:inline-block;padding:14px 24px;border-radius:24px;background:#323232;color:#fff}' +
'.dvm-scrim{position:fixed;top:0;left:0;width:100dvw;height:100dvh;background:rgba(0,0,0,.5);display:grid;place-items:center;z-index:260}' +
'.dvm-spin{width:56px;height:56px;border-radius:50%;border:6px solid var(--dvm-sv,#E1E2EC);border-top-color:var(--dvm-p,#1877F2);animation:dvmspin 1s linear infinite}@keyframes dvmspin{to{transform:rotate(360deg)}}';
var st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);

function h(t, p) {
  var e = document.createElement(t);
  for (var a in (p || {})) { if (a === 'class') e.className = p[a]; else if (a.slice(0, 2) === 'on') e.addEventListener(a.slice(2), p[a]); else e.setAttribute(a, p[a]); }
  for (var i = 2; i < arguments.length; i++) { var k = arguments[i]; if (Array.isArray(k)) e.append.apply(e, k); else if (k != null && k !== '') e.append(k); }
  return e;
}
function svg(p) { var w = h('span'); w.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + p + '</svg>'; return w.firstChild; }
function buzz(ms) { try { if (navigator.vibrate) navigator.vibrate(ms || 10); } catch (e) {} }
var IC = {
  back: '<line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>',
  img: '<rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>',
  calc: '<rect x="4" y="2" width="16" height="20" rx="3"/><line x1="8" y1="6" x2="16" y2="6"/><line x1="8" y1="11" x2="8.01" y2="11"/><line x1="12" y1="11" x2="12.01" y2="11"/><line x1="16" y1="11" x2="16.01" y2="11"/><line x1="8" y1="15" x2="8.01" y2="15"/><line x1="12" y1="15" x2="12.01" y2="15"/><line x1="16" y1="15" x2="16.01" y2="15"/>',
  cal: '<rect x="3" y="4" width="18" height="18" rx="3"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>',
  prev: '<polyline points="15 18 9 12 15 6"/>', next: '<polyline points="9 18 15 12 9 6"/>'
};
var tt, toastEl = h('div', { class: 'dvm-toast', role: 'status' });
function toast(m) { toastEl.replaceChildren(h('span', {}, m)); toastEl.classList.add('on'); clearTimeout(tt); tt = setTimeout(function () { toastEl.classList.remove('on'); }, 2200); }
var spinEl = h('div', { class: 'dvm-scrim', hidden: '' }, h('div', { class: 'dvm-spin', role: 'progressbar', 'aria-label': 'Working' }));
document.body.append(toastEl, spinEl);

/* ---------- full-page modal helper: back arrow far left, Android Back closes ---------- */
var openPg = null;
function modal(title, body, onOpen) {
  var pg = h('section', { class: 'dvm-pg', role: 'dialog', 'aria-modal': 'true', 'aria-label': title, hidden: '' },
    h('div', { class: 'dvm-top' }, h('button', { class: 'dvm-ib', 'aria-label': 'Back', onclick: function () { history.back(); } }, svg(IC.back)), h('h2', {}, title)), body);
  document.body.append(pg);
  return { open: function () { pg.hidden = false; openPg = pg; history.pushState({ dvM: 1 }, ''); if (onOpen) onOpen(); } };
}
window.addEventListener('popstate', function () { if (openPg && !(history.state && history.state.dvM)) { openPg.hidden = true; openPg = null; } });

/* ---------- Text to Image ---------- */
var STY = [['Ocean', '#1877F2', '#0B3C8C', '#FFFFFF'], ['Sunset', '#FF7A18', '#AF002D', '#FFFFFF'], ['Forest', '#2E7D32', '#0B3D1E', '#FFFFFF'], ['Royal', '#7B2FF7', '#2A0A6B', '#FFFFFF'], ['Night', '#1B1B1F', '#000000', '#FFFFFF'], ['Paper', '#FFF8E1', '#FFE0A3', '#3A2A00']];
var SIZ = [['Square', 1080, 1080], ['Story', 1080, 1920]];
function imageTool() {
  var si = 0, zi = 0, cv = h('canvas', { class: 'dvm-cv', 'aria-label': 'Preview' });
  var ta = h('textarea', { class: 'dvm-in', rows: '4', maxlength: '400', placeholder: 'Type your message', 'aria-label': 'Message' }, 'Be strong and courageous. The Lord your God is with you wherever you go.');
  var sig = h('input', { class: 'dvm-in', placeholder: 'Signature (optional)', maxlength: '60', 'aria-label': 'Signature', style: 'min-height:52px' });
  var sc = h('div', { class: 'dvm-row' }), zc = h('div', { class: 'dvm-row' });
  function wrap(ctx, text, w) {
    var out = [];
    text.split('\n').forEach(function (p) {
      var line = ''; p.split(/\s+/).forEach(function (wd) { var t = line ? line + ' ' + wd : wd; if (ctx.measureText(t).width > w && line) { out.push(line); line = wd; } else line = t; }); out.push(line);
    });
    return out;
  }
  function draw() {
    var s = STY[si], z = SIZ[zi], W = z[1], Hh = z[2], ctx = cv.getContext('2d'); cv.width = W; cv.height = Hh;
    var g = ctx.createLinearGradient(0, 0, W, Hh); g.addColorStop(0, s[1]); g.addColorStop(1, s[2]); ctx.fillStyle = g; ctx.fillRect(0, 0, W, Hh);
    ctx.fillStyle = s[3]; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    var txt = ta.value.trim() || 'Your message here', pad = 110, fs = 120, lines, lh;
    for (; fs >= 36; fs -= 4) { ctx.font = '500 ' + fs + 'px Roboto, sans-serif'; lines = wrap(ctx, txt, W - pad * 2); lh = fs * 1.3; if (lines.length * lh <= Hh - pad * 2 - 120) break; }
    var y = Hh / 2 - (lines.length * lh) / 2 + lh / 2 - (sig.value.trim() ? 30 : 0);
    lines.forEach(function (l, i) { ctx.fillText(l, W / 2, y + i * lh); });
    if (sig.value.trim()) { ctx.font = '400 44px Roboto, sans-serif'; ctx.globalAlpha = .85; ctx.fillText(sig.value.trim(), W / 2, Hh - 110); ctx.globalAlpha = 1; }
  }
  function chips(box, arr, get, set) { box.replaceChildren.apply(box, arr.map(function (a, i) { return h('button', { class: 'dvm-chip' + (get() === i ? ' on' : ''), onclick: function () { buzz(); set(i); chips(box, arr, get, set); draw(); } }, a[0]); })); }
  chips(sc, STY, function () { return si; }, function (i) { si = i; }); chips(zc, SIZ, function () { return zi; }, function (i) { zi = i; });
  ta.oninput = draw; sig.oninput = draw;
  function blob() { return new Promise(function (r) { cv.toBlob(r, 'image/png'); }); }
  function save() { blob().then(function (b) { var a = h('a', { href: URL.createObjectURL(b), download: 'message.png' }); document.body.append(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(a.href); }, 4000); toast('Image saved to your device'); buzz(20); }); }
  function share() {
    spinEl.hidden = false;
    blob().then(function (b) {
      spinEl.hidden = true; var f = new File([b], 'message.png', { type: 'image/png' });
      if (navigator.canShare && navigator.canShare({ files: [f] })) return navigator.share({ files: [f], title: 'Message' }).catch(function (e) { if (!e || e.name !== 'AbortError') toast('Sharing failed'); });
      toast('Sharing is not available. Saving instead.'); save();
    });
  }
  var body = h('div', { class: 'dvm-body' }, cv, ta, sig, h('b', { style: 'display:block;font-weight:500;margin:4px 0' }, 'Style'), sc, h('b', { style: 'display:block;font-weight:500;margin:4px 0' }, 'Size'), zc,
    h('button', { class: 'dvm-btn', onclick: share }, 'Share'), h('button', { class: 'dvm-btn o', onclick: save }, 'Save'));
  return modal('Text to Image', body, draw);
}

/* ---------- Calculator ---------- */
function calcTool() {
  var ex = '', res = '', fresh = false, expEl = h('small'), outEl = h('b', {}, '0');
  function evalx(s) {
    var i = 0;
    function num() { var m = /^\d*\.?\d+/.exec(s.slice(i)); if (!m) throw 0; i += m[0].length; return parseFloat(m[0]); }
    function unary() { if (s[i] === '-') { i++; return -unary(); } if (s[i] === '+') { i++; return unary(); } var v = num(); while (s[i] === '%') { i++; v /= 100; } return v; }
    function term() { var v = unary(); while (s[i] === '*' || s[i] === '/') { var o = s[i++], r = unary(); if (o === '/' && r === 0) throw 0; v = o === '*' ? v * r : v / r; } return v; }
    var v = term(); while (i < s.length) { var o = s[i++]; if (o !== '+' && o !== '-') throw 0; var r = term(); v = o === '+' ? v + r : v - r; }
    return v;
  }
  function fmt(v) { return String(parseFloat(v.toPrecision(12))); }
  function show() { expEl.textContent = ex.replace(/\*/g, '\u00D7').replace(/\//g, '\u00F7').replace(/-/g, '\u2212'); outEl.textContent = res || (ex ? ex.split(/[+\-*/]/).pop() || '0' : '0'); }
  function key(k) {
    buzz(10);
    if (k === 'C') { ex = ''; res = ''; }
    else if (k === 'B') { ex = ex.slice(0, -1); res = ''; }
    else if (k === '=') { if (!ex) return; try { var v = evalx(ex); if (!isFinite(v)) throw 0; res = fmt(v); expEl.textContent = expEl.textContent + ' ='; outEl.textContent = res; ex = res; fresh = true; return; } catch (e) { res = 'Error'; ex = ''; buzz(40); } }
    else if (k === 'N') { var m = /(-?[\d.]+)$/.exec(ex); if (m) ex = ex.slice(0, m.index) + (m[1][0] === '-' ? m[1].slice(1) : '-' + m[1]); }
    else if (/[+\-*/]/.test(k)) { if (res === 'Error') res = ''; fresh = false; if (!ex && k !== '-') return; ex = /[+\-*/]$/.test(ex) ? ex.slice(0, -1) + k : ex + k; res = ''; }
    else { if (fresh && /[\d.]/.test(k)) { ex = ''; } fresh = false; if (res === 'Error') res = ''; if (k === '.' && /\.\d*$/.test(ex.split(/[+\-*/]/).pop() + '')) return; ex += k; res = ''; }
    show();
  }
  var K = [['C', 'C', 'fn'], ['B', '\u232B', 'fn'], ['%', '%', 'fn'], ['/', '\u00F7', 'op'], ['7', '7'], ['8', '8'], ['9', '9'], ['*', '\u00D7', 'op'], ['4', '4'], ['5', '5'], ['6', '6'], ['-', '\u2212', 'op'], ['1', '1'], ['2', '2'], ['3', '3'], ['+', '+', 'op'], ['N', '\u00B1', 'fn'], ['0', '0'], ['.', '.'], ['=', '=', 'eq']];
  var keys = h('div', { class: 'dvm-keys' }, K.map(function (k) { return h('button', { class: 'dvm-key ' + (k[2] || ''), 'aria-label': k[0] === 'B' ? 'Backspace' : k[1], onclick: function () { key(k[0]); } }, k[1]); }));
  var body = h('div', { style: 'flex:1;min-height:0;display:flex;flex-direction:column;justify-content:flex-end' }, h('div', { class: 'dvm-disp' }, expEl, outEl), keys);
  return modal('Calculator', body);
}

/* ---------- Calendar ---------- */
function calTool() {
  var now = new Date(), y = now.getFullYear(), m = now.getMonth(), sel = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  var title = h('b', { style: 'flex:1;text-align:center;font-size:1.25rem;font-weight:500' }), grid = h('div', { class: 'dvm-cal' }), info = h('p', { style: 'margin:16px 4px;font-size:1.2rem' });
  var M = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  function same(a, b) { return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate(); }
  function draw() {
    title.textContent = M[m] + ' ' + y; var first = new Date(y, m, 1).getDay(), days = new Date(y, m + 1, 0).getDate(), cells = [];
    ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].forEach(function (d) { cells.push(h('span', { class: 'h' }, d)); });
    for (var i = 0; i < first; i++) cells.push(h('span'));
    for (var d = 1; d <= days; d++) (function (d) {
      var dt = new Date(y, m, d), c = (same(dt, now) ? ' t' : '') + (same(dt, sel) ? ' s' : '');
      cells.push(h('button', { class: c.trim(), 'aria-label': dt.toDateString(), onclick: function () { buzz(); sel = dt; draw(); } }, String(d)));
    })(d);
    grid.replaceChildren.apply(grid, cells);
    info.textContent = sel.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  }
  function move(n) { buzz(); m += n; if (m < 0) { m = 11; y--; } if (m > 11) { m = 0; y++; } draw(); }
  var head = h('div', { style: 'display:flex;align-items:center;margin-bottom:8px' }, h('button', { class: 'dvm-ib', 'aria-label': 'Previous month', onclick: function () { move(-1); } }, svg(IC.prev)), title, h('button', { class: 'dvm-ib', 'aria-label': 'Next month', onclick: function () { move(1); } }, svg(IC.next)));
  var body = h('div', { class: 'dvm-body' }, head, grid, info, h('button', { class: 'dvm-btn o', onclick: function () { buzz(); y = now.getFullYear(); m = now.getMonth(); sel = new Date(y, m, now.getDate()); draw(); } }, 'Today'));
  return modal('Calendar', body, draw);
}

/* ---------- landing ---------- */
var tools = [['Text to Image', 'Turn words into a picture to share on social media', IC.img, imageTool()], ['Calculator', 'Quick sums with large touch keys', IC.calc, calcTool()], ['Calendar', 'Browse any month and pick a date', IC.cal, calTool()]];
host.replaceChildren(h('div', { class: 'dvm' }, tools.map(function (t) {
  return h('button', { class: 'dvm-tile', onclick: function () { buzz(15); t[3].open(); } }, h('span', { class: 'dvm-ic' }, svg(t[2])), h('span', {}, h('b', {}, t[0]), h('small', {}, t[1])));
})));
})();
