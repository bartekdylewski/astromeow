'use strict';
/* ===================== MENU (home) ===================== */
function homeLine() {
  const t = nextTarget();
  if (P.runs === 1) return 'Świetna pierwsza misja! 🎉 Zagramy następną?';
  if (t.promote) return `Poziom zaliczony! Czas na poziom ${DIFFS[t.tier].name} ${DIFFS[t.tier].icon}`;
  if (PLANETS.filter((_, i) => pOpen(i)).length > P.seenPlanets) return 'Nowa planeta czeka w Bazie! 🪐';
  if (P.streak >= 3) return `Seria ${P.streak} dni! Tak trzymaj 🔥`;
  return pick(['Miau! Gotowy na kolejną misję? 🚀', 'Dziś kosmos będzie nasz ✨', 'Cześć! Co dziś odkryjemy? 🪐']);
}
function renderHome() {
  stopGame(); cur = renderHome;
  const d = DIFFS[P.diff], t = nextTarget(), done = P.done[P.diff].length;
  let cta;
  if (t.promote) cta = `<button class="btn b-lav nudge" data-act="start-next">AWANSUJ: POZIOM ${DIFFS[t.tier].name.toUpperCase()} ${DIFFS[t.tier].icon}</button>`;
  else if (t.replay) cta = `<button class="btn b-lav nudge" data-act="start-next">POWTÓRKA 🚀<small>Wszystko zaliczone! Powtórki dają połowę nagród</small></button>`;
  else cta = `<button class="btn b-lav nudge" data-act="start-next">GRAJ 🚀<small>${t.m.title.replace(/^MeowMission \d+: /, '')}</small></button>`;
  show(`<div class="scr">
    <div class="tc"><h1 class="logo sm"><span>Astro</span>Meow</h1></div>
    <div class="grow"></div>
    <div class="col center">${cat(t.promote ? 'cheer' : 'idle', 14, 'float')}<div class="bubble up big mt tc">${homeLine()}</div></div>
    <div class="grow"></div>
    ${cta}
    <div class="tc" style="margin-bottom:.4rem"><button class="link" data-act="changediff">${d.icon} Poziom: ${d.name} · zmień</button></div>
  </div>`, { nav: true, tab: 'home' });
}
