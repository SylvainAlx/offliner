import { COLORS, SIZES } from "shared/theme";
import { useOfflineProgress } from "@/contexts/OfflineProgressContext";
import { useSession } from "@/contexts/SessionContext";
import { indexStyles } from "@/styles/custom.styles";
import { globalStyles } from "@/styles/global.styles";
import { formatDuration } from "shared/utils/formatDuration";
import { Text, View, Animated } from "react-native";
import { useEffect, useState, useRef } from "react";
import { config } from "@/config/env";

export default function TimerCard() {
  const { totalUnsync, isOnline } = useOfflineProgress();
  const { totalSyncSeconds } = useSession();
  const [isStarting, setIsStarting] = useState(false);

  const totalAll = totalSyncSeconds + totalUnsync;

  // Animation de couleur
  const colorAnim = useRef(new Animated.Value(0)).current;
  const [prevColor, setPrevColor] = useState(COLORS.succes);

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
      }, config.startupDelayMs);
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

  return (
    <View style={globalStyles.card}>
      <Text style={globalStyles.cardTitle}>Temps passé hors ligne</Text>

      <View>
        <Animated.Text
          style={{
            fontSize: SIZES.text_3xl,
            fontFamily: "Knewave",
            color: animatedColor,
          }}
        >
          {formatDuration(totalAll)}
        </Animated.Text>
      </View>

      <View
        style={{
          flexDirection: "row",
          gap: SIZES.margin,
          alignItems: "center",
          justifyContent: "space-around",
          flexWrap: "wrap",
        }}
      >
        <View>
          <Text style={indexStyles.totalLabel}>Synchronisé :</Text>
          <Text style={indexStyles.totalValue}>
            {formatDuration(totalSyncSeconds)}
          </Text>
        </View>

        <View>
          <Text style={indexStyles.totalLabel}>Non synchronisé :</Text>
          <Text style={indexStyles.totalValue}>
            {formatDuration(totalUnsync)}
          </Text>
        </View>
      </View>
    </View>
  );
}
