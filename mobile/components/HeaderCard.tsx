import { indexStyles } from "@/styles/custom.styles";
import { globalStyles } from "@/styles/global.styles";
import { View, Text } from "react-native";
import { COLORS } from "shared/theme";

interface HeaderCardProps {
  isOnline: boolean;
  deviceName: string;
  since: Date | null;
  elapsed: string;
}

export default function HeaderCard({
  isOnline,
  deviceName,
  since,
  elapsed,
}: HeaderCardProps) {
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
          ? `Appareil ${deviceName} connecté à internet`
          : `Appareil ${deviceName} hors ligne`}
      </Text>

      {!isOnline && since && (
        <Text style={indexStyles.timer}>Depuis {elapsed}</Text>
      )}
      {isOnline ? (
        <Text style={[indexStyles.message, { color: COLORS.warning }]}>
          Coupe ta connexion pour commencer une session focus.
        </Text>
      ) : (
        <Text style={indexStyles.message}>
          Bien joué ! Profite de ta déconnexion pour te recentrer.
        </Text>
      )}
    </View>
  );
}
