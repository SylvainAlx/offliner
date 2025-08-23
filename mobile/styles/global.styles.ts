import { COLORS, SIZES } from "shared/theme";
import { StyleSheet } from "react-native";

export const globalStyles = StyleSheet.create({
  container: {
    flex: 1,
    paddingVertical: SIZES.padding,
    paddingHorizontal: SIZES.padding * 4,
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
    fontFamily: "Montserrat",
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: SIZES.borderRadius / 2,
    padding: SIZES.padding,
    flexDirection: "column",
    alignItems: "center",
    gap: SIZES.margin / 2,
    borderWidth: SIZES.borderWidth,
    borderColor: COLORS.border, // bordure légère
    // ...Platform.select({
    //   ios: {
    //     shadowColor: "#000",
    //     shadowOpacity: 0.2,
    //     shadowRadius: 8,
    //     shadowOffset: { width: 0, height: 4 },
    //   },
    //   android: {
    //     elevation: 6,
    //   },
    //   web: {
    //     boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
    //     backdropFilter: "blur(10px)", // dispo uniquement sur web
    //   },
    // }),
  },

  cardTitle: {
    fontSize: SIZES.text_lg,
    color: COLORS.text,
    fontWeight: "bold",
    textAlign: "center",
    fontFamily: "Montserrat",
  },
  contentText: {
    fontSize: SIZES.text_lg,
    color: COLORS.text,
    fontFamily: "Montserrat",
  },
  link: {
    paddingVertical: SIZES.padding / 2,
  },
  verticallySpaced: {
    paddingVertical: SIZES.padding / 4,
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
    height: 50,
    borderColor: COLORS.primary,
    color: COLORS.text,
    fontFamily: "Montserrat",
    borderRadius: 8,
    paddingHorizontal: SIZES.padding,
    paddingVertical: SIZES.padding / 2,
    backgroundColor: COLORS.tabs,
  },
});
