import { Link } from "expo-router";
import { Text,View } from "react-native";
import { Goal } from "shared/goals";
import { COLORS } from "shared/theme";

import { globalStyles } from "@/styles/global.styles";

import GoalProgress from "../GoalProgress";

interface GoalCardProps {
  nextGoal: Goal;
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
      <Link href={"/goals"}>
        <GoalProgress
          goal={nextGoal}
          totalSeconds={totalSyncSeconds + totalUnsync}
          bgColor={COLORS.subCard}
        />
      </Link>
    </View>
  );
}
