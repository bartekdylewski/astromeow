'use strict';
/* ===================== START + PĘTLA BAZY =====================
   Najpierw wczytujemy dane (config/*.json, patrz 00-data.js), dopiero potem startuje gra. */
function bootError(err) {
  console.error(err);
  show(`<div class="scr"><div class="grow"></div>
    <div class="col center tc">${cat('sad', 10)}<div class="bubble up big mt tc"><b>Miau, nie mogę wczytać pytań.</b><br>Wygląda na to, że plik otwarto bez serwera. Uruchom w folderze gry <b>python3 build.py</b> i otwórz plik <b>dist/astromeow.html</b>.</div></div>
    <div class="grow"></div></div>`);
}
async function boot() {
  if (new URLSearchParams(location.search).get('reset') === '1' && confirm('Wyczyścić zapis gry na tym urządzeniu?')) {   // ?reset=1
    try { localStorage.removeItem(SAVE_KEY); } catch (_) {}
    return location.replace(location.pathname);
  }
  load();
  if (!P.diff) P.diff = 'easy';
  const q = new URLSearchParams(location.search), dk = window.ALLOW_DEV ? q.get('dev') : null;   // ?dev=flappy[&diff=mid] (tylko serwer z --dev): od razu gra, bez zapisu i rankingu
  if (dk && !GAMES[dk]) console.warn('?dev= nieznany klucz gry, dostępne:', Object.keys(GAMES).join(', '));
  else if (dk) {
    DEV = dk; if (TIERS.includes(q.get('diff'))) P.diff = q.get('diff');
    newSet(dk, null); probeCat(); return playGame(dk);
  }
  await initPlayer();
  if (!player.nickname) renderProfile(true);
  else if (!P.runs && !P.tut.welcome) renderWelcome(); else renderHome();   // nowy gracz: kot prowadzi za rączkę
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
loadData().then(d => {
  for (const stage of d.missions.stages) stage.lesson = d.tutorials.lessons?.[stage.id];
  buildStages(d.missions);
  const started = boot();
  replaceEmoji(device);
  new MutationObserver(records => {
    for (const record of records) for (const node of record.addedNodes) {
      if (node.isConnected) replaceEmoji(node);
    }
  }).observe(device, { childList: true, subtree: true });
  return started;
}).catch(bootError);
