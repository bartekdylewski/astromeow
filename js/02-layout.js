'use strict';
/* ===================== RESPONSYWNOŚĆ ===================== */
let G = null, PK = null;
function fit() {
  const vw = innerWidth, vh = innerHeight;
  const portrait = vh >= vw * 1.15;           // ekran pionowy (np. laptop obrócony 9:16)
  const full = portrait || vw <= 520;          // pionowo i na telefonie: cała szerokość
  const w = full ? vw : Math.min(vw - 24, 700, Math.max(380, vh * 0.68));
  device.style.width = w + 'px';
  device.classList.toggle('full', full);
  const k = Math.min(w / 430, vh / (full ? 780 : 820));
  document.documentElement.style.fontSize = Math.max(11.5, Math.min(56, 16 * k)) + 'px';
  if (G) fitCanvas();
  if (PK) layoutPack();
}
addEventListener('resize', fit); fit();
