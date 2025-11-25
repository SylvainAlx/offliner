import { COLORS, SIZES } from "shared/theme";
import { globalStyles } from "@/styles/global.styles";
import { Text, View } from "react-native";
import { Goal } from "shared/goals";
import { formatDuration } from "shared/utils/formatDuration";
import DigitDisplay from "./DigitDisplay";
import useAnimatedColor from "@/hooks/useAnimatedColor";
import { showMessage } from "@/utils/formatNotification";
import { useState } from "react";

type Props = {
  goal: Goal;
  totalSeconds: number;
  bgColor?: string;
};

export default function GoalProgress({ goal, totalSeconds, bgColor }: Props) {
  const isAchieved = totalSeconds >= goal.targetSeconds;
  const percent = Math.min(1, totalSeconds / goal.targetSeconds);
  const remaining = Math.max(0, goal.targetSeconds - totalSeconds);
  const { animatedColor } = useAnimatedColor();

  return (
    <View
      style={[
        globalStyles.card,
        { backgroundColor: bgColor ? bgColor : COLORS.card, width: "100%" },
      ]}
    >
      <Text style={globalStyles.cardTitle}>{goal.id}</Text>
      <Text
        style={{
          color: COLORS.text,
          paddingHorizontal: SIZES.padding,
          textAlign: "center",
        }}
      >
        {goal.label}
      </Text>
      <DigitDisplay
        digit={formatDuration(goal.targetSeconds)}
        label="Objectif"
        color={COLORS.accent}
      />
      <DigitDisplay
        digit={isAchieved ? "100%" : (percent * 100).toFixed(2) + "%"}
        label="Progression"
        color={isAchieved ? COLORS.succes : animatedColor}
      />
      {!isAchieved && (
        <DigitDisplay
          digit={formatDuration(remaining)}
          label="Restant"
          color={animatedColor}
        />
      )}
    </View>
  );
}
