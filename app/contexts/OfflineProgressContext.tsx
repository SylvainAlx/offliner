import { config } from "@/config/env";
import {
  addPeriod,
  closeLastPeriod,
  deleteUnclosePeriods,
} from "@/storage/offlineStorage";
import { showMessage } from "@/utils/formatNotification";
import { getTotalOfflineSeconds } from "@/utils/getOfflineTime";
import NetInfo from "@react-native-community/netinfo";
import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

type OfflineProgressContextType = {
  totalUnsync: number;
  setTotalUnsync: (value: number) => void;
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
  const [totalUnsync, setTotalUnsync] = useState<number>(0);
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [startRecord, setStartRecord] = useState<boolean>(false);
  const wasOffline = useRef(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // 1. Charger le temps offline immédiatement au démarrage
  useEffect(() => {
    const loadInitial = async () => {
      const seconds = await getTotalOfflineSeconds(true);
      setTotalUnsync(seconds);
    };
    loadInitial();
    deleteUnclosePeriods();
  }, []);

  // 3. Gérer la détection de réseau uniquement après délai d'init
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      const connected = state.isConnected && state.isInternetReachable;
      console.warn({ connected });
      setIsOnline(!!connected);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const addMeasure = async () => {
      if (startRecord) {
        await addPeriod({ from: new Date().toISOString() });
        showMessage("Démarrage d'une nouvelle mesure hors ligne");
      }
    };
    addMeasure();
  }, [startRecord]);

  // 4. Gérer la logique de tracking (addPeriod, compteur, etc.)
  useEffect(() => {
    if (isOnline) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (wasOffline.current && isOnline) {
        wasOffline.current = false;
        closeLastPeriod(new Date().toISOString());
      }
      return;
    }

    const startOfflineTracking = async () => {
      if (!wasOffline.current && !isOnline) {
        wasOffline.current = true;

        if (!intervalRef.current) {
          const delay = config.startupDelayMs;
          const startTime = Date.now() + delay;
          intervalRef.current = setInterval(() => {
            if (startTime <= Date.now()) {
              setStartRecord(true);
              setTotalUnsync((prev) => prev + 1);
            }
          }, 1000);
        }
      }
    };

    startOfflineTracking();

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
        setStartRecord(false);
      }
    };
  }, [isOnline]);

  return (
    <OfflineProgressContext.Provider
      value={{ totalUnsync, setTotalUnsync, isOnline }}
    >
      {children}
    </OfflineProgressContext.Provider>
  );
};

export const useOfflineProgress = () => useContext(OfflineProgressContext);
