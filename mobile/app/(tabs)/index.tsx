import GoalProgress from "@/components/GoalProgress";
import TimerCard from "@/components/TimerCard";
import { COLORS } from "shared/theme";
import { useHome } from "@/hooks/useHome";
import { indexStyles } from "@/styles/custom.styles";
import { globalStyles } from "@/styles/global.styles";
import { Button } from "@rneui/themed";
import { Link } from "expo-router";
import { ScrollView, Text, View } from "react-native";

export default function Home() {
  const {
    isOnline,
    since,
    elapsed,
    nextGoal,
    isLoading,
    sendPeriods,
    username,
    session,
    totalUnsync,
    totalSyncSeconds,
  } = useHome();

  return (
    <ScrollView
      style={globalStyles.container}
      contentContainerStyle={globalStyles.container}
      showsVerticalScrollIndicator={true}
    >
      <Text style={globalStyles.title}>Bienvenue {username && username} !</Text>
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
            ? "📶 Appareil connecté à internet"
            : "🧘 Appareil hors ligne"}
        </Text>

        {!isOnline && since && (
          <Text style={indexStyles.timer}>⏳ Depuis {elapsed}</Text>
        )}

        <Text style={indexStyles.message}>
          {isOnline
            ? "🌐 Coupe ta connexion pour commencer une session focus."
            : "✨ Bien joué ! Profite de ta déconnexion pour te recentrer."}
        </Text>
      </View>
      <TimerCard />
      <View style={globalStyles.card}>
        <Text style={globalStyles.cardTitle}>🎯 Objectif en cours</Text>
        {nextGoal && (
          <GoalProgress
            goal={nextGoal}
            totalSeconds={totalSyncSeconds + totalUnsync}
            bgColor={COLORS.subCard}
          />
        )}
      </View>

      <View style={globalStyles.card}>
        <Text style={globalStyles.cardTitle}>🔄 Synchronisation</Text>
        <Text style={indexStyles.message}>
          {session
            ? "Compte et appareil liés"
            : "Vous devez avoir un compte pour synchroniser le temps hors ligne"}
        </Text>
        {session ? (
          <Button
            title="Synchroniser"
            color={COLORS.primary}
            disabled={!isOnline || totalUnsync === 0 || isLoading}
            onPress={sendPeriods}
            radius={100}
            style={globalStyles.button}
          />
        ) : (
          <Link href={"/profile"} asChild>
            <Button
              title="Accéder au profile"
              color={COLORS.primary}
              radius={100}
              style={globalStyles.button}
            />
          </Link>
        )}
      </View>
    </ScrollView>
  );
}
