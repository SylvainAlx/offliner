import { OfflineProgressProvider } from "@/contexts/OfflineProgressContext";
import { useSession } from "@/contexts/SessionContext";
import { useSyncSession } from "@/hooks/useSyncSession";
import { Stack } from "expo-router";
import { useState, useEffect } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  Pressable,
  Linking,
} from "react-native";
import { checkMobileVersion } from "@/api/config";
import { PROJECT } from "shared/config";
import { globalStyles } from "@/styles/global.styles";
import { COLORS, SIZES } from "shared/theme";

export default function AppWithSession() {
  const { session } = useSession();
  const [versionStatus, setVersionStatus] = useState("checking");

  useSyncSession(session);

  useEffect(() => {
    const verifyVersion = async () => {
      const isValid = await checkMobileVersion();
      setVersionStatus(isValid);
    };
    verifyVersion();
  }, []); // Rerun check if session changes

  if (versionStatus === "checking") {
    return (
      <View
        style={[
          globalStyles.container,
          { flex: 1, justifyContent: "center", alignItems: "center" },
        ]}
      >
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={globalStyles.contentText}>
          Vérification de mise à jour...
        </Text>
      </View>
    );
  }

  if (versionStatus === "error") {
    return (
      <View
        style={[
          globalStyles.container,
          { flex: 1, justifyContent: "center", alignItems: "center" },
        ]}
      >
        <Text style={globalStyles.title}>Vérification impossible</Text>
        <Text style={globalStyles.contentText}>
          La vérification de mise à jour n&apos;a pas pu aboutir, merci de
          redémarrer {PROJECT.TITLE} avec la connexion internet activée.
        </Text>
      </View>
    );
  }

  if (versionStatus === "invalid") {
    return (
      <View
        style={[
          globalStyles.container,
          { flex: 1, justifyContent: "center", alignItems: "center" },
        ]}
      >
        <Text style={globalStyles.title}>Mise à jour requise</Text>
        <Text style={globalStyles.contentText}>
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
          <Text
            style={[
              globalStyles.button,
              { color: COLORS.primary, fontSize: SIZES.text_lg },
            ]}
          >
            {process.env.EXPO_PUBLIC_WEBSITE_URL}
          </Text>
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
