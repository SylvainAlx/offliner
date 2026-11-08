import { beforeEach, describe, expect, it, vi } from "vitest";
import type { User } from "../../src/models/user";

// Saves are recorded as plain JSON. The first save is slow, so a test can
// check that an older state never lands after a newer one.
const repository = vi.hoisted(() => ({
  saved: [] as Array<Record<string, unknown>>,
  saveCount: 0,
}));

vi.mock("../../src/services/userRepository", () => ({
  userRepository: {
    load: vi.fn(async () => {
      const { User } = await import("../../src/models/user");
      return new User();
    }),
    save: vi.fn(async (user: User) => {
      const delay = repository.saveCount === 0 ? 20 : 0;
      repository.saveCount += 1;
      await new Promise((resolve) => setTimeout(resolve, delay));
      repository.saved.push(JSON.parse(JSON.stringify(user)));
    }),
    exportSnapshot: vi.fn(async () => null),
  },
}));

import { useUser } from "../../src/stores/userStore";
import { userRepository } from "../../src/services/userRepository";
import { User as UserModel } from "../../src/models/user";
import { Companion } from "../../src/models/companion";
import {
  COMPANION_STAGE_AGE_MS,
  HOUSE_CONSTRUCTION_COST,
  OFFLINIUM_DELIVERY_INTERVAL as INTERVAL,
  OPEN_PERIOD_HEARTBEAT_MS,
  UNOBSERVED_OFFLINE_CREDIT_CAP_MS as CAP,
} from "../../src/utils/constants";
import { HOUR, local } from "../helpers/time";

const T0 = local(2026, 1, 10, 8);

function lastSaved() {
  return repository.saved.at(-1);
}

beforeEach(async () => {
  vi.stubGlobal("navigator", { onLine: true });
  await useUser.getState().resetAll();
  repository.saved.length = 0;
  repository.saveCount = 0;
  vi.mocked(userRepository.save).mockClear();
});

describe("userStore", () => {
  describe("hydrate", () => {
    it("closes an open period when the app starts online, with the cap applied", async () => {
      const stored = new UserModel();
      stored.periodList.openPeriodIfNeeded(T0);
      vi.mocked(userRepository.load).mockResolvedValueOnce(stored);
      vi.useFakeTimers({ now: T0 + CAP + 5 * HOUR, toFake: ["Date"] });

      const user = await useUser.getState().hydrate();
      vi.useRealTimers();

      expect(user.periodList.openPeriodStart).toBeNull();
      expect(user.periodList.computeCompletedMs()).toBe(CAP);
      expect(user.offlinium).toBe(CAP / INTERVAL);
      expect(lastSaved()).toMatchObject({ offlinium: CAP / INTERVAL });
    });

    it("keeps the period open when the app starts offline", async () => {
      vi.stubGlobal("navigator", { onLine: false });
      const stored = new UserModel();
      stored.periodList.openPeriodIfNeeded(T0);
      vi.mocked(userRepository.load).mockResolvedValueOnce(stored);
      vi.useFakeTimers({ now: T0 + HOUR, toFake: ["Date"] });

      const user = await useUser.getState().hydrate();
      vi.useRealTimers();

      expect(user.periodList.openPeriodStart).toBe(T0);
      expect(user.periodList.openPeriodLastSeen).toBe(T0 + HOUR);
    });
  });

  describe("import and reset", () => {
    const snapshot = {
      name: "Importé",
      createdAt: 1,
      offlinium: 10,
      offliniumSpentDuringOpenPeriod: 0,
      periodList: { days: [], openPeriodStart: T0, openPeriodLastSeen: T0 + HOUR },
      village: { companions: [], houses: [], pendingElements: [] },
    };

    it("replaces the profile and closes an exported period at its last observation", async () => {
      await useUser.getState().importFromSnapshot(snapshot);

      const user = useUser.getState().user;
      expect(user.name).toBe("Importé");
      expect(user.periodList.openPeriodStart).toBeNull();
      expect(user.offlinium).toBe(10 + HOUR / INTERVAL);
      expect(lastSaved()).toMatchObject({ name: "Importé" });
    });

    it("is never overwritten by a save queued just before", async () => {
      useUser.getState().updateName("Ancien");
      await useUser.getState().importFromSnapshot(snapshot);

      expect(repository.saved.map((user) => user.name)).toEqual(["Ancien", "Importé"]);
    });

    it("leaves a fresh profile after a reset, even with a save in flight", async () => {
      useUser.getState().updateName("Ancien");
      await useUser.getState().resetAll();

      expect(useUser.getState().user.name).toBe("Joueur");
      expect(lastSaved()).toMatchObject({ name: "Joueur", offlinium: 0 });
    });
  });

  describe("per-second updates", () => {
    it("keeps the same state and does not save when no companion evolves", () => {
      const before = useUser.getState().user;

      expect(useUser.getState().updateCompanionStages(0)).toBe(false);
      useUser.getState().completePendingElements(0);

      expect(useUser.getState().user).toBe(before);
      expect(userRepository.save).not.toHaveBeenCalled();
    });

    it("saves when a companion evolves", async () => {
      const user = new UserModel();
      user.village.addCompanion(new Companion(0));
      useUser.setState({ user });

      expect(useUser.getState().updateCompanionStages(COMPANION_STAGE_AGE_MS.adolescent)).toBe(true);
      expect(useUser.getState().user).not.toBe(user);
      expect(useUser.getState().user.village.companions[0].stage).toBe("adolescent");
      expect(user.village.companions[0].stage).toBe("child");

      await useUser.getState().saveUser();
      expect(lastSaved()).toBeDefined();
    });

    it("records a heartbeat only once the interval has elapsed", () => {
      useUser.getState().openPeriodIfNeeded(T0);
      const opened = useUser.getState().user;

      expect(useUser.getState().touchOpenPeriod(T0 + OPEN_PERIOD_HEARTBEAT_MS - 1)).toBe(false);
      expect(useUser.getState().user).toBe(opened);

      expect(useUser.getState().touchOpenPeriod(T0 + OPEN_PERIOD_HEARTBEAT_MS)).toBe(true);
      expect(useUser.getState().user.periodList.openPeriodLastSeen).toBe(T0 + OPEN_PERIOD_HEARTBEAT_MS);
    });
  });

  describe("actions", () => {
    it("builds a house only with enough Offlinium", () => {
      expect(useUser.getState().buildHouse(0)).toBe(false);

      const user = new UserModel();
      user.offlinium = HOUSE_CONSTRUCTION_COST;
      useUser.setState({ user });

      expect(useUser.getState().buildHouse(0)).toBe(true);
      expect(useUser.getState().user.offlinium).toBe(0);
      expect(useUser.getState().user.village.pendingElements).toHaveLength(1);
      expect(user.offlinium).toBe(HOUSE_CONSTRUCTION_COST);
    });

    it("ignores blank names", () => {
      useUser.getState().updateName("   ");
      expect(useUser.getState().user.name).toBe("Joueur");
    });
  });
});
