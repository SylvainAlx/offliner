import { COLORS, SIZES } from "shared/theme";
import { globalStyles } from "@/styles/global.styles";
import { Text, View } from "react-native";
import { Goal } from "shared/goals";
import { formatDuration } from "shared/utils/formatDuration";
import DigitDisplay from "./DigitDisplay";

type Props = {
  goal: Goal;
  totalSeconds: number;
  bgColor?: string;
  isOnline: boolean;
};

export default function GoalProgress({
  goal,
  totalSeconds,
  bgColor,
  isOnline,
}: Props) {
  const isAchieved = totalSeconds >= goal.targetSeconds;
  const percent = Math.min(1, totalSeconds / goal.targetSeconds);

  return (
    <View
      style={[
        globalStyles.card,
        { backgroundColor: bgColor ? bgColor : COLORS.card },
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
        digit={
          isAchieved ? "objectif atteint" : (percent * 100).toFixed(2) + "%"
        }
        label="Progression"
        color={
          isAchieved ? COLORS.succes : isOnline ? COLORS.accent : COLORS.succes
        }
      />
    </View>
  );
}
