import { getAllMeasures } from "@/api/measures";
import { useOfflineProgress } from "@/contexts/OfflineProgressContext";
import { useSession } from "@/contexts/SessionContext";
import { getPeriods } from "@/services/offlineStorage";
import { DailySummary } from "@/types/TypOffline";
import { Session } from "@supabase/supabase-js";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { useEffect, useState } from "react";

// 🔹 Fonction utilitaire pour transformer une liste en DailySummary
const toDailySummaries = <
  T extends { from?: string; to?: string; date?: string; duration?: number },
>(
  items: T[],
  getDurationAndDate: (item: T) => { date: string; duration: number },
): DailySummary[] => {
  const grouped: Record<string, number> = {};

  items.forEach((item) => {
    const { date, duration } = getDurationAndDate(item);
    grouped[date] = (grouped[date] || 0) + duration;
  });

  return Object.entries(grouped)
    .sort(([a], [b]) => (a < b ? 1 : -1))
    .map(([date, totalSeconds]) => ({
      date,
      displayDate: format(parseISO(date), "EEEE d MMMM yyyy", { locale: fr }),
      totalSeconds,
    }));
};

export const useHistory = () => {
  const [syncDailyData, setSyncDailyData] = useState<DailySummary[]>([]);
  const [localDailyData, setLocalDailyData] = useState<DailySummary[]>([]);

  const { session } = useSession();
  const { isOnline } = useOfflineProgress();

  const refreshLists = () => {
    loadLocalSlots();
    if (session) loadSyncSlots(session);
  };

  // 🔹 Charge les périodes locales
  const loadLocalSlots = async () => {
    const periods = await getPeriods();
    if (!periods) return;

    const summaries = toDailySummaries(periods, (period) => {
      const fromDate = parseISO(period.from!);
      const toDate = period.to ? parseISO(period.to) : new Date();
      const dayKey = format(fromDate, "yyyy-MM-dd");
      const duration = Math.floor(
        (toDate.getTime() - fromDate.getTime()) / 1000,
      );
      return { date: dayKey, duration };
    });

    setLocalDailyData(summaries);
  };

  // 🔹 Charge les mesures synchronisées
  const loadSyncSlots = async (session: Session) => {
    const measures = await getAllMeasures(session);
    if (!measures) return;

    const summaries = toDailySummaries(measures, (measure) => {
      const dayKey = format(parseISO(measure.date!), "yyyy-MM-dd");
      return { date: dayKey, duration: measure.duration || 0 };
    });

    setSyncDailyData(summaries);
  };

  useEffect(() => {
    loadLocalSlots();
    if (session) loadSyncSlots(session);
  }, [session]);

  return {
    localDailyData,
    syncDailyData,
    isOnline,
    refreshLists,
  };
};
