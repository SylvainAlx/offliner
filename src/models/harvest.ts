import {
  COMPANION_STAGE_AGE_MS,
  COMPANION_STAGE_HARVEST_BONUS,
  OFFLINIUM_DELIVERY_INTERVAL,
} from "../utils/constants";
import { COMPANION_STAGES, type CompanionStage } from "./companion";

/** What the harvest needs to know about a companion. */
export interface HarvestCompanion {
  birthOfflineMs: number;
}

const BONUS_BY_STAGE: Record<CompanionStage, number> = {
  child: 0,
  ...COMPANION_STAGE_HARVEST_BONUS,
};

/**
 * Harvest bonus of a companion when the cumulative offline time is
 * `offlineMs`. A companion's age is counted in offline time, so its bonus at
 * any moment follows from its birth alone.
 */
export function companionBonusAt(birthOfflineMs: number, offlineMs: number): number {
  const age = offlineMs - birthOfflineMs;
  if (age < 0) return 0;

  let stage: CompanionStage = "child";
  for (const candidate of COMPANION_STAGES) {
    if (age >= COMPANION_STAGE_AGE_MS[candidate]) stage = candidate;
  }
  return BONUS_BY_STAGE[stage];
}

export function harvestRateAt(
  companions: readonly HarvestCompanion[],
  offlineMs: number,
): number {
  return companions.reduce(
    (rate, companion) => rate + companionBonusAt(companion.birthOfflineMs, offlineMs),
    1,
  );
}

/**
 * Particles delivered between two cumulative offline times (`fromMs`
 * excluded, `toMs` included): one delivery every OFFLINIUM_DELIVERY_INTERVAL
 * of offline time, worth the harvest rate in force at that moment. A companion
 * that becomes a sage therefore only boosts the deliveries made after it did,
 * never the ones before.
 */
export function particlesBetween(
  companions: readonly HarvestCompanion[],
  fromMs: number,
  toMs: number,
): number {
  if (!(toMs > fromMs)) return 0;

  // The rate only changes when a companion reaches a new stage.
  const breakpoints = new Set<number>([fromMs, toMs]);
  for (const companion of companions) {
    for (const stage of COMPANION_STAGES) {
      const at = companion.birthOfflineMs + COMPANION_STAGE_AGE_MS[stage];
      if (at > fromMs && at < toMs) breakpoints.add(at);
    }
  }
  const points = [...breakpoints].sort((left, right) => left - right);

  let particles = 0;
  for (let index = 0; index < points.length - 1; index += 1) {
    const start = points[index];
    const end = points[index + 1];
    const deliveries =
      Math.floor(end / OFFLINIUM_DELIVERY_INTERVAL) -
      Math.floor(start / OFFLINIUM_DELIVERY_INTERVAL);
    if (deliveries > 0) particles += deliveries * harvestRateAt(companions, start);
  }
  return particles;
}
