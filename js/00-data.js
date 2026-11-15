'use strict';
let DATA = window.DATA_EMBED || null;
function loadData() {
  if (DATA) return Promise.resolve(DATA);
  const files = ['missions.json', 'tutorials.json', 'ciekawostki.json', 'safety.json', 'blocked-words.pl.txt', 'blocked-words.en.txt'];
  return Promise.all(files.map(async file => {
    const response = await fetch('config/' + file);
    if (!response.ok) throw new Error('HTTP ' + response.status + ' dla config/' + file);
    const value = file.endsWith('.json') ? await response.json() : (await response.text()).split(/\r?\n/);
    return [file.slice(0, -file.split('.').at(-1).length - 1), value];
  })).then(entries => DATA = Object.fromEntries(entries));
}
