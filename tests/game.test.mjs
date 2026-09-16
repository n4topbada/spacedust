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
  robotRate,
  settle,
  stageIndex,
  STAGES,
  ROBOTS,
  FINAL_STAGE,
  normalizeName,
  clickPower,
  claimComet,
  cometReward,
  cometDelay,
  decodeSave,
  OFFLINE_CAP,
  milestone,
  toolLevel,
  toolUnlocked,
  DOUBLE_UPGRADES,
  SYNERGIES,
  MANUAL_UPGRADES,
  buyDouble,
  buySynergy,
  buyManual,
  convertDust,
  CONVERSION_PACKAGES,
  STAR_COUNTS,
  STAR_STARTS,
  TOTAL_STARS,
  CONSTELLATION_MAPS,
  starBonusCount,
  constellationMultiplier,
  specialCost,
  conversionTarget,
  paymentPlan,
  buySpecial,
  exchangeGalaxy,
  craftStar,
  starRecipe,
  craftReadiness,
  completedSets,
  openLuckyBox,
} from '../lib/game.ts';
const close = (a, b) =>
  assert.ok(
    Math.abs(a - b) <= Math.max(1e-9, Math.abs(b) * 1e-14),
    `${a} ≈ ${b}`,
  );
const rich = () => earn(freshState(1000), 1e30, 1000);

test('clicks, critical hits, and every increased evolution boundary', () => {
  let s = freshState(1000);
  assert.equal(production(s), 0);
  s = collect(s);
  assert.equal(s.dust, 1);
  s = collect(s, true);
  assert.equal(s.dust, 6);
  assert.equal(s.clicks, 2);
  assert.ok(STAGES[FINAL_STAGE].mass >= 5e17 * 100_000);
  for (let i = 1; i < STAGES.length; i++) {
    assert.equal(
      stageIndex(
        STAGES[i].mass - Math.max(1, STAGES[i].mass * Number.EPSILON * 2),
      ),
      i - 1,
    );
    assert.equal(stageIndex(STAGES[i].mass), i);
    assert.ok(Number.isFinite(clickPower(earn(freshState(), STAGES[i].mass))));
  }
});
test('purchases use exact quoted costs and never reduce growth mass', () => {
  const s = earn(freshState(), 1e5),
    offer = quote(s, 0, 10);
  assert.equal(
    offer.cost,
    Array.from({ length: 10 }, (_, i) => price(0, i)).reduce((a, b) => a + b),
  );
  const bought = buyRobot(s, 0, 10);
  assert.equal(bought.robots[0], 10);
  assert.equal(bought.dust, s.dust - offer.cost);
  assert.equal(bought.mass, s.mass);
  assert.equal(
    buyRobot(earn(freshState(), offer.cost - 1), 0, 10).robots[0],
    0,
  );
  const max = buyRobot(s, 0, 'max');
  assert.ok(max.dust >= 0);
  assert.ok(max.dust < price(0, max.robots[0]));
  assert.deepEqual(buyRobot(s, -1, 1), s);
  assert.deepEqual(buyRobot(s, 0, -10), s);
  assert.deepEqual(buyRobot(s, 0, 1.1), s);
});
test('tool levels require more copies and base output is slightly lower', () => {
  assert.deepEqual(
    [9, 10, 24, 25, 74, 75, 149, 150, 299, 300].map(milestone),
    [1, 1, 1, 2, 2, 4, 4, 8, 8, 16],
  );
  assert.equal(toolLevel(300), 5);
  const old = [0.8, 5, 38, 280, 4000, 65000];
  ROBOTS.slice(0, 6).forEach((r, i) => {
    assert.ok(r.rate < old[i] && r.rate >= old[i] * 0.85);
  });
  assert.equal(ROBOTS[7].name, 'Comet Tail Inceptor');
  ROBOTS.slice(1).forEach((r, i) => {
    assert.ok(r.rate > ROBOTS[i].rate * 4);
    assert.ok(r.base / r.rate > ROBOTS[i].base / ROBOTS[i].rate);
  });
});
test('offline production is capped and cannot be replayed', () => {
  const s = buyRobot(earn(freshState(1000), ROBOTS[0].base), 0, 1);
  close(settle(s, 11000).dust, 7);
  const after = settle(s, 1000 + 86400e3);
  close(after.dust, ROBOTS[0].rate * OFFLINE_CAP);
  assert.deepEqual(settle(after, after.updatedAt), after);
  assert.equal(settle(s, 500).dust, 0);
});
test('28 upgrades: exact doubling, prerequisite, one purchase, and tool-specific effect', () => {
  assert.equal(DOUBLE_UPGRADES.length, 28);
  for (let tool = 0; tool < 14; tool++) {
    let s = rich();
    s.stars = 75;
    s.robots[tool] = 25;
    const baseline = robotRate(s, tool);
    assert.deepEqual(buyDouble(s, tool * 2 + 1), s);
    s = buyDouble(s, tool * 2);
    close(robotRate(s, tool), baseline * 2);
    assert.deepEqual(buyDouble(s, tool * 2), s);
    s = buyDouble(s, tool * 2 + 1);
    close(robotRate(s, tool), baseline * 4);
    assert.ok(
      DOUBLE_UPGRADES[tool * 2 + 1].cost > DOUBLE_UPGRADES[tool * 2].cost,
    );
  }
});
test('all twelve synergies depend on the current supplier count', () => {
  assert.equal(SYNERGIES.length, 12);
  SYNERGIES.forEach((u, i) => {
    let s = rich();
    s.robots[u.source] = u.every * 2;
    s.robots[u.target] = 5;
    const baseline = robotRate(s, u.target);
    s = buySynergy(s, i);
    close(robotRate(s, u.target), baseline * (1 + 2 * u.bonus));
    assert.deepEqual(buySynergy(s, i), s);
    s.robots[u.source] = 0;
    close(robotRate(s, u.target), baseline);
  });
});
test('manual research is expensive, sequential, and stops at three stages', () => {
  let s = rich(),
    before = clickPower(s);
  MANUAL_UPGRADES.forEach((u) => {
    s = buyManual(s);
    close(clickPower(s), before * u.multiplier);
    before = clickPower(s);
  });
  assert.equal(s.manualLevel, 3);
  assert.deepEqual(buyManual(s), s);
  const empty = freshState(1000);
  assert.deepEqual(buyManual(empty), empty);
});
test('comets scale, golden rewards triple, and IDs cannot be claimed twice', () => {
  const s = freshState();
  assert.equal(cometReward(s, false), 40);
  assert.equal(cometReward(s, true), 120);
  const after = claimComet(s, 300, true);
  assert.equal(after.dust, 120);
  assert.equal(after.comets, 1);
  assert.deepEqual(claimComet(after, 300, true), after);
});
test('all four fixed packages pay one common currency in full and preserve mass', () => {
  assert.deepEqual(
    CONVERSION_PACKAGES.map((p) => [p.cost, p.amount]),
    [
      [1000, 1000],
      [4500, 5000],
      [30000, 35000],
      [100000, 120000],
    ],
  );
  for (const [roll, type] of [
    [0, 0],
    [0.249999, 0],
    [0.25, 1],
    [0.5, 2],
    [0.75, 3],
    [0.99999, 3],
  ]) {
    CONVERSION_PACKAGES.forEach((p, i) => {
      const s = earn(freshState(1000), 200000, 1000);
      let n = 0;
      const after = convertDust(s, i, () => (n++ === 0 ? roll : 0.5)).state;
      assert.equal(after.wallet[type], p.amount);
      assert.equal(after.wallet.slice(0, 4).filter((n) => n > 0).length, 1);
      assert.equal(after.mass, s.mass);
      assert.equal(after.dust, s.dust - p.cost);
    });
  }
  const s = freshState(1000);
  for (const id of [-1, 4, 1.5, NaN, 0])
    assert.deepEqual(convertDust(s, id).state, s);
});
test('rare Spacedust is an extra reward and uses an exact 2 percent boundary', () => {
  for (const [chance, expected] of [
    [0.019999, 40],
    [0.02, 0],
  ]) {
    const s = earn(freshState(1000), 100000, 1000);
    let n = 0;
    const rolls = [0.6, chance, 0];
    const after = convertDust(s, 3, () => rolls[n++]).state;
    assert.equal(after.wallet[2], 120000);
    assert.equal(after.wallet[4], expected + 1); // 50K converted milestone
  }
});
test('guaranteed rewards follow dust spent, persist and never repeat', () => {
  let s = earn(freshState(1000), 400000, 1000);
  s = convertDust(s, 3, () => 0.5).state;
  assert.equal(s.convertedDust, 100000);
  assert.equal(s.wallet[4], 1);
  assert.equal(s.conversionMilestones, 1);
  s = convertDust(s, 0, () => 0.5).state;
  assert.equal(s.wallet[4], 1);
  s = convertDust(s, 3, () => 0.5).state;
  assert.equal(s.wallet[4], 2);
  assert.equal(s.conversionMilestones, 2);
  assert.equal(conversionTarget(1), 200000);
  assert.deepEqual(decodeSave(JSON.stringify(s), 1000), s);
});
test('joker payments reserve mandatory Spacedust and substitute exact deficits only with consent', () => {
  const s = freshState();
  s.wallet = [3, 4, 9, 20, 10];
  const p = paymentPlan(s, [5, 6, 10, 10, 3], true);
  assert.deepEqual(p.spent, [3, 4, 9, 10, 8]);
  assert.equal(p.requiredJoker, 3);
  assert.equal(p.substituted, 5);
  assert.ok(p.affordable);
  assert.equal(paymentPlan(s, [5, 6, 10, 10, 3], false).affordable, false);
  assert.equal(paymentPlan(s, [0, 0, 0, 0, 3], false).affordable, true);
  assert.equal(paymentPlan(s, [0, 0, 0, 0, 11], true).affordable, false);
});
test('permanent specials keep exact effects and use prices sized for the new currency quantities', () => {
  const s = freshState();
  s.wallet = [20000, 20000, 20000, 20000, 20000];
  assert.equal(specialCost(s, 0), 5000);
  const star = buySpecial(s, 0);
  close(cometDelay(star, 0.5), cometDelay(s, 0.5) / 1.08);
  const moon = buySpecial(s, 1);
  close(clickPower(moon), clickPower(s) * 1.12);
  assert.equal(cometReward(buySpecial(s, 2), false), 46);
  const joker = { ...s, wallet: [0, 0, 0, 0, 5000] };
  assert.deepEqual(buySpecial(joker, 0), joker);
  assert.equal(buySpecial(joker, 0, true).wallet[4], 0);
  assert.equal(decodeSave(JSON.stringify(moon)).specialLevels[1], 1);
});
test('galaxy trades lose currency and XP grants growth without spendable dust', () => {
  const s = freshState();
  s.wallet = [0, 0, 6000, 0, 0];
  const xp = exchangeGalaxy(s, -1).state;
  assert.equal(xp.dust, 0);
  assert.ok(xp.mass > 0);
  assert.equal(xp.wallet[2], 1000);
  assert.deepEqual(exchangeGalaxy(s, 0).state.wallet, [600, 0, 5000, 0, 0]);
  assert.deepEqual(exchangeGalaxy(s, 4).state, s);
});
function prepared(stars) {
  const s = rich();
  s.stars = stars;
  const r = starRecipe(stars);
  r.tools.forEach((t) => {
    s.robots[t.id] = t.count + 3;
  });
  s.doubles = Array(28).fill(true);
  s.wallet = [...r.currencies];
  return s;
}
test('all 15 diagrams differ, with 3 then 4 then 5 connected stars and valid edges', () => {
  assert.deepEqual(STAR_COUNTS, [3, 3, 3, 3, 3, 4, 4, 4, 4, 4, 5, 5, 5, 5, 5]);
  assert.equal(TOTAL_STARS, 60);
  assert.equal(
    new Set(CONSTELLATION_MAPS.map((c) => JSON.stringify(c))).size,
    15,
  );
  CONSTELLATION_MAPS.forEach((c) => {
    const seen = new Set([0]);
    for (let pass = 0; pass < c.points.length; pass++)
      c.edges.forEach(([a, b]) => {
        assert.ok(c.points[a] && c.points[b]);
        if (seen.has(a) || seen.has(b)) {
          seen.add(a);
          seen.add(b);
        }
      });
    assert.equal(seen.size, c.points.length);
  });
});
test('all 60 recipes consume exactly their materials, preserve research and have no circular tool locks', () => {
  for (let star = 0; star < TOTAL_STARS; star++) {
    const s = prepared(star),
      r = starRecipe(star),
      before = structuredClone(s);
    r.tools.forEach((t) => assert.ok(toolUnlocked(s, t.id)));
    assert.equal(r.upgrade, null);
    if (r.set < 5) {
      assert.ok(r.tools.every((t) => t.id < 5));
      assert.deepEqual(r.currencies, [0, 0, 0, 0, 0]);
    }
    if (r.set >= 10) assert.ok(r.currencies.every((n) => n > 0));
    assert.ok(craftReadiness(s).available);
    const after = craftStar(s).state;
    assert.deepEqual(s, before);
    assert.equal(after.stars, star + 1);
    r.tools.forEach((t) => assert.equal(after.robots[t.id], 3));
    assert.deepEqual(after.doubles, s.doubles);
    assert.deepEqual(after.wallet, [0, 0, 0, 0, 0]);
    assert.equal(
      after.luckyBoxes,
      completedSets(after) > completedSets(s) ? 1 : 0,
    );
    assert.ok(decodeSave(JSON.stringify(after)));
    const insufficient = structuredClone(s);
    insufficient.robots[r.tools[0].id] = 0;
    assert.deepEqual(craftStar(insufficient).state, insufficient);
  }
  const s = { ...prepared(0), mass: 1e6, dust: 1e6 },
    r = starRecipe(0),
    after = craftStar(s).state;
  close(after.dust, s.dust - r.dust);
  close(after.mass, s.mass + r.mass);
  assert.deepEqual(craftStar({ ...rich(), stars: TOTAL_STARS }).state, {
    ...rich(),
    stars: TOTAL_STARS,
  });
});
test('late recipes cannot replace their mandatory wildcard, while ordinary shortages can use extra wildcard', () => {
  const s = prepared(STAR_STARTS[10]),
    r = starRecipe(s.stars);
  const missing = { ...s, wallet: [...s.wallet] };
  missing.wallet[4] = r.currencies[4] - 1;
  assert.deepEqual(craftStar(missing, true).state, missing);
  const wildcard = {
    ...s,
    wallet: [0, 0, 0, 0, r.currencies.reduce((a, b) => a + b)],
  };
  assert.deepEqual(craftStar(wildcard).state, wildcard);
  const after = craftStar(wildcard, true).state;
  assert.equal(after.stars, s.stars + 1);
  assert.equal(after.wallet[4], 0);
});
test('the final tools still unlock at 5, 10 and 15 complete sets, independent of mass', () => {
  for (const [tool, stars] of [
    [11, 15],
    [12, 35],
    [13, 60],
  ]) {
    const locked = { ...rich(), stars: stars - 1 };
    assert.equal(toolUnlocked(locked, tool), false);
    const after = craftStar(prepared(stars - 1)).state;
    assert.equal(toolUnlocked(after, tool), true);
    assert.equal(buyRobot(after, tool, 1).robots[tool], after.robots[tool] + 1);
    assert.equal(toolUnlocked({ ...freshState(), stars }, tool), true);
  }
});
test('every v3 star count migrates once without losing completed sets, permanent bonuses or lucky boxes', () => {
  for (let stars = 0; stars <= 75; stars++) {
    const old = {
      ...freshState(1000),
      version: 3,
      stars,
      luckyBoxes: Math.floor(stars / 5),
      specialLevels: [1, 2, 3],
      wallet: [10, 20, 30, 40, 5],
    };
    delete old.legacyStarCredit;
    const migrated = decodeSave(JSON.stringify(old), 1000);
    assert.ok(migrated);
    assert.equal(migrated.version, 4);
    assert.equal(completedSets(migrated), Math.floor(stars / 5));
    assert.equal(starBonusCount(migrated), stars);
    close(
      constellationMultiplier(migrated),
      (1 + stars * 0.02) * 1.18 ** Math.floor(stars / 5),
    );
    assert.equal(migrated.luckyBoxes, old.luckyBoxes);
    assert.deepEqual(migrated.wallet, old.wallet);
    assert.deepEqual(migrated.specialLevels, old.specialLevels);
    assert.deepEqual(decodeSave(JSON.stringify(migrated), 1000), migrated);
  }
});
test('lucky boxes persist and each box can be opened only once', () => {
  for (const roll of [0.1, 0.7, 0.9, 0.999]) {
    const s = { ...freshState(), stars: 3, luckyBoxes: 1 };
    const after = openLuckyBox(s, () => roll).state;
    assert.equal(after.luckyBoxes, 0);
    assert.equal(after.boxesOpened, 1);
    assert.deepEqual(openLuckyBox(after).state, after);
    assert.ok(decodeSave(JSON.stringify(after)));
  }
});
test('both legacy save versions refund removed upgrades once and preserve owned tools', () => {
  for (const version of [1, 2]) {
    const old = {
      ...freshState(1000),
      version,
      name: '기존 우주',
      dust: 10000,
      mass: 20000,
      robots:
        version === 1
          ? [14, 3, 5, 2, 1, 1]
          : [14, 3, 5, 2, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0],
      clickLevel: 2,
      aiLevel: 1,
    };
    const migrated = decodeSave(JSON.stringify(old), 1000);
    assert.equal(migrated.version, 4);
    assert.equal(migrated.legacyRefund, 40 + 104 + 1200);
    assert.equal(migrated.dust, 11344);
    assert.equal(migrated.mass, 20000);
    assert.deepEqual(migrated.robots.slice(0, old.robots.length), old.robots);
    assert.equal(migrated.name, old.name);
    assert.deepEqual(decodeSave(JSON.stringify(migrated), 1000), migrated);
    assert.equal(migrated.manualLevel, 0);
    assert.equal(migrated.doubles.filter(Boolean).length, 0);
  }
});
test('new save rejects malformed, impossible, non-finite, and out-of-range progression', () => {
  const s = freshState(1000);
  assert.deepEqual(decodeSave(JSON.stringify(s), 1000), s);
  for (const patch of [
    { stars: 61 },
    { legacyStarCredit: 16 },
    { stars: -1 },
    { manualLevel: 4 },
    { wallet: [1, 2, 3, 4] },
    { wallet: [0, 0, -1, 0, 0] },
    { specialLevels: [9, 0, 0] },
    { doubles: [true] },
    { synergies: [false] },
    { luckyBoxes: 1 },
    { stars: 5, luckyBoxes: 1, boxesOpened: 1 },
    { conversionMilestones: 1 },
    { dust: 10 },
    { mass: null },
  ])
    assert.equal(decodeSave(JSON.stringify({ ...s, ...patch })), null);
  for (const raw of ['{bad', 'null', '{}']) assert.equal(decodeSave(raw), null);
});
test('black hole is not the end; final completion is recorded once and remains playable', () => {
  const blackHole = earn(freshState(1000), STAGES[7].mass, 1500);
  assert.equal(blackHole.completedAt, null);
  const final = earn(
    blackHole,
    STAGES[FINAL_STAGE].mass - blackHole.mass,
    2000,
  );
  assert.equal(final.completedAt, 2000);
  assert.equal(earn(final, 1e20, 3000).completedAt, 2000);
  assert.deepEqual(decodeSave(JSON.stringify(final), 2000), final);
  assert.equal(normalizeName('  바다의 우주  '), '바다의 우주');
  assert.equal(normalizeName('\n\u0000'), 'My Universe');
  assert.equal(Array.from(normalizeName('🌌'.repeat(30))).length, 24);
});
