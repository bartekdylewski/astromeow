'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '..', 'js', '13-minigames.js'), 'utf8');

function flight(y, pipeX) {
  const G = {
    W: 430, H: 600, y, vy: 0, p: { sp: 2.2, spawn: 1800 },
    pipes: [{ x: pipeX, gapY: 300, gap: 245, passed: false }],
    score: 0, over: false, lastSpawn: 1000,
  };
  const context = vm.createContext({ G, addEventListener() {} });
  vm.runInContext(source, context);
  return { G, step: () => vm.runInContext('updFlappy(1000, 1 / 60)', context) };
}

test('crashing just after crossing the center of an asteroid pair grants no point', () => {
  const { G, step } = flight(140, 111);
  step();
  assert.equal(G.over, true);
  assert.equal(G.score, 0);
});

test('a successful pass grants one point after clearing the collision area', () => {
  const { G, step } = flight(300, 74.5);
  step();
  assert.equal(G.score, 0);
  step();
  assert.equal(G.score, 1);
  step();
  assert.equal(G.score, 1);
  assert.equal(G.over, false);
});
