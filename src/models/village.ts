import { Companion, COMPANION_STAGES, type CompanionStage } from "./companion";
import {
  BUILDINGS,
  BUILDING_TYPES,
  Building,
  getBuildingConstructionMs,
  getBuildingCost,
  getBuildingProduction,
  isBuildingType,
  type BuildingType,
} from "./building";
import {
  BASE_RATE_SEGMENT,
  companionRateSegments,
  type RateSegment,
} from "./harvest";
import {
  sanitizeResourceAmounts,
  type ResourceAmounts,
} from "./resources";
import {
  COMPANIONS_PER_HOUSE,
  COMPANION_INVOCATION_COST,
  COMPANION_INVOCATION_OFFLINE_MS,
  COMPANION_STAGE_AGE_MS,
} from "../utils/constants";
import {
  isFiniteNumber,
  isRecord,
  sanitizeId,
  sanitizeName,
} from "../utils/sanitize";

export type VillageElementType = "companion" | BuildingType;

export interface PendingElement {
  id: string;
  type: VillageElementType;
  /** Level the building reaches when the element completes (buildings only). */
  targetLevel?: number;
  startedAt: number;
  offlineMsAtStart: number;
  constructionOfflineMs: number;
  /** What was paid, refunded in full if the element is cancelled. */
  cost: ResourceAmounts;
}

export class Village {
  name: string;
  companions: Companion[];
  buildings: Building[];
  pendingElements: PendingElement[];

  constructor() {
    this.name = "Village sans nom";
    this.companions = [];
    this.buildings = [];
    this.pendingElements = [];
  }

  loadVillage(village: unknown, currentOfflineMs = 0): void {
    if (!isRecord(village)) return;
    const record = village;

    this.name = sanitizeName(record.name) ?? this.name;

    this.companions = Array.isArray(record.companions)
      ? record.companions
          .filter(isRecord)
          .map((companionData) => loadCompanion(companionData, currentOfflineMs))
      : [];

    this.buildings = loadBuildings(record);

    const storedPendingElements = Array.isArray(record.pendingElements)
      ? record.pendingElements.filter(isStoredPendingElement)
      : [];

    // Migrate saves created before the village construction queue was generic.
    const legacyPendingCompanions: StoredPendingElement[] = Array.isArray(
      record.pendingCompanions,
    )
      ? record.pendingCompanions
          .filter(isLegacyPendingCompanion)
          .map((pending) => ({ ...pending, type: "companion" }))
      : [];

    this.pendingElements = this.normalizeQueue([
      ...storedPendingElements,
      ...legacyPendingCompanions,
    ]);
  }

  // --- Buildings ----------------------------------------------------------

  getBuilding(type: BuildingType): Building | undefined {
    return this.buildings.find((building) => building.type === type);
  }

  getBuildingLevel(type: BuildingType): number {
    return this.getBuilding(type)?.level ?? 0;
  }

  /** Level once everything already queued for this building is done. */
  getPlannedLevel(type: BuildingType): number {
    return (
      this.getBuildingLevel(type) +
      this.pendingElements.filter((pending) => pending.type === type).length
    );
  }

  get townHall(): Building | null {
    return this.getBuilding("townHall") ?? null;
  }

  isBuildingUnlocked(type: BuildingType): boolean {
    const requires = BUILDINGS[type].requires ?? {};
    return (Object.entries(requires) as Array<[BuildingType, number]>).every(
      ([required, level]) => this.getBuildingLevel(required) >= level,
    );
  }

  isBuildingMaxed(type: BuildingType): boolean {
    const maxLevel = BUILDINGS[type].maxLevel;
    return maxLevel !== undefined && this.getPlannedLevel(type) >= maxLevel;
  }

  canQueueBuilding(type: BuildingType): boolean {
    return this.isBuildingUnlocked(type) && !this.isBuildingMaxed(type);
  }

  /** Cost of the next level that could be queued for this building. */
  getNextBuildingCost(type: BuildingType): ResourceAmounts {
    return getBuildingCost(type, this.getPlannedLevel(type) + 1);
  }

  getNextBuildingConstructionMs(type: BuildingType): number {
    return getBuildingConstructionMs(type, this.getPlannedLevel(type) + 1);
  }

  setBuildingLevel(type: BuildingType, level: number, levelOfflineMs = 0): Building {
    const existing = this.getBuilding(type);
    if (existing) {
      existing.level = level;
      existing.levelOfflineMs = levelOfflineMs;
      return existing;
    }
    const building = new Building(type, level, levelOfflineMs);
    this.buildings.push(building);
    return building;
  }

  canBuildTownHall(): boolean {
    return this.canQueueBuilding("townHall");
  }

  addTownHall(): boolean {
    if (this.townHall !== null) return false;
    this.setBuildingLevel("townHall", 1);
    return true;
  }

  // --- Companions ---------------------------------------------------------

  get companionCapacity(): number {
    return this.getBuildingLevel("house") * COMPANIONS_PER_HOUSE;
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
      this.companionCapacity > 0 &&
      this.companions.length + this.pendingCompanionCount <
        this.companionCapacity
    );
  }

  addCompanion(companion: Companion): void {
    this.companions.push(companion);
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

  updateCompanionStages(currentOfflineMs: number): number {
    return this.companions.reduce(
      (updated, companion) =>
        updated + (companion.updateStage(currentOfflineMs) ? 1 : 0),
      0,
    );
  }

  /** Moves every offline timestamp back, when the offline counter is reset. */
  shiftOfflineTimes(offlineMs: number): void {
    if (offlineMs <= 0) return;

    this.companions.forEach((companion) => {
      companion.birthOfflineMs -= offlineMs;
    });
    this.buildings.forEach((building) => {
      building.levelOfflineMs -= offlineMs;
    });
    this.pendingElements.forEach((pending) => {
      pending.offlineMsAtStart -= offlineMs;
    });
  }

  // --- Production ---------------------------------------------------------

  /**
   * Everything that adds to the harvest, past and scheduled: the base rate,
   * each companion stage by stage (including companions whose invocation is
   * queued), and each production building level by level (including queued
   * upgrades, from the moment they complete).
   *
   * A building's current level is counted for all past offline time: the
   * harvest is always settled when a level completes (see
   * User.completePendingElements), so earlier deliveries are already paid.
   */
  getRateSegments(): RateSegment[] {
    const segments: RateSegment[] = [BASE_RATE_SEGMENT];

    for (const companion of this.companions) {
      segments.push(...companionRateSegments(companion.birthOfflineMs));
    }

    const levelChanges = new Map<BuildingType, Array<{ at: number; level: number }>>();
    for (const pending of this.pendingElements) {
      const completesAt = pending.offlineMsAtStart + pending.constructionOfflineMs;
      if (pending.type === "companion") {
        segments.push(...companionRateSegments(completesAt));
      } else if (pending.targetLevel !== undefined) {
        const changes = levelChanges.get(pending.type) ?? [];
        changes.push({ at: completesAt, level: pending.targetLevel });
        levelChanges.set(pending.type, changes);
      }
    }

    for (const type of BUILDING_TYPES) {
      if (!BUILDINGS[type].production) continue;
      let level = this.getBuildingLevel(type);
      let from = Number.NEGATIVE_INFINITY;
      for (const change of levelChanges.get(type) ?? []) {
        segments.push({ from, to: change.at, rates: getBuildingProduction(type, level) });
        from = change.at;
        level = change.level;
      }
      segments.push({
        from,
        to: Number.POSITIVE_INFINITY,
        rates: getBuildingProduction(type, level),
      });
    }

    return segments.filter((segment) =>
      Object.values(segment.rates).some((rate) => (rate ?? 0) > 0),
    );
  }

  // --- Construction queue -------------------------------------------------

  hasCompletedPendingElements(currentOfflineMs: number): boolean {
    return this.pendingElements.some(
      (pending) =>
        currentOfflineMs - pending.offlineMsAtStart >=
        pending.constructionOfflineMs,
    );
  }

  /**
   * Queues a companion invocation or the next level of a building. The
   * caller checks that it is allowed and pays `cost`.
   */
  addPendingElement(
    type: VillageElementType,
    offlineMs: number,
    cost: ResourceAmounts = {},
    startedAt = Date.now(),
  ): PendingElement {
    const targetLevel =
      type === "companion" ? undefined : this.getPlannedLevel(type) + 1;
    const previous = this.pendingElements.at(-1);
    const pending: PendingElement = {
      id: crypto.randomUUID(),
      type,
      ...(targetLevel !== undefined && { targetLevel }),
      startedAt,
      constructionOfflineMs: getConstructionTime(type, targetLevel),
      cost: { ...cost },
      offlineMsAtStart: previous
        ? previous.offlineMsAtStart + previous.constructionOfflineMs
        : Math.max(0, offlineMs),
    };
    this.pendingElements.push(pending);
    return pending;
  }

  /**
   * Removes an element from the queue. Cancelling a building level also
   * cancels the later levels of the same building, which depend on it.
   * Returns every cancelled element, so that the caller refunds them.
   */
  cancelPendingElement(
    elementId: string,
    currentOfflineMs: number,
  ): PendingElement[] {
    const index = this.pendingElements.findIndex(
      (pending) => pending.id === elementId,
    );
    if (index === -1) return [];

    const target = this.pendingElements[index];
    const cancelled = this.pendingElements.filter(
      (pending, position) =>
        pending.id === target.id ||
        (target.type !== "companion" &&
          position > index &&
          pending.type === target.type),
    );
    const cancelledIds = new Set(cancelled.map((pending) => pending.id));
    const activeWasCancelled = index === 0;
    this.pendingElements = this.pendingElements.filter(
      (pending) => !cancelledIds.has(pending.id),
    );
    if (this.pendingElements.length === 0) return cancelled;

    // The active element restarts from now; the others follow it.
    if (activeWasCancelled) {
      this.pendingElements[0].offlineMsAtStart = currentOfflineMs;
    }
    this.chainQueue();
    return cancelled;
  }

  cancelPendingCompanion(
    companionId: string,
    currentOfflineMs: number,
  ): PendingElement[] {
    const pending = this.pendingElements.find(
      (element) => element.id === companionId && element.type === "companion",
    );
    return pending ? this.cancelPendingElement(companionId, currentOfflineMs) : [];
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
      // Effective when it ended, even if this runs later.
      const completedAt = pending.offlineMsAtStart + pending.constructionOfflineMs;
      if (pending.type === "companion") {
        this.addCompanion(new Companion(completedAt));
      } else {
        this.setBuildingLevel(
          pending.type,
          Math.max(this.getBuildingLevel(pending.type), pending.targetLevel ?? 1),
          completedAt,
        );
      }
    });
    return completed.length;
  }

  private chainQueue(): void {
    for (let index = 1; index < this.pendingElements.length; index += 1) {
      const previous = this.pendingElements[index - 1];
      this.pendingElements[index].offlineMsAtStart =
        previous.offlineMsAtStart + previous.constructionOfflineMs;
    }
  }

  /**
   * Rebuilds a stored queue: target levels follow the buildings' current
   * levels, durations come from the catalogue, levels beyond a building's
   * maximum are dropped, and each element starts when the previous one ends.
   */
  private normalizeQueue(stored: StoredPendingElement[]): PendingElement[] {
    const plannedLevels = new Map<BuildingType, number>();
    const queue: PendingElement[] = [];

    for (const element of stored) {
      let targetLevel: number | undefined;
      if (element.type !== "companion") {
        const planned =
          plannedLevels.get(element.type) ?? this.getBuildingLevel(element.type);
        targetLevel = planned + 1;
        const maxLevel = BUILDINGS[element.type].maxLevel;
        if (maxLevel !== undefined && targetLevel > maxLevel) continue;
        plannedLevels.set(element.type, targetLevel);
      }

      // Saves from before building levels paid a flat price and a flat
      // duration: they keep them, rather than the price of the level reached.
      const isLegacy = !isRecord(element.cost);
      const cost = isLegacy
        ? legacyCost(element, targetLevel)
        : sanitizeResourceAmounts(element.cost);

      queue.push({
        id: element.id,
        type: element.type,
        ...(targetLevel !== undefined && { targetLevel }),
        startedAt: element.startedAt,
        offlineMsAtStart: element.offlineMsAtStart,
        constructionOfflineMs: getConstructionTime(
          element.type,
          isLegacy && targetLevel !== undefined ? 1 : targetLevel,
        ),
        cost,
      });
    }

    this.pendingElements = queue;
    this.chainQueue();
    return this.pendingElements;
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

/** Saved buildings, or the separate houses and town hall of older saves. */
function loadBuildings(record: Record<string, unknown>): Building[] {
  const byType = new Map<BuildingType, Building>();

  if (Array.isArray(record.buildings)) {
    for (const value of record.buildings) {
      const building = loadBuilding(value);
      if (!building) continue;
      const existing = byType.get(building.type);
      if (!existing || existing.level < building.level) {
        byType.set(building.type, building);
      }
    }
  }

  // Before levels, every house was a separate building: N houses become a
  // house of level N, which welcomes the same number of companions.
  if (!byType.has("house") && Array.isArray(record.houses)) {
    const houses = record.houses.filter(isLegacyBuilding);
    if (houses.length > 0) {
      const house = new Building("house", houses.length);
      house.id = houses[0].id;
      house.builtAt = Math.min(...houses.map((legacy) => legacy.builtAt));
      byType.set("house", house);
    }
  }

  if (!byType.has("townHall") && isLegacyBuilding(record.townHall)) {
    const townHall = new Building("townHall", 1);
    townHall.id = record.townHall.id;
    townHall.builtAt = record.townHall.builtAt;
    byType.set("townHall", townHall);
  }

  return BUILDING_TYPES.flatMap((type) => {
    const building = byType.get(type);
    return building ? [building] : [];
  });
}

function loadBuilding(value: unknown): Building | null {
  if (!isRecord(value) || !isBuildingType(value.type)) return null;
  const id = sanitizeId(value.id);
  if (id === null || !isFiniteNumber(value.builtAt)) return null;
  if (!isFiniteNumber(value.level) || value.level < 1) return null;

  const maxLevel = BUILDINGS[value.type].maxLevel ?? Number.POSITIVE_INFINITY;
  const building = new Building(
    value.type,
    Math.min(Math.floor(value.level), maxLevel),
    isFiniteNumber(value.levelOfflineMs) ? value.levelOfflineMs : 0,
  );
  building.id = id;
  building.builtAt = value.builtAt;
  return building;
}

function isLegacyBuilding(value: unknown): value is { id: string; builtAt: number } {
  return (
    isRecord(value) && sanitizeId(value.id) !== null && isFiniteNumber(value.builtAt)
  );
}

function isCompanionStage(value: unknown): value is CompanionStage {
  return (
    typeof value === "string" &&
    (COMPANION_STAGES as readonly string[]).includes(value)
  );
}

function getConstructionTime(
  type: VillageElementType,
  targetLevel: number | undefined,
): number {
  if (type === "companion") return COMPANION_INVOCATION_OFFLINE_MS;
  return getBuildingConstructionMs(type, targetLevel ?? 1);
}

interface StoredPendingElement {
  id: string;
  type: VillageElementType;
  startedAt: number;
  offlineMsAtStart: number;
  cost?: unknown;
  storedOffliniumCost?: number;
  openPeriodOffliniumCost?: number;
}

/** Older saves split an Offlinium cost in two parts, both refundable. */
function legacyCost(
  element: StoredPendingElement,
  targetLevel: number | undefined,
): ResourceAmounts {
  const hasStored = isFiniteNumber(element.storedOffliniumCost) && element.storedOffliniumCost >= 0;
  const defaultCost =
    element.type === "companion"
      ? { offlinium: COMPANION_INVOCATION_COST }
      : getBuildingCost(element.type, targetLevel ?? 1);
  if (!hasStored) return defaultCost;

  const openPart =
    isFiniteNumber(element.openPeriodOffliniumCost) && element.openPeriodOffliniumCost >= 0
      ? element.openPeriodOffliniumCost
      : 0;
  return { offlinium: Math.floor((element.storedOffliniumCost ?? 0) + openPart) };
}

function isOptionalNumber(value: unknown): boolean {
  return value === undefined || isFiniteNumber(value);
}

function isVillageElementType(value: unknown): value is VillageElementType {
  return value === "companion" || isBuildingType(value);
}

function isStoredPendingElement(value: unknown): value is StoredPendingElement {
  if (!isRecord(value)) return false;
  return (
    isVillageElementType(value.type) &&
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
): value is Omit<StoredPendingElement, "type"> {
  if (!isRecord(value)) return false;
  return (
    sanitizeId(value.id) !== null &&
    isFiniteNumber(value.startedAt) &&
    isFiniteNumber(value.offlineMsAtStart) &&
    isOptionalNumber(value.storedOffliniumCost) &&
    isOptionalNumber(value.openPeriodOffliniumCost)
  );
}
