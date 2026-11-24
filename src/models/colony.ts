import { Planet } from "./planet";
import { computeEconomy, type Economy } from "./economy";
import { getBuildingCost, type BuildingType } from "./buildings";
import type { ResourceAmounts } from "./resources";
import { isFiniteNumber, isNonNegativeNumber, isRecord, sanitizeId } from "../utils/sanitize";

/** What each planet stores for itself. Offlinium belongs to the player. */
export interface ColonyResources {
  metal: number;
  food: number;
}

/** What the planet would look like with one level less of a building. */
export interface DemolitionPreview {
  /** The level the building goes back to. */
  level: number;
  /** Inhabitants who would have no home left and leave the planet. */
  inhabitantsLeaving: number;
  /** How fast the buildings would run (1 = full speed), before and after. */
  productionFactorBefore: number;
  productionFactorAfter: number;
  /** The weaker link after demolition, when the buildings slow down. */
  shortage: "energy" | "staff" | null;
  /** Whether more food would be eaten than produced, while it was not before. */
  startsFoodDeficit: boolean;
  /** The depot's new capacity, when a stock would be above it. */
  storageCapacityExceeded: number | null;
}

export interface ColonyOptions {
  id?: string;
  foundedAt: number;
  planet?: Planet;
  /** Its place in the star system (SystemPlanet.id), when it has one. */
  systemPlanetId?: string | null;
  resources?: ColonyResources;
  population?: number;
}

/**
 * One planet of the player: its buildings and construction site, its own
 * metal and food, and its own inhabitants. The player starts with one and
 * will found others through expeditions.
 */
export class Colony {
  id: string;
  foundedAt: number;
  systemPlanetId: string | null;
  planet: Planet;
  /** Balances, fractions included; only whole units are spent or shown. */
  resources: ColonyResources;
  /** Inhabitants, fractions included while the population grows or shrinks. */
  population: number;

  constructor(options: ColonyOptions) {
    this.id = options.id ?? crypto.randomUUID();
    this.foundedAt = options.foundedAt;
    this.systemPlanetId = options.systemPlanetId ?? null;
    this.planet = options.planet ?? new Planet();
    this.resources = { metal: 0, food: 0, ...options.resources };
    this.population = options.population ?? 0;
  }

  get economy(): Economy {
    return computeEconomy(this.planet.levels, this.population);
  }

  getNextLevel(type: BuildingType): number {
    return this.planet.levels[type] + 1;
  }

  getNextCost(type: BuildingType): ResourceAmounts {
    return getBuildingCost(type, this.getNextLevel(type));
  }

  previewDemolition(type: BuildingType): DemolitionPreview {
    const before = this.economy;
    const levels = { ...this.planet.levels, [type]: Math.max(0, this.planet.levels[type] - 1) };
    const population = Math.min(this.population, computeEconomy(levels, this.population).populationMax);
    const after = computeEconomy(levels, population);
    const slowsDown = after.productionFactor < before.productionFactor - 1e-9;
    const exceeded =
      Math.max(this.resources.metal, this.resources.food) > after.storageCapacity &&
      after.storageCapacity < before.storageCapacity;
    return {
      level: levels[type],
      inhabitantsLeaving: Math.floor(this.population) - Math.floor(population),
      productionFactorBefore: before.productionFactor,
      productionFactorAfter: after.productionFactor,
      shortage: slowsDown ? (after.energyFactor <= after.staffFactor ? "energy" : "staff") : null,
      startsFoodDeficit:
        before.foodPerHour >= before.foodEatenPerHour && after.foodPerHour < after.foodEatenPerHour,
      storageCapacityExceeded: exceeded ? after.storageCapacity : null,
    };
  }

  clone(): Colony {
    return new Colony({
      id: this.id,
      foundedAt: this.foundedAt,
      systemPlanetId: this.systemPlanetId,
      planet: this.planet.clone(),
      resources: { ...this.resources },
      population: this.population,
    });
  }

  /** Imported data is validated field by field; null when unusable. */
  static fromSnapshot(value: unknown, fallbackFoundedAt: number): Colony | null {
    if (!isRecord(value)) return null;
    const id = sanitizeId(value.id);
    if (!id) return null;
    const planet = new Planet();
    planet.load(value.planet);
    const resources = isRecord(value.resources) ? value.resources : {};
    return new Colony({
      id,
      foundedAt: isFiniteNumber(value.foundedAt) ? value.foundedAt : fallbackFoundedAt,
      systemPlanetId: sanitizeId(value.systemPlanetId),
      planet,
      resources: {
        metal: isNonNegativeNumber(resources.metal) ? resources.metal : 0,
        food: isNonNegativeNumber(resources.food) ? resources.food : 0,
      },
      population: isNonNegativeNumber(value.population) ? value.population : 0,
    });
  }
}
