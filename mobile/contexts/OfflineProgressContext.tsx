import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { AppState, AppStateStatus } from "react-native";
import NetInfo from "@react-native-community/netinfo";

import {
  addPeriod,
  closeLastPeriod,
  deleteUnclosePeriods,
} from "@/storage/offlineStorage";
import { getTotalOfflineSeconds } from "@/utils/getOfflineTime";
import { showMessage } from "@/utils/formatNotification";

type OfflineProgressContextType = {
  totalUnsync: number;
  isOnline: boolean;
};

const OfflineProgressContext = createContext<OfflineProgressContextType>({
  totalUnsync: 0,
  isOnline: true,
});

export const OfflineProgressProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [totalUnsync, setTotalUnsync] = useState<number>(0);
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const wasOffline = useRef(false);
  const appState = useRef<AppStateStatus>(AppState.currentState);
  const liveInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  // Charger l'état initial
  useEffect(() => {
    const init = async () => {
      await deleteUnclosePeriods();
      const seconds = await getTotalOfflineSeconds(true);
      setTotalUnsync(seconds);
    };
    init();
  }, []);

  // Surveiller la connectivité réseau
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      const connected = state.isConnected && state.isInternetReachable;
      setIsOnline(!!connected);
    });
    return () => unsubscribe();
  }, []);

  // Gestion des périodes offline et compteur live
  useEffect(() => {
    const handleOfflinePeriod = async () => {
      if (!isOnline && !wasOffline.current) {
        // Début période offline
        wasOffline.current = true;
        await addPeriod({ from: new Date().toISOString() });
        showMessage("⏳ Début d'une période hors ligne");

        // Compteur live au premier plan
        liveInterval.current = setInterval(() => {
          setTotalUnsync((prev) => prev + 1);
        }, 1000);
      }

      if (isOnline && wasOffline.current) {
        // Fin période offline
        wasOffline.current = false;
        await closeLastPeriod(new Date().toISOString());
        const seconds = await getTotalOfflineSeconds(true);
        setTotalUnsync(seconds);
        showMessage("✅ Fin d'une période hors ligne");

        // Arrêter le compteur live
        if (liveInterval.current) clearInterval(liveInterval.current);
        liveInterval.current = null;
      }
    };

    handleOfflinePeriod();

    return () => {
      if (liveInterval.current) clearInterval(liveInterval.current);
      liveInterval.current = null;
    };
  }, [isOnline]);

  // Recalculer le total à chaque retour au premier plan
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === "active"
      ) {
        // L'app revient au premier plan → recalculer le total
        getTotalOfflineSeconds(true).then(setTotalUnsync);
      }
      appState.current = nextAppState;
    });

    return () => subscription.remove();
  }, []);

  return (
    <OfflineProgressContext.Provider value={{ totalUnsync, isOnline }}>
      {children}
    </OfflineProgressContext.Provider>
  );
};

export const useOfflineProgress = () => useContext(OfflineProgressContext);
