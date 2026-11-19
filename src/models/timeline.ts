import { COMPANION_STAGES, type CompanionStage } from "./companion";
import type { BuildingType } from "./building";
import type { Village } from "./village";
import { COMPANION_STAGE_AGE_MS } from "../utils/constants";

/** Something that happens to the village at a given cumulative offline time. */
export type VillageEvent =
  | { kind: "building"; at: number; type: BuildingType; level: number }
  | { kind: "companionArrived"; at: number; name: string | null }
  | { kind: "companionStage"; at: number; name: string | null; stage: CompanionStage };

/** Stages worth telling: every stage after birth. */
const LATER_STAGES = COMPANION_STAGES.filter((stage) => stage !== "child");

function isWithin(at: number, fromMs: number, toMs: number): boolean {
  return at > fromMs && at <= toMs;
}

function stageEvents(
  birthOfflineMs: number,
  name: string | null,
  fromMs: number,
  toMs: number,
): VillageEvent[] {
  return LATER_STAGES.flatMap((stage) => {
    const at = birthOfflineMs + COMPANION_STAGE_AGE_MS[stage];
    return isWithin(at, fromMs, toMs)
      ? [{ kind: "companionStage" as const, at, name, stage }]
      : [];
  });
}

/**
 * What happens to the village between two cumulative offline times (`fromMs`
 * excluded, `toMs` included), in order. It reads both what already happened
 * (levels reached, companions born) and what the queue schedules, so the
 * same function tells the story of an absence and predicts the next one.
 *
 * Only the latest level of a completed building is known: several levels of
 * the same building reached during one absence show up as the last one.
 */
export function getVillageEvents(
  village: Village,
  fromMs: number,
  toMs: number,
): VillageEvent[] {
  if (!(toMs > fromMs)) return [];
  const events: VillageEvent[] = [];

  for (const building of village.buildings) {
    if (isWithin(building.levelOfflineMs, fromMs, toMs)) {
      events.push({
        kind: "building",
        at: building.levelOfflineMs,
        type: building.type,
        level: building.level,
      });
    }
  }

  for (const companion of village.companions) {
    if (isWithin(companion.birthOfflineMs, fromMs, toMs)) {
      events.push({
        kind: "companionArrived",
        at: companion.birthOfflineMs,
        name: companion.name,
      });
    }
    events.push(...stageEvents(companion.birthOfflineMs, companion.name, fromMs, toMs));
  }

  for (const pending of village.pendingElements) {
    const at = pending.offlineMsAtStart + pending.constructionOfflineMs;
    if (pending.type === "companion") {
      if (isWithin(at, fromMs, toMs)) {
        events.push({ kind: "companionArrived", at, name: null });
      }
      events.push(...stageEvents(at, null, fromMs, toMs));
    } else if (isWithin(at, fromMs, toMs)) {
      events.push({
        kind: "building",
        at,
        type: pending.type,
        level: pending.targetLevel ?? 1,
      });
    }
  }

  return events.sort((left, right) => left.at - right.at);
}

/** Offline time at which the whole construction queue will be done. */
export function getQueueEndOfflineMs(village: Village): number | null {
  const last = village.pendingElements.at(-1);
  return last ? last.offlineMsAtStart + last.constructionOfflineMs : null;
}
