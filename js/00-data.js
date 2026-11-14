'use strict';
/* ===================== DANE Z PLIKÓW JSON (data/*.json) =====================
   Treść gry (etapy, pytania, lekcje, ciekawostki) leży w folderze data/.
   - W zbudowanym dist/astromeow.html dane są już wbudowane (window.DATA_EMBED).
   - W trybie dev (index.html z serwera) są pobierane przez fetch.
   Nowy plik data/xyz.json: dopisz 'xyz' do DATA_NAMES (build.py wbuduje go sam). */
const DATA_NAMES = ['stages', 'ciekawostki'];
let DATA = window.DATA_EMBED || null;
function loadData() {
  if (DATA) return Promise.resolve(DATA);
  return Promise.all(DATA_NAMES.map(n => fetch('data/' + n + '.json').then(r => {
    if (!r.ok) throw new Error('HTTP ' + r.status + ' dla data/' + n + '.json');
    return r.json();
  }))).then(list => { DATA = {}; DATA_NAMES.forEach((n, i) => { DATA[n] = list[i]; }); return DATA; });
}
