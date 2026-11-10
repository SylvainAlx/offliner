import { Companion, COMPANION_STAGES, type CompanionStage } from "./companion";
import { House } from "./house";
import { TownHall } from "./townHall";
import {
  COMPANIONS_PER_HOUSE,
  COMPANION_INVOCATION_COST,
  COMPANION_INVOCATION_OFFLINE_MS,
  COMPANION_STAGE_AGE_MS,
  HOUSE_CONSTRUCTION_COST,
  HOUSE_CONSTRUCTION_OFFLINE_MS,
  TOWN_HALL_CONSTRUCTION_COST,
  TOWN_HALL_CONSTRUCTION_OFFLINE_MS,
} from "../utils/constants";
import {
  isFiniteNumber,
  isNonNegativeNumber,
  isRecord,
  sanitizeId,
  sanitizeName,
} from "../utils/sanitize";

export type VillageElementType = "companion" | "house" | "townHall";

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
  name: string;
  companions: Companion[];
  houses: House[];
  townHall: TownHall | null;
  pendingElements: PendingElement[];

  constructor() {
    this.name = "Village sans nom";
    this.companions = [];
    this.houses = [];
    this.townHall = null;
    this.pendingElements = [];
  }

  loadVillage(village: unknown, currentOfflineMs = 0): void {
    if (!isRecord(village)) return;
    const record = village;

    this.name = sanitizeName(record.name) ?? this.name;

    this.townHall = loadBuilding(record.townHall, () => new TownHall());

    this.companions = Array.isArray(record.companions)
      ? record.companions
          .filter(isRecord)
          .map((companionData) => loadCompanion(companionData, currentOfflineMs))
      : [];

    this.houses = Array.isArray(record.houses)
      ? record.houses
          .map((houseData) => loadBuilding(houseData, () => new House()))
          .filter((house): house is House => house !== null)
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

  addTownHall(): boolean {
    if (this.townHall !== null) return false;
    this.townHall = new TownHall();
    return true;
  }

  canBuildTownHall(): boolean {
    return (
      this.townHall === null &&
      !this.pendingElements.some((pending) => pending.type === "townHall")
    );
  }

  rename(name: string): boolean {
    const sanitized = sanitizeName(name);
    if (!this.townHall || !sanitized) return false;
    this.name = sanitized;
    return true;
  }

  renameCompanion(companionId: string, name: string): boolean {
    const sanitized = sanitizeName(name);
    if (!this.townHall || !sanitized) return false;
    const companion = this.getCompanion(companionId);
    if (!companion) return false;
    companion.name = sanitized;
    return true;
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

  hasPendingStageUpdates(currentOfflineMs: number): boolean {
    return this.companions.some(
      (companion) => companion.getPendingStage(currentOfflineMs) !== undefined,
    );
  }

  hasCompletedPendingElements(currentOfflineMs: number): boolean {
    return this.pendingElements.some(
      (pending) =>
        currentOfflineMs - pending.offlineMsAtStart >=
        pending.constructionOfflineMs,
    );
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
      else if (pending.type === "townHall") this.addTownHall();
      // Born when its invocation ended, even if this runs later.
      else
        this.addCompanion(
          new Companion(pending.offlineMsAtStart + pending.constructionOfflineMs),
        );
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

// Imported data is never assigned wholesale onto class instances: only known,
// validated fields are copied, so keys such as "__proto__" cannot alter the
// object or inject values of an unexpected type.
function loadCompanion(
  companionData: Record<string, unknown>,
  currentOfflineMs: number,
): Companion {
  const companion = new Companion(currentOfflineMs);
  companion.id = sanitizeId(companionData.id) ?? companion.id;
  companion.name = sanitizeName(companionData.name) ?? companion.name;
  if (isFiniteNumber(companionData.birthdate)) {
    companion.birthdate = companionData.birthdate;
  }
  companion.stage = isCompanionStage(companionData.stage)
    ? companionData.stage
    : "child";

  if (isFiniteNumber(companionData.birthOfflineMs)) {
    companion.birthOfflineMs = companionData.birthOfflineMs;
  } else {
    // Legacy saves only know the current stage. Preserve it and start the
    // automatic ageing from that stage's threshold.
    companion.birthOfflineMs = Math.max(
      0,
      currentOfflineMs - COMPANION_STAGE_AGE_MS[companion.stage],
    );
  }
  return companion;
}

function loadBuilding<T extends House | TownHall>(
  value: unknown,
  create: () => T,
): T | null {
  if (!isRecord(value)) return null;
  const id = sanitizeId(value.id);
  if (id === null || !isFiniteNumber(value.builtAt)) return null;

  const building = create();
  building.id = id;
  building.builtAt = value.builtAt;
  return building;
}

function isCompanionStage(value: unknown): value is CompanionStage {
  return (
    typeof value === "string" &&
    (COMPANION_STAGES as readonly string[]).includes(value)
  );
}

function getConstructionTime(type: VillageElementType): number {
  if (type === "house") return HOUSE_CONSTRUCTION_OFFLINE_MS;
  if (type === "townHall") return TOWN_HALL_CONSTRUCTION_OFFLINE_MS;
  return COMPANION_INVOCATION_OFFLINE_MS;
}

function normalizePendingElement(
  pending: PendingElement,
): PendingElement {
  const defaultCost =
    pending.type === "house"
      ? HOUSE_CONSTRUCTION_COST
      : pending.type === "townHall"
        ? TOWN_HALL_CONSTRUCTION_COST
        : COMPANION_INVOCATION_COST;

  return {
    id: pending.id,
    type: pending.type,
    startedAt: pending.startedAt,
    offlineMsAtStart: pending.offlineMsAtStart,
    constructionOfflineMs: getConstructionTime(pending.type),
    storedOffliniumCost: isNonNegativeNumber(pending.storedOffliniumCost)
      ? pending.storedOffliniumCost
      : defaultCost,
    openPeriodOffliniumCost: isNonNegativeNumber(pending.openPeriodOffliniumCost)
      ? pending.openPeriodOffliniumCost
      : 0,
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

function isOptionalNumber(value: unknown): boolean {
  return value === undefined || isFiniteNumber(value);
}

function isPendingElement(value: unknown): value is PendingElement {
  if (!isRecord(value)) return false;
  return (
    (value.type === "companion" ||
      value.type === "house" ||
      value.type === "townHall") &&
    sanitizeId(value.id) !== null &&
    isFiniteNumber(value.startedAt) &&
    isFiniteNumber(value.offlineMsAtStart) &&
    isOptionalNumber(value.constructionOfflineMs) &&
    isOptionalNumber(value.storedOffliniumCost) &&
    isOptionalNumber(value.openPeriodOffliniumCost)
  );
}

function isLegacyPendingCompanion(
  value: unknown,
): value is Omit<PendingElement, "type" | "constructionOfflineMs"> {
  if (!isRecord(value)) return false;
  return (
    sanitizeId(value.id) !== null &&
    isFiniteNumber(value.startedAt) &&
    isFiniteNumber(value.offlineMsAtStart) &&
    isOptionalNumber(value.storedOffliniumCost) &&
    isOptionalNumber(value.openPeriodOffliniumCost)
  );
}
