import { IconSymbol } from "@/components/ui/IconSymbol";
import UseMining from "@/hooks/useMining";
import { globalStyles } from "@/styles/global.styles";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";
import { COLORS, SIZES } from "shared/theme";
import { formatDuration } from "shared/utils/formatDuration";

export default function MiningScreen() {
  const { miningCapacity, dailySyncSeconds } = UseMining();
  return (
    <ScrollView
      contentContainerStyle={globalStyles.container}
      showsVerticalScrollIndicator
    >
      <Text style={globalStyles.title}>Minage de gemmes du temps</Text>
      <Text style={globalStyles.cardTitle}>Fonctionnalité à venir</Text>
      <Text style={globalStyles.contentText}>
        Une gemme du temps peut-être minée pendant une période hors‑ligne de 1h.
      </Text>
      <View style={globalStyles.card}>
        {miningCapacity === null ? (
          <ActivityIndicator />
        ) : (
          <>
            <Text style={globalStyles.cardTitle}>Capacité de la mine</Text>
            <Text
              style={{
                fontSize: SIZES.text_lg,
                color: COLORS.primary,
                fontFamily: "Montserrat",
                fontWeight: "bold",
              }}
            >
              {miningCapacity}{" "}
              <IconSymbol name="diamond" color={COLORS.primary} size={15} />
            </Text>
          </>
        )}
      </View>
      <View style={globalStyles.card}>
        {dailySyncSeconds === null ? (
          <ActivityIndicator />
        ) : (
          <>
            <Text style={globalStyles.cardTitle}>Progression</Text>
            <Text
              style={{
                fontSize: SIZES.text_lg,
                color: COLORS.primary,
                fontFamily: "Montserrat",
                fontWeight: "bold",
              }}
            >
              {formatDuration(dailySyncSeconds)}
            </Text>
          </>
        )}
      </View>
    </ScrollView>
  );
}
