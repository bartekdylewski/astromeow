'use strict';
/* ===================== WSPÓLNE UI ===================== */
let cur = null;     // funkcja odświeżająca bieżący ekran
function show(html, { nav: withNav = false, tab = null, keep = false } = {}) {
  const st = app.scrollTop;
  app.innerHTML = html;
  app.scrollTop = keep ? st : 0;
  labelBtns();
  nav.classList.toggle('hide', !withNav || !(P.runs > 0));   // pierwsza misja bez menu: nic nie rozprasza
  nav.querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.arg === tab));
}
/* czytniki ekranu: przyciski z samym symbolem dostają opis */
const BTN_LABEL = { '✕': 'Zamknij', '?': 'Pomoc', '←': 'Wstecz' };
function labelBtns() { app.querySelectorAll('.x').forEach(b => { if (!b.getAttribute('aria-label')) b.setAttribute('aria-label', BTN_LABEL[b.textContent.trim()] || 'Przycisk'); }); }
/* okno potwierdzenia: Astruś pyta, jedna główna akcja (zostań), druga cicha */
function confirmSheet({ pose = 'think', title, text, yes, yesAct, yesArg = '', yesCls = 'b-white', no = 'ZOSTAJĘ' }) {
  openSheet(`${catSay(pose, `<b>${title}</b><br>${text}`, { size: 5 })}
    <div class="col gap mt"><button class="btn b-lav" data-act="sheet-close">${no}</button>
    <button class="btn ${yesCls}" data-act="${yesAct}" data-arg="${yesArg}">${yes}</button></div>`);
}
/* konfetti: proste kawałki w kolorach palety (parametr set zostawiony dla zgodności) */
function confetti(n = 18, set) {
  for (let i = 0; i < n; i++) {
    const s = document.createElement('span'); s.className = 'confetti c' + (i % 3);
    s.style.left = rnd(0, 100) + '%'; s.style.animationDelay = rnd(0, .4) + 's';
    device.appendChild(s); setTimeout(() => s.remove(), 3000);
  }
}
function toast(msg, ok = true) {
  document.querySelectorAll('.toast').forEach(t => t.remove());   // jeden komunikat naraz
  const d = document.createElement('div'); d.className = 'toast pop'; d.textContent = msg; d.setAttribute('role', 'status'); d.setAttribute('aria-live', 'polite');
  device.appendChild(d); setTimeout(() => { d.style.transition = 'opacity .4s'; d.style.opacity = 0; }, 1500); setTimeout(() => d.remove(), 1950);
}
let pendingXY = null;
function openSheet(html) {
  closeSheet();
  const o = document.createElement('div'); o.id = 'sheet'; o.className = 'sheet';
  o.innerHTML = `<div><div class="grab"></div>${html}</div>`;
  o.addEventListener('click', e => { if (e.target === o) closeSheet(); });
  device.appendChild(o);
}
function closeSheet() { const s = $('#sheet'); if (s) s.remove(); }
function bar(left, mid, right) { return `<div class="row between mb-s">${left}${mid}${right}</div>`; }
const starPill = () => `<span class="pill soft">⭐ ${P.pts}</span>`;
