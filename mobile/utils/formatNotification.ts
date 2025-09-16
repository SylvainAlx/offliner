import { Alert, Platform } from "react-native";
import { Toast } from "toastify-react-native";
import { ToastType } from "toastify-react-native/utils/interfaces";

export function showMessage(
  text: string,
  type: ToastType = "info",
  title: string = "Information",
) {
  if (Platform.OS === "web") {
    alert(text);
  } else {
    Toast.show({
      type,
      text1: title,
      text2: text,
      position: "top",
      visibilityTime: 5000,
      autoHide: true,
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
