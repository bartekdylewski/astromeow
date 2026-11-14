'use strict';
/* ===================== SKLEP: skiny i złote życie ===================== */
function renderShop() {
  stopGame(); cur = renderShop;
  const cards = SKINS.map(sk => {
    const own = P.skins.includes(sk.id), on = P.skin === sk.id;
    const btn = on ? '<span class="pill gr">✓ założony</span>' : own ? `<button class="btn sm b-mint" data-act="equip" data-arg="${sk.id}">ZAŁÓŻ</button>` : `<button class="btn sm b-peach" data-act="buyskin" data-arg="${sk.id}">⭐ ${sk.p}</button>`;
    return `<div class="card tc" style="padding:.9rem .5rem .7rem;${on ? 'border-color:var(--mintd)' : ''}"><div class="col center" style="min-height:5.4rem;justify-content:flex-end">${cat('idle', 5, '', sk.id)}</div>
      <b style="display:block;font-size:.95rem;margin:.4rem 0">${sk.n}</b>${btn}</div>`;
  }).join('');
  show(`<div class="scr">
    ${bar('<h1 style="font-size:1.8rem;font-weight:900">Sklep</h1>', '', `<span class="row gap-s">${starPill()}<button class="x" data-act="tut" data-arg="shop">?</button></span>`)}
    <div class="card tc mb" style="padding:1rem .5rem"><div class="col center" style="min-height:8.5rem;justify-content:flex-end">${cat('happy', 8)}</div><b style="display:block;font-size:1.1rem;margin-top:.5rem">${skinOf().n}</b></div>
    <div class="pcard hot mb"><span style="font-size:2.4rem">💛</span><span class="grow"><b>Złote życie · ${GOLD_PRICE} ⭐</b><small>4. serce na jedną misję. Masz: ${P.golden}. Włączysz je przed startem misji.</small></span>
      <button class="btn sm b-peach" style="width:auto;padding:.5rem 1rem" data-act="buygold">KUP</button></div>
    <div class="label mb-s">Skiny kota 🐱</div>
    <div class="grid2" style="margin-bottom:1.2rem">${cards}</div>
    <p class="muted tc" style="margin:0 0 1.2rem">⭐ zdobywasz za dobre odpowiedzi i gierki.</p>
  </div>`, { nav: true, tab: 'shop' });
  if (!P.tut.shop) openTut('shop');
}
