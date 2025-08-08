import { headerStyles } from "@/styles/custom.styles";
import { Text, View } from "react-native";
import { PROJECT } from "shared/config";

export function AppHeaderTitle() {
  return (
    <View>
      <Text style={headerStyles.headerTitle}>{PROJECT.TITLE}</Text>
      <Text style={headerStyles.version}>v {PROJECT.VERSION}</Text>
    </View>
  );
}
