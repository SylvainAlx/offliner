import { globalStyles } from "@/styles/global.styles";
import { View, Text } from "react-native";
import GoalProgress from "./GoalProgress";
import { Link } from "expo-router";
import { Goal } from "shared/goals";
import { COLORS } from "shared/theme";

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
  return (
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
  );
}
