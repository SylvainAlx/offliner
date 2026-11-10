import {
  COMPANION_INVOCATION_COST,
  OFFLINIUM_DELIVERY_INTERVAL,
} from "../utils/constants";
import { PeriodList } from "./periodList";
import { Village } from "./village";
import { particlesBetween } from "./harvest";
import { isFiniteNumber, isRecord, sanitizeName } from "../utils/sanitize";

export interface OffliniumSpend {
  stored: number;
  openPeriod: number;
}

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
   * on demand, with the companions' bonus at each moment.
   */
  offlinium: number;
  settledOfflineMs: number;
  periodList: PeriodList;
  village: Village;
  createdAt: number;

  constructor(name: string = "Joueur") {
    this.name = name;
    this.offlinium = 0;
    this.settledOfflineMs = 0;
    this.periodList = new PeriodList();
    this.village = new Village();
    this.createdAt = Date.now();
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

      const storedOfflinium = isFiniteNumber(parsed.offlinium)
        ? Math.max(0, Math.floor(parsed.offlinium))
        : 0;

      if (isFiniteNumber(parsed.settledOfflineMs)) {
        this.offlinium = storedOfflinium;
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
          this.offliniumHarvestRate;
        const spentDuringOpenPeriod = isFiniteNumber(parsed.offliniumSpentDuringOpenPeriod)
          ? Math.max(0, Math.floor(parsed.offliniumSpentDuringOpenPeriod))
          : 0;
        this.offlinium = Math.max(
          0,
          storedOfflinium + openPeriodParticles - spentDuringOpenPeriod,
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
    copy.offlinium = this.offlinium;
    copy.settledOfflineMs = this.settledOfflineMs;
    copy.createdAt = this.createdAt;
    copy.periodList = this.periodList.clone();
    copy.village = new Village();
    // Instances are copied without running their constructors, which would
    // generate a random name and UUID for every clone.
    copy.village.companions = this.village.companions.map((companion) =>
      cloneInstance(companion),
    );
    copy.village.houses = this.village.houses.map((house) =>
      cloneInstance(house),
    );
    copy.village.name = this.village.name;
    copy.village.townHall = this.village.townHall
      ? cloneInstance(this.village.townHall)
      : null;
    copy.village.pendingElements = this.village.pendingElements.map(
      (pending) => ({ ...pending }),
    );
    return copy;
  }

  /** Current harvest rate, for display. */
  get offliniumHarvestRate(): number {
    return 1 + this.village.offliniumHarvestBonus;
  }

  /** Particles harvested since the balance was last settled. */
  getUnsettledOfflinium(totalOfflineMs: number): number {
    return particlesBetween(
      this.village.companions,
      this.settledOfflineMs,
      totalOfflineMs,
    );
  }

  getAvailableOfflinium(totalOfflineMs: number): number {
    return Math.max(0, this.offlinium + this.getUnsettledOfflinium(totalOfflineMs));
  }

  /** Moves the harvest up to `totalOfflineMs` into the settled balance. */
  settleOfflinium(totalOfflineMs: number): void {
    if (totalOfflineMs <= this.settledOfflineMs) return;
    this.offlinium += this.getUnsettledOfflinium(totalOfflineMs);
    this.settledOfflineMs = totalOfflineMs;
  }

  spendOfflinium(
    amount: number,
    totalOfflineMs: number,
  ): OffliniumSpend | undefined {
    if (amount < 0) {
      throw new Error("Le montant à retirer doit être supérieur à 0.");
    }
    if (this.getAvailableOfflinium(totalOfflineMs) < amount) return;

    this.settleOfflinium(totalOfflineMs);
    this.offlinium -= amount;
    return { stored: amount, openPeriod: 0 };
  }

  closeOfflinePeriod(endTs: number): number | undefined {
    return this.periodList.closeAnyOpenPeriod(endTs);
  }

  refundOfflinium(spend: {
    storedOffliniumCost: number;
    openPeriodOffliniumCost: number;
  }): void {
    // Saves from before the continuous harvest may split a cost in two parts.
    this.offlinium += spend.storedOffliniumCost + spend.openPeriodOffliniumCost;
  }

  releaseCompanionAndGetOfflinium(
    companionId: string,
    totalOfflineMs: number,
  ): boolean {
    if (!this.village.getCompanion(companionId)) return false;

    // What the companion helped harvest so far stays earned.
    this.settleOfflinium(totalOfflineMs);
    this.village.releaseCompanion(companionId);
    this.offlinium += COMPANION_INVOCATION_COST;
    return true;
  }

  updateCompanionStages(totalOfflineMs: number): number {
    return this.village.updateCompanionStages(totalOfflineMs);
  }

  buildTownHall(offlineMs: number, cost: number): boolean {
    if (!this.village.canBuildTownHall()) return false;
    const spend = this.spendOfflinium(cost, offlineMs);
    if (!spend) return false;
    this.village.addPendingElement(
      "townHall",
      offlineMs,
      spend.stored,
      spend.openPeriod,
    );
    return true;
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
    const cancelled = this.village.cancelPendingCompanion(
      companionId,
      currentOfflineMs,
    );
    if (!cancelled) return false;

    this.refundOfflinium(cancelled);
    return true;
  }

  cancelPendingElement(elementId: string, currentOfflineMs: number): boolean {
    const cancelled = this.village.cancelPendingElement(
      elementId,
      currentOfflineMs,
    );
    if (!cancelled) return false;

    this.refundOfflinium(cancelled);
    return true;
  }
}
