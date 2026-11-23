import type { BuildingType } from "../models/buildings";
import type { PlanetKind } from "./planetSprite";

/**
 * Pixel-art buildings, drawn by hand in code like the companion sprites. Each
 * building has three looks that get richer with its level, and stands on the
 * ground of its planet's kind.
 */

export interface BuildingSpriteRun {
  x: number;
  y: number;
  width: number;
  color: string;
}

export interface BuildingSprite {
  width: number;
  height: number;
  runs: BuildingSpriteRun[];
}

export const BUILDING_SPRITE_WIDTH = 32;
export const BUILDING_SPRITE_HEIGHT = 20;
const W = BUILDING_SPRITE_WIDTH;
const H = BUILDING_SPRITE_HEIGHT;
/** First row of the ground. */
const GROUND_Y = 17;
const OUTLINE = "#1f1633";

export interface Ground {
  top: string;
  body: string;
  speck: string;
}

export const PLANET_GROUNDS: Record<PlanetKind, Ground> = {
  ocean: { top: "#65a30d", body: "#3f6212", speck: "#a3e635" },
  desert: { top: "#f59e0b", body: "#b45309", speck: "#fde68a" },
  ice: { top: "#f0f9ff", body: "#93c5fd", speck: "#ffffff" },
  lava: { top: "#44403c", body: "#1c1917", speck: "#f97316" },
  gas: { top: "#94a3b8", body: "#475569", speck: "#e2e8f0" },
  toxic: { top: "#84cc16", body: "#4d7c0f", speck: "#c084fc" },
};

/** Sky behind the building, for the tile's background. */
export const PLANET_SKIES: Record<PlanetKind, string> = {
  ocean: "linear-gradient(180deg,#bae6fd 0%,#e0f2fe 100%)",
  desert: "linear-gradient(180deg,#fed7aa 0%,#fff7ed 100%)",
  ice: "linear-gradient(180deg,#cbd5e1 0%,#f1f5f9 100%)",
  lava: "linear-gradient(180deg,#7c2d12 0%,#c2410c 100%)",
  gas: "linear-gradient(180deg,#c4b5fd 0%,#ede9fe 100%)",
  toxic: "linear-gradient(180deg,#d9f99d 0%,#f7fee7 100%)",
};

type Grid = Array<Array<string | null>>;

class Canvas {
  grid: Grid = Array.from({ length: H }, () => Array.from({ length: W }, () => null));

  rect(x: number, y: number, width: number, height: number, color: string): void {
    for (let row = y; row < y + height; row += 1) {
      for (let column = x; column < x + width; column += 1) {
        if (column >= 0 && row >= 0 && column < W && row < H) this.grid[row][column] = color;
      }
    }
  }

  dots(points: Array<[number, number]>, color: string): void {
    points.forEach(([x, y]) => this.rect(x, y, 1, 1, color));
  }

  /** A gable roof: a triangle whose tip is at (center, top). */
  roof(center: number, top: number, rows: number, light: string, dark: string): void {
    for (let row = 0; row < rows; row += 1) {
      this.rect(center - row, top + row, row + 1, 1, light);
      this.rect(center + 1, top + row, row, 1, dark);
    }
  }

  /** A wall lit from the left: light edge, body, shaded right edge. */
  wall(x: number, y: number, width: number, height: number, light: string, body: string, dark: string): void {
    this.rect(x, y, width, height, body);
    this.rect(x, y, 1, height, light);
    this.rect(x + width - 1, y, 1, height, dark);
  }

  /** Dark outline around every shape (not around the ground). */
  outlined(): Grid {
    const result = this.grid.map((row) => [...row]);
    for (let y = 0; y < GROUND_Y; y += 1) {
      for (let x = 0; x < W; x += 1) {
        if (this.grid[y][x]) continue;
        const touches = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => {
          const ny = y + dy;
          return ny < GROUND_Y && Boolean(this.grid[ny]?.[x + dx]);
        });
        if (touches) result[y][x] = OUTLINE;
      }
    }
    return result;
  }
}

function drawGround(canvas: Canvas, ground: Ground): void {
  canvas.rect(0, GROUND_Y, W, 1, ground.top);
  canvas.rect(0, GROUND_Y + 1, W, H - GROUND_Y - 1, ground.body);
  canvas.dots([[3, 18], [9, 19], [14, 18], [21, 19], [27, 18], [30, 19]], ground.speck);
}

function drawMine(canvas: Canvas, tier: number): void {
  // A rocky hill with a tunnel.
  for (let row = 0; row < 14; row += 1) {
    const half = Math.min(10, 2 + row);
    canvas.rect(16 - half, 3 + row, half, 1, row < 2 ? "#a8a29e" : "#78716c");
    canvas.rect(16, 3 + row, half, 1, row < 2 ? "#78716c" : "#57534e");
  }
  canvas.dots([[11, 9], [19, 7], [8, 13], [22, 12], [14, 6]], "#e2e8f0");
  canvas.dots([[12, 9], [20, 7], [23, 12]], "#94a3b8");
  canvas.rect(13, 11, 6, 6, "#1c1917");
  canvas.rect(12, 10, 8, 1, "#b45309");
  canvas.rect(12, 10, 1, 7, "#92400e");
  canvas.rect(19, 10, 1, 7, "#92400e");
  canvas.rect(14, 16, 4, 1, "#57534e");
  if (tier >= 1) {
    // Rails and a cart full of ore.
    canvas.rect(20, 16, 11, 1, "#78716c");
    canvas.wall(26, 13, 5, 3, "#94a3b8", "#64748b", "#475569");
    canvas.dots([[27, 12], [28, 12], [29, 12]], "#cbd5e1");
    canvas.dots([[27, 16], [30, 16]], "#1c1917");
  }
  if (tier >= 2) {
    // A headframe with its wheel.
    canvas.rect(3, 4, 1, 13, "#475569");
    canvas.rect(7, 4, 1, 13, "#334155");
    canvas.dots([[4, 8], [5, 10], [6, 12], [4, 12], [6, 8]], "#64748b");
    canvas.rect(3, 3, 5, 1, "#94a3b8");
    canvas.dots([[5, 1], [4, 2], [6, 2], [5, 2]], "#cbd5e1");
  }
}

function drawFarm(canvas: Canvas, tier: number): void {
  // Fields on the left, a barn on the right.
  const rows = tier >= 2 ? 4 : 3;
  for (let row = 0; row < rows; row += 1) {
    canvas.rect(1, 16 - row, 11, 1, row % 2 ? "#a3e635" : "#ca8a04");
    canvas.dots([[3 + row, 16 - row], [8 - row, 16 - row]], row % 2 ? "#65a30d" : "#fde047");
  }
  canvas.wall(17, 9, 12, 8, "#ef4444", "#dc2626", "#991b1b");
  canvas.roof(22, 3, 7, "#991b1b", "#7f1d1d");
  canvas.rect(29, 9, 1, 1, "#7f1d1d");
  canvas.rect(21, 12, 4, 5, "#7f1d1d");
  canvas.dots([[21, 12], [22, 13], [23, 14], [24, 15], [24, 12], [23, 13], [22, 14], [21, 15]], "#fef3c7");
  canvas.rect(22, 6, 1, 2, "#fde68a");
  if (tier >= 1) {
    // A silo.
    canvas.wall(13, 5, 3, 12, "#f8fafc", "#e5e7eb", "#9ca3af");
    canvas.rect(13, 4, 3, 1, "#9ca3af");
    canvas.dots([[14, 3]], "#9ca3af");
  }
  if (tier >= 2) {
    // A greenhouse.
    canvas.rect(2, 9, 8, 3, "#a5f3fc");
    canvas.rect(3, 8, 6, 1, "#a5f3fc");
    canvas.dots([[3, 9], [5, 10], [7, 9], [4, 11]], "#4ade80");
    canvas.dots([[4, 8], [3, 9]], "#ecfeff");
  }
}

function drawReactor(canvas: Canvas, tier: number): void {
  // A domed hall with a glowing core.
  canvas.wall(9, 9, 14, 8, "#f1f5f9", "#cbd5e1", "#94a3b8");
  for (let row = 0; row < 4; row += 1) {
    const half = 3 + row;
    canvas.rect(16 - half, 5 + row, half, 1, row === 0 ? "#f1f5f9" : "#e2e8f0");
    canvas.rect(16, 5 + row, half, 1, "#94a3b8");
  }
  canvas.rect(14, 11, 4, 4, "#155e75");
  canvas.rect(15, 12, 2, 2, "#67e8f9");
  canvas.dots([[13, 12], [18, 13], [16, 10]], "#a5f3fc");
  canvas.rect(10, 16, 12, 1, "#64748b");
  const tower = (x: number) => {
    canvas.wall(x, 7, 4, 10, "#f8fafc", "#e5e7eb", "#9ca3af");
    canvas.rect(x - 1, 6, 6, 1, "#9ca3af");
    canvas.dots([[x + 1, 4], [x + 2, 3], [x, 2], [x + 3, 1]], "#f1f5f9");
  };
  if (tier >= 1) tower(25);
  if (tier >= 2) tower(3);
}

function drawDepot(canvas: Canvas, tier: number): void {
  // A hangar with a curved roof and crates in front.
  canvas.wall(9, 8, 16, 9, "#cbd5e1", "#94a3b8", "#64748b");
  const roof = [12, 14, 16, 16];
  roof.forEach((width, row) => {
    canvas.rect(17 - width / 2, 4 + row, width / 2, 1, "#e2e8f0");
    canvas.rect(17, 4 + row, width / 2, 1, "#94a3b8");
  });
  for (let x = 11; x < 24; x += 2) canvas.rect(x, 9, 1, 3, "#64748b");
  canvas.rect(14, 12, 6, 5, "#334155");
  canvas.rect(14, 12, 6, 1, "#fbbf24");
  const crate = (x: number, y: number) => {
    canvas.wall(x, y, 3, 3, "#fcd34d", "#d97706", "#92400e");
    canvas.dots([[x + 1, y + 1]], "#92400e");
  };
  crate(4, 14);
  crate(6, 11);
  crate(26, 14);
  if (tier >= 1) {
    // Tanks for the food stock.
    canvas.wall(27, 6, 4, 8, "#f8fafc", "#e5e7eb", "#9ca3af");
    canvas.rect(27, 5, 4, 1, "#9ca3af");
    canvas.rect(27, 9, 4, 1, "#16a34a");
  }
  if (tier >= 2) {
    // A crane.
    canvas.rect(3, 2, 1, 9, "#f59e0b");
    canvas.rect(3, 2, 8, 1, "#f59e0b");
    canvas.rect(9, 3, 1, 4, "#475569");
    canvas.rect(8, 7, 3, 2, "#d97706");
  }
}

function drawLaboratory(canvas: Canvas, tier: number): void {
  // A low building under a glass dome, with an antenna.
  canvas.wall(7, 11, 18, 6, "#f8fafc", "#e2e8f0", "#94a3b8");
  canvas.rect(7, 11, 18, 1, "#94a3b8");
  [9, 14, 19].forEach((x) => canvas.rect(x, 13, 3, 2, "#7c3aed"));
  canvas.dots([[9, 13], [14, 13], [19, 13]], "#c4b5fd");
  const dome = [2, 4, 6, 8, 8];
  dome.forEach((width, row) => {
    canvas.rect(16 - width / 2, 6 + row, width, 1, row < 2 ? "#ede9fe" : "#a78bfa");
  });
  canvas.dots([[14, 8], [13, 9]], "#f5f3ff");
  canvas.rect(16, 2, 1, 4, "#64748b");
  canvas.dots([[16, 1]], "#f0abfc");
  if (tier >= 1) {
    // A satellite dish.
    canvas.rect(26, 12, 1, 5, "#64748b");
    canvas.rect(24, 9, 5, 1, "#e2e8f0");
    canvas.rect(25, 10, 3, 1, "#cbd5e1");
    canvas.rect(26, 11, 1, 1, "#94a3b8");
    canvas.dots([[26, 8]], "#f0abfc");
  }
  if (tier >= 2) {
    // A tower crowned with Offlinium light.
    canvas.wall(3, 6, 3, 11, "#f8fafc", "#cbd5e1", "#94a3b8");
    canvas.dots([[4, 4], [3, 5], [5, 5], [4, 5]], "#c084fc");
    canvas.dots([[4, 3]], "#f5d0fe");
  }
}

function drawHabitat(canvas: Canvas, tier: number): void {
  if (tier === 0) {
    // A village of small houses.
    const house = (x: number, top: number, width: number, roof: string, roofDark: string) => {
      canvas.wall(x, top, width, GROUND_Y - top, "#fffbeb", "#fef3c7", "#fcd34d");
      const half = Math.ceil(width / 2);
      canvas.roof(x + half - 1, top - half, half, roof, roofDark);
      canvas.rect(x + 1, top + 1, 1, 1, "#60a5fa");
      canvas.rect(x + width - 2, GROUND_Y - 2, 1, 2, "#92400e");
    };
    house(3, 12, 6, "#ea580c", "#c2410c");
    house(12, 10, 8, "#d97706", "#b45309");
    house(23, 12, 6, "#ea580c", "#c2410c");
    return;
  }
  // Towers: a city, then a megalopolis.
  const towers: Array<[number, number, number]> =
    tier === 1
      ? [[3, 10, 6], [11, 6, 7], [20, 9, 6], [27, 12, 4]]
      : [[1, 6, 5], [7, 1, 6], [14, 4, 6], [21, 2, 5], [27, 8, 4]];
  towers.forEach(([x, top, width]) => {
    const body = tier === 1 ? "#cbd5e1" : "#94a3b8";
    canvas.wall(x, top, width, GROUND_Y - top, "#e2e8f0", body, "#64748b");
    for (let y = top + 1; y < GROUND_Y - 1; y += 2) {
      for (let column = x + 1; column < x + width - 1; column += 2) {
        canvas.rect(column, y, 1, 1, (column * 7 + y * 3) % 5 < 3 ? "#fde68a" : "#1e3a8a");
      }
    }
  });
  if (tier >= 2) canvas.dots([[9, 0], [9, -1]], "#f87171");
}

function drawSpaceport(canvas: Canvas, tier: number): void {
  // A launch pad with a rocket ready to go.
  canvas.rect(8, 15, 16, 2, "#64748b");
  canvas.rect(8, 15, 16, 1, "#94a3b8");
  canvas.dots([[10, 16], [14, 16], [18, 16], [22, 16]], "#fbbf24");
  // The rocket.
  canvas.wall(15, 5, 4, 10, "#f8fafc", "#e2e8f0", "#94a3b8");
  canvas.rect(16, 3, 2, 2, "#ef4444");
  canvas.rect(15, 4, 4, 1, "#ef4444");
  canvas.rect(16, 7, 2, 1, "#60a5fa");
  canvas.rect(14, 11, 1, 4, "#ef4444");
  canvas.rect(19, 11, 1, 4, "#b91c1c");
  // The launch tower and its arm.
  canvas.rect(10, 3, 1, 12, "#475569");
  canvas.rect(11, 6, 3, 1, "#64748b");
  canvas.dots([[11, 9], [11, 12]], "#64748b");
  canvas.dots([[10, 2]], "#f87171");
  if (tier >= 1) {
    // A hangar for the ships.
    canvas.wall(24, 9, 7, 8, "#cbd5e1", "#94a3b8", "#64748b");
    canvas.rect(24, 8, 7, 1, "#e2e8f0");
    canvas.rect(26, 12, 3, 5, "#334155");
  }
  if (tier >= 2) {
    // A radar dish and a second rocket.
    canvas.rect(3, 11, 1, 6, "#64748b");
    canvas.rect(1, 9, 5, 1, "#e2e8f0");
    canvas.rect(2, 10, 3, 1, "#cbd5e1");
    canvas.wall(6, 9, 2, 6, "#f8fafc", "#e2e8f0", "#94a3b8");
    canvas.dots([[6, 8], [7, 8]], "#a855f7");
  }
}

function drawRadar(canvas: Canvas, tier: number): void {
  // A dish on a lattice mast, turned to the sky.
  canvas.rect(15, 9, 2, 8, "#64748b");
  canvas.rect(15, 9, 1, 8, "#94a3b8");
  canvas.dots([[14, 12], [17, 12], [14, 15], [17, 15]], "#475569");
  canvas.rect(11, 16, 10, 1, "#475569");
  // The dish: a wide bowl, lit from the left.
  canvas.rect(9, 6, 14, 1, "#e2e8f0");
  canvas.rect(10, 7, 12, 1, "#cbd5e1");
  canvas.rect(11, 8, 10, 1, "#94a3b8");
  canvas.rect(9, 6, 3, 1, "#f8fafc");
  // The receiver above the bowl, and its blinking light.
  canvas.rect(15, 3, 2, 3, "#64748b");
  canvas.dots([[15, 2], [16, 2]], "#a855f7");
  if (tier >= 1) {
    // A control hut with a lit screen.
    canvas.wall(22, 11, 8, 6, "#cbd5e1", "#94a3b8", "#64748b");
    canvas.rect(22, 10, 8, 1, "#e2e8f0");
    canvas.rect(24, 13, 4, 2, "#22d3ee");
  }
  if (tier >= 2) {
    // A second, smaller dish and radio waves.
    canvas.rect(5, 12, 1, 5, "#64748b");
    canvas.rect(2, 10, 7, 1, "#e2e8f0");
    canvas.rect(3, 11, 5, 1, "#cbd5e1");
    canvas.dots([[20, 2], [21, 1], [22, 2], [24, 1], [25, 0], [26, 1]], "#c084fc");
  }
}

const DRAWERS: Record<BuildingType, (canvas: Canvas, tier: number) => void> = {
  metalMine: drawMine,
  farm: drawFarm,
  reactor: drawReactor,
  depot: drawDepot,
  laboratory: drawLaboratory,
  habitat: drawHabitat,
  spaceport: drawSpaceport,
  radar: drawRadar,
};

/** 0, 1 or 2: the look a building has at this level. */
export function getBuildingTier(type: BuildingType, level: number): number {
  if (type === "habitat") return level <= 5 ? 0 : level <= 10 ? 1 : 2;
  return level < 5 ? 0 : level < 10 ? 1 : 2;
}

/** Height of a building without its strip of ground. */
export const BUILDING_HEIGHT_WITHOUT_GROUND = GROUND_Y;

export function generateBuildingSprite(
  type: BuildingType,
  level: number,
  kind: PlanetKind,
  options: { withGround: boolean } = { withGround: true },
): BuildingSprite {
  const canvas = new Canvas();
  DRAWERS[type](canvas, getBuildingTier(type, level));
  const grid = canvas.outlined();
  const ground = new Canvas();
  if (options.withGround) drawGround(ground, PLANET_GROUNDS[kind]);

  const runs: BuildingSpriteRun[] = [];
  for (let y = 0; y < H; y += 1) {
    let x = 0;
    while (x < W) {
      const color = grid[y][x] ?? ground.grid[y][x];
      if (!color) {
        x += 1;
        continue;
      }
      let width = 1;
      while (x + width < W && (grid[y][x + width] ?? ground.grid[y][x + width]) === color) {
        width += 1;
      }
      runs.push({ x, y, width, color });
      x += width;
    }
  }
  return {
    width: W,
    height: options.withGround ? H : GROUND_Y,
    runs: options.withGround ? runs : runs.filter((run) => run.y < GROUND_Y),
  };
}
