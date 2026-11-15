'use strict';
/* ===================== CIEKAWOSTKI: kosmos po polsku (dane: config/ciekawostki.json -> DATA.ciekawostki) ===================== */
let FACT = { cat: null, i: 0 };
const factEsc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const factCats = () => { const d = typeof DATA !== 'undefined' && DATA && DATA.ciekawostki; return d && Array.isArray(d.categories) && d.categories.length ? d.categories : null; };
const factRead = () => (P.facts = P.facts && typeof P.facts === 'object' ? P.facts : {});
const factFile = c => /\./.test(c.icon) ? c.icon : c.icon + '.svg'; // icon z rozszerzeniem = raster, bez = svg
const factIcon = c => `<img class="fimg" src="${assetSrc('assets/facts/' + factFile(c))}" alt="">`;
const factCount = c => c.facts.filter(f => factRead()[f.id]).length;

function renderFacts() {
  stopGame(); cur = renderFacts; FACT = { cat: null, i: 0 };
  const cats = factCats();
  if (!cats) {
    return show(`<div class="scr">${bar('<h1 class="title">Ciekawostki</h1>', '', '')}
      <div class="mb">${catSay('think', 'Ciekawostki jeszcze się ładują. Zajrzyj tu za chwilę!', { size: 5.5 })}</div>
      <button class="btn b-white" data-act="tab" data-arg="facts">SPRÓBUJ JESZCZE RAZ</button></div>`, { nav: true, tab: 'facts' });
  }
  const all = cats.reduce((a, c) => a + c.facts.length, 0), got = cats.reduce((a, c) => a + factCount(c), 0);
  const card = (c, i) => {
    const n = factCount(c), full = n === c.facts.length, feat = i === 0;
    return `<button class="pcard fcat${feat ? ' feat' : ''}" data-act="fact-cat" data-arg="${factEsc(c.id)}">
      <span class="fico">${factIcon(c)}</span>
      <span class="grow">${feat ? '<span class="label">Polska misja</span>' : ''}<b>${factEsc(c.title)}</b><small>${full ? '✓ ' : ''}${n}/${c.facts.length} przeczytane</small></span>
      <span class="fgo">›</span></button>`;
  };
  show(`<div class="scr">
    ${bar('<h1 class="title">Ciekawostki</h1>', '', starPill())}
    <div class="mb">${catSay(got ? 'happy' : 'idle', got >= all ? 'Przeczytane wszystko! Jesteś ekspertem od kosmosu.' : 'Wybierz temat, a opowiem Ci coś ciekawego o kosmosie!', { size: 5.5 })}</div>
    <div class="col gap" style="margin-bottom:1.2rem">${cats.map(card).join('')}</div></div>`, { nav: true, tab: 'facts' });
}

function renderFact() {
  const cats = factCats(), c = cats && cats.find(x => x.id === FACT.cat); if (!c) return renderFacts();
  const n = c.facts.length, i = Math.max(0, Math.min(n - 1, FACT.i)), f = c.facts[i]; FACT.i = i; cur = renderFact;
  const first = !factRead()[f.id];
  if (first) { P.facts[f.id] = true; P.pts += 2; save(); }
  const say = i === 0 ? c.intro : (f.astrus || c.intro), last = i === n - 1;
  show(`<div class="scr fact">
    ${bar('<button class="x" data-act="fact-list">←</button>', `<span class="label">${factIcon(c)} ${factEsc(c.title)}</span>`, `<span class="pill soft">${i + 1}/${n}</span>`)}
    <div class="meter mb"><i style="width:${Math.round((i + 1) / n * 100)}%"></i></div>
    <div class="mb">${catSay(first ? 'happy' : 'idle', factEsc(say), { size: 4.4 })}</div>
    <div class="card fcard">${first ? '<span class="pill soft fnew pop">+2 ⭐ nowa!</span>' : ''}<h2>${factEsc(f.title)}</h2><p>${factEsc(f.text)}</p></div>
    ${f.source ? `<div class="tc"><a class="link fsrc" href="${factEsc(f.source)}" target="_blank" rel="noopener">Źródło ↗</a></div>` : ''}
    <div class="grow"></div>
    <div class="foot row gap">${i > 0 ? '<button class="btn b-white" style="width:5rem" data-act="fact-prev" aria-label="Poprzednia">←</button>' : ''}
      <button class="btn b-lav" data-act="${last ? 'fact-list' : 'fact-next'}">${last ? 'GOTOWE' : 'DALEJ ›'}</button></div>
  </div>`, { nav: true, tab: 'facts' });
}
