import { useSession } from "@/contexts/SessionContext";
import { globalStyles } from "@/styles/global.styles";
import { Text, View } from "react-native";
import Timer from "./Timer";
import { UnsyncStats } from "@/types/TypOffline";

interface TimerCardProps {
  isOnline: boolean;
  totalSyncSeconds: number;
  unsyncStats: UnsyncStats;
}

export default function TimerCard({
  totalSyncSeconds,
  unsyncStats,
}: TimerCardProps) {
  const { weeklySyncSeconds, dailySyncSeconds } = useSession();

  const totalAll = totalSyncSeconds + unsyncStats.total;
  const totalWeek = weeklySyncSeconds + unsyncStats.weekly;
  const totalDay = dailySyncSeconds + unsyncStats.daily;

  return (
    <View style={globalStyles.card}>
      <Text style={globalStyles.cardTitle}>Temps passé hors ligne</Text>

      <Timer label="total" duration={totalAll} />
      <Timer label="cette semaine" duration={totalWeek} />
      <Timer label="aujourd'hui" duration={totalDay} />
    </View>
  );
}
