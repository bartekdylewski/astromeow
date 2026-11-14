'use strict';
/* ===================== START + PĘTLA BAZY =====================
   Najpierw wczytujemy dane (data/*.json, patrz 00-data.js), dopiero potem startuje gra. */
function bootError(err) {
  console.error(err);
  show(`<div class="scr"><div class="grow"></div>
    <div class="col center tc">${cat('sad', 10)}<div class="bubble up big mt tc"><b>Miau, nie mogę wczytać pytań.</b><br>Wygląda na to, że plik otwarto bez serwera. Uruchom w folderze gry <b>python3 build.py</b> i otwórz plik <b>dist/astromeow.html</b>.</div></div>
    <div class="grow"></div></div>`);
}
function boot() {
  load();
  if (!P.diff) P.diff = 'easy';
  if (!P.runs && !P.tut.welcome) renderWelcome(); else renderHome();   // nowy gracz: kot prowadzi za rączkę
  probeCat();
  let lastTick = Date.now();
  setInterval(() => {
    const now = Date.now(), dt = (now - lastTick) / 1000; lastTick = now;
    const r = rates(); for (const k in r) P.res[k] += r[k] * dt;
    if ($('#v-wiedza')) updateStats();
  }, 500);
  setInterval(save, 5000);
  addEventListener('beforeunload', save);
}
loadData().then(d => { buildStages(d.stages); boot(); }).catch(bootError);
