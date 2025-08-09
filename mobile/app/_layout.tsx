import { SessionProvider } from "@/contexts/SessionContext";
import { useFonts } from "expo-font";
import { StatusBar } from "react-native";
import AppWithSession from "./AppWithSession";

export default function RootLayout() {
  const [loaded] = useFonts({
    SpaceMono: require("shared/fonts/SpaceMono-Regular.ttf"),
    Knewave: require("shared/fonts/Knewave-Regular.ttf"),
    Montserrat: require("shared/fonts/montserrat-latin-400-normal.ttf"),
  });

  if (!loaded) return null;

  return (
    <SessionProvider>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      <AppWithSession />
    </SessionProvider>
  );
}
