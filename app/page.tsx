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
import { Input } from '@/components/ui/input';
import { ToolMarket } from '@/components/tool-market';
import { CraftingScreen } from '@/components/crafting-screen';
import { celestialStyle } from '@/lib/visuals';
import { Switch } from '@/components/ui/switch';
import { CelestialScene } from '@/components/celestial-scene';
import {
  STAGES,
  FINAL_STAGE,
  RANKS,
  normalizeName,
  ROBOTS,
  SAVE_KEY,
  freshState,
  stageIndex,
  production,
  clickPower,
  settle,
  collect,
  buyRobot,
  performAction,
  cometDelay,
  BACKUP_KEY,
  WORKSHOP_BACKUP_KEY,
  type GameAction,
  cometReward,
  claimComet,
  decodeSave,
  format,
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
    [saveStatus, setSaveStatus] = useState('Preparing autosave');
  const [nameDraft, setNameDraft] = useState('');
  const [screen, setScreen] = useState<'universe' | 'craft'>('universe');
  useEffect(() => {
    const sync = () =>
      setScreen(location.hash === '#craft' ? 'craft' : 'universe');
    sync();
    window.addEventListener('hashchange', sync);
    return () => window.removeEventListener('hashchange', sync);
  }, []);
  function navigateScreen(target: 'universe' | 'craft') {
    location.hash = target === 'craft' ? 'craft' : 'universe';
    setScreen(target);
  }
  const [pulse, setPulse] = useState(0),
    [confirmReset, setConfirmReset] = useState(false);
  const [capture, setCapture] = useState<{
    id: number;
    x: number;
    y: number;
    rare: boolean;
  } | null>(null);
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
          time: new Date().toLocaleTimeString('en-US', {
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
        log(`Evolved into ${name}`);
        notify(`${name} formed! Your universe has evolved.`);
        if (stageIndex(after.mass) === FINAL_STAGE && !before.completedAt)
          setModal('complete');
      }
      return after;
    },
    [log, notify],
  );
  const save = useCallback(() => {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(state.current));
      setSaveStatus('Autosaved');
    } catch {
      setSaveStatus('Check browser storage');
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
        if (JSON.parse(raw!).version < 4) {
          try {
            if (!localStorage.getItem(WORKSHOP_BACKUP_KEY))
              localStorage.setItem(WORKSHOP_BACKUP_KEY, raw!);
          } catch {
            /* Preserve the current game even if backup storage is full. */
          }
        }
        if (JSON.parse(raw!).version < 3) {
          try {
            if (!localStorage.getItem(BACKUP_KEY))
              localStorage.setItem(BACKUP_KEY, raw!);
          } catch {
            /* Migration can still preserve the live save if backup storage is full. */
          }
          log(`Legacy upgrades refunded: ${format(saved.legacyRefund)} dust`);
          later(
            () =>
              notify(
                `Research and crafting are now available. Refunded ${format(saved.legacyRefund)} dust from old upgrades. Growth now takes more mass.`,
              ),
            1200,
          );
        }
        const offline = initial.dust - saved.dust;
        if (offline >= 1 && now - saved.updatedAt > 30_000) {
          notify(
            `Welcome back! Your collectors gathered ${format(offline)} dust.`,
          );
          log(`Offline collection +${format(offline)}`);
        }
        if (!saved.completedAt && initial.completedAt) setModal('complete');
      } else if (raw)
        notify('Unable to read the save. Starting a new universe.');
      else
        initial.reducedMotion = matchMedia(
          '(prefers-reduced-motion: reduce)',
        ).matches;
    } catch {
      setSaveStatus('Saving is unavailable in this browser');
    }
    state.current = initial;
    setGame(initial);
    setNameDraft(initial.name);
    setReady(true);
    nextComet.current = now + 18_000;
    log(
      initial.mass
        ? 'Exploration resumed. Welcome back.'
        : 'Exploration started. Collect your first dust.',
    );
    const tick = setInterval(() => {
      apply((s) => s);
      const t = Date.now();
      if (document.hidden) return;
      if (cometRef.current && t > cometRef.current.until) {
        cometRef.current = null;
        setComet(null);
        nextComet.current = t + cometDelay(state.current);
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
  }, [apply, later, log, notify, save]);

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
      log(`${ROBOTS[i].name}: +${after.robots[i] - count} deployed`);
      save();
    }
  }
  function labAction(action: GameAction) {
    if (!ready) return;
    let message = '';
    const oldStarLevel = state.current.specialLevels[0];
    apply((s) => {
      const result = performAction(s, action);
      message = result.message;
      return result.state;
    });
    if (
      state.current.specialLevels[0] > oldStarLevel &&
      Number.isFinite(nextComet.current)
    ) {
      nextComet.current =
        Date.now() +
        (Math.max(0, nextComet.current - Date.now()) *
          (1 + oldStarLevel * 0.08)) /
          (1 + state.current.specialLevels[0] * 0.08);
    }
    tone('buy');
    notify(message);
    log(message);
    save();
  }
  function catchComet(event: MouseEvent<HTMLButtonElement>) {
    const c = cometRef.current;
    if (!c || Date.now() > c.until) return;
    const flight = event.currentTarget.getBoundingClientRect();
    const field = event.currentTarget.parentElement!.getBoundingClientRect();
    setCapture({
      id: c.id,
      x: flight.left - field.left + flight.width * 0.7,
      y: flight.top - field.top + flight.height * 0.56,
      rare: c.rare,
    });
    later(() => setCapture(null), 1300);
    cometRef.current = null;
    setComet(null);
    nextComet.current = Date.now() + cometDelay(state.current);
    const reward = cometReward(settle(state.current), c.rare);
    apply((s) => claimComet(s, c.id, c.rare));
    tone('comet');
    notify(
      `${c.rare ? 'Golden comet' : 'Comet'} captured! Dust +${format(reward)}`,
    );
    log(`Comet bonus +${format(reward)}`);
    save();
  }
  function reset() {
    const fresh = freshState();
    fresh.sound = game.sound;
    fresh.reducedMotion = game.reducedMotion;
    fresh.name = game.name;
    state.current = fresh;
    setGame(fresh);
    cometRef.current = null;
    setComet(null);
    nextComet.current = Date.now() + 18_000;
    setLogs([]);
    setConfirmReset(false);
    setModal(null);
    save();
    notify('A new universe has begun.');
  }
  function commitName() {
    const name = normalizeName(nameDraft);
    setNameDraft(name);
    apply((s) => ({ ...s, name }));
    save();
  }

  return (
    <main
      className={`game-shell expanded-console ${screen === 'craft' ? 'in-workshop' : ''} ${game.reducedMotion ? 'reduce-motion' : ''}`}
      style={{ '--stage-color': current.color } as CSSProperties}
      data-stage={stage}
    >
      <Starfield reduced={game.reducedMotion} />
      {screen === 'universe' ? (
        <>
          <header className="topbar">
            <div className="brand" aria-label="SPACE DUST">
              <span className="brand-mark">
                <Orbit size={29} strokeWidth={1.4} />
              </span>
              <span>
                SPACE<span className="brand-light">DUST</span>
                <small>SPACE DUST</small>
              </span>
            </div>
            <form
              className="universe-name"
              onSubmit={(event) => {
                event.preventDefault();
                commitName();
              }}
            >
              <label htmlFor="universe-name">Universe name</label>
              <Input
                id="universe-name"
                value={nameDraft}
                maxLength={48}
                placeholder="Name your universe"
                disabled={!ready}
                onChange={(event) => setNameDraft(event.target.value)}
                onBlur={commitName}
                autoComplete="off"
              />
              <button
                type="submit"
                aria-label="Save universe name"
                disabled={!ready}
              >
                <Check size={16} />
              </button>
            </form>
            <div
              className="mission-label rank-display"
              aria-label={`Growth rank ${stage + 1}, ${RANKS[stage]}`}
            >
              <span className="rank-number">
                {String(stage + 1).padStart(2, '0')}
              </span>
              <span className="rank-copy">
                <small>Growth rank</small>
                <strong>{RANKS[stage]}</strong>
              </span>
              <span className="header-segments" aria-hidden="true">
                {STAGES.map((s, i) => (
                  <i key={s.en} className={i <= stage ? 'lit' : ''} />
                ))}
              </span>
            </div>
            <div className="header-actions">
              <span className="save-state">
                <Check size={13} />
                {saveStatus}
              </span>
              <button
                className="icon-button"
                aria-label={game.sound ? 'Mute sound' : 'Enable sound'}
                title={game.sound ? 'Mute sound' : 'Enable sound'}
                onClick={() => {
                  apply((s) => ({ ...s, sound: !s.sound }));
                  save();
                }}
              >
                {game.sound ? <Volume2 size={18} /> : <VolumeX size={18} />}
              </button>
              <button
                className="icon-button"
                aria-label="How to play"
                onClick={() => setModal('help')}
              >
                <CircleHelp size={18} />
              </button>
              <button
                className="icon-button"
                aria-label="Settings"
                onClick={() => setModal('settings')}
              >
                <Settings2 size={18} />
              </button>
            </div>
          </header>
          <div className="game-layout">
            <section className="universe" aria-label="Universe collection area">
              <div className="universe-top">
                <span className="eyebrow">
                  <span className="live-dot" /> DEEP SPACE · SECTOR 001
                </span>
                <span className="coordinates">
                  RA 23h 08m <span>DEC +61° 32′</span>
                </span>
              </div>
              <div className="resource-display">
                <span className="resource-label">AVAILABLE DUST</span>
                <h1 data-testid="dust">
                  {format(game.dust)}
                  <span> dust</span>
                </h1>
                <div className="rate-pills">
                  <span>
                    <Hand size={14} /> Per click <b>+{format(power)}</b>
                  </span>
                  <span>
                    <Zap size={14} /> Per second <b>+{format(dps)}</b>
                  </span>
                </div>
              </div>
              <div className={`celestial-area stage-${stage}`}>
                <CelestialScene
                  stage={stage}
                  progress={progress}
                  pulse={pulse}
                  comets={game.comets}
                  robots={game.robots}
                  reduced={game.reducedMotion}
                />
                <div className="target-reticle" aria-hidden="true">
                  <i />
                  <i />
                  <i />
                  <i />
                </div>
                <span className="orbit-tag">
                  <Crosshair size={12} /> MASS {format(game.mass)}
                </span>
                <div className="scene-identity" aria-hidden="true">
                  <span className="eyebrow">CELESTIAL SIGNATURE</span>
                  <strong>{current.en}</strong>
                  <span className="identity-rule" />
                  <span>
                    Target <b>SD–{String(stage + 1).padStart(3, '0')}</b>
                  </span>
                  <span>
                    Growth stage{' '}
                    <b>
                      {String(stage + 1).padStart(2, '0')} / {STAGES.length}
                    </b>
                  </span>
                  <div className="signal-wave">
                    {Array.from({ length: 22 }, (_, i) => (
                      <i
                        key={i}
                        style={
                          {
                            '--bar': `${10 + ((i * 13 + stage * 7) % 24)}px`,
                            '--delay': `${i * -0.13}s`,
                          } as CSSProperties
                        }
                      />
                    ))}
                  </div>
                </div>
                <div className="network-readout">
                  <span className="eyebrow">
                    <Radio size={12} /> Collection network
                  </span>
                  <div className="network-count">
                    {robotsOwned}
                    <small> UNITS</small>
                  </div>
                  <div
                    className="network-bars"
                    aria-label="Owned units by tool"
                  >
                    {ROBOTS.map((robot, i) => (
                      <span
                        key={robot.id}
                        title={`${robot.name} ${game.robots[i]} units`}
                      >
                        <i
                          style={{
                            height: `${Math.min(100, 8 + Math.log2(game.robots[i] + 1) * 15)}%`,
                          }}
                          className={game.robots[i] > 0 ? 'online' : ''}
                        />
                        <b>{String(i + 1).padStart(2, '0')}</b>
                      </span>
                    ))}
                  </div>
                  <span className="network-status">
                    <span className="live-dot" />
                    {robotsOwned > 0
                      ? 'Collection network online'
                      : 'Awaiting your first collector'}
                  </span>
                </div>
                <button
                  className="collect-target"
                  onClick={tap}
                  disabled={!ready}
                  aria-label={`Collect dust, per click ${format(power)}`}
                >
                  <span className="collect-focus" aria-hidden="true" />
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
                <span className="scale-mark">
                  {stage === 0
                    ? 'PARTICLE FIELD DETECTED'
                    : stage < 4
                      ? 'GRAVITATIONAL FIELD FORMING'
                      : stage < 7
                        ? 'HIGH ENERGY DENSITY'
                        : stage === 7
                          ? 'EVENT HORIZON DETECTED'
                          : stage < 11
                            ? 'GALACTIC STRUCTURE DETECTED'
                            : 'UNIVERSAL STRUCTURE MAPPED'}
                </span>
              </div>
              <div key={stage} className="celestial-caption stage-arrival">
                <span className="stage-tag">
                  PHASE {String(stage + 1).padStart(2, '0')}
                </span>
                <h2>{current.name}</h2>
                <p>{current.description}</p>
                <div className="tap-hint">
                  <Hand size={15} /> Click to collect cosmic dust{' '}
                  <span>+{format(power)}</span>
                </div>
              </div>
              <div className="evolution-panel">
                <div className="evolution-heading">
                  <span>
                    <Orbit size={16} /> Next evolution{' '}
                    <strong>{next?.name ?? 'A new beginning'}</strong>
                  </span>
                  <span>
                    {next
                      ? `${format(game.mass)} / ${format(next.mass)}`
                      : 'COMPLETE'}{' '}
                    <b>{Math.floor(progress)}%</b>
                  </span>
                </div>
                <Progress
                  value={progress}
                  aria-label="Progress to next evolution"
                />
                <div className="evolution-foot">
                  <span>
                    {next
                      ? `Collect ${format(Math.max(0, next.mass - game.mass))} more dust to evolve`
                      : 'The universe is complete. Your collectors can keep going.'}
                  </span>
                  <button onClick={() => setModal('journey')}>
                    Growth journey <ArrowRight size={13} />
                  </button>
                </div>
              </div>
              {comet && (
                <button
                  className={`comet ${comet.rare ? 'rare' : ''}`}
                  key={comet.id}
                  style={{ top: `${comet.lane}%` }}
                  onClick={catchComet}
                  aria-label={
                    comet.rare ? 'Capture golden comet' : 'Capture comet'
                  }
                >
                  <span className="comet-flight-line" aria-hidden="true" />
                  <span className="comet-sprite" aria-hidden="true" />
                  <span className="comet-core-ring" aria-hidden="true" />
                  <span className="comet-sparkles" aria-hidden="true">
                    {[0, 1, 2, 3, 4, 5].map((i) => (
                      <i key={i} style={{ '--i': i } as CSSProperties} />
                    ))}
                  </span>
                </button>
              )}
              {capture && (
                <div
                  key={capture.id}
                  className={`comet-capture ${capture.rare ? 'golden' : ''}`}
                  style={{ left: capture.x, top: capture.y }}
                  aria-hidden="true"
                >
                  <span />
                  {Array.from({ length: 18 }, (_, i) => (
                    <i
                      key={i}
                      style={
                        {
                          '--angle': `${i * 20}deg`,
                          '--distance': `${45 + (i % 4) * 18}px`,
                        } as CSSProperties
                      }
                    />
                  ))}
                </div>
              )}
            </section>
            <ToolMarket
              game={game}
              quantity={quantity}
              onQuantity={setQuantity}
              onPurchase={purchase}
              onAction={labAction}
              onCraft={() => navigateScreen('craft')}
            />
          </div>
          <section className="bottom-deck">
            <div className="journey-strip">
              <div className="deck-heading">
                <span className="eyebrow">A UNIVERSE IN THE MAKING</span>
                <button onClick={() => setModal('journey')}>
                  Growth journey <ChevronRight size={14} />
                </button>
              </div>
              <div className="phase-track">
                {STAGES.map((s, i) => (
                  <button
                    className={`phase-stop ${i === stage ? 'current' : ''} ${i < stage ? 'achieved' : ''}`}
                    key={s.en}
                    onClick={() => setModal('journey')}
                    aria-label={`${s.name}, ${i <= stage ? 'reached' : format(s.mass) + ' mass required'}`}
                  >
                    <span className="phase-node">
                      <span
                        className="phase-thumbnail celestial-sprite"
                        style={celestialStyle(i)}
                        aria-hidden="true"
                      />
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
                <span className="eyebrow">MISSION LOG</span>
                <Radio size={13} />
              </div>
              {logs.slice(0, 2).map((item) => (
                <div className="log-line" key={item.id}>
                  <time>{item.time}</time>
                  <span title={item.text}>{item.text}</span>
                </div>
              ))}
            </div>
          </section>
        </>
      ) : (
        <CraftingScreen
          game={game}
          onAction={labAction}
          onBack={() => navigateScreen('universe')}
        />
      )}
      <footer className="footer">
        <span>
          <span className="live-dot" /> ALL SYSTEMS NOMINAL
        </span>
        <span>A universe begins with one click.</span>
        <span>
          <Disc3 size={12} /> Total mass {format(game.mass)}
        </span>
      </footer>
      {notice && (
        <output className="game-notice" aria-live="polite">
          <Sparkles size={18} />
          <span>{notice}</span>
          <button
            aria-label="Dismiss notification"
            onClick={() => setNotice('')}
          >
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
          className={`game-dialog expanded-dialog ${modal === 'journey' ? 'journey-dialog' : ''}`}
        >
          <DialogTitle>
            {modal === 'settings'
              ? 'Universe settings'
              : modal === 'journey'
                ? 'From dust to infinity'
                : modal === 'complete'
                  ? 'Your universe is complete'
                  : 'How to grow your universe'}
          </DialogTitle>
          <DialogDescription>
            {modal === 'settings'
              ? 'Set your sound and motion preferences.'
              : modal === 'journey'
                ? 'Your celestial body evolves as total mass increases.'
                : modal === 'complete'
                  ? 'From dust to galaxies to an entire universe. All twelve stages are complete.'
                  : 'Collect dust, deploy robotic tools and discover new celestial forms.'}
          </DialogDescription>
          {modal === 'help' && (
            <div className="help-content">
              <p>
                <Hand />
                <span>
                  <b>Click the celestial body to collect dust.</b>Critical
                  clicks give ×5 dust. You can also focus it with Tab and press
                  Enter or Space.
                </span>
              </p>
              <p>
                <Bot />
                <span>
                  <b>Click a tool to purchase it.</b>Collectors produce dust
                  automatically. Research improves tools and manual clicks.
                  Spending dust never reduces your total growth mass.
                </span>
              </p>
              <p>
                <Sparkles />
                <span>
                  <b>Catch passing comets.</b>Rewards scale with your growth.
                  Golden comets give ×3 rewards. Each comet stays for 14
                  seconds.
                </span>
              </p>
              <p>
                <Telescope />
                <span>
                  <b>Your game saves in this browser.</b>Collectors earn up to 8
                  hours of offline production. Saves do not sync across devices.
                </span>
              </p>
              <p>
                <Orbit />
                <span>
                  <b>Open Craft to build constellations.</b>Each star consumes
                  the displayed materials. Complete 5, 10 and 15 constellations
                  to unlock the last three tools. Growth rewards add mass, not
                  spendable dust.
                </span>
              </p>
              <small>
                Celestial evolution is a fantasy progression created for this
                game.
              </small>
            </div>
          )}
          {modal === 'settings' && (
            <div className="settings-content">
              <label htmlFor="sound-toggle">
                <span>
                  <Volume2 size={18} /> Sound effects
                </span>
                <Switch
                  id="sound-toggle"
                  checked={game.sound}
                  onCheckedChange={(checked) => {
                    apply((s) => ({ ...s, sound: checked }));
                    save();
                  }}
                  aria-label="Sound effects"
                />
              </label>
              <label htmlFor="motion-toggle">
                <span>
                  <AudioLines size={18} /> Reduce motion
                </span>
                <Switch
                  id="motion-toggle"
                  checked={game.reducedMotion}
                  onCheckedChange={(checked) => {
                    apply((s) => ({ ...s, reducedMotion: checked }));
                    save();
                  }}
                  aria-label="Reduce motion"
                />
              </label>
              <div className="stats-grid">
                <div>
                  <span>Total clicks</span>
                  <b>{format(game.clicks, 0)}</b>
                </div>
                <div>
                  <span>Comets captured</span>
                  <b>{game.comets}</b>
                </div>
                <div>
                  <span>Collectors</span>
                  <b>{robotsOwned}</b>
                </div>
                <div>
                  <span>Time explored</span>
                  <b>{Math.floor(game.playSeconds / 60)} min</b>
                </div>
              </div>
              <button
                className="secondary-button"
                onClick={() => {
                  save();
                  notify('Your universe has been saved.');
                }}
              >
                Save now
              </button>
              <div className="reset-area">
                {confirmReset ? (
                  <>
                    <p>
                      All dust, tools and progress will be erased. Start a new
                      universe?
                    </p>
                    <div>
                      <button className="danger-button" onClick={reset}>
                        Erase progress and restart
                      </button>
                      <button
                        className="secondary-button"
                        onClick={() => setConfirmReset(false)}
                      >
                        Cancel
                      </button>
                    </div>
                  </>
                ) : (
                  <button onClick={() => setConfirmReset(true)}>
                    Start over
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
                    style={celestialStyle(i)}
                  />
                  <span className="eyebrow">
                    PHASE {String(i + 1).padStart(2, '0')}
                  </span>
                  <h3>{s.name}</h3>
                  <p>{i <= stage ? 'Discovered' : `${format(s.mass)} mass`}</p>
                </div>
              ))}
            </div>
          )}
          {modal === 'complete' && (
            <div className="completion">
              <div
                className="completion-art celestial-sprite"
                style={celestialStyle(FINAL_STAGE)}
              />
              <p>
                {robotsOwned} tools · {format(game.clicks, 0)} clicks ·{' '}
                {game.comets} comets
              </p>
              <button className="primary-button" onClick={() => setModal(null)}>
                Keep growing <ArrowRight size={17} />
              </button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </main>
  );
}
