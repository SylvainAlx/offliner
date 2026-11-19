import { COMPANIONS_PER_HOUSE } from "../utils/constants";
import type { ResourceAmounts, ResourceType } from "./resources";

export const BUILDING_TYPES = ["townHall", "house", "well", "quarry"] as const;

export type BuildingType = (typeof BUILDING_TYPES)[number];

/** Cost of one resource for level `level`: base × factor^(level − fromLevel). */
interface CostCurve {
  base: number;
  factor: number;
  /** First level that costs this resource (1 when omitted). */
  fromLevel?: number;
}

/** Production of one resource per delivery: floor(perLevel × level × growth^level). */
interface ProductionCurve {
  perLevel: number;
  growth: number;
}

export interface BuildingDefinition {
  type: BuildingType;
  label: string;
  icon: string;
  description: string;
  /** Undefined when the building can be upgraded forever. */
  maxLevel?: number;
  /** Buildings (and their level) needed before the first level can start. */
  requires?: Partial<Record<BuildingType, number>>;
  cost: Partial<Record<ResourceType, CostCurve>>;
  /** Construction time of level 1, in offline time. */
  baseConstructionOfflineMs: number;
  /** Each level takes this much longer than the previous one. */
  constructionTimeFactor: number;
  production?: Partial<Record<ResourceType, ProductionCurve>>;
}

const MINUTE = 60 * 1000;

// Costs and durations grow geometrically, as in the browser games of old:
// every level is a little more expensive than the previous one, so the
// village keeps having something to aim for.
export const BUILDINGS: Record<BuildingType, BuildingDefinition> = {
  townHall: {
    type: "townHall",
    label: "Hôtel de ville",
    icon: "🏛️",
    description:
      "Débloque le nom du village, le renommage des compagnons et les bâtiments de production.",
    maxLevel: 1,
    cost: { offlinium: { base: 1800, factor: 1 } },
    baseConstructionOfflineMs: 5 * MINUTE,
    constructionTimeFactor: 1,
  },
  house: {
    type: "house",
    label: "Maison",
    icon: "🏠",
    description: `Chaque niveau accueille ${COMPANIONS_PER_HOUSE} compagnons de plus.`,
    cost: {
      offlinium: { base: 720, factor: 1.5 },
      materials: { base: 300, factor: 1.5, fromLevel: 3 },
    },
    baseConstructionOfflineMs: 2 * MINUTE,
    constructionTimeFactor: 1.5,
  },
  well: {
    type: "well",
    label: "Puits d'Offlinium",
    icon: "⛲",
    description: "Ajoute de l'Offlinium à chaque récolte hors ligne.",
    requires: { townHall: 1 },
    cost: {
      offlinium: { base: 900, factor: 1.6 },
      materials: { base: 200, factor: 1.6, fromLevel: 2 },
    },
    baseConstructionOfflineMs: 4 * MINUTE,
    constructionTimeFactor: 1.5,
    production: { offlinium: { perLevel: 1, growth: 1.1 } },
  },
  quarry: {
    type: "quarry",
    label: "Carrière",
    icon: "⛏️",
    description: "Extrait des matériaux à chaque récolte hors ligne.",
    requires: { townHall: 1 },
    cost: {
      offlinium: { base: 600, factor: 1.6 },
      materials: { base: 150, factor: 1.6, fromLevel: 2 },
    },
    baseConstructionOfflineMs: 3 * MINUTE,
    constructionTimeFactor: 1.5,
    production: { materials: { perLevel: 1, growth: 1.1 } },
  },
};

export function isBuildingType(value: unknown): value is BuildingType {
  return (
    typeof value === "string" &&
    (BUILDING_TYPES as readonly string[]).includes(value)
  );
}

/** What it costs to reach `level` (from level − 1). */
export function getBuildingCost(type: BuildingType, level: number): ResourceAmounts {
  const cost: ResourceAmounts = {};
  for (const [resource, curve] of Object.entries(BUILDINGS[type].cost) as Array<
    [ResourceType, CostCurve]
  >) {
    const fromLevel = curve.fromLevel ?? 1;
    if (level < fromLevel) continue;
    cost[resource] = Math.floor(curve.base * curve.factor ** (level - fromLevel));
  }
  return cost;
}

/** Offline time needed to reach `level` (from level − 1). */
export function getBuildingConstructionMs(type: BuildingType, level: number): number {
  const definition = BUILDINGS[type];
  return Math.round(
    definition.baseConstructionOfflineMs *
      definition.constructionTimeFactor ** Math.max(0, level - 1),
  );
}

/** What a building of this level adds to every delivery. */
export function getBuildingProduction(type: BuildingType, level: number): ResourceAmounts {
  const production: ResourceAmounts = {};
  if (level <= 0) return production;
  for (const [resource, curve] of Object.entries(
    BUILDINGS[type].production ?? {},
  ) as Array<[ResourceType, ProductionCurve]>) {
    const amount = Math.floor(curve.perLevel * level * curve.growth ** level);
    if (amount > 0) production[resource] = amount;
  }
  return production;
}

export class Building {
  id: string;
  type: BuildingType;
  level: number;
  builtAt: number;
  /** Cumulative offline time at which the current level became active. */
  levelOfflineMs: number;

  constructor(type: BuildingType, level = 1, levelOfflineMs = 0) {
    this.id = crypto.randomUUID();
    this.type = type;
    this.level = level;
    this.builtAt = Date.now();
    this.levelOfflineMs = levelOfflineMs;
  }

  get definition(): BuildingDefinition {
    return BUILDINGS[this.type];
  }
}
