/* Computer blocker. Self-contained: own CSS, HTML and JS. */
(function () {
  try {
    var ok = /Android/i.test(navigator.userAgent) && /Mobile/i.test(navigator.userAgent);
    if (ok) return;
    var s = document.createElement('style');
    s.textContent = '#cbk{position:fixed;inset:0;width:100dvw;height:100dvh;z-index:99999;background:#fff;color:#000;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:24px;font:700 22px Roboto,sans-serif}#cbk div{margin-top:12px;font-weight:400;font-size:19px}#cbk b{color:#1877F2}';
    document.head.appendChild(s);
    var d = document.createElement('div'); d.id = 'cbk';
    d.innerHTML = '<b>Debora Note</b>Android phones only<div>Open this app on an Android phone.</div>';
    document.body.appendChild(d);
    document.documentElement.style.overflow = 'hidden';
  } catch (e) {}
})();
