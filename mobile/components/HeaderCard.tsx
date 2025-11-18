import { indexStyles } from "@/styles/custom.styles";
import { globalStyles } from "@/styles/global.styles";
import { View, Text } from "react-native";
import * as IntentLauncher from "expo-intent-launcher";
import { Button } from "react-native-paper";
import { COLORS } from "shared/theme";

interface HeaderCardProps {
  isOnline: boolean;
  since: Date | null;
  elapsed: string;
}

export default function HeaderCard({
  isOnline,
  since,
  elapsed,
}: HeaderCardProps) {
  const openNetworkSettings = () => {
    IntentLauncher.startActivityAsync(
      IntentLauncher.ActivityAction.WIRELESS_SETTINGS,
    );
  };

  return (
    <View style={globalStyles.card}>
      <Text
        style={[
          indexStyles.statusText,
          isOnline ? indexStyles.onlineText : indexStyles.offlineText,
        ]}
      >
        {isOnline === null
          ? "Chargement..."
          : isOnline
          ? `Couper le wifi et les données mobiles pour commencer une session focus`
          : `Enregistrement en cours`}
      </Text>

      {!isOnline && since && (
        <Text style={indexStyles.timer}>Depuis {elapsed}</Text>
      )}
      {isOnline ? (
        // <Text style={[indexStyles.message, { color: COLORS.warning }]}>
        //   Coupe ta connexion pour commencer une session focus.
        // </Text>
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
