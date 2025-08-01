import GoalProgress from "@/components/GoalProgress";
import TimerCard from "@/components/TimerCard";
import { GOALS } from "@/constants/Goals";
import { COLORS } from "@/constants/Theme";
import { useOfflineProgress } from "@/contexts/OfflineProgressContext";
import { useSession } from "@/contexts/SessionContext";
import { useSyncSession } from "@/hooks/useSyncSession";
import { globalStyles } from "@/styles/global.styles";
import { indexStyles } from "@/styles/index.styles";
import { formatDuration } from "@/utils/formatDuration";
import { confirmDialog } from "@/utils/formatNotification";
import { getLastOpenPeriod } from "@/utils/getOfflineTime";
import { Button } from "@rneui/themed";
import { Link } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { ScrollView, Text, View } from "react-native";

export default function Home() {
  const [since, setSince] = useState<Date | null>(null);
  const [elapsed, setElapsed] = useState<string>("0s");

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { totalSyncSeconds, session, username } = useSession();
  const { syncMeasures } = useSyncSession(session);
  const { totalUnsync, isOnline } = useOfflineProgress();
  const [nextGoal, setNextGoal] = useState<(typeof GOALS)[0] | undefined>(
    undefined
  );
  const [isLoading, setIsLoading] = useState(false);

  const sendPeriods = async () => {
    if (!session) return;

    const confirmed = await confirmDialog(
      "Es-tu sûr de vouloir synchroniser les périodes non synchronisées ?"
    );

    if (!confirmed) return;
    try {
      setIsLoading(true);
      await syncMeasures();
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const loadStartTime = async () => {
      const now = new Date();
      const startTime = await getLastOpenPeriod(); // Assume this function fetches the start time from storage
      if (startTime) {
        setSince(new Date(startTime));
        const diff = Math.floor(
          (now.getTime() - new Date(startTime).getTime()) / 1000
        );
        setElapsed(formatDuration(diff));
      }
    };
    if (!isOnline) loadStartTime();
  }, [isOnline]);

  useEffect(() => {
    const goal = GOALS.find(
      (goal) => totalSyncSeconds + totalUnsync < goal.targetSeconds
    );
    setNextGoal(goal);
  }, [totalSyncSeconds, totalUnsync]);

  useEffect(() => {
    if (since && !isOnline) {
      intervalRef.current = setInterval(async () => {
        const now = new Date();
        const diff = Math.floor((now.getTime() - since.getTime()) / 1000);
        setElapsed(formatDuration(diff));
      }, 1000);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isOnline, since]);

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
