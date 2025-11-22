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
  const { setTotalSyncSeconds, setWeeklySyncSeconds, setDailySyncSeconds } =
    useSession();

  useEffect(() => {
    const loadTotalSyncTime = async (session: Session) => {
      const totalSeconds = await getTotalDuration(session);
      setTotalSyncSeconds(totalSeconds);
    };
    const loadWeeklySyncTime = async (session: Session) => {
      const totalSeconds = await getWeeklyDuration(session);
      setWeeklySyncSeconds(totalSeconds);
    };

    const loadDaylySyncTime = async (session: Session) => {
      const totalSeconds = await getDailyDuration(session);
      setDailySyncSeconds(totalSeconds);
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
