'use strict';
/* ===================== QUIZ: 5 pytań, 3 serca ===================== */
let S = null;
function startMission(id) {
  stopGame();
  const m = MISSIONS.find(x => x.id === id);
  GSET = null;
  const gold = useGold && P.golden > 0; if (gold) { P.golden--; save(); } useGold = false;
  S = { m, d: P.diff, qs: pickQs(m, P.diff), replay: P.done[P.diff].includes(m.id), quizPts: 0, quizKnow: 0, stars: 1, i: 0, hearts: gold ? 4 : 3, maxH: gold ? 4 : 3, gold, sel: null, checked: false, correct: 0, combo: 0, line: say(BR.start), game: null, gameKey: null };
  renderQuiz();
  if (!P.tut.quiz) openTut('quiz');
}
function renderQuiz(keep = false) {
  cur = () => renderQuiz();
  const q = S.qs[S.i], ok = S.checked && q.opts[S.sel].ok, bad = S.checked && !ok, d = DIFFS[S.d];
  const pose = S.checked ? (ok ? (S.combo >= 3 ? 'cheer' : 'happy') : 'sad') : (S.sel !== null ? 'think' : 'idle');
  const hs = Array.from({ length: S.maxH }, (_, i) => `<span class="heart ${i === 3 ? 'gold' : ''} ${i < S.hearts ? '' : 'off'} ${bad && i === S.hearts ? 'pop' : ''}">${i === 3 ? '💛' : '💗'}</span>`).join('');
  let ans = '';
  q.opts.forEach((o, i) => {
    let b = 'var(--line)', bg = '#fff';
    if (!S.checked && S.sel === i) { b = 'var(--lavd)'; bg = 'var(--lavs)'; }
    if (S.checked) { if (o.ok) { b = 'var(--mintd)'; bg = 'var(--mints)'; } else if (S.sel === i) { b = 'var(--pinkd)'; bg = 'var(--pinks)'; } }
    ans += `<button class="ans" data-ans="${i}" style="border-color:${b};background:${bg}" ${S.checked ? 'disabled' : ''}><span class="L">${LETTERS[i]}</span><span class="grow">${o.t}</span></button>`;
  });
  let foot;
  if (!S.checked) foot = `<p class="hint" style="margin:0;font-size:1rem">👆 Dotknij odpowiedź. Sprawdzę ją od razu!</p>`;
  else foot = `<div class="fb ${ok ? 'ok' : 'no'}"><b>${ok ? `✅ Brawo! +${S.replay ? 5 : 10} ⭐ +${S.replay ? 5 : 10} 🧠` : '❌ Ups!'}</b>
      <p>${ok ? '' : 'Dobra odpowiedź: <b style="display:inline;font-size:inherit">' + q.opts.find(o => o.ok).t + '</b>. '}${q.f ? '💡 ' + q.f : ''}</p></div>
    <button class="btn ${ok ? 'b-mint' : 'b-pink'} nudge" data-act="cont">${S.hearts === 0 && bad ? 'DALEJ ›' : (S.i === 4 ? 'DO GIERKI 🎮' : 'DALEJ ›')}</button>`;
  show(`<div class="scr">
    ${bar('<button class="x" data-act="tab" data-arg="map">✕</button>', `<div>${hs}</div>`, `<span class="row gap-s">${streakPill()}<button class="x" data-act="tut" data-arg="quiz">?</button></span>`)}
    <div class="meter mb"><i style="width:${(S.i + (S.checked ? 1 : 0)) / 5 * 100}%"></i></div>
    <div class="row gap mb"><div class="${bad ? 'shake' : ''}">${cat(pose, 5.6)}</div><div class="bubble line">${S.line}</div></div>
    <div class="row between mb-s"><span class="label">Pytanie ${S.i + 1} z 5 · ${S.m.topic}</span><span>${S.replay ? '<span class="pill bt diffchip">↺ powtórka ½</span> ' : ''}<span class="pill ${d.pill} diffchip">${d.icon} ${d.name}</span></span></div>
    <h2 class="qtext">${q.q}</h2>
    <div class="col gap-s" style="margin-bottom:1rem">${ans}</div>
    <div class="foot">${foot}</div>
  </div>`, { keep });
}
function answer(i) { if (S && !S.checked) { S.sel = i; check(); } }
function check() {
  if (!S || S.sel === null || S.checked) return;
  const q = S.qs[S.i]; S.checked = true;
  if (q.opts[S.sel].ok) {
    const amt = S.replay ? 5 : 10;
    S.correct++; S.combo++; P.pts += amt; P.res.wiedza += amt; S.quizPts += amt; S.quizKnow += amt;
    if (!(P.seen[S.d] || (P.seen[S.d] = [])).includes(q.q)) P.seen[S.d].push(q.q);
    save();
    S.line = S.combo >= 3 ? say(BR.combo) : say(BR.good);
    confetti(S.combo >= 3 ? 26 : 12);
  } else {
    S.hearts--; S.combo = 0;
    S.line = S.hearts === 0 ? say(BR.dead) : S.hearts === 1 ? say(BR.last) : say(BR.bad);
    confetti(6, ['💀', '😵', '🫠', '🗿']);
  }
  renderQuiz(true);
}
function cont() {
  if (S.hearts <= 0) return renderOut();
  S.i++; S.sel = null; S.checked = false; S.line = say(BR.start);
  if (S.i >= 5) return finishMission();
  renderQuiz();
}
function renderOut() {
  cur = renderOut;
  show(`<div class="scr">
    ${bar('<button class="x" data-act="tab" data-arg="map">✕</button>', `<div>${[0, 1, 2].map(() => '<span class="heart off">💗</span>').join('')}</div>`, streakPill())}
    <div class="grow"></div>
    <div class="tc col center">${cat('sad', 10)}<h2 style="font-size:1.9rem;font-weight:900;margin-top:.8rem">Koniec serc!</h2>
      <div class="bubble up mt-s">${S.line}</div>
      <p class="muted mt" style="font-size:1.05rem">Postęp zostaje. Wybierz misję na szlaku i spróbuj z nowymi pytaniami!</p></div>
    <div class="grow"></div>
    <div class="foot"><button class="btn b-lav nudge" data-act="tab" data-arg="map">MENU MISJI 🗺️</button></div>
  </div>`);
}
function finishMission() {
  const d = S.d, done = P.done[d], before = doneCount();
  if (!done.includes(S.m.id)) done.push(S.m.id);
  S.newPlanet = PLANETS.findIndex(p => p.need > before && p.need <= doneCount());
  S.stars = S.correct >= 5 ? 3 : S.correct >= 4 ? 2 : 1;
  P.stars[d][S.m.id] = Math.max(P.stars[d][S.m.id] || 0, S.stars);
  P.runs++; touchStreak(); save();
  let k; do { k = pick(Object.keys(GAMES)); } while (k === lastGame && Object.keys(GAMES).length > 1);
  confetti(24); newSet(k, true); renderGameIntro(k);
}
