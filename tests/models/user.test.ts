import { describe, expect, it } from "vitest";
import { User } from "../../src/models/user";
import { Companion } from "../../src/models/companion";
import {
  Building,
  getBuildingConstructionMs,
  getBuildingCost,
  getBuildingProduction,
} from "../../src/models/building";
import {
  COMPANION_INVOCATION_COST,
  COMPANION_STAGE_AGE_MS,
  MAX_NAME_LENGTH,
  OFFLINIUM_DELIVERY_INTERVAL as INTERVAL,
} from "../../src/utils/constants";
import { HOUR, local } from "../helpers/time";
import { observeOffline } from "../helpers/periods";

const T0 = local(2026, 1, 10, 8);
const HOUSE_CONSTRUCTION_COST = getBuildingCost("house", 1).offlinium!;

/** A user observed offline from T0 for `particles` delivery intervals. */
function userWithOpenPeriod(particles: number): { user: User; now: number } {
  const user = new User();
  const now = T0 + particles * INTERVAL;
  observeOffline(user.periodList, T0, now);
  user.periodList.recordObservation(now);
  return { user, now };
}

function companionBornAt(birthOfflineMs: number): Companion {
  const companion = new Companion(0);
  companion.birthOfflineMs = birthOfflineMs;
  companion.updateStage(Math.max(0, -birthOfflineMs));
  return companion;
}

describe("User", () => {
  describe("Offlinium", () => {
    it("delivers one particle per full interval of offline time", () => {
      const { user, now } = userWithOpenPeriod(10);
      const total = user.periodList.computeTotalMs(now + INTERVAL / 2);
      expect(user.getAvailableOfflinium(total)).toBe(10);
    });

    it("keeps what was harvested once the period is closed", () => {
      const { user, now } = userWithOpenPeriod(10);
      user.closeOfflinePeriod(now);
      expect(user.getAvailableOfflinium(user.periodList.computeTotalMs(now))).toBe(10);
    });

    it("adds the bonus of companions that are already evolved", () => {
      const user = new User();
      user.village.addCompanion(companionBornAt(-COMPANION_STAGE_AGE_MS.adolescent));
      expect(user.getAvailableOfflinium(10 * INTERVAL)).toBe(20);
    });

    it("applies a companion's bonus only from the moment it evolves", () => {
      // The bug this guards against: 12 h credited at once turned every
      // companion into a sage and paid the whole 12 h at the sage rate.
      const user = new User();
      user.village.addCompanion(new Companion(0));
      const deliveries = (ms: number) => ms / INTERVAL;

      expect(user.getAvailableOfflinium(12 * HOUR)).toBe(
        deliveries(1 * HOUR) * 1 + // child
          deliveries(2 * HOUR) * 2 + // adolescent
          deliveries(4 * HOUR) * 3 + // adult
          deliveries(5 * HOUR) * 4, // sage
      );
    });

    it("never loses what was harvested when a companion dies", () => {
      const user = new User();
      user.village.addCompanion(new Companion(0));
      const atDeath = user.getAvailableOfflinium(COMPANION_STAGE_AGE_MS.dead);
      const anHourLater = user.getAvailableOfflinium(COMPANION_STAGE_AGE_MS.dead + HOUR);
      // A dead companion stops helping, but what it harvested stays.
      expect(anHourLater).toBe(atDeath + HOUR / INTERVAL);
    });

    it("counts the particles of the open period as available", () => {
      const { user, now } = userWithOpenPeriod(12);
      user.offlinium = 5;
      expect(user.getAvailableOfflinium(user.periodList.computeTotalMs(now))).toBe(17);
    });

    it("settles the harvest before spending", () => {
      const { user, now } = userWithOpenPeriod(10);
      user.offlinium = 5;
      const total = user.periodList.computeTotalMs(now);

      expect(user.spendOfflinium(8, total)).toBe(true);
      expect(user.offlinium).toBe(7);
      expect(user.settledOfflineMs).toBe(total);
      expect(user.getAvailableOfflinium(total)).toBe(7);

      user.closeOfflinePeriod(now);
      expect(user.getAvailableOfflinium(user.periodList.computeTotalMs(now))).toBe(7);
    });

    it("refuses to spend more than available", () => {
      const user = new User();
      user.offlinium = 3;
      expect(user.spendOfflinium(4, 0)).toBe(false);
      expect(user.offlinium).toBe(3);
    });

    it("rejects negative amounts", () => {
      expect(() => new User().spendOfflinium(-1, 0)).toThrow();
    });

    it("refunds a cancelled construction", () => {
      const { user, now } = userWithOpenPeriod(HOUSE_CONSTRUCTION_COST);
      const total = user.periodList.computeTotalMs(now);
      expect(user.queueBuilding("house", total)).toBe(true);
      user.closeOfflinePeriod(now);
      expect(user.getAvailableOfflinium(total)).toBe(0);

      expect(user.cancelPendingElement(user.village.pendingElements[0].id, total)).toBe(true);
      expect(user.getAvailableOfflinium(total)).toBe(HOUSE_CONSTRUCTION_COST);
    });

    it("refunds both parts of a cost saved by an older version", () => {
      const user = new User();
      user.loadFromSnapshot({
        offlinium: 0,
        settledOfflineMs: 0,
        village: {
          pendingElements: [{
            id: "p", type: "house", startedAt: 1, offlineMsAtStart: 0,
            storedOffliniumCost: 100, openPeriodOffliniumCost: 20,
          }],
        },
      });
      expect(user.cancelPendingElement("p", 0)).toBe(true);
      expect(user.offlinium).toBe(120);
    });

    it("gives back the invocation cost and keeps what a released companion harvested", () => {
      const user = new User();
      const sage = companionBornAt(-COMPANION_STAGE_AGE_MS.sage);
      user.village.addCompanion(sage);
      const harvested = user.getAvailableOfflinium(HOUR);

      expect(user.releaseCompanionAndGetOfflinium(sage.id, HOUR)).toBe(true);
      expect(user.getAvailableOfflinium(HOUR)).toBe(harvested + COMPANION_INVOCATION_COST);
      expect(user.releaseCompanionAndGetOfflinium(sage.id, HOUR)).toBe(false);
    });

    it("cannot build a second town hall", () => {
      const user = new User();
      user.offlinium = 1_000_000;
      expect(user.buildTownHall(0)).toBe(true);
      expect(user.buildTownHall(0)).toBe(false);
    });
  });

  describe("loading a save", () => {
    it("neutralises a malicious save", () => {
      const save = JSON.parse(`{
        "name": {"x": 1},
        "offlinium": -5,
        "periodList": {"days": [], "openPeriodStart": null},
        "village": {
          "name": "${"a".repeat(500)}",
          "townHall": {"__proto__": {"x": 1}, "id": "t", "builtAt": 1},
          "companions": [
            {"__proto__": {"evil": 1}, "name": {"a": 1}, "stage": "god", "id": 5},
            "not a companion",
            null
          ],
          "houses": [{"__proto__": {}, "id": "h", "builtAt": 2, "extra": "x"}, {"id": 3}],
          "pendingElements": [{
            "id": "p", "type": "house", "startedAt": 1, "offlineMsAtStart": 0,
            "constructionOfflineMs": -1, "storedOffliniumCost": -9
          }]
        }
      }`);
      const user = new User();
      user.loadFromSnapshot(save);

      expect(user.name).toBe("Joueur");
      expect(user.offlinium).toBe(0);
      expect(user.village.name).toHaveLength(MAX_NAME_LENGTH);

      const [companion] = user.village.companions;
      expect(user.village.companions).toHaveLength(1);
      expect(Object.getPrototypeOf(companion)).toBe(Companion.prototype);
      expect(typeof companion.name).toBe("string");
      expect(typeof companion.id).toBe("string");
      expect(companion.stage).toBe("child");
      expect(companion.harvestBonus).toBe(0);

      expect(user.village.getBuildingLevel("house")).toBe(1);
      const house = user.village.getBuilding("house")!;
      expect(Object.getPrototypeOf(house)).toBe(Building.prototype);
      expect(house).not.toHaveProperty("extra");
      expect(Object.getPrototypeOf(user.village.townHall)).toBe(Building.prototype);

      const [pending] = user.village.pendingElements;
      expect(pending.constructionOfflineMs).toBeGreaterThan(0);
      expect(pending.targetLevel).toBe(2);
      expect(pending.cost).toEqual(getBuildingCost("house", 2));
      expect(Object.keys(pending).sort()).toEqual([
        "constructionOfflineMs",
        "cost",
        "id",
        "offlineMsAtStart",
        "startedAt",
        "targetLevel",
        "type",
      ]);
    });

    it("settles a save made before the continuous harvest", () => {
      const user = new User();
      user.loadFromSnapshot({
        offlinium: 100,
        offliniumSpentDuringOpenPeriod: 30,
        periodList: {
          days: [{ dayStart: 0, durationMs: HOUR, periodCount: 1, firstStart: 0, lastEnd: HOUR }],
          openPeriodStart: T0,
          openPeriodLastSeen: T0 + 60 * INTERVAL,
        },
        village: { companions: [], houses: [], pendingElements: [] },
      });

      expect(user.offlinium).toBe(100 + 60 - 30);
      expect(user.settledOfflineMs).toBe(HOUR + 60 * INTERVAL);
    });

    it("trims and limits the player name", () => {
      const user = new User();
      user.loadFromSnapshot({ name: `  ${"b".repeat(100)}  ` });
      expect(user.name).toBe("b".repeat(MAX_NAME_LENGTH));
    });

    it.each([["text"], [42], [null], [undefined], [true]])(
      "keeps a fresh profile for an unusable save %#",
      (save) => {
        const user = new User();
        user.loadFromSnapshot(save);
        expect(user.name).toBe("Joueur");
        expect(user.offlinium).toBe(0);
        expect(user.village.companions).toEqual([]);
      },
    );

    it("gives legacy companions without birth time the age of their stage", () => {
      const user = new User();
      user.loadFromSnapshot({
        periodList: { days: [{ dayStart: 0, durationMs: 10 * HOUR, periodCount: 1, firstStart: 0, lastEnd: 1 }] },
        village: { companions: [{ id: "c", name: "Léo", stage: "adult" }] },
      });

      const [companion] = user.village.companions;
      expect(companion.stage).toBe("adult");
      expect(companion.getAgeOfflineMs(10 * HOUR)).toBe(COMPANION_STAGE_AGE_MS.adult);
    });

    it("round-trips through JSON", () => {
      const user = new User("Alex");
      user.offlinium = 42;
      user.resources.materials = 7;
      user.village.setBuildingLevel("house", 2, 1000);
      user.village.addPendingElement("quarry", 0, { offlinium: 600 });
      user.village.addCompanion(new Companion(0));
      user.periodList.openPeriodIfNeeded(T0);

      const restored = new User();
      restored.loadFromSnapshot(JSON.parse(JSON.stringify(user)));

      expect(JSON.parse(JSON.stringify(restored))).toEqual(JSON.parse(JSON.stringify(user)));
    });
  });

  describe("buildings and resources", () => {
    it("turns the separate houses of an older save into one house level per house", () => {
      const user = new User();
      user.loadFromSnapshot({
        offlinium: 50,
        settledOfflineMs: 0,
        village: {
          houses: [
            { id: "h1", builtAt: 20 },
            { id: "h2", builtAt: 10 },
            { id: "h3", builtAt: 30 },
          ],
          townHall: { id: "t", builtAt: 5 },
          pendingElements: [
            { id: "p", type: "house", startedAt: 1, offlineMsAtStart: 0, storedOffliniumCost: 720, openPeriodOffliniumCost: 0 },
          ],
        },
      });

      expect(user.resources).toEqual({ offlinium: 50, materials: 0 });
      expect(user.village.getBuildingLevel("house")).toBe(3);
      expect(user.village.getBuilding("house")!.builtAt).toBe(10);
      expect(user.village.companionCapacity).toBe(12);
      expect(user.village.townHall?.level).toBe(1);

      // A house paid at the old flat price keeps its price and its duration.
      const [pending] = user.village.pendingElements;
      expect(pending).toMatchObject({ targetLevel: 4, cost: { offlinium: 720 } });
      expect(pending.constructionOfflineMs).toBe(getBuildingConstructionMs("house", 1));
    });

    it("needs the town hall before the production buildings", () => {
      const user = new User();
      user.resources = { offlinium: 1_000_000, materials: 1_000_000 };
      expect(user.queueBuilding("quarry", 0)).toBe(false);

      user.village.addTownHall();
      expect(user.queueBuilding("quarry", 0)).toBe(true);
      expect(user.offlinium).toBe(1_000_000 - getBuildingCost("quarry", 1).offlinium!);
    });

    it("charges every resource of a level and refuses when one is missing", () => {
      const user = new User();
      user.village.setBuildingLevel("house", 2);
      const cost = getBuildingCost("house", 3);
      expect(cost.materials).toBeGreaterThan(0);

      user.resources = { offlinium: cost.offlinium!, materials: cost.materials! - 1 };
      expect(user.queueBuilding("house", 0)).toBe(false);

      user.resources.materials += 1;
      expect(user.queueBuilding("house", 0)).toBe(true);
      expect(user.resources).toEqual({ offlinium: 0, materials: 0 });
    });

    it("produces from the moment a building level completes, not before", () => {
      const user = new User();
      user.village.addTownHall();
      user.offlinium = getBuildingCost("quarry", 1).offlinium!;
      expect(user.queueBuilding("quarry", 0)).toBe(true);

      const done = getBuildingConstructionMs("quarry", 1);
      const perDelivery = getBuildingProduction("quarry", 1).materials!;
      // Nothing is extracted while the quarry is being built...
      expect(user.getAvailableResources(done).materials).toBe(0);
      // ...and it extracts once per delivery afterwards, even before the app
      // processes the completion.
      expect(user.getAvailableResources(done + HOUR).materials).toBe((HOUR / INTERVAL) * perDelivery);

      user.completePendingElements(done + HOUR);
      expect(user.village.getBuildingLevel("quarry")).toBe(1);
      expect(user.getAvailableResources(done + 2 * HOUR).materials).toBe((2 * HOUR / INTERVAL) * perDelivery);
    });

    it("applies an upgrade only to the deliveries made after it", () => {
      const user = new User();
      user.village.addTownHall();
      user.village.setBuildingLevel("well", 1);
      user.resources = { offlinium: 0, materials: 0 };
      const level1 = getBuildingProduction("well", 1).offlinium!;
      const level2 = getBuildingProduction("well", 2).offlinium!;
      expect(level2).toBeGreaterThan(level1);

      user.village.addPendingElement("well", 0, {});
      const done = user.village.pendingElements[0].constructionOfflineMs;
      const end = done + HOUR;

      const expected =
        (done / INTERVAL) * (1 + level1) + (HOUR / INTERVAL) * (1 + level2);
      expect(user.getAvailableOfflinium(end)).toBe(expected);
      user.completePendingElements(end);
      expect(user.getAvailableOfflinium(end)).toBe(expected);
      expect(user.getHarvestRates(end)).toEqual({ offlinium: 1 + level2, materials: 0 });
    });

    it("refunds every resource of a cancelled level", () => {
      const user = new User();
      user.village.setBuildingLevel("house", 2);
      user.resources = { offlinium: 10_000, materials: 10_000 };
      expect(user.queueBuilding("house", 0)).toBe(true);

      expect(user.cancelPendingElement(user.village.pendingElements[0].id, 0)).toBe(true);
      expect(user.resources).toEqual({ offlinium: 10_000, materials: 10_000 });
    });

    it("cannot cancel an element that is already finished", () => {
      const user = new User();
      user.offlinium = HOUSE_CONSTRUCTION_COST;
      expect(user.queueBuilding("house", 0)).toBe(true);
      const id = user.village.pendingElements[0].id;

      expect(user.cancelPendingElement(id, getBuildingConstructionMs("house", 1))).toBe(false);
      expect(user.village.getBuildingLevel("house")).toBe(1);
    });
  });

  describe("clone", () => {
    it("copies everything without sharing mutable state", () => {
      const user = new User("Alex");
      const companion = new Companion(0);
      user.village.addCompanion(companion);
      user.village.setBuildingLevel("house", 1);
      user.village.addTownHall();
      user.periodList.openPeriodIfNeeded(T0);

      const copy = user.clone();
      copy.village.companions[0].name = "Changed";
      copy.periodList.closeAnyOpenPeriod(T0 + HOUR);
      copy.village.pendingElements.push({
        id: "x",
        type: "house",
        startedAt: 0,
        offlineMsAtStart: 0,
        constructionOfflineMs: 1,
        cost: {},
      });
      copy.village.getBuilding("house")!.level = 9;
      copy.resources.materials = 99;

      expect(companion.name).not.toBe("Changed");
      expect(user.periodList.openPeriodStart).toBe(T0);
      expect(user.village.pendingElements).toEqual([]);

      const [clonedCompanion] = copy.village.companions;
      expect(clonedCompanion).toBeInstanceOf(Companion);
      expect(clonedCompanion.id).toBe(companion.id);
      expect(user.village.getBuildingLevel("house")).toBe(1);
      expect(user.resources.materials).toBe(0);
      expect(copy.village.getBuilding("house")).toBeInstanceOf(Building);
      expect(copy.village.townHall).toBeInstanceOf(Building);
    });
  });
});
