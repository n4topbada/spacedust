'use client';
/* oxlint-disable react/react-compiler -- The imperative simulation clock and randomness below run in effects and user event handlers, never during rendering. */
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent,
} from 'react';
import {
  ArrowRight,
  AudioLines,
  Bot,
  Check,
  ChevronRight,
  CircleHelp,
  Crosshair,
  Disc3,
  Hand,
  LockKeyhole,
  Orbit,
  Radio,
  Settings2,
  Sparkles,
  Telescope,
  Volume2,
  VolumeX,
  X,
  Zap,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import {
  STAGES,
  ROBOTS,
  SAVE_KEY,
  freshState,
  stageIndex,
  production,
  clickPower,
  settle,
  collect,
  quote,
  buyRobot,
  upgradePrice,
  upgrade,
  cometReward,
  claimComet,
  decodeSave,
  format,
  robotRate,
  type GameState,
} from '@/lib/game';

type Comet = { id: number; rare: boolean; until: number; lane: number };
type Floater = {
  id: number;
  x: number;
  y: number;
  text: string;
  critical: boolean;
};
type Log = { id: number; text: string; time: string };
const atlasStyle = (index: number, columns: number): CSSProperties => ({
  backgroundPosition: `${((index % columns) / (columns - 1)) * 100}% ${Math.floor(index / columns) * 100}%`,
});

function Starfield({ reduced }: { reduced: boolean }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const el = canvas.current,
      ctx = el?.getContext('2d');
    if (!el || !ctx) return;
    let width = 0,
      height = 0,
      frame = 0;
    const stars = Array.from({ length: 190 }, (_, i) => ({
      x: ((i * 7919 + 13) % 1009) / 1009,
      y: ((i * 3571 + 47) % 997) / 997,
      r: i % 9 === 0 ? 1.5 : 0.65,
      alpha: 0.2 + (i % 7) / 13,
    }));
    const draw = (t: number) => {
      ctx.clearRect(0, 0, width, height);
      for (const star of stars) {
        ctx.beginPath();
        ctx.fillStyle = `rgba(191,219,232,${star.alpha * (reduced ? 1 : 0.72 + Math.sin(t / 2200 + star.x * 30) * 0.28)})`;
        ctx.arc(star.x * width, star.y * height, star.r, 0, Math.PI * 2);
        ctx.fill();
      }
      if (!reduced) frame = requestAnimationFrame(draw);
    };
    const resize = () => {
      width = el.clientWidth;
      height = el.clientHeight;
      const dpr = Math.min(devicePixelRatio, 2);
      el.width = width * dpr;
      el.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (reduced) draw(0);
    };
    const observer = new ResizeObserver(resize);
    observer.observe(el);
    resize();
    draw(0);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [reduced]);
  return <canvas className="starfield" ref={canvas} aria-hidden="true" />;
}

export default function Home() {
  const [game, setGame] = useState<GameState>(() => freshState(0)),
    state = useRef(game);
  const [ready, setReady] = useState(false),
    [quantity, setQuantity] = useState<number | 'max'>(1);
  const [modal, setModal] = useState<
    'help' | 'settings' | 'journey' | 'complete' | null
  >(null);
  const [comet, setComet] = useState<Comet | null>(null),
    cometRef = useRef<Comet | null>(null),
    nextComet = useRef(0);
  const [floaters, setFloaters] = useState<Floater[]>([]),
    [logs, setLogs] = useState<Log[]>([]);
  const [notice, setNotice] = useState(''),
    [saveStatus, setSaveStatus] = useState('자동 저장 준비 중');
  const [pulse, setPulse] = useState(0),
    [confirmReset, setConfirmReset] = useState(false);
  const audio = useRef<AudioContext | null>(null),
    timers = useRef(new Set<ReturnType<typeof setTimeout>>());
  const stage = stageIndex(game.mass),
    current = STAGES[stage],
    next = STAGES[stage + 1];
  const dps = production(game),
    power = clickPower(game),
    robotsOwned = game.robots.reduce((a, b) => a + b, 0);
  const progress = next
    ? Math.min(
        100,
        ((game.mass - current.mass) / (next.mass - current.mass)) * 100,
      )
    : 100;
  const later = useCallback((fn: () => void, ms: number) => {
    const t = setTimeout(() => {
      timers.current.delete(t);
      fn();
    }, ms);
    timers.current.add(t);
  }, []);
  const log = useCallback((text: string) => {
    setLogs((list) =>
      [
        {
          id: Date.now() + Math.random(),
          text,
          time: new Date().toLocaleTimeString('ko-KR', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
          }),
        },
        ...list,
      ].slice(0, 4),
    );
  }, []);
  const notify = useCallback(
    (text: string) => {
      setNotice(text);
      later(() => setNotice((value) => (value === text ? '' : value)), 4500);
    },
    [later],
  );
  const apply = useCallback(
    (change: (s: GameState) => GameState) => {
      const before = state.current,
        after = change(settle(before));
      state.current = after;
      setGame(after);
      if (stageIndex(after.mass) > stageIndex(before.mass)) {
        const name = STAGES[stageIndex(after.mass)].name;
        log(`${name} 진화 완료`);
        notify(`${name} 탄생! 새로운 우주가 열렸습니다.`);
        if (stageIndex(after.mass) === 7 && !before.completedAt)
          setModal('complete');
      }
      return after;
    },
    [log, notify],
  );
  const save = useCallback(() => {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(state.current));
      setSaveStatus('자동 저장됨');
    } catch {
      setSaveStatus('저장 공간을 확인해 주세요');
    }
  }, []);
  useEffect(() => {
    const activeTimers = timers.current;
    const now = Date.now();
    let initial = freshState(now);
    try {
      const raw = localStorage.getItem(SAVE_KEY),
        saved = decodeSave(raw, now);
      if (saved) {
        initial = settle(saved, now);
        const offline = initial.dust - saved.dust;
        if (offline >= 1 && now - saved.updatedAt > 30_000) {
          notify(`다시 오셨네요! 로봇들이 먼지 ${format(offline)}을 모았어요.`);
          log(`자리 비움 수집 +${format(offline)}`);
        }
        if (!saved.completedAt && initial.completedAt) setModal('complete');
      } else if (raw)
        notify('저장 데이터를 읽을 수 없어 새 우주를 시작합니다.');
      else
        initial.reducedMotion = matchMedia(
          '(prefers-reduced-motion: reduce)',
        ).matches;
    } catch {
      setSaveStatus('이 브라우저에서는 저장할 수 없어요');
    }
    state.current = initial;
    setGame(initial);
    setReady(true);
    nextComet.current = now + 18_000;
    log(
      initial.mass
        ? '탐사 재개 · 우주가 당신을 기다렸어요.'
        : '탐사 시작 · 첫 번째 먼지를 모아보세요.',
    );
    const tick = setInterval(() => {
      apply((s) => s);
      const t = Date.now();
      if (document.hidden) return;
      if (cometRef.current && t > cometRef.current.until) {
        cometRef.current = null;
        setComet(null);
        nextComet.current = t + 40_000 + Math.random() * 35_000;
      }
      if (!cometRef.current && t >= nextComet.current) {
        const c = {
          id: t,
          rare: Math.random() < 0.18,
          until: t + 14_000,
          lane: 24 + Math.random() * 25,
        };
        cometRef.current = c;
        setComet(c);
        nextComet.current = Infinity;
      }
    }, 100);
    const autosave = setInterval(save, 5000),
      onHide = () => {
        if (document.hidden) {
          apply((s) => s);
          save();
        }
      };
    document.addEventListener('visibilitychange', onHide);
    window.addEventListener('pagehide', save);
    return () => {
      clearInterval(tick);
      clearInterval(autosave);
      activeTimers.forEach(clearTimeout);
      activeTimers.clear();
      document.removeEventListener('visibilitychange', onHide);
      window.removeEventListener('pagehide', save);
      save();
      void audio.current?.close();
      audio.current = null;
    };
  }, [apply, log, notify, save]);

  function tone(type: 'tap' | 'buy' | 'comet') {
    if (!state.current.sound) return;
    try {
      audio.current ??= new AudioContext();
      const ctx = audio.current;
      void ctx.resume();
      const osc = ctx.createOscillator(),
        gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(
        type === 'tap' ? 240 : type === 'buy' ? 520 : 740,
        ctx.currentTime,
      );
      osc.frequency.exponentialRampToValueAtTime(
        type === 'tap' ? 100 : 1100,
        ctx.currentTime + 0.13,
      );
      gain.gain.setValueAtTime(0.035, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
      osc.start();
      osc.stop(ctx.currentTime + 0.2);
    } catch {
      /* Optional audio. */
    }
  }
  function tap(event: MouseEvent<HTMLButtonElement>) {
    if (!ready) return;
    const critical = Math.random() < 0.06,
      amount = clickPower(state.current) * (critical ? 5 : 1);
    apply((s) => collect(s, critical));
    tone('tap');
    setPulse((p) => p + 1);
    const rect = event.currentTarget.getBoundingClientRect(),
      id = Date.now() + Math.random();
    setFloaters((list) => [
      ...list.slice(-16),
      {
        id,
        x: event.detail === 0 ? rect.width / 2 : event.clientX - rect.left,
        y: event.detail === 0 ? rect.height / 2 : event.clientY - rect.top,
        text: `+${format(amount)}${critical ? ' CRITICAL' : ''}`,
        critical,
      },
    ]);
    later(() => setFloaters((list) => list.filter((f) => f.id !== id)), 1000);
  }
  function purchase(i: number) {
    const count = state.current.robots[i],
      after = apply((s) => buyRobot(s, i, quantity));
    if (after.robots[i] > count) {
      tone('buy');
      log(`${ROBOTS[i].name} +${after.robots[i] - count} 배치`);
      save();
    }
  }
  function buyUpgrade(kind: 'click' | 'ai') {
    const previous =
        kind === 'click' ? state.current.clickLevel : state.current.aiLevel,
      after = apply((s) => upgrade(s, kind));
    if ((kind === 'click' ? after.clickLevel : after.aiLevel) > previous) {
      tone('buy');
      notify(
        kind === 'click'
          ? '탭봇 수집 팔 강화! 클릭 효율 ×1.75'
          : '군집 AI 연결 완료! 모든 로봇 효율 ×1.5',
      );
      save();
    }
  }
  function catchComet() {
    const c = cometRef.current;
    if (!c || Date.now() > c.until) return;
    cometRef.current = null;
    setComet(null);
    nextComet.current = Date.now() + 40_000 + Math.random() * 35_000;
    const reward = cometReward(settle(state.current), c.rare);
    apply((s) => claimComet(s, c.id, c.rare));
    tone('comet');
    notify(`${c.rare ? '황금 혜성' : '혜성'} 포착! 먼지 +${format(reward)}`);
    log(`혜성 보너스 +${format(reward)}`);
    save();
  }
  function reset() {
    const fresh = freshState();
    fresh.sound = game.sound;
    fresh.reducedMotion = game.reducedMotion;
    state.current = fresh;
    setGame(fresh);
    cometRef.current = null;
    setComet(null);
    nextComet.current = Date.now() + 18_000;
    setLogs([]);
    setConfirmReset(false);
    setModal(null);
    save();
    notify('새로운 우주가 시작되었습니다.');
  }

  return (
    <main
      className={`game-shell ${game.reducedMotion ? 'reduce-motion' : ''}`}
      style={{ '--stage-color': current.color } as CSSProperties}
    >
      <Starfield reduced={game.reducedMotion} />
      <header className="topbar">
        <div className="brand" aria-label="우주먼지">
          <span className="brand-mark">
            <Orbit size={29} strokeWidth={1.4} />
          </span>
          <span>
            SPACE<span className="brand-light">DUST</span>
            <small>우주먼지</small>
          </span>
        </div>
        <div className="mission-label">
          <span className="live-dot" /> 나만의 작은 우주{' '}
          <span className="slash">/</span> EXPEDITION 001
        </div>
        <div className="header-actions">
          <span className="save-state">
            <Check size={13} />
            {saveStatus}
          </span>
          <button
            className="icon-button"
            aria-label={game.sound ? '소리 끄기' : '소리 켜기'}
            title={game.sound ? '소리 끄기' : '소리 켜기'}
            onClick={() => {
              apply((s) => ({ ...s, sound: !s.sound }));
              save();
            }}
          >
            {game.sound ? <Volume2 size={18} /> : <VolumeX size={18} />}
          </button>
          <button
            className="icon-button"
            aria-label="게임 도움말"
            onClick={() => setModal('help')}
          >
            <CircleHelp size={18} />
          </button>
          <button
            className="icon-button"
            aria-label="설정"
            onClick={() => setModal('settings')}
          >
            <Settings2 size={18} />
          </button>
        </div>
      </header>
      <div className="game-layout">
        <section className="universe" aria-label="우주 수집 화면">
          <div className="universe-top">
            <span className="eyebrow">
              <span className="live-dot" /> DEEP SPACE · SECTOR 001
            </span>
            <span className="coordinates">
              RA 23h 08m <span>DEC +61° 32′</span>
            </span>
          </div>
          <div className="resource-display">
            <span className="resource-label">보유 우주먼지</span>
            <h1 data-testid="dust">
              {format(game.dust)}
              <span> dust</span>
            </h1>
            <div className="rate-pills">
              <span>
                <Hand size={14} /> 클릭당 <b>+{format(power)}</b>
              </span>
              <span>
                <Zap size={14} /> 초당 <b>+{format(dps)}</b>
              </span>
            </div>
          </div>
          <div className={`celestial-area stage-${stage}`}>
            <div className="orbit-ring orbit-one" />
            <div className="orbit-ring orbit-two" />
            <div className="orbit-ring orbit-three" />
            <span className="orbit-tag">
              <Crosshair size={12} /> MASS {format(game.mass)}
            </span>
            <button
              className="collect-target"
              onClick={tap}
              disabled={!ready}
              aria-label={`먼지 수집, 클릭당 ${format(power)}`}
            >
              <span className="celestial-glow" />
              <span
                className="celestial-sprite"
                style={{
                  ...atlasStyle(stage, 4),
                  width: `${Math.min(95, 67 + stage * 3 + progress * 0.08)}%`,
                }}
              />
              <span key={pulse} className={pulse ? 'click-ripple' : ''} />
              {floaters.map((f) => (
                <span
                  className={`floating-reward ${f.critical ? 'critical' : ''}`}
                  key={f.id}
                  style={{ left: f.x, top: f.y }}
                >
                  {f.text}
                </span>
              ))}
            </button>
            {robotsOwned > 0 && (
              <div className="satellite-orbit" aria-hidden="true">
                <span className="satellite">
                  <Bot size={21} />
                </span>
              </div>
            )}
            <span className="scale-mark">
              {stage === 0
                ? '미세 입자 관측 중'
                : stage < 4
                  ? '중력장 형성 중'
                  : stage < 7
                    ? '고밀도 에너지 감지'
                    : '사건의 지평선 관측 중'}
            </span>
          </div>
          <div className="celestial-caption">
            <span className="stage-tag">
              PHASE {String(stage + 1).padStart(2, '0')}
            </span>
            <h2>{current.name}</h2>
            <p>{current.description}</p>
            <div className="tap-hint">
              <Hand size={15} /> 천체를 클릭해서 먼지를 모으세요{' '}
              <span>+{format(power)}</span>
            </div>
          </div>
          <div className="evolution-panel">
            <div className="evolution-heading">
              <span>
                <Orbit size={16} /> 다음 진화{' '}
                <strong>{next?.name ?? '우주의 끝, 새로운 시작'}</strong>
              </span>
              <span>
                {next
                  ? `${format(game.mass)} / ${format(next.mass)}`
                  : 'COMPLETE'}{' '}
                <b>{Math.floor(progress)}%</b>
              </span>
            </div>
            <Progress value={progress} aria-label="다음 천체 진화까지 진행률" />
            <div className="evolution-foot">
              <span>
                {next
                  ? `먼지 ${format(Math.max(0, next.mass - game.mass))}을 더 모으면 진화합니다`
                  : '블랙홀이 되었습니다. 우주는 계속 성장합니다.'}
              </span>
              <button onClick={() => setModal('journey')}>
                성장 여정 <ArrowRight size={13} />
              </button>
            </div>
          </div>
          {comet && (
            <button
              className={`comet ${comet.rare ? 'rare' : ''}`}
              style={{ top: `${comet.lane}%` }}
              onClick={catchComet}
              aria-label={
                comet.rare ? '황금 혜성 보너스 받기' : '혜성 보너스 받기'
              }
            >
              <span className="comet-tail" />
              <Sparkles size={27} />
              <span className="comet-label">
                {comet.rare ? '황금 혜성 · 보상 3배' : '혜성 발견! 클릭'}
                <b>+{format(cometReward(game, comet.rare))}</b>
              </span>
            </button>
          )}
        </section>
        <aside className="hangar" aria-label="로봇 구매와 업그레이드">
          <div className="hangar-title">
            <div>
              <span className="eyebrow">YOUR LITTLE SPACE CREW</span>
              <h2>
                로봇 격납고 <span>{robotsOwned}</span>
              </h2>
            </div>
            <Bot size={25} strokeWidth={1.3} />
          </div>
          <p className="hangar-intro">작은 동료들과, 더 큰 우주로.</p>
          <Tabs defaultValue="robots" className="shop-tabs">
            <TabsList className="shop-tab-list">
              <TabsTrigger value="robots">
                <Bot size={15} /> 수집 로봇
              </TabsTrigger>
              <TabsTrigger value="upgrades">
                <Zap size={15} /> 성능 강화
              </TabsTrigger>
            </TabsList>
            <TabsContent value="robots">
              <div className="purchase-toolbar">
                <span>자동으로 먼지를 수집합니다</span>
                <div className="quantity-options" aria-label="구매 수량">
                  {([1, 10, 'max'] as const).map((q) => (
                    <button
                      key={q}
                      aria-pressed={quantity === q}
                      className={quantity === q ? 'active' : ''}
                      onClick={() => setQuantity(q)}
                    >
                      {q === 'max' ? '최대' : `×${q}`}
                    </button>
                  ))}
                </div>
              </div>
              <div className="robot-list">
                {ROBOTS.map((robot, i) => {
                  const locked = game.mass < robot.unlock,
                    offer = quote(game, i, quantity),
                    affordable = offer.count > 0 && offer.cost <= game.dust;
                  return (
                    <article
                      key={robot.id}
                      className={`robot-card ${locked ? 'locked' : ''} ${!locked && affordable ? 'affordable' : ''}`}
                    >
                      <div
                        className="robot-art"
                        style={atlasStyle(i, 3)}
                        aria-hidden="true"
                      />
                      <div className="robot-info">
                        <div className="robot-model">
                          {robot.model}
                          <span>
                            {locked ? (
                              <LockKeyhole size={11} />
                            ) : (
                              `보유 ${game.robots[i]}`
                            )}
                          </span>
                        </div>
                        <h3>{robot.name}</h3>
                        <p>
                          {locked
                            ? `${format(robot.unlock)} 누적 질량에 해금`
                            : robot.desc}
                        </p>
                        <div className="robot-bottom">
                          <span className="robot-output">
                            <Zap size={12} />
                            {game.robots[i]
                              ? format(robotRate(game, i))
                              : format(robot.rate * 1.5 ** game.aiLevel)}
                            <small> /초{game.robots[i] ? ' · 합계' : ''}</small>
                          </span>
                          <button
                            onClick={() => purchase(i)}
                            disabled={locked || !affordable}
                            aria-label={`${robot.name} ${offer.count || 1}대 구매, 먼지 ${format(offer.cost || robot.base)}`}
                          >
                            <Sparkles size={12} />{' '}
                            {locked
                              ? '잠김'
                              : quantity === 'max' && !offer.count
                                ? '먼지 부족'
                                : format(offer.cost)}
                            {!locked && (
                              <span>
                                {quantity === 'max' && offer.count > 0
                                  ? `×${offer.count}`
                                  : '+'}
                              </span>
                            )}
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
              <div className="hangar-tip">
                <Radio size={16} />
                <span>
                  로봇 10 · 25 · 50대마다 수집 효율이 <b>2배</b>가 됩니다.
                </span>
              </div>
            </TabsContent>
            <TabsContent value="upgrades">
              <div className="upgrade-intro">동료들의 잠재력을 깨워보세요.</div>
              {(['click', 'ai'] as const).map((kind, i) => (
                <article className="upgrade-card" key={kind}>
                  <div className="upgrade-icon">
                    {i === 0 ? <Hand size={28} /> : <Radio size={28} />}
                  </div>
                  <span className="eyebrow">
                    {i === 0 ? 'TAP–BOT' : 'SWARM–LINK'} · LV.
                    {i === 0 ? game.clickLevel : game.aiLevel}
                  </span>
                  <h3>{i === 0 ? '탭봇 수집 팔 강화' : '로봇 군집 AI'}</h3>
                  <p>
                    {i === 0
                      ? '클릭 한 번에 더 많은 먼지를. 클릭 효율 ×1.75'
                      : '모든 수집 로봇이 함께 학습합니다. 자동 수집 ×1.5'}
                  </p>
                  <button
                    className="primary-button"
                    disabled={
                      game.dust < upgradePrice(game, kind) ||
                      (i === 1 && game.mass < 1000) ||
                      (i === 0 ? game.clickLevel : game.aiLevel) >= 50
                    }
                    onClick={() => buyUpgrade(kind)}
                  >
                    <Sparkles size={15} />
                    {(i === 0 ? game.clickLevel : game.aiLevel) >= 50
                      ? '최대 레벨'
                      : i === 1 && game.mass < 1000
                        ? '소행성 단계에 해금'
                        : `${format(upgradePrice(game, kind))} 먼지로 강화`}
                    <ArrowRight size={16} />
                  </button>
                </article>
              ))}
            </TabsContent>
          </Tabs>
        </aside>
      </div>
      <section className="bottom-deck">
        <div className="journey-strip">
          <div className="deck-heading">
            <span className="eyebrow">A UNIVERSE IN THE MAKING</span>
            <button onClick={() => setModal('journey')}>
              나의 성장 여정 <ChevronRight size={14} />
            </button>
          </div>
          <div className="phase-track">
            {STAGES.map((s, i) => (
              <button
                className={`phase-stop ${i === stage ? 'current' : ''} ${i < stage ? 'achieved' : ''}`}
                key={s.en}
                onClick={() => setModal('journey')}
                aria-label={`${s.name}, ${i <= stage ? '도달' : format(s.mass) + ' 질량 필요'}`}
              >
                <span className="phase-node">
                  {i < stage ? (
                    <Check size={12} />
                  ) : i === stage ? (
                    <span />
                  ) : (
                    <LockKeyhole size={10} />
                  )}
                </span>
                <span>{s.name}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="mission-log">
          <div className="deck-heading">
            <span className="eyebrow">탐사 기록</span>
            <Radio size={13} />
          </div>
          {logs.slice(0, 2).map((item) => (
            <div className="log-line" key={item.id}>
              <time>{item.time}</time>
              <span>{item.text}</span>
            </div>
          ))}
        </div>
      </section>
      <footer className="footer">
        <span>
          <span className="live-dot" /> ALL SYSTEMS NOMINAL
        </span>
        <span>작은 클릭 하나로 시작되는 우주.</span>
        <span>
          <Disc3 size={12} /> 누적 질량 {format(game.mass)}
        </span>
      </footer>
      {notice && (
        <output className="game-notice" aria-live="polite">
          <Sparkles size={18} />
          <span>{notice}</span>
          <button aria-label="알림 닫기" onClick={() => setNotice('')}>
            <X size={14} />
          </button>
        </output>
      )}
      <Dialog
        open={modal !== null}
        onOpenChange={(open) => {
          if (!open) {
            setModal(null);
            setConfirmReset(false);
          }
        }}
      >
        <DialogContent
          className={`game-dialog ${modal === 'journey' ? 'journey-dialog' : ''}`}
        >
          <DialogTitle>
            {modal === 'settings'
              ? '우주 환경 설정'
              : modal === 'journey'
                ? '먼지에서, 무한으로'
                : modal === 'complete'
                  ? '당신의 우주가 블랙홀이 되었습니다'
                  : '작은 우주를 키우는 방법'}
          </DialogTitle>
          <DialogDescription>
            {modal === 'settings'
              ? '편안한 속도로 우주를 탐험하세요.'
              : modal === 'journey'
                ? '누적 질량이 쌓이면 천체가 자동으로 진화합니다.'
                : modal === 'complete'
                  ? '첫 번째 여정 완료. 한 알의 먼지에서 모든 빛을 품는 존재로.'
                  : '클릭하고, 동료를 모으고, 새로운 천체를 만나보세요.'}
          </DialogDescription>
          {modal === 'help' && (
            <div className="help-content">
              <p>
                <Hand />
                <span>
                  <b>천체를 클릭해 먼지를 모으세요.</b>가끔 강력한 클릭이 발생해
                  5배의 먼지를 얻습니다. Tab으로 천체를 선택한 뒤 Enter나
                  Space도 사용할 수 있어요.
                </span>
              </p>
              <p>
                <Bot />
                <span>
                  <b>SF 로봇을 구매하고 강화하세요.</b>로봇은 자동 수집, 탭봇
                  강화는 클릭을 도와요. 구매해도 누적 질량과 성장 단계는
                  줄어들지 않아요.
                </span>
              </p>
              <p>
                <Sparkles />
                <span>
                  <b>지나가는 혜성을 놓치지 마세요.</b>혜성을 누르면 성장 규모에
                  맞는 먼지를 얻어요. 황금 혜성은 보상이 3배! 나타난 뒤 14초
                  동안 잡을 수 있어요.
                </span>
              </p>
              <p>
                <Telescope />
                <span>
                  <b>이 브라우저에 자동 저장됩니다.</b>떠나 있는 동안에도 최대
                  8시간의 로봇 수집량을 받아요. 다른 기기와는 공유되지 않습니다.
                </span>
              </p>
              <small>천체의 진화는 재미를 위한 판타지 우주 설정입니다.</small>
            </div>
          )}
          {modal === 'settings' && (
            <div className="settings-content">
              <label htmlFor="sound-toggle">
                <span>
                  <Volume2 size={18} /> 효과음
                </span>
                <Switch
                  id="sound-toggle"
                  checked={game.sound}
                  onCheckedChange={(checked) => {
                    apply((s) => ({ ...s, sound: checked }));
                    save();
                  }}
                  aria-label="효과음"
                />
              </label>
              <label htmlFor="motion-toggle">
                <span>
                  <AudioLines size={18} /> 움직임 줄이기
                </span>
                <Switch
                  id="motion-toggle"
                  checked={game.reducedMotion}
                  onCheckedChange={(checked) => {
                    apply((s) => ({ ...s, reducedMotion: checked }));
                    save();
                  }}
                  aria-label="움직임 줄이기"
                />
              </label>
              <div className="stats-grid">
                <div>
                  <span>총 클릭</span>
                  <b>{format(game.clicks, 0)}</b>
                </div>
                <div>
                  <span>잡은 혜성</span>
                  <b>{game.comets}</b>
                </div>
                <div>
                  <span>수집 로봇</span>
                  <b>{robotsOwned}</b>
                </div>
                <div>
                  <span>탐사 시간</span>
                  <b>{Math.floor(game.playSeconds / 60)}분</b>
                </div>
              </div>
              <button
                className="secondary-button"
                onClick={() => {
                  save();
                  notify('현재 우주를 저장했습니다.');
                }}
              >
                지금 저장하기
              </button>
              <div className="reset-area">
                {confirmReset ? (
                  <>
                    <p>
                      모든 먼지와 로봇, 성장 기록이 지워집니다. 새 우주를
                      시작할까요?
                    </p>
                    <div>
                      <button className="danger-button" onClick={reset}>
                        기록 삭제 후 시작
                      </button>
                      <button
                        className="secondary-button"
                        onClick={() => setConfirmReset(false)}
                      >
                        취소
                      </button>
                    </div>
                  </>
                ) : (
                  <button onClick={() => setConfirmReset(true)}>
                    처음부터 다시 시작
                  </button>
                )}
              </div>
            </div>
          )}
          {modal === 'journey' && (
            <div className="journey-grid">
              {STAGES.map((s, i) => (
                <div key={s.en} className={i > stage ? 'undiscovered' : ''}>
                  <div
                    className="journey-art celestial-sprite"
                    style={atlasStyle(i, 4)}
                  />
                  <span className="eyebrow">PHASE 0{i + 1}</span>
                  <h3>{s.name}</h3>
                  <p>{i <= stage ? '발견 완료' : `${format(s.mass)} 질량`}</p>
                </div>
              ))}
            </div>
          )}
          {modal === 'complete' && (
            <div className="completion">
              <div
                className="completion-art celestial-sprite"
                style={atlasStyle(7, 4)}
              />
              <p>
                로봇 {robotsOwned}대 · 클릭 {format(game.clicks, 0)}회 · 혜성{' '}
                {game.comets}개
              </p>
              <button className="primary-button" onClick={() => setModal(null)}>
                계속 우주 키우기 <ArrowRight size={17} />
              </button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </main>
  );
}
