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

const T0 = local(2026, 1, 10, 8);

/** A user whose open period has produced `particles` particles at T0 + duration. */
function userWithOpenPeriod(particles: number): { user: User; now: number } {
  const user = new User();
  user.periodList.openPeriodIfNeeded(T0);
  const now = T0 + particles * INTERVAL;
  user.periodList.recordObservation(now);
  return { user, now };
}

describe("User", () => {
  describe("Offlinium", () => {
    it("earns one particle per full interval when a period closes", () => {
      const user = new User();
      user.periodList.openPeriodIfNeeded(T0);
      user.closeOfflinePeriod(T0 + 10 * INTERVAL + INTERVAL / 2);
      expect(user.offlinium).toBe(10);
    });

    it("multiplies the harvest by the bonus of evolved companions", () => {
      const user = new User();
      const adolescent = new Companion(0);
      adolescent.stage = "adolescent";
      user.village.addCompanion(adolescent);

      user.periodList.openPeriodIfNeeded(T0);
      user.closeOfflinePeriod(T0 + 10 * INTERVAL);

      expect(user.offliniumHarvestRate).toBe(2);
      expect(user.offlinium).toBe(20);
    });

    it("counts the particles of the open period as available", () => {
      const { user, now } = userWithOpenPeriod(12);
      user.offlinium = 5;
      expect(user.getAvailableOfflinium(user.periodList.computeTotalMs(now))).toBe(17);
    });

    it("spends the stored balance first, then the open period", () => {
      const { user, now } = userWithOpenPeriod(10);
      user.offlinium = 5;

      const spend = user.spendOfflinium(8, user.periodList.computeTotalMs(now));

      expect(spend).toEqual({ stored: 5, openPeriod: 3 });
      expect(user.offlinium).toBe(0);
      expect(user.offliniumSpentDuringOpenPeriod).toBe(3);

      user.closeOfflinePeriod(now);
      expect(user.offlinium).toBe(7);
      expect(user.offliniumSpentDuringOpenPeriod).toBe(0);
    });

    it("refuses to spend more than available", () => {
      const user = new User();
      user.offlinium = 3;
      expect(user.spendOfflinium(4, 0)).toBeUndefined();
      expect(user.offlinium).toBe(3);
    });

    it("rejects negative amounts", () => {
      expect(() => new User().spendOfflinium(-1, 0)).toThrow();
      expect(() => new User().addOfflinium(-1)).toThrow();
    });

    it("refunds a cancelled construction", () => {
      const user = new User();
      user.offlinium = HOUSE_CONSTRUCTION_COST;
      const spend = user.spendOfflinium(HOUSE_CONSTRUCTION_COST, 0)!;
      user.village.addPendingElement("house", 0, spend.stored, spend.openPeriod);

      const [pending] = user.village.pendingElements;
      expect(user.cancelPendingElement(pending.id, 0)).toBe(true);
      expect(user.offlinium).toBe(HOUSE_CONSTRUCTION_COST);
      expect(user.village.pendingElements).toEqual([]);
    });

    it("refunds the open-period part as stored balance once the period is closed", () => {
      const { user, now } = userWithOpenPeriod(HOUSE_CONSTRUCTION_COST);
      const totalMs = user.periodList.computeTotalMs(now);
      const spend = user.spendOfflinium(HOUSE_CONSTRUCTION_COST, totalMs)!;
      user.village.addPendingElement("house", totalMs, spend.stored, spend.openPeriod);
      user.closeOfflinePeriod(now);
      expect(user.offlinium).toBe(0);

      user.cancelPendingElement(user.village.pendingElements[0].id, totalMs);
      expect(user.offlinium).toBe(HOUSE_CONSTRUCTION_COST);
    });

    it("gives back the invocation cost when a companion is released", () => {
      const user = new User();
      const companion = new Companion(0);
      user.village.addCompanion(companion);

      expect(user.releaseCompanionAndGetOfflinium(companion.id)).toBe(true);
      expect(user.offlinium).toBe(COMPANION_INVOCATION_COST);
      expect(user.releaseCompanionAndGetOfflinium(companion.id)).toBe(false);
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
