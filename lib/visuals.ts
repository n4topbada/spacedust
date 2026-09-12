import type { CSSProperties } from 'react';

export function celestialStyle(stage: number): CSSProperties {
  const expanded = stage >= 8;
  const index = expanded ? stage - 8 : stage;
  const columns = expanded ? 2 : 4;
  return {
    backgroundImage: `url('${expanded ? '/cosmos.png' : '/celestials.png'}')`,
    backgroundSize: `${columns * 100}% 200%`,
    backgroundPosition: `${((index % columns) / (columns - 1)) * 100}% ${Math.floor(index / columns) * 100}%`,
  };
}

export function equipmentStyle(index: number): CSSProperties {
  return {
    backgroundImage: "url('/equipment.png')",
    backgroundSize: '400% 400%',
    backgroundPosition: `${((index % 4) / 3) * 100}% ${(Math.floor(index / 4) / 3) * 100}%`,
  };
}
