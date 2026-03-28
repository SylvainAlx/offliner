import { router } from "expo-router";
import { Text,View } from "react-native";

import MiningCard from "@/components/sections/MiningCard";
import ModernButton from "@/components/ui/ModernButton";
import { globalStyles } from "@/styles/global.styles";

export default function MiningScreen() {
  return (
    <View style={globalStyles.container}>
      <Text style={globalStyles.title}>Gemmes de temps</Text>
      <MiningCard />
      <ModernButton
        variant="secondary"
        onPress={() => router.push("/store")}
        icon="cart"
      >
        Dépenser des gemmes
      </ModernButton>
    </View>
  );
}
