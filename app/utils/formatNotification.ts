import { Alert, Platform } from "react-native";

export function showMessage(text: string) {
  if (Platform.OS === "web") {
    alert(text);
  } else {
    Alert.alert("Info", text);
  }
}

export async function confirmDialog(message: string): Promise<boolean> {
  if (Platform.OS === "web") {
    // Web : prompt synchrone
    return Promise.resolve(window.confirm(message));
  }

  // Mobile : on crée une promesse qui sera résolue par Alert
  return new Promise((resolve) => {
    Alert.alert(
      "Confirmation",
      message,
      [
        {
          text: "Annuler",
          style: "cancel",
          onPress: () => resolve(false),
        },
        {
          text: "Confirmer",
          onPress: () => resolve(true),
        },
      ],
      { cancelable: true }
    );
  });
}
