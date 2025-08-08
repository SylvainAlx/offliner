import { COLORS, SIZES } from "shared/theme";
import { Platform, StyleSheet } from "react-native";

export const globalStyles = StyleSheet.create({
  container: {
    flex: 1,
    padding: SIZES.padding,
    flexGrow: 1, // important pour ScrollView
    backgroundColor: COLORS.background,
    display: "flex",
    flexDirection: "column",
    gap: SIZES.margin * 2,
  },
  title: {
    marginBottom: SIZES.margin,
    color: COLORS.secondary,
    fontSize: SIZES.text_xl,
    fontWeight: "bold",
    textAlign: "center",
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: SIZES.borderRadius,
    padding: SIZES.padding,
    display: "flex",
    flexDirection: "column",
    gap: SIZES.margin,
    alignItems: "center",
    ...Platform.select({
      ios: {
        boxShadow: "0px 2px 3.84px rgba(0,0,0,0.25)",
      },
      android: {
        elevation: 5,
      },
      web: {
        boxShadow: "0px 2px 3.84px rgba(0,0,0,0.25)",
      },
    }),
  },
  cardTitle: {
    fontSize: SIZES.text_lg,
    color: COLORS.text,
    fontWeight: "bold",
    textAlign: "center",
  },
  contentText: {
    fontSize: SIZES.text_lg,
    color: COLORS.text,
  },
  link: {
    paddingVertical: SIZES.padding / 2,
  },
  verticallySpaced: {
    paddingTop: 4,
    paddingBottom: 4,
    alignSelf: "stretch",
  },
  buttonContainer: {
    marginTop: SIZES.margin,
    marginBottom: SIZES.margin,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SIZES.margin,
  },
  button: {
    paddingVertical: SIZES.padding / 2,
    paddingHorizontal: SIZES.padding,
    alignItems: "center",
  },
  input: {
    borderWidth: 2,
    borderColor: COLORS.primary,
    color: COLORS.text,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: COLORS.tabs,
  },
});
