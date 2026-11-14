'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const scripts = ['05-questions.js', '11-trail.js']
  .map(file => fs.readFileSync(path.join(__dirname, '..', 'js', file), 'utf8'))
  .join('\n');

const completed = [1, 2, 3, 4, 5, 6];

function nextMission(diff, done) {
  const context = vm.createContext({ P: { diff, done } });
  vm.runInContext(scripts, context);
  return JSON.parse(vm.runInContext(`
    const { tier, m, promote } = nextTarget();
    JSON.stringify({ tier, mission: m?.id ?? null, promote });
  `, context));
}

test('finishing Easy skips a Medium tier that was completed earlier', () => {
  assert.deepEqual(nextMission('easy', { easy: completed, mid: completed, hard: [1] }),
    { tier: 'hard', mission: 2, promote: true });
});

test('finishing Easy still promotes to the next unfinished Medium mission', () => {
  assert.deepEqual(nextMission('easy', { easy: completed, mid: [1, 2], hard: [] }),
    { tier: 'mid', mission: 3, promote: true });
});

test('an unfinished current tier keeps its next mission', () => {
  assert.deepEqual(nextMission('mid', { easy: completed, mid: [1, 2], hard: [] }),
    { tier: 'mid', mission: 3, promote: false });
});

test('finishing Hard returns to unfinished lower-tier missions', () => {
  assert.deepEqual(nextMission('hard', { easy: [1, 2], mid: [], hard: completed }),
    { tier: 'easy', mission: 3, promote: false });
});

test('completing all tiers leaves no automatically selected mission', () => {
  assert.deepEqual(nextMission('easy', { easy: completed, mid: completed, hard: completed }),
    { tier: 'easy', mission: null, promote: false });
});
