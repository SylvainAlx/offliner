import type { BuildingType } from "../models/buildings";
import { PLANET_GROUNDS, BUILDING_HEIGHT_WITHOUT_GROUND } from "./buildingSprite";
import {
  createNoise,
  createRandom,
  hashSeed,
  mix,
  type PlanetKind,
} from "./planetSprite";

/**
 * The surface view: the top of a huge planet curves across the screen, and
 * the buildings stand on it. Everything is drawn on a grid of scene pixels
 * that have the same size as the buildings' pixels.
 */

export const SCENE_WIDTH = 136;
export const SCENE_HEIGHT = 98;
/** Highest point of the horizon. */
const HORIZON_TOP = 30;
const HORIZON_RADIUS = 200;
const CENTER_X = SCENE_WIDTH / 2;
const CENTER_Y = HORIZON_TOP + HORIZON_RADIUS;

/**
 * The ground and the sky go on beyond the scene on both sides, so that the
 * view fills a wide screen too (the scene itself stays centered).
 */
export const SCENE_SIDE_MARGIN = 120;

export const BUILDING_WIDTH = 32;
export const BUILDING_HEIGHT = BUILDING_HEIGHT_WITHOUT_GROUND;

export interface SceneRun {
  x: number;
  y: number;
  width: number;
  color: string;
}

/** Height of the ground at a horizontal position. */
export function surfaceY(x: number): number {
  const dx = x - CENTER_X;
  return CENTER_Y - Math.sqrt(Math.max(0, HORIZON_RADIUS ** 2 - dx ** 2));
}

interface Slot {
  x: number;
  /** 0: back row, near the horizon; 1: front row. */
  row: 0 | 1;
}

/**
 * Where each building stands: four in the back row, four in the front row,
 * so that every building stays large enough to be read and tapped.
 */
const SLOTS: Record<BuildingType, Slot> = {
  habitat: { x: 17, row: 0 },
  laboratory: { x: 51, row: 0 },
  spaceport: { x: 85, row: 0 },
  radar: { x: 119, row: 0 },
  metalMine: { x: 17, row: 1 },
  farm: { x: 51, row: 1 },
  reactor: { x: 85, row: 1 },
  depot: { x: 119, row: 1 },
};
const ROW_DEPTH = [19, 46];

/** The bottom center of a building: where it touches the ground. */
export function getBuildingAnchor(type: BuildingType): { x: number; y: number } {
  const slot = SLOTS[type];
  return { x: slot.x, y: Math.round(surfaceY(slot.x) + ROW_DEPTH[slot.row]) };
}

/** The ground of the planet, in the colors of its kind (as under the tiles). */
export function generateSurfaceGround(kind: PlanetKind, seed: string): SceneRun[] {
  const ground = PLANET_GROUNDS[kind];
  const random = createRandom(hashSeed(`${seed}:surface`));
  const coarse = createNoise(random, 5);
  const fine = createNoise(random, 14);
  const middle = mix(ground.top, ground.body, 0.5);
  const rim = mix(ground.top, "#ffffff", 0.45);
  const pixels: Array<Array<string | null>> = Array.from({ length: SCENE_HEIGHT }, () =>
    Array.from({ length: SCENE_WIDTH + 2 * SCENE_SIDE_MARGIN }, () => null),
  );

  const fullWidth = SCENE_WIDTH + 2 * SCENE_SIDE_MARGIN;
  for (let y = HORIZON_TOP; y < SCENE_HEIGHT; y += 1) {
    for (let column = 0; column < fullWidth; column += 1) {
      const x = column - SCENE_SIDE_MARGIN;
      const dx = x + 0.5 - CENTER_X;
      const dy = y + 0.5 - CENTER_Y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance > HORIZON_RADIUS) continue;
      // A thin bright atmosphere along the horizon.
      if (distance > HORIZON_RADIUS - 1.5) {
        pixels[y][column] = rim;
        continue;
      }
      const u = column / fullWidth;
      const v = (y - HORIZON_TOP) / (SCENE_HEIGHT - HORIZON_TOP);
      // Darker towards the bottom, for some depth.
      const height = coarse(u, v) * 0.65 + fine(u, v) * 0.35 + v * 0.25;
      let color = height < 0.55 ? ground.top : height < 0.78 ? middle : ground.body;
      if (random() < 0.015) color = ground.speck;
      pixels[y][column] = color;
    }
  }

  const runs: SceneRun[] = [];
  const fullRow = SCENE_WIDTH + 2 * SCENE_SIDE_MARGIN;
  for (let y = 0; y < SCENE_HEIGHT; y += 1) {
    let column = 0;
    while (column < fullRow) {
      const color = pixels[y][column];
      if (!color) {
        column += 1;
        continue;
      }
      let width = 1;
      while (column + width < fullRow && pixels[y][column + width] === color) width += 1;
      runs.push({ x: column - SCENE_SIDE_MARGIN, y, width, color });
      column += width;
    }
  }
  return runs;
}

/** Stars of the sky above the horizon: positions and brightness. */
export function generateSkyStars(seed: string): Array<{ x: number; y: number; opacity: number }> {
  const random = createRandom(hashSeed(`${seed}:sky`));
  return Array.from({ length: 60 }, () => ({
    x: Math.floor(random() * (SCENE_WIDTH + 2 * SCENE_SIDE_MARGIN)) - SCENE_SIDE_MARGIN,
    y: Math.floor(random() * (HORIZON_TOP - 2)),
    opacity: 0.3 + random() * 0.6,
  }));
}
