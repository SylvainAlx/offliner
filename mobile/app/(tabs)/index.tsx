import { ScrollView } from "react-native";

import DailyGoalCard from "@/components/sections/DailyGoalCard";
import GoalCard from "@/components/sections/GoalCard";
import HeaderCard from "@/components/sections/HeaderCard";
import PowerSavingCard from "@/components/sections/PowerSavingCard";
import TimerCard from "@/components/sections/TimerCard";
import { useSession } from "@/contexts/SessionContext";
import { useHome } from "@/hooks/useHome";
import { globalStyles } from "@/styles/global.styles";

export default function Home() {
  const {
    isOnline,
    nextGoal,
    isLoading,
    sendPeriods,
    unsyncStats,
    totalSyncSeconds,
  } = useHome();
  const { appUser } = useSession();
  const { dailyGoalSeconds, dailySyncSeconds } = appUser;

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
