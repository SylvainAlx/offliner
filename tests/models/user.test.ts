import { describe, expect, it } from "vitest";
import { User } from "../../src/models/user";
import { Companion } from "../../src/models/companion";
import { House } from "../../src/models/house";
import { TownHall } from "../../src/models/townHall";
import {
  COMPANION_INVOCATION_COST,
  COMPANION_STAGE_AGE_MS,
  HOUSE_CONSTRUCTION_COST,
  MAX_NAME_LENGTH,
  OFFLINIUM_DELIVERY_INTERVAL as INTERVAL,
} from "../../src/utils/constants";
import { HOUR, local } from "../helpers/time";
import { observeOffline } from "../helpers/periods";

const T0 = local(2026, 1, 10, 8);

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

      expect(user.spendOfflinium(8, total)).toEqual({ stored: 8, openPeriod: 0 });
      expect(user.offlinium).toBe(7);
      expect(user.settledOfflineMs).toBe(total);
      expect(user.getAvailableOfflinium(total)).toBe(7);

      user.closeOfflinePeriod(now);
      expect(user.getAvailableOfflinium(user.periodList.computeTotalMs(now))).toBe(7);
    });

    it("refuses to spend more than available", () => {
      const user = new User();
      user.offlinium = 3;
      expect(user.spendOfflinium(4, 0)).toBeUndefined();
      expect(user.offlinium).toBe(3);
    });

    it("rejects negative amounts", () => {
      expect(() => new User().spendOfflinium(-1, 0)).toThrow();
    });

    it("refunds a cancelled construction", () => {
      const { user, now } = userWithOpenPeriod(HOUSE_CONSTRUCTION_COST);
      const total = user.periodList.computeTotalMs(now);
      const spend = user.spendOfflinium(HOUSE_CONSTRUCTION_COST, total)!;
      user.village.addPendingElement("house", total, spend.stored, spend.openPeriod);
      user.closeOfflinePeriod(now);
      expect(user.getAvailableOfflinium(total)).toBe(0);

      expect(user.cancelPendingElement(user.village.pendingElements[0].id, total)).toBe(true);
      expect(user.getAvailableOfflinium(total)).toBe(HOUSE_CONSTRUCTION_COST);
    });

    it("refunds both parts of a cost saved by an older version", () => {
      const user = new User();
      user.refundOfflinium({ storedOffliniumCost: 100, openPeriodOffliniumCost: 20 });
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
      expect(user.buildTownHall(0, 10)).toBe(true);
      expect(user.buildTownHall(0, 10)).toBe(false);
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

      expect(user.village.houses).toHaveLength(1);
      expect(Object.getPrototypeOf(user.village.houses[0])).toBe(House.prototype);
      expect(user.village.houses[0]).not.toHaveProperty("extra");
      expect(Object.getPrototypeOf(user.village.townHall)).toBe(TownHall.prototype);

      const [pending] = user.village.pendingElements;
      expect(pending.constructionOfflineMs).toBeGreaterThan(0);
      expect(pending.storedOffliniumCost).toBe(HOUSE_CONSTRUCTION_COST);
      expect(Object.keys(pending).sort()).toEqual([
        "constructionOfflineMs",
        "id",
        "offlineMsAtStart",
        "openPeriodOffliniumCost",
        "startedAt",
        "storedOffliniumCost",
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
      user.village.addHouse(new House());
      user.village.addCompanion(new Companion(0));
      user.periodList.openPeriodIfNeeded(T0);

      const restored = new User();
      restored.loadFromSnapshot(JSON.parse(JSON.stringify(user)));

      expect(JSON.parse(JSON.stringify(restored))).toEqual(JSON.parse(JSON.stringify(user)));
    });
  });

  describe("clone", () => {
    it("copies everything without sharing mutable state", () => {
      const user = new User("Alex");
      const companion = new Companion(0);
      user.village.addCompanion(companion);
      user.village.addHouse(new House());
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
        storedOffliniumCost: 0,
        openPeriodOffliniumCost: 0,
      });

      expect(companion.name).not.toBe("Changed");
      expect(user.periodList.openPeriodStart).toBe(T0);
      expect(user.village.pendingElements).toEqual([]);

      const [clonedCompanion] = copy.village.companions;
      expect(clonedCompanion).toBeInstanceOf(Companion);
      expect(clonedCompanion.id).toBe(companion.id);
      expect(copy.village.houses[0]).toBeInstanceOf(House);
      expect(copy.village.townHall).toBeInstanceOf(TownHall);
    });
  });
});
