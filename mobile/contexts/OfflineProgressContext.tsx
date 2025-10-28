import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import NetInfo from "@react-native-community/netinfo";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AppState, AppStateStatus } from "react-native";
import { showMessage } from "@/utils/formatNotification";
import { STORAGE_KEYS } from "@/constants/Labels";

type OfflineProgressContextType = {
  totalUnsync: number;
  setTotalUnsync: React.Dispatch<React.SetStateAction<number>>;
  isOnline: boolean;
};

const OfflineProgressContext = createContext<OfflineProgressContextType>({
  totalUnsync: 0,
  setTotalUnsync: () => {},
  isOnline: true,
});

export const OfflineProgressProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [totalUnsync, setTotalUnsync] = useState(0);
  const [isOnline, setIsOnline] = useState(true);
  const currentPeriodStart = useRef<string | null>(null);
  const appState = useRef<AppStateStatus>(AppState.currentState);
  const liveInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  // Helpers
  type OfflinePeriod = { from?: string | null; to?: string | null };

  const getPeriods = async (): Promise<OfflinePeriod[]> => {
    const json = await AsyncStorage.getItem(STORAGE_KEYS.OFFLINE_PERIODS);
    return json ? (JSON.parse(json) as OfflinePeriod[]) : [];
  };

  const savePeriods = async (periods: OfflinePeriod[]) => {
    await AsyncStorage.setItem(
      STORAGE_KEYS.OFFLINE_PERIODS,
      JSON.stringify(periods),
    );
  };

  const getTotalSeconds = async (): Promise<number> => {
    const periods = await getPeriods();
    let total = 0;
    for (const p of periods) {
      if (p && p.from) {
        const start = new Date(p.from).getTime();
        const end = p.to ? new Date(p.to).getTime() : Date.now();
        total += Math.floor((end - start) / 1000);
      }
    }
    return total;
  };

  // 🛰️ État réseau
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(async (state) => {
      const connected = state.isConnected && state.isInternetReachable;
      setIsOnline(!!connected);

      if (!connected && !currentPeriodStart.current) {
        // Début hors ligne
        currentPeriodStart.current = new Date().toISOString();
        const periods = await getPeriods();
        periods.push({ from: currentPeriodStart.current });
        await savePeriods(periods);
        showMessage("⏳ Début d'une période hors ligne", "success");

        // Démarre le compteur visuel
        if (!liveInterval.current) {
          liveInterval.current = setInterval(() => {
            setTotalUnsync((prev) => prev + 1);
          }, 1000);
        }
      }

      if (connected && currentPeriodStart.current) {
        // Fin hors ligne
        const periods = await getPeriods();
        const last = periods.reverse().find((p) => !p.to);
        if (last) last.to = new Date().toISOString();
        await savePeriods(periods.reverse());
        currentPeriodStart.current = null;
        showMessage("✅ Fin d'une période hors ligne");

        // Stoppe le compteur visuel
        if (liveInterval.current) {
          clearInterval(liveInterval.current);
          liveInterval.current = null;
        }
      }

      const total = await getTotalSeconds();
      setTotalUnsync(total);
    });

    return () => unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 💤 Gestion mise en arrière-plan / reprise
  useEffect(() => {
    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      const wasBackground = appState.current.match(/inactive|background/);
      const isNowActive = nextAppState === "active";

      if (wasBackground && isNowActive) {
        const total = await getTotalSeconds();
        setTotalUnsync(total);

        // Si toujours hors ligne, on relance juste le compteur visuel
        if (!isOnline && currentPeriodStart.current && !liveInterval.current) {
          liveInterval.current = setInterval(() => {
            setTotalUnsync((prev) => prev + 1);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOnline]);

  // 🏁 Initialisation
  useEffect(() => {
    (async () => {
      const total = await getTotalSeconds();
      setTotalUnsync(total);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <OfflineProgressContext.Provider
      value={{ totalUnsync, setTotalUnsync, isOnline }}
    >
      {children}
    </OfflineProgressContext.Provider>
  );
};

export const useOfflineProgress = () => useContext(OfflineProgressContext);
