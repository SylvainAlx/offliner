import TimerCard from "@/components/TimerCard";
import { useHome } from "@/hooks/useHome";
import { globalStyles } from "@/styles/global.styles";
import { ScrollView } from "react-native";
import MiningCard from "@/components/MiningCard";
import GoalCard from "@/components/GoalCard";
import PowerSavingCard from "@/components/PowerSavingCard";
import HeaderCard from "@/components/HeaderCard";
import CommandCard from "@/components/CommandCard";

export default function Home() {
  const {
    isOnline,
    since,
    elapsed,
    nextGoal,
    isLoading,
    sendPeriods,
    session,
    unsyncStats,
    totalSyncSeconds,
    deviceName,
  } = useHome();

  return (
    <ScrollView
      contentContainerStyle={globalStyles.container}
      showsVerticalScrollIndicator
    >
      <HeaderCard
        isOnline={isOnline}
        deviceName={deviceName}
        since={since}
        elapsed={elapsed}
      />
      <TimerCard
        isOnline={isOnline}
        totalSyncSeconds={totalSyncSeconds}
        unsyncStats={unsyncStats}
      />
      <CommandCard
        isLoading={isLoading}
        isOnline={isOnline}
        sendPeriods={sendPeriods}
        session={session}
        unsyncStats={unsyncStats}
      />
      {session && <MiningCard isOnline={isOnline} />}

      <PowerSavingCard totalSeconds={totalSyncSeconds + unsyncStats.total} />
      <GoalCard
        nextGoal={nextGoal}
        totalSyncSeconds={totalSyncSeconds}
        totalUnsync={unsyncStats.total}
      />
    </ScrollView>
  );
}
