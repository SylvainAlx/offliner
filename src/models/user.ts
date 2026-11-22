import { PeriodList } from "./periodList";
import {
  applyNotableChanges,
  countWeeksSince,
  createLeader,
  createWeeklyNotable,
  loadNotables,
  type Notable,
  type NotableChanges,
} from "./notable";
import { Planet } from "./planet";
import {
  advanceRealTime,
  computeEconomy,
  type CompletedConstruction,
  type Economy,
} from "./economy";
import {
  getBuildingCost,
  getConstructionMs,
  type BuildingType,
} from "./buildings";
import {
  addResources,
  hasResources,
  sanitizeResources,
  subtractResources,
  type ResourceAmounts,
  type Resources,
} from "./resources";
import {
  NOTABLE_INTERVAL_MS,
  OFFLINIUM_DELIVERY_INTERVAL,
  SPEED_UP_MS_PER_OFFLINIUM,
  STARTING_POPULATION,
  STARTING_RESOURCES,
} from "../utils/constants";
import { isFiniteNumber, isRecord, sanitizeName } from "../utils/sanitize";

/** Why a building level cannot be started right now. */
export type ConstructionBlocker = "busy" | "noField" | "resources" | null;

/**
 * The player and their game. Two clocks drive it:
 * - real time (`realTimeSettledAt`): constructions, metal, food, population;
 * - offline time (`periodList`, `settledOfflineMs`): Offlinium.
 */
export class User {
  name: string;
  createdAt: number;
  periodList: PeriodList;
  planet: Planet;
  /** Balances, fractions included; only whole units are spent or shown. */
  resources: Resources;
  /** Inhabitants, fractions included while the population grows or shrinks. */
  population: number;
  /** Inhabitants in the spotlight, the planetary leader first. */
  notables: Notable[];
  /** Real time up to which the economy has been computed. */
  realTimeSettledAt: number;
  /** Offline time already turned into Offlinium. */
  settledOfflineMs: number;

  constructor(name = "Joueur", now = Date.now()) {
    this.name = name;
    this.createdAt = now;
    this.periodList = new PeriodList();
    this.planet = new Planet();
    this.resources = { ...STARTING_RESOURCES };
    this.population = STARTING_POPULATION;
    this.notables = [createLeader(this.planet.name, now)];
    this.realTimeSettledAt = now;
    this.settledOfflineMs = 0;
  }

  get economy(): Economy {
    return computeEconomy(this.planet.levels, this.population);
  }

  // --- Clocks -------------------------------------------------------------

  /**
   * Brings the game up to date: Offlinium for the offline time gained since
   * the last settlement, then the real-time economy. A clock that went back
   * changes nothing until it catches up again. Returns the levels reached.
   */
  advance(now: number, totalOfflineMs: number): CompletedConstruction[] {
    this.settleOfflinium(totalOfflineMs);
    // A clock that went back only completes what is already due.
    const to = Math.max(now, this.realTimeSettledAt);
    const completed = advanceRealTime(this, this.realTimeSettledAt, to);
    this.realTimeSettledAt = to;
    this.welcomeNotables(to);
    return completed;
  }

  /** Puts one more inhabitant in the spotlight for every week completed. */
  welcomeNotables(now: number): void {
    const weeks = countWeeksSince(this.createdAt, now);
    const known = new Set(this.notables.map((notable) => notable.id));
    for (let week = 1; week <= weeks; week++) {
      const notable = createWeeklyNotable(this.planet.seed, this.createdAt, week);
      if (!known.has(notable.id)) this.notables.push(notable);
    }
  }

  /**
   * One Offlinium per OFFLINIUM_DELIVERY_INTERVAL of offline time, times the
   * laboratory bonus in force when it is settled.
   */
  settleOfflinium(totalOfflineMs: number): void {
    if (totalOfflineMs <= this.settledOfflineMs) return;
    const deliveries =
      Math.floor(totalOfflineMs / OFFLINIUM_DELIVERY_INTERVAL) -
      Math.floor(this.settledOfflineMs / OFFLINIUM_DELIVERY_INTERVAL);
    this.resources.offlinium += deliveries * this.economy.offliniumMultiplier;
    this.settledOfflineMs = totalOfflineMs;
  }

  // --- Constructions ------------------------------------------------------

  getNextLevel(type: BuildingType): number {
    return this.planet.levels[type] + 1;
  }

  getNextCost(type: BuildingType): ResourceAmounts {
    return getBuildingCost(type, this.getNextLevel(type));
  }

  getConstructionBlocker(type: BuildingType): ConstructionBlocker {
    if (this.planet.construction) return "busy";
    if (this.planet.freeFields <= 0) return "noField";
    if (!hasResources(this.resources, this.getNextCost(type))) return "resources";
    return null;
  }

  /** Pays for and starts the next level of a building. Call advance() first. */
  startConstruction(type: BuildingType, now: number): boolean {
    if (this.getConstructionBlocker(type) !== null) return false;
    const targetLevel = this.getNextLevel(type);
    const cost = this.getNextCost(type);
    subtractResources(this.resources, cost);
    this.planet.construction = {
      type,
      targetLevel,
      startedAt: now,
      endsAt: now + getConstructionMs(type, targetLevel),
      cost,
    };
    return true;
  }

  cancelConstruction(): boolean {
    const construction = this.planet.construction;
    if (!construction) return false;
    addResources(this.resources, construction.cost);
    this.planet.construction = null;
    return true;
  }

  /** Offlinium needed to skip `ms` of the construction in progress. */
  static getSpeedUpCost(ms: number): number {
    return Math.ceil(Math.max(0, ms) / SPEED_UP_MS_PER_OFFLINIUM);
  }

  /**
   * Spends Offlinium to bring the end of the construction closer by up to
   * `ms`. Call advance() before and after, so that a construction brought to
   * its end completes at once.
   */
  speedUpConstruction(ms: number, now: number): boolean {
    const construction = this.planet.construction;
    if (!construction || ms <= 0) return false;
    const skipped = Math.min(ms, Math.max(0, construction.endsAt - now));
    if (skipped <= 0) return false;
    const cost = User.getSpeedUpCost(skipped);
    if (Math.floor(this.resources.offlinium) < cost) return false;
    this.resources.offlinium -= cost;
    construction.endsAt -= skipped;
    return true;
  }

  get leader(): Notable | undefined {
    return this.notables.find((notable) => notable.role === "leader");
  }

  /** The weekly inhabitants, newest first. */
  get weeklyNotables(): Notable[] {
    return this.notables
      .filter((notable) => notable.role === "notable")
      .sort((a, b) => b.featuredAt - a.featuredAt);
  }

  /** Inhabitants still waiting for the player to tell their story. */
  get notablesToCustomize(): number {
    return this.notables.filter((notable) => !notable.isCustomized).length;
  }

  /** When the next inhabitant will be put in the spotlight. */
  getNextNotableAt(now: number): number {
    return this.createdAt + (countWeeksSince(this.createdAt, now) + 1) * NOTABLE_INTERVAL_MS;
  }

  updateNotable(id: string, changes: NotableChanges): boolean {
    const notable = this.notables.find((item) => item.id === id);
    return notable ? applyNotableChanges(notable, changes) : false;
  }

  renamePlanet(name: string): boolean {
    const sanitized = sanitizeName(name);
    if (!sanitized) return false;
    this.planet.name = sanitized;
    return true;
  }

  // --- Offline periods ----------------------------------------------------

  openOfflinePeriod(startTs: number): void {
    this.periodList.openPeriodIfNeeded(startTs);
  }

  closeOfflinePeriod(endTs: number): number | undefined {
    return this.periodList.closeAnyOpenPeriod(endTs);
  }

  // --- Copy and save ------------------------------------------------------

  clone(): User {
    const copy = new User(this.name, this.createdAt);
    copy.periodList = this.periodList.clone();
    copy.planet = this.planet.clone();
    copy.resources = { ...this.resources };
    copy.population = this.population;
    copy.notables = this.notables.map((notable) => ({ ...notable }));
    copy.realTimeSettledAt = this.realTimeSettledAt;
    copy.settledOfflineMs = this.settledOfflineMs;
    return copy;
  }

  /** Imported data is validated field by field, never assigned wholesale. */
  loadFromSnapshot(parsed: unknown): void {
    if (!isRecord(parsed)) return;
    this.name = sanitizeName(parsed.name) ?? this.name;
    if (isFiniteNumber(parsed.createdAt)) this.createdAt = parsed.createdAt;
    if (parsed.periodList !== undefined && parsed.periodList !== null) {
      this.periodList.loadPeriods(parsed.periodList);
    }
    this.planet.load(parsed.planet);
    if (isRecord(parsed.resources)) this.resources = sanitizeResources(parsed.resources);
    if (isFiniteNumber(parsed.population) && parsed.population >= 0) {
      this.population = parsed.population;
    }
    // Every planet has a leader, saves from before leaders included.
    const notables = loadNotables(parsed.notables);
    this.notables = notables.some((notable) => notable.role === "leader")
      ? notables
      : [createLeader(this.planet.name, this.createdAt), ...notables];
    if (isFiniteNumber(parsed.realTimeSettledAt)) {
      this.realTimeSettledAt = parsed.realTimeSettledAt;
    }
    if (isFiniteNumber(parsed.settledOfflineMs) && parsed.settledOfflineMs >= 0) {
      this.settledOfflineMs = parsed.settledOfflineMs;
    }
  }
}
