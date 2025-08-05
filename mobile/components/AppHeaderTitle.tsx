import { LABELS } from "@/constants/Labels";
import { COLORS } from "@/constants/Theme";
import { StyleSheet, Text, View } from "react-native";

export function AppHeaderTitle() {
  return (
    <View>
      <Text style={styles.headerTitle}>{LABELS.APP_TITLE}</Text>
      <Text style={styles.version}>v {LABELS.APP_VERSION}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  headerTitle: {
    fontSize: 30,
    color: COLORS.accent,
    fontFamily: "Knewave",
  },
  version: {
    marginTop: -5,
    fontSize: 12,
    color: COLORS.accent,
    textAlign: "center",
    alignSelf: "flex-end",
    fontStyle: "italic",
  },
});
