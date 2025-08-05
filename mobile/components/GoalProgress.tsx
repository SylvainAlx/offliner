import { Goal } from "@/constants/Goals";
import { COLORS, SIZES } from "@/constants/Theme";
import { globalStyles } from "@/styles/global.styles";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import * as Progress from "react-native-progress";

type Props = {
  goal: Goal;
  totalSeconds: number;
};

export default function GoalProgress({ goal, totalSeconds }: Props) {
  const isAchieved = totalSeconds >= goal.targetSeconds;
  const percent = Math.min(1, totalSeconds / goal.targetSeconds);

  return (
    <View style={globalStyles.card}>
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
          <Text style={styles.percentText}>
            {(percent * 100).toFixed(0)}% complété
          </Text>
        </>
      )}

      {isAchieved && (
        <Text style={styles.achievedText}>🎉 Objectif atteint !</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  percentText: {
    marginTop: SIZES.margin,
    fontSize: SIZES.text_lg,
    color: COLORS.primary,
  },
  achievedText: {
    marginTop: SIZES.margin,
    fontSize: SIZES.text_lg,
    fontWeight: "600",
    color: COLORS.succes,
  },
});
