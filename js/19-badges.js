'use strict';
/* ===================== ODZNAKI ===================== */
function renderBadges() {
  stopGame(); cur = renderBadges;
  let total = 0;
  const cards = TIERS.flatMap(dk => MISSIONS.map(m => {
    const done = P.done[dk].includes(m.id); if (done) total++;
    return `<div class="card tc" style="padding:.8rem .5rem;${done ? 'background:var(--orange-soft)' : 'box-shadow:none;border-color:var(--muted)'}"><div style="width:4rem;height:4rem;margin:0 auto;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:2rem;background:${done ? 'var(--orange)' : 'var(--grey)'};border:.16rem solid ${done ? 'var(--ink)' : 'var(--muted)'}">${done ? m.icon : '🔒'}</div>
      <div style="font-weight:900;margin-top:.4rem;font-size:.88rem;line-height:1.1">${m.title.replace(/^MeowMission \d+: /, '')}</div>
      <div style="font-weight:800;font-size:.72rem;color:var(--muted)">${DIFFS[dk].icon} ${DIFFS[dk].name}</div></div>`;
  })).join('');
  const line = total === 0 ? 'Jeszcze pusto. Zalicz misję, a dostaniesz pierwszą odznakę!' : `Masz już <b>${total}</b> z ${MISSIONS.length * TIERS.length} odznak. Tak trzymaj!`;
  show(`<div class="scr">
    ${bar('<button class="x" data-act="profile">←</button>', '<h1 class="title">Odznaki</h1>', '')}
    <div class="mb">${catSay(total ? 'happy' : 'think', line, { size: 5.5 })}</div>
    <div class="grid2" style="margin-bottom:1.2rem">${cards}</div></div>`, { nav: false });
}
