'use client';

import { memo, useEffect, useRef } from 'react';

type SceneProps = {
  stage: number;
  progress: number;
  pulse: number;
  comets: number;
  robots: number[];
  reduced: boolean;
};
type Spark = {
  angle: number;
  radius: number;
  life: number;
  speed: number;
  golden: boolean;
};
const TAU = Math.PI * 2;
const COLORS = [
  '#f5ce8c',
  '#ccb497',
  '#b8d2e5',
  '#ff9461',
  '#75d5ff',
  '#ffd378',
  '#ff8855',
  '#df9bff',
  '#80cfff',
  '#b4a4ff',
  '#e5a7ed',
  '#a8f2dd',
];
const SIZES = [166, 190, 218, 244, 266, 288, 312, 318, 302, 314, 324, 330];

/** The animation clock is independent of the economy and never mutates game state. */
export const CelestialScene = memo(function CelestialScene(props: SceneProps) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const settings = useRef(props);
  const redraw = useRef<(() => void) | null>(null);
  useEffect(() => {
    settings.current = props;
    if (props.reduced) redraw.current?.();
  }, [props]);

  useEffect(() => {
    const el = canvas.current,
      context = el?.getContext('2d', { alpha: true });
    if (!el || !context) return;
    const ctx: CanvasRenderingContext2D = context;
    let width = 1,
      height = 1,
      dpr = 1,
      frame = 0,
      lastTime = 0,
      elapsed = 0;
    let lastStage = settings.current.stage,
      lastPulse = settings.current.pulse;
    let lastComets = settings.current.comets,
      transition = 0,
      impact = 0;
    let disposed = false;
    const sparks: Spark[] = [];
    const atlas = new Image(),
      cosmos = new Image(),
      robots = new Image();
    const robotSprites = document.createElement('canvas');
    let robotsReady = false;
    const motes = Array.from({ length: 360 }, (_, i) => {
      const seed = Math.sin(i * 127.1 + 311.7) * 43758.5453;
      const random = seed - Math.floor(seed);
      return {
        angle: i * 2.399963,
        seed: random,
        size: 0.45 + random * 1.65,
        orbit: 40 + random * 235,
      };
    });
    const glowSprites = COLORS.map((color) => {
      const dot = document.createElement('canvas');
      dot.width = 32;
      dot.height = 32;
      const c = dot.getContext('2d');
      if (c) {
        const g = c.createRadialGradient(16, 16, 0, 16, 16, 16);
        g.addColorStop(0, '#ffffff');
        g.addColorStop(0.16, color);
        g.addColorStop(0.42, `${color}75`);
        g.addColorStop(1, `${color}00`);
        c.fillStyle = g;
        c.fillRect(0, 0, 32, 32);
      }
      return dot;
    });
    const dot = (
      x: number,
      y: number,
      radius: number,
      color: string,
      alpha = 1,
    ) => {
      ctx.globalAlpha = alpha;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, TAU);
      ctx.fill();
      ctx.globalAlpha = 1;
    };
    const glow = (radius: number, color: string, opacity: number) => {
      const g = ctx.createRadialGradient(0, 0, radius * 0.15, 0, 0, radius);
      g.addColorStop(0, `${color}00`);
      g.addColorStop(
        0.35,
        `${color}${Math.round(opacity * 255)
          .toString(16)
          .padStart(2, '0')}`,
      );
      g.addColorStop(1, `${color}00`);
      ctx.fillStyle = g;
      ctx.fillRect(-radius, -radius, radius * 2, radius * 2);
    };
    const ellipse = (
      r: number,
      ratio: number,
      rotation: number,
      color: string,
      start = 0,
      end = TAU,
      line = 1,
    ) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = line;
      ctx.beginPath();
      ctx.ellipse(0, 0, r, r * ratio, rotation, start, end);
      ctx.stroke();
    };
    const body = (stage: number, size: number, rotation: number, alpha = 1) => {
      const source = stage < 8 ? atlas : cosmos;
      if (!source.complete || !source.naturalWidth) return;
      const columns = stage < 8 ? 4 : 2;
      const index = stage < 8 ? stage : stage - 8;
      const sw = source.naturalWidth / columns,
        sh = source.naturalHeight / 2;
      ctx.save();
      ctx.rotate(rotation);
      ctx.globalAlpha = alpha;
      ctx.drawImage(
        source,
        (index % columns) * sw,
        Math.floor(index / columns) * sh,
        sw,
        sh,
        -size / 2,
        -size / 2,
        size,
        size,
      );
      ctx.restore();
    };

    function draw(now: number) {
      const p = settings.current;
      const dt = p.reduced
        ? 0
        : Math.min(0.05, lastTime ? (now - lastTime) / 1000 : 0);
      lastTime = now;
      elapsed += dt;
      const t = p.reduced ? 8 : elapsed;
      const stage = p.stage,
        color = COLORS[stage];
      const size = SIZES[stage] + Math.min(p.progress, 100) * 0.22;
      if (stage !== lastStage) {
        transition = p.reduced ? 0 : 1.8;
        lastStage = stage;
      }
      if (p.pulse !== lastPulse) {
        impact = 1;
        lastPulse = p.pulse;
        if (!p.reduced)
          for (let i = 0; i < 38; i++)
            sparks.push({
              angle: i * 2.4 + t,
              radius: 160 + (i % 7) * 16,
              life: 1,
              speed: 105 + (i % 8) * 16,
              golden: false,
            });
      }
      if (p.comets !== lastComets) {
        lastComets = p.comets;
        impact = 1.7;
        if (!p.reduced)
          for (let i = 0; i < 90; i++)
            sparks.push({
              angle: i * 2.4,
              radius: 70 + (i % 11) * 8,
              life: 1.5,
              speed: -55 - (i % 7) * 18,
              golden: true,
            });
      }
      if (sparks.length > 220) sparks.splice(0, sparks.length - 220);
      impact = Math.max(0, impact - dt * 2);
      transition = Math.max(0, transition - dt);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);
      const scale = Math.min(width / 650, height / 390);
      ctx.translate(width / 2, height / 2);
      ctx.scale(scale, scale);
      ctx.globalCompositeOperation = 'source-over';
      glow(stage >= 5 ? 225 : 190, color, stage >= 5 ? 0.14 : 0.08);

      // Ambient meteors are scenery; bonus comets remain separate clickable objects.
      for (let i = 0; i < 5; i++) {
        const phase = (t * (0.1 + i * 0.008) + i * 0.23) % 1;
        const x = -340 + phase * 700 + Math.sin(i * 19) * 70;
        const y = -225 + phase * 440 - i * 21;
        const alpha = Math.sin(phase * Math.PI) * 0.4;
        const trail = ctx.createLinearGradient(x - 48, y - 29, x, y);
        trail.addColorStop(0, '#b9dfef00');
        trail.addColorStop(1, `rgba(195,231,245,${alpha})`);
        ctx.strokeStyle = trail;
        ctx.lineWidth = 1 + (i % 2) * 0.5;
        ctx.beginPath();
        ctx.moveTo(x - 48, y - 29);
        ctx.lineTo(x, y);
        ctx.stroke();
        ctx.save();
        ctx.translate(x, y);
        body(2, 10 + (i % 3) * 3, t * 0.2, alpha + 0.1);
        ctx.restore();
      }

      // Fine orbital dust: long soft curves and particles describe the gravitational field.
      ctx.save();
      ctx.rotate(-0.23);
      for (let ring = 0; ring < 3; ring++) {
        const r = 174 + ring * 33;
        ellipse(
          r,
          0.39 + ring * 0.09,
          0,
          `${color}${ring === 0 ? '22' : '10'}`,
        );
        ellipse(
          r,
          0.39 + ring * 0.09,
          0,
          `${color}62`,
          t * 0.11 + ring * 2.1,
          t * 0.11 + ring * 2.1 + 0.2,
          1.1,
        );
      }
      ctx.restore();

      // Background drift becomes faster and more curved as the object grows.
      ctx.globalCompositeOperation = 'screen';
      for (let i = 0; i < 120; i++) {
        const m = motes[i],
          travel =
            (m.seed + t * (stage === 7 ? 0.1 : 0.018 + stage * 0.005)) % 1;
        const r = 282 - travel * (stage === 7 ? 252 : 170);
        const a =
          m.angle +
          t * (0.035 + stage * 0.012) +
          travel * (stage === 7 ? 4 : 0.9);
        const x = Math.cos(a) * r,
          y = Math.sin(a) * r * 0.56;
        const alpha = Math.sin(travel * Math.PI) * (stage === 0 ? 0.7 : 0.45);
        ctx.strokeStyle = `${color}${Math.round(alpha * 170)
          .toString(16)
          .padStart(2, '0')}`;
        ctx.lineWidth = m.size * 0.65;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(
          x + Math.cos(a - 0.5) * (stage === 7 ? 14 : 3),
          y + Math.sin(a - 0.5) * 4,
        );
        ctx.stroke();
        if (i % 7 === 0) {
          ctx.globalAlpha = alpha;
          ctx.drawImage(glowSprites[stage], x - 5, y - 5, 10, 10);
        }
      }
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';

      if (stage === 0) {
        // No static dust cutout: hundreds of individual grains orbit, drift and condense.
        ctx.globalCompositeOperation = 'screen';
        glow(130, '#fbc876', 0.12 + impact * 0.05);
        for (let i = 0; i < motes.length; i++) {
          const m = motes[i],
            cloud = Math.pow(m.seed, 0.62) * (94 + p.progress * 0.14);
          const a = m.angle + t * (0.11 + (1 - m.seed) * 0.28);
          const clump = 0.72 + Math.sin(a * 3 + t * 0.2) * 0.19;
          const r = cloud * clump * (1 - impact * 0.12);
          const x = Math.cos(a) * r + Math.sin(t * 0.55 + m.angle) * 6;
          const y =
            Math.sin(a) * r * 0.63 + Math.cos(m.angle * 1.4 + t * 0.3) * 10;
          const alpha = 0.35 + (Math.sin(t * 1.4 + m.angle) + 1) * 0.26;
          dot(x, y, m.size * 0.75, i % 5 ? '#e9ba76' : '#eaf7ef', alpha);
          if (i % 9 === 0) {
            ctx.globalAlpha = alpha * 0.85;
            ctx.drawImage(glowSprites[0], x - 7, y - 7, 14, 14);
          }
        }
        ctx.globalAlpha = 1;
        for (let i = 0; i < 6; i++) {
          const a = t * 0.12 + i * 2.4,
            r = 20 + i * 8;
          ctx.drawImage(
            glowSprites[0],
            Math.cos(a) * r - 12,
            Math.sin(a) * r * 0.6 - 12,
            24,
            24,
          );
        }
        ctx.globalCompositeOperation = 'source-over';
      } else {
        const rotation =
          stage < 3
            ? t * (stage === 1 ? 0.055 : 0.09)
            : stage === 7
              ? -0.1 + Math.sin(t * 0.13) * 0.025
              : stage === 8
                ? t * 0.032
                : stage === 10
                  ? t * 0.009
                  : Math.sin(t * 0.16) * 0.025;
        const breath =
          1 +
          Math.sin(t * (stage === 5 || stage === 6 ? 1.8 : 0.9)) *
            (stage === 5 || stage === 6 ? 0.025 : 0.008) -
          impact * 0.018;
        if (stage === 7) {
          glow(195, '#b176fb', 0.15);
          ellipse(116, 0.6, -0.25, '#d19dff20', 0, TAU, 17);
        }
        body(stage, size * breath, rotation);
        ctx.globalCompositeOperation = 'screen';
        if (stage < 3) {
          for (let i = 0; i < 26; i++) {
            const m = motes[i],
              a = m.angle + t * (0.07 + m.seed * 0.16),
              r = 86 + m.seed * 74;
            const x = Math.cos(a) * r,
              y = Math.sin(a) * r * 0.63;
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(a + t * 0.1);
            ctx.fillStyle = i % 3 ? '#9b90816b' : '#f0d1a299';
            ctx.fillRect(-m.size, -m.size, m.size * 2.4, m.size * 1.6);
            ctx.restore();
          }
        } else if (stage === 3 || stage === 4) {
          const r = size * 0.315;
          ellipse(
            r,
            1,
            0,
            stage === 3 ? '#ff9d5755' : '#71dfff77',
            -1.2,
            1.5,
            2,
          );
          ellipse(
            r + 3,
            1,
            0,
            stage === 3 ? '#ffb26122' : '#61bcff28',
            0,
            TAU,
            8,
          );
          if (stage === 3) {
            for (let i = 0; i < 14; i++) {
              const a = i * 2.4 + t * 0.09,
                rr = r * (0.3 + motes[i].seed * 0.62);
              const x = Math.cos(a) * rr,
                y = Math.sin(a) * rr;
              ctx.globalAlpha = 0.3 + Math.sin(t * 2 + i) * 0.2;
              ctx.drawImage(glowSprites[3], x - 6, y - 6, 12, 12);
            }
          } else {
            // Sweeping translucent cloud bands, constrained to the visible planetary disc.
            ctx.save();
            ctx.beginPath();
            ctx.arc(0, 0, r * 0.91, 0, TAU);
            ctx.clip();
            for (let i = 0; i < 5; i++) {
              ctx.globalAlpha = 0.14;
              ctx.strokeStyle = '#d6f3ff';
              ctx.lineWidth = 2.5;
              ctx.beginPath();
              const yy = -55 + i * 24;
              ctx.ellipse(
                Math.sin(t * 0.22 + i) * 30,
                yy,
                75,
                8,
                -0.18,
                t * 0.13 + i,
                t * 0.13 + i + 1.8,
              );
              ctx.stroke();
            }
            ctx.restore();
            const a = t * 0.23,
              x = Math.cos(a) * 149,
              y = Math.sin(a) * 47;
            ellipse(149, 47 / 149, 0, '#7fc8ee24');
            dot(x, y, 5, '#abbecb');
            dot(x - 1.3, y - 1.3, 2, '#e0edf0');
          }
        } else if (stage < 7) {
          // Solar prominences and a breathing corona, rather than a rotating flat picture.
          const r = size * 0.325;
          for (let i = 0; i < 42; i++) {
            const a = (i / 42) * TAU + t * 0.025,
              flicker = Math.sin(t * 1.5 + i * 2.1) * 0.5 + 0.5;
            const len = 12 + flicker * (stage === 6 ? 42 : 27);
            ctx.strokeStyle = `${color}${Math.round(25 + flicker * 70)
              .toString(16)
              .padStart(2, '0')}`;
            ctx.lineWidth = 1 + flicker * 2;
            ctx.beginPath();
            ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
            ctx.quadraticCurveTo(
              Math.cos(a + 0.07) * (r + len),
              Math.sin(a + 0.07) * (r + len),
              Math.cos(a + 0.15) * r,
              Math.sin(a + 0.15) * r,
            );
            ctx.stroke();
          }
          for (let i = 0; i < 4; i++) {
            const a = t * 0.055 + i * 1.7;
            ctx.save();
            ctx.rotate(a);
            ctx.strokeStyle = stage === 6 ? '#ffba8159' : '#ffe3a369';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.ellipse(r - 2, 0, 22 + Math.sin(t + i) * 5, 10, 0.3, -1.5, 1.5);
            ctx.stroke();
            ctx.restore();
          }
        } else if (stage === 7) {
          // Luminous material accelerates around the event horizon.
          ctx.save();
          ctx.rotate(-0.24);
          for (let i = 0; i < 120; i++) {
            const m = motes[i],
              a = m.angle + t * (0.25 + (1 - m.seed) * 0.85),
              r = 62 + m.seed * 78;
            const x = Math.cos(a) * r,
              y = Math.sin(a) * r * 0.31;
            ctx.globalAlpha = 0.22 + m.seed * 0.32;
            ctx.strokeStyle = i % 4 ? '#ffd1a5' : '#ceaaff';
            ctx.lineWidth = 0.7 + m.seed;
            ctx.beginPath();
            ctx.ellipse(0, 0, r, r * 0.31, 0, a, a + 0.1 + m.seed * 0.12);
            ctx.stroke();
            if (i % 15 === 0) ctx.drawImage(glowSprites[5], x - 4, y - 4, 8, 8);
          }
          ctx.restore();
          ctx.globalCompositeOperation = 'source-over';
          const core = ctx.createRadialGradient(0, 0, 23, 0, 0, 37);
          core.addColorStop(0, '#030309');
          core.addColorStop(0.78, '#05040bd9');
          core.addColorStop(1, '#05040b00');
          ctx.fillStyle = core;
          ctx.beginPath();
          ctx.arc(0, 0, 37, 0, TAU);
          ctx.fill();
        } else {
          // Light travels over the generated large-scale structure with stage-specific motion.
          const count = stage === 8 ? 90 : stage === 9 ? 110 : 170;
          for (let i = 0; i < count; i++) {
            const m = motes[i];
            const radius = 28 + Math.sqrt(m.seed) * (stage === 11 ? 112 : 120);
            const angle = m.angle + t * (stage === 8 ? 0.09 : 0.022);
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius * (stage === 8 ? 0.86 : 0.9);
            ctx.globalAlpha =
              (0.22 + (Math.sin(t * 1.2 + i) + 1) * 0.2) * (i % 7 ? 0.6 : 1);
            const size = i % 7 ? 4 : 10;
            ctx.drawImage(
              glowSprites[stage],
              x - size / 2,
              y - size / 2,
              size,
              size,
            );
          }
          ctx.globalAlpha = 1;
          if (stage === 9) {
            for (let i = 0; i < 4; i++) {
              const a = (i * Math.PI) / 2 + 0.65;
              const r = 75 + Math.sin(t * 0.3 + i) * 5;
              ctx.globalAlpha = 0.25 + Math.sin(t + i) * 0.15;
              ctx.drawImage(
                glowSprites[8],
                Math.cos(a) * r - 20,
                Math.sin(a) * r - 20,
                40,
                40,
              );
            }
          } else if (stage === 10 || stage === 11) {
            for (let i = 0; i < 3; i++) {
              const expansion = (t * 0.08 + i / 3) % 1;
              ellipse(
                100 + expansion * 73,
                stage === 11 ? 1 : 0.82,
                -0.2,
                `${color}${Math.round((1 - expansion) * 35)
                  .toString(16)
                  .padStart(2, '0')}`,
                0,
                TAU,
                1.2,
              );
            }
          }
        }
        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = 'source-over';
      }

      // Orbiting helpers are actual purchased robot sprites, up to six visible silhouettes.
      if (robotsReady) {
        const active = p.robots
          .flatMap((count, i) => (count > 0 ? [i] : []))
          .slice(-6);
        active.forEach((kind, i) => {
          const a = t * (0.15 + i * 0.035) + i * 2.1,
            r = 185 + i * 9;
          const x = Math.cos(a) * r,
            y = Math.sin(a) * r * 0.55;
          ctx.globalCompositeOperation = 'screen';
          ctx.strokeStyle = '#92e9d33b';
          ctx.lineWidth = 0.7;
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x * 0.55, y * 0.55);
          ctx.stroke();
          const sw = robots.naturalWidth / 4,
            sh = robots.naturalHeight / 4;
          ctx.drawImage(
            robotSprites,
            (kind % 4) * sw,
            Math.floor(kind / 4) * sh,
            sw,
            sh,
            x - 21,
            y - 21,
            42,
            42,
          );
          ctx.drawImage(glowSprites[4], x - 3, y + 10, 6, 16);
          ctx.globalCompositeOperation = 'source-over';
        });
      }
      ctx.globalCompositeOperation = 'screen';
      for (let i = sparks.length - 1; i >= 0; i--) {
        const s = sparks[i];
        s.life -= dt * 1.4;
        s.radius -= s.speed * dt;
        s.angle += dt * 0.65;
        if (s.life <= 0 || s.radius < 12) {
          sparks.splice(i, 1);
          continue;
        }
        const x = Math.cos(s.angle) * s.radius,
          y = Math.sin(s.angle) * s.radius * 0.65;
        ctx.globalAlpha = Math.min(1, s.life);
        ctx.strokeStyle = s.golden ? '#ffde9c' : '#bdf9ed';
        ctx.lineWidth = 1.3;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + Math.cos(s.angle) * 12, y + Math.sin(s.angle) * 8);
        ctx.stroke();
        ctx.drawImage(glowSprites[s.golden ? 5 : stage], x - 5, y - 5, 10, 10);
      }
      ctx.globalAlpha = 1;
      if (impact > 0 && !p.reduced) {
        const r = 80 + (1 - Math.min(impact, 1)) * 115;
        ellipse(
          r,
          0.66,
          -0.2,
          `rgba(180,255,230,${Math.min(impact, 1) * 0.45})`,
          0,
          TAU,
          1.3,
        );
      }
      if (transition > 0) {
        const phase = 1 - transition / 1.8;
        ellipse(
          50 + phase * 340,
          0.73,
          0,
          `rgba(214,255,240,${(1 - phase) * 0.65})`,
          0,
          TAU,
          2.5,
        );
        ellipse(
          30 + phase * 260,
          1,
          0,
          `rgba(170,216,255,${(1 - phase) * 0.25})`,
          0,
          TAU,
          10,
        );
      }
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;
    }
    function loop(now: number) {
      if (disposed || document.hidden) {
        frame = 0;
        return;
      }
      if (now - lastTime >= 1000 / 45 || !lastTime) draw(now);
      frame = settings.current.reduced ? 0 : requestAnimationFrame(loop);
    }
    const repaint = () => {
      if (disposed) return;
      if (settings.current.reduced) {
        cancelAnimationFrame(frame);
        frame = 0;
        draw(performance.now());
      } else if (!frame && !document.hidden) {
        lastTime = 0;
        frame = requestAnimationFrame(loop);
      }
    };
    redraw.current = repaint;
    const resize = () => {
      width = el.clientWidth;
      height = el.clientHeight;
      dpr = Math.min(devicePixelRatio, 1.75);
      el.width = Math.round(width * dpr);
      el.height = Math.round(height * dpr);
      draw(performance.now());
      repaint();
    };
    atlas.onload = repaint;
    cosmos.onload = repaint;
    robots.onload = () => {
      if (disposed) return;
      robotSprites.width = robots.naturalWidth;
      robotSprites.height = robots.naturalHeight;
      const spriteContext = robotSprites.getContext('2d');
      if (!spriteContext) return;
      spriteContext.drawImage(robots, 0, 0);
      robotsReady = true;
      repaint();
    };
    atlas.src = '/celestials.png';
    cosmos.src = '/cosmos.png';
    robots.src = '/equipment.png';
    const observer = new ResizeObserver(resize);
    observer.observe(el);
    resize();
    const onVisibility = () => {
      if (document.hidden) {
        cancelAnimationFrame(frame);
        frame = 0;
      } else repaint();
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      observer.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
      atlas.onload = null;
      cosmos.onload = null;
      robots.onload = null;
      redraw.current = null;
    };
  }, []);

  useEffect(() => {
    redraw.current?.();
  }, [props.reduced]);
  return <canvas ref={canvas} className="celestial-scene" aria-hidden="true" />;
});
