'use strict';
/* ===================== WYNIK GIERKI / MISJI ===================== */
function finishGame(key, score, passedFlag) {
  const d = DIFFS[P.diff], g = GAMES[key], set = GSET;
  const goal = key === 'pack' ? 0 : GOAL[P.diff][key];
  const passed = passedFlag !== undefined ? passedFlag : score >= goal;
  set.attempts++;
  const delta = Math.max(0, score - set.best); set.best = Math.max(set.best, score);   // liczy się najlepsza próba
  const rm = set.mission && S && S.replay ? .5 : 1;
  const gain = Math.round(delta * d.mult * rm);
  let pts = Math.round(delta * 5 * d.mult * rm);
  if (passed && !set.passed) pts += Math.round(20 * rm);                                  // bonus za zaliczenie
  set.passed = set.passed || passed; set.totGain += gain; set.totPts += pts;
  P.res[g.res] += gain; P.pts += pts; P.best[key] = Math.max(P.best[key] || 0, score); save();
  const submission = submitRankedScore(key, score);
  const left = MAXTRY - set.attempts, final = passed || left <= 0;
  const retry = left > 0 && (!final || (key !== 'pack' && !goal));   // gra bez celu: próby na lepszy wynik w rankingu
  stopGame();
  mapMsg = endMsg({ passed, final });   // dymek Astrusia w Bazie po DALEJ
  renderResult({ key, score, goal, passed, attempt: set.attempts, retry, submission });
}
let mapMsg = '';   // komunikat Astrusia po grze (pokazywany raz, w Bazie)
function endMsg({ passed, final }) {
  const set = GSET, mission = set.mission;
  let line = passed ? say(BR.gameHigh) : say(BR.gameLow);
  if (mission && final && P.runs === 1) line = 'Pierwsza misja za nami! 🎉 Na dole pojawiło się menu: misje, baza i sklep.';
  let promo = '';
  if (mission && final) {
    const tierDone = P.done[S.d].length === MISSIONS.length, nt = TIERS[TIERS.indexOf(S.d) + 1];
    if (tierDone && nt) promo = `<br>Poziom ${DIFFS[S.d].name} ukończony! W menu czeka awans: ${DIFFS[nt].icon} ${DIFFS[nt].name}`;
    else if (tierDone) promo = '<br>🏆 Wszystkie poziomy zaliczone! Jesteś mistrzem kosmosu!';
    if (S.newPlanet > 0) { const i = S.newPlanet, pl = PLANETS[i]; promo += `<br>🪐 Odblokowana planeta ${pl.name}! ${pOpen(i) ? 'Zajrzyj do Bazy.' : 'Najpierw zabuduj ' + PLANETS[i - 1].name + ' w Bazie.'}`; }
  }
  return catSay(passed ? 'cheer' : final ? 'happy' : 'think', line + promo, { size: 4.6 });
}
/* pełny ekran wyniku: sekcja QUIZ (tylko w misji) i GIERKA; przyciski tylko DALEJ i SPRÓBUJ PONOWNIE */
function renderResult({ key, score, goal, passed, attempt, retry, submission }) {
  cur = () => renderResult({ key, score, goal, passed, attempt, retry, submission });
  const g = GAMES[key], set = GSET, sec = (t, body) => `<section class="card mt tc"><div class="label mb-s">${t}</div>${body}</section>`;
  const quiz = set.mission && S ? sec('Quiz', `<p style="margin:0;font-size:1.2rem;font-weight:900">${S.correct}/${S.qs.length} dobrze · ${'⭐'.repeat(S.stars)}</p>
    <p class="rew">⭐ +${S.quizPts} &nbsp; ${RES.wiedza.icon} +${S.quizKnow}</p>`) : '';
  const miss = key === 'pack' || passed ? '' : ` · brakuje ${Math.max(0, goal - score)}`;
  const game = sec(`${g.icon} ${g.name}`, `<p style="margin:0;font-size:1.4rem;font-weight:900">Wynik: ${score}</p>
    <p class="muted" style="margin:.2rem 0 0">${key === 'pack' ? '' : 'Cel: ' + goalText(key) + miss}${retry ? ` · próba ${attempt} z ${MAXTRY}` : ''}</p>
    ${g.noRank ? '' : '<h3 class="mt" style="margin-bottom:.3rem">🏆 Ranking</h3><div id="leaderboard">Ładowanie…</div>'}`);
  show(`<div class="scr">
    <div class="col center tc mt">${cat(passed ? 'cheer' : 'think', 6)}<h1 class="title" style="margin:.4rem 0 0">${passed ? 'Zaliczone!' : 'Koniec gierki'}</h1></div>
    ${quiz}${game}
    <div class="foot col gap-s">
      ${retry ? `<button class="btn b-white" data-act="retry-game">SPRÓBUJ PONOWNIE (${attempt + 1}/${MAXTRY})</button>` : ''}
      <button class="btn b-lav nudge" data-act="tab" data-arg="base">DALEJ ›</button>
    </div>
  </div>`);
  if (!g.noRank) loadLeaderboard(key, $('#leaderboard'), submission);
  if (passed) confetti(14);
  window.sfx && sfx(passed ? 'win' : 'lose');
}
