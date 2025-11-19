import { indexStyles } from "@/styles/custom.styles";
import { globalStyles } from "@/styles/global.styles";
import { View, Text } from "react-native";
import * as IntentLauncher from "expo-intent-launcher";
import { Button } from "react-native-paper";
import { COLORS } from "shared/theme";
import DigitDisplay from "./DigitDisplay";

interface HeaderCardProps {
  isOnline: boolean;
}

export default function HeaderCard({ isOnline }: HeaderCardProps) {
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
        digit={isOnline ? "En ligne" : "Enregistrement"}
        color={isOnline ? COLORS.accent : COLORS.record}
        label="Status"
      />
      {isOnline ? (
        <Button
          mode="contained"
          onPress={openNetworkSettings}
          style={globalStyles.button}
          buttonColor={COLORS.secondary}
        >
          Couper internet
        </Button>
      ) : (
        <Button
          mode="contained"
          onPress={openNetworkSettings}
          style={globalStyles.button}
          buttonColor={COLORS.secondary}
        >
          Réactiver internet
        </Button>
      )}
    </View>
  );
}
