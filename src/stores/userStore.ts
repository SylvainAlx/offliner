import { create } from "zustand";
import { User, type ColonyCompletedConstruction, type SignalReception } from "../models/user";
import type { SentSignal } from "../models/signal";
import type { ExchangeResource } from "../models/exchange";
import type { Colony } from "../models/colony";
import type { ExpeditionCargo, ExpeditionKind } from "../models/expedition";
import type { BuildingType } from "../models/buildings";
import type { NotableChanges } from "../models/notable";
import { userRepository } from "../services/userRepository";
import { useBackup } from "./backupStore";
import { AUTOSAVE_INTERVAL_MS } from "../utils/constants";
import { sanitizeName } from "../utils/sanitize";

export interface UserStore {
  user: User;
  isHydrated: boolean;
  /** Levels reached since the app was opened, newest last. */
  completedConstructions: ColonyCompletedConstruction[];
  hydrate: () => Promise<User>;
  updateName: (name: string) => void;
  renamePlanet: (name: string) => boolean;
  /** Shows another of the player's planets. */
  setActiveColony: (id: string) => boolean;
  /** Exchanges Offlinium for metal or food on the planet shown; returns the units received. */
  exchangeOfflinium: (resource: ExchangeResource, offlinium: number) => number;
  /** Sends a radar signal; returns it with its code, or null. */
  emitSignal: (colonyId: string, authorId: string, message: string) => SentSignal | null;
  /** Decodes a code captured by the radar and keeps a new signal. */
  receiveSignal: (code: string) => SignalReception;
  deleteReceivedSignal: (id: string) => boolean;
  /** Sends an expedition from a colony's spaceport to a planet of the system. */
  launchExpedition: (
    kind: ExpeditionKind,
    fromColonyId: string,
    targetId: string,
    cargo?: ExpeditionCargo,
  ) => boolean;
  updateNotable: (id: string, changes: NotableChanges) => boolean;
  /** Brings the game up to date with both clocks. Called every second. */
  tick: (now: number) => void;
  startConstruction: (type: BuildingType) => boolean;
  cancelConstruction: () => boolean;
  /** Takes a building of the planet shown back one level, refunding that level. */
  demolishBuilding: (type: BuildingType) => boolean;
  speedUpConstruction: (ms: number) => boolean;
  openPeriodIfNeeded: (startTs: number) => void;
  closeAnyOpenPeriod: (endTs: number) => void;
  resetPeriods: () => void;
  saveUser: () => Promise<void>;
  importFromSnapshot: (snapshot: unknown) => Promise<void>;
  resetAll: () => Promise<void>;
  touchOpenPeriod: (now: number) => boolean;
  resolveUnconfirmedGaps: (stayedOffline: boolean) => void;
  syncWithStorage: (online: boolean, now: number) => User;
}

// Every write to the profile goes through this queue, in the order the state
// changed, so an older state can never overwrite a newer one (import, reset).
let writeQueue = Promise.resolve();
let lastSavedAt = 0;

function persist(user: User): Promise<void> {
  lastSavedAt = Date.now();
  writeQueue = writeQueue
    .then(() => userRepository.save(user))
    .catch((error: unknown) => {
      console.error("Error saving user data:", error);
    });

  return writeQueue;
}

/** Offline time credited so far, as the app can see it at `now`. */
function totalOfflineAt(user: User, now: number): number {
  return user.periodList.computeTotalMs(now);
}

/**
 * Records the time the app could not observe since the profile was saved (it
 * becomes a gap to confirm), closes a period left open if the app starts
 * online, then catches up with the real time spent away.
 */
function prepareLoadedUser(user: User, now: number, online: boolean): User {
  user.periodList.recordObservation(now);
  if (online) user.closeOfflinePeriod(now);
  const totalOfflineMs = totalOfflineAt(user, now);
  user.settledOfflineMs = Math.min(user.settledOfflineMs, totalOfflineMs);
  user.advance(now, totalOfflineMs);
  return user;
}

function isNavigatorOnline(): boolean {
  return typeof navigator !== "undefined" ? navigator.onLine : true;
}

export const useUser = create<UserStore>((set, get) => {
  /**
   * Applies `change` to an up-to-date copy of the user, then saves. Returns
   * what `change` returned; nothing is kept when it returns false.
   */
  function update(change: (user: User, now: number) => boolean): boolean {
    const now = Date.now();
    const next = get().user.clone();
    const completed = next.advance(now, totalOfflineAt(next, now));
    if (!change(next, now)) {
      if (completed.length > 0) commit(next, completed);
      return false;
    }
    // A construction sped up to its end completes at once.
    completed.push(...next.advance(now, totalOfflineAt(next, now)));
    commit(next, completed);
    return true;
  }

  function commit(next: User, completed: ColonyCompletedConstruction[]): void {
    set({
      user: next,
      completedConstructions:
        completed.length > 0
          ? [...get().completedConstructions, ...completed]
          : get().completedConstructions,
    });
    void persist(next);
  }

  return {
    user: new User(),
    isHydrated: false,
    completedConstructions: [],

    hydrate: async () => {
      const user = prepareLoadedUser(
        await userRepository.load(),
        Date.now(),
        isNavigatorOnline(),
      );

      set({ user, isHydrated: true });
      await persist(user);
      return user;
    },

    updateName: (name) => {
      const sanitizedName = sanitizeName(name);
      if (!sanitizedName) return;
      update((user) => {
        user.name = sanitizedName;
        return true;
      });
    },

    renamePlanet: (name) => update((user) => user.renamePlanet(name)),

    setActiveColony: (id) => update((user) => user.setActiveColony(id)),

    exchangeOfflinium: (resource, offlinium) => {
      let received = 0;
      update((user) => {
        received = user.exchangeOfflinium(resource, offlinium);
        return received > 0;
      });
      return received;
    },

    emitSignal: (colonyId, authorId, message) => {
      let sent: SentSignal | null = null;
      update((user, now) => {
        sent = user.emitSignal(colonyId, authorId, message, now);
        return sent !== null;
      });
      return sent;
    },

    receiveSignal: (code) => {
      let reception: SignalReception = { status: "noRadar" };
      update((user, now) => {
        reception = user.receiveSignal(code, now);
        return reception.status === "received";
      });
      return reception;
    },

    deleteReceivedSignal: (id) => update((user) => user.deleteReceivedSignal(id)),

    launchExpedition: (kind, fromColonyId, targetId, cargo) =>
      update((user, now) => user.launchExpedition(kind, fromColonyId, targetId, now, cargo)),

    updateNotable: (id, changes) => update((user) => user.updateNotable(id, changes)),

    saveUser: () => persist(get().user),

    tick: (now) => {
      const next = get().user.clone();
      const completed = next.advance(now, totalOfflineAt(next, now));
      set({
        user: next,
        completedConstructions:
          completed.length > 0
            ? [...get().completedConstructions, ...completed]
            : get().completedConstructions,
      });
      if (completed.length > 0 || Date.now() - lastSavedAt >= AUTOSAVE_INTERVAL_MS) {
        void persist(next);
      }
    },

    startConstruction: (type) => {
      const started = update((user, now) => user.startConstruction(type, now));
      // Once the player has invested in the game, ask the browser to keep it.
      if (started) void useBackup.getState().requestProtection();
      return started;
    },

    cancelConstruction: () => update((user) => user.cancelConstruction()),

    demolishBuilding: (type) => update((user) => user.demolishBuilding(type)),

    speedUpConstruction: (ms) =>
      update((user, now) => user.speedUpConstruction(ms, now)),

    openPeriodIfNeeded: (startTs) => {
      update((user) => {
        user.openOfflinePeriod(startTs);
        return true;
      });
    },

    closeAnyOpenPeriod: (endTs) => {
      update((user) => {
        user.closeOfflinePeriod(endTs);
        return true;
      });
    },

    // Starts the offline counter again; what it already produced is kept.
    resetPeriods: () => {
      update((user) => {
        user.periodList.clearPeriods();
        user.settledOfflineMs = 0;
        return true;
      });
    },

    importFromSnapshot: async (snapshot) => {
      const user = new User();
      user.loadFromSnapshot(snapshot);

      // The time between the export and the import was not observed by this
      // device: an exported open period ends at its last observation.
      const lastSeen = user.periodList.openPeriodLastSeen;
      if (lastSeen !== null) user.closeOfflinePeriod(lastSeen);
      const now = Date.now();
      user.settledOfflineMs = Math.min(user.settledOfflineMs, totalOfflineAt(user, now));
      user.advance(now, totalOfflineAt(user, now));

      set({ user, isHydrated: true, completedConstructions: [] });
      await persist(user);
    },

    resetAll: async () => {
      const user = new User();
      set({ user, isHydrated: true, completedConstructions: [] });
      await persist(user);
    },

    // Records, at most every OPEN_PERIOD_HEARTBEAT_MS, that the device is still
    // seen offline. A long silence between two records (device asleep with the
    // app open) becomes a gap to confirm.
    touchOpenPeriod: (now) => {
      if (!get().user.periodList.needsHeartbeat(now)) return false;

      const next = get().user.clone();
      if (!next.periodList.recordObservation(now)) return false;
      set({ user: next });
      void persist(next);
      return true;
    },

    // The player's answer to "did you stay offline while the app could not see it?".
    resolveUnconfirmedGaps: (stayedOffline) => {
      if (get().user.periodList.unconfirmedGaps.length === 0) return;
      update((user) => {
        user.periodList.resolveUnconfirmedGaps(stayedOffline);
        return true;
      });
    },

    // Called when the page is hidden or shown again.
    syncWithStorage: (online, now) => {
      const user = get().user.clone();
      user.periodList.recordObservation(now);
      if (online) user.closeOfflinePeriod(now);
      user.advance(now, totalOfflineAt(user, now));
      set({ user });
      void persist(user);
      return user;
    },
  };
});

/** The planet the player is looking at (Planète and Habitants sections). */
export function useActiveColony(): Colony {
  return useUser((state) => state.user.activeColony);
}
