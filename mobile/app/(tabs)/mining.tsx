import { View, Text } from "react-native";
import { globalStyles } from "@/styles/global.styles";
import MiningCard from "@/components/sections/MiningCard";
import ModernButton from "@/components/ui/ModernButton";
import { router } from "expo-router";

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
