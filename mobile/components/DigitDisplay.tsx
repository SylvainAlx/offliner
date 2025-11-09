import { View, Text, Animated } from "react-native";
import { COLORS, SIZES } from "shared/theme";

interface DigitDisplayProps {
  digit: string;
  color: Animated.AnimatedInterpolation<string | number> | string;
  label: string;
}

export default function DigitDisplay({
  digit,
  color,
  label,
}: DigitDisplayProps) {
  return (
    <View
      style={{
        width: "100%",
        display: "flex",
        flexDirection: "row-reverse",
        backgroundColor: COLORS.background,
        padding: SIZES.padding,
      }}
    >
      <Text
        style={{
          position: "absolute",
          paddingLeft: 5,
          paddingTop: 0.3,
          left: 0,
          fontSize: SIZES.text_md,
          color: COLORS.secondary,
        }}
      >
        {label}
      </Text>
      <Animated.Text
        style={{
          fontSize: SIZES.text_lg * 1.2,
          fontFamily: "Doto",
          color: color,
        }}
      >
        {digit}
      </Animated.Text>
    </View>
  );
}
