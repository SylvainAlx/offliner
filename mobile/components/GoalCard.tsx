import { globalStyles } from "@/styles/global.styles";
import { View, Text } from "react-native";
import GoalProgress from "./GoalProgress";
import { Link } from "expo-router";
import { Goal } from "shared/goals";
import { COLORS } from "shared/theme";
import { useOfflineProgress } from "@/contexts/OfflineProgressContext";

interface GoalCardProps {
  nextGoal: Goal | undefined;
  totalSyncSeconds: number;
  totalUnsync: number;
}

export default function GoalCard({
  nextGoal,
  totalSyncSeconds,
  totalUnsync,
}: GoalCardProps) {
  const { isOnline } = useOfflineProgress();
  return (
    <View style={globalStyles.card}>
      <Text style={globalStyles.cardTitle}>Objectif en cours</Text>
      {nextGoal && (
        <Link href={"/goals"}>
          <GoalProgress
            isOnline={isOnline}
            goal={nextGoal}
            totalSeconds={totalSyncSeconds + totalUnsync}
            bgColor={COLORS.subCard}
          />
        </Link>
      )}
    </View>
  );
}
