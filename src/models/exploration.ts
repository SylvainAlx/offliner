import { createRandom, hashSeed } from "../utils/planetSprite";

/**
 * Explorations of the unknown: a ship leaves a spaceport and brings back
 * whatever it found. The draw only depends on the game and on the number of
 * the exploration, so computing an arrival again, or importing a save again,
 * gives the same result.
 */

export const EXPLORATION_DISCOVERIES = [
  "nothing",
  "metal",
  "offlinium",
  "wreck",
  "survivor",
] as const;

export type ExplorationDiscovery = (typeof EXPLORATION_DISCOVERIES)[number];

/** Chances in percent; they add up to 100. */
export const EXPLORATION_CHANCES: Record<ExplorationDiscovery, number> = {
  nothing: 25,
  metal: 35,
  offlinium: 15,
  wreck: 18,
  survivor: 7,
};

/** A gain drawn evenly between two bounds, both included. */
interface Range {
  min: number;
  max: number;
}

/** Metal gains are shares of the departure spaceport's base cargo capacity. */
export const METAL_FIND_SHARE: Range = { min: 0.1, max: 0.3 };
export const WRECK_METAL_SHARE: Range = { min: 0.05, max: 0.15 };
export const OFFLINIUM_FIND: Range = { min: 100, max: 250 };
export const WRECK_OFFLINIUM: Range = { min: 20, max: 80 };

export interface ExplorationResult {
  discovery: ExplorationDiscovery;
  metal: number;
  offlinium: number;
}

export function isExplorationDiscovery(value: unknown): value is ExplorationDiscovery {
  return (
    typeof value === "string" && (EXPLORATION_DISCOVERIES as readonly string[]).includes(value)
  );
}

/** The discovery a roll between 0 (included) and 100 (excluded) lands on. */
function pickDiscovery(roll: number): ExplorationDiscovery {
  let threshold = 0;
  for (const discovery of EXPLORATION_DISCOVERIES) {
    threshold += EXPLORATION_CHANCES[discovery];
    if (roll < threshold) return discovery;
  }
  return "nothing";
}

function between({ min, max }: Range, random: () => number): number {
  return Math.floor(min + random() * (max - min + 1));
}

/**
 * What an exploration finds. `cargoCapacity` is the departure spaceport's base
 * capacity at launch. When no survivor can be welcomed any more, a wreck takes
 * their place.
 */
export function drawExploration(
  seed: string,
  cargoCapacity: number,
  canRescue: boolean,
): ExplorationResult {
  const random = createRandom(hashSeed(seed));
  let discovery = pickDiscovery(random() * 100);
  if (discovery === "survivor" && !canRescue) discovery = "wreck";

  const metalShare = (share: Range) =>
    between(
      { min: Math.round(share.min * cargoCapacity), max: Math.round(share.max * cargoCapacity) },
      random,
    );

  switch (discovery) {
    case "metal":
      return { discovery, metal: metalShare(METAL_FIND_SHARE), offlinium: 0 };
    case "offlinium":
      return { discovery, metal: 0, offlinium: between(OFFLINIUM_FIND, random) };
    case "wreck": {
      const metal = metalShare(WRECK_METAL_SHARE);
      return { discovery, metal, offlinium: between(WRECK_OFFLINIUM, random) };
    }
    case "nothing":
    case "survivor":
      return { discovery, metal: 0, offlinium: 0 };
  }
}
