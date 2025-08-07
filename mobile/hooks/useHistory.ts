import { getAllMeasures } from "@/api/measures";
import { useSession } from "@/contexts/SessionContext";
import { Session } from "@supabase/supabase-js";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { useEffect, useState } from "react";

type DailySummary = {
  date: string;
  displayDate: string;
  totalSeconds: number;
};

export const useHistory = () => {
  const [dailyData, setDailyData] = useState<DailySummary[]>([]);
  const { session } = useSession();

  const loadSlots = async (session: Session) => {
    const raw = await getAllMeasures(session);
    if (!raw) return;

    const grouped = raw.reduce<Record<string, number>>((acc, item: any) => {
      const dayKey = format(parseISO(item.date), "yyyy-MM-dd");
      acc[dayKey] = (acc[dayKey] || 0) + (item.duration || 0);
      return acc;
    }, {});

    const summaries: DailySummary[] = Object.entries(grouped)
      .sort(([a], [b]) => (a < b ? 1 : -1))
      .map(([date, totalSeconds]) => ({
        date,
        displayDate: format(parseISO(date), "EEEE d MMMM yyyy", {
          locale: fr,
        }),
        totalSeconds,
      }));

    setDailyData(summaries);
  };

  const formatDuration = (seconds: number): string => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h}h ${m}m ${s}s`;
  };

  useEffect(() => {
    if (session) loadSlots(session);
  }, [session]);

  return { dailyData, loadSlots, formatDuration };
};
