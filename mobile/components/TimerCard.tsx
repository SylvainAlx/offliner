import { SIZES } from "shared/theme";
import { getPowerSavingEstimate } from "shared/utils/powerSaving";
import { useOfflineProgress } from "@/contexts/OfflineProgressContext";
import { useSession } from "@/contexts/SessionContext";
import { indexStyles } from "@/styles/custom.styles";
import { globalStyles } from "@/styles/global.styles";
import { formatDuration } from "shared/utils/formatDuration";
import { Text, View } from "react-native";
import { useEffect, useState } from "react";
import { config } from "@/config/env";
import Timer from "./Timer";

export default function TimerCard() {
  const { totalUnsync, isOnline } = useOfflineProgress();
  const { totalSyncSeconds, weeklySyncSeconds, dailySyncSeconds } =
    useSession();
  const [isStarting, setIsStarting] = useState(false);

  const totalAll = totalSyncSeconds + totalUnsync;
  const totalWeek = weeklySyncSeconds + totalUnsync;
  const totalDay = dailySyncSeconds + totalUnsync;

  // Gérer le "mode démarrage" si offline
  useEffect(() => {
    if (!isOnline) {
      setIsStarting(true);
      setTimeout(() => {
        setIsStarting(false);
      }, config.minimumDurationMs);
    } else {
      setIsStarting(false);
    }
  }, [isOnline]);

  return (
    <View style={globalStyles.card}>
      <Text style={globalStyles.cardTitle}>Temps passé hors ligne</Text>

      <Timer
        label="total"
        duration={totalAll}
        isOnline={isOnline}
        isStarting={isStarting}
      />
      <Timer
        label="cette semaine"
        duration={totalWeek}
        isOnline={isOnline}
        isStarting={isStarting}
      />
      <Timer
        label="aujourd'hui"
        duration={totalDay}
        isOnline={isOnline}
        isStarting={isStarting}
      />

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
      <Text style={indexStyles.totalLabel}>énergie économisée</Text>
      <Text style={indexStyles.totalValue}>
        {getPowerSavingEstimate(totalAll)}
      </Text>
    </View>
  );
}
