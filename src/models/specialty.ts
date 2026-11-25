import { hashSeed } from "../utils/planetSprite";
import type { Notable } from "./notable";

/**
 * The weekly inhabitants each have a specialty, drawn from their seed like
 * their name: every game, existing ones included, knows them without a save
 * change. Each specialist adds SPECIALTY_BONUS to their planet (researchers:
 * to the whole empire), and specialists of the same kind add up. Leaders
 * have none: they run the colony.
 */
export const SPECIALTY_TYPES = [
  "geologist",
  "agronomist",
  "physicist",
  "engineer",
  "logistician",
  "medic",
  "pilot",
  "researcher",
] as const;

export type Specialty = (typeof SPECIALTY_TYPES)[number];

/** How many specialists of each kind live on a planet. */
export type SpecialistCounts = Record<Specialty, number>;

/** +5 % per specialist. Durations are divided by the speed, never zero. */
export const SPECIALTY_BONUS = 0.05;

export interface SpecialtyDefinition {
  label: string;
  icon: string;
  /** What the bonus does, for a total of `percent` %. */
  describe: (percent: number) => string;
  /** Whether the bonus helps the whole empire rather than their planet. */
  isEmpireWide: boolean;
}

export const SPECIALTIES: Record<Specialty, SpecialtyDefinition> = {
  geologist: { label: "Géologue", icon: "⛏️", describe: (p) => `+${p} % de métal`, isEmpireWide: false },
  agronomist: {
    label: "Agronome",
    icon: "🌾",
    describe: (p) => `+${p} % d'aliments`,
    isEmpireWide: false,
  },
  physicist: {
    label: "Physicien·ne",
    icon: "⚛️",
    describe: (p) => `+${p} % d'énergie`,
    isEmpireWide: false,
  },
  engineer: {
    label: "Ingénieur·e",
    icon: "🏗️",
    describe: (p) => `chantiers ${p} % plus rapides`,
    isEmpireWide: false,
  },
  logistician: {
    label: "Logisticien·ne",
    icon: "📦",
    describe: (p) => `+${p} % de capacité du dépôt et des cargos`,
    isEmpireWide: false,
  },
  medic: {
    label: "Médecin",
    icon: "🩺",
    describe: (p) => `+${p} % de croissance de la population`,
    isEmpireWide: false,
  },
  pilot: {
    label: "Pilote",
    icon: "🚀",
    describe: (p) => `vols ${p} % plus rapides au départ de la planète`,
    isEmpireWide: false,
  },
  researcher: {
    label: "Chercheur·se",
    icon: "🔬",
    describe: (p) => `+${p} % d'Offlinium, pour tout l'empire`,
    isEmpireWide: true,
  },
};

/** What `count` specialists of a kind bring together: "+10 % de métal". */
export function describeSpecialtyBonus(specialty: Specialty, count = 1): string {
  return SPECIALTIES[specialty].describe(Math.round(SPECIALTY_BONUS * 100 * count));
}

export function emptySpecialists(): SpecialistCounts {
  return Object.fromEntries(SPECIALTY_TYPES.map((type) => [type, 0])) as SpecialistCounts;
}

/** A weekly inhabitant's specialty; null for leaders. */
export function getSpecialty(notable: Pick<Notable, "role" | "seed">): Specialty | null {
  if (notable.role !== "notable") return null;
  return SPECIALTY_TYPES[hashSeed(`${notable.seed}:specialty`) % SPECIALTY_TYPES.length];
}

/** The specialists living on a planet. */
export function countSpecialists(notables: readonly Notable[], colonyId: string): SpecialistCounts {
  const counts = emptySpecialists();
  for (const notable of notables) {
    const specialty = getSpecialty(notable);
    if (specialty && notable.colonyId === colonyId) counts[specialty] += 1;
  }
  return counts;
}

/** 1 + 5 % per specialist of that kind: a production, capacity or speed factor. */
export function getSpecialtyFactor(counts: SpecialistCounts | undefined, specialty: Specialty): number {
  return 1 + SPECIALTY_BONUS * (counts?.[specialty] ?? 0);
}
