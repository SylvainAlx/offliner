import { globalStyles } from "@/styles/global.styles";
import { View, Text } from "react-native";
import { COLORS, SIZES } from "shared/theme";
import { formatDuration } from "shared/utils/formatDuration";
import DigitDisplay from "../ui/DigitDisplay";
import { Link } from "expo-router";
import useAnimatedColor from "@/hooks/useAnimatedColor";

interface DailyGoalCardProps {
  goalSeconds: number;
  currentSeconds: number;
}

export default function DailyGoalCard({
  goalSeconds,
  currentSeconds,
}: DailyGoalCardProps) {
  const isAchieved = currentSeconds >= goalSeconds;
  const percent = Math.min(1, currentSeconds / goalSeconds);
  const remaining = Math.max(0, goalSeconds - currentSeconds);
  const { animatedColor } = useAnimatedColor();

  return (
    <View style={globalStyles.card}>
      <Text style={globalStyles.cardTitle}>Objectif quotidien</Text>
      <Link href={"/goals"}>
        <View
          style={[
            globalStyles.card,
            { backgroundColor: COLORS.subCard, width: "100%" },
          ]}
        >
          <DigitDisplay
            digit={formatDuration(goalSeconds)}
            label="Objectif"
            color={COLORS.accent}
          />
          <DigitDisplay
            digit={isAchieved ? "100%" : (percent * 100).toFixed(0) + "%"}
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
          {isAchieved && (
            <Text
              style={{
                color: COLORS.succes,
                paddingHorizontal: SIZES.padding,
                textAlign: "center",
                fontWeight: "bold",
              }}
            >
              🎉 Objectif atteint !
            </Text>
          )}
        </View>
      </Link>
    </View>
  );
}
