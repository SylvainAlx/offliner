import { describe, expect, it } from "vitest";
import { Village } from "../../src/models/village";
import { Companion } from "../../src/models/companion";
import { House } from "../../src/models/house";
import {
  COMPANIONS_PER_HOUSE,
  COMPANION_INVOCATION_OFFLINE_MS,
  COMPANION_STAGE_AGE_MS,
  COMPANION_STAGE_HARVEST_BONUS,
  HOUSE_CONSTRUCTION_OFFLINE_MS,
  MAX_NAME_LENGTH,
  TOWN_HALL_CONSTRUCTION_OFFLINE_MS,
} from "../../src/utils/constants";

function villageWithHouses(count: number): Village {
  const village = new Village();
  for (let index = 0; index < count; index += 1) village.addHouse(new House());
  return village;
}

describe("Village", () => {
  describe("capacity", () => {
    it("needs a house before invoking a companion", () => {
      expect(new Village().canInvokeCompanion()).toBe(false);
      expect(villageWithHouses(1).canInvokeCompanion()).toBe(true);
    });

    it("counts pending invocations against the capacity", () => {
      const village = villageWithHouses(1);
      expect(village.companionCapacity).toBe(COMPANIONS_PER_HOUSE);

      for (let index = 0; index < COMPANIONS_PER_HOUSE - 1; index += 1) {
        village.addCompanion(new Companion(0));
      }
      village.addPendingElement("companion", 0, 0, 0);

      expect(village.pendingCompanionCount).toBe(1);
      expect(village.canInvokeCompanion()).toBe(false);
    });
  });

  describe("construction queue", () => {
    it("chains each element after the previous one", () => {
      const village = new Village();
      village.addPendingElement("house", 1000, 0, 0);
      village.addPendingElement("companion", 5000, 0, 0);
      village.addPendingElement("townHall", 9000, 0, 0);

      expect(village.pendingElements.map((pending) => pending.offlineMsAtStart)).toEqual([
        1000,
        1000 + HOUSE_CONSTRUCTION_OFFLINE_MS,
        1000 + HOUSE_CONSTRUCTION_OFFLINE_MS + COMPANION_INVOCATION_OFFLINE_MS,
      ]);
      expect(village.pendingElements.map((pending) => pending.constructionOfflineMs)).toEqual([
        HOUSE_CONSTRUCTION_OFFLINE_MS,
        COMPANION_INVOCATION_OFFLINE_MS,
        TOWN_HALL_CONSTRUCTION_OFFLINE_MS,
      ]);
    });

    it("completes elements in order as offline time passes", () => {
      const village = new Village();
      village.addPendingElement("house", 0, 0, 0);
      village.addPendingElement("companion", 0, 0, 0);

      expect(village.hasCompletedPendingElements(HOUSE_CONSTRUCTION_OFFLINE_MS - 1)).toBe(false);
      expect(village.completePendingElements(HOUSE_CONSTRUCTION_OFFLINE_MS - 1)).toBe(0);

      expect(village.completePendingElements(HOUSE_CONSTRUCTION_OFFLINE_MS)).toBe(1);
      expect(village.houses).toHaveLength(1);
      expect(village.pendingElements).toHaveLength(1);

      const end = HOUSE_CONSTRUCTION_OFFLINE_MS + COMPANION_INVOCATION_OFFLINE_MS;
      expect(village.completePendingElements(end)).toBe(1);
      expect(village.companions).toHaveLength(1);
      expect(village.companions[0].birthOfflineMs).toBe(end);
    });

    it("restarts the queue from now when the active element is cancelled", () => {
      const village = new Village();
      village.addPendingElement("house", 0, 0, 0);
      village.addPendingElement("companion", 0, 0, 0);
      village.addPendingElement("house", 0, 0, 0);
      const [active] = village.pendingElements;

      village.cancelPendingElement(active.id, 30_000);

      expect(village.pendingElements.map((pending) => pending.offlineMsAtStart)).toEqual([
        30_000,
        30_000 + COMPANION_INVOCATION_OFFLINE_MS,
      ]);
    });

    it("moves the following elements forward when a queued element is cancelled", () => {
      const village = new Village();
      village.addPendingElement("house", 0, 0, 0);
      village.addPendingElement("house", 0, 0, 0);
      village.addPendingElement("companion", 0, 0, 0);

      village.cancelPendingElement(village.pendingElements[1].id, 10_000);

      expect(village.pendingElements.map((pending) => pending.offlineMsAtStart)).toEqual([
        0,
        HOUSE_CONSTRUCTION_OFFLINE_MS,
      ]);
    });

    it("ignores an unknown element", () => {
      const village = new Village();
      expect(village.cancelPendingElement("missing", 0)).toBeUndefined();
      expect(village.cancelPendingCompanion("missing", 0)).toBeUndefined();
    });

    it("migrates the legacy queue of pending companions", () => {
      const village = new Village();
      village.loadVillage({
        pendingCompanions: [
          { id: "a", startedAt: 1, offlineMsAtStart: 100 },
          { id: "b", startedAt: 2, offlineMsAtStart: 0 },
        ],
      });

      expect(village.pendingElements.map((pending) => [pending.id, pending.type, pending.offlineMsAtStart])).toEqual([
        ["a", "companion", 100],
        ["b", "companion", 100 + COMPANION_INVOCATION_OFFLINE_MS],
      ]);
    });
  });

  describe("town hall and names", () => {
    it("allows a single town hall, built or pending", () => {
      const village = new Village();
      expect(village.canBuildTownHall()).toBe(true);
      village.addPendingElement("townHall", 0, 0, 0);
      expect(village.canBuildTownHall()).toBe(false);

      const built = new Village();
      expect(built.addTownHall()).toBe(true);
      expect(built.addTownHall()).toBe(false);
      expect(built.canBuildTownHall()).toBe(false);
    });

    it("only allows renaming once the town hall exists", () => {
      const village = new Village();
      const companion = new Companion(0);
      village.addCompanion(companion);

      expect(village.rename("Nouveau")).toBe(false);
      expect(village.renameCompanion(companion.id, "Rex")).toBe(false);

      village.addTownHall();
      expect(village.rename("  Nouveau  ")).toBe(true);
      expect(village.name).toBe("Nouveau");
      expect(village.renameCompanion(companion.id, "x".repeat(80))).toBe(true);
      expect(companion.name).toHaveLength(MAX_NAME_LENGTH);
    });

    it("rejects empty names", () => {
      const village = new Village();
      village.addTownHall();
      expect(village.rename("   ")).toBe(false);
      expect(village.name).toBe("Village sans nom");
    });
  });

  describe("companion life", () => {
    it.each([
      [0, "child"],
      [COMPANION_STAGE_AGE_MS.adolescent, "adolescent"],
      [COMPANION_STAGE_AGE_MS.adult, "adult"],
      [COMPANION_STAGE_AGE_MS.sage, "sage"],
      [COMPANION_STAGE_AGE_MS.dead, "dead"],
    ] as const)("reaches the right stage after %i ms offline", (age, stage) => {
      const village = new Village();
      village.addCompanion(new Companion(1000));
      village.updateCompanionStages(1000 + age);
      expect(village.companions[0].stage).toBe(stage);
    });

    it("never goes back to a younger stage", () => {
      const companion = new Companion(0);
      companion.stage = "sage";
      expect(companion.updateStage(0)).toBe(false);
      expect(companion.stage).toBe("sage");
    });

    it("reports pending stage updates without changing anything", () => {
      const village = new Village();
      village.addCompanion(new Companion(0));

      expect(village.hasPendingStageUpdates(COMPANION_STAGE_AGE_MS.adolescent - 1)).toBe(false);
      expect(village.hasPendingStageUpdates(COMPANION_STAGE_AGE_MS.adolescent)).toBe(true);
      expect(village.companions[0].stage).toBe("child");
    });

    it("adds up the harvest bonus of living companions", () => {
      const village = new Village();
      for (const stage of ["child", "adolescent", "sage", "dead"] as const) {
        const companion = new Companion(0);
        companion.stage = stage;
        village.addCompanion(companion);
      }

      expect(village.offliniumHarvestBonus).toBe(
        COMPANION_STAGE_HARVEST_BONUS.adolescent +
          COMPANION_STAGE_HARVEST_BONUS.sage +
          COMPANION_STAGE_HARVEST_BONUS.dead,
      );
    });

    it("tells how long until the next stage", () => {
      const companion = new Companion(0);
      expect(companion.getRemainingOfflineMs(1000)).toBe(COMPANION_STAGE_AGE_MS.adolescent - 1000);
      companion.stage = "dead";
      expect(companion.getRemainingOfflineMs(1000)).toBeNull();
    });
  });
});
