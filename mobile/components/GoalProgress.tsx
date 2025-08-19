import { Goal } from "@/constants/Goals";
import { COLORS } from "shared/theme";
import { goalProgressStyles } from "@/styles/custom.styles";
import { globalStyles } from "@/styles/global.styles";
import React from "react";
import { Text, View } from "react-native";
import * as Progress from "react-native-progress";

type Props = {
  goal: Goal;
  totalSeconds: number;
  bgColor?: string;
};

export default function GoalProgress({ goal, totalSeconds, bgColor }: Props) {
  const isAchieved = totalSeconds >= goal.targetSeconds;
  const percent = Math.min(1, totalSeconds / goal.targetSeconds);

  return (
    <View
      style={[globalStyles.card, { backgroundColor: bgColor || COLORS.card }]}
    >
      <Text style={globalStyles.cardTitle}>
        {goal.label} {isAchieved ? "✅" : ""}
      </Text>

      {!isAchieved && (
        <View
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <Progress.Bar
            progress={percent}
            // width={null}
            color={COLORS.primary}
            height={12}
            borderRadius={10}
          />
          <Text style={goalProgressStyles.percentText}>
            {(percent * 100).toFixed(2)}% complété
          </Text>
        </View>
      )}

      {isAchieved && (
        <Text style={goalProgressStyles.achievedText}>
          🎉 Objectif atteint !
        </Text>
      )}
    </View>
  );
}
