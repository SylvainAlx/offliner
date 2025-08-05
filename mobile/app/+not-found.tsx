import { Text, View } from "react-native";
import { Link, Stack } from "expo-router";
import { globalStyles } from "@/styles/global.styles";

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: "Oops!" }} />
      <View style={globalStyles.container}>
        <Text style={globalStyles.title}>This screen does not exist.</Text>
        <Link href="/" style={globalStyles.link}>
          <Text style={globalStyles.contentText}>Go to home screen!</Text>
        </Link>
      </View>
    </>
  );
}
