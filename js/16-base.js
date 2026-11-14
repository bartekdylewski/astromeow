'use strict';
/* ===================== BAZA (tycoon) ===================== */
function statCard(k, r) {
  const pct = Math.min(100, P.res[k] / goalFor(k) * 100);
  return `<div class="res"><div class="e">${RES[k].icon}</div><b id="v-${k}">${fmt(P.res[k])}</b><small style="color:${RES[k].color}">${RES[k].name}</small>
    <div class="meter" style="height:.5rem;margin-top:.4rem"><i id="m-${k}" style="width:${pct}%;background:${RES[k].color}"></i></div>
    <small style="color:${RES[k].color}" id="r-${k}">+${fmt(r[k])}/s</small></div>`;
}
function baseCoach(pi) {
  const g = pGrid(pi), cnt = Object.keys(g).length, tot = PLANETS[pi].n ** 2;
  const avail = Object.keys(TYPES).filter(k => doneCount() >= TYPES[k].req);
  const buyable = avail.filter(k => canAfford(placeCost(k, pi)));
  const toMenu = txt => `<button class="btn sm b-white mt-s" data-act="tab" data-arg="home">${txt}</button>`;
  if (cnt >= tot) {
    if (pi + 1 >= PLANETS.length) return { hot: 1, html: `<b>🏆 Wszystko zabudowane! Ulepszaj budynki do ⭐5.</b>` };
    if (pOpen(pi + 1)) return { hot: 1, html: `<b>🎉 Planeta zabudowana! Czeka na Ciebie ${PLANETS[pi + 1].name}.</b><button class="btn sm b-peach mt-s" data-act="goplanet" data-arg="${pi + 1}">LEĆ NA ${PLANETS[pi + 1].name.toUpperCase()} ${PLANETS[pi + 1].icon}</button>` };
    return { hot: 1, html: `<b>✅ Planeta zabudowana! Żeby odblokować ${PLANETS[pi + 1].name}: ${pReason(pi + 1)}.</b>${toMenu('MENU GŁÓWNE · NASTĘPNA MISJA 🏠')}` };
  }
  if (cnt === 0) {
    const c = placeCost('warsztat', pi);
    return canAfford(c) ? { hot: 1, html: `<b>👉 Krok 1: dotknij ＋ i postaw Warsztat.</b> <span style="white-space:nowrap">${chips(c)}</span>` }
      : { hot: 1, html: `<b>Brakuje ${fmt(c.wiedza - P.res.wiedza)} 🧠 na pierwszy Warsztat. Zrób quiz w misji!</b>${toMenu('MENU GŁÓWNE 🏠')}` };
  }
  if (buyable.length) return { hot: 1, html: `<b>🏗️ Masz za co postawić budynek! Wolne pola: ${tot - cnt}.</b>` };
  return { hot: 0, html: `<b>Brakuje zasobów. Quiz daje 🧠, gierki 🔩 i ☄️. Wróć do menu i graj dalej!</b>${toMenu('MENU GŁÓWNE · GRAJ 🏠')}` };
}
function renderBase() {
  stopGame(); cur = renderBase;
  const pi = P.planet, pl = PLANETS[pi], n = pl.n, g = pGrid(pi), r = rates(), cnt = Object.keys(g).length;
  P.seenPlanets = Math.max(P.seenPlanets, pi + 1);
  const chipsRow = PLANETS.map((p, i) => `<button class="pchip ${i === pi ? 'on' : ''} ${pOpen(i) ? '' : 'lk'}" data-act="goplanet" data-arg="${i}"><span>${pOpen(i) ? p.icon : '🔒'}</span><small>${p.n}×${p.n}</small></button>`).join('');
  const em = [0, 0, 3.3, 2.6, 2.1, 1.7][n]; let tiles = '';
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    const t = g[key(x, y)];
    if (!t) { tiles += `<button id="tile-${x}-${y}" data-act="tile" data-arg="${x},${y}" class="tile ${cnt === 0 ? 'pulse' : ''}" style="background:rgba(255,255,255,.35);border:2px dashed rgba(255,255,255,.8)"><span style="font-size:${em * .4}rem;opacity:.5">${DECOR[(x * 7 + y * 3) % DECOR.length]}</span><span style="position:absolute;font-size:${em * .6}rem;font-weight:900;color:#ffffffcc">＋</span></button>`; continue; }
    const def = TYPES[t.type], size = em * (.7 + t.level * .09);
    const badges = t.addons.map((a, i) => `<span class="badge" style="${i === 0 ? 'top:-.5rem;right:-.5rem' : 'bottom:-.5rem;left:-.5rem'}">${ADDONS[a].icon}</span>`).join('');
    tiles += `<button id="tile-${x}-${y}" data-act="tile" data-arg="${x},${y}" class="tile" style="background:${def.bg};box-shadow:0 .4rem 0 #A18EF088"><span class="idle" style="font-size:${size}rem;line-height:1;filter:drop-shadow(0 .35rem 0 rgba(0,0,0,.12))">${def.icon}</span><div style="position:absolute;bottom:.15rem;font-size:.55rem;line-height:1">${'⭐'.repeat(t.level)}</div>${badges}</button>`;
  }
  const co = baseCoach(pi);
  show(`<div class="scr">
    ${bar('<h1 style="font-size:1.8rem;font-weight:900">Twoja baza</h1>', '', `<span class="row gap-s">${starPill()}<button class="x" data-act="tut" data-arg="base">?</button></span>`)}
    <div class="row gap-s mb-s">${chipsRow}</div>
    <div class="tc mb-s" id="boostwrap">${boostChip()}</div>
    <section class="sky" style="background:linear-gradient(180deg,${pl.sky[0]} 0%,${pl.sky[1]} 55%,${pl.sky[2]} 100%)"><span class="pill" style="position:absolute;left:.8rem;top:.8rem;z-index:2;background:#fff">${pl.icon} ${pl.name.toUpperCase()}</span>
      <span class="pill" style="position:absolute;right:.8rem;top:.8rem;z-index:2;background:#fff">${cnt}/${n * n} · koszty ×${pl.cm} · zyski ×${pl.pm}</span>
      <div style="max-width:${[0, 0, 15, 19, 22, 24][n]}rem;margin:0 auto;perspective:56rem;position:relative"><div class="ground" style="grid-template-columns:repeat(${n},1fr)">${tiles}</div></div></section>
    <div class="card mt tc" style="${co.hot ? 'background:var(--butter);border-color:var(--butterd)' : ''}">${co.html}</div>
    <div class="row between mt mb-s"><h2 style="font-size:1.2rem;font-weight:900">Stan bazy</h2><span class="pill lv">${PLANETS.reduce((a, _, i) => a + Object.keys(pGrid(i)).length, 0)} budynków łącznie</span></div>
    <div class="grid3">${statCard('wiedza', r)}${statCard('czesci', r)}${statCard('meteo', r)}</div>
    <div class="row gap mt" style="background:var(--lavs);border-radius:1.4rem;padding:.8rem">${cat('think', 4.2)}<b style="color:#5B47C9">Quiz daje 🧠, a gierki 🔩 i ☄️. Za to rośnie baza!</b></div>
    <button class="btn b-lav mt nudge" style="margin-bottom:1.2rem" data-act="tab" data-arg="home">MENU GŁÓWNE · NASTĘPNY ETAP 🏠</button>
  </div>`, { nav: true, tab: 'base' });
  if (!P.tut.base) openTut('base');
}
function statCard(k, r) {
  const pct = Math.min(100, P.res[k] / goalFor(k) * 100);
  return `<div class="res"><div class="e">${RES[k].icon}</div><b id="v-${k}">${fmt(P.res[k])}</b><small style="color:${RES[k].color}">${RES[k].name}</small>
    <div class="meter" style="height:.5rem;margin-top:.4rem"><i id="m-${k}" style="width:${pct}%;background:${RES[k].color}"></i></div>
    <small style="color:${RES[k].color}" id="r-${k}">+${fmt(r[k])}/s</small></div>`;
}
function updateStats() {
  const r = rates();
  for (const k of ['wiedza', 'czesci', 'meteo']) {
    const v = $('#v-' + k); if (!v) break;
    v.textContent = fmt(P.res[k]); $('#m-' + k).style.width = Math.min(100, P.res[k] / goalFor(k) * 100) + '%'; $('#r-' + k).textContent = '+' + fmt(r[k]) + '/s';
  }
}
function openBuildMenu(x, y) {
  pendingXY = { x, y }; const pi = P.planet, pm = PLANETS[pi].pm;
  const cards = Object.keys(TYPES).map(k => {
    const def = TYPES[k], locked = doneCount() < def.req;
    const gain = Object.keys(def.prod).map(r => `${RES[r].icon}+${fmt(def.prod[r] * pm)}/s`).join(' ') || `✨ +${Math.round(def.aura * 100)}% aury`;
    return `<button data-act="place" data-arg="${k}" style="background:${def.bg};border:0;border-radius:1.4rem;padding:.8rem;display:flex;flex-direction:column;align-items:center;gap:.3rem;font:inherit;color:var(--ink);cursor:pointer;box-shadow:0 .3rem 0 #0002;${locked ? 'opacity:.5' : ''}">
      <div style="font-size:2.6rem">${locked ? '🔒' : def.icon}</div><b style="font-size:.9rem">${def.name}</b>
      ${locked ? `<span class="pill bt">${def.req} ${misPl(def.req)}</span>` : `<small style="font-weight:900;color:#2D8F66">${gain}</small><div style="display:flex;flex-wrap:wrap;gap:.25rem;justify-content:center">${chips(placeCost(k, pi))}</div>`}</button>`;
  }).join('');
  openSheet(`<h3 class="tc mb" style="font-size:1.5rem;font-weight:900">Postaw budynek</h3><div class="grid2">${cards}</div>`);
}
function placeBuilding(type) {
  const def = TYPES[type], pi = P.planet; if (!pendingXY) return;
  if (doneCount() < def.req) return toast('🔒 Zalicz więcej misji!', false);
  const c = placeCost(type, pi);
  if (!canAfford(c)) return toast('Za mało zasobów 😢', false);
  pay(c); pGrid(pi)[key(pendingXY.x, pendingXY.y)] = { type, level: 1, addons: [] };
  save(); closeSheet(); confetti(14);
  if (pFull(pi)) { confetti(40, ['🎉', '🪐', '⭐', '🚀']); toast('🎉 Planeta zabudowana!'); }
  renderBase();
}
function openBuilding(x, y) {
  pendingXY = { x, y }; const pi = P.planet;
  const t = tileAt(x, y), def = TYPES[t.type], rt = buildingRates(t, pi);
  const prod = Object.keys(rt).map(k => `<span class="pill lv">${RES[k].icon} +${fmt(rt[k])}/s</span>`).join(' ') || `<span class="pill lv">✨ aura +${Math.round(Math.min(1, def.aura * t.level) * 100)}% dla planety</span>`;
  const isMax = t.level >= def.max, cost = upgradeCost(t, pi), can = canAfford(cost);
  const up = isMax ? `<div class="tc mb" style="font-weight:900;font-size:1.3rem">👑 MAX</div>`
    : `<button class="btn ${can ? 'b-peach' : ''} mb" data-act="upgrade" ${can ? '' : 'disabled'}>⬆️ ULEPSZ · ${Object.keys(cost).map(k => RES[k].icon + fmt(cost[k])).join(' ')}</button>`;
  const slots = [0, 1].map(i => {
    const need = i === 0 ? 1 : 3;
    if (t.addons[i]) return `<div style="width:5rem;height:5rem;border-radius:1.4rem;display:flex;align-items:center;justify-content:center;font-size:2.4rem;background:${def.bg}">${ADDONS[t.addons[i]].icon}</div>`;
    if (t.level < need) return `<div style="width:5rem;height:5rem;border-radius:1.4rem;background:#F1EEFB;display:flex;align-items:center;justify-content:center;font-size:2rem">🔒</div>`;
    return `<button data-act="slot" style="width:5rem;height:5rem;border-radius:1.4rem;border:2px dashed var(--lavd);font:inherit;font-size:2.2rem;font-weight:900;color:var(--lavd);background:var(--lavs);cursor:pointer">＋</button>`;
  }).join('');
  openSheet(`<div class="col center gap-s mb">
      <div class="idle" style="width:7rem;height:7rem;border-radius:2rem;background:${def.bg};display:flex;align-items:center;justify-content:center;font-size:3.6rem">${def.icon}</div>
      <b style="font-size:1.3rem">${def.name}</b>
      <div style="font-size:1.1rem">${'⭐'.repeat(t.level)}<span style="opacity:.25">${'⭐'.repeat(def.max - t.level)}</span></div>
      <div class="row gap-s" style="flex-wrap:wrap;justify-content:center">${prod}</div></div>
    ${up}<div class="label tc mb-s">Dodatki (poziom 1 i 3)</div><div class="row gap" style="justify-content:center">${slots}</div>`);
}
function upgradeBuilding() {
  const t = tileAt(pendingXY.x, pendingXY.y), c = upgradeCost(t, P.planet);
  if (!canAfford(c)) return toast('Za mało zasobów 😢', false);
  pay(c); t.level++; save(); closeSheet(); confetti(10); renderBase();
}
function openAddonPicker() {
  const pi = P.planet;
  const cards = Object.keys(ADDONS).map(k => {
    const a = ADDONS[k];
    return `<button data-act="addon" data-arg="${k}" style="background:var(--lavs);border:2px solid var(--line);border-radius:1.4rem;padding:.7rem .3rem;display:flex;flex-direction:column;align-items:center;gap:.3rem;font:inherit;color:var(--ink);cursor:pointer">
      <div style="font-size:2.4rem">${a.icon}</div><b>${a.name}</b><b style="color:#2D8F66;font-size:.85rem">+${Math.round(a.mult * 100)}%</b><div style="display:flex;flex-wrap:wrap;gap:.2rem;justify-content:center">${chips(addonCost(k, pi))}</div></button>`;
  }).join('');
  openSheet(`<h3 class="tc mb" style="font-size:1.5rem;font-weight:900">Dodatek</h3><div class="grid3">${cards}</div>`);
}
function addAddon(id) {
  const t = tileAt(pendingXY.x, pendingXY.y); if (t.addons.length >= 2) return;
  const c = addonCost(id, P.planet);
  if (!canAfford(c)) return toast('Za mało zasobów 😢', false);
  pay(c); t.addons.push(id); save(); closeSheet(); confetti(8); renderBase();
}
