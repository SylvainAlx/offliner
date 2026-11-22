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
import {
  AUTOSAVE_INTERVAL_MS,
  OFFLINIUM_DELIVERY_INTERVAL as INTERVAL,
  OPEN_PERIOD_HEARTBEAT_MS,
  STARTING_RESOURCES,
  UNOBSERVED_OFFLINE_CREDIT_CAP_MS as CAP,
} from "../../src/utils/constants";
import { getBuildingCost, getConstructionMs } from "../../src/models/buildings";
import { HOUR, local } from "../helpers/time";
import { setBalance } from "../helpers/user";

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
    it("closes a period left open and asks about the time it could not observe", async () => {
      const stored = new UserModel();
      stored.periodList.openPeriodIfNeeded(T0);
      vi.mocked(userRepository.load).mockResolvedValueOnce(stored);
      vi.useFakeTimers({ now: T0 + CAP + 5 * HOUR, toFake: ["Date"] });

      const user = await useUser.getState().hydrate();
      vi.useRealTimers();

      // Back online after a night the app did not see: nothing is credited yet.
      expect(user.periodList.openPeriodStart).toBeNull();
      expect(user.periodList.computeCompletedMs()).toBe(0);
      expect(user.periodList.unconfirmedGaps).toHaveLength(1);
      expect(user.offlinium).toBe(STARTING_RESOURCES.offlinium);
    });

    it("credits at most the cap when the player confirms", async () => {
      const stored = new UserModel();
      stored.periodList.openPeriodIfNeeded(T0);
      vi.mocked(userRepository.load).mockResolvedValueOnce(stored);
      vi.useFakeTimers({ now: T0 + CAP + 5 * HOUR, toFake: ["Date"] });
      await useUser.getState().hydrate();
      vi.useRealTimers();

      useUser.getState().resolveUnconfirmedGaps(true);
      const user = useUser.getState().user;
      const total = user.periodList.computeTotalMs();

      expect(total).toBe(CAP);
      expect(user.offlinium).toBe(STARTING_RESOURCES.offlinium + CAP / INTERVAL);
      expect(user.periodList.unconfirmedGaps).toEqual([]);
    });

    it("credits nothing when the player says they reconnected", async () => {
      const stored = new UserModel();
      stored.periodList.openPeriodIfNeeded(T0);
      vi.mocked(userRepository.load).mockResolvedValueOnce(stored);
      vi.useFakeTimers({ now: T0 + 20 * HOUR, toFake: ["Date"] });
      await useUser.getState().hydrate();
      vi.useRealTimers();

      useUser.getState().resolveUnconfirmedGaps(false);
      await useUser.getState().saveUser();

      expect(useUser.getState().user.periodList.computeTotalMs()).toBe(0);
      expect(lastSaved()).toMatchObject({ periodList: { unconfirmedGaps: [] } });
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
      expect(user.periodList.unconfirmedGaps).toEqual([{ start: T0, end: T0 + HOUR }]);
    });
  });

  describe("import and reset", () => {
    const snapshot = {
      name: "Importé",
      createdAt: 1,
      resources: { metal: 5, food: 6, offlinium: 10 },
      settledOfflineMs: 0,
      periodList: { days: [], openPeriodStart: T0, openPeriodLastSeen: T0 + HOUR },
      planet: { name: "Testia I", levels: { metalMine: 2 } },
      population: 10,
      realTimeSettledAt: Date.now(),
    };

    it("replaces the profile and closes an exported period at its last observation", async () => {
      await useUser.getState().importFromSnapshot(snapshot);

      const user = useUser.getState().user;
      expect(user.name).toBe("Importé");
      expect(user.homeColony.planet.name).toBe("Testia I");
      expect(user.homeColony.planet.levels.metalMine).toBe(2);
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
      expect(lastSaved()).toMatchObject({
        name: "Joueur",
        saveVersion: 2,
        offlinium: STARTING_RESOURCES.offlinium,
        colonies: [{ resources: { metal: STARTING_RESOURCES.metal, food: STARTING_RESOURCES.food } }],
      });
    });
  });

  describe("per-second updates", () => {
    it("brings the economy up to date and saves only now and then", async () => {
      const user = useUser.getState().user;
      await useUser.getState().saveUser();
      vi.mocked(userRepository.save).mockClear();

      useUser.getState().tick(user.realTimeSettledAt + HOUR);
      expect(useUser.getState().user.homeColony.resources.metal).toBeGreaterThan(user.homeColony.resources.metal);
      expect(user.homeColony.resources.metal).toBe(STARTING_RESOURCES.metal);
      // Just saved: the tick only updates the state.
      await new Promise((resolve) => setTimeout(resolve, 5));
      expect(userRepository.save).not.toHaveBeenCalled();

      vi.useFakeTimers({ now: Date.now() + AUTOSAVE_INTERVAL_MS, toFake: ["Date"] });
      useUser.getState().tick(user.realTimeSettledAt + HOUR + 1000);
      vi.useRealTimers();
      await new Promise((resolve) => setTimeout(resolve, 5));
      expect(userRepository.save).toHaveBeenCalledTimes(1);
    });

    it("completes a construction and keeps track of it", () => {
      expect(useUser.getState().startConstruction("metalMine")).toBe(true);
      const { endsAt } = useUser.getState().user.homeColony.planet.construction!;

      useUser.getState().tick(endsAt);
      expect(useUser.getState().user.homeColony.planet.levels.metalMine).toBe(1);
      expect(useUser.getState().completedConstructions).toEqual([
        {
          type: "metalMine",
          level: 1,
          at: endsAt,
          colonyId: useUser.getState().user.homeColonyId,
        },
      ]);
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
    it("starts a construction only with enough resources, without touching the old state", () => {
      const poor = new UserModel();
      setBalance(poor, { metal: 0, food: 0, offlinium: 0 });
      useUser.setState({ user: poor });
      expect(useUser.getState().startConstruction("metalMine")).toBe(false);

      const user = new UserModel();
      useUser.setState({ user });
      expect(useUser.getState().startConstruction("metalMine")).toBe(true);
      const cost = getBuildingCost("metalMine", 1);
      expect(Math.floor(useUser.getState().user.offlinium)).toBe(
        STARTING_RESOURCES.offlinium - cost.offlinium!,
      );
      expect(user.homeColony.planet.construction).toBeNull();
    });

    it("finishes a construction at once when it is sped up to its end", () => {
      useUser.getState().startConstruction("metalMine");
      expect(useUser.getState().speedUpConstruction(getConstructionMs("metalMine", 1))).toBe(true);
      expect(useUser.getState().user.homeColony.planet.levels.metalMine).toBe(1);
      expect(useUser.getState().user.homeColony.planet.construction).toBeNull();
    });

    it("ignores blank names", () => {
      useUser.getState().updateName("   ");
      expect(useUser.getState().user.name).toBe("Joueur");
    });
  });
});
