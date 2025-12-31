import {
  getDailyDuration,
  getTotalDuration,
  getWeeklyDuration,
} from "@/api/measures";
import { useSession } from "@/contexts/SessionContext";
import { Session } from "@supabase/supabase-js";
import { useEffect } from "react";

/**
 * Hook pour charger les données de synchronisation au démarrage
 * Doit être appelé une seule fois au niveau racine de l'application
 */
export const useSyncData = (session: Session | null) => {
  const { updateAppUser } = useSession();

  useEffect(() => {
    const loadTotalSyncTime = async (session: Session) => {
      const totalSeconds = await getTotalDuration(session);
      updateAppUser({ totalSyncSeconds: totalSeconds });
    };
    const loadWeeklySyncTime = async (session: Session) => {
      const totalSeconds = await getWeeklyDuration(session);
      updateAppUser({ weeklySyncSeconds: totalSeconds });
    };

    const loadDaylySyncTime = async (session: Session) => {
      const totalSeconds = await getDailyDuration(session);
      updateAppUser({ dailySyncSeconds: totalSeconds });
    };

    if (session != null) {
      loadTotalSyncTime(session);
      loadWeeklySyncTime(session);
      loadDaylySyncTime(session);
    }

    return () => {
      // Cleanup if necessary
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);
};
