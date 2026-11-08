import { create } from "zustand";
import { OFFLINE_CONFIRMATION_DELAY_MS } from "../utils/constants";
import { useUser } from "./userStore";

export interface OnlineStatusStore {
  isOnline: boolean;
  lastChecked: Date | null;
  totalOfflineMs: number;
  offlineCountdownMs: number | null;
  resetTracking: () => void;
  refreshFromUser: () => void;
  initialize: () => () => void;
}

function getInitialOnline(): boolean {
  return typeof navigator !== "undefined" ? navigator.onLine : true;
}

function persistDirectly(now: number, isOnline: boolean): void {
  try {
    // Do not create a period just because the page is being hidden. A period
    // is created by the visible countdown once its five seconds have elapsed.
    // The current Zustand state is persisted by the asynchronous repository.
    useUser.getState().syncWithStorage(isOnline, now);
  } catch {
    // Persistence must not prevent the page lifecycle from completing.
  }
}

export const useOnlineStatus = create<OnlineStatusStore>((set, get) => ({
  isOnline: getInitialOnline(),
  lastChecked: new Date(),
  totalOfflineMs: useUser
    .getState()
    .user.periodList.computeTotalMs(Date.now()),
  offlineCountdownMs: null,

  resetTracking: () => {
    useUser.getState().resetPeriods();
    set({ totalOfflineMs: 0, lastChecked: new Date() });
  },

  refreshFromUser: () => {
    const now = Date.now();
    const user = useUser.getState().user;
    const totalOfflineMs = user.periodList.computeTotalMs(now);
    useUser.getState().updateCompanionStages(totalOfflineMs);
    const updatedUser = useUser.getState().user;
    set({
      totalOfflineMs: updatedUser.periodList.computeTotalMs(now),
      lastChecked: new Date(now),
    });
  },

  initialize: () => {
    let tick: number | null = null;
    let countdownTick: number | null = null;
    let pendingOfflineStart: number | null = null;

    const stopTick = () => {
      if (tick !== null) {
        window.clearInterval(tick);
        tick = null;
      }
    };

    const stopCountdownTimer = () => {
      if (countdownTick !== null) {
        window.clearInterval(countdownTick);
        countdownTick = null;
      }
    };

    const cancelCountdown = () => {
      stopCountdownTimer();
      pendingOfflineStart = null;
      set({ offlineCountdownMs: null });
    };

    const startTick = () => {
      stopTick();
      tick = window.setInterval(() => {
        const now = Date.now();
        useUser.getState().touchOpenPeriod(now);
        const user = useUser.getState().user;
        const totalOfflineMs = user.periodList.computeTotalMs(now);
        useUser.getState().updateCompanionStages(totalOfflineMs);
        const updatedUser = useUser.getState().user;
        set({
          totalOfflineMs: updatedUser.periodList.computeTotalMs(now),
          lastChecked: new Date(now),
        });
      }, 1000);
    };

    const confirmOfflinePeriod = (now: number) => {
      if (pendingOfflineStart === null) return;

      const start = pendingOfflineStart;
      stopCountdownTimer();
      pendingOfflineStart = null;
      useUser.getState().openPeriodIfNeeded(start);

      const totalOfflineMs = useUser
        .getState()
        .user.periodList.computeTotalMs(now);
      useUser.getState().updateCompanionStages(totalOfflineMs);
      const user = useUser.getState().user;
      set({
        isOnline: false,
        offlineCountdownMs: null,
        totalOfflineMs: user.periodList.computeTotalMs(now),
        lastChecked: new Date(now),
      });
      startTick();
    };

    const updateCountdown = () => {
      if (pendingOfflineStart === null) return;

      const now = Date.now();
      const remaining = Math.max(
        0,
        pendingOfflineStart + OFFLINE_CONFIRMATION_DELAY_MS - now,
      );

      if (remaining === 0) {
        confirmOfflinePeriod(now);
        return;
      }

      set({
        offlineCountdownMs: remaining,
        lastChecked: new Date(now),
      });
    };

    const startCountdown = (startTs: number) => {
      if (pendingOfflineStart === null) pendingOfflineStart = startTs;
      stopCountdownTimer();
      updateCountdown();
      countdownTick = window.setInterval(updateCountdown, 100);
    };

    const ensureOfflineTracking = (now: number) => {
      const user = useUser.getState().user;
      if (user.periodList.getOpenPeriod() !== null) {
        set({ offlineCountdownMs: null });
        startTick();
        return;
      }

      startCountdown(now);
    };

    const goOnline = () => {
      const now = Date.now();
      cancelCountdown();
      useUser.getState().closeAnyOpenPeriod(now);
      const totalOfflineMs = useUser
        .getState()
        .user.periodList.computeTotalMs(now);
      useUser.getState().updateCompanionStages(totalOfflineMs);
      const user = useUser.getState().user;
      set({
        isOnline: true,
        totalOfflineMs: user.periodList.computeTotalMs(now),
        lastChecked: new Date(now),
      });
      stopTick();
    };

    const goOffline = () => {
      const now = Date.now();
      set({ isOnline: false, lastChecked: new Date(now) });
      ensureOfflineTracking(now);
    };

    const persistOnHide = () => {
      const now = Date.now();
      if (!navigator.onLine && pendingOfflineStart !== null) {
        const deadline =
          pendingOfflineStart + OFFLINE_CONFIRMATION_DELAY_MS;
        if (now >= deadline) confirmOfflinePeriod(now);
      }
      persistDirectly(now, navigator.onLine);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        persistOnHide();
        stopTick();
        stopCountdownTimer();
        return;
      }

      const now = Date.now();
      const online = navigator.onLine;
      const user = useUser.getState().syncWithStorage(online, now);
      const totalOfflineMs = user.periodList.computeTotalMs(now);
      useUser.getState().updateCompanionStages(totalOfflineMs);
      const updatedUser = useUser.getState().user;
      set({
        isOnline: online,
        totalOfflineMs: updatedUser.periodList.computeTotalMs(now),
        lastChecked: new Date(now),
      });

      if (online) {
        cancelCountdown();
        stopTick();
      } else {
        ensureOfflineTracking(now);
      }
    };

    if (get().isOnline) {
      const now = Date.now();
      const user = useUser.getState().user;
      if (user.periodList.getOpenPeriod() !== null) {
        useUser.getState().closeAnyOpenPeriod(now);
      }
      const totalOfflineMs = useUser
        .getState()
        .user.periodList.computeTotalMs(now);
      useUser.getState().updateCompanionStages(totalOfflineMs);
      set({
        totalOfflineMs: useUser
          .getState()
          .user.periodList.computeTotalMs(now),
        lastChecked: new Date(now),
      });
    } else {
      ensureOfflineTracking(Date.now());
    }

    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("pagehide", persistOnHide);
    window.addEventListener("beforeunload", persistOnHide);

    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("pagehide", persistOnHide);
      window.removeEventListener("beforeunload", persistOnHide);
      stopTick();
      cancelCountdown();
    };
  },
}));
