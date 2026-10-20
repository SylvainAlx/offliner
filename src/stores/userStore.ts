import { create } from "zustand";
import { User } from "../models/user";
import {
  COMPANION_INVOCATION_COST,
  HOUSE_CONSTRUCTION_COST,
  TOWN_HALL_CONSTRUCTION_COST,
} from "../utils/constants";
import { userRepository } from "../services/userRepository";

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
  reloadUser: () => Promise<User>;
  syncWithStorage: (online: boolean, now: number) => User;
}

let writeQueue = Promise.resolve();

function persist(user: User): Promise<void> {
  writeQueue = writeQueue
    .then(() => userRepository.save(user))
    .catch((error: unknown) => {
      console.error("Error saving user data:", error);
    });

  return writeQueue;
}

export const useUser = create<UserStore>((set, get) => ({
  user: new User(),
  isHydrated: false,

  hydrate: async () => {
    const user = await userRepository.load();
    const isOnline = typeof navigator !== "undefined" ? navigator.onLine : true;

    // A confirmed period must be closed when the app starts online.
    if (isOnline && user.periodList.getOpenPeriod() !== null) {
      user.closeOfflinePeriod(Date.now());
    }

    set({ user, isHydrated: true });
    await persist(user);
    return user;
  },

  updateName: (name) => {
    const trimmedName = name.trim();
    if (!trimmedName) return;

    const next = get().user.clone();
    next.name = trimmedName;
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

  updateCompanionStages: (offlineMs) => {
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

  reloadUser: async () => {
    const user = await userRepository.load();
    set({ user, isHydrated: true });
    return user;
  },

  // Kept as a compatibility name for the lifecycle store. The in-memory
  // Zustand state is the source of truth; persistence is now asynchronous.
  syncWithStorage: (online, now) => {
    const user = get().user.clone();
    if (online) user.closeOfflinePeriod(now);
    set({ user });
    void persist(user);
    return user;
  },
}));
