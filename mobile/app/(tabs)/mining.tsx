import { View, Text } from "react-native";
import { globalStyles } from "@/styles/global.styles";
import MiningCard from "@/components/MiningCard";

export default function MiningScreen() {
  return (
    <View style={globalStyles.container}>
      <Text style={globalStyles.title}>Gemmes de temps</Text>
      <MiningCard />
    </View>
  );
}
