import {
  OfflineProgressProvider,
  useOfflineProgress,
} from "@/contexts/OfflineProgressContext";
import { useSession } from "@/contexts/SessionContext";
import { useSyncSession } from "@/hooks/useSyncSession";
import { Stack } from "expo-router";
import { useState, useEffect } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  Pressable,
  Linking,
} from "react-native";
import { checkMobileVersion } from "@/api/config";
import { PROJECT } from "shared/config";

export default function AppWithSession() {
  const { session } = useSession();
  const { isOnline } = useOfflineProgress();
  const [versionStatus, setVersionStatus] = useState<
    "checking" | "valid" | "invalid"
  >("checking");

  useSyncSession(session);

  useEffect(() => {
    const verifyVersion = async () => {
      const isValid = await checkMobileVersion();
      setVersionStatus(isValid ? "valid" : "invalid");
    };
    verifyVersion();
  }, []); // Rerun check if session changes

  if (versionStatus === "checking") {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text style={styles.message}>Vérification de mise à jour...</Text>
      </View>
    );
  }

  if (versionStatus === "invalid" && isOnline) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Mise à jour requise</Text>
        <Text style={styles.message}>
          Une nouvelle version de {PROJECT.TITLE} est disponible. Veuillez la
          télécharger depuis le site officiel :
        </Text>
        <Pressable
          onPress={() =>
            Linking.openURL(process.env.EXPO_PUBLIC_WEBSITE_URL || "")
          }
          hitSlop={8}
          accessibilityLabel="Ouvrir la page externe"
        >
          <Text>{process.env.EXPO_PUBLIC_WEBSITE_URL}</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <OfflineProgressProvider>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" />
      </Stack>
    </OfflineProgressProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 12,
  },
  message: {
    fontSize: 16,
    textAlign: "center",
  },
});
