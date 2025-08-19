import { COLORS, SIZES } from "shared/theme";
import { StyleSheet } from "react-native";

export const indexStyles = StyleSheet.create({
  statusText: {
    fontSize: SIZES.text_lg,
    fontWeight: "bold",
    textAlign: "center",
    fontFamily: "Montserrat",
  },
  timer: {
    fontSize: SIZES.text_lg,
    color: COLORS.text,
    textAlign: "center",
    fontFamily: "Montserrat",
  },
  message: {
    fontSize: SIZES.text_lg,
    color: COLORS.text,
    textAlign: "center",
    fontFamily: "Montserrat",
  },
  totalLabel: {
    fontSize: SIZES.text_md,
    color: COLORS.text,
    textAlign: "center",
    fontFamily: "Montserrat",
  },
  totalValue: {
    fontSize: SIZES.text_md,
    fontWeight: "bold",
    color: COLORS.secondary,
    textAlign: "center",
    fontFamily: "Montserrat",
  },
  onlineText: {
    color: COLORS.text,
    fontFamily: "Montserrat",
  },
  offlineText: {
    color: COLORS.succes,
    fontFamily: "Montserrat",
  },
});

export const accountStyles = StyleSheet.create({
  label: {
    color: COLORS.text,
    fontSize: SIZES.text_lg,
    fontWeight: "bold",
    marginLeft: SIZES.margin,
    fontFamily: "Montserrat",
  },
});

export const headerStyles = StyleSheet.create({
  headerTitle: {
    fontSize: 30,
    color: COLORS.primary,
    fontFamily: "Knewave",
  },
  version: {
    position: "absolute",
    top: 37,
    fontSize: 12,
    color: COLORS.primary,
    textAlign: "center",
    alignSelf: "flex-end",
    fontStyle: "italic",
    fontFamily: "Montserrat",
  },
});

export const goalProgressStyles = StyleSheet.create({
  percentText: {
    marginTop: SIZES.margin,
    fontSize: SIZES.text_lg,
    color: COLORS.text,
    fontFamily: "Montserrat",
  },
  achievedText: {
    marginTop: SIZES.margin,
    fontSize: SIZES.text_lg,
    fontWeight: "600",
    color: COLORS.succes,
    fontFamily: "Montserrat",
  },
});
