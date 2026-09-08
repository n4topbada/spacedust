import test from 'node:test';
import assert from 'node:assert/strict';
import {
  freshState,
  earn,
  collect,
  buyRobot,
  quote,
  price,
  production,
  settle,
  stageIndex,
  STAGES,
  upgrade,
  clickPower,
  claimComet,
  cometReward,
  decodeSave,
  OFFLINE_CAP,
  milestone,
} from '../lib/game.ts';

test('new universe, clicking, critical reward, and evolution boundaries', () => {
  let s = freshState(1000);
  assert.equal(s.mass, 0);
  assert.equal(production(s), 0);
  s = collect(s);
  assert.equal(s.dust, 1);
  assert.equal(s.clicks, 1);
  s = collect(s, true);
  assert.equal(s.dust, 6);
  for (let i = 1; i < STAGES.length; i++) {
    assert.equal(stageIndex(STAGES[i].mass - 1), i - 1);
    assert.equal(stageIndex(STAGES[i].mass), i);
  }
});
test('buying spends currency but never reduces accumulated mass or evolution', () => {
  let s = earn(freshState(1000), 90);
  s = buyRobot(s, 0, 1);
  assert.equal(s.dust, 65);
  assert.equal(s.mass, 90);
  assert.equal(stageIndex(s.mass), 1);
  assert.equal(s.robots[0], 1);
  assert.equal(buyRobot(freshState(), 0, 1).robots[0], 0);
  assert.equal(buyRobot(earn(freshState(), 500), 2, 1).robots[2], 0);
});
test('bulk and maximum purchases charge rounded per-unit prices exactly', () => {
  const s = earn(freshState(), 1000),
    q = quote(s, 0, 10);
  assert.equal(
    q.cost,
    Array.from({ length: 10 }, (_, i) => price(0, i)).reduce(
      (a, b) => a + b,
      0,
    ),
  );
  const max = buyRobot(s, 0, 'max');
  assert.ok(max.robots[0] > 0);
  assert.ok(max.dust >= 0);
  assert.ok(max.dust < price(0, max.robots[0]));
  assert.equal(buyRobot(earn(freshState(), q.cost - 1), 0, 10).robots[0], 0);
});
test('elapsed time, 8 hour offline cap, and replay prevention', () => {
  const s = buyRobot(earn(freshState(1000), 25), 0, 1);
  assert.equal(settle(s, 11000).dust, 8);
  const resumed = settle(s, 1000 + 24 * 3600 * 1000);
  assert.equal(resumed.dust, 0.8 * OFFLINE_CAP);
  assert.deepEqual(settle(resumed, resumed.updatedAt), resumed);
  assert.equal(settle(s, 500).dust, 0);
});
test('robot milestones and SF upgrades actually improve production', () => {
  assert.deepEqual([9, 10, 24, 25, 49, 50].map(milestone), [1, 2, 2, 4, 4, 8]);
  let s = earn(freshState(), 2000);
  s = buyRobot(s, 0, 1);
  const before = clickPower(s);
  s = upgrade(s, 'click');
  assert.equal(clickPower(s), before * 1.75);
  const oldRate = production(s);
  s = upgrade(s, 'ai');
  assert.equal(production(s), oldRate * 1.5);
});
test('comet reward scales, golden comets triple rewards, and double claim is ignored', () => {
  const s = freshState(),
    normal = cometReward(s, false),
    rare = cometReward(s, true);
  assert.equal(normal, 40);
  assert.equal(rare, normal * 3);
  const claimed = claimComet(s, 300, true);
  assert.equal(claimed.dust, 120);
  assert.equal(claimed.comets, 1);
  assert.deepEqual(claimComet(claimed, 300, true), claimed);
  assert.ok(cometReward(earn(s, 2e6), false) > normal);
});
test('save validation rejects broken saves and preserves valid progress', () => {
  const s = buyRobot(earn(freshState(1000), 2000), 0, 10);
  assert.deepEqual(decodeSave(JSON.stringify(s), 1000), s);
  for (const raw of [
    '{bad',
    'null',
    '{}',
    JSON.stringify({ ...s, mass: -1 }),
    JSON.stringify({ ...s, robots: [1] }),
    JSON.stringify({ ...s, dust: 9e9 }),
    JSON.stringify({ ...s, clickLevel: 900 }),
  ])
    assert.equal(decodeSave(raw), null);
});
test('black hole completes once and remains playable', () => {
  const s = earn(freshState(1000), STAGES[7].mass, 2000);
  assert.equal(stageIndex(s.mass), 7);
  assert.equal(s.completedAt, 2000);
  const more = collect(s);
  assert.ok(more.mass > s.mass);
  assert.equal(more.completedAt, 2000);
});
