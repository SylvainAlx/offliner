import { globalStyles } from "@/styles/global.styles";
import { View, Text } from "react-native";
import DigitDisplay from "./DigitDisplay";
import { getPowerSavingEstimate } from "shared/utils/powerSaving";
import useAnimatedColor from "@/hooks/useAnimatedColor";

interface PowerSavingCardProps {
  totalSeconds: number;
}

export default function PowerSavingCard({
  totalSeconds,
}: PowerSavingCardProps) {
  const { animatedColor } = useAnimatedColor();
  return (
    <View style={globalStyles.card}>
      <Text style={globalStyles.cardTitle}>Énergie économisée</Text>
      <DigitDisplay
        digit={getPowerSavingEstimate(totalSeconds)}
        color={animatedColor}
        label="estimation d'économie d'énergie"
      />
    </View>
  );
}
