import { BUILDING_TYPES, getBuildingCost, type BuildingLevels } from "./buildings";
import type { ResourceAmounts } from "./resources";
import type { User } from "./user";
import {
  COLONIZATION_COST,
  OFFLINIUM_SCORE_WEIGHT,
  RESOURCES_PER_POINT,
} from "../utils/constants";

/**
 * The score, as in OGame: 1 point per 1000 resources the player's empire is
 * worth. It is worked out from what the player has (building levels, colonies)
 * and not from a history of spending, so every game gets its score at once,
 * and a demolished level, refunded, takes its points away.
 */

/** What resources are worth in the score: Offlinium, rarer, counts twice. */
export function getResourceValue(amounts: ResourceAmounts): number {
  return (
    (amounts.metal ?? 0) +
    (amounts.food ?? 0) +
    OFFLINIUM_SCORE_WEIGHT * (amounts.offlinium ?? 0)
  );
}

/** What every level of a planet's buildings cost, added up. */
export function getBuildingsValue(levels: BuildingLevels): number {
  let value = 0;
  for (const type of BUILDING_TYPES) {
    for (let level = 1; level <= levels[type]; level += 1) {
      value += getResourceValue(getBuildingCost(type, level));
    }
  }
  return value;
}

/** The fixed cost of founding a colony (the fuel depended on the journey). */
export const COLONY_VALUE = getResourceValue(COLONIZATION_COST);

export function getEmpireValue(user: User): number {
  return user.colonies.reduce(
    (value, colony) =>
      value +
      getBuildingsValue(colony.planet.levels) +
      (colony.id === user.homeColonyId ? 0 : COLONY_VALUE),
    0,
  );
}

export function getScore(user: User): number {
  return Math.floor(getEmpireValue(user) / RESOURCES_PER_POINT);
}
