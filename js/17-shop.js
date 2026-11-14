'use strict';
/* ===================== SKLEP: skiny Astrusia i złote życie ===================== */
function renderShop() {
  stopGame(); cur = renderShop;
  const cards = SKINS.map(sk => {
    const own = P.skins.includes(sk.id), on = P.skin === sk.id;
    const btn = on ? '<span class="pill soft">✓ założony</span>' : own ? `<button class="btn sm b-white" data-act="equip" data-arg="${sk.id}">ZAŁÓŻ</button>` : `<button class="btn sm b-white" data-act="buyskin" data-arg="${sk.id}">⭐ ${sk.p}</button>`;
    return `<div class="card tc" style="padding:.9rem .5rem .7rem;${on ? 'background:var(--orange-soft)' : ''}"><div class="col center" style="min-height:5.4rem;justify-content:flex-end">${cat('idle', 5, '', sk.id)}</div>
      <b style="display:block;font-size:.95rem;margin:.4rem 0">${sk.n}</b>${btn}</div>`;
  }).join('');
  show(`<div class="scr">
    ${bar('<h1 class="title">Sklep</h1>', '', `<span class="row gap-s">${starPill()}<button class="x" data-act="tut" data-arg="shop">?</button></span>`)}
    <div class="mb">${catSay('happy', `Wybierz mi nowy strój! Teraz noszę: <b>${skinOf().n}</b>`, { size: 7 })}</div>
    <div class="pcard mb"><span style="font-size:2rem">💛</span><span class="grow"><b>Złote życie · ${GOLD_PRICE} ⭐</b><small>4. serce na jedną misję. Masz: ${P.golden}.</small></span>
      <button class="btn sm b-white" style="width:auto;padding:.5rem 1.2rem" data-act="buygold">KUP</button></div>
    <div class="label mb-s">Stroje Astrusia</div>
    <div class="grid2" style="margin-bottom:1.2rem">${cards}</div>
  </div>`, { nav: true, tab: 'shop' });
  if (!P.tut.shop) openTut('shop');
}
