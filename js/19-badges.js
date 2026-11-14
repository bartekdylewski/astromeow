'use strict';
/* ===================== ODZNAKI ===================== */
function renderBadges() {
  stopGame(); cur = renderBadges;
  let total = 0;
  const cards = TIERS.flatMap(dk => MISSIONS.map(m => {
    const done = P.done[dk].includes(m.id); if (done) total++;
    return `<div class="card tc" style="${done ? '' : 'opacity:.6'}"><div style="width:4.6rem;height:4.6rem;margin:0 auto;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:2.2rem;background:${done ? m.color : '#EFEAFB'};border:.25rem solid ${done ? (dk === 'easy' ? 'var(--mintd)' : dk === 'mid' ? 'var(--peachd)' : 'var(--pinkd)') : 'transparent'}">${done ? m.icon : '🔒'}</div>
      <div style="font-weight:900;margin-top:.4rem;font-size:.9rem;line-height:1.1">${m.title.replace(/^MeowMission \d: /, '')}</div>
      <div style="font-weight:900;font-size:.72rem;color:${done ? '#2D8F66' : 'var(--muted)'}">${DIFFS[dk].icon} ${DIFFS[dk].name} · ${done ? 'zdobyta!' : 'zablokowana'}</div></div>`;
  })).join('');
  show(`<div class="scr">
    ${bar('<h1 style="font-size:1.8rem;font-weight:900">Odznaki</h1>', '', streakPill())}
    <p class="muted" style="margin:0 0 1rem">Zdobyte: ${total} / ${MISSIONS.length * 3}</p>
    <div class="grid2" style="margin-bottom:1.2rem">${cards}</div></div>`, { nav: true, tab: 'badges' });
}
