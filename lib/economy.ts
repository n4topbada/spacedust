import { STAGES, FINAL_STAGE, ROBOTS, CLICK_BASE } from './catalog.ts';
import {
  STAR_COUNTS,
  STAR_STARTS,
  TOTAL_STARS,
  constellationProgress,
} from './constellations.ts';
export {
  CONSTELLATION_MAPS,
  STAR_COUNTS,
  STAR_STARTS,
  TOTAL_STARS,
  constellationProgress,
} from './constellations.ts';
export { STAGES, FINAL_STAGE, ROBOTS, RANKS } from './catalog.ts';
export const SAVE_KEY = 'spacedust.save.v1';
export const BACKUP_KEY = 'spacedust.save.before-constellations';
export const WORKSHOP_BACKUP_KEY = 'spacedust.save.before-workshop';
export const OFFLINE_CAP = 8 * 60 * 60;
export const MAX_VALUE = 1e200;
export const TOOL_LEVELS = [0, 25, 75, 150, 300];
export const MAX_TOOLS = 500;
export const CURRENCIES = [
  {
    name: 'Stardust',
    label: 'Star shards',
    color: '#ffc974',
    purpose: 'Comet frequency',
  },
  {
    name: 'Moondust',
    label: 'Lunar shards',
    color: '#a5ccff',
    purpose: 'Click power',
  },
  {
    name: 'Galaxydust',
    label: 'Galaxy shards',
    color: '#c5a5ff',
    purpose: 'Growth & exchange',
  },
  {
    name: 'Solardust',
    label: 'Solar shards',
    color: '#ff9a78',
    purpose: 'Comet rewards',
  },
  {
    name: 'Spacedust',
    label: 'Wildcard',
    color: '#8eedd1',
    purpose: 'Substitute missing currencies',
  },
] as const;
export const CONSTELLATIONS = [
  'Voyager Compass',
  'Lunar Cradle',
  'Meteor Arrow',
  'Solar Crown',
  'Nebula Wings',
  'Gravity Ring',
  'Starlight Passage',
  'Comet Sail',
  'Galactic Spiral',
  'Spacetime Gate',
  'Dark Beacon',
  'Genesis Wave',
  'Infinity Bridge',
  'Cosmic Heart',
  'Eternal Constellation',
];
const UPGRADE_NAMES = [
  ['Electrostatic Grip', 'Quantum Tweezers'],
  ['Compression Bay', 'Dimensional Pouch'],
  ['Ion Intake', 'Vacuum Turbine'],
  ['Thermal Probe', 'Corona Collector'],
  ['Vortex Condenser', 'Gravity Cyclone'],
  ['Photon Net', 'Spectral Array'],
  ['Nebula Filter', 'Gas Compression Field'],
  ['Orbital Tracker', 'Comet Tail Stitcher'],
  ['Jet Conduit', 'Quasar Resonance'],
  ['Dark Probe', 'Vacuum Extractor'],
  ['Gravity Thread', 'Spacetime Stitch'],
  ['Galactic Channel', 'Supergalactic Intake'],
  ['Primordial Vibration', 'Genesis Resonance'],
  ['Cosmic Circulation', 'Eternal Rebirth'],
];
export const DOUBLE_UPGRADES = ROBOTS.flatMap((tool, i) =>
  UPGRADE_NAMES[i].map((name, tier) => ({
    id: i * 2 + tier,
    tool: i,
    tier,
    name,
    cost: tool.base * (tier === 0 ? 35 : 420),
    required: tier === 0 ? 8 : 25,
  })),
);
const LINKS = [
  'Precision Packing',
  'Sealed Collection',
  'Particle Refining',
  'Solar Wind Cycle',
  'Starlight Vortex',
  'Nebula Network',
  'Nebular Cometway',
  'Comet Jet Link',
  'Quasar Darkfield',
  'Dark Weaving',
  'Galactic Array',
  'Genesis Cycle',
];
export const SYNERGIES = LINKS.map((name, i) => {
  const source = i === 11 ? 12 : i;
  return {
    name,
    source,
    target: source + 1,
    every: i % 2 ? 10 : 5,
    bonus: i % 2 ? 0.06 : 0.04,
    cost: ROBOTS[source + 1].base * 60,
  };
});
export const MANUAL_UPGRADES = [
  { name: 'Gravity Wave Control', cost: 150_000, multiplier: 1.6 },
  { name: 'Stellar Pressure', cost: 8e9, multiplier: 1.7 },
  { name: 'Galactic Touch', cost: 2e16, multiplier: 1.8 },
];
export const SPECIALS = [
  {
    name: 'Stellar Signal',
    currency: 0,
    max: 8,
    step: 0.08,
    detail: 'Comet frequency',
  },
  {
    name: 'Lunar Attraction',
    currency: 1,
    max: 12,
    step: 0.12,
    detail: 'Click power',
  },
  {
    name: 'Solar Blessing',
    currency: 3,
    max: 10,
    step: 0.15,
    detail: 'Comet rewards',
  },
];
export type GameState = {
  version: 4;
  name: string;
  dust: number;
  mass: number;
  robots: number[];
  doubles: boolean[];
  synergies: boolean[];
  manualLevel: number;
  wallet: number[];
  specialLevels: number[];
  stars: number;
  legacyStarCredit: number;
  convertedDust: number;
  conversionMilestones: number;
  luckyBoxes: number;
  boxesOpened: number;
  legacyRefund: number;
  clicks: number;
  comets: number;
  playSeconds: number;
  updatedAt: number;
  startedAt: number;
  lastCometId: number;
  sound: boolean;
  reducedMotion: boolean;
  completedAt: number | null;
};
export function freshState(now = Date.now()): GameState {
  return {
    version: 4,
    name: 'My Universe',
    dust: 0,
    mass: 0,
    robots: ROBOTS.map(() => 0),
    doubles: Array(28).fill(false),
    synergies: Array(12).fill(false),
    manualLevel: 0,
    wallet: [0, 0, 0, 0, 0],
    specialLevels: [0, 0, 0],
    stars: 0,
    legacyStarCredit: 0,
    convertedDust: 0,
    conversionMilestones: 0,
    luckyBoxes: 0,
    boxesOpened: 0,
    legacyRefund: 0,
    clicks: 0,
    comets: 0,
    playSeconds: 0,
    updatedAt: now,
    startedAt: now,
    lastCometId: 0,
    sound: false,
    reducedMotion: false,
    completedAt: null,
  };
}
export function stageIndex(mass: number) {
  let index = 0;
  STAGES.forEach((s, i) => {
    if (mass >= s.mass) index = i;
  });
  return index;
}
export function completedSets(s: GameState) {
  return constellationProgress(s.stars).completed;
}
export function starBonusCount(s: GameState) {
  return s.stars + (s.legacyStarCredit ?? 0);
}
export function toolLevel(count: number) {
  return TOOL_LEVELS.filter((n) => count >= n).length;
}
export function milestone(count: number) {
  return 2 ** (toolLevel(count) - 1);
}
export function toolUnlocked(s: GameState, index: number) {
  return (
    !!ROBOTS[index] &&
    (index < 11
      ? s.mass >= ROBOTS[index].unlock
      : completedSets(s) >= (index - 10) * 5)
  );
}
export function toolUnlockLabel(index: number) {
  return index < 11
    ? `${format(ROBOTS[index].unlock)} mass`
    : `${(index - 10) * 5} completed constellations`;
}
export function constellationMultiplier(s: GameState) {
  return (1 + starBonusCount(s) * 0.02) * 1.18 ** completedSets(s);
}
export function robotRate(s: GameState, index: number) {
  let multiplier = 1;
  if (s.doubles[index * 2]) multiplier *= 2;
  if (s.doubles[index * 2 + 1]) multiplier *= 2;
  SYNERGIES.forEach((link, i) => {
    if (link.target === index && s.synergies[i])
      multiplier *=
        1 +
        Math.min(
          3,
          Math.floor(s.robots[link.source] / link.every) * link.bonus,
        );
  });
  return (
    ROBOTS[index].rate *
    s.robots[index] *
    milestone(s.robots[index]) *
    multiplier *
    constellationMultiplier(s)
  );
}
export function production(s: GameState) {
  return ROBOTS.reduce((sum, _, i) => sum + robotRate(s, i), 0);
}
export function clickPower(s: GameState) {
  const manual = MANUAL_UPGRADES.slice(0, s.manualLevel).reduce(
    (m, u) => m * u.multiplier,
    1,
  );
  return (
    (CLICK_BASE[stageIndex(s.mass)] + production(s) * 0.025) *
    manual *
    (1 + s.specialLevels[1] * 0.12) *
    (1 + starBonusCount(s) * 0.01)
  );
}
export function gainMass(
  s: GameState,
  amount: number,
  now = Date.now(),
): GameState {
  if (!Number.isFinite(amount) || amount < 0) return s;
  const mass = Math.min(MAX_VALUE, s.mass + amount);
  return {
    ...s,
    mass,
    completedAt:
      mass >= STAGES[FINAL_STAGE].mass ? (s.completedAt ?? now) : null,
  };
}
export function earn(
  s: GameState,
  amount: number,
  now = Date.now(),
): GameState {
  if (!Number.isFinite(amount) || amount < 0) return s;
  return {
    ...gainMass(s, amount, now),
    dust: Math.min(MAX_VALUE, s.dust + amount),
  };
}
export function settle(s: GameState, now = Date.now()): GameState {
  const seconds = Math.min(
    OFFLINE_CAP,
    Math.max(0, (now - s.updatedAt) / 1000),
  );
  return {
    ...earn(s, production(s) * seconds, now),
    playSeconds: s.playSeconds + seconds,
    updatedAt: Math.max(s.updatedAt, now),
  };
}
export function collect(s: GameState, critical = false): GameState {
  return {
    ...earn(s, clickPower(s) * (critical ? 5 : 1)),
    clicks: s.clicks + 1,
  };
}
export function price(index: number, owned: number) {
  return Math.ceil(ROBOTS[index].base * 1.185 ** owned);
}
export function quote(s: GameState, index: number, quantity: number | 'max') {
  if (
    !ROBOTS[index] ||
    (quantity !== 'max' && (!Number.isInteger(quantity) || quantity < 1))
  )
    return { cost: 0, count: 0 };
  let cost = 0,
    count = 0;
  const limit =
    quantity === 'max'
      ? MAX_TOOLS - s.robots[index]
      : Math.min(quantity, MAX_TOOLS - s.robots[index]);
  for (; count < limit; count++) {
    const next = price(index, s.robots[index] + count);
    if (quantity === 'max' && cost + next > s.dust) break;
    cost += next;
  }
  return { cost, count };
}
export function buyRobot(
  s: GameState,
  index: number,
  quantity: number | 'max',
): GameState {
  if (!toolUnlocked(s, index)) return s;
  const { cost, count } = quote(s, index, quantity);
  if (!count || cost > s.dust) return s;
  return {
    ...s,
    dust: Math.max(0, s.dust - cost),
    robots: s.robots.map((n, i) => n + (i === index ? count : 0)),
  };
}
export function canBuyDouble(s: GameState, id: number) {
  const u = DOUBLE_UPGRADES[id];
  return (
    !!u &&
    !s.doubles[id] &&
    toolUnlocked(s, u.tool) &&
    s.robots[u.tool] >= u.required &&
    (u.tier === 0 || s.doubles[id - 1]) &&
    s.dust >= u.cost
  );
}
export function buyDouble(s: GameState, id: number): GameState {
  return canBuyDouble(s, id)
    ? {
        ...s,
        dust: s.dust - DOUBLE_UPGRADES[id].cost,
        doubles: s.doubles.map((b, i) => b || i === id),
      }
    : s;
}
export function canBuySynergy(s: GameState, id: number) {
  const u = SYNERGIES[id];
  return (
    !!u &&
    !s.synergies[id] &&
    s.robots[u.source] >= 5 &&
    s.robots[u.target] >= 5 &&
    s.dust >= u.cost
  );
}
export function buySynergy(s: GameState, id: number): GameState {
  return canBuySynergy(s, id)
    ? {
        ...s,
        dust: s.dust - SYNERGIES[id].cost,
        synergies: s.synergies.map((b, i) => b || i === id),
      }
    : s;
}
export function buyManual(s: GameState): GameState {
  const u = MANUAL_UPGRADES[s.manualLevel];
  return u && s.dust >= u.cost
    ? { ...s, dust: s.dust - u.cost, manualLevel: s.manualLevel + 1 }
    : s;
}
const clampRandom = (n: number) =>
  Math.max(0, Math.min(0.999999999, Number.isFinite(n) ? n : 0));
export function cometDelay(s: GameState, random = Math.random()) {
  return (
    (40_000 + clampRandom(random) * 35_000) / (1 + s.specialLevels[0] * 0.08)
  );
}
export function cometReward(s: GameState, rare: boolean) {
  return Math.ceil(
    Math.max(40, clickPower(s) * 25, production(s) * 45) *
      (rare ? 3 : 1) *
      (1 + s.specialLevels[2] * 0.15),
  );
}
export function claimComet(s: GameState, id: number, rare: boolean): GameState {
  return !Number.isFinite(id) || id <= s.lastCometId
    ? s
    : {
        ...earn(s, cometReward(s, rare)),
        comets: s.comets + 1,
        lastCometId: id,
      };
}
export type Outcome = { state: GameState; message: string };
export type GameAction =
  | { type: 'double' | 'synergy'; id: number }
  | { type: 'manual' | 'box' }
  | { type: 'special'; id: number; useJoker: boolean }
  | { type: 'convert'; packageId: number }
  | { type: 'exchange'; target: number }
  | { type: 'craft'; useJoker: boolean };
export function performAction(s: GameState, action: GameAction): Outcome {
  if (action.type === 'convert') return convertDust(s, action.packageId);
  if (action.type === 'exchange') return exchangeGalaxy(s, action.target);
  if (action.type === 'craft') return craftStar(s, action.useJoker);
  if (action.type === 'box') return openLuckyBox(s);
  const after =
    action.type === 'double'
      ? buyDouble(s, action.id)
      : action.type === 'synergy'
        ? buySynergy(s, action.id)
        : action.type === 'special'
          ? buySpecial(s, action.id, action.useJoker)
          : buyManual(s);
  const name =
    action.type === 'double'
      ? DOUBLE_UPGRADES[action.id]?.name
      : action.type === 'synergy'
        ? SYNERGIES[action.id]?.name
        : action.type === 'special'
          ? SPECIALS[action.id]?.name
          : MANUAL_UPGRADES[s.manualLevel]?.name;
  return {
    state: after,
    message:
      after === s
        ? 'Not enough materials, or requirements not met.'
        : `${name} applied${action.type === 'double' ? ' · Tool output ×2' : ''}`,
  };
}
export const CONVERSION_PACKAGES = [
  { cost: 1_000, amount: 1_000, joker: 1 },
  { cost: 4_500, amount: 5_000, joker: 3 },
  { cost: 30_000, amount: 35_000, joker: 12 },
  { cost: 100_000, amount: 120_000, joker: 40 },
] as const;
export const GALAXY_GROWTH_COST = 5_000;
export const GALAXY_EXCHANGE_COST = 1_000;
export const GALAXY_EXCHANGE_YIELD = 600;
export function conversionTarget(index: number) {
  return 50_000 * 4 ** index;
}
export function convertDust(
  s: GameState,
  packageId: number,
  random: () => number = Math.random,
): Outcome {
  const pack = Number.isInteger(packageId)
    ? CONVERSION_PACKAGES[packageId]
    : undefined;
  if (!pack) return { state: s, message: 'Choose a conversion package.' };
  if (s.dust < pack.cost || s.convertedDust + pack.cost > MAX_VALUE)
    return { state: s, message: 'Not enough dust to convert.' };
  const wallet = [...s.wallet],
    gains = [0, 0, 0, 0, 0],
    type = Math.floor(clampRandom(random()) * 4);
  if (wallet[type] + pack.amount > 1e9)
    return {
      state: s,
      message: 'Currency storage is full. Spend some before converting.',
    };
  gains[type] = pack.amount;
  if (clampRandom(random()) < 0.02)
    gains[4] =
      pack.joker + Math.floor(clampRandom(random()) * (pack.joker + 1));
  const convertedDust = s.convertedDust + pack.cost;
  let milestones = s.conversionMilestones,
    guaranteed = 0;
  while (milestones < 325 && convertedDust >= conversionTarget(milestones)) {
    guaranteed += 1 + Math.floor(milestones / 4);
    milestones++;
  }
  gains[4] += guaranteed;
  gains.forEach((n, i) => {
    wallet[i] = Math.min(1e9, wallet[i] + n);
  });
  return {
    state: {
      ...s,
      dust: s.dust - pack.cost,
      wallet,
      convertedDust,
      conversionMilestones: milestones,
    },
    message:
      gains
        .map((n, i) => (n ? CURRENCIES[i].name + ' +' + format(n) : ''))
        .filter(Boolean)
        .join(' · ') +
      (guaranteed ? ' (includes ' + guaranteed + ' guaranteed Spacedust)' : ''),
  };
}
export function paymentPlan(s: GameState, costs: number[], useJoker: boolean) {
  const requiredJoker = costs[4] ?? 0;
  const spent = [0, 0, 0, 0, requiredJoker];
  for (let i = 0; i < 4; i++) {
    spent[i] = Math.min(s.wallet[i], costs[i] ?? 0);
    spent[4] += (costs[i] ?? 0) - spent[i];
  }
  return {
    spent,
    affordable:
      (spent[4] === requiredJoker || useJoker) && s.wallet[4] >= spent[4],
    requiredJoker,
    substituted: spent[4] - requiredJoker,
  };
}
function payWallet(s: GameState, spent: number[]) {
  return s.wallet.map((n, i) => n - spent[i]);
}
export function specialCost(s: GameState, index: number) {
  return Math.ceil(5_000 * 2.2 ** s.specialLevels[index]);
}
export function specialRequirements(s: GameState, index: number) {
  return CURRENCIES.slice(0, 4).map((_, i) =>
    i === SPECIALS[index].currency ? specialCost(s, index) : 0,
  );
}
export function buySpecial(
  s: GameState,
  index: number,
  useJoker = false,
): GameState {
  const u = SPECIALS[index];
  if (!u || s.specialLevels[index] >= u.max) return s;
  const plan = paymentPlan(s, specialRequirements(s, index), useJoker);
  if (!plan.affordable) return s;
  return {
    ...s,
    wallet: payWallet(s, plan.spent),
    specialLevels: s.specialLevels.map((n, i) => n + (i === index ? 1 : 0)),
  };
}
export function galaxyMassReward(s: GameState) {
  return Math.ceil(
    Math.max(
      5_000,
      STAGES[stageIndex(s.mass)].mass * 0.012,
      production(s) * 180,
    ),
  );
}
export function exchangeGalaxy(s: GameState, target: number): Outcome {
  if (![-1, 0, 1, 3].includes(target))
    return { state: s, message: 'This currency cannot be exchanged.' };
  const cost = target === -1 ? GALAXY_GROWTH_COST : GALAXY_EXCHANGE_COST;
  if (s.wallet[2] < cost)
    return { state: s, message: 'Not enough Galaxydust.' };
  const wallet = [...s.wallet];
  wallet[2] -= cost;
  if (target === -1) {
    const amount = galaxyMassReward(s);
    return {
      state: gainMass({ ...s, wallet }, amount),
      message: `Growth mass +${format(amount)}`,
    };
  }
  wallet[target] = Math.min(1e9, wallet[target] + GALAXY_EXCHANGE_YIELD);
  return {
    state: { ...s, wallet },
    message: `${CURRENCIES[target].name} +${format(GALAXY_EXCHANGE_YIELD)}`,
  };
}
const RECIPE_TOOLS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 10, 11, 11, 12];
export function starRecipe(star: number) {
  const index = Math.min(TOTAL_STARS - 1, Math.max(0, Math.floor(star)));
  const { set, node } = constellationProgress(index);
  const tool = RECIPE_TOOLS[set],
    support = Math.max(0, tool - (set < 5 ? 1 : 2));
  const toolCounts = new Map<number, number>();
  const add = (id: number, count: number) =>
    toolCounts.set(id, (toolCounts.get(id) ?? 0) + count);
  if (set < 5) {
    if (node !== 1) add(tool, 2 + set + node);
    if (node !== 0) add(support, 5 + set * 2 + node);
  } else {
    add(tool, 3 + Math.floor(set / 2) + node * 2);
    add(support, 10 + set * 2 + node * 3);
  }
  const dust = ROBOTS[tool].base * (12 + set * 5 + node * 4);
  const currencies = [0, 1, 2, 3].map((i) =>
    set < 5
      ? 0
      : set < 10
        ? (i + node + set) % 4 < 2
          ? (set - 4) * 4000 + node * 1500 + i * 500
          : 0
        : (50_000 * 2 ** (set - 10) + node * 12_500) *
          (i === node % 4 ? 1.25 : 1),
  );
  currencies.push(set >= 10 ? 5 + (set - 10) * 5 + node * 3 : 0);
  const upgrade: number | null = null;
  return {
    set,
    node,
    tools: Array.from(toolCounts, ([id, count]) => ({ id, count })),
    upgrade,
    dust,
    currencies,
    mass: Math.ceil(dust * (node === STAR_COUNTS[set] - 1 ? 2.5 : 0.3)),
  };
}
export function craftReadiness(s: GameState, useJoker = false) {
  const recipe = starRecipe(s.stars),
    payment = paymentPlan(s, recipe.currencies, useJoker);
  const available =
    s.stars < TOTAL_STARS &&
    s.dust >= recipe.dust &&
    recipe.tools.every((t) => s.robots[t.id] >= t.count) &&
    (recipe.upgrade === null || s.doubles[recipe.upgrade]) &&
    payment.affordable;
  return { recipe, payment, available };
}
export function craftStar(s: GameState, useJoker = false): Outcome {
  const { recipe: r, payment, available } = craftReadiness(s, useJoker);
  if (!available)
    return {
      state: s,
      message:
        s.stars >= TOTAL_STARS
          ? 'All constellations are complete.'
          : 'Not enough materials to complete this star.',
    };
  const robots = [...s.robots];
  r.tools.forEach((t) => {
    robots[t.id] -= t.count;
  });
  const doubles = [...s.doubles];
  if (r.upgrade !== null) doubles[r.upgrade] = false;
  const stars = s.stars + 1,
    sets = constellationProgress(stars).completed,
    isSet = sets > completedSets(s);
  const after = gainMass(
    {
      ...s,
      dust: s.dust - r.dust,
      robots,
      doubles,
      wallet: payWallet(s, payment.spent),
      stars,
      luckyBoxes: s.luckyBoxes + (isSet ? 1 : 0),
    },
    r.mass,
  );
  const unlocked =
    isSet && [5, 10, 15].includes(sets)
      ? ' · ' + ROBOTS[10 + sets / 5].name + ' unlocked'
      : '';
  return {
    state: after,
    message: isSet
      ? CONSTELLATIONS[r.set] +
        ' complete! Permanent output ×1.18 · Lucky box +1' +
        unlocked
      : CONSTELLATIONS[r.set] +
        ' star ' +
        (r.node + 1) +
        ' completed · Growth mass +' +
        format(r.mass),
  };
}
export function openLuckyBox(
  s: GameState,
  random: () => number = Math.random,
): Outcome {
  if (s.luckyBoxes < 1)
    return {
      state: s,
      message: 'Complete a constellation to earn a lucky box.',
    };
  let after = {
    ...s,
    luckyBoxes: s.luckyBoxes - 1,
    boxesOpened: s.boxesOpened + 1,
  };
  const roll = clampRandom(random()),
    scale = Math.max(1, completedSets(s));
  let message: string;
  if (roll < 0.55) {
    const wallet = [...s.wallet],
      amount = 2_000 + scale * 1_000;
    for (let i = 0; i < 4; i++) wallet[i] = Math.min(1e9, wallet[i] + amount);
    after = { ...after, wallet };
    message = `Each of the four currencies +${amount}`;
  } else if (roll < 0.85) {
    const amount = Math.max(
      20_000,
      production(s) * 600,
      STAGES[stageIndex(s.mass)].mass * 0.02,
    );
    after = earn(after, amount);
    message = `Dust +${format(amount)}`;
  } else if (roll < 0.99) {
    const amount = galaxyMassReward(s) * 4;
    after = gainMass(after, amount);
    message = `Growth mass +${format(amount)}`;
  } else {
    const wallet = [...s.wallet];
    wallet[4] = Math.min(1e9, wallet[4] + 3);
    after = { ...after, wallet };
    message = 'Spacedust +3';
  }
  return { state: after, message: `Lucky box · ${message}` };
}

function numeric(value: unknown, max = MAX_VALUE): value is number {
  return (
    typeof value === 'number' &&
    Number.isFinite(value) &&
    value >= 0 &&
    value <= max
  );
}
function integers(
  value: unknown,
  length: number,
  max: number,
): value is number[] {
  return (
    Array.isArray(value) &&
    value.length === length &&
    value.every((n) => numeric(n, max) && Number.isInteger(n))
  );
}
function booleans(value: unknown, length: number): value is boolean[] {
  return (
    Array.isArray(value) &&
    value.length === length &&
    value.every((n) => typeof n === 'boolean')
  );
}
export function decodeSave(
  raw: string | null,
  now = Date.now(),
): GameState | null {
  if (!raw) return null;
  try {
    const s = JSON.parse(raw);
    if (
      !s ||
      ![1, 2, 3, 4].includes(s.version) ||
      !integers(s.robots, s.version === 1 ? 6 : 14, MAX_TOOLS)
    )
      return null;
    const fields = [
      'dust',
      'mass',
      'clicks',
      'comets',
      'playSeconds',
      'updatedAt',
      'startedAt',
      'lastCometId',
    ];
    if (fields.some((k) => !numeric(s[k])) || s.dust > s.mass) return null;
    let result: GameState = {
      ...freshState(now),
      name: normalizeName(s.name),
      dust: s.dust,
      mass: s.mass,
      robots: ROBOTS.map((_, i) => s.robots[i] ?? 0),
      clicks: s.clicks,
      comets: s.comets,
      playSeconds: s.playSeconds,
      updatedAt: Math.min(s.updatedAt, now),
      startedAt: s.startedAt,
      lastCometId: s.lastCometId,
      sound: s.sound === true,
      reducedMotion: s.reducedMotion === true,
      completedAt:
        s.mass >= STAGES[FINAL_STAGE].mass && numeric(s.completedAt)
          ? Math.min(now, s.completedAt)
          : null,
    };
    if (s.version < 3) {
      if (
        ![s.clickLevel, s.aiLevel].every(
          (n) => numeric(n, 50) && Number.isInteger(n),
        )
      )
        return null;
      let refund = 0;
      for (let i = 0; i < s.clickLevel; i++) refund += Math.ceil(40 * 2.6 ** i);
      for (let i = 0; i < s.aiLevel; i++) refund += Math.ceil(1_200 * 4.2 ** i);
      refund = Math.min(refund, Math.max(0, s.mass - s.dust));
      result = { ...result, dust: result.dust + refund, legacyRefund: refund };
    } else {
      if (
        !booleans(s.doubles, 28) ||
        !booleans(s.synergies, 12) ||
        !integers(s.wallet, 5, 1e9) ||
        !integers(s.specialLevels, 3, 12)
      )
        return null;
      if (s.specialLevels.some((n: number, i: number) => n > SPECIALS[i].max))
        return null;
      if (
        !numeric(s.manualLevel, 3) ||
        !Number.isInteger(s.manualLevel) ||
        !numeric(s.stars, s.version < 4 ? 75 : TOTAL_STARS) ||
        !Number.isInteger(s.stars)
      )
        return null;
      if (
        !numeric(s.convertedDust) ||
        !numeric(s.legacyRefund) ||
        !numeric(s.conversionMilestones, 325) ||
        !Number.isInteger(s.conversionMilestones)
      )
        return null;
      if (
        !numeric(s.luckyBoxes, 15) ||
        !Number.isInteger(s.luckyBoxes) ||
        !numeric(s.boxesOpened, 15) ||
        !Number.isInteger(s.boxesOpened) ||
        s.luckyBoxes + s.boxesOpened >
          (s.version < 4
            ? Math.floor(s.stars / 5)
            : constellationProgress(s.stars).completed)
      )
        return null;
      if (
        s.conversionMilestones > 0 &&
        s.convertedDust < conversionTarget(s.conversionMilestones - 1)
      )
        return null;
      result = {
        ...result,
        doubles: s.doubles,
        synergies: s.synergies,
        manualLevel: s.manualLevel,
        wallet: s.wallet,
        specialLevels: s.specialLevels,
        stars: s.stars,
        legacyStarCredit: 0,
        convertedDust: s.convertedDust,
        conversionMilestones: s.conversionMilestones,
        luckyBoxes: s.luckyBoxes,
        boxesOpened: s.boxesOpened,
        legacyRefund: s.legacyRefund,
      };
    }
    if (s.version === 3) {
      const oldSets = Math.floor(s.stars / 5),
        oldPartial = s.stars % 5;
      const converted =
        oldSets === 15
          ? TOTAL_STARS
          : STAR_STARTS[oldSets] +
            Math.min(
              STAR_COUNTS[oldSets] - 1,
              Math.ceil((oldPartial * STAR_COUNTS[oldSets]) / 5),
            );
      result.stars = converted;
      result.legacyStarCredit = s.stars - converted;
    } else if (s.version === 4) {
      if (
        !numeric(s.legacyStarCredit, 15) ||
        !Number.isInteger(s.legacyStarCredit)
      )
        return null;
      result.legacyStarCredit = s.legacyStarCredit;
    }
    if (result.name === '나의 우주') result.name = 'My Universe';
    return result;
  } catch {
    return null;
  }
}
export function normalizeName(value: unknown) {
  return typeof value === 'string'
    ? Array.from(
        Array.from(value)
          .filter((c) => c.codePointAt(0)! >= 32 && c.codePointAt(0)! !== 127)
          .join('')
          .trim(),
      )
        .slice(0, 24)
        .join('') || 'My Universe'
    : 'My Universe';
}
export function format(n: number, decimals = 1) {
  if (n < 1_000)
    return new Intl.NumberFormat('en-US', {
      maximumFractionDigits: n < 10 ? decimals : 0,
    }).format(n);
  const units = [
      '',
      'K',
      'M',
      'B',
      'T',
      'Qa',
      'Qi',
      'Sx',
      'Sp',
      'Oc',
      'No',
      'Dc',
    ],
    i = Math.floor(Math.log10(n) / 3);
  return i < units.length
    ? `${(n / 1000 ** i).toFixed(decimals).replace(/\.0$/, '')}${units[i]}`
    : n.toExponential(1);
}
