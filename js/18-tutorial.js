'use strict';
/* ===================== TUTORIAL ===================== */
const TUTS = {
  quiz: [
    { e: '👆', t: 'Dotknij odpowiedź', d: 'Sprawdzę ją od razu. Nie ma przycisku „sprawdź”!' },
    { e: '❤️', t: 'Masz 3 serca', d: 'Zła odpowiedź zabiera serce. Dobra daje ⭐ punkty i 🧠 Wiedzę do bazy.' },
    { e: '➡️', t: 'Potem dotknij DALEJ', d: 'Przeczytam Ci ciekawostkę 💡 i lecimy dalej. Po 5 pytaniach czeka gierka.' },
  ],
  base: [
    { e: '🧠 🔩 ☄️', t: 'Trzy zasoby', d: 'Quiz daje 🧠 Wiedzę, a gierki 🔩 Części i ☄️ Meteoryty. Za nie budujemy bazę!' },
    { e: '🏗️', t: 'Buduj na planecie', d: 'Dotknij ＋ i postaw budynek. Budynki same produkują zasoby, nawet gdy nie grasz.' },
    { e: '⭐', t: 'Ulepszaj', d: 'Dotknij budynku, żeby go ulepszyć albo dodać dodatek ☀️ 📡 🫧.' },
    { e: '🪐', t: 'Nowe planety', d: 'Zabuduj całą planetę i zalicz misje, a odblokujesz większą. Droższą, ale z lepszymi zyskami!' },
  ],
  shop: [
    { e: '🛍️', t: 'Sklep', d: 'Za ⭐ z misji kupisz mi nowe stroje. Dotknij ZAŁÓŻ, żeby mnie przebrać.' },
    { e: '💛', t: 'Złote życie', d: 'Daje 4. serce na jedną misję. Włączysz je na ekranie przed startem.' },
  ],
  map: [
    { e: '🐾', t: 'Szlak MeowMission', d: 'Idź moim tropem od 🌱 przez 🔥 do 🚀. Dotknij pomarańczowej misji ze START.' },
    { e: '🔒', t: 'Misje po kolei', d: 'Kolejna misja odblokowuje się po zaliczeniu poprzedniej. Powtórki dają połowę nagród.' },
  ],
};
let TUT = null;
function openTut(k) { TUT = { k, i: 0 }; renderTut(); }
function renderTut() {
  const old = $('#tut'); if (old) old.remove();
  const list = TUTS[TUT.k], st = list[TUT.i], last = TUT.i === list.length - 1;
  const o = document.createElement('div'); o.id = 'tut'; o.className = 'tutov';
  o.innerHTML = `<div class="tutcard">${cat(last ? 'cheer' : 'idle', 6)}<div class="tutstep">${st.e}</div><h3>${st.t}</h3><p>${st.d}</p>
    <div class="dots mb">${list.map((_, i) => `<i class="${i === TUT.i ? 'on' : ''}"></i>`).join('')}</div>
    <button class="btn b-lav" data-act="tut-next">${last ? 'ROZUMIEM' : 'DALEJ ›'}</button>
    ${last ? '' : '<button class="link w100" data-act="tut-skip">pomiń</button>'}</div>`;
  device.appendChild(o);
}
function closeTut() { const o = $('#tut'); if (o) o.remove(); if (TUT) { P.tut[TUT.k] = true; save(); } TUT = null; }
