import { COLORS, SIZES } from "shared/theme";
import { useOfflineProgress } from "@/contexts/OfflineProgressContext";
import { useSession } from "@/contexts/SessionContext";
import { indexStyles } from "@/styles/custom.styles";
import { globalStyles } from "@/styles/global.styles";
import { formatDuration } from "shared/utils/formatDuration";
import { Text, View } from "react-native";
import { useEffect, useState } from "react";
import { config } from "@/config/env";

export default function TimerCard() {
  const { totalUnsync, isOnline } = useOfflineProgress();
  const { totalSyncSeconds } = useSession();
  const [isStarting, setIsStarting] = useState(false);

  const totalAll = totalSyncSeconds + totalUnsync;

  useEffect(() => {
    if (!isOnline) {
      setIsStarting(true);
      setTimeout(() => {
        setIsStarting(false);
      }, config.startupDelayMs);
    } else {
      setIsStarting(false);
    }
  }, [isOnline]);

  return (
    <View style={globalStyles.card}>
      <Text style={globalStyles.cardTitle}>Temps passé hors ligne</Text>
      <View>
        <Text
          style={{
            fontSize: SIZES.text_xxl,
            fontWeight: "bold",
            color: COLORS.primary, // ou COLORS.primary
          }}
        >
          {formatDuration(totalAll)}
        </Text>
        {isStarting && <Text style={indexStyles.totalValue}>DÉMARRAGE...</Text>}
      </View>
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
