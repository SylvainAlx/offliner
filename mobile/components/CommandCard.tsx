import { indexStyles } from "@/styles/custom.styles";
import { globalStyles } from "@/styles/global.styles";
import { Session } from "@supabase/supabase-js";
import { router } from "expo-router";
import { View, Text } from "react-native";
import { Button } from "react-native-paper";
import { COLORS } from "shared/theme";
import { formatDuration } from "shared/utils/formatDuration";

interface CommandCardProps {
  session: Session | null;
  totalUnsync: number;
  isLoading: boolean;
  isOnline: boolean;
  sendPeriods: () => Promise<void>;
}

export default function CommandCard({
  session,
  totalUnsync,
  isLoading,
  isOnline,
  sendPeriods,
}: CommandCardProps) {
  return (
    <View style={globalStyles.card}>
      <Text style={globalStyles.cardTitle}>Synchronisation</Text>
      <Text style={indexStyles.message}>
        {session
          ? totalUnsync === 0
            ? "Pas de temps hors ligne à synchroniser"
            : !isLoading
            ? `${formatDuration(
                totalUnsync,
              )} hors ligne en attente de synchronisation ${
                isOnline ? "" : "(en cours...)"
              }`
            : "Synchronisation en cours..."
          : "Vous devez avoir un compte pour synchroniser le temps hors ligne et miner des gemmes de temps"}
      </Text>

      {session && isOnline ? (
        <Button
          mode="contained"
          onPress={sendPeriods}
          disabled={totalUnsync === 0 || isLoading}
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
