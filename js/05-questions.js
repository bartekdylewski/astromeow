'use strict';
/* ===================== ETAPY, POZIOMY, PYTANIA, LEKCJE =====================
   Treść jest w config/missions.json (opis: docs/JAK-DODAC-ETAP.md). Tu tylko budujemy z niej
   globalne TIERS / DIFFS / MISSIONS, których używa reszta gry. Liczba etapów i pytań jest dowolna. */
let TIERS = [], DIFFS = {}, MISSIONS = [];
const LETTERS = ['A', 'B', 'C', 'D'];
const QUIZ_LEN = 5;   // ile pytań w jednej misji (jeśli w puli jest mniej, bierzemy tyle, ile jest)
const validQ = q => q && typeof q.q === 'string' && typeof q.a === 'string' && Array.isArray(q.w) && q.w.length >= 1;
function buildStages(stagesData) {
  const diffs = (stagesData && stagesData.difficulties) || [], stages = (stagesData && stagesData.stages) || [];
  if (!diffs.length || !stages.length) throw new Error('config/missions.json: brak poziomów lub etapów');
  TIERS = diffs.map(d => d.id); DIFFS = {};
  diffs.forEach(d => { DIFFS[d.id] = { id: d.id, name: d.name, icon: d.icon, desc: d.desc || '', mult: d.mult || 1 }; });
  MISSIONS = [];
  stages.forEach(s => {
    const qs = {}, lesson = {}, raw = s.lesson;
    TIERS.forEach(t => {
      qs[t] = ((s.questions || {})[t] || []).filter(q => validQ(q) || console.warn('Pominięto błędne pytanie w etapie', s.id, q));
      lesson[t] = Array.isArray(raw) ? raw : ((raw && (raw[t] || raw.all)) || []);
    });
    const any = TIERS.find(t => qs[t].length);
    if (!any) return console.warn('Etap', s.id, 'nie ma pytań, pominięty');
    TIERS.forEach(t => { if (!qs[t].length) qs[t] = qs[any]; });   // brak pytań na poziomie: użyj innego
    MISSIONS.push({ id: s.id, title: s.title, icon: s.icon, topic: s.topic || '🌌', qs, lesson });
  });
  if (!MISSIONS.length) throw new Error('config/missions.json: żaden etap nie ma pytań');
}
function pickQs(m, d) {
  const pool = m.qs[d];
  let seen = P.seen[d] || [];
  if (pool.every(q => seen.includes(q.q))) { P.seen[d] = seen = seen.filter(t => !pool.some(q => q.q === t)); }
  const fresh = shuffle(pool.filter(q => !seen.includes(q.q))), old = shuffle(pool.filter(q => seen.includes(q.q)));
  return [...fresh, ...old].slice(0, QUIZ_LEN).map(q => ({
    q: q.q, f: q.f || '', topic: m.topic,
    opts: shuffle([{ t: q.a, ok: true }, ...q.w.map(t => ({ t, ok: false }))]),
  }));
}
