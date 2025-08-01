import { COLORS, SIZES } from "@/constants/Theme";
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
