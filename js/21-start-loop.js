'use strict';
/* ===================== START + PĘTLA BAZY ===================== */
load();
renderStart();
probeCat();
let lastTick = Date.now();
setInterval(() => {
  const now = Date.now(), dt = (now - lastTick) / 1000; lastTick = now;
  const r = rates(); for (const k in r) P.res[k] += r[k] * dt;
  const onBase = $('#v-wiedza'), onHome = $('#rv-wiedza');
  if (onBase) updateStats();
  if (onHome) for (const k in RES) { const v = $('#rv-' + k); if (v) v.textContent = fmt(P.res[k]); }
  const bc = $('#boostchip'); if (bc) { if (boostOn()) bc.textContent = `⚡ BOOST ×1.5 · ${Math.ceil((P.boostUntil - now) / 1000)} s`; else bc.remove(); }
  if (onBase) for (const [k, t] of Object.entries(pGrid(P.planet))) {
    if (Math.random() > .2) continue;
    const res = Object.keys(buildingRates(t, P.planet))[0]; if (!res) continue;
    const [x, y] = k.split(',').map(Number), el = $(`#tile-${x}-${y}`); if (!el) continue;
    const f = document.createElement('span'); f.className = 'floatup'; f.textContent = RES[res].icon; el.appendChild(f); setTimeout(() => f.remove(), 1400);
  }
}, 500);
setInterval(save, 5000);
addEventListener('beforeunload', save);
