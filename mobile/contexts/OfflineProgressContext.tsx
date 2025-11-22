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
  currentPeriodStart: null,
});

export const OfflineProgressProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [unsyncStats, setUnsyncStats] = useState<UnsyncStats>(emptyStats);
  const [isOnline, setIsOnline] = useState(true);
  const [currentPeriodStart, setCurrentPeriodStart] = useState<string | null>(
    null,
  );
  const appState = useRef<AppStateStatus>(AppState.currentState);
  const isClosing = useRef<boolean>(false);

  // 🛰️ État réseau
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(async (state) => {
      const connected = state.isConnected && state.isInternetReachable;
      setIsOnline(!!connected);

      if (!connected && !currentPeriodStart) {
        // Début hors ligne
        const startTime = new Date().toISOString();
        setCurrentPeriodStart(startTime);
        await addPeriod({ from: startTime });
        showMessage("⏳ Début d'une période hors ligne", "success");
      }

      if (connected && currentPeriodStart && !isClosing.current) {
        isClosing.current = true;
        const end = new Date().toISOString();
        setCurrentPeriodStart(null);
        await closeLastPeriod(end);
        showMessage("✅ Fin d'une période hors ligne");
        isClosing.current = false;
      }

      const stats = await getUnsyncStats();
      setUnsyncStats(stats);
    });

    return () => unsubscribe();
  }, [currentPeriodStart]);

  // 💤 Gestion mise en arrière-plan / reprise
  useEffect(() => {
    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      const wasBackground = appState.current.match(/inactive|background/);
      const isNowActive = nextAppState === "active";

      if (wasBackground && isNowActive) {
        const stats = await getUnsyncStats();
        setUnsyncStats(stats);
      }

      appState.current = nextAppState;
    };

    const subscription = AppState.addEventListener(
      "change",
      handleAppStateChange,
    );
    return () => subscription.remove();
  }, []);

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
      value={{ unsyncStats, setUnsyncStats, isOnline, currentPeriodStart }}
    >
      {children}
    </OfflineProgressContext.Provider>
  );
};

export const useOfflineProgress = () => useContext(OfflineProgressContext);
