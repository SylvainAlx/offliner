import { ScrollView, Text } from "react-native";

import { globalStyles } from "@/styles/global.styles";

export default function StoreScreen() {
  return (
    <ScrollView
      contentContainerStyle={globalStyles.container}
      showsVerticalScrollIndicator
    >
      <Text style={globalStyles.title}>Magasin</Text>
      <Text style={globalStyles.contentText}>
        Le magasin est actuellement en cours de développement.
      </Text>
    </ScrollView>
  );
}
