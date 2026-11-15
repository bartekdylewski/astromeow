'use strict';
/* ===================== KOT ===================== */
const POSES = ['idle', 'happy', 'sad', 'think', 'cheer'];
const CATX = {};            // pose -> [Image]
let fi = 0;                 // numer klatki (wspólny zegar)
const loadImg = u => new Promise(r => { const i = new Image(); i.onload = () => r(i); i.onerror = () => r(null); i.src = u; });
/* kot wbudowany w dist/astromeow.html (window.CAT_EMBED robi build.py), inaczej pliki z folderu cat/ */
async function embImg(uri) {
  try { const b = await (await fetch(uri)).blob(); const i = await loadImg(URL.createObjectURL(b)); if (i) return i; } catch (_) {}
  return loadImg(uri);
}
async function probeCat() {
  const emb = window.CAT_EMBED || {};
  for (const p of POSES) {
    let fr = [];
    if (emb[p]) { const i = await embImg(emb[p]); if (i) fr = [i]; }
    if (!fr.length) for (const ext of ['png', 'webp']) {
      const a = await Promise.all([1, 2, 3].map(n => loadImg(`${CAT_DIR}${p}_${n}.${ext}`)));
      if (a.every(Boolean)) { fr = a; break; }
    }
    if (!fr.length) for (const ext of ['webp', 'gif', 'png']) { const i = await loadImg(`${CAT_DIR}${p}.${ext}`); if (i) { fr = [i]; break; } }
    if (fr.length) CATX[p] = fr;
  }
  if (Object.keys(CATX).length && !G && !PK && cur) cur();   // odśwież ekran z prawdziwym kotem
}
setInterval(() => {
  fi++;
  document.querySelectorAll('.cat img[data-pose]').forEach(im => {
    const fr = CATX[im.dataset.pose] || CATX.idle;
    if (fr && fr.length > 1) im.src = fr[fi % fr.length].src;
  });
}, 170);

function catSvg(pose) {
  const ink = '#3B3459';
  const eyes = {
    idle: `<ellipse cx="80" cy="90" rx="7" ry="9" fill="${ink}"/><ellipse cx="120" cy="90" rx="7" ry="9" fill="${ink}"/><circle cx="82.5" cy="86.5" r="2.8" fill="#fff"/><circle cx="122.5" cy="86.5" r="2.8" fill="#fff"/>`,
    happy: `<path d="M71 94 Q80 79 89 94" stroke="${ink}" stroke-width="5" fill="none" stroke-linecap="round"/><path d="M111 94 Q120 79 129 94" stroke="${ink}" stroke-width="5" fill="none" stroke-linecap="round"/>`,
    cheer: `<path d="M71 94 Q80 79 89 94" stroke="${ink}" stroke-width="5" fill="none" stroke-linecap="round"/><path d="M111 94 Q120 79 129 94" stroke="${ink}" stroke-width="5" fill="none" stroke-linecap="round"/>`,
    sad: `<ellipse cx="80" cy="94" rx="7" ry="9" fill="${ink}"/><ellipse cx="120" cy="94" rx="7" ry="9" fill="${ink}"/><circle cx="82.5" cy="90.5" r="3" fill="#fff"/><circle cx="122.5" cy="90.5" r="3" fill="#fff"/><path d="M68 87 L90 79" stroke="${ink}" stroke-width="4" stroke-linecap="round"/><path d="M132 87 L110 79" stroke="${ink}" stroke-width="4" stroke-linecap="round"/><path d="M76 104 q-5 9 0 13 q5 -4 0 -13z" fill="#8FD0FF"/>`,
    think: `<ellipse cx="82" cy="88" rx="7" ry="9" fill="${ink}"/><ellipse cx="122" cy="88" rx="7" ry="9" fill="${ink}"/><circle cx="85" cy="84" r="2.8" fill="#fff"/><circle cx="125" cy="84" r="2.8" fill="#fff"/><path d="M110 76 L132 72" stroke="${ink}" stroke-width="4" stroke-linecap="round"/>`,
  }[pose] || '';
  const mouth = {
    idle: `<path d="M92 114 Q96 120 100 114 Q104 120 108 114" stroke="${ink}" stroke-width="3" fill="none" stroke-linecap="round"/>`,
    happy: `<path d="M90 110 Q100 128 110 110 Z" fill="#FF8FA9" stroke="${ink}" stroke-width="3" stroke-linejoin="round"/>`,
    cheer: `<path d="M90 110 Q100 128 110 110 Z" fill="#FF8FA9" stroke="${ink}" stroke-width="3" stroke-linejoin="round"/>`,
    sad: `<path d="M92 120 Q100 111 108 120" stroke="${ink}" stroke-width="3" fill="none" stroke-linecap="round"/>`,
    think: `<path d="M94 116 h12" stroke="${ink}" stroke-width="3" stroke-linecap="round"/>`,
  }[pose] || '';
  const arms = pose === 'cheer'
    ? `<ellipse cx="52" cy="126" rx="10" ry="19" transform="rotate(-32 52 126)" fill="#fff" stroke="#E7DFFB" stroke-width="3"/><ellipse cx="148" cy="126" rx="10" ry="19" transform="rotate(32 148 126)" fill="#fff" stroke="#E7DFFB" stroke-width="3"/>`
    : `<ellipse cx="62" cy="160" rx="10" ry="18" fill="#fff" stroke="#E7DFFB" stroke-width="3"/><ellipse cx="138" cy="160" rx="10" ry="18" fill="#fff" stroke="#E7DFFB" stroke-width="3"/>`;
  const extra = pose === 'think'
    ? `<text x="144" y="44" font-size="40" font-weight="900" fill="#A18EF0" font-family="sans-serif">?</text>`
    : pose === 'cheer'
      ? `<path d="M26 46 l4 9 9 4 -9 4 -4 9 -4 -9 -9 -4 9 -4z" fill="#FFD76A"/><path d="M170 36 l3 7 7 3 -7 3 -3 7 -3 -7 -7 -3 7 -3z" fill="#FFB3CB"/><path d="M176 96 l3 7 7 3 -7 3 -3 7 -3 -7 -7 -3 7 -3z" fill="#B7E8FF"/>` : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
  <path d="M146 162 Q192 152 180 112 Q176 100 164 108" fill="none" stroke="#C9B6FF" stroke-width="14" stroke-linecap="round"/>
  <ellipse cx="100" cy="158" rx="44" ry="36" fill="#fff" stroke="#E7DFFB" stroke-width="3"/>
  <rect x="86" y="142" width="28" height="12" rx="5" fill="#CDBEFF"/><circle cx="94" cy="148" r="2.5" fill="#fff"/><circle cx="106" cy="148" r="2.5" fill="#FF9DB8"/>
  ${arms}
  <polygon points="58,68 64,26 94,50" fill="#C9B6FF" stroke="#A892F2" stroke-width="3" stroke-linejoin="round"/><polygon points="142,68 136,26 106,50" fill="#C9B6FF" stroke="#A892F2" stroke-width="3" stroke-linejoin="round"/>
  <polygon points="65,60 68,40 84,52" fill="#FFC8D7"/><polygon points="135,60 132,40 116,52" fill="#FFC8D7"/>
  <circle cx="100" cy="92" r="46" fill="#C9B6FF" stroke="#A892F2" stroke-width="3"/>
  <ellipse cx="100" cy="108" rx="28" ry="20" fill="#F6F1FF"/>
  <path d="M100 52 l3 6 6 1 -4 4 1 6 -6 -3 -6 3 1 -6 -4 -4 6 -1z" fill="#fff" opacity=".9"/>
  <ellipse cx="66" cy="108" rx="8" ry="5" fill="#FFB8CC" opacity=".75"/><ellipse cx="134" cy="108" rx="8" ry="5" fill="#FFB8CC" opacity=".75"/>
  ${eyes}
  <path d="M95 103 h10 l-5 6z" fill="#FF8FA9"/>
  ${mouth}
  <path d="M60 104 L40 100 M60 111 L40 114 M140 104 L160 100 M140 111 L160 114" stroke="#B9AEE0" stroke-width="2.5" stroke-linecap="round"/>
  <circle cx="100" cy="92" r="62" fill="#BFE3FF" fill-opacity=".22" stroke="#9FD0F5" stroke-width="5"/>
  <path d="M58 56 Q72 40 92 36" stroke="#fff" stroke-width="6" fill="none" stroke-linecap="round" opacity=".9"/>
  ${extra}
</svg>`;
}
/* skiny kota: fx = filtr koloru, art = narysowany kot z assets/skins/<art>.webp (zastępuje klatki cat/) */
const SKINS = [
  { id: 'classic', n: 'Klasyczny', fx: '', p: 0 },
  { id: 'sakura', n: 'Różowy', fx: 'hue-rotate(300deg) saturate(1.1)', p: 80 },
  { id: 'mint', n: 'Fioletowy', fx: 'hue-rotate(240deg)', p: 80 },
  { id: 'sunny', n: 'Błękitny', fx: 'hue-rotate(160deg)', p: 100 },
  { id: 'dj', n: 'Muzyk', fx: '', art: 'dj', p: 100 },
  { id: 'cowboy', n: 'Kowboj', fx: '', art: 'cowboy', p: 120 },
  { id: 'gentleman', n: 'Elegant', fx: '', art: 'gentleman', p: 120 },
  { id: 'baker', n: 'Piekarz', fx: '', art: 'baker', p: 130 },
  { id: 'king', n: 'Król', fx: '', art: 'king', p: 150 },
  { id: 'gold', n: 'Złoty król', fx: 'sepia(.9) saturate(2.4) hue-rotate(-12deg) brightness(1.05)', art: 'king', p: 250 },
];
const GOLD_PRICE = 50;
const skinOf = id => SKINS.find(x => x.id === (id || (typeof P !== 'undefined' && P.skin))) || SKINS[0];
/* dodatki mimiki (jedna grafika kota + efekt przy mordce), gdy brak osobnych klatek */
const POSE_FX = { happy: '✨', cheer: '🎉', think: '❓' };
const CAT_K = 1.7;    // globalny mnożnik rozmiaru kota (#21); .cat ma max 78vw w CSS
function cat(pose = 'idle', size = 6, cls = '', skin) {
  size = +(size * CAT_K).toFixed(2);
  const sk = skinOf(skin);
  const fr = CATX[pose] || CATX.idle;
  const inner = sk.art ? `<img src="${assetSrc('assets/skins/' + sk.art + '.webp')}" alt="Astruś" draggable="false">` : fr ? `<img data-pose="${pose}" src="${fr[0].src}" alt="Astruś" draggable="false">` : catSvg(pose);
  const fx = !sk.art && fr && !CATX[pose] && POSE_FX[pose] ? `<span class="cpose" style="font-size:${(size * .3).toFixed(2)}rem">${POSE_FX[pose]}</span>` : '';
  return `<span class="cat p-${pose} ${fr ? 'ext' : ''} ${sk.art ? 'art' : ''} ${cls}" style="width:${size}rem;height:${size}rem"><span class="cfx" style="${sk.fx ? 'filter:' + sk.fx : ''}">${inner}</span>${fx}</span>`;
}
/* kot tłumaczy: wspólny komponent "kot + dymek" do wszystkich ekranów i gier */
function catSay(pose, html, { size = 5, cls = '', who = '' } = {}) {
  return `<div class="say ${cls}">${cat(pose, size)}<div class="bubble line"><span>${who ? `<b class="who">${who}</b>` : ''}${html}</span></div></div>`;
}
const svgImgs = {};
function catCanvasImg(pose = 'idle') {
  const art = skinOf().art;
  if (art) { const k = 'a' + art; if (!svgImgs[k]) { const i = new Image(); i.src = assetSrc('assets/skins/' + art + '.webp'); svgImgs[k] = i; } return svgImgs[k]; }
  const fr = CATX[pose] || CATX.idle;
  if (fr) return fr[fi % fr.length];
  if (!svgImgs[pose]) { const i = new Image(); i.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(catSvg(pose)); svgImgs[pose] = i; }
  return svgImgs[pose];
}
