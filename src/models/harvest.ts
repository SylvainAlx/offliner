import {
  COMPANION_STAGE_AGE_MS,
  COMPANION_STAGE_HARVEST_BONUS,
  OFFLINIUM_DELIVERY_INTERVAL,
} from "../utils/constants";
import { COMPANION_STAGES, type CompanionStage } from "./companion";
import {
  RESOURCE_TYPES,
  emptyResources,
  type ResourceAmounts,
  type Resources,
} from "./resources";

/**
 * Something that adds `rates` to every delivery made while the cumulative
 * offline time is in [from, to). The harvest of any stretch of offline time
 * follows from these segments alone: nothing ticks, so a long absence is
 * computed exactly, at once, when the app comes back.
 */
export interface RateSegment {
  from: number;
  to: number;
  rates: ResourceAmounts;
}

/** One Offlinium per delivery, whatever the village looks like. */
export const BASE_RATE_SEGMENT: RateSegment = {
  from: Number.NEGATIVE_INFINITY,
  to: Number.POSITIVE_INFINITY,
  rates: { offlinium: 1 },
};

const BONUS_BY_STAGE: Record<CompanionStage, number> = {
  child: 0,
  ...COMPANION_STAGE_HARVEST_BONUS,
};

/** The bonus of a companion born at `birthOfflineMs`, stage by stage. */
export function companionRateSegments(birthOfflineMs: number): RateSegment[] {
  return COMPANION_STAGES.flatMap((stage, index) => {
    const bonus = BONUS_BY_STAGE[stage];
    if (bonus <= 0) return [];
    const nextStage = COMPANION_STAGES[index + 1];
    return [
      {
        from: birthOfflineMs + COMPANION_STAGE_AGE_MS[stage],
        to: nextStage
          ? birthOfflineMs + COMPANION_STAGE_AGE_MS[nextStage]
          : Number.POSITIVE_INFINITY,
        rates: { offlinium: bonus },
      },
    ];
  });
}

export function ratesAt(segments: readonly RateSegment[], offlineMs: number): Resources {
  const rates = emptyResources();
  for (const segment of segments) {
    if (segment.from <= offlineMs && offlineMs < segment.to) {
      for (const type of RESOURCE_TYPES) rates[type] += segment.rates[type] ?? 0;
    }
  }
  return rates;
}

/**
 * Resources delivered between two cumulative offline times (`fromMs`
 * excluded, `toMs` included): one delivery every OFFLINIUM_DELIVERY_INTERVAL
 * of offline time, worth the rates in force at that moment. A companion that
 * becomes a sage, or a building that gains a level, therefore only boosts the
 * deliveries made after it did, never the ones before.
 */
export function resourcesBetween(
  segments: readonly RateSegment[],
  fromMs: number,
  toMs: number,
): Resources {
  const total = emptyResources();
  if (!(toMs > fromMs)) return total;

  // The rates only change at the boundaries of a segment.
  const breakpoints = new Set<number>([fromMs, toMs]);
  for (const segment of segments) {
    for (const at of [segment.from, segment.to]) {
      if (at > fromMs && at < toMs) breakpoints.add(at);
    }
  }
  const points = [...breakpoints].sort((left, right) => left - right);

  for (let index = 0; index < points.length - 1; index += 1) {
    const start = points[index];
    const end = points[index + 1];
    const deliveries =
      Math.floor(end / OFFLINIUM_DELIVERY_INTERVAL) -
      Math.floor(start / OFFLINIUM_DELIVERY_INTERVAL);
    if (deliveries <= 0) continue;
    const rates = ratesAt(segments, start);
    for (const type of RESOURCE_TYPES) total[type] += deliveries * rates[type];
  }
  return total;
}
