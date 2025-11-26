import { Alert, Platform } from "react-native";
import { Toast } from "toastify-react-native";
import { ToastType } from "toastify-react-native/utils/interfaces";
import * as Notifications from "expo-notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { STORAGE_KEYS } from "@/constants/Labels";

try {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldPlaySound: false,
      shouldShowBanner: true,
      shouldShowList: true,
      shouldSetBadge: false,
    }),
  });
} catch (error) {
  console.warn("Notifications handler setup failed:", error);
}

let channelInitialized = false;
async function ensureAndroidChannel() {
  if (Platform.OS === "android" && !channelInitialized) {
    try {
      await Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.DEFAULT,
      });
      channelInitialized = true;
    } catch (error) {
      console.warn("Failed to set notification channel:", error);
    }
  }
}

export async function showMessage(
  text: string,
  type: ToastType = "info",
  title: string = "Information",
  time: number = 3000,
) {
  if (Platform.OS === "web") {
    alert(text);
  } else {
    const textSafe = (text ?? "").toString().trim();
    const titleSafe = (title ?? "Information").toString().trim();
    if (!textSafe) {
      return;
    }

    const showToast = () => {
      Toast.show({
        type,
        text1: titleSafe,
        text2: textSafe,
        position: "top",
        visibilityTime: time,
        autoHide: true,
      });
    };

    try {
      const pref = await AsyncStorage.getItem(STORAGE_KEYS.PREF_NOTIFICATIONS);
      const enabled = pref ? JSON.parse(pref) : false;
      if (enabled) {
        const { status } = await Notifications.getPermissionsAsync();
        if (status !== "granted") {
          const req = await Notifications.requestPermissionsAsync();
          if (req.status !== "granted") {
            showToast();
            return;
          }
        }
        await ensureAndroidChannel();
        await Notifications.scheduleNotificationAsync({
          content: { title: titleSafe, body: textSafe },
          trigger: null,
        });
      } else {
        showToast();
      }
    } catch (error) {
      console.warn("Notification failed, falling back to toast:", error);
      showToast();
    }
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
