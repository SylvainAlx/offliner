import React from "react";
import { Linking, StyleSheet, View } from "react-native";
import { Button, Text } from "react-native-paper";
import { DONATION } from "shared/config";
import { COLORS, SIZES } from "shared/theme";
import { MaterialCommunityIcons } from "@expo/vector-icons";

export const PayPalButton = () => {
  const handlePress = async () => {
    const supported = await Linking.canOpenURL(DONATION.PAYPAL_URL);

    if (supported) {
      await Linking.openURL(DONATION.PAYPAL_URL);
    } else {
      console.error("Don't know how to open this URL: " + DONATION.PAYPAL_URL);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.description}>
        Si vous aimez l'application, vous pouvez soutenir son développement avec
        un don.
      </Text>
      <Button
        mode="contained"
        onPress={handlePress}
        style={styles.button}
        contentStyle={styles.buttonContent}
        icon={({ size, color }) => (
          <MaterialCommunityIcons name="heart" size={size} color={color} />
        )}
      >
        Faire un don via PayPal
      </Button>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: SIZES.padding,
    backgroundColor: COLORS.card,
    borderRadius: SIZES.radius,
    marginVertical: SIZES.margin,
    alignItems: "center",
  },
  description: {
    color: COLORS.text,
    marginBottom: SIZES.margin,
    textAlign: "center",
    fontSize: 14,
  },
  button: {
    backgroundColor: "#0070BA", // PayPal Blue
    width: "100%",
  },
  buttonContent: {
    paddingVertical: 4,
  },
});
