import * as IntentLauncher from "expo-intent-launcher";
import { Text,View } from "react-native";

import useAnimatedColor from "@/hooks/useAnimatedColor";
import { indexStyles } from "@/styles/custom.styles";
import { globalStyles } from "@/styles/global.styles";

import DigitDisplay from "../ui/DigitDisplay";
import ModernButton from "../ui/ModernButton";

interface HeaderCardProps {
  isOnline: boolean;
}

export default function HeaderCard({ isOnline }: HeaderCardProps) {
  const { animatedColor, isStarting } = useAnimatedColor();
  const openNetworkSettings = () => {
    IntentLauncher.startActivityAsync(
      IntentLauncher.ActivityAction.WIRELESS_SETTINGS,
    );
  };

  return (
    <View style={globalStyles.card}>
      {isOnline && (
        <Text style={[indexStyles.statusText, indexStyles.onlineText]}>
          Couper le wifi et les données mobiles pour commencer un enregistrement
        </Text>
      )}
      <DigitDisplay
        digit={
          isOnline ? "En ligne" : isStarting ? "Démarrage" : "Enregistrement"
        }
        color={animatedColor}
        label="Status"
      />
      {isOnline ? (
        <ModernButton
          variant="secondary"
          onPress={openNetworkSettings}
          icon="wifi-off"
        >
          Couper internet
        </ModernButton>
      ) : (
        <ModernButton
          variant="secondary"
          onPress={openNetworkSettings}
          icon="wifi"
        >
          Réactiver internet
        </ModernButton>
      )}
    </View>
  );
}
