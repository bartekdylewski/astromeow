'use strict';
/* ===================== EKRAN STARTOWY: wybór poziomu ===================== */
function renderStart() {
  stopGame(); cur = renderStart;
  const rec = TIERS.find(t => P.done[t].length < MISSIONS.length) || 'hard';
  const btns = TIERS.map(t => {
    const d = DIFFS[t], n = P.done[t].length;
    return `<button class="btn ${d.btn} diffbtn" data-act="diff" data-arg="${t}">${t === rec ? '<span class="rec">POLECANY</span>' : ''}
      <span class="big">${d.icon}</span><span class="grow"><b>${d.name.toUpperCase()}</b><small>${d.desc}</small></span>
      <span class="pill" style="background:#ffffffaa">${n === MISSIONS.length ? '✅' : n + '/' + MISSIONS.length}</span></button>`;
  }).join('');
  show(`<div class="scr">
    <div class="grow"></div>
    <div class="tc"><h1 class="logo"><span>Astro</span>Meow</h1><p class="sub">Ucz się w kosmosie z kotem 🐾</p></div>
    <div class="col center mt">${cat('idle', 10, 'float')}<div class="bubble up mt-s tc">Miau! Wybierz poziom i lecimy! 🚀</div></div>
    <div class="grow"></div>
    <div class="label tc mb-s">Wybierz poziom · zaliczaj misje i awansuj wyżej</div>
    <div class="col gap" style="padding:.4rem 0 1.2rem">${btns}</div>
  </div>`);
}
