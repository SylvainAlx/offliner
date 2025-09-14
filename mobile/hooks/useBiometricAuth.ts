import { supabase } from "@/utils/supabase";
import { Session } from "@supabase/supabase-js";
import * as LocalAuthentication from "expo-local-authentication";
import * as SecureStore from "expo-secure-store";
import { Alert } from "react-native";

const REFRESH_TOKEN_KEY = "supabase_refresh_token";

export const useBiometricAuth = () => {
  const checkBiometricAvailability = async () => {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    return hasHardware && isEnrolled;
  };

  const saveRefreshToken = async (refreshToken: string) => {
    await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);
  };

  // ✅ Nouvelle fonction centralisée
  const saveSession = async (session: Session | null) => {
    if (session?.refresh_token) {
      await saveRefreshToken(session.refresh_token);
    }
  };

  const promptToEnableBiometrics = (onEnabled: () => void) => {
    Alert.alert(
      "Activer la connexion biométrique ?",
      "Souhaitez-vous utiliser votre empreinte digitale ou la reconnaissance faciale pour vous connecter plus rapidement la prochaine fois ?",
      [
        { text: "Non merci", style: "cancel" },
        {
          text: "Activer",
          onPress: onEnabled,
        },
      ],
    );
  };

  const loginWithBiometrics = async () => {
    const isAvailable = await checkBiometricAvailability();
    if (!isAvailable) {
      Alert.alert(
        "Biométrie non disponible",
        "Votre appareil ne supporte pas l'authentification biométrique ou elle n'est pas configurée.",
      );
      return false;
    }

    const refreshToken = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
    if (!refreshToken) {
      return false;
    }

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: "Connectez-vous avec votre biométrie",
    });

    if (result.success) {
      const { data, error } = await supabase.auth.refreshSession({
        refresh_token: refreshToken,
      });

      if (error || !data?.session) {
        Alert.alert(
          "Erreur de connexion",
          "Nous n'avons pas pu vous reconnecter. Veuillez vous connecter manuellement.",
        );
        return false;
      }

      await saveSession(data.session);

      return true;
    }

    return false;
  };

  return {
    checkBiometricAvailability,
    saveSession,
    promptToEnableBiometrics,
    loginWithBiometrics,
  };
};
