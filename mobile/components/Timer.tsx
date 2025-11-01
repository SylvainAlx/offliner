import { useEffect, useRef, useState } from "react";
import { Animated, View, Text } from "react-native";
import { COLORS, SIZES } from "shared/theme";
import { formatDuration } from "shared/utils/formatDuration";

interface TimerProps {
  label: string;
  duration: number;
  isStarting: boolean;
  isOnline: boolean;
}

export default function Timer({
  label,
  duration,
  isStarting,
  isOnline,
}: TimerProps) {
  // Animation de couleur
  const colorAnim = useRef(new Animated.Value(0)).current;
  const [prevColor, setPrevColor] = useState(COLORS.succes);

  // Déterminer la couleur cible
  const targetColor = isStarting
    ? COLORS.warning
    : isOnline
    ? COLORS.accent
    : COLORS.succes;

  // Lancer l’animation quand la couleur change
  useEffect(() => {
    colorAnim.setValue(0); // reset
    Animated.timing(colorAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: false, // ⚠️ pas de "true" car la couleur n’est pas supportée en driver natif
    }).start(() => {
      setPrevColor(targetColor);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetColor]);

  // Interpolation entre l’ancienne et la nouvelle couleur
  const animatedColor = colorAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [prevColor, targetColor],
  });

  return (
    <View
      style={{
        width: "100%",
        display: "flex",
        flexDirection: "row-reverse",
        backgroundColor: COLORS.background,
        padding: SIZES.padding,
        borderRadius: SIZES.radius,
      }}
    >
      <Text
        style={{
          position: "absolute",
          paddingLeft: 5,
          paddingTop: 2,
          left: 0,
          fontFamily: "Doto",
          fontSize: SIZES.text_md,
          color: COLORS.secondary,
        }}
      >
        {label}
      </Text>
      <Animated.Text
        style={{
          fontSize: SIZES.text_3xl,
          fontFamily: "Doto",
          color: animatedColor,
        }}
      >
        {formatDuration(duration)}
      </Animated.Text>
    </View>
  );
}
