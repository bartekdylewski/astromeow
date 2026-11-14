'use strict';
/* ===================== WSPÓLNE UI ===================== */
let cur = null;     // funkcja odświeżająca bieżący ekran
function show(html, { nav: withNav = false, tab = null, keep = false } = {}) {
  const st = app.scrollTop;
  app.innerHTML = html;
  app.scrollTop = keep ? st : 0;
  nav.classList.toggle('hide', !withNav);
  nav.querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.arg === tab));
}
function confetti(n = 26, set = ['🎉', '⭐', '🚀', '✨', '🌟', '🪐', '💜', '🐾']) {
  for (let i = 0; i < n; i++) {
    const s = document.createElement('span'); s.className = 'confetti'; s.textContent = pick(set);
    s.style.left = rnd(0, 100) + '%'; s.style.animationDelay = rnd(0, .4) + 's';
    device.appendChild(s); setTimeout(() => s.remove(), 3000);
  }
}
function toast(msg, ok = true) {
  const d = document.createElement('div'); d.className = 'toast pop ' + (ok ? 'ok' : 'no'); d.textContent = msg;
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
const streakPill = () => `<span class="pill pk"><span class="flame">🔥</span> ${P.streak}</span>`;
const starPill = () => `<span class="pill lv">⭐ ${P.pts}</span>`;
const boostChip = () => boostOn() ? `<span class="pill bt" id="boostchip">⚡ BOOST ×1.5 · ${Math.ceil((P.boostUntil - Date.now()) / 1000)} s</span>` : '';
const resRow = () => `<div class="grid3">${Object.keys(RES).map(k => `<div class="res"><div class="e">${RES[k].icon}</div><b id="rv-${k}">${fmt(P.res[k])}</b><small style="color:${RES[k].color}">${RES[k].name}</small></div>`).join('')}</div>`;
