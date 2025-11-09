import { useSession } from "@/contexts/SessionContext";
import { globalStyles } from "@/styles/global.styles";
import { Text, View } from "react-native";
import Timer from "./Timer";

interface TimerCardProps {
  isOnline: boolean;
  totalSyncSeconds: number;
  totalUnsync: number;
}

export default function TimerCard({
  totalSyncSeconds,
  totalUnsync,
}: TimerCardProps) {
  const { weeklySyncSeconds, dailySyncSeconds } = useSession();

  const totalAll = totalSyncSeconds + totalUnsync;
  const totalWeek = weeklySyncSeconds + totalUnsync;
  const totalDay = dailySyncSeconds + totalUnsync;

  return (
    <View style={globalStyles.card}>
      <Text style={globalStyles.cardTitle}>Temps passé hors ligne</Text>

      <Timer label="total" duration={totalAll} />
      <Timer label="cette semaine" duration={totalWeek} />
      <Timer label="aujourd'hui" duration={totalDay} />
    </View>
  );
}
