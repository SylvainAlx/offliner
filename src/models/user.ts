import {
  COMPANION_INVOCATION_COST,
  OFFLINIUM_DELIVERY_INTERVAL,
} from "../utils/constants";
import { PeriodList } from "./periodList";
import { Companion } from "./companion";
import { Village } from "./village";
import { House } from "./house";

export interface OffliniumSpend {
  stored: number;
  openPeriod: number;
}

export class User {
  name: string;
  offlinium: number;
  offliniumSpentDuringOpenPeriod: number;
  periodList: PeriodList;
  village: Village;
  createdAt: number;

  constructor(name: string = "Joueur") {
    this.name = name;
    this.offlinium = 0;
    this.offliniumSpentDuringOpenPeriod = 0;
    this.periodList = new PeriodList();
    this.village = new Village();
    this.createdAt = Date.now();
  }

  loadFromSnapshot(parsed: unknown): void {
    try {
      if (!parsed) return;

      if (Array.isArray(parsed)) {
        this.periodList.loadPeriods(parsed);
        return;
      }

      if (typeof parsed !== "object" || parsed === null) return;
      const record = parsed as Record<string, unknown>;

      if (typeof record.name === "string") this.name = record.name;
      if (typeof record.offlinium === "number")
        this.offlinium = Math.floor(record.offlinium);
      if (typeof record.offliniumSpentDuringOpenPeriod === "number") {
        this.offliniumSpentDuringOpenPeriod = Math.max(
          0,
          Math.floor(record.offliniumSpentDuringOpenPeriod),
        );
      }
      if (typeof record.createdAt === "number")
        this.createdAt = record.createdAt;

      if (record.periodList !== undefined && record.periodList !== null) {
        this.periodList.loadPeriods(record.periodList);
      }
      if (record.village !== undefined && record.village !== null) {
        this.village.loadVillage(
          record.village,
          this.periodList.computeTotalMs(Date.now()),
        );
      }
    } catch (e) {
      console.error("Error loading user data:", e);
      return;
    }
  }

  clone(): User {
    const copy = new User(this.name);
    copy.offlinium = this.offlinium;
    copy.offliniumSpentDuringOpenPeriod = this.offliniumSpentDuringOpenPeriod;
    copy.createdAt = this.createdAt;
    copy.periodList = new PeriodList(
      this.periodList.days.map((day) => ({ ...day })),
      this.periodList.openPeriodStart,
    );
    copy.village = new Village();
    copy.village.companions = this.village.companions.map((companion) => {
      const clonedCompanion = new Companion();
      Object.assign(clonedCompanion, companion);
      return clonedCompanion;
    });
    copy.village.houses = this.village.houses.map((house) => {
      const clonedHouse = new House();
      Object.assign(clonedHouse, house);
      return clonedHouse;
    });
    copy.village.pendingElements = this.village.pendingElements.map(
      (pending) => ({ ...pending }),
    );
    return copy;
  }

  get offliniumHarvestRate(): number {
    return 1 + this.village.offliniumHarvestBonus;
  }

  addOfflinium(periodDurationMs: number): void {
    if (periodDurationMs < 0) {
      throw new Error("La durée du période doit être supérieure à 0.");
    } else {
      this.offlinium +=
        Math.floor(periodDurationMs / OFFLINIUM_DELIVERY_INTERVAL) *
        this.offliniumHarvestRate;
    }
  }

  getCurrentPeriodOfflinium(totalOfflineMs: number): number {
    const completedOfflineMs = this.periodList.computeCompletedMs();

    return (
      Math.floor(
        Math.max(0, totalOfflineMs - completedOfflineMs) /
          OFFLINIUM_DELIVERY_INTERVAL,
      ) * this.offliniumHarvestRate
    );
  }

  getAvailableOfflinium(totalOfflineMs: number): number {
    return Math.max(
      0,
      this.offlinium +
        this.getCurrentPeriodOfflinium(totalOfflineMs) -
        this.offliniumSpentDuringOpenPeriod,
    );
  }

  spendOfflinium(
    amount: number,
    totalOfflineMs: number,
  ): OffliniumSpend | undefined {
    if (amount < 0) {
      throw new Error("Le montant à retirer doit être supérieur à 0.");
    }
    if (this.getAvailableOfflinium(totalOfflineMs) < amount) return;

    const fromStoredBalance = Math.min(amount, this.offlinium);
    this.offlinium -= fromStoredBalance;
    const fromOpenPeriod = amount - fromStoredBalance;
    this.offliniumSpentDuringOpenPeriod += fromOpenPeriod;
    return { stored: fromStoredBalance, openPeriod: fromOpenPeriod };
  }

  closeOfflinePeriod(endTs: number): number | undefined {
    const duration = this.periodList.closeAnyOpenPeriod(endTs);
    if (duration === undefined) return;

    const spentDuringPeriod = this.offliniumSpentDuringOpenPeriod;
    this.addOfflinium(duration);
    this.offlinium = Math.max(0, this.offlinium - spentDuringPeriod);
    this.offliniumSpentDuringOpenPeriod = 0;
    return duration;
  }

  discardOpenPeriod(): void {
    this.periodList.discardOpenPeriod();
    this.offliniumSpentDuringOpenPeriod = 0;
  }

  removeOfflinium(amount: number): void {
    if (amount < 0) {
      throw new Error("Le montant à retirer doit être supérieur à 0.");
    } else {
      this.offlinium = Math.max(0, this.offlinium - amount);
    }
  }

  refundOfflinium(spend: {
    storedOffliniumCost: number;
    openPeriodOffliniumCost: number;
  }): void {
    const refundedFromOpenPeriod = Math.min(
      this.offliniumSpentDuringOpenPeriod,
      spend.openPeriodOffliniumCost,
    );
    const settledOpenPeriodCost =
      spend.openPeriodOffliniumCost - refundedFromOpenPeriod;

    this.offliniumSpentDuringOpenPeriod -= refundedFromOpenPeriod;
    this.offlinium += spend.storedOffliniumCost + settledOpenPeriodCost;
  }

  releaseCompanionAndGetOfflinium(companionId: string): boolean {
    const released = this.village.releaseCompanion(companionId);
    if (!released) return false;

    this.offlinium += COMPANION_INVOCATION_COST;
    return true;
  }

  updateCompanionStages(totalOfflineMs: number): number {
    return this.village.updateCompanionStages(totalOfflineMs);
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
