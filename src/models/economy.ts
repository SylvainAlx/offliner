import {
  BUILDINGS,
  BUILDING_TYPES,
  LABORATORY_BONUS_PER_LEVEL,
  SOLAR_ENERGY_PER_LEVEL,
  getPopulationMax,
  getStorageCapacity,
  type BuildingLevels,
  type BuildingType,
} from "./buildings";
import type { Planet } from "./planet";
import type { ColonyResources } from "./colony";
import {
  BASE_FOOD_PER_HOUR,
  BASE_METAL_PER_HOUR,
  FOOD_PER_INHABITANT_PER_HOUR,
  POPULATION_GROWTH_PER_HOUR,
  SIMULATION_STEP_MS,
  STARVATION_LOSS_PER_HOUR,
} from "../utils/constants";

const HOUR_MS = 60 * 60 * 1000;

/** The state of the planet's economy at one moment. */
export interface Economy {
  energyProduced: number;
  energyConsumed: number;
  /** Share of the energy needs that is covered (1 = everything). */
  energyFactor: number;
  staffRequired: number;
  /** Share of the staff needs that is covered (1 = everything). */
  staffFactor: number;
  /** min(energyFactor, staffFactor): how fast the buildings run. */
  productionFactor: number;
  metalPerHour: number;
  foodPerHour: number;
  foodEatenPerHour: number;
  populationMax: number;
  /** Metal and food each stop accumulating at this amount (depot). */
  storageCapacity: number;
  /**
   * 1 + this planet's laboratory bonus. The player's Offlinium rate adds up
   * the bonuses of all their planets (User.offliniumMultiplier).
   */
  offliniumMultiplier: number;
}

export function computeEconomy(levels: BuildingLevels, population: number): Economy {
  let energyProduced = 0;
  let energyConsumed = 0;
  let staffRequired = 0;
  let totalLevels = 0;
  let metal = 0;
  let food = 0;

  for (const type of BUILDING_TYPES) {
    const level = levels[type];
    if (level <= 0) continue;
    const definition = BUILDINGS[type];
    totalLevels += level;
    energyProduced += definition.energyProduced(level);
    energyConsumed += definition.energyConsumed(level);
    staffRequired += definition.staff(level);
    const production = definition.production(level);
    metal += production.metal ?? 0;
    food += production.food ?? 0;
  }
  energyProduced += SOLAR_ENERGY_PER_LEVEL * totalLevels;

  const energyFactor =
    energyConsumed <= 0 ? 1 : Math.min(1, energyProduced / energyConsumed);
  const staffFactor =
    staffRequired <= 0 ? 1 : Math.min(1, Math.floor(population) / staffRequired);
  const productionFactor = Math.min(energyFactor, staffFactor);

  return {
    energyProduced,
    energyConsumed,
    energyFactor,
    staffRequired,
    staffFactor,
    productionFactor,
    metalPerHour: BASE_METAL_PER_HOUR + metal * productionFactor,
    foodPerHour: BASE_FOOD_PER_HOUR + food * productionFactor,
    foodEatenPerHour: population * FOOD_PER_INHABITANT_PER_HOUR,
    populationMax: getPopulationMax(levels.habitat),
    storageCapacity: getStorageCapacity(levels.depot),
    offliniumMultiplier:
      1 + LABORATORY_BONUS_PER_LEVEL * levels.laboratory * productionFactor,
  };
}

/** What the real-time clock changes on a planet: a colony. */
export interface RealTimeState {
  planet: Planet;
  resources: ColonyResources;
  population: number;
}

export interface CompletedConstruction {
  type: BuildingType;
  level: number;
  at: number;
}

/**
 * Brings the planet from `fromMs` to `toMs` (real time), in place: metal and
 * food production, food eaten, population growth or starvation, and the end
 * of the construction in progress, at its exact time. The economy changes
 * continuously with the population, so it is computed in steps of
 * SIMULATION_STEP_MS: a week away is about 10 000 steps.
 */
export function advanceRealTime(
  state: RealTimeState,
  fromMs: number,
  toMs: number,
): CompletedConstruction[] {
  const completed: CompletedConstruction[] = [];
  let now = fromMs;

  // A construction that was already due counts from its end.
  const due = state.planet.construction;
  if (due && due.endsAt <= fromMs) {
    finish(state, completed);
  }

  while (now < toMs) {
    const construction = state.planet.construction;
    let next = Math.min(toMs, now + SIMULATION_STEP_MS);
    if (construction && construction.endsAt > now) next = Math.min(next, construction.endsAt);

    applyStep(state, (next - now) / HOUR_MS);
    now = next;

    if (construction && construction.endsAt <= now) finish(state, completed);
  }

  return completed;
}

function finish(state: RealTimeState, completed: CompletedConstruction[]): void {
  const construction = state.planet.construction;
  if (!construction) return;
  state.planet.levels[construction.type] = Math.max(
    state.planet.levels[construction.type],
    construction.targetLevel,
  );
  state.planet.construction = null;
  completed.push({
    type: construction.type,
    level: construction.targetLevel,
    at: construction.endsAt,
  });
}

/**
 * Adds a gain to a stock without going over the capacity. A stock already
 * above it (a refund, for instance) is kept, but does not grow.
 */
function store(stock: number, change: number, capacity: number): number {
  if (change <= 0) return stock + change;
  if (stock >= capacity) return stock;
  return Math.min(capacity, stock + change);
}

export type PopulationStatus = "growing" | "full" | "starving";

export interface PopulationTrend {
  status: PopulationStatus;
  /** Inhabitants gained (or lost) per hour at this moment. */
  perHour: number;
  /** Growth per hour with all the energy needed. */
  fullEnergyPerHour: number;
  /** Time until the maximum is reached, at the current pace. */
  timeToFullMs: number | null;
  /** Time until the food stock runs out, when the planet eats more than it grows. */
  foodRunsOutInMs: number | null;
}

/**
 * Where the population is heading: it grows by POPULATION_GROWTH_PER_HOUR of
 * the maximum per hour (at least 1), slowed down by a lack of energy, up to
 * the habitat's maximum; it shrinks while the planet starves.
 */
export function getPopulationTrend(
  economy: Economy,
  population: number,
  food: number,
): PopulationTrend {
  const foodDeficit = economy.foodEatenPerHour - economy.foodPerHour;
  const foodRunsOutInMs =
    foodDeficit > 0 && food > 0 ? (food / foodDeficit) * HOUR_MS : null;

  if (food <= 0 && foodDeficit > 0) {
    return {
      status: "starving",
      perHour: -population * STARVATION_LOSS_PER_HOUR,
      fullEnergyPerHour: 0,
      timeToFullMs: null,
      foodRunsOutInMs: null,
    };
  }
  const fullEnergyPerHour = Math.max(1, POPULATION_GROWTH_PER_HOUR * economy.populationMax);
  if (population >= economy.populationMax) {
    return { status: "full", perHour: 0, fullEnergyPerHour, timeToFullMs: null, foodRunsOutInMs };
  }
  const perHour = fullEnergyPerHour * economy.energyFactor;
  return {
    status: "growing",
    perHour,
    fullEnergyPerHour,
    timeToFullMs:
      perHour > 0 ? ((economy.populationMax - population) / perHour) * HOUR_MS : null,
    foodRunsOutInMs,
  };
}

function applyStep(state: RealTimeState, hours: number): void {
  if (hours <= 0) return;
  const economy = computeEconomy(state.planet.levels, state.population);
  const capacity = economy.storageCapacity;

  state.resources.metal = store(state.resources.metal, economy.metalPerHour * hours, capacity);

  const food = store(
    state.resources.food,
    (economy.foodPerHour - economy.foodEatenPerHour) * hours,
    capacity,
  );
  const starving = food <= 0 && economy.foodPerHour < economy.foodEatenPerHour;
  state.resources.food = Math.max(0, food);

  if (starving) {
    state.population = Math.max(
      0,
      state.population * (1 - STARVATION_LOSS_PER_HOUR * hours),
    );
  } else if (state.population < economy.populationMax) {
    const trend = getPopulationTrend(economy, state.population, state.resources.food);
    state.population = Math.min(
      economy.populationMax,
      state.population + trend.perHour * hours,
    );
  }
}
