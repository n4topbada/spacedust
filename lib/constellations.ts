// Interactive crafting diagrams, one distinct arrangement per constellation.
export const CONSTELLATION_MAPS = [
  {
    points: [
      [150, 20],
      [60, 150],
      [240, 150],
    ],
    edges: [
      [0, 1],
      [1, 2],
      [2, 0],
    ],
  },
  {
    points: [
      [50, 35],
      [150, 155],
      [255, 45],
    ],
    edges: [
      [0, 1],
      [1, 2],
    ],
  },
  {
    points: [
      [40, 145],
      [165, 30],
      [260, 85],
    ],
    edges: [
      [0, 1],
      [1, 2],
      [0, 2],
    ],
  },
  {
    points: [
      [35, 90],
      [150, 25],
      [255, 140],
    ],
    edges: [
      [0, 1],
      [1, 2],
    ],
  },
  {
    points: [
      [45, 35],
      [150, 105],
      [265, 30],
    ],
    edges: [
      [0, 1],
      [1, 2],
    ],
  },
  {
    points: [
      [50, 45],
      [230, 30],
      [255, 135],
      [70, 160],
    ],
    edges: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 0],
    ],
  },
  {
    points: [
      [35, 140],
      [100, 75],
      [185, 110],
      [265, 30],
    ],
    edges: [
      [0, 1],
      [1, 2],
      [2, 3],
    ],
  },
  {
    points: [
      [145, 20],
      [65, 115],
      [240, 145],
      [145, 100],
    ],
    edges: [
      [0, 1],
      [1, 2],
      [2, 0],
      [0, 3],
    ],
  },
  {
    points: [
      [150, 85],
      [215, 45],
      [250, 145],
      [50, 150],
    ],
    edges: [
      [0, 1],
      [1, 2],
      [2, 3],
    ],
  },
  {
    points: [
      [65, 155],
      [65, 35],
      [235, 35],
      [235, 155],
    ],
    edges: [
      [0, 1],
      [1, 2],
      [2, 3],
    ],
  },
  {
    points: [
      [150, 20],
      [90, 85],
      [210, 85],
      [65, 155],
      [235, 155],
    ],
    edges: [
      [0, 1],
      [0, 2],
      [1, 2],
      [1, 3],
      [2, 4],
    ],
  },
  {
    points: [
      [30, 105],
      [85, 45],
      [150, 145],
      [215, 45],
      [270, 105],
    ],
    edges: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
    ],
  },
  {
    points: [
      [35, 125],
      [95, 40],
      [150, 90],
      [205, 40],
      [265, 125],
    ],
    edges: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
      [0, 4],
    ],
  },
  {
    points: [
      [150, 145],
      [50, 70],
      [100, 25],
      [200, 25],
      [250, 70],
    ],
    edges: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
      [4, 0],
    ],
  },
  {
    points: [
      [150, 20],
      [260, 80],
      [215, 155],
      [85, 155],
      [40, 80],
    ],
    edges: [
      [0, 2],
      [2, 4],
      [4, 1],
      [1, 3],
      [3, 0],
    ],
  },
] as const;
export const STAR_COUNTS = CONSTELLATION_MAPS.map((c) => c.points.length);
export const STAR_STARTS = STAR_COUNTS.map((_, i) =>
  STAR_COUNTS.slice(0, i).reduce((sum, n) => sum + n, 0),
);
export const TOTAL_STARS = STAR_COUNTS.reduce((sum, n) => sum + n, 0);
export function constellationProgress(stars: number) {
  const completed = STAR_STARTS.filter(
    (start, i) => stars >= start + STAR_COUNTS[i],
  ).length;
  const set = Math.min(14, completed);
  return {
    completed,
    set,
    node: Math.min(STAR_COUNTS[set] - 1, Math.max(0, stars - STAR_STARTS[set])),
  };
}
