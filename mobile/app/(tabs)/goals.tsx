import GoalProgress from "@/components/GoalProgress";
import { GOALS } from "shared/goals";
import { SIZES } from "shared/theme";
import { useOfflineTimer } from "@/hooks/useOfflineTimer";
import { useSession } from "@/contexts/SessionContext";
import { globalStyles } from "@/styles/global.styles";
import { FlatList, Text, View } from "react-native";
import DailyGoalSettings from "@/components/DailyGoalSettings";

export default function GoalsScreen() {
  const { appUser } = useSession();
  const { totalSyncSeconds } = appUser;
  const liveStats = useOfflineTimer();

  return (
    <FlatList
      data={GOALS}
      keyExtractor={(item) => item.id}
      style={globalStyles.container}
      contentContainerStyle={{
        gap: SIZES.margin,
      }}
      showsVerticalScrollIndicator
      ListHeaderComponent={
        <>
          <Text style={globalStyles.title}>Objectifs hors ligne</Text>
          <View style={[globalStyles.card, { marginBottom: SIZES.margin }]}>
            <Text style={globalStyles.cardTitle}>Objectif quotidien</Text>
            <DailyGoalSettings />
          </View>
          <Text style={globalStyles.title}>Objectifs communs</Text>
        </>
      }
      renderItem={({ item }) => (
        <GoalProgress
          goal={item}
          totalSeconds={totalSyncSeconds + liveStats.total}
        />
      )}
    />
  );
}
