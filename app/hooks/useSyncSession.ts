import { getDeviceId, insertDevice } from "@/api/devices";
import { getTotalDuration, insertMeasure } from "@/api/measures";
import { useOfflineProgress } from "@/contexts/OfflineProgressContext";
import { useSession } from "@/contexts/SessionContext";
import { clearPeriod, getUnsyncedPeriods } from "@/storage/offlineStorage";
import { showMessage } from "@/utils/formatNotification";
import { Session } from "@supabase/supabase-js";
import * as Device from "expo-device";
import { useEffect } from "react";

export const useSyncSession = (session: Session | null) => {
  const { setTotalSyncSeconds, totalSyncSeconds } = useSession();
  const { setTotalUnsync } = useOfflineProgress();

  const syncMeasures = async (): Promise<boolean> => {
    try {
      if (!session)
        throw new Error("Aucune session active pour la synchronisation.");

      const modelName = Device.modelName;
      if (!modelName) throw new Error("L'appareil n'a pas de nom de modèle.");

      let globalSuccess = true;
      let totalTime = 0;
      const periods = await getUnsyncedPeriods();
      for (let i = periods.length - 1; i >= 0; i--) {
        const start = new Date(periods[i].from);
        const end = new Date(periods[i].to ?? periods[i].from);
        const duration = Math.floor((end.getTime() - start.getTime()) / 1000); // duration in seconds
        const { success } = await insertMeasure(
          session,
          modelName,
          start.toDateString(),
          duration
        );
        if (success) {
          await clearPeriod(i);
          totalTime += duration;
        } else {
          globalSuccess = false;
        }
      }
      if (globalSuccess) {
        setTotalUnsync(0);
        setTotalSyncSeconds(totalSyncSeconds + totalTime);
      }
      return globalSuccess;
    } catch (error) {
      if (error instanceof Error) {
        showMessage(error.message);
      }
      return false;
    }
  };

  const getAndUpdateLocalDevice = async (session: Session): Promise<string> => {
    const deviceName = Device.modelName;

    if (deviceName) {
      try {
        const data = await getDeviceId(session, deviceName);
        if (!data) {
          console.warn(
            "L'appareil n'existe pas dans la base de données, insertion..."
          );
          await insertDevice(session, deviceName);
        }
      } catch (error) {
        if (error instanceof Error) {
          showMessage(error.message);
        }
      }
    }
    return deviceName ?? "Unknown Device";
  };

  useEffect(() => {
    const loadTotalSyncTime = async (session: Session) => {
      const totalSeconds = await getTotalDuration(session);
      setTotalSyncSeconds(totalSeconds);
    };

    if (session != null) {
      loadTotalSyncTime(session);
      getAndUpdateLocalDevice(session);
    }

    return () => {
      // Cleanup if necessary
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  return { session, getAndUpdateLocalDevice, syncMeasures };
};
