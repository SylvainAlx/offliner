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

const TICK_INTERVAL_MS = 1000;
// The countdown is checked often so the period starts on time, but the store
// (and therefore the UI) is only updated when the displayed second changes.
const COUNTDOWN_CHECK_INTERVAL_MS = 100;

function getInitialOnline(): boolean {
  return typeof navigator !== "undefined" ? navigator.onLine : true;
}

/**
 * Brings the companions up to date with the offline time at `now` and returns
 * the values the UI derives from it.
 */
function syncTotals(now: number): Pick<OnlineStatusStore, "totalOfflineMs" | "lastChecked"> {
  const userStore = useUser.getState();
  const totalOfflineMs = userStore.user.periodList.computeTotalMs(now);
  userStore.updateCompanionStages(totalOfflineMs);
  return { totalOfflineMs, lastChecked: new Date(now) };
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
    set(syncTotals(Date.now()));
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
      if (get().offlineCountdownMs !== null) set({ offlineCountdownMs: null });
    };

    const startTick = () => {
      stopTick();
      tick = window.setInterval(() => {
        const now = Date.now();
        useUser.getState().touchOpenPeriod(now);
        set(syncTotals(now));
      }, TICK_INTERVAL_MS);
    };

    const confirmOfflinePeriod = (now: number) => {
      if (pendingOfflineStart === null) return;

      const start = pendingOfflineStart;
      stopCountdownTimer();
      pendingOfflineStart = null;
      useUser.getState().openPeriodIfNeeded(start);
      set({ isOnline: false, offlineCountdownMs: null, ...syncTotals(now) });
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

      const current = get().offlineCountdownMs;
      if (
        current === null ||
        Math.ceil(current / 1000) !== Math.ceil(remaining / 1000)
      ) {
        set({ offlineCountdownMs: remaining });
      }
    };

    const startCountdown = (startTs: number) => {
      if (pendingOfflineStart === null) pendingOfflineStart = startTs;
      stopCountdownTimer();
      updateCountdown();
      countdownTick = window.setInterval(
        updateCountdown,
        COUNTDOWN_CHECK_INTERVAL_MS,
      );
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
      stopTick();
      useUser.getState().closeAnyOpenPeriod(now);
      set({ isOnline: true, ...syncTotals(now) });
    };

    const goOffline = () => {
      const now = Date.now();
      set({ isOnline: false, lastChecked: new Date(now) });
      ensureOfflineTracking(now);
    };

    const persistOnHide = () => {
      const now = Date.now();
      if (!navigator.onLine && pendingOfflineStart !== null) {
        const deadline = pendingOfflineStart + OFFLINE_CONFIRMATION_DELAY_MS;
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
      useUser.getState().syncWithStorage(online, now);
      set({ isOnline: online, ...syncTotals(now) });

      if (online) {
        cancelCountdown();
        stopTick();
      } else {
        ensureOfflineTracking(now);
      }
    };

    if (get().isOnline) {
      const now = Date.now();
      if (useUser.getState().user.periodList.getOpenPeriod() !== null) {
        useUser.getState().closeAnyOpenPeriod(now);
      }
      set(syncTotals(now));
    } else {
      ensureOfflineTracking(Date.now());
    }

    // "pagehide" and "visibilitychange" cover closing the page; "beforeunload"
    // is not used because it prevents the back/forward cache in some browsers.
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("pagehide", persistOnHide);

    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("pagehide", persistOnHide);
      stopTick();
      cancelCountdown();
    };
  },
}));
