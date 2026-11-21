/**
 * Pixel-art planets, generated from a seed like the companion sprites: the
 * same seed always gives the same planet. A planet is a lit sphere whose
 * surface comes from value noise, with sometimes a ring and a moon.
 */

export type PlanetKind = "ocean" | "desert" | "ice" | "lava" | "gas" | "toxic";

export interface PlanetSpriteRun {
  x: number;
  y: number;
  /** Horizontal run of pixels of the same color. */
  width: number;
  color: string;
}

export interface PlanetSprite {
  size: number;
  kind: PlanetKind;
  runs: PlanetSpriteRun[];
}

export const PLANET_KIND_LABELS: Record<PlanetKind, string> = {
  ocean: "Planète océanique",
  desert: "Planète désertique",
  ice: "Planète glacée",
  lava: "Planète volcanique",
  gas: "Géante gazeuse",
  toxic: "Planète toxique",
};

interface Palette {
  /** Surface colors, from the lowest to the highest ground. */
  surface: string[];
  shadow: string;
  rim: string;
}

const PALETTES: Record<PlanetKind, Palette[]> = {
  ocean: [
    { surface: ["#1e3a8a", "#2563eb", "#3b82f6", "#16a34a", "#4ade80", "#f0fdf4"], shadow: "#0b1530", rim: "#93c5fd" },
    { surface: ["#134e4a", "#0f766e", "#14b8a6", "#65a30d", "#a3e635", "#ecfccb"], shadow: "#071f1d", rim: "#99f6e4" },
  ],
  desert: [
    { surface: ["#78350f", "#b45309", "#d97706", "#f59e0b", "#fcd34d", "#fef3c7"], shadow: "#2a1205", rim: "#fde68a" },
    { surface: ["#7c2d12", "#c2410c", "#ea580c", "#fb923c", "#fdba74", "#ffedd5"], shadow: "#2b0f05", rim: "#fed7aa" },
  ],
  ice: [
    { surface: ["#1e40af", "#60a5fa", "#bfdbfe", "#e0f2fe", "#f8fafc", "#ffffff"], shadow: "#0f1b3d", rim: "#e0f2fe" },
    { surface: ["#155e75", "#22d3ee", "#a5f3fc", "#cffafe", "#ecfeff", "#ffffff"], shadow: "#082a33", rim: "#cffafe" },
  ],
  lava: [
    { surface: ["#fde047", "#f97316", "#dc2626", "#44403c", "#292524", "#1c1917"], shadow: "#0c0a09", rim: "#fb923c" },
    { surface: ["#fef08a", "#facc15", "#ea580c", "#57534e", "#3f3f46", "#27272a"], shadow: "#09090b", rim: "#fdba74" },
  ],
  gas: [
    { surface: ["#92400e", "#d97706", "#fbbf24", "#fde68a", "#fef3c7", "#b45309"], shadow: "#2a1406", rim: "#fde68a" },
    { surface: ["#4c1d95", "#7c3aed", "#a78bfa", "#ddd6fe", "#f5f3ff", "#6d28d9"], shadow: "#1a0b33", rim: "#c4b5fd" },
    { surface: ["#164e63", "#0891b2", "#67e8f9", "#cffafe", "#ecfeff", "#0e7490"], shadow: "#06202a", rim: "#a5f3fc" },
  ],
  toxic: [
    { surface: ["#365314", "#4d7c0f", "#84cc16", "#bef264", "#a855f7", "#f0abfc"], shadow: "#111a05", rim: "#d9f99d" },
  ],
};

const KINDS: PlanetKind[] = ["ocean", "desert", "ice", "lava", "gas", "toxic"];

const SIZE = 40;
const CENTER = (SIZE - 1) / 2;
const RADIUS = 13;
/** Light comes from the top left, slightly towards the viewer. */
const LIGHT = normalize([-0.7, -0.5, 0.5]);

function normalize(vector: [number, number, number]): [number, number, number] {
  const length = Math.hypot(...vector);
  return [vector[0] / length, vector[1] / length, vector[2] / length];
}

export function hashSeed(seed: string): number {
  let hash = 2166136261;
  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function createRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function pick<T>(items: readonly T[], random: () => number): T {
  return items[Math.floor(random() * items.length)];
}

/** Smooth noise: random values on a coarse lattice, interpolated. */
function createNoise(random: () => number, cells: number): (x: number, y: number) => number {
  const lattice = Array.from({ length: cells + 1 }, () =>
    Array.from({ length: cells + 1 }, () => random()),
  );
  const smooth = (t: number) => t * t * (3 - 2 * t);
  return (x, y) => {
    const gx = Math.min(cells - 1e-9, Math.max(0, x * cells));
    const gy = Math.min(cells - 1e-9, Math.max(0, y * cells));
    const x0 = Math.floor(gx);
    const y0 = Math.floor(gy);
    const tx = smooth(gx - x0);
    const ty = smooth(gy - y0);
    const top = lattice[y0][x0] * (1 - tx) + lattice[y0][x0 + 1] * tx;
    const bottom = lattice[y0 + 1][x0] * (1 - tx) + lattice[y0 + 1][x0 + 1] * tx;
    return top * (1 - ty) + bottom * ty;
  };
}

function mix(color: string, target: string, amount: number): string {
  const parse = (hex: string) => [1, 3, 5].map((index) => parseInt(hex.slice(index, index + 2), 16));
  const [r1, g1, b1] = parse(color);
  const [r2, g2, b2] = parse(target);
  const channel = (a: number, b: number) =>
    Math.round(a + (b - a) * amount).toString(16).padStart(2, "0");
  return `#${channel(r1, r2)}${channel(g1, g2)}${channel(b1, b2)}`;
}

/** Creates a stable pixel-art planet from its seed. */
export function generatePlanetSprite(seed: string): PlanetSprite {
  const random = createRandom(hashSeed(seed));
  const kind = pick(KINDS, random);
  const palette = pick(PALETTES[kind], random);
  const coarse = createNoise(random, 4);
  const fine = createNoise(random, 9);
  const bandCount = 5 + Math.floor(random() * 5);
  const hasRing = random() < (kind === "gas" ? 0.6 : 0.2);
  const ringTilt = 0.22 + random() * 0.18;
  const ringColor = mix(palette.surface[3], "#ffffff", 0.2);
  const hasMoon = random() < 0.35;
  const moonAngle = random() * Math.PI * 2;
  const pixels: Array<Array<string | null>> = Array.from({ length: SIZE }, () =>
    Array.from({ length: SIZE }, () => null),
  );

  const surfaceAt = (u: number, v: number): string => {
    const levels = palette.surface;
    if (kind === "gas") {
      // Horizontal bands, bent by the noise.
      const band = (v + (coarse(u, v) - 0.5) * 0.25) * bandCount;
      const index = Math.floor(((band % levels.length) + levels.length) % levels.length);
      return levels[index];
    }
    const height = coarse(u, v) * 0.7 + fine(u, v) * 0.3;
    const index = Math.min(levels.length - 1, Math.floor(height * levels.length));
    return levels[index];
  };

  // The ring is an ellipse around the planet: its back half is drawn first,
  // hidden by the planet, its front half last.
  const ringAt = (x: number, y: number, front: boolean) => {
    if (!hasRing) return;
    const dx = (x - CENTER) / (RADIUS * 1.75);
    const dy = (y - CENTER) / (RADIUS * 1.75 * ringTilt);
    const distance = Math.hypot(dx, dy);
    if (distance < 0.78 || distance > 1) return;
    if (front !== y > CENTER) return;
    pixels[y][x] = distance > 0.92 ? mix(ringColor, palette.shadow, 0.35) : ringColor;
  };

  for (let y = 0; y < SIZE; y += 1) {
    for (let x = 0; x < SIZE; x += 1) ringAt(x, y, false);
  }

  for (let y = 0; y < SIZE; y += 1) {
    for (let x = 0; x < SIZE; x += 1) {
      const nx = (x - CENTER) / RADIUS;
      const ny = (y - CENTER) / RADIUS;
      const d2 = nx * nx + ny * ny;
      if (d2 > 1) continue;
      const nz = Math.sqrt(1 - d2);
      // Texture coordinates follow the sphere a little, for some depth.
      const u = 0.5 + nx * 0.5 * (0.75 + 0.25 * nz);
      const v = 0.5 + ny * 0.5;
      let color = surfaceAt(u, v);

      const light = nx * LIGHT[0] + ny * LIGHT[1] + nz * LIGHT[2];
      if (light < 0) color = mix(color, palette.shadow, 0.82);
      else if (light < 0.18) color = mix(color, palette.shadow, 0.6);
      else if (light < 0.38) color = mix(color, palette.shadow, 0.32);
      else if (light > 0.9) color = mix(color, "#ffffff", 0.3);

      // A thin atmosphere on the lit edge, a dark outline elsewhere.
      if (d2 > 0.86) color = light > 0.15 ? mix(color, palette.rim, 0.55) : palette.shadow;
      pixels[y][x] = color;
    }
  }

  for (let y = 0; y < SIZE; y += 1) {
    for (let x = 0; x < SIZE; x += 1) ringAt(x, y, true);
  }

  if (hasMoon) {
    const mx = Math.round(CENTER + Math.cos(moonAngle) * (RADIUS + 5));
    const my = Math.round(CENTER + Math.sin(moonAngle) * (RADIUS + 5));
    const moonColor = "#cbd5e1";
    for (let dy = -1; dy <= 1; dy += 1) {
      for (let dx = -1; dx <= 1; dx += 1) {
        const x = mx + dx;
        const y = my + dy;
        if (x < 0 || y < 0 || x >= SIZE || y >= SIZE || pixels[y][x]) continue;
        if (Math.abs(dx) + Math.abs(dy) > 1) continue;
        pixels[y][x] = dx > 0 || dy > 0 ? mix(moonColor, "#0f172a", 0.5) : moonColor;
      }
    }
  }

  // Same-colored neighbours on a row become one rectangle: fewer SVG nodes.
  const runs: PlanetSpriteRun[] = [];
  for (let y = 0; y < SIZE; y += 1) {
    let x = 0;
    while (x < SIZE) {
      const color = pixels[y][x];
      if (!color) {
        x += 1;
        continue;
      }
      let width = 1;
      while (x + width < SIZE && pixels[y][x + width] === color) width += 1;
      runs.push({ x, y, width, color });
      x += width;
    }
  }

  return { size: SIZE, kind, runs };
}
