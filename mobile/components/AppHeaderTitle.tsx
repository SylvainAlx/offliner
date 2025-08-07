import { LABELS } from "@/constants/Labels";
import { headerStyles } from "@/styles/custom.styles";
import { Text, View } from "react-native";

export function AppHeaderTitle() {
  return (
    <View>
      <Text style={headerStyles.headerTitle}>{LABELS.APP_TITLE}</Text>
      <Text style={headerStyles.version}>v {LABELS.APP_VERSION}</Text>
    </View>
  );
}
