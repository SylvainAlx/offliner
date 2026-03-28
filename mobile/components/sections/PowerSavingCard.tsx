import { Link } from "expo-router";
import { Text,View } from "react-native";
import { COLORS } from "shared/theme";
import { getPowerSavingEstimate } from "shared/utils/powerSaving";

import useAnimatedColor from "@/hooks/useAnimatedColor";
import { globalStyles } from "@/styles/global.styles";

import DigitDisplay from "../ui/DigitDisplay";
import { IconSymbol } from "../ui/IconSymbol";

interface PowerSavingCardProps {
  totalSeconds: number;
}

export default function PowerSavingCard({
  totalSeconds,
}: PowerSavingCardProps) {
  const { animatedColor } = useAnimatedColor();
  return (
    <View style={globalStyles.card}>
      <Text style={globalStyles.cardTitle}>
        Énergie économisée{" "}
        <Link href={"../help"} style={globalStyles.link}>
          <IconSymbol
            name="questionmark.circle"
            size={15}
            color={COLORS.accent}
          />
        </Link>
      </Text>
      <DigitDisplay
        digit={getPowerSavingEstimate(totalSeconds)}
        color={animatedColor}
        label="Estimation d'économie d'énergie"
      />
    </View>
  );
}
