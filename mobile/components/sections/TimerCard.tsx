import { useSession } from "@/contexts/SessionContext";
import { globalStyles } from "@/styles/global.styles";
import { Text, View } from "react-native";
import { UnsyncStats } from "@/types/TypOffline";
import { router } from "expo-router";
import ModernButton from "../ui/ModernButton";
import Timer from "../ui/Timer";

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
  const { appUser, session } = useSession();
  const { weeklySyncSeconds, dailySyncSeconds } = appUser;

  const totalAll = totalSyncSeconds + unsyncStats.total;
  const totalWeek = weeklySyncSeconds + unsyncStats.weekly;
  const totalDay = dailySyncSeconds + unsyncStats.daily;

  return (
    <View style={globalStyles.card}>
      <Text style={globalStyles.cardTitle}>Temps passé hors ligne</Text>

      <Timer label="Total" duration={totalAll} />
      <Timer label="Cette semaine" duration={totalWeek} />
      <Timer label="Aujourd'hui" duration={totalDay} />
      <Timer label="Local (non synchronisé)" duration={unsyncStats.total} />
      {/* <Button
        mode="contained"
        onPress={clearAllPeriods}
        style={globalStyles.button}
      >
        Nettoyer
      </Button> */}
      {session && isOnline ? (
        <ModernButton
          variant="secondary"
          onPress={sendPeriods}
          disabled={unsyncStats.total === 0 || isLoading}
          icon="sync"
        >
          Synchroniser
        </ModernButton>
      ) : (
        isOnline && (
          <ModernButton
            variant="secondary"
            onPress={() => router.push("/profile")}
          >
            Se connecter
          </ModernButton>
        )
      )}
    </View>
  );
}
