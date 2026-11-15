'use strict';
/* ===================== GIERKI: opisy i parametry ===================== */
const GAMES = {
  shooter: { name: 'Obrona bazy', icon: '🚀', res: 'meteo', desc: 'Przesuwaj statek palcem. Strzelanie jest automatyczne. Zbij meteory, zanim spadną na bazę!', hint: 'Przeciągnij palcem, żeby sterować' },
  flappy:  { name: 'Przelot przez asteroidy', icon: '🐱', res: 'meteo', desc: 'Dotknij ekranu, żeby Astruś uniósł się w górę. Przeleć przez szczeliny między meteorytami.', hint: 'Gra zaczyna się po pierwszym dotknięciu · dotknij, żeby lecieć' },
  catch:   { name: 'Łapanie próbek', icon: '🧪', res: 'wiedza', desc: 'Przesuwaj koszyk i łap probówki. Omijaj skały i meteory!', hint: 'Przeciągnij palcem, żeby sterować koszykiem' },
  lander:  { name: 'Lądowanie na Księżycu', icon: '🛸', res: 'czesci', desc: 'Przytrzymaj ekran, żeby włączyć silnik, i przesuń palec, żeby sterować. Wyląduj łagodnie na pomarańczowym pasie!', hint: 'Gra zaczyna się po pierwszym dotknięciu · przytrzymaj = silnik · przesuń = kierunek' },
  pack:    { name: 'Pakowanie rakiety', icon: '📦', res: 'czesci', desc: 'Przeciągnij klocki do ładowni rakiety. Dotknij klocka na tacy, żeby go obrócić!', hint: 'Przeciągnij klocek · dotknij na tacy = obróć · dotknij w rakiecie = zdejmij' },
};
const GP = {
  easy: { shooter: { gap: 1000, v: 80, lives: 4, limit: 30 }, flappy: { gap: 245, sp: 2.2, spawn: 1800, limit: 35 }, catch: { spawn: 800, rock: .2, v: 140, lives: 3, limit: 30 }, lander: { g: 95, th: 250, safe: 95, pad: 150, limit: 40 }, pack: { w: 3, h: 4, n: 4, slack: 2, limit: 70 } },
  mid:  { shooter: { gap: 700, v: 115, lives: 3, limit: 30 }, flappy: { gap: 205, sp: 2.9, spawn: 1400, limit: 35 }, catch: { spawn: 560, rock: .3, v: 185, lives: 3, limit: 30 }, lander: { g: 125, th: 270, safe: 68, pad: 100, limit: 40 }, pack: { w: 4, h: 4, n: 5, slack: 0, limit: 70 } },
  hard: { shooter: { gap: 550, v: 140, lives: 3, limit: 30 }, flappy: { gap: 185, sp: 3.3, spawn: 1250, limit: 35 }, catch: { spawn: 430, rock: .36, v: 225, lives: 3, limit: 30 }, lander: { g: 150, th: 290, safe: 55, pad: 80, limit: 40 }, pack: { w: 5, h: 4, n: 6, slack: 0, limit: 80 } },
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
  stopGame(); const g = GAMES[key], set = GSET;
  cur = () => renderGameIntro(key);
  show(`<div class="scr">
    <section class="card mt" aria-label="Ranking minigry"><h3>Ranking</h3><div id="leaderboard">Ładowanie…</div></section>
    <div class="grow"></div>
    <div class="col center tc">${cat('cheer', 10, 'float')}<div class="bubble up big mt tc"><b>${g.icon} ${g.name}</b><br>${g.desc}</div>
      <p class="muted" style="margin:1rem 0 0">🎯 Cel: ${goalText(key)}${set.attempts ? ` · próba ${set.attempts + 1} z ${MAXTRY}` : ''}</p></div>
    <div class="grow"></div>
    <div class="foot"><button class="btn b-lav nudge" data-act="play" data-arg="${key}">GRAJ 🎮</button>
      <button class="link w100" data-act="skipgame">pomiń gierkę</button></div>
  </div>`);
  loadLeaderboard(key, $('#leaderboard'));
}
let pillarEl;
const pillarImg = () => pillarEl || (pillarEl = Object.assign(new Image(), { src: assetSrc('assets/flappy/pillar.webp') }));
function gameShell(key, inner) {
  return `<div class="scr fixed">
    ${bar('<button class="x" data-act="quitgame">✕</button>', `<span class="label">${GAMES[key].name}</span>`, '<span class="pill" id="hud">⏱️</span>')}
    ${inner}<p class="hint">${GAMES[key].hint}</p></div>`;
}
function playGame(key) {
  if (!GSET || !GSET.mission) return renderMap();
  stopGame(); lastGame = key; cur = null;
  launchRankedRun(key);
  if (key === 'pack') return startPack();
  const p = GP[P.diff][key];
  show(gameShell(key, '<div class="cvbox" id="cvbox"><canvas id="cv"></canvas></div>'));
  const cv = $('#cv');
  G = { key, cv, ctx: cv.getContext('2d'), W: 430, H: 600, k: 1, score: 0, t: 0, limit: p.limit, last: 0, over: false, p,
        started: !(key === 'flappy' || key === 'lander'),
        lastFire: 0, lastSpawn: 0, ship: 215, bullets: [], enemies: [], lives: p.lives || 3, y: 300, vy: 0, pipes: [], items: [], x: 215,
        hold: false, tx: 215, landings: 0, msg: '', msgT: 0, pad: 215, shakeT: 0 };
  if (key === 'flappy') pillarImg();   // wczytaj przed pierwszą klatką
  if (key === 'lander') { G.sx = 215; G.sy = 50; G.svy = 0; G.pad = rnd(110, 320); }
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

/* --- Obrona bazy --- */
function updShooter(ts, dt) {
  const { W, H, p } = G;
  if (ts - G.lastFire > 260) { G.bullets.push({ x: G.ship, y: H - 70 }); G.lastFire = ts; }
  G.bullets.forEach(b => b.y -= 560 * dt); G.bullets = G.bullets.filter(b => b.y > -20);
  const gap = Math.max(380, p.gap - G.score * 6);
  if (ts - G.lastSpawn > gap) { G.enemies.push({ x: rnd(30, W - 30), y: -30, v: p.v + rnd(0, 60) + G.score * 2, e: Math.random() < .7 ? '☄️' : '🪨' }); G.lastSpawn = ts; }
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
  const catX = 110, hitH = 30, collisionRange = 39;   // kot 108 px (CAT_K); hitbox mniejszy od sprite'a: pion ±30, poziom ~11 + połowa słupa (trzon ~25, czapka 34, bierzemy 28)
  G.vy += .42 * k; G.y += G.vy * k;
  if (G.y < 10 || G.y > H - 10) { G.over = true; return; }
  if (ts - G.lastSpawn > p.spawn) { G.pipes.push({ x: W + 40, gapY: rnd(170, H - 170), gap: Math.max(p.gap - 20, p.gap - G.score * 4), passed: false }); G.lastSpawn = ts; }
  const sp = (p.sp + G.score * .08) * k;
  for (const pp of G.pipes) {
    pp.x -= sp;
    if (Math.abs(pp.x - catX) < collisionRange) {
      const top = pp.gapY - pp.gap / 2, bot = pp.gapY + pp.gap / 2;
      if (G.y - hitH < top || G.y + hitH > bot) { G.over = true; return; }
    }
    if (!pp.passed && pp.x <= catX - collisionRange) { pp.passed = true; G.score++; }
  }
  G.pipes = G.pipes.filter(pp => pp.x > -60);
}
/* --- Łapanie próbek --- */
function updCatch(ts, dt) {
  const { W, H, p } = G;
  if (ts - G.lastSpawn > Math.max(300, p.spawn - G.score * 8)) {
    const r = Math.random(), bad = r < p.rock, star = !bad && r < p.rock + .08;
    G.items.push({ x: rnd(30, W - 30), y: -30, v: p.v + rnd(0, 50) + G.score * 2, e: bad ? pick(['🪨', '☄️']) : star ? '⭐' : '🧪', bad, val: star ? 3 : 1 }); G.lastSpawn = ts;
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
function updLander(ts, dt) {
  const { W, H, p } = G, ground = H - 70;
  if (G.msgT > 0) { G.msgT -= dt; if (G.msgT <= 0) { G.sy = 50; G.svy = 0; G.pad = rnd(110, 320); G.msg = ''; } return; }
  G.sx += (G.tx - G.sx) * Math.min(1, dt * 5);
  G.svy += (p.g - (G.hold ? p.th : 0)) * dt; G.sy += G.svy * dt;
  if (G.sy < 30) { G.sy = 30; G.svy = Math.max(0, G.svy); }
  if (G.sy >= ground) {
    G.sy = ground;
    if (Math.abs(G.sx - G.pad) < p.pad / 2 && G.svy < p.safe) { G.landings++; G.msg = G.svy < p.safe / 2 ? 'Mięciutko!' : 'Lądowanie!'; }
    else G.msg = Math.abs(G.sx - G.pad) >= p.pad / 2 ? 'Obok pasa!' : 'Za szybko!';
    G.msgT = 1.2; G.svy = 0;
  }
}
/* --- Rysowanie --- */
function bg() {
  const { ctx, W, H } = G;
  const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#FFF8F0'); g.addColorStop(1, '#FFEBD2');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#F28A1E55'; for (let i = 0; i < 40; i++) ctx.fillRect((i * 97) % W, (i * 53 + 17) % H, i % 5 ? 2 : 3, i % 5 ? 2 : 3);
  ctx.fillStyle = '#1B1446';
}
function hudText(l, r) {
  const { ctx, W } = G; ctx.font = '900 22px Nunito, system-ui, sans-serif'; ctx.fillStyle = '#1B1446'; ctx.textBaseline = 'middle';
  ctx.textAlign = 'left'; ctx.fillText(l, 14, 26); ctx.textAlign = 'right'; ctx.fillText(r, W - 14, 26);
}
function draw() {
  const { ctx, W, H } = G; bg(); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  if (G.key === 'shooter') {
    ctx.font = '40px serif'; drawGameIcon(ctx, '🏠', W / 2, H - 16, 36); drawGameIcon(ctx, '🚀', G.ship, H - 50, 40);
    ctx.fillStyle = '#F28A1E'; G.bullets.forEach(b => { ctx.beginPath(); ctx.arc(b.x, b.y, 4.5, 0, 7); ctx.fill(); });
    ctx.font = '34px serif'; G.enemies.forEach(e => drawGameIcon(ctx, e.e, e.x, e.y, 34));
    hudText('Życia: ' + G.lives, 'Wynik: ' + G.score);
  } else if (G.key === 'flappy') {
    const bob = G.started ? 0 : Math.sin(performance.now() / 280) * 9;
    const pil = pillarImg(), art = pil.complete && pil.naturalWidth;
    G.pipes.forEach(pp => {
      if (art) {   // PNG 2x, nieskalowany (poza 68 px szerokości); czapka u góry obrazu, górna kolumna odbita w pionie
        const h = pil.naturalHeight / 2;
        ctx.drawImage(pil, pp.x - 34, pp.gapY + pp.gap / 2, 68, h);
        ctx.save(); ctx.translate(0, pp.gapY - pp.gap / 2); ctx.scale(1, -1); ctx.drawImage(pil, pp.x - 34, 0, 68, h); ctx.restore(); return;
      }
      ctx.fillStyle = '#F28A1E'; ctx.strokeStyle = '#1B1446'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.roundRect(pp.x - 34, -20, 68, pp.gapY - pp.gap / 2 + 20, 16); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.roundRect(pp.x - 34, pp.gapY + pp.gap / 2, 68, H, 16); ctx.fill(); ctx.stroke();
    });
    const im = catCanvasImg(G.vy < 0 ? 'cheer' : 'idle'), sk = skinOf();
    ctx.save(); if (sk.fx) ctx.filter = sk.fx;
    if (im && im.complete && im.naturalWidth) ctx.drawImage(im, 110 - CAT_K * 40, G.y + bob - CAT_K * 40, CAT_K * 80, CAT_K * 80);
    ctx.restore();
    hudText('', 'Wynik: ' + G.score);
    if (!G.started) { ctx.font = '900 28px Nunito, system-ui, sans-serif'; ctx.fillStyle = '#1B1446'; ctx.textAlign = 'center'; ctx.fillText('Dotknij, żeby zacząć!', W / 2, H / 2 + 90); }
  } else if (G.key === 'catch') {
    ctx.font = '34px serif'; G.items.forEach(i => drawGameIcon(ctx, i.e, i.x, i.y, 34));
    ctx.font = '54px serif'; drawGameIcon(ctx, '🧺', G.x + (G.shakeT > 0 ? rnd(-5, 5) : 0), H - 52, 54);
    hudText('Życia: ' + G.lives, 'Próbki: ' + G.score);
  } else if (G.key === 'lander') {
    const gy = H - 70;
    ctx.fillStyle = '#E8E1D6'; ctx.beginPath(); ctx.roundRect(-10, gy + 22, W + 20, H, 20); ctx.fill();
    ctx.fillStyle = '#F28A1E'; ctx.beginPath(); ctx.roundRect(G.pad - G.p.pad / 2, gy + 22, G.p.pad, 10, 5); ctx.fill();
    ctx.font = '26px serif'; drawGameIcon(ctx, '🪨', 60, gy + 52, 26); drawGameIcon(ctx, '🪨', 360, gy + 58, 26);
    ctx.font = '44px serif'; drawGameIcon(ctx, '🛸', G.sx, G.sy, 44);
    if (G.hold && G.msgT <= 0) { ctx.font = '30px serif'; drawGameIcon(ctx, '🔥', G.sx, G.sy + 38, 30); }
    const v = Math.max(0, G.svy), ok = v < G.p.safe;
    ctx.fillStyle = '#E8E1D6'; ctx.beginPath(); ctx.roundRect(W / 2 - 70, 14, 140, 12, 6); ctx.fill();
    ctx.fillStyle = ok ? '#167A45' : '#C62E2E'; ctx.beginPath(); ctx.roundRect(W / 2 - 70, 14, Math.min(140, v / (G.p.safe * 2) * 140), 12, 6); ctx.fill();
    hudText('Lądowania: ' + G.landings, '');
    if (!G.started) { ctx.font = '900 26px Nunito, system-ui, sans-serif'; ctx.fillStyle = '#1B1446'; ctx.textAlign = 'center'; ctx.fillText('Przytrzymaj, żeby zacząć!', W / 2, H / 2); }
    if (G.msgT > 0) { ctx.font = '900 30px Nunito, system-ui, sans-serif'; ctx.fillStyle = '#1B1446'; ctx.fillText(G.msg, W / 2, H / 2 - 60); }
  }
}
