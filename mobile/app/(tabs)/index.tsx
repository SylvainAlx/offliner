import GoalProgress from "@/components/GoalProgress";
import TimerCard from "@/components/TimerCard";
import { COLORS } from "shared/theme";
import { useHome } from "@/hooks/useHome";
import { indexStyles } from "@/styles/custom.styles";
import { globalStyles } from "@/styles/global.styles";
import { ScrollView, Text, View } from "react-native";
import { Button } from "react-native-paper";
import { Link } from "expo-router";
import { formatDuration } from "shared/utils/formatDuration";

export default function Home() {
  const {
    isOnline,
    since,
    elapsed,
    nextGoal,
    isLoading,
    sendPeriods,
    session,
    totalUnsync,
    totalSyncSeconds,
    deviceName,
  } = useHome();

  return (
    <ScrollView
      contentContainerStyle={globalStyles.container}
      showsVerticalScrollIndicator
    >
      <View style={globalStyles.card}>
        <Text
          style={[
            indexStyles.statusText,
            isOnline ? indexStyles.onlineText : indexStyles.offlineText,
          ]}
        >
          {isOnline === null
            ? "Chargement..."
            : isOnline
            ? `Appareil ${deviceName} connecté à internet`
            : `Appareil ${deviceName} hors ligne`}
        </Text>

        {!isOnline && since && (
          <Text style={indexStyles.timer}>Depuis {elapsed}</Text>
        )}
        {isOnline ? (
          <Text style={[indexStyles.message, { color: COLORS.warning }]}>
            Coupe ta connexion pour commencer une session focus.
          </Text>
        ) : (
          <Text style={indexStyles.message}>
            Bien joué ! Profite de ta déconnexion pour te recentrer.
          </Text>
        )}
      </View>

      <TimerCard />

      <View style={globalStyles.card}>
        <Text style={globalStyles.cardTitle}>Objectif en cours</Text>
        {nextGoal && (
          <Link href={"/goals"}>
            <GoalProgress
              goal={nextGoal}
              totalSeconds={totalSyncSeconds + totalUnsync}
              bgColor={COLORS.subCard}
            />
          </Link>
        )}
      </View>

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
            : "Vous devez avoir un compte pour synchroniser le temps hors ligne"}
        </Text>

        {session ? (
          <Button
            mode="contained"
            onPress={sendPeriods}
            disabled={!isOnline || totalUnsync === 0 || isLoading}
            buttonColor={COLORS.secondary}
            style={globalStyles.button}
          >
            Synchroniser
          </Button>
        ) : (
          <Link href={"/profile"} asChild>
            <Button
              mode="contained"
              buttonColor={COLORS.secondary}
              style={globalStyles.button}
            >
              Accéder au profile
            </Button>
          </Link>
        )}
      </View>
    </ScrollView>
  );
}
