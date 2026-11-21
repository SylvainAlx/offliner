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

/** 0 to 3: none, low, medium, high. */
export type Abundance = 0 | 1 | 2 | 3;

export interface SystemPlanet {
  id: string;
  /** Orbit rank from the star, starting at 0. */
  orbit: number;
  name: string;
  /** Seed of its pixel-art look (utils/planetSprite). */
  seed: string;
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
  metal: Abundance;
  fertility: Abundance;
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
const STAR_TYPES: StarType[] = ["yellow", "yellow", "orange", "red", "white"];

const STAR_STARTS = ["Al", "Bel", "Cor", "Dra", "Eri", "Hel", "Ix", "Lyr", "Mira", "Nor", "Pol", "Rig", "Syr", "Tau", "Vel", "Zan"];
const STAR_ENDS = ["deris", "gol", "ion", "kar", "lis", "nar", "on", "phae", "ris", "tar", "ux", "vane"];

/** What each kind of planet tends to offer: metal and fertility. */
const KIND_TRAITS: Record<PlanetKind, { metal: Abundance; fertility: Abundance; temperature: number }> = {
  ocean: { metal: 1, fertility: 3, temperature: 0 },
  desert: { metal: 2, fertility: 1, temperature: 20 },
  ice: { metal: 1, fertility: 0, temperature: -60 },
  lava: { metal: 3, fertility: 0, temperature: 250 },
  gas: { metal: 0, fertility: 0, temperature: -40 },
  toxic: { metal: 2, fertility: 1, temperature: 30 },
};

export const ABUNDANCE_LABELS: Record<Abundance, string> = {
  0: "Aucun",
  1: "Faible",
  2: "Moyen",
  3: "Riche",
};

function pick<T>(items: readonly T[], random: () => number): T {
  return items[Math.floor(random() * items.length)];
}

function clampAbundance(value: number): Abundance {
  return Math.max(0, Math.min(3, Math.round(value))) as Abundance;
}

/** Builds the system around `home`, always the same for the same planet. */
export function generateStarSystem(
  home: Pick<Planet, "seed" | "name" | "fields">,
): StarSystem {
  const random = createRandom(hashSeed(`${home.seed}:system`));
  const type = pick(STAR_TYPES, random);
  const star: Star = {
    name: `${pick(STAR_STARTS, random)}${pick(STAR_ENDS, random)}`,
    type,
    ...STARS[type],
  };

  const count = MIN_PLANETS + Math.floor(random() * (MAX_PLANETS - MIN_PLANETS + 1));
  const homeOrbit = Math.floor(random() * count);
  const homeDistance = ORBIT_DISTANCES_AU[homeOrbit];

  const planets = Array.from({ length: count }, (_, orbit): SystemPlanet => {
    const isHome = orbit === homeOrbit;
    const seed = isHome ? home.seed : `${home.seed}:orbit:${orbit}`;
    const kind = generatePlanetSprite(seed).kind;
    const traits = KIND_TRAITS[kind];
    const distanceAu = ORBIT_DISTANCES_AU[orbit];
    // Equilibrium temperature: warmer close to a warm star.
    const baseKelvin = (278 * star.warmth) / Math.sqrt(distanceAu);
    const variation = random();
    const temperatureC = Math.round(baseKelvin - 273 + traits.temperature + (variation - 0.5) * 20);
    const baseFertility =
      traits.fertility === 0
        ? 0
        : traits.fertility + (random() < 0.25 ? 1 : 0) - (random() < 0.25 ? 1 : 0);
    // Life needs a mild climate: scorching or frozen worlds lose their fertility.
    const isExtreme = temperatureC > 100 || temperatureC < -60;
    const climatePenalty = temperatureC > 50 || temperatureC < -20 ? 1 : 0;
    return {
      id: isHome ? "home" : `orbit-${orbit}`,
      orbit,
      name: isHome ? home.name : `${star.name} ${NUMERALS[orbit]}`,
      seed,
      kind,
      isHome,
      fields: isHome ? home.fields : 80 + Math.floor(random() * 161),
      distanceAu,
      distanceFromHomeAu: Math.round(Math.abs(distanceAu - homeDistance) * 10) / 10,
      temperatureC,
      metal: clampAbundance(traits.metal + (random() < 0.3 ? 1 : 0) - (random() < 0.2 ? 1 : 0)),
      fertility: isExtreme ? 0 : clampAbundance(baseFertility - climatePenalty),
      isColonizable: kind !== "gas",
      angle: Math.floor(random() * 360),
    };
  });

  return { star, planets };
}
