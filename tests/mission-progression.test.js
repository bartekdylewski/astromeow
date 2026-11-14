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
    const { tier, m, promote, replay } = nextTarget();
    JSON.stringify({ tier, mission: m.id, promote: Boolean(promote), replay: Boolean(replay) });
  `, context));
}

test('finishing Easy skips a Medium tier that was completed earlier', () => {
  assert.deepEqual(nextMission('easy', { easy: completed, mid: completed, hard: [1] }),
    { tier: 'hard', mission: 2, promote: true, replay: false });
});

test('finishing Easy still promotes to the next unfinished Medium mission', () => {
  assert.deepEqual(nextMission('easy', { easy: completed, mid: [1, 2], hard: [] }),
    { tier: 'mid', mission: 3, promote: true, replay: false });
});

test('an unfinished current tier keeps its next mission', () => {
  assert.deepEqual(nextMission('mid', { easy: completed, mid: [1, 2], hard: [] }),
    { tier: 'mid', mission: 3, promote: false, replay: false });
});

test('when no higher tier has missions left, the current tier offers a replay', () => {
  assert.deepEqual(nextMission('easy', { easy: completed, mid: completed, hard: completed }),
    { tier: 'easy', mission: 1, promote: false, replay: true });
});
