let TUT = null;
function openTut(k) { TUT = { k, i: 0 }; renderTut(); }
function renderTut() {
  const old = $('#tut'); if (old) old.remove();
  const list = DATA.tutorials[TUT.k], st = list[TUT.i], last = TUT.i === list.length - 1;
  const o = document.createElement('div'); o.id = 'tut'; o.className = 'tutov';
  o.innerHTML = `<div class="tutcard">${cat(last ? 'cheer' : 'idle', 6)}<div class="tutstep">${st.e}</div><h3>${st.t}</h3><p>${st.d}</p>
    <div class="dots mb">${list.map((_, i) => `<i class="${i === TUT.i ? 'on' : ''}"></i>`).join('')}</div>
    <button class="btn b-lav" data-act="tut-next">${last ? 'ROZUMIEM' : 'DALEJ ›'}</button>
    ${last ? '' : '<button class="link w100" data-act="tut-skip">pomiń</button>'}</div>`;
  device.appendChild(o);
}
function closeTut() { const o = $('#tut'); if (o) o.remove(); if (TUT) { P.tut[TUT.k] = true; save(); } TUT = null; }
