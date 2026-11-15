'use strict';
/* ===================== CIEKAWOSTKI: kosmos po polsku (dane: config/ciekawostki.json -> DATA.ciekawostki) ===================== */
let FACT = { cat: null, i: 0 };
const FACT_WAIT_MS = 3000;
const factEsc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const factCats = () => { const d = typeof DATA !== 'undefined' && DATA && DATA.ciekawostki; return d && Array.isArray(d.categories) && d.categories.length ? d.categories : null; };
const factRead = () => (P.facts = P.facts && typeof P.facts === 'object' ? P.facts : {});
const factFile = c => /\./.test(c.icon) ? c.icon : c.icon + '.svg'; // icon z rozszerzeniem = raster, bez = svg
const factIcon = c => `<img class="fimg" src="${assetSrc('assets/facts/' + factFile(c))}" alt="">`;
const factCount = c => c.facts.filter(f => factRead()[f.id]).length;

function factPhoto(image) {
  const src = assetSrc('assets/facts/photos/' + image.file);
  return `<figure class="fact-photo">
    <img src="${factEsc(src)}" alt="${factEsc(image.alt)}" decoding="async">
    <figcaption>
      ${image.caption ? `<span>${factEsc(image.caption)}</span>` : ''}
      <a href="${factEsc(image.source)}" target="_blank" rel="noopener">Ilustracja: ${factEsc(image.credit)} ↗</a>
    </figcaption>
  </figure>`;
}

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
    <div id="nasa-panel"></div>
    <div class="col gap" style="margin-bottom:1.2rem">${cats.map(card).join('')}</div></div>`, { nav: true, tab: 'facts' });
  loadNasa();
}

/* ---- panel „Najnowsze z NASA": dane z serwera (/api/nasa: DONKI + APOD, odświeżane w tle), przy braku sieci ostatnie zapamiętane ---- */
const NASA_KEY = 'astromeow-nasa', NASA_POLL_MS = 5 * 60 * 1000;   // panel odświeża się co 5 minut, gdy gracz zostaje na ekranie
let nasaTimer = null;
const nasaDate = iso => { const d = new Date(iso); return isNaN(d) ? '' : d.toLocaleString('pl-PL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }); };
const nasaFlare = c => ({ A: 'bardzo słaby', B: 'bardzo słaby', C: 'słaby', M: 'silny', X: 'bardzo silny' }[String(c)[0]] || '');
const nasaStorm = kp => kp >= 9 ? ['G5', 'ekstremalna'] : kp >= 8 ? ['G4', 'bardzo silna'] : kp >= 7 ? ['G3', 'silna'] : kp >= 6 ? ['G2', 'umiarkowana'] : kp >= 5 ? ['G1', 'mała'] : ['', 'spokojnie'];
function nasaPanel(d) {
  const row = (ic, title, text) => `<div class="nrow"><span class="nic">${ic}</span><span class="grow"><b>${title}</b><small>${text}</small></span></div>`;
  const rows = [];
  if (d.flare) rows.push(row('☀️', 'Rozbłysk słoneczny: klasa ' + factEsc(d.flare.class), `${nasaFlare(d.flare.class)}, ${nasaDate(d.flare.time)}`));
  if (d.storm) { const [g, name] = nasaStorm(d.storm.kp); rows.push(row('🌍', 'Burza geomagnetyczna: Kp ' + factEsc(d.storm.kp), `${g ? g + ', ' : ''}${name}, ${nasaDate(d.storm.time)}`)); }
  if (d.cme) rows.push(row('💥', 'Wyrzut plazmy ze Słońca (CME)', `${d.cme.speed ? 'prędkość ok. ' + factEsc(d.cme.speed) + ' km/s, ' : ''}${nasaDate(d.cme.time)}`));
  const hot = d.flare && /^[MX]/.test(d.flare.class), apod = d.apod;
  if (!rows.length && !apod) return '';
  return `<section class="card nasa"><div class="row between mb-s"><span class="label">Najnowsze z NASA</span><small class="muted">${d.updated ? 'dane z ' + nasaDate(d.updated * 1000) : ''}</small></div>
    ${rows.length ? `<p class="nsay">${hot ? 'Słońce jest dziś aktywne! Takie wydarzenia sprawdzają astronauci.' : 'Tak teraz wygląda pogoda w kosmosie.'}</p>${rows.join('')}` : ''}
    ${apod ? `<figure class="napod"><img src="${factEsc(apod.url)}" alt="${factEsc(apod.title)}" loading="lazy" decoding="async" onerror="this.closest('figure').remove()"><figcaption><span>Obraz dnia NASA: ${factEsc(apod.title)}</span>
      <a href="https://apod.nasa.gov/apod/astropix.html" target="_blank" rel="noopener">${factEsc(apod.credit)} ↗</a></figcaption></figure>` : ''}
    <small class="muted">Źródło: <a class="link" href="https://ccmc.gsfc.nasa.gov/tools/DONKI/" target="_blank" rel="noopener">NASA DONKI</a> i <a class="link" href="https://api.nasa.gov" target="_blank" rel="noopener">NASA Open APIs</a></small></section>`;
}
async function loadNasa() {
  clearTimeout(nasaTimer);
  nasaTimer = setTimeout(() => { if ($('#nasa-panel')) loadNasa(); }, NASA_POLL_MS);   // zatrzymuje się samo po wyjściu z ekranu
  let d = null;
  try {
    const r = await fetch('/api/nasa', { signal: AbortSignal.timeout(4000) });
    if (r.ok) d = await r.json();
    if (d && d.updated) localStorage.setItem(NASA_KEY, JSON.stringify(d));
  } catch (_) {}
  if (!d || !d.updated) try { d = JSON.parse(localStorage.getItem(NASA_KEY)); } catch (_) {}
  const box = $('#nasa-panel');   // gracz mógł już wyjść z ekranu
  if (!box || !d || !d.updated) return;
  box.innerHTML = nasaPanel(d);
  if (typeof replaceEmoji === 'function') replaceEmoji(box);
  box.classList.add('mb');
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
    <div class="card fcard">${first ? '<span class="pill soft fnew pop">+2 ⭐ nowa!</span>' : ''}<h2>${factEsc(f.title)}</h2>
      ${factPhoto(f.image)}
      <p>${factEsc(f.text)}</p></div>
    ${f.source ? `<div class="tc"><a class="link fsrc" href="${factEsc(f.source)}" target="_blank" rel="noopener">Źródło ↗</a></div>` : ''}
    <div class="grow"></div>
    <div class="foot col gap-s">
      <div class="meter fact-delay" aria-hidden="true" style="--fact-wait:${FACT_WAIT_MS}ms"><i></i></div>
      <div class="row gap">${i > 0 ? '<button class="btn b-white" style="width:5rem" data-act="fact-prev" aria-label="Poprzednia">←</button>' : ''}
        <button id="fact-continue" class="btn b-lav" data-act="${last ? 'fact-list' : 'fact-next'}" disabled>${last ? 'GOTOWE' : 'DALEJ ›'}</button></div>
    </div>
  </div>`, { nav: true, tab: 'facts' });
  const button = $('#fact-continue'), progress = $('.fact-delay');
  setTimeout(() => {
    if (!button.isConnected) return;
    progress.classList.add('ready');
    button.disabled = false;
  }, FACT_WAIT_MS);
}
