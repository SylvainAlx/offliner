import { globalStyles } from "@/styles/global.styles";
import { UnsyncStats } from "@/types/TypOffline";
import { Session } from "@supabase/supabase-js";
import { router } from "expo-router";
import { View, Text } from "react-native";
import { COLORS } from "shared/theme";
import Timer from "./Timer";
import { indexStyles } from "@/styles/custom.styles";
import ModernButton from "./ui/ModernButton";

interface CommandCardProps {
  session: Session | null;
  unsyncStats: UnsyncStats;
  isLoading: boolean;
  isOnline: boolean;
  sendPeriods: () => Promise<void>;
}

export default function CommandCard({
  session,
  unsyncStats,
  isLoading,
  isOnline,
  sendPeriods,
}: CommandCardProps) {
  return (
    <View style={globalStyles.card}>
      <Text style={globalStyles.cardTitle}>Synchronisation</Text>
      <Timer label="temps non synchronisé" duration={unsyncStats.total} />

      {!session && (
        <Text style={indexStyles.message}>
          Vous devez avoir un compte pour synchroniser le temps hors ligne et
          miner des gemmes de temps
        </Text>
      )}

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
          loading={isLoading}
          icon="sync"
        >
          Synchroniser
        </ModernButton>
      ) : (
        isOnline && (
          <ModernButton
            variant="primary"
            onPress={() => router.push("/profile")}
          >
            Se connecter
          </ModernButton>
        )
      )}
    </View>
  );
}
