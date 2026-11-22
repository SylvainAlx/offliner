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
import { Colony } from "./colony";
import { advanceRealTime, type CompletedConstruction } from "./economy";
import { getConstructionMs, type BuildingType } from "./buildings";
import {
  hasResources,
  sanitizeResources,
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
import {
  isFiniteNumber,
  isNonNegativeNumber,
  isRecord,
  sanitizeId,
  sanitizeName,
} from "../utils/sanitize";

/** Why a building level cannot be started right now. */
export type ConstructionBlocker = "busy" | "noField" | "resources" | null;

/** A level reached, and on which planet. */
export interface ColonyCompletedConstruction extends CompletedConstruction {
  colonyId: string;
}

/**
 * Version of the saved data. 1: a single planet, whose metal, food and
 * population sat on the player. 2: the player owns a list of colonies.
 */
export const SAVE_VERSION = 2;

/**
 * The player and their game. Two clocks drive it:
 * - real time (`realTimeSettledAt`): on every colony, constructions, metal,
 *   food and population;
 * - offline time (`periodList`, `settledOfflineMs`): the player's Offlinium.
 */
export class User {
  saveVersion = SAVE_VERSION;
  name: string;
  createdAt: number;
  periodList: PeriodList;
  /** Offlinium belongs to the player and pays on every planet. */
  offlinium: number;
  /** The player's planets, the starting one first. */
  colonies: Colony[];
  /** The starting planet; the star system is drawn around it. */
  homeColonyId: string;
  /** The planet shown in the Planète and Habitants sections. */
  activeColonyId: string;
  /** Inhabitants in the spotlight: a leader per colony, then one per week. */
  notables: Notable[];
  /** Real time up to which every colony has been computed. */
  realTimeSettledAt: number;
  /** Offline time already turned into Offlinium. */
  settledOfflineMs: number;

  constructor(name = "Joueur", now = Date.now()) {
    this.name = name;
    this.createdAt = now;
    this.periodList = new PeriodList();
    this.offlinium = STARTING_RESOURCES.offlinium;
    const home = new Colony({
      foundedAt: now,
      systemPlanetId: "home",
      resources: { metal: STARTING_RESOURCES.metal, food: STARTING_RESOURCES.food },
      population: STARTING_POPULATION,
    });
    this.colonies = [home];
    this.homeColonyId = home.id;
    this.activeColonyId = home.id;
    this.notables = [createLeader(home.planet.name, now, home.id)];
    this.realTimeSettledAt = now;
    this.settledOfflineMs = 0;
  }

  // --- Colonies -----------------------------------------------------------

  getColony(id: string): Colony | undefined {
    return this.colonies.find((colony) => colony.id === id);
  }

  get homeColony(): Colony {
    return this.getColony(this.homeColonyId) ?? this.colonies[0];
  }

  get activeColony(): Colony {
    return this.getColony(this.activeColonyId) ?? this.homeColony;
  }

  /** A new planet joins the player's, with its own leader from day one. */
  addColony(colony: Colony): void {
    if (this.getColony(colony.id)) return;
    this.colonies.push(colony);
    this.notables.push(createLeader(colony.planet.name, colony.foundedAt, colony.id));
  }

  setActiveColony(id: string): boolean {
    if (!this.getColony(id)) return false;
    this.activeColonyId = id;
    return true;
  }

  /** What a colony can spend: its own metal and food, the player's Offlinium. */
  getResources(colony: Colony = this.activeColony): Resources {
    return { ...colony.resources, offlinium: this.offlinium };
  }

  /** Adds `amounts` (or removes them, with sign -1) where each one is kept. */
  private applyAmounts(colony: Colony, amounts: ResourceAmounts, sign: 1 | -1): void {
    colony.resources.metal += sign * (amounts.metal ?? 0);
    colony.resources.food += sign * (amounts.food ?? 0);
    this.offlinium += sign * (amounts.offlinium ?? 0);
  }

  /** Sum over all the planets, as a total population for instance. */
  sumOverColonies(value: (colony: Colony) => number): number {
    return this.colonies.reduce((total, colony) => total + value(colony), 0);
  }

  /** Best value among the planets, as the highest habitat for instance. */
  maxOverColonies(value: (colony: Colony) => number): number {
    return this.colonies.reduce((best, colony) => Math.max(best, value(colony)), 0);
  }

  /** The star system opens once any planet has a spaceport. */
  get isSystemUnlocked(): boolean {
    return this.maxOverColonies((colony) => colony.planet.levels.spaceport) > 0;
  }

  /** The laboratories of every planet add up their bonuses. */
  get offliniumMultiplier(): number {
    return 1 + this.sumOverColonies((colony) => colony.economy.offliniumMultiplier - 1);
  }

  // --- Clocks -------------------------------------------------------------

  /**
   * Brings the game up to date: Offlinium for the offline time gained since
   * the last settlement, then the real-time economy of every colony. A clock
   * that went back changes nothing until it catches up again. Returns the
   * levels reached.
   */
  advance(now: number, totalOfflineMs: number): ColonyCompletedConstruction[] {
    this.settleOfflinium(totalOfflineMs);
    // A clock that went back only completes what is already due.
    const to = Math.max(now, this.realTimeSettledAt);
    const completed = this.colonies.flatMap((colony) =>
      advanceRealTime(colony, this.realTimeSettledAt, to).map((done) => ({
        ...done,
        colonyId: colony.id,
      })),
    );
    this.realTimeSettledAt = to;
    this.welcomeNotables(to);
    return completed;
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
    this.offlinium += deliveries * this.offliniumMultiplier;
    this.settledOfflineMs = totalOfflineMs;
  }

  // --- Constructions (one site per colony) ---------------------------------

  getConstructionBlocker(
    type: BuildingType,
    colony: Colony = this.activeColony,
  ): ConstructionBlocker {
    if (colony.planet.construction) return "busy";
    if (colony.planet.freeFields <= 0) return "noField";
    if (!hasResources(this.getResources(colony), colony.getNextCost(type))) return "resources";
    return null;
  }

  /** Pays for and starts the next level of a building. Call advance() first. */
  startConstruction(type: BuildingType, now: number, colonyId = this.activeColonyId): boolean {
    const colony = this.getColony(colonyId);
    if (!colony || this.getConstructionBlocker(type, colony) !== null) return false;
    const targetLevel = colony.getNextLevel(type);
    const cost = colony.getNextCost(type);
    this.applyAmounts(colony, cost, -1);
    colony.planet.construction = {
      type,
      targetLevel,
      startedAt: now,
      endsAt: now + getConstructionMs(type, targetLevel),
      cost,
    };
    return true;
  }

  /** Refunds the whole cost: metal to the colony, Offlinium to the player. */
  cancelConstruction(colonyId = this.activeColonyId): boolean {
    const colony = this.getColony(colonyId);
    const construction = colony?.planet.construction;
    if (!colony || !construction) return false;
    this.applyAmounts(colony, construction.cost, 1);
    colony.planet.construction = null;
    return true;
  }

  /** Offlinium needed to skip `ms` of a construction in progress. */
  static getSpeedUpCost(ms: number): number {
    return Math.ceil(Math.max(0, ms) / SPEED_UP_MS_PER_OFFLINIUM);
  }

  /**
   * Spends Offlinium to bring the end of a colony's construction closer by up
   * to `ms`. Call advance() before and after, so that a construction brought
   * to its end completes at once.
   */
  speedUpConstruction(ms: number, now: number, colonyId = this.activeColonyId): boolean {
    const construction = this.getColony(colonyId)?.planet.construction;
    if (!construction || ms <= 0) return false;
    const skipped = Math.min(ms, Math.max(0, construction.endsAt - now));
    if (skipped <= 0) return false;
    const cost = User.getSpeedUpCost(skipped);
    if (Math.floor(this.offlinium) < cost) return false;
    this.offlinium -= cost;
    construction.endsAt -= skipped;
    return true;
  }

  renamePlanet(name: string, colonyId = this.activeColonyId): boolean {
    const colony = this.getColony(colonyId);
    const sanitized = sanitizeName(name);
    if (!colony || !sanitized) return false;
    colony.planet.name = sanitized;
    return true;
  }

  // --- Notable inhabitants ------------------------------------------------

  /** The leader of a colony, the active one by default. */
  getLeader(colonyId = this.activeColonyId): Notable | undefined {
    return this.notables.find(
      (notable) => notable.role === "leader" && notable.colonyId === colonyId,
    );
  }

  get leader(): Notable | undefined {
    return this.getLeader();
  }

  /**
   * Puts one more inhabitant in the spotlight for every week completed. They
   * live on the starting planet for now.
   */
  welcomeNotables(now: number): void {
    const weeks = countWeeksSince(this.createdAt, now);
    const known = new Set(this.notables.map((notable) => notable.id));
    const home = this.homeColony;
    for (let week = 1; week <= weeks; week++) {
      const notable = createWeeklyNotable(home.planet.seed, this.createdAt, week, home.id);
      if (!known.has(notable.id)) this.notables.push(notable);
    }
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
    copy.offlinium = this.offlinium;
    copy.colonies = this.colonies.map((colony) => colony.clone());
    copy.homeColonyId = this.homeColonyId;
    copy.activeColonyId = this.activeColonyId;
    copy.notables = this.notables.map((notable) => ({ ...notable }));
    copy.realTimeSettledAt = this.realTimeSettledAt;
    copy.settledOfflineMs = this.settledOfflineMs;
    return copy;
  }

  /**
   * Imported data is validated field by field, never assigned wholesale.
   * Saves of version 1 (a single planet) become a player with one colony.
   */
  loadFromSnapshot(parsed: unknown): void {
    if (!isRecord(parsed)) return;
    this.name = sanitizeName(parsed.name) ?? this.name;
    if (isFiniteNumber(parsed.createdAt)) this.createdAt = parsed.createdAt;
    if (parsed.periodList !== undefined && parsed.periodList !== null) {
      this.periodList.loadPeriods(parsed.periodList);
    }

    const colonies = Array.isArray(parsed.colonies)
      ? parsed.colonies.flatMap((value) => Colony.fromSnapshot(value, this.createdAt) ?? [])
      : [];
    if (colonies.length > 0) {
      this.colonies = colonies;
      if (isNonNegativeNumber(parsed.offlinium)) this.offlinium = parsed.offlinium;
      const homeId = sanitizeId(parsed.homeColonyId);
      this.homeColonyId = homeId && this.getColony(homeId) ? homeId : colonies[0].id;
      const activeId = sanitizeId(parsed.activeColonyId);
      this.activeColonyId = activeId && this.getColony(activeId) ? activeId : this.homeColonyId;
    } else {
      this.loadVersion1(parsed);
    }

    // Every colony has a leader, saves from before leaders included.
    this.notables = loadNotables(parsed.notables, this.homeColonyId);
    for (const colony of this.colonies) {
      if (!this.getLeader(colony.id)) {
        const foundedAt = colony.id === this.homeColonyId ? this.createdAt : colony.foundedAt;
        this.notables.unshift(createLeader(colony.planet.name, foundedAt, colony.id));
      }
    }

    if (isFiniteNumber(parsed.realTimeSettledAt)) {
      this.realTimeSettledAt = parsed.realTimeSettledAt;
    }
    if (isNonNegativeNumber(parsed.settledOfflineMs)) {
      this.settledOfflineMs = parsed.settledOfflineMs;
    }
  }

  /** Version 1: the planet, its metal, food and population sat on the player. */
  private loadVersion1(parsed: Record<string, unknown>): void {
    const planet = new Planet();
    planet.load(parsed.planet);
    // As in version 1: a resource missing from a saved balance counts as 0.
    const resources = isRecord(parsed.resources)
      ? sanitizeResources(parsed.resources)
      : { ...STARTING_RESOURCES };
    const home = new Colony({
      foundedAt: this.createdAt,
      systemPlanetId: "home",
      planet,
      resources: { metal: resources.metal, food: resources.food },
      population: isNonNegativeNumber(parsed.population)
        ? parsed.population
        : STARTING_POPULATION,
    });
    this.colonies = [home];
    this.homeColonyId = home.id;
    this.activeColonyId = home.id;
    this.offlinium = resources.offlinium;
  }
}
