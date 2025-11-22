import { insertMeasure } from "@/api/measures";
import { clearPeriod, getUnsyncedPeriods } from "@/services/offlineStorage";
import { emptyStats } from "@/types/TypOffline";
import { getReadableDeviceName } from "@/utils/deviceModelMap";
import { showMessage } from "@/utils/formatNotification";
import { Session } from "@supabase/supabase-js";

interface SyncMeasuresParams {
  session: Session | null;
  setTotalSyncSeconds: (value: number) => void;
  totalSyncSeconds: number;
  setWeeklySyncSeconds: (value: number) => void;
  weeklySyncSeconds: number;
  setDailySyncSeconds: (value: number) => void;
  dailySyncSeconds: number;
  setUnsyncStats: (stats: typeof emptyStats) => void;
}

/**
 * Synchronise les mesures non synchronisées avec le serveur
 * @returns true si la synchronisation a réussi, false sinon
 */
export const syncMeasures = async ({
  session,
  setTotalSyncSeconds,
  totalSyncSeconds,
  setWeeklySyncSeconds,
  weeklySyncSeconds,
  setDailySyncSeconds,
  dailySyncSeconds,
  setUnsyncStats,
}: SyncMeasuresParams): Promise<boolean> => {
  try {
    if (!session)
      throw new Error("Aucune session active pour la synchronisation.");

    const modelName = await getReadableDeviceName();
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
        duration,
      );
      if (success) {
        await clearPeriod(i);
        totalTime += duration;
      } else {
        globalSuccess = false;
      }
    }
    if (globalSuccess) {
      showMessage("Synchronisation réussie 🎉", "success");
      setUnsyncStats(emptyStats);
      setTotalSyncSeconds(totalSyncSeconds + totalTime);
      setWeeklySyncSeconds(weeklySyncSeconds + totalTime);
      setDailySyncSeconds(dailySyncSeconds + totalTime);
    }
    return globalSuccess;
  } catch (error) {
    if (error instanceof Error) {
      showMessage(error.message, "error", "Erreur");
    }
    return false;
  }
};
