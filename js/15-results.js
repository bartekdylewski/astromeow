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
  mapMsg = endMsg({ passed, final }) + resultCard({ key, score, goal, passed, attempt: set.attempts, retry, final });
  mapRank = GAMES[key].noRank ? null : { key, submission };
  renderMap();   // #22: bez osobnego ekranu wyniku, od razu Misje
  if (passed) confetti(14);
  window.sfx && sfx(passed ? 'win' : 'lose');
}
let mapMsg = '';   // komunikat dla Szlaku misji (pokazywany raz po grze)
let mapRank = null;   // { key, submission }: ranking do wczytania w karcie wyniku na Misjach
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
/* karta wyniku na Szlaku misji: wynik, nagrody, ranking i ponowna próba */
function resultCard({ key, score, goal, passed, attempt, retry, final }) {
  const g = GAMES[key], set = GSET;
  const miss = key === 'pack' || passed ? '' : ` · brakuje ${Math.max(0, goal - score)}`;
  const rew = set.mission && final
    ? `⭐ +${S.quizPts + set.totPts} &nbsp; ${RES[g.res].icon} +${set.totGain} &nbsp; 🧠 +${S.quizKnow}`
    : `⭐ +${set.totPts} &nbsp; ${RES[g.res].icon} +${set.totGain}`;
  return `<section class="card mt tc" aria-label="Wynik gierki">
    <p class="muted" style="margin:0">${g.icon} ${g.name} · wynik: ${score}${key === 'pack' ? '' : ' · cel: ' + goalText(key)}${miss}</p>
    ${retry ? `<p class="muted" style="margin:.2rem 0 0">Próba ${attempt} z ${MAXTRY}</p>` : ''}
    <p class="rew">${rew}</p>
    ${g.noRank ? '' : '<div id="leaderboard" class="mt-s">Ładowanie…</div>'}
    ${retry ? `<button class="btn b-white mt-s" data-act="retry-game">SPRÓBUJ PONOWNIE (${attempt + 1}/${MAXTRY})</button>` : ''}
  </section>`;
}
