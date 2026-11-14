'use strict';
/* ===================== QUIZ: 5 pytań, 3 serca ===================== */
let S = null;
const ASK = ['Jak myślisz? 🤔', 'Którą wybierasz?', 'Zastanów się chwilę 🐾', 'Dasz radę! 💪'];
const COACH = 'Dotknij odpowiedź, którą uważasz za dobrą. Sprawdzę ją od razu! 👇';
function startMission(id) {
  stopGame();
  const m = MISSIONS.find(x => x.id === id);
  GSET = null;
  const gold = useGold && P.golden > 0; if (gold) { P.golden--; save(); } useGold = false;
  S = { m, d: P.diff, qs: pickQs(m, P.diff), replay: P.done[P.diff].includes(m.id), quizPts: 0, quizKnow: 0, stars: 1, i: 0, hearts: gold ? 4 : 3, maxH: gold ? 4 : 3, gold, sel: null, checked: false, correct: 0, combo: 0, line: P.tut.quiz ? pick(ASK) : COACH, game: null, gameKey: null };
  renderQuiz();
}
/* ekran quizu: tylko kot, pytanie i odpowiedzi. Astruś mówi wszystko (werdykt + wyjaśnienie) */
function renderQuiz(keep = false) {
  cur = () => renderQuiz();
  const q = S.qs[S.i], ok = S.checked && q.opts[S.sel].ok, bad = S.checked && !ok;
  const pose = S.checked ? (ok ? 'happy' : 'sad') : (S.sel !== null ? 'think' : 'idle');
  const hs = Array.from({ length: S.maxH }, (_, i) => `<span class="heart ${i === 3 ? 'gold' : ''} ${i < S.hearts ? '' : 'off'} ${bad && i === S.hearts ? 'pop' : ''}">${i === 3 ? '💛' : '❤️'}</span>`).join('');
  let ans = '';
  q.opts.forEach((o, i) => {
    /* stan nie tylko kolorem: ✓ / ✗ widać też bez rozróżniania barw */
    let st = '', mk = '';
    if (!S.checked && S.sel === i) st = 'sel';
    if (S.checked) { if (o.ok) { st = 'ok'; mk = '✓'; } else if (S.sel === i) { st = 'no'; mk = '✗'; } else st = 'dim'; }
    ans += `<button class="ans ${st}" data-ans="${i}" ${S.checked ? 'disabled' : ''}><span class="L">${LETTERS[i]}</span><span class="grow">${o.t}</span>${mk ? `<span class="mark" aria-label="${o.ok ? 'poprawna' : 'błędna'}">${mk}</span>` : ''}</button>`;
  });
  const foot = S.checked ? `<div class="foot"><button class="btn b-lav nudge" data-act="cont">${S.hearts === 0 && bad ? 'DALEJ ›' : (S.i === S.qs.length - 1 ? 'DO GIERKI 🎮' : 'DALEJ ›')}</button></div>` : '';
  show(`<div class="scr">
    ${bar('<button class="x" data-act="quit-quiz">✕</button>', `<div aria-label="Serca: ${S.hearts} z ${S.maxH}">${hs}</div>`, '<span style="width:2.8rem"></span>')}
    <div class="meter mb"><i style="width:${(S.i + (S.checked ? 1 : 0)) / S.qs.length * 100}%"></i></div>
    <div class="row gap mb"><div class="${bad ? 'shake' : ''}">${cat(pose, 7.5)}</div><div class="bubble line q"><span>${S.line}</span></div></div>
    <h2 class="qtext">${q.q}</h2>
    <div class="col gap-s" style="margin-bottom:1rem">${ans}</div>
    ${foot}
  </div>`, { keep });
}
function answer(i) { if (S && !S.checked) { S.sel = i; check(); } }
function check() {
  if (!S || S.sel === null || S.checked) return;
  const q = S.qs[S.i]; S.checked = true;
  const fact = q.f ? ' ' + q.f : '', coach = P.tut.quiz ? '' : '<br><small>Dotknij DALEJ, żeby lecieć dalej 👇</small>';
  if (q.opts[S.sel].ok) {
    const amt = S.replay ? 5 : 10;
    S.correct++; S.combo++; P.pts += amt; P.res.wiedza += amt; S.quizPts += amt; S.quizKnow += amt;
    if (!(P.seen[S.d] || (P.seen[S.d] = [])).includes(q.q)) P.seen[S.d].push(q.q);
    save(); window.sfx && sfx('ok');
    S.line = `<b>${pick(['Brawo!', 'Super!', 'Tak jest!', 'Świetnie!', 'Dokładnie!'])}</b>${fact || ''}${coach}`;
  } else {
    S.hearts--; S.combo = 0; window.sfx && sfx('no');
    S.line = `<b>Ups!</b> Dobra odpowiedź: <b>${q.opts.find(o => o.ok).t}</b>.${fact}${S.hearts === 0 ? '<br><small>To były ostatnie serca.</small>' : ''}${coach}`;
  }
  renderQuiz(true);
}
function cont() {
  if (!P.tut.quiz) { P.tut.quiz = true; save(); }
  if (S.hearts <= 0) return renderOut();
  S.i++; S.sel = null; S.checked = false; S.line = pick(ASK);
  if (S.i >= S.qs.length) return finishMission();
  renderQuiz();
}
function renderOut() {
  cur = renderOut; window.sfx && sfx('lose');
  show(`<div class="scr">
    ${bar('<button class="x" data-act="quit-yes">✕</button>', `<div>${[0, 1, 2].map(() => '<span class="heart off">❤️</span>').join('')}</div>`, '<span style="width:2.8rem"></span>')}
    <div class="grow"></div>
    <div class="col center tc">${cat('sad', 11)}<div class="bubble up big mt tc"><b>Koniec serc!</b><br>Nic się nie stało, ja w Ciebie wierzę! Spróbujemy jeszcze raz z nowymi pytaniami?</div></div>
    <div class="grow"></div>
    <div class="foot"><button class="btn b-lav nudge" data-act="start-mission" data-arg="${S.m.id}">SPRÓBUJ JESZCZE RAZ</button></div>
  </div>`);
}
function finishMission() {
  const d = S.d, done = P.done[d], before = doneCount();
  if (!done.includes(S.m.id)) done.push(S.m.id);
  S.newPlanet = PLANETS.findIndex(p => p.need > before && p.need <= doneCount());
  const nq = S.qs.length; S.stars = S.correct >= nq ? 3 : S.correct >= nq - 1 ? 2 : 1;
  P.stars[d][S.m.id] = Math.max(P.stars[d][S.m.id] || 0, S.stars);
  P.runs++; touchStreak(); save();
  const available = Object.keys(GAMES).filter(key => key !== lastGame);
  const k = !player.played && !Object.keys(P.best).length ? 'flappy' : pick(available);
  confetti(18); window.sfx && sfx('win'); newSet(k, true); renderGameIntro(k);
}
