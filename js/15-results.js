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
  stopGame();
  renderResult({ key, score, goal, passed, gain, pts, attempt: set.attempts, left: MAXTRY - set.attempts });
}
function renderResult(info) {
  cur = () => renderResult(info);
  const g = GAMES[info.key], set = GSET, mission = set.mission, final = info.passed || info.left <= 0;
  const title = info.passed ? 'Zaliczone!' : final ? 'Koniec prób' : 'Prawie!';
  const pose = info.passed ? 'cheer' : final ? 'happy' : 'think';
  let line = info.passed ? say(BR.gameHigh) : say(BR.gameLow);
  if (mission && final && P.runs === 1) line = 'Pierwsza misja za nami! 🎉 Na dole pojawiło się menu: misje, baza i sklep.';
  const miss = info.key === 'pack' ? '' : (info.passed ? '' : ` · brakuje ${Math.max(0, info.goal - info.score)}`);
  let body = '', promo = '';
  if (mission && final) {
    const tierDone = P.done[S.d].length === MISSIONS.length, nt = TIERS[TIERS.indexOf(S.d) + 1];
    body = `<p class="rew">⭐ +${S.quizPts + set.totPts} &nbsp; ${RES[g.res].icon} +${set.totGain} &nbsp; 🧠 +${S.quizKnow}</p><p class="muted tc" style="margin:.2rem 0 0">Quiz: ${S.correct}/${S.qs.length} ${'⭐'.repeat(S.stars)}</p>`;
    if (tierDone && nt) promo = `<div class="note mt-s">Poziom ${DIFFS[S.d].name} ukończony! W menu czeka awans: ${DIFFS[nt].icon} ${DIFFS[nt].name}</div>`;
    else if (tierDone) promo = `<div class="note mt-s">🏆 Wszystkie poziomy zaliczone! Jesteś mistrzem kosmosu!</div>`;
    if (S.newPlanet > 0) { const i = S.newPlanet, pl = PLANETS[i]; promo += `<div class="note mt-s">🪐 Odblokowana planeta ${pl.name}! ${pOpen(i) ? 'Zajrzyj do Bazy.' : 'Najpierw zabuduj ' + PLANETS[i - 1].name + ' w Bazie.'}</div>`; }
  } else {
    body = `<p class="rew">⭐ +${set.totPts} &nbsp; ${RES[g.res].icon} +${set.totGain}</p>`;
  }
  show(`<div class="scr">
    <div class="grow"></div>
    <div class="col center tc">${cat(pose, 10)}<div class="bubble up big mt tc">${line}</div>
      <h2 class="title" style="margin-top:1.1rem">${title}</h2>
      <p class="muted" style="margin:.3rem 0 0">Wynik: ${info.score}${info.key === 'pack' ? '' : ' · cel: ' + goalText(info.key)}${miss}</p>
      ${final ? '' : `<p class="muted" style="margin:.2rem 0 0">Próba ${info.attempt} z ${MAXTRY}</p>`}
      ${body}</div>
    ${promo}
    <div class="grow"></div>
    <div class="foot col gap-s">
      ${final ? '' : `<button class="btn b-lav nudge" data-act="retry-game">SPRÓBUJ JESZCZE (${info.attempt + 1}/${MAXTRY})</button>`}
      <button class="btn ${final ? 'b-lav nudge' : 'b-white'}" data-act="tab" data-arg="home">${final ? 'DALEJ ›' : 'WRÓĆ'}</button>
    </div>
  </div>`);
  if (info.passed) confetti(14);
  window.sfx && sfx(info.passed ? 'win' : 'lose');
}
