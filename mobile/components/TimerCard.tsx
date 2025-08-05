import { COLORS, SIZES } from "@/constants/Theme";
import { useOfflineProgress } from "@/contexts/OfflineProgressContext";
import { useSession } from "@/contexts/SessionContext";
import { globalStyles } from "@/styles/global.styles";
import { indexStyles } from "@/styles/index.styles";
import { formatDuration } from "@/utils/formatDuration";
import { Text, View } from "react-native";

export default function TimerCard() {
  const { totalUnsync, isOnline } = useOfflineProgress();
  const { totalSyncSeconds } = useSession();

  const totalAll = totalSyncSeconds + totalUnsync;

  return (
    <View style={globalStyles.card}>
      <Text style={globalStyles.cardTitle}>Temps passé hors ligne</Text>
      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontSize: SIZES.text_xxl,
            fontWeight: "bold",
            color: COLORS.primary, // ou COLORS.primary
          }}
        >
          {formatDuration(totalAll)}
        </Text>
      </View>
      <View
        style={{
          flex: 1,
          flexDirection: "row",
          gap: SIZES.margin,
          alignItems: "center",
        }}
      >
        <Text style={indexStyles.totalLabel}>🔄 Synchronisé :</Text>
        <Text style={indexStyles.totalValue}>
          {formatDuration(totalSyncSeconds)}
        </Text>

        <Text style={indexStyles.totalLabel}>📥 Non synchronisé :</Text>
        {!isOnline && totalUnsync === 0 ? (
          <Text style={indexStyles.totalValue}>DÉMARRAGE...</Text>
        ) : (
          <Text style={indexStyles.totalValue}>
            {formatDuration(totalUnsync)}
          </Text>
        )}
      </View>
    </View>
  );
}
