import type { Star } from "../models/starSystem";

export interface StarSpriteRun {
  x: number;
  y: number;
  width: number;
  color: string;
}

export const STAR_SPRITE_SIZE = 24;

/** A pixel-art star: a bright core, its body, a rim and a few flares. */
export function generateStarSprite(star: Star): StarSpriteRun[] {
  const size = STAR_SPRITE_SIZE;
  const center = (size - 1) / 2;
  const radius = 8.5;
  const pixels: Array<Array<string | null>> = Array.from({ length: size }, () =>
    Array.from({ length: size }, () => null),
  );

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const distance = Math.hypot(x - center, y - center) / radius;
      if (distance > 1) continue;
      // The core sits a little up and left, where the light seems to come from.
      const offset = Math.hypot(x - center + 2, y - center + 2) / radius;
      pixels[y][x] =
        distance > 0.86 ? star.colors.rim : offset < 0.45 ? star.colors.core : star.colors.body;
    }
  }
  // Flares on the four sides.
  const flares: Array<[number, number]> = [
    [Math.round(center), 1], [Math.round(center), size - 2],
    [1, Math.round(center)], [size - 2, Math.round(center)],
  ];
  flares.forEach(([x, y]) => {
    pixels[y][x] = star.colors.body;
  });

  const runs: StarSpriteRun[] = [];
  for (let y = 0; y < size; y += 1) {
    let x = 0;
    while (x < size) {
      const color = pixels[y][x];
      if (!color) {
        x += 1;
        continue;
      }
      let width = 1;
      while (x + width < size && pixels[y][x + width] === color) width += 1;
      runs.push({ x, y, width, color });
      x += width;
    }
  }
  return runs;
}
