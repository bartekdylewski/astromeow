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
  const left = MAXTRY - set.attempts;
  mapMsg = endMsg({ passed, final: passed || left <= 0 });
  stopGame();
  renderResult({ key, score, goal, passed, gain, pts, attempt: set.attempts, left, submission });
}
let mapMsg = '';   // komunikat dla Szlaku misji (pokazywany raz po grze)
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
function renderResult(info) {
  cur = () => renderResult(info);
  const g = GAMES[info.key], set = GSET, final = info.passed || info.left <= 0;
  const miss = info.key === 'pack' ? '' : (info.passed ? '' : ` · brakuje ${Math.max(0, info.goal - info.score)}`);
  const body = set.mission && final
    ? `<p class="rew">⭐ +${S.quizPts + set.totPts} &nbsp; ${RES[g.res].icon} +${set.totGain} &nbsp; 🧠 +${S.quizKnow}</p>`
    : `<p class="rew">⭐ +${set.totPts} &nbsp; ${RES[g.res].icon} +${set.totGain}</p>`;
  show(`<div class="scr">
    ${g.noRank ? '' : '<section class="card mt" aria-label="Ranking minigry"><h3>Ranking</h3><div id="leaderboard">Ładowanie…</div></section>'}
    <div class="grow"></div>
    <div class="col center tc">
      <p class="muted" style="margin:0">Wynik: ${info.score}${info.key === 'pack' ? '' : ' · cel: ' + goalText(info.key)}${miss}</p>
      ${final ? '' : `<p class="muted" style="margin:.2rem 0 0">Próba ${info.attempt} z ${MAXTRY}</p>`}
      ${body}</div>
    <div class="grow"></div>
    <div class="foot col gap-s">
      ${final ? '' : `<button class="btn b-white" data-act="retry-game">SPRÓBUJ PONOWNIE (${info.attempt + 1}/${MAXTRY})</button>`}
      <button class="btn b-lav nudge" data-act="${DEV ? 'play' : 'tab'}" data-arg="${DEV ? info.key : 'map'}">DALEJ ›</button>
    </div>
  </div>`);
  if (!g.noRank) loadLeaderboard(info.key, $('#leaderboard'), info.submission);
  if (info.passed) confetti(14);
  window.sfx && sfx(info.passed ? 'win' : 'lose');
}
