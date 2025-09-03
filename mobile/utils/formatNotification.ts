import { Alert, Platform } from "react-native";
import * as Notifications from "expo-notifications";

export async function showMessage(text: string) {
  if (Platform.OS === "web") {
    alert(text);
  } else {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Info",
        body: text,
      },
      trigger: null, // affichage immédiat
    });
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
      { cancelable: true },
    );
  });
}
