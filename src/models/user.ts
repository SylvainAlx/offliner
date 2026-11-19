import {
  COMPANION_INVOCATION_COST,
  OFFLINIUM_DELIVERY_INTERVAL,
} from "../utils/constants";
import { PeriodList } from "./periodList";
import { Village } from "./village";
import { ratesAt, resourcesBetween } from "./harvest";
import type { BuildingType } from "./building";
import {
  RESOURCE_TYPES,
  addResources,
  emptyResources,
  hasResources,
  sanitizeResources,
  subtractResources,
  type ResourceAmounts,
  type Resources,
} from "./resources";
import { isFiniteNumber, isRecord, sanitizeName } from "../utils/sanitize";

function cloneInstance<T extends object>(instance: T): T {
  return Object.assign(
    Object.create(Object.getPrototypeOf(instance) as object) as T,
    instance,
  );
}

export class User {
  name: string;
  /**
   * Settled balance: everything harvested up to `settledOfflineMs` (cumulative
   * offline time), minus what was spent. What was harvested since is computed
   * on demand, with the rates in force at each moment.
   */
  resources: Resources;
  settledOfflineMs: number;
  periodList: PeriodList;
  village: Village;
  createdAt: number;

  constructor(name: string = "Joueur") {
    this.name = name;
    this.resources = emptyResources();
    this.settledOfflineMs = 0;
    this.periodList = new PeriodList();
    this.village = new Village();
    this.createdAt = Date.now();
  }

  /** Settled Offlinium, kept as a shortcut for the main resource. */
  get offlinium(): number {
    return this.resources.offlinium;
  }

  set offlinium(value: number) {
    this.resources.offlinium = value;
  }

  loadFromSnapshot(parsed: unknown): void {
    try {
      if (!parsed) return;

      if (Array.isArray(parsed)) {
        this.periodList.loadPeriods(parsed);
        this.settledOfflineMs = 0;
        return;
      }

      if (!isRecord(parsed)) return;

      this.name = sanitizeName(parsed.name) ?? this.name;
      if (isFiniteNumber(parsed.createdAt)) this.createdAt = parsed.createdAt;

      if (parsed.periodList !== undefined && parsed.periodList !== null) {
        this.periodList.loadPeriods(parsed.periodList);
      }
      // Offline time the app actually observed: an open period counts up to
      // its last observation, the rest is checked when the app starts.
      const totalOfflineMs = this.periodList.computeTotalMs(
        this.periodList.openPeriodLastSeen ?? Date.now(),
      );
      if (parsed.village !== undefined && parsed.village !== null) {
        this.village.loadVillage(parsed.village, totalOfflineMs);
      }

      // Saves made before several resources only know their Offlinium.
      const storedResources = isRecord(parsed.resources)
        ? sanitizeResources(parsed.resources)
        : sanitizeResources({
            offlinium: isFiniteNumber(parsed.offlinium)
              ? Math.max(0, parsed.offlinium)
              : 0,
          });

      if (isFiniteNumber(parsed.settledOfflineMs)) {
        this.resources = storedResources;
        this.settledOfflineMs = Math.min(
          Math.max(0, parsed.settledOfflineMs),
          totalOfflineMs,
        );
      } else {
        // Saves made before the continuous harvest: closed periods were
        // already paid into `offlinium`, the open one was paid at the current
        // rate minus what was spent during it. Settle all of it now.
        const completedMs = this.periodList.computeCompletedMs();
        const openPeriodParticles =
          Math.floor((totalOfflineMs - completedMs) / OFFLINIUM_DELIVERY_INTERVAL) *
          (1 + this.village.offliniumHarvestBonus);
        const spentDuringOpenPeriod = isFiniteNumber(parsed.offliniumSpentDuringOpenPeriod)
          ? Math.max(0, Math.floor(parsed.offliniumSpentDuringOpenPeriod))
          : 0;
        this.resources = storedResources;
        this.resources.offlinium = Math.max(
          0,
          storedResources.offlinium + openPeriodParticles - spentDuringOpenPeriod,
        );
        this.settledOfflineMs = totalOfflineMs;
      }
    } catch (e) {
      console.error("Error loading user data:", e);
      return;
    }
  }

  clone(): User {
    const copy = new User(this.name);
    copy.resources = { ...this.resources };
    copy.settledOfflineMs = this.settledOfflineMs;
    copy.createdAt = this.createdAt;
    copy.periodList = this.periodList.clone();
    copy.village = new Village();
    // Instances are copied without running their constructors, which would
    // generate a random name and UUID for every clone.
    copy.village.companions = this.village.companions.map((companion) =>
      cloneInstance(companion),
    );
    copy.village.buildings = this.village.buildings.map((building) =>
      cloneInstance(building),
    );
    copy.village.name = this.village.name;
    copy.village.pendingElements = this.village.pendingElements.map(
      (pending) => ({ ...pending, cost: { ...pending.cost } }),
    );
    return copy;
  }

  // --- Harvest ------------------------------------------------------------

  /** What every delivery brings at this moment, for display. */
  getHarvestRates(totalOfflineMs: number): Resources {
    return ratesAt(this.village.getRateSegments(), totalOfflineMs);
  }

  /** Resources harvested since the balance was last settled. */
  getUnsettledResources(totalOfflineMs: number): Resources {
    return resourcesBetween(
      this.village.getRateSegments(),
      this.settledOfflineMs,
      totalOfflineMs,
    );
  }

  getAvailableResources(totalOfflineMs: number): Resources {
    const available = { ...this.resources };
    addResources(available, this.getUnsettledResources(totalOfflineMs));
    for (const type of RESOURCE_TYPES) available[type] = Math.max(0, available[type]);
    return available;
  }

  getAvailableOfflinium(totalOfflineMs: number): number {
    return this.getAvailableResources(totalOfflineMs).offlinium;
  }

  /** Moves the harvest up to `totalOfflineMs` into the settled balance. */
  settleHarvest(totalOfflineMs: number): void {
    if (totalOfflineMs <= this.settledOfflineMs) return;
    addResources(this.resources, this.getUnsettledResources(totalOfflineMs));
    this.settledOfflineMs = totalOfflineMs;
  }

  canAfford(cost: ResourceAmounts, totalOfflineMs: number): boolean {
    return hasResources(this.getAvailableResources(totalOfflineMs), cost);
  }

  spendResources(cost: ResourceAmounts, totalOfflineMs: number): boolean {
    if (RESOURCE_TYPES.some((type) => (cost[type] ?? 0) < 0)) {
      throw new Error("Le montant à retirer doit être supérieur à 0.");
    }
    if (!this.canAfford(cost, totalOfflineMs)) return false;

    this.settleHarvest(totalOfflineMs);
    subtractResources(this.resources, cost);
    return true;
  }

  spendOfflinium(amount: number, totalOfflineMs: number): boolean {
    return this.spendResources({ offlinium: amount }, totalOfflineMs);
  }

  refund(cost: ResourceAmounts): void {
    addResources(this.resources, cost);
  }

  closeOfflinePeriod(endTs: number): number | undefined {
    return this.periodList.closeAnyOpenPeriod(endTs);
  }

  // --- Village ------------------------------------------------------------

  /** Pays for and queues the next level of a building. */
  queueBuilding(type: BuildingType, totalOfflineMs: number): boolean {
    if (!this.village.canQueueBuilding(type)) return false;
    const cost = this.village.getNextBuildingCost(type);
    if (!this.spendResources(cost, totalOfflineMs)) return false;
    this.village.addPendingElement(type, totalOfflineMs, cost);
    return true;
  }

  buildTownHall(totalOfflineMs: number): boolean {
    return this.queueBuilding("townHall", totalOfflineMs);
  }

  invokeCompanion(totalOfflineMs: number): boolean {
    if (!this.village.canInvokeCompanion()) return false;
    const cost = { offlinium: COMPANION_INVOCATION_COST };
    if (!this.spendResources(cost, totalOfflineMs)) return false;
    this.village.addPendingElement("companion", totalOfflineMs, cost);
    return true;
  }

  /**
   * Completes what the queue finished. The harvest is settled first, with
   * the rates scheduled by the queue, so that a building's new level never
   * applies to deliveries made before it was reached.
   */
  completePendingElements(totalOfflineMs: number): number {
    if (!this.village.hasCompletedPendingElements(totalOfflineMs)) return 0;
    this.settleHarvest(totalOfflineMs);
    return this.village.completePendingElements(totalOfflineMs);
  }

  releaseCompanionAndGetOfflinium(
    companionId: string,
    totalOfflineMs: number,
  ): boolean {
    if (!this.village.getCompanion(companionId)) return false;

    // What the companion helped harvest so far stays earned.
    this.settleHarvest(totalOfflineMs);
    this.village.releaseCompanion(companionId);
    this.resources.offlinium += COMPANION_INVOCATION_COST;
    return true;
  }

  updateCompanionStages(totalOfflineMs: number): number {
    return this.village.updateCompanionStages(totalOfflineMs);
  }

  renameVillage(name: string): boolean {
    return this.village.rename(name);
  }

  renameCompanion(companionId: string, name: string): boolean {
    return this.village.renameCompanion(companionId, name);
  }

  cancelCompanionInvocation(
    companionId: string,
    currentOfflineMs: number,
  ): boolean {
    // An element that is already finished can no longer be cancelled.
    this.completePendingElements(currentOfflineMs);
    const cancelled = this.village.cancelPendingCompanion(
      companionId,
      currentOfflineMs,
    );
    cancelled.forEach((pending) => this.refund(pending.cost));
    return cancelled.length > 0;
  }

  cancelPendingElement(elementId: string, currentOfflineMs: number): boolean {
    this.completePendingElements(currentOfflineMs);
    const cancelled = this.village.cancelPendingElement(
      elementId,
      currentOfflineMs,
    );
    cancelled.forEach((pending) => this.refund(pending.cost));
    return cancelled.length > 0;
  }
}
