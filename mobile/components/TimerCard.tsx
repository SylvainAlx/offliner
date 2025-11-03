import { SIZES } from "shared/theme";
import { useSession } from "@/contexts/SessionContext";
import { indexStyles } from "@/styles/custom.styles";
import { globalStyles } from "@/styles/global.styles";
import { formatDuration } from "shared/utils/formatDuration";
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

      <View
        style={{
          flexDirection: "row",
          gap: SIZES.margin,
          alignItems: "center",
          justifyContent: "space-around",
          flexWrap: "wrap",
        }}
      >
        <View>
          <Text style={indexStyles.totalLabel}>Synchronisé :</Text>
          <Text style={indexStyles.totalValue}>
            {formatDuration(totalSyncSeconds)}
          </Text>
        </View>

        <View>
          <Text style={indexStyles.totalLabel}>Non synchronisé :</Text>
          <Text style={indexStyles.totalValue}>
            {formatDuration(totalUnsync)}
          </Text>
        </View>
      </View>
    </View>
  );
}
