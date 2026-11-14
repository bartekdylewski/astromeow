'use strict';
/* ===================== GIERKI: opisy i parametry ===================== */
const GAMES = {
  shooter: { name: 'Obrona bazy', icon: '🚀', res: 'meteo', desc: 'Przesuwaj statek palcem. Strzelanie jest automatyczne. Zbij meteory, zanim spadną na bazę!', hint: 'Przeciągnij palcem, żeby sterować' },
  flappy:  { name: 'Przelot przez asteroidy', icon: '🐱', res: 'meteo', desc: 'Dotknij ekranu, żeby kotek uniósł się w górę. Przeleć przez szczeliny między meteorytami.', hint: 'Gra zaczyna się po pierwszym dotknięciu · dotknij, żeby lecieć' },
  catch:   { name: 'Łapanie próbek', icon: '🧪', res: 'wiedza', desc: 'Przesuwaj koszyk i łap probówki. Omijaj skały i meteory!', hint: 'Przeciągnij palcem, żeby sterować koszykiem' },
  lander:  { name: 'Lądowanie na Księżycu', icon: '🛸', res: 'czesci', desc: 'Przytrzymaj ekran, żeby włączyć silnik, i przesuń palec, żeby sterować. Wyląduj łagodnie na zielonym pasie!', hint: 'Gra zaczyna się po pierwszym dotknięciu · przytrzymaj = silnik · przesuń = kierunek' },
  pack:    { name: 'Pakowanie rakiety', icon: '📦', res: 'czesci', desc: 'Przeciągnij klocki do ładowni rakiety. Dotknij klocka na tacy, żeby go obrócić!', hint: 'Dotknij klocka, by go obrócić lub zdjąć z planszy · odliczanie przyspiesza' },
};
const GP = {
  easy: { shooter: { gap: 1000, v: 80, lives: 4, limit: 30 }, flappy: { gap: 235, sp: 2.2, spawn: 1800, limit: 35 }, catch: { spawn: 800, rock: .2, v: 140, lives: 3, limit: 30 }, lander: { g: 95, th: 250, safe: 95, pad: 150, limit: 40 }, pack: { w: 3, h: 4, n: 4, slack: 2, limit: 70 } },
  mid:  { shooter: { gap: 700, v: 115, lives: 3, limit: 30 }, flappy: { gap: 190, sp: 2.9, spawn: 1400, limit: 35 }, catch: { spawn: 560, rock: .3, v: 185, lives: 3, limit: 30 }, lander: { g: 125, th: 270, safe: 68, pad: 100, limit: 40 }, pack: { w: 4, h: 4, n: 5, slack: 0, limit: 70 } },
  hard: { shooter: { gap: 550, v: 140, lives: 3, limit: 30 }, flappy: { gap: 170, sp: 3.3, spawn: 1250, limit: 35 }, catch: { spawn: 430, rock: .36, v: 225, lives: 3, limit: 30 }, lander: { g: 150, th: 290, safe: 55, pad: 80, limit: 40 }, pack: { w: 5, h: 4, n: 6, slack: 0, limit: 80 } },
};
/* cele do zaliczenia gierki (3 próby na podejście) */
const GOAL = { easy: { shooter: 8, flappy: 4, catch: 8, lander: 8 }, mid: { shooter: 12, flappy: 6, catch: 12, lander: 8 }, hard: { shooter: 16, flappy: 7, catch: 16, lander: 12 } };
const MAXTRY = 3;
const PLU = { shooter: ['meteor', 'meteory', 'meteorów'], flappy: ['przelot', 'przeloty', 'przelotów'], catch: ['próbkę', 'próbki', 'próbek'], lander: ['lądowanie', 'lądowania', 'lądowań'] };
const plural = (n, f) => n === 1 ? f[0] : (n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 12 || n % 100 > 14)) ? f[1] : f[2];
function goalText(key) {
  if (key === 'pack') return 'ułóż wszystkie klocki w rakiecie';
  const g = GOAL[P.diff][key], n = key === 'lander' ? g / 4 : g;
  return `${n} ${plural(n, PLU[key])}`;
}
let GSET = null;
function newSet(key, mission) { GSET = { key, mission, attempts: 0, best: 0, passed: false, totGain: 0, totPts: 0 }; }
let lastGame = '';

function renderGameIntro(key) {
  if (!GSET || !GSET.mission) return renderMap();
  stopGame(); const g = GAMES[key], set = GSET, d = DIFFS[P.diff];
  cur = () => renderGameIntro(key);
  const topL = set.mission ? '<span style="width:2.6rem"></span>' : '<button class="x" data-act="tab" data-arg="map">←</button>';
  show(`<div class="scr">
    ${bar(topL, `<span class="label">${set.mission ? 'Nagroda · ' + S.correct + ' poprawnych' : 'Salon gier'}</span>`, '<span style="width:2.6rem"></span>')}
    <div class="card tc pop mt-s" style="padding:1.3rem"><div class="bounce" style="font-size:3.8rem">${g.icon}</div>
      <h2 style="font-size:1.6rem;font-weight:900;margin-top:.3rem">${g.name}</h2>
      <p class="muted" style="font-size:1rem;margin:.5rem 0 0">${g.desc}</p>
      <p style="margin:.8rem 0 .2rem"><span class="pill bt">🎯 Cel: ${goalText(key)}</span></p>
      <p style="margin:.4rem 0 0"><span class="pill ${d.pill}">${d.icon} ${d.name}</span> <span class="pill lv">nagroda: ${RES[g.res].icon} ${RES[g.res].name}</span></p>
      <div class="dots mt">${Array.from({ length: MAXTRY }, (_, i) => `<i class="${i < set.attempts ? 'on' : ''}"></i>`).join('')}</div>
      <p class="muted" style="margin:.3rem 0 0;font-size:.85rem">Próba ${set.attempts + 1} z ${MAXTRY}</p></div>
    <div class="row gap mt">${cat('cheer', 5.5)}<div class="bubble" style="flex:1">Masz ${MAXTRY} próby. Im dłużej grasz, tym trudniej! 🎮</div></div>
    <div class="grow"></div>
    <div class="foot"><button class="btn b-peach" data-act="play" data-arg="${key}">GRAJ 🎮</button>
      ${set.mission ? '<button class="link w100" data-act="skipgame">pomiń gierkę i wróć na szlak</button>' : ''}</div>
  </div>`);
}
function gameShell(key, inner) {
  return `<div class="scr fixed">
    ${bar('<button class="x" data-act="quitgame">✕</button>', `<span class="label">${GAMES[key].name}</span>`, '<span class="pill" style="background:#fff" id="hud">⏱️</span>')}
    ${inner}<p class="hint">${GAMES[key].hint}</p></div>`;
}
function playGame(key) {
  if (!GSET || !GSET.mission) return renderMap();
  stopGame(); lastGame = key; cur = null;
  if (key === 'pack') return startPack();
  const p = GP[P.diff][key];
  show(gameShell(key, '<div class="cvbox" id="cvbox"><canvas id="cv"></canvas></div>'));
  const cv = $('#cv');
  G = { key, cv, ctx: cv.getContext('2d'), W: 430, H: 600, k: 1, score: 0, t: 0, limit: p.limit, last: 0, over: false, p,
        started: !(key === 'flappy' || key === 'lander'),
        lastFire: 0, lastSpawn: 0, ship: 215, bullets: [], enemies: [], lives: p.lives || 3, y: 300, vy: 0, pipes: [], items: [], x: 215,
        hold: false, tx: 215, landings: 0, msg: '', msgT: 0, pad: 215, shakeT: 0 };
  if (key === 'lander') { G.sx = 215; G.sy = 50; G.svy = 0; resetLandingPad(); }
  const box0 = $('#cvbox'); G.H = Math.max(480, Math.min(760, Math.round(G.W * box0.clientHeight / Math.max(1, box0.clientWidth)))); G.y = G.H / 2;
  fitCanvas();
  const rect = e => { const r = cv.getBoundingClientRect(); return Math.max(24, Math.min(G.W - 24, (e.clientX - r.left) * (G.W / r.width))); };
  if (key === 'shooter') { cv.onpointermove = cv.onpointerdown = e => { G.ship = rect(e); }; }
  else if (key === 'catch') { cv.onpointermove = cv.onpointerdown = e => { G.x = rect(e); }; }
  else if (key === 'flappy') { cv.onpointerdown = () => flap(); }
  else if (key === 'lander') {
    cv.onpointerdown = e => { G.started = true; G.hold = true; G.tx = rect(e); cv.setPointerCapture && cv.setPointerCapture(e.pointerId); };
    cv.onpointermove = e => { G.tx = rect(e); };
    cv.onpointerup = cv.onpointercancel = () => { G.hold = false; };
  }
  const hud = $('#hud'); if (hud) hud.textContent = `⏱️ ${G.limit} · 🎯 ${goalText(key)}`;
  rafId = requestAnimationFrame(loop);
}
function fitCanvas() {
  if (!G || !G.cv) return; const box = $('#cvbox'); if (!box) return;
  const k = Math.max(.3, Math.min(box.clientWidth / G.W, box.clientHeight / G.H)), dpr = Math.min(2, devicePixelRatio || 1);
  G.k = k; G.cv.style.width = G.W * k + 'px'; G.cv.style.height = G.H * k + 'px';
  G.cv.width = Math.round(G.W * k * dpr); G.cv.height = Math.round(G.H * k * dpr);
  G.ctx.setTransform(k * dpr, 0, 0, k * dpr, 0, 0);
}
let rafId = 0;
function flap() { if (G && G.key === 'flappy' && !G.over) { if (!G.started) G.started = true; G.vy = -7.4; } }
addEventListener('keydown', e => { if (e.code === 'Space' && (G || PK)) { e.preventDefault(); if (G) { flap(); if (G.key === 'lander') { G.started = true; G.hold = true; } } } });
addEventListener('keyup', e => { if (e.code === 'Space' && G && G.key === 'lander') G.hold = false; });
function stopGame() {
  cancelAnimationFrame(rafId); rafId = 0; G = null;
  if (PK) { clearInterval(PK.timer); removeEventListener('pointermove', pkMove); removeEventListener('pointerup', pkUp); removeEventListener('pointercancel', pkUp); PK = null; }
}
function loop(ts) {
  if (!G) return;
  if (!G.started) { G.last = 0; draw(); rafId = requestAnimationFrame(loop); return; }   // czekamy na pierwsze dotknięcie
  if (!G.last) { G.last = ts; if (G.key === 'flappy') G.lastSpawn = ts - G.p.spawn * .6; }
  const dt = Math.min(.05, (ts - G.last) / 1000); G.last = ts; G.t += dt;
  ({ shooter: updShooter, flappy: updFlappy, catch: updCatch, lander: updLander })[G.key](ts, dt);
  draw();
  const hud = $('#hud'); if (hud) hud.textContent = `⏱️ ${Math.max(0, Math.ceil(G.limit - G.t))} · 🎯 ${goalText(G.key)}`;
  if (G.t >= G.limit) G.over = true;
  if (G.over) { const s = G.score; return finishGame(G.key, G.key === 'lander' ? G.landings * 4 : s); }
  rafId = requestAnimationFrame(loop);
}

function roundPressure(elapsed, limit) {
  return Math.max(0, Math.min(1, (elapsed - 5) / (limit - 5)));
}

/* --- Obrona bazy --- */
function updShooter(ts, dt) {
  const { W, H, p } = G;
  if (ts - G.lastFire > 260) { G.bullets.push({ x: G.ship, y: H - 70 }); G.lastFire = ts; }
  G.bullets.forEach(b => b.y -= 560 * dt); G.bullets = G.bullets.filter(b => b.y > -20);
  const pressure = roundPressure(G.t, G.limit);
  const gap = p.gap * (1 - .28 * pressure);
  if (ts - G.lastSpawn > gap) { G.enemies.push({ x: rnd(30, W - 30), y: -30, v: p.v * (1 + .4 * pressure) + rnd(0, 60), e: Math.random() < .7 ? '☄️' : '🪨' }); G.lastSpawn = ts; }
  G.enemies.forEach(e => e.y += e.v * dt);
  for (const b of G.bullets) for (const e of G.enemies) if (!e.dead && Math.abs(b.x - e.x) < 26 && Math.abs(b.y - e.y) < 26) { e.dead = b.dead = true; G.score++; }
  G.bullets = G.bullets.filter(b => !b.dead);
  for (const e of G.enemies) { if (e.dead) continue; if (e.y > H) { e.dead = true; G.lives--; } else if (Math.abs(e.x - G.ship) < 34 && Math.abs(e.y - (H - 50)) < 34) { e.dead = true; G.lives--; } }
  G.enemies = G.enemies.filter(e => !e.dead && e.y < H + 40);
  if (G.lives <= 0) G.over = true;
}
/* --- Przelot z kotem --- */
function updFlappy(ts, dt) {
  const { W, H, p } = G, k = dt * 60;
  G.vy += .42 * k; G.y += G.vy * k;
  if (G.y < 10 || G.y > H - 10) { G.over = true; return; }
  const catX = 110, collisionRange = 42;
  const pressure = roundPressure(G.t, G.limit);
  if (ts - G.lastSpawn > p.spawn * (1 - .18 * pressure)) {
    G.pipes.push({ x: W + 40, gapY: rnd(170, H - 170), gap: p.gap * (1 - .22 * pressure), passed: false });
    G.lastSpawn = ts;
  }
  const sp = p.sp * (1 + .45 * pressure) * k;
  for (const pp of G.pipes) {
    pp.x -= sp;
    if (Math.abs(pp.x - catX) < collisionRange) {
      const top = pp.gapY - pp.gap / 2, bot = pp.gapY + pp.gap / 2;
      if (G.y - 22 < top || G.y + 22 > bot) { G.over = true; return; }
    }
    if (!pp.passed && pp.x <= catX - collisionRange) { pp.passed = true; G.score++; }
  }
  G.pipes = G.pipes.filter(pp => pp.x > -60);
}
/* --- Łapanie próbek --- */
function updCatch(ts, dt) {
  const { W, H, p } = G;
  const pressure = roundPressure(G.t, G.limit), rockChance = p.rock + .16 * pressure;
  if (ts - G.lastSpawn > p.spawn * (1 - .22 * pressure)) {
    const r = Math.random(), bad = r < rockChance, star = !bad && r < rockChance + .08;
    G.items.push({ x: rnd(30, W - 30), y: -30, v: p.v * (1 + .35 * pressure) + rnd(0, 50), e: bad ? pick(['🪨', '☄️']) : star ? '⭐' : '🧪', bad, val: star ? 3 : 1 }); G.lastSpawn = ts;
  }
  G.items.forEach(i => i.y += i.v * dt);
  for (const i of G.items) {
    if (i.dead) continue;
    if (i.y > H - 95 && i.y < H - 30 && Math.abs(i.x - G.x) < 46) { i.dead = true; if (i.bad) { G.lives--; G.shakeT = .3; } else G.score += i.val; }
    else if (i.y > H + 20) i.dead = true;
  }
  G.items = G.items.filter(i => !i.dead);
  if (G.shakeT > 0) G.shakeT -= dt;
  if (G.lives <= 0) G.over = true;
}
/* --- Lądowanie --- */
function resetLandingPad() {
  const pressure = roundPressure(G.t, G.limit);
  G.pad = rnd(110, 320);
  G.padWidth = G.p.pad * (1 - .3 * pressure);
  G.safeSpeed = G.p.safe * (1 - .2 * pressure);
}
function updLander(ts, dt) {
  const { W, H, p } = G, ground = H - 70;
  if (G.msgT > 0) { G.msgT -= dt; if (G.msgT <= 0) { G.sy = 50; G.svy = 0; resetLandingPad(); G.msg = ''; } return; }
  G.sx += (G.tx - G.sx) * Math.min(1, dt * 5);
  G.svy += (p.g - (G.hold ? p.th : 0)) * dt; G.sy += G.svy * dt;
  if (G.sy < 30) { G.sy = 30; G.svy = Math.max(0, G.svy); }
  if (G.sy >= ground) {
    G.sy = ground;
    const onPad = Math.abs(G.sx - G.pad) < G.padWidth / 2;
    if (onPad && G.svy < G.safeSpeed) { G.landings++; G.msg = G.svy < G.safeSpeed / 2 ? 'Mięciutko! 🌟' : 'Lądowanie! ✅'; }
    else G.msg = onPad ? 'Za szybko! 💥' : 'Obok pasa! 😅';
    G.msgT = 1.2; G.svy = 0;
  }
}
/* --- Rysowanie --- */
function bg() {
  const { ctx, W, H } = G;
  const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#7C6BD6'); g.addColorStop(1, '#C9B9FF');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#ffffffcc'; for (let i = 0; i < 40; i++) ctx.fillRect((i * 97) % W, (i * 53 + 17) % H, i % 5 ? 2 : 3, i % 5 ? 2 : 3);
}
function hudText(l, r) {
  const { ctx, W } = G; ctx.font = '900 22px Nunito, system-ui, sans-serif'; ctx.fillStyle = '#fff'; ctx.textBaseline = 'middle';
  ctx.textAlign = 'left'; ctx.fillText(l, 14, 26); ctx.textAlign = 'right'; ctx.fillText(r, W - 14, 26);
}
function draw() {
  const { ctx, W, H } = G; bg(); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  if (G.key === 'shooter') {
    ctx.font = '40px serif'; ctx.fillText('🏠', W / 2, H - 8); ctx.fillText('🚀', G.ship, H - 50);
    ctx.fillStyle = '#FFE48A'; G.bullets.forEach(b => { ctx.beginPath(); ctx.arc(b.x, b.y, 4.5, 0, 7); ctx.fill(); });
    ctx.font = '34px serif'; G.enemies.forEach(e => ctx.fillText(e.e, e.x, e.y));
    hudText('💗 ' + G.lives, '⭐ ' + G.score);
  } else if (G.key === 'flappy') {
    const bob = G.started ? 0 : Math.sin(performance.now() / 280) * 9;
    const im = catCanvasImg(G.vy < 0 ? 'cheer' : 'idle'), sk = skinOf();
    ctx.save(); if (sk.fx) ctx.filter = sk.fx;
    if (im && im.complete && im.naturalWidth) ctx.drawImage(im, 110 - 40, G.y + bob - 40, 80, 80);
    ctx.restore();
    if (sk.acc) { ctx.save(); ctx.font = '36px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.translate(110, G.y + bob - 40); ctx.rotate(-.14); ctx.fillText(sk.acc, 0, 0); ctx.restore(); }
    G.pipes.forEach(pp => {
      ctx.fillStyle = '#FFC8D7';
      ctx.beginPath(); ctx.roundRect(pp.x - 34, -20, 68, pp.gapY - pp.gap / 2 + 20, 16); ctx.fill();
      ctx.beginPath(); ctx.roundRect(pp.x - 34, pp.gapY + pp.gap / 2, 68, H, 16); ctx.fill();
      ctx.font = '34px serif'; ctx.fillText('☄️', pp.x, pp.gapY - pp.gap / 2 - 20); ctx.fillText('🪨', pp.x, pp.gapY + pp.gap / 2 + 20);
    });
    hudText('', '⭐ ' + G.score);
    if (!G.started) { ctx.font = '900 28px Nunito, system-ui, sans-serif'; ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.fillText('👆 Dotknij, żeby zacząć!', W / 2, H / 2 + 90); }
  } else if (G.key === 'catch') {
    ctx.font = '34px serif'; G.items.forEach(i => ctx.fillText(i.e, i.x, i.y));
    ctx.font = '54px serif'; ctx.fillText('🧺', G.x + (G.shakeT > 0 ? rnd(-5, 5) : 0), H - 52);
    hudText('💗 ' + G.lives, '🧪 ' + G.score);
  } else if (G.key === 'lander') {
    const gy = H - 70;
    ctx.fillStyle = '#EDE6FF'; ctx.beginPath(); ctx.roundRect(-10, gy + 22, W + 20, H, 20); ctx.fill();
    ctx.fillStyle = '#B4EBD0'; ctx.beginPath(); ctx.roundRect(G.pad - G.padWidth / 2, gy + 22, G.padWidth, 10, 5); ctx.fill();
    ctx.font = '26px serif'; ctx.fillText('🪨', 60, gy + 52); ctx.fillText('🪨', 360, gy + 58);
    ctx.font = '44px serif'; ctx.fillText('🛸', G.sx, G.sy);
    if (G.hold && G.msgT <= 0) { ctx.font = '30px serif'; ctx.fillText('🔥', G.sx, G.sy + 38); }
    const v = Math.max(0, G.svy), ok = v < G.safeSpeed;
    ctx.fillStyle = '#ffffff55'; ctx.beginPath(); ctx.roundRect(W / 2 - 70, 14, 140, 12, 6); ctx.fill();
    ctx.fillStyle = ok ? '#B4EBD0' : '#FFC8D7'; ctx.beginPath(); ctx.roundRect(W / 2 - 70, 14, Math.min(140, v / (G.safeSpeed * 2) * 140), 12, 6); ctx.fill();
    hudText('🛬 ' + G.landings, '');
    if (!G.started) { ctx.font = '900 26px Nunito, system-ui, sans-serif'; ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.fillText('👆 Przytrzymaj, żeby zacząć!', W / 2, H / 2); }
    if (G.msgT > 0) { ctx.font = '900 30px Nunito, system-ui, sans-serif'; ctx.fillStyle = '#fff'; ctx.fillText(G.msg, W / 2, H / 2 - 60); }
  }
}
