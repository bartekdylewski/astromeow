'use strict';
/* ===================== MAPA MISJI + SALON GIER ===================== */
function nextTarget() {
  const t = P.diff || 'easy', m = MISSIONS.find(x => !P.done[t].includes(x.id));
  if (m) return { tier: t, m };
  const nt = TIERS[TIERS.indexOf(t) + 1];
  if (nt) return { tier: nt, m: MISSIONS.find(x => !P.done[nt].includes(x.id)) || MISSIONS[0], promote: true };
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
  const items = []; let cnt = 0;   // planety są w Bazie, na szlaku tylko misje
  TIERS.forEach(t => {
    items.push({ k: 'tier', t });
    MISSIONS.forEach(m => { cnt++; items.push({ k: 'node', t, m }); });
  });
  const H = { tier: 5, node: 9.5 }; let y = 0, j = 0, prevReached = true;
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
      paws += `<span class="paw ${b.reached ? 'on' : ''}" style="left:${(px + (n % 2 ? 1.2 : -1.2)).toFixed(1)}%;top:${py.toFixed(2)}rem;--r:${n % 2 ? 16 : -16}deg"></span>`;
    });
  }
  let catEl = '';
  const html = items.map(it => {
    if (it.k === 'tier') { const d = DIFFS[it.t]; return `<div class="tierhead abs ${it.t === P.diff ? 'cur' : ''}" style="top:${it.y}rem">${d.icon} ${d.name} · ${P.done[it.t].length}/${MISSIONS.length}</div>`; }
    const m = it.m, st = (P.stars[it.t] || {})[m.id] || 1;
    if (it.cur) catEl = `<div class="pcat" style="left:${it.x >= 50 ? it.x - 32 : it.x + 32}%;top:${it.y}rem">${cat('idle', 4.2)}</div>`;
    return `<button class="pnode ${it.open ? '' : 'lock'} ${it.done ? 'done' : ''} ${it.cur ? 'cur' : ''}" ${it.cur ? 'id="curnode"' : ''} data-act="node" data-arg="${it.t}:${m.id}" style="left:${it.x}%;top:${it.y}rem">
      ${it.cur ? '<span class="start">START</span>' : ''}<span class="c">${it.open ? (it.done ? '✅' : m.icon) : '🔒'}</span>
      <small>${m.title.replace(/^MeowMission \d+: /, '')}${it.done ? '<br>' + '⭐'.repeat(st) : ''}</small></button>`;
  }).join('');
  show(`<div class="scr">
    ${bar('<span style="width:2.8rem"></span>', '<span class="label">Szlak misji</span>', '<button class="x" data-act="tut" data-arg="map">?</button>')}
    <div class="pathbox" style="height:${total}rem;margin-bottom:1.5rem"><svg viewBox="0 0 100 ${total}" preserveAspectRatio="none"><path d="${dp}" fill="none" style="stroke:var(--grey)" stroke-width="10" stroke-linecap="round" vector-effect="non-scaling-stroke"/></svg>${paws}${catEl}${html}</div>
  </div>`, { nav: true, tab: 'map' });
  const c = $('#curnode'); if (c && c.scrollIntoView) c.scrollIntoView({ block: 'center' });
  if (!P.tut.map) openTut('map');
}
let useGold = false;
function renderIntro(m, from = 'home') {
  stopGame(); cur = () => renderIntro(m, from);
  const gold = P.golden > 0
    ? `<button class="pcard mt ${useGold ? 'hot' : ''}" data-act="togold"><span style="font-size:2rem">💛</span><span class="grow"><b>${useGold ? 'Złote życie włączone' : 'Użyć złotego życia?'}</b><small>Dodaje 4. serce na tę misję.</small></span><b style="font-size:1.4rem">${useGold ? '✅' : '○'}</b></button>` : '';
  show(`<div class="scr">
    ${bar(`<button class="x" data-act="tab" data-arg="${from}">←</button>`, '', '<span style="width:2.8rem"></span>')}
    <div class="grow"></div>
    <div class="col center tc">${cat('happy', 11, 'float')}<div class="bubble up big mt tc"><b>${m.title}</b><br>${introLine(m)}</div></div>
    ${gold}
    <div class="grow"></div>
    <div class="foot"><button class="btn b-lav nudge" data-act="start-mission" data-arg="${m.id}">START 🚀</button>
      ${lessonOf(m).length ? `<button class="link w100" data-act="lesson" data-arg="${m.id}:0:0">📖 Lekcja</button>` : ''}</div>
  </div>`);
}
const introLine = m => `${Math.min(QUIZ_LEN, m.qs[P.diff].length)} pytań, 3 serca i gierka na koniec. Dasz radę!`;

/* ===== LEKCJA przed etapem: Astruś tłumaczy temat pytań (karty z config/tutorials.json, pole "lessons") ===== */
const lessonOf = (m, t = P.diff) => (m.lesson && m.lesson[t]) || [];
const lessonKey = (m, t = P.diff) => t + ':' + m.id;
/* start misji: jeśli lekcja na tym poziomie jeszcze nie była widziana, najpierw ona */
function beginMission(id) {
  const m = MISSIONS.find(x => x.id === id);
  if (m && lessonOf(m).length && !P.lessons[lessonKey(m)]) return renderLesson(m, 0, true);
  return startMission(id);
}
function renderLesson(m, i, auto) {
  stopGame(); cur = () => renderLesson(m, i, auto);
  const cards = lessonOf(m), c = cards[i], last = i === cards.length - 1;
  show(`<div class="scr">
    ${bar('<span style="width:2.8rem"></span>', `<span class="label">📖 Lekcja · ${m.title.replace(/^MeowMission \d+: /, '')}</span>`, '<span style="width:2.8rem"></span>')}
    <div class="grow"></div>
    <div class="col center tc">${cat(last ? 'cheer' : (i % 2 ? 'think' : 'happy'), 9, 'float')}
      <div class="lcard mt"><div class="licon">${c.icon || '💡'}</div><h3>${c.title}</h3><p>${c.text}</p></div></div>
    <div class="dots mt">${cards.map((_, k) => `<i class="${k === i ? 'on' : ''}"></i>`).join('')}</div>
    <div class="grow"></div>
    <div class="foot"><button class="btn b-lav nudge" data-act="lesson" data-arg="${m.id}:${i + 1}:${auto ? 1 : 0}">${last ? (auto ? 'DO PYTAŃ 🚀' : 'GOTOWE') : 'DALEJ ›'}</button>
      ${last ? '' : `<button class="link w100" data-act="lesson-end" data-arg="${m.id}:${auto ? 1 : 0}">pomiń</button>`}</div>
  </div>`);
}
/* arg "id:indeks:auto" (auto=1: po lekcji startuje quiz) */
function lessonStep(arg) {
  const [id, i, auto] = arg.split(':').map(Number), m = MISSIONS.find(x => x.id === id);
  if (i < lessonOf(m).length) return renderLesson(m, i, !!auto);
  return lessonEnd(id + ':' + auto);
}
function lessonEnd(arg) {
  const [id, auto] = arg.split(':').map(Number), m = MISSIONS.find(x => x.id === id);
  P.lessons[lessonKey(m)] = true; save();
  return auto ? startMission(id) : renderIntro(m);
}
