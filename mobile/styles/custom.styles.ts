import { COLORS, SIZES } from "shared/theme";
import { StyleSheet } from "react-native";

export const indexStyles = StyleSheet.create({
  statusText: {
    fontSize: SIZES.text_lg,
    fontWeight: "bold",
    textAlign: "center",
  },
  timer: {
    fontSize: SIZES.text_lg,
    color: COLORS.text,
    textAlign: "center",
  },
  message: {
    fontSize: SIZES.text_md,
    color: COLORS.text,
    textAlign: "center",
  },
  totalLabel: {
    fontSize: SIZES.text_md,
    color: COLORS.text,
    textAlign: "center",
  },
  totalValue: {
    fontSize: SIZES.text_md,
    fontWeight: "bold",
    color: COLORS.secondary,
    textAlign: "center",
  },
  onlineText: {
    color: COLORS.text,
  },
  offlineText: {
    color: COLORS.succes,
  },
});

export const accountStyles = StyleSheet.create({
  label: {
    color: COLORS.text,
    fontSize: SIZES.text_lg,
    fontWeight: "bold",
    marginLeft: SIZES.margin,
  },
});

export const headerStyles = StyleSheet.create({
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

export const goalProgressStyles = StyleSheet.create({
  percentText: {
    marginTop: SIZES.margin,
    fontSize: SIZES.text_lg,
    color: COLORS.primary,
  },
  achievedText: {
    marginTop: SIZES.margin,
    fontSize: SIZES.text_lg,
    fontWeight: "600",
    color: COLORS.succes,
  },
});
