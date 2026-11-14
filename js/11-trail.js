'use strict';
/* ===================== MAPA MISJI + SALON GIER ===================== */
function nextTarget() {
  const t = P.diff || 'easy';
  for (const tier of TIERS.slice(TIERS.indexOf(t))) {
    const m = MISSIONS.find(mission => !P.done[tier].includes(mission.id));
    if (m) return { tier, m, promote: tier !== t };
  }
  return { tier: t, m: MISSIONS[0], replay: true };
}
function nodeOpen(t, m) {
  const ti = TIERS.indexOf(t);
  if (m.id > 1) return P.done[t].includes(m.id - 1);
  return ti === 0 || ti <= P.startIdx || P.done[TIERS[ti - 1]].length === MISSIONS.length;
}
const XS = [50, 78, 50, 22];
function renderMap() {
  stopGame(); cur = renderMap; GSET = null;
  const nt = nextTarget(), curId = nt.replay ? null : nt.tier + ':' + nt.m.id;
  /* elementy szlaku: kolonie (2×2, 3×3...), nagłówki poziomów i węzły misji */
  const items = [{ k: 'planet', pi: 0 }]; let cnt = 0;
  TIERS.forEach(t => {
    items.push({ k: 'tier', t });
    MISSIONS.forEach(m => { cnt++; items.push({ k: 'node', t, m }); PLANETS.forEach((pl, pi) => { if (pi > 0 && pl.need === cnt) items.push({ k: 'planet', pi }); }); });
  });
  PLANETS.forEach((pl, pi) => { if (pi > 0 && pl.need > cnt) items.push({ k: 'planet', pi }); });
  const H = { tier: 5, node: 9.5, planet: 12.5 }; let y = 0, j = 0, prevReached = true;
  items.forEach(it => {
    it.y = y + H[it.k] / 2; y += H[it.k]; it.x = it.k === 'tier' ? 50 : XS[j++ % 4];
    if (it.k === 'node') { it.done = P.done[it.t].includes(it.m.id); it.open = nodeOpen(it.t, it.m); it.cur = curId === it.t + ':' + it.m.id; it.reached = it.done || it.cur; }
    else if (it.k === 'planet') it.reached = pOpen(it.pi) && prevReached;
    else it.reached = prevReached;
    prevReached = it.reached;
  });
  const total = y;
  let dp = `M ${items[0].x} ${items[0].y}`, paws = '';
  for (let i = 1; i < items.length; i++) {
    const a = items[i - 1], b = items[i], my = (a.y + b.y) / 2;
    dp += ` C ${a.x} ${my}, ${b.x} ${my}, ${b.x} ${b.y}`;
    [.2, .4, .6, .8].forEach((t, n) => {
      const u = 1 - t, px = u * u * u * a.x + 3 * u * u * t * a.x + 3 * u * t * t * b.x + t * t * t * b.x;
      const py = u * u * u * a.y + 3 * u * u * t * my + 3 * u * t * t * my + t * t * t * b.y;
      paws += `<span class="paw ${b.reached ? 'on' : ''}" style="left:${(px + (n % 2 ? 1.2 : -1.2)).toFixed(1)}%;top:${py.toFixed(2)}rem;--r:${n % 2 ? 16 : -16}deg">🐾</span>`;
    });
  }
  let catEl = '';
  const html = items.map(it => {
    if (it.k === 'tier') { const d = DIFFS[it.t]; return `<div class="tierhead abs" style="top:${it.y}rem;background:var(--${d.btn.replace('b-', '')}s,#fff)">${d.icon} ${d.name} · ${P.done[it.t].length}/${MISSIONS.length}</div>`; }
    if (it.k === 'planet') {
      const pl = PLANETS[it.pi], op = pOpen(it.pi);
      return `<button class="pnode planet ${op ? '' : 'lock'}" data-act="goplanet" data-arg="${it.pi}" style="left:${it.x}%;top:${it.y}rem"><span class="c" style="background:linear-gradient(160deg,${pl.sky[0]},${pl.sky[2]})">${op ? pl.icon : '🔒'}</span>
        <small><b>${pl.name} · ${pl.n}×${pl.n}</b><br>${it.pi === 0 ? 'Twoja pierwsza kolonia' : op ? 'Odblokowana! Zabuduj ją' : pReason(it.pi)}</small></button>`;
    }
    const m = it.m, st = (P.stars[it.t] || {})[m.id] || 1, bg = it.done ? 'var(--mint)' : it.open ? m.color : '#E6E1F2';
    if (it.cur) catEl = `<div class="pcat" style="left:${it.x >= 50 ? it.x - 32 : it.x + 32}%;top:${it.y}rem">${cat('idle', 4.2)}</div>`;
    return `<button class="pnode ${it.open ? '' : 'lock'} ${it.cur ? 'cur' : ''}" ${it.cur ? 'id="curnode"' : ''} data-act="node" data-arg="${it.t}:${m.id}" style="left:${it.x}%;top:${it.y}rem">
      ${it.cur ? '<span class="start">START</span>' : ''}<span class="c" style="background:${bg}">${it.open ? (it.done ? '✅' : m.icon) : '🔒'}</span>
      <small>${m.title.replace(/^MeowMission \d+: /, '')}${it.done ? '<br>' + '⭐'.repeat(st) : ''}</small></button>`;
  }).join('');
  show(`<div class="scr">
    ${bar(streakPill(), '<span class="label">Szlak MeowMission</span>', `<span class="row gap-s">${starPill()}<button class="x" data-act="tut" data-arg="map">?</button></span>`)}
    <div class="row gap mb-s">${cat('idle', 4.4)}<div class="bubble" style="flex:1">Idź moim tropem 🐾 Każda zaliczona misja przybliża nowe kolonie!</div></div>
    <div class="pathbox" style="height:${total}rem;margin-bottom:1.5rem"><svg viewBox="0 0 100 ${total}" preserveAspectRatio="none"><path d="${dp}" fill="none" stroke="#E4DCFA" stroke-width="10" stroke-linecap="round" vector-effect="non-scaling-stroke"/></svg>${paws}${catEl}${html}</div>
  </div>`, { nav: true, tab: 'map' });
  const c = $('#curnode'); if (c && c.scrollIntoView) c.scrollIntoView({ block: 'center' });
  if (!P.tut.map) openTut('map');
}
let useGold = false;
function renderIntro(m, from = 'home') {
  stopGame(); cur = () => renderIntro(m, from);
  const d = DIFFS[P.diff];
  const gold = P.golden > 0
    ? `<button class="pcard mt ${useGold ? 'hot' : ''}" data-act="togold"><span style="font-size:2.2rem">💛</span><span class="grow"><b>${useGold ? 'Złote życie włączone' : 'Użyć złotego życia?'}</b><small>Masz ${P.golden}. Dodaje 4. serce na tę misję.</small></span><b style="font-size:1.4rem">${useGold ? '✅' : '○'}</b></button>`
    : `<button class="pcard mt" data-act="tab" data-arg="shop"><span style="font-size:2.2rem">💛</span><span class="grow"><b>Złote życie</b><small>4. serce na misję. Kupisz je w Sklepie za ${GOLD_PRICE} ⭐.</small></span><b style="font-size:1.4rem;color:var(--lavd)">›</b></button>`;
  show(`<div class="scr">
    ${bar(`<button class="x" data-act="tab" data-arg="${from}">←</button>`, '<span class="label">MeowMission</span>', `<span class="pill ${d.pill}">${d.icon} ${d.name}</span>`)}
    <div class="card tc pop mt-s" style="padding:1.5rem"><div style="font-size:3.6rem">${m.icon}</div>
      <h2 style="font-size:1.8rem;font-weight:900;margin-top:.3rem">${m.title}</h2>
      <p class="muted" style="font-size:1.05rem;margin:.6rem 0 0">5 pytań · 3 serca 💗 · na koniec gierka</p></div>
    <div class="row gap mt">${cat('idle', 6)}<div class="bubble" style="flex:1">${say(BR.start)}</div></div>
    ${gold}
    <div class="grow"></div>
    <div class="foot"><button class="btn b-lav nudge" data-act="start-mission" data-arg="${m.id}">START 🚀</button></div>
  </div>`);
}
