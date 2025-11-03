import { config } from "@/config/env";
import { useOfflineProgress } from "@/contexts/OfflineProgressContext";
import { useEffect, useRef, useState } from "react";
import { Animated } from "react-native";
import { COLORS } from "shared/theme";

export default function useAnimatedColor() {
  // Animation de couleur
  const colorAnim = useRef(new Animated.Value(0)).current;
  const [prevColor, setPrevColor] = useState(COLORS.succes);
  const [isStarting, setIsStarting] = useState(false);
  const { isOnline } = useOfflineProgress();

  // Déterminer la couleur cible
  const targetColor = isStarting
    ? COLORS.warning
    : isOnline
    ? COLORS.accent
    : COLORS.succes;

  // Gérer le "mode démarrage" si offline
  useEffect(() => {
    if (!isOnline) {
      setIsStarting(true);
      setTimeout(() => {
        setIsStarting(false);
      }, config.minimumDurationMs);
    } else {
      setIsStarting(false);
    }
  }, [isOnline]);

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

  return { animatedColor };
}
