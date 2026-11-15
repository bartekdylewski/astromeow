'use strict';
/* ===================== EKRAN STARTOWY: wybór poziomu ===================== */
function renderStart() {
  stopGame(); cur = renderStart;
  const rec = TIERS.find(t => P.done[t].length < MISSIONS.length) || 'hard';
  const btns = TIERS.map(t => {
    const d = DIFFS[t], n = P.done[t].length;
    return `<button class="btn ${t === rec ? 'b-lav' : 'b-white'} diffbtn" data-act="diff" data-arg="${t}">
      <span class="big">${d.icon}</span><span class="grow"><b>${d.name.toUpperCase()}</b><small>${d.desc}</small></span>
      <span class="muted">${n === MISSIONS.length ? '✅' : n + '/' + MISSIONS.length}</span></button>`;
  }).join('');
  show(`<div class="scr">
    ${bar(`<button class="x" data-act="tab" data-arg="home">←</button>`, '', '<span style="width:2.8rem"></span>')}
    <div class="grow"></div>
    <div class="col center tc">${cat('think', 8, 'float')}<div class="bubble up big mt tc">Wybierz poziom, a ja będę z Tobą!</div></div>
    <div class="grow"></div>
    <div class="col gap" style="padding:.4rem 0 1.2rem">${btns}</div>
  </div>`);
}

/* ===================== POWITANIE: Astruś prowadzi za rączkę (3 kroki, potem prosto w pierwszą misję) ===================== */
const WELCOME = [
  { pose: 'happy', t: 'Miau! Jestem Astruś 🐾', d: 'Twój kosmiczny kot. Dziś polecimy razem w kosmos!', b: 'CZEŚĆ, ASTRUŚ!' },
  { pose: 'think', t: 'Zadam Ci 5 pytań', d: 'Ty wybierasz odpowiedź, a ja wszystko wytłumaczę. Nie musisz nic umieć!', b: 'DALEJ' },
  { pose: 'cheer', t: 'Gotowy na pierwszą misję?', d: 'Na końcu czeka krótka gierka. Lecimy!', b: 'START 🚀' },
];
function renderWelcome(i = 0) {
  stopGame(); cur = () => renderWelcome(i);
  const w = WELCOME[i];
  show(`<div class="scr scene-swipe">
    <div class="tc mt">${i === 0 ? '<h1 class="logo sm"><span>Astro</span>Meow</h1>' : ''}</div>
    <div class="grow"></div>
    <div class="col center tc">${cat(w.pose, 13, 'float')}<div class="bubble up big mt tc"><b>${w.t}</b><br>${w.d}</div></div>
    <div class="grow"></div>
    <div class="foot"><button class="btn b-lav nudge" data-act="welcome-next" data-arg="${i}">${w.b}</button>
      ${sceneDots(WELCOME.length, i)}</div>
  </div>`);
  bindSceneSwipe($('.scene-swipe'), i, WELCOME.length, renderWelcome);
}
