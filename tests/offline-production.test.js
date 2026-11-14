'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const stateScripts = ['06-base-data.js', '07-state.js']
  .map(file => fs.readFileSync(path.join(__dirname, '..', 'js', file), 'utf8'))
  .join('\n');

function partsAfterLoading({ awaySeconds, boostExpiresAfterSeconds }) {
  const now = 1_800_000_000_000;
  const context = vm.createContext({ Date: { now: () => now } });
  vm.runInContext(stateScripts, context);
  const saved = vm.runInContext('fresh()', context);
  saved.lastSave = now - awaySeconds * 1000;
  if (boostExpiresAfterSeconds === undefined) {
    delete saved.boostUntil;
  } else {
    saved.boostUntil = saved.lastSave + boostExpiresAfterSeconds * 1000;
  }
  saved.planets[0].grid['0,0'] = { type: 'warsztat', level: 1, addons: [] };
  context.localStorage = { getItem: () => JSON.stringify(saved) };
  context.SAVE_KEY = 'astromeow-v1';
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
