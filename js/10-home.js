'use strict';
/* ===================== MENU (home) ===================== */
let sunInfo = null, sunLoading = false;
function homeLine() {
  const t = nextTarget();
  if (boostOn()) return 'Słońce wystrzeliło rozbłysk! Baza ma boost ⚡';
  if (t.promote) return `Poziom zaliczony! Czas na ${DIFFS[t.tier].name} ${DIFFS[t.tier].icon}`;
  if (P.streak >= 3) return `Seria ${P.streak} dni! Aura +9999 🔥`;
  return pick(['Miau! Gotowy na misję, kadecie? 🚀', 'Sigma kot melduje gotowość 🗿', 'Dziś kosmos będzie nasz ✨']);
}
function planetStrip() {
  const open = PLANETS.filter((_, i) => pOpen(i)).length;
  if (open > P.seenPlanets) {
    const i = open - 1, pl = PLANETS[i];
    return `<button class="pcard hot pop" data-act="goplanet" data-arg="${i}"><span style="font-size:2.4rem">${pl.icon}</span><span class="grow"><b>🎉 Nowa planeta: ${pl.name}!</b><small>Siatka ${pl.n}×${pl.n}, droższe budynki, dużo lepsze zyski. Dotknij!</small></span><b style="font-size:1.5rem;color:var(--lavd)">›</b></button>`;
  }
  const pi = P.planet, pl = PLANETS[pi], g = Object.keys(pGrid(pi)).length, tot = pl.n * pl.n;
  const txt = g < tot ? `Zabudowane: ${g}/${tot}` : pi + 1 < PLANETS.length ? (pOpen(pi + 1) ? 'Zabudowana! Nowa planeta czeka' : 'Zabudowana! Dalej: ' + pReason(pi + 1)) : 'Wszystko zabudowane 🏆';
  return `<button class="pcard" data-act="tab" data-arg="base"><span style="font-size:2.2rem">${pl.icon}</span><span class="grow"><b>${pl.name}</b><small>${txt}</small></span><b style="font-size:1.5rem;color:var(--lavd)">›</b></button>`;
}
function ladder() {
  return `<div class="row gap-s" style="justify-content:center;flex-wrap:wrap">${TIERS.map((t, i) => {
    const d = DIFFS[t], n = P.done[t].length, on = t === P.diff;
    return `${i ? '<span class="muted">›</span>' : ''}<span class="pill ${on ? d.pill : ''}" style="${on ? '' : 'background:#fff;border:2px solid var(--line)'}">${d.icon} ${n}/${MISSIONS.length}${n === MISSIONS.length ? ' ✅' : ''}</span>`;
  }).join('')}</div>`;
}
function sunStatus() {
  if (sunLoading) return 'Łączę z NASA…';
  if (!sunInfo) return 'Sprawdź, czy Słońce wystrzeliło rozbłysk';
  if (sunInfo.demo) return '🎬 Tryb pokazowy: symulowany rozbłysk';
  if (!sunInfo.live) return 'Brak połączenia z NASA. Spróbuj trybu pokazowego';
  if (sunInfo.strong) return `Rozbłysk ${sunInfo.strong.classType}! Boost ×1.5`;
  if (sunInfo.latest) return `Ostatni rozbłysk: ${sunInfo.latest.classType}. Spokojnie`;
  return 'Spokojne Słońce';
}
function renderHome() {
  stopGame(); cur = renderHome;
  const d = DIFFS[P.diff], done = P.done[P.diff].length, t = nextTarget();
  const sun = sunInfo && (sunInfo.strong || sunInfo.demo) ? '🌞' : '☀️';
  let cta;
  if (t.promote) cta = `<button class="btn b-peach" data-act="start-next">🎉 AWANSUJ: POZIOM ${DIFFS[t.tier].name.toUpperCase()} ${DIFFS[t.tier].icon}<small>Nowe, trudniejsze pytania i lepsze nagrody</small></button>`;
  else if (t.replay) cta = `<button class="btn b-lav" data-act="start-next">POWTÓRKA · MISJA 1 🚀<small>Wszystko zaliczone! Powtórki dają połowę nagród</small></button>`;
  else cta = `<button class="btn b-lav" data-act="start-next">GRAJ · ${t.m.title.toUpperCase()} 🚀<small>${done === 0 ? 'Zacznij od pierwszej misji' : 'Następna misja na poziomie ' + d.name.toLowerCase()}</small></button>`;
  show(`<div class="scr">
    ${bar(streakPill(), `<button class="pill ${d.pill}" data-act="changediff">${d.icon} ${d.name} ▾</button>`, starPill())}
    <div class="tc mt-s"><h1 class="logo"><span>Astro</span>Meow</h1></div>
    <div class="col center mt-s">${cat(boostOn() || t.promote ? 'cheer' : 'idle', 9, 'float')}<div class="bubble up mt-s tc" style="max-width:20rem">${homeLine()}</div></div>
    <div class="mt tc">${boostChip()}</div>
    <div class="mt">${ladder()}</div>
    <div class="mt-s">${planetStrip()}</div>
    <div class="grid3 mt">${Object.keys(RES).map(k => `<div class="res"><div class="e">${RES[k].icon}</div><b id="rv-${k}">${fmt(P.res[k])}</b><small style="color:${RES[k].color}">${RES[k].name}</small></div>`).join('')}</div>
    <div class="grow"></div>
    <div class="col gap mt-l">${cta}
      <button class="btn b-white" data-act="tab" data-arg="map">SZLAK MISJI 🗺️</button></div>
    <div class="card mt tc" style="margin-bottom:1rem">
      <div class="label">Pogoda kosmiczna · NASA DONKI</div>
      <div class="idle" style="font-size:3rem;margin:.2rem 0">${sun}</div>
      <div class="muted mb-s" id="sunstatus">${sunStatus()}</div>
      <button class="btn sm b-peach" data-act="sun" ${sunLoading ? 'disabled' : ''}>📡 SPRAWDŹ SŁOŃCE</button>
      <button class="link" data-act="sun-demo">tryb pokazowy: zasymuluj rozbłysk</button>
    </div>
  </div>`, { nav: true, tab: 'home' });
}
async function fetchFlare() {
  const ctl = new AbortController(), to = setTimeout(() => ctl.abort(), 7000);
  try {
    const f = d => d.toISOString().slice(0, 10);
    const r = await fetch(`https://api.nasa.gov/DONKI/FLR?startDate=${f(new Date(Date.now() - 30 * 864e5))}&endDate=${f(new Date())}&api_key=${NASA_KEY}`, { signal: ctl.signal });
    clearTimeout(to); if (!r.ok) throw new Error(r.status);
    const d = await r.json();
    const list = (Array.isArray(d) ? d : []).filter(e => e.classType).sort((a, b) => (b.beginTime || '').localeCompare(a.beginTime || ''));
    const strong = list.find(e => /^[MX]/.test(e.classType) && Date.parse(e.beginTime) > Date.now() - 3 * 864e5) || null;
    return { live: true, latest: list[0] || null, strong };
  } catch (_) { clearTimeout(to); return { live: false }; }
}
async function checkSun() {
  sunLoading = true; renderHome();
  sunInfo = await fetchFlare(); sunLoading = false;
  if (sunInfo.strong) flareBoost();
  if (cur === renderHome) renderHome();
}
function flareBoost() { P.boostUntil = Date.now() + 60000; save(); confetti(30, ['☀️', '⚡', '🔥', '✨']); }
