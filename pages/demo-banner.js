// Baner „wersja demo” – wstrzykiwany tylko do game.html na GitHub Pages (pages/make_site.py).
(function () {
  try { if (sessionStorage.getItem('astro_demo_hide') === '1') return; } catch (e) {}
  var bar = document.createElement('div');
  bar.setAttribute('style', 'position:fixed;left:0;right:0;bottom:0;z-index:2147483000;background:#2a1f5c;color:#f3efff;' +
    'font:14px/1.4 system-ui,sans-serif;padding:8px 12px;display:flex;gap:10px;align-items:center;justify-content:center;' +
    'flex-wrap:wrap;border-top:2px solid #b9a6ff;text-align:center');
  var text = document.createElement('span'), go = document.createElement('button'), x = document.createElement('button');
  var btn = 'background:#b9a6ff;color:#1a1438;border:0;border-radius:8px;padding:5px 12px;font:inherit;cursor:pointer';
  go.setAttribute('style', btn); x.setAttribute('style', 'background:none;color:#8b84b8;border:0;font-size:18px;cursor:pointer;padding:0 4px');
  x.textContent = '×'; x.setAttribute('aria-label', 'Zamknij');
  function demo() { text.textContent = '🛰️ Wersja demo: serwer gry jest offline. Postęp zapisuje się tylko w tej przeglądarce, bez rankingów.'; go.textContent = 'Sprawdź serwer'; go.dataset.m = 'check'; }
  function back() { text.textContent = '✅ Serwer znów działa! Pełna wersja ma rankingi i dane z NASA (postęp z dema się nie przeniesie).'; go.textContent = 'Przejdź do pełnej wersji'; go.dataset.m = 'go'; }
  demo();
  go.onclick = function () {
    if (go.dataset.m === 'go') { location.href = window.ASTRO_SERVER + '/' + location.search; return; }
    go.textContent = 'Czekam na serwer…';
    window.astroProbe(4000).then(function (ok) { ok ? back() : (demo(), go.textContent = 'Nadal offline, spróbuj później'); });
  };
  x.onclick = function () { bar.remove(); try { sessionStorage.setItem('astro_demo_hide', '1'); } catch (e) {} };
  bar.append(text, go, x);
  document.body.append(bar);
  setInterval(function () { if (go.dataset.m !== 'go') window.astroProbe(3000).then(function (ok) { if (ok) back(); }); }, 30000);
})();
