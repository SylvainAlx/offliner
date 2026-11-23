import {
  createRandom,
  generatePlanetSprite,
  hashSeed,
  type PlanetKind,
} from "../utils/planetSprite";
import type { Planet } from "./planet";

/**
 * The star system around the player's planet, and the neighbor systems
 * around it. Everything follows from the planet's seed, so the map is always
 * the same and needs no saving.
 */

export type StarType = "yellow" | "orange" | "red" | "white";

export interface Star {
  name: string;
  type: StarType;
  label: string;
  /** Core and rim colors of its pixel-art disc. */
  colors: { core: string; body: string; rim: string; glow: string };
  /** Warmth compared with the Sun: drives the planets' temperatures. */
  warmth: number;
}

export interface SystemPlanet {
  id: string;
  /** The system it belongs to: "home", or a neighbor's id. */
  systemId: string;
  /** Orbit rank from the star, starting at 0. */
  orbit: number;
  name: string;
  /** Seed of its pixel-art look (utils/planetSprite). */
  seed: string;
  /** Chosen from its temperature; its look is drawn with this kind. */
  kind: PlanetKind;
  isHome: boolean;
  /** Fields available to build on. */
  fields: number;
  /** Distance to the star, in astronomical units. */
  distanceAu: number;
  /**
   * Distance to the player's planet, in astronomical units; null in a
   * neighbor system.
   */
  distanceFromHomeAu: number | null;
  /** Average surface temperature, in °C. */
  temperatureC: number;
  /** Angle on its orbit for the map, in degrees. */
  angle: number;
}

export interface StarSystem {
  star: Star;
  planets: SystemPlanet[];
}

/** A system on the star map, positioned in light-years from the player's. */
export interface GalaxySystem extends StarSystem {
  id: string;
  isHome: boolean;
  x: number;
  y: number;
  /** Distance to the player's system, in light-years. */
  distanceLy: number;
}

/** The player's system first, then its neighbors from the nearest. */
export interface Galaxy {
  systems: GalaxySystem[];
}

export const NEIGHBOR_SYSTEMS = 4;
/**
 * The neighbor of rank k (0 for the nearest) lies between k and k + 1 times
 * this distance: its spaceport level follows (see getRequiredSpaceportLevel).
 */
export const LY_PER_SPACEPORT_LEVEL = 1.5;

export const MIN_PLANETS = 3;
export const MAX_PLANETS = 6;
const ORBIT_DISTANCES_AU = [0.4, 0.7, 1, 1.5, 2.3, 3.4];
const NUMERALS = ["I", "II", "III", "IV", "V", "VI"];

const STARS: Record<StarType, Omit<Star, "name" | "type">> = {
  yellow: {
    label: "Naine jaune",
    colors: { core: "#fffbeb", body: "#fde047", rim: "#f59e0b", glow: "rgba(253, 224, 71, 0.35)" },
    warmth: 1,
  },
  orange: {
    label: "Naine orange",
    colors: { core: "#fff7ed", body: "#fdba74", rim: "#ea580c", glow: "rgba(251, 146, 60, 0.35)" },
    warmth: 0.85,
  },
  red: {
    label: "Naine rouge",
    colors: { core: "#fee2e2", body: "#f87171", rim: "#b91c1c", glow: "rgba(248, 113, 113, 0.35)" },
    warmth: 0.65,
  },
  white: {
    label: "Étoile blanche",
    colors: { core: "#ffffff", body: "#e0f2fe", rim: "#60a5fa", glow: "rgba(147, 197, 253, 0.4)" },
    warmth: 1.3,
  },
};
const STAR_TYPES: StarType[] = ["yellow", "orange", "red", "white"];

const STAR_STARTS = ["Al", "Bel", "Cor", "Dra", "Eri", "Hel", "Ix", "Lyr", "Mira", "Nor", "Pol", "Rig", "Syr", "Tau", "Vel", "Zan"];
const STAR_ENDS = ["deris", "gol", "ion", "kar", "lis", "nar", "on", "phae", "ris", "tar", "ux", "vane"];

/**
 * Kinds that make sense at a given equilibrium temperature (°C, from the
 * star's warmth and the distance): volcanic worlds close to the star, ice and
 * gas giants far from it, oceans in the temperate zone.
 */
const KIND_TEMPERATURES: Record<PlanetKind, { min: number; max: number }> = {
  lava: { min: 120, max: Number.POSITIVE_INFINITY },
  desert: { min: 30, max: 250 },
  toxic: { min: 0, max: 200 },
  ocean: { min: -30, max: 70 },
  ice: { min: Number.NEGATIVE_INFINITY, max: -15 },
  gas: { min: Number.NEGATIVE_INFINITY, max: -30 },
};

/** How much warmer or colder each kind is than its equilibrium temperature. */
const KIND_TEMPERATURE_OFFSETS: Record<PlanetKind, number> = {
  ocean: 0,
  desert: 20,
  ice: -40,
  lava: 250,
  gas: -40,
  toxic: 30,
};

const KINDS: PlanetKind[] = ["lava", "desert", "toxic", "ocean", "ice", "gas"];

function pick<T>(items: readonly T[], random: () => number): T {
  return items[Math.floor(random() * items.length)];
}

function shuffle<T>(items: T[], random: () => number): T[] {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const other = Math.floor(random() * (index + 1));
    [result[index], result[other]] = [result[other], result[index]];
  }
  return result;
}

/** Equilibrium temperature at an orbit, in °C. */
export function orbitTemperature(starType: StarType, orbit: number): number {
  return (278 * STARS[starType].warmth) / Math.sqrt(ORBIT_DISTANCES_AU[orbit]) - 273;
}

export function isKindPlausible(kind: PlanetKind, temperatureC: number): boolean {
  const range = KIND_TEMPERATURES[kind];
  return temperatureC >= range.min && temperatureC <= range.max;
}

/** Builds the system around `home`, always the same for the same planet. */
export function generateStarSystem(
  home: Pick<Planet, "seed" | "name" | "fields">,
): StarSystem {
  const random = createRandom(hashSeed(`${home.seed}:system`));
  // The player's planet keeps the kind its look already has: the star and
  // its orbit are chosen so that this kind makes sense there.
  const homeKind = generatePlanetSprite(home.seed).kind;
  const count = MIN_PLANETS + Math.floor(random() * (MAX_PLANETS - MIN_PLANETS + 1));
  const candidates = shuffle(
    STAR_TYPES.flatMap((starType) =>
      Array.from({ length: count }, (_, orbit) => ({ starType, orbit })),
    ),
    random,
  );
  const placement =
    candidates.find(({ starType, orbit }) =>
      isKindPlausible(homeKind, orbitTemperature(starType, orbit)),
    ) ?? candidates[0];
  const type = placement.starType;
  const homeOrbit = placement.orbit;
  const star: Star = {
    name: `${pick(STAR_STARTS, random)}${pick(STAR_ENDS, random)}`,
    type,
    ...STARS[type],
  };
  const homeDistance = ORBIT_DISTANCES_AU[homeOrbit];

  const planets = Array.from({ length: count }, (_, orbit): SystemPlanet => {
    const isHome = orbit === homeOrbit;
    const equilibrium = orbitTemperature(type, orbit);
    const plausible = KINDS.filter((kind) => isKindPlausible(kind, equilibrium));
    const kind = isHome ? homeKind : pick(plausible.length > 0 ? plausible : KINDS, random);
    const distanceAu = ORBIT_DISTANCES_AU[orbit];
    return {
      id: isHome ? "home" : `orbit-${orbit}`,
      systemId: "home",
      orbit,
      name: isHome ? home.name : `${star.name} ${NUMERALS[orbit]}`,
      seed: isHome ? home.seed : `${home.seed}:orbit:${orbit}`,
      kind,
      isHome,
      fields: isHome ? home.fields : 80 + Math.floor(random() * 161),
      distanceAu,
      distanceFromHomeAu: Math.round(Math.abs(distanceAu - homeDistance) * 10) / 10,
      temperatureC: Math.round(
        equilibrium + KIND_TEMPERATURE_OFFSETS[kind] + (random() - 0.5) * 20,
      ),
      angle: Math.floor(random() * 360),
    };
  });

  return { star, planets };
}

/** A system without the player's planet, from its own seed. */
function generateNeighborSystem(seed: string, systemId: string): StarSystem {
  const random = createRandom(hashSeed(`${seed}:system`));
  const count = MIN_PLANETS + Math.floor(random() * (MAX_PLANETS - MIN_PLANETS + 1));
  const type = pick(STAR_TYPES, random);
  const star: Star = {
    name: `${pick(STAR_STARTS, random)}${pick(STAR_ENDS, random)}`,
    type,
    ...STARS[type],
  };
  const planets = Array.from({ length: count }, (_, orbit): SystemPlanet => {
    const equilibrium = orbitTemperature(type, orbit);
    const plausible = KINDS.filter((kind) => isKindPlausible(kind, equilibrium));
    const kind = pick(plausible.length > 0 ? plausible : KINDS, random);
    return {
      id: `${systemId}-orbit-${orbit}`,
      systemId,
      orbit,
      name: `${star.name} ${NUMERALS[orbit]}`,
      seed: `${seed}:orbit:${orbit}`,
      kind,
      isHome: false,
      fields: 80 + Math.floor(random() * 161),
      distanceAu: ORBIT_DISTANCES_AU[orbit],
      distanceFromHomeAu: null,
      temperatureC: Math.round(
        equilibrium + KIND_TEMPERATURE_OFFSETS[kind] + (random() - 0.5) * 20,
      ),
      angle: Math.floor(random() * 360),
    };
  });
  return { star, planets };
}

/**
 * The player's system and its NEIGHBOR_SYSTEMS neighbors. The neighbor of
 * rank k stands between k and k + 1 times LY_PER_SPACEPORT_LEVEL away, in its
 * own direction, so each one opens at the next spaceport level.
 */
export function generateGalaxy(home: Pick<Planet, "seed" | "name" | "fields">): Galaxy {
  const random = createRandom(hashSeed(`${home.seed}:galaxy`));
  const homeSystem: GalaxySystem = {
    ...generateStarSystem(home),
    id: "home",
    isHome: true,
    x: 0,
    y: 0,
    distanceLy: 0,
  };
  const turn = random() * 360;
  const neighbors = Array.from({ length: NEIGHBOR_SYSTEMS }, (_, rank): GalaxySystem => {
    const id = `n${rank + 1}`;
    const distanceLy =
      Math.round((LY_PER_SPACEPORT_LEVEL * (rank + 0.25 + random() * 0.65)) * 10) / 10;
    // Around the player's system, a quarter turn apart, give or take.
    const angle = ((turn + rank * 97 + random() * 40) * Math.PI) / 180;
    return {
      ...generateNeighborSystem(`${home.seed}:${id}`, id),
      id,
      isHome: false,
      x: Math.round(Math.cos(angle) * distanceLy * 100) / 100,
      y: Math.round(Math.sin(angle) * distanceLy * 100) / 100,
      distanceLy,
    };
  });
  return { systems: [homeSystem, ...neighbors] };
}

/** Distance between two systems of the map, in light-years. */
export function getSystemDistanceLy(from: GalaxySystem, to: GalaxySystem): number {
  return Math.round(Math.hypot(from.x - to.x, from.y - to.y) * 10) / 10;
}
