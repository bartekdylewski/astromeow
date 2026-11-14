'use strict';
/* ===================== PAKOWANIE RAKIETY (układanie klocków) ===================== */
const PC_COL = [['#CDBEFF', '#A18EF0'], ['#B4EBD0', '#74CBA2'], ['#FFD0A6', '#F2A867'], ['#FFC8D7', '#F597B3'], ['#C2E4FF', '#86C3F0'], ['#FFF0B3', '#EBD071']];
const PC_EMO = ['🔋', '🥫', '🧪', '🛰️', '🔧', '📡', '🧰', '🪴'];
function normalize(cells) {
  const mx = Math.min(...cells.map(c => c[0])), my = Math.min(...cells.map(c => c[1]));
  const cs = cells.map(([x, y]) => [x - mx, y - my]);
  return { cells: cs, w: Math.max(...cs.map(c => c[0])) + 1, h: Math.max(...cs.map(c => c[1])) + 1 };
}
function rotatePiece(p) { Object.assign(p, normalize(p.cells.map(([x, y]) => [-y, x]))); }
function genPuzzle({ w, h, n, slack }) {
  let pcs = null;
  for (let tr = 0; tr < 60; tr++) {
    const id = Array.from({ length: h }, () => Array(w).fill(-1)), all = [];
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) all.push([x, y]);
    shuffle(all).slice(0, n).forEach(([x, y], i) => id[y][x] = i);
    let left = w * h - n;
    while (left > 0) for (const i of shuffle([...Array(n).keys()])) {
      if (left <= 0) break;
      const fr = [];
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (id[y][x] === i)
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const X = x + dx, Y = y + dy; if (X >= 0 && Y >= 0 && X < w && Y < h && id[Y][X] === -1) fr.push([X, Y]); }
      if (!fr.length) continue;
      const [X, Y] = pick(fr); id[Y][X] = i; left--;
    }
    pcs = Array.from({ length: n }, (_, i) => { const c = []; for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (id[y][x] === i) c.push([x, y]); return c; });
    const sz = pcs.map(c => c.length);
    if (Math.min(...sz) >= 2 && Math.max(...sz) <= 5) break;
  }
  pcs.sort((a, b) => a.length - b.length);
  while (w * h - pcs.reduce((a, c) => a + c.length, 0) < slack && pcs.length > 3) pcs.shift();
  const cols = shuffle(PC_COL), emo = shuffle(PC_EMO);
  return pcs.map((c, i) => {
    const p = { id: i, ...normalize(c), emoji: emo[i % emo.length], color: cols[i % cols.length][0], dark: cols[i % cols.length][1], at: null };
    for (let r = Math.random() * 4 | 0; r > 0; r--) rotatePiece(p);
    return p;
  });
}
function startPack() {
  const p = GP[P.diff].pack;
  show(gameShell('pack', `<div class="pkroot" id="pkroot">
      <div class="rocket" id="rocket"><div class="nose" id="nose"></div>
        <div class="rbody" id="rbody"><span class="fin l"></span><span class="fin r"></span><div class="bay" id="bay"></div></div>
        <div class="flame" style="font-size:1.6rem;line-height:1;margin-top:-.2rem">🔥</div></div>
      <div class="tray" id="tray"></div></div>`));
  PK = { w: p.w, h: p.h, pieces: genPuzzle(p), t: 0, limit: p.limit, drag: null, over: false, cell: 48, tc: 32 };
  PK.timer = setInterval(() => {
    if (!PK || PK.over) return; PK.t += .25;
    const hud = $('#hud'); if (hud) hud.textContent = `📦 ${PK.pieces.filter(x => x.at).length}/${PK.pieces.length} · ⏱️ ${Math.max(0, Math.ceil(PK.limit - PK.t))}`;
    if (PK.t >= PK.limit) endPack(false);
  }, 250);
  $('#pkroot').addEventListener('pointerdown', pkDown);
  layoutPack();
}
function layoutPack() {
  const root = $('#pkroot'); if (!root || !PK) return;
  const W = root.clientWidth, H = root.clientHeight;
  const rem = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
  PK.cell = Math.floor(Math.max(24, Math.min(W * .7 / PK.w, H * .58 / (PK.h + 1.6), 4.4 * rem)));
  PK.tc = Math.floor(PK.cell * .62);
  const bw = PK.w * PK.cell, bh = PK.h * PK.cell, bay = $('#bay');
  bay.style.width = bw + 'px'; bay.style.height = bh + 'px';
  const nose = $('#nose'); nose.style.width = bw * .8 + 'px'; nose.style.height = PK.cell * .9 + 'px';
  renderPack();
}
function pieceEl(p, cell) {
  const el = document.createElement('div'); el.className = 'pc'; el.dataset.id = p.id;
  el.style.width = p.w * cell + 'px'; el.style.height = p.h * cell + 'px';
  p.cells.forEach(([x, y], i) => {
    const c = document.createElement('div'); c.className = 'pcell';
    c.style.cssText = `left:${x * cell}px;top:${y * cell}px;width:${cell}px;height:${cell}px;background:${p.color};border-color:${p.dark};font-size:${cell * .55}px`;
    if (i === 0) c.textContent = p.emoji; el.appendChild(c);
  });
  return el;
}
function renderPack() {
  const bay = $('#bay'), tray = $('#tray'); if (!bay || !PK) return;
  bay.innerHTML = ''; tray.innerHTML = '';
  for (let y = 0; y < PK.h; y++) for (let x = 0; x < PK.w; x++) {
    const c = document.createElement('div'); c.className = 'bcell';
    c.style.cssText = `left:${x * PK.cell}px;top:${y * PK.cell}px;width:${PK.cell}px;height:${PK.cell}px`; bay.appendChild(c);
  }
  PK.pieces.forEach(p => {
    if (PK.drag && PK.drag.moved && PK.drag.p === p) return;
    if (p.at) { const el = pieceEl(p, PK.cell); el.classList.add('placed'); el.style.left = p.at.x * PK.cell + 'px'; el.style.top = p.at.y * PK.cell + 'px'; bay.appendChild(el); }
    else { const s = document.createElement('div'); s.className = 'slot'; s.appendChild(pieceEl(p, PK.tc)); tray.appendChild(s); }
  });
  const hud = $('#hud'); if (hud) hud.textContent = `📦 ${PK.pieces.filter(x => x.at).length}/${PK.pieces.length} · ⏱️ ${Math.max(0, Math.ceil(PK.limit - PK.t))}`;
}
function occGrid(skip) {
  const g = Array.from({ length: PK.h }, () => Array(PK.w).fill(false));
  PK.pieces.forEach(p => { if (p !== skip && p.at) p.cells.forEach(([x, y]) => g[p.at.y + y][p.at.x + x] = true); });
  return g;
}
function placementError(p, gx, gy) {
  if (gx < 0 || gy < 0 || gx + p.w > PK.w || gy + p.h > PK.h) {
    return 'Cały klocek musi zmieścić się w ładowni.';
  }
  const g = occGrid(p);
  return p.cells.some(([x, y]) => g[gy + y][gx + x]) ? 'To miejsce jest już zajęte.' : '';
}
function pkDown(e) {
  const el = e.target.closest('.pc'); if (!el || !PK || PK.over || PK.drag || e.button !== 0) return;
  const p = PK.pieces.find(q => q.id == el.dataset.id); if (!p) return;
  e.preventDefault();
  const r = el.getBoundingClientRect();
  PK.drag = { p, pointerId: e.pointerId, sx: e.clientX, sy: e.clientY, u: (e.clientX - r.left) / r.width, v: (e.clientY - r.top) / r.height, moved: false, el: null, ghost: null };
  addEventListener('pointermove', pkMove); addEventListener('pointerup', pkUp); addEventListener('pointercancel', pkUp);
}
function pkMove(e) {
  const d = PK && PK.drag; if (!d || PK.over || e.pointerId !== d.pointerId) return;
  if (!d.moved) {
    if (Math.hypot(e.clientX - d.sx, e.clientY - d.sy) < 8) return;
    d.moved = true; renderPack();
    d.el = pieceEl(d.p, PK.cell); d.el.classList.add('drag'); $('#pkroot').appendChild(d.el);
    d.ghost = pieceEl(d.p, PK.cell); d.ghost.classList.add('ghost'); $('#bay').appendChild(d.ghost);
  }
  const root = $('#pkroot').getBoundingClientRect(), bay = $('#bay').getBoundingClientRect();
  const pw = d.p.w * PK.cell, ph = d.p.h * PK.cell;
  const left = e.clientX - root.left - d.u * pw, top = e.clientY - root.top - d.v * ph;
  d.el.style.left = left + 'px'; d.el.style.top = top + 'px';
  d.gx = Math.round((left - (bay.left - root.left)) / PK.cell); d.gy = Math.round((top - (bay.top - root.top)) / PK.cell);
  d.ghost.style.left = d.gx * PK.cell + 'px'; d.ghost.style.top = d.gy * PK.cell + 'px';
  d.error = placementError(d.p, d.gx, d.gy);
  d.ghost.classList.toggle('bad', Boolean(d.error));
  d.ghost.style.display = (d.gx + d.p.w <= 0 || d.gy + d.p.h <= 0 || d.gx >= PK.w || d.gy >= PK.h) ? 'none' : '';
}
function pkUp(e) {
  const d = PK && PK.drag; if (!d || e.pointerId !== d.pointerId) return;
  removeEventListener('pointermove', pkMove); removeEventListener('pointerup', pkUp); removeEventListener('pointercancel', pkUp);
  if (d.moved && !PK.over && e.type === 'pointerup') pkMove(e);
  PK.drag = null;
  if (d.el) d.el.remove(); if (d.ghost) d.ghost.remove();
  if (PK.over || e.type === 'pointercancel') { renderPack(); return; }
  if (!d.moved) { if (d.p.at) d.p.at = null; else rotatePiece(d.p); renderPack(); return; }
  if (d.error) toast(d.error, false);
  else d.p.at = { x: d.gx, y: d.gy };
  renderPack();
  if (PK.pieces.every(p => p.at)) endPack(true);
}
function endPack(win) {
  if (!PK || PK.over) return; PK.over = true;
  const placed = PK.pieces.filter(p => p.at).length;
  const score = placed * 2 + (win ? 3 + Math.ceil((PK.limit - PK.t) / 5) : 0);
  if (win) { confetti(20, ['🚀', '✨', '📦', '⭐']); setTimeout(() => finishGame('pack', score, true), 700); }
  else finishGame('pack', score, false);
}
