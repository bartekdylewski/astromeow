'use strict';
/* ===================== STAN ===================== */
const key = (x, y) => x + ',' + y;
const fresh = () => ({
  pts: 0, streak: 0, lastDay: null, diff: null, startIdx: 0, runs: 0, done: { easy: [], mid: [], hard: [] }, best: {},
  stars: { easy: {}, mid: {}, hard: {} }, seen: { easy: [], mid: [], hard: [] },
  res: { wiedza: 20, czesci: 0, meteo: 0 }, planets: PLANETS.map(() => ({ grid: {} })), planet: 0, seenPlanets: 1,
  tut: { welcome: false, quiz: false, base: false, map: false, shop: false },
  skin: 'classic', skins: ['classic'], golden: 0, lessons: {},
  lastSave: Date.now(),
});
let P = fresh();
const today = () => new Date().toLocaleDateString('sv');
const yesterday = () => { const d = new Date(); d.setDate(d.getDate() - 1); return d.toLocaleDateString('sv'); };
function save() { if (DEV) return; try { localStorage.setItem(SAVE_KEY, JSON.stringify({ ...P, lastSave: Date.now() })); } catch (_) {} }
function load() {
  try {
    const raw = localStorage.getItem(SAVE_KEY); if (!raw) return;
    const s = JSON.parse(raw), f = fresh();
    P = { ...f, ...s, res: { ...f.res, ...s.res }, done: { ...f.done, ...s.done }, best: { ...s.best }, stars: { ...f.stars, ...s.stars }, seen: { ...f.seen, ...s.seen },
          tut: { ...f.tut, ...s.tut }, lessons: { ...(s.lessons || {}) }, skins: Array.isArray(s.skins) && s.skins.length ? s.skins : ['classic'], planets: PLANETS.map((_, i) => ({ grid: { ...(((s.planets || [])[i] || {}).grid || {}) } })) };
    const away = Math.min(7200, (Date.now() - (s.lastSave || Date.now())) / 1000);
    if (away > 5) { const g = rates(); for (const k in g) P.res[k] += g[k] * away; }
  } catch (_) {}
}
function touchStreak() {
  const t = today(); if (P.lastDay === t) return;
  P.streak = P.lastDay === yesterday() ? P.streak + 1 : 1; P.lastDay = t;
}

/* ---- ekonomia bazy (planety) ---- */
const fmt = n => n >= 1000 ? (n / 1000).toFixed(1) + 'k' : String(Math.floor(n * 10) / 10);
const doneCount = () => TIERS.reduce((a, t) => a + P.done[t].length, 0);
const pGrid = i => P.planets[i].grid;
const pFull = i => Object.keys(pGrid(i)).length >= PLANETS[i].n * PLANETS[i].n;
const pOpen = i => i === 0 || (pFull(i - 1) && doneCount() >= PLANETS[i].need);
function pReason(i) {
  const miss = [], left = PLANETS[i].need - doneCount();
  if (!pFull(i - 1)) miss.push(`zabuduj ${PLANETS[i - 1].name}`);
  if (left > 0) miss.push(`zalicz jeszcze ${left} ${misPl(left)}`);
  return miss.join(' i ');
}
const tileAt = (x, y) => pGrid(P.planet)[key(x, y)] || null;
const satLevels = i => Object.values(pGrid(i)).filter(t => t.type === 'satelita').reduce((a, t) => a + t.level, 0);
const globalMult = i => (1 + Math.min(1, TYPES.satelita.aura * satLevels(i)));
const scaleC = (c, m) => Object.fromEntries(Object.entries(c).map(([k, v]) => [k, Math.ceil(v * m)]));
const placeCost = (type, i) => scaleC(TYPES[type].base, PLANETS[i].cm);
const addonCost = (id, i) => scaleC(ADDONS[id].cost, PLANETS[i].cm);
function upgradeCost(t, i) { const out = {}, def = TYPES[t.type]; for (const k in def.base) out[k] = Math.ceil(def.base[k] * (t.level + 1) * 1.5 * PLANETS[i].cm); return out; }
function buildingRates(t, i) {
  const out = {}, def = TYPES[t.type]; if (!def || !def.prod) return out;
  const am = 1 + t.addons.reduce((a, id) => a + ADDONS[id].mult, 0);
  for (const k in def.prod) out[k] = def.prod[k] * t.level * am * globalMult(i) * PLANETS[i].pm;
  return out;
}
function rates() {
  const r = { wiedza: 0, czesci: 0, meteo: 0 };
  PLANETS.forEach((_, i) => { for (const t of Object.values(pGrid(i))) { const b = buildingRates(t, i); for (const k in b) r[k] += b[k]; } });
  return r;
}
const canAfford = c => Object.keys(c).every(k => P.res[k] >= c[k]);
const pay = c => { for (const k in c) P.res[k] -= c[k]; };
const goalFor = k => Math.max(1, ...Object.keys(TYPES).map(t => placeCost(t, P.planet)[k] || 0));
const chips = cost => Object.keys(cost).map(k => `<span class="pill" style="${P.res[k] >= cost[k] ? '' : 'background:var(--grey);border-color:var(--muted);color:var(--muted)'}">${RES[k].icon} ${fmt(cost[k])}</span>`).join(' ');
