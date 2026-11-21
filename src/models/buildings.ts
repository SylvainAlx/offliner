import type { ResourceAmounts } from "./resources";

export const BUILDING_TYPES = [
  "metalMine",
  "farm",
  "reactor",
  "depot",
  "laboratory",
  "habitat",
] as const;

export type BuildingType = (typeof BUILDING_TYPES)[number];

export type BuildingLevels = Record<BuildingType, number>;

/** One cost curve: base × factor^(level − 1). */
interface CostCurve {
  metal: number;
  offlinium: number;
  factor: number;
}

/** A quantity that grows a little faster than the level: perLevel × L × 1.1^L. */
function growing(perLevel: number, level: number): number {
  return level <= 0 ? 0 : perLevel * level * 1.1 ** level;
}

export interface BuildingDefinition {
  type: BuildingType;
  label: string;
  icon: string;
  description: string;
  cost: CostCurve;
  /** Metal and food produced per hour (real time) before the production factor. */
  production: (level: number) => { metal?: number; food?: number };
  energyProduced: (level: number) => number;
  energyConsumed: (level: number) => number;
  /** Inhabitants needed to run the building. */
  staff: (level: number) => number;
}

// Values from the design document, to be balanced by simulation.
export const BUILDINGS: Record<BuildingType, BuildingDefinition> = {
  metalMine: {
    type: "metalMine",
    label: "Mine de métal",
    icon: "⛏️",
    description: "Extrait du métal en continu, en temps réel.",
    cost: { metal: 60, offlinium: 15, factor: 1.5 },
    production: (level) => ({ metal: growing(30, level) }),
    energyProduced: () => 0,
    energyConsumed: (level) => growing(10, level),
    staff: (level) => 2 * level,
  },
  farm: {
    type: "farm",
    label: "Ferme",
    icon: "🌾",
    description: "Produit l'alimentation qui nourrit les habitants.",
    cost: { metal: 50, offlinium: 10, factor: 1.5 },
    production: (level) => ({ food: growing(25, level) }),
    energyProduced: () => 0,
    energyConsumed: (level) => growing(8, level),
    staff: (level) => 2 * level,
  },
  depot: {
    type: "depot",
    label: "Dépôt",
    icon: "📦",
    description:
      "Stocke le métal et l'alimentation. Au-delà de sa capacité, ce qui est produit est perdu. L'Offlinium n'est jamais plafonné.",
    cost: { metal: 200, offlinium: 20, factor: 1.8 },
    production: () => ({}),
    energyProduced: () => 0,
    energyConsumed: () => 0,
    staff: (level) => level,
  },
  reactor: {
    type: "reactor",
    label: "Réacteur",
    icon: "⚛️",
    description: "Produit l'énergie dont les autres bâtiments ont besoin.",
    cost: { metal: 75, offlinium: 30, factor: 1.5 },
    production: () => ({}),
    energyProduced: (level) => growing(20, level),
    energyConsumed: () => 0,
    staff: (level) => 2 * level,
  },
  laboratory: {
    type: "laboratory",
    label: "Laboratoire",
    icon: "🔬",
    description: "Augmente l'Offlinium gagné hors ligne de 10 % par niveau.",
    cost: { metal: 200, offlinium: 400, factor: 2 },
    production: () => ({}),
    energyProduced: () => 0,
    energyConsumed: (level) => growing(15, level),
    staff: (level) => 3 * level,
  },
  habitat: {
    type: "habitat",
    label: "Habitat",
    icon: "🏘️",
    description:
      "Loge les habitants : village, puis ville au niveau 6, puis mégalopole au niveau 11.",
    cost: { metal: 100, offlinium: 50, factor: 1.6 },
    production: () => ({}),
    energyProduced: () => 0,
    energyConsumed: (level) => growing(5, level),
    staff: () => 0,
  },
};

/** Every level of every building carries solar panels. */
export const SOLAR_ENERGY_PER_LEVEL = 2;
/** Construction hours = (metal + Offlinium) / this value. */
export const CONSTRUCTION_COST_PER_HOUR = 2500;
/** Each Offlinium level of the laboratory adds this share of the base rate. */
export const LABORATORY_BONUS_PER_LEVEL = 0.1;

const HOUR_MS = 60 * 60 * 1000;

export function isBuildingType(value: unknown): value is BuildingType {
  return (
    typeof value === "string" &&
    (BUILDING_TYPES as readonly string[]).includes(value)
  );
}

export function emptyLevels(): BuildingLevels {
  return { metalMine: 0, farm: 0, reactor: 0, depot: 0, laboratory: 0, habitat: 0 };
}

/** What it costs to reach `level` (from level − 1). */
export function getBuildingCost(type: BuildingType, level: number): ResourceAmounts {
  const { metal, offlinium, factor } = BUILDINGS[type].cost;
  const multiplier = factor ** Math.max(0, level - 1);
  return {
    metal: Math.floor(metal * multiplier),
    offlinium: Math.floor(offlinium * multiplier),
  };
}

/** Real time needed to reach `level`, proportional to its cost. */
export function getConstructionMs(type: BuildingType, level: number): number {
  const cost = getBuildingCost(type, level);
  const hours = ((cost.metal ?? 0) + (cost.offlinium ?? 0)) / CONSTRUCTION_COST_PER_HOUR;
  return Math.max(1000, Math.round(hours * HOUR_MS));
}

// --- Depot ---------------------------------------------------------------

/** Metal and food each fit up to this amount without a depot. */
export const BASE_STORAGE_CAPACITY = 1000;
/** Each depot level multiplies the capacity by this factor. */
export const STORAGE_CAPACITY_FACTOR = 1.8;

/** How much metal, and how much food, the planet can hold. */
export function getStorageCapacity(depotLevel: number): number {
  return Math.floor(BASE_STORAGE_CAPACITY * STORAGE_CAPACITY_FACTOR ** Math.max(0, depotLevel));
}

// --- Habitat ---------------------------------------------------------------

export type SettlementStage = "camp" | "village" | "city" | "megalopolis";

export const SETTLEMENT_LABELS: Record<SettlementStage, string> = {
  camp: "Campement",
  village: "Village",
  city: "Ville",
  megalopolis: "Mégalopole",
};

export function getSettlementStage(habitatLevel: number): SettlementStage {
  if (habitatLevel <= 0) return "camp";
  if (habitatLevel <= 5) return "village";
  if (habitatLevel <= 10) return "city";
  return "megalopolis";
}

/** "Village niv. 3", "Ville niv. 1"…: the level counted within the stage. */
export function describeSettlement(habitatLevel: number): string {
  const stage = getSettlementStage(habitatLevel);
  if (stage === "camp") return SETTLEMENT_LABELS.camp;
  const stageStart = stage === "village" ? 0 : stage === "city" ? 5 : 10;
  return `${SETTLEMENT_LABELS[stage]} niv. ${habitatLevel - stageStart}`;
}

export function getPopulationMax(habitatLevel: number): number {
  if (habitatLevel <= 0) return 10;
  if (habitatLevel <= 5) return 10 + 20 * habitatLevel;
  return Math.floor(10 + 20 * habitatLevel * 1.2 ** (habitatLevel - 5));
}
