import { GOALS } from "shared/goals";
import { useOfflineProgress } from "@/contexts/OfflineProgressContext";
import { useSession } from "@/contexts/SessionContext";
import { useSyncSession } from "@/hooks/useSyncSession";
import { confirmDialog, showMessage } from "@/utils/formatNotification";
import { useEffect, useRef, useState } from "react";
import { getReadableDeviceName } from "@/utils/deviceModelMap";
import { getLastOpenPeriod } from "@/services/offlineStorage";

export const useHome = () => {
  const [since, setSince] = useState<Date | null>(null);
  const [deviceName, setDeviceName] = useState<string>("");

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { totalSyncSeconds, session } = useSession();
  const { syncMeasures } = useSyncSession(session);
  const { unsyncStats, isOnline } = useOfflineProgress();
  const [nextGoal, setNextGoal] = useState<(typeof GOALS)[0] | undefined>(
    undefined,
  );
  const [isLoading, setIsLoading] = useState(false);

  const getDeviceName = async () => {
    const name = await getReadableDeviceName();
    setDeviceName(name);
  };

  const sendPeriods = async () => {
    if (!session) return;

    const confirmed = await confirmDialog(
      "Es-tu sûr de vouloir synchroniser les périodes non synchronisées ?",
    );

    if (!confirmed) return;
    try {
      setIsLoading(true);
      await syncMeasures();
    } catch (error) {
      if (error instanceof Error) {
        showMessage(error.message, "error", "Erreur");
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    getDeviceName();
    const loadStartTime = async () => {
      const startTime = await getLastOpenPeriod(); // Assume this function fetches the start time from storage
      if (startTime) {
        setSince(new Date(startTime));
      }
    };
    if (!isOnline) loadStartTime();
  }, [isOnline]);

  useEffect(() => {
    const goal = GOALS.find(
      (goal) => totalSyncSeconds + unsyncStats.total < goal.targetSeconds,
    );
    setNextGoal(goal);
  }, [totalSyncSeconds, unsyncStats]);

  useEffect(() => {
    if (since && !isOnline) {
      intervalRef.current = setInterval(async () => {}, 1000);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isOnline, since]);

  return {
    isOnline,
    nextGoal,
    isLoading,
    sendPeriods,
    session,
    unsyncStats,
    totalSyncSeconds,
    deviceName,
  };
};
