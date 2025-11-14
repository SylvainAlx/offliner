import { useSession } from "@/contexts/SessionContext";
import { globalStyles } from "@/styles/global.styles";
import { Text, View } from "react-native";
import Timer from "./Timer";
import { UnsyncStats } from "@/types/TypOffline";
import { Button } from "react-native-paper";
import { COLORS } from "shared/theme";
import { router } from "expo-router";

interface TimerCardProps {
  isOnline: boolean;
  isLoading: boolean;
  totalSyncSeconds: number;
  unsyncStats: UnsyncStats;
  sendPeriods: () => Promise<void>;
}

export default function TimerCard({
  isOnline,
  isLoading,
  totalSyncSeconds,
  unsyncStats,
  sendPeriods,
}: TimerCardProps) {
  const { weeklySyncSeconds, dailySyncSeconds, session } = useSession();

  const totalAll = totalSyncSeconds + unsyncStats.total;
  const totalWeek = weeklySyncSeconds + unsyncStats.weekly;
  const totalDay = dailySyncSeconds + unsyncStats.daily;

  return (
    <View style={globalStyles.card}>
      <Text style={globalStyles.cardTitle}>Temps passé hors ligne</Text>

      <Timer label="total" duration={totalAll} />
      <Timer label="cette semaine" duration={totalWeek} />
      <Timer label="aujourd'hui" duration={totalDay} />
      <Timer label="non synchronisé" duration={unsyncStats.total} />
      {/* <Button
        mode="contained"
        onPress={clearAllPeriods}
        style={globalStyles.button}
      >
        Nettoyer
      </Button> */}
      {session && isOnline ? (
        <Button
          mode="contained"
          onPress={sendPeriods}
          disabled={unsyncStats.total === 0 || isLoading}
          buttonColor={isOnline ? COLORS.secondary : COLORS.dark}
          style={globalStyles.button}
        >
          Synchroniser
        </Button>
      ) : (
        isOnline && (
          <Button
            mode="contained"
            buttonColor={COLORS.secondary}
            style={globalStyles.button}
            onPress={() => router.push("/profile")}
          >
            Se connecter
          </Button>
        )
      )}
    </View>
  );
}
