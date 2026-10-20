import { Companion, COMPANION_STAGES, type CompanionStage } from "./companion";
import { House } from "./house";
import {
  COMPANIONS_PER_HOUSE,
  COMPANION_INVOCATION_COST,
  COMPANION_INVOCATION_OFFLINE_MS,
  COMPANION_STAGE_AGE_MS,
  HOUSE_CONSTRUCTION_COST,
  HOUSE_CONSTRUCTION_OFFLINE_MS,
} from "../utils/constants";

export type VillageElementType = "companion" | "house";

export interface PendingElement {
  id: string;
  type: VillageElementType;
  startedAt: number;
  offlineMsAtStart: number;
  constructionOfflineMs: number;
  storedOffliniumCost: number;
  openPeriodOffliniumCost: number;
}

export class Village {
  companions: Companion[];
  houses: House[];
  pendingElements: PendingElement[];

  constructor() {
    this.companions = [];
    this.houses = [];
    this.pendingElements = [];
  }

  loadVillage(village: unknown, currentOfflineMs = 0): void {
    if (typeof village !== "object" || village === null) return;

    const record = village as {
      companions?: unknown;
      houses?: unknown;
      pendingElements?: unknown;
      pendingCompanions?: unknown;
    };

    this.companions = Array.isArray(record.companions)
      ? record.companions.map((companionData) =>
          loadCompanion(companionData, currentOfflineMs),
        )
      : [];

    this.houses = Array.isArray(record.houses)
      ? record.houses.filter(isStoredHouse).map((houseData) => {
          const house = new House();
          Object.assign(house, houseData);
          return house;
        })
      : [];

    const storedPendingElements = Array.isArray(record.pendingElements)
      ? record.pendingElements
          .filter(isPendingElement)
          .map((pending) => normalizePendingElement(pending))
      : [];

    // Migrate saves created before the village construction queue was generic.
    const legacyPendingCompanions = Array.isArray(record.pendingCompanions)
      ? record.pendingCompanions
          .filter(isLegacyPendingCompanion)
          .map((pending) =>
            normalizePendingElement({
              ...pending,
              type: "companion",
              constructionOfflineMs: COMPANION_INVOCATION_OFFLINE_MS,
            }),
          )
      : [];

    this.pendingElements = normalizeQueue([
      ...storedPendingElements,
      ...legacyPendingCompanions,
    ]);
  }

  get companionCapacity(): number {
    return this.houses.length * COMPANIONS_PER_HOUSE;
  }

  get offliniumHarvestBonus(): number {
    return this.companions.reduce(
      (total, companion) => total + companion.harvestBonus,
      0,
    );
  }

  get pendingCompanionCount(): number {
    return this.pendingElements.filter(
      (pending) => pending.type === "companion",
    ).length;
  }

  canInvokeCompanion(): boolean {
    return (
      this.houses.length > 0 &&
      this.companions.length + this.pendingCompanionCount <
        this.companionCapacity
    );
  }

  addCompanion(companion: Companion): void {
    this.companions.push(companion);
  }

  addHouse(house: House): void {
    this.houses.push(house);
  }

  releaseCompanion(companionId: string): boolean {
    const previousLength = this.companions.length;
    this.companions = this.companions.filter(
      (companion) => companion.id !== companionId,
    );
    return this.companions.length < previousLength;
  }

  getCompanion(companionId: string): Companion | undefined {
    return this.companions.find((companion) => companion.id === companionId);
  }

  updateCompanionStages(currentOfflineMs: number): number {
    return this.companions.reduce(
      (updated, companion) =>
        updated + (companion.updateStage(currentOfflineMs) ? 1 : 0),
      0,
    );
  }

  shiftCompanionBirthTimes(offlineMs: number): void {
    if (offlineMs <= 0) return;

    this.companions.forEach((companion) => {
      companion.birthOfflineMs -= offlineMs;
    });
  }

  addPendingElement(
    type: VillageElementType,
    offlineMs: number,
    storedOffliniumCost: number,
    openPeriodOffliniumCost: number,
    startedAt = Date.now(),
  ): void {
    const constructionOfflineMs = getConstructionTime(type);
    const previous = this.pendingElements.at(-1);
    this.pendingElements.push({
      id: crypto.randomUUID(),
      type,
      startedAt,
      constructionOfflineMs,
      storedOffliniumCost,
      openPeriodOffliniumCost,
      offlineMsAtStart: previous
        ? previous.offlineMsAtStart + previous.constructionOfflineMs
        : Math.max(0, offlineMs),
    });
  }

  cancelPendingElement(
    elementId: string,
    currentOfflineMs: number,
  ): PendingElement | undefined {
    const index = this.pendingElements.findIndex(
      (pending) => pending.id === elementId,
    );
    if (index === -1) return;

    const [cancelled] = this.pendingElements.splice(index, 1);
    if (this.pendingElements.length === 0) return cancelled;

    if (index === 0) {
      this.pendingElements[0].offlineMsAtStart = currentOfflineMs;
    }

    for (
      let queueIndex = Math.max(1, index);
      queueIndex < this.pendingElements.length;
      queueIndex += 1
    ) {
      this.pendingElements[queueIndex].offlineMsAtStart =
        this.pendingElements[queueIndex - 1].offlineMsAtStart +
        this.pendingElements[queueIndex - 1].constructionOfflineMs;
    }

    return cancelled;
  }

  completePendingElements(currentOfflineMs: number): number {
    const completed = this.pendingElements.filter(
      (pending) =>
        currentOfflineMs - pending.offlineMsAtStart >=
        pending.constructionOfflineMs,
    );

    if (completed.length === 0) return 0;

    const completedIds = new Set(completed.map((pending) => pending.id));
    this.pendingElements = this.pendingElements.filter(
      (pending) => !completedIds.has(pending.id),
    );
    completed.forEach((pending) => {
      if (pending.type === "house") this.addHouse(new House());
      else this.addCompanion(new Companion(currentOfflineMs));
    });
    return completed.length;
  }

  // Kept as small compatibility wrappers for callers using the old API.
  addPendingCompanion(
    offlineMs: number,
    storedOffliniumCost: number,
    openPeriodOffliniumCost: number,
    startedAt = Date.now(),
  ): void {
    this.addPendingElement(
      "companion",
      offlineMs,
      storedOffliniumCost,
      openPeriodOffliniumCost,
      startedAt,
    );
  }

  cancelPendingCompanion(
    companionId: string,
    currentOfflineMs: number,
  ): PendingElement | undefined {
    const pending = this.pendingElements.find(
      (element) => element.id === companionId && element.type === "companion",
    );
    return pending
      ? this.cancelPendingElement(companionId, currentOfflineMs)
      : undefined;
  }

  completePendingCompanions(currentOfflineMs: number): number {
    const completed = this.pendingElements.filter(
      (pending) =>
        pending.type === "companion" &&
        currentOfflineMs - pending.offlineMsAtStart >=
          pending.constructionOfflineMs,
    );
    if (completed.length === 0) return 0;
    this.completePendingElements(currentOfflineMs);
    return completed.length;
  }
}

function loadCompanion(
  companionData: unknown,
  currentOfflineMs: number,
): Companion {
  const companion = new Companion(currentOfflineMs);
  if (typeof companionData === "object" && companionData !== null) {
    Object.assign(companion, companionData);
  }

  if (!isCompanionStage(companion.stage)) companion.stage = "child";
  if (
    typeof companion.birthOfflineMs !== "number" ||
    !Number.isFinite(companion.birthOfflineMs)
  ) {
    // Legacy saves only know the current stage. Preserve it and start the
    // automatic ageing from that stage's threshold.
    companion.birthOfflineMs = Math.max(
      0,
      currentOfflineMs - COMPANION_STAGE_AGE_MS[companion.stage],
    );
  }
  return companion;
}

function isCompanionStage(value: unknown): value is CompanionStage {
  return (
    typeof value === "string" &&
    (COMPANION_STAGES as readonly string[]).includes(value)
  );
}

function getConstructionTime(type: VillageElementType): number {
  return type === "house"
    ? HOUSE_CONSTRUCTION_OFFLINE_MS
    : COMPANION_INVOCATION_OFFLINE_MS;
}

function normalizePendingElement(
  pending: PendingElement,
): PendingElement {
  return {
    ...pending,
    constructionOfflineMs:
      pending.constructionOfflineMs ?? getConstructionTime(pending.type),
    storedOffliniumCost:
      pending.storedOffliniumCost ??
      (pending.type === "house"
        ? HOUSE_CONSTRUCTION_COST
        : COMPANION_INVOCATION_COST),
    openPeriodOffliniumCost: pending.openPeriodOffliniumCost ?? 0,
  };
}

function normalizeQueue(pendingElements: PendingElement[]): PendingElement[] {
  return pendingElements.map((pending, index) => ({
    ...pending,
    offlineMsAtStart:
      index === 0
        ? pending.offlineMsAtStart
        : pendingElements[index - 1].offlineMsAtStart +
          pendingElements[index - 1].constructionOfflineMs,
  }));
}

function isStoredHouse(value: unknown): value is Pick<House, "id" | "builtAt"> {
  if (typeof value !== "object" || value === null) return false;
  const record = value as Record<string, unknown>;
  return typeof record.id === "string" && typeof record.builtAt === "number";
}

function isPendingElement(value: unknown): value is PendingElement {
  if (typeof value !== "object" || value === null) return false;
  const record = value as Record<string, unknown>;
  return (
    (record.type === "companion" || record.type === "house") &&
    typeof record.id === "string" &&
    typeof record.startedAt === "number" &&
    typeof record.offlineMsAtStart === "number" &&
    (record.constructionOfflineMs === undefined ||
      typeof record.constructionOfflineMs === "number") &&
    (record.storedOffliniumCost === undefined ||
      typeof record.storedOffliniumCost === "number") &&
    (record.openPeriodOffliniumCost === undefined ||
      typeof record.openPeriodOffliniumCost === "number")
  );
}

function isLegacyPendingCompanion(
  value: unknown,
): value is Omit<PendingElement, "type" | "constructionOfflineMs"> {
  if (typeof value !== "object" || value === null) return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.id === "string" &&
    typeof record.startedAt === "number" &&
    typeof record.offlineMsAtStart === "number" &&
    (record.storedOffliniumCost === undefined ||
      typeof record.storedOffliniumCost === "number") &&
    (record.openPeriodOffliniumCost === undefined ||
      typeof record.openPeriodOffliniumCost === "number")
  );
}
