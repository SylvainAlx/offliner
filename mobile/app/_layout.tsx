import * as Device from "expo-device";
import { useFonts } from "expo-font";
import { StatusBar, Text,View } from "react-native";
import { PROJECT } from "shared/config";

import { SessionProvider } from "@/contexts/SessionContext";
import { globalStyles } from "@/styles/global.styles";

import AppWithSession from "./AppWithSession";

export default function RootLayout() {
  const [loaded] = useFonts({
    Montserrat: require("shared/fonts/montserrat-latin-400-normal.ttf"),
    SairaStencilOne: require("shared/fonts/SairaStencilOne-Regular.ttf"),
  });

  if (!loaded) return null;

  const deviceType = Device.deviceType;

  if (deviceType === Device.DeviceType.PHONE) {
    return (
      <SessionProvider>
        <StatusBar barStyle="light-content" backgroundColor="#000" />
        <AppWithSession />
      </SessionProvider>
    );
  } else {
    return (
      <View
        style={[
          globalStyles.container,
          {
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            padding: 16,
          },
        ]}
      >
        <Text style={[globalStyles.title, { maxWidth: "80%" }]}>
          Problème de compatibilité
        </Text>
        <Text style={globalStyles.contentText}>
          Seuls les smartphones peuvent utiliser {PROJECT.TITLE}, désolé !
        </Text>
      </View>
    );
  }
}
