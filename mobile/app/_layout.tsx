import { SessionProvider } from "@/contexts/SessionContext";
import { useFonts } from "expo-font";
import { StatusBar, View, Text } from "react-native";
import AppWithSession from "./AppWithSession";
import * as Device from "expo-device";
import { PROJECT } from "shared/config";
import { globalStyles } from "@/styles/global.styles";

export default function RootLayout() {
  const [loaded] = useFonts({
    // SpaceMono: require("shared/fonts/SpaceMono-Regular.ttf"),
    Knewave: require("shared/fonts/Knewave-Regular.ttf"),
    Montserrat: require("shared/fonts/montserrat-latin-400-normal.ttf"),
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
