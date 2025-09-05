import { COLORS, SIZES } from "shared/theme";
import { goalProgressStyles } from "@/styles/custom.styles";
import { globalStyles } from "@/styles/global.styles";
import React from "react";
import { Text, View } from "react-native";
import * as Progress from "react-native-progress";
import { Goal } from "shared/goals";
import { formatDuration } from "shared/utils/formatDuration";

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
      style={[
        globalStyles.card,
        { backgroundColor: bgColor ? bgColor : COLORS.card },
      ]}
    >
      <Text style={globalStyles.cardTitle}>
        {formatDuration(goal.targetSeconds, true)}
      </Text>
      <Text
        style={{
          color: COLORS.accent,
          fontSize: SIZES.text_lg,
          fontFamily: "Knewave",
        }}
      >
        {goal.id}
      </Text>
      <Text
        style={{
          color: COLORS.text,
          paddingHorizontal: SIZES.padding,
          textAlign: "center",
        }}
      >
        {goal.label}
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
          ✅ Objectif atteint !
        </Text>
      )}
    </View>
  );
}
