'use client';
import { useEffect, useRef } from 'react';

export function Starfield({ reduced }: { reduced: boolean }) {
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
