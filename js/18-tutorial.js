let TUT = null;
function openTut(k) { TUT = { k, i: 0 }; renderTut(); }
function renderTut() {
  const old = $('#tut'); if (old) old.remove();
  const list = DATA.tutorials[TUT.k], st = list[TUT.i], last = TUT.i === list.length - 1;
  const o = document.createElement('div'); o.id = 'tut'; o.className = 'tutov';
  o.innerHTML = `<div class="tutcard scene-swipe">${cat(last ? 'cheer' : 'idle', 6)}<div class="tutstep">${st.e}</div><h3>${st.t}</h3><p>${st.d}</p>
    <button class="btn b-lav" data-act="tut-next">${last ? 'ROZUMIEM' : 'DALEJ ›'}</button>
    ${last ? '' : '<button class="link w100" data-act="tut-skip">pomiń</button>'}
    ${sceneDots(list.length, TUT.i)}</div>`;
  device.appendChild(o);
  bindSceneSwipe(o.querySelector('.scene-swipe'), TUT.i, list.length, next => { TUT.i = next; renderTut(); });
}
function closeTut() { const o = $('#tut'); if (o) o.remove(); if (TUT) { P.tut[TUT.k] = true; save(); } TUT = null; }
