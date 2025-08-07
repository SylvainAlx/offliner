import { Goal } from "@/constants/Goals";
import { COLORS } from "@/constants/Theme";
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
        <>
          <Progress.Bar
            progress={percent}
            // width={null}
            color={COLORS.primary}
            height={12}
            borderRadius={10}
            // borderColor={COLORS.border}
            // borderWidth={2}
          />
          <Text style={goalProgressStyles.percentText}>
            {(percent * 100).toFixed(0)}% complété
          </Text>
        </>
      )}

      {isAchieved && (
        <Text style={goalProgressStyles.achievedText}>
          🎉 Objectif atteint !
        </Text>
      )}
    </View>
  );
}
