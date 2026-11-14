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
  const dots = `<div class="dots mt-s">${Array.from({ length: MAXTRY }, (_, i) => `<i class="${i < info.attempt ? (i === info.attempt - 1 && info.passed ? 'ok' : 'on') : ''}"></i>`).join('')}</div>`;
  const title = info.passed ? '✅ Zaliczone!' : final ? 'Koniec prób' : 'Prawie! 💪';
  const line = info.passed ? say(BR.gameHigh) : say(BR.gameLow);
  const pose = info.passed ? 'cheer' : final ? 'happy' : 'think';
  const miss = info.key === 'pack' ? '' : (info.passed ? '' : ` · brakuje ${Math.max(0, info.goal - info.score)}`);
  let body = '', promo = '';
  if (mission && final) {
    const tierDone = P.done[S.d].length === MISSIONS.length, nt = TIERS[TIERS.indexOf(S.d) + 1];
    body = `<div class="grid3 mt"><div class="stat"><div class="ic">⭐</div><b>+${S.quizPts + set.totPts}</b><small>punkty</small></div>
      <div class="stat"><div class="ic">${RES[g.res].icon}</div><b>+${set.totGain}</b><small>${RES[g.res].name}</small></div>
      <div class="stat"><div class="ic">🧠</div><b>+${S.quizKnow}</b><small>wiedza</small></div></div>
      <p class="muted tc mt-s">Quiz: ${S.correct}/5 ${'⭐'.repeat(S.stars)}</p>`;
    if (tierDone && nt) promo = `<div class="promo mt-s">🎉 Poziom ${DIFFS[S.d].name} ukończony!<br><span style="font-size:.85rem">W menu czeka awans: ${DIFFS[nt].icon} ${DIFFS[nt].name}</span></div>`;
    else if (tierDone) promo = `<div class="promo mt-s">🏆 Wszystkie poziomy zaliczone! Jesteś mistrzem kosmosu!</div>`;
    if (S.newPlanet > 0) { const i = S.newPlanet, pl = PLANETS[i]; promo += `<div class="promo mt-s">🪐 Masz już ${pl.need} ${misPl(pl.need)} na planetę ${pl.name}!<br><span style="font-size:.85rem">${pOpen(i) ? 'Zajrzyj do bazy i leć na nową planetę!' : 'Najpierw zabuduj ' + PLANETS[i - 1].name + ' w bazie.'}</span></div>`; }
  } else {
    body = `<div class="grid3 mt"><div class="stat"><div class="ic">⭐</div><b>+${set.totPts}</b><small>punkty</small></div>
      <div class="stat"><div class="ic">${RES[g.res].icon}</div><b>+${set.totGain}</b><small>${RES[g.res].name}</small></div>
      <div class="stat"><div class="ic">🏅</div><b>${P.best[info.key]}</b><small>rekord</small></div></div>`;
  }
  show(`<div class="scr">
    ${bar('<span style="width:2.6rem"></span>', `<span class="label">${mission && final ? 'Raport MeowMission' : g.name}</span>`, streakPill())}
    <div class="tc col center mt-s">${cat(pose, 8)}
      <h2 style="font-size:1.7rem;font-weight:900;margin-top:.5rem">${title}</h2>
      <div class="bubble up mt-s">${line}</div>
      <p class="muted mt-s">Wynik: ${info.score}${info.key === 'pack' ? '' : ' · cel: ' + goalText(info.key)}${miss}</p>
      ${dots}<p class="muted" style="margin:.3rem 0 0;font-size:.85rem">Próba ${info.attempt} z ${MAXTRY}</p></div>
    ${body}${promo}
    <div class="grow"></div>
    <div class="foot col gap-s">
      ${final ? '' : `<button class="btn b-peach" data-act="retry-game">SPRÓBUJ JESZCZE (${info.attempt + 1}/${MAXTRY}) 🎮</button>`}
      <button class="btn ${final ? 'b-lav' : 'b-white'}" data-act="tab" data-arg="map">MENU MISJI 🗺️</button>
    </div>
  </div>`);
  confetti(info.passed ? 30 : 8);
}
