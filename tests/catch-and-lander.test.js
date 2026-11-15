'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const config = fs.readFileSync(path.join(__dirname, '../js/01-config.js'), 'utf8');
const minigames = fs.readFileSync(path.join(__dirname, '../js/13-minigames.js'), 'utf8');

function setup(random = () => .13) {
  const finished = [];
  const context = vm.createContext({
    Math: Object.assign(Object.create(Math), { random }),
    P: { diff: 'hard' },
    document: { querySelector: () => null },
    addEventListener() {},
    requestAnimationFrame() {},
    finishGame(key, score) { finished.push({ key, score }); },
  });
  const run = code => vm.runInContext(code, context);
  run(config);
  run(minigames);
  run('draw = () => {}');
  return { run, finished };
}

test('catch covers all five lanes in each group and breaks hazard streaks', () => {
  const { run } = setup();
  const spawns = run(`
    G = { W: 430, H: 600, p: GP.hard.catch, t: 0, score: 0, lives: 3,
          items: [], catchSpawn: { lanes: [], lastLane: -1, hazards: 0, nextAt: 0 } };
    Array.from({ length: 30 }, () => {
      G.t = G.catchSpawn.nextAt;
      updCatch(0, 0);
      const item = G.items.at(-1);
      return { lane: Math.floor((item.x - 30) / 74), bad: item.bad,
               gap: G.catchSpawn.nextAt - G.t };
    });
  `);
  for (let i = 0; i < spawns.length; i += 5) {
    assert.equal(new Set(spawns.slice(i, i + 5).map(spawn => spawn.lane)).size, 5);
  }
  assert.ok(spawns.some(spawn => spawn.bad));
  for (const [i, spawn] of spawns.entries()) {
    assert.notEqual(spawn.lane, spawns[i - 1]?.lane);
    assert.ok(!(spawn.bad && spawns[i - 1]?.bad && spawns[i - 2]?.bad));
    assert.ok(spawn.gap >= .3 && spawn.gap <= .43 * 1.1);
  }
});

test('the lander loop submits a passing score on the first safe landing', () => {
  const { run, finished } = setup();
  for (const diff of ['easy', 'mid', 'hard']) {
    run(`
      P.diff = ${JSON.stringify(diff)};
      G = { key: 'lander', H: 600, p: GP[P.diff].lander, started: true,
            last: 1000, t: 3, limit: 40, over: false, score: 0, msgT: 0,
            sx: 215, sy: 529.9, svy: 25, tx: 215, pad: 215, hold: false };
      loop(1016);
    `);
    const result = finished.at(-1);
    assert.deepEqual(result, { key: 'lander', score: 4 });
    assert.equal(run('GOAL[P.diff].lander'), result.score);
    assert.equal(run("goalText('lander')"), '1 lądowanie');
  }
  assert.equal(finished.length, 3);
});

test('a missed or hard landing leaves time for another attempt', () => {
  const { run, finished } = setup();
  for (const [pad, speed, message] of [[120, 25, 'Obok pasa!'], [215, 90, 'Za szybko!']]) {
    run(`
      G = { key: 'lander', H: 600, p: GP.hard.lander, started: true,
            last: 1000, t: 3, limit: 40, over: false, score: 0, msgT: 0,
            sx: 215, sy: 529.9, svy: ${speed}, tx: 215, pad: ${pad}, hold: false };
      loop(1016);
    `);
    assert.equal(run('G.msg'), message);
    assert.equal(run('G.over'), false);
    run('updLander(0, 1.2)');
    assert.equal(run('G.sy'), 50);
    assert.equal(run('G.score'), 0);
  }
  assert.equal(finished.length, 0);
});
