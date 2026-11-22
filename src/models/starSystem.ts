import {
  createRandom,
  generatePlanetSprite,
  hashSeed,
  type PlanetKind,
} from "../utils/planetSprite";
import type { Planet } from "./planet";

/**
 * The star system around the player's planet. Everything follows from the
 * planet's seed, so the system is always the same and needs no saving. It is
 * where expeditions will be launched from.
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
  /** Distance to the player's planet, in astronomical units. */
  distanceFromHomeAu: number;
  /** Average surface temperature, in °C. */
  temperatureC: number;
  /** Gas giants have no ground to settle on. */
  isColonizable: boolean;
  /** Angle on its orbit for the map, in degrees. */
  angle: number;
}

export interface StarSystem {
  star: Star;
  planets: SystemPlanet[];
}

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
      isColonizable: kind !== "gas",
      angle: Math.floor(random() * 360),
    };
  });

  return { star, planets };
}
