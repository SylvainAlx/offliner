import { create } from "zustand";
import { User } from "../models/user";
import {
  COMPANION_INVOCATION_COST,
  HOUSE_CONSTRUCTION_COST,
  TOWN_HALL_CONSTRUCTION_COST,
} from "../utils/constants";
import { userRepository } from "../services/userRepository";
import { sanitizeName } from "../utils/sanitize";

export interface UserStore {
  user: User;
  isHydrated: boolean;
  hydrate: () => Promise<User>;
  updateName: (name: string) => void;
  openPeriodIfNeeded: (startTs: number) => void;
  closeAnyOpenPeriod: (endTs: number) => void;
  resetPeriods: () => void;
  saveUser: () => Promise<void>;
  buildHouse: (offlineMs: number) => boolean;
  buildTownHall: (offlineMs: number) => boolean;
  invokeCompanion: (offlineMs: number) => boolean;
  updateCompanionStages: (offlineMs: number) => boolean;
  renameVillage: (name: string) => boolean;
  renameCompanion: (companionId: string, name: string) => boolean;
  releaseCompanionAndGetOfflinium: (companionId: string) => boolean;
  cancelCompanionInvocation: (companionId: string, offlineMs: number) => boolean;
  completeCompanionInvocations: (offlineMs: number) => void;
  completePendingElements: (offlineMs: number) => void;
  cancelPendingElement: (elementId: string, offlineMs: number) => boolean;
  importFromSnapshot: (snapshot: unknown) => Promise<void>;
  resetAll: () => Promise<void>;
  touchOpenPeriod: (now: number) => boolean;
  syncWithStorage: (online: boolean, now: number) => User;
}

// Every write to the profile goes through this queue, in the order the state
// changed, so an older state can never overwrite a newer one (import, reset).
let writeQueue = Promise.resolve();

function persist(user: User): Promise<void> {
  writeQueue = writeQueue
    .then(() => userRepository.save(user))
    .catch((error: unknown) => {
      console.error("Error saving user data:", error);
    });

  return writeQueue;
}

/** Applies the unobserved-time rule to a freshly loaded profile. */
function prepareLoadedUser(user: User, now: number, online: boolean): User {
  user.periodList.recordObservation(now);
  // A confirmed period must be closed when the app starts online.
  if (online) user.closeOfflinePeriod(now);
  return user;
}

function isNavigatorOnline(): boolean {
  return typeof navigator !== "undefined" ? navigator.onLine : true;
}

export const useUser = create<UserStore>((set, get) => ({
  user: new User(),
  isHydrated: false,

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

    const next = get().user.clone();
    next.name = sanitizedName;
    set({ user: next });
    void persist(next);
  },

  saveUser: () => persist(get().user),

  buildHouse: (offlineMs) => {
    const next = get().user.clone();
    const spend = next.spendOfflinium(HOUSE_CONSTRUCTION_COST, offlineMs);
    if (!spend) return false;

    next.village.addPendingElement(
      "house",
      offlineMs,
      spend.stored,
      spend.openPeriod,
    );
    set({ user: next });
    void persist(next);
    return true;
  },

  buildTownHall: (offlineMs) => {
    const next = get().user.clone();
    if (!next.buildTownHall(offlineMs, TOWN_HALL_CONSTRUCTION_COST)) {
      return false;
    }

    set({ user: next });
    void persist(next);
    return true;
  },

  invokeCompanion: (offlineMs) => {
    const next = get().user.clone();
    if (!next.village.canInvokeCompanion()) return false;

    const spend = next.spendOfflinium(COMPANION_INVOCATION_COST, offlineMs);
    if (!spend) return false;

    next.village.addPendingElement(
      "companion",
      offlineMs,
      spend.stored,
      spend.openPeriod,
    );
    set({ user: next });
    void persist(next);
    return true;
  },

  // Called every second: only clone and save when a stage actually changes.
  updateCompanionStages: (offlineMs) => {
    if (!get().user.village.hasPendingStageUpdates(offlineMs)) return false;

    const next = get().user.clone();
    if (next.updateCompanionStages(offlineMs) === 0) return false;

    set({ user: next });
    void persist(next);
    return true;
  },

  renameVillage: (name) => {
    const next = get().user.clone();
    if (!next.renameVillage(name)) return false;

    set({ user: next });
    void persist(next);
    return true;
  },

  renameCompanion: (companionId, name) => {
    const next = get().user.clone();
    if (!next.renameCompanion(companionId, name)) return false;

    set({ user: next });
    void persist(next);
    return true;
  },

  releaseCompanionAndGetOfflinium: (companionId) => {
    const next = get().user.clone();
    if (!next.releaseCompanionAndGetOfflinium(companionId)) return false;

    set({ user: next });
    void persist(next);
    return true;
  },

  cancelCompanionInvocation: (companionId, offlineMs) => {
    const next = get().user.clone();
    if (!next.cancelCompanionInvocation(companionId, offlineMs)) return false;

    set({ user: next });
    void persist(next);
    return true;
  },

  completeCompanionInvocations: (offlineMs) => {
    get().completePendingElements(offlineMs);
  },

  completePendingElements: (offlineMs) => {
    if (!get().user.village.hasCompletedPendingElements(offlineMs)) return;

    const next = get().user.clone();
    if (next.village.completePendingElements(offlineMs) === 0) return;

    set({ user: next });
    void persist(next);
  },

  cancelPendingElement: (elementId, offlineMs) => {
    const next = get().user.clone();
    if (!next.cancelPendingElement(elementId, offlineMs)) return false;

    set({ user: next });
    void persist(next);
    return true;
  },

  openPeriodIfNeeded: (startTs) => {
    const next = get().user.clone();
    next.periodList.openPeriodIfNeeded(startTs);
    set({ user: next });
    void persist(next);
  },

  closeAnyOpenPeriod: (endTs) => {
    const next = get().user.clone();
    next.closeOfflinePeriod(endTs);
    set({ user: next });
    void persist(next);
  },

  resetPeriods: () => {
    const next = get().user.clone();
    const elapsedOfflineMs = next.periodList.computeTotalMs(Date.now());
    next.periodList.clearPeriods();
    next.offlinium = 0;
    next.offliniumSpentDuringOpenPeriod = 0;
    next.village.shiftCompanionBirthTimes(elapsedOfflineMs);
    next.village.pendingElements = next.village.pendingElements.map(
      (pending) => ({
        ...pending,
        offlineMsAtStart: pending.offlineMsAtStart - elapsedOfflineMs,
      }),
    );
    set({ user: next });
    void persist(next);
  },

  importFromSnapshot: async (snapshot) => {
    const user = new User();
    user.loadFromSnapshot(snapshot);

    // The time between the export and the import was not observed by this
    // device: an exported open period ends at its last observation.
    const lastSeen = user.periodList.openPeriodLastSeen;
    if (lastSeen !== null) user.closeOfflinePeriod(lastSeen);

    set({ user, isHydrated: true });
    await persist(user);
  },

  resetAll: async () => {
    const user = new User();
    set({ user, isHydrated: true });
    await persist(user);
  },

  // Records, at most every OPEN_PERIOD_HEARTBEAT_MS, that the device is still
  // seen offline, and caps the time during which the app could not observe it.
  touchOpenPeriod: (now) => {
    if (!get().user.periodList.needsHeartbeat(now)) return false;

    const next = get().user.clone();
    if (!next.periodList.recordObservation(now)) return false;
    set({ user: next });
    void persist(next);
    return true;
  },

  // Kept as a compatibility name for the lifecycle store. The in-memory
  // Zustand state is the source of truth; persistence is now asynchronous.
  syncWithStorage: (online, now) => {
    const user = get().user.clone();
    user.periodList.recordObservation(now);
    if (online) user.closeOfflinePeriod(now);
    set({ user });
    void persist(user);
    return user;
  },
}));
