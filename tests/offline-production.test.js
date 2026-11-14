'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const stateScripts = ['05-questions.js', '06-base-data.js', '07-state.js']
  .map(file => fs.readFileSync(path.join(__dirname, '..', 'js', file), 'utf8'))
  .join('\n');

function stateContext(localStorage, now) {
  const context = vm.createContext({ Date: { now: () => now }, localStorage, SAVE_KEY: 'astromeow-v1' });
  vm.runInContext(stateScripts, context);
  return context;
}

function partsAfterLoading({ awaySeconds, boostExpiresAfterSeconds }) {
  const now = 1_800_000_000_000;
  const context = stateContext({ getItem: () => JSON.stringify(saved) }, now);
  const saved = vm.runInContext('fresh()', context);
  saved.lastSave = now - awaySeconds * 1000;
  if (boostExpiresAfterSeconds === undefined) {
    delete saved.boostUntil;
  } else {
    saved.boostUntil = saved.lastSave + boostExpiresAfterSeconds * 1000;
  }
  saved.planets[0].grid['0,0'] = { type: 'warsztat', level: 1, addons: [] };
  return vm.runInContext('load(); P.res.czesci', context);
}

test('offline production includes the boost even if it expired before reopening', () => {
  assert.equal(partsAfterLoading({ awaySeconds: 60, boostExpiresAfterSeconds: 20 }), 70);
});

test('offline production uses boosted rates while the boost is active', () => {
  assert.equal(partsAfterLoading({ awaySeconds: 20, boostExpiresAfterSeconds: 40 }), 30);
});

test('offline production preserves the two-hour cap for older saves', () => {
  assert.equal(partsAfterLoading({ awaySeconds: 8000 }), 7200);
});

test('a boost that expired before saving has no effect on offline production', () => {
  assert.equal(partsAfterLoading({ awaySeconds: 60, boostExpiresAfterSeconds: -10 }), 60);
});

test('offline production still skips absences of five seconds or less', () => {
  assert.equal(partsAfterLoading({ awaySeconds: 5, boostExpiresAfterSeconds: 60 }), 0);
});

test('a fresh session restores completed missions, resources and buildings from a save', () => {
  const storage = new Map();
  const localStorage = { setItem: (key, value) => storage.set(key, value), getItem: key => storage.get(key) };
  const now = 1_800_000_000_000;
  const session = stateContext(localStorage, now);
  vm.runInContext(`
    P.diff = 'mid';
    P.done.mid.push(1);
    P.stars.mid[1] = 3;
    P.res.czesci = 42;
    P.planets[0].grid['0,0'] = { type: 'warsztat', level: 2, addons: ['panel'] };
    save();
  `, session);
  const reloaded = stateContext(localStorage, now);
  const snapshot = JSON.parse(vm.runInContext('load(); JSON.stringify(P)', reloaded));
  assert.equal(snapshot.diff, 'mid');
  assert.deepEqual(snapshot.done.mid, [1]);
  assert.equal(snapshot.stars.mid[1], 3);
  assert.equal(snapshot.res.czesci, 42);
  assert.deepEqual(snapshot.planets[0].grid['0,0'], { type: 'warsztat', level: 2, addons: ['panel'] });
});

test('invalid stored JSON leaves a playable fresh profile', () => {
  const context = stateContext({ getItem: () => '{' }, 1_800_000_000_000);
  assert.equal(vm.runInContext('load(); P.res.wiedza', context), 20);
  assert.equal(vm.runInContext('doneCount()', context), 0);
});
