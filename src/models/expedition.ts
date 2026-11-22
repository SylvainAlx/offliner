import { generateStarSystem, type StarSystem, type SystemPlanet } from "./starSystem";
import type { Planet } from "./planet";
import {
  CARGO_CAPACITY_PER_LEVEL,
  CARGO_FUEL_PER_AU,
  COLONIZATION_FUEL_PER_AU,
  FLIGHT_MS_PER_AU,
  MIN_FLIGHT_MS,
  SPACEPORT_RANGE_AU_PER_LEVEL,
} from "../utils/constants";
import { isFiniteNumber, isNonNegativeNumber, isRecord, sanitizeId } from "../utils/sanitize";

/**
 * Expeditions leave from a spaceport towards another planet of the system.
 * Ships are implied: their price is part of the expedition's.
 * - colonization: founds a colony on a free planet with colonists;
 * - cargo: carries metal and food to one of the player's planets.
 */
export type ExpeditionKind = "colonization" | "cargo";

export interface ExpeditionCargo {
  metal: number;
  food: number;
}

export interface Expedition {
  id: string;
  kind: ExpeditionKind;
  fromColonyId: string;
  /** The destination's SystemPlanet.id. */
  targetId: string;
  departAt: number;
  arriveAt: number;
  /** What lands: the colony's first stock, or the cargo. */
  cargo: ExpeditionCargo;
  /** Inhabitants on board (colonization only). */
  colonists: number;
}

export const EXPEDITION_LABELS: Record<ExpeditionKind, string> = {
  colonization: "Colonisation",
  cargo: "Cargo",
};

/** How far a spaceport reaches, in astronomical units. */
export function getSpaceportRange(level: number): number {
  return level * SPACEPORT_RANGE_AU_PER_LEVEL;
}

/** The spaceport level needed to reach `distanceAu`. */
export function getRequiredSpaceportLevel(distanceAu: number): number {
  return Math.max(1, Math.ceil(distanceAu / SPACEPORT_RANGE_AU_PER_LEVEL - 1e-9));
}

export function getCargoCapacity(spaceportLevel: number): number {
  return spaceportLevel * CARGO_CAPACITY_PER_LEVEL;
}

/** Distance between two planets of the system, as the map shows it. */
export function getDistanceAu(from: SystemPlanet, to: SystemPlanet): number {
  return Math.round(Math.abs(from.distanceAu - to.distanceAu) * 10) / 10;
}

export function getFlightMs(distanceAu: number): number {
  return Math.max(MIN_FLIGHT_MS, Math.round(distanceAu * FLIGHT_MS_PER_AU));
}

export function getFuelCost(kind: ExpeditionKind, distanceAu: number): number {
  const perAu = kind === "colonization" ? COLONIZATION_FUEL_PER_AU : CARGO_FUEL_PER_AU;
  return Math.max(1, Math.ceil(distanceAu * perAu));
}

// The system is drawn again for each tick otherwise: it only depends on the
// starting planet, so the last one is kept.
let cachedKey = "";
let cachedSystem: StarSystem | null = null;

/** The star system drawn around the starting planet. */
export function getHomeSystem(home: Pick<Planet, "seed" | "name" | "fields">): StarSystem {
  const key = `${home.seed}\u0000${home.name}\u0000${home.fields}`;
  if (!cachedSystem || cachedKey !== key) {
    cachedSystem = generateStarSystem(home);
    cachedKey = key;
  }
  return cachedSystem;
}

export function loadExpeditions(value: unknown): Expedition[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item): Expedition[] => {
    if (!isRecord(item)) return [];
    const id = sanitizeId(item.id);
    const fromColonyId = sanitizeId(item.fromColonyId);
    const targetId = sanitizeId(item.targetId);
    if (!id || !fromColonyId || !targetId) return [];
    if (item.kind !== "colonization" && item.kind !== "cargo") return [];
    if (!isFiniteNumber(item.departAt) || !isFiniteNumber(item.arriveAt)) return [];
    const cargo = isRecord(item.cargo) ? item.cargo : {};
    return [
      {
        id,
        kind: item.kind,
        fromColonyId,
        targetId,
        departAt: item.departAt,
        arriveAt: item.arriveAt,
        cargo: {
          metal: isNonNegativeNumber(cargo.metal) ? cargo.metal : 0,
          food: isNonNegativeNumber(cargo.food) ? cargo.food : 0,
        },
        colonists: isNonNegativeNumber(item.colonists) ? Math.floor(item.colonists) : 0,
      },
    ];
  });
}
