'use strict';
/* ===================== STAN ===================== */
const key = (x, y) => x + ',' + y;
const fresh = () => ({
  pts: 0, streak: 0, lastDay: null, diff: null, startIdx: 0, runs: 0, done: { easy: [], mid: [], hard: [] }, best: {},
  stars: { easy: {}, mid: {}, hard: {} }, seen: { easy: [], mid: [], hard: [] },
  res: { wiedza: 20, czesci: 0, meteo: 0 }, planets: PLANETS.map(() => ({ grid: {} })), planet: 0, seenPlanets: 1, baseVer: BASE_VER,
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
    if (s.baseVer !== BASE_VER) { delete s.res; delete s.planets; s.planet = 0; s.seenPlanets = 1; s.baseVer = BASE_VER; }   // stara baza -> czysta
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
const pOpen = i => i === 0 || !!window.ALLOW_DEV || (pFull(i - 1) && doneCount() >= PLANETS[i].need);   // serwer z --dev: wszystkie planety odblokowane
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

/* serwer z --dev + ?demo=1: przykładowy stan do nagrania dema (zaliczone misje, zasoby, zabudowane planety) */
function demoState() {
  const ids = MISSIONS.map(m => m.id), B = (type, level, addons = []) => ({ type, level, addons });
  P = { ...fresh(), pts: 260, runs: 12, streak: 5, lastDay: today(), diff: 'mid', golden: 1, planet: 1, seenPlanets: 6,
    tut: { welcome: true, quiz: true, base: true, map: true, shop: true }, res: { wiedza: 420, czesci: 380, meteo: 260 } };
  TIERS.forEach((t, ti) => {
    const n = ti === 0 ? ids.length : ti === 1 ? Math.ceil(ids.length * .6) : 0;
    P.done[t] = ids.slice(0, n); ids.slice(0, n).forEach((id, i) => { P.stars[t][id] = 2 + (i % 2); });
  });
  P.planets[0].grid = { '0,0': B('warsztat', 4, ['panel', 'antena']), '1,0': B('lab', 3, ['kopula']), '0,1': B('lowca', 3, ['kopula']), '1,1': B('satelita', 2) };
  P.planets[1].grid = { '0,0': B('warsztat', 3, ['panel']), '1,0': B('lab', 2), '2,0': B('lowca', 2), '0,1': B('satelita', 2, ['antena']), '1,1': B('hangar', 2, ['panel']), '2,1': B('lab', 1), '0,2': B('warsztat', 2) };
  P.planets[2].grid = { '0,0': B('lowca', 2), '1,0': B('satelita', 1), '1,1': B('warsztat', 2, ['panel']), '2,2': B('hangar', 1) };
  P.planets[3].grid = { '0,0': B('lab', 1), '1,1': B('lowca', 1), '2,2': B('warsztat', 1) };
}
