import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import NetInfo from "@react-native-community/netinfo";
import { AppState, AppStateStatus } from "react-native";
import { showMessage } from "@/utils/formatNotification";
import {
  addPeriod,
  closeLastPeriod,
  getUnsyncStats,
} from "@/services/offlineStorage";
import {
  emptyStats,
  OfflineProgressContextType,
  UnsyncStats,
} from "@/types/TypOffline";

const OfflineProgressContext = createContext<OfflineProgressContextType>({
  unsyncStats: emptyStats,
  setUnsyncStats: () => {},
  isOnline: true,
});

export const OfflineProgressProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  // const [totalUnsync, setTotalUnsync] = useState<number>(0);
  const [unsyncStats, setUnsyncStats] = useState<UnsyncStats>(emptyStats);
  const [isOnline, setIsOnline] = useState(true);
  const currentPeriodStart = useRef<string | null>(null);
  const appState = useRef<AppStateStatus>(AppState.currentState);
  const liveInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const isClosing = useRef<boolean>(false);

  // 🛰️ État réseau
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(async (state) => {
      const connected = state.isConnected && state.isInternetReachable;
      setIsOnline(!!connected);

      if (!connected && !currentPeriodStart.current) {
        // Début hors ligne
        currentPeriodStart.current = new Date().toISOString();
        await addPeriod({ from: currentPeriodStart.current });
        showMessage("⏳ Début d'une période hors ligne", "success");

        // Démarre le compteur visuel
        if (!liveInterval.current) {
          liveInterval.current = setInterval(() => {
            setUnsyncStats((prev) => ({
              daily: prev.daily + 1,
              weekly: prev.weekly + 1,
              total: prev.total + 1,
            }));
          }, 1000);
        }
      }

      if (connected && currentPeriodStart.current && !isClosing.current) {
        isClosing.current = true;
        const end = new Date().toISOString();
        currentPeriodStart.current = null;
        await closeLastPeriod(end);
        showMessage("✅ Fin d'une période hors ligne");
        if (liveInterval.current) {
          clearInterval(liveInterval.current);
          liveInterval.current = null;
        }
        isClosing.current = false;
      }

      const stats = await getUnsyncStats();
      setUnsyncStats(stats);
    });

    return () => unsubscribe();
  }, []);

  // 💤 Gestion mise en arrière-plan / reprise
  useEffect(() => {
    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      const wasBackground = appState.current.match(/inactive|background/);
      const isNowActive = nextAppState === "active";

      if (wasBackground && isNowActive) {
        const stats = await getUnsyncStats();
        setUnsyncStats(stats);

        // Si toujours hors ligne, on relance juste le compteur visuel
        if (!isOnline && currentPeriodStart.current && !liveInterval.current) {
          liveInterval.current = setInterval(() => {
            setUnsyncStats((prev) => ({
              daily: prev.daily + 1,
              weekly: prev.weekly + 1,
              total: prev.total + 1,
            }));
          }, 1000);
        }
      }

      if (!isNowActive && liveInterval.current) {
        clearInterval(liveInterval.current);
        liveInterval.current = null;
      }

      appState.current = nextAppState;
    };

    const subscription = AppState.addEventListener(
      "change",
      handleAppStateChange,
    );
    return () => subscription.remove();
  }, [isOnline]);

  // 🏁 Initialisation
  useEffect(() => {
    (async () => {
      await closeLastPeriod();
      const stats = await getUnsyncStats();
      setUnsyncStats(stats);
    })();
  }, []);

  return (
    <OfflineProgressContext.Provider
      value={{ unsyncStats, setUnsyncStats, isOnline }}
    >
      {children}
    </OfflineProgressContext.Provider>
  );
};

export const useOfflineProgress = () => useContext(OfflineProgressContext);
