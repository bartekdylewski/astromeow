'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const scripts = ['13-minigames.js', '14-pack.js', '15-results.js']
  .map(file => fs.readFileSync(path.join(__dirname, '..', 'js', file), 'utf8'))
  .join('\n');

function packingSession() {
  const scheduled = [];
  const results = [];
  const context = vm.createContext({
    P: { diff: 'easy', res: { czesci: 0 }, pts: 0, best: {} },
    DIFFS: { easy: { mult: 1 } },
    PK: { pieces: [{ at: { x: 0, y: 0 } }], limit: 70, t: 65, over: false },
    G: null, S: null,
    confetti() {}, addEventListener() {}, removeEventListener() {},
    cancelAnimationFrame() {}, clearInterval() {}, save() {},
    setTimeout: callback => scheduled.push(callback),
    recordResult: result => results.push(result),
  });
  vm.runInContext(scripts + '\nrenderResult = recordResult; newSet("pack", true);', context);
  return { context, scheduled, results };
}

test('winning settles immediately so it cannot affect a later mission', () => {
  const { context, scheduled, results } = packingSession();
  vm.runInContext('endPack(true); stopGame(); newSet("shooter", true);', context);
  for (const callback of scheduled) callback();
  assert.equal(vm.runInContext('GSET.attempts', context), 0);
  assert.equal(context.P.res.czesci, 6);
  assert.equal(results.length, 1);
  assert.equal(results[0].passed, true);
});

test('timing out still records one failed attempt and awards partial score once', () => {
  const { context, results } = packingSession();
  vm.runInContext('endPack(false); endPack(false);', context);
  assert.equal(vm.runInContext('GSET.attempts', context), 1);
  assert.equal(context.P.res.czesci, 2);
  assert.equal(results.length, 1);
  assert.equal(results[0].passed, false);
});
