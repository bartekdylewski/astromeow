'use strict';
/* ===================== BAZA (tycoon) ===================== */
/* Astruś mówi, co zrobić dalej (jedna linijka + ewentualnie jeden przycisk) */
function baseCoach(pi) {
  const g = pGrid(pi), cnt = Object.keys(g).length, tot = PLANETS[pi].n ** 2;
  const avail = Object.keys(TYPES).filter(k => doneCount() >= TYPES[k].req);
  const buyable = avail.filter(k => canAfford(placeCost(k, pi)));
  const toMenu = txt => `<button class="btn sm b-lav mt-s" data-act="tab" data-arg="home">${txt}</button>`;
  if (cnt >= tot) {
    if (pi + 1 >= PLANETS.length) return { pose: 'cheer', html: '<b>Wszystko zabudowane! 🏆</b> Ulepszaj budynki do ⭐5.' };
    if (pOpen(pi + 1)) return { pose: 'cheer', html: `<b>Planeta zabudowana!</b> Czeka na nas ${PLANETS[pi + 1].name}.<button class="btn sm b-lav mt-s" data-act="goplanet" data-arg="${pi + 1}">LEĆ NA ${PLANETS[pi + 1].name.toUpperCase()} ${PLANETS[pi + 1].icon}</button>` };
    return { pose: 'happy', html: `<b>Planeta zabudowana!</b> Żeby odblokować ${PLANETS[pi + 1].name}: ${pReason(pi + 1)}.${toMenu('GRAJ DALEJ')}` };
  }
  if (cnt === 0) {
    const c = placeCost('warsztat', pi);
    return canAfford(c) ? { pose: 'happy', html: `<b>Dotknij ＋ i postaw Elektrownię.</b> <span style="white-space:nowrap">${chips(c)}</span>` }
      : { pose: 'think', html: `<b>Brakuje ${fmt(c.wiedza - P.res.wiedza)} ${RES.wiedza.icon} na Elektrownię.</b> Zrób quiz w misji!${toMenu('GRAJ')}` };
  }
  if (buyable.length) return { pose: 'happy', html: `<b>Stać nas na budynek!</b> Dotknij ＋ (wolne pola: ${tot - cnt}).` };
  return { pose: 'think', html: `<b>Brakuje zasobów.</b> Quiz daje ${RES.wiedza.icon}, gierki ${RES.czesci.icon} i ${RES.meteo.icon}.${toMenu('GRAJ DALEJ')}` };
}
const resCell = (k, r) => `<div><b id="v-${k}">${fmt(P.res[k])}</b> ${RES[k].icon}<small id="r-${k}">+${fmt(r[k])}/s</small></div>`;
function renderBase() {
  stopGame(); cur = renderBase;
  const pi = P.planet, pl = PLANETS[pi], n = pl.n, g = pGrid(pi), r = rates(), cnt = Object.keys(g).length;
  P.seenPlanets = Math.max(P.seenPlanets, pi + 1);
  const chipsRow = pOpen(1)
    ? `<div class="row gap-s mb-s">${PLANETS.map((p, i) => `<button class="pchip ${i === pi ? 'on' : ''} ${pOpen(i) ? '' : 'lk'}" data-act="goplanet" data-arg="${i}"><span>${pOpen(i) ? p.icon : '🔒'}</span><small>${p.n}×${p.n}</small></button>`).join('')}</div>` : '';
  const em = [0, 0, 3.3, 2.6, 2.1, 1.7][n]; let tiles = '';
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    const t = g[key(x, y)];
    if (!t) { tiles += `<button id="tile-${x}-${y}" data-act="tile" data-arg="${x},${y}" class="tile empty ${cnt === 0 ? 'pulse' : ''}" aria-label="Wolne pole"><span class="plus" style="font-size:${em * .6}rem">＋</span></button>`; continue; }
    const def = TYPES[t.type], size = em * (.7 + t.level * .09);
    const badges = t.addons.map((a, i) => `<span class="badge" style="${i === 0 ? 'top:-.5rem;right:-.5rem' : 'bottom:-.5rem;left:-.5rem'}">${ADDONS[a].icon}</span>`).join('');
    tiles += `<button id="tile-${x}-${y}" data-act="tile" data-arg="${x},${y}" class="tile" aria-label="${def.name}"><span class="idle" style="font-size:${size}rem;line-height:1">${bImg(t.type, def.icon)}</span><div style="position:absolute;bottom:.15rem;font-size:.55rem;line-height:1">${'⭐'.repeat(t.level)}</div>${badges}</button>`;
  }
  const co = baseCoach(pi), coach = mapMsg || catSay(co.pose, co.html, { size: 4.6 }); mapMsg = ''; GSET = null;   // po quizie/gierce: komunikat Astrusia zamiast podpowiedzi
  show(`<div class="scr">
    ${bar('<h1 class="title">Twoja baza</h1>', '', `<span class="row gap-s">${starPill()}<button class="x" data-act="tut" data-arg="base">?</button></span>`)}
    ${chipsRow}
    <div class="resbar mb">${resCell('wiedza', r)}${resCell('czesci', r)}${resCell('meteo', r)}</div>
    <section class="sky" style="background:${pl.bg}"><div class="cap">${pl.icon} ${pl.name} · ${cnt}/${n * n}</div>
      <div style="max-width:${[0, 0, 15, 19, 22, 24][n]}rem;margin:0 auto;perspective:56rem;position:relative"><div class="ground" style="grid-template-columns:repeat(${n},1fr)">${tiles}</div></div></section>
    <div class="mt" style="margin-bottom:1.2rem">${coach}</div>
  </div>`, { nav: true, tab: 'base' });
  if (!P.tut.base) openTut('base');
}
function updateStats() {
  const r = rates();
  for (const k of ['wiedza', 'czesci', 'meteo']) {
    const v = $('#v-' + k); if (!v) break;
    v.textContent = fmt(P.res[k]); $('#r-' + k).textContent = '+' + fmt(r[k]) + '/s';
  }
}
function openBuildMenu(x, y) {
  pendingXY = { x, y }; const pi = P.planet, pm = PLANETS[pi].pm;
  const cards = Object.keys(TYPES).map(k => {
    const def = TYPES[k], locked = doneCount() < def.req;
    const gain = Object.keys(def.prod).map(r => `${RES[r].icon}+${fmt(def.prod[r] * pm)}/s`).join(' ') || `✨ +${Math.round(def.aura * 100)}% aury`;
    return `<button class="opt ${locked ? 'lock' : ''}" data-act="place" data-arg="${k}">
      <div class="ic">${locked ? '🔒' : bImg(k, def.icon)}</div><b style="font-size:.9rem">${def.name}</b>
      ${locked ? `<small class="muted">${def.req} ${misPl(def.req)}</small>` : `<small>${gain}</small><div style="display:flex;flex-wrap:wrap;gap:.25rem;justify-content:center">${chips(placeCost(k, pi))}</div>`}</button>`;
  }).join('');
  openSheet(`<h3 class="tc mb title">Postaw budynek</h3><div class="grid2">${cards}</div>`);
}
function placeBuilding(type) {
  const def = TYPES[type], pi = P.planet; if (!pendingXY) return;
  if (doneCount() < def.req) return toast('🔒 Zalicz więcej misji!', false);
  const c = placeCost(type, pi);
  if (!canAfford(c)) return toast('Za mało zasobów 😢', false);
  pay(c); pGrid(pi)[key(pendingXY.x, pendingXY.y)] = { type, level: 1, addons: [] };
  save(); closeSheet(); confetti(10);
  if (pFull(pi)) { confetti(24); toast('🎉 Planeta zabudowana!'); }
  renderBase();
}
function openBuilding(x, y) {
  pendingXY = { x, y }; const pi = P.planet;
  const t = tileAt(x, y), def = TYPES[t.type], rt = buildingRates(t, pi);
  const prod = Object.keys(rt).map(k => `<span class="pill">${RES[k].icon} +${fmt(rt[k])}/s</span>`).join(' ') || `<span class="pill">✨ aura +${Math.round(Math.min(1, def.aura * t.level) * 100)}% dla planety</span>`;
  const isMax = t.level >= def.max, cost = upgradeCost(t, pi), can = canAfford(cost);
  const up = isMax ? `<div class="tc mb" style="font-weight:900;font-size:1.3rem">👑 MAX</div>`
    : `<button class="btn b-lav mb" data-act="upgrade" ${can ? '' : 'disabled'}>⬆️ ULEPSZ · ${Object.keys(cost).map(k => RES[k].icon + fmt(cost[k])).join(' ')}</button>`;
  const box = 'width:5rem;height:5rem;border-radius:1.4rem;display:flex;align-items:center;justify-content:center;font:inherit';
  const slots = [0, 1].map(i => {
    const need = i === 0 ? 1 : 3;
    if (t.addons[i]) return `<div style="${box};font-size:2.4rem;background:var(--orange-soft);border:.14rem solid var(--ink)">${ADDONS[t.addons[i]].icon}</div>`;
    if (t.level < need) return `<div style="${box};background:var(--grey);font-size:2rem">🔒</div>`;
    return `<button data-act="slot" style="${box};border:.16rem dashed var(--oranged);font-size:2.2rem;font-weight:900;color:var(--oranged);background:transparent;cursor:pointer">＋</button>`;
  }).join('');
  openSheet(`<div class="col center gap-s mb">
      <div class="idle" style="width:6rem;height:6rem;border-radius:2rem;background:var(--orange-soft);border:.16rem solid var(--ink);display:flex;align-items:center;justify-content:center;font-size:3.2rem">${bImg(t.type, def.icon)}</div>
      <b style="font-size:1.3rem">${def.name}</b><small class="muted tc">${def.desc}</small>
      <div style="font-size:1.1rem">${'⭐'.repeat(t.level)}<span style="opacity:.25">${'⭐'.repeat(def.max - t.level)}</span></div>
      <div class="row gap-s" style="flex-wrap:wrap;justify-content:center">${prod}</div></div>
    ${up}<div class="label tc mb-s">Dodatki (poziom 1 i 3)</div><div class="row gap" style="justify-content:center">${slots}</div>`);
}
function upgradeBuilding() {
  const t = tileAt(pendingXY.x, pendingXY.y), c = upgradeCost(t, P.planet);
  if (!canAfford(c)) return toast('Za mało zasobów 😢', false);
  pay(c); t.level++; save(); closeSheet(); confetti(6); renderBase();
}
function openAddonPicker() {
  const pi = P.planet;
  const cards = Object.keys(ADDONS).map(k => {
    const a = ADDONS[k];
    return `<button class="opt" data-act="addon" data-arg="${k}" style="padding:.7rem .3rem">
      <div class="ic">${a.icon}</div><b>${a.name}</b><small>+${Math.round(a.mult * 100)}%</small><div style="display:flex;flex-wrap:wrap;gap:.2rem;justify-content:center">${chips(addonCost(k, pi))}</div></button>`;
  }).join('');
  openSheet(`<h3 class="tc mb title">Dodatek</h3><div class="grid3">${cards}</div>`);
}
function addAddon(id) {
  const t = tileAt(pendingXY.x, pendingXY.y); if (t.addons.length >= 2) return;
  const c = addonCost(id, P.planet);
  if (!canAfford(c)) return toast('Za mało zasobów 😢', false);
  pay(c); t.addons.push(id); save(); closeSheet(); confetti(6); renderBase();
}

/* ===================== PYTANIE A/B O BEZPIECZEŃSTWIE (przy każdym wejściu do Bazy; dane: config/safety.json) ===================== */
let safeLast = -1, safeQ = null;
const SAFE_COOLDOWN = 45000;   // ms między pytaniami A/B
function askSafety() {
  const qs = DATA && DATA.safety && DATA.safety.questions;
  if (!qs || !qs.length || !P.tut.base || DEV) return;   // dopiero po samouczku Bazy
  if (Date.now() - (P.safeAt || 0) < SAFE_COOLDOWN) return;   // max 1 pytanie na 45 s, żeby nie dało się klikać Baza dla bonusu
  P.safeAt = Date.now(); save();
  let i; do i = Math.floor(Math.random() * qs.length); while (qs.length > 1 && i === safeLast);
  safeLast = i;
  const q = qs[i], flip = Math.random() < .5, opts = flip ? [q.wrong, q.right] : [q.right, q.wrong];
  safeQ = { q, right: flip ? 'b' : 'a' };
  openSheet(`<div class="label tc mb-s">Alarm w bazie ${RES[q.res].icon}</div><h3 class="tc mb">${q.q}</h3>
    <div class="col gap-s">${opts.map((t, k) => `<button class="btn b-white" data-act="safe-ans" data-arg="${'ab'[k]}"><b>${'AB'[k]}.</b> ${t}</button>`).join('')}</div>`);
  const o = $('#sheet'); o.replaceWith(o.cloneNode(true));   // bez zamykania tapnięciem w tło: trzeba odpowiedzieć
}
function answerSafety(pick) {
  if (!safeQ) return;
  const { q, right } = safeQ, ok = pick === right, r = RES[q.res], have = P.res[q.res];
  const d = ok ? Math.min(50, Math.max(2, Math.round(have * .2))) : -Math.min(have, Math.round(have * .1));
  P.res[q.res] = have + d; save(); updateStats(); safeQ = null;
  window.sfx && sfx(ok ? 'win' : 'lose');
  openSheet(`<div class="col center tc gap-s mb">
      <h3 class="title" style="color:var(--${ok ? 'ok' : 'bad'})">${ok ? '✅ Dobrze!' : '❌ Nie tym razem'}</h3>
      <p class="rew" style="font-size:1.3rem">${ok ? '+20%' : '−10%'} (${ok ? '+' : '−'}${fmt(Math.abs(d))}) ${r.icon} ${r.name}</p>
      <small class="muted">${fmt(have)} → ${fmt(P.res[q.res])}</small>
      <p style="margin:.4rem 0 0">${q.why}</p></div>
    <button class="btn b-lav" data-act="sheet-close">DALEJ ›</button>`);
  if (ok) confetti(8);
}
