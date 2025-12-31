import { insertMeasure } from "@/api/measures";
import { clearPeriod, getUnsyncedPeriods } from "@/services/offlineStorage";
import { emptyStats } from "@/types/TypOffline";
import { getReadableDeviceName } from "@/utils/deviceModelMap";
import { showMessage } from "@/utils/formatNotification";
import { Session } from "@supabase/supabase-js";
import { OfflinerUser } from "@/types/user";

interface SyncMeasuresParams {
  session: Session | null;
  appUser: OfflinerUser;
  updateAppUser: (updates: Partial<OfflinerUser>) => void;
  setUnsyncStats: (stats: typeof emptyStats) => void;
}

/**
 * Synchronise les mesures non synchronisées avec le serveur
 * @returns true si la synchronisation a réussi, false sinon
 */
export const syncMeasures = async ({
  session,
  appUser,
  updateAppUser,
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
        start.toISOString().split("T")[0],
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
      updateAppUser({
        totalSyncSeconds: appUser.totalSyncSeconds + totalTime,
        weeklySyncSeconds: appUser.weeklySyncSeconds + totalTime,
        dailySyncSeconds: appUser.dailySyncSeconds + totalTime,
      });
    }
    return globalSuccess;
  } catch (error) {
    if (error instanceof Error) {
      showMessage(error.message, "error", "Erreur");
    }
    return false;
  }
};
