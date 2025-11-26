import TimerCard from "@/components/TimerCard";
import { useHome } from "@/hooks/useHome";
import { globalStyles } from "@/styles/global.styles";
import { ScrollView } from "react-native";
import GoalCard from "@/components/GoalCard";
import PowerSavingCard from "@/components/PowerSavingCard";
import HeaderCard from "@/components/HeaderCard";
import DailyGoalCard from "@/components/DailyGoalCard";
import { useSession } from "@/contexts/SessionContext";

export default function Home() {
  const {
    isOnline,
    nextGoal,
    isLoading,
    sendPeriods,
    unsyncStats,
    totalSyncSeconds,
  } = useHome();
  const { dailyGoalSeconds, dailySyncSeconds } = useSession();

  const currentDailySeconds = dailySyncSeconds + unsyncStats.daily;

  return (
    <ScrollView
      contentContainerStyle={globalStyles.container}
      showsVerticalScrollIndicator
    >
      <HeaderCard isOnline={isOnline} />
      <TimerCard
        isOnline={isOnline}
        isLoading={isLoading}
        totalSyncSeconds={totalSyncSeconds}
        unsyncStats={unsyncStats}
        sendPeriods={sendPeriods}
      />
      <PowerSavingCard totalSeconds={totalSyncSeconds + unsyncStats.total} />
      {dailyGoalSeconds !== null && (
        <DailyGoalCard
          goalSeconds={dailyGoalSeconds}
          currentSeconds={currentDailySeconds}
        />
      )}
      {nextGoal && (
        <GoalCard
          nextGoal={nextGoal}
          totalSyncSeconds={totalSyncSeconds}
          totalUnsync={unsyncStats.total}
        />
      )}
    </ScrollView>
  );
}
