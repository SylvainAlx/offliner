import UseMining from "@/hooks/useMining";
import { globalStyles } from "@/styles/global.styles";
import { ActivityIndicator, ScrollView, Text } from "react-native";

export default function MiningScreen() {
  const { miningCapacity } = UseMining();
  return (
    <ScrollView
      contentContainerStyle={globalStyles.container}
      showsVerticalScrollIndicator
    >
      <Text style={globalStyles.title}>Minage de gemmes du temps</Text>
      <Text style={globalStyles.cardTitle}>Fonctionnalité à venir</Text>
      {miningCapacity === null ? (
        <ActivityIndicator />
      ) : (
        <Text style={globalStyles.contentText}>
          Capacité de la mine : {miningCapacity} gemmes du temps
        </Text>
      )}

      <Text style={globalStyles.contentText}>
        Une gemme du temps peut-être minée pendant une période hors‑ligne de 1h.
      </Text>
    </ScrollView>
  );
}
