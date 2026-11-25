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
import {
  getCargoCapacity,
  getGalaxy,
  getTravel,
  getTravelFuel,
  loadExpeditions,
  type Expedition,
  type ExpeditionCargo,
  type ExpeditionKind,
  type Travel,
} from "./expedition";
import type { Galaxy, GalaxySystem, StarSystem, SystemPlanet } from "./starSystem";
import {
  getExchangeAmount,
  getExchangeQuote,
  type ExchangeQuote,
  type ExchangeResource,
} from "./exchange";
import { getScore } from "./score";
import {
  getBuildingCost,
  getConstructionMs,
  getRadarMessageLength,
  type BuildingType,
} from "./buildings";
import {
  decodeSignal,
  encodeSignal,
  loadSignals,
  type RadarSignal,
  type ReceivedSignal,
  type SentSignal,
  type SignalError,
} from "./signal";
import { getPlanetKind } from "./planet";
import { hasResources, type ResourceAmounts, type Resources } from "./resources";
import {
  COLONISTS_PER_SHIP,
  COLONIZATION_COST,
  COLONY_STARTING_RESOURCES,
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

/** Why a level cannot be demolished: nothing built, or the level is being built. */
export type DemolitionBlocker = "notBuilt" | "underConstruction" | null;

/** A level reached, and on which planet. */
export interface ColonyCompletedConstruction extends CompletedConstruction {
  colonyId: string;
}

/** Why an expedition cannot leave right now. */
export type ExpeditionBlocker =
  | "noSpaceport"
  | "samePlanet"
  | "occupied"
  | "notOwned"
  | "outOfRange"
  | "colonists"
  | "emptyCargo"
  | "capacity"
  | "resources"
  | null;

/** Everything about an expedition before it leaves. */
export interface ExpeditionPlan {
  kind: ExpeditionKind;
  from: Colony;
  target: SystemPlanet;
  /** The destination's system. */
  targetSystem: GalaxySystem;
  /** Distance, unit, flight time and the spaceport level the trip needs. */
  travel: Travel;
  /** The departure planet's spaceport level. */
  level: number;
  fuel: number;
  /** Paid at departure: metal and food by the planet, fuel by the player. */
  cost: ResourceAmounts;
  /** What lands at the destination. */
  cargo: ExpeditionCargo;
  colonists: number;
  /** Metal and food a cargo flight can carry. */
  capacity: number;
  blocker: ExpeditionBlocker;
}

/** What happened when an expedition reached its destination. */
export interface ExpeditionReport {
  id: string;
  kind: ExpeditionKind;
  targetName: string;
  arriveAt: number;
  /** founded: a new colony; delivered: cargo unloaded; returned: sent back. */
  outcome: "founded" | "delivered" | "returned";
  cargo: ExpeditionCargo;
  colonists: number;
}

/** Running totals of the game, for the achievements. */
export interface GameStats {
  expeditionsLaunched: number;
  cargoDeliveries: number;
  /** Metal and food units cargo flights have delivered. */
  cargoUnitsDelivered: number;
  signalsSent: number;
  /** Signals from other players' planets (the player's own ones excluded). */
  signalsReceived: number;
}

/** What happened to a code given to the radar. */
export type SignalReception =
  | { status: "received" | "duplicate" | "own"; signal: RadarSignal }
  | { status: "noRadar" }
  | { status: "error"; error: SignalError };

/** Signals kept in the radar's journals, newest first. */
const MAX_SENT_SIGNALS = 30;
const MAX_RECEIVED_SIGNALS = 50;

/** The latest reports are kept, newest first. */
const MAX_REPORTS = 10;

/** Version of the saved data; a save of another version is not loaded. */
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
  /** Expeditions in flight, in the order they left. */
  expeditions: Expedition[];
  /** What the last expeditions did on arrival, newest first. */
  expeditionReports: ExpeditionReport[];
  stats: GameStats;
  /** The radar's journals, newest first. */
  sentSignals: SentSignal[];
  receivedSignals: ReceivedSignal[];
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
    this.expeditions = [];
    this.expeditionReports = [];
    this.stats = {
      expeditionsLaunched: 0,
      cargoDeliveries: 0,
      cargoUnitsDelivered: 0,
      signalsSent: 0,
      signalsReceived: 0,
    };
    this.sentSignals = [];
    this.receivedSignals = [];
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

  /** 1 point per 1000 resources the empire is worth (Offlinium counts twice). */
  get score(): number {
    return getScore(this);
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
    const completed: ColonyCompletedConstruction[] = [];
    // Expeditions land at their exact time: the planets are brought up to it
    // first, and a colony founded then starts from there.
    const due = this.expeditions
      .filter((expedition) => expedition.arriveAt <= to)
      .sort((a, b) => a.arriveAt - b.arriveAt);
    let from = this.realTimeSettledAt;
    for (const expedition of due) {
      const at = Math.max(from, expedition.arriveAt);
      completed.push(...this.advanceColonies(from, at));
      from = at;
      this.land(expedition, at);
    }
    this.expeditions = this.expeditions.filter((expedition) => !due.includes(expedition));
    completed.push(...this.advanceColonies(from, to));
    this.realTimeSettledAt = to;
    this.welcomeNotables(to);
    return completed;
  }

  private advanceColonies(from: number, to: number): ColonyCompletedConstruction[] {
    return this.colonies.flatMap((colony) =>
      advanceRealTime(colony, from, to).map((done) => ({ ...done, colonyId: colony.id })),
    );
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

  getDemolitionBlocker(
    type: BuildingType,
    colony: Colony = this.activeColony,
  ): DemolitionBlocker {
    if (colony.planet.levels[type] <= 0) return "notBuilt";
    if (colony.planet.construction?.type === type) return "underConstruction";
    return null;
  }

  /** What demolishing a building's current level gives back: what that level cost. */
  getDemolitionRefund(type: BuildingType, colony: Colony = this.activeColony): ResourceAmounts {
    return getBuildingCost(type, colony.planet.levels[type]);
  }

  /**
   * Takes a building back to its previous level at once and refunds what that
   * level cost: metal to the colony, Offlinium to the player. The field is
   * freed. Inhabitants without a home leave the planet. Call advance() first.
   */
  demolishBuilding(type: BuildingType, colonyId = this.activeColonyId): boolean {
    const colony = this.getColony(colonyId);
    if (!colony || this.getDemolitionBlocker(type, colony) !== null) return false;
    const refund = this.getDemolitionRefund(type, colony);
    colony.planet.levels[type] -= 1;
    this.applyAmounts(colony, refund, 1);
    colony.population = Math.min(colony.population, colony.economy.populationMax);
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

  // --- Expeditions ---------------------------------------------------------

  /** The star map, drawn around the starting planet: its system, then the neighbors. */
  get galaxy(): Galaxy {
    return getGalaxy(this.homeColony.planet);
  }

  /** The player's own star system. */
  get system(): StarSystem {
    return this.galaxy.systems[0];
  }

  /** A planet of the star map, with its system. */
  findSystemPlanet(id: string): { system: GalaxySystem; planet: SystemPlanet } | undefined {
    for (const system of this.galaxy.systems) {
      const planet = system.planets.find((item) => item.id === id);
      if (planet) return { system, planet };
    }
    return undefined;
  }

  /** Where a colony sits on the star map. */
  getSystemPlanet(colony: Colony): SystemPlanet | undefined {
    return this.findSystemPlanet(colony.systemPlanetId ?? "")?.planet;
  }

  /** The system a colony belongs to. */
  getColonySystem(colony: Colony): GalaxySystem {
    return this.findSystemPlanet(colony.systemPlanetId ?? "")?.system ?? this.galaxy.systems[0];
  }

  /** The trip from a colony to a planet of the star map, if both exist. */
  getTravel(colony: Colony, targetId: string): Travel | undefined {
    const from = this.findSystemPlanet(colony.systemPlanetId ?? "");
    const to = this.findSystemPlanet(targetId);
    return from && to ? getTravel(from.system, from.planet, to.system, to.planet) : undefined;
  }

  /** Whether one of the player's spaceports reaches a planet of the star map. */
  canReach(targetId: string): boolean {
    return this.colonies.some((colony) => {
      const level = colony.planet.levels.spaceport;
      const travel = level > 0 ? this.getTravel(colony, targetId) : undefined;
      return travel !== undefined && travel.requiredLevel <= level;
    });
  }

  /**
   * The lowest spaceport level, among the player's planets, that would reach
   * a system: what to build to open it.
   */
  getLevelToReach(system: GalaxySystem): number {
    const target = system.planets[0];
    return this.colonies.reduce((best, colony) => {
      const travel = this.getTravel(colony, target.id);
      return travel ? Math.min(best, travel.requiredLevel) : best;
    }, Number.POSITIVE_INFINITY);
  }

  /** A system is open once a spaceport reaches it, or a colony is there. */
  isSystemOpen(system: GalaxySystem): boolean {
    return (
      system.isHome ||
      this.colonies.some((colony) => this.getColonySystem(colony).id === system.id) ||
      this.canReach(system.planets[0].id)
    );
  }

  /** The player's colony on a planet of the system, if any. */
  getColonyAt(targetId: string): Colony | undefined {
    return this.colonies.find((colony) => colony.systemPlanetId === targetId);
  }

  /** Colonies besides the starting planet, those on their way included. */
  get colonyCount(): number {
    const onTheWay = this.expeditions.filter((item) => item.kind === "colonization").length;
    return this.colonies.length - 1 + onTheWay;
  }

  /**
   * Works out an expedition from a colony's spaceport towards a planet of the
   * system: distance, flight time, fuel, cost, and what stops it, if anything.
   * Null when the colony or the planet does not exist.
   */
  planExpedition(
    kind: ExpeditionKind,
    fromColonyId: string,
    targetId: string,
    requestedCargo: ExpeditionCargo = { metal: 0, food: 0 },
  ): ExpeditionPlan | null {
    const from = this.getColony(fromColonyId);
    const found = this.findSystemPlanet(targetId);
    const origin = from && this.getSystemPlanet(from);
    const travel = from && this.getTravel(from, targetId);
    if (!from || !found || !origin || !travel) return null;
    const target = found.planet;

    const level = from.planet.levels.spaceport;
    const fuel = getTravelFuel(kind, travel);
    const capacity = getCargoCapacity(level);
    const isColonization = kind === "colonization";
    const cargo: ExpeditionCargo = isColonization
      ? { ...COLONY_STARTING_RESOURCES }
      : {
          metal: Math.max(0, Math.floor(requestedCargo.metal)),
          food: Math.max(0, Math.floor(requestedCargo.food)),
        };
    const cost: ResourceAmounts = isColonization
      ? { ...COLONIZATION_COST, offlinium: fuel }
      : { ...cargo, offlinium: fuel };
    const colonists = isColonization ? COLONISTS_PER_SHIP : 0;
    const flyingThere = this.expeditions.some(
      (item) => item.kind === "colonization" && item.targetId === targetId,
    );

    let blocker: ExpeditionBlocker = null;
    if (level <= 0) blocker = "noSpaceport";
    else if (target.id === origin.id) blocker = "samePlanet";
    else if (isColonization && (this.getColonyAt(targetId) || flyingThere)) blocker = "occupied";
    else if (!isColonization && !this.getColonyAt(targetId)) blocker = "notOwned";
    else if (travel.requiredLevel > level) blocker = "outOfRange";
    // The departure planet keeps at least one inhabitant.
    else if (isColonization && Math.floor(from.population) <= colonists) blocker = "colonists";
    else if (!isColonization && cargo.metal + cargo.food <= 0) blocker = "emptyCargo";
    else if (!isColonization && cargo.metal + cargo.food > capacity) blocker = "capacity";
    else if (!hasResources(this.getResources(from), cost)) blocker = "resources";

    return {
      kind,
      from,
      target,
      targetSystem: found.system,
      travel,
      level,
      fuel,
      cost,
      cargo,
      colonists,
      capacity,
      blocker,
    };
  }

  /** Pays for an expedition and sends it off. Call advance() first. */
  launchExpedition(
    kind: ExpeditionKind,
    fromColonyId: string,
    targetId: string,
    now: number,
    cargo?: ExpeditionCargo,
  ): boolean {
    const plan = this.planExpedition(kind, fromColonyId, targetId, cargo);
    if (!plan || plan.blocker !== null) return false;
    this.applyAmounts(plan.from, plan.cost, -1);
    plan.from.population -= plan.colonists;
    this.expeditions.push({
      id: crypto.randomUUID(),
      kind,
      fromColonyId,
      targetId,
      departAt: now,
      arriveAt: now + plan.travel.flightMs,
      cargo: { ...plan.cargo },
      colonists: plan.colonists,
    });
    this.stats.expeditionsLaunched += 1;
    return true;
  }

  /** An expedition reaches its destination at `at`. */
  private land(expedition: Expedition, at: number): void {
    const target = this.findSystemPlanet(expedition.targetId)?.planet;
    const destination = this.getColonyAt(expedition.targetId);
    let outcome: ExpeditionReport["outcome"];

    if (expedition.kind === "cargo" && destination) {
      destination.resources.metal += expedition.cargo.metal;
      destination.resources.food += expedition.cargo.food;
      this.stats.cargoDeliveries += 1;
      this.stats.cargoUnitsDelivered += expedition.cargo.metal + expedition.cargo.food;
      outcome = "delivered";
    } else if (
      expedition.kind === "colonization" &&
      target &&
      !destination
    ) {
      const planet = new Planet(target.name, target.seed);
      planet.kind = target.kind;
      planet.fields = target.fields;
      this.addColony(
        new Colony({
          foundedAt: at,
          systemPlanetId: target.id,
          planet,
          resources: { ...expedition.cargo },
          population: expedition.colonists,
        }),
      );
      outcome = "founded";
    } else {
      // Nowhere to land: everything goes back to the departure planet.
      const origin = this.getColony(expedition.fromColonyId) ?? this.homeColony;
      origin.resources.metal += expedition.cargo.metal;
      origin.resources.food += expedition.cargo.food;
      origin.population += expedition.colonists;
      outcome = "returned";
    }

    this.expeditionReports = [
      {
        id: expedition.id,
        kind: expedition.kind,
        targetName: destination?.planet.name ?? target?.name ?? "?",
        arriveAt: at,
        outcome,
        cargo: { ...expedition.cargo },
        colonists: expedition.colonists,
      },
      ...this.expeditionReports,
    ].slice(0, MAX_REPORTS);
  }

  // --- Exchange ------------------------------------------------------------

  /** What Offlinium is worth on a planet, the active one by default. */
  getExchangeQuote(resource: ExchangeResource, colony: Colony = this.activeColony): ExchangeQuote {
    return getExchangeQuote(colony, resource, this.offlinium, this.offliniumMultiplier);
  }

  /**
   * Exchanges whole Offlinium for metal or food on a planet, at one hour of
   * Offlinium for one hour of production. Refused beyond the balance, beyond
   * the room left in the depot, or when it would bring nothing. Returns the
   * units received, or 0.
   */
  exchangeOfflinium(
    resource: ExchangeResource,
    offlinium: number,
    colonyId = this.activeColonyId,
  ): number {
    const colony = this.getColony(colonyId);
    if (!colony || !Number.isInteger(offlinium) || offlinium <= 0) return 0;
    const quote = this.getExchangeQuote(resource, colony);
    const received = getExchangeAmount(quote, offlinium);
    if (offlinium > quote.maxOfflinium || received <= 0) return 0;
    this.offlinium -= offlinium;
    colony.resources[resource] += received;
    return received;
  }

  // --- Radar ---------------------------------------------------------------

  /** The radar opens once any planet has one. */
  get isRadarBuilt(): boolean {
    return this.maxOverColonies((colony) => colony.planet.levels.radar) > 0;
  }

  /**
   * Sends a signal from a colony's radar, signed by one of the player's
   * notable inhabitants. Returns the signal and its code, or null when the
   * colony has no radar, the author is unknown or the message is empty or too
   * long for the radar's level.
   */
  emitSignal(colonyId: string, authorId: string, message: string, now: number): SentSignal | null {
    const colony = this.getColony(colonyId);
    const author = this.notables.find((notable) => notable.id === authorId);
    const level = colony?.planet.levels.radar ?? 0;
    const text = message.trim();
    if (!colony || !author || level <= 0) return null;
    if (!text || text.length > getRadarMessageLength(level)) return null;

    const content = {
      planetName: colony.planet.name,
      planetSeed: colony.planet.seed,
      planetKind: getPlanetKind(colony.planet),
      authorName: author.name,
      authorTitle: author.title,
      authorSeed: author.seed,
      message: text,
      sentAt: now,
      score: this.score,
    };
    const code = encodeSignal(content);
    const decoded = decodeSignal(code);
    if (!decoded.ok) return null;
    const sent: SentSignal = { ...decoded.signal, code };
    this.sentSignals = [sent, ...this.sentSignals].slice(0, MAX_SENT_SIGNALS);
    this.stats.signalsSent += 1;
    return sent;
  }

  /**
   * Decodes a code captured by the radar. A new signal from another player's
   * planet joins the journal; the player's own signals and those already
   * received are recognized but not added again.
   */
  receiveSignal(code: string, now: number): SignalReception {
    if (!this.isRadarBuilt) return { status: "noRadar" };
    const decoded = decodeSignal(code);
    if (!decoded.ok) return { status: "error", error: decoded.error };
    const { signal } = decoded;
    if (this.sentSignals.some((sent) => sent.id === signal.id)) return { status: "own", signal };
    if (this.receivedSignals.some((received) => received.id === signal.id)) {
      return { status: "duplicate", signal };
    }
    this.receivedSignals = [{ ...signal, receivedAt: now }, ...this.receivedSignals].slice(
      0,
      MAX_RECEIVED_SIGNALS,
    );
    this.stats.signalsReceived += 1;
    return { status: "received", signal };
  }

  deleteReceivedSignal(id: string): boolean {
    const before = this.receivedSignals.length;
    this.receivedSignals = this.receivedSignals.filter((signal) => signal.id !== id);
    return this.receivedSignals.length < before;
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
    copy.expeditions = this.expeditions.map((item) => ({ ...item, cargo: { ...item.cargo } }));
    copy.expeditionReports = this.expeditionReports.map((item) => ({
      ...item,
      cargo: { ...item.cargo },
    }));
    copy.stats = { ...this.stats };
    copy.sentSignals = this.sentSignals.map((signal) => ({ ...signal }));
    copy.receivedSignals = this.receivedSignals.map((signal) => ({ ...signal }));
    copy.realTimeSettledAt = this.realTimeSettledAt;
    copy.settledOfflineMs = this.settledOfflineMs;
    return copy;
  }

  /**
   * Imported data is validated field by field, never assigned wholesale. A
   * save of another version, or without a planet, is ignored: the game
   * starts afresh.
   */
  loadFromSnapshot(parsed: unknown): void {
    if (!isRecord(parsed) || parsed.saveVersion !== SAVE_VERSION) return;
    const colonies = Array.isArray(parsed.colonies)
      ? parsed.colonies.flatMap((value) => Colony.fromSnapshot(value, Date.now()) ?? [])
      : [];
    if (colonies.length === 0) return;

    this.name = sanitizeName(parsed.name) ?? this.name;
    if (isFiniteNumber(parsed.createdAt)) this.createdAt = parsed.createdAt;
    if (parsed.periodList !== undefined && parsed.periodList !== null) {
      this.periodList.loadPeriods(parsed.periodList);
    }

    this.colonies = colonies;
    if (isNonNegativeNumber(parsed.offlinium)) this.offlinium = parsed.offlinium;
    const homeId = sanitizeId(parsed.homeColonyId);
    this.homeColonyId = homeId && this.getColony(homeId) ? homeId : colonies[0].id;
    const activeId = sanitizeId(parsed.activeColonyId);
    this.activeColonyId = activeId && this.getColony(activeId) ? activeId : this.homeColonyId;
    this.notables = loadNotables(parsed.notables);

    // Expeditions only towards planets of the system, from known colonies.
    this.expeditions = loadExpeditions(parsed.expeditions).filter(
      (item) =>
        this.getColony(item.fromColonyId) !== undefined &&
        this.findSystemPlanet(item.targetId) !== undefined,
    );
    this.expeditionReports = loadReports(parsed.expeditionReports);
    const stats = isRecord(parsed.stats) ? parsed.stats : {};
    for (const key of Object.keys(this.stats) as Array<keyof GameStats>) {
      if (isNonNegativeNumber(stats[key])) this.stats[key] = Math.floor(stats[key]);
    }
    this.sentSignals = loadSignals<SentSignal>(
      parsed.sentSignals,
      (item) => (typeof item.code === "string" && item.code.length < 4000 ? { code: item.code } : null),
      MAX_SENT_SIGNALS,
    );
    this.receivedSignals = loadSignals<ReceivedSignal>(
      parsed.receivedSignals,
      (item) => (isFiniteNumber(item.receivedAt) ? { receivedAt: item.receivedAt } : null),
      MAX_RECEIVED_SIGNALS,
    );

    if (isFiniteNumber(parsed.realTimeSettledAt)) {
      this.realTimeSettledAt = parsed.realTimeSettledAt;
    }
    if (isNonNegativeNumber(parsed.settledOfflineMs)) {
      this.settledOfflineMs = parsed.settledOfflineMs;
    }
  }
}

function loadReports(value: unknown): ExpeditionReport[] {
  if (!Array.isArray(value)) return [];
  return value.slice(0, MAX_REPORTS).flatMap((item): ExpeditionReport[] => {
    if (!isRecord(item)) return [];
    const id = sanitizeId(item.id);
    const targetName = sanitizeName(item.targetName);
    if (!id || !targetName || !isFiniteNumber(item.arriveAt)) return [];
    if (item.kind !== "colonization" && item.kind !== "cargo") return [];
    if (item.outcome !== "founded" && item.outcome !== "delivered" && item.outcome !== "returned") {
      return [];
    }
    const cargo = isRecord(item.cargo) ? item.cargo : {};
    return [
      {
        id,
        kind: item.kind,
        targetName,
        arriveAt: item.arriveAt,
        outcome: item.outcome,
        cargo: {
          metal: isNonNegativeNumber(cargo.metal) ? cargo.metal : 0,
          food: isNonNegativeNumber(cargo.food) ? cargo.food : 0,
        },
        colonists: isNonNegativeNumber(item.colonists) ? Math.floor(item.colonists) : 0,
      },
    ];
  });
}
