export const SAVE_KEY = 'spacedust.save.v1';
export const OFFLINE_CAP = 8 * 60 * 60;
export const STAGES = [
  {
    name: '우주먼지',
    en: 'COSMIC DUST',
    mass: 0,
    color: '#86e8d4',
    description: '모든 우주는 작은 먼지에서 시작됩니다.',
  },
  {
    name: '먼지 덩어리',
    en: 'DUST CLUSTER',
    mass: 90,
    color: '#c7b49a',
    description: '흩어진 먼지가 서로를 끌어당깁니다.',
  },
  {
    name: '소행성',
    en: 'ASTEROID',
    mass: 1_000,
    color: '#b7c5d6',
    description: '작은 암석에, 커다란 가능성이 담겼습니다.',
  },
  {
    name: '원시 행성',
    en: 'PROTOPLANET',
    mass: 10_000,
    color: '#fc9771',
    description: '뜨거운 충돌 속에서 새로운 세계가 태어납니다.',
  },
  {
    name: '행성',
    en: 'PLANET',
    mass: 150_000,
    color: '#6fbdf3',
    description: '이제 당신만의 세계가 궤도를 그립니다.',
  },
  {
    name: '항성',
    en: 'STAR',
    mass: 2_000_000,
    color: '#ffe399',
    description: '스스로 빛나는 별이 되었습니다.',
  },
  {
    name: '거대 항성',
    en: 'RED GIANT',
    mass: 35_000_000,
    color: '#ff926f',
    description: '별의 심장이 거세게 뛰기 시작합니다.',
  },
  {
    name: '블랙홀',
    en: 'BLACK HOLE',
    mass: 750_000_000,
    color: '#c3a3ff',
    description: '한 줌의 먼지가, 빛마저 끌어당기는 우주가 되었습니다.',
  },
] as const;
export const ROBOTS = [
  {
    id: 'pip',
    name: '픽시 수집봇',
    model: 'PIP–01',
    desc: '작은 두 팔로 먼지를 하나씩 모아요.',
    base: 25,
    rate: 0.8,
    unlock: 0,
  },
  {
    id: 'drone',
    name: '스카우트 드론',
    model: 'SC–02',
    desc: '먼지 구름 사이를 날아다니는 탐사봇.',
    base: 180,
    rate: 5,
    unlock: 90,
  },
  {
    id: 'miner',
    name: '아틀라스 채굴봇',
    model: 'AT–03',
    desc: '네 개의 팔로 암석을 먼지로 바꿔요.',
    base: 1_800,
    rate: 38,
    unlock: 1_000,
  },
  {
    id: 'orbiter',
    name: '오비트 수확봇',
    model: 'OR–04',
    desc: '궤도를 돌며 우주의 조각을 수확해요.',
    base: 18_000,
    rate: 280,
    unlock: 10_000,
  },
  {
    id: 'gravity',
    name: '그래비티 로봇',
    model: 'GR–05',
    desc: '중력장으로 멀리 있는 먼지까지 끌어와요.',
    base: 250_000,
    rate: 4_000,
    unlock: 150_000,
  },
  {
    id: 'singularity',
    name: '싱귤래리티 코어',
    model: 'SG–06',
    desc: '시공간을 접어 별의 에너지를 수집해요.',
    base: 6_000_000,
    rate: 65_000,
    unlock: 2_000_000,
  },
] as const;
export type GameState = {
  version: 1;
  dust: number;
  mass: number;
  robots: number[];
  clickLevel: number;
  aiLevel: number;
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
    version: 1,
    dust: 0,
    mass: 0,
    robots: ROBOTS.map(() => 0),
    clickLevel: 0,
    aiLevel: 0,
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
export function milestone(count: number) {
  return count >= 50 ? 8 : count >= 25 ? 4 : count >= 10 ? 2 : 1;
}
export function robotRate(s: GameState, index: number) {
  return (
    ROBOTS[index].rate *
    s.robots[index] *
    milestone(s.robots[index]) *
    1.5 ** s.aiLevel
  );
}
export function production(s: GameState) {
  return ROBOTS.reduce((sum, _, i) => sum + robotRate(s, i), 0);
}
export function clickPower(s: GameState) {
  return (
    ([1, 2, 4, 12, 40, 200, 1_000, 5_000][stageIndex(s.mass)] +
      production(s) * 0.025) *
    1.75 ** s.clickLevel
  );
}
export function earn(
  s: GameState,
  amount: number,
  now = Date.now(),
): GameState {
  if (!Number.isFinite(amount) || amount < 0) return s;
  const mass = Math.min(1e200, s.mass + amount);
  return {
    ...s,
    dust: Math.min(1e200, s.dust + amount),
    mass,
    completedAt: s.completedAt ?? (mass >= STAGES[7].mass ? now : null),
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
  return Math.ceil(ROBOTS[index].base * 1.17 ** owned);
}
export function quote(s: GameState, index: number, quantity: number | 'max') {
  let cost = 0,
    count = 0;
  const limit =
    quantity === 'max'
      ? 500 - s.robots[index]
      : Math.min(quantity, 500 - s.robots[index]);
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
  if (!ROBOTS[index] || s.mass < ROBOTS[index].unlock) return s;
  const { cost, count } = quote(s, index, quantity);
  if (!count || cost > s.dust) return s;
  return {
    ...s,
    dust: Math.max(0, s.dust - cost),
    robots: s.robots.map((n, i) => (i === index ? n + count : n)),
  };
}
export function upgradePrice(s: GameState, kind: 'click' | 'ai') {
  return Math.ceil(
    kind === 'click' ? 40 * 2.6 ** s.clickLevel : 1_200 * 4.2 ** s.aiLevel,
  );
}
export function upgrade(s: GameState, kind: 'click' | 'ai'): GameState {
  const key = kind === 'click' ? 'clickLevel' : 'aiLevel',
    cost = upgradePrice(s, kind);
  if (s[key] >= 50 || s.dust < cost || (kind === 'ai' && s.mass < 1_000))
    return s;
  return { ...s, dust: s.dust - cost, [key]: s[key] + 1 };
}
export function cometReward(s: GameState, rare: boolean) {
  return Math.ceil(
    Math.max(40, clickPower(s) * 25, production(s) * 45) * (rare ? 3 : 1),
  );
}
export function claimComet(s: GameState, id: number, rare: boolean): GameState {
  if (id <= s.lastCometId) return s;
  return {
    ...earn(s, cometReward(s, rare)),
    comets: s.comets + 1,
    lastCometId: id,
  };
}
export function decodeSave(
  raw: string | null,
  now = Date.now(),
): GameState | null {
  if (!raw) return null;
  try {
    const s = JSON.parse(raw);
    if (
      s.version !== 1 ||
      !Array.isArray(s.robots) ||
      s.robots.length !== ROBOTS.length
    )
      return null;
    const fields = [
      'dust',
      'mass',
      'clickLevel',
      'aiLevel',
      'clicks',
      'comets',
      'playSeconds',
      'updatedAt',
      'startedAt',
      'lastCometId',
    ];
    if (
      fields.some(
        (k) =>
          typeof s[k] !== 'number' ||
          !Number.isFinite(s[k]) ||
          s[k] < 0 ||
          s[k] > 1e200,
      )
    )
      return null;
    if (
      s.robots.some((n: number) => !Number.isInteger(n) || n < 0 || n > 500) ||
      !Number.isInteger(s.clickLevel) ||
      !Number.isInteger(s.aiLevel) ||
      s.clickLevel > 50 ||
      s.aiLevel > 50 ||
      s.dust > s.mass
    )
      return null;
    return {
      ...freshState(now),
      ...s,
      updatedAt: Math.min(s.updatedAt, now),
      sound: s.sound === true,
      reducedMotion: s.reducedMotion === true,
      completedAt:
        typeof s.completedAt === 'number' && Number.isFinite(s.completedAt)
          ? s.completedAt
          : null,
    };
  } catch {
    return null;
  }
}
export function format(n: number, decimals = 1) {
  if (n < 1_000)
    return new Intl.NumberFormat('en-US', {
      maximumFractionDigits: n < 10 ? decimals : 0,
    }).format(n);
  const units = ['', 'K', 'M', 'B', 'T', 'Qa', 'Qi'],
    i = Math.floor(Math.log10(n) / 3);
  return i < units.length
    ? `${(n / 1000 ** i).toFixed(decimals).replace(/\.0$/, '')}${units[i]}`
    : n.toExponential(1);
}
